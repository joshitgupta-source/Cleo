import { getSettings } from './state.js';

let widget = null;
let timeDisplay = null;
let playIcon = null;
let pauseIcon = null;

let timerInterval = null;
let timeLeft = 25 * 60 * 1000;
let targetEndTime = null;
let isRunning = false;
let currentMode = 'focus';

let isHolding = false;
let holdTimeout = null;

function getContrastColor(hexColor) {
  if (!hexColor) return '#ffffff';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16) || 0;
  const g = parseInt(hex.slice(2, 4), 16) || 0;
  const b = parseInt(hex.slice(4, 6), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1c1917' : '#ffffff';
}

function updateDisplay(ms) {
  if (!timeDisplay) return;
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateUIState() {
  if (playIcon) playIcon.style.display = isRunning ? 'none' : 'block';
  if (pauseIcon) pauseIcon.style.display = isRunning ? 'block' : 'none';
}

function stopLocalTick() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startLocalTick() {
  stopLocalTick();
  
  const tick = () => {
    if (targetEndTime) {
      timeLeft = targetEndTime - Date.now();
    } else {
      timeLeft -= 1000;
    }

    if (timeLeft <= 0) {
      stopLocalTick();
      timeLeft = 0;
      isRunning = false;
      targetEndTime = null;
      updateUIState();
    }
    updateDisplay(timeLeft);
  };

  tick();
  timerInterval = setInterval(tick, 1000);
}

export function syncWithBackground() {
  chrome.storage.local.get(['pomodoro', 'focusTime', 'breakTime'], (res) => {
    const customFocus = res.focusTime || 25;
    const customBreak = res.breakTime || 5;
    const state = res.pomodoro || { isRunning: false, endTime: null, timeLeft: customFocus * 60 * 1000, mode: 'focus' };
    
    isRunning = Boolean(state.isRunning);
    currentMode = state.mode || 'focus';
    
    if (isRunning && state.endTime) {
      targetEndTime = state.endTime;
      timeLeft = state.endTime - Date.now();
      
      if (timeLeft <= 0) {
        isRunning = false;
        timeLeft = 0;
        targetEndTime = null;
        stopLocalTick();
      } else {
        startLocalTick();
      }
    } else {
      targetEndTime = null;
      timeLeft = state.timeLeft !== undefined ? state.timeLeft : (currentMode === 'focus' ? customFocus : customBreak) * 60 * 1000;
      stopLocalTick();
    }

    updateDisplay(timeLeft);
    updateUIState();
  });
}

const adjustTime = (minutes, callback = null) => {
  chrome.storage.local.get(['pomodoro', 'focusTime', 'breakTime'], (res) => {
    const state = res.pomodoro || { isRunning: false, mode: 'focus', timeLeft: (res.focusTime || 25) * 60 * 1000 };
    let currentMs = state.isRunning && state.endTime ? Math.max(0, state.endTime - Date.now()) : (state.timeLeft || 0);
    
    const currentMinutesFloat = currentMs / 60000;
    
    if (minutes > 0) {
      currentMs = (Math.floor(currentMinutesFloat) + minutes) * 60000;
    } else {
      currentMs = (Math.ceil(currentMinutesFloat) + minutes) * 60000;
    }
    
    const mode = state.mode || 'focus';
    const minLimitMs = (mode === 'focus' ? 25 : 5) * 60 * 1000;
    const maxLimitMs = (mode === 'focus' ? 120 : 30) * 60 * 1000;

    if (currentMs < minLimitMs) currentMs = minLimitMs;
    if (currentMs > maxLimitMs) currentMs = maxLimitMs;
    
    const done = () => {
      syncWithBackground();
      if (callback) callback();
    };

    if (state.isRunning) {
      chrome.runtime.sendMessage({ action: 'startTimer', timeLeft: currentMs }, () => {
        if (chrome.runtime.lastError) { /* ignore */ }
        done();
      });
    } else {
      chrome.storage.local.set({ pomodoro: { ...state, timeLeft: currentMs, endTime: null } }, done);
    }
  });
};

const startHold = (e, minutes) => {
  if (e) {
    e.stopPropagation();
    if (e.cancelable && e.type === 'touchstart') e.preventDefault();
  }
  
  if (isHolding) return; 
  isHolding = true;
  
  let initialHold = true;

  const execute = () => {
    if (!isHolding) return;
    adjustTime(minutes, () => {
      if (!isHolding) return;
      const delay = initialHold ? 400 : 100;
      initialHold = false;
      holdTimeout = setTimeout(execute, delay);
    });
  };

  execute();
};

const stopHold = (e) => {
  if (e && e.stopPropagation) e.stopPropagation();
  isHolding = false;
  if (holdTimeout) clearTimeout(holdTimeout);
};

export function applyPomodoroTheme(settings = {}) {
  if (!widget) return;

  if (settings.showPomodoro === false) {
    widget.style.display = 'none';
    document.body.classList.add('pomo-off');
    document.documentElement.classList.add('pomo-off');
  } else {
    widget.style.display = 'flex';
    document.body.classList.remove('pomo-off');
    document.documentElement.classList.remove('pomo-off');
  }
  
  const isRight = settings.pomodoroPosition === 'top-right';
  document.documentElement.style.setProperty('--pomo-left', isRight ? 'auto' : '25px');
  document.documentElement.style.setProperty('--pomo-right', isRight ? '25px' : 'auto');
  
  const gRadius = settings.globalRadius !== undefined ? settings.globalRadius : 16;
  document.documentElement.style.setProperty('--pomo-radius', `${gRadius}px`);

  widget.classList.toggle('pos-top-right', isRight);
  widget.classList.toggle('pos-top-left', !isRight);
  widget.classList.toggle('has-border', Boolean(settings.pomodoroBorder));

  const bgMode = settings.pomodoroColorMode || 'accent';
  let baseBg = settings.accentColor || '#8ab4f8';

  if (bgMode === 'accent') {
    baseBg = settings.accentColor || '#8ab4f8';
  } else if (bgMode === 'monochrome') {
    const dashboardBg = settings.bgValue || '#000000';
    baseBg = getContrastColor(dashboardBg);
  } else if (bgMode === 'custom') {
    baseBg = settings.pomodoroBg || '#8ab4f8';
  }

  const op = settings.globalOpacity !== undefined ? settings.globalOpacity : 100;
  document.documentElement.style.setProperty('--pomo-opacity', `${op}%`);

  const autoText = getContrastColor(baseBg);

  const bgPickerWrapper = document.getElementById('pomodoro-bg-picker-wrapper');
  if (bgPickerWrapper) bgPickerWrapper.style.display = (bgMode === 'custom') ? 'flex' : 'none';

  let hex = baseBg.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  
  const r = parseInt(hex.slice(0, 2), 16) || 138;
  const g = parseInt(hex.slice(2, 4), 16) || 180;
  const b = parseInt(hex.slice(4, 6), 16) || 248;
  
  const rgbaBg = `rgba(${r}, ${g}, ${b}, ${op / 100})`;

  document.documentElement.style.setProperty('--pomo-bg-color', rgbaBg);
  document.documentElement.style.setProperty('--pomo-text-color', autoText);
  document.documentElement.style.setProperty('--glass-pomodoro', settings.globalGlass !== false ? 'blur(12px)' : 'none');
  
  widget.style.backgroundColor = rgbaBg;
  widget.style.color = autoText;
}

function fetchAndApplyTheme() {
  getSettings((data) => {
    if (data) applyPomodoroTheme(data);
  });
}

export function initPomodoro() {
  widget = document.getElementById('pomodoro-widget');
  timeDisplay = document.getElementById('pomodoro-time');
  playIcon = document.getElementById('pomodoro-icon-play');
  pauseIcon = document.getElementById('pomodoro-icon-pause');
  
  const toggleBtn = document.getElementById('pomodoro-toggle-btn');
  const plusBtn = document.getElementById('pomo-plus-btn');
  const minusBtn = document.getElementById('pomo-minus-btn');
  const restartBtn = document.getElementById('pomo-restart-btn');
  const skipBtn = document.getElementById('pomo-skip-btn');
  const customizeBtn = document.getElementById('customize-btn');
  const closePanelBtn = document.getElementById('close-panel-btn');

  if (!widget || !timeDisplay) return;

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.storage.local.get(['pomodoro', 'focusTime'], (res) => {
        const state = res.pomodoro || { isRunning: false, endTime: null, timeLeft: (res.focusTime || 25) * 60 * 1000 };
        if (state.isRunning) {
          const remain = state.endTime ? Math.max(0, state.endTime - Date.now()) : state.timeLeft;
          chrome.runtime.sendMessage({ action: 'pauseTimer', timeLeft: remain }, syncWithBackground);
        } else {
          chrome.runtime.sendMessage({ action: 'startTimer', timeLeft: state.timeLeft }, syncWithBackground);
        }
      });
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ action: 'skipTimer' }, syncWithBackground);
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.storage.local.get(['pomodoro', 'focusTime', 'breakTime'], (res) => {
        const state = res.pomodoro || { mode: 'focus', isRunning: false };
        const ms = (state.mode === 'break' ? (res.breakTime || 5) : (res.focusTime || 25)) * 60 * 1000;
        
        if (state.isRunning) {
          chrome.runtime.sendMessage({ action: 'startTimer', timeLeft: ms }, syncWithBackground);
        } else {
          chrome.storage.local.set({ pomodoro: { ...state, timeLeft: ms, endTime: null } }, syncWithBackground);
        }
      });
    });
  }

  if (plusBtn) {
    ['mousedown', 'touchstart'].forEach(evt => plusBtn.addEventListener(evt, (e) => startHold(e, 1), { passive: false }));
  }

  if (minusBtn) {
    ['mousedown', 'touchstart'].forEach(evt => minusBtn.addEventListener(evt, (e) => startHold(e, -1), { passive: false }));
  }

  window.addEventListener('mouseup', stopHold);
  window.addEventListener('touchend', stopHold);
  window.addEventListener('touchcancel', stopHold);

  if (chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'timerComplete') syncWithBackground();
    });
  }

  if (customizeBtn) {
    customizeBtn.addEventListener('click', () => widget?.classList.add('panel-open-shift'));
  }

  if (closePanelBtn) {
    closePanelBtn.addEventListener('click', () => widget?.classList.remove('panel-open-shift'));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') widget?.classList.remove('panel-open-shift');
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.accentColor || changes.bgValue || changes.bgType || changes.globalOpacity || changes.globalGlass || changes.globalRadius || changes.pomodoroBg || changes.pomodoroPosition || changes.pomodoroColorMode || changes.pomodoroBorder || changes.showPomodoro) {
      fetchAndApplyTheme();
    }
  });

  syncWithBackground();
  fetchAndApplyTheme();
}