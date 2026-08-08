export function getTextColorForBackground(hexColor) {
    const cleanHex = hexColor.replace('#', '');
    if (cleanHex.length !== 6) return 'light-text'; 
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return (((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128) ? 'dark-text' : 'light-text';
}

export function getDynamicColorForBackground(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; 
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    let newH = (h + 180) % 360;
    let newL = l > 50 ? 15 : 85; 
    let newS = s === 0 ? 0 : 80;

    return `hsl(${newH}, ${newS}%, ${newL}%)`;
}

export function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16)
    };
}

export function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

export function blendColors(fgHex, bgHex, opacityPercent) {
    const fg = hexToRgb(fgHex);
    const bg = hexToRgb(bgHex);
    const alpha = opacityPercent / 100;

    const r = Math.round(fg.r * alpha + bg.r * (1 - alpha));
    const g = Math.round(fg.g * alpha + bg.g * (1 - alpha));
    const b = Math.round(fg.b * alpha + bg.b * (1 - alpha));

    return rgbToHex(r, g, b);
}

// --- NEW CENTRALIZED COLOR INJECTION ---
export function applyThemeColors(result) {
    const root = document.documentElement;
    const body = document.body;

    // 1. Accent Color
    root.style.setProperty('--accent-color', result.accentColor);

    // Global background context
    const globalBgHex = (result.bgType === 'color') ? result.bgValue : '#000000';
    const isBgLight = result.bgType === 'color' && getTextColorForBackground(result.bgValue) === 'dark-text';

    // 2. Search Bar Colors
    let searchBg = '#202124';
    if (result.searchMode === 'accent') searchBg = result.accentColor;
    else if (result.searchMode === 'custom') searchBg = result.searchColor;
    else if (isBgLight) searchBg = '#ffffff';

    const searchOpac = result.searchOpacity !== undefined ? parseInt(result.searchOpacity, 10) : 100;
    const searchEffectiveBg = blendColors(searchBg, globalBgHex, searchOpac);
    
    const searchIsDark = getTextColorForBackground(searchEffectiveBg) === 'dark-text';
    const searchDropdownIsDark = getTextColorForBackground(searchBg) === 'dark-text';

    root.style.setProperty('--search-bg', searchBg);
    root.style.setProperty('--search-text', searchIsDark ? '#000000' : '#ffffff');
    root.style.setProperty('--search-dropdown-text', searchDropdownIsDark ? '#000000' : '#ffffff');
    body.classList.toggle('dark-search-text', searchIsDark);

    // 3. Web Shortcut Colors
    let shortcutBg = '#303134';
    if (result.shortcutMode === 'accent') shortcutBg = result.accentColor;
    else if (result.shortcutMode === 'custom') shortcutBg = result.shortcutColor;
    else if (isBgLight) shortcutBg = '#ffffff';

    const shortcutOpac = result.shortcutOpacity !== undefined ? parseInt(result.shortcutOpacity, 10) : 80;
    const shortcutEffectiveBg = blendColors(shortcutBg, globalBgHex, shortcutOpac);
    const shortcutIsDark = getTextColorForBackground(shortcutEffectiveBg) === 'dark-text';

    root.style.setProperty('--shortcut-bg', shortcutBg);
    root.style.setProperty('--shortcut-text', shortcutIsDark ? '#000000' : '#ffffff');
    body.classList.toggle('dark-shortcut-text', shortcutIsDark);

    // 4. Clock & Date Colors
    let clockColor = '#ffffff';
    let dateColor = '#e8eaed'; 
    const clockMode = result.clockColorMode || 'monochrome';

    if (clockMode === 'monochrome') {
        clockColor = isBgLight ? '#000000' : '#ffffff';
        dateColor = isBgLight ? '#202124' : '#e8eaed';
    } else if (clockMode === 'dynamic' && result.bgType === 'color') {
        const dynamicColor = getDynamicColorForBackground(result.bgValue);
        clockColor = dynamicColor;
        dateColor = dynamicColor;
    } else if (clockMode === 'custom') {
        clockColor = result.clockColor || '#ffffff';
        dateColor = result.clockColor || '#ffffff';
    } else {
        clockColor = isBgLight ? '#000000' : '#ffffff';
        dateColor = isBgLight ? '#202124' : '#e8eaed';
    }

    root.style.setProperty('--clock-color', clockColor);
    root.style.setProperty('--date-color', dateColor);

    // 5. Scrollbar Custom Color
    if (result.scrollbarMode === 'custom') {
        root.style.setProperty('--custom-sc-color', result.scrollbarColor);
    } else {
        root.style.removeProperty('--custom-sc-color');
    }
}