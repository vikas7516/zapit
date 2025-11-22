// Image Cropper & Rotator Tool - JavaScript
class ImageCropperRotator {
    constructor() {
        this.originalImage = null;
        this.currentImage = null;
        this.canvas = null;
        this.ctx = null;
        this.currentRotation = 0;
        this.flipHorizontal = false;
        this.flipVertical = false;
        this.cropData = null;
        this.aspectRatio = null;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // File input and upload area
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadError = document.getElementById('uploadError');
        
        // Settings section
        this.settingsSection = document.getElementById('settingsSection');
        
        // Rotation controls
        this.rotationSlider = document.getElementById('rotationSlider');
        this.rotationValue = document.getElementById('rotationValue');
        
        // Flip controls
        this.flipHBtn = document.getElementById('flipHorizontal');
        this.flipVBtn = document.getElementById('flipVertical');
        
        // Crop controls
        this.cropX = document.getElementById('cropX');
        this.cropY = document.getElementById('cropY');
        this.cropWidth = document.getElementById('cropWidth');
        this.cropHeight = document.getElementById('cropHeight');
        this.lockAspectRatio = document.getElementById('lockAspectRatio');
        this.centerCrop = document.getElementById('centerCrop');
        
        // Action buttons
        this.resetBtn = document.getElementById('resetBtn');
        this.applyBtn = document.getElementById('applyBtn');
        
        // Results section
        this.resultsSection = document.getElementById('resultsSection');
        this.originalPreview = document.getElementById('originalPreview');
        this.processedPreview = document.getElementById('processedPreview');
        this.originalInfo = document.getElementById('originalInfo');
        this.processedInfo = document.getElementById('processedInfo');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.processNewBtn = document.getElementById('processNewBtn');
        
        // Create hidden canvas for processing
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    setupEventListeners() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Rotation controls
        this.rotationSlider.addEventListener('input', this.handleRotationChange.bind(this));
        document.getElementById('rotate90').addEventListener('click', () => this.rotateBy(90));
        document.getElementById('rotate-90').addEventListener('click', () => this.rotateBy(-90));
        document.getElementById('rotate180').addEventListener('click', () => this.rotateBy(180));
        
        // Flip controls
        this.flipHBtn.addEventListener('click', this.toggleFlipHorizontal.bind(this));
        this.flipVBtn.addEventListener('click', this.toggleFlipVertical.bind(this));
        
        // Crop dimension inputs
        this.cropX.addEventListener('input', this.updateCropPreview.bind(this));
        this.cropY.addEventListener('input', this.updateCropPreview.bind(this));
        this.cropWidth.addEventListener('input', this.updateCropPreview.bind(this));
        this.cropHeight.addEventListener('input', this.updateCropPreview.bind(this));
        this.lockAspectRatio.addEventListener('change', this.handleAspectRatioLock.bind(this));
        this.centerCrop.addEventListener('change', this.handleCenterCrop.bind(this));
        
        // Aspect ratio presets
        document.querySelectorAll('.ratio-btn').forEach(btn => {
            btn.addEventListener('click', this.setAspectRatio.bind(this));
        });
        
        // Action buttons
        this.resetBtn.addEventListener('click', this.resetImage.bind(this));
        this.applyBtn.addEventListener('click', this.applyTransformations.bind(this));
        this.downloadBtn.addEventListener('click', this.downloadResult.bind(this));
        this.processNewBtn.addEventListener('click', this.processNewImage.bind(this));
    }

    // File handling methods
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
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

    processFile(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('File size must be less than 10MB.');
            return;
        }

        this.hideError();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.currentImage = img;
                this.resetSettings();
                this.setupCropDimensions();
                this.settingsSection.classList.remove('hidden');
                this.updatePreview();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showError(message) {
        this.uploadError.textContent = message;
        this.uploadError.classList.add('show');
    }

    hideError() {
        this.uploadError.classList.remove('show');
    }

