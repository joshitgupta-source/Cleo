export function getTextColorForBackground(hexColor) {
    const cleanHex = hexColor.replace('#', '');
    if (cleanHex.length !== 6) return 'light-text'; 
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return (((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128) ? 'dark-text' : 'light-text';
}

export function getDynamicColorForBackground(hex) {
    // 1. Convert Hex to RGB
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    // 2. Find Min/Max to calculate HSL
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // Grayscale background
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

    // Convert to degrees and percentages
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    // 3. The Dynamic Engine Logic
    // Shift Hue 180 degrees across the color wheel for maximum visual interest
    let newH = (h + 180) % 360;
    
    // Flip the Lightness to the opposite extreme to guarantee high contrast readability
    let newL = l > 50 ? 15 : 85; 
    
    // Set a pleasant, vivid saturation (80%) unless the background is completely gray
    let newS = s === 0 ? 0 : 80;

    return `hsl(${newH}, ${newS}%, ${newL}%)`;
}