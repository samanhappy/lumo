import test from 'node:test';
import assert from 'node:assert/strict';
import { courses, setCourses } from '../src/learning-apps/practice/content.js';
import { courses as seedCourses } from '../seeds/textbooks/courses.js';
setCourses(structuredClone(seedCourses));
import { emptyState, validateCourse, question, choices, isCorrect, createSession, updateProgress, submitAnswer, advance, statistics, progressKey } from '../src/learning-apps/practice/domain.js';
import { practiceApps } from '../src/learning-apps/practice/app.js';
import { loadState, saveState } from '../src/learning-apps/practice/repository.js';
import { practiceIds } from '../src/learning-apps/practice/keys.js';

const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
const today='2026-10-15';
const [english,chinese,poetry]=courses;
const unit=english.units[0], word=unit.items[0];
function begin(course=english,mode='practice',ability='recall') {
  const state=emptyState();
  return {...state,active:createSession(course,course.units[0].id,mode,ability,state,today)};
}

test('all content validates, provides both questions and unique options including the answer',()=>{
  assert.deepEqual(courses.map(course=>course.id),practiceIds);
  for(const course of courses) {
    validateCourse(course);
    for(const unit of course.units) for(const item of unit.items) {
      for(const ability of Object.keys(course.abilities)) assert.equal(isCorrect(course,unit,item,ability,question(course,unit,item,ability).answer),true);
      const options=choices(course,unit,item);
      assert.equal(new Set(options).size,options.length);
      assert(options.includes(question(course,unit,item,'recognize').answer));
    }
  }
  const invalid=structuredClone(english);invalid.units[0].items[1].id=word.id;
  assert.throws(()=>validateCourse(invalid),/条目/);
  const badGrade=structuredClone(english);badGrade.units[0].grade='大学';assert.throws(()=>validateCourse(badGrade),/单元/);
  const badChinese=structuredClone(chinese);badChinese.units[0].items[0].pinyin='';assert.throws(()=>validateCourse(badChinese),/条目/);
});

test('answer normalization tolerates case and poetic punctuation without accepting misspellings',()=>{
  assert(isCorrect(english,unit,word,'recall',' BOOK '));
  assert(!isCorrect(english,unit,word,'recall','b ook'));
  assert(!isCorrect(english,unit,word,'recall','books'));
  assert(isCorrect(poetry,poetry.units[0],poetry.units[0].items[0],'recall','床前明月光，'));
  assert(!isCorrect(poetry,poetry.units[0],poetry.units[0].items[0],'recall','床前明月光疑是地上霜'));
  assert(!isCorrect(chinese,chinese.units[0],chinese.units[0].items[0],'recall','青晨'));
});

test('practice schedules due work before at most three new items and separates ability and unit',()=>{
  const state=emptyState(), later=unit.items[3], due=unit.items[4];
  state.progress[progressKey(later.id,'recall')]={stage:1,due:'2026-10-16'};
  state.progress[progressKey(due.id,'recall')]={stage:1,due:today};
  const session=createSession(english,unit.id,'practice','recall',state,today);
  assert.deepEqual(session.deck.map(q=>q.itemId),[due.id,...unit.items.slice(0,3).map(w=>w.id)]);
  assert.deepEqual(createSession(english,unit.id,'review','recall',state,today).deck.map(q=>q.itemId),[due.id]);
  assert.throws(()=>createSession(english,unit.id,'review','recognize',state,today),/没有到期/);
  assert.throws(()=>createSession(english,'unknown','practice','recall',state,today),/有效/);
  assert.throws(()=>createSession(english,unit.id,'practice','unknown',state,today),/有效/);
});

test('stages require independent answers on separate dates; hints and mistakes reset and remain due',()=>{
  let progress=updateProgress(undefined,true,false,today);
  assert.equal(progress.stage,1);assert.equal(progress.due,'2026-10-16');
  progress=updateProgress(progress,true,false,today);assert.equal(progress.stage,1);
  progress=updateProgress(progress,true,false,'2026-10-16');assert.equal(progress.stage,2);assert.equal(progress.due,'2026-10-19');
  progress=updateProgress(progress,true,false,'2026-10-19');assert.equal(progress.stage,3);assert.equal(progress.due,'2026-10-26');
  const hinted=updateProgress(progress,true,true,'2026-10-20');assert.equal(hinted.stage,0);assert.equal(hinted.due,'2026-10-20');
  const wrong=updateProgress(progress,false,false,'2026-10-20');assert.equal(wrong.stage,0);
});

