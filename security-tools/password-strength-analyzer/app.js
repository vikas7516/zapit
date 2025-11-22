// Password Strength Analyzer
class PasswordStrengthAnalyzer {
    constructor() {
        this.init();
        this.commonPasswords = new Set([
            'password', '123456', '123456789', 'guest', 'qwerty', '12345678', '111111', '12345',
            'col123456', '123123', '1234567', '1234', '1234567890', '000000', '555555', '666666',
            '123321', '654321', '7777777', '123', 'D1lakiss', '777777', 'admin', 'welcome',
            'login', 'princess', 'password1', 'password123', 'letmein', 'monkey', 'dragon',
            'sunshine', 'master', 'shadow', 'football', 'baseball', 'superman', 'iloveyou'
        ]);
    }

    init() {
        this.passwordInput = document.getElementById('passwordInput');
        this.togglePassword = document.getElementById('togglePassword');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.strengthMeter = document.getElementById('strengthMeter');
        this.strengthFill = document.getElementById('strengthFill');
        this.strengthScore = document.getElementById('strengthScore');
        this.strengthLevel = document.getElementById('strengthLevel');
        this.analysisResults = document.getElementById('analysisResults');
        this.recommendations = document.getElementById('recommendations');
        this.recommendationsList = document.getElementById('recommendationsList');
        
        this.bindEvents();
    }

