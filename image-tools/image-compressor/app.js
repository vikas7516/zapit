// Image Compressor Tool
class ImageCompressorTool {
    constructor() {
        this.originalFile = null;
        this.originalImage = null;
        this.compressedBlob = null;
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

        // Compression controls
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        qualitySlider.addEventListener('input', (e) => {
            qualityValue.textContent = e.target.value + '%';
            this.compressImage();
        });

        // Format selection
        const formatRadios = document.querySelectorAll('input[name="outputFormat"]');
        formatRadios.forEach(radio => {
            radio.addEventListener('change', this.compressImage.bind(this));
        });

        // Resize controls
        const enableResize = document.getElementById('enableResize');
        const resizeControls = document.getElementById('resizeControls');
        enableResize.addEventListener('change', (e) => {
            if (e.target.checked) {
                resizeControls.classList.remove('hidden');
            } else {
                resizeControls.classList.add('hidden');
            }
            this.compressImage();
        });

        // Resize method
        const resizeMethodRadios = document.querySelectorAll('input[name="resizeMethod"]');
        resizeMethodRadios.forEach(radio => {
            radio.addEventListener('change', this.handleResizeMethodChange.bind(this));
        });

        // Scale slider
        const scaleSlider = document.getElementById('scaleSlider');
        const scaleValue = document.getElementById('scaleValue');
        scaleSlider.addEventListener('input', (e) => {
            scaleValue.textContent = e.target.value + '%';
            this.compressImage();
        });

        // Dimension inputs
        const newWidth = document.getElementById('newWidth');
        const newHeight = document.getElementById('newHeight');
        const maintainAspectRatio = document.getElementById('maintainAspectRatio');

        newWidth.addEventListener('input', () => {
            if (maintainAspectRatio.checked && this.originalImage) {
                const aspectRatio = this.originalImage.naturalWidth / this.originalImage.naturalHeight;
                newHeight.value = Math.round(newWidth.value / aspectRatio);
            }
            this.compressImage();
        });

        newHeight.addEventListener('input', () => {
            if (maintainAspectRatio.checked && this.originalImage) {
                const aspectRatio = this.originalImage.naturalWidth / this.originalImage.naturalHeight;
                newWidth.value = Math.round(newHeight.value * aspectRatio);
            }
            this.compressImage();
        });

        maintainAspectRatio.addEventListener('change', this.compressImage.bind(this));

        // Action buttons
        document.getElementById('downloadBtn').addEventListener('click', this.downloadCompressed.bind(this));
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
            this.displayOriginalImage();
            this.setupDimensionInputs();
            this.showResults();
            this.compressImage();
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

        // Update results
        document.getElementById('originalSize').textContent = fileSize;
    }

    setupDimensionInputs() {
        if (!this.originalImage) return;

        const newWidth = document.getElementById('newWidth');
        const newHeight = document.getElementById('newHeight');

        // Set initial values to current dimensions
        newWidth.value = this.originalImage.naturalWidth;
        newHeight.value = this.originalImage.naturalHeight;
        newWidth.placeholder = this.originalImage.naturalWidth;
        newHeight.placeholder = this.originalImage.naturalHeight;
    }

    handleResizeMethodChange() {
        const percentageInputs = document.getElementById('percentageInputs');
        const dimensionInputs = document.getElementById('dimensionInputs');
        const selectedMethod = document.querySelector('input[name="resizeMethod"]:checked').value;

        if (selectedMethod === 'percentage') {
            percentageInputs.classList.remove('hidden');
            dimensionInputs.classList.add('hidden');
        } else {
            percentageInputs.classList.add('hidden');
            dimensionInputs.classList.remove('hidden');
        }

        this.compressImage();
    }

