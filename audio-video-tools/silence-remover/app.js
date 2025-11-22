class SilenceRemover {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.processedBuffer = null;
        this.source = null;
        this.isPlaying = false;
        this.isProcessing = false;
        this.silenceRegions = [];
        this.selectedRegions = [];
        this.waveformData = null;
        
        // UI Elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.silenceSection = document.getElementById('silenceSection');
        this.exportSection = document.getElementById('exportSection');
        this.regionsSection = document.getElementById('regionsSection');
        
        // Controls
        this.btnPlay = document.getElementById('btnPlay');
        this.btnStop = document.getElementById('btnStop');
        this.btnPreview = document.getElementById('btnPreview');
        this.btnExport = document.getElementById('btnExport');
        this.btnDetect = document.getElementById('btnDetect');
        this.btnProcess = document.getElementById('btnProcess');
        this.btnDownload = document.getElementById('btnDownload');
        this.btnSelectAll = document.getElementById('btnSelectAll');
        this.btnDeselectAll = document.getElementById('btnDeselectAll');
        this.btnRemoveSelected = document.getElementById('btnRemoveSelected');
        
        // Canvas elements
        this.waveformCanvas = document.getElementById('waveformCanvas');
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
        this.btnDetect.addEventListener('click', () => this.detectSilence());
        this.btnProcess.addEventListener('click', () => this.processAudio());
        this.btnDownload.addEventListener('click', () => this.downloadProcessedAudio());
        
        // Region controls
        this.btnSelectAll.addEventListener('click', () => this.selectAllRegions());
        this.btnDeselectAll.addEventListener('click', () => this.deselectAllRegions());
        this.btnRemoveSelected.addEventListener('click', () => this.removeSelectedRegions());
        
        // Sliders
        this.initializeSliders();
        
        // Detection mode radio buttons
        const detectionModeRadios = document.querySelectorAll('input[name="detection-mode"]');
        detectionModeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.handleDetectionModeChange());
        });
        
        // Canvas interaction
        this.waveformCanvas.addEventListener('click', (e) => this.handleWaveformClick(e));
    }
    
    initializeSliders() {
        const sliders = [
            { id: 'silenceThreshold', suffix: ' dB' },
            { id: 'minSilenceDuration', suffix: ' ms' },
            { id: 'fadeDuration', suffix: ' ms' },
            { id: 'lookAhead', suffix: ' ms' },
            { id: 'adaptiveThreshold', suffix: '%' },
            { id: 'noiseFloor', suffix: ' dB' }
        ];
        
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const valueElement = document.getElementById(slider.id + 'Value');
            
            element.addEventListener('input', () => {
                valueElement.textContent = element.value + slider.suffix;
                if (this.audioBuffer) {
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
            this.silenceSection.classList.remove('hidden');
            this.generateWaveformData();
            this.drawWaveform();
            
            // Auto-detect silence on load
            setTimeout(() => this.detectSilence(), 500);
            
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
    
    generateWaveformData() {
        const audioData = this.audioBuffer.getChannelData(0);
        const width = this.waveformCanvas.width;
        const samplesPerPixel = Math.floor(audioData.length / width);
        
        this.waveformData = [];
        
        for (let x = 0; x < width; x++) {
            const start = x * samplesPerPixel;
            const end = start + samplesPerPixel;
            let max = 0;
            let rms = 0;
            
            for (let i = start; i < end && i < audioData.length; i++) {
                const sample = Math.abs(audioData[i]);
                max = Math.max(max, sample);
                rms += sample * sample;
            }
            
            rms = Math.sqrt(rms / (end - start));
            
            this.waveformData.push({
                max: max,
                rms: rms,
                time: (start / audioData.length) * this.audioBuffer.duration
            });
        }
    }
    
    drawWaveform() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveformCtx;
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        if (!this.waveformData) return;
        
        // Draw waveform
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let x = 0; x < width && x < this.waveformData.length; x++) {
            const y = (1 - this.waveformData[x].max) * height / 2;
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Draw silence regions
        this.drawSilenceRegions();
    }
    
    drawSilenceRegions() {
        const ctx = this.waveformCtx;
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        
        this.silenceRegions.forEach((region, index) => {
            const startX = (region.start / this.audioBuffer.duration) * width;
            const endX = (region.end / this.audioBuffer.duration) * width;
            
            // Fill silence region
            if (this.selectedRegions.includes(index)) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'; // Selected - red
            } else {
                ctx.fillStyle = 'rgba(255, 193, 7, 0.3)'; // Unselected - yellow
            }
            ctx.fillRect(startX, 0, endX - startX, height);
            
            // Draw borders
            ctx.strokeStyle = this.selectedRegions.includes(index) ? '#ef4444' : '#ffc107';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            ctx.lineTo(startX, height);
            ctx.moveTo(endX, 0);
            ctx.lineTo(endX, height);
            ctx.stroke();
            
            // Draw region label
            if (endX - startX > 40) {
                ctx.fillStyle = '#000';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                const labelX = startX + (endX - startX) / 2;
                ctx.fillText(`${region.duration.toFixed(1)}s`, labelX, height / 2);
            }
        });
    }
    
    async detectSilence() {
        if (!this.audioBuffer || this.isProcessing) return;
        
        this.isProcessing = true;
        this.btnDetect.disabled = true;
        this.showProgress('Detecting silence...', 0);
        
        try {
            // Get detection parameters
            const threshold = parseFloat(document.getElementById('silenceThreshold').value);
            const minDuration = parseFloat(document.getElementById('minSilenceDuration').value) / 1000;
            const lookAhead = parseFloat(document.getElementById('lookAhead').value) / 1000;
            const adaptiveThreshold = parseFloat(document.getElementById('adaptiveThreshold').value) / 100;
            const noiseFloor = parseFloat(document.getElementById('noiseFloor').value);
            
            const detectionMode = document.querySelector('input[name="detection-mode"]:checked').value;
            const preserveShort = document.getElementById('preserveShort').checked;
            const smartMode = document.getElementById('smartMode').checked;
            
            // Detect silence regions
            this.silenceRegions = await this.analyzeSilenceRegions({
                threshold,
                minDuration,
                lookAhead,
                adaptiveThreshold,
                noiseFloor,
                detectionMode,
                preserveShort,
                smartMode
            });
            
            this.updateSilenceStats();
            this.drawWaveform();
            this.regionsSection.classList.remove('hidden');
            this.createRegionsList();
            
        } catch (error) {
            console.error('Error detecting silence:', error);
            this.showError('Error detecting silence. Please try again.');
        } finally {
            this.isProcessing = false;
            this.btnDetect.disabled = false;
            this.hideProgress();
        }
    }
    
    async analyzeSilenceRegions(params) {
        const audioData = this.audioBuffer.getChannelData(0);
        const sampleRate = this.audioBuffer.sampleRate;
        const { threshold, minDuration, lookAhead, adaptiveThreshold, noiseFloor, detectionMode, preserveShort, smartMode } = params;
        
        const thresholdLinear = Math.pow(10, threshold / 20);
        const noiseFloorLinear = Math.pow(10, noiseFloor / 20);
        const lookAheadSamples = Math.floor(lookAhead * sampleRate);
        const minDurationSamples = Math.floor(minDuration * sampleRate);
        
        const regions = [];
        let currentRegionStart = null;
        let adaptiveThresholdValue = thresholdLinear;
        
        // Calculate RMS in overlapping windows
        const windowSize = Math.floor(sampleRate * 0.01); // 10ms windows
        const hopSize = Math.floor(windowSize / 2);
        
        for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
            // Calculate RMS for current window
            let rms = 0;
            for (let j = 0; j < windowSize; j++) {
                if (i + j < audioData.length) {
                    rms += audioData[i + j] ** 2;
                }
            }
            rms = Math.sqrt(rms / windowSize);
            
            // Adaptive threshold adjustment
            if (adaptiveThreshold > 0) {
                const targetRMS = Math.max(rms, noiseFloorLinear);
                adaptiveThresholdValue = thresholdLinear * (1 + adaptiveThreshold * (targetRMS / thresholdLinear - 1));
            }
            
            const isSilent = rms < adaptiveThresholdValue;
            const currentTime = i / sampleRate;
            
            if (isSilent && currentRegionStart === null) {
                // Start of silence region
                currentRegionStart = currentTime;
            } else if (!isSilent && currentRegionStart !== null) {
                // End of silence region
                const duration = currentTime - currentRegionStart;
                
                if (duration >= minDuration) {
                    regions.push({
                        start: currentRegionStart,
                        end: currentTime,
                        duration: duration,
                        avgLevel: this.calculateAverageLevel(audioData, currentRegionStart, currentTime, sampleRate),
                        type: this.classifySilenceType(audioData, currentRegionStart, currentTime, sampleRate)
                    });
                }
                
                currentRegionStart = null;
            }
            
            // Update progress
            if (i % (hopSize * 100) === 0) {
                this.updateProgress((i / audioData.length) * 100);
            }
        }
        
        // Handle final region if audio ends in silence
        if (currentRegionStart !== null) {
            const endTime = audioData.length / sampleRate;
            const duration = endTime - currentRegionStart;
            
            if (duration >= minDuration) {
                regions.push({
                    start: currentRegionStart,
                    end: endTime,
                    duration: duration,
                    avgLevel: this.calculateAverageLevel(audioData, currentRegionStart, endTime, sampleRate),
                    type: 'end-silence'
                });
            }
        }
        
        // Apply smart filtering if enabled
        if (smartMode) {
            return this.applySmartFiltering(regions, preserveShort);
        }
        
        return regions;
    }
    
    calculateAverageLevel(audioData, startTime, endTime, sampleRate) {
        const startSample = Math.floor(startTime * sampleRate);
        const endSample = Math.floor(endTime * sampleRate);
        
        let sum = 0;
        let count = 0;
        
        for (let i = startSample; i < endSample && i < audioData.length; i++) {
            sum += audioData[i] ** 2;
            count++;
        }
        
        const rms = Math.sqrt(sum / count);
        return 20 * Math.log10(rms + 1e-10);
    }
    
    classifySilenceType(audioData, startTime, endTime, sampleRate) {
        const duration = endTime - startTime;
        
        if (duration < 0.1) return 'micro-pause';
        if (duration < 0.5) return 'short-pause';
        if (duration < 2.0) return 'medium-pause';
        if (startTime < 1.0) return 'intro-silence';
        if (endTime > (audioData.length / sampleRate) - 1.0) return 'outro-silence';
        
        return 'long-pause';
    }
    
    applySmartFiltering(regions, preserveShort) {
        // Remove regions that are likely intentional pauses
        return regions.filter(region => {
            // Keep short pauses if preserveShort is enabled
            if (preserveShort && region.duration < 0.2) {
                return false;
            }
            
            // Keep intro/outro silence and long pauses
            if (region.type === 'intro-silence' || region.type === 'outro-silence' || region.type === 'long-pause') {
                return true;
            }
            
            // Filter based on context and characteristics
            return region.duration > 0.1 && region.avgLevel < -40;
        });
    }
    
    updateSilenceStats() {
        const totalDuration = this.audioBuffer.duration;
        const silenceDuration = this.silenceRegions.reduce((sum, region) => sum + region.duration, 0);
        const silencePercentage = (silenceDuration / totalDuration) * 100;
        
        document.getElementById('totalSilence').textContent = `${silenceDuration.toFixed(1)}s`;
        document.getElementById('silencePercentage').textContent = `${silencePercentage.toFixed(1)}%`;
        document.getElementById('regionsCount').textContent = this.silenceRegions.length.toString();
        document.getElementById('newDuration').textContent = `${(totalDuration - silenceDuration).toFixed(1)}s`;
    }
    
    createRegionsList() {
        const container = document.getElementById('regionsList');
        container.innerHTML = '';
        
        this.silenceRegions.forEach((region, index) => {
            const regionElement = document.createElement('div');
            regionElement.className = 'region-item';
            if (this.selectedRegions.includes(index)) {
                regionElement.classList.add('selected');
            }
            
            regionElement.innerHTML = `
                <div class="region-info">
                    <div class="region-time">${this.formatTime(region.start)} - ${this.formatTime(region.end)}</div>
                    <div class="region-details">
                        Duration: ${region.duration.toFixed(2)}s | Level: ${region.avgLevel.toFixed(1)}dB | Type: ${region.type}
                    </div>
                </div>
                <div class="region-controls">
                    <button class="region-play" onclick="audioProcessor.playRegion(${index})">▶️</button>
                    <button class="region-toggle" onclick="audioProcessor.toggleRegion(${index})">
                        ${this.selectedRegions.includes(index) ? '✅' : '☐'}
                    </button>
                </div>
            `;
            
            container.appendChild(regionElement);
        });
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        return `${minutes}:${secs.padStart(4, '0')}`;
    }
    
    handleDetectionModeChange() {
        const selectedMode = document.querySelector('input[name="detection-mode"]:checked').value;
        // Could show/hide mode-specific controls here
    }
    
    handleWaveformClick(e) {
        const rect = this.waveformCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / this.waveformCanvas.width;
        const clickTime = ratio * this.audioBuffer.duration;
        
        // Find clicked region
        for (let i = 0; i < this.silenceRegions.length; i++) {
            const region = this.silenceRegions[i];
            if (clickTime >= region.start && clickTime <= region.end) {
                this.toggleRegion(i);
                break;
            }
        }
    }
    
    toggleRegion(index) {
        const selectedIndex = this.selectedRegions.indexOf(index);
        if (selectedIndex > -1) {
            this.selectedRegions.splice(selectedIndex, 1);
        } else {
            this.selectedRegions.push(index);
        }
        
        this.drawWaveform();
        this.createRegionsList();
        this.updateSelectionStats();
    }
    
    selectAllRegions() {
        this.selectedRegions = [...Array(this.silenceRegions.length).keys()];
        this.drawWaveform();
        this.createRegionsList();
        this.updateSelectionStats();
    }
    
    deselectAllRegions() {
        this.selectedRegions = [];
        this.drawWaveform();
        this.createRegionsList();
        this.updateSelectionStats();
    }
    
    removeSelectedRegions() {
        this.silenceRegions = this.silenceRegions.filter((region, index) => !this.selectedRegions.includes(index));
        this.selectedRegions = [];
        this.drawWaveform();
        this.createRegionsList();
        this.updateSilenceStats();
        this.updateSelectionStats();
    }
    
    updateSelectionStats() {
        const selectedDuration = this.selectedRegions.reduce((sum, index) => {
            return sum + this.silenceRegions[index].duration;
        }, 0);
        
        document.getElementById('selectedCount').textContent = this.selectedRegions.length.toString();
        document.getElementById('selectedDuration').textContent = `${selectedDuration.toFixed(1)}s`;
    }
    
    playRegion(index) {
        if (!this.audioBuffer || index >= this.silenceRegions.length) return;
        
        const region = this.silenceRegions[index];
        this.playAudioSegment(region.start, region.end);
    }
    
    playAudioSegment(startTime, endTime) {
        this.stopAudio();
        
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        source.connect(this.audioContext.destination);
        source.start(0, startTime, endTime - startTime);
        
        this.source = source;
        this.isPlaying = true;
        
        source.onended = () => {
            this.isPlaying = false;
            this.source = null;
        };
    }
    
    async processAudio() {
        if (!this.audioBuffer || this.selectedRegions.length === 0 || this.isProcessing) return;
        
        this.isProcessing = true;
        this.btnProcess.disabled = true;
        this.showProgress('Processing audio...', 0);
        
        try {
            // Get processing parameters
            const fadeDuration = parseFloat(document.getElementById('fadeDuration').value) / 1000;
            const smoothTransitions = document.getElementById('smoothTransitions').checked;
            const preserveGaps = document.getElementById('preserveGaps').checked;
            
            // Create regions to remove (selected regions)
            const regionsToRemove = this.selectedRegions.map(index => this.silenceRegions[index]);
            regionsToRemove.sort((a, b) => a.start - b.start);
            
            // Calculate new audio length
            const totalRemovalTime = regionsToRemove.reduce((sum, region) => sum + region.duration, 0);
            const newLength = this.audioBuffer.length - Math.floor(totalRemovalTime * this.audioBuffer.sampleRate);
            
            // Create new buffer
            this.processedBuffer = this.audioContext.createBuffer(
                this.audioBuffer.numberOfChannels,
                newLength,
                this.audioBuffer.sampleRate
            );
            
            // Process each channel
            for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
                const inputData = this.audioBuffer.getChannelData(channel);
                const outputData = this.processedBuffer.getChannelData(channel);
                
                await this.processChannelData(inputData, outputData, regionsToRemove, {
                    fadeDuration,
                    smoothTransitions,
                    preserveGaps,
                    sampleRate: this.audioBuffer.sampleRate
                });
                
                this.updateProgress((channel + 1) / this.audioBuffer.numberOfChannels * 100);
            }
            
            // Update UI
            this.createProcessedAudioPlayer();
            this.exportSection.classList.remove('hidden');
            this.btnDownload.classList.remove('hidden');
            
            // Update stats
            this.updateProcessingStats();
            
        } catch (error) {
            console.error('Error processing audio:', error);
            this.showError('Error processing audio. Please try again.');
        } finally {
            this.isProcessing = false;
            this.btnProcess.disabled = false;
            this.hideProgress();
        }
    }
    
    async processChannelData(inputData, outputData, regionsToRemove, params) {
        const { fadeDuration, smoothTransitions, sampleRate } = params;
        const fadeSamples = Math.floor(fadeDuration * sampleRate);
        
        let outputIndex = 0;
        let inputIndex = 0;
        
        for (const region of regionsToRemove) {
            const regionStartSample = Math.floor(region.start * sampleRate);
            const regionEndSample = Math.floor(region.end * sampleRate);
            
            // Copy audio before this silence region
            const copyLength = regionStartSample - inputIndex;
            if (copyLength > 0) {
                for (let i = 0; i < copyLength && outputIndex < outputData.length; i++) {
                    outputData[outputIndex++] = inputData[inputIndex + i];
                }
            }
            
            // Apply crossfade if smooth transitions are enabled
            if (smoothTransitions && outputIndex > fadeSamples && regionEndSample + fadeSamples < inputData.length) {
                this.applyCrossfade(
                    inputData,
                    outputData,
                    outputIndex - fadeSamples,
                    regionEndSample,
                    fadeSamples
                );
            }
            
            // Skip the silence region
            inputIndex = regionEndSample;
        }
        
        // Copy remaining audio after the last silence region
        while (inputIndex < inputData.length && outputIndex < outputData.length) {
            outputData[outputIndex++] = inputData[inputIndex++];
        }
    }
    
    applyCrossfade(inputData, outputData, outputStart, inputStart, fadeLength) {
        for (let i = 0; i < fadeLength; i++) {
            const fadeRatio = i / fadeLength;
            const inputSample = inputData[inputStart + i];
            const outputSample = outputData[outputStart + i];
            
            // Linear crossfade
            outputData[outputStart + i] = outputSample * (1 - fadeRatio) + inputSample * fadeRatio;
        }
    }
    
    updateProcessingStats() {
        const originalDuration = this.audioBuffer.duration;
        const newDuration = this.processedBuffer.duration;
        const timeSaved = originalDuration - newDuration;
        const percentageReduced = (timeSaved / originalDuration) * 100;
        
        document.getElementById('timeSaved').textContent = `${timeSaved.toFixed(1)}s`;
        document.getElementById('percentageReduced').textContent = `${percentageReduced.toFixed(1)}%`;
        document.getElementById('finalDuration').textContent = `${newDuration.toFixed(1)}s`;
        document.getElementById('regionsRemoved').textContent = this.selectedRegions.length.toString();
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
        this.btnPreview.textContent = '⏸️ Pause Processed';
        
        this.source.onended = () => {
            this.isPlaying = false;
            this.btnPreview.textContent = '🔊 Preview Processed';
        };
    }
    
    stopAudio() {
        if (this.source) {
            this.source.stop();
            this.source = null;
        }
        this.isPlaying = false;
        this.btnPlay.textContent = '▶️ Play Original';
        this.btnPreview.textContent = '🔊 Preview Processed';
    }
    
    showExportSection() {
        this.exportSection.classList.remove('hidden');
        this.exportSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    updatePreview() {
        // Real-time preview updates would go here
        // For performance, only update when user stops adjusting controls
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }
        
        this.previewTimeout = setTimeout(() => {
            if (this.audioBuffer) {
                this.detectSilence();
            }
        }, 1000);
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
        const fileName = `silence_removed_audio.${format}`;
        
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
        // Simple enhancement: gentle compression
        const threshold = 0.7;
        const ratio = 3;
        
        for (let i = 0; i < data.length; i++) {
            const sample = data[i];
            const magnitude = Math.abs(sample);
            
            if (magnitude > threshold) {
                const excess = magnitude - threshold;
                const compressedExcess = excess / ratio;
                const newMagnitude = threshold + compressedExcess;
                data[i] = (sample >= 0 ? 1 : -1) * newMagnitude;
            }
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

// Global reference for onclick handlers
let audioProcessor;

// Initialize the silence remover when page loads
document.addEventListener('DOMContentLoaded', () => {
    audioProcessor = new SilenceRemover();
});
