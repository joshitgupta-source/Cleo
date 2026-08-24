const canvas = document.createElement('canvas');
const SAMPLE_SIZE = 24;
canvas.width = SAMPLE_SIZE;
canvas.height = SAMPLE_SIZE;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const getLuminance = (r, g, b) => (r * 299 + g * 587 + b * 114) / 1000;

/**
 * Resolves cross-browser favicons (Chromium internal API vs Firefox / S2 fallback).
 */
export function getFaviconUrl(pageUrl, size = 32) {
  if (!pageUrl) return '';

  try {
    const validUrl = pageUrl.startsWith('http://') || pageUrl.startsWith('https://') 
      ? pageUrl 
      : `https://${pageUrl}`;
    const urlObj = new URL(validUrl);
    const domain = urlObj.hostname;
    const isFirefox = typeof navigator !== 'undefined' && /firefox|fxios/i.test(navigator.userAgent);

    // Use Chrome internal favicon provider only in Chromium environments
    if (!isFirefox && typeof chrome !== 'undefined' && chrome?.runtime?.getURL) {
      try {
        const chromeFaviconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
        chromeFaviconUrl.searchParams.set('pageUrl', validUrl);
        chromeFaviconUrl.searchParams.set('size', size.toString());
        return chromeFaviconUrl.toString();
      } catch {
        // Fall through to external provider
      }
    }

    // Firefox & universal fallback: Google S2 Favicon API
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
  } catch {
    return '';
  }
}

/**
 * Checks if the root environment or dashboard is in dark mode.
 */
function isDarkModeActive() {
  return document.documentElement.classList.contains('dark-bg') || 
         document.body?.classList.contains('dark-bg') ||
         !document.documentElement.classList.contains('light-bg');
}

/**
 * Applies intelligent contrast inversion to monochromatic favicons.
 */
export function applySmartInvert(imgElement) {
  if (!imgElement) return;

  if (imgElement.complete && imgElement.naturalWidth > 0) {
    processImage(imgElement);
  } else {
    imgElement.addEventListener('load', () => processImage(imgElement), { once: true });
  }
}

function processImage(imgElement) {
  try {
    let isBgDark = isDarkModeActive();
    
    // Check actual tile container first, then container parent
    const tile = imgElement.closest('.shortcut-tile') || imgElement.closest('.shortcut-container') || imgElement.parentElement;
    if (tile) {
      const tileStyle = window.getComputedStyle(tile);
      const bgMatch = tileStyle.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

      if (bgMatch) {
        const r = parseInt(bgMatch[1], 10);
        const g = parseInt(bgMatch[2], 10);
        const b = parseInt(bgMatch[3], 10);
        const alpha = bgMatch[4] !== undefined ? parseFloat(bgMatch[4]) : 1;

        if (alpha >= 0.1) {
          isBgDark = getLuminance(r, g, b) < 128;
        }
      }
    }

    ctx.clearRect(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    ctx.drawImage(imgElement, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
    
    let visiblePixels = 0;
    let darkPixels = 0;
    let lightPixels = 0;
    let colorfulPixels = 0;

    for (let i = 0; i < imageData.length; i += 4) {
      const alpha = imageData[i + 3];
      
      if (alpha > 50) {
        visiblePixels++;
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        
        // Check for color saturation/variance (RGB delta > 25)
        if (Math.max(r, g, b) - Math.min(r, g, b) > 25) {
          colorfulPixels++;
        }

        const lum = getLuminance(r, g, b);
        if (lum < 60) {
          darkPixels++;
        } else if (lum > 195) {
          lightPixels++;
        }
      }
    }

    if (visiblePixels === 0) return;

    // Abort if icon has >3% vivid/multi-color pixels (preserves Google, Slack, etc.)
    if ((colorfulPixels / visiblePixels) > 0.03) {
      imgElement.style.filter = '';
      return;
    }

    const isIconMostlyDark = (darkPixels / visiblePixels) > 0.6;
    const isIconMostlyLight = (lightPixels / visiblePixels) > 0.6;
    
    if (isBgDark && isIconMostlyDark) {
      imgElement.style.filter = 'invert(1) brightness(1.2)';
    } else if (!isBgDark && isIconMostlyLight) {
      imgElement.style.filter = 'invert(1) brightness(0.8)';
    } else {
      imgElement.style.filter = '';
    }

  } catch (e) {
    // Cross-origin tainted canvas fallback: avoid breaking execution
    imgElement.style.filter = '';
  }
}

// --- Theme Change Observer ---
let recheckTimeout;
const recheckAllIcons = () => {
  clearTimeout(recheckTimeout);
  recheckTimeout = setTimeout(() => {
    document.querySelectorAll('.shortcut-icon').forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        processImage(img);
      }
    });
  }, 100);
};

const themeObserver = new MutationObserver(recheckAllIcons);

themeObserver.observe(document.documentElement, { 
  attributes: true, 
  attributeFilter: ['class', 'style'] 
});

if (document.body) {
  themeObserver.observe(document.body, { 
    attributes: true, 
    attributeFilter: ['class', 'style'] 
  });
}