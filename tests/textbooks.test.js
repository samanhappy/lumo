import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../database.js';
import { courses as seeds } from '../seeds/textbooks/courses.js';
import { courses, setCourses, initializeCourses } from '../src/learning-apps/practice/content.js';

test('textbooks survive reopening, preserve existing content and stay outside student storage',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lumo-books-'));
  let db;
  try {
    db=await openDatabase(join(dir,'test.sqlite'));
    await db.importCourses(seeds);
    assert.equal((await db.getCourses()).length,3);
    const original=await db.getCourses();
    await db.importCourses(seeds.map(course=>({...course,name:'should not overwrite'})));
    assert.deepEqual(await db.getCourses(),original);
    assert.deepEqual(await db.snapshot(),{});
    await db.close();db=await openDatabase(join(dir,'test.sqlite'));
    assert.deepEqual(await db.getCourses(),original);
    setCourses(await db.getCourses());
    assert.deepEqual(courses.flatMap(c=>c.units.flatMap(u=>u.items.map(i=>i.id))),seeds.flatMap(c=>c.units.flatMap(u=>u.items.map(i=>i.id))));
    assert.throws(()=>setCourses(seeds.slice(1)),/不完整/);
    const bad=structuredClone(seeds);bad[2].units[0].items[0].id='';
    assert.throws(()=>setCourses(bad),/条目/);
    assert.deepEqual(courses,seeds);
    await assert.rejects(async()=>db.importCourses([{id:'new',value:'test'}, {id:'invalid',value:1n}]));
    assert.deepEqual(await db.getCourses(),original);
  } finally {await db?.close();await rm(dir,{recursive:true,force:true});}
});

test('browser loads textbooks through API and reports loading failures',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async path=>{assert.equal(path,'/api/courses');return {ok:true,json:async()=>structuredClone(seeds)};};
    await initializeCourses();assert.deepEqual(courses,seeds);
    globalThis.fetch=async()=>({ok:false});
    await assert.rejects(initializeCourses(),/教材加载失败/);
    assert.deepEqual(courses,seeds);
  } finally {globalThis.fetch=original;}
});
