/* =========================================
   HIGH-PERFORMANCE COLOR MATH ENGINE
   Using bitwise operations (>>) instead of slow string parsing
   ========================================= */

export function hexToRgb(hex) {
    let h = hex.startsWith('#') ? hex.slice(1) : hex;
    // Handle 3-digit shorthand hex (#FFF)
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    
    // Parse once as a base-16 integer, then use bitwise shifts for insane speed
    const num = parseInt(h, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

export function getTextColorForBackground(hexColor) {
    if (!hexColor || typeof hexColor !== 'string') return 'light-text';
    let h = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
    if (h.length !== 6 && h.length !== 3) return 'light-text';

    const rgb = hexToRgb(h);
    // Standard YIQ equation for calculating color contrast
    const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
    return yiq >= 128 ? 'dark-text' : 'light-text';
}

export function getDynamicColorForBackground(hex) {
    const rgb = hexToRgb(hex);
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    let l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    const newH = Math.round(((h * 360) + 180) % 360);
    const newS = s === 0 ? 0 : 80;
    const newL = Math.round(l * 100) > 50 ? 15 : 85; 

    return `hsl(${newH}, ${newS}%, ${newL}%)`;
}

export function rgbToHex(r, g, b) {
    // Bitwise shift reverse-conversion
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

export function blendColors(fgHex, bgHex, opacityPercent) {
    const fg = hexToRgb(fgHex);
    const bg = hexToRgb(bgHex);
    const alpha = opacityPercent / 100;

    const r = Math.round((fg.r * alpha) + (bg.r * (1 - alpha)));
    const g = Math.round((fg.g * alpha) + (bg.g * (1 - alpha)));
    const b = Math.round((fg.b * alpha) + (bg.b * (1 - alpha)));

    return rgbToHex(r, g, b);
}

/* =========================================
   CENTRALIZED COLOR INJECTION (BUG FIXED)
   ========================================= */

export function applyThemeColors(result) {
    const root = document.documentElement;
    const body = document.body;

    // 1. Accent Color
    root.style.setProperty('--accent-color', result.accentColor || '#4285f4');

    // =========================================
    // THE FIX: Actually apply the background to the DOM
    // =========================================
    if (result.bgType === 'color') {
        body.style.backgroundImage = 'none';
        body.style.backgroundColor = result.bgValue || '#000000';
    } else if (result.bgType === 'image' && result.bgValue) {
        body.style.backgroundImage = `url("${result.bgValue}")`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundColor = '#000000'; // Fallback
    }

    // Global background context for math
    const globalBgHex = (result.bgType === 'color' && result.bgValue) ? result.bgValue : '#000000';
    const isBgLight = result.bgType === 'color' && getTextColorForBackground(globalBgHex) === 'dark-text';

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
        const dynamicColor = getDynamicColorForBackground(globalBgHex);
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
        root.style.setProperty('--custom-sc-color', result.scrollbarColor || '#5f6368');
    } else {
        root.style.removeProperty('--custom-sc-color');
    }
}