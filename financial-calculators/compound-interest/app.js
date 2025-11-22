        class CompoundInterestCalculator {
            constructor() {
                this.initializeEventListeners();
                this.calculateCompoundInterest(); // Calculate with default values
            }

            initializeEventListeners() {
                document.getElementById('calculateBtn').addEventListener('click', () => this.calculateCompoundInterest());
                document.getElementById('calculateGoalBtn').addEventListener('click', () => this.calculateGoal());
                
                // Real-time calculation on input change
                ['principal', 'monthlyContribution', 'annualRate', 'timePeriod', 'compoundingFrequency'].forEach(id => {
                    document.getElementById(id).addEventListener('input', () => this.calculateCompoundInterest());
                });
            }

            calculateCompoundInterest() {
                const principal = parseFloat(document.getElementById('principal').value) || 0;
                const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
                const annualRate = parseFloat(document.getElementById('annualRate').value) || 0;
                const years = parseFloat(document.getElementById('timePeriod').value) || 0;
                const compoundingFreq = parseFloat(document.getElementById('compoundingFrequency').value) || 12;

                if (principal <= 0 || annualRate <= 0 || years <= 0) {
                    this.clearResults();
                    return;
                }

                const rate = annualRate / 100;
                const periodicRate = rate / compoundingFreq;
                const totalPeriods = years * compoundingFreq;
                const monthlyPeriods = years * 12;

                // Calculate compound interest for principal
                const compoundAmount = principal * Math.pow(1 + periodicRate, totalPeriods);

                // Calculate future value of monthly contributions (annuity)
                let contributionFV = 0;
                if (monthlyContribution > 0) {
                    const monthlyRate = rate / 12;
                    contributionFV = monthlyContribution * (Math.pow(1 + monthlyRate, monthlyPeriods) - 1) / monthlyRate;
                }

                const finalAmount = compoundAmount + contributionFV;
                const totalInvested = principal + (monthlyContribution * monthlyPeriods);
                const interestEarned = finalAmount - totalInvested;
                const growthMultiple = totalInvested > 0 ? finalAmount / totalInvested : 0;

                this.displayResults(finalAmount, totalInvested, interestEarned, growthMultiple);
                this.generateProjectionTable(principal, monthlyContribution, rate, years, compoundingFreq);
                this.createGrowthChart(principal, monthlyContribution, rate, years);
                this.generateComparison(principal, monthlyContribution, rate, years);
            }

            displayResults(finalAmount, totalInvested, interestEarned, growthMultiple) {
                document.getElementById('finalAmount').textContent = this.formatCurrency(finalAmount);
                document.getElementById('totalInvested').textContent = this.formatCurrency(totalInvested);
                document.getElementById('interestEarned').textContent = this.formatCurrency(interestEarned);
                document.getElementById('growthMultiple').textContent = growthMultiple.toFixed(2) + 'x';
            }

            generateProjectionTable(principal, monthlyContribution, rate, years, compoundingFreq) {
                const tbody = document.getElementById('projectionBody');
                tbody.innerHTML = '';

                let balance = principal;
                const monthlyRate = rate / 12;

                for (let year = 1; year <= years; year++) {
                    const beginningBalance = balance;
                    const annualContribution = monthlyContribution * 12;
                    
                    // Calculate interest and contributions for the year
                    let yearlyInterest = 0;
                    for (let month = 1; month <= 12; month++) {
                        yearlyInterest += balance * monthlyRate;
                        balance += (balance * monthlyRate) + monthlyContribution;
                    }

                    const endingBalance = balance;

                    const row = tbody.insertRow();
                    row.innerHTML = `
                        <td>${year}</td>
                        <td>${this.formatCurrency(beginningBalance)}</td>
                        <td>${this.formatCurrency(annualContribution)}</td>
                        <td>${this.formatCurrency(yearlyInterest)}</td>
                        <td>${this.formatCurrency(endingBalance)}</td>
                    `;
                }
            }

            createGrowthChart(principal, monthlyContribution, rate, years) {
                const canvas = document.getElementById('growthChart');
                const ctx = canvas.getContext('2d');
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Chart dimensions and margins
                const margin = { top: 20, right: 30, bottom: 50, left: 80 };
                const chartWidth = canvas.width - margin.left - margin.right;
                const chartHeight = canvas.height - margin.top - margin.bottom;
                
                // Generate data points
                const dataPoints = [];
                const contributionPoints = [];
                let balance = principal;
                const monthlyRate = rate / 12;
                
                dataPoints.push({ year: 0, amount: principal, contributions: principal });
                contributionPoints.push({ year: 0, amount: principal });
                
                for (let year = 1; year <= years; year++) {
                    for (let month = 1; month <= 12; month++) {
                        balance += (balance * monthlyRate) + monthlyContribution;
                    }
                    const totalContributions = principal + (monthlyContribution * 12 * year);
                    dataPoints.push({ year: year, amount: balance, contributions: totalContributions });
                    contributionPoints.push({ year: year, amount: totalContributions });
                }
                
                // Find max values for scaling
                const maxAmount = Math.max(...dataPoints.map(d => d.amount));
                const maxYear = years;
                
                // Draw axes
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 1;
                
                // Y-axis
                ctx.beginPath();
                ctx.moveTo(margin.left, margin.top);
                ctx.lineTo(margin.left, margin.top + chartHeight);
                ctx.stroke();
                
                // X-axis
                ctx.beginPath();
                ctx.moveTo(margin.left, margin.top + chartHeight);
                ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
                ctx.stroke();
                
                // Draw grid lines and labels
                ctx.fillStyle = '#718096';
                ctx.font = '12px Arial';
                ctx.textAlign = 'right';
                
                // Y-axis labels
                for (let i = 0; i <= 5; i++) {
                    const value = (maxAmount / 5) * i;
                    const y = margin.top + chartHeight - (i / 5) * chartHeight;
                    
                    ctx.fillText(this.formatCurrencyShort(value), margin.left - 10, y + 4);
                    
                    if (i > 0) {
                        ctx.strokeStyle = '#f1f5f9';
                        ctx.beginPath();
                        ctx.moveTo(margin.left, y);
                        ctx.lineTo(margin.left + chartWidth, y);
                        ctx.stroke();
                    }
                }
                
                // X-axis labels
                ctx.textAlign = 'center';
                for (let i = 0; i <= years; i += Math.ceil(years / 10)) {
                    const x = margin.left + (i / maxYear) * chartWidth;
                    ctx.fillText(i.toString(), x, margin.top + chartHeight + 20);
                }
                
                // Draw contribution line
                ctx.strokeStyle = '#d69e2e';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                
                contributionPoints.forEach((point, index) => {
                    const x = margin.left + (point.year / maxYear) * chartWidth;
                    const y = margin.top + chartHeight - (point.amount / maxAmount) * chartHeight;
                    
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Draw compound growth line
                ctx.strokeStyle = '#38a169';
                ctx.lineWidth = 3;
                ctx.beginPath();
                
                dataPoints.forEach((point, index) => {
                    const x = margin.left + (point.year / maxYear) * chartWidth;
                    const y = margin.top + chartHeight - (point.amount / maxAmount) * chartHeight;
                    
                    if (index === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                
                ctx.stroke();
                
                // Add legend
                ctx.font = '14px Arial';
                ctx.textAlign = 'left';
                
                // Contribution legend
                ctx.fillStyle = '#d69e2e';
                ctx.fillRect(margin.left + 20, margin.top + 10, 20, 3);
                ctx.fillStyle = '#718096';
                ctx.fillText('Total Contributions', margin.left + 50, margin.top + 18);
                
                // Growth legend
                ctx.fillStyle = '#38a169';
                ctx.fillRect(margin.left + 20, margin.top + 30, 20, 3);
                ctx.fillStyle = '#718096';
                ctx.fillText('Investment Growth', margin.left + 50, margin.top + 38);
            }

            generateComparison(principal, monthlyContribution, currentRate, years) {
                const comparisonContainer = document.getElementById('investmentComparison');
                comparisonContainer.innerHTML = '';

                const scenarios = [
                    { rate: currentRate - 2, contribution: monthlyContribution, label: 'Conservative (-2%)', type: 'rate' },
                    { rate: currentRate, contribution: monthlyContribution, label: 'Current Scenario', current: true },
                    { rate: currentRate + 2, contribution: monthlyContribution, label: 'Aggressive (+2%)', type: 'rate' },
                    { rate: currentRate, contribution: monthlyContribution * 1.5, label: '50% More Investment', type: 'contribution' }
                ];

                let bestOption = null;
                let highestReturn = 0;

                scenarios.forEach(scenario => {
                    if (scenario.rate <= 0) return;

                    const rate = scenario.rate / 100;
                    const monthlyRate = rate / 12;
                    const totalPeriods = years * 12;

                    // Calculate compound growth
                    const compoundAmount = principal * Math.pow(1 + monthlyRate, totalPeriods);
                    const contributionFV = scenario.contribution * (Math.pow(1 + monthlyRate, totalPeriods) - 1) / monthlyRate;
                    const finalAmount = compoundAmount + contributionFV;
                    const totalInvested = principal + (scenario.contribution * totalPeriods);
                    const interestEarned = finalAmount - totalInvested;

                    if (interestEarned > highestReturn && !scenario.current) {
                        highestReturn = interestEarned;
                        bestOption = scenario;
                    }

                    const card = document.createElement('div');
                    card.className = 'comparison-card';
                    if (scenario === bestOption) {
                        card.classList.add('best');
                        card.innerHTML = '<div class="best-badge">Best Returns</div>';
                    }

                    card.innerHTML += `
                        <h4>${scenario.label}</h4>
                        <div style="margin: 1rem 0;">
                            <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                <span>Annual Rate:</span>
                                <strong>${scenario.rate.toFixed(1)}%</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                <span>Monthly SIP:</span>
                                <strong>${this.formatCurrency(scenario.contribution)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                <span>Final Amount:</span>
                                <strong>${this.formatCurrency(finalAmount)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                <span>Interest Earned:</span>
                                <strong style="color: #38a169;">${this.formatCurrency(interestEarned)}</strong>
                            </div>
                        </div>
                    `;

                    comparisonContainer.appendChild(card);
                });
            }

            calculateGoal() {
                const targetAmount = parseFloat(document.getElementById('targetAmount').value) || 0;
                const goalYears = parseFloat(document.getElementById('goalTimeframe').value) || 0;
                const goalRate = parseFloat(document.getElementById('goalRate').value) || 0;

                if (targetAmount <= 0 || goalYears <= 0 || goalRate <= 0) {
                    document.getElementById('requiredSIP').textContent = '₹0';
                    document.getElementById('requiredLumpsum').textContent = '₹0';
                    document.getElementById('totalSIPInvestment').textContent = '₹0';
                    return;
                }

                const rate = goalRate / 100;
                const monthlyRate = rate / 12;
                const totalMonths = goalYears * 12;

                // Calculate required monthly SIP
                const requiredSIP = (targetAmount * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
                
                // Calculate required lump sum
                const requiredLumpsum = targetAmount / Math.pow(1 + rate, goalYears);
                
                // Calculate total SIP investment
                const totalSIPInvestment = requiredSIP * totalMonths;

                document.getElementById('requiredSIP').textContent = this.formatCurrency(requiredSIP);
                document.getElementById('requiredLumpsum').textContent = this.formatCurrency(requiredLumpsum);
                document.getElementById('totalSIPInvestment').textContent = this.formatCurrency(totalSIPInvestment);
            }

            formatCurrency(amount) {
                return new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                }).format(amount);
            }

            formatCurrencyShort(amount) {
                if (amount >= 10000000) {
                    return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
                } else if (amount >= 100000) {
                    return '₹' + (amount / 100000).toFixed(1) + 'L';
                } else if (amount >= 1000) {
                    return '₹' + (amount / 1000).toFixed(1) + 'K';
                } else {
                    return '₹' + amount.toFixed(0);
                }
            }

            clearResults() {
                document.getElementById('finalAmount').textContent = '₹0';
                document.getElementById('totalInvested').textContent = '₹0';
                document.getElementById('interestEarned').textContent = '₹0';
                document.getElementById('growthMultiple').textContent = '0x';
                document.getElementById('projectionBody').innerHTML = '';
                
                const canvas = document.getElementById('growthChart');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        // Export functions
        function exportProjectionToPDF() {
            alert('PDF export functionality would integrate with a PDF library like jsPDF');
        }

        function exportProjectionToExcel() {
            alert('Excel export functionality would integrate with a library like SheetJS');
        }

        // Initialize calculator when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new CompoundInterestCalculator();
        });