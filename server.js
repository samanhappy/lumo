import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './database.js';
import { createAuth, scopedKey, studentSnapshot } from './auth.js';
const auth = createAuth();
let database;
try { database = await openDatabase(); } catch { console.error('数据库初始化失败，请检查连接配置与数据库状态。'); process.exit(1); }
const legacy = await database.snapshot(), imported = {};
for (const key of ['lumo:daily_task','lumo:student_app','lumo:iv:local-student']) if (legacy[key]) {
  let value = legacy[key].value;
  if (key === 'lumo:daily_task') value = Array.isArray(value) ? value.filter(t => t.student_id === 'local-student') : [];
  if (key === 'lumo:student_app') value = Object.fromEntries(Object.entries(value).filter(([,v]) => v?.student_id === 'local-student'));
  imported[`student:local-student:${key}`] = value;
}
if (Object.keys(imported).length) await database.migrate(imported);
const root = fileURLToPath(new URL('.', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      try {
        if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) throw Object.assign(new Error('请求来源无效。'), { status: 403 });
        if (req.method === 'GET' && pathname === '/api/health') { await database.health(); res.end(JSON.stringify({ status: 'ok' })); return; }
        if (req.method === 'GET' && pathname === '/api/auth/me') { res.end(JSON.stringify(auth.user(req))); return; }
        const user = pathname === '/api/auth/login' ? null : auth.user(req);
        if (req.method === 'GET' && pathname === '/api/storage') { res.end(JSON.stringify(await studentSnapshot(database, user))); return; }
        if (req.method !== 'POST' || !['/api/storage', '/api/storage/migrate', '/api/auth/login', '/api/auth/logout'].includes(pathname)) { res.writeHead(404).end(JSON.stringify({ error: '接口不存在。' })); return; }
        if (!req.headers['content-type']?.startsWith('application/json')) throw Object.assign(new Error('请使用 JSON 数据。'), { status: 415 });
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > 5 * 1024 * 1024) throw Object.assign(new Error('数据超过 5 MB，请减少记录。'), { status: 413 }); chunks.push(chunk); }
        let input; try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(new Error('无效的 JSON。'), { status: 400 }); }
        const cookie = token => `lumo_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token ? 43200 : 0}${process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''}`;
        if (pathname === '/api/auth/login') { const login = await auth.login(input, req.socket.remoteAddress); res.setHeader('Set-Cookie', cookie(login.token)); res.end(JSON.stringify(login.user)); return; }
        if (pathname === '/api/auth/logout') { auth.logout(req); res.setHeader('Set-Cookie', cookie('')); res.end('{}'); return; }
        let result;
        if (pathname.endsWith('/migrate')) {
          if (user.role !== 'student' || user.student.id !== 'local-student') throw Object.assign(new Error('该账号不能导入旧版数据。'), { status: 403 });
          if (!input || typeof input !== 'object' || Array.isArray(input)) throw Object.assign(new Error('无效的迁移数据。'), { status: 400 });
          const values = {}; for (const [key,value] of Object.entries(input)) values[scopedKey(user,key,value,true)] = value;
          await database.migrate(values); result = await studentSnapshot(database,user);
        } else result = { revision: await database.save(scopedKey(user, input?.key, input?.value, true), input?.value, input?.revision) };
        res.end(JSON.stringify(result));
      } catch (error) { res.writeHead(error.status || 500).end(JSON.stringify({ error: error.status ? error.message : '数据库保存失败，请重试。' })); }
      return;
    }
    if (!(pathname === '/' || pathname === '/index.html' || pathname === '/today' || pathname === '/login' || pathname.startsWith('/apps/') || pathname.startsWith('/src/') || pathname.startsWith('/public/ocr/') || pathname.startsWith('/node_modules/')) || pathname.includes('.sqlite')) { res.writeHead(403).end(); return; }
    const path = resolve(root, '.' + pathname);
    if (pathname.includes('..') || (path !== resolve(root) && !path.startsWith(root.endsWith(sep) ? root : root + sep))) { res.writeHead(403).end(); return; }
    const file = extname(pathname) ? path : resolve(root, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(Number(process.env.PORT) || 5173, '0.0.0.0', () => console.log('Lumo: http://localhost:' + (process.env.PORT || 5173)));

for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  const timeout = setTimeout(() => process.exit(1), 10000).unref();
  server.close(async () => { try { await database.close(); clearTimeout(timeout); } catch { process.exitCode = 1; } });
  server.closeIdleConnections();
});
