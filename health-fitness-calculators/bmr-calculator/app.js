// BMR Calculator JavaScript

class BMRCalculator {
    constructor() {
        this.currentUnit = 'metric';
        this.currentGender = 'male';
        this.initializeElements();
        this.attachEventListeners();
        this.loadSavedData();
    }

    initializeElements() {
        // Unit toggle buttons
        this.metricBtn = document.getElementById('metricBtn');
        this.imperialBtn = document.getElementById('imperialBtn');
        
        // Gender buttons
        this.maleBtn = document.getElementById('maleBtn');
        this.femaleBtn = document.getElementById('femaleBtn');
        
        // Input groups
        this.metricInputs = document.getElementById('metricInputs');
        this.imperialInputs = document.getElementById('imperialInputs');
        
        // Common inputs
        this.age = document.getElementById('age');
        
        // Metric inputs
        this.heightCm = document.getElementById('heightCm');
        this.weightKg = document.getElementById('weightKg');
        
        // Imperial inputs
        this.heightFt = document.getElementById('heightFt');
        this.heightIn = document.getElementById('heightIn');
        this.weightLbs = document.getElementById('weightLbs');
        
        // Results elements
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resultsPanel = document.getElementById('resultsPanel');
        this.bmrValue = document.getElementById('bmrValue');
        this.recalculateBtn = document.getElementById('recalculateBtn');
        this.shareBtn = document.getElementById('shareBtn');
        
        // Activity level elements
        this.activityElements = {
            sedentary: document.getElementById('sedentary'),
            light: document.getElementById('light'),
            moderate: document.getElementById('moderate'),
            active: document.getElementById('active'),
            extreme: document.getElementById('extreme')
        };
    }

