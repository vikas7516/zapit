class JSONFormatter {
    constructor() {
        this.init();
    }

    init() {
        this.elements = {
            // Input elements
            jsonInput: document.getElementById('json-input'),
            charCount: document.getElementById('char-count'),
            validationStatus: document.getElementById('validation-status'),
            
            // Action buttons
            loadSampleBtn: document.getElementById('load-sample'),
            clearInputBtn: document.getElementById('clear-input'),
            formatBtn: document.getElementById('format-btn'),
            minifyBtn: document.getElementById('minify-btn'),
            validateBtn: document.getElementById('validate-btn'),
            
            // Options
            indentSize: document.getElementById('indent-size'),
            sortKeys: document.getElementById('sort-keys'),
            
            // Output elements
            jsonOutput: document.getElementById('json-output'),
            copyOutputBtn: document.getElementById('copy-output'),
            downloadBtn: document.getElementById('download-json'),
            outputSize: document.getElementById('output-size'),
            compressionRatio: document.getElementById('compression-ratio'),
            
            // Tree view
            jsonTree: document.getElementById('json-tree'),
            expandAllBtn: document.getElementById('expand-all'),
            collapseAllBtn: document.getElementById('collapse-all'),
            
            // Error section
            errorSection: document.getElementById('error-section'),
            errorDetails: document.getElementById('error-details'),
            
            // Statistics
            statObjects: document.getElementById('stat-objects'),
            statArrays: document.getElementById('stat-arrays'),
            statProperties: document.getElementById('stat-properties'),
            statDepth: document.getElementById('stat-depth'),
            statTypes: document.getElementById('stat-types'),
            statSize: document.getElementById('stat-size')
        };

        this.currentJSON = null;
        this.bindEvents();
        this.updateCharCount();
        this.updateValidationStatus('ready');
    }

    bindEvents() {
        // Input events
        this.elements.jsonInput.addEventListener('input', () => {
            this.updateCharCount();
            this.debounceValidation();
        });

        // Action buttons
        this.elements.loadSampleBtn.addEventListener('click', () => this.loadSampleJSON());
        this.elements.clearInputBtn.addEventListener('click', () => this.clearInput());
        this.elements.formatBtn.addEventListener('click', () => this.formatJSON());
        this.elements.minifyBtn.addEventListener('click', () => this.minifyJSON());
        this.elements.validateBtn.addEventListener('click', () => this.validateJSON());
        
        // Output buttons
        this.elements.copyOutputBtn.addEventListener('click', () => this.copyOutput());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadJSON());
        
        // Tree view buttons
        this.elements.expandAllBtn.addEventListener('click', () => this.expandAllNodes());
        this.elements.collapseAllBtn.addEventListener('click', () => this.collapseAllNodes());

        // Setup debounced validation
        this.debounceTimer = null;
    }

    debounceValidation() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const input = this.elements.jsonInput.value.trim();
            if (input) {
                this.validateJSON(false); // Silent validation
            } else {
                this.updateValidationStatus('ready');
                this.hideErrors();
                this.clearStats();
            }
        }, 500);
    }

    updateCharCount() {
        const count = this.elements.jsonInput.value.length;
        this.elements.charCount.textContent = count.toLocaleString();
    }

    updateValidationStatus(status, message = '') {
        this.elements.validationStatus.className = `status ${status}`;
        
        const statusText = {
            ready: 'Ready',
            valid: 'Valid JSON',
            invalid: 'Invalid JSON',
            processing: 'Processing...'
        };
        
        this.elements.validationStatus.textContent = message || statusText[status] || status;
    }

    loadSampleJSON() {
        const sampleJSON = {
            "name": "John Doe",
            "age": 30,
            "email": "john.doe@example.com",
            "address": {
                "street": "123 Main St",
                "city": "New York",
                "zipCode": "10001",
                "country": "USA"
            },
            "hobbies": ["reading", "coding", "traveling"],
            "skills": {
                "programming": ["JavaScript", "Python", "Java"],
                "languages": ["English", "Spanish"],
                "experience": 5
            },
            "active": true,
            "salary": null,
            "projects": [
                {
                    "name": "Website Redesign",
                    "status": "completed",
                    "duration": 6
                },
                {
                    "name": "Mobile App",
                    "status": "in-progress",
                    "duration": 12
                }
            ]
        };

        this.elements.jsonInput.value = JSON.stringify(sampleJSON, null, 2);
        this.updateCharCount();
        this.validateJSON();
        this.showNotification('Sample JSON loaded!', 'success');
    }

    clearInput() {
        this.elements.jsonInput.value = '';
        this.elements.jsonOutput.textContent = '';
        this.elements.jsonTree.innerHTML = '';
        this.updateCharCount();
        this.updateValidationStatus('ready');
        this.hideErrors();
        this.clearStats();
        this.updateOutputInfo(0, 0);
    }

    validateJSON(showNotification = true) {
        const input = this.elements.jsonInput.value.trim();
        
        if (!input) {
            this.updateValidationStatus('ready');
            this.hideErrors();
            this.clearStats();
            return false;
        }

        this.updateValidationStatus('processing');

        try {
            this.currentJSON = JSON.parse(input);
            this.updateValidationStatus('valid');
            this.hideErrors();
            this.updateStatistics(this.currentJSON);
            
            if (showNotification) {
                this.showNotification('JSON is valid!', 'success');
            }
            return true;
        } catch (error) {
            this.updateValidationStatus('invalid');
            this.showErrors(error, input);
            this.clearStats();
            
            if (showNotification) {
                this.showNotification('JSON validation failed', 'error');
            }
            return false;
        }
    }

    formatJSON() {
        if (!this.validateJSON()) {
            return;
        }

        try {
            const indentValue = this.elements.indentSize.value;
            const sortKeys = this.elements.sortKeys.checked;
            const indent = indentValue === 'tab' ? '\t' : parseInt(indentValue);
            
            let jsonToFormat = this.currentJSON;
            if (sortKeys) {
                jsonToFormat = this.sortObjectKeys(this.currentJSON);
            }

            const formatted = JSON.stringify(jsonToFormat, null, indent);
            this.displayOutput(formatted);
            this.generateTreeView(this.currentJSON);
            this.showNotification('JSON formatted successfully!', 'success');
        } catch (error) {
            this.showNotification('Error formatting JSON: ' + error.message, 'error');
        }
    }

    minifyJSON() {
        if (!this.validateJSON()) {
            return;
        }

        try {
            const sortKeys = this.elements.sortKeys.checked;
            let jsonToMinify = this.currentJSON;
            
            if (sortKeys) {
                jsonToMinify = this.sortObjectKeys(this.currentJSON);
            }

            const minified = JSON.stringify(jsonToMinify);
            this.displayOutput(minified);
            this.generateTreeView(this.currentJSON);
            this.showNotification('JSON minified successfully!', 'success');
        } catch (error) {
            this.showNotification('Error minifying JSON: ' + error.message, 'error');
        }
    }

    sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        }

        const sortedKeys = Object.keys(obj).sort();
        const sortedObj = {};
        
        for (const key of sortedKeys) {
            sortedObj[key] = this.sortObjectKeys(obj[key]);
        }
        
        return sortedObj;
    }

    displayOutput(jsonString) {
        this.elements.jsonOutput.textContent = jsonString;
        
        const inputSize = new Blob([this.elements.jsonInput.value]).size;
        const outputSize = new Blob([jsonString]).size;
        
        this.updateOutputInfo(outputSize, inputSize);
        this.applySyntaxHighlighting();
    }

    updateOutputInfo(outputSize, inputSize) {
        this.elements.outputSize.textContent = this.formatBytes(outputSize);
        
        if (inputSize > 0 && outputSize !== inputSize) {
            const ratio = ((inputSize - outputSize) / inputSize * 100).toFixed(1);
            const change = outputSize < inputSize ? 'reduction' : 'increase';
            this.elements.compressionRatio.textContent = `${Math.abs(ratio)}% ${change}`;
        } else {
            this.elements.compressionRatio.textContent = '';
        }
    }

    applySyntaxHighlighting() {
        const output = this.elements.jsonOutput;
        const jsonString = output.textContent;
        
        // Simple syntax highlighting using regex
        const highlighted = jsonString
            .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
            .replace(/"([^"]*)"(?=\s*[,\]\}])/g, '<span class="json-string">"$1"</span>')
            .replace(/\b(\d+\.?\d*)\b/g, '<span class="json-number">$1</span>')
            .replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>')
            .replace(/\bnull\b/g, '<span class="json-null">null</span>');
        
        output.innerHTML = highlighted;
    }

    generateTreeView(obj) {
        this.elements.jsonTree.innerHTML = '';
        const treeHTML = this.createTreeNode(obj, 'root', 0);
        this.elements.jsonTree.innerHTML = treeHTML;
        this.bindTreeEvents();
    }

    createTreeNode(value, key, depth) {
        const indent = '  '.repeat(depth);
        
        if (value === null) {
            return `${indent}<div class="tree-node">
                <span class="tree-key">${key}:</span> <span class="tree-null">null</span>
            </div>`;
        }

        if (typeof value === 'string') {
            return `${indent}<div class="tree-node">
                <span class="tree-key">${key}:</span> <span class="tree-string">"${this.escapeHtml(value)}"</span>
            </div>`;
        }

        if (typeof value === 'number') {
            return `${indent}<div class="tree-node">
                <span class="tree-key">${key}:</span> <span class="tree-number">${value}</span>
            </div>`;
        }

        if (typeof value === 'boolean') {
            return `${indent}<div class="tree-node">
                <span class="tree-key">${key}:</span> <span class="tree-boolean">${value}</span>
            </div>`;
        }

        if (Array.isArray(value)) {
            const toggle = value.length > 0 ? '<span class="tree-toggle">▼</span>' : '';
            let html = `${indent}<div class="tree-node">
                ${toggle}<span class="tree-key">${key}:</span> [${value.length} items]
            </div>`;
            
            if (value.length > 0) {
                html += `${indent}<div class="tree-children">`;
                value.forEach((item, index) => {
                    html += this.createTreeNode(item, index, depth + 1);
                });
                html += `${indent}</div>`;
            }
            
            return html;
        }

        if (typeof value === 'object') {
            const keys = Object.keys(value);
            const toggle = keys.length > 0 ? '<span class="tree-toggle">▼</span>' : '';
            let html = `${indent}<div class="tree-node">
                ${toggle}<span class="tree-key">${key}:</span> {${keys.length} properties}
            </div>`;
            
            if (keys.length > 0) {
                html += `${indent}<div class="tree-children">`;
                keys.forEach(objKey => {
                    html += this.createTreeNode(value[objKey], objKey, depth + 1);
                });
                html += `${indent}</div>`;
            }
            
            return html;
        }

        return `${indent}<div class="tree-node">
            <span class="tree-key">${key}:</span> <span>${this.escapeHtml(String(value))}</span>
        </div>`;
    }

    bindTreeEvents() {
        const toggles = this.elements.jsonTree.querySelectorAll('.tree-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const children = toggle.parentNode.nextElementSibling;
                if (children && children.classList.contains('tree-children')) {
                    children.classList.toggle('collapsed');
                    toggle.textContent = children.classList.contains('collapsed') ? '▶' : '▼';
                }
            });
        });
    }

    expandAllNodes() {
        const children = this.elements.jsonTree.querySelectorAll('.tree-children');
        const toggles = this.elements.jsonTree.querySelectorAll('.tree-toggle');
        
        children.forEach(child => child.classList.remove('collapsed'));
        toggles.forEach(toggle => toggle.textContent = '▼');
    }

    collapseAllNodes() {
        const children = this.elements.jsonTree.querySelectorAll('.tree-children');
        const toggles = this.elements.jsonTree.querySelectorAll('.tree-toggle');
        
        children.forEach(child => child.classList.add('collapsed'));
        toggles.forEach(toggle => toggle.textContent = '▶');
    }

    updateStatistics(obj) {
        const stats = this.analyzeJSON(obj);
        
        this.elements.statObjects.textContent = stats.objects;
        this.elements.statArrays.textContent = stats.arrays;
        this.elements.statProperties.textContent = stats.properties;
        this.elements.statDepth.textContent = stats.maxDepth;
        this.elements.statTypes.textContent = stats.types.join(', ');
        this.elements.statSize.textContent = this.formatBytes(stats.size);
    }

    analyzeJSON(obj, depth = 0) {
        const stats = {
            objects: 0,
            arrays: 0,
            properties: 0,
            maxDepth: depth,
            types: new Set(),
            size: 0
        };

        stats.size = new Blob([JSON.stringify(obj)]).size;

        const analyze = (value, currentDepth) => {
            stats.maxDepth = Math.max(stats.maxDepth, currentDepth);

            if (value === null) {
                stats.types.add('null');
            } else if (Array.isArray(value)) {
                stats.arrays++;
                stats.types.add('array');
                value.forEach(item => analyze(item, currentDepth + 1));
            } else if (typeof value === 'object') {
                stats.objects++;
                stats.types.add('object');
                const keys = Object.keys(value);
                stats.properties += keys.length;
                keys.forEach(key => analyze(value[key], currentDepth + 1));
            } else {
                stats.types.add(typeof value);
            }
        };

        analyze(obj, 0);
        stats.types = Array.from(stats.types);
        
        return stats;
    }

    clearStats() {
        this.elements.statObjects.textContent = '-';
        this.elements.statArrays.textContent = '-';
        this.elements.statProperties.textContent = '-';
        this.elements.statDepth.textContent = '-';
        this.elements.statTypes.textContent = '-';
        this.elements.statSize.textContent = '-';
    }

    showErrors(error, input) {
        this.elements.errorSection.classList.remove('hidden');
        
        let errorMessage = `Error: ${error.message}\n\n`;
        
        // Try to provide helpful error details
        if (error.message.includes('position')) {
            const position = this.extractPosition(error.message);
            if (position !== null) {
                const lines = input.split('\n');
                const errorLine = this.getLineAndColumn(input, position);
                
                errorMessage += `Line ${errorLine.line}, Column ${errorLine.column}\n`;
                errorMessage += `Near: "${input.substring(Math.max(0, position - 10), position + 10)}"\n\n`;
                
                if (lines[errorLine.line - 1]) {
                    errorMessage += `${errorLine.line}: ${lines[errorLine.line - 1]}\n`;
                    errorMessage += ' '.repeat(errorLine.column + String(errorLine.line).length + 1) + '^';
                }
            }
        }

        this.elements.errorDetails.textContent = errorMessage;
    }

    hideErrors() {
        this.elements.errorSection.classList.add('hidden');
    }

    extractPosition(message) {
        const match = message.match(/position (\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    getLineAndColumn(text, position) {
        const lines = text.substring(0, position).split('\n');
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    async copyOutput() {
        const output = this.elements.jsonOutput.textContent;
        if (!output) {
            this.showNotification('No output to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(output);
            this.showNotification('Output copied to clipboard!', 'success');
            
            // Update button text temporarily
            const originalText = this.elements.copyOutputBtn.textContent;
            this.elements.copyOutputBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.elements.copyOutputBtn.textContent = originalText;
            }, 2000);
        } catch (err) {
            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = output;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showNotification('Output copied to clipboard!', 'success');
            } catch (fallbackErr) {
                this.showNotification('Failed to copy to clipboard', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    downloadJSON() {
        const output = this.elements.jsonOutput.textContent;
        if (!output) {
            this.showNotification('No output to download', 'warning');
            return;
        }

        try {
            const blob = new Blob([output], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'formatted.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('JSON file downloaded!', 'success');
        } catch (error) {
            this.showNotification('Error downloading file: ' + error.message, 'error');
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 bytes';
        
        const k = 1024;
        const sizes = ['bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
    new JSONFormatter();
});
