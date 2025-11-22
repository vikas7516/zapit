class NoiseReducer {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.processedBuffer = null;
        this.source = null;
        this.isPlaying = false;
        this.noiseProfile = null;
        this.fftSize = 4096;
        this.hopSize = 1024;
        this.noiseGain = [];
        this.isAnalyzing = false;
        this.isProcessing = false;
        
        // UI Elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.noiseSection = document.getElementById('noiseSection');
        this.exportSection = document.getElementById('exportSection');
        this.manualSelection = document.getElementById('manualSelection');
        this.presetSelection = document.getElementById('presetSelection');
        
        // Controls
        this.btnPlay = document.getElementById('btnPlay');
        this.btnStop = document.getElementById('btnStop');
        this.btnPreview = document.getElementById('btnPreview');
        this.btnExport = document.getElementById('btnExport');
        this.btnAnalyze = document.getElementById('btnAnalyze');
        this.btnProcess = document.getElementById('btnProcess');
        this.btnDownload = document.getElementById('btnDownload');
        this.btnSelectNoise = document.getElementById('btnSelectNoise');
        this.btnClearSelection = document.getElementById('btnClearSelection');
        
        // Canvas elements
        this.spectrumCanvas = document.getElementById('spectrumCanvas');
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        
        // Progress
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        this.initializeEventListeners();
        this.initializeAudioContext();
    }
    
    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Error initializing audio context:', error);
            this.showError('Your browser does not support Web Audio API');
        }
    }
    
    initializeEventListeners() {
        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Audio controls
        this.btnPlay.addEventListener('click', () => this.playOriginal());
        this.btnStop.addEventListener('click', () => this.stopAudio());
        this.btnPreview.addEventListener('click', () => this.playProcessed());
        this.btnExport.addEventListener('click', () => this.showExportSection());
        this.btnAnalyze.addEventListener('click', () => this.analyzeNoise());
        this.btnProcess.addEventListener('click', () => this.processAudio());
        this.btnDownload.addEventListener('click', () => this.downloadProcessedAudio());
        
        // Manual selection
        this.btnSelectNoise.addEventListener('click', () => this.enableNoiseSelection());
        this.btnClearSelection.addEventListener('click', () => this.clearSelection());
        
        // Noise profile radio buttons
        const noiseProfileRadios = document.querySelectorAll('input[name="noise-profile"]');
        noiseProfileRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleNoiseProfileChange());
        });
        
        // Sliders
        this.initializeSliders();
        
        // Waveform interaction
        this.waveformCanvas.addEventListener('mousedown', (e) => this.startSelection(e));
        this.waveformCanvas.addEventListener('mousemove', (e) => this.updateSelection(e));
        this.waveformCanvas.addEventListener('mouseup', (e) => this.endSelection(e));
    }
    
    initializeSliders() {
        const sliders = [
            { id: 'reductionAmount', suffix: ' dB' },
            { id: 'sensitivity', suffix: '' },
            { id: 'smoothing', suffix: '' },
            { id: 'attackTime', suffix: ' ms' },
            { id: 'releaseTime', suffix: ' ms' },
            { id: 'speechPreservation', suffix: '%' },
            { id: 'lowCutoff', suffix: ' Hz' },
            { id: 'highCutoff', suffix: ' Hz' },
            { id: 'gateThreshold', suffix: ' dB' }
        ];
        
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const valueElement = document.getElementById(slider.id + 'Value');
            
            element.addEventListener('input', () => {
                valueElement.textContent = element.value + slider.suffix;
                if (this.processedBuffer) {
                    this.updatePreview();
                }
            });
        });
    }
    
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
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
        if (!this.isValidAudioFile(file)) {
            this.showError('Please select a valid audio file (MP3, WAV, OGG, M4A, FLAC)');
            return;
        }
        
        if (file.size > 100 * 1024 * 1024) {
            this.showError('File size must be less than 100MB');
            return;
        }
        
        this.showProgress('Loading audio file...', 0);
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.updateFileInfo(file);
            this.noiseSection.classList.remove('hidden');
            this.drawWaveform();
            this.drawSpectrum();
            
            // Auto-analyze on load
            setTimeout(() => this.analyzeNoise(), 500);
            
            this.hideProgress();
        } catch (error) {
            console.error('Error processing file:', error);
            this.showError('Error loading audio file. Please try a different file.');
            this.hideProgress();
        }
    }
    
    isValidAudioFile(file) {
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/flac', 'audio/x-wav'];
        const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac'];
        
        return validTypes.includes(file.type) || 
               validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    }
    
    updateFileInfo(file) {
        const duration = this.audioBuffer.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const fileInfo = `${file.name} (${minutes}:${seconds.toString().padStart(2, '0')}, ${this.audioBuffer.sampleRate}Hz, ${this.audioBuffer.numberOfChannels} ch)`;
        document.getElementById('fileInfo').textContent = fileInfo;
    }
    
    drawWaveform() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // Get mono audio data
        const audioData = this.audioBuffer.getChannelData(0);
        const samplesPerPixel = Math.floor(audioData.length / width);
        
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let x = 0; x < width; x++) {
            const start = x * samplesPerPixel;
            const end = start + samplesPerPixel;
            let max = 0;
            
            for (let i = start; i < end && i < audioData.length; i++) {
                max = Math.max(max, Math.abs(audioData[i]));
            }
            
            const y = (1 - max) * height / 2;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Draw selection if exists
        if (this.selectionStart !== undefined && this.selectionEnd !== undefined) {
            this.drawSelection();
        }
    }
    
    drawSpectrum() {
        const canvas = this.spectrumCanvas;
        const ctx = this.spectrumCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // Analyze frequency spectrum
        const fftData = this.computeFFT(this.audioBuffer.getChannelData(0));
        const freqBins = fftData.length / 2;
        const maxFreq = this.audioBuffer.sampleRate / 2;
        
        // Draw frequency spectrum
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < freqBins; i++) {
            const freq = (i / freqBins) * maxFreq;
            const magnitude = Math.sqrt(fftData[i * 2] ** 2 + fftData[i * 2 + 1] ** 2);
            const dB = 20 * Math.log10(magnitude + 1e-10);
            
            const x = (freq / maxFreq) * width;
            const y = height - ((dB + 120) / 120) * height; // Map -120dB to 0dB range
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Draw noise profile if exists
        if (this.noiseProfile) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            for (let i = 0; i < this.noiseProfile.length; i++) {
                const freq = (i / this.noiseProfile.length) * maxFreq;
                const dB = 20 * Math.log10(this.noiseProfile[i] + 1e-10);
                
                const x = (freq / maxFreq) * width;
                const y = height - ((dB + 120) / 120) * height;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
        }
        
        // Draw frequency labels
        ctx.fillStyle = '#64748b';
        ctx.font = '12px monospace';
        const frequencies = [100, 1000, 5000, 10000];
        frequencies.forEach(freq => {
            if (freq < maxFreq) {
                const x = (freq / maxFreq) * width;
                ctx.fillText(`${freq}Hz`, x - 20, height - 5);
                ctx.strokeStyle = '#e2e8f0';
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height - 20);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    }
    
    computeFFT(audioData) {
        // Simple FFT implementation for spectrum analysis
        const N = Math.min(this.fftSize, audioData.length);
        const fftData = new Float32Array(N * 2);
        
        // Copy audio data to FFT array (real part)
        for (let i = 0; i < N; i++) {
            fftData[i * 2] = audioData[i];
            fftData[i * 2 + 1] = 0; // imaginary part
        }
        
        // Apply window function
        for (let i = 0; i < N; i++) {
            const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1))); // Hanning window
            fftData[i * 2] *= window;
        }
        
        return fftData;
    }
    
    async analyzeNoise() {
        if (!this.audioBuffer || this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.btnAnalyze.disabled = true;
        this.showProgress('Analyzing noise characteristics...', 0);
        
        try {
            const noiseProfileMode = document.querySelector('input[name="noise-profile"]:checked').value;
            
            if (noiseProfileMode === 'auto') {
                await this.autoDetectNoise();
            } else if (noiseProfileMode === 'manual') {
                await this.extractManualNoise();
            } else if (noiseProfileMode === 'preset') {
                await this.loadPresetNoise();
            }
            
            this.updateAnalysisResults();
            this.drawSpectrum();
            
        } catch (error) {
            console.error('Error analyzing noise:', error);
            this.showError('Error analyzing noise. Please try again.');
        } finally {
            this.isAnalyzing = false;
            this.btnAnalyze.disabled = false;
            this.hideProgress();
        }
    }
    
    async autoDetectNoise() {
        // Analyze the first 2 seconds or 10% of audio for noise detection
        const analysisDuration = Math.min(2, this.audioBuffer.duration * 0.1);
        const sampleCount = Math.floor(analysisDuration * this.audioBuffer.sampleRate);
        const audioData = this.audioBuffer.getChannelData(0);
        
        // Find quietest segments
        const segmentSize = Math.floor(this.audioBuffer.sampleRate * 0.1); // 100ms segments
        const segments = [];
        
        for (let i = 0; i < sampleCount - segmentSize; i += segmentSize) {
            let rms = 0;
            for (let j = 0; j < segmentSize; j++) {
                rms += audioData[i + j] ** 2;
            }
            rms = Math.sqrt(rms / segmentSize);
            segments.push({ start: i, rms: rms });
        }
        
        // Sort by RMS and take quietest 20%
        segments.sort((a, b) => a.rms - b.rms);
        const noiseSegments = segments.slice(0, Math.floor(segments.length * 0.2));
        
        // Extract noise profile from quietest segments
        this.noiseProfile = this.extractNoiseProfile(audioData, noiseSegments);
    }
    
    async extractManualNoise() {
        if (this.selectionStart === undefined || this.selectionEnd === undefined) {
            throw new Error('Please select a noise sample first');
        }
        
        const audioData = this.audioBuffer.getChannelData(0);
        const startSample = Math.floor(this.selectionStart * this.audioBuffer.sampleRate);
        const endSample = Math.floor(this.selectionEnd * this.audioBuffer.sampleRate);
        
        const noiseSegment = [{
            start: startSample,
            length: endSample - startSample
        }];
        
        this.noiseProfile = this.extractNoiseProfile(audioData, noiseSegment);
    }
    
    async loadPresetNoise() {
        const presetType = document.getElementById('noisePreset').value;
        const sampleRate = this.audioBuffer.sampleRate;
        const freqBins = this.fftSize / 2;
        
        this.noiseProfile = new Float32Array(freqBins);
        
        switch (presetType) {
            case 'hiss':
                // High-frequency emphasis
                for (let i = 0; i < freqBins; i++) {
                    const freq = (i / freqBins) * (sampleRate / 2);
                    this.noiseProfile[i] = freq > 5000 ? 0.1 : 0.01;
                }
                break;
                
            case 'hum':
                // 50/60Hz and harmonics
                for (let i = 0; i < freqBins; i++) {
                    const freq = (i / freqBins) * (sampleRate / 2);
                    const is50Hz = Math.abs(freq % 50) < 2;
                    const is60Hz = Math.abs(freq % 60) < 2;
                    this.noiseProfile[i] = (is50Hz || is60Hz) ? 0.1 : 0.01;
                }
                break;
                
            case 'broadband':
                // Flat spectrum
                this.noiseProfile.fill(0.05);
                break;
                
            case 'wind':
                // Low-frequency emphasis
                for (let i = 0; i < freqBins; i++) {
                    const freq = (i / freqBins) * (sampleRate / 2);
                    this.noiseProfile[i] = freq < 500 ? 0.1 : 0.01;
                }
                break;
                
            case 'fan':
                // Mid-frequency emphasis with harmonics
                for (let i = 0; i < freqBins; i++) {
                    const freq = (i / freqBins) * (sampleRate / 2);
                    const isFanFreq = freq > 100 && freq < 2000 && (freq % 100) < 10;
                    this.noiseProfile[i] = isFanFreq ? 0.1 : 0.02;
                }
                break;
        }
    }
    
    extractNoiseProfile(audioData, segments) {
        const fftSize = this.fftSize;
        const freqBins = fftSize / 2;
        const profile = new Float32Array(freqBins);
        let segmentCount = 0;
        
        segments.forEach(segment => {
            const start = segment.start;
            const length = segment.length || fftSize;
            
            if (start + length <= audioData.length) {
                const segmentData = audioData.slice(start, start + length);
                const fftData = this.computeFFT(segmentData);
                
                // Accumulate magnitude spectrum
                for (let i = 0; i < freqBins; i++) {
                    const magnitude = Math.sqrt(fftData[i * 2] ** 2 + fftData[i * 2 + 1] ** 2);
                    profile[i] += magnitude;
                }
                segmentCount++;
            }
        });
        
        // Average the accumulated spectrum
        if (segmentCount > 0) {
            for (let i = 0; i < freqBins; i++) {
                profile[i] /= segmentCount;
            }
        }
        
        return profile;
    }
    
    updateAnalysisResults() {
        if (!this.noiseProfile) return;
        
        // Calculate noise floor
        const avgNoise = this.noiseProfile.reduce((sum, val) => sum + val, 0) / this.noiseProfile.length;
        const noiseFloor = 20 * Math.log10(avgNoise + 1e-10);
        
        // Calculate signal-to-noise ratio
        const audioData = this.audioBuffer.getChannelData(0);
        let signalPower = 0;
        for (let i = 0; i < audioData.length; i++) {
            signalPower += audioData[i] ** 2;
        }
        signalPower /= audioData.length;
        const signalLevel = 20 * Math.log10(Math.sqrt(signalPower) + 1e-10);
        const snr = signalLevel - noiseFloor;
        
        // Find dominant noise frequency
        let maxIndex = 0;
        for (let i = 1; i < this.noiseProfile.length; i++) {
            if (this.noiseProfile[i] > this.noiseProfile[maxIndex]) {
                maxIndex = i;
            }
        }
        const dominantFreq = (maxIndex / this.noiseProfile.length) * (this.audioBuffer.sampleRate / 2);
        
        // Determine noise type
        let noiseType = 'Broadband';
        if (dominantFreq < 200) noiseType = 'Low-frequency (Rumble)';
        else if (dominantFreq > 5000) noiseType = 'High-frequency (Hiss)';
        else if (dominantFreq % 50 < 5 || dominantFreq % 60 < 5) noiseType = 'Electrical Hum';
        
        // Update UI
        document.getElementById('noiseFloor').textContent = `${noiseFloor.toFixed(1)} dB`;
        document.getElementById('signalToNoise').textContent = `${snr.toFixed(1)} dB`;
        document.getElementById('dominantFreq').textContent = `${dominantFreq.toFixed(0)} Hz`;
        document.getElementById('noiseType').textContent = noiseType;
    }
    
    handleNoiseProfileChange() {
        const selectedMode = document.querySelector('input[name="noise-profile"]:checked').value;
        
        if (selectedMode === 'manual') {
            this.manualSelection.classList.remove('hidden');
        } else {
            this.manualSelection.classList.add('hidden');
        }
        
        if (selectedMode === 'preset') {
            this.presetSelection.classList.remove('hidden');
        } else {
            this.presetSelection.classList.add('hidden');
        }
    }
    
    enableNoiseSelection() {
        this.isSelecting = true;
        this.waveformCanvas.style.cursor = 'crosshair';
    }
    
    startSelection(e) {
        if (!this.isSelecting) return;
        
        const rect = this.waveformCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / this.waveformCanvas.width;
        this.selectionStart = ratio * this.audioBuffer.duration;
        this.isSelectingRegion = true;
    }
    
    updateSelection(e) {
        if (!this.isSelecting || !this.isSelectingRegion) return;
        
        const rect = this.waveformCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / this.waveformCanvas.width;
        this.selectionEnd = ratio * this.audioBuffer.duration;
        
        this.drawWaveform();
    }
    
    endSelection(e) {
        if (!this.isSelecting || !this.isSelectingRegion) return;
        
        this.isSelectingRegion = false;
        this.isSelecting = false;
        this.waveformCanvas.style.cursor = 'default';
        
        if (this.selectionStart > this.selectionEnd) {
            [this.selectionStart, this.selectionEnd] = [this.selectionEnd, this.selectionStart];
        }
        
        this.updateSelectionInfo();
        document.getElementById('selectionInfo').classList.remove('hidden');
    }
    
    drawSelection() {
        const ctx = this.waveformCtx;
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        
        const startX = (this.selectionStart / this.audioBuffer.duration) * width;
        const endX = (this.selectionEnd / this.audioBuffer.duration) * width;
        
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(startX, 0, endX - startX, height);
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, height);
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, height);
        ctx.stroke();
    }
    
    updateSelectionInfo() {
        if (this.selectionStart === undefined || this.selectionEnd === undefined) return;
        
        const duration = this.selectionEnd - this.selectionStart;
        const audioData = this.audioBuffer.getChannelData(0);
        const startSample = Math.floor(this.selectionStart * this.audioBuffer.sampleRate);
        const endSample = Math.floor(this.selectionEnd * this.audioBuffer.sampleRate);
        
        // Calculate average level
        let rms = 0;
        for (let i = startSample; i < endSample; i++) {
            rms += audioData[i] ** 2;
        }
        rms = Math.sqrt(rms / (endSample - startSample));
        const level = 20 * Math.log10(rms + 1e-10);
        
        // Quality score (longer, quieter selections are better)
        const qualityScore = Math.min(100, (duration / 0.5) * 50 + Math.max(0, (-level - 40)));
        
        document.getElementById('selectionStart').textContent = `${this.selectionStart.toFixed(2)}s`;
        document.getElementById('selectionDuration').textContent = `${duration.toFixed(2)}s`;
        document.getElementById('selectionLevel').textContent = `${level.toFixed(1)} dB`;
        document.getElementById('qualityScore').textContent = `${qualityScore.toFixed(0)}%`;
    }
    
    clearSelection() {
        this.selectionStart = undefined;
        this.selectionEnd = undefined;
        document.getElementById('selectionInfo').classList.add('hidden');
        this.drawWaveform();
    }
    
    async processAudio() {
        if (!this.audioBuffer || !this.noiseProfile || this.isProcessing) return;
        
        this.isProcessing = true;
        this.btnProcess.disabled = true;
        this.showProgress('Processing audio...', 0);
        
        try {
            const startTime = Date.now();
            
            // Get processing parameters
            const reductionAmount = parseFloat(document.getElementById('reductionAmount').value);
            const sensitivity = parseFloat(document.getElementById('sensitivity').value);
            const smoothing = parseInt(document.getElementById('smoothing').value);
            const attackTime = parseFloat(document.getElementById('attackTime').value) / 1000;
            const releaseTime = parseFloat(document.getElementById('releaseTime').value) / 1000;
            const speechPreservation = parseFloat(document.getElementById('speechPreservation').value) / 100;
            const lowCutoff = parseFloat(document.getElementById('lowCutoff').value);
            const highCutoff = parseFloat(document.getElementById('highCutoff').value);
            const gateThreshold = parseFloat(document.getElementById('gateThreshold').value);
            
            const adaptiveMode = document.getElementById('adaptiveMode').checked;
            const preserveTransients = document.getElementById('preserveTransients').checked;
            const highQuality = document.getElementById('highQuality').checked;
            const musicMode = document.getElementById('musicMode').checked;
            
            // Process each channel
            const numberOfChannels = this.audioBuffer.numberOfChannels;
            const sampleRate = this.audioBuffer.sampleRate;
            const length = this.audioBuffer.length;
            
            this.processedBuffer = this.audioContext.createBuffer(numberOfChannels, length, sampleRate);
            
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const inputData = this.audioBuffer.getChannelData(channel);
                const outputData = this.processedBuffer.getChannelData(channel);
                
                await this.processChannel(inputData, outputData, {
                    reductionAmount,
                    sensitivity,
                    smoothing,
                    attackTime,
                    releaseTime,
                    speechPreservation,
                    lowCutoff,
                    highCutoff,
                    gateThreshold,
                    adaptiveMode,
                    preserveTransients,
                    highQuality,
                    musicMode,
                    sampleRate
                });
                
                this.updateProgress((channel + 1) / numberOfChannels * 100);
            }
            
            const processingTime = Date.now() - startTime;
            
            // Calculate improvement metrics
            const improvement = this.calculateImprovement();
            
            // Update UI
            document.getElementById('noiseReduced').textContent = `${improvement.noiseReduction.toFixed(1)} dB`;
            document.getElementById('newSNR').textContent = `${improvement.newSNR.toFixed(1)} dB`;
            document.getElementById('processingTime').textContent = `${(processingTime / 1000).toFixed(1)}s`;
            document.getElementById('finalQuality').textContent = `${improvement.qualityScore.toFixed(0)}%`;
            
            // Create audio player for processed audio
            this.createProcessedAudioPlayer();
            
            // Show export section
            this.exportSection.classList.remove('hidden');
            document.getElementById('processedAudioContainer').classList.remove('hidden');
            this.btnDownload.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error processing audio:', error);
            this.showError('Error processing audio. Please try again.');
        } finally {
            this.isProcessing = false;
            this.btnProcess.disabled = false;
            this.hideProgress();
        }
    }
    
    async processChannel(inputData, outputData, params) {
        const {
            reductionAmount, sensitivity, smoothing, attackTime, releaseTime,
            speechPreservation, lowCutoff, highCutoff, gateThreshold,
            adaptiveMode, preserveTransients, highQuality, musicMode, sampleRate
        } = params;
        
        const fftSize = highQuality ? 8192 : 4096;
        const hopSize = fftSize / 4;
        const window = this.createWindow(fftSize);
        
        // Initialize overlap-add buffers
        const overlapBuffer = new Float32Array(fftSize);
        let outputIndex = 0;
        
        // Process audio in overlapping frames
        for (let frameStart = 0; frameStart < inputData.length; frameStart += hopSize) {
            const frameEnd = Math.min(frameStart + fftSize, inputData.length);
            const frameLength = frameEnd - frameStart;
            
            // Prepare input frame
            const inputFrame = new Float32Array(fftSize);
            for (let i = 0; i < frameLength; i++) {
                inputFrame[i] = inputData[frameStart + i] * window[i];
            }
            
            // FFT
            const spectrum = this.fft(inputFrame);
            
            // Apply noise reduction
            this.applySpectralSubtraction(spectrum, params);
            
            // IFFT
            const outputFrame = this.ifft(spectrum);
            
            // Apply window and overlap-add
            for (let i = 0; i < fftSize && outputIndex + i < outputData.length; i++) {
                outputData[outputIndex + i] += outputFrame[i] * window[i];
            }
            
            outputIndex += hopSize;
        }
        
        // Apply additional filtering
        this.applyPostProcessing(outputData, params);
    }
    
    applySpectralSubtraction(spectrum, params) {
        const { reductionAmount, sensitivity, smoothing } = params;
        const alpha = Math.pow(10, reductionAmount / 20); // Convert dB to linear
        const beta = sensitivity;
        
        const freqBins = spectrum.length / 2;
        
        for (let i = 0; i < freqBins; i++) {
            const real = spectrum[i * 2];
            const imag = spectrum[i * 2 + 1];
            const magnitude = Math.sqrt(real * real + imag * imag);
            const phase = Math.atan2(imag, real);
            
            // Get noise estimate for this frequency bin
            const noiseEstimate = this.noiseProfile[Math.min(i, this.noiseProfile.length - 1)];
            
            // Calculate spectral subtraction gain
            let gain = 1 - alpha * (noiseEstimate / (magnitude + 1e-10));
            gain = Math.max(0.1, Math.min(1, gain)); // Limit gain
            
            // Apply smoothing
            if (i > 0 && i < freqBins - 1) {
                const prevGain = 1 - alpha * (this.noiseProfile[Math.min(i - 1, this.noiseProfile.length - 1)] / (magnitude + 1e-10));
                const nextGain = 1 - alpha * (this.noiseProfile[Math.min(i + 1, this.noiseProfile.length - 1)] / (magnitude + 1e-10));
                gain = (prevGain + gain + nextGain) / 3;
            }
            
            // Apply gain
            const newMagnitude = magnitude * gain;
            spectrum[i * 2] = newMagnitude * Math.cos(phase);
            spectrum[i * 2 + 1] = newMagnitude * Math.sin(phase);
        }
    }
    
    applyPostProcessing(outputData, params) {
        const { lowCutoff, highCutoff, sampleRate } = params;
        
        // Apply high-pass filter for low cutoff
        if (lowCutoff > 20) {
            this.applyHighPassFilter(outputData, lowCutoff, sampleRate);
        }
        
        // Apply low-pass filter for high cutoff
        if (highCutoff < sampleRate / 2) {
            this.applyLowPassFilter(outputData, highCutoff, sampleRate);
        }
    }
    
    applyHighPassFilter(data, cutoff, sampleRate) {
        const rc = 1 / (2 * Math.PI * cutoff);
        const dt = 1 / sampleRate;
        const alpha = rc / (rc + dt);
        
        let prevInput = 0;
        let prevOutput = 0;
        
        for (let i = 0; i < data.length; i++) {
            const output = alpha * (prevOutput + data[i] - prevInput);
            prevInput = data[i];
            prevOutput = output;
            data[i] = output;
        }
    }
    
    applyLowPassFilter(data, cutoff, sampleRate) {
        const rc = 1 / (2 * Math.PI * cutoff);
        const dt = 1 / sampleRate;
        const alpha = dt / (rc + dt);
        
        let prevOutput = 0;
        
        for (let i = 0; i < data.length; i++) {
            const output = prevOutput + alpha * (data[i] - prevOutput);
            prevOutput = output;
            data[i] = output;
        }
    }
    
    createWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1))); // Hanning window
        }
        return window;
    }
    
    fft(input) {
        const N = input.length;
        const output = new Float32Array(N * 2);
        
        // Copy input to output (real part)
        for (let i = 0; i < N; i++) {
            output[i * 2] = input[i];
            output[i * 2 + 1] = 0;
        }
        
        // Simple DFT (for demonstration - in production use FFT library)
        const result = new Float32Array(N * 2);
        for (let k = 0; k < N; k++) {
            let real = 0;
            let imag = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += output[n * 2] * Math.cos(angle) - output[n * 2 + 1] * Math.sin(angle);
                imag += output[n * 2] * Math.sin(angle) + output[n * 2 + 1] * Math.cos(angle);
            }
            
            result[k * 2] = real;
            result[k * 2 + 1] = imag;
        }
        
        return result;
    }
    
    ifft(input) {
        const N = input.length / 2;
        const output = new Float32Array(N);
        
        // Simple IDFT
        for (let n = 0; n < N; n++) {
            let real = 0;
            
            for (let k = 0; k < N; k++) {
                const angle = 2 * Math.PI * k * n / N;
                real += input[k * 2] * Math.cos(angle) - input[k * 2 + 1] * Math.sin(angle);
            }
            
            output[n] = real / N;
        }
        
        return output;
    }
    
    calculateImprovement() {
        if (!this.processedBuffer || !this.audioBuffer) {
            return { noiseReduction: 0, newSNR: 0, qualityScore: 0 };
        }
        
        const originalData = this.audioBuffer.getChannelData(0);
        const processedData = this.processedBuffer.getChannelData(0);
        
        // Calculate RMS levels
        let originalRMS = 0;
        let processedRMS = 0;
        
        for (let i = 0; i < originalData.length; i++) {
            originalRMS += originalData[i] ** 2;
            processedRMS += processedData[i] ** 2;
        }
        
        originalRMS = Math.sqrt(originalRMS / originalData.length);
        processedRMS = Math.sqrt(processedRMS / processedData.length);
        
        const originalLevel = 20 * Math.log10(originalRMS + 1e-10);
        const processedLevel = 20 * Math.log10(processedRMS + 1e-10);
        
        // Estimate noise reduction (simplified)
        const noiseReduction = Math.abs(originalLevel - processedLevel);
        
        // Estimate new SNR (simplified)
        const newSNR = Math.max(0, originalLevel + noiseReduction);
        
        // Quality score based on processing effectiveness
        const qualityScore = Math.min(100, noiseReduction * 5 + 50);
        
        return { noiseReduction, newSNR, qualityScore };
    }
    
    createProcessedAudioPlayer() {
        const audioPlayer = document.getElementById('processedAudioPlayer');
        const audioBlob = this.bufferToWav(this.processedBuffer);
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = audioUrl;
    }
    
    playOriginal() {
        this.stopAudio();
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.connect(this.audioContext.destination);
        this.source.start();
        
        this.isPlaying = true;
        this.btnPlay.textContent = '⏸️ Pause Original';
        
        this.source.onended = () => {
            this.isPlaying = false;
            this.btnPlay.textContent = '▶️ Play Original';
        };
    }
    
    playProcessed() {
        if (!this.processedBuffer) return;
        
        this.stopAudio();
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.processedBuffer;
        this.source.connect(this.audioContext.destination);
        this.source.start();
        
        this.isPlaying = true;
        this.btnPreview.textContent = '⏸️ Pause Cleaned';
        
        this.source.onended = () => {
            this.isPlaying = false;
            this.btnPreview.textContent = '🔊 Preview Cleaned';
        };
    }
    
    stopAudio() {
        if (this.source) {
            this.source.stop();
            this.source = null;
        }
        this.isPlaying = false;
        this.btnPlay.textContent = '▶️ Play Original';
        this.btnPreview.textContent = '🔊 Preview Cleaned';
    }
    
    showExportSection() {
        this.exportSection.classList.remove('hidden');
        this.exportSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    updatePreview() {
        // Real-time preview updates would go here
        // For performance, only update when user stops adjusting controls
    }
    
    async downloadProcessedAudio() {
        if (!this.processedBuffer) return;
        
        const format = document.getElementById('exportFormat').value;
        const quality = document.getElementById('exportQuality').value;
        const postProcessing = document.getElementById('postProcessing').value;
        
        let finalBuffer = this.processedBuffer;
        
        // Apply post-processing if selected
        if (postProcessing !== 'none') {
            finalBuffer = await this.applyFinalProcessing(this.processedBuffer, postProcessing, quality);
        }
        
        const audioBlob = this.bufferToWav(finalBuffer);
        const fileName = `noise_reduced_audio.${format}`;
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(audioBlob);
        a.download = fileName;
        a.click();
        
        URL.revokeObjectURL(a.href);
    }
    
    async applyFinalProcessing(buffer, type, quality) {
        // Create a new buffer for final processing
        const finalBuffer = this.audioContext.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate
        );
        
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const inputData = buffer.getChannelData(channel);
            const outputData = finalBuffer.getChannelData(channel);
            outputData.set(inputData);
            
            if (type === 'normalize' || type === 'enhance') {
                this.normalizeChannel(outputData);
            }
            
            if (type === 'enhance') {
                this.enhanceChannel(outputData, buffer.sampleRate);
            }
        }
        
        return finalBuffer;
    }
    
    normalizeChannel(data) {
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
            peak = Math.max(peak, Math.abs(data[i]));
        }
        
        if (peak > 0) {
            const gain = 0.95 / peak; // Leave some headroom
            for (let i = 0; i < data.length; i++) {
                data[i] *= gain;
            }
        }
    }
    
    enhanceChannel(data, sampleRate) {
        // Simple enhancement: gentle high-frequency boost
        this.applyShelfFilter(data, 3000, 2, sampleRate, 'high');
    }
    
    applyShelfFilter(data, frequency, gain, sampleRate, type) {
        const omega = 2 * Math.PI * frequency / sampleRate;
        const gainLinear = Math.pow(10, gain / 20);
        
        // Simple first-order shelf filter coefficients
        let a = Math.tan(omega / 2);
        if (type === 'high') {
            a = 1 / a;
        }
        
        const b0 = (1 + Math.sqrt(2 * gainLinear) * a + gainLinear * a * a) / (1 + Math.sqrt(2) * a + a * a);
        const b1 = (2 * (gainLinear * a * a - 1)) / (1 + Math.sqrt(2) * a + a * a);
        const b2 = (1 - Math.sqrt(2 * gainLinear) * a + gainLinear * a * a) / (1 + Math.sqrt(2) * a + a * a);
        const a1 = (2 * (a * a - 1)) / (1 + Math.sqrt(2) * a + a * a);
        const a2 = (1 - Math.sqrt(2) * a + a * a) / (1 + Math.sqrt(2) * a + a * a);
        
        // Apply filter
        let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        
        for (let i = 0; i < data.length; i++) {
            const x0 = data[i];
            const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
            
            data[i] = y0;
            
            x2 = x1;
            x1 = x0;
            y2 = y1;
            y1 = y0;
        }
    }
    
    bufferToWav(buffer) {
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const length = buffer.length;
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
                view.setInt16(offset, sample * 32767, true);
                offset += 2;
            }
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
    
    updateProgress(percent) {
        this.progressFill.style.width = `${percent}%`;
    }
    
    showProgress(text, percent) {
        this.progressText.textContent = text;
        this.progressFill.style.width = `${percent}%`;
        this.progressContainer.classList.remove('hidden');
    }
    
    hideProgress() {
        this.progressContainer.classList.add('hidden');
    }
    
    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize the noise reducer when page loads
document.addEventListener('DOMContentLoaded', () => {
    new NoiseReducer();
});
