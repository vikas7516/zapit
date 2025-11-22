class TOTPGenerator {
    constructor() {
        this.currentSecret = null;
        this.currentConfig = null;
        this.totpInterval = null;
        this.sessionStartTime = Date.now();
        this.codesGenerated = 0;
        this.codesValidated = 0;
        this.codeHistory = [];
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateSessionStats();
        this.initializeTheme();
    }

    initializeElements() {
        // Method tabs
        this.methodTabs = document.querySelectorAll('.method-tab');
        this.inputMethods = document.querySelectorAll('.input-method');
        
        // Secret input elements
        this.secretInput = document.getElementById('secret-input');
        this.accountName = document.getElementById('account-name');
        this.issuerName = document.getElementById('issuer-name');
        this.pasteSecretBtn = document.getElementById('paste-secret-btn');
        
        // Generate secret elements
        this.secretLength = document.getElementById('secret-length');
        this.generateSecretBtn = document.getElementById('generate-secret-btn');
        this.generatedSecretDisplay = document.getElementById('generated-secret-display');
        this.generatedSecretValue = document.getElementById('generated-secret-value');
        this.copyGeneratedSecret = document.getElementById('copy-generated-secret');
        this.genAccountName = document.getElementById('gen-account-name');
        this.genIssuerName = document.getElementById('gen-issuer-name');
        
        // QR import elements
        this.qrDropZone = document.getElementById('qr-drop-zone');
        this.qrFileInput = document.getElementById('qr-file-input');
        this.cameraScanBtn = document.getElementById('camera-scan-btn');
        this.cameraVideo = document.getElementById('camera-video');
        this.cameraCanvas = document.getElementById('camera-canvas');
        this.importedInfo = document.getElementById('imported-info');
        
        // TOTP settings
        this.timeStep = document.getElementById('time-step');
        this.digits = document.getElementById('digits');
        this.algorithm = document.getElementById('algorithm');
        
        // Action buttons
        this.setupTotpBtn = document.getElementById('setup-totp-btn');
        this.clearSetupBtn = document.getElementById('clear-setup-btn');
        
        // Status and display
        this.setupStatus = document.getElementById('setup-status');
        this.totpDisplaySection = document.getElementById('totp-display-section');
        this.currentAccountInfo = document.getElementById('current-account-info');
        this.currentTotpCode = document.getElementById('current-totp-code');
        this.timeRemaining = document.getElementById('time-remaining');
        this.validityProgressBar = document.getElementById('validity-progress-bar');
        this.copyTotpBtn = document.getElementById('copy-totp-btn');
        this.refreshTotpBtn = document.getElementById('refresh-totp-btn');
        
        // QR code elements
        this.qrCanvas = document.getElementById('qr-canvas');
        this.downloadQrBtn = document.getElementById('download-qr-btn');
        this.copyQrUrlBtn = document.getElementById('copy-qr-url-btn');
        
        // Setup display elements
        this.setupSecretDisplay = document.getElementById('setup-secret-display');
        this.setupAccountDisplay = document.getElementById('setup-account-display');
        this.setupIssuerDisplay = document.getElementById('setup-issuer-display');
        this.setupAlgorithmDisplay = document.getElementById('setup-algorithm-display');
        this.setupDigitsDisplay = document.getElementById('setup-digits-display');
        this.setupPeriodDisplay = document.getElementById('setup-period-display');
        
        // History elements
        this.historySection = document.getElementById('history-section');
        this.historyList = document.getElementById('history-list');
        this.clearHistoryBtn = document.getElementById('clear-history-btn');
        
        // Validation elements
        this.validateCode = document.getElementById('validate-code');
        this.validateBtn = document.getElementById('validate-btn');
        this.validationResult = document.getElementById('validation-result');
        
        // Statistics elements
        this.codesGeneratedStat = document.getElementById('codes-generated');
        this.codesValidatedStat = document.getElementById('codes-validated');
        this.sessionUptimeStat = document.getElementById('session-uptime');
        this.currentAlgorithmStat = document.getElementById('current-algorithm');
        
        // Theme toggle
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    }

    attachEventListeners() {
        // Method tabs
        this.methodTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchMethod(tab.dataset.method));
        });
        
        // Secret input
        this.pasteSecretBtn.addEventListener('click', () => this.pasteFromClipboard());
        
        // Generate secret
        this.generateSecretBtn.addEventListener('click', () => this.generateSecret());
        this.copyGeneratedSecret.addEventListener('click', () => this.copyGeneratedSecretToClipboard());
        
        // QR import
        this.qrDropZone.addEventListener('click', () => this.qrFileInput.click());
        this.qrDropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.qrDropZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.qrFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.cameraScanBtn.addEventListener('click', () => this.startCameraScan());
        
        // Action buttons
        this.setupTotpBtn.addEventListener('click', () => this.setupTOTP());
        this.clearSetupBtn.addEventListener('click', () => this.clearSetup());
        
        // TOTP actions
        this.copyTotpBtn.addEventListener('click', () => this.copyCurrentCode());
        this.refreshTotpBtn.addEventListener('click', () => this.refreshTOTP());
        
        // QR actions
        this.downloadQrBtn.addEventListener('click', () => this.downloadQRCode());
        this.copyQrUrlBtn.addEventListener('click', () => this.copyQRUrl());
        
        // History
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        
        // Validation
        this.validateBtn.addEventListener('click', () => this.validateCode());
        this.validateCode.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.validateCode();
        });
        
        // Theme toggle
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        
        // Auto-update session stats
        setInterval(() => this.updateSessionStats(), 1000);
    }

    initializeTheme() {
        const currentTheme = localStorage.getItem('zapit-theme') || 'light';
        this.updateThemeIcon(currentTheme);
    }

    toggleTheme() {
        const currentTheme = localStorage.getItem('zapit-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        localStorage.setItem('zapit-theme', newTheme);
        document.getElementById('theme-stylesheet').href = newTheme + '.css';
        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = this.themeToggleBtn.querySelector('.theme-icon');
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
    }

    switchMethod(method) {
        // Update tabs
        this.methodTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.method === method);
        });
        
        // Update input methods
        this.inputMethods.forEach(inputMethod => {
            const isActive = inputMethod.id === method + '-method';
            if (isActive) {
                inputMethod.classList.remove('hidden');
            } else {
                inputMethod.classList.add('hidden');
            }
            if (isActive) {
                inputMethod.classList.add('active');
            } else {
                inputMethod.classList.remove('active');
            }
        });
        
        this.clearSetup();
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            this.secretInput.value = text.replace(/\s/g, '').toUpperCase();
            this.showToast('Secret pasted from clipboard');
        } catch (err) {
            this.showToast('Failed to paste from clipboard', 'error');
        }
    }

    generateSecret() {
        const length = parseInt(this.secretLength.value);
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        
        // Convert to base32
        const base32Secret = this.base32Encode(bytes);
        
        this.generatedSecretValue.textContent = base32Secret;
        this.generatedSecretDisplay.classList.remove('hidden');
        
        this.showToast('New secret generated successfully');
    }

    base32Encode(buffer) {
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let result = '';
        let bits = 0;
        let value = 0;
        
        for (let i = 0; i < buffer.length; i++) {
            value = (value << 8) | buffer[i];
            bits += 8;
            
            while (bits >= 5) {
                result += base32Chars[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }
        
        if (bits > 0) {
            result += base32Chars[(value << (5 - bits)) & 31];
        }
        
        return result;
    }

    base32Decode(base32) {
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const base32Map = {};
        for (let i = 0; i < base32Chars.length; i++) {
            base32Map[base32Chars[i]] = i;
        }
        
        base32 = base32.replace(/[^A-Z2-7]/g, '');
        
        let bits = 0;
        let value = 0;
        let result = [];
        
        for (let i = 0; i < base32.length; i++) {
            value = (value << 5) | base32Map[base32[i]];
            bits += 5;
            
            if (bits >= 8) {
                result.push((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }
        
        return new Uint8Array(result);
    }

    async copyGeneratedSecretToClipboard() {
        const secret = this.generatedSecretValue.textContent;
        await this.copyToClipboard(secret, 'Generated secret copied to clipboard');
    }

    handleDragOver(e) {
        e.preventDefault();
        this.qrDropZone.classList.add('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.qrDropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processQRImage(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processQRImage(files[0]);
        }
    }

    async processQRImage(file) {
        try {
            const imageUrl = URL.createObjectURL(file);
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Here you would integrate with a QR code reader library
                // For now, we'll show a placeholder
                this.showToast('QR code processing not implemented yet', 'error');
                URL.revokeObjectURL(imageUrl);
            };
            
            img.src = imageUrl;
        } catch (error) {
            this.showToast('Error processing QR image: ' + error.message, 'error');
        }
    }

    async startCameraScan() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.cameraVideo.srcObject = stream;
            this.cameraVideo.classList.remove('hidden');
            this.cameraScanBtn.textContent = '⏹️ Stop Camera';
            
            // Here you would implement QR code scanning from video stream
            this.showToast('Camera QR scanning not fully implemented', 'info');
        } catch (error) {
            this.showToast('Camera access denied or not available', 'error');
        }
    }

    setupTOTP() {
        try {
            let secret, account, issuer;
            
            // Get values based on active method
            const activeMethod = document.querySelector('.method-tab.active').dataset.method;
            
            if (activeMethod === 'manual') {
                secret = this.secretInput.value.replace(/\s/g, '').toUpperCase();
                account = this.accountName.value || 'user@example.com';
                issuer = this.issuerName.value || 'MyApp';
            } else if (activeMethod === 'generate') {
                secret = this.generatedSecretValue.textContent;
                account = this.genAccountName.value || 'user@example.com';
                issuer = this.genIssuerName.value || 'MyApp';
            } else if (activeMethod === 'import') {
                this.showToast('Import method not fully implemented yet', 'error');
                return;
            }
            
            if (!secret) {
                throw new Error('Secret key is required');
            }
            
            // Validate secret
            if (!/^[A-Z2-7]+$/.test(secret)) {
                throw new Error('Invalid Base32 secret key');
            }
            
            // Setup configuration
            this.currentConfig = {
                secret: secret,
                account: account,
                issuer: issuer,
                algorithm: this.algorithm.value,
                digits: parseInt(this.digits.value),
                period: parseInt(this.timeStep.value)
            };
            
            this.currentSecret = this.base32Decode(secret);
            
            // Generate QR code
            this.generateQRCode();
            
            // Start TOTP generation
            this.startTOTPGeneration();
            
            // Update displays
            this.updateSetupDisplays();
            this.totpDisplaySection.classList.remove('hidden');
            this.historySection.classList.remove('hidden');
            
            this.showStatus('TOTP setup completed successfully!', 'success');
            
        } catch (error) {
            this.showStatus('Setup failed: ' + error.message, 'error');
        }
    }

    generateQRCode() {
        const config = this.currentConfig;
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(config.issuer)}:${encodeURIComponent(config.account)}?secret=${config.secret}&issuer=${encodeURIComponent(config.issuer)}&algorithm=${config.algorithm}&digits=${config.digits}&period=${config.period}`;
        
        QRCode.toCanvas(this.qrCanvas, otpauthUrl, {
            width: 256,
            margin: 2,
            color: {
                dark: getComputedStyle(document.documentElement).getPropertyValue('--text-color') || '#000000',
                light: getComputedStyle(document.documentElement).getPropertyValue('--bg-color') || '#FFFFFF'
            }
        }, (error) => {
            if (error) {
                console.error('QR Code generation failed:', error);
                this.showToast('Failed to generate QR code', 'error');
            }
        });
        
        this.qrUrl = otpauthUrl;
    }

    startTOTPGeneration() {
        // Clear existing interval
        if (this.totpInterval) {
            clearInterval(this.totpInterval);
        }
        
        // Generate initial code
        this.updateTOTPCode();
        
        // Set up interval for updates
        this.totpInterval = setInterval(() => {
            this.updateTOTPCode();
        }, 1000);
    }

    updateTOTPCode() {
        const now = Math.floor(Date.now() / 1000);
        const timeStep = this.currentConfig.period;
        const currentWindow = Math.floor(now / timeStep);
        const timeRemaining = timeStep - (now % timeStep);
        
        // Generate TOTP code
        const code = this.generateTOTPCode(currentWindow);
        
        // Update display
        this.currentTotpCode.textContent = this.formatTOTPCode(code);
        this.timeRemaining.textContent = timeRemaining;
        
        // Update progress bar
        const progress = (timeRemaining / timeStep) * 100;
        this.validityProgressBar.style.width = progress + '%';
        
        // Enable copy button
        this.copyTotpBtn.disabled = false;
        
        // Add to history if it's a new code
        if (this.codeHistory.length === 0 || this.codeHistory[0].code !== code) {
            this.addToHistory(code, currentWindow);
            this.codesGenerated++;
            this.updateSessionStats();
        }
        
        // Update progress bar color based on time remaining
        if (timeRemaining <= 5) {
            this.validityProgressBar.className = 'progress-bar urgent';
        } else if (timeRemaining <= 10) {
            this.validityProgressBar.className = 'progress-bar warning';
        } else {
            this.validityProgressBar.className = 'progress-bar';
        }
    }

    generateTOTPCode(timeWindow) {
        const timeBuffer = new ArrayBuffer(8);
        const timeView = new DataView(timeBuffer);
        timeView.setUint32(4, timeWindow, false);
        
        const timeBytes = new Uint8Array(timeBuffer);
        
        // HMAC calculation
        let hmac;
        const algorithm = this.currentConfig.algorithm;
        
        if (algorithm === 'SHA1') {
            hmac = CryptoJS.HmacSHA1(CryptoJS.lib.WordArray.create(timeBytes), CryptoJS.lib.WordArray.create(this.currentSecret));
        } else if (algorithm === 'SHA256') {
            hmac = CryptoJS.HmacSHA256(CryptoJS.lib.WordArray.create(timeBytes), CryptoJS.lib.WordArray.create(this.currentSecret));
        } else if (algorithm === 'SHA512') {
            hmac = CryptoJS.HmacSHA512(CryptoJS.lib.WordArray.create(timeBytes), CryptoJS.lib.WordArray.create(this.currentSecret));
        }
        
        const hmacBytes = new Uint8Array(hmac.words.length * 4);
        for (let i = 0; i < hmac.words.length; i++) {
            hmacBytes[i * 4] = (hmac.words[i] >>> 24) & 0xFF;
            hmacBytes[i * 4 + 1] = (hmac.words[i] >>> 16) & 0xFF;
            hmacBytes[i * 4 + 2] = (hmac.words[i] >>> 8) & 0xFF;
            hmacBytes[i * 4 + 3] = hmac.words[i] & 0xFF;
        }
        
        // Dynamic truncation
        const offset = hmacBytes[hmacBytes.length - 1] & 0x0F;
        const code = ((hmacBytes[offset] & 0x7F) << 24) |
                    ((hmacBytes[offset + 1] & 0xFF) << 16) |
                    ((hmacBytes[offset + 2] & 0xFF) << 8) |
                    (hmacBytes[offset + 3] & 0xFF);
        
        return code % Math.pow(10, this.currentConfig.digits);
    }

    formatTOTPCode(code) {
        const codeStr = code.toString().padStart(this.currentConfig.digits, '0');
        // Add space in the middle for readability (6 digits: 123 456, 8 digits: 1234 5678)
        if (this.currentConfig.digits === 6) {
            return codeStr.substring(0, 3) + ' ' + codeStr.substring(3);
        } else if (this.currentConfig.digits === 8) {
            return codeStr.substring(0, 4) + ' ' + codeStr.substring(4);
        }
        return codeStr;
    }

    addToHistory(code, timeWindow) {
        const timestamp = new Date(timeWindow * this.currentConfig.period * 1000);
        const historyEntry = {
            code: code,
            formattedCode: this.formatTOTPCode(code),
            timestamp: timestamp,
            timeWindow: timeWindow
        };
        
        this.codeHistory.unshift(historyEntry);
        
        // Keep only last 20 entries
        if (this.codeHistory.length > 20) {
            this.codeHistory = this.codeHistory.slice(0, 20);
        }
        
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        if (this.codeHistory.length === 0) {
            this.historyList.innerHTML = '<div class="history-placeholder"><p>TOTP codes will appear here as they are generated</p></div>';
            return;
        }
        
        const historyHTML = this.codeHistory.map((entry, index) => `
            <div class="history-item ${index === 0 ? 'current' : ''}">
                <div class="history-code">${entry.formattedCode}</div>
                <div class="history-time">${entry.timestamp.toLocaleTimeString()}</div>
                <button class="btn btn-xs btn-outline" onclick="totpGenerator.copyHistoryCode('${entry.code.toString().padStart(this.currentConfig.digits, '0')}')">📋</button>
            </div>
        `).join('');
        
        this.historyList.innerHTML = historyHTML;
    }

    updateSetupDisplays() {
        const config = this.currentConfig;
        
        this.currentAccountInfo.textContent = `${config.account} (${config.issuer})`;
        this.setupSecretDisplay.textContent = config.secret;
        this.setupAccountDisplay.textContent = config.account;
        this.setupIssuerDisplay.textContent = config.issuer;
        this.setupAlgorithmDisplay.textContent = config.algorithm;
        this.setupDigitsDisplay.textContent = config.digits + ' digits';
        this.setupPeriodDisplay.textContent = config.period + ' seconds';
        this.currentAlgorithmStat.textContent = config.algorithm;
    }

    async copyCurrentCode() {
        const code = this.currentTotpCode.textContent.replace(/\s/g, '');
        await this.copyToClipboard(code, 'TOTP code copied to clipboard');
    }

    async copyHistoryCode(code) {
        await this.copyToClipboard(code, 'History code copied to clipboard');
    }

    async copySetupSecret() {
        await this.copyToClipboard(this.currentConfig.secret, 'Secret key copied to clipboard');
    }

    refreshTOTP() {
        if (this.currentSecret) {
            this.updateTOTPCode();
            this.showToast('TOTP code refreshed');
        }
    }

    downloadQRCode() {
        const link = document.createElement('a');
        link.download = `totp-qr-${this.currentConfig.account}.png`;
        link.href = this.qrCanvas.toDataURL();
        link.click();
        this.showToast('QR code downloaded');
    }

    async copyQRUrl() {
        await this.copyToClipboard(this.qrUrl, 'TOTP URL copied to clipboard');
    }

    clearHistory() {
        this.codeHistory = [];
        this.updateHistoryDisplay();
        this.showToast('History cleared');
    }

    validateCode() {
        const inputCode = this.validateCode.value.replace(/\s/g, '');
        
        if (!this.currentSecret) {
            this.showValidationResult('Please setup TOTP first', 'error');
            return;
        }
        
        if (!/^\d+$/.test(inputCode) || inputCode.length !== this.currentConfig.digits) {
            this.showValidationResult(`Please enter a valid ${this.currentConfig.digits}-digit code`, 'error');
            return;
        }
        
        const now = Math.floor(Date.now() / 1000);
        const timeStep = this.currentConfig.period;
        const currentWindow = Math.floor(now / timeStep);
        
        // Check current, previous, and next time windows for clock skew tolerance
        const windows = [currentWindow - 1, currentWindow, currentWindow + 1];
        let isValid = false;
        let windowMatch = null;
        
        for (const window of windows) {
            const expectedCode = this.generateTOTPCode(window);
            if (parseInt(inputCode) === expectedCode) {
                isValid = true;
                windowMatch = window;
                break;
            }
        }
        
        if (isValid) {
            let windowDescription = '';
            if (windowMatch === currentWindow) {
                windowDescription = ' (current window)';
            } else if (windowMatch === currentWindow - 1) {
                windowDescription = ' (previous window)';
            } else if (windowMatch === currentWindow + 1) {
                windowDescription = ' (next window)';
            }
            
            this.showValidationResult(`✅ Valid TOTP code${windowDescription}`, 'success');
            this.codesValidated++;
        } else {
            this.showValidationResult('❌ Invalid TOTP code', 'error');
        }
        
        this.updateSessionStats();
        this.validateCode.value = '';
    }

    showValidationResult(message, type) {
        this.validationResult.innerHTML = `
            <div class="validation-message ${type}">
                ${message}
            </div>
        `;
        
        // Clear after 5 seconds
        setTimeout(() => {
            this.validationResult.innerHTML = '';
        }, 5000);
    }

    clearSetup() {
        // Clear intervals
        if (this.totpInterval) {
            clearInterval(this.totpInterval);
            this.totpInterval = null;
        }
        
        // Reset data
        this.currentSecret = null;
        this.currentConfig = null;
        this.codeHistory = [];
        
        // Clear inputs
        this.secretInput.value = '';
        this.accountName.value = '';
        this.issuerName.value = '';
        this.genAccountName.value = '';
        this.genIssuerName.value = '';
        this.validateCode.value = '';
        
        // Hide sections
        this.totpDisplaySection.classList.add('hidden');
        this.historySection.classList.add('hidden');
        this.generatedSecretDisplay.classList.add('hidden');
        this.importedInfo.classList.add('hidden');
        
        // Clear displays
        this.currentTotpCode.textContent = '------';
        this.timeRemaining.textContent = '--';
        this.validityProgressBar.style.width = '0%';
        this.copyTotpBtn.disabled = true;
        this.setupStatus.innerHTML = '';
        this.validationResult.innerHTML = '';
        
        // Reset stats
        this.currentAlgorithmStat.textContent = '-';
        
        this.showToast('Setup cleared');
    }

    updateSessionStats() {
        this.codesGeneratedStat.textContent = this.codesGenerated;
        this.codesValidatedStat.textContent = this.codesValidated;
        
        const uptime = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const minutes = Math.floor(uptime / 60);
        const seconds = uptime % 60;
        this.sessionUptimeStat.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    showStatus(message, type) {
        this.setupStatus.innerHTML = `
            <div class="status-message ${type}">
                <span class="status-icon">${type === 'success' ? '✅' : '❌'}</span>
                <span class="status-text">${message}</span>
            </div>
        `;
        
        // Clear after 5 seconds
        setTimeout(() => {
            this.setupStatus.innerHTML = '';
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
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the TOTP generator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.totpGenerator = new TOTPGenerator();
});

// Make functions available globally for inline onclick handlers
window.totpGenerator = null;