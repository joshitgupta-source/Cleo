/**
 * Master immutable baseline settings schema.
 */
export const defaultSettings = Object.freeze({
  shortcuts: Object.freeze([]),
  hiddenTopSites: Object.freeze([]),
  pinnedSites: Object.freeze([]),
  showShortcuts: true,
  showLabels: true,
  shortcutType: 'topSites',
  maxShortcuts: 50,
  
  accentColor: '#8ab4f8',
  bgType: 'color',
  bgValue: '#F0EEE9', 
  
  globalRadius: 12,
  globalOpacity: 100,
  globalGlass: true,
  globalFont: 'system-ui, -apple-system, sans-serif',
  showShadows: true,
  
  showSearch: true,
  showSearchBorder: true,
  searchEngine: 'https://www.google.com/search?q=', 
  searchMode: 'custom',
  searchColor: '#F6EBC8',
  
  shortcutMode: 'custom',
  shortcutColor: '#D3E4F1',
  
  showClock: true,
  showDate: true,
  timeFormat: '12hr',
  showSeconds: false,
  dateFormat: 'full',
  datePosition: 'below', 
  clockColorMode: 'dynamic',
  clockColor: '#ffffff',
  
  scrollbarVis: 'always',
  scrollbarMode: 'auto',
  scrollbarColor: '#8ab4f8',
  showLockBtn: true,
  isLocked: false,
  
  showPomodoro: true,
  pomodoroPosition: 'top-left',
  pomodoroColorMode: 'accent',
  pomodoroTextMode: 'monochrome',
  pomodoroBg: '#f0eee9',
  pomodoroBorder: true,
  focusTime: 25,
  breakTime: 5
});

function syncToLocalStorage(key, value) {
  if (value === undefined || value === null) return;
  try {
    localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  } catch (e) {
    console.warn(`Cleo: localStorage quota exceeded for key "${key}". Value remains saved in chrome.storage.local.`);
  }
}

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

export function exportSettings() {
  return new Promise(async (resolve) => {
    try {
      const items = await chrome.storage.local.get(null);
      const jsonString = JSON.stringify(items, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
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
      console.error('Cleo: Failed to export settings backup.', err);
      resolve(false);
    }
  });
}

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

      const freshState = JSON.parse(JSON.stringify(defaultSettings));
      const validKeys = new Set(Object.keys(defaultSettings));

      for (const [key, value] of Object.entries(parsedData)) {
        if (validKeys.has(key) && value !== undefined) {
          freshState[key] = value;
        }
      }

      localStorage.clear();
      await chrome.storage.local.clear();

      for (const [key, value] of Object.entries(freshState)) {
        syncToLocalStorage(key, value);
      }

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

  reader.readAsText(file, 'utf-8');
}