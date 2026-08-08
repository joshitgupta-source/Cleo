export const defaultSettings = Object.freeze({
    shortcuts: [], showShortcuts: true, showLabels: true, shortcutType: 'topSites', maxShortcuts: 50,
    accentColor: '#8ab4f8', bgType: 'color', bgValue: '#F0EEE9', 
    showSearch: true, showSearchBorder: true, searchEngine: 'https://www.google.com/search?q=', 
    searchMode: 'custom', searchColor: '#F6EBC8', searchRadius: '10', searchOpacity: '100', searchGlass: true, searchPadY: '14',
    shortcutMode: 'custom', shortcutColor: '#D3E4F1', shortcutRadius: '10', shortcutOpacity: '100', shortcutGlass: true,
    showClock: true, showDate: true, timeFormat: '12hr', showSeconds: false, dateFormat: 'full', datePosition: 'below', 
    clockColorMode: 'dynamic', clockColor: '#ffffff',
    showShadows: true, globalFont: 'system-ui, -apple-system, sans-serif',
    scrollbarVis: 'always', scrollbarMode: 'auto', scrollbarColor: '#8ab4f8',
    showLockBtn: true, isLocked: false
});

function syncToLocalStorage(key, value) {
    if (value === undefined || value === null || typeof value === 'object') return;
    try {
        localStorage.setItem(key, String(value));
    } catch (e) {}
}

export async function getSettings(callback) {
    try {
        const result = await chrome.storage.local.get(defaultSettings);
        if (typeof callback === 'function') callback(result);
        return result;
    } catch (err) {
        if (typeof callback === 'function') callback(defaultSettings);
        return { ...defaultSettings };
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
        if (typeof callback === 'function') callback();
    }
}

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
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {}
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
                throw new Error();
            }

            const validKeys = new Set(Object.keys(defaultSettings));
            const sanitizedData = {};

            for (const [key, value] of Object.entries(parsedData)) {
                if (validKeys.has(key) && value !== undefined) {
                    sanitizedData[key] = value;
                    syncToLocalStorage(key, value);
                }
            }

            await chrome.storage.local.set(sanitizedData);
            if (typeof callback === 'function') callback(true);
        } catch (err) {
            if (typeof callback === 'function') callback(false);
        }
    };

    reader.onerror = () => {
        if (typeof callback === 'function') callback(false);
    };

    reader.readAsText(file);
}