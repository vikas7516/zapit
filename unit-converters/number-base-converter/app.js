(() => {
    "use strict";

    const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
    const DIGITS_UPPER = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const PREFIX_MAP = {
        2: "0b",
        8: "0o",
        10: "",
        16: "0x"
    };
    const BASE_LABELS = {
        2: "Binary",
        3: "Ternary",
        4: "Quaternary",
        5: "Quinary",
        6: "Senary",
        7: "Septenary",
        8: "Octal",
        9: "Nonary",
        10: "Decimal",
        12: "Duodecimal",
        16: "Hexadecimal",
        20: "Vigesimal",
        26: "Base-26",
        32: "Base-32",
        36: "Base-36"
    };
    const TABLE_BASES = [2, 8, 10, 12, 16, 32, 36];
    const GROUP_SEPARATOR = "\u2009"; // thin space

    const SAMPLE_PRESETS = [
        { value: "101101111010", from: 2, to: 16, note: "Binary → Hex" },
        { value: "FF00ABCD", from: 16, to: 2, note: "Hex → Binary" },
        { value: "755", from: 8, to: 10, note: "Octal → Decimal" },
        { value: "2024", from: 10, to: 16, note: "Decimal → Hex" },
        { value: "1z141z", from: 36, to: 10, note: "Base-36 decode" }
    ];

    const GENERAL_TIPS = [
        "Annotate numbers with their base to avoid ambiguity when sharing code snippets.",
        "Group binary digits in nibbles (4 bits) to simplify reading hexadecimal values.",
        "Include prefixes like 0x, 0o, and 0b when documenting values in technical docs.",
        "Disable auto-update for very large inputs if typing becomes sluggish.",
        "Use base 10 output as a sanity check when converting between uncommon bases."
    ];

    const BASE_SPECIFIC_TIPS = {
        2: [
            "Binary data is easiest to scan when grouped in blocks of four or eight bits.",
            "Two's complement negative values require knowing the intended bit width."
        ],
        8: [
            "Octal prefixes (0o) help distinguish from decimal numbers starting with zero.",
            "Legacy UNIX file permissions are commonly expressed in octal."
        ],
        10: [
            "Decimal remains the universal check for numeric conversions.",
            "Use underscores for readability in long decimal literals (supported in many languages)."
        ],
        16: [
            "Hexadecimal pairs map directly to bytes—handy for debugging binary protocols.",
            "Uppercase hex digits (A–F) are standard in most low-level tooling."
        ],
        32: [
            "Base32 is case-insensitive; uppercase output avoids confusion in documentation.",
            "Group Base32 output in blocks of 5 or 8 characters for better scanning."
        ],
        36: [
            "Base36 is excellent for compact human-readable identifiers.",
            "Uppercase output avoids ambiguous characters when sharing Base36 tokens."
        ]
    };

    let sampleIndex = 0;

    const elements = {
        valueInput: document.getElementById("valueInput"),
        fromBaseSelect: document.getElementById("fromBaseSelect"),
        toBaseSelect: document.getElementById("toBaseSelect"),
        autoUpdateToggle: document.getElementById("autoUpdateToggle"),
        showFormulaToggle: document.getElementById("showFormulaToggle"),
        showAllToggle: document.getElementById("showAllToggle"),
        uppercaseToggle: document.getElementById("uppercaseToggle"),
        prefixToggle: document.getElementById("prefixToggle"),
        groupToggle: document.getElementById("groupToggle"),
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
        baseBadge: document.getElementById("baseBadge"),
        valueSummary: document.getElementById("valueSummary"),
        valueHelp: document.getElementById("valueHelp"),
        conversionTableBody: document.getElementById("conversionTableBody"),
        inputDigitsStat: document.getElementById("inputDigitsStat"),
        outputDigitsStat: document.getElementById("outputDigitsStat"),
        bitLengthStat: document.getElementById("bitLengthStat"),
        byteLengthStat: document.getElementById("byteLengthStat"),
        statsNote: document.getElementById("statsNote"),
        tipsList: document.getElementById("tipsList"),
        quickBases: document.querySelector(".quick-bases")
    };

    const state = {
        valueRaw: "",
        fromBase: 10,
        toBase: 2,
        autoUpdate: true,
        showFormula: true,
        showAll: true,
        uppercase: true,
        includePrefix: true,
        groupDigits: true,
        lastConversion: null,
        activeSelect: "to"
    };

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

    function getBaseLabel(base) {
        return BASE_LABELS[base] || `Base ${base}`;
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (char) => {
            switch (char) {
                case "&":
                    return "&amp;";
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
                case '"':
                    return "&quot;";
                case "'":
                    return "&#39;";
                default:
                    return char;
            }
        });
    }

    function populateBaseSelect(select) {
        const fragment = document.createDocumentFragment();
        for (let base = 2; base <= 36; base += 1) {
            const option = document.createElement("option");
            option.value = base;
            option.textContent = `${getBaseLabel(base)} (Base ${base})`;
            fragment.appendChild(option);
        }
        select.replaceChildren(fragment);
    }

    function stripPrefix(value, base) {
        const prefixes = {
            2: ["0b", "0B"],
            8: ["0o", "0O"],
            16: ["0x", "0X"]
        };
        const list = prefixes[base];
        if (!list) return value;
        for (const prefix of list) {
            if (value.startsWith(prefix)) {
                return value.slice(prefix.length);
            }
        }
        return value;
    }

    function parseInput(rawValue, base) {
        const trimmed = rawValue.trim();
        if (trimmed === "") {
            throw new Error("Please enter a value to convert.");
        }
        let working = trimmed;
        let negative = false;
        if (working.startsWith("+")) {
            working = working.slice(1);
        }
        if (working.startsWith("-")) {
            negative = true;
            working = working.slice(1);
        }
        working = stripPrefix(working, base);
        working = working.replace(/[_\s]+/g, "");
        if (working === "") {
            throw new Error("Value contains no digits after removing prefixes/spaces.");
        }
        if (/[.,]/.test(working)) {
            throw new Error("Fractional parts are not supported yet. Enter an integer value.");
        }
        const baseBig = BigInt(base);
        let result = 0n;
        for (const char of working) {
            const digitIndex = DIGITS.indexOf(char.toLowerCase());
            if (digitIndex === -1 || digitIndex >= base) {
                throw new Error(`Invalid digit "${char}" for base ${base}.`);
            }
            result = result * baseBig + BigInt(digitIndex);
        }
        if (negative) {
            result *= -1n;
        }
        const normalized = `${negative ? "-" : ""}${working.toUpperCase()}`;
        return {
            value: result,
            normalized,
            digitCount: working.length
        };
    }

    function convertBigIntToBase(value, base) {
        if (value === 0n) {
            return "0";
        }
        const negative = value < 0n;
        let remainder = negative ? -value : value;
        const baseBig = BigInt(base);
        let output = "";
        while (remainder > 0n) {
            const digit = Number(remainder % baseBig);
            output = DIGITS_UPPER[digit] + output;
            remainder = remainder / baseBig;
        }
        return negative ? `-${output}` : output;
    }

    function getGroupSize(base) {
        if (base === 2) return 4;
        if (base === 8) return 3;
        if (base === 16 || base === 32 || base === 36) return 4;
        if (base === 10) return 3;
        return 4;
    }

    function applyGrouping(str, groupSize) {
        if (groupSize <= 0 || str.length <= groupSize) {
            return str;
        }
        let result = "";
        for (let i = str.length; i > 0; i -= groupSize) {
            const start = Math.max(i - groupSize, 0);
            const chunk = str.slice(start, i);
            result = result ? `${chunk}${GROUP_SEPARATOR}${result}` : chunk;
        }
        return result;
    }

    function getPrefix(base, uppercase) {
        const prefix = PREFIX_MAP[base];
        if (prefix != null) {
            return uppercase ? prefix.toUpperCase() : prefix.toLowerCase();
        }
        const label = uppercase ? `BASE${base}` : `base${base}`;
        return `${label}:`;
    }

    function createRepresentation(value, base, { uppercase, groupDigits, includePrefix }) {
        const raw = convertBigIntToBase(value, base);
        const negative = raw.startsWith("-");
        let magnitude = negative ? raw.slice(1) : raw;
        magnitude = uppercase ? magnitude.toUpperCase() : magnitude.toLowerCase();
        if (groupDigits) {
            const grouped = applyGrouping(magnitude, getGroupSize(base));
            magnitude = grouped;
        }
        let prefix = "";
        if (includePrefix) {
            prefix = getPrefix(base, uppercase);
        }
        const needsSpace = prefix && prefix.endsWith(":");
        const formatted = `${negative ? "-" : ""}${prefix}${prefix && needsSpace ? " " : ""}${magnitude}`;
        const digitCount = raw.startsWith("-") ? raw.length - 1 : raw.length;
        return {
            raw,
            formatted,
            digitCount,
            prefix
        };
    }

    function getBitLength(value) {
        let magnitude = value < 0n ? -value : value;
        if (magnitude === 0n) {
            return 1;
        }
        let length = 0;
        while (magnitude > 0n) {
            magnitude >>= 1n;
            length += 1;
        }
        return length;
    }

    function collectTips(fromBase, toBase) {
        const tips = new Set(GENERAL_TIPS);
        const append = (base) => {
            const list = BASE_SPECIFIC_TIPS[base];
            if (list) {
                list.forEach((tip) => tips.add(tip));
            }
        };
        append(fromBase);
        append(toBase);
        return Array.from(tips).slice(0, 6);
    }

    function renderTips() {
        if (!elements.tipsList) return;
        const items = collectTips(state.fromBase, state.toBase);
        elements.tipsList.replaceChildren(
            ...items.map((tip) => {
                const li = document.createElement("li");
                li.textContent = tip;
                return li;
            })
        );
    }

    function updateBaseBadge() {
        const fromLabel = getBaseLabel(state.fromBase);
        const toLabel = getBaseLabel(state.toBase);
        elements.baseBadge.textContent = `${fromLabel} (Base ${state.fromBase}) → ${toLabel} (Base ${state.toBase})`;
        elements.valueHelp.textContent = `${fromLabel} to ${toLabel}. Prefix ${state.includePrefix ? "enabled" : "disabled"}.`;
    }

    function renderConversionTable(value) {
        if (!elements.conversionTableBody) return;
        if (!state.lastConversion) {
            elements.conversionTableBody.innerHTML = `<tr class="placeholder"><td colspan="4">Full base equivalence table appears here after conversion.</td></tr>`;
            return;
        }
        const bases = state.showAll
            ? TABLE_BASES
            : Array.from(new Set([state.fromBase, state.toBase, 10])).sort((a, b) => a - b);
        const rows = bases.map((base) => {
            const representation = createRepresentation(value, base, state);
            const highlight = base === state.toBase ? " class=\"highlight\"" : "";
            const prefixDisplay = representation.prefix || "—";
            return `<tr${highlight}><td>${escapeHtml(`Base ${base}`)}</td><td>${escapeHtml(getBaseLabel(base))}</td><td>${escapeHtml(prefixDisplay)}</td><td>${escapeHtml(representation.formatted)}</td></tr>`;
        }).join("");
        elements.conversionTableBody.innerHTML = rows || `<tr class="placeholder"><td colspan="4">Full base equivalence table appears here after conversion.</td></tr>`;
    }

    function updateStats({ inputDigits, outputDigits, bitLength, byteLength, decimalRepresentation }) {
        if (elements.inputDigitsStat) {
            elements.inputDigitsStat.textContent = inputDigits;
        }
        if (elements.outputDigitsStat) {
            elements.outputDigitsStat.textContent = outputDigits;
        }
        if (elements.bitLengthStat) {
            elements.bitLengthStat.textContent = `${bitLength}`;
        }
        if (elements.byteLengthStat) {
            elements.byteLengthStat.textContent = `${byteLength}`;
        }
        if (elements.statsNote) {
            elements.statsNote.textContent = `Decimal: ${decimalRepresentation.formatted}`;
        }
    }

    function renderFormula({ inputRepresentation, decimalRepresentation, outputRepresentation }) {
        const fromBase = state.fromBase;
        const toBase = state.toBase;
        const pieces = [
            `${inputRepresentation.formatted} [base ${fromBase}]`,
            `${decimalRepresentation.formatted} [base 10]`,
            `${outputRepresentation.formatted} [base ${toBase}]`
        ];
        return pieces.join(" → ");
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
        const value = state.lastConversion.value;
        const rows = [
            ["Base", "Label", "Prefix", "Representation"],
            ...TABLE_BASES.map((base) => {
                const representation = createRepresentation(value, base, state);
                return [
                    `Base ${base}`,
                    getBaseLabel(base),
                    representation.prefix || "",
                    representation.formatted
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
        anchor.download = `number-base-conversion-${stamp}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        showStatus("success", "CSV downloaded.", true);
    }

    function resetView() {
        elements.resultValue.textContent = "Enter a number to convert";
        elements.resultFormula.textContent = "Formula details will appear here when available.";
        elements.resultBadge.textContent = "Result pending";
        elements.baseBadge.textContent = "No bases selected";
        elements.valueSummary.textContent = "Awaiting input.";
        elements.statsNote.textContent = "Awaiting input.";
        if (elements.inputDigitsStat) elements.inputDigitsStat.textContent = "–";
        if (elements.outputDigitsStat) elements.outputDigitsStat.textContent = "–";
        if (elements.bitLengthStat) elements.bitLengthStat.textContent = "–";
        if (elements.byteLengthStat) elements.byteLengthStat.textContent = "–";
        elements.conversionTableBody.innerHTML = `<tr class="placeholder"><td colspan="4">Full base equivalence table appears here after conversion.</td></tr>`;
        state.lastConversion = null;
    }

    function handleConversion(trigger = "auto") {
        hideStatus();
        const rawValue = elements.valueInput.value;
        if (rawValue.trim() === "") {
            resetView();
            return;
        }
        try {
            const parsed = parseInput(rawValue, state.fromBase);
            const inputRepresentation = createRepresentation(parsed.value, state.fromBase, state);
            const outputRepresentation = createRepresentation(parsed.value, state.toBase, state);
            const decimalRepresentation = createRepresentation(parsed.value, 10, { ...state, includePrefix: state.includePrefix });
            const bitLength = getBitLength(parsed.value);
            const byteLength = Math.ceil(bitLength / 8);

            state.lastConversion = {
                value: parsed.value,
                inputDigits: parsed.digitCount,
                outputDigits: outputRepresentation.digitCount
            };

            elements.resultValue.textContent = outputRepresentation.formatted;
            elements.resultFormula.textContent = renderFormula({
                inputRepresentation,
                decimalRepresentation,
                outputRepresentation
            });
            elements.resultFormula.hidden = !state.showFormula;
            elements.resultBadge.textContent = `Converted • ${trigger === "manual" ? "Manual" : "Auto"}`;
            elements.valueSummary.textContent = `${inputRepresentation.formatted} → ${outputRepresentation.formatted}`;
            updateBaseBadge();
            updateStats({
                inputDigits: parsed.digitCount,
                outputDigits: outputRepresentation.digitCount,
                bitLength,
                byteLength,
                decimalRepresentation
            });
            renderConversionTable(parsed.value);
            renderTips();
            showStatus("success", "Conversion complete.", true);
        } catch (error) {
            state.lastConversion = null;
            elements.resultBadge.textContent = "Conversion failed";
            showStatus("error", error.message || "Unable to perform conversion.");
        }
    }

    function handleSwap() {
        const current = state.fromBase;
        state.fromBase = state.toBase;
        state.toBase = current;
        elements.fromBaseSelect.value = state.fromBase;
        elements.toBaseSelect.value = state.toBase;
        updateBaseBadge();
        elements.resultBadge.textContent = "Bases swapped";
        if (state.autoUpdate && elements.valueInput.value.trim() !== "") {
            handleConversion("auto");
        }
    }

    function loadSample() {
        const preset = SAMPLE_PRESETS[sampleIndex % SAMPLE_PRESETS.length];
        sampleIndex += 1;
        elements.valueInput.value = preset.value;
        state.valueRaw = preset.value;
        if (preset.from) {
            state.fromBase = preset.from;
            elements.fromBaseSelect.value = preset.from;
        }
        if (preset.to) {
            state.toBase = preset.to;
            elements.toBaseSelect.value = preset.to;
        }
        updateBaseBadge();
        renderTips();
        showStatus("info", `Sample loaded (${preset.note}).`, true);
        handleConversion("manual");
    }

    function clearForm() {
        elements.valueInput.value = "";
        state.valueRaw = "";
        hideStatus();
        resetView();
        updateBaseBadge();
    }

    function applyStateFromControls() {
        state.fromBase = Number(elements.fromBaseSelect.value) || 10;
        state.toBase = Number(elements.toBaseSelect.value) || 2;
        state.autoUpdate = !!elements.autoUpdateToggle?.checked;
        state.showFormula = !!elements.showFormulaToggle?.checked;
        state.showAll = !!elements.showAllToggle?.checked;
        state.uppercase = !!elements.uppercaseToggle?.checked;
        state.includePrefix = !!elements.prefixToggle?.checked;
        state.groupDigits = !!elements.groupToggle?.checked;
        elements.resultFormula.hidden = !state.showFormula;
        updateBaseBadge();
        renderTips();
    }

    function init() {
        populateBaseSelect(elements.fromBaseSelect);
        populateBaseSelect(elements.toBaseSelect);
        elements.fromBaseSelect.value = state.fromBase;
        elements.toBaseSelect.value = state.toBase;
        applyStateFromControls();

        elements.valueInput.addEventListener("input", (event) => {
            state.valueRaw = event.target.value;
            if (state.autoUpdate) {
                handleConversion("auto");
            } else if (event.target.value.trim() === "") {
                elements.valueSummary.textContent = "Awaiting input.";
                resetView();
            } else {
                elements.valueSummary.textContent = `${event.target.value} ready to convert.`;
            }
        });

        elements.fromBaseSelect.addEventListener("focus", () => {
            state.activeSelect = "from";
        });

        elements.toBaseSelect.addEventListener("focus", () => {
            state.activeSelect = "to";
        });

        elements.fromBaseSelect.addEventListener("change", (event) => {
            state.fromBase = Number(event.target.value);
            updateBaseBadge();
            renderTips();
            if (state.autoUpdate && elements.valueInput.value.trim() !== "") {
                handleConversion("auto");
            }
        });

        elements.toBaseSelect.addEventListener("change", (event) => {
            state.toBase = Number(event.target.value);
            updateBaseBadge();
            renderTips();
            if (state.autoUpdate && elements.valueInput.value.trim() !== "") {
                handleConversion("auto");
            }
        });

        elements.quickBases?.addEventListener("click", (event) => {
            const target = event.target.closest("button[data-base]");
            if (!target) return;
            const base = Number(target.dataset.base);
            if (Number.isNaN(base)) return;
            const select = state.activeSelect === "from" ? elements.fromBaseSelect : elements.toBaseSelect;
            select.value = base;
            if (state.activeSelect === "from") {
                state.fromBase = base;
            } else {
                state.toBase = base;
            }
            updateBaseBadge();
            renderTips();
            if (state.autoUpdate && elements.valueInput.value.trim() !== "") {
                handleConversion("auto");
            }
        });

        elements.swapBtn.addEventListener("click", handleSwap);
        elements.loadSampleBtn.addEventListener("click", loadSample);
        elements.clearBtn.addEventListener("click", clearForm);
        elements.convertBtn.addEventListener("click", () => handleConversion("manual"));
        elements.copyResultBtn.addEventListener("click", handleCopyResult);
        elements.downloadCsvBtn.addEventListener("click", handleCsvDownload);

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
            if (state.lastConversion) {
                renderConversionTable(state.lastConversion.value);
            }
        });

        elements.uppercaseToggle.addEventListener("change", (event) => {
            state.uppercase = event.target.checked;
            if (state.lastConversion) {
                handleConversion("auto");
            }
        });

        elements.prefixToggle.addEventListener("change", (event) => {
            state.includePrefix = event.target.checked;
            if (state.lastConversion) {
                handleConversion("auto");
            } else {
                updateBaseBadge();
            }
        });

        elements.groupToggle.addEventListener("change", (event) => {
            state.groupDigits = event.target.checked;
            if (state.lastConversion) {
                handleConversion("auto");
            }
        });

        resetView();
        updateBaseBadge();
        renderTips();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
