class SalaryCalculator {
    constructor() {
        this.currentRegime = 'old';
        this.initializeEventListeners();
        this.calculate();
    }

    initializeEventListeners() {
        // Input change listeners
        const inputs = [
            'basicSalary', 'hra', 'specialAllowance', 'bonus', 'city',
            'epf', 'section80c', 'section80d', 'nps', 'homeLoanInterest'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.calculate());
                element.addEventListener('change', () => this.calculate());
            }
        });

        // Tax regime toggle
        document.querySelectorAll('.regime-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchRegime(e.target.dataset.regime);
            });
        });
    }

    switchRegime(regime) {
        this.currentRegime = regime;
        
        // Update active button
        document.querySelectorAll('.regime-option').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-regime="${regime}"]`).classList.add('active');
        
        // Show/hide deductions section
        const deductionsSection = document.getElementById('deductionsSection');
        if (regime === 'new') {
            deductionsSection.style.opacity = '0.5';
            deductionsSection.style.pointerEvents = 'none';
        } else {
            deductionsSection.style.opacity = '1';
            deductionsSection.style.pointerEvents = 'auto';
        }
        
        this.calculate();
    }

    calculate() {
        const salaryData = this.getSalaryData();
        const calculations = this.performCalculations(salaryData);
        
        this.updateResults(calculations);
        this.updateComparison(salaryData);
        this.updateMonthlyBreakdown(calculations);
    }

    getSalaryData() {
        return {
            basicSalary: parseFloat(document.getElementById('basicSalary').value) || 0,
            hra: parseFloat(document.getElementById('hra').value) || 0,
            specialAllowance: parseFloat(document.getElementById('specialAllowance').value) || 0,
            bonus: parseFloat(document.getElementById('bonus').value) || 0,
            city: document.getElementById('city').value,
            epf: parseFloat(document.getElementById('epf').value) || 0,
            section80c: parseFloat(document.getElementById('section80c').value) || 0,
            section80d: parseFloat(document.getElementById('section80d').value) || 0,
            nps: parseFloat(document.getElementById('nps').value) || 0,
            homeLoanInterest: parseFloat(document.getElementById('homeLoanInterest').value) || 0
        };
    }

    performCalculations(data) {
        const grossSalary = data.basicSalary + data.hra + data.specialAllowance + data.bonus;
        
        // Calculate HRA exemption
        const hraExemption = this.calculateHRAExemption(data);
        
        // Calculate income based on regime
        let taxableIncome, incomeTax, totalDeductions;
        
        if (this.currentRegime === 'old') {
            const result = this.calculateOldRegime(data, grossSalary, hraExemption);
            taxableIncome = result.taxableIncome;
            incomeTax = result.incomeTax;
            totalDeductions = result.totalDeductions;
        } else {
            const result = this.calculateNewRegime(data, grossSalary, hraExemption);
            taxableIncome = result.taxableIncome;
            incomeTax = result.incomeTax;
            totalDeductions = result.totalDeductions;
        }
        
        const professionalTax = 2400; // Annual professional tax
        const takeHomeAnnual = grossSalary - data.epf - incomeTax - professionalTax;
        const takeHomeMonthly = takeHomeAnnual / 12;
        
        return {
            grossSalary,
            taxableIncome,
            incomeTax,
            totalDeductions,
            takeHomeAnnual,
            takeHomeMonthly,
            professionalTax,
            hraExemption
        };
    }

    calculateHRAExemption(data) {
        if (data.hra === 0) return 0;
        
        const basicDA = data.basicSalary; // Assuming no DA for simplicity
        const hraReceived = data.hra;
        const rentPaid = 0; // Would need user input for actual rent
        
        // HRA exemption is minimum of:
        // 1. Actual HRA received
        // 2. 50% of basic (metro) or 40% (non-metro)
        // 3. Rent paid - 10% of basic
        
        const percentage = data.city === 'metro' ? 0.50 : 0.40;
        const maxHRA = basicDA * percentage;
        
        // For calculation purposes, assuming rent equals HRA
        const rentExcess = Math.max(0, hraReceived - (basicDA * 0.10));
        
        return Math.min(hraReceived, maxHRA, rentExcess);
    }

    calculateOldRegime(data, grossSalary, hraExemption) {
        // Standard deduction
        const standardDeduction = 50000;
        
        // Total exemptions and deductions
        const totalExemptions = data.epf + hraExemption;
        const total80c = Math.min(data.section80c + data.epf, 150000);
        const totalDeductions = standardDeduction + total80c + data.section80d + data.nps + data.homeLoanInterest;
        
        const taxableIncome = Math.max(0, grossSalary - totalExemptions - standardDeduction - 
            (total80c - data.epf) - data.section80d - data.nps - data.homeLoanInterest);
        
        const incomeTax = this.calculateIncomeTaxOld(taxableIncome);
        
        return { taxableIncome, incomeTax, totalDeductions };
    }

    calculateNewRegime(data, grossSalary, hraExemption) {
        // Standard deduction
        const standardDeduction = 50000;
        
        // Only basic exemptions in new regime
        const totalExemptions = data.epf + hraExemption;
        const totalDeductions = standardDeduction + data.epf;
        
        const taxableIncome = Math.max(0, grossSalary - totalExemptions - standardDeduction);
        const incomeTax = this.calculateIncomeTaxNew(taxableIncome);
        
        return { taxableIncome, incomeTax, totalDeductions };
    }

    calculateIncomeTaxOld(taxableIncome) {
        let tax = 0;
        
        if (taxableIncome <= 250000) {
            tax = 0;
        } else if (taxableIncome <= 500000) {
            tax = (taxableIncome - 250000) * 0.05;
        } else if (taxableIncome <= 1000000) {
            tax = 12500 + (taxableIncome - 500000) * 0.20;
        } else {
            tax = 112500 + (taxableIncome - 1000000) * 0.30;
        }
        
        // Add 4% health and education cess
        return tax * 1.04;
    }

    calculateIncomeTaxNew(taxableIncome) {
        let tax = 0;
        
        if (taxableIncome <= 300000) {
            tax = 0;
        } else if (taxableIncome <= 600000) {
            tax = (taxableIncome - 300000) * 0.05;
        } else if (taxableIncome <= 900000) {
            tax = 15000 + (taxableIncome - 600000) * 0.10;
        } else if (taxableIncome <= 1200000) {
            tax = 45000 + (taxableIncome - 900000) * 0.15;
        } else if (taxableIncome <= 1500000) {
            tax = 90000 + (taxableIncome - 1200000) * 0.20;
        } else {
            tax = 150000 + (taxableIncome - 1500000) * 0.30;
        }
        
        // Add 4% health and education cess
        return tax * 1.04;
    }

    updateResults(calculations) {
        document.getElementById('grossSalary').textContent = this.formatCurrency(calculations.grossSalary);
        document.getElementById('totalDeductions').textContent = this.formatCurrency(calculations.totalDeductions);
        document.getElementById('taxableIncome').textContent = this.formatCurrency(calculations.taxableIncome);
        document.getElementById('incomeTax').textContent = this.formatCurrency(calculations.incomeTax);
        document.getElementById('takeHomeAnnual').textContent = this.formatCurrency(calculations.takeHomeAnnual);
        document.getElementById('takeHomeMonthly').textContent = this.formatCurrency(calculations.takeHomeMonthly);
        
        this.updateTaxBreakdown(calculations);
        this.updateDeductionBreakdown(calculations);
    }

    updateTaxBreakdown(calculations) {
        const container = document.getElementById('taxBreakdown');
        const taxSlabs = this.getTaxSlabs(calculations.taxableIncome);
        
        let html = '';
        taxSlabs.forEach(slab => {
            html += `
                <div class="breakdown-item">
                    <span>${slab.range}</span>
                    <span>${this.formatCurrency(slab.tax)}</span>
                </div>
            `;
        });
        
        html += `
            <div class="breakdown-item">
                <span>Total Tax + Cess</span>
                <span>${this.formatCurrency(calculations.incomeTax)}</span>
            </div>
        `;
        
        container.innerHTML = html;
    }

    getTaxSlabs(taxableIncome) {
        const slabs = [];
        
        if (this.currentRegime === 'old') {
            if (taxableIncome > 250000) {
                slabs.push({
                    range: '₹2.5L - ₹5L (5%)',
                    tax: Math.min(taxableIncome - 250000, 250000) * 0.05
                });
            }
            if (taxableIncome > 500000) {
                slabs.push({
                    range: '₹5L - ₹10L (20%)',
                    tax: Math.min(taxableIncome - 500000, 500000) * 0.20
                });
            }
            if (taxableIncome > 1000000) {
                slabs.push({
                    range: 'Above ₹10L (30%)',
                    tax: (taxableIncome - 1000000) * 0.30
                });
            }
        } else {
            if (taxableIncome > 300000) {
                slabs.push({
                    range: '₹3L - ₹6L (5%)',
                    tax: Math.min(taxableIncome - 300000, 300000) * 0.05
                });
            }
            if (taxableIncome > 600000) {
                slabs.push({
                    range: '₹6L - ₹9L (10%)',
                    tax: Math.min(taxableIncome - 600000, 300000) * 0.10
                });
            }
            if (taxableIncome > 900000) {
                slabs.push({
                    range: '₹9L - ₹12L (15%)',
                    tax: Math.min(taxableIncome - 900000, 300000) * 0.15
                });
            }
            if (taxableIncome > 1200000) {
                slabs.push({
                    range: '₹12L - ₹15L (20%)',
                    tax: Math.min(taxableIncome - 1200000, 300000) * 0.20
                });
            }
            if (taxableIncome > 1500000) {
                slabs.push({
                    range: 'Above ₹15L (30%)',
                    tax: (taxableIncome - 1500000) * 0.30
                });
            }
        }
        
        return slabs;
    }

    updateDeductionBreakdown(calculations) {
        const container = document.getElementById('deductionBreakdown');
        const data = this.getSalaryData();
        
        let html = `
            <div class="breakdown-item">
                <span>Standard Deduction</span>
                <span>${this.formatCurrency(50000)}</span>
            </div>
            <div class="breakdown-item">
                <span>EPF Employee</span>
                <span>${this.formatCurrency(data.epf)}</span>
            </div>
            <div class="breakdown-item">
                <span>HRA Exemption</span>
                <span>${this.formatCurrency(calculations.hraExemption)}</span>
            </div>
        `;
        
        if (this.currentRegime === 'old') {
            html += `
                <div class="breakdown-item">
                    <span>80C Deductions</span>
                    <span>${this.formatCurrency(Math.min(data.section80c + data.epf, 150000))}</span>
                </div>
                <div class="breakdown-item">
                    <span>80D Medical Insurance</span>
                    <span>${this.formatCurrency(data.section80d)}</span>
                </div>
                <div class="breakdown-item">
                    <span>NPS (80CCD 1B)</span>
                    <span>${this.formatCurrency(data.nps)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Home Loan Interest</span>
                    <span>${this.formatCurrency(data.homeLoanInterest)}</span>
                </div>
            `;
        }
        
        html += `
            <div class="breakdown-item">
                <span>Total Deductions</span>
                <span>${this.formatCurrency(calculations.totalDeductions)}</span>
            </div>
        `;
        
        container.innerHTML = html;
    }

    updateComparison(salaryData) {
        // Calculate for both regimes
        const oldRegimeCalc = this.performCalculationsForRegime(salaryData, 'old');
        const newRegimeCalc = this.performCalculationsForRegime(salaryData, 'new');
        
        document.getElementById('oldRegimeTakeHome').textContent = this.formatCurrency(oldRegimeCalc.takeHomeAnnual);
        document.getElementById('newRegimeTakeHome').textContent = this.formatCurrency(newRegimeCalc.takeHomeAnnual);
        
        const difference = newRegimeCalc.takeHomeAnnual - oldRegimeCalc.takeHomeAnnual;
        const oldDiffEl = document.getElementById('oldRegimeDiff');
        const newDiffEl = document.getElementById('newRegimeDiff');
        
        if (difference > 0) {
            // New regime is better
            newDiffEl.textContent = `+${this.formatCurrency(difference)} more`;
            newDiffEl.className = 'comparison-difference positive';
            oldDiffEl.textContent = `${this.formatCurrency(difference)} less`;
            oldDiffEl.className = 'comparison-difference negative';
            
            document.getElementById('newRegimeCard').classList.add('recommended');
            document.getElementById('oldRegimeCard').classList.remove('recommended');
        } else {
            // Old regime is better
            oldDiffEl.textContent = `+${this.formatCurrency(Math.abs(difference))} more`;
            oldDiffEl.className = 'comparison-difference positive';
            newDiffEl.textContent = `${this.formatCurrency(Math.abs(difference))} less`;
            newDiffEl.className = 'comparison-difference negative';
            
            document.getElementById('oldRegimeCard').classList.add('recommended');
            document.getElementById('newRegimeCard').classList.remove('recommended');
        }
    }

    performCalculationsForRegime(salaryData, regime) {
        const originalRegime = this.currentRegime;
        this.currentRegime = regime;
        const result = this.performCalculations(salaryData);
        this.currentRegime = originalRegime;
        return result;
    }

    updateMonthlyBreakdown(calculations) {
        document.getElementById('grossMonthly').textContent = this.formatCurrency(calculations.grossSalary / 12);
        document.getElementById('epfMonthly').textContent = this.formatCurrency(this.getSalaryData().epf / 12);
        document.getElementById('tdsMonthly').textContent = this.formatCurrency(calculations.incomeTax / 12);
        document.getElementById('netMonthly').textContent = this.formatCurrency(calculations.takeHomeMonthly);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SalaryCalculator();
});