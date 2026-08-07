export const defaultSettings = {
    shortcuts: [], showShortcuts: true, showLabels: true, shortcutType: 'custom', maxShortcuts: 50,
    accentColor: '#8ab4f8', bgType: 'color', bgValue: '#000000', 
    showSearch: true, showSearchBorder: true, searchEngine: 'https://www.google.com/search?q=', 
    searchMode: 'auto', searchColor: '#202124', searchRadius: '24', searchOpacity: '100',
    shortcutMode: 'auto', shortcutColor: '#303134', shortcutRadius: '12', shortcutOpacity: '80',
    showClock: true, showDate: true, timeFormat: '12hr', datePosition: 'below', 
    clockColorMode: 'monochrome', clockColor: '#ffffff',
    showShadows: true, globalFont: 'system-ui, -apple-system, sans-serif',
    scrollbarVis: 'always', scrollbarMode: 'auto', scrollbarColor: '#8ab4f8',
    showLockBtn: true, isLocked: false
};

export function getSettings(callback) {
    chrome.storage.local.get(defaultSettings, callback);
}

export function updateStorage(updates, callback) {
    try {
        Object.keys(updates).forEach(key => {
            if (updates[key] !== undefined) localStorage.setItem(key, updates[key]);
        });
    } catch(e) {}
    chrome.storage.local.set(updates, callback);
}

export function exportSettings() {
    chrome.storage.local.get(null, (items) => {
        const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cleo_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

export function importSettings(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsedData = JSON.parse(e.target.result);
            Object.keys(parsedData).forEach(key => {
                if (parsedData[key] !== undefined && typeof parsedData[key] !== 'object') {
                    localStorage.setItem(key, parsedData[key]);
                }
            });
            chrome.storage.local.set(parsedData, () => callback(true));
        } catch (err) {
            callback(false);
        }
    };
    reader.readAsText(file);
}