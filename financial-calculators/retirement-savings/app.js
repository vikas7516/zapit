class RetirementCalculator {
    constructor() {
        this.chart = null;
        this.initializeEventListeners();
        this.calculate();
    }

            initializeEventListeners() {
                // Input change listeners
                const inputs = [
                    'currentAge', 'retirementAge', 'lifeExpectancy', 'currentSalary',
                    'retirementIncome', 'inflationRate', 'expectedReturn', 'postRetirementReturn',
                    'currentSavings', 'monthlySIP', 'employerContribution', 'annualIncrement'
                ];

                inputs.forEach(id => {
                    document.getElementById(id).addEventListener('input', () => this.calculate());
                });

                // Scenario tabs
                document.querySelectorAll('.scenario-tab').forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        this.switchScenario(e.target.dataset.scenario);
                    });
                });
            }

            calculate() {
                const data = this.getInputData();
                const calculations = this.performCalculations(data);
                
                this.updateResults(calculations);
                this.updateChart(calculations);
                this.updateMilestones(calculations);
                this.updateRecommendations(calculations);
                this.updateScenarios(data);
            }

            getInputData() {
                return {
                    currentAge: parseInt(document.getElementById('currentAge').value) || 30,
                    retirementAge: parseInt(document.getElementById('retirementAge').value) || 60,
                    lifeExpectancy: parseInt(document.getElementById('lifeExpectancy').value) || 80,
                    currentSalary: parseFloat(document.getElementById('currentSalary').value) || 1200000,
                    retirementIncome: parseFloat(document.getElementById('retirementIncome').value) || 50000,
                    inflationRate: parseFloat(document.getElementById('inflationRate').value) || 6,
                    expectedReturn: parseFloat(document.getElementById('expectedReturn').value) || 12,
                    postRetirementReturn: parseFloat(document.getElementById('postRetirementReturn').value) || 8,
                    currentSavings: parseFloat(document.getElementById('currentSavings').value) || 500000,
                    monthlySIP: parseFloat(document.getElementById('monthlySIP').value) || 10000,
                    employerContribution: parseFloat(document.getElementById('employerContribution').value) || 5000,
                    annualIncrement: parseFloat(document.getElementById('annualIncrement').value) || 8
                };
            }

            performCalculations(data) {
                const yearsToRetirement = data.retirementAge - data.currentAge;
                const retirementYears = data.lifeExpectancy - data.retirementAge;
                
                // Adjust retirement income for inflation
                const inflationAdjustedIncome = data.retirementIncome * Math.pow(1 + data.inflationRate/100, yearsToRetirement);
                const annualRetirementNeeds = inflationAdjustedIncome * 12;
                
                // Calculate required corpus using present value of annuity
                const requiredCorpus = this.calculateRequiredCorpus(annualRetirementNeeds, retirementYears, data.postRetirementReturn, data.inflationRate);
                
                // Calculate projected corpus
                const projectedCorpus = this.calculateProjectedCorpus(data, yearsToRetirement);
                
                // Calculate shortfall and additional SIP needed
                const shortfall = Math.max(0, requiredCorpus - projectedCorpus);
                const additionalSIP = shortfall > 0 ? this.calculateAdditionalSIP(shortfall, yearsToRetirement, data.expectedReturn) : 0;
                
                // Generate year-by-year projections
                const yearlyProjections = this.generateYearlyProjections(data, yearsToRetirement);
                
                return {
                    yearsToRetirement,
                    retirementYears,
                    requiredCorpus,
                    projectedCorpus,
                    shortfall,
                    additionalSIP,
                    inflationAdjustedIncome,
                    yearlyProjections
                };
            }

            calculateRequiredCorpus(annualNeeds, years, returnRate, inflationRate) {
                // Real return rate (adjusted for inflation)
                const realReturn = ((1 + returnRate/100) / (1 + inflationRate/100)) - 1;
                
                if (realReturn <= 0) {
                    return annualNeeds * years; // Simple multiplication if no real growth
                }
                
                // Present value of growing annuity
                return annualNeeds * ((1 - Math.pow(1 + realReturn, -years)) / realReturn);
            }

            calculateProjectedCorpus(data, years) {
                let currentValue = data.currentSavings;
                let monthlyContribution = data.monthlySIP + data.employerContribution;
                
                // Future value of current savings
                const futureValueCurrent = currentValue * Math.pow(1 + data.expectedReturn/100, years);
                
                // Future value of monthly contributions with annual increments
                let futureValueSIP = 0;
                for (let year = 1; year <= years; year++) {
                    const yearlyContribution = monthlyContribution * 12 * Math.pow(1 + data.annualIncrement/100, year - 1);
                    const yearsRemaining = years - year + 1;
                    futureValueSIP += yearlyContribution * Math.pow(1 + data.expectedReturn/100, yearsRemaining - 1);
                }
                
                return futureValueCurrent + futureValueSIP;
            }

            calculateAdditionalSIP(shortfall, years, returnRate) {
                const monthlyRate = returnRate / 100 / 12;
                const totalMonths = years * 12;
                
                if (monthlyRate === 0) {
                    return shortfall / totalMonths;
                }
                
                // PMT formula for annuity
                return shortfall * monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1);
            }

            generateYearlyProjections(data, years) {
                const projections = [];
                let currentValue = data.currentSavings;
                let monthlyContribution = data.monthlySIP + data.employerContribution;
                
                for (let year = 1; year <= years; year++) {
                    const annualContribution = monthlyContribution * 12;
                    currentValue = (currentValue + annualContribution) * (1 + data.expectedReturn/100);
                    monthlyContribution *= (1 + data.annualIncrement/100);
                    
                    projections.push({
                        year: data.currentAge + year,
                        value: currentValue,
                        contribution: annualContribution
                    });
                }
                
                return projections;
            }

            updateResults(calculations) {
                document.getElementById('yearsToRetirement').textContent = calculations.yearsToRetirement;
                document.getElementById('retirementYears').textContent = calculations.retirementYears;
                document.getElementById('requiredCorpus').textContent = this.formatCurrency(calculations.requiredCorpus);
                document.getElementById('projectedCorpus').textContent = this.formatCurrency(calculations.projectedCorpus);
                
                const monthlyShortfall = calculations.shortfall / calculations.retirementYears / 12;
                document.getElementById('monthlyShortfall').textContent = this.formatCurrency(monthlyShortfall);
                document.getElementById('additionalSIP').textContent = this.formatCurrency(calculations.additionalSIP);
            }

            updateChart(calculations) {
                const canvas = document.getElementById('retirementChart');
                const ctx = canvas.getContext('2d');
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Set canvas size
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                
                const projections = calculations.yearlyProjections;
                if (projections.length === 0) return;
                
                const padding = 50;
                const chartWidth = canvas.width - 2 * padding;
                const chartHeight = canvas.height - 2 * padding;
                
                // Find max values
                const maxValue = Math.max(...projections.map(p => p.value));
                const maxYear = Math.max(...projections.map(p => p.year));
                const minYear = Math.min(...projections.map(p => p.year));
                
                // Draw axes
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(padding, padding);
                ctx.lineTo(padding, canvas.height - padding);
                ctx.lineTo(canvas.width - padding, canvas.height - padding);
                ctx.stroke();
                
                // Draw grid lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                for (let i = 1; i <= 5; i++) {
                    const y = padding + (chartHeight * i / 5);
                    ctx.beginPath();
                    ctx.moveTo(padding, y);
                    ctx.lineTo(canvas.width - padding, y);
                    ctx.stroke();
                }
                
                // Draw corpus growth line
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                
                projections.forEach((point, index) => {
                    const x = padding + (chartWidth * (point.year - minYear) / (maxYear - minYear));
                    const y = canvas.height - padding - (chartHeight * point.value / maxValue);
                    
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                
                ctx.stroke();
                
                // Draw required corpus line
                const requiredCorpusY = canvas.height - padding - (chartHeight * calculations.requiredCorpus / maxValue);
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 5]);
                ctx.beginPath();
                ctx.moveTo(padding, requiredCorpusY);
                ctx.lineTo(canvas.width - padding, requiredCorpusY);
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw labels
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                
                // Y-axis labels
                for (let i = 0; i <= 5; i++) {
                    const value = (maxValue * i / 5);
                    const y = canvas.height - padding - (chartHeight * i / 5);
                    ctx.fillText(this.formatShortCurrency(value), padding - 20, y + 4);
                }
                
                // Legend
                ctx.textAlign = 'left';
                ctx.fillStyle = '#ffd700';
                ctx.fillText('● Projected Corpus', canvas.width - 200, 30);
                ctx.fillStyle = '#ff6b6b';
                ctx.fillText('--- Required Corpus', canvas.width - 200, 50);
            }

            updateMilestones(calculations) {
                const container = document.getElementById('milestoneTimeline');
                container.innerHTML = '';
                
                const milestones = [
                    { percentage: 25, label: 'Quarter Goal' },
                    { percentage: 50, label: 'Halfway There' },
                    { percentage: 75, label: 'Three Quarters' },
                    { percentage: 100, label: 'Retirement Ready' }
                ];
                
                milestones.forEach(milestone => {
                    const targetAmount = calculations.requiredCorpus * (milestone.percentage / 100);
                    const yearsToReach = this.findYearsToReachAmount(calculations.yearlyProjections, targetAmount);
                    
                    const milestoneEl = document.createElement('div');
                    milestoneEl.className = 'milestone-item';
                    milestoneEl.innerHTML = `
                        <div class="milestone-age">Age ${yearsToReach || 'N/A'}</div>
                        <div class="milestone-amount">${this.formatCurrency(targetAmount)}</div>
                        <div class="milestone-desc">${milestone.label}</div>
                    `;
                    container.appendChild(milestoneEl);
                });
            }

            findYearsToReachAmount(projections, targetAmount) {
                for (const projection of projections) {
                    if (projection.value >= targetAmount) {
                        return projection.year;
                    }
                }
                return null;
            }

            updateRecommendations(calculations) {
                const container = document.getElementById('recommendationList');
                container.innerHTML = '';
                
                const recommendations = [];
                
                if (calculations.shortfall > 0) {
                    recommendations.push({
                        icon: '⚠️',
                        title: 'Increase Your Savings',
                        content: `You need to save an additional ₹${this.formatNumber(calculations.additionalSIP)} per month to meet your retirement goals.`
                    });
                }
                
                if (calculations.projectedCorpus > calculations.requiredCorpus) {
                    recommendations.push({
                        icon: '✅',
                        title: 'You\'re on Track!',
                        content: 'Your current savings plan will help you meet your retirement goals. Consider increasing your lifestyle or reducing working years.'
                    });
                }
                
                recommendations.push({
                    icon: '📈',
                    title: 'Diversify Your Portfolio',
                    content: 'Ensure your investments are well-diversified across equity, debt, and other asset classes based on your risk appetite.'
                });
                
                recommendations.push({
                    icon: '💰',
                    title: 'Tax-Efficient Investing',
                    content: 'Maximize tax benefits through ELSS, PPF, and NPS investments. Consider 80C and 80CCD deductions.'
                });
                
                recommendations.push({
                    icon: '🔄',
                    title: 'Regular Review',
                    content: 'Review your retirement plan annually and adjust for salary increases, life changes, and market conditions.'
                });
                
                recommendations.forEach(rec => {
                    const recEl = document.createElement('li');
                    recEl.className = 'recommendation-item';
                    recEl.innerHTML = `
                        <div class="recommendation-icon">${rec.icon}</div>
                        <div class="recommendation-content">
                            <h4>${rec.title}</h4>
                            <p>${rec.content}</p>
                        </div>
                    `;
                    container.appendChild(recEl);
                });
            }

            updateScenarios(data) {
                const scenarios = {
                    optimistic: { return: data.expectedReturn + 2, inflation: data.inflationRate - 1 },
                    realistic: { return: data.expectedReturn, inflation: data.inflationRate },
                    conservative: { return: data.expectedReturn - 2, inflation: data.inflationRate + 1 }
                };
                
                Object.keys(scenarios).forEach(scenarioName => {
                    const scenario = scenarios[scenarioName];
                    const modifiedData = { ...data, expectedReturn: scenario.return, inflationRate: scenario.inflation };
                    const calculations = this.performCalculations(modifiedData);
                    
                    const container = document.getElementById(`${scenarioName}Scenario`);
                    container.innerHTML = `
                        <div class="scenario-card">
                            <div class="scenario-title">${scenarioName.charAt(0).toUpperCase() + scenarioName.slice(1)} Scenario</div>
                            <div class="scenario-metric">
                                <span class="metric-label">Expected Return</span>
                                <span class="metric-value">${scenario.return}%</span>
                            </div>
                            <div class="scenario-metric">
                                <span class="metric-label">Inflation Rate</span>
                                <span class="metric-value">${scenario.inflation}%</span>
                            </div>
                            <div class="scenario-metric">
                                <span class="metric-label">Required Corpus</span>
                                <span class="metric-value">${this.formatCurrency(calculations.requiredCorpus)}</span>
                            </div>
                            <div class="scenario-metric">
                                <span class="metric-label">Projected Corpus</span>
                                <span class="metric-value">${this.formatCurrency(calculations.projectedCorpus)}</span>
                            </div>
                            <div class="scenario-metric">
                                <span class="metric-label">Additional SIP Needed</span>
                                <span class="metric-value">${this.formatCurrency(calculations.additionalSIP)}</span>
                            </div>
                        </div>
                    `;
                });
            }

            switchScenario(scenario) {
                // Update tabs
                document.querySelectorAll('.scenario-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelector(`[data-scenario="${scenario}"]`).classList.add('active');
                
                // Update content
                document.querySelectorAll('.scenario-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(scenario).classList.add('active');
            }

            formatCurrency(amount) {
                return new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                }).format(amount);
            }

            formatShortCurrency(amount) {
                if (amount >= 10000000) {
                    return `₹${(amount / 10000000).toFixed(1)}Cr`;
                } else if (amount >= 100000) {
                    return `₹${(amount / 100000).toFixed(1)}L`;
                } else if (amount >= 1000) {
                    return `₹${(amount / 1000).toFixed(1)}K`;
                }
                return `₹${amount.toFixed(0)}`;
            }

            formatNumber(num) {
                return new Intl.NumberFormat('en-IN').format(Math.round(num));
            }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new RetirementCalculator();
});