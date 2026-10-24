/**
 * SupiriStudio PRO — Client-Side Core Engine
 * Powered by PrasaTek System Solutions (https://studio.prasatek.lk)
 */

(function () {
    "use strict";

    // 50 MB Strict Limit (in bytes)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    // ========================================================
    // 1. CLIENT-SIDE CODE PROTECTION & SECURITY
    // ========================================================
    // Disable right-click context menu
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        showToast("Right-click context menu is disabled for security.", "warning");
    });

    // Block DevTools shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
    document.addEventListener("keydown", function (e) {
        if (
            e.key === "F12" ||
            (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
            (e.ctrlKey && (e.key === "U" || e.key === "u"))
        ) {
            e.preventDefault();
            showToast("Developer shortcuts are disabled.", "warning");
        }
    });

    // ========================================================
    // 2. ANTI-SLEEP KEEP-ALIVE (EVERY 4 MINUTES)
    // ========================================================
    function pingHealth() {
        fetch("/api/health")
            .then(res => res.json())
            .catch(() => {});
    }
    // Initial ping and set interval to 4 minutes (240,000 ms)
    pingHealth();
    setInterval(pingHealth, 240000);

    // ========================================================
    // 3. TOAST NOTIFICATION SYSTEM
    // ========================================================
    const toastContainer = document.getElementById("toastContainer");

    function showToast(message, type = "info") {
        if (!toastContainer) return;

        const toast = document.createElement("div");
        toast.className = "pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-xl border transition-all duration-300 transform translate-y-2 opacity-0";

        let icon = "fa-circle-info";
        let colorClass = "bg-slate-900/90 border-slate-700 text-slate-200";

        if (type === "error" || type === "danger") {
            icon = "fa-circle-exclamation text-rose-400";
            colorClass = "bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)]";
        } else if (type === "success") {
            icon = "fa-circle-check text-emerald-400";
            colorClass = "bg-slate-900/95 border-emerald-500/50 text-emerald-200 shadow-glow-emerald";
        } else if (type === "warning") {
            icon = "fa-triangle-exclamation text-amber-400";
            colorClass = "bg-amber-950/90 border-amber-500/50 text-amber-200";
        }

        toast.className += ` ${colorClass}`;
        toast.innerHTML = `
            <i class="fa-solid ${icon} text-lg flex-shrink-0"></i>
            <span class="text-xs font-semibold leading-relaxed">${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove("translate-y-2", "opacity-0");
        });

        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.add("translate-y-2", "opacity-0");
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 4000);
    }

    // ========================================================
    // 4. PROGRESS BAR CONTROLLER
    // ========================================================
    const globalProgressCard = document.getElementById("globalProgressCard");
    const progressTitle = document.getElementById("progressTitle");
    const progressSubtitle = document.getElementById("progressSubtitle");
    const progressPercent = document.getElementById("progressPercent");
    const progressBarFill = document.getElementById("progressBarFill");

    let progressInterval = null;

    function startProgress(title, subtitle) {
        if (!globalProgressCard) return;
        if (progressInterval) clearInterval(progressInterval);

        progressTitle.textContent = title || "AI Engine Processing...";
        progressSubtitle.textContent = subtitle || "Analyzing media frames and computing AI filters";
        progressPercent.textContent = "0%";
        progressBarFill.style.width = "0%";
        globalProgressCard.classList.remove("hidden");

        let current = 0;
        progressInterval = setInterval(() => {
            if (current < 90) {
                current += Math.floor(Math.random() * 8) + 2;
                if (current > 90) current = 90;
                progressPercent.textContent = `${current}%`;
                progressBarFill.style.width = `${current}%`;
            }
        }, 250);
    }

    function completeProgress(onFinished) {
        if (progressInterval) clearInterval(progressInterval);
        progressPercent.textContent = "100%";
        progressBarFill.style.width = "100%";
        progressSubtitle.textContent = "Finalizing high-resolution output...";

        // Trigger confetti celebration
        if (typeof confetti === "function") {
            confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#10b981", "#06b6d4", "#ffffff"]
            });
        }

        setTimeout(() => {
            globalProgressCard.classList.add("hidden");
            if (onFinished) onFinished();
        }, 450);
    }

    function hideProgress() {
        if (progressInterval) clearInterval(progressInterval);
        if (globalProgressCard) globalProgressCard.classList.add("hidden");
    }

    // ========================================================
    // 5. TAB SWITCHING (MOBILE 2x2 BENTO GRID & DESKTOP ROW)
    // ========================================================
    const tabButtons = document.querySelectorAll(".tab-btn");
    const toolPanels = document.querySelectorAll(".tool-panel");

    function switchTab(targetId) {
        tabButtons.forEach(btn => {
            const isTarget = btn.getAttribute("data-target") === targetId;
            if (isTarget) {
                btn.className = "tab-btn active flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-glow-emerald";
            } else {
                btn.className = "tab-btn flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/50";
            }
        });

        toolPanels.forEach(panel => {
            if (panel.id === targetId) {
                panel.classList.remove("hidden");
            } else {
                panel.classList.add("hidden");
            }
        });
    }

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-target");
            switchTab(target);
        });
    });

    // Helper: Format file size
    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return "0 Bytes";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    // ========================================================
    // TOOL 1: ✂️ AI BACKGROUND REMOVER & BACKDROP STUDIO
    // ========================================================
    const bgDropzone = document.getElementById("bgDropzone");
    const bgFileInput = document.getElementById("bgFileInput");
    const bgUploadArea = document.getElementById("bgUploadArea");
    const bgEditorArea = document.getElementById("bgEditorArea");
    const bgCompositeCanvas = document.getElementById("bgCompositeCanvas");
    const bgResetBtn = document.getElementById("bgResetBtn");
    const bgPresetBtns = document.querySelectorAll(".bg-preset-btn");
    const bgCustomColor = document.getElementById("bgCustomColor");
    const bgCustomImageInput = document.getElementById("bgCustomImageInput");
    const bgDownloadBtn = document.getElementById("bgDownloadBtn");
    const bgFileInfo = document.getElementById("bgFileInfo");
    const bgSendToIdBtn = document.getElementById("bgSendToIdBtn");

    let currentCutoutImg = null;
    let currentCutoutBlob = null;
    let currentBgMode = "transparent"; // "transparent", "color", "image"
    let currentBgColor = "#FFFFFF";
    let customBackdropImg = null;

    if (bgDropzone && bgFileInput) {
        bgDropzone.addEventListener("click", () => bgFileInput.click());

        ["dragenter", "dragover"].forEach(eventName => {
            bgDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                bgDropzone.classList.add("border-emerald-500", "bg-slate-900/80");
            });
        });

        ["dragleave", "drop"].forEach(eventName => {
            bgDropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                bgDropzone.classList.remove("border-emerald-500", "bg-slate-900/80");
            });
        });

        bgDropzone.addEventListener("drop", (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleBgFile(e.dataTransfer.files[0]);
            }
        });

        bgFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleBgFile(e.target.files[0]);
            }
        });
    }

    function handleBgFile(file) {
        if (!file.type.startsWith("image/")) {
            showToast("Please select a valid image file (PNG, JPG, or WEBP).", "error");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showToast("File size exceeds strict 50 MB limit. Please select a smaller image.", "error");
            return;
        }

        startProgress("Removing Background with AI...", "Matting edges and isolating subject");

        const formData = new FormData();
        formData.append("image", file);

        fetch("/api/image/remove-bg", {
            method: "POST",
            body: formData
        })
        .then(async (response) => {
            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: "Background removal failed" }));
                throw new Error(err.detail || "Server error");
            }
            return response.blob();
        })
        .then(blob => {
            currentCutoutBlob = blob;
            const imgUrl = URL.createObjectURL(blob);
            currentCutoutImg = new Image();
            currentCutoutImg.onload = () => {
                completeProgress(() => {
                    bgUploadArea.classList.add("hidden");
                    bgEditorArea.classList.remove("hidden");
                    renderBgComposite();
                    if (bgFileInfo) {
                        bgFileInfo.textContent = `HD PNG Cutout • ${currentCutoutImg.naturalWidth} × ${currentCutoutImg.naturalHeight} px • ${formatBytes(blob.size)}`;
                    }
                    showToast("Background removed successfully!", "success");
                });
            };
            currentCutoutImg.src = imgUrl;
        })
        .catch(err => {
            hideProgress();
            showToast(err.message || "Background removal failed.", "error");
        });
    }

    function renderBgComposite() {
        if (!currentCutoutImg || !bgCompositeCanvas) return;
        const ctx = bgCompositeCanvas.getContext("2d");
        const w = currentCutoutImg.naturalWidth;
        const h = currentCutoutImg.naturalHeight;

        bgCompositeCanvas.width = w;
        bgCompositeCanvas.height = h;

        ctx.clearRect(0, 0, w, h);

        if (currentBgMode === "color") {
            ctx.fillStyle = currentBgColor;
            ctx.fillRect(0, 0, w, h);
        } else if (currentBgMode === "image" && customBackdropImg) {
            // Draw image covering the canvas
            const scale = Math.max(w / customBackdropImg.width, h / customBackdropImg.height);
            const sw = customBackdropImg.width * scale;
            const sh = customBackdropImg.height * scale;
            const sx = (w - sw) / 2;
            const sy = (h - sh) / 2;
            ctx.drawImage(customBackdropImg, sx, sy, sw, sh);
        }

        // Draw cutout subject on top
        ctx.drawImage(currentCutoutImg, 0, 0, w, h);
    }

    bgPresetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            bgPresetBtns.forEach(b => b.classList.remove("border-emerald-500", "bg-emerald-500/10", "text-emerald-400"));
            btn.classList.add("border-emerald-500", "bg-emerald-500/10", "text-emerald-400");

            const mode = btn.getAttribute("data-bg-type");
            currentBgMode = mode;
            if (mode === "color") {
                currentBgColor = btn.getAttribute("data-color");
            }
            renderBgComposite();
        });
    });

    if (bgCustomColor) {
        bgCustomColor.addEventListener("input", (e) => {
            currentBgMode = "color";
            currentBgColor = e.target.value;
            renderBgComposite();
        });
    }

    if (bgCustomImageInput) {
        bgCustomImageInput.addEventListener("change", (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (file.size > MAX_FILE_SIZE) {
                showToast("Backdrop image exceeds 50 MB limit.", "error");
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    customBackdropImg = img;
                    currentBgMode = "image";
                    renderBgComposite();
                    showToast("Custom background photo applied!", "success");
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (bgResetBtn) {
        bgResetBtn.addEventListener("click", () => {
            bgEditorArea.classList.add("hidden");
            bgUploadArea.classList.remove("hidden");
            if (bgFileInput) bgFileInput.value = "";
            currentCutoutImg = null;
            currentCutoutBlob = null;
        });
    }

    if (bgDownloadBtn) {
        bgDownloadBtn.addEventListener("click", () => {
            if (!bgCompositeCanvas) return;
            bgCompositeCanvas.toBlob((blob) => {
                if (!blob) return;
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = currentBgMode === "transparent" ? "supiristudio_cutout.png" : "supiristudio_photo.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast("Download started!", "success");
            }, "image/png");
        });
    }

    if (bgSendToIdBtn) {
        bgSendToIdBtn.addEventListener("click", () => {
            if (!currentCutoutBlob) return;
            switchTab("panelIdPhoto");
            loadIdPhotoFromBlob(currentCutoutBlob);
        });
    }

    // ========================================================
    // TOOL 2: 🖌️ IMAGE WATERMARK ERASER (INPAINTING)
    // ========================================================
    const wmDropzone = document.getElementById("wmDropzone");
    const wmFileInput = document.getElementById("wmFileInput");
    const wmUploadArea = document.getElementById("wmUploadArea");
    const wmCanvasArea = document.getElementById("wmCanvasArea");
    const wmBaseCanvas = document.getElementById("wmBaseCanvas");
    const wmMaskCanvas = document.getElementById("wmMaskCanvas");
    const wmBrushSize = document.getElementById("wmBrushSize");
    const wmBrushSizeVal = document.getElementById("wmBrushSizeVal");
    const wmUndoBtn = document.getElementById("wmUndoBtn");
    const wmClearBtn = document.getElementById("wmClearBtn");
    const wmResetBtn = document.getElementById("wmResetBtn");
    const wmProcessBtn = document.getElementById("wmProcessBtn");
    const wmReadyCard = document.getElementById("wmReadyCard");
    const wmDownloadBtn = document.getElementById("wmDownloadBtn");
    const wmProcessAnotherBtn = document.getElementById("wmProcessAnotherBtn");
    const wmFileInfo = document.getElementById("wmFileInfo");

    let wmOriginalImage = null;
    let wmOriginalFile = null;
    let isDrawing = false;
    let brushRadius = 25;
    let maskHistory = [];
    let cleanInpaintedBlob = null;

    if (wmDropzone && wmFileInput) {
        wmDropzone.addEventListener("click", () => wmFileInput.click());

        ["dragenter", "dragover"].forEach(ev => {
            wmDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                wmDropzone.classList.add("border-cyan-500", "bg-slate-900/80");
            });
        });

        ["dragleave", "drop"].forEach(ev => {
            wmDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                wmDropzone.classList.remove("border-cyan-500", "bg-slate-900/80");
            });
        });

        wmDropzone.addEventListener("drop", (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleWmFile(e.dataTransfer.files[0]);
            }
        });

        wmFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleWmFile(e.target.files[0]);
            }
        });
    }

    function handleWmFile(file) {
        if (!file.type.startsWith("image/")) {
            showToast("Please upload a valid image file.", "error");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showToast("File size exceeds strict 50 MB limit.", "error");
            return;
        }

        wmOriginalFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            wmOriginalImage = new Image();
            wmOriginalImage.onload = () => {
                initWmCanvas();
                wmUploadArea.classList.add("hidden");
                wmCanvasArea.classList.remove("hidden");
                wmReadyCard.classList.add("hidden");
                showToast("Image loaded! Paint over watermarks or objects to erase.", "info");
            };
            wmOriginalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function initWmCanvas() {
        if (!wmBaseCanvas || !wmMaskCanvas || !wmOriginalImage) return;

        const w = wmOriginalImage.naturalWidth;
        const h = wmOriginalImage.naturalHeight;

        wmBaseCanvas.width = w;
        wmBaseCanvas.height = h;
        wmMaskCanvas.width = w;
        wmMaskCanvas.height = h;

        const baseCtx = wmBaseCanvas.getContext("2d");
        baseCtx.clearRect(0, 0, w, h);
        baseCtx.drawImage(wmOriginalImage, 0, 0, w, h);

        const maskCtx = wmMaskCanvas.getContext("2d");
        maskCtx.clearRect(0, 0, w, h);
        maskHistory = [];
        saveMaskState();
    }

    function saveMaskState() {
        const maskCtx = wmMaskCanvas.getContext("2d");
        maskHistory.push(maskCtx.getImageData(0, 0, wmMaskCanvas.width, wmMaskCanvas.height));
        if (maskHistory.length > 15) maskHistory.shift();
    }

    if (wmBrushSize && wmBrushSizeVal) {
        wmBrushSize.addEventListener("input", (e) => {
            brushRadius = parseInt(e.target.value, 10);
            wmBrushSizeVal.textContent = `${brushRadius}px`;
        });
    }

    // Canvas Drawing Handlers
    function getCanvasCoordinates(e) {
        const rect = wmMaskCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const scaleX = wmMaskCanvas.width / rect.width;
        const scaleY = wmMaskCanvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    let lastPoint = null;

    function startDraw(e) {
        e.preventDefault();
        isDrawing = true;
        const pt = getCanvasCoordinates(e);
        lastPoint = pt;
        drawStroke(pt.x, pt.y, true);
    }

    function moveDraw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pt = getCanvasCoordinates(e);
        drawStroke(pt.x, pt.y);
        lastPoint = pt;
    }

    function endDraw(e) {
        if (isDrawing) {
            isDrawing = false;
            lastPoint = null;
            saveMaskState();
        }
    }

    function drawStroke(x, y, isFirst = false) {
        const ctx = wmMaskCanvas.getContext("2d");
        ctx.strokeStyle = "rgba(239, 68, 68, 0.65)";
        ctx.fillStyle = "rgba(239, 68, 68, 0.65)";
        ctx.lineWidth = brushRadius * 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        if (isFirst || !lastPoint) {
            ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    if (wmMaskCanvas) {
        wmMaskCanvas.addEventListener("mousedown", startDraw);
        window.addEventListener("mousemove", moveDraw);
        window.addEventListener("mouseup", endDraw);

        wmMaskCanvas.addEventListener("touchstart", startDraw, { passive: false });
        window.addEventListener("touchmove", moveDraw, { passive: false });
        window.addEventListener("touchend", endDraw);
    }

    if (wmUndoBtn) {
        wmUndoBtn.addEventListener("click", () => {
            if (maskHistory.length > 1) {
                maskHistory.pop(); // discard current state
                const prevState = maskHistory[maskHistory.length - 1];
                const ctx = wmMaskCanvas.getContext("2d");
                ctx.putImageData(prevState, 0, 0);
                showToast("Undone last stroke.", "info");
            } else {
                showToast("Nothing to undo.", "warning");
            }
        });
    }

    if (wmClearBtn) {
        wmClearBtn.addEventListener("click", () => {
            const ctx = wmMaskCanvas.getContext("2d");
            ctx.clearRect(0, 0, wmMaskCanvas.width, wmMaskCanvas.height);
            maskHistory = [];
            saveMaskState();
            showToast("Mask cleared.", "info");
        });
    }

    if (wmResetBtn || wmProcessAnotherBtn) {
        const resetHandler = () => {
            wmCanvasArea.classList.add("hidden");
            wmUploadArea.classList.remove("hidden");
            wmReadyCard.classList.add("hidden");
            if (wmFileInput) wmFileInput.value = "";
            wmOriginalImage = null;
            wmOriginalFile = null;
            cleanInpaintedBlob = null;
        };
        if (wmResetBtn) wmResetBtn.addEventListener("click", resetHandler);
        if (wmProcessAnotherBtn) wmProcessAnotherBtn.addEventListener("click", resetHandler);
    }

    // Process Watermark Erasing with backend inpainting
    if (wmProcessBtn) {
        wmProcessBtn.addEventListener("click", () => {
            if (!wmOriginalFile || !wmMaskCanvas) {
                showToast("Please upload an image first.", "error");
                return;
            }

            // Create binary mask (black background with white painted pixels)
            const maskCanvas = document.createElement("canvas");
            maskCanvas.width = wmMaskCanvas.width;
            maskCanvas.height = wmMaskCanvas.height;
            const maskCtx = maskCanvas.getContext("2d");

            // Fill black
            maskCtx.fillStyle = "#000000";
            maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

            // Read painted pixels from wmMaskCanvas
            const imgData = wmMaskCanvas.getContext("2d").getImageData(0, 0, maskCanvas.width, maskCanvas.height);
            const data = imgData.data;
            let paintedCount = 0;

            const binaryImgData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
            const bData = binaryImgData.data;

            for (let i = 0; i < data.length; i += 4) {
                // If alpha > 10, mark as white
                if (data[i + 3] > 10) {
                    bData[i] = 255;
                    bData[i + 1] = 255;
                    bData[i + 2] = 255;
                    bData[i + 3] = 255;
                    paintedCount++;
                }
            }

            if (paintedCount === 0) {
                showToast("Please paint over the watermark first using your mouse or touch.", "warning");
                return;
            }

            maskCtx.putImageData(binaryImgData, 0, 0);

            startProgress("Inpainting & Erasing Watermark...", "Reconstructing pixels with Telea & Navier-Stokes");

            maskCanvas.toBlob((maskBlob) => {
                const formData = new FormData();
                formData.append("image", wmOriginalFile);
                formData.append("mask", maskBlob, "mask.png");

                fetch("/api/image/inpaint", {
                    method: "POST",
                    body: formData
                })
                .then(async (res) => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({ detail: "Inpainting failed" }));
                        throw new Error(err.detail || "Server error");
                    }
                    return res.blob();
                })
                .then(blob => {
                    cleanInpaintedBlob = blob;
                    const cleanImg = new Image();
                    cleanImg.onload = () => {
                        // Update base canvas with inpainted image
                        const baseCtx = wmBaseCanvas.getContext("2d");
                        baseCtx.clearRect(0, 0, wmBaseCanvas.width, wmBaseCanvas.height);
                        baseCtx.drawImage(cleanImg, 0, 0);

                        // Clear mask canvas
                        const mCtx = wmMaskCanvas.getContext("2d");
                        mCtx.clearRect(0, 0, wmMaskCanvas.width, wmMaskCanvas.height);

                        completeProgress(() => {
                            wmReadyCard.classList.remove("hidden");
                            if (wmFileInfo) {
                                wmFileInfo.textContent = `Watermark Erased • ${cleanImg.naturalWidth} × ${cleanImg.naturalHeight} px • ${formatBytes(blob.size)}`;
                            }
                            showToast("Watermark erased cleanly!", "success");
                        });
                    };
                    cleanImg.src = URL.createObjectURL(blob);
                })
                .catch(err => {
                    hideProgress();
                    showToast(err.message || "Watermark erasing failed.", "error");
                });
            }, "image/png");
        });
    }

    if (wmDownloadBtn) {
        wmDownloadBtn.addEventListener("click", () => {
            if (!cleanInpaintedBlob) return;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(cleanInpaintedBlob);
            link.download = "supiristudio_clean_image.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Clean image download started!", "success");
        });
    }

    // ========================================================
    // TOOL 3: 🎬 VIDEO WATERMARK REMOVER (FFMPEG DELOGO)
    // ========================================================
    const videoDropzone = document.getElementById("videoDropzone");
    const videoFileInput = document.getElementById("videoFileInput");
    const videoUploadArea = document.getElementById("videoUploadArea");
    const videoPlayerArea = document.getElementById("videoPlayerArea");
    const videoPreview = document.getElementById("videoPreview");
    const delogoBox1 = document.getElementById("delogoBox1");
    const delogoBox2 = document.getElementById("delogoBox2");
    const videoToggleBox2Btn = document.getElementById("videoToggleBox2Btn");
    const videoResetBtn = document.getElementById("videoResetBtn");
    const videoProcessBtn = document.getElementById("videoProcessBtn");
    const videoReadyCard = document.getElementById("videoReadyCard");
    const videoResultPlayer = document.getElementById("videoResultPlayer");
    const videoDownloadBtn = document.getElementById("videoDownloadBtn");
    const videoProcessAnotherBtn = document.getElementById("videoProcessAnotherBtn");
    const videoFileInfo = document.getElementById("videoFileInfo");

    let currentVideoFile = null;
    let cleanVideoBlob = null;
    let isBox2Active = false;

    if (videoDropzone && videoFileInput) {
        videoDropzone.addEventListener("click", () => videoFileInput.click());

        ["dragenter", "dragover"].forEach(ev => {
            videoDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                videoDropzone.classList.add("border-cyan-500", "bg-slate-900/80");
            });
        });

        ["dragleave", "drop"].forEach(ev => {
            videoDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                videoDropzone.classList.remove("border-cyan-500", "bg-slate-900/80");
            });
        });

        videoDropzone.addEventListener("drop", (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleVideoFile(e.dataTransfer.files[0]);
            }
        });

        videoFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleVideoFile(e.target.files[0]);
            }
        });
    }

    function handleVideoFile(file) {
        if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|mov|webm|mkv)$/i)) {
            showToast("Please upload a valid video file (MP4, MOV, WEBM, MKV).", "error");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showToast("Video exceeds strict 50 MB limit. Please trim or select a smaller video.", "error");
            return;
        }

        currentVideoFile = file;
        const videoUrl = URL.createObjectURL(file);
        videoPreview.src = videoUrl;
        videoPreview.onloadedmetadata = () => {
            videoUploadArea.classList.add("hidden");
            videoPlayerArea.classList.remove("hidden");
            videoReadyCard.classList.add("hidden");
            setupDelogoBoxInteractions(delogoBox1);
            setupDelogoBoxInteractions(delogoBox2);
            showToast("Video loaded! Drag the box over the watermark.", "info");
        };
    }

    // Interactive Draggable & Resizable Delogo Box
    function setupDelogoBoxInteractions(box) {
        if (!box) return;

        let isDragging = false;
        let isResizing = false;
        let resizeHandle = null;
        let startX, startY, startLeft, startTop, startWidth, startHeight;

        function onMouseDown(e) {
            if (e.target.classList.contains("resize-handle")) {
                isResizing = true;
                resizeHandle = e.target.getAttribute("data-handle");
            } else {
                isDragging = true;
            }

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;
            startLeft = box.offsetLeft;
            startTop = box.offsetTop;
            startWidth = box.offsetWidth;
            startHeight = box.offsetHeight;

            e.preventDefault();
        }

        function onMouseMove(e) {
            if (!isDragging && !isResizing) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;
            const parent = box.parentElement;
            const maxW = parent.clientWidth;
            const maxH = parent.clientHeight;

            if (isDragging) {
                let newLeft = Math.max(0, Math.min(startLeft + dx, maxW - box.offsetWidth));
                let newTop = Math.max(0, Math.min(startTop + dy, maxH - box.offsetHeight));
                box.style.left = `${newLeft}px`;
                box.style.top = `${newTop}px`;
                box.style.right = "auto";
                box.style.bottom = "auto";
            } else if (isResizing) {
                let newW = startWidth;
                let newH = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                if (resizeHandle.includes("e")) newW = Math.max(30, Math.min(startWidth + dx, maxW - startLeft));
                if (resizeHandle.includes("s")) newH = Math.max(20, Math.min(startHeight + dy, maxH - startTop));
                if (resizeHandle.includes("w")) {
                    newW = Math.max(30, startWidth - dx);
                    newLeft = startLeft + (startWidth - newW);
                }
                if (resizeHandle.includes("n")) {
                    newH = Math.max(20, startHeight - dy);
                    newTop = startTop + (startHeight - newH);
                }

                box.style.width = `${newW}px`;
                box.style.height = `${newH}px`;
                box.style.left = `${newLeft}px`;
                box.style.top = `${newTop}px`;
                box.style.right = "auto";
                box.style.bottom = "auto";
            }
        }

        function onMouseUp() {
            isDragging = false;
            isResizing = false;
            resizeHandle = null;
        }

        box.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        box.addEventListener("touchstart", onMouseDown, { passive: false });
        window.addEventListener("touchmove", onMouseMove, { passive: false });
        window.addEventListener("touchend", onMouseUp);
    }

    if (videoToggleBox2Btn && delogoBox2) {
        videoToggleBox2Btn.addEventListener("click", () => {
            isBox2Active = !isBox2Active;
            if (isBox2Active) {
                delogoBox2.classList.remove("hidden");
                videoToggleBox2Btn.innerHTML = `<i class="fa-solid fa-xmark mr-1"></i> Remove 2nd Box`;
                videoToggleBox2Btn.classList.replace("text-emerald-400", "text-rose-400");
                showToast("2nd delogo box added.", "info");
            } else {
                delogoBox2.classList.add("hidden");
                videoToggleBox2Btn.innerHTML = `<i class="fa-solid fa-plus mr-1"></i> Add 2nd Box`;
                videoToggleBox2Btn.classList.replace("text-rose-400", "text-emerald-400");
            }
        });
    }

    if (videoResetBtn || videoProcessAnotherBtn) {
        const resetHandler = () => {
            videoPlayerArea.classList.add("hidden");
            videoUploadArea.classList.remove("hidden");
            videoReadyCard.classList.add("hidden");
            if (videoFileInput) videoFileInput.value = "";
            if (videoPreview) videoPreview.src = "";
            if (videoResultPlayer) videoResultPlayer.src = "";
            currentVideoFile = null;
            cleanVideoBlob = null;
        };
        if (videoResetBtn) videoResetBtn.addEventListener("click", resetHandler);
        if (videoProcessAnotherBtn) videoProcessAnotherBtn.addEventListener("click", resetHandler);
    }

    // Map DOM coordinates to native video coordinates
    function mapBoxToVideoNative(box) {
        const vw = videoPreview.videoWidth;
        const vh = videoPreview.videoHeight;
        const displayW = videoPreview.clientWidth;
        const displayH = videoPreview.clientHeight;

        if (!vw || !vh || !displayW || !displayH) return null;

        const scaleX = vw / displayW;
        const scaleY = vh / displayH;

        const x = Math.round(box.offsetLeft * scaleX);
        const y = Math.round(box.offsetTop * scaleY);
        const w = Math.round(box.offsetWidth * scaleX);
        const h = Math.round(box.offsetHeight * scaleY);

        return {
            x: Math.max(0, Math.min(x, vw - 2)),
            y: Math.max(0, Math.min(y, vh - 2)),
            w: Math.max(2, Math.min(w, vw - x)),
            h: Math.max(2, Math.min(h, vh - y))
        };
    }

    if (videoProcessBtn) {
        videoProcessBtn.addEventListener("click", () => {
            if (!currentVideoFile || !videoPreview) {
                showToast("Please upload a video first.", "error");
                return;
            }

            const coords1 = mapBoxToVideoNative(delogoBox1);
            if (!coords1) {
                showToast("Unable to calculate video watermark coordinates.", "error");
                return;
            }

            startProgress("Processing FFmpeg Delogo Engine...", "Erasing watermark across video frames");

            const formData = new FormData();
            formData.append("video", currentVideoFile);
            formData.append("box1_x", coords1.x);
            formData.append("box1_y", coords1.y);
            formData.append("box1_w", coords1.w);
            formData.append("box1_h", coords1.h);

            if (isBox2Active && delogoBox2 && !delogoBox2.classList.contains("hidden")) {
                const coords2 = mapBoxToVideoNative(delogoBox2);
                if (coords2) {
                    formData.append("box2_x", coords2.x);
                    formData.append("box2_y", coords2.y);
                    formData.append("box2_w", coords2.w);
                    formData.append("box2_h", coords2.h);
                }
            }

            fetch("/api/video/delogo", {
                method: "POST",
                body: formData
            })
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: "Video delogo processing failed" }));
                    throw new Error(err.detail || "Server error");
                }
                return res.blob();
            })
            .then(blob => {
                cleanVideoBlob = blob;
                const url = URL.createObjectURL(blob);
                videoResultPlayer.src = url;

                completeProgress(() => {
                    videoReadyCard.classList.remove("hidden");
                    if (videoFileInfo) {
                        videoFileInfo.textContent = `Clean MP4 Video • ${videoPreview.videoWidth} × ${videoPreview.videoHeight} • ${formatBytes(blob.size)}`;
                    }
                    showToast("Video watermark removed successfully!", "success");
                });
            })
            .catch(err => {
                hideProgress();
                showToast(err.message || "Video delogo failed.", "error");
            });
        });
    }

    if (videoDownloadBtn) {
        videoDownloadBtn.addEventListener("click", () => {
            if (!cleanVideoBlob) return;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(cleanVideoBlob);
            link.download = "supiristudio_clean_video.mp4";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Clean video download started!", "success");
        });
    }

    // ========================================================
    // TOOL 4: 🪪 ID & PASSPORT PHOTO STUDIO
    // ========================================================
    const idDropzone = document.getElementById("idDropzone");
    const idFileInput = document.getElementById("idFileInput");
    const idUploadArea = document.getElementById("idUploadArea");
    const idWorkspaceArea = document.getElementById("idWorkspaceArea");
    const idCanvas = document.getElementById("idCanvas");
    const idPresetSelect = document.getElementById("idPresetSelect");
    const idColorBtns = document.querySelectorAll(".id-color-btn");
    const idFormatSingleBtn = document.getElementById("idFormatSingleBtn");
    const idFormatSheetBtn = document.getElementById("idFormatSheetBtn");
    const idScaleRange = document.getElementById("idScaleRange");
    const idRotateBtn = document.getElementById("idRotateBtn");
    const idGenerateBtn = document.getElementById("idGenerateBtn");
    const idReadyCard = document.getElementById("idReadyCard");
    const idResultPreview = document.getElementById("idResultPreview");
    const idDownloadBtn = document.getElementById("idDownloadBtn");
    const idProcessAnotherBtn = document.getElementById("idProcessAnotherBtn");
    const idResetBtn = document.getElementById("idResetBtn");
    const idFileInfo = document.getElementById("idFileInfo");

    let idSourceImg = null;
    let idSourceBlob = null;
    let idScale = 1.0;
    let idRotation = 0; // 0, 90, 180, 270
    let idPanX = 0;
    let idPanY = 0;
    let idBgColor = "#FFFFFF";
    let idFormatType = "single"; // "single" or "sheet"
    let idGeneratedBlob = null;

    if (idDropzone && idFileInput) {
        idDropzone.addEventListener("click", () => idFileInput.click());

        ["dragenter", "dragover"].forEach(ev => {
            idDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                idDropzone.classList.add("border-emerald-500", "bg-slate-900/80");
            });
        });

        ["dragleave", "drop"].forEach(ev => {
            idDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                idDropzone.classList.remove("border-emerald-500", "bg-slate-900/80");
            });
        });

        idDropzone.addEventListener("drop", (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleIdFile(e.dataTransfer.files[0]);
            }
        });

        idFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleIdFile(e.target.files[0]);
            }
        });
    }

    function handleIdFile(file) {
        if (!file.type.startsWith("image/")) {
            showToast("Please upload a portrait image.", "error");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showToast("File size exceeds 50 MB limit.", "error");
            return;
        }
        idSourceBlob = file;
        loadIdPhotoFromBlob(file);
    }

    function loadIdPhotoFromBlob(blob) {
        idSourceBlob = blob;
        const reader = new FileReader();
        reader.onload = (e) => {
            idSourceImg = new Image();
            idSourceImg.onload = () => {
                idUploadArea.classList.add("hidden");
                idWorkspaceArea.classList.remove("hidden");
                idReadyCard.classList.add("hidden");
                idScale = 1.0;
                idRotation = 0;
                idPanX = 0;
                idPanY = 0;
                if (idScaleRange) idScaleRange.value = "1.0";
                renderIdCanvas();
                showToast("Portrait loaded into ID Studio!", "info");
            };
            idSourceImg.src = e.target.result;
        };
        reader.readAsDataURL(blob);
    }

    function getPresetTargetDimensions() {
        const preset = idPresetSelect ? idPresetSelect.value : "sl_passport";
        // Aspect ratio representation (width, height)
        if (preset === "sl_passport") {
            return { w: 350, h: 450, label: "35 × 45 mm (SL Passport/NIC)" };
        } else if (preset === "visa_square") {
            return { w: 400, h: 400, label: "2 × 2 inch (Visa/Square)" };
        } else {
            return { w: 400, h: 400, label: "1:1 HD Profile" };
        }
    }

    function renderIdCanvas() {
        if (!idCanvas || !idSourceImg) return;
        const ctx = idCanvas.getContext("2d");
        const dims = getPresetTargetDimensions();

        idCanvas.width = dims.w;
        idCanvas.height = dims.h;

        // Background fill
        if (idBgColor !== "transparent") {
            ctx.fillStyle = idBgColor;
            ctx.fillRect(0, 0, dims.w, dims.h);
        } else {
            ctx.clearRect(0, 0, dims.w, dims.h);
        }

        ctx.save();
        ctx.translate(dims.w / 2 + idPanX, dims.h / 2 + idPanY);
        ctx.rotate((idRotation * Math.PI) / 180);
        ctx.scale(idScale, idScale);

        // Fit source image center
        const imgRatio = idSourceImg.naturalWidth / idSourceImg.naturalHeight;
        const canvasRatio = dims.w / dims.h;
        let drawW, drawH;

        if (imgRatio > canvasRatio) {
            drawH = dims.h;
            drawW = dims.h * imgRatio;
        } else {
            drawW = dims.w;
            drawH = dims.w / imgRatio;
        }

        ctx.drawImage(idSourceImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Draw translucent Face Oval Guide for passport alignment
        ctx.save();
        ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        // Oval for head
        ctx.beginPath();
        ctx.ellipse(dims.w / 2, dims.h * 0.45, dims.w * 0.28, dims.h * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Shoulder guideline
        ctx.beginPath();
        ctx.moveTo(dims.w * 0.15, dims.h * 0.82);
        ctx.lineTo(dims.w * 0.85, dims.h * 0.82);
        ctx.stroke();
        ctx.restore();
    }

    if (idPresetSelect) idPresetSelect.addEventListener("change", renderIdCanvas);

    if (idScaleRange) {
        idScaleRange.addEventListener("input", (e) => {
            idScale = parseFloat(e.target.value);
            renderIdCanvas();
        });
    }

    if (idRotateBtn) {
        idRotateBtn.addEventListener("click", () => {
            idRotation = (idRotation + 90) % 360;
            renderIdCanvas();
        });
    }

    idColorBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            idColorBtns.forEach(b => {
                b.classList.remove("border-emerald-500", "bg-emerald-500/10", "text-emerald-400");
                b.classList.add("border-slate-700", "bg-slate-900", "text-slate-300");
            });
            btn.classList.add("border-emerald-500", "bg-emerald-500/10", "text-emerald-400");
            btn.classList.remove("border-slate-700", "bg-slate-900", "text-slate-300");

            idBgColor = btn.getAttribute("data-color");
            renderIdCanvas();
        });
    });

    if (idFormatSingleBtn && idFormatSheetBtn) {
        idFormatSingleBtn.addEventListener("click", () => {
            idFormatType = "single";
            idFormatSingleBtn.className = "id-format-btn active flex-1 py-1.5 px-2 rounded-lg border border-emerald-500 bg-emerald-500/10 text-emerald-400 text-xs font-bold";
            idFormatSheetBtn.className = "id-format-btn flex-1 py-1.5 px-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-xs font-bold";
        });

        idFormatSheetBtn.addEventListener("click", () => {
            idFormatType = "sheet";
            idFormatSheetBtn.className = "id-format-btn active flex-1 py-1.5 px-2 rounded-lg border border-emerald-500 bg-emerald-500/10 text-emerald-400 text-xs font-bold";
            idFormatSingleBtn.className = "id-format-btn flex-1 py-1.5 px-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-xs font-bold";
        });
    }

    // Process & Generate Passport Photo
    if (idGenerateBtn) {
        idGenerateBtn.addEventListener("click", () => {
            if (!idSourceBlob) {
                showToast("Please upload a portrait photo first.", "error");
                return;
            }

            startProgress("Rendering ID & Passport Photo...", "Applying 300 DPI crop alignment and print layout");

            const formData = new FormData();
            formData.append("image", idSourceBlob);
            formData.append("format_type", idFormatType);
            formData.append("crop_preset", idPresetSelect ? idPresetSelect.value : "sl_passport");
            formData.append("bg_color", idBgColor);
            formData.append("dpi", "300");

            fetch("/api/idphoto/generate", {
                method: "POST",
                body: formData
            })
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: "Generation failed" }));
                    throw new Error(err.detail || "Server error");
                }
                return res.blob();
            })
            .then(blob => {
                idGeneratedBlob = blob;
                const url = URL.createObjectURL(blob);
                if (idResultPreview) idResultPreview.src = url;

                completeProgress(() => {
                    idReadyCard.classList.remove("hidden");
                    if (idFileInfo) {
                        const dims = getPresetTargetDimensions();
                        idFileInfo.textContent = idFormatType === "single"
                            ? `${dims.label} • 300 DPI • ${formatBytes(blob.size)}`
                            : `4×6" Print Sheet (8 Photos Grid) • 300 DPI • ${formatBytes(blob.size)}`;
                    }
                    showToast("ID Photo generated successfully!", "success");
                });
            })
            .catch(err => {
                hideProgress();
                showToast(err.message || "Failed to generate ID Photo.", "error");
            });
        });
    }

    if (idDownloadBtn) {
        idDownloadBtn.addEventListener("click", () => {
            if (!idGeneratedBlob) return;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(idGeneratedBlob);
            link.download = idFormatType === "single" ? "supiristudio_id_photo.png" : "supiristudio_4x6_passport_sheet.jpg";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("ID Photo download started!", "success");
        });
    }

    if (idResetBtn || idProcessAnotherBtn) {
        const resetHandler = () => {
            idWorkspaceArea.classList.add("hidden");
            idUploadArea.classList.remove("hidden");
            idReadyCard.classList.add("hidden");
            if (idFileInput) idFileInput.value = "";
            idSourceImg = null;
            idSourceBlob = null;
            idGeneratedBlob = null;
        };
        if (idResetBtn) idResetBtn.addEventListener("click", resetHandler);
        if (idProcessAnotherBtn) idProcessAnotherBtn.addEventListener("click", resetHandler);
    }

})();
