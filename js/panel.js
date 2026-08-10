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

document.getElementById('lock-btn')?.addEventListener('click', () => {
    chrome.storage.local.get({ isLocked: false }, ({ isLocked }) => {
        const newLockState = !isLocked;
        saveAndApply({ isLocked: newLockState });
        if (newLockState) document.getElementById('side-panel').classList.remove('open');
    });
});

document.getElementById('export-btn')?.addEventListener('click', async () => {
    const success = await exportSettings();
    if (success && window.showToast) {
        window.showToast('Backup downloaded successfully');
    }
});

document.getElementById('import-btn')?.addEventListener('click', () => document.getElementById('import-input').click());
document.getElementById('import-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        importSettings(file, (success) => {
            if (success) {
                if (window.showToast) window.showToast('Settings restored');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                if (window.showToast) window.showToast('Error: Invalid backup file');
            }
        });
    }
    e.target.value = '';
});

document.getElementById('reset-all-btn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings and shortcuts to default? This cannot be undone.')) {
        chrome.storage.local.clear(() => {
            localStorage.clear();
            if (window.showToast) window.showToast('All settings reset to default');
            setTimeout(() => window.location.reload(), 1000);
        });
    }
});

document.getElementById('restore-hidden-btn')?.addEventListener('click', () => {
    saveAndApply({ hiddenTopSites: [] });
    if (window.showToast) window.showToast('Hidden sites restored');
});

const themePresets = {
    default: {
        bgType: 'color', bgValue: '#F0EEE9', accentColor: '#8ab4f8', 
        searchMode: 'custom', searchColor: '#F6EBC8', 
        shortcutMode: 'custom', shortcutColor: '#8ab4f8', 
        scrollbarMode: 'custom', scrollbarColor: '#8ab4f8', 
        clockColorMode: 'dynamic', clockColor: '#ffffff'
    },
    slate: { 
        bgType: 'color', bgValue: '#0F172A', accentColor: '#8AB4F8', 
        searchMode: 'custom', searchColor: '#1E293B', 
        shortcutMode: 'custom', shortcutColor: '#8AB4F8', 
        scrollbarMode: 'custom', scrollbarColor: '#8AB4F8', 
        clockColorMode: 'custom', clockColor: '#F8FAFC' 
    },
    obsidian: { 
        bgType: 'color', bgValue: '#1C1917', accentColor: '#D97706', 
        searchMode: 'custom', searchColor: '#292524', 
        shortcutMode: 'custom', shortcutColor: '#D97706', 
        scrollbarMode: 'custom', scrollbarColor: '#D97706', 
        clockColorMode: 'custom', clockColor: '#F6EBC8' 
    },
    oled: { 
        bgType: 'color', bgValue: '#000000', accentColor: '#C58AF9', 
        searchMode: 'custom', searchColor: '#121212', 
        shortcutMode: 'custom', shortcutColor: '#C58AF9', 
        scrollbarMode: 'custom', scrollbarColor: '#C58AF9', 
        clockColorMode: 'custom', clockColor: '#E8EAED' 
    }
};

document.querySelectorAll('.theme-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const themeKey = btn.dataset.theme;
        if (themePresets[themeKey]) {
            saveAndApply(themePresets[themeKey]);
            if (window.showToast) {
                const themeName = btn.querySelector('span:last-child').textContent;
                window.showToast(`${themeName} applied`);
            }
        }
    });
});