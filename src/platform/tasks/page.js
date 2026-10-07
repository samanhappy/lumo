import { student, user } from '../student.js';
import { learningApps, appSummary } from '../learning-apps/registry.js';
import { localDate, shiftDate, formatDate, loadTasks, storeTasks, saveTask, toggleTask } from './model.js';
import { escape, icon, notify } from '../../ui.js';
import { photoImportDialog } from './photo-import.js';
let selectedDate = localDate();
export function renderToday(root) {
  const parent = user?.role === 'parent';
  const today = localDate(), tasks = loadTasks().filter(t=>t.student_id===student.id && t.date===selectedDate);
  const complete = tasks.filter(t=>t.completed).length;
  root.innerHTML = `<section class="page today-page"><header class="page-heading"><div><div class="eyebrow">每一天，都是新的开始</div><h1>${selectedDate===today ? (parent ? `${escape(student.name)}的今日安排` : `你好呀，${escape(student.name)} <span class="sun">☀</span>`) : '看看这一天的收获'}</h1><p>${selectedDate===today?(parent?'陪伴孩子完成今日事项，关注学习进展。':'今天也加油！完成作业，一起探索学问吧。'):'按日期查看事项，记录每一点进步。'}</p></div><label class="date-pill">${icon('today')}<input type="date" id="selected-date" aria-label="查看日期" value="${selectedDate}"></label></header>
  <div class="date-strip"><button class="quiet" id="previous-day" aria-label="前一天">‹</button>${[-1,0,1].map(n=>{const d=shiftDate(selectedDate,n); return `<button data-date="${d}" class="date-chip ${n===0?'selected':''}">${formatDate(d).replace('星期','周')}</button>`}).join('')}<button class="quiet" id="next-day" aria-label="后一天">›</button>${selectedDate!==today?'<button class="quiet" id="back-today">回到今天</button>':''}</div>
  <section class="panel task-panel"><div class="section-heading"><h2>${icon('today')} ${selectedDate===today?'今日事项':'当日事项'} <span class="count">${complete}<small> / ${tasks.length}</small></span></h2><div class="task-heading-actions"><button class="secondary small" id="import-photo">${icon('camera')} 拍照导入</button><button class="primary small" id="add-task">${icon('plus')} 添加事项</button></div></div>
  <div class="task-list">${tasks.length?tasks.map(t=>`<div class="task-row ${t.completed?'done':''}"><button class="checkbox" data-toggle="${t.id}" aria-label="${t.completed?'取消完成':'完成'}：${escape(t.title)}" aria-pressed="${t.completed}">${t.completed?icon('check'):''}</button><span class="task-title">${escape(t.title)}</span><span class="badge ${t.type==='HOMEWORK'?'homework':'todo'}">${t.type==='HOMEWORK'?'作业':'待办'}</span><button class="quiet row-action" data-edit="${t.id}" aria-label="编辑：${escape(t.title)}">${icon('edit')}</button></div>`).join(''):`<div class="empty-state"><div class="empty-icon">${icon('today')}</div><h3>给今天一个小目标</h3><p>添加作业或待办，一件一件慢慢完成。</p></div>`}</div>
  ${tasks.length?`<div class="task-bottom"><span>${complete===tasks.length?'都完成啦，给自己一个赞！':'不着急，完成一件就更近一步。'}</span><div class="mini-track"><i style="width:${complete/tasks.length*100}%"></i></div></div>`:''}</section>
  <section class="learning-section"><div class="section-heading"><h2>${icon('book')} ${user?.role==='parent'?'孩子的学习概况':'我的学习应用'}</h2><span class="muted">小小练习，大大进步</span></div>${learningApps.filter(a=>a.enabled).map(entry=>{ let s;try{s=appSummary(entry,student.id)}catch(e){s=entry.app.getSummary(student.id);notify(e.message)}return `<article class="app-card"><div class="app-icon" aria-hidden="true"><span>A</span><span>B</span></div><div class="app-info"><span class="eyebrow">英语 · VERB QUEST</span><h3>${escape(s.title)}</h3><p>${escape(s.progressText)}</p><span class="muted estimate">${icon('clock')} 预计 ${s.estimatedMinutes} 分钟</span></div>${user?.role==='parent'?'<span class="badge">学生账号可继续练习</span>':`<a class="primary" href="/apps/${entry.code}">继续学习 ${icon('arrow')}</a>`}</article>`}).join('')}</section><footer>每天进步一点点 <span>✦</span> Lumo</footer></section>`;
  const change = d=>{selectedDate=d;renderToday(root)};
  root.querySelector('#selected-date').onchange=e=>{if(e.target.value)change(e.target.value)};
  root.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>change(b.dataset.date));
  root.querySelector('#previous-day').onclick=()=>change(shiftDate(selectedDate,-1));
  root.querySelector('#next-day').onclick=()=>change(shiftDate(selectedDate,1));
  if(root.querySelector('#back-today'))root.querySelector('#back-today').onclick=()=>change(today);
  root.querySelector('#add-task').onclick=()=>taskDialog(root);
  root.querySelector('#import-photo').onclick=()=>photoImportDialog(root, {
    studentId: student.id,
    date: selectedDate,
    onImported: date => { selectedDate = date; renderToday(root); }
  });
  root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>taskDialog(root,tasks.find(t=>t.id===b.dataset.edit)));
  root.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{try{await storeTasks(toggleTask(loadTasks(),b.dataset.toggle,student.id));renderToday(root)}catch(e){notify(e.message)}});
}
function taskDialog(root, task) {
  const dialog=document.createElement('dialog'); dialog.className='task-dialog';
  dialog.innerHTML=`<form><div class="section-heading"><h2>${task?'编辑事项':'添加事项'}</h2><button type="button" class="quiet" id="close-dialog" aria-label="关闭">${icon('close')}</button></div><label class="field">事项内容<input name="title" required maxlength="120" placeholder="例如：数学练习册 P32–33" value="${escape(task?.title||'')}"></label><fieldset><legend>类型</legend><div class="type-options"><label><input type="radio" name="type" value="HOMEWORK" ${!task||task.type==='HOMEWORK'?'checked':''}><span>▣ 作业</span></label><label><input type="radio" name="type" value="TODO" ${task?.type==='TODO'?'checked':''}><span>☑ 待办</span></label></div></fieldset><label class="field">日期<input name="date" type="date" required value="${task?.date||selectedDate}"></label><p id="form-error" class="error" role="alert"></p><div class="dialog-actions">${task?`<button type="button" class="danger" id="delete-task">${icon('trash')} 删除</button>`:''}<button type="button" class="secondary" id="cancel-dialog">取消</button><button type="submit" class="primary">保存</button></div></form>`;
  root.append(dialog);dialog.showModal();
  const close=()=>{dialog.close();dialog.remove()};
  dialog.oncancel=e=>{e.preventDefault();close()};
  dialog.querySelector('#close-dialog').onclick=close;dialog.querySelector('#cancel-dialog').onclick=close;
  dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));try{await storeTasks(saveTask(loadTasks(),{...data,id:task?.id},student.id));selectedDate=data.date;close();renderToday(root)}catch(err){dialog.querySelector('#form-error').textContent=err.message}};
  if(task)dialog.querySelector('#delete-task').onclick=async()=>{
    const button=dialog.querySelector('#delete-task');
    if(button.dataset.confirm!=='yes'){button.dataset.confirm='yes';button.textContent='确认删除';return}
    try{await storeTasks(loadTasks().filter(t=>!(t.id===task.id&&t.student_id===student.id)));close();renderToday(root)}catch(err){dialog.querySelector('#form-error').textContent=err.message}
  };
}
