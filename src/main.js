import { renderToday } from './platform/tasks/page.js';
import { student } from './platform/student.js';
import { learningApps, markAppUsed } from './platform/learning-apps/registry.js';
import { icon, navigate, notify } from './ui.js';
const app = document.querySelector('#app');
function render() {
  const path=location.pathname.replace(/\/$/,'')||'/today';
  const entry=learningApps.find(a=>path===`/apps/${a.code}`||path.startsWith(`/apps/${a.code}/`));
  app.innerHTML=`<aside class="sidebar"><a class="logo" href="/today" aria-label="Lumo 首页">l<span>u</span>mo<i>✦</i></a><div class="nav-items"><a href="/today" class="nav-item ${!entry?'active':''}">${icon('today')}<span>今日</span></a><a href="/apps/irregular-verbs" class="nav-item ${entry?'active':''}">${icon('book')}<span>学习</span></a></div><div class="sidebar-bottom"><div class="avatar" title="本机学生：${student.name}">☀</div><span>${student.name}</span><small>v0.1</small></div></aside><main id="main"></main>`;
  const root=app.querySelector('#main');
  if(entry){try{markAppUsed(entry,student.id)}catch(e){notify(e.message)}entry.app.render(root,{studentId:student.id,studentName:student.name},path)}
  else if(path==='/today')renderToday(root);
  else root.innerHTML='<section class="page empty-state"><h1>这个页面还没有开放</h1><a class="primary" href="/today">返回今日</a></section>';
  window.scrollTo(0,0);
}
document.addEventListener('click', e=>{
  const link=e.target.closest('a[href^="/"]');
  if(link&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();navigate(link.getAttribute('href'))}
});
window.addEventListener('popstate',render);
if(location.pathname==='/')history.replaceState({},'','/today');
render();
