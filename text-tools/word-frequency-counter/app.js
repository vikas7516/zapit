(function () {
	"use strict";

	const MAX_INPUT_LENGTH = 20000;
	const DEFAULT_SAMPLE = `Zapit turns routine tasks into instant wins. Paste any text to uncover word frequencies, surface trending keywords, and export clean data in one click. Toggle stop-word filtering for focus, include numbers to track stats like 2025 or 100%, and sort by alphabet or frequency for presentations. Zapit keeps everything private—no uploads, no fuss, just fast insight.`;

	const STOP_WORDS = new Set([
		"a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been",
		"before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
		"doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having",
		"he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
		"i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
		"myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over",
		"own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's",
		"the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
		"this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've",
		"were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's",
		"with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
	]);

	const FORMATTERS = {
		percent: new Intl.NumberFormat("en", { maximumFractionDigits: 2, minimumFractionDigits: 0 }),
		integer: new Intl.NumberFormat("en"),
	};

	const $ = (selector) => document.querySelector(selector);

	const inputText = $("#inputText");
	const charCount = $("#charCount");
	const wordCount = $("#wordCount");
	const statusBanner = $("#statusBanner");

	const minFrequencyInput = $("#minFrequencyInput");
	const maxResultsInput = $("#maxResultsInput");
	const ignoreCommonToggle = $("#ignoreCommonToggle");
	const caseSensitiveToggle = $("#caseSensitiveToggle");
	const showPercentToggle = $("#showPercentToggle");
	const includeNumbersToggle = $("#includeNumbersToggle");
	const sortSelect = $("#sortSelect");

	const analyzeBtn = $("#analyzeBtn");
	const downloadCsvBtn = $("#downloadCsvBtn");
	const downloadJsonBtn = $("#downloadJsonBtn");
	const copyTableBtn = $("#copyTableBtn");
	const loadSampleBtn = $("#loadSampleBtn");
	const clearBtn = $("#clearBtn");

	const resultsBody = $("#resultsBody");
	const resultCountBadge = $("#resultCountBadge");
	const highestWordBadge = $("#highestWordBadge");
	const totalWordsStat = $("#totalWordsStat");
	const uniqueWordsStat = $("#uniqueWordsStat");
	const ignoredWordsStat = $("#ignoredWordsStat");
	const analysisTimeStat = $("#analysisTimeStat");
	const statsNote = $("#statsNote");
	const tipsList = $("#tipsList");

	let debounceTimer = null;
	let lastSignature = "";
	let lastResults = {
		tokenCount: 0,
		uniqueCount: 0,
		ignoredStopWords: 0,
		analysisMs: 0,
		entries: [],
	};

	function showStatus(message, tone) {
		if (!statusBanner) return;
		statusBanner.textContent = message;
		statusBanner.classList.remove("hidden", "success", "warn", "error");
		if (tone) statusBanner.classList.add(tone);
		clearTimeout(showStatus._timer);
		showStatus._timer = setTimeout(() => statusBanner.classList.add("hidden"), 3500);
	}

	function clampNumber(value, min, max, fallback) {
		const parsed = Number.parseInt(value, 10);
		if (Number.isNaN(parsed)) return fallback;
		if (min !== undefined && parsed < min) return min;
		if (max !== undefined && parsed > max) return max;
		return parsed;
	}

	function updateInputStats() {
		if (!inputText) return;
		const raw = inputText.value || "";
		if (raw.length > MAX_INPUT_LENGTH) {
			inputText.value = raw.slice(0, MAX_INPUT_LENGTH);
		}
		const sanitized = inputText.value || "";
		const characters = sanitized.length;
		const words = sanitized.trim() ? sanitized.trim().split(/\s+/).length : 0;
		if (charCount) charCount.textContent = `${characters} / ${MAX_INPUT_LENGTH} characters`;
		if (wordCount) wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
	}

	function collectOptions() {
		const minFrequency = clampNumber(minFrequencyInput?.value, 1, 999, 1);
		const maxResults = clampNumber(maxResultsInput?.value, 10, 500, 100);

		if (minFrequencyInput) minFrequencyInput.value = String(minFrequency);
		if (maxResultsInput) maxResultsInput.value = String(maxResults);

		return {
			minFrequency,
			maxResults,
			ignoreCommon: Boolean(ignoreCommonToggle?.checked),
			caseSensitive: Boolean(caseSensitiveToggle?.checked),
			showPercent: Boolean(showPercentToggle?.checked),
			includeNumbers: Boolean(includeNumbersToggle?.checked),
			sortMode: sortSelect?.value || "frequency",
		};
	}

	function tokenize(text, options) {
		if (!text) return [];
		const pattern = options.includeNumbers ? /[\p{L}\p{N}'’\-]+/gu : /[\p{L}'’\-]+/gu;
		const matches = text.match(pattern);
		if (!matches) return [];
		return matches
			.map((token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
			.filter(Boolean);
	}

	function analyzeText(text, options) {
		const tokens = tokenize(text, options);
		const frequencies = new Map();
		let ignoredStopWords = 0;

		for (const token of tokens) {
			if (!token) continue;
			const displayToken = token;
			const normalized = options.caseSensitive ? token : token.toLowerCase();
			if (options.ignoreCommon && STOP_WORDS.has(normalized.toLowerCase())) {
				ignoredStopWords += 1;
				continue;
			}

			const entry = frequencies.get(normalized) || {
				display: displayToken,
				normalized,
				count: 0,
				length: normalized.length,
			};
			entry.count += 1;
			entry.display = options.caseSensitive ? displayToken : entry.display || displayToken;
			frequencies.set(normalized, entry);
		}

		let entries = Array.from(frequencies.values());
		entries = entries.filter((entry) => entry.count >= options.minFrequency);

		switch (options.sortMode) {
			case "alphabetical":
				entries.sort((a, b) => a.display.localeCompare(b.display, undefined, { sensitivity: options.caseSensitive ? "case" : "base" }));
				break;
			case "length":
				entries.sort((a, b) => b.length - a.length || b.count - a.count || a.display.localeCompare(b.display));
				break;
			case "frequency":
			default:
				entries.sort((a, b) => b.count - a.count || a.display.localeCompare(b.display));
				break;
		}

		const limited = entries.slice(0, options.maxResults);

		return {
			tokenCount: tokens.length,
			uniqueCount: entries.length,
			ignoredStopWords,
			entries: limited,
		};
	}

	function renderResults(results, options) {
		if (!resultsBody) return;
		resultsBody.innerHTML = "";

		if (!results.entries.length) {
			const row = document.createElement("tr");
			row.className = "placeholder";
			row.innerHTML = `<td colspan="4">No words met the filter. Adjust minimum frequency or include more text.</td>`;
			resultsBody.appendChild(row);
			return;
		}

		const total = results.tokenCount || 1;
		results.entries.forEach((entry, index) => {
			const row = document.createElement("tr");
			row.innerHTML = `
				<td>${index + 1}</td>
				<td>${entry.display}</td>
				<td>${FORMATTERS.integer.format(entry.count)}</td>
				<td>${options.showPercent ? FORMATTERS.percent.format((entry.count / total) * 100) : "—"}</td>
			`;
			resultsBody.appendChild(row);
		});
	}

	function updateSummary(results, options, elapsedMs) {
		lastResults = {
			tokenCount: results.tokenCount,
			uniqueCount: results.uniqueCount,
			ignoredStopWords: results.ignoredStopWords,
			analysisMs: elapsedMs,
			entries: results.entries,
		};

		if (resultCountBadge) {
			resultCountBadge.textContent = `${results.uniqueCount} unique`;
		}
		if (highestWordBadge) {
			const top = results.entries[0];
			highestWordBadge.textContent = top ? `Top: ${top.display} (${top.count})` : "Top: —";
		}
		if (totalWordsStat) {
			totalWordsStat.textContent = FORMATTERS.integer.format(results.tokenCount);
		}
		if (uniqueWordsStat) {
			uniqueWordsStat.textContent = FORMATTERS.integer.format(results.uniqueCount);
		}
		if (ignoredWordsStat) {
			ignoredWordsStat.textContent = FORMATTERS.integer.format(results.ignoredStopWords);
		}
		if (analysisTimeStat) {
			analysisTimeStat.textContent = `${FORMATTERS.integer.format(elapsedMs)} ms`;
		}
		if (statsNote) {
			const basis = options.ignoreCommon ? `${FORMATTERS.integer.format(results.ignoredStopWords)} stop words skipped.` : "Stop words included.";
			const percentNote = options.showPercent ? "Percent of total displayed." : "Percent column hidden.";
			const sortNote = options.sortMode === "frequency" ? "Sorted by frequency." : options.sortMode === "alphabetical" ? "Sorted alphabetically." : "Sorted by word length.";
			const topWord = results.entries[0]
				? `Top word "${results.entries[0].display}" appears ${FORMATTERS.integer.format(results.entries[0].count)} times.`
				: "Add more text to highlight top keywords.";
			statsNote.textContent = `${topWord} ${basis} ${percentNote} ${sortNote}`;
		}
		if (tipsList && tipsList.firstElementChild) {
			if (results.entries.length) {
				const topWords = results.entries
					.slice(0, Math.min(5, results.entries.length))
					.map((entry) => `"${entry.display}" (${FORMATTERS.integer.format(entry.count)})`)
					.join(", ");
				tipsList.firstElementChild.textContent = `Top keywords: ${topWords}. Use the export buttons to capture these findings.`;
			} else {
				tipsList.firstElementChild.textContent = "Use the stop-word filter to remove filler terms and surface meaningful keywords quickly.";
			}
		}
	}

	function analyzeInput(force = false) {
		if (!inputText) return;
		const text = inputText.value || "";
		const options = collectOptions();
		const signature = JSON.stringify({ text, options });
		if (!force && signature === lastSignature) return;
		lastSignature = signature;

		if (!text.trim()) {
			renderResults({ entries: [] }, options);
			updateSummary({ entries: [], tokenCount: 0, uniqueCount: 0, ignoredStopWords: 0 }, options, 0);
			showStatus("Waiting for text input.", "warn");
			return;
		}

		const start = performance.now();
		const analysis = analyzeText(text, options);
		const elapsed = Math.max(0, Math.round(performance.now() - start));

		renderResults(analysis, options);
		updateSummary(analysis, options, elapsed);
		showStatus(`Analysis completed in ${elapsed} ms.`, "success");
	}

	function scheduleAnalysis() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => analyzeInput(false), 220);
	}

	function buildCsv() {
		if (!lastResults.entries.length) return "";
		const header = "rank,word,count,percentage\n";
		const rows = lastResults.entries.map((entry, index) => {
			const percent = lastResults.tokenCount ? (entry.count / lastResults.tokenCount) * 100 : 0;
			return `${index + 1},${JSON.stringify(entry.display)},${entry.count},${percent.toFixed(4)}`;
		});
		return header + rows.join("\n");
	}

	function buildJson() {
		return JSON.stringify({
			summary: {
				totalWords: lastResults.tokenCount,
				uniqueWords: lastResults.uniqueCount,
				ignoredStopWords: lastResults.ignoredStopWords,
				analysisMs: lastResults.analysisMs,
			},
			entries: lastResults.entries.map((entry, index) => ({
				rank: index + 1,
				word: entry.display,
				count: entry.count,
				percentage: lastResults.tokenCount ? entry.count / lastResults.tokenCount : 0,
			})),
		}, null, 2);
	}

	function downloadBlob(content, mime, extension) {
		if (!content) {
			showStatus("No data available to download yet.", "warn");
			return;
		}
		const blob = new Blob([content], { type: mime });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `word-frequency-${Date.now()}.${extension}`;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		setTimeout(() => URL.revokeObjectURL(url), 800);
		showStatus(`${extension.toUpperCase()} download ready.`, "success");
	}

	function downloadCsv() {
		downloadBlob(buildCsv(), "text/csv;charset=utf-8", "csv");
	}

	function downloadJson() {
		downloadBlob(buildJson(), "application/json;charset=utf-8", "json");
	}

	function copyTable() {
		if (!lastResults.entries.length) {
			showStatus("Nothing to copy yet. Analyze some text first.", "warn");
			return;
		}
		const header = "Rank\tWord\tCount\tPercent\n";
		const rows = lastResults.entries.map((entry, index) => {
			const percent = lastResults.tokenCount ? (entry.count / lastResults.tokenCount) * 100 : 0;
			return `${index + 1}\t${entry.display}\t${entry.count}\t${FORMATTERS.percent.format(percent)}`;
		});
		const payload = header + rows.join("\n");
		navigator.clipboard?.writeText(payload)
			.then(() => showStatus("Table copied to clipboard.", "success"))
			.catch(() => {
				try {
					const temp = document.createElement("textarea");
					temp.value = payload;
					temp.setAttribute("readonly", "");
					temp.style.position = "absolute";
					temp.style.left = "-9999px";
					document.body.appendChild(temp);
					temp.select();
					document.execCommand("copy");
					showStatus("Table copied to clipboard.", "success");
				} catch (error) {
					showStatus("Clipboard copy blocked. Download instead.", "error");
				} finally {
					const temp = document.querySelector("textarea[readonly][style*='-9999px']");
					if (temp && temp.parentNode) temp.parentNode.removeChild(temp);
				}
			});
	}

	function loadSample() {
		if (!inputText) return;
		inputText.value = DEFAULT_SAMPLE;
		updateInputStats();
		analyzeInput(true);
		inputText.focus();
		inputText.setSelectionRange(inputText.value.length, inputText.value.length);
	}

	function clearAll() {
		if (!inputText) return;
		inputText.value = "";
		updateInputStats();
		lastSignature = "";
		lastResults = { tokenCount: 0, uniqueCount: 0, ignoredStopWords: 0, analysisMs: 0, entries: [] };
		analyzeInput(true);
		showStatus("Cleared input and results.", "warn");
		inputText.focus();
	}

	function bindEvents() {
		inputText?.addEventListener("input", () => {
			updateInputStats();
			scheduleAnalysis();
		});
		[minFrequencyInput, maxResultsInput].forEach((input) => {
			input?.addEventListener("input", scheduleAnalysis);
		});
		[ignoreCommonToggle, caseSensitiveToggle, showPercentToggle, includeNumbersToggle, sortSelect].forEach((control) => {
			control?.addEventListener("change", scheduleAnalysis);
		});

		analyzeBtn?.addEventListener("click", () => analyzeInput(true));
		downloadCsvBtn?.addEventListener("click", downloadCsv);
		downloadJsonBtn?.addEventListener("click", downloadJson);
		copyTableBtn?.addEventListener("click", copyTable);
		loadSampleBtn?.addEventListener("click", loadSample);
		clearBtn?.addEventListener("click", clearAll);

		window.addEventListener("keydown", (event) => {
			if (event.ctrlKey && event.key === "Enter") {
				analyzeInput(true);
			}
		});
	}

	function init() {
		updateInputStats();
		bindEvents();
		analyzeInput(true);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();