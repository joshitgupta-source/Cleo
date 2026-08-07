const gridContainer = document.getElementById('grid-container');
const addBtnContainer = document.getElementById('add-btn-container');

const globalMenu = document.createElement('div');
globalMenu.className = 'dropdown-menu';
globalMenu.style.display = 'none';

// 🛑 STOP EVENT BUBBLING: This prevents the underlying <a> tag from opening the website!
globalMenu.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
globalMenu.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });

const editOpt = document.createElement('button');
editOpt.textContent = 'Edit shortcut';
const removeOpt = document.createElement('button');
removeOpt.textContent = 'Remove';
globalMenu.append(editOpt, removeOpt);

let activeTileIndex = null;
let draggedEl = null;

export function initContextMenu(onEdit, onDelete) {
    editOpt.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        globalMenu.style.display = 'none';
        onEdit(activeTileIndex);
    });

    removeOpt.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        globalMenu.style.display = 'none';
        onDelete(activeTileIndex);
    });

    document.addEventListener('click', (e) => {
        if (!globalMenu.contains(e.target)) globalMenu.style.display = 'none';
        if (e.target.classList.contains('menu-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const tile = e.target.closest('.shortcut-container');
            if (tile) {
                activeTileIndex = parseInt(tile.dataset.index, 10);
                e.target.parentElement.appendChild(globalMenu);
                globalMenu.style.display = 'flex';
            }
        }
    });
}

export function initGrid(onReorder, onDropFromAdd, onAddClick) {
    document.getElementById('add-btn').addEventListener('click', onAddClick);

    gridContainer.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.draggable-item');
        if (!item || item.id === 'add-btn-container') return;
        draggedEl = item;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.index);
        setTimeout(() => item.classList.add('dragging'), 0);
    });

    gridContainer.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });

    gridContainer.addEventListener('dragenter', (e) => {
        e.preventDefault();
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
    gridContainer.querySelectorAll('.shortcut-container').forEach(c => c.remove());
    const frag = document.createDocumentFragment();
    
    if (isEditable) {
        addBtnContainer.classList.toggle('hidden', sites.length >= currentMaxShortcuts);
        sites.forEach((siteData, index) => {
            const container = document.createElement('div');
            container.className = 'shortcut-container draggable-item';
            container.draggable = true;
            container.dataset.index = index;

            const link = document.createElement('a');
            link.className = 'shortcut-tile';
            link.href = siteData.url;
            link.title = siteData.name;
            link.draggable = false;

            const img = document.createElement('img');
            img.src = `${chrome.runtime.getURL("/_favicon/")}?pageUrl=${encodeURIComponent(siteData.url)}&size=32`;
            link.appendChild(img);

            const menuBtn = document.createElement('button');
            menuBtn.className = 'menu-btn';
            menuBtn.innerHTML = '&#8942;';
            link.appendChild(menuBtn);

            const text = document.createElement('span');
            text.className = 'shortcut-text';
            text.textContent = siteData.name;

            container.append(link, text);
            frag.appendChild(container);
        });
        gridContainer.insertBefore(frag, addBtnContainer);
        gridContainer.appendChild(addBtnContainer);
    } else {
        addBtnContainer.classList.add('hidden');
        sites.forEach((siteData) => {
            const container = document.createElement('div');
            container.className = 'shortcut-container';

            const link = document.createElement('a');
            link.className = 'shortcut-tile';
            link.href = siteData.url;
            link.title = siteData.name;
            link.draggable = false;

            const img = document.createElement('img');
            img.src = `${chrome.runtime.getURL("/_favicon/")}?pageUrl=${encodeURIComponent(siteData.url)}&size=32`;
            
            const text = document.createElement('span');
            text.className = 'shortcut-text';
            text.textContent = siteData.name;

            link.appendChild(img);
            container.append(link, text);
            frag.appendChild(container);
        });
        gridContainer.appendChild(frag);
    }
}