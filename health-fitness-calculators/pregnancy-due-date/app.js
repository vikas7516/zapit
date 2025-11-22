class PregnancyDueDateCalculator {
    constructor() {
        this.selectedMethod = 'lmp';
        this.results = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.setDefaultDates();
        this.loadFromStorage();
    }

    bindEvents() {
        // Method selection
        document.querySelectorAll('.method-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectMethod(option.dataset.method);
            });
        });

        // Form inputs
        document.getElementById('lmpDate')?.addEventListener('change', () => this.saveToStorage());
        document.getElementById('cycleLength')?.addEventListener('change', () => this.saveToStorage());
        document.getElementById('conceptionDate')?.addEventListener('change', () => this.saveToStorage());
        document.getElementById('ultrasoundDate')?.addEventListener('change', () => this.saveToStorage());
        document.getElementById('weeks')?.addEventListener('input', () => this.saveToStorage());
        document.getElementById('days')?.addEventListener('input', () => this.saveToStorage());

        // Calculate button
        document.getElementById('calculateBtn')?.addEventListener('click', () => this.calculate());

        // Trimester tabs
        document.querySelectorAll('.trimester-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.showTrimester(tab.dataset.trimester);
            });
        });

        // Action buttons
        document.getElementById('recalculateBtn')?.addEventListener('click', () => this.resetCalculator());
        document.getElementById('saveResultsBtn')?.addEventListener('click', () => this.saveResults());
    }

    selectMethod(method) {
        this.selectedMethod = method;
        
        // Update UI
        document.querySelectorAll('.method-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');
        
        // Update form visibility
        document.querySelectorAll('.method-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${method}Form`).classList.add('active');
        
        this.saveToStorage();
    }

    setDefaultDates() {
        const today = new Date();
        const maxDate = today.toISOString().split('T')[0];
        
        // Set max date for all date inputs
        ['lmpDate', 'conceptionDate', 'ultrasoundDate'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.max = maxDate;
            }
        });
        
        // Set default LMP date to 4 weeks ago
        const defaultLMP = new Date(today);
        defaultLMP.setDate(defaultLMP.getDate() - 28);
        const lmpInput = document.getElementById('lmpDate');
        if (lmpInput && !lmpInput.value) {
            lmpInput.value = defaultLMP.toISOString().split('T')[0];
        }
    }

    validateInputs() {
        switch (this.selectedMethod) {
            case 'lmp':
                const lmpDate = document.getElementById('lmpDate').value;
                if (!lmpDate) {
                    this.showError('Please select your last menstrual period date');
                    return false;
                }
                if (new Date(lmpDate) > new Date()) {
                    this.showError('Last menstrual period cannot be in the future');
                    return false;
                }
                return true;
                
            case 'conception':
                const conceptionDate = document.getElementById('conceptionDate').value;
                if (!conceptionDate) {
                    this.showError('Please select the conception date');
                    return false;
                }
                if (new Date(conceptionDate) > new Date()) {
                    this.showError('Conception date cannot be in the future');
                    return false;
                }
                return true;
                
            case 'ultrasound':
                const ultrasoundDate = document.getElementById('ultrasoundDate').value;
                const weeks = document.getElementById('weeks').value;
                const days = document.getElementById('days').value;
                
                if (!ultrasoundDate) {
                    this.showError('Please select the ultrasound date');
                    return false;
                }
                if (!weeks || weeks < 4 || weeks > 42) {
                    this.showError('Please enter a valid gestational age (4-42 weeks)');
                    return false;
                }
                if (days && (days < 0 || days > 6)) {
                    this.showError('Days must be between 0-6');
                    return false;
                }
                if (new Date(ultrasoundDate) > new Date()) {
                    this.showError('Ultrasound date cannot be in the future');
                    return false;
                }
                return true;
                
            default:
                return false;
        }
    }

    calculate() {
        if (!this.validateInputs()) {
            return;
        }

        let dueDate;
        let conceptionDate;
        let lmpDate;

        switch (this.selectedMethod) {
            case 'lmp':
                lmpDate = new Date(document.getElementById('lmpDate').value);
                const cycleLength = parseInt(document.getElementById('cycleLength').value);
                
                // Calculate conception date (typically ovulation occurs 14 days before next period)
                conceptionDate = new Date(lmpDate);
                conceptionDate.setDate(conceptionDate.getDate() + (cycleLength - 14));
                
                // Calculate due date (280 days from LMP)
                dueDate = new Date(lmpDate);
                dueDate.setDate(dueDate.getDate() + 280);
                break;
                
            case 'conception':
                conceptionDate = new Date(document.getElementById('conceptionDate').value);
                
                // Calculate LMP (14 days before conception for average cycle)
                lmpDate = new Date(conceptionDate);
                lmpDate.setDate(lmpDate.getDate() - 14);
                
                // Calculate due date (266 days from conception)
                dueDate = new Date(conceptionDate);
                dueDate.setDate(dueDate.getDate() + 266);
                break;
                
            case 'ultrasound':
                const ultrasoundDate = new Date(document.getElementById('ultrasoundDate').value);
                const weeks = parseInt(document.getElementById('weeks').value);
                const days = parseInt(document.getElementById('days').value) || 0;
                
                const totalDays = (weeks * 7) + days;
                
                // Calculate due date (280 days total gestation)
                dueDate = new Date(ultrasoundDate);
                dueDate.setDate(dueDate.getDate() + (280 - totalDays));
                
                // Calculate conception date
                conceptionDate = new Date(dueDate);
                conceptionDate.setDate(conceptionDate.getDate() - 266);
                
                // Calculate LMP
                lmpDate = new Date(dueDate);
                lmpDate.setDate(lmpDate.getDate() - 280);
                break;
        }

        this.results = {
            dueDate,
            conceptionDate,
            lmpDate,
            calculatedAt: new Date()
        };

        this.displayResults();
        this.saveToStorage();
    }

    displayResults() {
        const { dueDate, conceptionDate, lmpDate } = this.results;
        const today = new Date();
        
        // Calculate current pregnancy stats
        const totalDays = 280;
        const daysSinceLMP = Math.floor((today - lmpDate) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.floor(daysSinceLMP / 7);
        const currentDay = daysSinceLMP % 7;
        const daysRemaining = Math.max(0, Math.floor((dueDate - today) / (1000 * 60 * 60 * 24)));
        const progressPercentage = Math.min(100, Math.max(0, (daysSinceLMP / totalDays) * 100));

        // Format dates
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        // Update main display
        document.getElementById('dueDateValue').textContent = formatDate(dueDate);
        document.getElementById('currentWeek').textContent = 
            `You are ${currentWeek} weeks${currentDay > 0 ? ` and ${currentDay} day${currentDay > 1 ? 's' : ''}` : ''} pregnant`;
        document.getElementById('daysRemaining').textContent = 
            daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Baby is due now!';
        document.getElementById('progressPercentage').textContent = `${Math.round(progressPercentage)}%`;

        // Update important dates
        document.getElementById('conceptionDateResult').textContent = formatDate(conceptionDate);
        
        const firstTrimesterEnd = new Date(lmpDate);
        firstTrimesterEnd.setDate(firstTrimesterEnd.getDate() + 84); // 12 weeks
        document.getElementById('firstTrimesterEnd').textContent = formatDate(firstTrimesterEnd);
        
        const secondTrimesterEnd = new Date(lmpDate);
        secondTrimesterEnd.setDate(secondTrimesterEnd.getDate() + 182); // 26 weeks
        document.getElementById('secondTrimesterEnd').textContent = formatDate(secondTrimesterEnd);
        
        const fullTermDate = new Date(lmpDate);
        fullTermDate.setDate(fullTermDate.getDate() + 259); // 37 weeks
        document.getElementById('fullTermDate').textContent = formatDate(fullTermDate);

        // Update progress circle
        this.updateProgressCircle(progressPercentage);
        
        // Show current trimester
        this.updateCurrentTrimester(currentWeek);
        
        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.add('visible');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Animate numbers
        this.animateResults();
    }

    updateProgressCircle(percentage) {
        const circle = document.getElementById('progressCircle');
        const circumference = 2 * Math.PI * 54; // radius = 54
        const offset = circumference - (percentage / 100) * circumference;
        
        circle.style.strokeDashoffset = offset;
    }

    updateCurrentTrimester(currentWeek) {
        let currentTrimester;
        if (currentWeek <= 12) {
            currentTrimester = 1;
        } else if (currentWeek <= 26) {
            currentTrimester = 2;
        } else {
            currentTrimester = 3;
        }
        
        this.showTrimester(currentTrimester.toString());
    }

    showTrimester(trimester) {
        // Update tabs
        document.querySelectorAll('.trimester-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-trimester="${trimester}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.trimester-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`trimester${trimester}`).classList.add('active');
    }

    animateResults() {
        // Animate due date value
        const dueDateValue = document.getElementById('dueDateValue');
        dueDateValue.style.transform = 'scale(1.05)';
        dueDateValue.style.opacity = '0.8';
        
        setTimeout(() => {
            dueDateValue.style.transform = 'scale(1)';
            dueDateValue.style.opacity = '1';
        }, 300);

        // Animate progress percentage
        const progressText = document.getElementById('progressPercentage');
        const targetValue = parseInt(progressText.textContent);
        let currentValue = 0;
        const increment = targetValue / 30;
        
        const animateNumber = () => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                progressText.textContent = `${targetValue}%`;
            } else {
                progressText.textContent = `${Math.round(currentValue)}%`;
                requestAnimationFrame(animateNumber);
            }
        };
        
        setTimeout(animateNumber, 500);
    }

    resetCalculator() {
        // Reset form
        document.querySelectorAll('input').forEach(input => {
            if (input.type !== 'submit' && input.type !== 'button') {
                input.value = '';
            }
        });
        
        // Reset to default method
        this.selectMethod('lmp');
        
        // Hide results
        document.getElementById('resultsSection').classList.remove('visible');
        
        // Reset default dates
        this.setDefaultDates();
        
        // Clear storage
        this.results = null;
        localStorage.removeItem('pregnancyCalculatorData');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    saveResults() {
        if (!this.results) return;
        
        const resultsData = {
            ...this.results,
            method: this.selectedMethod,
            savedAt: new Date().toISOString()
        };
        
        // Create downloadable data
        const dataStr = JSON.stringify(resultsData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `pregnancy-due-date-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Results saved successfully!');
    }

    saveToStorage() {
        const data = {
            selectedMethod: this.selectedMethod,
            formData: {
                lmpDate: document.getElementById('lmpDate')?.value || '',
                cycleLength: document.getElementById('cycleLength')?.value || '28',
                conceptionDate: document.getElementById('conceptionDate')?.value || '',
                ultrasoundDate: document.getElementById('ultrasoundDate')?.value || '',
                weeks: document.getElementById('weeks')?.value || '',
                days: document.getElementById('days')?.value || ''
            },
            results: this.results,
            timestamp: Date.now()
        };
        
        localStorage.setItem('pregnancyCalculatorData', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('pregnancyCalculatorData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                // Load data if it's less than 7 days old
                if (Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
                    // Restore method selection
                    this.selectMethod(data.selectedMethod);
                    
                    // Restore form data
                    Object.entries(data.formData).forEach(([key, value]) => {
                        const element = document.getElementById(key);
                        if (element && value) {
                            element.value = value;
                        }
                    });
                    
                    // Restore results if available
                    if (data.results) {
                        this.results = {
                            ...data.results,
                            dueDate: new Date(data.results.dueDate),
                            conceptionDate: new Date(data.results.conceptionDate),
                            lmpDate: new Date(data.results.lmpDate),
                            calculatedAt: new Date(data.results.calculatedAt)
                        };
                        this.displayResults();
                    }
                }
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            transform: translateX(400px);
        `;
        
        if (type === 'error') {
            messageDiv.style.background = '#ef4444';
            messageDiv.innerHTML = `<span>⚠️</span><span>${message}</span>`;
        } else {
            messageDiv.style.background = '#10b981';
            messageDiv.innerHTML = `<span>✅</span><span>${message}</span>`;
        }
        
        document.body.appendChild(messageDiv);
        
        // Animate in
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(400px)';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, type === 'error' ? 5000 : 3000);
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PregnancyDueDateCalculator();
});