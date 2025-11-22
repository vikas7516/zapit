(() => {
    "use strict";

    const UNIT_DATA = {
        teaspoon: {
            label: "Teaspoon (US)",
            symbol: "tsp",
            type: "volume",
            toBase: (value) => value * 4.92892159375,
            fromBase: (value) => value / 4.92892159375
        },
        tablespoon: {
            label: "Tablespoon (US)",
            symbol: "Tbsp",
            type: "volume",
            toBase: (value) => value * 14.78676478125,
            fromBase: (value) => value / 14.78676478125
        },
        fluidOunce: {
            label: "Fluid Ounce (US)",
            symbol: "fl oz",
            type: "volume",
            toBase: (value) => value * 29.5735295625,
            fromBase: (value) => value / 29.5735295625
        },
        cupUS: {
            label: "Cup (US)",
            symbol: "cup",
            type: "volume",
            toBase: (value) => value * 236.5882365,
            fromBase: (value) => value / 236.5882365
        },
        cupMetric: {
            label: "Cup (Metric)",
            symbol: "cup (metric)",
            type: "volume",
            toBase: (value) => value * 250,
            fromBase: (value) => value / 250
        },
        milliliter: {
            label: "Milliliter",
            symbol: "mL",
            type: "volume",
            toBase: (value) => value,
            fromBase: (value) => value
        },
        liter: {
            label: "Liter",
            symbol: "L",
            type: "volume",
            toBase: (value) => value * 1000,
            fromBase: (value) => value / 1000
        },
        gram: {
            label: "Gram",
            symbol: "g",
            type: "weight",
            toBase: (value) => value,
            fromBase: (value) => value
        },
        kilogram: {
            label: "Kilogram",
            symbol: "kg",
            type: "weight",
            toBase: (value) => value * 1000,
            fromBase: (value) => value / 1000
        },
        ounce: {
            label: "Ounce (avoirdupois)",
            symbol: "oz",
            type: "weight",
            toBase: (value) => value * 28.349523125,
            fromBase: (value) => value / 28.349523125
        },
        pound: {
            label: "Pound",
            symbol: "lb",
            type: "weight",
            toBase: (value) => value * 453.59237,
            fromBase: (value) => value / 453.59237
        },
        milligram: {
            label: "Milligram",
            symbol: "mg",
            type: "weight",
            toBase: (value) => value / 1000,
            fromBase: (value) => value * 1000
        },
        stickButter: {
            label: "Stick of Butter (US)",
            symbol: "stick",
            type: "weight",
            toBase: (value) => value * 113.398,
            fromBase: (value) => value / 113.398
        }
    };

    const UNIT_ORDER = [
        "teaspoon",
        "tablespoon",
        "fluidOunce",
        "cupUS",
        "cupMetric",
        "milliliter",
        "liter",
        "gram",
        "milligram",
        "ounce",
        "pound",
        "kilogram",
        "stickButter"
    ];

    const INGREDIENT_DATA = {
        water: {
            label: "Water",
            density: 1,
            sample: { value: 1, from: "cupUS", to: "gram" },
            tips: [
                "Water is the baseline density at 1.00 g/mL — perfect for testing.",
                "1 US cup of water weighs very close to 236 grams.",
                "Use water to validate your kitchen scale calibration."
            ]
        },
        allPurposeFlour: {
            label: "All-purpose Flour",
            density: 0.529,
            sample: { value: 2, from: "cupUS", to: "gram" },
            tips: [
                "Spoon flour into cups rather than scooping to avoid compacting.",
                "All-purpose flour averages 0.53 g/mL; sifted flour will be lighter.",
                "Switch to weight measurements for reliable baking consistency." 
            ]
        },
        breadFlour: {
            label: "Bread Flour",
            density: 0.59,
            sample: { value: 500, from: "gram", to: "cupUS" },
            tips: [
                "Bread flour absorbs more water; density runs slightly heavier than AP flour.",
                "Use baker's percentages with grams for predictable hydration." 
            ]
        },
        granulatedSugar: {
            label: "Granulated Sugar",
            density: 0.845,
            sample: { value: 1, from: "cupUS", to: "gram" },
            tips: [
                "Granulated sugar packs densely at ~0.85 g/mL.",
                "Weight-based sugar measurements prevent overly sweet outcomes." 
            ]
        },
        brownSugar: {
            label: "Brown Sugar (packed)",
            density: 0.93,
            sample: { value: 1, from: "cupUS", to: "gram" },
            tips: [
                "Pack brown sugar firmly when using cups; density approaches 0.93 g/mL.",
                "Weigh brown sugar to keep caramel notes balanced." 
            ]
        },
        butter: {
            label: "Butter",
            density: 0.959,
            sample: { value: 2, from: "stickButter", to: "gram" },
            tips: [
                "One US stick equals 113.4 g and half a cup by volume.",
                "Butter density shifts slightly as it softens—convert while cold for accuracy." 
            ]
        },
        honey: {
            label: "Honey",
            density: 1.42,
            sample: { value: 0.5, from: "cupUS", to: "gram" },
            tips: [
                "Honey is very dense at ~1.42 g/mL — 1 cup weighs about 336 g.",
                "Coat measuring cups with oil for clean honey pours." 
            ]
        },
        oliveOil: {
            label: "Olive Oil",
            density: 0.91,
            sample: { value: 60, from: "milliliter", to: "ounce" },
            tips: [
                "Olive oil density hovers around 0.91 g/mL.",
                "Weighing oil ensures precise emulsions and dressings." 
            ]
        }
    };

    const elements = {
        ingredientSelect: document.getElementById("ingredientSelect"),
        valueInput: document.getElementById("valueInput"),
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
        ingredientBadge: document.getElementById("ingredientBadge"),
        valueSummary: document.getElementById("valueSummary"),
        ingredientHelp: document.getElementById("ingredientHelp"),
        conversionTableBody: document.getElementById("conversionTableBody"),
        densityStat: document.getElementById("densityStat"),
        inputStat: document.getElementById("inputStat"),
        outputStat: document.getElementById("outputStat"),
        baseStat: document.getElementById("baseStat"),
        precisionStat: document.getElementById("precisionStat"),
        statsNote: document.getElementById("statsNote"),
        tipsList: document.getElementById("tipsList")
    };

    const state = {
        ingredientKey: null,
        value: null,
        fromUnit: null,
        toUnit: null,
        precision: 2,
        autoUpdate: true,
        showFormula: true,
        showAll: true,
        baseGrams: null,
        baseMilliliters: null,
        convertedValue: null,
        lastConversion: null
    };

    function formatNumber(value, precision, { pad = false } = {}) {
        if (!Number.isFinite(value)) return "—";
        const digits = Math.min(Math.max(Number(precision) || 0, 0), 10);
        const formatter = new Intl.NumberFormat("en-US", {
            minimumFractionDigits: pad ? digits : 0,
            maximumFractionDigits: digits
        });
        return formatter.format(value);
    }

    function normalizePrecision(value) {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) return 2;
        return Math.min(Math.max(parsed, 0), 10);
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

    function populateIngredients() {
        const fragment = document.createDocumentFragment();
        Object.entries(INGREDIENT_DATA).forEach(([key, config]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = config.label;
            fragment.appendChild(option);
        });
        elements.ingredientSelect.appendChild(fragment);
    }

    function populateUnits() {
        const makeOptions = () => {
            const frag = document.createDocumentFragment();
            UNIT_ORDER.forEach((key) => {
                const unit = UNIT_DATA[key];
                if (!unit) return;
                const option = document.createElement("option");
                option.value = key;
                option.textContent = `${unit.label}${unit.symbol ? ` (${unit.symbol})` : ""}`;
                option.dataset.type = unit.type;
                frag.appendChild(option);
            });
            return frag;
        };
        elements.fromUnitSelect.replaceChildren(makeOptions());
        elements.toUnitSelect.replaceChildren(makeOptions());

        elements.fromUnitSelect.value = "cupUS";
        elements.toUnitSelect.value = "gram";
        state.fromUnit = "cupUS";
        state.toUnit = "gram";
    }

    function updateIngredientBadge(ingredientKey) {
        const ingredient = INGREDIENT_DATA[ingredientKey];
        if (!ingredient) {
            elements.ingredientBadge.textContent = "No ingredient selected";
            elements.densityStat.textContent = "–";
            return;
        }
        elements.ingredientBadge.textContent = `${ingredient.label} • ${formatNumber(ingredient.density, 3, { pad: true })} g/mL`;
        elements.densityStat.textContent = `${formatNumber(ingredient.density, 3, { pad: true })} g/mL`;
    }

    function updateTips(ingredientKey) {
        const ingredient = INGREDIENT_DATA[ingredientKey];
        if (!ingredient) return;
        const tips = ingredient.tips && ingredient.tips.length ? ingredient.tips : ["No notes for this ingredient yet."];
        elements.tipsList.replaceChildren(...tips.map((tip) => {
            const li = document.createElement("li");
            li.textContent = tip;
            return li;
        }));
    }

    function convertValue(value, ingredientKey, fromUnitKey, toUnitKey) {
        const ingredient = INGREDIENT_DATA[ingredientKey];
        if (!ingredient) {
            throw new Error("Unknown ingredient");
        }
        const fromUnit = UNIT_DATA[fromUnitKey];
        const toUnit = UNIT_DATA[toUnitKey];
        if (!fromUnit || !toUnit) {
            throw new Error("Unknown unit");
        }

        const density = ingredient.density; // grams per milliliter

        let grams;
        let milliliters;

        if (fromUnit.type === "weight") {
            grams = fromUnit.toBase(value);
            milliliters = grams / density;
        } else if (fromUnit.type === "volume") {
            milliliters = fromUnit.toBase(value);
            grams = milliliters * density;
        } else {
            throw new Error("Unsupported unit type");
        }

        let converted;
        if (toUnit.type === "weight") {
            converted = toUnit.fromBase(grams);
        } else if (toUnit.type === "volume") {
            converted = toUnit.fromBase(milliliters);
        } else {
            throw new Error("Unsupported target unit type");
        }

        let ratio = null;
        if (fromUnit.type === toUnit.type) {
            ratio = value === 0 ? null : converted / value;
        }

        return {
            grams,
            milliliters,
            converted,
            ratio
        };
    }

    function renderFormula({ value, ingredientKey, fromUnitKey, toUnitKey, ratio, grams, milliliters, converted }) {
        const ingredient = INGREDIENT_DATA[ingredientKey];
        const fromUnit = UNIT_DATA[fromUnitKey];
        const toUnit = UNIT_DATA[toUnitKey];
        if (!ingredient || !fromUnit || !toUnit) {
            return "Conversion details unavailable.";
        }

        const ingredientDensity = formatNumber(ingredient.density, 4, { pad: true });
        const valueFormatted = formatNumber(value, state.precision, { pad: true });
        const convertedFormatted = formatNumber(converted, state.precision, { pad: true });

        if (ratio != null) {
            const ratioFormatted = formatNumber(ratio, Math.min(state.precision + 4, 10));
            return `${valueFormatted} ${fromUnit.label} × ${ratioFormatted} = ${convertedFormatted} ${toUnit.label}`;
        }

        if (fromUnit.type === "volume" && toUnit.type === "weight") {
            return `${valueFormatted} ${fromUnit.label} × ${ingredientDensity} g/mL = ${formatNumber(grams, state.precision + 1, { pad: true })} g → ${convertedFormatted} ${toUnit.label}`;
        }

        if (fromUnit.type === "weight" && toUnit.type === "volume") {
            return `${valueFormatted} ${fromUnit.label} ÷ ${ingredientDensity} g/mL = ${formatNumber(milliliters, state.precision + 1, { pad: true })} mL → ${convertedFormatted} ${toUnit.label}`;
        }

        return "Conversion complete.";
    }

    function renderConversionTable({ ingredientKey, grams, milliliters, precision, highlightUnitKey }) {
        const ingredient = INGREDIENT_DATA[ingredientKey];
        if (!ingredient) return;

        const body = elements.conversionTableBody;
        body.textContent = "";

        const shouldInclude = (unitKey) => {
            if (state.showAll) return true;
            const unit = UNIT_DATA[unitKey];
            const highlight = UNIT_DATA[highlightUnitKey];
            if (!unit || !highlight) return true;
            return unit.type === highlight.type || unitKey === state.fromUnit;
        };

        let rowsRendered = 0;

        UNIT_ORDER.forEach((unitKey) => {
            if (!UNIT_DATA[unitKey] || !shouldInclude(unitKey)) return;
            const unit = UNIT_DATA[unitKey];
            const tr = document.createElement("tr");
            if (unitKey === highlightUnitKey) {
                tr.classList.add("highlight");
            }

            const unitCell = document.createElement("td");
            unitCell.textContent = unit.label;

            const typeCell = document.createElement("td");
            typeCell.textContent = unit.type === "weight" ? "Weight" : "Volume";

            const symbolCell = document.createElement("td");
            symbolCell.textContent = unit.symbol || "—";

            let value;
            if (unit.type === "weight") {
                value = unit.fromBase(grams);
            } else {
                value = unit.fromBase(milliliters);
            }

            const valueCell = document.createElement("td");
            valueCell.textContent = formatNumber(value, precision, { pad: true });

            tr.append(unitCell, typeCell, symbolCell, valueCell);
            body.appendChild(tr);
            rowsRendered += 1;
        });

        if (rowsRendered === 0) {
            body.innerHTML = `<tr class="placeholder"><td colspan="4">No units selected. Adjust filters to see results.</td></tr>`;
        }
    }

    function updateStats({ ingredientKey, value, converted, grams, milliliters, fromUnitKey, toUnitKey }) {
        const ingredient = INGREDIENT_DATA[ingredientKey];
        const fromUnit = UNIT_DATA[fromUnitKey];
        const toUnit = UNIT_DATA[toUnitKey];

        elements.inputStat.textContent = `${formatNumber(value, state.precision, { pad: true })} ${fromUnit?.symbol || (fromUnit?.label ?? "")}`.trim();
        elements.outputStat.textContent = `${formatNumber(converted, state.precision, { pad: true })} ${toUnit?.symbol || (toUnit?.label ?? "")}`.trim();

        const gramsText = formatNumber(grams, Math.min(state.precision + 2, 6), { pad: true });
        const mLText = formatNumber(milliliters, Math.min(state.precision + 2, 6), { pad: true });
        elements.baseStat.textContent = `${gramsText} g / ${mLText} mL`;
        elements.precisionStat.textContent = `${state.precision} decimal${state.precision === 1 ? "" : "s"}`;
        elements.statsNote.textContent = `${ingredient?.label ?? "Ingredient"}: ${fromUnit?.label ?? ""} → ${toUnit?.label ?? ""}`.trim();
    }

    function handleConversion(trigger = "auto") {
        hideStatus();
        const rawValue = elements.valueInput.value;
        if (rawValue === "") {
            state.value = null;
            state.baseGrams = null;
            state.baseMilliliters = null;
            elements.resultValue.textContent = "Enter an ingredient and value";
            elements.resultFormula.textContent = "Formula details will appear here when available.";
            elements.resultBadge.textContent = "Result pending";
            elements.valueSummary.textContent = "Awaiting input.";
            elements.statsNote.textContent = "Awaiting input.";
            elements.inputStat.textContent = "–";
            elements.outputStat.textContent = "–";
            elements.baseStat.textContent = "–";
            elements.conversionTableBody.innerHTML = `<tr class="placeholder"><td colspan="4">Full equivalence table appears here after conversion.</td></tr>`;
            return;
        }

        const numericValue = Number.parseFloat(rawValue);
        if (!Number.isFinite(numericValue)) {
            showStatus("error", "Please enter a valid number to convert.");
            return;
        }

        try {
            const { grams, milliliters, converted, ratio } = convertValue(numericValue, state.ingredientKey, state.fromUnit, state.toUnit);

            state.baseGrams = grams;
            state.baseMilliliters = milliliters;
            state.convertedValue = converted;
            state.lastConversion = {
                ingredientKey: state.ingredientKey,
                fromUnit: state.fromUnit,
                toUnit: state.toUnit,
                value: numericValue,
                grams,
                milliliters,
                converted,
                ratio
            };

            const toUnit = UNIT_DATA[state.toUnit];
            const ingredient = INGREDIENT_DATA[state.ingredientKey];
            const formattedResult = `${formatNumber(converted, state.precision, { pad: true })} ${toUnit.label}`;
            elements.resultValue.textContent = formattedResult;
            elements.resultFormula.textContent = renderFormula({
                value: numericValue,
                ingredientKey: state.ingredientKey,
                fromUnitKey: state.fromUnit,
                toUnitKey: state.toUnit,
                ratio,
                grams,
                milliliters,
                converted
            });
            elements.resultFormula.hidden = !state.showFormula;

            updateStats({
                ingredientKey: state.ingredientKey,
                value: numericValue,
                converted,
                grams,
                milliliters,
                fromUnitKey: state.fromUnit,
                toUnitKey: state.toUnit
            });

            renderConversionTable({
                ingredientKey: state.ingredientKey,
                grams,
                milliliters,
                precision: state.precision,
                highlightUnitKey: state.toUnit
            });

            elements.resultBadge.textContent = `Converted • ${trigger === "manual" ? "Manual" : "Auto"}`;
            elements.valueSummary.textContent = `${formatNumber(numericValue, state.precision, { pad: true })} ${UNIT_DATA[state.fromUnit].label} → ${formattedResult}`;
            if (ingredient) {
                elements.ingredientHelp.textContent = `${ingredient.label} density: ${formatNumber(ingredient.density, 3, { pad: true })} g/mL.`;
            }
            showStatus("success", "Conversion complete.", true);
        } catch (error) {
            console.error(error);
            showStatus("error", error.message || "Unable to perform conversion.");
        }
    }

    function handleIngredientChange() {
        state.ingredientKey = elements.ingredientSelect.value;
        updateIngredientBadge(state.ingredientKey);
        updateTips(state.ingredientKey);
        const ingredient = INGREDIENT_DATA[state.ingredientKey];
        elements.ingredientHelp.textContent = ingredient
            ? `${ingredient.label} density: ${formatNumber(ingredient.density, 3, { pad: true })} g/mL.`
            : "Select an ingredient to apply the right density.";
        const sample = ingredient?.sample;
        if (sample) {
            elements.valueInput.placeholder = `e.g., ${sample.value}`;
            if (!elements.valueInput.value) {
                state.fromUnit = sample.from;
                state.toUnit = sample.to;
                elements.fromUnitSelect.value = sample.from;
                elements.toUnitSelect.value = sample.to;
            }
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
        const ingredient = INGREDIENT_DATA[state.ingredientKey];
        if (!ingredient || !ingredient.sample) {
            showStatus("warn", "Select an ingredient with a sample first.", true);
            return;
        }
        const { value, from, to } = ingredient.sample;
        elements.valueInput.value = value;
        if (UNIT_DATA[from]) {
            elements.fromUnitSelect.value = from;
            state.fromUnit = from;
        }
        if (UNIT_DATA[to]) {
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
        state.baseGrams = null;
        state.baseMilliliters = null;
        state.convertedValue = null;
        state.lastConversion = null;
        elements.resultValue.textContent = "Enter an ingredient and value";
        elements.resultFormula.textContent = "Formula details will appear here when available.";
        elements.resultBadge.textContent = "Result pending";
        elements.valueSummary.textContent = "Awaiting input.";
        elements.statsNote.textContent = "Awaiting input.";
        elements.inputStat.textContent = "–";
        elements.outputStat.textContent = "–";
        elements.baseStat.textContent = "–";
        elements.conversionTableBody.innerHTML = `<tr class="placeholder"><td colspan="4">Full equivalence table appears here after conversion.</td></tr>`;
        hideStatus();
    }

    function handlePrecisionChange() {
        const precision = normalizePrecision(elements.precisionInput.value);
        elements.precisionInput.value = precision;
        state.precision = precision;
        elements.precisionStat.textContent = `${precision} decimal${precision === 1 ? "" : "s"}`;
        if (state.autoUpdate && state.baseGrams != null) {
            handleConversion("auto");
        }
    }

    function handleCopyResult() {
        if (!state.lastConversion) {
            showStatus("warn", "Run a conversion before copying.", true);
            return;
        }
        const text = `${elements.resultValue.textContent} (${elements.resultFormula.textContent})`;
        if (navigator.clipboard?.writeText) {
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
        } catch (error) {
            showStatus("error", "Unable to copy to clipboard.");
        }
        document.body.removeChild(temp);
    }

    function handleCsvDownload() {
        if (!state.lastConversion) {
            showStatus("warn", "Convert a value before downloading CSV.", true);
            return;
        }
        const rows = [
            ["Unit", "Type", "Symbol", "Value"],
            ...UNIT_ORDER.map((unitKey) => {
                const unit = UNIT_DATA[unitKey];
                if (!unit) {
                    return null;
                }
                const value = unit.type === "weight"
                    ? unit.fromBase(state.baseGrams)
                    : unit.fromBase(state.baseMilliliters);
                return [
                    unit.label,
                    unit.type === "weight" ? "Weight" : "Volume",
                    unit.symbol || "",
                    formatNumber(value, state.precision, { pad: true })
                ];
            }).filter(Boolean)
        ];

        const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        const ingredient = INGREDIENT_DATA[state.ingredientKey];
        const slug = ingredient ? ingredient.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "ingredient";
        const stamp = new Date().toISOString().split("T")[0];
        anchor.href = url;
        anchor.download = `${slug}-cooking-conversion-${stamp}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        showStatus("success", "CSV downloaded.", true);
    }

    function init() {
        populateIngredients();
        populateUnits();
        state.ingredientKey = elements.ingredientSelect.value || Object.keys(INGREDIENT_DATA)[0];
        elements.ingredientSelect.value = state.ingredientKey;
        updateIngredientBadge(state.ingredientKey);
        updateTips(state.ingredientKey);

        elements.valueInput.addEventListener("input", (event) => {
            state.value = event.target.value;
            if (state.autoUpdate) {
                handleConversion("auto");
            } else {
                elements.valueSummary.textContent = event.target.value === ""
                    ? "Awaiting input."
                    : `${event.target.value} ${UNIT_DATA[state.fromUnit].label} ready to convert.`;
            }
        });

        elements.ingredientSelect.addEventListener("change", handleIngredientChange);

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
            if (state.baseGrams != null) {
                renderConversionTable({
                    ingredientKey: state.ingredientKey,
                    grams: state.baseGrams,
                    milliliters: state.baseMilliliters,
                    precision: state.precision,
                    highlightUnitKey: state.toUnit
                });
            }
        });
        elements.copyResultBtn.addEventListener("click", handleCopyResult);
        elements.downloadCsvBtn.addEventListener("click", handleCsvDownload);

        elements.resultFormula.hidden = !state.showFormulaToggle.checked;
        state.autoUpdate = elements.autoUpdateToggle.checked;
        state.showFormula = elements.showFormulaToggle.checked;
        state.showAll = elements.showAllToggle.checked;

        handleIngredientChange();
        handleConversion("auto");
    }

    document.addEventListener("DOMContentLoaded", init);
})();
