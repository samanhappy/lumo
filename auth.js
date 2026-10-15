import { validGrade } from './src/platform/grades.js';
import { createHash, randomBytes, scryptSync, scrypt as derive, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(derive);
const fail = (message, status) => Object.assign(new Error(message), { status });
export function createAuth(raw = process.env.LUMO_USERS, store) {
  if (!raw && process.env.NODE_ENV === 'production') throw new Error('生产环境必须配置 LUMO_USERS。');
  const config = JSON.parse(raw || '[{"username":"admin","password":"admin123","role":"admin","name":"管理员"},{"username":"student","password":"student123","role":"student","studentId":"local-student","name":"小雨"},{"username":"parent","password":"parent123","role":"parent","studentId":"local-student","name":"小雨家长"}]');
  if (!Array.isArray(config) || !config.length || config.length > 100) throw new Error('账号配置无效。');
  const users = new Map();
  for (const u of config) {
    if (!u || !/^[a-zA-Z0-9_-]{1,40}$/.test(u.username) || users.has(u.username) || !['student','parent','admin'].includes(u.role) || (u.role !== 'admin' && !/^[a-zA-Z0-9_-]{1,80}$/.test(u.studentId)) || typeof u.password !== 'string' || u.password.length < 8 || u.password.length > 128 || typeof u.name !== 'string' || !u.name.trim() || u.name.length > 40) throw new Error('账号配置无效：用户名唯一，密码至少 8 位，需指定角色、姓名与 studentId。');
    if (u.role === 'student' && !validGrade(u.grade ?? '')) throw new Error('学生年级无效。');
    const salt = randomBytes(16); users.set(u.username, { ...u, password: undefined, credential: scryptSync(JSON.stringify([u.password, u.role, u.studentId]), u.username, 32).toString('hex'), salt, hash: scryptSync(u.password, salt, 32) });
  }
  for (const u of users.values()) if (u.role === 'parent' && ![...users.values()].some(s => s.role === 'student' && s.studentId === u.studentId)) throw new Error('家长必须关联已配置的学生。');
  // Tests without a database use process-local sessions.
  const sessions = new Map(), failures = new Map();
  const publicUser = u => {
    const student = [...users.values()].find(s => s.role === 'student' && s.studentId === u.studentId);
    return { username:u.username, name:u.name, role:u.role, student:u.role === 'admin' ? null : { id:u.studentId, name:student?.name || '', grade:student?.grade || '' } };
  };
  const configured = new Map(users);
  let overrides = {}, revision = 0;
  async function refresh() {
    if (store) { const saved = await store.getUsers(); overrides = saved?.value || {}; revision = saved?.revision || 0; }
    users.clear(); for (const [key, value] of configured) users.set(key, value);
    for (const [key, value] of Object.entries(overrides)) users.set(key, { ...value, salt: Buffer.from(value.salt, 'hex'), hash: Buffer.from(value.hash, 'hex') });
  }
  const safeUser = u => ({ username:u.username, name:u.name, role:u.role, studentId:u.studentId || '', disabled:!!u.disabled, grade:u.role === 'student' ? u.grade || '' : '' });
  const digest = token => createHash('sha256').update(token).digest('hex');
  const dummy = randomBytes(16);
  function prune() { const now = Date.now(); for (const [k,v] of sessions) if (v.expires <= now) sessions.delete(k); for (const [k,v] of failures) if (v.until <= now) failures.delete(k); }
  return {
    async login(input, address) {
      await refresh(); prune();
      if (!input || typeof input.username !== 'string' || typeof input.password !== 'string' || input.username.length > 40 || input.password.length > 128) throw fail('用户名或密码错误。', 401);
      const key = address; const attempt = failures.get(key) || { count: 0, until: Date.now() + 600000 };
      if (attempt.count >= 10) throw fail('尝试次数过多，请 10 分钟后重试。', 429);
      attempt.count++; failures.set(key, attempt);
      const u = users.get(input.username), hash = await scrypt(input.password, u?.salt || dummy, 32);
      if (!u || u.disabled || !timingSafeEqual(hash, u.hash)) throw fail('用户名或密码错误。', 401);
      failures.delete(key);
      if (sessions.size >= 1000) throw fail('登录会话过多，请稍后重试。', 429);
      const token = randomBytes(32).toString('hex'), expires = Date.now() + 43200000;
      if (store) await store.createSession(digest(token), u.username, u.credential, expires);
      else sessions.set(token, { username: u.username, credential: u.credential, expires });
      return { token, user: publicUser(u) };
    },
    token(req) { return /(?:^|;\s*)lumo_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1]; },
    async user(req) {
      await refresh();
      const token = this.token(req);
      if (store) {
        const session = token && await store.getSession(digest(token)), u = session && users.get(session.username);
        if (!u || u.disabled || session.credential !== u.credential) throw fail('请先登录。', 401);
        return publicUser(u);
      }
      prune(); const session = sessions.get(this.token(req)), u = session && users.get(session.username); if (!u || u.disabled || session.credential !== u.credential) throw fail('请先登录。', 401); return publicUser(u); },
    async listUsers(req) {
      const actor = await this.user(req); if (actor.role !== 'admin') throw fail('仅管理员可以管理用户。', 403);
      return [...users.values()].map(safeUser);
    },
    async saveUser(req, input) {
      const actor = await this.user(req); if (actor.role !== 'admin') throw fail('仅管理员可以管理用户。', 403);
      if (!input || typeof input.username !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(input.username) || (input.create !== undefined && typeof input.create !== 'boolean')) throw fail('用户名格式无效。', 400);
      const expectedRevision = revision, previousOverrides = overrides;
      const existing = users.get(input.username);
      if (input.create && existing) throw fail('用户名已存在。', 409);
      if (!input.create && !existing) throw fail('用户不存在。', 404);
      const u = { username:input.username, name:input.name, role:input.role, studentId:input.role === 'admin' ? '' : input.studentId, disabled:input.disabled ?? false, grade:input.role === 'student' ? input.grade ?? existing?.grade ?? '' : '' };
      if (typeof u.name !== 'string' || !u.name.trim() || u.name.length > 40 || !['admin','student','parent'].includes(u.role) || typeof u.disabled !== 'boolean' || (u.role !== 'admin' && (typeof u.studentId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(u.studentId)))) throw fail('请填写有效的姓名、角色和学生 ID。', 400);
      if (!validGrade(u.grade)) throw fail('请选择有效的学生年级。', 400);
      if (u.username === actor.username && (u.role !== 'admin' || u.disabled)) throw fail('不能停用自己或移除自己的管理员权限。', 400);
      const candidates = [...users.values()].filter(v => v.username !== u.username).concat(u);
      if (candidates.length > 100) throw fail('最多支持 100 个账号。', 400);
      if (candidates.some(v => v.role === 'parent' && !v.disabled && !candidates.some(s => s.role === 'student' && !s.disabled && s.studentId === v.studentId))) throw fail('家长必须关联有效的学生账号。', 400);
      if (input.password !== undefined && input.password !== '' && (typeof input.password !== 'string' || input.password.length < 8 || input.password.length > 128)) throw fail('密码需为 8 至 128 位。', 400);
      if (!existing && !input.password) throw fail('新用户必须设置密码。', 400);
      const salt = input.password ? randomBytes(16) : existing.salt;
      const hash = input.password ? await scrypt(input.password, salt, 32) : existing.hash;
      const next = { ...previousOverrides, [u.username]: { ...u, salt:salt.toString('hex'), hash:hash.toString('hex'), credential:randomBytes(32).toString('hex') } };
      if (store) await store.saveUsers(next, expectedRevision);
      else { if (revision !== expectedRevision) throw fail('数据已在其他页面更新，请刷新后重试。', 409); revision++; }
      overrides = next; await refresh(); return safeUser(users.get(u.username));
    },
    async logout(req) { const token = this.token(req); if (store && token) await store.deleteSession(digest(token)); else sessions.delete(token); }
  };
}
export function scopedKey(user, key, value, writing = false) {
  if (!user.student || user.role === 'admin') throw fail('管理员不能访问学生学习数据。', 403);
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
  scopedKey(user, 'lumo:daily_task');
  const all = await database.snapshot(), result = {};
  for (const key of ['lumo:daily_task','lumo:student_app',`lumo:iv:${user.student.id}`]) {
    const scoped = scopedKey(user, key);
    if (all[scoped]) result[key] = all[scoped];
  }
  return result;
}
