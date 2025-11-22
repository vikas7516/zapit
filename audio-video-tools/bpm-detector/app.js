// BPM Detector App - Advanced Tempo Detection using Web Audio API
class BPMDetector {
    constructor() {
        this.audioBuffer = null;
        this.audioContext = null;
        this.source = null;
        this.isPlaying = false;
        this.duration = 0;
        this.currentTime = 0;
        this.playStartTime = 0;
        this.animationId = null;
        this.detectedBPM = null;
        this.confidence = 0;
        this.beatTimes = [];
        
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
        
        // Analysis elements
        this.analysisSection = document.getElementById('analysisSection');
        this.analysisStatus = document.getElementById('analysisStatus');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.playBtn = document.getElementById('playBtn');
        this.stopBtn = document.getElementById('stopBtn');
        
        // BPM display
        this.bpmNumber = document.getElementById('bpmNumber');
        this.confidence = document.getElementById('confidence');
        this.tempoInfo = document.getElementById('tempoInfo');
        this.tempoClass = document.getElementById('tempoClass');
        this.genreSuggestions = document.getElementById('genreSuggestions');
        
        // Visualization elements
        this.visualizationSection = document.getElementById('visualizationSection');
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.beatMarkers = document.getElementById('beatMarkers');
        this.playhead = document.getElementById('playhead');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.durationDisplay = document.getElementById('duration');
        this.showBeats = document.getElementById('showBeats');
        this.enableMetronome = document.getElementById('enableMetronome');
        
        // Settings elements
        this.settingsSection = document.getElementById('settingsSection');
        this.analysisRange = document.getElementById('analysisRange');
        this.bpmRange = document.getElementById('bpmRange');
        this.customRangeSettings = document.getElementById('customRangeSettings');
        this.startTime = document.getElementById('startTime');
        this.endTime = document.getElementById('endTime');
        this.sensitivity = document.getElementById('sensitivity');
        
        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.primaryBPM = document.getElementById('primaryBPM');
        this.alternativeBPM = document.getElementById('alternativeBPM');
        this.timeSignature = document.getElementById('timeSignature');
        this.beatDuration = document.getElementById('beatDuration');
        this.analysisDetails = document.getElementById('analysisDetails');
        this.exportBtn = document.getElementById('exportBtn');
        
        this.ctx = this.waveformCanvas.getContext('2d');
    }

