class AmortizationCalculator {
    constructor() {
        this.currentSchedule = null;
        this.showingDetails = false;
        this.currentView = 'monthly';
        
        this.initializeElements();
        this.attachEventListeners();
        this.setDefaultValues();
        this.loadFromStorage();
    }

    initializeElements() {
        // Input elements
        this.loanType = document.getElementById('loanType');
        this.loanAmount = document.getElementById('loanAmount');
        this.interestRate = document.getElementById('interestRate');
        this.loanTerm = document.getElementById('loanTerm');
        this.termUnit = document.getElementById('termUnit');
        this.startDate = document.getElementById('startDate');

        // Extra payment elements
        this.enableExtraPayments = document.getElementById('enableExtraPayments');
        this.extraPaymentInputs = document.getElementById('extraPaymentInputs');
        this.extraMonthly = document.getElementById('extraMonthly');
        this.extraYearly = document.getElementById('extraYearly');
        this.oneTimeExtra = document.getElementById('oneTimeExtra');
        this.oneTimeDate = document.getElementById('oneTimeDate');

        // Action elements
        this.calculateBtn = document.getElementById('calculateBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.printBtn = document.getElementById('printBtn');
        this.scheduleView = document.getElementById('scheduleView');
        this.toggleDetails = document.getElementById('toggleDetails');

        // Content elements
        this.summaryContent = document.getElementById('summaryContent');
        this.scheduleContent = document.getElementById('scheduleContent');
        this.comparisonSection = document.getElementById('comparisonSection');

        // Preset buttons
        this.presetButtons = document.querySelectorAll('.preset-btn');
    }

    attachEventListeners() {
        // Calculate button
        this.calculateBtn.addEventListener('click', () => this.calculate());

        // Input changes for auto-calculation
        [this.loanAmount, this.interestRate, this.loanTerm].forEach(input => {
            input.addEventListener('input', () => this.autoCalculate());
        });

        // Extra payment toggle
        this.enableExtraPayments.addEventListener('change', () => {
            this.toggleExtraPayments();
        });

        // Export and print
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.printBtn.addEventListener('click', () => this.printSchedule());

        // Schedule view controls
        this.scheduleView.addEventListener('change', () => {
            this.currentView = this.scheduleView.value;
            this.displaySchedule();
        });

        this.toggleDetails.addEventListener('click', () => {
            this.showingDetails = !this.showingDetails;
            this.toggleDetails.textContent = this.showingDetails ? 'Hide Details' : 'Show Details';
            this.displaySchedule();
        });

        // Preset buttons
        this.presetButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyPreset(e.currentTarget.dataset.preset);
            });
        });

        // Loan type change
        this.loanType.addEventListener('change', () => {
            this.applyLoanTypeDefaults();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Format inputs
        this.loanAmount.addEventListener('blur', () => this.formatAmountInput(this.loanAmount));
        this.extraMonthly.addEventListener('blur', () => this.formatAmountInput(this.extraMonthly));
        this.extraYearly.addEventListener('blur', () => this.formatAmountInput(this.extraYearly));
        this.oneTimeExtra.addEventListener('blur', () => this.formatAmountInput(this.oneTimeExtra));
    }

    setDefaultValues() {
        const today = new Date();
        this.startDate.value = today.toISOString().split('T')[0];
        
        // Set one-time payment date to 2 years from now
        const futureDate = new Date(today);
        futureDate.setFullYear(today.getFullYear() + 2);
        this.oneTimeDate.value = futureDate.toISOString().split('T')[0];
    }

    applyPreset(presetType) {
        const presets = {
            mortgage: {
                amount: 400000,
                rate: 6.5,
                term: 30,
                unit: 'years'
            },
            auto: {
                amount: 35000,
                rate: 4.5,
                term: 5,
                unit: 'years'
            },
            personal: {
                amount: 15000,
                rate: 8.5,
                term: 3,
                unit: 'years'
            }
        };

        const preset = presets[presetType];
        if (preset) {
            this.loanAmount.value = preset.amount;
            this.interestRate.value = preset.rate;
            this.loanTerm.value = preset.term;
            this.termUnit.value = preset.unit;
            this.loanType.value = presetType;

            this.formatAmountInput(this.loanAmount);
            this.autoCalculate();
        }
    }

    applyLoanTypeDefaults() {
        const loanType = this.loanType.value;
        const defaults = {
            mortgage: { rate: 6.5, term: 30, unit: 'years' },
            auto: { rate: 4.5, term: 5, unit: 'years' },
            personal: { rate: 8.5, term: 3, unit: 'years' },
            student: { rate: 5.5, term: 10, unit: 'years' }
        };

        const defaultValues = defaults[loanType];
        if (defaultValues && !this.interestRate.value) {
            this.interestRate.value = defaultValues.rate;
            this.loanTerm.value = defaultValues.term;
            this.termUnit.value = defaultValues.unit;
        }
    }

    toggleExtraPayments() {
        if (this.enableExtraPayments.checked) {
            this.extraPaymentInputs.classList.remove('hidden');
        } else {
            this.extraPaymentInputs.classList.add('hidden');
            this.clearExtraPayments();
        }
        this.autoCalculate();
        this.saveToStorage();
    }

    clearExtraPayments() {
        this.extraMonthly.value = '';
        this.extraYearly.value = '';
        this.oneTimeExtra.value = '';
    }

    formatAmountInput(input) {
        const value = parseFloat(input.value.replace(/,/g, ''));
        if (!isNaN(value) && value > 0) {
            input.value = value.toLocaleString();
        }
    }

    calculate() {
        try {
            const loanData = this.getLoanData();
            this.validateLoanData(loanData);
            
            const schedule = this.generateAmortizationSchedule(loanData);
            this.currentSchedule = schedule;
            
            this.displaySummary(schedule);
            this.displaySchedule();
            this.displayComparison(schedule);
            this.saveToStorage();
            
            // Enable export/print buttons
            this.exportBtn.disabled = false;
            this.printBtn.disabled = false;
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    getLoanData() {
        const amount = parseFloat(this.loanAmount.value.replace(/,/g, ''));
        const rate = parseFloat(this.interestRate.value) / 100;
        let termMonths = parseInt(this.loanTerm.value);
        
        if (this.termUnit.value === 'years') {
            termMonths *= 12;
        }

        const extraPayments = {
            monthly: this.enableExtraPayments.checked ? parseFloat(this.extraMonthly.value) || 0 : 0,
            yearly: this.enableExtraPayments.checked ? parseFloat(this.extraYearly.value) || 0 : 0,
            oneTime: {
                amount: this.enableExtraPayments.checked ? parseFloat(this.oneTimeExtra.value) || 0 : 0,
                date: new Date(this.oneTimeDate.value)
            }
        };

        return {
            amount,
            annualRate: rate,
            monthlyRate: rate / 12,
            termMonths,
            startDate: new Date(this.startDate.value),
            extraPayments,
            loanType: this.loanType.value
        };
    }

    validateLoanData(data) {
        if (!data.amount || data.amount <= 0) {
            throw new Error('Please enter a valid loan amount');
        }
        if (!data.annualRate || data.annualRate < 0) {
            throw new Error('Please enter a valid interest rate');
        }
        if (!data.termMonths || data.termMonths <= 0) {
            throw new Error('Please enter a valid loan term');
        }
        if (data.amount > 10000000) {
            throw new Error('Loan amount cannot exceed $10,000,000');
        }
        if (data.annualRate > 0.5) {
            throw new Error('Interest rate cannot exceed 50%');
        }
    }

    generateAmortizationSchedule(loanData) {
        const { amount, monthlyRate, termMonths, startDate, extraPayments } = loanData;
        
        // Calculate base monthly payment
        const monthlyPayment = this.calculateMonthlyPayment(amount, monthlyRate, termMonths);
        
        const schedule = [];
        let remainingBalance = amount;
        let totalInterest = 0;
        let totalPrincipal = 0;
        let currentDate = new Date(startDate);
        let paymentNumber = 1;
        
        while (remainingBalance > 0.01 && paymentNumber <= termMonths * 2) { // Safety limit
            const interestPayment = remainingBalance * monthlyRate;
            let principalPayment = monthlyPayment - interestPayment;
            
            // Add extra payments
            let extraPayment = extraPayments.monthly;
            
            // Add yearly extra payment (in January)
            if (currentDate.getMonth() === 0 && extraPayments.yearly > 0) {
                extraPayment += extraPayments.yearly;
            }
            
            // Add one-time extra payment
            if (extraPayments.oneTime.amount > 0 && 
                currentDate.getTime() >= extraPayments.oneTime.date.getTime() &&
                paymentNumber === Math.ceil((extraPayments.oneTime.date - startDate) / (30.44 * 24 * 60 * 60 * 1000)) + 1) {
                extraPayment += extraPayments.oneTime.amount;
            }
            
            // Ensure we don't overpay
            const totalPayment = principalPayment + extraPayment;
            if (totalPayment > remainingBalance) {
                principalPayment = remainingBalance;
                extraPayment = 0;
            } else {
                principalPayment += extraPayment;
            }
            
            remainingBalance -= principalPayment;
            totalInterest += interestPayment;
            totalPrincipal += principalPayment;
            
            schedule.push({
                paymentNumber,
                date: new Date(currentDate),
                monthlyPayment,
                principalPayment,
                interestPayment,
                extraPayment,
                totalPayment: monthlyPayment + extraPayment,
                remainingBalance: Math.max(0, remainingBalance)
            });
            
            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
            paymentNumber++;
        }
        
        return {
            loanData,
            monthlyPayment,
            totalPayments: schedule.length,
            totalInterest: totalInterest,
            totalPrincipal: totalPrincipal,
            totalPaid: totalInterest + totalPrincipal,
            payments: schedule,
            interestSaved: this.calculateInterestSaved(loanData, schedule),
            timeSaved: termMonths - schedule.length
        };
    }

    calculateMonthlyPayment(principal, monthlyRate, termMonths) {
        if (monthlyRate === 0) {
            return principal / termMonths;
        }
        
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
               (Math.pow(1 + monthlyRate, termMonths) - 1);
    }

    calculateInterestSaved(loanData, schedule) {
        // Calculate what interest would be without extra payments
        const basePayment = this.calculateMonthlyPayment(
            loanData.amount, 
            loanData.monthlyRate, 
            loanData.termMonths
        );
        
        const baseInterest = (basePayment * loanData.termMonths) - loanData.amount;
        return Math.max(0, baseInterest - schedule.reduce((sum, payment) => sum + payment.interestPayment, 0));
    }

    displaySummary(schedule) {
        const { loanData, monthlyPayment, totalInterest, totalPaid, interestSaved, timeSaved } = schedule;
        
        const html = `
            <div class="summary-grid">
                <div class="summary-item primary">
                    <div class="summary-label">Monthly Payment</div>
                    <div class="summary-value">$${monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                
                <div class="summary-item">
                    <div class="summary-label">Total Interest</div>
                    <div class="summary-value">$${totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                
                <div class="summary-item">
                    <div class="summary-label">Total Paid</div>
                    <div class="summary-value">$${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                
                <div class="summary-item">
                    <div class="summary-label">Payoff Date</div>
                    <div class="summary-value">${schedule.payments[schedule.payments.length - 1].date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                </div>
                
                ${interestSaved > 0 ? `
                <div class="summary-item highlight">
                    <div class="summary-label">Interest Saved</div>
                    <div class="summary-value">$${interestSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                
                <div class="summary-item highlight">
                    <div class="summary-label">Time Saved</div>
                    <div class="summary-value">${Math.floor(timeSaved / 12)} years ${timeSaved % 12} months</div>
                </div>
                ` : ''}
            </div>
            
            <div class="payment-breakdown">
                <div class="breakdown-chart">
                    <div class="chart-item principal">
                        <div class="chart-bar" style="width: ${(loanData.amount / (loanData.amount + totalInterest)) * 100}%"></div>
                        <div class="chart-label">
                            <span class="chart-color principal-color"></span>
                            Principal: $${loanData.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                    <div class="chart-item interest">
                        <div class="chart-bar" style="width: ${(totalInterest / (loanData.amount + totalInterest)) * 100}%"></div>
                        <div class="chart-label">
                            <span class="chart-color interest-color"></span>
                            Interest: $${totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.summaryContent.innerHTML = html;
        
        // Add animation
        this.summaryContent.style.animation = 'none';
        this.summaryContent.offsetHeight; // Trigger reflow
        this.summaryContent.style.animation = 'fadeInUp 0.5s ease';
    }

    displaySchedule() {
        if (!this.currentSchedule) return;
        
        let html = '';
        
        if (this.currentView === 'monthly') {
            html = this.generateMonthlyScheduleHTML();
        } else {
            html = this.generateYearlyScheduleHTML();
        }
        
        this.scheduleContent.innerHTML = html;
    }

    generateMonthlyScheduleHTML() {
        const { payments } = this.currentSchedule;
        
        let html = `
            <div class="schedule-table-container">
                <table class="schedule-table">
                    <thead>
                        <tr>
                            <th>Payment #</th>
                            <th>Date</th>
                            <th>Payment</th>
                            <th>Principal</th>
                            <th>Interest</th>
                            ${this.showingDetails ? '<th>Extra Payment</th>' : ''}
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        payments.forEach((payment, index) => {
            if (!this.showingDetails && index > 12 && index < payments.length - 12) {
                if (index === 13) {
                    html += `
                        <tr class="schedule-gap">
                            <td colspan="${this.showingDetails ? 7 : 6}">
                                <button class="expand-btn" onclick="calculator.showAllPayments()">
                                    Show ${payments.length - 24} more payments
                                </button>
                            </td>
                        </tr>
                    `;
                }
                return;
            }
            
            html += `
                <tr class="schedule-row">
                    <td>${payment.paymentNumber}</td>
                    <td>${payment.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                    <td>$${payment.totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>$${payment.principalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>$${payment.interestPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    ${this.showingDetails ? `<td>$${payment.extraPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : ''}
                    <td>$${payment.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    }

    generateYearlyScheduleHTML() {
        const { payments } = this.currentSchedule;
        const yearlyData = this.aggregateYearlyData(payments);
        
        let html = `
            <div class="schedule-table-container">
                <table class="schedule-table yearly">
                    <thead>
                        <tr>
                            <th>Year</th>
                            <th>Beginning Balance</th>
                            <th>Total Payments</th>
                            <th>Principal Paid</th>
                            <th>Interest Paid</th>
                            <th>Ending Balance</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        yearlyData.forEach(year => {
            html += `
                <tr class="schedule-row">
                    <td>${year.year}</td>
                    <td>$${year.beginningBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td>$${year.totalPayments.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td>$${year.principalPaid.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td>$${year.interestPaid.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    <td>$${year.endingBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    }

    aggregateYearlyData(payments) {
        const yearlyData = [];
        let currentYear = payments[0].date.getFullYear();
        let yearData = {
            year: currentYear,
            beginningBalance: payments[0].remainingBalance + payments[0].principalPayment,
            totalPayments: 0,
            principalPaid: 0,
            interestPaid: 0,
            endingBalance: 0
        };
        
        payments.forEach(payment => {
            const paymentYear = payment.date.getFullYear();
            
            if (paymentYear !== currentYear) {
                yearData.endingBalance = payments.find(p => 
                    p.date.getFullYear() === currentYear && 
                    p.date.getMonth() === 11
                )?.remainingBalance || yearData.endingBalance;
                
                yearlyData.push(yearData);
                
                currentYear = paymentYear;
                yearData = {
                    year: currentYear,
                    beginningBalance: yearData.endingBalance,
                    totalPayments: 0,
                    principalPaid: 0,
                    interestPaid: 0,
                    endingBalance: 0
                };
            }
            
            yearData.totalPayments += payment.totalPayment;
            yearData.principalPaid += payment.principalPayment;
            yearData.interestPaid += payment.interestPayment;
            yearData.endingBalance = payment.remainingBalance;
        });
        
        yearlyData.push(yearData);
        return yearlyData;
    }

    displayComparison(schedule) {
        const baseSchedule = this.generateAmortizationSchedule({
            ...schedule.loanData,
            extraPayments: { monthly: 0, yearly: 0, oneTime: { amount: 0, date: new Date() } }
        });
        
        const html = `
            <div class="comparison-grid">
                <div class="comparison-item">
                    <h4>Without Extra Payments</h4>
                    <div class="comparison-details">
                        <div class="detail">
                            <span class="detail-label">Monthly Payment:</span>
                            <span class="detail-value">$${baseSchedule.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div class="detail">
                            <span class="detail-label">Total Interest:</span>
                            <span class="detail-value">$${baseSchedule.totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div class="detail">
                            <span class="detail-label">Payoff Time:</span>
                            <span class="detail-value">${Math.floor(baseSchedule.totalPayments / 12)} years ${baseSchedule.totalPayments % 12} months</span>
                        </div>
                    </div>
                </div>
                
                <div class="comparison-item current">
                    <h4>With Current Settings</h4>
                    <div class="comparison-details">
                        <div class="detail">
                            <span class="detail-label">Monthly Payment:</span>
                            <span class="detail-value">$${schedule.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div class="detail">
                            <span class="detail-label">Total Interest:</span>
                            <span class="detail-value">$${schedule.totalInterest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div class="detail">
                            <span class="detail-label">Payoff Time:</span>
                            <span class="detail-value">${Math.floor(schedule.totalPayments / 12)} years ${schedule.totalPayments % 12} months</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${schedule.interestSaved > 0 ? `
            <div class="savings-summary">
                <div class="savings-item">
                    <span class="savings-icon">💰</span>
                    <div class="savings-content">
                        <span class="savings-label">Interest Saved</span>
                        <span class="savings-value">$${schedule.interestSaved.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
                <div class="savings-item">
                    <span class="savings-icon">⏰</span>
                    <div class="savings-content">
                        <span class="savings-label">Time Saved</span>
                        <span class="savings-value">${Math.floor(schedule.timeSaved / 12)} years ${schedule.timeSaved % 12} months</span>
                    </div>
                </div>
            </div>
            ` : ''}
        `;
        
        this.comparisonSection.innerHTML = html;
    }

    showAllPayments() {
        this.showingDetails = true;
        this.toggleDetails.textContent = 'Hide Details';
        this.displaySchedule();
    }

    exportToCSV() {
        if (!this.currentSchedule) return;
        
        const { payments } = this.currentSchedule;
        let csv = 'Payment Number,Date,Monthly Payment,Principal,Interest,Extra Payment,Total Payment,Remaining Balance\n';
        
        payments.forEach(payment => {
            csv += `${payment.paymentNumber},${payment.date.toLocaleDateString()},${payment.monthlyPayment.toFixed(2)},${payment.principalPayment.toFixed(2)},${payment.interestPayment.toFixed(2)},${payment.extraPayment.toFixed(2)},${payment.totalPayment.toFixed(2)},${payment.remainingBalance.toFixed(2)}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `amortization-schedule-${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Schedule exported to CSV!');
    }

    printSchedule() {
        if (!this.currentSchedule) return;
        
        const printWindow = window.open('', '_blank');
        const html = this.generatePrintHTML();
        
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }

    generatePrintHTML() {
        const { loanData, monthlyPayment, totalInterest, totalPaid, payments } = this.currentSchedule;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Amortization Schedule</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .summary { margin-bottom: 20px; }
                    .summary-item { display: inline-block; margin-right: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    th { background-color: #f5f5f5; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Amortization Schedule</h1>
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="summary">
                    <div class="summary-item"><strong>Loan Amount:</strong> $${loanData.amount.toLocaleString()}</div>
                    <div class="summary-item"><strong>Interest Rate:</strong> ${(loanData.annualRate * 100).toFixed(2)}%</div>
                    <div class="summary-item"><strong>Term:</strong> ${Math.floor(loanData.termMonths / 12)} years</div>
                    <div class="summary-item"><strong>Monthly Payment:</strong> $${monthlyPayment.toFixed(2)}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Payment #</th>
                            <th>Date</th>
                            <th>Payment</th>
                            <th>Principal</th>
                            <th>Interest</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.map(payment => `
                            <tr>
                                <td>${payment.paymentNumber}</td>
                                <td>${payment.date.toLocaleDateString()}</td>
                                <td>$${payment.totalPayment.toFixed(2)}</td>
                                <td>$${payment.principalPayment.toFixed(2)}</td>
                                <td>$${payment.interestPayment.toFixed(2)}</td>
                                <td>$${payment.remainingBalance.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
    }

    autoCalculate() {
        // Auto calculate if we have the minimum required inputs
        if (this.loanAmount.value && this.interestRate.value && this.loanTerm.value) {
            setTimeout(() => {
                try {
                    this.calculate();
                } catch (error) {
                    // Silent fail for auto-calculation
                }
            }, 500);
        }
    }

    showError(message) {
        this.summaryContent.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h4>Calculation Error</h4>
                <p>${message}</p>
            </div>
        `;
        
        this.scheduleContent.innerHTML = `
            <div class="schedule-placeholder">
                <div class="placeholder-icon">📅</div>
                <h4>Amortization Schedule</h4>
                <p>Fix the error above to see the payment schedule</p>
            </div>
        `;
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

    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.calculate();
        }
    }

    saveToStorage() {
        const data = {
            loanAmount: this.loanAmount.value,
            interestRate: this.interestRate.value,
            loanTerm: this.loanTerm.value,
            termUnit: this.termUnit.value,
            loanType: this.loanType.value,
            enableExtraPayments: this.enableExtraPayments.checked,
            extraMonthly: this.extraMonthly.value,
            extraYearly: this.extraYearly.value,
            oneTimeExtra: this.oneTimeExtra.value
        };
        localStorage.setItem('amortizationCalculator', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('amortizationCalculator');
        if (saved) {
            const data = JSON.parse(saved);
            
            this.loanAmount.value = data.loanAmount || '';
            this.interestRate.value = data.interestRate || '';
            this.loanTerm.value = data.loanTerm || '';
            this.termUnit.value = data.termUnit || 'years';
            this.loanType.value = data.loanType || 'mortgage';
            this.enableExtraPayments.checked = data.enableExtraPayments || false;
            this.extraMonthly.value = data.extraMonthly || '';
            this.extraYearly.value = data.extraYearly || '';
            this.oneTimeExtra.value = data.oneTimeExtra || '';
            
            this.toggleExtraPayments();
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new AmortizationCalculator();
});