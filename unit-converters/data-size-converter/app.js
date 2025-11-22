(() => {
    "use strict";

    const UNIT_DEFINITIONS = {
        bit: {
            label: "Bit",
            symbol: "b",
            system: "Networking",
            type: "bit",
            bytesPerUnit: 1 / 8,
            counterpart: "byte"
        },
        byte: {
            label: "Byte",
            symbol: "B",
            system: "Storage",
            type: "byte",
            bytesPerUnit: 1,
            counterpart: "bit"
        },
        kilobit: {
            label: "Kilobit",
            symbol: "kb",
            system: "SI Decimal",
            type: "bit",
            bytesPerUnit: 1000 / 8,
            counterpart: "kibibit"
        },
        kilobyte: {
            label: "Kilobyte",
            symbol: "kB",
            system: "SI Decimal",
            type: "byte",
            bytesPerUnit: 1000,
            counterpart: "kibibyte"
        },
        kibibit: {
            label: "Kibibit",
            symbol: "Kib",
            system: "IEC Binary",
            type: "bit",
            bytesPerUnit: 1024 / 8,
            counterpart: "kilobit"
        },
        kibibyte: {
            label: "Kibibyte",
            symbol: "KiB",
            system: "IEC Binary",
            type: "byte",
            bytesPerUnit: 1024,
            counterpart: "kilobyte"
        },
        megabit: {
            label: "Megabit",
            symbol: "Mb",
            system: "SI Decimal",
            type: "bit",
            bytesPerUnit: 1_000_000 / 8,
            counterpart: "mebibit"
        },
        megabyte: {
            label: "Megabyte",
            symbol: "MB",
            system: "SI Decimal",
            type: "byte",
            bytesPerUnit: 1_000_000,
            counterpart: "mebibyte"
        },
        mebibit: {
            label: "Mebibit",
            symbol: "Mib",
            system: "IEC Binary",
            type: "bit",
            bytesPerUnit: Math.pow(1024, 2) / 8,
            counterpart: "megabit"
        },
        mebibyte: {
            label: "Mebibyte",
            symbol: "MiB",
            system: "IEC Binary",
            type: "byte",
            bytesPerUnit: Math.pow(1024, 2),
            counterpart: "megabyte"
        },
        gigabit: {
            label: "Gigabit",
            symbol: "Gb",
            system: "SI Decimal",
            type: "bit",
            bytesPerUnit: 1_000_000_000 / 8,
            counterpart: "gibibit"
        },
        gigabyte: {
            label: "Gigabyte",
            symbol: "GB",
            system: "SI Decimal",
            type: "byte",
            bytesPerUnit: 1_000_000_000,
            counterpart: "gibibyte"
        },
        gibibit: {
            label: "Gibibit",
            symbol: "Gib",
            system: "IEC Binary",
            type: "bit",
            bytesPerUnit: Math.pow(1024, 3) / 8,
            counterpart: "gigabit"
        },
        gibibyte: {
            label: "Gibibyte",
            symbol: "GiB",
            system: "IEC Binary",
            type: "byte",
            bytesPerUnit: Math.pow(1024, 3),
            counterpart: "gigabyte"
        },
        terabit: {
            label: "Terabit",
            symbol: "Tb",
            system: "SI Decimal",
            type: "bit",
            bytesPerUnit: 1_000_000_000_000 / 8,
            counterpart: "tebibit"
        },
        terabyte: {
            label: "Terabyte",
            symbol: "TB",
            system: "SI Decimal",
            type: "byte",
            bytesPerUnit: 1_000_000_000_000,
            counterpart: "tebibyte"
        },
        tebibit: {
            label: "Tebibit",
            symbol: "Tib",
            system: "IEC Binary",
            type: "bit",
            bytesPerUnit: Math.pow(1024, 4) / 8,
            counterpart: "terabit"
        },
        tebibyte: {
            label: "Tebibyte",
            symbol: "TiB",
            system: "IEC Binary",
            type: "byte",
            bytesPerUnit: Math.pow(1024, 4),
            counterpart: "terabyte"
        },
        petabyte: {
            label: "Petabyte",
            symbol: "PB",
            system: "SI Decimal",
            type: "byte",
            bytesPerUnit: 1_000_000_000_000_000,
            counterpart: "pebibyte"
        },
        pebibyte: {
            label: "Pebibyte",
            symbol: "PiB",
            system: "IEC Binary",
            type: "byte",
            bytesPerUnit: Math.pow(1024, 5),
            counterpart: "petabyte"
        }
    };

    const UNIT_ORDER = [
        "bit",
        "byte",
        "kilobit",
        "kilobyte",
        "kibibit",
        "kibibyte",
        "megabit",
        "megabyte",
        "mebibit",
        "mebibyte",
        "gigabit",
        "gigabyte",
        "gibibit",
        "gibibyte",
        "terabit",
        "terabyte",
        "tebibit",
        "tebibyte",
        "petabyte",
        "pebibyte"
    ];

    const SAMPLE_PRESETS = [
        { value: 25, from: "gigabyte", to: "gibibyte", note: "Blu-ray vs GiB" },
        { value: 1, from: "gigabit", to: "megabyte", note: "Network vs storage" },
        { value: 512, from: "megabyte", to: "mebibyte", note: "App download sizing" },
        { value: 2, from: "terabyte", to: "tebibyte", note: "Enterprise backup" }
    ];

    const BASE_TIPS = [
        "Switch between decimal (KB, MB) and binary (KiB, MiB) to match vendor marketing versus OS reporting.",
        "Bits measure throughput (network speed), while bytes measure stored data.",
        "Storage devices use decimal prefixes; operating systems often use binary prefixes.",
        "Export the reference table for capacity planning or auditing storage tiers."
    ];

    const BIT_TIPS = [
        "Networking gear reports bandwidth in bits per second — divide by 8 for bytes per second.",
        "Latency-sensitive transfers are often calculated in bits to align with link negotiation.",
        "When comparing ISP plans, convert advertised Mbps into MB/s for realistic download times."
    ];

    const LARGE_TIPS = [
        "Use TiB/PiB when sizing large clusters; they align with binary-friendly file systems.",
        "Cloud storage billing typically uses decimal units — verify which system your vendor applies.",
        "For backups, calculate both raw (decimal) and usable (binary) capacity to avoid surprises."
    ];

    let sampleIndex = 0;

    const elements = {
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
        unitBadge: document.getElementById("unitBadge"),
        valueSummary: document.getElementById("valueSummary"),
        unitHelp: document.getElementById("unitHelp"),
        conversionTableBody: document.getElementById("conversionTableBody"),
        inputStat: document.getElementById("inputStat"),
        outputStat: document.getElementById("outputStat"),
        baseBytesStat: document.getElementById("baseBytesStat"),
        baseBitsStat: document.getElementById("baseBitsStat"),
        statsNote: document.getElementById("statsNote"),
        tipsList: document.getElementById("tipsList")
    };

    const state = {
        value: null,
        fromUnit: null,
        toUnit: null,
        precision: 2,
        autoUpdate: true,
        showFormula: true,
        showAll: true,
        baseBytes: null,
        baseBits: null,
        convertedValue: null,
        lastConversion: null
    };

    function formatNumber(value, precision, { pad = false } = {}) {
        if (!Number.isFinite(value)) {
            return "—";
        }
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

    function getUnit(unitKey) {
        return UNIT_DEFINITIONS[unitKey] || null;
    }

    function populateUnitSelects() {
        const makeOptions = () => {
            const fragment = document.createDocumentFragment();
            UNIT_ORDER.forEach((key) => {
                const unit = getUnit(key);
                if (!unit) return;
                const option = document.createElement("option");
                option.value = key;
                option.textContent = `${unit.label}${unit.symbol ? ` (${unit.symbol})` : ""} • ${unit.system}`;
                fragment.appendChild(option);
            });
            return fragment;
        };

        elements.fromUnitSelect.replaceChildren(makeOptions());
        elements.toUnitSelect.replaceChildren(makeOptions());

        const defaultFrom = "gigabyte";
        const defaultTo = "gibibyte";
        elements.fromUnitSelect.value = defaultFrom;
        elements.toUnitSelect.value = defaultTo;
        state.fromUnit = defaultFrom;
        state.toUnit = defaultTo;
    }

    function updateUnitBadge(unitKey) {
        const unit = getUnit(unitKey);
        if (!unit) {
            elements.unitBadge.textContent = "No unit selected";
            return;
        }
        const parts = [unit.label];
        if (unit.symbol) {
            parts.push(`(${unit.symbol})`);
        }
        elements.unitBadge.textContent = `${parts.join(" ")} • ${unit.system}`;
    }

    function updateUnitHelp(fromUnitKey, toUnitKey) {
        const fromUnit = getUnit(fromUnitKey);
        const toUnit = getUnit(toUnitKey);
        if (!fromUnit || !toUnit) {
            elements.unitHelp.textContent = "Supports bits/bytes and decimal/binary conversions.";
            return;
        }
        const fromInfo = `${fromUnit.label}${fromUnit.symbol ? ` (${fromUnit.symbol})` : ""} • ${fromUnit.system}`;
        const toInfo = `${toUnit.label}${toUnit.symbol ? ` (${toUnit.symbol})` : ""} • ${toUnit.system}`;
        elements.unitHelp.textContent = `${fromInfo} → ${toInfo}.`;
    }

    function collectTips({ fromUnitKey, toUnitKey }) {
        const tips = new Set(BASE_TIPS);
        const fromUnit = getUnit(fromUnitKey);
        const toUnit = getUnit(toUnitKey);
        if (fromUnit?.type === "bit" || toUnit?.type === "bit") {
            BIT_TIPS.forEach((tip) => tips.add(tip));
        }
        const largeThresholdIndex = UNIT_ORDER.indexOf("gigabit");
        const involvesLarge = [fromUnitKey, toUnitKey].some((key) => {
            const index = UNIT_ORDER.indexOf(key);
            return largeThresholdIndex !== -1 && index !== -1 && index >= largeThresholdIndex;
        });
        if (involvesLarge) {
            LARGE_TIPS.forEach((tip) => tips.add(tip));
        }
        return Array.from(tips).slice(0, 6);
    }

    function updateTips(fromUnitKey, toUnitKey) {
        const items = collectTips({ fromUnitKey, toUnitKey });
        if (!elements.tipsList) return;
        elements.tipsList.replaceChildren(
            ...items.map((tip) => {
                const li = document.createElement("li");
                li.textContent = tip;
                return li;
            })
        );
    }

    function getUnitsForTable() {
        if (state.showAll) {
            return UNIT_ORDER;
        }
        const set = new Set(["bit", "byte", state.fromUnit, state.toUnit]);
        const fromCounterpart = getUnit(state.fromUnit)?.counterpart;
        const toCounterpart = getUnit(state.toUnit)?.counterpart;
        if (fromCounterpart) set.add(fromCounterpart);
        if (toCounterpart) set.add(toCounterpart);
        return UNIT_ORDER.filter((key) => set.has(key));
    }

    function renderConversionTable({ baseBytes, highlightUnitKey }) {
        if (!elements.conversionTableBody) return;
        if (!Number.isFinite(baseBytes)) {
            elements.conversionTableBody.innerHTML = `<tr class="placeholder"><td colspan="4">Full equivalence table appears here after conversion.</td></tr>`;
            return;
        }
        const rows = getUnitsForTable().map((key) => {
            const unit = getUnit(key);
            if (!unit) return "";
            const converted = baseBytes / unit.bytesPerUnit;
            const highlightClass = key === highlightUnitKey ? " class=\"highlight\"" : "";
            return `<tr${highlightClass}><td>${unit.label}</td><td>${unit.symbol || ""}</td><td>${unit.system}</td><td>${formatNumber(converted, state.precision, { pad: true })}</td></tr>`;
        }).join("");
        elements.conversionTableBody.innerHTML = rows || `<tr class="placeholder"><td colspan="4">Full equivalence table appears here after conversion.</td></tr>`;
    }

    function renderFormula({ value, fromUnitKey, toUnitKey, baseBytes, converted }) {
        const fromUnit = getUnit(fromUnitKey);
        const toUnit = getUnit(toUnitKey);
        if (!fromUnit || !toUnit) {
            return "Formula details will appear here when available.";
        }
        const valueFormatted = formatNumber(value, state.precision, { pad: true });
        const convertedFormatted = formatNumber(converted, state.precision, { pad: true });
        const baseBytesFormatted = formatNumber(baseBytes, Math.min(state.precision + 4, 10), { pad: true });
        const fromSymbol = fromUnit.symbol ? ` (${fromUnit.symbol})` : "";
        const toSymbol = toUnit.symbol ? ` (${toUnit.symbol})` : "";
        return `${valueFormatted} ${fromUnit.label}${fromSymbol} = ${baseBytesFormatted} bytes → ${convertedFormatted} ${toUnit.label}${toSymbol}`;
    }

    function updateStats({ value, converted, fromUnitKey, toUnitKey, baseBytes, baseBits, ratio }) {
        const fromUnit = getUnit(fromUnitKey);
        const toUnit = getUnit(toUnitKey);
        if (elements.inputStat) {
            elements.inputStat.textContent = `${formatNumber(value, state.precision, { pad: true })} ${fromUnit?.symbol || fromUnit?.label || ""}`.trim();
        }
        if (elements.outputStat) {
            elements.outputStat.textContent = `${formatNumber(converted, state.precision, { pad: true })} ${toUnit?.symbol || toUnit?.label || ""}`.trim();
        }
        if (elements.baseBytesStat) {
            elements.baseBytesStat.textContent = `${formatNumber(baseBytes, Math.min(state.precision + 4, 10), { pad: true })} B`;
        }
        if (elements.baseBitsStat) {
            elements.baseBitsStat.textContent = `${formatNumber(baseBits, Math.min(state.precision + 4, 10), { pad: true })} b`;
        }
        if (elements.statsNote) {
            const ratioText = Number.isFinite(ratio)
                ? `${formatNumber(ratio, Math.min(state.precision + 4, 10), { pad: true })} ${toUnit?.symbol || toUnit?.label || ""} per ${fromUnit?.symbol || fromUnit?.label || ""}`
                : "N/A";
            elements.statsNote.textContent = `${fromUnit?.system ?? ""} → ${toUnit?.system ?? ""} | Ratio: ${ratioText}`.trim();
        }
    }

    function convertValue(value, fromUnitKey, toUnitKey) {
        const fromUnit = getUnit(fromUnitKey);
        const toUnit = getUnit(toUnitKey);
        if (!fromUnit || !toUnit) {
            throw new Error("Unknown unit selection.");
        }
        const baseBytes = value * fromUnit.bytesPerUnit;
        const baseBits = baseBytes * 8;
        const converted = baseBytes / toUnit.bytesPerUnit;
        const ratio = fromUnit.bytesPerUnit / toUnit.bytesPerUnit;
        return {
            baseBytes,
            baseBits,
            converted,
            ratio
        };
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

    function handleCsvDownload() {
        if (!state.lastConversion) {
            showStatus("warn", "Convert a value before downloading CSV.", true);
            return;
        }
        const rows = [
            ["Unit", "Symbol", "System", "Value"],
            ...UNIT_ORDER.map((key) => {
                const unit = getUnit(key);
                const value = state.baseBytes / unit.bytesPerUnit;
                return [
                    unit.label,
                    unit.symbol || "",
                    unit.system,
                    formatNumber(value, state.precision, { pad: true })
                ];
            })
        ];
        const csvContent = rows
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        const stamp = new Date().toISOString().split("T")[0];
        anchor.download = `data-size-conversion-${stamp}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        showStatus("success", "CSV downloaded.", true);
    }

    function handleConversion(trigger = "auto") {
        hideStatus();
        const rawValue = elements.valueInput.value.trim();
        if (rawValue === "") {
            state.value = null;
            state.baseBytes = null;
            state.baseBits = null;
            state.convertedValue = null;
            state.lastConversion = null;
            elements.resultValue.textContent = "Enter a data size to convert";
            elements.resultFormula.textContent = "Formula details will appear here when available.";
            elements.resultBadge.textContent = "Result pending";
            elements.valueSummary.textContent = "Awaiting input.";
            elements.statsNote.textContent = "Awaiting input.";
            if (elements.inputStat) elements.inputStat.textContent = "–";
            if (elements.outputStat) elements.outputStat.textContent = "–";
            if (elements.baseBytesStat) elements.baseBytesStat.textContent = "–";
            if (elements.baseBitsStat) elements.baseBitsStat.textContent = "–";
            renderConversionTable({ baseBytes: NaN, highlightUnitKey: state.toUnit });
            return;
        }

        const numericValue = Number.parseFloat(rawValue);
        if (!Number.isFinite(numericValue)) {
            showStatus("error", "Please enter a valid number to convert.");
            return;
        }

        try {
            const { baseBytes, baseBits, converted, ratio } = convertValue(numericValue, state.fromUnit, state.toUnit);
            state.value = numericValue;
            state.baseBytes = baseBytes;
            state.baseBits = baseBits;
            state.convertedValue = converted;
            state.lastConversion = {
                fromUnit: state.fromUnit,
                toUnit: state.toUnit,
                value: numericValue,
                baseBytes,
                baseBits,
                converted,
                ratio
            };

            const toUnit = getUnit(state.toUnit);
            const formattedResult = `${formatNumber(converted, state.precision, { pad: true })} ${toUnit?.label || ""}`.trim();
            elements.resultValue.textContent = formattedResult;
            elements.resultFormula.textContent = renderFormula({
                value: numericValue,
                fromUnitKey: state.fromUnit,
                toUnitKey: state.toUnit,
                baseBytes,
                converted
            });
            elements.resultFormula.hidden = !state.showFormula;

            updateStats({
                value: numericValue,
                converted,
                fromUnitKey: state.fromUnit,
                toUnitKey: state.toUnit,
                baseBytes,
                baseBits,
                ratio
            });

            renderConversionTable({
                baseBytes,
                highlightUnitKey: state.toUnit
            });

            elements.resultBadge.textContent = `Converted • ${trigger === "manual" ? "Manual" : "Auto"}`;
            elements.valueSummary.textContent = `${formatNumber(numericValue, state.precision, { pad: true })} ${getUnit(state.fromUnit)?.label || ""} → ${formattedResult}`;
            updateUnitHelp(state.fromUnit, state.toUnit);
            updateTips(state.fromUnit, state.toUnit);
            showStatus("success", "Conversion complete.", true);
        } catch (error) {
            console.error(error);
            showStatus("error", error.message || "Unable to perform conversion.");
        }
    }

    function handleSwap() {
        const currentFrom = elements.fromUnitSelect.value;
        elements.fromUnitSelect.value = elements.toUnitSelect.value;
        elements.toUnitSelect.value = currentFrom;
        state.fromUnit = elements.fromUnitSelect.value;
        state.toUnit = elements.toUnitSelect.value;
        updateUnitBadge(state.toUnit);
        updateUnitHelp(state.fromUnit, state.toUnit);
        elements.resultBadge.textContent = "Units swapped";
        if (state.autoUpdate) {
            handleConversion("auto");
        }
    }

    function loadSample() {
        const preset = SAMPLE_PRESETS[sampleIndex % SAMPLE_PRESETS.length];
        sampleIndex += 1;
        elements.valueInput.value = preset.value;
        if (getUnit(preset.from)) {
            elements.fromUnitSelect.value = preset.from;
            state.fromUnit = preset.from;
        }
        if (getUnit(preset.to)) {
            elements.toUnitSelect.value = preset.to;
            state.toUnit = preset.to;
        }
        updateUnitBadge(state.toUnit);
        updateUnitHelp(state.fromUnit, state.toUnit);
        showStatus("info", `Sample loaded (${preset.note}).`, true);
        handleConversion("manual");
    }

    function clearForm() {
        elements.valueInput.value = "";
        state.value = null;
        state.baseBytes = null;
        state.baseBits = null;
        state.convertedValue = null;
        state.lastConversion = null;
        elements.resultValue.textContent = "Enter a data size to convert";
        elements.resultFormula.textContent = "Formula details will appear here when available.";
        elements.resultBadge.textContent = "Result pending";
        elements.valueSummary.textContent = "Awaiting input.";
        elements.statsNote.textContent = "Awaiting input.";
        if (elements.inputStat) elements.inputStat.textContent = "–";
        if (elements.outputStat) elements.outputStat.textContent = "–";
        if (elements.baseBytesStat) elements.baseBytesStat.textContent = "–";
        if (elements.baseBitsStat) elements.baseBitsStat.textContent = "–";
        renderConversionTable({ baseBytes: NaN, highlightUnitKey: state.toUnit });
        hideStatus();
    }

    function handlePrecisionChange() {
        const precision = normalizePrecision(elements.precisionInput.value);
        elements.precisionInput.value = precision;
        state.precision = precision;
        if (state.autoUpdate && state.baseBytes != null) {
            handleConversion("auto");
        }
    }

    function applyStateFromControls() {
        state.fromUnit = elements.fromUnitSelect.value;
        state.toUnit = elements.toUnitSelect.value;
        state.precision = normalizePrecision(elements.precisionInput.value);
        elements.precisionInput.value = state.precision;
        state.autoUpdate = !!elements.autoUpdateToggle?.checked;
        state.showFormula = !!elements.showFormulaToggle?.checked;
        state.showAll = !!elements.showAllToggle?.checked;
        elements.resultFormula.hidden = !state.showFormula;
        updateUnitBadge(state.toUnit);
        updateUnitHelp(state.fromUnit, state.toUnit);
        updateTips(state.fromUnit, state.toUnit);
    }

    function init() {
        populateUnitSelects();
        applyStateFromControls();

        elements.valueInput.addEventListener("input", (event) => {
            state.value = event.target.value;
            if (state.autoUpdate) {
                handleConversion("auto");
            } else if (event.target.value === "") {
                elements.valueSummary.textContent = "Awaiting input.";
            } else {
                elements.valueSummary.textContent = `${event.target.value} ${getUnit(state.fromUnit)?.label || ""} ready to convert.`;
            }
        });

        elements.fromUnitSelect.addEventListener("change", (event) => {
            state.fromUnit = event.target.value;
            updateUnitHelp(state.fromUnit, state.toUnit);
            if (state.autoUpdate && elements.valueInput.value !== "") {
                handleConversion("auto");
            }
        });

        elements.toUnitSelect.addEventListener("change", (event) => {
            state.toUnit = event.target.value;
            updateUnitBadge(state.toUnit);
            updateUnitHelp(state.fromUnit, state.toUnit);
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
            if (state.baseBytes != null) {
                renderConversionTable({
                    baseBytes: state.baseBytes,
                    highlightUnitKey: state.toUnit
                });
            }
        });
        elements.copyResultBtn.addEventListener("click", handleCopyResult);
        elements.downloadCsvBtn.addEventListener("click", handleCsvDownload);

        handleConversion("auto");
    }

    document.addEventListener("DOMContentLoaded", init);
})();
