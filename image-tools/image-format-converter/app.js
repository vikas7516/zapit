// Image Format Converter Tool
class ImageFormatConverter {
    constructor() {
        this.originalFile = null;
        this.originalImage = null;
        this.convertedBlob = null;
        this.currentFormat = 'jpeg';
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateFormatSettings();
    }

    bindEvents() {
        // File input and upload area
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const browseBtn = document.getElementById('browseBtn');

        // Upload events
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        browseBtn.addEventListener('click', () => fileInput.click());
        
        // Drag and drop events
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        uploadArea.addEventListener('click', () => fileInput.click());

        // Format selection
        const formatButtons = document.querySelectorAll('.format-btn');
        formatButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.getAttribute('data-format');
                this.selectFormat(format);
            });
        });

        // Quality control
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        qualitySlider.addEventListener('input', (e) => {
            qualityValue.textContent = e.target.value + '%';
            if (this.originalImage) {
                this.convertImage();
            }
        });

        // Background color
        const backgroundColor = document.getElementById('backgroundColor');
        const colorPresets = document.querySelectorAll('.color-preset');
        
        backgroundColor.addEventListener('change', () => {
            if (this.originalImage) {
                this.convertImage();
            }
        });

        colorPresets.forEach(preset => {
            preset.addEventListener('click', () => {
                const color = preset.getAttribute('data-color');
                backgroundColor.value = color;
                if (this.originalImage) {
                    this.convertImage();
                }
            });
        });

        // Resize options
        const enableResize = document.getElementById('enableResize');
        const resizeOptions = document.getElementById('resizeOptions');
        const resizeWidth = document.getElementById('resizeWidth');
        const resizeHeight = document.getElementById('resizeHeight');
        const maintainAspectRatio = document.getElementById('maintainAspectRatio');

        enableResize.addEventListener('change', (e) => {
            if (e.target.checked) {
                resizeOptions.classList.add('active');
                if (this.originalImage) {
                    resizeWidth.placeholder = this.originalImage.naturalWidth;
                    resizeHeight.placeholder = this.originalImage.naturalHeight;
                }
            } else {
                resizeOptions.classList.remove('active');
            }
            if (this.originalImage) {
                this.convertImage();
            }
        });

        resizeWidth.addEventListener('input', () => {
            if (maintainAspectRatio.checked && this.originalImage && resizeWidth.value) {
                const aspectRatio = this.originalImage.naturalWidth / this.originalImage.naturalHeight;
                resizeHeight.value = Math.round(resizeWidth.value / aspectRatio);
            }
            if (this.originalImage) {
                this.convertImage();
            }
        });

        resizeHeight.addEventListener('input', () => {
            if (maintainAspectRatio.checked && this.originalImage && resizeHeight.value) {
                const aspectRatio = this.originalImage.naturalWidth / this.originalImage.naturalHeight;
                resizeWidth.value = Math.round(resizeHeight.value * aspectRatio);
            }
            if (this.originalImage) {
                this.convertImage();
            }
        });

        maintainAspectRatio.addEventListener('change', () => {
            if (maintainAspectRatio.checked && this.originalImage && resizeWidth.value) {
                const aspectRatio = this.originalImage.naturalWidth / this.originalImage.naturalHeight;
                resizeHeight.value = Math.round(resizeWidth.value / aspectRatio);
                if (this.originalImage) {
                    this.convertImage();
                }
            }
        });

        // Convert button
        document.getElementById('convertBtn').addEventListener('click', this.convertImage.bind(this));

        // Action buttons
        document.getElementById('downloadBtn').addEventListener('click', this.downloadConverted.bind(this));
        document.getElementById('convertAnotherBtn').addEventListener('click', this.resetTool.bind(this));
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
            this.showSettings();
            this.setupResizePlaceholders();
            this.convertImage();
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectURL);
            this.showError('Failed to load the image. Please try a different file.');
        };

        img.src = objectURL;
    }

    displayOriginalImage() {
        const originalImage = document.getElementById('originalImage');
        const originalInfo = document.getElementById('originalInfo');

        // Display original image
        originalImage.src = URL.createObjectURL(this.originalFile);

        // Display original file info
        const fileSize = this.formatFileSize(this.originalFile.size);
        const dimensions = `${this.originalImage.naturalWidth}×${this.originalImage.naturalHeight}`;
        const format = this.getFormatName(this.originalFile.type);
        originalInfo.textContent = `${format} • ${fileSize} • ${dimensions}`;
    }

    setupResizePlaceholders() {
        if (!this.originalImage) return;
        
        const resizeWidth = document.getElementById('resizeWidth');
        const resizeHeight = document.getElementById('resizeHeight');
        
        resizeWidth.placeholder = this.originalImage.naturalWidth;
        resizeHeight.placeholder = this.originalImage.naturalHeight;
    }

    selectFormat(format) {
        this.currentFormat = format;

        // Update button states
        const formatButtons = document.querySelectorAll('.format-btn');
        formatButtons.forEach(btn => {
            if (btn.getAttribute('data-format') === format) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.updateFormatSettings();
        
        if (this.originalImage) {
            this.convertImage();
        }
    }

    updateFormatSettings() {
        const qualityGroup = document.getElementById('qualityGroup');
        const backgroundGroup = document.getElementById('backgroundGroup');

        // Show/hide quality setting based on format
        if (this.currentFormat === 'jpeg' || this.currentFormat === 'webp') {
            qualityGroup.style.display = 'block';
        } else {
            qualityGroup.style.display = 'none';
        }

        // Show/hide background setting based on format
        if (this.currentFormat === 'jpeg' || this.currentFormat === 'bmp') {
            backgroundGroup.style.display = 'block';
        } else {
            backgroundGroup.style.display = 'none';
        }
    }

    showSettings() {
        const settingsSection = document.getElementById('settingsSection');
        settingsSection.style.display = 'block';
    }

    convertImage() {
        if (!this.originalImage) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Get target dimensions
        let targetWidth = this.originalImage.naturalWidth;
        let targetHeight = this.originalImage.naturalHeight;

        const enableResize = document.getElementById('enableResize').checked;
        if (enableResize) {
            const resizeWidth = document.getElementById('resizeWidth').value;
            const resizeHeight = document.getElementById('resizeHeight').value;
            
            if (resizeWidth) targetWidth = parseInt(resizeWidth);
            if (resizeHeight) targetHeight = parseInt(resizeHeight);
        }

        // Set canvas size
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Fill background for formats that don't support transparency
        if (this.currentFormat === 'jpeg' || this.currentFormat === 'bmp') {
            const backgroundColor = document.getElementById('backgroundColor').value;
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // Draw image
        ctx.drawImage(this.originalImage, 0, 0, targetWidth, targetHeight);

        // Get quality setting
        const quality = parseInt(document.getElementById('qualitySlider').value) / 100;

        // Convert to target format
        const mimeType = this.getMimeType(this.currentFormat);
        
        canvas.toBlob((blob) => {
            this.convertedBlob = blob;
            this.displayConvertedImage(blob);
            this.showResults();
            this.updateSizeComparison();
        }, mimeType, quality);
    }

    displayConvertedImage(blob) {
        const convertedImage = document.getElementById('convertedImage');
        const convertedInfo = document.getElementById('convertedInfo');
        const objectURL = URL.createObjectURL(blob);
        
        convertedImage.onload = () => {
            URL.revokeObjectURL(objectURL);
        };
        
        convertedImage.src = objectURL;

        // Update info
        const fileSize = this.formatFileSize(blob.size);
        const format = this.getFormatName(this.getMimeType(this.currentFormat));
        
        // Get dimensions from canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            const dimensions = `${img.naturalWidth}×${img.naturalHeight}`;
            convertedInfo.textContent = `${format} • ${fileSize} • ${dimensions}`;
        };
        img.src = objectURL;
    }

    updateSizeComparison() {
        if (!this.originalFile || !this.convertedBlob) return;

        const originalSize = this.originalFile.size;
        const convertedSize = this.convertedBlob.size;
        const maxSize = Math.max(originalSize, convertedSize);

        // Update size bars
        const originalSizeBar = document.getElementById('originalSizeBar');
        const convertedSizeBar = document.getElementById('convertedSizeBar');
        
        originalSizeBar.style.width = `${(originalSize / maxSize) * 100}%`;
        convertedSizeBar.style.width = `${(convertedSize / maxSize) * 100}%`;

        // Update size labels
        document.getElementById('originalSize').textContent = this.formatFileSize(originalSize);
        document.getElementById('convertedSize').textContent = this.formatFileSize(convertedSize);

        // Update size change
        const sizeChange = document.getElementById('sizeChange');
        const percentChange = ((convertedSize - originalSize) / originalSize * 100);
        
        if (convertedSize < originalSize) {
            const reduction = ((originalSize - convertedSize) / originalSize * 100).toFixed(1);
            sizeChange.textContent = `File size reduced by ${reduction}%`;
            sizeChange.className = 'size-change reduced';
        } else if (convertedSize > originalSize) {
            const increase = percentChange.toFixed(1);
            sizeChange.textContent = `File size increased by ${increase}%`;
            sizeChange.className = 'size-change increased';
        } else {
            sizeChange.textContent = 'File size unchanged';
            sizeChange.className = 'size-change same';
        }
    }

    showResults() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.remove('hidden');
    }

    downloadConverted() {
        if (!this.convertedBlob) {
            this.showError('No converted image available. Please try again.');
            return;
        }

        // Generate filename
        const originalName = this.originalFile.name.split('.')[0];
        const extension = this.getFileExtension(this.currentFormat);
        const filename = `${originalName}-converted.${extension}`;

        // Create download link
        const url = URL.createObjectURL(this.convertedBlob);
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
        
        // Hide sections
        document.getElementById('settingsSection').style.display = 'none';
        document.getElementById('resultsSection').classList.add('hidden');
        
        // Clear data
        this.originalFile = null;
        this.originalImage = null;
        this.convertedBlob = null;
        
        // Reset form to defaults
        this.selectFormat('jpeg');
        document.getElementById('qualitySlider').value = 90;
        document.getElementById('qualityValue').textContent = '90%';
        document.getElementById('backgroundColor').value = '#ffffff';
        document.getElementById('enableResize').checked = false;
        document.getElementById('resizeOptions').classList.remove('active');
        document.getElementById('resizeWidth').value = '';
        document.getElementById('resizeHeight').value = '';
        document.getElementById('maintainAspectRatio').checked = true;
        
        // Clear error
        this.hideError();
        
        // Clear upload area drag state
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    // Utility functions
    getMimeType(format) {
        const mimeTypes = {
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'bmp': 'image/bmp'
        };
        return mimeTypes[format] || 'image/jpeg';
    }

    getFileExtension(format) {
        const extensions = {
            'jpeg': 'jpg',
            'png': 'png',
            'webp': 'webp',
            'bmp': 'bmp'
        };
        return extensions[format] || 'jpg';
    }

    getFormatName(mimeType) {
        const formatNames = {
            'image/jpeg': 'JPEG',
            'image/png': 'PNG',
            'image/webp': 'WebP',
            'image/gif': 'GIF',
            'image/bmp': 'BMP',
            'image/svg+xml': 'SVG'
        };
        return formatNames[mimeType] || 'Unknown';
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
    new ImageFormatConverter();
    new ThemeIntegration();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageFormatConverter, ThemeIntegration };
}
