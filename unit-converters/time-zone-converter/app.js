(function () {
    "use strict";

    const datetimeInput = document.getElementById("datetimeInput");
    const fromZoneSelect = document.getElementById("fromZoneSelect");
    const toZoneSelect = document.getElementById("toZoneSelect");
    const convertBtn = document.getElementById("convertBtn");
    const loadNowBtn = document.getElementById("loadNowBtn");
    const clearBtn = document.getElementById("clearBtn");
    const swapBtn = document.getElementById("swapBtn");
    const quickZoneButtons = document.querySelectorAll(".quick-zones .btn-xs");
    const autoUpdateToggle = document.getElementById("autoUpdateToggle");
    const showFormulaToggle = document.getElementById("showFormulaToggle");
    const showWorldToggle = document.getElementById("showWorldToggle");
    const use24HourToggle = document.getElementById("use24HourToggle");
    const includeSecondsToggle = document.getElementById("includeSecondsToggle");
    const showOffsetsToggle = document.getElementById("showOffsetsToggle");
    const copyResultBtn = document.getElementById("copyResultBtn");
    const downloadCsvBtn = document.getElementById("downloadCsvBtn");

    const resultBadge = document.getElementById("resultBadge");
    const zoneBadge = document.getElementById("zoneBadge");
    const resultValue = document.getElementById("resultValue");
    const resultFormula = document.getElementById("resultFormula");
    const worldTableWrapper = document.getElementById("worldTableWrapper");
    const worldTableBody = document.getElementById("worldTableBody");
    const valueSummary = document.getElementById("valueSummary");
    const statusBanner = document.getElementById("statusBanner");
    const statsNote = document.getElementById("statsNote");
    const offsetDiffStat = document.getElementById("offsetDiffStat");
    const fromOffsetStat = document.getElementById("fromOffsetStat");
    const toOffsetStat = document.getElementById("toOffsetStat");
    const utcStampStat = document.getElementById("utcStampStat");
    const tipsList = document.getElementById("tipsList");

    if (!datetimeInput || !fromZoneSelect || !toZoneSelect) {
        return;
    }

    const defaultTips = [
        "Enable 24-hour output for precise scheduling across regions.",
        "Check the world clock table to avoid crossing midnight when planning meetings.",
        "Share the copy-friendly summary in invites so teammates see the same conversion.",
        "Re-run conversions for dates near DST transitions to confirm offsets."
    ];

    const fallbackTimeZones = [
        "UTC",
        "Etc/GMT",
        "Europe/London",
        "Europe/Paris",
        "Europe/Berlin",
        "Europe/Madrid",
        "Europe/Rome",
        "Europe/Amsterdam",
        "Europe/Brussels",
        "Europe/Zurich",
        "Europe/Stockholm",
        "Europe/Helsinki",
        "Europe/Athens",
        "Europe/Moscow",
        "Africa/Cairo",
        "Africa/Johannesburg",
        "Asia/Jerusalem",
        "Asia/Dubai",
        "Asia/Karachi",
        "Asia/Kolkata",
        "Asia/Dhaka",
        "Asia/Bangkok",
        "Asia/Ho_Chi_Minh",
        "Asia/Singapore",
        "Asia/Kuala_Lumpur",
        "Asia/Hong_Kong",
        "Asia/Shanghai",
        "Asia/Tokyo",
        "Asia/Seoul",
        "Australia/Perth",
        "Australia/Adelaide",
        "Australia/Sydney",
        "Pacific/Auckland",
        "Pacific/Honolulu",
        "America/Anchorage",
        "America/Los_Angeles",
        "America/Denver",
        "America/Chicago",
        "America/New_York",
        "America/Toronto",
        "America/Mexico_City",
        "America/Bogota",
        "America/Lima",
        "America/Santiago",
        "America/Sao_Paulo",
        "America/Buenos_Aires",
        "Atlantic/Azores",
        "Atlantic/Reykjavik",
        "Africa/Lagos",
        "Africa/Nairobi",
        "Asia/Manila",
        "Asia/Jakarta",
        "Asia/Colombo",
        "Asia/Tbilisi",
        "Asia/Yerevan",
        "Asia/Almaty",
        "Asia/Tashkent",
        "Asia/Novosibirsk",
        "Asia/Vladivostok",
        "Asia/Magadan",
        "Pacific/Fiji",
        "Pacific/Guam"
    ];

    const worldClockCities = [
        { city: "San Francisco", timeZone: "America/Los_Angeles" },
        { city: "New York", timeZone: "America/New_York" },
        { city: "London", timeZone: "Europe/London" },
        { city: "Paris", timeZone: "Europe/Paris" },
        { city: "Dubai", timeZone: "Asia/Dubai" },
        { city: "Mumbai", timeZone: "Asia/Kolkata" },
        { city: "Singapore", timeZone: "Asia/Singapore" },
        { city: "Tokyo", timeZone: "Asia/Tokyo" },
        { city: "Sydney", timeZone: "Australia/Sydney" },
        { city: "Johannesburg", timeZone: "Africa/Johannesburg" },
        { city: "Rio de Janeiro", timeZone: "America/Sao_Paulo" },
        { city: "Auckland", timeZone: "Pacific/Auckland" }
    ];

    const state = {
        autoUpdate: true,
        showFormula: true,
        showWorld: true,
        use24Hour: true,
        includeSeconds: false,
        showOffsets: true,
        currentUTC: null,
        currentFromZone: null,
        currentToZone: null,
        currentSummary: null,
        tableData: []
    };

    const offsetFormatterCache = new Map();
    const dateFormatterCache = new Map();
    const displayName = typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

    function getSupportedTimeZones() {
        if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
            try {
                const zones = Intl.supportedValuesOf("timeZone");
                if (Array.isArray(zones) && zones.length) {
                    return zones;
                }
            } catch (error) {
                console.warn("Failed to read supported time zones, using fallback.", error);
            }
        }
        return fallbackTimeZones;
    }

    function getOffsetFormatter(timeZone) {
        if (!offsetFormatterCache.has(timeZone)) {
            offsetFormatterCache.set(
                timeZone,
                new Intl.DateTimeFormat("en-US", {
                    timeZone,
                    hour12: false,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                })
            );
        }
        return offsetFormatterCache.get(timeZone);
    }

    function getDateFormatter(timeZone, options) {
        const key = JSON.stringify({ timeZone, options });
        if (!dateFormatterCache.has(key)) {
            dateFormatterCache.set(key, new Intl.DateTimeFormat("en-US", Object.assign({ timeZone }, options)));
        }
        return dateFormatterCache.get(key);
    }

    function partsToObject(parts) {
        return parts.reduce(function (acc, part) {
            if (part.type !== "literal") {
                acc[part.type] = part.value;
            }
            return acc;
        }, {});
    }

    function getOffsetMinutes(timeZone, date) {
        try {
            const formatter = getOffsetFormatter(timeZone);
            const parts = partsToObject(formatter.formatToParts(date));
            const asUTC = Date.UTC(
                Number(parts.year),
                Number(parts.month) - 1,
                Number(parts.day),
                Number(parts.hour),
                Number(parts.minute),
                Number(parts.second || 0)
            );
            const diffMs = asUTC - date.getTime();
            return Math.round(diffMs / 60000);
        } catch (error) {
            console.error("Failed to calculate offset for", timeZone, error);
            return 0;
        }
    }

    function zonedTimeToUtc(dateTimeValue, timeZone) {
        if (!dateTimeValue) {
            return null;
        }
        const [datePart, timePart = "00:00"] = dateTimeValue.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        const timeSegments = timePart.split(":").map(Number);
        const hour = timeSegments[0] || 0;
        const minute = timeSegments[1] || 0;
        const second = timeSegments[2] || 0;

        const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
        const initialDate = new Date(utcGuess);
        const offsetMinutes = getOffsetMinutes(timeZone, initialDate);
        const preciseUtc = utcGuess - offsetMinutes * 60000;
        const preciseDate = new Date(preciseUtc);
        const refinedOffset = getOffsetMinutes(timeZone, preciseDate);
        if (refinedOffset !== offsetMinutes) {
            const finalUtc = utcGuess - refinedOffset * 60000;
            return new Date(finalUtc);
        }
        return preciseDate;
    }

    function formatOffset(minutes, { forceSign = true } = {}) {
        if (!Number.isFinite(minutes)) {
            return "UTC±00:00";
        }
        const sign = minutes < 0 ? "-" : "+";
        const absolute = Math.abs(minutes);
        const hours = Math.floor(absolute / 60);
        const minutesPart = Math.abs(absolute % 60);
        const formatted = `${hours.toString().padStart(2, "0")}:${minutesPart.toString().padStart(2, "0")}`;
        return `${forceSign ? "UTC" : ""}${forceSign ? sign : ""}${formatted}`;
    }

    function formatDifference(minutes) {
        if (!Number.isFinite(minutes)) {
            return "0 min";
        }
        if (minutes === 0) {
            return "0 min";
        }
        const sign = minutes > 0 ? "+" : "-";
        const absolute = Math.abs(minutes);
        const hours = Math.floor(absolute / 60);
        const mins = absolute % 60;
        const parts = [];
        if (hours) {
            parts.push(`${hours} h`);
        }
        if (mins) {
            parts.push(`${mins} min`);
        }
        return `${sign}${parts.join(" ")}`;
    }

    function formatDateForDisplay(date, timeZone, { use24Hour, includeSeconds }) {
        const options = {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: !use24Hour
        };
        if (includeSeconds) {
            options.second = "2-digit";
        }
        const formatter = getDateFormatter(timeZone, options);
        return formatter.format(date);
    }

    function formatTimeForTable(date, timeZone, { use24Hour, includeSeconds }) {
        const options = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: !use24Hour
        };
        if (includeSeconds) {
            options.second = "2-digit";
        }
        const formatter = getDateFormatter(timeZone, options);
        return formatter.format(date);
    }

    function formatForInput(date, timeZone, includeSeconds) {
        const formatter = getDateFormatter(timeZone, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
        const parts = partsToObject(formatter.formatToParts(date));
        const seconds = includeSeconds ? `:${parts.second}` : "";
        return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}${seconds}`;
    }

    function getRegionFromTimeZone(timeZone) {
        if (!timeZone || timeZone === "UTC" || !timeZone.includes("/")) {
            return null;
        }
        const regionCode = timeZone.split("/")[0];
        if (displayName && regionCode && regionCode.length === 2) {
            try {
                return displayName.of(regionCode.toUpperCase());
            } catch (error) {
                return regionCode;
            }
        }
        return regionCode;
    }

    function formatZoneLabel(timeZone) {
        if (!timeZone) {
            return "";
        }
        if (timeZone === "UTC") {
            return "UTC";
        }
        const parts = timeZone.split("/").map(function (segment) {
            return segment.replace(/_/g, " ");
        });
        return parts.join(" – ");
    }

    function isDstActive(timeZone, utcDate) {
        const year = utcDate.getUTCFullYear();
        const jan = new Date(Date.UTC(year, 0, 1));
        const jul = new Date(Date.UTC(year, 6, 1));
        const currentOffset = getOffsetMinutes(timeZone, utcDate);
        const janOffset = getOffsetMinutes(timeZone, jan);
        const julOffset = getOffsetMinutes(timeZone, jul);
        const standardOffset = Math.min(janOffset, julOffset);
        const variantOffset = Math.max(janOffset, julOffset);
        if (standardOffset === variantOffset) {
            return false;
        }
        return currentOffset !== standardOffset;
    }

    function populateZoneSelect(selectElement, selectedZone) {
        const zones = getSupportedTimeZones();
        const fragment = document.createDocumentFragment();
        zones.forEach(function (zone) {
            const option = document.createElement("option");
            option.value = zone;
            option.textContent = formatZoneLabel(zone);
            if (zone === selectedZone) {
                option.selected = true;
            }
            fragment.appendChild(option);
        });
        selectElement.appendChild(fragment);
    }

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

    function setResultPending() {
        state.currentUTC = null;
        state.tableData = [];
        resultValue.textContent = "Enter a date and time to convert";
        resultFormula.textContent = "Breakdown will appear here with UTC offsets and daylight saving notes.";
        resultFormula.style.display = state.showFormula ? "block" : "none";
        resultBadge.textContent = "Result pending";
        zoneBadge.textContent = "No zone selected";
        offsetDiffStat.textContent = "–";
        fromOffsetStat.textContent = "–";
        toOffsetStat.textContent = "–";
        utcStampStat.textContent = "–";
        statsNote.textContent = "Awaiting input.";
        worldTableBody.innerHTML = "<tr class=\"placeholder\"><td colspan=\"4\">World clock snapshot appears here after conversion.</td></tr>";
        worldTableWrapper.style.display = state.showWorld ? "block" : "none";
        worldTableWrapper.classList.toggle("hide-offsets", !state.showOffsets);
        state.currentSummary = null;
    }

    function buildWorldTable(utcDate) {
        const data = [];
        const options = {
            use24Hour: state.use24Hour,
            includeSeconds: state.includeSeconds
        };
        worldClockCities.forEach(function (entry) {
            const offset = getOffsetMinutes(entry.timeZone, utcDate);
            data.push({
                city: entry.city,
                timeZone: entry.timeZone,
                offset,
                time: formatTimeForTable(utcDate, entry.timeZone, options)
            });
        });
        return data;
    }

    function renderWorldTable(data) {
        if (!Array.isArray(data) || !data.length) {
            worldTableBody.innerHTML = "<tr class=\"placeholder\"><td colspan=\"4\">World clock snapshot appears here after conversion.</td></tr>";
            return;
        }
        const rows = data
            .map(function (item) {
                const offsetLabel = formatOffset(item.offset);
                const offsetCell = state.showOffsets ? offsetLabel : "";
                return `<tr><td>${item.city}</td><td>${formatZoneLabel(item.timeZone)}</td><td>${offsetCell}</td><td>${item.time}</td></tr>`;
            })
            .join("");
        worldTableBody.innerHTML = rows;
    }

    function updateStats(fromZone, toZone, utcDate) {
        const fromOffset = getOffsetMinutes(fromZone, utcDate);
        const toOffset = getOffsetMinutes(toZone, utcDate);
        const diff = toOffset - fromOffset;
        offsetDiffStat.textContent = formatDifference(diff);
        fromOffsetStat.textContent = formatOffset(fromOffset);
        toOffsetStat.textContent = formatOffset(toOffset);
        utcStampStat.textContent = `${utcDate.toISOString().replace(/\.\d{3}Z$/, "Z")}`;

        const notes = [];
        if (isDstActive(fromZone, utcDate)) {
            notes.push(`${formatZoneLabel(fromZone)} is observing DST.`);
        }
        if (isDstActive(toZone, utcDate)) {
            notes.push(`${formatZoneLabel(toZone)} is observing DST.`);
        }
        if (!notes.length) {
            notes.push("Both zones are currently in their standard offsets.");
        }
        statsNote.textContent = notes.join(" ");
    }

    function updateTips(fromZone, toZone, utcDate) {
        const tips = defaultTips.slice();
        const diffMinutes = getOffsetMinutes(toZone, utcDate) - getOffsetMinutes(fromZone, utcDate);
        if (Math.abs(diffMinutes) >= 600) {
            tips.unshift("Large offset difference detected – consider sharing agenda before meetings to help remote teammates.");
        }
        const fromRegion = getRegionFromTimeZone(fromZone);
        const toRegion = getRegionFromTimeZone(toZone);
        if (fromRegion && toRegion && fromRegion !== toRegion) {
            tips.unshift(`Plan around regional holidays – ${toRegion} may observe different working days.`);
        }
        tipsList.innerHTML = "";
        tips.forEach(function (tip) {
            const li = document.createElement("li");
            li.textContent = tip;
            tipsList.appendChild(li);
        });
    }

    function buildSummary(fromZone, toZone, utcDate) {
        const options = {
            use24Hour: state.use24Hour,
            includeSeconds: state.includeSeconds
        };
        const fromLabel = formatZoneLabel(fromZone);
        const toLabel = formatZoneLabel(toZone);
        const fromOffset = formatOffset(getOffsetMinutes(fromZone, utcDate));
        const toOffset = formatOffset(getOffsetMinutes(toZone, utcDate));
        const fromLocal = formatDateForDisplay(utcDate, fromZone, options);
        const toLocal = formatDateForDisplay(utcDate, toZone, options);
        const diff = formatDifference(getOffsetMinutes(toZone, utcDate) - getOffsetMinutes(fromZone, utcDate));
        let summary = `Time Zone Conversion\n${fromLabel} (${fromOffset}) → ${toLabel} (${toOffset})\n`;
        summary += `${fromLabel}: ${fromLocal}\n`;
        summary += `${toLabel}: ${toLocal}\n`;
        summary += `Offset difference: ${diff}\n`;
        summary += `UTC reference: ${utcDate.toISOString().replace(/\.\d{3}Z$/, "Z")}\n`;
        if (state.tableData.length) {
            summary += "\nWorld Clock Snapshot\n";
            state.tableData.forEach(function (row) {
                const offsetText = state.showOffsets ? ` (${formatOffset(row.offset)})` : "";
                summary += `${row.city}: ${row.time}${offsetText}\n`;
            });
        }
        return summary.trim();
    }

    function convert() {
        clearStatus();
        const dateValue = datetimeInput.value;
        const fromZone = fromZoneSelect.value;
        const toZone = toZoneSelect.value;

        if (!dateValue) {
            setResultPending();
            setStatus("Enter a date and time to convert.", "warn");
            return;
        }
        if (!fromZone || !toZone) {
            setStatus("Select both source and destination time zones.", "warn");
            return;
        }

        try {
            const utcDate = zonedTimeToUtc(dateValue, fromZone);
            if (!utcDate || Number.isNaN(utcDate.getTime())) {
                throw new Error("Unable to parse the provided date.");
            }
            state.currentUTC = utcDate;
            state.currentFromZone = fromZone;
            state.currentToZone = toZone;

            const options = {
                use24Hour: state.use24Hour,
                includeSeconds: state.includeSeconds
            };
            const fromDisplay = formatDateForDisplay(utcDate, fromZone, options);
            const toDisplay = formatDateForDisplay(utcDate, toZone, options);
            const fromOffset = getOffsetMinutes(fromZone, utcDate);
            const toOffset = getOffsetMinutes(toZone, utcDate);
            const diff = toOffset - fromOffset;

            resultValue.textContent = `${toDisplay} (${formatZoneLabel(toZone)})`;
            resultBadge.textContent = `Converted ${formatZoneLabel(toZone)}`;
            zoneBadge.textContent = `${formatZoneLabel(fromZone)} → ${formatZoneLabel(toZone)}`;
            resultFormula.textContent = `${formatZoneLabel(fromZone)} ${formatOffset(fromOffset)} → ${formatZoneLabel(toZone)} ${formatOffset(toOffset)} • Difference ${formatDifference(diff)}`;
            resultFormula.style.display = state.showFormula ? "block" : "none";

            valueSummary.textContent = `${formatZoneLabel(fromZone)} ${formatOffset(fromOffset)} → ${formatZoneLabel(toZone)} ${formatOffset(toOffset)}`;

            state.tableData = state.showWorld ? buildWorldTable(utcDate) : [];
            renderWorldTable(state.tableData);
            worldTableWrapper.style.display = state.showWorld ? "block" : "none";
            worldTableWrapper.classList.toggle("hide-offsets", !state.showOffsets);

            updateStats(fromZone, toZone, utcDate);
            updateTips(fromZone, toZone, utcDate);
            state.currentSummary = buildSummary(fromZone, toZone, utcDate);
            statsNote.setAttribute("aria-live", "polite");

            setStatus("Conversion updated.", "success");
        } catch (error) {
            console.error(error);
            setStatus("We couldn't complete that conversion. Double-check the input and try again.", "error");
        }
    }

    function handleAutoUpdate() {
        if (state.autoUpdate) {
            convert();
        }
    }

    function handleQuickZoneClick(event) {
        const zone = event.currentTarget.getAttribute("data-zone");
        if (!zone) {
            return;
        }
        toZoneSelect.value = zone;
        if (!fromZoneSelect.value) {
            fromZoneSelect.value = "UTC";
        }
        handleAutoUpdate();
    }

    function handleSwap() {
        const fromValue = fromZoneSelect.value;
        fromZoneSelect.value = toZoneSelect.value;
        toZoneSelect.value = fromValue;
        handleAutoUpdate();
    }

    function handleLoadNow() {
        const fromZone = fromZoneSelect.value || (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
        const now = new Date();
        const formatted = formatForInput(now, fromZone, includeSecondsToggle.checked);
        datetimeInput.value = formatted;
        handleAutoUpdate();
    }

    function handleClear() {
        datetimeInput.value = "";
        resultBadge.textContent = "Result pending";
        zoneBadge.textContent = "No zone selected";
        valueSummary.textContent = "Awaiting input.";
        statsNote.textContent = "Awaiting input.";
        setResultPending();
        clearStatus();
    }

    function handleCopyResult() {
        if (!state.currentSummary) {
            setStatus("Run a conversion before copying the result.", "warn");
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(state.currentSummary)
                .then(function () {
                    setStatus("Conversion copied to clipboard.", "success");
                })
                .catch(function () {
                    setStatus("Clipboard access was blocked. Try again or copy manually.", "warn");
                });
        } else {
            setStatus("Clipboard API not available in this browser.", "warn");
        }
    }

    function handleDownloadCsv() {
        if (!state.tableData.length) {
            setStatus("Run a conversion to build the world clock table first.", "warn");
            return;
        }
        const header = ["City", "Time Zone", "UTC Offset", "Local Time"];
        const rows = state.tableData.map(function (row) {
            const offsetCell = state.showOffsets ? formatOffset(row.offset) : "";
            return [row.city, formatZoneLabel(row.timeZone), offsetCell, row.time];
        });
        const csv = [header].concat(rows).map(function (line) {
            return line
                .map(function (value) {
                    const needsQuotes = /[",\n]/.test(value);
                    const escaped = value.replace(/"/g, '""');
                    return needsQuotes ? `"${escaped}"` : escaped;
                })
                .join(",");
        });
        const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "time-zone-conversion.csv";
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
                if (checked && state.currentUTC) {
                    convert();
                }
                break;
            case "showWorldToggle":
                state.showWorld = checked;
                worldTableWrapper.style.display = checked ? "block" : "none";
                if (checked && state.currentUTC) {
                    convert();
                }
                break;
            case "use24HourToggle":
                state.use24Hour = checked;
                if (state.currentUTC) {
                    convert();
                }
                break;
            case "includeSecondsToggle":
                state.includeSeconds = checked;
                if (datetimeInput.value) {
                    if (checked && !/:\d{2}:\d{2}$/.test(datetimeInput.value)) {
                        datetimeInput.value += ":00";
                    }
                    if (!checked && /:\d{2}:\d{2}$/.test(datetimeInput.value)) {
                        datetimeInput.value = datetimeInput.value.replace(/:(\d{2}):\d{2}$/, ":$1");
                    }
                }
                if (state.currentUTC) {
                    convert();
                }
                break;
            case "showOffsetsToggle":
                state.showOffsets = checked;
                worldTableWrapper.classList.toggle("hide-offsets", !checked);
                if (state.currentUTC) {
                    convert();
                }
                break;
            default:
                break;
        }
    }

    function bindEvents() {
        datetimeInput.addEventListener("input", handleAutoUpdate);
        fromZoneSelect.addEventListener("change", handleAutoUpdate);
        toZoneSelect.addEventListener("change", handleAutoUpdate);

        convertBtn.addEventListener("click", convert);
        loadNowBtn.addEventListener("click", handleLoadNow);
        clearBtn.addEventListener("click", handleClear);
        swapBtn.addEventListener("click", handleSwap);
        copyResultBtn.addEventListener("click", handleCopyResult);
        downloadCsvBtn.addEventListener("click", handleDownloadCsv);

        [autoUpdateToggle, showFormulaToggle, showWorldToggle, use24HourToggle, includeSecondsToggle, showOffsetsToggle].forEach(function (toggle) {
            toggle.addEventListener("change", handleToggleChange);
        });

        quickZoneButtons.forEach(function (button) {
            button.addEventListener("click", handleQuickZoneClick);
        });
    }

    function initializeDefaults() {
        const resolvedZone = (Intl.DateTimeFormat().resolvedOptions().timeZone) || "UTC";
        populateZoneSelect(fromZoneSelect, resolvedZone);
        populateZoneSelect(toZoneSelect, "UTC");

        state.autoUpdate = autoUpdateToggle.checked;
        state.showFormula = showFormulaToggle.checked;
        state.showWorld = showWorldToggle.checked;
        state.use24Hour = use24HourToggle.checked;
        state.includeSeconds = includeSecondsToggle.checked;
        state.showOffsets = showOffsetsToggle.checked;

        const now = new Date();
        datetimeInput.value = formatForInput(now, resolvedZone, state.includeSeconds);
        valueSummary.textContent = "Awaiting input.";
        setResultPending();

        if (state.autoUpdate) {
            convert();
        }
    }

    bindEvents();
    initializeDefaults();
})();
