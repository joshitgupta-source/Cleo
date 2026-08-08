// Helper for dynamic safe DOM element lookups
const getEl = (id) => document.getElementById(id);

// ==========================================
// CONTEXT MENU SETUP (Singleton)
// ==========================================
const globalMenu = document.createElement('div');
globalMenu.className = 'dropdown-menu';
globalMenu.style.display = 'none';

// Stop event bubbling to prevent underlying <a> tags from triggering navigation
globalMenu.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
globalMenu.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });

const editOpt = document.createElement('button');
editOpt.textContent = 'Edit shortcut';
const removeOpt = document.createElement('button');
removeOpt.textContent = 'Remove';
globalMenu.append(editOpt, removeOpt);

let activeTileIndex = null;
let draggedEl = null;

const fallbackSvg = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238ab4f8"><circle cx="12" cy="12" r="10"/></svg>';

export function initContextMenu(onEdit, onDelete) {
    editOpt.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        globalMenu.style.display = 'none';
        if (activeTileIndex !== null) onEdit(activeTileIndex);
    });

    removeOpt.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        globalMenu.style.display = 'none';
        if (activeTileIndex !== null) onDelete(activeTileIndex);
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

    // UX Polish: Close menu with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && globalMenu.style.display === 'flex') {
            globalMenu.style.display = 'none';
        }
    });
}

// ==========================================
// DRAG & DROP ENGINE
// ==========================================
export function initGrid(onReorder, onDropFromAdd, onAddClick) {
    getEl('add-btn')?.addEventListener('click', onAddClick);

    const gridContainer = getEl('grid-container');
    if (!gridContainer) return;

    gridContainer.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.draggable-item');
        if (!item || item.id === 'add-btn-container') return;
        
        draggedEl = item;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.index);
        
        // Push class addition to next frame to ensure the drag ghost renders properly
        requestAnimationFrame(() => item.classList.add('dragging'));
    });

    gridContainer.addEventListener('dragover', (e) => { 
        e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move'; 
    });

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

// ==========================================
// GRID RENDERER
// ==========================================
export function renderGrid(sites, isEditable, currentMaxShortcuts) {
    const gridContainer = getEl('grid-container');
    const addBtnContainer = getEl('add-btn-container');
    
    if (!gridContainer) return;

    // Flush existing tiles (except the add button)
    gridContainer.querySelectorAll('.shortcut-container').forEach(c => c.remove());
    
    const frag = document.createDocumentFragment();
    
    sites.forEach((siteData, index) => {
        const container = document.createElement('div');
        container.className = `shortcut-container ${isEditable ? 'draggable-item' : ''}`;
        
        if (isEditable) {
            container.draggable = true;
            container.dataset.index = index;
        }

        const link = document.createElement('a');
        link.className = 'shortcut-tile';
        link.href = siteData.url;
        link.title = siteData.name;
        link.draggable = false; // Prevent native browser link dragging

        const img = document.createElement('img');
        img.src = `${chrome.runtime.getURL("/_favicon/")}?pageUrl=${encodeURIComponent(siteData.url)}&size=32`;
        img.onerror = () => { img.src = fallbackSvg; }; // Fallback for broken favicons
        link.appendChild(img);

        if (isEditable) {
            const menuBtn = document.createElement('button');
            menuBtn.className = 'menu-btn';
            menuBtn.innerHTML = '&#8942;'; // Vertical ellipsis
            link.appendChild(menuBtn);
        }

        const text = document.createElement('span');
        text.className = 'shortcut-text';
        text.textContent = siteData.name;

        container.append(link, text);
        frag.appendChild(container);
    });

    // Handle Add Button Visibility and Positioning
    if (addBtnContainer) {
        if (isEditable) {
            addBtnContainer.classList.toggle('hidden', sites.length >= currentMaxShortcuts);
            gridContainer.insertBefore(frag, addBtnContainer);
            gridContainer.appendChild(addBtnContainer); // Force to end of grid
        } else {
            addBtnContainer.classList.add('hidden');
            gridContainer.appendChild(frag);
        }
    } else {
        gridContainer.appendChild(frag);
    }
}