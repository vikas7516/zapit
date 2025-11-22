// Audio Trimmer App - Web Audio API Implementation
class AudioTrimmer {
    constructor() {
        this.audioBuffer = null;
        this.audioContext = null;
        this.source = null;
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.selectionStart = 0;
        this.selectionEnd = 0;
        this.duration = 0;
        this.playStartTime = 0;
        this.animationId = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.setupAudioContext();
    }

    initializeElements() {
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.audioFileInput = document.getElementById('audioFileInput');
        this.fileInfo = document.getElementById('fileInfo');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Waveform elements
        this.waveformSection = document.getElementById('waveformSection');
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.selectionOverlay = document.getElementById('selectionOverlay');
        this.playhead = document.getElementById('playhead');
        this.currentTime = document.getElementById('currentTime');
        this.durationDisplay = document.getElementById('duration');
        
        // Control elements
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        
        // Trim controls
        this.trimControls = document.getElementById('trimControls');
        this.startTimeInput = document.getElementById('startTime');
        this.endTimeInput = document.getElementById('endTime');
        this.selectionDuration = document.getElementById('selectionDuration');
        this.resetBtn = document.getElementById('resetBtn');
        this.previewBtn = document.getElementById('previewBtn');
        this.trimBtn = document.getElementById('trimBtn');
        
        // Export elements
        this.exportSection = document.getElementById('exportSection');
        this.exportFormat = document.getElementById('exportFormat');
        this.exportQuality = document.getElementById('exportQuality');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.trimmedPlayer = document.getElementById('trimmedPlayer');
        this.trimmedAudio = document.getElementById('trimmedAudio');
        
        this.ctx = this.waveformCanvas.getContext('2d');
    }

