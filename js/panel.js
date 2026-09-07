import { saveAndApply, getAverageColor } from './theme.js';
import { exportSettings, importSettings, getSettings } from './state.js';
import { syncWithBackground } from './pomodoro.js';

const getEl = (id) => document.getElementById(id);

let saveRaf;
const throttledSave = (payload) => {
  if (saveRaf) cancelAnimationFrame(saveRaf);
  saveRaf = requestAnimationFrame(() => saveAndApply(payload));
};

function syncColorPicker(pickerId, textId, settingKey) {
  const picker = getEl(pickerId);
  const text = getEl(textId);
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
    if (val && !val.startsWith('#')) val = '#' + val;
    
    if (/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(val)) {
      if (val.length === 4) {
        val = '#' + val[1] + val[1] + val[2] + val[2] + val[3] + val[3];
      }
      picker.value = val.toLowerCase();
      updateColor(val.toUpperCase());
    }
  });
}

function syncSlider(sliderId, numId, settingKey, min, max, defaultVal) {
  const slider = getEl(sliderId);
  const numInput = getEl(numId);
  if (!slider || !numInput) return; 

  const applyValue = (val, clampToMin = true) => {
    let num = parseInt(val, 10);
    if (isNaN(num)) return;
    
    if (clampToMin && num < min) num = min;
    if (num > max) num = max;
    
    slider.value = num;
    numInput.value = num;
    throttledSave({ [settingKey]: num });

    if (settingKey === 'focusTime' || settingKey === 'breakTime') {
      chrome.storage.local.get(['pomodoro'], (res) => {
        const state = res.pomodoro || { isRunning: false, mode: 'focus' };
        if (!state.isRunning) {
          if ((settingKey === 'focusTime' && state.mode !== 'break') ||
              (settingKey === 'breakTime' && state.mode === 'break')) {
            chrome.storage.local.set({
              pomodoro: { ...state, timeLeft: num * 60 * 1000, endTime: null }
            }, syncWithBackground);
          }
        }
      });
    }
  };

  slider.addEventListener('input', (e) => applyValue(e.target.value, true));
  
  numInput.addEventListener('input', (e) => {
    const cleanVal = e.target.value.replace(/[^0-9]/g, '');
    e.target.value = cleanVal;
    if (cleanVal !== '') {
      applyValue(cleanVal, false);
    }
  });
  
  numInput.addEventListener('blur', (e) => {
    if (e.target.value === '' || parseInt(e.target.value, 10) < min) {
      applyValue(e.target.value === '' ? defaultVal : min, true);
    }
  });
}

syncColorPicker('bg-color-picker', 'bg-color-text', 'bgValue');
syncColorPicker('accent-color-picker', 'accent-color-text', 'accentColor');
syncColorPicker('search-color-picker', 'search-color-text', 'searchColor');
syncColorPicker('shortcut-color-picker', 'shortcut-color-text', 'shortcutColor');
syncColorPicker('scrollbar-color-picker', 'scrollbar-color-text', 'scrollbarColor');
syncColorPicker('clock-color-picker', 'clock-color-text', 'clockColor');
syncColorPicker('pomodoro-bg-picker', 'pomodoro-bg-text', 'pomodoroBg');

syncSlider('global-radius-slider', 'global-radius-num', 'globalRadius', 0, 50, 12);
syncSlider('global-opacity-slider', 'global-opacity-num', 'globalOpacity', 0, 100, 100);

syncSlider('pomodoro-focus-slider', 'pomodoro-focus-num', 'focusTime', 25, 120, 25);
syncSlider('pomodoro-break-slider', 'pomodoro-break-num', 'breakTime', 5, 30, 5);

