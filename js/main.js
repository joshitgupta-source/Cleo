import { getSettings, updateStorage, exportSettings, importSettings } from './state.js';
import { initClock, setTimeFormat } from './clock.js';
import { initSearch, updateSearchIcon } from './search.js';
import { initGrid, initContextMenu, renderGrid } from './grid.js';
import { initUI, openModal, closeModal, applyBackground } from './ui.js';
import { getTextColorForBackground, getDynamicColorForBackground } from './utils.js';

let currentMaxShortcuts = 50;
let editingIndex = null;

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

// Intercept Drag API to completely disable moving tiles when locked
document.addEventListener('dragstart', (e) => {
    if (document.body.classList.contains('is-locked')) {
        e.preventDefault();
    }
});

document.getElementById('done-btn').addEventListener('click', () => {
    const name = document.getElementById('site-name').value.trim();
    let url = document.getElementById('site-url').value.trim();
    if (name && url) {
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        chrome.storage.local.get({ shortcuts: [] }, ({ shortcuts }) => {
            if (editingIndex !== null) {
                shortcuts[editingIndex] = { name, url };
            } else {
                if (shortcuts.length >= currentMaxShortcuts) return alert(`You've reached your custom limit of ${currentMaxShortcuts} shortcuts.`);
                shortcuts.push({ name, url });
            }
            chrome.storage.local.set({ shortcuts }, () => {
                applySettings();
                editingIndex = null;
                closeModal();
            });
        });
    }
});

function saveAndApply(updates) {
    updateStorage(updates, applySettings);
}

function syncColorPicker(pickerId, textId, settingKey) {
    const picker = document.getElementById(pickerId);
    const text = document.getElementById(textId);

    picker.addEventListener('input', (e) => {
        text.value = e.target.value.toUpperCase();
        if (settingKey === 'bgValue') saveAndApply({ bgType: 'color', bgValue: e.target.value });
        else saveAndApply({ [settingKey]: e.target.value });
    });

    text.addEventListener('input', (e) => {
        let val = e.target.value;
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-F]{6}$/i.test(val)) {
            picker.value = val;
            if (settingKey === 'bgValue') saveAndApply({ bgType: 'color', bgValue: val });
            else saveAndApply({ [settingKey]: val });
        }
    });
}

syncColorPicker('bg-color-picker', 'bg-color-text', 'bgValue');
syncColorPicker('accent-color-picker', 'accent-color-text', 'accentColor');
syncColorPicker('search-color-picker', 'search-color-text', 'searchColor');
syncColorPicker('shortcut-color-picker', 'shortcut-color-text', 'shortcutColor');
syncColorPicker('scrollbar-color-picker', 'scrollbar-color-text', 'scrollbarColor');
syncColorPicker('clock-color-picker', 'clock-color-text', 'clockColor');

document.getElementById('bg-image-btn').addEventListener('click', () => document.getElementById('bg-image-input').click());
document.getElementById('bg-image-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => saveAndApply({ bgType: 'image', bgValue: event.target.result });
        reader.readAsDataURL(file);
    }
});
document.getElementById('bg-reset-btn').addEventListener('click', () => saveAndApply({ bgType: 'color', bgValue: '#000000' }));
document.getElementById('show-shadows-toggle').addEventListener('change', (e) => saveAndApply({ showShadows: e.target.checked }));
document.getElementById('global-font-select').addEventListener('change', (e) => saveAndApply({ globalFont: e.target.value }));

// Search Settings Mapping
document.getElementById('show-search-toggle').addEventListener('change', (e) => saveAndApply({ showSearch: e.target.checked }));
document.getElementById('show-search-border-toggle').addEventListener('change', (e) => saveAndApply({ showSearchBorder: e.target.checked }));
document.getElementById('search-engine-select').addEventListener('change', (e) => saveAndApply({ searchEngine: e.target.value }));
document.getElementById('search-color-mode-select').addEventListener('change', (e) => saveAndApply({ searchMode: e.target.value }));

