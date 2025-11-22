class HashGenerator {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabs();
    }

    setupEventListeners() {
        // Text hash generation
        document.getElementById('generate-hashes').addEventListener('click', () => this.generateTextHashes());
        document.getElementById('clear-text-hash').addEventListener('click', () => this.clearTextHash());
        
        // File hash generation
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileSelect(e));
        document.getElementById('generate-file-hashes').addEventListener('click', () => this.generateFileHashes());
        document.getElementById('clear-file-hash').addEventListener('click', () => this.clearFileHash());
        
        // File drag and drop
        const fileUploadArea = document.getElementById('file-upload-area');
        fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        fileUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        fileUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        fileUploadArea.addEventListener('click', () => document.getElementById('file-input').click());
        
        // Hash verification
        document.getElementById('verify-hash').addEventListener('click', () => this.verifyHash());
        document.getElementById('clear-verify').addEventListener('click', () => this.clearVerify());
        
        // HMAC generation
        document.getElementById('generate-hmac').addEventListener('click', () => this.generateHMAC());
        document.getElementById('clear-hmac').addEventListener('click', () => this.clearHMAC());
        document.getElementById('copy-hmac').addEventListener('click', () => this.copyHMAC());
        
        // Real-time text input
        document.getElementById('text-input').addEventListener('input', () => this.debounceGenerateHashes());
    }

    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                btn.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });
    }

    debounceGenerateHashes() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const textInput = document.getElementById('text-input').value.trim();
            if (textInput) {
                this.generateTextHashes();
            }
        }, 500);
    }

    async generateTextHashes() {
        const textInput = document.getElementById('text-input').value.trim();
        if (!textInput) return;

        const algorithms = this.getSelectedAlgorithms();
        if (algorithms.length === 0) {
            this.showMessage('Please select at least one algorithm', 'error');
            return;
        }

        const resultsContainer = document.getElementById('text-hash-results');
        resultsContainer.innerHTML = '<div class="loading">Generating hashes...</div>';

        try {
            const results = await this.computeHashes(textInput, algorithms);
            this.displayHashResults(results, resultsContainer);
        } catch (error) {
            resultsContainer.innerHTML = '<div class="error">Error generating hashes</div>';
            console.error('Hash generation error:', error);
        }
    }

    async generateFileHashes() {
        const fileInput = document.getElementById('file-input');
        if (!fileInput.files || !fileInput.files[0]) return;

        const file = fileInput.files[0];
        const algorithms = this.getSelectedFileAlgorithms();
        
        if (algorithms.length === 0) {
            this.showMessage('Please select at least one algorithm', 'error');
            return;
        }

        const resultsContainer = document.getElementById('file-hash-results');
        resultsContainer.innerHTML = '<div class="loading">Computing file hashes...</div>';

        try {
            const fileContent = await this.readFileAsArrayBuffer(file);
            const textContent = new TextDecoder().decode(fileContent);
            const results = await this.computeHashes(textContent, algorithms);
            this.displayHashResults(results, resultsContainer);
        } catch (error) {
            resultsContainer.innerHTML = '<div class="error">Error computing file hashes</div>';
            console.error('File hash error:', error);
        }
    }

    async verifyHash() {
        const inputText = document.getElementById('verify-input').value.trim();
        const expectedHash = document.getElementById('expected-hash').value.trim().toLowerCase();
        const algorithm = document.getElementById('hash-algorithm').value;

        if (!inputText || !expectedHash) {
            this.showMessage('Please enter both text and expected hash', 'error');
            return;
        }

        try {
            const computedHash = await this.computeSingleHash(inputText, algorithm);
            const isMatch = computedHash.toLowerCase() === expectedHash;
            
            this.displayVerificationResult(isMatch, computedHash, expectedHash);
        } catch (error) {
            console.error('Verification error:', error);
            this.showMessage('Error during verification', 'error');
        }
    }

    async generateHMAC() {
        const inputText = document.getElementById('hmac-input').value.trim();
        const secretKey = document.getElementById('hmac-key').value.trim();
        const algorithm = document.getElementById('hmac-algorithm').value;

        if (!inputText || !secretKey) {
            this.showMessage('Please enter both text and secret key', 'error');
            return;
        }

        try {
            const hmac = await this.computeHMAC(inputText, secretKey, algorithm);
            document.getElementById('hmac-output').value = hmac;
        } catch (error) {
            console.error('HMAC generation error:', error);
            this.showMessage('Error generating HMAC', 'error');
        }
    }

    async computeHashes(input, algorithms) {
        const results = {};
        
        for (const algorithm of algorithms) {
            results[algorithm] = await this.computeSingleHash(input, algorithm);
        }
        
        return results;
    }

    async computeSingleHash(input, algorithm) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        
        let hashAlgorithm;
        switch (algorithm) {
            case 'md5':
                return this.md5(input);
            case 'sha1':
                hashAlgorithm = 'SHA-1';
                break;
            case 'sha256':
                hashAlgorithm = 'SHA-256';
                break;
            case 'sha512':
                hashAlgorithm = 'SHA-512';
                break;
            default:
                throw new Error(`Unsupported algorithm: ${algorithm}`);
        }

        const hashBuffer = await crypto.subtle.digest(hashAlgorithm, data);
        return this.bufferToHex(hashBuffer);
    }

    async computeHMAC(input, key, algorithm) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(key);
        const inputData = encoder.encode(input);

        let hashAlgorithm;
        switch (algorithm) {
            case 'sha1':
                hashAlgorithm = 'SHA-1';
                break;
            case 'sha256':
                hashAlgorithm = 'SHA-256';
                break;
            case 'sha512':
                hashAlgorithm = 'SHA-512';
                break;
            default:
                throw new Error(`Unsupported HMAC algorithm: ${algorithm}`);
        }

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: hashAlgorithm },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', cryptoKey, inputData);
        return this.bufferToHex(signature);
    }

    md5(input) {
        // Simple MD5 implementation (not cryptographically secure, for demonstration only)
        // In a real application, you would use a proper MD5 library
        function md5cycle(x, k) {
            var a = x[0], b = x[1], c = x[2], d = x[3];
            a = ff(a, b, c, d, k[0], 7, -680876936);
            d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819);
            b = ff(b, c, d, a, k[3], 22, -1044525330);
            // ... (truncated for brevity - full MD5 implementation would be much longer)
            x[0] = add32(a, x[0]);
            x[1] = add32(b, x[1]);
            x[2] = add32(c, x[2]);
            x[3] = add32(d, x[3]);
        }
        
        // For demo purposes, return a placeholder
        // In production, use crypto-js or similar library
        return 'MD5 requires external library - placeholder hash: ' + this.simpleHash(input);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    bufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    getSelectedAlgorithms() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:not(.file-algorithm)');
        return Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }

    getSelectedFileAlgorithms() {
        const checkboxes = document.querySelectorAll('.file-algorithm');
        return Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);
    }

    displayHashResults(results, container) {
        const html = Object.entries(results).map(([algorithm, hash]) => `
            <div class="hash-result-item">
                <div class="hash-result-header">
                    <span class="hash-algorithm-name">${algorithm.toUpperCase()}</span>
                </div>
                <div class="hash-value">${hash}</div>
                <div class="hash-actions">
                    <button class="btn btn-outline copy-btn" onclick="navigator.clipboard.writeText('${hash}')">Copy</button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }

    displayVerificationResult(isMatch, computedHash, expectedHash) {
        const resultContainer = document.getElementById('verification-result');
        
        if (isMatch) {
            resultContainer.innerHTML = `
                <div class="verification-success">
                    <span class="verification-icon">✓</span>
                    <strong>Hash Verified Successfully!</strong>
                    <p>The computed hash matches the expected hash.</p>
                    <p><strong>Hash:</strong> ${computedHash}</p>
                </div>
            `;
        } else {
            resultContainer.innerHTML = `
                <div class="verification-failure">
                    <span class="verification-icon">✗</span>
                    <strong>Hash Verification Failed!</strong>
                    <p>The computed hash does not match the expected hash.</p>
                    <p><strong>Computed:</strong> ${computedHash}</p>
                    <p><strong>Expected:</strong> ${expectedHash}</p>
                </div>
            `;
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.displayFileInfo(file);
            document.getElementById('generate-file-hashes').disabled = false;
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.currentTarget.classList.remove('dragover');
    }

    handleFileDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('file-input');
            fileInput.files = files;
            this.displayFileInfo(files[0]);
            document.getElementById('generate-file-hashes').disabled = false;
        }
    }

    displayFileInfo(file) {
        const fileInfo = document.getElementById('file-info');
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('file-size').textContent = this.formatFileSize(file.size);
        document.getElementById('file-type').textContent = file.type || 'Unknown';
        fileInfo.classList.add('visible');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    clearTextHash() {
        document.getElementById('text-input').value = '';
        document.getElementById('text-hash-results').innerHTML = '';
    }

    clearFileHash() {
        document.getElementById('file-input').value = '';
        document.getElementById('file-info').classList.remove('visible');
        document.getElementById('file-hash-results').innerHTML = '';
        document.getElementById('generate-file-hashes').disabled = true;
    }

    clearVerify() {
        document.getElementById('verify-input').value = '';
        document.getElementById('expected-hash').value = '';
        document.getElementById('verification-result').innerHTML = '';
    }

    clearHMAC() {
        document.getElementById('hmac-input').value = '';
        document.getElementById('hmac-key').value = '';
        document.getElementById('hmac-output').value = '';
    }

    copyHMAC() {
        const hmacOutput = document.getElementById('hmac-output');
        if (hmacOutput.value) {
            navigator.clipboard.writeText(hmacOutput.value);
            this.showMessage('HMAC copied to clipboard!', 'success');
        }
    }

    showMessage(message, type) {
        // Create a temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 8px;
            color: white;
            background: ${type === 'success' ? '#059669' : '#dc2626'};
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HashGenerator();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .loading {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
        font-style: italic;
    }
    
    .error {
        text-align: center;
        padding: 2rem;
        color: #dc2626;
        background: #fef2f2;
        border-radius: 8px;
        border: 1px solid #fecaca;
    }
`;
document.head.appendChild(style);
