import { getSettings, updateStorage } from './state.js';

export function initPomodoro() {
    const widget = document.getElementById('pomodoro-widget');
    const timeDisplay = document.getElementById('pomodoro-time');
    const playIcon = document.getElementById('pomodoro-icon-play');
    const pauseIcon = document.getElementById('pomodoro-icon-pause');
    const toggleBtn = document.getElementById('pomodoro-toggle-btn');
    const bgPickerWrapper = document.getElementById('pomodoro-bg-picker-wrapper');
    const textPickerWrapper = document.getElementById('pomodoro-text-picker-wrapper');
    const customizeBtn = document.getElementById('customize-btn');
    const closePanelBtn = document.getElementById('close-panel-btn');

    if (!widget || !timeDisplay) return;

    let timerInterval;
    let timeLeft = 25 * 60 * 1000;
    let isRunning = false;

    function getContrastColor(hexColor) {
        if (!hexColor) return '#ffffff';
        let hex = hexColor.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    }

    function getComplementaryColor(hexColor) {
        if (!hexColor) return '#ffffff';
        let hex = hexColor.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16).padStart(2, '0');
        const g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16).padStart(2, '0');
        const b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    function updateDisplay(ms) {
        const totalSeconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function updateUIState() {
        if (playIcon) playIcon.style.display = isRunning ? 'none' : 'block';
        if (pauseIcon) pauseIcon.style.display = isRunning ? 'block' : 'none';
    }

    function syncWithBackground() {
        chrome.storage.local.get(['pomodoro'], (res) => {
            const state = res.pomodoro || { isRunning: false, endTime: null, timeLeft: 25 * 60 * 1000 };
            isRunning = state.isRunning;
            
            if (isRunning && state.endTime) {
                timeLeft = state.endTime - Date.now();
                if (timeLeft <= 0) {
                    isRunning = false;
                    timeLeft = 25 * 60 * 1000;
                    chrome.storage.local.set({ pomodoro: { isRunning: false, endTime: null, timeLeft }});
                } else {
                    startLocalTick();
                }
            } else {
                timeLeft = state.timeLeft || 25 * 60 * 1000;
                stopLocalTick();
            }
            updateDisplay(timeLeft);
            updateUIState();
        });
    }

    function startLocalTick() {
        stopLocalTick();
        timerInterval = setInterval(() => {
            timeLeft -= 1000;
            if (timeLeft <= 0) {
                stopLocalTick();
                timeLeft = 25 * 60 * 1000;
                isRunning = false;
                updateUIState();
            }
            updateDisplay(Math.max(0, timeLeft));
        }, 1000);
    }

    function stopLocalTick() {
        clearInterval(timerInterval);
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isRunning) {
                isRunning = false;
                stopLocalTick();
                updateUIState();
                chrome.runtime.sendMessage({ action: 'pauseTimer', timeLeft });
            } else {
                isRunning = true;
                startLocalTick();
                updateUIState();
                chrome.runtime.sendMessage({ action: 'startTimer', timeLeft });
            }
        });
    }

    if (widget) {
        widget.addEventListener('click', (e) => {
            if (e.target.closest('#pomodoro-toggle-btn')) return;
            toggleBtn.click();
        });
    }

    if (chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((msg) => {
            if (msg.action === 'timerComplete') syncWithBackground();
        });
    }

    if (customizeBtn) {
        customizeBtn.addEventListener('click', () => {
            if (widget) widget.classList.add('panel-open-shift');
        });
    }

    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', () => {
            if (widget) widget.classList.remove('panel-open-shift');
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (widget) widget.classList.remove('panel-open-shift');
        }
    });

    syncWithBackground();

    function applyPomodoroTheme(settings) {
        if (!widget) return;

        widget.style.display = settings.showPomodoro === false ? 'none' : 'flex';
        
        document.documentElement.style.setProperty('--pomo-left', settings.pomodoroPosition === 'top-right' ? 'auto' : '25px');
        document.documentElement.style.setProperty('--pomo-right', settings.pomodoroPosition === 'top-right' ? '25px' : 'auto');
        document.documentElement.style.setProperty('--pomo-radius', `${settings.pomodoroRadius !== undefined ? settings.pomodoroRadius : 12}px`);

        const isShifted = widget.classList.contains('panel-open-shift');
        widget.className = settings.pomodoroPosition === 'top-right' ? 'pos-top-right' : 'pos-top-left';
        if (isShifted) widget.classList.add('panel-open-shift');
        
        if (settings.pomodoroBorder) {
            widget.classList.add('has-border');
        } else {
            widget.classList.remove('has-border');
        }

        const bgMode = settings.pomodoroColorMode || 'custom';
        const textMode = settings.pomodoroTextMode || 'monochrome';
        
        let baseBg = '#f0eee9';
        if (bgMode === 'accent') {
            baseBg = settings.accentColor || '#8ab4f8';
        } else if (bgMode === 'monochrome') {
            const dashboardBg = settings.bgColor || '#000000';
            baseBg = getContrastColor(dashboardBg);
        } else {
            baseBg = settings.pomodoroBg || '#f0eee9';
        }

        let baseText = '#1c1917';
        if (textMode === 'monochrome') {
            baseText = getContrastColor(baseBg);
        } else if (textMode === 'dynamic') {
            baseText = getComplementaryColor(baseBg);
        } else {
            baseText = settings.pomodoroText || '#1c1917';
        }

        if (bgPickerWrapper) {
            bgPickerWrapper.style.display = (bgMode === 'custom') ? '' : 'none';
        }
        if (textPickerWrapper) {
            textPickerWrapper.style.display = (textMode === 'custom') ? '' : 'none';
        }

        const op = settings.pomodoroOpacity !== undefined ? settings.pomodoroOpacity : 100;
        let hex = baseBg.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.slice(0, 2), 16) || 240;
        const g = parseInt(hex.slice(2, 4), 16) || 238;
        const b = parseInt(hex.slice(4, 6), 16) || 233;
        
        widget.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${op / 100})`;
        widget.style.color = baseText;
        widget.style.backdropFilter = settings.pomodoroGlass !== false ? 'blur(12px)' : 'none';

        syncFormInputs(settings);
    }

    function syncFormInputs(s) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el && el.value !== String(val)) el.value = val;
        };
        const setCheck = (id, checked) => {
            const el = document.getElementById(id);
            if (el) el.checked = Boolean(checked);
        };

        setCheck('show-pomodoro-toggle', s.showPomodoro !== false);
        setVal('pomodoro-position-select', s.pomodoroPosition || 'top-left');
        setVal('pomodoro-color-mode-select', s.pomodoroColorMode || 'custom');
        setVal('pomodoro-text-mode-select', s.pomodoroTextMode || 'monochrome');
        setVal('pomodoro-bg-picker', s.pomodoroBg || '#f0eee9');
        setVal('pomodoro-bg-text', s.pomodoroBg || '#f0eee9');
        setVal('pomodoro-text-picker', s.pomodoroText || '#1c1917');
        setVal('pomodoro-text-text', s.pomodoroText || '#1c1917');
        setVal('pomodoro-opacity-slider', s.pomodoroOpacity !== undefined ? s.pomodoroOpacity : 100);
        setVal('pomodoro-opacity-num', s.pomodoroOpacity !== undefined ? s.pomodoroOpacity : 100);
        setCheck('pomodoro-glass-toggle', s.pomodoroGlass !== false);
        setCheck('pomodoro-border-toggle', s.pomodoroBorder);
        setVal('pomodoro-radius-slider', s.pomodoroRadius !== undefined ? s.pomodoroRadius : 12);
        setVal('pomodoro-radius-num', s.pomodoroRadius !== undefined ? s.pomodoroRadius : 12);
    }

    function setupSyncPair(pickerId, textId, key) {
        const picker = document.getElementById(pickerId);
        const text = document.getElementById(textId);

        if (picker) {
            ['input', 'change'].forEach(evt => {
                picker.addEventListener(evt, (e) => {
                    if (text) text.value = e.target.value;
                    updateStorage({ [key]: e.target.value }, () => getSettings().then(applyPomodoroTheme));
                });
            });
        }

        if (text) {
            ['input', 'change'].forEach(evt => {
                text.addEventListener(evt, (e) => {
                    let val = e.target.value.trim();
                    if (/^#[0-9A-F]{6}$/i.test(val)) {
                        if (picker) picker.value = val;
                        updateStorage({ [key]: val }, () => getSettings().then(applyPomodoroTheme));
                    }
                });
            });
        }
    }

    function setupSliderPair(sliderId, numId, key) {
        const slider = document.getElementById(sliderId);
        const num = document.getElementById(numId);

        const update = (val) => {
            const parsed = parseInt(val, 10);
            if (isNaN(parsed)) return;
            if (slider) slider.value = parsed;
            if (num) num.value = parsed;
            updateStorage({ [key]: parsed }, () => getSettings().then(applyPomodoroTheme));
        };

        if (slider) {
            ['input', 'change'].forEach(evt => {
                slider.addEventListener(evt, (e) => update(e.target.value));
            });
        }
        if (num) {
            ['input', 'change'].forEach(evt => {
                num.addEventListener(evt, (e) => update(e.target.value));
            });
        }
    }

    function setupToggle(id, key) {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', (e) => {
            updateStorage({ [key]: e.target.checked }, () => getSettings().then(applyPomodoroTheme));
        });
    }

    function setupSelect(id, key) {
        const el = document.getElementById(id);
        if (!el) return;
        ['input', 'change'].forEach(evt => {
            el.addEventListener(evt, (e) => {
                updateStorage({ [key]: e.target.value }, () => getSettings().then(applyPomodoroTheme));
            });
        });
    }

    setupToggle('show-pomodoro-toggle', 'showPomodoro');
    setupSelect('pomodoro-position-select', 'pomodoroPosition');
    setupSelect('pomodoro-color-mode-select', 'pomodoroColorMode');
    setupSelect('pomodoro-text-mode-select', 'pomodoroTextMode');
    setupSyncPair('pomodoro-bg-picker', 'pomodoro-bg-text', 'pomodoroBg');
    setupSyncPair('pomodoro-text-picker', 'pomodoro-text-text', 'pomodoroText');
    setupSliderPair('pomodoro-opacity-slider', 'pomodoro-opacity-num', 'pomodoroOpacity');
    setupToggle('pomodoro-glass-toggle', 'pomodoroGlass');
    setupToggle('pomodoro-border-toggle', 'pomodoroBorder');
    setupSliderPair('pomodoro-radius-slider', 'pomodoro-radius-num', 'pomodoroRadius');

    chrome.storage.onChanged.addListener((changes) => {
        if (changes.accentColor || changes.bgColor) {
            getSettings().then(applyPomodoroTheme);
        }
    });

    getSettings().then(applyPomodoroTheme);
}