test('mistakes get one delayed retry; submission is idempotent and abilities are independent',()=>{
  let state=begin();
  state=submitAnswer(english,state,'wrong',today);
  assert.equal(state.active.index,0);assert.equal(state.active.deck.length,4);
  assert.equal(state.active.deck[3].retry,true);
  assert.equal(submitAnswer(english,state,'wrong',today),state);
  assert.equal(state.progress[progressKey(word.id,'recall')].stage,0);
  assert.equal(state.progress[progressKey(word.id,'recognize')],undefined);
  state=advance(state);
  for(let i=0;i<2;i++) {const item=unit.items.find(item=>item.id===state.active.deck[state.active.index].itemId);state=advance(submitAnswer(english,state,item.word,today));}
  state=submitAnswer(english,state,'still wrong',today);
  assert.equal(state.active.deck.length,4);
  state=advance(state);assert.equal(state.active,null);assert.equal(state.sessions[0].results.length,4);
});

test('card learning never advances mastery, hinted answers are tracked and retried',()=>{
  let state=begin(english,'learn');
  for(let i=0;i<unit.items.length;i++) state=advance(state);
  assert.equal(statistics(english,state,'recall').seen,unit.items.length);
  assert.deepEqual(state.progress,{});
  state=begin();state.active.hinted=true;
  state=submitAnswer(english,state,word.word,today);
  assert.equal(state.progress[progressKey(word.id,'recall')].stage,0);
  assert.equal(state.active.feedback.hinted,true);
  assert.equal(state.active.deck.length,4);
});

test('all apps persist active sessions, recover on reload and isolate students and apps',async()=>{
  memory.clear();
  for(let index=0;index<courses.length;index++) {
    const course=courses[index],app=practiceApps[index];
    const session=await app.start('alice',course.units[0].id);
    assert.equal(loadState(course.id,'alice').active.id,session.id);
    assert.equal(loadState(course.id,'bob').active,null);
    assert.equal((await app.start('alice',course.units[0].id)).id,session.id);
    let state=loadState(course.id,'alice');
    const item=course.units[0].items.find(item=>item.id===session.deck[0].itemId);
    state=submitAnswer(course,state,item.word,today);
    await saveState(course.id,'alice',state);
    assert.equal(loadState(course.id,'alice').active.feedback.correct,true);
    assert.equal(loadState(course.id,'alice').active.index,0);
  }
});

test('failed saves leave persisted progress and active answer untouched',async()=>{
  memory.clear();
  await practiceApps[0].start('save-failure',unit.id);
  const previous=loadState(english.id,'save-failure');
  const submitted=submitAnswer(english,previous,'wrong',today);
  const original=localStorage.setItem;
  localStorage.setItem=()=>{throw new Error('disk full');};
  try {
    await assert.rejects(async()=>saveState(english.id,'save-failure',submitted),/无法保存/);
    assert.deepEqual(loadState(english.id,'save-failure'),previous);
    await assert.rejects(practiceApps[1].start('save-failure',chinese.units[0].id),/无法保存/);
    assert.equal(loadState(chinese.id,'save-failure').active,null);
  } finally {localStorage.setItem=original;}
});

test('home defaults to student grade and offers an explicit fallback without relabeling content',()=>{
  const controls={'#content-grade':{},'#content-term':{},'#ability':{value:'recall'},'#all-grades':{}};
  const root={innerHTML:'',isConnected:true,querySelector:selector=>controls[selector]??null,querySelectorAll:()=>[]};
  practiceApps[0].render(root,{studentId:'grade-view',grade:'初一'},'/apps/english-vocabulary');
  assert.match(root.innerHTML,/日常生活/);assert.doesNotMatch(root.innerHTML,/校园用品/);
  controls['#content-grade'].onchange({target:{value:'高三'}});
  assert.match(root.innerHTML,/当前年级暂无内置内容/);
  controls['#all-grades'].onclick();
  assert.match(root.innerHTML,/校园用品/);assert.match(root.innerHTML,/日常生活/);
  assert.match(root.innerHTML,/三年级 · 自编示例/);
});

