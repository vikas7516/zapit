// BMI Calculator JavaScript

class BMICalculator {
    constructor() {
        this.currentUnit = 'metric';
        this.initializeElements();
        this.attachEventListeners();
        this.loadSavedData();
    }

    initializeElements() {
        // Unit toggle buttons
        this.metricBtn = document.getElementById('metricBtn');
        this.imperialBtn = document.getElementById('imperialBtn');
        
        // Input groups
        this.metricInputs = document.getElementById('metricInputs');
        this.imperialInputs = document.getElementById('imperialInputs');
        
        // Metric inputs
        this.heightCm = document.getElementById('heightCm');
        this.weightKg = document.getElementById('weightKg');
        
        // Imperial inputs
        this.heightFt = document.getElementById('heightFt');
        this.heightIn = document.getElementById('heightIn');
        this.weightLbs = document.getElementById('weightLbs');
        
        // Buttons and results
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resultsPanel = document.getElementById('resultsPanel');
        this.bmiValue = document.getElementById('bmiValue');
        this.bmiCategory = document.getElementById('bmiCategory');
        this.bmiIndicator = document.getElementById('bmiIndicator');
        this.insightsContent = document.getElementById('insightsContent');
        this.recalculateBtn = document.getElementById('recalculateBtn');
        this.shareBtn = document.getElementById('shareBtn');
    }

    attachEventListeners() {
        // Unit toggle
        this.metricBtn.addEventListener('click', () => this.switchUnit('metric'));
        this.imperialBtn.addEventListener('click', () => this.switchUnit('imperial'));
        
        // Calculate button
        this.calculateBtn.addEventListener('click', () => this.calculateBMI());
        
        // Enter key support
        const inputs = [this.heightCm, this.weightKg, this.heightFt, this.heightIn, this.weightLbs];
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.calculateBMI();
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
        
        localStorage.setItem('bmiCalculatorUnit', unit);
    }

