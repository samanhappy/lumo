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
  assert.equal((await auth.user(request)).student.id,'alice');
  await assert.rejects(()=>auth.user({headers:{}}),{status:401});
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
  await auth.logout(request);await assert.rejects(()=>auth.user(request),{status:401});
  for(let i=0;i<10;i++)await assert.rejects(auth.login({username:'missing',password:'wrong'},'blocked'),{status:401});
  await assert.rejects(auth.login({username:'alice',password:'password-a'},'blocked'),{status:429});
  assert.throws(()=>createAuth('[{"username":"bad"}]'));
});

test('database sessions survive restart, expire, revoke logout and reject changed accounts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lumo-session-'));
  const path = join(dir, 'auth.sqlite');
  const raw = JSON.stringify([{username:'alice',password:'password-a',role:'student',studentId:'alice',name:'Alice'}]);
  let db = await openDatabase(path);
  try {
    const login = await createAuth(raw, db).login({username:'alice',password:'password-a'}, 'ip');
    const req = {headers:{cookie:`lumo_session=${login.token}`}};
    await db.close(); db = await openDatabase(path);
    const auth = createAuth(raw, db);
    assert.equal((await auth.user(req)).username, 'alice');
    assert.deepEqual(await db.snapshot(), {});
    await assert.rejects(createAuth(raw.replace('password-a','password-b'), db).user(req), {status:401});
    await assert.rejects(auth.user({headers:{cookie:`lumo_session=${'0'.repeat(64)}`}}), {status:401});
    const { createHash } = await import('node:crypto');
    const expired = '1'.repeat(64);
    await db.createSession(createHash('sha256').update(expired).digest('hex'), 'alice', '', Date.now() - 1);
    assert.equal(await db.getSession(createHash('sha256').update(expired).digest('hex')), undefined);
    await assert.rejects(auth.user({headers:{cookie:`lumo_session=${expired}`}}), {status:401});
    await auth.logout(req);
    await assert.rejects(createAuth(raw, db).user(req), {status:401});
  } finally { await db.close(); await rm(dir, {recursive:true,force:true}); }
});

test('admin manages persistent accounts, revokes sessions and preserves student boundaries', async () => {
  const raw = JSON.stringify([{username:'admin',password:'password-admin',role:'admin',name:'Admin'}]);
  const dir = await mkdtemp(join(tmpdir(), 'lumo-users-'));
  const path = join(dir, 'users.sqlite'); let db = await openDatabase(path);
  try {
    let auth = createAuth(raw, db);
    const admin = await auth.login({username:'admin',password:'password-admin'}, 'ip');
    const req = {headers:{cookie:`lumo_session=${admin.token}`}};
    assert.equal(admin.user.student, null);
    assert.throws(() => scopedKey(admin.user, 'lumo:daily_task'), {status:403});
    const alice = {username:'alice',password:'password-alice',role:'student',studentId:'alice',name:'Alice',grade:'初一',create:true};
    await auth.saveUser(req, alice);
    await assert.rejects(auth.saveUser(req, alice), {status:409});
    const login = await auth.login({username:'alice',password:'password-alice'}, 'ip');
    const studentReq = {headers:{cookie:`lumo_session=${login.token}`}};
    await assert.rejects(auth.listUsers(studentReq), {status:403});
    await assert.rejects(auth.saveUser(studentReq, {...alice,role:'admin'}), {status:403});
    await assert.rejects(auth.saveUser(req, {...alice, username:'parent',role:'parent',studentId:'missing'}), {status:400});
    await assert.rejects(auth.saveUser(req, {username:'admin',name:'Admin',role:'admin',disabled:true}), {status:400});
    await assert.rejects(auth.saveUser(req, {...alice,create:false,password:'short'}), {status:400});
    await auth.saveUser(req, {...alice,create:false,password:'new-password'});
    await assert.rejects(auth.user(studentReq), {status:401});
    await assert.rejects(auth.login({username:'alice',password:'password-alice'}, 'ip'), {status:401});
    await db.close(); db = await openDatabase(path); auth = createAuth(raw, db);
    const afterRestart = await auth.login({username:'alice',password:'new-password'}, 'ip');
    assert.equal(afterRestart.user.name, 'Alice');
    assert.equal(afterRestart.user.student.grade, '初一');
    const list = await auth.listUsers(req);
    assert.equal(list.length, 2); assert.equal(list[1].hash, undefined); assert.equal(list[1].password, undefined);
    assert.deepEqual(await db.snapshot(), {});
    const parent = {username:'guardian',name:'Guardian',role:'parent',studentId:'alice',password:'password-parent',create:true};
    await auth.saveUser(req, parent);
    const guardian = await auth.login({username:'guardian',password:'password-parent'}, 'ip');
    assert.equal(guardian.user.student.grade, '初一');
    assert.equal((await auth.listUsers(req)).find(u => u.username === 'alice').grade, '初一');
    await assert.rejects(auth.saveUser(req, {...alice,create:false,grade:'大学'}), {status:400});
    await assert.rejects(auth.saveUser(req, {...alice,create:false,grade:7}), {status:400});
    const {grade, ...withoutGrade} = alice;
    await auth.saveUser(req, {...withoutGrade,create:false,password:''});
    assert.equal((await auth.user({headers:{cookie:`lumo_session=${guardian.token}`}})).student.grade, '初一');
    await auth.saveUser(req, {...alice,create:false,password:'',grade:''});
    assert.equal((await auth.user({headers:{cookie:`lumo_session=${guardian.token}`}})).student.grade, '');
    await assert.rejects(auth.saveUser(req, {...alice,create:false,password:'',disabled:true}), {status:400});
    await assert.rejects(auth.saveUser(req, {...alice,create:false,studentId:'other',password:''}), {status:400});
    await auth.saveUser(req, {...parent,create:false,password:'',disabled:true});
    await auth.saveUser(req, {...alice,create:false,password:'',disabled:true});
    await assert.rejects(auth.login({username:'alice',password:'new-password'}, 'ip'), {status:401});
    await assert.rejects(auth.user({headers:{cookie:`lumo_session=${afterRestart.token}`}}), {status:401});
    assert.throws(() => db.saveUsers({},0), {status:409});
  } finally { await db.close(); await rm(dir, {recursive:true,force:true}); }
});

test('configured grades are validated and shared with the linked parent', async () => {
  const accounts = [
    {username:'alice',password:'password-a',role:'student',studentId:'alice',name:'Alice',grade:'六年级'},
    {username:'parent',password:'password-p',role:'parent',studentId:'alice',name:'Parent'}
  ];
  const auth = createAuth(JSON.stringify(accounts));
  assert.equal((await auth.login({username:'parent',password:'password-p'},'ip')).user.student.grade, '六年级');
  accounts[0].grade = '不存在';
  assert.throws(() => createAuth(JSON.stringify(accounts)), /年级无效/);
});
