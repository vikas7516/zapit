class RegexTester {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadQuickPatterns();
        this.loadSampleData();
    }

    bindEvents() {
        const regexInput = document.getElementById('regexInput');
        const testString = document.getElementById('testString');
        const flagCheckboxes = document.querySelectorAll('input[name="flags"]');
        const testBtn = document.getElementById('testBtn');
        const clearBtn = document.getElementById('clearBtn');
        const copyBtns = document.querySelectorAll('.copy-btn');

        regexInput?.addEventListener('input', () => this.testRegex());
        testString?.addEventListener('input', () => this.testRegex());
        
        flagCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.testRegex());
        });

        testBtn?.addEventListener('click', () => this.testRegex());
        clearBtn?.addEventListener('click', () => this.clearAll());

        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.copyToClipboard(e));
        });

        // Quick pattern clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-pattern')) {
                this.useQuickPattern(e.target.closest('.quick-pattern'));
            }
        });
    }

    loadQuickPatterns() {
        const quickPatterns = [
            { name: 'Email', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
            { name: 'Phone', pattern: '^\\+?[1-9]\\d{1,14}$' },
            { name: 'URL', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)' },
            { name: 'IPv4', pattern: '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$' },
            { name: 'Date (YYYY-MM-DD)', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            { name: 'Time (HH:MM)', pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' },
            { name: 'Hex Color', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
            { name: 'Credit Card', pattern: '^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$' }
        ];

        const patternsContainer = document.getElementById('quickPatterns');
        if (!patternsContainer) return;

        quickPatterns.forEach(pattern => {
            const patternElement = document.createElement('div');
            patternElement.className = 'quick-pattern';
            patternElement.innerHTML = `
                <div class="pattern-name">${pattern.name}</div>
                <div class="pattern-regex">${pattern.pattern}</div>
            `;
            patternElement.dataset.pattern = pattern.pattern;
            patternsContainer.appendChild(patternElement);
        });
    }

    loadSampleData() {
        const regexInput = document.getElementById('regexInput');
        const testString = document.getElementById('testString');

        if (regexInput) {
            regexInput.value = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
        }

        if (testString) {
            testString.value = `john.doe@example.com
jane.smith@gmail.com
invalid-email
test@domain
user@sub.domain.org
bad@email.
@invalid.com
valid.email@test.co.uk`;
        }

        this.testRegex();
    }

    useQuickPattern(patternElement) {
        const pattern = patternElement.dataset.pattern;
        const regexInput = document.getElementById('regexInput');
        
        if (regexInput) {
            regexInput.value = pattern;
            this.testRegex();
        }
    }

    testRegex() {
        const regexInput = document.getElementById('regexInput');
        const testString = document.getElementById('testString');
        
        const pattern = regexInput?.value.trim();
        const text = testString?.value || '';

        if (!pattern) {
            this.clearResults();
            return;
        }

        try {
            const flags = this.getSelectedFlags();
            const regex = new RegExp(pattern, flags);
            
            this.displayResults(regex, text, pattern);
            this.updateRegexInfo(regex, pattern);
            this.highlightMatches(text, regex);
            
        } catch (error) {
            this.displayError(error.message);
        }
    }

    getSelectedFlags() {
        const flagCheckboxes = document.querySelectorAll('input[name="flags"]:checked');
        return Array.from(flagCheckboxes).map(cb => cb.value).join('');
    }

    displayResults(regex, text, pattern) {
        const resultsContainer = document.getElementById('regexResults');
        const matchCount = document.getElementById('matchCount');
        
        if (!resultsContainer) return;

        const matches = [];
        let match;

        if (regex.global) {
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    fullMatch: match[0],
                    index: match.index,
                    groups: match.slice(1),
                    namedGroups: match.groups || {}
                });
                
                // Prevent infinite loop on zero-length matches
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
            }
        } else {
            match = regex.exec(text);
            if (match) {
                matches.push({
                    fullMatch: match[0],
                    index: match.index,
                    groups: match.slice(1),
                    namedGroups: match.groups || {}
                });
            }
        }

        // Update match count
        if (matchCount) {
            matchCount.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''} found`;
        }

        // Display matches
        resultsContainer.innerHTML = '';
        
        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="no-matches">No matches found</div>';
            return;
        }

        matches.forEach((match, index) => {
            const matchElement = document.createElement('div');
            matchElement.className = 'match-item';
            
            let groupsHtml = '';
            if (match.groups.length > 0) {
                groupsHtml = match.groups.map((group, i) => `
                    <div class="group-item">
                        <span class="group-index">Group ${i + 1}:</span>
                        <span class="group-value">${group || '(empty)'}</span>
                    </div>
                `).join('');
            }

            let namedGroupsHtml = '';
            if (Object.keys(match.namedGroups).length > 0) {
                namedGroupsHtml = Object.entries(match.namedGroups).map(([name, value]) => `
                    <div class="group-item">
                        <span class="group-index">${name}:</span>
                        <span class="group-value">${value || '(empty)'}</span>
                    </div>
                `).join('');
            }

            matchElement.innerHTML = `
                <div class="match-header">
                    <span class="match-index">Match ${index + 1}</span>
                    <span class="match-position">Position: ${match.index}-${match.index + match.fullMatch.length}</span>
                </div>
                <div class="match-content">
                    <div class="match-text">"${match.fullMatch}"</div>
                    ${groupsHtml ? `<div class="groups-section">
                        <div class="groups-title">Captured Groups:</div>
                        ${groupsHtml}
                    </div>` : ''}
                    ${namedGroupsHtml ? `<div class="groups-section">
                        <div class="groups-title">Named Groups:</div>
                        ${namedGroupsHtml}
                    </div>` : ''}
                </div>
            `;

            resultsContainer.appendChild(matchElement);
        });
    }

    updateRegexInfo(regex, pattern) {
        const regexFlags = document.getElementById('regexFlags');
        const regexPattern = document.getElementById('regexPattern');

        if (regexFlags) {
            const flags = regex.flags || 'none';
            regexFlags.textContent = flags;
        }

        if (regexPattern) {
            regexPattern.textContent = `/${pattern}/${regex.flags}`;
        }
    }

    highlightMatches(text, regex) {
        const highlightedOutput = document.getElementById('highlightedText');
        if (!highlightedOutput) return;

        if (!text) {
            highlightedOutput.innerHTML = '';
            return;
        }

        let highlightedText = text;
        const matches = [];
        let match;

        // Reset regex lastIndex
        regex.lastIndex = 0;

        if (regex.global) {
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
                
                // Prevent infinite loop
                if (match.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
            }
        } else {
            match = regex.exec(text);
            if (match) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
            }
        }

        // Sort matches by start position (descending) to replace from end to beginning
        matches.sort((a, b) => b.start - a.start);

        // Apply highlighting
        matches.forEach(match => {
            const before = highlightedText.substring(0, match.start);
            const highlighted = `<mark class="regex-match">${match.text}</mark>`;
            const after = highlightedText.substring(match.end);
            highlightedText = before + highlighted + after;
        });

        // Preserve line breaks and spaces
        highlightedText = highlightedText.replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;');
        
        highlightedOutput.innerHTML = highlightedText;
    }

    displayError(errorMessage) {
        const resultsContainer = document.getElementById('regexResults');
        const matchCount = document.getElementById('matchCount');
        const highlightedOutput = document.getElementById('highlightedText');

        if (matchCount) {
            matchCount.textContent = 'Invalid regex';
        }

        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="regex-error">
                    <div class="error-icon">❌</div>
                    <div class="error-message">
                        <strong>Regex Error:</strong><br>
                        ${errorMessage}
                    </div>
                </div>
            `;
        }

        if (highlightedOutput) {
            highlightedOutput.innerHTML = '';
        }
    }

    clearResults() {
        const resultsContainer = document.getElementById('regexResults');
        const matchCount = document.getElementById('matchCount');
        const highlightedOutput = document.getElementById('highlightedText');

        if (resultsContainer) resultsContainer.innerHTML = '';
        if (matchCount) matchCount.textContent = '';
        if (highlightedOutput) highlightedOutput.innerHTML = '';
    }

    clearAll() {
        const regexInput = document.getElementById('regexInput');
        const testString = document.getElementById('testString');
        const flagCheckboxes = document.querySelectorAll('input[name="flags"]');

        if (regexInput) regexInput.value = '';
        if (testString) testString.value = '';
        
        flagCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        this.clearResults();
    }

    async copyToClipboard(event) {
        const button = event.target.closest('.copy-btn');
        const targetId = button.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        
        if (!targetElement) return;

        const text = targetElement.textContent || targetElement.value;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard!', 'success');
            
            // Visual feedback
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showNotification('Failed to copy to clipboard', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the Regex Tester when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RegexTester();
});
