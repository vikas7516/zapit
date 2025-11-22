(function () {
    const diceCountInput = document.getElementById('diceCount');
    const diceSidesSelect = document.getElementById('diceSides');
    const customSidesField = document.getElementById('customSidesField');
    const customSidesInput = document.getElementById('customSides');
    const modifierInput = document.getElementById('modifierInput');
    const modeSelect = document.getElementById('modeSelect');
    const dropLowestToggle = document.getElementById('dropLowestToggle');
    const rollBtn = document.getElementById('rollBtn');
    const clearBtn = document.getElementById('clearBtn');
    const presetDnDBtn = document.getElementById('presetDnD');
    const presetAdvantageBtn = document.getElementById('presetAdvantage');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    const statusBanner = document.getElementById('statusBanner');

    const totalValue = document.getElementById('totalValue');
    const diceBreakdown = document.getElementById('diceBreakdown');
    const maxValue = document.getElementById('maxValue');
    const minValue = document.getElementById('minValue');
    const avgValue = document.getElementById('avgValue');
    const modifierValue = document.getElementById('modifierValue');
    const historyList = document.getElementById('historyList');

    if (!rollBtn || !diceCountInput || !statusBanner) {
        return;
    }

    const MAX_DICE = 50;
    const MAX_SIDES = 999;
    const MAX_MODIFIER = 999;
    const MIN_MODIFIER = -999;
    const HISTORY_LIMIT = 20;

    const state = {
        history: [],
        lastResultText: '',
    };

    function showStatus(message, type = 'info') {
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

    function hideStatus() {
        statusBanner.textContent = '';
        statusBanner.classList.remove('success', 'error', 'show');
    }

    function toggleCustomSidesField() {
        const needsCustom = diceSidesSelect.value === 'custom';
        customSidesField.hidden = !needsCustom;
        customSidesInput.required = needsCustom;
    }

    function clampNumber(value, min, max, fallback) {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) return fallback;
        return Math.min(Math.max(parsed, min), max);
    }

    function rollSingleDie(sides) {
        return Math.floor(Math.random() * sides) + 1;
    }

    function sum(values) {
        return values.reduce((acc, value) => acc + value, 0);
    }

    function average(values) {
        if (!values.length) return 0;
        return sum(values) / values.length;
    }

    function formatNumber(value) {
        return Number.isInteger(value) ? value.toString() : value.toFixed(2);
    }

    function getDiceConfig() {
        const count = clampNumber(diceCountInput.value, 1, MAX_DICE, 2);
        diceCountInput.value = count;

        let sidesValue;
        if (diceSidesSelect.value === 'custom') {
            sidesValue = clampNumber(customSidesInput.value, 2, MAX_SIDES, 6);
            customSidesInput.value = sidesValue;
        } else {
            sidesValue = Number(diceSidesSelect.value);
        }

        const modifier = clampNumber(modifierInput.value, MIN_MODIFIER, MAX_MODIFIER, 0);
        modifierInput.value = modifier;

        const mode = modeSelect.value;
        const dropLowest = dropLowestToggle.checked;

        return { count, sides: sidesValue, modifier, mode, dropLowest };
    }

    function rollStandard(count, sides) {
        const result = [];
        for (let i = 0; i < count; i += 1) {
            result.push(rollSingleDie(sides));
        }
        return result;
    }

    function rollExploding(count, sides) {
        const rolls = [];
        let remaining = count;
        while (remaining > 0) {
            remaining -= 1;
            const value = rollSingleDie(sides);
            rolls.push(value);
            if (value === sides) {
                remaining += 1;
            }
        }
        return rolls;
    }

    function handleDropLowest(values) {
        if (values.length <= 1) {
            return { kept: [...values], dropped: [] };
        }
        let lowestIndex = 0;
        for (let i = 1; i < values.length; i += 1) {
            if (values[i] < values[lowestIndex]) {
                lowestIndex = i;
            }
        }
        const kept = values.filter((_, index) => index !== lowestIndex);
        const dropped = [values[lowestIndex]];
        return { kept, dropped };
    }

    function buildExpression(config, resultSummary) {
        const { count, sides, modifier, mode, dropLowest } = config;
        const base = `${count}d${sides}`;
        const modifierPart = modifier === 0 ? '' : (modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`);
        const modePart = mode === 'standard' ? '' : ` (${mode})`;
        const dropPart = dropLowest ? ' [drop lowest]' : '';
        const extra = resultSummary.exploded ? ' [exploding]' : '';
        return `${base}${modifierPart}${modePart}${dropPart}${extra}`.trim();
    }

    function performRoll(config) {
        const { count, sides, modifier, mode, dropLowest } = config;
        let allRolls = [];
        let keptRolls = [];
        let discarded = [];
        let exploded = false;
        let explanation = '';

        if (mode === 'exploding') {
            allRolls = rollExploding(count, sides);
            exploded = allRolls.length > count;
            if (dropLowest) {
                const { kept, dropped } = handleDropLowest(allRolls);
                keptRolls = kept;
                discarded = dropped;
            } else {
                keptRolls = [...allRolls];
            }
        } else if (mode === 'advantage' || mode === 'disadvantage') {
            const firstRoll = rollStandard(count, sides);
            const secondRoll = rollStandard(count, sides);
            const firstTotal = sum(firstRoll);
            const secondTotal = sum(secondRoll);
            const pickFirst = mode === 'advantage' ? firstTotal >= secondTotal : firstTotal <= secondTotal;
            const winningRoll = pickFirst ? firstRoll : secondRoll;
            const losingRoll = pickFirst ? secondRoll : firstRoll;
            allRolls = winningRoll;
            keptRolls = [...winningRoll];
            discarded = losingRoll;
            explanation = `${mode === 'advantage' ? 'Advantage' : 'Disadvantage'} roll → kept [${winningRoll.join(', ')}] vs discarded [${losingRoll.join(', ')}]`;
        } else {
            allRolls = rollStandard(count, sides);
            if (dropLowest) {
                const { kept, dropped } = handleDropLowest(allRolls);
                keptRolls = kept;
                discarded = dropped;
            } else {
                keptRolls = [...allRolls];
            }
        }

        const subtotal = sum(keptRolls);
        const total = subtotal + modifier;

        return {
            total,
            subtotal,
            allRolls,
            keptRolls,
            discarded,
            exploded,
            explanation,
            modifier,
        };
    }

    function updateMetrics(result) {
        const { keptRolls, modifier } = result;
        modifierValue.textContent = modifier >= 0 ? `+${modifier}` : modifier.toString();

        if (!keptRolls.length) {
            maxValue.textContent = '–';
            minValue.textContent = '–';
            avgValue.textContent = '–';
            return;
        }

        const max = Math.max(...keptRolls);
        const min = Math.min(...keptRolls);
        const avg = average(keptRolls);
        maxValue.textContent = max.toString();
        minValue.textContent = min.toString();
        avgValue.textContent = formatNumber(avg);
    }

    function formatBreakdown(config, result, expression) {
        const parts = [];
        if (result.explanation) {
            parts.push(result.explanation);
        }
        parts.push(`Rolled: [${result.allRolls.join(', ')}]`);
        if (result.discarded.length) {
            parts.push(`Dropped: [${result.discarded.join(', ')}]`);
        }
        if (config.modifier !== 0) {
            parts.push(`Subtotal ${result.subtotal} with modifier ${config.modifier >= 0 ? '+' : ''}${config.modifier}`);
        }
        parts.push(`Total: ${result.total}`);
        return `${expression}\n${parts.join('\n')}`;
    }

    function renderResult(config, result) {
        const expression = buildExpression(config, result);
        totalValue.textContent = result.total.toString();
        diceBreakdown.textContent = formatBreakdown(config, result, expression);
        updateMetrics(result);
        state.lastResultText = `${expression} = ${result.total}`;
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (!state.history.length) {
            const placeholder = document.createElement('li');
            placeholder.className = 'placeholder';
            placeholder.textContent = 'Your last twenty rolls will appear here.';
            historyList.appendChild(placeholder);
            return;
        }

        state.history.slice().forEach((entry) => {
            const item = document.createElement('li');
            const expression = document.createElement('div');
            expression.className = 'expression';
            expression.textContent = entry.expression;

            const meta = document.createElement('div');
            meta.className = 'meta';
            meta.innerHTML = `<span>Total: <strong>${entry.total}</strong></span><span>${entry.time}</span>`;

            const detail = document.createElement('div');
            detail.className = 'detail';
            detail.textContent = entry.detail;

            item.appendChild(expression);
            item.appendChild(meta);
            item.appendChild(detail);
            historyList.appendChild(item);
        });
    }

    function addToHistory(config, result) {
        const expression = buildExpression(config, result);
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const detail = `Dice kept: [${result.keptRolls.join(', ')}]${result.discarded.length ? ` | Dropped: [${result.discarded.join(', ')}]` : ''}`;
        state.history.unshift({
            expression,
            total: result.total,
            time: timestamp,
            detail,
        });
        if (state.history.length > HISTORY_LIMIT) {
            state.history.length = HISTORY_LIMIT;
        }
        renderHistory();
    }

    function handleRoll() {
        hideStatus();
        const config = getDiceConfig();

        if (config.mode !== 'standard' && config.dropLowest) {
            dropLowestToggle.checked = false;
            config.dropLowest = false;
            showStatus('Drop lowest is disabled for advantage, disadvantage, and exploding rolls.', 'info');
        }

        const result = performRoll(config);
        renderResult(config, result);
        addToHistory(config, result);
        showStatus('Dice rolled successfully.', 'success');
    }

    function handleClear() {
        diceCountInput.value = 2;
        diceSidesSelect.value = '6';
        customSidesInput.value = 6;
        modifierInput.value = 0;
        modeSelect.value = 'standard';
        dropLowestToggle.checked = false;
        toggleCustomSidesField();
        totalValue.textContent = '0';
        diceBreakdown.textContent = 'Roll to see each die value.';
        maxValue.textContent = '–';
        minValue.textContent = '–';
        avgValue.textContent = '–';
        modifierValue.textContent = '0';
        hideStatus();
    }

    function handleCopyResult() {
        if (!state.lastResultText) {
            showStatus('Roll the dice first to copy a result.', 'error');
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(state.lastResultText)
                .then(() => showStatus('Result copied to clipboard.', 'success'))
                .catch(() => fallbackCopy());
        } else {
            fallbackCopy();
        }
    }

    function fallbackCopy() {
        const temp = document.createElement('textarea');
        temp.value = state.lastResultText;
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand('copy');
            showStatus('Result copied to clipboard.', 'success');
        } catch (error) {
            showStatus('Unable to copy at this time.', 'error');
        }
        document.body.removeChild(temp);
    }

    function handleClearHistory() {
        state.history = [];
        renderHistory();
        showStatus('History cleared.', 'info');
    }

    function handleExportHistory() {
        if (!state.history.length) {
            showStatus('No history to export yet.', 'error');
            return;
        }
        const lines = state.history
            .slice()
            .reverse()
            .map((entry) => `${entry.time} — ${entry.expression} = ${entry.total}\n${entry.detail}`);
        const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        link.href = url;
        link.download = `dice-roll-history-${timestamp}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showStatus('History downloaded as text.', 'success');
    }

    function applyDnDPreset() {
        diceCountInput.value = 4;
        diceSidesSelect.value = '6';
        modifierInput.value = 0;
        modeSelect.value = 'standard';
        dropLowestToggle.checked = true;
        toggleCustomSidesField();
        showStatus('Preset loaded: 4d6 drop lowest.', 'info');
    }

    function applyAdvantagePreset() {
        diceCountInput.value = 1;
        diceSidesSelect.value = '20';
        modifierInput.value = 0;
        modeSelect.value = 'advantage';
        dropLowestToggle.checked = false;
        toggleCustomSidesField();
        showStatus('Preset loaded: Advantage d20.', 'info');
    }

    function init() {
        toggleCustomSidesField();
        renderHistory();
        hideStatus();
    }

    diceSidesSelect.addEventListener('change', () => {
        toggleCustomSidesField();
        hideStatus();
    });

    rollBtn.addEventListener('click', handleRoll);
    clearBtn.addEventListener('click', handleClear);
    copyResultBtn.addEventListener('click', handleCopyResult);
    clearHistoryBtn.addEventListener('click', handleClearHistory);
    exportHistoryBtn.addEventListener('click', handleExportHistory);
    presetDnDBtn.addEventListener('click', applyDnDPreset);
    presetAdvantageBtn.addEventListener('click', applyAdvantagePreset);

    init();
})();