// Search Radius Logic
const searchRadiusSlider = document.getElementById('search-radius-slider');
const searchRadiusNum = document.getElementById('search-radius-num');

function handleRadiusUpdate(val) {
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 40) num = 40;
    searchRadiusSlider.value = num;
    searchRadiusNum.value = num;
    saveAndApply({ searchRadius: num.toString() });
}

searchRadiusSlider.addEventListener('input', (e) => handleRadiusUpdate(e.target.value));
searchRadiusNum.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    if (e.target.value !== '') handleRadiusUpdate(e.target.value);
});
searchRadiusNum.addEventListener('blur', (e) => { if (e.target.value === '') handleRadiusUpdate(24); });

// Search Opacity Logic
const searchOpacitySlider = document.getElementById('search-opacity-slider');
const searchOpacityNum = document.getElementById('search-opacity-num');

function handleSearchOpacityUpdate(val) {
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 100) num = 100;
    searchOpacitySlider.value = num;
    searchOpacityNum.value = num;
    saveAndApply({ searchOpacity: num.toString() });
}

searchOpacitySlider.addEventListener('input', (e) => handleSearchOpacityUpdate(e.target.value));
searchOpacityNum.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    if (e.target.value !== '') handleSearchOpacityUpdate(e.target.value);
});
searchOpacityNum.addEventListener('blur', (e) => { if (e.target.value === '') handleSearchOpacityUpdate(100); });

// Shortcut Settings Mapping
document.getElementById('shortcut-type-select').addEventListener('change', (e) => saveAndApply({ shortcutType: e.target.value }));
document.getElementById('shortcut-color-mode-select').addEventListener('change', (e) => saveAndApply({ shortcutMode: e.target.value }));
document.getElementById('show-shortcuts-toggle').addEventListener('change', (e) => saveAndApply({ showShortcuts: e.target.checked }));
document.getElementById('show-labels-toggle').addEventListener('change', (e) => saveAndApply({ showLabels: e.target.checked }));
document.getElementById('max-shortcuts-select').addEventListener('change', (e) => saveAndApply({ maxShortcuts: parseInt(e.target.value, 10) }));

// Shortcut Radius Logic
const shortcutRadiusSlider = document.getElementById('shortcut-radius-slider');
const shortcutRadiusNum = document.getElementById('shortcut-radius-num');

function handleShortcutRadiusUpdate(val) {
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 30) num = 30;
    shortcutRadiusSlider.value = num;
    shortcutRadiusNum.value = num;
    saveAndApply({ shortcutRadius: num.toString() });
}

shortcutRadiusSlider.addEventListener('input', (e) => handleShortcutRadiusUpdate(e.target.value));
shortcutRadiusNum.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    if (e.target.value !== '') handleShortcutRadiusUpdate(e.target.value);
});
shortcutRadiusNum.addEventListener('blur', (e) => { if (e.target.value === '') handleShortcutRadiusUpdate(12); });

// Shortcut Opacity Logic
const shortcutOpacitySlider = document.getElementById('shortcut-opacity-slider');
const shortcutOpacityNum = document.getElementById('shortcut-opacity-num');

function handleShortcutOpacityUpdate(val) {
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 100) num = 100;
    shortcutOpacitySlider.value = num;
    shortcutOpacityNum.value = num;
    saveAndApply({ shortcutOpacity: num.toString() });
}

shortcutOpacitySlider.addEventListener('input', (e) => handleShortcutOpacityUpdate(e.target.value));
shortcutOpacityNum.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    if (e.target.value !== '') handleShortcutOpacityUpdate(e.target.value);
});
shortcutOpacityNum.addEventListener('blur', (e) => { if (e.target.value === '') handleShortcutOpacityUpdate(80); });

