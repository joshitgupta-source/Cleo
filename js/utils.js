export function getTextColorForBackground(hexColor) {
    const cleanHex = hexColor.replace('#', '');
    if (cleanHex.length !== 6) return 'light-text'; 
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return (((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128) ? 'dark-text' : 'light-text';
}