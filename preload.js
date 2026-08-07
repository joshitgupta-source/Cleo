try {
    const getV = (k, d) => localStorage.getItem(k) || d;
    const aC = getV('accentColor', '#8ab4f8');
    const bT = getV('bgType', 'color');
    const bV = getV('bgValue', '#000000');
    
    const scV = getV('scrollbarVis', 'always');
    const scM = getV('scrollbarMode', 'auto');
    const scC = getV('scrollbarColor', '#8ab4f8');
    
    const srM = getV('searchMode', 'auto');
    const srC = getV('searchColor', '#202124');
    const srR = getV('searchRadius', '24');
    
    const stM = getV('shortcutMode', 'auto');
    const stC = getV('shortcutColor', '#303134');
    
    const isL = (h) => {
        if(!h || h[0]!=='#' || h.length!==7) return false;
        const x = parseInt(h.slice(1), 16);
        return ((x >> 16 & 255)*299 + (x >> 8 & 255)*587 + (x & 255)*114)/1000 >= 128;
    };

    const doc = document.documentElement;
    doc.style.setProperty('--accent-color', aC);
    doc.style.setProperty('--search-radius', srR + 'px');

    let bgL = false;
    if (bT === 'color') {
        bgL = isL(bV);
        doc.classList.toggle('light-bg', bgL);
        const s = document.createElement('style');
        s.textContent = `body{background-color:${bV}!important;background-image:none!important}`;
        doc.appendChild(s);
    } else if (bT === 'image') {
        const s = document.createElement('style');
        s.textContent = `body{background-color:#000!important;background-image:url(${bV})!important}`;
        doc.appendChild(s);
    }

    const actSr = srM === 'accent' ? aC : (srM === 'custom' ? srC : (bT === 'color' && bgL ? '#ffffff' : '#202124'));
    const srL = isL(actSr);
    doc.style.setProperty('--search-bg', actSr);
    doc.style.setProperty('--search-text', srL ? '#000000' : '#ffffff');

    const actSt = stM === 'accent' ? aC : (stM === 'custom' ? stC : (bT === 'color' && bgL ? '#ffffff' : '#303134'));
    const stL = isL(actSt);
    doc.style.setProperty('--shortcut-bg', actSt);
    doc.style.setProperty('--shortcut-text', stL ? '#000000' : '#ffffff');

    if (scV === 'hover') doc.classList.add('hover-scrollbar');
    if (scM === 'accent') doc.classList.add('accent-scrollbar');
    if (scM === 'custom') {
        doc.classList.add('custom-scrollbar');
        doc.style.setProperty('--custom-sc-color', scC);
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (srL) document.body.classList.add('dark-search-text');
        if (stL) document.body.classList.add('dark-shortcut-text');
        if (getV('showShadows', 'true') === 'false') document.body.classList.add('no-shadows');
        if (getV('showSearchBorder', 'true') === 'false') document.body.classList.add('search-border-off');
    });
} catch(e) {}