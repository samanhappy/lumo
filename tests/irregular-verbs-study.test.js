import test from 'node:test';
import assert from 'node:assert/strict';
import { irregularVerbs } from '../src/learning-apps/irregular-verbs/app.js';
import { WORDS } from '../src/learning-apps/irregular-verbs/domain.js';
import { loadState, saveState } from '../src/learning-apps/irregular-verbs/repository.js';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
const settle = () => new Promise(resolve => setImmediate(resolve));

test('form submission advances correct answers, keeps mistakes, focuses new inputs and finishes the session', async () => {
  const form = {}, input = { focus() { this.focused = true; } }, next = { focus() {} };
  const root = {
    innerHTML: '',
    querySelector(selector) {
      if (selector === '.spell') return form;
      if (selector === '#past-answer') return input;
      if (selector === '#next') return this.innerHTML.includes('id="next"') ? next : null;
      return null;
    },
    querySelectorAll() { return []; }
  };
  const originalFormData = globalThis.FormData;
  const originalHistory = globalThis.history, originalWindow = globalThis.window, originalEvent = globalThis.PopStateEvent;
  let answer, path;
  globalThis.FormData = class { get() { return answer; } };
  globalThis.history = { pushState(_state, _title, value) { path = value; } };
  globalThis.window = { dispatchEvent() {} };
  globalThis.PopStateEvent = class {};
  try {
    const session = await irregularVerbs.start('keyboard', 'test');
    session.deck = session.deck.slice(0, 3);
    await saveState('keyboard', { ...loadState('keyboard'), active: session });
    irregularVerbs.render(root, { studentId: 'keyboard' }, '/apps/irregular-verbs/study');
    assert.equal(input.focused, true);
    async function submit(value) {
      answer = value;
      let prevented = false;
      form.onsubmit({ target: form, preventDefault() { prevented = true; } });
      await settle();
      assert.equal(prevented, true);
    }
    await submit(' ');
    assert.equal(loadState('keyboard').attempts.length, 0);
    input.focused = false;
    await submit(WORDS.find(w => w.id === session.deck[0]).answers[0]);
    assert.equal(loadState('keyboard').active.index, 1);
    assert.equal(loadState('keyboard').active.correct_count, 1);
    assert.equal(input.focused, true);
    await submit('wrong-answer');
    assert.equal(loadState('keyboard').active.index, 1);
    assert.match(root.innerHTML, /再记一次/);
    await submit('wrong-answer');
    assert.equal(loadState('keyboard').attempts.length, 2);
    next.onclick();
    await settle();
    assert.equal(loadState('keyboard').active.index, 2);
    await submit(WORDS.find(w => w.id === session.deck[2]).answers[0]);
    const state = loadState('keyboard');
    assert.equal(state.active, null);
    assert.equal(state.sessions.length, 1);
    assert.equal(state.sessions[0].total_count, 3);
    assert.equal(state.sessions[0].correct_count, 2);
    assert.equal(path, '/apps/irregular-verbs/result');
  } finally {
    globalThis.FormData = originalFormData;
    globalThis.history = originalHistory;
    globalThis.window = originalWindow;
    globalThis.PopStateEvent = originalEvent;
  }
});

test('home uses real mastery, latest spelling test and unresolved mistakes without competing CTAs', async () => {
  const root={innerHTML:'',querySelector(){return {}},querySelectorAll(){return []}};
  const state={mastery:{1:{mastery_score:75,last_correct:true},2:{mastery_score:50,last_correct:false},999:{mastery_score:100,last_correct:false}},sessions:[
    {mode:'test',correct_count:6,total_count:10,started_at:'2026-10-18T10:00:00Z',ended_at:'2026-10-18T10:02:00Z'},
    {mode:'choice',correct_count:9,total_count:10,started_at:'2026-10-19T10:00:00Z',ended_at:'2026-10-19T10:02:00Z'}
  ],attempts:[{}],active:null};
  await saveState('home',state);
  irregularVerbs.render(root,{studentId:'home'},'/apps/irregular-verbs');
  assert.match(root.innerHTML,/<strong>1<small> \/ 84/);
  assert.match(root.innerHTML,/<strong>6<small> \/ 10/);
  assert.match(root.innerHTML,/<strong>1<\/strong><\/dd><dt>待复习单词/);
  assert.match(root.innerHTML,/上次学习：闯关练习 · 完成 10 题/);
  assert.equal((root.innerHTML.match(/class="primary"/g)||[]).length,1);
  assert.equal((root.innerHTML.match(/data-mode=/g)||[]).length,4);
  assert.doesNotMatch(root.innerHTML,/累计练习|每日|学习路径/);
});

test('home shows honest empty states and resumes the active mode with completed count', async () => {
  const root={innerHTML:'',querySelector(){return {}},querySelectorAll(){return []}};
  await saveState('home-empty',{mastery:{},sessions:[],attempts:[],active:null});
  irregularVerbs.render(root,{studentId:'home-empty'},'/apps/irregular-verbs');
  assert.match(root.innerHTML,/开始学习/);
  assert.match(root.innerHTML,/暂无成绩/);
  assert.match(root.innerHTML,/还没有学习记录/);
  assert.doesNotMatch(root.innerHTML,/data-mode="wrong"/);
  const active=await irregularVerbs.start('home-empty','test');
  active.index=2; active.results=[{}, {}, {correct:false}];
  await saveState('home-empty',{...loadState('home-empty'),active});
  irregularVerbs.render(root,{studentId:'home-empty'},'/apps/irregular-verbs');
  assert.match(root.innerHTML,/拼写测试，一起加油吧/);
  assert.match(root.innerHTML,/已作答 3 \/ 10 题/);
  assert.match(root.innerHTML,/继续学习/);
  assert.equal((root.innerHTML.match(/class="primary"/g)||[]).length,1);
});