    bindEvents() {
        this.togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        this.analyzeBtn.addEventListener('click', () => this.analyzePassword());
        this.passwordInput.addEventListener('input', () => this.onPasswordInput());
        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzePassword();
            }
        });
    }

    togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        this.togglePassword.textContent = isPassword ? '🙈' : '👁️';
    }

    onPasswordInput() {
        const password = this.passwordInput.value;
        if (password.length === 0) {
            this.hideResults();
        }
    }

    analyzePassword() {
        const password = this.passwordInput.value.trim();
        
        if (!password) {
            this.showError('Please enter a password to analyze');
            return;
        }

        const analysis = this.performAnalysis(password);
        this.displayResults(analysis);
    }

    performAnalysis(password) {
        const analysis = {
            password: password,
            length: password.length,
            score: 0,
            level: 'Very Weak',
            color: '#dc3545',
            checks: {
                length: this.checkLength(password),
                characters: this.checkCharacterTypes(password),
                patterns: this.checkPatterns(password),
                common: this.checkCommonPasswords(password)
            },
            recommendations: []
        };

        // Calculate total score
        analysis.score = this.calculateScore(analysis);
        
        // Determine strength level
        const strengthInfo = this.getStrengthLevel(analysis.score);
        analysis.level = strengthInfo.level;
        analysis.color = strengthInfo.color;

        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);

        return analysis;
    }

    checkLength(password) {
        const length = password.length;
        return {
            length: length,
            score: Math.min(length * 2, 25), // Max 25 points for length
            status: length >= 12 ? 'good' : length >= 8 ? 'fair' : 'poor',
            message: length >= 12 ? 'Excellent length' : 
                    length >= 8 ? 'Good length' : 
                    `Too short (${length} characters). Recommended: 12+ characters.`
        };
    }

    checkCharacterTypes(password) {
        const types = {
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /[0-9]/.test(password),
            symbols: /[^a-zA-Z0-9]/.test(password)
        };

        const typeCount = Object.values(types).filter(Boolean).length;
        const score = typeCount * 5; // 5 points per type

        return {
            types: types,
            count: typeCount,
            score: score,
            status: typeCount >= 4 ? 'good' : typeCount >= 3 ? 'fair' : 'poor',
            message: this.getCharacterMessage(types, typeCount)
        };
    }

    getCharacterMessage(types, typeCount) {
        const missing = [];
        if (!types.lowercase) missing.push('lowercase letters');
        if (!types.uppercase) missing.push('uppercase letters');
        if (!types.numbers) missing.push('numbers');
        if (!types.symbols) missing.push('special characters');

        if (typeCount === 4) return 'Excellent character diversity';
        if (typeCount === 3) return 'Good character diversity';
        return `Missing: ${missing.join(', ')}`;
    }

    checkPatterns(password) {
        const patterns = {
            sequential: this.hasSequentialChars(password),
            repeated: this.hasRepeatedChars(password),
            keyboard: this.hasKeyboardPattern(password),
            dictionary: this.hasDictionaryWords(password)
        };

        const patternCount = Object.values(patterns).filter(Boolean).length;
        const score = Math.max(20 - (patternCount * 5), 0); // Lose 5 points per pattern

        return {
            patterns: patterns,
            count: patternCount,
            score: score,
            status: patternCount === 0 ? 'good' : patternCount <= 2 ? 'fair' : 'poor',
            message: this.getPatternMessage(patterns, patternCount)
        };
    }

    getPatternMessage(patterns, patternCount) {
        if (patternCount === 0) return 'No common patterns detected';
        
        const detected = [];
        if (patterns.sequential) detected.push('sequential characters');
        if (patterns.repeated) detected.push('repeated characters');
        if (patterns.keyboard) detected.push('keyboard patterns');
        if (patterns.dictionary) detected.push('dictionary words');

        return `Warning: Contains ${detected.join(', ')}`;
    }

    hasSequentialChars(password) {
        const sequences = ['abc', '123', 'xyz', '789'];
        const lower = password.toLowerCase();
        
        for (let i = 0; i < lower.length - 2; i++) {
            const substr = lower.substr(i, 3);
            const chars = substr.split('').map(c => c.charCodeAt(0));
            
            // Check if characters are sequential
            if (chars[1] === chars[0] + 1 && chars[2] === chars[1] + 1) {
                return true;
            }
            
            // Check if characters are reverse sequential
            if (chars[1] === chars[0] - 1 && chars[2] === chars[1] - 1) {
                return true;
            }
        }
        
        return sequences.some(seq => lower.includes(seq) || lower.includes(seq.split('').reverse().join('')));
    }

    hasRepeatedChars(password) {
        // Check for 3 or more repeated characters
        return /(.)\1{2,}/.test(password);
    }

    hasKeyboardPattern(password) {
        const keyboardPatterns = [
            'qwerty', 'asdf', 'zxcv', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
            '!@#$%', '12345', '67890'
        ];
        const lower = password.toLowerCase();
        return keyboardPatterns.some(pattern => 
            lower.includes(pattern) || lower.includes(pattern.split('').reverse().join(''))
        );
    }

    hasDictionaryWords(password) {
        const commonWords = [
            'password', 'admin', 'user', 'login', 'welcome', 'hello', 'world',
            'love', 'life', 'home', 'work', 'money', 'time', 'people', 'year'
        ];
        const lower = password.toLowerCase();
        return commonWords.some(word => lower.includes(word));
    }

    checkCommonPasswords(password) {
        const isCommon = this.commonPasswords.has(password.toLowerCase());
        
        return {
            isCommon: isCommon,
            score: isCommon ? 0 : 20, // 20 points if not common
            status: isCommon ? 'critical' : 'good',
            message: isCommon ? 
                'This is a commonly used password!' : 
                'Not found in common password lists'
        };
    }

    calculateScore(analysis) {
        const { length, characters, patterns, common } = analysis.checks;
        
        let totalScore = length.score + characters.score + patterns.score + common.score;
        
        // Bonus points for very long passwords
        if (analysis.length >= 16) totalScore += 10;
        if (analysis.length >= 20) totalScore += 10;
        
        // Cap the score at 100
        return Math.min(totalScore, 100);
    }

    getStrengthLevel(score) {
        if (score >= 80) return { level: 'Strong', color: '#28a745' };
        if (score >= 60) return { level: 'Good', color: '#17a2b8' };
        if (score >= 40) return { level: 'Fair', color: '#ffc107' };
        if (score >= 20) return { level: 'Weak', color: '#fd7e14' };
        return { level: 'Very Weak', color: '#dc3545' };
    }

    generateRecommendations(analysis) {
        const recommendations = [];
        const { length, characters, patterns, common } = analysis.checks;

        // Length recommendations
        if (analysis.length < 8) {
            recommendations.push({
                type: 'critical',
                message: 'Increase password length to at least 8 characters (12+ recommended)'
            });
        } else if (analysis.length < 12) {
            recommendations.push({
                type: 'warning',
                message: 'Consider using 12 or more characters for better security'
            });
        }

        // Character type recommendations
        if (characters.count < 3) {
            recommendations.push({
                type: 'critical',
                message: 'Include more character types: uppercase, lowercase, numbers, and symbols'
            });
        } else if (characters.count < 4) {
            recommendations.push({
                type: 'warning',
                message: 'Add missing character types for better security'
            });
        }

        // Pattern recommendations
        if (patterns.count > 0) {
            recommendations.push({
                type: 'warning',
                message: 'Avoid common patterns, sequential characters, and keyboard walks'
            });
        }

        // Common password recommendations
        if (common.isCommon) {
            recommendations.push({
                type: 'critical',
                message: 'This password is too common. Choose a unique password'
            });
        }

        // General recommendations
        if (analysis.score < 60) {
            recommendations.push({
                type: 'good',
                message: 'Consider using a passphrase with random words, numbers, and symbols'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                type: 'good',
                message: 'Great password! Remember to use unique passwords for each account'
            });
        }

        return recommendations;
    }

    displayResults(analysis) {
        // Show strength meter
        this.strengthMeter.classList.remove('hidden');
        this.strengthFill.style.width = `${analysis.score}%`;
        this.strengthFill.style.backgroundColor = analysis.color;
        this.strengthScore.textContent = `${analysis.score}/100`;
        this.strengthLevel.textContent = analysis.level;
        this.strengthLevel.className = `strength-level strength-${analysis.level.toLowerCase().replace(' ', '-')}`;

        // Show detailed analysis
        this.analysisResults.classList.remove('hidden');
        this.displayDetailedAnalysis(analysis);

        // Show recommendations
        this.recommendations.classList.remove('hidden');
        this.displayRecommendations(analysis.recommendations);
    }

    displayDetailedAnalysis(analysis) {
        const { length, characters, patterns, common } = analysis.checks;

        // Length analysis
        document.getElementById('lengthAnalysis').innerHTML = `
            <div class="analysis-item ${length.status}">
                <strong>${length.length} characters</strong><br>
                ${length.message}
            </div>
        `;

        // Character analysis
        const charTypes = Object.entries(characters.types)
            .map(([type, present]) => `${type}: ${present ? '✅' : '❌'}`)
            .join('<br>');
        
        document.getElementById('characterAnalysis').innerHTML = `
            <div class="analysis-item ${characters.status}">
                <strong>${characters.count}/4 character types</strong><br>
                ${charTypes}<br>
                <em>${characters.message}</em>
            </div>
        `;

        // Pattern analysis
        const patternTypes = Object.entries(patterns.patterns)
            .filter(([_, present]) => present)
            .map(([type, _]) => type)
            .join(', ');
            
        document.getElementById('patternAnalysis').innerHTML = `
            <div class="analysis-item ${patterns.status}">
                <strong>${patterns.count} patterns detected</strong><br>
                ${patterns.count > 0 ? `Found: ${patternTypes}<br>` : ''}
                <em>${patterns.message}</em>
            </div>
        `;

        // Common password analysis  
        document.getElementById('commonAnalysis').innerHTML = `
            <div class="analysis-item ${common.status}">
                <strong>${common.isCommon ? 'Common Password' : 'Unique Password'}</strong><br>
                <em>${common.message}</em>
            </div>
        `;
    }

    displayRecommendations(recommendations) {
        this.recommendationsList.innerHTML = recommendations
            .map(rec => `
                <div class="recommendation-item ${rec.type}">
                    ${rec.message}
                </div>
            `).join('');
    }

    hideResults() {
        this.strengthMeter.classList.add('hidden');
        this.analysisResults.classList.add('hidden');
        this.recommendations.classList.add('hidden');
    }

    showError(message) {
        // Create a simple error display
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            border: 1px solid #f1aeb5;
        `;
        errorDiv.textContent = message;

        this.passwordInput.parentNode.parentNode.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// Initialize the password strength analyzer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PasswordStrengthAnalyzer();
});

// Theme toggle functionality (if not already included globally)
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    const themeStylesheet = document.getElementById('tool-theme-css');
    
    if (themeToggle && themeStylesheet) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = localStorage.getItem('zapit-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            localStorage.setItem('zapit-theme', newTheme);
            themeStylesheet.href = newTheme + '.css';
            document.documentElement.setAttribute('data-theme', newTheme);
            
            const themeIcon = themeToggle.querySelector('.theme-icon');
            if (themeIcon) {
                themeIcon.textContent = newTheme === 'light' ? '🌙' : '☀️';
            }
        });
    }
});