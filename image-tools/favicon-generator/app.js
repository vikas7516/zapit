class FaviconGenerator {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.sizes = [
            { w: 16, h: 16, name: 'favicon.ico', type: 'image/x-icon' }, // We'll fake .ico with PNG for simplicity or use a lib if needed, but standard practice now accepts PNG as favicon.ico or just favicon.png. Actually, browsers support PNG favicons. But to be safe, we can just name it .ico but it's a png content. Most browsers handle this. Or we can just output 16x16 png.
            // Let's stick to standard filenames
            { w: 16, h: 16, name: 'favicon-16x16.png', type: 'image/png' },
            { w: 32, h: 32, name: 'favicon-32x32.png', type: 'image/png' },
            { w: 180, h: 180, name: 'apple-touch-icon.png', type: 'image/png' },
            { w: 192, h: 192, name: 'android-chrome-192x192.png', type: 'image/png' },
            { w: 512, h: 512, name: 'android-chrome-512x512.png', type: 'image/png' }
        ];
    }

    initElements() {
        this.uploadSection = document.getElementById('uploadSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.browseLink = document.getElementById('browseLink');
        this.previewImage = document.getElementById('previewImage');
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

        this.downloadBtn.addEventListener('click', () => this.generateAndDownload());
        this.processAnotherBtn.addEventListener('click', () => this.reset());
    }

    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.uploadSection.classList.add('hidden');
            this.resultsSection.classList.remove('hidden');
            this.sourceImage = new Image();
            this.sourceImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
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
        this.sourceImage = null;
    }

    async generateAndDownload() {
        if (!this.sourceImage) return;

        const zip = new JSZip();

        // Generate images
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const promises = this.sizes.map(size => {
            return new Promise(resolve => {
                canvas.width = size.w;
                canvas.height = size.h;
                ctx.clearRect(0, 0, size.w, size.h);

                // Draw and resize
                ctx.drawImage(this.sourceImage, 0, 0, size.w, size.h);

                canvas.toBlob(blob => {
                    zip.file(size.name, blob);

                    // Special case: also save 16x16 as favicon.ico for legacy support (it's actually a png but browsers tolerate it, or we could try to find a js lib for real ico, but this is usually enough for a pure frontend tool)
                    if (size.name === 'favicon-16x16.png') {
                        zip.file('favicon.ico', blob);
                    }
                    resolve();
                }, size.type);
            });
        });

        await Promise.all(promises);

        // Generate site.webmanifest
        const manifest = {
            "name": "My Website",
            "short_name": "Website",
            "icons": [
                { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
                { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
            ],
            "theme_color": "#ffffff",
            "background_color": "#ffffff",
            "display": "standalone"
        };
        zip.file('site.webmanifest', JSON.stringify(manifest, null, 2));

        // Generate HTML tags snippet
        const htmlTags = `
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
        `.trim();
        zip.file('tags.html', htmlTags);

        // Download zip
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "favicons.zip";
        link.click();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FaviconGenerator();
});
