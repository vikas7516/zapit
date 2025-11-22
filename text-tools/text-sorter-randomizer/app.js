document.addEventListener("DOMContentLoaded", () => {
    const inputText = document.getElementById("inputText");
    const outputText = document.getElementById("outputText");

    const loadSampleBtn = document.getElementById("loadSampleBtn");
    const clearBtn = document.getElementById("clearBtn");
    const copyInputBtn = document.getElementById("copyInputBtn");
    const sortAscBtn = document.getElementById("sortAscBtn");
    const sortDescBtn = document.getElementById("sortDescBtn");
    const shuffleBtn = document.getElementById("shuffleBtn");
    const copyOutputBtn = document.getElementById("copyOutputBtn");
    const downloadBtn = document.getElementById("downloadBtn");

    const trimLinesCheckbox = document.getElementById("trimLines");
    const removeBlanksCheckbox = document.getElementById("removeBlanks");
    const dedupeCheckbox = document.getElementById("dedupe");
    const caseSensitiveCheckbox = document.getElementById("caseSensitive");
    const naturalSortCheckbox = document.getElementById("naturalSort");
    const sortModeSelect = document.getElementById("sortMode");
    const sampleSizeInput = document.getElementById("sampleSize");

    const statusBanner = document.getElementById("statusBanner");
    const lineCount = document.getElementById("lineCount");
    const charCount = document.getElementById("charCount");

    const operationBadge = document.getElementById("operationBadge");
    const totalLinesStat = document.getElementById("totalLinesStat");
    const uniqueLinesStat = document.getElementById("uniqueLinesStat");
    const blankLinesStat = document.getElementById("blankLinesStat");
    const dedupeStat = document.getElementById("dedupeStat");
    const lastActionStat = document.getElementById("lastActionStat");
    const timeStat = document.getElementById("timeStat");
    const statsNote = document.getElementById("statsNote");

    const SAMPLE_LINES = `Grocery - Apples\nGrocery - Bananas\nGrocery - Carrots\nHardware - Sandpaper\nHardware - Nails (2 inch)\nHardware - Nails (3 inch)\nBooks - Creativity, Inc.\nBooks - Atomic Habits\nGrocery - Apples\nHardware - Paintbrush (1 inch)`;

    let lastOperation = null;

    function showStatus(message, tone = "info") {
        if (!statusBanner) return;
        const tones = ["success", "warn", "error", "info"];
        statusBanner.className = "notification";
        tones.forEach((name) => statusBanner.classList.remove(name));
        statusBanner.classList.remove("hidden");
        if (tone !== "info" && tone) {
            statusBanner.classList.add(tone);
        }
        statusBanner.textContent = message;
    }

    function hideStatus() {
        if (!statusBanner) return;
        statusBanner.className = "notification hidden";
        statusBanner.textContent = "";
    }

    function getOptions() {
        const sampleValue = Number.parseInt(sampleSizeInput.value, 10);
        const sampleSize = Number.isFinite(sampleValue) && sampleValue > 0 ? sampleValue : 0;
        return {
            trimLines: trimLinesCheckbox.checked,
            removeBlanks: removeBlanksCheckbox.checked,
            dedupe: dedupeCheckbox.checked,
            caseSensitive: caseSensitiveCheckbox.checked,
            naturalSort: naturalSortCheckbox.checked,
            sortMode: sortModeSelect.value,
            sampleSize,
        };
    }

    function updateInputStats() {
        const raw = inputText.value;
        const lines = raw.length ? raw.split(/\r?\n/) : [];
        lineCount.textContent = `${lines.length} ${lines.length === 1 ? "line" : "lines"}`;
        charCount.textContent = `${raw.length} ${raw.length === 1 ? "character" : "characters"}`;
    }

    function preprocessLines(rawText, options) {
        const rawLines = rawText.length ? rawText.split(/\r?\n/) : [];
        const processed = [];
        const seen = new Set();
        let blankLines = 0;
        let duplicatesRemoved = 0;

        rawLines.forEach((line, index) => {
            let value = options.trimLines ? line.trim() : line;
            const isBlank = value.length === 0;

            if (isBlank) {
                blankLines += 1;
                if (options.removeBlanks) {
                    return;
                }
            }

            const key = options.caseSensitive ? value : value.toLowerCase();
            if (options.dedupe && seen.has(key)) {
                duplicatesRemoved += 1;
                return;
            }

            if (options.dedupe) {
                seen.add(key);
            }

            processed.push({
                value,
                key,
                index,
            });
        });

        return {
            lines: processed,
            stats: {
                totalLines: rawLines.length,
                blankLines,
                duplicatesRemoved,
            },
        };
    }

    function collatorFor(options) {
        return new Intl.Collator(undefined, {
            numeric: options.naturalSort,
            sensitivity: options.caseSensitive ? "variant" : "base",
        });
    }

    function sortProcessedLines(lines, options, direction) {
        const collator = collatorFor(options);
        let sorted = [...lines];

        if (options.sortMode === "alpha") {
            sorted.sort((a, b) => collator.compare(a.value, b.value));
        } else if (options.sortMode === "length") {
            sorted.sort((a, b) => {
                if (a.value.length === b.value.length) {
                    return collator.compare(a.value, b.value);
                }
                return a.value.length - b.value.length;
            });
        } else if (options.sortMode === "input") {
            sorted = [...lines];
        }

        if (direction === "desc") {
            sorted.reverse();
        }

        return sorted;
    }

    function shuffleLines(lines) {
        const shuffled = [...lines];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
            const randomArray = new Uint32Array(1);
            if (window.crypto && window.crypto.getRandomValues) {
                window.crypto.getRandomValues(randomArray);
            } else {
                randomArray[0] = Math.floor(Math.random() * (i + 1));
            }
            const j = randomArray[0] % (i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function applySample(lines, sampleSize) {
        if (!sampleSize) return lines;
        return lines.slice(0, Math.min(sampleSize, lines.length));
    }

    function formatOperationSummary(operation, options, sampleApplied) {
        const parts = [operation];
        if (options.dedupe) parts.push("deduped");
        if (options.removeBlanks) parts.push("blank lines removed");
        if (sampleApplied) parts.push(`sampled (${sampleApplied})`);
        return parts.join(" • ");
    }

    function updateStatsDisplay(outputLines, duplicatesRemoved, elapsedMs, summary) {
        const options = getOptions();
        const uniqueSet = new Set();
        outputLines.forEach((line) => {
            const key = options.caseSensitive ? line.value : line.value.toLowerCase();
            uniqueSet.add(key);
        });

        const blankLines = outputLines.filter((line) => line.value.length === 0).length;

        totalLinesStat.textContent = outputLines.length.toString();
        uniqueLinesStat.textContent = uniqueSet.size.toString();
        blankLinesStat.textContent = blankLines.toString();
        dedupeStat.textContent = duplicatesRemoved.toString();
        timeStat.textContent = `${Math.max(1, Math.round(elapsedMs))} ms`;
        statsNote.textContent = summary || "Operation complete.";
    }

    function setOperationBadge(text) {
        operationBadge.textContent = text;
    }

    function writeOutput(lines) {
        const text = lines.map((line) => line.value).join("\n");
        outputText.value = text;
        outputText.scrollTop = 0;
    }

    function handleSort(direction) {
        const started = performance.now();
        const options = getOptions();
        const { lines, stats } = preprocessLines(inputText.value, options);

        if (!lines.length) {
            writeOutput([]);
        updateStatsDisplay([], 0, performance.now() - started, "No lines to process yet.");
            setOperationBadge("Awaiting input");
            lastActionStat.textContent = "–";
            showStatus("Add some lines before sorting.", "warn");
            return;
        }

        const sorted = sortProcessedLines(lines, options, direction);
        const sampled = applySample(sorted, options.sampleSize);
        const elapsed = performance.now() - started;
        const sampleApplied = options.sampleSize ? sampled.length : 0;

        writeOutput(sampled);
        const summary = formatOperationSummary(
            `${direction === "desc" ? "Sorted descending" : "Sorted ascending"} (${options.sortMode === "alpha" ? "alphabetical" : options.sortMode === "length" ? "length" : "input order"})`,
            options,
            sampleApplied
        );
    updateStatsDisplay(sampled, options.dedupe ? stats.duplicatesRemoved : 0, elapsed, summary);
        setOperationBadge(summary);
        lastActionStat.textContent = summary;
        showStatus("Sorting complete.", "success");
        lastOperation = {
            type: "sort",
            direction,
            options,
            summary,
        };
    }

    function handleShuffle() {
        const started = performance.now();
        const options = getOptions();
        const { lines, stats } = preprocessLines(inputText.value, options);

        if (lines.length < 2) {
            writeOutput(lines);
        updateStatsDisplay(lines, options.dedupe ? stats.duplicatesRemoved : 0, performance.now() - started, "Need at least two lines to shuffle.");
            setOperationBadge("Shuffle skipped");
            lastActionStat.textContent = "–";
            showStatus("Enter two or more lines to shuffle.", "warn");
            return;
        }

        const shuffled = shuffleLines(lines);
        const sampled = applySample(shuffled, options.sampleSize);
        const elapsed = performance.now() - started;
        const sampleApplied = options.sampleSize ? sampled.length : 0;

        writeOutput(sampled);
        const summary = formatOperationSummary("Shuffled", options, sampleApplied);
    updateStatsDisplay(sampled, options.dedupe ? stats.duplicatesRemoved : 0, elapsed, summary);
        setOperationBadge(summary);
        lastActionStat.textContent = summary;
        showStatus("Lines shuffled.", "success");
        lastOperation = {
            type: "shuffle",
            options,
            summary,
        };
    }

    function copyToClipboard(text, successMessage) {
        if (!navigator.clipboard) {
            showStatus("Clipboard access isn't supported in this browser.", "error");
            return;
        }
        navigator.clipboard
            .writeText(text)
            .then(() => showStatus(successMessage, "success"))
            .catch(() => showStatus("Clipboard copy failed. Check browser permissions.", "error"));
    }

    inputText.addEventListener("input", () => {
        updateInputStats();
        hideStatus();
    });

    sampleSizeInput.addEventListener("change", () => {
        const value = Number.parseInt(sampleSizeInput.value, 10);
        if (!Number.isFinite(value) || value < 0) {
            sampleSizeInput.value = "0";
        }
    });

    sortAscBtn.addEventListener("click", () => handleSort("asc"));
    sortDescBtn.addEventListener("click", () => handleSort("desc"));
    shuffleBtn.addEventListener("click", handleShuffle);

    loadSampleBtn.addEventListener("click", () => {
        inputText.value = SAMPLE_LINES;
        updateInputStats();
        hideStatus();
        showStatus("Sample grocery, hardware, and book list loaded.", "success");
    });

    clearBtn.addEventListener("click", () => {
        inputText.value = "";
        outputText.value = "";
        updateInputStats();
        totalLinesStat.textContent = "0";
        uniqueLinesStat.textContent = "0";
        blankLinesStat.textContent = "0";
        dedupeStat.textContent = "0";
        lastActionStat.textContent = "–";
        timeStat.textContent = "0 ms";
        statsNote.textContent = "No output yet.";
        setOperationBadge("No operation yet");
        hideStatus();
        showStatus("Input cleared.", "info");
        lastOperation = null;
    });

    copyInputBtn.addEventListener("click", () => {
        if (!inputText.value) {
            showStatus("There's no input to copy yet.", "warn");
            return;
        }
        copyToClipboard(inputText.value, "Input copied to clipboard.");
    });

    copyOutputBtn.addEventListener("click", () => {
        if (!outputText.value) {
            showStatus("Run an operation before copying the output.", "warn");
            return;
        }
        copyToClipboard(outputText.value, "Output copied to clipboard.");
    });

    downloadBtn.addEventListener("click", () => {
        if (!outputText.value) {
            showStatus("Nothing to download yet. Run a sort or shuffle.", "warn");
            return;
        }
        const blob = new Blob([outputText.value], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "sorted-lines.txt";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
        }, 0);
        showStatus("Text file downloaded.", "success");
    });

    [trimLinesCheckbox, removeBlanksCheckbox, dedupeCheckbox, caseSensitiveCheckbox, naturalSortCheckbox, sortModeSelect].forEach((control) => {
        control.addEventListener("change", () => {
            if (lastOperation) {
                if (lastOperation.type === "sort") {
                    handleSort(lastOperation.direction || "asc");
                } else if (lastOperation.type === "shuffle") {
                    handleShuffle();
                }
            }
        });
    });

    hideStatus();
    updateInputStats();
});
