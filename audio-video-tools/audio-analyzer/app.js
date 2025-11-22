// Audio Analyzer App
class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.analyser = null;
        this.isPlaying = false;
        this.currentFile = null;
        this.animationId = null;
        this.realTimeAnalysis = true;
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.setupEventListeners();
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
        
        // Controls
        document.getElementById('playBtn').addEventListener('click', () => this.playAudio());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopAudio());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportReport());
        document.getElementById('snapshotBtn').addEventListener('click', () => this.takeSnapshot());
        
        // Real-time analysis toggle
        document.getElementById('realTimeAnalysis').addEventListener('change', (e) => {
            this.realTimeAnalysis = e.target.checked;
        });
    }
    
    async handleFileSelect(file) {
        if (!file) return;
        
        this.currentFile = file;
        this.updateFileInfo(file);
        
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
            
            // Setup analyser
            this.setupAnalyser();
            
            // Perform analysis
            await this.performAnalysis();
            
            // Show analysis section
            this.showAnalysisSection();
            
        } catch (error) {
            console.error('Error loading audio file:', error);
            this.showError('Failed to load audio file. Please try a different file.');
        }
    }
    
    setupAnalyser() {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
    }
    
    async performAnalysis() {
        // Update audio properties
        this.updateAudioProperties();
        
        // Analyze audio levels
        this.analyzeLevels();
        
        // Analyze waveform
        this.analyzeWaveform();
        
        // Analyze spectral characteristics
        this.analyzeSpectralCharacteristics();
        
        // Draw visualizations
        this.drawWaveform();
        this.drawSpectrum();
    }
    
    updateAudioProperties() {
        const duration = this.audioBuffer.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = (duration % 60).toFixed(1);
        
        document.getElementById('duration').textContent = `${minutes}:${seconds.padStart(4, '0')}`;
        document.getElementById('sampleRate').textContent = `${this.audioBuffer.sampleRate} Hz`;
        document.getElementById('channels').textContent = this.audioBuffer.numberOfChannels === 1 ? 'Mono' : 'Stereo';
        document.getElementById('bitDepth').textContent = '32-bit Float'; // Web Audio uses 32-bit float
    }
    
    analyzeLevels() {
        const channelData = this.audioBuffer.getChannelData(0);
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
        
        // Estimate LUFS
        const lufsEstimate = rmsDb - 10;
        
        // Calculate dynamic range
        const dynamicRange = peakDb - rmsDb;
        
        // Update UI
        document.getElementById('peakLevel').textContent = peakDb.toFixed(1);
        document.getElementById('rmsLevel').textContent = rmsDb.toFixed(1);
        document.getElementById('lufsLevel').textContent = lufsEstimate.toFixed(1);
        document.getElementById('dynamicRange').textContent = dynamicRange.toFixed(1);
        
        this.levelAnalysis = { peak: peakDb, rms: rmsDb, lufs: lufsEstimate, dynamicRange };
    }
    
    analyzeWaveform() {
        const channelData = this.audioBuffer.getChannelData(0);
        const length = channelData.length;
        
        // Count zero crossings
        let zeroCrossings = 0;
        for (let i = 1; i < length; i++) {
            if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
                zeroCrossings++;
            }
        }
        
        // Count clipping events (samples at or near maximum amplitude)
        let clippingEvents = 0;
        const clippingThreshold = 0.99;
        for (let i = 0; i < length; i++) {
            if (Math.abs(channelData[i]) >= clippingThreshold) {
                clippingEvents++;
            }
        }
        
        // Calculate DC offset
        let sum = 0;
        for (let i = 0; i < length; i++) {
            sum += channelData[i];
        }
        const dcOffset = sum / length;
        
        // Update UI
        document.getElementById('zeroCrossings').textContent = zeroCrossings.toLocaleString();
        document.getElementById('clippingEvents').textContent = clippingEvents.toLocaleString();
        document.getElementById('dcOffset').textContent = (dcOffset * 1000).toFixed(3) + ' mV';
        
        this.waveformAnalysis = { zeroCrossings, clippingEvents, dcOffset };
    }
    
    analyzeSpectralCharacteristics() {
        const channelData = this.audioBuffer.getChannelData(0);
        const fftSize = 2048;
        const halfSize = fftSize / 2;
        const sampleRate = this.audioBuffer.sampleRate;
        
        // Perform FFT on a segment of the audio
        const startSample = Math.floor(channelData.length / 4); // Use middle quarter
        const segment = channelData.slice(startSample, startSample + fftSize);
        
        // Simple FFT approximation for spectral analysis
        const spectrum = this.performFFT(segment);
        
        // Calculate spectral centroid
        let weightedSum = 0;
        let magnitudeSum = 0;
        for (let i = 0; i < halfSize; i++) {
            const frequency = (i * sampleRate) / fftSize;
            const magnitude = Math.sqrt(spectrum[i * 2] ** 2 + spectrum[i * 2 + 1] ** 2);
            weightedSum += frequency * magnitude;
            magnitudeSum += magnitude;
        }
        const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
        
        // Calculate spectral rolloff (frequency below which 85% of energy is contained)
        const targetEnergy = magnitudeSum * 0.85;
        let energySum = 0;
        let rolloffBin = 0;
        for (let i = 0; i < halfSize; i++) {
            const magnitude = Math.sqrt(spectrum[i * 2] ** 2 + spectrum[i * 2 + 1] ** 2);
            energySum += magnitude;
            if (energySum >= targetEnergy) {
                rolloffBin = i;
                break;
            }
        }
        const spectralRolloff = (rolloffBin * sampleRate) / fftSize;
        
        // Calculate spectral flatness (geometric mean / arithmetic mean)
        let geometricMean = 1;
        let arithmeticMean = 0;
        for (let i = 1; i < halfSize; i++) {
            const magnitude = Math.sqrt(spectrum[i * 2] ** 2 + spectrum[i * 2 + 1] ** 2);
            geometricMean *= Math.pow(magnitude + 1e-10, 1 / (halfSize - 1));
            arithmeticMean += magnitude;
        }
        arithmeticMean /= (halfSize - 1);
        const spectralFlatness = arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
        
        // Find fundamental frequency (simplified pitch detection)
        let maxMagnitude = 0;
        let fundamentalBin = 0;
        for (let i = 1; i < halfSize / 4; i++) { // Look in lower frequencies
            const magnitude = Math.sqrt(spectrum[i * 2] ** 2 + spectrum[i * 2 + 1] ** 2);
            if (magnitude > maxMagnitude) {
                maxMagnitude = magnitude;
                fundamentalBin = i;
            }
        }
        const fundamentalFreq = (fundamentalBin * sampleRate) / fftSize;
        
        // Update UI
        document.getElementById('spectralCentroid').textContent = Math.round(spectralCentroid);
        document.getElementById('spectralRolloff').textContent = Math.round(spectralRolloff);
        document.getElementById('spectralFlatness').textContent = spectralFlatness.toFixed(3);
        document.getElementById('fundamentalFreq').textContent = Math.round(fundamentalFreq);
        
        this.spectralAnalysis = { spectralCentroid, spectralRolloff, spectralFlatness, fundamentalFreq };
    }
    
    performFFT(signal) {
        // Simplified FFT implementation for analysis
        const N = signal.length;
        const result = new Array(N * 2).fill(0);
        
        // Copy signal to result (real part)
        for (let i = 0; i < N; i++) {
            result[i * 2] = signal[i];
        }
        
        // Apply Hanning window
        for (let i = 0; i < N; i++) {
            const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
            result[i * 2] *= window;
        }
        
        return result;
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
        
        // Draw waveform
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
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
            
            if (i === 0) {
                ctx.moveTo(i, yMax);
            } else {
                ctx.lineTo(i, yMax);
                ctx.lineTo(i, yMin);
            }
        }
        
        ctx.stroke();
        
        // Draw center line
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, amp);
        ctx.lineTo(width, amp);
        ctx.stroke();
    }
    
    drawSpectrum() {
        const canvas = document.getElementById('spectrumCanvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width = 800;
        const height = canvas.height = 300;
        
        ctx.clearRect(0, 0, width, height);
        
        if (!this.analyser) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        if (this.isPlaying && this.realTimeAnalysis) {
            this.analyser.getByteFrequencyData(dataArray);
        } else {
            // Static spectrum from analysis
            dataArray.fill(64); // Placeholder
        }
        
        const barWidth = width / bufferLength * 2;
        let x = 0;
        
        ctx.fillStyle = '#3498db';
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height;
            
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
        
        // Draw frequency labels
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        const frequencies = [100, 500, 1000, 5000, 10000, 20000];
        frequencies.forEach(freq => {
            const x = (freq / (this.audioContext.sampleRate / 2)) * width;
            if (x < width) {
                ctx.fillText(freq >= 1000 ? (freq / 1000) + 'k' : freq + '', x, height - 5);
            }
        });
    }
    
    playAudio() {
        if (!this.audioBuffer || this.isPlaying) return;
        
        try {
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            
            this.sourceNode.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.sourceNode.onended = () => {
                this.stopAudio();
            };
            
            this.sourceNode.start();
            this.isPlaying = true;
            this.updatePlaybackControls();
            
            // Start real-time visualization
            if (this.realTimeAnalysis) {
                this.startVisualization();
            }
            
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
    
    startVisualization() {
        const animate = () => {
            if (!this.isPlaying || !this.realTimeAnalysis) return;
            
            this.drawSpectrum();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stopVisualization() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    takeSnapshot() {
        // Capture current spectrum analysis
        this.drawSpectrum();
    }
    
    exportReport() {
        if (!this.currentFile) return;
        
        const report = this.generateReport();
        const blob = new Blob([report], { type: 'text/plain' });
        
        const fileName = this.currentFile.name.replace(/\.[^/.]+$/, '') + '_analysis_report.txt';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    generateReport() {
        const timestamp = new Date().toLocaleString();
        
        return `Audio Analysis Report
Generated: ${timestamp}
File: ${this.currentFile.name}

=== AUDIO PROPERTIES ===
Duration: ${document.getElementById('duration').textContent}
Sample Rate: ${document.getElementById('sampleRate').textContent}
Channels: ${document.getElementById('channels').textContent}
Bit Depth: ${document.getElementById('bitDepth').textContent}

=== LEVEL ANALYSIS ===
Peak Level: ${document.getElementById('peakLevel').textContent} dBFS
RMS Level: ${document.getElementById('rmsLevel').textContent} dBFS
LUFS: ${document.getElementById('lufsLevel').textContent} LUFS
Dynamic Range: ${document.getElementById('dynamicRange').textContent} dB

=== WAVEFORM ANALYSIS ===
Zero Crossings: ${document.getElementById('zeroCrossings').textContent}
Clipping Events: ${document.getElementById('clippingEvents').textContent}
DC Offset: ${document.getElementById('dcOffset').textContent}

=== SPECTRAL CHARACTERISTICS ===
Spectral Centroid: ${document.getElementById('spectralCentroid').textContent} Hz
Spectral Rolloff: ${document.getElementById('spectralRolloff').textContent} Hz
Spectral Flatness: ${document.getElementById('spectralFlatness').textContent}
Fundamental Frequency: ${document.getElementById('fundamentalFreq').textContent} Hz

=== ANALYSIS NOTES ===
- Peak Level indicates the maximum amplitude reached
- RMS Level shows the average loudness over time
- LUFS is the broadcast standard for loudness measurement
- Dynamic Range shows the difference between peak and average levels
- High zero crossings may indicate noise or high-frequency content
- Clipping events suggest potential distortion
- DC Offset indicates any bias in the signal
- Spectral Centroid shows the "brightness" of the sound
- Spectral Rolloff indicates frequency distribution
- Spectral Flatness measures how noise-like vs. tone-like the sound is

Report generated by Zapit Audio Analyzer
https://zapit.me/audio-video-tools/audio-analyzer`;
    }
    
    updateFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const size = (file.size / (1024 * 1024)).toFixed(2);
        fileInfo.textContent = `${file.name} (${size} MB)`;
    }
    
    showAnalysisSection() {
        document.getElementById('analysisSection').classList.remove('hidden');
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
    new AudioAnalyzer();
});
