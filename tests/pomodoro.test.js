import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, secondsLeft, complete, validateSettings, selectDuration } from '../src/platform/pomodoro/domain.js';
import { scopedKey } from '../auth.js';
import { openDatabase } from '../database.js';

test('deadline timer survives delayed ticks and pause/resume without counting suspended time',()=>{
  const s={...initialState(),deadline:100000};
  assert.equal(secondsLeft(s,12500),88);
  const paused={...s,deadline:null,remaining:secondsLeft(s,12500)};
  assert.equal(secondsLeft(paused,900000),88);
  assert.equal(secondsLeft({...paused,deadline:900000+88000},901000),87);
});
test('completion records one focus session and waits for manual break start',()=>{
  const s={...initialState(),deadline:100000,topic:'数学'};
  const next=complete(s,200000);
  assert.equal(next.sessions.length,1);
  assert.equal(next.sessions[0].at,100000);
  assert.equal(next.sessions[0].topic,'数学');
  assert.equal(next.mode,'short');
  assert.equal(next.deadline,null);
  assert.equal(next.remaining,300);
  assert.equal(complete(next,300000),next);
  assert.equal(s.sessions.length,0);
});
test('four focus sessions lead to a long break; breaks do not earn focus credit',()=>{
  const s={...initialState(),round:3,deadline:1000};
  const rest=complete(s,1000);
  assert.equal(rest.mode,'long');assert.equal(rest.remaining,900);assert.equal(rest.round,4);
  const focus=complete({...rest,deadline:2000},2000);
  assert.equal(focus.mode,'focus');assert.equal(focus.sessions.length,1);assert.equal(focus.round,4);
});
test('settings reject invalid durations and goals',()=>{
  assert.throws(()=>validateSettings({focus:0,short:5,long:15,goal:4}));
  assert.throws(()=>validateSettings({focus:25,short:1.5,long:15,goal:4}));
  assert.deepEqual(validateSettings({focus:'15',short:'3',long:'10',goal:'2',sound:true}),{focus:15,short:3,long:10,goal:2,sound:true});
});
test('pomodoro state is database-backed, isolated by student and read-only for parents',async()=>{
  const db=await openDatabase(':memory:');
  try{
    const student={role:'student',student:{id:'alice'}};
    const key=scopedKey(student,'lumo:pomodoro:alice',initialState(),true);
    await db.save(key,initialState(),0);
    assert.ok((await db.snapshot())[key]);
    assert.throws(()=>scopedKey(student,'lumo:pomodoro:bob',{},true),{status:403});
    assert.throws(()=>scopedKey({role:'parent',student:{id:'alice'}},'lumo:pomodoro:alice',{},true),{status:403});
  }finally{await db.close();}
});

test('editing a topic and immediately starting saves both changes and preserves keyboard focus',async()=>{
  const { renderPomodoro }=await import('../src/platform/pomodoro/page.js');
  const memory=new Map();
  const originals=Object.fromEntries(['localStorage','document','window','setInterval','clearInterval'].map(key=>[key,globalThis[key]]));
  const nodes=new Map();
  const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{value:'',style:{},focus(){this.focused=true;},querySelector:node,querySelectorAll:()=>[]});return nodes.get(selector);};
  const root={innerHTML:'',isConnected:true,querySelector:node,querySelectorAll:()=>[]};
  globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
  globalThis.document={title:'Lumo',querySelector:node};
  globalThis.window={};
  globalThis.setInterval=()=>0;
  globalThis.clearInterval=()=>{};
  try {
    renderPomodoro(root,{studentId:'ui-regression'});
    const topic=node('#pomo-topic');topic.value='完成数学练习';
    const savingTopic=topic.onchange({target:topic});
    const starting=node('#pomo-toggle').onclick();
    await Promise.all([savingTopic,starting]);
    let saved=JSON.parse(memory.get('lumo:pomodoro:ui-regression'));
    assert.equal(saved.topic,'完成数学练习');
    assert.ok(saved.deadline>Date.now());
    assert.equal(node('#pomo-toggle').focused,true);
    await node('#pomo-toggle').onclick();
    // Starting must also capture the input when the browser has not emitted change yet.
    topic.value='读完一首诗';
    await node('#pomo-toggle').onclick();
    saved=JSON.parse(memory.get('lumo:pomodoro:ui-regression'));
    assert.equal(saved.topic,'读完一首诗');
    assert.ok(saved.deadline>Date.now());
  }finally{for(const [key,value] of Object.entries(originals)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});


test('duration selection updates the selected mode and rejects active or paused sessions',()=>{
  const initial=initialState();
  const selected=selectDuration(initial,45);
  assert.equal(selected.remaining,2700);
  assert.equal(selected.settings.focus,45);
  assert.equal(selected.settings.short,5);
  assert.equal(initial.settings.focus,25);
  assert.throws(()=>selectDuration({...selected,deadline:Date.now()+1000},15));
  assert.throws(()=>selectDuration({...selected,remaining:2699},15));
  assert.throws(()=>selectDuration(initial,2));
  const rest=selectDuration({...initial,mode:'short',remaining:300},10);
  assert.equal(rest.settings.short,10);assert.equal(rest.remaining,600);
});
