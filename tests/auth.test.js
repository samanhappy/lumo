import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuth, scopedKey, studentSnapshot } from '../auth.js';
import { openDatabase } from '../database.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('preconfigured login, session logout, student isolation and parent write permissions', async () => {
  const auth = createAuth(JSON.stringify([
    {username:'alice',password:'password-a',role:'student',studentId:'alice',name:'Alice'},
    {username:'bob',password:'password-b',role:'student',studentId:'bob',name:'Bob'},
    {username:'parent',password:'password-p',role:'parent',studentId:'alice',name:'Parent'}
  ]));
  await assert.rejects(auth.login({username:'alice',password:'wrong'},'ip'),{status:401});
  const a = await auth.login({username:'alice',password:'password-a'},'ip');
  assert.equal(a.user.password,undefined);
  const request={headers:{cookie:`lumo_session=${a.token}`}};
  assert.equal(auth.user(request).student.id,'alice');
  assert.throws(()=>auth.user({headers:{}}),{status:401});
  const b=await auth.login({username:'bob',password:'password-b'},'ip');
  const p=await auth.login({username:'parent',password:'password-p'},'ip');
  assert.throws(()=>scopedKey(a.user,'lumo:iv:bob'),{status:403});
  assert.throws(()=>scopedKey(a.user,'lumo:daily_task',[{student_id:'bob'}],true),{status:403});
  assert.throws(()=>scopedKey(p.user,'lumo:iv:alice',{},true),{status:403});
  assert.throws(()=>scopedKey(p.user,'lumo:student_app',{},true),{status:403});
  const dir=await mkdtemp(join(tmpdir(),'lumo-auth-')), db=await openDatabase(join(dir,'test.sqlite'));
  try {
    const key=scopedKey(p.user,'lumo:daily_task',[{student_id:'alice',title:'homework'}],true);
    await db.save(key,[{student_id:'alice',title:'homework'}],0);
    await db.save(scopedKey(a.user,'lumo:iv:alice'),{mastery:{}},0);
    assert.equal((await studentSnapshot(db,p.user))['lumo:daily_task'].value[0].title,'homework');
    assert.deepEqual(await studentSnapshot(db,b.user),{});
    assert.throws(()=>db.save(key,[],0),{status:409});
  } finally {await db.close();await rm(dir,{recursive:true,force:true});}
  auth.logout(request);assert.throws(()=>auth.user(request),{status:401});
  for(let i=0;i<10;i++)await assert.rejects(auth.login({username:'missing',password:'wrong'},'blocked'),{status:401});
  await assert.rejects(auth.login({username:'alice',password:'password-a'},'blocked'),{status:429});
  assert.throws(()=>createAuth('[{"username":"bad"}]'));
});
