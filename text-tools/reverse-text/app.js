(function () {
    "use strict";

    const MAX_LENGTH = 200000;

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    const sourceText = $("#sourceText");
    const statusBanner = $("#statusBanner");
    const processBtn = $("#processBtn");
    const clearBtn = $("#clearBtn");
    const loadSampleBtn = $("#loadSampleBtn");
    const copyOriginalBtn = $("#copyOriginalBtn");
    const copyResultBtn = $("#copyResultBtn");
    const downloadBtn = $("#downloadBtn");
    const autoUpdate = $("#autoUpdate");
    const reverseEachWord = $("#reverseEachWord");
    const normalizeWhitespace = $("#normalizeWhitespace");
    const preserveLineBreaks = $("#preserveLineBreaks");

    const modeRadios = $$('[name="reverseMode"]');
    const modeBadge = $("#modeBadge");
    const lengthBadge = $("#lengthBadge");
    const resultOutput = $("#resultOutput");
    const originalPreview = $("#originalPreview");

    const charStat = $("#charStat");
    const wordStat = $("#wordStat");
    const lineStat = $("#lineStat");
    const timeStat = $("#timeStat");

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

    function reverseString(text) {
        return text.split("").reverse().join("");
    }

    function reverseByWords(text) {
        const tokens = text.match(/\S+|\s+/g);
        if (!tokens) {
            return "";
        }
        const words = tokens.filter((token) => /\S/.test(token));
        words.reverse();
        let index = 0;
        return tokens
            .map((token) => (/\S/.test(token) ? words[index++] : token))
            .join("");
    }

    function reverseBySentences(text) {
        const tokens = text.match(/[^.!?\n]+[.!?]*|\s+/g);
        if (!tokens) {
            return "";
        }
        const sentences = tokens.filter((token) => /\S/.test(token));
        sentences.reverse();
        let index = 0;
        return tokens
            .map((token) => (/\S/.test(token) ? sentences[index++] : token))
            .join("");
    }

    function reverseByLines(text) {
        const lines = text.split("\n");
        return lines.reverse().join("\n");
    }

    function mirrorWords(text) {
        return text.replace(/\S+/g, (word) => reverseString(word));
    }

    function getSelectedMode() {
        const selected = modeRadios.find((radio) => radio.checked);
        return selected ? selected.value : "characters";
    }

    function updateModeBadge(mode) {
        const labels = {
            characters: "Characters Reversed",
            words: "Word Order Reversed",
            sentences: "Sentence Order Reversed",
            lines: "Line Order Reversed"
        };
        modeBadge.textContent = labels[mode] || labels.characters;
    }

    function refreshModeCards() {
        modeRadios.forEach((radio) => {
            const card = radio.closest(".radio-card");
            if (!card) return;
            card.classList.toggle("active", radio.checked);
            card.setAttribute("aria-checked", radio.checked ? "true" : "false");
        });
    }

    function clipboardCopy(text, message) {
        if (!text) {
            showStatus("Nothing to copy yet. Process the text first.", "warn");
            return;
        }
        if (navigator.clipboard?.writeText) {
            navigator.clipboard
                .writeText(text)
                .then(() => showStatus(message, "success"))
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
            showStatus(message, "success");
        } catch (error) {
            showStatus("Clipboard copy is not supported in this browser.", "error");
        }
        document.body.removeChild(temp);
    }

    function downloadResult() {
        if (!lastResult) {
            showStatus("Generate a result before downloading.", "warn");
            return;
        }
        const blob = new Blob([lastResult], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "reversed-text.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1500);
        showStatus("Download ready.", "success");
    }

    function computeStats(text) {
        const normalized = text.length ? text.replace(/\r\n/g, "\n") : text;
        const charCount = normalized.length;
        const words = normalized.trim() ? normalized.trim().split(/\s+/).length : 0;
        const lines = normalized ? normalized.split("\n").length : 0;
        return { charCount, words, lines };
    }

    function normalizeInput(text) {
        let normalized = text.replace(/\r\n/g, "\n");
        if (normalizeWhitespace.checked) {
            normalized = normalized
                .split("\n")
                .map((line) => line.replace(/\s+/g, " ").trim())
                .join("\n");
        }
        if (!preserveLineBreaks.checked) {
            normalized = normalized.replace(/\n\s*\n+/g, "\n");
        }
        return normalized;
    }

    function processText() {
        const raw = sourceText.value;
        if (!raw.trim()) {
            showStatus("Add some text first. Paste or type into the input box.", "warn");
            resultOutput.textContent = "";
            originalPreview.textContent = "";
            lastResult = "";
            updateStats({ charCount: 0, words: 0, lines: 0 }, 0);
            return;
        }
        if (raw.length > MAX_LENGTH) {
            showStatus(`Input exceeds ${MAX_LENGTH.toLocaleString()} characters. Please shorten it.`, "error");
            return;
        }

        const start = performance.now();
        const mode = getSelectedMode();
        updateModeBadge(mode);

        const normalized = normalizeInput(raw);
        let output = normalized;

        switch (mode) {
            case "characters":
                output = reverseString(normalized);
                break;
            case "words":
                output = reverseByWords(normalized);
                break;
            case "sentences":
                output = reverseBySentences(normalized);
                break;
            case "lines":
                output = reverseByLines(normalized);
                break;
            default:
                output = reverseString(normalized);
        }

        if (reverseEachWord.checked) {
            output = mirrorWords(output);
        }

        const elapsed = Math.max(0, Math.round(performance.now() - start));
        const stats = computeStats(normalized);

        originalPreview.textContent = normalized;
        resultOutput.textContent = output;
        lastResult = output;

        lengthBadge.textContent = `${stats.charCount.toLocaleString()} characters`;
        updateStats(stats, elapsed);
        showStatus("Text reversed successfully.", "success");
    }

    function updateStats(stats, elapsed) {
        charStat.textContent = stats.charCount.toLocaleString();
        wordStat.textContent = stats.words.toLocaleString();
        lineStat.textContent = stats.lines.toLocaleString();
        timeStat.textContent = `${elapsed} ms`;
    }

    function clearAll() {
        sourceText.value = "";
        originalPreview.textContent = "";
        resultOutput.textContent = "";
        lastResult = "";
        updateStats({ charCount: 0, words: 0, lines: 0 }, 0);
        showStatus("Cleared the input and results.", "warn");
        sourceText.focus();
    }

    function loadSample() {
        const sample = `The quick brown fox jumps over the lazy dog.\nPalindromes like level and radar are fun.\nReversing sentences keeps punctuation in place!`;
        sourceText.value = sample;
        processText();
        sourceText.focus();
        sourceText.setSelectionRange(sourceText.value.length, sourceText.value.length);
    }

    function handleAutoUpdate() {
        if (autoUpdate.checked && sourceText.value.trim()) {
            processText();
        }
    }

    function bindEvents() {
        processBtn.addEventListener("click", processText);
        clearBtn.addEventListener("click", clearAll);
        loadSampleBtn.addEventListener("click", loadSample);
        copyOriginalBtn.addEventListener("click", () => clipboardCopy(sourceText.value, "Original text copied."));
        copyResultBtn.addEventListener("click", () => clipboardCopy(lastResult, "Reversed text copied."));
        downloadBtn.addEventListener("click", downloadResult);

        modeRadios.forEach((radio) => {
            radio.addEventListener("change", () => {
                refreshModeCards();
                if (autoUpdate.checked && sourceText.value.trim()) {
                    processText();
                } else {
                    updateModeBadge(getSelectedMode());
                }
            });
        });

        [reverseEachWord, normalizeWhitespace, preserveLineBreaks].forEach((input) => {
            input.addEventListener("change", () => {
                if (autoUpdate.checked && sourceText.value.trim()) {
                    processText();
                }
            });
        });

        autoUpdate.addEventListener("change", () => {
            if (autoUpdate.checked && sourceText.value.trim()) {
                processText();
            } else {
                showStatus("Auto-update toggled off. Use the Reverse button when ready.", "warn");
            }
        });

        sourceText.addEventListener("input", () => {
            if (!sourceText.value) {
                originalPreview.textContent = "";
                resultOutput.textContent = "";
                lastResult = "";
                updateStats({ charCount: 0, words: 0, lines: 0 }, 0);
            }
            if (autoUpdate.checked) {
                handleAutoUpdate();
            }
        });
    }

    function init() {
        refreshModeCards();
        updateModeBadge(getSelectedMode());
        updateStats({ charCount: 0, words: 0, lines: 0 }, 0);
        bindEvents();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
