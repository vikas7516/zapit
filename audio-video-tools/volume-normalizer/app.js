// Volume Normalizer App
class VolumeNormalizer {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.isPlaying = false;
        this.currentFile = null;
        this.processedAudioBlob = null;
        this.analyser = null;
        this.animationId = null;
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.setupEventListeners();
        this.updateTargetLevelRange();
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
        
        // Normalization settings
        document.querySelectorAll('input[name="normalizeType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateTargetLevelRange();
                this.updateGainCalculation();
            });
        });
        
        // Sliders
        const targetLevelSlider = document.getElementById('targetLevel');
        const limiterThresholdSlider = document.getElementById('limiterThreshold');
        
        targetLevelSlider.addEventListener('input', (e) => {
            document.getElementById('targetLevelValue').textContent = e.target.value + ' dB';
            this.updateGainCalculation();
        });
        
        limiterThresholdSlider.addEventListener('input', (e) => {
            document.getElementById('limiterThresholdValue').textContent = e.target.value + ' dB';
        });
        
        // Processing
        document.getElementById('processBtn').addEventListener('click', () => this.processAudio());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadProcessedAudio());
    }
    
    updateTargetLevelRange() {
        const normalizeType = document.querySelector('input[name="normalizeType"]:checked').value;
        const targetLevelSlider = document.getElementById('targetLevel');
        
        switch (normalizeType) {
            case 'peak':
                targetLevelSlider.min = -30;
                targetLevelSlider.max = 0;
                targetLevelSlider.value = -3;
                break;
            case 'rms':
                targetLevelSlider.min = -30;
                targetLevelSlider.max = -6;
                targetLevelSlider.value = -12;
                break;
            case 'lufs':
                targetLevelSlider.min = -30;
                targetLevelSlider.max = -14;
                targetLevelSlider.value = -23;
                break;
        }
        
        document.getElementById('targetLevelValue').textContent = targetLevelSlider.value + ' dB';
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
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Read and decode audio file
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // Analyze audio
            await this.analyzeAudio();
            
            // Show interface sections
            this.showAnalysisSection();
            this.showNormalizeSection();
            this.showExportSection();
            
            this.showUploadProgress(false);
            
        } catch (error) {
            console.error('Error loading audio file:', error);
            this.showError('Failed to load audio file. Please try a different file.');
            this.showUploadProgress(false);
        }
    }
    
    async analyzeAudio() {
        const channelData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        const length = channelData.length;
        
        // Calculate peak level
        let peak = 0;
        for (let i = 0; i < length; i++) {
            const abs = Math.abs(channelData[i]);
            if (abs > peak) peak = abs;
        }
        const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
        
        // Calculate RMS level
        let sumSquares = 0;
        for (let i = 0; i < length; i++) {
            sumSquares += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sumSquares / length);
        const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
        
        // Estimate LUFS (simplified calculation)
        const lufsEstimate = rmsDb - 10; // Rough approximation
        
        // Calculate dynamic range
        const dynamicRange = peakDb - rmsDb;
        
        // Update UI
        document.getElementById('peakLevel').textContent = peakDb.toFixed(1);
        document.getElementById('rmsLevel').textContent = rmsDb.toFixed(1);
        document.getElementById('lufsLevel').textContent = lufsEstimate.toFixed(1);
        document.getElementById('dynamicRange').textContent = dynamicRange.toFixed(1);
        
        // Store analysis data
        this.audioAnalysis = {
            peak: peakDb,
            rms: rmsDb,
            lufs: lufsEstimate,
            dynamicRange: dynamicRange
        };
        
        // Draw waveform
        this.drawWaveform();
        
        // Update gain calculation
        this.updateGainCalculation();
    }
    
    drawWaveform() {
        const canvas = document.getElementById('waveformCanvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width = 800;
        const height = canvas.height = 200;
        
        ctx.clearRect(0, 0, width, height);
        
        const channelData = this.audioBuffer.getChannelData(0);
        const step = Math.ceil(channelData.length / width);
        const amp = height / 2;
        
        ctx.fillStyle = '#3498db';
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(0, amp);
        
        for (let i = 0; i < width; i++) {
            let min = 1;
            let max = -1;
            
            for (let j = 0; j < step; j++) {
                const datum = channelData[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            
            const yMin = (1 + min) * amp;
            const yMax = (1 + max) * amp;
            
            ctx.fillRect(i, yMin, 1, yMax - yMin);
        }
    }
    
    updateGainCalculation() {
        if (!this.audioAnalysis) return;
        
        const normalizeType = document.querySelector('input[name="normalizeType"]:checked').value;
        const targetLevel = parseFloat(document.getElementById('targetLevel').value);
        
        let currentLevel;
        switch (normalizeType) {
            case 'peak':
                currentLevel = this.audioAnalysis.peak;
                break;
            case 'rms':
                currentLevel = this.audioAnalysis.rms;
                break;
            case 'lufs':
                currentLevel = this.audioAnalysis.lufs;
                break;
        }
        
        const gainAdjustment = targetLevel - currentLevel;
        const gainDisplay = document.getElementById('gainAdjustment');
        
        if (gainAdjustment >= 0) {
            gainDisplay.textContent = `+${gainAdjustment.toFixed(1)} dB`;
            gainDisplay.style.color = '#27ae60';
        } else {
            gainDisplay.textContent = `${gainAdjustment.toFixed(1)} dB`;
            gainDisplay.style.color = '#e74c3c';
        }
        
        this.calculatedGain = gainAdjustment;
    }
    
    playAudio() {
        if (!this.audioBuffer || this.isPlaying) return;
        
        try {
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            
            // Create gain node for preview
            const gainNode = this.audioContext.createGain();
            this.sourceNode.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            this.sourceNode.onended = () => {
                this.stopAudio();
            };
            
            this.sourceNode.start();
            this.isPlaying = true;
            this.updatePlaybackControls();
            
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
    }
    
    async processAudio() {
        if (!this.audioBuffer) return;
        
        const processBtn = document.getElementById('processBtn');
        processBtn.disabled = true;
        processBtn.textContent = '🔊 Normalizing...';
        
        try {
            this.stopAudio();
            
            // Get settings
            const targetLevel = parseFloat(document.getElementById('targetLevel').value);
            const limiterThreshold = parseFloat(document.getElementById('limiterThreshold').value);
            const preserveDynamics = document.getElementById('preserveDynamics').checked;
            const fadeInOut = document.getElementById('fadeInOut').checked;
            const exportFormat = document.getElementById('exportFormat').value;
            const sampleRate = parseInt(document.getElementById('exportQuality').value);
            
            // Create offline context for processing
            const offlineContext = new OfflineAudioContext(
                this.audioBuffer.numberOfChannels,
                Math.floor(this.audioBuffer.length * (sampleRate / this.audioBuffer.sampleRate)),
                sampleRate
            );
            
            // Create source
            const source = offlineContext.createBufferSource();
            source.buffer = this.audioBuffer;
            
            // Create gain node for normalization
            const gainNode = offlineContext.createGain();
            const gainValue = Math.pow(10, this.calculatedGain / 20);
            gainNode.gain.value = gainValue;
            
            // Create limiter (compressor)
            const compressor = offlineContext.createDynamicsCompressor();
            compressor.threshold.value = limiterThreshold;
            compressor.knee.value = 0;
            compressor.ratio.value = 20;
            compressor.attack.value = 0.001;
            compressor.release.value = 0.01;
            
            // Connect nodes
            source.connect(gainNode);
            gainNode.connect(compressor);
            compressor.connect(offlineContext.destination);
            
            // Add fade in/out if requested
            if (fadeInOut) {
                const fadeDuration = Math.min(0.1, this.audioBuffer.duration * 0.05); // 5% of duration or 0.1s max
                gainNode.gain.setValueAtTime(0, 0);
                gainNode.gain.linearRampToValueAtTime(gainValue, fadeDuration);
                gainNode.gain.setValueAtTime(gainValue, this.audioBuffer.duration - fadeDuration);
                gainNode.gain.linearRampToValueAtTime(0, this.audioBuffer.duration);
            }
            
            source.start();
            
            // Render the processed audio
            const renderedBuffer = await offlineContext.startRendering();
            
            // Convert to audio file
            const processedBlob = await this.bufferToWav(renderedBuffer);
            this.processedAudioBlob = processedBlob;
            
            // Analyze processed audio
            const processedStats = await this.analyzeProcessedAudio(renderedBuffer);
            
            // Update UI
            const processedAudio = document.getElementById('processedAudio');
            processedAudio.src = URL.createObjectURL(processedBlob);
            
            document.getElementById('newPeak').textContent = processedStats.peak.toFixed(1) + ' dB';
            document.getElementById('newRms').textContent = processedStats.rms.toFixed(1) + ' dB';
            document.getElementById('appliedGain').textContent = this.calculatedGain.toFixed(1) + ' dB';
            
            document.getElementById('processedPlayer').classList.remove('hidden');
            document.getElementById('downloadBtn').classList.remove('hidden');
            
        } catch (error) {
            console.error('Error processing audio:', error);
            this.showError('Failed to process audio.');
        } finally {
            processBtn.disabled = false;
            processBtn.textContent = '🔊 Normalize Audio';
        }
    }
    
    async analyzeProcessedAudio(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const length = channelData.length;
        
        // Calculate peak
        let peak = 0;
        for (let i = 0; i < length; i++) {
            const abs = Math.abs(channelData[i]);
            if (abs > peak) peak = abs;
        }
        const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;
        
        // Calculate RMS
        let sumSquares = 0;
        for (let i = 0; i < length; i++) {
            sumSquares += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sumSquares / length);
        const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
        
        return { peak: peakDb, rms: rmsDb };
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
        
        // Convert samples
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
            this.currentFile.name.replace(/\.[^/.]+$/, '') + '_normalized.wav' :
            'normalized_audio.wav';
        
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
    
    showAnalysisSection() {
        document.getElementById('analysisSection').classList.remove('hidden');
    }
    
    showNormalizeSection() {
        document.getElementById('normalizeSection').classList.remove('hidden');
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
        alert(message);
    }
}

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', () => {
    new VolumeNormalizer();
});
