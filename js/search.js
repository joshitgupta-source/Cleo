/* =========================================
   SEARCH ENGINE CONFIGURATION
   ========================================= */
const ENGINES = [
    { name: 'Google', url: 'https://www.google.com/search?q=', domain: 'https://www.google.com' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=', domain: 'https://www.bing.com' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', domain: 'https://duckduckgo.com' },
    { name: 'Yahoo', url: 'https://search.yahoo.com/search?p=', domain: 'https://search.yahoo.com' },
    { name: 'Brave', url: 'https://search.brave.com/search?q=', domain: 'https://search.brave.com' },
    { name: 'Startpage', url: 'https://www.startpage.com/sp/search?query=', domain: 'https://www.startpage.com' },
    { name: 'Kagi', url: 'https://kagi.com/search?q=', domain: 'https://kagi.com' },
    { name: 'Qwant', url: 'https://www.qwant.com/?q=', domain: 'https://www.qwant.com' },
    { name: 'Ecosia', url: 'https://www.ecosia.org/search?q=', domain: 'https://www.ecosia.org' }
];

// Helper for dynamic safe DOM element lookups
const getEl = (id) => document.getElementById(id);

/**
 * Generates the Chrome Favicon API URL with a fallback SVG placeholder
 */
function getEngineFaviconUrl(domain) {
    try {
        return `${chrome.runtime.getURL("/_favicon/")}?pageUrl=${encodeURIComponent(domain)}&size=32`;
    } catch (e) {
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238ab4f8"><circle cx="12" cy="12" r="10"/></svg>';
    }
}

/* =========================================
   SEARCH INITIALIZATION
   ========================================= */
export function initSearch(onEngineChange) {
    const searchInput = getEl('search-input');
    const searchEngineSelect = getEl('search-engine-select'); 
    const engineBtn = getEl('search-engine-btn');
    const engineMenu = getEl('engine-dropdown-menu');

    if (!searchInput || !engineBtn || !engineMenu) return;

    // 1. Build Dropdown Options using DocumentFragment for 1-step DOM insertion
    const fragment = document.createDocumentFragment();

    ENGINES.forEach(eng => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'engine-opt';
        btn.dataset.url = eng.url;

        const img = document.createElement('img');
        img.src = getEngineFaviconUrl(eng.domain);
        img.alt = eng.name;
        img.onerror = () => {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238ab4f8"><circle cx="12" cy="12" r="10"/></svg>';
        };

        const span = document.createElement('span');
        span.textContent = eng.name;

        btn.appendChild(img);
        btn.appendChild(span);
        fragment.appendChild(btn);
    });

    engineMenu.innerHTML = '';
    engineMenu.appendChild(fragment);

    // 2. Event Delegation on Menu Container (Single Listener instead of 9)
    engineMenu.addEventListener('click', (e) => {
        const optionBtn = e.target.closest('.engine-opt');
        if (optionBtn && optionBtn.dataset.url) {
            e.stopPropagation();
            engineMenu.classList.add('hidden');
            if (typeof onEngineChange === 'function') {
                onEngineChange(optionBtn.dataset.url);
            }
        }
    });

    // 3. Dropdown Toggle Controls
    engineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        engineMenu.classList.toggle('hidden');
    });

    // 4. Outside Click & Keyboard Escape Listener
    document.addEventListener('click', (e) => {
        if (!engineBtn.contains(e.target) && !engineMenu.contains(e.target)) {
            engineMenu.classList.add('hidden');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !engineMenu.classList.contains('hidden')) {
            engineMenu.classList.add('hidden');
        }
    });

    // 5. Search Execution (Supports standard queries & direct URL navigation)
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (!query) return;

            // Smart URL detector: navigate directly if query looks like a valid URL
            const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/i;
            if (urlPattern.test(query)) {
                const targetUrl = query.startsWith('http://') || query.startsWith('https://') 
                    ? query 
                    : `https://${query}`;
                window.location.href = targetUrl;
            } else {
                const engineBase = searchEngineSelect ? searchEngineSelect.value : ENGINES[0].url;
                window.location.href = engineBase + encodeURIComponent(query);
            }
        }
    });
}

/**
 * Updates the visual icon in the search bar header
 */
export function updateSearchIcon(engineUrl) {
    const engineIcon = getEl('current-engine-icon');
    if (!engineIcon) return;

    const activeEngine = ENGINES.find(e => e.url === engineUrl) || ENGINES[0];
    engineIcon.src = getEngineFaviconUrl(activeEngine.domain);
    engineIcon.alt = activeEngine.name;
    engineIcon.onerror = () => {
        engineIcon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238ab4f8"><circle cx="12" cy="12" r="10"/></svg>';
    };
}