class AudioEffects {
    constructor() {
        this.audioFile = null;
        this.audioBuffer = null;
        this.audioContext = null;
        this.sourceNode = null;
        this.effectChain = [];
        this.isPlaying = false;
        this.isPreviewMode = false;
        this.processedBuffer = null;
        this.analyser = null;
        this.visualizationId = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudioContext();
        this.initializeEffects();
    }

    initializeElements() {
        // Upload elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadText = document.getElementById('uploadText');
        this.fileInfo = document.getElementById('fileInfo');

        // Control buttons
        this.btnPlay = document.getElementById('btnPlay');
        this.btnStop = document.getElementById('btnStop');
        this.btnPreview = document.getElementById('btnPreview');
        this.btnExport = document.getElementById('btnExport');

        // Effect toggles
        this.effectToggles = {
            reverb: document.getElementById('enableReverb'),
            delay: document.getElementById('enableDelay'),
            distortion: document.getElementById('enableDistortion'),
            filter: document.getElementById('enableFilter'),
            compressor: document.getElementById('enableCompressor')
        };

        // Effect controls
        this.effectControls = {
            // Reverb
            reverbRoom: document.getElementById('reverbRoom'),
            reverbDecay: document.getElementById('reverbDecay'),
            reverbMix: document.getElementById('reverbMix'),
            // Delay
            delayTime: document.getElementById('delayTime'),
            delayFeedback: document.getElementById('delayFeedback'),
            delayMix: document.getElementById('delayMix'),
            // Distortion
            distortionDrive: document.getElementById('distortionDrive'),
            distortionTone: document.getElementById('distortionTone'),
            distortionLevel: document.getElementById('distortionLevel'),
            // Filter
            filterFrequency: document.getElementById('filterFrequency'),
            filterQ: document.getElementById('filterQ'),
            // Compressor
            compressorThreshold: document.getElementById('compressorThreshold'),
            compressorRatio: document.getElementById('compressorRatio'),
            compressorAttack: document.getElementById('compressorAttack'),
            compressorRelease: document.getElementById('compressorRelease')
        };

        // Value displays
        this.valueDisplays = {
            reverbRoom: document.getElementById('reverbRoomValue'),
            reverbDecay: document.getElementById('reverbDecayValue'),
            reverbMix: document.getElementById('reverbMixValue'),
            delayTime: document.getElementById('delayTimeValue'),
            delayFeedback: document.getElementById('delayFeedbackValue'),
            delayMix: document.getElementById('delayMixValue'),
            distortionDrive: document.getElementById('distortionDriveValue'),
            distortionTone: document.getElementById('distortionToneValue'),
            distortionLevel: document.getElementById('distortionLevelValue'),
            filterFrequency: document.getElementById('filterFrequencyValue'),
            filterQ: document.getElementById('filterQValue'),
            compressorThreshold: document.getElementById('compressorThresholdValue'),
            compressorRatio: document.getElementById('compressorRatioValue'),
            compressorAttack: document.getElementById('compressorAttackValue'),
            compressorRelease: document.getElementById('compressorReleaseValue')
        };

        // Info elements
        this.activeEffects = document.getElementById('activeEffects');
        this.processingLoad = document.getElementById('processingLoad');
        this.latencyInfo = document.getElementById('latencyInfo');
        this.outputLevel = document.getElementById('outputLevel');

        // Export elements
        this.btnProcess = document.getElementById('btnProcess');
        this.btnDownload = document.getElementById('btnDownload');
        this.processedAudioPlayer = document.getElementById('processedAudioPlayer');
        this.processedAudioContainer = document.getElementById('processedAudioContainer');

        // Canvas
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.canvasContext = this.waveformCanvas.getContext('2d');

        // Sections
        this.effectsSection = document.getElementById('effectsSection');
        this.exportSection = document.getElementById('exportSection');
    }

