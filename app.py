import os
import gc
import io
import json
import shutil
import tempfile
import subprocess
from typing import Optional, List

import numpy as np
import cv2
from PIL import Image, ImageOps, ImageEnhance, ImageDraw, ImageFilter
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
    version="2.1.0",
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
        import re
        match = re.search(r",\s*(\d{2,5})x(\d{2,5})", result.stderr)
        if match:
            width = int(match.group(1))
            height = int(match.group(2))
    except Exception:
        pass
    return width, height

def probe_video_duration(ffmpeg_bin: str, video_path: str) -> float:
    """Probe video duration in seconds using ffmpeg."""
    try:
        cmd = [ffmpeg_bin, "-i", video_path]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
        import re
        match = re.search(r"Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})", result.stderr)
        if match:
            h = int(match.group(1))
            m = int(match.group(2))
            s = int(match.group(3))
            cs = int(match.group(4))
            return h * 3600.0 + m * 60.0 + s + (cs / 100.0)
    except Exception:
        pass
    return 0.0

def create_text_badge_image(text: str, text_color: str = "#FFFFFF", opacity: int = 90) -> str:
    """Generate a clean semi-transparent PNG text pill badge using PIL for reliable cross-platform overlay."""
    font_size = 28
    pad_x = 24
    pad_y = 12
    char_len = max(len(text), 1)
    badge_w = int(char_len * (font_size * 0.65) + pad_x * 2)
    badge_h = int(font_size + pad_y * 2)

    img = Image.new("RGBA", (badge_w, badge_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    alpha_norm = max(0.2, min(opacity / 100.0, 1.0))
    alpha_bg = int(220 * alpha_norm)
    alpha_border = int(240 * alpha_norm)
    alpha_text = int(255 * alpha_norm)

    # Parse hex color
    r, g, b = 255, 255, 255
    if text_color and text_color.startswith("#") and len(text_color) == 7:
        try:
            r = int(text_color[1:3], 16)
            g = int(text_color[3:5], 16)
            b = int(text_color[5:7], 16)
        except Exception:
            pass

    # Semi-transparent dark slate rounded pill with cyan outline
    draw.rounded_rectangle(
        [0, 0, badge_w - 1, badge_h - 1],
        radius=badge_h // 2,
        fill=(15, 23, 42, alpha_bg),
        outline=(6, 182, 212, alpha_border),
        width=2
    )
    # Centered text
    draw.text((pad_x, pad_y - 2), text, fill=(r, g, b, alpha_text))

    fd, path = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    img.save(path, format="PNG")
    return path

def process_logo_overlay_image(content: bytes, opacity: int = 90) -> str:
    """Prepare uploaded PNG/JPEG/WEBP logo image for video overlay with aspect-ratio preservation and opacity."""
    img = Image.open(io.BytesIO(content)).convert("RGBA")
    max_w, max_h = 240, 90
    img.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    if opacity < 100:
        alpha = img.split()[3]
        alpha = ImageEnhance.Brightness(alpha).enhance(max(0.1, opacity / 100.0))
        img.putalpha(alpha)

    fd, path = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    img.save(path, format="PNG")
    return path


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
        "engine": "active",
        "version": "2.1.0"
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

    margin_x = max(int(sw * 0.05), 2)
    margin_y = max(int(sh * 0.05), 2)
    rect = (margin_x, margin_y, sw - 2 * margin_x, sh - 2 * margin_y)

    cv2.grabCut(small_img, mask, rect, bgdModel, fgdModel, 4, cv2.GC_INIT_WITH_RECT)
    mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')

    if scale != 1.0:
        mask2 = cv2.resize(mask2, (w, h), interpolation=cv2.INTER_LINEAR)

    alpha = (mask2 * 255).astype(np.uint8)
    alpha = cv2.GaussianBlur(alpha, (5, 5), 0)

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

        output_bytes = None
        try:
            import rembg
            output_bytes = rembg.remove(content)
        except Exception:
            output_bytes = smart_opencv_remove_bg(content)

        return Response(content=output_bytes, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")
    finally:
        gc.collect()

# ==========================================
# TOOL 2: 🖌️ IMAGE WATERMARK ERASER (3 ADVANCED MODES)
# ==========================================
@app.post("/api/image/inpaint")
async def api_inpaint(
    image: UploadFile = File(...),
    mask: UploadFile = File(...),
    mode: str = Form("telea_sharp")  # "telea_sharp", "complex_ns", "skin_blemish"
):
    """
    Advanced Inpainting Engine with 3 algorithms:
    1. telea_sharp: Fast text & logo inpainting with edge sharpness recovery
    2. complex_ns: Navier-Stokes multi-scale blending for complex textures & large objects
    3. skin_blemish: Bilateral frequency-preserving inpaint for portraits & smooth surfaces
    """
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
            mask_pil = Image.open(io.BytesIO(mask_bytes)).convert("L")
            mask_cv = np.array(mask_pil)

        h, w = img.shape[:2]
        if mask_cv.shape[:2] != (h, w):
            mask_cv = cv2.resize(mask_cv, (w, h), interpolation=cv2.INTER_NEAREST)

        _, bin_mask = cv2.threshold(mask_cv, 20, 255, cv2.THRESH_BINARY)

        # Mode 1: Fast Text & Logo (Telea Sharp)
        if mode == "telea_sharp":
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            dilated_mask = cv2.dilate(bin_mask, kernel, iterations=1)
            inpainted = cv2.inpaint(img, dilated_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)

            blurred = cv2.GaussianBlur(inpainted, (0, 0), 2.0)
            sharpened = cv2.addWeighted(inpainted, 1.25, blurred, -0.25, 0)

            mask_3c = cv2.cvtColor(dilated_mask, cv2.COLOR_GRAY2BGR) / 255.0
            result = (sharpened * mask_3c + img * (1.0 - mask_3c)).astype(np.uint8)

        # Mode 2: Complex Texture (Navier-Stokes + Multi-Scale Blend)
        elif mode == "complex_ns":
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            dilated_mask = cv2.dilate(bin_mask, kernel, iterations=1)

            scale = 0.5
            small_img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            small_mask = cv2.resize(dilated_mask, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_NEAREST)
            small_inpaint = cv2.inpaint(small_img, small_mask, inpaintRadius=5, flags=cv2.INPAINT_NS)
            upscaled = cv2.resize(small_inpaint, (w, h), interpolation=cv2.INTER_LINEAR)

            full_inpaint = cv2.inpaint(img, dilated_mask, inpaintRadius=5, flags=cv2.INPAINT_NS)
            blended = cv2.addWeighted(full_inpaint, 0.7, upscaled, 0.3, 0)

            mask_feathered = cv2.GaussianBlur(dilated_mask, (5, 5), 0)
            mask_3c = cv2.cvtColor(mask_feathered, cv2.COLOR_GRAY2BGR) / 255.0
            result = (blended * mask_3c + img * (1.0 - mask_3c)).astype(np.uint8)

        # Mode 3: Portrait / Skin Blemish
        else:
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            dilated_mask = cv2.dilate(bin_mask, kernel, iterations=1)
            inpainted = cv2.inpaint(img, dilated_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)

            bilateral = cv2.bilateralFilter(inpainted, d=7, sigmaColor=50, sigmaSpace=50)

            mask_feathered = cv2.GaussianBlur(dilated_mask, (7, 7), 0)
            mask_3c = cv2.cvtColor(mask_feathered, cv2.COLOR_GRAY2BGR) / 255.0
            result = (bilateral * mask_3c + img * (1.0 - mask_3c)).astype(np.uint8)

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
# TOOL 3: 🎬 VIDEO WATERMARK STUDIO (BLUR/ERASE vs CROP MODE)
# ==========================================
@app.post("/api/video/delogo")
@app.post("/api/video/process")
async def api_video_process(
    video: UploadFile = File(...),
    mode: str = Form("erase"), # "erase" (Mode A) or "crop" (Mode B)
    # Mode A: Blur / Erase parameters
    boxes_json: Optional[str] = Form(None),
    box1_x: Optional[int] = Form(None),
    box1_y: Optional[int] = Form(None),
    box1_w: Optional[int] = Form(None),
    box1_h: Optional[int] = Form(None),
    blur_intensity: int = Form(20), # 1 to 50
    # Custom Brand Replacement (Text or PNG Logo)
    overlay_type: str = Form("none"), # "none", "text", "logo"
    text_watermark: Optional[str] = Form(None),
    text_color: str = Form("#FFFFFF"),
    text_opacity: int = Form(90), # 20 to 100
    text_position: str = Form("bottom_right"), # "bottom_right", "bottom_left", "top_right", "top_left", "box1"
    logo_file: Optional[UploadFile] = File(None),
    # Mode B: Crop parameters
    crop_x: Optional[int] = Form(0),
    crop_y: Optional[int] = Form(0),
    crop_w: Optional[int] = Form(0),
    crop_h: Optional[int] = Form(0),
    # Common video utilities
    remove_outro: bool = Form(False), # Quick Outro Cutter (removes last 2 seconds)
    trim_start: Optional[float] = Form(None),
    trim_end: Optional[float] = Form(None),
    mute_audio: bool = Form(False)
):
    """
    Video Watermark Studio Pro Engine:
    - Mode A: Blur / Erase (multi-box delogo, soft gaussian blur, mosaic pixelate, optional custom text replacement)
    - Mode B: Crop Out Watermark (aspect-ratio crop, edge bar trim)
    - Quick Outro Cutter (CapCut/TikTok end screen trim) & Audio Muting
    """
    temp_in = None
    temp_out = None
    temp_badge = None
    try:
        content = await video.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="Video exceeds strict 50 MB limit.")

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
        duration = probe_video_duration(ffmpeg_bin, temp_in)

        # Handle Quick Outro Cutter (Remove last 2 seconds)
        if remove_outro and duration > 3.0:
            effective_end = duration - 2.0
            if trim_end is None or trim_end > effective_end:
                trim_end = effective_end

        # Handle Watermark Replacement: Custom Logo File OR Text Badge
        if overlay_type == "logo" and logo_file:
            logo_bytes = await logo_file.read()
            if len(logo_bytes) > 0 and len(logo_bytes) < MAX_FILE_SIZE:
                temp_badge = process_logo_overlay_image(logo_bytes, opacity=text_opacity)
        elif text_watermark and text_watermark.strip():
            temp_badge = create_text_badge_image(text_watermark.strip(), text_color=text_color, opacity=text_opacity)

        cmd = [ffmpeg_bin, "-y"]

        # Trimming flags before input
        if trim_start is not None and trim_start >= 0:
            cmd.extend(["-ss", str(trim_start)])
        if trim_end is not None and trim_end > (trim_start or 0):
            cmd.extend(["-to", str(trim_end)])

        cmd.extend(["-i", temp_in])

        # If custom text badge is present, add as second input
        if temp_badge:
            cmd.extend(["-i", temp_badge])

        # ----------------------------------------------------
        # BRANCH 1: MODE B - CROP OUT WATERMARK
        # ----------------------------------------------------
        if mode == "crop":
            cx = max(0, min(int(crop_x or 0), vw - 2))
            cy = max(0, min(int(crop_y or 0), vh - 2))
            cw = max(10, min(int(crop_w or vw), vw - cx))
            ch = max(10, min(int(crop_h or vh), vh - cy))

            # Ensure even dimensions for libx264
            cw = cw - (cw % 2)
            ch = ch - (ch % 2)

            crop_filter = f"crop={cw}:{ch}:{cx}:{cy}"

            if temp_badge:
                # Chain overlay over cropped video
                pos_expr = "W-w-20:H-h-20"
                if text_position == "bottom_left": pos_expr = "20:H-h-20"
                elif text_position == "top_right": pos_expr = "W-w-20:20"
                elif text_position == "top_left": pos_expr = "20:20"

                complex_filter = f"[0:v]{crop_filter}[v_crop];[v_crop][1:v]overlay={pos_expr}[v_out]"
                cmd.extend(["-filter_complex", complex_filter, "-map", "[v_out]"])
            else:
                cmd.extend(["-vf", crop_filter])

            if not mute_audio:
                cmd.extend(["-map", "0:a?"])

        # ----------------------------------------------------
        # BRANCH 2: MODE A - BLUR / ERASE WATERMARK
        # ----------------------------------------------------
        else:
            boxes = []
            if boxes_json:
                try:
                    parsed = json.loads(boxes_json)
                    if isinstance(parsed, list):
                        boxes = parsed
                except Exception:
                    pass

            if not boxes and box1_x is not None and box1_y is not None and box1_w and box1_h:
                boxes.append({"x": box1_x, "y": box1_y, "w": box1_w, "h": box1_h, "mode": "delogo"})

            if not boxes:
                # Default safety box if none selected
                boxes.append({"x": int(vw * 0.75), "y": 20, "w": int(vw * 0.22), "h": 60, "mode": "delogo"})

            boxes = boxes[:4]
            current_stream = "0:v"
            filter_steps = []
            step_idx = 0

            # Safe clamped intensity
            safe_blur = max(3, min(int(blur_intensity or 20), 50))

            for b in boxes:
                bx = max(0, min(int(b.get("x", 0)), vw - 2))
                by = max(0, min(int(b.get("y", 0)), vh - 2))
                bw = max(2, min(int(b.get("w", 10)), vw - bx))
                bh = max(2, min(int(b.get("h", 10)), vh - by))
                bmode = b.get("mode", "delogo")

                t_start = b.get("start")
                t_end = b.get("end")
                enable_str = ""
                if t_start is not None and t_end is not None and float(t_end) > float(t_start):
                    enable_str = f":enable='between(t,{float(t_start)},{float(t_end)})'"

                next_stream = f"v{step_idx}"

                if bmode == "blur":
                    filter_steps.append(
                        f"[{current_stream}]split=2[base{step_idx}][crop_in{step_idx}];"
                        f"[crop_in{step_idx}]crop={bw}:{bh}:{bx}:{by},boxblur={safe_blur}:5[blurred{step_idx}];"
                        f"[base{step_idx}][blurred{step_idx}]overlay={bx}:{by}{enable_str}[{next_stream}]"
                    )
                elif bmode == "pixelate":
                    pixel_div = max(2, safe_blur // 3)
                    p_w = max(2, bw // pixel_div)
                    p_h = max(2, bh // pixel_div)
                    filter_steps.append(
                        f"[{current_stream}]split=2[base{step_idx}][crop_in{step_idx}];"
                        f"[crop_in{step_idx}]crop={bw}:{bh}:{bx}:{by},scale={p_w}:{p_h}:flags=neighbor,scale={bw}:{bh}:flags=neighbor[mosaic{step_idx}];"
                        f"[base{step_idx}][mosaic{step_idx}]overlay={bx}:{by}{enable_str}[{next_stream}]"
                    )
                else: # delogo
                    filter_steps.append(
                        f"[{current_stream}]delogo=x={bx}:y={by}:w={bw}:h={bh}:show=0{enable_str}[{next_stream}]"
                    )

                current_stream = next_stream
                step_idx += 1

            # Append text watermark badge overlay if requested
            if temp_badge:
                pos_expr = "W-w-20:H-h-20"
                if text_position == "bottom_left": pos_expr = "20:H-h-20"
                elif text_position == "top_right": pos_expr = "W-w-20:20"
                elif text_position == "top_left": pos_expr = "20:20"
                elif text_position == "box1" and boxes:
                    pos_expr = f"{boxes[0].get('x', 20)}:{boxes[0].get('y', 20)}"

                filter_steps.append(f"[{current_stream}][1:v]overlay={pos_expr}[v_final]")
                current_stream = "v_final"

            full_filter = ";".join(filter_steps)
            cmd.extend(["-filter_complex", full_filter, "-map", f"[{current_stream}]"])
            if not mute_audio:
                cmd.extend(["-map", "0:a?"])

        # Encoding settings
        cmd.extend([
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-crf", "22"
        ])

        if mute_audio:
            cmd.append("-an")
        else:
            cmd.extend(["-c:a", "copy"])

        cmd.extend(["-movflags", "+faststart", temp_out])

        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=140)
        if proc.returncode != 0:
            error_msg = proc.stderr.decode("utf-8", errors="ignore")[-400:]
            raise HTTPException(status_code=500, detail=f"FFmpeg processing error: {error_msg}")

        if not os.path.exists(temp_out) or os.path.getsize(temp_out) == 0:
            raise HTTPException(status_code=500, detail="Delogo produced empty output.")

        # Cleanup inputs
        remove_temp_files(temp_in, temp_badge)
        temp_in = None
        temp_badge = None

        return FileResponse(
            temp_out,
            media_type="video/mp4",
            filename="supiristudio_clean_video.mp4",
            background=BackgroundTask(remove_temp_files, temp_out)
        )
    except HTTPException:
        remove_temp_files(temp_in, temp_out, temp_badge)
        raise
    except Exception as e:
        remove_temp_files(temp_in, temp_out, temp_badge)
        raise HTTPException(status_code=500, detail=f"Video processing failed: {str(e)}")
    finally:
        gc.collect()

# ==========================================
# TOOL 4: 🪪 BIOMETRIC ID, PASSPORT & VISA STUDIO PRO
# ==========================================
@app.post("/api/idphoto/generate")
async def api_idphoto_generate(
    image: UploadFile = File(...),
    format_type: str = Form("single"), # "single", "sheet_4x6", "sheet_a4"
    crop_preset: str = Form("sl_passport"), # "sl_passport", "sl_license", "us_visa", "uk_visa", "linkedin_sq"
    bg_color: str = Form("#FFFFFF"), # Hex color or "transparent"
    dpi: int = Form(300),
    brightness: float = Form(1.0), # 0.8 to 1.3
    contrast: float = Form(1.0),   # 0.8 to 1.3
    warmth: float = Form(0.0),     # -0.2 to +0.2
    skin_soft: float = Form(0.0),  # 0.0 to 1.0
    show_guides: bool = Form(True),# Cut/Crop marks
    photo_border: bool = Form(True)# 1px border around each photo
):
    """
    Biometric ID, Passport & Visa Studio Pro:
    - Official Presets: SL Passport/NIC (35x45mm), SL License (25x30mm), US/India Visa (2x2in), UK/EU (35x45mm), LinkedIn HD
    - Studio Portrait Enhancer: Brightness, Contrast, Color Warmth, Soft Skin Retouch
    - Print Sheets: Single HD, 4x6" Sheet (8 Photos), A4 Sheet (24 Photos)
    - 300 DPI high-resolution with optional cutting guides and border lines
    """
    try:
        content = await image.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File exceeds strict 50 MB limit.")

        pil_img = Image.open(io.BytesIO(content)).convert("RGBA")

        # 1. Apply Studio Lighting & Portrait Enhancers
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(pil_img)
            pil_img = enhancer.enhance(brightness)
        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(pil_img)
            pil_img = enhancer.enhance(contrast)

        # Soft Skin Retouch (mild bilateral smoothing on RGB channels)
        if skin_soft > 0.05:
            arr = np.array(pil_img)
            rgb = arr[:, :, :3]
            alpha_ch = arr[:, :, 3]
            sigma = int(skin_soft * 12) + 2
            smoothed_rgb = cv2.bilateralFilter(rgb, d=5, sigmaColor=sigma, sigmaSpace=sigma)
            final_rgb = cv2.addWeighted(smoothed_rgb, min(0.65, skin_soft), rgb, 1.0 - min(0.65, skin_soft), 0)
            arr[:, :, :3] = final_rgb
            pil_img = Image.fromarray(arr)

        # Color Warmth adjustments
        if abs(warmth) > 0.02:
            r, g, b, a = pil_img.split()
            if warmth > 0:
                r = r.point(lambda i: min(255, int(i * (1.0 + warmth * 0.15))))
                b = b.point(lambda i: max(0, int(i * (1.0 - warmth * 0.15))))
            else:
                b = b.point(lambda i: min(255, int(i * (1.0 - warmth * 0.15))))
                r = r.point(lambda i: max(0, int(i * (1.0 + warmth * 0.15))))
            pil_img = Image.merge("RGBA", (r, g, b, a))

        # 2. Determine photo dimensions in pixels at given DPI
        if crop_preset == "sl_passport" or crop_preset == "uk_visa":
            pw = int((35 / 25.4) * dpi) # ~413 px at 300 DPI
            ph = int((45 / 25.4) * dpi) # ~531 px at 300 DPI
        elif crop_preset == "sl_license":
            pw = int((25 / 25.4) * dpi) # ~295 px
            ph = int((30 / 25.4) * dpi) # ~354 px
        elif crop_preset == "us_visa":
            pw = int(2.0 * dpi) # 600 px at 300 DPI
            ph = int(2.0 * dpi) # 600 px at 300 DPI
        elif crop_preset == "linkedin_sq":
            pw = 800
            ph = 800
        else:
            pw = int((35 / 25.4) * dpi)
            ph = int((45 / 25.4) * dpi)

        photo = ImageOps.fit(pil_img, (pw, ph), method=Image.Resampling.LANCZOS)

        if bg_color.lower() != "transparent":
            bg = Image.new("RGBA", (pw, ph), bg_color)
            bg.paste(photo, (0, 0), photo)
            photo = bg

        if photo_border:
            border_draw = ImageDraw.Draw(photo)
            border_draw.rectangle([0, 0, pw - 1, ph - 1], outline="#CBD5E1", width=1)

        if format_type == "single":
            out_buf = io.BytesIO()
            photo.convert("RGB" if bg_color.lower() != "transparent" else "RGBA").save(out_buf, format="PNG", dpi=(dpi, dpi))
            return Response(content=out_buf.getvalue(), media_type="image/png")

        # Sheet Layout Generation
        if format_type == "sheet_a4":
            sheet_w = 2480
            sheet_h = 3508
            cols = 4
            rows = 6 # 24 photos
        else: # "sheet_4x6"
            sheet_w = int(6.0 * dpi) # 1800 px
            sheet_h = int(4.0 * dpi) # 1200 px
            cols = 4
            rows = 2 # 8 photos

        sheet = Image.new("RGB", (sheet_w, sheet_h), "#FFFFFF")

        total_photos_w = cols * pw
        total_photos_h = rows * ph

        scale_factor = min(1.0, (sheet_w * 0.90) / total_photos_w, (sheet_h * 0.90) / total_photos_h)
        if scale_factor < 1.0:
            pw = int(pw * scale_factor)
            ph = int(ph * scale_factor)
            photo = photo.resize((pw, ph), Image.Resampling.LANCZOS)
            total_photos_w = cols * pw
            total_photos_h = rows * ph

        start_x = (sheet_w - total_photos_w) // 2
        start_y = (sheet_h - total_photos_h) // 2

        draw = ImageDraw.Draw(sheet)

        for r in range(rows):
            for c in range(cols):
                px = start_x + c * pw
                py = start_y + r * ph
                sheet.paste(photo.convert("RGB"), (px, py))

                if show_guides:
                    tick_len = 12
                    draw.line([(px, py - 6), (px, py - 6 - tick_len)], fill="#94A3B8", width=1)
                    draw.line([(px - 6, py), (px - 6 - tick_len, py)], fill="#94A3B8", width=1)
                    draw.line([(px + pw, py + ph + 6), (px + pw, py + ph + 6 + tick_len)], fill="#94A3B8", width=1)
                    draw.line([(px + pw + 6, py + ph), (px + pw + 6 + tick_len, py + ph)], fill="#94A3B8", width=1)

        out_buf = io.BytesIO()
        sheet.save(out_buf, format="JPEG", quality=96, dpi=(dpi, dpi))
        return Response(content=out_buf.getvalue(), media_type="image/jpeg")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ID Photo generation failed: {str(e)}")
    finally:
        gc.collect()
