// CHMOD Calculator App
class ChmodCalculator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.updateResults();
    }

    initializeElements() {
        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');

        // Visual checkboxes
        this.checkboxes = document.querySelectorAll('input[type="checkbox"]');

        // Input elements
        this.octalInput = document.getElementById('octal-input');
        this.symbolicInput = document.getElementById('symbolic-input');

        // Result elements
        this.octalResult = document.getElementById('octal-result');
        this.symbolicResult = document.getElementById('symbolic-result');
        this.commandResult = document.getElementById('command-result');
        this.humanResult = document.getElementById('human-result');

        // Copy buttons
        this.copyBtns = document.querySelectorAll('.copy-btn');

        // Preset buttons
        this.presetBtns = document.querySelectorAll('.preset-btn');

        // Current permissions state
        this.permissions = {
            owner: { read: false, write: false, execute: false },
            group: { read: false, write: false, execute: false },
            other: { read: false, write: false, execute: false }
        };
    }

    attachEventListeners() {
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Visual checkboxes
        this.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updatePermissionsFromCheckboxes();
                this.updateResults();
            });
        });

        // Octal input
        this.octalInput.addEventListener('input', (e) => {
            this.validateOctalInput(e.target.value);
            if (this.isValidOctal(e.target.value)) {
                this.updatePermissionsFromOctal(e.target.value);
                this.updateCheckboxes();
                this.updateResults();
            }
        });

        // Symbolic input
        this.symbolicInput.addEventListener('input', (e) => {
            this.validateSymbolicInput(e.target.value);
            if (this.isValidSymbolic(e.target.value)) {
                this.updatePermissionsFromSymbolic(e.target.value);
                this.updateCheckboxes();
                this.updateResults();
            }
        });

        // Copy buttons
        this.copyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.target.dataset.copy;
                this.copyToClipboard(targetId);
            });
        });

        // Preset buttons
        this.presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const permissions = e.target.dataset.permissions;
                if (permissions) {
                    this.applyPreset(permissions);
                }
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab contents
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }

    updatePermissionsFromCheckboxes() {
        this.checkboxes.forEach(checkbox => {
            const group = checkbox.dataset.group;
            const permission = checkbox.dataset.permission;
            this.permissions[group][permission] = checkbox.checked;
        });
    }

    updatePermissionsFromOctal(octalString) {
        if (octalString.length !== 3) return;

        const digits = octalString.split('').map(d => parseInt(d));
        const groups = ['owner', 'group', 'other'];

        groups.forEach((group, index) => {
            const digit = digits[index];
            this.permissions[group].read = (digit & 4) !== 0;
            this.permissions[group].write = (digit & 2) !== 0;
            this.permissions[group].execute = (digit & 1) !== 0;
        });
    }

    updatePermissionsFromSymbolic(symbolicString) {
        if (symbolicString.length !== 9) return;

        const groups = ['owner', 'group', 'other'];
        const perms = ['read', 'write', 'execute'];

        groups.forEach((group, groupIndex) => {
            perms.forEach((perm, permIndex) => {
                const charIndex = groupIndex * 3 + permIndex;
                const char = symbolicString[charIndex];
                
                if (perm === 'read') {
                    this.permissions[group][perm] = char === 'r';
                } else if (perm === 'write') {
                    this.permissions[group][perm] = char === 'w';
                } else if (perm === 'execute') {
                    this.permissions[group][perm] = char === 'x';
                }
            });
        });
    }

    updateCheckboxes() {
        this.checkboxes.forEach(checkbox => {
            const group = checkbox.dataset.group;
            const permission = checkbox.dataset.permission;
            checkbox.checked = this.permissions[group][permission];
        });
    }

    updateResults() {
        // Update octal
        const octal = this.calculateOctal();
        this.octalResult.textContent = octal;
        this.octalResult.classList.add('updating');
        setTimeout(() => this.octalResult.classList.remove('updating'), 300);

        // Update symbolic
        const symbolic = this.calculateSymbolic();
        this.symbolicResult.textContent = symbolic;
        this.symbolicResult.classList.add('updating');
        setTimeout(() => this.symbolicResult.classList.remove('updating'), 300);

        // Update command
        this.commandResult.textContent = `chmod ${octal} filename`;
        this.commandResult.classList.add('updating');
        setTimeout(() => this.commandResult.classList.remove('updating'), 300);

        // Update human readable
        const human = this.calculateHumanReadable();
        this.humanResult.textContent = human;
        this.humanResult.classList.add('updating');
        setTimeout(() => this.humanResult.classList.remove('updating'), 300);
    }

    calculateOctal() {
        const groups = ['owner', 'group', 'other'];
        return groups.map(group => {
            let value = 0;
            if (this.permissions[group].read) value += 4;
            if (this.permissions[group].write) value += 2;
            if (this.permissions[group].execute) value += 1;
            return value;
        }).join('');
    }

    calculateSymbolic() {
        const groups = ['owner', 'group', 'other'];
        return groups.map(group => {
            let result = '';
            result += this.permissions[group].read ? 'r' : '-';
            result += this.permissions[group].write ? 'w' : '-';
            result += this.permissions[group].execute ? 'x' : '-';
            return result;
        }).join('');
    }

    calculateHumanReadable() {
        const groupNames = {
            owner: 'Owner',
            group: 'Group',
            other: 'Others'
        };

        const descriptions = [];

        Object.keys(this.permissions).forEach(group => {
            const perms = this.permissions[group];
            const permList = [];

            if (perms.read) permList.push('read');
            if (perms.write) permList.push('write');
            if (perms.execute) permList.push('execute');

            if (permList.length > 0) {
                descriptions.push(`${groupNames[group]}: ${permList.join(', ')}`);
            }
        });

        return descriptions.length > 0 ? descriptions.join(' | ') : 'No permissions for anyone';
    }

    isValidOctal(value) {
        return /^[0-7]{3}$/.test(value);
    }

    isValidSymbolic(value) {
        return /^[rwx-]{9}$/.test(value);
    }

    validateOctalInput(value) {
        const input = this.octalInput;
        if (value === '') {
            input.classList.remove('valid', 'invalid');
        } else if (this.isValidOctal(value)) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
        }
    }

    validateSymbolicInput(value) {
        const input = this.symbolicInput;
        if (value === '') {
            input.classList.remove('valid', 'invalid');
        } else if (this.isValidSymbolic(value)) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
        }
    }

    applyPreset(octalString) {
        // Update input fields
        this.octalInput.value = octalString;
        this.symbolicInput.value = '';

        // Update permissions
        this.updatePermissionsFromOctal(octalString);
        this.updateCheckboxes();
        this.updateResults();

        // Validate inputs
        this.validateOctalInput(octalString);

        // Switch to visual tab to show the result
        this.switchTab('visual');

        // Show feedback
        this.showMessage(`Applied preset: ${octalString}`, 'success');
    }

    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        const text = element.textContent;

        navigator.clipboard.writeText(text).then(() => {
            this.showMessage('Copied to clipboard!', 'success');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showMessage('Copied to clipboard!', 'success');
        });
    }

    showMessage(message, type) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChmodCalculator();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
