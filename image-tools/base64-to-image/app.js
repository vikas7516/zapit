// Base64 to Image Tool - JavaScript functionality

class Base64ToImageTool {
    constructor() {
        this.currentImageData = null;
        this.originalFormat = null;
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupThemeToggle();
    }

    setupElements() {
        this.base64Input = document.getElementById('base64Input');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.inputInfo = document.getElementById('inputInfo');
        this.inputFormat = document.getElementById('inputFormat');
        this.inputError = document.getElementById('inputError');
        this.convertBtn = document.getElementById('convertBtn');
        this.previewSection = document.getElementById('previewSection');
        this.previewImage = document.getElementById('previewImage');
        this.previewInfo = document.getElementById('previewInfo');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.formatSelect = document.getElementById('formatSelect');
    }

    setupEventListeners() {
        // Input events
        this.base64Input.addEventListener('input', this.handleInputChange.bind(this));
        this.pasteBtn.addEventListener('click', this.handlePaste.bind(this));
        this.clearBtn.addEventListener('click', this.handleClear.bind(this));
        
        // Convert button
        this.convertBtn.addEventListener('click', this.handleConvert.bind(this));
        
        // Download button
        this.downloadBtn.addEventListener('click', this.handleDownload.bind(this));
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

    handleInputChange() {
        const input = this.base64Input.value.trim();
        this.updateInputInfo(input);
        this.validateInput(input);
    }

    async handlePaste() {
        try {
            const text = await navigator.clipboard.readText();
            this.base64Input.value = text;
            this.handleInputChange();
        } catch (err) {
            this.showError('Failed to read from clipboard. Please paste manually.');
        }
    }

    handleClear() {
        this.base64Input.value = '';
        this.hideError();
        this.hidePreview();
        this.updateInputInfo('');
        this.convertBtn.disabled = true;
    }

    updateInputInfo(input) {
        const length = input.length;
        document.querySelector('.input-length').textContent = `${length.toLocaleString()} characters`;
        
        // Detect format
        const format = this.detectFormat(input);
        if (format) {
            this.inputFormat.textContent = format.toUpperCase();
            this.inputFormat.style.display = 'inline-block';
        } else {
            this.inputFormat.style.display = 'none';
        }
    }

    detectFormat(input) {
        if (!input) return null;
        
        // Check for data URL prefix
        const dataUrlMatch = input.match(/^data:image\/(\w+);base64,/);
        if (dataUrlMatch) {
            return dataUrlMatch[1];
        }
        
        // Try to detect from Base64 header
        const base64Data = input.replace(/^data:image\/\w+;base64,/, '');
        if (base64Data.length < 10) return null;
        
        try {
            // Decode first few bytes to check magic numbers
            const binaryString = atob(base64Data.substring(0, 20));
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Check magic numbers
            if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
                return 'jpeg';
            } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
                return 'png';
            } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
                return 'gif';
            } else if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
                return 'webp';
            }
        } catch (e) {
            // Invalid Base64, will be caught in validation
        }
        
        return 'unknown';
    }

    validateInput(input) {
        this.hideError();
        
        if (!input) {
            this.convertBtn.disabled = true;
            return false;
        }

        // Remove data URL prefix if present
        const base64Data = input.replace(/^data:image\/\w+;base64,/, '');
        
        // Check if it's valid Base64
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64Data)) {
            this.showError('Invalid Base64 format. Please check your input.');
            this.convertBtn.disabled = true;
            return false;
        }
        
        // Check length (Base64 should be multiple of 4)
        if (base64Data.length % 4 !== 0) {
            this.showError('Invalid Base64 length. The string appears to be truncated.');
            this.convertBtn.disabled = true;
            return false;
        }
        
        // Try to decode to check validity
        try {
            atob(base64Data);
        } catch (e) {
            this.showError('Invalid Base64 data. Cannot decode the string.');
            this.convertBtn.disabled = true;
            return false;
        }
        
        this.convertBtn.disabled = false;
        return true;
    }

    handleConvert() {
        const input = this.base64Input.value.trim();
        
        if (!this.validateInput(input)) {
            return;
        }

        try {
            this.convertToImage(input);
        } catch (error) {
            this.showError('Failed to convert Base64 to image. Please check your data.');
            console.error('Conversion error:', error);
        }
    }

    convertToImage(input) {
        // Extract format and Base64 data
        let format = 'png'; // default
        let base64Data = input;
        
        const dataUrlMatch = input.match(/^data:image\/(\w+);base64,(.+)$/);
        if (dataUrlMatch) {
            format = dataUrlMatch[1];
            base64Data = dataUrlMatch[2];
        } else {
            // Try to detect format from content
            const detectedFormat = this.detectFormat(input);
            if (detectedFormat && detectedFormat !== 'unknown') {
                format = detectedFormat;
            }
        }
        
        this.originalFormat = format;
        
        // Create image data URL
        const imageDataUrl = `data:image/${format};base64,${base64Data}`;
        
        // Load image
        this.previewImage.onload = () => {
            this.currentImageData = imageDataUrl;
            this.showPreview();
            this.updatePreviewInfo();
        };
        
        this.previewImage.onerror = () => {
            this.showError('Invalid image data. The Base64 string does not represent a valid image.');
        };
        
        this.previewImage.src = imageDataUrl;
    }

    showPreview() {
        this.previewSection.classList.remove('hidden');
        
        // Scroll to preview
        this.previewSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    hidePreview() {
        this.previewSection.classList.add('hidden');
        this.currentImageData = null;
        this.originalFormat = null;
    }

    updatePreviewInfo() {
        const img = this.previewImage;
        const format = this.originalFormat || 'unknown';
        const size = this.estimateFileSize();
        
        this.previewInfo.textContent = `${img.naturalWidth} × ${img.naturalHeight}px • ${format.toUpperCase()} • ~${size}`;
    }

    estimateFileSize() {
        if (!this.currentImageData) return '0 KB';
        
        // Remove data URL prefix and calculate size
        const base64Data = this.currentImageData.replace(/^data:image\/\w+;base64,/, '');
        const bytes = (base64Data.length * 3) / 4;
        
        if (bytes < 1024) {
            return `${bytes.toFixed(0)} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
    }

    handleDownload() {
        if (!this.currentImageData) return;
        
        const selectedFormat = this.formatSelect.value;
        
        if (selectedFormat === 'original') {
            this.downloadImage(this.currentImageData, this.originalFormat);
        } else {
            this.convertAndDownload(selectedFormat);
        }
    }

    convertAndDownload(targetFormat) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            // Draw image on canvas
            ctx.drawImage(img, 0, 0);
            
            // Convert to target format
            const mimeType = this.getMimeType(targetFormat);
            const quality = targetFormat === 'jpeg' ? 0.9 : undefined;
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    this.downloadBlob(url, `converted-image.${targetFormat}`);
                    URL.revokeObjectURL(url);
                } else {
                    this.showError(`Failed to convert to ${targetFormat.toUpperCase()} format.`);
                }
            }, mimeType, quality);
        };
        
        img.src = this.currentImageData;
    }

    downloadImage(dataUrl, format) {
        const filename = `image.${format}`;
        
        // Convert data URL to blob for download
        fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                this.downloadBlob(url, filename);
                URL.revokeObjectURL(url);
            })
            .catch(error => {
                this.showError('Failed to download image.');
                console.error('Download error:', error);
            });
    }

    downloadBlob(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    getMimeType(format) {
        const mimeTypes = {
            'png': 'image/png',
            'jpeg': 'image/jpeg',
            'jpg': 'image/jpeg',
            'webp': 'image/webp',
            'gif': 'image/gif'
        };
        return mimeTypes[format] || 'image/png';
    }

    showError(message) {
        this.inputError.textContent = message;
        this.inputError.classList.add('show');
    }

    hideError() {
        this.inputError.classList.remove('show');
    }
}

// Initialize tool when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Base64ToImageTool();
});
