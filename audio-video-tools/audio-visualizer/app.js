// Audio Visualizer Tool - JavaScript functionality

class AudioVisualizer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.audioElement = null;
        this.sourceNode = null;
        this.dataArray = null;
        this.bufferLength = null;
        this.canvas = null;
        this.canvasCtx = null;
        this.animationId = null;
        this.isPlaying = false;
        this.currentFile = null;
        this.visualizationType = 'frequency';
        this.sensitivity = 5;
        
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupCanvas();
    }

    setupElements() {
        // File input and upload
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadError = document.getElementById('uploadError');
        this.uploadSection = document.getElementById('uploadSection');
        
        // Control sections
        this.controlsSection = document.getElementById('controlsSection');
        this.visualizationSection = document.getElementById('visualizationSection');
        
        // Audio controls
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        
        // Visualization controls
        this.vizTypeRadios = document.querySelectorAll('input[name="vizType"]');
        this.sensitivitySlider = document.getElementById('sensitivitySlider');
        this.sensitivityValue = this.sensitivitySlider.nextElementSibling;
        
        // Reset button
        this.resetBtn = document.getElementById('resetBtn');
        
        // Info display
        this.audioInfo = document.getElementById('audioInfo');
        
        // Canvas
        this.canvas = document.getElementById('visualizerCanvas');
        this.canvasCtx = this.canvas.getContext('2d');
    }

    setupEventListeners() {
        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Audio controls
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.stopBtn.addEventListener('click', () => this.stopAudio());
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e));
        this.progressBar.addEventListener('click', (e) => this.seekAudio(e));
        
        // Visualization controls
        this.vizTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.updateVisualizationType(e));
        });
        this.sensitivitySlider.addEventListener('input', (e) => this.updateSensitivity(e));
        
        // Reset
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupCanvas() {
        this.resizeCanvas();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.style.borderColor = '#3b82f6';
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.style.borderColor = '';
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
        // Validate file type
        if (!file.type.startsWith('audio/')) {
            this.showError('Please select a valid audio file.');
            return;
        }

        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            this.showError('File size must be less than 50MB.');
            return;
        }

        this.clearError();
        this.currentFile = file;
        
        try {
            await this.setupAudio(file);
            this.showControls();
            this.updateAudioInfo(file);
        } catch (error) {
            this.showError('Error loading audio file: ' + error.message);
        }
    }

    async setupAudio(file) {
        // Create audio element
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
        }

        this.audioElement = new Audio();
        this.audioElement.src = URL.createObjectURL(file);
        
        // Setup Web Audio API
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Create analyser
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);

        // Connect audio element to analyser
        if (this.sourceNode) {
            this.sourceNode.disconnect();
        }
        this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        // Audio event listeners
        this.audioElement.addEventListener('loadedmetadata', () => {
            this.durationEl.textContent = this.formatTime(this.audioElement.duration);
        });

        this.audioElement.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audioElement.addEventListener('ended', () => {
            this.stopAudio();
        });

        // Set initial volume
        this.audioElement.volume = this.volumeSlider.value / 100;
    }

    showControls() {
        this.controlsSection.classList.remove('hidden');
        this.visualizationSection.classList.remove('hidden');
        this.startVisualization();
    }

    updateAudioInfo(file) {
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        this.audioInfo.textContent = `${file.name} • ${sizeInMB} MB`;
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pauseAudio();
        } else {
            this.playAudio();
        }
    }

    async playAudio() {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        this.audioElement.play();
        this.isPlaying = true;
        this.playPauseBtn.innerHTML = '<span class="play-icon">⏸️</span>';
        this.startVisualization();
    }

    pauseAudio() {
        this.audioElement.pause();
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<span class="play-icon">▶️</span>';
    }

    stopAudio() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<span class="play-icon">▶️</span>';
        this.stopVisualization();
    }

    updateVolume(e) {
        if (this.audioElement) {
            this.audioElement.volume = e.target.value / 100;
        }
    }

    seekAudio(e) {
        if (!this.audioElement) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        this.audioElement.currentTime = percentage * this.audioElement.duration;
    }

    updateProgress() {
        if (!this.audioElement) return;
        
        const currentTime = this.audioElement.currentTime;
        const duration = this.audioElement.duration;
        const percentage = (currentTime / duration) * 100;
        
        this.progressFill.style.width = percentage + '%';
        this.currentTimeEl.textContent = this.formatTime(currentTime);
    }

    updateVisualizationType(e) {
        this.visualizationType = e.target.value;
    }

    updateSensitivity(e) {
        this.sensitivity = parseInt(e.target.value);
        this.sensitivityValue.textContent = this.sensitivity;
    }

    startVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.visualize();
    }

    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.clearCanvas();
    }

    visualize() {
        this.animationId = requestAnimationFrame(() => this.visualize());
        
        if (!this.analyser) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        switch (this.visualizationType) {
            case 'frequency':
                this.drawFrequencyBars();
                break;
            case 'waveform':
                this.drawWaveform();
                break;
            case 'circular':
                this.drawCircular();
                break;
        }
    }

    drawFrequencyBars() {
        const canvas = this.canvas;
        const ctx = this.canvasCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        const barWidth = width / this.bufferLength * 2.5;
        let barHeight;
        let x = 0;
        
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#10b981');
        
        for (let i = 0; i < this.bufferLength; i++) {
            barHeight = (this.dataArray[i] / 255) * height * (this.sensitivity / 5);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    }

    drawWaveform() {
        const canvas = this.canvas;
        const ctx = this.canvasCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        this.analyser.getByteTimeDomainData(this.dataArray);
        
        ctx.clearRect(0, 0, width, height);
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        
        const sliceWidth = width / this.bufferLength;
        let x = 0;
        
        for (let i = 0; i < this.bufferLength; i++) {
            const v = (this.dataArray[i] / 128.0) * (this.sensitivity / 5);
            const y = v * height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
    }

    drawCircular() {
        const canvas = this.canvas;
        const ctx = this.canvasCtx;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 4;
        
        ctx.clearRect(0, 0, width, height);
        
        const bars = 64;
        const step = Math.floor(this.bufferLength / bars);
        
        for (let i = 0; i < bars; i++) {
            const value = this.dataArray[i * step];
            const angle = (i / bars) * Math.PI * 2;
            const barHeight = (value / 255) * radius * (this.sensitivity / 5);
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + barHeight);
            
            const hue = (i / bars) * 360;
            ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    clearCanvas() {
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    reset() {
        this.stopAudio();
        this.stopVisualization();
        
        if (this.audioElement) {
            URL.revokeObjectURL(this.audioElement.src);
            this.audioElement = null;
        }
        
        this.controlsSection.classList.add('hidden');
        this.visualizationSection.classList.add('hidden');
        this.fileInput.value = '';
        this.currentFile = null;
        this.clearError();
        this.clearCanvas();
    }

    showError(message) {
        this.uploadError.textContent = message;
        this.uploadError.style.display = 'block';
    }

    clearError() {
        this.uploadError.textContent = '';
        this.uploadError.style.display = 'none';
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Initialize the tool when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AudioVisualizer();
});
