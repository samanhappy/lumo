import { initializeStorage } from './storage.js';
import { renderToday } from './platform/tasks/page.js';
import { student, user, setUser } from './platform/student.js';
import { learningApps, markAppUsed } from './platform/learning-apps/registry.js';
import { icon, navigate, notify, escape } from './ui.js';
const app = document.querySelector('#app');
async function render() {
  if (!user) return showLogin();
  const path=location.pathname.replace(/\/$/,'')||'/today';
  const entry=learningApps.find(a=>path===`/apps/${a.code}`||path.startsWith(`/apps/${a.code}/`));
  app.innerHTML=`<aside class="sidebar"><a class="logo" href="/today" aria-label="Lumo 首页">l<span>u</span>mo<i>✦</i></a><div class="nav-items"><a href="/today" class="nav-item ${!entry?'active':''}">${icon('today')}<span>今日</span></a>${user.role==='student'?`<a href="/apps/irregular-verbs" class="nav-item ${entry?'active':''}">${icon('book')}<span>学习</span></a>`:''}</div><div class="sidebar-bottom"><div class="avatar" title="关联学生：${escape(student.name)}">☀</div><span>${escape(user.name)}</span><small>${user.role==='parent'?'家长端':'学生端'}</small><button class="quiet" id="logout">退出登录</button></div></aside><main id="main"></main>`;
  const root=app.querySelector('#main');
  app.querySelector('#logout').onclick=async()=>{try{await authRequest('/api/auth/logout',{});location.replace('/login')}catch(e){notify(e.message)}};
  if (entry && user.role==='parent') { navigate('/today'); return; }
  if(entry){try{await markAppUsed(entry,student.id)}catch(e){notify(e.message)}if (!root.isConnected) return; entry.app.render(root,{studentId:student.id,studentName:student.name},path)}
  else if(path==='/today'||path==='/login')renderToday(root);
  else root.innerHTML='<section class="page empty-state"><h1>这个页面还没有开放</h1><a class="primary" href="/today">返回今日</a></section>';
  window.scrollTo(0,0);
}
document.addEventListener('click', e=>{
  const link=e.target.closest('a[href^="/"]');
  if(link&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();navigate(link.getAttribute('href'))}
});
window.addEventListener('popstate',render);
if(location.pathname==='/')history.replaceState({},'','/today');
async function authRequest(path, body) {
  const response = await fetch(path, body === undefined ? {} : { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw Object.assign(new Error(data.error || '登录失败。'), {status:response.status}); return data;
}
function showLogin() {
  app.innerHTML = `<main class="login-page"><form class="panel login-card"><a class="logo" href="/login">l<span>u</span>mo<i>✦</i></a><h1>欢迎回来</h1><p class="muted">登录后，开启今天的学习与陪伴。</p><label class="field">用户名<input name="username" autocomplete="username" required maxlength="40" autofocus></label><label class="field">密码<input name="password" type="password" autocomplete="current-password" required maxlength="128"></label><p class="error" role="alert" id="login-error"></p><button class="primary" type="submit">登录</button><p class="muted">使用预配置的学生或家长账号，无需注册。</p></form></main>`;
  app.querySelector('form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;try{const account=await authRequest('/api/auth/login',Object.fromEntries(new FormData(e.target)));await initializeStorage(account);setUser(account);navigate('/today')}catch(error){app.querySelector('#login-error').textContent=error.message}finally{button.disabled=false}};
}
try { const account=await authRequest('/api/auth/me'); await initializeStorage(account); setUser(account); await render(); }
catch(error) { if(error.status===401)showLogin();else {app.innerHTML='<main class="page empty-state"><h1>暂时无法读取数据</h1><p id="storage-error"></p><button class="primary" id="retry-storage">重试</button></main>';app.querySelector('#storage-error').textContent=error.message;app.querySelector('#retry-storage').onclick=()=>location.reload();} }
