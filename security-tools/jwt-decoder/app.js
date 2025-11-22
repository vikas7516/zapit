class JWTDecoder {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.currentToken = null;
        this.decodedData = null;
    }

    initializeElements() {
        this.jwtInput = document.getElementById('jwtInput');
        this.decodeBtn = document.getElementById('decodeBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.generateSampleBtn = document.getElementById('generateSampleBtn');
        this.jwtStatus = document.getElementById('jwtStatus');
        this.decodedSections = document.getElementById('decodedSections');
        this.infoPanel = document.getElementById('infoPanel');
        this.verificationPanel = document.getElementById('verificationPanel');
    }

    attachEventListeners() {
        this.decodeBtn.addEventListener('click', () => this.decodeJWT());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.generateSampleBtn.addEventListener('click', () => this.generateSampleJWT());
        this.jwtInput.addEventListener('input', () => this.validateInput());
        this.jwtInput.addEventListener('paste', () => {
            setTimeout(() => this.validateInput(), 100);
        });
    }

    validateInput() {
        const token = this.jwtInput.value.trim();
        
        if (!token) {
            this.showStatus('', '');
            return;
        }

        if (!this.isValidJWTFormat(token)) {
            this.showStatus('Invalid JWT format. JWT should have 3 parts separated by dots.', 'error');
            return;
        }

        this.showStatus('Valid JWT format detected', 'success');
    }

    isValidJWTFormat(token) {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        
        // Check if each part is valid base64
        return parts.every(part => {
            try {
                return part.length > 0 && /^[A-Za-z0-9_-]+$/.test(part);
            } catch {
                return false;
            }
        });
    }

    decodeJWT() {
        const token = this.jwtInput.value.trim();

        if (!token) {
            this.showStatus('Please enter a JWT token', 'error');
            return;
        }

        if (!this.isValidJWTFormat(token)) {
            this.showStatus('Invalid JWT format', 'error');
            return;
        }

        try {
            const parts = token.split('.');
            const header = this.decodeBase64URL(parts[0]);
            const payload = this.decodeBase64URL(parts[1]);
            const signature = parts[2];

            this.decodedData = {
                header: JSON.parse(header),
                payload: JSON.parse(payload),
                signature: signature,
                headerEncoded: parts[0],
                payloadEncoded: parts[1]
            };

            this.currentToken = token;
            this.displayDecodedJWT();
            this.showStatus('JWT decoded successfully', 'success');

        } catch (error) {
            this.showStatus('Error decoding JWT: ' + error.message, 'error');
            console.error('JWT decode error:', error);
        }
    }

    decodeBase64URL(str) {
        // Add padding if necessary
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        
        try {
            return decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
        } catch (error) {
            throw new Error('Invalid base64 encoding');
        }
    }

    displayDecodedJWT() {
        if (!this.decodedData) return;

        // Show sections
        this.decodedSections.classList.remove('hidden');
        this.infoPanel.classList.remove('hidden');
        this.verificationPanel.classList.remove('hidden');

        // Display header
        document.getElementById('headerEncoded').textContent = this.decodedData.headerEncoded;
        document.getElementById('headerDecoded').textContent = JSON.stringify(this.decodedData.header, null, 2);

        // Display payload
        document.getElementById('payloadEncoded').textContent = this.decodedData.payloadEncoded;
        document.getElementById('payloadDecoded').textContent = JSON.stringify(this.decodedData.payload, null, 2);

        // Display signature
        document.getElementById('signatureValue').textContent = this.decodedData.signature;

        // Display token information
        this.displayTokenInfo();
    }

    displayTokenInfo() {
        const header = this.decodedData.header;
        const payload = this.decodedData.payload;

        // Basic info
        document.getElementById('tokenAlgorithm').textContent = header.alg || 'Not specified';
        document.getElementById('tokenType').textContent = header.typ || 'Not specified';

        // Time claims
        this.displayTimeClaim('tokenIssuedAt', payload.iat);
        this.displayTimeClaim('tokenExpiresAt', payload.exp);
        this.displayTimeClaim('tokenNotBefore', payload.nbf);

        // Standard claims
        document.getElementById('tokenSubject').textContent = payload.sub || 'Not specified';
        document.getElementById('tokenAudience').textContent = 
            Array.isArray(payload.aud) ? payload.aud.join(', ') : (payload.aud || 'Not specified');
        document.getElementById('tokenIssuer').textContent = payload.iss || 'Not specified';

        // Status checks
        this.displayTokenStatus();
    }

    displayTimeClaim(elementId, timestamp) {
        const element = document.getElementById(elementId);
        if (timestamp) {
            const date = new Date(timestamp * 1000);
            element.textContent = date.toLocaleString() + ` (${timestamp})`;
        } else {
            element.textContent = 'Not specified';
        }
    }

    displayTokenStatus() {
        const payload = this.decodedData.payload;
        const now = Math.floor(Date.now() / 1000);

        // Expiration status
        const expirationElement = document.getElementById('expirationStatus');
        if (payload.exp) {
            const isExpired = now > payload.exp;
            const timeUntilExp = payload.exp - now;
            
            if (isExpired) {
                expirationElement.innerHTML = `
                    <span class="status-icon error">❌</span>
                    <span class="status-text">Token has expired</span>
                `;
                expirationElement.className = 'status-item error';
            } else {
                const timeStr = this.formatTimeRemaining(timeUntilExp);
                expirationElement.innerHTML = `
                    <span class="status-icon success">✅</span>
                    <span class="status-text">Token valid for ${timeStr}</span>
                `;
                expirationElement.className = 'status-item success';
            }
        } else {
            expirationElement.innerHTML = `
                <span class="status-icon warning">⚠️</span>
                <span class="status-text">No expiration time specified</span>
            `;
            expirationElement.className = 'status-item warning';
        }

        // Not before status
        const validityElement = document.getElementById('validityStatus');
        if (payload.nbf) {
            const isValid = now >= payload.nbf;
            
            if (isValid) {
                validityElement.innerHTML = `
                    <span class="status-icon success">✅</span>
                    <span class="status-text">Token is currently valid</span>
                `;
                validityElement.className = 'status-item success';
            } else {
                const timeUntilValid = payload.nbf - now;
                const timeStr = this.formatTimeRemaining(timeUntilValid);
                validityElement.innerHTML = `
                    <span class="status-icon warning">⏳</span>
                    <span class="status-text">Token valid in ${timeStr}</span>
                `;
                validityElement.className = 'status-item warning';
            }
        } else {
            validityElement.innerHTML = `
                <span class="status-icon success">✅</span>
                <span class="status-text">No validity restriction</span>
            `;
            validityElement.className = 'status-item success';
        }
    }

    formatTimeRemaining(seconds) {
        if (seconds < 60) {
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            const days = Math.floor(seconds / 86400);
            return `${days} day${days !== 1 ? 's' : ''}`;
        }
    }

    copySection(section) {
        let textToCopy = '';
        
        switch (section) {
            case 'header':
                textToCopy = JSON.stringify(this.decodedData.header, null, 2);
                break;
            case 'payload':
                textToCopy = JSON.stringify(this.decodedData.payload, null, 2);
                break;
            case 'signature':
                textToCopy = this.decodedData.signature;
                break;
        }

        this.copyToClipboard(textToCopy, `JWT ${section} copied to clipboard`);
    }

    formatSection(section) {
        let element;
        let data;
        
        switch (section) {
            case 'header':
                element = document.getElementById('headerDecoded');
                data = this.decodedData.header;
                break;
            case 'payload':
                element = document.getElementById('payloadDecoded');
                data = this.decodedData.payload;
                break;
        }

        if (element && data) {
            element.textContent = JSON.stringify(data, null, 4);
            this.showToast(`${section} formatted with 4-space indentation`);
        }
    }

    generateSampleJWT() {
        // Create a sample JWT for demonstration
        const header = {
            "alg": "HS256",
            "typ": "JWT"
        };

        const payload = {
            "sub": "1234567890",
            "name": "John Doe",
            "iat": Math.floor(Date.now() / 1000),
            "exp": Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            "iss": "zapit.me",
            "aud": "example-audience"
        };

        const headerEncoded = this.encodeBase64URL(JSON.stringify(header));
        const payloadEncoded = this.encodeBase64URL(JSON.stringify(payload));
        const signature = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"; // Sample signature

        const sampleJWT = `${headerEncoded}.${payloadEncoded}.${signature}`;
        
        this.jwtInput.value = sampleJWT;
        this.showToast('Sample JWT generated');
        this.validateInput();
    }

    encodeBase64URL(str) {
        return btoa(unescape(encodeURIComponent(str)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    clearAll() {
        this.jwtInput.value = '';
        this.currentToken = null;
        this.decodedData = null;
        
        // Hide sections
        this.decodedSections.classList.add('hidden');
        this.infoPanel.classList.add('hidden');
        this.verificationPanel.classList.add('hidden');
        
        this.showStatus('', '');
        this.showToast('Cleared all data');
    }

    showStatus(message, type) {
        this.jwtStatus.textContent = message;
        this.jwtStatus.className = `jwt-status ${type}`;
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

// Initialize the JWT decoder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.jwtDecoder = new JWTDecoder();
});

// Make functions available globally for inline onclick handlers
window.jwtDecoder = null;