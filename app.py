import os
import gc
import io
import json
import shutil
import tempfile
import subprocess
from typing import Optional

import numpy as np
import cv2
from PIL import Image, ImageOps
import imageio_ffmpeg

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.background import BackgroundTask
from starlette.middleware.base import BaseHTTPMiddleware

# Initialize FastAPI App
app = FastAPI(
    title="SupiriStudio PRO",
    description="Commercial-Grade AI Media Editing Suite powered by PrasaTek System Solutions",
    version="1.0.0",
    docs_url=None,
    redoc_url=None
)

# 50 MB Strict Limit
MAX_FILE_SIZE = 50 * 1024 * 1024

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://studio.prasatek.lk",
        "https://convert.prasatek.lk",
        "http://localhost:7860",
        "http://127.0.0.1:7860",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files & Assets
os.makedirs("assets", exist_ok=True)
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Cleanup helper for BackgroundTasks
def remove_temp_files(*paths):
    for p in paths:
        if p and os.path.exists(p):
            try:
                os.remove(p)
            except Exception:
                pass
    gc.collect()

def get_ffmpeg_binary() -> str:
    """Return path to ffmpeg executable, checking imageio-ffmpeg and system PATH."""
    try:
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.exists(exe):
            return exe
    except Exception:
        pass
    which_ffmpeg = shutil.which("ffmpeg")
    if which_ffmpeg:
        return which_ffmpeg
    return "ffmpeg"

def probe_video_dimensions(ffmpeg_bin: str, video_path: str):
    """Probe video width and height using ffmpeg."""
    width, height = 1280, 720
    try:
        cmd = [ffmpeg_bin, "-i", video_path]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
        # Look for resolution pattern like 1920x1080 in ffmpeg output
        import re
        match = re.search(r",\s*(\d{2,5})x(\d{2,5})", result.stderr)
        if match:
            width = int(match.group(1))
            height = int(match.group(2))
    except Exception:
        pass
    return width, height

# ==========================================
# HEALTH & MONITORING ENDPOINTS
# ==========================================
@app.get("/ping")
@app.get("/api/health")
async def health_check():
    """Anti-sleep health check for uptime monitors & keep-alive pings."""
    return JSONResponse({
        "status": "online",
        "service": "SupiriStudio PRO",
        "brand": "PrasaTek System Solutions",
        "domain": "studio.prasatek.lk",
        "max_upload_mb": 50,
        "engine": "active"
    })

@app.get("/")
async def serve_index():
    """Serve the single page app."""
    if os.path.exists("index.html"):
        return FileResponse("index.html", media_type="text/html")
    raise HTTPException(status_code=404, detail="index.html not found")

