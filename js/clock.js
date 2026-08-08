let use24Hour = false;
let showSeconds = false;
let dateFormat = 'full';

let timeEl = null;
let dateEl = null;

let lastTimeStr = '';
let lastDateStr = '';
let lastDay = -1;
let timerId = null;

export function initClock() {
    timeEl = document.getElementById('time-display');
    dateEl = document.getElementById('date-display');
    runClock();
}

function runClock() {
    updateClock();
    
    const now = new Date();
    const msUntilNextSecond = 1000 - now.getMilliseconds();
    
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(runClock, msUntilNextSecond);
}

function updateClock() {
    if (!timeEl) return;
    
    const now = new Date();
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    let ampm = '';

    if (!use24Hour) {
        ampm = hours >= 12 ? ' PM' : ' AM';
        hours = hours % 12 || 12;
    }
    
    hours = use24Hour ? hours.toString().padStart(2, '0') : hours.toString();
    minutes = minutes.toString().padStart(2, '0');
    
    let timeString = `${hours}:${minutes}`;
    if (showSeconds) {
        timeString += `:${seconds.toString().padStart(2, '0')}`;
    }
    timeString += ampm;

    if (timeString !== lastTimeStr) {
        timeEl.textContent = timeString;
        lastTimeStr = timeString;
    }

    if (dateEl) {
        const currentDay = now.getDate();
        if (currentDay !== lastDay) {
            forceDateUpdate(now);
            lastDay = currentDay;
        }
    }
}

function forceDateUpdate(dateObj = new Date()) {
    if (!dateEl) return;
    let dateStr = '';

    switch (dateFormat) {
        case 'short':
            dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            break;
        case 'ddmm':
            dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            break;
        case 'mmdd':
            dateStr = dateObj.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
            break;
        default: 
            dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    if (dateStr !== lastDateStr) {
        dateEl.textContent = dateStr;
        lastDateStr = dateStr;
    }
}

export function setTimeFormat(format) {
    use24Hour = (format === '24hr');
    updateClock();
}

export function setSecondsVisible(visible) {
    showSeconds = visible;
    updateClock();
}

export function setDateFormat(format) {
    dateFormat = format;
    forceDateUpdate(); 
}