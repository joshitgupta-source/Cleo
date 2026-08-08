import { getSettings, updateStorage } from './state.js';
import { applyBackground } from './ui.js';
import { updateSearchIcon } from './search.js';
import { setTimeFormat, setSecondsVisible, setDateFormat } from './clock.js';
import { renderGrid } from './grid.js';
import { applyThemeColors } from './utils.js';

export function saveAndApply(updates) {
    updateStorage(updates, applySettings);
}

// ==========================================
// PERFORMANCE FIX: Safe Input Syncing
// ==========================================
// Prevents updating an element if the user is currently interacting with it.
// This stops color pickers and sliders from stuttering/freezing while dragging.
const syncInput = (id, value) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) {
        if (el.type === 'checkbox') el.checked = value;
        else el.value = value;
    }
};

export function applySettings() {
    getSettings((result) => {
        // 1. Core Theming 
        applyThemeColors(result);
        
        // NOTE: If the background STILL isn't updating in real-time after this, 
        // the bug is inside this applyBackground function in ui.js!
        applyBackground(result.bgType, result.bgValue); 

        // 2. Sync Color Pickers (Safely)
        syncInput('accent-color-picker', result.accentColor);
        syncInput('accent-color-text', result.accentColor.toUpperCase());
        
        if (result.bgType === 'color') {
            syncInput('bg-color-picker', result.bgValue);
            syncInput('bg-color-text', result.bgValue.toUpperCase());
        }

        syncInput('search-color-picker', result.searchColor);
        syncInput('search-color-text', result.searchColor.toUpperCase());
        syncInput('shortcut-color-picker', result.shortcutColor);
        syncInput('shortcut-color-text', result.shortcutColor.toUpperCase());
        syncInput('scrollbar-color-picker', result.scrollbarColor);
        syncInput('scrollbar-color-text', result.scrollbarColor.toUpperCase());
        
        const clockCustom = result.clockColor || '#ffffff';
        syncInput('clock-color-picker', clockCustom);
        syncInput('clock-color-text', clockCustom.toUpperCase());

        // 3. Environment & Fonts
        syncInput('show-shadows-toggle', result.showShadows);
        document.body.classList.toggle('no-shadows', !result.showShadows);
        
        syncInput('global-font-select', result.globalFont);
        if (document.body.style.fontFamily !== result.globalFont) {
            document.body.style.fontFamily = result.globalFont;
        }

        // 4. Search UI
        syncInput('show-search-toggle', result.showSearch);
        document.body.classList.toggle('search-off', !result.showSearch);
        
        const searchOptionsGroup = document.getElementById('search-options-group');
        if (searchOptionsGroup) searchOptionsGroup.style.display = result.showSearch ? 'block' : 'none';
        
        syncInput('show-search-border-toggle', result.showSearchBorder);
        document.body.classList.toggle('search-border-off', !result.showSearchBorder);
        
        const currentSearchGlass = result.searchGlass !== false;
        syncInput('search-glass-toggle', currentSearchGlass);
        document.body.classList.toggle('search-glass-off', !currentSearchGlass);
        
        syncInput('search-engine-select', result.searchEngine);
        syncInput('search-color-mode-select', result.searchMode);
        document.getElementById('search-color-wrapper').style.display = result.searchMode === 'custom' ? 'flex' : 'none';
        
        syncInput('search-radius-slider', result.searchRadius);
        syncInput('search-radius-num', result.searchRadius);
        document.documentElement.style.setProperty('--search-radius', result.searchRadius + 'px');
        
        const searchOpacity = result.searchOpacity !== undefined ? result.searchOpacity : '100';
        syncInput('search-opacity-slider', searchOpacity);
        syncInput('search-opacity-num', searchOpacity);
        document.documentElement.style.setProperty('--search-opacity', searchOpacity + '%');
        
        updateSearchIcon(result.searchEngine);

        // 5. Shortcuts UI
        syncInput('shortcut-type-select', result.shortcutType);
        syncInput('shortcut-color-mode-select', result.shortcutMode);
        document.getElementById('shortcut-color-wrapper').style.display = result.shortcutMode === 'custom' ? 'flex' : 'none';
        
        const currentShortcutGlass = result.shortcutGlass !== false;
        syncInput('shortcut-glass-toggle', currentShortcutGlass);
        document.body.classList.toggle('shortcut-glass-off', !currentShortcutGlass);

        const shortcutRadius = result.shortcutRadius !== undefined ? result.shortcutRadius : '12';
        syncInput('shortcut-radius-slider', shortcutRadius);
        syncInput('shortcut-radius-num', shortcutRadius);
        document.documentElement.style.setProperty('--shortcut-radius', shortcutRadius + 'px');
        
        const shortcutOpacity = result.shortcutOpacity !== undefined ? result.shortcutOpacity : '80';
        syncInput('shortcut-opacity-slider', shortcutOpacity);
        syncInput('shortcut-opacity-num', shortcutOpacity);
        document.documentElement.style.setProperty('--shortcut-opacity', shortcutOpacity + '%');

        // 6. Scrollbar UI
        syncInput('scrollbar-visibility-select', result.scrollbarVis);
        syncInput('scrollbar-color-mode-select', result.scrollbarMode);
        document.documentElement.classList.toggle('hover-scrollbar', result.scrollbarVis === 'hover');
        document.documentElement.classList.toggle('accent-scrollbar', result.scrollbarMode === 'accent');
        document.documentElement.classList.toggle('custom-scrollbar', result.scrollbarMode === 'custom');
        document.getElementById('scrollbar-color-wrapper').style.display = result.scrollbarMode === 'custom' ? 'flex' : 'none';

        // 7. Clock & Date UI
        syncInput('show-clock-toggle', result.showClock);
        document.body.classList.toggle('clock-off', !result.showClock);
        
        setTimeFormat(result.timeFormat);
        syncInput('time-format-select', result.timeFormat);
        
        const showSecs = result.showSeconds || false;
        syncInput('show-seconds-toggle', showSecs);
        setSecondsVisible(showSecs);
        
        syncInput('show-date-toggle', result.showDate);
        
        const dFmt = result.dateFormat || 'full';
        syncInput('date-format-select', dFmt);
        setDateFormat(dFmt);
        
        syncInput('date-position-select', result.datePosition);
        
        const clockMode = result.clockColorMode || 'monochrome'; 
        syncInput('clock-color-mode-select', clockMode);
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

        // 8. Locking UI
        const showLock = result.showLockBtn !== undefined ? result.showLockBtn : true;
        syncInput('show-lock-btn-toggle', showLock);
        document.getElementById('lock-btn').style.display = showLock ? 'flex' : 'none';
        document.body.classList.toggle('is-locked', result.isLocked || false);

        // ==========================================
        // PERFORMANCE FIX: Stop Grid Thrashing
        // ==========================================
        const currentMaxShortcuts = parseInt(result.maxShortcuts, 10) || 50;
        syncInput('max-shortcuts-select', currentMaxShortcuts);
        syncInput('show-shortcuts-toggle', result.showShortcuts);
        document.body.classList.toggle('grid-off', !result.showShortcuts);
        syncInput('show-labels-toggle', result.showLabels);
        document.body.classList.toggle('hide-labels', !result.showLabels);

        const shortcutOptionsGroup = document.getElementById('shortcut-options-group');
        if (!result.showShortcuts) {
            document.getElementById('grid-container').style.display = 'none';
            if (shortcutOptionsGroup) shortcutOptionsGroup.style.display = 'none';
        } else {
            document.getElementById('grid-container').style.display = 'flex';
            if (shortcutOptionsGroup) shortcutOptionsGroup.style.display = 'block';

            // We check if a color picker or slider is active. 
            // If it is, SKIP rendering the grid to prevent severe UI lag!
            const activeEl = document.activeElement;
            const isDraggingUI = activeEl && (activeEl.type === 'color' || activeEl.type === 'range');
            
            if (!isDraggingUI) {
                if (result.shortcutType === 'topSites') {
                    chrome.topSites.get((topSites) => renderGrid(topSites.slice(0, 10).map(s => ({ name: s.title, url: s.url })), false, currentMaxShortcuts));
                } else {
                    renderGrid(result.shortcuts, true, currentMaxShortcuts);
                }
            }
        }
    });
}