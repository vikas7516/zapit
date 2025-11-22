class PercentageCalculator {
    constructor() {
        this.currentMode = 'basic';
        this.history = [];
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadHistory();
        this.setupRealTimeCalculation();
    }

    bindEvents() {
        // Mode selection
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectMode(card.dataset.mode);
            });
        });

        // Tip calculator
        document.querySelectorAll('.tip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.calculateTip(btn.dataset.tip);
            });
        });

        // Clear history
        document.getElementById('clearHistory')?.addEventListener('click', () => {
            this.clearHistory();
        });
    }

    selectMode(mode) {
        this.currentMode = mode;
        
        // Update mode cards
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        // Update forms
        document.querySelectorAll('.calc-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${mode}Form`).classList.add('active');
        
        // Clear previous results
        this.clearCurrentResult();
    }

    setupRealTimeCalculation() {
        // Basic percentage
        ['basicPercent', 'basicNumber'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.calculateBasic();
            });
        });

        // Reverse percentage
        ['reverseNum1', 'reverseNum2'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.calculateReverse();
            });
        });

        // Percentage change
        ['changeFrom', 'changeTo'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.calculateChange();
            });
        });

        // Percentage increase
        ['increaseNumber', 'increasePercent'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.calculateIncrease();
            });
        });

        // Percentage decrease
        ['decreaseNumber', 'decreasePercent'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.calculateDecrease();
            });
        });

        // Find total
        ['totalPart', 'totalPercent'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.calculateTotal();
            });
        });

        // Common calculators
        ['tipBill'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.updateTipCalculator();
            });
        });

        ['discountPrice', 'discountPercent'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.calculateDiscount();
            });
        });

        ['taxAmount', 'taxRate'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.calculateTax();
            });
        });
    }

    calculateBasic() {
        const percent = parseFloat(document.getElementById('basicPercent').value);
        const number = parseFloat(document.getElementById('basicNumber').value);
        
        if (isNaN(percent) || isNaN(number)) {
            this.showEmptyResult('basicResult');
            return;
        }
        
        const result = (percent / 100) * number;
        const calculation = `${percent}% of ${this.formatNumber(number)}`;
        const explanation = `${percent}% × ${this.formatNumber(number)} = ${this.formatNumber(result)}`;
        const breakdown = `Formula: (${percent}/100) × ${this.formatNumber(number)}\n= ${percent/100} × ${this.formatNumber(number)}\n= ${this.formatNumber(result)}`;
        
        this.displayResult('basicResult', result, explanation, breakdown);
        this.addToHistory(calculation, result);
    }

    calculateReverse() {
        const num1 = parseFloat(document.getElementById('reverseNum1').value);
        const num2 = parseFloat(document.getElementById('reverseNum2').value);
        
        if (isNaN(num1) || isNaN(num2) || num2 === 0) {
            this.showEmptyResult('reverseResult');
            return;
        }
        
        const result = (num1 / num2) * 100;
        const calculation = `${this.formatNumber(num1)} is what % of ${this.formatNumber(num2)}`;
        const explanation = `${this.formatNumber(num1)} is ${this.formatNumber(result, 2)}% of ${this.formatNumber(num2)}`;
        const breakdown = `Formula: (${this.formatNumber(num1)}/${this.formatNumber(num2)}) × 100\n= ${(num1/num2).toFixed(4)} × 100\n= ${this.formatNumber(result, 2)}%`;
        
        this.displayResult('reverseResult', result, explanation, breakdown, '%');
        this.addToHistory(calculation, result, '%');
    }

    calculateChange() {
        const from = parseFloat(document.getElementById('changeFrom').value);
        const to = parseFloat(document.getElementById('changeTo').value);
        
        if (isNaN(from) || isNaN(to) || from === 0) {
            this.showEmptyResult('changeResult');
            return;
        }
        
        const result = ((to - from) / from) * 100;
        const calculation = `Change from ${this.formatNumber(from)} to ${this.formatNumber(to)}`;
        const changeType = result > 0 ? 'increase' : result < 0 ? 'decrease' : 'no change';
        const explanation = `${this.formatNumber(Math.abs(result), 2)}% ${changeType}`;
        const breakdown = `Formula: ((${this.formatNumber(to)} - ${this.formatNumber(from)})/${this.formatNumber(from)}) × 100\n= (${this.formatNumber(to - from)}/${this.formatNumber(from)}) × 100\n= ${this.formatNumber(result, 2)}%`;
        
        this.displayResult('changeResult', result, explanation, breakdown, '%');
        this.addToHistory(calculation, result, '%');
    }

    calculateIncrease() {
        const number = parseFloat(document.getElementById('increaseNumber').value);
        const percent = parseFloat(document.getElementById('increasePercent').value);
        
        if (isNaN(number) || isNaN(percent)) {
            this.showEmptyResult('increaseResult');
            return;
        }
        
        const increase = (percent / 100) * number;
        const result = number + increase;
        const calculation = `Increase ${this.formatNumber(number)} by ${percent}%`;
        const explanation = `${this.formatNumber(number)} + ${percent}% = ${this.formatNumber(result)}`;
        const breakdown = `Formula: ${this.formatNumber(number)} + (${this.formatNumber(number)} × ${percent}/100)\n= ${this.formatNumber(number)} + ${this.formatNumber(increase)}\n= ${this.formatNumber(result)}`;
        
        this.displayResult('increaseResult', result, explanation, breakdown);
        this.addToHistory(calculation, result);
    }

    calculateDecrease() {
        const number = parseFloat(document.getElementById('decreaseNumber').value);
        const percent = parseFloat(document.getElementById('decreasePercent').value);
        
        if (isNaN(number) || isNaN(percent)) {
            this.showEmptyResult('decreaseResult');
            return;
        }
        
        const decrease = (percent / 100) * number;
        const result = number - decrease;
        const calculation = `Decrease ${this.formatNumber(number)} by ${percent}%`;
        const explanation = `${this.formatNumber(number)} - ${percent}% = ${this.formatNumber(result)}`;
        const breakdown = `Formula: ${this.formatNumber(number)} - (${this.formatNumber(number)} × ${percent}/100)\n= ${this.formatNumber(number)} - ${this.formatNumber(decrease)}\n= ${this.formatNumber(result)}`;
        
        this.displayResult('decreaseResult', result, explanation, breakdown);
        this.addToHistory(calculation, result);
    }

    calculateTotal() {
        const part = parseFloat(document.getElementById('totalPart').value);
        const percent = parseFloat(document.getElementById('totalPercent').value);
        
        if (isNaN(part) || isNaN(percent) || percent === 0) {
            this.showEmptyResult('totalResult');
            return;
        }
        
        const result = part / (percent / 100);
        const calculation = `If ${this.formatNumber(part)} is ${percent}%, what is the total?`;
        const explanation = `Total = ${this.formatNumber(result)}`;
        const breakdown = `Formula: ${this.formatNumber(part)} ÷ (${percent}/100)\n= ${this.formatNumber(part)} ÷ ${percent/100}\n= ${this.formatNumber(result)}`;
        
        this.displayResult('totalResult', result, explanation, breakdown);
        this.addToHistory(calculation, result);
    }

    calculateTip(tipPercent) {
        const bill = parseFloat(document.getElementById('tipBill').value);
        
        // Update active tip button
        document.querySelectorAll('.tip-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tip="${tipPercent}"]`).classList.add('active');
        
        if (isNaN(bill) || bill <= 0) {
            document.getElementById('tipResult').innerHTML = '<div class="result-empty">Enter bill amount</div>';
            return;
        }
        
        const tipAmount = (parseFloat(tipPercent) / 100) * bill;
        const total = bill + tipAmount;
        
        document.getElementById('tipResult').innerHTML = `
            <div class="tip-amount">Tip: $${this.formatNumber(tipAmount, 2)}</div>
            <div class="tip-total">Total: $${this.formatNumber(total, 2)}</div>
        `;
        
        this.addToHistory(`${tipPercent}% tip on $${this.formatNumber(bill, 2)}`, tipAmount, '$');
    }

    updateTipCalculator() {
        // Clear active tip button when manual entry
        document.querySelectorAll('.tip-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const bill = parseFloat(document.getElementById('tipBill').value);
        if (isNaN(bill) || bill <= 0) {
            document.getElementById('tipResult').innerHTML = '<div class="result-empty">Enter bill amount and select tip %</div>';
        }
    }

    calculateDiscount() {
        const price = parseFloat(document.getElementById('discountPrice').value);
        const percent = parseFloat(document.getElementById('discountPercent').value);
        
        if (isNaN(price) || isNaN(percent) || price <= 0) {
            document.getElementById('discountResult').innerHTML = '<div class="result-empty">Enter price and discount %</div>';
            return;
        }
        
        const discountAmount = (percent / 100) * price;
        const finalPrice = price - discountAmount;
        
        document.getElementById('discountResult').innerHTML = `
            <div class="discount-amount">Discount: -$${this.formatNumber(discountAmount, 2)}</div>
            <div class="discount-final">Final Price: $${this.formatNumber(finalPrice, 2)}</div>
        `;
        
        this.addToHistory(`${percent}% discount on $${this.formatNumber(price, 2)}`, finalPrice, '$');
    }

    calculateTax() {
        const amount = parseFloat(document.getElementById('taxAmount').value);
        const rate = parseFloat(document.getElementById('taxRate').value);
        
        if (isNaN(amount) || isNaN(rate) || amount <= 0) {
            document.getElementById('taxResult').innerHTML = '<div class="result-empty">Enter amount and tax rate</div>';
            return;
        }
        
        const taxAmount = (rate / 100) * amount;
        const total = amount + taxAmount;
        
        document.getElementById('taxResult').innerHTML = `
            <div class="tax-amount">Tax: $${this.formatNumber(taxAmount, 2)}</div>
            <div class="tax-total">Total: $${this.formatNumber(total, 2)}</div>
        `;
        
        this.addToHistory(`${rate}% tax on $${this.formatNumber(amount, 2)}`, total, '$');
    }

    displayResult(elementId, result, explanation, breakdown, suffix = '') {
        const element = document.getElementById(elementId);
        const formattedResult = this.formatNumber(result, 2) + suffix;
        
        element.innerHTML = `
            <div class="result-main">${formattedResult}</div>
            <div class="result-explanation">${explanation}</div>
            <div class="result-breakdown">${breakdown}</div>
        `;
    }

    showEmptyResult(elementId) {
        const element = document.getElementById(elementId);
        element.innerHTML = '<div class="result-empty">Enter values to see results</div>';
    }

    clearCurrentResult() {
        const resultId = `${this.currentMode}Result`;
        this.showEmptyResult(resultId);
    }

    formatNumber(num, decimals = 0) {
        if (isNaN(num)) return '0';
        
        const rounded = Number(num.toFixed(decimals));
        return rounded.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    addToHistory(calculation, result, suffix = '') {
        const historyItem = {
            calculation,
            result: this.formatNumber(result, 2) + suffix,
            timestamp: new Date()
        };
        
        // Add to beginning of history
        this.history.unshift(historyItem);
        
        // Keep only last 50 calculations
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.updateHistoryDisplay();
        this.saveHistory();
    }

    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No calculations yet. Start calculating to see your history!</div>';
            return;
        }
        
        const historyHTML = this.history.map(item => `
            <div class="history-item">
                <div>
                    <div class="history-calculation">${item.calculation}</div>
                    <div class="history-time">${this.formatTime(item.timestamp)}</div>
                </div>
                <div class="history-result">${item.result}</div>
            </div>
        `).join('');
        
        historyList.innerHTML = historyHTML;
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    clearHistory() {
        this.history = [];
        this.updateHistoryDisplay();
        this.saveHistory();
    }

    saveHistory() {
        try {
            localStorage.setItem('percentageCalculatorHistory', JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('percentageCalculatorHistory');
            if (saved) {
                this.history = JSON.parse(saved).map(item => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
                
                // Keep only today's history
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                this.history = this.history.filter(item => item.timestamp >= today);
                
                this.updateHistoryDisplay();
            }
        } catch (e) {
            console.error('Failed to load history:', e);
            this.history = [];
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PercentageCalculator();
});