    setupEventListeners() {
        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Control buttons
        this.btnPlay.addEventListener('click', () => this.playOriginal());
        this.btnStop.addEventListener('click', () => this.stop());
        this.btnPreview.addEventListener('click', () => this.previewEffects());
        this.btnExport.addEventListener('click', () => this.showExportSection());

        // Effect toggles
        Object.keys(this.effectToggles).forEach(effect => {
            this.effectToggles[effect].addEventListener('change', () => {
                this.updateEffectStatus();
                if (this.isPreviewMode) this.previewEffects();
            });
        });

        // Effect controls with value updates
        Object.keys(this.effectControls).forEach(control => {
            const element = this.effectControls[control];
            const display = this.valueDisplays[control];
            
            element.addEventListener('input', (e) => {
                this.updateValueDisplay(control, e.target.value);
                if (this.isPreviewMode) this.previewEffects();
            });
        });

        // Filter type radio buttons
        const filterTypes = document.querySelectorAll('input[name="filter-type"]');
        filterTypes.forEach(radio => {
            radio.addEventListener('change', () => {
                if (this.isPreviewMode) this.previewEffects();
            });
        });

        // Export buttons
        this.btnProcess.addEventListener('click', () => this.processAudio());
        this.btnDownload.addEventListener('click', () => this.downloadProcessedAudio());
    }

    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    }

    initializeEffects() {
        // Initialize value displays
        Object.keys(this.effectControls).forEach(control => {
            const element = this.effectControls[control];
            this.updateValueDisplay(control, element.value);
        });
        
        this.updateEffectStatus();
    }

    updateValueDisplay(control, value) {
        const display = this.valueDisplays[control];
        if (!display) return;

        switch (control) {
            case 'reverbDecay':
                display.textContent = `${value}s`;
                break;
            case 'reverbMix':
            case 'delayFeedback':
            case 'delayMix':
                display.textContent = `${Math.round(value * 100)}%`;
                break;
            case 'delayTime':
                display.textContent = `${value}ms`;
                break;
            case 'distortionTone':
            case 'filterFrequency':
                display.textContent = `${value}Hz`;
                break;
            case 'distortionLevel':
                display.textContent = `${Math.round(value * 100)}%`;
                break;
            case 'compressorThreshold':
                display.textContent = `${value}dB`;
                break;
            case 'compressorRatio':
                display.textContent = `${value}:1`;
                break;
            case 'compressorAttack':
                display.textContent = `${Math.round(value * 1000)}ms`;
                break;
            case 'compressorRelease':
                display.textContent = `${Math.round(value * 1000)}ms`;
                break;
            default:
                display.textContent = value;
        }
    }

    updateEffectStatus() {
        const activeCount = Object.values(this.effectToggles).filter(toggle => toggle.checked).length;
        this.activeEffects.textContent = activeCount;
        
        // Update processing load estimate
        let load = 'Low';
        if (activeCount >= 3) load = 'High';
        else if (activeCount >= 2) load = 'Medium';
        this.processingLoad.textContent = load;
        
        // Update latency estimate
        const latency = Math.max(5, activeCount * 2);
        this.latencyInfo.textContent = `~${latency}ms`;
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
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
        if (!file.type.startsWith('audio/')) {
            alert('Please select a valid audio file');
            return;
        }

        this.audioFile = file;
        this.uploadText.textContent = `File: ${file.name}`;
        this.fileInfo.textContent = `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`;

        try {
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.effectsSection.classList.remove('hidden');
            this.startVisualization();
            
        } catch (error) {
            console.error('Error processing audio file:', error);
            alert('Error processing audio file. Please try another file.');
        }
    }

    async buildEffectChain(destination) {
        let currentNode = this.sourceNode;
        const nodes = [];

        // Compressor (usually first in chain)
        if (this.effectToggles.compressor.checked) {
            const compressor = this.audioContext.createDynamicsCompressor();
            compressor.threshold.setValueAtTime(
                parseFloat(this.effectControls.compressorThreshold.value),
                this.audioContext.currentTime
            );
            compressor.ratio.setValueAtTime(
                parseFloat(this.effectControls.compressorRatio.value),
                this.audioContext.currentTime
            );
            compressor.attack.setValueAtTime(
                parseFloat(this.effectControls.compressorAttack.value),
                this.audioContext.currentTime
            );
            compressor.release.setValueAtTime(
                parseFloat(this.effectControls.compressorRelease.value),
                this.audioContext.currentTime
            );
            
            currentNode.connect(compressor);
            currentNode = compressor;
            nodes.push(compressor);
        }

        // Distortion
        if (this.effectToggles.distortion.checked) {
            const waveshaper = this.audioContext.createWaveShaper();
            const drive = parseFloat(this.effectControls.distortionDrive.value);
            waveshaper.curve = this.makeDistortionCurve(drive);
            waveshaper.oversample = '4x';
            
            // Tone control (low-pass filter)
            const toneFilter = this.audioContext.createBiquadFilter();
            toneFilter.type = 'lowpass';
            toneFilter.frequency.setValueAtTime(
                parseFloat(this.effectControls.distortionTone.value),
                this.audioContext.currentTime
            );
            
            // Output gain
            const outputGain = this.audioContext.createGain();
            outputGain.gain.setValueAtTime(
                parseFloat(this.effectControls.distortionLevel.value),
                this.audioContext.currentTime
            );
            
            currentNode.connect(waveshaper);
            waveshaper.connect(toneFilter);
            toneFilter.connect(outputGain);
            currentNode = outputGain;
            nodes.push(waveshaper, toneFilter, outputGain);
        }

        // Filter
        if (this.effectToggles.filter.checked) {
            const filter = this.audioContext.createBiquadFilter();
            const filterType = document.querySelector('input[name="filter-type"]:checked').value;
            filter.type = filterType;
            filter.frequency.setValueAtTime(
                parseFloat(this.effectControls.filterFrequency.value),
                this.audioContext.currentTime
            );
            filter.Q.setValueAtTime(
                parseFloat(this.effectControls.filterQ.value),
                this.audioContext.currentTime
            );
            
            currentNode.connect(filter);
            currentNode = filter;
            nodes.push(filter);
        }

        // Delay
        if (this.effectToggles.delay.checked) {
            const delayTime = parseFloat(this.effectControls.delayTime.value) / 1000;
            const feedback = parseFloat(this.effectControls.delayFeedback.value);
            const mix = parseFloat(this.effectControls.delayMix.value);
            
            const delay = this.audioContext.createDelay(2);
            delay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);
            
            const delayFeedback = this.audioContext.createGain();
            delayFeedback.gain.setValueAtTime(feedback, this.audioContext.currentTime);
            
            const delayMix = this.audioContext.createGain();
            delayMix.gain.setValueAtTime(mix, this.audioContext.currentTime);
            
            const dryMix = this.audioContext.createGain();
            dryMix.gain.setValueAtTime(1 - mix, this.audioContext.currentTime);
            
            const delayOutput = this.audioContext.createGain();
            
            // Connect delay chain
            currentNode.connect(dryMix);
            currentNode.connect(delay);
            delay.connect(delayFeedback);
            delayFeedback.connect(delay); // Feedback loop
            delay.connect(delayMix);
            
            dryMix.connect(delayOutput);
            delayMix.connect(delayOutput);
            
            currentNode = delayOutput;
            nodes.push(delay, delayFeedback, delayMix, dryMix, delayOutput);
        }

        // Reverb (usually last)
        if (this.effectToggles.reverb.checked) {
            const reverbNode = await this.createReverbNode();
            const reverbMix = parseFloat(this.effectControls.reverbMix.value);
            
            const wetGain = this.audioContext.createGain();
            wetGain.gain.setValueAtTime(reverbMix, this.audioContext.currentTime);
            
            const dryGain = this.audioContext.createGain();
            dryGain.gain.setValueAtTime(1 - reverbMix, this.audioContext.currentTime);
            
            const reverbOutput = this.audioContext.createGain();
            
            currentNode.connect(dryGain);
            currentNode.connect(reverbNode);
            reverbNode.connect(wetGain);
            
            dryGain.connect(reverbOutput);
            wetGain.connect(reverbOutput);
            
            currentNode = reverbOutput;
            nodes.push(reverbNode, wetGain, dryGain, reverbOutput);
        }

        // Connect to destination
        currentNode.connect(destination);
        
        return nodes;
    }

    async createReverbNode() {
        const roomSize = parseFloat(this.effectControls.reverbRoom.value);
        const decayTime = parseFloat(this.effectControls.reverbDecay.value);
        
        // Create impulse response for convolution reverb
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * decayTime;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, decayTime);
                channelData[i] = (Math.random() * 2 - 1) * decay * roomSize;
            }
        }
        
        const convolver = this.audioContext.createConvolver();
        convolver.buffer = impulse;
        return convolver;
    }

    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        
        return curve;
    }

    async playOriginal() {
        if (!this.audioBuffer) return;

        this.stop();
        
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        this.sourceNode.onended = () => {
            this.isPlaying = false;
            this.isPreviewMode = false;
            this.updatePlayButtons();
        };

        this.sourceNode.start();
        this.isPlaying = true;
        this.isPreviewMode = false;
        this.updatePlayButtons();
    }

    async previewEffects() {
        if (!this.audioBuffer) return;

        this.stop();

        try {
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            
            // Build effect chain
            const effectNodes = await this.buildEffectChain(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.sourceNode.onended = () => {
                this.isPlaying = false;
                this.isPreviewMode = false;
                this.updatePlayButtons();
                // Clean up effect nodes
                effectNodes.forEach(node => {
                    if (node.disconnect) node.disconnect();
                });
            };

            this.sourceNode.start();
            this.isPlaying = true;
            this.isPreviewMode = true;
            this.updatePlayButtons();
            
        } catch (error) {
            console.error('Error previewing effects:', error);
        }
    }

    stop() {
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode = null;
        }
        this.isPlaying = false;
        this.isPreviewMode = false;
        this.updatePlayButtons();
    }

    updatePlayButtons() {
        this.btnPlay.textContent = this.isPlaying && !this.isPreviewMode ? '⏸️ Pause' : '▶️ Play Original';
        this.btnPreview.textContent = this.isPlaying && this.isPreviewMode ? '⏸️ Stop Preview' : '🔊 Preview Effects';
        this.btnStop.disabled = !this.isPlaying;
    }

    startVisualization() {
        const draw = () => {
            if (!this.analyser) return;
            
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.analyser.getByteFrequencyData(dataArray);
            
            const canvas = this.waveformCanvas;
            const ctx = this.canvasContext;
            const width = canvas.width;
            const height = canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            // Draw frequency spectrum
            const barWidth = width / bufferLength * 2.5;
            let barHeight;
            let x = 0;
            
            // Create gradient
            const gradient = ctx.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, '#3498db');
            gradient.addColorStop(0.5, '#2ecc71');
            gradient.addColorStop(1, '#e74c3c');
            
            ctx.fillStyle = gradient;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height * 0.8;
                
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
            
            this.visualizationId = requestAnimationFrame(draw);
        };
        
        draw();
    }

    showExportSection() {
        this.exportSection.classList.remove('hidden');
        this.exportSection.scrollIntoView({ behavior: 'smooth' });
    }

    async processAudio() {
        if (!this.audioBuffer) return;

        this.btnProcess.disabled = true;
        this.btnProcess.textContent = '⏳ Processing...';

        try {
            // Create offline context for processing
            const offlineContext = new OfflineAudioContext(
                this.audioBuffer.numberOfChannels,
                this.audioBuffer.length,
                this.audioBuffer.sampleRate
            );

            const offlineSource = offlineContext.createBufferSource();
            offlineSource.buffer = this.audioBuffer;

            // Build effect chain for offline processing
            let currentNode = offlineSource;
            
            // Apply effects in the same order as real-time
            if (this.effectToggles.compressor.checked) {
                const compressor = offlineContext.createDynamicsCompressor();
                compressor.threshold.setValueAtTime(
                    parseFloat(this.effectControls.compressorThreshold.value), 0
                );
                compressor.ratio.setValueAtTime(
                    parseFloat(this.effectControls.compressorRatio.value), 0
                );
                compressor.attack.setValueAtTime(
                    parseFloat(this.effectControls.compressorAttack.value), 0
                );
                compressor.release.setValueAtTime(
                    parseFloat(this.effectControls.compressorRelease.value), 0
                );
                currentNode.connect(compressor);
                currentNode = compressor;
            }

            // Add other effects similarly...
            currentNode.connect(offlineContext.destination);
            offlineSource.start();

            this.processedBuffer = await offlineContext.startRendering();
            
            // Create audio blob and URL for preview
            const audioBlob = await this.bufferToWav(this.processedBuffer);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.processedAudioPlayer.src = audioUrl;
            this.processedAudioContainer.classList.remove('hidden');
            this.btnDownload.classList.remove('hidden');
            
            // Update stats
            this.updateProcessedStats(audioBlob);
            
        } catch (error) {
            console.error('Error processing audio:', error);
            alert('Error processing audio. Please try again.');
        } finally {
            this.btnProcess.disabled = false;
            this.btnProcess.textContent = '🔄 Process Audio';
        }
    }

    updateProcessedStats(audioBlob) {
        const duration = this.processedBuffer.duration;
        const size = (audioBlob.size / (1024 * 1024)).toFixed(2);
        const activeEffectsList = Object.keys(this.effectToggles)
            .filter(effect => this.effectToggles[effect].checked)
            .join(', ');
        
        document.getElementById('processedDuration').textContent = this.formatTime(duration);
        document.getElementById('processedSize').textContent = `${size} MB`;
        document.getElementById('processedEffects').textContent = activeEffectsList || 'None';
        
        // Calculate peak level
        let peak = 0;
        for (let channel = 0; channel < this.processedBuffer.numberOfChannels; channel++) {
            const data = this.processedBuffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                peak = Math.max(peak, Math.abs(data[i]));
            }
        }
        document.getElementById('processedPeak').textContent = `${(20 * Math.log10(peak)).toFixed(1)} dB`;
    }

    async downloadProcessedAudio() {
        if (!this.processedBuffer) return;

        try {
            const audioBlob = await this.bufferToWav(this.processedBuffer);
            const url = URL.createObjectURL(audioBlob);
            
            const activeEffects = Object.keys(this.effectToggles)
                .filter(effect => this.effectToggles[effect].checked)
                .join('_');
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.audioFile.name.split('.')[0]}_effects_${activeEffects || 'processed'}.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading audio:', error);
            alert('Error downloading audio. Please try again.');
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

        // Convert samples
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize the audio effects when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AudioEffects();
});
