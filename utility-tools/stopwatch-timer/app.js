(function () {
    const timeDisplay = document.getElementById('timeDisplay');
    const totalElapsedLabel = document.getElementById('totalElapsed');
    const lapCountLabel = document.getElementById('lapCount');
    const fastestLapLabel = document.getElementById('fastestLap');
    const averageLapLabel = document.getElementById('averageLap');
    const startTimestampLabel = document.getElementById('startTimestamp');
    const countdownStatusLabel = document.getElementById('countdownStatus');
    const sessionIndicator = document.getElementById('sessionIndicator');

    const startBtn = document.getElementById('startBtn');
    const lapBtn = document.getElementById('lapBtn');
    const resetBtn = document.getElementById('resetBtn');
    const copySummaryBtn = document.getElementById('copySummaryBtn');
    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    const clearLapsBtn = document.getElementById('clearLapsBtn');

    const autoLapInput = document.getElementById('autoLapInput');
    const countdownMinutesInput = document.getElementById('countdownMinutes');
    const countdownSecondsInput = document.getElementById('countdownSeconds');
    const countdownRepeatToggle = document.getElementById('countdownRepeat');
    const armCountdownBtn = document.getElementById('armCountdownBtn');
    const clearCountdownBtn = document.getElementById('clearCountdownBtn');

    const lapsList = document.getElementById('lapsList');
    const statusBanner = document.getElementById('statusBanner');

    if (!timeDisplay) {
        return;
    }

    const state = {
        running: false,
        startTimestamp: 0,
        elapsed: 0,
        laps: [],
        lastLapMark: 0,
        autoLapInterval: 0,
        lastAutoLapMark: 0,
        countdownInterval: null,
        countdownTarget: null,
        countdownRepeat: false,
        rafId: null,
        audioContext: null,
    };

    function formatDuration(ms) {
        const totalMs = Math.max(ms, 0);
        const hours = Math.floor(totalMs / 3_600_000);
        const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
        const seconds = Math.floor((totalMs % 60_000) / 1_000);
        const hundredths = Math.floor((totalMs % 1_000) / 10);
        const hh = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
        const mm = minutes.toString().padStart(2, '0');
        const ss = seconds.toString().padStart(2, '0');
        const hs = hundredths.toString().padStart(2, '0');
        return `${hh}${mm}:${ss}.${hs}`;
    }

    function formatLong(ms) {
        const totalMs = Math.max(ms, 0);
        const hours = Math.floor(totalMs / 3_600_000);
        const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
        const seconds = Math.floor((totalMs % 60_000) / 1_000);
        const hundredths = Math.floor((totalMs % 1_000) / 10);
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds}.${hundredths.toString().padStart(2, '0')}s`;
        }
        return `${seconds}.${hundredths.toString().padStart(2, '0')}s`;
    }

    function showStatus(message, type = 'info') {
        if (!statusBanner) return;
        statusBanner.textContent = message;
        statusBanner.classList.remove('success', 'error', 'show');
        if (!message) {
            return;
        }
        if (type === 'success') {
            statusBanner.classList.add('success');
        } else if (type === 'error') {
            statusBanner.classList.add('error');
        }
        statusBanner.classList.add('show');
    }

    function ensureAudioContext() {
        if (!state.audioContext) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                return null;
            }
            state.audioContext = new AudioCtx();
        }
        if (state.audioContext.state === 'suspended') {
            state.audioContext.resume();
        }
        return state.audioContext;
    }

    function playChime() {
        const audioCtx = ensureAudioContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.6);
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.65);
    }

    function updateTimeDisplay() {
        timeDisplay.textContent = formatDuration(state.elapsed);
        totalElapsedLabel.textContent = formatDuration(state.elapsed);
        sessionIndicator.textContent = state.running ? 'Session active' : (state.elapsed > 0 ? 'Session paused' : 'Session idle');
        sessionIndicator.classList.toggle('active', state.running);
    }

    function updateStats() {
        const lapCount = state.laps.length;
        lapCountLabel.textContent = lapCount.toString();

        if (!lapCount) {
            fastestLapLabel.textContent = '—';
            averageLapLabel.textContent = '—';
            return;
        }

        const lapTimes = state.laps.map((lap) => lap.lapTime);
        const fastest = Math.min(...lapTimes);
        const average = lapTimes.reduce((acc, value) => acc + value, 0) / lapTimes.length;

        fastestLapLabel.textContent = formatDuration(fastest);
        averageLapLabel.textContent = formatDuration(average);
    }

    function renderLaps() {
        lapsList.innerHTML = '';
        if (!state.laps.length) {
            const placeholder = document.createElement('li');
            placeholder.className = 'placeholder';
            placeholder.textContent = 'Laps will appear here once you start recording.';
            lapsList.appendChild(placeholder);
            return;
        }

        let fastestLap = null;
        let slowestLap = null;
        state.laps.forEach((lap) => {
            if (fastestLap === null || lap.lapTime < fastestLap.lapTime) {
                fastestLap = lap;
            }
            if (slowestLap === null || lap.lapTime > slowestLap.lapTime) {
                slowestLap = lap;
            }
        });

        state.laps.slice().reverse().forEach((lap) => {
            const item = document.createElement('li');
            if (fastestLap && lap.index === fastestLap.index) {
                item.classList.add('lap-fastest');
            }
            if (slowestLap && lap.index === slowestLap.index) {
                item.classList.add('lap-slowest');
            }

            const header = document.createElement('div');
            header.className = 'lap-header';
            const title = document.createElement('span');
            title.className = 'lap-title';
            title.textContent = `Lap ${lap.index}`;
            const lapTime = document.createElement('span');
            lapTime.className = 'lap-time';
            lapTime.textContent = formatDuration(lap.lapTime);
            header.appendChild(title);
            header.appendChild(lapTime);

            const meta = document.createElement('div');
            meta.className = 'lap-meta';
            const total = document.createElement('span');
            total.textContent = `Total ${formatDuration(lap.total)}`;
            const diff = document.createElement('span');
            diff.className = 'lap-diff';
            if (lap.delta !== null) {
                const sign = lap.delta > 0 ? '+' : lap.delta < 0 ? '−' : '';
                const abs = formatLong(Math.abs(lap.delta));
                diff.textContent = `Δ ${sign}${abs}`;
                diff.classList.add(lap.delta <= 0 ? 'positive' : 'negative');
            } else {
                diff.textContent = 'Δ baseline';
            }
            const source = document.createElement('span');
            source.textContent = lap.source === 'auto' ? 'Auto lap' : 'Manual lap';
            meta.appendChild(total);
            meta.appendChild(diff);
            meta.appendChild(source);

            item.appendChild(header);
            item.appendChild(meta);
            lapsList.appendChild(item);
        });
    }

    function addLapEntry(lapTime, totalElapsed, source) {
        if (lapTime <= 0) {
            return;
        }
        const previousLap = state.laps[state.laps.length - 1];
        const delta = previousLap ? lapTime - previousLap.lapTime : null;
        const lap = {
            index: state.laps.length + 1,
            lapTime,
            total: totalElapsed,
            delta,
            source,
            recordedAt: new Date(),
        };
        state.laps.push(lap);
        state.lastLapMark = totalElapsed;
        if (source === 'manual') {
            state.lastAutoLapMark = totalElapsed;
        }
        renderLaps();
        updateStats();
        showStatus(`${source === 'auto' ? 'Auto' : 'Manual'} lap ${lap.index} recorded.`, 'success');
    }

    function recordManualLap() {
        const currentElapsed = state.elapsed;
        const lapTime = currentElapsed - state.lastLapMark;
        addLapEntry(lapTime, currentElapsed, 'manual');
    }

    function updateAutoLap() {
        const value = Number(autoLapInput.value);
        if (!Number.isFinite(value) || value < 0) {
            autoLapInput.value = '0';
        }
        const intervalMs = Math.max(0, Math.min(3600, Number(autoLapInput.value))) * 1000;
        state.autoLapInterval = intervalMs;
        if (intervalMs > 0) {
            showStatus(`Auto laps armed every ${value} seconds.`, 'info');
        } else {
            showStatus('Auto laps disabled.', 'info');
        }
    }

    function updateCountdownStatus() {
        if (state.countdownInterval === null) {
            countdownStatusLabel.textContent = 'Countdown: not armed';
            return;
        }
        const repeatText = state.countdownRepeat ? ' (repeats)' : '';
        const timeText = formatLong(state.countdownInterval);
        countdownStatusLabel.textContent = `Countdown: ${timeText}${repeatText}`;
    }

    function armCountdown() {
        const minutes = Math.max(0, Number(countdownMinutesInput.value) || 0);
        const seconds = Math.max(0, Number(countdownSecondsInput.value) || 0);
        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds <= 0) {
            showStatus('Set at least one second for the countdown alert.', 'error');
            return;
        }
        state.countdownInterval = totalSeconds * 1000;
        state.countdownTarget = state.elapsed + state.countdownInterval;
        state.countdownRepeat = countdownRepeatToggle.checked;
        updateCountdownStatus();
        showStatus('Countdown armed. It will fire once the stopwatch reaches the set duration.', 'success');
    }

    function clearCountdown() {
        state.countdownInterval = null;
        state.countdownTarget = null;
        state.countdownRepeat = false;
        countdownRepeatToggle.checked = false;
        updateCountdownStatus();
        showStatus('Countdown alert cleared.', 'info');
    }

    function startTimer() {
        if (state.running) return;
        state.running = true;
        state.startTimestamp = performance.now() - state.elapsed;
        state.lastLapMark = state.laps.length ? state.lastLapMark : state.elapsed;
        state.lastAutoLapMark = state.elapsed;
        startBtn.textContent = 'Pause';
        lapBtn.disabled = false;
        resetBtn.disabled = false;
        updateStartTimestampLabel(true);
        showStatus('Stopwatch running.', 'success');
        state.rafId = requestAnimationFrame(tick);
    }

    function pauseTimer() {
        if (!state.running) return;
        state.running = false;
        if (state.rafId) {
            cancelAnimationFrame(state.rafId);
            state.rafId = null;
        }
        state.elapsed = performance.now() - state.startTimestamp;
        startBtn.textContent = 'Resume';
        lapBtn.disabled = true;
        updateTimeDisplay();
        updateStartTimestampLabel(false);
        showStatus('Stopwatch paused.', 'info');
    }

    function resetTimer() {
        const hadElapsed = state.elapsed > 0;
        pauseTimer();
        state.elapsed = 0;
        state.laps = [];
        state.lastLapMark = 0;
        state.lastAutoLapMark = 0;
        state.countdownTarget = state.countdownInterval !== null ? state.countdownInterval : null;
        renderLaps();
        updateStats();
        updateTimeDisplay();
        startBtn.textContent = 'Start';
        lapBtn.disabled = true;
        resetBtn.disabled = true;
        updateStartTimestampLabel(false);
        if (hadElapsed) {
            showStatus('Stopwatch reset.', 'info');
        } else {
            showStatus('Ready when you are.', 'info');
        }
    }

    function updateStartTimestampLabel(running) {
        if (running) {
            const now = new Date();
            startTimestampLabel.textContent = `Start time: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        } else {
            startTimestampLabel.textContent = 'Start time: —';
        }
    }

    function handleAutoLap() {
        const interval = state.autoLapInterval;
        if (!state.running || interval <= 0) {
            return;
        }
        const elapsed = state.elapsed;
        while (elapsed - state.lastAutoLapMark >= interval) {
            const nextTrigger = state.lastAutoLapMark + interval;
            const lapTime = nextTrigger - state.lastLapMark;
            addLapEntry(lapTime, nextTrigger, 'auto');
            state.lastAutoLapMark = nextTrigger;
        }
    }

    function handleCountdown() {
        if (!state.running || state.countdownInterval === null || state.countdownTarget === null) {
            return;
        }
        if (state.elapsed >= state.countdownTarget) {
            playChime();
            showStatus('Countdown alert reached!', 'success');
            if (state.countdownRepeat) {
                state.countdownTarget += state.countdownInterval;
            } else {
                state.countdownTarget = null;
            }
        }
    }

    function tick(now) {
        if (!state.running) {
            return;
        }
        state.elapsed = now - state.startTimestamp;
        updateTimeDisplay();
        handleAutoLap();
        handleCountdown();
        state.rafId = requestAnimationFrame(tick);
    }

    function copySummary() {
        if (state.elapsed <= 0) {
            showStatus('Run the stopwatch before copying a summary.', 'error');
            return;
        }
        let summary = `Stopwatch total: ${formatDuration(state.elapsed)}`;
        if (state.laps.length) {
            const lines = state.laps.map((lap) => `Lap ${lap.index}: ${formatDuration(lap.lapTime)} (total ${formatDuration(lap.total)})`);
            summary += '\n' + lines.join('\n');
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(summary)
                .then(() => showStatus('Session summary copied to clipboard.', 'success'))
                .catch(() => fallbackCopy(summary));
        } else {
            fallbackCopy(summary);
        }
    }

    function fallbackCopy(text) {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand('copy');
            showStatus('Session summary copied to clipboard.', 'success');
        } catch (error) {
            showStatus('Unable to copy at this time.', 'error');
        }
        document.body.removeChild(temp);
    }

    function downloadCsv() {
        if (!state.laps.length) {
            showStatus('Record at least one lap before downloading.', 'error');
            return;
        }
        const headers = ['Lap', 'Lap Time', 'Total Time', 'Delta vs Previous', 'Source', 'Recorded At'];
        const rows = state.laps.map((lap) => [
            lap.index,
            formatDuration(lap.lapTime),
            formatDuration(lap.total),
            lap.delta === null ? '' : (lap.delta > 0 ? `+${formatLong(lap.delta)}` : `-${formatLong(Math.abs(lap.delta))}`),
            lap.source,
            lap.recordedAt.toISOString(),
        ]);
        const csvContent = [headers, ...rows].map((row) => row.map((value) => `"${value}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
        link.href = url;
        link.download = `stopwatch-laps-${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showStatus('Lap data downloaded as CSV.', 'success');
    }

    function clearLaps() {
        if (state.running) {
            showStatus('Pause the stopwatch before clearing laps.', 'error');
            return;
        }
        state.laps = [];
        state.lastLapMark = 0;
        state.lastAutoLapMark = 0;
        renderLaps();
        updateStats();
        showStatus('Lap history cleared.', 'info');
    }

    function init() {
        updateTimeDisplay();
        updateStats();
        renderLaps();
        updateCountdownStatus();
        showStatus('Stopwatch ready. Press Start to begin.', 'info');
    }

    startBtn.addEventListener('click', () => {
        if (state.running) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    lapBtn.addEventListener('click', () => {
        if (!state.running) {
            showStatus('Start the stopwatch before marking laps.', 'error');
            return;
        }
    recordManualLap();
    });

    resetBtn.addEventListener('click', resetTimer);

    autoLapInput.addEventListener('change', updateAutoLap);
    armCountdownBtn.addEventListener('click', armCountdown);
    clearCountdownBtn.addEventListener('click', clearCountdown);
    copySummaryBtn.addEventListener('click', copySummary);
    downloadCsvBtn.addEventListener('click', downloadCsv);
    clearLapsBtn.addEventListener('click', clearLaps);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.running && state.audioContext && state.audioContext.state === 'running') {
            state.audioContext.suspend();
        }
    });

    init();
})();
