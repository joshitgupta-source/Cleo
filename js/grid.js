const getEl = (id) => document.getElementById(id);

const globalMenu = document.createElement('div');
globalMenu.className = 'dropdown-menu';
globalMenu.style.display = 'none';

globalMenu.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
globalMenu.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });

const pinOpt = document.createElement('button');
const editOpt = document.createElement('button');
editOpt.textContent = 'Edit shortcut';
const removeOpt = document.createElement('button');
removeOpt.textContent = 'Remove';
globalMenu.append(pinOpt, editOpt, removeOpt);

let activeTileIndex = null;
let draggedEl = null;

const fallbackSvg = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238ab4f8"><circle cx="12" cy="12" r="10"/></svg>';

const pinSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.89A2 2 0 0 0 5 15.24Z"></path></svg>`;

export function initContextMenu(onEdit, onDelete, onTogglePin) {
    pinOpt.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        globalMenu.style.display = 'none';
        document.querySelectorAll('.shortcut-container').forEach(c => c.classList.remove('menu-active'));
        if (activeTileIndex !== null) {
            const tile = document.querySelector(`.shortcut-container[data-index="${activeTileIndex}"]`);
            if (tile) onTogglePin(tile.dataset.url, tile.dataset.name, tile.dataset.pinned === 'true');
        }
    });

    editOpt.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        globalMenu.style.display = 'none';
        document.querySelectorAll('.shortcut-container').forEach(c => c.classList.remove('menu-active'));
        if (activeTileIndex !== null) {
            const tile = document.querySelector(`.shortcut-container[data-index="${activeTileIndex}"]`);
            if (tile) onEdit(tile.dataset.url, tile.dataset.name, tile.dataset.isTopSite === 'true');
        }
    });

    removeOpt.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        globalMenu.style.display = 'none';
        document.querySelectorAll('.shortcut-container').forEach(c => c.classList.remove('menu-active'));
        if (activeTileIndex !== null) {
            const tile = document.querySelector(`.shortcut-container[data-index="${activeTileIndex}"]`);
            if (tile) onDelete(tile.dataset.url, tile.dataset.isTopSite === 'true');
        }
    });

    document.addEventListener('click', (e) => {
        const isMenuBtn = e.target.classList.contains('menu-btn');
        
        if (!isMenuBtn && !globalMenu.contains(e.target)) {
            globalMenu.style.display = 'none';
            document.querySelectorAll('.shortcut-container').forEach(c => c.classList.remove('menu-active'));
        }
        
        if (isMenuBtn) {
            e.preventDefault();
            e.stopPropagation();
            const tile = e.target.closest('.shortcut-container');
            if (tile) {
                const isAlreadyOpenHere = globalMenu.parentElement === e.target.parentElement && globalMenu.style.display === 'flex';
                
                document.querySelectorAll('.shortcut-container').forEach(c => c.classList.remove('menu-active'));
                
                if (isAlreadyOpenHere) {
                    globalMenu.style.display = 'none';
                } else {
                    activeTileIndex = parseInt(tile.dataset.index, 10);
                    pinOpt.textContent = tile.dataset.pinned === 'true' ? 'Unpin shortcut' : 'Pin shortcut';
                    e.target.parentElement.appendChild(globalMenu);
                    globalMenu.style.display = 'flex';
                    tile.classList.add('menu-active');
                }
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && globalMenu.style.display === 'flex') {
            globalMenu.style.display = 'none';
            document.querySelectorAll('.shortcut-container').forEach(c => c.classList.remove('menu-active'));
        }
    });
}

