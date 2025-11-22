// Theme toggle with persistence — swaps between style.css and darkstyle.css
(function () {
  const storageKey = 'zapit-theme';
  const THEME_LINK_ID = 'site-theme-css';
  const TOGGLE_ID = 'zapit-theme-toggle';

  function getThemeLink() { return document.getElementById(THEME_LINK_ID); }

  function ensureToggleInjected() {
  // Remove duplicate toggles if present
    const legacy = document.querySelectorAll('.theme-toggle-fixed');
    if (legacy.length > 1) {
      for (let i = 1; i < legacy.length; i++) legacy[i].remove();
    }
    if (document.getElementById(TOGGLE_ID)) return document.getElementById(TOGGLE_ID);

    const container = document.createElement('div');
    container.className = 'theme-toggle-fixed';
    container.id = TOGGLE_ID;
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'theme-toggle';
    const input = document.createElement('input');
    input.id = 'dn';
    input.className = 'theme-toggle-input';
    input.type = 'checkbox';
    input.setAttribute('aria-label', 'Toggle dark mode');
  const label = document.createElement('label');
  label.className = 'theme-toggle-label';
    label.setAttribute('for', 'dn');
    const sunIcon = document.createElement('span');
    sunIcon.className = 'theme-toggle-icon sun';
    sunIcon.setAttribute('aria-hidden', 'true');
    const track = document.createElement('span');
    track.className = 'theme-toggle-track';
    const handle = document.createElement('span');
    handle.className = 'theme-toggle-handle';
    track.appendChild(handle);
    const moonIcon = document.createElement('span');
    moonIcon.className = 'theme-toggle-icon moon';
    moonIcon.setAttribute('aria-hidden', 'true');
    label.appendChild(sunIcon);
    label.appendChild(track);
    label.appendChild(moonIcon);
    toggleDiv.appendChild(input);
    toggleDiv.appendChild(label);
    container.appendChild(toggleDiv);
    document.body.appendChild(container);
    return container;
  }

  function ensureToggleCSS() {
  // Ensure theme-toggle.css is available
    const hasCSS = Array.from(document.styleSheets).some(ss => {
      try { return ss.href && ss.href.indexOf('theme-toggle.css') !== -1; } catch { return false; }
    });
    if (!hasCSS) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = getElementsBasePath() + 'assets/elements/theme-toggle.css';
      document.head.appendChild(link);
    }
  }

  function applyTheme(theme) {
    const basePath = getStylesheetBasePath();
    const link = getThemeLink();
    if (!link) return; // require a standard link with id
    
    // Add a brief transition overlay to prevent flash
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: ${theme === 'dark' ? '#0f172a' : '#ffffff'};
      opacity: 0; z-index: 9999; pointer-events: none;
      transition: opacity 150ms ease-out;
    `;
    document.body.appendChild(overlay);
    
    // Brief flash to smooth the transition
    requestAnimationFrame(() => {
      overlay.style.opacity = '0.3';
      setTimeout(() => {
        link.href = basePath + (theme === 'dark' ? 'darkstyle.css' : 'style.css');
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 150);
      }, 75);
    });
    
    // Expose theme for CSS hooks
    document.documentElement.setAttribute('data-theme', theme);
  }

  function getElementsBasePath() {
  // Resolve base path from location
    const p = location.pathname.replace(/\\+/g, '/');
    if (/\/online-tools\/tools\/.*\/.*\//.test(p)) return '../../../../'; // 4 levels deep (tool pages)
    if (/\/online-tools\/tools\//.test(p)) return '../../../'; // 3 levels deep (category pages)
    if (/\/online-tools\//.test(p)) return '../'; // 1 level deep (online-tools root)
    return ''; // Already at root
  }

  function getStylesheetBasePath() {
  // Derive base path from current href, if available
    const link = getThemeLink();
    if (link) {
      const href = link.getAttribute('href') || '';
      const idx = href.lastIndexOf('/');
      if (idx !== -1) return href.slice(0, idx + 1);
    }
  // Fallback to root-level assets
    return '/assets/css/';
  }

  function getPreferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'dark' || saved === 'light') return saved;
    // Default to light mode instead of following system preference
    return 'light';
  }

  // Initialize theme and inject toggle
  document.addEventListener('DOMContentLoaded', function () {
    ensureToggleCSS();
    const theme = getPreferredTheme();
    applyTheme(theme);

    const container = ensureToggleInjected();
    if (container) {
      wireToggle(theme);
      setupDynamicOffset(container);
    }

  // Update on system preference change
    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) {
        mq.addEventListener('change', function (e) {
          const saved = localStorage.getItem(storageKey);
          if (!saved) {
            const sysTheme = e.matches ? 'dark' : 'light';
            applyTheme(sysTheme);
          }
        });
      }
    }
  });

  function wireToggle(theme) {
    const input = document.getElementById('dn');
    if (!input) return;
    input.checked = theme === 'dark';
    input.addEventListener('change', function () {
      const newTheme = input.checked ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem(storageKey, newTheme);
    });
  }

  function setupDynamicOffset(container) {
    const header = document.querySelector('.site-header');
  const BASE_TOP = 12; // px
  const GAP = 8; // px

    let ticking = false;
  function update() {
      ticking = false;
      let top = BASE_TOP;
      if (header) {
        const rect = header.getBoundingClientRect();
  // Keep toggle just below header when visible
        const headerVisibleAtTop = rect.top <= 0 && rect.bottom > 0;
  const initialAtTop = window.scrollY < 2 && rect.top >= 0;
        if (headerVisibleAtTop || initialAtTop) {
          top = Math.max(BASE_TOP, Math.ceil(rect.bottom) + GAP);
        } else {
          top = BASE_TOP;
        }
      }
  // Snap to buckets to avoid inline styles
  const buckets = [12, 24, 36, 48, 64, 80, 96, 112, 128];
  let closest = buckets[0];
  for (const b of buckets) { if (Math.abs(b - top) < Math.abs(closest - top)) closest = b; }
  container.dataset.top = String(closest);
  // ensure corresponding class present
  (container.className.match(/ttop-\d+/g) || []).forEach(cn => container.classList.remove(cn));
  container.classList.add('ttop-' + closest);
    }

    function requestUpdate() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }

    // Initial and reactive updates
    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    // In case fonts/layout shift after load
    window.addEventListener('load', requestUpdate);
  }
})();
