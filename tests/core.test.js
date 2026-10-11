import test from 'node:test';
import assert from 'node:assert/strict';
import { saveTask, toggleTask, localDate, shiftDate, orderedTasks, reorderTask, storeTasks, loadTasks, preferredTaskStatus } from '../src/platform/tasks/model.js';
import { WORDS, optionsFor, isCorrect, updateMastery, createDeck } from '../src/learning-apps/irregular-verbs/domain.js';
import { irregularVerbs } from '../src/learning-apps/irregular-verbs/app.js';
import { loadState, saveState, emptyState } from '../src/learning-apps/irregular-verbs/repository.js';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
test('date selection prefers pending unless only completed tasks exist',()=>{
 for(const [completed,status] of [[[],'pending'],[[false],'pending'],[[true],'completed'],[[false,true],'pending']]){
  const tasks=completed.map(value=>({student_id:'a',date:'2026-10-11',completed:value}));
  tasks.push({student_id:'b',date:'2026-10-11',completed:false},{student_id:'a',date:'2026-10-12',completed:false});
  assert.equal(preferredTaskStatus(orderedTasks(tasks,'a','2026-10-11')),status);
 }
});
test('daily task CRUD, student isolation, completion timestamps and local dates',()=>{
 let tasks=saveTask([],{title:' 数学 P32 ',date:'2026-10-07',type:'HOMEWORK'},'a','created');
 const id=tasks[0].id;assert.equal(tasks[0].title,'数学 P32');assert.equal(tasks[0].completed_at,null);
 tasks=toggleTask(tasks,id,'b');assert.equal(tasks[0].completed,false);
 tasks=toggleTask(tasks,id,'a','finished');assert.equal(tasks[0].completed_at,'finished');
 tasks=saveTask(tasks,{id,title:'待办',date:'2026-10-08',type:'TODO'},'a','updated');assert.equal(tasks.length,1);assert.equal(tasks[0].created_at,'created');assert.equal(tasks[0].completed,true);
 tasks=toggleTask(tasks,id,'a');assert.equal(tasks[0].completed_at,null);
 assert.equal(tasks.filter(t=>t.id!==id).length,0);
 assert.throws(()=>saveTask(tasks,{title:' ',date:'2026-10-07',type:'TODO'},'a'));
 assert.throws(()=>saveTask(tasks,{title:'a',date:'2026-02-30',type:'TODO'},'a'));
 assert.equal(shiftDate('2026-12-31',1),'2027-01-01');assert.equal(localDate(new Date(2026,9,7,0,1)),'2026-10-07');
});
test('tasks need no type selection and preserve existing types when edited',()=>{
 const input={title:'带水杯',date:'2026-10-11'};
 let tasks=saveTask([],input,'a');
 assert.equal(tasks[0].title,input.title);
 for(const type of ['HOMEWORK','TODO']){
  tasks=saveTask([],{...input,type},'a');
  tasks=toggleTask(tasks,tasks[0].id,'a','finished');
  const edited=saveTask(tasks,{...input,id:tasks[0].id,title:'带水杯和雨伞'},'a')[0];
  assert.equal(edited.type,type);
  assert.equal(edited.completed,true);
  assert.equal(edited.completed_at,'finished');
 }
 assert.throws(()=>saveTask([],{...input,type:'invalid'},'a'));
});
test('optional task subjects can be added, preserved and cleared with legacy tasks',()=>{
 const input={title:'练习册 P32',date:'2026-10-11'};
 let tasks=saveTask([],{...input,subject:'数学'},'a');
 assert.equal(tasks[0].subject,'数学');
 const id=tasks[0].id;
 tasks=saveTask(tasks,{...input,id},'a');
 assert.equal(tasks[0].subject,'数学');
 tasks=toggleTask(tasks,id,'a');
 assert.equal(tasks[0].subject,'数学');
 tasks=saveTask(tasks,{...input,id,subject:''},'a');
 assert.equal(tasks[0].subject,'');
 delete tasks[0].subject;
 tasks=saveTask(tasks,{...input,id},'a');
 assert.equal(tasks[0].subject,'');
 assert.equal(tasks[0].completed,true);
 for(const subject of ['语文','数学','英语','其他']) assert.equal(saveTask([],{...input,subject},'a')[0].subject,subject);
 tasks[0].subject='科学';
 assert.equal(saveTask(tasks,{...input,id},'a')[0].subject,'其他');
 assert.throws(()=>saveTask([],{...input,subject:'科学'},'a'),/有效学科/);
 assert.throws(()=>saveTask([],{...input,subject:42},'a'));
});
test('all 84 words retain valid distractors and alternate spellings; mastery and review are app owned',()=>{
 assert.equal(WORDS.length,84);assert.equal(new Set(WORDS.map(w=>w.id)).size,84);
 for(const w of WORDS){const options=optionsFor(w);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert.equal(options.filter(a=>isCorrect(w,a)).length,1)}
 assert.equal(isCorrect(WORDS.find(w=>w.base==='learn'),' LEARNED '),true);
 assert.equal(isCorrect(WORDS.find(w=>w.id===69),'lied'),false);assert.equal(isCorrect(WORDS.find(w=>w.id===84),'lied'),true);
 let mastery;for(let i=0;i<3;i++)mastery=updateMastery(mastery,true,'now');assert.equal(mastery.mastery_score,75);
 mastery=updateMastery(mastery,false,'later');assert.equal(mastery.mastery_score,40);assert.equal(mastery.incorrect_count,1);
 assert.deepEqual(createDeck('wrong',{1:mastery}).map(w=>w.id),[1]);assert.equal(createDeck('choice',{}).length,10);assert.equal(createDeck('learn',{}).length,84);
});
test('sessions and summaries persist independently for each student; corrupt data and failed writes are handled',async()=>{
 assert.equal(irregularVerbs.getSummary('a').estimatedMinutes,8);
 const session=await irregularVerbs.start('a');assert.equal(session.deck.length,10);assert.equal(loadState('a').active.id,session.id);assert.equal(loadState('b').active,null);
 const state=emptyState();state.mastery[1]=updateMastery(null,false,'now');saveState('a',state);assert.match(irregularVerbs.getSummary('a').progressText,/1 个单词/);
 await assert.rejects(()=>irregularVerbs.start('b','wrong'));await assert.rejects(()=>irregularVerbs.start('b','bogus'));
 memory.set('lumo:iv:c','{bad');assert.deepEqual(loadState('c'),emptyState());
 const original=localStorage.setItem;localStorage.setItem=()=>{throw new Error('quota')};await assert.rejects(()=>irregularVerbs.start('a'),/无法保存数据/);localStorage.setItem=original;assert.equal(loadState('a').active,null);
});

