(function () {
    "use strict";

    const barcodeInput = document.getElementById("barcodeInput");
    const barHeightInput = document.getElementById("barHeightInput");
    const barWidthInput = document.getElementById("barWidthInput");
    const quietZoneInput = document.getElementById("quietZoneInput");
    const uppercaseToggle = document.getElementById("uppercaseToggle");
    const checkDigitToggle = document.getElementById("checkDigitToggle");
    const showTextToggle = document.getElementById("showTextToggle");

    const generateBtn = document.getElementById("generateBtn");
    const copyDataBtn = document.getElementById("copyDataBtn");
    const copyImageBtn = document.getElementById("copyImageBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const resetBtn = document.getElementById("resetBtn");
    const loadDemoBtn = document.getElementById("loadDemoBtn");

    const statusBanner = document.getElementById("statusBanner");
    const lengthStat = document.getElementById("lengthStat");
    const checkDigitStat = document.getElementById("checkDigitStat");
    const widthStat = document.getElementById("widthStat");
    const tipList = document.getElementById("tipList");

    const canvas = document.getElementById("barcodeCanvas");
    const textPreview = document.getElementById("textPreview");

    if (!canvas || !canvas.getContext) {
        return;
    }

    const ctx = canvas.getContext("2d");

    const CODE39_PATTERNS = {
        "0": "nnnwwnwnn",
        "1": "wnnwnnnnw",
        "2": "nnwwnnnnw",
        "3": "wnwwnnnnn",
        "4": "nnnwwnnnw",
        "5": "wnnwwnnnn",
        "6": "nnwwwnnnn",
        "7": "nnnwnnwnw",
        "8": "wnnwnnwnn",
        "9": "nnwwnnwnn",
        "A": "wnnnnwnnw",
        "B": "nnwnnwnnw",
        "C": "wnwnnwnnn",
        "D": "nnnnwwnnw",
        "E": "wnnnwwnnn",
        "F": "nnwnwwnnn",
        "G": "nnnnnwwnw",
        "H": "wnnnnwwnn",
        "I": "nnwnnwwnn",
        "J": "nnnnwwwnn",
        "K": "wnnnnnnww",
        "L": "nnwnnnnww",
        "M": "wnwnnnnwn",
        "N": "nnnnwnnww",
        "O": "wnnnwnnwn",
        "P": "nnwnwnnwn",
        "Q": "nnnnnnwww",
        "R": "wnnnnnwwn",
        "S": "nnwnnnwwn",
        "T": "nnnnwnwwn",
        "U": "wwnnnnnnw",
        "V": "nwwnnnnnw",
        "W": "wwwnnnnnn",
        "X": "nwnnwnnnw",
        "Y": "wwnnwnnnn",
        "Z": "nwwnwnnnn",
        "-": "nwnnnnwnw",
        ".": "wwnnnnwnn",
        " ": "nwwnnnwnn",
        "*$": "nwnwnwnnn", // placeholder for mapping creation
        "$": "nwnwnwnnn",
        "/": "nwnwnnnwn",
        "+": "nwnnnwnwn",
        "%": "nnnwnwnwn",
        "*": "nwnnwnwnn"
    };

    const CODE39_VALUES = {
        "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
        "A": 10, "B": 11, "C": 12, "D": 13, "E": 14, "F": 15, "G": 16, "H": 17, "I": 18, "J": 19,
        "K": 20, "L": 21, "M": 22, "N": 23, "O": 24, "P": 25, "Q": 26, "R": 27, "S": 28, "T": 29,
        "U": 30, "V": 31, "W": 32, "X": 33, "Y": 34, "Z": 35,
        "-": 36, ".": 37, " ": 38, "$": 39, "/": 40, "+": 41, "%": 42
    };

    const state = {
        lastEncodedText: "",
        lastCheckDigit: null,
        lastWidth: 0
    };

    function clearStatus() {
        statusBanner.classList.add("hidden");
        statusBanner.textContent = "";
        statusBanner.classList.remove("success", "error", "warn");
    }

    function setStatus(message, type) {
        statusBanner.textContent = message;
        statusBanner.classList.remove("hidden", "success", "error", "warn");
        if (type) {
            statusBanner.classList.add(type);
        }
    }

    function sanitizeInput(value) {
        if (!value) {
            return "";
        }
        let processed = uppercaseToggle.checked ? value.toUpperCase() : value;
        return processed.replace(/[^0-9A-Z \-.$/+%]/g, "");
    }

    function computeCheckDigit(value) {
        let sum = 0;
        for (let i = 0; i < value.length; i += 1) {
            const char = value[i];
            if (!CODE39_VALUES.hasOwnProperty(char)) {
                return null;
            }
            sum += CODE39_VALUES[char];
        }
        const remainder = sum % 43;
        const entries = Object.entries(CODE39_VALUES);
        for (let i = 0; i < entries.length; i += 1) {
            if (entries[i][1] === remainder) {
                return entries[i][0];
            }
        }
        return null;
    }

    function buildModules(data, narrowWidth) {
        const modules = [];
        const characters = data.split("");
        const wideWidth = narrowWidth * 3;

        characters.forEach(function (char, index) {
            const pattern = CODE39_PATTERNS[char];
            if (!pattern) {
                throw new Error(`Unsupported character: ${char}`);
            }
            for (let i = 0; i < pattern.length; i += 1) {
                const isBar = i % 2 === 0;
                const width = pattern[i] === "w" ? wideWidth : narrowWidth;
                modules.push({ isBar, width });
            }
            if (index < characters.length - 1) {
                modules.push({ isBar: false, width: narrowWidth });
            }
        });
        return modules;
    }

    function encodeBarcode(rawValue, options) {
        const sanitized = sanitizeInput(rawValue);
        if (!sanitized) {
            return { sanitizedValue: "", encodedText: "", checkDigit: null, modules: [] };
        }

        let out = sanitized;
        let checkDigit = null;

        if (options.addCheckDigit) {
            checkDigit = computeCheckDigit(sanitized);
            if (checkDigit) {
                out += checkDigit;
            }
        }

        const fullText = `*${out}*`;
        const modules = buildModules(fullText, options.narrowWidth);

        return {
            sanitizedValue: sanitized,
            encodedText: out,
            checkDigit,
            modules
        };
    }

    function formatWidth(modules, quietZone) {
        const total = modules.reduce(function (acc, module) {
            return acc + module.width;
        }, 0) + quietZone * 2;
        return Math.max(1, Math.round(total));
    }

    function drawBarcode(modules, quietZone, barHeight, showText, textContent) {
        const totalWidth = formatWidth(modules, quietZone);
        const paddingTop = 12;
        const extraForText = showText && textContent ? 28 : 12;
        const height = barHeight + paddingTop + extraForText;

        canvas.width = totalWidth;
        canvas.height = height;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#111111";
        let x = quietZone;
        const y = paddingTop;

        modules.forEach(function (module) {
            if (module.isBar) {
                ctx.fillRect(Math.round(x), y, Math.max(1, Math.round(module.width)), barHeight);
            }
            x += module.width;
        });

        if (showText && textContent) {
            ctx.fillStyle = "#111111";
            ctx.font = "16px 'Inter', 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillText(textContent, canvas.width / 2, y + barHeight + 6);
        }
    }

    function updateStats(encodedText, checkDigit, modules, quietZone) {
        lengthStat.textContent = encodedText ? encodedText.length.toString() : "0";
        checkDigitStat.textContent = checkDigit || "–";
        widthStat.textContent = `${formatWidth(modules, quietZone)} px`;
    }

    function updateTips(encodedText, quietZone) {
        const tips = [
            "Keep text under 40 characters for optimal scanner reliability.",
            "Increase quiet zone for packaging or shelf labels.",
            "Enable the check digit when your workflow requires added integrity."
        ];
        if (encodedText.length > 30) {
            tips.unshift("Longer barcodes may require wider bars to remain scannable.");
        }
        if (quietZone < 10) {
            tips.unshift("Quiet zone is low. Ensure enough blank space on each side for reading.");
        }
        tipList.innerHTML = "";
        tips.slice(0, 4).forEach(function (tip) {
            const li = document.createElement("li");
            li.textContent = tip;
            tipList.appendChild(li);
        });
    }

    function renderBarcode() {
        clearStatus();
        const inputValue = barcodeInput.value;
        const sanitized = sanitizeInput(inputValue);
        if (!sanitized) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            textPreview.textContent = "";
            updateStats("", null, [], Number.parseInt(quietZoneInput.value, 10) || 0);
            setStatus("Enter a value using Code 39 compatible characters before generating.", "warn");
            return;
        }

        const barHeight = Math.min(240, Math.max(40, Number.parseInt(barHeightInput.value, 10) || 140));
        const narrowWidth = Math.min(6, Math.max(1, Number.parseInt(barWidthInput.value, 10) || 2));
        const quietZone = Math.min(40, Math.max(0, Number.parseInt(quietZoneInput.value, 10) || 12));

        barHeightInput.value = String(barHeight);
        barWidthInput.value = String(narrowWidth);
        quietZoneInput.value = String(quietZone);

        const result = encodeBarcode(sanitized, {
            addCheckDigit: Boolean(checkDigitToggle.checked),
            narrowWidth
        });

        if (!result.modules.length) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            textPreview.textContent = "";
            setStatus("Unable to encode the current value. Check for unsupported characters.", "error");
            return;
        }

        drawBarcode(result.modules, quietZone, barHeight, showTextToggle.checked, result.encodedText);
        updateStats(result.encodedText, result.checkDigit, result.modules, quietZone);
        updateTips(result.encodedText, quietZone);

        textPreview.textContent = showTextToggle.checked ? result.encodedText : "";
        barcodeInput.value = sanitized;

        state.lastEncodedText = result.encodedText;
        state.lastCheckDigit = result.checkDigit;
        state.lastWidth = formatWidth(result.modules, quietZone);

        setStatus(`Generated Code 39 barcode for ${result.encodedText.length} characters.`, "success");
    }

    function copyData() {
        if (!state.lastEncodedText) {
            setStatus("Generate a barcode before copying data.", "warn");
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(state.lastEncodedText).then(function () {
                setStatus("Barcode data copied to clipboard.", "success");
            }).catch(function () {
                setStatus("Clipboard access was blocked.", "warn");
            });
        } else {
            setStatus("Clipboard API unavailable.", "warn");
        }
    }

    function copyImage() {
        if (!state.lastEncodedText) {
            setStatus("Generate a barcode before copying the image.", "warn");
            return;
        }
        if (!navigator.clipboard || !window.ClipboardItem) {
            setStatus("Image clipboard API not supported in this browser.", "warn");
            return;
        }
        canvas.toBlob(function (blob) {
            if (!blob) {
                setStatus("Unable to copy image.", "error");
                return;
            }
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(function () {
                setStatus("Barcode image copied to clipboard.", "success");
            }).catch(function () {
                setStatus("Image clipboard access denied.", "warn");
            });
        }, "image/png", 1.0);
    }

    function downloadImage() {
        if (!state.lastEncodedText) {
            setStatus("Generate a barcode before downloading.", "warn");
            return;
        }
        canvas.toBlob(function (blob) {
            if (!blob) {
                setStatus("Unable to create download.", "error");
                return;
            }
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `barcode-${state.lastEncodedText}.png`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            setStatus("Barcode downloaded as PNG.", "success");
        }, "image/png", 1.0);
    }

    function loadDemo() {
        barcodeInput.value = "ZAPIT-123";
        barHeightInput.value = "140";
        barWidthInput.value = "2";
        quietZoneInput.value = "16";
        uppercaseToggle.checked = true;
        checkDigitToggle.checked = true;
        showTextToggle.checked = true;
        renderBarcode();
    }

    function resetAll() {
        barcodeInput.value = "";
        barHeightInput.value = "140";
        barWidthInput.value = "2";
        quietZoneInput.value = "12";
        uppercaseToggle.checked = true;
        checkDigitToggle.checked = false;
        showTextToggle.checked = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        textPreview.textContent = "";
        lengthStat.textContent = "0";
        checkDigitStat.textContent = "–";
        widthStat.textContent = "0 px";
        state.lastEncodedText = "";
        state.lastCheckDigit = null;
        state.lastWidth = 0;
        updateTips("", Number.parseInt(quietZoneInput.value, 10) || 12);
        clearStatus();
    }

    function initialize() {
        generateBtn.addEventListener("click", renderBarcode);
        copyDataBtn.addEventListener("click", copyData);
        copyImageBtn.addEventListener("click", copyImage);
        downloadBtn.addEventListener("click", downloadImage);
        resetBtn.addEventListener("click", resetAll);
        loadDemoBtn.addEventListener("click", loadDemo);

        [barcodeInput, barHeightInput, barWidthInput, quietZoneInput].forEach(function (input) {
            input.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    renderBarcode();
                }
            });
        });

        [uppercaseToggle, checkDigitToggle, showTextToggle].forEach(function (toggle) {
            toggle.addEventListener("change", function () {
                if (state.lastEncodedText || barcodeInput.value.trim()) {
                    renderBarcode();
                }
            });
        });

        tipList.innerHTML = "";
        [
            "Keep text under 40 characters for optimal scanner reliability.",
            "Increase quiet zone for packaging or shelf labels.",
            "Enable the check digit when your workflow requires added integrity."
        ].forEach(function (tip) {
            const li = document.createElement("li");
            li.textContent = tip;
            tipList.appendChild(li);
        });
    }

    initialize();
})();
