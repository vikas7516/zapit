// Hash Generator Tool - JavaScript functionality

class HashGeneratorTool {
    constructor() {
        this.currentData = null;
        this.currentFile = null;
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupThemeToggle();
        this.loadCryptoJS();
    }

    setupElements() {
        this.inputText = document.getElementById('inputText');
        this.fileInput = document.getElementById('fileInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.inputEncoding = document.getElementById('inputEncoding');
        this.generateBtn = document.getElementById('generateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.hashResults = document.getElementById('hashResults');
        this.compareHash = document.getElementById('compareHash');
        this.compareBtn = document.getElementById('compareBtn');
        this.comparisonResult = document.getElementById('comparisonResult');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.selectNoneBtn = document.getElementById('selectNoneBtn');
        this.selectCommonBtn = document.getElementById('selectCommonBtn');
    }

    setupEventListeners() {
        this.generateBtn.addEventListener('click', this.generateHashes.bind(this));
        this.clearBtn.addEventListener('click', this.clearAll.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.compareBtn.addEventListener('click', this.compareHashes.bind(this));
        
        this.selectAllBtn.addEventListener('click', () => this.toggleAlgorithms(true));
        this.selectNoneBtn.addEventListener('click', () => this.toggleAlgorithms(false));
        this.selectCommonBtn.addEventListener('click', this.selectCommonAlgorithms.bind(this));

        // Auto-generate on input change
        this.inputText.addEventListener('input', this.autoGenerate.bind(this));
        this.inputEncoding.addEventListener('change', this.autoGenerate.bind(this));

        // Algorithm checkboxes
        ['md5', 'sha1', 'sha256', 'sha384', 'sha512'].forEach(algo => {
            document.getElementById(algo).addEventListener('change', this.autoGenerate.bind(this));
        });

        // Output format radios
        document.querySelectorAll('input[name="outputFormat"]').forEach(radio => {
            radio.addEventListener('change', this.autoGenerate.bind(this));
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        document.documentElement.setAttribute('data-theme', currentTheme);
        this.updateThemeIcon(currentTheme);
        this.updateToolTheme(currentTheme);

        themeToggle?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(newTheme);
            this.updateToolTheme(newTheme);
        });
    }

    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    updateToolTheme(theme) {
        const toolThemeCss = document.getElementById('tool-theme-css');
        if (toolThemeCss) {
            toolThemeCss.href = theme === 'dark' ? 'dark.css' : 'light.css';
        }
    }

    async loadCryptoJS() {
        // Load crypto-js library for hashing
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js';
        script.onload = () => {
            this.cryptoLoaded = true;
            if (this.inputText.value || this.currentFile) {
                this.generateHashes();
            }
        };
        script.onerror = () => {
            this.showToast('Failed to load crypto library. Using browser native crypto.', 'warning');
            this.cryptoLoaded = false;
        };
        document.head.appendChild(script);
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.currentFile = file;
            this.inputText.value = '';
            
            this.fileInfo.innerHTML = `
                <div class="file-details">
                    <strong>${file.name}</strong>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                    <span class="file-type">${file.type || 'Unknown type'}</span>
                </div>
            `;
            this.fileInfo.classList.remove('hidden');
            
            this.generateHashes();
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    toggleAlgorithms(selectAll) {
        ['md5', 'sha1', 'sha256', 'sha384', 'sha512'].forEach(algo => {
            document.getElementById(algo).checked = selectAll;
        });
        this.autoGenerate();
    }

    selectCommonAlgorithms() {
        document.getElementById('md5').checked = true;
        document.getElementById('sha1').checked = true;
        document.getElementById('sha256').checked = true;
        document.getElementById('sha384').checked = false;
        document.getElementById('sha512').checked = false;
        this.autoGenerate();
    }

    autoGenerate() {
        if (this.inputText.value || this.currentFile) {
            this.generateHashes();
        }
    }

    async generateHashes() {
        if (!this.inputText.value && !this.currentFile) {
            this.showEmpty();
            return;
        }

        this.showLoading();

        try {
            let data;
            if (this.currentFile) {
                data = await this.readFileAsArrayBuffer(this.currentFile);
            } else {
                data = this.processInputText(this.inputText.value);
            }

            const selectedAlgorithms = this.getSelectedAlgorithms();
            if (selectedAlgorithms.length === 0) {
                this.showToast('Please select at least one hash algorithm', 'error');
                return;
            }

            const results = await this.calculateHashes(data, selectedAlgorithms);
            this.displayResults(results);
            
        } catch (error) {
            this.showToast('Error generating hashes: ' + error.message, 'error');
            console.error('Hash generation error:', error);
        }
    }

    processInputText(text) {
        const encoding = this.inputEncoding.value;
        
        try {
            switch (encoding) {
                case 'utf8':
                    return new TextEncoder().encode(text);
                case 'ascii':
                    return new TextEncoder().encode(text.replace(/[^\x00-\x7F]/g, ''));
                case 'base64':
                    return new Uint8Array(atob(text).split('').map(c => c.charCodeAt(0)));
                case 'hex':
                    return new Uint8Array(text.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                default:
                    return new TextEncoder().encode(text);
            }
        } catch (error) {
            throw new Error(`Invalid ${encoding} encoding`);
        }
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(new Uint8Array(e.target.result));
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    getSelectedAlgorithms() {
        const algorithms = [];
        ['md5', 'sha1', 'sha256', 'sha384', 'sha512'].forEach(algo => {
            if (document.getElementById(algo).checked) {
                algorithms.push(algo);
            }
        });
        return algorithms;
    }

    async calculateHashes(data, algorithms) {
        const results = {};
        const outputFormat = document.querySelector('input[name="outputFormat"]:checked').value;

        for (const algo of algorithms) {
            try {
                let hash;
                
                if (this.cryptoLoaded && window.CryptoJS) {
                    // Use crypto-js library
                    const wordArray = CryptoJS.lib.WordArray.create(data);
                    
                    switch (algo) {
                        case 'md5':
                            hash = CryptoJS.MD5(wordArray);
                            break;
                        case 'sha1':
                            hash = CryptoJS.SHA1(wordArray);
                            break;
                        case 'sha256':
                            hash = CryptoJS.SHA256(wordArray);
                            break;
                        case 'sha384':
                            hash = CryptoJS.SHA384(wordArray);
                            break;
                        case 'sha512':
                            hash = CryptoJS.SHA512(wordArray);
                            break;
                    }

                    // Format output
                    if (outputFormat === 'base64') {
                        results[algo] = hash.toString(CryptoJS.enc.Base64);
                    } else if (outputFormat === 'HEX') {
                        results[algo] = hash.toString(CryptoJS.enc.Hex).toUpperCase();
                    } else {
                        results[algo] = hash.toString(CryptoJS.enc.Hex);
                    }
                } else {
                    // Use browser SubtleCrypto API (limited algorithms)
                    if (['sha1', 'sha256', 'sha384', 'sha512'].includes(algo)) {
                        const algoName = algo.toUpperCase().replace(/(\d+)/, '-$1');
                        const hashBuffer = await crypto.subtle.digest(algoName, data);
                        const hashArray = new Uint8Array(hashBuffer);
                        
                        if (outputFormat === 'base64') {
                            results[algo] = btoa(String.fromCharCode(...hashArray));
                        } else {
                            const hex = Array.from(hashArray)
                                .map(b => b.toString(16).padStart(2, '0'))
                                .join('');
                            results[algo] = outputFormat === 'HEX' ? hex.toUpperCase() : hex;
                        }
                    } else if (algo === 'md5') {
                        results[algo] = 'MD5 requires crypto-js library (loading...)';
                    }
                }
            } catch (error) {
                results[algo] = `Error: ${error.message}`;
            }
        }

        return results;
    }

    displayResults(results) {
        const resultsHTML = Object.entries(results).map(([algorithm, hash]) => `
            <div class="hash-result">
                <div class="hash-header">
                    <span class="hash-algorithm">${algorithm.toUpperCase()}</span>
                    <div class="hash-actions">
                        <button onclick="hashGenerator.copyHash('${hash}')" class="btn btn-outline btn-sm" title="Copy hash">📋</button>
                        <button onclick="hashGenerator.downloadHash('${algorithm}', '${hash}')" class="btn btn-outline btn-sm" title="Download as file">💾</button>
                    </div>
                </div>
                <div class="hash-value" data-algorithm="${algorithm}">${hash}</div>
            </div>
        `).join('');

        this.hashResults.innerHTML = resultsHTML;
    }

    showLoading() {
        this.hashResults.innerHTML = '<div class="loading">Generating hashes...</div>';
    }

    showEmpty() {
        this.hashResults.innerHTML = '<div class="empty-state"><p>Enter text or select a file to generate hashes</p></div>';
    }

    copyHash(hash) {
        navigator.clipboard.writeText(hash).then(() => {
            this.showToast('Hash copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy hash', 'error');
        });
    }

    downloadHash(algorithm, hash) {
        const filename = `${algorithm}-hash.txt`;
        const content = `${algorithm.toUpperCase()} Hash:\n${hash}\n\nGenerated: ${new Date().toLocaleString()}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast(`${algorithm.toUpperCase()} hash downloaded!`, 'success');
    }

    compareHashes() {
        const inputHash = this.compareHash.value.trim().toLowerCase();
        if (!inputHash) {
            this.showToast('Please enter a hash to compare', 'error');
            return;
        }

        const resultElements = document.querySelectorAll('.hash-value');
        let matchFound = false;

        resultElements.forEach(element => {
            const generatedHash = element.textContent.toLowerCase();
            const algorithm = element.dataset.algorithm;
            
            if (generatedHash === inputHash) {
                matchFound = true;
                this.comparisonResult.innerHTML = `
                    <div class="comparison-match">
                        ✅ Hash matches ${algorithm.toUpperCase()} result!
                    </div>
                `;
                element.parentElement.classList.add('hash-match');
            } else {
                element.parentElement.classList.remove('hash-match');
            }
        });

        if (!matchFound) {
            this.comparisonResult.innerHTML = `
                <div class="comparison-no-match">
                    ❌ No matching hash found in current results.
                </div>
            `;
        }

        this.comparisonResult.classList.remove('hidden');
    }

    clearAll() {
        this.inputText.value = '';
        this.compareHash.value = '';
        this.fileInput.value = '';
        this.currentFile = null;
        this.fileInfo.classList.add('hidden');
        this.comparisonResult.classList.add('hidden');
        this.showEmpty();
        
        // Remove any match highlighting
        document.querySelectorAll('.hash-match').forEach(el => {
            el.classList.remove('hash-match');
        });
        
        this.showToast('All fields cleared', 'success');
    }

    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize the tool
const hashGenerator = new HashGeneratorTool();