// Code Minifier & Beautifier App
class CodeProcessor {
    constructor() {
        this.currentLanguage = 'html';
        this.initializeElements();
        this.attachEventListeners();
        this.updateStats();
    }

    initializeElements() {
        // Language tabs
        this.langBtns = document.querySelectorAll('.lang-btn');
        
        // Input/Output elements
        this.codeInput = document.getElementById('code-input');
        this.codeOutput = document.getElementById('code-output');
        
        // Buttons
        this.minifyBtn = document.getElementById('minify-btn');
        this.beautifyBtn = document.getElementById('beautify-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.copyBtn = document.getElementById('copy-output');
        
        // Stats elements
        this.inputChars = document.getElementById('input-chars');
        this.inputLines = document.getElementById('input-lines');
        this.outputChars = document.getElementById('output-chars');
        this.outputLines = document.getElementById('output-lines');
        this.compressionRatio = document.getElementById('compression');
        this.compressionContainer = document.querySelector('.compression-ratio');
        
        // Option groups
        this.optionGroups = {
            html: document.querySelector('.html-options'),
            css: document.querySelector('.css-options'),
            javascript: document.querySelector('.js-options'),
            json: document.querySelector('.json-options')
        };
    }

    attachEventListeners() {
        // Language selection
        this.langBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchLanguage(e.target.dataset.lang));
        });

        // Input events
        this.codeInput.addEventListener('input', () => this.updateStats());
        this.codeInput.addEventListener('paste', () => {
            setTimeout(() => this.updateStats(), 100);
        });

        // Button events
        this.minifyBtn.addEventListener('click', () => this.minifyCode());
        this.beautifyBtn.addEventListener('click', () => this.beautifyCode());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyBtn.addEventListener('click', () => this.copyOutput());
    }

    switchLanguage(language) {
        this.currentLanguage = language;
        
        // Update button states
        this.langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === language);
        });
        
        // Show/hide option groups
        Object.keys(this.optionGroups).forEach(key => {
            this.optionGroups[key].classList.toggle('hidden', key !== language);
        });
        
        // Update placeholder
        const placeholders = {
            html: 'Enter HTML code here...',
            css: 'Enter CSS code here...',
            javascript: 'Enter JavaScript code here...',
            json: 'Enter JSON data here...'
        };
        this.codeInput.placeholder = placeholders[language];
        
        // Clear previous output
        this.codeOutput.value = '';
        this.updateStats();
    }

    minifyCode() {
        const input = this.codeInput.value.trim();
        if (!input) {
            this.showMessage('Please enter some code to minify.', 'error');
            return;
        }

        this.setProcessing(true);

        try {
            let minified;
            switch (this.currentLanguage) {
                case 'html':
                    minified = this.minifyHTML(input);
                    break;
                case 'css':
                    minified = this.minifyCSS(input);
                    break;
                case 'javascript':
                    minified = this.minifyJavaScript(input);
                    break;
                case 'json':
                    minified = this.minifyJSON(input);
                    break;
                default:
                    throw new Error('Unsupported language');
            }
            
            this.codeOutput.value = minified;
            this.codeOutput.classList.add('success-state');
            setTimeout(() => this.codeOutput.classList.remove('success-state'), 2000);
            
            this.updateStats();
            this.showMessage('Code minified successfully!', 'success');
            
        } catch (error) {
            this.codeOutput.classList.add('error-state');
            setTimeout(() => this.codeOutput.classList.remove('error-state'), 2000);
            this.showMessage('Error minifying code: ' + error.message, 'error');
        } finally {
            this.setProcessing(false);
        }
    }

    beautifyCode() {
        const input = this.codeInput.value.trim();
        if (!input) {
            this.showMessage('Please enter some code to beautify.', 'error');
            return;
        }

        this.setProcessing(true);

        try {
            let beautified;
            switch (this.currentLanguage) {
                case 'html':
                    beautified = this.beautifyHTML(input);
                    break;
                case 'css':
                    beautified = this.beautifyCSS(input);
                    break;
                case 'javascript':
                    beautified = this.beautifyJavaScript(input);
                    break;
                case 'json':
                    beautified = this.beautifyJSON(input);
                    break;
                default:
                    throw new Error('Unsupported language');
            }
            
            this.codeOutput.value = beautified;
            this.codeOutput.classList.add('success-state');
            setTimeout(() => this.codeOutput.classList.remove('success-state'), 2000);
            
            this.updateStats();
            this.showMessage('Code beautified successfully!', 'success');
            
        } catch (error) {
            this.codeOutput.classList.add('error-state');
            setTimeout(() => this.codeOutput.classList.remove('error-state'), 2000);
            this.showMessage('Error beautifying code: ' + error.message, 'error');
        } finally {
            this.setProcessing(false);
        }
    }

    minifyHTML(html) {
        let result = html;
        
        // Get options
        const removeComments = document.getElementById('html-remove-comments').checked;
        const collapseWhitespace = document.getElementById('html-collapse-whitespace').checked;
        const removeEmptyAttrs = document.getElementById('html-remove-empty-attrs').checked;
        
        if (removeComments) {
            result = result.replace(/<!--[\s\S]*?-->/g, '');
        }
        
        if (collapseWhitespace) {
            result = result.replace(/>\s+</g, '><');
            result = result.replace(/\s+/g, ' ');
            result = result.trim();
        }
        
        if (removeEmptyAttrs) {
            result = result.replace(/\s+(\w+)=""/g, '');
        }
        
        return result;
    }

    beautifyHTML(html) {
        let result = html;
        let indent = 0;
        const indentChar = '  ';
        
        // Simple HTML beautification
        result = result.replace(/></g, '>\n<');
        
        const lines = result.split('\n');
        const formatted = [];
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            
            if (line.startsWith('</')) {
                indent = Math.max(0, indent - 1);
            }
            
            formatted.push(indentChar.repeat(indent) + line);
            
            if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && !this.isVoidElement(line)) {
                indent++;
            }
        }
        
        return formatted.join('\n');
    }

    minifyCSS(css) {
        let result = css;
        
        // Get options
        const removeComments = document.getElementById('css-remove-comments').checked;
        
        if (removeComments) {
            result = result.replace(/\/\*[\s\S]*?\*\//g, '');
        }
        
        // Remove extra whitespace
        result = result.replace(/\s+/g, ' ');
        result = result.replace(/;\s*}/g, '}');
        result = result.replace(/\s*{\s*/g, '{');
        result = result.replace(/;\s*/g, ';');
        result = result.replace(/:\s*/g, ':');
        result = result.replace(/,\s*/g, ',');
        result = result.trim();
        
        return result;
    }

    beautifyCSS(css) {
        let result = css;
        const indentChar = '  ';
        
        // Add line breaks and formatting
        result = result.replace(/\{/g, ' {\n');
        result = result.replace(/\}/g, '\n}\n');
        result = result.replace(/;/g, ';\n');
        result = result.replace(/,/g, ',\n');
        
        const lines = result.split('\n');
        const formatted = [];
        let indent = 0;
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            
            if (line === '}') {
                indent = Math.max(0, indent - 1);
            }
            
            if (line !== '{' && line !== '}') {
                if (line.includes('{')) {
                    formatted.push(indentChar.repeat(indent) + line);
                    indent++;
                } else {
                    formatted.push(indentChar.repeat(indent + 1) + line);
                }
            } else {
                formatted.push(indentChar.repeat(indent) + line);
                if (line === '{') {
                    indent++;
                }
            }
        }
        
        return formatted.join('\n');
    }

    minifyJavaScript(js) {
        let result = js;
        
        // Get options
        const removeComments = document.getElementById('js-remove-comments').checked;
        const removeConsole = document.getElementById('js-remove-console').checked;
        
        if (removeComments) {
            // Remove single line comments
            result = result.replace(/\/\/.*$/gm, '');
            // Remove multi-line comments
            result = result.replace(/\/\*[\s\S]*?\*\//g, '');
        }
        
        if (removeConsole) {
            result = result.replace(/console\.(log|warn|error|info|debug)\s*\([^)]*\)\s*;?/g, '');
        }
        
        // Basic minification
        result = result.replace(/\s+/g, ' ');
        result = result.replace(/;\s*}/g, '}');
        result = result.replace(/\s*{\s*/g, '{');
        result = result.replace(/;\s*/g, ';');
        result = result.trim();
        
        return result;
    }

    beautifyJavaScript(js) {
        let result = js;
        const indentChar = '  ';
        
        // Add line breaks
        result = result.replace(/\{/g, ' {\n');
        result = result.replace(/\}/g, '\n}\n');
        result = result.replace(/;/g, ';\n');
        
        const lines = result.split('\n');
        const formatted = [];
        let indent = 0;
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            
            if (line === '}' || line.startsWith('}')) {
                indent = Math.max(0, indent - 1);
            }
            
            formatted.push(indentChar.repeat(indent) + line);
            
            if (line.includes('{') && !line.includes('}')) {
                indent++;
            }
        }
        
        return formatted.join('\n');
    }

    minifyJSON(json) {
        try {
            const parsed = JSON.parse(json);
            return JSON.stringify(parsed);
        } catch (error) {
            throw new Error('Invalid JSON format');
        }
    }

    beautifyJSON(json) {
        try {
            const parsed = JSON.parse(json);
            const indentValue = document.getElementById('json-indent').value;
            const sortKeys = document.getElementById('json-sort-keys').checked;
            
            let indent = indentValue === 'tab' ? '\t' : parseInt(indentValue);
            
            if (sortKeys) {
                return JSON.stringify(this.sortObjectKeys(parsed), null, indent);
            } else {
                return JSON.stringify(parsed, null, indent);
            }
        } catch (error) {
            throw new Error('Invalid JSON format');
        }
    }

    sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
            return obj;
        }
        
        const sorted = {};
        Object.keys(obj).sort().forEach(key => {
            sorted[key] = this.sortObjectKeys(obj[key]);
        });
        
        return sorted;
    }

    isVoidElement(tag) {
        const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
        const tagName = tag.match(/<(\w+)/);
        return tagName && voidElements.includes(tagName[1].toLowerCase());
    }

    updateStats() {
        const input = this.codeInput.value;
        const output = this.codeOutput.value;
        
        // Input stats
        this.inputChars.textContent = input.length.toLocaleString();
        this.inputLines.textContent = input ? input.split('\n').length : 0;
        
        // Output stats
        this.outputChars.textContent = output.length.toLocaleString();
        this.outputLines.textContent = output ? output.split('\n').length : 0;
        
        // Compression ratio
        if (input.length > 0 && output.length > 0) {
            const ratio = Math.round((1 - output.length / input.length) * 100);
            this.compressionRatio.textContent = ratio + '%';
            this.compressionContainer.classList.remove('hidden');
        } else {
            this.compressionContainer.classList.add('hidden');
        }
    }

    clearAll() {
        this.codeInput.value = '';
        this.codeOutput.value = '';
        this.codeInput.classList.remove('success-state', 'error-state');
        this.codeOutput.classList.remove('success-state', 'error-state');
        this.updateStats();
    }

    copyOutput() {
        if (!this.codeOutput.value) {
            this.showMessage('No output to copy.', 'error');
            return;
        }

        navigator.clipboard.writeText(this.codeOutput.value).then(() => {
            this.showMessage('Copied to clipboard!', 'success');
        }).catch(() => {
            this.showMessage('Failed to copy to clipboard.', 'error');
        });
    }

    setProcessing(processing) {
        const toolCard = document.querySelector('.tool-card');
        toolCard.classList.toggle('processing', processing);
        
        this.minifyBtn.disabled = processing;
        this.beautifyBtn.disabled = processing;
        
        if (processing) {
            this.minifyBtn.innerHTML = '<span class="btn-icon">⏳</span>Processing...';
            this.beautifyBtn.innerHTML = '<span class="btn-icon">⏳</span>Processing...';
        } else {
            this.minifyBtn.innerHTML = '<span class="btn-icon">🗜️</span>Minify Code';
            this.beautifyBtn.innerHTML = '<span class="btn-icon">✨</span>Beautify Code';
        }
    }

    showMessage(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the processor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CodeProcessor();
});

// Add CSS animations for notifications
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
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
