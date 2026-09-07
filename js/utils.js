export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 0, g: 0, b: 0 };
  let h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  
  const num = parseInt(h, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v) || 0));
  return '#' + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1);
}

export function getTextColorForBackground(hexColor) {
  if (!hexColor || typeof hexColor !== 'string') return 'light-text';
  let h = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  if (h.length !== 6 && h.length !== 3) return 'light-text';

  const rgb = hexToRgb(h);
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

export function blendColors(fgHex, bgHex, opacityPercent) {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const alpha = Math.max(0, Math.min(100, opacityPercent || 0)) / 100;

  const r = (fg.r * alpha) + (bg.r * (1 - alpha));
  const g = (fg.g * alpha) + (bg.g * (1 - alpha));
  const b = (fg.b * alpha) + (bg.b * (1 - alpha));

  return rgbToHex(r, g, b);
}

export function applyThemeColors(result) {
  const root = document.documentElement;
  const body = document.body;

  const setClass = (cls, cond) => {
    root.classList.toggle(cls, cond);
    if (body) body.classList.toggle(cls, cond);
  };

  root.style.setProperty('--accent-color', result.accentColor || '#8ab4f8');

  const globalBgHex = (result.bgType === 'color' && result.bgValue) ? result.bgValue : '#000000';
  const isBgLight = result.bgType === 'color' && getTextColorForBackground(globalBgHex) === 'dark-text';

  let searchBg = '#202124';
  if (result.searchMode === 'accent') {
    searchBg = result.accentColor || '#8ab4f8';
  } else if (result.searchMode === 'custom') {
    searchBg = result.searchColor || '#202124';
  } else if (isBgLight) {
    searchBg = '#ffffff';
  }

  const globalOpac = result.globalOpacity !== undefined ? parseInt(result.globalOpacity, 10) : 100;
  const searchOpac = result.searchOpacity !== undefined ? parseInt(result.searchOpacity, 10) : globalOpac;
  const searchEffectiveBg = blendColors(searchBg, globalBgHex, searchOpac);
  
  const searchIsDark = getTextColorForBackground(searchEffectiveBg) === 'dark-text';
  const searchDropdownIsDark = searchIsDark;

  root.style.setProperty('--search-bg', searchBg);
  root.style.setProperty('--search-text', searchIsDark ? '#000000' : '#ffffff');
  root.style.setProperty('--search-dropdown-text', searchDropdownIsDark ? '#000000' : '#ffffff');
  root.style.setProperty('--search-dropdown-border', searchDropdownIsDark ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)');
  setClass('dark-search-text', searchIsDark);
  setClass('dark-search-dropdown-text', searchDropdownIsDark);

  let shortcutBg = '#303134';
  if (result.shortcutMode === 'accent') {
    shortcutBg = result.accentColor || '#8ab4f8';
  } else if (result.shortcutMode === 'custom') {
    shortcutBg = result.shortcutColor || '#303134';
  } else if (isBgLight) {
    shortcutBg = '#ffffff';
  }

  const shortcutOpac = result.shortcutOpacity !== undefined ? parseInt(result.shortcutOpacity, 10) : (globalOpac * 0.8);
  const shortcutEffectiveBg = blendColors(shortcutBg, globalBgHex, shortcutOpac);
  const shortcutIsDark = getTextColorForBackground(shortcutEffectiveBg) === 'dark-text';

  root.style.setProperty('--shortcut-bg', shortcutBg);
  root.style.setProperty('--shortcut-text', shortcutIsDark ? '#000000' : '#ffffff');
  setClass('dark-shortcut-text', shortcutIsDark);

  let clockColor = '#ffffff';
  let dateColor = '#e8eaed'; 
  const clockMode = result.clockColorMode || 'dynamic';

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

  if (result.scrollbarMode === 'custom') {
    root.style.setProperty('--custom-sc-color', result.scrollbarColor || '#8ab4f8');
  } else {
    root.style.removeProperty('--custom-sc-color');
  }
}