        class LoanEMICalculator {
            constructor() {
                this.initializeEventListeners();
                this.calculateEMI(); // Calculate with default values
            }

            initializeEventListeners() {
                document.getElementById('calculateBtn').addEventListener('click', () => this.calculateEMI());
                
                // Real-time calculation on input change
                ['loanAmount', 'interestRate', 'loanTenure'].forEach(id => {
                    document.getElementById(id).addEventListener('input', () => this.calculateEMI());
                });
            }

            calculateEMI() {
                const loanAmount = parseFloat(document.getElementById('loanAmount').value) || 0;
                const annualRate = parseFloat(document.getElementById('interestRate').value) || 0;
                const tenureYears = parseFloat(document.getElementById('loanTenure').value) || 0;

                if (loanAmount <= 0 || annualRate <= 0 || tenureYears <= 0) {
                    this.clearResults();
                    return;
                }

                const monthlyRate = annualRate / 12 / 100;
                const totalMonths = tenureYears * 12;

                // EMI calculation using formula
                const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                           (Math.pow(1 + monthlyRate, totalMonths) - 1);

                const totalAmount = emi * totalMonths;
                const totalInterest = totalAmount - loanAmount;
                const interestPercentage = (totalInterest / loanAmount) * 100;

                this.displayResults(emi, totalAmount, totalInterest, interestPercentage);
                this.generateAmortizationTable(loanAmount, monthlyRate, totalMonths, emi);
                this.createChart(loanAmount, totalInterest);
                this.generateComparison(loanAmount, annualRate, tenureYears, emi);
            }

            displayResults(emi, totalAmount, totalInterest, interestPercentage) {
                document.getElementById('emiAmount').textContent = this.formatCurrency(emi);
                document.getElementById('totalAmount').textContent = this.formatCurrency(totalAmount);
                document.getElementById('totalInterest').textContent = this.formatCurrency(totalInterest);
                document.getElementById('interestPercentage').textContent = interestPercentage.toFixed(1) + '%';
            }

            generateAmortizationTable(principal, monthlyRate, totalMonths, emi) {
                const tbody = document.getElementById('amortizationBody');
                tbody.innerHTML = '';

                let balance = principal;
                const yearlyData = [];

                for (let month = 1; month <= totalMonths; month++) {
                    const interestPayment = balance * monthlyRate;
                    const principalPayment = emi - interestPayment;
                    balance -= principalPayment;

                    if (month % 12 === 0 || month === totalMonths) {
                        const year = Math.ceil(month / 12);
                        const yearData = yearlyData[year - 1] || { 
                            year, 
                            openingBalance: principal,
                            totalEMI: 0, 
                            totalInterest: 0, 
                            totalPrincipal: 0,
                            closingBalance: balance 
                        };

                        if (month % 12 === 1 || yearlyData.length === 0) {
                            yearData.openingBalance = balance + principalPayment;
                        }

                        yearData.totalEMI += emi;
                        yearData.totalInterest += interestPayment;
                        yearData.totalPrincipal += principalPayment;
                        yearData.closingBalance = balance;

                        yearlyData[year - 1] = yearData;

                        if (month % 12 === 0 || month === totalMonths) {
                            const row = tbody.insertRow();
                            row.innerHTML = `
                                <td>${year}</td>
                                <td>${this.formatCurrency(yearData.openingBalance)}</td>
                                <td>${this.formatCurrency(yearData.totalEMI)}</td>
                                <td>${this.formatCurrency(yearData.totalInterest)}</td>
                                <td>${this.formatCurrency(yearData.totalPrincipal)}</td>
                                <td>${this.formatCurrency(Math.max(0, yearData.closingBalance))}</td>
                            `;
                        }
                    }
                }
            }

            createChart(principal, totalInterest) {
                const canvas = document.getElementById('emiChart');
                const ctx = canvas.getContext('2d');
                
                // Clear canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Chart dimensions
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const radius = Math.min(centerX, centerY) - 40;
                
                const total = principal + totalInterest;
                const principalAngle = (principal / total) * 2 * Math.PI;
                const interestAngle = (totalInterest / total) * 2 * Math.PI;
                
                // Draw principal slice
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, 0, principalAngle);
                ctx.closePath();
                ctx.fillStyle = '#3182ce';
                ctx.fill();
                
                // Draw interest slice
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, principalAngle, principalAngle + interestAngle);
                ctx.closePath();
                ctx.fillStyle = '#d69e2e';
                ctx.fill();
                
                // Add labels
                ctx.fillStyle = '#2d3748';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                
                // Principal label
                const principalLabelAngle = principalAngle / 2;
                const principalLabelX = centerX + Math.cos(principalLabelAngle) * (radius * 0.7);
                const principalLabelY = centerY + Math.sin(principalLabelAngle) * (radius * 0.7);
                ctx.fillText('Principal', principalLabelX, principalLabelY - 5);
                ctx.fillText(this.formatCurrency(principal), principalLabelX, principalLabelY + 10);
                
                // Interest label
                const interestLabelAngle = principalAngle + (interestAngle / 2);
                const interestLabelX = centerX + Math.cos(interestLabelAngle) * (radius * 0.7);
                const interestLabelY = centerY + Math.sin(interestLabelAngle) * (radius * 0.7);
                ctx.fillText('Interest', interestLabelX, interestLabelY - 5);
                ctx.fillText(this.formatCurrency(totalInterest), interestLabelX, interestLabelY + 10);
            }

            generateComparison(loanAmount, currentRate, currentTenure, currentEMI) {
                const comparisonContainer = document.getElementById('loanComparison');
                comparisonContainer.innerHTML = '';

                const scenarios = [
                    { rate: currentRate - 0.5, tenure: currentTenure, label: 'Lower Rate (-0.5%)' },
                    { rate: currentRate, tenure: currentTenure, label: 'Current Option', current: true },
                    { rate: currentRate + 0.5, tenure: currentTenure, label: 'Higher Rate (+0.5%)' },
                    { rate: currentRate, tenure: currentTenure - 5, label: 'Shorter Tenure (-5 years)' }
                ];

                let bestOption = null;
                let lowestTotalInterest = Infinity;

                scenarios.forEach(scenario => {
                    if (scenario.tenure <= 0 || scenario.rate <= 0) return;

                    const monthlyRate = scenario.rate / 12 / 100;
                    const totalMonths = scenario.tenure * 12;
                    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                               (Math.pow(1 + monthlyRate, totalMonths) - 1);
                    const totalAmount = emi * totalMonths;
                    const totalInterest = totalAmount - loanAmount;

                    if (totalInterest < lowestTotalInterest && !scenario.current) {
                        lowestTotalInterest = totalInterest;
                        bestOption = scenario;
                    }

                    const card = document.createElement('div');
                    card.className = 'comparison-card';
                    if (scenario === bestOption) {
                        card.classList.add('best');
                        card.innerHTML = '<div class="best-badge">Best Option</div>';
                    }

                    card.innerHTML += `
                        <h4>${scenario.label}</h4>
                        <div style="margin: 1rem 0;">
                            <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                <span>Rate:</span>
                                <strong>${scenario.rate.toFixed(1)}%</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                <span>Tenure:</span>
                                <strong>${scenario.tenure} years</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                <span>EMI:</span>
                                <strong>${this.formatCurrency(emi)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                                <span>Total Interest:</span>
                                <strong>${this.formatCurrency(totalInterest)}</strong>
                            </div>
                        </div>
                    `;

                    comparisonContainer.appendChild(card);
                });
            }

            formatCurrency(amount) {
                return new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                }).format(amount);
            }

            clearResults() {
                document.getElementById('emiAmount').textContent = '₹0';
                document.getElementById('totalAmount').textContent = '₹0';
                document.getElementById('totalInterest').textContent = '₹0';
                document.getElementById('interestPercentage').textContent = '0%';
                document.getElementById('amortizationBody').innerHTML = '';
                
                const canvas = document.getElementById('emiChart');
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        // Export functions
        function exportToPDF() {
            alert('PDF export functionality would integrate with a PDF library like jsPDF');
        }

        function exportToExcel() {
            alert('Excel export functionality would integrate with a library like SheetJS');
        }

        // Initialize calculator when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new LoanEMICalculator();
        });