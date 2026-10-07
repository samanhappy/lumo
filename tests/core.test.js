import test from 'node:test';
import assert from 'node:assert/strict';
import { saveTask, toggleTask, localDate, shiftDate } from '../src/platform/tasks/model.js';
import { WORDS, optionsFor, isCorrect, updateMastery, createDeck } from '../src/learning-apps/irregular-verbs/domain.js';
import { irregularVerbs } from '../src/learning-apps/irregular-verbs/app.js';
import { loadState, saveState, emptyState } from '../src/learning-apps/irregular-verbs/repository.js';
const memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
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
