class SpeedChanger {
    constructor() {
        this.audioFile = null;
        this.audioBuffer = null;
        this.audioContext = null;
        this.sourceNode = null;
        this.isPlaying = false;
        this.currentSpeed = 1.0;
        this.currentPitch = 0; // in semitones
        this.processedBuffer = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudioContext();
    }

    initializeElements() {
        // Upload elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadText = document.getElementById('uploadText');
        this.fileInfo = document.getElementById('fileInfo');

        // Speed control elements
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.speedPresets = document.querySelectorAll('.speed-preset');

        // Pitch control elements
        this.pitchSlider = document.getElementById('pitchSlider');
        this.pitchValue = document.getElementById('pitchValue');
        this.pitchPresets = document.querySelectorAll('.pitch-preset');

        // Mode elements
        this.processingModes = document.querySelectorAll('input[name="processing-mode"]');

        // Control buttons
        this.btnPlay = document.getElementById('btnPlay');
        this.btnStop = document.getElementById('btnStop');
        this.btnPlayModified = document.getElementById('btnPlayModified');
        this.btnExport = document.getElementById('btnExport');

        // Info elements
        this.originalDuration = document.getElementById('originalDuration');
        this.originalSample = document.getElementById('originalSample');
        this.newDuration = document.getElementById('newDuration');
        this.newSample = document.getElementById('newSample');
        this.effectiveSpeed = document.getElementById('effectiveSpeed');
        this.effectivePitch = document.getElementById('effectivePitch');

        // Export elements
        this.btnProcess = document.getElementById('btnProcess');
        this.btnDownload = document.getElementById('btnDownload');
        this.processedAudioPlayer = document.getElementById('processedAudioPlayer');

        // Sections
        this.speedSection = document.getElementById('speedSection');
        this.exportSection = document.getElementById('exportSection');
    }

