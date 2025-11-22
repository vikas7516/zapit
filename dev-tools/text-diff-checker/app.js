// Text Diff Checker JavaScript

class TextDiffChecker {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.updateCharacterCounts();
    }

    initializeElements() {
        this.text1Input = document.getElementById('text1');
        this.text2Input = document.getElementById('text2');
        this.compareBtn = document.getElementById('compareBtn');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.diffDisplay = document.getElementById('diffDisplay');
        this.unifiedDiff = document.getElementById('unifiedDiff');
        this.charCount1 = document.getElementById('charCount1');
        this.charCount2 = document.getElementById('charCount2');
        this.addedCount = document.getElementById('addedCount');
        this.deletedCount = document.getElementById('deletedCount');
        this.modifiedCount = document.getElementById('modifiedCount');
        this.leftContent = document.getElementById('leftContent');
        this.rightContent = document.getElementById('rightContent');
        this.unifiedContent = document.getElementById('unifiedContent');
        
        // Options
        this.ignoreWhitespace = document.getElementById('ignoreWhitespace');
        this.ignoreCase = document.getElementById('ignoreCase');
        this.showLineNumbers = document.getElementById('showLineNumbers');
        this.highlightWords = document.getElementById('highlightWords');
    }

    bindEvents() {
        this.compareBtn.addEventListener('click', () => this.performComparison());
        this.text1Input.addEventListener('input', () => this.updateCharacterCounts());
        this.text2Input.addEventListener('input', () => this.updateCharacterCounts());
        
        // File loading buttons
        document.getElementById('loadFile1').addEventListener('click', () => this.loadFile(1));
        document.getElementById('loadFile2').addEventListener('click', () => this.loadFile(2));
        
        // Clear buttons
        document.getElementById('clearText1').addEventListener('click', () => {
            this.text1Input.value = '';
            this.updateCharacterCounts();
        });
        document.getElementById('clearText2').addEventListener('click', () => {
            this.text2Input.value = '';
            this.updateCharacterCounts();
        });
        
        // Sample buttons
        document.getElementById('sampleText1').addEventListener('click', () => this.loadSampleText(1));
        document.getElementById('sampleText2').addEventListener('click', () => this.loadSampleText(2));
        
        // Export buttons
        document.getElementById('exportDiff').addEventListener('click', () => this.exportDiff());
        document.getElementById('exportUnified').addEventListener('click', () => this.exportUnified());
        
        // Real-time comparison option
        document.getElementById('realTimeComparison').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.text1Input.addEventListener('input', this.debounce(() => this.performComparison(), 500));
                this.text2Input.addEventListener('input', this.debounce(() => this.performComparison(), 500));
            }
        });
    }

    updateCharacterCounts() {
        const text1Length = this.text1Input.value.length;
        const text2Length = this.text2Input.value.length;
        
        this.charCount1.textContent = `${text1Length.toLocaleString()} chars`;
        this.charCount2.textContent = `${text2Length.toLocaleString()} chars`;
    }

    loadFile(inputNumber) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.js,.html,.css,.json,.xml,.csv,.log';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (inputNumber === 1) {
                        this.text1Input.value = e.target.result;
                    } else {
                        this.text2Input.value = e.target.result;
                    }
                    this.updateCharacterCounts();
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    loadSampleText(inputNumber) {
        const sample1 = `function calculateSum(a, b) {
    return a + b;
}

const numbers = [1, 2, 3, 4, 5];
let result = 0;

for (let i = 0; i < numbers.length; i++) {
    result += numbers[i];
}

console.log('Sum:', result);`;

        const sample2 = `function calculateSum(numbers) {
    return numbers.reduce((sum, num) => sum + num, 0);
}

const numbers = [1, 2, 3, 4, 5, 6];
const result = calculateSum(numbers);

console.log('Total sum:', result);
console.log('Average:', result / numbers.length);`;

        if (inputNumber === 1) {
            this.text1Input.value = sample1;
        } else {
            this.text2Input.value = sample2;
        }
        this.updateCharacterCounts();
    }

    performComparison() {
        const text1 = this.text1Input.value;
        const text2 = this.text2Input.value;
        
        if (!text1.trim() && !text2.trim()) {
            this.resultsContainer.classList.remove('visible');
            return;
        }
        
        const options = {
            ignoreWhitespace: this.ignoreWhitespace.checked,
            ignoreCase: this.ignoreCase.checked,
            showLineNumbers: this.showLineNumbers.checked,
            highlightWords: this.highlightWords.checked
        };
        
        const diffResult = this.computeDiff(text1, text2, options);
        this.displayResults(diffResult, options);
        this.resultsContainer.classList.add('visible');
    }

    computeDiff(text1, text2, options) {
        let processedText1 = text1;
        let processedText2 = text2;
        
        if (options.ignoreCase) {
            processedText1 = text1.toLowerCase();
            processedText2 = text2.toLowerCase();
        }
        
        const lines1 = processedText1.split('\n');
        const lines2 = processedText2.split('\n');
        
        const originalLines1 = text1.split('\n');
        const originalLines2 = text2.split('\n');
        
        const diff = this.computeLineDiff(lines1, lines2, originalLines1, originalLines2, options);
        
        return {
            lines1: originalLines1,
            lines2: originalLines2,
            diff: diff,
            stats: this.calculateStats(diff)
        };
    }

    computeLineDiff(lines1, lines2, originalLines1, originalLines2, options) {
        const diff = [];
        const matrix = [];
        
        // Initialize matrix for LCS algorithm
        for (let i = 0; i <= lines1.length; i++) {
            matrix[i] = [];
            for (let j = 0; j <= lines2.length; j++) {
                matrix[i][j] = 0;
            }
        }
        
        // Fill matrix using LCS algorithm
        for (let i = 1; i <= lines1.length; i++) {
            for (let j = 1; j <= lines2.length; j++) {
                if (this.linesEqual(lines1[i-1], lines2[j-1], options)) {
                    matrix[i][j] = matrix[i-1][j-1] + 1;
                } else {
                    matrix[i][j] = Math.max(matrix[i-1][j], matrix[i][j-1]);
                }
            }
        }
        
        // Backtrack to find differences
        let i = lines1.length;
        let j = lines2.length;
        
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && this.linesEqual(lines1[i-1], lines2[j-1], options)) {
                diff.unshift({
                    type: 'unchanged',
                    line1: i - 1,
                    line2: j - 1,
                    content1: originalLines1[i-1],
                    content2: originalLines2[j-1]
                });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || matrix[i][j-1] >= matrix[i-1][j])) {
                diff.unshift({
                    type: 'added',
                    line1: null,
                    line2: j - 1,
                    content1: null,
                    content2: originalLines2[j-1]
                });
                j--;
            } else if (i > 0) {
                diff.unshift({
                    type: 'deleted',
                    line1: i - 1,
                    line2: null,
                    content1: originalLines1[i-1],
                    content2: null
                });
                i--;
            }
        }
        
        return this.combineModifications(diff, options);
    }

    linesEqual(line1, line2, options) {
        if (options.ignoreWhitespace) {
            line1 = line1.replace(/\s+/g, ' ').trim();
            line2 = line2.replace(/\s+/g, ' ').trim();
        }
        return line1 === line2;
    }

    combineModifications(diff, options) {
        const result = [];
        let i = 0;
        
        while (i < diff.length) {
            const current = diff[i];
            
            if (current.type === 'deleted' && i + 1 < diff.length && diff[i + 1].type === 'added') {
                // Combine deleted and added lines as modified
                result.push({
                    type: 'modified',
                    line1: current.line1,
                    line2: diff[i + 1].line2,
                    content1: current.content1,
                    content2: diff[i + 1].content2,
                    wordDiff: options.highlightWords ? this.computeWordDiff(current.content1, diff[i + 1].content2) : null
                });
                i += 2;
            } else {
                result.push(current);
                i++;
            }
        }
        
        return result;
    }

    computeWordDiff(text1, text2) {
        const words1 = text1.split(/(\s+)/);
        const words2 = text2.split(/(\s+)/);
        
        const diff = [];
        let i = 0, j = 0;
        
        while (i < words1.length || j < words2.length) {
            if (i >= words1.length) {
                diff.push({ type: 'added', content: words2[j] });
                j++;
            } else if (j >= words2.length) {
                diff.push({ type: 'deleted', content: words1[i] });
                i++;
            } else if (words1[i] === words2[j]) {
                diff.push({ type: 'unchanged', content: words1[i] });
                i++;
                j++;
            } else {
                // Find next common word
                let nextCommon = -1;
                for (let k = j + 1; k < words2.length && nextCommon === -1; k++) {
                    if (words1[i] === words2[k]) {
                        nextCommon = k;
                    }
                }
                
                if (nextCommon !== -1) {
                    // Add words until common word
                    while (j < nextCommon) {
                        diff.push({ type: 'added', content: words2[j] });
                        j++;
                    }
                } else {
                    diff.push({ type: 'deleted', content: words1[i] });
                    i++;
                }
            }
        }
        
        return diff;
    }

    calculateStats(diff) {
        const stats = { added: 0, deleted: 0, modified: 0 };
        
        diff.forEach(item => {
            if (item.type === 'added') stats.added++;
            else if (item.type === 'deleted') stats.deleted++;
            else if (item.type === 'modified') stats.modified++;
        });
        
        return stats;
    }

    displayResults(diffResult, options) {
        this.updateStats(diffResult.stats);
        this.displaySideBySide(diffResult, options);
        this.displayUnified(diffResult, options);
    }

    updateStats(stats) {
        this.addedCount.textContent = stats.added;
        this.deletedCount.textContent = stats.deleted;
        this.modifiedCount.textContent = stats.modified;
    }

    displaySideBySide(diffResult, options) {
        let leftHTML = '';
        let rightHTML = '';
        let leftLineNum = 1;
        let rightLineNum = 1;
        
        diffResult.diff.forEach(item => {
            const lineNumLeft = options.showLineNumbers ? `<span class="line-number">${item.line1 !== null ? leftLineNum : ''}</span>` : '';
            const lineNumRight = options.showLineNumbers ? `<span class="line-number">${item.line2 !== null ? rightLineNum : ''}</span>` : '';
            
            switch (item.type) {
                case 'unchanged':
                    leftHTML += `<div class="diff-line unchanged">${lineNumLeft}<span class="line-content">${this.escapeHtml(item.content1)}</span></div>`;
                    rightHTML += `<div class="diff-line unchanged">${lineNumRight}<span class="line-content">${this.escapeHtml(item.content2)}</span></div>`;
                    leftLineNum++;
                    rightLineNum++;
                    break;
                    
                case 'deleted':
                    leftHTML += `<div class="diff-line deleted">${lineNumLeft}<span class="line-content">${this.escapeHtml(item.content1)}</span></div>`;
                    rightHTML += `<div class="diff-line"></div>`;
                    leftLineNum++;
                    break;
                    
                case 'added':
                    leftHTML += `<div class="diff-line"></div>`;
                    rightHTML += `<div class="diff-line added">${lineNumRight}<span class="line-content">${this.escapeHtml(item.content2)}</span></div>`;
                    rightLineNum++;
                    break;
                    
                case 'modified':
                    const leftContent = item.wordDiff ? this.renderWordDiff(item.wordDiff, 'left') : this.escapeHtml(item.content1);
                    const rightContent = item.wordDiff ? this.renderWordDiff(item.wordDiff, 'right') : this.escapeHtml(item.content2);
                    
                    leftHTML += `<div class="diff-line modified">${lineNumLeft}<span class="line-content">${leftContent}</span></div>`;
                    rightHTML += `<div class="diff-line modified">${lineNumRight}<span class="line-content">${rightContent}</span></div>`;
                    leftLineNum++;
                    rightLineNum++;
                    break;
            }
        });
        
        this.leftContent.innerHTML = leftHTML;
        this.rightContent.innerHTML = rightHTML;
    }

    renderWordDiff(wordDiff, side) {
        let html = '';
        
        wordDiff.forEach(word => {
            if (side === 'left') {
                if (word.type === 'deleted') {
                    html += `<span class="diff-change deleted">${this.escapeHtml(word.content)}</span>`;
                } else if (word.type === 'unchanged') {
                    html += this.escapeHtml(word.content);
                }
            } else {
                if (word.type === 'added') {
                    html += `<span class="diff-change added">${this.escapeHtml(word.content)}</span>`;
                } else if (word.type === 'unchanged') {
                    html += this.escapeHtml(word.content);
                }
            }
        });
        
        return html;
    }

    displayUnified(diffResult, options) {
        let unifiedHTML = '';
        let lineNum1 = 1;
        let lineNum2 = 1;
        
        diffResult.diff.forEach(item => {
            switch (item.type) {
                case 'unchanged':
                    unifiedHTML += ` ${this.escapeHtml(item.content1)}\n`;
                    lineNum1++;
                    lineNum2++;
                    break;
                    
                case 'deleted':
                    unifiedHTML += `-${this.escapeHtml(item.content1)}\n`;
                    lineNum1++;
                    break;
                    
                case 'added':
                    unifiedHTML += `+${this.escapeHtml(item.content2)}\n`;
                    lineNum2++;
                    break;
                    
                case 'modified':
                    unifiedHTML += `-${this.escapeHtml(item.content1)}\n`;
                    unifiedHTML += `+${this.escapeHtml(item.content2)}\n`;
                    lineNum1++;
                    lineNum2++;
                    break;
            }
        });
        
        this.unifiedContent.textContent = unifiedHTML;
    }

    exportDiff() {
        const sideBySideContent = `SIDE-BY-SIDE DIFF\n${'='.repeat(50)}\n\nLEFT SIDE:\n${this.text1Input.value}\n\nRIGHT SIDE:\n${this.text2Input.value}`;
        this.downloadFile(sideBySideContent, 'diff-comparison.txt');
    }

    exportUnified() {
        const unifiedContent = `UNIFIED DIFF\n${'='.repeat(50)}\n\n${this.unifiedContent.textContent}`;
        this.downloadFile(unifiedContent, 'unified-diff.txt');
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextDiffChecker();
});
