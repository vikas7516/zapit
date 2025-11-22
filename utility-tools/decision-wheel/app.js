(function () {
    const entriesInput = document.getElementById('entriesInput');
    const durationInput = document.getElementById('durationInput');
    const easingSelect = document.getElementById('easingSelect');
    const removeWinnerToggle = document.getElementById('removeWinnerToggle');
    const soundToggle = document.getElementById('soundToggle');
    const spinBtn = document.getElementById('spinBtn');
    const copyWinnerBtn = document.getElementById('copyWinnerBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const clearBtn = document.getElementById('clearBtn');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const entryCountLabel = document.getElementById('entryCount');
    const statusBanner = document.getElementById('statusBanner');
    const historyList = document.getElementById('historyList');
    const spinCountLabel = document.getElementById('spinCount');
    const lastResultLabel = document.getElementById('lastResult');
    const wheelCanvas = document.getElementById('wheelCanvas');
    const wheelEmpty = document.getElementById('wheelEmpty');

    if (!entriesInput || !wheelCanvas) {
        return;
    }

    const ctx = wheelCanvas.getContext('2d');
    const TAU = Math.PI * 2;
    const POINTER_ANGLE = -Math.PI / 2; // top of the circle
    const MAX_OPTIONS = 100;
    const MIN_SPIN = 2;
    const MAX_SPIN = 12;
    const SAMPLE_ENTRIES = [
        'Alice',
        'Bob',
        'Charlie',
        'Danica',
        'Elijah',
        'Fatima',
        'Grace',
        'Hiro',
        'Ivy',
        'Jamal'
    ];

    const state = {
        entries: [],
        rotation: POINTER_ANGLE,
        spinCount: 0,
        isSpinning: false,
        lastWinner: null,
        lastTickIndex: null,
        history: []
    };

    let audioContext;

    function mod(value, divisor) {
        return (value % divisor + divisor) % divisor;
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function showStatus(message, type = 'info') {
        if (!statusBanner) return;
        statusBanner.textContent = message;
        statusBanner.classList.remove('error', 'success', 'show');
        if (type === 'error') {
            statusBanner.classList.add('error');
        } else if (type === 'success') {
            statusBanner.classList.add('success');
        }
        if (message) {
            statusBanner.classList.add('show');
        } else {
            statusBanner.classList.remove('show');
        }
    }

    function updateEntryCount() {
        const count = state.entries.length;
        entryCountLabel.textContent = `${count} option${count === 1 ? '' : 's'} loaded`;
    }

    function updateWheelDisplay(rotation = state.rotation) {
        const { entries } = state;
        const hasEnough = entries.length >= 2;
        wheelEmpty.style.display = hasEnough ? 'none' : 'flex';

        ctx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

        if (!entries.length) {
            return;
        }

        const radius = wheelCanvas.width / 2;
        const centerX = wheelCanvas.width / 2;
        const centerY = wheelCanvas.height / 2;
        const sliceAngle = TAU / entries.length;
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        const textColor = theme === 'dark' ? '#e2e8f0' : '#0f172a';

        const colors = generateColors(entries.length);

        for (let i = 0; i < entries.length; i += 1) {
            const startAngle = rotation + i * sliceAngle;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius - 6, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i];
            ctx.fill();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + sliceAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = textColor;
            ctx.font = '600 16px "Inter", "Segoe UI", sans-serif';
            ctx.fillText(entries[i], radius - 24, 6);
            ctx.restore();
        }
    }

    function generateColors(count) {
        const baseSaturation = 65;
        const baseLightness = 62;
        const colors = [];
        for (let i = 0; i < count; i += 1) {
            const hue = mod((i * 137.508), 360);
            const lightness = baseLightness - (count > 8 ? (i % 5) * 4 : 0);
            colors.push(`hsl(${hue.toFixed(1)}, ${baseSaturation}%, ${Math.max(lightness, 45)}%)`);
        }
        return colors;
    }

    function sanitizeEntries(text) {
        const lines = text.split('\n');
        const seen = new Set();
        const cleaned = [];
        let removedCount = 0;
        let truncated = false;
        for (const rawLine of lines) {
            const option = rawLine.trim();
            if (!option) {
                removedCount += 1;
                continue;
            }
            if (cleaned.length >= MAX_OPTIONS) {
                truncated = true;
                break;
            }
            const normalized = option.toLowerCase();
            if (seen.has(normalized)) {
                removedCount += 1;
                continue;
            }
            seen.add(normalized);
            cleaned.push(option);
        }
        return { list: cleaned, removedDuplicates: removedCount > 0, truncated };
    }

    function syncEntriesFromInput(options = {}) {
        const { notify = false } = options;
        const { list, removedDuplicates, truncated } = sanitizeEntries(entriesInput.value);
        state.entries = list;
        if (!state.isSpinning) {
            state.rotation = POINTER_ANGLE;
        }
        if (removedDuplicates) {
            entriesInput.value = list.join('\n');
            showStatus('Duplicate or empty lines were removed for fairness.', 'info');
        } else if (truncated) {
            entriesInput.value = list.join('\n');
            showStatus(`Only the first ${MAX_OPTIONS} options were kept.`, 'info');
        } else if (notify) {
            showStatus('Entries updated.', 'success');
        } else {
            showStatus('');
        }
        updateEntryCount();
        updateWheelDisplay();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (!state.history.length) {
            const placeholder = document.createElement('li');
            placeholder.className = 'placeholder';
            placeholder.textContent = 'Spin the wheel to see the winners log here.';
            historyList.appendChild(placeholder);
            return;
        }
        state.history.slice().reverse().forEach((entry) => {
            const item = document.createElement('li');
            const label = document.createElement('span');
            label.textContent = entry.value;
            const time = document.createElement('span');
            time.className = 'time';
            time.textContent = entry.time;
            item.appendChild(label);
            item.appendChild(time);
            historyList.appendChild(item);
        });
    }

    function easing(progress, mode) {
        switch (mode) {
            case 'linear':
                return progress;
            case 'easeInOut':
                return progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            case 'easeOut':
            default:
                return 1 - Math.pow(1 - progress, 3);
        }
    }

    function getActiveIndex(rotation) {
        if (!state.entries.length) return -1;
        const sliceAngle = TAU / state.entries.length;
        const normalized = mod(rotation - POINTER_ANGLE, TAU);
        const index = Math.floor(normalized / sliceAngle);
        return mod(index, state.entries.length);
    }

    function ensureAudioContext() {
        if (!soundToggle.checked) {
            return null;
        }
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return audioContext;
    }

    function playTick() {
        const ctxAudio = ensureAudioContext();
        if (!ctxAudio) return;
        const oscillator = ctxAudio.createOscillator();
        const gain = ctxAudio.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1600, ctxAudio.currentTime);
        gain.gain.setValueAtTime(0.0001, ctxAudio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.18, ctxAudio.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctxAudio.currentTime + 0.1);
        oscillator.connect(gain);
        gain.connect(ctxAudio.destination);
        oscillator.start();
        oscillator.stop(ctxAudio.currentTime + 0.12);
    }

    function addToHistory(winner) {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        state.history.push({ value: winner, time: timestamp });
        if (state.history.length > 30) {
            state.history.shift();
        }
        renderHistory();
    }

    function removeWinnerFromEntries(winner) {
        const filtered = state.entries.filter((entry) => entry !== winner);
        state.entries = filtered;
        entriesInput.value = filtered.join('\n');
        updateEntryCount();
    }

    function spinWheel() {
        if (state.isSpinning) return;
        if (state.entries.length < 2) {
            showStatus('Add at least two unique options before spinning.', 'error');
            return;
        }

        const durationSeconds = clamp(parseFloat(durationInput.value) || 6, MIN_SPIN, MAX_SPIN);
        durationInput.value = durationSeconds.toString();

        const sliceAngle = TAU / state.entries.length;
        const randomIndex = Math.floor(Math.random() * state.entries.length);
        const randomOffset = Math.random() * sliceAngle * 0.8 + sliceAngle * 0.1;

        const currentNormalized = mod(state.rotation - POINTER_ANGLE, TAU);
        const targetNormalized = randomIndex * sliceAngle + randomOffset;
        let delta = targetNormalized - currentNormalized;
        if (delta <= 0) {
            delta += TAU;
        }
        const extraTurns = TAU * (4 + Math.floor(Math.random() * 3));
        const finalRotation = state.rotation + delta + extraTurns;

        const startRotation = state.rotation;
        const deltaRotation = finalRotation - startRotation;
        const mode = easingSelect.value;
        const startTime = performance.now();
        const lastTickState = { index: getActiveIndex(state.rotation) };

        state.isSpinning = true;
        state.lastTickIndex = lastTickState.index;
        showStatus('Spinning...');

        function frame(now) {
            const elapsed = (now - startTime) / 1000;
            const progress = clamp(elapsed / durationSeconds, 0, 1);
            const eased = easing(progress, mode);
            const currentRotation = startRotation + deltaRotation * eased;
            updateWheelDisplay(currentRotation);

            const activeIndex = getActiveIndex(currentRotation);
            if (soundToggle.checked && activeIndex !== state.lastTickIndex) {
                state.lastTickIndex = activeIndex;
                playTick();
            }

            if (progress < 1) {
                requestAnimationFrame(frame);
                return;
            }

            state.rotation = finalRotation;
            state.isSpinning = false;
            const winnerIndex = getActiveIndex(state.rotation);
            const winner = state.entries[winnerIndex];
            state.lastWinner = winner;
            state.spinCount += 1;
            spinCountLabel.textContent = state.spinCount.toString();
            lastResultLabel.textContent = winner || '–';
            addToHistory(winner);
            showStatus(`Winner: ${winner}`, 'success');

            if (removeWinnerToggle.checked && winner) {
                removeWinnerFromEntries(winner);
                updateWheelDisplay(state.rotation);
            } else {
                updateWheelDisplay(state.rotation);
            }
        }

        requestAnimationFrame(frame);
    }

    function shuffleEntries() {
        if (!state.entries.length) {
            showStatus('Nothing to shuffle yet. Add some options first.', 'error');
            return;
        }
        for (let i = state.entries.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [state.entries[i], state.entries[j]] = [state.entries[j], state.entries[i]];
        }
        entriesInput.value = state.entries.join('\n');
        state.rotation = POINTER_ANGLE;
        updateEntryCount();
        updateWheelDisplay();
        showStatus('Entries shuffled.', 'success');
    }

    function clearEntries() {
        entriesInput.value = '';
        state.entries = [];
        state.rotation = POINTER_ANGLE;
        updateEntryCount();
        updateWheelDisplay();
        showStatus('Entries cleared.', 'info');
    }

    function loadSampleEntries() {
        entriesInput.value = SAMPLE_ENTRIES.join('\n');
        syncEntriesFromInput({ notify: true });
        showStatus('Sample list loaded. Customize as needed.', 'success');
    }

    function clearHistory() {
        state.history = [];
        renderHistory();
        showStatus('History cleared.', 'info');
    }

    function copyWinner() {
        if (!state.lastWinner) {
            showStatus('Spin the wheel first to copy a result.', 'error');
            return;
        }
        const text = state.lastWinner;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showStatus(`"${text}" copied to clipboard.`, 'success');
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand('copy');
            showStatus(`"${text}" copied to clipboard.`, 'success');
        } catch (err) {
            showStatus('Unable to copy at this time.', 'error');
        }
        document.body.removeChild(temp);
    }

    entriesInput.addEventListener('input', () => {
        syncEntriesFromInput({ notify: false });
    });

    shuffleBtn.addEventListener('click', shuffleEntries);
    clearBtn.addEventListener('click', clearEntries);
    loadSampleBtn.addEventListener('click', loadSampleEntries);
    spinBtn.addEventListener('click', spinWheel);
    copyWinnerBtn.addEventListener('click', copyWinner);
    clearHistoryBtn.addEventListener('click', clearHistory);

    document.addEventListener('visibilitychange', () => {
        if (audioContext && audioContext.state === 'running' && document.hidden) {
            audioContext.suspend();
        }
    });

    const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                updateWheelDisplay();
            }
        });
    });

    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Initial render
    updateEntryCount();
    updateWheelDisplay();
    renderHistory();
})();
