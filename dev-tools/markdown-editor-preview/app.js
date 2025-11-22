class MarkdownEditor {
    constructor() {
        this.editor = document.getElementById('markdown-editor');
        this.preview = document.getElementById('markdown-preview');
        this.container = document.getElementById('editor-container');
        this.isFullscreen = false;
        this.livePreviewEnabled = true;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updatePreview();
        this.updateStats();
        this.initializeToolbar();
    }

    setupEventListeners() {
        // Editor events
        this.editor.addEventListener('input', () => {
            this.updateStats();
            if (this.livePreviewEnabled) {
                this.debounceUpdatePreview();
            }
        });

        this.editor.addEventListener('scroll', () => this.syncScroll());
        this.editor.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Toolbar events
        document.getElementById('bold-btn').addEventListener('click', () => this.insertText('**', '**', 'Bold text'));
        document.getElementById('italic-btn').addEventListener('click', () => this.insertText('*', '*', 'Italic text'));
        document.getElementById('strikethrough-btn').addEventListener('click', () => this.insertText('~~', '~~', 'Strikethrough text'));
        document.getElementById('heading-btn').addEventListener('click', () => this.insertHeading());
        document.getElementById('link-btn').addEventListener('click', () => this.insertLink());
        document.getElementById('image-btn').addEventListener('click', () => this.insertImage());
        document.getElementById('code-btn').addEventListener('click', () => this.insertCodeBlock());
        document.getElementById('list-btn').addEventListener('click', () => this.insertList());
        document.getElementById('numbered-list-btn').addEventListener('click', () => this.insertNumberedList());
        document.getElementById('quote-btn').addEventListener('click', () => this.insertQuote());
        document.getElementById('table-btn').addEventListener('click', () => this.insertTable());
        document.getElementById('preview-toggle').addEventListener('click', () => this.togglePreview());
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());

        // Export events
        document.getElementById('export-html').addEventListener('click', () => this.exportHTML());
        document.getElementById('export-md').addEventListener('click', () => this.exportMarkdown());
        document.getElementById('copy-html').addEventListener('click', () => this.copyHTML());

        // Quick actions
        document.getElementById('clear-editor').addEventListener('click', () => this.clearEditor());
        document.getElementById('load-sample').addEventListener('click', () => this.loadSample());
        document.getElementById('import-file').addEventListener('click', () => this.importFile());
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileImport(e));

        // Settings
        document.getElementById('line-numbers').addEventListener('change', (e) => this.toggleLineNumbers(e.target.checked));
        document.getElementById('word-wrap').addEventListener('change', (e) => this.toggleWordWrap(e.target.checked));
        document.getElementById('live-preview').addEventListener('change', (e) => this.toggleLivePreview(e.target.checked));

        // Divider resizing
        this.setupDividerResize();
    }

    initializeToolbar() {
        // Set initial toolbar states
        document.getElementById('line-numbers').checked = true;
        document.getElementById('word-wrap').checked = true;
        document.getElementById('live-preview').checked = true;
    }

    debounceUpdatePreview() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.updatePreview(), 300);
    }

    updatePreview() {
        const markdown = this.editor.value;
        const html = this.parseMarkdown(markdown);
        this.preview.innerHTML = html;
    }

    parseMarkdown(markdown) {
        let html = markdown;

        // Escape HTML
        html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');

        // Strikethrough
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Inline code
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

        // Blockquotes
        html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

        // Horizontal rules
        html = html.replace(/^---$/gim, '<hr>');
        html = html.replace(/^\*\*\*$/gim, '<hr>');

        // Line breaks
        html = html.replace(/\n/g, '<br>');

        // Lists
        html = this.parseLists(html);

        // Tables
        html = this.parseTables(html);

        return html;
    }

    parseLists(html) {
        // Unordered lists
        const unorderedItems = html.match(/^[\s]*[-\*\+] .+$/gm);
        if (unorderedItems) {
            const listHtml = unorderedItems.map(item => {
                const text = item.replace(/^[\s]*[-\*\+] /, '');
                return `<li>${text}</li>`;
            }).join('');
            html = html.replace(/^[\s]*[-\*\+] .+$/gm, '').replace(/(<li>.*<\/li>)/s, `<ul>$1</ul>`);
            if (listHtml) {
                html = html.replace(/(<br>)*$/, `<ul>${listHtml}</ul>`);
            }
        }

        // Ordered lists
        const orderedItems = html.match(/^[\s]*\d+\. .+$/gm);
        if (orderedItems) {
            const listHtml = orderedItems.map(item => {
                const text = item.replace(/^[\s]*\d+\. /, '');
                return `<li>${text}</li>`;
            }).join('');
            html = html.replace(/^[\s]*\d+\. .+$/gm, '');
            if (listHtml) {
                html = html.replace(/(<br>)*$/, `<ol>${listHtml}</ol>`);
            }
        }

        return html;
    }

    parseTables(html) {
        const tableRegex = /(\|.*\|[\r\n]+)+/g;
        const tables = html.match(tableRegex);
        
        if (tables) {
            tables.forEach(table => {
                const rows = table.trim().split(/[\r\n]+/);
                let tableHtml = '<table>';
                
                rows.forEach((row, index) => {
                    if (index === 1 && row.match(/^\|[\s\-\|]+\|$/)) {
                        return; // Skip separator row
                    }
                    
                    const cells = row.split('|').slice(1, -1);
                    const tag = index === 0 ? 'th' : 'td';
                    const rowHtml = cells.map(cell => `<${tag}>${cell.trim()}</${tag}>`).join('');
                    tableHtml += `<tr>${rowHtml}</tr>`;
                });
                
                tableHtml += '</table>';
                html = html.replace(table, tableHtml);
            });
        }
        
        return html;
    }

    updateStats() {
        const text = this.editor.value;
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lineCount = text.split('\n').length;

        document.getElementById('char-count').textContent = `${charCount} characters`;
        document.getElementById('word-count').textContent = `${wordCount} words`;
        document.getElementById('line-count').textContent = `${lineCount} lines`;
    }

    insertText(before, after, placeholder) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const selectedText = this.editor.value.substring(start, end);
        const text = selectedText || placeholder;
        const newText = before + text + after;
        
        this.editor.setRangeText(newText, start, end, 'select');
        this.editor.focus();
        this.updatePreview();
    }

    insertHeading() {
        const start = this.editor.selectionStart;
        const lineStart = this.editor.value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = this.editor.value.indexOf('\n', start);
        const line = this.editor.value.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
        
        let newLine;
        if (line.startsWith('### ')) {
            newLine = line.replace(/^### /, '#### ');
        } else if (line.startsWith('## ')) {
            newLine = line.replace(/^## /, '### ');
        } else if (line.startsWith('# ')) {
            newLine = line.replace(/^# /, '## ');
        } else {
            newLine = '# ' + line;
        }
        
        this.editor.setRangeText(newLine, lineStart, lineEnd === -1 ? undefined : lineEnd);
        this.editor.focus();
        this.updatePreview();
    }

    insertLink() {
        const url = prompt('Enter URL:');
        if (url) {
            this.insertText('[', `](${url})`, 'Link text');
        }
    }

    insertImage() {
        const url = prompt('Enter image URL:');
        if (url) {
            this.insertText('![', `](${url})`, 'Alt text');
        }
    }

    insertCodeBlock() {
        const language = prompt('Enter language (optional):') || '';
        this.insertText(`\n\`\`\`${language}\n`, '\n```\n', 'Your code here');
    }

    insertList() {
        this.insertAtLineStart('- ', 'List item');
    }

    insertNumberedList() {
        this.insertAtLineStart('1. ', 'List item');
    }

    insertQuote() {
        this.insertAtLineStart('> ', 'Quote text');
    }

    insertTable() {
        const table = '\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n';
        this.insertText(table, '', '');
    }

    insertAtLineStart(prefix, placeholder) {
        const start = this.editor.selectionStart;
        const lineStart = this.editor.value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = this.editor.value.indexOf('\n', start);
        const line = this.editor.value.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
        
        const newLine = line.trim() ? prefix + line : prefix + placeholder;
        this.editor.setRangeText(newLine, lineStart, lineEnd === -1 ? undefined : lineEnd);
        this.editor.focus();
        this.updatePreview();
    }

    togglePreview() {
        const button = document.getElementById('preview-toggle');
        const previewPanel = document.getElementById('preview-panel');
        
        if (this.container.classList.contains('preview-only')) {
            this.container.classList.remove('preview-only');
            button.textContent = '👁️';
        } else if (this.container.classList.contains('editor-only')) {
            this.container.classList.remove('editor-only');
            this.container.classList.add('preview-only');
            button.textContent = '📝';
        } else {
            this.container.classList.add('editor-only');
            button.textContent = '👁️';
        }
    }

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        this.container.classList.toggle('fullscreen', this.isFullscreen);
        
        const button = document.getElementById('fullscreen-btn');
        button.textContent = this.isFullscreen ? '⊗' : '⛶';
        
        if (this.isFullscreen) {
            document.addEventListener('keydown', this.handleEscapeKey);
        } else {
            document.removeEventListener('keydown', this.handleEscapeKey);
        }
    }

    handleEscapeKey = (e) => {
        if (e.key === 'Escape' && this.isFullscreen) {
            this.toggleFullscreen();
        }
    }

    toggleLineNumbers(enabled) {
        this.editor.classList.toggle('line-numbers', enabled);
    }

    toggleWordWrap(enabled) {
        this.editor.classList.toggle('no-wrap', !enabled);
    }

    toggleLivePreview(enabled) {
        this.livePreviewEnabled = enabled;
        if (enabled) {
            this.updatePreview();
        }
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    this.insertText('**', '**', 'Bold text');
                    break;
                case 'i':
                    e.preventDefault();
                    this.insertText('*', '*', 'Italic text');
                    break;
                case 'k':
                    e.preventDefault();
                    this.insertLink();
                    break;
            }
        }
    }

    syncScroll() {
        const scrollPercentage = this.editor.scrollTop / (this.editor.scrollHeight - this.editor.clientHeight);
        this.preview.scrollTop = scrollPercentage * (this.preview.scrollHeight - this.preview.clientHeight);
    }

    setupDividerResize() {
        const divider = document.getElementById('divider');
        let isResizing = false;

        divider.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        const handleMouseMove = (e) => {
            if (!isResizing) return;
            
            const containerRect = this.container.getBoundingClientRect();
            const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            
            if (percentage > 10 && percentage < 90) {
                const editorPanel = this.container.querySelector('.editor-panel');
                const previewPanel = this.container.querySelector('.preview-panel');
                
                editorPanel.style.flex = `0 0 ${percentage}%`;
                previewPanel.style.flex = `0 0 ${100 - percentage}%`;
            }
        };

        const handleMouseUp = () => {
            isResizing = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }

    exportHTML() {
        const html = this.generateFullHTML();
        this.downloadFile(html, 'markdown-export.html', 'text/html');
    }

    exportMarkdown() {
        const markdown = this.editor.value;
        this.downloadFile(markdown, 'markdown-export.md', 'text/markdown');
    }

    copyHTML() {
        const html = this.preview.innerHTML;
        navigator.clipboard.writeText(html).then(() => {
            this.showMessage('HTML copied to clipboard!', 'success');
        });
    }

    generateFullHTML() {
        const content = this.preview.innerHTML;
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
        h1, h2, h3, h4, h5, h6 { color: #333; }
        code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;
    }

    clearEditor() {
        if (confirm('Are you sure you want to clear all content?')) {
            this.editor.value = '';
            this.updatePreview();
            this.updateStats();
        }
    }

    loadSample() {
        const sample = `# Sample Markdown Document

## Introduction
This is a sample markdown document to demonstrate the features of our editor.

## Text Formatting
You can make text **bold** or *italic* or even ~~strikethrough~~.

## Lists
### Unordered List
- Item 1
- Item 2
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item

## Code
Inline \`code\` looks like this.

\`\`\`javascript
// Code block
function hello() {
    console.log("Hello, World!");
}
\`\`\`

## Links and Images
[Visit our website](https://example.com)

![Sample Image](https://via.placeholder.com/400x200)

## Blockquotes
> This is a blockquote.
> It can span multiple lines.

## Tables
| Feature | Status | Notes |
|---------|--------|-------|
| Markdown Support | ✅ | Full support |
| Live Preview | ✅ | Real-time |
| Export | ✅ | HTML & MD |

---

That's all for this sample document!`;

        this.editor.value = sample;
        this.updatePreview();
        this.updateStats();
    }

    importFile() {
        document.getElementById('file-input').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.editor.value = e.target.result;
                this.updatePreview();
                this.updateStats();
                this.showMessage('File imported successfully!', 'success');
            };
            reader.readAsText(file);
        }
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showMessage('File downloaded successfully!', 'success');
    }

    showMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 8px;
            color: white;
            background: ${type === 'success' ? '#059669' : '#dc2626'};
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownEditor();
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
