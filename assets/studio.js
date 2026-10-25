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

    function switchTab(targetId) {
        if (!targetId) return;

        tabButtons.forEach(btn => {
            const isTarget = btn.getAttribute("data-target") === targetId;
            if (isTarget) {
                btn.className = "tab-btn active flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-xs lg:text-[13px] font-bold transition-all duration-200 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-glow-emerald";
            } else {
                btn.className = "tab-btn flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-xs sm:text-xs lg:text-[13px] font-semibold transition-all duration-200 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/50";
            }
        });

        const allPanels = document.querySelectorAll(".tab-panel, .tool-panel");
        allPanels.forEach(panel => {
            if (panel.id === targetId) {
                panel.classList.remove("hidden");
                panel.style.display = "block";
            } else {
                panel.classList.add("hidden");
                panel.style.display = "none";
            }
        });

        const activePanel = document.getElementById(targetId);
        if (activePanel) {
            window.scrollTo({ top: activePanel.offsetTop - 80, behavior: "smooth" });
        }
    }
    window.switchTab = switchTab;

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
    // TOOL 1: ✂️ ADVANCED AI BG REMOVER & PRODUCT STUDIO PRO
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

    // Mode Selector (Auto AI vs Portrait Hair vs Manual Interactive)
    const bgModeAutoBtn = document.getElementById("bgModeAutoBtn");
    const bgModePortraitBtn = document.getElementById("bgModePortraitBtn");
    const bgModeManualBtn = document.getElementById("bgModeManualBtn");
    let bgUploadMode = "auto_general"; // "auto_general", "auto_portrait", "interactive_scribble"

    // Touch-Up Toolbar Controls
    const bgTouchupPanBtn = document.getElementById("bgTouchupPanBtn");
    const bgTouchupRestoreBtn = document.getElementById("bgTouchupRestoreBtn");
    const bgTouchupEraseBtn = document.getElementById("bgTouchupEraseBtn");
    const bgTouchupWandBtn = document.getElementById("bgTouchupWandBtn");
    const bgTouchupSize = document.getElementById("bgTouchupBrushSize") || document.getElementById("bgTouchupSize");
    const bgTouchupSizeVal = document.getElementById("bgTouchupBrushSizeVal") || document.getElementById("bgTouchupSizeVal");
    const bgWandToleranceContainer = document.getElementById("bgWandToleranceContainer");
    const bgWandTolerance = document.getElementById("bgWandTolerance");
    const bgWandToleranceVal = document.getElementById("bgWandToleranceVal");
    const bgCompareBtn = document.getElementById("bgCompareBtn");
    const bgTouchupUndoBtn = document.getElementById("bgTouchupUndoBtn");
    const bgTouchupResetBtn = document.getElementById("bgTouchupResetBtn");

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

    // Product Reflection & Shadow Controls
    const bgReflectionToggle = document.getElementById("bgReflectionToggle");
    const bgReflectionHeight = document.getElementById("bgReflectionHeight");
    const bgReflectionHeightVal = document.getElementById("bgReflectionHeightVal");
    const bgReflectionOpacity = document.getElementById("bgReflectionOpacity");
    const bgReflectionOpacityVal = document.getElementById("bgReflectionOpacityVal");
    const bgFloorShadowToggle = document.getElementById("bgFloorShadowToggle");
    const bgFloorShadowWidth = document.getElementById("bgFloorShadowWidth");
    const bgFloorShadowWidthVal = document.getElementById("bgFloorShadowWidthVal");
    const bgFloorShadowOpacity = document.getElementById("bgFloorShadowOpacity");
    const bgFloorShadowOpacityVal = document.getElementById("bgFloorShadowOpacityVal");

    // 3D Text Overlay Controls
    const bgTextToggle = document.getElementById("bgTextToggle") || document.getElementById("bgTextOverlayToggle");
    const bgTextInput = document.getElementById("bgTextInput");
    const bgTextColor = document.getElementById("bgTextColor");
    const bgTextStrokeColor = document.getElementById("bgTextStrokeColor");
    const bgTextSize = document.getElementById("bgTextSize");
    const bgTextSizeVal = document.getElementById("bgTextSizeVal");
    const bgTextLayerOrder = document.getElementById("bgTextLayerOrder");

    // Core Canvas & Cutout Memory
    let currentSourceImg = null;       // Original source image
    let currentCutoutCanvas = null;    // Dynamic offscreen canvas holding alpha cutout
    let initialCutoutCanvas = null;    // Initial state for reset
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

    // Manual Touch-up State
    let bgCurrentTouchupTool = "none"; // "none" (Pan/Move), "erase", "restore", "wand"
    let bgTouchupHistory = [];
    let bgIsPaintingTouchup = false;
    let bgLastTouchupX = null;
    let bgLastTouchupY = null;

    // Mode Selector Handler (Auto AI vs Portrait Hair vs Manual Cutout)
    function setBgUploadMode(mode) {
        bgUploadMode = mode;
        const modeList = [
            { btn: bgModeAutoBtn, mode: "auto_general" },
            { btn: bgModePortraitBtn, mode: "auto_portrait" },
            { btn: bgModeManualBtn, mode: "interactive_scribble" }
        ];

        modeList.forEach(item => {
            if (!item.btn) return;
            if (item.mode === mode) {
                item.btn.className = "bg-mode-btn active flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-glow-emerald flex items-center justify-center gap-1.5";
            } else {
                item.btn.className = "bg-mode-btn flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center gap-1.5";
            }
        });

        if (mode === "auto_general") {
            showToast("Mode: Auto AI (People & Products) — Fast ONNX neural cutout.", "info");
        } else if (mode === "auto_portrait") {
            showToast("Mode: Portrait Hair Pro — Deep learning hair & face matting.", "info");
        } else if (mode === "interactive_scribble") {
            showToast("Mode: Manual Brush Cutout — Interactive paint & erase on canvas.", "info");
        }
    }

    if (bgModeAutoBtn) bgModeAutoBtn.addEventListener("click", () => setBgUploadMode("auto_general"));
    if (bgModePortraitBtn) bgModePortraitBtn.addEventListener("click", () => setBgUploadMode("auto_portrait"));
    if (bgModeManualBtn) bgModeManualBtn.addEventListener("click", () => setBgUploadMode("interactive_scribble"));

    // Touchup Tools Switching
    function setTouchupTool(tool) {
        if (tool === "pan") tool = "none";
        bgCurrentTouchupTool = tool;

        const tools = [
            { btn: bgTouchupPanBtn, id: "none" },
            { btn: bgTouchupRestoreBtn, id: "restore" },
            { btn: bgTouchupEraseBtn, id: "erase" },
            { btn: bgTouchupWandBtn, id: "wand" }
        ];

        tools.forEach(t => {
            if (!t.btn) return;
            if (t.id === tool) {
                t.btn.classList.add("bg-emerald-500/20", "border-emerald-500", "text-emerald-300", "shadow-sm");
                t.btn.classList.remove("border-slate-800", "bg-slate-900", "text-slate-300");
            } else {
                t.btn.classList.remove("bg-emerald-500/20", "border-emerald-500", "text-emerald-300", "shadow-sm");
                t.btn.classList.add("border-slate-800", "bg-slate-900", "text-slate-300");
            }
        });

        if (bgWandToleranceContainer) {
            if (tool === "wand") {
                bgWandToleranceContainer.classList.remove("hidden");
            } else {
                bgWandToleranceContainer.classList.add("hidden");
            }
        }

        if (tool === "none") {
            showToast("Pan Mode: Drag subject to position.", "info");
        } else if (tool === "restore") {
            showToast("🟢 Restore Brush (ආපහු ගන්න): Paint to restore original pixels.", "info");
        } else if (tool === "erase") {
            showToast("🔴 Erase Brush (මකන්න): Paint to erase unwanted background spots.", "info");
        } else if (tool === "wand") {
            showToast("🪄 Magic Color Eraser (එක පාටක් මකන්න): Click any pixel to flood erase.", "info");
        }
    }

    if (bgTouchupPanBtn) bgTouchupPanBtn.addEventListener("click", () => setTouchupTool("none"));
    if (bgTouchupRestoreBtn) bgTouchupRestoreBtn.addEventListener("click", () => setTouchupTool("restore"));
    if (bgTouchupEraseBtn) bgTouchupEraseBtn.addEventListener("click", () => setTouchupTool("erase"));
    if (bgTouchupWandBtn) bgTouchupWandBtn.addEventListener("click", () => setTouchupTool("wand"));

    // Hold Compare Button
    if (bgCompareBtn) {
        const showOriginal = (e) => {
            if (e) e.preventDefault();
            if (!currentSourceImg || !bgCompositeCanvas) return;
            const ctx = bgCompositeCanvas.getContext("2d");
            const w = bgCompositeCanvas.width;
            const h = bgCompositeCanvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(currentSourceImg, 0, 0, w, h);
        };
        const restoreComposite = (e) => {
            if (e) e.preventDefault();
            renderBgComposite();
        };

        bgCompareBtn.addEventListener("mousedown", showOriginal);
        bgCompareBtn.addEventListener("mouseup", restoreComposite);
        bgCompareBtn.addEventListener("mouseleave", restoreComposite);
        bgCompareBtn.addEventListener("touchstart", showOriginal, { passive: false });
        bgCompareBtn.addEventListener("touchend", restoreComposite);
        bgCompareBtn.addEventListener("touchcancel", restoreComposite);
    }

    if (bgTouchupSize && bgTouchupSizeVal) {
        bgTouchupSize.addEventListener("input", (e) => {
            bgTouchupSizeVal.textContent = `${e.target.value}px`;
        });
    }

    if (bgWandTolerance && bgWandToleranceVal) {
        bgWandTolerance.addEventListener("input", (e) => {
            bgWandToleranceVal.textContent = e.target.value;
        });
    }

    function saveCutoutHistory() {
        if (!currentCutoutCanvas) return;
        const ctx = currentCutoutCanvas.getContext("2d");
        bgTouchupHistory.push(ctx.getImageData(0, 0, currentCutoutCanvas.width, currentCutoutCanvas.height));
        if (bgTouchupHistory.length > 10) bgTouchupHistory.shift();
    }

    if (bgTouchupUndoBtn) {
        bgTouchupUndoBtn.addEventListener("click", () => {
            if (!currentCutoutCanvas || bgTouchupHistory.length === 0) {
                showToast("No touch-up actions to undo.", "warning");
                return;
            }
            const prev = bgTouchupHistory.pop();
            const ctx = currentCutoutCanvas.getContext("2d");
            ctx.putImageData(prev, 0, 0);
            renderBgComposite();
            showToast("Undo successful.", "info");
        });
    }

    if (bgTouchupResetBtn) {
        bgTouchupResetBtn.addEventListener("click", () => {
            if (!currentCutoutCanvas || !initialCutoutCanvas) return;
            const ctx = currentCutoutCanvas.getContext("2d");
            ctx.clearRect(0, 0, currentCutoutCanvas.width, currentCutoutCanvas.height);
            ctx.drawImage(initialCutoutCanvas, 0, 0);
            bgTouchupHistory = [];
            renderBgComposite();
            showToast("Cutout reset to initial state.", "info");
        });
    }

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

    function initCutoutCanvases(width, height) {
        currentCutoutCanvas = document.createElement("canvas");
        currentCutoutCanvas.width = width;
        currentCutoutCanvas.height = height;

        initialCutoutCanvas = document.createElement("canvas");
        initialCutoutCanvas.width = width;
        initialCutoutCanvas.height = height;
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

        const reader = new FileReader();
        reader.onload = (e) => {
            currentSourceImg = new Image();
            currentSourceImg.onload = () => {
                const w = currentSourceImg.naturalWidth;
                const h = currentSourceImg.naturalHeight;
                initCutoutCanvases(w, h);

                if (bgUploadMode === "interactive_scribble") {
                    // Manual Mode: Load original image directly for interactive painting/wand cut
                    const ctx = currentCutoutCanvas.getContext("2d");
                    ctx.drawImage(currentSourceImg, 0, 0);

                    const initCtx = initialCutoutCanvas.getContext("2d");
                    initCtx.drawImage(currentSourceImg, 0, 0);

                    bgUploadArea.classList.add("hidden");
                    bgEditorArea.classList.remove("hidden");
                    bgSubjectPanX = 0;
                    bgSubjectPanY = 0;
                    setTouchupTool("erase");
                    renderBgComposite();
                    if (bgFileInfo) {
                        bgFileInfo.textContent = `Manual Interactive Cutout • ${w} × ${h} px • ${formatBytes(file.size)}`;
                    }
                    showToast("Image loaded in Manual Cutout mode! Use Erase Brush or Magic Color Eraser.", "success");
                } else {
                    // Real AI Deep Learning Mode (rembg ONNX session with u2netp or u2net_human_seg)
                    const isPortrait = bgUploadMode === "auto_portrait";
                    const pTitle = isPortrait ? "AI Portrait Hair Matting..." : "AI Background Segmentation...";
                    const pSub = isPortrait
                        ? "Running u2net_human_seg Deep Learning model for clean hair & skin borders"
                        : "Running u2netp lightweight ONNX neural engine with razor-sharp feathering";

                    startProgress(pTitle, pSub);

                    const formData = new FormData();
                    formData.append("image", file);
                    formData.append("mode", bgUploadMode);

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
                        const cutoutImg = new Image();
                        cutoutImg.onload = () => {
                            const ctx = currentCutoutCanvas.getContext("2d");
                            ctx.clearRect(0, 0, w, h);
                            ctx.drawImage(cutoutImg, 0, 0, w, h);

                            const initCtx = initialCutoutCanvas.getContext("2d");
                            initCtx.clearRect(0, 0, w, h);
                            initCtx.drawImage(cutoutImg, 0, 0, w, h);

                            completeProgress(() => {
                                bgUploadArea.classList.add("hidden");
                                bgEditorArea.classList.remove("hidden");
                                bgSubjectPanX = 0;
                                bgSubjectPanY = 0;
                                setTouchupTool("none");
                                renderBgComposite();
                                if (bgFileInfo) {
                                    const modelLabel = isPortrait ? "Portrait Hair Pro AI" : "Auto AI Deep Neural Cutout";
                                    bgFileInfo.textContent = `${modelLabel} • ${w} × ${h} px • ${formatBytes(blob.size)}`;
                                }
                                showToast("Deep Learning AI Cutout Complete! Edges are crisp & clean.", "success");
                            });
                        };
                        cutoutImg.src = URL.createObjectURL(blob);
                    })
                    .catch(err => {
                        hideProgress();
                        showToast(err.message || "Background removal failed.", "error");
                    });
                }
            };
            currentSourceImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // High-Precision Photoroom Composite & E-Commerce Product Renderer
    function renderBgComposite() {
        if (!currentCutoutCanvas || !bgCompositeCanvas) return;
        const ctx = bgCompositeCanvas.getContext("2d");

        const w = currentCutoutCanvas.width;
        const h = currentCutoutCanvas.height;

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

        // 3. E-Commerce Floor Shadow / Studio Podium (if enabled)
        if (bgFloorShadowToggle && bgFloorShadowToggle.checked) {
            ctx.save();
            const shadowY = centerY + (h * scaleVal) * 0.48;
            const shadowWidthFactor = (bgFloorShadowWidth ? parseInt(bgFloorShadowWidth.value, 10) : 80) / 100;
            const shadowOpacityFactor = (bgFloorShadowOpacity ? parseInt(bgFloorShadowOpacity.value, 10) : 50) / 100;
            const rx = (w * scaleVal) * 0.42 * shadowWidthFactor;
            const ry = (h * scaleVal) * 0.08 * shadowWidthFactor;

            const sGrad = ctx.createRadialGradient(centerX, shadowY, 0, centerX, shadowY, rx);
            sGrad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1, shadowOpacityFactor * 1.5)})`);
            sGrad.addColorStop(0.5, `rgba(0, 0, 0, ${shadowOpacityFactor * 0.7})`);
            sGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.fillStyle = sGrad;
            ctx.beginPath();
            ctx.ellipse(centerX, shadowY, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Helper: Draw 3D Text Overlay
        function draw3DText() {
            if (!bgTextToggle || !bgTextToggle.checked) return;
            const text = bgTextInput ? bgTextInput.value.trim() : "";
            if (!text) return;

            const fSize = bgTextSize ? parseInt(bgTextSize.value, 10) : 48;
            const tColor = bgTextColor ? bgTextColor.value : "#FFFFFF";
            const sColor = bgTextStrokeColor ? bgTextStrokeColor.value : "#06b6d4";

            ctx.save();
            ctx.font = `900 ${fSize}px 'Outfit', 'Inter', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineJoin = "round";

            const textY = centerY + (h * scaleVal) * 0.38;

            // 3D Drop Shadow
            ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 6;

            // Outline Stroke
            ctx.lineWidth = Math.max(3, fSize * 0.08);
            ctx.strokeStyle = sColor;
            ctx.strokeText(text, centerX, textY);

            // Fill Text
            ctx.fillStyle = tColor;
            ctx.fillText(text, centerX, textY);
            ctx.restore();
        }

        // Draw Text Behind if order === 'behind'
        if (bgTextLayerOrder && bgTextLayerOrder.value === "behind") {
            draw3DText();
        }

        // 4. E-Commerce Mirror Reflection (Product Mode)
        if (bgReflectionToggle && bgReflectionToggle.checked) {
            const refHPercent = (bgReflectionHeight ? parseInt(bgReflectionHeight.value, 10) : 40) / 100;
            const refOpacity = (bgReflectionOpacity ? parseInt(bgReflectionOpacity.value, 10) : 40) / 100;

            const refCanvas = document.createElement("canvas");
            refCanvas.width = w;
            refCanvas.height = h;
            const rCtx = refCanvas.getContext("2d");

            // Vertically flipped image
            rCtx.save();
            rCtx.translate(0, h);
            rCtx.scale(1, -1);
            rCtx.drawImage(currentCutoutCanvas, 0, 0);
            rCtx.restore();

            // Apply fade gradient mask
            rCtx.globalCompositeOperation = "destination-in";
            const fGrad = rCtx.createLinearGradient(0, 0, 0, h * refHPercent);
            fGrad.addColorStop(0, `rgba(0, 0, 0, ${refOpacity})`);
            fGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            rCtx.fillStyle = fGrad;
            rCtx.fillRect(0, 0, w, h);

            // Draw reflection beneath subject
            ctx.save();
            ctx.translate(centerX, centerY + (h * scaleVal) / 2);
            ctx.rotate(rotateVal);
            ctx.scale(scaleVal, scaleVal);
            ctx.drawImage(refCanvas, -w / 2, 0, w, h);
            ctx.restore();
        }

        // 5. Draw 3D Realistic Drop Shadow (if enabled)
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

            ctx.drawImage(currentCutoutCanvas, -w / 2, -h / 2, w, h);
            ctx.restore();
        }

        // 6. Draw YouTube Thumbnail / Product Outline (Stroke)
        if (bgStrokeToggle && bgStrokeToggle.checked) {
            const strokeW = parseInt(bgStrokeWidth.value, 10);
            const strokeColor = bgStrokeColor ? bgStrokeColor.value : "#FFFFFF";

            if (strokeW > 0) {
                const offCanvas = document.createElement("canvas");
                offCanvas.width = w;
                offCanvas.height = h;
                const offCtx = offCanvas.getContext("2d");

                offCtx.drawImage(currentCutoutCanvas, 0, 0);
                offCtx.globalCompositeOperation = "source-in";
                offCtx.fillStyle = strokeColor;
                offCtx.fillRect(0, 0, w, h);

                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(rotateVal);
                ctx.scale(scaleVal, scaleVal);

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

        // 7. Draw Subject Cutout with Edge Feathering
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotateVal);
        ctx.scale(scaleVal, scaleVal);

        if (featherVal > 0) {
            ctx.filter = `blur(${featherVal}px)`;
        }

        ctx.drawImage(currentCutoutCanvas, -w / 2, -h / 2, w, h);
        ctx.restore();

        // Draw Text In Front if order === 'front'
        if (bgTextLayerOrder && bgTextLayerOrder.value === "front") {
            draw3DText();
        }
    }

    // Coordinate Mapping Helper: Canvas screen coords to Cutout internal coords
    function getCutoutCoords(e) {
        if (!bgCompositeCanvas || !currentCutoutCanvas) return null;
        const rect = bgCompositeCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const canvasX = (clientX - rect.left) * (bgCompositeCanvas.width / rect.width);
        const canvasY = (clientY - rect.top) * (bgCompositeCanvas.height / rect.height);

        const w = currentCutoutCanvas.width;
        const h = currentCutoutCanvas.height;
        const scaleVal = (bgScaleRange ? parseInt(bgScaleRange.value, 10) : 100) / 100;
        const rotateVal = (bgRotateRange ? parseInt(bgRotateRange.value, 10) : 0) * (Math.PI / 180);
        const centerX = w / 2 + bgSubjectPanX;
        const centerY = h / 2 + bgSubjectPanY;

        // Invert pan
        const dx = canvasX - centerX;
        const dy = canvasY - centerY;

        // Invert rotation
        const rx = dx * Math.cos(-rotateVal) - dy * Math.sin(-rotateVal);
        const ry = dx * Math.sin(-rotateVal) + dy * Math.cos(-rotateVal);

        // Invert scale
        const imgX = rx / scaleVal + w / 2;
        const imgY = ry / scaleVal + h / 2;

        return { imgX: Math.round(imgX), imgY: Math.round(imgY), canvasX, canvasY };
    }

    // Magic Wand BFS Flood-Fill Pixel Eraser
    function runMagicWand(startX, startY, tolerance) {
        if (!currentCutoutCanvas) return;
        const ctx = currentCutoutCanvas.getContext("2d");
        const w = currentCutoutCanvas.width;
        const h = currentCutoutCanvas.height;

        if (startX < 0 || startX >= w || startY < 0 || startY >= h) return;

        saveCutoutHistory();
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const startIdx = (startY * w + startX) * 4;
        const targetR = data[startIdx];
        const targetG = data[startIdx + 1];
        const targetB = data[startIdx + 2];
        const targetA = data[startIdx + 3];

        if (targetA === 0) {
            showToast("Clicked pixel is already transparent.", "info");
            return;
        }

        const maxDiff = tolerance * 2.5;
        const visited = new Uint8Array(w * h);
        const queue = [startX, startY];
        visited[startY * w + startX] = 1;

        let erasedCount = 0;

        while (queue.length > 0) {
            const cy = queue.pop();
            const cx = queue.pop();

            const idx = (cy * w + cx) * 4;
            data[idx + 3] = 0; // Erase to transparency
            erasedCount++;

            // 4-way neighbors
            const neighbors = [
                [cx + 1, cy],
                [cx - 1, cy],
                [cx, cy + 1],
                [cx, cy - 1]
            ];

            for (let i = 0; i < 4; i++) {
                const nx = neighbors[i][0];
                const ny = neighbors[i][1];

                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const nPos = ny * w + nx;
                    if (!visited[nPos]) {
                        visited[nPos] = 1;
                        const nIdx = nPos * 4;
                        if (data[nIdx + 3] > 0) {
                            const dr = data[nIdx] - targetR;
                            const dg = data[nIdx + 1] - targetG;
                            const db = data[nIdx + 2] - targetB;
                            const dist = Math.sqrt(dr * dr + dg * dg + db * db);

                            if (dist <= maxDiff) {
                                queue.push(nx, ny);
                            }
                        }
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
        renderBgComposite();
        showToast(`Magic Wand erased ${erasedCount.toLocaleString()} matching background pixels!`, "success");
    }

    // Continuous Smooth Touchup Brush (Erase or Restore)
    function drawBrushPoint(ctx, x, y, radius) {
        if (bgCurrentTouchupTool === "erase") {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else if (bgCurrentTouchupTool === "restore" && currentSourceImg) {
            ctx.save();
            ctx.globalCompositeOperation = "source-over";
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(currentSourceImg, 0, 0);
            ctx.restore();
        }
    }

    function applyTouchupBrush(coords, isStart = false) {
        if (!currentCutoutCanvas || !coords) return;
        const ctx = currentCutoutCanvas.getContext("2d");
        const radius = bgTouchupSize ? parseInt(bgTouchupSize.value, 10) : 25;

        if (isStart || bgLastTouchupX === null) {
            drawBrushPoint(ctx, coords.imgX, coords.imgY, radius);
            bgLastTouchupX = coords.imgX;
            bgLastTouchupY = coords.imgY;
        } else {
            const dist = Math.hypot(coords.imgX - bgLastTouchupX, coords.imgY - bgLastTouchupY);
            const stepSize = Math.max(2, radius * 0.35);
            const steps = Math.max(1, Math.ceil(dist / stepSize));
            for (let s = 1; s <= steps; s++) {
                const ix = bgLastTouchupX + (coords.imgX - bgLastTouchupX) * (s / steps);
                const iy = bgLastTouchupY + (coords.imgY - bgLastTouchupY) * (s / steps);
                drawBrushPoint(ctx, Math.round(ix), Math.round(iy), radius);
            }
            bgLastTouchupX = coords.imgX;
            bgLastTouchupY = coords.imgY;
        }
        renderBgComposite();
    }

    // Canvas Mouse & Touch Interactions (Touch-Up vs Pan Subject)
    if (bgCompositeCanvas) {
        function onPointerStart(e) {
            const coords = getCutoutCoords(e);
            if (!coords) return;

            if (bgCurrentTouchupTool === "wand") {
                const tol = bgWandTolerance ? parseInt(bgWandTolerance.value, 10) : 25;
                runMagicWand(coords.imgX, coords.imgY, tol);
                e.preventDefault();
                return;
            }

            if (bgCurrentTouchupTool === "erase" || bgCurrentTouchupTool === "restore") {
                bgIsPaintingTouchup = true;
                saveCutoutHistory();
                bgLastTouchupX = coords.imgX;
                bgLastTouchupY = coords.imgY;
                applyTouchupBrush(coords, true);
                e.preventDefault();
                return;
            }

            // Default: Pan / Move Subject
            bgIsDraggingSubject = true;
            bgDragStartX = coords.canvasX - bgSubjectPanX;
            bgDragStartY = coords.canvasY - bgSubjectPanY;
            e.preventDefault();
        }

        function onPointerMove(e) {
            const coords = getCutoutCoords(e);
            if (!coords) return;

            if (bgIsPaintingTouchup) {
                applyTouchupBrush(coords, false);
                e.preventDefault();
                return;
            }

            if (bgIsDraggingSubject) {
                bgSubjectPanX = coords.canvasX - bgDragStartX;
                bgSubjectPanY = coords.canvasY - bgDragStartY;
                renderBgComposite();
                e.preventDefault();
            }
        }

        function onPointerEnd() {
            bgIsPaintingTouchup = false;
            bgIsDraggingSubject = false;
            bgLastTouchupX = null;
            bgLastTouchupY = null;
        }

        bgCompositeCanvas.addEventListener("mousedown", onPointerStart);
        window.addEventListener("mousemove", onPointerMove);
        window.addEventListener("mouseup", onPointerEnd);

        bgCompositeCanvas.addEventListener("touchstart", onPointerStart, { passive: false });
        window.addEventListener("touchmove", onPointerMove, { passive: false });
        window.addEventListener("touchend", onPointerEnd);
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

    // Product Reflection & Shadow Listeners
    if (bgReflectionToggle) {
        bgReflectionToggle.addEventListener("change", (e) => {
            if (bgReflectionHeight) bgReflectionHeight.disabled = !e.target.checked;
            if (bgReflectionOpacity) bgReflectionOpacity.disabled = !e.target.checked;
            renderBgComposite();
        });
    }
    if (bgReflectionHeight && bgReflectionHeightVal) {
        bgReflectionHeight.addEventListener("input", (e) => {
            bgReflectionHeightVal.textContent = `${e.target.value}%`;
            renderBgComposite();
        });
    }
    if (bgReflectionOpacity && bgReflectionOpacityVal) {
        bgReflectionOpacity.addEventListener("input", (e) => {
            bgReflectionOpacityVal.textContent = `${e.target.value}%`;
            renderBgComposite();
        });
    }
    if (bgFloorShadowToggle) {
        bgFloorShadowToggle.addEventListener("change", (e) => {
            if (bgFloorShadowWidth) bgFloorShadowWidth.disabled = !e.target.checked;
            if (bgFloorShadowOpacity) bgFloorShadowOpacity.disabled = !e.target.checked;
            renderBgComposite();
        });
    }
    if (bgFloorShadowWidth && bgFloorShadowWidthVal) {
        bgFloorShadowWidth.addEventListener("input", (e) => {
            bgFloorShadowWidthVal.textContent = `${e.target.value}%`;
            renderBgComposite();
        });
    }
    if (bgFloorShadowOpacity && bgFloorShadowOpacityVal) {
        bgFloorShadowOpacity.addEventListener("input", (e) => {
            bgFloorShadowOpacityVal.textContent = `${e.target.value}%`;
            renderBgComposite();
        });
    }

    // 3D Text Overlay Listeners
    if (bgTextToggle) {
        bgTextToggle.addEventListener("change", (e) => {
            const ctrls = document.getElementById("bgTextControls");
            if (ctrls) {
                ctrls.classList.toggle("opacity-50", !e.target.checked);
                ctrls.classList.toggle("pointer-events-none", !e.target.checked);
            }
            if (bgTextLayerOrder) bgTextLayerOrder.disabled = !e.target.checked;
            renderBgComposite();
        });
    }
    if (bgTextInput) bgTextInput.addEventListener("input", renderBgComposite);
    if (bgTextColor) bgTextColor.addEventListener("input", renderBgComposite);
    if (bgTextStrokeColor) bgTextStrokeColor.addEventListener("input", renderBgComposite);
    if (bgTextSize && bgTextSizeVal) {
        bgTextSize.addEventListener("input", (e) => {
            bgTextSizeVal.textContent = `${e.target.value}px`;
            renderBgComposite();
        });
    }
    if (bgTextLayerOrder) bgTextLayerOrder.addEventListener("change", renderBgComposite);

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
            currentSourceImg = null;
            currentCutoutCanvas = null;
            initialCutoutCanvas = null;
            currentCutoutBlob = null;
            bgTouchupHistory = [];
        });
    }

    if (bgDownloadBtn) {
        bgDownloadBtn.addEventListener("click", () => {
            if (!bgCompositeCanvas) return;
            bgCompositeCanvas.toBlob((blob) => {
                if (!blob) return;
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = currentBgMode === "transparent" ? "supiristudio_cutout.png" : "supiristudio_product_studio.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast("High-resolution download started!", "success");
            }, "image/png");
        });
    }

    if (bgSendToIdBtn) {
        bgSendToIdBtn.addEventListener("click", () => {
            if (!currentCutoutCanvas) return;
            currentCutoutCanvas.toBlob((blob) => {
                if (!blob) return;
                switchTab("tab-passport");
                loadIdPhotoFromBlob(blob);
            }, "image/png");
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
    const wmModeObjectBtn = document.getElementById("wmModeObjectBtn");
    const wmModeWatermarkBtn = document.getElementById("wmModeWatermarkBtn");
    let wmStudioMode = "object"; // "object" or "watermark"

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

    // Mode Switcher Listeners
    if (wmModeObjectBtn && wmModeWatermarkBtn) {
        wmModeObjectBtn.addEventListener("click", () => {
            wmStudioMode = "object";
            wmModeObjectBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-glow-emerald";
            wmModeWatermarkBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all";
            if (wmProcessBtn) wmProcessBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i> Erase Object Cleanly';
            showToast("Magic Object Remover mode active: Select people, photobombers, or objects to erase.", "info");
        });

        wmModeWatermarkBtn.addEventListener("click", () => {
            wmStudioMode = "watermark";
            wmModeWatermarkBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-glow-emerald";
            wmModeObjectBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all";
            if (wmProcessBtn) wmProcessBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i> Erase Watermark & Logo';
            showToast("Watermark & Logo Eraser mode active: Select stamps, text, or logos to erase.", "info");
        });
    }

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

            const inpaintMode = wmStudioMode === "object" ? "object_remove" : (wmAlgo || "watermark_erase");
            const progTitle = wmStudioMode === "object" ? "Erasing Object with AI Synthesis..." : `Inpainting Watermark (${algoLabels[wmAlgo] || "Sharp"})...`;

            startProgress(progTitle, "Neural texture synthesis & 5px dilated boundary feathering");

            maskCanvas.toBlob((maskBlob) => {
                const formData = new FormData();
                formData.append("image", wmOriginalFile);
                formData.append("mask", maskBlob, "mask.png");
                formData.append("mode", inpaintMode);

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
                                const modeLabel = wmStudioMode === "object" ? "Object Removed Cleanly" : "Watermark & Logo Erased";
                                wmFileInfo.textContent = `${modeLabel} • Dilated Matting • ${wmCleanResultImg.naturalWidth} × ${wmCleanResultImg.naturalHeight} px • ${formatBytes(blob.size)}`;
                            }
                            showToast(wmStudioMode === "object" ? "Object erased cleanly!" : "Watermark erased cleanly!", "success");
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
    // TOOL 3: 🎬 VIDEO WATERMARK STUDIO + GIF & COMPRESSOR
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
    const videoResultGif = document.getElementById("videoResultGif");
    const videoDownloadBtn = document.getElementById("videoDownloadBtn");
    const videoProcessAnotherBtn = document.getElementById("videoProcessAnotherBtn");
    const videoFileInfo = document.getElementById("videoFileInfo");

    // Custom Video Player Controls
    const videoPlayBtn = document.getElementById("videoPlayBtn") || document.getElementById("videoPlayPauseBtn");
    const videoPlayIcon = document.getElementById("videoPlayIcon");
    const videoTimelineScrubber = document.getElementById("videoTimelineScrubber");
    const videoTimeDisplay = document.getElementById("videoTimeDisplay");
    const videoMuteBtn = document.getElementById("videoMuteBtn") || document.getElementById("videoAudioToggleBtn");
    const videoMuteIcon = document.getElementById("videoMuteIcon") || document.getElementById("videoAudioIcon");
    const videoRestartBtn = document.getElementById("videoRestartBtn");

    // 4 Sub-Tool Switchers
    const videoSubtoolEraseBtn = document.getElementById("videoSubtoolEraseBtn") || document.getElementById("videoModeBlurBtn");
    const videoSubtoolCropBtn = document.getElementById("videoSubtoolCropBtn") || document.getElementById("videoModeCropBtn");
    const videoSubtoolGifBtn = document.getElementById("videoSubtoolGifBtn") || document.getElementById("videoModeGifBtn");
    const videoSubtoolCompressBtn = document.getElementById("videoSubtoolCompressBtn") || document.getElementById("videoModeCompressBtn");

    // 4 Sub-Tool Control Panels
    const videoSubtoolBlurPanel = document.getElementById("videoSubtoolBlurPanel") || document.getElementById("videoBlurControlsArea");
    const videoSubtoolCropPanel = document.getElementById("videoSubtoolCropPanel") || document.getElementById("videoCropControlsArea");
    const videoSubtoolGifPanel = document.getElementById("videoSubtoolGifPanel") || document.getElementById("videoGifControlsArea");
    const videoSubtoolCompressPanel = document.getElementById("videoSubtoolCompressPanel") || document.getElementById("videoCompressControlsArea");

    // Overlays
    const delogoBoxesOverlay = document.getElementById("delogoBoxesOverlay");
    const videoCropOverlay = document.getElementById("videoCropOverlay");

    // Mode A (Delogo/Blur) Controls
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

    // Mode B (Crop) Controls
    const videoCropBox = document.getElementById("videoCropBox");
    const cropDimensionBadge = document.getElementById("cropDimensionBadge");
    const cropMaskTop = document.getElementById("cropMaskTop");
    const cropMaskBottom = document.getElementById("cropMaskBottom");
    const cropMaskLeft = document.getElementById("cropMaskLeft");
    const cropMaskRight = document.getElementById("cropMaskRight");
    const videoCropPresetBtns = document.querySelectorAll(".video-crop-preset-btn");

    // Mode C (GIF) Controls
    const videoGifStart = document.getElementById("videoGifStart");
    const videoGifEnd = document.getElementById("videoGifEnd");
    const videoGifFps = document.getElementById("videoGifFps");
    const videoGifScale = document.getElementById("videoGifScale");

    // Mode D (Compressor) Controls
    const videoCompressCrf = document.getElementById("videoCompressCrf");
    const videoCompressRes = document.getElementById("videoCompressRes");

    // Common Video Controls
    const videoRemoveOutro = document.getElementById("videoRemoveOutro");
    const videoMuteToggle = document.getElementById("videoMuteToggle");
    const videoTrimStart = document.getElementById("videoTrimStart");
    const videoTrimEnd = document.getElementById("videoTrimEnd");

    let currentVideoFile = null;
    let cleanVideoBlob = null;
    let videoActiveSubtool = "erase"; // "erase", "crop", "gif", "compress"
    let videoPrimaryMode = "erase";
    let videoRemovalMode = "delogo";  // "delogo", "blur", "pixelate"

    // 4 Delogo Box Elements
    const delogoBoxes = [
        document.getElementById("delogoBox1"),
        document.getElementById("delogoBox2"),
        document.getElementById("delogoBox3"),
        document.getElementById("delogoBox4")
    ];
    let activeBoxCount = 1;

    // Sub-Tool Switcher Handler
    function setVideoSubtool(subtool) {
        videoActiveSubtool = subtool;
        videoPrimaryMode = (subtool === "crop") ? "crop" : "erase";

        const subtoolBtns = [
            { btn: videoSubtoolEraseBtn, mode: "erase" },
            { btn: videoSubtoolCropBtn, mode: "crop" },
            { btn: videoSubtoolGifBtn, mode: "gif" },
            { btn: videoSubtoolCompressBtn, mode: "compress" }
        ];

        subtoolBtns.forEach(item => {
            if (!item.btn) return;
            if (item.mode === subtool) {
                item.btn.className = "video-subtool-btn active flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-glow-cyan flex items-center justify-center gap-1.5";
            } else {
                item.btn.className = "video-subtool-btn flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center gap-1.5";
            }
        });

        // Toggle Panels
        if (videoSubtoolBlurPanel) videoSubtoolBlurPanel.classList.toggle("hidden", subtool !== "erase");
        if (videoSubtoolCropPanel) videoSubtoolCropPanel.classList.toggle("hidden", subtool !== "crop");
        if (videoSubtoolGifPanel) videoSubtoolGifPanel.classList.toggle("hidden", subtool !== "gif");
        if (videoSubtoolCompressPanel) videoSubtoolCompressPanel.classList.toggle("hidden", subtool !== "compress");

        // Toggle Overlay Layers
        if (delogoBoxesOverlay) delogoBoxesOverlay.classList.toggle("hidden", subtool !== "erase");
        if (videoCropOverlay) videoCropOverlay.classList.toggle("hidden", subtool !== "crop");
        if (videoAddBoxBtn) videoAddBoxBtn.classList.toggle("hidden", subtool !== "erase" || activeBoxCount >= 4);

        // Update Action Button Text
        if (videoProcessBtnText) {
            if (subtool === "erase") videoProcessBtnText.textContent = "Process Video Delogo";
            else if (subtool === "crop") {
                videoProcessBtnText.textContent = "Crop Video & Export";
                updateCropMasks();
            } else if (subtool === "gif") videoProcessBtnText.textContent = "Generate Looping GIF";
            else if (subtool === "compress") videoProcessBtnText.textContent = "Compress WhatsApp Video";
        }
    }

    if (videoSubtoolEraseBtn) videoSubtoolEraseBtn.addEventListener("click", () => setVideoSubtool("erase"));
    if (videoSubtoolCropBtn) videoSubtoolCropBtn.addEventListener("click", () => setVideoSubtool("crop"));
    if (videoSubtoolGifBtn) videoSubtoolGifBtn.addEventListener("click", () => setVideoSubtool("gif"));
    if (videoSubtoolCompressBtn) videoSubtoolCompressBtn.addEventListener("click", () => setVideoSubtool("compress"));

    // Custom Video Player Controls Handlers
    function formatVideoTime(sec) {
        if (isNaN(sec)) return "00:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }

    if (videoPlayBtn && videoPreview) {
        videoPlayBtn.addEventListener("click", () => {
            if (videoPreview.paused || videoPreview.ended) {
                videoPreview.play();
                if (videoPlayIcon) videoPlayIcon.className = "fa-solid fa-pause text-emerald-400";
            } else {
                videoPreview.pause();
                if (videoPlayIcon) videoPlayIcon.className = "fa-solid fa-play text-slate-200";
            }
        });

        videoPreview.addEventListener("timeupdate", () => {
            if (videoPreview.duration) {
                const pct = (videoPreview.currentTime / videoPreview.duration) * 100;
                if (videoTimelineScrubber) videoTimelineScrubber.value = pct;
                if (videoTimeDisplay) {
                    videoTimeDisplay.textContent = `${formatVideoTime(videoPreview.currentTime)} / ${formatVideoTime(videoPreview.duration)}`;
                }
            }
        });

        videoPreview.addEventListener("ended", () => {
            if (videoPlayIcon) videoPlayIcon.className = "fa-solid fa-play text-slate-200";
        });

        if (videoTimelineScrubber) {
            videoTimelineScrubber.addEventListener("input", (e) => {
                if (videoPreview.duration) {
                    videoPreview.currentTime = (parseFloat(e.target.value) / 100) * videoPreview.duration;
                }
            });
        }

        if (videoMuteBtn) {
            videoMuteBtn.addEventListener("click", () => {
                videoPreview.muted = !videoPreview.muted;
                if (videoMuteIcon) {
                    videoMuteIcon.className = videoPreview.muted ? "fa-solid fa-volume-xmark text-rose-400" : "fa-solid fa-volume-high text-slate-300";
                }
            });
        }

        if (videoRestartBtn) {
            videoRestartBtn.addEventListener("click", () => {
                videoPreview.currentTime = 0;
                videoPreview.play();
                if (videoPlayIcon) videoPlayIcon.className = "fa-solid fa-pause text-emerald-400";
            });
        }
    }

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

    // Comprehensive Video Processing Action Trigger (Delogo, Crop, GIF, Compress)
    if (videoProcessBtn) {
        videoProcessBtn.addEventListener("click", () => {
            if (!currentVideoFile || !videoPreview) {
                showToast("Please upload a video first.", "error");
                return;
            }

            // ----------------------------------------------------
            // SUB-TOOL 3: 🎞️ VIDEO TO GIF / BOOMERANG MAKER
            // ----------------------------------------------------
            if (videoActiveSubtool === "gif") {
                startProgress("Rendering Looping GIF...", "Applying 2-pass Lanczos palette optimization");

                const formData = new FormData();
                formData.append("video", currentVideoFile);
                formData.append("mode", "gif");
                formData.append("start_sec", videoGifStart ? videoGifStart.value : "0");
                formData.append("end_sec", videoGifEnd ? videoGifEnd.value : "5");
                formData.append("gif_fps", videoGifFps ? videoGifFps.value : "12");
                formData.append("gif_scale", videoGifScale ? videoGifScale.value : "480");

                fetch("/api/video/process", {
                    method: "POST",
                    body: formData
                })
                .then(async (res) => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({ detail: "GIF generation failed" }));
                        throw new Error(err.detail || "Server error");
                    }
                    return res.blob();
                })
                .then(blob => {
                    cleanVideoBlob = blob;
                    if (videoResultGif) {
                        videoResultGif.src = URL.createObjectURL(blob);
                        videoResultGif.classList.remove("hidden");
                    }
                    if (videoResultPlayer) videoResultPlayer.classList.add("hidden");

                    completeProgress(() => {
                        videoReadyCard.classList.remove("hidden");
                        if (videoFileInfo) {
                            videoFileInfo.textContent = `High-Quality Looping GIF • Lanczos Palette • ${formatBytes(blob.size)}`;
                        }
                        showToast("GIF created successfully!", "success");
                    });
                })
                .catch(err => {
                    hideProgress();
                    showToast(err.message || "GIF generation failed.", "error");
                });
                return;
            }

            // ----------------------------------------------------
            // SUB-TOOL 4: 📦 WHATSAPP VIDEO COMPRESSOR
            // ----------------------------------------------------
            if (videoActiveSubtool === "compress") {
                startProgress("Compressing Video with H.264 Engine...", "Reducing bitrate & optimizing for WhatsApp sharing");

                const formData = new FormData();
                formData.append("video", currentVideoFile);
                formData.append("mode", "compress");
                formData.append("crf", videoCompressCrf ? videoCompressCrf.value : "28");
                formData.append("resolution", videoCompressRes ? videoCompressRes.value : "720");

                fetch("/api/video/process", {
                    method: "POST",
                    body: formData
                })
                .then(async (res) => {
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({ detail: "Video compression failed" }));
                        throw new Error(err.detail || "Server error");
                    }
                    return res.blob();
                })
                .then(blob => {
                    cleanVideoBlob = blob;
                    if (videoResultPlayer) {
                        videoResultPlayer.src = URL.createObjectURL(blob);
                        videoResultPlayer.classList.remove("hidden");
                    }
                    if (videoResultGif) videoResultGif.classList.add("hidden");

                    completeProgress(() => {
                        videoReadyCard.classList.remove("hidden");
                        if (videoFileInfo) {
                            videoFileInfo.textContent = `WhatsApp Compressed MP4 • 50-80% Size Reduction • ${formatBytes(blob.size)}`;
                        }
                        showToast("Video compressed successfully!", "success");
                    });
                })
                .catch(err => {
                    hideProgress();
                    showToast(err.message || "Video compression failed.", "error");
                });
                return;
            }

            // ----------------------------------------------------
            // SUB-TOOL 1 & 2: DELOGO (ERASE) / CROP WATERMARK
            // ----------------------------------------------------
            const formData = new FormData();
            formData.append("video", currentVideoFile);
            formData.append("mode", videoActiveSubtool);

            if (videoActiveSubtool === "crop") {
                const cropCoords = mapVideoCropCoords();
                if (!cropCoords) {
                    showToast("Unable to calculate video crop dimensions.", "error");
                    return;
                }
                formData.append("crop_x", cropCoords.x);
                formData.append("crop_y", cropCoords.y);
                formData.append("crop_w", cropCoords.w);
                formData.append("crop_h", cropCoords.h);

                startProgress("Cropping Video with Hardware Precision...", "Applying spatial boundary cut & re-encoding");
            } else {
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

            if (videoRemoveOutro && videoRemoveOutro.checked) formData.append("remove_outro", "true");
            if (videoMuteToggle && videoMuteToggle.checked) formData.append("mute_audio", "true");
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
                if (videoResultPlayer) {
                    videoResultPlayer.src = URL.createObjectURL(blob);
                    videoResultPlayer.classList.remove("hidden");
                }
                if (videoResultGif) videoResultGif.classList.add("hidden");

                completeProgress(() => {
                    videoReadyCard.classList.remove("hidden");
                    if (videoFileInfo) {
                        const modeLabel = videoActiveSubtool === "crop" ? "Video Crop Complete" : "Watermark Delogo Complete";
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

            if (videoActiveSubtool === "gif") {
                link.download = "supiristudio_clip.gif";
            } else if (videoActiveSubtool === "crop") {
                link.download = "supiristudio_cropped_video.mp4";
            } else if (videoActiveSubtool === "compress") {
                link.download = "supiristudio_compressed_video.mp4";
            } else {
                link.download = "supiristudio_clean_video.mp4";
            }

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Video file download started!", "success");
        });
    }

    // ========================================================
    // TOOL 4: ✨ AI PHOTO ENHANCER, UPSCALER & COLORIZER STUDIO
    // ========================================================
    const enhanceDropzone = document.getElementById("enhanceDropzone");
    const enhanceFileInput = document.getElementById("enhanceFileInput");
    const enhanceUploadArea = document.getElementById("enhanceUploadArea");
    const enhanceWorkspaceArea = document.getElementById("enhanceWorkspaceArea");
    const enhanceWrapper = document.getElementById("enhanceWrapper") || document.getElementById("enhanceSliderContainer");
    const enhanceBeforeImg = document.getElementById("enhanceBeforeImg");
    const enhanceAfterWrapper = document.getElementById("enhanceAfterWrapper");
    const enhanceAfterImg = document.getElementById("enhanceAfterImg");
    const enhanceSliderLine = document.getElementById("enhanceSliderLine");
    const enhancePresetBtns = document.querySelectorAll(".enhance-preset-btn");
    const enhanceUpscaleToggle = document.getElementById("enhanceUpscaleToggle");
    const enhanceSharpness = document.getElementById("enhanceSharpness");
    const enhanceSharpnessVal = document.getElementById("enhanceSharpnessVal");
    const enhanceDenoise = document.getElementById("enhanceDenoise");
    const enhanceDenoiseVal = document.getElementById("enhanceDenoiseVal");
    const enhanceProcessBtn = document.getElementById("enhanceProcessBtn");
    const enhanceReadyCard = document.getElementById("enhanceReadyCard");
    const enhanceFileInfo = document.getElementById("enhanceFileInfo");
    const enhanceDownloadBtn = document.getElementById("enhanceDownloadBtn");
    const enhanceResetBtn = document.getElementById("enhanceResetBtn");
    const enhanceProcessAnotherBtn = document.getElementById("enhanceProcessAnotherBtn");

    let enhanceOriginalBlob = null;
    let enhanceEnhancedBlob = null;
    let enhanceCurrentPreset = "auto_hd";
    let isDraggingEnhanceSlider = false;

    if (enhanceDropzone && enhanceFileInput) {
        enhanceDropzone.addEventListener("click", () => enhanceFileInput.click());

        ["dragenter", "dragover"].forEach(ev => {
            enhanceDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                enhanceDropzone.classList.add("border-emerald-500", "bg-slate-900/80");
            });
        });

        ["dragleave", "drop"].forEach(ev => {
            enhanceDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                enhanceDropzone.classList.remove("border-emerald-500", "bg-slate-900/80");
            });
        });

        enhanceDropzone.addEventListener("drop", (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleEnhanceFile(e.dataTransfer.files[0]);
            }
        });

        enhanceFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleEnhanceFile(e.target.files[0]);
            }
        });
    }

    function handleEnhanceFile(file) {
        if (!file.type.startsWith("image/")) {
            showToast("Please upload a valid photo file.", "error");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showToast("File size exceeds 50 MB limit.", "error");
            return;
        }

        enhanceOriginalBlob = file;
        const url = URL.createObjectURL(file);
        enhanceBeforeImg.src = url;
        enhanceAfterImg.src = url;

        enhanceUploadArea.classList.add("hidden");
        enhanceWorkspaceArea.classList.remove("hidden");
        enhanceReadyCard.classList.add("hidden");

        // Center Split Slider at 50%
        if (enhanceAfterWrapper) enhanceAfterWrapper.style.width = "50%";
        if (enhanceSliderLine) enhanceSliderLine.style.left = "50%";

        showToast("Photo loaded! Pick a Preset or adjust Sharpness & Deblur.", "info");
    }

    // Interactive Before / After Split Slider Handling
    if (enhanceWrapper) {
        function updateSplitSlider(clientX) {
            const rect = enhanceWrapper.getBoundingClientRect();
            let pct = ((clientX - rect.left) / rect.width) * 100;
            pct = Math.max(0, Math.min(100, pct));
            if (enhanceAfterWrapper) enhanceAfterWrapper.style.width = `${pct}%`;
            if (enhanceSliderLine) enhanceSliderLine.style.left = `${pct}%`;
        }

        enhanceWrapper.addEventListener("mousedown", (e) => {
            isDraggingEnhanceSlider = true;
            updateSplitSlider(e.clientX);
        });

        window.addEventListener("mousemove", (e) => {
            if (!isDraggingEnhanceSlider) return;
            updateSplitSlider(e.clientX);
        });

        window.addEventListener("mouseup", () => {
            isDraggingEnhanceSlider = false;
        });

        enhanceWrapper.addEventListener("touchstart", (e) => {
            isDraggingEnhanceSlider = true;
            if (e.touches && e.touches[0]) updateSplitSlider(e.touches[0].clientX);
        }, { passive: true });

        window.addEventListener("touchmove", (e) => {
            if (!isDraggingEnhanceSlider) return;
            if (e.touches && e.touches[0]) updateSplitSlider(e.touches[0].clientX);
        }, { passive: true });

        window.addEventListener("touchend", () => {
            isDraggingEnhanceSlider = false;
        });
    }

    // Preset Selection Listeners
    enhancePresetBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            enhancePresetBtns.forEach(b => {
                b.className = "enhance-preset-btn p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 text-xs font-semibold text-center hover:border-slate-700 transition-all";
            });
            btn.className = "enhance-preset-btn active p-2 rounded-xl border border-emerald-500 bg-emerald-500/10 text-emerald-400 text-xs font-bold text-center transition-all shadow-glow-emerald";
            enhanceCurrentPreset = btn.getAttribute("data-preset");
        });
    });

    if (enhanceSharpness && enhanceSharpnessVal) {
        enhanceSharpness.addEventListener("input", (e) => {
            enhanceSharpnessVal.textContent = e.target.value;
        });
    }

    if (enhanceDenoise && enhanceDenoiseVal) {
        enhanceDenoise.addEventListener("input", (e) => {
            enhanceDenoiseVal.textContent = `${e.target.value}px`;
        });
    }

    // Process Photo Enhancement Action
    if (enhanceProcessBtn) {
        enhanceProcessBtn.addEventListener("click", () => {
            if (!enhanceOriginalBlob) {
                showToast("Please upload a photo first.", "error");
                return;
            }

            startProgress("Enhancing Photo with Neural Clarity...", "Applying LAB CLAHE, Bilateral Denoising & Super-Resolution");

            const formData = new FormData();
            formData.append("image", enhanceOriginalBlob);
            formData.append("preset", enhanceCurrentPreset);
            if (enhanceUpscaleToggle && enhanceUpscaleToggle.checked) {
                formData.append("upscale_2x", "true");
            }
            if (enhanceSharpness) formData.append("sharpness", enhanceSharpness.value);
            if (enhanceDenoise) formData.append("denoise", enhanceDenoise.value);

            fetch("/api/image/enhance", {
                method: "POST",
                body: formData
            })
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: "Enhancement failed" }));
                    throw new Error(err.detail || "Server error");
                }
                return res.blob();
            })
            .then(blob => {
                enhanceEnhancedBlob = blob;
                const url = URL.createObjectURL(blob);
                if (enhanceAfterImg) enhanceAfterImg.src = url;

                completeProgress(() => {
                    enhanceReadyCard.classList.remove("hidden");
                    if (enhanceFileInfo) {
                        const upscaleLabel = enhanceUpscaleToggle && enhanceUpscaleToggle.checked ? "2× HD Super-Resolution" : "HD CLAHE Enhanced";
                        enhanceFileInfo.textContent = `${upscaleLabel} • Preset: ${enhanceCurrentPreset.toUpperCase()} • ${formatBytes(blob.size)}`;
                    }
                    showToast("Photo enhanced successfully! Drag the Split Slider to compare.", "success");
                });
            })
            .catch(err => {
                hideProgress();
                showToast(err.message || "Photo enhancement failed.", "error");
            });
        });
    }

    if (enhanceDownloadBtn) {
        enhanceDownloadBtn.addEventListener("click", () => {
            if (!enhanceEnhancedBlob) return;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(enhanceEnhancedBlob);
            link.download = "supiristudio_hd_enhanced.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Enhanced photo download started!", "success");
        });
    }

    if (enhanceResetBtn || enhanceProcessAnotherBtn) {
        const resetHandler = () => {
            enhanceWorkspaceArea.classList.add("hidden");
            enhanceUploadArea.classList.remove("hidden");
            enhanceReadyCard.classList.add("hidden");
            if (enhanceFileInput) enhanceFileInput.value = "";
            enhanceOriginalBlob = null;
            enhanceEnhancedBlob = null;
        };
        if (enhanceResetBtn) enhanceResetBtn.addEventListener("click", resetHandler);
        if (enhanceProcessAnotherBtn) enhanceProcessAnotherBtn.addEventListener("click", resetHandler);
    }

    // ========================================================
    // TOOL 5: 🔒 PRIVACY CENSOR & SOCIAL THUMBNAIL MAKER
    // ========================================================
    const censorDropzone = document.getElementById("censorDropzone");
    const censorFileInput = document.getElementById("censorFileInput");
    const censorUploadArea = document.getElementById("censorUploadArea");
    const censorWorkspaceArea = document.getElementById("censorWorkspaceArea");
    const censorModePrivacyBtn = document.getElementById("censorModePrivacyBtn");
    const censorModeThumbBtn = document.getElementById("censorModeThumbBtn") || document.getElementById("censorModePostBtn");
    const censorPrivacySection = document.getElementById("censorPrivacySection") || document.getElementById("censorPrivacyControls");
    const censorThumbSection = document.getElementById("censorThumbSection") || document.getElementById("censorThumbnailControls");

    const censorPreviewCanvas = document.getElementById("censorPreviewCanvas") || document.getElementById("censorBaseCanvas");
    const censorBoxesLayer = document.getElementById("censorBoxesLayer");
    const censorAutoDetectBtn = document.getElementById("censorAutoDetectBtn");
    const censorAddBoxBtn = document.getElementById("censorAddBoxBtn");
    const censorClearBoxesBtn = document.getElementById("censorClearBoxesBtn");
    const censorStyleSelect = document.getElementById("censorStyleSelect");
    const censorIntensity = document.getElementById("censorIntensity");
    const censorIntensityVal = document.getElementById("censorIntensityVal");
    const censorProcessBtn = document.getElementById("censorProcessBtn");

    // Thumbnail Designer Controls
    const thumbHeadlineInput = document.getElementById("thumbHeadlineInput") || document.getElementById("censorHeadlineText");
    const thumbFontSize = document.getElementById("thumbFontSize") || document.getElementById("censorTextSize");
    const thumbFontSizeVal = document.getElementById("thumbFontSizeVal") || document.getElementById("censorTextSizeVal");
    const thumbTextColor = document.getElementById("thumbTextColor") || document.getElementById("censorTextColor");
    const thumbStrokeColor = document.getElementById("thumbStrokeColor") || document.getElementById("censorStrokeColor");
    const thumbShadowToggle = document.getElementById("thumbShadowToggle");
    const thumbRibbonToggle = document.getElementById("thumbRibbonToggle");
    const thumbBadgeBtns = document.querySelectorAll(".thumb-badge-btn, .censor-badge-btn");

    const censorReadyCard = document.getElementById("censorReadyCard");
    const censorFileInfo = document.getElementById("censorFileInfo");
    const censorDownloadBtn = document.getElementById("censorDownloadBtn");
    const censorResetBtn = document.getElementById("censorResetBtn");
    const censorProcessAnotherBtn = document.getElementById("censorProcessAnotherBtn");

    let censorOriginalImage = null;
    let censorOriginalBlob = null;
    let censorCurrentBlob = null;
    let censorActiveMode = "privacy"; // "privacy" or "thumbnail"
    let censorBoxElements = [];
    let activeStickers = [];

    // Switch between Privacy Censor vs Thumbnail Designer Mode
    if (censorModePrivacyBtn && censorModeThumbBtn) {
        censorModePrivacyBtn.addEventListener("click", () => {
            censorActiveMode = "privacy";
            censorModePrivacyBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-emerald-500 text-slate-950 shadow-glow-emerald";
            censorModeThumbBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all";
            if (censorPrivacySection) censorPrivacySection.classList.remove("hidden");
            if (censorThumbSection) censorThumbSection.classList.add("hidden");
            if (censorBoxesLayer) censorBoxesLayer.classList.remove("hidden");
            showToast("Privacy Censor Mode active: Blur faces, plates, or sensitive IDs.", "info");
        });

        censorModeThumbBtn.addEventListener("click", () => {
            censorActiveMode = "thumbnail";
            censorModeThumbBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-emerald-500 text-slate-950 shadow-glow-emerald";
            censorModePrivacyBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all";
            if (censorThumbSection) censorThumbSection.classList.remove("hidden");
            if (censorPrivacySection) censorPrivacySection.classList.add("hidden");
            if (censorBoxesLayer) censorBoxesLayer.classList.add("hidden");
            renderThumbnailCanvas();
            showToast("Thumbnail Designer active: Add headline text and badges.", "info");
        });
    }

    if (censorIntensity && censorIntensityVal) {
        censorIntensity.addEventListener("input", (e) => {
            censorIntensityVal.textContent = `${e.target.value}px`;
        });
    }

    if (censorDropzone && censorFileInput) {
        censorDropzone.addEventListener("click", () => censorFileInput.click());

        ["dragenter", "dragover"].forEach(ev => {
            censorDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                censorDropzone.classList.add("border-emerald-500", "bg-slate-900/80");
            });
        });

        ["dragleave", "drop"].forEach(ev => {
            censorDropzone.addEventListener(ev, (e) => {
                e.preventDefault();
                censorDropzone.classList.remove("border-emerald-500", "bg-slate-900/80");
            });
        });

        censorDropzone.addEventListener("drop", (e) => {
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleCensorFile(e.dataTransfer.files[0]);
            }
        });

        censorFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleCensorFile(e.target.files[0]);
            }
        });
    }

    function handleCensorFile(file) {
        if (!file.type.startsWith("image/")) {
            showToast("Please upload a valid image file.", "error");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            showToast("File size exceeds 50 MB limit.", "error");
            return;
        }

        censorOriginalBlob = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            censorOriginalImage = new Image();
            censorOriginalImage.onload = () => {
                initCensorCanvas();
                censorUploadArea.classList.add("hidden");
                censorWorkspaceArea.classList.remove("hidden");
                censorReadyCard.classList.add("hidden");
                clearCensorBoxes();
                showToast("Photo loaded! Click 'Auto-Detect Faces' or add manual boxes.", "info");
            };
            censorOriginalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function initCensorCanvas() {
        if (!censorPreviewCanvas || !censorOriginalImage) return;
        censorPreviewCanvas.width = censorOriginalImage.naturalWidth;
        censorPreviewCanvas.height = censorOriginalImage.naturalHeight;
        const ctx = censorPreviewCanvas.getContext("2d");
        ctx.drawImage(censorOriginalImage, 0, 0);
    }

    function clearCensorBoxes() {
        if (!censorBoxesLayer) return;
        censorBoxesLayer.innerHTML = "";
        censorBoxElements = [];
    }

    if (censorClearBoxesBtn) censorClearBoxesBtn.addEventListener("click", clearCensorBoxes);

    // Create Draggable / Resizable Censor Box Overlay Element
    function createCensorBox(xPct, yPct, wPct, hPct, label = "CENSOR") {
        if (!censorBoxesLayer) return;

        const box = document.createElement("div");
        box.className = "absolute border-2 border-dashed border-rose-500 bg-rose-500/20 rounded shadow-lg flex items-center justify-center cursor-move";
        box.style.left = `${xPct}%`;
        box.style.top = `${yPct}%`;
        box.style.width = `${wPct}%`;
        box.style.height = `${hPct}%`;

        box.innerHTML = `
            <span class="text-[9px] font-black text-rose-300 bg-slate-950/80 px-1 py-0.5 rounded pointer-events-none uppercase tracking-wider">${label}</span>
            <button type="button" class="censor-del-btn absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center hover:bg-rose-500 shadow">×</button>
            <div class="censor-resize-handle absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-400 rounded-full cursor-se-resize shadow"></div>
        `;

        box.querySelector(".censor-del-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            box.remove();
            censorBoxElements = censorBoxElements.filter(b => b !== box);
        });

        // Box Dragging & Resizing Interactions
        let isDragging = false;
        let isResizing = false;
        let startX, startY, startLeft, startTop, startW, startH;

        function onDown(e) {
            if (e.target.classList.contains("censor-resize-handle")) {
                isResizing = true;
            } else {
                isDragging = true;
            }

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;
            startLeft = box.offsetLeft;
            startTop = box.offsetTop;
            startW = box.offsetWidth;
            startH = box.offsetHeight;
            e.preventDefault();
        }

        function onMove(e) {
            if (!isDragging && !isResizing) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = clientX - startX;
            const dy = clientY - startY;

            const pW = censorBoxesLayer.clientWidth;
            const pH = censorBoxesLayer.clientHeight;

            if (isDragging) {
                const newLeft = Math.max(0, Math.min(startLeft + dx, pW - box.offsetWidth));
                const newTop = Math.max(0, Math.min(startTop + dy, pH - box.offsetHeight));
                box.style.left = `${(newLeft / pW) * 100}%`;
                box.style.top = `${(newTop / pH) * 100}%`;
            } else if (isResizing) {
                const newW = Math.max(25, Math.min(startW + dx, pW - startLeft));
                const newH = Math.max(20, Math.min(startH + dy, pH - startTop));
                box.style.width = `${(newW / pW) * 100}%`;
                box.style.height = `${(newH / pH) * 100}%`;
            }
        }

        function onUp() {
            isDragging = false;
            isResizing = false;
        }

        box.addEventListener("mousedown", onDown);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);

        box.addEventListener("touchstart", onDown, { passive: false });
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onUp);

        censorBoxesLayer.appendChild(box);
        censorBoxElements.push(box);
    }

    if (censorAddBoxBtn) {
        censorAddBoxBtn.addEventListener("click", () => {
            createCensorBox(35, 35, 30, 20, "PLATE / NIC");
            showToast("Manual censor box added. Drag & resize over sensitive data.", "info");
        });
    }

    // Auto-Detect Faces Button (OpenCV Haar Cascade)
    if (censorAutoDetectBtn) {
        censorAutoDetectBtn.addEventListener("click", () => {
            if (!censorOriginalBlob) {
                showToast("Please upload an image first.", "error");
                return;
            }

            startProgress("Auto-Detecting Faces...", "Running OpenCV Frontal Face Haar Cascade algorithm");

            const formData = new FormData();
            formData.append("image", censorOriginalBlob);

            fetch("/api/image/detect-faces", {
                method: "POST",
                body: formData
            })
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: "Face detection failed" }));
                    throw new Error(err.detail || "Server error");
                }
                return res.json();
            })
            .then(data => {
                completeProgress(() => {
                    const faces = data.faces || [];
                    if (faces.length === 0) {
                        showToast("No human faces detected automatically. Use 'Add Manual Box' instead.", "warning");
                        return;
                    }

                    const imgW = censorOriginalImage.naturalWidth;
                    const imgH = censorOriginalImage.naturalHeight;

                    faces.forEach((f, idx) => {
                        const xPct = (f.x / imgW) * 100;
                        const yPct = (f.y / imgH) * 100;
                        const wPct = (f.w / imgW) * 100;
                        const hPct = (f.h / imgH) * 100;
                        createCensorBox(xPct, yPct, wPct, hPct, `FACE #${idx + 1}`);
                    });

                    showToast(`Successfully detected and boxed ${faces.length} face(s)!`, "success");
                });
            })
            .catch(err => {
                hideProgress();
                showToast(err.message || "Failed to auto-detect faces.", "error");
            });
        });
    }

    // Apply Censor Action Trigger
    if (censorProcessBtn) {
        censorProcessBtn.addEventListener("click", () => {
            if (!censorOriginalBlob) {
                showToast("Please upload an image first.", "error");
                return;
            }

            if (censorBoxElements.length === 0) {
                showToast("Please add at least one censor box over a face or plate.", "warning");
                return;
            }

            const imgW = censorOriginalImage.naturalWidth;
            const imgH = censorOriginalImage.naturalHeight;
            const layerW = censorBoxesLayer.clientWidth;
            const layerH = censorBoxesLayer.clientHeight;

            const boxesPayload = censorBoxElements.map((b, i) => {
                const rx = Math.round((b.offsetLeft / layerW) * imgW);
                const ry = Math.round((b.offsetTop / layerH) * imgH);
                const rw = Math.round((b.offsetWidth / layerW) * imgW);
                const rh = Math.round((b.offsetHeight / layerH) * imgH);
                return {
                    id: i + 1,
                    x: Math.max(0, rx),
                    y: Math.max(0, ry),
                    w: Math.min(imgW - rx, rw),
                    h: Math.min(imgH - ry, rh)
                };
            });

            startProgress("Applying Privacy Censor...", "Applying pixel mosaic, Gaussian blur, or privacy shields");

            const formData = new FormData();
            formData.append("image", censorOriginalBlob);
            formData.append("boxes_json", JSON.stringify(boxesPayload));
            formData.append("censor_style", censorStyleSelect ? censorStyleSelect.value : "blur");
            formData.append("intensity", censorIntensity ? censorIntensity.value : "25");

            fetch("/api/image/censor", {
                method: "POST",
                body: formData
            })
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({ detail: "Censoring failed" }));
                    throw new Error(err.detail || "Server error");
                }
                return res.blob();
            })
            .then(blob => {
                censorCurrentBlob = blob;
                const resultImg = new Image();
                resultImg.onload = () => {
                    const ctx = censorPreviewCanvas.getContext("2d");
                    ctx.drawImage(resultImg, 0, 0);
                    clearCensorBoxes();

                    completeProgress(() => {
                        censorReadyCard.classList.remove("hidden");
                        if (censorFileInfo) {
                            censorFileInfo.textContent = `Privacy Protected • ${boxesPayload.length} Area(s) Censored • ${formatBytes(blob.size)}`;
                        }
                        showToast("Privacy protection applied cleanly!", "success");
                    });
                };
                resultImg.src = URL.createObjectURL(blob);
            })
            .catch(err => {
                hideProgress();
                showToast(err.message || "Failed to censor photo.", "error");
            });
        });
    }

    // Thumbnail Designer Real-Time Renderer
    function renderThumbnailCanvas() {
        if (!censorPreviewCanvas || !censorOriginalImage) return;
        const ctx = censorPreviewCanvas.getContext("2d");
        const w = censorPreviewCanvas.width;
        const h = censorPreviewCanvas.height;

        ctx.drawImage(censorOriginalImage, 0, 0);

        // Draw Badges
        activeStickers.forEach(sticker => {
            ctx.save();
            ctx.font = "900 36px 'Outfit', sans-serif";
            const textMetrics = ctx.measureText(sticker.text);
            const badgeW = textMetrics.width + 36;
            const badgeH = 54;

            ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(sticker.x, sticker.y, badgeW, badgeH, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(sticker.text, sticker.x + badgeW / 2, sticker.y + badgeH / 2);
            ctx.restore();
        });

        // Draw Headline Text
        const text = thumbHeadlineInput ? thumbHeadlineInput.value.trim() : "";
        if (text) {
            const fSize = thumbFontSize ? parseInt(thumbFontSize.value, 10) : 64;
            const tColor = thumbTextColor ? thumbTextColor.value : "#FFFFFF";
            const sColor = thumbStrokeColor ? thumbStrokeColor.value : "#06b6d4";

            ctx.save();
            ctx.font = `900 ${fSize}px 'Outfit', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const textX = w / 2;
            const textY = h * 0.2;

            // Ribbon Background
            if (thumbRibbonToggle && thumbRibbonToggle.checked) {
                const metrics = ctx.measureText(text);
                const rw = metrics.width + 60;
                const rh = fSize + 30;
                ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
                ctx.beginPath();
                ctx.roundRect(textX - rw / 2, textY - rh / 2, rw, rh, 16);
                ctx.fill();
            }

            // Drop Shadow
            if (thumbShadowToggle && thumbShadowToggle.checked) {
                ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
                ctx.shadowBlur = 16;
                ctx.shadowOffsetX = 6;
                ctx.shadowOffsetY = 8;
            }

            // Stroke
            ctx.lineWidth = Math.max(4, fSize * 0.1);
            ctx.strokeStyle = sColor;
            ctx.lineJoin = "round";
            ctx.strokeText(text, textX, textY);

            // Fill
            ctx.fillStyle = tColor;
            ctx.fillText(text, textX, textY);
            ctx.restore();
        }
    }

    if (thumbHeadlineInput) thumbHeadlineInput.addEventListener("input", renderThumbnailCanvas);
    if (thumbFontSize && thumbFontSizeVal) {
        thumbFontSize.addEventListener("input", (e) => {
            thumbFontSizeVal.textContent = `${e.target.value}px`;
            renderThumbnailCanvas();
        });
    }
    if (thumbTextColor) thumbTextColor.addEventListener("input", renderThumbnailCanvas);
    if (thumbStrokeColor) thumbStrokeColor.addEventListener("input", renderThumbnailCanvas);
    if (thumbShadowToggle) thumbShadowToggle.addEventListener("change", renderThumbnailCanvas);
    if (thumbRibbonToggle) thumbRibbonToggle.addEventListener("change", renderThumbnailCanvas);

    thumbBadgeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const badgeText = btn.getAttribute("data-badge");
            activeStickers.push({
                text: badgeText,
                x: 40 + (activeStickers.length % 3) * 180,
                y: censorPreviewCanvas ? censorPreviewCanvas.height - 90 : 400
            });
            renderThumbnailCanvas();
            showToast(`Badge ${badgeText} stamped on photo!`, "success");
        });
    });

    if (censorDownloadBtn) {
        censorDownloadBtn.addEventListener("click", () => {
            if (censorActiveMode === "thumbnail" || !censorCurrentBlob) {
                if (!censorPreviewCanvas) return;
                censorPreviewCanvas.toBlob((blob) => {
                    if (!blob) return;
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = censorActiveMode === "thumbnail" ? "supiristudio_social_thumbnail.png" : "supiristudio_privacy_censored.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast("Download started!", "success");
                }, "image/png");
            } else {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(censorCurrentBlob);
                link.download = "supiristudio_privacy_censored.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast("Download started!", "success");
            }
        });
    }

    if (censorResetBtn || censorProcessAnotherBtn) {
        const resetHandler = () => {
            censorWorkspaceArea.classList.add("hidden");
            censorUploadArea.classList.remove("hidden");
            censorReadyCard.classList.add("hidden");
            if (censorFileInput) censorFileInput.value = "";
            censorOriginalBlob = null;
            censorCurrentBlob = null;
            censorOriginalImage = null;
            activeStickers = [];
            clearCensorBoxes();
        };
        if (censorResetBtn) censorResetBtn.addEventListener("click", resetHandler);
        if (censorProcessAnotherBtn) censorProcessAnotherBtn.addEventListener("click", resetHandler);
    }

    // ========================================================
    // TOOL 6: 🪪 BIOMETRIC ID, PASSPORT & VISA STUDIO PRO
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

    // ========================================================
    // 12. BILINGUAL USER MANUAL & HELP CENTER CONTROLLER
    // ========================================================
    const userGuideModal = document.getElementById("userGuideModal");
    const userGuideBody = document.getElementById("userGuideBody");
    const userGuideModalTitle = document.getElementById("userGuideModalTitle");
    const userGuideModalSubtitle = document.getElementById("userGuideModalSubtitle");
    const guideLangEnBtn = document.getElementById("guideLangEnBtn");
    const guideLangSiBtn = document.getElementById("guideLangSiBtn");
    const guideTryBtnText = document.getElementById("guideTryBtnText");
    const firstTimeWelcomeCard = document.getElementById("firstTimeWelcomeCard");

    let currentGuideTool = "bg";
    let currentGuideLang = "en";

    const USER_GUIDE_DATA = {
        bg: {
            icon: "fa-scissors",
            badgeColor: "emerald",
            tabTarget: "tab-bg",
            en: {
                title: "✂️ AI Background Remover & Product Studio",
                subtitle: "Photoroom-grade automatic AI segmentation, hair matting, 3D shadows & reflections",
                card1Title: "💡 What is it used for? (Real-World Use Cases)",
                card1Desc: "Instantly remove backgrounds and turn ordinary mobile photos into commercial studio assets:",
                card1Items: [
                    "<strong>E-Commerce & Online Stores:</strong> Create clean white or transparent product listings for Daraz, eBay, Shopify, and WooCommerce.",
                    "<strong>Social Media Ads & Posts:</strong> Place products on studio gradients, colored backdrops, or luxury scenes with realistic lighting.",
                    "<strong>Product Glass Reflections:</strong> Add authentic E-Commerce glass mirror reflections and floor podium shadows.",
                    "<strong>YouTube Thumbnails & Posters:</strong> Generate cutout subjects with razor-sharp white outlines (Stickers).",
                    "<strong>Profile Pictures & Portfolios:</strong> Isolate portraits cleanly with Deep Learning neural hair matting."
                ],
                card2Title: "🛠️ How to use it step-by-step?",
                card2Desc: "Follow these simple steps to isolate subjects and compose professional backdrops:",
                card2Steps: [
                    {
                        num: "1",
                        title: "Select AI Detection Mode",
                        desc: "Choose <strong>🤖 Auto AI</strong> for objects, products, and animals; <strong>👤 Portrait Hair Pro</strong> for human portraits with ultra-fine hair detail; or <strong>✍️ Manual Cutout</strong> for hands-on canvas editing."
                    },
                    {
                        num: "2",
                        title: "Upload Your Photo",
                        desc: "Drag and drop or click to upload any PNG, JPG, or WEBP photo (up to 50 MB). Real Deep Learning ONNX AI models (u2netp / u2net_human_seg) compute a full HD alpha cutout."
                    },
                    {
                        num: "3",
                        title: "Fine-Tune with Interactive Touch-Up Tools",
                        desc: "Use the top toolbar to refine edges:<br>• <strong>🟢 Restore Brush (ආපහු ගන්න):</strong> Paint to bring back any accidentally removed subject pixels from the original photo.<br>• <strong>🔴 Erase Brush (මකන්න):</strong> Paint over leftover background spots to delete them cleanly.<br>• <strong>🪄 Magic Color Eraser (එක පාටක් මකන්න):</strong> Click any solid color spot to flood-erase matching pixels within the tolerance setting.<br>• <strong>👁️ Hold Compare:</strong> Press and hold down to view the original photo side-by-side."
                    },
                    {
                        num: "4",
                        title: "Choose Backdrop & Lighting Effects",
                        desc: "Select Transparent Checkerboard, Pure White, Studio Blue, Cyber Emerald Gradients, or upload your own custom photo. Add <strong>Realistic 3D Drop Shadow</strong>, <strong>Subject Outline</strong>, <strong>🪞 Mirror Reflection</strong>, or <strong>🏛️ Studio Floor Podium</strong>."
                    },
                    {
                        num: "5",
                        title: "Download or Transfer to ID Studio",
                        desc: "Click <strong>'⬇️ Download File Now'</strong> to save your high-resolution PNG, or click <strong>'Open in Biometric Passport Studio'</strong> to create official passport photos."
                    }
                ],
                card3Title: "✨ What happens after processing?",
                card3Desc: "Our lightweight neural inference session calculates high-fidelity alpha masks directly at original Full HD resolution. No personal photos are stored on servers. When the progress bar hits 100%, the green ready card appears for instant download.",
                tryBtn: "🚀 Try AI BG Studio Now"
            },
            si: {
                title: "✂️ AI Background Remover සහ Product Studio",
                subtitle: "කෘත්‍රිම බුද්ධිය (AI) මගින් පසුබිම් ඉවත් කිරීම, හිසකෙස් පැහැදිලිව කැපීම, 3D සෙවනැලි සහ Mirror Reflections",
                card1Title: "💡 මොන වගේ දේවල් වලටද පාවිච්චි කරන්නේ? (ප්‍රයෝජන)",
                card1Desc: "සාමාන්‍ය දුරකථන ඡායාරූප තත්පර කිහිපයකින් උසස් තත්ත්වයේ වාණිජ මට්ටමේ ඡායාරූප බවට පත් කරගන්න:",
                card1Items: [
                    "<strong>ඔන්ලයින් වෙළඳසැල් (E-Commerce):</strong> Daraz, eBay, Shopify, Facebook Marketplace සඳහා සුදු හෝ විනිවිද පෙනෙන (Transparent) පසුබිම් සහිත භාණ්ඩ ඡායාරූප සෑදීම.",
                    "<strong>සමාජ මාධ්‍ය දැන්වීම්:</strong> ආකර්ෂණීය Studio Gradients, වර්ණ හෝ වෙනත් පසුබිම් ඡායාරූප මත භාණ්ඩ ස්ථානගත කිරීම.",
                    "<strong>වීදුරු පිළිබිඹු (Mirror Reflection):</strong> භාණ්ඩ වලට සුඛෝපභෝගී E-Commerce Glass Mirror Reflection සහ Studio Floor Podium සෙවනැලි එක් කිරීම.",
                    "<strong>YouTube Thumbnails සහ පෝස්ටර්:</strong> සුදු පාට Outline (Sticker Stroke) සහිත ආකර්ෂණීය Cutouts නිර්මාණය කිරීම.",
                    "<strong>පැතිකඩ පින්තූර (Profile Photos):</strong> හිසකෙස් කිසිදු කැපීමකින් තොරව ඉතා සියුම්ව වෙන් කර ගැනීම."
                ],
                card2Title: "🛠️ පාවිච්චි කරන්නේ කොහොමද? (පියවරෙන් පියවර උපදෙස්)",
                card2Desc: "පහත පියවර අනුගමනය කර ඉතා පහසුවෙන් වෘත්තීය මට්ටමේ ඡායාරූප සාදා ගන්න:",
                card2Steps: [
                    {
                        num: "1",
                        title: "AI Detection Mode එක තෝරන්න",
                        desc: "භාණ්ඩ, සතුන් හෝ ලාංඡන සඳහා <strong>🤖 Auto AI</strong>, මිනිසුන්ගේ හිසකෙස් සියුම්ව කපා ගැනීමට <strong>👤 Portrait Hair Pro</strong>, හෝ කැන්වසය මත තමන්ටම බ්‍රෂ් එකෙන් මකා ගැනීමට <strong>✍️ Manual Cutout</strong> තෝරන්න."
                    },
                    {
                        num: "2",
                        title: "ඡායාරූපය ඇතුළත් කරන්න (Upload)",
                        desc: "ඔබගේ ඡායාරූපය Dropzone එකට Drag කරන්න හෝ Click කර තෝරන්න (උපරිම 50 MB). ONNX Deep Learning AI මාදිලි මගින් තත්පර කිහිපයකින් Full HD Cutout එකක් සාදයි."
                    },
                    {
                        num: "3",
                        title: "Touch-Up මෙවලම් මගින් සියුම් වෙනස්කම් කරන්න",
                        desc: "කැන්වසයට ඉහළින් ඇති Toolbar එකෙන්:<br>• <strong>🟢 Restore Brush (ආපහු ගන්න):</strong> නොදැනුවත්ව මැකුණු කොටස් මුල් ඡායාරූපයෙන් ආපසු ලබාගැනීමට පාට කරන්න.<br>• <strong>🔴 Erase Brush (මකන්න):</strong> ඉතිරි වූ අනවශ්‍ය පසුබිම් කොටස් පිරිසිදුව මකා දැමීමට පාට කරන්න.<br>• <strong>🪄 Magic Color Eraser (එක පාටක් මකන්න):</strong> එකම පාටක් ක්ලික් කර එම වර්ණය එකවර මකා දමන්න.<br>• <strong>👁️ Hold Compare:</strong> මුල් ඡායාරූපය සමඟ වෙනස බැලීමට ඔබාගෙන සිටින්න."
                    },
                    {
                        num: "4",
                        title: "පසුබිම් සහ ආලෝකකරණ එක් කරන්න",
                        desc: "Transparent, Pure White, Studio Blue, Cyber Emerald Gradients තෝරන්න, නැතහොත් වෙනත් ඡායාරූපයක් Upload කරන්න. <strong>3D Drop Shadow</strong>, <strong>සුදු Outline</strong>, <strong>🪞 Mirror Reflection</strong>, හෝ <strong>🏛️ Studio Floor Podium</strong> එක්කරන්න."
                    },
                    {
                        num: "5",
                        title: "බාගන්න (Download) හෝ ID Studio වෙත යවන්න",
                        desc: "<strong>'⬇️ Download File Now'</strong> ඔබා HD PNG ගොනුව බාගන්න. නැතහොත් <strong>'Open in Biometric Passport Studio'</strong> ඔබා පාස්පෝට් ඡායාරූප සාදන්න."
                    }
                ],
                card3Title: "✨ පාවිච්චි කළාම මොකද වෙන්නේ? (ප්‍රතිඵලය)",
                card3Desc: "කෘත්‍රිම බුද්ධිය (AI) මගින් මුල් ඡායාරූපයේ තත්ත්වයටම (Full HD) සියුම් Alpha Mask එකක් සකසයි. ඔබගේ ඡායාරූප කිසිදු සේවාදායකයක තබා නොගන්නා බැවින් 100% පුද්ගලිකත්වය සුරැකේ. Progress Bar එක 100% වූ පසු කොළ පැහැති Download Card එක දිස්වේ.",
                tryBtn: "🚀 දැන්ම AI BG Studio පාවිච්චි කරන්න"
            }
        },

        eraser: {
            icon: "fa-paintbrush",
            badgeColor: "cyan",
            tabTarget: "tab-eraser",
            en: {
                title: "🖌️ Magic Object & Watermark Eraser",
                subtitle: "Multi-algorithm inpainting to cleanly erase photobombers, text, logos & blemishes",
                card1Title: "💡 What is it used for? (Real-World Use Cases)",
                card1Desc: "Erase unwanted elements without damaging or blurring the surrounding background texture:",
                card1Items: [
                    "<strong>Remove Photobombers & People:</strong> Erase strangers, passersby, or crowds from vacation and wedding photos.",
                    "<strong>Delete Watermarks & Logos:</strong> Remove copyright stamps, date imprints, website URLs, and corner brand logos.",
                    "<strong>Clean Up Landscapes & Architecture:</strong> Erase power lines, trash cans, street signs, and reflections.",
                    "<strong>Facial Blemish Removal:</strong> Smooth out pimples, scars, dust spots, or lens scratches cleanly."
                ],
                card2Title: "🛠️ How to use it step-by-step?",
                card2Desc: "Highlight unwanted objects in red and let the AI inpainting engine fill the space:",
                card2Steps: [
                    {
                        num: "1",
                        title: "Upload Your Photo",
                        desc: "Drop or select any PNG, JPG, or WEBP image (up to 50 MB)."
                    },
                    {
                        num: "2",
                        title: "Select Eraser Mode",
                        desc: "Choose <strong>🎯 Magic Object Remover</strong> for people, animals, and objects, or <strong>💧 Watermark & Logo Eraser</strong> for text and graphics."
                    },
                    {
                        num: "3",
                        title: "Pick Your Mask Selector",
                        desc: "Choose <strong>🖌️ Freehand Brush</strong> (adjust brush size 5–100px), <strong>⬜ Rectangle Box</strong> for quick logo selection, or <strong>➰ Lasso Selector</strong> for geometric shapes. Use the <strong>Magnifier Loupe</strong> for micro precision!"
                    },
                    {
                        num: "4",
                        title: "Paint Over the Object in Red",
                        desc: "Draw over the unwanted area. The red overlay indicates the exact pixels to be inpainted."
                    },
                    {
                        num: "5",
                        title: "Select Inpaint Algorithm & Process",
                        desc: "Choose <strong>Telea (Smooth Fluid)</strong> for portraits, <strong>Navier-Stokes (Sharp Edge)</strong> for buildings/lines, or <strong>Patch Match</strong>. Click <strong>'✨ Erase Object / Watermark Now'</strong> and download!"
                    }
                ],
                card3Title: "✨ What happens after processing?",
                card3Desc: "The inpainting engine calculates fluid partial differential equations and gradient continuities from surrounding pixels, reconstructing textures seamlessly without leaving smudges. The final result is delivered in full HD.",
                tryBtn: "🚀 Try Magic Eraser Now"
            },
            si: {
                title: "🖌️ Magic Object සහ Watermark Eraser",
                subtitle: "ඡායාරූප වල ඇති අනවශ්‍ය පුද්ගලයින්, ලාංඡන, අකුරු සහ ලප මුල් පසුබිමට හානි නොවී මකා දැමීම",
                card1Title: "💡 මොන වගේ දේවල් වලටද පාවිච්චි කරන්නේ? (ප්‍රයෝජන)",
                card1Desc: "පසුබිමට කිසිදු හානියක් හෝ බොඳවීමක් සිදුනොකර අනවශ්‍ය ඕනෑම දෙයක් අතුරුදහන් කරන්න:",
                card1Items: [
                    "<strong>අනවශ්‍ය පුද්ගලයින් ඉවත් කිරීම (Photobombers):</strong> සංචාරක හෝ මංගල ඡායාරූප වල පසුපසින් සිටින අනවශ්‍ය පුද්ගලයින් සහ සෙනඟ මකා දැමීම.",
                    "<strong>වෝටර්මාර්ක් සහ ලාංඡන (Logos):</strong> ඡායාරූප මත ඇති Copyright සලකුණු, දිනයන්, Website නම්, සහ Brand ලාංඡන ඉවත් කිරීම.",
                    "<strong>පරිසරය පිරිසිදු කිරීම:</strong> විදුලි කණු, විදුලි රැහැන්, පාරේ ඇති කුණු බඳුන්, සහ අනවශ්‍ය පුවරු මකා දැමීම.",
                    "<strong>මුහුණේ ලප ඉවත් කිරීම:</strong> කුරුලෑ, කැළැල් හෝ කැමරා කාචයේ දූවිලි සලකුණු ස්වභාවිකව මැකීම."
                ],
                card2Title: "🛠️ පාවිච්චි කරන්නේ කොහොමද? (පියවරෙන් පියවර උපදෙස්)",
                card2Desc: "අයින් කළ යුතු කොටස රතු පාටින් ලකුණු කර AI එකට භාරදෙන්න:",
                card2Steps: [
                    {
                        num: "1",
                        title: "ඡායාරූපය Upload කරන්න",
                        desc: "ඕනෑම PNG, JPG, හෝ WEBP ඡායාරූපයක් ඇතුළත් කරන්න (උපරිම 50 MB)."
                    },
                    {
                        num: "2",
                        title: "Eraser Mode එක තෝරන්න",
                        desc: "පුද්ගලයින් හෝ ද්‍රව්‍ය සඳහා <strong>🎯 Magic Object Remover</strong>, අකුරු හෝ ලාංඡන සඳහා <strong>💧 Watermark & Logo Eraser</strong> තෝරන්න."
                    },
                    {
                        num: "3",
                        title: "Selector මෙවලම තෝරන්න",
                        desc: "අතින් පාට කිරීමට <strong>🖌️ Freehand Brush</strong> (5–100px), පෙට්ටියක් ඇඳීමට <strong>⬜ Rectangle Box</strong>, හෝ නිදහස් හැඩතල සඳහා <strong>➰ Lasso</strong> තෝරන්න. සියුම් තැන් සඳහා <strong>Magnifier Loupe</strong> (විශාලනය) පාවිච්චි කරන්න."
                    },
                    {
                        num: "4",
                        title: "අනවශ්‍ය කොටස රතු පාටින් පාට කරන්න",
                        desc: "මකා දැමිය යුතු කොටස මත රතු පාට ආවරණය (Red Mask) යොදන්න."
                    },
                    {
                        num: "5",
                        title: "Inpainting Algorithm එක තෝරා මකා දමන්න",
                        desc: "ස්වභාවික මෘදු බව සඳහා <strong>Telea</strong>, පැහැදිලි දාර සඳහා <strong>Navier-Stokes</strong> තෝරා <strong>'✨ Erase Object / Watermark Now'</strong> ඔබන්න. තත්පර කිහිපයකින් පිරිසිදු ඡායාරූපය බාගන්න!"
                    }
                ],
                card3Title: "✨ පාවිච්චි කළාම මොකද වෙන්නේ? (ප්‍රතිඵලය)",
                card3Desc: "Inpainting ගණිතමය ඇල්ගොරිතම මගින් මකා දැමූ කොටස අවට ඇති පසුබිම් වයනය (Texture) සහ වර්ණ රටා ස්වභාවිකව ගළපා අලුතින්ම නිර්මාණය කරයි. කිසිදු බොඳවීමක් හෝ සලකුණක් ඉතිරි නොවේ.",
                tryBtn: "🚀 දැන්ම Magic Eraser පාවිච්චි කරන්න"
            }
        },

        video: {
            icon: "fa-film",
            badgeColor: "cyan",
            tabTarget: "tab-video",
            en: {
                title: "🎬 Video Watermark, GIF & Compressor",
                subtitle: "Hardware-accelerated video delogoing, edge cropping, looping GIFs & WhatsApp compression",
                card1Title: "💡 What is it used for? (Real-World Use Cases)",
                card1Desc: "Multi-functional video processing studio powered by high-speed FFmpeg engines:",
                card1Items: [
                    "<strong>Erase Video Logos & Usernames:</strong> Blur or erase moving/static TikTok, CapCut, Instagram Reels, and TV channel logos.",
                    "<strong>Crop Edge Watermarks:</strong> Remove corner watermarks and convert clips to 9:16 (TikTok), 16:9 (YouTube), or 1:1 (Instagram).",
                    "<strong>Video to Looping GIF:</strong> Turn video highlights, movie clips, and memes into lightweight 12 FPS looping GIFs for WhatsApp and web.",
                    "<strong>WhatsApp Video Compressor:</strong> Shrink large 50 MB video files down to 5–10 MB with H.264/AAC for ultra-fast messaging sharing without visible quality loss."
                ],
                card2Title: "🛠️ How to use it step-by-step?",
                card2Desc: "Pick one of the 4 dedicated video sub-tools and process in seconds:",
                card2Steps: [
                    {
                        num: "1",
                        title: "Upload Your Video",
                        desc: "Upload MP4, MOV, WEBM, or MKV video files (up to 50 MB)."
                    },
                    {
                        num: "2",
                        title: "Select One of 4 Sub-Tools",
                        desc: "• <strong>💧 Blur/Erase:</strong> Drag up to 4 colored delogo boxes over video watermarks. Adjust blur radius (10–60px), set start/end timestamps, or add custom branding.<br>• <strong>✂️ Crop Frame:</strong> Drag the crop frame or click 9:16, 16:9, or 1:1 presets to crop away corner watermarks.<br>• <strong>🎞️ Video to GIF:</strong> Select 480p/720p and convert clip to smooth animated GIF.<br>• <strong>📦 WhatsApp Compressor:</strong> Select H.264/AAC high-efficiency compression (50%–80% size reduction)."
                    },
                    {
                        num: "3",
                        title: "Process & Preview",
                        desc: "Click <strong>'Process Video'</strong>. Watch the animated progress bar as FFmpeg transcodes your media."
                    },
                    {
                        num: "4",
                        title: "Download Clean Video or GIF",
                        desc: "Preview your processed video inside the interactive HTML5 player and click <strong>'⬇️ Download File Now'</strong>."
                    }
                ],
                card3Title: "✨ What happens after processing?",
                card3Desc: "Our server executes native FFmpeg binaries with faststart flags. Video and audio codecs remain perfectly synchronized. The output file is rendered with universal MP4/H.264 compatibility for every browser, phone, and TV.",
                tryBtn: "🚀 Try Video Studio Now"
            },
            si: {
                title: "🎬 Video Watermark, GIF සහ Compressor",
                subtitle: "වීඩියෝ ලාංඡන මැකීම, දාර කැපීම (Crop), Looping GIF සෑදීම සහ WhatsApp සඳහා වීඩියෝ කුඩා කිරීම",
                card1Title: "💡 මොන වගේ දේවල් වලටද පාවිච්චි කරන්නේ? (ප්‍රයෝජන)",
                card1Desc: "FFmpeg තාක්ෂණයෙන් බලගැන්වුණු බහුවිධ වීඩියෝ සංස්කරණ මෙවලම් 4 ක් එකම තැනකින්:",
                card1Items: [
                    "<strong>TikTok, CapCut සහ TV Logos ඉවත් කිරීම:</strong> වීඩියෝ වල ඇති චැනල් ලාංඡන, TikTok Usernames සහ Watermarks බොඳ (Blur) කර ඉවත් කිරීම.",
                    "<strong>දාර කපා දැමීම (Crop Frame):</strong> දාරවල ඇති වෝටර්මාර්ක් ඉවත් කිරීමට 9:16 (TikTok), 16:9 (YouTube), හෝ 1:1 (Instagram) ලෙස වීඩියෝව Crop කිරීම.",
                    "<strong>Looping Animated GIF සෑදීම:</strong> විනෝදජනක වීඩියෝ කොටස්, Memes සහ Highlights තත්පර කිහිපයකින් WhatsApp සහ Web සඳහා GIF බවට පත් කිරීම.",
                    "<strong>WhatsApp Video Compressor:</strong> විශාල වීඩියෝ ගොනු (50 MB) ගුණාත්මක බව ඒ අයුරින්ම රැකගෙන 5–10 MB දක්වා (50%–80% කින්) කුඩා කිරීම."
                ],
                card2Title: "🛠️ පාවිච්චි කරන්නේ කොහොමද? (පියවරෙන් පියවර උපදෙස්)",
                card2Desc: "පහත දැක්වෙන ප්‍රධාන උප-මෙවලම් 4 න් එකක් තෝරාගෙන පහසුවෙන් වීඩියෝ සංස්කරණය කරන්න:",
                card2Steps: [
                    {
                        num: "1",
                        title: "වීඩියෝව Upload කරන්න",
                        desc: "ඕනෑම MP4, MOV, WEBM, හෝ MKV වීඩියෝවක් ඇතුළත් කරන්න (උපරිම 50 MB)."
                    },
                    {
                        num: "2",
                        title: "අවශ්‍ය උප-මෙවලම තෝරන්න",
                        desc: "• <strong>💧 Blur/Erase:</strong> වෝටර්මාර්ක් එක උඩට Delogo Boxes 4 ක් දක්වා Drag කරන්න. Blur ප්‍රමාණය, කාලසීමාව සහ ඔබේම Text එකක් එක්කරන්න.<br>• <strong>✂️ Crop Frame:</strong> දාරවල ලාංඡන කැපීමට 9:16, 16:9, හෝ 1:1 තෝරන්න.<br>• <strong>🎞️ Video to GIF:</strong> සුමට 12 FPS Looping GIF එකක් සාදා ගන්න.<br>• <strong>📦 WhatsApp Compressor:</strong> සයිස් එක 50%–80% කින් අඩු කර වේගයෙන් යැවීමට සකසන්න."
                    },
                    {
                        num: "3",
                        title: "Process කර ප්‍රතිඵලය නරඹන්න",
                        desc: "<strong>'Process Video'</strong> ඔබන්න. වීඩියෝව සකසා අවසන් වූ පසු Player එකෙන් නරඹන්න."
                    },
                    {
                        num: "4",
                        title: "පිරිසිදු වීඩියෝව බාගන්න",
                        desc: "<strong>'⬇️ Download File Now'</strong> ඔබා පරිගණකයට හෝ දුරකථනයට කෙලින්ම සුරකින්න."
                    }
                ],
                card3Title: "✨ පාවිච්චි කළාම මොකද වෙන්නේ? (ප්‍රතිඵලය)",
                card3Desc: "ශ්‍රව්‍ය (Audio) සහ දෘශ්‍ය (Video) කොටස් අතර කාල ගැලපීම (Sync) 100% ක් ආරක්ෂා කරමින් නවීන H.264/AAC තාක්ෂණයෙන් නව MP4 හෝ GIF ගොනුවක් සකස් කර ලබාදෙයි.",
                tryBtn: "🚀 දැන්ම Video Studio පාවිච්චි කරන්න"
            }
        },

        enhance: {
            icon: "fa-wand-magic-sparkles",
            badgeColor: "emerald",
            tabTarget: "tab-enhance",
            en: {
                title: "✨ AI Photo Enhancer & Color Studio",
                subtitle: "Unsharp mask contrast enhancement, B&W photo colorization & 8 cinematic LUT filters",
                card1Title: "💡 What is it used for? (Real-World Use Cases)",
                card1Desc: "Instantly restore, sharpen, and transform low-quality, blurry, or vintage photos:",
                card1Items: [
                    "<strong>Fix Blurry Mobile Photos:</strong> Restore clarity, sharpness, and micro-contrast to shaky or out-of-focus phone photos.",
                    "<strong>Restore Old Family Portraits:</strong> Clean up vintage black & white photos and remove film grain and scanner blur.",
                    "<strong>AI B&W to Color Reconstruction:</strong> Automatically inject lifelike skin tones, foliage greens, and sky blues into historical B&W photos.",
                    "<strong>Cinematic Color Grading:</strong> Apply professional Lightroom-style color grading presets with a single click."
                ],
                card2Title: "🛠️ How to use it step-by-step?",
                card2Desc: "Enhance photos and compare the before/after results with interactive split sliders:",
                card2Steps: [
                    {
                        num: "1",
                        title: "Upload Your Photo",
                        desc: "Select any PNG, JPG, or WEBP photo (up to 50 MB)."
                    },
                    {
                        num: "2",
                        title: "Select Enhancement Preset",
                        desc: "Choose <strong>Auto HD Enhance</strong> for overall clarity, <strong>B&W to Colorizer</strong> for vintage color restoration, or one of the <strong>8 Cinematic LUTs</strong> (Teal & Orange, Cyberpunk, Sunset Gold, Vintage Retro, etc.)."
                    },
                    {
                        num: "3",
                        title: "Adjust Manual Tuning Sliders",
                        desc: "Fine-tune with sliders: <strong>Sharpness</strong> (0–100%), <strong>Adaptive Contrast</strong> (0–50%), <strong>Brightness</strong>, and <strong>Color Saturation</strong>."
                    },
                    {
                        num: "4",
                        title: "Compare with Before/After Split Slider",
                        desc: "Drag the vertical cyan divider line left and right to inspect the dramatic improvement side-by-side!"
                    },
                    {
                        num: "5",
                        title: "Download Ultra HD Photo",
                        desc: "Click <strong>'⬇️ Download File Now'</strong> to export full-resolution enhanced imagery."
                    }
                ],
                card3Title: "✨ What happens after processing?",
                card3Desc: "Our vision pipeline applies spatial kernel unsharp masking, LAB-space color transfer, and contrast histogram equalization. The result retains true pixel detail without introducing plastic-looking over-smoothing.",
                tryBtn: "🚀 Try Photo Enhancer Now"
            },
            si: {
                title: "✨ AI Photo Enhancer සහ Color Studio",
                subtitle: "නොපැහැදිලි ඡායාරූප පැහැදිලි කිරීම, පරණ කළු-සුදු ඡායාරූප පාට කිරීම (Colorize) සහ Cinematic LUTs",
                card1Title: "💡 මොන වගේ දේවල් වලටද පාවිච්චි කරන්නේ? (ප්‍රයෝජන)",
                card1Desc: "දුර්වල, නොපැහැදිලි හෝ පැරණි ඡායාරූප තත්පර කිහිපයකින් ස්ටූඩියෝ මට්ටමට ගෙන එන්න:",
                card1Items: [
                    "<strong>බොඳවුණු ඡායාරූප පැහැදිලි කිරීම:</strong> සෙලවුණු, Focus නැති වූ, හෝ ගුණාත්මක බව අඩු දුරකථන ඡායාරූප වල දාර සහ සියුම් විස්තර මතු කිරීම.",
                    "<strong>පැරණි පින්තූර අලුත්වැඩියා කිරීම:</strong> පවුලේ පැරණි කළු-සුදු ඡායාරූප වල ඇති අපැහැදිලි බව ඉවත් කර පැහැදිලි කිරීම.",
                    "<strong>කළු-සුදු පින්තූර පාට කිරීම (B&W Colorizer):</strong> පැරණි කළු-සුදු ඡායාරූප වලට ස්වභාවික සමේ පැහැය, නිල් අහස සහ පරිසර වර්ණ එක්කිරීම.",
                    "<strong>සිනමාත්මක වර්ණ ගැන්වීම (Color Grading):</strong> ජනප්‍රිය Lightroom Presets මෙන් Teal & Orange, Cyberpunk, හෝ Vintage වර්ණ යෙදීම."
                ],
                card2Title: "🛠️ පාවිච්චි කරන්නේ කොහොමද? (පියවරෙන් පියවර උපදෙස්)",
                card2Desc: "පහත පියවර මගින් ඔබගේ ඡායාරූප වල ගුණාත්මකභාවය ඉහළ නංවා ගන්න:",
                card2Steps: [
                    {
                        num: "1",
                        title: "ඡායාරූපය Upload කරන්න",
                        desc: "ඕනෑම PNG, JPG, හෝ WEBP ඡායාරූපයක් ඇතුළත් කරන්න (උපරිම 50 MB)."
                    },
                    {
                        num: "2",
                        title: "Preset එක තෝරාගන්න",
                        desc: "පැහැදිලි කිරීමට <strong>Auto HD Enhance</strong>, පාට කිරීමට <strong>B&W to Colorizer</strong>, හෝ සිනමාත්මක <strong>8 Studio LUTs</strong> (Teal & Orange, Cyberpunk, etc.) එකක් තෝරන්න."
                    },
                    {
                        num: "3",
                        title: "Sliders මගින් සියුම්ව සකසන්න",
                        desc: "<strong>Sharpness</strong> (පැහැදිලි බව), <strong>Contrast</strong>, <strong>Brightness</strong> (දීප්තිය), සහ <strong>Saturation</strong> (වර්ණ තීව්‍රතාව) අවශ්‍ය පරිදි වෙනස් කරන්න."
                    },
                    {
                        num: "4",
                        title: "Before / After Split Slider එකෙන් වෙනස බලන්න",
                        desc: "තිරයේ ඇති නිල් පාට ඉර දෙපසට ඇද මුල් ඡායාරූපය සහ සකස් කළ ඡායාරූපය අතර ඇති දැවැන්ත වෙනස සජීවීව නරඹන්න!"
                    },
                    {
                        num: "5",
                        title: "Ultra HD ඡායාරූපය බාගන්න",
                        desc: "<strong>'⬇️ Download File Now'</strong> ඔබා උසස්ම තත්ත්වයෙන් ඡායාරූපය සුරකින්න."
                    }
                ],
                card3Title: "✨ පාවිච්චි කළාම මොකද වෙන්නේ? (ප්‍රතිඵලය)",
                card3Desc: "Unsharp Masking සහ Histogram Equalization තාක්ෂණයෙන් ඡායාරූපයේ සැඟවුණු විස්තර මතු කරමින් ස්වභාවික පෙනුම ආරක්ෂා කර දෙයි.",
                tryBtn: "🚀 දැන්ම Photo Enhancer පාවිච්චි කරන්න"
            }
        },

        privacy: {
            icon: "fa-shield-halved",
            badgeColor: "rose",
            tabTarget: "tab-privacy",
            en: {
                title: "🔒 Privacy Censor & Social Thumbnail Studio",
                subtitle: "Automated AI face & plate redaction + viral YouTube/FB thumbnail sticker maker",
                card1Title: "💡 What is it used for? (Real-World Use Cases)",
                card1Desc: "Essential privacy protection and high-CTR social media thumbnail creation in one tool:",
                card1Items: [
                    "<strong>Social Media Privacy Compliance:</strong> Blur children's faces, bystanders, or sensitive identities before posting online.",
                    "<strong>Vehicle Number Plates & IDs:</strong> Redact license plates, Sri Lanka National Identity Cards (NIC), driver's licenses, and bank cards.",
                    "<strong>Viral YouTube & Facebook Thumbnails:</strong> Add bold 3D headlines, neon outlines, and high-CTR sticker badges (🔥 VIRAL, ⚡ SALE, 💥 WOW).",
                    "<strong>News & Legal Redaction:</strong> Apply irreversible mosaic pixelation or black bars for GDPR / PDPA privacy compliance."
                ],
                card2Title: "🛠️ How to use it step-by-step?",
                card2Desc: "Protect personal identity or create eye-catching social posts with ease:",
                card2Steps: [
                    {
                        num: "1",
                        title: "Upload Your Photo",
                        desc: "Select any photo to censor or turn into a thumbnail (up to 50 MB)."
                    },
                    {
                        num: "2",
                        title: "Choose Studio Mode",
                        desc: "Select <strong>🕵️ Privacy & Plate Censor</strong> for redactions, or <strong>🖼️ Social Post & Thumbnail</strong> for graphic design."
                    },
                    {
                        num: "3",
                        title: "Censor Mode: Auto-Detect or Manual Boxes",
                        desc: "Click <strong>'🔍 Auto-Detect & Blur Faces'</strong> for instant AI face blurring, or drag manual censor boxes over number plates. Choose from <strong>Gaussian Blur</strong>, <strong>Mosaic Pixelate</strong>, or <strong>Solid Black Bar</strong>."
                    },
                    {
                        num: "4",
                        title: "Thumbnail Mode: 3D Headlines & Stickers",
                        desc: "Type your headline text, customize fill and stroke colors, adjust font size (24–120px), and click sticker badges like <strong>🔥 VIRAL</strong>, <strong>⚡ SALE</strong>, or <strong>💥 TOP</strong> to place on the canvas."
                    },
                    {
                        num: "5",
                        title: "Download Redacted Photo or Thumbnail",
                        desc: "Click <strong>'⬇️ Download File Now'</strong> to export clean, secure media."
                    }
                ],
                card3Title: "✨ What happens after processing?",
                card3Desc: "Redacted regions are permanently destroyed and rasterized at the pixel level — original blurred pixels can never be recovered or reversed. Thumbnails are rendered with sharp vector outlines for maximum click-through rates.",
                tryBtn: "🚀 Try Privacy & Post Now"
            },
            si: {
                title: "🔒 Privacy Censor සහ Thumbnail Studio",
                subtitle: "මුහුණු සහ වාහන අංක තහඩු Blur කිරීම + YouTube/FB සඳහා ආකර්ෂණීය Thumbnails සෑදීම",
                card1Title: "💡 මොන වගේ දේවල් වලටද පාවිච්චි කරන්නේ? (ප්‍රයෝජන)",
                card1Desc: "පුද්ගලිකත්වය සුරැකීම සහ සමාජ මාධ්‍ය සඳහා ආකර්ෂණීය පින්තූර සෑදීම එකම මෙවලමකින්:",
                card1Items: [
                    "<strong>පුද්ගලිකත්වය රැකගැනීම:</strong> සමාජ මාධ්‍ය වල පළ කිරීමට පෙර කුඩා දරුවන්ගේ, නාඳුනන පුද්ගලයින්ගේ මුහුණු ආරක්ෂිතව Blur කිරීම.",
                    "<strong>වාහන අංක තහඩු සහ හැඳුනුම්පත්:</strong> වාහන වල Number Plates, ජාතික හැඳුනුම්පත් (NIC), රියදුරු බලපත්‍ර සහ බැංකු කාඩ්පත් වල තොරතුරු සඟවාලීම.",
                    "<strong>YouTube & Facebook Thumbnails:</strong> වැඩි පිරිසක් ක්ලික් කරන ආකාරයේ ලොකු 3D අකුරු සහ Stickers (🔥 VIRAL, ⚡ SALE, 💥 TOP) එක්කිරීම.",
                    "<strong>නීත්‍යානුකූල ආරක්ෂාව:</strong> ආපසු හැරවිය නොහැකි Mosaic Pixelate හෝ Black Bars මගින් රහස්‍යභාවය තහවුරු කිරීම."
                ],
                card2Title: "🛠️ පාවිච්චි කරන්නේ කොහොමද? (පියවරෙන් පියවර උපදෙස්)",
                card2Desc: "පහත පියවර මගින් පුද්ගලික දත්ත සඟවන්න හෝ Thumbnails සාදන්න:",
                card2Steps: [
                    {
                        num: "1",
                        title: "ඡායාරූපය Upload කරන්න",
                        desc: "ඕනෑම ඡායාරූපයක් ඇතුළත් කරන්න (උපරිම 50 MB)."
                    },
                    {
                        num: "2",
                        title: "Studio Mode එක තෝරන්න",
                        desc: "තොරතුරු සැඟවීමට <strong>🕵️ Privacy Censor</strong>, හෝ Thumbnail සෑදීමට <strong>🖼️ Social Thumbnail</strong> තෝරන්න."
                    },
                    {
                        num: "3",
                        title: "Privacy: Auto-Detect හෝ Manual Boxes",
                        desc: "මුහුණු එකවර හඳුනාගෙන Blur කිරීමට <strong>'🔍 Auto-Detect & Blur Faces'</strong> ඔබන්න, නැතහොත් අතින් Censor Boxes ඇද <strong>Gaussian Blur</strong>, <strong>Mosaic Pixelate</strong>, හෝ <strong>Black Bar</strong> දමන්න."
                    },
                    {
                        num: "4",
                        title: "Thumbnail: 3D අකුරු සහ Stickers",
                        desc: "මාතෘකා අකුරු ලියා, පාට සහ ප්‍රමාණය වෙනස් කරන්න. <strong>🔥 VIRAL</strong>, <strong>⚡ SALE</strong>, <strong>💥 TOP</strong> වැනි Badges කැන්වසය මත තබන්න."
                    },
                    {
                        num: "5",
                        title: "ඡායාරූපය බාගන්න",
                        desc: "<strong>'⬇️ Download File Now'</strong> ඔබා ආරක්ෂිත ඡායාරූපය හෝ Thumbnail එක බාගන්න."
                    }
                ],
                card3Title: "✨ පාවිච්චි කළාම මොකද වෙන්නේ? (ප්‍රතිඵලය)",
                card3Desc: "Censor කරන ලද කොටස්වල මුල් පික්සල් ස්ථිරවම විනාශ කර ප්‍රතිස්ථාපනය කරන බැවින් කිසිවෙකුට ආපසු මුල් තොරතුරු ලබාගත නොහැක. 100% ක් නීත්‍යානුකූලව පුද්ගලිකත්වය සුරැකේ.",
                tryBtn: "🚀 දැන්ම Privacy & Post පාවිච්චි කරන්න"
            }
        },

        passport: {
            icon: "fa-id-card",
            badgeColor: "emerald",
            tabTarget: "tab-passport",
            en: {
                title: "🪪 Biometric ID, Passport & Visa Studio",
                subtitle: "Official Sri Lanka Passport, NIC, Visa presets & printable 4×6 / A4 photo sheets at 300 DPI",
                card1Title: "💡 What is it used for? (Real-World Use Cases)",
                card1Desc: "Create 100% compliant biometric ID and passport photos right from your smartphone:",
                card1Items: [
                    "<strong>Sri Lanka Official Documents:</strong> SL Passport (35 × 45 mm), National Identity Card (NIC), and Driving License (30 × 40 mm).",
                    "<strong>International Visa Photos:</strong> US Visa & DV Lottery (2 × 2 inches / 51 × 51 mm), UK, Schengen, Australia, and Canadian Visas.",
                    "<strong>Printable Studio Photo Sheets:</strong> Export standard 4×6 inch photo sheets (8 passport photos grid) or A4 sheets with cutting guidelines for instant printing at any local lab.",
                    "<strong>Official Background Enforcement:</strong> Automatically set compliant Pure White or Official Sky Blue backdrops."
                ],
                card2Title: "🛠️ How to use it step-by-step?",
                card2Desc: "Follow these 6 steps to generate compliant 300 DPI ID photo sheets:",
                card2Steps: [
                    {
                        num: "1",
                        title: "Upload Portrait or Transfer from BG Studio",
                        desc: "Upload a front-facing portrait photo, or transfer your clean cutout directly from Tool 1 with one click!"
                    },
                    {
                        num: "2",
                        title: "Select Document Preset",
                        desc: "Choose from <strong>🇱🇰 Sri Lanka Passport (35×45mm)</strong>, <strong>🇱🇰 SL NIC / License (30×40mm)</strong>, <strong>🇺🇸 US Visa / DV Lottery (2×2\")</strong>, or <strong>🇬🇧 UK / Schengen Visa</strong>."
                    },
                    {
                        num: "3",
                        title: "Choose Official Backdrop",
                        desc: "Select <strong>Official Pure White</strong> (standard for Passports/Visas) or <strong>Official Sky Blue</strong> (ICAO / Sri Lanka Driving License standard)."
                    },
                    {
                        num: "4",
                        title: "Align to Biometric Oval Guide",
                        desc: "Adjust the <strong>Zoom</strong> and <strong>Pan</strong> sliders until the subject's crown of head and chin align perfectly within the green biometric guidelines."
                    },
                    {
                        num: "5",
                        title: "Choose Sheet Print Layout",
                        desc: "Select <strong>Single ID Photo</strong>, <strong>Printable 4×6\" Sheet (8 Photos Grid)</strong>, or <strong>Printable A4 Sheet (24 Photos Grid)</strong> with cutting border guidelines."
                    },
                    {
                        num: "6",
                        title: "Download Print-Ready File",
                        desc: "Click <strong>'⬇️ Download File Now'</strong> to export a pristine 300 DPI JPG/PNG file ready for print."
                    }
                ],
                card3Title: "✨ What happens after processing?",
                card3Desc: "Our layout compositor scales the image to exact physical millimeter dimensions at 300 DPI print resolution, calculating standard padding and faint cutting lines. Print on glossy photo paper at any local studio for pennies!",
                tryBtn: "🚀 Try Biometric ID Studio Now"
            },
            si: {
                title: "🪪 Biometric ID, Passport සහ Visa Studio",
                subtitle: "ශ්‍රී ලංකා පාස්පෝට් (35x45mm), NIC, සහ Visa සඳහා නිල ඡායාරූප + 300 DPI Print Sheets",
                card1Title: "💡 මොන වගේ දේවල් වලටද පාවිච්චි කරන්නේ? (ප්‍රයෝජන)",
                card1Desc: "නිවසේ සිටම ජංගම දුරකථනයෙන් නිල ප්‍රමිතීන්ට අනුව හැඳුනුම්පත් සහ පාස්පෝට් ඡායාරූප සාදා ගන්න:",
                card1Items: [
                    "<strong>ශ්‍රී ලංකා නිල ලේඛන:</strong> ශ්‍රී ලංකා පාස්පෝට් (35 × 45 mm), ජාතික හැඳුනුම්පත (NIC), සහ රියදුරු බලපත්‍රය (30 × 40 mm).",
                    "<strong>විදේශ Visa ඡායාරූප:</strong> ඇමරිකානු US Visa & DV Lottery (2 × 2 inches / 51 × 51 mm), UK, Schengen, සහ Canada Visa ඡායාරූප.",
                    "<strong>මුද්‍රණය කළ හැකි Photo Sheets:</strong> ඕනෑම Studio එකකින් Print කර ගැනීමට 4×6 inch Sheet (ඡායාරූප 8 ක්) හෝ A4 Sheet එකක් කතුරෙන් කැපීමට Guide Lines සහිතව සෑදීම.",
                    "<strong>නිල පසුබිම් වර්ණ:</strong> නීත්‍යානුකූල Pure White හෝ Official Sky Blue පසුබිම් ස්වයංක්‍රීයව යෙදීම."
                ],
                card2Title: "🛠️ පාවිච්චි කරන්නේ කොහොමද? (පියවරෙන් පියවර උපදෙස්)",
                card2Desc: "පහත පියවර 6 අනුගමනය කර 300 DPI Print-Ready ඡායාරූප සාදා ගන්න:",
                card2Steps: [
                    {
                        num: "1",
                        title: "Portrait ඡායාරූපයක් Upload කරන්න",
                        desc: "ඉදිරිපස බලා සිටින ඡායාරූපයක් Upload කරන්න, නැතහොත් Tool 1 (BG Studio) එකේ සිට කෙලින්ම එවන්න."
                    },
                    {
                        num: "2",
                        title: "නිල ප්‍රමාණය තෝරන්න (Document Preset)",
                        desc: "<strong>🇱🇰 SL Passport (35×45mm)</strong>, <strong>🇱🇰 SL NIC / License (30×40mm)</strong>, <strong>🇺🇸 US Visa / DV Lottery (2×2\")</strong>, හෝ <strong>🇬🇧 UK / Schengen Visa</strong> තෝරන්න."
                    },
                    {
                        num: "3",
                        title: "නිල පසුබිම් වර්ණය තෝරන්න",
                        desc: "පාස්පෝට් සඳහා <strong>Official Pure White</strong>, හෝ රියදුරු බලපත්‍ර සඳහා <strong>Official Sky Blue</strong> තෝරන්න."
                    },
                    {
                        num: "4",
                        title: "Biometric Oval Guide එකට මුහුණ ගළපන්න",
                        desc: "මුහුණේ හිස මුදුන සහ නිකට හරියටම කොළ පැහැති මාර්ගෝපදේශ රේඛා තුළ පිහිටන සේ <strong>Zoom</strong> සහ <strong>Pan</strong> Sliders සකසන්න."
                    },
                    {
                        num: "5",
                        title: "Print Layout එක තෝරන්න",
                        desc: "තනි ඡායාරූපයක් සඳහා <strong>Single ID Photo</strong>, හෝ එකවර ඡායාරූප 8 ක් Print කර ගැනීමට <strong>Printable 4×6\" Sheet</strong> තෝරන්න."
                    },
                    {
                        num: "6",
                        title: "Print-Ready ගොනුව බාගන්න",
                        desc: "<strong>'⬇️ Download File Now'</strong> ඔබා 300 DPI High-Resolution ඡායාරූපය බාගෙන ඕනෑම Studio එකකින් අඩු වියදමින් Print කරගන්න."
                    }
                ],
                card3Title: "✨ පාවිච්චි කළාම මොකද වෙන්නේ? (ප්‍රතිඵලය)",
                card3Desc: "ජාත්‍යන්තර ICAO ප්‍රමිතීන්ට අනුව නිවැරදි මිලිමීටර් ගණනයෙන් 300 DPI තත්ත්වයෙන් සහ කතුරෙන් කැපීමට සියුම් මායිම් සහිතව ඡායාරූප පත්‍රය සකස් කර දෙයි.",
                tryBtn: "🚀 දැන්ම Biometric ID Studio පාවිච්චි කරන්න"
            }
        }
    };

    function renderUserGuideContent() {
        if (!userGuideBody) return;
        const toolData = USER_GUIDE_DATA[currentGuideTool] || USER_GUIDE_DATA["bg"];
        const langData = toolData[currentGuideLang] || toolData["en"];

        // Update modal title & subtitle based on language
        if (userGuideModalTitle) {
            userGuideModalTitle.textContent = currentGuideLang === "si"
                ? "📖 SupiriStudio PRO — සම්පූර්ණ පරිශීලක අත්පොත සහ උපදෙස්"
                : "📖 SupiriStudio PRO — Complete User Manual & Help Center";
        }
        if (userGuideModalSubtitle) {
            userGuideModalSubtitle.textContent = currentGuideLang === "si"
                ? "ප්‍රධාන AI මෙවලම් 6 නිවැරදිව පාවිච්චි කරන ආකාරය පියවරෙන් පියවර ඉගෙන ගන්න"
                : "Learn how to use all 6 Pro AI media tools step-by-step with practical examples";
        }

        // Update language buttons styling
        if (guideLangEnBtn && guideLangSiBtn) {
            if (currentGuideLang === "en") {
                guideLangEnBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-emerald-500 text-slate-950 shadow-glow-emerald cursor-pointer";
                guideLangSiBtn.className = "px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer";
            } else {
                guideLangSiBtn.className = "px-2.5 py-1 rounded-lg text-xs font-bold transition-all bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-glow-emerald cursor-pointer";
                guideLangEnBtn.className = "px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer";
            }
        }

        // Update footer action button
        if (guideTryBtnText) {
            guideTryBtnText.textContent = langData.tryBtn;
        }

        // Render the 3 distinct cards
        const card1ItemsHtml = langData.card1Items.map(item => `
            <li class="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                <i class="fa-solid fa-circle-check text-emerald-400 mt-1 flex-shrink-0 text-xs"></i>
                <div>${item}</div>
            </li>
        `).join("");

        const card2StepsHtml = langData.card2Steps.map(step => `
            <div class="flex items-start gap-3 p-3 bg-slate-950/70 border border-slate-800/90 rounded-xl">
                <span class="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    ${step.num}
                </span>
                <div class="space-y-1">
                    <h5 class="text-xs font-bold text-white">${step.title}</h5>
                    <p class="text-xs text-slate-300 leading-relaxed">${step.desc}</p>
                </div>
            </div>
        `).join("");

        userGuideBody.innerHTML = `
            <!-- Tool Header Banner -->
            <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl flex-shrink-0 shadow-glow-emerald">
                    <i class="fa-solid ${toolData.icon}"></i>
                </div>
                <div>
                    <h4 class="text-base sm:text-lg font-extrabold text-white tracking-tight">${langData.title}</h4>
                    <p class="text-xs text-slate-400">${langData.subtitle}</p>
                </div>
            </div>

            <!-- Card 1: What is it used for? (Real-World Use Cases) -->
            <div class="p-4 sm:p-5 bg-slate-900/90 border border-emerald-500/30 rounded-2xl shadow-lg space-y-3">
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30">
                        ${langData.card1Title}
                    </span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">${langData.card1Desc}</p>
                <ul class="space-y-2 pt-1">
                    ${card1ItemsHtml}
                </ul>
            </div>

            <!-- Card 2: How to use it step-by-step? -->
            <div class="p-4 sm:p-5 bg-slate-900/90 border border-cyan-500/30 rounded-2xl shadow-lg space-y-3">
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold uppercase tracking-wider border border-cyan-500/30">
                        ${langData.card2Title}
                    </span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">${langData.card2Desc}</p>
                <div class="space-y-2.5 pt-1">
                    ${card2StepsHtml}
                </div>
            </div>

            <!-- Card 3: What happens after processing? -->
            <div class="p-4 sm:p-5 bg-gradient-to-br from-slate-900/95 via-slate-950 to-slate-900/95 border border-slate-800 rounded-2xl shadow-lg space-y-2.5">
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-500/30">
                        ${langData.card3Title}
                    </span>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed">${langData.card3Desc}</p>
                <div class="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400">
                    <span class="inline-flex items-center gap-1.5"><i class="fa-solid fa-lock text-emerald-400"></i> 100% Client Privacy</span>
                    <span class="inline-flex items-center gap-1.5"><i class="fa-solid fa-hard-drive text-cyan-400"></i> Max 50 MB / File</span>
                    <span class="inline-flex items-center gap-1.5"><i class="fa-solid fa-bolt text-amber-400"></i> Ultra-Fast ONNX & FFmpeg Engines</span>
                </div>
            </div>
        `;
    }

    function selectGuideTool(toolKey) {
        currentGuideTool = toolKey || "bg";

        // Update modal tool tabs active classes
        const guideTabs = document.querySelectorAll(".guide-tool-tab");
        guideTabs.forEach(tab => {
            if (tab.getAttribute("data-guide-tool") === currentGuideTool) {
                tab.className = "guide-tool-tab active flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-glow-emerald cursor-pointer";
            } else {
                tab.className = "guide-tool-tab flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-400 hover:text-white border border-slate-800/60 cursor-pointer";
            }
        });

        renderUserGuideContent();
    }

    function setGuideLanguage(lang) {
        currentGuideLang = lang === "si" ? "si" : "en";
        renderUserGuideContent();
    }

    function openUserGuide(toolKey) {
        if (!userGuideModal) return;
        selectGuideTool(toolKey || currentGuideTool || "bg");

        userGuideModal.classList.remove("hidden");
        requestAnimationFrame(() => {
            userGuideModal.classList.remove("opacity-0", "pointer-events-none");
        });
    }

    function closeUserGuide() {
        if (!userGuideModal) return;
        userGuideModal.classList.add("opacity-0", "pointer-events-none");
        setTimeout(() => {
            userGuideModal.classList.add("hidden");
        }, 300);
    }

    function tryActiveGuideTool() {
        const toolData = USER_GUIDE_DATA[currentGuideTool];
        closeUserGuide();
        if (toolData && toolData.tabTarget && typeof switchTab === "function") {
            switchTab(toolData.tabTarget);
        }
    }

    function dismissWelcomeCard() {
        if (!firstTimeWelcomeCard) return;
        firstTimeWelcomeCard.classList.add("translate-y-4", "opacity-0");
        setTimeout(() => {
            firstTimeWelcomeCard.classList.add("hidden");
        }, 400);
        try {
            localStorage.setItem("supiristudio_visited", "true");
        } catch (e) {}
    }

    // First-Time Visitor Check
    try {
        if (!localStorage.getItem("supiristudio_visited")) {
            setTimeout(() => {
                if (firstTimeWelcomeCard) {
                    firstTimeWelcomeCard.classList.remove("hidden");
                    requestAnimationFrame(() => {
                        firstTimeWelcomeCard.classList.remove("translate-y-4", "opacity-0");
                    });
                }
            }, 1200);
        }
    } catch (e) {}

    // Close on Escape Key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && userGuideModal && !userGuideModal.classList.contains("hidden")) {
            closeUserGuide();
        }
    });

    // Expose helpers globally for DOM onclick listeners
    window.openUserGuide = openUserGuide;
    window.closeUserGuide = closeUserGuide;
    window.setGuideLanguage = setGuideLanguage;
    window.selectGuideTool = selectGuideTool;
    window.tryActiveGuideTool = tryActiveGuideTool;
    window.dismissWelcomeCard = dismissWelcomeCard;

    // Initial render
    renderUserGuideContent();

})();

