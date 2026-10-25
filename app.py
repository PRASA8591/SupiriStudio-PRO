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
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
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

@app.get("/robots.txt", response_class=PlainTextResponse)
async def serve_robots():
    """Serve robots.txt for search engine crawlers."""
    if os.path.exists("robots.txt"):
        return FileResponse("robots.txt", media_type="text/plain")
    content = "User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://studio.prasatek.lk/sitemap.xml\n"
    return PlainTextResponse(content=content)

@app.get("/sitemap.xml")
async def serve_sitemap():
    """Serve sitemap.xml for Google/Bing search indexing."""
    if os.path.exists("sitemap.xml"):
        return FileResponse("sitemap.xml", media_type="application/xml")
    content = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://studio.prasatek.lk/</loc>
        <lastmod>2026-10-25</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://studio.prasatek.lk/#tab-bg</loc>
        <lastmod>2026-10-25</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>https://studio.prasatek.lk/#tab-eraser</loc>
        <lastmod>2026-10-25</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>https://studio.prasatek.lk/#tab-video</loc>
        <lastmod>2026-10-25</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>https://studio.prasatek.lk/#tab-enhance</loc>
        <lastmod>2026-10-25</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://studio.prasatek.lk/#tab-privacy</loc>
        <lastmod>2026-10-25</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://studio.prasatek.lk/#tab-passport</loc>
        <lastmod>2026-10-25</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
