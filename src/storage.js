let records;
let pending = Promise.resolve();
const saving = new Set();
async function request(path, body) {
  try {
    const response = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await response.json();
    if (response.status === 401 && typeof location !== 'undefined') location.replace('/login');
    if (!response.ok) throw new Error(result.error || '无法保存数据。');
    return result;
  } catch (error) { throw new Error(error.message === 'Failed to fetch' ? '无法连接数据库，请检查服务后重试。' : error.message); }
}
export async function initializeStorage(account) {
  records = await request('/api/storage');
  const legacy = {};
  // Browser privacy settings must not block access to existing server data.
  try { for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (['lumo:daily_task', 'lumo:student_app'].includes(key) || /^lumo:iv:[a-zA-Z0-9_-]{1,80}$/.test(key)) {
      try { const value = JSON.parse(localStorage.getItem(key)); if (value && typeof value === 'object' && !records[key]) legacy[key] = value; } catch {}
    }
  }
  } catch {}
  if ((!account || (account.role === 'student' && account.student.id === 'local-student')) && Object.keys(legacy).length) records = await request('/api/storage/migrate', legacy);
}
export function read(key, fallback) {
  if (records) return structuredClone(records[key]?.value ?? fallback);
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function write(key, value) {
  // Keep the pure-module test harness usable without a running server.
  if (!records) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { throw new Error('无法保存数据，请检查浏览器存储空间或隐私设置后重试。'); }
    return;
  }
  if (saving.has(key)) throw new Error('正在保存，请稍后重试。');
  const saved = structuredClone(value);
  saving.add(key);
  const operation = pending.catch(() => {}).then(async () => {
    const result = await request('/api/storage', { key, value: saved, revision: records[key]?.revision || 0 });
    records[key] = { value: saved, revision: result.revision };
  });
  pending = operation;
  return operation.finally(() => saving.delete(key));
}
