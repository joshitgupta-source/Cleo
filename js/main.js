import { initClock } from './clock.js';
import { initSearch } from './search.js';
import { initGrid, initContextMenu } from './grid.js';
import { initUI, openModal, closeModal } from './ui.js';
import { applySettings, saveAndApply } from './theme.js';
import './panel.js'; // Imports all settings UI listeners

let editingIndex = null;

// Initialize core components
initClock();
initSearch((newEngine) => saveAndApply({ searchEngine: newEngine }));
initUI(() => { editingIndex = null; });

initContextMenu(
    (index) => {
        chrome.storage.local.get({ shortcuts: [] }, ({ shortcuts }) => {
            const site = shortcuts[index];
            if (site) {
                editingIndex = index;
                openModal('Edit shortcut', site.name, site.url);
            }
        });
    },
    (index) => {
        chrome.storage.local.get({ shortcuts: [] }, ({ shortcuts }) => {
            shortcuts.splice(index, 1);
            chrome.storage.local.set({ shortcuts }, applySettings);
        });
    }
);

initGrid(
    (from, to) => {
        chrome.storage.local.get({ shortcuts: [] }, ({ shortcuts }) => {
            const [moved] = shortcuts.splice(from, 1);
            shortcuts.splice(to, 0, moved);
            chrome.storage.local.set({ shortcuts }, applySettings);
        });
    },
    (fromIndex) => {
        chrome.storage.local.get({ shortcuts: [] }, ({ shortcuts }) => {
            if (fromIndex >= 0 && fromIndex < shortcuts.length) {
                const [moved] = shortcuts.splice(fromIndex, 1);
                shortcuts.push(moved);
                chrome.storage.local.set({ shortcuts }, applySettings);
            }
        });
    },
    () => {
        editingIndex = null;
        openModal('Add shortcut', '', '');
    }
);

// Intercept Drag API to disable moving tiles when locked
document.addEventListener('dragstart', (e) => {
    if (document.body.classList.contains('is-locked')) {
        e.preventDefault();
    }
});

// Add Shortcut Modal Logic
document.getElementById('done-btn').addEventListener('click', () => {
    const name = document.getElementById('site-name').value.trim();
    let url = document.getElementById('site-url').value.trim();
    
    if (name && url) {
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        
        chrome.storage.local.get({ shortcuts: [], maxShortcuts: 50 }, (data) => {
            if (editingIndex !== null) {
                data.shortcuts[editingIndex] = { name, url };
            } else {
                if (data.shortcuts.length >= data.maxShortcuts) {
                    return alert(`You've reached your custom limit of ${data.maxShortcuts} shortcuts.`);
                }
                data.shortcuts.push({ name, url });
            }
            
            chrome.storage.local.set({ shortcuts: data.shortcuts }, () => {
                applySettings();
                editingIndex = null;
                closeModal();
            });
        });
    }
});

// Global Keyboard Shortcut: '/' to focus search
document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') return;

    if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
    }
});

// Boot the application layout
applySettings();