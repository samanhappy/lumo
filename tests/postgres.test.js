import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, chmodSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { openDatabase } from '../database.js';

test('PostgreSQL persists data, protects concurrent writes, rolls back batches and imports SQLite', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const { Pool } = await import('pg');
  const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const schema = `lumo_test_${crypto.randomUUID().replaceAll('-', '')}`;
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set('options', `-c search_path=${schema}`);
  const previousURL = process.env.DATABASE_URL;
  const dir = mkdtempSync(join(tmpdir(), 'lumo-pg-'));
  let db;
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    process.env.DATABASE_URL = url.toString();
    db = await openDatabase();
    await db.health();
    assert.equal(await db.save('lumo:daily_task', [{ title: '数学 P32', completed: false }], 0), 1);
    await db.migrate({ 'lumo:daily_task': [], 'lumo:iv:local-student': { mastery: {}, active: null, sessions: [], attempts: [] } });
    assert.equal((await db.snapshot())['lumo:daily_task'].value[0].title, '数学 P32');
    const writes = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => db.save('lumo:daily_task', [{ title: `页面 ${i}` }], 1)));
    assert.equal(writes.filter(result => result.status === 'fulfilled').length, 1);
    for (const result of writes.filter(result => result.status === 'rejected')) assert.equal(result.reason.status, 409);
    await assert.rejects(db.save('invalid', {}, 0), { status: 400 });
    await assert.rejects(db.migrate({ 'lumo:student_app': { inserted: true }, 'lumo:iv:bad': { invalid: 1n } }), /BigInt/);
    assert.equal((await db.snapshot())['lumo:student_app'], undefined);
    await db.close(); db = await openDatabase();
    assert.equal((await db.snapshot())['lumo:daily_task'].revision, 2);
    const path = join(dir, 'source.sqlite');
    const source = await openDatabase(path);
    source.migrate({ 'lumo:daily_task': [], 'lumo:student_app': { imported: true } });
    source.close();
    const bytes = readFileSync(path);
    chmodSync(path, 0o400); chmodSync(dir, 0o500);
    for (let i = 0; i < 2; i++) execFileSync(process.execPath, ['scripts/migrate-postgres.js', path], { env: process.env, stdio: 'pipe' });
    const snapshot = await db.snapshot();
    assert.equal(snapshot['lumo:student_app'].value.imported, true);
    assert.equal(snapshot['lumo:daily_task'].revision, 2);
    assert.deepEqual(readFileSync(path), bytes);
  } finally {
    await db?.close();
    await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.end();
    if (previousURL === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousURL;
    chmodSync(dir, 0o700);
    rmSync(dir, { recursive: true, force: true });
  }
});