    showResults() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
    }

    compressImage() {
        if (!this.originalImage) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Get compression settings
        const quality = parseInt(document.getElementById('qualitySlider').value) / 100;
        const outputFormat = document.querySelector('input[name="outputFormat"]:checked').value;
        const enableResize = document.getElementById('enableResize').checked;

        // Calculate dimensions
        let targetWidth = this.originalImage.naturalWidth;
        let targetHeight = this.originalImage.naturalHeight;

        if (enableResize) {
            const resizeMethod = document.querySelector('input[name="resizeMethod"]:checked').value;
            
            if (resizeMethod === 'percentage') {
                const scale = parseInt(document.getElementById('scaleSlider').value) / 100;
                targetWidth = Math.round(this.originalImage.naturalWidth * scale);
                targetHeight = Math.round(this.originalImage.naturalHeight * scale);
            } else {
                const newWidth = parseInt(document.getElementById('newWidth').value) || this.originalImage.naturalWidth;
                const newHeight = parseInt(document.getElementById('newHeight').value) || this.originalImage.naturalHeight;
                targetWidth = newWidth;
                targetHeight = newHeight;
            }
        }

        // Set canvas size
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw image with new dimensions
        ctx.drawImage(this.originalImage, 0, 0, targetWidth, targetHeight);

        // Determine output format and MIME type
        let mimeType;
        let fileExtension;

        switch (outputFormat) {
            case 'original':
                mimeType = this.originalFile.type;
                fileExtension = this.getFileExtension(this.originalFile.type);
                break;
            case 'jpeg':
                mimeType = 'image/jpeg';
                fileExtension = 'jpg';
                break;
            case 'webp':
                mimeType = 'image/webp';
                fileExtension = 'webp';
                break;
            default:
                mimeType = this.originalFile.type;
                fileExtension = this.getFileExtension(this.originalFile.type);
        }

        // Convert to blob
        canvas.toBlob((blob) => {
            this.compressedBlob = blob;
            this.displayCompressedImage(blob);
            this.updateCompressionResults(blob);
        }, mimeType, quality);
    }

    displayCompressedImage(blob) {
        const compressedImage = document.getElementById('compressedImage');
        const objectURL = URL.createObjectURL(blob);
        
        compressedImage.onload = () => {
            URL.revokeObjectURL(objectURL);
        };
        
        compressedImage.src = objectURL;
    }

    updateCompressionResults(compressedBlob) {
        const originalSize = this.originalFile.size;
        const compressedSize = compressedBlob.size;
        const sizeReduction = originalSize - compressedSize;
        const compressionRatio = ((sizeReduction / originalSize) * 100);

        // Update UI
        document.getElementById('compressedSize').textContent = this.formatFileSize(compressedSize);
        document.getElementById('sizeReduction').textContent = this.formatFileSize(sizeReduction);
        document.getElementById('compressionRatio').textContent = compressionRatio.toFixed(1) + '%';

        // Update results styling based on compression efficiency
        const compressionRatioElement = document.getElementById('compressionRatio');
        if (compressionRatio > 50) {
            compressionRatioElement.style.color = '#10b981'; // Green
        } else if (compressionRatio > 25) {
            compressionRatioElement.style.color = '#f59e0b'; // Yellow
        } else {
            compressionRatioElement.style.color = '#ef4444'; // Red
        }
    }

    downloadCompressed() {
        if (!this.compressedBlob) {
            this.showError('No compressed image available. Please try again.');
            return;
        }

        // Generate filename
        const outputFormat = document.querySelector('input[name="outputFormat"]:checked').value;
        let fileExtension;

        switch (outputFormat) {
            case 'original':
                fileExtension = this.getFileExtension(this.originalFile.type);
                break;
            case 'jpeg':
                fileExtension = 'jpg';
                break;
            case 'webp':
                fileExtension = 'webp';
                break;
            default:
                fileExtension = this.getFileExtension(this.originalFile.type);
        }

        const originalName = this.originalFile.name.split('.')[0];
        const filename = `${originalName}-compressed.${fileExtension}`;

        // Create download link
        const url = URL.createObjectURL(this.compressedBlob);
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
        this.compressedBlob = null;
        
        // Reset form to defaults
        document.getElementById('qualitySlider').value = 80;
        document.getElementById('qualityValue').textContent = '80%';
        document.querySelector('input[name="outputFormat"][value="original"]').checked = true;
        document.getElementById('enableResize').checked = false;
        document.getElementById('resizeControls').classList.add('hidden');
        document.getElementById('scaleSlider').value = 75;
        document.getElementById('scaleValue').textContent = '75%';
        document.querySelector('input[name="resizeMethod"][value="percentage"]').checked = true;
        document.getElementById('percentageInputs').classList.remove('hidden');
        document.getElementById('dimensionInputs').classList.add('hidden');
        document.getElementById('maintainAspectRatio').checked = true;
        document.getElementById('newWidth').value = '';
        document.getElementById('newHeight').value = '';
        
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
    new ImageCompressorTool();
    new ThemeIntegration();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageCompressorTool, ThemeIntegration };
}
