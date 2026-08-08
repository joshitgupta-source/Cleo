// Freeze default settings to prevent accidental runtime mutations
export const defaultSettings = Object.freeze({
    shortcuts: [], showShortcuts: true, showLabels: true, shortcutType: 'custom', maxShortcuts: 50,
    accentColor: '#8ab4f8', bgType: 'color', bgValue: '#000000', 
    showSearch: true, showSearchBorder: true, searchEngine: 'https://www.google.com/search?q=', 
    searchMode: 'auto', searchColor: '#202124', searchRadius: '24', searchOpacity: '100', searchGlass: true,
    shortcutMode: 'auto', shortcutColor: '#303134', shortcutRadius: '12', shortcutOpacity: '80', shortcutGlass: true,
    showClock: true, showDate: true, timeFormat: '12hr', showSeconds: false, dateFormat: 'full', datePosition: 'below', 
    clockColorMode: 'monochrome', clockColor: '#ffffff',
    showShadows: true, globalFont: 'system-ui, -apple-system, sans-serif',
    scrollbarVis: 'always', scrollbarMode: 'auto', scrollbarColor: '#8ab4f8',
    showLockBtn: true, isLocked: false
});

/**
 * Safely mirror primitive values to localStorage for instant preloading (preload.js)
 */
function syncToLocalStorage(key, value) {
    if (value === undefined || value === null || typeof value === 'object') return;
    try {
        localStorage.setItem(key, String(value));
    } catch (e) {
        // Silently ignore localStorage quota limits (e.g. large base64 strings)
    }
}

/**
 * Gets settings from chrome.storage.local with defaults fallback.
 * Supports both Promises (async/await) and traditional callbacks.
 */
export async function getSettings(callback) {
    try {
        const result = await chrome.storage.local.get(defaultSettings);
        if (typeof callback === 'function') callback(result);
        return result;
    } catch (err) {
        console.error('Cleo: Error reading storage:', err);
        if (typeof callback === 'function') callback(defaultSettings);
        return { ...defaultSettings };
    }
}

/**
 * Updates chrome.storage.local and synchronizes fast theme variables to localStorage.
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
        console.error('Cleo: Error updating storage:', err);
        if (typeof callback === 'function') callback();
    }
}

/**
 * Exports chrome.storage.local to a downloadable JSON file.
 */
export async function exportSettings() {
    try {
        const items = await chrome.storage.local.get(null);
        const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `cleo_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        // Delay object URL cleanup slightly so Chromium finishes triggering the download
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
        console.error('Cleo: Export failed:', err);
    }
}

/**
 * Imports, sanitizes, and applies settings from a backup JSON file.
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
                throw new Error('Invalid JSON format');
            }

            const validKeys = new Set(Object.keys(defaultSettings));
            const sanitizedData = {};

            // Only permit known default keys to avoid cluttering extension storage
            for (const [key, value] of Object.entries(parsedData)) {
                if (validKeys.has(key) && value !== undefined) {
                    sanitizedData[key] = value;
                    syncToLocalStorage(key, value);
                }
            }

            await chrome.storage.local.set(sanitizedData);
            if (typeof callback === 'function') callback(true);
        } catch (err) {
            console.error('Cleo: Import failed:', err);
            if (typeof callback === 'function') callback(false);
        }
    };

    reader.onerror = () => {
        if (typeof callback === 'function') callback(false);
    };

    reader.readAsText(file);
}