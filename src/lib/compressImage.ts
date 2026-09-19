// Canvas-based client-side compression — resizes to maxDim and steps down JPEG
// quality until under maxSizeKB (or gives up after a few tries). No extra dependency.
export async function compressImageToDataUrl(file: File, maxDim = 800, maxSizeKB = 500): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = 0.9;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  while (dataUrl.length * 0.75 / 1024 > maxSizeKB && quality > 0.2) {
    quality -= 0.15;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  return dataUrl;
}
