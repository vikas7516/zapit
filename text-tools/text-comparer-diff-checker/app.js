document.addEventListener("DOMContentLoaded", () => {
    const leftText = document.getElementById("leftText");
    const rightText = document.getElementById("rightText");
    const compareBtn = document.getElementById("compareBtn");
    const loadSampleBtn = document.getElementById("loadSampleBtn");
    const clearBtn = document.getElementById("clearBtn");
    const swapBtn = document.getElementById("swapBtn");
    const copyLeftBtn = document.getElementById("copyLeftBtn");
    const copyRightBtn = document.getElementById("copyRightBtn");
    const copyDiffBtn = document.getElementById("copyDiffBtn");
    const downloadDiffBtn = document.getElementById("downloadDiffBtn");
    const statusBanner = document.getElementById("statusBanner");
    const diffOutput = document.getElementById("diffOutput");

    const ignoreCaseCheckbox = document.getElementById("ignoreCase");
    const trimWhitespaceCheckbox = document.getElementById("trimWhitespace");
    const ignoreWhitespaceCheckbox = document.getElementById("ignoreWhitespace");
    const collapseBlankLinesCheckbox = document.getElementById("collapseBlankLines");
    const showLineNumbersCheckbox = document.getElementById("showLineNumbers");

    const addedStat = document.getElementById("addedStat");
    const removedStat = document.getElementById("removedStat");
    const unchangedStat = document.getElementById("unchangedStat");
    const similarityStat = document.getElementById("similarityStat");
    const timeStat = document.getElementById("timeStat");
    const summaryNote = document.getElementById("summaryNote");

    let latestDiffText = "";

    const SAMPLE_BASE = `# Project Roadmap\n\n- Kickoff meeting with stakeholders\n- Collect requirements\n- Create design mockups\n- Develop MVP\n- Run usability testing\n- Prepare release notes\n- Launch beta program\n`;

    const SAMPLE_REVISED = `# Project Roadmap\n\n- Kick-off alignment meeting with stakeholders\n- Gather requirements from pilot users\n- Create interactive design prototypes\n- Develop MVP\n- Run moderated usability testing sessions\n- Document release notes\n- Launch public beta\n- Plan post-launch retrospection\n`;

    function showStatus(message, tone = "info") {
        if (!statusBanner) return;

        const tones = ["success", "warn", "error", "info"];
        statusBanner.className = "notification";
        tones.forEach((name) => statusBanner.classList.remove(name));
        statusBanner.classList.remove("hidden");
        if (tone !== "info") {
            statusBanner.classList.add(tone);
        }
        statusBanner.textContent = message;
    }

    function hideStatus() {
        if (!statusBanner) return;
        statusBanner.textContent = "";
        statusBanner.classList.add("hidden");
        ["success", "warn", "error", "info"].forEach((name) => statusBanner.classList.remove(name));
    }

    function getOptions() {
        return {
            ignoreCase: ignoreCaseCheckbox.checked,
            trimWhitespace: trimWhitespaceCheckbox.checked,
            ignoreWhitespace: ignoreWhitespaceCheckbox.checked,
            collapseBlankLines: collapseBlankLinesCheckbox.checked,
            showLineNumbers: showLineNumbersCheckbox.checked,
        };
    }

    function preprocessLines(text, options) {
        const cleanBreaks = text.replace(/\r\n/g, "\n");
        const rawLines = cleanBreaks.split("\n");
        const lines = [];
        let lastWasBlank = false;

        for (let i = 0; i < rawLines.length; i += 1) {
            const raw = rawLines[i];
            let normalized = raw;

            if (options.trimWhitespace) {
                normalized = normalized.trim();
            }

            if (options.ignoreWhitespace) {
                normalized = normalized.replace(/\s+/g, " ");
            }

            if (options.ignoreCase) {
                normalized = normalized.toLowerCase();
            }

            const isBlank = normalized.length === 0;
            if (options.collapseBlankLines && isBlank) {
                if (lastWasBlank) {
                    continue;
                }
                lastWasBlank = true;
            } else {
                lastWasBlank = false;
            }

            lines.push({
                raw,
                norm: isBlank ? "" : normalized,
                index: i + 1,
            });
        }

        return lines;
    }

    function buildDiff(leftLines, rightLines) {
        const m = leftLines.length;
        const n = rightLines.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

        for (let i = m - 1; i >= 0; i -= 1) {
            for (let j = n - 1; j >= 0; j -= 1) {
                if (leftLines[i].norm === rightLines[j].norm) {
                    dp[i][j] = dp[i + 1][j + 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
                }
            }
        }

        const diff = [];
        let i = 0;
        let j = 0;
        while (i < m && j < n) {
            if (leftLines[i].norm === rightLines[j].norm) {
                diff.push({
                    type: "context",
                    left: leftLines[i],
                    right: rightLines[j],
                });
                i += 1;
                j += 1;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                diff.push({ type: "removed", left: leftLines[i] });
                i += 1;
            } else {
                diff.push({ type: "added", right: rightLines[j] });
                j += 1;
            }
        }

        while (i < m) {
            diff.push({ type: "removed", left: leftLines[i] });
            i += 1;
        }

        while (j < n) {
            diff.push({ type: "added", right: rightLines[j] });
            j += 1;
        }

        return diff;
    }

    function formatSymbol(item, options) {
        const baseSymbol = item.type === "added" ? "+" : item.type === "removed" ? "-" : "·";

        if (!options.showLineNumbers) {
            return baseSymbol;
        }

        if (item.type === "added") {
            const lineNo = item.right ? item.right.index : "";
            return `${baseSymbol} ${lineNo}`.trim();
        }

        if (item.type === "removed") {
            const lineNo = item.left ? item.left.index : "";
            return `${baseSymbol} ${lineNo}`.trim();
        }

        const leftNo = item.left ? item.left.index : "";
        const rightNo = item.right ? item.right.index : "";
        return `${baseSymbol} ${leftNo}/${rightNo}`.trim();
    }

    function getDisplayText(source) {
        if (!source) return "";
        return source.raw.length ? source.raw : "(blank line)";
    }

    function renderDiff(diff, options) {
        diffOutput.innerHTML = "";

        if (!diff.length) {
            diffOutput.textContent = "Provide text on both sides to compare.";
            return;
        }

        const frag = document.createDocumentFragment();
        diff.forEach((item) => {
            const line = document.createElement("div");
            line.classList.add("diff-line");
            line.classList.add(item.type === "context" ? "context" : item.type);

            const source = item.type === "added" ? item.right : item.type === "removed" ? item.left : item.left || item.right;
            if (!source) {
                return;
            }

            const value = getDisplayText(source);
            if (value === "(blank line)") {
                line.classList.add("blank");
            }

            const symbol = document.createElement("span");
            symbol.className = "diff-symbol";
            symbol.textContent = formatSymbol(item, options);

            const content = document.createElement("span");
            content.className = "diff-content";
            content.textContent = value;

            line.appendChild(symbol);
            line.appendChild(content);
            frag.appendChild(line);
        });

        diffOutput.appendChild(frag);
        diffOutput.scrollTop = 0;
    }

    function buildUnifiedDiffText(diff, options) {
        if (!diff.length) return "";
        const optionFlags = [];
        if (options.ignoreCase) optionFlags.push("ignore-case");
        if (options.trimWhitespace) optionFlags.push("trim-whitespace");
        if (options.ignoreWhitespace) optionFlags.push("ignore-intra-whitespace");
        if (options.collapseBlankLines) optionFlags.push("collapse-blank-lines");

        const header = [
            "--- Left Text",
            "+++ Right Text",
            optionFlags.length ? `@@ Options: ${optionFlags.join(", ")}` : "@@ Options: none",
        ];

        const body = diff
            .map((item) => {
                const prefix = item.type === "added" ? "+" : item.type === "removed" ? "-" : " ";
                const source = item.type === "added" ? item.right : item.type === "removed" ? item.left : item.left || item.right;
                const value = source ? source.raw : "";
                return `${prefix}${value}`;
            })
            .join("\n");

        return `${header.join("\n")}\n${body}`;
    }

    function updateStats(diff, leftCount, rightCount, timeMs) {
        const added = diff.filter((item) => item.type === "added").length;
        const removed = diff.filter((item) => item.type === "removed").length;
        const unchanged = diff.filter((item) => item.type === "context").length;
        const baseline = Math.max(leftCount, rightCount, 1);
        const similarity = Math.round((unchanged / baseline) * 100);

        addedStat.textContent = added.toString();
        removedStat.textContent = removed.toString();
        unchangedStat.textContent = unchanged.toString();
        similarityStat.textContent = `${similarity}%`;
        timeStat.textContent = `${timeMs} ms`;
    }

    function buildSummaryNote(leftCount, rightCount, options) {
        const activeOptions = [];
        if (options.ignoreCase) activeOptions.push("ignore case");
        if (options.trimWhitespace) activeOptions.push("trim lines");
        if (options.ignoreWhitespace) activeOptions.push("ignore whitespace");
        if (options.collapseBlankLines) activeOptions.push("collapse blanks");

        const leftLabel = `${leftCount} ${leftCount === 1 ? "line" : "lines"}`;
        const rightLabel = `${rightCount} ${rightCount === 1 ? "line" : "lines"}`;

        const optionsSegment = activeOptions.length
            ? `Applied options: ${activeOptions.join(", ")}.`
            : "No normalization options applied.";

        summaryNote.textContent = `Left text processed as ${leftLabel}; right text processed as ${rightLabel}. ${optionsSegment}`;
    }

    function performComparison(triggerSource = "manual") {
        const leftValue = leftText.value;
        const rightValue = rightText.value;

        if (!leftValue && !rightValue) {
            renderDiff([], getOptions());
            updateStats([], 0, 0, 0);
            summaryNote.textContent = "Enter or paste text on either side to start a comparison.";
            if (triggerSource === "manual") {
                showStatus("Add text to both panels to generate a diff.", "warn");
            } else {
                hideStatus();
            }
            latestDiffText = "";
            return;
        }

        const options = getOptions();
        const started = performance.now();
        const leftLines = preprocessLines(leftValue, options);
        const rightLines = preprocessLines(rightValue, options);
        const diff = buildDiff(leftLines, rightLines);
        const elapsed = Math.max(1, Math.round(performance.now() - started));

        renderDiff(diff, options);
        updateStats(diff, leftLines.length, rightLines.length, elapsed);
        buildSummaryNote(leftLines.length, rightLines.length, options);
        latestDiffText = buildUnifiedDiffText(diff, options);

        const hasChanges = diff.some((item) => item.type !== "context");

        if (!hasChanges && diff.length) {
            showStatus("No differences detected after applying the selected options.", "success");
            diffOutput.textContent = "🎉 The texts are identical after normalization.";
        } else if (triggerSource === "auto") {
            hideStatus();
        } else {
            showStatus(`Comparison complete in ${elapsed} ms.`, "success");
        }
    }

    function handleCopy(text, successMessage) {
        if (!navigator.clipboard) {
            showStatus("Clipboard access isn't supported in this browser.", "error");
            return;
        }

        navigator.clipboard
            .writeText(text)
            .then(() => {
                showStatus(successMessage, "success");
            })
            .catch(() => {
                showStatus("Unable to copy to clipboard. Check browser permissions.", "error");
            });
    }

    compareBtn.addEventListener("click", () => performComparison("manual"));

    [leftText, rightText].forEach((textarea) => {
        textarea.addEventListener("keydown", (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "enter") {
                event.preventDefault();
                performComparison("manual");
            }
        });
    });

    loadSampleBtn.addEventListener("click", () => {
        leftText.value = SAMPLE_BASE;
        rightText.value = SAMPLE_REVISED;
        performComparison("manual");
        showStatus("Sample roadmap texts loaded and compared.", "success");
    });

    clearBtn.addEventListener("click", () => {
        leftText.value = "";
        rightText.value = "";
        renderDiff([], getOptions());
        updateStats([], 0, 0, 0);
        summaryNote.textContent = "Inputs cleared. Paste or type new text to compare.";
        latestDiffText = "";
        showStatus("Both text areas were cleared.", "info");
    });

    swapBtn.addEventListener("click", () => {
        const temp = leftText.value;
        leftText.value = rightText.value;
        rightText.value = temp;
        performComparison("manual");
        showStatus("Left and right texts were swapped.", "success");
    });

    copyLeftBtn.addEventListener("click", () => {
        if (!leftText.value) {
            showStatus("There's nothing on the left to copy.", "warn");
            return;
        }
        handleCopy(leftText.value, "Left text copied to clipboard.");
    });

    copyRightBtn.addEventListener("click", () => {
        if (!rightText.value) {
            showStatus("There's nothing on the right to copy.", "warn");
            return;
        }
        handleCopy(rightText.value, "Right text copied to clipboard.");
    });

    copyDiffBtn.addEventListener("click", () => {
        if (!latestDiffText) {
            showStatus("Run a comparison before copying the diff.", "warn");
            return;
        }
        handleCopy(latestDiffText, "Unified diff copied to clipboard.");
    });

    downloadDiffBtn.addEventListener("click", () => {
        if (!latestDiffText) {
            showStatus("There isn't a diff to download yet.", "warn");
            return;
        }

        const blob = new Blob([latestDiffText], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "text-comparison.diff";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
        }, 0);
        showStatus("Diff file downloaded.", "success");
    });

    [ignoreCaseCheckbox, trimWhitespaceCheckbox, ignoreWhitespaceCheckbox, collapseBlankLinesCheckbox, showLineNumbersCheckbox].forEach(
        (checkbox) => {
            checkbox.addEventListener("change", () => performComparison("auto"));
        }
    );

    hideStatus();
    summaryNote.textContent = "Paste two versions of your text and click Compare to generate a diff.";
});
