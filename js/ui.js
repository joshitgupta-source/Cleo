import { getTextColorForBackground } from './utils.js';

const getEl = (id) => document.getElementById(id);

export function initUI(onModalClose) {
    getEl('customize-btn')?.addEventListener('click', () => {
        getEl('side-panel')?.classList.add('open');
    });

    getEl('close-panel-btn')?.addEventListener('click', () => {
        getEl('side-panel')?.classList.remove('open');
    });

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
    
    requestAnimationFrame(() => nameEl?.focus());
}

export function closeModal() {
    getEl('modal-backdrop')?.classList.add('hidden');
    const nameEl = getEl('site-name');
    const urlEl = getEl('site-url');
    if (nameEl) nameEl.value = '';
    if (urlEl) urlEl.value = '';
}

export function applyBackground(type, value) {
    const root = document.documentElement;
    const body = document.body;

    requestAnimationFrame(() => {
        root.style.setProperty('--bg-color', value);

        if (type === 'image') {
            body.style.setProperty('background-image', `url("${value}")`, 'important');
            body.style.setProperty('background-color', '#000000', 'important');
            
            root.classList.add('dark-bg');
            root.classList.remove('light-bg');
        } else {
            body.style.setProperty('background-image', 'none', 'important');
            body.style.setProperty('background-color', value, 'important');
            
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