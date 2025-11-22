(function () {
    "use strict";

    const MAX_LENGTH = 200000;

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    const sourceText = $("#sourceText");
    const caseSensitive = $("#caseSensitive");
    const trimWhitespace = $("#trimWhitespace");
    const ignoreBlankLines = $("#ignoreBlankLines");
    const sortOutput = $("#sortOutput");
    const showDuplicateList = $("#showDuplicateList");

    const processBtn = $("#processBtn");
    const clearBtn = $("#clearBtn");
    const copyInputBtn = $("#copyInputBtn");
    const copyResultBtn = $("#copyResultBtn");
    const downloadResultBtn = $("#downloadResultBtn");
    const loadSampleBtn = $("#loadSampleBtn");

    const uniquePanel = $("#uniquePanel");
    const duplicatePanel = $("#duplicatePanel");
    const resultsTabs = $$(".tab-btn");

    const inputLineStat = $("#inputLineStat");
    const uniqueLineStat = $("#uniqueLineStat");
    const duplicateRemovedStat = $("#duplicateRemovedStat");
    const blankRemovedStat = $("#blankRemovedStat");
    const timeStat = $("#timeStat");

    const statusBanner = $("#statusBanner");

    let activePanel = "uniquePanel";
    let lastResult = {
        uniqueText: "",
        duplicates: [],
        stats: {
            inputLines: 0,
            uniqueLines: 0,
            duplicatesRemoved: 0,
            blanksRemoved: 0,
            timeMs: 0
        }
    };

    function showStatus(message, tone) {
        statusBanner.textContent = message;
        statusBanner.classList.remove("hidden", "success", "warn", "error");
        if (tone) {
            statusBanner.classList.add(tone);
        }
        clearTimeout(showStatus._timer);
        showStatus._timer = setTimeout(() => {
            statusBanner.classList.add("hidden");
        }, 3500);
    }

    function togglePanels(targetId) {
        activePanel = targetId;
        if (targetId === "duplicatePanel") {
            duplicatePanel.classList.remove("hidden");
            uniquePanel.classList.add("hidden");
        } else {
            uniquePanel.classList.remove("hidden");
            duplicatePanel.classList.add("hidden");
        }
    }

    function updateStats(stats) {
        inputLineStat.textContent = stats.inputLines.toString();
        uniqueLineStat.textContent = stats.uniqueLines.toString();
        duplicateRemovedStat.textContent = stats.duplicatesRemoved.toString();
        blankRemovedStat.textContent = stats.blanksRemoved.toString();
        timeStat.textContent = `${stats.timeMs} ms`;
    }

    function renderDuplicates(duplicates) {
        if (!duplicates.length || !showDuplicateList.checked) {
            duplicatePanel.innerHTML = '<div class="duplicate-empty">No duplicates to show. Enable the option above or process text that contains duplicates.</div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        duplicates.forEach((item) => {
            const row = document.createElement("div");
            row.className = "duplicate-row";

            const lineSpan = document.createElement("div");
            lineSpan.className = "duplicate-line";
            lineSpan.textContent = item.line || "(blank line)";

            const countSpan = document.createElement("span");
            countSpan.className = "duplicate-count";
            countSpan.textContent = `×${item.count}`;

            row.appendChild(lineSpan);
            row.appendChild(countSpan);
            fragment.appendChild(row);
        });

        duplicatePanel.innerHTML = "";
        duplicatePanel.appendChild(fragment);
    }

    function formatUniqueText(lines) {
        return lines.join("\n");
    }

    function processText() {
        const raw = sourceText.value;

        if (!raw.trim()) {
            showStatus("Add some text first. Paste lines into the input box.", "warn");
            sourceText.focus();
            return;
        }

        if (raw.length > MAX_LENGTH) {
            showStatus(`Input exceeds ${MAX_LENGTH.toLocaleString()} characters. Please shorten the text.`, "error");
            return;
        }

        const start = performance.now();
        const lines = raw.replace(/\r\n/g, "\n").split("\n");
        const blanksRemoved = { count: 0 };

        const processed = lines.reduce((acc, originalLine) => {
            let line = trimWhitespace.checked ? originalLine.trim() : originalLine;
            if (ignoreBlankLines.checked && line.length === 0) {
                blanksRemoved.count += 1;
                return acc;
            }
            const key = caseSensitive.checked ? line : line.toLowerCase();
            acc.push({ key, line, originalLine });
            return acc;
        }, []);

        const seen = new Map();
        const uniqueLines = [];
        const duplicatesMap = new Map();

        processed.forEach(({ key, line }) => {
            if (!seen.has(key)) {
                seen.set(key, { line, count: 1 });
                uniqueLines.push(line);
            } else {
                const info = seen.get(key);
                info.count += 1;
                duplicatesMap.set(key, { line: info.line, count: info.count });
            }
        });

        let outputLines = uniqueLines.slice();
        if (sortOutput.checked) {
            outputLines = outputLines.slice().sort((a, b) => a.localeCompare(b, undefined, { sensitivity: caseSensitive.checked ? "variant" : "base" }));
        }

        const duplicates = Array.from(duplicatesMap.values()).map((item) => ({
            line: item.line,
            count: item.count
        }));

        const elapsed = Math.max(0, Math.round(performance.now() - start));

        uniquePanel.textContent = formatUniqueText(outputLines);
        if (activePanel === "uniquePanel") {
            togglePanels("uniquePanel");
        } else {
            togglePanels("duplicatePanel");
        }

        renderDuplicates(duplicates);

        const stats = {
            inputLines: lines.length,
            uniqueLines: outputLines.length,
            duplicatesRemoved: Math.max(0, processed.length - outputLines.length),
            blanksRemoved: blanksRemoved.count,
            timeMs: elapsed
        };

        updateStats(stats);

        lastResult = {
            uniqueText: uniquePanel.textContent,
            duplicates,
            stats
        };

        showStatus("Duplicates removed successfully.", "success");
    }

    function copyToClipboard(text, successMessage) {
        if (!text) {
            showStatus("Nothing to copy yet. Process the text first.", "warn");
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
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
        if (!lastResult.uniqueText) {
            showStatus("Generate a result before downloading.", "warn");
            return;
        }

        const blob = new Blob([lastResult.uniqueText], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "deduplicated-lines.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1500);
        showStatus("Download ready.", "success");
    }

    function clearAll() {
        sourceText.value = "";
        uniquePanel.textContent = "";
        duplicatePanel.innerHTML = "";
        updateStats({ inputLines: 0, uniqueLines: 0, duplicatesRemoved: 0, blanksRemoved: 0, timeMs: 0 });
        lastResult = {
            uniqueText: "",
            duplicates: [],
            stats: {
                inputLines: 0,
                uniqueLines: 0,
                duplicatesRemoved: 0,
                blanksRemoved: 0,
                timeMs: 0
            }
        };
        togglePanels("uniquePanel");
        showStatus("Cleared the input and results.", "warn");
        sourceText.focus();
    }

    function loadSample() {
        const sample = `Apples\nBananas\nCarrots\nBananas\nKale\ncarrots\n  Apples  \n\nSpinach\nspinach\n`;
        sourceText.value = sample;
        processText();
        sourceText.focus();
        sourceText.setSelectionRange(sourceText.value.length, sourceText.value.length);
    }

    function copyInput() {
        const value = sourceText.value;
        if (!value) {
            showStatus("There's nothing in the input to copy.", "warn");
            return;
        }
        copyToClipboard(value, "Original text copied.");
    }

    function handleTabClick(event) {
        const button = event.currentTarget;
        const target = button.dataset.target;
        if (button.classList.contains("active")) {
            return;
        }
        resultsTabs.forEach((btn) => {
            const isActive = btn === button;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        togglePanels(target);
        if (target === "uniquePanel") {
            uniquePanel.focus();
        }
    }

    function syncDuplicateVisibility() {
        if (!showDuplicateList.checked) {
            duplicatePanel.classList.add("hidden");
            resultsTabs.forEach((btn) => {
                if (btn.dataset.target === "duplicatePanel") {
                    btn.setAttribute("disabled", "true");
                    btn.classList.add("disabled");
                }
            });
            if (activePanel === "duplicatePanel") {
                resultsTabs.forEach((btn) => {
                    if (btn.dataset.target === "uniquePanel") {
                        btn.classList.add("active");
                        btn.setAttribute("aria-selected", "true");
                    } else {
                        btn.classList.remove("active");
                        btn.setAttribute("aria-selected", "false");
                    }
                });
                togglePanels("uniquePanel");
            }
        } else {
            resultsTabs.forEach((btn) => {
                if (btn.dataset.target === "duplicatePanel") {
                    btn.removeAttribute("disabled");
                    btn.classList.remove("disabled");
                }
            });
            if (activePanel === "duplicatePanel") {
                togglePanels("duplicatePanel");
            }
            renderDuplicates(lastResult.duplicates || []);
        }
    }

    function bindEvents() {
        processBtn.addEventListener("click", processText);
        clearBtn.addEventListener("click", clearAll);
        copyInputBtn.addEventListener("click", copyInput);
        copyResultBtn.addEventListener("click", () => copyToClipboard(lastResult.uniqueText, "Cleaned text copied."));
        downloadResultBtn.addEventListener("click", downloadResult);
        loadSampleBtn.addEventListener("click", loadSample);

        [caseSensitive, trimWhitespace, ignoreBlankLines, sortOutput].forEach((input) => {
            input.addEventListener("change", () => {
                if (lastResult.uniqueText || sourceText.value.trim()) {
                    processText();
                }
            });
        });

        showDuplicateList.addEventListener("change", () => {
            syncDuplicateVisibility();
            if (showDuplicateList.checked && (lastResult.duplicates || []).length === 0 && sourceText.value.trim()) {
                processText();
            }
        });

        sourceText.addEventListener("input", () => {
            if (!sourceText.value) {
                updateStats({ inputLines: 0, uniqueLines: 0, duplicatesRemoved: 0, blanksRemoved: 0, timeMs: 0 });
                uniquePanel.textContent = "";
                duplicatePanel.innerHTML = "";
            }
        });

        resultsTabs.forEach((btn) => btn.addEventListener("click", handleTabClick));
    }

    function init() {
        bindEvents();
        syncDuplicateVisibility();
        updateStats(lastResult.stats);
        togglePanels(activePanel);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
