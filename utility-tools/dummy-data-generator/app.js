(function () {
    "use strict";

    const recordCountInput = document.getElementById("recordCountInput");
    const formatSelect = document.getElementById("formatSelect");
    const includeHeadersToggle = document.getElementById("includeHeadersToggle");
    const consistentSeedToggle = document.getElementById("consistentSeedToggle");
    const smartLoremToggle = document.getElementById("smartLoremToggle");
    const loadPresetBtn = document.getElementById("loadPresetBtn");
    const clearBtn = document.getElementById("clearBtn");
    const generateBtn = document.getElementById("generateBtn");
    const copyBtn = document.getElementById("copyBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const toggleAllBtn = document.getElementById("toggleAllBtn");
    const fieldSearch = document.getElementById("fieldSearch");
    const fieldGroupsContainer = document.getElementById("fieldGroups");
    const statusBanner = document.getElementById("statusBanner");
    const configSummary = document.getElementById("configSummary");
    const recordBadge = document.getElementById("recordBadge");
    const fieldBadge = document.getElementById("fieldBadge");
    const selectionStat = document.getElementById("selectionStat");
    const timeStat = document.getElementById("timeStat");
    const sizeStat = document.getElementById("sizeStat");
    const seedStat = document.getElementById("seedStat");
    const tipsList = document.getElementById("tipsList");

    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("tableBody");
    const tableOutput = document.getElementById("tableOutput");
    const codeOutput = document.getElementById("codeOutput");

    if (!recordCountInput) {
        return;
    }

    const FIRST_NAMES = ["Avery", "Liam", "Noah", "Olivia", "Emma", "Mia", "Lucas", "Elijah", "Harper", "Sofia", "Mateo", "Nova", "Kai", "Zoe", "Ivy", "Theo", "Amara", "Milo", "Hazel", "Ezra"];
    const LAST_NAMES = ["Chen", "Johnson", "Garcia", "Khan", "Fernandez", "O'Connor", "Singh", "Okafor", "Nakamura", "Silva", "Bennett", "Nguyen", "Williams", "Hernandez", "Lopez", "Patel", "Brown", "Martin", "Fischer", "Smirnov"];
    const COMPANY_WORDS = ["Nimbus", "Velocity", "Evergreen", "Atlas", "Quantum", "Bluebird", "Summit", "Aurora", "Vertex", "Pioneer", "Halo", "Momentum", "Stellar", "Lumen", "Catalyst"];
    const INDUSTRIES = ["Software", "Design", "Fintech", "Healthcare", "Retail", "Energy", "Education", "Logistics", "Media", "AI"]; 
    const JOB_TITLES = ["Product Manager", "UX Designer", "Software Engineer", "Data Scientist", "Marketing Lead", "Customer Success", "Sales Executive", "DevOps Engineer", "Financial Analyst", "Content Strategist"];
    const STREET_NAMES = ["Maple", "Cedar", "Oak", "Pine", "Elm", "Birch", "Willow", "Aspen", "Lakeview", "Sunset", "Meadow", "Riverside", "Hillcrest", "Highland", "Canyon", "Heritage", "Aurora", "Sycamore", "Silverleaf", "Bluebird"];
    const STREET_TYPES = ["St", "Ave", "Blvd", "Rd", "Ln", "Way", "Dr", "Ct", "Terrace", "Plaza"];
    const CITIES = ["Austin", "Toronto", "Berlin", "Sydney", "Cape Town", "São Paulo", "Mumbai", "Singapore", "Amsterdam", "Vancouver", "Chicago", "Lisbon", "Seattle", "Denver", "Auckland"];
    const STATES = ["CA", "NY", "TX", "WA", "CO", "ON", "BC", "QLD", "NSW", "SP", "MH", "NH", "FL", "OR", "IL"];
    const COUNTRIES = ["United States", "Canada", "Germany", "Australia", "South Africa", "Brazil", "India", "Singapore", "Netherlands", "New Zealand", "United Kingdom", "Spain", "France", "Japan", "Sweden"];
    const TLD_LIST = [".com", ".io", ".dev", ".net", ".co", ".org", ".app", ".studio", ".xyz", ".cloud"];
    const LOREM_SENTENCES = [
        "Build delightful user journeys with mindful defaults.",
        "Testing with mock data keeps production spotless.",
        "Async flows deserve deterministic fixtures.",
        "Design tokens should feel effortless to adopt.",
        "Confidence grows when teams can rehearse changes.",
        "Accessible content resonates across every market.",
        "Great DX removes friction long before launch day."
    ];
    const LOREM_PARAGRAPHS = [
        "Crafting resilient products means prototyping with believable content. Blend names, addresses, and narrative snippets so reviewers can focus on flow instead of placeholder noise.",
        "When teams ship fast, confident mock data keeps everyone aligned. Generate test cases that stress validation rules, cover edge cases, and mirror the tone of real customers.",
        "Reusable fixtures save hours across QA, design QA, and demos. Store presets for your personas, then refresh the dataset with a single click before every run."
    ];

    const FIELD_DEFINITIONS = [
        { id: "id", label: "ID (increment)", category: "Numeric", generator: ctx => ctx.index + 1 },
        { id: "uuid", label: "UUID", category: "Numeric", generator: ctx => generateUuid(ctx.rng) },
        { id: "firstName", label: "First name", category: "Identity", generator: ctx => pickFrom(FIRST_NAMES, ctx.rng) },
        { id: "lastName", label: "Last name", category: "Identity", generator: ctx => pickFrom(LAST_NAMES, ctx.rng) },
        { id: "fullName", label: "Full name", category: "Identity", generator: ctx => `${pickFrom(FIRST_NAMES, ctx.rng)} ${pickFrom(LAST_NAMES, ctx.rng)}` },
        { id: "email", label: "Email", category: "Contact", generator: ctx => buildEmail(ctx) },
        { id: "username", label: "Username", category: "Internet", generator: ctx => buildUsername(ctx) },
        { id: "company", label: "Company", category: "Business", generator: ctx => `${pickFrom(COMPANY_WORDS, ctx.rng)} ${pickFrom(["Labs", "Systems", "Works", "Studio", "Partners", "Collective", "Analytics", "Tech", "Ventures"], ctx.rng)}` },
        { id: "jobTitle", label: "Job title", category: "Business", generator: ctx => pickFrom(JOB_TITLES, ctx.rng) },
        { id: "domain", label: "Domain", category: "Internet", generator: ctx => buildDomain(ctx) },
        { id: "phone", label: "Phone number", category: "Contact", generator: ctx => buildPhone(ctx) },
        { id: "street", label: "Street address", category: "Location", generator: ctx => buildStreet(ctx) },
        { id: "city", label: "City", category: "Location", generator: ctx => pickFrom(CITIES, ctx.rng) },
        { id: "state", label: "State / Region", category: "Location", generator: ctx => pickFrom(STATES, ctx.rng) },
        { id: "postalCode", label: "Postal code", category: "Location", generator: ctx => buildPostal(ctx) },
        { id: "country", label: "Country", category: "Location", generator: ctx => pickFrom(COUNTRIES, ctx.rng) },
        { id: "latitude", label: "Latitude", category: "Location", generator: ctx => roundTo(ctx.rng.nextRange(-90, 90), 5) },
        { id: "longitude", label: "Longitude", category: "Location", generator: ctx => roundTo(ctx.rng.nextRange(-180, 180), 5) },
        { id: "website", label: "Website URL", category: "Internet", generator: ctx => `https://${buildDomain(ctx)}` },
        { id: "avatar", label: "Avatar URL", category: "Internet", generator: ctx => buildAvatar(ctx) },
        { id: "boolean", label: "Boolean", category: "Misc", generator: ctx => ctx.rng.next() > 0.5 },
        { id: "integer", label: "Integer 100-9999", category: "Numeric", generator: ctx => ctx.rng.nextInt(100, 9999) },
        { id: "float", label: "Float 0-1", category: "Numeric", generator: ctx => roundTo(ctx.rng.next(), 4) },
        { id: "date", label: "Recent date", category: "Dates", generator: ctx => buildDate(ctx, "date") },
        { id: "time", label: "Time of day", category: "Dates", generator: ctx => buildDate(ctx, "time") },
        { id: "dateTime", label: "ISO timestamp", category: "Dates", generator: ctx => buildDate(ctx, "datetime") },
        { id: "loremText", label: "Lorem text", category: "Content", generator: ctx => buildLorem(ctx) },
        { id: "colorHex", label: "Color hex", category: "Misc", generator: ctx => buildColor(ctx) }
    ];

    const FIELD_GROUPS = groupFieldsByCategory(FIELD_DEFINITIONS);

    const state = {
        selectedFields: new Set(["fullName", "email", "company", "country"]),
        seed: null,
        lastOutput: "",
        lastMime: "text/plain",
        lastFilename: "dummy-data.txt",
        lastFormat: "table",
        smartLorem: true,
        generationTime: null,
        dataSize: null
    };

    function pickFrom(list, rng) {
        const index = Math.floor(rng.next() * list.length);
        return list[index % list.length];
    }

    function generateUuid(rng) {
        const hex = "0123456789abcdef";
        const bytes = Array.from({ length: 16 }, () => hex[Math.floor(rng.next() * 16)]);
        bytes[6] = hex[(parseInt(bytes[6], 16) & 0x0f) | 0x40];
        bytes[8] = hex[(parseInt(bytes[8], 16) & 0x3f) | 0x80];
        return `${bytes[0]}${bytes[1]}${bytes[2]}${bytes[3]}-${bytes[4]}${bytes[5]}-${bytes[6]}${bytes[7]}-${bytes[8]}${bytes[9]}-${bytes[10]}${bytes[11]}${bytes[12]}${bytes[13]}${bytes[14]}${bytes[15]}`;
    }

    function buildEmail(ctx) {
        const first = pickFrom(FIRST_NAMES, ctx.rng).toLowerCase();
        const last = pickFrom(LAST_NAMES, ctx.rng).toLowerCase();
        return `${normalizeSlug(first)}.${normalizeSlug(last)}@${buildDomain(ctx)}`;
    }

    function buildUsername(ctx) {
        const adjective = pickFrom(["bright", "neon", "silver", "rapid", "bold", "quiet", "lucky", "stellar", "midnight", "solar"], ctx.rng);
        const noun = pickFrom(["owl", "fox", "whale", "cloud", "ember", "pixel", "sage", "tempo", "sparrow", "canyon"], ctx.rng);
        return `${adjective}${noun}${ctx.rng.nextInt(10, 999)}`;
    }

    function buildDomain(ctx) {
        const name = pickFrom(COMPANY_WORDS, ctx.rng).toLowerCase().replace(/[^a-z0-9]/g, "");
        const tld = pickFrom(TLD_LIST, ctx.rng);
        return `${name}${tld}`;
    }

    function buildPhone(ctx) {
        const country = pickFrom(["+1", "+44", "+61", "+49", "+65", "+34", "+81"], ctx.rng);
        const area = ctx.rng.nextInt(100, 999);
        const part1 = ctx.rng.nextInt(100, 999);
        const part2 = ctx.rng.nextInt(1000, 9999);
        return `${country} ${area}-${part1}-${part2}`;
    }

    function buildStreet(ctx) {
        const num = ctx.rng.nextInt(10, 9999);
        const name = pickFrom(STREET_NAMES, ctx.rng);
        const type = pickFrom(STREET_TYPES, ctx.rng);
        return `${num} ${name} ${type}.`;
    }

    function buildPostal(ctx) {
        const pattern = ctx.rng.next() > 0.5 ? "#####" : "A1A 1A1";
        return pattern.replace(/#/g, () => String(ctx.rng.nextInt(0, 9))).replace(/A/g, () => pickFrom("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), ctx.rng));
    }

    function buildAvatar(ctx) {
        const seed = ctx.rng.nextInt(1000, 9999);
        return `https://avatars.dicebear.com/api/identicon/mock-${seed}.svg`;
    }

    function buildDate(ctx, mode) {
        const now = Date.now();
        const yearSpan = 1000 * 60 * 60 * 24 * 365 * 2; // two years
        const randomTime = now - ctx.rng.next() * yearSpan;
        const date = new Date(randomTime);
        if (mode === "date") {
            return date.toISOString().slice(0, 10);
        }
        if (mode === "time") {
            return date.toISOString().slice(11, 19);
        }
        return date.toISOString();
    }

    function buildLorem(ctx) {
        if (!state.smartLorem || !smartLoremToggle.checked) {
            return pickFrom(LOREM_SENTENCES, ctx.rng);
        }
        return pickFrom(LOREM_PARAGRAPHS, ctx.rng);
    }

    function buildColor(ctx) {
        const value = ctx.rng.nextInt(0, 0xffffff);
        return `#${value.toString(16).padStart(6, "0")}`;
    }

    function normalizeSlug(value) {
        return value.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16);
    }

    function roundTo(value, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    function groupFieldsByCategory(fields) {
        return fields.reduce(function (acc, field) {
            if (!acc[field.category]) {
                acc[field.category] = [];
            }
            acc[field.category].push(field);
            return acc;
        }, {});
    }

    function createRng(seed) {
        let state = seed >>> 0;
        return {
            next() {
                state = (1664525 * state + 1013904223) >>> 0;
                return state / 4294967296;
            },
            nextInt(min, max) {
                return Math.floor(this.next() * (max - min + 1)) + min;
            },
            nextRange(min, max) {
                return this.next() * (max - min) + min;
            }
        };
    }

    function hashSeed(input) {
        let hash = 2166136261;
        for (let i = 0; i < input.length; i += 1) {
            hash ^= input.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function renderFieldGroups() {
        fieldGroupsContainer.innerHTML = "";
        Object.keys(FIELD_GROUPS).forEach(function (group) {
            const groupWrapper = document.createElement("div");
            groupWrapper.className = "field-group";
            groupWrapper.dataset.group = group.toLowerCase();

            const title = document.createElement("div");
            title.className = "field-group-title";
            title.textContent = group;
            groupWrapper.appendChild(title);

            FIELD_GROUPS[group].forEach(function (field) {
                const label = document.createElement("label");
                label.className = "checkbox";
                label.dataset.fieldId = field.id;

                const input = document.createElement("input");
                input.type = "checkbox";
                input.value = field.id;
                input.checked = state.selectedFields.has(field.id);

                input.addEventListener("change", function () {
                    if (input.checked) {
                        state.selectedFields.add(field.id);
                    } else {
                        state.selectedFields.delete(field.id);
                    }
                    updateSelectionBadges();
                });

        const span = document.createElement("span");
                span.textContent = field.label;

                label.appendChild(input);
                label.appendChild(span);
                groupWrapper.appendChild(label);
            });

            fieldGroupsContainer.appendChild(groupWrapper);
        });
        updateSelectionBadges();
    }

    function updateSelectionBadges() {
        const count = state.selectedFields.size;
        fieldBadge.textContent = `${count} field${count === 1 ? "" : "s"} selected`;
        selectionStat.textContent = count ? String(count) : "–";
        toggleAllBtn.textContent = count === FIELD_DEFINITIONS.length ? "Deselect all" : "Select all";
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

    function updateConfigSummary() {
        const count = Math.max(1, Number.parseInt(recordCountInput.value, 10) || 1);
        recordCountInput.value = String(count);
        configSummary.textContent = `Ready to generate ${count} record${count === 1 ? "" : "s"}.`;
        recordBadge.textContent = `${count} record${count === 1 ? "" : "s"}`;
    }

    function getSelectedFieldDefinitions() {
        return FIELD_DEFINITIONS.filter(function (field) {
            return state.selectedFields.has(field.id);
        });
    }

    function ensureSelections() {
        if (state.selectedFields.size === 0) {
            setStatus("Select at least one field before generating data.", "warn");
            return false;
        }
        return true;
    }

    function determineSeed() {
        const count = Number.parseInt(recordCountInput.value, 10) || 1;
        const format = formatSelect.value;
        const fieldsKey = Array.from(state.selectedFields).sort().join("|");
        if (consistentSeedToggle.checked) {
            state.seed = hashSeed(`${fieldsKey}:${count}:${format}`);
        } else {
            state.seed = (Date.now() + Math.floor(Math.random() * 100000)) >>> 0;
        }
        seedStat.textContent = state.seed ? `0x${state.seed.toString(16)}` : "–";
    }

    function generateData() {
        clearStatus();
        if (!ensureSelections()) {
            return;
        }
        const start = performance.now();
        determineSeed();
        const rng = createRng(state.seed || 1);
        const count = Math.max(1, Math.min(1000, Number.parseInt(recordCountInput.value, 10) || 1));
        recordCountInput.value = String(count);

        const fields = getSelectedFieldDefinitions();
        const records = [];
        for (let i = 0; i < count; i += 1) {
            const row = {};
            const context = {
                index: i,
                rng,
                smartLorem: smartLoremToggle.checked
            };
            fields.forEach(function (field) {
                row[field.id] = field.generator(context);
            });
            records.push(row);
        }
        const duration = performance.now() - start;
        state.generationTime = duration;

        renderOutput(records, fields);
        updateStats(records, fields, duration);
        updateTips();
        setStatus(`Generated ${records.length} record${records.length === 1 ? "" : "s"} with ${fields.length} field${fields.length === 1 ? "" : "s"}.`, "success");
    }

    function renderOutput(records, fields) {
        state.lastFormat = formatSelect.value;
        if (state.lastFormat === "table") {
            renderTable(records, fields);
            const csv = convertToCsv(records, fields);
            state.lastOutput = csv;
            state.lastMime = "text/csv";
            state.lastFilename = "dummy-data.csv";
            tableOutput.classList.remove("hidden");
            codeOutput.classList.add("hidden");
        } else if (state.lastFormat === "json") {
            tableOutput.classList.add("hidden");
            const json = JSON.stringify(records, null, 2);
            state.lastOutput = json;
            state.lastMime = "application/json";
            state.lastFilename = "dummy-data.json";
            codeOutput.textContent = json;
            codeOutput.classList.remove("hidden");
        } else if (state.lastFormat === "csv") {
            tableOutput.classList.add("hidden");
            const csv = convertToCsv(records, fields);
            state.lastOutput = csv;
            state.lastMime = "text/csv";
            state.lastFilename = "dummy-data.csv";
            codeOutput.textContent = csv;
            codeOutput.classList.remove("hidden");
        } else {
            tableOutput.classList.add("hidden");
            const sql = convertToSql(records, fields);
            state.lastOutput = sql;
            state.lastMime = "text/plain";
            state.lastFilename = "dummy-data.sql";
            codeOutput.textContent = sql;
            codeOutput.classList.remove("hidden");
        }
        state.dataSize = new Blob([state.lastOutput]).size;
    }

    function renderTable(records, fields) {
        if (!records.length) {
            tableHead.innerHTML = "";
            tableBody.innerHTML = "";
            tableBody.innerHTML = "<tr><td>No data. Generate some records first.</td></tr>";
            return;
        }
        const headers = fields.map(field => `<th scope="col">${field.label}</th>`).join("");
        tableHead.innerHTML = `<tr>${headers}</tr>`;
        const rows = records.map(function (record) {
            const cells = fields.map(field => `<td>${escapeHtml(String(record[field.id]))}</td>`).join("");
            return `<tr>${cells}</tr>`;
        }).join("");
        tableBody.innerHTML = rows;
    }

    function convertToCsv(records, fields) {
        const includeHeaders = includeHeadersToggle.checked;
        const rows = [];
        if (includeHeaders) {
            rows.push(fields.map(field => escapeCsv(field.label)).join(","));
        }
        records.forEach(function (record) {
            rows.push(fields.map(field => escapeCsv(record[field.id])).join(","));
        });
        return rows.join("\n");
    }

    function convertToSql(records, fields) {
        const includeHeaders = includeHeadersToggle.checked;
        const tableName = includeHeaders ? normalizeSlug(pickFrom(COMPANY_WORDS, createRng(state.seed || 1))) || "mock_data" : "mock_data";
        const columns = fields.map(field => `[${field.id}]`).join(", ");
        const header = includeHeaders ? `CREATE TABLE IF NOT EXISTS [${tableName}] (\n  ${fields.map(field => `[${field.id}] TEXT`).join(",\n  ")}\n);\n\n` : "";
        const values = records.map(function (record) {
            const rowValues = fields.map(field => `'${escapeSql(record[field.id])}'`).join(", ");
            return `INSERT INTO [${tableName}] (${columns}) VALUES (${rowValues});`;
        }).join("\n");
        return `${header}${values}`.trim();
    }

    function escapeCsv(value) {
        const stringValue = value === null || value === undefined ? "" : String(value);
        if (/[",\n]/.test(stringValue)) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }

    function escapeSql(value) {
        if (value === null || value === undefined) {
            return "";
        }
        return String(value).replace(/'/g, "''");
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function updateStats(records, fields, duration) {
        timeStat.textContent = `${duration.toFixed(1)} ms`;
        sizeStat.textContent = formatBytes(state.dataSize || 0);
        selectionStat.textContent = fields.length ? String(fields.length) : "–";
    }

    function formatBytes(bytes) {
        if (!bytes) {
            return "0 B";
        }
        const units = ["B", "KB", "MB", "GB"];
        let index = 0;
        let value = bytes;
        while (value >= 1024 && index < units.length - 1) {
            value /= 1024;
            index += 1;
        }
        return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
    }

    function updateTips() {
        const baseTips = [
            "Enable deterministic seed when you need repeatable results for testing suites.",
            "Switch formats to JSON or SQL for direct database seeding or API contract mocks.",
            "Use smart Lorem snippets for paragraphs that feel more natural than single sentences."
        ];
        if (formatSelect.value === "sql") {
            baseTips.unshift("Review generated SQL before seeding production-like environments.");
        }
        if (!includeHeadersToggle.checked && formatSelect.value !== "table") {
            baseTips.unshift("Headers are disabled—ensure your importer supplies column names.");
        }
        if (recordCountInput.value > 250) {
            baseTips.unshift("Large datasets may take a moment—consider exporting to CSV for heavy records.");
        }
        tipsList.innerHTML = "";
        baseTips.slice(0, 4).forEach(function (tip) {
            const li = document.createElement("li");
            li.textContent = tip;
            tipsList.appendChild(li);
        });
    }

    function copyOutput() {
        if (!state.lastOutput) {
            setStatus("Generate data before copying.", "warn");
            return;
        }
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(state.lastOutput).then(function () {
                setStatus("Output copied to clipboard.", "success");
            }).catch(function () {
                setStatus("Clipboard access was blocked. Try again or copy manually.", "warn");
            });
        } else {
            setStatus("Clipboard API unavailable in this browser.", "warn");
        }
    }

    function downloadOutput() {
        if (!state.lastOutput) {
            setStatus("Generate data before downloading.", "warn");
            return;
        }
        const blob = new Blob([state.lastOutput], { type: `${state.lastMime};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = state.lastFilename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        setStatus(`Downloaded ${state.lastFilename}.`, "success");
    }

    function handleToggleAll() {
        const selectAll = state.selectedFields.size !== FIELD_DEFINITIONS.length;
        state.selectedFields.clear();
        if (selectAll) {
            FIELD_DEFINITIONS.forEach(function (field) {
                state.selectedFields.add(field.id);
            });
        }
        const checkboxes = fieldGroupsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = selectAll;
        });
        updateSelectionBadges();
    }

    function applyFieldFilter() {
        const term = fieldSearch.value.trim().toLowerCase();
        const groups = fieldGroupsContainer.querySelectorAll(".field-group");
        groups.forEach(function (group) {
            const labels = group.querySelectorAll("label");
            let visibleCount = 0;
            labels.forEach(function (label) {
                const text = label.textContent.toLowerCase();
                const matches = !term || text.includes(term);
                label.style.display = matches ? "flex" : "none";
                if (matches) {
                    visibleCount += 1;
                }
            });
            group.style.display = visibleCount ? "flex" : "none";
        });
    }

    function loadPreset() {
        state.selectedFields = new Set(["id", "fullName", "email", "company", "jobTitle", "country"]);
        recordCountInput.value = "20";
        formatSelect.value = "table";
        const checkboxes = fieldGroupsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = state.selectedFields.has(checkbox.value);
        });
        updateSelectionBadges();
        updateConfigSummary();
        setStatus("Starter preset loaded. Adjust fields if you need more variety.", "success");
    }

    function clearAll() {
        state.selectedFields.clear();
        const checkboxes = fieldGroupsContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = false;
        });
        recordCountInput.value = "25";
        formatSelect.value = "table";
        includeHeadersToggle.checked = true;
        consistentSeedToggle.checked = false;
        smartLoremToggle.checked = true;
        tableHead.innerHTML = "";
        tableBody.innerHTML = "";
        codeOutput.textContent = "";
        codeOutput.classList.add("hidden");
        tableOutput.classList.remove("hidden");
        state.lastOutput = "";
        state.dataSize = 0;
        updateSelectionBadges();
        updateConfigSummary();
        timeStat.textContent = "–";
        sizeStat.textContent = "–";
        seedStat.textContent = "–";
        selectionStat.textContent = "–";
        setStatus("Cleared configuration and output.", "success");
    }

    function bindEvents() {
        recordCountInput.addEventListener("change", function () {
            updateConfigSummary();
        });
        formatSelect.addEventListener("change", function () {
            if (state.lastOutput) {
                generateData();
            }
        });
        includeHeadersToggle.addEventListener("change", function () {
            if (state.lastOutput) {
                generateData();
            }
        });
        smartLoremToggle.addEventListener("change", function () {
            state.smartLorem = smartLoremToggle.checked;
            if (state.lastOutput) {
                generateData();
            }
        });

        loadPresetBtn.addEventListener("click", loadPreset);
        clearBtn.addEventListener("click", clearAll);
        generateBtn.addEventListener("click", generateData);
        copyBtn.addEventListener("click", copyOutput);
        downloadBtn.addEventListener("click", downloadOutput);
        toggleAllBtn.addEventListener("click", handleToggleAll);
        fieldSearch.addEventListener("input", applyFieldFilter);
    }

    function initialize() {
        renderFieldGroups();
        updateConfigSummary();
        applyFieldFilter();
        bindEvents();
        clearStatus();
    }

    initialize();
})();
