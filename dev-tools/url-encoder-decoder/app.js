class URLEncoderDecoder {
    constructor() {
        this.encodingMode = 'standard';
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupEncodingOptions();
        this.loadSampleData();
    }

    bindEvents() {
        const urlInput = document.getElementById('urlInput');
        const encodeBtn = document.getElementById('encodeBtn');
        const decodeBtn = document.getElementById('decodeBtn');
        const clearBtn = document.getElementById('clearBtn');
        const batchInput = document.getElementById('batchInput');
        const batchEncodeBtn = document.getElementById('batchEncodeBtn');
        const batchDecodeBtn = document.getElementById('batchDecodeBtn');
        const copyBtns = document.querySelectorAll('.copy-btn');

        urlInput?.addEventListener('input', () => this.analyzeURL());
        encodeBtn?.addEventListener('click', () => this.encodeURL());
        decodeBtn?.addEventListener('click', () => this.decodeURL());
        clearBtn?.addEventListener('click', () => this.clearAll());
        batchEncodeBtn?.addEventListener('click', () => this.batchEncode());
        batchDecodeBtn?.addEventListener('click', () => this.batchDecode());

        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.copyToClipboard(e));
        });

        // Encoding option clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.encoding-option')) {
                this.selectEncodingOption(e.target.closest('.encoding-option'));
            }
        });
    }

    setupEncodingOptions() {
        const encodingOptions = [
            {
                id: 'standard',
                title: 'Standard URL Encoding',
                desc: 'RFC 3986 compliant encoding'
            },
            {
                id: 'component',
                title: 'Component Encoding',
                desc: 'Encode URL components separately'
            },
            {
                id: 'full',
                title: 'Full URL Encoding',
                desc: 'Encode entire URL including protocols'
            }
        ];

        const optionsContainer = document.getElementById('encodingOptions');
        if (!optionsContainer) return;

        encodingOptions.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = `encoding-option ${option.id === 'standard' ? 'active' : ''}`;
            optionElement.dataset.mode = option.id;
            optionElement.innerHTML = `
                <div class="encoding-option-title">${option.title}</div>
                <div class="encoding-option-desc">${option.desc}</div>
            `;
            optionsContainer.appendChild(optionElement);
        });
    }

    loadSampleData() {
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.value = 'https://example.com/search?q=hello world&category=web development';
            this.analyzeURL();
        }

        const batchInput = document.getElementById('batchInput');
        if (batchInput) {
            batchInput.value = `https://example.com/search?q=hello world
https://test.com/path with spaces/file.html
https://api.example.com/users?name=John Doe&email=john@example.com
https://site.com/français/café.html
https://demo.com/page?data={"key":"value with spaces"}`;
        }
    }

    selectEncodingOption(optionElement) {
        // Remove active class from all options
        document.querySelectorAll('.encoding-option').forEach(option => {
            option.classList.remove('active');
        });

        // Add active class to selected option
        optionElement.classList.add('active');
        this.encodingMode = optionElement.dataset.mode;
    }

    analyzeURL() {
        const urlInput = document.getElementById('urlInput');
        const urlStatus = document.getElementById('urlStatus');
        const urlAnalysis = document.getElementById('urlAnalysis');

        const url = urlInput?.value.trim();

        if (!url) {
            this.clearAnalysis();
            return;
        }

        // Check if URL is encoded
        const isEncoded = this.isURLEncoded(url);
        
        if (urlStatus) {
            if (isEncoded) {
                urlStatus.className = 'url-status encoded';
                urlStatus.textContent = 'URL appears to be encoded';
            } else {
                try {
                    new URL(url);
                    urlStatus.className = 'url-status valid';
                    urlStatus.textContent = 'Valid URL format';
                } catch {
                    urlStatus.className = 'url-status invalid';
                    urlStatus.textContent = 'Invalid URL format';
                }
            }
        }

        // Parse URL components
        this.parseURLComponents(url);
    }

    parseURLComponents(url) {
        const urlParts = document.getElementById('urlParts');
        if (!urlParts) return;

        try {
            let parsedURL;
            
            // Try to parse as-is first, then try decoding if it fails
            try {
                parsedURL = new URL(url);
            } catch {
                const decoded = decodeURIComponent(url);
                parsedURL = new URL(decoded);
            }

            const components = [
                { label: 'Protocol', value: parsedURL.protocol },
                { label: 'Host', value: parsedURL.host },
                { label: 'Hostname', value: parsedURL.hostname },
                { label: 'Port', value: parsedURL.port || '(default)' },
                { label: 'Pathname', value: parsedURL.pathname },
                { label: 'Search', value: parsedURL.search || '(none)' },
                { label: 'Hash', value: parsedURL.hash || '(none)' },
                { label: 'Origin', value: parsedURL.origin }
            ];

            urlParts.innerHTML = components.map(component => `
                <div class="url-part">
                    <div class="part-label">${component.label}:</div>
                    <div class="part-value ${component.value.includes('(') ? 'empty' : ''}">${component.value}</div>
                </div>
            `).join('');

        } catch (error) {
            urlParts.innerHTML = `
                <div class="url-part">
                    <div class="part-label">Error:</div>
                    <div class="part-value">Unable to parse URL - ${error.message}</div>
                </div>
            `;
        }
    }

    isURLEncoded(url) {
        try {
            return decodeURIComponent(url) !== url;
        } catch {
            return false;
        }
    }

    encodeURL() {
        const urlInput = document.getElementById('urlInput');
        const urlOutput = document.getElementById('urlOutput');

        const url = urlInput?.value.trim();
        if (!url) return;

        try {
            let encoded;
            
            switch (this.encodingMode) {
                case 'standard':
                    encoded = encodeURI(url);
                    break;
                case 'component':
                    encoded = encodeURIComponent(url);
                    break;
                case 'full':
                    encoded = url.split('').map(char => {
                        if (/[A-Za-z0-9\-_.~]/.test(char)) {
                            return char;
                        }
                        return encodeURIComponent(char);
                    }).join('');
                    break;
                default:
                    encoded = encodeURI(url);
            }

            if (urlOutput) {
                urlOutput.value = encoded;
                urlOutput.classList.remove('error-state');
                urlOutput.classList.add('success-state');
            }

            this.showNotification('URL encoded successfully!', 'success');

        } catch (error) {
            if (urlOutput) {
                urlOutput.value = `Error: ${error.message}`;
                urlOutput.classList.add('error-state');
                urlOutput.classList.remove('success-state');
            }
            this.showNotification('Error encoding URL', 'error');
        }
    }

    decodeURL() {
        const urlInput = document.getElementById('urlInput');
        const urlOutput = document.getElementById('urlOutput');

        const url = urlInput?.value.trim();
        if (!url) return;

        try {
            const decoded = decodeURIComponent(url);

            if (urlOutput) {
                urlOutput.value = decoded;
                urlOutput.classList.remove('error-state');
                urlOutput.classList.add('success-state');
            }

            this.showNotification('URL decoded successfully!', 'success');

        } catch (error) {
            if (urlOutput) {
                urlOutput.value = `Error: ${error.message}`;
                urlOutput.classList.add('error-state');
                urlOutput.classList.remove('success-state');
            }
            this.showNotification('Error decoding URL', 'error');
        }
    }

    batchEncode() {
        const batchInput = document.getElementById('batchInput');
        const batchResults = document.getElementById('batchResults');
        const batchStats = document.getElementById('batchStats');

        const urls = batchInput?.value.split('\n').filter(url => url.trim());
        if (!urls || urls.length === 0) return;

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        urls.forEach((url, index) => {
            try {
                const encoded = encodeURIComponent(url.trim());
                results.push({
                    index: index + 1,
                    original: url.trim(),
                    result: encoded,
                    status: 'success'
                });
                successCount++;
            } catch (error) {
                results.push({
                    index: index + 1,
                    original: url.trim(),
                    result: error.message,
                    status: 'error'
                });
                errorCount++;
            }
        });

        this.displayBatchResults(results);
        this.updateBatchStats(successCount, errorCount, urls.length);
    }

    batchDecode() {
        const batchInput = document.getElementById('batchInput');
        const batchResults = document.getElementById('batchResults');

        const urls = batchInput?.value.split('\n').filter(url => url.trim());
        if (!urls || urls.length === 0) return;

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        urls.forEach((url, index) => {
            try {
                const decoded = decodeURIComponent(url.trim());
                results.push({
                    index: index + 1,
                    original: url.trim(),
                    result: decoded,
                    status: 'success'
                });
                successCount++;
            } catch (error) {
                results.push({
                    index: index + 1,
                    original: url.trim(),
                    result: error.message,
                    status: 'error'
                });
                errorCount++;
            }
        });

        this.displayBatchResults(results);
        this.updateBatchStats(successCount, errorCount, urls.length);
    }

    displayBatchResults(results) {
        const batchResults = document.getElementById('batchResults');
        if (!batchResults) return;

        batchResults.innerHTML = results.map(result => `
            <div class="batch-url-item">
                <div class="batch-url-header">
                    <div class="batch-url-index">URL ${result.index}</div>
                    <div class="batch-url-status ${result.status}">${result.status}</div>
                </div>
                <div class="batch-url-content">
                    <div class="batch-url-original">${result.original}</div>
                    <div class="batch-url-result ${result.status === 'error' ? 'batch-url-error' : ''}">${result.result}</div>
                </div>
            </div>
        `).join('');
    }

    updateBatchStats(successCount, errorCount, totalCount) {
        const batchStats = document.getElementById('batchStats');
        if (!batchStats) return;

        batchStats.innerHTML = `
            <div class="batch-stat">
                <div class="batch-stat-value">${totalCount}</div>
                <div class="batch-stat-label">Total URLs</div>
            </div>
            <div class="batch-stat">
                <div class="batch-stat-value">${successCount}</div>
                <div class="batch-stat-label">Successful</div>
            </div>
            <div class="batch-stat">
                <div class="batch-stat-value">${errorCount}</div>
                <div class="batch-stat-label">Errors</div>
            </div>
        `;
    }

    clearAnalysis() {
        const urlStatus = document.getElementById('urlStatus');
        const urlParts = document.getElementById('urlParts');

        if (urlStatus) {
            urlStatus.className = 'url-status';
            urlStatus.textContent = '';
        }

        if (urlParts) {
            urlParts.innerHTML = '';
        }
    }

    clearAll() {
        const urlInput = document.getElementById('urlInput');
        const urlOutput = document.getElementById('urlOutput');
        const batchInput = document.getElementById('batchInput');
        const batchResults = document.getElementById('batchResults');
        const batchStats = document.getElementById('batchStats');

        if (urlInput) urlInput.value = '';
        if (urlOutput) {
            urlOutput.value = '';
            urlOutput.classList.remove('error-state', 'success-state');
        }
        if (batchInput) batchInput.value = '';
        if (batchResults) batchResults.innerHTML = '';
        if (batchStats) batchStats.innerHTML = '';

        this.clearAnalysis();
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

// Initialize the URL Encoder/Decoder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new URLEncoderDecoder();
});
