/*
  Helper scan barcode dari gambar/video frame.
  Dipakai oleh inputBarang.js.
*/

function detectBarcodeFromImageLike(imgOrCanvas, formats) {
  return new Promise(async (resolve) => {
    try {
      if (!window.BarcodeDetector) {
        resolve(null);
        return;
      }

      const detector = new window.BarcodeDetector({
        formats: formats || undefined,
      });
      const results = await detector.detect(imgOrCanvas);
      if (results && results.length) {
        resolve(results[0].rawValue || results[0].data || null);
      } else {
        resolve(null);
      }
    } catch {
      resolve(null);
    }
  });
}

// export global (tanpa module bundler)
window.detectBarcodeFromImageLike = detectBarcodeFromImageLike;
