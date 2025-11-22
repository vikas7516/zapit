class ScientificCalculator {
    constructor() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operation = null;
        this.waitingForNewValue = false;
        this.angleMode = 'DEG'; // DEG, RAD, GRAD
        this.memory = 0;
        this.history = [];
        this.secondFunction = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadFromStorage();
        this.updateDisplay();
    }

    initializeElements() {
        this.mainDisplay = document.getElementById('mainDisplay');
        this.secondaryDisplay = document.getElementById('secondaryDisplay');
        this.angleMode = document.getElementById('angleMode');
        this.memoryIndicator = document.getElementById('memoryIndicator');
        this.historyList = document.getElementById('historyList');
        this.modeToggle = document.getElementById('modeToggle');
        this.clearAll = document.getElementById('clearAll');
        this.clearEntry = document.getElementById('clearEntry');
        this.backspace = document.getElementById('backspace');
        this.clearHistory = document.getElementById('clearHistory');
    }

    attachEventListeners() {
        // Button listeners
        document.querySelectorAll('.calc-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleButtonPress(action);
            });
        });

        // Control button listeners
        this.modeToggle.addEventListener('click', () => this.toggleAngleMode());
        this.clearAll.addEventListener('click', () => this.clearAll());
        this.clearEntry.addEventListener('click', () => this.clearEntry());
        this.backspace.addEventListener('click', () => this.backspace());
        this.clearHistory.addEventListener('click', () => this.clearHistory());

        // Keyboard listeners
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    handleButtonPress(action) {
        try {
            if (this.isNumber(action) || action === '.') {
                this.inputNumber(action);
            } else if (this.isBasicOperator(action)) {
                this.inputOperator(action);
            } else if (action === '=') {
                this.calculate();
            } else if (this.isFunction(action)) {
                this.executeFunction(action);
            } else if (this.isMemoryOperation(action)) {
                this.executeMemory(action);
            } else if (action === '(' || action === ')') {
                this.inputParenthesis(action);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    isNumber(value) {
        return /^\d$/.test(value);
    }

    isBasicOperator(value) {
        return ['+', '−', '×', '÷'].includes(value);
    }

    isFunction(action) {
        const functions = [
            'sin', 'cos', 'tan', 'ln', 'log', 'x²', 'x³', 'xʸ', '√', '∛', 'ʸ√x',
            '10ˣ', 'eˣ', '1/x', '|x|', 'x!', 'π', 'e', 'Rand', '±', '2nd'
        ];
        return functions.includes(action);
    }

    isMemoryOperation(action) {
        return ['mc', 'mr', 'm+', 'm-', 'ms'].includes(action);
    }

    inputNumber(num) {
        if (this.waitingForNewValue) {
            this.currentValue = num;
            this.waitingForNewValue = false;
        } else {
            if (num === '.' && this.currentValue.includes('.')) return;
            this.currentValue = this.currentValue === '0' ? num : this.currentValue + num;
        }
        this.updateDisplay();
    }

    inputOperator(operator) {
        const current = parseFloat(this.currentValue);
        
        if (this.previousValue === null) {
            this.previousValue = current;
        } else if (this.operation) {
            const result = this.performCalculation();
            this.currentValue = String(result);
            this.previousValue = result;
        }

        this.waitingForNewValue = true;
        this.operation = operator;
        this.updateSecondaryDisplay();
    }

    calculate() {
        if (this.operation && this.previousValue !== null) {
            const result = this.performCalculation();
            const expression = `${this.previousValue} ${this.operation} ${this.currentValue} = ${result}`;
            
            this.addToHistory(expression);
            this.currentValue = String(result);
            this.previousValue = null;
            this.operation = null;
            this.waitingForNewValue = true;
            this.updateDisplay();
            this.updateSecondaryDisplay();
        }
    }

    performCalculation() {
        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);

        switch (this.operation) {
            case '+':
                return prev + current;
            case '−':
                return prev - current;
            case '×':
                return prev * current;
            case '÷':
                if (current === 0) throw new Error('Cannot divide by zero');
                return prev / current;
            default:
                return current;
        }
    }

    executeFunction(func) {
        const current = parseFloat(this.currentValue);
        let result;

        switch (func) {
            case 'sin':
                result = Math.sin(this.toRadians(current));
                break;
            case 'cos':
                result = Math.cos(this.toRadians(current));
                break;
            case 'tan':
                result = Math.tan(this.toRadians(current));
                break;
            case 'ln':
                if (current <= 0) throw new Error('Invalid input for ln');
                result = Math.log(current);
                break;
            case 'log':
                if (current <= 0) throw new Error('Invalid input for log');
                result = Math.log10(current);
                break;
            case 'x²':
                result = Math.pow(current, 2);
                break;
            case 'x³':
                result = Math.pow(current, 3);
                break;
            case '√':
                if (current < 0) throw new Error('Cannot take square root of negative number');
                result = Math.sqrt(current);
                break;
            case '∛':
                result = Math.cbrt(current);
                break;
            case '10ˣ':
                result = Math.pow(10, current);
                break;
            case 'eˣ':
                result = Math.exp(current);
                break;
            case '1/x':
                if (current === 0) throw new Error('Cannot divide by zero');
                result = 1 / current;
                break;
            case '|x|':
                result = Math.abs(current);
                break;
            case 'x!':
                if (current < 0 || !Number.isInteger(current)) {
                    throw new Error('Factorial only for non-negative integers');
                }
                result = this.factorial(current);
                break;
            case 'π':
                result = Math.PI;
                break;
            case 'e':
                result = Math.E;
                break;
            case 'Rand':
                result = Math.random();
                break;
            case '±':
                result = -current;
                break;
            case '2nd':
                this.toggleSecondFunction();
                return;
            default:
                result = current;
        }

        const expression = `${func}(${current}) = ${result}`;
        this.addToHistory(expression);
        this.currentValue = String(result);
        this.waitingForNewValue = true;
        this.updateDisplay();
    }

    executeMemory(operation) {
        const current = parseFloat(this.currentValue);

        switch (operation) {
            case 'ms':
                this.memory = current;
                this.addToHistory(`Memory Stored: ${current}`);
                break;
            case 'mr':
                this.currentValue = String(this.memory);
                this.waitingForNewValue = true;
                break;
            case 'm+':
                this.memory += current;
                this.addToHistory(`Memory +: ${current} (Total: ${this.memory})`);
                break;
            case 'm-':
                this.memory -= current;
                this.addToHistory(`Memory -: ${current} (Total: ${this.memory})`);
                break;
            case 'mc':
                this.memory = 0;
                this.addToHistory('Memory Cleared');
                break;
        }

        this.updateMemoryIndicator();
        this.updateDisplay();
    }

    factorial(n) {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    toRadians(degrees) {
        switch (this.angleMode) {
            case 'DEG':
                return degrees * Math.PI / 180;
            case 'RAD':
                return degrees;
            case 'GRAD':
                return degrees * Math.PI / 200;
            default:
                return degrees;
        }
    }

    toggleAngleMode() {
        const modes = ['DEG', 'RAD', 'GRAD'];
        const currentIndex = modes.indexOf(this.angleMode);
        this.angleMode = modes[(currentIndex + 1) % modes.length];
        
        this.modeToggle.textContent = this.angleMode;
        document.getElementById('angleMode').textContent = this.angleMode;
        this.saveToStorage();
    }

    toggleSecondFunction() {
        this.secondFunction = !this.secondFunction;
        document.querySelectorAll('.trig-btn').forEach(btn => {
            if (this.secondFunction) {
                if (btn.dataset.action === 'sin') btn.textContent = 'sin⁻¹';
                if (btn.dataset.action === 'cos') btn.textContent = 'cos⁻¹';
                if (btn.dataset.action === 'tan') btn.textContent = 'tan⁻¹';
            } else {
                if (btn.dataset.action === 'sin') btn.textContent = 'sin';
                if (btn.dataset.action === 'cos') btn.textContent = 'cos';
                if (btn.dataset.action === 'tan') btn.textContent = 'tan';
            }
        });
    }

    clearAll() {
        this.currentValue = '0';
        this.previousValue = null;
        this.operation = null;
        this.waitingForNewValue = false;
        this.updateDisplay();
        this.updateSecondaryDisplay();
    }

    clearEntry() {
        this.currentValue = '0';
        this.waitingForNewValue = false;
        this.updateDisplay();
    }

    backspace() {
        if (this.currentValue.length > 1) {
            this.currentValue = this.currentValue.slice(0, -1);
        } else {
            this.currentValue = '0';
        }
        this.updateDisplay();
    }

    handleKeyPress(e) {
        e.preventDefault();
        
        const key = e.key;
        
        if (/\d/.test(key) || key === '.') {
            this.handleButtonPress(key);
        } else if (key === '+') {
            this.handleButtonPress('+');
        } else if (key === '-') {
            this.handleButtonPress('−');
        } else if (key === '*') {
            this.handleButtonPress('×');
        } else if (key === '/') {
            this.handleButtonPress('÷');
        } else if (key === 'Enter' || key === '=') {
            this.handleButtonPress('=');
        } else if (key === 'Escape') {
            this.clearAll();
        } else if (key === 'Backspace') {
            this.backspace();
        } else if (key === '(') {
            this.handleButtonPress('(');
        } else if (key === ')') {
            this.handleButtonPress(')');
        }
    }

    updateDisplay() {
        const value = parseFloat(this.currentValue);
        const formattedValue = this.formatNumber(value);
        this.mainDisplay.textContent = formattedValue;
        
        // Add animation
        this.mainDisplay.style.animation = 'none';
        this.mainDisplay.offsetHeight; // Trigger reflow
        this.mainDisplay.style.animation = 'displayUpdate 0.3s ease';
    }

    updateSecondaryDisplay() {
        if (this.operation && this.previousValue !== null) {
            this.secondaryDisplay.textContent = `${this.formatNumber(this.previousValue)} ${this.operation}`;
        } else {
            this.secondaryDisplay.textContent = '';
        }
    }

    updateMemoryIndicator() {
        this.memoryIndicator.textContent = this.memory !== 0 ? 'M' : '';
    }

    formatNumber(num) {
        if (isNaN(num)) return '0';
        
        // Handle very large or very small numbers
        if (Math.abs(num) >= 1e10 || (Math.abs(num) < 1e-6 && num !== 0)) {
            return num.toExponential(6);
        }
        
        // Format with appropriate decimal places
        return parseFloat(num.toPrecision(12)).toString();
    }

    addToHistory(expression) {
        const historyItem = {
            expression,
            timestamp: new Date().toLocaleTimeString()
        };

        this.history.unshift(historyItem);
        
        // Keep only last 50 calculations
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        this.updateHistoryDisplay();
        this.saveToStorage();
    }

    updateHistoryDisplay() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
            return;
        }

        this.historyList.innerHTML = this.history.map(item => `
            <div class="history-item" onclick="calculator.useHistoryValue('${item.expression}')">
                <div class="history-expression">${item.expression}</div>
                <div class="history-time">${item.timestamp}</div>
            </div>
        `).join('');
    }

    useHistoryValue(expression) {
        // Extract result from expression (after '=')
        const result = expression.split('=').pop().trim();
        this.currentValue = result;
        this.waitingForNewValue = true;
        this.updateDisplay();
    }

    clearHistory() {
        this.history = [];
        this.updateHistoryDisplay();
        this.saveToStorage();
    }

    showError(message) {
        this.mainDisplay.textContent = 'Error';
        this.secondaryDisplay.textContent = message;
        
        setTimeout(() => {
            this.clearAll();
        }, 2000);
    }

    saveToStorage() {
        const data = {
            angleMode: this.angleMode,
            memory: this.memory,
            history: this.history
        };
        localStorage.setItem('scientificCalculator', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('scientificCalculator');
        if (saved) {
            const data = JSON.parse(saved);
            this.angleMode = data.angleMode || 'DEG';
            this.memory = data.memory || 0;
            this.history = data.history || [];
            
            this.modeToggle.textContent = this.angleMode;
            document.getElementById('angleMode').textContent = this.angleMode;
            this.updateMemoryIndicator();
            this.updateHistoryDisplay();
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new ScientificCalculator();
});

// Add visual feedback for button presses
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.calc-btn, .control-btn').forEach(button => {
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
    });
});