test('grade-six textbooks preserve complete checked inventories, sources and known polyphonic readings',()=>{
  const units=course=>course.units.filter(unit=>unit.grade==='六年级');
  const en=units(english).filter(unit=>unit.term==='下册'),zh=units(chinese),poems=units(poetry);
  assert.deepEqual(en.map(unit=>unit.items.length),[25,13,7,14,7,23,13,16]);
  assert.equal(zh.filter(unit=>unit.term==='上册').flatMap(unit=>unit.items).length,229);
  assert.equal(zh.filter(unit=>unit.term==='下册').flatMap(unit=>unit.items).length,161);
  assert.equal(poems.filter(unit=>unit.term==='上册').length,9);
  assert.equal(poems.filter(unit=>unit.term==='下册').length,17);
  assert(poems.some(unit=>unit.title==='长歌行' && unit.term==='下册'));
  assert(!poems.some(unit=>unit.title==='游子吟'));
  assert.equal(poems.flatMap(unit=>unit.items).length,142);
  for(const unit of [...en,...zh,...poems]) assert.match(unit.sourceUrl,/^https:\/\/(edu\.yilin\.com|lywgyxx\.szftedu\.cn)\//);
  for(const [word,pinyin] of Object.entries({'目的地':'mù dì dì','参差':'cēn cī','单薄':'dān bó','分外':'fèn wài','搅和':'jiǎo huo','剥削':'bō xuē','重见天日':'chóng jiàn tiān rì','不禁':'bù jīn','漫长':'màn cháng'})) {
    assert.equal(zh.flatMap(unit=>unit.items).find(item=>item.word===word).pinyin,pinyin);
  }
  const u=zh[0],item=u.items[0];
  const invalid=structuredClone(chinese);delete invalid.units.find(unit=>unit.wordListOnly).items[0].pinyin;
  assert.throws(()=>validateCourse(invalid),/条目/);
  assert.equal(question(chinese,u,item,'recognize').prompt,item.pinyin);
  assert.equal(question(chinese,u,item,'recall').prompt,item.pinyin);
  assert(!question(chinese,u,item,'recall').hint.includes(item.word));
  assert.match(english.notice,/上册.*镜像/);
  assert.match(chinese.notice,/2019/);
});

test('textbook home filters by semester and shows source links and edition boundaries',()=>{
  const controls={'#content-grade':{},'#content-term':{},'#ability':{value:'recall'}};
  const root={innerHTML:'',isConnected:true,querySelector:selector=>controls[selector]??null,querySelectorAll:()=>[]};
  practiceApps[1].render(root,{studentId:'textbook-view',grade:'六年级'},'/apps/chinese-words');
  assert.match(root.innerHTML,/第1课 草原/);assert.match(root.innerHTML,/第1课 北京的春节/);
  controls['#content-term'].onchange({target:{value:'下册'}});
  assert.doesNotMatch(root.innerHTML,/第1课 草原/);assert.match(root.innerHTML,/第1课 北京的春节/);
  assert.match(root.innerHTML,/查看教材来源/);assert.match(root.innerHTML,/未核定为2026修订版/);
});

test('completed daily work remains available for practice without advancing the review schedule',async()=>{
  const state=emptyState();
  for(const item of unit.items) state.progress[progressKey(item.id,'recall')]=updateProgress(undefined,true,false,today);
  const session=createSession(english,unit.id,'practice','recall',state,today);
  assert.equal(session.deck.length,unit.items.length);
  const before=state.progress[progressKey(word.id,'recall')];
  const after=updateProgress(before,true,false,today);
  assert.equal(after.stage,before.stage);
  assert.equal(after.due,before.due);
  assert.equal(after.attempts,before.attempts+1);
  const advanced=updateProgress({...before,stage:3,due:'2026-10-22'},true,false,'2026-10-16');
  assert.equal(advanced.stage,3);assert.equal(advanced.due,'2026-10-22');
  assert.equal(updateProgress(before,false,false,today).due,today);
  assert.equal(updateProgress(before,true,true,today).stage,0);
  assert.throws(()=>createSession(english,unit.id,'review','recall',state,today),/没有到期/);
  for(const progress of Object.values(state.progress)) progress.due='2099-10-16';
  await saveState(english.id,'finished-day',state);
  const controls={'#content-grade':{},'#content-term':{}};
  const root={innerHTML:'',querySelector:selector=>controls[selector]??null,querySelectorAll:()=>[]};
  practiceApps[0].render(root,{studentId:'finished-day',grade:unit.grade},'/apps/english-vocabulary');
  assert.match(root.innerHTML,new RegExp(`已练习 ${unit.items.length} / ${unit.items.length}`));
  assert.match(root.innerHTML,/下次复习 2099-10-16/);
});


test('unfinished sessions do not disable units; switching preserves answers and failed switches preserve the active session',async()=>{
  const app=practiceApps[0],student='switch-session';
  await app.start(student,unit.id);
  await saveState(english.id,student,submitAnswer(english,loadState(english.id,student),word.word,today));
  const saved=loadState(english.id,student);
  for(const progress of Object.values(saved.progress)) progress.due='2099-10-16';
  await saveState(english.id,student,saved);
  const previous=loadState(english.id,student);
  const controls={'#content-grade':{},'#content-term':{},'#end-session':{}};
  const root={innerHTML:'',querySelector:selector=>controls[selector]??null,querySelectorAll:()=>[]};
  app.render(root,{studentId:student,grade:unit.grade},'/apps/english-vocabulary');
  assert.doesNotMatch(root.innerHTML,/<button[^>]*data-mode[^>]*disabled/);
  assert.equal((await app.start(student,unit.id)).id,previous.active.id);
  await assert.rejects(app.start(student,unit.id,'review'),/没有到期/);
  assert.deepEqual(loadState(english.id,student),previous);
  const original=localStorage.setItem;
  localStorage.setItem=()=>{throw new Error('disk full');};
  try {await assert.rejects(app.start(student,unit.id,'learn'),/无法保存/);}
  finally {localStorage.setItem=original;}
  assert.deepEqual(loadState(english.id,student),previous);
  await app.start(student,unit.id,'learn');
  const switched=loadState(english.id,student);
  assert.equal(switched.active.mode,'learn');
  assert.deepEqual(switched.sessions.at(-1).results,previous.active.results);
  assert.deepEqual(switched.progress,previous.progress);
  await app.start(student,english.units[1].id);
  assert.equal(loadState(english.id,student).active.unitId,english.units[1].id);
});

test('all companion homes expose one primary action and honest empty states',()=>{
  for(const [index,course] of courses.entries()) {
    const controls={'#content-grade':{},'#content-term':{},'#content-unit':{},'#ability':{},'#practice-start':{}};
    const root={innerHTML:'',isConnected:true,querySelector:selector=>controls[selector]??null,querySelectorAll:()=>[]};
    practiceApps[index].render(root,{studentId:`home-empty-${index}`,grade:'六年级'},`/apps/${course.id}`);
    assert.equal((root.innerHTML.match(/class="primary"/g)||[]).length,1);
    assert.match(root.innerHTML,/还没有学习记录/);
    assert.match(root.innerHTML,/暂无成绩/);
    assert.doesNotMatch(root.innerHTML,/id="review-due"/);
    assert.match(root.innerHTML,/内容与学习模式/);
    assert.match(root.innerHTML,/教材来源与学习详情/);
    assert.match(root.innerHTML,/data-ability="recognize"/);
    assert.match(root.innerHTML,/data-ability="recall"/);
    assert.doesNotMatch(root.innerHTML,/undefined/);
  }
});

test('home resumes actual progress and distinguishes independent first answers from retries',async()=>{
  const student='home-real-stats',state=begin();
  const progress={...updateProgress(undefined,false,false,'2020-01-01'),stage:3};
  state.progress[progressKey(word.id,'recall')]=progress;
  state.progress['deleted-item:recall']=progress;
  state.active.index=1;
  state.active.feedback={correct:false};
  state.sessions=[{mode:'practice',ability:'recognize',unitId:unit.id,endedAt:new Date().toISOString(),results:[{correct:true,hinted:false,retry:false},{correct:true,hinted:true,retry:false},{correct:true,hinted:false,retry:true}]},{mode:'learn',unitId:unit.id,endedAt:new Date().toISOString(),results:[]}];
  await saveState(english.id,student,state);
  const controls={'#content-grade':{},'#content-term':{},'#content-unit':{},'#ability':{},'#review-due':{},'#end-session':{}};
  const root={innerHTML:'',isConnected:true,querySelector:selector=>controls[selector]??null,querySelectorAll:()=>[]};
  practiceApps[0].render(root,{studentId:student},'/apps/english-vocabulary');
  assert.match(root.innerHTML,/继续学习/);
  assert.match(root.innerHTML,/aria-valuenow="2"/);
  assert.match(root.innerHTML,/<strong>1<small> \/ 2/);
  assert.match(root.innerHTML,/id="review-due"/);
  assert.equal((root.innerHTML.match(/class="primary"/g)||[]).length,1);
  assert.match(root.innerHTML,new RegExp(`<strong>1<small> / ${english.units.flatMap(unit=>unit.items).length}`));
});

test('completed learning recommends a real practice deck rather than restarting all cards',async()=>{
  const state=emptyState(),student='home-next-practice';
  state.sessions=[{unitId:unit.id,mode:'learn',ability:'recall',results:[],endedAt:new Date().toISOString()}];
  await saveState(english.id,student,state);
  const controls={'#content-grade':{},'#content-term':{},'#content-unit':{},'#ability':{},'#practice-start':{}};
  const root={innerHTML:'',isConnected:true,querySelector:selector=>controls[selector]??null,querySelectorAll:()=>[]};
  practiceApps[0].render(root,{studentId:student},'/apps/english-vocabulary');
  const expected=createSession(english,unit.id,'practice','recall',state).deck.length;
  assert.match(root.innerHTML,new RegExp(`学习 ${expected}</span>`));
  assert.match(root.innerHTML,/校园用品 · 看义拼词/);
  assert.match(root.innerHTML,/aria-valuenow="0"/);
});