# ==========================================
# TOOL 1: ✂️ AI BACKGROUND REMOVER
# ==========================================
def smart_opencv_remove_bg(image_bytes: bytes) -> bytes:
    """High-speed, memory-efficient background removal using OpenCV GrabCut + Edge Feathering."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid image file")

    h, w = img.shape[:2]
    # Downscale for fast GrabCut computation if image is very large
    scale = 1.0
    max_dim = 1000
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        small_img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    else:
        small_img = img

    sh, sw = small_img.shape[:2]
    mask = np.zeros((sh, sw), np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    # Center bounding box rectangle with 5% margin
    margin_x = max(int(sw * 0.05), 2)
    margin_y = max(int(sh * 0.05), 2)
    rect = (margin_x, margin_y, sw - 2 * margin_x, sh - 2 * margin_y)

    cv2.grabCut(small_img, mask, rect, bgdModel, fgdModel, 4, cv2.GC_INIT_WITH_RECT)
    # 0 = Definite BG, 1 = Definite FG, 2 = Probable BG, 3 = Probable FG
    mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')

    # Upscale mask back to original resolution if downscaled
    if scale != 1.0:
        mask2 = cv2.resize(mask2, (w, h), interpolation=cv2.INTER_LINEAR)

    # Edge smoothing & feathering for natural alpha blending
    alpha = (mask2 * 255).astype(np.uint8)
    alpha = cv2.GaussianBlur(alpha, (5, 5), 0)

    # Merge into BGRA
    b, g, r = cv2.split(img)
    bgra = cv2.merge([b, g, r, alpha])

    success, encoded_png = cv2.imencode(".png", bgra, [cv2.IMWRITE_PNG_COMPRESSION, 4])
    if not success:
        raise ValueError("Failed to encode transparent PNG")
    return encoded_png.tobytes()

@app.post("/api/image/remove-bg")
async def api_remove_bg(image: UploadFile = File(...)):
    """Remove background from image and return transparent PNG."""
    try:
        content = await image.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File exceeds strict 50 MB limit.")

        # Attempt rembg if available, otherwise fallback to smart OpenCV GrabCut
        output_bytes = None
        try:
            import rembg
            output_bytes = rembg.remove(content)
        except Exception:
            # OpenCV fallback
            output_bytes = smart_opencv_remove_bg(content)

        return Response(content=output_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")
    finally:
        gc.collect()

# ==========================================
# TOOL 2: 🖌️ IMAGE WATERMARK ERASER (INPAINTING)
# ==========================================
@app.post("/api/image/inpaint")
async def api_inpaint(
    image: UploadFile = File(...),
    mask: UploadFile = File(...)
):
    """Inpaint / erase watermarks using OpenCV Telea & NS blending."""
    try:
        img_bytes = await image.read()
        mask_bytes = await mask.read()

        if len(img_bytes) > MAX_FILE_SIZE or len(mask_bytes) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File exceeds strict 50 MB limit.")

        nparr_img = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr_img, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid source image.")

        nparr_mask = np.frombuffer(mask_bytes, np.uint8)
        mask_cv = cv2.imdecode(nparr_mask, cv2.IMREAD_GRAYSCALE)
        if mask_cv is None:
            # Try reading with PIL in case of RGBA mask
            mask_pil = Image.open(io.BytesIO(mask_bytes)).convert("L")
            mask_cv = np.array(mask_pil)

        h, w = img.shape[:2]
        if mask_cv.shape[:2] != (h, w):
            mask_cv = cv2.resize(mask_cv, (w, h), interpolation=cv2.INTER_NEAREST)

        # Threshold to binary 0 or 255
        _, bin_mask = cv2.threshold(mask_cv, 20, 255, cv2.THRESH_BINARY)

        # Slight dilation to ensure clean watermark edges are covered
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        dilated_mask = cv2.dilate(bin_mask, kernel, iterations=1)

        # Perform dual inpainting and blend for ultra-smooth texture reconstruction
        inpainted_telea = cv2.inpaint(img, dilated_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
        inpainted_ns = cv2.inpaint(img, dilated_mask, inpaintRadius=5, flags=cv2.INPAINT_NS)
        result = cv2.addWeighted(inpainted_telea, 0.6, inpainted_ns, 0.4, 0)

        # Encode as PNG or JPEG matching source
        success, encoded = cv2.imencode(".png", result, [cv2.IMWRITE_PNG_COMPRESSION, 4])
        if not success:
            raise HTTPException(status_code=500, detail="Failed to encode inpainted image.")

        return Response(content=encoded.tobytes(), media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inpainting failed: {str(e)}")
    finally:
        gc.collect()

# ==========================================
# TOOL 3: 🎬 VIDEO WATERMARK REMOVER (FFMPEG DELOGO)
# ==========================================
@app.post("/api/video/delogo")
async def api_video_delogo(
    video: UploadFile = File(...),
    box1_x: int = Form(...),
    box1_y: int = Form(...),
    box1_w: int = Form(...),
    box1_h: int = Form(...),
    box2_x: Optional[int] = Form(None),
    box2_y: Optional[int] = Form(None),
    box2_w: Optional[int] = Form(None),
    box2_h: Optional[int] = Form(None)
):
    """Remove watermark from video using FFmpeg delogo filter with hardware-optimized settings."""
    temp_in = None
    temp_out = None
    try:
        content = await video.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Video exceeds strict 50 MB limit.")

        # Save to temporary input file
        suffix = os.path.splitext(video.filename or ".mp4")[1].lower()
        if not suffix:
            suffix = ".mp4"

        fd_in, temp_in = tempfile.mkstemp(suffix=suffix)
        with os.fdopen(fd_in, "wb") as f:
            f.write(content)

        fd_out, temp_out = tempfile.mkstemp(suffix=".mp4")
        os.close(fd_out)

        ffmpeg_bin = get_ffmpeg_binary()
        vw, vh = probe_video_dimensions(ffmpeg_bin, temp_in)

        # Clamp box1 coordinates inside frame bounds
        b1_x = max(0, min(box1_x, vw - 2))
        b1_y = max(0, min(box1_y, vh - 2))
        b1_w = max(2, min(box1_w, vw - b1_x))
        b1_h = max(2, min(box1_h, vh - b1_y))

        filters = [f"delogo=x={b1_x}:y={b1_y}:w={b1_w}:h={b1_h}:show=0"]

        # If Box 2 is provided and valid, append second delogo filter
        if box2_x is not None and box2_y is not None and box2_w and box2_h and box2_w > 1 and box2_h > 1:
            b2_x = max(0, min(box2_x, vw - 2))
            b2_y = max(0, min(box2_y, vh - 2))
            b2_w = max(2, min(box2_w, vw - b2_x))
            b2_h = max(2, min(box2_h, vh - b2_y))
            filters.append(f"delogo=x={b2_x}:y={b2_y}:w={b2_w}:h={b2_h}:show=0")

        vf_str = ",".join(filters)

        # Run FFmpeg fast preset delogo
        cmd = [
            ffmpeg_bin, "-y",
            "-i", temp_in,
            "-vf", vf_str,
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "22",
            "-c:a", "copy",
            "-movflags", "+faststart",
            temp_out
        ]

        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
        if proc.returncode != 0:
            error_msg = proc.stderr.decode("utf-8", errors="ignore")[-400:]
            raise HTTPException(status_code=500, detail=f"FFmpeg delogo processing error: {error_msg}")

        # Check output file
        if not os.path.exists(temp_out) or os.path.getsize(temp_out) == 0:
            raise HTTPException(status_code=500, detail="Delogo produced empty output.")

        # Cleanup input immediately, schedule output cleanup after response is sent
        remove_temp_files(temp_in)
        temp_in = None

        return FileResponse(
            temp_out,
            media_type="video/mp4",
            filename="supiristudio_clean_video.mp4",
            background=BackgroundTask(remove_temp_files, temp_out)
        )
    except HTTPException:
        if temp_in:
            remove_temp_files(temp_in)
        if temp_out:
            remove_temp_files(temp_out)
        raise
    except Exception as e:
        if temp_in:
            remove_temp_files(temp_in)
        if temp_out:
            remove_temp_files(temp_out)
        raise HTTPException(status_code=500, detail=f"Video delogo failed: {str(e)}")
    finally:
        gc.collect()

# ==========================================
# TOOL 4: 🪪 ID & PASSPORT PHOTO GENERATOR
# ==========================================
@app.post("/api/idphoto/generate")
async def api_idphoto_generate(
    image: UploadFile = File(...),
    format_type: str = Form("single"), # "single" or "sheet"
    crop_preset: str = Form("sl_passport"), # "sl_passport" (35x45mm), "visa_square" (51x51mm), "linkedin_sq"
    bg_color: str = Form("#FFFFFF"), # Hex color or "transparent"
    dpi: int = Form(300)
):
    """Generate high-resolution ID photo or 4x6 inch 8-photo print sheet."""
    try:
        content = await image.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File exceeds strict 50 MB limit.")

        pil_img = Image.open(io.BytesIO(content)).convert("RGBA")
        
        # Determine photo dimensions based on preset at given DPI (standard 300 DPI)
        # 1 inch = 25.4 mm
        if crop_preset == "sl_passport":
            # 35mm x 45mm
            pw = int((35 / 25.4) * dpi) # ~413 px at 300 DPI
            ph = int((45 / 25.4) * dpi) # ~531 px at 300 DPI
        elif crop_preset == "visa_square":
            # 2 inch x 2 inch (51x51 mm)
            pw = int(2.0 * dpi) # 600 px at 300 DPI
            ph = int(2.0 * dpi) # 600 px at 300 DPI
        else: # linkedin_sq or default
            pw = 600
            ph = 600

        # Fit portrait into target aspect ratio with high quality
        photo = ImageOps.fit(pil_img, (pw, ph), method=Image.Resampling.LANCZOS)

        # Composite background color if needed
        if bg_color.lower() != "transparent":
            bg = Image.new("RGBA", (pw, ph), bg_color)
            bg.paste(photo, (0, 0), photo)
            photo = bg

        if format_type == "single":
            out_buf = io.BytesIO()
            photo.convert("RGB" if bg_color.lower() != "transparent" else "RGBA").save(out_buf, format="PNG", dpi=(dpi, dpi))
            return Response(content=out_buf.getvalue(), media_type="image/png")

        # Format is "sheet" (Standard 4x6 inch photo paper = 1800 x 1200 px at 300 DPI)
        sheet_w = int(6.0 * dpi) # 1800 px
        sheet_h = int(4.0 * dpi) # 1200 px
        sheet = Image.new("RGB", (sheet_w, sheet_h), "#FFFFFF")

        # Layout 8 photos (4 columns x 2 rows)
        cols = 4
        rows = 2
        
        # Calculate margins and gaps
        total_photos_w = cols * pw
        total_photos_h = rows * ph
        
        # Scale photo down slightly if it exceeds sheet bounds
        scale_factor = min(1.0, (sheet_w * 0.92) / total_photos_w, (sheet_h * 0.90) / total_photos_h)
        if scale_factor < 1.0:
            pw = int(pw * scale_factor)
            ph = int(ph * scale_factor)
            photo = photo.resize((pw, ph), Image.Resampling.LANCZOS)
            total_photos_w = cols * pw
            total_photos_h = rows * ph

        start_x = (sheet_w - total_photos_w) // 2
        start_y = (sheet_h - total_photos_h) // 2

        from PIL import ImageDraw
        draw = ImageDraw.Draw(sheet)

        # Paste photos and draw subtle crop cutting guides
        for r in range(rows):
            for c in range(cols):
                px = start_x + c * pw
                py = start_y + r * ph
                sheet.paste(photo.convert("RGB"), (px, py))
                
                # Delicate light gray boundary / crop guide
                draw.rectangle([px, py, px + pw - 1, py + ph - 1], outline="#D1D5DB", width=1)

        out_buf = io.BytesIO()
        sheet.save(out_buf, format="JPEG", quality=95, dpi=(dpi, dpi))
        return Response(content=out_buf.getvalue(), media_type="image/jpeg")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ID Photo generation failed: {str(e)}")
    finally:
        gc.collect()
