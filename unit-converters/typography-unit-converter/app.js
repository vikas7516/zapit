(function () {
    "use strict";

    const CSS_REFERENCE_DPI = 96;
    const POINTS_PER_INCH = 72;
    const DEFAULT_CONTEXT = 16;
    const DEFAULT_ROOT = 16;
    const DEFAULT_VIEWPORT = 1280;

    const valueInput = document.getElementById("valueInput");
    const fromUnitSelect = document.getElementById("fromUnitSelect");
    const toUnitSelect = document.getElementById("toUnitSelect");
    const convertBtn = document.getElementById("convertBtn");
    const clearBtn = document.getElementById("clearBtn");
    const swapBtn = document.getElementById("swapBtn");
    const loadDefaultsBtn = document.getElementById("loadDefaultsBtn");
    const quickUnitButtons = document.querySelectorAll(".quick-units .btn-xs");

    const contextSizeInput = document.getElementById("contextSizeInput");
    const rootSizeInput = document.getElementById("rootSizeInput");
    const viewportWidthInput = document.getElementById("viewportWidthInput");

    const autoUpdateToggle = document.getElementById("autoUpdateToggle");
    const showFormulaToggle = document.getElementById("showFormulaToggle");
    const showTableToggle = document.getElementById("showTableToggle");
    const showCssToggle = document.getElementById("showCssToggle");
    const syncContextToggle = document.getElementById("syncContextToggle");
    const decimalSelect = document.getElementById("decimalSelect");

    const copyResultBtn = document.getElementById("copyResultBtn");
    const downloadCsvBtn = document.getElementById("downloadCsvBtn");
    const copyCssBtn = document.getElementById("copyCssBtn");

    const resultBadge = document.getElementById("resultBadge");
    const contextBadge = document.getElementById("contextBadge");
    const resultValue = document.getElementById("resultValue");
    const resultFormula = document.getElementById("resultFormula");
    const cssSnippetCard = document.getElementById("cssSnippetCard");
    const cssSnippet = document.getElementById("cssSnippet");
    const tableWrapper = document.getElementById("tableWrapper");
    const tableBody = document.getElementById("tableBody");

    const valueSummary = document.getElementById("valueSummary");
    const statusBanner = document.getElementById("statusBanner");

    const pxStat = document.getElementById("pxStat");
    const emStat = document.getElementById("emStat");
    const remStat = document.getElementById("remStat");
    const percentStat = document.getElementById("percentStat");
    const statsNote = document.getElementById("statsNote");
    const tipsList = document.getElementById("tipsList");

    if (!valueInput || !fromUnitSelect || !toUnitSelect) {
        return;
    }

    const numberFormatCache = new Map();

    const UNIT_DEFINITIONS = [
        {
            id: "px",
            label: "Pixels",
            notation: "px",
            category: "screen",
            toPx(value) { return value; },
            fromPx(pxValue) { return pxValue; }
        },
        {
            id: "pt",
            label: "Points",
            notation: "pt",
            category: "print",
            toPx(value) { return value * (CSS_REFERENCE_DPI / POINTS_PER_INCH); },
            fromPx(pxValue) { return pxValue * (POINTS_PER_INCH / CSS_REFERENCE_DPI); }
        },
        {
            id: "pc",
            label: "Picas",
            notation: "pc",
            category: "print",
            toPx(value) { return value * 12 * (CSS_REFERENCE_DPI / POINTS_PER_INCH); },
            fromPx(pxValue) { return pxValue / (12 * (CSS_REFERENCE_DPI / POINTS_PER_INCH)); }
        },
        {
            id: "in",
            label: "Inches",
            notation: "in",
            category: "print",
            toPx(value) { return value * CSS_REFERENCE_DPI; },
            fromPx(pxValue) { return pxValue / CSS_REFERENCE_DPI; }
        },
        {
            id: "cm",
            label: "Centimeters",
            notation: "cm",
            category: "print",
            toPx(value) { return value * (CSS_REFERENCE_DPI / 2.54); },
            fromPx(pxValue) { return pxValue / (CSS_REFERENCE_DPI / 2.54); }
        },
        {
            id: "mm",
            label: "Millimeters",
            notation: "mm",
            category: "print",
            toPx(value) { return value * (CSS_REFERENCE_DPI / 25.4); },
            fromPx(pxValue) { return pxValue / (CSS_REFERENCE_DPI / 25.4); }
        },
        {
            id: "q",
            label: "Quarter-millimeters",
            notation: "q",
            category: "print",
            toPx(value) { return value * (CSS_REFERENCE_DPI / 101.6); },
            fromPx(pxValue) { return pxValue / (CSS_REFERENCE_DPI / 101.6); }
        },
        {
            id: "em",
            label: "em (context)",
            notation: "em",
            category: "relative",
            toPx(value, ctx) { return value * ctx.contextSize; },
            fromPx(pxValue, ctx) { return pxValue / ctx.contextSize; }
        },
        {
            id: "rem",
            label: "rem (root)",
            notation: "rem",
            category: "relative",
            toPx(value, ctx) { return value * ctx.rootSize; },
            fromPx(pxValue, ctx) { return pxValue / ctx.rootSize; }
        },
        {
            id: "%",
            label: "Percent of context",
            notation: "%",
            category: "relative",
            toPx(value, ctx) { return (value / 100) * ctx.contextSize; },
            fromPx(pxValue, ctx) { return ctx.contextSize === 0 ? 0 : (pxValue / ctx.contextSize) * 100; }
        },
        {
            id: "vw",
            label: "Viewport width",
            notation: "vw",
            category: "viewport",
            toPx(value, ctx) { return (value / 100) * ctx.viewportWidth; },
            fromPx(pxValue, ctx) { return ctx.viewportWidth === 0 ? 0 : (pxValue / ctx.viewportWidth) * 100; }
        }
    ];

    const UNIT_BY_ID = UNIT_DEFINITIONS.reduce(function (map, unit) {
        map[unit.id] = unit;
        return map;
    }, {});

    const state = {
        autoUpdate: true,
        showFormula: true,
        showTable: true,
        showCss: true,
        syncContext: true,
        decimalPlaces: 2,
        currentPx: null,
        currentSummary: null,
        currentCss: null,
        tableData: []
    };

    function getNumberFormatter(decimals) {
        if (!numberFormatCache.has(decimals)) {
            numberFormatCache.set(
                decimals,
                new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                })
            );
        }
        return numberFormatCache.get(decimals);
    }

    function formatNumber(value, decimals) {
        if (!Number.isFinite(value)) {
            return "0";
        }
        const formatter = getNumberFormatter(decimals);
        return formatter.format(value);
    }

    function formatUnitValue(value, unitId, decimals) {
        const unit = UNIT_BY_ID[unitId];
        if (!unit) {
            return String(value);
        }
        const formatted = formatNumber(value, decimals);
        if (unit.notation === "%") {
            return `${formatted}%`;
        }
        return `${formatted}${unit.notation}`;
    }

    function formatPx(value, decimals) {
        return `${formatNumber(value, decimals)}px`;
    }

    function parseInputValue(input, fallback) {
        const raw = typeof input === "number" ? input : Number.parseFloat(input.value);
        if (!Number.isFinite(raw)) {
            if (typeof input !== "number") {
                input.value = String(fallback);
            }
            return fallback;
        }
        return raw;
    }

    function sanitizePositive(input, fallback) {
        let value = parseInputValue(input, fallback);
        if (value <= 0) {
            value = fallback;
            if (typeof input !== "number") {
                input.value = String(fallback);
            }
        }
        return value;
    }

    function getContextSettings() {
        const contextSize = sanitizePositive(contextSizeInput, DEFAULT_CONTEXT);
        const rootSize = state.syncContext ? contextSize : sanitizePositive(rootSizeInput, DEFAULT_ROOT);
        const viewportWidth = sanitizePositive(viewportWidthInput, DEFAULT_VIEWPORT);
        if (state.syncContext && rootSizeInput) {
            rootSizeInput.value = String(rootSize);
        }
        return {
            contextSize,
            rootSize,
            viewportWidth
        };
    }

    function populateUnitSelects() {
        const fragmentA = document.createDocumentFragment();
        const fragmentB = document.createDocumentFragment();
        UNIT_DEFINITIONS.forEach(function (unit) {
            const optionA = document.createElement("option");
            optionA.value = unit.id;
            optionA.textContent = `${unit.label} (${unit.notation})`;
            fragmentA.appendChild(optionA);

            const optionB = document.createElement("option");
            optionB.value = unit.id;
            optionB.textContent = `${unit.label} (${unit.notation})`;
            fragmentB.appendChild(optionB);
        });
        fromUnitSelect.appendChild(fragmentA);
        toUnitSelect.appendChild(fragmentB);

        fromUnitSelect.value = "px";
        toUnitSelect.value = "rem";
    }

    function clearStatus() {
        statusBanner.classList.add("hidden");
        statusBanner.textContent = "";
        statusBanner.classList.remove("success", "warn", "error");
    }

    function setStatus(message, type) {
        statusBanner.textContent = message;
        statusBanner.classList.remove("hidden", "success", "warn", "error");
        if (type) {
            statusBanner.classList.add(type);
        }
    }

    function setResultPending() {
        state.currentPx = null;
        state.currentSummary = null;
        state.currentCss = null;
        state.tableData = [];

        resultValue.textContent = "Enter a value to convert";
        resultFormula.textContent = "Breakdown will appear here with px equivalents and context notes.";
        resultFormula.style.display = state.showFormula ? "block" : "none";
        cssSnippet.textContent = "/* Run a conversion to generate CSS */";
        cssSnippetCard.classList.toggle("hidden", !state.showCss);
        tableBody.innerHTML = "<tr class=\"placeholder\"><td colspan=\"4\">Conversion table appears here after calculation.</td></tr>";
        tableWrapper.classList.toggle("hidden", !state.showTable);
        valueSummary.textContent = "Awaiting input.";
        resultBadge.textContent = "Result pending";

        const settings = getContextSettings();
        contextBadge.textContent = `Context ${formatNumber(settings.contextSize, 2).replace(/\.00$/, "")}px • Root ${formatNumber(settings.rootSize, 2).replace(/\.00$/, "")}px`;

        pxStat.textContent = "–";
        emStat.textContent = "–";
        remStat.textContent = "–";
        percentStat.textContent = "–";
        statsNote.textContent = "Awaiting input.";
    }

    function convertToPx(value, unitId, ctx) {
        const unit = UNIT_BY_ID[unitId];
        if (!unit) {
            throw new Error(`Unknown unit: ${unitId}`);
        }
        return unit.toPx(value, ctx);
    }

    function convertFromPx(pxValue, unitId, ctx) {
        const unit = UNIT_BY_ID[unitId];
        if (!unit) {
            throw new Error(`Unknown unit: ${unitId}`);
        }
        return unit.fromPx(pxValue, ctx);
    }

    function buildConversionTable(pxValue, ctx) {
        return UNIT_DEFINITIONS.map(function (unit) {
            const value = convertFromPx(pxValue, unit.id, ctx);
            return {
                id: unit.id,
                label: unit.label,
                notation: unit.notation,
                value,
                px: convertToPx(value, unit.id, ctx)
            };
        });
    }

    function renderTable(data, highlightUnitId) {
        if (!state.showTable) {
            tableWrapper.classList.add("hidden");
            return;
        }
        tableWrapper.classList.remove("hidden");
        if (!Array.isArray(data) || !data.length) {
            tableBody.innerHTML = "<tr class=\"placeholder\"><td colspan=\"4\">Conversion table appears here after calculation.</td></tr>";
            return;
        }
        const rows = data
            .map(function (row) {
                const highlightClass = row.id === highlightUnitId ? " class=\"highlight\"" : "";
                return `<tr${highlightClass}><td>${row.label}</td><td>${row.notation}</td><td>${formatUnitValue(row.value, row.id, state.decimalPlaces)}</td><td>${formatPx(row.px, state.decimalPlaces)}</td></tr>`;
            })
            .join("");
        tableBody.innerHTML = rows;
    }

    function formatSummary(fromUnitId, toUnitId, inputValue, targetValue, pxValue, ctx) {
        const fromUnit = UNIT_BY_ID[fromUnitId];
        const toUnit = UNIT_BY_ID[toUnitId];
        const decimals = state.decimalPlaces;
        const lines = [
            "Typography Unit Conversion",
            `${formatUnitValue(inputValue, fromUnitId, decimals)} (${formatPx(pxValue, decimals)}) → ${formatUnitValue(targetValue, toUnitId, decimals)}`,
            `Context font size: ${formatNumber(ctx.contextSize, 2)}px`,
            `Root font size: ${formatNumber(ctx.rootSize, 2)}px`,
            `Viewport width: ${formatNumber(ctx.viewportWidth, 2)}px`
        ];
        lines.push("");
        lines.push("Full table:");
        state.tableData.forEach(function (row) {
            lines.push(`${row.label} (${row.notation}): ${formatUnitValue(row.value, row.id, decimals)} | ${formatPx(row.px, decimals)}`);
        });
        return lines.join("\n");
    }

    function buildCssSnippet(toUnitId, targetValue, pxValue, ctx) {
        const decimals = state.decimalPlaces;
        const normalizedUnit = toUnitId.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "converted";
        const variableName = `--size-${normalizedUnit}`;
        const commentDetails = `/* equals ${formatPx(pxValue, decimals)} with context ${formatNumber(ctx.contextSize, 2)}px */`;
        const formattedValue = formatUnitValue(targetValue, toUnitId, decimals);
        return `:root {\n  ${variableName}: ${formattedValue}; ${commentDetails}\n}\n\n.component {\n  font-size: var(${variableName});\n}`;
    }

    function updateStats(pxValue, ctx) {
        pxStat.textContent = formatPx(pxValue, state.decimalPlaces);
        emStat.textContent = formatNumber(pxValue / ctx.contextSize, state.decimalPlaces) + "em";
        remStat.textContent = formatNumber(pxValue / ctx.rootSize, state.decimalPlaces) + "rem";
        percentStat.textContent = formatNumber((pxValue / ctx.contextSize) * 100, state.decimalPlaces) + "%";

        const percentValue = (pxValue / ctx.contextSize) * 100;
        const notes = [];
        if (percentValue > 200) {
            notes.push("This size is more than double your context font size—consider responsive scaling.");
        } else if (percentValue < 50) {
            notes.push("This size is less than half the context font size—verify readability on small screens.");
        } else {
            notes.push("Size is within a comfortable range for body text.");
        }
        if (ctx.contextSize !== ctx.rootSize) {
            notes.push(`Context (${formatNumber(ctx.contextSize, 2)}px) differs from root (${formatNumber(ctx.rootSize, 2)}px); rem and em values will diverge.`);
        }
        statsNote.textContent = notes.join(" ");
    }

    function updateTips(fromUnitId, toUnitId) {
        const baseTips = [
            "Set context & root font sizes to match your project so em and rem conversions stay accurate.",
            "Use the CSS snippet to paste ready-to-go custom properties or utility classes.",
            "Viewport units are based on your provided viewport width for responsive scaling.",
            "Keep an eye on the percent stat to check how aggressive your scaling is."
        ];
        const fromCategory = UNIT_BY_ID[fromUnitId]?.category;
        const toCategory = UNIT_BY_ID[toUnitId]?.category;

        if (fromCategory === "relative" || toCategory === "relative") {
            baseTips.unshift("Preview components with the same context size to ensure em/rem render exactly as expected.");
        }
        if (fromCategory === "print" || toCategory === "print") {
            baseTips.unshift("Print units assume the CSS reference pixel (96 DPI). For press-ready layouts, confirm with your design tool.");
        }
        if (fromCategory === "viewport" || toCategory === "viewport") {
            baseTips.unshift("When using viewport units, account for minimum and maximum clamps to avoid extremes on large displays.");
        }

        tipsList.innerHTML = "";
        baseTips.slice(0, 4).forEach(function (tip) {
            const li = document.createElement("li");
            li.textContent = tip;
            tipsList.appendChild(li);
        });
    }

    function convert() {
        clearStatus();
        const rawValue = Number.parseFloat(valueInput.value);
        if (!Number.isFinite(rawValue)) {
            setResultPending();
            setStatus("Enter a numeric value to convert.", "warn");
            return;
        }
        const fromUnitId = fromUnitSelect.value;
        const toUnitId = toUnitSelect.value;
        if (!fromUnitId || !toUnitId) {
            setStatus("Select both source and destination units.", "warn");
            return;
        }

        const ctx = getContextSettings();
        const decimals = state.decimalPlaces;

        try {
            const pxValue = convertToPx(rawValue, fromUnitId, ctx);
            if (!Number.isFinite(pxValue)) {
                throw new Error("Unable to compute base pixels for the provided input.");
            }
            const targetValue = convertFromPx(pxValue, toUnitId, ctx);

            state.currentPx = pxValue;
            state.tableData = state.showTable ? buildConversionTable(pxValue, ctx) : [];
            state.currentSummary = formatSummary(fromUnitId, toUnitId, rawValue, targetValue, pxValue, ctx);
            state.currentCss = buildCssSnippet(toUnitId, targetValue, pxValue, ctx);

            resultValue.textContent = `${formatUnitValue(rawValue, fromUnitId, decimals)} → ${formatUnitValue(targetValue, toUnitId, decimals)}`;
            resultBadge.textContent = `Converted ${UNIT_BY_ID[toUnitId]?.label || "result"}`;
            contextBadge.textContent = `Context ${formatNumber(ctx.contextSize, 2)}px • Root ${formatNumber(ctx.rootSize, 2)}px • Viewport ${formatNumber(ctx.viewportWidth, 2)}px`;

            if (state.showFormula) {
                resultFormula.style.display = "block";
                resultFormula.textContent = `${formatUnitValue(rawValue, fromUnitId, decimals)} × ${formatNumber(pxValue / rawValue || 0, decimals)} (${UNIT_BY_ID[fromUnitId]?.notation}→px) = ${formatPx(pxValue, decimals)} → ${formatUnitValue(targetValue, toUnitId, decimals)}`;
            } else {
                resultFormula.style.display = "none";
            }

            valueSummary.textContent = `Base pixels: ${formatPx(pxValue, decimals)} • Target: ${formatUnitValue(targetValue, toUnitId, decimals)}`;

            cssSnippetCard.classList.toggle("hidden", !state.showCss);
            cssSnippet.textContent = state.currentCss || "/* Toggle CSS snippet to view generated code */";

            renderTable(state.tableData, toUnitId);
            updateStats(pxValue, ctx);
            updateTips(fromUnitId, toUnitId);

            setStatus("Conversion updated.", "success");
        } catch (error) {
            console.error(error);
            setStatus("We couldn't complete that conversion. Double-check your inputs and try again.", "error");
        }
    }

    function handleAutoUpdate() {
        if (state.autoUpdate) {
            convert();
        }
    }

    function handleSwap() {
        const fromValue = fromUnitSelect.value;
        fromUnitSelect.value = toUnitSelect.value;
        toUnitSelect.value = fromValue;
        handleAutoUpdate();
    }

    function handleLoadDefaults() {
        contextSizeInput.value = DEFAULT_CONTEXT;
        viewportWidthInput.value = DEFAULT_VIEWPORT;
        if (state.syncContext) {
            rootSizeInput.value = DEFAULT_CONTEXT;
        } else {
            rootSizeInput.value = DEFAULT_ROOT;
        }
        decimalSelect.value = String(state.decimalPlaces);
        handleAutoUpdate();
    }

    function handleClear() {
        valueInput.value = "";
        setResultPending();
        clearStatus();
    }

    function handleQuickUnitClick(event) {
        const unitId = event.currentTarget.getAttribute("data-unit");
        if (!unitId) {
            return;
        }
        if (!fromUnitSelect.value) {
            fromUnitSelect.value = "px";
        }
        toUnitSelect.value = unitId;
        handleAutoUpdate();
    }

    function handleCopyResult() {
        if (!state.currentSummary) {
            setStatus("Run a conversion before copying the result.", "warn");
            return;
        }
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(state.currentSummary).then(function () {
                setStatus("Conversion summary copied to clipboard.", "success");
            }).catch(function () {
                setStatus("Clipboard access was blocked. Try again or copy manually.", "warn");
            });
        } else {
            setStatus("Clipboard API not available in this browser.", "warn");
        }
    }

    function handleCopyCss() {
        if (!state.currentCss) {
            setStatus("Generate CSS by running a conversion first.", "warn");
            return;
        }
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(state.currentCss).then(function () {
                setStatus("CSS snippet copied to clipboard.", "success");
            }).catch(function () {
                setStatus("Clipboard access was blocked. Try again or copy manually.", "warn");
            });
        } else {
            setStatus("Clipboard API not available in this browser.", "warn");
        }
    }

    function handleDownloadCsv() {
        if (!state.tableData.length) {
            setStatus("Run a conversion to build the conversion table first.", "warn");
            return;
        }
        const header = ["Unit", "Notation", "Value", "Base Pixels"];
        const rows = state.tableData.map(function (row) {
            return [row.label, row.notation, formatUnitValue(row.value, row.id, state.decimalPlaces), formatPx(row.px, state.decimalPlaces)];
        });
        const csv = [header].concat(rows).map(function (line) {
            return line.map(function (value) {
                const needsQuotes = /[",\n]/.test(value);
                const escaped = value.replace(/"/g, '""');
                return needsQuotes ? `"${escaped}"` : escaped;
            }).join(",");
        }).join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "typography-unit-conversion.csv";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        setStatus("CSV downloaded.", "success");
    }

    function handleToggleChange(event) {
        const target = event.target;
        const checked = target.checked;
        switch (target.id) {
            case "autoUpdateToggle":
                state.autoUpdate = checked;
                if (checked) {
                    convert();
                }
                break;
            case "showFormulaToggle":
                state.showFormula = checked;
                resultFormula.style.display = checked ? "block" : "none";
                if (checked && state.currentPx !== null) {
                    convert();
                }
                break;
            case "showTableToggle":
                state.showTable = checked;
                tableWrapper.classList.toggle("hidden", !checked);
                if (checked && state.currentPx !== null) {
                    convert();
                }
                break;
            case "showCssToggle":
                state.showCss = checked;
                cssSnippetCard.classList.toggle("hidden", !checked);
                if (checked && state.currentPx !== null) {
                    cssSnippet.textContent = state.currentCss || cssSnippet.textContent;
                }
                break;
            case "syncContextToggle":
                state.syncContext = checked;
                rootSizeInput.disabled = checked;
                if (checked) {
                    rootSizeInput.value = contextSizeInput.value;
                }
                handleAutoUpdate();
                break;
            default:
                break;
        }
    }

    function handleDecimalChange() {
        const value = parseInt(decimalSelect.value, 10);
        if (Number.isNaN(value) || value < 0 || value > 6) {
            state.decimalPlaces = 2;
            decimalSelect.value = "2";
        } else {
            state.decimalPlaces = value;
        }
        handleAutoUpdate();
    }

    function bindEvents() {
        valueInput.addEventListener("input", handleAutoUpdate);
        fromUnitSelect.addEventListener("change", handleAutoUpdate);
        toUnitSelect.addEventListener("change", handleAutoUpdate);

        contextSizeInput.addEventListener("input", function () {
            if (state.syncContext) {
                rootSizeInput.value = contextSizeInput.value;
            }
            handleAutoUpdate();
        });
        rootSizeInput.addEventListener("input", handleAutoUpdate);
        viewportWidthInput.addEventListener("input", handleAutoUpdate);

        convertBtn.addEventListener("click", convert);
        clearBtn.addEventListener("click", handleClear);
        swapBtn.addEventListener("click", handleSwap);
        loadDefaultsBtn.addEventListener("click", handleLoadDefaults);

        quickUnitButtons.forEach(function (button) {
            button.addEventListener("click", handleQuickUnitClick);
        });

        copyResultBtn.addEventListener("click", handleCopyResult);
        copyCssBtn.addEventListener("click", handleCopyCss);
        downloadCsvBtn.addEventListener("click", handleDownloadCsv);

        [autoUpdateToggle, showFormulaToggle, showTableToggle, showCssToggle, syncContextToggle].forEach(function (toggle) {
            toggle.addEventListener("change", handleToggleChange);
        });

        decimalSelect.addEventListener("change", handleDecimalChange);
    }

    function initialize() {
        populateUnitSelects();

        state.autoUpdate = autoUpdateToggle.checked;
        state.showFormula = showFormulaToggle.checked;
        state.showTable = showTableToggle.checked;
        state.showCss = showCssToggle.checked;
        state.syncContext = syncContextToggle.checked;
        state.decimalPlaces = parseInt(decimalSelect.value, 10) || 2;

        rootSizeInput.disabled = state.syncContext;
        if (state.syncContext) {
            rootSizeInput.value = contextSizeInput.value;
        }

        setResultPending();

        if (state.autoUpdate) {
            convert();
        }
    }

    bindEvents();
    initialize();
})();
