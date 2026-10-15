import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { renderApps } from '../src/platform/learning-apps/page.js';
import { learningApps, isAppAvailable } from '../src/platform/learning-apps/registry.js';

test('apps lists only the enabled app without reading or showing practice state', () => {
  const app = learningApps[0].app;
  const original = app.getSummary;
  app.getSummary = () => { throw new Error('Practice state must stay inside the app'); };
  try {
    const root = { innerHTML: '' };
    renderApps(root);
    assert.equal((root.innerHTML.match(/class="app-card"/g) || []).length, 1);
    assert.match(root.innerHTML, /<h1>应用<\/h1>/);
    assert.match(root.innerHTML, /不规则过去式/);
    assert.match(root.innerHTML, /href="\/apps\/irregular-verbs"/);
    assert.doesNotMatch(root.innerHTML, /词卡学习|闯关练习|拼写测试|错题|进度|继续上次/);
  } finally {
    app.getSummary = original;
  }
});

test('app grade rules cover unrestricted, matching, unknown and disabled cases', () => {
  const entry = {enabled:true,grades:['初一','初二']};
  assert.equal(isAppAvailable(entry,'初一'), true);
  assert.equal(isAppAvailable(entry,'六年级'), false);
  assert.equal(isAppAvailable(entry,''), true);
  assert.equal(isAppAvailable({enabled:true,grades:[]},'高三'), true);
  assert.equal(isAppAvailable({enabled:true},'高三'), true);
  assert.equal(isAppAvailable({...entry,enabled:false},''), false);
});

test('app listing applies grade configuration and explains empty results', () => {
  const entry = learningApps[0], original = entry.grades;
  entry.grades = ['初一','初二'];
  try {
    const root = {innerHTML:''};
    renderApps(root,'初一');
    assert.match(root.innerHTML,/适用年级：初一、初二/);
    assert.match(root.innerHTML,/href="\/apps\/irregular-verbs"/);
    renderApps(root,'六年级');
    assert.doesNotMatch(root.innerHTML,/class="app-card"/);
    assert.match(root.innerHTML,/暂无适合当前年级的应用/);
  } finally { entry.grades = original; }
});

test('direct app URLs reject mismatched grades before recording usage or rendering the app', async () => {
  const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const render = source.slice(source.indexOf('async function render()'), source.indexOf("document.addEventListener('click'"));
  const root = {innerHTML:'',isConnected:true,focus() {}};
  let used = 0, rendered = 0;
  const entry = {code:'example',enabled:true,grades:['初一'],app:{render() { rendered++; }}};
  for (const path of ['/apps/example','/apps/example/study']) {
    await runInNewContext(`${render}\nrender()`, {
      user:{role:'student'}, student:{id:'alice',grade:'六年级'}, location:{pathname:path},
      learningApps:[entry], isAppAvailable, markAppUsed:async () => { used++; },
      app:{querySelector: selector => selector === '#main' ? root : selector === '#logout' ? {} : null},
      icon:() => '', accountMenu:() => '', window:{scrollTo() {}},
    });
    assert.match(root.innerHTML,/此应用暂不适用于当前年级/);
  }
  assert.equal(used,0);
  assert.equal(rendered,0);
});
