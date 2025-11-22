class PDFMerger {
    constructor() {
        this.files = [];
        this.isProcessing = false;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxFiles = 20;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // File input
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');
        const uploadZone = document.getElementById('uploadZone');

        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Action buttons
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('mergeBtn').addEventListener('click', () => this.mergePDFs());
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelMerge());
        document.getElementById('newMergeBtn').addEventListener('click', () => this.startNewMerge());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadMergedPDF());

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadZone').classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadZone').classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('uploadZone').classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        this.handleFiles(files);
    }

    handleFiles(fileList) {
        const files = Array.from(fileList);
        
        // Filter PDF files
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length !== files.length) {
            this.showError(`${files.length - pdfFiles.length} non-PDF files were ignored. Only PDF files are supported.`);
        }

        // Check file limits
        if (this.files.length + pdfFiles.length > this.maxFiles) {
            this.showError(`Maximum ${this.maxFiles} files allowed. Please select fewer files.`);
            return;
        }

        // Check file sizes and add valid files
        const validFiles = [];
        for (const file of pdfFiles) {
            if (file.size > this.maxFileSize) {
                this.showError(`File "${file.name}" is too large. Maximum size is 10MB.`);
                continue;
            }
            
            // Check for duplicates
            if (this.files.find(f => f.name === file.name && f.size === file.size)) {
                this.showError(`File "${file.name}" is already added.`);
                continue;
            }
            
            validFiles.push({
                file: file,
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                pages: null // Will be populated when reading PDF
            });
        }

        this.files.push(...validFiles);
        this.updateFilesList();
        this.showFilesCard();
        
        // Read PDF info for each new file
        validFiles.forEach(fileObj => this.readPDFInfo(fileObj));
    }

    async readPDFInfo(fileObj) {
        try {
            const arrayBuffer = await fileObj.file.arrayBuffer();
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();
            
            fileObj.pages = pageCount;
            this.updateFileItem(fileObj.id, { pages: pageCount });
        } catch (error) {
            console.error('Error reading PDF:', error);
            fileObj.pages = 'Error';
            this.updateFileItem(fileObj.id, { pages: 'Error', error: true });
        }
    }

    updateFileItem(fileId, updates) {
        const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
        if (!fileElement || !updates.pages) return;

        const pagesElement = fileElement.querySelector('.file-pages');
        if (pagesElement) {
            if (updates.error) {
                pagesElement.textContent = 'Error reading PDF';
                pagesElement.classList.add('error');
                fileElement.classList.add('file-error');
            } else {
                pagesElement.textContent = `${updates.pages} pages`;
            }
        }
    }

    updateFilesList() {
        const filesList = document.getElementById('filesList');
        const fileCount = document.getElementById('fileCount');
        const mergeBtn = document.getElementById('mergeBtn');

        fileCount.textContent = `${this.files.length} file${this.files.length !== 1 ? 's' : ''} selected`;
        mergeBtn.disabled = this.files.length < 2;

        if (this.files.length === 0) {
            this.hideFilesCard();
            return;
        }

        filesList.innerHTML = this.files.map((fileObj, index) => `
            <div class="file-item" data-file-id="${fileObj.id}" draggable="true">
                <div class="file-drag-handle">
                    <span class="drag-icon">⋮⋮</span>
                </div>
                <div class="file-info">
                    <div class="file-icon">📄</div>
                    <div class="file-details">
                        <div class="file-name" title="${fileObj.name}">${fileObj.name}</div>
                        <div class="file-meta">
                            <span class="file-size">${this.formatFileSize(fileObj.size)}</span>
                            <span class="file-pages">${fileObj.pages ? fileObj.pages + ' pages' : 'Reading...'}</span>
                        </div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn move-up" title="Move Up" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="file-action-btn move-down" title="Move Down" ${index === this.files.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="file-action-btn remove" title="Remove File">×</button>
                </div>
            </div>
        `).join('');

        // Bind file item events
        this.bindFileItemEvents();
    }

    bindFileItemEvents() {
        const fileItems = document.querySelectorAll('.file-item');
        
        fileItems.forEach(item => {
            const fileId = item.dataset.fileId;
            
            // Remove button
            const removeBtn = item.querySelector('.remove');
            removeBtn.addEventListener('click', () => this.removeFile(fileId));

            // Move buttons
            const moveUpBtn = item.querySelector('.move-up');
            const moveDownBtn = item.querySelector('.move-down');
            
            moveUpBtn.addEventListener('click', () => this.moveFile(fileId, -1));
            moveDownBtn.addEventListener('click', () => this.moveFile(fileId, 1));

            // Drag and drop for reordering
            item.addEventListener('dragstart', (e) => this.handleFileDragStart(e, fileId));
            item.addEventListener('dragover', (e) => this.handleFileDragOver(e));
            item.addEventListener('drop', (e) => this.handleFileDrop(e, fileId));
        });
    }

    removeFile(fileId) {
        this.files = this.files.filter(f => f.id !== fileId);
        this.updateFilesList();
        
        if (this.files.length === 0) {
            this.hideFilesCard();
        }
    }

    moveFile(fileId, direction) {
        const currentIndex = this.files.findIndex(f => f.id === fileId);
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.files.length) {
            const [movedFile] = this.files.splice(currentIndex, 1);
            this.files.splice(newIndex, 0, movedFile);
            this.updateFilesList();
        }
    }

    handleFileDragStart(e, fileId) {
        e.dataTransfer.setData('text/plain', fileId);
        e.currentTarget.classList.add('dragging');
    }

    handleFileDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleFileDrop(e, targetFileId) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const draggedFileId = e.dataTransfer.getData('text/plain');
        if (draggedFileId === targetFileId) return;

        const draggedIndex = this.files.findIndex(f => f.id === draggedFileId);
        const targetIndex = this.files.findIndex(f => f.id === targetFileId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedFile] = this.files.splice(draggedIndex, 1);
            this.files.splice(targetIndex, 0, draggedFile);
            this.updateFilesList();
        }
    }

    async mergePDFs() {
        if (this.files.length < 2 || this.isProcessing) return;

        this.isProcessing = true;
        this.showProgressCard();
        
        try {
            const mergedPdf = await PDFLib.PDFDocument.create();
            const totalFiles = this.files.length;
            let processedFiles = 0;

            for (const fileObj of this.files) {
                this.updateProgress(processedFiles / totalFiles * 100, `Processing ${fileObj.name}...`, fileObj.name);
                
                try {
                    const arrayBuffer = await fileObj.file.arrayBuffer();
                    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
                    const pageIndices = Array.from({ length: pdfDoc.getPageCount() }, (_, i) => i);
                    const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
                    
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                } catch (error) {
                    console.error(`Error processing ${fileObj.name}:`, error);
                    this.showError(`Failed to process "${fileObj.name}". The file may be corrupted or password-protected.`);
                }
                
                processedFiles++;
                this.updateProgress(processedFiles / totalFiles * 100, `Processed ${processedFiles}/${totalFiles} files`, '');
            }

            this.updateProgress(100, 'Finalizing merged PDF...', '');
            
            const pdfBytes = await mergedPdf.save();
            const totalPages = mergedPdf.getPageCount();
            
            this.mergedPdfData = {
                bytes: pdfBytes,
                filename: document.getElementById('outputName').value || 'merged-document.pdf',
                size: pdfBytes.length,
                pages: totalPages,
                sourceFiles: this.files.length
            };

            this.showResults();
            
        } catch (error) {
            console.error('Merge error:', error);
            this.showError('An error occurred while merging PDFs. Please try again.');
            this.hideProgressCard();
        }
        
        this.isProcessing = false;
    }

    updateProgress(percent, text, currentFile) {
        document.getElementById('progressPercent').textContent = Math.round(percent) + '%';
        document.getElementById('progressText').textContent = text;
        document.getElementById('currentFile').textContent = currentFile;
        document.getElementById('progressBar').style.width = percent + '%';
    }

    downloadMergedPDF() {
        if (!this.mergedPdfData) return;

        const blob = new Blob([this.mergedPdfData.bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.mergedPdfData.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearAll() {
        this.files = [];
        this.updateFilesList();
        this.hideFilesCard();
        this.hideProgressCard();
        this.hideResults();
        document.getElementById('fileInput').value = '';
    }

    cancelMerge() {
        this.isProcessing = false;
        this.hideProgressCard();
        this.showFilesCard();
    }

    startNewMerge() {
        this.clearAll();
    }

    showFilesCard() {
        document.getElementById('filesCard').style.display = 'block';
    }

    hideFilesCard() {
        document.getElementById('filesCard').style.display = 'none';
    }

    showProgressCard() {
        document.getElementById('filesCard').style.display = 'none';
        document.getElementById('progressCard').style.display = 'block';
        this.updateProgress(0, 'Preparing files...', '');
    }

    hideProgressCard() {
        document.getElementById('progressCard').style.display = 'none';
    }

    showResults() {
        document.getElementById('progressCard').style.display = 'none';
        document.getElementById('resultsCard').style.display = 'block';
        
        const { sourceFiles, pages, size, filename } = this.mergedPdfData;
        
        document.getElementById('mergeSummary').textContent = 
            `Successfully merged ${sourceFiles} PDF files into "${filename}"`;
        document.getElementById('fileSize').textContent = this.formatFileSize(size);
        document.getElementById('filePages').textContent = `${pages} total pages`;
    }

    hideResults() {
        document.getElementById('resultsCard').style.display = 'none';
    }

    showSettings() {
        // Placeholder for merge settings
        alert('Merge settings coming soon! Currently supports basic merging with default options.');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showError(message) {
        // Create and show error toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">⚠️</span>
                <span class="toast-message">${message}</span>
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

// Initialize PDF merger when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFMerger();
});