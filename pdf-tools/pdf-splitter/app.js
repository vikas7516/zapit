class PDFSplitter {
    constructor() {
        this.currentPDF = null;
        this.pdfDoc = null;
        this.totalPages = 0;
        this.selectedPages = new Set();
        this.currentMode = 'pages';
        this.customRanges = [];
        
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        // Cards
        this.uploadCard = document.getElementById('uploadCard');
        this.previewCard = document.getElementById('previewCard');
        this.progressCard = document.getElementById('progressCard');
        this.resultsCard = document.getElementById('resultsCard');
        
        // Upload elements
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Preview elements
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.filePagesCount = document.getElementById('filePagesCount');
        this.pageCount = document.getElementById('pageCount');
        this.pagesGrid = document.getElementById('pagesGrid');
        this.selectedPagesCount = document.getElementById('selectedPagesCount');
        
        // Mode tabs
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.optionContents = document.querySelectorAll('.option-content');
        
        // Range elements
        this.rangeInput = document.getElementById('rangeInput');
        this.addRangeBtn = document.getElementById('addRangeBtn');
        this.addedRanges = document.getElementById('addedRanges');
        this.presetBtns = document.querySelectorAll('.preset-btn');
        
        // Size elements
        this.maxPagesPerFile = document.getElementById('maxPagesPerFile');
        this.estimatedFiles = document.getElementById('estimatedFiles');
        
        // Action buttons
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        this.splitBtn = document.getElementById('splitBtn');
        this.newSplitBtn = document.getElementById('newSplitBtn');
        
        // Progress elements
        this.progressBar = document.getElementById('progressBar');
        this.progressPercent = document.getElementById('progressPercent');
        this.currentOperation = document.getElementById('currentOperation');
        
        // Results elements
        this.splitSummary = document.getElementById('splitSummary');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.individualFiles = document.getElementById('individualFiles');
    }

    bindEvents() {
        // Upload events
        this.uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadZone.addEventListener('drop', this.handleDrop.bind(this));
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.clearBtn.addEventListener('click', this.clearAll.bind(this));
        
        // Mode tabs
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });
        
        // Range events
        this.addRangeBtn.addEventListener('click', this.addCustomRange.bind(this));
        this.rangeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.addCustomRange();
        });
        
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => this.addPresetRange(btn.dataset.preset));
        });
        
        // Size events
        this.maxPagesPerFile.addEventListener('input', this.updateEstimatedFiles.bind(this));
        
        // Action buttons
        this.selectAllBtn.addEventListener('click', this.selectAllPages.bind(this));
        this.deselectAllBtn.addEventListener('click', this.deselectAllPages.bind(this));
        this.splitBtn.addEventListener('click', this.splitPDF.bind(this));
        this.newSplitBtn.addEventListener('click', this.startNewSplit.bind(this));
        
        // Download events
        this.downloadAllBtn.addEventListener('click', this.downloadAllFiles.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadZone.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadZone.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadZone.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        const pdfFile = files.find(file => file.type === 'application/pdf');
        
        if (pdfFile) {
            this.loadPDF(pdfFile);
        } else {
            this.showError('Please drop a PDF file');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadPDF(file);
        }
    }

    async loadPDF(file) {
        if (file.size > 50 * 1024 * 1024) {
            this.showError('File size must be less than 50MB');
            return;
        }

        try {
            this.showProgress(true);
            this.updateProgress(20, 'Loading PDF...');
            
            const arrayBuffer = await file.arrayBuffer();
            this.updateProgress(50, 'Parsing PDF structure...');
            
            this.pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            this.totalPages = this.pdfDoc.getPageCount();
            this.currentPDF = file;
            
            this.updateProgress(80, 'Generating preview...');
            
            // Update file info
            this.fileName.textContent = file.name;
            this.fileSize.textContent = this.formatFileSize(file.size);
            this.filePagesCount.textContent = `${this.totalPages} pages`;
            this.pageCount.textContent = `${this.totalPages} pages`;
            
            // Generate preview
            this.generatePagePreview();
            this.updateEstimatedFiles();
            
            this.updateProgress(100, 'Complete!');
            setTimeout(() => {
                this.showProgress(false);
                this.showPreview(true);
            }, 500);
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showError('Failed to load PDF. Please ensure it\'s a valid PDF file.');
            this.showProgress(false);
        }
    }

    generatePagePreview() {
        this.pagesGrid.innerHTML = '';
        this.selectedPages.clear();
        
        for (let i = 1; i <= this.totalPages; i++) {
            const pageElement = document.createElement('div');
            pageElement.className = 'page-item';
            pageElement.dataset.page = i.toString();
            
            pageElement.innerHTML = `
                <div class="page-checkbox">
                    <input type="checkbox" id="page-${i}" class="page-check">
                </div>
                <div class="page-preview">
                    <div class="page-number">${i}</div>
                </div>
                <div class="page-label">Page ${i}</div>
            `;
            
            const checkbox = pageElement.querySelector('.page-check');
            checkbox.addEventListener('change', () => this.togglePage(i, checkbox.checked));
            
            this.pagesGrid.appendChild(pageElement);
        }
        
        this.updateSelectedCount();
    }

    togglePage(pageNum, selected) {
        if (selected) {
            this.selectedPages.add(pageNum);
        } else {
            this.selectedPages.delete(pageNum);
        }
        this.updateSelectedCount();
        this.updateSplitButton();
    }

    selectAllPages() {
        this.selectedPages.clear();
        for (let i = 1; i <= this.totalPages; i++) {
            this.selectedPages.add(i);
        }
        
        document.querySelectorAll('.page-check').forEach(checkbox => {
            checkbox.checked = true;
        });
        
        this.updateSelectedCount();
        this.updateSplitButton();
    }

    deselectAllPages() {
        this.selectedPages.clear();
        
        document.querySelectorAll('.page-check').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.updateSelectedCount();
        this.updateSplitButton();
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Update content
        this.optionContents.forEach(content => {
            content.classList.toggle('active', content.id === `${mode}Mode`);
        });
        
        this.updateSplitButton();
    }

    addPresetRange(preset) {
        let range;
        switch (preset) {
            case 'first':
                range = '1';
                break;
            case 'last':
                range = this.totalPages.toString();
                break;
            case 'odd':
                const oddPages = [];
                for (let i = 1; i <= this.totalPages; i += 2) {
                    oddPages.push(i);
                }
                range = oddPages.join(',');
                break;
            case 'even':
                const evenPages = [];
                for (let i = 2; i <= this.totalPages; i += 2) {
                    evenPages.push(i);
                }
                range = evenPages.join(',');
                break;
        }
        
        if (range) {
            this.rangeInput.value = range;
            this.addCustomRange();
        }
    }

    addCustomRange() {
        const rangeText = this.rangeInput.value.trim();
        if (!rangeText) return;
        
        try {
            const pages = this.parseRange(rangeText);
            if (pages.length === 0) {
                throw new Error('No valid pages found');
            }
            
            const rangeObj = {
                text: rangeText,
                pages: pages,
                id: Date.now()
            };
            
            this.customRanges.push(rangeObj);
            this.renderCustomRanges();
            this.rangeInput.value = '';
            this.updateSplitButton();
            
        } catch (error) {
            this.showError(`Invalid range: ${error.message}`);
        }
    }

    parseRange(rangeText) {
        const pages = new Set();
        const parts = rangeText.split(',');
        
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(x => parseInt(x.trim()));
                if (isNaN(start) || isNaN(end) || start < 1 || end > this.totalPages || start > end) {
                    throw new Error(`Invalid range "${trimmed}"`);
                }
                for (let i = start; i <= end; i++) {
                    pages.add(i);
                }
            } else {
                const pageNum = parseInt(trimmed);
                if (isNaN(pageNum) || pageNum < 1 || pageNum > this.totalPages) {
                    throw new Error(`Invalid page number "${trimmed}"`);
                }
                pages.add(pageNum);
            }
        }
        
        return Array.from(pages).sort((a, b) => a - b);
    }

    renderCustomRanges() {
        this.addedRanges.innerHTML = '';
        
        this.customRanges.forEach(range => {
            const rangeElement = document.createElement('div');
            rangeElement.className = 'range-item';
            rangeElement.innerHTML = `
                <div class="range-info">
                    <span class="range-text">${range.text}</span>
                    <span class="range-pages">(${range.pages.length} pages)</span>
                </div>
                <button class="remove-range-btn" data-id="${range.id}">×</button>
            `;
            
            rangeElement.querySelector('.remove-range-btn').addEventListener('click', () => {
                this.removeCustomRange(range.id);
            });
            
            this.addedRanges.appendChild(rangeElement);
        });
    }

    removeCustomRange(id) {
        this.customRanges = this.customRanges.filter(range => range.id !== id);
        this.renderCustomRanges();
        this.updateSplitButton();
    }

    updateEstimatedFiles() {
        if (!this.totalPages) return;
        
        const maxPages = parseInt(this.maxPagesPerFile.value);
        const estimated = Math.ceil(this.totalPages / maxPages);
        this.estimatedFiles.textContent = estimated;
    }

    updateSelectedCount() {
        this.selectedPagesCount.textContent = `${this.selectedPages.size} pages selected`;
    }

    updateSplitButton() {
        let canSplit = false;
        
        switch (this.currentMode) {
            case 'pages':
                canSplit = this.selectedPages.size > 0;
                break;
            case 'ranges':
                canSplit = this.customRanges.length > 0;
                break;
            case 'size':
                canSplit = this.totalPages > 0 && parseInt(this.maxPagesPerFile.value) > 0;
                break;
        }
        
        this.splitBtn.disabled = !canSplit;
    }

    async splitPDF() {
        try {
            this.showPreview(false);
            this.showProgress(true);
            this.updateProgress(0, 'Preparing to split PDF...');
            
            let splitTasks = [];
            
            switch (this.currentMode) {
                case 'pages':
                    splitTasks = Array.from(this.selectedPages).map(page => ({
                        name: `page-${page}.pdf`,
                        pages: [page]
                    }));
                    break;
                    
                case 'ranges':
                    splitTasks = this.customRanges.map((range, index) => ({
                        name: `range-${index + 1}.pdf`,
                        pages: range.pages
                    }));
                    break;
                    
                case 'size':
                    const maxPages = parseInt(this.maxPagesPerFile.value);
                    for (let i = 0; i < this.totalPages; i += maxPages) {
                        const pages = [];
                        for (let j = i + 1; j <= Math.min(i + maxPages, this.totalPages); j++) {
                            pages.push(j);
                        }
                        splitTasks.push({
                            name: `part-${Math.floor(i / maxPages) + 1}.pdf`,
                            pages: pages
                        });
                    }
                    break;
            }
            
            this.splitResults = [];
            const totalTasks = splitTasks.length;
            
            for (let i = 0; i < totalTasks; i++) {
                const task = splitTasks[i];
                const progress = ((i + 1) / totalTasks) * 100;
                
                this.updateProgress(progress, `Creating ${task.name}...`);
                
                const newPdf = await PDFLib.PDFDocument.create();
                const pages = await newPdf.copyPages(this.pdfDoc, task.pages.map(p => p - 1));
                
                pages.forEach(page => newPdf.addPage(page));
                
                const pdfBytes = await newPdf.save();
                
                this.splitResults.push({
                    name: task.name,
                    data: pdfBytes,
                    pageCount: task.pages.length,
                    pages: task.pages
                });
            }
            
            this.updateProgress(100, 'Split complete!');
            
            setTimeout(() => {
                this.showProgress(false);
                this.showResults();
            }, 500);
            
        } catch (error) {
            console.error('Error splitting PDF:', error);
            this.showError('Failed to split PDF. Please try again.');
            this.showProgress(false);
            this.showPreview(true);
        }
    }

    showResults() {
        // Update summary
        const totalFiles = this.splitResults.length;
        const totalPages = this.splitResults.reduce((sum, result) => sum + result.pageCount, 0);
        
        this.splitSummary.innerHTML = `
            Successfully created <strong>${totalFiles}</strong> PDF file${totalFiles !== 1 ? 's' : ''} 
            containing <strong>${totalPages}</strong> page${totalPages !== 1 ? 's' : ''} total.
        `;
        
        // Create individual download buttons
        this.individualFiles.innerHTML = '';
        
        this.splitResults.forEach((result, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'result-file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">📄</div>
                    <div class="file-details">
                        <div class="file-name">${result.name}</div>
                        <div class="file-meta">
                            <span>${result.pageCount} page${result.pageCount !== 1 ? 's' : ''}</span>
                            <span>${this.formatFileSize(result.data.length)}</span>
                        </div>
                    </div>
                </div>
                <button class="download-file-btn" data-index="${index}">
                    <span>⬇️</span>
                    Download
                </button>
            `;
            
            fileItem.querySelector('.download-file-btn').addEventListener('click', () => {
                this.downloadFile(result);
            });
            
            this.individualFiles.appendChild(fileItem);
        });
        
        this.showCard(this.resultsCard);
    }

    downloadFile(result) {
        const blob = new Blob([result.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.name;
        a.click();
        URL.revokeObjectURL(url);
    }

    async downloadAllFiles() {
        if (!window.JSZip) {
            // Dynamically load JSZip
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
            document.head.appendChild(script);
            
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }
        
        const zip = new JSZip();
        
        this.splitResults.forEach(result => {
            zip.file(result.name, result.data);
        });
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `split-${this.currentPDF.name.replace('.pdf', '')}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearAll() {
        this.currentPDF = null;
        this.pdfDoc = null;
        this.totalPages = 0;
        this.selectedPages.clear();
        this.customRanges = [];
        this.splitResults = [];
        
        this.fileInput.value = '';
        this.rangeInput.value = '';
        this.maxPagesPerFile.value = '10';
        
        this.showCard(this.uploadCard);
        this.hideAllCards();
        this.showCard(this.uploadCard);
    }

    startNewSplit() {
        this.clearAll();
    }

    showProgress(show) {
        if (show) {
            this.showCard(this.progressCard);
        } else {
            this.hideCard(this.progressCard);
        }
    }

    updateProgress(percent, operation) {
        this.progressBar.style.width = `${percent}%`;
        this.progressPercent.textContent = `${Math.round(percent)}%`;
        this.currentOperation.textContent = operation;
    }

    showPreview(show) {
        if (show) {
            this.showCard(this.previewCard);
        } else {
            this.hideCard(this.previewCard);
        }
    }

    showCard(card) {
        card.classList.remove('hidden');
    }

    hideCard(card) {
        card.classList.add('hidden');
    }

    hideAllCards() {
        [this.previewCard, this.progressCard, this.resultsCard].forEach(card => {
            this.hideCard(card);
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showError(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">⚠️</div>
                <div class="toast-message">${message}</div>
                <button class="toast-close">×</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFSplitter();
});