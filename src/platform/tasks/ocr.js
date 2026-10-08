export function validatePhoto(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('请选择 JPG、PNG 或 WebP 图片。HEIC 照片请先转换为 JPG。');
  }
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error('图片大小需要在 20 MB 以内。');
}

async function photoCanvas(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    try { await image.decode(); }
    catch { throw new Error('无法读取这张图片，请重新拍照或选择其他图片。'); }
    if (image.naturalWidth * image.naturalHeight > 40_000_000) {
      throw new Error('图片尺寸过大，请裁剪到作业区域后重试。');
    }
    const scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally { URL.revokeObjectURL(url); }
}

export async function recognizePhoto(file, { signal, onProgress = () => {} } = {}) {
  validatePhoto(file);
  if (signal?.aborted) throw new DOMException('已取消识别', 'AbortError');
  let canvas;
  try {
    onProgress('正在准备图片…');
    canvas = await photoCanvas(file);
    const data = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    if (data.length > 4 * 1024 * 1024) throw new Error('处理后的图片超过 3 MB，请裁剪到作业区域后重试。');
    if (signal?.aborted) throw new DOMException('已取消识别', 'AbortError');
    onProgress('正在使用模型识别作业…');
    const response = await fetch('/api/homework/recognize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mimeType: 'image/jpeg', data }), signal
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '图片识别失败，请重试。');
    return result;
  } finally { if (canvas) canvas.width = canvas.height = 0; }
}
