let use24Hour = false;
let showSeconds = false;
let dateFormat = 'full';

let timeEl = null;
let dateEl = null;

let lastTimeStr = '';
let lastDateStr = '';
let lastDay = -1;
let timerId = null;

/**
 * Initializes clock DOM references and starts the tick loop.
 */
export function initClock() {
  timeEl = document.getElementById('time-display');
  dateEl = document.getElementById('date-display');
  
  if (!timeEl && !dateEl) return;
  
  // Initial immediate draw
  updateClock();
  scheduleNextTick();
}

/**
 * Stops the ticking loop to save CPU when the widget is hidden.
 */
export function stopClock() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

/**
 * Schedules the next tick aligned precisely to the start of the next second.
 */
function scheduleNextTick() {
  stopClock();
  
  const now = new Date();
  // +10ms offset protects against early timer firing
  const msUntilNextSecond = 1000 - now.getMilliseconds() + 10;
  
  timerId = setTimeout(() => {
    updateClock();
    scheduleNextTick();
  }, msUntilNextSecond);
}

/**
 * Formats time string and updates DOM only on string change.
 */
function updateClock() {
  if (!timeEl) return;
  
  const now = new Date();
  
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  let ampm = '';

  if (!use24Hour) {
    ampm = hours >= 12 ? ' PM' : ' AM';
    hours = hours % 12 || 12;
  }
  
  const formattedHours = use24Hour ? hours.toString().padStart(2, '0') : hours.toString();
  
  let timeString = `${formattedHours}:${minutes}`;
  if (showSeconds) {
    timeString += `:${seconds}`;
  }
  timeString += ampm;

  if (timeString !== lastTimeStr) {
    timeEl.textContent = timeString;
    lastTimeStr = timeString;
  }

  // Update date only when day changes
  if (dateEl) {
    const currentDay = now.getDate();
    if (currentDay !== lastDay) {
      forceDateUpdate(now);
      lastDay = currentDay;
    }
  }
}

/**
 * Formats date string according to active layout format.
 */
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

/**
 * Format Handlers called by theme.js / state.js
 */
export function setTimeFormat(format) {
  use24Hour = (format === '24hr');
  updateClock();
}

export function setSecondsVisible(visible) {
  showSeconds = Boolean(visible);
  updateClock();
}

export function setDateFormat(format) {
  dateFormat = format;
  forceDateUpdate(); 
}