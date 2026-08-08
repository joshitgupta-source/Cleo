import { saveAndApply } from './theme.js';
import { exportSettings, importSettings } from './state.js';

// --- UNIVERSAL HELPER MODULES ---

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

function syncSlider(sliderId, numId, settingKey, min, max, defaultVal) {
    const slider = document.getElementById(sliderId);
    const numInput = document.getElementById(numId);

    function updateValues(val) {
        let num = parseInt(val, 10);
        if (isNaN(num) || num < min) num = min;
        if (num > max) num = max;
        slider.value = num;
        numInput.value = num;
        saveAndApply({ [settingKey]: num.toString() });
    }

    slider.addEventListener('input', (e) => updateValues(e.target.value));
    
    numInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        if (e.target.value !== '') updateValues(e.target.value);
    });
    
    numInput.addEventListener('blur', (e) => {
        if (e.target.value === '') updateValues(defaultVal);
    });
}

// --- INITIALIZE UI LISTENERS ---

// Map Color Pickers
syncColorPicker('bg-color-picker', 'bg-color-text', 'bgValue');
syncColorPicker('accent-color-picker', 'accent-color-text', 'accentColor');
syncColorPicker('search-color-picker', 'search-color-text', 'searchColor');
syncColorPicker('shortcut-color-picker', 'shortcut-color-text', 'shortcutColor');
syncColorPicker('scrollbar-color-picker', 'scrollbar-color-text', 'scrollbarColor');
syncColorPicker('clock-color-picker', 'clock-color-text', 'clockColor');

// Map Sliders (Using your DRY logic!)
syncSlider('search-radius-slider', 'search-radius-num', 'searchRadius', 0, 40, 24);
syncSlider('search-opacity-slider', 'search-opacity-num', 'searchOpacity', 0, 100, 100);
syncSlider('shortcut-radius-slider', 'shortcut-radius-num', 'shortcutRadius', 0, 30, 12);
syncSlider('shortcut-opacity-slider', 'shortcut-opacity-num', 'shortcutOpacity', 0, 100, 80);

// Global Themes
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
document.getElementById('global-font-select').addEventListener('change', (e) => saveAndApply({ globalFont: e.target.value }));

// Search Settings
document.getElementById('show-search-toggle').addEventListener('change', (e) => saveAndApply({ showSearch: e.target.checked }));
document.getElementById('show-search-border-toggle').addEventListener('change', (e) => saveAndApply({ showSearchBorder: e.target.checked }));
document.getElementById('search-glass-toggle').addEventListener('change', (e) => saveAndApply({ searchGlass: e.target.checked }));
document.getElementById('search-engine-select').addEventListener('change', (e) => saveAndApply({ searchEngine: e.target.value }));
document.getElementById('search-color-mode-select').addEventListener('change', (e) => saveAndApply({ searchMode: e.target.value }));

// Shortcut Settings
document.getElementById('shortcut-type-select').addEventListener('change', (e) => saveAndApply({ shortcutType: e.target.value }));
document.getElementById('shortcut-color-mode-select').addEventListener('change', (e) => saveAndApply({ shortcutMode: e.target.value }));
document.getElementById('show-shortcuts-toggle').addEventListener('change', (e) => saveAndApply({ showShortcuts: e.target.checked }));
document.getElementById('show-labels-toggle').addEventListener('change', (e) => saveAndApply({ showLabels: e.target.checked }));
document.getElementById('max-shortcuts-select').addEventListener('change', (e) => saveAndApply({ maxShortcuts: parseInt(e.target.value, 10) }));

// Advanced UI
document.getElementById('scrollbar-visibility-select').addEventListener('change', (e) => saveAndApply({ scrollbarVis: e.target.value }));
document.getElementById('scrollbar-color-mode-select').addEventListener('change', (e) => saveAndApply({ scrollbarMode: e.target.value }));
document.getElementById('show-lock-btn-toggle').addEventListener('change', (e) => saveAndApply({ showLockBtn: e.target.checked }));
document.getElementById('show-shadows-toggle').addEventListener('change', (e) => saveAndApply({ showShadows: e.target.checked }));

// Clock Settings
document.getElementById('show-clock-toggle').addEventListener('change', (e) => saveAndApply({ showClock: e.target.checked }));
document.getElementById('show-date-toggle').addEventListener('change', (e) => saveAndApply({ showDate: e.target.checked }));
document.getElementById('time-format-select').addEventListener('change', (e) => saveAndApply({ timeFormat: e.target.value }));
document.getElementById('date-position-select').addEventListener('change', (e) => saveAndApply({ datePosition: e.target.value }));
document.getElementById('clock-color-mode-select').addEventListener('change', (e) => saveAndApply({ clockColorMode: e.target.value }));

// Lock Logic
document.getElementById('lock-btn').addEventListener('click', () => {
    chrome.storage.local.get({ isLocked: false }, ({ isLocked }) => {
        const newLockState = !isLocked;
        saveAndApply({ isLocked: newLockState });
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