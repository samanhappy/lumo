// Each owner persists its own data; failed writes never replace saved state.
export function read(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch { return fallback; }
}
export function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('无法保存数据，请检查浏览器存储空间或隐私设置后重试。'); }
}