</urlset>"""
    return Response(content=content, media_type="application/xml")

# ==========================================
# TOOL 1: ✂️ DEEP LEARNING AI BACKGROUND REMOVER
# ==========================================
os.environ["U2NET_HOME"] = os.environ.get("U2NET_HOME", os.path.join(tempfile.gettempdir(), ".u2net"))

_REMBG_SESSIONS = {}

def get_rembg_session(model_name: str = "u2netp"):
    """
    RAM-Safe Singleton AI Session for Render 512MB / Cloud / Local.
    Reuses the loaded ONNX session in memory instead of reloading on every request.
    Default 'u2netp' is ultra-lightweight (~4.7 MB, <100 MB RAM).
    """
    global _REMBG_SESSIONS
    if model_name not in _REMBG_SESSIONS:
        try:
            from rembg import new_session
            _REMBG_SESSIONS[model_name] = new_session(model_name)
        except Exception:
            if model_name != "u2netp":
                try:
                    from rembg import new_session
                    _REMBG_SESSIONS[model_name] = new_session("u2netp")
                except Exception:
                    pass
    return _REMBG_SESSIONS.get(model_name)

def ai_remove_bg(
    image_bytes: bytes,
    mode: str = "auto_general",
    scribble_bytes: Optional[bytes] = None
) -> bytes:
    """
    Real Deep Learning AI Segmentation Model using rembg + onnxruntime with resolution preservation.
    Modes:
    1. 'auto_general': Fast, razor-sharp object/product/animal/logo cutout with edge feathering.
    2. 'auto_portrait': Optimized specifically for human hair, faces, and clothing using alpha matting.
    3. 'interactive_scribble': Merges rembg AI probability mask with user's Green ('Keep') & Red ('Remove') strokes.
    """
    orig_pil = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    orig_w, orig_h = orig_pil.size

    # RAM and speed optimization: downscale for inference only if larger than 1600px
    max_dim = 1600
    scale = 1.0
    if max(orig_w, orig_h) > max_dim:
        scale = max_dim / float(max(orig_w, orig_h))
        new_w, new_h = max(int(orig_w * scale), 1), max(int(orig_h * scale), 1)
        infer_pil = orig_pil.resize((new_w, new_h), Image.Resampling.LANCZOS)
    else:
        infer_pil = orig_pil

    from rembg import remove

    if mode == "auto_portrait":
        # Human / Portrait Mode: Try u2net_human_seg or u2netp with alpha matting
        session = get_rembg_session("u2net_human_seg") or get_rembg_session("u2netp")
        try:
            cutout_infer = remove(
                infer_pil,
                session=session,
                post_process_mask=True,
                alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=10
            )
        except Exception:
            cutout_infer = remove(infer_pil, session=get_rembg_session("u2netp"), post_process_mask=True)
    else:
        # Default Auto AI (People & Products)
        session = get_rembg_session("u2netp")
        cutout_infer = remove(infer_pil, session=session, post_process_mask=True)

    # Extract alpha mask from cutout
    alpha_infer = cutout_infer.split()[3]

    # Combine with interactive scribble mask if provided (Green = Keep, Red = Remove)
    if mode == "interactive_scribble" and scribble_bytes:
        try:
            scribble_pil = Image.open(io.BytesIO(scribble_bytes)).convert("RGBA")
            scribble_resized = scribble_pil.resize(infer_pil.size, Image.Resampling.NEAREST)
            sc_arr = np.array(scribble_resized)
            alpha_arr = np.array(alpha_infer)

            # Green strokes: Keep Subject (High G, lower R and B)
            is_green = (sc_arr[:, :, 1] > 120) & (sc_arr[:, :, 0] < 120) & (sc_arr[:, :, 3] > 40)
            # Red strokes: Remove Background (High R, lower G and B)
            is_red = (sc_arr[:, :, 0] > 160) & (sc_arr[:, :, 1] < 120) & (sc_arr[:, :, 3] > 40)

            # Apply user strokes with full priority
            alpha_arr[is_green] = 255
            alpha_arr[is_red] = 0

            # Smooth brush stroke boundaries
            alpha_arr = cv2.GaussianBlur(alpha_arr, (5, 5), 0)
            alpha_infer = Image.fromarray(alpha_arr)
        except Exception:
            pass

    # Upscale alpha mask back to original full HD resolution if scaled
    if scale != 1.0:
        alpha_full = alpha_infer.resize((orig_w, orig_h), Image.Resampling.BILINEAR)
        alpha_full = alpha_full.filter(ImageFilter.GaussianBlur(radius=0.5))
        final_pil = orig_pil.copy()
        final_pil.putalpha(alpha_full)
    else:
        alpha_full = alpha_infer.filter(ImageFilter.GaussianBlur(radius=0.5))
        final_pil = orig_pil.copy()
        final_pil.putalpha(alpha_full)

    # Save to high quality PNG
    out_buf = io.BytesIO()
    final_pil.save(out_buf, format="PNG", optimize=True)
    return out_buf.getvalue()

def smart_opencv_remove_bg(image_bytes: bytes) -> bytes:
    """Fallback GrabCut + LAB Matting algorithm."""
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
    mask[:] = cv2.GC_PR_BGD

    border_w = max(int(sw * 0.05), 3)
    border_h = max(int(sh * 0.05), 3)
    mask[0:border_h, :] = cv2.GC_BGD
    mask[sh - border_h:sh, :] = cv2.GC_BGD
    mask[:, 0:border_w] = cv2.GC_BGD
    mask[:, sw - border_w:sw] = cv2.GC_BGD

    center_x, center_y = sw // 2, sh // 2
    rx, ry = int(sw * 0.40), int(sh * 0.44)
    cv2.ellipse(mask, (center_x, center_y), (rx, ry), 0, 0, 360, cv2.GC_PR_FGD, -1)

    core_rx, core_ry = int(sw * 0.22), int(sh * 0.28)
    cv2.ellipse(mask, (center_x, center_y), (core_rx, core_ry), 0, 0, 360, cv2.GC_FGD, -1)

    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    try:
        cv2.grabCut(small_img, mask, None, bgdModel, fgdModel, 4, cv2.GC_INIT_WITH_MASK)
        mask2 = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype('uint8')
    except Exception:
        margin_x = max(int(sw * 0.04), 2)
        margin_y = max(int(sh * 0.04), 2)
        rect = (margin_x, margin_y, sw - 2 * margin_x, sh - 2 * margin_y)
        mask = np.zeros((sh, sw), np.uint8)
        cv2.grabCut(small_img, mask, rect, bgdModel, fgdModel, 4, cv2.GC_INIT_WITH_RECT)
        mask2 = np.where((mask == 2) | (mask == 0), 0, 255).astype('uint8')

    k_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask2 = cv2.morphologyEx(mask2, cv2.MORPH_CLOSE, k_close)

    if scale != 1.0:
        mask2 = cv2.resize(mask2, (w, h), interpolation=cv2.INTER_LINEAR)

    alpha = cv2.GaussianBlur(mask2, (5, 5), 0)
    b, g, r = cv2.split(img)
    bgra = cv2.merge([b, g, r, alpha])

    success, encoded_png = cv2.imencode(".png", bgra, [cv2.IMWRITE_PNG_COMPRESSION, 4])
    if not success:
        raise ValueError("Failed to encode transparent PNG")
    return encoded_png.tobytes()

@app.post("/api/image/remove-bg")
async def api_remove_bg(
    image: UploadFile = File(...),
    mode: str = Form("auto_general"),
    scribble_mask: Optional[UploadFile] = File(None)
):
    """
    Remove background from image and return transparent HD PNG using real Deep Learning ONNX AI models.
    Supports mode: 'auto_general', 'auto_portrait', 'interactive_scribble'.
    """
    try:
        content = await image.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File exceeds strict 50 MB limit.")

        scribble_content = None
        if scribble_mask:
            scribble_content = await scribble_mask.read()
            if len(scribble_content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail="Scribble mask exceeds strict 50 MB limit.")

        try:
            output_bytes = ai_remove_bg(content, mode=mode, scribble_bytes=scribble_content)
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
# TOOL 2: 🖌️ DEDICATED OBJECT REMOVER & WATERMARK ERASER
# ==========================================
@app.post("/api/image/inpaint")
async def api_inpaint(
    image: UploadFile = File(...),
    mask: UploadFile = File(...),
    mode: str = Form("telea_sharp")  # "telea_sharp", "complex_ns", "skin_blemish", "object_remove", "watermark_erase"
):
    """
    Advanced Inpainting Engine:
    - Dilates user mask by 5px so halo boundary edges never remain
    - Mode 'telea_sharp' / 'watermark_erase': Fast text & logo inpainting with edge sharpening
    - Mode 'complex_ns' / 'object_remove': Multi-scale Navier-Stokes + texture synthesis blend
    - Mode 'skin_blemish': Bilateral frequency-preserving portrait inpaint
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

        # Dilate mask by 5px so halo boundary edges never remain
        kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        dilated_mask = cv2.dilate(bin_mask, kernel_dilate, iterations=1)

        # Mode: Complex NS / Object Remover
        if mode in ["complex_ns", "object_remove"]:
            scale = 0.5
            small_img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            small_mask = cv2.resize(dilated_mask, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_NEAREST)
            small_inpaint = cv2.inpaint(small_img, small_mask, inpaintRadius=6, flags=cv2.INPAINT_NS)
            upscaled = cv2.resize(small_inpaint, (w, h), interpolation=cv2.INTER_LINEAR)

            full_inpaint = cv2.inpaint(img, dilated_mask, inpaintRadius=5, flags=cv2.INPAINT_NS)
            blended = cv2.addWeighted(full_inpaint, 0.70, upscaled, 0.30, 0)

            mask_feathered = cv2.GaussianBlur(dilated_mask, (5, 5), 0)
            mask_3c = cv2.cvtColor(mask_feathered, cv2.COLOR_GRAY2BGR) / 255.0
            result = (blended * mask_3c + img * (1.0 - mask_3c)).astype(np.uint8)

        # Mode: Skin Blemish / Portrait
        elif mode == "skin_blemish":
            inpainted = cv2.inpaint(img, dilated_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
            bilateral = cv2.bilateralFilter(inpainted, d=7, sigmaColor=50, sigmaSpace=50)

            mask_feathered = cv2.GaussianBlur(dilated_mask, (7, 7), 0)
            mask_3c = cv2.cvtColor(mask_feathered, cv2.COLOR_GRAY2BGR) / 255.0
            result = (bilateral * mask_3c + img * (1.0 - mask_3c)).astype(np.uint8)

        # Mode: Fast Telea Sharp / Watermark Erase (Default)
        else:
            inpainted = cv2.inpaint(img, dilated_mask, inpaintRadius=4, flags=cv2.INPAINT_TELEA)

            blurred = cv2.GaussianBlur(inpainted, (0, 0), 2.0)
            sharpened = cv2.addWeighted(inpainted, 1.25, blurred, -0.25, 0)

            mask_feathered = cv2.GaussianBlur(dilated_mask, (5, 5), 0)
            mask_3c = cv2.cvtColor(mask_feathered, cv2.COLOR_GRAY2BGR) / 255.0
            result = (sharpened * mask_3c + img * (1.0 - mask_3c)).astype(np.uint8)

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
# TOOL 3: 🎬 VIDEO WATERMARK, GIF & COMPRESSOR PRO
# ==========================================
@app.post("/api/video/delogo")
@app.post("/api/video/process")
async def api_video_process(
    video: UploadFile = File(...),
    mode: str = Form("erase"), # "erase", "crop", "gif", "compress"
    # Mode A: Blur / Erase parameters
    boxes_json: Optional[str] = Form(None),
    box1_x: Optional[int] = Form(None),
    box1_y: Optional[int] = Form(None),
    box1_w: Optional[int] = Form(None),
    box1_h: Optional[int] = Form(None),
    blur_intensity: int = Form(20),
    # Custom Brand Replacement (Text or PNG Logo)
    overlay_type: str = Form("none"),
    text_watermark: Optional[str] = Form(None),
    text_color: str = Form("#FFFFFF"),
    text_opacity: int = Form(90),
    text_position: str = Form("bottom_right"),
    logo_file: Optional[UploadFile] = File(None),
    # Mode B: Crop parameters
    crop_x: Optional[int] = Form(0),
    crop_y: Optional[int] = Form(0),
    crop_w: Optional[int] = Form(0),
    crop_h: Optional[int] = Form(0),
    # Common video utilities
    remove_outro: bool = Form(False),
    trim_start: Optional[float] = Form(None),
    trim_end: Optional[float] = Form(None),
    mute_audio: bool = Form(False)
):
    """
    Video Watermark, GIF & Compressor Engine:
    - Mode A: Blur / Erase (multi-box delogo, soft gaussian blur, mosaic pixelate, brand replacement)
    - Mode B: Crop Out Watermark (aspect-ratio crop, edge bar trim)
    - Mode C: Video to GIF / Boomerang Maker (high-quality palettegen Lanczos looping GIF)
    - Mode D: WhatsApp Video Compressor (libx264 CRF 28 high-efficiency 50-80% file size reduction)
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

        ffmpeg_bin = get_ffmpeg_binary()
        vw, vh = probe_video_dimensions(ffmpeg_bin, temp_in)
        duration = probe_video_duration(ffmpeg_bin, temp_in)

        # Quick Outro Cutter (Remove last 2 seconds)
        if remove_outro and duration > 3.0:
            effective_end = duration - 2.0
            if trim_end is None or trim_end > effective_end:
                trim_end = effective_end

        # ----------------------------------------------------
        # BRANCH 1: MODE C - VIDEO TO HIGH-QUALITY GIF MAKER
        # ----------------------------------------------------
        if mode == "gif":
            fd_out, temp_out = tempfile.mkstemp(suffix=".gif")
            os.close(fd_out)

            cmd = [ffmpeg_bin, "-y"]
            if trim_start is not None and trim_start >= 0:
                cmd.extend(["-ss", str(trim_start)])
            if trim_end is not None and trim_end > (trim_start or 0):
                cmd.extend(["-to", str(trim_end)])

            cmd.extend([
                "-i", temp_in,
                "-vf", "fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
                "-loop", "0",
                temp_out
            ])

            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
            if proc.returncode != 0:
                error_msg = proc.stderr.decode("utf-8", errors="ignore")[-300:]
                raise HTTPException(status_code=500, detail=f"GIF creation error: {error_msg}")

            remove_temp_files(temp_in)
            temp_in = None

            return FileResponse(
                temp_out,
                media_type="image/gif",
                filename="supiristudio_clip.gif",
                background=BackgroundTask(remove_temp_files, temp_out)
            )

        # ----------------------------------------------------
        # BRANCH 2: MODE D - WHATSAPP VIDEO COMPRESSOR
        # ----------------------------------------------------
        elif mode == "compress":
            fd_out, temp_out = tempfile.mkstemp(suffix=".mp4")
            os.close(fd_out)

            cmd = [ffmpeg_bin, "-y"]
            if trim_start is not None and trim_start >= 0:
                cmd.extend(["-ss", str(trim_start)])
            if trim_end is not None and trim_end > (trim_start or 0):
                cmd.extend(["-to", str(trim_end)])

            cmd.extend([
                "-i", temp_in,
                "-c:v", "libx264",
                "-crf", "28",
                "-preset", "veryfast"
            ])

            if mute_audio:
                cmd.append("-an")
            else:
                cmd.extend(["-c:a", "aac", "-b:a", "96k"])

            cmd.extend(["-movflags", "+faststart", temp_out])

            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=140)
            if proc.returncode != 0:
                error_msg = proc.stderr.decode("utf-8", errors="ignore")[-300:]
                raise HTTPException(status_code=500, detail=f"Video compression error: {error_msg}")

            remove_temp_files(temp_in)
            temp_in = None

            return FileResponse(
                temp_out,
                media_type="video/mp4",
                filename="supiristudio_compressed.mp4",
                background=BackgroundTask(remove_temp_files, temp_out)
            )

        # ----------------------------------------------------
        # BRANCH 3 & 4: WATERMARK BLUR/ERASE vs CROP
        # ----------------------------------------------------
        fd_out, temp_out = tempfile.mkstemp(suffix=".mp4")
        os.close(fd_out)

        # Handle Watermark Replacement: Custom Logo File OR Text Badge
        if overlay_type == "logo" and logo_file:
            logo_bytes = await logo_file.read()
            if len(logo_bytes) > 0 and len(logo_bytes) < MAX_FILE_SIZE:
                temp_badge = process_logo_overlay_image(logo_bytes, opacity=text_opacity)
        elif text_watermark and text_watermark.strip():
            temp_badge = create_text_badge_image(text_watermark.strip(), text_color=text_color, opacity=text_opacity)

        cmd = [ffmpeg_bin, "-y"]

        if trim_start is not None and trim_start >= 0:
            cmd.extend(["-ss", str(trim_start)])
        if trim_end is not None and trim_end > (trim_start or 0):
            cmd.extend(["-to", str(trim_end)])

        cmd.extend(["-i", temp_in])
        if temp_badge:
            cmd.extend(["-i", temp_badge])

        # CROP MODE
        if mode == "crop":
            cx = max(0, min(int(crop_x or 0), vw - 2))
            cy = max(0, min(int(crop_y or 0), vh - 2))
            cw = max(10, min(int(crop_w or vw), vw - cx))
            ch = max(10, min(int(crop_h or vh), vh - cy))

            cw = cw - (cw % 2)
            ch = ch - (ch % 2)

            crop_filter = f"crop={cw}:{ch}:{cx}:{cy}"

            if temp_badge:
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

        # BLUR / ERASE MODE
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
                boxes.append({"x": int(vw * 0.75), "y": 20, "w": int(vw * 0.22), "h": 60, "mode": "delogo"})

            boxes = boxes[:4]
            current_stream = "0:v"
            filter_steps = []
            step_idx = 0
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
                else:
                    filter_steps.append(
                        f"[{current_stream}]delogo=x={bx}:y={by}:w={bw}:h={bh}:show=0{enable_str}[{next_stream}]"
                    )

                current_stream = next_stream
                step_idx += 1

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
# TOOL 4: ✨ AI PHOTO ENHANCER, UPSCALER & COLORIZER STUDIO
# ==========================================
@app.post("/api/image/enhance")
async def api_image_enhance(
    image: UploadFile = File(...),
    preset: str = Form("auto_hd"), # "auto_hd", "cinematic_teal", "portrait_glow", "vivid_pop", "golden_hour", "cyberpunk", "vintage", "bw_contrast", "bw_colorize"
    upscale: bool = Form(False),
    sharpness: float = Form(1.0),
    denoise: bool = Form(True)
):
    """
    AI Photo Enhancer, Detail Upscaler & Color Studio:
    - CLAHE (Contrast Limited Adaptive Histogram Equalization in LAB space)
    - Bilateral Denoising + Unsharp Masking deblur
    - 8 Studio Presets + B&W to Color Vintage Tinting Engine
    """
    try:
        content = await image.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File exceeds strict 50 MB limit.")

        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")

        h, w = img.shape[:2]

        # 1. 2x Super-Resolution Upscale if requested
        if upscale and max(h, w) <= 2500:
            img = cv2.resize(img, (w * 2, h * 2), interpolation=cv2.INTER_LANCZOS4)
            h, w = img.shape[:2]

        # 2. Bilateral Denoising (Preserves sharp edges while removing grain)
        if denoise:
            img = cv2.bilateralFilter(img, d=5, sigmaColor=35, sigmaSpace=35)

        # 3. LAB Contrast Limited Adaptive Histogram Equalization (CLAHE) + Unsharp Mask
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_ch, a_ch, b_ch = cv2.split(lab)

        clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
        l_clahe = clahe.apply(l_ch)

        # Unsharp Masking on Luminance channel
        if sharpness > 0.05:
            blur_l = cv2.GaussianBlur(l_clahe, (0, 0), 2.2)
            l_enhanced = cv2.addWeighted(l_clahe, 1.0 + 0.5 * sharpness, blur_l, -0.5 * sharpness, 0)
        else:
            l_enhanced = l_clahe

        enhanced_lab = cv2.merge([l_enhanced, a_ch, b_ch])
        enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_BGR2LAB)
        enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        # 4. Preset LUT Color Tuning
        # Convert to float for accurate matrix arithmetic
        float_img = enhanced_bgr.astype(np.float32)

        if preset == "cinematic_teal":
            # Teal in shadows, warm golden orange in highlights
            lum = (0.299 * float_img[:, :, 2] + 0.587 * float_img[:, :, 1] + 0.114 * float_img[:, :, 0]) / 255.0
            shadow_mask = np.clip(1.0 - lum * 1.5, 0.0, 1.0)[:, :, np.newaxis]
            high_mask = np.clip((lum - 0.35) * 1.5, 0.0, 1.0)[:, :, np.newaxis]

            # Add Cyan/Teal to shadows (BGR: +B, +G, -R)
            float_img += shadow_mask * np.array([28.0, 12.0, -12.0], dtype=np.float32)
            # Add Orange to highlights (BGR: -B, +G, +R)
            float_img += high_mask * np.array([-18.0, 10.0, 26.0], dtype=np.float32)

        elif preset == "portrait_glow":
            # Soft skin glow & warm tone
            glow = cv2.GaussianBlur(float_img, (0, 0), 6.0)
            float_img = cv2.addWeighted(float_img, 0.78, glow, 0.22, 0)
            float_img[:, :, 2] = np.clip(float_img[:, :, 2] * 1.06 + 4.0, 0, 255) # slight warm red
            float_img[:, :, 0] = np.clip(float_img[:, :, 0] * 0.96, 0, 255) # lower blue

        elif preset == "vivid_pop":
            hsv = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.35, 0, 255) # +35% Saturation
            hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.08, 0, 255) # +8% Vibrance
            float_img = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)

        elif preset == "golden_hour":
            # Warm amber sun cast
            float_img[:, :, 2] = np.clip(float_img[:, :, 2] * 1.18 + 6.0, 0, 255) # Red boost
            float_img[:, :, 1] = np.clip(float_img[:, :, 1] * 1.06 + 2.0, 0, 255) # Green boost
            float_img[:, :, 0] = np.clip(float_img[:, :, 0] * 0.86 - 4.0, 0, 255) # Blue drop

        elif preset == "cyberpunk":
            # High-contrast neon: electric cyan shadows + magenta highlights
            lum = (0.299 * float_img[:, :, 2] + 0.587 * float_img[:, :, 1] + 0.114 * float_img[:, :, 0]) / 255.0
            float_img[:, :, 0] = np.clip(float_img[:, :, 0] + (1.0 - lum) * 35.0 + lum * 25.0, 0, 255) # Cyan/Blue
            float_img[:, :, 1] = np.clip(float_img[:, :, 1] * 0.92, 0, 255)
            float_img[:, :, 2] = np.clip(float_img[:, :, 2] + lum * 42.0 - (1.0 - lum) * 15.0, 0, 255) # Magenta/Pink

        elif preset == "vintage":
            # Faded black floor + sepia tone
            float_img = np.clip(float_img * 0.85 + 24.0, 0, 255)
            float_img[:, :, 2] = np.clip(float_img[:, :, 2] * 1.10, 0, 255)
            float_img[:, :, 0] = np.clip(float_img[:, :, 0] * 0.82, 0, 255)

        elif preset == "bw_contrast":
            # Rich dramatic monochrome with deep blacks and silver highlights
            gray = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2GRAY)
            clahe_bw = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            bw_eq = clahe_bw.apply(gray)
            float_img = cv2.cvtColor(bw_eq, cv2.COLOR_GRAY2BGR).astype(np.float32)

        elif preset == "bw_colorize":
            # Warm Vintage / B&W to Color Tinting Engine
            # Reconstructs natural skin & atmospheric tones based on luminance mapping
            gray = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2GRAY)
            norm_lum = gray.astype(np.float32) / 255.0

            # Color gradient: deep espresso (shadows) -> warm peach skin (midtones) -> golden sky (highlights)
            # Midtone mask peaked around 0.5
            mid_mask = np.exp(-12.0 * ((norm_lum - 0.52) ** 2))[:, :, np.newaxis]
            high_mask = np.clip((norm_lum - 0.6) * 2.5, 0.0, 1.0)[:, :, np.newaxis]
            shadow_mask = np.clip((0.4 - norm_lum) * 2.5, 0.0, 1.0)[:, :, np.newaxis]

            color_base = np.zeros_like(float_img)
            # Shadows: Deep rich dark brown/espresso (B: 45, G: 35, R: 55)
            color_base += shadow_mask * np.array([45.0, 35.0, 60.0], dtype=np.float32)
            # Midtones: Warm natural skin/amber (B: 125, G: 155, R: 215)
            color_base += mid_mask * np.array([125.0, 155.0, 215.0], dtype=np.float32)
            # Highlights: Warm golden ivory (B: 205, G: 235, R: 250)
            color_base += high_mask * np.array([205.0, 235.0, 250.0], dtype=np.float32)

            # Luminance blend: preserve exact original sharpness and shadows
            gray_3c = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR).astype(np.float32)
            float_img = cv2.addWeighted(color_base, 0.55, gray_3c, 0.45, 0)

        final_result = np.clip(float_img, 0, 255).astype(np.uint8)

        success, encoded = cv2.imencode(".png", final_result, [cv2.IMWRITE_PNG_COMPRESSION, 4])
        if not success:
            raise HTTPException(status_code=500, detail="Failed to encode enhanced image.")

        return Response(content=encoded.tobytes(), media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image enhancement failed: {str(e)}")
    finally:
        gc.collect()

# ==========================================
# TOOL 5: 🔒 PRIVACY CENSOR & SOCIAL THUMBNAIL STUDIO
# ==========================================
@app.post("/api/image/detect-faces")
async def api_detect_faces(image: UploadFile = File(...)):
    """Auto-detect human face bounding boxes using OpenCV Haar Cascades."""
    try:
        content = await image.read()
        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        face_cascade = cv2.CascadeClassifier(cascade_path)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))

        boxes = []
        for (x, y, w, h) in faces:
            # Expand box by 10% for full forehead and chin coverage
            pad_w = int(w * 0.1)
            pad_h = int(h * 0.15)
            bx = max(0, int(x - pad_w))
            by = max(0, int(y - pad_h))
            bw = min(img.shape[1] - bx, int(w + 2 * pad_w))
            bh = min(img.shape[0] - by, int(h + 2 * pad_h))
            boxes.append({"x": bx, "y": by, "w": bw, "h": bh})

        return JSONResponse({"faces": boxes, "count": len(boxes)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Face detection failed: {str(e)}")

@app.post("/api/image/censor")
async def api_image_censor(
    image: UploadFile = File(...),
    censor_type: str = Form("blur"), # "blur", "pixelate", "black_bar", "emoji"
    blur_amount: int = Form(25),
    boxes_json: Optional[str] = Form(None),
    emoji_type: str = Form("sunglasses")
):
    """
    Privacy Censor Engine:
    - Blur, Pixelate Mosaic, Redacted Black Bar, or Privacy Emoji overlay over faces and license plates
    """
    try:
        content = await image.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File exceeds strict 50 MB limit.")

        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file.")

        ih, iw = img.shape[:2]

        boxes = []
        if boxes_json:
            try:
                parsed = json.loads(boxes_json)
                if isinstance(parsed, list):
                    boxes = parsed
            except Exception:
                pass

        # If no boxes provided, run auto-detection
        if not boxes:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
            face_cascade = cv2.CascadeClassifier(cascade_path)
            detected = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
            for (x, y, w, h) in detected:
                boxes.append({"x": int(x), "y": int(y), "w": int(w), "h": int(h)})

        # Convert to PIL for easy emoji / text rendering if needed
        pil_img = None
        if censor_type == "emoji" or censor_type == "black_bar":
            pil_img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            draw = ImageDraw.Draw(pil_img)

        for b in boxes:
            bx = max(0, min(int(b.get("x", 0)), iw - 2))
            by = max(0, min(int(b.get("y", 0)), ih - 2))
            bw = max(2, min(int(b.get("w", 10)), iw - bx))
            bh = max(2, min(int(b.get("h", 10)), ih - by))

            if censor_type == "blur":
                ksize = max(5, int(blur_amount) * 2 + 1)
                roi = img[by:by + bh, bx:bx + bw]
                blurred_roi = cv2.GaussianBlur(roi, (ksize, ksize), 0)
                img[by:by + bh, bx:bx + bw] = blurred_roi

            elif censor_type == "pixelate":
                div = max(3, int(blur_amount) // 2)
                p_w = max(2, bw // div)
                p_h = max(2, bh // div)
                roi = img[by:by + bh, bx:bx + bw]
                small = cv2.resize(roi, (p_w, p_h), interpolation=cv2.INTER_NEAREST)
                mosaic = cv2.resize(small, (bw, bh), interpolation=cv2.INTER_NEAREST)
                img[by:by + bh, bx:bx + bw] = mosaic

            elif censor_type == "black_bar":
                # Dark slate redacted bar with neon cyan border and "CENSORED" text
                draw.rounded_rectangle(
                    [bx, by, bx + bw, by + bh],
                    radius=max(4, min(12, bh // 4)),
                    fill=(11, 17, 32, 240),
                    outline=(6, 182, 212, 220),
                    width=2
                )
                text_label = "CENSORED"
                draw.text((bx + bw // 2 - 28, by + bh // 2 - 7), text_label, fill=(244, 63, 94))

            elif censor_type == "emoji":
                # Clean circular privacy badge with sunglasses / emoji
                center_x = bx + bw // 2
                center_y = by + bh // 2
                radius = max(bw, bh) // 2
                draw.ellipse(
                    [center_x - radius, center_y - radius, center_x + radius, center_y + radius],
                    fill=(15, 23, 42),
                    outline=(16, 185, 129),
                    width=3
                )
                # Draw dark sunglasses shape
                glass_w = int(radius * 0.6)
                glass_h = int(radius * 0.4)
                draw.rounded_rectangle(
                    [center_x - radius // 2 - glass_w // 2, center_y - glass_h // 2, center_x - radius // 2 + glass_w // 2, center_y + glass_h // 2],
                    radius=4, fill=(6, 182, 212)
                )
                draw.rounded_rectangle(
                    [center_x + radius // 2 - glass_w // 2, center_y - glass_h // 2, center_x + radius // 2 + glass_w // 2, center_y + glass_h // 2],
                    radius=4, fill=(6, 182, 212)
                )
                draw.line([(center_x - radius // 2, center_y), (center_x + radius // 2, center_y)], fill=(16, 185, 129), width=2)

        if pil_img is not None:
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        success, encoded = cv2.imencode(".png", img, [cv2.IMWRITE_PNG_COMPRESSION, 4])
        if not success:
            raise HTTPException(status_code=500, detail="Failed to encode censored image.")

        return Response(content=encoded.tobytes(), media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image censorship failed: {str(e)}")
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
