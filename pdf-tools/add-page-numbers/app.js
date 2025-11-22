/**
 * PDF Add Page Numbers Tool
 * Adds custom page numbers to PDF documents with flexible positioning and formatting
 */

class PDFPageNumberer {
    constructor() {
        this.pdfDoc = null;
        this.pdfBytes = null;
        this.fileName = '';
        this.pageCount = 0;
        this.fileSize = 0;
        this.lastModified = null;
        
        // Configuration
        this.config = {
            position: 'bottom-left',
            format: 'number',
            startingNumber: 1,
            pageRange: 'all',
            customRange: '',
            fontFamily: 'helvetica',
            fontSize: 12,
            textColor: '#000000',
            textOpacity: 100,
            marginX: 20,
            marginY: 20
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePreview();
    }

    setupEventListeners() {
        // File upload
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');

        uploadZone.addEventListener('click', () => fileInput.click());
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadZone.addEventListener('drop', this.handleDrop.bind(this));

        // Position selection
        const positionBtns = document.querySelectorAll('.position-btn');
        positionBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectPosition(btn));
        });

        // Configuration changes
        document.getElementById('numberFormat').addEventListener('change', (e) => {
            this.config.format = e.target.value;
            this.updatePreview();
        });

        document.getElementById('startingNumber').addEventListener('input', (e) => {
            this.config.startingNumber = parseInt(e.target.value) || 1;
            this.updatePreview();
        });

        document.getElementById('pageRange').addEventListener('change', (e) => {
            this.config.pageRange = e.target.value;
            const customRangeRow = document.getElementById('customRangeRow');
            customRangeRow.style.display = e.target.value === 'custom' ? 'block' : 'none';
            this.updatePreview();
        });

        document.getElementById('customRange').addEventListener('input', (e) => {
            this.config.customRange = e.target.value;
            this.updatePreview();
        });

        // Style configuration
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            this.config.fontFamily = e.target.value;
            this.updatePreview();
        });

        const fontSizeSlider = document.getElementById('fontSize');
        fontSizeSlider.addEventListener('input', (e) => {
            this.config.fontSize = parseInt(e.target.value);
            document.getElementById('fontSizeValue').textContent = `${e.target.value}px`;
            this.updatePreview();
        });

        document.getElementById('textColor').addEventListener('input', (e) => {
            this.config.textColor = e.target.value;
            document.getElementById('colorPreview').textContent = e.target.value;
            this.updatePreview();
        });

        const opacitySlider = document.getElementById('textOpacity');
        opacitySlider.addEventListener('input', (e) => {
            this.config.textOpacity = parseInt(e.target.value);
            document.getElementById('opacityValue').textContent = `${e.target.value}%`;
            this.updatePreview();
        });

        // Margin configuration
        const marginXSlider = document.getElementById('marginX');
        marginXSlider.addEventListener('input', (e) => {
            this.config.marginX = parseInt(e.target.value);
            document.getElementById('marginXValue').textContent = `${e.target.value}px`;
            this.updatePreview();
        });

        const marginYSlider = document.getElementById('marginY');
        marginYSlider.addEventListener('input', (e) => {
            this.config.marginY = parseInt(e.target.value);
            document.getElementById('marginYValue').textContent = `${e.target.value}px`;
            this.updatePreview();
        });

        // Action buttons
        document.getElementById('applyNumbersBtn').addEventListener('click', () => this.addPageNumbers());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetConfiguration());
        document.getElementById('resetConfigBtn').addEventListener('click', () => this.resetConfiguration());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadPDF());
        document.getElementById('newFileBtn').addEventListener('click', () => this.resetTool());
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        if (!file || file.type !== 'application/pdf') {
            this.showToast('Please select a valid PDF file', 'error');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            this.showToast('File size must be less than 50MB', 'error');
            return;
        }

        try {
            this.fileName = file.name;
            this.fileSize = file.size;
            this.lastModified = new Date(file.lastModified);

            // Read file
            const arrayBuffer = await file.arrayBuffer();
            this.pdfBytes = new Uint8Array(arrayBuffer);

            // Load PDF document
            this.pdfDoc = await PDFLib.PDFDocument.load(this.pdfBytes);
            this.pageCount = this.pdfDoc.getPageCount();

            this.showFileInfo();
            this.showConfigCard();
            this.showToast('PDF loaded successfully', 'success');

        } catch (error) {
            console.error('Error processing file:', error);
            this.showToast('Error loading PDF file', 'error');
        }
    }

    showFileInfo() {
        // Update file info display
        document.getElementById('infoFileName').textContent = this.fileName;
        document.getElementById('infoPageCount').textContent = this.pageCount;
        document.getElementById('infoFileSize').textContent = this.formatFileSize(this.fileSize);
        document.getElementById('infoModified').textContent = this.lastModified.toLocaleDateString();
        document.getElementById('currentFileName').textContent = this.fileName;

        // Mark upload card as completed
        document.getElementById('uploadCard').classList.add('completed');
    }

    showConfigCard() {
        const configCard = document.getElementById('configCard');
        configCard.style.display = 'block';
        configCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    selectPosition(selectedBtn) {
        // Remove active class from all buttons
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to selected button
        selectedBtn.classList.add('active');
        this.config.position = selectedBtn.dataset.position;
        this.updatePreview();
    }

    updatePreview() {
        const previewNumber = document.getElementById('previewNumber');
        const previewContainer = document.querySelector('.preview-page');
        
        // Update preview number text
        const sampleText = this.formatPageNumber(1, this.pageCount || 10);
        previewNumber.textContent = sampleText;

        // Update preview styles
        previewNumber.style.fontSize = `${Math.max(8, this.config.fontSize * 0.8)}px`;
        previewNumber.style.color = this.config.textColor;
        previewNumber.style.opacity = this.config.textOpacity / 100;
        previewNumber.style.fontFamily = this.getFontFamily();

        // Update position
        this.updatePreviewPosition(previewNumber);
    }

    updatePreviewPosition(element) {
        // Reset all position classes
        element.classList.remove('pos-top-left', 'pos-top-center', 'pos-top-right',
                                 'pos-bottom-left', 'pos-bottom-center', 'pos-bottom-right');
        
        // Add current position class
        element.classList.add(`pos-${this.config.position}`);
    }

    formatPageNumber(pageNum, totalPages) {
        const adjustedPageNum = pageNum + this.config.startingNumber - 1;
        
        switch (this.config.format) {
            case 'number':
                return adjustedPageNum.toString();
            case 'page-of-total':
                return `Page ${adjustedPageNum} of ${totalPages}`;
            case 'number-total':
                return `${adjustedPageNum} / ${totalPages}`;
            case 'roman':
                return this.toRoman(adjustedPageNum).toLowerCase();
            case 'roman-upper':
                return this.toRoman(adjustedPageNum);
            case 'alpha':
                return this.toAlpha(adjustedPageNum).toLowerCase();
            case 'alpha-upper':
                return this.toAlpha(adjustedPageNum);
            default:
                return adjustedPageNum.toString();
        }
    }

    toRoman(num) {
        const romanNumerals = [
            ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
            ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
            ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
        ];
        
        let result = '';
        for (const [roman, value] of romanNumerals) {
            const count = Math.floor(num / value);
            result += roman.repeat(count);
            num -= value * count;
        }
        return result;
    }

    toAlpha(num) {
        let result = '';
        while (num > 0) {
            num--;
            result = String.fromCharCode(65 + (num % 26)) + result;
            num = Math.floor(num / 26);
        }
        return result;
    }

    getFontFamily() {
        const fontMap = {
            'helvetica': 'Helvetica, Arial, sans-serif',
            'times': 'Times, serif',
            'courier': 'Courier, monospace'
        };
        return fontMap[this.config.fontFamily] || 'Helvetica, Arial, sans-serif';
    }

    parsePageRange() {
        const pageNumbers = [];
        
        if (this.config.pageRange === 'all') {
            for (let i = 1; i <= this.pageCount; i++) {
                pageNumbers.push(i);
            }
        } else if (this.config.pageRange === 'odd') {
            for (let i = 1; i <= this.pageCount; i += 2) {
                pageNumbers.push(i);
            }
        } else if (this.config.pageRange === 'even') {
            for (let i = 2; i <= this.pageCount; i += 2) {
                pageNumbers.push(i);
            }
        } else if (this.config.pageRange === 'custom') {
            const ranges = this.config.customRange.split(',');
            for (const range of ranges) {
                const trimmed = range.trim();
                if (trimmed.includes('-')) {
                    const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
                    if (start && end && start <= end) {
                        for (let i = Math.max(1, start); i <= Math.min(this.pageCount, end); i++) {
                            if (!pageNumbers.includes(i)) {
                                pageNumbers.push(i);
                            }
                        }
                    }
                } else {
                    const pageNum = parseInt(trimmed);
                    if (pageNum && pageNum >= 1 && pageNum <= this.pageCount && !pageNumbers.includes(pageNum)) {
                        pageNumbers.push(pageNum);
                    }
                }
            }
        }
        
        return pageNumbers.sort((a, b) => a - b);
    }

    async addPageNumbers() {
        if (!this.pdfDoc) {
            this.showToast('Please select a PDF file first', 'error');
            return;
        }

        try {
            this.showProgressCard();
            
            const pageNumbers = this.parsePageRange();
            if (pageNumbers.length === 0) {
                this.showToast('No valid pages found in the specified range', 'error');
                this.hideProgressCard();
                return;
            }

            // Get font
            let font;
            switch (this.config.fontFamily) {
                case 'times':
                    font = await this.pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
                    break;
                case 'courier':
                    font = await this.pdfDoc.embedFont(PDFLib.StandardFonts.Courier);
                    break;
                default:
                    font = await this.pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            }

            let numbersAdded = 0;
            const totalPages = pageNumbers.length;

            for (let i = 0; i < pageNumbers.length; i++) {
                const pageIndex = pageNumbers[i] - 1;
                const page = this.pdfDoc.getPage(pageIndex);
                const { width, height } = page.getSize();

                // Update progress
                const progress = ((i + 1) / totalPages) * 100;
                this.updateProgress(progress, `Adding number to page ${pageNumbers[i]}...`);
                
                // Calculate position
                const { x, y } = this.calculatePosition(width, height);
                
                // Format page number
                const numberText = this.formatPageNumber(pageNumbers[i], this.pageCount);
                
                // Add text to page
                page.drawText(numberText, {
                    x: x,
                    y: y,
                    size: this.config.fontSize,
                    font: font,
                    color: PDFLib.rgb(
                        parseInt(this.config.textColor.substr(1, 2), 16) / 255,
                        parseInt(this.config.textColor.substr(3, 2), 16) / 255,
                        parseInt(this.config.textColor.substr(5, 2), 16) / 255
                    ),
                    opacity: this.config.textOpacity / 100
                });

                numbersAdded++;
                
                // Update progress info
                document.getElementById('pagesProcessed').textContent = i + 1;
                document.getElementById('currentPageNum').textContent = pageNumbers[i];
                document.getElementById('numbersAdded').textContent = numbersAdded;

                // Small delay for visual feedback
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Serialize PDF
            this.updateProgress(100, 'Finalizing PDF...');
            this.pdfBytes = await this.pdfDoc.save();

            this.showResults(numbersAdded, pageNumbers);
            this.showToast('Page numbers added successfully!', 'success');

        } catch (error) {
            console.error('Error adding page numbers:', error);
            this.showToast('Error adding page numbers to PDF', 'error');
            this.hideProgressCard();
        }
    }

    calculatePosition(pageWidth, pageHeight) {
        const marginX = this.config.marginX;
        const marginY = this.config.marginY;

        switch (this.config.position) {
            case 'top-left':
                return { x: marginX, y: pageHeight - marginY };
            case 'top-center':
                return { x: pageWidth / 2, y: pageHeight - marginY };
            case 'top-right':
                return { x: pageWidth - marginX, y: pageHeight - marginY };
            case 'bottom-left':
                return { x: marginX, y: marginY };
            case 'bottom-center':
                return { x: pageWidth / 2, y: marginY };
            case 'bottom-right':
                return { x: pageWidth - marginX, y: marginY };
            default:
                return { x: marginX, y: marginY };
        }
    }

    showProgressCard() {
        document.getElementById('configCard').classList.add('completed');
        document.getElementById('progressCard').style.display = 'block';
        document.getElementById('progressCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    hideProgressCard() {
        document.getElementById('progressCard').style.display = 'none';
    }

    updateProgress(percent, message) {
        document.getElementById('progressPercent').textContent = `${Math.round(percent)}%`;
        document.getElementById('progressBar').style.width = `${percent}%`;
        document.getElementById('progressText').textContent = message;
        document.getElementById('currentOperation').textContent = message;
    }

    showResults(numbersAdded, processedPages) {
        document.getElementById('progressCard').classList.add('completed');
        
        // Update result statistics
        document.getElementById('resultTotalPages').textContent = this.pageCount;
        document.getElementById('resultNumbersAdded').textContent = numbersAdded;
        document.getElementById('resultPosition').textContent = this.config.position.replace('-', ' ');
        document.getElementById('resultFormat').textContent = this.getFormatDescription();
        
        // Update configuration details
        document.getElementById('resultFont').textContent = this.config.fontFamily;
        document.getElementById('resultSize').textContent = `${this.config.fontSize}px`;
        document.getElementById('resultColor').textContent = this.config.textColor;
        document.getElementById('resultRange').textContent = this.getRangeDescription(processedPages);
        
        // Update file size
        document.getElementById('outputFileSize').textContent = this.formatFileSize(this.pdfBytes.length);
        
        // Show results card
        document.getElementById('resultsCard').style.display = 'block';
        document.getElementById('resultsCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    getFormatDescription() {
        const formatMap = {
            'number': 'Numbers (1, 2, 3...)',
            'page-of-total': 'Page X of Total',
            'number-total': 'X / Total',
            'roman': 'Roman lowercase',
            'roman-upper': 'Roman uppercase',
            'alpha': 'Alphabetic lowercase',
            'alpha-upper': 'Alphabetic uppercase'
        };
        return formatMap[this.config.format] || 'Numbers';
    }

    getRangeDescription(processedPages) {
        if (this.config.pageRange === 'all') return 'All pages';
        if (this.config.pageRange === 'odd') return 'Odd pages only';
        if (this.config.pageRange === 'even') return 'Even pages only';
        if (this.config.pageRange === 'custom') {
            if (processedPages.length <= 5) {
                return processedPages.join(', ');
            } else {
                return `${processedPages.slice(0, 3).join(', ')}... (+${processedPages.length - 3} more)`;
            }
        }
        return 'Custom range';
    }

    downloadPDF() {
        if (!this.pdfBytes) {
            this.showToast('No PDF available for download', 'error');
            return;
        }

        try {
            const blob = new Blob([this.pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.fileName.replace('.pdf', '_with_page_numbers.pdf');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast('PDF downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            this.showToast('Error downloading PDF', 'error');
        }
    }

    resetConfiguration() {
        this.config = {
            position: 'bottom-left',
            format: 'number',
            startingNumber: 1,
            pageRange: 'all',
            customRange: '',
            fontFamily: 'helvetica',
            fontSize: 12,
            textColor: '#000000',
            textOpacity: 100,
            marginX: 20,
            marginY: 20
        };

        // Reset form elements
        document.getElementById('numberFormat').value = 'number';
        document.getElementById('startingNumber').value = '1';
        document.getElementById('pageRange').value = 'all';
        document.getElementById('customRange').value = '';
        document.getElementById('fontFamily').value = 'helvetica';
        document.getElementById('fontSize').value = '12';
        document.getElementById('fontSizeValue').textContent = '12px';
        document.getElementById('textColor').value = '#000000';
        document.getElementById('colorPreview').textContent = '#000000';
        document.getElementById('textOpacity').value = '100';
        document.getElementById('opacityValue').textContent = '100%';
        document.getElementById('marginX').value = '20';
        document.getElementById('marginXValue').textContent = '20px';
        document.getElementById('marginY').value = '20';
        document.getElementById('marginYValue').textContent = '20px';

        // Reset position buttons
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-position="bottom-left"]').classList.add('active');

        // Hide custom range row
        document.getElementById('customRangeRow').style.display = 'none';

        this.updatePreview();
        this.showToast('Configuration reset to defaults', 'info');
    }

    resetTool() {
        // Reset all data
        this.pdfDoc = null;
        this.pdfBytes = null;
        this.fileName = '';
        this.pageCount = 0;
        this.fileSize = 0;
        this.lastModified = null;

        // Reset configuration
        this.resetConfiguration();

        // Hide cards
        document.getElementById('configCard').style.display = 'none';
        document.getElementById('progressCard').style.display = 'none';
        document.getElementById('resultsCard').style.display = 'none';

        // Reset upload card
        document.getElementById('uploadCard').classList.remove('completed');
        document.getElementById('fileInput').value = '';

        // Scroll to top
        document.getElementById('uploadCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.showToast('Tool reset successfully', 'info');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PDFPageNumberer();
});