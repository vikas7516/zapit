// Color Picker & Palette Tool - JavaScript functionality

class ColorPickerTool {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.originalImage = null;
        this.imageData = null;
        this.pickedColors = [];
        this.autoPalette = [];
        this.isZoomed = false;
        
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
        this.mainContent = document.getElementById('mainContent');
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.crosshair = document.getElementById('crosshair');
        this.colorPreview = document.getElementById('colorPreview');
        
        // Current color elements
        this.currentSwatch = document.getElementById('currentSwatch');
        this.hexValue = document.getElementById('hexValue');
        this.rgbValue = document.getElementById('rgbValue');
        this.hslValue = document.getElementById('hslValue');
        
        // Control buttons
        this.resetBtn = document.getElementById('resetBtn');
        this.zoomBtn = document.getElementById('zoomBtn');
        this.generatePaletteBtn = document.getElementById('generatePaletteBtn');
        this.clearPickedBtn = document.getElementById('clearPickedBtn');
        this.exportPaletteBtn = document.getElementById('exportPaletteBtn');
        this.exportFormat = document.getElementById('exportFormat');
        
        // Containers
        this.autoPaletteContainer = document.getElementById('autoPalette');
        this.pickedColorsContainer = document.getElementById('pickedColors');
        
        // Copy buttons
        this.copyBtns = document.querySelectorAll('.copy-btn');
    }

    setupEventListeners() {
        // File upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Canvas interactions
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

        // Control buttons
        this.resetBtn.addEventListener('click', this.resetImage.bind(this));
        this.zoomBtn.addEventListener('click', this.toggleZoom.bind(this));
        this.generatePaletteBtn.addEventListener('click', this.generateAutoPalette.bind(this));
        this.clearPickedBtn.addEventListener('click', this.clearPickedColors.bind(this));
        this.exportPaletteBtn.addEventListener('click', this.exportPalette.bind(this));

        // Copy buttons
        this.copyBtns.forEach(btn => {
            btn.addEventListener('click', this.handleCopyColor.bind(this));
        });
    }

    setupThemeToggle() {
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
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            this.showError('File size must be less than 10MB.');
            return;
        }

        this.hideError();

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.loadImageToCanvas();
                this.showMainContent();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    loadImageToCanvas() {
        if (!this.originalImage) return;

        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = this.originalImage;
        
        // Scale down if necessary
        if (width > maxWidth || height > maxHeight) {
            const scale = Math.min(maxWidth / width, maxHeight / height);
            width *= scale;
            height *= scale;
        }

        this.canvas.width = width;
        this.canvas.height = height;
        
        this.ctx.drawImage(this.originalImage, 0, 0, width, height);
        this.imageData = this.ctx.getImageData(0, 0, width, height);
    }

    showMainContent() {
        this.mainContent.classList.remove('hidden');
    }

    handleMouseMove(e) {
        if (!this.imageData) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (this.canvas.width / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (this.canvas.height / rect.height));

        if (x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height) {
            const color = this.getPixelColor(x, y);
            this.showColorPreview(e.clientX - rect.left, e.clientY - rect.top, color, x, y);
            this.showCrosshair(e.clientX - rect.left, e.clientY - rect.top);
        }
    }

    handleCanvasClick(e) {
        if (!this.imageData) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (this.canvas.width / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (this.canvas.height / rect.height));

        if (x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height) {
            const color = this.getPixelColor(x, y);
            this.setCurrentColor(color);
            this.addPickedColor(color);
        }
    }

    handleMouseLeave() {
        this.hideCrosshair();
        this.hideColorPreview();
    }

    getPixelColor(x, y) {
        const index = (y * this.canvas.width + x) * 4;
        const r = this.imageData.data[index];
        const g = this.imageData.data[index + 1];
        const b = this.imageData.data[index + 2];
        return { r, g, b };
    }

    showColorPreview(x, y, color, pixelX, pixelY) {
        this.colorPreview.style.display = 'block';
        this.colorPreview.style.left = `${Math.min(x + 20, this.canvas.parentElement.offsetWidth - 120)}px`;
        this.colorPreview.style.top = `${Math.max(y - 60, 10)}px`;
        
        const previewColor = this.colorPreview.querySelector('.preview-color');
        previewColor.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
        
        const previewCoords = this.colorPreview.querySelector('.preview-coords');
        previewCoords.textContent = `${pixelX}, ${pixelY}`;
    }

    hideColorPreview() {
        this.colorPreview.style.display = 'none';
    }

    showCrosshair(x, y) {
        this.crosshair.style.display = 'block';
        this.crosshair.style.left = `${x}px`;
        this.crosshair.style.top = `${y}px`;
    }

    hideCrosshair() {
        this.crosshair.style.display = 'none';
    }

    setCurrentColor(color) {
        const hex = this.rgbToHex(color.r, color.g, color.b);
        const rgb = `rgb(${color.r}, ${color.g}, ${color.b})`;
        const hsl = this.rgbToHsl(color.r, color.g, color.b);

        this.currentSwatch.style.backgroundColor = rgb;
        this.hexValue.value = hex;
        this.rgbValue.value = rgb;
        this.hslValue.value = hsl;
    }

    addPickedColor(color) {
        const hex = this.rgbToHex(color.r, color.g, color.b);
        
        // Avoid duplicates
        if (this.pickedColors.some(c => c.hex === hex)) return;
        
        this.pickedColors.push({ ...color, hex });
        this.updatePickedColorsDisplay();
    }

    updatePickedColorsDisplay() {
        if (this.pickedColors.length === 0) {
            this.pickedColorsContainer.innerHTML = '<div class="picked-placeholder">Click on the image to pick colors</div>';
            return;
        }

        const colorList = document.createElement('div');
        colorList.className = 'picked-color-list';

        this.pickedColors.forEach((color, index) => {
            const colorElement = document.createElement('div');
            colorElement.className = 'picked-color';
            colorElement.style.backgroundColor = color.hex;
            colorElement.title = color.hex;
            colorElement.addEventListener('click', () => {
                this.setCurrentColor(color);
            });
            colorList.appendChild(colorElement);
        });

        this.pickedColorsContainer.innerHTML = '';
        this.pickedColorsContainer.appendChild(colorList);
    }

    clearPickedColors() {
        this.pickedColors = [];
        this.updatePickedColorsDisplay();
    }

    generateAutoPalette() {
        if (!this.imageData) return;

        // Simple color quantization - sample colors and find dominant ones
        const colors = this.extractDominantColors(8);
        this.autoPalette = colors;
        this.updateAutoPaletteDisplay();
    }

    extractDominantColors(count) {
        const colorMap = new Map();
        const data = this.imageData.data;
        
        // Sample every 10th pixel to improve performance
        for (let i = 0; i < data.length; i += 40) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Quantize colors to reduce variance
            const quantizedR = Math.floor(r / 32) * 32;
            const quantizedG = Math.floor(g / 32) * 32;
            const quantizedB = Math.floor(b / 32) * 32;
            
            const key = `${quantizedR},${quantizedG},${quantizedB}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }
        
        // Sort by frequency and return top colors
        return Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([key]) => {
                const [r, g, b] = key.split(',').map(Number);
                return { r, g, b, hex: this.rgbToHex(r, g, b) };
            });
    }

    updateAutoPaletteDisplay() {
        if (this.autoPalette.length === 0) {
            this.autoPaletteContainer.innerHTML = '<div class="palette-placeholder">Generate a palette to see colors here</div>';
            return;
        }

        const paletteColors = document.createElement('div');
        paletteColors.className = 'palette-colors';

        this.autoPalette.forEach(color => {
            const colorElement = document.createElement('div');
            colorElement.className = 'palette-color';
            colorElement.style.backgroundColor = color.hex;
            colorElement.title = color.hex;
            colorElement.addEventListener('click', () => {
                this.setCurrentColor(color);
                this.addPickedColor(color);
            });
            paletteColors.appendChild(colorElement);
        });

        this.autoPaletteContainer.innerHTML = '';
        this.autoPaletteContainer.appendChild(paletteColors);
    }

    handleCopyColor(e) {
        const valueType = e.target.dataset.value;
        let textToCopy = '';
        
        switch (valueType) {
            case 'hex':
                textToCopy = this.hexValue.value;
                break;
            case 'rgb':
                textToCopy = this.rgbValue.value;
                break;
            case 'hsl':
                textToCopy = this.hslValue.value;
                break;
        }

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Visual feedback
                const originalText = e.target.textContent;
                e.target.textContent = '✓';
                setTimeout(() => {
                    e.target.textContent = originalText;
                }, 1000);
            });
        }
    }

    exportPalette() {
        const colors = this.pickedColors.length > 0 ? this.pickedColors : this.autoPalette;
        
        if (colors.length === 0) {
            alert('No colors to export. Pick some colors or generate a palette first.');
            return;
        }

        const format = this.exportFormat.value;
        let content = '';
        let filename = '';
        let mimeType = 'text/plain';

        switch (format) {
            case 'ase':
                // Adobe Swatch Exchange format is binary, simplified version
                content = this.generateASEContent(colors);
                filename = 'palette.ase';
                mimeType = 'application/octet-stream';
                break;
            case 'gpl':
                content = this.generateGPLContent(colors);
                filename = 'palette.gpl';
                break;
            case 'json':
                content = JSON.stringify(colors.map(c => ({ hex: c.hex, rgb: [c.r, c.g, c.b] })), null, 2);
                filename = 'palette.json';
                mimeType = 'application/json';
                break;
            case 'css':
                content = this.generateCSSContent(colors);
                filename = 'palette.css';
                mimeType = 'text/css';
                break;
        }

        this.downloadFile(content, filename, mimeType);
    }

    generateGPLContent(colors) {
        let content = 'GIMP Palette\n';
        content += 'Name: Extracted Palette\n';
        content += 'Columns: 8\n';
        content += '#\n';
        
        colors.forEach((color, index) => {
            content += `${color.r.toString().padStart(3)} ${color.g.toString().padStart(3)} ${color.b.toString().padStart(3)} Color ${index + 1}\n`;
        });
        
        return content;
    }

    generateCSSContent(colors) {
        let content = ':root {\n';
        colors.forEach((color, index) => {
            content += `  --color-${index + 1}: ${color.hex};\n`;
        });
        content += '}\n';
        return content;
    }

    generateASEContent(colors) {
        // Simplified ASE format - just return text for now
        return `Adobe Swatch Exchange Format (Simplified)\n${colors.map(c => c.hex).join('\n')}`;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    resetImage() {
        this.pickedColors = [];
        this.autoPalette = [];
        this.updatePickedColorsDisplay();
        this.updateAutoPaletteDisplay();
        
        // Clear current color
        this.currentSwatch.style.backgroundColor = '#f0f0f0';
        this.hexValue.value = '';
        this.rgbValue.value = '';
        this.hslValue.value = '';
    }

    toggleZoom() {
        // Simple zoom toggle
        this.isZoomed = !this.isZoomed;
        this.canvas.style.transform = this.isZoomed ? 'scale(1.5)' : 'scale(1)';
        this.canvas.style.transformOrigin = 'center';
        this.zoomBtn.textContent = this.isZoomed ? '🔍 Zoom Out' : '🔍 Zoom';
    }

    // Utility functions
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }

    showError(message) {
        this.uploadError.textContent = message;
        this.uploadError.classList.add('show');
    }

    hideError() {
        this.uploadError.classList.remove('show');
    }
}

// Initialize tool when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ColorPickerTool();
});