    attachEventListeners() {
        // Unit toggle
        this.metricBtn.addEventListener('click', () => this.switchUnit('metric'));
        this.imperialBtn.addEventListener('click', () => this.switchUnit('imperial'));
        
        // Gender toggle
        this.maleBtn.addEventListener('click', () => this.switchGender('male'));
        this.femaleBtn.addEventListener('click', () => this.switchGender('female'));
        
        // Calculate button
        this.calculateBtn.addEventListener('click', () => this.calculateBMR());
        
        // Enter key support
        const inputs = [this.age, this.heightCm, this.weightKg, this.heightFt, this.heightIn, this.weightLbs];
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.calculateBMR();
                });
                input.addEventListener('input', () => this.saveInputData());
            }
        });
        
        // Action buttons
        this.recalculateBtn?.addEventListener('click', () => this.showCalculator());
        this.shareBtn?.addEventListener('click', () => this.shareResults());
    }

    switchUnit(unit) {
        this.currentUnit = unit;
        
        if (unit === 'metric') {
            this.metricBtn.classList.add('active');
            this.imperialBtn.classList.remove('active');
            this.metricInputs.classList.remove('hidden');
            this.imperialInputs.classList.add('hidden');
        } else {
            this.imperialBtn.classList.add('active');
            this.metricBtn.classList.remove('active');
            this.imperialInputs.classList.remove('hidden');
            this.metricInputs.classList.add('hidden');
        }
        
        localStorage.setItem('bmrCalculatorUnit', unit);
    }

    switchGender(gender) {
        this.currentGender = gender;
        
        if (gender === 'male') {
            this.maleBtn.classList.add('active');
            this.femaleBtn.classList.remove('active');
        } else {
            this.femaleBtn.classList.add('active');
            this.maleBtn.classList.remove('active');
        }
        
        localStorage.setItem('bmrCalculatorGender', gender);
    }

    calculateBMR() {
        const age = parseFloat(this.age.value);
        let height, weight;
        
        // Validate age
        if (!age || age < 1 || age > 120) {
            this.showError('Please enter a valid age between 1-120 years');
            return;
        }
        
        if (this.currentUnit === 'metric') {
            height = parseFloat(this.heightCm.value);
            weight = parseFloat(this.weightKg.value);
            
            if (!this.validateMetricInputs(height, weight)) return;
            
        } else {
            const feet = parseFloat(this.heightFt.value) || 0;
            const inches = parseFloat(this.heightIn.value) || 0;
            weight = parseFloat(this.weightLbs.value);
            
            if (!this.validateImperialInputs(feet, inches, weight)) return;
            
            // Convert to metric
            height = (feet * 12 + inches) * 2.54; // to cm
            weight = weight * 0.453592; // to kg
        }
        
        const bmr = this.computeBMR(height, weight, age, this.currentGender);
        this.displayResults(bmr);
        this.saveCalculation(bmr, height, weight, age);
    }

    validateMetricInputs(height, weight) {
        if (!height || height < 50 || height > 250) {
            this.showError('Please enter a valid height between 50-250 cm');
            return false;
        }
        
        if (!weight || weight < 20 || weight > 300) {
            this.showError('Please enter a valid weight between 20-300 kg');
            return false;
        }
        
        return true;
    }

    validateImperialInputs(feet, inches, weight) {
        if (!feet || feet < 3 || feet > 8) {
            this.showError('Please enter valid feet (3-8)');
            return false;
        }
        
        if (inches < 0 || inches > 11) {
            this.showError('Please enter valid inches (0-11)');
            return false;
        }
        
        if (!weight || weight < 50 || weight > 700) {
            this.showError('Please enter a valid weight between 50-700 lbs');
            return false;
        }
        
        return true;
    }

    computeBMR(heightCm, weightKg, age, gender) {
        // Mifflin-St Jeor Equation
        let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
        
        if (gender === 'male') {
            bmr += 5;
        } else {
            bmr -= 161;
        }
        
        return Math.round(bmr);
    }

    displayResults(bmr) {
        // Show results panel
        this.resultsPanel.classList.remove('hidden');
        this.resultsPanel.scrollIntoView({ behavior: 'smooth' });
        
        // Display BMR value with animation
        this.animateValue(this.bmrValue, 0, bmr, 1000);
        
        // Calculate and display TDEE values
        const activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            extreme: 1.9
        };
        
        // Animate TDEE values
        Object.entries(activityMultipliers).forEach(([level, multiplier], index) => {
            const calories = Math.round(bmr * multiplier);
            setTimeout(() => {
                this.animateValue(this.activityElements[level], 0, calories, 800, ' cal/day');
            }, index * 200);
        });
        
        // Animate breakdown chart
        this.animateBreakdownChart();
    }

    animateValue(element, start, end, duration, suffix = '') {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * easeOut);
            
            element.textContent = current.toLocaleString() + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    animateBreakdownChart() {
        const breakdownFills = document.querySelectorAll('.breakdown-fill');
        breakdownFills.forEach((fill, index) => {
            setTimeout(() => {
                fill.style.animation = 'fillAnimation 1s ease-out';
            }, index * 100);
        });
    }

    showCalculator() {
        this.resultsPanel.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    shareResults() {
        const bmr = this.bmrValue.textContent;
        const shareText = `My BMR is ${bmr} calories/day! Calculate yours at Zapit.`;
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'BMR Calculator Results',
                text: shareText,
                url: shareUrl
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
                this.showNotification('Results copied to clipboard!');
            });
        }
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            this.calculateBtn.parentNode.insertBefore(errorDiv, this.calculateBtn.nextSibling);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showNotification(message) {
        // Simple notification
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveInputData() {
        const data = {
            unit: this.currentUnit,
            gender: this.currentGender,
            age: this.age?.value || '',
            heightCm: this.heightCm?.value || '',
            weightKg: this.weightKg?.value || '',
            heightFt: this.heightFt?.value || '',
            heightIn: this.heightIn?.value || '',
            weightLbs: this.weightLbs?.value || ''
        };
        
        localStorage.setItem('bmrCalculatorInputs', JSON.stringify(data));
    }

    loadSavedData() {
        // Load unit preference
        const savedUnit = localStorage.getItem('bmrCalculatorUnit');
        if (savedUnit) {
            this.switchUnit(savedUnit);
        }
        
        // Load gender preference
        const savedGender = localStorage.getItem('bmrCalculatorGender');
        if (savedGender) {
            this.switchGender(savedGender);
        }
        
        // Load input values
        const savedInputs = localStorage.getItem('bmrCalculatorInputs');
        if (savedInputs) {
            try {
                const data = JSON.parse(savedInputs);
                if (this.age && data.age) this.age.value = data.age;
                if (this.heightCm && data.heightCm) this.heightCm.value = data.heightCm;
                if (this.weightKg && data.weightKg) this.weightKg.value = data.weightKg;
                if (this.heightFt && data.heightFt) this.heightFt.value = data.heightFt;
                if (this.heightIn && data.heightIn) this.heightIn.value = data.heightIn;
                if (this.weightLbs && data.weightLbs) this.weightLbs.value = data.weightLbs;
            } catch (e) {
                console.log('Error loading saved data');
            }
        }
    }

    saveCalculation(bmr, height, weight, age) {
        const calculation = {
            bmr: bmr,
            height,
            weight,
            age,
            gender: this.currentGender,
            unit: this.currentUnit,
            date: new Date().toISOString()
        };
        
        let history = JSON.parse(localStorage.getItem('bmrHistory') || '[]');
        history.unshift(calculation);
        history = history.slice(0, 10); // Keep last 10 calculations
        
        localStorage.setItem('bmrHistory', JSON.stringify(history));
    }
}

// Initialize the BMR calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bmrCalculator = new BMRCalculator();
});

// Add CSS for error message and notification animations
const style = document.createElement('style');
style.textContent = `
    .error-message {
        background: var(--error-bg, #fee);
        color: var(--error-color, #c53030);
        border: 1px solid var(--error-border, #fc8181);
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
        display: none;
        animation: shake 0.5s ease-in-out;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);