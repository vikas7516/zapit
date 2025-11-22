class IpLookup {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.map = null;
        this.marker = null;

        // Auto lookup on load
        this.lookupIp();
    }

    initElements() {
        this.ipInput = document.getElementById('ipInput');
        this.lookupBtn = document.getElementById('lookupBtn');
        this.resultsSection = document.getElementById('resultsSection');
        this.detailsContainer = document.getElementById('detailsContainer');
    }

    bindEvents() {
        this.lookupBtn.addEventListener('click', () => this.lookupIp(this.ipInput.value));
        this.ipInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.lookupIp(this.ipInput.value);
        });
    }

    async lookupIp(ip = '') {
        this.lookupBtn.textContent = 'Searching...';
        this.lookupBtn.disabled = true;

        try {
            // Use ip-api.com (free for non-commercial use, no key needed, http/https supported)
            // If ip is empty, it returns the requester's IP info
            const url = `http://ip-api.com/json/${ip}`;

            // Note: ip-api.com free endpoint is HTTP only for some regions or has rate limits.
            // For HTTPS support on GitHub Pages/production, we might need a different provider or a proxy.
            // However, for this "frontend-only" constraint, we'll try to use a service that supports CORS and HTTPS if possible.
            // ipapi.co/json/ is another option. Let's try ipapi.co first as it supports HTTPS.

            const apiUrl = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            if (data.error) {
                throw new Error(data.reason || 'IP lookup failed');
            }

            this.displayResults(data);

        } catch (error) {
            console.error('Lookup failed:', error);
            // Fallback or error message
            this.detailsContainer.innerHTML = `<div class="result-item" style="color: red;">Error: ${error.message}. Please try again or disable ad-blockers.</div>`;
            this.resultsSection.classList.remove('hidden');
        } finally {
            this.lookupBtn.textContent = 'Lookup';
            this.lookupBtn.disabled = false;
        }
    }

    displayResults(data) {
        this.resultsSection.classList.remove('hidden');

        // Update Details
        this.detailsContainer.innerHTML = '';
        const fields = [
            { label: 'IP Address', value: data.ip },
            { label: 'City', value: data.city },
            { label: 'Region', value: data.region },
            { label: 'Country', value: data.country_name },
            { label: 'ISP', value: data.org },
            { label: 'ASN', value: data.asn },
            { label: 'Postal Code', value: data.postal },
            { label: 'Timezone', value: data.timezone },
            { label: 'Coordinates', value: `${data.latitude}, ${data.longitude}` }
        ];

        fields.forEach(field => {
            if (field.value) {
                const row = document.createElement('div');
                row.className = 'result-item';
                row.innerHTML = `
                    <span class="result-label">${field.label}</span>
                    <span class="result-value">${field.value}</span>
                `;
                this.detailsContainer.appendChild(row);
            }
        });

        // Update Map
        if (data.latitude && data.longitude) {
            this.updateMap(data.latitude, data.longitude);
        }
    }

    updateMap(lat, lng) {
        if (!this.map) {
            this.map = L.map('map').setView([lat, lng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
        } else {
            this.map.setView([lat, lng], 13);
        }

        if (this.marker) {
            this.map.removeLayer(this.marker);
        }

        this.marker = L.marker([lat, lng]).addTo(this.map);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new IpLookup();
});
