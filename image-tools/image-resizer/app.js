// Image Resizer Tool
class ImageResizerTool {
    constructor() {
        this.originalFile = null;
        this.originalImage = null;
        this.resizedBlob = null;
        this.aspectRatio = 1;
        this.isAspectRatioLocked = true;
        this.currentMethod = 'percentage';
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // File input and upload area
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const browseLink = document.getElementById('browseLink');

        // Upload events
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        browseLink.addEventListener('click', () => fileInput.click());
        
        // Drag and drop events
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        uploadArea.addEventListener('click', () => fileInput.click());

        // Method tabs
        const methodTabs = document.querySelectorAll('.method-tab');
        methodTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const method = tab.getAttribute('data-method');
                this.switchMethod(method);
            });
        });

        // Percentage controls
        const percentageSlider = document.getElementById('percentageSlider');
        const percentageInput = document.getElementById('percentageInput');
        const percentageValue = document.getElementById('percentageValue');

        percentageSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            percentageValue.textContent = value + '%';
            percentageInput.value = value;
            this.resizeImage();
        });

        percentageInput.addEventListener('input', (e) => {
            const value = Math.max(5, Math.min(500, parseInt(e.target.value) || 100));
            percentageSlider.value = value;
            percentageValue.textContent = value + '%';
            e.target.value = value;
            this.resizeImage();
        });

        // Dimension controls
        const newWidth = document.getElementById('newWidth');
        const newHeight = document.getElementById('newHeight');
        const maintainAspectRatio = document.getElementById('maintainAspectRatio');
        const aspectRatioLink = document.getElementById('aspectRatioLink');

        newWidth.addEventListener('input', () => {
            if (this.isAspectRatioLocked && this.originalImage) {
                const newHeightValue = Math.round(newWidth.value / this.aspectRatio);
                newHeight.value = newHeightValue;
            }
            this.resizeImage();
        });

        newHeight.addEventListener('input', () => {
            if (this.isAspectRatioLocked && this.originalImage) {
                const newWidthValue = Math.round(newHeight.value * this.aspectRatio);
                newWidth.value = newWidthValue;
            }
            this.resizeImage();
        });

        maintainAspectRatio.addEventListener('change', (e) => {
            this.isAspectRatioLocked = e.target.checked;
            this.updateAspectRatioUI();
            if (this.isAspectRatioLocked && this.originalImage) {
                // Recalculate based on width
                const newHeightValue = Math.round(newWidth.value / this.aspectRatio);
                newHeight.value = newHeightValue;
                this.resizeImage();
            }
        });

        aspectRatioLink.addEventListener('click', () => {
            maintainAspectRatio.checked = !maintainAspectRatio.checked;
            maintainAspectRatio.dispatchEvent(new Event('change'));
        });

        // Preset buttons
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const width = btn.getAttribute('data-width');
                const height = btn.getAttribute('data-height');
                
                // Update active state
                presetButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Set dimensions
                newWidth.value = width;
                newHeight.value = height;
                
                this.resizeImage();
            });
        });

        // Resize mode and quality
        const resizeModeRadios = document.querySelectorAll('input[name="resizeMode"]');
        resizeModeRadios.forEach(radio => {
            radio.addEventListener('change', this.resizeImage.bind(this));
        });

        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        qualitySlider.addEventListener('input', (e) => {
            qualityValue.textContent = e.target.value + '%';
            this.resizeImage();
        });

        // Action buttons
        document.getElementById('downloadBtn').addEventListener('click', this.downloadResized.bind(this));
        document.getElementById('processAnotherBtn').addEventListener('click', this.resetTool.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');

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
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file (JPEG, PNG, WebP, BMP, GIF).');
            return;
        }

        // Check file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            this.showError('File size too large. Please select an image smaller than 50MB.');
            return;
        }

        this.hideError();
        this.originalFile = file;
        this.loadImage(file);
    }

    loadImage(file) {
        const img = new Image();
        const objectURL = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectURL);
            this.originalImage = img;
            this.aspectRatio = img.naturalWidth / img.naturalHeight;
            this.displayOriginalImage();
            this.setupInitialDimensions();
            this.showResults();
            this.resizeImage();
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectURL);
            this.showError('Failed to load the image. Please try a different file.');
        };

        img.src = objectURL;
    }

    displayOriginalImage() {
        const originalImageElement = document.getElementById('originalImage');
        const originalInfo = document.getElementById('originalInfo');

        // Display original image
        originalImageElement.src = URL.createObjectURL(this.originalFile);

        // Display original file info
        const fileSize = this.formatFileSize(this.originalFile.size);
        const dimensions = `${this.originalImage.naturalWidth}×${this.originalImage.naturalHeight}`;
        originalInfo.textContent = `${fileSize} • ${dimensions}`;

        // Update original dimensions display
        document.getElementById('originalDimensions').textContent = dimensions;
    }

    setupInitialDimensions() {
        if (!this.originalImage) return;

        const newWidth = document.getElementById('newWidth');
        const newHeight = document.getElementById('newHeight');

        // Set initial values to current dimensions
        newWidth.value = this.originalImage.naturalWidth;
        newHeight.value = this.originalImage.naturalHeight;
        newWidth.placeholder = this.originalImage.naturalWidth;
        newHeight.placeholder = this.originalImage.naturalHeight;

        // Update aspect ratio UI
        this.updateAspectRatioUI();
    }

    switchMethod(method) {
        this.currentMethod = method;

        // Update tab states
        const tabs = document.querySelectorAll('.method-tab');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-method') === method) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update content visibility
        const contents = document.querySelectorAll('.method-content');
        contents.forEach(content => {
            if (content.id === method + 'Method') {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Clear preset selection when switching away from presets
        if (method !== 'presets') {
            const presetButtons = document.querySelectorAll('.preset-btn');
            presetButtons.forEach(btn => btn.classList.remove('active'));
        }

        this.resizeImage();
    }

    updateAspectRatioUI() {
        const aspectRatioLink = document.getElementById('aspectRatioLink');
        if (this.isAspectRatioLocked) {
            aspectRatioLink.classList.remove('broken');
        } else {
            aspectRatioLink.classList.add('broken');
        }
    }

    showResults() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
    }

    resizeImage() {
        if (!this.originalImage) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Get target dimensions based on current method
        let targetWidth, targetHeight;

        switch (this.currentMethod) {
            case 'percentage':
                const percentage = parseInt(document.getElementById('percentageSlider').value) / 100;
                targetWidth = Math.round(this.originalImage.naturalWidth * percentage);
                targetHeight = Math.round(this.originalImage.naturalHeight * percentage);
                break;

            case 'dimensions':
                targetWidth = parseInt(document.getElementById('newWidth').value) || this.originalImage.naturalWidth;
                targetHeight = parseInt(document.getElementById('newHeight').value) || this.originalImage.naturalHeight;
                break;

            case 'presets':
                targetWidth = parseInt(document.getElementById('newWidth').value) || this.originalImage.naturalWidth;
                targetHeight = parseInt(document.getElementById('newHeight').value) || this.originalImage.naturalHeight;
                break;

            default:
                targetWidth = this.originalImage.naturalWidth;
                targetHeight = this.originalImage.naturalHeight;
        }

        // Get resize mode
        const resizeMode = document.querySelector('input[name="resizeMode"]:checked').value;
        const quality = parseInt(document.getElementById('qualitySlider').value) / 100;

        // Calculate actual canvas dimensions based on resize mode
        let canvasWidth, canvasHeight;
        let drawWidth, drawHeight;
        let drawX = 0, drawY = 0;

        switch (resizeMode) {
            case 'contain':
                // Fit image within target dimensions maintaining aspect ratio
                const scaleContain = Math.min(targetWidth / this.originalImage.naturalWidth, targetHeight / this.originalImage.naturalHeight);
                drawWidth = Math.round(this.originalImage.naturalWidth * scaleContain);
                drawHeight = Math.round(this.originalImage.naturalHeight * scaleContain);
                canvasWidth = targetWidth;
                canvasHeight = targetHeight;
                drawX = (targetWidth - drawWidth) / 2;
                drawY = (targetHeight - drawHeight) / 2;
                break;

            case 'cover':
                // Fill target dimensions maintaining aspect ratio, cropping if necessary
                const scaleCover = Math.max(targetWidth / this.originalImage.naturalWidth, targetHeight / this.originalImage.naturalHeight);
                drawWidth = Math.round(this.originalImage.naturalWidth * scaleCover);
                drawHeight = Math.round(this.originalImage.naturalHeight * scaleCover);
                canvasWidth = targetWidth;
                canvasHeight = targetHeight;
                drawX = (targetWidth - drawWidth) / 2;
                drawY = (targetHeight - drawHeight) / 2;
                break;

            case 'stretch':
                // Stretch to exact dimensions
                canvasWidth = targetWidth;
                canvasHeight = targetHeight;
                drawWidth = targetWidth;
                drawHeight = targetHeight;
                break;
        }

        // Set canvas size
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Fill background with white for transparency
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw resized image
        ctx.drawImage(this.originalImage, drawX, drawY, drawWidth, drawHeight);

        // Convert to blob
        canvas.toBlob((blob) => {
            this.resizedBlob = blob;
            this.displayResizedImage(blob);
            this.updateDimensionsDisplay(canvasWidth, canvasHeight);
        }, this.originalFile.type, quality);
    }

    displayResizedImage(blob) {
        const resizedImage = document.getElementById('resizedImage');
        const resizedInfo = document.getElementById('resizedInfo');
        const objectURL = URL.createObjectURL(blob);
        
        resizedImage.onload = () => {
            URL.revokeObjectURL(objectURL);
        };
        
        resizedImage.src = objectURL;

        // Update info
        const fileSize = this.formatFileSize(blob.size);
        resizedInfo.textContent = `${fileSize} • Ready to download`;
    }

    updateDimensionsDisplay(width, height) {
        const newDimensions = document.getElementById('newDimensions');
        newDimensions.textContent = `${width}×${height}`;
    }

    downloadResized() {
        if (!this.resizedBlob) {
            this.showError('No resized image available. Please try again.');
            return;
        }

        // Generate filename
        const originalName = this.originalFile.name.split('.')[0];
        const extension = this.getFileExtension(this.originalFile.type);
        const filename = `${originalName}-resized.${extension}`;

        // Create download link
        const url = URL.createObjectURL(this.resizedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    resetTool() {
        // Reset file input
        document.getElementById('fileInput').value = '';
        
        // Hide results
        document.getElementById('resultsSection').classList.add('hidden');
        
        // Clear data
        this.originalFile = null;
        this.originalImage = null;
        this.resizedBlob = null;
        this.aspectRatio = 1;
        
        // Reset form to defaults
        this.switchMethod('percentage');
        document.getElementById('percentageSlider').value = 100;
        document.getElementById('percentageValue').textContent = '100%';
        document.getElementById('percentageInput').value = 100;
        document.getElementById('newWidth').value = '';
        document.getElementById('newHeight').value = '';
        document.getElementById('maintainAspectRatio').checked = true;
        this.isAspectRatioLocked = true;
        this.updateAspectRatioUI();
        document.querySelector('input[name="resizeMode"][value="contain"]').checked = true;
        document.getElementById('qualitySlider').value = 90;
        document.getElementById('qualityValue').textContent = '90%';
        
        // Clear preset selection
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => btn.classList.remove('active'));
        
        // Clear dimensions display
        document.getElementById('originalDimensions').textContent = '-';
        document.getElementById('newDimensions').textContent = '-';
        
        // Clear error
        this.hideError();
        
        // Clear upload area drag state
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    // Utility functions
    getFileExtension(mimeType) {
        const extensions = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/bmp': 'bmp',
            'image/svg+xml': 'svg'
        };
        return extensions[mimeType] || 'jpg';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showError(message) {
        const errorDiv = document.getElementById('uploadError');
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }

    hideError() {
        const errorDiv = document.getElementById('uploadError');
        errorDiv.classList.remove('show');
    }
}

// Theme Integration
class ThemeIntegration {
    constructor() {
        this.init();
    }

    init() {
        this.applyTheme();
        this.watchThemeChanges();
    }

    applyTheme() {
        const isDark = document.documentElement.classList.contains('dark-mode');
        const themeStylesheet = document.getElementById('theme-stylesheet');
        
        if (themeStylesheet) {
            themeStylesheet.href = isDark ? './dark.css' : './light.css';
        }
    }

    watchThemeChanges() {
        // Watch for theme toggle
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    this.applyTheme();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageResizerTool();
    new ThemeIntegration();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageResizerTool, ThemeIntegration };
}
