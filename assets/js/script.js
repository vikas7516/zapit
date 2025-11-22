// Zapit Homepage JavaScript
class ZapitHomepage {
    constructor() {
        this.tools = this.getToolsData();
        this.init();
    }

    init() {
        this.setupSearch();
        this.setupBreadcrumbs();
        this.setupCategoryNavigation();
    this.updateHomeCategoryCounts();
    this.updateFooterYear();
    }

    // Foundation for search functionality
    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        // If the page doesn't have search UI (non-home pages), skip wiring
        if (!searchInput || !searchResults) {
            return;
        }
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length < 2) {
                this.hideSearchResults();
                return;
            }

            // Debounced search
            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                this.hideSearchResults();
            }
        });

        // Handle keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSearchResults();
                searchInput.blur();
            }
        });
    }

    performSearch(query) {
        const results = this.searchTools(query);
        this.displaySearchResults(results);
    }

    searchTools(query) {
        const q = query.toLowerCase();

    // Data: categories (top-level) + popular tools
        const categories = [
            { name: 'Text & Content Tools', category: 'Text & Content', description: 'Text formatting, case conversion, and content processing', url: 'online-tools/tools/Text%20%26%20Content%20Tools/text-tools.html', type: 'category' },
            { name: 'Image & Design Tools', category: 'Image & Design', description: 'Image compression, editing, design utilities', url: 'online-tools/tools/Image%20%26%20Design%20Tools/image-tools.html', type: 'category' },
            { name: 'PDF & Document Tools', category: 'PDF & Documents', description: 'PDF merger, splitter, document tools', url: 'online-tools/tools/PDF%20%26%20Document%20Tools/pdf-tools.html', type: 'category' },
            { name: 'Calculators & Converters', category: 'Calculators', description: 'Math, finance, health and unit conversions', url: 'online-tools/tools/Calculators%20%26%20Converters/calculator-tools.html', type: 'category' },
            { name: 'Developer & Web Tools', category: 'Developer Tools', description: 'Formatters, validators, dev utilities', url: 'online-tools/tools/Developer%20%26%20Web%20Tools/developer-tools.html', type: 'category' },
            { name: 'Security & Network Tools', category: 'Security Tools', description: 'Generators, hashers, security utilities', url: 'online-tools/tools/Security%20%26%20Network%20Tools/security-tools.html', type: 'category' },
            { name: 'Audio & Video Tools', category: 'Audio & Video', description: 'Audio/video processing and conversion', url: 'online-tools/tools/Media%20tools/media-tools.html', type: 'category' },
            { name: 'Miscellaneous & Fun Tools', category: 'Miscellaneous & Fun', description: 'QR, random, shortcuts, fun', url: 'online-tools/tools/Fun%20Tools/misc-tools.html', type: 'category' }
        ];

        const tools = [
            { name: 'Case Converter', category: 'Text & Content', description: 'Convert text to different cases' },
            { name: 'Image Compressor', category: 'Image & Design', description: 'Compress images without quality loss' },
            { name: 'JSON Formatter', category: 'Developer Tools', description: 'Format and validate JSON data' },
            { name: 'Password Generator', category: 'Security Tools', description: 'Generate strong passwords' },
            { name: 'PDF Merger', category: 'PDF & Documents', description: 'Combine multiple PDF files' },
            { name: 'BMI Calculator', category: 'Calculators', description: 'Calculate Body Mass Index' },
            { name: 'QR Code Generator', category: 'Miscellaneous & Fun', description: 'Create QR codes instantly' },
            { name: 'Audio Trimmer', category: 'Audio & Video', description: 'Trim audio files' }
        ];

        // Synonym/keyword weights
        const keywords = {
            'json': ['formatter', 'beautify', 'pretty', 'validate'],
            'image': ['compress', 'resize', 'optimize', 'convert'],
            'pdf': ['merge', 'split', 'compress', 'convert'],
            'password': ['generator', 'secure', 'random'],
            'bmi': ['health', 'calculator', 'weight'],
            'qr': ['code', 'qrcode', 'barcode'],
        };

        function score(item) {
            let s = 0;
            const name = item.name.toLowerCase();
            const desc = (item.description || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            if (name === q) s += 100;
            if (name.includes(q)) s += 50;
            if (cat.includes(q)) s += 25;
            if (desc.includes(q)) s += 10;
            // keyword boosting
            Object.keys(keywords).forEach(k => {
                if (q.includes(k)) {
                    s += 5;
                    keywords[k].forEach(kw => { if (name.includes(kw) || desc.includes(kw)) s += 3; });
                }
            });
            // Prefer categories slightly
            if (item.type === 'category') s += 5;
            return s;
        }

        // Build results: categories first if relevant, then tools -> map tools to Coming Soon link
        const catMatches = categories.filter(c => score(c) > 0).sort((a,b) => score(b)-score(a));
        const toolMatches = tools.filter(t => score(t) > 0).sort((a,b) => score(b)-score(a));

        const toolToLink = t => ({
            name: t.name,
            category: t.category,
            description: t.description,
            url: `online-tools/coming-soon.html?tool=${encodeURIComponent(t.name)}&category=${encodeURIComponent(this.getCanonicalCategoryName(t.category))}`
        });

        const results = [
            ...catMatches,
            ...toolMatches.map(toolToLink)
        ].slice(0, 8);

        return results;
    }

    displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;
        // Clear existing
        while (searchResults.firstChild) searchResults.removeChild(searchResults.firstChild);

        if (results.length === 0) {
            const wrapper = document.createElement('div');
            wrapper.className = 'search-empty';
            const p = document.createElement('p');
            p.textContent = 'No tools found. Try a different search term.';
            wrapper.appendChild(p);
            searchResults.appendChild(wrapper);
        } else {
            results.forEach(tool => {
                const canonicalCategory = this.getCanonicalCategoryName(tool.category);
                const href = tool.url || `online-tools/coming-soon.html?tool=${encodeURIComponent(tool.name)}&category=${encodeURIComponent(canonicalCategory)}`;

                const a = document.createElement('a');
                a.href = href;
                a.className = 'search-result-item';

                const row = document.createElement('div');
                row.className = 'search-result-row';

                const left = document.createElement('div');
                const title = document.createElement('h4');
                title.className = 'search-result-title';
                title.textContent = tool.name || '';
                const desc = document.createElement('p');
                desc.className = 'search-result-desc';
                desc.textContent = tool.description || '';
                left.appendChild(title);
                left.appendChild(desc);

                const pill = document.createElement('span');
                pill.className = 'search-result-pill';
                pill.textContent = canonicalCategory || '';

                row.appendChild(left);
                row.appendChild(pill);
                a.appendChild(row);
                searchResults.appendChild(a);
            });
        }

        searchResults.classList.remove('hidden');
    }

    hideSearchResults() {
        const searchResults = document.getElementById('searchResults');
        searchResults.classList.add('hidden');
    }

    // Foundation for breadcrumb functionality
    setupBreadcrumbs() {
        this.updateBreadcrumb(['Home']);
    }

    updateBreadcrumb(path) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return; // header.js will set breadcrumbs generally

    // Build breadcrumb via DOM nodes
        breadcrumb.textContent = '';
        path.forEach((item, index) => {
            if (index !== 0) {
                const sep = document.createElement('span');
                sep.className = 'breadcrumb-separator';
                sep.textContent = '/';
                breadcrumb.appendChild(sep);
                breadcrumb.appendChild(document.createTextNode(' '));
            }
            if (index === path.length - 1) {
                const span = document.createElement('span');
                span.className = 'breadcrumb-current';
                span.textContent = item;
                breadcrumb.appendChild(span);
            } else {
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = item;
                breadcrumb.appendChild(a);
            }
        });
    }

    // Category navigation wiring (reserved for future use)
    setupCategoryNavigation() {
        const categoryLinks = document.querySelectorAll('a[href^="/categories/"]');
        
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Prevent default; SPA routing can hook here
                e.preventDefault();
                
                const category = link.href.split('/categories/')[1];
                this.navigateToCategory(category);
            });
        });
    }

    navigateToCategory(category) {
        // Update breadcrumb only; page navigation handled elsewhere
        
        // Update breadcrumb
        const categoryName = this.getCategoryDisplayName(category);
        this.updateBreadcrumb(['Home', categoryName]);
        
    // No-op for now
    }

    getCategoryDisplayName(category) {
        const categoryMap = {
            'text': 'Text & Content Tools',
            'image': 'Image & Design Tools',
            'pdf': 'PDF & Document Tools',
            'calculators': 'Calculators & Converters',
            'developer': 'Developer & Web Tools',
            'security': 'Security & Network Tools',
            'media': 'Audio & Video Tools',
            'misc': 'Miscellaneous & Fun Tools'
        };
        
        return categoryMap[category] || category;
    }

    // Tools data source
    getToolsData() {
    // Can be populated from JSON or API later
        return {
            categories: [
                'text', 'image', 'pdf', 'calculators', 
                'developer', 'security', 'media', 'misc'
            ],
            tools: []
        };
    }

    // Map display category names to canonical names used across category pages
    getCanonicalCategoryName(name) {
        const map = {
            'Text & Content': 'Text & Content Tools',
            'Image & Design': 'Image & Design Tools',
            'PDF & Documents': 'PDF & Document Tools',
            'Calculators': 'Calculators & Converters',
            'Developer Tools': 'Developer & Web Tools',
            'Security Tools': 'Security & Network Tools',
            'Audio & Video': 'Audio & Video Tools',
            'Miscellaneous & Fun': 'Miscellaneous & Fun Tools'
        };
        return map[name] || name;
    }

    updateHomeCategoryCounts() {
        const cards = document.querySelectorAll('.categories-grid a.category-card');
        if (!cards.length) return;

    // Try inline JSON first
        let data = null;
        try {
            const inline = document.getElementById('categoriesData');
            if (inline && inline.textContent) {
                data = JSON.parse(inline.textContent.trim());
            }
        } catch (e) {
            // ignore JSON parse errors
        }

        const applyCounts = (payload) => {
            if (!payload || !Array.isArray(payload.categories)) return false;
            const byName = new Map(payload.categories.map(c => [c.name, c]));
            cards.forEach(card => {
                const titleEl = card.querySelector('.category-title');
                const countEl = card.querySelector('.category-count');
                if (!titleEl || !countEl) return;
                const item = byName.get(titleEl.textContent.trim());
                if (item && typeof item.count === 'number') {
                    countEl.textContent = `${item.count} tools available • opens category page`;
                }
            });
            return true;
        };

        if (applyCounts(data)) return; // inline JSON worked

        // Fallback: try fetching the JSON when served over HTTP(S)
        fetch('assets/data/categories.json')
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(json => { applyCounts(json); })
            .catch(() => {
                // Final fallback: leave existing static counts as-is
            });
    }

    updateFooterYear() {
        const year = new Date().getFullYear();
        document.querySelectorAll('.footer-copyright').forEach(el => {
            el.textContent = `© ${year} Zapit. All rights reserved.`;
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ZapitHomepage();
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