// Scrollbar Settings Mapping
document.getElementById('scrollbar-visibility-select').addEventListener('change', (e) => saveAndApply({ scrollbarVis: e.target.value }));
document.getElementById('scrollbar-color-mode-select').addEventListener('change', (e) => saveAndApply({ scrollbarMode: e.target.value }));

// Clock Settings Mapping
document.getElementById('show-clock-toggle').addEventListener('change', (e) => saveAndApply({ showClock: e.target.checked }));
document.getElementById('show-date-toggle').addEventListener('change', (e) => saveAndApply({ showDate: e.target.checked }));
document.getElementById('time-format-select').addEventListener('change', (e) => saveAndApply({ timeFormat: e.target.value }));
document.getElementById('date-position-select').addEventListener('change', (e) => saveAndApply({ datePosition: e.target.value }));
document.getElementById('clock-color-mode-select').addEventListener('change', (e) => saveAndApply({ clockColorMode: e.target.value }));

// Lock Layout Mapping
document.getElementById('show-lock-btn-toggle').addEventListener('change', (e) => saveAndApply({ showLockBtn: e.target.checked }));
document.getElementById('lock-btn').addEventListener('click', () => {
    chrome.storage.local.get({ isLocked: false }, ({ isLocked }) => {
        const newLockState = !isLocked;
        saveAndApply({ isLocked: newLockState });
        
        // If the layout is being locked, smoothly close the customize panel
        if (newLockState === true) {
            document.getElementById('side-panel').classList.remove('open');
        }
    });
});

// Backup Mapping
document.getElementById('export-btn').addEventListener('click', exportSettings);
document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-input').click());
document.getElementById('import-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        importSettings(file, (success) => {
            if (success) {
                window.location.reload();
            } else {
                alert('Error: Invalid backup file.');
            }
        });
    }
    e.target.value = '';
});

