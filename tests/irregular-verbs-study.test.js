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
