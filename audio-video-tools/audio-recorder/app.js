// Audio Recorder App - MediaRecorder API Implementation
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioChunks = [];
        this.recordings = [];
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = null;
        this.pauseTime = 0;
        this.timerInterval = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.levelMeterAnimationId = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadMicrophones();
        this.loadSettings();
    }

    initializeElements() {
        // Control buttons
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        
        // Status and display
        this.recordingStatus = document.getElementById('recordingStatus');
        this.recordingTimer = document.getElementById('recordingTimer');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.levelBar = document.getElementById('levelBar');
        
        // Settings
        this.qualitySelect = document.getElementById('qualitySelect');
        this.formatSelect = document.getElementById('formatSelect');
        this.micSelect = document.getElementById('micSelect');
        this.noiseSuppression = document.getElementById('noiseSuppression');
        this.echoCancellation = document.getElementById('echoCancellation');
        
        // Recordings list
        this.recordingsList = document.getElementById('recordingsList');
    }

    attachEventListeners() {
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.clearAllBtn.addEventListener('click', () => this.clearAllRecordings());
        
        // Settings change listeners
        this.qualitySelect.addEventListener('change', () => this.saveSettings());
        this.formatSelect.addEventListener('change', () => this.saveSettings());
        this.micSelect.addEventListener('change', () => this.saveSettings());
        this.noiseSuppression.addEventListener('change', () => this.saveSettings());
        this.echoCancellation.addEventListener('change', () => this.saveSettings());
    }

    async loadMicrophones() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(device => device.kind === 'audioinput');
            
            // Clear existing options except default
            while (this.micSelect.children.length > 1) {
                this.micSelect.removeChild(this.micSelect.lastChild);
            }
            
            audioInputs.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Microphone ${this.micSelect.children.length}`;
                this.micSelect.appendChild(option);
            });
        } catch (error) {
            console.warn('Could not enumerate audio devices:', error);
        }
    }

    getAudioConstraints() {
        const quality = this.qualitySelect.value;
        const deviceId = this.micSelect.value;
        
        const sampleRates = {
            high: 44100,
            medium: 22050,
            low: 16000
        };

        const constraints = {
            audio: {
                sampleRate: sampleRates[quality],
                channelCount: 2,
                echoCancellation: this.echoCancellation.checked,
                noiseSuppression: this.noiseSuppression.checked,
                autoGainControl: true
            }
        };

        if (deviceId) {
            constraints.audio.deviceId = { exact: deviceId };
        }

        return constraints;
    }

    getMimeType() {
        const format = this.formatSelect.value;
        const types = {
            webm: 'audio/webm;codecs=opus',
            mp4: 'audio/mp4',
            wav: 'audio/wav'
        };

        // Check if the browser supports the preferred type
        const preferredType = types[format];
        if (MediaRecorder.isTypeSupported(preferredType)) {
            return preferredType;
        }

        // Fallback to supported types
        const fallbacks = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav'];
        for (let type of fallbacks) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return ''; // Use default
    }

    async startRecording() {
        try {
            this.updateStatus('Requesting microphone access...', 'recording');
            
            const constraints = this.getAudioConstraints();
            this.audioStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Setup audio analysis for level meter
            this.setupAudioAnalysis();
            
            // Setup MediaRecorder
            const mimeType = this.getMimeType();
            const options = mimeType ? { mimeType } : {};
            
            this.mediaRecorder = new MediaRecorder(this.audioStream, options);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.saveRecording();
                this.cleanup();
            };
            
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.updateStatus('Recording error occurred', 'error');
                this.cleanup();
            };
            
            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            this.isPaused = false;
            this.startTime = Date.now();
            this.pauseTime = 0;
            
            this.updateUI();
            this.startTimer();
            this.startLevelMeter();
            this.updateStatus('Recording...', 'recording');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            let errorMessage = 'Could not start recording';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Microphone access denied';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Recording not supported';
            }
            
            this.updateStatus(errorMessage, 'error');
            this.cleanup();
        }
    }

    setupAudioAnalysis() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        const source = this.audioContext.createMediaStreamSource(this.audioStream);
        
        source.connect(this.analyser);
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            this.stopTimer();
            this.stopLevelMeter();
            this.updateStatus('Processing...', 'processing');
            this.updateUI();
        }
    }

    togglePause() {
        if (!this.isRecording) return;
        
        if (this.isPaused) {
            // Resume
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.startTime = Date.now() - this.pauseTime;
            this.updateStatus('Recording...', 'recording');
            this.startLevelMeter();
        } else {
            // Pause
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.pauseTime = Date.now() - this.startTime;
            this.updateStatus('Paused', 'paused');
            this.stopLevelMeter();
        }
        
        this.updateUI();
    }

    saveRecording() {
        if (this.audioChunks.length === 0) return;
        
        const blob = new Blob(this.audioChunks, { 
            type: this.getMimeType() || 'audio/webm' 
        });
        
        const recording = {
            id: Date.now(),
            blob: blob,
            name: `Recording ${this.recordings.length + 1}`,
            duration: this.getCurrentDuration(),
            format: this.getFileExtension(),
            size: this.formatFileSize(blob.size),
            timestamp: new Date().toLocaleString()
        };
        
        this.recordings.push(recording);
        this.renderRecordings();
        this.updateStatus('Recording saved!', 'success');
        
        setTimeout(() => {
            this.updateStatus('Ready to Record', 'ready');
        }, 2000);
    }

    getFileExtension() {
        const format = this.formatSelect.value;
        const extensions = {
            webm: 'webm',
            mp4: 'm4a',
            wav: 'wav'
        };
        return extensions[format] || 'webm';
    }

    getCurrentDuration() {
        if (!this.startTime) return '00:00';
        const elapsed = this.isPaused ? this.pauseTime : Date.now() - this.startTime;
        return this.formatTime(Math.floor(elapsed / 1000));
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.recordingTimer.textContent = this.getCurrentDuration();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    startLevelMeter() {
        const updateLevel = () => {
            if (!this.analyser || this.isPaused || !this.isRecording) return;
            
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
            }
            const average = sum / this.dataArray.length;
            const percentage = (average / 255) * 100;
            
            this.levelBar.style.width = `${percentage}%`;
            
            this.levelMeterAnimationId = requestAnimationFrame(updateLevel);
        };
        
        updateLevel();
    }

    stopLevelMeter() {
        if (this.levelMeterAnimationId) {
            cancelAnimationFrame(this.levelMeterAnimationId);
            this.levelMeterAnimationId = null;
        }
        this.levelBar.style.width = '0%';
    }

    updateStatus(message, type = 'ready') {
        this.recordingStatus.textContent = message;
        this.recordingStatus.className = `recording-status ${type}`;
    }

    updateUI() {
        // Update button visibility
        this.recordBtn.classList.toggle('hidden', this.isRecording);
        this.stopBtn.classList.toggle('hidden', !this.isRecording);
        this.pauseBtn.classList.toggle('hidden', !this.isRecording);
        
        // Update recording indicator
        this.recordingIndicator.classList.toggle('hidden', !this.isRecording || this.isPaused);
        
        // Update pause button text
        if (this.isRecording) {
            const pauseText = this.pauseBtn.querySelector('.pause-text');
            pauseText.textContent = this.isPaused ? 'Resume' : 'Pause';
        }
    }

    renderRecordings() {
        if (this.recordings.length === 0) {
            this.recordingsList.innerHTML = `
                <div class="no-recordings">
                    <div class="no-recordings-icon">🎵</div>
                    <p>No recordings yet. Start recording to see them here!</p>
                </div>
            `;
            return;
        }

        this.recordingsList.innerHTML = this.recordings.map(recording => `
            <div class="recording-item" data-id="${recording.id}">
                <div class="recording-header-item">
                    <h4 class="recording-title">${recording.name}</h4>
                    <div class="recording-controls-item">
                        <button class="btn-play" onclick="audioRecorder.playRecording(${recording.id})">
                            ▶️ Play
                        </button>
                        <button class="btn-download" onclick="audioRecorder.downloadRecording(${recording.id})">
                            ⬇️ Download
                        </button>
                        <button class="btn-delete" onclick="audioRecorder.deleteRecording(${recording.id})">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div class="recording-meta">
                    <span>Duration: ${recording.duration}</span>
                    <span>Size: ${recording.size}</span>
                    <span>Format: ${recording.format.toUpperCase()}</span>
                    <span>Recorded: ${recording.timestamp}</span>
                </div>
                <audio class="audio-player" controls style="display: none;" data-id="${recording.id}">
                    <source src="${URL.createObjectURL(recording.blob)}" type="${recording.blob.type}">
                    Your browser does not support the audio element.
                </audio>
            </div>
        `).join('');
    }

    playRecording(id) {
        const recording = this.recordings.find(r => r.id === id);
        if (!recording) return;

        const audioPlayer = document.querySelector(`audio[data-id="${id}"]`);
        if (audioPlayer) {
            if (audioPlayer.style.display === 'none') {
                audioPlayer.style.display = 'block';
                audioPlayer.play();
            } else {
                audioPlayer.style.display = 'none';
                audioPlayer.pause();
            }
        }
    }

    downloadRecording(id) {
        const recording = this.recordings.find(r => r.id === id);
        if (!recording) return;

        const url = URL.createObjectURL(recording.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${recording.name}.${recording.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    deleteRecording(id) {
        if (confirm('Are you sure you want to delete this recording?')) {
            this.recordings = this.recordings.filter(r => r.id !== id);
            this.renderRecordings();
        }
    }

    clearAllRecordings() {
        if (this.recordings.length === 0) return;
        
        if (confirm('Are you sure you want to delete all recordings?')) {
            this.recordings = [];
            this.renderRecordings();
        }
    }

    cleanup() {
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.stopTimer();
        this.stopLevelMeter();
        this.updateUI();
        
        // Reset timer display
        this.recordingTimer.textContent = '00:00';
    }

    saveSettings() {
        const settings = {
            quality: this.qualitySelect.value,
            format: this.formatSelect.value,
            microphone: this.micSelect.value,
            noiseSuppression: this.noiseSuppression.checked,
            echoCancellation: this.echoCancellation.checked
        };
        
        localStorage.setItem('audioRecorderSettings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('audioRecorderSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                
                if (settings.quality) this.qualitySelect.value = settings.quality;
                if (settings.format) this.formatSelect.value = settings.format;
                if (settings.microphone) this.micSelect.value = settings.microphone;
                if (settings.noiseSuppression !== undefined) this.noiseSuppression.checked = settings.noiseSuppression;
                if (settings.echoCancellation !== undefined) this.echoCancellation.checked = settings.echoCancellation;
            }
        } catch (error) {
            console.warn('Could not load saved settings:', error);
        }
    }

    // Check browser compatibility
    static checkCompatibility() {
        const issues = [];
        
        if (!navigator.mediaDevices) {
            issues.push('MediaDevices API not supported');
        }
        
        if (!navigator.mediaDevices.getUserMedia) {
            issues.push('getUserMedia not supported');
        }
        
        if (!window.MediaRecorder) {
            issues.push('MediaRecorder API not supported');
        }
        
        if (issues.length > 0) {
            alert('Audio Recorder is not supported in this browser:\n\n' + issues.join('\n'));
            return false;
        }
        
        return true;
    }
}

// Initialize the audio recorder when the page loads
let audioRecorder;

document.addEventListener('DOMContentLoaded', () => {
    if (AudioRecorder.checkCompatibility()) {
        audioRecorder = new AudioRecorder();
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (audioRecorder) {
        audioRecorder.cleanup();
    }
});
