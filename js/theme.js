import { getSettings, updateStorage } from './state.js';
import { applyBackground } from './ui.js';
import { updateSearchIcon } from './search.js';
import { setTimeFormat } from './clock.js';
import { renderGrid } from './grid.js';
import { applyThemeColors } from './utils.js'; // Imports our new centralized Color Engine

export function saveAndApply(updates) {
    updateStorage(updates, applySettings);
}

export function applySettings() {
    getSettings((result) => {
        // 1. Run the unified Color Engine
        applyThemeColors(result);

        // 2. Sync Color Picker UI values
        document.getElementById('accent-color-picker').value = result.accentColor;
        document.getElementById('accent-color-text').value = result.accentColor.toUpperCase();
        
        if (result.bgType === 'color') {
            document.getElementById('bg-color-picker').value = result.bgValue;
            document.getElementById('bg-color-text').value = result.bgValue.toUpperCase();
        }
        
        document.getElementById('search-color-picker').value = result.searchColor;
        document.getElementById('search-color-text').value = result.searchColor.toUpperCase();
        document.getElementById('shortcut-color-picker').value = result.shortcutColor;
        document.getElementById('shortcut-color-text').value = result.shortcutColor.toUpperCase();
        document.getElementById('scrollbar-color-picker').value = result.scrollbarColor;
        document.getElementById('scrollbar-color-text').value = result.scrollbarColor.toUpperCase();
        
        const clockCustom = result.clockColor || '#ffffff';
        document.getElementById('clock-color-picker').value = clockCustom;
        document.getElementById('clock-color-text').value = clockCustom.toUpperCase();

        // 3. Layout, Shadows & Font
        applyBackground(result.bgType, result.bgValue);
        document.getElementById('show-shadows-toggle').checked = result.showShadows;
        document.body.classList.toggle('no-shadows', !result.showShadows);
        document.getElementById('global-font-select').value = result.globalFont;
        document.body.style.fontFamily = result.globalFont;

        // 4. Search UI Modifiers
        document.getElementById('show-search-toggle').checked = result.showSearch;
        document.body.classList.toggle('search-off', !result.showSearch);
        const searchOptionsGroup = document.getElementById('search-options-group');
        if (searchOptionsGroup) searchOptionsGroup.style.display = result.showSearch ? 'block' : 'none';
        
        document.getElementById('show-search-border-toggle').checked = result.showSearchBorder;
        document.body.classList.toggle('search-border-off', !result.showSearchBorder);
        
        const currentSearchGlass = result.searchGlass !== false;
        document.getElementById('search-glass-toggle').checked = currentSearchGlass;
        document.body.classList.toggle('search-glass-off', !currentSearchGlass);
        
        document.getElementById('search-engine-select').value = result.searchEngine;
        document.getElementById('search-color-mode-select').value = result.searchMode;
        document.getElementById('search-color-wrapper').style.display = result.searchMode === 'custom' ? 'flex' : 'none';
        
        document.getElementById('search-radius-slider').value = result.searchRadius;
        document.getElementById('search-radius-num').value = result.searchRadius;
        document.documentElement.style.setProperty('--search-radius', result.searchRadius + 'px');
        
        const searchOpacity = result.searchOpacity !== undefined ? result.searchOpacity : '100';
        document.getElementById('search-opacity-slider').value = searchOpacity;
        document.getElementById('search-opacity-num').value = searchOpacity;
        document.documentElement.style.setProperty('--search-opacity', searchOpacity + '%');
        updateSearchIcon(result.searchEngine);

        // 5. Shortcut UI Modifiers
        document.getElementById('shortcut-type-select').value = result.shortcutType;
        document.getElementById('shortcut-color-mode-select').value = result.shortcutMode;
        document.getElementById('shortcut-color-wrapper').style.display = result.shortcutMode === 'custom' ? 'flex' : 'none';
        
        const shortcutRadius = result.shortcutRadius !== undefined ? result.shortcutRadius : '12';
        document.getElementById('shortcut-radius-slider').value = shortcutRadius;
        document.getElementById('shortcut-radius-num').value = shortcutRadius;
        document.documentElement.style.setProperty('--shortcut-radius', shortcutRadius + 'px');
        
        const shortcutOpacity = result.shortcutOpacity !== undefined ? result.shortcutOpacity : '80';
        document.getElementById('shortcut-opacity-slider').value = shortcutOpacity;
        document.getElementById('shortcut-opacity-num').value = shortcutOpacity;
        document.documentElement.style.setProperty('--shortcut-opacity', shortcutOpacity + '%');

        // 6. Scrollbar UI Modifiers
        document.getElementById('scrollbar-visibility-select').value = result.scrollbarVis;
        document.getElementById('scrollbar-color-mode-select').value = result.scrollbarMode;
        document.documentElement.classList.toggle('hover-scrollbar', result.scrollbarVis === 'hover');
        document.documentElement.classList.toggle('accent-scrollbar', result.scrollbarMode === 'accent');
        document.documentElement.classList.toggle('custom-scrollbar', result.scrollbarMode === 'custom');
        document.getElementById('scrollbar-color-wrapper').style.display = result.scrollbarMode === 'custom' ? 'flex' : 'none';

        // 7. Clock UI Modifiers
        document.getElementById('show-clock-toggle').checked = result.showClock;
        document.body.classList.toggle('clock-off', !result.showClock);
        document.getElementById('show-date-toggle').checked = result.showDate;
        setTimeFormat(result.timeFormat);
        document.getElementById('time-format-select').value = result.timeFormat;
        document.getElementById('date-position-select').value = result.datePosition;
        
        const clockMode = result.clockColorMode || 'monochrome'; 
        document.getElementById('clock-color-mode-select').value = clockMode;
        document.getElementById('clock-color-wrapper').style.display = clockMode === 'custom' ? 'flex' : 'none';
        
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

        // 8. Lock Button State
        const showLock = result.showLockBtn !== undefined ? result.showLockBtn : true;
        const isLocked = result.isLocked || false;
        document.getElementById('show-lock-btn-toggle').checked = showLock;
        document.getElementById('lock-btn').style.display = showLock ? 'flex' : 'none';
        document.body.classList.toggle('is-locked', isLocked);

        // 9. Grid Rendering
        const currentMaxShortcuts = parseInt(result.maxShortcuts, 10) || 50;
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