    attachEventListeners() {
        // Upload events
        this.uploadArea.addEventListener('click', () => this.audioFileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.audioFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Playback controls
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        
        // Waveform interaction
        this.waveformCanvas.addEventListener('mousedown', (e) => this.startSelection(e));
        this.waveformCanvas.addEventListener('mousemove', (e) => this.updateSelection(e));
        this.waveformCanvas.addEventListener('mouseup', () => this.endSelection());
        this.waveformCanvas.addEventListener('click', (e) => this.seekTo(e));
        
        // Trim controls
        this.startTimeInput.addEventListener('input', () => this.updateSelectionFromInputs());
        this.endTimeInput.addEventListener('input', () => this.updateSelectionFromInputs());
        this.resetBtn.addEventListener('click', () => this.resetSelection());
        this.previewBtn.addEventListener('click', () => this.previewSelection());
        this.trimBtn.addEventListener('click', () => this.trimAudio());
        
        // Export
        this.downloadBtn.addEventListener('click', () => this.downloadTrimmedAudio());
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    async setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Web Audio API not supported:', error);
            alert('Your browser does not support Web Audio API');
        }
    }

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
            this.loadAudioFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.loadAudioFile(files[0]);
        }
    }

    async loadAudioFile(file) {
        if (!file.type.startsWith('audio/')) {
            alert('Please select a valid audio file');
            return;
        }

        try {
            this.showProgress('Loading audio file...');
            
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.duration = this.audioBuffer.duration;
            this.selectionStart = 0;
            this.selectionEnd = this.duration;
            
            this.updateFileInfo(file);
            this.setupWaveform();
            this.showSections();
            this.hideProgress();
            
        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('Error loading audio file. Please try a different file.');
            this.hideProgress();
        }
    }

    updateFileInfo(file) {
        const size = this.formatFileSize(file.size);
        const duration = this.formatTime(this.duration);
        this.fileInfo.textContent = `${file.name} (${duration}, ${size})`;
    }

    showProgress(text) {
        this.uploadProgress.classList.remove('hidden');
        this.progressText.textContent = text;
        this.progressFill.style.width = '100%';
    }

    hideProgress() {
        this.uploadProgress.classList.add('hidden');
        this.progressFill.style.width = '0%';
    }

    showSections() {
        this.waveformSection.classList.remove('hidden');
        this.trimControls.classList.remove('hidden');
        this.exportSection.classList.remove('hidden');
    }

    setupWaveform() {
        this.resizeCanvas();
        this.drawWaveform();
        this.updateTimeDisplays();
        this.updateSelectionInputs();
    }

    resizeCanvas() {
        const container = this.waveformCanvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.waveformCanvas.width = rect.width - 4; // Account for border
        this.waveformCanvas.height = 200;
        
        if (this.audioBuffer) {
            this.drawWaveform();
        }
    }

    drawWaveform() {
        if (!this.audioBuffer) return;
        
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        const channelData = this.audioBuffer.getChannelData(0);
        const samplesPerPixel = Math.floor(channelData.length / width);
        
        this.ctx.clearRect(0, 0, width, height);
        
        // Draw waveform
        this.ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--waveform-line').trim();
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        
        for (let x = 0; x < width; x++) {
            const startSample = x * samplesPerPixel;
            const endSample = Math.min(startSample + samplesPerPixel, channelData.length);
            
            let min = 1;
            let max = -1;
            
            for (let i = startSample; i < endSample; i++) {
                const sample = channelData[i];
                if (sample < min) min = sample;
                if (sample > max) max = sample;
            }
            
            const yMin = ((min + 1) / 2) * height;
            const yMax = ((max + 1) / 2) * height;
            
            if (x === 0) {
                this.ctx.moveTo(x, yMin);
            } else {
                this.ctx.lineTo(x, yMin);
            }
            this.ctx.lineTo(x, yMax);
        }
        
        this.ctx.stroke();
        
        // Update selection overlay
        this.updateSelectionOverlay();
    }

    updateSelectionOverlay() {
        const canvasRect = this.waveformCanvas.getBoundingClientRect();
        const startPercent = (this.selectionStart / this.duration) * 100;
        const endPercent = (this.selectionEnd / this.duration) * 100;
        const widthPercent = endPercent - startPercent;
        
        this.selectionOverlay.style.left = `${startPercent}%`;
        this.selectionOverlay.style.width = `${widthPercent}%`;
        this.selectionOverlay.style.display = 'block';
    }

    startSelection(e) {
        if (!this.audioBuffer) return;
        
        this.isSelecting = true;
        const rect = this.waveformCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        
        this.selectionStart = percent * this.duration;
        this.selectionEnd = this.selectionStart;
        
        this.updateSelectionOverlay();
        this.updateSelectionInputs();
    }

    updateSelection(e) {
        if (!this.isSelecting || !this.audioBuffer) return;
        
        const rect = this.waveformCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        
        this.selectionEnd = percent * this.duration;
        
        // Ensure start is always before end
        if (this.selectionEnd < this.selectionStart) {
            [this.selectionStart, this.selectionEnd] = [this.selectionEnd, this.selectionStart];
        }
        
        this.updateSelectionOverlay();
        this.updateSelectionInputs();
    }

    endSelection() {
        this.isSelecting = false;
    }

    seekTo(e) {
        if (!this.audioBuffer || this.isSelecting) return;
        
        const rect = this.waveformCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        
        this.currentTime = percent * this.duration;
        this.updatePlayhead();
        this.updateTimeDisplays();
    }

    updateSelectionFromInputs() {
        const start = parseFloat(this.startTimeInput.value) || 0;
        const end = parseFloat(this.endTimeInput.value) || this.duration;
        
        this.selectionStart = Math.max(0, Math.min(start, this.duration));
        this.selectionEnd = Math.max(this.selectionStart, Math.min(end, this.duration));
        
        this.updateSelectionOverlay();
        this.updateSelectionInputs();
    }

    updateSelectionInputs() {
        this.startTimeInput.value = this.selectionStart.toFixed(1);
        this.endTimeInput.value = this.selectionEnd.toFixed(1);
        
        const selectionDur = this.selectionEnd - this.selectionStart;
        this.selectionDuration.textContent = `${selectionDur.toFixed(1)}s`;
    }

    resetSelection() {
        this.selectionStart = 0;
        this.selectionEnd = this.duration;
        this.updateSelectionOverlay();
        this.updateSelectionInputs();
    }

    async play() {
        if (!this.audioBuffer) return;
        
        this.stop(); // Stop any existing playback
        
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.connect(this.audioContext.destination);
        
        this.playStartTime = this.audioContext.currentTime;
        this.source.start(0, this.currentTime);
        
        this.isPlaying = true;
        this.updatePlayControls();
        this.startPlayheadAnimation();
        
        this.source.onended = () => {
            this.stop();
        };
    }

    pause() {
        if (this.source && this.isPlaying) {
            this.source.stop();
            this.currentTime += this.audioContext.currentTime - this.playStartTime;
            this.isPlaying = false;
            this.updatePlayControls();
            this.stopPlayheadAnimation();
        }
    }

    stop() {
        if (this.source) {
            this.source.stop();
            this.source = null;
        }
        
        this.isPlaying = false;
        this.currentTime = 0;
        this.updatePlayControls();
        this.updatePlayhead();
        this.updateTimeDisplays();
        this.stopPlayheadAnimation();
    }

    async previewSelection() {
        if (!this.audioBuffer) return;
        
        this.stop();
        
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.connect(this.audioContext.destination);
        
        const startTime = this.selectionStart;
        const duration = this.selectionEnd - this.selectionStart;
        
        this.playStartTime = this.audioContext.currentTime;
        this.currentTime = startTime;
        this.source.start(0, startTime, duration);
        
        this.isPlaying = true;
        this.updatePlayControls();
        this.startPlayheadAnimation();
        
        this.source.onended = () => {
            this.stop();
        };
    }

    updatePlayControls() {
        this.playBtn.classList.toggle('hidden', this.isPlaying);
        this.pauseBtn.classList.toggle('hidden', !this.isPlaying);
    }

    startPlayheadAnimation() {
        const animate = () => {
            if (this.isPlaying) {
                const elapsed = this.audioContext.currentTime - this.playStartTime;
                this.currentTime = Math.min(
                    this.startTime + elapsed,
                    this.duration
                );
                
                this.updatePlayhead();
                this.updateTimeDisplays();
                
                if (this.currentTime < this.duration) {
                    this.animationId = requestAnimationFrame(animate);
                } else {
                    this.stop();
                }
            }
        };
        
        animate();
    }

    stopPlayheadAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    updatePlayhead() {
        const percent = (this.currentTime / this.duration) * 100;
        this.playhead.style.left = `${percent}%`;
        this.playhead.style.display = 'block';
    }

    updateTimeDisplays() {
        this.currentTime.textContent = this.formatTime(this.currentTime);
        this.durationDisplay.textContent = this.formatTime(this.duration);
    }

    async trimAudio() {
        if (!this.audioBuffer) return;
        
        try {
            const startSample = Math.floor(this.selectionStart * this.audioBuffer.sampleRate);
            const endSample = Math.floor(this.selectionEnd * this.audioBuffer.sampleRate);
            const length = endSample - startSample;
            
            // Create new buffer with trimmed audio
            const trimmedBuffer = this.audioContext.createBuffer(
                this.audioBuffer.numberOfChannels,
                length,
                this.audioBuffer.sampleRate
            );
            
            // Copy audio data
            for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
                const originalData = this.audioBuffer.getChannelData(channel);
                const trimmedData = trimmedBuffer.getChannelData(channel);
                
                for (let i = 0; i < length; i++) {
                    trimmedData[i] = originalData[startSample + i];
                }
            }
            
            this.trimmedBuffer = trimmedBuffer;
            
            // Create audio blob for preview
            const audioBlob = await this.bufferToWav(trimmedBuffer);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.trimmedAudio.src = audioUrl;
            this.trimmedPlayer.classList.remove('hidden');
            
            alert('Audio trimmed successfully! You can now preview and download it.');
            
        } catch (error) {
            console.error('Error trimming audio:', error);
            alert('Error trimming audio. Please try again.');
        }
    }

    async downloadTrimmedAudio() {
        if (!this.trimmedBuffer) {
            alert('Please trim the audio first');
            return;
        }
        
        try {
            let audioBlob;
            const format = this.exportFormat.value;
            
            if (format === 'wav') {
                audioBlob = await this.bufferToWav(this.trimmedBuffer);
            } else {
                // For other formats, we'll use WAV as fallback
                audioBlob = await this.bufferToWav(this.trimmedBuffer);
            }
            
            const url = URL.createObjectURL(audioBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trimmed-audio.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Error downloading audio:', error);
            alert('Error downloading audio. Please try again.');
        }
    }

    // Convert AudioBuffer to WAV blob
    async bufferToWav(buffer) {
        const length = buffer.length;
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * numberOfChannels * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * numberOfChannels * 2, true);
        
        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = buffer.getChannelData(channel)[i];
                const intSample = Math.max(-1, Math.min(1, sample));
                view.setInt16(offset, intSample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Check browser compatibility
    static checkCompatibility() {
        const issues = [];
        
        if (!window.AudioContext && !window.webkitAudioContext) {
            issues.push('Web Audio API not supported');
        }
        
        if (!window.FileReader) {
            issues.push('FileReader API not supported');
        }
        
        if (issues.length > 0) {
            alert('Audio Trimmer is not supported in this browser:\n\n' + issues.join('\n'));
            return false;
        }
        
        return true;
    }
}

// Initialize the audio trimmer when the page loads
let audioTrimmer;

document.addEventListener('DOMContentLoaded', () => {
    if (AudioTrimmer.checkCompatibility()) {
        audioTrimmer = new AudioTrimmer();
    }
});
