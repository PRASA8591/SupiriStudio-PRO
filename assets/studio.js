/**
 * SupiriStudio PRO — Ultra-Advanced Commercial-Grade Engine
 * Powered by PrasaTek System Solutions (https://studio.prasatek.lk)
 */

(function () {
    "use strict";

    // Strict 50 MB RAM Protection Limit
    const MAX_FILE_SIZE = 50 * 1024 * 1024;

    // ========================================================
    // 1. CLIENT-SIDE CODE PROTECTION & SECURITY
    // ========================================================
    document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        showToast("Right-click context menu is disabled for security.", "warning");
    });

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
        let colorClass = "bg-slate-900/95 border-slate-700 text-slate-200";

        if (type === "error" || type === "danger") {
            icon = "fa-circle-exclamation text-rose-400";
            colorClass = "bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-glow-rose";
        } else if (type === "success") {
            icon = "fa-circle-check text-emerald-400";
            colorClass = "bg-slate-900/95 border-emerald-500/50 text-emerald-200 shadow-glow-emerald";
        } else if (type === "warning") {
            icon = "fa-triangle-exclamation text-amber-400";
            colorClass = "bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-glow-amber";
        }

        toast.className += ` ${colorClass}`;
        toast.innerHTML = `
            <i class="fa-solid ${icon} text-lg flex-shrink-0"></i>
            <span class="text-xs font-semibold leading-relaxed">${message}</span>
        `;

        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove("translate-y-2", "opacity-0");
        });

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
        progressSubtitle.textContent = subtitle || "Analyzing pixels and applying neural filters";
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
        }, 220);
    }

    function completeProgress(onFinished) {
        if (progressInterval) clearInterval(progressInterval);
        progressPercent.textContent = "100%";
        progressBarFill.style.width = "100%";
        progressSubtitle.textContent = "Finalizing high-resolution output...";

        if (typeof confetti === "function") {
            confetti({
                particleCount: 70,
                spread: 75,
                origin: { y: 0.6 },
                colors: ["#10b981", "#06b6d4", "#f59e0b", "#ffffff"]
            });
        }

        setTimeout(() => {
            globalProgressCard.classList.add("hidden");
            if (onFinished) onFinished();
        }, 400);
    }

    function hideProgress() {
        if (progressInterval) clearInterval(progressInterval);
        if (globalProgressCard) globalProgressCard.classList.add("hidden");
    }

    // ========================================================
    // 5. NAVIGATION TAB SWITCHING
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

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return "0 Bytes";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    // ========================================================
    // TOOL 1: ✂️ ADVANCED AI BG REMOVER & PHOTOROOM STUDIO PRO
    // ========================================================
    const bgDropzone = document.getElementById("bgDropzone");
    const bgFileInput = document.getElementById("bgFileInput");
    const bgUploadArea = document.getElementById("bgUploadArea");
    const bgEditorArea = document.getElementById("bgEditorArea");
    const bgCompositeCanvas = document.getElementById("bgCompositeCanvas");
    const bgResetBtn = document.getElementById("bgResetBtn");
    const bgCenterSubjectBtn = document.getElementById("bgCenterSubjectBtn");
    const bgPresetBtns = document.querySelectorAll(".bg-preset-btn");
    const bgCustomColor = document.getElementById("bgCustomColor");
    const bgCustomImageInput = document.getElementById("bgCustomImageInput");
    const bgDownloadBtn = document.getElementById("bgDownloadBtn");
    const bgFileInfo = document.getElementById("bgFileInfo");
    const bgSendToIdBtn = document.getElementById("bgSendToIdBtn");

    // Sliders & Toggles
    const bgScaleRange = document.getElementById("bgScaleRange");
    const bgScaleVal = document.getElementById("bgScaleVal");
    const bgRotateRange = document.getElementById("bgRotateRange");
    const bgRotateVal = document.getElementById("bgRotateVal");
    const bgFeatherRange = document.getElementById("bgFeatherRange");
    const bgFeatherVal = document.getElementById("bgFeatherVal");
    const bgStrokeToggle = document.getElementById("bgStrokeToggle");
    const bgStrokeColor = document.getElementById("bgStrokeColor");
    const bgStrokeWidth = document.getElementById("bgStrokeWidth");
    const bgStrokeWidthVal = document.getElementById("bgStrokeWidthVal");
    const bgShadowToggle = document.getElementById("bgShadowToggle");
    const bgShadowBlur = document.getElementById("bgShadowBlur");
    const bgShadowBlurVal = document.getElementById("bgShadowBlurVal");
    const bgShadowOpacity = document.getElementById("bgShadowOpacity");
    const bgShadowOpacityVal = document.getElementById("bgShadowOpacityVal");
    const bgBackdropBlur = document.getElementById("bgBackdropBlur");
    const bgBackdropBlurVal = document.getElementById("bgBackdropBlurVal");

    let currentCutoutImg = null;
    let currentCutoutBlob = null;
    let currentBgMode = "transparent"; // "transparent", "color", "gradient", "image"
    let currentBgColor = "#FFFFFF";
    let currentBgGradient = null;
    let customBackdropImg = null;

    // Interactive Dragging / Panning State
    let bgSubjectPanX = 0;
    let bgSubjectPanY = 0;
    let bgIsDraggingSubject = false;
    let bgDragStartX = 0;
    let bgDragStartY = 0;

    if (bgDropzone && bgFileInput) {
        bgDropzone.addEventListener("click", () => bgFileInput.click());

        ["dragenter", "dragover"].forEach(ev => {
            bgDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                bgDropzone.classList.add("border-emerald-500", "bg-slate-900/80");
            });
        });

        ["dragleave", "drop"].forEach(ev => {
            bgDropzone.addEventListener(ev, (e) => {
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
            showToast("Please upload a valid image file (PNG, JPG, or WEBP).", "error");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showToast("File size exceeds strict 50 MB limit. Please select a smaller photo.", "error");
            return;
        }

        startProgress("Removing Background with AI...", "Matting edges and separating foreground subject");

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
                    bgSubjectPanX = 0;
                    bgSubjectPanY = 0;
                    renderBgComposite();
                    if (bgFileInfo) {
                        bgFileInfo.textContent = `HD PNG Cutout • ${currentCutoutImg.naturalWidth} × ${currentCutoutImg.naturalHeight} px • ${formatBytes(blob.size)}`;
                    }
                    showToast("Background isolated successfully!", "success");
                });
            };
            currentCutoutImg.src = imgUrl;
        })
        .catch(err => {
            hideProgress();
            showToast(err.message || "Background removal failed.", "error");
        });
    }

    // High-Precision Photoroom Composite Renderer
    function renderBgComposite() {
        if (!currentCutoutImg || !bgCompositeCanvas) return;
        const ctx = bgCompositeCanvas.getContext("2d");

        const w = currentCutoutImg.naturalWidth;
        const h = currentCutoutImg.naturalHeight;

        bgCompositeCanvas.width = w;
        bgCompositeCanvas.height = h;

        ctx.clearRect(0, 0, w, h);

        const dslrBlur = bgBackdropBlur ? parseInt(bgBackdropBlur.value, 10) : 0;

        // 1. Draw Backdrop
        ctx.save();
        if (dslrBlur > 0) {
            ctx.filter = `blur(${dslrBlur}px)`;
        }

        if (currentBgMode === "color") {
            ctx.fillStyle = currentBgColor;
            ctx.fillRect(0, 0, w, h);
        } else if (currentBgMode === "gradient" && currentBgGradient) {
            // Create gradient
            const grad = ctx.createLinearGradient(0, 0, w, h);
            if (currentBgGradient.includes("#064e3b")) {
                grad.addColorStop(0, "#064e3b");
                grad.addColorStop(1, "#022c22");
            } else if (currentBgGradient.includes("#78350f")) {
                grad.addColorStop(0, "#78350f");
                grad.addColorStop(1, "#451a03");
            } else if (currentBgGradient.includes("#334155")) {
                grad.addColorStop(0, "#334155");
                grad.addColorStop(1, "#090d16");
            } else {
                grad.addColorStop(0, "#0f172a");
                grad.addColorStop(1, "#0369a1");
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);
        } else if (currentBgMode === "image" && customBackdropImg) {
            const scale = Math.max(w / customBackdropImg.width, h / customBackdropImg.height);
            const sw = customBackdropImg.width * scale;
            const sh = customBackdropImg.height * scale;
            const sx = (w - sw) / 2;
            const sy = (h - sh) / 2;
            ctx.drawImage(customBackdropImg, sx, sy, sw, sh);
        }
        ctx.restore();

        // 2. Prepare Subject Transform Values
        const scaleVal = (bgScaleRange ? parseInt(bgScaleRange.value, 10) : 100) / 100;
        const rotateVal = (bgRotateRange ? parseInt(bgRotateRange.value, 10) : 0) * (Math.PI / 180);
        const featherVal = bgFeatherRange ? parseInt(bgFeatherRange.value, 10) : 0;

        const centerX = w / 2 + bgSubjectPanX;
        const centerY = h / 2 + bgSubjectPanY;

        // 3. Draw 3D Realistic Drop Shadow (if enabled)
        if (bgShadowToggle && bgShadowToggle.checked) {
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotateVal);
            ctx.scale(scaleVal, scaleVal);

            const sBlur = parseInt(bgShadowBlur.value, 10);
            const sOpacity = parseInt(bgShadowOpacity.value, 10) / 100;

            ctx.shadowColor = `rgba(0, 0, 0, ${sOpacity})`;
            ctx.shadowBlur = sBlur;
            ctx.shadowOffsetX = 12;
            ctx.shadowOffsetY = 18;

            ctx.drawImage(currentCutoutImg, -w / 2, -h / 2, w, h);
            ctx.restore();
        }

        // 4. Draw YouTube Thumbnail / Product Outline (Stroke)
        if (bgStrokeToggle && bgStrokeToggle.checked) {
            const strokeW = parseInt(bgStrokeWidth.value, 10);
            const strokeColor = bgStrokeColor ? bgStrokeColor.value : "#FFFFFF";

            if (strokeW > 0) {
                // Offscreen canvas for crisp silhouette outline
                const offCanvas = document.createElement("canvas");
                offCanvas.width = w;
                offCanvas.height = h;
                const offCtx = offCanvas.getContext("2d");

                offCtx.drawImage(currentCutoutImg, 0, 0);
                offCtx.globalCompositeOperation = "source-in";
                offCtx.fillStyle = strokeColor;
                offCtx.fillRect(0, 0, w, h);

                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(rotateVal);
                ctx.scale(scaleVal, scaleVal);

                // Multi-angle silhouette stamp
                const steps = 16;
                for (let i = 0; i < steps; i++) {
                    const angle = (i * 2 * Math.PI) / steps;
                    const ox = Math.cos(angle) * strokeW;
                    const oy = Math.sin(angle) * strokeW;
                    ctx.drawImage(offCanvas, -w / 2 + ox, -h / 2 + oy, w, h);
                }
                ctx.restore();
            }
        }

        // 5. Draw Subject Cutout with Edge Feathering
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotateVal);
        ctx.scale(scaleVal, scaleVal);

        if (featherVal > 0) {
            ctx.filter = `blur(${featherVal}px)`;
        }

        ctx.drawImage(currentCutoutImg, -w / 2, -h / 2, w, h);
        ctx.restore();
    }

    // Drag / Pan Cutout on Canvas
    if (bgCompositeCanvas) {
        function getCanvasPanCoords(e) {
            const rect = bgCompositeCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const scaleX = bgCompositeCanvas.width / rect.width;
            const scaleY = bgCompositeCanvas.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        }

        function onPanStart(e) {
            bgIsDraggingSubject = true;
            const p = getCanvasPanCoords(e);
            bgDragStartX = p.x - bgSubjectPanX;
            bgDragStartY = p.y - bgSubjectPanY;
            e.preventDefault();
        }

        function onPanMove(e) {
            if (!bgIsDraggingSubject) return;
            const p = getCanvasPanCoords(e);
            bgSubjectPanX = p.x - bgDragStartX;
            bgSubjectPanY = p.y - bgDragStartY;
            renderBgComposite();
            e.preventDefault();
        }

        function onPanEnd() {
            bgIsDraggingSubject = false;
        }

        bgCompositeCanvas.addEventListener("mousedown", onPanStart);
        window.addEventListener("mousemove", onPanMove);
        window.addEventListener("mouseup", onPanEnd);

        bgCompositeCanvas.addEventListener("touchstart", onPanStart, { passive: false });
        window.addEventListener("touchmove", onPanMove, { passive: false });
        window.addEventListener("touchend", onPanEnd);
    }

    if (bgCenterSubjectBtn) {
        bgCenterSubjectBtn.addEventListener("click", () => {
            bgSubjectPanX = 0;
            bgSubjectPanY = 0;
            renderBgComposite();
            showToast("Subject centered.", "info");
        });
    }

    // Listeners for Sliders & Toggles
    if (bgScaleRange && bgScaleVal) {
        bgScaleRange.addEventListener("input", (e) => {
            bgScaleVal.textContent = `${e.target.value}%`;
            renderBgComposite();
        });
    }
    if (bgRotateRange && bgRotateVal) {
        bgRotateRange.addEventListener("input", (e) => {
            bgRotateVal.textContent = `${e.target.value}°`;
            renderBgComposite();
        });
    }
    if (bgFeatherRange && bgFeatherVal) {
        bgFeatherRange.addEventListener("input", (e) => {
            bgFeatherVal.textContent = `${e.target.value}px`;
            renderBgComposite();
        });
    }

    if (bgStrokeToggle && bgStrokeWidth) {
        bgStrokeToggle.addEventListener("change", (e) => {
            bgStrokeWidth.disabled = !e.target.checked;
            renderBgComposite();
        });
        bgStrokeWidth.addEventListener("input", (e) => {
            if (bgStrokeWidthVal) bgStrokeWidthVal.textContent = `${e.target.value}px`;
            renderBgComposite();
        });
        if (bgStrokeColor) bgStrokeColor.addEventListener("input", renderBgComposite);
    }

    if (bgShadowToggle && bgShadowBlur && bgShadowOpacity) {
        bgShadowToggle.addEventListener("change", (e) => {
            bgShadowBlur.disabled = !e.target.checked;
            bgShadowOpacity.disabled = !e.target.checked;
            renderBgComposite();
        });
        bgShadowBlur.addEventListener("input", (e) => {
            if (bgShadowBlurVal) bgShadowBlurVal.textContent = `${e.target.value}px`;
            renderBgComposite();
        });
        bgShadowOpacity.addEventListener("input", (e) => {
            if (bgShadowOpacityVal) bgShadowOpacityVal.textContent = `${e.target.value}%`;
            renderBgComposite();
        });
    }

    if (bgBackdropBlur && bgBackdropBlurVal) {
        bgBackdropBlur.addEventListener("input", (e) => {
            bgBackdropBlurVal.textContent = `${e.target.value}px`;
            renderBgComposite();
        });
    }

    bgPresetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            bgPresetBtns.forEach(b => b.classList.remove("border-emerald-500", "bg-emerald-500/10", "text-emerald-400"));
            btn.classList.add("border-emerald-500", "bg-emerald-500/10", "text-emerald-400");

            const mode = btn.getAttribute("data-bg-type");
            currentBgMode = mode;
            if (mode === "color") {
                currentBgColor = btn.getAttribute("data-color");
            } else if (mode === "gradient") {
                currentBgGradient = btn.getAttribute("data-gradient");
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
                    showToast("Custom background photo loaded!", "success");
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
                link.download = currentBgMode === "transparent" ? "supiristudio_cutout.png" : "supiristudio_photoroom_pro.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast("High-resolution download started!", "success");
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
    // TOOL 2: 🖌️ MAGIC WATERMARK & OBJECT ERASER PRO
    // ========================================================
    const wmDropzone = document.getElementById("wmDropzone");
    const wmFileInput = document.getElementById("wmFileInput");
    const wmUploadArea = document.getElementById("wmUploadArea");
    const wmCanvasArea = document.getElementById("wmCanvasArea");
    const wmBaseCanvas = document.getElementById("wmBaseCanvas");
    const wmMaskCanvas = document.getElementById("wmMaskCanvas");
    const wmLoupe = document.getElementById("wmLoupe");
    const wmBrushSize = document.getElementById("wmBrushSize");
    const wmBrushSizeVal = document.getElementById("wmBrushSizeVal");
    const wmUndoBtn = document.getElementById("wmUndoBtn");
    const wmRedoBtn = document.getElementById("wmRedoBtn");
    const wmCompareBtn = document.getElementById("wmCompareBtn");
    const wmClearBtn = document.getElementById("wmClearBtn");
    const wmResetBtn = document.getElementById("wmResetBtn");
    const wmProcessBtn = document.getElementById("wmProcessBtn");
    const wmReadyCard = document.getElementById("wmReadyCard");
    const wmDownloadBtn = document.getElementById("wmDownloadBtn");
    const wmProcessAnotherBtn = document.getElementById("wmProcessAnotherBtn");
    const wmFileInfo = document.getElementById("wmFileInfo");

    // Tools & Algos
    const wmToolBtns = document.querySelectorAll(".wm-tool-btn");
    const wmAlgoBtns = document.querySelectorAll(".wm-algo-btn");
    const wmZoomFit = document.getElementById("wmZoomFit");
    const wmZoom100 = document.getElementById("wmZoom100");
    const wmZoom200 = document.getElementById("wmZoom200");

    let wmOriginalImage = null;
    let wmOriginalFile = null;
    let wmCleanResultImg = null;
    let cleanInpaintedBlob = null;

    let wmMode = "brush"; // "brush", "box", "lasso"
    let wmAlgo = "telea_sharp"; // "telea_sharp", "complex_ns", "skin_blemish"
    let brushRadius = 25;
    let isDrawing = false;
    let lastPoint = null;
    let boxStart = null;
    let lassoPoints = [];

    // History stack
    let wmUndoStack = [];
    let wmRedoStack = [];

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
                if (wmCompareBtn) wmCompareBtn.classList.add("hidden");
                showToast("Image loaded! Select Brush, Box, or Lasso to mask watermarks.", "info");
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

        wmUndoStack = [];
        wmRedoStack = [];
        saveWmState();
    }

    function saveWmState() {
        const maskCtx = wmMaskCanvas.getContext("2d");
        wmUndoStack.push(maskCtx.getImageData(0, 0, wmMaskCanvas.width, wmMaskCanvas.height));
        if (wmUndoStack.length > 15) wmUndoStack.shift();
        wmRedoStack = [];
    }

    // Tool Selector Handler
    wmToolBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            wmToolBtns.forEach(b => {
                b.className = "wm-tool-btn px-3 py-1.5 rounded text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5";
            });
            btn.className = "wm-tool-btn active px-3 py-1.5 rounded text-xs font-bold bg-cyan-500 text-slate-950 flex items-center gap-1.5";
            wmMode = btn.getAttribute("data-mode");
            showToast(`Switched to ${wmMode.toUpperCase()} selection mode.`, "info");
        });
    });

    // Inpainting Algorithm Selector Handler
    wmAlgoBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            wmAlgoBtns.forEach(b => {
                b.className = "wm-algo-btn px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200";
            });
            btn.className = "wm-algo-btn active px-3 py-1.5 rounded-lg text-xs font-bold border border-cyan-500 bg-cyan-500/10 text-cyan-400";
            wmAlgo = btn.getAttribute("data-algo");
        });
    });

    if (wmBrushSize && wmBrushSizeVal) {
        wmBrushSize.addEventListener("input", (e) => {
            brushRadius = parseInt(e.target.value, 10);
            wmBrushSizeVal.textContent = `${brushRadius}px`;
        });
    }

    // Zoom Handlers
    function setWmCanvasZoom(scale) {
        const wrapper = document.getElementById("wmCanvasWrapper");
        if (!wrapper) return;
        if (scale === 1.0) {
            wrapper.style.transform = "none";
        } else {
            wrapper.style.transform = `scale(${scale})`;
            wrapper.style.transformOrigin = "center center";
        }
    }
    if (wmZoomFit) wmZoomFit.addEventListener("click", () => setWmCanvasZoom(1.0));
    if (wmZoom100) wmZoom100.addEventListener("click", () => setWmCanvasZoom(1.0));
    if (wmZoom200) wmZoom200.addEventListener("click", () => setWmCanvasZoom(1.8));

    // Magnifier Loupe
    function updateLoupe(e, pt) {
        if (!wmLoupe || !wmBaseCanvas) return;
        wmLoupe.style.display = "block";

        const loupeSize = 120;
        const zoom = 2.5;

        // Position loupe offset from cursor
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = wmMaskCanvas.getBoundingClientRect();

        const xOnElem = clientX - rect.left;
        const yOnElem = clientY - rect.top;

        wmLoupe.style.left = `${xOnElem - loupeSize / 2}px`;
        wmLoupe.style.top = `${yOnElem - loupeSize - 20}px`;

        // Render composite view into loupe background
        wmLoupe.style.backgroundImage = `url(${wmBaseCanvas.toDataURL()})`;
        wmLoupe.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`;
        wmLoupe.style.backgroundPosition = `-${xOnElem * zoom - loupeSize / 2}px -${yOnElem * zoom - loupeSize / 2}px`;
    }

    function hideLoupe() {
        if (wmLoupe) wmLoupe.style.display = "none";
    }

    function getWmCoordinates(e) {
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

    // Painting & Selection Handlers
    function onWmDown(e) {
        e.preventDefault();
        isDrawing = true;
        const pt = getWmCoordinates(e);

        if (wmMode === "brush") {
            lastPoint = pt;
            drawBrushStroke(pt.x, pt.y, true);
        } else if (wmMode === "box") {
            boxStart = pt;
        } else if (wmMode === "lasso") {
            lassoPoints = [pt];
        }

        updateLoupe(e, pt);
    }

    function onWmMove(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pt = getWmCoordinates(e);

        if (wmMode === "brush") {
            drawBrushStroke(pt.x, pt.y);
            lastPoint = pt;
        } else if (wmMode === "lasso") {
            lassoPoints.push(pt);
            // Draw live lasso track
            const ctx = wmMaskCanvas.getContext("2d");
            ctx.strokeStyle = "rgba(239, 68, 68, 0.8)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
            for (let i = 1; i < lassoPoints.length; i++) {
                ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
            }
            ctx.stroke();
        }

        updateLoupe(e, pt);
    }

    function onWmUp(e) {
        if (!isDrawing) return;
        isDrawing = false;
        hideLoupe();

        const ctx = wmMaskCanvas.getContext("2d");

        if (wmMode === "box" && boxStart) {
            const pt = getWmCoordinates(e.changedTouches ? e.changedTouches[0] : e);
            const bx = Math.min(boxStart.x, pt.x);
            const by = Math.min(boxStart.y, pt.y);
            const bw = Math.abs(pt.x - boxStart.x);
            const bh = Math.abs(pt.y - boxStart.y);

            ctx.fillStyle = "rgba(239, 68, 68, 0.65)";
            ctx.fillRect(bx, by, bw, bh);
            boxStart = null;
        } else if (wmMode === "lasso" && lassoPoints.length > 2) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.65)";
            ctx.beginPath();
            ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
            for (let i = 1; i < lassoPoints.length; i++) {
                ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
            }
            ctx.closePath();
            ctx.fill();
            lassoPoints = [];
        }

        lastPoint = null;
        saveWmState();
    }

    function drawBrushStroke(x, y, isFirst = false) {
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
        wmMaskCanvas.addEventListener("mousedown", onWmDown);
        window.addEventListener("mousemove", onWmMove);
        window.addEventListener("mouseup", onWmUp);

        wmMaskCanvas.addEventListener("touchstart", onWmDown, { passive: false });
        window.addEventListener("touchmove", onWmMove, { passive: false });
        window.addEventListener("touchend", onWmUp);
    }

    // Undo / Redo
    if (wmUndoBtn) {
        wmUndoBtn.addEventListener("click", () => {
            if (wmUndoStack.length > 1) {
                const cur = wmUndoStack.pop();
                wmRedoStack.push(cur);
                const prevState = wmUndoStack[wmUndoStack.length - 1];
                const ctx = wmMaskCanvas.getContext("2d");
                ctx.putImageData(prevState, 0, 0);
                showToast("Undone last stroke.", "info");
            } else {
                showToast("Nothing to undo.", "warning");
            }
        });
    }

    if (wmRedoBtn) {
        wmRedoBtn.addEventListener("click", () => {
            if (wmRedoStack.length > 0) {
                const nextState = wmRedoStack.pop();
                wmUndoStack.push(nextState);
                const ctx = wmMaskCanvas.getContext("2d");
                ctx.putImageData(nextState, 0, 0);
                showToast("Redone stroke.", "info");
            } else {
                showToast("Nothing to redo.", "warning");
            }
        });
    }

    // Hold-to-Compare Button
    if (wmCompareBtn) {
        const showOriginal = () => {
            if (!wmOriginalImage || !wmBaseCanvas) return;
            const ctx = wmBaseCanvas.getContext("2d");
            ctx.drawImage(wmOriginalImage, 0, 0);
        };
        const showClean = () => {
            if (!wmCleanResultImg || !wmBaseCanvas) return;
            const ctx = wmBaseCanvas.getContext("2d");
            ctx.drawImage(wmCleanResultImg, 0, 0);
        };

        wmCompareBtn.addEventListener("mousedown", showOriginal);
        wmCompareBtn.addEventListener("mouseup", showClean);
        wmCompareBtn.addEventListener("touchstart", showOriginal, { passive: false });
        wmCompareBtn.addEventListener("touchend", showClean);
    }

    if (wmClearBtn) {
        wmClearBtn.addEventListener("click", () => {
            const ctx = wmMaskCanvas.getContext("2d");
            ctx.clearRect(0, 0, wmMaskCanvas.width, wmMaskCanvas.height);
            saveWmState();
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
            wmCleanResultImg = null;
        };
        if (wmResetBtn) wmResetBtn.addEventListener("click", resetHandler);
        if (wmProcessAnotherBtn) wmProcessAnotherBtn.addEventListener("click", resetHandler);
    }

    // Erase Action Trigger
    if (wmProcessBtn) {
        wmProcessBtn.addEventListener("click", () => {
            if (!wmOriginalFile || !wmMaskCanvas) {
                showToast("Please upload an image first.", "error");
                return;
            }

            // Create binary mask
            const maskCanvas = document.createElement("canvas");
            maskCanvas.width = wmMaskCanvas.width;
            maskCanvas.height = wmMaskCanvas.height;
            const maskCtx = maskCanvas.getContext("2d");

            maskCtx.fillStyle = "#000000";
            maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

            const imgData = wmMaskCanvas.getContext("2d").getImageData(0, 0, maskCanvas.width, maskCanvas.height);
            const data = imgData.data;
            let paintedCount = 0;

            const binaryImgData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
            const bData = binaryImgData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] > 10) {
                    bData[i] = 255;
                    bData[i + 1] = 255;
                    bData[i + 2] = 255;
                    bData[i + 3] = 255;
                    paintedCount++;
                }
            }

            if (paintedCount === 0) {
                showToast("Please paint or box-select over the watermark first.", "warning");
                return;
            }

            maskCtx.putImageData(binaryImgData, 0, 0);

            const algoLabels = {
                telea_sharp: "Fast Text & Logo (Sharp)",
                complex_ns: "Complex Texture (Navier-Stokes)",
                skin_blemish: "Portrait / Skin Blemish"
            };

            startProgress(`Inpainting with ${algoLabels[wmAlgo]}...`, "Neural texture synthesis & frequency reconstruction");

            maskCanvas.toBlob((maskBlob) => {
                const formData = new FormData();
                formData.append("image", wmOriginalFile);
                formData.append("mask", maskBlob, "mask.png");
                formData.append("mode", wmAlgo);

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
                    wmCleanResultImg = new Image();
                    wmCleanResultImg.onload = () => {
                        const baseCtx = wmBaseCanvas.getContext("2d");
                        baseCtx.clearRect(0, 0, wmBaseCanvas.width, wmBaseCanvas.height);
                        baseCtx.drawImage(wmCleanResultImg, 0, 0);

                        const mCtx = wmMaskCanvas.getContext("2d");
                        mCtx.clearRect(0, 0, wmMaskCanvas.width, wmMaskCanvas.height);

                        completeProgress(() => {
                            wmReadyCard.classList.remove("hidden");
                            if (wmCompareBtn) wmCompareBtn.classList.remove("hidden");
                            if (wmFileInfo) {
                                wmFileInfo.textContent = `Watermark Erased • ${algoLabels[wmAlgo]} • ${wmCleanResultImg.naturalWidth} × ${wmCleanResultImg.naturalHeight} px • ${formatBytes(blob.size)}`;
                            }
                            showToast("Watermark erased cleanly!", "success");
                        });
                    };
                    wmCleanResultImg.src = URL.createObjectURL(blob);
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
    // TOOL 3: 🎬 VIDEO WATERMARK STUDIO (BLUR/ERASE vs CROP MODE)
    // ========================================================
    const videoDropzone = document.getElementById("videoDropzone");
    const videoFileInput = document.getElementById("videoFileInput");
    const videoUploadArea = document.getElementById("videoUploadArea");
    const videoPlayerArea = document.getElementById("videoPlayerArea");
    const videoPreview = document.getElementById("videoPreview");
    const videoAddBoxBtn = document.getElementById("videoAddBoxBtn");
    const videoResetBtn = document.getElementById("videoResetBtn");
    const videoProcessBtn = document.getElementById("videoProcessBtn");
    const videoProcessBtnText = document.getElementById("videoProcessBtnText");
    const videoReadyCard = document.getElementById("videoReadyCard");
    const videoResultPlayer = document.getElementById("videoResultPlayer");
    const videoDownloadBtn = document.getElementById("videoDownloadBtn");
    const videoProcessAnotherBtn = document.getElementById("videoProcessAnotherBtn");
    const videoFileInfo = document.getElementById("videoFileInfo");

    // Primary Mode Switchers
    const videoModeBlurBtn = document.getElementById("videoModeBlurBtn");
    const videoModeCropBtn = document.getElementById("videoModeCropBtn");
    const videoModeInstructionText = document.getElementById("videoModeInstructionText");
    const delogoBoxesOverlay = document.getElementById("delogoBoxesOverlay");
    const videoCropOverlay = document.getElementById("videoCropOverlay");
    const videoBlurControlsArea = document.getElementById("videoBlurControlsArea");
    const videoCropControlsArea = document.getElementById("videoCropControlsArea");

    // Mode A Controls
    const videoModeBtns = document.querySelectorAll(".video-mode-btn");
    const videoBlurIntensity = document.getElementById("videoBlurIntensity");
    const videoBlurIntensityVal = document.getElementById("videoBlurIntensityVal");
    const videoTimeAllBtn = document.getElementById("videoTimeAllBtn");
    const videoTimeCustomBtn = document.getElementById("videoTimeCustomBtn");
    const videoCustomTimeInputs = document.getElementById("videoCustomTimeInputs");
    const videoWatermarkStart = document.getElementById("videoWatermarkStart");
    const videoWatermarkEnd = document.getElementById("videoWatermarkEnd");

    const videoTextOverlayToggle = document.getElementById("videoTextOverlayToggle");
    const videoTextOverlayInputs = document.getElementById("videoTextOverlayInputs");
    const videoOverlayTypeTextBtn = document.getElementById("videoOverlayTypeTextBtn");
    const videoOverlayTypeLogoBtn = document.getElementById("videoOverlayTypeLogoBtn");
    const videoOverlayTextSection = document.getElementById("videoOverlayTextSection");
    const videoOverlayLogoSection = document.getElementById("videoOverlayLogoSection");
    const videoTextWatermark = document.getElementById("videoTextWatermark");
    const videoTextColor = document.getElementById("videoTextColor");
    const videoTextOpacity = document.getElementById("videoTextOpacity");
    const videoTextOpacityVal = document.getElementById("videoTextOpacityVal");
    const videoLogoFileInput = document.getElementById("videoLogoFileInput");
    const videoLogoFileLabel = document.getElementById("videoLogoFileLabel");
    const videoLogoOpacity = document.getElementById("videoLogoOpacity");
    const videoLogoOpacityVal = document.getElementById("videoLogoOpacityVal");
    const videoTextPosition = document.getElementById("videoTextPosition");

    let videoOverlayMode = "text"; // "text" or "logo"
    let videoLogoFile = null;
    let videoTimeMode = "all"; // "all" or "custom"

    // Mode B Controls
    const videoCropBox = document.getElementById("videoCropBox");
    const cropDimensionBadge = document.getElementById("cropDimensionBadge");
    const cropMaskTop = document.getElementById("cropMaskTop");
    const cropMaskBottom = document.getElementById("cropMaskBottom");
    const cropMaskLeft = document.getElementById("cropMaskLeft");
    const cropMaskRight = document.getElementById("cropMaskRight");
    const videoCropPresetBtns = document.querySelectorAll(".video-crop-preset-btn");

    // Common Video Controls
    const videoRemoveOutro = document.getElementById("videoRemoveOutro");
    const videoMuteToggle = document.getElementById("videoMuteToggle");
    const videoTrimStart = document.getElementById("videoTrimStart");
    const videoTrimEnd = document.getElementById("videoTrimEnd");

    let currentVideoFile = null;
    let cleanVideoBlob = null;
    let videoPrimaryMode = "erase"; // "erase" (Mode A) or "crop" (Mode B)
    let videoRemovalMode = "delogo"; // "delogo", "blur", "pixelate"

    // 4 Delogo Box Elements
    const delogoBoxes = [
        document.getElementById("delogoBox1"),
        document.getElementById("delogoBox2"),
        document.getElementById("delogoBox3"),
        document.getElementById("delogoBox4")
    ];
    let activeBoxCount = 1;

    // Switch between Mode A (Blur/Erase) and Mode B (Crop)
    function setVideoPrimaryMode(mode) {
        videoPrimaryMode = mode;
        if (mode === "crop") {
            videoModeCropBtn.className = "video-primary-mode-btn active flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-glow-cyan flex items-center justify-center gap-2";
            videoModeBlurBtn.className = "video-primary-mode-btn flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-2";

            if (delogoBoxesOverlay) delogoBoxesOverlay.classList.add("hidden");
            if (videoCropOverlay) videoCropOverlay.classList.remove("hidden");
            if (videoBlurControlsArea) videoBlurControlsArea.classList.add("hidden");
            if (videoCropControlsArea) videoCropControlsArea.classList.remove("hidden");
            if (videoAddBoxBtn) videoAddBoxBtn.classList.add("hidden");

            if (videoModeInstructionText) {
                videoModeInstructionText.innerHTML = `<i class="fa-solid fa-crop text-cyan-400 mr-1"></i> Drag crop handles to crop out watermarks & borders:`;
            }
            if (videoProcessBtnText) videoProcessBtnText.textContent = "Crop Video & Export";
            updateCropMasks();
        } else {
            videoModeBlurBtn.className = "video-primary-mode-btn active flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-glow-cyan flex items-center justify-center gap-2";
            videoModeCropBtn.className = "video-primary-mode-btn flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-2";

            if (delogoBoxesOverlay) delogoBoxesOverlay.classList.remove("hidden");
            if (videoCropOverlay) videoCropOverlay.classList.add("hidden");
            if (videoBlurControlsArea) videoBlurControlsArea.classList.remove("hidden");
            if (videoCropControlsArea) videoCropControlsArea.classList.add("hidden");
            if (videoAddBoxBtn && activeBoxCount < 4) videoAddBoxBtn.classList.remove("hidden");

            if (videoModeInstructionText) {
                videoModeInstructionText.innerHTML = `<i class="fa-solid fa-crop-simple text-cyan-400 mr-1"></i> Select watermark area(s) to blur or erase:`;
            }
            if (videoProcessBtnText) videoProcessBtnText.textContent = "Process Video Watermark";
        }
    }

    if (videoModeBlurBtn) videoModeBlurBtn.addEventListener("click", () => setVideoPrimaryMode("erase"));
    if (videoModeCropBtn) videoModeCropBtn.addEventListener("click", () => setVideoPrimaryMode("crop"));

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
            activeBoxCount = 1;
            delogoBoxes[0].classList.remove("hidden");
            delogoBoxes[1].classList.add("hidden");
            delogoBoxes[2].classList.add("hidden");
            delogoBoxes[3].classList.add("hidden");

            delogoBoxes.forEach(b => setupDelogoBoxInteractions(b));
            setupCropFrameInteractions();
            initCropBoxPosition();
            setVideoPrimaryMode("erase");

            showToast("Video loaded! Choose Blur/Erase or Crop Mode.", "info");
        };
    }

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

    // ----------------------------------------------------
    // CROP FRAME INTERACTIVE ENGINE (MODE B)
    // ----------------------------------------------------
    function initCropBoxPosition() {
        if (!videoCropBox || !videoPreview) return;
        const parent = videoCropBox.parentElement.parentElement;
        const pW = parent.clientWidth;
        const pH = parent.clientHeight;

        videoCropBox.style.left = `${pW * 0.05}px`;
        videoCropBox.style.top = `${pH * 0.05}px`;
        videoCropBox.style.width = `${pW * 0.9}px`;
        videoCropBox.style.height = `${pH * 0.9}px`;
        updateCropMasks();
    }

    function updateCropMasks() {
        if (!videoCropBox || !cropMaskTop) return;
        const parent = videoCropBox.parentElement.parentElement;
        const pW = parent.clientWidth;
        const pH = parent.clientHeight;

        const bx = videoCropBox.offsetLeft;
        const by = videoCropBox.offsetTop;
        const bw = videoCropBox.offsetWidth;
        const bh = videoCropBox.offsetHeight;

        // Top Mask
        cropMaskTop.style.top = "0px";
        cropMaskTop.style.left = "0px";
        cropMaskTop.style.width = `${pW}px`;
        cropMaskTop.style.height = `${by}px`;

        // Bottom Mask
        cropMaskBottom.style.top = `${by + bh}px`;
        cropMaskBottom.style.left = "0px";
        cropMaskBottom.style.width = `${pW}px`;
        cropMaskBottom.style.height = `${pH - (by + bh)}px`;

        // Left Mask
        cropMaskLeft.style.top = `${by}px`;
        cropMaskLeft.style.left = "0px";
        cropMaskLeft.style.width = `${bx}px`;
        cropMaskLeft.style.height = `${bh}px`;

        // Right Mask
        cropMaskRight.style.top = `${by}px`;
        cropMaskRight.style.left = `${bx + bw}px`;
        cropMaskRight.style.width = `${pW - (bx + bw)}px`;
        cropMaskRight.style.height = `${bh}px`;

        // Update dimension badge
        if (cropDimensionBadge && videoPreview.videoWidth) {
            const scaleX = videoPreview.videoWidth / pW;
            const scaleY = videoPreview.videoHeight / pH;
            const nativeW = Math.round(bw * scaleX);
            const nativeH = Math.round(bh * scaleY);
            cropDimensionBadge.textContent = `${nativeW} × ${nativeH} px`;
        }
    }

    function setupCropFrameInteractions() {
        if (!videoCropBox) return;

        let isDragging = false;
        let isResizing = false;
        let cropHandle = null;
        let startX, startY, startLeft, startTop, startWidth, startHeight;

        function onMouseDown(e) {
            if (e.target.hasAttribute("data-crop-handle")) {
                isResizing = true;
                cropHandle = e.target.getAttribute("data-crop-handle");
            } else {
                isDragging = true;
            }

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;
            startLeft = videoCropBox.offsetLeft;
            startTop = videoCropBox.offsetTop;
            startWidth = videoCropBox.offsetWidth;
            startHeight = videoCropBox.offsetHeight;

            e.preventDefault();
        }

        function onMouseMove(e) {
            if (!isDragging && !isResizing) return;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;
            const parent = videoCropBox.parentElement.parentElement;
            const maxW = parent.clientWidth;
            const maxH = parent.clientHeight;

            if (isDragging) {
                let newLeft = Math.max(0, Math.min(startLeft + dx, maxW - videoCropBox.offsetWidth));
                let newTop = Math.max(0, Math.min(startTop + dy, maxH - videoCropBox.offsetHeight));
                videoCropBox.style.left = `${newLeft}px`;
                videoCropBox.style.top = `${newTop}px`;
            } else if (isResizing) {
                let newW = startWidth;
                let newH = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;

                if (cropHandle.includes("e")) newW = Math.max(40, Math.min(startWidth + dx, maxW - startLeft));
                if (cropHandle.includes("s")) newH = Math.max(40, Math.min(startHeight + dy, maxH - startTop));
                if (cropHandle.includes("w")) {
                    newW = Math.max(40, startWidth - dx);
                    newLeft = startLeft + (startWidth - newW);
                }
                if (cropHandle.includes("n")) {
                    newH = Math.max(40, startHeight - dy);
                    newTop = startTop + (startHeight - newH);
                }

                videoCropBox.style.width = `${newW}px`;
                videoCropBox.style.height = `${newH}px`;
                videoCropBox.style.left = `${newLeft}px`;
                videoCropBox.style.top = `${newTop}px`;
            }

            updateCropMasks();
        }

        function onMouseUp() {
            isDragging = false;
            isResizing = false;
            cropHandle = null;
        }

        videoCropBox.addEventListener("mousedown", onMouseDown);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        videoCropBox.addEventListener("touchstart", onMouseDown, { passive: false });
        window.addEventListener("touchmove", onMouseMove, { passive: false });
        window.addEventListener("touchend", onMouseUp);
    }

    // Quick Crop Presets Handler
    videoCropPresetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            videoCropPresetBtns.forEach(b => {
                b.className = "video-crop-preset-btn p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-xs font-semibold text-center hover:border-slate-700";
            });
            btn.className = "video-crop-preset-btn active p-2 rounded-lg border border-cyan-500 bg-cyan-500/10 text-cyan-400 text-xs font-bold text-center";

            const preset = btn.getAttribute("data-preset");
            applyCropPreset(preset);
        });
    });

    function applyCropPreset(preset) {
        if (!videoCropBox || !videoPreview) return;
        const parent = videoCropBox.parentElement.parentElement;
        const pW = parent.clientWidth;
        const pH = parent.clientHeight;

        if (preset === "trim_bars") {
            // Cut 5% top and 5% bottom bars (10% total)
            videoCropBox.style.left = "0px";
            videoCropBox.style.width = `${pW}px`;
            videoCropBox.style.top = `${pH * 0.05}px`;
            videoCropBox.style.height = `${pH * 0.9}px`;
            showToast("Trimmed top & bottom bars (10% slice).", "success");
        } else if (preset === "9_16") {
            // 9:16 vertical
            let targetH = pH * 0.95;
            let targetW = targetH * (9 / 16);
            if (targetW > pW) {
                targetW = pW * 0.95;
                targetH = targetW * (16 / 9);
            }
            videoCropBox.style.width = `${targetW}px`;
            videoCropBox.style.height = `${targetH}px`;
            videoCropBox.style.left = `${(pW - targetW) / 2}px`;
            videoCropBox.style.top = `${(pH - targetH) / 2}px`;
        } else if (preset === "16_9") {
            // 16:9 widescreen
            let targetW = pW * 0.95;
            let targetH = targetW * (9 / 16);
            if (targetH > pH) {
                targetH = pH * 0.95;
                targetW = targetH * (16 / 9);
            }
            videoCropBox.style.width = `${targetW}px`;
            videoCropBox.style.height = `${targetH}px`;
            videoCropBox.style.left = `${(pW - targetW) / 2}px`;
            videoCropBox.style.top = `${(pH - targetH) / 2}px`;
        } else if (preset === "1_1") {
            // 1:1 square
            const size = Math.min(pW, pH) * 0.9;
            videoCropBox.style.width = `${size}px`;
            videoCropBox.style.height = `${size}px`;
            videoCropBox.style.left = `${(pW - size) / 2}px`;
            videoCropBox.style.top = `${(pH - size) / 2}px`;
        } else if (preset === "4_5") {
            // 4:5 portrait
            let targetH = pH * 0.92;
            let targetW = targetH * (4 / 5);
            if (targetW > pW) {
                targetW = pW * 0.92;
                targetH = targetW * (5 / 4);
            }
            videoCropBox.style.width = `${targetW}px`;
            videoCropBox.style.height = `${targetH}px`;
            videoCropBox.style.left = `${(pW - targetW) / 2}px`;
            videoCropBox.style.top = `${(pH - targetH) / 2}px`;
        } else {
            // Freeform
            initCropBoxPosition();
        }
        updateCropMasks();
    }

    if (videoAddBoxBtn) {
        videoAddBoxBtn.addEventListener("click", () => {
            if (activeBoxCount < 4) {
                delogoBoxes[activeBoxCount].classList.remove("hidden");
                activeBoxCount++;
                showToast(`Watermark Box #${activeBoxCount} added.`, "info");
                if (activeBoxCount === 4) {
                    videoAddBoxBtn.classList.add("hidden");
                }
            }
        });
    }

    videoModeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            videoModeBtns.forEach(b => {
                b.className = "video-mode-btn p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 text-xs font-semibold text-center hover:border-slate-700";
            });
            btn.className = "video-mode-btn active p-2 rounded-lg border border-cyan-500 bg-cyan-500/10 text-cyan-400 text-xs font-bold text-center";
            videoRemovalMode = btn.getAttribute("data-mode");
        });
    });

    if (videoBlurIntensity && videoBlurIntensityVal) {
        videoBlurIntensity.addEventListener("input", (e) => {
            videoBlurIntensityVal.textContent = `${e.target.value}px`;
        });
    }

    // Time Range Switcher (Entire Video vs Custom Range)
    if (videoTimeAllBtn && videoTimeCustomBtn) {
        videoTimeAllBtn.addEventListener("click", () => {
            videoTimeMode = "all";
            videoTimeAllBtn.className = "px-2 py-0.5 rounded font-bold bg-cyan-500 text-slate-950";
            videoTimeCustomBtn.className = "px-2 py-0.5 rounded font-semibold text-slate-400 hover:text-white";
            if (videoCustomTimeInputs) videoCustomTimeInputs.classList.add("hidden");
        });
        videoTimeCustomBtn.addEventListener("click", () => {
            videoTimeMode = "custom";
            videoTimeCustomBtn.className = "px-2 py-0.5 rounded font-bold bg-cyan-500 text-slate-950";
            videoTimeAllBtn.className = "px-2 py-0.5 rounded font-semibold text-slate-400 hover:text-white";
            if (videoCustomTimeInputs) videoCustomTimeInputs.classList.remove("hidden");
        });
    }

    // Brand Watermark Replacement: Text vs Logo Switcher
    if (videoOverlayTypeTextBtn && videoOverlayTypeLogoBtn) {
        videoOverlayTypeTextBtn.addEventListener("click", () => {
            videoOverlayMode = "text";
            videoOverlayTypeTextBtn.className = "flex-1 py-1 rounded font-bold bg-emerald-500 text-slate-950 flex items-center justify-center gap-1.5";
            videoOverlayTypeLogoBtn.className = "flex-1 py-1 rounded font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1.5";
            if (videoOverlayTextSection) videoOverlayTextSection.classList.remove("hidden");
            if (videoOverlayLogoSection) videoOverlayLogoSection.classList.add("hidden");
        });
        videoOverlayTypeLogoBtn.addEventListener("click", () => {
            videoOverlayMode = "logo";
            videoOverlayTypeLogoBtn.className = "flex-1 py-1 rounded font-bold bg-emerald-500 text-slate-950 flex items-center justify-center gap-1.5";
            videoOverlayTypeTextBtn.className = "flex-1 py-1 rounded font-semibold text-slate-400 hover:text-white flex items-center justify-center gap-1.5";
            if (videoOverlayLogoSection) videoOverlayLogoSection.classList.remove("hidden");
            if (videoOverlayTextSection) videoOverlayTextSection.classList.add("hidden");
        });
    }

    if (videoTextOpacity && videoTextOpacityVal) {
        videoTextOpacity.addEventListener("input", (e) => {
            videoTextOpacityVal.textContent = `${e.target.value}%`;
        });
    }

    if (videoLogoOpacity && videoLogoOpacityVal) {
        videoLogoOpacity.addEventListener("input", (e) => {
            videoLogoOpacityVal.textContent = `${e.target.value}%`;
        });
    }

    if (videoLogoFileInput) {
        videoLogoFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                if (file.size > MAX_FILE_SIZE) {
                    showToast("Logo file exceeds 50 MB limit.", "error");
                    return;
                }
                videoLogoFile = file;
                if (videoLogoFileLabel) videoLogoFileLabel.textContent = file.name;
                showToast("Logo image selected for watermark overlay.", "info");
            }
        });
    }

    if (videoTextOverlayToggle && videoTextOverlayInputs) {
        videoTextOverlayToggle.addEventListener("change", (e) => {
            if (e.target.checked) {
                videoTextOverlayInputs.classList.remove("opacity-50", "pointer-events-none");
            } else {
                videoTextOverlayInputs.classList.add("opacity-50", "pointer-events-none");
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
            videoLogoFile = null;
            if (videoLogoFileLabel) videoLogoFileLabel.textContent = "Choose PNG Logo File";
            activeBoxCount = 1;
            if (videoAddBoxBtn) videoAddBoxBtn.classList.remove("hidden");
        };
        if (videoResetBtn) videoResetBtn.addEventListener("click", resetHandler);
        if (videoProcessAnotherBtn) videoProcessAnotherBtn.addEventListener("click", resetHandler);
    }

    function mapVideoBoxCoords(box) {
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

    function mapVideoCropCoords() {
        const vw = videoPreview.videoWidth;
        const vh = videoPreview.videoHeight;
        const parent = videoCropBox.parentElement.parentElement;
        const pW = parent.clientWidth;
        const pH = parent.clientHeight;

        if (!vw || !vh || !pW || !pH) return null;

        const scaleX = vw / pW;
        const scaleY = vh / pH;

        const x = Math.round(videoCropBox.offsetLeft * scaleX);
        const y = Math.round(videoCropBox.offsetTop * scaleY);
        const w = Math.round(videoCropBox.offsetWidth * scaleX);
        const h = Math.round(videoCropBox.offsetHeight * scaleY);

        return {
            x: Math.max(0, Math.min(x, vw - 2)),
            y: Math.max(0, Math.min(y, vh - 2)),
            w: Math.max(10, Math.min(w, vw - x)),
            h: Math.max(10, Math.min(h, vh - y))
        };
    }

    // Video Processing Action Trigger
    if (videoProcessBtn) {
        videoProcessBtn.addEventListener("click", () => {
            if (!currentVideoFile || !videoPreview) {
                showToast("Please upload a video first.", "error");
                return;
            }

            const formData = new FormData();
            formData.append("video", currentVideoFile);
            formData.append("mode", videoPrimaryMode);

            // ---------------------------------------------
            // MODE B: CROP MODE
            // ---------------------------------------------
            if (videoPrimaryMode === "crop") {
                const cropCoords = mapVideoCropCoords();
                if (!cropCoords) {
                    showToast("Unable to calculate video crop dimensions.", "error");
                    return;
                }
                formData.append("crop_x", cropCoords.x);
                formData.append("crop_y", cropCoords.y);
                formData.append("crop_w", cropCoords.w);
                formData.append("crop_h", cropCoords.h);

                // Optional watermark overlay on crop mode too
                if (videoTextOverlayToggle && videoTextOverlayToggle.checked) {
                    formData.append("overlay_type", videoOverlayMode);
                    if (videoOverlayMode === "logo" && videoLogoFile) {
                        formData.append("logo_file", videoLogoFile);
                        formData.append("text_opacity", videoLogoOpacity ? videoLogoOpacity.value : "90");
                    } else if (videoTextWatermark && videoTextWatermark.value.trim()) {
                        formData.append("text_watermark", videoTextWatermark.value.trim());
                        formData.append("text_color", videoTextColor ? videoTextColor.value : "#FFFFFF");
                        formData.append("text_opacity", videoTextOpacity ? videoTextOpacity.value : "90");
                    }
                    formData.append("text_position", videoTextPosition ? videoTextPosition.value : "bottom_right");
                }

                startProgress("Cropping Video with Hardware Precision...", "Applying spatial boundary cut & re-encoding");
            }
            // ---------------------------------------------
            // MODE A: BLUR / ERASE MODE
            // ---------------------------------------------
            else {
                const boxesPayload = [];
                for (let i = 0; i < activeBoxCount; i++) {
                    const boxElem = delogoBoxes[i];
                    if (boxElem && !boxElem.classList.contains("hidden")) {
                        const coords = mapVideoBoxCoords(boxElem);
                        if (coords) {
                            const boxObj = {
                                id: i + 1,
                                x: coords.x,
                                y: coords.y,
                                w: coords.w,
                                h: coords.h,
                                mode: videoRemovalMode
                            };

                            // Check Custom Time Range
                            if (videoTimeMode === "custom") {
                                const customStart = parseFloat(videoWatermarkStart ? videoWatermarkStart.value : "");
                                const customEnd = parseFloat(videoWatermarkEnd ? videoWatermarkEnd.value : "");
                                if (!isNaN(customStart)) boxObj.start = customStart;
                                if (!isNaN(customEnd)) boxObj.end = customEnd;
                            }

                            boxesPayload.push(boxObj);
                        }
                    }
                }

                if (boxesPayload.length === 0) {
                    showToast("Unable to calculate watermark box coordinates.", "error");
                    return;
                }

                formData.append("boxes_json", JSON.stringify(boxesPayload));
                formData.append("blur_intensity", videoBlurIntensity ? videoBlurIntensity.value : "20");

                // Custom Watermark Replacement (Text or PNG Logo)
                if (videoTextOverlayToggle && videoTextOverlayToggle.checked) {
                    formData.append("overlay_type", videoOverlayMode);
                    if (videoOverlayMode === "logo" && videoLogoFile) {
                        formData.append("logo_file", videoLogoFile);
                        formData.append("text_opacity", videoLogoOpacity ? videoLogoOpacity.value : "90");
                    } else if (videoTextWatermark && videoTextWatermark.value.trim()) {
                        formData.append("text_watermark", videoTextWatermark.value.trim());
                        formData.append("text_color", videoTextColor ? videoTextColor.value : "#FFFFFF");
                        formData.append("text_opacity", videoTextOpacity ? videoTextOpacity.value : "90");
                    }
                    formData.append("text_position", videoTextPosition ? videoTextPosition.value : "bottom_right");
                }

                startProgress("Processing Video Delogo Studio...", "Applying FFmpeg spatial reconstruction across video frames");
            }

            // Common Options
            if (videoRemoveOutro && videoRemoveOutro.checked) {
                formData.append("remove_outro", "true");
            }
            if (videoMuteToggle && videoMuteToggle.checked) {
                formData.append("mute_audio", "true");
            }
            const tStart = parseFloat(videoTrimStart ? videoTrimStart.value : "");
            const tEnd = parseFloat(videoTrimEnd ? videoTrimEnd.value : "");
            if (!isNaN(tStart)) formData.append("trim_start", tStart);
            if (!isNaN(tEnd)) formData.append("trim_end", tEnd);

            fetch("/api/video/delogo", {
                method: "POST",
                body: formData
            })
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: "Video processing failed" }));
                    throw new Error(err.detail || "Server error");
                }
                return res.blob();
            })
            .then(blob => {
                cleanVideoBlob = blob;
                videoResultPlayer.src = URL.createObjectURL(blob);

                completeProgress(() => {
                    videoReadyCard.classList.remove("hidden");
                    if (videoFileInfo) {
                        const modeLabel = videoPrimaryMode === "crop" ? "Video Crop Complete" : "Watermark Delogo Complete";
                        videoFileInfo.textContent = `${modeLabel} • Ultrafast Hardware Engine • Clean MP4 • ${formatBytes(blob.size)}`;
                    }
                    showToast("Video processing completed successfully!", "success");
                });
            })
            .catch(err => {
                hideProgress();
                showToast(err.message || "Video processing failed.", "error");
            });
        });
    }

    if (videoDownloadBtn) {
        videoDownloadBtn.addEventListener("click", () => {
            if (!cleanVideoBlob) return;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(cleanVideoBlob);
            link.download = videoPrimaryMode === "crop" ? "supiristudio_cropped_video.mp4" : "supiristudio_clean_video.mp4";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Video download started!", "success");
        });
    }

    // ========================================================
    // TOOL 4: 🪪 BIOMETRIC ID, PASSPORT & VISA STUDIO PRO
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
    const idFormatA4Btn = document.getElementById("idFormatA4Btn");
    const idScaleRange = document.getElementById("idScaleRange");
    const idRotateBtn = document.getElementById("idRotateBtn");
    const idFlipBtn = document.getElementById("idFlipBtn");
    const idToggleGuide = document.getElementById("idToggleGuide");
    const idBrightness = document.getElementById("idBrightness");
    const idBrightVal = document.getElementById("idBrightVal");
    const idContrast = document.getElementById("idContrast");
    const idContrastVal = document.getElementById("idContrastVal");
    const idWarmth = document.getElementById("idWarmth");
    const idWarmthVal = document.getElementById("idWarmthVal");
    const idSkinSoft = document.getElementById("idSkinSoft");
    const idSkinVal = document.getElementById("idSkinVal");
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
    let idRotation = 0;
    let idIsFlipped = false;
    let idPanX = 0;
    let idPanY = 0;
    let idBgColor = "#FFFFFF";
    let idFormatType = "single"; // "single", "sheet_4x6", "sheet_a4"
    let idGeneratedBlob = null;

    let idIsDragging = false;
    let idDragStartX = 0;
    let idDragStartY = 0;

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
                idIsFlipped = false;
                idPanX = 0;
                idPanY = 0;
                if (idScaleRange) idScaleRange.value = "1.0";
                renderIdCanvas();
                showToast("Portrait loaded into Biometric Studio!", "info");
            };
            idSourceImg.src = e.target.result;
        };
        reader.readAsDataURL(blob);
    }

    function getPresetTargetDimensions() {
        const preset = idPresetSelect ? idPresetSelect.value : "sl_passport";
        if (preset === "sl_passport" || preset === "uk_visa") {
            return { w: 350, h: 450, label: "35 × 45 mm (SL Passport/NIC / UK Visa)" };
        } else if (preset === "sl_license") {
            return { w: 300, h: 360, label: "25 × 30 mm (SL Driving License)" };
        } else if (preset === "us_visa") {
            return { w: 400, h: 400, label: "2 × 2 inch (US / India Visa)" };
        } else {
            return { w: 400, h: 400, label: "800 × 800 px (LinkedIn HD Profile)" };
        }
    }

    function renderIdCanvas() {
        if (!idCanvas || !idSourceImg) return;
        const ctx = idCanvas.getContext("2d");
        const dims = getPresetTargetDimensions();

        idCanvas.width = dims.w;
        idCanvas.height = dims.h;

        if (idBgColor !== "transparent") {
            ctx.fillStyle = idBgColor;
            ctx.fillRect(0, 0, dims.w, dims.h);
        } else {
            ctx.clearRect(0, 0, dims.w, dims.h);
        }

        ctx.save();
        ctx.translate(dims.w / 2 + idPanX, dims.h / 2 + idPanY);
        ctx.rotate((idRotation * Math.PI) / 180);
        ctx.scale(idIsFlipped ? -idScale : idScale, idScale);

        // Portrait Enhancer Filters on Canvas Preview
        const bright = (idBrightness ? parseInt(idBrightness.value, 10) : 100) / 100;
        const contrast = (idContrast ? parseInt(idContrast.value, 10) : 100) / 100;
        ctx.filter = `brightness(${bright}) contrast(${contrast})`;

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

        // Biometric Face Alignment Overlay Grid
        if (idToggleGuide && idToggleGuide.checked) {
            ctx.save();
            ctx.strokeStyle = "rgba(16, 185, 129, 0.5)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);

            // Center vertical axis
            ctx.beginPath();
            ctx.moveTo(dims.w / 2, 0);
            ctx.lineTo(dims.w / 2, dims.h);
            ctx.stroke();

            // Eye-level horizontal line (55% from top)
            ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
            ctx.beginPath();
            ctx.moveTo(0, dims.h * 0.52);
            ctx.lineTo(dims.w, dims.h * 0.52);
            ctx.stroke();

            // Head Oval (Biometric Standard 70-80% of photo height)
            ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
            ctx.beginPath();
            ctx.ellipse(dims.w / 2, dims.h * 0.46, dims.w * 0.28, dims.h * 0.32, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Chin line
            ctx.strokeStyle = "rgba(245, 158, 11, 0.5)";
            ctx.beginPath();
            ctx.moveTo(dims.w * 0.25, dims.h * 0.78);
            ctx.lineTo(dims.w * 0.75, dims.h * 0.78);
            ctx.stroke();

            ctx.restore();
        }
    }

    // Canvas Panning Handlers
    if (idCanvas) {
        function getIdCoords(e) {
            const rect = idCanvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        idCanvas.addEventListener("mousedown", (e) => {
            idIsDragging = true;
            const p = getIdCoords(e);
            idDragStartX = p.x - idPanX;
            idDragStartY = p.y - idPanY;
            e.preventDefault();
        });

        window.addEventListener("mousemove", (e) => {
            if (!idIsDragging) return;
            const p = getIdCoords(e);
            idPanX = p.x - idDragStartX;
            idPanY = p.y - idDragStartY;
            renderIdCanvas();
        });

        window.addEventListener("mouseup", () => {
            idIsDragging = false;
        });

        idCanvas.addEventListener("touchstart", (e) => {
            idIsDragging = true;
            const p = getIdCoords(e);
            idDragStartX = p.x - idPanX;
            idDragStartY = p.y - idPanY;
            e.preventDefault();
        }, { passive: false });

        window.addEventListener("touchmove", (e) => {
            if (!idIsDragging) return;
            const p = getIdCoords(e);
            idPanX = p.x - idDragStartX;
            idPanY = p.y - idDragStartY;
            renderIdCanvas();
        }, { passive: false });

        window.addEventListener("touchend", () => {
            idIsDragging = false;
        });
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

    if (idFlipBtn) {
        idFlipBtn.addEventListener("click", () => {
            idIsFlipped = !idIsFlipped;
            renderIdCanvas();
            showToast("Portrait mirrored.", "info");
        });
    }

    if (idToggleGuide) idToggleGuide.addEventListener("change", renderIdCanvas);

    // Portrait Enhancers Listeners
    if (idBrightness && idBrightVal) {
        idBrightness.addEventListener("input", (e) => {
            idBrightVal.textContent = `${e.target.value}%`;
            renderIdCanvas();
        });
    }
    if (idContrast && idContrastVal) {
        idContrast.addEventListener("input", (e) => {
            idContrastVal.textContent = `${e.target.value}%`;
            renderIdCanvas();
        });
    }
    if (idWarmth && idWarmthVal) {
        idWarmth.addEventListener("input", (e) => {
            idWarmthVal.textContent = e.target.value;
            renderIdCanvas();
        });
    }
    if (idSkinSoft && idSkinVal) {
        idSkinSoft.addEventListener("input", (e) => {
            idSkinVal.textContent = `${e.target.value}%`;
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

    if (idFormatSingleBtn && idFormatSheetBtn && idFormatA4Btn) {
        const resetFormatBtns = () => {
            [idFormatSingleBtn, idFormatSheetBtn, idFormatA4Btn].forEach(b => {
                b.className = "id-format-btn flex-1 py-1.5 px-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-xs font-bold";
            });
        };

        idFormatSingleBtn.addEventListener("click", () => {
            resetFormatBtns();
            idFormatType = "single";
            idFormatSingleBtn.className = "id-format-btn active flex-1 py-1.5 px-1.5 rounded-lg border border-emerald-500 bg-emerald-500/10 text-emerald-400 text-xs font-bold";
        });

        idFormatSheetBtn.addEventListener("click", () => {
            resetFormatBtns();
            idFormatType = "sheet_4x6";
            idFormatSheetBtn.className = "id-format-btn active flex-1 py-1.5 px-1.5 rounded-lg border border-emerald-500 bg-emerald-500/10 text-emerald-400 text-xs font-bold";
        });

        idFormatA4Btn.addEventListener("click", () => {
            resetFormatBtns();
            idFormatType = "sheet_a4";
            idFormatA4Btn.className = "id-format-btn active flex-1 py-1.5 px-1.5 rounded-lg border border-emerald-500 bg-emerald-500/10 text-emerald-400 text-xs font-bold";
        });
    }

    // Generate Biometric ID & Passport Photo
    if (idGenerateBtn) {
        idGenerateBtn.addEventListener("click", () => {
            if (!idSourceBlob) {
                showToast("Please upload a portrait photo first.", "error");
                return;
            }

            startProgress("Rendering Biometric Passport Studio...", "Applying 300 DPI layout, skin retouch, and crop marks");

            const formData = new FormData();
            formData.append("image", idSourceBlob);
            formData.append("format_type", idFormatType);
            formData.append("crop_preset", idPresetSelect ? idPresetSelect.value : "sl_passport");
            formData.append("bg_color", idBgColor);
            formData.append("dpi", "300");

            const bright = (idBrightness ? parseInt(idBrightness.value, 10) : 100) / 100;
            const contrast = (idContrast ? parseInt(idContrast.value, 10) : 100) / 100;
            const warmth = (idWarmth ? parseInt(idWarmth.value, 10) : 0) / 100;
            const skin = (idSkinSoft ? parseInt(idSkinSoft.value, 10) : 0) / 100;

            formData.append("brightness", bright);
            formData.append("contrast", contrast);
            formData.append("warmth", warmth);
            formData.append("skin_soft", skin);
            formData.append("show_guides", "true");
            formData.append("photo_border", "true");

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
                        let sheetLabel = "Single Photo (300 DPI)";
                        if (idFormatType === "sheet_4x6") sheetLabel = "4×6\" Sheet (8 Photos Grid)";
                        if (idFormatType === "sheet_a4") sheetLabel = "A4 Sheet (24 Photos Grid)";
                        idFileInfo.textContent = `${dims.label} • ${sheetLabel} • ${formatBytes(blob.size)}`;
                    }
                    showToast("Biometric Photo generated successfully!", "success");
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
            link.download = idFormatType === "single" ? "supiristudio_passport_photo.png" : "supiristudio_passport_sheet.jpg";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Passport photo download started!", "success");
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
