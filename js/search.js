export const ENGINES = [
    { name: 'Google', url: 'https://www.google.com/search?q=', domain: 'https://www.google.com' },
    { name: 'Google Web', url: 'https://www.google.com/search?udm=14&q=', domain: 'https://www.google.com' },
    { name: 'Bing', url: 'https://www.bing.com/search?q=', domain: 'https://www.bing.com' },
    { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', domain: 'https://duckduckgo.com' },
    { name: 'Yahoo', url: 'https://search.yahoo.com/search?p=', domain: 'https://search.yahoo.com' },
    { name: 'Brave', url: 'https://search.brave.com/search?q=', domain: 'https://search.brave.com' },
    { name: 'Startpage', url: 'https://www.startpage.com/sp/search?query=', domain: 'https://www.startpage.com' },
    { name: 'Kagi', url: 'https://kagi.com/search?q=', domain: 'https://kagi.com' },
    { name: 'Qwant', url: 'https://www.qwant.com/?q=', domain: 'https://www.qwant.com' },
    { name: 'Ecosia', url: 'https://www.ecosia.org/search?q=', domain: 'https://www.ecosia.org' }
];

const getEl = (id) => document.getElementById(id);

function getEngineFaviconUrl(domain) {
    try {
        return `${chrome.runtime.getURL("/_favicon/")}?pageUrl=${encodeURIComponent(domain)}&size=32`;
    } catch (e) {
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238ab4f8"><circle cx="12" cy="12" r="10"/></svg>';
    }
}

export function populateEngineDropdown() {
    const selectEl = getEl('search-engine-select');
    if (!selectEl) return;
    
    selectEl.innerHTML = ENGINES.map(eng => 
        `<option value="${eng.url}">${eng.name}</option>`
    ).join('');
}

export function initSearch(onEngineChange) {
    const searchInput = getEl('search-input');
    const searchEngineSelect = getEl('search-engine-select'); 
    const engineBtn = getEl('search-engine-btn');
    const engineMenu = getEl('engine-dropdown-menu');

    if (!searchInput || !engineBtn || !engineMenu) return;

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

    engineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        engineMenu.classList.toggle('hidden');
    });

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

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (!query) return;

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

export function initSettingsSearch() {
    const searchInput = getEl('panel-search-input');
    const matchCountEl = getEl('search-match-count');
    const prevBtn = getEl('search-prev-btn');
    const nextBtn = getEl('search-next-btn');
    const clearBtn = getEl('search-clear-btn');
    const panelBody = document.querySelector('.panel-content');

    let matches = [];
    let currentIndex = -1;

    if (!searchInput || !panelBody) return;

    searchInput.addEventListener('input', (e) => {
        const sanitized = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
        if (searchInput.value !== sanitized) {
            searchInput.value = sanitized;
        }

        const query = searchInput.value.trim().toLowerCase();
        removeHighlights();

        if (query === '') {
            resetSearchUI();
            return;
        }

        clearBtn.disabled = false;
        performSearch(query);
    });

    searchInput.addEventListener('keydown', (e) => {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Space', ' '];
        const isAlphanumeric = /^[a-zA-Z0-9]$/.test(e.key);

        if (!isAlphanumeric && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
        }

        if (e.key === 'Enter' && matches.length > 0) {
            e.preventDefault();
            navigateMatch(e.shiftKey ? -1 : 1);
        }
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        removeHighlights();
        resetSearchUI();
        searchInput.focus();
    });

    prevBtn.addEventListener('click', () => navigateMatch(-1));
    nextBtn.addEventListener('click', () => navigateMatch(1));

    function performSearch(query) {
        matches = [];
        currentIndex = -1;
        const textNodes = [];
        
        const walker = document.createTreeWalker(
            panelBody,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.parentElement.closest('.search-pill-container, script, style, select, .swatches')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return node.textContent.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
                }
            }
        );

        while (walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach(node => {
            const text = node.textContent;
            const lowerText = text.toLowerCase();
            let matchIdx = lowerText.indexOf(query);

            if (matchIdx !== -1) {
                const parent = node.parentNode;
                const fragment = document.createDocumentFragment();
                let lastIdx = 0;

                while (matchIdx !== -1) {
                    if (matchIdx > lastIdx) {
                        fragment.appendChild(document.createTextNode(text.substring(lastIdx, matchIdx)));
                    }

                    const mark = document.createElement('mark');
                    mark.className = 'panel-highlight';
                    mark.textContent = text.substring(matchIdx, matchIdx + query.length);
                    fragment.appendChild(mark);
                    matches.push(mark);

                    lastIdx = matchIdx + query.length;
                    matchIdx = lowerText.indexOf(query, lastIdx);
                }

                if (lastIdx < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIdx)));
                }

                parent.replaceChild(fragment, node);
            }
        });

        if (matches.length > 0) {
            currentIndex = 0;
            updateMatchUI();
        } else {
            matchCountEl.textContent = '0/0';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    function navigateMatch(direction) {
        if (matches.length === 0) return;

        if (currentIndex >= 0 && matches[currentIndex]) {
            matches[currentIndex].classList.remove('active-highlight');
        }

        currentIndex = (currentIndex + direction + matches.length) % matches.length;
        updateMatchUI();
    }

    function updateMatchUI() {
        matches.forEach((m, idx) => {
            if (idx === currentIndex) {
                m.classList.add('active-highlight');
                m.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                m.classList.remove('active-highlight');
            }
        });

        matchCountEl.textContent = `${currentIndex + 1}/${matches.length}`;
        prevBtn.disabled = false;
        nextBtn.disabled = false;
    }

    function removeHighlights() {
        const highlights = panelBody.querySelectorAll('mark.panel-highlight');
        highlights.forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
        matches = [];
        currentIndex = -1;
    }

    function resetSearchUI() {
        matchCountEl.textContent = '0/0';
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        clearBtn.disabled = true;
    }
}