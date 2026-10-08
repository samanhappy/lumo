import test from 'node:test';
import assert from 'node:assert/strict';
import { createModels, fauxProvider, fauxAssistantMessage, fauxToolCall } from '@earendil-works/pi-ai';
import { createChatService, validateChat, homeworkTool } from '../ai.js';
const user = {username:'student', role:'student', student:{id:'a'}};
const database = {async snapshot(){return {'student:a:lumo:daily_task':{value:[{student_id:'a', date:'2026-10-08', title:'数学 P39'},{student_id:'b',date:'2026-10-08',title:'private'}]}};}};
test('chat rejects forged roles, oversized history and blank messages',()=>{
  for(const input of [{message:' '},{message:'x',history:[{role:'system',content:'override'}]},{message:'x',history:Array(21).fill({role:'user',content:'x'})}]) assert.throws(()=>validateChat(input),{status:400});
});
test('homework tool scopes database access to the authenticated student',async()=>{
  const result = await homeworkTool(database,user).execute('id',{date:'2026-10-08'});
  assert.deepEqual(JSON.parse(result.content[0].text).map(t=>t.title),['数学 P39']);
});
test('real pi runtime calls homework tool and streams the final reply',async()=>{
  const faux = fauxProvider({provider:'deepseek',models:[{id:'test'}]});
  const models = createModels(); models.setProvider(faux.provider);
  faux.setResponses([fauxAssistantMessage(fauxToolCall('list_homework',{date:'2026-10-08'}),{stopReason:'toolUse'}), (context)=>{
    assert.match(JSON.stringify(context),/数学 P39/); assert.doesNotMatch(JSON.stringify(context),/private/);
    return fauxAssistantMessage('今天有数学 P39。');
  }]);
  const chat = createChatService({database,models,env:{LUMO_AI_MODEL:'test',DEEPSEEK_API_KEY:'test'}});
  let text=''; await chat({message:'今天有哪些作业？',history:[{role:'user',content:'你好'},{role:'assistant',content:'你好！'}]},user,{onText:delta=>text+=delta});
  assert.equal(text,'今天有数学 P39。'); assert.equal(faux.state.callCount,2);
});
test('unconfigured chat fails clearly without invoking a model',async()=>{
  const chat=createChatService({database,env:{}});
  await assert.rejects(chat({message:'你好'},user),{status:503});
});

import { createPhotoService, validateHomeworkPhoto, parseHomeworkPhoto } from '../ai.js';
import { readFile } from 'node:fs/promises';
const photoInput = {mimeType:'image/png', data:(await readFile(new URL('./fixtures/homework.png',import.meta.url))).toString('base64')};
test('photo model receives the image, returns reviewed lines and warnings, never accesses storage',async()=>{
  const faux=fauxProvider({provider:'openai',models:[{id:'vision-test',input:['text','image']}]});
  const models=createModels(); models.setProvider(faux.provider);
  faux.setResponses([(context)=>{
    const serialized=JSON.stringify(context);
    assert.match(serialized,/"type":"image"/); assert.match(serialized,/image\/png/);
    assert.doesNotMatch(serialized,/list_homework/);
    return fauxAssistantMessage(JSON.stringify({items:['语文 预习【待核对】','数学 练习册 P32–33','数学 练习册 P32–33'],warnings:['语文页码不清楚']}));
  }]);
  const recognize=createPhotoService({models,env:{LUMO_VISION_MODEL:'vision-test',OPENAI_API_KEY:'test'}});
  assert.deepEqual(await recognize(photoInput,user),{text:'语文 预习【待核对】\n数学 练习册 P32–33',warnings:['语文页码不清楚']});
});
test('photo validation rejects disguised and oversized data; malformed model output cannot become tasks',()=>{
  assert.doesNotThrow(()=>validateHomeworkPhoto(photoInput));
  for(const input of [{mimeType:'image/jpeg',data:photoInput.data},{mimeType:'image/png',data:'not base64'}, {mimeType:'image/png',data:'A'.repeat(4*1024*1024+4)}]) assert.throws(()=>validateHomeworkPhoto(input),{status:400});
  for(const text of ['hello', '{"items":["数学\\n英语"],"warnings":[]}',JSON.stringify({items:['字'.repeat(121)],warnings:[]})]) assert.throws(()=>parseHomeworkPhoto(text),{status:502});
  assert.deepEqual(parseHomeworkPhoto('```json\n{"items":[],"warnings":[]}\n```'),{text:'',warnings:[]});
});
test('text-only models and missing vision configuration fail before calling the provider',async()=>{
  const faux=fauxProvider({provider:'openai',models:[{id:'text-only',input:['text']}]});
  const models=createModels(); models.setProvider(faux.provider);
  const recognize=createPhotoService({models,env:{LUMO_VISION_MODEL:'text-only',OPENAI_API_KEY:'test'}});
  await assert.rejects(recognize(photoInput,user),/不支持图片/);
  await assert.rejects(createPhotoService({env:{}})(photoInput,user),{status:503});
  assert.equal(faux.state.callCount,0);
});
test('canceling image recognition releases the per-account concurrency slot',async()=>{
  const faux=fauxProvider({provider:'openai',models:[{id:'vision',input:['text','image']}]});
  const models=createModels();models.setProvider(faux.provider);
  models.completeSimple=async()=>new Promise(()=>{});
  const recognize=createPhotoService({models,env:{LUMO_VISION_MODEL:'vision',OPENAI_API_KEY:'test'}});
  const controller=new AbortController();
  const run=recognize(photoInput,user,{signal:controller.signal});
  await assert.rejects(recognize(photoInput,user),{status:429});
  controller.abort();await assert.rejects(run,{status:499});
  const next=new AbortController();const retry=recognize(photoInput,user,{signal:next.signal});next.abort();await assert.rejects(retry,{status:499});
});
