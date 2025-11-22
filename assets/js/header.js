// Header injection and breadcrumb builder
(function () {
  // Reduce console output in production
  try {
    var isHttp = typeof location !== 'undefined' && /^https?:/.test(location.protocol);
    var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname || '');
    if (isHttp && !isLocal) {
      var noop = function(){};
      ['log','info','warn','error','debug','table','trace'].forEach(function(m){
        if (window.console && typeof window.console[m] === 'function') window.console[m] = noop;
      });
      window.addEventListener('error', function(e){ e.preventDefault(); return true; });
      window.addEventListener('unhandledrejection', function(e){ e.preventDefault(); });
    }
  } catch(_) {}
  const CATEGORY_MAP = {
    'Text & Content Tools': { folder: 'Text & Content Tools', file: 'text-tools.html' },
    'Image & Design Tools': { folder: 'Image & Design Tools', file: 'image-tools.html' },
    'PDF & Document Tools': { folder: 'PDF & Document Tools', file: 'pdf-tools.html' },
    'Calculators & Converters': { folder: 'Calculators & Converters', file: 'calculator-tools.html' },
    'Developer & Web Tools': { folder: 'Developer & Web Tools', file: 'developer-tools.html' },
    'Security & Network Tools': { folder: 'Security & Network Tools', file: 'security-tools.html' },
    'Audio & Video Tools': { folder: 'Media tools', file: 'media-tools.html' },
    'Miscellaneous & Fun Tools': { folder: 'Fun Tools', file: 'misc-tools.html' }
  };

  function baseRoot() {
    const p = location.pathname.replace(/\\+/g, '/');
    if (/\/online-tools\/tools\//.test(p)) return '../../../';
    if (/\/online-tools\//.test(p)) return '../';
    return '';
  }

  function ensureHeader() {
  if (document.querySelector('.site-header')) return;
    const root = baseRoot();
    const html = [
      '<header class="site-header">',
      '  <div class="container">',
      '    <div class="header-nav">',
      `      <a href="${root}index.html" class="brand" aria-label="Zapit Home">`,
      `        <img src="${root}icons/logo.jpg" alt="Zapit" class="logo-img" />`,
      '        <span class="brand-text">',
      '          <span class="brand-title">Zapit</span>',
      '          <span class="brand-tagline">A Zap Away From Done</span>',
      '        </span>',
      '      </a>',
      '      <div class="header-right">',
      '        <nav class="breadcrumb" id="breadcrumb"></nav>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</header>'
    ].join('');
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  function setBreadcrumb(items) {
    const bc = document.getElementById('breadcrumb');
    if (!bc) return;
  // Build breadcrumb via DOM nodes
    while (bc.firstChild) bc.removeChild(bc.firstChild);
    items.forEach((item, idx) => {
      if (idx > 0) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-separator';
        sep.textContent = '/';
        bc.appendChild(sep);
        bc.appendChild(document.createTextNode(' '));
      }
      const isLast = idx === items.length - 1;
      if (!isLast && item.href) {
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label || '';
        bc.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.className = 'breadcrumb-current';
        span.textContent = item.label || '';
        bc.appendChild(span);
      }
    });
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function getPageLabel() {
    const t = document.title || '';
    const m = t.split(' - ')[0];
    return m || 'Page';
  }

  function getCategoryFromPath() {
    const p = location.pathname.replace(/\\+/g, '/');
    const m = p.match(/\/tools\/([^/]+)\//);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function buildCategoryLink(root, displayName) {
    const entry = CATEGORY_MAP[displayName];
    if (!entry) return null;
    const folder = encodeURIComponent(entry.folder);
    const href = `${root}tools/${folder}/${entry.file}`;
    return href;
  }

  function initBreadcrumb() {
    const p = location.pathname.replace(/\\+/g, '/');
    const root = baseRoot();
    if (/\/(index\.html)?$/.test(p) || /\/index\.html$/.test(p)) {
      setBreadcrumb([{ label: 'Home' }]);
      return;
    }

    if (/\/online-tools\/tools\//.test(p)) {
      // Category pages
      let category = null;
      const h1 = document.querySelector('.category-title');
      if (h1 && h1.textContent) category = h1.textContent.trim();
      if (!category) category = getCategoryFromPath() || 'Category';
      setBreadcrumb([
        { label: 'Home', href: root + 'index.html' },
        { label: category }
      ]);
      return;
    }

    if (/\/online-tools\/coming-soon\.html$/.test(p)) {
      const params = new URLSearchParams(location.search);
      const category = params.get('category') || 'Category';
      const tool = params.get('tool') || 'Tool';
      const catHref = buildCategoryLink(root, category);
      const items = [{ label: 'Home', href: root + 'index.html' }];
      if (catHref) items.push({ label: category, href: catHref }); else items.push({ label: category });
      items.push({ label: tool });
      setBreadcrumb(items);
      return;
    }

  // Generic pages
    setBreadcrumb([
      { label: 'Home', href: root + 'index.html' },
      { label: getPageLabel() }
    ]);
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    ensureHeader();
    initBreadcrumb();
  });
})();
