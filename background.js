const DEFAULT_TIME = 25 * 60 * 1000; // 25 minutes in milliseconds

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startTimer') {
        // Calculate the exact future timestamp it should ring
        const endTime = Date.now() + request.timeLeft;
        
        chrome.storage.local.set({
            pomodoro: { isRunning: true, endTime: endTime, timeLeft: request.timeLeft }
        });
        
        // Tell Chrome's internal alarm clock to wake us up at that time
        chrome.alarms.create('pomodoroAlarm', { when: endTime });
        sendResponse({ success: true });
    }
    else if (request.action === 'pauseTimer') {
        chrome.alarms.clear('pomodoroAlarm');
        chrome.storage.local.set({
            pomodoro: { isRunning: false, endTime: null, timeLeft: request.timeLeft }
        });
        sendResponse({ success: true });
    }
});

// When the Chrome alarm goes off
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'pomodoroAlarm') {
        // Reset the storage state
        chrome.storage.local.set({
            pomodoro: { isRunning: false, endTime: null, timeLeft: DEFAULT_TIME }
        });
        
        // Fire the desktop notification
        chrome.notifications.create('pomodoroDone', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Session Complete!',
            message: 'Great focus. Take a 5-minute break!',
            priority: 2,
            requireInteraction: true // Stays on screen until clicked
        });

        // Tell any open Cleo tabs to update their UI
        chrome.runtime.sendMessage({ action: 'timerComplete' }).catch(() => {});
    }
});