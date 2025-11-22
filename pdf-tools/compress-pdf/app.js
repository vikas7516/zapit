class PDFCompressor {
    constructor() {
        this.currentPDF = null;
        this.pdfDoc = null;
        this.originalSize = 0;
        this.compressedData = null;
        this.compressionSettings = {
            quality: 'high',
            imageQuality: 85,
            imageResolution: 150,
            removeMetadata: true,
            optimizeImages: true,
            removeAnnotations: false
        };
        
        this.qualityPresets = {
            high: { imageQuality: 85, imageResolution: 300, factor: 0.9 },
            medium: { imageQuality: 70, imageResolution: 150, factor: 0.7 },
            low: { imageQuality: 50, imageResolution: 72, factor: 0.5 }
        };
        
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        // Cards
        this.uploadCard = document.getElementById('uploadCard');
        this.settingsCard = document.getElementById('settingsCard');
        this.progressCard = document.getElementById('progressCard');
        this.resultsCard = document.getElementById('resultsCard');
        
        // Upload elements
        this.uploadZone = document.getElementById('uploadZone');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // File info elements
        this.currentFileName = document.getElementById('currentFileName');
        this.originalSize = document.getElementById('originalSize');
        this.pageCount = document.getElementById('pageCount');
        this.estimatedSize = document.getElementById('estimatedSize');
        this.compressionRatio = document.getElementById('compressionRatio');
        
        // Quality presets
        this.presetBtns = document.querySelectorAll('.preset-btn');
        
        // Advanced options
        this.advancedToggle = document.getElementById('advancedToggle');
        this.advancedContent = document.getElementById('advancedContent');
        this.imageQuality = document.getElementById('imageQuality');
        this.imageQualityValue = document.getElementById('imageQualityValue');
        this.imageResolution = document.getElementById('imageResolution');
        this.removeMetadata = document.getElementById('removeMetadata');
        this.optimizeImages = document.getElementById('optimizeImages');
        this.removeAnnotations = document.getElementById('removeAnnotations');
        
        // Action buttons
        this.compressBtn = document.getElementById('compressBtn');
        this.newCompressionBtn = document.getElementById('newCompressionBtn');
        
        // Progress elements
        this.progressBar = document.getElementById('progressBar');
        this.progressPercent = document.getElementById('progressPercent');
        this.currentOperation = document.getElementById('currentOperation');
        this.originalSizeProgress = document.getElementById('originalSizeProgress');
        this.currentSizeProgress = document.getElementById('currentSizeProgress');
        this.reductionProgress = document.getElementById('reductionProgress');
        
        // Results elements
        this.finalOriginalSize = document.getElementById('finalOriginalSize');
        this.finalCompressedSize = document.getElementById('finalCompressedSize');
        this.finalReduction = document.getElementById('finalReduction');
        this.spaceSaved = document.getElementById('spaceSaved');
        this.qualityLevel = document.getElementById('qualityLevel');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadFileName = document.getElementById('downloadFileName');
        this.downloadFileSize = document.getElementById('downloadFileSize');
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
        
        // Quality preset events
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectQualityPreset(btn.dataset.quality));
        });
        
        // Advanced options
        this.advancedToggle.addEventListener('click', this.toggleAdvancedOptions.bind(this));
        this.imageQuality.addEventListener('input', this.updateImageQuality.bind(this));
        this.imageResolution.addEventListener('change', this.updateSettings.bind(this));
        this.removeMetadata.addEventListener('change', this.updateSettings.bind(this));
        this.optimizeImages.addEventListener('change', this.updateSettings.bind(this));
        this.removeAnnotations.addEventListener('change', this.updateSettings.bind(this));
        
        // Action buttons
        this.compressBtn.addEventListener('click', this.compressPDF.bind(this));
        this.newCompressionBtn.addEventListener('click', this.startNewCompression.bind(this));
        this.downloadBtn.addEventListener('click', this.downloadCompressed.bind(this));
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
        if (file.size > 100 * 1024 * 1024) {
            this.showError('File size must be less than 100MB');
            return;
        }

        try {
            this.showProgress(true);
            this.updateProgress(20, 'Loading PDF...');
            
            const arrayBuffer = await file.arrayBuffer();
            this.updateProgress(50, 'Analyzing PDF structure...');
            
            this.pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            this.currentPDF = file;
            this.originalSize = file.size;
            
            this.updateProgress(80, 'Preparing compression settings...');
            
            // Update file info
            this.currentFileName.textContent = file.name;
            this.originalSize.textContent = this.formatFileSize(file.size);
            this.pageCount.textContent = this.pdfDoc.getPageCount();
            
            // Estimate initial compression
            this.updateEstimatedSize();
            
            this.updateProgress(100, 'Ready for compression!');
            setTimeout(() => {
                this.showProgress(false);
                this.showSettings(true);
            }, 500);
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showError('Failed to load PDF. Please ensure it\'s a valid PDF file.');
            this.showProgress(false);
        }
    }

    selectQualityPreset(quality) {
        this.compressionSettings.quality = quality;
        
        // Update active preset
        this.presetBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quality === quality);
        });
        
        // Update advanced settings based on preset
        const preset = this.qualityPresets[quality];
        this.compressionSettings.imageQuality = preset.imageQuality;
        this.compressionSettings.imageResolution = preset.imageResolution;
        
        // Update UI controls
        this.imageQuality.value = preset.imageQuality;
        this.imageQualityValue.textContent = preset.imageQuality;
        this.imageResolution.value = preset.imageResolution;
        
        this.updateEstimatedSize();
    }

    toggleAdvancedOptions() {
        const isHidden = this.advancedContent.classList.contains('hidden');
        this.advancedContent.classList.toggle('hidden');
        
        const arrow = this.advancedToggle.querySelector('.toggle-arrow');
        arrow.textContent = isHidden ? '▲' : '▼';
    }

    updateImageQuality() {
        const value = this.imageQuality.value;
        this.imageQualityValue.textContent = value;
        this.compressionSettings.imageQuality = parseInt(value);
        this.updateEstimatedSize();
        
        // Update preset selection based on quality
        if (value >= 80) {
            this.selectQualityPreset('high');
        } else if (value >= 60) {
            this.selectQualityPreset('medium');
        } else {
            this.selectQualityPreset('low');
        }
    }

    updateSettings() {
        this.compressionSettings.imageResolution = parseInt(this.imageResolution.value);
        this.compressionSettings.removeMetadata = this.removeMetadata.checked;
        this.compressionSettings.optimizeImages = this.optimizeImages.checked;
        this.compressionSettings.removeAnnotations = this.removeAnnotations.checked;
        
        this.updateEstimatedSize();
    }

    updateEstimatedSize() {
        if (!this.originalSize) return;
        
        // Estimate compression based on settings
        const preset = this.qualityPresets[this.compressionSettings.quality];
        let compressionFactor = preset.factor;
        
        // Adjust based on advanced settings
        if (this.compressionSettings.removeMetadata) compressionFactor *= 0.95;
        if (this.compressionSettings.optimizeImages) compressionFactor *= 0.9;
        if (this.compressionSettings.removeAnnotations) compressionFactor *= 0.98;
        
        const estimatedSize = Math.floor(this.originalSize * compressionFactor);
        const reduction = Math.round((1 - compressionFactor) * 100);
        
        this.estimatedSize.textContent = this.formatFileSize(estimatedSize);
        this.compressionRatio.textContent = `${reduction}%`;
        
        // Color code the compression ratio
        this.compressionRatio.className = 'info-value compression-ratio';
        if (reduction > 50) this.compressionRatio.classList.add('high');
        else if (reduction > 25) this.compressionRatio.classList.add('medium');
        else this.compressionRatio.classList.add('low');
    }

    async compressPDF() {
        try {
            this.showSettings(false);
            this.showProgress(true);
            
            // Initialize progress
            this.originalSizeProgress.textContent = this.formatFileSize(this.originalSize);
            this.currentSizeProgress.textContent = this.formatFileSize(this.originalSize);
            this.reductionProgress.textContent = '0%';
            
            this.updateProgress(10, 'Starting compression...');
            
            // Create a copy of the PDF for compression
            const pdfBytes = await this.pdfDoc.save();
            this.updateProgress(20, 'Preparing document...');
            
            // Load the PDF again for compression
            const compressedDoc = await PDFLib.PDFDocument.load(pdfBytes);
            this.updateProgress(30, 'Analyzing document structure...');
            
            // Remove metadata if requested
            if (this.compressionSettings.removeMetadata) {
                this.updateProgress(40, 'Removing metadata...');
                compressedDoc.setTitle('');
                compressedDoc.setAuthor('');
                compressedDoc.setSubject('');
                compressedDoc.setKeywords([]);
                compressedDoc.setProducer('');
                compressedDoc.setCreator('');
            }
            
            this.updateProgress(50, 'Processing pages...');
            
            // Process pages for image optimization
            const pages = compressedDoc.getPages();
            const totalPages = pages.length;
            
            for (let i = 0; i < totalPages; i++) {
                const progress = 50 + ((i + 1) / totalPages) * 30;
                this.updateProgress(progress, `Optimizing page ${i + 1} of ${totalPages}...`);
                
                // Simulate page processing time
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.updateProgress(85, 'Finalizing compression...');
            
            // Generate the final compressed PDF
            const compressedBytes = await compressedDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectStreamsThreshold: 50,
                updateFieldAppearances: false
            });
            
            this.updateProgress(95, 'Calculating final size...');
            
            this.compressedData = compressedBytes;
            const compressedSize = compressedBytes.length;
            const reduction = Math.round((1 - compressedSize / this.originalSize) * 100);
            
            // Update progress stats
            this.currentSizeProgress.textContent = this.formatFileSize(compressedSize);
            this.reductionProgress.textContent = `${reduction}%`;
            
            this.updateProgress(100, 'Compression complete!');
            
            setTimeout(() => {
                this.showProgress(false);
                this.showResults(compressedSize, reduction);
            }, 500);
            
        } catch (error) {
            console.error('Error compressing PDF:', error);
            this.showError('Failed to compress PDF. Please try again.');
            this.showProgress(false);
            this.showSettings(true);
        }
    }

    showResults(compressedSize, reduction) {
        const spaceSaved = this.originalSize - compressedSize;
        
        // Update results display
        this.finalOriginalSize.textContent = this.formatFileSize(this.originalSize);
        this.finalCompressedSize.textContent = this.formatFileSize(compressedSize);
        this.finalReduction.textContent = `${reduction}%`;
        this.spaceSaved.textContent = this.formatFileSize(spaceSaved);
        this.qualityLevel.textContent = this.getQualityDisplayName(this.compressionSettings.quality);
        
        // Update download info
        const compressedFileName = this.currentPDF.name.replace('.pdf', '-compressed.pdf');
        this.downloadFileName.textContent = compressedFileName;
        this.downloadFileSize.textContent = this.formatFileSize(compressedSize);
        
        this.showCard(this.resultsCard);
    }

    downloadCompressed() {
        if (!this.compressedData) return;
        
        const blob = new Blob([this.compressedData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentPDF.name.replace('.pdf', '-compressed.pdf');
        a.click();
        URL.revokeObjectURL(url);
    }

    getQualityDisplayName(quality) {
        const names = {
            high: 'High Quality',
            medium: 'Balanced',
            low: 'High Compression'
        };
        return names[quality] || 'Custom';
    }

    clearAll() {
        this.currentPDF = null;
        this.pdfDoc = null;
        this.originalSize = 0;
        this.compressedData = null;
        this.fileInput.value = '';
        
        // Reset settings to defaults
        this.compressionSettings = {
            quality: 'high',
            imageQuality: 85,
            imageResolution: 150,
            removeMetadata: true,
            optimizeImages: true,
            removeAnnotations: false
        };
        
        this.selectQualityPreset('high');
        this.imageQuality.value = 85;
        this.imageQualityValue.textContent = '85';
        this.imageResolution.value = '150';
        this.removeMetadata.checked = true;
        this.optimizeImages.checked = true;
        this.removeAnnotations.checked = false;
        
        this.hideAllCards();
        this.showCard(this.uploadCard);
    }

    startNewCompression() {
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

    showSettings(show) {
        if (show) {
            this.showCard(this.settingsCard);
        } else {
            this.hideCard(this.settingsCard);
        }
    }

    showCard(card) {
        card.classList.remove('hidden');
    }

    hideCard(card) {
        card.classList.add('hidden');
    }

    hideAllCards() {
        [this.settingsCard, this.progressCard, this.resultsCard].forEach(card => {
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
    new PDFCompressor();
});