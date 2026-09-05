importScripts('../libs/libheif.js');

let cachedDecoder = null;

async function getDecoder() {
  if (cachedDecoder) return cachedDecoder;
  let lib = typeof libheif !== 'undefined' ? libheif : null;
  if (!lib) throw new Error('libheif library not found');
  if (typeof lib === 'function') lib = await lib();
  const Decoder = lib.HeifDecoder || lib.default?.HeifDecoder || self.HeifDecoder;
  if (!Decoder) throw new Error('HeifDecoder constructor missing on libheif');
  cachedDecoder = Decoder;
  return cachedDecoder;
}

self.onmessage = async (e) => {
  try {
    const buffer = e.data;
    const DecoderClass = await getDecoder();
    const decoder = new DecoderClass();
    const data = decoder.decode(new Uint8Array(buffer));

    if (!data || data.length === 0) {
      throw new Error('No images found in HEIF container');
    }

    const primaryImage = data[0];
    const origWidth = primaryImage.get_width();
    const origHeight = primaryImage.get_height();

    // 1. Decode raw pixel data in memory
    const rawData = new ImageData(origWidth, origHeight);
    await new Promise((resolve, reject) => {
      primaryImage.display(rawData, (displayData) => {
        if (!displayData) return reject(new Error('HEIF display rendering failed'));
        resolve();
      });
    });

    // 2. Put raw frame onto a source OffscreenCanvas
    const srcCanvas = new OffscreenCanvas(origWidth, origHeight);
    const srcCtx = srcCanvas.getContext('2d');
    srcCtx.putImageData(rawData, 0, 0);

    // 3. Compute 4K Downscaling Dimensions
    const MAX_WIDTH = 3840;
    const MAX_HEIGHT = 2160;
    let targetWidth = origWidth;
    let targetHeight = origHeight;

    if (targetWidth > MAX_WIDTH || targetHeight > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / targetWidth, MAX_HEIGHT / targetHeight);
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }

    // 4. Downscale directly on background thread
    const outCanvas = new OffscreenCanvas(targetWidth, targetHeight);
    const outCtx = outCanvas.getContext('2d');
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(srcCanvas, 0, 0, targetWidth, targetHeight);

    // 5. Compress to final JPEG Blob inside worker
    const blob = await outCanvas.convertToBlob({ type: 'image/jpeg', quality: 0.90 });

    self.postMessage({ success: true, blob });
  } catch (err) {
    self.postMessage({ success: false, error: err.message || String(err) });
  }
};