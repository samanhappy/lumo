import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../database.js';

test('SQLite survives reopening, migrates without overwriting and rejects stale writes', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'lumo-db-'));
  const path = join(dir, 'test.sqlite');
  let db = await openDatabase(path);
  const originalFetch = globalThis.fetch;
  try {
    db.migrate({ 'lumo:daily_task': [{ title: '原作业' }], 'lumo:iv:local-student': { mastery: {}, sessions: [], attempts: [], active: null } });
    db.migrate({ 'lumo:daily_task': [] });
    assert.equal(db.snapshot()['lumo:daily_task'].value.length, 1);
    assert.throws(() => db.save('lumo:daily_task', [], 0), { status: 409 });
    assert.throws(() => db.save('untrusted', {}, 0), { status: 400 });
    assert.throws(() => db.migrate({ 'lumo:student_app': {}, invalid: [] }), { status: 400 });
    assert.equal(db.snapshot()['lumo:student_app'], undefined);
    db.close(); db = await openDatabase(path);
    assert.equal(db.snapshot()['lumo:daily_task'].value[0].title, '原作业');
    globalThis.localStorage = { length: 1, key: () => 'lumo:student_app', getItem: () => '{"migrated":true}' };
    let fail = false;
    globalThis.fetch = async (url, options) => {
      if (fail) return Response.json({ error: '保存失败' }, { status: 500 });
      try {
        const input = options && JSON.parse(options.body);
        return Response.json(!options ? db.snapshot() : url.endsWith('migrate') ? db.migrate(input) : { revision: db.save(input.key, input.value, input.revision) });
      } catch (error) { return Response.json({ error: error.message }, { status: error.status }); }
    };
    const { initializeStorage, read, write } = await import('../src/storage.js');
    await initializeStorage();
    assert.equal(read('lumo:student_app', {}).migrated, true);
    fail = true;
    await assert.rejects(write('lumo:daily_task', []), /保存失败/);
    assert.equal(read('lumo:daily_task', []).length, 1);
    fail = false;
    const saving = write('lumo:daily_task', []);
    assert.throws(() => write('lumo:daily_task', []), /正在保存/);
    await saving;
    db.save('lumo:daily_task', [{ title: '另一页面' }], 2);
    await assert.rejects(write('lumo:daily_task', []), /刷新/);
    await initializeStorage();
    assert.equal(read('lumo:daily_task', [])[0].title, '另一页面');
  } finally { globalThis.fetch = originalFetch; db.close(); rmSync(dir, { recursive: true, force: true }); }
});
