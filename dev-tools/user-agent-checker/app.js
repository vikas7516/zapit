class UserAgentChecker {
    constructor() {
        this.init();
    }

    init() {
        this.elements = {
            currentUA: document.getElementById('current-ua'),
            copyUABtn: document.getElementById('copy-ua'),
            customUAInput: document.getElementById('custom-ua-input'),
            analyzeBtn: document.getElementById('analyze-btn'),
            clearBtn: document.getElementById('clear-btn'),
            
            // Browser info
            browserName: document.getElementById('browser-name'),
            browserVersion: document.getElementById('browser-version'),
            browserEngine: document.getElementById('browser-engine'),
            engineVersion: document.getElementById('engine-version'),
            
            // OS info
            osName: document.getElementById('os-name'),
            osVersion: document.getElementById('os-version'),
            osArch: document.getElementById('os-arch'),
            platform: document.getElementById('platform'),
            
            // Device info
            deviceType: document.getElementById('device-type'),
            deviceVendor: document.getElementById('device-vendor'),
            deviceModel: document.getElementById('device-model'),
            touchSupport: document.getElementById('touch-support'),
            
            // Screen & features
            screenResolution: document.getElementById('screen-resolution'),
            colorDepth: document.getElementById('color-depth'),
            timezone: document.getElementById('timezone'),
            language: document.getElementById('language'),
            
            // Breakdown
            productInfo: document.getElementById('product-info'),
            systemInfo: document.getElementById('system-info'),
            extensionsInfo: document.getElementById('extensions-info')
        };

        this.bindEvents();
        this.loadCurrentUserAgent();
        this.analyzeCurrentBrowser();
    }

    bindEvents() {
        this.elements.copyUABtn.addEventListener('click', () => this.copyToClipboard(this.elements.currentUA.value));
        this.elements.analyzeBtn.addEventListener('click', () => this.analyzeCustomUserAgent());
        this.elements.clearBtn.addEventListener('click', () => this.clearCustomInput());
        
        // Auto-analyze on input
        this.elements.customUAInput.addEventListener('input', () => {
            if (this.elements.customUAInput.value.trim()) {
                this.analyzeUserAgent(this.elements.customUAInput.value.trim());
            } else {
                this.analyzeCurrentBrowser();
            }
        });
    }

    loadCurrentUserAgent() {
        const currentUA = navigator.userAgent;
        this.elements.currentUA.value = currentUA;
        this.elements.currentUA.setAttribute('aria-label', 'Your current user agent string');
    }

    analyzeCurrentBrowser() {
        this.analyzeUserAgent(navigator.userAgent);
        this.updateAdditionalInfo();
    }

    analyzeCustomUserAgent() {
        const customUA = this.elements.customUAInput.value.trim();
        if (customUA) {
            this.analyzeUserAgent(customUA);
        } else {
            this.showNotification('Please enter a user agent string to analyze', 'warning');
        }
    }

    analyzeUserAgent(userAgent) {
        const analysis = this.parseUserAgent(userAgent);
        this.updateAnalysisDisplay(analysis);
        this.updateBreakdown(userAgent);
    }

    parseUserAgent(userAgent) {
        const analysis = {
            browser: { name: 'Unknown', version: 'Unknown', engine: 'Unknown', engineVersion: 'Unknown' },
            os: { name: 'Unknown', version: 'Unknown', arch: 'Unknown' },
            device: { type: 'Unknown', vendor: 'Unknown', model: 'Unknown' }
        };

        // Browser detection
        if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/') && !userAgent.includes('OPR/')) {
            analysis.browser.name = 'Chrome';
            analysis.browser.version = this.extractVersion(userAgent, /Chrome\/([^\s]+)/);
            analysis.browser.engine = 'Blink';
            analysis.browser.engineVersion = this.extractVersion(userAgent, /Chrome\/([^\s]+)/);
        } else if (userAgent.includes('Edg/')) {
            analysis.browser.name = 'Microsoft Edge';
            analysis.browser.version = this.extractVersion(userAgent, /Edg\/([^\s]+)/);
            analysis.browser.engine = 'Blink';
            analysis.browser.engineVersion = this.extractVersion(userAgent, /Chrome\/([^\s]+)/);
        } else if (userAgent.includes('Firefox/')) {
            analysis.browser.name = 'Firefox';
            analysis.browser.version = this.extractVersion(userAgent, /Firefox\/([^\s]+)/);
            analysis.browser.engine = 'Gecko';
            analysis.browser.engineVersion = this.extractVersion(userAgent, /rv:([^\)]+)/);
        } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) {
            analysis.browser.name = 'Safari';
            analysis.browser.version = this.extractVersion(userAgent, /Version\/([^\s]+)/);
            analysis.browser.engine = 'WebKit';
            analysis.browser.engineVersion = this.extractVersion(userAgent, /WebKit\/([^\s]+)/);
        } else if (userAgent.includes('OPR/')) {
            analysis.browser.name = 'Opera';
            analysis.browser.version = this.extractVersion(userAgent, /OPR\/([^\s]+)/);
            analysis.browser.engine = 'Blink';
            analysis.browser.engineVersion = this.extractVersion(userAgent, /Chrome\/([^\s]+)/);
        } else if (userAgent.includes('Trident/')) {
            analysis.browser.name = 'Internet Explorer';
            analysis.browser.version = this.extractVersion(userAgent, /rv:([^\)]+)/);
            analysis.browser.engine = 'Trident';
            analysis.browser.engineVersion = this.extractVersion(userAgent, /Trident\/([^\s;]+)/);
        }

        // OS detection
        if (userAgent.includes('Windows NT')) {
            analysis.os.name = 'Windows';
            const version = this.extractVersion(userAgent, /Windows NT ([^\s;)]+)/);
            analysis.os.version = this.getWindowsVersion(version);
            
            if (userAgent.includes('WOW64') || userAgent.includes('Win64; x64')) {
                analysis.os.arch = '64-bit';
            } else {
                analysis.os.arch = '32-bit';
            }
        } else if (userAgent.includes('Mac OS X') || userAgent.includes('macOS')) {
            analysis.os.name = 'macOS';
            const version = this.extractVersion(userAgent, /(?:Mac OS X|macOS)\s([^\s;)]+)/);
            analysis.os.version = version ? version.replace(/_/g, '.') : 'Unknown';
            analysis.os.arch = userAgent.includes('Intel') ? 'Intel' : 'Unknown';
        } else if (userAgent.includes('Linux')) {
            analysis.os.name = 'Linux';
            if (userAgent.includes('Ubuntu')) {
                analysis.os.name = 'Ubuntu Linux';
            } else if (userAgent.includes('Fedora')) {
                analysis.os.name = 'Fedora Linux';
            }
            analysis.os.arch = userAgent.includes('x86_64') ? '64-bit' : '32-bit';
        } else if (userAgent.includes('Android')) {
            analysis.os.name = 'Android';
            analysis.os.version = this.extractVersion(userAgent, /Android ([^\s;)]+)/);
            analysis.os.arch = userAgent.includes('arm64') ? '64-bit' : '32-bit';
        } else if (userAgent.includes('iOS') || userAgent.includes('iPhone OS')) {
            analysis.os.name = 'iOS';
            analysis.os.version = this.extractVersion(userAgent, /OS ([^\s]+)/);
            if (analysis.os.version) {
                analysis.os.version = analysis.os.version.replace(/_/g, '.');
            }
        }

        // Device detection
        if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
            analysis.device.type = 'Mobile';
            
            if (userAgent.includes('iPhone')) {
                analysis.device.vendor = 'Apple';
                analysis.device.model = 'iPhone';
            } else if (userAgent.includes('iPad')) {
                analysis.device.vendor = 'Apple';
                analysis.device.model = 'iPad';
                analysis.device.type = 'Tablet';
            } else if (userAgent.includes('Samsung')) {
                analysis.device.vendor = 'Samsung';
                analysis.device.model = this.extractSamsungModel(userAgent);
            } else if (userAgent.includes('Pixel')) {
                analysis.device.vendor = 'Google';
                analysis.device.model = this.extractVersion(userAgent, /Pixel ([^;)]+)/);
            }
        } else if (userAgent.includes('Tablet')) {
            analysis.device.type = 'Tablet';
        } else {
            analysis.device.type = 'Desktop';
        }

        return analysis;
    }

    extractVersion(userAgent, regex) {
        const match = userAgent.match(regex);
        return match ? match[1] : 'Unknown';
    }

    getWindowsVersion(ntVersion) {
        const versions = {
            '10.0': 'Windows 10/11',
            '6.3': 'Windows 8.1',
            '6.2': 'Windows 8',
            '6.1': 'Windows 7',
            '6.0': 'Windows Vista',
            '5.1': 'Windows XP',
            '5.0': 'Windows 2000'
        };
        return versions[ntVersion] || `Windows NT ${ntVersion}`;
    }

    extractSamsungModel(userAgent) {
        const match = userAgent.match(/SM-([A-Z0-9]+)/);
        return match ? `Galaxy ${match[1]}` : 'Galaxy Device';
    }

    updateAnalysisDisplay(analysis) {
        // Browser info
        this.elements.browserName.textContent = analysis.browser.name;
        this.elements.browserVersion.textContent = analysis.browser.version;
        this.elements.browserEngine.textContent = analysis.browser.engine;
        this.elements.engineVersion.textContent = analysis.browser.engineVersion;

        // OS info
        this.elements.osName.textContent = analysis.os.name;
        this.elements.osVersion.textContent = analysis.os.version;
        this.elements.osArch.textContent = analysis.os.arch;
        this.elements.platform.textContent = navigator.platform || 'Unknown';

        // Device info
        this.elements.deviceType.textContent = analysis.device.type;
        this.elements.deviceVendor.textContent = analysis.device.vendor;
        this.elements.deviceModel.textContent = analysis.device.model;
    }

    updateAdditionalInfo() {
        // Touch support
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.elements.touchSupport.textContent = hasTouch ? 'Yes' : 'No';

        // Screen info
        this.elements.screenResolution.textContent = `${screen.width} × ${screen.height}`;
        this.elements.colorDepth.textContent = `${screen.colorDepth}-bit`;

        // Timezone
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            this.elements.timezone.textContent = timezone;
        } catch (e) {
            this.elements.timezone.textContent = 'Unknown';
        }

        // Language
        this.elements.language.textContent = navigator.language || 'Unknown';
    }

    updateBreakdown(userAgent) {
        const parts = this.parseUserAgentParts(userAgent);
        
        this.elements.productInfo.textContent = parts.product || 'No product information found';
        this.elements.systemInfo.textContent = parts.system || 'No system information found';
        this.elements.extensionsInfo.textContent = parts.extensions || 'No extensions information found';
    }

    parseUserAgentParts(userAgent) {
        const parts = {
            product: '',
            system: '',
            extensions: ''
        };

        // Split by major sections
        const mozillaMatch = userAgent.match(/^Mozilla\/[\d.]+\s*\(([^)]+)\)\s*(.*)/);
        
        if (mozillaMatch) {
            parts.system = mozillaMatch[1].trim();
            parts.extensions = mozillaMatch[2].trim();
        }

        // Extract product info (first part)
        const productMatch = userAgent.match(/^([^(]+)/);
        if (productMatch) {
            parts.product = productMatch[1].trim();
        }

        return parts;
    }

    clearCustomInput() {
        this.elements.customUAInput.value = '';
        this.analyzeCurrentBrowser();
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('User agent copied to clipboard!', 'success');
            
            // Update button text temporarily
            const originalText = this.elements.copyUABtn.textContent;
            this.elements.copyUABtn.textContent = 'Copied!';
            setTimeout(() => {
                this.elements.copyUABtn.textContent = originalText;
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showNotification('User agent copied to clipboard!', 'success');
            } catch (fallbackErr) {
                this.showNotification('Failed to copy to clipboard', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Styles for notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Type-specific colors
        const colors = {
            success: '#16a34a',
            error: '#dc2626',
            warning: '#ea580c',
            info: '#2563eb'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the tool when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UserAgentChecker();
});
