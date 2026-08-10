import { getSettings, updateStorage } from './state.js';
import { initClock } from './clock.js';
import { initSearch, updateSearchIcon, initSettingsSearch, populateEngineDropdown } from './search.js';
import { initGrid, initContextMenu } from './grid.js';
import { initUI, openModal, closeModal } from './ui.js';
import { applySettings, saveAndApply } from './theme.js';
import './panel.js'; 

let editingSiteData = null;

const getEl = (id) => document.getElementById(id);

export function showToast(msg, actionText = null, onAction = null) {
    let toast = getEl('cleo-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cleo-toast';
        toast.className = 'toast-message';
        document.body.appendChild(toast);
    }
    
    toast.innerHTML = '';
    const textSpan = document.createElement('span');
    textSpan.textContent = msg;
    toast.appendChild(textSpan);

    if (actionText && onAction) {
        const btn = document.createElement('button');
        btn.textContent = actionText;
        btn.className = 'toast-undo-btn';
        btn.onclick = () => {
            onAction();
            toast.classList.remove('show');
        };
        toast.appendChild(btn);
    }

    toast.classList.add('show');
    
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    
    toast.timeoutId = setTimeout(() => {
        toast.classList.remove('show');
    }, actionText ? 5000 : 3000);
}

window.showToast = showToast;

initClock();
populateEngineDropdown();
initSettingsSearch();
initSearch((newEngine) => saveAndApply({ searchEngine: newEngine }));
initUI(() => { editingSiteData = null; });

initContextMenu(
    (url, name, isTopSite) => {
        editingSiteData = { url, isTopSite };
        openModal('Edit shortcut', name, url);
    },
    async (url, isTopSite) => {
        const data = await getSettings();
        if (isTopSite) {
            const hidden = data.hiddenTopSites || [];
            hidden.push(url);
            updateStorage({ hiddenTopSites: hidden }, () => {
                applySettings();
                showToast('Shortcut removed', 'Undo', () => {
                    getSettings().then(latest => {
                        let currHidden = latest.hiddenTopSites || [];
                        currHidden = currHidden.filter(h => h !== url);
                        updateStorage({ hiddenTopSites: currHidden }, applySettings);
                    });
                });
            });
        } else {
            const shortcuts = data.shortcuts || [];
            const deletedIdx = shortcuts.findIndex(s => s.url === url);
            const deletedItem = shortcuts[deletedIdx];
            const newShortcuts = shortcuts.filter(s => s.url !== url);
            
            updateStorage({ shortcuts: newShortcuts }, () => {
                applySettings();
                showToast('Shortcut removed', 'Undo', () => {
                    getSettings().then(latest => {
                        let curr = latest.shortcuts || [];
                        curr.splice(deletedIdx > -1 ? deletedIdx : curr.length, 0, deletedItem);
                        updateStorage({ shortcuts: curr }, applySettings);
                    });
                });
            });
        }
    }
);

initGrid(
    async (fromIndex, toIndex) => {
        const data = await getSettings();
        let shortcuts = data.shortcuts || [];
        let hidden = data.hiddenTopSites || [];
        
        if (data.shortcutType === 'topSites') {
            chrome.topSites.get((topSites) => {
                const customUrls = new Set(shortcuts.map(s => s.url));
                const dynamicSites = topSites
                    .filter(s => !customUrls.has(s.url) && !hidden.includes(s.url))
                    .map(s => ({ name: s.title, url: s.url, isTopSite: true }));
                
                const hybrid = [...dynamicSites, ...shortcuts.map(s => ({...s, isCustom: true}))].slice(0, data.maxShortcuts);
                
                const moved = hybrid[fromIndex];
                if (!moved) return;

                if (moved.isTopSite) {
                    hidden.push(moved.url);
                } else {
                    shortcuts = shortcuts.filter(s => s.url !== moved.url);
                }

                const numDynamic = hybrid.filter(s => s.isTopSite && s.url !== moved.url).length;
                let targetCustomIndex = toIndex - numDynamic;
                if (targetCustomIndex < 0) targetCustomIndex = 0;

                shortcuts.splice(targetCustomIndex, 0, { name: moved.name, url: moved.url });

                updateStorage({ shortcuts, hiddenTopSites: hidden }, applySettings);
            });
        } else {
            const [moved] = shortcuts.splice(fromIndex, 1);
            shortcuts.splice(toIndex, 0, moved);
            updateStorage({ shortcuts }, applySettings);
        }
    },
    async (fromIndex) => {
        const data = await getSettings();
        let shortcuts = data.shortcuts || [];
        if (fromIndex >= 0 && fromIndex < shortcuts.length) {
            const [moved] = shortcuts.splice(fromIndex, 1);
            shortcuts.push(moved);
            updateStorage({ shortcuts }, applySettings);
        }
    },
    () => {
        editingSiteData = null;
        openModal('Add shortcut', '', '');
    }
);

