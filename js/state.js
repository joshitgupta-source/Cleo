/**
 * Master immutable baseline settings schema.
 */
export const defaultSettings = Object.freeze({
  // Core Layout & Shortcuts
  shortcuts: Object.freeze([]),
  hiddenTopSites: Object.freeze([]),
  pinnedSites: Object.freeze([]),
  showShortcuts: true,
  showLabels: true,
  shortcutType: 'topSites',
  maxShortcuts: 50,
  
  // Global Colors & Backgrounds
  accentColor: '#8ab4f8',
  bgType: 'color',
  bgValue: '#F0EEE9', 
  
  // Global UI Master Controls
  globalRadius: 12,
  globalOpacity: 100,
  globalGlass: true,
  globalFont: 'system-ui, -apple-system, sans-serif',
  showShadows: true,
  
  // Search
  showSearch: true,
  showSearchBorder: true,
  searchEngine: 'https://www.google.com/search?q=', 
  searchMode: 'custom',
  searchColor: '#F6EBC8',
  
  // Shortcuts Style
  shortcutMode: 'custom',
  shortcutColor: '#D3E4F1',
  
  // Clock
  showClock: true,
  showDate: true,
  timeFormat: '12hr',
  showSeconds: false,
  dateFormat: 'full',
  datePosition: 'below', 
  clockColorMode: 'dynamic',
  clockColor: '#ffffff',
  
  // Misc UI
  scrollbarVis: 'always',
  scrollbarMode: 'auto',
  scrollbarColor: '#8ab4f8',
  showLockBtn: true,
  isLocked: false,
  
  // Pomodoro Timer
  showPomodoro: true,
  pomodoroPosition: 'top-left',
  pomodoroColorMode: 'custom',
  pomodoroTextMode: 'monochrome',
  pomodoroBg: '#f0eee9',
  pomodoroBorder: true,
  focusTime: 25,
  breakTime: 5
});

/**
 * Mirror critical keys to localStorage for preload.js zero-FOUC access.
 */
function syncToLocalStorage(key, value) {
  if (value === undefined || value === null) return;
  try {
    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  } catch (e) {
    console.warn('Cleo: localStorage sync quota exceeded or disabled.', e);
  }
}

/**
 * Retrieves current settings with guaranteed fallbacks to defaultSettings.
 */
export async function getSettings(callback) {
  try {
    const result = await chrome.storage.local.get(defaultSettings);
    if (typeof callback === 'function') callback(result);
    return result;
  } catch (err) {
    const fallback = JSON.parse(JSON.stringify(defaultSettings));
    if (typeof callback === 'function') callback(fallback);
    return fallback;
  }
}

/**
 * Updates chrome.storage.local and mirrors values into localStorage.
 */
export async function updateStorage(updates, callback) {
  if (!updates || typeof updates !== 'object') return;

  const cleanUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      cleanUpdates[key] = value;
      syncToLocalStorage(key, value);
    }
  }

  try {
    await chrome.storage.local.set(cleanUpdates);
    if (typeof callback === 'function') callback();
  } catch (err) {
    console.error('Cleo: Error saving to chrome.storage.local', err);
    if (typeof callback === 'function') callback();
  }
}

/**
 * Exports full extension configuration as a downloadable JSON file.
 */
export function exportSettings() {
  return new Promise(async (resolve) => {
    try {
      const items = await chrome.storage.local.get(null);
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const d = new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2); 
      const filename = `Cleo_Backup_${day}-${month}-${year}.json`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      resolve(true);
    } catch (err) {
      resolve(false);
    }
  });
}

/**
 * Imports settings with clean-slate wiping to eliminate legacy ghost keys.
 */
export function importSettings(file, callback) {
  if (!file) {
    if (typeof callback === 'function') callback(false);
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsedData = JSON.parse(e.target.result);
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid JSON structure');
      }

      // 1. Start from a fresh deep clone of baseline defaults
      const freshState = JSON.parse(JSON.stringify(defaultSettings));
      const validKeys = new Set(Object.keys(defaultSettings));

      // 2. Overlay only recognized keys from the imported backup
      for (const [key, value] of Object.entries(parsedData)) {
        if (validKeys.has(key) && value !== undefined) {
          freshState[key] = value;
        }
      }

      // 3. Clean-slate wipe both storage layers
      localStorage.clear();
      await chrome.storage.local.clear();

      // 4. Mirror all validated keys back to localStorage
      for (const [key, value] of Object.entries(freshState)) {
        syncToLocalStorage(key, value);
      }

      // 5. Commit clean baseline to chrome.storage.local
      await chrome.storage.local.set(freshState);
      
      if (typeof callback === 'function') callback(true);
    } catch (err) {
      console.error('Cleo: Failed to import backup file.', err);
      if (typeof callback === 'function') callback(false);
    }
  };

  reader.onerror = () => {
    if (typeof callback === 'function') callback(false);
  };

  reader.readAsText(file);
}