function applySettings() {
    getSettings((result) => {
        document.getElementById('accent-color-picker').value = result.accentColor;
        document.getElementById('accent-color-text').value = result.accentColor.toUpperCase();
        document.documentElement.style.setProperty('--accent-color', result.accentColor);

        applyBackground(result.bgType, result.bgValue);
        if (result.bgType === 'color') {
            document.getElementById('bg-color-picker').value = result.bgValue;
            document.getElementById('bg-color-text').value = result.bgValue.toUpperCase();
        }
        
        const isBgLight = result.bgType === 'color' && getTextColorForBackground(result.bgValue) === 'dark-text';

        document.getElementById('show-shadows-toggle').checked = result.showShadows;
        document.body.classList.toggle('no-shadows', !result.showShadows);
        
        document.getElementById('global-font-select').value = result.globalFont;
        document.body.style.fontFamily = result.globalFont;

        // Search UI
        document.getElementById('show-search-toggle').checked = result.showSearch;
        document.body.classList.toggle('search-off', !result.showSearch);
        
        const searchOptionsGroup = document.getElementById('search-options-group');
        if (searchOptionsGroup) searchOptionsGroup.style.display = result.showSearch ? 'block' : 'none';
        
        document.getElementById('show-search-border-toggle').checked = result.showSearchBorder;
        document.body.classList.toggle('search-border-off', !result.showSearchBorder);

        document.getElementById('search-engine-select').value = result.searchEngine;
        document.getElementById('search-color-mode-select').value = result.searchMode;
        
        document.getElementById('search-color-picker').value = result.searchColor;
        document.getElementById('search-color-text').value = result.searchColor.toUpperCase();
        document.getElementById('search-color-wrapper').style.display = result.searchMode === 'custom' ? 'flex' : 'none';

        let activeSearchBg = '#202124';
        if (result.searchMode === 'accent') activeSearchBg = result.accentColor;
        else if (result.searchMode === 'custom') activeSearchBg = result.searchColor;
        else if (isBgLight) activeSearchBg = '#ffffff';

        document.documentElement.style.setProperty('--search-bg', activeSearchBg);
        const searchTextColor = getTextColorForBackground(activeSearchBg);
        document.documentElement.style.setProperty('--search-text', searchTextColor === 'dark-text' ? '#000000' : '#ffffff');
        document.body.classList.toggle('dark-search-text', searchTextColor === 'dark-text');

        document.getElementById('search-radius-slider').value = result.searchRadius;
        document.getElementById('search-radius-num').value = result.searchRadius;
        document.documentElement.style.setProperty('--search-radius', result.searchRadius + 'px');

        const currentSearchOpacity = result.searchOpacity !== undefined ? result.searchOpacity : '100';
        document.getElementById('search-opacity-slider').value = currentSearchOpacity;
        document.getElementById('search-opacity-num').value = currentSearchOpacity;
        document.documentElement.style.setProperty('--search-opacity', currentSearchOpacity + '%');

        updateSearchIcon(result.searchEngine);

        // Shortcut UI
        document.getElementById('shortcut-type-select').value = result.shortcutType;
        document.getElementById('shortcut-color-mode-select').value = result.shortcutMode;
        
        document.getElementById('shortcut-color-picker').value = result.shortcutColor;
        document.getElementById('shortcut-color-text').value = result.shortcutColor.toUpperCase();
        document.getElementById('shortcut-color-wrapper').style.display = result.shortcutMode === 'custom' ? 'flex' : 'none';

        let activeShortcutBg = '#303134';
        if (result.shortcutMode === 'accent') activeShortcutBg = result.accentColor;
        else if (result.shortcutMode === 'custom') activeShortcutBg = result.shortcutColor;
        else if (isBgLight) activeShortcutBg = '#ffffff';

        document.documentElement.style.setProperty('--shortcut-bg', activeShortcutBg);
        const shortcutTextColor = getTextColorForBackground(activeShortcutBg);
        document.documentElement.style.setProperty('--shortcut-text', shortcutTextColor === 'dark-text' ? '#000000' : '#ffffff');
        document.body.classList.toggle('dark-shortcut-text', shortcutTextColor === 'dark-text');

        const currentShortcutRadius = result.shortcutRadius !== undefined ? result.shortcutRadius : '12';
        document.getElementById('shortcut-radius-slider').value = currentShortcutRadius;
        document.getElementById('shortcut-radius-num').value = currentShortcutRadius;
        document.documentElement.style.setProperty('--shortcut-radius', currentShortcutRadius + 'px');

        const currentShortcutOpacity = result.shortcutOpacity !== undefined ? result.shortcutOpacity : '80';
        document.getElementById('shortcut-opacity-slider').value = currentShortcutOpacity;
        document.getElementById('shortcut-opacity-num').value = currentShortcutOpacity;
        document.documentElement.style.setProperty('--shortcut-opacity', currentShortcutOpacity + '%');

        // Scrollbar UI
        document.getElementById('scrollbar-visibility-select').value = result.scrollbarVis;
        document.getElementById('scrollbar-color-mode-select').value = result.scrollbarMode;
        
        document.getElementById('scrollbar-color-picker').value = result.scrollbarColor;
        document.getElementById('scrollbar-color-text').value = result.scrollbarColor.toUpperCase();

        document.documentElement.classList.toggle('hover-scrollbar', result.scrollbarVis === 'hover');
        document.documentElement.classList.toggle('accent-scrollbar', result.scrollbarMode === 'accent');
        document.documentElement.classList.toggle('custom-scrollbar', result.scrollbarMode === 'custom');
        document.getElementById('scrollbar-color-wrapper').style.display = result.scrollbarMode === 'custom' ? 'flex' : 'none';
        if (result.scrollbarMode === 'custom') document.documentElement.style.setProperty('--custom-sc-color', result.scrollbarColor);
        else document.documentElement.style.removeProperty('--custom-sc-color');

        // Clock & Date UI
        document.getElementById('show-clock-toggle').checked = result.showClock;
        document.body.classList.toggle('clock-off', !result.showClock);
        document.getElementById('show-date-toggle').checked = result.showDate;
        setTimeFormat(result.timeFormat);
        document.getElementById('time-format-select').value = result.timeFormat;
        document.getElementById('date-position-select').value = result.datePosition;

        const clockWidget = document.getElementById('clock-widget');
        const clockOptionsGroup = document.getElementById('clock-options-group');
        
        if (!result.showClock) {
            clockWidget.style.display = 'none';
            if (clockOptionsGroup) clockOptionsGroup.style.display = 'none';
        } else {
            clockWidget.style.display = 'flex';
            if (clockOptionsGroup) clockOptionsGroup.style.display = 'block';
            document.getElementById('date-display').style.display = result.showDate ? 'block' : 'none';
            clockWidget.style.flexDirection = (result.datePosition === 'above') ? 'column-reverse' : 'column';
        }

        const clockMode = result.clockColorMode || 'monochrome'; 
        document.getElementById('clock-color-mode-select').value = clockMode;
        
        const customClockColor = result.clockColor || '#ffffff';
        document.getElementById('clock-color-picker').value = customClockColor;
        document.getElementById('clock-color-text').value = customClockColor.toUpperCase();
        document.getElementById('clock-color-wrapper').style.display = clockMode === 'custom' ? 'flex' : 'none';

        let activeClockColor = '#ffffff';
        let activeDateColor = '#e8eaed'; 

        if (clockMode === 'monochrome') {
            activeClockColor = isBgLight ? '#000000' : '#ffffff';
            activeDateColor = isBgLight ? '#202124' : '#e8eaed';
        } else if (clockMode === 'dynamic' && result.bgType === 'color') {
            const dynamicColor = getDynamicColorForBackground(result.bgValue);
            activeClockColor = dynamicColor;
            activeDateColor = dynamicColor;
        } else if (clockMode === 'custom') {
            activeClockColor = customClockColor;
            activeDateColor = customClockColor;
        } else {
            activeClockColor = isBgLight ? '#000000' : '#ffffff';
            activeDateColor = isBgLight ? '#202124' : '#e8eaed';
        }

        document.documentElement.style.setProperty('--clock-color', activeClockColor);
        document.documentElement.style.setProperty('--date-color', activeDateColor);

        // --- NEW LOCK LOGIC ---
        const showLock = result.showLockBtn !== undefined ? result.showLockBtn : true;
        const isLocked = result.isLocked || false;
        
        document.getElementById('show-lock-btn-toggle').checked = showLock;
        document.getElementById('lock-btn').style.display = showLock ? 'flex' : 'none';
        document.body.classList.toggle('is-locked', isLocked);
        // ----------------------

        // Grid Rendering 
        currentMaxShortcuts = parseInt(result.maxShortcuts, 10) || 50;
        document.getElementById('max-shortcuts-select').value = currentMaxShortcuts;
        document.getElementById('show-shortcuts-toggle').checked = result.showShortcuts;
        document.body.classList.toggle('grid-off', !result.showShortcuts);
        document.getElementById('show-labels-toggle').checked = result.showLabels;
        document.body.classList.toggle('hide-labels', !result.showLabels);

        const shortcutOptionsGroup = document.getElementById('shortcut-options-group');

        if (!result.showShortcuts) {
            document.getElementById('grid-container').style.display = 'none';
            if (shortcutOptionsGroup) shortcutOptionsGroup.style.display = 'none';
        } else {
            document.getElementById('grid-container').style.display = 'flex';
            if (shortcutOptionsGroup) shortcutOptionsGroup.style.display = 'block';

            if (result.shortcutType === 'topSites') {
                chrome.topSites.get((topSites) => renderGrid(topSites.slice(0, 10).map(s => ({ name: s.title, url: s.url })), false, currentMaxShortcuts));
            } else {
                renderGrid(result.shortcuts, true, currentMaxShortcuts);
            }
        }
    });
}

applySettings();

document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') return;

    if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
    }
});