import { randomBytes, scryptSync, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(derive);
const fail = (message, status) => Object.assign(new Error(message), { status });
export function createAuth(raw = process.env.LUMO_USERS) {
  if (!raw && process.env.NODE_ENV === 'production') throw new Error('生产环境必须配置 LUMO_USERS。');
  const config = JSON.parse(raw || '[{"username":"student","password":"student123","role":"student","studentId":"local-student","name":"小雨"},{"username":"parent","password":"parent123","role":"parent","studentId":"local-student","name":"小雨家长"}]');
  if (!Array.isArray(config) || !config.length || config.length > 100) throw new Error('账号配置无效。');
  const users = new Map();
  for (const u of config) {
    if (!u || !/^[a-zA-Z0-9_-]{1,40}$/.test(u.username) || users.has(u.username) || !['student','parent'].includes(u.role) || !/^[a-zA-Z0-9_-]{1,80}$/.test(u.studentId) || typeof u.password !== 'string' || u.password.length < 8 || u.password.length > 128 || typeof u.name !== 'string' || !u.name.trim() || u.name.length > 40) throw new Error('账号配置无效：用户名唯一，密码至少 8 位，需指定角色、姓名与 studentId。');
    const salt = randomBytes(16); users.set(u.username, { ...u, password: undefined, salt, hash: scryptSync(u.password, salt, 32) });
  }
  for (const u of users.values()) if (![...users.values()].some(s => s.role === 'student' && s.studentId === u.studentId)) throw new Error('家长必须关联已配置的学生。');
  // ponytail: process-local sessions; use a shared session store when deploying multiple app replicas.
  const sessions = new Map(), failures = new Map();
  const publicUser = u => ({ username: u.username, name: u.name, role: u.role, student: { id: u.studentId, name: [...users.values()].find(s => s.role === 'student' && s.studentId === u.studentId).name, grade: '' } });
  const dummy = randomBytes(16);
  function prune() { const now = Date.now(); for (const [k,v] of sessions) if (v.expires <= now) sessions.delete(k); for (const [k,v] of failures) if (v.until <= now) failures.delete(k); }
  return {
    async login(input, address) {
      prune();
      if (!input || typeof input.username !== 'string' || typeof input.password !== 'string' || input.username.length > 40 || input.password.length > 128) throw fail('用户名或密码错误。', 401);
      const key = address; const attempt = failures.get(key) || { count: 0, until: Date.now() + 600000 };
      if (attempt.count >= 10) throw fail('尝试次数过多，请 10 分钟后重试。', 429);
      attempt.count++; failures.set(key, attempt);
      const u = users.get(input.username), hash = await scrypt(input.password, u?.salt || dummy, 32);
      if (!u || !timingSafeEqual(hash, u.hash)) throw fail('用户名或密码错误。', 401);
      failures.delete(key);
      if (sessions.size >= 1000) throw fail('登录会话过多，请稍后重试。', 429);
      const token = randomBytes(32).toString('hex'); sessions.set(token, { user: publicUser(u), expires: Date.now() + 43200000 });
      return { token, user: publicUser(u) };
    },
    token(req) { return /(?:^|;\s*)lumo_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1]; },
    user(req) { prune(); const session = sessions.get(this.token(req)); if (!session) throw fail('请先登录。', 401); return session.user; },
    logout(req) { sessions.delete(this.token(req)); }
  };
}
export function scopedKey(user, key, value, writing = false) {
  const id = user.student.id;
  if (!['lumo:daily_task', 'lumo:student_app', `lumo:iv:${id}`].includes(key)) throw fail('无权访问该学生数据。', 403);
  if (writing) {
    if (user.role === 'parent' && key !== 'lumo:daily_task') throw fail('家长端不能提交学习记录。', 403);
    if (key === 'lumo:daily_task' && (!Array.isArray(value) || value.some(t => !t || t.student_id !== id))) throw fail('事项必须属于当前学生。', 403);
    if (key === 'lumo:student_app' && (!value || Array.isArray(value) || Object.entries(value).some(([k,v]) => !v || v.student_id !== id || !k.startsWith(id + ':')))) throw fail('学习应用记录不属于当前学生。', 403);
  }
  return `student:${id}:${key}`;
}
export async function studentSnapshot(database, user) {
  const all = await database.snapshot(), result = {};
  for (const key of ['lumo:daily_task','lumo:student_app',`lumo:iv:${user.student.id}`]) {
    const scoped = scopedKey(user, key);
    if (all[scoped]) result[key] = all[scoped];
  }
  return result;
}
