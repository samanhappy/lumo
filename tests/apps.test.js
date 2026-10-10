import test from 'node:test';
import assert from 'node:assert/strict';
import { renderApps } from '../src/platform/learning-apps/page.js';
import { learningApps } from '../src/platform/learning-apps/registry.js';

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
