import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const menuFunction = source.slice(source.indexOf('function accountMenu()'), source.indexOf('async function render()'));
test('all account roles put logout inside the avatar popover', () => {
  for (const role of ['student', 'parent', 'admin']) {
    const html = runInNewContext(`${menuFunction}\naccountMenu()`, {
      user: { role, name: '<小雨>' }, student: { name: '小雨' },
      escape: value => value.replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
    });
    assert.match(html, /<button[^>]*popovertarget="account-menu"[^>]*aria-label="打开用户菜单"/);
    assert.match(html, /<div id="account-menu"[^>]*popover><strong>&lt;小雨&gt;<\/strong><button[^>]*id="logout"/);
    assert.equal((html.match(/id="logout"/g) || []).length, 1);
    assert.ok(!html.includes('<小雨>'));
  }
  assert.equal((source.match(/\$\{accountMenu\(\)\}/g) || []).length, 2);
});

test('avatar shows the first name character without a separate username', () => {
  for (const [name, initial] of [['小雨', '小'], [' Meng Sun ', 'M'], ['𠮷田', '𠮷'], ['<名字>', '&lt;']]) {
    const html = runInNewContext(`${menuFunction}\naccountMenu()`, {
      user: { role: 'admin', name },
      escape: value => value.replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
    });
    assert.ok(html.includes(`>${initial}</button><div id="account-menu"`));
    assert.ok(!html.includes('</button><span>'));
  }
});
