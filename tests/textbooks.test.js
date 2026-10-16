import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../database.js';
import { validateCourse, question } from '../src/learning-apps/practice/domain.js';
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

test('textbook sync appends new grades and missing entries without replacing existing content or progress',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'lumo-book-sync-'));
  const db=await openDatabase(join(dir,'test.sqlite'));
  try {
    const original=structuredClone(seeds[0]);original.units=original.units.slice(0,1);
    original.units[0].items=original.units[0].items.slice(0,2);
    original.units[0].items[0].meaning='本地校订';
    await db.importCourses([original]);
    await db.save('student:sync:lumo:practice:english-vocabulary:sync',{progress:{existing:true}},0);
    const progress=await db.snapshot();
    await db.importCourses(seeds);
    const stored=await db.getCourses();
    const actual=stored.find(c=>c.id===original.id);
    assert.equal(actual.units.length,seeds[0].units.length);
    assert.equal(actual.units[0].items.length,seeds[0].units[0].items.length);
    assert.equal(actual.units[0].items[0].meaning,'本地校订');
    await db.importCourses(seeds);
    assert.deepEqual(await db.getCourses(),stored);
    assert.deepEqual(await db.snapshot(),progress);
    await assert.rejects(async()=>db.importCourses([{...seeds[0],units:[{...seeds[0].units[0],id:'rollback-unit'}]},{id:'bad',value:1n}]));
    assert.deepEqual(await db.getCourses(),stored);
  } finally {await db.close();await rm(dir,{recursive:true,force:true});}
});

test('all primary grades have both checked semesters, with complete inventories and separate example units',()=>{
  const [english,chinese,poetry]=seeds;
  seeds.forEach(validateCourse);
  const words=[[100,200],[225,281],[251,243],[238,192],[238,138],[229,161]];
  const poems=[[6,7],[7,7],[9,9],[10,8],[11,11],[9,17]];
  const vocabulary=[[86,114],[121,119],[148,152],[166,118]];
  for(let index=0;index<6;index++) for(const [semester,term] of ['上册','下册'].entries()) {
    const grade=`${'一二三四五六'[index]}年级`;
    const units=course=>course.units.filter(unit=>unit.grade===grade && unit.term===term && !unit.edition.includes('示例'));
    const zh=units(chinese),poem=units(poetry),en=units(english);
    assert.equal(zh.flatMap(unit=>unit.items).length,words[index][semester],`${grade}${term}字词缺失`);
    assert.equal(poem.length,poems[index][semester],`${grade}${term}古诗词缺失`);
    assert.equal(en.length,index<2?0:8,`${grade}${term}英语单元缺失`);
    if(index>=2) assert.equal(en.flatMap(unit=>unit.items).length,vocabulary[index-2][semester]);
    for(const unit of [...zh,...poem,...en]) assert.match(unit.sourceUrl,/^https:\/\/(lywgyxx\.szftedu\.cn|edu\.yilin\.com|github\.com)\//);
    if(index===0) assert.equal(new Set(zh.flatMap(unit=>unit.items.map(item=>item.word))).size,words[index][semester]);
  }
  const items=chinese.units.filter(unit=>!unit.edition.includes('示例')).flatMap(unit=>unit.items);
  for(const [word,pinyin] of Object.entries({'朝鲜':'cháo xiǎn','海参':'hǎi shēn','龟裂':'jūn liè','屏息':'bǐng xī','明晃晃':'míng huǎng huǎng','吆喝':'yāo he'})) assert.equal(items.find(item=>item.word===word).pinyin,pinyin);
  const moon=poetry.units.find(unit=>unit.title==='山居秋暝');
  assert.equal(moon.items[2].word,'明月松间照');
  assert.equal(question(poetry,moon,moon.items[3],'recall').answer,'清泉石上流');
  assert(english.units.filter(unit=>unit.term==='上册'&&!unit.edition.includes('示例')).every(unit=>unit.source.includes('镜像')));
  assert.equal(poetry.units.filter(unit=>!unit.edition.includes('示例')).length,111);
});
