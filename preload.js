/**
 * Cleo Zero-FOUC Vanguard Engine
 */
(() => {
  try {
    const doc = document.documentElement;
    const getV = (k, d) => {
      try {
        const val = localStorage.getItem(k);
        return val !== null ? val : d;
      } catch (e) {
        return d;
      }
    };
    
    // --- Font Token ---
    const gFont = getV('globalFont', 'system-ui, -apple-system, sans-serif');
    doc.style.setProperty('--global-font', gFont);

    // --- Background & Core Variables ---
    const bT = getV('bgType', 'color');
    const bV = getV('bgValue', '#F0EEE9');
    const aC = getV('accentColor', '#8ab4f8');
    const srM = getV('searchMode', 'custom');
    const stM = getV('shortcutMode', 'custom');
    
    const isL = (h) => {
      if (!h || typeof h !== 'string' || !h.startsWith('#')) return false;
      let hex = h.slice(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length !== 6) return false;
      const x = parseInt(hex, 16);
      if (isNaN(x)) return false;
      return ((x >> 16 & 255) * 299 + (x >> 8 & 255) * 587 + (x & 255) * 114) / 1000 >= 128;
    };

    const bgL = bT === 'color' && isL(bV);
    const actSr = srM === 'accent' ? aC : (srM === 'custom' ? getV('searchColor', '#F6EBC8') : (bgL ? '#ffffff' : '#202124'));
    const actSt = stM === 'accent' ? aC : (stM === 'custom' ? getV('shortcutColor', '#D3E4F1') : (bgL ? '#ffffff' : '#303134'));
    const srL = isL(actSr);
    const stL = isL(actSt);

    doc.style.setProperty('--accent-color', aC);
    
    // --- Layout & Opacity Variables ---
    const gRadius = getV('globalRadius', '12'); 
    doc.style.setProperty('--search-radius', `${gRadius}px`);
    doc.style.setProperty('--shortcut-radius', `${gRadius}px`);
    doc.style.setProperty('--pomo-radius', `${gRadius}px`);

    const gOpacity = parseInt(getV('globalOpacity', '100'), 10); 
    doc.style.setProperty('--search-opacity', `${gOpacity}%`);
    doc.style.setProperty('--shortcut-opacity', `${gOpacity}%`);

    doc.style.setProperty('--search-bg', actSr);
    doc.style.setProperty('--search-text', srL ? '#000000' : '#ffffff');
    doc.style.setProperty('--shortcut-bg', actSt);
    doc.style.setProperty('--shortcut-text', stL ? '#000000' : '#ffffff');

    // --- Pomodoro Variables ---
    const pomoBgStr = getV('pomodoroBg', '#f0eee9');
    let pomoHex = pomoBgStr.replace('#', '');
    if (pomoHex.length === 3) pomoHex = pomoHex.split('').map(c => c + c).join('');
    const pR = parseInt(pomoHex.slice(0, 2), 16) || 240;
    const pG = parseInt(pomoHex.slice(2, 4), 16) || 238;
    const pB = parseInt(pomoHex.slice(4, 6), 16) || 233;
    
    const rgbaBg = `rgba(${pR}, ${pG}, ${pB}, ${gOpacity / 100})`;
    doc.style.setProperty('--pomo-bg-color', rgbaBg);
    
    let pomoTextBase = '#ffffff';
    if (gOpacity < 10) {
      pomoTextBase = bgL ? '#1c1917' : '#ffffff';
    } else {
      pomoTextBase = isL(pomoBgStr) ? '#1c1917' : '#ffffff';
    }
    
    doc.style.setProperty('--pomo-text-color', pomoTextBase);

    const pPos = getV('pomodoroPosition', 'top-left');
    doc.style.setProperty('--pomo-left', pPos === 'top-right' ? 'auto' : '25px');
    doc.style.setProperty('--pomo-right', pPos === 'top-right' ? '25px' : 'auto');

    if (bT === 'color') {
      doc.style.setProperty('--bg-color', bV);
      doc.style.setProperty('--bg-image', 'none');
    } else if (bT === 'image') {
      doc.style.setProperty('--bg-color', '#000000');
      doc.style.setProperty('--bg-image', `url("${bV}")`);
    }

    // --- Scrollbar States ---
    const scV = getV('scrollbarVis', 'always');
    const scM = getV('scrollbarMode', 'auto'); 
    
    if (scV === 'hover') doc.classList.add('hover-scrollbar');
    if (scM === 'accent') doc.classList.add('accent-scrollbar');
    if (scM === 'custom') {
      doc.classList.add('custom-scrollbar');
      doc.style.setProperty('--custom-sc-color', getV('scrollbarColor', '#8ab4f8'));
    }
    
    doc.classList.toggle('light-bg', bgL);
    doc.classList.toggle('dark-bg', !bgL); 

    // --- Layout Classes ---
    if (srL) doc.classList.add('dark-search-text');
    if (stL) doc.classList.add('dark-shortcut-text');
    if (getV('showShadows', 'true') === 'false') doc.classList.add('no-shadows');
    if (getV('showSearchBorder', 'true') === 'false') doc.classList.add('search-border-off'); 
    
    if (getV('globalGlass', 'true') === 'false') {
      doc.classList.add('search-glass-off', 'shortcut-glass-off');
    }
    
    if (getV('showClock', 'true') === 'false') doc.classList.add('clock-off');
    if (getV('showSearch', 'true') === 'false') doc.classList.add('search-off');
    if (getV('showShortcuts', 'true') === 'false') doc.classList.add('grid-off');
    if (getV('isLocked', 'false') === 'true') doc.classList.add('is-locked');
    if (getV('showPomodoro', 'true') === 'false') doc.classList.add('pomo-off');

    // --- Dynamic Base Stylesheet ---
    const s = document.createElement('style');
    s.textContent = `
      body {
        background-color: var(--bg-color) !important;
        background-image: var(--bg-image, none) !important;
        background-size: cover !important;
        background-position: center !important;
        font-family: var(--global-font, system-ui, -apple-system, sans-serif) !important;
      }
      body.pomo-off #pomodoro-widget,
      html.pomo-off #pomodoro-widget {
        display: none !important;
      }
    `;
    (document.head || doc).appendChild(s);

    const applyToBody = () => {
      if (!document.body) return;
      document.body.className = doc.className;
    };

    if (document.body) {
      applyToBody();
    } else {
      const observer = new MutationObserver(() => {
        if (document.body) {
          applyToBody();
          observer.disconnect();
        }
      });
      observer.observe(doc, { childList: true });
    }
    
  } catch (e) {
    console.error('Cleo: Preload initialization error', e);
  }
})();