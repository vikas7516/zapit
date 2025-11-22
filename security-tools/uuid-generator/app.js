class UUIDGenerator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.generatedUUIDs = [];
    }

    initializeElements() {
        this.generateBtn = document.getElementById('generateBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.uuidCount = document.getElementById('uuidCount');
        this.outputFormat = document.getElementById('outputFormat');
        this.uuidResults = document.getElementById('uuidResults');
        this.resultsPlaceholder = document.getElementById('resultsPlaceholder');
        this.resultsInfo = document.getElementById('resultsInfo');
        this.copyAllBtn = document.getElementById('copyAllBtn');
        this.copyListBtn = document.getElementById('copyListBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.validateInput = document.getElementById('validateInput');
        this.validateBtn = document.getElementById('validateBtn');
        this.validationResult = document.getElementById('validationResult');
    }

    attachEventListeners() {
        this.generateBtn.addEventListener('click', () => this.generateUUIDs());
        this.regenerateBtn.addEventListener('click', () => this.generateUUIDs());
        this.clearBtn.addEventListener('click', () => this.clearResults());
        this.copyAllBtn.addEventListener('click', () => this.copyAllUUIDs());
        this.copyListBtn.addEventListener('click', () => this.copyAsList());
        this.downloadBtn.addEventListener('click', () => this.downloadUUIDs());
        this.validateBtn.addEventListener('click', () => this.validateUUID());
        this.validateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.validateUUID();
        });
        
        // Auto-validate as user types
        this.validateInput.addEventListener('input', () => {
            const value = this.validateInput.value.trim();
            if (value) {
                this.validateUUID();
            } else {
                this.validationResult.innerHTML = '';
            }
        });
    }

    setCount(count) {
        this.uuidCount.value = count;
        this.showToast(`Set count to ${count}`);
    }

    generateUUIDs() {
        const count = parseInt(this.uuidCount.value) || 1;
        const version = document.querySelector('input[name="uuidVersion"]:checked').value;
        
        if (count < 1 || count > 1000) {
            this.showToast('Please enter a number between 1 and 1000', 'error');
            return;
        }

        try {
            this.generatedUUIDs = [];
            
            for (let i = 0; i < count; i++) {
                let uuid;
                switch (version) {
                    case 'v1':
                        uuid = this.generateUUIDv1();
                        break;
                    case 'v4':
                        uuid = this.generateUUIDv4();
                        break;
                    case 'nil':
                        uuid = '00000000-0000-0000-0000-000000000000';
                        break;
                    default:
                        uuid = this.generateUUIDv4();
                }
                this.generatedUUIDs.push(uuid);
            }
            
            this.displayResults();
            this.showToast(`Generated ${count} UUID${count > 1 ? 's' : ''} successfully`);
            
        } catch (error) {
            this.showToast('Error generating UUIDs: ' + error.message, 'error');
            console.error('UUID generation error:', error);
        }
    }

    generateUUIDv4() {
        // Use crypto.getRandomValues for cryptographically strong random numbers
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        
        // Set version (4) and variant bits according to RFC 4122
        array[6] = (array[6] & 0x0f) | 0x40; // Version 4
        array[8] = (array[8] & 0x3f) | 0x80; // Variant 10
        
        // Convert to hex string with hyphens
        const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        return [
            hex.substring(0, 8),
            hex.substring(8, 12),
            hex.substring(12, 16),
            hex.substring(16, 20),
            hex.substring(20, 32)
        ].join('-');
    }

    generateUUIDv1() {
        // This is a simplified UUID v1 implementation
        // In a real implementation, you'd use MAC address and more precise timestamp
        const now = Date.now();
        const timeLow = (now & 0xffffffff).toString(16).padStart(8, '0');
        const timeMid = ((now >> 32) & 0xffff).toString(16).padStart(4, '0');
        const timeHiAndVersion = (0x1000 | ((now >> 48) & 0x0fff)).toString(16).padStart(4, '0');
        
        // Generate random clock sequence and node
        const clockSeq = Math.floor(Math.random() * 0x3fff) | 0x8000;
        const node = Array.from({length: 6}, () => 
            Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        ).join('');
        
        return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq.toString(16).padStart(4, '0')}-${node}`;
    }

    displayResults() {
        const format = this.outputFormat.value;
        
        // Hide placeholder, show results
        this.resultsPlaceholder.classList.add('hidden');
        this.uuidResults.classList.remove('hidden');
        
        // Format UUIDs according to selected format
        const formattedUUIDs = this.generatedUUIDs.map(uuid => this.formatUUID(uuid, format));
        
        // Create result items
        const resultItems = formattedUUIDs.map((uuid, index) => `
            <div class="uuid-result-item">
                <div class="uuid-value" title="Click to copy">${uuid}</div>
                <div class="uuid-actions">
                    <button onclick="uuidGenerator.copyUUID('${uuid}', ${index})" class="btn btn-outline btn-xs">📋</button>
                    <button onclick="uuidGenerator.showUUIDInfo('${this.generatedUUIDs[index]}')" class="btn btn-outline btn-xs">ℹ️</button>
                </div>
            </div>
        `).join('');
        
        this.uuidResults.innerHTML = resultItems;
        
        // Update results info
        this.updateResultsInfo();
        
        // Enable action buttons
        this.copyAllBtn.disabled = false;
        this.copyListBtn.disabled = false;
        this.downloadBtn.disabled = false;
        
        // Add click-to-copy functionality
        this.addClickToCopy();
    }

    formatUUID(uuid, format) {
        switch (format) {
            case 'simple':
                return uuid.replace(/-/g, '');
            case 'uppercase':
                return uuid.toUpperCase();
            case 'braces':
                return `{${uuid}}`;
            case 'urn':
                return `urn:uuid:${uuid}`;
            case 'standard':
            default:
                return uuid;
        }
    }

    addClickToCopy() {
        const uuidValues = document.querySelectorAll('.uuid-value');
        uuidValues.forEach((element, index) => {
            element.addEventListener('click', () => {
                const uuid = element.textContent;
                this.copyToClipboard(uuid, `UUID ${index + 1} copied to clipboard`);
                element.classList.add('copied');
                setTimeout(() => element.classList.remove('copied'), 1000);
            });
        });
    }

    updateResultsInfo() {
        const count = this.generatedUUIDs.length;
        const version = document.querySelector('input[name="uuidVersion"]:checked').value;
        const format = this.outputFormat.value;
        
        let versionName;
        switch (version) {
            case 'v1': versionName = 'Time-based (v1)'; break;
            case 'v4': versionName = 'Random (v4)'; break;
            case 'nil': versionName = 'NIL'; break;
            default: versionName = 'Unknown';
        }
        
        const formatName = format.charAt(0).toUpperCase() + format.slice(1);
        
        this.resultsInfo.innerHTML = `
            <div class="results-summary">
                <span class="summary-item"><strong>${count}</strong> UUID${count > 1 ? 's' : ''}</span>
                <span class="summary-item"><strong>${versionName}</strong></span>
                <span class="summary-item"><strong>${formatName}</strong> format</span>
            </div>
        `;
    }

    copyUUID(uuid, index) {
        this.copyToClipboard(uuid, `UUID ${index + 1} copied to clipboard`);
    }

    showUUIDInfo(uuid) {
        const info = this.analyzeUUID(uuid);
        let message = `UUID Analysis:\n\n`;
        message += `Format: ${info.format}\n`;
        message += `Version: ${info.version}\n`;
        message += `Variant: ${info.variant}\n`;
        
        if (info.version === '1') {
            message += `\nTime-based UUID:\n`;
            message += `- Contains timestamp information\n`;
            message += `- May contain MAC address\n`;
        } else if (info.version === '4') {
            message += `\nRandom UUID:\n`;
            message += `- 122 bits of randomness\n`;
            message += `- Cryptographically secure\n`;
        }
        
        alert(message);
    }

    analyzeUUID(uuid) {
        const cleanUUID = uuid.replace(/[^0-9a-fA-F]/g, '');
        
        if (cleanUUID.length !== 32) {
            return { format: 'Invalid', version: 'Unknown', variant: 'Unknown' };
        }
        
        const version = cleanUUID.charAt(12);
        const variant = parseInt(cleanUUID.charAt(16), 16);
        
        let variantType = 'Unknown';
        if ((variant & 0x8) === 0) variantType = 'NCS backward compatibility';
        else if ((variant & 0xC) === 0x8) variantType = 'RFC 4122';
        else if ((variant & 0xE) === 0xC) variantType = 'Microsoft GUID';
        else if ((variant & 0xE) === 0xE) variantType = 'Future use';
        
        return {
            format: 'Valid',
            version: version,
            variant: variantType
        };
    }

    copyAllUUIDs() {
        const format = this.outputFormat.value;
        const formattedUUIDs = this.generatedUUIDs.map(uuid => this.formatUUID(uuid, format));
        const text = formattedUUIDs.join('\n');
        this.copyToClipboard(text, `${formattedUUIDs.length} UUIDs copied to clipboard`);
    }

    copyAsList() {
        const format = this.outputFormat.value;
        const formattedUUIDs = this.generatedUUIDs.map(uuid => this.formatUUID(uuid, format));
        const text = formattedUUIDs.map((uuid, index) => `${index + 1}. ${uuid}`).join('\n');
        this.copyToClipboard(text, 'UUID list copied to clipboard');
    }

    downloadUUIDs() {
        const format = this.outputFormat.value;
        const formattedUUIDs = this.generatedUUIDs.map(uuid => this.formatUUID(uuid, format));
        const text = formattedUUIDs.join('\n');
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `uuids-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('UUIDs downloaded successfully');
    }

    validateUUID() {
        const input = this.validateInput.value.trim();
        
        if (!input) {
            this.validationResult.innerHTML = '';
            return;
        }
        
        const isValid = this.isValidUUID(input);
        const analysis = this.analyzeUUID(input);
        
        if (isValid) {
            this.validationResult.innerHTML = `
                <div class="validation-success">
                    <div class="validation-icon">✅</div>
                    <div class="validation-details">
                        <div class="validation-status">Valid UUID</div>
                        <div class="validation-info">
                            <span>Version: ${analysis.version}</span>
                            <span>Variant: ${analysis.variant}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            this.validationResult.innerHTML = `
                <div class="validation-error">
                    <div class="validation-icon">❌</div>
                    <div class="validation-details">
                        <div class="validation-status">Invalid UUID</div>
                        <div class="validation-info">
                            <span>Please check the format and try again</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const simpleRegex = /^[0-9a-f]{32}$/i;
        const bracesRegex = /^\{[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\}$/i;
        const urnRegex = /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        return uuidRegex.test(uuid) || simpleRegex.test(uuid) || bracesRegex.test(uuid) || urnRegex.test(uuid) ||
               uuid === '00000000-0000-0000-0000-000000000000'; // NIL UUID
    }

    clearResults() {
        this.generatedUUIDs = [];
        this.uuidResults.classList.add('hidden');
        this.resultsPlaceholder.classList.remove('hidden');
        this.resultsInfo.innerHTML = '';
        this.copyAllBtn.disabled = true;
        this.copyListBtn.disabled = true;
        this.downloadBtn.disabled = true;
        this.validateInput.value = '';
        this.validationResult.innerHTML = '';
        this.showToast('Results cleared');
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

// Initialize the UUID generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.uuidGenerator = new UUIDGenerator();
});

// Make functions available globally for inline onclick handlers
window.uuidGenerator = null;