document.addEventListener('dragstart', (e) => {
    if (document.body.classList.contains('is-locked')) {
        e.preventDefault();
    }
});

document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') return;

    if (e.key === '/') {
        e.preventDefault();
        getEl('search-input')?.focus();
    }
});

const handleShortcutSave = async () => {
    const nameInput = getEl('site-name');
    const urlInput = getEl('site-url');
    
    if (!nameInput || !urlInput) return;

    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    
    if (!name || !url) return; 
    
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    
    const data = await getSettings();
    const shortcuts = data.shortcuts || [];
    const maxShortcuts = data.maxShortcuts || 50;

    const isDuplicate = shortcuts.some(s => s.url === url && (!editingSiteData || s.url !== editingSiteData.url));
    if (isDuplicate) {
        showToast('This URL already exists in your shortcuts');
        return;
    }

    if (editingSiteData) {
        if (editingSiteData.isTopSite) {
            const hidden = data.hiddenTopSites || [];
            hidden.push(editingSiteData.url);
            shortcuts.push({ name, url });
            updateStorage({ shortcuts, hiddenTopSites: hidden }, () => {
                applySettings();
                showToast('Shortcut updated');
                editingSiteData = null;
                closeModal();
            });
        } else {
            const customIdx = shortcuts.findIndex(s => s.url === editingSiteData.url);
            if (customIdx > -1) shortcuts[customIdx] = { name, url };
            updateStorage({ shortcuts }, () => {
                applySettings();
                showToast('Shortcut updated');
                editingSiteData = null;
                closeModal();
            });
        }
    } else {
        if (shortcuts.length >= maxShortcuts) {
            showToast(`You've reached your custom limit of ${maxShortcuts} shortcuts.`);
            return;
        }
        shortcuts.push({ name, url });
        updateStorage({ shortcuts }, () => {
            applySettings();
            showToast('Shortcut added');
            editingSiteData = null;
            closeModal();
        });
    }
};

getEl('done-btn')?.addEventListener('click', handleShortcutSave);

const submitOnEnter = (e) => {
    if (e.key === 'Enter') handleShortcutSave();
};
getEl('site-name')?.addEventListener('keydown', submitOnEnter);
getEl('site-url')?.addEventListener('keydown', submitOnEnter);

getEl('lock-btn')?.addEventListener('click', () => {
    setTimeout(() => {
        const isLocked = document.body.classList.contains('is-locked');
        showToast(isLocked ? 'Layout locked' : 'Layout unlocked');
    }, 10);
});

