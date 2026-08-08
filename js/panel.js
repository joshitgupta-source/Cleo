import { saveAndApply } from './theme.js';
import { exportSettings, importSettings } from './state.js';

let saveTimeout;
const throttledSave = (payload) => {
    if (saveTimeout) cancelAnimationFrame(saveTimeout);
    saveTimeout = requestAnimationFrame(() => saveAndApply(payload));
};

function syncColorPicker(pickerId, textId, settingKey) {
    const picker = document.getElementById(pickerId);
    const text = document.getElementById(textId);
    if (!picker || !text) return; 

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
    if (!slider || !numInput) return; 

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

syncColorPicker('bg-color-picker', 'bg-color-text', 'bgValue');
syncColorPicker('accent-color-picker', 'accent-color-text', 'accentColor');
syncColorPicker('search-color-picker', 'search-color-text', 'searchColor');
syncColorPicker('shortcut-color-picker', 'shortcut-color-text', 'shortcutColor');
syncColorPicker('scrollbar-color-picker', 'scrollbar-color-text', 'scrollbarColor');
syncColorPicker('clock-color-picker', 'clock-color-text', 'clockColor');

syncSlider('search-radius-slider', 'search-radius-num', 'searchRadius', 0, 40, 10);
syncSlider('search-opacity-slider', 'search-opacity-num', 'searchOpacity', 0, 100, 100);
syncSlider('search-height-slider', 'search-height-num', 'searchPadY', 8, 32, 14);
syncSlider('shortcut-radius-slider', 'shortcut-radius-num', 'shortcutRadius', 0, 30, 10);
syncSlider('shortcut-opacity-slider', 'shortcut-opacity-num', 'shortcutOpacity', 0, 100, 100);

const bindSetting = (id, key, isNumber = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', (e) => {
        let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        if (isNumber) val = parseInt(val, 10);
        saveAndApply({ [key]: val });
    });
};

bindSetting('global-font-select', 'globalFont');
bindSetting('show-search-toggle', 'showSearch');
bindSetting('show-search-border-toggle', 'showSearchBorder');
bindSetting('search-glass-toggle', 'searchGlass');
bindSetting('search-engine-select', 'searchEngine');
bindSetting('search-color-mode-select', 'searchMode');
bindSetting('shortcut-type-select', 'shortcutType');
bindSetting('shortcut-color-mode-select', 'shortcutMode');
bindSetting('show-shortcuts-toggle', 'showShortcuts');
bindSetting('shortcut-glass-toggle', 'shortcutGlass');
bindSetting('show-labels-toggle', 'showLabels');
bindSetting('max-shortcuts-select', 'maxShortcuts', true);
bindSetting('scrollbar-visibility-select', 'scrollbarVis');
bindSetting('scrollbar-color-mode-select', 'scrollbarMode');
bindSetting('show-lock-btn-toggle', 'showLockBtn');
bindSetting('show-shadows-toggle', 'showShadows');
bindSetting('show-clock-toggle', 'showClock');
bindSetting('time-format-select', 'timeFormat');
bindSetting('show-seconds-toggle', 'showSeconds');
bindSetting('show-date-toggle', 'showDate');
bindSetting('date-format-select', 'dateFormat');
bindSetting('date-position-select', 'datePosition');
bindSetting('clock-color-mode-select', 'clockColorMode');

document.getElementById('bg-image-btn')?.addEventListener('click', () => document.getElementById('bg-image-input').click());
document.getElementById('bg-image-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => saveAndApply({ bgType: 'image', bgValue: event.target.result });
        reader.readAsDataURL(file);
    }
});
document.getElementById('bg-reset-btn')?.addEventListener('click', () => saveAndApply({ bgType: 'color', bgValue: '#F0EEE9' }));

document.getElementById('lock-btn')?.addEventListener('click', () => {
    chrome.storage.local.get({ isLocked: false }, ({ isLocked }) => {
        const newLockState = !isLocked;
        saveAndApply({ isLocked: newLockState });
        if (newLockState) document.getElementById('side-panel').classList.remove('open');
    });
});

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