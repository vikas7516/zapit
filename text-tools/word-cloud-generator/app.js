(function () {
    "use strict";

    const MAX_INPUT_LENGTH = 20000;
    const DEFAULT_SAMPLE = `Unlock instant insights with Zapit's productivity suite. Word clouds spotlight keywords, reveal themes, and keep teams aligned in seconds. Paste meeting notes, brainstorm ideas, or customer feedback to visualize top phrases. Toggle stop-word filtering to focus on essentials, tweak colors for presentations, and export the results anywhere.`;

    const STOP_WORDS = new Set([
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
    ]);

    const COLOR_SCHEMES = {
        default: ["#8aa8ff", "#d4dcff", "#a3b8ff", "#7695ff", "#405efa", "#25379c"],
        vivid: ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#5f27cd", "#ff9ff3"],
        pastel: ["#ffdccc", "#d3f4ff", "#f3e6ff", "#def6e5", "#ffe8f8", "#edf1ff"],
        mono: ["#f8fbff", "#e1e8ff", "#c9d6ff", "#b0c4ff", "#98b2ff", "#7d9bff"],
        random: []
    };

    const FONT_FAMILY = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';

    const $ = (selector) => document.querySelector(selector);

    const inputText = $("#inputText");
    const charCount = $("#charCount");
    const wordCount = $("#wordCount");
    const statusBanner = $("#statusBanner");
    const minFrequencyInput = $("#minFrequencyInput");
    const maxWordsInput = $("#maxWordsInput");
    const ignoreCommonToggle = $("#ignoreCommonToggle");
    const caseSensitiveToggle = $("#caseSensitiveToggle");
    const showCountsToggle = $("#showCountsToggle");
    const colorSchemeSelect = $("#colorSchemeSelect");
    const generateBtn = $("#generateBtn");
    const downloadImgBtn = $("#downloadImgBtn");
    const downloadCsvBtn = $("#downloadCsvBtn");
    const loadSampleBtn = $("#loadSampleBtn");
    const clearBtn = $("#clearBtn");

    const wordCloudCanvas = $("#wordCloudCanvas");
    const cloudPreview = wordCloudCanvas?.parentElement;

    const cloudWordsBadge = $("#cloudWordsBadge");
    const cloudColorsBadge = $("#cloudColorsBadge");
    const uniqueWordsStat = $("#uniqueWordsStat");
    const maxFrequencyStat = $("#maxFrequencyStat");
    const totalWordsStat = $("#totalWordsStat");
    const cloudAreaStat = $("#cloudAreaStat");
    const statsNote = $("#statsNote");
    const tipsList = $("#tipsList");

    let pendingTimer = null;
    let currentSignature = "";
    let currentState = {
        words: [],
        placedWords: [],
        canvasWidth: 0,
        canvasHeight: 0,
        devicePixelRatio: 1,
        ctx: null
    };
    let selectedWordKey = null;
    let lastGeneratedStats = {
        totalWords: 0,
        uniqueWords: 0,
        keptWords: 0,
        maxFrequency: 0,
        ignoredStopWords: 0,
        generationMs: 0
    };

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
        }, 3800);
    }

    function clampNumber(value, min, max, fallback) {
        const num = Number.parseInt(value, 10);
        if (Number.isNaN(num)) return fallback;
        if (!Number.isFinite(num)) return fallback;
        if (min !== undefined && num < min) return min;
        if (max !== undefined && num > max) return max;
        return num;
    }

    function updateInputStats() {
        if (!inputText) return;
        const value = inputText.value || "";
        if (value.length > MAX_INPUT_LENGTH) {
            inputText.value = value.slice(0, MAX_INPUT_LENGTH);
        }
        const sanitized = inputText.value || "";
        const characters = sanitized.length;
        const words = sanitized.trim() ? sanitized.trim().split(/\s+/).length : 0;
        if (charCount) {
            charCount.textContent = `${characters} / ${MAX_INPUT_LENGTH} characters`;
        }
        if (wordCount) {
            wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
        }
    }

    function collectOptions() {
        const minFrequency = clampNumber(minFrequencyInput?.value, 1, 9999, 1);
        const maxWords = clampNumber(maxWordsInput?.value, 10, 300, 50);

        if (minFrequencyInput) {
            minFrequencyInput.value = String(minFrequency);
        }
        if (maxWordsInput) {
            maxWordsInput.value = String(maxWords);
        }

        return {
            minFrequency,
            maxWords,
            ignoreCommon: Boolean(ignoreCommonToggle?.checked),
            caseSensitive: Boolean(caseSensitiveToggle?.checked),
            showCounts: Boolean(showCountsToggle?.checked),
            colorScheme: colorSchemeSelect?.value || "default"
        };
    }

    function toTitleCase(word) {
        if (!word) return word;
        const lower = word.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    function tokenize(text) {
        if (!text) return [];
        const matches = text.match(/[\p{L}\p{N}'’\-]+/gu);
        if (!matches) return [];
        return matches.map((token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")).filter(Boolean);
    }

    function analyzeText(text, options) {
        const tokens = tokenize(text);
        const totalWords = tokens.length;
        const frequencies = new Map();
        let ignoredStopWords = 0;

        for (const rawToken of tokens) {
            if (!rawToken) continue;
            const normalizedKey = options.caseSensitive ? rawToken : rawToken.toLowerCase();
            const stopWordKey = normalizedKey.toLowerCase();
            if (options.ignoreCommon && STOP_WORDS.has(stopWordKey)) {
                ignoredStopWords += 1;
                continue;
            }

            const entry = frequencies.get(normalizedKey) || {
                key: normalizedKey,
                display: options.caseSensitive ? rawToken : toTitleCase(rawToken),
                count: 0
            };

            // Preserve the first encountered display form for case-insensitive mode.
            if (!options.caseSensitive && entry.count === 0) {
                entry.display = toTitleCase(rawToken);
            }

            // If case sensitive, update display to latest token (keeps user input).
            if (options.caseSensitive) {
                entry.display = rawToken;
            }

            entry.count += 1;
            frequencies.set(normalizedKey, entry);
        }

        const entries = Array.from(frequencies.values()).filter((entry) => entry.count >= options.minFrequency);
        entries.sort((a, b) => {
            if (b.count === a.count) {
                return a.display.localeCompare(b.display, undefined, { sensitivity: "base" });
            }
            return b.count - a.count;
        });

        const limited = entries.slice(0, options.maxWords);
        const maxFrequency = limited.length ? limited[0].count : 0;

        return {
            words: limited,
            stats: {
                totalWords,
                uniqueWords: frequencies.size,
                keptWords: limited.length,
                maxFrequency,
                ignoredStopWords
            }
        };
    }

    function buildColorPalette(scheme, words) {
        if (scheme !== "random") {
            return COLOR_SCHEMES[scheme] && COLOR_SCHEMES[scheme].length ? COLOR_SCHEMES[scheme] : COLOR_SCHEMES.default;
        }
        // Deterministic palette derived from word hashes.
        return words.map((word) => {
            const hash = Array.from(word.key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const hue = (hash * 47) % 360;
            const saturation = 55 + (hash % 25);
            const lightness = 45 + (hash % 18);
            return `hsl(${hue} ${saturation}% ${lightness}%)`;
        });
    }

    function colorForWord(palette, index) {
        if (!palette.length) return "#ffffff";
        return palette[index % palette.length];
    }

    function prepareCanvas(canvas) {
        const context = canvas.getContext("2d");
        if (!context) {
            return null;
        }
        const rect = canvas.getBoundingClientRect();
        const baseWidth = Math.max(360, Math.floor(rect.width || canvas.width || 900));
        const baseHeight = Math.max(240, Math.floor(rect.height || canvas.height || 420));
        const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2.5);

        canvas.width = Math.floor(baseWidth * ratio);
        canvas.height = Math.floor(baseHeight * ratio);

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.scale(ratio, ratio);
        context.clearRect(0, 0, baseWidth, baseHeight);

        return {
            ctx: context,
            width: baseWidth,
            height: baseHeight,
            ratio
        };
    }

    function intersects(box, placedBoxes) {
        for (const other of placedBoxes) {
            if (
                box.x < other.x + other.width &&
                box.x + box.width > other.x &&
                box.y < other.y + other.height &&
                box.y + box.height > other.y
            ) {
                return true;
            }
        }
        return false;
    }

    function layoutWords(words, context, width, height, options, palette) {
        const placed = [];
        const boxes = [];
        const minCount = words.length ? words[words.length - 1].count : 0;
        const maxCount = words.length ? words[0].count : 0;
        const minFont = words.length > 12 ? 16 : 20;
        const maxFont = words.length > 1 ? Math.max(42, Math.min(96, width / 6)) : Math.min(120, width / 5);
        const padding = 6;
        const coverage = { area: 0 };

        function scaleFont(count) {
            if (maxCount === minCount) return (maxFont + minFont) / 2;
            const ratio = (count - minCount) / (maxCount - minCount);
            return minFont + ratio * (maxFont - minFont);
        }

        const centerX = width / 2;
        const centerY = height / 2;
        const angleStep = 0.19;
        const radiusStep = 4.6;

        context.textAlign = "center";
        context.textBaseline = "middle";

        words.forEach((word, index) => {
            const label = options.showCounts ? `${word.display} (${word.count})` : word.display;
            const fontSize = Math.max(12, scaleFont(word.count));
            const fontWeight = fontSize >= 64 ? 700 : fontSize >= 36 ? 600 : 500;
            context.font = `${fontWeight} ${fontSize}px ${FONT_FAMILY}`;
            const metrics = context.measureText(label);
            const textWidth = metrics.width;
            const textHeight = fontSize;
            const color = colorForWord(palette, index);

            let placedSuccessfully = false;
            let attempt = 0;
            const maxAttempts = 2800;

            while (attempt < maxAttempts && !placedSuccessfully) {
                const theta = angleStep * attempt;
                const radius = radiusStep * theta;
                const x = centerX + radius * Math.cos(theta);
                const y = centerY + radius * Math.sin(theta);
                const box = {
                    x: x - textWidth / 2 - padding,
                    y: y - textHeight / 2 - padding,
                    width: textWidth + padding * 2,
                    height: textHeight + padding * 2
                };

                if (box.x < 0 || box.y < 0 || box.x + box.width > width || box.y + box.height > height) {
                    attempt += 1;
                    continue;
                }

                if (!intersects(box, boxes)) {
                    const placement = {
                        key: word.key,
                        label,
                        display: word.display,
                        count: word.count,
                        fontSize,
                        fontWeight,
                        color,
                        x,
                        y,
                        box: {
                            x: x - textWidth / 2,
                            y: y - textHeight / 2,
                            width: textWidth,
                            height: textHeight
                        }
                    };
                    placed.push(placement);
                    boxes.push(box);
                    coverage.area += box.width * box.height;
                    placedSuccessfully = true;
                }
                attempt += 1;
            }
        });

        return {
            placed,
            coverage: width && height ? Math.min(100, (coverage.area / (width * height)) * 100) : 0
        };
    }

    function drawLayout(ctx, width, height, words, highlightKey) {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const word of words) {
            ctx.font = `${word.fontWeight} ${word.fontSize}px ${FONT_FAMILY}`;
            ctx.fillStyle = word.color;

            if (highlightKey && word.key === highlightKey) {
                ctx.save();
                ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.44)";
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (typeof ctx.roundRect === "function") {
                    ctx.roundRect(word.box.x - 6, word.box.y - 6, word.box.width + 12, word.box.height + 12, 10);
                } else {
                    ctx.rect(word.box.x - 6, word.box.y - 6, word.box.width + 12, word.box.height + 12);
                }
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            ctx.fillText(word.label, word.x, word.y);
        }
    }

    function updateStatsDisplay(result, options, coverage) {
        const { totalWords, uniqueWords, keptWords, maxFrequency, ignoredStopWords } = result.stats;
        lastGeneratedStats = {
            totalWords,
            uniqueWords,
            keptWords,
            maxFrequency,
            ignoredStopWords,
            generationMs: lastGeneratedStats.generationMs
        };

        if (uniqueWordsStat) {
            uniqueWordsStat.textContent = uniqueWords.toLocaleString();
        }
        if (maxFrequencyStat) {
            maxFrequencyStat.textContent = maxFrequency.toLocaleString();
        }
        if (totalWordsStat) {
            totalWordsStat.textContent = totalWords.toLocaleString();
        }
        if (cloudAreaStat) {
            cloudAreaStat.textContent = coverage > 0 ? `${coverage.toFixed(1)}%` : "–";
        }

        const stopNote = options.ignoreCommon
            ? `${ignoredStopWords.toLocaleString()} stop words skipped`
            : "Stop words included";
        const caseNote = options.caseSensitive ? "Case-sensitive" : "Case-insensitive";
        const countNote = options.showCounts ? "Counts shown" : "Counts hidden";
        const topWord = result.words.length ? `Top word "${result.words[0].display}" appears ${result.words[0].count} times.` : "Add more text to see highlights.";

        if (statsNote) {
            statsNote.textContent = `${topWord} ${caseNote}. ${stopNote}. ${countNote}`;
        }

        if (cloudWordsBadge) {
            cloudWordsBadge.textContent = `${keptWords} ${keptWords === 1 ? "word" : "words"}`;
        }
        if (cloudColorsBadge) {
            const schemeLabel = colorSchemeSelect?.selectedOptions?.[0]?.textContent?.trim() || options.colorScheme;
            cloudColorsBadge.textContent = schemeLabel;
        }

        if (tipsList && tipsList.firstElementChild) {
            const tipMessage = result.words.length
                ? `Top keywords: ${result.words.slice(0, Math.min(5, result.words.length)).map((entry) => `"${entry.display}"`).join(", ")}. Click any word in the cloud to inspect it.`
                : "Word clouds highlight the most frequent terms—use filters to focus on what matters.";
            tipsList.firstElementChild.textContent = tipMessage;
        }
    }

    function updateEmptyState(hasWords) {
        if (cloudPreview) {
            cloudPreview.setAttribute("data-empty", hasWords ? "false" : "true");
        }
        if (wordCloudCanvas) {
            wordCloudCanvas.setAttribute(
                "aria-label",
                hasWords
                    ? `Word cloud visualization with ${currentState.words.length} keywords; top word ${currentState.words[0]?.display || "none"}.`
                    : "Word cloud preview placeholder"
            );
        }
        if (downloadImgBtn) {
            downloadImgBtn.disabled = !hasWords;
        }
        if (downloadCsvBtn) {
            downloadCsvBtn.disabled = !hasWords;
        }
    }

    function renderCloud(force = false) {
        if (!wordCloudCanvas) {
            return;
        }
        const text = inputText?.value || "";
        const options = collectOptions();
        const signature = JSON.stringify({ text, options });
        if (!force && signature === currentSignature && currentState.placedWords.length) {
            drawLayout(currentState.ctx, currentState.canvasWidth, currentState.canvasHeight, currentState.placedWords, selectedWordKey);
            return;
        }

        currentSignature = signature;

        if (!text.trim()) {
            currentState.words = [];
            currentState.placedWords = [];
            const prepared = prepareCanvas(wordCloudCanvas);
            if (prepared) {
                currentState.ctx = prepared.ctx;
                currentState.canvasWidth = prepared.width;
                currentState.canvasHeight = prepared.height;
                currentState.devicePixelRatio = prepared.ratio;
                currentState.ctx.clearRect(0, 0, prepared.width, prepared.height);
            }
            updateStatsDisplay({ stats: { totalWords: 0, uniqueWords: 0, keptWords: 0, maxFrequency: 0, ignoredStopWords: 0 }, words: [] }, options, 0);
            updateEmptyState(false);
            selectedWordKey = null;
            showStatus("Waiting for text input.", "warn");
            return;
        }

        const prepared = prepareCanvas(wordCloudCanvas);
        if (!prepared) {
            showStatus("Canvas rendering is not supported in this browser.", "error");
            return;
        }

        currentState.ctx = prepared.ctx;
        currentState.canvasWidth = prepared.width;
        currentState.canvasHeight = prepared.height;
        currentState.devicePixelRatio = prepared.ratio;

        const start = performance.now();
        const analysisResult = analyzeText(text, options);
        const palette = buildColorPalette(options.colorScheme, analysisResult.words);
        const layoutResult = layoutWords(analysisResult.words, prepared.ctx, prepared.width, prepared.height, options, palette);
        const elapsed = Math.max(0, Math.round(performance.now() - start));

        lastGeneratedStats.generationMs = elapsed;
        currentState.words = analysisResult.words;
        currentState.placedWords = layoutResult.placed;

        updateEmptyState(layoutResult.placed.length > 0);
        updateStatsDisplay(analysisResult, options, layoutResult.coverage);

        if (!layoutResult.placed.length) {
            prepared.ctx.clearRect(0, 0, prepared.width, prepared.height);
            showStatus("No words met the filter criteria. Lower the minimum frequency or add more text.", "warn");
            selectedWordKey = null;
            return;
        }

        selectedWordKey = null;
        drawLayout(prepared.ctx, prepared.width, prepared.height, layoutResult.placed, null);
        showStatus(`Word cloud generated in ${elapsed} ms.`, "success");
    }

    function scheduleRender() {
        clearTimeout(pendingTimer);
        pendingTimer = setTimeout(() => renderCloud(false), 260);
    }

    function downloadAsPng() {
        if (!currentState.placedWords.length) {
            showStatus("Generate a word cloud before downloading.", "warn");
            return;
        }
        const dataUrl = wordCloudCanvas.toDataURL("image/png");
        const anchor = document.createElement("a");
        anchor.href = dataUrl;
        anchor.download = `word-cloud-${Date.now()}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        showStatus("PNG download ready.", "success");
    }

    function downloadAsCsv() {
        if (!currentState.words.length) {
            showStatus("Generate a word cloud before downloading.", "warn");
            return;
        }
        const header = "word,count\n";
        const rows = currentState.words.map((word) => `${JSON.stringify(word.display)},${word.count}`);
        const blob = new Blob([header + rows.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `word-cloud-${Date.now()}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 800);
        showStatus("CSV download ready.", "success");
    }

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function findContextSnippet(sourceText, word, caseSensitive) {
        if (!sourceText || !word) return "";
        const boundaryWord = escapeRegExp(word);
        const flags = caseSensitive ? "g" : "gi";
        const regex = new RegExp(`[^.!?]*\\b${boundaryWord}\\b[^.!?]*[.!?]?`, flags);
        const match = regex.exec(sourceText);
        if (match && match[0]) {
            return match[0].trim();
        }
        return "";
    }

    function handleCanvasClick(event) {
        if (!currentState.placedWords.length) return;
    const rect = wordCloudCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const options = collectOptions();

        const hit = currentState.placedWords.find((word) => {
            const box = word.box;
            return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
        });

        if (hit) {
            selectedWordKey = hit.key;
            drawLayout(currentState.ctx, currentState.canvasWidth, currentState.canvasHeight, currentState.placedWords, selectedWordKey);
            const contextSnippet = findContextSnippet(inputText.value, hit.display, options.caseSensitive);
            const snippetText = contextSnippet ? `Context: ${contextSnippet}` : "No context snippet found.";
            if (statsNote) {
                statsNote.textContent = `"${hit.display}" appears ${hit.count.toLocaleString()} times. ${snippetText}`;
            }
            showStatus(`Highlighted "${hit.display}" (${hit.count}).`, "success");
        }
    }

    function loadSample() {
        if (!inputText) return;
        inputText.value = DEFAULT_SAMPLE;
        updateInputStats();
        renderCloud(true);
        inputText.focus();
        inputText.setSelectionRange(inputText.value.length, inputText.value.length);
    }

    function clearAll() {
        if (!inputText) return;
        inputText.value = "";
        updateInputStats();
        currentSignature = "";
        selectedWordKey = null;
        currentState.words = [];
        currentState.placedWords = [];
        renderCloud(true);
        showStatus("Cleared input and preview.", "warn");
        inputText.focus();
    }

    function bindEvents() {
        inputText?.addEventListener("input", () => {
            updateInputStats();
            scheduleRender();
        });
        minFrequencyInput?.addEventListener("input", scheduleRender);
        maxWordsInput?.addEventListener("input", scheduleRender);
        ignoreCommonToggle?.addEventListener("change", scheduleRender);
        caseSensitiveToggle?.addEventListener("change", scheduleRender);
        showCountsToggle?.addEventListener("change", scheduleRender);
        colorSchemeSelect?.addEventListener("change", scheduleRender);

        generateBtn?.addEventListener("click", () => renderCloud(true));
        downloadImgBtn?.addEventListener("click", downloadAsPng);
        downloadCsvBtn?.addEventListener("click", downloadAsCsv);
        loadSampleBtn?.addEventListener("click", loadSample);
        clearBtn?.addEventListener("click", clearAll);
        wordCloudCanvas?.addEventListener("click", handleCanvasClick);

        window.addEventListener("keydown", (event) => {
            if (event.ctrlKey && event.key === "Enter") {
                renderCloud(true);
            }
        });

        if ("ResizeObserver" in window && cloudPreview) {
            const resizeObserver = new ResizeObserver(() => {
                if (!inputText.value.trim()) {
                    prepareCanvas(wordCloudCanvas);
                    updateEmptyState(false);
                    return;
                }
                renderCloud(true);
            });
            resizeObserver.observe(cloudPreview);
        }

        window.addEventListener("resize", () => {
            if (inputText.value.trim()) {
                scheduleRender();
            }
        });
    }

    function init() {
        updateInputStats();
        const prepared = prepareCanvas(wordCloudCanvas);
        if (prepared) {
            currentState.ctx = prepared.ctx;
            currentState.canvasWidth = prepared.width;
            currentState.canvasHeight = prepared.height;
            currentState.devicePixelRatio = prepared.ratio;
        }
        updateEmptyState(false);
        bindEvents();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
