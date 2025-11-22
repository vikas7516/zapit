class MemeGenerator {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.image = null;
    }

    initElements() {
        this.uploadSection = document.getElementById('uploadSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.browseLink = document.getElementById('browseLink');
        this.canvas = document.getElementById('memeCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.topText = document.getElementById('topText');
        this.bottomText = document.getElementById('bottomText');
        this.fontSize = document.getElementById('fontSize');
        this.textColor = document.getElementById('textColor');
        this.strokeColor = document.getElementById('strokeColor');

        this.downloadBtn = document.getElementById('downloadBtn');
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

        // Live updates
        [this.topText, this.bottomText, this.fontSize, this.textColor, this.strokeColor].forEach(el => {
            el.addEventListener('input', () => this.drawMeme());
        });

        this.downloadBtn.addEventListener('click', () => this.download());
        this.processAnotherBtn.addEventListener('click', () => this.reset());
    }

    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.image = new Image();
            this.image.onload = () => {
                this.uploadSection.classList.add('hidden');
                this.resultsSection.classList.remove('hidden');
                this.canvas.width = this.image.width;
                this.canvas.height = this.image.height;

                // Limit canvas display size via CSS but keep internal resolution
                // CSS max-width is handled in stylesheet

                this.drawMeme();
            };
            this.image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    drawMeme() {
        if (!this.image) return;

        const width = this.canvas.width;
        const height = this.canvas.height;

        this.ctx.clearRect(0, 0, width, height);
        this.ctx.drawImage(this.image, 0, 0);

        const fontSize = parseInt(this.fontSize.value);
        this.ctx.font = `bold ${fontSize}px Impact, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.textColor.value;
        this.ctx.strokeStyle = this.strokeColor.value;
        this.ctx.lineWidth = fontSize / 15;
        this.ctx.lineJoin = 'round';

        // Top Text
        if (this.topText.value) {
            this.ctx.textBaseline = 'top';
            this.ctx.strokeText(this.topText.value.toUpperCase(), width / 2, 20);
            this.ctx.fillText(this.topText.value.toUpperCase(), width / 2, 20);
        }

        // Bottom Text
        if (this.bottomText.value) {
            this.ctx.textBaseline = 'bottom';
            this.ctx.strokeText(this.bottomText.value.toUpperCase(), width / 2, height - 20);
            this.ctx.fillText(this.bottomText.value.toUpperCase(), width / 2, height - 20);
        }
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
        this.image = null;
        this.topText.value = '';
        this.bottomText.value = '';
    }

    download() {
        const link = document.createElement('a');
        link.download = 'meme.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MemeGenerator();
});
