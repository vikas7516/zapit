// Audio Equalizer App
class AudioEqualizer {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.eqFilters = [];
        this.analyser = null;
        this.isPlaying = false;
        this.currentFile = null;
        this.frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        this.canvas = null;
        this.canvasCtx = null;
        this.animationId = null;
        
        // EQ Presets
        this.presets = {
            flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            rock: [4, 3, -2, -1, 1, 2, 3, 4, 5, 4],
            pop: [2, 1, 0, 1, 2, 1, 0, -1, -2, -1],
            classical: [3, 2, 1, 0, -1, 0, 1, 2, 3, 2],
            electronic: [6, 4, 2, 0, -2, 2, 4, 6, 8, 6],
            'bass-boost': [8, 6, 4, 2, 0, -1, -2, -1, 0, 1],
            vocals: [-2, -1, 0, 2, 4, 4, 3, 2, 1, 0],
            custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.setupEventListeners();
        this.initializeCanvas();
    }
    
    setupEventListeners() {
        // File upload
        const fileInput = document.getElementById('audioFileInput');
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('audio/')) {
                this.handleFileSelect(file);
            }
        });
        
        // Audio controls
        document.getElementById('playBtn').addEventListener('click', () => this.playAudio());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopAudio());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetEQ());
        
        // Preset selection
        document.getElementById('presetSelect').addEventListener('change', (e) => {
            this.applyPreset(e.target.value);
        });
        
        // EQ sliders
        document.querySelectorAll('.eq-slider').forEach((slider, index) => {
            slider.addEventListener('input', (e) => {
                this.updateEQBand(index, parseFloat(e.target.value));
                this.updateGainDisplay(index, parseFloat(e.target.value));
            });
        });
        
        // Export functionality
        document.getElementById('processBtn').addEventListener('click', () => this.processAudio());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadProcessedAudio());
    }
    
    initializeCanvas() {
        this.canvas = document.getElementById('frequencyCanvas');
        this.canvasCtx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 200;
        
        // Draw initial frequency response
        this.drawFrequencyResponse();
    }
    
    async handleFileSelect(file) {
        if (!file) return;
        
        this.currentFile = file;
        this.updateFileInfo(file);
        this.showUploadProgress(true);
        
        try {
            // Initialize Web Audio API
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Read and decode audio file
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Setup audio nodes
            this.setupAudioNodes();
            
            // Show equalizer interface
            this.showEqualizerSection();
            this.showExportSection();
            
            this.showUploadProgress(false);
            
        } catch (error) {
            console.error('Error loading audio file:', error);
            this.showError('Failed to load audio file. Please try a different file.');
            this.showUploadProgress(false);
        }
    }
    
    setupAudioNodes() {
        // Create equalizer filters
        this.eqFilters = [];
        
        this.frequencies.forEach((freq, index) => {
            const filter = this.audioContext.createBiquadFilter();
            
            if (index === 0) {
                // First band - highpass
                filter.type = 'highpass';
                filter.frequency.value = freq;
            } else if (index === this.frequencies.length - 1) {
                // Last band - lowpass  
                filter.type = 'lowpass';
                filter.frequency.value = freq;
            } else {
                // Middle bands - peaking
                filter.type = 'peaking';
                filter.frequency.value = freq;
                filter.Q.value = 1;
            }
            
            filter.gain.value = 0;
            this.eqFilters.push(filter);
        });
        
        // Create gain node
        this.gainNode = this.audioContext.createGain();
        
        // Create analyser for visualization
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        
        // Connect filters in series
        this.eqFilters.forEach((filter, index) => {
            if (index === 0) {
                // First filter will be connected when playing
            } else {
                this.eqFilters[index - 1].connect(filter);
            }
        });
        
        // Connect last filter to gain, then to analyser, then to destination
        const lastFilter = this.eqFilters[this.eqFilters.length - 1];
        lastFilter.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
    }
    
    playAudio() {
        if (!this.audioBuffer || this.isPlaying) return;
        
        try {
            // Create new source node
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            
            // Connect source to first filter
            this.sourceNode.connect(this.eqFilters[0]);
            
            // Handle playback end
            this.sourceNode.onended = () => {
                this.stopAudio();
            };
            
            // Start playback
            this.sourceNode.start();
            this.isPlaying = true;
            
            // Update UI
            this.updatePlaybackControls();
            
            // Start visualization
            this.startVisualization();
            
        } catch (error) {
            console.error('Error playing audio:', error);
            this.showError('Failed to play audio.');
        }
    }
    
    stopAudio() {
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
            } catch (error) {
                // Source may already be stopped
            }
            this.sourceNode = null;
        }
        
        this.isPlaying = false;
        this.updatePlaybackControls();
        this.stopVisualization();
    }
    
    updateEQBand(bandIndex, gainValue) {
        if (this.eqFilters[bandIndex]) {
            this.eqFilters[bandIndex].gain.value = gainValue;
        }
        
        // Update visualization
        this.drawFrequencyResponse();
        
        // Update preset to custom
        document.getElementById('presetSelect').value = 'custom';
    }
    
    updateGainDisplay(bandIndex, gainValue) {
        const gainDisplay = document.querySelectorAll('.gain-value')[bandIndex];
        if (gainDisplay) {
            gainDisplay.textContent = gainValue.toFixed(1) + 'dB';
        }
    }
    
    applyPreset(presetName) {
        const presetValues = this.presets[presetName];
        if (!presetValues) return;
        
        const sliders = document.querySelectorAll('.eq-slider');
        
        presetValues.forEach((value, index) => {
            if (sliders[index]) {
                sliders[index].value = value;
                this.updateEQBand(index, value);
                this.updateGainDisplay(index, value);
            }
        });
    }
    
    resetEQ() {
        this.applyPreset('flat');
        document.getElementById('presetSelect').value = 'flat';
    }
    
    startVisualization() {
        const animate = () => {
            if (!this.isPlaying) return;
            
            this.drawFrequencySpectrum();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.drawFrequencyResponse();
    }
    
    drawFrequencyResponse() {
        if (!this.canvasCtx) return;
        
        const { width, height } = this.canvas;
        this.canvasCtx.clearRect(0, 0, width, height);
        
        // Draw grid
        this.canvasCtx.strokeStyle = '#444';
        this.canvasCtx.lineWidth = 1;
        
        // Horizontal lines (dB levels)
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            this.canvasCtx.beginPath();
            this.canvasCtx.moveTo(0, y);
            this.canvasCtx.lineTo(width, y);
            this.canvasCtx.stroke();
        }
        
        // Vertical lines (frequencies)
        for (let i = 0; i <= 10; i++) {
            const x = (width / 10) * i;
            this.canvasCtx.beginPath();
            this.canvasCtx.moveTo(x, 0);
            this.canvasCtx.lineTo(x, height);
            this.canvasCtx.stroke();
        }
        
        // Draw frequency response curve
        this.canvasCtx.strokeStyle = '#3498db';
        this.canvasCtx.lineWidth = 3;
        this.canvasCtx.beginPath();
        
        const sliders = document.querySelectorAll('.eq-slider');
        
        sliders.forEach((slider, index) => {
            const gain = parseFloat(slider.value);
            const x = (width / 10) * index + (width / 20);
            const y = height / 2 - (gain / 20) * (height / 2);
            
            if (index === 0) {
                this.canvasCtx.moveTo(x, y);
            } else {
                this.canvasCtx.lineTo(x, y);
            }
        });
        
        this.canvasCtx.stroke();
        
        // Draw frequency labels
        this.canvasCtx.fillStyle = '#ecf0f1';
        this.canvasCtx.font = '12px Arial';
        this.canvasCtx.textAlign = 'center';
        
        this.frequencies.forEach((freq, index) => {
            const x = (width / 10) * index + (width / 20);
            const label = freq >= 1000 ? (freq / 1000) + 'k' : freq + '';
            this.canvasCtx.fillText(label, x, height - 5);
        });
        
        // Draw dB labels
        this.canvasCtx.textAlign = 'left';
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i + 15;
            const db = 20 - (i * 10);
            this.canvasCtx.fillText(db + 'dB', 5, y);
        }
    }
    
    drawFrequencySpectrum() {
        if (!this.analyser || !this.canvasCtx) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        const { width, height } = this.canvas;
        this.canvasCtx.clearRect(0, 0, width, height);
        
        // Draw spectrum bars
        const barWidth = width / bufferLength * 2;
        let x = 0;
        
        this.canvasCtx.fillStyle = '#3498db';
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height;
            
            this.canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
        
        // Draw EQ curve overlay
        this.canvasCtx.strokeStyle = '#e74c3c';
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.beginPath();
        
        const sliders = document.querySelectorAll('.eq-slider');
        
        sliders.forEach((slider, index) => {
            const gain = parseFloat(slider.value);
            const x = (width / 10) * index + (width / 20);
            const y = height / 2 - (gain / 20) * (height / 2);
            
            if (index === 0) {
                this.canvasCtx.moveTo(x, y);
            } else {
                this.canvasCtx.lineTo(x, y);
            }
        });
        
        this.canvasCtx.stroke();
    }
    
    async processAudio() {
        if (!this.audioBuffer) return;
        
        const processBtn = document.getElementById('processBtn');
        processBtn.disabled = true;
        processBtn.textContent = '🎚️ Processing...';
        
        try {
            // Stop current playback
            this.stopAudio();
            
            // Create offline context for processing
            const offlineContext = new OfflineAudioContext(
                this.audioBuffer.numberOfChannels,
                this.audioBuffer.length,
                this.audioBuffer.sampleRate
            );
            
            // Create nodes in offline context
            const source = offlineContext.createBufferSource();
            source.buffer = this.audioBuffer;
            
            // Create EQ filters for offline processing
            const offlineFilters = [];
            this.frequencies.forEach((freq, index) => {
                const filter = offlineContext.createBiquadFilter();
                
                if (index === 0) {
                    filter.type = 'highpass';
                    filter.frequency.value = freq;
                } else if (index === this.frequencies.length - 1) {
                    filter.type = 'lowpass';
                    filter.frequency.value = freq;
                } else {
                    filter.type = 'peaking';
                    filter.frequency.value = freq;
                    filter.Q.value = 1;
                }
                
                // Copy gain values from live filters
                const sliders = document.querySelectorAll('.eq-slider');
                filter.gain.value = parseFloat(sliders[index].value);
                
                offlineFilters.push(filter);
            });
            
            // Connect filters in series
            source.connect(offlineFilters[0]);
            offlineFilters.forEach((filter, index) => {
                if (index < offlineFilters.length - 1) {
                    filter.connect(offlineFilters[index + 1]);
                } else {
                    filter.connect(offlineContext.destination);
                }
            });
            
            source.start();
            
            // Render the processed audio
            const renderedBuffer = await offlineContext.startRendering();
            
            // Convert to audio file
            const processedBlob = await this.bufferToWav(renderedBuffer);
            
            // Create download link
            this.processedAudioBlob = processedBlob;
            
            // Show processed audio player
            const processedAudio = document.getElementById('processedAudio');
            processedAudio.src = URL.createObjectURL(processedBlob);
            
            document.getElementById('processedPlayer').classList.remove('hidden');
            document.getElementById('downloadBtn').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error processing audio:', error);
            this.showError('Failed to process audio.');
        } finally {
            processBtn.disabled = false;
            processBtn.textContent = '🎚️ Apply Equalizer';
        }
    }
    
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
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
    
    downloadProcessedAudio() {
        if (!this.processedAudioBlob) return;
        
        const fileName = this.currentFile ? 
            this.currentFile.name.replace(/\.[^/.]+$/, '') + '_equalized.wav' :
            'equalized_audio.wav';
        
        const url = URL.createObjectURL(this.processedAudioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    updateFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const size = (file.size / (1024 * 1024)).toFixed(2);
        fileInfo.textContent = `${file.name} (${size} MB)`;
    }
    
    showUploadProgress(show) {
        const progress = document.getElementById('uploadProgress');
        if (show) {
            progress.classList.remove('hidden');
        } else {
            progress.classList.add('hidden');
        }
    }
    
    showEqualizerSection() {
        document.getElementById('equalizerSection').classList.remove('hidden');
    }
    
    showExportSection() {
        document.getElementById('exportSection').classList.remove('hidden');
    }
    
    updatePlaybackControls() {
        const playBtn = document.getElementById('playBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        playBtn.disabled = this.isPlaying;
        stopBtn.disabled = !this.isPlaying;
    }
    
    showError(message) {
        // You can implement a toast notification or alert here
        alert(message);
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AudioEqualizer();
});
