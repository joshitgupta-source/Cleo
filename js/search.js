const searchInput = document.getElementById('search-input');
const searchEngineSelect = document.getElementById('search-engine-select'); 
const engineBtn = document.getElementById('search-engine-btn');
const engineIcon = document.getElementById('current-engine-icon');
const engineMenu = document.getElementById('engine-dropdown-menu');

const engines = [
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

export function initSearch(onEngineChange) {
    engines.forEach(eng => {
        const btn = document.createElement('button');
        btn.className = 'engine-opt';
        btn.innerHTML = `<img src="${chrome.runtime.getURL("/_favicon/")}?pageUrl=${encodeURIComponent(eng.domain)}&size=32" alt="${eng.name}"> <span>${eng.name}</span>`;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            engineMenu.classList.add('hidden');
            onEngineChange(eng.url);
        });
        engineMenu.appendChild(btn);
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

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            const url = searchEngineSelect.value + encodeURIComponent(searchInput.value.trim());
            window.location.href = url;
        }
    });
}

export function updateSearchIcon(engineUrl) {
    const activeEngine = engines.find(e => e.url === engineUrl) || engines[0];
    engineIcon.src = `${chrome.runtime.getURL("/_favicon/")}?pageUrl=${encodeURIComponent(activeEngine.domain)}&size=32`;
    engineIcon.alt = activeEngine.name;
}