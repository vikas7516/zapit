// Password Generator Tool - JavaScript functionality

class PasswordGeneratorTool {
    constructor() {
        this.passwordHistory = JSON.parse(localStorage.getItem('passwordHistory') || '[]');
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupThemeToggle();
        this.updatePasswordHistory();
    }

    setupElements() {
        this.passwordOutput = document.getElementById('passwordOutput');
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthValue = document.getElementById('lengthValue');
        this.includeUppercase = document.getElementById('includeUppercase');
        this.includeLowercase = document.getElementById('includeLowercase');
        this.includeNumbers = document.getElementById('includeNumbers');
        this.includeSymbols = document.getElementById('includeSymbols');
        this.excludeAmbiguous = document.getElementById('excludeAmbiguous');
        this.customChars = document.getElementById('customChars');
        this.generateBtn = document.getElementById('generateBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');
        this.strengthFill = document.getElementById('strengthFill');
        this.strengthText = document.getElementById('strengthText');
        this.passwordHistory = document.getElementById('passwordHistory');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
    }

    setupEventListeners() {
        this.lengthSlider.addEventListener('input', this.updateLengthValue.bind(this));
        this.generateBtn.addEventListener('click', this.generatePassword.bind(this));
        this.regenerateBtn.addEventListener('click', this.generatePassword.bind(this));
        this.copyBtn.addEventListener('click', this.copyPassword.bind(this));
        this.clearHistoryBtn.addEventListener('click', this.clearHistory.bind(this));

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.applyPreset(preset);
            });
        });

        // Auto-generate on option change
        [this.includeUppercase, this.includeLowercase, this.includeNumbers, 
         this.includeSymbols, this.excludeAmbiguous].forEach(checkbox => {
            checkbox.addEventListener('change', this.autoGenerate.bind(this));
        });

        this.lengthSlider.addEventListener('input', this.autoGenerate.bind(this));
        this.customChars.addEventListener('input', this.autoGenerate.bind(this));
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const currentTheme = localStorage.getItem('theme') || 'light';
        
        document.documentElement.setAttribute('data-theme', currentTheme);
        this.updateThemeIcon(currentTheme);
        this.updateToolTheme(currentTheme);

        themeToggle?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            this.updateThemeIcon(newTheme);
            this.updateToolTheme(newTheme);
        });
    }

    updateThemeIcon(theme) {
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    updateToolTheme(theme) {
        const toolThemeCss = document.getElementById('tool-theme-css');
        if (toolThemeCss) {
            toolThemeCss.href = theme === 'dark' ? 'dark.css' : 'light.css';
        }
    }

    updateLengthValue() {
        this.lengthValue.textContent = this.lengthSlider.value;
    }

    applyPreset(preset) {
        const presets = {
            basic: {
                length: 12,
                uppercase: true,
                lowercase: true,
                numbers: true,
                symbols: false,
                excludeAmbiguous: false
            },
            strong: {
                length: 16,
                uppercase: true,
                lowercase: true,
                numbers: true,
                symbols: true,
                excludeAmbiguous: false
            },
            pin: {
                length: 6,
                uppercase: false,
                lowercase: false,
                numbers: true,
                symbols: false,
                excludeAmbiguous: false
            },
            memorable: {
                length: 14,
                uppercase: true,
                lowercase: true,
                numbers: true,
                symbols: false,
                excludeAmbiguous: true
            }
        };

        const config = presets[preset];
        if (config) {
            this.lengthSlider.value = config.length;
            this.lengthValue.textContent = config.length;
            this.includeUppercase.checked = config.uppercase;
            this.includeLowercase.checked = config.lowercase;
            this.includeNumbers.checked = config.numbers;
            this.includeSymbols.checked = config.symbols;
            this.excludeAmbiguous.checked = config.excludeAmbiguous;
            this.generatePassword();
        }
    }

    autoGenerate() {
        if (this.passwordOutput.value) {
            this.generatePassword();
        }
    }

    generatePassword() {
        const length = parseInt(this.lengthSlider.value);
        const options = {
            uppercase: this.includeUppercase.checked,
            lowercase: this.includeLowercase.checked,
            numbers: this.includeNumbers.checked,
            symbols: this.includeSymbols.checked,
            excludeAmbiguous: this.excludeAmbiguous.checked,
            customChars: this.customChars.value
        };

        // Validate at least one character type is selected
        if (!options.uppercase && !options.lowercase && !options.numbers && 
            !options.symbols && !options.customChars) {
            this.showToast('Please select at least one character type', 'error');
            return;
        }

        const password = this.createPassword(length, options);
        this.passwordOutput.value = password;
        this.updatePasswordStrength(password);
        this.addToHistory(password);
        this.showToast('Password generated successfully!', 'success');
    }

    createPassword(length, options) {
        let charset = '';
        
        if (options.uppercase) {
            charset += options.excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        }
        
        if (options.lowercase) {
            charset += options.excludeAmbiguous ? 'abcdefghijkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
        }
        
        if (options.numbers) {
            charset += options.excludeAmbiguous ? '23456789' : '0123456789';
        }
        
        if (options.symbols) {
            charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        }

        if (options.customChars) {
            charset += options.customChars;
        }

        let password = '';
        const array = new Uint32Array(length);
        
        // Use cryptographically secure random number generation
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(array);
            for (let i = 0; i < length; i++) {
                password += charset[array[i] % charset.length];
            }
        } else {
            // Fallback for older browsers
            for (let i = 0; i < length; i++) {
                password += charset[Math.floor(Math.random() * charset.length)];
            }
        }

        return password;
    }

    updatePasswordStrength(password) {
        const strength = this.calculatePasswordStrength(password);
        const percentage = Math.min(100, (strength.score / 100) * 100);
        
        this.strengthFill.style.width = `${percentage}%`;
        this.strengthFill.className = `strength-fill ${strength.level}`;
        this.strengthText.textContent = `${strength.level.charAt(0).toUpperCase() + strength.level.slice(1)} - ${strength.score}/100 points`;
    }

    calculatePasswordStrength(password) {
        let score = 0;
        let level = 'weak';

        // Length scoring
        if (password.length >= 8) score += 20;
        if (password.length >= 12) score += 10;
        if (password.length >= 16) score += 10;

        // Character variety
        if (/[a-z]/.test(password)) score += 10;
        if (/[A-Z]/.test(password)) score += 10;
        if (/[0-9]/.test(password)) score += 10;
        if (/[^A-Za-z0-9]/.test(password)) score += 15;

        // Patterns and complexity
        if (password.length >= 10 && /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) score += 15;
        if (password.length >= 12 && /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/.test(password)) score += 10;

        // Determine level
        if (score >= 80) level = 'very-strong';
        else if (score >= 60) level = 'strong';
        else if (score >= 40) level = 'medium';
        else if (score >= 20) level = 'weak';
        else level = 'very-weak';

        return { score: Math.min(100, score), level };
    }

    copyPassword() {
        if (!this.passwordOutput.value) {
            this.showToast('No password to copy. Generate one first!', 'error');
            return;
        }

        navigator.clipboard.writeText(this.passwordOutput.value).then(() => {
            this.showToast('Password copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            this.passwordOutput.select();
            document.execCommand('copy');
            this.showToast('Password copied to clipboard!', 'success');
        });
    }

    addToHistory(password) {
        const historyItem = {
            password,
            timestamp: new Date().toLocaleString(),
            strength: this.calculatePasswordStrength(password)
        };

        this.passwordHistory.unshift(historyItem);
        
        // Keep only last 10 passwords
        if (this.passwordHistory.length > 10) {
            this.passwordHistory = this.passwordHistory.slice(0, 10);
        }

        localStorage.setItem('passwordHistory', JSON.stringify(this.passwordHistory));
        this.updatePasswordHistory();
    }

    updatePasswordHistory() {
        const historyContainer = document.getElementById('passwordHistory');
        
        if (this.passwordHistory.length === 0) {
            historyContainer.innerHTML = '<div class="empty-state"><p>No passwords generated yet. Create your first password above!</p></div>';
            return;
        }

        historyContainer.innerHTML = this.passwordHistory.map((item, index) => `
            <div class="history-item">
                <div class="password-preview">
                    <span class="password-text">${this.maskPassword(item.password)}</span>
                    <div class="password-actions">
                        <button onclick="passwordGenerator.copyHistoryPassword('${item.password}')" 
                                class="btn btn-outline btn-sm" title="Copy password">📋</button>
                        <button onclick="passwordGenerator.revealPassword(${index})" 
                                class="btn btn-outline btn-sm" title="Show/hide password">👁️</button>
                    </div>
                </div>
                <div class="password-meta">
                    <span class="password-length">${item.password.length} chars</span>
                    <span class="password-strength ${item.strength.level}">${item.strength.level}</span>
                    <span class="password-time">${item.timestamp}</span>
                </div>
            </div>
        `).join('');
    }

    maskPassword(password) {
        return password.substring(0, 4) + '•'.repeat(Math.max(0, password.length - 6)) + password.substring(password.length - 2);
    }

    copyHistoryPassword(password) {
        navigator.clipboard.writeText(password).then(() => {
            this.showToast('Password copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy password', 'error');
        });
    }

    revealPassword(index) {
        const historyItems = document.querySelectorAll('.password-text');
        const item = historyItems[index];
        const password = this.passwordHistory[index].password;
        
        if (item.textContent === this.maskPassword(password)) {
            item.textContent = password;
            item.style.fontFamily = 'monospace';
        } else {
            item.textContent = this.maskPassword(password);
            item.style.fontFamily = '';
        }
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all password history?')) {
            this.passwordHistory = [];
            localStorage.removeItem('passwordHistory');
            this.updatePasswordHistory();
            this.showToast('Password history cleared', 'success');
        }
    }

    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize the tool
const passwordGenerator = new PasswordGeneratorTool();

// Generate an initial password
document.addEventListener('DOMContentLoaded', () => {
    passwordGenerator.generatePassword();
});