const settingsMap = [
  ['global-font-select', 'globalFont', false],
  ['global-glass-toggle', 'globalGlass', false],
  ['show-search-toggle', 'showSearch', false],
  ['show-search-border-toggle', 'showSearchBorder', false],
  ['search-engine-select', 'searchEngine', false],
  ['search-color-mode-select', 'searchMode', false],
  ['shortcut-type-select', 'shortcutType', false],
  ['shortcut-align-select', 'shortcutAlign', false],
  ['shortcut-color-mode-select', 'shortcutMode', false],
  ['show-shortcuts-toggle', 'showShortcuts', false],
  ['show-labels-toggle', 'showLabels', false],
  ['max-shortcuts-select', 'maxShortcuts', true],
  ['scrollbar-visibility-select', 'scrollbarVis', false],
  ['scrollbar-color-mode-select', 'scrollbarMode', false],
  ['show-lock-btn-toggle', 'showLockBtn', false],
  ['show-shadows-toggle', 'showShadows', false],
  ['show-clock-toggle', 'showClock', false],
  ['time-format-select', 'timeFormat', false],
  ['show-seconds-toggle', 'showSeconds', false],
  ['show-date-toggle', 'showDate', false],
  ['date-format-select', 'dateFormat', false],
  ['date-position-select', 'datePosition', false],
  ['clock-color-mode-select', 'clockColorMode', false],
  
  ['show-pomodoro-toggle', 'showPomodoro', false],
  ['pomodoro-position-select', 'pomodoroPosition', false],
  ['pomodoro-color-mode-select', 'pomodoroColorMode', false],
  ['pomodoro-border-toggle', 'pomodoroBorder', false]
];

settingsMap.forEach(([id, key, isNumber]) => {
  const el = getEl(id);
  if (!el) return;
  el.addEventListener('change', (e) => {
    let val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (isNumber) val = parseInt(val, 10);
    saveAndApply({ [key]: val });
  });
});

async function transcodeSpecialFormats(file) {
  const fileName = (file.name || '').toLowerCase();
  const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';
  const isTiff = fileName.endsWith('.tif') || fileName.endsWith('.tiff') || file.type === 'image/tiff';

  if (isHeic) {
    if (window.showToast) window.showToast('Converting HEIC image...');
    const buffer = await file.arrayBuffer();

    return new Promise((resolve, reject) => {
      const worker = new Worker('js/heic.worker.js');
      worker.onmessage = (e) => {
        worker.terminate();
        if (e.data.success) {
          resolve(e.data.blob);
        } else {
          reject(new Error(e.data.error || 'HEIC decoding failed'));
        }
      };
      worker.onerror = (err) => {
        worker.terminate();
        reject(err);
      };
      worker.postMessage(buffer, [buffer]);
    });
  }

  if (isTiff) {
    if (window.showToast) window.showToast('Converting TIFF image...');
    const utifLib = window.UTIF || (typeof UTIF !== 'undefined' ? UTIF : null);
    if (!utifLib) throw new Error('UTIF library not found in libs/UTIF.js');

    const buffer = await file.arrayBuffer();
    const ifds = utifLib.decode(buffer);
    utifLib.decodeImage(buffer, ifds[0]);
    const rgba = utifLib.toRGBA8(ifds[0]);

    const canvas = document.createElement('canvas');
    canvas.width = ifds[0].width;
    canvas.height = ifds[0].height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    imgData.data.set(rgba);
    ctx.putImageData(imgData, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  }

  return file;
}

getEl('bg-image-btn')?.addEventListener('click', () => getEl('bg-image-input')?.click());

getEl('bg-image-input')?.addEventListener('change', async (e) => {
  let file = e.target.files?.[0];
  if (!file) return;

  const originalName = file.name || '';
  const isSupported = (file.type && file.type.startsWith('image/')) || 
                      /\.(png|jpe?g|webp|avif|svg|bmp|ico|heic|heif|tif|tiff)$/i.test(originalName);

  if (!isSupported) {
    if (window.showToast) window.showToast('Invalid file type');
    e.target.value = '';
    return;
  }

  let processedBlob;
  try {
    processedBlob = await transcodeSpecialFormats(file);
  } catch (err) {
    console.error('Cleo Transcoding Error:', err);
    if (window.showToast) window.showToast('Failed to process image');
    e.target.value = '';
    return;
  }

  const isSvg = file.type === 'image/svg+xml' || originalName.toLowerCase().endsWith('.svg');
  const objectUrl = URL.createObjectURL(processedBlob);
  const img = new Image();

  try {
    img.src = objectUrl;
    await img.decode();

    if (isSvg) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const extractedColor = getAverageColor(img);
        saveAndApply({
          bgType: 'image',
          bgValue: evt.target.result,
          accentColor: extractedColor
        });
        URL.revokeObjectURL(objectUrl);
        if (window.showToast) window.showToast('Theme adapted to image!');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
      return;
    }

    const MAX_WIDTH = 3840;
    const MAX_HEIGHT = 2160;
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    let targetMime = processedBlob.type || 'image/jpeg';
    let quality = 0.88;

    if (targetMime === 'image/png') {
      quality = undefined;
    } else if (targetMime !== 'image/jpeg' && targetMime !== 'image/webp' && targetMime !== 'image/avif') {
      targetMime = 'image/jpeg';
    }

    let compressedBase64;
    try {
      compressedBase64 = canvas.toDataURL(targetMime, quality);
    } catch {
      compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
    }

    if (compressedBase64.length > 4 * 1024 * 1024) {
      try {
        const webp = canvas.toDataURL('image/webp', 0.90);
        if (webp.startsWith('data:image/webp')) {
          compressedBase64 = webp;
        } else {
          compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
        }
      } catch {
        compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
      }
    }

    const extractedColor = getAverageColor(img);

    saveAndApply({ 
      bgType: 'image', 
      bgValue: compressedBase64, 
      accentColor: extractedColor 
    });
    
    URL.revokeObjectURL(objectUrl);
    if (window.showToast) window.showToast('Theme adapted to image!');
  } catch (renderErr) {
    console.error('Cleo Render Error:', renderErr);
    URL.revokeObjectURL(objectUrl);
    if (window.showToast) window.showToast('Failed to decode image');
  }

  e.target.value = '';
});

