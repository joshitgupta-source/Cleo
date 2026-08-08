import { saveAndApply } from './theme.js';
import { exportSettings, importSettings } from './state.js';

// ==========================================
// PERFORMANCE OPTIMIZATION: Throttling
// ==========================================
// Limits rapid-firing UI events (sliders/color pickers) to ~60FPS.
// This prevents Chrome storage from choking during drag actions.
let saveTimeout;
const throttledSave = (payload) => {
    if (saveTimeout) cancelAnimationFrame(saveTimeout);
    saveTimeout = requestAnimationFrame(() => saveAndApply(payload));
};

// ==========================================
// COMPLEX SYNC FUNCTIONS
// ==========================================
function syncColorPicker(pickerId, textId, settingKey) {
    const picker = document.getElementById(pickerId);
    const text = document.getElementById(textId);
    if (!picker || !text) return; // Safety guard

    const updateColor = (val) => {
        const payload = settingKey === 'bgValue' ? { bgType: 'color', bgValue: val } : { [settingKey]: val };
        throttledSave(payload);
    };

    picker.addEventListener('input', (e) => {
        const val = e.target.value.toUpperCase();
        text.value = val;
        updateColor(val);
    });

    text.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-F]{6}$/i.test(val)) {
            picker.value = val;
            updateColor(val);
        }
    });
}

function syncSlider(sliderId, numId, settingKey, min, max, defaultVal) {
    const slider = document.getElementById(sliderId);
    const numInput = document.getElementById(numId);
    if (!slider || !numInput) return; // Safety guard

    const updateValues = (val) => {
        let num = parseInt(val, 10);
        if (isNaN(num) || num < min) num = min;
        if (num > max) num = max;
        
        slider.value = num;
        numInput.value = num;
        throttledSave({ [settingKey]: num.toString() });
    };

    slider.addEventListener('input', (e) => updateValues(e.target.value));
    
    numInput.addEventListener('input', (e) => {
        const cleanVal = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = cleanVal;
        if (cleanVal !== '') updateValues(cleanVal);
    });
    
    numInput.addEventListener('blur', (e) => {
        if (e.target.value === '') updateValues(defaultVal);
    });
}

// Initialize Pickers & Sliders
syncColorPicker('bg-color-picker', 'bg-color-text', 'bgValue');
syncColorPicker('accent-color-picker', 'accent-color-text', 'accentColor');
syncColorPicker('search-color-picker', 'search-color-text', 'searchColor');
syncColorPicker('shortcut-color-picker', 'shortcut-color-text', 'shortcutColor');
syncColorPicker('scrollbar-color-picker', 'scrollbar-color-text', 'scrollbarColor');
syncColorPicker('clock-color-picker', 'clock-color-text', 'clockColor');

syncSlider('search-radius-slider', 'search-radius-num', 'searchRadius', 0, 40, 24);
syncSlider('search-opacity-slider', 'search-opacity-num', 'searchOpacity', 0, 100, 100);
syncSlider('shortcut-radius-slider', 'shortcut-radius-num', 'shortcutRadius', 0, 30, 12);
syncSlider('shortcut-opacity-slider', 'shortcut-opacity-num', 'shortcutOpacity', 0, 100, 80);

// ==========================================
// DRY EVENT BINDING HELPERS
// ==========================================
// Replaces 20+ lines of repetitive addEventListeners with a clean map
const bindSetting = (id, key, isNumber = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', (e) => {
        let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        if (isNumber) val = parseInt(val, 10);
        saveAndApply({ [key]: val });
    });
};

// Global Theme
bindSetting('global-font-select', 'globalFont');

// Search
bindSetting('show-search-toggle', 'showSearch');
bindSetting('show-search-border-toggle', 'showSearchBorder');
bindSetting('search-glass-toggle', 'searchGlass');
bindSetting('search-engine-select', 'searchEngine');
bindSetting('search-color-mode-select', 'searchMode');

// Shortcuts
bindSetting('shortcut-type-select', 'shortcutType');
bindSetting('shortcut-color-mode-select', 'shortcutMode');
bindSetting('show-shortcuts-toggle', 'showShortcuts');
bindSetting('shortcut-glass-toggle', 'shortcutGlass');
bindSetting('show-labels-toggle', 'showLabels');
bindSetting('max-shortcuts-select', 'maxShortcuts', true);

// Advanced UI
bindSetting('scrollbar-visibility-select', 'scrollbarVis');
bindSetting('scrollbar-color-mode-select', 'scrollbarMode');
bindSetting('show-lock-btn-toggle', 'showLockBtn');
bindSetting('show-shadows-toggle', 'showShadows');

// Clock
bindSetting('show-clock-toggle', 'showClock');
bindSetting('time-format-select', 'timeFormat');
bindSetting('show-seconds-toggle', 'showSeconds');
bindSetting('show-date-toggle', 'showDate');
bindSetting('date-format-select', 'dateFormat');
bindSetting('date-position-select', 'datePosition');
bindSetting('clock-color-mode-select', 'clockColorMode');

// ==========================================
// SPECIAL ACTIONS (Backgrounds, Locks, Backups)
// ==========================================
document.getElementById('bg-image-btn')?.addEventListener('click', () => document.getElementById('bg-image-input').click());
document.getElementById('bg-image-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => saveAndApply({ bgType: 'image', bgValue: event.target.result });
        reader.readAsDataURL(file);
    }
});
document.getElementById('bg-reset-btn')?.addEventListener('click', () => saveAndApply({ bgType: 'color', bgValue: '#000000' }));

// Lock Logic
document.getElementById('lock-btn')?.addEventListener('click', () => {
    chrome.storage.local.get({ isLocked: false }, ({ isLocked }) => {
        const newLockState = !isLocked;
        saveAndApply({ isLocked: newLockState });
        if (newLockState) document.getElementById('side-panel').classList.remove('open');
    });
});

// Backup UI
document.getElementById('export-btn')?.addEventListener('click', exportSettings);
document.getElementById('import-btn')?.addEventListener('click', () => document.getElementById('import-input').click());
document.getElementById('import-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        importSettings(file, (success) => {
            if (success) window.location.reload();
            else alert('Error: Invalid backup file.');
        });
    }
    e.target.value = '';
});