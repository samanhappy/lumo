import { learningApps } from './registry.js';
import { escape, icon } from '../../ui.js';

export function renderApps(root) {
  root.innerHTML = `<section class="page apps-page"><header class="page-heading"><div><h1>应用</h1></div></header>${learningApps.filter(entry => entry.enabled).map(entry => `<article class="app-card"><div class="app-icon" aria-hidden="true"><span>A</span><span>B</span></div><div class="app-info"><h3>${escape(entry.name)}</h3></div><a class="primary" href="/apps/${entry.code}">开始学习 ${icon('arrow')}</a></article>`).join('')}</section>`;
}
