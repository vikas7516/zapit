// Category pages script
class ZapitCategoryPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupShareButtons();
        this.setupToolCards();
        this.setupSmoothScrolling();
        this.setThemeFromHero();
        this.updateCategoryStats();
        this.updateFooterYear();
    }

    setThemeFromHero() {
        const hero = document.querySelector('.category-hero');
        if (!hero) return;
        const colors = ['blue', 'green', 'red', 'yellow', 'purple', 'indigo', 'pink', 'orange'];
        const color = colors.find(c => hero.classList.contains(c));
        if (color) {
            document.body.classList.add(`theme-${color}`);
        }
    }

    setupShareButtons() {
        const shareButtons = document.querySelectorAll('.share-btn');

        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = button.dataset.platform;
                this.shareOnPlatform(platform);
            });
        });
    }

    shareOnPlatform(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        const text = encodeURIComponent('Check out these amazing free online tools at Zapit!');

        let shareUrl = '';

        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}&hashtags=onlinetools,free,zapit`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${text}`;
                break;
            case 'reddit':
                shareUrl = `https://reddit.com/submit?url=${url}&title=${title}`;
                break;
            default:
                return;
        }

        const w = window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes,noopener,noreferrer');
        if (w) { try { w.opener = null; } catch (_) { } }
    }

    setupToolCards() {
        const toolCards = document.querySelectorAll('.tools-grid .tool-card');
        const categoryEl = document.querySelector('.category-hero-title');
        const category = categoryEl ? categoryEl.textContent.trim() : 'Category';

        const CATEGORY_SLUGS = {
            'Text & Content Tools': 'text-tools',
            'Image & Design Tools': 'image-tools',
            'PDF & Document Tools': 'pdf-tools',
            'Math Calculators': 'math-calculators',
            'Unit Converters': 'unit-converters',
            'Developer & Web Tools': 'dev-tools',
            'Security & Network Tools': 'security-tools',
            'Audio & Video Tools': 'audio-video-tools',
            'Health & Fitness Calculators': 'health-fitness-calculators',
            'Financial Calculators': 'financial-calculators',
            'Utility & Fun Tools': 'utility-tools'
        };

        const catSlug = CATEGORY_SLUGS[category] || (category || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        // Update href attributes to match actual directory structure
        toolCards.forEach(card => {
            const toolNameEl = card.querySelector('.tool-name');
            const toolName = toolNameEl ? toolNameEl.textContent.trim() : 'tool';
            const toolSlug = (toolName || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            card.setAttribute('href', `/${catSlug}/${toolSlug}`);
        });

        toolCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const toolNameEl = card.querySelector('.tool-name');
                const toolName = toolNameEl ? toolNameEl.textContent.trim() : 'Tool';
                const toolSlug = (toolName || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                const target = `/${catSlug}/${toolSlug}`;

                // Respect modifier/middle clicks: open in new tab
                const isMiddle = e.button === 1;
                const newTab = e.ctrlKey || e.metaKey || e.shiftKey || isMiddle;
                e.preventDefault();
                if (newTab) {
                    const w = window.open(target, '_blank', 'noopener');
                    if (w) { try { w.opener = null; } catch (_) { } }
                } else {
                    window.location.href = target;
                }
            });
        });
    }

    setupSmoothScrolling() {
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
    }

    updateCategoryStats() {
        const statsEl = document.querySelector('.category-stats');
        const tools = document.querySelectorAll('.tools-grid .tool-card');
        if (statsEl && tools) {
            statsEl.textContent = `${tools.length} tools available`;
        }
    }

    updateFooterYear() {
        const year = new Date().getFullYear();
        document.querySelectorAll('.footer-copyright').forEach(el => {
            el.textContent = `© ${year} Zapit. All rights reserved.`;
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    new ZapitCategoryPage();
});

// Utilities
window.ZapitUtils = {
    // Format numbers with commas
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    },

    // Toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
};
