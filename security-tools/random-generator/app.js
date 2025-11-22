class RandomGenerator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.currentType = 'numbers';
        this.generatedResults = [];
        this.totalGenerated = 0;
    }

    initializeElements() {
        // Type selection
        this.typeCards = document.querySelectorAll('.type-card');
        this.typeRadios = document.querySelectorAll('input[name="generatorType"]');
        
        // Settings sections
        this.settingsSections = {
            numbers: document.getElementById('numbersSettings'),
            strings: document.getElementById('stringsSettings'),
            bytes: document.getElementById('bytesSettings'),
            tokens: document.getElementById('tokensSettings'),
            colors: document.getElementById('colorsSettings'),
            coordinates: document.getElementById('coordinatesSettings')
        };
        
        // Controls
        this.generateBtn = document.getElementById('generateBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.generationStatus = document.getElementById('generationStatus');
        
        // Results
        this.resultsPlaceholder = document.getElementById('resultsPlaceholder');
        this.randomResults = document.getElementById('randomResults');
        this.resultsInfo = document.getElementById('resultsInfo');
        this.copyAllBtn = document.getElementById('copyAllBtn');
        this.copyListBtn = document.getElementById('copyListBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // Statistics
        this.totalGeneratedStat = document.getElementById('totalGenerated');
        this.entropyBitsStat = document.getElementById('entropyBits');
        this.generationTypeStat = document.getElementById('generationType');
        this.lastGeneratedStat = document.getElementById('lastGenerated');
    }

    attachEventListeners() {
        // Type selection
        this.typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.switchType(e.target.value));
        });
        
        this.typeCards.forEach(card => {
            card.addEventListener('click', () => {
                const type = card.dataset.type;
                document.querySelector(`input[value="${type}"]`).checked = true;
                this.switchType(type);
            });
        });
        
        // Controls
        this.generateBtn.addEventListener('click', () => this.generateValues());
        this.regenerateBtn.addEventListener('click', () => this.generateValues());
        this.clearBtn.addEventListener('click', () => this.clearResults());
        
        // Results actions
        this.copyAllBtn.addEventListener('click', () => this.copyAllResults());
        this.copyListBtn.addEventListener('click', () => this.copyAsList());
        this.downloadBtn.addEventListener('click', () => this.downloadResults());
        
        // Initialize with first type
        this.switchType('numbers');
        this.updateStatistics();
    }

    switchType(type) {
        this.currentType = type;
        
        // Update type cards
        this.typeCards.forEach(card => {
            card.classList.toggle('active', card.dataset.type === type);
        });
        
        // Show/hide settings sections
        Object.keys(this.settingsSections).forEach(sectionType => {
            const section = this.settingsSections[sectionType];
            if (section) {
                if (sectionType === type) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            }
        });
        
        // Clear previous results
        this.clearResults();
        this.updateStatistics();
    }

    generateValues() {
        try {
            let results = [];
            
            switch (this.currentType) {
                case 'numbers':
                    results = this.generateNumbers();
                    break;
                case 'strings':
                    results = this.generateStrings();
                    break;
                case 'bytes':
                    results = this.generateBytes();
                    break;
                case 'tokens':
                    results = this.generateTokens();
                    break;
                case 'colors':
                    results = this.generateColors();
                    break;
                case 'coordinates':
                    results = this.generateCoordinates();
                    break;
            }
            
            this.generatedResults = results;
            this.totalGenerated += results.length;
            this.displayResults();
            this.updateStatistics();
            this.showStatus(`Generated ${results.length} ${this.currentType} successfully`, 'success');
            
        } catch (error) {
            this.showStatus('Error generating values: ' + error.message, 'error');
            console.error('Generation error:', error);
        }
    }

    generateNumbers() {
        const type = document.getElementById('numberType').value;
        const min = parseFloat(document.getElementById('numberMin').value);
        const max = parseFloat(document.getElementById('numberMax').value);
        const count = parseInt(document.getElementById('numberCount').value);
        
        if (min >= max) {
            throw new Error('Minimum value must be less than maximum value');
        }
        
        const results = [];
        const range = max - min;
        
        for (let i = 0; i < count; i++) {
            // Use crypto.getRandomValues for secure random generation
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            const randomFloat = array[0] / (0xFFFFFFFF + 1);
            
            let value;
            if (type === 'integer') {
                value = Math.floor(min + randomFloat * (max - min + 1));
            } else {
                value = min + randomFloat * range;
                value = Math.round(value * 1000000) / 1000000; // 6 decimal places
            }
            
            results.push({
                value: value,
                display: type === 'integer' ? value.toString() : value.toFixed(6)
            });
        }
        
        return results;
    }

    generateStrings() {
        const length = parseInt(document.getElementById('stringLength').value);
        const count = parseInt(document.getElementById('stringCount').value);
        
        // Build character set
        let charset = '';
        if (document.getElementById('includeUppercase').checked) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (document.getElementById('includeLowercase').checked) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (document.getElementById('includeNumbers').checked) charset += '0123456789';
        if (document.getElementById('includeSymbols').checked) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        const customCharset = document.getElementById('customCharset').value;
        if (customCharset) charset = customCharset;
        
        if (!charset) {
            throw new Error('Please select at least one character set or provide custom characters');
        }
        
        const results = [];
        
        for (let i = 0; i < count; i++) {
            let randomString = '';
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            
            for (let j = 0; j < length; j++) {
                randomString += charset[array[j] % charset.length];
            }
            
            results.push({
                value: randomString,
                display: randomString
            });
        }
        
        return results;
    }

    generateBytes() {
        const length = parseInt(document.getElementById('bytesLength').value);
        const format = document.getElementById('bytesFormat').value;
        const count = parseInt(document.getElementById('bytesCount').value);
        
        const results = [];
        
        for (let i = 0; i < count; i++) {
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            
            let display;
            switch (format) {
                case 'hex':
                    display = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
                    break;
                case 'base64':
                    display = btoa(String.fromCharCode.apply(null, array));
                    break;
                case 'binary':
                    display = Array.from(array, byte => byte.toString(2).padStart(8, '0')).join(' ');
                    break;
            }
            
            results.push({
                value: array,
                display: display
            });
        }
        
        return results;
    }

    generateTokens() {
        const type = document.getElementById('tokenType').value;
        const length = parseInt(document.getElementById('tokenLength').value);
        const count = parseInt(document.getElementById('tokenCount').value);
        const prefix = document.getElementById('tokenPrefix').value;
        
        const results = [];
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        
        for (let i = 0; i < count; i++) {
            let token = '';
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            
            for (let j = 0; j < length; j++) {
                token += charset[array[j] % charset.length];
            }
            
            // Add type-specific prefixes if no custom prefix
            let finalToken = token;
            if (prefix) {
                finalToken = prefix + token;
            } else {
                switch (type) {
                    case 'api-key':
                        finalToken = 'ak_' + token;
                        break;
                    case 'bearer':
                        finalToken = 'Bearer ' + token;
                        break;
                    case 'session':
                        finalToken = 'sess_' + token;
                        break;
                    case 'csrf':
                        finalToken = 'csrf_' + token;
                        break;
                }
            }
            
            results.push({
                value: finalToken,
                display: finalToken
            });
        }
        
        return results;
    }

    generateColors() {
        const format = document.getElementById('colorFormat').value;
        const count = parseInt(document.getElementById('colorCount').value);
        
        const results = [];
        
        for (let i = 0; i < count; i++) {
            const array = new Uint8Array(4);
            crypto.getRandomValues(array);
            
            const r = array[0];
            const g = array[1];
            const b = array[2];
            const a = array[3] / 255;
            
            let display;
            switch (format) {
                case 'hex':
                    display = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                    break;
                case 'rgb':
                    display = `rgb(${r}, ${g}, ${b})`;
                    break;
                case 'rgba':
                    display = `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
                    break;
                case 'hsl':
                    const hsl = this.rgbToHsl(r, g, b);
                    display = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
                    break;
            }
            
            results.push({
                value: { r, g, b, a },
                display: display,
                color: `rgb(${r}, ${g}, ${b})`
            });
        }
        
        return results;
    }

    generateCoordinates() {
        const format = document.getElementById('coordFormat').value;
        const precision = parseInt(document.getElementById('coordPrecision').value);
        const count = parseInt(document.getElementById('coordCount').value);
        
        const results = [];
        
        for (let i = 0; i < count; i++) {
            const array = new Uint32Array(2);
            crypto.getRandomValues(array);
            
            // Generate latitude (-90 to +90)
            const latFloat = array[0] / 0xFFFFFFFF;
            const lat = -90 + latFloat * 180;
            
            // Generate longitude (-180 to +180)
            const lngFloat = array[1] / 0xFFFFFFFF;
            const lng = -180 + lngFloat * 360;
            
            let display;
            if (format === 'decimal') {
                display = `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
            } else {
                const latDMS = this.decimalToDMS(lat, 'lat');
                const lngDMS = this.decimalToDMS(lng, 'lng');
                display = `${latDMS}, ${lngDMS}`;
            }
            
            results.push({
                value: { lat, lng },
                display: display
            });
        }
        
        return results;
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
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    decimalToDMS(decimal, type) {
        const absolute = Math.abs(decimal);
        const degrees = Math.floor(absolute);
        const minutes = Math.floor((absolute - degrees) * 60);
        const seconds = ((absolute - degrees - minutes / 60) * 3600).toFixed(2);
        
        const direction = type === 'lat' 
            ? (decimal >= 0 ? 'N' : 'S')
            : (decimal >= 0 ? 'E' : 'W');
        
        return `${degrees}°${minutes}'${seconds}"${direction}`;
    }

    displayResults() {
        // Hide placeholder, show results
        this.resultsPlaceholder.classList.add('hidden');
        this.randomResults.classList.remove('hidden');
        
        // Create result items
        const resultItems = this.generatedResults.map((result, index) => {
            let extraClass = '';
            let extraContent = '';
            
            if (this.currentType === 'colors') {
                extraClass = 'color-result';
                extraContent = `<div class="color-preview" style="background-color: ${result.color};"></div>`;
            }
            
            return `
                <div class="result-item ${extraClass}">
                    ${extraContent}
                    <div class="result-value" title="Click to copy">${result.display}</div>
                    <div class="result-actions">
                        <button onclick="randomGenerator.copyResult('${result.display}', ${index})" class="btn btn-outline btn-xs">📋</button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.randomResults.innerHTML = resultItems;
        
        // Update results info
        this.updateResultsInfo();
        
        // Enable action buttons
        this.copyAllBtn.disabled = false;
        this.copyListBtn.disabled = false;
        this.downloadBtn.disabled = false;
        
        // Add click-to-copy functionality
        this.addClickToCopy();
    }

    addClickToCopy() {
        const resultValues = document.querySelectorAll('.result-value');
        resultValues.forEach((element, index) => {
            element.addEventListener('click', () => {
                const text = element.textContent;
                this.copyToClipboard(text, `Result ${index + 1} copied to clipboard`);
                element.classList.add('copied');
                setTimeout(() => element.classList.remove('copied'), 1000);
            });
        });
    }

    updateResultsInfo() {
        const count = this.generatedResults.length;
        this.resultsInfo.innerHTML = `
            <div class="results-summary">
                <span class="summary-item"><strong>${count}</strong> ${this.currentType}</span>
                <span class="summary-item">Generated at <strong>${new Date().toLocaleTimeString()}</strong></span>
            </div>
        `;
    }

    updateStatistics() {
        this.totalGeneratedStat.textContent = this.totalGenerated;
        this.generationTypeStat.textContent = this.currentType.charAt(0).toUpperCase() + this.currentType.slice(1);
        this.lastGeneratedStat.textContent = this.generatedResults.length > 0 
            ? new Date().toLocaleTimeString() 
            : '-';
        
        // Calculate entropy (simplified)
        let entropyBits = 0;
        if (this.generatedResults.length > 0) {
            switch (this.currentType) {
                case 'numbers':
                    const min = parseFloat(document.getElementById('numberMin').value);
                    const max = parseFloat(document.getElementById('numberMax').value);
                    entropyBits = Math.log2(max - min + 1);
                    break;
                case 'strings':
                    const length = parseInt(document.getElementById('stringLength').value);
                    let charsetSize = 0;
                    if (document.getElementById('includeUppercase').checked) charsetSize += 26;
                    if (document.getElementById('includeLowercase').checked) charsetSize += 26;
                    if (document.getElementById('includeNumbers').checked) charsetSize += 10;
                    if (document.getElementById('includeSymbols').checked) charsetSize += 25;
                    entropyBits = length * Math.log2(charsetSize);
                    break;
                case 'bytes':
                    const bytesLength = parseInt(document.getElementById('bytesLength').value);
                    entropyBits = bytesLength * 8;
                    break;
                default:
                    entropyBits = 128; // Default estimate
            }
        }
        
        this.entropyBitsStat.textContent = Math.round(entropyBits);
    }

    copyResult(text, index) {
        this.copyToClipboard(text, `Result ${index + 1} copied to clipboard`);
    }

    copyAllResults() {
        const text = this.generatedResults.map(result => result.display).join('\n');
        this.copyToClipboard(text, `${this.generatedResults.length} results copied to clipboard`);
    }

    copyAsList() {
        const text = this.generatedResults.map((result, index) => `${index + 1}. ${result.display}`).join('\n');
        this.copyToClipboard(text, 'Results copied as numbered list');
    }

    downloadResults() {
        const text = this.generatedResults.map(result => result.display).join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `random-${this.currentType}-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Results downloaded successfully');
    }

    clearResults() {
        this.generatedResults = [];
        this.randomResults.classList.add('hidden');
        this.resultsPlaceholder.classList.remove('hidden');
        this.resultsInfo.innerHTML = '';
        this.copyAllBtn.disabled = true;
        this.copyListBtn.disabled = true;
        this.downloadBtn.disabled = true;
        this.generationStatus.innerHTML = '';
        this.showToast('Results cleared');
    }

    showStatus(message, type) {
        this.generationStatus.innerHTML = `
            <div class="status-message ${type}">
                <span class="status-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="status-text">${message}</span>
            </div>
        `;
        
        // Clear after 5 seconds
        setTimeout(() => {
            this.generationStatus.innerHTML = '';
        }, 5000);
    }

    async copyToClipboard(text, successMessage) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(successMessage);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showToast(successMessage);
            } catch (fallbackErr) {
                this.showToast('Failed to copy to clipboard', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    showToast(message, type = 'success') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add to document
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Initialize the random generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.randomGenerator = new RandomGenerator();
});

// Make functions available globally for inline onclick handlers
window.randomGenerator = null;