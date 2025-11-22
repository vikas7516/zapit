(function () {
    "use strict";

    const MAX_LENGTH = 200000;
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));

    const markdownInput = $("#markdownInput");
    const livePreviewToggle = $("#livePreviewToggle");
    const sanitizeToggle = $("#sanitizeToggle");

    const convertBtn = $("#convertBtn");
    const copyMarkdownBtn = $("#copyMarkdownBtn");
    const copyHtmlBtn = $("#copyHtmlBtn");
    const downloadHtmlBtn = $("#downloadHtmlBtn");
    const clearBtn = $("#clearBtn");
    const loadSampleBtn = $("#loadSampleBtn");

    const renderedPreview = $("#renderedPreview");
    const rawPreview = $("#rawPreview");
    const tabButtons = $$(".tab-btn");

    const headingCountEl = $("#headingCount");
    const linkCountEl = $("#linkCount");
    const imageCountEl = $("#imageCount");
    const wordCountEl = $("#wordCount");
    const charCountEl = $("#charCount");

    const statusBanner = $("#statusBanner");

    let activePreview = "renderedPreview";
    let lastResult = {
        markdown: "",
        html: "",
        sanitized: "",
        stats: {
            headings: 0,
            links: 0,
            images: 0,
            words: 0,
            chars: 0
        }
    };

    function escapeHtml(value) {
        if (value == null) return "";
        return value.replace(/[&<>\"]/g, (char) => {
            switch (char) {
                case "&":
                    return "&amp;";
                case "<":
                    return "&lt;";
                case ">":
                    return "&gt;";
                case '"':
                    return "&quot;";
                default:
                    return char;
            }
        });
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/'/g, "&#39;");
    }

    function applyInline(text) {
        let escaped = escapeHtml(text);
        const codeMap = [];

        escaped = escaped.replace(/`([^`]+)`/g, (match, code) => {
            const index = codeMap.length;
            codeMap.push(`<code>${escapeHtml(code)}</code>`);
            return `@@CODE${index}@@`;
        });

        escaped = escaped.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (match, alt, url, title) => {
            const safeUrl = escapeAttribute(url.trim());
            const safeAlt = escapeAttribute(alt || "");
            const safeTitle = title ? ` title="${escapeAttribute(title)}"` : "";
            return `<img src="${safeUrl}" alt="${safeAlt}" loading="lazy"${safeTitle} />`;
        });

        escaped = escaped.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)/g, (match, label, href, title) => {
            const safeHref = escapeAttribute(href.trim());
            const safeTitle = title ? ` title="${escapeAttribute(title)}"` : "";
            return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer"${safeTitle}>${label}</a>`;
        });

        escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
        escaped = escaped.replace(/__([^_]+)__/g, "<strong>$1</strong>");
        escaped = escaped.replace(/~~([^~]+)~~/g, "<del>$1</del>");

        escaped = escaped.replace(/(^|[\s\(\[{>])\*([^*]+?)\*(?=[\s\)\]}<]|$)/g, (match, prefix, content) => `${prefix}<em>${content}</em>`);
        escaped = escaped.replace(/(^|[\s\(\[{>])_([^_]+?)_(?=[\s\)\]}<]|$)/g, (match, prefix, content) => `${prefix}<em>${content}</em>`);

        escaped = escaped.replace(/\\([*_`~\\])/g, "$1");

        return escaped.replace(/@@CODE(\d+)@@/g, (match, index) => codeMap[Number(index)] || "");
    }

    function convertMarkdown(markdown) {
        if (!markdown.trim()) {
            return "";
        }

        const lines = markdown.replace(/\r\n/g, "\n").split("\n");
        const html = [];
        let inCodeBlock = false;
        let codeLang = "";
        let codeBuffer = [];
        let inUnorderedList = false;
        let inOrderedList = false;
        let currentParagraph = [];

        function closeLists() {
            if (inUnorderedList) {
                html.push("</ul>");
                inUnorderedList = false;
            }
            if (inOrderedList) {
                html.push("</ol>");
                inOrderedList = false;
            }
        }

        function flushParagraph() {
            if (currentParagraph.length) {
                const paragraph = currentParagraph.join(" ").trim();
                if (paragraph) {
                    html.push(`<p>${applyInline(paragraph)}</p>`);
                }
                currentParagraph = [];
            }
        }

        lines.forEach((line) => {
            const trimmed = line.trim();

            if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
                const fence = trimmed.slice(0, 3);
                if (!inCodeBlock) {
                    flushParagraph();
                    closeLists();
                    inCodeBlock = true;
                    codeLang = trimmed.slice(3).trim();
                    codeBuffer = [];
                } else {
                    const codeContent = codeBuffer.join("\n");
                    const escapedCode = escapeHtml(codeContent);
                    const langClass = codeLang ? ` class="language-${escapeAttribute(codeLang)}"` : "";
                    html.push(`<pre><code${langClass}>${escapedCode}</code></pre>`);
                    inCodeBlock = false;
                    codeLang = "";
                    codeBuffer = [];
                }
                return;
            }

            if (inCodeBlock) {
                codeBuffer.push(line);
                return;
            }

            if (!trimmed) {
                flushParagraph();
                closeLists();
                return;
            }

            const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const content = headingMatch[2].trim();
                flushParagraph();
                closeLists();
                html.push(`<h${level}>${applyInline(content)}</h${level}>`);
                return;
            }

            if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
                flushParagraph();
                closeLists();
                html.push("<hr />");
                return;
            }

            const blockquoteMatch = trimmed.match(/^>\s?(.*)$/);
            if (blockquoteMatch) {
                flushParagraph();
                closeLists();
                html.push(`<blockquote>${applyInline(blockquoteMatch[1])}</blockquote>`);
                return;
            }

            const unorderedMatch = line.match(/^\s*[-*+]\s+(.*)$/);
            if (unorderedMatch) {
                flushParagraph();
                if (!inUnorderedList) {
                    closeLists();
                    inUnorderedList = true;
                    html.push("<ul>");
                }
                html.push(`<li>${applyInline(unorderedMatch[1])}</li>`);
                return;
            }

            const orderedMatch = line.match(/^\s*\d+\.\s+(.*)$/);
            if (orderedMatch) {
                flushParagraph();
                if (!inOrderedList) {
                    closeLists();
                    inOrderedList = true;
                    html.push("<ol>");
                }
                html.push(`<li>${applyInline(orderedMatch[1])}</li>`);
                return;
            }

            currentParagraph.push(line.trim());
        });

        flushParagraph();
        closeLists();

        if (inCodeBlock) {
            const codeContent = codeBuffer.join("\n");
            const escapedCode = escapeHtml(codeContent);
            const langClass = codeLang ? ` class="language-${escapeAttribute(codeLang)}"` : "";
            html.push(`<pre><code${langClass}>${escapedCode}</code></pre>`);
        }

        return html.join("\n");
    }

    function sanitizeHtml(html) {
        if (!html) {
            return "";
        }
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
            const container = doc.body;
            if (!container) {
                return html;
            }

            container.querySelectorAll("script, style, iframe, object, embed, link, meta").forEach((el) => el.remove());

            container.querySelectorAll("*").forEach((el) => {
                Array.from(el.attributes).forEach((attr) => {
                    const name = attr.name.toLowerCase();
                    const value = attr.value;
                    if (name === "style" || name.startsWith("on")) {
                        el.removeAttribute(attr.name);
                        return;
                    }
                    if ((name === "href" || name === "src") && value && value.trim().toLowerCase().startsWith("javascript:")) {
                        el.removeAttribute(attr.name);
                    }
                });

                if (el.tagName === "A") {
                    if (!el.hasAttribute("target")) {
                        el.setAttribute("target", "_blank");
                    }
                    if (!el.hasAttribute("rel")) {
                        el.setAttribute("rel", "noopener noreferrer");
                    }
                }
            });

            return container.innerHTML;
        } catch (error) {
            return html;
        }
    }

    function computeStats(html) {
        if (!html) {
            return {
                headings: 0,
                links: 0,
                images: 0,
                words: 0,
                chars: 0
            };
        }
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
            const container = doc.body;
            const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6").length;
            const links = container.querySelectorAll("a").length;
            const images = container.querySelectorAll("img").length;
            const textContent = (container.textContent || "").trim();
            const words = textContent ? textContent.split(/\s+/).filter(Boolean).length : 0;
            const chars = textContent.length;
            return { headings, links, images, words, chars };
        } catch (error) {
            return {
                headings: 0,
                links: 0,
                images: 0,
                words: 0,
                chars: 0
            };
        }
    }

    function updateStats(stats) {
        headingCountEl.textContent = stats.headings.toString();
        linkCountEl.textContent = stats.links.toString();
        imageCountEl.textContent = stats.images.toString();
        wordCountEl.textContent = stats.words.toString();
        charCountEl.textContent = stats.chars.toString();
    }

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

    function showStatus(message, tone) {
        statusBanner.textContent = message;
        statusBanner.classList.remove("hidden", "success", "warn", "error");
        if (tone) {
            statusBanner.classList.add(tone);
        }
        clearTimeout(showStatus._timer);
        showStatus._timer = setTimeout(() => {
            statusBanner.classList.add("hidden");
        }, 4000);
    }

    function updatePreview(force = false) {
        const markdown = markdownInput.value;

        if (!force && !livePreviewToggle.checked) {
            return;
        }

        if (markdown.length > MAX_LENGTH) {
            showStatus(`Input exceeds the ${MAX_LENGTH.toLocaleString()} character limit.`, "error");
            return;
        }

        if (!markdown.trim()) {
            renderedPreview.innerHTML = "";
            rawPreview.textContent = "";
            const emptyStats = computeStats("");
            updateStats(emptyStats);
            lastResult = {
                markdown: "",
                html: "",
                sanitized: "",
                stats: emptyStats
            };
            showPreview(activePreview);
            return;
        }

        const html = convertMarkdown(markdown);
        const sanitized = sanitizeToggle.checked ? sanitizeHtml(html) : html;

        renderedPreview.innerHTML = sanitized;
        rawPreview.textContent = sanitized;

        const stats = computeStats(sanitized);
        updateStats(stats);

        lastResult = {
            markdown,
            html,
            sanitized,
            stats
        };

        if (force) {
            const tone = sanitizeToggle.checked ? "success" : "warn";
            const message = sanitizeToggle.checked ? "Converted Markdown to sanitized HTML." : "Converted Markdown. Sanitization is off—review output carefully.";
            showStatus(message, tone);
        } else if (!sanitizeToggle.checked) {
            showStatus("Sanitization is disabled. Only use this for trusted Markdown.", "warn");
        }

        showPreview(activePreview);
    }

    function copyToClipboard(text, successMessage) {
        if (!text) {
            showStatus("Nothing to copy yet. Convert some Markdown first.", "warn");
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard
                .writeText(text)
                .then(() => showStatus(successMessage, "success"))
                .catch(() => showStatus("Clipboard permissions blocked.", "error"));
            return;
        }
        const temp = document.createElement("textarea");
        temp.value = text;
        temp.setAttribute("readonly", "");
        temp.style.position = "absolute";
        temp.style.left = "-9999px";
        document.body.appendChild(temp);
        temp.select();
        try {
            document.execCommand("copy");
            showStatus(successMessage, "success");
        } catch (error) {
            showStatus("Clipboard copy is not supported in this browser.", "error");
        }
        document.body.removeChild(temp);
    }

    function copyHtml() {
        copyToClipboard(lastResult.sanitized, "HTML copied to clipboard.");
    }

    function copyMarkdown() {
        const markdown = markdownInput.value.trim();
        if (!markdown) {
            showStatus("Nothing to copy yet. Add some Markdown first.", "warn");
            return;
        }
        copyToClipboard(markdownInput.value, "Markdown copied to clipboard.");
    }

    function downloadHtml() {
        if (!lastResult.sanitized) {
            showStatus("Generate some HTML before downloading.", "warn");
            return;
        }
        const doc = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8" />\n<title>Markdown Export</title>\n</head>\n<body>\n${lastResult.sanitized}\n</body>\n</html>`;
        const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "markdown-conversion.html";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1500);
        showStatus("HTML download ready.", "success");
    }

    function clearAll() {
        markdownInput.value = "";
        lastResult = {
            markdown: "",
            html: "",
            sanitized: "",
            stats: {
                headings: 0,
                links: 0,
                images: 0,
                words: 0,
                chars: 0
            }
        };
        renderedPreview.innerHTML = "";
        rawPreview.textContent = "";
        updateStats(lastResult.stats);
        showPreview(activePreview);
        showStatus("Cleared the current Markdown and HTML.", "warn");
        markdownInput.focus();
    }

    function loadSample() {
        const sample = `# Markdown Starter\n\nConvert **bold**, *italic*, and ~~strikethrough~~ text with ease.\n\n## Lists\n- Fast, private conversion\n- Safe sanitization\n- Works entirely offline\n\n1. Paste Markdown\n2. Review HTML\n3. Copy or download\n\n> Productivity tip: keep the sanitize option enabled for public-facing content.\n\n\`\`\`js\nfunction greet(name) {\n  return \`Hello, ${name}!\`;\n}\n\`\`\`\n\n![Zapit Tools](https://via.placeholder.com/120x60 "Placeholder image")\n\nNeed a link? [Visit Zapit](https://zapit.me).`;
        markdownInput.value = sample;
        updatePreview(true);
        markdownInput.focus();
        markdownInput.setSelectionRange(markdownInput.value.length, markdownInput.value.length);
    }

    function handleTabClick(event) {
        const button = event.currentTarget;
        const targetId = button.dataset.target;
        if (button.classList.contains("active")) {
            return;
        }
        tabButtons.forEach((btn) => {
            const isActive = btn === button;
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-selected", isActive ? "true" : "false");
        });
        showPreview(targetId);
        if (targetId === "rawPreview") {
            rawPreview.focus();
        }
    }

    function bindEvents() {
        markdownInput.addEventListener("input", () => {
            if (livePreviewToggle.checked) {
                updatePreview();
            }
        });

        convertBtn.addEventListener("click", () => updatePreview(true));
        copyMarkdownBtn.addEventListener("click", copyMarkdown);
        copyHtmlBtn.addEventListener("click", copyHtml);
        downloadHtmlBtn.addEventListener("click", downloadHtml);
        clearBtn.addEventListener("click", clearAll);
        loadSampleBtn.addEventListener("click", loadSample);

        sanitizeToggle.addEventListener("change", () => {
            if (lastResult.markdown) {
                updatePreview(true);
            }
        });

        livePreviewToggle.addEventListener("change", () => {
            if (livePreviewToggle.checked && markdownInput.value.trim()) {
                updatePreview(true);
            }
        });

        tabButtons.forEach((btn) => btn.addEventListener("click", handleTabClick));
    }

    function init() {
        bindEvents();
        updatePreview(true);
        showPreview(activePreview);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