getEl('lock-btn')?.addEventListener('click', async () => {
  const settings = await getSettings();
  const newLockState = !settings.isLocked;
  
  saveAndApply({ isLocked: newLockState });
  if (newLockState) getEl('side-panel')?.classList.remove('open');
  if (window.showToast) window.showToast(newLockState ? 'Layout locked' : 'Layout unlocked');
});

getEl('export-btn')?.addEventListener('click', () => {
  exportSettings();
});

getEl('import-btn')?.addEventListener('click', () => getEl('import-input')?.click());

getEl('import-input')?.addEventListener('change', (e) => {
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

getEl('reset-all-btn')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all settings and shortcuts to default? This cannot be undone.')) {
    chrome.storage.local.clear(() => {
      localStorage.clear();
      if (window.showToast) window.showToast('All settings reset to default');
      setTimeout(() => window.location.reload(), 1000);
    });
  }
});

getEl('restore-hidden-btn')?.addEventListener('click', () => {
  saveAndApply({ hiddenTopSites: [] });
  if (window.showToast) window.showToast('Hidden sites restored');
});

const themePresets = {
  default: {
    bgType: 'color', bgValue: '#F0EEE9', accentColor: '#8ab4f8', 
    searchMode: 'custom', searchColor: '#F6EBC8', 
    shortcutMode: 'custom', shortcutColor: '#8ab4f8', 
    scrollbarMode: 'auto', scrollbarColor: '#8ab4f8', 
    clockColorMode: 'dynamic', clockColor: '#ffffff',
    globalRadius: 12, globalOpacity: 100, globalGlass: true,
    showSearchBorder: true
  },
  slate: { 
    bgType: 'color', bgValue: '#0F172A', accentColor: '#8AB4F8', 
    searchMode: 'custom', searchColor: '#1E293B', 
    shortcutMode: 'custom', shortcutColor: '#8AB4F8', 
    scrollbarMode: 'custom', scrollbarColor: '#8AB4F8', 
    clockColorMode: 'custom', clockColor: '#F8FAFC',
    globalRadius: 12, globalOpacity: 70, globalGlass: true
  },
  obsidian: { 
    bgType: 'color', bgValue: '#1C1917', accentColor: '#D97706', 
    searchMode: 'custom', searchColor: '#292524', 
    shortcutMode: 'custom', shortcutColor: '#D97706', 
    scrollbarMode: 'custom', scrollbarColor: '#D97706', 
    clockColorMode: 'custom', clockColor: '#F6EBC8',
    globalRadius: 8, globalOpacity: 90, globalGlass: false
  },
  oled: { 
    bgType: 'color', bgValue: '#000000', accentColor: '#C58AF9', 
    searchMode: 'custom', searchColor: '#121212', 
    shortcutMode: 'custom', shortcutColor: '#C58AF9', 
    scrollbarMode: 'custom', scrollbarColor: '#C58AF9', 
    clockColorMode: 'custom', clockColor: '#E8EAED',
    globalRadius: 24, globalOpacity: 100, globalGlass: false
  }
};

document.querySelectorAll('.theme-preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const themeKey = btn.dataset.theme;
    if (themePresets[themeKey]) {
      saveAndApply(themePresets[themeKey]);
      if (window.showToast) {
        const themeName = btn.querySelector('span:last-child')?.textContent || 'Preset';
        window.showToast(`${themeName} applied`);
      }
    }
  });
});