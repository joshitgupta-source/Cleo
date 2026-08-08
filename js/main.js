import { getSettings, updateStorage } from './state.js';
import { initClock } from './clock.js';
import { initSearch } from './search.js';
import { initGrid, initContextMenu } from './grid.js';
import { initUI, openModal, closeModal } from './ui.js';
import { applySettings, saveAndApply } from './theme.js';
import './panel.js'; 

let editingIndex = null;

const getEl = (id) => document.getElementById(id);

initClock();
initSearch((newEngine) => saveAndApply({ searchEngine: newEngine }));
initUI(() => { editingIndex = null; });

initContextMenu(
    async (index) => {
        const { shortcuts = [] } = await getSettings();
        const site = shortcuts[index];
        if (site) {
            editingIndex = index;
            openModal('Edit shortcut', site.name, site.url);
        }
    },
    async (index) => {
        const { shortcuts = [] } = await getSettings();
        shortcuts.splice(index, 1);
        updateStorage({ shortcuts }, applySettings);
    }
);

initGrid(
    async (from, to) => {
        const { shortcuts = [] } = await getSettings();
        const [moved] = shortcuts.splice(from, 1);
        shortcuts.splice(to, 0, moved);
        updateStorage({ shortcuts }, applySettings);
    },
    async (fromIndex) => {
        const { shortcuts = [] } = await getSettings();
        if (fromIndex >= 0 && fromIndex < shortcuts.length) {
            const [moved] = shortcuts.splice(fromIndex, 1);
            shortcuts.push(moved);
            updateStorage({ shortcuts }, applySettings);
        }
    },
    () => {
        editingIndex = null;
        openModal('Add shortcut', '', '');
    }
);

document.addEventListener('dragstart', (e) => {
    if (document.body.classList.contains('is-locked')) {
        e.preventDefault();
    }
});

document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') return;

    if (e.key === '/') {
        e.preventDefault();
        getEl('search-input')?.focus();
    }
});

const handleShortcutSave = async () => {
    const nameInput = getEl('site-name');
    const urlInput = getEl('site-url');
    
    if (!nameInput || !urlInput) return;

    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    
    if (!name || !url) return; 
    
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    
    const data = await getSettings();
    const shortcuts = data.shortcuts || [];
    const maxShortcuts = data.maxShortcuts || 50;

    if (editingIndex !== null) {
        shortcuts[editingIndex] = { name, url };
    } else {
        if (shortcuts.length >= maxShortcuts) {
            return alert(`You've reached your custom limit of ${maxShortcuts} shortcuts.`);
        }
        shortcuts.push({ name, url });
    }
    
    updateStorage({ shortcuts }, () => {
        applySettings();
        editingIndex = null;
        closeModal();
    });
};

getEl('done-btn')?.addEventListener('click', handleShortcutSave);

const submitOnEnter = (e) => {
    if (e.key === 'Enter') handleShortcutSave();
};
getEl('site-name')?.addEventListener('keydown', submitOnEnter);
getEl('site-url')?.addEventListener('keydown', submitOnEnter);

applySettings();