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

function triggerNotification(title, message) {
  try {
    const notifId = `cleo-pomo-${Date.now()}`;
    const iconUrl = typeof chrome !== 'undefined' && chrome.runtime?.getURL 
      ? chrome.runtime.getURL('icons/icon128.png') 
      : 'icons/icon128.png';

    chrome.notifications.create(notifId, {
      type: 'basic',
      iconUrl: iconUrl,
      title: title,
      message: message,
      priority: 2
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('Cleo: Notification error:', chrome.runtime.lastError.message);
      }
    });
  } catch (err) {
    console.error('Cleo: Failed to trigger notification:', err);
  }
}

function handleTimerComplete() {
  chrome.storage.local.get({ focusTime: 25, breakTime: 5, pomodoro: {} }, (data) => {
    const currentMode = data.pomodoro?.mode || 'focus';

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
        triggerNotification(
          'Focus Session Complete! ☕',
          'Great job! Your break timer has started automatically.'
        );
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
        triggerNotification(
          'Break Finished! 🎯',
          'Ready to dive back in? Click play when you are ready to focus.'
        );
      });
    }

    try {
      chrome.runtime.sendMessage({ action: 'timerComplete' }, () => {
        const err = chrome.runtime.lastError;
        if (err && !err.message.includes('Receiving end does not exist')) {
          console.warn('Cleo: Error sending timerComplete message:', err.message);
        }
      });
    } catch (e) {
      console.error('Cleo: Failed to send message to active tabs:', e);
    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroAlarm') {
    handleTimerComplete();
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('cleo-pomo-')) {
    chrome.notifications.clear(notificationId);
  }
});