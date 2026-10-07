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
  let worker, canvas, timer, abort, stopped = false;
  const stop = () => worker?.terminate().catch(() => {});
  const interrupted = new Promise((_, reject) => {
    abort = () => { stopped = true; stop(); reject(new DOMException('已取消识别', 'AbortError')); };
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => { stopped = true; stop(); reject(new Error('识别用时过长，请裁剪到作业区域后重试。')); }, 120_000);
  });
  const recognition = async () => {
    if (signal?.aborted) throw new DOMException('已取消识别', 'AbortError');
    canvas = await photoCanvas(file);
    if (stopped) { canvas.width = canvas.height = 0; throw new DOMException('已取消识别', 'AbortError'); }
    const { default: Tesseract } = await import('/node_modules/tesseract.js/dist/tesseract.esm.min.js');
    if (stopped) throw new DOMException('已取消识别', 'AbortError');
    worker = await Tesseract.createWorker(['chi_sim', 'eng'], 1, {
      workerPath: '/node_modules/tesseract.js/dist/worker.min.js',
      corePath: '/node_modules/tesseract.js-core',
      langPath: '/public/ocr',
      workerBlobURL: false,
      logger: ({ status, progress }) => onProgress(status === 'recognizing text'
        ? `正在识别文字… ${Math.round(progress * 100)}%` : '正在准备识别…'),
      errorHandler: () => {}
    });
    if (stopped) { await worker.terminate(); throw new DOMException('已取消识别', 'AbortError'); }
    await worker.setParameters({ tessedit_pageseg_mode: '3' });
    const { data } = await worker.recognize(canvas);
    return data.text.replace(/([\p{Script=Han}])[ \t]+(?=[\p{Script=Han}])/gu, '$1').trim();
  };
  try { return await Promise.race([recognition(), interrupted]); }
  finally {
    stopped = true;
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    await stop();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
