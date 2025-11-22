(function () {
    "use strict";

    const MAX_LENGTH = 200000;

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    const sourceText = $("#sourceText");
    const statusBanner = $("#statusBanner");
    const loadSampleBtn = $("#loadSampleBtn");
    const clearBtn = $("#clearBtn");
    const cleanBtn = $("#cleanBtn");
    const copyOriginalBtn = $("#copyOriginalBtn");
    const copyResultBtn = $("#copyResultBtn");
    const downloadBtn = $("#downloadBtn");
    const replaceInputBtn = $("#replaceInputBtn");

    const trimWhitespace = $("#trimWhitespace");
    const collapseSpaces = $("#collapseSpaces");
    const normalizeLinebreaks = $("#normalizeLinebreaks");
    const removeBlankLines = $("#removeBlankLines");
    const stripHtml = $("#stripHtml");
    const stripPunctuation = $("#stripPunctuation");
    const stripDigits = $("#stripDigits");
    const stripEmojis = $("#stripEmojis");
    const flattenQuotes = $("#flattenQuotes");
    const forceLowercase = $("#forceLowercase");
    const findPattern = $("#findPattern");
    const replaceValue = $("#replaceValue");
    const useRegex = $("#useRegex");

    const presetButtons = $$(".preset-btn");

    const resultOutput = $("#resultOutput");
    const originalPreview = $("#originalPreview");
    const changeBadge = $("#changeBadge");
    const lengthBadge = $("#lengthBadge");
    const changeLog = $("#changeLog");

    const removedStat = $("#removedStat");
    const wordStat = $("#wordStat");
    const lineStat = $("#lineStat");
    const timeStat = $("#timeStat");

    const presets = {
        readable() {
            trimWhitespace.checked = true;
            collapseSpaces.checked = true;
            normalizeLinebreaks.checked = true;
            removeBlankLines.checked = true;
            stripHtml.checked = true;
            stripPunctuation.checked = false;
            stripDigits.checked = false;
            stripEmojis.checked = false;
            flattenQuotes.checked = true;
            forceLowercase.checked = false;
            findPattern.value = "";
            replaceValue.value = "";
            useRegex.checked = false;
        },
        slug() {
            trimWhitespace.checked = true;
            collapseSpaces.checked = true;
            normalizeLinebreaks.checked = true;
            removeBlankLines.checked = true;
            stripHtml.checked = true;
            stripPunctuation.checked = true;
            stripDigits.checked = false;
            stripEmojis.checked = true;
            flattenQuotes.checked = true;
            forceLowercase.checked = true;
            findPattern.value = "\s+";
            replaceValue.value = " ";
            useRegex.checked = true;
        },
        numbers() {
            trimWhitespace.checked = true;
            collapseSpaces.checked = false;
            normalizeLinebreaks.checked = true;
            removeBlankLines.checked = false;
            stripHtml.checked = true;
            stripPunctuation.checked = true;
            stripDigits.checked = false;
            stripEmojis.checked = true;
            flattenQuotes.checked = false;
            forceLowercase.checked = false;
            findPattern.value = "[^0-9\n]+";
            replaceValue.value = "";
            useRegex.checked = true;
        },
        letters() {
            trimWhitespace.checked = true;
            collapseSpaces.checked = true;
            normalizeLinebreaks.checked = true;
            removeBlankLines.checked = true;
            stripHtml.checked = true;
            stripPunctuation.checked = true;
            stripDigits.checked = true;
            stripEmojis.checked = true;
            flattenQuotes.checked = true;
            forceLowercase.checked = false;
            findPattern.value = "[^A-Za-z\n ]+";
            replaceValue.value = "";
            useRegex.checked = true;
        }
    };

    let lastResult = "";

    function showStatus(message, tone) {
        if (!statusBanner) return;
        statusBanner.textContent = message;
        statusBanner.classList.remove("hidden", "success", "warn", "error");
        if (tone) {
            statusBanner.classList.add(tone);
        }
        clearTimeout(showStatus._timer);
        showStatus._timer = setTimeout(() => {
            statusBanner.classList.add("hidden");
        }, 3200);
    }

    function flattenSmartQuotes(text) {
        return text
            .replace(/[“”«»„]/g, '"')
            .replace(/[‘’‚‛]/g, "'")
            .replace(/[‐‑‒–—―]/g, "-")
            .replace(/[…]/g, "...");
    }

    function removeHtml(text) {
        return text.replace(/<[^>]+>/g, "");
    }

    function removeEmojis(text) {
        return text.replace(/\p{Extended_Pictographic}/gu, "");
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function computeStats(originalLength, cleanedText) {
        const removed = Math.max(0, originalLength - cleanedText.length);
        const trimmed = cleanedText.trim();
        const words = trimmed ? trimmed.split(/\s+/).length : 0;
        const lines = cleanedText.length ? cleanedText.split("\n").length : 0;
        return { removed, words, lines };
    }

    function updateStats(stats, elapsed) {
        removedStat.textContent = stats.removed.toLocaleString();
        wordStat.textContent = stats.words.toLocaleString();
        lineStat.textContent = stats.lines.toLocaleString();
        timeStat.textContent = `${elapsed} ms`;
    }

    function highlightPreset(name) {
        presetButtons.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.preset === name);
        });
    }

    function resetOutputs() {
        resultOutput.textContent = "";
        originalPreview.textContent = "";
        lengthBadge.textContent = "0 characters";
        changeBadge.textContent = "No changes yet";
        changeLog.classList.remove("active");
        changeLog.innerHTML = "";
        updateStats({ removed: 0, words: 0, lines: 0 }, 0);
        lastResult = "";
    }

    function cleanText() {
        const raw = sourceText.value;
        if (!raw.trim()) {
            showStatus("Add some text first. Paste or type into the input box.", "warn");
            resetOutputs();
            return;
        }
        if (raw.length > MAX_LENGTH) {
            showStatus(`Input exceeds ${MAX_LENGTH.toLocaleString()} characters. Please shorten it.`, "error");
            return;
        }

        const start = performance.now();
        const actions = [];
        let preview = normalizeLinebreaks.checked ? raw.replace(/\r\n/g, "\n") : raw;
        let working = preview;

        function applyStep(enabled, description, transform) {
            if (!enabled) return;
            const next = transform(working);
            if (next !== working) {
                actions.push(description);
                working = next;
            }
        }

        applyStep(trimWhitespace.checked, "Trimmed surrounding whitespace", (text) => text.trim());
        applyStep(collapseSpaces.checked, "Collapsed repeated spaces", (text) => text.replace(/[ \t]+/g, " "));
        applyStep(removeBlankLines.checked, "Removed blank lines", (text) => text.split("\n").filter((line) => line.trim().length > 0).join("\n"));
        applyStep(stripHtml.checked, "Removed HTML tags", removeHtml);
        applyStep(stripPunctuation.checked, "Removed punctuation", (text) => text.replace(/[\p{P}\p{S}]/gu, ""));
        applyStep(stripDigits.checked, "Removed digits", (text) => text.replace(/\d+/g, ""));
        applyStep(stripEmojis.checked, "Removed emojis & symbols", removeEmojis);
        applyStep(flattenQuotes.checked, "Normalized fancy punctuation", flattenSmartQuotes);
        applyStep(forceLowercase.checked, "Converted to lowercase", (text) => text.toLowerCase());

        if (useRegex.checked && findPattern.value) {
            try {
                const regex = new RegExp(findPattern.value, "gu");
                const next = working.replace(regex, replaceValue.value);
                if (next !== working) {
                    actions.push(`Custom regex applied (${findPattern.value})`);
                    working = next;
                }
            } catch (error) {
                showStatus("Regex pattern is invalid. Skipped custom replacement.", "error");
            }
        } else if (!useRegex.checked && findPattern.value) {
            const next = working.split(findPattern.value).join(replaceValue.value);
            if (next !== working) {
                actions.push(`Custom replacement for "${findPattern.value}"`);
                working = next;
            }
        }

        const elapsed = Math.max(0, Math.round(performance.now() - start));
        const stats = computeStats(preview.length, working);

        originalPreview.textContent = preview;
        lengthBadge.textContent = `${preview.length.toLocaleString()} characters`;
        resultOutput.textContent = working;
        lastResult = working;

        if (actions.length) {
            changeBadge.textContent = `${actions.length} adjustment${actions.length === 1 ? "" : "s"} applied`;
            changeLog.classList.add("active");
            changeLog.innerHTML = `<strong>Summary</strong><ul>${actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul>`;
            showStatus("Text cleaned successfully.", "success");
        } else {
            changeBadge.textContent = "No changes applied";
            changeLog.classList.remove("active");
            changeLog.innerHTML = "";
            showStatus("No changes were needed with the current options.", "warn");
        }

        updateStats(stats, elapsed);
    }

    function clipboardCopy(text, successMessage) {
        if (!text) {
            showStatus("Nothing to copy yet.", "warn");
            return;
        }
        if (navigator.clipboard?.writeText) {
            navigator.clipboard
                .writeText(text)
                .then(() => showStatus(successMessage, "success"))
                .catch(() => showStatus("Clipboard permissions blocked.", "error"));
            return;
        }
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand("copy");
            showStatus(successMessage, "success");
        } catch (error) {
            showStatus("Clipboard copy is not supported in this browser.", "error");
        }
        document.body.removeChild(temp);
    }

    function downloadResult() {
        if (!lastResult) {
            showStatus("Clean the text before downloading.", "warn");
            return;
        }
        const blob = new Blob([lastResult], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "cleaned-text.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1500);
        showStatus("Download ready.", "success");
    }

    function loadSample() {
        const sample = `Here\'s some messy text!!  
 <div class="note">Packed with <strong>HTML</strong></div>   
Numbers: 12345 — Emojis: 😄👍  
Extra      spaces and blank lines...\n\n`;
        sourceText.value = sample;
        cleanText();
        sourceText.focus();
        sourceText.setSelectionRange(sourceText.value.length, sourceText.value.length);
    }

    function clearAll() {
        sourceText.value = "";
        findPattern.value = "";
        replaceValue.value = "";
        useRegex.checked = false;
        highlightPreset(null);
        resetOutputs();
        showStatus("Cleared the input and settings.", "warn");
        sourceText.focus();
    }

    function replaceInputWithResult() {
        if (!lastResult) {
            showStatus("Clean the text before replacing the input.", "warn");
            return;
        }
        sourceText.value = lastResult;
        cleanText();
        showStatus("Input updated with cleaned text.", "success");
    }

    function bindEvents() {
        cleanBtn.addEventListener("click", cleanText);
        loadSampleBtn.addEventListener("click", loadSample);
        clearBtn.addEventListener("click", clearAll);
        copyOriginalBtn.addEventListener("click", () => clipboardCopy(sourceText.value, "Original text copied."));
        copyResultBtn.addEventListener("click", () => clipboardCopy(lastResult, "Cleaned text copied."));
        downloadBtn.addEventListener("click", downloadResult);
        replaceInputBtn.addEventListener("click", replaceInputWithResult);

        presetButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const preset = btn.dataset.preset;
                if (presets[preset]) {
                    presets[preset]();
                    highlightPreset(preset);
                    showStatus(`${btn.textContent} preset applied.`, "success");
                    if (sourceText.value.trim()) {
                        cleanText();
                    }
                }
            });
        });

        sourceText.addEventListener("input", () => {
            if (!sourceText.value) {
                resetOutputs();
            }
        });
    }

    function init() {
        resetOutputs();
        bindEvents();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