export function initGrid(onReorder, onDropFromAdd, onAddClick) {
    getEl('add-btn')?.addEventListener('click', onAddClick);

    const gridContainer = getEl('grid-container');
    if (!gridContainer) return;

    gridContainer.addEventListener('dragstart', (e) => {
        if (document.body.classList.contains('is-locked')) {
            e.preventDefault();
            return;
        }

        const item = e.target.closest('.draggable-item');
        if (!item || item.id === 'add-btn-container') return;
        
        draggedEl = item;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.index);
        
        requestAnimationFrame(() => item.classList.add('dragging'));
    });

    gridContainer.addEventListener('dragover', (e) => { 
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move'; 
    });

    gridContainer.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (document.body.classList.contains('is-locked')) return;
        
        const target = e.target.closest('.shortcut-container, .add-shortcut-container');
        if (target && target !== draggedEl) target.classList.add('drag-over');
    });

    gridContainer.addEventListener('dragleave', (e) => {
        const target = e.target.closest('.shortcut-container, .add-shortcut-container');
        if (target) target.classList.remove('drag-over');
    });

    gridContainer.addEventListener('dragend', () => {
        if (draggedEl) draggedEl.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        draggedEl = null;
    });

    gridContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        if (document.body.classList.contains('is-locked')) return;
        
        const target = e.target.closest('.shortcut-container, .add-shortcut-container');
        if (target) target.classList.remove('drag-over');
        
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (isNaN(fromIndex)) return;

        if (target && target.id === 'add-btn-container') {
            onDropFromAdd(fromIndex);
            return;
        }

        if (target && target.dataset.index !== undefined) {
            const toIndex = parseInt(target.dataset.index, 10);
            if (fromIndex !== toIndex) onReorder(fromIndex, toIndex);
        }
    });
}

export function renderGrid(sites, isEditable, currentMaxShortcuts) {
    const gridContainer = getEl('grid-container');
    const addBtnContainer = getEl('add-btn-container');
    
    if (!gridContainer) return;

    let pinnedUrls = new Set();
    let pinnedArray = [];
    try {
        const rawPinned = localStorage.getItem('pinnedSites');
        if (rawPinned) {
            pinnedArray = JSON.parse(rawPinned);
            pinnedArray.forEach(p => pinnedUrls.add(p.url));
        }
    } catch(e) {}

    const shortcutType = localStorage.getItem('shortcutType') || 'topSites';

    if (shortcutType === 'topSites') {
        const pinnedItems = [];
        const unpinnedItems = [];

        sites.forEach(s => {
            if (pinnedUrls.has(s.url)) {
                pinnedItems.push({...s, isPinned: true});
            } else {
                unpinnedItems.push(s);
            }
        });

        const incomingUrls = new Set(sites.map(s => s.url));
        const missingPinned = pinnedArray
            .filter(p => !incomingUrls.has(p.url))
            .map(p => ({...p, isPinned: true, isTopSite: true}));

        sites = [...pinnedItems, ...missingPinned, ...unpinnedItems].slice(0, currentMaxShortcuts);
    } else {
        sites = sites.map(s => ({...s, isPinned: pinnedUrls.has(s.url) || s.isPinned}));
    }

    gridContainer.querySelectorAll('.shortcut-container').forEach(c => c.remove());
    
    const frag = document.createDocumentFragment();
    
    sites.forEach((siteData, index) => {
        const container = document.createElement('div');
        container.className = `shortcut-container ${isEditable ? 'draggable-item' : ''}`;
        
        if (isEditable) {
            container.draggable = true;
            container.dataset.index = index;
            container.dataset.url = siteData.url;
            container.dataset.name = siteData.name;
            container.dataset.isTopSite = siteData.isTopSite ? 'true' : 'false';
            container.dataset.pinned = siteData.isPinned ? 'true' : 'false';
        }

        const link = document.createElement('a');
        link.className = 'shortcut-tile';
        link.href = siteData.url;
        link.title = siteData.name;
        link.draggable = false;

        const img = document.createElement('img');
        img.src = `${chrome.runtime.getURL("/_favicon/")}?pageUrl=${encodeURIComponent(siteData.url)}&size=32`;
        img.onerror = () => { img.src = fallbackSvg; };
        link.appendChild(img);

        if (siteData.isPinned) {
            const pinIcon = document.createElement('div');
            pinIcon.className = 'pin-indicator';
            pinIcon.innerHTML = pinSvg;
            link.appendChild(pinIcon);
        }

        if (isEditable) {
            const menuBtn = document.createElement('button');
            menuBtn.className = 'menu-btn';
            menuBtn.innerHTML = '&#8942;';
            link.appendChild(menuBtn);
        }

        const text = document.createElement('span');
        text.className = 'shortcut-text';
        text.textContent = siteData.name;

        container.append(link, text);
        frag.appendChild(container);
    });

    if (addBtnContainer) {
        if (isEditable) {
            addBtnContainer.classList.toggle('hidden', sites.length >= currentMaxShortcuts);
            gridContainer.insertBefore(frag, addBtnContainer);
            gridContainer.appendChild(addBtnContainer);
        } else {
            addBtnContainer.classList.add('hidden');
            gridContainer.appendChild(frag);
        }
    } else {
        gridContainer.appendChild(frag);
    }
}