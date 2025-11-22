class ExifViewer {
    constructor() {
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.uploadSection = document.getElementById('uploadSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.browseLink = document.getElementById('browseLink');
        this.previewImage = document.getElementById('previewImage');
        this.exifDataContainer = document.getElementById('exifDataContainer');
        this.processAnotherBtn = document.getElementById('processAnotherBtn');
        this.uploadError = document.getElementById('uploadError');
    }

    bindEvents() {
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.handleFile(file);
        });

        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.browseLink.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this.handleFile(e.target.files[0]);
        });

        this.processAnotherBtn.addEventListener('click', () => this.reset());
    }

    handleFile(file) {
        if (!file.type.match('image/jpeg') && !file.type.match('image/tiff')) {
            this.showError('Please upload a JPEG or TIFF image to view EXIF data.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.uploadSection.classList.add('hidden');
            this.resultsSection.classList.remove('hidden');

            // Wait for image to load to ensure EXIF parsing works on the element if needed, 
            // but EXIF.getData works on the image object.
            this.previewImage.onload = () => {
                EXIF.getData(this.previewImage, () => {
                    const allMetaData = EXIF.getAllTags(this.previewImage);
                    this.displayData(allMetaData);
                });
            };
        };
        reader.readAsDataURL(file);
    }

    displayData(data) {
        this.exifDataContainer.innerHTML = '';

        if (Object.keys(data).length === 0) {
            this.exifDataContainer.innerHTML = '<p style="text-align: center; color: var(--tool-text-secondary);">No EXIF data found in this image.</p>';
            return;
        }

        // Helper to format values
        const formatValue = (key, value) => {
            if (key === 'MakerNote' || key === 'UserComment') return '[Complex Data]';
            if (value instanceof Number) return value.toString();
            if (value instanceof String) return value;
            return String(value);
        };

        // Important tags to show first
        const priorityTags = ['Make', 'Model', 'DateTimeOriginal', 'ExposureTime', 'FNumber', 'ISOSpeedRatings', 'FocalLength', 'GPSLatitude', 'GPSLongitude'];

        // Render priority tags first
        priorityTags.forEach(tag => {
            if (data[tag]) {
                this.createRow(tag, formatValue(tag, data[tag]), true);
                delete data[tag]; // Remove so we don't show twice
            }
        });

        // Render remaining tags
        for (const [key, value] of Object.entries(data)) {
            // Skip thumbnail data for cleaner view
            if (key.includes('Thumbnail')) continue;
            this.createRow(key, formatValue(key, value), false);
        }
    }

    createRow(label, value, isPriority) {
        const row = document.createElement('div');
        row.className = 'result-item';
        if (isPriority) row.style.fontWeight = 'bold';

        row.innerHTML = `
            <span class="result-label">${label}</span>
            <span class="result-value" style="max-width: 60%; text-align: right; word-break: break-all;">${value}</span>
        `;
        this.exifDataContainer.appendChild(row);
    }

    showError(msg) {
        this.uploadError.textContent = msg;
        this.uploadError.classList.add('show');
        setTimeout(() => this.uploadError.classList.remove('show'), 3000);
    }

    reset() {
        this.fileInput.value = '';
        this.uploadSection.classList.remove('hidden');
        this.resultsSection.classList.add('hidden');
        this.previewImage.src = '';
        this.exifDataContainer.innerHTML = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ExifViewer();
});
