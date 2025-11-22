// Image to Base64 Converter Tool
class ImageToBase64Tool {
    constructor() {
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

        // Quality slider
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        qualitySlider.addEventListener('input', (e) => {
            qualityValue.textContent = e.target.value + '%';
            this.updateBase64Output();
        });

        // Format radio buttons
        const formatRadios = document.querySelectorAll('input[name="format"]');
        formatRadios.forEach(radio => {
            radio.addEventListener('change', this.updateBase64Output.bind(this));
        });

        // Include data URL radio buttons
        const includeRadios = document.querySelectorAll('input[name="includeDataUrl"]');
        includeRadios.forEach(radio => {
            radio.addEventListener('change', this.updateBase64Output.bind(this));
        });

        // Copy and download buttons
        document.getElementById('copyBtn').addEventListener('click', this.copyToClipboard.bind(this));
        document.getElementById('downloadBtn').addEventListener('click', this.downloadBase64.bind(this));
        document.getElementById('selectAllBtn').addEventListener('click', this.selectAllText.bind(this));
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
            this.showError('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG, BMP, ICO).');
            return;
        }

        // Check file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            this.showError('File size too large. Please select an image smaller than 50MB.');
            return;
        }

        this.hideError();
        this.currentFile = file;
        this.displayPreview(file);
        this.convertToBase64(file);
    }

    displayPreview(file) {
        const previewImage = document.getElementById('previewImage');
        const previewInfo = document.getElementById('previewInfo');
        const resultsSection = document.getElementById('resultsSection');

        // Create object URL for preview
        const objectURL = URL.createObjectURL(file);
        previewImage.src = objectURL;
        previewImage.onload = () => {
            URL.revokeObjectURL(objectURL);
        };

        // Update file info
        const fileSize = this.formatFileSize(file.size);
        const fileType = file.type || 'Unknown';
        previewInfo.textContent = `${fileSize} • ${fileType}`;

        // Show results section
        resultsSection.classList.remove('hidden');
    }

    convertToBase64(file) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Set canvas dimensions
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Draw image to canvas
            ctx.drawImage(img, 0, 0);

            // Store original data for processing
            this.originalImageData = {
                canvas: canvas,
                width: img.naturalWidth,
                height: img.naturalHeight,
                originalType: file.type
            };

            // Generate initial base64
            this.updateBase64Output();
        };

        img.onerror = () => {
            this.showError('Failed to load the image. Please try a different file.');
        };

        img.src = URL.createObjectURL(file);
    }

    updateBase64Output() {
        if (!this.originalImageData) return;

        const formatSelect = document.querySelector('input[name="format"]:checked');
        const includeDataUrl = document.querySelector('input[name="includeDataUrl"]:checked').value === 'true';
        const quality = parseInt(document.getElementById('qualitySlider').value) / 100;
        const outputTextarea = document.getElementById('base64Output');
        const outputInfo = document.getElementById('outputInfo');

        let outputFormat = formatSelect.value;
        let mimeType;

        // Determine MIME type
        switch (outputFormat) {
            case 'original':
                mimeType = this.originalImageData.originalType;
                break;
            case 'png':
                mimeType = 'image/png';
                break;
            case 'jpeg':
                mimeType = 'image/jpeg';
                break;
            case 'webp':
                mimeType = 'image/webp';
                break;
            default:
                mimeType = this.originalImageData.originalType;
        }

        // Generate base64 string
        let base64String;
        if (mimeType === 'image/jpeg' || mimeType === 'image/webp') {
            base64String = this.originalImageData.canvas.toDataURL(mimeType, quality);
        } else {
            base64String = this.originalImageData.canvas.toDataURL(mimeType);
        }

        // Process output based on format preference
        let finalOutput;
        if (includeDataUrl) {
            finalOutput = base64String;
        } else {
            // Remove data URL prefix
            finalOutput = base64String.split(',')[1];
        }

        // Update output
        outputTextarea.value = finalOutput;

        // Update output info
        const dataSize = this.estimateBase64Size(finalOutput);
        const compressionRatio = this.currentFile ? 
            ((this.currentFile.size - dataSize) / this.currentFile.size * 100).toFixed(1) : '0';
        
        outputInfo.innerHTML = `
            <span>Size: ${this.formatFileSize(dataSize)}</span>
            <span>Format: ${mimeType}</span>
            <span>Compression: ${compressionRatio}%</span>
        `;
    }

    estimateBase64Size(base64String) {
        // Base64 encoding increases size by ~33%
        // Remove data URL prefix if present
        const cleanBase64 = base64String.includes(',') ? base64String.split(',')[1] : base64String;
        return Math.ceil(cleanBase64.length * 3 / 4);
    }

    async copyToClipboard() {
        const outputTextarea = document.getElementById('base64Output');
        const copyBtn = document.getElementById('copyBtn');
        
        try {
            await navigator.clipboard.writeText(outputTextarea.value);
            
            // Visual feedback
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
            copyBtn.style.background = '#10b981';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.style.background = '';
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            outputTextarea.select();
            document.execCommand('copy');
            
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        }
    }

    downloadBase64() {
        const outputTextarea = document.getElementById('base64Output');
        const includeDataUrl = document.querySelector('input[name="includeDataUrl"]:checked').value === 'true';
        
        let filename = 'base64-output.txt';
        if (this.currentFile) {
            const baseName = this.currentFile.name.split('.')[0];
            filename = `${baseName}-base64.txt`;
        }

        // Create downloadable content
        let content = outputTextarea.value;
        if (includeDataUrl) {
            content = `/* Base64 Data URL */\n${content}`;
        } else {
            content = `/* Base64 String (without data URL prefix) */\n${content}`;
        }

        // Create and trigger download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    selectAllText() {
        const outputTextarea = document.getElementById('base64Output');
        outputTextarea.select();
        outputTextarea.setSelectionRange(0, 99999); // For mobile devices
    }

    resetTool() {
        // Reset file input
        document.getElementById('fileInput').value = '';
        
        // Hide results
        document.getElementById('resultsSection').classList.add('hidden');
        
        // Clear data
        this.currentFile = null;
        this.originalImageData = null;
        
        // Reset form to defaults
        document.getElementById('qualitySlider').value = 90;
        document.getElementById('qualityValue').textContent = '90%';
        document.querySelector('input[name="format"][value="original"]').checked = true;
        document.querySelector('input[name="includeDataUrl"][value="true"]').checked = true;
        
        // Clear error
        this.hideError();
        
        // Clear upload area drag state
        document.getElementById('uploadArea').classList.remove('dragover');
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

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    new ImageToBase64Tool();
    new ThemeIntegration();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageToBase64Tool, ThemeIntegration };
}
