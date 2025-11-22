class UnixTimestampConverter {
    constructor() {
        this.init();
        this.updateCurrentTime();
        this.startClock();
    }

    init() {
        this.bindEvents();
        this.loadCurrentTimestamp();
        this.setupQuickActions();
    }

    bindEvents() {
        const timestampInput = document.getElementById('timestampInput');
        const datetimeInput = document.getElementById('datetimeInput');
        const timezoneSelect = document.getElementById('timezoneSelect');
        const toDateBtn = document.getElementById('toDateBtn');
        const toTimestampBtn = document.getElementById('toTimestampBtn');
        const copyBtns = document.querySelectorAll('.copy-btn');

        timestampInput?.addEventListener('input', () => this.convertToDate());
        datetimeInput?.addEventListener('input', () => this.convertToTimestamp());
        timezoneSelect?.addEventListener('change', () => {
            this.convertToDate();
            this.convertToTimestamp();
        });

        toDateBtn?.addEventListener('click', () => this.convertToDate());
        toTimestampBtn?.addEventListener('click', () => this.convertToTimestamp());

        copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.copyToClipboard(e));
        });

        // Quick actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action')) {
                this.handleQuickAction(e.target.closest('.quick-action'));
            }
        });
    }

    updateCurrentTime() {
        const now = Date.now();
        const currentTimestamp = Math.floor(now / 1000);
        const currentDatetime = new Date(now);

        const timestampElement = document.getElementById('currentTimestamp');
        const datetimeElement = document.getElementById('currentDatetime');

        if (timestampElement) {
            timestampElement.textContent = currentTimestamp;
        }

        if (datetimeElement) {
            datetimeElement.textContent = currentDatetime.toLocaleString();
        }
    }

    startClock() {
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    }

    loadCurrentTimestamp() {
        const timestampInput = document.getElementById('timestampInput');
        if (timestampInput) {
            timestampInput.value = Math.floor(Date.now() / 1000);
            this.convertToDate();
        }
    }

    setupQuickActions() {
        const quickActions = [
            { id: 'now', title: 'Current Time', desc: 'Set to current timestamp', icon: '🕐' },
            { id: 'today', title: 'Start of Today', desc: 'Today at 00:00:00', icon: '📅' },
            { id: 'tomorrow', title: 'Start of Tomorrow', desc: 'Tomorrow at 00:00:00', icon: '➡️' },
            { id: 'week', title: 'One Week Ago', desc: '7 days ago', icon: '📆' },
            { id: 'month', title: 'One Month Ago', desc: '30 days ago', icon: '🗓️' },
            { id: 'year', title: 'One Year Ago', desc: '365 days ago', icon: '🎂' }
        ];

        const quickActionsContainer = document.getElementById('quickActions');
        if (!quickActionsContainer) return;

        quickActions.forEach(action => {
            const actionElement = document.createElement('div');
            actionElement.className = 'quick-action';
            actionElement.dataset.action = action.id;
            actionElement.innerHTML = `
                <div class="quick-action-icon">${action.icon}</div>
                <div class="quick-action-title">${action.title}</div>
                <div class="quick-action-desc">${action.desc}</div>
            `;
            quickActionsContainer.appendChild(actionElement);
        });
    }

    handleQuickAction(actionElement) {
        const action = actionElement.dataset.action;
        const now = new Date();
        let targetDate;

        switch (action) {
            case 'now':
                targetDate = now;
                break;
            case 'today':
                targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'tomorrow':
                targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                targetDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                break;
            case 'month':
                targetDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                break;
            case 'year':
                targetDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
                break;
            default:
                return;
        }

        const timestamp = Math.floor(targetDate.getTime() / 1000);
        const timestampInput = document.getElementById('timestampInput');
        if (timestampInput) {
            timestampInput.value = timestamp;
            this.convertToDate();
        }
    }

    convertToDate() {
        const timestampInput = document.getElementById('timestampInput');
        const timestampResult = document.getElementById('timestampResult');
        const formatExamples = document.getElementById('formatExamples');

        const timestamp = parseInt(timestampInput?.value);

        if (!timestamp || isNaN(timestamp)) {
            this.clearDateResult();
            return;
        }

        try {
            const date = new Date(timestamp * 1000);
            
            if (isNaN(date.getTime())) {
                throw new Error('Invalid timestamp');
            }

            // Display main result
            if (timestampResult) {
                timestampResult.className = 'result-display success';
                timestampResult.innerHTML = `
                    <div class="result-value">${date.toISOString()}</div>
                    <div class="result-meta">
                        <span>Local: ${date.toLocaleString()}</span>
                        <span>UTC: ${date.toUTCString()}</span>
                        <span>Relative: ${this.getRelativeTime(date)}</span>
                    </div>
                `;
            }

            // Display format examples
            this.displayFormatExamples(date);

        } catch (error) {
            if (timestampResult) {
                timestampResult.className = 'result-display error';
                timestampResult.innerHTML = `
                    <div class="result-value">Invalid timestamp</div>
                    <div class="result-meta">
                        <span>Error: ${error.message}</span>
                    </div>
                `;
            }
            this.clearFormatExamples();
        }
    }

    convertToTimestamp() {
        const datetimeInput = document.getElementById('datetimeInput');
        const datetimeResult = document.getElementById('datetimeResult');

        const datetime = datetimeInput?.value;

        if (!datetime) {
            this.clearTimestampResult();
            return;
        }

        try {
            const date = new Date(datetime);
            
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date format');
            }

            const timestamp = Math.floor(date.getTime() / 1000);

            // Display result
            if (datetimeResult) {
                datetimeResult.className = 'result-display success';
                datetimeResult.innerHTML = `
                    <div class="result-value">${timestamp}</div>
                    <div class="result-meta">
                        <span>Milliseconds: ${date.getTime()}</span>
                        <span>ISO: ${date.toISOString()}</span>
                        <span>Relative: ${this.getRelativeTime(date)}</span>
                    </div>
                `;
            }

        } catch (error) {
            if (datetimeResult) {
                datetimeResult.className = 'result-display error';
                datetimeResult.innerHTML = `
                    <div class="result-value">Invalid date</div>
                    <div class="result-meta">
                        <span>Error: ${error.message}</span>
                    </div>
                `;
            }
        }
    }

    displayFormatExamples(date) {
        const formatExamples = document.getElementById('formatExamples');
        if (!formatExamples) return;

        const formats = [
            { name: 'ISO 8601', value: date.toISOString() },
            { name: 'RFC 2822', value: date.toUTCString() },
            { name: 'Local String', value: date.toLocaleString() },
            { name: 'Date Only', value: date.toDateString() },
            { name: 'Time Only', value: date.toTimeString() },
            { name: 'JSON Format', value: date.toJSON() },
            { name: 'Year-Month-Day', value: date.toISOString().split('T')[0] },
            { name: 'Unix (seconds)', value: Math.floor(date.getTime() / 1000).toString() },
            { name: 'Unix (milliseconds)', value: date.getTime().toString() }
        ];

        const formatList = formatExamples.querySelector('.format-list');
        if (formatList) {
            formatList.innerHTML = formats.map(format => `
                <div class="format-item">
                    <div class="format-name">${format.name}</div>
                    <div class="format-value">${format.value}</div>
                </div>
            `).join('');
        }
    }

    getRelativeTime(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (Math.abs(diffSeconds) < 60) {
            return 'just now';
        } else if (Math.abs(diffMinutes) < 60) {
            return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? 's' : ''} ${diffMinutes < 0 ? 'from now' : 'ago'}`;
        } else if (Math.abs(diffHours) < 24) {
            return `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ${diffHours < 0 ? 'from now' : 'ago'}`;
        } else {
            return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ${diffDays < 0 ? 'from now' : 'ago'}`;
        }
    }

    clearDateResult() {
        const timestampResult = document.getElementById('timestampResult');
        if (timestampResult) {
            timestampResult.className = 'result-display';
            timestampResult.innerHTML = '';
        }
        this.clearFormatExamples();
    }

    clearTimestampResult() {
        const datetimeResult = document.getElementById('datetimeResult');
        if (datetimeResult) {
            datetimeResult.className = 'result-display';
            datetimeResult.innerHTML = '';
        }
    }

    clearFormatExamples() {
        const formatExamples = document.getElementById('formatExamples');
        if (formatExamples) {
            const formatList = formatExamples.querySelector('.format-list');
            if (formatList) {
                formatList.innerHTML = '';
            }
        }
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

// Initialize the Unix Timestamp Converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new UnixTimestampConverter();
});
