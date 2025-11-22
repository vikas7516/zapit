class ApiRequestBuilder {
    constructor() {
        this.initElements();
        this.bindEvents();
        this.addKeyValueRow('paramsList');
        this.addKeyValueRow('headersList');
    }

    initElements() {
        this.urlInput = document.getElementById('url');
        this.methodSelect = document.getElementById('method');
        this.sendBtn = document.getElementById('sendBtn');

        this.tabs = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');

        this.paramsList = document.getElementById('paramsList');
        this.headersList = document.getElementById('headersList');
        this.addParamBtn = document.getElementById('addParamBtn');
        this.addHeaderBtn = document.getElementById('addHeaderBtn');
        this.requestBody = document.getElementById('requestBody');

        this.responseSection = document.getElementById('responseSection');
        this.responseOutput = document.getElementById('responseOutput');
        this.statusDisplay = document.getElementById('status');
        this.timeDisplay = document.getElementById('time');
        this.sizeDisplay = document.getElementById('size');
    }

    bindEvents() {
        this.sendBtn.addEventListener('click', () => this.sendRequest());

        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.tabs.forEach(t => {
                    t.classList.remove('active');
                    t.style.borderBottom = 'none';
                    t.style.color = 'var(--tool-text-secondary)';
                });
                this.tabContents.forEach(c => c.classList.add('hidden'));

                tab.classList.add('active');
                tab.style.borderBottom = '2px solid var(--tool-input-focus)';
                tab.style.color = 'var(--tool-text)';
                document.getElementById(`${tab.dataset.tab}Tab`).classList.remove('hidden');
            });
        });

        this.addParamBtn.addEventListener('click', () => this.addKeyValueRow('paramsList'));
        this.addHeaderBtn.addEventListener('click', () => this.addKeyValueRow('headersList'));
    }

    addKeyValueRow(containerId) {
        const container = document.getElementById(containerId);
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '0.5rem';
        row.style.marginBottom = '0.5rem';

        row.innerHTML = `
            <input type="text" placeholder="Key" class="key-input" style="flex: 1; padding: 0.5rem; border: 1px solid var(--tool-input-border); border-radius: 4px;">
            <input type="text" placeholder="Value" class="value-input" style="flex: 1; padding: 0.5rem; border: 1px solid var(--tool-input-border); border-radius: 4px;">
            <button class="remove-btn" style="padding: 0.5rem; background: none; border: none; cursor: pointer; color: #ef4444;">×</button>
        `;

        row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
        container.appendChild(row);
    }

    getKeyValues(containerId) {
        const container = document.getElementById(containerId);
        const rows = container.querySelectorAll('div');
        const data = {};
        rows.forEach(row => {
            const key = row.querySelector('.key-input').value.trim();
            const value = row.querySelector('.value-input').value.trim();
            if (key) data[key] = value;
        });
        return data;
    }

    async sendRequest() {
        const url = this.urlInput.value.trim();
        if (!url) return;

        this.sendBtn.textContent = 'Sending...';
        this.sendBtn.disabled = true;
        this.responseSection.classList.add('hidden');

        const method = this.methodSelect.value;
        const headers = this.getKeyValues('headersList');
        const params = this.getKeyValues('paramsList');

        // Construct URL with params
        const urlObj = new URL(url);
        Object.keys(params).forEach(key => urlObj.searchParams.append(key, params[key]));

        const options = {
            method,
            headers
        };

        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            const body = this.requestBody.value.trim();
            if (body) options.body = body;
        }

        const startTime = performance.now();

        try {
            const response = await fetch(urlObj.toString(), options);
            const endTime = performance.now();

            const status = response.status;
            const statusText = response.statusText;
            const time = Math.round(endTime - startTime);

            let responseData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData = await response.json();
                this.responseOutput.textContent = JSON.stringify(responseData, null, 2);
            } else {
                responseData = await response.text();
                this.responseOutput.textContent = responseData;
            }

            const size = new Blob([this.responseOutput.textContent]).size;

            this.statusDisplay.textContent = `Status: ${status} ${statusText}`;
            this.timeDisplay.textContent = `Time: ${time} ms`;
            this.sizeDisplay.textContent = `Size: ${this.formatBytes(size)}`;

            this.responseSection.classList.remove('hidden');

        } catch (error) {
            this.responseOutput.textContent = `Error: ${error.message}`;
            this.statusDisplay.textContent = 'Status: Error';
            this.responseSection.classList.remove('hidden');
        } finally {
            this.sendBtn.textContent = 'Send';
            this.sendBtn.disabled = false;
        }
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ApiRequestBuilder();
});