    attachEventListeners() {
        // Upload events
        this.uploadArea.addEventListener('click', () => this.audioFileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.audioFileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Analysis controls
        this.analyzeBtn.addEventListener('click', () => this.analyzeBPM());
        this.playBtn.addEventListener('click', () => this.play());
        this.stopBtn.addEventListener('click', () => this.stop());
        
        // Settings
        this.analysisRange.addEventListener('change', () => this.handleRangeChange());
        this.showBeats.addEventListener('change', () => this.updateBeatMarkers());
        
        // Export
        this.exportBtn.addEventListener('click', () => this.exportResults());
        
        // Canvas interaction
        this.waveformCanvas.addEventListener('click', (e) => this.seekTo(e));
        
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
            this.currentTime = 0;
            
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
        this.analysisSection.classList.remove('hidden');
        this.visualizationSection.classList.remove('hidden');
        this.settingsSection.classList.remove('hidden');
        this.resultsSection.classList.remove('hidden');
    }

    setupWaveform() {
        this.resizeCanvas();
        this.drawWaveform();
        this.updateTimeDisplays();
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
        
        // Update beat markers if they exist
        this.updateBeatMarkers();
    }

    handleRangeChange() {
        const isCustom = this.analysisRange.value === 'custom';
        this.customRangeSettings.classList.toggle('hidden', !isCustom);
        
        if (isCustom) {
            this.endTime.max = Math.floor(this.duration);
        }
    }

    async analyzeBPM() {
        if (!this.audioBuffer) {
            alert('Please load an audio file first');
            return;
        }

        try {
            this.analysisStatus.textContent = 'Analyzing audio...';
            this.analysisStatus.classList.add('analyzing');
            this.analyzeBtn.disabled = true;
            
            // Get analysis parameters
            const range = this.getAnalysisRange();
            const bpmRange = this.getBPMRange();
            const sensitivity = parseInt(this.sensitivity.value);
            
            // Perform BPM detection
            const result = await this.detectBPM(range, bpmRange, sensitivity);
            
            this.detectedBPM = result.bpm;
            this.confidence = result.confidence;
            this.beatTimes = result.beatTimes;
            
            this.updateBPMDisplay(result);
            this.updateResults(result);
            this.updateBeatMarkers();
            
            this.analysisStatus.textContent = 'Analysis complete!';
            this.analysisStatus.classList.remove('analyzing');
            
            setTimeout(() => {
                this.analysisStatus.textContent = 'Ready to analyze';
            }, 3000);
            
        } catch (error) {
            console.error('Error analyzing BPM:', error);
            this.analysisStatus.textContent = 'Analysis failed';
            this.analysisStatus.classList.remove('analyzing');
        } finally {
            this.analyzeBtn.disabled = false;
        }
    }

    getAnalysisRange() {
        const rangeType = this.analysisRange.value;
        const duration = this.duration;
        
        switch (rangeType) {
            case 'full':
                return { start: 0, end: duration };
            case 'beginning':
                return { start: 0, end: Math.min(30, duration) };
            case 'middle':
                const midStart = Math.max(0, (duration - 30) / 2);
                return { start: midStart, end: Math.min(midStart + 30, duration) };
            case 'custom':
                const start = parseFloat(this.startTime.value) || 0;
                const end = parseFloat(this.endTime.value) || duration;
                return { start: Math.max(0, start), end: Math.min(end, duration) };
            default:
                return { start: 0, end: duration };
        }
    }

    getBPMRange() {
        const range = this.bpmRange.value;
        
        const ranges = {
            auto: { min: 60, max: 200 },
            slow: { min: 60, max: 100 },
            medium: { min: 100, max: 140 },
            fast: { min: 140, max: 200 },
            electronic: { min: 120, max: 180 }
        };
        
        return ranges[range] || ranges.auto;
    }

    async detectBPM(range, bpmRange, sensitivity) {
        const sampleRate = this.audioBuffer.sampleRate;
        const startSample = Math.floor(range.start * sampleRate);
        const endSample = Math.floor(range.end * sampleRate);
        const length = endSample - startSample;
        
        // Get audio data for analysis
        const channelData = this.audioBuffer.getChannelData(0);
        const analysisData = channelData.slice(startSample, endSample);
        
        // Apply high-pass filter to remove low-frequency noise
        const filteredData = this.highPassFilter(analysisData, sampleRate);
        
        // Detect beats using onset detection
        const onsets = this.detectOnsets(filteredData, sampleRate, sensitivity);
        
        // Calculate intervals between beats
        const intervals = [];
        for (let i = 1; i < onsets.length; i++) {
            intervals.push(onsets[i] - onsets[i - 1]);
        }
        
        if (intervals.length === 0) {
            throw new Error('No beats detected');
        }
        
        // Find most common interval (tempo)
        const bpmCandidates = this.calculateBPMCandidates(intervals, bpmRange);
        const primaryBPM = bpmCandidates[0];
        
        // Calculate confidence based on consistency
        const confidence = this.calculateConfidence(intervals, primaryBPM.interval);
        
        // Generate beat times
        const beatTimes = this.generateBeatTimes(primaryBPM.bpm, range.start, range.end - range.start);
        
        return {
            bpm: Math.round(primaryBPM.bpm),
            confidence: Math.round(confidence * 100),
            beatTimes: beatTimes,
            alternativeBPM: bpmCandidates[1] ? Math.round(bpmCandidates[1].bpm) : null,
            intervals: intervals,
            onsets: onsets.map(onset => onset + range.start)
        };
    }

    highPassFilter(data, sampleRate, cutoff = 100) {
        // Simple high-pass filter
        const rc = 1.0 / (cutoff * 2 * Math.PI);
        const dt = 1.0 / sampleRate;
        const alpha = rc / (rc + dt);
        
        const filtered = new Float32Array(data.length);
        filtered[0] = data[0];
        
        for (let i = 1; i < data.length; i++) {
            filtered[i] = alpha * (filtered[i - 1] + data[i] - data[i - 1]);
        }
        
        return filtered;
    }

    detectOnsets(data, sampleRate, sensitivity) {
        const frameSize = 1024;
        const hopSize = 512;
        const onsets = [];
        
        // Calculate spectral flux
        let prevSpectrum = null;
        
        for (let i = 0; i < data.length - frameSize; i += hopSize) {
            const frame = data.slice(i, i + frameSize);
            const spectrum = this.getSpectrum(frame);
            
            if (prevSpectrum) {
                let flux = 0;
                for (let j = 0; j < spectrum.length; j++) {
                    const diff = spectrum[j] - prevSpectrum[j];
                    flux += Math.max(0, diff); // Only positive changes
                }
                
                // Dynamic threshold based on sensitivity
                const threshold = this.calculateAdaptiveThreshold(onsets, flux, sensitivity);
                
                if (flux > threshold) {
                    const timePosition = i / sampleRate;
                    onsets.push(timePosition);
                }
            }
            
            prevSpectrum = spectrum;
        }
        
        return onsets;
    }

    getSpectrum(frame) {
        // Simple magnitude spectrum
        const spectrum = [];
        const N = frame.length;
        
        for (let k = 0; k < N / 2; k++) {
            let real = 0;
            let imag = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += frame[n] * Math.cos(angle);
                imag += frame[n] * Math.sin(angle);
            }
            
            spectrum[k] = Math.sqrt(real * real + imag * imag);
        }
        
        return spectrum;
    }

