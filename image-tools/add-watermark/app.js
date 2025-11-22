// Add Watermark Tool - JavaScript functionality

class WatermarkTool {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.originalImage = null;
        this.watermarkImage = null;
        this.settings = {
            type: 'text',
            text: '© Your Name',
            fontSize: 32,
            fontColor: '#ffffff',
            position: 'center',
            opacity: 0.7,
            margin: 20
        };
        
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupThemeToggle();
    }

    setupElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadError = document.getElementById('uploadError');
        this.uploadSection = document.getElementById('uploadSection');
        this.controlsSection = document.getElementById('controlsSection');
        this.previewSection = document.getElementById('previewSection');
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.previewInfo = document.getElementById('previewInfo');
        
        // Controls
        this.watermarkTypeInputs = document.querySelectorAll('input[name="watermarkType"]');
        this.textControls = document.getElementById('textControls');
        this.imageControls = document.getElementById('imageControls');
        this.watermarkTextInput = document.getElementById('watermarkText');
        this.fontSizeInput = document.getElementById('fontSize');
        this.fontColorInput = document.getElementById('fontColor');
        this.watermarkImageInput = document.getElementById('watermarkImageInput');
        this.positionBtns = document.querySelectorAll('.position-btn');
        this.opacityInput = document.getElementById('opacity');
        this.marginInput = document.getElementById('margin');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
    }

    setupEventListeners() {
        // File upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Watermark type toggle
        this.watermarkTypeInputs.forEach(input => {
            input.addEventListener('change', this.handleTypeChange.bind(this));
        });

        // Text controls
        this.watermarkTextInput.addEventListener('input', this.handleTextChange.bind(this));
        this.fontSizeInput.addEventListener('input', this.handleFontSizeChange.bind(this));
        this.fontColorInput.addEventListener('change', this.handleFontColorChange.bind(this));

        // Image controls
        this.watermarkImageInput.addEventListener('change', this.handleWatermarkImageSelect.bind(this));

        // Position controls
        this.positionBtns.forEach(btn => {
            btn.addEventListener('click', this.handlePositionChange.bind(this));
        });

        // Opacity and margin controls
        this.opacityInput.addEventListener('input', this.handleOpacityChange.bind(this));
        this.marginInput.addEventListener('input', this.handleMarginChange.bind(this));

        // Action buttons
        this.downloadBtn.addEventListener('click', this.downloadImage.bind(this));
        this.resetBtn.addEventListener('click', this.reset.bind(this));
    }

    setupThemeToggle() {
        // Listen for theme changes and update tool CSS accordingly
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    this.updateToolTheme();
                }
            });
        });

        observer.observe(document.documentElement, { 
            attributes: true, 
            attributeFilter: ['data-theme'] 
        });

        // Initial theme setup
        this.updateToolTheme();
    }

    updateToolTheme() {
        const toolThemeLink = document.getElementById('tool-theme-css');
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newHref = currentTheme === 'dark' ? 'dark.css' : 'light.css';
        
        if (toolThemeLink && toolThemeLink.href !== newHref) {
            toolThemeLink.href = newHref;
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showError('File size must be less than 10MB.');
            return;
        }

        this.hideError();

        // Load image
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.showControls();
                this.renderPreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showError(message) {
        this.uploadError.textContent = message;
        this.uploadError.classList.add('show');
    }

    hideError() {
        this.uploadError.classList.remove('show');
    }

    showControls() {
        this.controlsSection.classList.remove('hidden');
        this.previewSection.classList.remove('hidden');
    }

    handleTypeChange(e) {
        this.settings.type = e.target.value;
        
        if (this.settings.type === 'text') {
            this.textControls.classList.remove('hidden');
            this.imageControls.classList.add('hidden');
        } else {
            this.textControls.classList.add('hidden');
            this.imageControls.classList.remove('hidden');
        }
        
        this.renderPreview();
    }

    handleTextChange(e) {
        this.settings.text = e.target.value;
        this.renderPreview();
    }

    handleFontSizeChange(e) {
        this.settings.fontSize = parseInt(e.target.value);
        e.target.nextElementSibling.textContent = `${this.settings.fontSize}px`;
        this.renderPreview();
    }

    handleFontColorChange(e) {
        this.settings.fontColor = e.target.value;
        this.renderPreview();
    }

    handleWatermarkImageSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.watermarkImage = img;
                    this.renderPreview();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    handlePositionChange(e) {
        // Remove active class from all buttons
        this.positionBtns.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        e.target.classList.add('active');
        
        this.settings.position = e.target.dataset.position;
        this.renderPreview();
    }

    handleOpacityChange(e) {
        this.settings.opacity = parseFloat(e.target.value);
        e.target.nextElementSibling.textContent = `${Math.round(this.settings.opacity * 100)}%`;
        this.renderPreview();
    }

    handleMarginChange(e) {
        this.settings.margin = parseInt(e.target.value);
        e.target.nextElementSibling.textContent = `${this.settings.margin}px`;
        this.renderPreview();
    }

    renderPreview() {
        if (!this.originalImage) return;

        // Set canvas size to match image
        this.canvas.width = this.originalImage.width;
        this.canvas.height = this.originalImage.height;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw original image
        this.ctx.drawImage(this.originalImage, 0, 0);

        // Apply watermark
        if (this.settings.type === 'text') {
            this.renderTextWatermark();
        } else if (this.settings.type === 'image' && this.watermarkImage) {
            this.renderImageWatermark();
        }

        // Update preview info
        this.updatePreviewInfo();
    }

    renderTextWatermark() {
        const { text, fontSize, fontColor, position, opacity, margin } = this.settings;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.font = `${fontSize}px Arial, sans-serif`;
        this.ctx.fillStyle = fontColor;
        this.ctx.textBaseline = 'top';

        // Measure text
        const textMetrics = this.ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;

        // Calculate position
        const { x, y } = this.calculatePosition(textWidth, textHeight, position, margin);

        // Add text shadow for better visibility
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 2;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;

        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    renderImageWatermark() {
        const { position, opacity, margin } = this.settings;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;

        // Scale watermark image to reasonable size (max 20% of canvas width)
        const maxWidth = this.canvas.width * 0.2;
        const scale = Math.min(maxWidth / this.watermarkImage.width, 1);
        const watermarkWidth = this.watermarkImage.width * scale;
        const watermarkHeight = this.watermarkImage.height * scale;

        // Calculate position
        const { x, y } = this.calculatePosition(watermarkWidth, watermarkHeight, position, margin);

        this.ctx.drawImage(this.watermarkImage, x, y, watermarkWidth, watermarkHeight);
        this.ctx.restore();
    }

    calculatePosition(width, height, position, margin) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        let x, y;

        switch (position) {
            case 'top-left':
                x = margin;
                y = margin;
                break;
            case 'top-center':
                x = (canvasWidth - width) / 2;
                y = margin;
                break;
            case 'top-right':
                x = canvasWidth - width - margin;
                y = margin;
                break;
            case 'center-left':
                x = margin;
                y = (canvasHeight - height) / 2;
                break;
            case 'center':
                x = (canvasWidth - width) / 2;
                y = (canvasHeight - height) / 2;
                break;
            case 'center-right':
                x = canvasWidth - width - margin;
                y = (canvasHeight - height) / 2;
                break;
            case 'bottom-left':
                x = margin;
                y = canvasHeight - height - margin;
                break;
            case 'bottom-center':
                x = (canvasWidth - width) / 2;
                y = canvasHeight - height - margin;
                break;
            case 'bottom-right':
                x = canvasWidth - width - margin;
                y = canvasHeight - height - margin;
                break;
            default:
                x = (canvasWidth - width) / 2;
                y = (canvasHeight - height) / 2;
        }

        return { x: Math.max(0, x), y: Math.max(0, y) };
    }

    updatePreviewInfo() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        this.previewInfo.textContent = `${width} × ${height}px`;
    }

    downloadImage() {
        if (!this.canvas) return;

        // Create download link
        this.canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'watermarked-image.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    reset() {
        // Reset settings to defaults
        this.settings = {
            type: 'text',
            text: '© Your Name',
            fontSize: 32,
            fontColor: '#ffffff',
            position: 'center',
            opacity: 0.7,
            margin: 20
        };

        // Reset form inputs
        document.querySelector('input[name="watermarkType"][value="text"]').checked = true;
        this.watermarkTextInput.value = this.settings.text;
        this.fontSizeInput.value = this.settings.fontSize;
        this.fontSizeInput.nextElementSibling.textContent = `${this.settings.fontSize}px`;
        this.fontColorInput.value = this.settings.fontColor;
        this.opacityInput.value = this.settings.opacity;
        this.opacityInput.nextElementSibling.textContent = `${Math.round(this.settings.opacity * 100)}%`;
        this.marginInput.value = this.settings.margin;
        this.marginInput.nextElementSibling.textContent = `${this.settings.margin}px`;

        // Reset position buttons
        this.positionBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.position-btn[data-position="center"]').classList.add('active');

        // Reset UI
        this.textControls.classList.remove('hidden');
        this.imageControls.classList.add('hidden');
        this.watermarkImage = null;
        this.watermarkImageInput.value = '';

        // Re-render if image is loaded
        if (this.originalImage) {
            this.renderPreview();
        }
    }
}

// Initialize tool when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WatermarkTool();
});
