class DailyCalorieCalculator {
    constructor() {
        this.currentStep = 1;
        this.userData = {
            gender: '',
            age: '',
            height: '',
            weight: '',
            unit: 'metric',
            activityLevel: '',
            goal: '',
            weightChangeRate: ''
        };
        
        this.activityMultipliers = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            very: 1.725,
            extra: 1.9
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStepIndicator();
        this.loadFromStorage();
    }

    bindEvents() {
        // Unit toggle
        document.querySelectorAll('input[name="unit"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.userData.unit = e.target.value;
                this.toggleUnits();
            });
        });

        // Form inputs
        document.getElementById('gender')?.addEventListener('change', (e) => {
            this.userData.gender = e.target.value;
        });

        document.getElementById('age')?.addEventListener('input', (e) => {
            this.userData.age = e.target.value;
        });

        document.getElementById('height')?.addEventListener('input', (e) => {
            this.userData.height = e.target.value;
        });

        document.getElementById('weight')?.addEventListener('input', (e) => {
            this.userData.weight = e.target.value;
        });

        // Activity options
        document.querySelectorAll('.activity-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.activity-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.userData.activityLevel = option.dataset.activity;
            });
        });

        // Goal options
        document.querySelectorAll('.goal-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.goal-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.userData.goal = option.dataset.goal;
                this.toggleWeightChangeSection();
            });
        });

        // Weight change rate
        document.getElementById('weightChangeRate')?.addEventListener('change', (e) => {
            this.userData.weightChangeRate = e.target.value;
        });

        // Navigation buttons
        document.getElementById('nextStep1')?.addEventListener('click', () => this.nextStep());
        document.getElementById('nextStep2')?.addEventListener('click', () => this.nextStep());
        document.getElementById('prevStep2')?.addEventListener('click', () => this.prevStep());
        document.getElementById('prevStep3')?.addEventListener('click', () => this.prevStep());
        document.getElementById('calculate')?.addEventListener('click', () => this.calculate());
        document.getElementById('recalculate')?.addEventListener('click', () => this.resetCalculator());
    }

    toggleUnits() {
        const heightLabel = document.querySelector('label[for="height"]');
        const weightLabel = document.querySelector('label[for="weight"]');
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');

        if (this.userData.unit === 'metric') {
            heightLabel.textContent = 'Height (cm)';
            weightLabel.textContent = 'Weight (kg)';
            heightInput.placeholder = 'e.g., 175';
            weightInput.placeholder = 'e.g., 70';
        } else {
            heightLabel.textContent = 'Height (inches)';
            weightLabel.textContent = 'Weight (lbs)';
            heightInput.placeholder = 'e.g., 69';
            weightInput.placeholder = 'e.g., 154';
        }
    }

    toggleWeightChangeSection() {
        const section = document.querySelector('.weight-change-section');
        if (this.userData.goal === 'maintain') {
            section.classList.add('hidden');
        } else {
            section.classList.remove('hidden');
        }
    }

    validateStep(step) {
        switch (step) {
            case 1:
                return this.userData.gender && this.userData.age && this.userData.height && this.userData.weight;
            case 2:
                return this.userData.activityLevel;
            case 3:
                if (this.userData.goal === 'maintain') {
                    return true;
                }
                return this.userData.goal && this.userData.weightChangeRate;
            default:
                return false;
        }
    }

    nextStep() {
        if (!this.validateStep(this.currentStep)) {
            this.showError(`Please fill in all required fields for Step ${this.currentStep}`);
            return;
        }

        this.currentStep++;
        this.updateStepIndicator();
        this.showStep(this.currentStep);
        this.saveToStorage();
    }

    prevStep() {
        this.currentStep--;
        this.updateStepIndicator();
        this.showStep(this.currentStep);
    }

    showStep(step) {
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`step${step}`).classList.add('active');
    }

    updateStepIndicator() {
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index + 1 <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    calculateBMR() {
        let height = parseFloat(this.userData.height);
        let weight = parseFloat(this.userData.weight);
        
        // Convert to metric if needed
        if (this.userData.unit === 'imperial') {
            height = height * 2.54; // inches to cm
            weight = weight * 0.453592; // lbs to kg
        }
        
        // Mifflin-St Jeor Equation
        let bmr;
        if (this.userData.gender === 'male') {
            bmr = (10 * weight) + (6.25 * height) - (5 * parseInt(this.userData.age)) + 5;
        } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * parseInt(this.userData.age)) - 161;
        }
        
        return Math.round(bmr);
    }

    calculateTDEE(bmr) {
        const multiplier = this.activityMultipliers[this.userData.activityLevel];
        return Math.round(bmr * multiplier);
    }

    calculateGoalCalories(tdee) {
        if (this.userData.goal === 'maintain') {
            return tdee;
        }
        
        const rateMultipliers = {
            '0.25': 275,  // 0.25 kg/week = 275 cal/day
            '0.5': 550,   // 0.5 kg/week = 550 cal/day
            '0.75': 825,  // 0.75 kg/week = 825 cal/day
            '1': 1100     // 1 kg/week = 1100 cal/day
        };
        
        const calorieAdjustment = rateMultipliers[this.userData.weightChangeRate] || 550;
        
        if (this.userData.goal === 'lose') {
            return Math.round(tdee - calorieAdjustment);
        } else if (this.userData.goal === 'gain') {
            return Math.round(tdee + calorieAdjustment);
        }
        
        return tdee;
    }

    calculateMacros(goalCalories) {
        // Standard macro distribution: 30% protein, 40% carbs, 30% fats
        const proteinCalories = Math.round(goalCalories * 0.30);
        const carbCalories = Math.round(goalCalories * 0.40);
        const fatCalories = Math.round(goalCalories * 0.30);
        
        return {
            protein: {
                grams: Math.round(proteinCalories / 4),
                calories: proteinCalories,
                percentage: 30
            },
            carbs: {
                grams: Math.round(carbCalories / 4),
                calories: carbCalories,
                percentage: 40
            },
            fats: {
                grams: Math.round(fatCalories / 9),
                calories: fatCalories,
                percentage: 30
            }
        };
    }

    calculate() {
        if (!this.validateStep(3)) {
            this.showError('Please complete all steps before calculating');
            return;
        }

        const bmr = this.calculateBMR();
        const tdee = this.calculateTDEE(bmr);
        const goalCalories = this.calculateGoalCalories(tdee);
        const macros = this.calculateMacros(goalCalories);

        this.displayResults(bmr, tdee, goalCalories, macros);
        this.showStep(4);
        this.saveToStorage();
    }

    displayResults(bmr, tdee, goalCalories, macros) {
        // Update calories display
        document.getElementById('bmrValue').textContent = bmr.toLocaleString();
        document.getElementById('tdeeValue').textContent = tdee.toLocaleString();
        document.getElementById('goalValue').textContent = goalCalories.toLocaleString();

        // Update macros
        document.getElementById('proteinGrams').textContent = macros.protein.grams;
        document.getElementById('proteinCalories').textContent = `${macros.protein.calories} cal`;
        document.getElementById('carbsGrams').textContent = macros.carbs.grams;
        document.getElementById('carbsCalories').textContent = `${macros.carbs.calories} cal`;
        document.getElementById('fatsGrams').textContent = macros.fats.grams;
        document.getElementById('fatsCalories').textContent = `${macros.fats.calories} cal`;

        // Animate the numbers
        this.animateNumbers();
        
        // Update recommendations
        this.updateRecommendations(goalCalories, tdee);
    }

    animateNumbers() {
        const numbers = document.querySelectorAll('.calorie-value, .macro-grams');
        numbers.forEach(number => {
            number.style.transform = 'scale(1.1)';
            setTimeout(() => {
                number.style.transform = 'scale(1)';
            }, 200);
        });
    }

    updateRecommendations(goalCalories, tdee) {
        const deficit = tdee - goalCalories;
        const recommendations = document.querySelector('.recommendations .recommendations-list');
        
        let tips = [];
        
        if (this.userData.goal === 'lose') {
            tips = [
                {
                    icon: '🥗',
                    title: 'Focus on Whole Foods',
                    text: 'Eat plenty of vegetables, lean proteins, and whole grains to feel full while staying within your calorie limit.'
                },
                {
                    icon: '💧',
                    title: 'Stay Hydrated',
                    text: 'Drink plenty of water throughout the day. Sometimes thirst is mistaken for hunger.'
                },
                {
                    icon: '⏰',
                    title: 'Meal Timing',
                    text: 'Consider eating smaller, more frequent meals to help manage hunger and maintain energy levels.'
                }
            ];
        } else if (this.userData.goal === 'gain') {
            tips = [
                {
                    icon: '🥜',
                    title: 'Calorie-Dense Foods',
                    text: 'Include healthy fats like nuts, avocados, and olive oil to increase calories without excessive volume.'
                },
                {
                    icon: '🏋️',
                    title: 'Strength Training',
                    text: 'Combine your calorie surplus with resistance training to build muscle rather than just fat.'
                },
                {
                    icon: '🥛',
                    title: 'Liquid Calories',
                    text: 'Consider protein shakes or smoothies to add calories without feeling overly full.'
                }
            ];
        } else {
            tips = [
                {
                    icon: '⚖️',
                    title: 'Balance is Key',
                    text: 'Focus on maintaining a balanced diet with appropriate portions from all food groups.'
                },
                {
                    icon: '📊',
                    title: 'Monitor Progress',
                    text: 'Track your weight weekly and adjust calories if you notice unwanted changes.'
                },
                {
                    icon: '🎯',
                    title: 'Consistency',
                    text: 'Stick to your calorie target most days, but don\'t stress about occasional variations.'
                }
            ];
        }
        
        recommendations.innerHTML = tips.map(tip => `
            <div class="tip-item">
                <div class="tip-icon">${tip.icon}</div>
                <div class="tip-content">
                    <h5>${tip.title}</h5>
                    <p>${tip.text}</p>
                </div>
            </div>
        `).join('');
    }

    resetCalculator() {
        this.currentStep = 1;
        this.userData = {
            gender: '',
            age: '',
            height: '',
            weight: '',
            unit: 'metric',
            activityLevel: '',
            goal: '',
            weightChangeRate: ''
        };
        
        // Reset form
        document.querySelectorAll('input, select').forEach(input => {
            if (input.type === 'radio') {
                input.checked = input.value === 'metric';
            } else {
                input.value = '';
            }
        });
        
        // Reset selections
        document.querySelectorAll('.activity-option, .goal-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Hide weight change section
        document.querySelector('.weight-change-section').classList.add('hidden');
        
        this.updateStepIndicator();
        this.showStep(1);
        this.toggleUnits();
        localStorage.removeItem('dailyCalorieData');
    }

    saveToStorage() {
        const data = {
            userData: this.userData,
            currentStep: this.currentStep,
            timestamp: Date.now()
        };
        localStorage.setItem('dailyCalorieData', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('dailyCalorieData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // Load data if it's less than 24 hours old
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    this.userData = { ...this.userData, ...data.userData };
                    this.populateForm();
                }
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    populateForm() {
        // Set form values
        if (this.userData.gender) document.getElementById('gender').value = this.userData.gender;
        if (this.userData.age) document.getElementById('age').value = this.userData.age;
        if (this.userData.height) document.getElementById('height').value = this.userData.height;
        if (this.userData.weight) document.getElementById('weight').value = this.userData.weight;
        if (this.userData.weightChangeRate) document.getElementById('weightChangeRate').value = this.userData.weightChangeRate;
        
        // Set unit radio
        document.querySelectorAll('input[name="unit"]').forEach(radio => {
            radio.checked = radio.value === this.userData.unit;
        });
        
        // Set activity selection
        if (this.userData.activityLevel) {
            document.querySelector(`[data-activity="${this.userData.activityLevel}"]`)?.classList.add('selected');
        }
        
        // Set goal selection
        if (this.userData.goal) {
            document.querySelector(`[data-goal="${this.userData.goal}"]`)?.classList.add('selected');
            this.toggleWeightChangeSection();
        }
        
        this.toggleUnits();
    }

    showError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = `
                background: #fee;
                color: #c53030;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                border: 1px solid #fed7d7;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;
            const currentStep = document.querySelector('.step-content.active');
            currentStep.insertBefore(errorDiv, currentStep.firstChild);
        }
        
        errorDiv.innerHTML = `
            <span>⚠️</span>
            <span>${message}</span>
        `;
        
        // Remove error after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DailyCalorieCalculator();
});