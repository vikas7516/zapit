(() => {
    "use strict";

    const CATEGORY_DATA = {
        length: {
            label: "Length & Distance",
            shortLabel: "Length",
            baseUnit: "meter",
            defaultFrom: "kilometer",
            defaultTo: "mile",
            sample: { value: 5, from: "kilometer", to: "mile" },
            tips: [
                "1 inch equals 2.54 centimeters exactly — handy for US to metric conversions.",
                "Use kilometers or miles for long distances such as travel routes.",
                "Millimeters give the best precision for fabrication and machining.",
                "Nautical miles (not included here) are often used in aviation and marine navigation."
            ],
            units: {
                millimeter: { label: "Millimeter", symbol: "mm", factor: 0.001 },
                centimeter: { label: "Centimeter", symbol: "cm", factor: 0.01 },
                meter: { label: "Meter", symbol: "m", factor: 1 },
                kilometer: { label: "Kilometer", symbol: "km", factor: 1000 },
                inch: { label: "Inch", symbol: "in", factor: 0.0254 },
                foot: { label: "Foot", symbol: "ft", factor: 0.3048 },
                yard: { label: "Yard", symbol: "yd", factor: 0.9144 },
                mile: { label: "Mile", symbol: "mi", factor: 1609.344 }
            }
        },
        area: {
            label: "Area",
            shortLabel: "Area",
            baseUnit: "squareMeter",
            defaultFrom: "squareMeter",
            defaultTo: "squareFoot",
            sample: { value: 120, from: "squareMeter", to: "squareFoot" },
            tips: [
                "Use hectares for agricultural land planning (1 ha = 10,000 m²).",
                "Square feet remain common in real estate listings in the US.",
                "Large-scale geographic areas are best expressed in square kilometers or acres.",
                "Keep an eye on unit prefixes — 'square' magnifies differences quickly."
            ],
            units: {
                squareMillimeter: { label: "Square Millimeter", symbol: "mm²", factor: 1e-6 },
                squareCentimeter: { label: "Square Centimeter", symbol: "cm²", factor: 1e-4 },
                squareMeter: { label: "Square Meter", symbol: "m²", factor: 1 },
                squareKilometer: { label: "Square Kilometer", symbol: "km²", factor: 1e6 },
                squareInch: { label: "Square Inch", symbol: "in²", factor: 0.00064516 },
                squareFoot: { label: "Square Foot", symbol: "ft²", factor: 0.092903 },
                squareYard: { label: "Square Yard", symbol: "yd²", factor: 0.836127 },
                acre: { label: "Acre", symbol: "ac", factor: 4046.8564224 },
                hectare: { label: "Hectare", symbol: "ha", factor: 10000 }
            }
        },
        volume: {
            label: "Volume",
            shortLabel: "Volume",
            baseUnit: "liter",
            defaultFrom: "liter",
            defaultTo: "gallon",
            sample: { value: 3.5, from: "liter", to: "gallon" },
            tips: [
                "US customary cups, pints, quarts, and gallons differ from UK imperial units.",
                "Use milliliters for pharmaceuticals or recipes requiring small quantities.",
                "Cubic meters are ideal for large tanks, pools, or shipping containers.",
                "Fluid ounces are handy for beverage portions and packaged drinks."
            ],
            units: {
                milliliter: { label: "Milliliter", symbol: "mL", factor: 0.001 },
                liter: { label: "Liter", symbol: "L", factor: 1 },
                cubicMeter: { label: "Cubic Meter", symbol: "m³", factor: 1000 },
                teaspoon: { label: "Teaspoon (US)", symbol: "tsp", factor: 0.00492892 },
                tablespoon: { label: "Tablespoon (US)", symbol: "Tbsp", factor: 0.0147868 },
                fluidOunce: { label: "Fluid Ounce (US)", symbol: "fl oz", factor: 0.0295735 },
                cup: { label: "Cup (US)", symbol: "cup", factor: 0.236588 },
                pint: { label: "Pint (US)", symbol: "pt", factor: 0.473176 },
                quart: { label: "Quart (US)", symbol: "qt", factor: 0.946353 },
                gallon: { label: "Gallon (US)", symbol: "gal", factor: 3.78541 }
            }
        },
        weight: {
            label: "Weight & Mass",
            shortLabel: "Weight",
            baseUnit: "kilogram",
            defaultFrom: "kilogram",
            defaultTo: "pound",
            sample: { value: 68, from: "kilogram", to: "pound" },
            tips: [
                "Grams are best for groceries, baking, and small packages.",
                "Ounces and pounds are common in US nutrition labels and shipping.",
                "Use metric tons for shipping containers or cargo freight.",
                "Kilograms are the SI base unit for mass — great for mixed audiences."
            ],
            units: {
                milligram: { label: "Milligram", symbol: "mg", factor: 1e-6 },
                gram: { label: "Gram", symbol: "g", factor: 0.001 },
                kilogram: { label: "Kilogram", symbol: "kg", factor: 1 },
                metricTon: { label: "Metric Ton", symbol: "t", factor: 1000 },
                ounce: { label: "Ounce", symbol: "oz", factor: 0.0283495 },
                pound: { label: "Pound", symbol: "lb", factor: 0.453592 },
                stone: { label: "Stone", symbol: "st", factor: 6.35029 },
                usTon: { label: "US Ton", symbol: "short ton", factor: 907.185 }
            }
        },
        temperature: {
            label: "Temperature",
            shortLabel: "Temperature",
            baseUnit: "celsius",
            defaultFrom: "celsius",
            defaultTo: "fahrenheit",
            sample: { value: 25, from: "celsius", to: "fahrenheit" },
            tips: [
                "Celsius is the SI unit; Fahrenheit is popular in the United States.",
                "Kelvin begins at absolute zero and is common in scientific contexts.",
                "A 1 °C change equals a 1.8 °F change.",
                "Remember that temperature conversions involve offsets, not just scaling."
            ],
            units: {
                celsius: {
                    label: "Celsius",
                    symbol: "°C",
                    type: "affine",
                    toBase: (value) => value,
                    fromBase: (value) => value
                },
                fahrenheit: {
                    label: "Fahrenheit",
                    symbol: "°F",
                    type: "affine",
                    toBase: (value) => (value - 32) * (5 / 9),
                    fromBase: (value) => (value * (9 / 5)) + 32
                },
                kelvin: {
                    label: "Kelvin",
                    symbol: "K",
                    type: "affine",
                    toBase: (value) => value - 273.15,
                    fromBase: (value) => value + 273.15
                }
            }
        },
        speed: {
            label: "Speed",
            shortLabel: "Speed",
            baseUnit: "meterPerSecond",
            defaultFrom: "kilometerPerHour",
            defaultTo: "milePerHour",
            sample: { value: 100, from: "kilometerPerHour", to: "milePerHour" },
            tips: [
                "Miles per hour is common in US/UK road signs.",
                "Kilometers per hour is standard for most countries worldwide.",
                "Knots are used in aviation and maritime navigation.",
                "Meters per second is ideal for physics and engineering calculations."
            ],
            units: {
                meterPerSecond: { label: "Meter per Second", symbol: "m/s", factor: 1 },
                kilometerPerHour: { label: "Kilometer per Hour", symbol: "km/h", factor: 0.2777777778 },
                milePerHour: { label: "Mile per Hour", symbol: "mph", factor: 0.44704 },
                knot: { label: "Knot", symbol: "kn", factor: 0.514444 },
                footPerSecond: { label: "Foot per Second", symbol: "ft/s", factor: 0.3048 }
            }
        },
        time: {
            label: "Time",
            shortLabel: "Time",
            baseUnit: "second",
            defaultFrom: "minute",
            defaultTo: "hour",
            sample: { value: 90, from: "minute", to: "hour" },
            tips: [
                "Milliseconds are useful for UX interactions and stopwatch timing.",
                "Hours and minutes are standard for schedules and events.",
                "Days and weeks help with project planning and support rotations.",
                "Remember: a workweek is typically 40 hours = 2,400 minutes."
            ],
            units: {
                millisecond: { label: "Millisecond", symbol: "ms", factor: 0.001 },
                second: { label: "Second", symbol: "s", factor: 1 },
                minute: { label: "Minute", symbol: "min", factor: 60 },
                hour: { label: "Hour", symbol: "h", factor: 3600 },
                day: { label: "Day", symbol: "d", factor: 86400 },
                week: { label: "Week", symbol: "wk", factor: 604800 }
            }
        }
    };

    const elements = {
        valueInput: document.getElementById("valueInput"),
        categorySelect: document.getElementById("categorySelect"),
        fromUnitSelect: document.getElementById("fromUnitSelect"),
        toUnitSelect: document.getElementById("toUnitSelect"),
        precisionInput: document.getElementById("precisionInput"),
        autoUpdateToggle: document.getElementById("autoUpdateToggle"),
        showFormulaToggle: document.getElementById("showFormulaToggle"),
        showAllToggle: document.getElementById("showAllToggle"),
        convertBtn: document.getElementById("convertBtn"),
        swapBtn: document.getElementById("swapBtn"),
        loadSampleBtn: document.getElementById("loadSampleBtn"),
        clearBtn: document.getElementById("clearBtn"),
        copyResultBtn: document.getElementById("copyResultBtn"),
        downloadCsvBtn: document.getElementById("downloadCsvBtn"),
        statusBanner: document.getElementById("statusBanner"),
        resultValue: document.getElementById("resultValue"),
        resultFormula: document.getElementById("resultFormula"),
        resultBadge: document.getElementById("resultBadge"),
        categoryBadge: document.getElementById("categoryBadge"),
        valueSummary: document.getElementById("valueSummary"),
        categoryHelp: document.getElementById("categoryHelp"),
        conversionTableBody: document.getElementById("conversionTableBody"),
        inputStat: document.getElementById("inputStat"),
        outputStat: document.getElementById("outputStat"),
        baseStat: document.getElementById("baseStat"),
        precisionStat: document.getElementById("precisionStat"),
        statsNote: document.getElementById("statsNote"),
        tipsList: document.getElementById("tipsList")
    };

    const state = {
        categoryKey: null,
        value: null,
        fromUnit: null,
        toUnit: null,
        precision: 2,
        autoUpdate: true,
        showFormula: true,
        showAll: true,
        baseValue: null,
        convertedValue: null,
        lastConversion: null
    };

    function isRatioUnit(unit) {
        return unit && unit.factor != null;
    }

    function normalizePrecision(value) {
        const num = Number.parseInt(value, 10);
        if (Number.isNaN(num)) return 2;
        return Math.min(Math.max(num, 0), 10);
    }

    function formatNumber(value, precision, { pad = false } = {}) {
        if (!Number.isFinite(value)) {
            return "—";
        }
        const maxFraction = Math.min(Math.max(Number(precision) || 0, 0), 10);
        const formatter = new Intl.NumberFormat("en-US", {
            minimumFractionDigits: pad ? maxFraction : 0,
            maximumFractionDigits: maxFraction
        });
        return formatter.format(value);
    }

    function getUnitLabel(categoryKey, unitKey) {
        const category = CATEGORY_DATA[categoryKey];
        if (!category) return unitKey;
        const unit = category.units[unitKey];
        return unit ? unit.label : unitKey;
    }

    function getUnitSymbol(categoryKey, unitKey) {
        const category = CATEGORY_DATA[categoryKey];
        if (!category) return "";
        const unit = category.units[unitKey];
        return unit && unit.symbol ? unit.symbol : "";
    }

    function showStatus(type, message, autoHide = false) {
        const banner = elements.statusBanner;
        const types = ["success", "warn", "error", "info"];
        banner.classList.remove("hidden", ...types);
        if (types.includes(type)) {
            banner.classList.add(type);
        }
        banner.textContent = message;

        if (autoHide) {
            window.clearTimeout(banner._timeoutId);
            banner._timeoutId = window.setTimeout(() => {
                hideStatus();
            }, 3600);
        }
    }

    function hideStatus() {
        const banner = elements.statusBanner;
        banner.classList.add("hidden");
        banner.classList.remove("success", "warn", "error", "info");
        banner.textContent = "";
    }

    function populateCategories() {
        const fragment = document.createDocumentFragment();
        Object.entries(CATEGORY_DATA).forEach(([key, config]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = config.label;
            fragment.appendChild(option);
        });
        elements.categorySelect.appendChild(fragment);
    }

    function populateUnits(categoryKey) {
        const category = CATEGORY_DATA[categoryKey];
        if (!category) return;

        const makeOptions = () => {
            const frag = document.createDocumentFragment();
            Object.entries(category.units).forEach(([unitKey, unit]) => {
                const option = document.createElement("option");
                option.value = unitKey;
                option.textContent = `${unit.label}${unit.symbol ? ` (${unit.symbol})` : ""}`;
                frag.appendChild(option);
            });
            return frag;
        };

        elements.fromUnitSelect.replaceChildren(makeOptions());
        elements.toUnitSelect.replaceChildren(makeOptions());

        const fromDefault = category.defaultFrom in category.units ? category.defaultFrom : Object.keys(category.units)[0];
        const toDefault = category.defaultTo in category.units ? category.defaultTo : Object.keys(category.units)[1] || fromDefault;

        elements.fromUnitSelect.value = fromDefault;
        elements.toUnitSelect.value = toDefault;

        state.fromUnit = elements.fromUnitSelect.value;
        state.toUnit = elements.toUnitSelect.value;
    }

    function updateCategoryBadge(categoryKey) {
        const category = CATEGORY_DATA[categoryKey];
        if (!category) {
            elements.categoryBadge.textContent = "Unknown category";
            return;
        }
        elements.categoryBadge.textContent = `${category.shortLabel} • ${Object.keys(category.units).length} units`;
    }

    function updateTips(categoryKey) {
        const category = CATEGORY_DATA[categoryKey];
        if (!category) return;
        const tips = category.tips && category.tips.length ? category.tips : ["No tips available for this category yet."];
        elements.tipsList.replaceChildren(...tips.map((tip) => {
            const li = document.createElement("li");
            li.textContent = tip;
            return li;
        }));
    }

    function convertValue(value, categoryKey, fromKey, toKey) {
        const category = CATEGORY_DATA[categoryKey];
        if (!category) {
            throw new Error("Unknown category");
        }
        const fromUnit = category.units[fromKey];
        const toUnit = category.units[toKey];
        if (!fromUnit || !toUnit) {
            throw new Error("Unknown unit");
        }

        let baseValue;
        let convertedRaw;
        let ratio = null;

        if (isRatioUnit(fromUnit) && isRatioUnit(toUnit)) {
            baseValue = value * fromUnit.factor;
            convertedRaw = baseValue / toUnit.factor;
            ratio = fromUnit.factor / toUnit.factor;
        } else if (fromUnit.type === "affine" && toUnit.type === "affine") {
            baseValue = fromUnit.toBase(value);
            convertedRaw = toUnit.fromBase(baseValue);
        } else {
            throw new Error("Unsupported conversion combination");
        }

        return {
            baseValue,
            convertedRaw,
            ratio
        };
    }

    function renderFormula({ value, categoryKey, fromKey, toKey, ratio, convertedRaw }) {
        const fromLabel = getUnitLabel(categoryKey, fromKey);
        const toLabel = getUnitLabel(categoryKey, toKey);
        const fromSymbol = getUnitSymbol(categoryKey, fromKey);
        const toSymbol = getUnitSymbol(categoryKey, toKey);

        if (ratio != null) {
            const ratioFormatted = formatNumber(ratio, state.precision + 4 > 10 ? 10 : state.precision + 4);
            return `${formatNumber(value, state.precision, { pad: true })} ${fromLabel}${fromSymbol ? ` (${fromSymbol})` : ""} × ${ratioFormatted} = ${formatNumber(convertedRaw, state.precision, { pad: true })} ${toLabel}${toSymbol ? ` (${toSymbol})` : ""}`;
        }

        // Affine formula fallback (temperature style)
        switch (`${fromKey}->${toKey}`) {
            case "celsius->fahrenheit":
                return "(°C × 9/5) + 32 = °F";
            case "fahrenheit->celsius":
                return "(°F − 32) × 5/9 = °C";
            case "celsius->kelvin":
                return "°C + 273.15 = K";
            case "kelvin->celsius":
                return "K − 273.15 = °C";
            case "fahrenheit->kelvin":
                return "((°F − 32) × 5/9) + 273.15 = K";
            case "kelvin->fahrenheit":
                return "((K − 273.15) × 9/5) + 32 = °F";
            default:
                return `${fromLabel} to ${toLabel} conversion formula applied.`;
        }
    }

    function updateStats({ inputValue, convertedValue, baseValue, categoryKey, fromKey, toKey }) {
        elements.inputStat.textContent = `${formatNumber(inputValue, state.precision, { pad: true })} ${getUnitSymbol(categoryKey, fromKey) || ""}`.trim();
        elements.outputStat.textContent = `${formatNumber(convertedValue, state.precision, { pad: true })} ${getUnitSymbol(categoryKey, toKey) || ""}`.trim();

        const category = CATEGORY_DATA[categoryKey];
        if (category) {
            const baseSymbol = getUnitSymbol(categoryKey, category.baseUnit) || category.units[category.baseUnit]?.label || "base";
            elements.baseStat.textContent = `${formatNumber(baseValue, Math.min(state.precision + 2, 6))} ${baseSymbol}`;
        }

        elements.precisionStat.textContent = `${state.precision} decimal${state.precision === 1 ? "" : "s"}`;
        elements.statsNote.textContent = `Converted ${getUnitLabel(categoryKey, fromKey)} → ${getUnitLabel(categoryKey, toKey)}.`;
    }

    function renderConversionTable({ categoryKey, baseValue, precision, highlightUnitKey }) {
        const category = CATEGORY_DATA[categoryKey];
        if (!category) return;
        const body = elements.conversionTableBody;
        body.textContent = "";

        const unitEntries = Object.entries(category.units);
        const rowsToRender = state.showAll ? unitEntries : unitEntries.filter(([key]) => key === highlightUnitKey || key === state.fromUnit);

        rowsToRender.forEach(([unitKey, unit]) => {
            const tr = document.createElement("tr");
            if (unitKey === state.toUnit) {
                tr.classList.add("highlight");
            }
            const valueCell = isRatioUnit(unit)
                ? baseValue / unit.factor
                : unit.fromBase(baseValue);

            const unitCell = document.createElement("td");
            unitCell.textContent = unit.label;

            const symbolCell = document.createElement("td");
            symbolCell.textContent = unit.symbol || "—";

            const valueCellEl = document.createElement("td");
            valueCellEl.textContent = formatNumber(valueCell, precision, { pad: true });

            tr.append(unitCell, symbolCell, valueCellEl);
            body.appendChild(tr);
        });
    }

    function handleConversion(trigger = "auto") {
        hideStatus();
        const rawValue = elements.valueInput.value;
        if (rawValue === "") {
            state.convertedValue = null;
            state.baseValue = null;
            elements.resultValue.textContent = "Enter a value to convert";
            elements.resultFormula.textContent = "Formula details will appear here when available.";
            elements.resultBadge.textContent = "Result pending";
            elements.valueSummary.textContent = "Awaiting input.";
            elements.statsNote.textContent = "Awaiting input.";
            elements.inputStat.textContent = "–";
            elements.outputStat.textContent = "–";
            elements.baseStat.textContent = "–";
            return;
        }

        const numericValue = Number.parseFloat(rawValue);
        if (!Number.isFinite(numericValue)) {
            showStatus("error", "Please enter a valid number to convert.");
            return;
        }

        try {
            const { baseValue, convertedRaw, ratio } = convertValue(numericValue, state.categoryKey, state.fromUnit, state.toUnit);
            state.baseValue = baseValue;
            state.convertedValue = convertedRaw;
            state.lastConversion = {
                value: numericValue,
                categoryKey: state.categoryKey,
                fromKey: state.fromUnit,
                toKey: state.toUnit,
                baseValue,
                convertedRaw,
                ratio
            };
            const formattedResult = formatNumber(convertedRaw, state.precision, { pad: true });
            elements.resultValue.textContent = `${formattedResult} ${getUnitLabel(state.categoryKey, state.toUnit)}${getUnitSymbol(state.categoryKey, state.toUnit) ? ` (${getUnitSymbol(state.categoryKey, state.toUnit)})` : ""}`;
            elements.resultFormula.textContent = renderFormula({
                value: numericValue,
                categoryKey: state.categoryKey,
                fromKey: state.fromUnit,
                toKey: state.toUnit,
                ratio,
                convertedRaw
            });

            if (!state.showFormula) {
                elements.resultFormula.hidden = true;
            } else {
                elements.resultFormula.hidden = false;
            }

            updateStats({
                inputValue: numericValue,
                convertedValue: convertedRaw,
                baseValue,
                categoryKey: state.categoryKey,
                fromKey: state.fromUnit,
                toKey: state.toUnit
            });

            renderConversionTable({
                categoryKey: state.categoryKey,
                baseValue,
                precision: state.precision,
                highlightUnitKey: state.toUnit
            });

            elements.resultBadge.textContent = `Converted • ${trigger === "manual" ? "Manual" : "Auto"}`;
            elements.valueSummary.textContent = `${formatNumber(numericValue, state.precision, { pad: true })} ${getUnitLabel(state.categoryKey, state.fromUnit)} → ${formattedResult} ${getUnitLabel(state.categoryKey, state.toUnit)}`;
            showStatus("success", "Conversion complete.", true);
        } catch (error) {
            console.error(error);
            showStatus("error", "Unable to perform conversion for the selected units.");
        }
    }

    function handleCategoryChange() {
        state.categoryKey = elements.categorySelect.value;
        populateUnits(state.categoryKey);
        updateCategoryBadge(state.categoryKey);
        updateTips(state.categoryKey);
        elements.valueSummary.textContent = "Awaiting input.";
        elements.statsNote.textContent = "Awaiting input.";
        elements.categoryHelp.textContent = `Select from ${Object.keys(CATEGORY_DATA[state.categoryKey].units).length} units available.`;
        elements.resultBadge.textContent = "Result pending";
        elements.resultValue.textContent = "Enter a value to convert";
        elements.resultFormula.textContent = "Formula details will appear here when available.";
        elements.conversionTableBody.innerHTML = `<tr class="placeholder"><td colspan="3">Full equivalence table appears here after conversion.</td></tr>`;
        const sample = CATEGORY_DATA[state.categoryKey].sample;
        if (sample) {
            elements.valueInput.placeholder = `e.g., ${sample.value}`;
        }
        if (state.autoUpdate) {
            handleConversion("auto");
        }
    }

    function handleSwap() {
        const currentFrom = elements.fromUnitSelect.value;
        elements.fromUnitSelect.value = elements.toUnitSelect.value;
        elements.toUnitSelect.value = currentFrom;
        state.fromUnit = elements.fromUnitSelect.value;
        state.toUnit = elements.toUnitSelect.value;
        elements.resultBadge.textContent = "Units swapped";
        if (state.autoUpdate) {
            handleConversion("auto");
        }
    }

    function loadSample() {
        const category = CATEGORY_DATA[state.categoryKey];
        if (!category || !category.sample) {
            showStatus("warn", "No sample available for this category.");
            return;
        }
        const { value, from, to } = category.sample;
        elements.valueInput.value = value;
        if (category.units[from]) {
            elements.fromUnitSelect.value = from;
            state.fromUnit = from;
        }
        if (category.units[to]) {
            elements.toUnitSelect.value = to;
            state.toUnit = to;
        }
        state.value = value;
        showStatus("info", "Sample loaded.", true);
        handleConversion("manual");
    }

    function clearForm() {
        elements.valueInput.value = "";
        state.value = null;
        state.baseValue = null;
        state.convertedValue = null;
        elements.resultValue.textContent = "Enter a value to convert";
        elements.resultFormula.textContent = "Formula details will appear here when available.";
        elements.resultBadge.textContent = "Result pending";
        elements.valueSummary.textContent = "Awaiting input.";
        elements.statsNote.textContent = "Awaiting input.";
        elements.inputStat.textContent = "–";
        elements.outputStat.textContent = "–";
        elements.baseStat.textContent = "–";
        hideStatus();
    }

    function handlePrecisionChange() {
        const precision = normalizePrecision(elements.precisionInput.value);
        elements.precisionInput.value = precision;
        state.precision = precision;
        elements.precisionStat.textContent = `${precision} decimal${precision === 1 ? "" : "s"}`;
        if (state.autoUpdate && state.baseValue != null) {
            handleConversion("auto");
        }
    }

    function handleCopyResult() {
        if (!state.lastConversion) {
            showStatus("warn", "Run a conversion before copying.", true);
            return;
        }
        const text = `${elements.resultValue.textContent} (${elements.resultFormula.textContent})`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showStatus("success", "Result copied to clipboard.", true);
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand("copy");
            showStatus("success", "Result copied to clipboard.", true);
        } catch (err) {
            showStatus("error", "Unable to copy to clipboard.");
        }
        document.body.removeChild(temp);
    }

    function handleCsvDownload() {
        if (!state.lastConversion) {
            showStatus("warn", "Convert a value before downloading CSV.", true);
            return;
        }
        const category = CATEGORY_DATA[state.categoryKey];
        const rows = [
            ["Unit", "Symbol", "Value"],
            ...Object.entries(category.units).map(([unitKey, unit]) => {
                const value = isRatioUnit(unit)
                    ? state.baseValue / unit.factor
                    : unit.fromBase(state.baseValue);
                return [
                    unit.label,
                    unit.symbol || "",
                    formatNumber(value, state.precision, { pad: true })
                ];
            })
        ];

        const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        const stamp = new Date().toISOString().split("T")[0];
        anchor.download = `${state.categoryKey}-conversion-${stamp}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        showStatus("success", "CSV downloaded.", true);
    }

    function init() {
        populateCategories();
        state.categoryKey = elements.categorySelect.value || Object.keys(CATEGORY_DATA)[0];
        elements.categorySelect.value = state.categoryKey;
        populateUnits(state.categoryKey);
        updateCategoryBadge(state.categoryKey);
        updateTips(state.categoryKey);
        elements.categoryHelp.textContent = `Select from ${Object.keys(CATEGORY_DATA[state.categoryKey].units).length} units available.`;

        elements.valueInput.addEventListener("input", (event) => {
            state.value = event.target.value;
            if (state.autoUpdate) {
                handleConversion("auto");
            } else {
                elements.valueSummary.textContent = event.target.value === ""
                    ? "Awaiting input."
                    : `${event.target.value} ${getUnitLabel(state.categoryKey, state.fromUnit)} ready to convert.`;
            }
        });

        elements.categorySelect.addEventListener("change", () => {
            handleCategoryChange();
        });

        elements.fromUnitSelect.addEventListener("change", (event) => {
            state.fromUnit = event.target.value;
            if (state.autoUpdate && elements.valueInput.value !== "") {
                handleConversion("auto");
            }
        });

        elements.toUnitSelect.addEventListener("change", (event) => {
            state.toUnit = event.target.value;
            if (state.autoUpdate && elements.valueInput.value !== "") {
                handleConversion("auto");
            }
        });

        elements.swapBtn.addEventListener("click", handleSwap);
        elements.loadSampleBtn.addEventListener("click", loadSample);
        elements.clearBtn.addEventListener("click", clearForm);
        elements.convertBtn.addEventListener("click", () => handleConversion("manual"));
        elements.precisionInput.addEventListener("change", handlePrecisionChange);
        elements.autoUpdateToggle.addEventListener("change", (event) => {
            state.autoUpdate = event.target.checked;
            if (state.autoUpdate) {
                handleConversion("auto");
            }
        });
        elements.showFormulaToggle.addEventListener("change", (event) => {
            state.showFormula = event.target.checked;
            elements.resultFormula.hidden = !state.showFormula;
        });
        elements.showAllToggle.addEventListener("change", (event) => {
            state.showAll = event.target.checked;
            if (state.baseValue != null) {
                renderConversionTable({
                    categoryKey: state.categoryKey,
                    baseValue: state.baseValue,
                    precision: state.precision,
                    highlightUnitKey: state.toUnit
                });
            }
        });
        elements.copyResultBtn.addEventListener("click", handleCopyResult);
        elements.downloadCsvBtn.addEventListener("click", handleCsvDownload);

        // Initial state adjustments
        elements.resultFormula.hidden = !state.showFormulaToggle.checked;
        state.autoUpdate = elements.autoUpdateToggle.checked;
        state.showFormula = elements.showFormulaToggle.checked;
        state.showAll = elements.showAllToggle.checked;
        handleConversion("auto");
    }

    document.addEventListener("DOMContentLoaded", init);
})();
