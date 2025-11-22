class DateDifferenceCalculator {
    constructor() {
        this.currentMode = 'difference';
        this.results = [];
        
        this.initializeElements();
        this.attachEventListeners();
        this.setTodayAsDefault();
        this.loadFromStorage();
    }

    initializeElements() {
        // Mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.calculationSections = {
            difference: document.getElementById('differenceMode'),
            add: document.getElementById('addMode'),
            business: document.getElementById('businessMode')
        };

        // Date difference elements
        this.startDate = document.getElementById('startDate');
        this.endDate = document.getElementById('endDate');
        this.startTime = document.getElementById('startTime');
        this.endTime = document.getElementById('endTime');
        this.includeTime = document.getElementById('includeTime');
        this.excludeWeekends = document.getElementById('excludeWeekends');

        // Add/subtract elements
        this.baseDate = document.getElementById('baseDate');
        this.daysToAdd = document.getElementById('daysToAdd');
        this.addOperation = document.getElementById('addOperation');
        this.timeUnitRadios = document.querySelectorAll('input[name="timeUnit"]');

        // Business days elements
        this.businessStartDate = document.getElementById('businessStartDate');
        this.businessEndDate = document.getElementById('businessEndDate');
        this.excludeUS = document.getElementById('excludeUS');
        this.customHolidays = document.getElementById('customHolidays');
        this.holidayDates = document.getElementById('holidayDates');
        this.customHolidaysSection = document.getElementById('customHolidaysSection');

        // Results and actions
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resultsContent = document.getElementById('resultsContent');
        this.copyResults = document.getElementById('copyResults');
        this.quickButtons = document.querySelectorAll('.quick-btn');
    }

    attachEventListeners() {
        // Mode switching
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMode(e.target.dataset.mode);
            });
        });

        // Calculate button
        this.calculateBtn.addEventListener('click', () => this.calculate());

        // Input changes for real-time calculation
        [this.startDate, this.endDate, this.baseDate, this.daysToAdd, 
         this.businessStartDate, this.businessEndDate].forEach(input => {
            if (input) {
                input.addEventListener('change', () => this.autoCalculate());
            }
        });

        // Checkbox changes
        [this.includeTime, this.excludeWeekends, this.excludeUS, this.customHolidays].forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', () => this.handleCheckboxChange(checkbox));
            }
        });

        // Time unit radio changes
        this.timeUnitRadios.forEach(radio => {
            radio.addEventListener('change', () => this.autoCalculate());
        });

        // Copy results
        this.copyResults.addEventListener('click', () => this.copyResultsToClipboard());

        // Quick action buttons
        this.quickButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleQuickAction(e.target.dataset.action);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update button states
        this.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Show/hide sections
        Object.keys(this.calculationSections).forEach(key => {
            this.calculationSections[key].classList.toggle('hidden', key !== mode);
        });

        // Clear results
        this.clearResults();
        this.saveToStorage();
    }

    handleCheckboxChange(checkbox) {
        if (checkbox === this.includeTime) {
            this.startTime.style.display = checkbox.checked ? 'block' : 'none';
            this.endTime.style.display = checkbox.checked ? 'block' : 'none';
        } else if (checkbox === this.customHolidays) {
            this.customHolidaysSection.classList.toggle('hidden', !checkbox.checked);
        }
        
        this.autoCalculate();
        this.saveToStorage();
    }

    calculate() {
        try {
            let result;
            
            switch (this.currentMode) {
                case 'difference':
                    result = this.calculateDateDifference();
                    break;
                case 'add':
                    result = this.calculateDateAddition();
                    break;
                case 'business':
                    result = this.calculateBusinessDays();
                    break;
            }

            if (result) {
                this.displayResults(result);
                this.addToHistory(result);
                this.saveToStorage();
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    calculateDateDifference() {
        const startDateValue = this.startDate.value;
        const endDateValue = this.endDate.value;

        if (!startDateValue || !endDateValue) {
            throw new Error('Please select both start and end dates');
        }

        let startDateTime = new Date(startDateValue);
        let endDateTime = new Date(endDateValue);

        // Include time if selected
        if (this.includeTime.checked && this.startTime.value && this.endTime.value) {
            const [startHour, startMin] = this.startTime.value.split(':');
            const [endHour, endMin] = this.endTime.value.split(':');
            
            startDateTime.setHours(parseInt(startHour), parseInt(startMin));
            endDateTime.setHours(parseInt(endHour), parseInt(endMin));
        }

        // Ensure start is before end
        if (startDateTime > endDateTime) {
            [startDateTime, endDateTime] = [endDateTime, startDateTime];
        }

        const difference = this.getDetailedDifference(startDateTime, endDateTime);
        
        // Calculate business days if weekends should be excluded
        if (this.excludeWeekends.checked) {
            difference.businessDays = this.getBusinessDaysBetween(startDateTime, endDateTime);
        }

        return {
            type: 'difference',
            startDate: startDateTime,
            endDate: endDateTime,
            ...difference
        };
    }

    calculateDateAddition() {
        const baseDateValue = this.baseDate.value;
        const daysValue = parseInt(this.daysToAdd.value);

        if (!baseDateValue || isNaN(daysValue)) {
            throw new Error('Please enter a valid base date and number of days');
        }

        const baseDateTime = new Date(baseDateValue);
        const operation = this.addOperation.value;
        const timeUnit = document.querySelector('input[name="timeUnit"]:checked').value;
        
        let resultDate = new Date(baseDateTime);
        let multiplier = operation === 'add' ? 1 : -1;

        switch (timeUnit) {
            case 'days':
                resultDate.setDate(resultDate.getDate() + (daysValue * multiplier));
                break;
            case 'weeks':
                resultDate.setDate(resultDate.getDate() + (daysValue * 7 * multiplier));
                break;
            case 'months':
                resultDate.setMonth(resultDate.getMonth() + (daysValue * multiplier));
                break;
            case 'years':
                resultDate.setFullYear(resultDate.getFullYear() + (daysValue * multiplier));
                break;
        }

        return {
            type: 'addition',
            baseDate: baseDateTime,
            operation,
            value: daysValue,
            unit: timeUnit,
            resultDate,
            dayOfWeek: resultDate.toLocaleDateString('en-US', { weekday: 'long' })
        };
    }

    calculateBusinessDays() {
        const startDateValue = this.businessStartDate.value;
        const endDateValue = this.businessEndDate.value;

        if (!startDateValue || !endDateValue) {
            throw new Error('Please select both start and end dates');
        }

        let startDate = new Date(startDateValue);
        let endDate = new Date(endDateValue);

        // Ensure start is before end
        if (startDate > endDate) {
            [startDate, endDate] = [endDate, startDate];
        }

        const holidays = this.getHolidays();
        const businessDays = this.getBusinessDaysBetween(startDate, endDate, holidays);
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const weekendDays = this.getWeekendDaysBetween(startDate, endDate);
        const holidayCount = holidays.filter(h => h >= startDate && h <= endDate).length;

        return {
            type: 'business',
            startDate,
            endDate,
            businessDays,
            totalDays,
            weekendDays,
            holidayCount,
            holidays: holidays.filter(h => h >= startDate && h <= endDate)
        };
    }

    getDetailedDifference(start, end) {
        const diffMs = end - start;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        // Calculate years, months, and days
        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        if (days < 0) {
            months--;
            const lastDayOfPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
            days += lastDayOfPrevMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        return {
            years,
            months,
            days: days,
            totalDays: diffDays,
            hours: diffHours,
            minutes: diffMinutes,
            seconds: diffSeconds,
            totalHours: Math.floor(diffMs / (1000 * 60 * 60)),
            totalMinutes: Math.floor(diffMs / (1000 * 60)),
            totalSeconds: Math.floor(diffMs / 1000),
            weeks: Math.floor(diffDays / 7),
            remainingDays: diffDays % 7
        };
    }

    getBusinessDaysBetween(start, end, holidays = []) {
        let businessDays = 0;
        const currentDate = new Date(start);

        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isHoliday = holidays.some(holiday => 
                holiday.toDateString() === currentDate.toDateString()
            );

            if (!isWeekend && !isHoliday) {
                businessDays++;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return businessDays;
    }

    getWeekendDaysBetween(start, end) {
        let weekendDays = 0;
        const currentDate = new Date(start);

        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                weekendDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return weekendDays;
    }

    getHolidays() {
        const holidays = [];
        const currentYear = new Date().getFullYear();

        // US Federal Holidays if selected
        if (this.excludeUS.checked) {
            holidays.push(
                new Date(currentYear, 0, 1),  // New Year's Day
                new Date(currentYear, 6, 4),  // Independence Day
                new Date(currentYear, 11, 25) // Christmas Day
            );

            // Add more US holidays...
            holidays.push(this.getMLKDay(currentYear));
            holidays.push(this.getPresidentsDay(currentYear));
            holidays.push(this.getMemorialDay(currentYear));
            holidays.push(this.getLaborDay(currentYear));
            holidays.push(this.getColumbusDay(currentYear));
            holidays.push(this.getThanksgiving(currentYear));
        }

        // Custom holidays
        if (this.customHolidays.checked && this.holidayDates.value) {
            const customDates = this.holidayDates.value.split(',');
            customDates.forEach(dateStr => {
                const date = new Date(dateStr.trim());
                if (!isNaN(date.getTime())) {
                    holidays.push(date);
                }
            });
        }

        return holidays;
    }

    // US Holiday calculation methods
    getMLKDay(year) {
        return this.getNthWeekdayOfMonth(year, 0, 1, 3); // 3rd Monday in January
    }

    getPresidentsDay(year) {
        return this.getNthWeekdayOfMonth(year, 1, 1, 3); // 3rd Monday in February
    }

    getMemorialDay(year) {
        const lastMonday = new Date(year, 4, 31); // May 31st
        while (lastMonday.getDay() !== 1) {
            lastMonday.setDate(lastMonday.getDate() - 1);
        }
        return lastMonday;
    }

    getLaborDay(year) {
        return this.getNthWeekdayOfMonth(year, 8, 1, 1); // 1st Monday in September
    }

    getColumbusDay(year) {
        return this.getNthWeekdayOfMonth(year, 9, 1, 2); // 2nd Monday in October
    }

    getThanksgiving(year) {
        return this.getNthWeekdayOfMonth(year, 10, 4, 4); // 4th Thursday in November
    }

    getNthWeekdayOfMonth(year, month, weekday, n) {
        const firstDay = new Date(year, month, 1);
        const firstWeekday = firstDay.getDay();
        const offset = (weekday - firstWeekday + 7) % 7;
        const nthWeekday = new Date(year, month, 1 + offset + (n - 1) * 7);
        return nthWeekday;
    }

    displayResults(result) {
        let html = '';

        switch (result.type) {
            case 'difference':
                html = this.formatDifferenceResults(result);
                break;
            case 'addition':
                html = this.formatAdditionResults(result);
                break;
            case 'business':
                html = this.formatBusinessResults(result);
                break;
        }

        this.resultsContent.innerHTML = html;
        
        // Add animation
        this.resultsContent.style.animation = 'none';
        this.resultsContent.offsetHeight; // Trigger reflow
        this.resultsContent.style.animation = 'fadeInUp 0.5s ease';
    }

    formatDifferenceResults(result) {
        return `
            <div class="result-summary">
                <div class="result-main">
                    <span class="result-value">${result.totalDays}</span>
                    <span class="result-unit">Total Days</span>
                </div>
                <div class="result-breakdown">
                    <span>${result.years} years, ${result.months} months, ${result.days} days</span>
                </div>
            </div>
            
            <div class="result-details">
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Years</span>
                        <span class="detail-value">${result.years}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Months</span>
                        <span class="detail-value">${result.months}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Weeks</span>
                        <span class="detail-value">${result.weeks}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Days</span>
                        <span class="detail-value">${result.totalDays}</span>
                    </div>
                    ${result.totalHours ? `
                    <div class="detail-item">
                        <span class="detail-label">Hours</span>
                        <span class="detail-value">${result.totalHours.toLocaleString()}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Minutes</span>
                        <span class="detail-value">${result.totalMinutes.toLocaleString()}</span>
                    </div>
                    ` : ''}
                    ${result.businessDays !== undefined ? `
                    <div class="detail-item highlight">
                        <span class="detail-label">Business Days</span>
                        <span class="detail-value">${result.businessDays}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="result-dates">
                <div class="date-range">
                    <span class="date-label">From:</span>
                    <span class="date-value">${this.formatDate(result.startDate)}</span>
                </div>
                <div class="date-range">
                    <span class="date-label">To:</span>
                    <span class="date-value">${this.formatDate(result.endDate)}</span>
                </div>
            </div>
        `;
    }

    formatAdditionResults(result) {
        return `
            <div class="result-summary">
                <div class="result-main">
                    <span class="result-value">${this.formatDate(result.resultDate)}</span>
                    <span class="result-unit">${result.dayOfWeek}</span>
                </div>
                <div class="result-breakdown">
                    <span>${result.operation === 'add' ? 'Added' : 'Subtracted'} ${result.value} ${result.unit}</span>
                </div>
            </div>
            
            <div class="result-details">
                <div class="calculation-summary">
                    <div class="calc-step">
                        <span class="calc-label">Base Date:</span>
                        <span class="calc-value">${this.formatDate(result.baseDate)}</span>
                    </div>
                    <div class="calc-step">
                        <span class="calc-label">Operation:</span>
                        <span class="calc-value">${result.operation === 'add' ? '+' : '−'} ${result.value} ${result.unit}</span>
                    </div>
                    <div class="calc-step result-step">
                        <span class="calc-label">Result:</span>
                        <span class="calc-value">${this.formatDate(result.resultDate)}</span>
                    </div>
                </div>
            </div>
            
            <div class="result-info">
                <div class="info-item">
                    <span class="info-icon">📅</span>
                    <span>Day of the week: ${result.dayOfWeek}</span>
                </div>
                <div class="info-item">
                    <span class="info-icon">🗓️</span>
                    <span>Week ${this.getWeekNumber(result.resultDate)} of ${result.resultDate.getFullYear()}</span>
                </div>
            </div>
        `;
    }

    formatBusinessResults(result) {
        return `
            <div class="result-summary">
                <div class="result-main">
                    <span class="result-value">${result.businessDays}</span>
                    <span class="result-unit">Business Days</span>
                </div>
                <div class="result-breakdown">
                    <span>Out of ${result.totalDays} total days</span>
                </div>
            </div>
            
            <div class="result-details">
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Total Days</span>
                        <span class="detail-value">${result.totalDays}</span>
                    </div>
                    <div class="detail-item highlight">
                        <span class="detail-label">Business Days</span>
                        <span class="detail-value">${result.businessDays}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Weekend Days</span>
                        <span class="detail-value">${result.weekendDays}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Holidays</span>
                        <span class="detail-value">${result.holidayCount}</span>
                    </div>
                </div>
            </div>
            
            <div class="result-dates">
                <div class="date-range">
                    <span class="date-label">From:</span>
                    <span class="date-value">${this.formatDate(result.startDate)}</span>
                </div>
                <div class="date-range">
                    <span class="date-label">To:</span>
                    <span class="date-value">${this.formatDate(result.endDate)}</span>
                </div>
            </div>
            
            ${result.holidays.length > 0 ? `
            <div class="holidays-list">
                <h4>Excluded Holidays:</h4>
                <div class="holiday-items">
                    ${result.holidays.map(holiday => `
                        <span class="holiday-item">${this.formatDate(holiday)}</span>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        `;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    handleQuickAction(action) {
        const today = new Date();
        let startDate, endDate;

        switch (action) {
            case 'today':
                startDate = endDate = today;
                break;
            case 'yesterday':
                startDate = endDate = new Date(today);
                startDate.setDate(today.getDate() - 1);
                break;
            case 'tomorrow':
                startDate = endDate = new Date(today);
                startDate.setDate(today.getDate() + 1);
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay());
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31);
                break;
        }

        // Set the appropriate inputs based on current mode
        if (this.currentMode === 'difference') {
            this.startDate.value = this.formatDateForInput(startDate);
            this.endDate.value = this.formatDateForInput(endDate);
        } else if (this.currentMode === 'business') {
            this.businessStartDate.value = this.formatDateForInput(startDate);
            this.businessEndDate.value = this.formatDateForInput(endDate);
        } else if (this.currentMode === 'add') {
            this.baseDate.value = this.formatDateForInput(startDate);
        }

        this.autoCalculate();
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    setTodayAsDefault() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        this.startDate.value = this.formatDateForInput(today);
        this.endDate.value = this.formatDateForInput(tomorrow);
        this.baseDate.value = this.formatDateForInput(today);
        this.businessStartDate.value = this.formatDateForInput(today);
        this.businessEndDate.value = this.formatDateForInput(tomorrow);
    }

    autoCalculate() {
        // Auto calculate if we have required inputs
        setTimeout(() => {
            try {
                this.calculate();
            } catch (error) {
                // Silent fail for auto-calculation
            }
        }, 100);
    }

    copyResultsToClipboard() {
        const results = this.resultsContent.textContent;
        if (results && results !== 'Ready to Calculate') {
            navigator.clipboard.writeText(results).then(() => {
                this.showNotification('Results copied to clipboard!');
            });
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    addToHistory(result) {
        this.results.unshift({
            ...result,
            timestamp: new Date().toISOString()
        });

        // Keep only last 20 results
        if (this.results.length > 20) {
            this.results = this.results.slice(0, 20);
        }
    }

    clearResults() {
        this.resultsContent.innerHTML = `
            <div class="results-placeholder">
                <div class="placeholder-icon">📅</div>
                <h4>Ready to Calculate</h4>
                <p>Select dates and click calculate to see detailed results</p>
            </div>
        `;
    }

    showError(message) {
        this.resultsContent.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h4>Error</h4>
                <p>${message}</p>
            </div>
        `;
    }

    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.calculate();
        }
    }

    saveToStorage() {
        const data = {
            currentMode: this.currentMode,
            results: this.results.slice(0, 10), // Save only recent results
            settings: {
                includeTime: this.includeTime.checked,
                excludeWeekends: this.excludeWeekends.checked,
                excludeUS: this.excludeUS.checked,
                customHolidays: this.customHolidays.checked
            }
        };
        localStorage.setItem('dateDifferenceCalculator', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('dateDifferenceCalculator');
        if (saved) {
            const data = JSON.parse(saved);
            
            if (data.currentMode && data.currentMode !== this.currentMode) {
                this.switchMode(data.currentMode);
            }
            
            if (data.results) {
                this.results = data.results;
            }
            
            if (data.settings) {
                this.includeTime.checked = data.settings.includeTime || false;
                this.excludeWeekends.checked = data.settings.excludeWeekends || false;
                this.excludeUS.checked = data.settings.excludeUS !== undefined ? data.settings.excludeUS : true;
                this.customHolidays.checked = data.settings.customHolidays || false;
                
                // Trigger checkbox change handlers
                this.handleCheckboxChange(this.includeTime);
                this.handleCheckboxChange(this.customHolidays);
            }
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dateCalculator = new DateDifferenceCalculator();
});