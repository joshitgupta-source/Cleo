import { getSettings, updateStorage } from './state.js';
import { getTextColorForBackground, getDynamicColorForBackground, blendColors } from './utils.js';
import { applyBackground } from './ui.js';
import { updateSearchIcon } from './search.js';
import { setTimeFormat } from './clock.js';
import { renderGrid } from './grid.js';

export function saveAndApply(updates) {
    updateStorage(updates, applySettings);
}

export function applySettings() {
    getSettings((result) => {
        document.getElementById('accent-color-picker').value = result.accentColor;
        document.getElementById('accent-color-text').value = result.accentColor.toUpperCase();
        document.documentElement.style.setProperty('--accent-color', result.accentColor);

        applyBackground(result.bgType, result.bgValue);
        if (result.bgType === 'color') {
            document.getElementById('bg-color-picker').value = result.bgValue;
            document.getElementById('bg-color-text').value = result.bgValue.toUpperCase();
        }
        
        const globalBgHex = (result.bgType === 'color') ? result.bgValue : '#000000';
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

        const currentSearchOpacityNum = result.searchOpacity !== undefined ? parseInt(result.searchOpacity, 10) : 100;
        const effectiveSearchBg = blendColors(activeSearchBg, globalBgHex, currentSearchOpacityNum);
        const searchTextColor = getTextColorForBackground(effectiveSearchBg);
        const solidSearchTextColor = getTextColorForBackground(activeSearchBg);

        document.documentElement.style.setProperty('--search-bg', activeSearchBg);
        document.documentElement.style.setProperty('--search-text', searchTextColor === 'dark-text' ? '#000000' : '#ffffff');
        document.documentElement.style.setProperty('--search-dropdown-text', solidSearchTextColor === 'dark-text' ? '#000000' : '#ffffff');
        document.body.classList.toggle('dark-search-text', searchTextColor === 'dark-text');

        document.getElementById('search-radius-slider').value = result.searchRadius;
        document.getElementById('search-radius-num').value = result.searchRadius;
        document.documentElement.style.setProperty('--search-radius', result.searchRadius + 'px');

        document.getElementById('search-opacity-slider').value = currentSearchOpacityNum;
        document.getElementById('search-opacity-num').value = currentSearchOpacityNum;
        document.documentElement.style.setProperty('--search-opacity', currentSearchOpacityNum + '%');

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

        const currentShortcutOpacityNum = result.shortcutOpacity !== undefined ? parseInt(result.shortcutOpacity, 10) : 80;
        const effectiveShortcutBg = blendColors(activeShortcutBg, globalBgHex, currentShortcutOpacityNum);
        const shortcutTextColor = getTextColorForBackground(effectiveShortcutBg);

        document.documentElement.style.setProperty('--shortcut-bg', activeShortcutBg);
        document.documentElement.style.setProperty('--shortcut-text', shortcutTextColor === 'dark-text' ? '#000000' : '#ffffff');
        document.body.classList.toggle('dark-shortcut-text', shortcutTextColor === 'dark-text');

        const currentShortcutRadius = result.shortcutRadius !== undefined ? result.shortcutRadius : '12';
        document.getElementById('shortcut-radius-slider').value = currentShortcutRadius;
        document.getElementById('shortcut-radius-num').value = currentShortcutRadius;
        document.documentElement.style.setProperty('--shortcut-radius', currentShortcutRadius + 'px');

        document.getElementById('shortcut-opacity-slider').value = currentShortcutOpacityNum;
        document.getElementById('shortcut-opacity-num').value = currentShortcutOpacityNum;
        document.documentElement.style.setProperty('--shortcut-opacity', currentShortcutOpacityNum + '%');

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

        // Lock UI
        const showLock = result.showLockBtn !== undefined ? result.showLockBtn : true;
        const isLocked = result.isLocked || false;
        
        document.getElementById('show-lock-btn-toggle').checked = showLock;
        document.getElementById('lock-btn').style.display = showLock ? 'flex' : 'none';
        document.body.classList.toggle('is-locked', isLocked);

        // Grid Rendering 
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