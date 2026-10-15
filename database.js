import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const validKey = key => typeof key === 'string' && (/^student:[a-zA-Z0-9_-]{1,80}:lumo:(daily_task|student_app|iv:[a-zA-Z0-9_-]{1,80}|practice:(english-vocabulary|chinese-words|classical-poetry):[a-zA-Z0-9_-]{1,80})$/.test(key) || ['lumo:daily_task', 'lumo:student_app'].includes(key) || /^lumo:iv:[a-zA-Z0-9_-]{1,80}$/.test(key));
function validateWrite(key, value, revision) {
  if (!validKey(key) || value === null || typeof value !== 'object' || !Number.isSafeInteger(revision) || revision < 0) throw Object.assign(new Error('无效的存储数据。'), { status: 400 });
}
function validateMigration(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values) || Object.keys(values).some(key => !validKey(key) || !values[key] || typeof values[key] !== 'object')) throw Object.assign(new Error('无效的迁移数据。'), { status: 400 });
}
const conflict = () => Object.assign(new Error('数据已在其他页面更新，请刷新后重试。'), { status: 409 });

export async function openDatabase(path) {
  if (path === undefined && (process.env.DATABASE_URL || process.env.PGHOST)) return openPostgres();
  path ??= process.env.LUMO_DB_PATH || resolve('data/lumo.sqlite');
  const { DatabaseSync } = await import('node:sqlite');
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS app_data (key TEXT PRIMARY KEY, value TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1)');
  db.exec('CREATE TABLE IF NOT EXISTS auth_users (id INTEGER PRIMARY KEY, value TEXT NOT NULL, revision INTEGER NOT NULL)');
  db.exec('CREATE TABLE IF NOT EXISTS auth_sessions (token TEXT PRIMARY KEY, username TEXT NOT NULL, credential TEXT NOT NULL, expires BIGINT NOT NULL)');
  return {
    getUsers() { const row = db.prepare('SELECT value,revision FROM auth_users WHERE id=1').get(); return row && { value: JSON.parse(row.value), revision: row.revision }; },
    saveUsers(value, revision) {
      const result = revision === 0 ? db.prepare('INSERT OR IGNORE INTO auth_users VALUES (1,?,1)').run(JSON.stringify(value)) : db.prepare('UPDATE auth_users SET value=?,revision=revision+1 WHERE id=1 AND revision=?').run(JSON.stringify(value), revision);
      if (!result.changes) throw conflict();
    },
    createSession(token, username, credential, expires) {
      db.prepare('DELETE FROM auth_sessions WHERE expires <= ?').run(Date.now());
      if (db.prepare('SELECT COUNT(*) AS count FROM auth_sessions').get().count >= 1000) throw Object.assign(new Error('登录会话过多，请稍后重试。'), { status: 429 });
      db.prepare('INSERT INTO auth_sessions VALUES (?,?,?,?)').run(token, username, credential, expires);
    },
    getSession(token) { return db.prepare('SELECT username,credential FROM auth_sessions WHERE token=? AND expires>?').get(token, Date.now()); },
    deleteSession(token) { db.prepare('DELETE FROM auth_sessions WHERE token=?').run(token); },
    snapshot() { return Object.fromEntries(db.prepare('SELECT * FROM app_data').all().map(row => [row.key, { value: JSON.parse(row.value), revision: row.revision }])); },
    save(key, value, revision) {
      validateWrite(key, value, revision);
      const json = JSON.stringify(value);
      const result = revision === 0
        ? db.prepare('INSERT OR IGNORE INTO app_data(key,value) VALUES (?,?)').run(key, json)
        : db.prepare('UPDATE app_data SET value=?,revision=revision+1 WHERE key=? AND revision=?').run(json, key, revision);
      if (!result.changes) throw conflict();
      return revision + 1;
    },
    migrate(values) {
      validateMigration(values);
      db.exec('BEGIN');
      try { for (const [key, value] of Object.entries(values)) db.prepare('INSERT OR IGNORE INTO app_data(key,value) VALUES (?,?)').run(key, JSON.stringify(value)); db.exec('COMMIT'); }
      catch (error) { db.exec('ROLLBACK'); throw error; }
      return this.snapshot();
    },
    health() { db.prepare('SELECT 1').get(); },
    close() { db.close(); }
  };
}

async function openPostgres() {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000, statement_timeout: 10000 });
  pool.on('error', () => console.error('PostgreSQL 空闲连接中断，后续请求将重新连接。'));
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS app_data (key TEXT PRIMARY KEY, value JSONB NOT NULL, revision INTEGER NOT NULL DEFAULT 1)');
    await pool.query('CREATE TABLE IF NOT EXISTS auth_users (id INTEGER PRIMARY KEY, value JSONB NOT NULL, revision INTEGER NOT NULL)');
    await pool.query('CREATE TABLE IF NOT EXISTS auth_sessions (token TEXT PRIMARY KEY, username TEXT NOT NULL, credential TEXT NOT NULL, expires BIGINT NOT NULL)');
  }
  catch (error) { await pool.end(); throw error; }
  return {
    async getUsers() { return (await pool.query('SELECT value,revision FROM auth_users WHERE id=1')).rows[0]; },
    async saveUsers(value, revision) {
      const result = revision === 0 ? await pool.query('INSERT INTO auth_users VALUES (1,$1::jsonb,1) ON CONFLICT (id) DO NOTHING', [JSON.stringify(value)]) : await pool.query('UPDATE auth_users SET value=$1::jsonb,revision=revision+1 WHERE id=1 AND revision=$2', [JSON.stringify(value), revision]);
      if (!result.rowCount) throw conflict();
    },
    async createSession(token, username, credential, expires) {
      await pool.query('DELETE FROM auth_sessions WHERE expires <= $1', [Date.now()]);
      const result = await pool.query('INSERT INTO auth_sessions (token,username,credential,expires) SELECT $1,$2,$3,$4 WHERE (SELECT COUNT(*) FROM auth_sessions) < 1000', [token, username, credential, expires]);
      if (!result.rowCount) throw Object.assign(new Error('登录会话过多，请稍后重试。'), { status: 429 });
    },
    async getSession(token) { return (await pool.query('SELECT username,credential FROM auth_sessions WHERE token=$1 AND expires>$2', [token, Date.now()])).rows[0]; },
    async deleteSession(token) { await pool.query('DELETE FROM auth_sessions WHERE token=$1', [token]); },
    async snapshot() {
      const { rows } = await pool.query('SELECT key,value,revision FROM app_data');
      return Object.fromEntries(rows.map(row => [row.key, { value: row.value, revision: row.revision }]));
    },
    async save(key, value, revision) {
      validateWrite(key, value, revision);
      const json = JSON.stringify(value);
      const result = revision === 0
        ? await pool.query('INSERT INTO app_data(key,value) VALUES ($1,$2::jsonb) ON CONFLICT (key) DO NOTHING', [key, json])
        : await pool.query('UPDATE app_data SET value=$1::jsonb,revision=revision+1 WHERE key=$2 AND revision=$3', [json, key, revision]);
      if (!result.rowCount) throw conflict();
      return revision + 1;
    },
    async migrate(values) {
      validateMigration(values);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const [key, value] of Object.entries(values)) await client.query('INSERT INTO app_data(key,value) VALUES ($1,$2::jsonb) ON CONFLICT (key) DO NOTHING', [key, JSON.stringify(value)]);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
      return this.snapshot();
    },
    async health() { await pool.query('SELECT 1'); },
    async close() { await pool.end(); }
  };
}
