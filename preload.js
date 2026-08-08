try {
    const doc = document.documentElement;
    
    // Optimization: Cached getter to minimize localStorage latency
    const getV = (k, d) => localStorage.getItem(k) || d;
    
    // 1. Batch Read Critical Layout Variables
    const bT = getV('bgType', 'color');
    const bV = getV('bgValue', '#000000');
    const aC = getV('accentColor', '#8ab4f8');
    const srM = getV('searchMode', 'auto');
    const stM = getV('shortcutMode', 'auto');
    
    // 2. Ultra-Fast Bitwise Lightness Calculator (Assumes standard #RRGGBB)
    const isL = (h) => {
        if (!h || h[0] !== '#' || h.length !== 7) return false;
        const x = parseInt(h.slice(1), 16);
        return ((x >> 16 & 255) * 299 + (x >> 8 & 255) * 587 + (x & 255) * 114) / 1000 >= 128;
    };

    const bgL = bT === 'color' && isL(bV);

    // 3. Pre-calculate Conditional Colors
    const actSr = srM === 'accent' ? aC : (srM === 'custom' ? getV('searchColor', '#202124') : (bgL ? '#ffffff' : '#202124'));
    const actSt = stM === 'accent' ? aC : (stM === 'custom' ? getV('shortcutColor', '#303134') : (bgL ? '#ffffff' : '#303134'));
    const srL = isL(actSr);
    const stL = isL(actSt);

    // 4. Batch CSS Variable Injections (Minimizes DOM recalculations)
    doc.style.setProperty('--accent-color', aC);
    doc.style.setProperty('--search-radius', getV('searchRadius', '24') + 'px');
    doc.style.setProperty('--search-bg', actSr);
    doc.style.setProperty('--search-text', srL ? '#000000' : '#ffffff');
    doc.style.setProperty('--shortcut-bg', actSt);
    doc.style.setProperty('--shortcut-text', stL ? '#000000' : '#ffffff');

    // 5. Instantly Apply HTML-Level Classes
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

    // 6. Inject Critical Background Style Tag (Hardware forced to prevent white flashes)
    const s = document.createElement('style');
    if (bT === 'color') {
        s.textContent = `body{background-color:${bV}!important;background-image:none!important;transition:none!important;}`;
    } else if (bT === 'image') {
        s.textContent = `body{background-color:#000!important;background-image:url("${bV}")!important;background-size:cover!important;background-position:center!important;transition:none!important;}`;
    }
    doc.appendChild(s);

    // 7. Defer Body-Level Classes until the DOM tree actually exists
    document.addEventListener('DOMContentLoaded', () => {
        const cls = document.body.classList; // Cache object for faster reads
        
        if (srL) cls.add('dark-search-text');
        if (stL) cls.add('dark-shortcut-text');
        if (getV('showShadows', 'true') === 'false') cls.add('no-shadows');
        if (getV('showSearchBorder', 'true') === 'false') cls.add('search-border-off');
        if (getV('searchGlass', 'true') === 'false') cls.add('search-glass-off');
        if (getV('shortcutGlass', 'true') === 'false') cls.add('shortcut-glass-off');
    });
    
} catch(e) {
    console.error('Cleo: Preload failed to execute', e);
}