    resetSettings() {
        this.currentRotation = 0;
        this.flipHorizontal = false;
        this.flipVertical = false;
        this.aspectRatio = null;
        
        this.rotationSlider.value = 0;
        this.rotationValue.textContent = '0°';
        this.flipHBtn.classList.remove('active');
        this.flipVBtn.classList.remove('active');
        
        document.querySelectorAll('.ratio-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    setupCropDimensions() {
        const { width, height } = this.originalImage;
        
        this.cropX.value = 0;
        this.cropY.value = 0;
        this.cropWidth.value = width;
        this.cropHeight.value = height;
        
        this.cropX.max = width;
        this.cropY.max = height;
        this.cropWidth.max = width;
        this.cropHeight.max = height;
    }

    // Rotation methods
    handleRotationChange(e) {
        this.currentRotation = parseInt(e.target.value);
        this.rotationValue.textContent = `${this.currentRotation}°`;
        this.updatePreview();
    }

    rotateBy(degrees) {
        this.currentRotation = (this.currentRotation + degrees) % 360;
        if (this.currentRotation < 0) this.currentRotation += 360;
        
        this.rotationSlider.value = this.currentRotation;
        this.rotationValue.textContent = `${this.currentRotation}°`;
        this.updatePreview();
    }

    // Flip methods
    toggleFlipHorizontal() {
        this.flipHorizontal = !this.flipHorizontal;
        this.flipHBtn.classList.toggle('active');
        this.updatePreview();
    }

    toggleFlipVertical() {
        this.flipVertical = !this.flipVertical;
        this.flipVBtn.classList.toggle('active');
        this.updatePreview();
    }

    // Crop methods
    setAspectRatio(e) {
        const ratio = e.target.dataset.ratio;
        
        // Remove active class from all buttons
        document.querySelectorAll('.ratio-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (ratio === 'free') {
            this.aspectRatio = null;
            this.lockAspectRatio.checked = false;
        } else {
            e.target.classList.add('active');
            this.aspectRatio = parseFloat(ratio);
            this.lockAspectRatio.checked = true;
            this.adjustCropToAspectRatio();
        }
    }

    handleAspectRatioLock() {
        if (!this.lockAspectRatio.checked) {
            this.aspectRatio = null;
            document.querySelectorAll('.ratio-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        } else if (this.aspectRatio) {
            this.adjustCropToAspectRatio();
        }
    }

    handleCenterCrop() {
        if (this.centerCrop.checked) {
            this.centerCropArea();
        }
    }

    adjustCropToAspectRatio() {
        if (!this.aspectRatio) return;
        
        const currentWidth = parseInt(this.cropWidth.value);
        const currentHeight = parseInt(this.cropHeight.value);
        const targetRatio = this.aspectRatio;
        
        let newWidth, newHeight;
        
        if (currentWidth / currentHeight > targetRatio) {
            // Current is wider than target ratio, adjust width
            newHeight = currentHeight;
            newWidth = Math.round(newHeight * targetRatio);
        } else {
            // Current is taller than target ratio, adjust height
            newWidth = currentWidth;
            newHeight = Math.round(newWidth / targetRatio);
        }
        
        // Ensure dimensions don't exceed image bounds
        newWidth = Math.min(newWidth, this.originalImage.width);
        newHeight = Math.min(newHeight, this.originalImage.height);
        
        this.cropWidth.value = newWidth;
        this.cropHeight.value = newHeight;
        
        if (this.centerCrop.checked) {
            this.centerCropArea();
        }
        
        this.updateCropPreview();
    }

    centerCropArea() {
        const imgWidth = this.originalImage.width;
        const imgHeight = this.originalImage.height;
        const cropW = parseInt(this.cropWidth.value);
        const cropH = parseInt(this.cropHeight.value);
        
        const centerX = Math.max(0, Math.round((imgWidth - cropW) / 2));
        const centerY = Math.max(0, Math.round((imgHeight - cropH) / 2));
        
        this.cropX.value = centerX;
        this.cropY.value = centerY;
        
        this.updateCropPreview();
    }

    updateCropPreview() {
        // Validate crop dimensions
        const x = Math.max(0, parseInt(this.cropX.value));
        const y = Math.max(0, parseInt(this.cropY.value));
        const width = Math.max(1, parseInt(this.cropWidth.value));
        const height = Math.max(1, parseInt(this.cropHeight.value));
        
        // Ensure crop doesn't exceed image bounds
        const maxX = this.originalImage.width - width;
        const maxY = this.originalImage.height - height;
        
        this.cropX.value = Math.min(x, maxX);
        this.cropY.value = Math.min(y, maxY);
        this.cropWidth.value = Math.min(width, this.originalImage.width - x);
        this.cropHeight.value = Math.min(height, this.originalImage.height - y);
        
        // If aspect ratio is locked, maintain it
        if (this.lockAspectRatio.checked && this.aspectRatio) {
            const newWidth = parseInt(this.cropWidth.value);
            const expectedHeight = Math.round(newWidth / this.aspectRatio);
            if (Math.abs(parseInt(this.cropHeight.value) - expectedHeight) > 1) {
                this.cropHeight.value = expectedHeight;
            }
        }
    }

    // Preview methods
    updatePreview() {
        if (!this.originalImage) return;
        
        // Update original preview
        this.originalPreview.innerHTML = `<img src="${this.originalImage.src}" alt="Original">`;
        this.originalInfo.textContent = `${this.originalImage.width} × ${this.originalImage.height}px`;
        
        // Create preview of transformations
        this.createPreview();
    }

    createPreview() {
        const img = this.originalImage;
        
        // Calculate canvas size considering rotation
        let canvasWidth = img.width;
        let canvasHeight = img.height;
        
        if (this.currentRotation === 90 || this.currentRotation === 270) {
            canvasWidth = img.height;
            canvasHeight = img.width;
        }
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Save context
        this.ctx.save();
        
        // Move to center for transformations
        this.ctx.translate(canvasWidth / 2, canvasHeight / 2);
        
        // Apply rotation
        this.ctx.rotate((this.currentRotation * Math.PI) / 180);
        
        // Apply flips
        this.ctx.scale(this.flipHorizontal ? -1 : 1, this.flipVertical ? -1 : 1);
        
        // Draw image centered
        this.ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        // Restore context
        this.ctx.restore();
        
        // Create preview image
        const previewImg = new Image();
        previewImg.onload = () => {
            this.processedPreview.innerHTML = '';
            this.processedPreview.appendChild(previewImg);
            this.processedInfo.textContent = `${this.canvas.width} × ${this.canvas.height}px`;
        };
        previewImg.src = this.canvas.toDataURL();
        previewImg.alt = 'Processed';
        previewImg.style.maxWidth = '100%';
        previewImg.style.maxHeight = '300px';
    }

    // Action methods
    resetImage() {
        if (!this.originalImage) return;
        
        this.resetSettings();
        this.setupCropDimensions();
        this.updatePreview();
    }

    applyTransformations() {
        if (!this.originalImage) return;
        
        const img = this.originalImage;
        
        // Get crop dimensions
        const cropX = parseInt(this.cropX.value);
        const cropY = parseInt(this.cropY.value);
        const cropWidth = parseInt(this.cropWidth.value);
        const cropHeight = parseInt(this.cropHeight.value);
        
        // Calculate final canvas size
        let finalWidth = cropWidth;
        let finalHeight = cropHeight;
        
        if (this.currentRotation === 90 || this.currentRotation === 270) {
            finalWidth = cropHeight;
            finalHeight = cropWidth;
        }
        
        // Set canvas size
        this.canvas.width = finalWidth;
        this.canvas.height = finalHeight;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, finalWidth, finalHeight);
        
        // Save context
        this.ctx.save();
        
        // Move to center
        this.ctx.translate(finalWidth / 2, finalHeight / 2);
        
        // Apply rotation
        this.ctx.rotate((this.currentRotation * Math.PI) / 180);
        
        // Apply flips
        this.ctx.scale(this.flipHorizontal ? -1 : 1, this.flipVertical ? -1 : 1);
        
        // Draw cropped portion centered
        this.ctx.drawImage(
            img,
            cropX, cropY, cropWidth, cropHeight,
            -cropWidth / 2, -cropHeight / 2, cropWidth, cropHeight
        );
        
        // Restore context
        this.ctx.restore();
        
        // Show results
        this.showResults();
    }

    showResults() {
        // Update result previews
        this.originalPreview.innerHTML = `<img src="${this.originalImage.src}" alt="Original">`;
        this.originalInfo.textContent = `${this.originalImage.width} × ${this.originalImage.height}px`;
        
        const resultImg = new Image();
        resultImg.onload = () => {
            this.processedPreview.innerHTML = '';
            this.processedPreview.appendChild(resultImg);
            this.processedInfo.textContent = `${this.canvas.width} × ${this.canvas.height}px`;
        };
        resultImg.src = this.canvas.toDataURL();
        resultImg.alt = 'Result';
        resultImg.style.maxWidth = '100%';
        resultImg.style.maxHeight = '300px';
        
        // Show results section
        this.resultsSection.classList.remove('hidden');
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    downloadResult() {
        const link = document.createElement('a');
        link.download = `cropped-rotated-image-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }

    processNewImage() {
        // Reset everything
        this.originalImage = null;
        this.currentImage = null;
        this.fileInput.value = '';
        
        // Hide sections
        this.settingsSection.classList.add('hidden');
        this.resultsSection.classList.add('hidden');
        
        // Reset form
        this.resetSettings();
        
        // Clear previews
        this.originalPreview.innerHTML = '';
        this.processedPreview.innerHTML = '';
        this.originalInfo.textContent = '';
        this.processedInfo.textContent = '';
    }
}

// Initialize the tool when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageCropperRotator();
});
