import { getTextColorForBackground } from './utils.js';

const getEl = (id) => document.getElementById(id);
let isUIInitialized = false;

export function initUI(onModalClose) {
  if (isUIInitialized) return;
  isUIInitialized = true;

  getEl('customize-btn')?.addEventListener('click', () => {
    getEl('side-panel')?.classList.add('open');
  });

  getEl('close-panel-btn')?.addEventListener('click', () => {
    getEl('side-panel')?.classList.remove('open');
  });

  const handleClose = () => {
    closeModal();
    if (typeof onModalClose === 'function') onModalClose();
  };

  getEl('cancel-btn')?.addEventListener('click', handleClose);

  getEl('modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target === getEl('modal-backdrop')) handleClose();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = getEl('modal-backdrop');
      if (modal && !modal.classList.contains('hidden')) {
        handleClose();
      }
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

  const setClass = (addCls, removeCls) => {
    root.classList.add(addCls);
    root.classList.remove(removeCls);
    if (body) {
      body.classList.add(addCls);
      body.classList.remove(removeCls);
    }
  };

  requestAnimationFrame(() => {
    if (type === 'image') {
      root.style.setProperty('--bg-color', '#000000');
      root.style.setProperty('--bg-image', `url("${value}")`);
      setClass('dark-bg', 'light-bg');
    } else {
      const bgVal = value || '#000000';
      root.style.setProperty('--bg-color', bgVal);
      root.style.setProperty('--bg-image', 'none');
      
      const textColor = getTextColorForBackground(bgVal);
      if (textColor === 'dark-text') {
        setClass('light-bg', 'dark-bg');
      } else {
        setClass('dark-bg', 'light-bg');
      }
    }
  });
}