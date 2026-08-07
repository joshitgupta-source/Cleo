let currentTimeFormat = '12hr'; 
let lastTimeStr = '';
let lastDateStr = '';

const timeDisplay = document.getElementById('time-display');
const dateDisplay = document.getElementById('date-display');

export function updateClockTime() {
    const now = new Date();
    const t = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: currentTimeFormat === '12hr' });
    const d = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    
    if (t !== lastTimeStr) timeDisplay.textContent = lastTimeStr = t;
    if (d !== lastDateStr) dateDisplay.textContent = lastDateStr = d;
}

export function setTimeFormat(format) {
    currentTimeFormat = format;
    updateClockTime();
}

export function initClock() {
    setInterval(updateClockTime, 1000);
    updateClockTime();
}