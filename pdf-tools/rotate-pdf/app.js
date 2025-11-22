class PDFRotator {
    constructor() {
        this.pdfBytes = null;
        this.pdfDoc = null;
        this.originalFileName = '';
        this.pageRotations = new Map(); // Store rotation for each page
        this.selectedPages = new Set(); // Store selected page indices
        this.currentViewPage = 1;
        this.totalPages = 0;
        this.initializeElements();
        this.initializeEventListeners();
        this.showToast = this.createToastSystem();
    }

    initializeElements() {
        // File upload elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadZone = document.getElementById('uploadZone');
        this.browseBtn = document.getElementById('browseBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.helpBtn = document.getElementById('helpBtn');

        // Cards
        this.uploadCard = document.getElementById('uploadCard');
        this.rotationCard = document.getElementById('rotationCard');
        this.progressCard = document.getElementById('progressCard');
        this.resultsCard = document.getElementById('resultsCard');

        // File info elements
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.pageCount = document.getElementById('pageCount');
        this.selectedCount = document.getElementById('selectedCount');
        this.currentFileName = document.getElementById('currentFileName');

        // Batch control elements
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.selectNoneBtn = document.getElementById('selectNoneBtn');
        this.selectEvenBtn = document.getElementById('selectEvenBtn');
        this.selectOddBtn = document.getElementById('selectOddBtn');
        this.rotateLeft90Btn = document.getElementById('rotateLeft90Btn');
        this.rotateRight90Btn = document.getElementById('rotateRight90Btn');
        this.rotate180Btn = document.getElementById('rotate180Btn');

        // Individual page control elements
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.currentPageInput = document.getElementById('currentPageInput');
        this.totalPagesSpan = document.getElementById('totalPages');
        this.currentRotateLeft = document.getElementById('currentRotateLeft');
        this.currentRotateRight = document.getElementById('currentRotateRight');
        this.currentRotate180 = document.getElementById('currentRotate180');

        // Pages grid
        this.pagesGrid = document.getElementById('pagesGrid');

        // Action buttons
        this.applyRotationBtn = document.getElementById('applyRotationBtn');
        this.resetRotationBtn = document.getElementById('resetRotationBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.newRotationBtn = document.getElementById('newRotationBtn');

        // Progress elements
        this.progressBar = document.getElementById('progressBar');
        this.progressPercent = document.getElementById('progressPercent');
        this.currentOperation = document.getElementById('currentOperation');
        this.pagesProgress = document.getElementById('pagesProgress');
        this.currentPageProgress = document.getElementById('currentPageProgress');
        this.rotationApplied = document.getElementById('rotationApplied');

        // Results elements
        this.totalPagesResult = document.getElementById('totalPagesResult');
        this.rotatedPagesResult = document.getElementById('rotatedPagesResult');
        this.clockwiseCount = document.getElementById('clockwiseCount');
        this.counterClockwiseCount = document.getElementById('counterClockwiseCount');
        this.flip180Count = document.getElementById('flip180Count');
        this.unchangedCount = document.getElementById('unchangedCount');
        this.detailsList = document.getElementById('detailsList');
        this.downloadFileName = document.getElementById('downloadFileName');
        this.downloadFileSize = document.getElementById('downloadFileSize');
    }

    initializeEventListeners() {
        // File upload listeners
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.browseBtn.addEventListener('click', () => this.fileInput.click());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.helpBtn.addEventListener('click', () => this.showHelp());

        // Drag and drop
        this.uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadZone.addEventListener('drop', (e) => this.handleFileDrop(e));
        this.uploadZone.addEventListener('dragenter', () => this.uploadZone.classList.add('drag-over'));
        this.uploadZone.addEventListener('dragleave', (e) => {
            if (!this.uploadZone.contains(e.relatedTarget)) {
                this.uploadZone.classList.remove('drag-over');
            }
        });

        // Batch control listeners
        this.selectAllBtn.addEventListener('click', () => this.selectPages('all'));
        this.selectNoneBtn.addEventListener('click', () => this.selectPages('none'));
        this.selectEvenBtn.addEventListener('click', () => this.selectPages('even'));
        this.selectOddBtn.addEventListener('click', () => this.selectPages('odd'));

        // Batch rotation listeners
        this.rotateLeft90Btn.addEventListener('click', () => this.rotateBatch(-90));
        this.rotateRight90Btn.addEventListener('click', () => this.rotateBatch(90));
        this.rotate180Btn.addEventListener('click', () => this.rotateBatch(180));

        // Individual page navigation
        this.prevPageBtn.addEventListener('click', () => this.navigatePage(-1));
        this.nextPageBtn.addEventListener('click', () => this.navigatePage(1));
        this.currentPageInput.addEventListener('change', () => this.goToPage());
        this.currentPageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.goToPage();
            }
        });

        // Individual rotation listeners
        this.currentRotateLeft.addEventListener('click', () => this.rotateCurrentPage(-90));
        this.currentRotateRight.addEventListener('click', () => this.rotateCurrentPage(90));
        this.currentRotate180.addEventListener('click', () => this.rotateCurrentPage(180));

        // Action listeners
        this.applyRotationBtn.addEventListener('click', () => this.applyRotations());
        this.resetRotationBtn.addEventListener('click', () => this.resetRotations());
        this.downloadBtn.addEventListener('click', () => this.downloadRotatedPDF());
        this.newRotationBtn.addEventListener('click', () => this.resetForNewFile());
    }

    createToastSystem() {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);

        return (message, type = 'info', duration = 5000) => {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-icon">${icons[type]}</span>
                    <span class="toast-message">${message}</span>
                    <button class="toast-close">×</button>
                </div>
            `;

            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => {
                toast.remove();
            });

            toastContainer.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, duration);

            // Animate in
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(0)';
            });
        };
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        this.uploadZone.classList.add('drag-over');
    }

    handleFileDrop(event) {
        event.preventDefault();
        this.uploadZone.classList.remove('drag-over');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            this.processFile(file);
        }
    }

    async processFile(file) {
        // Validate file
        if (!file.type.includes('pdf')) {
            this.showToast('Please select a PDF file', 'error');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            this.showToast('File size must be less than 50MB', 'error');
            return;
        }

        try {
            // Read file
            const arrayBuffer = await file.arrayBuffer();
            this.pdfBytes = new Uint8Array(arrayBuffer);
            this.originalFileName = file.name;

            // Load PDF document
            this.pdfDoc = await PDFLib.PDFDocument.load(this.pdfBytes);
            this.totalPages = this.pdfDoc.getPageCount();

            // Initialize rotation data
            this.pageRotations.clear();
            this.selectedPages.clear();
            for (let i = 0; i < this.totalPages; i++) {
                this.pageRotations.set(i, 0); // No rotation initially
            }

            // Update UI with file info
            this.updateFileInfo(file);
            this.showRotationCard();
            await this.generatePageThumbnails();
            this.updateControls();

            this.showToast('PDF loaded successfully', 'success');

        } catch (error) {
            console.error('Error processing file:', error);
            this.showToast('Error processing PDF file', 'error');
        }
    }

    updateFileInfo(file) {
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.pageCount.textContent = this.totalPages;
        this.selectedCount.textContent = this.selectedPages.size;
        this.currentFileName.textContent = file.name;
        this.totalPagesSpan.textContent = this.totalPages;
        this.currentPageInput.max = this.totalPages;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showRotationCard() {
        this.uploadCard.classList.add('completed');
        this.rotationCard.classList.remove('hidden');
        this.rotationCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async generatePageThumbnails() {
        this.pagesGrid.innerHTML = '';
        
        for (let i = 0; i < this.totalPages; i++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page-thumbnail';
            pageDiv.dataset.pageIndex = i;
            
            pageDiv.innerHTML = `
                <div class="page-content">
                    <div class="page-preview">
                        <div class="page-number">${i + 1}</div>
                        <div class="rotation-indicator" data-rotation="0">0°</div>
                    </div>
                    <div class="page-controls">
                        <button class="page-rotate-btn" data-action="left" title="Rotate 90° left">↺</button>
                        <button class="page-rotate-btn" data-action="right" title="Rotate 90° right">↻</button>
                        <button class="page-rotate-btn" data-action="flip" title="Rotate 180°">🔄</button>
                    </div>
                </div>
                <div class="page-selection">
                    <input type="checkbox" class="page-checkbox" id="page-${i}">
                    <label for="page-${i}">Select</label>
                </div>
            `;

            // Add click listener for page selection
            const checkbox = pageDiv.querySelector('.page-checkbox');
            checkbox.addEventListener('change', () => this.togglePageSelection(i));

            // Add click listener for page thumbnail
            const pagePreview = pageDiv.querySelector('.page-preview');
            pagePreview.addEventListener('click', () => {
                this.currentViewPage = i + 1;
                this.currentPageInput.value = this.currentViewPage;
                this.updateCurrentPageControls();
                this.highlightCurrentPage();
            });

            // Add rotation button listeners
            const rotateButtons = pageDiv.querySelectorAll('.page-rotate-btn');
            rotateButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    let rotation = 0;
                    if (action === 'left') rotation = -90;
                    else if (action === 'right') rotation = 90;
                    else if (action === 'flip') rotation = 180;
                    
                    this.rotatePage(i, rotation);
                });
            });

            this.pagesGrid.appendChild(pageDiv);
        }

        this.highlightCurrentPage();
    }

    togglePageSelection(pageIndex) {
        if (this.selectedPages.has(pageIndex)) {
            this.selectedPages.delete(pageIndex);
        } else {
            this.selectedPages.add(pageIndex);
        }
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        this.selectedCount.textContent = this.selectedPages.size;
        
        // Update checkboxes
        const checkboxes = this.pagesGrid.querySelectorAll('.page-checkbox');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = this.selectedPages.has(index);
        });

        // Update page thumbnails visual state
        const thumbnails = this.pagesGrid.querySelectorAll('.page-thumbnail');
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.classList.toggle('selected', this.selectedPages.has(index));
        });

        this.updateControls();
    }

    selectPages(type) {
        this.selectedPages.clear();
        
        switch (type) {
            case 'all':
                for (let i = 0; i < this.totalPages; i++) {
                    this.selectedPages.add(i);
                }
                break;
            case 'none':
                // Already cleared
                break;
            case 'even':
                for (let i = 1; i < this.totalPages; i += 2) {
                    this.selectedPages.add(i);
                }
                break;
            case 'odd':
                for (let i = 0; i < this.totalPages; i += 2) {
                    this.selectedPages.add(i);
                }
                break;
        }
        
        this.updateSelectionUI();
        this.showToast(`Selected ${this.selectedPages.size} pages`, 'info');
    }

    rotateBatch(degrees) {
        if (this.selectedPages.size === 0) {
            this.showToast('Please select pages to rotate', 'warning');
            return;
        }

        this.selectedPages.forEach(pageIndex => {
            this.rotatePage(pageIndex, degrees);
        });

        this.showToast(`Rotated ${this.selectedPages.size} pages by ${degrees}°`, 'success');
    }

    rotatePage(pageIndex, degrees) {
        const currentRotation = this.pageRotations.get(pageIndex) || 0;
        let newRotation = (currentRotation + degrees) % 360;
        if (newRotation < 0) newRotation += 360;
        
        this.pageRotations.set(pageIndex, newRotation);
        this.updatePageThumbnail(pageIndex);
        this.updateControls();
    }

    updatePageThumbnail(pageIndex) {
        const thumbnail = this.pagesGrid.querySelector(`[data-page-index="${pageIndex}"]`);
        if (thumbnail) {
            const rotationIndicator = thumbnail.querySelector('.rotation-indicator');
            const rotation = this.pageRotations.get(pageIndex) || 0;
            rotationIndicator.textContent = `${rotation}°`;
            rotationIndicator.dataset.rotation = rotation;
            
            // Add visual rotation effect
            const pagePreview = thumbnail.querySelector('.page-preview');
            pagePreview.style.transform = `rotate(${rotation}deg)`;
        }
    }

    navigatePage(direction) {
        const newPage = this.currentViewPage + direction;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentViewPage = newPage;
            this.currentPageInput.value = this.currentViewPage;
            this.updateCurrentPageControls();
            this.highlightCurrentPage();
        }
    }

    goToPage() {
        const pageNum = parseInt(this.currentPageInput.value);
        if (pageNum >= 1 && pageNum <= this.totalPages) {
            this.currentViewPage = pageNum;
            this.updateCurrentPageControls();
            this.highlightCurrentPage();
        } else {
            this.currentPageInput.value = this.currentViewPage;
        }
    }

    updateCurrentPageControls() {
        this.prevPageBtn.disabled = this.currentViewPage <= 1;
        this.nextPageBtn.disabled = this.currentViewPage >= this.totalPages;
    }

    highlightCurrentPage() {
        const thumbnails = this.pagesGrid.querySelectorAll('.page-thumbnail');
        thumbnails.forEach((thumbnail, index) => {
            thumbnail.classList.toggle('current', index === this.currentViewPage - 1);
        });
    }

    rotateCurrentPage(degrees) {
        const pageIndex = this.currentViewPage - 1;
        this.rotatePage(pageIndex, degrees);
        this.showToast(`Rotated page ${this.currentViewPage} by ${degrees}°`, 'success');
    }

    updateControls() {
        const hasRotations = Array.from(this.pageRotations.values()).some(rotation => rotation !== 0);
        this.applyRotationBtn.disabled = !hasRotations;
        this.resetRotationBtn.disabled = !hasRotations;
    }

    resetRotations() {
        if (confirm('Reset all rotations? This will remove all rotation changes.')) {
            this.pageRotations.clear();
            for (let i = 0; i < this.totalPages; i++) {
                this.pageRotations.set(i, 0);
                this.updatePageThumbnail(i);
            }
            this.updateControls();
            this.showToast('All rotations reset', 'info');
        }
    }

    async applyRotations() {
        try {
            this.showProgressCard();
            await this.processRotations();
        } catch (error) {
            console.error('Error applying rotations:', error);
            this.showToast('Error applying rotations: ' + error.message, 'error');
            this.hideProgressCard();
        }
    }

    showProgressCard() {
        this.rotationCard.classList.add('completed');
        this.progressCard.classList.remove('hidden');
        this.progressCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    hideProgressCard() {
        this.progressCard.classList.add('hidden');
        this.rotationCard.classList.remove('completed');
    }

    async processRotations() {
        const rotatedPages = Array.from(this.pageRotations.entries()).filter(([_, rotation]) => rotation !== 0);
        const totalSteps = rotatedPages.length + 2; // +2 for preparation and finalization
        let currentStep = 0;

        // Preparation
        this.updateProgress(++currentStep, totalSteps, 'Preparing document...');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Create new PDF document
        const newPdfDoc = await PDFLib.PDFDocument.create();
        
        // Process each page
        for (let i = 0; i < this.totalPages; i++) {
            const rotation = this.pageRotations.get(i) || 0;
            
            if (rotation !== 0) {
                this.updateProgress(++currentStep, totalSteps, `Rotating page ${i + 1}...`);
                this.currentPageProgress.textContent = `${i + 1}`;
                this.rotationApplied.textContent = `${rotation}°`;
            }

            // Copy page from original document
            const [copiedPage] = await newPdfDoc.copyPages(this.pdfDoc, [i]);
            
            // Apply rotation if needed
            if (rotation !== 0) {
                copiedPage.setRotation(PDFLib.degrees(rotation));
            }
            
            newPdfDoc.addPage(copiedPage);
            
            // Update progress
            const progressPercent = Math.round(((i + 1) / this.totalPages) * 80) + 10; // 10-90%
            this.pagesProgress.textContent = `${i + 1} / ${this.totalPages}`;
            
            if (rotation === 0) {
                this.updateProgress(currentStep, totalSteps, `Processing page ${i + 1}...`, progressPercent);
            }

            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Finalization
        this.updateProgress(totalSteps, totalSteps, 'Finalizing document...');
        const rotatedPdfBytes = await newPdfDoc.save();
        
        this.showResultsCard(new Uint8Array(rotatedPdfBytes));
    }

    updateProgress(current, total, operation, customPercent = null) {
        const percentage = customPercent || Math.round((current / total) * 100);
        this.progressBar.style.width = `${percentage}%`;
        this.progressPercent.textContent = `${percentage}%`;
        this.currentOperation.textContent = operation;
    }

    showResultsCard(rotatedPdfBytes) {
        this.rotatedPdfBytes = rotatedPdfBytes;
        this.progressCard.classList.add('completed');
        this.resultsCard.classList.remove('hidden');
        this.resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Calculate statistics
        this.updateRotationStats();
        
        // Update download info
        const fileName = this.originalFileName.replace('.pdf', '_rotated.pdf');
        this.downloadFileName.textContent = fileName;
        this.downloadFileSize.textContent = this.formatFileSize(rotatedPdfBytes.length);

        this.showToast('PDF rotated successfully!', 'success');
    }

    updateRotationStats() {
        const rotations = Array.from(this.pageRotations.values());
        const stats = {
            total: this.totalPages,
            rotated: rotations.filter(r => r !== 0).length,
            clockwise: rotations.filter(r => r === 90 || r === 270).length,
            counterClockwise: rotations.filter(r => r === 270 || r === 90).length,
            flip180: rotations.filter(r => r === 180).length,
            unchanged: rotations.filter(r => r === 0).length
        };

        // Update stats display
        this.totalPagesResult.textContent = stats.total;
        this.rotatedPagesResult.textContent = stats.rotated;
        this.clockwiseCount.textContent = rotations.filter(r => r === 90).length;
        this.counterClockwiseCount.textContent = rotations.filter(r => r === 270).length;
        this.flip180Count.textContent = stats.flip180;
        this.unchangedCount.textContent = stats.unchanged;

        // Generate details list
        this.generateRotationDetails();
    }

    generateRotationDetails() {
        this.detailsList.innerHTML = '';
        
        const rotations = Array.from(this.pageRotations.entries()).filter(([_, rotation]) => rotation !== 0);
        
        if (rotations.length === 0) {
            this.detailsList.innerHTML = '<div class="no-rotations">No pages were rotated</div>';
            return;
        }

        rotations.forEach(([pageIndex, rotation]) => {
            const detailItem = document.createElement('div');
            detailItem.className = 'detail-item';
            
            let rotationText = '';
            if (rotation === 90) rotationText = '90° Clockwise';
            else if (rotation === 180) rotationText = '180° Flip';
            else if (rotation === 270) rotationText = '90° Counter-clockwise';
            
            detailItem.innerHTML = `
                <span class="detail-page">Page ${pageIndex + 1}</span>
                <span class="detail-rotation">${rotationText}</span>
                <span class="detail-angle">${rotation}°</span>
            `;
            
            this.detailsList.appendChild(detailItem);
        });
    }

    downloadRotatedPDF() {
        if (!this.rotatedPdfBytes) {
            this.showToast('No rotated PDF available', 'error');
            return;
        }

        try {
            const blob = new Blob([this.rotatedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const fileName = this.originalFileName.replace('.pdf', '_rotated.pdf');
            
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('Rotated PDF downloaded successfully!', 'success');

        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Error downloading rotated PDF', 'error');
        }
    }

    resetForNewFile() {
        // Reset all data
        this.pdfBytes = null;
        this.pdfDoc = null;
        this.rotatedPdfBytes = null;
        this.originalFileName = '';
        this.pageRotations.clear();
        this.selectedPages.clear();
        this.currentViewPage = 1;
        this.totalPages = 0;

        // Reset form
        this.fileInput.value = '';
        this.currentPageInput.value = '1';

        // Reset cards
        this.uploadCard.classList.remove('completed');
        this.rotationCard.classList.add('hidden');
        this.progressCard.classList.add('hidden');
        this.resultsCard.classList.add('hidden');

        // Reset progress
        this.progressBar.style.width = '0%';
        this.progressPercent.textContent = '0%';

        // Clear pages grid
        this.pagesGrid.innerHTML = '';

        // Scroll to top
        this.uploadCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        this.showToast('Ready for new PDF rotation', 'info');
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.resetForNewFile();
        }
    }

    showHelp() {
        const helpMessage = `
            PDF Rotator Help:
            
            1. Upload a PDF file (max 50MB)
            2. Select pages to rotate:
               • Use batch controls (All, None, Even, Odd)
               • Click individual page thumbnails
               • Navigate with page controls
            3. Choose rotation:
               • 90° Left (counterclockwise)
               • 90° Right (clockwise)
               • 180° (flip)
            4. Preview changes in the page grid
            5. Click "Apply Rotations" to process
            6. Download your rotated PDF
            
            Tips:
            • Use page grid to visually identify orientation issues
            • Batch select even/odd pages for alternating rotations
            • All processing happens locally in your browser
            • Reset button undoes all changes before applying
        `;
        
        alert(helpMessage);
    }
}

// Initialize the PDF Rotator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PDFRotator();
});