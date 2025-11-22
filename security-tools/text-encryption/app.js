class TextEncryption {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.currentMode = 'encrypt';
        this.keyVisible = false;
    }

    initializeElements() {
        // Mode elements
        this.modeToggles = document.querySelectorAll('.mode-toggle');
        this.modeRadios = document.querySelectorAll('input[name="mode"]');
        
        // Settings elements
        this.algorithmSelect = document.getElementById('algorithm');
        this.modeSelect = document.getElementById('mode');
        this.keySizeSelect = document.getElementById('keySize');
        this.paddingSelect = document.getElementById('padding');
        
        // Key elements
        this.encryptionKey = document.getElementById('encryptionKey');
        this.toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
        this.generateKeyBtn = document.getElementById('generateKeyBtn');
        this.deriveKeyBtn = document.getElementById('deriveKeyBtn');
        this.exportKeyBtn = document.getElementById('exportKeyBtn');
        this.importKeyBtn = document.getElementById('importKeyBtn');
        this.keyStrength = document.getElementById('keyStrength');
        
        // Text elements
        this.inputText = document.getElementById('inputText');
        this.outputText = document.getElementById('outputText');
        this.inputLabel = document.getElementById('inputLabel');
        this.outputLabel = document.getElementById('outputLabel');
        this.processBtn = document.getElementById('processBtn');
        this.swapBtn = document.getElementById('swapBtn');
        this.inputCharCount = document.getElementById('inputCharCount');
        this.outputCharCount = document.getElementById('outputCharCount');
        
        // Action elements
        this.clearInputBtn = document.getElementById('clearInputBtn');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.copyOutputBtn = document.getElementById('copyOutputBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.processStatus = document.getElementById('processStatus');
        
        // Detail elements
        this.detailAlgorithm = document.getElementById('detailAlgorithm');
        this.detailMode = document.getElementById('detailMode');
        this.detailKeySize = document.getElementById('detailKeySize');
        this.detailPadding = document.getElementById('detailPadding');
        this.detailIV = document.getElementById('detailIV');
        this.detailFormat = document.getElementById('detailFormat');
    }

    attachEventListeners() {
        // Mode toggles
        this.modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.switchMode(e.target.value));
        });
        
        this.modeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const mode = toggle.dataset.mode;
                document.querySelector(`input[value="${mode}"]`).checked = true;
                this.switchMode(mode);
            });
        });
        
        // Settings
        this.algorithmSelect.addEventListener('change', () => this.updateDetails());
        this.modeSelect.addEventListener('change', () => this.updateDetails());
        this.keySizeSelect.addEventListener('change', () => this.updateDetails());
        this.paddingSelect.addEventListener('change', () => this.updateDetails());
        
        // Key management
        this.encryptionKey.addEventListener('input', () => this.analyzeKeyStrength());
        this.toggleKeyVisibility.addEventListener('click', () => this.toggleKeyVisibility());
        this.generateKeyBtn.addEventListener('click', () => this.generateSecureKey());
        this.deriveKeyBtn.addEventListener('click', () => this.deriveKeyFromPassword());
        this.exportKeyBtn.addEventListener('click', () => this.exportKey());
        this.importKeyBtn.addEventListener('click', () => this.importKey());
        
        // Text processing
        this.processBtn.addEventListener('click', () => this.processText());
        this.swapBtn.addEventListener('click', () => this.swapInputOutput());
        this.inputText.addEventListener('input', () => this.updateCharCount('input'));
        this.outputText.addEventListener('input', () => this.updateCharCount('output'));
        
        // Actions
        this.clearInputBtn.addEventListener('click', () => this.clearInput());
        this.pasteBtn.addEventListener('click', () => this.pasteText());
        this.copyOutputBtn.addEventListener('click', () => this.copyOutput());
        this.downloadBtn.addEventListener('click', () => this.downloadResult());
        
        // Initialize
        this.updateDetails();
        this.updateCharCount('input');
        this.updateCharCount('output');
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update toggle states
        this.modeToggles.forEach(toggle => {
            toggle.classList.toggle('active', toggle.dataset.mode === mode);
        });
        
        // Update labels and button text
        if (mode === 'encrypt') {
            this.inputLabel.textContent = 'Text to Encrypt';
            this.outputLabel.textContent = 'Encrypted Result';
            this.processBtn.innerHTML = '🔒 Encrypt Text';
        } else {
            this.inputLabel.textContent = 'Text to Decrypt';
            this.outputLabel.textContent = 'Decrypted Result';
            this.processBtn.innerHTML = '🔓 Decrypt Text';
        }
        
        // Clear previous results
        this.outputText.value = '';
        this.updateCharCount('output');
        this.copyOutputBtn.disabled = true;
        this.downloadBtn.disabled = true;
        this.processStatus.innerHTML = '';
    }

    updateDetails() {
        this.detailAlgorithm.textContent = this.algorithmSelect.value;
        this.detailMode.textContent = this.modeSelect.value;
        this.detailKeySize.textContent = this.keySizeSelect.value + '-bit';
        this.detailPadding.textContent = this.paddingSelect.value;
        this.detailIV.textContent = this.modeSelect.value !== 'ECB' ? 'Yes' : 'No';
    }

    updateCharCount(type) {
        const element = type === 'input' ? this.inputText : this.outputText;
        const countElement = type === 'input' ? this.inputCharCount : this.outputCharCount;
        const count = element.value.length;
        countElement.textContent = `${count} character${count !== 1 ? 's' : ''}`;
    }

    analyzeKeyStrength() {
        const key = this.encryptionKey.value;
        
        if (!key) {
            this.keyStrength.innerHTML = '';
            return;
        }
        
        let strength = 0;
        let feedback = [];
        
        // Length check
        if (key.length >= 32) strength += 25;
        else if (key.length >= 16) strength += 15;
        else if (key.length >= 8) strength += 10;
        else feedback.push('Key is too short');
        
        // Character variety
        if (/[a-z]/.test(key)) strength += 15;
        if (/[A-Z]/.test(key)) strength += 15;
        if (/[0-9]/.test(key)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(key)) strength += 20;
        
        // Randomness check (simple)
        const uniqueChars = new Set(key).size;
        if (uniqueChars / key.length > 0.7) strength += 10;
        
        let level, color, message;
        if (strength >= 80) {
            level = 'Very Strong';
            color = '#28a745';
            message = 'Excellent key strength';
        } else if (strength >= 60) {
            level = 'Strong';
            color = '#20c997';
            message = 'Good key strength';
        } else if (strength >= 40) {
            level = 'Medium';
            color = '#ffc107';
            message = 'Fair key strength';
        } else if (strength >= 20) {
            level = 'Weak';
            color = '#fd7e14';
            message = 'Weak key - consider strengthening';
        } else {
            level = 'Very Weak';
            color = '#dc3545';
            message = 'Very weak key - not recommended';
        }
        
        this.keyStrength.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${strength}%; background-color: ${color};"></div>
            </div>
            <div class="strength-text">
                <span class="strength-level" style="color: ${color};">${level}</span>
                <span class="strength-message">${message}</span>
            </div>
        `;
    }

    toggleKeyVisibility() {
        this.keyVisible = !this.keyVisible;
        this.encryptionKey.type = this.keyVisible ? 'text' : 'password';
        this.toggleKeyVisibility.textContent = this.keyVisible ? '🙈' : '👁️';
    }

    generateSecureKey() {
        const keySize = parseInt(this.keySizeSelect.value);
        const keyBytes = keySize / 8;
        
        // Generate random bytes
        const array = new Uint8Array(keyBytes);
        crypto.getRandomValues(array);
        
        // Convert to hex string
        const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        
        this.encryptionKey.value = key;
        this.analyzeKeyStrength();
        this.showToast('Secure key generated successfully');
    }

    async deriveKeyFromPassword() {
        const password = prompt('Enter password to derive key from:');
        if (!password) return;
        
        const salt = prompt('Enter salt (or leave empty for random salt):') || this.generateRandomString(16);
        
        try {
            // Use PBKDF2 to derive key
            const keySize = parseInt(this.keySizeSelect.value);
            const iterations = 100000; // OWASP recommended minimum
            
            const key = CryptoJS.PBKDF2(password, salt, {
                keySize: keySize / 32,
                iterations: iterations
            });
            
            this.encryptionKey.value = key.toString();
            this.analyzeKeyStrength();
            this.showToast(`Key derived using PBKDF2 with ${iterations} iterations`);
            
        } catch (error) {
            this.showToast('Error deriving key: ' + error.message, 'error');
        }
    }

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    exportKey() {
        const key = this.encryptionKey.value;
        if (!key) {
            this.showToast('No key to export', 'error');
            return;
        }
        
        const keyData = {
            key: key,
            algorithm: this.algorithmSelect.value,
            keySize: this.keySizeSelect.value,
            createdAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `encryption-key-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Key exported successfully');
    }

    importKey() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const keyData = JSON.parse(e.target.result);
                    
                    if (keyData.key) {
                        this.encryptionKey.value = keyData.key;
                        
                        // Update settings if available
                        if (keyData.algorithm) this.algorithmSelect.value = keyData.algorithm;
                        if (keyData.keySize) this.keySizeSelect.value = keyData.keySize;
                        
                        this.analyzeKeyStrength();
                        this.updateDetails();
                        this.showToast('Key imported successfully');
                    } else {
                        this.showToast('Invalid key file format', 'error');
                    }
                } catch (error) {
                    this.showToast('Error importing key: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    processText() {
        const text = this.inputText.value.trim();
        const key = this.encryptionKey.value.trim();
        
        if (!text) {
            this.showToast('Please enter text to process', 'error');
            return;
        }
        
        if (!key) {
            this.showToast('Please enter an encryption key', 'error');
            return;
        }
        
        try {
            let result;
            const algorithm = this.algorithmSelect.value;
            const mode = this.modeSelect.value;
            const padding = this.paddingSelect.value;
            
            if (this.currentMode === 'encrypt') {
                result = this.encryptText(text, key, mode, padding);
                this.showStatus('Text encrypted successfully', 'success');
            } else {
                result = this.decryptText(text, key, mode, padding);
                this.showStatus('Text decrypted successfully', 'success');
            }
            
            this.outputText.value = result;
            this.updateCharCount('output');
            this.copyOutputBtn.disabled = false;
            this.downloadBtn.disabled = false;
            
        } catch (error) {
            this.showStatus('Error: ' + error.message, 'error');
            console.error('Processing error:', error);
        }
    }

    encryptText(text, key, mode, padding) {
        // Generate random IV for modes that need it
        const iv = CryptoJS.lib.WordArray.random(128/8);
        
        const encrypted = CryptoJS.AES.encrypt(text, key, {
            mode: CryptoJS.mode[mode],
            padding: CryptoJS.pad[padding],
            iv: iv
        });
        
        // Combine IV and encrypted data
        const combined = iv.concat(encrypted.ciphertext);
        return combined.toString(CryptoJS.enc.Base64);
    }

    decryptText(encryptedText, key, mode, padding) {
        try {
            // Parse the base64 string
            const combined = CryptoJS.enc.Base64.parse(encryptedText);
            
            // Extract IV (first 16 bytes) and ciphertext
            const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
            const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));
            
            // Create cipher params object
            const cipherParams = CryptoJS.lib.CipherParams.create({
                ciphertext: ciphertext
            });
            
            // Decrypt
            const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
                mode: CryptoJS.mode[mode],
                padding: CryptoJS.pad[padding],
                iv: iv
            });
            
            const result = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!result) {
                throw new Error('Decryption failed - invalid key or corrupted data');
            }
            
            return result;
            
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }

    swapInputOutput() {
        const inputValue = this.inputText.value;
        const outputValue = this.outputText.value;
        
        this.inputText.value = outputValue;
        this.outputText.value = inputValue;
        
        this.updateCharCount('input');
        this.updateCharCount('output');
        
        this.copyOutputBtn.disabled = !outputValue;
        this.downloadBtn.disabled = !outputValue;
        
        this.showToast('Input and output swapped');
    }

    clearInput() {
        this.inputText.value = '';
        this.updateCharCount('input');
        this.showToast('Input cleared');
    }

    async pasteText() {
        try {
            const text = await navigator.clipboard.readText();
            this.inputText.value = text;
            this.updateCharCount('input');
            this.showToast('Text pasted from clipboard');
        } catch (error) {
            this.showToast('Failed to paste from clipboard', 'error');
        }
    }

    async copyOutput() {
        const text = this.outputText.value;
        if (!text) return;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Result copied to clipboard');
        } catch (error) {
            // Fallback for older browsers
            this.outputText.select();
            document.execCommand('copy');
            this.showToast('Result copied to clipboard');
        }
    }

    downloadResult() {
        const text = this.outputText.value;
        if (!text) return;
        
        const filename = this.currentMode === 'encrypt' ? 'encrypted-text.txt' : 'decrypted-text.txt';
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Result downloaded successfully');
    }

    showStatus(message, type) {
        this.processStatus.innerHTML = `
            <div class="status-message ${type}">
                <span class="status-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="status-text">${message}</span>
            </div>
        `;
        
        // Clear after 5 seconds
        setTimeout(() => {
            this.processStatus.innerHTML = '';
        }, 5000);
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

// Initialize the text encryption tool when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.textEncryption = new TextEncryption();
});