    calculateAdaptiveThreshold(onsets, currentFlux, sensitivity) {
        if (onsets.length < 10) {
            return currentFlux * 0.3; // Initial threshold
        }
        
        // Calculate mean flux from recent onsets
        const recentOnsets = onsets.slice(-20);
        const meanFlux = recentOnsets.reduce((sum, onset) => sum + onset.flux, 0) / recentOnsets.length;
        
        // Adjust threshold based on sensitivity (1-10)
        const sensitivityFactor = (11 - sensitivity) / 10; // Lower sensitivity = higher threshold
        return meanFlux * sensitivityFactor * 0.7;
    }

    calculateBPMCandidates(intervals, bpmRange) {
        // Group similar intervals
        const intervalGroups = {};
        const tolerance = 0.05; // 5% tolerance
        
        intervals.forEach(interval => {
            const bpm = 60 / interval;
            if (bpm >= bpmRange.min && bpm <= bpmRange.max) {
                const key = Math.round(bpm / 5) * 5; // Group by 5 BPM buckets
                if (!intervalGroups[key]) {
                    intervalGroups[key] = [];
                }
                intervalGroups[key].push(interval);
            }
        });
        
        // Calculate scores for each group
        const candidates = Object.keys(intervalGroups).map(bpm => {
            const group = intervalGroups[bpm];
            const avgInterval = group.reduce((sum, int) => sum + int, 0) / group.length;
            const score = group.length; // Simple frequency scoring
            
            return {
                bpm: 60 / avgInterval,
                interval: avgInterval,
                score: score,
                count: group.length
            };
        });
        
        // Sort by score (frequency of occurrence)
        return candidates.sort((a, b) => b.score - a.score);
    }

    calculateConfidence(intervals, targetInterval) {
        const tolerance = 0.1; // 10% tolerance
        const matchingIntervals = intervals.filter(interval => {
            const diff = Math.abs(interval - targetInterval) / targetInterval;
            return diff <= tolerance;
        });
        
        return matchingIntervals.length / intervals.length;
    }

    generateBeatTimes(bpm, startTime, duration) {
        const beatInterval = 60 / bpm;
        const beats = [];
        
        for (let time = 0; time < duration; time += beatInterval) {
            beats.push(startTime + time);
        }
        
        return beats;
    }

    updateBPMDisplay(result) {
        this.bpmNumber.textContent = result.bpm;
        this.confidence.textContent = result.confidence;
        
        // Show tempo info
        this.tempoInfo.classList.remove('hidden');
        this.updateTempoClassification(result.bpm);
    }

