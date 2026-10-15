import { learningApps, isAppAvailable } from './registry.js';
import { escape, icon } from '../../ui.js';

export function renderApps(root, grade = '') {
  root.innerHTML = `<section class="page apps-page"><header class="page-heading"><div><h1>应用</h1></div></header>${learningApps.filter(entry => isAppAvailable(entry, grade)).map(entry => `<article class="app-card"><div class="app-icon" aria-hidden="true"><span>A</span><span>B</span></div><div class="app-info"><h3>${escape(entry.name)}</h3><p>${entry.grades?.length ? `适用年级：${entry.grades.map(escape).join('、')}` : '适用所有年级'}</p></div><a class="primary" href="/apps/${entry.code}">开始学习 ${icon('arrow')}</a></article>`).join('') || '<p class="empty-state">暂无适合当前年级的应用。</p>'}</section>`;
}
