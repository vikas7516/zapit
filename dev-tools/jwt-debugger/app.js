class JWTDebugger {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSampleToken();
    }

    bindEvents() {
        const jwtInput = document.getElementById('jwtInput');
        const decodeBtn = document.getElementById('decodeBtn');
        const clearBtn = document.getElementById('clearBtn');
        const copyBtns = document.querySelectorAll('.copy-btn');

        jwtInput?.addEventListener('input', () => this.handleTokenInput());
        decodeBtn?.addEventListener('click', () => this.decodeToken());
        clearBtn?.addEventListener('click', () => this.clearAll());

        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.copyToClipboard(e));
        });
    }

    loadSampleToken() {
        // Sample JWT token for demonstration
        const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MzI3ODQwMDB9.3Tz5kGCjQ7uWKXg7Y-b5sT2pYQOOXl3VHLYkjfKkZ4w';
        const jwtInput = document.getElementById('jwtInput');
        if (jwtInput) {
            jwtInput.value = sampleToken;
            this.handleTokenInput();
        }
    }

    handleTokenInput() {
        const jwtInput = document.getElementById('jwtInput');
        const token = jwtInput?.value.trim();
        
        if (!token) {
            this.clearOutput();
            return;
        }

        this.validateToken(token);
    }

    validateToken(token) {
        const statusElement = document.getElementById('jwtStatus');
        const parts = token.split('.');

        if (parts.length !== 3) {
            this.updateStatus('invalid', 'Invalid JWT format');
            this.clearOutput();
            return;
        }

        try {
            // Validate base64url encoding
            parts.forEach(part => {
                if (!part) throw new Error('Empty part');
                this.base64UrlDecode(part);
            });

            this.updateStatus('valid', 'Valid JWT format');
            this.decodeToken();
        } catch (error) {
            this.updateStatus('invalid', 'Invalid JWT encoding');
            this.clearOutput();
        }
    }

    updateStatus(type, message) {
        const statusElement = document.getElementById('jwtStatus');
        if (statusElement) {
            statusElement.className = `jwt-status ${type}`;
            statusElement.textContent = message;
        }
    }

    decodeToken() {
        const jwtInput = document.getElementById('jwtInput');
        const token = jwtInput?.value.trim();

        if (!token) return;

        const parts = token.split('.');
        if (parts.length !== 3) return;

        try {
            // Decode header
            const header = JSON.parse(this.base64UrlDecode(parts[0]));
            this.displayHeader(header);

            // Decode payload
            const payload = JSON.parse(this.base64UrlDecode(parts[1]));
            this.displayPayload(payload);

            // Display signature
            this.displaySignature(parts[2], header.alg);

        } catch (error) {
            console.error('Error decoding JWT:', error);
            this.showNotification('Error decoding JWT: ' + error.message, 'error');
        }
    }

    displayHeader(header) {
        const headerContent = document.getElementById('headerContent');
        if (headerContent) {
            headerContent.textContent = JSON.stringify(header, null, 2);
        }

        // Update algorithm info
        const algorithmBadge = document.querySelector('.algorithm-badge');
        if (algorithmBadge) {
            algorithmBadge.textContent = header.alg || 'Unknown';
        }
    }

    displayPayload(payload) {
        const payloadContent = document.getElementById('payloadContent');
        if (payloadContent) {
            payloadContent.textContent = JSON.stringify(payload, null, 2);
        }

        // Display claims
        this.displayClaims(payload);
    }

    displayClaims(payload) {
        const claimsList = document.getElementById('claimsList');
        if (!claimsList) return;

        claimsList.innerHTML = '';

        const standardClaims = {
            iss: { label: 'Issuer', type: 'string' },
            sub: { label: 'Subject', type: 'string' },
            aud: { label: 'Audience', type: 'string' },
            exp: { label: 'Expires At', type: 'timestamp' },
            nbf: { label: 'Not Before', type: 'timestamp' },
            iat: { label: 'Issued At', type: 'timestamp' },
            jti: { label: 'JWT ID', type: 'string' }
        };

        Object.entries(payload).forEach(([key, value]) => {
            const claimItem = document.createElement('div');
            claimItem.className = 'claim-item';
            
            const claim = standardClaims[key] || { label: key, type: 'custom' };
            let displayValue = value;
            
            if (claim.type === 'timestamp' && typeof value === 'number') {
                const date = new Date(value * 1000);
                displayValue = `${value} (${date.toISOString()})`;
                
                // Check if expired
                if (key === 'exp' && Date.now() / 1000 > value) {
                    claimItem.classList.add('expired-claim');
                }
            }

            claimItem.innerHTML = `
                <div class="claim-key">${claim.label}:</div>
                <div class="claim-value">${displayValue}</div>
                <div class="claim-type">${claim.type}</div>
            `;

            claimsList.appendChild(claimItem);
        });
    }

    displaySignature(signature, algorithm) {
        const signatureContent = document.getElementById('signatureContent');
        if (signatureContent) {
            signatureContent.textContent = signature;
        }

        // Update verification status
        const verificationStatus = document.getElementById('verificationStatus');
        if (verificationStatus) {
            verificationStatus.className = 'verification-status warning';
            verificationStatus.innerHTML = `
                <span>⚠️</span>
                <span>Signature verification requires secret key</span>
            `;
        }
    }

    base64UrlDecode(str) {
        // Convert base64url to base64
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        
        // Add padding if needed
        while (str.length % 4) {
            str += '=';
        }
        
        return atob(str);
    }

    clearAll() {
        const jwtInput = document.getElementById('jwtInput');
        const headerContent = document.getElementById('headerContent');
        const payloadContent = document.getElementById('payloadContent');
        const signatureContent = document.getElementById('signatureContent');
        const claimsList = document.getElementById('claimsList');

        if (jwtInput) jwtInput.value = '';
        if (headerContent) headerContent.textContent = '';
        if (payloadContent) payloadContent.textContent = '';
        if (signatureContent) signatureContent.textContent = '';
        if (claimsList) claimsList.innerHTML = '';

        this.updateStatus('', '');
    }

    clearOutput() {
        const headerContent = document.getElementById('headerContent');
        const payloadContent = document.getElementById('payloadContent');
        const signatureContent = document.getElementById('signatureContent');
        const claimsList = document.getElementById('claimsList');

        if (headerContent) headerContent.textContent = '';
        if (payloadContent) payloadContent.textContent = '';
        if (signatureContent) signatureContent.textContent = '';
        if (claimsList) claimsList.innerHTML = '';
    }

    async copyToClipboard(event) {
        const button = event.target.closest('.copy-btn');
        const targetId = button.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        
        if (!targetElement) return;

        const text = targetElement.textContent || targetElement.value;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard!', 'success');
            
            // Visual feedback
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the JWT Debugger when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JWTDebugger();
});
