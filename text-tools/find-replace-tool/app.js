(function () {
    "use strict";

    const $ = (selector) => document.querySelector(selector);
    const sourceText = $("#sourceText");
    const searchTerm = $("#searchTerm");
    const replaceTerm = $("#replaceTerm");
    const caseSensitive = $("#caseSensitive");
    const wholeWords = $("#wholeWords");
    const useRegex = $("#useRegex");
    const multilineFlag = $("#multilineFlag");
    const dotAllFlag = $("#dotAllFlag");
    const preserveOriginal = $("#preserveOriginal");
    const highlightMatches = $("#highlightMatches");
    const autoApply = $("#autoApply");

    const replaceBtn = $("#replaceBtn");
    const clearAllBtn = $("#clearAllBtn");
    const copyResultBtn = $("#copyResultBtn");
    const downloadResultBtn = $("#downloadResultBtn");
    const swapBtn = $("#swapBtn");
    const loadSampleBtn = $("#loadSampleBtn");

    const resultOutput = $("#resultOutput");
    const originalOutput = $("#originalOutput");
    const originalPanel = $("#originalPanel");
    const resultsGrid = $("#resultsGrid");

    const replacementCount = $("#replacementCount");
    const matchCount = $("#matchCount");
    const matchesStat = $("#matchesStat");
    const replacementsStat = $("#replacementsStat");
    const timeStat = $("#timeStat");
    const lengthStat = $("#lengthStat");

    const regexNotice = $("#regexNotice");
    const errorBanner = $("#errorBanner");

    const MAX_LENGTH = 200000;

    const state = {
        lastText: "",
        lastOutput: "",
        lastFindValue: "",
        lastReplaceValue: "",
        lastOptions: null,
        matchCount: 0,
        elapsed: 0,
        outputLength: 0
    };

    let autoApplyTimer = null;

    function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function computeReplacementValue(template, matchArray, inputText, index) {
        if (!template) {
            return "";
        }

        const tailPos = index + matchArray[0].length;
        const totalGroups = matchArray.length - 1;
        let result = "";
        let i = 0;

        while (i < template.length) {
            const ch = template[i];

            if (ch === "$" && i + 1 < template.length) {
                const next = template[i + 1];

                if (next === "$") {
                    result += "$";
                    i += 2;
                    continue;
                }

                if (next === "&") {
                    result += matchArray[0];
                    i += 2;
                    continue;
                }

                if (next === "`") {
                    result += inputText.slice(0, index);
                    i += 2;
                    continue;
                }

                if (next === "'") {
                    result += inputText.slice(tailPos);
                    i += 2;
                    continue;
                }

                if (next === "<") {
                    const endIndex = template.indexOf(">", i + 2);
                    if (endIndex !== -1) {
                        if (matchArray.groups) {
                            const groupName = template.slice(i + 2, endIndex);
                            const named = matchArray.groups[groupName];
                            result += named !== undefined ? named : "";
                        }
                        i = endIndex + 1;
                        continue;
                    }
                    result += "$<";
                    i += 2;
                    continue;
                }

                if (next >= "0" && next <= "9") {
                    const firstDigit = next.charCodeAt(0) - 48;

                    if (i + 2 < template.length && template[i + 2] >= "0" && template[i + 2] <= "9") {
                        const secondDigit = template[i + 2].charCodeAt(0) - 48;
                        const value = firstDigit * 10 + secondDigit;
                        if (value > 0 && value <= totalGroups) {
                            const capture = matchArray[value] ?? "";
                            result += capture;
                            i += 3;
                            continue;
                        }
                    }

                    if (firstDigit > 0 && firstDigit <= totalGroups) {
                        const capture = matchArray[firstDigit] ?? "";
                        result += capture;
                        i += 2;
                        continue;
                    }

                    result += "$" + next;
                    i += 2;
                    continue;
                }

                result += "$" + next;
                i += 2;
                continue;
            }

            result += ch;
            i += 1;
        }

        return result;
    }

    function buildHighlightedViews(pattern, text, replaceValue) {
        if (!text) {
            return { originalHtml: "", resultHtml: "" };
        }

        const highlightPattern = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
        const originalParts = [];
        const resultParts = [];
        let lastIndex = 0;
        let match;

        while ((match = highlightPattern.exec(text)) !== null) {
            const start = match.index;
            const end = start + match[0].length;

            originalParts.push(escapeHtml(text.slice(lastIndex, start)));
            resultParts.push(escapeHtml(text.slice(lastIndex, start)));

            const replacementValue = computeReplacementValue(replaceValue, match, text, start);

            originalParts.push(`<mark class="match">${escapeHtml(match[0])}</mark>`);
            resultParts.push(`<mark class="replace">${escapeHtml(replacementValue)}</mark>`);

            lastIndex = end;

            if (match[0] === "" && highlightPattern.lastIndex === start) {
                highlightPattern.lastIndex += 1;
            }
        }

        originalParts.push(escapeHtml(text.slice(lastIndex)));
        resultParts.push(escapeHtml(text.slice(lastIndex)));

        return {
            originalHtml: originalParts.join(""),
            resultHtml: resultParts.join("")
        };
    }

    function pluralize(value, singular, plural) {
        return `${value} ${value === 1 ? singular : plural}`;
    }

    function buildPattern(findValue, enableRegex, enableCaseSensitive, enableWholeWords, enableMultiline, enableDotAll) {
        let patternSource = enableRegex ? findValue : escapeRegExp(findValue);
        if (enableWholeWords && patternSource.trim().length > 0) {
            if (enableRegex) {
                patternSource = `\b(?:${patternSource})\b`;
            } else {
                patternSource = `\b${patternSource}\b`;
            }
        }
        let flags = "g";
        if (!enableCaseSensitive) {
            flags += "i";
        }
        if (enableMultiline) {
            flags += "m";
        }
        if (enableDotAll) {
            flags += "s";
        }
        return new RegExp(patternSource, flags);
    }

    function showError(message) {
        errorBanner.textContent = message;
        errorBanner.classList.remove("hidden");
    }

    function clearError() {
        errorBanner.textContent = "";
        errorBanner.classList.add("hidden");
    }

    function toggleRegexNotice() {
        if (useRegex.checked) {
            regexNotice.classList.remove("hidden");
        } else {
            regexNotice.classList.add("hidden");
        }
        if (multilineFlag) {
            multilineFlag.disabled = !useRegex.checked;
        }
        if (dotAllFlag) {
            dotAllFlag.disabled = !useRegex.checked;
        }
    }

    function toggleOriginalPanel() {
        if (preserveOriginal.checked) {
            originalPanel.classList.remove("hidden");
            resultsGrid.classList.remove("single-column");
        } else {
            originalPanel.classList.add("hidden");
            resultsGrid.classList.add("single-column");
        }
    }

    function cancelAutoRun() {
        if (autoApplyTimer !== null) {
            window.clearTimeout(autoApplyTimer);
            autoApplyTimer = null;
        }
    }

    function scheduleAutoRun() {
        if (!autoApply || !autoApply.checked) {
            cancelAutoRun();
            return;
        }
        cancelAutoRun();
        autoApplyTimer = window.setTimeout(function () {
            performReplacement({ silent: true });
        }, 250);
    }

    function setResultStats(matchTotal, replaceTotal, elapsed, outputLength) {
        replacementCount.textContent = pluralize(replaceTotal, "replacement", "replacements");
        matchCount.textContent = pluralize(matchTotal, "match", "matches");
        matchesStat.textContent = matchTotal.toString();
        replacementsStat.textContent = replaceTotal.toString();
        timeStat.textContent = `${elapsed} ms`;
        lengthStat.textContent = outputLength.toString();
    }

    function clearPreContent(element) {
        element.textContent = "";
        element.innerHTML = "";
    }

    function renderOutputs(pattern, originalText, outputText, replaceValue) {
        const shouldHighlight = highlightMatches.checked && state.matchCount > 0;

        if (shouldHighlight) {
            const { originalHtml, resultHtml } = buildHighlightedViews(pattern, originalText, replaceValue);
            resultOutput.innerHTML = resultHtml;
            if (preserveOriginal.checked) {
                originalOutput.innerHTML = originalHtml;
            } else {
                clearPreContent(originalOutput);
            }
        } else {
            resultOutput.textContent = outputText;
            if (preserveOriginal.checked) {
                originalOutput.textContent = originalText;
            } else {
                clearPreContent(originalOutput);
            }
        }
    }

    function rerenderOutputsFromState() {
        if (!state.lastOptions || !state.lastFindValue) {
            if (!preserveOriginal.checked) {
                clearPreContent(originalOutput);
            }
            if (!state.lastOutput) {
                clearPreContent(resultOutput);
            }
            return;
        }

        try {
            const pattern = buildPattern(
                state.lastFindValue,
                state.lastOptions.useRegex,
                state.lastOptions.caseSensitive,
                state.lastOptions.wholeWords,
                state.lastOptions.multiline,
                state.lastOptions.dotAll
            );
            renderOutputs(pattern, state.lastText, state.lastOutput, state.lastReplaceValue);
        } catch (err) {
            clearError();
            resultOutput.textContent = state.lastOutput;
            if (preserveOriginal.checked) {
                originalOutput.textContent = state.lastText;
            }
        }
    }

    function guardInputs(text, findValue, options) {
        const silent = Boolean(options && options.silent);
        if (!text) {
            if (!silent) {
                showError("Please add some text to search.");
                sourceText.focus();
            }
            return false;
        }
        if (!findValue) {
            if (!silent) {
                showError("Enter the word or pattern you want to find.");
                searchTerm.focus();
            }
            return false;
        }
        if (text.length > MAX_LENGTH) {
            if (!silent) {
                showError(`Input is too large (${text.length.toLocaleString()} characters). Please keep it under ${MAX_LENGTH.toLocaleString()} characters.`);
                sourceText.focus();
            }
            return false;
        }
        return true;
    }

    function performReplacement(options) {
        const silent = Boolean(options && options.silent);
    const text = sourceText.value;
    const findValue = searchTerm.value;
    const replaceValue = replaceTerm.value;

    cancelAutoRun();

        clearError();

        if (!guardInputs(text, findValue, { silent })) {
            return;
        }

        const started = performance.now();

        let pattern;
        try {
            pattern = buildPattern(
                findValue,
                useRegex.checked,
                caseSensitive.checked,
                wholeWords.checked,
                Boolean(useRegex.checked && multilineFlag && multilineFlag.checked),
                Boolean(useRegex.checked && dotAllFlag && dotAllFlag.checked)
            );
        } catch (err) {
            showError(`Pattern error: ${(err && err.message) || "unknown issue"}`);
            return;
        }

        let matches;
        try {
            matches = text.match(pattern) || [];
        } catch (err) {
            showError(`Unable to run the search: ${(err && err.message) || "unknown issue"}`);
            return;
        }

        let output;
        try {
            output = matches.length ? text.replace(pattern, replaceValue) : text;
        } catch (err) {
            showError(`Replacement failed: ${(err && err.message) || "unknown issue"}`);
            return;
        }

        const elapsed = Math.max(0, Math.round(performance.now() - started));
        state.lastText = text;
        state.lastOutput = output;
        state.lastFindValue = findValue;
        state.lastReplaceValue = replaceValue;
        state.lastOptions = {
            useRegex: useRegex.checked,
            caseSensitive: caseSensitive.checked,
            wholeWords: wholeWords.checked,
            multiline: Boolean(useRegex.checked && multilineFlag && multilineFlag.checked),
            dotAll: Boolean(useRegex.checked && dotAllFlag && dotAllFlag.checked)
        };
        state.matchCount = matches.length;
        state.elapsed = elapsed;
        state.outputLength = output.length;

        renderOutputs(pattern, text, output, replaceValue);

        setResultStats(matches.length, matches.length, elapsed, output.length);
    }

    function copyResultToClipboard() {
        const textToCopy = resultOutput.textContent || "";
        if (!textToCopy) {
            showError("Nothing to copy yet. Run a find & replace first.");
            return;
        }

        clearError();

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).catch(() => {
                showError("Clipboard permissions denied. Try copying manually.");
            });
        } else {
            const temp = document.createElement("textarea");
            temp.value = textToCopy;
            temp.setAttribute("readonly", "");
            temp.style.position = "absolute";
            temp.style.left = "-9999px";
            document.body.appendChild(temp);
            temp.select();
            try {
                document.execCommand("copy");
            } catch (err) {
                showError("Clipboard copy not supported in this browser.");
            }
            document.body.removeChild(temp);
        }
    }

    function downloadResult() {
        const textToDownload = resultOutput.textContent || "";
        if (!textToDownload) {
            showError("Nothing to download yet. Run a find & replace first.");
            return;
        }

        clearError();

        const blob = new Blob([textToDownload], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "find-replace-result.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    }

    function clearAll() {
        sourceText.value = "";
        searchTerm.value = "";
        replaceTerm.value = "";
        caseSensitive.checked = false;
        wholeWords.checked = false;
        useRegex.checked = false;
        if (multilineFlag) {
            multilineFlag.checked = false;
        }
        if (dotAllFlag) {
            dotAllFlag.checked = false;
        }
        preserveOriginal.checked = true;
        highlightMatches.checked = true;
        if (autoApply) {
            autoApply.checked = false;
        }

        state.lastText = "";
        state.lastOutput = "";
        state.lastFindValue = "";
        state.lastReplaceValue = "";
        state.lastOptions = null;
        state.matchCount = 0;
        state.elapsed = 0;
        state.outputLength = 0;

        clearPreContent(resultOutput);
        clearPreContent(originalOutput);
        toggleOriginalPanel();
        setResultStats(0, 0, 0, 0);
        clearError();
        toggleRegexNotice();
        cancelAutoRun();
        sourceText.focus();
    }

    function swapFields() {
        const findValue = searchTerm.value;
        searchTerm.value = replaceTerm.value;
        replaceTerm.value = findValue;
        searchTerm.focus();
        scheduleAutoRun();
    }

    function loadSample() {
        const sample = `Dear {firstName},\n\nYour appointment is scheduled for {date} at {time}. Please bring your {document}.\n\nThank you,\n{companyName}`;
        sourceText.value = sample;
        searchTerm.value = "\\{([^}]+)\\}";
        replaceTerm.value = "[[\$1]]";
        wholeWords.checked = false;
        useRegex.checked = true;
        caseSensitive.checked = false;
        if (multilineFlag) {
            multilineFlag.checked = false;
        }
        if (dotAllFlag) {
            dotAllFlag.checked = false;
        }
        toggleRegexNotice();
        performReplacement();
        searchTerm.focus();
        searchTerm.setSelectionRange(0, searchTerm.value.length);
    }

    function init() {
        replaceBtn.addEventListener("click", performReplacement);
        copyResultBtn.addEventListener("click", copyResultToClipboard);
        downloadResultBtn.addEventListener("click", downloadResult);
        clearAllBtn.addEventListener("click", clearAll);
        swapBtn.addEventListener("click", swapFields);
        loadSampleBtn.addEventListener("click", loadSample);

        [sourceText, searchTerm, replaceTerm].forEach((input) => {
            if (!input) {
                return;
            }
            input.addEventListener("input", () => {
                clearError();
                scheduleAutoRun();
            });
        });

        [caseSensitive, wholeWords, multilineFlag, dotAllFlag].forEach((input) => {
            if (!input) {
                return;
            }
            input.addEventListener("change", () => {
                scheduleAutoRun();
            });
        });

        useRegex.addEventListener("change", () => {
            toggleRegexNotice();
            clearError();
            scheduleAutoRun();
        });

        preserveOriginal.addEventListener("change", () => {
            toggleOriginalPanel();
            rerenderOutputsFromState();
        });

        highlightMatches.addEventListener("change", () => {
            clearError();
            rerenderOutputsFromState();
        });

        if (autoApply) {
            autoApply.addEventListener("change", () => {
                if (autoApply.checked) {
                    scheduleAutoRun();
                } else {
                    cancelAutoRun();
                }
            });
        }

        toggleRegexNotice();
        toggleOriginalPanel();
        setResultStats(0, 0, 0, 0);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
