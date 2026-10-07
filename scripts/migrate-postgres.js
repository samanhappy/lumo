import { access, copyFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../database.js';

if (!process.env.DATABASE_URL && !process.env.PGHOST) throw new Error('请先配置 DATABASE_URL 或 PGHOST，指定 PostgreSQL 目标数据库。');
const path = resolve(process.argv[2] || process.env.LUMO_DB_PATH || 'data/lumo.sqlite');
await access(path); // Do not silently create an empty source database.
const temp = await mkdtemp(join(tmpdir(), 'lumo-migrate-'));
let source, target;
try {
  // Stop the source app before copying. WAL readers need a writable directory for their temporary index.
  const copy = join(temp, 'source.sqlite');
  await copyFile(path, copy);
  try { await copyFile(path + '-wal', copy + '-wal'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  source = new DatabaseSync(copy, { readOnly: true });
  const values = Object.fromEntries(source.prepare('SELECT key,value FROM app_data').all().map(row => [row.key, JSON.parse(row.value)]));
  target = await openDatabase();
  await target.migrate(values);
  console.log(`迁移完成：检查 ${Object.keys(values).length} 个数据键；目标已有键保留，源 SQLite 文件未删除。`);
} finally {
  source?.close();
  await target?.close();
  await rm(temp, { recursive: true, force: true });
}
