import { getSettings, updateStorage } from './state.js';
import { applyBackground } from './ui.js';
import { updateSearchIcon } from './search.js';
import { setTimeFormat, setSecondsVisible, setDateFormat } from './clock.js';
import { renderGrid } from './grid.js';
import { applyThemeColors } from './utils.js';
import { applyPomodoroTheme } from './pomodoro.js';

export function getAverageColor(imgElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = 100; 
  canvas.height = 100;
  ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let r = 0, g = 0, b = 0, count = 0;

  for (let i = 0; i < data.length; i += 16) { 
    if (data[i + 3] === 0) continue; 
    r += data[i]; 
    g += data[i + 1]; 
    b += data[i + 2];
    count++;
  }

  if (count === 0) return '#8ab4f8';

  r = Math.floor(r / count); 
  g = Math.floor(g / count); 
  b = Math.floor(b / count);
  const toHex = (c) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function saveAndApply(updates) {
  updateStorage(updates, applySettings);
}

const syncInput = (id, value) => {
  const el = document.getElementById(id);
  if (el && document.activeElement !== el && value !== undefined && value !== null) {
    if (el.type === 'checkbox') {
      el.checked = Boolean(value);
    } else {
      el.value = value;
    }
  }
};

const toggleDisplay = (id, condition, displayStyle = 'block') => {
  const el = document.getElementById(id);
  if (el) el.style.display = condition ? displayStyle : 'none';
};

const toggleClass = (condition, className) => {
  document.documentElement.classList.toggle(className, condition);
  if (document.body) {
    document.body.classList.toggle(className, condition);
  }
};

const safeUpper = (val, fallback = '#FFFFFF') => {
  return typeof val === 'string' ? val.toUpperCase() : fallback;
};

/**
 * Master dispatcher: maps stored settings to DOM, CSS variables, and widgets.
 */
export function applySettings() {
  getSettings((result) => {
    applyThemeColors(result);
    applyBackground(result.bgType, result.bgValue); 

    // --- Color Pickers & Hex Inputs ---
    syncInput('accent-color-picker', result.accentColor);
    syncInput('accent-color-text', safeUpper(result.accentColor, '#8AB4F8'));

    if (result.bgType === 'color') {
      syncInput('bg-color-picker', result.bgValue);
      syncInput('bg-color-text', safeUpper(result.bgValue, '#F0EEE9'));
    }

    syncInput('search-color-picker', result.searchColor);
    syncInput('search-color-text', safeUpper(result.searchColor, '#F6EBC8'));
    syncInput('shortcut-color-picker', result.shortcutColor);
    syncInput('shortcut-color-text', safeUpper(result.shortcutColor, '#D3E4F1'));
    syncInput('scrollbar-color-picker', result.scrollbarColor);
    syncInput('scrollbar-color-text', safeUpper(result.scrollbarColor, '#8AB4F8'));

    const clockCustom = result.clockColor || '#ffffff';
    syncInput('clock-color-picker', clockCustom);
    syncInput('clock-color-text', safeUpper(clockCustom, '#FFFFFF'));

    // --- Global UI & Live Font Controls ---
    syncInput('show-shadows-toggle', result.showShadows);
    toggleClass(!result.showShadows, 'no-shadows');

    syncInput('global-font-select', result.globalFont);
    if (result.globalFont) {
      document.documentElement.style.setProperty('--global-font', result.globalFont);
      document.body.style.setProperty('font-family', result.globalFont, 'important');
    }

    const gRadius = result.globalRadius !== undefined ? result.globalRadius : 12;
    syncInput('global-radius-slider', gRadius);
    syncInput('global-radius-num', gRadius);
    document.documentElement.style.setProperty('--search-radius', `${gRadius}px`);
    document.documentElement.style.setProperty('--shortcut-radius', `${gRadius}px`);
    document.documentElement.style.setProperty('--pomo-radius', `${gRadius}px`);

    const gOpacity = result.globalOpacity !== undefined ? result.globalOpacity : 100;
    syncInput('global-opacity-slider', gOpacity);
    syncInput('global-opacity-num', gOpacity);
    document.documentElement.style.setProperty('--search-opacity', `${gOpacity}%`);
    document.documentElement.style.setProperty('--shortcut-opacity', `${gOpacity}%`);

    const gGlass = result.globalGlass !== false;
    syncInput('global-glass-toggle', gGlass);
    toggleClass(!gGlass, 'search-glass-off');
    toggleClass(!gGlass, 'shortcut-glass-off');

    // --- Search Widget ---
    syncInput('show-search-toggle', result.showSearch);
    toggleClass(!result.showSearch, 'search-off');
    toggleDisplay('search-options-group', result.showSearch);

    const showBorder = result.showSearchBorder !== false;
    syncInput('show-search-border-toggle', showBorder);
    toggleClass(!showBorder, 'search-border-off');

    syncInput('search-engine-select', result.searchEngine);
    syncInput('search-color-mode-select', result.searchMode);
    toggleDisplay('search-color-wrapper', result.searchMode === 'custom', 'flex');

    updateSearchIcon(result.searchEngine);

    // --- Shortcuts & Grid ---
    syncInput('shortcut-type-select', result.shortcutType);
    syncInput('shortcut-color-mode-select', result.shortcutMode);
    toggleDisplay('shortcut-color-wrapper', result.shortcutMode === 'custom', 'flex');

    const scrollVis = result.scrollbarVis || 'always';
    const scrollMode = result.scrollbarMode || 'auto';
    syncInput('scrollbar-visibility-select', scrollVis);
    syncInput('scrollbar-color-mode-select', scrollMode);
    toggleClass(scrollVis === 'hover', 'hover-scrollbar');
    toggleClass(scrollMode === 'accent', 'accent-scrollbar');
    toggleClass(scrollMode === 'custom', 'custom-scrollbar');
    toggleDisplay('scrollbar-color-wrapper', scrollMode === 'custom', 'flex');

    // --- Clock & Date ---
    syncInput('show-clock-toggle', result.showClock);
    toggleClass(!result.showClock, 'clock-off');

    setTimeFormat(result.timeFormat);
    syncInput('time-format-select', result.timeFormat);

    const showSecs = Boolean(result.showSeconds);
    syncInput('show-seconds-toggle', showSecs);
    setSecondsVisible(showSecs);

    syncInput('show-date-toggle', result.showDate);

    const dFmt = result.dateFormat || 'full';
    syncInput('date-format-select', dFmt);
    setDateFormat(dFmt);

    syncInput('date-position-select', result.datePosition);

    const clockMode = result.clockColorMode || 'dynamic'; 
    syncInput('clock-color-mode-select', clockMode);
    toggleDisplay('clock-color-wrapper', clockMode === 'custom', 'flex');

    toggleDisplay('clock-options-group', result.showClock);

    const clockWidget = document.getElementById('clock-widget');
    if (result.showClock && clockWidget) {
      toggleDisplay('date-display', result.showDate);
      clockWidget.style.flexDirection = result.datePosition === 'above' ? 'column-reverse' : 'column';
    }

    // --- Pomodoro Settings & Live Synchronization ---
    syncInput('show-pomodoro-toggle', result.showPomodoro !== false);
    syncInput('pomodoro-position-select', result.pomodoroPosition || 'top-left');
    syncInput('pomodoro-color-mode-select', result.pomodoroColorMode || 'custom');
    syncInput('pomodoro-bg-picker', result.pomodoroBg || '#f0eee9');
    syncInput('pomodoro-bg-text', safeUpper(result.pomodoroBg, '#F0EEE9'));
    syncInput('pomodoro-border-toggle', Boolean(result.pomodoroBorder));
    
    const focusVal = result.focusTime || 25;
    syncInput('pomodoro-focus-slider', focusVal);
    syncInput('pomodoro-focus-num', focusVal);
    
    const breakVal = result.breakTime || 5;
    syncInput('pomodoro-break-slider', breakVal);
    syncInput('pomodoro-break-num', breakVal);

    toggleDisplay('pomodoro-bg-picker-wrapper', (result.pomodoroColorMode || 'custom') === 'custom', 'flex');
    toggleDisplay('pomodoro-options-group', result.showPomodoro !== false);
    
    applyPomodoroTheme(result);

    // --- Lock Control ---
    const showLock = result.showLockBtn !== undefined ? result.showLockBtn : true;
    syncInput('show-lock-btn-toggle', showLock);
    toggleDisplay('lock-btn', showLock, 'grid');
    toggleClass(Boolean(result.isLocked), 'is-locked');

    // --- Shortcuts Grid Rendering ---
    const currentMaxShortcuts = parseInt(result.maxShortcuts, 10) || 50;
    syncInput('max-shortcuts-select', currentMaxShortcuts);
    syncInput('show-shortcuts-toggle', result.showShortcuts);
    toggleClass(!result.showShortcuts, 'grid-off');
    syncInput('show-labels-toggle', result.showLabels);
    toggleClass(!result.showLabels, 'hide-labels');

    toggleDisplay('shortcut-options-group', result.showShortcuts);

    if (result.showShortcuts) {
      const activeEl = document.activeElement;
      const isDraggingUI = activeEl && (activeEl.type === 'color' || activeEl.type === 'range');

      if (!isDraggingUI) {
        const customShortcuts = result.shortcuts || [];
        const hiddenTopSites = result.hiddenTopSites || [];

        if (result.shortcutType === 'topSites') {
          chrome.topSites.get((topSites) => {
            const customUrls = new Set(customShortcuts.map(s => s.url));
            const dynamicSites = (topSites || [])
              .filter(s => !customUrls.has(s.url) && !hiddenTopSites.includes(s.url))
              .map(s => ({ name: s.title, url: s.url, isTopSite: true }));

            const hybrid = [...dynamicSites, ...customShortcuts.map(s => ({ ...s, isCustom: true }))].slice(0, currentMaxShortcuts);
            renderGrid(hybrid, true, currentMaxShortcuts);
          });
        } else {
          renderGrid(customShortcuts, true, currentMaxShortcuts);
        }
      }
    }
  });
}