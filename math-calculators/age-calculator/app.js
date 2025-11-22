class AgeCalculator {
    constructor() {
        this.birthDate = null;
        this.currentDate = null;
        this.results = null;
        
        this.zodiacSigns = [
            { name: 'Capricorn', icon: '♑', dates: 'Dec 22 - Jan 19', description: 'Ambitious, disciplined, and practical earth sign' },
            { name: 'Aquarius', icon: '♒', dates: 'Jan 20 - Feb 18', description: 'Independent, innovative, and humanitarian air sign' },
            { name: 'Pisces', icon: '♓', dates: 'Feb 19 - Mar 20', description: 'Intuitive, artistic, and compassionate water sign' },
            { name: 'Aries', icon: '♈', dates: 'Mar 21 - Apr 19', description: 'Energetic, brave, and pioneering fire sign' },
            { name: 'Taurus', icon: '♉', dates: 'Apr 20 - May 20', description: 'Reliable, patient, and pleasure-loving earth sign' },
            { name: 'Gemini', icon: '♊', dates: 'May 21 - Jun 20', description: 'Curious, adaptable, and communicative air sign' },
            { name: 'Cancer', icon: '♋', dates: 'Jun 21 - Jul 22', description: 'Nurturing, emotional, and protective water sign' },
            { name: 'Leo', icon: '♌', dates: 'Jul 23 - Aug 22', description: 'Confident, generous, and dramatic fire sign' },
            { name: 'Virgo', icon: '♍', dates: 'Aug 23 - Sep 22', description: 'Analytical, practical, and detail-oriented earth sign' },
            { name: 'Libra', icon: '♎', dates: 'Sep 23 - Oct 22', description: 'Harmonious, diplomatic, and beauty-loving air sign' },
            { name: 'Scorpio', icon: '♏', dates: 'Oct 23 - Nov 21', description: 'Intense, mysterious, and transformative water sign' },
            { name: 'Sagittarius', icon: '♐', dates: 'Nov 22 - Dec 21', description: 'Adventurous, optimistic, and philosophical fire sign' }
        ];

        this.generations = [
            { name: 'Silent Generation', years: '1928-1945', icon: '📻', description: 'The generation that experienced the Great Depression and WWII' },
            { name: 'Baby Boomers', years: '1946-1964', icon: '🎸', description: 'The post-war generation that changed the world' },
            { name: 'Generation X', years: '1965-1980', icon: '📼', description: 'The forgotten generation that bridges analog and digital' },
            { name: 'Millennials', years: '1981-1996', icon: '💻', description: 'The first generation to grow up with the internet' },
            { name: 'Generation Z', years: '1997-2012', icon: '📱', description: 'Digital natives who grew up with smartphones' },
            { name: 'Generation Alpha', years: '2013-2025', icon: '🌟', description: 'The generation growing up with AI and advanced technology' }
        ];
        
        this.init();
    }

    init() {
        this.setDefaultDates();
        this.bindEvents();
        this.loadFromStorage();
    }

    setDefaultDates() {
        const today = new Date();
        const currentDateInput = document.getElementById('currentDate');
        const birthDateInput = document.getElementById('birthDate');
        
        // Set current date to today
        if (currentDateInput) {
            currentDateInput.value = today.toISOString().split('T')[0];
            currentDateInput.max = today.toISOString().split('T')[0];
        }
        
        // Set max date for birth date
        if (birthDateInput) {
            birthDateInput.max = today.toISOString().split('T')[0];
        }
    }

    bindEvents() {
        // Form inputs
        document.getElementById('birthDate')?.addEventListener('change', (e) => {
            this.birthDate = e.target.value ? new Date(e.target.value) : null;
            this.saveToStorage();
        });

        document.getElementById('currentDate')?.addEventListener('change', (e) => {
            this.currentDate = e.target.value ? new Date(e.target.value) : null;
            this.saveToStorage();
        });

        // Calculate button
        document.getElementById('calculateBtn')?.addEventListener('click', () => this.calculate());

        // Action buttons
        document.getElementById('recalculateBtn')?.addEventListener('click', () => this.resetCalculator());
        document.getElementById('shareBtn')?.addEventListener('click', () => this.shareResults());
    }

    validateInputs() {
        if (!this.birthDate) {
            this.showError('Please select your birth date');
            return false;
        }
        
        if (!this.currentDate) {
            this.showError('Please select the current date');
            return false;
        }
        
        if (this.birthDate >= this.currentDate) {
            this.showError('Birth date must be before the current date');
            return false;
        }
        
        return true;
    }

    calculate() {
        // Get dates from inputs
        const birthDateValue = document.getElementById('birthDate').value;
        const currentDateValue = document.getElementById('currentDate').value;
        
        if (!birthDateValue || !currentDateValue) {
            this.showError('Please fill in both dates');
            return;
        }
        
        this.birthDate = new Date(birthDateValue);
        this.currentDate = new Date(currentDateValue);
        
        if (!this.validateInputs()) {
            return;
        }

        this.results = this.calculateAge(this.birthDate, this.currentDate);
        this.displayResults();
        this.saveToStorage();
    }

    calculateAge(birthDate, currentDate) {
        const birth = new Date(birthDate);
        const current = new Date(currentDate);
        
        // Calculate exact age
        let years = current.getFullYear() - birth.getFullYear();
        let months = current.getMonth() - birth.getMonth();
        let days = current.getDate() - birth.getDate();

        // Adjust for negative days
        if (days < 0) {
            months--;
            const lastMonth = new Date(current.getFullYear(), current.getMonth(), 0);
            days += lastMonth.getDate();
        }

        // Adjust for negative months
        if (months < 0) {
            years--;
            months += 12;
        }

        // Calculate total values
        const totalDays = Math.floor((current - birth) / (1000 * 60 * 60 * 24));
        const totalHours = totalDays * 24;
        const totalMinutes = totalHours * 60;
        const totalMonths = years * 12 + months;

        // Calculate next birthday
        let nextBirthday = new Date(current.getFullYear(), birth.getMonth(), birth.getDate());
        if (nextBirthday <= current) {
            nextBirthday.setFullYear(current.getFullYear() + 1);
        }
        
        const daysUntilBirthday = Math.ceil((nextBirthday - current) / (1000 * 60 * 60 * 24));
        const hoursUntilBirthday = Math.floor(((nextBirthday - current) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesUntilBirthday = Math.floor(((nextBirthday - current) % (1000 * 60 * 60)) / (1000 * 60));

        // Get zodiac sign
        const zodiac = this.getZodiacSign(birth);
        
        // Get generation
        const generation = this.getGeneration(birth.getFullYear());
        
        // Get birth day info
        const birthDayInfo = this.getBirthDayInfo(birth);
        
        // Calculate life statistics
        const lifeStats = this.calculateLifeStatistics(totalDays);

        return {
            exact: { years, months, days },
            total: { 
                days: totalDays, 
                hours: totalHours, 
                minutes: totalMinutes, 
                months: totalMonths 
            },
            nextBirthday: {
                date: nextBirthday,
                age: years + 1,
                daysUntil: daysUntilBirthday,
                hoursUntil: hoursUntilBirthday,
                minutesUntil: minutesUntilBirthday
            },
            zodiac,
            generation,
            birthDayInfo,
            lifeStats
        };
    }

    getZodiacSign(birthDate) {
        const month = birthDate.getMonth() + 1;
        const day = birthDate.getDate();
        
        if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return this.zodiacSigns[0]; // Capricorn
        if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return this.zodiacSigns[1]; // Aquarius
        if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return this.zodiacSigns[2]; // Pisces
        if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return this.zodiacSigns[3]; // Aries
        if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return this.zodiacSigns[4]; // Taurus
        if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return this.zodiacSigns[5]; // Gemini
        if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return this.zodiacSigns[6]; // Cancer
        if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return this.zodiacSigns[7]; // Leo
        if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return this.zodiacSigns[8]; // Virgo
        if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return this.zodiacSigns[9]; // Libra
        if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return this.zodiacSigns[10]; // Scorpio
        if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return this.zodiacSigns[11]; // Sagittarius
        
        return this.zodiacSigns[0]; // Default to Capricorn
    }

    getGeneration(birthYear) {
        for (const gen of this.generations) {
            const [startYear, endYear] = gen.years.split('-').map(year => parseInt(year));
            if (birthYear >= startYear && birthYear <= endYear) {
                return gen;
            }
        }
        return { name: 'Unknown Generation', years: '', icon: '❓', description: 'Generation not defined' };
    }

    getBirthDayInfo(birthDate) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const seasons = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Fall', 'Fall', 'Fall', 'Winter'];
        
        const dayOfWeek = days[birthDate.getDay()];
        const dayOfYear = Math.floor((birthDate - new Date(birthDate.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const weekOfYear = Math.ceil(dayOfYear / 7);
        const season = seasons[birthDate.getMonth()];
        
        return {
            dayOfWeek,
            dayOfYear,
            weekOfYear,
            season
        };
    }

    calculateLifeStatistics(totalDays) {
        // Average estimates for fun statistics
        const heartbeatsPerMinute = 70;
        const breathsPerMinute = 16;
        const hoursOfSleepPerDay = 8;
        
        return {
            heartbeats: Math.floor(totalDays * 24 * 60 * heartbeatsPerMinute),
            breaths: Math.floor(totalDays * 24 * 60 * breathsPerMinute),
            sleepDays: Math.floor(totalDays * (hoursOfSleepPerDay / 24)),
            earthRotations: totalDays,
            sunrises: totalDays,
            moonCycles: Math.floor(totalDays / 29.5) // Lunar cycle is ~29.5 days
        };
    }

    formatNumber(num) {
        return num.toLocaleString();
    }

    displayResults() {
        const { exact, total, nextBirthday, zodiac, generation, birthDayInfo, lifeStats } = this.results;
        
        // Update main age display
        document.getElementById('primaryAge').textContent = exact.years;
        document.getElementById('ageYears').textContent = exact.years;
        document.getElementById('ageMonths').textContent = this.formatNumber(total.months);
        document.getElementById('ageDays').textContent = this.formatNumber(total.days);
        document.getElementById('ageHours').textContent = this.formatNumber(total.hours);

        // Update next birthday
        const nextBirthdayFormatted = nextBirthday.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('nextBirthday').textContent = nextBirthdayFormatted;
        document.getElementById('nextAge').textContent = `You'll be ${nextBirthday.age} years old`;
        document.getElementById('countdownDays').textContent = nextBirthday.daysUntil;
        document.getElementById('countdownHours').textContent = nextBirthday.hoursUntil;
        document.getElementById('countdownMinutes').textContent = nextBirthday.minutesUntil;

        // Update zodiac information
        document.getElementById('zodiacIcon').textContent = zodiac.icon;
        document.getElementById('zodiacName').textContent = zodiac.name;
        document.getElementById('zodiacDates').textContent = zodiac.dates;
        document.getElementById('zodiacDescription').textContent = zodiac.description;

        // Update generation information
        document.getElementById('generationIcon').textContent = generation.icon;
        document.getElementById('generationName').textContent = generation.name;
        document.getElementById('generationYears').textContent = generation.years;
        document.getElementById('generationDescription').textContent = generation.description;

        // Update life statistics
        document.getElementById('heartbeats').textContent = this.formatNumber(lifeStats.heartbeats);
        document.getElementById('breaths').textContent = this.formatNumber(lifeStats.breaths);
        document.getElementById('sleepDays').textContent = this.formatNumber(lifeStats.sleepDays);
        document.getElementById('earthRotations').textContent = this.formatNumber(lifeStats.earthRotations);
        document.getElementById('sunrises').textContent = this.formatNumber(lifeStats.sunrises);
        document.getElementById('moonCycles').textContent = this.formatNumber(lifeStats.moonCycles);

        // Update birth day information
        document.getElementById('birthDayOfWeek').textContent = birthDayInfo.dayOfWeek;
        document.getElementById('birthDayOfYear').textContent = `${birthDayInfo.dayOfYear}${this.getOrdinalSuffix(birthDayInfo.dayOfYear)} day`;
        document.getElementById('birthWeekOfYear').textContent = `${birthDayInfo.weekOfYear}${this.getOrdinalSuffix(birthDayInfo.weekOfYear)} week`;
        document.getElementById('birthSeason').textContent = birthDayInfo.season;

        // Show results and animate
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.classList.add('visible');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        this.animateResults();
    }

    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j == 1 && k != 11) return "st";
        if (j == 2 && k != 12) return "nd";
        if (j == 3 && k != 13) return "rd";
        return "th";
    }

    animateResults() {
        // Animate age numbers
        const ageNumbers = document.querySelectorAll('.age-value, .countdown-number, .stat-number');
        ageNumbers.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });

        // Animate celebration emoji
        const celebration = document.querySelector('.age-celebration');
        if (celebration) {
            celebration.style.animation = 'bounce 2s infinite';
        }
    }

    resetCalculator() {
        // Reset form
        document.getElementById('birthDate').value = '';
        document.getElementById('currentDate').value = new Date().toISOString().split('T')[0];
        
        // Hide results
        document.getElementById('resultsSection').classList.remove('visible');
        
        // Clear data
        this.birthDate = null;
        this.currentDate = null;
        this.results = null;
        
        // Clear storage
        localStorage.removeItem('ageCalculatorData');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    shareResults() {
        if (!this.results) return;
        
        const { exact, zodiac, generation } = this.results;
        const shareText = `I'm ${exact.years} years ${exact.months} months and ${exact.days} days old! 🎂\n` +
                         `Zodiac: ${zodiac.name} ${zodiac.icon}\n` +
                         `Generation: ${generation.name}\n` +
                         `Calculate your age at ZapIt Tools!`;
        
        if (navigator.share) {
            navigator.share({
                title: 'My Age Calculation Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showSuccess('Results copied to clipboard!');
            }).catch(() => {
                this.showError('Failed to copy results');
            });
        }
    }

    saveToStorage() {
        const data = {
            birthDate: this.birthDate ? this.birthDate.toISOString() : null,
            currentDate: this.currentDate ? this.currentDate.toISOString() : null,
            results: this.results,
            timestamp: Date.now()
        };
        
        localStorage.setItem('ageCalculatorData', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('ageCalculatorData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                // Load data if it's less than 24 hours old
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    if (data.birthDate) {
                        this.birthDate = new Date(data.birthDate);
                        document.getElementById('birthDate').value = this.birthDate.toISOString().split('T')[0];
                    }
                    
                    if (data.currentDate) {
                        this.currentDate = new Date(data.currentDate);
                        document.getElementById('currentDate').value = this.currentDate.toISOString().split('T')[0];
                    }
                    
                    if (data.results) {
                        this.results = data.results;
                        // Auto-calculate if we have valid saved data
                        if (this.birthDate && this.currentDate) {
                            this.displayResults();
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            transform: translateX(400px);
        `;
        
        if (type === 'error') {
            messageDiv.style.background = '#ef4444';
            messageDiv.innerHTML = `<span>⚠️</span><span>${message}</span>`;
        } else {
            messageDiv.style.background = '#10b981';
            messageDiv.innerHTML = `<span>✅</span><span>${message}</span>`;
        }
        
        document.body.appendChild(messageDiv);
        
        // Animate in
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(400px)';
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, type === 'error' ? 5000 : 3000);
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AgeCalculator();
});