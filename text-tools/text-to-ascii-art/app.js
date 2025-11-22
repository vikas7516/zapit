(function () {
    "use strict";

    const FIGLET_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/figlet@1.5.2/umd/figlet.min.js";
    const FIGLET_FONT_PATH = "https://cdn.jsdelivr.net/npm/figlet@1.5.2/fonts/";
    const HARD_WRAP_COLUMN = 80;

    const FONT_OPTIONS = [
        { value: "Standard", label: "Standard", hint: "Classic FIGlet block lettering suitable for most uses." },
        { value: "Slant", label: "Slant", hint: "Italicized diagonal strokes for dynamic headlines." },
        { value: "Big", label: "Big", hint: "Bold, tall letters with dramatic presence." },
        { value: "Lean", label: "Lean", hint: "Compact diagonal lettering for narrow spaces." },
        { value: "Ogre", label: "Ogre", hint: "Heavy carved look with chunky serifs." },
        { value: "ANSI Shadow", label: "ANSI Shadow", hint: "Thick letters with right-side shading." },
        { value: "Banner", label: "Banner", hint: "Wide banner caps, perfect for dividers." },
        { value: "Bloody", label: "Bloody", hint: "Dripping horror aesthetic for playful headers." },
        { value: "DOS Rebel", label: "DOS Rebel", hint: "Retro DOS-era vibe with sharp corners." },
        { value: "Epic", label: "Epic", hint: "High-impact uppercase with sci-fi flair." },
        { value: "Fire Font-k", label: "Fire Font-k", hint: "Jagged peaks mimicking flame tongues." },
        { value: "Five Line Oblique", label: "Five Line Oblique", hint: "Five stacked strokes with oblique tilt." },
        { value: "Ghost", label: "Ghost", hint: "Hollow centerlines for airy displays." },
        { value: "Isometric1", label: "Isometric 1", hint: "Pseudo 3D projection with crisp edges." },
        { value: "Larry 3D", label: "Larry 3D", hint: "Layered perspective for standout titles." },
        { value: "Modular", label: "Modular", hint: "Geometric blocks with futuristic styling." },
        { value: "Puffy", label: "Puffy", hint: "Rounded bubble letters for friendly tone." },
        { value: "Rectangles", label: "Rectangles", hint: "Chunky rectangles forming each glyph." },
        { value: "Small", label: "Small", hint: "Compact, tidy lines for subtle banners." },
        { value: "Speed", label: "Speed", hint: "Slashed strokes implying fast motion." },
        { value: "Star Wars", label: "Star Wars", hint: "Galaxy-far-away stylings for sci-fi fans." },
        { value: "Sub-Zero", label: "Sub-Zero", hint: "Cool futuristic wedges with angular edges." },
        { value: "Trek", label: "Trek", hint: "Federation-inspired glyphs with wide stance." }
    ];

    const $ = (selector) => document.querySelector(selector);
    const asciiTextarea = $("#asciiOutput");
    const inputText = $("#inputText");
    const charCount = $("#charCount");
    const lineCount = $("#lineCount");
    const statusBanner = $("#statusBanner");
    const fontSelect = $("#fontSelect");
    const alignSelect = $("#alignSelect");
    const smushToggle = $("#smushToggle");
    const hardWrapToggle = $("#hardWrapToggle");
    const trimBlankLinesToggle = $("#trimBlankLines");
    const renderBtn = $("#renderBtn");
    const copyOutputBtn = $("#copyOutputBtn");
    const downloadBtn = $("#downloadBtn");
    const loadSampleBtn = $("#loadSampleBtn");
    const clearBtn = $("#clearBtn");
    const fontBadge = $("#fontBadge");
    const dimensionBadge = $("#dimensionBadge");
    const statsNote = $("#statsNote");
    const outputLinesStat = $("#outputLinesStat");
    const outputWidthStat = $("#outputWidthStat");
    const outputCharsStat = $("#outputCharsStat");
    const renderTimeStat = $("#renderTimeStat");

    let pendingRenderTimer = null;
    let lastRenderedOutput = "";
    let lastRenderedInput = "";
    let lastRenderSignature = "";
    let figletPromise = null;
    const fontPromises = new Map();

    function showStatus(message, tone) {
        if (!statusBanner) {
            return;
        }
        statusBanner.textContent = message;
        statusBanner.classList.remove("hidden", "success", "warn", "error");
        if (tone) {
            statusBanner.classList.add(tone);
        }
        clearTimeout(showStatus._timer);
        showStatus._timer = setTimeout(() => {
            statusBanner.classList.add("hidden");
        }, 3600);
    }

    function updateInputStats() {
        const value = inputText.value || "";
        const length = value.length;
        const lines = value ? value.split(/\r?\n/).length : 0;
        charCount.textContent = `${length} / 200 characters`;
        lineCount.textContent = `${lines} ${lines === 1 ? "line" : "lines"}`;
    }

    function populateFontSelect() {
        const fragment = document.createDocumentFragment();
        FONT_OPTIONS.forEach((font, index) => {
            const option = document.createElement("option");
            option.value = font.value;
            option.textContent = font.label;
            if (index === 0) {
                option.selected = true;
            }
            fragment.appendChild(option);
        });
        fontSelect.appendChild(fragment);
        fontBadge.textContent = `Font: ${fontSelect.value}`;
    }

    function loadFiglet() {
        if (window.figlet) {
            return Promise.resolve(window.figlet);
        }
        if (figletPromise) {
            return figletPromise;
        }
        figletPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = FIGLET_SCRIPT_URL;
            script.async = true;
            script.onload = () => {
                if (window.figlet) {
                    window.figlet.defaults({ fontPath: FIGLET_FONT_PATH });
                    resolve(window.figlet);
                } else {
                    reject(new Error("Figlet library failed to initialize."));
                }
            };
            script.onerror = () => {
                reject(new Error("Unable to load FIGlet library. Check your connection."));
            };
            document.head.appendChild(script);
        });
        return figletPromise;
    }

    function ensureFontLoaded(fontName) {
        return loadFiglet().then((figlet) => {
            if (figlet.metadata && figlet.metadata[fontName]) {
                return figlet;
            }
            if (figlet?.fonts?.[fontName]) {
                return figlet;
            }
            if (fontPromises.has(fontName)) {
                return fontPromises.get(fontName);
            }
            const promise = new Promise((resolve, reject) => {
                figlet.loadFont(fontName, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(figlet);
                });
            });
            fontPromises.set(fontName, promise);
            return promise;
        });
    }

    function trimEmptyEdges(lines) {
        let start = 0;
        let end = lines.length - 1;
        while (start <= end && !lines[start].trim()) {
            start += 1;
        }
        while (end >= start && !lines[end].trim()) {
            end -= 1;
        }
        return lines.slice(start, end + 1);
    }

    function applyHardWrap(lines, width) {
        const wrapped = [];
        lines.forEach((line) => {
            if (line.length <= width) {
                wrapped.push(line);
                return;
            }
            let cursor = 0;
            while (cursor < line.length) {
                wrapped.push(line.slice(cursor, cursor + width));
                cursor += width;
            }
        });
        return wrapped;
    }

    function alignLines(lines, alignment) {
        const maxWidth = lines.reduce((max, line) => Math.max(max, line.length), 0);
        const aligned = lines.map((line) => {
            if (!line.length) {
                return "";
            }
            const padding = maxWidth - line.length;
            if (alignment === "right") {
                return `${" ".repeat(padding)}${line}`;
            }
            if (alignment === "center") {
                const left = Math.floor(padding / 2);
                return `${" ".repeat(left)}${line}`;
            }
            return line;
        });
        return { lines: aligned, width: maxWidth };
    }

    function computeOutputStats(lines) {
        const width = lines.reduce((max, line) => Math.max(max, line.length), 0);
        const characters = lines.reduce((total, line) => total + line.length, 0);
        return {
            lines: lines.length,
            width,
            characters
        };
    }

    function updateStatsDisplay(stats, elapsedMs) {
        outputLinesStat.textContent = stats.lines.toLocaleString();
        outputWidthStat.textContent = stats.width.toLocaleString();
        outputCharsStat.textContent = stats.characters.toLocaleString();
        renderTimeStat.textContent = `${elapsedMs} ms`;
    }

    function updateBadges(fontName, stats) {
        fontBadge.textContent = `Font: ${fontName}`;
        if (stats.width && stats.lines) {
            dimensionBadge.textContent = `${stats.width}w × ${stats.lines}h`;
        } else {
            dimensionBadge.textContent = "–";
        }
    }

    function getFontHint(fontName) {
        const match = FONT_OPTIONS.find((font) => font.value === fontName);
        return match ? match.hint : "";
    }

    function renderAscii(force = false) {
        const rawValue = inputText.value || "";
        const text = rawValue.trimEnd();
        const signature = JSON.stringify({
            text,
            font: fontSelect.value,
            align: alignSelect.value,
            smush: smushToggle.checked,
            hardWrap: hardWrapToggle.checked,
            trim: trimBlankLinesToggle.checked
        });
        if (!force && signature === lastRenderSignature) {
            return;
        }

        if (!text.trim()) {
            asciiTextarea.textContent = "Start typing to generate ASCII art...";
            statsNote.textContent = "Awaiting input.";
            lastRenderedOutput = "";
            lastRenderedInput = "";
            lastRenderSignature = "";
            updateBadges(fontSelect.value, { width: 0, lines: 0 });
            updateStatsDisplay({ lines: 0, width: 0, characters: 0 }, 0);
            return;
        }

        renderBtn.disabled = true;
        renderBtn.textContent = "Generating...";
        const startTime = performance.now();
        const selectedFont = fontSelect.value;
        loadFiglet()
            .then(() => ensureFontLoaded(selectedFont))
            .then((figlet) => {
                const options = {
                    font: selectedFont,
                    horizontalLayout: smushToggle.checked ? "fitted" : "full",
                    verticalLayout: smushToggle.checked ? "fitted" : "full",
                    width: hardWrapToggle.checked ? HARD_WRAP_COLUMN : 2000,
                    whitespaceBreak: hardWrapToggle.checked
                };
                let output;
                try {
                    output = figlet.textSync(text, options);
                } catch (error) {
                    throw new Error("ASCII rendering failed. Try a different font or refresh the page.");
                }
                let lines = output.split("\n");
                if (trimBlankLinesToggle.checked) {
                    lines = trimEmptyEdges(lines);
                }
                if (hardWrapToggle.checked) {
                    lines = applyHardWrap(lines, HARD_WRAP_COLUMN);
                }
                const { lines: alignedLines, width } = alignLines(lines, alignSelect.value);
                const stats = computeOutputStats(alignedLines);
                lastRenderedOutput = alignedLines.join("\n");
                lastRenderedInput = text;
                lastRenderSignature = signature;
                asciiTextarea.textContent = lastRenderedOutput;
                const elapsed = Math.max(0, Math.round(performance.now() - startTime));
                updateStatsDisplay(stats, elapsed);
                updateBadges(selectedFont, { width, lines: alignedLines.length });
                statsNote.textContent = `${alignSelect.value.charAt(0).toUpperCase() + alignSelect.value.slice(1)} alignment • ${smushToggle.checked ? "Smushing" : "Full width"}${hardWrapToggle.checked ? " • Hard wrap 80" : ""}`;
                const hint = getFontHint(selectedFont);
                if (hint) {
                    statsNote.textContent += ` • ${hint}`;
                }
                renderBtn.disabled = false;
                renderBtn.textContent = "Generate ASCII Art";
                showStatus("ASCII art generated.", "success");
            })
            .catch((error) => {
                asciiTextarea.textContent = "Could not render ASCII art. Please try again.";
                statsNote.textContent = error.message || "Rendering failed.";
                lastRenderedOutput = "";
                lastRenderedInput = "";
                lastRenderSignature = "";
                updateBadges(fontSelect.value, { width: 0, lines: 0 });
                updateStatsDisplay({ lines: 0, width: 0, characters: 0 }, 0);
                showStatus(error.message || "Failed to generate ASCII art.", "error");
                renderBtn.disabled = false;
                renderBtn.textContent = "Generate ASCII Art";
            });
    }

    function scheduleRender() {
        clearTimeout(pendingRenderTimer);
        pendingRenderTimer = setTimeout(() => renderAscii(false), 260);
    }

    function copyOutput() {
        if (!lastRenderedOutput) {
            showStatus("Generate ASCII art before copying.", "warn");
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(lastRenderedOutput)
                .then(() => showStatus("ASCII art copied to clipboard.", "success"))
                .catch(() => showStatus("Clipboard copy blocked. Use the keyboard shortcut instead.", "error"));
            return;
        }
        const temp = document.createElement("textarea");
        temp.value = lastRenderedOutput;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand("copy");
            showStatus("ASCII art copied to clipboard.", "success");
        } catch (error) {
            showStatus("Clipboard copy is not supported in this browser.", "error");
        }
        document.body.removeChild(temp);
    }

    function downloadOutput() {
        if (!lastRenderedOutput) {
            showStatus("Generate ASCII art before downloading.", "warn");
            return;
        }
        const blob = new Blob([lastRenderedOutput], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `ascii-art-${fontSelect.value.toLowerCase().replace(/\s+/g, "-")}.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 1200);
        showStatus("ASCII art download ready.", "success");
    }

    function loadSample() {
        inputText.value = "ZAPIT\nASCII MAGIC";
        updateInputStats();
        renderAscii(true);
        inputText.focus();
        inputText.setSelectionRange(inputText.value.length, inputText.value.length);
    }

    function clearAll() {
        inputText.value = "";
        asciiTextarea.textContent = "Start typing to generate ASCII art...";
        statsNote.textContent = "Awaiting input.";
        updateInputStats();
        updateStatsDisplay({ lines: 0, width: 0, characters: 0 }, 0);
        updateBadges(fontSelect.value, { width: 0, lines: 0 });
        lastRenderedOutput = "";
        lastRenderedInput = "";
        showStatus("Cleared input and preview.", "warn");
        inputText.focus();
    }

    function bindEvents() {
        inputText.addEventListener("input", () => {
            updateInputStats();
            scheduleRender();
        });
        fontSelect.addEventListener("change", () => {
            fontBadge.textContent = `Font: ${fontSelect.value}`;
            scheduleRender();
        });
        alignSelect.addEventListener("change", scheduleRender);
        smushToggle.addEventListener("change", scheduleRender);
        hardWrapToggle.addEventListener("change", scheduleRender);
        trimBlankLinesToggle.addEventListener("change", scheduleRender);
        renderBtn.addEventListener("click", () => renderAscii(true));
        copyOutputBtn.addEventListener("click", copyOutput);
        downloadBtn.addEventListener("click", downloadOutput);
        loadSampleBtn.addEventListener("click", loadSample);
        clearBtn.addEventListener("click", clearAll);
    }

    function init() {
        populateFontSelect();
        updateInputStats();
        bindEvents();
        scheduleRender();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
