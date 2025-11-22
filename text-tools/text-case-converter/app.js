(function () {
    "use strict";

    const MAX_LENGTH = 200000;

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    const sourceText = $("#sourceText");
    const statusBanner = $("#statusBanner");
    const loadSampleBtn = $("#loadSampleBtn");
    const clearBtn = $("#clearBtn");
    const applyPrimaryBtn = $("#applyPrimaryBtn");
    const primaryTransformSelect = $("#primaryTransform");
    const transformButtons = $$(".transform-btn");
    const copyOriginalBtn = $("#copyOriginalBtn");
    const swapBtn = $("#swapBtn");
    const copyResultBtn = $("#copyResultBtn");
    const downloadBtn = $("#downloadBtn");
    const replaceInputBtn = $("#replaceInputBtn");

    const trimBefore = $("#trimBefore");
    const normalizeWhitespace = $("#normalizeWhitespace");
    const preserveAccents = $("#preserveAccents");
    const autoUpdate = $("#autoUpdate");

    const modeBadge = $("#modeBadge");
    const lengthBadge = $("#lengthBadge");
    const resultOutput = $("#resultOutput");
    const originalPreview = $("#originalPreview");

    const wordStat = $("#wordStat");
    const sentenceStat = $("#sentenceStat");
    const upperStat = $("#upperStat");
    const timeStat = $("#timeStat");

    const transformLabels = {
        sentence: "Sentence case",
        title: "Title Case",
        upper: "UPPERCASE",
        lower: "lowercase",
        capitalize: "Capitalize Words",
        toggle: "tOGGLE cASE",
        alternating: "Alternating Case",
        camel: "camelCase",
        pascal: "PascalCase",
        snake: "snake_case",
        constant: "CONSTANT_CASE",
        kebab: "kebab-case"
    };

    let lastResult = "";
    let lastTransform = primaryTransformSelect.value;

    const SMALL_WORDS = new Set([
        "a", "an", "and", "as", "at", "but", "by", "en", "for", "from",
        "in", "nor", "of", "on", "or", "per", "the", "to", "vs", "via"
    ]);

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

    function reverseCase(text) {
        return text.replace(/./g, (char) => {
            if (char.toLowerCase() === char.toUpperCase()) {
                return char;
            }
            return char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase();
        });
    }

    function alternatingCase(text) {
        let toggle = true;
        return Array.from(text).map((char) => {
            if (!/\p{L}/u.test(char)) {
                return char;
            }
            const next = toggle ? char.toUpperCase() : char.toLowerCase();
            toggle = !toggle;
            return next;
        }).join("");
    }

    function toTitleCase(text) {
        const lower = text.toLowerCase();
        const tokens = lower.split(/(\s+)/);
        const wordsOnly = tokens.filter((token) => !/\s+/.test(token));
        const lastWordIndex = wordsOnly.length - 1;
        let pointer = 0;

        return tokens
            .map((token) => {
                if (/\s+/.test(token)) {
                    return token;
                }
                const word = token;
                const transformed = word.charAt(0).toUpperCase() + word.slice(1);
                const isFirst = pointer === 0;
                const isLast = pointer === lastWordIndex;
                pointer += 1;
                if (isFirst || isLast) {
                    return transformed;
                }
                return SMALL_WORDS.has(word) ? word : transformed;
            })
            .join("");
    }

    function toSentenceCase(text) {
        const lower = text.toLowerCase();
        return lower.replace(/(^\s*|[.!?]\s+)([\p{L}])/gu, (match, prefix, char) => prefix + char.toUpperCase());
    }

    function capitalizeWords(text) {
        return text
            .toLowerCase()
            .replace(/\b[\p{L}\p{N}]/gu, (char) => char.toUpperCase());
    }

    function tokenizeForCase(text) {
        return text
            .replace(/[_\-]+/g, " ")
            .replace(/([a-z\d])([A-Z])/g, "$1 $2")
            .split(/[^A-Za-z0-9]+/)
            .filter(Boolean);
    }

    function toCamelCase(text) {
        const words = tokenizeForCase(text);
        if (!words.length) return "";
        const [first, ...rest] = words;
        const head = first.toLowerCase();
        const tail = rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
        return [head, ...tail].join("");
    }

    function toPascalCase(text) {
        return tokenizeForCase(text)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join("");
    }

    function toDelimitedCase(text, delimiter, transform = (word) => word.toLowerCase()) {
        return tokenizeForCase(text).map(transform).join(delimiter);
    }

    function stripAccents(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    const TRANSFORMS = {
        upper: (text) => text.toUpperCase(),
        lower: (text) => text.toLowerCase(),
        title: toTitleCase,
        sentence: toSentenceCase,
        capitalize: capitalizeWords,
        toggle: reverseCase,
        alternating: alternatingCase,
        camel: toCamelCase,
        pascal: toPascalCase,
        snake: (text) => toDelimitedCase(text, "_", (word) => word.toLowerCase()),
        kebab: (text) => toDelimitedCase(text, "-", (word) => word.toLowerCase()),
        constant: (text) => toDelimitedCase(text, "_", (word) => word.toUpperCase())
    };

    function computeStats(text) {
        const trimmed = text.trim();
        const words = trimmed ? trimmed.split(/\s+/).length : 0;
        let sentences = 0;
        if (trimmed) {
            const matches = text.match(/[^.!?\n]+(?:[.!?]+|$)/g) || [];
            sentences = matches.filter((sentence) => sentence.trim().length > 0).length;
            if (sentences === 0) {
                sentences = 1;
            }
        }
        const uppercase = (text.match(/\p{Lu}/gu) || []).length;
        return { words, sentences, uppercase };
    }

    function updateStats(stats, elapsed) {
        wordStat.textContent = stats.words.toLocaleString();
        sentenceStat.textContent = stats.sentences.toLocaleString();
        upperStat.textContent = stats.uppercase.toLocaleString();
        timeStat.textContent = `${elapsed} ms`;
    }

    function prepareInput(raw) {
        let text = raw.replace(/\r\n/g, "\n");
        if (trimBefore.checked) {
            text = text.trim();
        }
        if (normalizeWhitespace.checked) {
            text = text
                .split("\n")
                .map((line) => line.replace(/\s+/g, " ").trim())
                .join("\n")
                .replace(/\n{3,}/g, "\n\n");
        }
        if (!preserveAccents.checked) {
            text = stripAccents(text);
        }
        return text;
    }

    function setActiveTransform(mode) {
        transformButtons.forEach((btn) => {
            const isActive = btn.dataset.transform === mode;
            btn.classList.toggle("active", isActive);
        });
    }

    function setModeBadge(mode) {
        modeBadge.textContent = transformLabels[mode] || transformLabels.sentence;
    }

    function applyTransform(mode, triggeredByAuto = false) {
        const raw = sourceText.value;
        if (!raw.trim()) {
            if (!triggeredByAuto) {
                showStatus("Add some text first. Paste or type into the input box.", "warn");
                resetOutputs();
            }
            return;
        }
        if (raw.length > MAX_LENGTH) {
            showStatus(`Input exceeds ${MAX_LENGTH.toLocaleString()} characters. Please shorten it.`, "error");
            return;
        }

        const start = performance.now();
        const prepared = prepareInput(raw);
        if (!prepared) {
            if (!triggeredByAuto) {
                showStatus("Nothing to convert after cleanup. Adjust your smart cleanup settings.", "warn");
                resetOutputs();
            }
            return;
        }
        const transform = TRANSFORMS[mode] || TRANSFORMS.sentence;
        const output = transform(prepared);
        const elapsed = Math.max(0, Math.round(performance.now() - start));
        const stats = computeStats(output);

        originalPreview.textContent = prepared;
        resultOutput.textContent = output;
        lengthBadge.textContent = `${prepared.length.toLocaleString()} characters`;
        updateStats(stats, elapsed);

        lastResult = output;
        lastTransform = mode;

        setActiveTransform(mode);
        setModeBadge(mode);
        if (!triggeredByAuto) {
            showStatus(`${transformLabels[mode] || transformLabels.sentence} applied.`, "success");
        }
    }

    function clipboardCopy(text, successMessage) {
        if (!text) {
            showStatus("Nothing to copy yet. Convert the text first.", "warn");
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
            showStatus("Convert some text before downloading.", "warn");
            return;
        }
        const blob = new Blob([lastResult], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${lastTransform || "converted"}-case.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1500);
        showStatus("Download ready.", "success");
    }

    function resetOutputs() {
        originalPreview.textContent = "";
        resultOutput.textContent = "";
        lengthBadge.textContent = "0 characters";
        updateStats({ words: 0, sentences: 0, uppercase: 0 }, 0);
        lastResult = "";
    }

    function clearAll() {
        sourceText.value = "";
        resetOutputs();
        setActiveTransform("");
        showStatus("Cleared the input and results.", "warn");
        sourceText.focus();
    }

    function loadSample() {
        const sample = `Writing CASE conversions by hand is tedious.\nWith this tool, you can flip uppercase, lowercase, or even camel case in milliseconds!\nTry Title Case for headlines, snake_case for code, or Sentence case for paragraphs.`;
        sourceText.value = sample;
        applyTransform(primaryTransformSelect.value);
        sourceText.focus();
        sourceText.setSelectionRange(sourceText.value.length, sourceText.value.length);
    }

    function swapInputAndOutput() {
        if (!lastResult) {
            showStatus("Nothing to swap yet. Convert the text first.", "warn");
            return;
        }
        const currentResult = lastResult;
        const currentInput = sourceText.value;
        sourceText.value = currentResult;
        lastResult = currentInput;
        applyTransform(lastTransform || primaryTransformSelect.value);
        showStatus("Input and output swapped.", "success");
    }

    function replaceInputWithResult() {
        if (!lastResult) {
            showStatus("Convert the text before replacing the input.", "warn");
            return;
        }
        sourceText.value = lastResult;
        applyTransform(lastTransform || primaryTransformSelect.value);
        showStatus("Input replaced with converted text.", "success");
    }

    function bindEvents() {
        applyPrimaryBtn.addEventListener("click", () => applyTransform(primaryTransformSelect.value));

        primaryTransformSelect.addEventListener("change", () => {
            setModeBadge(primaryTransformSelect.value);
            if (autoUpdate.checked && sourceText.value.trim()) {
                applyTransform(primaryTransformSelect.value, true);
            }
        });

        transformButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const mode = btn.dataset.transform;
                primaryTransformSelect.value = mode;
                applyTransform(mode);
            });
        });

        loadSampleBtn.addEventListener("click", loadSample);
        clearBtn.addEventListener("click", clearAll);
        copyOriginalBtn.addEventListener("click", () => clipboardCopy(sourceText.value, "Original text copied."));
        copyResultBtn.addEventListener("click", () => clipboardCopy(lastResult, "Converted text copied."));
        downloadBtn.addEventListener("click", downloadResult);
        swapBtn.addEventListener("click", swapInputAndOutput);
        replaceInputBtn.addEventListener("click", replaceInputWithResult);

        [trimBefore, normalizeWhitespace, preserveAccents].forEach((input) => {
            input.addEventListener("change", () => {
                if (autoUpdate.checked && sourceText.value.trim()) {
                    applyTransform(primaryTransformSelect.value, true);
                }
            });
        });

        autoUpdate.addEventListener("change", () => {
            if (autoUpdate.checked && sourceText.value.trim()) {
                applyTransform(primaryTransformSelect.value, true);
                showStatus("Auto convert enabled. Edits will update live.", "success");
            } else if (!autoUpdate.checked) {
                showStatus("Auto convert disabled. Use the Apply button when ready.", "warn");
            }
        });

        sourceText.addEventListener("input", () => {
            if (!sourceText.value) {
                resetOutputs();
                return;
            }
            if (autoUpdate.checked) {
                applyTransform(primaryTransformSelect.value, true);
            }
        });
    }

    function init() {
        setModeBadge(primaryTransformSelect.value);
        setActiveTransform(primaryTransformSelect.value);
        resetOutputs();
        bindEvents();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
