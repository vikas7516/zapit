(function () {
    "use strict";

    const MAX_INPUT_LENGTH = 250;
    const DEFAULT_SEPARATOR = "-";
    const DEFAULT_SAMPLE = "Zapit launches blazing-fast productivity tools for everyone";
    const HARD_SEPARATOR_LIMIT = 500;

    const STOP_WORDS = new Set([
        "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with", "we", "you", "your"
    ]);

    const $ = (selector) => document.querySelector(selector);

    const inputText = $("#inputText");
    const charCount = $("#charCount");
    const wordCount = $("#wordCount");
    const statusBanner = $("#statusBanner");
    const separatorSelect = $("#separatorSelect");
    const customSeparatorWrapper = $("#customSeparatorWrapper");
    const customSeparatorInput = $("#customSeparatorInput");
    const lowercaseToggle = $("#lowercaseToggle");
    const asciiToggle = $("#asciiToggle");
    const removeStopWordsToggle = $("#removeStopWordsToggle");
    const collapseSeparatorsToggle = $("#collapseSeparatorsToggle");
    const maxLengthInput = $("#maxLengthInput");
    const generateBtn = $("#generateBtn");
    const copySlugBtn = $("#copySlugBtn");
    const downloadBtn = $("#downloadBtn");
    const loadSampleBtn = $("#loadSampleBtn");
    const clearBtn = $("#clearBtn");

    const slugOutput = $("#slugOutput");
    const separatorBadge = $("#separatorBadge");
    const caseBadge = $("#caseBadge");
    const statsNote = $("#statsNote");
    const sourceWordsStat = $("#sourceWordsStat");
    const slugLengthStat = $("#slugLengthStat");
    const uniqueWordsStat = $("#uniqueWordsStat");
    const separatorCountStat = $("#separatorCountStat");

    let pendingTimer = null;
    let lastSlug = "";
    let lastSignature = "";

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

    function updateInputStats() {
        const value = inputText.value || "";
        const length = value.length;
        const words = value.trim() ? value.trim().split(/\s+/).length : 0;
        charCount.textContent = `${length} / ${MAX_INPUT_LENGTH} characters`;
        wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
    }

    function toggleCustomSeparator(value) {
        const isCustom = value === "custom";
        customSeparatorWrapper.hidden = !isCustom;
        if (isCustom) {
            customSeparatorInput.focus();
        }
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function sanitizeSeparator(raw) {
        if (!raw) {
            return DEFAULT_SEPARATOR;
        }
        const trimmed = raw.replace(/\s+/g, "");
        if (!trimmed) {
            return DEFAULT_SEPARATOR;
        }
        return trimmed.slice(0, 3);
    }

    function collectOptions() {
        const separatorChoice = separatorSelect.value;
        let separator = separatorChoice === "custom" ? sanitizeSeparator(customSeparatorInput.value) : separatorChoice;
        if (!separator) {
            separator = DEFAULT_SEPARATOR;
        }
        return {
            separator,
            lowercase: lowercaseToggle.checked,
            ascii: asciiToggle.checked,
            removeStopWords: removeStopWordsToggle.checked,
            collapse: collapseSeparatorsToggle.checked,
            maxLength: parseInt(maxLengthInput.value, 10)
        };
    }

    function normalizeForDiacritics(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function buildSlug(text, options) {
        if (!text.trim()) {
            return { slug: "", tokens: [], processedWords: 0 };
        }

        const base = options.ascii ? normalizeForDiacritics(text) : text;
        const strippedQuotes = base.replace(/[’'`]+/g, "");
        const cleaned = strippedQuotes
            .replace(/[^\p{L}\p{N}]+/gu, " ")
            .trim();

        if (!cleaned) {
            return { slug: "", tokens: [], processedWords: 0 };
        }

        const baseTokens = cleaned.split(/\s+/);
        const lowerTokens = baseTokens.map((token) => token.toLowerCase());
        const processedWords = baseTokens.length;
        let tokens = baseTokens;

        if (options.removeStopWords) {
            tokens = baseTokens.filter((token, index) => !STOP_WORDS.has(lowerTokens[index] || token.toLowerCase()));
        }

        const separator = options.separator || DEFAULT_SEPARATOR;
        const escapedSeparator = escapeRegExp(separator);
        const separatorRegex = new RegExp(`${escapedSeparator}+`, "g");

        let slug = tokens.join(separator);
        if (options.collapse) {
            slug = slug.replace(separatorRegex, separator);
        }
        slug = slug.replace(new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, "g"), "");

        if (options.lowercase) {
            slug = slug.toLowerCase();
        }

        if (Number.isFinite(options.maxLength) && options.maxLength > 0 && slug.length > options.maxLength) {
            slug = slug.slice(0, options.maxLength);
            slug = slug.replace(new RegExp(`${escapedSeparator}+$`), "");
        }

    return { slug, tokens, processedWords };
    }

    function computeStats(text, tokens, slug, separator) {
        const sourceWords = text.trim() ? text.trim().split(/\s+/).length : 0;
        const uniqueWords = tokens.length ? new Set(tokens.map((token) => token.toLowerCase())).size : 0;
        const separatorCount = slug ? slug.split(separator).length - 1 : 0;
        return {
            sourceWords,
            uniqueWords,
            separatorCount: Math.max(0, separatorCount),
            slugLength: slug.length
        };
    }

    function updateStatsDisplay(stats, elapsedMs, options, tokensKept, processedWords) {
        sourceWordsStat.textContent = stats.sourceWords.toLocaleString();
        slugLengthStat.textContent = stats.slugLength.toLocaleString();
        uniqueWordsStat.textContent = stats.uniqueWords.toLocaleString();
        separatorCountStat.textContent = stats.separatorCount.toLocaleString();

        const stopWordNote = options.removeStopWords ? `${processedWords - tokensKept} stop words removed` : "Stop words kept";
        const asciiNote = options.ascii ? "ASCII-only" : "Unicode preserved";
        const caseNote = options.lowercase ? "lowercase" : "case-sensitive";
        const collapseNote = options.collapse ? "collapsed" : "allowing repeats";
        statsNote.textContent = `${caseNote}, ${asciiNote}, ${stopWordNote}. Generated in ${elapsedMs} ms.`;
    }

    function updateBadges(options) {
        separatorBadge.textContent = `Separator: ${options.separator}`;
        caseBadge.textContent = options.lowercase ? "Lowercase" : "Preserve case";
    }

    function renderSlug(force = false) {
        const rawValue = inputText.value || "";
        const options = collectOptions();
        const signature = JSON.stringify({ rawValue, options });
        if (!force && signature === lastSignature) {
            return;
        }

        lastSignature = signature;
        updateBadges(options);

        if (!rawValue.trim()) {
            slugOutput.textContent = "Waiting for input…";
            lastSlug = "";
            updateStatsDisplay({ sourceWords: 0, slugLength: 0, uniqueWords: 0, separatorCount: 0 }, 0, options, 0, 0);
            return;
        }

        const start = performance.now();
        const { slug, tokens, processedWords } = buildSlug(rawValue, options);
        const elapsed = Math.max(0, Math.round(performance.now() - start));

        if (!slug) {
            slugOutput.textContent = "Resulting slug is empty. Adjust options or add more content.";
            lastSlug = "";
            updateStatsDisplay({ sourceWords: 0, slugLength: 0, uniqueWords: 0, separatorCount: 0 }, elapsed, options, tokens.length, processedWords);
            showStatus("No slug generated. Try disabling stop-word removal or add more text.", "warn");
            return;
        }

        lastSlug = slug;
        slugOutput.textContent = slug;
        const stats = computeStats(rawValue, tokens, slug, options.separator);
        updateStatsDisplay(stats, elapsed, options, tokens.length, processedWords);
        showStatus("Slug generated successfully.", "success");
    }

    function scheduleRender() {
        clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => renderSlug(false), 220);
    }

    function copySlug() {
        if (!lastSlug) {
            showStatus("Generate a slug before copying.", "warn");
            return;
        }
        if (navigator.clipboard?.writeText) {
            navigator.clipboard
                .writeText(lastSlug)
                .then(() => showStatus("Slug copied to clipboard.", "success"))
                .catch(() => showStatus("Clipboard blocked. Use keyboard shortcuts instead.", "error"));
            return;
        }
        const temp = document.createElement("textarea");
        temp.value = lastSlug;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand("copy");
            showStatus("Slug copied to clipboard.", "success");
        } catch (error) {
            showStatus("Clipboard copy is not supported in this browser.", "error");
        }
        document.body.removeChild(temp);
    }

    function downloadSlug() {
        if (!lastSlug) {
            showStatus("Generate a slug before downloading.", "warn");
            return;
        }
        const blob = new Blob([lastSlug], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `slug-${Date.now()}.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showStatus("Download ready.", "success");
    }

    function loadSample() {
        inputText.value = DEFAULT_SAMPLE;
        updateInputStats();
        renderSlug(true);
        inputText.focus();
        inputText.setSelectionRange(inputText.value.length, inputText.value.length);
    }

    function clearAll() {
        inputText.value = "";
        maxLengthInput.value = "";
        lastSlug = "";
        lastSignature = "";
        updateInputStats();
        slugOutput.textContent = "Waiting for input…";
        updateBadges(collectOptions());
        updateStatsDisplay({ sourceWords: 0, slugLength: 0, uniqueWords: 0, separatorCount: 0 }, 0, collectOptions(), 0, 0);
        showStatus("Cleared input and preview.", "warn");
        inputText.focus();
    }

    function enforceInputLimits(event) {
        if (event.target.value.length > MAX_INPUT_LENGTH) {
            event.target.value = event.target.value.slice(0, MAX_INPUT_LENGTH);
        }
    }

    function enforceSeparatorLimits(event) {
        if (event.target.value.length > HARD_SEPARATOR_LIMIT) {
            event.target.value = event.target.value.slice(0, HARD_SEPARATOR_LIMIT);
            showStatus("Separator truncated to prevent oversized output.", "warn");
        }
    }

    function bindEvents() {
        inputText.addEventListener("input", (event) => {
            enforceInputLimits(event);
            updateInputStats();
            scheduleRender();
        });
        separatorSelect.addEventListener("change", (event) => {
            toggleCustomSeparator(event.target.value);
            scheduleRender();
        });
        customSeparatorInput.addEventListener("input", (event) => {
            enforceSeparatorLimits(event);
            scheduleRender();
        });
        [lowercaseToggle, asciiToggle, removeStopWordsToggle, collapseSeparatorsToggle].forEach((toggle) => {
            toggle.addEventListener("change", scheduleRender);
        });
        maxLengthInput.addEventListener("input", () => {
            scheduleRender();
        });
        generateBtn.addEventListener("click", () => renderSlug(true));
        copySlugBtn.addEventListener("click", copySlug);
        downloadBtn.addEventListener("click", downloadSlug);
        loadSampleBtn.addEventListener("click", loadSample);
        clearBtn.addEventListener("click", clearAll);
    }

    function init() {
        updateInputStats();
        toggleCustomSeparator(separatorSelect.value);
        updateBadges(collectOptions());
        bindEvents();
        scheduleRender();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
