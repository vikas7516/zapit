(() => {
    const canvas = document.getElementById('boardCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const boardWrapper = document.getElementById('boardWrapper');
    const textEditor = document.getElementById('textEditor');
    const boardGuides = document.getElementById('boardGuides');
    const boardMeta = document.getElementById('boardMeta');
    const exportStatus = document.getElementById('exportStatus');

    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const toolButtons = Array.from(document.querySelectorAll('.tool-button'));
    const colorPicker = document.getElementById('colorPicker');
    const sizeSlider = document.getElementById('sizeSlider');
    const sizeValue = document.getElementById('sizeValue');
    const textSizeSlider = document.getElementById('textSizeSlider');
    const textSizeValue = document.getElementById('textSizeValue');
    const highlightSlider = document.getElementById('highlightOpacity');
    const highlightValue = document.getElementById('highlightValue');
    const boardColorPicker = document.getElementById('boardColor');
    const patternSelect = document.getElementById('patternSelect');
    const showGuidesCheckbox = document.getElementById('showGuides');
    const downloadBtn = document.getElementById('downloadBtn');
    const copyBtn = document.getElementById('copyBtn');

    const state = {
        tool: 'pen',
        color: colorPicker.value,
        strokeSize: parseInt(sizeSlider.value, 10) || 6,
        textSize: parseInt(textSizeSlider.value, 10) || 24,
        highlightOpacity: parseFloat(highlightSlider.value) || 0.35,
        boardColor: boardColorPicker.value,
        pattern: patternSelect.value,
        showGuides: showGuidesCheckbox.checked,
        strokes: [],
        undone: [],
        currentStroke: null,
        isDrawing: false,
        pointerId: null,
        textEditorActive: false
    };

    let exportTimeout = null;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    function getDevicePixelRatio() {
        return window.devicePixelRatio || 1;
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = getDevicePixelRatio();
        const width = Math.floor(rect.width * dpr);
        const height = Math.floor(rect.height * dpr);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        renderCanvas();
        updateBoardMeta();
    }

    function updateBoardMeta() {
        const dpr = getDevicePixelRatio();
        const width = Math.round(canvas.width / dpr);
        const height = Math.round(canvas.height / dpr);
        if (boardMeta) {
            boardMeta.textContent = `Resolution: ${width} × ${height} px`;
        }
    }

    function drawPattern() {
        if (!state.showGuides) return;
        const width = canvas.width;
        const height = canvas.height;
        const dpr = getDevicePixelRatio();
        const accent = state.pattern === 'dots'
            ? 'rgba(148, 163, 184, 0.45)'
            : 'rgba(148, 163, 184, 0.28)';
        const ctxPattern = ctx;
        ctxPattern.save();
        ctxPattern.lineWidth = 1 * dpr;
        ctxPattern.strokeStyle = accent;
        ctxPattern.fillStyle = accent;

        const baseStep = Math.round(80 * dpr);
        switch (state.pattern) {
            case 'grid': {
                for (let x = 0; x <= width; x += baseStep) {
                    ctxPattern.beginPath();
                    ctxPattern.moveTo(x, 0);
                    ctxPattern.lineTo(x, height);
                    ctxPattern.stroke();
                }
                for (let y = 0; y <= height; y += baseStep) {
                    ctxPattern.beginPath();
                    ctxPattern.moveTo(0, y);
                    ctxPattern.lineTo(width, y);
                    ctxPattern.stroke();
                }
                break;
            }
            case 'dots': {
                const dotSpacing = Math.round(50 * dpr);
                const radius = Math.max(1 * dpr, 1.4 * dpr);
                for (let x = dotSpacing / 2; x < width; x += dotSpacing) {
                    for (let y = dotSpacing / 2; y < height; y += dotSpacing) {
                        ctxPattern.beginPath();
                        ctxPattern.arc(x, y, radius, 0, Math.PI * 2);
                        ctxPattern.fill();
                    }
                }
                break;
            }
            case 'isometric': {
                const step = Math.round(96 * dpr);
                for (let x = -height; x <= width + height; x += step) {
                    ctxPattern.beginPath();
                    ctxPattern.moveTo(x, 0);
                    ctxPattern.lineTo(x + height, height);
                    ctxPattern.stroke();
                }
                for (let x = -height; x <= width + height; x += step) {
                    ctxPattern.beginPath();
                    ctxPattern.moveTo(x, height);
                    ctxPattern.lineTo(x + height, 0);
                    ctxPattern.stroke();
                }
                for (let y = 0; y <= height; y += step) {
                    ctxPattern.beginPath();
                    ctxPattern.moveTo(0, y);
                    ctxPattern.lineTo(width, y);
                    ctxPattern.stroke();
                }
                break;
            }
            default: {
                // plain
                break;
            }
        }
        ctxPattern.restore();
    }

    function drawStroke(stroke) {
        if (!stroke) return;
        if (stroke.type === 'text') {
            const fontSize = Math.max(8, Math.round(stroke.size * canvas.height));
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.fillStyle = stroke.color;
            ctx.font = `${stroke.weight || 600} ${fontSize}px "Inter", "Segoe UI", sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillText(stroke.text, stroke.x * canvas.width, stroke.y * canvas.height);
            ctx.restore();
            return;
        }

        const points = stroke.points || [];
        if (!points.length) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(1, stroke.size * canvas.width);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        if (stroke.type === 'highlighter') {
            ctx.globalAlpha = clamp(stroke.opacity || state.highlightOpacity, 0.05, 0.95);
            ctx.strokeStyle = stroke.color;
        } else if (stroke.type === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
        } else {
            ctx.strokeStyle = stroke.color;
        }

        ctx.beginPath();
        points.forEach((point, index) => {
            const x = point.x * canvas.width;
            const y = point.y * canvas.height;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        if (points.length === 1) {
            const p = points[0];
            ctx.lineTo(p.x * canvas.width + 0.01, p.y * canvas.height + 0.01);
        }
        ctx.stroke();
        ctx.restore();
    }

    function renderCanvas(includeCurrent = false) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = state.boardColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawPattern();
        ctx.restore();

        state.strokes.forEach(drawStroke);
        if (includeCurrent && state.currentStroke) {
            drawStroke(state.currentStroke);
        }

        if (boardGuides) {
            boardGuides.style.opacity = state.showGuides ? '0.15' : '0';
        }
    }

    function createStroke() {
        return {
            type: state.tool,
            color: state.tool === 'eraser' ? '#000000' : state.color,
            size: (state.strokeSize / Math.max(canvas.width, 1)),
            opacity: state.highlightOpacity,
            points: []
        };
    }

    function addPoint(event) {
        if (!state.currentStroke) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (event.clientX - rect.left) * scaleX;
        const canvasY = (event.clientY - rect.top) * scaleY;
        const x = clamp(canvasX / canvas.width, 0, 1);
        const y = clamp(canvasY / canvas.height, 0, 1);

        let point = { x, y };
        if (event.shiftKey && state.currentStroke.points.length) {
            const origin = state.currentStroke.points[0];
            const dx = Math.abs(origin.x - x);
            const dy = Math.abs(origin.y - y);
            if (dx > dy) {
                point.y = origin.y;
            } else {
                point.x = origin.x;
            }
        }

        state.currentStroke.points.push(point);
    }

    function startDrawing(event) {
        if (event.button !== 0) return;
        if (state.textEditorActive) {
            commitText(true);
        }
        canvas.setPointerCapture(event.pointerId);
        state.pointerId = event.pointerId;

        if (state.tool === 'text') {
            openTextEditor(event);
            return;
        }

        state.isDrawing = true;
        state.currentStroke = createStroke();
        addPoint(event);
        renderCanvas(true);
    }

    function moveDrawing(event) {
        if (!state.isDrawing || !state.currentStroke) return;
        addPoint(event);
        renderCanvas(true);
    }

    function stopDrawing(event) {
        if (state.pointerId !== null) {
            try {
                canvas.releasePointerCapture(state.pointerId);
            } catch (err) {
                // ignore
            }
        }
        state.pointerId = null;

        if (!state.isDrawing || !state.currentStroke) {
            state.isDrawing = false;
            state.currentStroke = null;
            return;
        }

        if (state.currentStroke.points.length > 0) {
            state.strokes.push(state.currentStroke);
            state.undone = [];
            updateHistoryControls();
        }

        state.isDrawing = false;
        state.currentStroke = null;
        renderCanvas();
    }

    function updateHistoryControls() {
        undoBtn.disabled = state.strokes.length === 0;
        redoBtn.disabled = state.undone.length === 0;
    }

    function undo() {
        if (!state.strokes.length) return;
        const stroke = state.strokes.pop();
        if (stroke) {
            state.undone.push(stroke);
            renderCanvas();
            updateHistoryControls();
        }
    }

    function redo() {
        if (!state.undone.length) return;
        const stroke = state.undone.pop();
        if (stroke) {
            state.strokes.push(stroke);
            renderCanvas();
            updateHistoryControls();
        }
    }

    function clearBoard() {
        if (!state.strokes.length) {
            renderCanvas();
            return;
        }
        const shouldClear = confirm('Clear the whiteboard? This action cannot be undone.');
        if (!shouldClear) return;
        state.strokes = [];
        state.undone = [];
        state.currentStroke = null;
        renderCanvas();
        updateHistoryControls();
    }

    function setExportStatus(message, isError = false) {
        if (!exportStatus) return;
        if (exportTimeout) {
            clearTimeout(exportTimeout);
        }
        exportStatus.textContent = message;
        exportStatus.classList.toggle('error', Boolean(isError));
        exportTimeout = window.setTimeout(() => {
            exportStatus.textContent = '';
            exportStatus.classList.remove('error');
        }, 4200);
    }

    function downloadBoard() {
        canvas.toBlob((blob) => {
            if (!blob) {
                setExportStatus('Unable to export right now. Please try again.', true);
                return;
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `zapit-whiteboard-${timestamp}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setExportStatus('Board downloaded as PNG.');
        }, 'image/png');
    }

    function copyBoard() {
        if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
            setExportStatus('Clipboard not supported in this browser. Download instead.', true);
            return;
        }
        canvas.toBlob(async (blob) => {
            if (!blob) {
                setExportStatus('Unable to copy at this time.', true);
                return;
            }
            try {
                const item = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([item]);
                setExportStatus('Board copied to clipboard. Paste it anywhere!');
            } catch (error) {
                console.error(error);
                setExportStatus('Clipboard copy failed. Try downloading instead.', true);
            }
        }, 'image/png');
    }

    function setActiveTool(button) {
        toolButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
        const tool = button.dataset.tool;
        state.tool = tool;
        if (tool === 'eraser') {
            boardWrapper.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Crect x=\'2\' y=\'2\' width=\'28\' height=\'28\' rx=\'6\' ry=\'6\' fill=\'%23f8fafc\' stroke=\'%23464757\' stroke-width=\'2\'/%3E%3Cline x1=\'9\' y1=\'9\' x2=\'23\' y2=\'23\' stroke=\'%23ef4444\' stroke-width=\'2.5\' stroke-linecap=\'round\'/%3E%3C/svg%3E") 16 16, crosshair';
        } else if (tool === 'highlighter') {
            boardWrapper.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\'%3E%3Crect x=\'6\' y=\'6\' width=\'20\' height=\'20\' rx=\'6\' ry=\'6\' fill=\'%23fde68a\' stroke=\'%23d97706\' stroke-width=\'2\'/%3E%3C/svg%3E") 8 24, crosshair';
        } else if (tool === 'text') {
            boardWrapper.style.cursor = 'text';
        } else {
            boardWrapper.style.cursor = 'crosshair';
        }
    }

    function openTextEditor(event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (event.clientX - rect.left) * scaleX;
        const canvasY = (event.clientY - rect.top) * scaleY;
        const xNorm = clamp(canvasX / canvas.width, 0, 1);
        const yNorm = clamp(canvasY / canvas.height, 0, 1);

        const cssX = xNorm * rect.width;
        const cssY = yNorm * rect.height;

        textEditor.dataset.x = xNorm.toString();
        textEditor.dataset.y = yNorm.toString();
        textEditor.dataset.size = state.textSize.toString();
        textEditor.style.left = `${cssX}px`;
        textEditor.style.top = `${cssY}px`;
        textEditor.style.fontSize = `${state.textSize}px`;
        textEditor.style.color = state.color;
        textEditor.textContent = '';
        textEditor.classList.add('visible');
        textEditor.setAttribute('aria-hidden', 'false');
        state.textEditorActive = true;

        requestAnimationFrame(() => {
            const range = document.createRange();
            range.selectNodeContents(textEditor);
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
        textEditor.focus();
    }

    function commitText(save) {
        if (!state.textEditorActive) return;
        const text = (textEditor.textContent || '').trim();
        const xNorm = parseFloat(textEditor.dataset.x || '0');
        const yNorm = parseFloat(textEditor.dataset.y || '0');
        const pxSize = parseFloat(textEditor.dataset.size || state.textSize);
        textEditor.classList.remove('visible');
        textEditor.setAttribute('aria-hidden', 'true');
        state.textEditorActive = false;
        textEditor.textContent = '';

        if (!save || !text) {
            renderCanvas();
            return;
        }

        const fontSizeNorm = pxSize / Math.max(canvas.height, 1);
        state.strokes.push({
            type: 'text',
            text,
            color: state.color,
            size: fontSizeNorm,
            x: xNorm,
            y: yNorm,
            weight: 600
        });
        state.undone = [];
        updateHistoryControls();
        renderCanvas();
    }

    function isTypingInInput(target) {
        if (!target) return false;
        if (target === textEditor) return true;
        const tagName = target.tagName && target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
        if (target.isContentEditable) return true;
        return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
    }

    function handleKeydown(event) {
        if (isTypingInInput(event.target)) return;
        const key = event.key.toLowerCase();
        const metaKey = event.metaKey;
        const ctrlKey = event.ctrlKey;
        if ((ctrlKey || metaKey) && key === 'z') {
            event.preventDefault();
            if (event.shiftKey) {
                redo();
            } else {
                undo();
            }
            return;
        }
        if ((ctrlKey || metaKey) && (key === 'y')) {
            event.preventDefault();
            redo();
            return;
        }
        if (key === 'delete') {
            event.preventDefault();
            clearBoard();
        }
    }

    function handleThemeSync(mutationList) {
        mutationList.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                renderCanvas();
            }
        });
    }

    function attachEvents() {
        canvas.addEventListener('pointerdown', startDrawing);
        canvas.addEventListener('pointermove', moveDrawing);
        canvas.addEventListener('pointerup', stopDrawing);
        canvas.addEventListener('pointerleave', stopDrawing);
        canvas.addEventListener('pointercancel', stopDrawing);
        canvas.addEventListener('contextmenu', (event) => event.preventDefault());

        undoBtn.addEventListener('click', undo);
        redoBtn.addEventListener('click', redo);
        clearBtn.addEventListener('click', clearBoard);

        toolButtons.forEach((button) => {
            button.addEventListener('click', () => setActiveTool(button));
        });

        colorPicker.addEventListener('input', (event) => {
            state.color = event.target.value;
            if (state.textEditorActive) {
                textEditor.style.color = state.color;
            }
        });

        sizeSlider.addEventListener('input', (event) => {
            state.strokeSize = parseInt(event.target.value, 10);
            sizeValue.textContent = `${state.strokeSize} px`;
        });

        textSizeSlider.addEventListener('input', (event) => {
            state.textSize = parseInt(event.target.value, 10);
            textSizeValue.textContent = `${state.textSize} px`;
            if (state.textEditorActive) {
                textEditor.style.fontSize = `${state.textSize}px`;
                textEditor.dataset.size = state.textSize.toString();
            }
        });

        highlightSlider.addEventListener('input', (event) => {
            state.highlightOpacity = parseFloat(event.target.value);
            highlightValue.textContent = `${Math.round(state.highlightOpacity * 100)}%`;
        });

        boardColorPicker.addEventListener('input', (event) => {
            state.boardColor = event.target.value;
            boardWrapper.style.backgroundColor = state.boardColor;
            renderCanvas(state.isDrawing);
        });

        patternSelect.addEventListener('change', (event) => {
            state.pattern = event.target.value;
            renderCanvas(state.isDrawing);
        });

        showGuidesCheckbox.addEventListener('change', (event) => {
            state.showGuides = event.target.checked;
            renderCanvas(state.isDrawing);
        });

        downloadBtn.addEventListener('click', downloadBoard);
        copyBtn.addEventListener('click', copyBoard);

        textEditor.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                commitText(true);
            } else if (event.key === 'Escape') {
                event.preventDefault();
                commitText(false);
            }
        });

        textEditor.addEventListener('blur', () => {
            if (state.textEditorActive) {
                commitText(true);
            }
        });

        document.addEventListener('keydown', handleKeydown);
        window.addEventListener('resize', () => {
            resizeCanvas();
        });

        const themeObserver = new MutationObserver(handleThemeSync);
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    function init() {
        boardWrapper.style.backgroundColor = state.boardColor;
        setActiveTool(toolButtons.find((btn) => btn.dataset.tool === state.tool) || toolButtons[0]);
        sizeValue.textContent = `${state.strokeSize} px`;
        textSizeValue.textContent = `${state.textSize} px`;
        highlightValue.textContent = `${Math.round(state.highlightOpacity * 100)}%`;
        attachEvents();
        resizeCanvas();
        renderCanvas();
        updateHistoryControls();
    }

    init();
})();
