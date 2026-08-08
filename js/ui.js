import { getTextColorForBackground } from './utils.js';

// ==========================================
// PERFORMANCE FIX: Dynamic Getters
// ==========================================
// Grabbing elements at the top of the file can cause the module to crash
// if the DOM isn't fully parsed yet. Dynamic getters prevent initialization errors.
const getEl = (id) => document.getElementById(id);

export function initUI(onModalClose) {
    // Open panel
    getEl('customize-btn')?.addEventListener('click', () => {
        getEl('side-panel')?.classList.add('open');
    });

    // Close panel
    getEl('close-panel-btn')?.addEventListener('click', () => {
        getEl('side-panel')?.classList.remove('open');
    });

    // DRY Modal close helper
    const handleClose = () => {
        closeModal();
        if (onModalClose) onModalClose();
    };

    getEl('cancel-btn')?.addEventListener('click', handleClose);

    getEl('modal-backdrop')?.addEventListener('click', (e) => {
        if (e.target === getEl('modal-backdrop')) {
            handleClose();
        }
    });
}

export function openModal(title, name = '', url = '') {
    const titleEl = getEl('modal-title');
    const nameEl = getEl('site-name');
    const urlEl = getEl('site-url');
    const modal = getEl('modal-backdrop');

    if (titleEl) titleEl.textContent = title;
    if (nameEl) nameEl.value = name;
    if (urlEl) urlEl.value = url;
    if (modal) modal.classList.remove('hidden');
    
    // Ensure display:block is rendered by the GPU before focusing the input
    requestAnimationFrame(() => nameEl?.focus());
}

export function closeModal() {
    getEl('modal-backdrop')?.classList.add('hidden');
    const nameEl = getEl('site-name');
    const urlEl = getEl('site-url');
    if (nameEl) nameEl.value = '';
    if (urlEl) urlEl.value = '';
}

// ==========================================
// THE FIX: Hardware-Forced Repainting
// ==========================================
export function applyBackground(type, value) {
    const root = document.documentElement;
    const body = document.body;

    // requestAnimationFrame forces Chrome's compositor to paint the frame immediately.
    // This stops the browser from dropping visual updates while dragging a color picker.
    requestAnimationFrame(() => {
        
        // Safety Net: We inject the color as a CSS variable just in case 
        // your HTML uses a separate overlay <div> for the background.
        root.style.setProperty('--bg-color', value);

        if (type === 'image') {
            // Using setProperty with 'important' obliterates any rogue CSS rules blocking the change
            body.style.setProperty('background-image', `url("${value}")`, 'important');
            body.style.setProperty('background-color', '#000000', 'important');
            
            root.classList.add('dark-bg');
            root.classList.remove('light-bg');
        } else {
            body.style.setProperty('background-image', 'none', 'important');
            body.style.setProperty('background-color', value, 'important');
            
            // Use our high-speed math engine from utils.js
            const textColor = getTextColorForBackground(value);
            if (textColor === 'dark-text') {
                root.classList.add('light-bg');
                root.classList.remove('dark-bg');
            } else {
                root.classList.add('dark-bg');
                root.classList.remove('light-bg');
            }
        }
    });
}