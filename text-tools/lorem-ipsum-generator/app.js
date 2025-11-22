(function () {
    "use strict";

    const sentencesPool = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        "Morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
        "Nulla facilisi. Integer vitae justo eget magna fermentum iaculis.",
        "Praesent elementum facilisis leo vel fringilla est ullamcorper eget nulla.",
        "Curabitur non nulla sit amet nisl tempus convallis quis ac lectus.",
        "Cras ultricies ligula sed magna dictum porta.",
        "Vivamus suscipit tortor eget felis porttitor volutpat.",
        "Donec sollicitudin molestie malesuada.",
        "Pellentesque in ipsum id orci porta dapibus.",
        "Porta lorem mollis aliquam ut porttitor leo a diam sollicitudin.",
        "Eget velit aliquet sagittis id consectetur purus ut faucibus pulvinar.",
        "Suspendisse potenti. Pellentesque habitant morbi tristique senectus.",
        "Aliquam eleifend mi in nulla posuere sollicitudin aliquam ultrices.",
        "Amet porttitor eget dolor morbi non arcu risus quis.",
        "Mauris in aliquam sem fringilla ut morbi tincidunt augue interdum.",
        "Commodo elit at imperdiet dui accumsan sit amet nulla facilisi."
    ];

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    const quantityInput = $("#quantity");
    const unitSelect = $("#unit");
    const startClassicCheckbox = $("#startClassic");
    const wrapHtmlCheckbox = $("#wrapHtml");
    const includeHeadingsCheckbox = $("#includeHeadings");

    const generateBtn = $("#generateBtn");
    const clearBtn = $("#clearBtn");
    const copyBtn = $("#copyBtn");
    const downloadBtn = $("#downloadBtn");

    const rawPreview = $("#rawPreview");
    const renderedPreview = $("#renderedPreview");
    const lengthBadge = $("#lengthBadge");

    const paragraphCountEl = $("#paragraphCount");
    const sentenceCountEl = $("#sentenceCount");
    const wordCountEl = $("#wordCount");
    const readingTimeEl = $("#readingTime");

    const statusBanner = $("#statusBanner");

    const tabButtons = $$(".tab-btn");

    let lastResult = {
        raw: "",
        html: "",
        paragraphs: 0,
        sentences: 0,
        words: 0,
        readingTimeSeconds: 0
    };
    let activePreview = "renderedPreview";

    function showPreview(targetId) {
        activePreview = targetId;
        if (targetId === "rawPreview") {
            rawPreview.classList.remove("hidden");
            renderedPreview.classList.add("hidden");
        } else {
            renderedPreview.classList.remove("hidden");
            rawPreview.classList.add("hidden");
        }
    }

    function syncHeadingOption() {
        const disabled = !wrapHtmlCheckbox.checked;
        includeHeadingsCheckbox.disabled = disabled;
        const wrapper = includeHeadingsCheckbox.closest(".checkbox");
        if (wrapper) {
            wrapper.classList.toggle("disabled", disabled);
        }
        if (disabled) {
            includeHeadingsCheckbox.checked = false;
        }
    }

    function cycleSentences(count, startWithClassic) {
        const results = [];
        let pointer = startWithClassic ? 1 : 0;

        if (startWithClassic) {
            results.push(sentencesPool[0]);
        }

        while (results.length < count) {
            results.push(sentencesPool[pointer % sentencesPool.length]);
            pointer += 1;
        }

        return results;
    }

    function buildParagraphs(count, startWithClassic) {
        const paragraphs = [];
        const sentencesNeeded = count * 4; // average 4 sentences per paragraph
        const sentences = cycleSentences(sentencesNeeded, startWithClassic);
        let cursor = 0;

        for (let i = 0; i < count; i++) {
            const span = Math.min(4, sentences.length - cursor);
            const chunk = sentences.slice(cursor, cursor + span);
            cursor += span;
            paragraphs.push(chunk.join(" "));
        }

        return paragraphs;
    }

    function buildSentences(count, startWithClassic) {
        return cycleSentences(count, startWithClassic);
    }

    function buildWords(count, startWithClassic) {
        const sentences = cycleSentences(Math.ceil(count / 12) + 1, startWithClassic);
        const words = sentences
            .join(" ")
            .replace(/[.]/g, "")
            .split(/\s+/)
            .filter(Boolean);
        return words.slice(0, count);
    }

    function computeReadingTime(words) {
        if (!words || words <= 0) {
            return "0s";
        }
        const seconds = Math.max(1, Math.round((words / 200) * 60));
        const minutes = Math.floor(seconds / 60);
        const remain = seconds % 60;
        if (minutes === 0) {
            return `${seconds}s`;
        }
        if (remain === 0) {
            return `${minutes}m`;
        }
        return `${minutes}m ${remain}s`;
    }

    function wrapContent({ unit, segments, wrapHtml, includeHeadings }) {
        let raw = "";
        let html = "";

        if (!wrapHtml) {
            if (unit === "paragraphs") {
                raw = segments.join("\n\n");
            } else if (unit === "sentences") {
                raw = segments.join(" ");
            } else {
                raw = segments.join(" ");
            }
            html = raw
                .split("\n")
                .map((line) => `<p>${line}</p>`)
                .join("");
            return { raw, html };
        }

        if (unit === "paragraphs") {
            const parts = [];
            segments.forEach((paragraph, index) => {
                if (includeHeadings && index % 3 === 0) {
                    const headingSize = index % 2 === 0 ? "h2" : "h3";
                    const headingText = paragraph
                        .split(" ")
                        .slice(0, 4)
                        .map((word) => word.replace(/[^a-zA-Z]/g, ""))
                        .join(" ") || "Lorem Ipsum";
                    parts.push(`<${headingSize}>${headingText}</${headingSize}>`);
                }
                parts.push(`<p>${paragraph}</p>`);
            });
            html = parts.join("\n");
            raw = html;
            return { raw, html };
        }

        if (unit === "sentences") {
            const listItems = segments.map((sentence) => `<li>${sentence}</li>`);
            html = `<ul>\n${listItems.join("\n")}\n</ul>`;
            raw = html;
            return { raw, html };
        }

        const chunkSize = Math.ceil(segments.length / 3);
        const columns = [];
        for (let i = 0; i < segments.length; i += chunkSize) {
            const columnWords = segments.slice(i, i + chunkSize).join(" ");
            columns.push(`<p>${columnWords}</p>`);
        }
        html = columns.join("\n");
        raw = html;
        return { raw, html };
    }

    function generateLorem() {
    syncHeadingOption();

    const quantity = Math.min(99, Math.max(1, parseInt(quantityInput.value, 10) || 1));
        const unit = unitSelect.value;
        const startClassic = Boolean(startClassicCheckbox.checked);
        const wrapHtml = Boolean(wrapHtmlCheckbox.checked);
        const includeHeadings = Boolean(includeHeadingsCheckbox.checked);

        quantityInput.value = quantity;

        let segments = [];
        let paragraphs = 0;
        let sentences = 0;
        let words = 0;

        if (unit === "paragraphs") {
            segments = buildParagraphs(quantity, startClassic);
            paragraphs = segments.length;
            sentences = segments.reduce((acc, paragraph) => acc + paragraph.split(/[.!?]+/).filter(Boolean).length, 0);
            words = segments.join(" ").split(/\s+/).filter(Boolean).length;
        } else if (unit === "sentences") {
            segments = buildSentences(quantity, startClassic);
            paragraphs = Math.ceil(segments.length / 4);
            sentences = segments.length;
            words = segments.join(" ").split(/\s+/).filter(Boolean).length;
        } else {
            segments = buildWords(quantity, startClassic);
            paragraphs = Math.ceil(segments.length / 60);
            sentences = Math.ceil(segments.length / 12);
            words = segments.length;
        }

        const { raw, html } = wrapContent({ unit, segments, wrapHtml, includeHeadings });

        lastResult = {
            raw,
            html,
            paragraphs,
            sentences,
            words,
            readingTimeSeconds: Math.max(1, Math.round((words / 200) * 60))
        };

        rawPreview.textContent = raw;
        renderedPreview.innerHTML = html;
        updateStats();
        showStatus("Generated fresh lorem ipsum for you.", "success");
        showPreview(activePreview);
    }

    function updateStats() {
        lengthBadge.textContent = `${lastResult.raw.length} characters`;
        paragraphCountEl.textContent = lastResult.paragraphs.toString();
        sentenceCountEl.textContent = lastResult.sentences.toString();
        wordCountEl.textContent = lastResult.words.toString();
        readingTimeEl.textContent = computeReadingTime(lastResult.words);
    }

    function showStatus(message, tone) {
        statusBanner.textContent = message;
        statusBanner.classList.remove("success", "warn", "error");
        if (tone) {
            statusBanner.classList.add(tone);
        }
        statusBanner.classList.remove("hidden");
        clearTimeout(showStatus._timer);
        showStatus._timer = setTimeout(() => {
            statusBanner.classList.add("hidden");
        }, 4000);
    }

    function copyText() {
        if (!lastResult.raw) {
            showStatus("Generate some lorem ipsum before copying.", "warn");
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(lastResult.raw)
                .then(() => showStatus("Copied to clipboard.", "success"))
                .catch(() => showStatus("Clipboard permissions blocked.", "error"));
            return;
        }
        const temp = document.createElement("textarea");
        temp.value = lastResult.raw;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand("copy");
            showStatus("Copied to clipboard.", "success");
        } catch (err) {
            showStatus("Clipboard copy is not supported in this browser.", "error");
        }
        document.body.removeChild(temp);
    }

    function downloadText() {
        if (!lastResult.raw) {
            showStatus("Nothing to download yet. Generate some text first.", "warn");
            return;
        }
        const blob = new Blob([lastResult.raw], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "lorem-ipsum.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1500);
        showStatus("Download ready.", "success");
    }

    function clearAll() {
        rawPreview.textContent = "";
        renderedPreview.innerHTML = "";
        lastResult = {
            raw: "",
            html: "",
            paragraphs: 0,
            sentences: 0,
            words: 0,
            readingTimeSeconds: 0
        };
        updateStats();
        showPreview(activePreview);
        showStatus("Cleared the current output.", "warn");
        quantityInput.focus();
    }

    function switchTab(event) {
        const target = event.currentTarget;
        if (target.classList.contains("active")) {
            return;
        }
        const desired = target.dataset.target;
        tabButtons.forEach((btn) => btn.classList.toggle("active", btn === target));
        showPreview(desired);
        if (desired === "rawPreview") {
            rawPreview.focus();
        }
    }

    function bindEvents() {
        generateBtn.addEventListener("click", generateLorem);
        clearBtn.addEventListener("click", clearAll);
        copyBtn.addEventListener("click", copyText);
        downloadBtn.addEventListener("click", downloadText);

        tabButtons.forEach((btn) => btn.addEventListener("click", switchTab));

        [quantityInput, unitSelect].forEach((input) => {
            input.addEventListener("change", () => {
                if (lastResult.raw) {
                    generateLorem();
                }
            });
        });

        [startClassicCheckbox, wrapHtmlCheckbox, includeHeadingsCheckbox].forEach((input) => {
            input.addEventListener("change", () => {
                if (input === wrapHtmlCheckbox) {
                    syncHeadingOption();
                }
                if (lastResult.raw) {
                    generateLorem();
                }
            });
        });
    }

    function init() {
        bindEvents();
        syncHeadingOption();
        generateLorem();
        showPreview(activePreview);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
