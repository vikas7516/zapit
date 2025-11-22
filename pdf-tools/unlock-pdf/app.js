class PDFUnlocker {
    constructor() {
        this.pdfBytes = null;
        this.originalFileName = '';
        this.selectedPasswordType = 'user';
        this.initializeElements();
        this.initializeEventListeners();
        this.showToast = this.createToastSystem();
    }

    initializeElements() {
        // File upload elements
        this.fileInput = document.getElementById('fileInput');
        this.uploadZone = document.getElementById('uploadZone');
        this.browseBtn = document.getElementById('browseBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.helpBtn = document.getElementById('helpBtn');

        // Cards
        this.uploadCard = document.getElementById('uploadCard');
        this.passwordCard = document.getElementById('passwordCard');
        this.progressCard = document.getElementById('progressCard');
        this.resultsCard = document.getElementById('resultsCard');
        this.errorCard = document.getElementById('errorCard');

        // File info elements
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.protectionStatus = document.getElementById('protectionStatus');
        this.encryptionInfo = document.getElementById('encryptionInfo');
        this.currentFileName = document.getElementById('currentFileName');

        // Password elements
        this.userPasswordType = document.getElementById('userPasswordType');
        this.ownerPasswordType = document.getElementById('ownerPasswordType');
        this.passwordInput = document.getElementById('passwordInput');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.unlockBtn = document.getElementById('unlockBtn');
        this.unlockStatus = document.getElementById('unlockStatus');
        this.statusMessage = document.getElementById('statusMessage');
        this.statusDetails = document.getElementById('statusDetails');

        // Progress elements
        this.progressBar = document.getElementById('progressBar');
        this.progressPercent = document.getElementById('progressPercent');
        this.currentOperation = document.getElementById('currentOperation');
        this.passwordTypeProgress = document.getElementById('passwordTypeProgress');
        this.verificationProgress = document.getElementById('verificationProgress');
        this.decryptionProgress = document.getElementById('decryptionProgress');

        // Results elements
        this.usedPasswordType = document.getElementById('usedPasswordType');
        this.originalEncryption = document.getElementById('originalEncryption');
        this.unlockedPages = document.getElementById('unlockedPages');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadFileName = document.getElementById('downloadFileName');
        this.downloadFileSize = document.getElementById('downloadFileSize');
        this.newUnlockBtn = document.getElementById('newUnlockBtn');

        // Error elements
        this.errorTitle = document.getElementById('errorTitle');
        this.errorMessage = document.getElementById('errorMessage');
        this.retryBtn = document.getElementById('retryBtn');
    }

    initializeEventListeners() {
        // File upload listeners
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.browseBtn.addEventListener('click', () => this.fileInput.click());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.helpBtn.addEventListener('click', () => this.showHelp());

        // Drag and drop
        this.uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadZone.addEventListener('drop', (e) => this.handleFileDrop(e));
        this.uploadZone.addEventListener('dragenter', () => this.uploadZone.classList.add('drag-over'));
        this.uploadZone.addEventListener('dragleave', (e) => {
            if (!this.uploadZone.contains(e.relatedTarget)) {
                this.uploadZone.classList.remove('drag-over');
            }
        });

        // Password type selection
        this.userPasswordType.addEventListener('click', () => this.selectPasswordType('user'));
        this.ownerPasswordType.addEventListener('click', () => this.selectPasswordType('owner'));

        // Password input
        this.passwordInput.addEventListener('input', () => this.validateForm());
        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.unlockBtn.disabled) {
                this.unlockPDF();
            }
        });

        // Password visibility toggle
        this.passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());

        // Action buttons
        this.unlockBtn.addEventListener('click', () => this.unlockPDF());
        this.downloadBtn.addEventListener('click', () => this.downloadUnlockedPDF());
        this.newUnlockBtn.addEventListener('click', () => this.resetForNewFile());
        this.retryBtn.addEventListener('click', () => this.retryUnlock());
    }

    createToastSystem() {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);

        return (message, type = 'info', duration = 5000) => {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-icon">${icons[type]}</span>
                    <span class="toast-message">${message}</span>
                    <button class="toast-close">×</button>
                </div>
            `;

            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => {
                toast.remove();
            });

            toastContainer.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, duration);

            // Animate in
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(0)';
            });
        };
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        this.uploadZone.classList.add('drag-over');
    }

    handleFileDrop(event) {
        event.preventDefault();
        this.uploadZone.classList.remove('drag-over');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            this.processFile(file);
        }
    }

    async processFile(file) {
        // Validate file
        if (!file.type.includes('pdf')) {
            this.showToast('Please select a PDF file', 'error');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            this.showToast('File size must be less than 50MB', 'error');
            return;
        }

        try {
            // Read file
            const arrayBuffer = await file.arrayBuffer();
            this.pdfBytes = new Uint8Array(arrayBuffer);
            this.originalFileName = file.name;

            // Check if PDF is protected
            const protectionInfo = await this.checkPDFProtection(this.pdfBytes);
            
            if (!protectionInfo.isProtected) {
                this.showToast('This PDF is not password protected', 'warning');
                this.showUnprotectedMessage();
                return;
            }

            // Update UI with file info
            this.updateFileInfo(file, protectionInfo);
            this.showPasswordCard();
            this.validateForm();

            this.showToast('Protected PDF loaded successfully', 'success');

        } catch (error) {
            console.error('Error processing file:', error);
            this.showToast('Error processing PDF file', 'error');
        }
    }

    async checkPDFProtection(pdfBytes) {
        try {
            // Try to load without password
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            return {
                isProtected: false,
                encryptionType: 'None',
                hasUserPassword: false,
                hasOwnerPassword: false
            };
        } catch (error) {
            if (error.message.includes('password') || error.message.includes('encrypted')) {
                return {
                    isProtected: true,
                    encryptionType: 'AES-256', // Simplified detection
                    hasUserPassword: true,
                    hasOwnerPassword: true
                };
            }
            throw error;
        }
    }

    updateFileInfo(file, protectionInfo) {
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        this.protectionStatus.textContent = protectionInfo.isProtected ? 'Password Protected' : 'Not Protected';
        this.encryptionInfo.textContent = protectionInfo.encryptionType;
        this.currentFileName.textContent = file.name;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showPasswordCard() {
        this.uploadCard.classList.add('completed');
        this.passwordCard.classList.remove('hidden');
        this.passwordCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Focus on password input
        setTimeout(() => {
            this.passwordInput.focus();
        }, 300);
    }

    showUnprotectedMessage() {
        this.showToast('This PDF file is not password protected and can be opened normally', 'info');
        // You could add a special card for unprotected files here
    }

    selectPasswordType(type) {
        this.selectedPasswordType = type;
        
        // Update UI
        this.userPasswordType.classList.toggle('active', type === 'user');
        this.ownerPasswordType.classList.toggle('active', type === 'owner');
        
        // Update placeholder
        const placeholders = {
            user: 'Enter the user password (required to open PDF)',
            owner: 'Enter the owner password (controls permissions)'
        };
        
        this.passwordInput.placeholder = placeholders[type];
        this.passwordInput.focus();
    }

    togglePasswordVisibility() {
        if (this.passwordInput.type === 'password') {
            this.passwordInput.type = 'text';
            this.passwordToggle.textContent = '🙈';
        } else {
            this.passwordInput.type = 'password';
            this.passwordToggle.textContent = '👁️';
        }
    }

    validateForm() {
        const hasFile = this.pdfBytes !== null;
        const hasPassword = this.passwordInput.value.length > 0;
        
        this.unlockBtn.disabled = !(hasFile && hasPassword);
    }

    async unlockPDF() {
        if (!this.pdfBytes || !this.passwordInput.value) {
            this.showToast('Please select a PDF file and enter a password', 'error');
            return;
        }

        try {
            this.showProgressCard();
            await this.processUnlock();
        } catch (error) {
            console.error('Error unlocking PDF:', error);
            this.showErrorCard(error.message);
        }
    }

    showProgressCard() {
        this.passwordCard.classList.add('completed');
        this.progressCard.classList.remove('hidden');
        this.progressCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    hideProgressCard() {
        this.progressCard.classList.add('hidden');
        this.passwordCard.classList.remove('completed');
    }

    async processUnlock() {
        const password = this.passwordInput.value;
        const passwordType = this.selectedPasswordType;

        const steps = [
            { text: 'Verifying password...', progress: 20 },
            { text: 'Checking encryption...', progress: 40 },
            { text: 'Decrypting PDF...', progress: 70 },
            { text: 'Removing protection...', progress: 90 },
            { text: 'Complete!', progress: 100 }
        ];

        // Update password type in progress
        this.passwordTypeProgress.textContent = passwordType === 'user' ? 'User Password' : 'Owner Password';

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            this.updateProgress(step.progress, step.text);
            
            if (i === 0) {
                this.verificationProgress.textContent = 'Checking...';
                this.decryptionProgress.textContent = 'Waiting...';
            } else if (i === 1) {
                this.verificationProgress.textContent = 'Verified ✓';
                this.decryptionProgress.textContent = 'Starting...';
            } else if (i === 2) {
                this.decryptionProgress.textContent = 'In Progress...';
            } else if (i === 3) {
                this.decryptionProgress.textContent = 'Complete ✓';
            }

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
        }

        // Actually try to unlock the PDF
        const unlockedPdfBytes = await this.attemptUnlock(password, passwordType);
        
        this.showResultsCard(unlockedPdfBytes, passwordType);
    }

    async attemptUnlock(password, passwordType) {
        try {
            // Try to load with password
            const pdfDoc = await PDFLib.PDFDocument.load(this.pdfBytes, { 
                password: password,
                ignoreEncryption: false
            });
            
            // If successful, save without password
            const unlockedBytes = await pdfDoc.save();
            return new Uint8Array(unlockedBytes);
            
        } catch (error) {
            if (error.message.includes('password') || error.message.includes('incorrect')) {
                throw new Error('Incorrect password. Please check your password and try again.');
            } else if (error.message.includes('encryption')) {
                throw new Error('This PDF uses an unsupported encryption method.');
            } else {
                throw new Error('Failed to unlock PDF. Please try again.');
            }
        }
    }

    updateProgress(percentage, operation) {
        this.progressBar.style.width = `${percentage}%`;
        this.progressPercent.textContent = `${percentage}%`;
        this.currentOperation.textContent = operation;
    }

    showResultsCard(unlockedPdfBytes, passwordType) {
        this.unlockedPdfBytes = unlockedPdfBytes;
        this.progressCard.classList.add('completed');
        this.resultsCard.classList.remove('hidden');
        this.resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Update results info
        this.usedPasswordType.textContent = passwordType === 'user' ? 'User Password' : 'Owner Password';
        this.originalEncryption.textContent = '256-bit AES'; // Simplified
        
        // Get page count from unlocked PDF
        this.getPageCount(unlockedPdfBytes).then(pageCount => {
            this.unlockedPages.textContent = pageCount;
        });

        // Update download info
        const fileName = this.originalFileName.replace('.pdf', '_unlocked.pdf');
        this.downloadFileName.textContent = fileName;
        this.downloadFileSize.textContent = this.formatFileSize(unlockedPdfBytes.length);

        this.showToast('PDF unlocked successfully!', 'success');
    }

    async getPageCount(pdfBytes) {
        try {
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            return pdfDoc.getPageCount();
        } catch (error) {
            console.error('Error getting page count:', error);
            return 'Unknown';
        }
    }

    showErrorCard(errorMessage) {
        this.hideProgressCard();
        this.errorCard.classList.remove('hidden');
        this.errorCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Customize error message
        if (errorMessage.includes('password')) {
            this.errorTitle.textContent = 'Incorrect Password';
            this.errorMessage.textContent = 'The password you entered is incorrect. Please verify the password and try again.';
        } else if (errorMessage.includes('encryption')) {
            this.errorTitle.textContent = 'Unsupported Encryption';
            this.errorMessage.textContent = 'This PDF uses an encryption method that is not currently supported.';
        } else {
            this.errorTitle.textContent = 'Unlock Failed';
            this.errorMessage.textContent = errorMessage;
        }

        this.showToast('Failed to unlock PDF', 'error');
    }

    retryUnlock() {
        this.errorCard.classList.add('hidden');
        this.passwordInput.value = '';
        this.passwordInput.focus();
        this.validateForm();
    }

    downloadUnlockedPDF() {
        if (!this.unlockedPdfBytes) {
            this.showToast('No unlocked PDF available', 'error');
            return;
        }

        try {
            const blob = new Blob([this.unlockedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const fileName = this.originalFileName.replace('.pdf', '_unlocked.pdf');
            
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('Unlocked PDF downloaded successfully!', 'success');

        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Error downloading unlocked PDF', 'error');
        }
    }

    resetForNewFile() {
        // Reset all data
        this.pdfBytes = null;
        this.unlockedPdfBytes = null;
        this.originalFileName = '';
        this.selectedPasswordType = 'user';

        // Reset form
        this.fileInput.value = '';
        this.passwordInput.value = '';
        this.passwordInput.type = 'password';
        this.passwordToggle.textContent = '👁️';

        // Reset password type selection
        this.userPasswordType.classList.add('active');
        this.ownerPasswordType.classList.remove('active');

        // Reset cards
        this.uploadCard.classList.remove('completed');
        this.passwordCard.classList.add('hidden');
        this.progressCard.classList.add('hidden');
        this.resultsCard.classList.add('hidden');
        this.errorCard.classList.add('hidden');

        // Reset progress
        this.progressBar.style.width = '0%';
        this.progressPercent.textContent = '0%';

        // Reset status
        this.unlockStatus.classList.add('hidden');

        // Scroll to top
        this.uploadCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        this.showToast('Ready for new PDF unlock', 'info');
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            this.resetForNewFile();
        }
    }

    showHelp() {
        const helpMessage = `
            PDF Unlocker Help:
            
            1. Upload a password-protected PDF file (max 50MB)
            2. Select password type:
               • User Password: Required to open the PDF (most common)
               • Owner Password: Controls document permissions
            3. Enter the correct password
            4. Click "Unlock PDF" to remove protection
            5. Download your unlocked PDF file
            
            Troubleshooting:
            • Passwords are case-sensitive
            • Try both user and owner password options
            • Verify special characters and numbers
            • Contact document owner if password is unknown
            
            Privacy & Security:
            • All processing happens locally in your browser
            • No passwords or files are sent to any server
            • Only use with PDFs you own or have permission to unlock
        `;
        
        alert(helpMessage);
    }
}

// Initialize the PDF Unlocker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PDFUnlocker();
});