    calculateBMI() {
        let height, weight;
        
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
        
        const bmi = this.computeBMI(height, weight);
        this.displayResults(bmi, height, weight);
        this.saveCalculation(bmi, height, weight);
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

    computeBMI(heightCm, weightKg) {
        const heightM = heightCm / 100;
        return weightKg / (heightM * heightM);
    }

    displayResults(bmi, height, weight) {
        // Show results panel
        this.resultsPanel.classList.remove('hidden');
        this.resultsPanel.scrollIntoView({ behavior: 'smooth' });
        
        // Display BMI value
        this.bmiValue.textContent = bmi.toFixed(1);
        
        // Determine category
        const category = this.getBMICategory(bmi);
        this.bmiCategory.textContent = category.name;
        this.bmiCategory.className = `bmi-category ${category.class}`;
        
        // Position indicator on chart
        this.positionIndicator(bmi);
        
        // Generate health insights
        this.generateInsights(bmi, category, height, weight);
    }

    getBMICategory(bmi) {
        if (bmi < 18.5) {
            return { name: 'Underweight', class: 'underweight' };
        } else if (bmi < 25) {
            return { name: 'Normal Weight', class: 'normal' };
        } else if (bmi < 30) {
            return { name: 'Overweight', class: 'overweight' };
        } else {
            return { name: 'Obese', class: 'obese' };
        }
    }

    positionIndicator(bmi) {
        // BMI chart ranges: Underweight (0-18.5), Normal (18.5-25), Overweight (25-30), Obese (30+)
        let position;
        
        if (bmi < 18.5) {
            position = (bmi / 18.5) * 25; // First 25% of chart
        } else if (bmi < 25) {
            position = 25 + ((bmi - 18.5) / (25 - 18.5)) * 25; // Second 25%
        } else if (bmi < 30) {
            position = 50 + ((bmi - 25) / (30 - 25)) * 25; // Third 25%
        } else {
            position = 75 + Math.min(((bmi - 30) / 10) * 25, 25); // Last 25%, capped
        }
        
        this.bmiIndicator.style.left = `${Math.min(position, 100)}%`;
    }

    generateInsights(bmi, category, height, weight) {
        const insights = [];
        
        // Category-specific insights
        switch (category.class) {
            case 'underweight':
                insights.push({
                    icon: '⚠️',
                    title: 'Below Healthy Weight Range',
                    content: 'Consider consulting with a healthcare provider or nutritionist to develop a healthy weight gain plan.'
                });
                insights.push({
                    icon: '🍎',
                    title: 'Nutrition Focus',
                    content: 'Focus on nutrient-dense foods and consider increasing caloric intake with healthy fats, proteins, and complex carbohydrates.'
                });
                break;
                
            case 'normal':
                insights.push({
                    icon: '✅',
                    title: 'Healthy Weight Range',
                    content: 'Your BMI falls within the healthy weight range. Maintain your current lifestyle with regular exercise and balanced nutrition.'
                });
                insights.push({
                    icon: '💪',
                    title: 'Maintenance Tips',
                    content: 'Continue with regular physical activity (150+ minutes moderate exercise per week) and a balanced diet.'
                });
                break;
                
            case 'overweight':
                insights.push({
                    icon: '⚡',
                    title: 'Weight Management',
                    content: 'Consider gradual weight loss through a combination of dietary changes and increased physical activity.'
                });
                insights.push({
                    icon: '🎯',
                    title: 'Healthy Goal',
                    content: `A healthy weight range for your height would be ${this.getHealthyWeightRange(height)}.`
                });
                break;
                
            case 'obese':
                insights.push({
                    icon: '🏥',
                    title: 'Health Consultation',
                    content: 'Consider consulting with healthcare professionals for a comprehensive weight management plan.'
                });
                insights.push({
                    icon: '📉',
                    title: 'Gradual Approach',
                    content: 'Focus on gradual, sustainable changes. Even a 5-10% weight loss can significantly improve health outcomes.'
                });
                break;
        }
        
        // General health insights
        insights.push({
            icon: '📊',
            title: 'BMI Limitations',
            content: 'BMI doesn\'t distinguish between muscle and fat mass. Athletes and very muscular individuals may have higher BMIs despite being healthy.'
        });
        
        // Render insights
        this.insightsContent.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-content">
                    <h5>${insight.title}</h5>
                    <p>${insight.content}</p>
                </div>
            </div>
        `).join('');
    }

    getHealthyWeightRange(heightCm) {
        const heightM = heightCm / 100;
        const minWeight = (18.5 * heightM * heightM).toFixed(1);
        const maxWeight = (24.9 * heightM * heightM).toFixed(1);
        
        if (this.currentUnit === 'metric') {
            return `${minWeight} - ${maxWeight} kg`;
        } else {
            const minLbs = (minWeight * 2.20462).toFixed(0);
            const maxLbs = (maxWeight * 2.20462).toFixed(0);
            return `${minLbs} - ${maxLbs} lbs`;
        }
    }

    showCalculator() {
        this.resultsPanel.classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    shareResults() {
        const bmi = this.bmiValue.textContent;
        const category = this.bmiCategory.textContent;
        
        const shareText = `My BMI is ${bmi} (${category}). Calculate yours at Zapit!`;
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'BMI Calculator Results',
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
            heightCm: this.heightCm?.value || '',
            weightKg: this.weightKg?.value || '',
            heightFt: this.heightFt?.value || '',
            heightIn: this.heightIn?.value || '',
            weightLbs: this.weightLbs?.value || ''
        };
        
        localStorage.setItem('bmiCalculatorInputs', JSON.stringify(data));
    }

    loadSavedData() {
        // Load unit preference
        const savedUnit = localStorage.getItem('bmiCalculatorUnit');
        if (savedUnit) {
            this.switchUnit(savedUnit);
        }
        
        // Load input values
        const savedInputs = localStorage.getItem('bmiCalculatorInputs');
        if (savedInputs) {
            try {
                const data = JSON.parse(savedInputs);
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

    saveCalculation(bmi, height, weight) {
        const calculation = {
            bmi: bmi.toFixed(1),
            height,
            weight,
            unit: this.currentUnit,
            date: new Date().toISOString(),
            category: this.getBMICategory(bmi).name
        };
        
        let history = JSON.parse(localStorage.getItem('bmiHistory') || '[]');
        history.unshift(calculation);
        history = history.slice(0, 10); // Keep last 10 calculations
        
        localStorage.setItem('bmiHistory', JSON.stringify(history));
    }
}

// Initialize the BMI calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.bmiCalculator = new BMICalculator();
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