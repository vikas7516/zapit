// Color Palette Generator JavaScript

class ColorPaletteGenerator {
    constructor() {
        this.currentPalette = [];
        this.selectedColor = null;
        this.savedPalettes = this.loadSavedPalettes();
        this.uploadedImage = null;
        
        this.initializeElements();
        this.bindEvents();
        this.updateColorCountDisplay();
        this.updateExtractCountDisplay();
        this.displaySavedPalettes();
    }

    initializeElements() {
        // Generation elements
        this.baseColor = document.getElementById('baseColor');
        this.baseColorHex = document.getElementById('baseColorHex');
        this.paletteType = document.getElementById('paletteType');
        this.colorCount = document.getElementById('colorCount');
        this.colorCountValue = document.getElementById('colorCountValue');
        this.generateBtn = document.getElementById('generatePalette');
        this.randomBtn = document.getElementById('randomPalette');
        
        // Image extraction elements
        this.imageUploadArea = document.getElementById('imageUploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.extractCount = document.getElementById('extractCount');
        this.extractCountValue = document.getElementById('extractCountValue');
        this.extractBtn = document.getElementById('extractColors');
        
        // Display elements
        this.paletteContainer = document.getElementById('paletteContainer');
        this.paletteDisplay = document.getElementById('paletteDisplay');
        this.colorInfoPanel = document.getElementById('colorInfoPanel');
        this.selectedColorPreview = document.getElementById('selectedColorPreview');
        
        // Color info elements
        this.colorHex = document.getElementById('colorHex');
        this.colorRgb = document.getElementById('colorRgb');
        this.colorHsl = document.getElementById('colorHsl');
        this.colorHsv = document.getElementById('colorHsv');
        
        // Action buttons
        this.copyPaletteCSSBtn = document.getElementById('copyPaletteCSS');
        this.copyPaletteJSONBtn = document.getElementById('copyPaletteJSON');
        this.exportPaletteBtn = document.getElementById('exportPalette');
        
        // Saved palettes
        this.savedPalettesGrid = document.getElementById('savedPalettesGrid');
        this.clearSavedBtn = document.getElementById('clearSavedPalettes');
    }

    bindEvents() {
        // Color input synchronization
        this.baseColor.addEventListener('input', (e) => {
            this.baseColorHex.value = e.target.value;
        });
        
        this.baseColorHex.addEventListener('input', (e) => {
            if (this.isValidHex(e.target.value)) {
                this.baseColor.value = e.target.value;
            }
        });
        
        // Random base color
        document.getElementById('randomBaseColor').addEventListener('click', () => {
            const randomColor = this.generateRandomColor();
            this.baseColor.value = randomColor;
            this.baseColorHex.value = randomColor;
        });
        
        // Range inputs
        this.colorCount.addEventListener('input', () => this.updateColorCountDisplay());
        this.extractCount.addEventListener('input', () => this.updateExtractCountDisplay());
        
        // Generation buttons
        this.generateBtn.addEventListener('click', () => this.generatePalette());
        this.randomBtn.addEventListener('click', () => this.generateRandomPalette());
        
        // Image upload
        this.imageUploadArea.addEventListener('click', () => this.imageInput.click());
        this.imageUploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.imageUploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.imageUploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.imageInput.addEventListener('change', this.handleImageUpload.bind(this));
        this.extractBtn.addEventListener('click', () => this.extractColorsFromImage());
        
        // Palette actions
        this.copyPaletteCSSBtn.addEventListener('click', () => this.copyPaletteAsCSS());
        this.copyPaletteJSONBtn.addEventListener('click', () => this.copyPaletteAsJSON());
        this.exportPaletteBtn.addEventListener('click', () => this.exportPalette());
        
        // Copy buttons for color values
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.copy;
                this.copyColorValue(type);
            });
        });
        
        // Saved palettes
        this.clearSavedBtn.addEventListener('click', () => this.clearSavedPalettes());
    }

    updateColorCountDisplay() {
        this.colorCountValue.textContent = this.colorCount.value;
    }

    updateExtractCountDisplay() {
        this.extractCountValue.textContent = this.extractCount.value;
    }

    isValidHex(hex) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    }

    generateRandomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }

    generatePalette() {
        const baseColor = this.baseColor.value;
        const type = this.paletteType.value;
        const count = parseInt(this.colorCount.value);
        
        this.currentPalette = this.createPalette(baseColor, type, count);
        this.displayPalette();
    }

    generateRandomPalette() {
        const randomBase = this.generateRandomColor();
        this.baseColor.value = randomBase;
        this.baseColorHex.value = randomBase;
        
        const types = ['monochromatic', 'analogous', 'complementary', 'triadic', 'tetradic', 'split-complementary'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        this.paletteType.value = randomType;
        
        this.generatePalette();
    }

    createPalette(baseColor, type, count) {
        const hsl = this.hexToHsl(baseColor);
        let colors = [];
        
        switch (type) {
            case 'monochromatic':
                colors = this.createMonochromaticPalette(hsl, count);
                break;
            case 'analogous':
                colors = this.createAnalogousPalette(hsl, count);
                break;
            case 'complementary':
                colors = this.createComplementaryPalette(hsl, count);
                break;
            case 'triadic':
                colors = this.createTriadicPalette(hsl, count);
                break;
            case 'tetradic':
                colors = this.createTetradicPalette(hsl, count);
                break;
            case 'split-complementary':
                colors = this.createSplitComplementaryPalette(hsl, count);
                break;
        }
        
        return colors.map(color => ({
            hex: this.hslToHex(color),
            hsl: color,
            rgb: this.hslToRgb(color),
            hsv: this.hslToHsv(color)
        }));
    }

    createMonochromaticPalette(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        
        for (let i = 0; i < count; i++) {
            const lightness = Math.max(10, Math.min(90, l + (i - count/2) * (60/count)));
            const saturation = Math.max(20, Math.min(100, s + (Math.random() - 0.5) * 20));
            colors.push([h, saturation, lightness]);
        }
        
        return colors;
    }

    createAnalogousPalette(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        
        for (let i = 0; i < count; i++) {
            const hue = (h + (i - count/2) * (60/count)) % 360;
            const lightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 30));
            const saturation = Math.max(30, Math.min(90, s + (Math.random() - 0.5) * 20));
            colors.push([hue < 0 ? hue + 360 : hue, saturation, lightness]);
        }
        
        return colors;
    }

    createComplementaryPalette(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        const complement = (h + 180) % 360;
        
        for (let i = 0; i < count; i++) {
            const useComplement = i % 2 === 1;
            const hue = useComplement ? complement : h;
            const lightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 40));
            const saturation = Math.max(30, Math.min(90, s + (Math.random() - 0.5) * 30));
            colors.push([hue, saturation, lightness]);
        }
        
        return colors;
    }

    createTriadicPalette(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        const hues = [h, (h + 120) % 360, (h + 240) % 360];
        
        for (let i = 0; i < count; i++) {
            const hue = hues[i % 3];
            const lightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 40));
            const saturation = Math.max(30, Math.min(90, s + (Math.random() - 0.5) * 30));
            colors.push([hue, saturation, lightness]);
        }
        
        return colors;
    }

    createTetradicPalette(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        const hues = [h, (h + 90) % 360, (h + 180) % 360, (h + 270) % 360];
        
        for (let i = 0; i < count; i++) {
            const hue = hues[i % 4];
            const lightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 40));
            const saturation = Math.max(30, Math.min(90, s + (Math.random() - 0.5) * 30));
            colors.push([hue, saturation, lightness]);
        }
        
        return colors;
    }

    createSplitComplementaryPalette(baseHsl, count) {
        const colors = [];
        const [h, s, l] = baseHsl;
        const hues = [h, (h + 150) % 360, (h + 210) % 360];
        
        for (let i = 0; i < count; i++) {
            const hue = hues[i % 3];
            const lightness = Math.max(20, Math.min(80, l + (Math.random() - 0.5) * 40));
            const saturation = Math.max(30, Math.min(90, s + (Math.random() - 0.5) * 30));
            colors.push([hue, saturation, lightness]);
        }
        
        return colors;
    }

    displayPalette() {
        this.paletteDisplay.innerHTML = '';
        
        this.currentPalette.forEach((color, index) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color.hex;
            swatch.innerHTML = `<div class="color-info">${color.hex}</div>`;
            
            swatch.addEventListener('click', () => this.selectColor(color, swatch));
            
            this.paletteDisplay.appendChild(swatch);
        });
        
        this.paletteContainer.classList.remove('hidden');
        
        // Add save palette button
        if (!document.getElementById('savePaletteBtn')) {
            const saveBtn = document.createElement('button');
            saveBtn.id = 'savePaletteBtn';
            saveBtn.className = 'btn btn-outline btn-sm';
            saveBtn.textContent = 'Save Palette';
            saveBtn.addEventListener('click', () => this.savePalette());
            document.querySelector('.palette-actions').appendChild(saveBtn);
        }
    }

    selectColor(color, swatchElement) {
        // Remove previous selection
        document.querySelectorAll('.color-swatch.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Add selection to current swatch
        swatchElement.classList.add('selected');
        
        this.selectedColor = color;
        this.displayColorInfo(color);
    }

    displayColorInfo(color) {
        this.selectedColorPreview.style.backgroundColor = color.hex;
        this.colorHex.value = color.hex;
        this.colorRgb.value = `rgb(${color.rgb.join(', ')})`;
        this.colorHsl.value = `hsl(${Math.round(color.hsl[0])}, ${Math.round(color.hsl[1])}%, ${Math.round(color.hsl[2])}%)`;
        this.colorHsv.value = `hsv(${Math.round(color.hsv[0])}, ${Math.round(color.hsv[1])}%, ${Math.round(color.hsv[2])}%)`;
        
        this.colorInfoPanel.classList.remove('hidden');
    }

    // Image handling
    handleDragOver(e) {
        e.preventDefault();
        this.imageUploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.imageUploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.imageUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.processImageFile(files[0]);
        }
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImageFile(file);
        }
    }

    processImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.uploadedImage = img;
                this.extractBtn.disabled = false;
                this.imageUploadArea.innerHTML = `
                    <div class="upload-content">
                        <div class="upload-icon">✅</div>
                        <p>Image loaded: ${file.name}</p>
                        <p class="upload-hint">Click "Extract Colors" to analyze</p>
                    </div>
                `;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    extractColorsFromImage() {
        if (!this.uploadedImage) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize image for faster processing
        const maxSize = 200;
        const ratio = Math.min(maxSize / this.uploadedImage.width, maxSize / this.uploadedImage.height);
        canvas.width = this.uploadedImage.width * ratio;
        canvas.height = this.uploadedImage.height * ratio;
        
        ctx.drawImage(this.uploadedImage, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const colors = this.extractDominantColors(imageData, parseInt(this.extractCount.value));
        
        this.currentPalette = colors.map(color => ({
            hex: color,
            hsl: this.hexToHsl(color),
            rgb: this.hexToRgb(color),
            hsv: this.hexToHsv(color)
        }));
        
        this.displayPalette();
    }

    extractDominantColors(imageData, count) {
        const data = imageData.data;
        const colorCounts = new Map();
        
        // Sample every 4th pixel for performance
        for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];
            
            // Skip transparent pixels
            if (alpha < 128) continue;
            
            // Quantize colors to reduce noise
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;
            
            const hex = this.rgbToHex([qr, qg, qb]);
            colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        }
        
        // Sort by frequency and return top colors
        return Array.from(colorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(entry => entry[0]);
    }

    // Color conversion utilities
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }

    rgbToHex(rgb) {
        return '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('');
    }

    hexToHsl(hex) {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHsl(rgb);
    }

    rgbToHsl([r, g, b]) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        const sum = max + min;
        const l = sum / 2;
        
        let h, s;
        
        if (diff === 0) {
            h = s = 0;
        } else {
            s = l > 0.5 ? diff / (2 - sum) : diff / sum;
            
            switch (max) {
                case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
                case g: h = (b - r) / diff + 2; break;
                case b: h = (r - g) / diff + 4; break;
            }
            h /= 6;
        }
        
        return [h * 360, s * 100, l * 100];
    }

    hslToRgb([h, s, l]) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        
        if (h < 1/6) [r, g, b] = [c, x, 0];
        else if (h < 2/6) [r, g, b] = [x, c, 0];
        else if (h < 3/6) [r, g, b] = [0, c, x];
        else if (h < 4/6) [r, g, b] = [0, x, c];
        else if (h < 5/6) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];
        
        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    }

    hslToHex(hsl) {
        const rgb = this.hslToRgb(hsl);
        return this.rgbToHex(rgb);
    }

    hexToHsv(hex) {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHsv(rgb);
    }

    rgbToHsv([r, g, b]) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        const v = max;
        const s = max === 0 ? 0 : diff / max;
        
        let h;
        if (diff === 0) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / diff + (g < b ? 6 : 0); break;
                case g: h = (b - r) / diff + 2; break;
                case b: h = (r - g) / diff + 4; break;
            }
            h /= 6;
        }
        
        return [h * 360, s * 100, v * 100];
    }

    hslToHsv([h, s, l]) {
        s /= 100;
        l /= 100;
        
        const v = l + s * Math.min(l, 1 - l);
        const sNew = v === 0 ? 0 : 2 * (1 - l / v);
        
        return [h, sNew * 100, v * 100];
    }

    // Export and copy functions
    copyPaletteAsCSS() {
        if (this.currentPalette.length === 0) return;
        
        let css = ':root {\n';
        this.currentPalette.forEach((color, index) => {
            css += `  --color-${index + 1}: ${color.hex};\n`;
        });
        css += '}';
        
        navigator.clipboard.writeText(css).then(() => {
            this.showToast('CSS copied to clipboard!');
        });
    }

    copyPaletteAsJSON() {
        if (this.currentPalette.length === 0) return;
        
        const json = JSON.stringify(this.currentPalette, null, 2);
        navigator.clipboard.writeText(json).then(() => {
            this.showToast('JSON copied to clipboard!');
        });
    }

    exportPalette() {
        if (this.currentPalette.length === 0) return;
        
        const data = {
            palette: this.currentPalette,
            type: this.paletteType.value,
            baseColor: this.baseColor.value,
            createdAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `color-palette-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    copyColorValue(type) {
        if (!this.selectedColor) return;
        
        let value;
        switch (type) {
            case 'hex': value = this.selectedColor.hex; break;
            case 'rgb': value = `rgb(${this.selectedColor.rgb.join(', ')})`; break;
            case 'hsl': value = `hsl(${Math.round(this.selectedColor.hsl[0])}, ${Math.round(this.selectedColor.hsl[1])}%, ${Math.round(this.selectedColor.hsl[2])}%)`; break;
            case 'hsv': value = `hsv(${Math.round(this.selectedColor.hsv[0])}, ${Math.round(this.selectedColor.hsv[1])}%, ${Math.round(this.selectedColor.hsv[2])}%)`; break;
        }
        
        navigator.clipboard.writeText(value).then(() => {
            this.showToast(`${type.toUpperCase()} value copied!`);
        });
    }

    // Saved palettes functionality
    savePalette() {
        if (this.currentPalette.length === 0) return;
        
        const palette = {
            id: Date.now(),
            colors: this.currentPalette.map(c => c.hex),
            type: this.paletteType.value,
            createdAt: new Date().toISOString()
        };
        
        this.savedPalettes.push(palette);
        this.savePalettesToStorage();
        this.displaySavedPalettes();
        this.showToast('Palette saved!');
    }

    loadSavedPalettes() {
        const saved = localStorage.getItem('colorPalettes');
        return saved ? JSON.parse(saved) : [];
    }

    savePalettesToStorage() {
        localStorage.setItem('colorPalettes', JSON.stringify(this.savedPalettes));
    }

    displaySavedPalettes() {
        if (this.savedPalettes.length === 0) {
            this.savedPalettesGrid.innerHTML = '<div class="empty-state"><p>No saved palettes yet. Generate a palette and save it!</p></div>';
            return;
        }
        
        this.savedPalettesGrid.innerHTML = '';
        
        this.savedPalettes.forEach(palette => {
            const paletteEl = document.createElement('div');
            paletteEl.className = 'saved-palette';
            
            const preview = palette.colors.map(color => 
                `<div class="saved-palette-color" style="background-color: ${color}"></div>`
            ).join('');
            
            paletteEl.innerHTML = `
                <div class="saved-palette-preview">${preview}</div>
                <div class="saved-palette-info">
                    <span>${palette.type}</span>
                    <div class="saved-palette-actions">
                        <button onclick="colorPalette.loadSavedPalette(${palette.id})" title="Load palette">📂</button>
                        <button onclick="colorPalette.deleteSavedPalette(${palette.id})" title="Delete palette">🗑️</button>
                    </div>
                </div>
            `;
            
            this.savedPalettesGrid.appendChild(paletteEl);
        });
    }

    loadSavedPalette(id) {
        const palette = this.savedPalettes.find(p => p.id === id);
        if (!palette) return;
        
        this.currentPalette = palette.colors.map(hex => ({
            hex: hex,
            hsl: this.hexToHsl(hex),
            rgb: this.hexToRgb(hex),
            hsv: this.hexToHsv(hex)
        }));
        
        this.paletteType.value = palette.type;
        this.displayPalette();
        this.showToast('Palette loaded!');
    }

    deleteSavedPalette(id) {
        this.savedPalettes = this.savedPalettes.filter(p => p.id !== id);
        this.savePalettesToStorage();
        this.displaySavedPalettes();
        this.showToast('Palette deleted!');
    }

    clearSavedPalettes() {
        if (confirm('Are you sure you want to clear all saved palettes?')) {
            this.savedPalettes = [];
            this.savePalettesToStorage();
            this.displaySavedPalettes();
            this.showToast('All palettes cleared!');
        }
    }

    showToast(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3b82f6;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Global reference for saved palette actions
let colorPalette;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    colorPalette = new ColorPaletteGenerator();
});
