class TipCalculator {
    constructor() {
        this.peopleCount = 1;
        this.initializeEventListeners();
        this.calculateTip(); // Calculate with default values
    }

    initializeEventListeners() {
        // Input change listeners
        ['billAmount', 'tipPercentage', 'taxRate'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.calculateTip());
        });

        // Tip percentage buttons
        document.querySelectorAll('.tip-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tipValue = e.target.dataset.tip;
                document.getElementById('tipPercentage').value = tipValue;
                this.updateTipButtons(tipValue);
                this.calculateTip();
            });
        });

        // Service rating buttons
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = e.target.dataset.rating;
                this.updateRatingButtons(rating);
                this.setTipByRating(rating);
            });
        });

        // People counter
        document.getElementById('increasePeople').addEventListener('click', () => {
            this.peopleCount++;
            this.updatePeopleCount();
            this.calculateTip();
        });

        document.getElementById('decreasePeople').addEventListener('click', () => {
            if (this.peopleCount > 1) {
                this.peopleCount--;
                this.updatePeopleCount();
                this.calculateTip();
            }
        });

        // Initialize with default tip
        this.updateTipButtons('15');
    }

    calculateTip() {
        const billAmount = parseFloat(document.getElementById('billAmount').value) || 0;
        const tipPercentage = parseFloat(document.getElementById('tipPercentage').value) || 0;
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;

        // Calculate amounts
        const taxAmount = billAmount * (taxRate / 100);
        const tipAmount = billAmount * (tipPercentage / 100);
        const totalAmount = billAmount + taxAmount;
        const totalWithTip = totalAmount + tipAmount;

        // Update main results
        document.getElementById('tipAmount').textContent = this.formatCurrency(tipAmount);
        document.getElementById('taxAmount').textContent = this.formatCurrency(taxAmount);
        document.getElementById('totalAmount').textContent = this.formatCurrency(totalAmount);
        document.getElementById('totalWithTip').textContent = this.formatCurrency(totalWithTip);

        // Calculate per person amounts
        this.calculateSplit(billAmount, tipAmount, totalWithTip);
    }

    calculateSplit(billAmount, tipAmount, totalWithTip) {
        const perPersonBill = billAmount / this.peopleCount;
        const perPersonTip = tipAmount / this.peopleCount;
        const perPersonTotal = totalWithTip / this.peopleCount;

        document.getElementById('perPersonBill').textContent = this.formatCurrency(perPersonBill);
        document.getElementById('perPersonTip').textContent = this.formatCurrency(perPersonTip);
        document.getElementById('perPersonTotal').textContent = this.formatCurrency(perPersonTotal);
    }

    updateTipButtons(activeValue) {
        document.querySelectorAll('.tip-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tip === activeValue) {
                btn.classList.add('active');
            }
        });
    }

    updateRatingButtons(activeRating) {
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.rating === activeRating) {
                btn.classList.add('active');
            }
        });
    }

    setTipByRating(rating) {
        const tipRanges = {
            poor: 10,
            fair: 15,
            good: 20,
            excellent: 25
        };

        const tipValue = tipRanges[rating] || 15;
        document.getElementById('tipPercentage').value = tipValue;
        this.updateTipButtons(tipValue.toString());
        this.calculateTip();
    }

    updatePeopleCount() {
        document.getElementById('peopleCount').textContent = this.peopleCount;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TipCalculator();
});