test('task ordering persists within a date and student, with completed tasks last', async () => {
 const tasks = [
  {id:'done', student_id:'a', date:'2026-10-11', completed:true},
  {id:'first', student_id:'a', date:'2026-10-11', completed:false},
  {id:'other-student', student_id:'b', date:'2026-10-11'},
  {id:'second', student_id:'a', date:'2026-10-11', completed:false},
  {id:'other-date', student_id:'a', date:'2026-10-12'},
  {id:'done2', student_id:'a', date:'2026-10-11', completed:true},
 ];
 const ids = value => orderedTasks(value,'a','2026-10-11').map(t=>t.id);
 assert.deepEqual(ids(tasks), ['first','second','done','done2']);
 const moved = reorderTask(tasks,'second','first','a','2026-10-11');
 assert.deepEqual(ids(moved), ['second','first','done','done2']);
 assert.equal(moved[2], tasks[2]); assert.equal(moved[4], tasks[4]);
 assert.deepEqual(ids(reorderTask(moved,'second','first','a','2026-10-11')), ['first','second','done','done2']);
 assert.deepEqual(ids(reorderTask(moved,'done2','done','a','2026-10-11')), ['second','first','done2','done']);
 for (const target of ['done','other-student','other-date','missing']) assert.equal(reorderTask(moved,'first',target,'a','2026-10-11'), moved);
 await storeTasks(moved); assert.deepEqual(ids(loadTasks()), ids(moved));
 assert.deepEqual(ids(toggleTask(moved,'second','a')), ['first','second','done','done2']);
 assert.deepEqual(ids(tasks), ['first','second','done','done2']);
});
