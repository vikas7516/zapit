// Base64 Encoder/Decoder App
class Base64Tool {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.currentFile = null;
    }

    initializeElements() {
        // Tabs
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Text elements
        this.textInput = document.getElementById('text-input');
        this.textOutput = document.getElementById('text-output');
        this.encodeTextBtn = document.getElementById('encode-text');
        this.decodeTextBtn = document.getElementById('decode-text');
        this.clearTextBtn = document.getElementById('clear-text');
        this.copyTextBtn = document.getElementById('copy-text');

        // File elements
        this.fileInput = document.getElementById('file-input');
        this.fileUploadArea = document.getElementById('file-upload-area');
        this.fileInfo = document.getElementById('file-info');
        this.fileName = document.getElementById('file-name');
        this.fileSize = document.getElementById('file-size');
        this.fileType = document.getElementById('file-type');
        this.encodeFileBtn = document.getElementById('encode-file');
        this.decodeFileBtn = document.getElementById('decode-file');
        this.clearFileBtn = document.getElementById('clear-file');
        this.fileOutput = document.getElementById('file-output');
        this.fileOutputArea = document.getElementById('file-output-area');
        this.copyFileBtn = document.getElementById('copy-file');
        this.downloadFileBtn = document.getElementById('download-file');
    }

    attachEventListeners() {
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Text operations
        this.encodeTextBtn.addEventListener('click', () => this.encodeText());
        this.decodeTextBtn.addEventListener('click', () => this.decodeText());
        this.clearTextBtn.addEventListener('click', () => this.clearText());
        this.copyTextBtn.addEventListener('click', () => this.copyText());

        // File operations
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        this.encodeFileBtn.addEventListener('click', () => this.encodeFile());
        this.decodeFileBtn.addEventListener('click', () => this.decodeFile());
        this.clearFileBtn.addEventListener('click', () => this.clearFile());
        this.copyFileBtn.addEventListener('click', () => this.copyFileOutput());
        this.downloadFileBtn.addEventListener('click', () => this.downloadDecodedFile());

        // Drag and drop
        this.fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.add('dragover');
        });

        this.fileUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.remove('dragover');
        });

        this.fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.fileUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        // Auto-detect Base64 and enable decode button
        this.textInput.addEventListener('input', () => this.checkBase64Input());
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab contents
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    encodeText() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.showMessage('Please enter some text to encode.', 'error');
            return;
        }

        try {
            const encoded = btoa(unescape(encodeURIComponent(text)));
            this.textOutput.value = encoded;
            this.showMessage('Text encoded successfully!', 'success');
        } catch (error) {
            this.showMessage('Error encoding text: ' + error.message, 'error');
        }
    }

    decodeText() {
        const base64 = this.textInput.value.trim();
        if (!base64) {
            this.showMessage('Please enter Base64 string to decode.', 'error');
            return;
        }

        if (!this.isValidBase64(base64)) {
            this.showMessage('Invalid Base64 format.', 'error');
            return;
        }

        try {
            const decoded = decodeURIComponent(escape(atob(base64)));
            this.textOutput.value = decoded;
            this.showMessage('Base64 decoded successfully!', 'success');
        } catch (error) {
            this.showMessage('Error decoding Base64: ' + error.message, 'error');
        }
    }

    clearText() {
        this.textInput.value = '';
        this.textOutput.value = '';
        this.textInput.classList.remove('success', 'error');
        this.textOutput.classList.remove('success', 'error');
    }

    copyText() {
        if (!this.textOutput.value) {
            this.showMessage('No output to copy.', 'error');
            return;
        }

        navigator.clipboard.writeText(this.textOutput.value).then(() => {
            this.showMessage('Copied to clipboard!', 'success');
        }).catch(() => {
            this.showMessage('Failed to copy to clipboard.', 'error');
        });
    }

    handleFileSelect(file) {
        if (!file) return;

        this.currentFile = file;
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.fileType.textContent = file.type || 'unknown';
        
        this.fileInfo.style.display = 'block';
        this.encodeFileBtn.disabled = false;
        
        // If it's a text file with base64 content, enable decode
        if (file.type.startsWith('text/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                if (this.isValidBase64(content)) {
                    this.decodeFileBtn.disabled = false;
                }
            };
            reader.readAsText(file);
        }
    }

    encodeFile() {
        if (!this.currentFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const base64 = btoa(
                    new Uint8Array(e.target.result)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                
                this.fileOutput.value = base64;
                this.fileOutputArea.style.display = 'block';
                this.showMessage('File encoded to Base64 successfully!', 'success');
            } catch (error) {
                this.showMessage('Error encoding file: ' + error.message, 'error');
            }
        };
        reader.readAsArrayBuffer(this.currentFile);
    }

    decodeFile() {
        const base64Input = this.fileOutput.value || (this.currentFile ? '' : prompt('Enter Base64 string:'));
        
        if (!base64Input) {
            this.showMessage('Please provide Base64 string to decode.', 'error');
            return;
        }

        if (!this.isValidBase64(base64Input)) {
            this.showMessage('Invalid Base64 format.', 'error');
            return;
        }

        try {
            const binaryString = atob(base64Input);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            this.decodedFileData = bytes;
            this.downloadFileBtn.style.display = 'inline-block';
            this.showMessage('Base64 decoded successfully! Click download to save file.', 'success');
        } catch (error) {
            this.showMessage('Error decoding Base64: ' + error.message, 'error');
        }
    }

    downloadDecodedFile() {
        if (!this.decodedFileData) return;

        const blob = new Blob([this.decodedFileData]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = this.currentFile ? 
            `decoded_${this.currentFile.name}` : 
            `decoded_file_${Date.now()}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearFile() {
        this.currentFile = null;
        this.decodedFileData = null;
        this.fileInput.value = '';
        this.fileOutput.value = '';
        this.fileInfo.style.display = 'none';
        this.fileOutputArea.style.display = 'none';
        this.downloadFileBtn.style.display = 'none';
        this.encodeFileBtn.disabled = true;
        this.decodeFileBtn.disabled = true;
    }

    copyFileOutput() {
        if (!this.fileOutput.value) {
            this.showMessage('No output to copy.', 'error');
            return;
        }

        navigator.clipboard.writeText(this.fileOutput.value).then(() => {
            this.showMessage('Copied to clipboard!', 'success');
        }).catch(() => {
            this.showMessage('Failed to copy to clipboard.', 'error');
        });
    }

    checkBase64Input() {
        const input = this.textInput.value.trim();
        // Auto-detect if input looks like Base64
        if (input && this.isValidBase64(input)) {
            this.textInput.classList.add('success');
        } else {
            this.textInput.classList.remove('success');
        }
    }

    isValidBase64(str) {
        if (!str || str.length === 0) return false;
        
        // Basic Base64 pattern check
        const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
        
        // Check if string matches pattern and length is multiple of 4
        if (!base64Pattern.test(str) || str.length % 4 !== 0) {
            return false;
        }

        try {
            // Try to decode to verify it's valid
            atob(str);
            return true;
        } catch (e) {
            return false;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showMessage(message, type) {
        // Create a temporary notification
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the tool when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Base64Tool();
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
