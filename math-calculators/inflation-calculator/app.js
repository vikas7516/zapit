class InflationCalculator {
    constructor() {
        this.currentMode = 'purchasing-power';
        this.historicalCPI = this.getHistoricalCPI();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadHistoricalData();
        this.setCurrentYear();
        
        // Load saved settings
        this.loadSettings();
    }

    bindEvents() {
        // Mode switching
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });

        // Calculate button
        document.getElementById('calculateBtn').addEventListener('click', () => this.calculate());

        // Real-time calculation on input
        this.bindInputEvents();

        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.loadExample(e.currentTarget.dataset.example));
        });

        // Actions
        document.getElementById('shareBtn').addEventListener('click', () => this.shareResults());
        document.getElementById('chartBtn').addEventListener('click', () => this.showChart());
        document.getElementById('dataView').addEventListener('change', (e) => this.updateHistoricalData(e.target.value));

        // Input formatting
        this.bindFormatting();
    }

    bindInputEvents() {
        const inputs = ['initialAmount', 'startYear', 'endYear', 'customInflation',
                       'pastPrice', 'currentPrice', 'rateStartYear', 'rateEndYear',
                       'presentValue', 'projectionYears', 'expectedInflation', 'baseYear'];
        
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.validateAndCalculate());
                element.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.calculate();
                });
            }
        });
    }

    bindFormatting() {
        // Format currency inputs
        const currencyInputs = document.querySelectorAll('.amount-input');
        currencyInputs.forEach(input => {
            input.addEventListener('input', (e) => this.formatCurrency(e.target));
            input.addEventListener('blur', (e) => this.formatCurrencyOnBlur(e.target));
        });
    }

    switchMode(mode) {
        if (this.currentMode === mode) return;
        
        this.currentMode = mode;
        
        // Update active button
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Show/hide sections
        document.querySelectorAll('.calculation-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        const modeMap = {
            'purchasing-power': 'purchasingPowerMode',
            'inflation-rate': 'inflationRateMode',
            'future-value': 'futureValueMode'
        };
        
        document.getElementById(modeMap[mode]).classList.remove('hidden');
        
        // Clear results
        this.clearResults();
        
        // Save mode
        localStorage.setItem('inflationCalculatorMode', mode);
    }

    validateAndCalculate() {
        // Auto-calculate if all required fields are filled
        if (this.hasRequiredFields()) {
            setTimeout(() => this.calculate(), 300);
        }
    }

    hasRequiredFields() {
        switch (this.currentMode) {
            case 'purchasing-power':
                const amount = document.getElementById('initialAmount').value;
                const startYear = document.getElementById('startYear').value;
                const endYear = document.getElementById('endYear').value;
                return amount && startYear && endYear;
                
            case 'inflation-rate':
                const pastPrice = document.getElementById('pastPrice').value;
                const currentPrice = document.getElementById('currentPrice').value;
                const rateStartYear = document.getElementById('rateStartYear').value;
                const rateEndYear = document.getElementById('rateEndYear').value;
                return pastPrice && currentPrice && rateStartYear && rateEndYear;
                
            case 'future-value':
                const presentValue = document.getElementById('presentValue').value;
                const projectionYears = document.getElementById('projectionYears').value;
                const expectedInflation = document.getElementById('expectedInflation').value;
                return presentValue && projectionYears && expectedInflation;
                
            default:
                return false;
        }
    }

    calculate() {
        switch (this.currentMode) {
            case 'purchasing-power':
                this.calculatePurchasingPower();
                break;
            case 'inflation-rate':
                this.calculateInflationRate();
                break;
            case 'future-value':
                this.calculateFutureValue();
                break;
        }
    }

    calculatePurchasingPower() {
        const amount = this.parseNumber(document.getElementById('initialAmount').value);
        const startYear = parseInt(document.getElementById('startYear').value);
        const endYear = parseInt(document.getElementById('endYear').value);
        const customRate = parseFloat(document.getElementById('customInflation').value);

        if (!amount || !startYear || !endYear || startYear >= endYear) {
            this.showError('Please enter valid values');
            return;
        }

        let inflationRate;
        let dataSource;

        if (customRate && customRate > 0) {
            inflationRate = customRate / 100;
            dataSource = 'Custom Rate';
        } else {
            const cpiStart = this.getCPI(startYear);
            const cpiEnd = this.getCPI(endYear);
            
            if (!cpiStart || !cpiEnd) {
                this.showError('Historical data not available for selected years');
                return;
            }
            
            const years = endYear - startYear;
            inflationRate = Math.pow(cpiEnd / cpiStart, 1/years) - 1;
            dataSource = 'Historical CPI Data';
        }

        const years = endYear - startYear;
        const inflationFactor = Math.pow(1 + inflationRate, years);
        const equivalentValue = amount * inflationFactor;
        const totalInflation = (inflationFactor - 1) * 100;
        const purchasingPowerLoss = ((amount - (amount / inflationFactor)) / amount) * 100;

        this.displayPurchasingPowerResults({
            originalAmount: amount,
            equivalentValue,
            startYear,
            endYear,
            years,
            annualInflationRate: inflationRate * 100,
            totalInflation,
            purchasingPowerLoss,
            dataSource
        });
    }

    calculateInflationRate() {
        const pastPrice = this.parseNumber(document.getElementById('pastPrice').value);
        const currentPrice = this.parseNumber(document.getElementById('currentPrice').value);
        const startYear = parseInt(document.getElementById('rateStartYear').value);
        const endYear = parseInt(document.getElementById('rateEndYear').value);

        if (!pastPrice || !currentPrice || !startYear || !endYear || startYear >= endYear) {
            this.showError('Please enter valid values');
            return;
        }

        const years = endYear - startYear;
        const totalInflation = ((currentPrice - pastPrice) / pastPrice) * 100;
        const annualInflationRate = (Math.pow(currentPrice / pastPrice, 1/years) - 1) * 100;

        // Compare with official CPI data
        const cpiStart = this.getCPI(startYear);
        const cpiEnd = this.getCPI(endYear);
        let officialRate = null;

        if (cpiStart && cpiEnd) {
            officialRate = (Math.pow(cpiEnd / cpiStart, 1/years) - 1) * 100;
        }

        this.displayInflationRateResults({
            pastPrice,
            currentPrice,
            startYear,
            endYear,
            years,
            totalInflation,
            annualInflationRate,
            officialRate
        });
    }

    calculateFutureValue() {
        const presentValue = this.parseNumber(document.getElementById('presentValue').value);
        const years = parseInt(document.getElementById('projectionYears').value);
        const inflationRate = parseFloat(document.getElementById('expectedInflation').value) / 100;
        const baseYear = parseInt(document.getElementById('baseYear').value) || new Date().getFullYear();

        if (!presentValue || !years || !inflationRate) {
            this.showError('Please enter valid values');
            return;
        }

        const futureValue = presentValue * Math.pow(1 + inflationRate, years);
        const totalInflation = (Math.pow(1 + inflationRate, years) - 1) * 100;
        const purchasingPowerDecline = ((presentValue - (presentValue / Math.pow(1 + inflationRate, years))) / presentValue) * 100;

        // Calculate year-by-year breakdown
        const yearByYear = [];
        for (let i = 1; i <= Math.min(years, 10); i++) {
            const value = presentValue * Math.pow(1 + inflationRate, i);
            yearByYear.push({
                year: baseYear + i,
                value: value,
                cumulativeInflation: (Math.pow(1 + inflationRate, i) - 1) * 100
            });
        }

        this.displayFutureValueResults({
            presentValue,
            futureValue,
            years,
            baseYear,
            targetYear: baseYear + years,
            annualInflationRate: inflationRate * 100,
            totalInflation,
            purchasingPowerDecline,
            yearByYear
        });
    }

    displayPurchasingPowerResults(data) {
        const html = `
            <div class="results-summary">
                <div class="result-primary">
                    <div class="result-amount">
                        <span class="amount-label">Equivalent Value</span>
                        <span class="amount-value">${this.formatCurrency(data.equivalentValue)}</span>
                        <span class="amount-context">in ${data.endYear}</span>
                    </div>
                </div>
                
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Original Amount</span>
                        <span class="result-value">${this.formatCurrency(data.originalAmount)}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Time Period</span>
                        <span class="result-value">${data.years} years</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Annual Inflation</span>
                        <span class="result-value">${data.annualInflationRate.toFixed(2)}%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Total Inflation</span>
                        <span class="result-value">${data.totalInflation.toFixed(1)}%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Purchasing Power Loss</span>
                        <span class="result-value negative">${data.purchasingPowerLoss.toFixed(1)}%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Data Source</span>
                        <span class="result-value">${data.dataSource}</span>
                    </div>
                </div>
            </div>

            <div class="analysis-section">
                <h4>Analysis</h4>
                <div class="analysis-content">
                    <p><strong>Purchasing Power Impact:</strong> ${this.formatCurrency(data.originalAmount)} in ${data.startYear} had the same purchasing power as ${this.formatCurrency(data.equivalentValue)} in ${data.endYear}.</p>
                    
                    <p><strong>Real Value Loss:</strong> Your original ${this.formatCurrency(data.originalAmount)} would lose ${data.purchasingPowerLoss.toFixed(1)}% of its purchasing power over ${data.years} years at an average inflation rate of ${data.annualInflationRate.toFixed(2)}% annually.</p>
                    
                    ${this.getInflationContext(data.annualInflationRate)}
                </div>
            </div>
        `;

        document.getElementById('resultsContent').innerHTML = html;
        this.animateResults();
    }

    displayInflationRateResults(data) {
        const html = `
            <div class="results-summary">
                <div class="result-primary">
                    <div class="result-amount">
                        <span class="amount-label">Annual Inflation Rate</span>
                        <span class="amount-value">${data.annualInflationRate.toFixed(2)}%</span>
                        <span class="amount-context">per year</span>
                    </div>
                </div>
                
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Past Price (${data.startYear})</span>
                        <span class="result-value">${this.formatCurrency(data.pastPrice)}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Current Price (${data.endYear})</span>
                        <span class="result-value">${this.formatCurrency(data.currentPrice)}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Time Period</span>
                        <span class="result-value">${data.years} years</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Total Inflation</span>
                        <span class="result-value">${data.totalInflation.toFixed(1)}%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Price Increase</span>
                        <span class="result-value">${this.formatCurrency(data.currentPrice - data.pastPrice)}</span>
                    </div>
                    ${data.officialRate ? `
                    <div class="result-item">
                        <span class="result-label">Official CPI Rate</span>
                        <span class="result-value">${data.officialRate.toFixed(2)}%</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <div class="analysis-section">
                <h4>Analysis</h4>
                <div class="analysis-content">
                    <p><strong>Price Change:</strong> The item increased from ${this.formatCurrency(data.pastPrice)} to ${this.formatCurrency(data.currentPrice)}, representing a ${data.totalInflation.toFixed(1)}% total increase over ${data.years} years.</p>
                    
                    <p><strong>Annual Rate:</strong> This translates to an average annual inflation rate of ${data.annualInflationRate.toFixed(2)}%.</p>
                    
                    ${data.officialRate ? `<p><strong>Comparison:</strong> The official CPI inflation rate for this period was ${data.officialRate.toFixed(2)}%. Your item ${data.annualInflationRate > data.officialRate ? 'inflated faster' : 'inflated slower'} than the general economy.</p>` : ''}
                    
                    ${this.getInflationContext(data.annualInflationRate)}
                </div>
            </div>
        `;

        document.getElementById('resultsContent').innerHTML = html;
        this.animateResults();
    }

    displayFutureValueResults(data) {
        const html = `
            <div class="results-summary">
                <div class="result-primary">
                    <div class="result-amount">
                        <span class="amount-label">Future Equivalent Value</span>
                        <span class="amount-value">${this.formatCurrency(data.futureValue)}</span>
                        <span class="amount-context">in ${data.targetYear}</span>
                    </div>
                </div>
                
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">Present Value</span>
                        <span class="result-value">${this.formatCurrency(data.presentValue)}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Time Period</span>
                        <span class="result-value">${data.years} years</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Expected Inflation</span>
                        <span class="result-value">${data.annualInflationRate.toFixed(1)}%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Total Inflation</span>
                        <span class="result-value">${data.totalInflation.toFixed(1)}%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Purchasing Power Decline</span>
                        <span class="result-value negative">${data.purchasingPowerDecline.toFixed(1)}%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Required Increase</span>
                        <span class="result-value">${this.formatCurrency(data.futureValue - data.presentValue)}</span>
                    </div>
                </div>
            </div>

            <div class="projection-table">
                <h4>Year-by-Year Projection</h4>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Year</th>
                                <th>Equivalent Value</th>
                                <th>Cumulative Inflation</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.yearByYear.map(year => `
                                <tr>
                                    <td>${year.year}</td>
                                    <td>${this.formatCurrency(year.value)}</td>
                                    <td>${year.cumulativeInflation.toFixed(1)}%</td>
                                </tr>
                            `).join('')}
                            ${data.years > 10 ? `
                                <tr class="table-summary">
                                    <td>...</td>
                                    <td>...</td>
                                    <td>...</td>
                                </tr>
                                <tr class="table-final">
                                    <td><strong>${data.targetYear}</strong></td>
                                    <td><strong>${this.formatCurrency(data.futureValue)}</strong></td>
                                    <td><strong>${data.totalInflation.toFixed(1)}%</strong></td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="analysis-section">
                <h4>Analysis</h4>
                <div class="analysis-content">
                    <p><strong>Future Value:</strong> ${this.formatCurrency(data.presentValue)} today will need to grow to ${this.formatCurrency(data.futureValue)} in ${data.years} years to maintain the same purchasing power.</p>
                    
                    <p><strong>Investment Requirement:</strong> To preserve purchasing power, your money needs to earn at least ${data.annualInflationRate.toFixed(1)}% annually.</p>
                    
                    ${this.getInflationContext(data.annualInflationRate)}
                </div>
            </div>
        `;

        document.getElementById('resultsContent').innerHTML = html;
        this.animateResults();
    }

    getInflationContext(rate) {
        if (rate < 2) {
            return `<p><strong>Context:</strong> This inflation rate (${rate.toFixed(1)}%) is considered low and generally favorable for economic stability.</p>`;
        } else if (rate < 4) {
            return `<p><strong>Context:</strong> This inflation rate (${rate.toFixed(1)}%) is moderate and within typical central bank targets.</p>`;
        } else if (rate < 10) {
            return `<p><strong>Context:</strong> This inflation rate (${rate.toFixed(1)}%) is elevated and may impact purchasing power significantly.</p>`;
        } else {
            return `<p><strong>Context:</strong> This inflation rate (${rate.toFixed(1)}%) is very high and would severely erode purchasing power.</p>`;
        }
    }

    loadExample(example) {
        const examples = {
            house: {
                mode: 'purchasing-power',
                data: { initialAmount: '200000', startYear: '2000', endYear: '2024' }
            },
            salary: {
                mode: 'purchasing-power',
                data: { initialAmount: '50000', startYear: '1990', endYear: '2024' }
            },
            retirement: {
                mode: 'future-value',
                data: { presentValue: '1000000', projectionYears: '30', expectedInflation: '3.2', baseYear: '2024' }
            }
        };

        const ex = examples[example];
        if (!ex) return;

        // Switch to appropriate mode
        this.switchMode(ex.mode);

        // Set values
        Object.entries(ex.data).forEach(([field, value]) => {
            const element = document.getElementById(field);
            if (element) {
                element.value = value;
                if (element.classList.contains('amount-input')) {
                    this.formatCurrencyOnBlur(element);
                }
            }
        });

        // Calculate
        setTimeout(() => this.calculate(), 100);
    }

    getCPI(year) {
        return this.historicalCPI[year] || null;
    }

    getHistoricalCPI() {
        // Simplified historical CPI data (1982-1984 = 100 base)
        return {
            1913: 9.9, 1920: 20.0, 1930: 16.7, 1940: 14.0, 1950: 24.1,
            1960: 29.6, 1970: 38.8, 1980: 82.4, 1990: 130.7, 2000: 172.2,
            2001: 177.1, 2002: 179.9, 2003: 184.0, 2004: 188.9, 2005: 195.3,
            2006: 201.6, 2007: 207.3, 2008: 215.3, 2009: 214.5, 2010: 218.1,
            2011: 224.9, 2012: 229.6, 2013: 233.0, 2014: 236.7, 2015: 237.0,
            2016: 240.0, 2017: 245.1, 2018: 251.1, 2019: 255.7, 2020: 258.8,
            2021: 271.0, 2022: 292.7, 2023: 307.0, 2024: 307.7
        };
    }

    loadHistoricalData() {
        const dataView = document.getElementById('dataView').value;
        this.updateHistoricalData(dataView);
    }

    updateHistoricalData(view) {
        const content = document.getElementById('historicalContent');
        
        switch (view) {
            case 'recent':
                content.innerHTML = this.getRecentDataHTML();
                break;
            case 'decades':
                content.innerHTML = this.getDecadeDataHTML();
                break;
            case 'major-events':
                content.innerHTML = this.getMajorEventsHTML();
                break;
        }
    }

    getRecentDataHTML() {
        const recentYears = [];
        const currentYear = 2024;
        
        for (let year = currentYear - 9; year <= currentYear; year++) {
            const cpi = this.getCPI(year);
            const prevCpi = this.getCPI(year - 1);
            const inflation = prevCpi ? ((cpi - prevCpi) / prevCpi * 100) : null;
            
            recentYears.push({ year, cpi, inflation });
        }

        return `
            <div class="historical-table">
                <table>
                    <thead>
                        <tr>
                            <th>Year</th>
                            <th>CPI</th>
                            <th>Inflation Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recentYears.map(data => `
                            <tr>
                                <td>${data.year}</td>
                                <td>${data.cpi ? data.cpi.toFixed(1) : 'N/A'}</td>
                                <td class="${data.inflation > 0 ? 'positive' : data.inflation < 0 ? 'negative' : ''}">
                                    ${data.inflation ? data.inflation.toFixed(1) + '%' : 'N/A'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getDecadeDataHTML() {
        const decades = [
            { period: '1913-1920', avg: 8.3, note: 'WWI era high inflation' },
            { period: '1920s', avg: -1.1, note: 'Post-war deflation' },
            { period: '1930s', avg: -2.0, note: 'Great Depression deflation' },
            { period: '1940s', avg: 5.4, note: 'WWII and post-war inflation' },
            { period: '1950s', avg: 2.1, note: 'Post-war economic growth' },
            { period: '1960s', avg: 2.3, note: 'Stable growth period' },
            { period: '1970s', avg: 7.4, note: 'Oil crisis stagflation' },
            { period: '1980s', avg: 5.1, note: 'Volcker disinflation' },
            { period: '1990s', avg: 3.0, note: 'Moderate growth' },
            { period: '2000s', avg: 2.6, note: 'Great Moderation' },
            { period: '2010s', avg: 1.8, note: 'Post-crisis low inflation' },
            { period: '2020s', avg: 4.8, note: 'Pandemic-era inflation' }
        ];

        return `
            <div class="decades-data">
                ${decades.map(decade => `
                    <div class="decade-item">
                        <div class="decade-header">
                            <span class="decade-period">${decade.period}</span>
                            <span class="decade-rate ${decade.avg > 0 ? 'positive' : 'negative'}">
                                ${decade.avg > 0 ? '+' : ''}${decade.avg.toFixed(1)}%
                            </span>
                        </div>
                        <div class="decade-note">${decade.note}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getMajorEventsHTML() {
        const events = [
            { year: '1918-1920', event: 'Post-WWI Inflation', rate: 15.6, impact: 'Wartime demand and supply shortages' },
            { year: '1929-1933', event: 'Great Depression', rate: -6.4, impact: 'Massive deflation and economic collapse' },
            { year: '1973-1975', event: 'Oil Crisis', rate: 11.0, impact: 'Oil embargo quadrupled prices' },
            { year: '1979-1981', event: 'Second Oil Crisis', rate: 13.3, impact: 'Iranian Revolution disrupted oil supply' },
            { year: '2008-2009', event: 'Financial Crisis', rate: -0.4, impact: 'Deflationary pressures from recession' },
            { year: '2020-2022', event: 'COVID-19 Pandemic', rate: 8.0, impact: 'Supply chains and fiscal stimulus' }
        ];

        return `
            <div class="events-data">
                ${events.map(event => `
                    <div class="event-item">
                        <div class="event-header">
                            <span class="event-year">${event.year}</span>
                            <span class="event-rate ${event.rate > 0 ? 'positive' : 'negative'}">
                                ${event.rate > 0 ? '+' : ''}${event.rate.toFixed(1)}%
                            </span>
                        </div>
                        <div class="event-name">${event.event}</div>
                        <div class="event-impact">${event.impact}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    setCurrentYear() {
        const currentYear = new Date().getFullYear();
        document.getElementById('endYear').value = currentYear;
        document.getElementById('rateEndYear').value = currentYear;
        document.getElementById('baseYear').value = currentYear;
    }

    formatCurrency(amount) {
        if (typeof amount === 'string') {
            amount = this.parseNumber(amount);
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatCurrencyInput(input) {
        let value = input.value.replace(/[^\d.]/g, '');
        if (value) {
            const parts = value.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            input.value = parts.join('.');
        }
    }

    formatCurrencyOnBlur(input) {
        const value = this.parseNumber(input.value);
        if (value) {
            input.value = value.toLocaleString('en-US');
        }
    }

    parseNumber(value) {
        if (typeof value === 'number') return value;
        return parseFloat(value.toString().replace(/[^\d.-]/g, '')) || 0;
    }

    showError(message) {
        document.getElementById('resultsContent').innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h4>Invalid Input</h4>
                <p>${message}</p>
            </div>
        `;
    }

    clearResults() {
        document.getElementById('resultsContent').innerHTML = `
            <div class="results-placeholder">
                <div class="placeholder-icon">💰</div>
                <h4>Ready to Calculate</h4>
                <p>Enter values above to analyze inflation and purchasing power</p>
            </div>
        `;
    }

    animateResults() {
        const results = document.getElementById('resultsContent');
        results.style.opacity = '0';
        results.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            results.style.transition = 'all 0.3s ease';
            results.style.opacity = '1';
            results.style.transform = 'translateY(0)';
        }, 50);
    }

    shareResults() {
        const mode = this.currentMode;
        const results = document.querySelector('.results-summary');
        
        if (!results) {
            alert('No results to share. Please calculate first.');
            return;
        }

        const text = this.getShareText();
        
        if (navigator.share) {
            navigator.share({
                title: 'Inflation Calculator Results',
                text: text,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                alert('Results copied to clipboard!');
            });
        }
    }

    getShareText() {
        switch (this.currentMode) {
            case 'purchasing-power':
                const amount = document.getElementById('initialAmount').value;
                const startYear = document.getElementById('startYear').value;
                const endYear = document.getElementById('endYear').value;
                return `💰 Inflation Analysis: $${amount} in ${startYear} has the same purchasing power as the equivalent value in ${endYear}. Calculate your inflation impact at ZapIt Tools!`;
                
            case 'inflation-rate':
                return `📈 Inflation Rate Analysis: Check how prices have changed over time and compare with official CPI data. Analyze your inflation impact at ZapIt Tools!`;
                
            case 'future-value':
                const presentValue = document.getElementById('presentValue').value;
                const years = document.getElementById('projectionYears').value;
                return `🔮 Future Value Analysis: $${presentValue} today will need to grow significantly in ${years} years to maintain purchasing power. Plan for inflation at ZapIt Tools!`;
                
            default:
                return `💰 Inflation Calculator: Analyze purchasing power, inflation rates, and future values at ZapIt Tools!`;
        }
    }

    showChart() {
        alert('Chart visualization coming soon! This feature will show inflation trends over time.');
    }

    saveSettings() {
        const settings = {
            mode: this.currentMode
        };
        localStorage.setItem('inflationCalculatorSettings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('inflationCalculatorSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                if (settings.mode) {
                    this.switchMode(settings.mode);
                }
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }

        // Load saved mode
        const savedMode = localStorage.getItem('inflationCalculatorMode');
        if (savedMode && savedMode !== this.currentMode) {
            this.switchMode(savedMode);
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InflationCalculator();
});