    updateTempoClassification(bpm) {
        let tempoClass = '';
        let genres = '';
        
        if (bpm < 70) {
            tempoClass = 'Very Slow (Largo)';
            genres = 'Ballads, Ambient, Meditation';
        } else if (bpm < 90) {
            tempoClass = 'Slow (Adagio)';
            genres = 'Blues, Jazz Ballads, R&B';
        } else if (bpm < 110) {
            tempoClass = 'Moderate (Andante)';
            genres = 'Pop, Rock, Folk';
        } else if (bpm < 130) {
            tempoClass = 'Medium (Moderato)';
            genres = 'Dance, Disco, Funk';
        } else if (bpm < 150) {
            tempoClass = 'Fast (Allegro)';
            genres = 'House, Techno, Hip-Hop';
        } else if (bpm < 170) {
            tempoClass = 'Very Fast (Presto)';
            genres = 'Trance, Hardcore, Punk';
        } else {
            tempoClass = 'Extremely Fast';
            genres = 'Drum & Bass, Gabber, Speed Metal';
        }
        
        this.tempoClass.textContent = tempoClass;
        this.genreSuggestions.textContent = genres;
    }

    updateResults(result) {
        this.primaryBPM.textContent = `${result.bpm} BPM`;
        this.alternativeBPM.textContent = result.alternativeBPM ? `${result.alternativeBPM} BPM` : 'N/A';
        this.timeSignature.textContent = '4/4'; // Assume 4/4 for simplicity
        this.beatDuration.textContent = `${(60 / result.bpm).toFixed(3)}s`;
        
        // Update detailed analysis
        const details = `
            <p><strong>Analysis Summary:</strong></p>
            <ul>
                <li>Primary BPM: ${result.bpm} (${result.confidence}% confidence)</li>
                <li>Beats detected: ${result.beatTimes.length}</li>
                <li>Analysis range: ${this.getAnalysisRangeText()}</li>
                <li>Detection method: Spectral flux onset detection</li>
                <li>Time signature: 4/4 (assumed)</li>
                ${result.alternativeBPM ? `<li>Alternative BPM: ${result.alternativeBPM}</li>` : ''}
            </ul>
        `;
        
        this.analysisDetails.innerHTML = details;
    }

    getAnalysisRangeText() {
        const range = this.getAnalysisRange();
        return `${this.formatTime(range.start)} - ${this.formatTime(range.end)}`;
    }

    updateBeatMarkers() {
        if (!this.showBeats.checked || !this.beatTimes.length) {
            this.beatMarkers.innerHTML = '';
            return;
        }
        
        const containerWidth = this.waveformCanvas.clientWidth;
        const markers = this.beatTimes.map(time => {
            const percent = (time / this.duration) * 100;
            return `<div class="beat-marker" style="left: ${percent}%"></div>`;
        }).join('');
        
        this.beatMarkers.innerHTML = markers;
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

    seekTo(e) {
        if (!this.audioBuffer) return;
        
        const rect = this.waveformCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        
        this.currentTime = percent * this.duration;
        this.updatePlayhead();
        this.updateTimeDisplays();
    }

    updatePlayControls() {
        this.playBtn.style.display = this.isPlaying ? 'none' : 'inline-block';
    }

    startPlayheadAnimation() {
        const animate = () => {
            if (this.isPlaying) {
                const elapsed = this.audioContext.currentTime - this.playStartTime;
                this.currentTime = Math.min(
                    this.currentTime + elapsed,
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
        this.currentTimeDisplay.textContent = this.formatTime(this.currentTime);
        this.durationDisplay.textContent = this.formatTime(this.duration);
    }

    exportResults() {
        if (!this.detectedBPM) {
            alert('Please analyze the audio first');
            return;
        }
        
        const results = {
            filename: this.fileInfo.textContent,
            primaryBPM: this.detectedBPM,
            confidence: this.confidence,
            alternativeBPM: this.alternativeBPM.textContent,
            tempoClassification: this.tempoClass.textContent,
            genreSuggestions: this.genreSuggestions.textContent,
            analysisRange: this.getAnalysisRangeText(),
            beatTimes: this.beatTimes,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bpm-analysis-${this.detectedBPM}bpm.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
            alert('BPM Detector is not supported in this browser:\n\n' + issues.join('\n'));
            return false;
        }
        
        return true;
    }
}

// Initialize the BPM detector when the page loads
let bpmDetector;

document.addEventListener('DOMContentLoaded', () => {
    if (BPMDetector.checkCompatibility()) {
        bpmDetector = new BPMDetector();
    }
});
