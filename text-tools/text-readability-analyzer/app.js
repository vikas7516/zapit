document.addEventListener("DOMContentLoaded", () => {
    const MAX_CHARACTERS = 15000;

    const inputText = document.getElementById("inputText");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const clearBtn = document.getElementById("clearBtn");
    const loadSampleBtn = document.getElementById("loadSampleBtn");
    const copyCleanBtn = document.getElementById("copyCleanBtn");
    const copySummaryBtn = document.getElementById("copySummaryBtn");
    const downloadReportBtn = document.getElementById("downloadReportBtn");

    const ignoreNumbersCheckbox = document.getElementById("ignoreNumbers");
    const combineHyphenatedCheckbox = document.getElementById("combineHyphenated");
    const countBulletsCheckbox = document.getElementById("countBullets");
    const normalizeWhitespaceCheckbox = document.getElementById("normalizeWhitespace");
    const stripHtmlCheckbox = document.getElementById("stripHtml");

    const presetButtons = Array.from(document.querySelectorAll(".preset-btn"));

    const statusBanner = document.getElementById("statusBanner");
    const charCount = document.getElementById("charCount");
    const wordCount = document.getElementById("wordCount");

    const fleschEase = document.getElementById("fleschEase");
    const fkGrade = document.getElementById("fkGrade");
    const readingTime = document.getElementById("readingTime");
    const speakingTime = document.getElementById("speakingTime");
    const complexWordRate = document.getElementById("complexWordRate");
    const denseSentenceRate = document.getElementById("denseSentenceRate");

    const readingLevelBadge = document.getElementById("readingLevelBadge");
    const toneBadge = document.getElementById("toneBadge");
    const summaryNote = document.getElementById("summaryNote");

    const sentenceCount = document.getElementById("sentenceCount");
    const wordCountDetail = document.getElementById("wordCountDetail");
    const characterCount = document.getElementById("characterCount");
    const paragraphCount = document.getElementById("paragraphCount");
    const avgWordsPerSentence = document.getElementById("avgWordsPerSentence");
    const avgSyllablesPerWord = document.getElementById("avgSyllablesPerWord");
    const uniqueWords = document.getElementById("uniqueWords");
    const lexicalDiversity = document.getElementById("lexicalDiversity");

    const insightsList = document.getElementById("insightsList");
    const insightSummary = document.getElementById("insightSummary");

    const PRESETS = {
        general: {
            ignoreNumbers: true,
            combineHyphenated: true,
            countBullets: true,
            normalizeWhitespace: true,
            stripHtml: false,
        },
        formal: {
            ignoreNumbers: false,
            combineHyphenated: false,
            countBullets: false,
            normalizeWhitespace: true,
            stripHtml: true,
        },
        casual: {
            ignoreNumbers: true,
            combineHyphenated: true,
            countBullets: true,
            normalizeWhitespace: true,
            stripHtml: false,
        },
    };

    const SAMPLE_TEXT = `In the age of information overload, clear writing is a competitive advantage.\n\nReaders reward clarity. Short sentences and simple vocabulary make complex topics approachable. When you remove needless jargon, you invite a wider audience into the conversation. This applies to blog posts, onboarding guides, internal policies, and even support emails. \n\nBefore you ship a message, ask a simple question: could someone understand this on the first read? Tools like this readability analyzer highlight friction so you can polish tone, rhythm, and intent.`;

    let lastAnalysis = null;

    function debounce(fn, delay = 320) {
        let timeout;
        return function debounced(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

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

    function clamp(value, min, max) {
        if (Number.isNaN(value)) return min;
        return Math.min(Math.max(value, min), max);
    }

    function formatTimeFromMinutes(minutes) {
        const totalSeconds = Math.max(0, Math.round(minutes * 60));
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    }

    function countSyllables(word) {
        const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
        if (!cleaned) return 0;

        if (cleaned.length <= 3) return 1;

        const vowels = "aeiouy";
        let syllables = 0;
        let prevWasVowel = false;

        for (let i = 0; i < cleaned.length; i += 1) {
            const isVowel = vowels.includes(cleaned[i]);
            if (isVowel && !prevWasVowel) {
                syllables += 1;
            }
            prevWasVowel = isVowel;
        }

        if (cleaned.endsWith("e")) {
            syllables -= 1;
        }

        if (cleaned.endsWith("le") && cleaned.length > 2 && !"aeiou".includes(cleaned[cleaned.length - 3])) {
            syllables += 1;
        }

        if (syllables <= 0) syllables = 1;
        return syllables;
    }

    function sanitizeText(text, options) {
        let result = text || "";
        if (options.stripHtml) {
            const temp = document.createElement("div");
            temp.innerHTML = result;
            result = temp.textContent || temp.innerText || "";
        }

        if (options.normalizeWhitespace) {
            result = result.replace(/[\t]+/g, " ").replace(/\u00a0/g, " ");
            result = result.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
        }

        return result.trim();
    }

    function splitSentences(text, options) {
        if (!text) return [];
        let candidate = text;
        if (options.countBullets) {
            candidate = candidate.replace(/\n[-*•]\s+/g, (match) => `${match.trim()} `);
        }

        const raw = candidate.match(/[^.!?\n]+[.!?]*|[^.!?\n]+$/g) || [];
        const sentences = raw
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        if (options.countBullets) {
            const bulletMatches = candidate.match(/(^|\n)[-*•]\s+.+/g);
            if (bulletMatches) {
                bulletMatches.forEach((bullet) => {
                    const trimmed = bullet.replace(/^[\n\s]*[-*•]\s*/, "").trim();
                    if (trimmed && !sentences.includes(trimmed)) {
                        sentences.push(trimmed);
                    }
                });
            }
        }

        return sentences;
    }

    function splitWords(text, options) {
        if (!text) return [];
        const wordRegex = options.combineHyphenated
            ? /[A-Za-z][A-Za-z'\-]*/g
            : /[A-Za-z]+(?:'[A-Za-z]+)*/g;
        const matches = text.match(wordRegex) || [];

        return matches
            .map((word) => word.trim())
            .filter((word) => {
                if (!word) return false;
                if (options.ignoreNumbers && /^\d+(?:\.\d+)?$/.test(word)) {
                    return false;
                }
                return true;
            });
    }

    function computeStatistics(text, options) {
    const sentences = splitSentences(text, options);
    const words = splitWords(text, options);

    const sentenceCountRaw = sentences.length;
    const sentenceCountValue = Math.max(sentenceCountRaw, 1);
    const wordCountValue = words.length;
        const characterCountValue = text.replace(/\s/g, "").length;
        const paragraphCountValue = text ? text.split(/\n{2,}/).filter((p) => p.trim().length > 0).length || 1 : 0;

        let syllableCount = 0;
        let complexWords = 0;
        const uniqueWordSet = new Set();
        const denseSentences = sentences.filter((sentence) => {
            const wordsInSentence = splitWords(sentence, options);
            return wordsInSentence.length >= 25;
        }).length;

        words.forEach((word) => {
            const normalizedWord = word.replace(/[^a-zA-Z']/g, "").toLowerCase();
            if (!normalizedWord) return;

            uniqueWordSet.add(normalizedWord);
            const syllables = countSyllables(normalizedWord);
            syllableCount += syllables;
            if (syllables >= 3 && !/^\d/.test(word)) {
                complexWords += 1;
            }
        });

    const avgWordsPerSentenceValue = wordCountValue ? wordCountValue / sentenceCountValue : 0;
        const avgSyllablesPerWordValue = wordCountValue ? syllableCount / wordCountValue : 0;

        const fleschReadingEase = 206.835 - 1.015 * avgWordsPerSentenceValue - 84.6 * avgSyllablesPerWordValue;
        const fleschKincaidGrade = 0.39 * avgWordsPerSentenceValue + 11.8 * avgSyllablesPerWordValue - 15.59;
        const gunningFog = 0.4 * (avgWordsPerSentenceValue + (100 * complexWords) / Math.max(wordCountValue, 1));
        const smog = sentenceCountValue >= 1 ? 1.043 * Math.sqrt(complexWords * (30 / sentenceCountValue)) + 3.1291 : 0;
        const lettersPer100Words = wordCountValue ? (characterCountValue / wordCountValue) * 100 : 0;
        const sentencesPer100Words = wordCountValue ? (sentenceCountValue / wordCountValue) * 100 : 0;
        const colemanLiau = 0.0588 * lettersPer100Words - 0.296 * sentencesPer100Words - 15.8;
        const automatedReadability = 4.71 * (characterCountValue / Math.max(wordCountValue, 1)) + 0.5 * avgWordsPerSentenceValue - 21.43;

        const readingMinutes = wordCountValue / 200;
        const speakingMinutes = wordCountValue / 130;
        const lexical = wordCountValue ? (uniqueWordSet.size / wordCountValue) * 100 : 0;
        const complexRate = wordCountValue ? (complexWords / wordCountValue) * 100 : 0;
        const denseRate = sentenceCountValue ? (denseSentences / sentenceCountValue) * 100 : 0;

        return {
            sentences,
            sentenceCount: sentenceCountRaw,
            words,
            wordCount: wordCountValue,
            characterCount: characterCountValue,
            paragraphCount: paragraphCountValue,
            syllableCount,
            complexWords,
            denseSentences,
            avgWordsPerSentence: avgWordsPerSentenceValue,
            avgSyllablesPerWord: avgSyllablesPerWordValue,
            fleschReadingEase,
            fleschKincaidGrade,
            gunningFog,
            smog,
            colemanLiau,
            automatedReadability,
            readingMinutes,
            speakingMinutes,
            uniqueWords: uniqueWordSet.size,
            lexical,
            complexRate,
            denseRate,
        };
    }

    function formatNumber(value, decimals = 1) {
        if (!Number.isFinite(value)) return "0";
        return value.toFixed(decimals);
    }

    function estimateReadingLevel(grade) {
        if (!Number.isFinite(grade)) {
            return {
                label: "Unknown level",
                tone: "–",
            };
        }

        if (grade <= 5) {
            return {
                label: "Very easy (Elementary)",
                tone: "Friendly & light",
            };
        }
        if (grade <= 8) {
            return {
                label: "Easy (Middle School)",
                tone: "Approachable",
            };
        }
        if (grade <= 10) {
            return {
                label: "Conversational (High School)",
                tone: "Balanced",
            };
        }
        if (grade <= 13) {
            return {
                label: "Challenging (College)",
                tone: "Specialist",
            };
        }
        return {
            label: "Scholarly (Postgraduate)",
            tone: "Technical",
        };
    }

    function generateInsights(stats) {
        const insights = [];

        if (stats.avgWordsPerSentence > 20) {
            insights.push("Many sentences are lengthy; consider splitting long ideas into shorter statements.");
        } else if (stats.avgWordsPerSentence < 12 && stats.wordCount > 0) {
            insights.push("Sentence length is crisp—keep pairing concise lines with varied structure for rhythm.");
        }

        if (stats.avgSyllablesPerWord > 1.8) {
            insights.push("Word complexity is high; swap jargon for simpler wording where clarity matters most.");
        }

        if (stats.complexRate > 15) {
            insights.push("Complex words exceed 15%; define or link to tricky terms for broader audiences.");
        }

        if (stats.denseRate > 20) {
            insights.push("Several dense sentences detected; add transitions or break up long thoughts.");
        }

        if (stats.lexical < 35 && stats.wordCount > 50) {
            insights.push("Vocabulary variety is modest; sprinkle in synonyms to avoid repetition.");
        }

        if (!insights.length) {
            insights.push("Your readability metrics look balanced. Great job keeping things clear!");
        }

        return insights;
    }

    function updateInsights(insights, stats, levelInfo) {
        insightsList.innerHTML = "";
        insights.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = item;
            insightsList.appendChild(li);
        });

        const summaryParts = [
            `Flesch Reading Ease sits at ${formatNumber(stats.fleschReadingEase, 0)} (higher means easier).`,
            `Estimated grade level: ${formatNumber(stats.fleschKincaidGrade, 1)} (${levelInfo.label}).`,
            `Average sentence length is ${formatNumber(stats.avgWordsPerSentence, 1)} words with ${formatNumber(stats.complexRate, 1)}% complex vocabulary.`,
        ];

        insightSummary.textContent = summaryParts.join(" ");
    }

    function applyStats(stats) {
        fleschEase.textContent = formatNumber(clamp(stats.fleschReadingEase, -50, 120), 0);
        fkGrade.textContent = formatNumber(clamp(stats.fleschKincaidGrade, -3, 20), 1);
        readingTime.textContent = formatTimeFromMinutes(stats.readingMinutes);
        speakingTime.textContent = formatTimeFromMinutes(stats.speakingMinutes);
        complexWordRate.textContent = `${formatNumber(stats.complexRate, 1)}%`;
        denseSentenceRate.textContent = `${formatNumber(stats.denseRate, 1)}%`;

        sentenceCount.textContent = stats.sentenceCount.toString();
        wordCountDetail.textContent = stats.wordCount.toString();
        characterCount.textContent = stats.characterCount.toString();
        paragraphCount.textContent = stats.paragraphCount.toString();
        avgWordsPerSentence.textContent = formatNumber(stats.avgWordsPerSentence, 1);
        avgSyllablesPerWord.textContent = formatNumber(stats.avgSyllablesPerWord, 2);
        uniqueWords.textContent = stats.uniqueWords.toString();
        lexicalDiversity.textContent = `${formatNumber(stats.lexical, 1)}%`;
    }

    function getOptions() {
        return {
            ignoreNumbers: ignoreNumbersCheckbox.checked,
            combineHyphenated: combineHyphenatedCheckbox.checked,
            countBullets: countBulletsCheckbox.checked,
            normalizeWhitespace: normalizeWhitespaceCheckbox.checked,
            stripHtml: stripHtmlCheckbox.checked,
        };
    }

    function setOptions(options) {
        ignoreNumbersCheckbox.checked = Boolean(options.ignoreNumbers);
        combineHyphenatedCheckbox.checked = Boolean(options.combineHyphenated);
        countBulletsCheckbox.checked = Boolean(options.countBullets);
        normalizeWhitespaceCheckbox.checked = Boolean(options.normalizeWhitespace);
        stripHtmlCheckbox.checked = Boolean(options.stripHtml);
    }

    function applyPreset(name) {
        const preset = PRESETS[name];
        if (!preset) return;
        setOptions(preset);
        presetButtons.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.preset === name);
        });
        analyze("auto");
        showStatus(`${name.charAt(0).toUpperCase()}${name.slice(1)} preset applied.`, "success");
    }

    function updateHelpers(text) {
        const length = text.length;
        const words = splitWords(text, getOptions()).length;
        charCount.textContent = `${length} / ${MAX_CHARACTERS} characters used`;
        wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
    }

    function buildReport(stats, options, levelInfo, insights) {
        const lines = [];
        lines.push("Readability Analyzer Report");
        lines.push("==========================");
        lines.push(`Generated at: ${new Date().toLocaleString()}`);
        lines.push("");
        lines.push("Core Scores:");
        lines.push(`- Flesch Reading Ease: ${formatNumber(stats.fleschReadingEase, 1)}`);
        lines.push(`- Flesch-Kincaid Grade: ${formatNumber(stats.fleschKincaidGrade, 2)}`);
        lines.push(`- Gunning Fog: ${formatNumber(stats.gunningFog, 2)}`);
        lines.push(`- SMOG Index: ${formatNumber(stats.smog, 2)}`);
        lines.push(`- Coleman-Liau: ${formatNumber(stats.colemanLiau, 2)}`);
        lines.push(`- Automated Readability Index: ${formatNumber(stats.automatedReadability, 2)}`);
        lines.push("");
        lines.push("Summary:");
        lines.push(`- Estimated reading level: ${levelInfo.label}`);
        lines.push(`- Tone indicator: ${levelInfo.tone}`);
        lines.push(`- Reading time: ${formatTimeFromMinutes(stats.readingMinutes)} (at 200 wpm)`);
        lines.push(`- Speaking time: ${formatTimeFromMinutes(stats.speakingMinutes)} (at 130 wpm)`);
        lines.push("");
        lines.push("Counts:");
        lines.push(`- Words: ${stats.wordCount}`);
        lines.push(`- Sentences: ${stats.sentenceCount}`);
        lines.push(`- Paragraphs: ${stats.paragraphCount}`);
        lines.push(`- Characters (no spaces): ${stats.characterCount}`);
        lines.push(`- Unique words: ${stats.uniqueWords}`);
        lines.push("");
        lines.push("Averages & Rates:");
        lines.push(`- Words per sentence: ${formatNumber(stats.avgWordsPerSentence, 2)}`);
        lines.push(`- Syllables per word: ${formatNumber(stats.avgSyllablesPerWord, 2)}`);
        lines.push(`- Complex word rate: ${formatNumber(stats.complexRate, 2)}%`);
        lines.push(`- Dense sentence rate: ${formatNumber(stats.denseRate, 2)}%`);
        lines.push(`- Lexical diversity: ${formatNumber(stats.lexical, 2)}%`);
        lines.push("");
        lines.push("Normalization Options:");
        Object.entries(options).forEach(([key, value]) => {
            lines.push(`- ${key}: ${value ? "enabled" : "disabled"}`);
        });
        lines.push("");
        lines.push("Insights:");
        insights.forEach((item) => {
            lines.push(`- ${item}`);
        });
        lines.push("");
        lines.push("End of report.");
        return lines.join("\n");
    }

    function analyze(trigger = "manual") {
        const rawText = inputText.value.slice(0, MAX_CHARACTERS);
        if (rawText.length > inputText.value.length) {
            inputText.value = rawText;
        }
        const options = getOptions();
        const sanitized = sanitizeText(rawText, options);

        updateHelpers(sanitized);

        if (!sanitized) {
            applyStats({
                fleschReadingEase: 0,
                fleschKincaidGrade: 0,
                readingMinutes: 0,
                speakingMinutes: 0,
                complexRate: 0,
                denseRate: 0,
                sentenceCount: 0,
                wordCount: 0,
                characterCount: 0,
                paragraphCount: 0,
                avgWordsPerSentence: 0,
                avgSyllablesPerWord: 0,
                uniqueWords: 0,
                lexical: 0,
            });
            summaryNote.textContent = "Add your text above to unlock readability insights.";
            insightsList.innerHTML = "";
            insightSummary.textContent = "No analysis yet.";
            readingLevelBadge.textContent = "Awaiting input";
            toneBadge.textContent = "–";
            toneBadge.classList.add("muted");
            lastAnalysis = null;
            if (trigger === "manual") {
                showStatus("Enter some text to analyze readability.", "warn");
            } else {
                hideStatus();
            }
            return;
        }

        const stats = computeStatistics(sanitized, options);
        applyStats(stats);
        const levelInfo = estimateReadingLevel(stats.fleschKincaidGrade);
        const insights = generateInsights(stats);
        updateInsights(insights, stats, levelInfo);

        readingLevelBadge.textContent = levelInfo.label;
        toneBadge.textContent = levelInfo.tone;
        toneBadge.classList.toggle("muted", false);

        const summaryParts = [];
        summaryParts.push(`Your text has ${stats.wordCount} words across ${stats.sentenceCount} sentences.`);
        summaryParts.push(`Average sentence length is ${formatNumber(stats.avgWordsPerSentence, 1)} words, with ${formatNumber(stats.complexRate, 1)}% complex vocabulary.`);
        summaryParts.push(`Expect about ${formatTimeFromMinutes(stats.readingMinutes)} reading time.`);
        summaryNote.textContent = summaryParts.join(" ");

        lastAnalysis = {
            stats,
            options,
            levelInfo,
            insights,
        };

        if (trigger === "manual") {
            showStatus("Readability analysis refreshed.", "success");
        } else {
            hideStatus();
        }
    }

    const debouncedAnalyze = debounce(() => analyze("auto"), 420);

    analyzeBtn.addEventListener("click", () => analyze("manual"));

    inputText.addEventListener("input", () => {
        const trimmed = inputText.value.slice(0, MAX_CHARACTERS);
        if (trimmed !== inputText.value) {
            inputText.value = trimmed;
            showStatus(`Input truncated to ${MAX_CHARACTERS} characters.`, "warn");
        }
        debouncedAnalyze();
    });

    [ignoreNumbersCheckbox, combineHyphenatedCheckbox, countBulletsCheckbox, normalizeWhitespaceCheckbox, stripHtmlCheckbox].forEach(
        (checkbox) => {
            checkbox.addEventListener("change", () => analyze("auto"));
        }
    );

    presetButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            applyPreset(btn.dataset.preset);
        });
    });

    clearBtn.addEventListener("click", () => {
        inputText.value = "";
        lastAnalysis = null;
        hideStatus();
        analyze("manual");
        showStatus("Input cleared.", "info");
    });

    loadSampleBtn.addEventListener("click", () => {
        inputText.value = SAMPLE_TEXT;
        analyze("manual");
        showStatus("Sample product messaging loaded.", "success");
    });

    copyCleanBtn.addEventListener("click", () => {
        const sanitized = sanitizeText(inputText.value.slice(0, MAX_CHARACTERS), getOptions());
        if (!sanitized) {
            showStatus("There's no text to copy yet.", "warn");
            return;
        }
        if (!navigator.clipboard) {
            showStatus("Clipboard access isn't supported in this browser.", "error");
            return;
        }
        navigator.clipboard
            .writeText(sanitized)
            .then(() => showStatus("Clean text copied to clipboard.", "success"))
            .catch(() => showStatus("Clipboard copy failed. Check browser permissions.", "error"));
    });

    copySummaryBtn.addEventListener("click", () => {
        if (!lastAnalysis) {
            showStatus("Analyze your text before copying the summary.", "warn");
            return;
        }
        if (!navigator.clipboard) {
            showStatus("Clipboard access isn't supported in this browser.", "error");
            return;
        }
        navigator.clipboard
            .writeText(insightSummary.textContent)
            .then(() => showStatus("Insight summary copied.", "success"))
            .catch(() => showStatus("Clipboard copy failed. Check browser permissions.", "error"));
    });

    downloadReportBtn.addEventListener("click", () => {
        if (!lastAnalysis) {
            showStatus("Run an analysis before downloading a report.", "warn");
            return;
        }
        const report = buildReport(lastAnalysis.stats, lastAnalysis.options, lastAnalysis.levelInfo, lastAnalysis.insights);
        const blob = new Blob([report], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "readability-report.txt";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            URL.revokeObjectURL(link.href);
            document.body.removeChild(link);
        }, 0);
        showStatus("Readability report downloaded.", "success");
    });

    // Initialize
    setOptions(PRESETS.general);
    presetButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.preset === "general");
    });
    hideStatus();
    updateHelpers("");
});
