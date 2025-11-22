// Cron Job Generator App
class CronGenerator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.populateTimeSelectors();
        this.updateCronExpression();
    }

    initializeElements() {
        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Frequency radios
        this.frequencyRadios = document.querySelectorAll('input[name="frequency"]');
        this.customOptions = document.getElementById('custom-options');

        // Cron field inputs
        this.minuteField = document.getElementById('minute-field');
        this.hourField = document.getElementById('hour-field');
        this.dayField = document.getElementById('day-field');
        this.monthField = document.getElementById('month-field');
        this.dowField = document.getElementById('dow-field');

        // Quick selectors
        this.quickHour = document.getElementById('quick-hour');
        this.quickMinute = document.getElementById('quick-minute');

        // Expression input
        this.cronInput = document.getElementById('cron-input');

        // Result elements
        this.cronExpression = document.getElementById('cron-expression');
        this.minuteDesc = document.getElementById('minute-desc');
        this.hourDesc = document.getElementById('hour-desc');
        this.dayDesc = document.getElementById('day-desc');
        this.monthDesc = document.getElementById('month-desc');
        this.dowDesc = document.getElementById('dow-desc');
        this.humanDescription = document.getElementById('human-description');
        this.nextExecutions = document.getElementById('next-executions');

        // Buttons
        this.copyBtn = document.getElementById('copy-expression');
        this.presetBtns = document.querySelectorAll('.preset-btn');
    }

    attachEventListeners() {
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Frequency selection
        this.frequencyRadios.forEach(radio => {
            radio.addEventListener('change', (e) => this.handleFrequencyChange(e.target));
        });

        // Cron field inputs
        [this.minuteField, this.hourField, this.dayField, this.monthField, this.dowField].forEach(field => {
            field.addEventListener('input', () => this.updateFromFields());
        });

        // Quick selectors
        this.quickHour.addEventListener('change', () => this.applyQuickTime());
        this.quickMinute.addEventListener('change', () => this.applyQuickTime());

        // Expression input
        this.cronInput.addEventListener('input', () => this.parseExpression());

        // Copy button
        this.copyBtn.addEventListener('click', () => this.copyExpression());

        // Preset buttons
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cron = e.target.dataset.cron || e.target.closest('.preset-btn').dataset.cron;
                this.applyCronExpression(cron);
            });
        });
    }

    populateTimeSelectors() {
        // Populate hour selector
        for (let i = 0; i < 24; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i.toString().padStart(2, '0');
            this.quickHour.appendChild(option);
        }

        // Populate minute selector
        for (let i = 0; i < 60; i += 5) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i.toString().padStart(2, '0');
            this.quickMinute.appendChild(option);
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab contents
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    handleFrequencyChange(radio) {
        const isCustom = radio.value === 'custom';
        this.customOptions.classList.toggle('active', isCustom);

        if (!isCustom) {
            const pattern = radio.dataset.pattern;
            this.applyCronExpression(pattern);
        } else {
            this.updateFromFields();
        }
    }

    updateFromFields() {
        const minute = this.minuteField.value || '*';
        const hour = this.hourField.value || '*';
        const day = this.dayField.value || '*';
        const month = this.monthField.value || '*';
        const dow = this.dowField.value || '*';

        const expression = `${minute} ${hour} ${day} ${month} ${dow}`;
        this.updateCronExpression(expression);
    }

    applyQuickTime() {
        const hour = this.quickHour.value;
        const minute = this.quickMinute.value;

        if (hour !== '') {
            this.hourField.value = hour;
        }
        if (minute !== '') {
            this.minuteField.value = minute;
        }

        this.updateFromFields();
    }

    parseExpression() {
        const expression = this.cronInput.value.trim();
        if (this.isValidCronExpression(expression)) {
            this.applyCronExpression(expression);
        }
    }

    applyCronExpression(expression) {
        if (!expression) return;

        const parts = expression.split(/\s+/);
        if (parts.length === 5) {
            // Update field inputs
            this.minuteField.value = parts[0];
            this.hourField.value = parts[1];
            this.dayField.value = parts[2];
            this.monthField.value = parts[3];
            this.dowField.value = parts[4];

            // Update expression input
            this.cronInput.value = expression;

            // Set to custom frequency
            const customRadio = document.querySelector('input[name="frequency"][value="custom"]');
            customRadio.checked = true;
            this.customOptions.classList.add('active');

            this.updateCronExpression(expression);
        }
    }

    updateCronExpression(expression) {
        if (!expression) {
            expression = `${this.minuteField.value || '*'} ${this.hourField.value || '*'} ${this.dayField.value || '*'} ${this.monthField.value || '*'} ${this.dowField.value || '*'}`;
        }

        // Update display
        this.cronExpression.textContent = expression;
        this.cronInput.value = expression;

        // Update breakdown
        const parts = expression.split(/\s+/);
        this.minuteDesc.textContent = parts[0] || '*';
        this.hourDesc.textContent = parts[1] || '*';
        this.dayDesc.textContent = parts[2] || '*';
        this.monthDesc.textContent = parts[3] || '*';
        this.dowDesc.textContent = parts[4] || '*';

        // Update human readable description
        this.humanDescription.textContent = this.getHumanReadable(expression);

        // Update next executions
        this.updateNextExecutions(expression);
    }

    getHumanReadable(expression) {
        const parts = expression.split(/\s+/);
        const [minute, hour, day, month, dow] = parts;

        // Simple patterns
        if (expression === '* * * * *') return 'Runs every minute';
        if (expression === '0 * * * *') return 'Runs every hour at minute 0';
        if (expression === '0 0 * * *') return 'Runs daily at 12:00 AM (midnight)';
        if (expression === '0 12 * * *') return 'Runs daily at 12:00 PM (noon)';
        if (expression === '0 0 * * 0') return 'Runs weekly on Sunday at 12:00 AM';
        if (expression === '0 0 1 * *') return 'Runs monthly on the 1st at 12:00 AM';
        if (expression === '0 9 * * 1-5') return 'Runs weekdays (Mon-Fri) at 9:00 AM';
        if (expression === '*/15 * * * *') return 'Runs every 15 minutes';

        // Build description
        let description = 'Runs ';

        // Frequency
        if (minute === '*' && hour === '*' && day === '*' && month === '*' && dow === '*') {
            return 'Runs every minute';
        }

        if (minute.startsWith('*/')) {
            const interval = minute.substring(2);
            description += `every ${interval} minutes`;
        } else if (minute !== '*') {
            description += `at minute ${minute}`;
        }

        if (hour !== '*') {
            if (hour.includes('-')) {
                description += ` between hours ${hour}`;
            } else if (hour.includes(',')) {
                description += ` at hours ${hour}`;
            } else {
                const hourNum = parseInt(hour);
                const time = hourNum === 0 ? '12:00 AM' : 
                            hourNum < 12 ? `${hourNum}:00 AM` : 
                            hourNum === 12 ? '12:00 PM' : 
                            `${hourNum - 12}:00 PM`;
                description += ` at ${time}`;
            }
        }

        if (day !== '*') {
            if (day.includes('-')) {
                description += ` on days ${day} of the month`;
            } else if (day.includes(',')) {
                description += ` on days ${day} of the month`;
            } else {
                description += ` on day ${day} of the month`;
            }
        }

        if (month !== '*') {
            const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            if (month.includes('-')) {
                description += ` during months ${month}`;
            } else if (month.includes(',')) {
                description += ` during months ${month}`;
            } else {
                const monthNum = parseInt(month);
                description += ` in ${monthNames[monthNum]}`;
            }
        }

        if (dow !== '*') {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            if (dow === '1-5') {
                description += ' on weekdays';
            } else if (dow === '0,6') {
                description += ' on weekends';
            } else if (dow.includes('-')) {
                description += ` on days ${dow} of the week`;
            } else if (dow.includes(',')) {
                description += ` on days ${dow} of the week`;
            } else {
                const dayNum = parseInt(dow) % 7;
                description += ` on ${dayNames[dayNum]}s`;
            }
        }

        return description;
    }

    updateNextExecutions(expression) {
        try {
            const executions = this.calculateNextExecutions(expression, 5);
            this.nextExecutions.innerHTML = '';
            
            executions.forEach(date => {
                const li = document.createElement('li');
                li.textContent = date.toLocaleString();
                this.nextExecutions.appendChild(li);
            });
        } catch (error) {
            this.nextExecutions.innerHTML = '<li>Unable to calculate next executions</li>';
        }
    }

    calculateNextExecutions(expression, count) {
        const parts = expression.split(/\s+/);
        const [minute, hour, day, month, dow] = parts;
        
        const executions = [];
        const now = new Date();
        let current = new Date(now.getTime() + 60000); // Start from next minute
        
        let attempts = 0;
        const maxAttempts = 10000; // Prevent infinite loops

        while (executions.length < count && attempts < maxAttempts) {
            attempts++;

            if (this.matchesCronExpression(current, minute, hour, day, month, dow)) {
                executions.push(new Date(current));
            }

            // Move to next minute
            current.setMinutes(current.getMinutes() + 1);
        }

        return executions;
    }

    matchesCronExpression(date, minute, hour, day, month, dow) {
        // Check minute
        if (!this.matchesField(date.getMinutes(), minute)) return false;
        
        // Check hour
        if (!this.matchesField(date.getHours(), hour)) return false;
        
        // Check day of month
        if (!this.matchesField(date.getDate(), day)) return false;
        
        // Check month (1-based)
        if (!this.matchesField(date.getMonth() + 1, month)) return false;
        
        // Check day of week (0 = Sunday)
        if (!this.matchesField(date.getDay(), dow)) return false;

        return true;
    }

    matchesField(value, pattern) {
        if (pattern === '*') return true;

        // Handle step values (e.g., */5)
        if (pattern.includes('*/')) {
            const step = parseInt(pattern.split('/')[1]);
            return value % step === 0;
        }

        // Handle ranges (e.g., 1-5)
        if (pattern.includes('-')) {
            const [start, end] = pattern.split('-').map(n => parseInt(n));
            return value >= start && value <= end;
        }

        // Handle lists (e.g., 1,3,5)
        if (pattern.includes(',')) {
            const values = pattern.split(',').map(n => parseInt(n));
            return values.includes(value);
        }

        // Exact match
        return value === parseInt(pattern);
    }

    isValidCronExpression(expression) {
        const parts = expression.split(/\s+/);
        return parts.length === 5;
    }

    copyExpression() {
        const expression = this.cronExpression.textContent;
        
        navigator.clipboard.writeText(expression).then(() => {
            this.showMessage('Cron expression copied to clipboard!', 'success');
        }).catch(() => {
            this.showMessage('Failed to copy to clipboard.', 'error');
        });
    }

    showMessage(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the generator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CronGenerator();
});

// Add CSS animations for notifications
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
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
