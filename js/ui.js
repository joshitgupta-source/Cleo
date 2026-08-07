import { getTextColorForBackground } from './utils.js';

const customizeBtn = document.getElementById('customize-btn');
const sidePanel = document.getElementById('side-panel');
const closePanelBtn = document.getElementById('close-panel-btn');
const modal = document.getElementById('modal-backdrop');
const cancelBtn = document.getElementById('cancel-btn');
const nameInput = document.getElementById('site-name');
const urlInput = document.getElementById('site-url');
const modalTitle = document.getElementById('modal-title');

export function initUI(onCancel) {
    document.getElementById('panel-title').textContent = `Customize ${chrome.runtime.getManifest().name}`;
    customizeBtn.addEventListener('click', () => sidePanel.classList.add('open'));
    closePanelBtn.addEventListener('click', () => sidePanel.classList.remove('open'));
    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        onCancel();
    });
}

export function openModal(title, name, url) {
    modalTitle.textContent = title;
    nameInput.value = name;
    urlInput.value = url;
    modal.classList.remove('hidden');
    nameInput.focus();
}

export function closeModal() {
    modal.classList.add('hidden');
}

export function applyBackground(bgType, bgValue) {
    const isDarkText = getTextColorForBackground(bgValue || '#000000') === 'dark-text';
    if (bgType === 'color') {
        document.body.style.setProperty('background-image', 'none', 'important');
        document.body.style.setProperty('background-color', bgValue || '#000000', 'important');
        document.documentElement.classList.toggle('light-bg', isDarkText);
    } else if (bgType === 'image') {
        document.body.style.setProperty('background-color', '#000000', 'important');
        document.body.style.setProperty('background-image', `url(${bgValue})`, 'important');
        document.documentElement.classList.remove('light-bg');
    }
}