    setupEventListeners() {
        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Speed controls
        this.speedSlider.addEventListener('input', (e) => this.updateSpeed(parseFloat(e.target.value)));
        this.speedPresets.forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseFloat(btn.dataset.speed);
                this.updateSpeed(speed);
                this.speedSlider.value = speed;
            });
        });

        // Pitch controls
        this.pitchSlider.addEventListener('input', (e) => this.updatePitch(parseFloat(e.target.value)));
        this.pitchPresets.forEach(btn => {
            btn.addEventListener('click', () => {
                const pitch = parseFloat(btn.dataset.pitch);
                this.updatePitch(pitch);
                this.pitchSlider.value = pitch;
            });
        });

        // Mode selection
        this.processingModes.forEach(radio => {
            radio.addEventListener('change', () => this.updatePreviewInfo());
        });

        // Control buttons
        this.btnPlay.addEventListener('click', () => this.playOriginal());
        this.btnStop.addEventListener('click', () => this.stop());
        this.btnPlayModified.addEventListener('click', () => this.playModified());
        this.btnExport.addEventListener('click', () => this.showExportSection());

        // Export buttons
        this.btnProcess.addEventListener('click', () => this.processAudio());
        this.btnDownload.addEventListener('click', () => this.downloadProcessedAudio());
    }

    async initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
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
            
            this.updateOriginalInfo();
            this.updatePreviewInfo();
            this.speedSection.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error processing audio file:', error);
            alert('Error processing audio file. Please try another file.');
        }
    }

    updateOriginalInfo() {
        if (!this.audioBuffer) return;

        const duration = this.audioBuffer.duration;
        const sampleRate = this.audioBuffer.sampleRate;

        this.originalDuration.textContent = this.formatTime(duration);
        this.originalSample.textContent = `${sampleRate} Hz`;
    }

    updateSpeed(speed) {
        this.currentSpeed = speed;
        this.speedValue.textContent = `${speed.toFixed(2)}x`;
        this.updateSpeedPresets();
        this.updatePreviewInfo();
    }

    updatePitch(pitch) {
        this.currentPitch = pitch;
        this.pitchValue.textContent = pitch > 0 ? `+${pitch}` : `${pitch}`;
        this.updatePitchPresets();
        this.updatePreviewInfo();
    }

    updateSpeedPresets() {
        this.speedPresets.forEach(btn => {
            const presetSpeed = parseFloat(btn.dataset.speed);
            btn.classList.toggle('active', Math.abs(presetSpeed - this.currentSpeed) < 0.01);
        });
    }

    updatePitchPresets() {
        this.pitchPresets.forEach(btn => {
            const presetPitch = parseFloat(btn.dataset.pitch);
            btn.classList.toggle('active', Math.abs(presetPitch - this.currentPitch) < 0.01);
        });
    }

    updatePreviewInfo() {
        if (!this.audioBuffer) return;

        const mode = document.querySelector('input[name="processing-mode"]:checked').value;
        const originalDuration = this.audioBuffer.duration;
        
        let newDuration, effectiveSpeed, effectivePitch;

        if (mode === 'independent') {
            // Independent speed and pitch control
            newDuration = originalDuration / this.currentSpeed;
            effectiveSpeed = this.currentSpeed;
            effectivePitch = this.currentPitch;
        } else if (mode === 'preserve-pitch') {
            // Speed change while preserving pitch
            newDuration = originalDuration / this.currentSpeed;
            effectiveSpeed = this.currentSpeed;
            effectivePitch = 0; // Pitch preserved
        } else {
            // Classic mode (speed affects pitch)
            newDuration = originalDuration / this.currentSpeed;
            effectiveSpeed = this.currentSpeed;
            effectivePitch = this.currentPitch + (this.speedToPitchChange(this.currentSpeed));
        }

        this.newDuration.textContent = this.formatTime(newDuration);
        this.newSample.textContent = `${this.audioBuffer.sampleRate} Hz`;
        this.effectiveSpeed.textContent = `${effectiveSpeed.toFixed(2)}x`;
        this.effectivePitch.textContent = effectivePitch > 0 ? `+${effectivePitch.toFixed(1)}` : `${effectivePitch.toFixed(1)}`;
    }

    speedToPitchChange(speed) {
        // Convert speed ratio to semitones
        return 12 * Math.log2(speed);
    }

    async playOriginal() {
        if (!this.audioBuffer) return;

        this.stop();
        
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.connect(this.audioContext.destination);
        
        this.sourceNode.onended = () => {
            this.isPlaying = false;
            this.updatePlayButtons();
        };

        this.sourceNode.start();
        this.isPlaying = true;
        this.updatePlayButtons();
    }

    async playModified() {
        if (!this.audioBuffer) return;

        this.stop();

        try {
            const modifiedBuffer = await this.createModifiedBuffer();
            
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = modifiedBuffer;
            this.sourceNode.connect(this.audioContext.destination);
            
            this.sourceNode.onended = () => {
                this.isPlaying = false;
                this.updatePlayButtons();
            };

            this.sourceNode.start();
            this.isPlaying = true;
            this.updatePlayButtons();
        } catch (error) {
            console.error('Error playing modified audio:', error);
        }
    }

    stop() {
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode = null;
        }
        this.isPlaying = false;
        this.updatePlayButtons();
    }

    updatePlayButtons() {
        this.btnPlay.textContent = this.isPlaying ? '⏸️ Pause' : '▶️ Play Original';
        this.btnPlayModified.disabled = this.isPlaying;
    }

    async createModifiedBuffer() {
        const mode = document.querySelector('input[name="processing-mode"]:checked').value;
        
        if (mode === 'independent') {
            return await this.createIndependentSpeedPitchBuffer();
        } else if (mode === 'preserve-pitch') {
            return await this.createPreservePitchBuffer();
        } else {
            return await this.createClassicSpeedBuffer();
        }
    }

    async createClassicSpeedBuffer() {
        // Classic speed change (affects pitch naturally)
        const outputLength = Math.floor(this.audioBuffer.length / this.currentSpeed);
        const outputBuffer = this.audioContext.createBuffer(
            this.audioBuffer.numberOfChannels,
            outputLength,
            this.audioBuffer.sampleRate
        );

        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
            const inputData = this.audioBuffer.getChannelData(channel);
            const outputData = outputBuffer.getChannelData(channel);

            for (let i = 0; i < outputLength; i++) {
                const sourceIndex = i * this.currentSpeed;
                const index = Math.floor(sourceIndex);
                const fraction = sourceIndex - index;

                if (index < inputData.length - 1) {
                    // Linear interpolation
                    outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
                } else if (index < inputData.length) {
                    outputData[i] = inputData[index];
                }
            }
        }

        // Apply pitch shift if needed
        if (this.currentPitch !== 0) {
            return await this.applyPitchShift(outputBuffer, this.currentPitch);
        }

        return outputBuffer;
    }

    async createPreservePitchBuffer() {
        // Time-stretch while preserving pitch
        const pitchShiftRatio = Math.pow(2, this.currentPitch / 12);
        const stretchRatio = this.currentSpeed * pitchShiftRatio;
        
        return await this.timeStretchWithPitchPreservation(this.audioBuffer, stretchRatio);
    }

    async createIndependentSpeedPitchBuffer() {
        // Independent speed and pitch control
        let buffer = await this.timeStretchWithPitchPreservation(this.audioBuffer, this.currentSpeed);
        
        if (this.currentPitch !== 0) {
            buffer = await this.applyPitchShift(buffer, this.currentPitch);
        }
        
        return buffer;
    }

    async timeStretchWithPitchPreservation(inputBuffer, ratio) {
        // Simplified time-stretching algorithm (PSOLA-like)
        const frameSize = 2048;
        const hopSize = frameSize / 4;
        const outputLength = Math.floor(inputBuffer.length / ratio);
        
        const outputBuffer = this.audioContext.createBuffer(
            inputBuffer.numberOfChannels,
            outputLength,
            inputBuffer.sampleRate
        );

        for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
            const inputData = inputBuffer.getChannelData(channel);
            const outputData = outputBuffer.getChannelData(channel);
            
            for (let outputPos = 0; outputPos < outputLength - frameSize; outputPos += hopSize) {
                const inputPos = outputPos * ratio;
                const inputIndex = Math.floor(inputPos);
                
                if (inputIndex + frameSize < inputData.length) {
                    // Copy frame with overlap-add
                    for (let i = 0; i < frameSize; i++) {
                        if (outputPos + i < outputLength) {
                            const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / frameSize));
                            outputData[outputPos + i] += inputData[inputIndex + i] * window;
                        }
                    }
                }
            }
        }

        return outputBuffer;
    }

    async applyPitchShift(inputBuffer, semitones) {
        const pitchRatio = Math.pow(2, semitones / 12);
        const outputLength = Math.floor(inputBuffer.length / pitchRatio);
        
        const outputBuffer = this.audioContext.createBuffer(
            inputBuffer.numberOfChannels,
            outputLength,
            inputBuffer.sampleRate
        );

        for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
            const inputData = inputBuffer.getChannelData(channel);
            const outputData = outputBuffer.getChannelData(channel);

            for (let i = 0; i < outputLength; i++) {
                const sourceIndex = i * pitchRatio;
                const index = Math.floor(sourceIndex);
                const fraction = sourceIndex - index;

                if (index < inputData.length - 1) {
                    outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
                } else if (index < inputData.length) {
                    outputData[i] = inputData[index];
                }
            }
        }

        return outputBuffer;
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
            this.processedBuffer = await this.createModifiedBuffer();
            
            // Create audio blob and URL for preview
            const audioBlob = await this.bufferToWav(this.processedBuffer);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.processedAudioPlayer.src = audioUrl;
            this.processedAudioPlayer.classList.remove('hidden');
            this.btnDownload.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error processing audio:', error);
            alert('Error processing audio. Please try again.');
        } finally {
            this.btnProcess.disabled = false;
            this.btnProcess.textContent = '🔄 Process Audio';
        }
    }

    async downloadProcessedAudio() {
        if (!this.processedBuffer) return;

        try {
            const audioBlob = await this.bufferToWav(this.processedBuffer);
            const url = URL.createObjectURL(audioBlob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.audioFile.name.split('.')[0]}_speed_${this.currentSpeed}x_pitch_${this.currentPitch}.wav`;
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

// Initialize the speed changer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SpeedChanger();
});
