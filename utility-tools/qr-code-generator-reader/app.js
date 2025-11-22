(function () {
    const qrText = document.getElementById('qrText');
    const qrSize = document.getElementById('qrSize');
    const qrSizeValue = document.getElementById('qrSizeValue');
    const qrCorrection = document.getElementById('qrCorrection');
    const qrMargin = document.getElementById('qrMargin');
    const qrForeground = document.getElementById('qrForeground');
    const qrBackground = document.getElementById('qrBackground');
    const generateBtn = document.getElementById('generateBtn');
    const clearGeneratorBtn = document.getElementById('clearGeneratorBtn');
    const copySvgBtn = document.getElementById('copySvgBtn');
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const generatorStatus = document.getElementById('generatorStatus');
    const qrCanvas = document.getElementById('qrCanvas');

    const imageInput = document.getElementById('imageInput');
    const startCameraBtn = document.getElementById('startCameraBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    const captureFrameBtn = document.getElementById('captureFrameBtn');
    const scanImageBtn = document.getElementById('scanImageBtn');
    const copyDecodedBtn = document.getElementById('copyDecodedBtn');
    const readerStatus = document.getElementById('readerStatus');
    const decodedOutput = document.getElementById('decodedOutput');
    const cameraPreview = document.getElementById('cameraPreview');
    const cameraVideo = document.getElementById('cameraVideo');
    const cameraCanvas = document.getElementById('cameraCanvas');
    const cameraOverlay = document.getElementById('cameraOverlay');

    const historyList = document.getElementById('historyList');
    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    if (!qrCanvas || !generateBtn) {
        return;
    }

    const MAX_TEXT_LENGTH = 1200;
    const HISTORY_LIMIT = 25;

    cameraVideo.setAttribute('playsinline', 'true');

    const history = [];
    let cameraStream = null;
    let lastGeneratedDataUrl = null;
    let lastGeneratedSvg = null;

    function setStatus(element, message, type = 'info') {
        if (!element) return;
        element.textContent = message || '';
        element.classList.remove('success', 'error', 'show');
        if (!message) {
            return;
        }
        if (type === 'success') {
            element.classList.add('success');
        } else if (type === 'error') {
            element.classList.add('error');
        }
        element.classList.add('show');
    }

    function clearStatus(element) {
        if (!element) return;
        element.textContent = '';
        element.classList.remove('success', 'error', 'show');
    }

    function updateSizeLabel() {
        qrSizeValue.textContent = qrSize.value;
    }

    function resetCanvas() {
        const context = qrCanvas.getContext('2d');
        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        context.fillStyle = '#f8fafc';
        context.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
        context.fillStyle = '#94a3b8';
        context.font = '600 18px "Inter", "Segoe UI", sans-serif';
        context.textAlign = 'center';
        context.fillText('Your QR preview will appear here', qrCanvas.width / 2, qrCanvas.height / 2);
        context.restore();
        lastGeneratedDataUrl = null;
        lastGeneratedSvg = null;
    }

    function validateGeneratorInputs() {
        const text = qrText.value.trim();
        if (!text) {
            setStatus(generatorStatus, 'Enter text, a URL, or contact card details before generating.', 'error');
            return false;
        }
        if (text.length > MAX_TEXT_LENGTH) {
            setStatus(generatorStatus, `Content is too long. Limit to ${MAX_TEXT_LENGTH} characters.`, 'error');
            return false;
        }
        if (qrForeground.value.toLowerCase() === qrBackground.value.toLowerCase()) {
            setStatus(generatorStatus, 'Foreground and background colors should differ for readability.', 'error');
            return false;
        }
        return true;
    }

    function addHistoryEntry(type, content, meta = {}) {
        const timestamp = new Date();
        history.unshift({ type, content, meta, time: timestamp });
        if (history.length > HISTORY_LIMIT) {
            history.length = HISTORY_LIMIT;
        }
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (!history.length) {
            const placeholder = document.createElement('li');
            placeholder.className = 'placeholder';
            placeholder.textContent = 'Generated and scanned QR codes will be logged here.';
            historyList.appendChild(placeholder);
            return;
        }

        history.forEach((entry) => {
            const item = document.createElement('li');
            const header = document.createElement('div');
            header.className = 'meta';
            const typeLabel = entry.type === 'generated' ? 'Generated' : 'Scanned';
            header.innerHTML = `<span>${typeLabel}</span><span>${entry.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;

            const contentEl = document.createElement('div');
            contentEl.className = 'content';
            contentEl.textContent = entry.content;

            item.appendChild(header);
            item.appendChild(contentEl);

            if (entry.meta && entry.meta.details) {
                const details = document.createElement('div');
                details.className = 'meta';
                details.textContent = entry.meta.details;
                item.appendChild(details);
            }

            historyList.appendChild(item);
        });
    }

    function generateQrCode() {
        if (!validateGeneratorInputs()) {
            return;
        }

        const text = qrText.value.trim();
        const size = parseInt(qrSize.value, 10) || 320;
        const correction = qrCorrection.value;
        const margin = Math.max(0, Math.min(32, parseInt(qrMargin.value, 10) || 4));
        const foreground = qrForeground.value;
        const background = qrBackground.value;

        qrCanvas.width = size;
        qrCanvas.height = size;

        setStatus(generatorStatus, 'Generating QR code...');

        QRCode.toCanvas(qrCanvas, text, {
            width: size,
            margin,
            color: {
                dark: foreground,
                light: background
            },
            errorCorrectionLevel: correction
        }, (error) => {
            if (error) {
                console.error('QR generation error', error);
                setStatus(generatorStatus, 'Failed to generate QR code. Please try again.', 'error');
                resetCanvas();
                return;
            }

            lastGeneratedDataUrl = qrCanvas.toDataURL('image/png');
            QRCode.toString(text, { type: 'svg', margin, color: { dark: foreground, light: background }, errorCorrectionLevel: correction }, (err, svg) => {
                if (!err) {
                    lastGeneratedSvg = svg;
                }
            });

            addHistoryEntry('generated', text, { details: `Size ${size}px · EC ${correction}` });
            setStatus(generatorStatus, 'QR code ready to go!', 'success');
        });
    }

    function downloadPng() {
        if (!lastGeneratedDataUrl) {
            setStatus(generatorStatus, 'Generate a QR code before downloading.', 'error');
            return;
        }
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        link.href = lastGeneratedDataUrl;
        link.download = `qr-code-${timestamp}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus(generatorStatus, 'PNG downloaded.', 'success');
    }

    function copySvgToClipboard() {
        if (!lastGeneratedSvg) {
            setStatus(generatorStatus, 'Generate a QR code before copying SVG.', 'error');
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(lastGeneratedSvg)
                .then(() => setStatus(generatorStatus, 'SVG markup copied to clipboard.', 'success'))
                .catch(() => fallbackSvgCopy());
        } else {
            fallbackSvgCopy();
        }
    }

    function fallbackSvgCopy() {
        const textarea = document.createElement('textarea');
        textarea.value = lastGeneratedSvg;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            setStatus(generatorStatus, 'SVG markup copied to clipboard.', 'success');
        } catch (error) {
            setStatus(generatorStatus, 'Unable to copy at this time.', 'error');
        }
        document.body.removeChild(textarea);
    }

    function clearGenerator() {
        qrText.value = '';
        qrSize.value = 320;
        qrCorrection.value = 'M';
        qrMargin.value = 4;
        qrForeground.value = '#0f172a';
        qrBackground.value = '#ffffff';
        updateSizeLabel();
        resetCanvas();
        clearStatus(generatorStatus);
    }

    function decodeImageData(imageData) {
        if (typeof jsQR !== 'function') {
            setStatus(readerStatus, 'Scanning library failed to load. Refresh the page.', 'error');
            return null;
        }
        return jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
        });
    }

    function processDecodedResult(result, source) {
        if (!result || !result.data) {
            setStatus(readerStatus, 'No QR code detected. Ensure it has clear contrast and try again.', 'error');
            return;
        }
        decodedOutput.value = result.data;
        addHistoryEntry('scanned', result.data, { details: source });
        setStatus(readerStatus, `QR code decoded from ${source}.`, 'success');
        copyDecodedBtn.disabled = false;
    }

    function scanUploadedImage() {
        clearStatus(readerStatus);
        const file = imageInput.files && imageInput.files[0];
        if (!file) {
            setStatus(readerStatus, 'Choose an image file first.', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setStatus(readerStatus, 'Image is too large. Please keep it under 5 MB.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const result = decodeImageData(imageData);
                processDecodedResult(result, 'uploaded image');
            };
            image.onerror = () => setStatus(readerStatus, 'Unable to read the image.', 'error');
            image.src = reader.result;
        };
        reader.onerror = () => setStatus(readerStatus, 'Failed to load the selected image.', 'error');
        reader.readAsDataURL(file);
    }

    function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStatus(readerStatus, 'Camera access is not supported in this browser.', 'error');
            return;
        }
        const constraints = { video: { facingMode: 'environment' } };
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                cameraStream = stream;
                cameraVideo.srcObject = stream;
                cameraVideo.style.display = 'block';
                cameraOverlay.style.display = 'none';
                captureFrameBtn.disabled = false;
                stopCameraBtn.disabled = false;
                startCameraBtn.disabled = true;
                return cameraVideo.play();
            })
            .then(() => {
                setStatus(readerStatus, 'Camera live. Align a QR code within the frame and capture.', 'success');
            })
            .catch((error) => {
                console.error('Camera error', error);
                setStatus(readerStatus, 'Unable to start the camera. Check permissions and try again.', 'error');
            });
    }

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            cameraStream = null;
        }
        cameraVideo.pause();
        cameraVideo.srcObject = null;
        cameraVideo.style.display = 'none';
        cameraOverlay.style.display = 'flex';
        captureFrameBtn.disabled = true;
        stopCameraBtn.disabled = true;
        startCameraBtn.disabled = false;
        setStatus(readerStatus, 'Camera stopped.', 'info');
    }

    function captureFrame() {
        if (!cameraStream || cameraVideo.readyState < 2) {
            setStatus(readerStatus, 'Start the camera and wait for the preview before capturing.', 'error');
            return;
        }
        const width = cameraVideo.videoWidth;
        const height = cameraVideo.videoHeight;
        if (!width || !height) {
            setStatus(readerStatus, 'Camera frame not ready yet. Try again in a moment.', 'error');
            return;
        }
        cameraCanvas.width = width;
        cameraCanvas.height = height;
        const ctx = cameraCanvas.getContext('2d');
        ctx.drawImage(cameraVideo, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const result = decodeImageData(imageData);
        processDecodedResult(result, 'camera frame');
    }

    function copyDecodedText() {
        const text = decodedOutput.value.trim();
        if (!text) {
            setStatus(readerStatus, 'Scan a QR code before copying.', 'error');
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => setStatus(readerStatus, 'Decoded text copied to clipboard.', 'success'))
                .catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            setStatus(readerStatus, 'Decoded text copied to clipboard.', 'success');
        } catch (error) {
            setStatus(readerStatus, 'Unable to copy at this time.', 'error');
        }
        document.body.removeChild(textarea);
    }

    function clearHistory() {
        history.length = 0;
        renderHistory();
        setStatus(readerStatus, 'History cleared.', 'info');
    }

    function exportHistory() {
        if (!history.length) {
            setStatus(readerStatus, 'History is empty. Generate or scan to add entries.', 'error');
            return;
        }
        const lines = history.slice().reverse().map((entry) => {
            const time = entry.time.toISOString();
            const header = `${time} - ${entry.type.toUpperCase()}`;
            const detail = entry.meta && entry.meta.details ? `\n${entry.meta.details}` : '';
            return `${header}\n${entry.content}${detail}`;
        });
        const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        link.href = url;
        link.download = `qr-history-${timestamp}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setStatus(readerStatus, 'History downloaded as text.', 'success');
    }

    function init() {
        updateSizeLabel();
        resetCanvas();
        copyDecodedBtn.disabled = true;
        captureFrameBtn.disabled = true;
        stopCameraBtn.disabled = true;
        renderHistory();
    }

    qrSize.addEventListener('input', () => {
        updateSizeLabel();
    });

    generateBtn.addEventListener('click', generateQrCode);
    clearGeneratorBtn.addEventListener('click', clearGenerator);
    downloadPngBtn.addEventListener('click', downloadPng);
    copySvgBtn.addEventListener('click', copySvgToClipboard);
    scanImageBtn.addEventListener('click', scanUploadedImage);
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);
    captureFrameBtn.addEventListener('click', captureFrame);
    copyDecodedBtn.addEventListener('click', copyDecodedText);
    clearHistoryBtn.addEventListener('click', clearHistory);
    exportHistoryBtn.addEventListener('click', exportHistory);

    window.addEventListener('beforeunload', () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
        }
    });

    init();
})();
