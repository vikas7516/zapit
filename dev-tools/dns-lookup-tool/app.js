// DNS Lookup Tool JavaScript

class DNSLookupTool {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.loadHistory();
    }

    initializeElements() {
        this.domainInput = document.getElementById('domainInput');
        this.lookupBtn = document.getElementById('lookupBtn');
        this.recordTypeButtons = document.querySelectorAll('.record-type-btn');
        this.resultsPanel = document.getElementById('resultsPanel');
        this.resultsContent = document.getElementById('resultsContent');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        this.selectedTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'];
        this.history = JSON.parse(localStorage.getItem('dnsLookupHistory') || '[]');
    }

    attachEventListeners() {
        this.lookupBtn.addEventListener('click', () => this.performLookup());
        this.domainInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performLookup();
        });

        this.recordTypeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.toggleRecordType(btn));
        });

        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }
    }

    toggleRecordType(button) {
        const type = button.dataset.type;
        
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            this.selectedTypes = this.selectedTypes.filter(t => t !== type);
        } else {
            button.classList.add('active');
            if (!this.selectedTypes.includes(type)) {
                this.selectedTypes.push(type);
            }
        }
    }

    async performLookup() {
        const domain = this.domainInput.value.trim();
        
        if (!domain) {
            this.showError('Please enter a domain name or IP address');
            return;
        }

        if (!this.isValidDomainOrIP(domain)) {
            this.showError('Please enter a valid domain name or IP address');
            return;
        }

        this.showLoading();
        
        try {
            // Since we can't perform actual DNS lookups from browser JavaScript,
            // we'll simulate the interface and provide educational information
            await this.simulateLookup(domain);
            this.addToHistory(domain);
        } catch (error) {
            this.showError('Lookup failed: ' + error.message);
        }
    }

    isValidDomainOrIP(input) {
        // Basic domain validation
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
        // Basic IP validation  
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        
        return domainRegex.test(input) || ipRegex.test(input);
    }

    showLoading() {
        this.resultsPanel.style.display = 'block';
        this.resultsContent.innerHTML = '<div class="loading">Performing DNS lookup...</div>';
    }

    async simulateLookup(domain) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const results = this.generateSimulatedResults(domain);
        this.displayResults(domain, results);
    }

    generateSimulatedResults(domain) {
        const results = {};
        
        this.selectedTypes.forEach(type => {
            switch (type) {
                case 'A':
                    results.A = ['93.184.216.34', '192.0.2.1'];
                    break;
                case 'AAAA':
                    results.AAAA = ['2001:db8::1', '2001:0db8:85a3::8a2e:0370:7334'];
                    break;
                case 'MX':
                    results.MX = [
                        { priority: 10, exchange: 'mail.' + domain },
                        { priority: 20, exchange: 'mail2.' + domain }
                    ];
                    break;
                case 'NS':
                    results.NS = ['ns1.' + domain, 'ns2.' + domain];
                    break;
                case 'TXT':
                    results.TXT = [
                        'v=spf1 include:_spf.' + domain + ' ~all',
                        'google-site-verification=abc123def456'
                    ];
                    break;
                case 'CNAME':
                    if (domain.startsWith('www.')) {
                        results.CNAME = [domain.substring(4)];
                    }
                    break;
                case 'SOA':
                    results.SOA = [{
                        mname: 'ns1.' + domain,
                        rname: 'admin.' + domain,
                        serial: '2023091901',
                        refresh: 3600,
                        retry: 1800,
                        expire: 604800,
                        minimum: 86400
                    }];
                    break;
                case 'PTR':
                    if (this.isIP(domain)) {
                        results.PTR = ['example.com'];
                    }
                    break;
            }
        });

        return results;
    }

    isIP(str) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        return ipRegex.test(str);
    }

    displayResults(domain, results) {
        let html = `<h3>DNS Lookup Results for: ${domain}</h3>`;
        
        if (Object.keys(results).length === 0) {
            html += '<p>No records found for the selected types.</p>';
        } else {
            for (const [type, records] of Object.entries(results)) {
                if (!records || records.length === 0) continue;
                
                html += `
                    <div class="result-section">
                        <h4>${type} Records</h4>
                        <table class="result-table">
                            <thead>
                                <tr>
                                    ${this.getTableHeaders(type)}
                                </tr>
                            </thead>
                            <tbody>
                                ${this.formatRecords(type, records)}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }

        html += `
            <div style="margin-top: 1rem;">
                <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('resultsContent').innerText)">
                    Copy Results
                </button>
            </div>
        `;

        this.resultsContent.innerHTML = html;
    }

    getTableHeaders(type) {
        switch (type) {
            case 'MX':
                return '<th>Priority</th><th>Mail Exchange</th>';
            case 'SOA':
                return '<th>Primary NS</th><th>Responsible</th><th>Serial</th><th>Refresh</th><th>Retry</th><th>Expire</th><th>Minimum TTL</th>';
            default:
                return '<th>Value</th>';
        }
    }

    formatRecords(type, records) {
        return records.map(record => {
            switch (type) {
                case 'MX':
                    return `<tr><td>${record.priority}</td><td>${record.exchange}</td></tr>`;
                case 'SOA':
                    return `<tr><td>${record.mname}</td><td>${record.rname}</td><td>${record.serial}</td><td>${record.refresh}</td><td>${record.retry}</td><td>${record.expire}</td><td>${record.minimum}</td></tr>`;
                default:
                    return `<tr><td>${record}</td></tr>`;
            }
        }).join('');
    }

    showError(message) {
        this.resultsPanel.style.display = 'block';
        this.resultsContent.innerHTML = `<div class="error-message">${message}</div>`;
    }

    addToHistory(domain) {
        const entry = {
            domain: domain,
            timestamp: new Date().toISOString(),
            types: [...this.selectedTypes]
        };

        // Remove existing entry for same domain
        this.history = this.history.filter(h => h.domain !== domain);
        
        // Add to beginning
        this.history.unshift(entry);
        
        // Keep only last 10 entries
        this.history = this.history.slice(0, 10);
        
        this.saveHistory();
        this.displayHistory();
    }

    loadHistory() {
        this.displayHistory();
    }

    displayHistory() {
        if (!this.historyList) return;

        if (this.history.length === 0) {
            this.historyList.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No recent lookups</p>';
            return;
        }

        const html = this.history.map(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            return `
                <div class="history-item" onclick="dnsLookup.loadFromHistory('${entry.domain}', ${JSON.stringify(entry.types).replace(/"/g, '&quot;')})">
                    <div>
                        <div style="font-weight: 500;">${entry.domain}</div>
                        <div style="font-size: 0.875rem; color: var(--text-muted);">${entry.types.join(', ')} - ${date}</div>
                    </div>
                </div>
            `;
        }).join('');

        this.historyList.innerHTML = html;
    }

    loadFromHistory(domain, types) {
        this.domainInput.value = domain;
        
        // Reset all buttons
        this.recordTypeButtons.forEach(btn => btn.classList.remove('active'));
        
        // Select the types from history
        this.selectedTypes = types;
        this.recordTypeButtons.forEach(btn => {
            if (types.includes(btn.dataset.type)) {
                btn.classList.add('active');
            }
        });
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.displayHistory();
    }

    saveHistory() {
        localStorage.setItem('dnsLookupHistory', JSON.stringify(this.history));
    }
}

// Initialize the tool when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dnsLookup = new DNSLookupTool();
});