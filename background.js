/**
 * Cleo Service Worker - Pomodoro & Background Task Engine
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startTimer': {
      const endTime = Date.now() + request.timeLeft;
      chrome.storage.local.get({ pomodoro: {} }, ({ pomodoro }) => {
        chrome.storage.local.set({
          pomodoro: {
            ...pomodoro,
            isRunning: true,
            endTime: endTime,
            timeLeft: request.timeLeft
          }
        }, () => {
          chrome.alarms.create('pomodoroAlarm', { when: endTime });
          sendResponse({ success: true });
        });
      });
      return true;
    }

    case 'pauseTimer': {
      chrome.alarms.clear('pomodoroAlarm', () => {
        chrome.storage.local.get({ pomodoro: {} }, ({ pomodoro }) => {
          chrome.storage.local.set({
            pomodoro: {
              ...pomodoro,
              isRunning: false,
              endTime: null,
              timeLeft: request.timeLeft
            }
          }, () => {
            sendResponse({ success: true });
          });
        });
      });
      return true;
    }

    case 'skipTimer': {
      chrome.alarms.clear('pomodoroAlarm', () => {
        handleTimerComplete();
        sendResponse({ success: true });
      });
      return true;
    }

    default:
      return false;
  }
});

/**
 * Handles phase transitions (Focus <-> Break) and triggers system notifications.
 */
function handleTimerComplete() {
  chrome.storage.local.get({ focusTime: 25, breakTime: 5, pomodoro: {} }, (data) => {
    const currentMode = data.pomodoro?.mode || 'focus';
    const notifId = 'cleoPomodoroDone';
    
    chrome.notifications.clear(notifId, () => {
      if (currentMode === 'focus') {
        const breakMs = (data.breakTime || 5) * 60 * 1000;
        const newEndTime = Date.now() + breakMs;
        
        chrome.storage.local.set({
          pomodoro: {
            ...data.pomodoro,
            isRunning: true,
            endTime: newEndTime,
            timeLeft: breakMs,
            mode: 'break'
          }
        }, () => {
          chrome.alarms.create('pomodoroAlarm', { when: newEndTime });
          
          chrome.notifications.create(notifId, {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Focus Session Complete! ☕',
            message: 'Great job! Your break timer has started automatically.',
            priority: 2,
            requireInteraction: true
          });
        });
      } else {
        const focusMs = (data.focusTime || 25) * 60 * 1000;
        
        chrome.storage.local.set({
          pomodoro: {
            ...data.pomodoro,
            isRunning: false,
            endTime: null,
            timeLeft: focusMs,
            mode: 'focus'
          }
        }, () => {
          chrome.notifications.create(notifId, {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Break Finished! 🎯',
            message: 'Ready to dive back in? Click play when you are ready to focus.',
            priority: 2,
            requireInteraction: true
          });
        });
      }

      // Safely notify active tabs
      try {
        chrome.runtime.sendMessage({ action: 'timerComplete' }).catch(() => {});
      } catch (e) {
        // Tab not currently listening; ignore
      }
    });
  });
}

// Alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroAlarm') {
    handleTimerComplete();
  }
});

// Dismiss notification on click
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === 'cleoPomodoroDone') {
    chrome.notifications.clear(notificationId);
  }
});