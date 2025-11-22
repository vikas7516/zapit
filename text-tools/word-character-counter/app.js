(function () {
    "use strict";

    const MAX_INPUT_LENGTH = 50000;
    const SAMPLE_TEXT = `Content is king, but clarity is queen. Great copy balances punchy sentences with breathing room so readers stay engaged.\n\nUse this space to check how your message flows before sharing it with the world.`;
    const SPEAKING_SPEED_WPM = 130;

    const $ = (selector) => document.querySelector(selector);

    const inputText = $("#inputText");
    const charCount = $("#charCount");
    const wordCount = $("#wordCount");
    const statusBanner = $("#statusBanner");

    const liveUpdateToggle = $("#liveUpdateToggle");
    const ignoreNumbersToggle = $("#ignoreNumbersToggle");
    const ignorePunctuationToggle = $("#ignorePunctuationToggle");
    const countAllCharactersToggle = $("#countAllCharactersToggle");
    const readingSpeedSelect = $("#readingSpeedSelect");

    const analyzeBtn = $("#analyzeBtn");
    const copyReportBtn = $("#copyReportBtn");
    const downloadBtn = $("#downloadBtn");
    const loadSampleBtn = $("#loadSampleBtn");
    const clearBtn = $("#clearBtn");

    const wordsStat = $("#wordsStat");
    const charactersWithSpacesStat = $("#charactersWithSpacesStat");
    const charactersNoSpacesStat = $("#charactersNoSpacesStat");
    const sentencesStat = $("#sentencesStat");
    const paragraphsStat = $("#paragraphsStat");
    const longestWordStat = $("#longestWordStat");

    const avgWordsPerSentence = $("#avgWordsPerSentence");
    const avgCharsPerWord = $("#avgCharsPerWord");
    const whitespaceRatio = $("#whitespaceRatio");
    const uniqueWordsStat = $("#uniqueWordsStat");
    const lexicalDensity = $("#lexicalDensity");

    const readingTimeBadge = $("#readingTimeBadge");
    const speakingTimeBadge = $("#speakingTimeBadge");

    const insightsList = $("#insightsList");

    let pendingTimer = null;
    let lastSummary = "";

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
        }, 3000);
    }

    function enforceInputLimit() {
        if (inputText.value.length > MAX_INPUT_LENGTH) {
            inputText.value = inputText.value.slice(0, MAX_INPUT_LENGTH);
            showStatus(`Input truncated to ${MAX_INPUT_LENGTH.toLocaleString()} characters.`, "warn");
        }
    }

    function countWords(tokens) {
        return tokens.length;
    }

    function tokenize(text, options) {
        if (!text.trim()) {
            return [];
        }
        const pattern = /\p{L}[\p{L}\p{N}'’_-]*|\d+(?:[.,]\d+)*/gu;
        const matches = text.match(pattern) || [];
        return matches
            .map((token) => token.trim())
            .filter((token) => token.length)
            .filter((token) => {
                if (!options.ignoreNumbers) {
                    return true;
                }
                return !/^\d+(?:[.,]\d+)*$/.test(token);
            })
            .map((token) => {
                if (!options.ignorePunctuation) {
                    return token;
                }
                return token
                    .replace(/^[^\p{L}\p{N}]+/u, "")
                    .replace(/[^\p{L}\p{N}]+$/u, "");
            })
            .filter((token) => token.length);
    }

    function computeSentenceCount(text) {
        const sentences = text
            .split(/[.!?]+(?!\d)(?:\s|$)/)
            .map((part) => part.trim())
            .filter(Boolean);
        return sentences.length;
    }

    function computeParagraphCount(text) {
        const paragraphs = text
            .split(/\n{2,}/)
            .map((part) => part.trim())
            .filter(Boolean);
        return paragraphs.length;
    }

    function computeWhitespaceRatio(text) {
        if (!text.length) return 0;
        const whitespaceMatches = text.match(/\s/g);
        const whitespaceCount = whitespaceMatches ? whitespaceMatches.length : 0;
        return (whitespaceCount / text.length) * 100;
    }

    function formatPercentage(value) {
        if (!Number.isFinite(value)) return "0%";
        return `${value.toFixed(1)}%`;
    }

    function formatDuration(minutesFloat) {
        if (!Number.isFinite(minutesFloat) || minutesFloat <= 0) {
            return "0 min";
        }
        const totalSeconds = Math.round(minutesFloat * 60);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (mins && secs) {
            return `${mins} min ${secs} sec`;
        }
        if (mins) {
            return `${mins} min`;
        }
        return `${secs} sec`;
    }

    function generateSummary(stats) {
        const lines = [
            `Words: ${stats.words}`,
            `Characters (with spaces): ${stats.charactersWithSpaces}`,
            `Characters (no spaces): ${stats.charactersNoSpaces}`,
            `Sentences: ${stats.sentences}`,
            `Paragraphs: ${stats.paragraphs}`,
            `Reading time: ${stats.readingTime}`,
            `Speaking time: ${stats.speakingTime}`,
            `Average words per sentence: ${stats.avgWordsPerSentence}`,
            `Average characters per word: ${stats.avgCharsPerWord}`,
            `Unique words: ${stats.uniqueWords}`,
            `Vocabulary density: ${stats.lexicalDensity}`
        ];
        return lines.join("\n");
    }

    function downloadCSV(stats) {
        const rows = [
            ["Metric", "Value"],
            ["Words", stats.words],
            ["Characters (with spaces)", stats.charactersWithSpaces],
            ["Characters (no spaces)", stats.charactersNoSpaces],
            ["Sentences", stats.sentences],
            ["Paragraphs", stats.paragraphs],
            ["Longest word", stats.longestWord || ""],
            ["Average words per sentence", stats.avgWordsPerSentence],
            ["Average characters per word", stats.avgCharsPerWord],
            ["Unique words", stats.uniqueWords],
            ["Vocabulary density", stats.lexicalDensity],
            ["Whitespace ratio", stats.whitespaceRatio],
            ["Reading time", stats.readingTime],
            ["Speaking time", stats.speakingTime]
        ];
        const csv = rows
            .map((cols) =>
                cols
                    .map((value) => {
                        const stringValue = String(value ?? "");
                        if (stringValue.includes(",") || stringValue.includes("\"")) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                    })
                    .join(",")
            )
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `word-character-counter-${Date.now()}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showStatus("Report downloaded as CSV.", "success");
    }

    function updateInsights(stats) {
        if (!insightsList) return;
        const items = insightsList.querySelectorAll("li");
        if (!items.length) {
            return;
        }
        if (items[0]) {
            const target = stats.avgWordsPerSentence;
            items[0].innerHTML = `Average sentences currently hold <strong>${target}</strong> words. Aim for 12–18 for readable prose.`;
        }
        if (items[1]) {
            items[1].innerHTML = `Reading time at ${readingSpeedSelect.value} wpm is <strong>${stats.readingTime}</strong>.`;
        }
        if (items[2]) {
            items[2].innerHTML = `Download the CSV to archive these ${stats.words} words with full metrics.`;
        }
        if (items[3]) {
            items[3].innerHTML = countAllCharactersToggle.checked
                ? "Whitespace is included in the character totals. Toggle the option to exclude it." : "Whitespace is excluded from character totals. Enable the option to include it.";
        }
        if (items[4]) {
            items[4].innerHTML = `Unique word count stands at <strong>${stats.uniqueWords}</strong> (${stats.lexicalDensity}).`;
        }
    }

    function updateBadges(readingMinutes, speakingMinutes) {
        readingTimeBadge.textContent = `Reading: ${formatDuration(readingMinutes)}`;
        speakingTimeBadge.textContent = `Speaking: ${formatDuration(speakingMinutes)}`;
    }

    function analyze(force = false) {
        enforceInputLimit();
        const text = inputText.value.replace(/\r\n/g, "\n");
        if (!force && !liveUpdateToggle.checked) {
            return;
        }
        const options = {
            ignoreNumbers: ignoreNumbersToggle.checked,
            ignorePunctuation: ignorePunctuationToggle.checked,
            countSpaces: countAllCharactersToggle.checked
        };
        const tokens = tokenize(text, options);
        const words = countWords(tokens);
        const sentences = computeSentenceCount(text);
        const paragraphs = computeParagraphCount(text);
        const uniqueWords = new Set(tokens.map((token) => token.toLowerCase())).size;
        const longestWord = tokens.reduce((longest, token) => (token.length > longest.length ? token : longest), "");

        const charactersAll = options.countSpaces ? text.length : text.replace(/\s+/g, "").length;
        const charactersNoSpaces = text.replace(/\s+/g, "").length;

        const avgWordsSentence = sentences ? (words / sentences).toFixed(1) : "0";
        const avgCharsWord = words ? (charactersNoSpaces / words).toFixed(2) : "0";
        const whitespacePct = formatPercentage(computeWhitespaceRatio(text));
        const lexicalDensityPct = words ? formatPercentage((uniqueWords / words) * 100) : "0%";

        const readingSpeed = parseInt(readingSpeedSelect.value, 10) || 200;
        const readingMinutes = words / readingSpeed;
        const speakingMinutes = words / SPEAKING_SPEED_WPM;

        wordsStat.textContent = words.toLocaleString();
        charactersWithSpacesStat.textContent = charactersAll.toLocaleString();
        charactersNoSpacesStat.textContent = charactersNoSpaces.toLocaleString();
        sentencesStat.textContent = sentences.toLocaleString();
        paragraphsStat.textContent = paragraphs.toLocaleString();
        longestWordStat.textContent = longestWord || "–";

        avgWordsPerSentence.textContent = avgWordsSentence;
        avgCharsPerWord.textContent = avgCharsWord;
        whitespaceRatio.textContent = whitespacePct;
        uniqueWordsStat.textContent = uniqueWords.toLocaleString();
        lexicalDensity.textContent = lexicalDensityPct;

        updateBadges(readingMinutes, speakingMinutes);

        const summaryStats = {
            words: words.toLocaleString(),
            charactersWithSpaces: charactersAll.toLocaleString(),
            charactersNoSpaces: charactersNoSpaces.toLocaleString(),
            sentences: sentences.toLocaleString(),
            paragraphs: paragraphs.toLocaleString(),
            longestWord,
            avgWordsPerSentence: avgWordsSentence,
            avgCharsPerWord: avgCharsWord,
            uniqueWords: uniqueWords.toLocaleString(),
            lexicalDensity: lexicalDensityPct,
            whitespaceRatio: whitespacePct,
            readingTime: formatDuration(readingMinutes),
            speakingTime: formatDuration(speakingMinutes)
        };

        lastSummary = generateSummary(summaryStats);
        updateInsights(summaryStats);
        showStatus("Analysis updated.", "success");
    }

    function scheduleAnalyze() {
        if (!liveUpdateToggle.checked) {
            return;
        }
        clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => analyze(true), 220);
    }

    function updateInputCounters() {
        const text = inputText.value.replace(/\r\n/g, "\n");
        const chars = text.length;
        const words = tokenize(text, {
            ignoreNumbers: false,
            ignorePunctuation: false
        }).length;
        charCount.textContent = `${chars.toLocaleString()} ${chars === 1 ? "character" : "characters"}`;
        wordCount.textContent = `${words.toLocaleString()} ${words === 1 ? "word" : "words"}`;
    }

    function copySummary() {
        if (!lastSummary.trim()) {
            showStatus("Generate a summary before copying.", "warn");
            return;
        }
        if (navigator.clipboard?.writeText) {
            navigator.clipboard
                .writeText(lastSummary)
                .then(() => showStatus("Summary copied to clipboard.", "success"))
                .catch(() => showStatus("Clipboard access blocked. Try manual copy.", "error"));
            return;
        }
        const temp = document.createElement("textarea");
        temp.value = lastSummary;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand("copy");
            showStatus("Summary copied to clipboard.", "success");
        } catch (error) {
            showStatus("Clipboard copy is not supported in this browser.", "error");
        }
        document.body.removeChild(temp);
    }

    function loadSample() {
        inputText.value = SAMPLE_TEXT;
        updateInputCounters();
        analyze(true);
        inputText.focus();
        inputText.setSelectionRange(inputText.value.length, inputText.value.length);
    }

    function clearAll() {
        inputText.value = "";
        lastSummary = "";
        updateInputCounters();
        analyze(true);
        showStatus("Cleared the input and stats.", "warn");
        inputText.focus();
    }

    function bindEvents() {
        inputText.addEventListener("input", () => {
            enforceInputLimit();
            updateInputCounters();
            scheduleAnalyze();
        });

        [ignoreNumbersToggle, ignorePunctuationToggle, countAllCharactersToggle, readingSpeedSelect].forEach((control) => {
            control.addEventListener("change", () => analyze(true));
        });

        liveUpdateToggle.addEventListener("change", () => {
            if (liveUpdateToggle.checked) {
                scheduleAnalyze();
            } else {
                showStatus("Live updating paused. Use Recalculate to refresh results.", "warn");
            }
        });

        analyzeBtn.addEventListener("click", () => analyze(true));
        copyReportBtn.addEventListener("click", copySummary);
        downloadBtn.addEventListener("click", () => {
            if (!lastSummary.trim()) {
                analyze(true);
            }
            if (!lastSummary.trim()) {
                showStatus("No data to export yet.", "warn");
                return;
            }
            downloadCSV({
                words: wordsStat.textContent,
                charactersWithSpaces: charactersWithSpacesStat.textContent,
                charactersNoSpaces: charactersNoSpacesStat.textContent,
                sentences: sentencesStat.textContent,
                paragraphs: paragraphsStat.textContent,
                longestWord: longestWordStat.textContent === "–" ? "" : longestWordStat.textContent,
                avgWordsPerSentence: avgWordsPerSentence.textContent,
                avgCharsPerWord: avgCharsPerWord.textContent,
                uniqueWords: uniqueWordsStat.textContent,
                lexicalDensity: lexicalDensity.textContent,
                whitespaceRatio: whitespaceRatio.textContent,
                readingTime: formatDuration(parseFloat(readingSpeedSelect.value) ? Number(wordsStat.textContent.replace(/,/g, "")) / parseFloat(readingSpeedSelect.value) : 0),
                speakingTime: formatDuration(Number(wordsStat.textContent.replace(/,/g, "")) / SPEAKING_SPEED_WPM)
            });
        });

        loadSampleBtn.addEventListener("click", loadSample);
        clearBtn.addEventListener("click", clearAll);
    }

    function init() {
        updateInputCounters();
        bindEvents();
        analyze(true);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