const initDynamicPlaceholder = () => {
    const searchInput = getEl('search-input');
    if (!searchInput) return;

    const hour = new Date().getHours();
    const timeGreeting = 
        hour >= 5 && hour < 12 ? 'Good morning! ☀️' :
        hour >= 12 && hour < 17 ? 'Good afternoon! ☕' :
        hour >= 17 && hour < 22 ? 'Good evening! 🌙' : 'Working late? 🦉';

    const allMessages = [
        timeGreeting,
        timeGreeting,
        timeGreeting,
        "Sup", "Yo!", "Hiya", "Ahoy", "Hello stranger!", "Goodmorrow!", 
        "What’s crackin’?", "What’s up buttercup?", "Howdy!", 
        "Greetings, Earthling.", "Hello from the other side.", 
        "Goood morning, Vietnam!", "Here's Johnny!", "I'm Batman.", 
        "Hello, my name is Inigo Montoya.", "Happy 'Not Monday'!", "Welcome to the future!", "Salutations!", "Hey there, sunshine!",
        "Ahoy, matey!", "Greetings and salutations!", "Top of the morning to ya!", "What's the buzz?", 
        "Hello, gorgeous!", "Hey, you! Yes, you!", "Good day, kind sir/madam.", "Well, hello there!", "Hey, hey, hey!", "What's the haps?",
        "Yo, yo, yo!", "Hello, world!", "Hey, hey, hey! What's cookin'?", "Greetings, fellow human!", "Hello, my precious!", "Hey there, good lookin'!",
        "What's the word, hummingbird?", "Hello, sunshine!", "Hey there, tiger!", "Greetings and felicitations!", "Hello, my little friend!",
        "Hey there, sport!", "What's the scoop, chicken coop?", "Hello, my dear Watson!", "Hey there, champ!", "Greetings and warm wishes!",
        "Hello, my fine feathered friend!", "Hey there, buddy ol' pal!", "What's the dealio?", "Hello, my sweet summer child!", "Hey there, partner in crime!",
        "Greetings and salutations to you too!", "Hello, my little cupcake!", "Hey there, rockstar!", "What's the haps, perhaps?", "Hello, my little ray of sunshine!", "Six-Seven",
        "coke + water = coconutwatahhh", "Hello, my little firecracker!", "Hey there, superstar!", "What's the buzz, cuz?", "Hello, my little moonbeam!",
        "Hey there, my little pumpkin pie!", "Greetings and felicitations to you too!",
        "Good to see you!", "Long time no see.", "Lovely to see you.", "Welcome back!",
        "Looking sharp today!", "Ready to create?", "What's the plan today?", "Let's dive in!",
        "Up for a quick task?", "Let's make today count.", "Stay focused and keep building.",
        "Every problem solved is a step closer to cracking JEE Main.", "Small steps every day.", "What will you discover today?",
        "Wait a minute! who are you?", "have to work again, money plant doesn't work", "Drink Water!!", "What's up cutie patootie?",
        "Don't forget to schedule that ITI Chandkheda document verification!",
        "Hello, my little starfish!", "Hey there, my little jellybean!", "Greetings and felicitations to you too!", "Hello, my little marshmallow!", "Hey there, my little gummy bear!", "What's the haps, perhaps?", "Hello, my little peanut butter cup!", "Hey there, my little chocolate chip cookie!",
        "Greetings and salutations to you too!", "Hello, my little cinnamon roll!", "Hey there, my little sugarplum!", "What's the buzz, cuz?", "Hello, my little honeybun!",
        "Hey there, my little snickerdoodle!", "Greetings and felicitations to you too!", "Hello, my little cupcake!", "Hey there, my little brownie!", 
        "What's the haps, perhaps?", "Hello, my little tartlet!", "Hey there, my little eclair!", "Greetings and salutations to you too!", 
        "Hello, my little profiterole!", "Hey there, my little cannoli!", "What's the buzz, cuz?", "Hello, my little macaroon!", 
        "Hey there, my little madeleine!", "Greetings and felicitations to you too!", "Hello, my little palmiers!", "Hey there, my little financiers!", "What's the haps, perhaps?", "Hello, my little tarts!", "Hey there, my little gateaux!", "Greetings and salutations to you too!", "Hello, my little mille-feuille!", 
        "Hey there, my little religieuse!", "What's the buzz, cuz?", "Hello, my little chouquettes!", "Hey there, my little beignets!", 
        "Greetings and felicitations to you too!", "Hello, my little croissants!", "Hey there, my little pain au chocolat!", "What's the haps, perhaps?", "Hello, my little brioche!", "Hello, my Cute lil red flags", 
    ];
    
    const randomMessage = allMessages[Math.floor(Math.random() * allMessages.length)];

    searchInput.placeholder = randomMessage;

    setTimeout(() => {
        searchInput.placeholder = "Search the web...";
    }, 3500);
};

initDynamicPlaceholder();
applySettings();