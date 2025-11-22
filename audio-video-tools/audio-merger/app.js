class AudioMerger {
    constructor() {
        this.audioFiles = [];
        this.audioBuffers = [];
        this.audioContext = null;
        this.isPlaying = false;
        this.currentSource = null;
        this.mergedBuffer = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudioContext();
    }

    initializeElements() {
        // Upload elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.uploadText = document.getElementById('uploadText');
        this.fileCount = document.getElementById('fileCount');
        this.btnAddMore = document.getElementById('btnAddMore');
        this.btnClearAll = document.getElementById('btnClearAll');

        // Track list elements
        this.tracksContainer = document.getElementById('tracksContainer');
        this.trackStats = document.getElementById('trackStats');

        // Merge control elements
        this.mergeMode = document.querySelectorAll('input[name="merge-mode"]');
        this.crossfadeSlider = document.getElementById('crossfadeSlider');
        this.crossfadeValue = document.getElementById('crossfadeValue');
        this.totalVolumeSlider = document.getElementById('totalVolumeSlider');
        this.totalVolumeValue = document.getElementById('totalVolumeValue');

        // Control buttons
        this.btnPlayAll = document.getElementById('btnPlayAll');
        this.btnStop = document.getElementById('btnStop');
        this.btnSnapshot = document.getElementById('btnSnapshot');

        // Export elements
        this.btnProcess = document.getElementById('btnProcess');
        this.btnDownload = document.getElementById('btnDownload');
        this.processedAudioPlayer = document.getElementById('processedAudioPlayer');

        // Sections
        this.tracklistSection = document.getElementById('tracklistSection');
        this.mergeSection = document.getElementById('mergeSection');
        this.exportSection = document.getElementById('exportSection');
    }

    setupEventListeners() {
        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.btnAddMore.addEventListener('click', () => this.fileInput.click());
        this.btnClearAll.addEventListener('click', () => this.clearAllTracks());

        // Merge controls
        this.crossfadeSlider.addEventListener('input', (e) => {
            this.crossfadeValue.textContent = `${e.target.value}ms`;
        });

        this.totalVolumeSlider.addEventListener('input', (e) => {
            this.totalVolumeValue.textContent = `${e.target.value}%`;
        });

        // Control buttons
        this.btnPlayAll.addEventListener('click', () => this.playAllTracks());
        this.btnStop.addEventListener('click', () => this.stop());
        this.btnSnapshot.addEventListener('click', () => this.takeSnapshot());

        // Export buttons
        this.btnProcess.addEventListener('click', () => this.processMergedAudio());
        this.btnDownload.addEventListener('click', () => this.downloadMergedAudio());
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
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
        e.target.value = ''; // Reset input
    }

    async processFiles(files) {
        const audioFiles = files.filter(file => file.type.startsWith('audio/'));
        
        if (audioFiles.length === 0) {
            alert('Please select valid audio files');
            return;
        }

        for (const file of audioFiles) {
            await this.addAudioFile(file);
        }

        this.updateUI();
    }

    async addAudioFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            const trackData = {
                id: Date.now() + Math.random(),
                file: file,
                buffer: audioBuffer,
                name: file.name,
                duration: audioBuffer.duration,
                volume: 1.0,
                delay: 0,
                enabled: true
            };

            this.audioFiles.push(trackData);
            this.audioBuffers.push(audioBuffer);
            
            this.renderTrackItem(trackData);
            
        } catch (error) {
            console.error('Error processing audio file:', error);
            alert(`Error processing ${file.name}. Please try another file.`);
        }
    }

    renderTrackItem(track) {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        trackItem.dataset.trackId = track.id;

        trackItem.innerHTML = `
            <div class="track-info">
                <div class="track-name">${track.name}</div>
                <div class="track-duration">${this.formatTime(track.duration)}</div>
            </div>
            <div class="track-settings">
                <div class="setting-group">
                    <label>Volume</label>
                    <input type="range" min="0" max="2" step="0.1" value="${track.volume}" 
                           class="volume-slider" data-track-id="${track.id}">
                    <span class="volume-value">${Math.round(track.volume * 100)}%</span>
                </div>
                <div class="setting-group">
                    <label>Delay (s)</label>
                    <input type="number" min="0" max="60" step="0.1" value="${track.delay}" 
                           class="delay-input" data-track-id="${track.id}">
                </div>
            </div>
            <div class="track-controls">
                <button class="btn-track-play" data-track-id="${track.id}">▶️</button>
                <button class="btn-track-move-up" data-track-id="${track.id}">⬆️</button>
                <button class="btn-track-move-down" data-track-id="${track.id}">⬇️</button>
                <button class="btn-track-remove" data-track-id="${track.id}">🗑️</button>
            </div>
        `;

        this.tracksContainer.appendChild(trackItem);

        // Add event listeners for track controls
        const volumeSlider = trackItem.querySelector('.volume-slider');
        const volumeValue = trackItem.querySelector('.volume-value');
        const delayInput = trackItem.querySelector('.delay-input');
        const playBtn = trackItem.querySelector('.btn-track-play');
        const moveUpBtn = trackItem.querySelector('.btn-track-move-up');
        const moveDownBtn = trackItem.querySelector('.btn-track-move-down');
        const removeBtn = trackItem.querySelector('.btn-track-remove');

        volumeSlider.addEventListener('input', (e) => {
            track.volume = parseFloat(e.target.value);
            volumeValue.textContent = `${Math.round(track.volume * 100)}%`;
        });

        delayInput.addEventListener('input', (e) => {
            track.delay = parseFloat(e.target.value) || 0;
        });

        playBtn.addEventListener('click', () => this.playTrack(track.id));
        moveUpBtn.addEventListener('click', () => this.moveTrack(track.id, -1));
        moveDownBtn.addEventListener('click', () => this.moveTrack(track.id, 1));
        removeBtn.addEventListener('click', () => this.removeTrack(track.id));
    }

    updateUI() {
        if (this.audioFiles.length === 0) {
            this.uploadText.textContent = 'Click to upload audio files or drag & drop here';
            this.fileCount.textContent = '';
            this.tracklistSection.classList.add('hidden');
            this.mergeSection.classList.add('hidden');
            this.exportSection.classList.add('hidden');
        } else {
            this.uploadText.innerHTML = '<strong>Add more audio files</strong>';
            this.fileCount.textContent = `${this.audioFiles.length} file(s) loaded`;
            this.tracklistSection.classList.remove('hidden');
            this.mergeSection.classList.remove('hidden');
            
            this.updateTrackStats();
        }
    }

    updateTrackStats() {
        const totalDuration = Math.max(...this.audioFiles.map((track, index) => 
            track.duration + track.delay
        ));
        const totalFiles = this.audioFiles.length;
        const totalSize = this.audioFiles.reduce((sum, track) => sum + track.file.size, 0);

        this.trackStats.innerHTML = `
            <div class="stat-item">
                <span>Total Tracks</span>
                <span>${totalFiles}</span>
            </div>
            <div class="stat-item">
                <span>Total Duration</span>
                <span>${this.formatTime(totalDuration)}</span>
            </div>
            <div class="stat-item">
                <span>Total Size</span>
                <span>${(totalSize / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
        `;
    }

    async playTrack(trackId) {
        const track = this.audioFiles.find(t => t.id === trackId);
        if (!track) return;

        this.stop();

        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = track.buffer;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(track.volume, this.audioContext.currentTime);
        
        this.currentSource.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        this.currentSource.onended = () => {
            this.isPlaying = false;
            this.updatePlayButtons();
        };

        this.currentSource.start();
        this.isPlaying = true;
        this.updatePlayButtons();
    }

    async playAllTracks() {
        if (this.audioFiles.length === 0) return;

        this.stop();

        try {
            const mergedBuffer = await this.createMergedBuffer();
            
            this.currentSource = this.audioContext.createBufferSource();
            this.currentSource.buffer = mergedBuffer;
            this.currentSource.connect(this.audioContext.destination);
            
            this.currentSource.onended = () => {
                this.isPlaying = false;
                this.updatePlayButtons();
            };

            this.currentSource.start();
            this.isPlaying = true;
            this.updatePlayButtons();
            
        } catch (error) {
            console.error('Error playing merged audio:', error);
        }
    }

    stop() {
        if (this.currentSource) {
            this.currentSource.stop();
            this.currentSource = null;
        }
        this.isPlaying = false;
        this.updatePlayButtons();
    }

    updatePlayButtons() {
        this.btnPlayAll.textContent = this.isPlaying ? '⏸️ Stop Preview' : '▶️ Play All';
        this.btnStop.disabled = !this.isPlaying;
    }

    moveTrack(trackId, direction) {
        const currentIndex = this.audioFiles.findIndex(t => t.id === trackId);
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.audioFiles.length) {
            // Swap tracks
            [this.audioFiles[currentIndex], this.audioFiles[newIndex]] = 
            [this.audioFiles[newIndex], this.audioFiles[currentIndex]];
            
            // Re-render track list
            this.tracksContainer.innerHTML = '';
            this.audioFiles.forEach(track => this.renderTrackItem(track));
        }
    }

    removeTrack(trackId) {
        this.audioFiles = this.audioFiles.filter(t => t.id !== trackId);
        this.audioBuffers = this.audioFiles.map(t => t.buffer);
        
        // Remove from DOM
        const trackElement = this.tracksContainer.querySelector(`[data-track-id="${trackId}"]`);
        if (trackElement) {
            trackElement.remove();
        }
        
        this.updateUI();
    }

    clearAllTracks() {
        this.audioFiles = [];
        this.audioBuffers = [];
        this.tracksContainer.innerHTML = '';
        this.updateUI();
    }

    async createMergedBuffer() {
        if (this.audioFiles.length === 0) return null;

        const mode = document.querySelector('input[name="merge-mode"]:checked').value;
        const crossfadeDuration = parseFloat(this.crossfadeSlider.value) / 1000; // Convert to seconds
        const totalVolume = parseFloat(this.totalVolumeSlider.value) / 100;

        if (mode === 'sequential') {
            return await this.createSequentialMerge(crossfadeDuration, totalVolume);
        } else {
            return await this.createOverlayMerge(totalVolume);
        }
    }

    async createSequentialMerge(crossfadeDuration, totalVolume) {
        // Calculate total length
        let totalLength = 0;
        for (const track of this.audioFiles) {
            totalLength += track.buffer.length;
            if (crossfadeDuration > 0 && totalLength > 0) {
                totalLength -= Math.floor(crossfadeDuration * track.buffer.sampleRate);
            }
        }

        const sampleRate = this.audioFiles[0].buffer.sampleRate;
        const numberOfChannels = Math.max(...this.audioFiles.map(t => t.buffer.numberOfChannels));
        
        const mergedBuffer = this.audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);

        let currentPosition = 0;
        for (let trackIndex = 0; trackIndex < this.audioFiles.length; trackIndex++) {
            const track = this.audioFiles[trackIndex];
            const trackBuffer = track.buffer;
            
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const mergedData = mergedBuffer.getChannelData(channel);
                const trackData = channel < trackBuffer.numberOfChannels ? 
                    trackBuffer.getChannelData(channel) : 
                    new Float32Array(trackBuffer.length);

                for (let i = 0; i < trackBuffer.length; i++) {
                    if (currentPosition + i < totalLength) {
                        let sample = trackData[i] * track.volume * totalVolume;

                        // Apply crossfade
                        if (crossfadeDuration > 0) {
                            const fadeInSamples = Math.floor(crossfadeDuration * sampleRate);
                            const fadeOutSamples = Math.floor(crossfadeDuration * sampleRate);

                            // Fade in at start of track
                            if (trackIndex > 0 && i < fadeInSamples) {
                                const fadeInGain = i / fadeInSamples;
                                sample *= fadeInGain;
                            }

                            // Fade out at end of track
                            if (trackIndex < this.audioFiles.length - 1 && i >= trackBuffer.length - fadeOutSamples) {
                                const fadeOutGain = (trackBuffer.length - i) / fadeOutSamples;
                                sample *= fadeOutGain;
                            }
                        }

                        mergedData[currentPosition + i] = sample;
                    }
                }
            }

            currentPosition += trackBuffer.length;
            if (crossfadeDuration > 0 && trackIndex < this.audioFiles.length - 1) {
                currentPosition -= Math.floor(crossfadeDuration * sampleRate);
            }
        }

        return mergedBuffer;
    }

    async createOverlayMerge(totalVolume) {
        // Find the maximum duration considering delays
        const maxDuration = Math.max(...this.audioFiles.map(track => 
            track.duration + track.delay
        ));
        
        const sampleRate = this.audioFiles[0].buffer.sampleRate;
        const numberOfChannels = Math.max(...this.audioFiles.map(t => t.buffer.numberOfChannels));
        const totalSamples = Math.floor(maxDuration * sampleRate);
        
        const mergedBuffer = this.audioContext.createBuffer(numberOfChannels, totalSamples, sampleRate);

        // Initialize with silence
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const mergedData = mergedBuffer.getChannelData(channel);
            mergedData.fill(0);
        }

        // Mix all tracks
        for (const track of this.audioFiles) {
            const delayInSamples = Math.floor(track.delay * sampleRate);
            
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const mergedData = mergedBuffer.getChannelData(channel);
                const trackData = channel < track.buffer.numberOfChannels ? 
                    track.buffer.getChannelData(channel) : 
                    new Float32Array(track.buffer.length);

                for (let i = 0; i < track.buffer.length; i++) {
                    const outputIndex = delayInSamples + i;
                    if (outputIndex < totalSamples) {
                        mergedData[outputIndex] += trackData[i] * track.volume * totalVolume;
                    }
                }
            }
        }

        // Apply limiting to prevent clipping
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const data = mergedBuffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.max(-1, Math.min(1, data[i]));
            }
        }

        return mergedBuffer;
    }

    takeSnapshot() {
        this.exportSection.classList.remove('hidden');
        this.exportSection.scrollIntoView({ behavior: 'smooth' });
    }

    async processMergedAudio() {
        if (this.audioFiles.length === 0) return;

        this.btnProcess.disabled = true;
        this.btnProcess.textContent = '⏳ Merging...';

        try {
            this.mergedBuffer = await this.createMergedBuffer();
            
            // Create audio blob and URL for preview
            const audioBlob = await this.bufferToWav(this.mergedBuffer);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.processedAudioPlayer.src = audioUrl;
            this.processedAudioPlayer.classList.remove('hidden');
            this.btnDownload.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error merging audio:', error);
            alert('Error merging audio. Please try again.');
        } finally {
            this.btnProcess.disabled = false;
            this.btnProcess.textContent = '🎵 Merge Audio';
        }
    }

    async downloadMergedAudio() {
        if (!this.mergedBuffer) return;

        try {
            const audioBlob = await this.bufferToWav(this.mergedBuffer);
            const url = URL.createObjectURL(audioBlob);
            
            const a = document.createElement('a');
            a.href = url;
            const mode = document.querySelector('input[name="merge-mode"]:checked').value;
            a.download = `merged_audio_${mode}_${this.audioFiles.length}_tracks.wav`;
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

// Initialize the audio merger when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AudioMerger();
});
