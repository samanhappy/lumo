import { student, user } from '../student.js';
import { SUBJECTS, localDate, shiftDate, formatDate, loadTasks, storeTasks, saveTask, toggleTask, orderedTasks, reorderTask, preferredTaskStatus } from './model.js';
import { escape, icon, notify } from '../../ui.js';
import { attachDatePickers } from './date-picker.js';
import { photoImportDialog } from './photo-import.js';
let selectedDate = localDate();
let selectedStatus = 'pending';
export function renderToday(root) {
  const parent = user?.role === 'parent';
  const today = localDate(), tasks = orderedTasks(loadTasks(),student.id,selectedDate);
  const complete = tasks.filter(t=>t.completed).length;
  const visibleTasks = tasks.filter(t => !!t.completed === (selectedStatus === 'completed'));
  root.innerHTML = `<section class="page today-page"><header class="page-heading"><div><h1>${selectedDate===today ? (parent ? `${escape(student.name)}的今日安排` : `今日安排`) : '当日安排'}</h1><p>把每天的小事，一件件完成。</p></div></header>
  <div class="today-toolbar"><label class="date-pill">${icon('today')}<input type="date" id="selected-date" aria-label="查看日期" value="${selectedDate}"></label>
  <div class="date-strip"><button class="quiet" id="previous-day" aria-label="前一天">‹</button>${[-1,0,1].map(n=>{const d=shiftDate(selectedDate,n); return `<button data-date="${d}" class="date-chip ${n===0?'selected':''}">${formatDate(d).replace('星期','周')}</button>`}).join('')}<button class="quiet" id="next-day" aria-label="后一天">›</button>${selectedDate!==today?'<button class="quiet" id="back-today">回到今天</button>':''}</div></div>
  <section class="panel task-panel"><div class="section-heading"><h2>${icon('today')} ${selectedDate===today?'今日事项':'当日事项'} <span class="count">${complete}<small> / ${tasks.length}</small></span></h2><div class="task-heading-actions"><button class="secondary small" id="import-photo">${icon('camera')} 拍照导入</button><button class="primary small" id="add-task">${icon('plus')} 添加事项</button></div></div>
  <div class="task-tabs" role="tablist" aria-label="事项状态">${[['pending','待完成',tasks.length-complete],['completed','已完成',complete]].map(([status,label,count])=>`<button id="task-tab-${status}" role="tab" data-status="${status}" aria-selected="${selectedStatus===status}" aria-controls="task-list" tabindex="${selectedStatus===status?0:-1}">${label} <span>${count}</span></button>`).join('')}</div>
  <div class="task-list" id="task-list" role="tabpanel" aria-labelledby="task-tab-${selectedStatus}">${visibleTasks.length?visibleTasks.map(t=>`<div class="task-row ${t.completed?'done':''}" data-task-id="${t.id}"><button class="quiet task-drag" data-drag="${t.id}" aria-label="排序：${escape(t.title)}（上下方向键移动）" title="拖动排序，或使用上下方向键">⠿</button><button class="checkbox" data-toggle="${t.id}" aria-label="${t.completed?'取消完成':'完成'}：${escape(t.title)}" aria-pressed="${t.completed}">${t.completed?icon('check'):''}</button><div class="task-copy">${t.subject?`<span class="task-subject">${escape(t.subject)}</span>`:''}<span class="task-title">${escape(t.title)}</span></div><button class="quiet row-action" data-top="${t.id}" aria-label="移到第一位：${escape(t.title)}" title="移到第一位">${icon('moveTop')}</button><button class="quiet row-action" data-edit="${t.id}" aria-label="编辑：${escape(t.title)}">${icon('edit')}</button></div>`).join(''):`<div class="empty-state"><div class="empty-icon">${icon('today')}</div><h3>${selectedStatus==='completed'?'还没有已完成事项':'没有待完成事项'}</h3></div>`}</div>
  </section>
  </section>`;
  const selectStatus = status => {
    selectedStatus = status;
    renderToday(root);
    root.querySelector(`[data-status="${status}"]`).focus();
  };
  root.querySelectorAll('[data-status]').forEach(button => {
    button.onclick = () => selectStatus(button.dataset.status);
    button.onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      selectStatus(event.key === 'Home' ? 'pending' : event.key === 'End' ? 'completed' : selectedStatus === 'pending' ? 'completed' : 'pending');
    };
  });
  attachDatePickers(root);
  const change = d=>{
    selectedDate=d;
    selectedStatus=preferredTaskStatus(orderedTasks(loadTasks(),student.id,d));
    renderToday(root);
  };
  root.querySelector('#selected-date').onchange=e=>{if(e.target.value)change(e.target.value)};
  root.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>change(b.dataset.date));
  root.querySelector('#previous-day').onclick=()=>change(shiftDate(selectedDate,-1));
  root.querySelector('#next-day').onclick=()=>change(shiftDate(selectedDate,1));
  if(root.querySelector('#back-today'))root.querySelector('#back-today').onclick=()=>change(today);
  root.querySelector('#add-task').onclick=()=>taskDialog(root);
  root.querySelector('#import-photo').onclick=()=>photoImportDialog(root, {
    studentId: student.id,
    date: selectedDate,
    onImported: date => { selectedDate = date; selectedStatus = 'pending'; renderToday(root); }
  });
  root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>taskDialog(root,tasks.find(t=>t.id===b.dataset.edit)));
  const persistOrder = async (next, id, focusAttribute = 'drag') => {
    const buttons = [...root.querySelectorAll('[data-toggle], [data-top], [data-edit], [data-drag], #add-task, #import-photo')];
    buttons.forEach(button => button.disabled = true);
    try { await storeTasks(next); }
    catch (error) { notify(error.message); }
    finally {
      buttons.forEach(button => button.disabled = false);
      if (root.isConnected) {
        renderToday(root);
        [...root.querySelectorAll(`[data-${focusAttribute}]`)].find(button => button.dataset[focusAttribute] === id)?.focus();
      }
    }
  };
  root.querySelectorAll('[data-top]').forEach(button => {
    button.onclick = () => {
      if (!button.disabled) void persistOrder(reorderTask(loadTasks(), button.dataset.top, visibleTasks[0].id, student.id, selectedDate), button.dataset.top, 'top');
    };
  });
  root.querySelectorAll('[data-drag]').forEach(handle => {
    handle.onkeydown = event => {
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const index = visibleTasks.findIndex(t => t.id === handle.dataset.drag);
      const target = visibleTasks[index + (event.key === 'ArrowUp' ? -1 : 1)];
      if (!target || !!target.completed !== !!visibleTasks[index].completed) return;
      void persistOrder(reorderTask(loadTasks(), handle.dataset.drag, target.id, student.id, selectedDate), handle.dataset.drag);
    };
    handle.onpointerdown = event => {
      if (handle.disabled || event.button !== 0) return;
      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      const row = handle.closest('[data-task-id]');
      row.classList.add('dragging');
      let next = loadTasks(), changed = false;
      handle.onpointermove = move => {
        const target = document.elementFromPoint(move.clientX, move.clientY)?.closest('[data-task-id]');
        if (!target || !root.contains(target) || target === row || target.classList.contains('done') !== row.classList.contains('done')) return;
        const reordered = reorderTask(next, handle.dataset.drag, target.dataset.taskId, student.id, selectedDate);
        if (reordered === next) return;
        next = reordered;
        const rows = [...row.parentElement.children];
        row.parentElement.insertBefore(row, rows.indexOf(row) < rows.indexOf(target) ? target.nextSibling : target);
        handle.setPointerCapture(move.pointerId);
        changed = true;
      };
      const finish = cancelled => {
        handle.onpointermove = handle.onpointerup = handle.onpointercancel = handle.onlostpointercapture = null;
        row.classList.remove('dragging');
        if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
        if (cancelled) renderToday(root);
        else if (changed) void persistOrder(next, handle.dataset.drag);
      };
      handle.onpointerup = () => finish(false);
      handle.onpointercancel = handle.onlostpointercapture = () => finish(true);
    };
  });
  root.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{
    if(b.disabled)return;
    const buttons=[...root.querySelectorAll('[data-toggle], [data-top], [data-edit], [data-drag], #add-task, #import-photo')];
    buttons.forEach(button=>button.disabled=true);
    try{await storeTasks(toggleTask(loadTasks(),b.dataset.toggle,student.id));if(root.isConnected){renderToday(root);root.querySelector(`[data-status="${selectedStatus}"]`).focus()}}
    catch(e){notify(e.message)}finally{buttons.forEach(button=>button.disabled=false)}
  });
}
function taskDialog(root, task) {
  const dialog=document.createElement('dialog'); dialog.className='task-dialog';
  dialog.setAttribute('aria-labelledby','task-dialog-title'); let busy=false;
  const subject = task?.subject ? (SUBJECTS.includes(task.subject) ? task.subject : '其他') : '';
  dialog.innerHTML=`<form><div class="section-heading"><h2 id="task-dialog-title">${task?'编辑事项':'添加事项'}</h2><button type="button" class="quiet" id="close-dialog" aria-label="关闭">${icon('close')}</button></div><label class="field">事项内容<input name="title" required autofocus maxlength="120" placeholder="例如：数学练习册 P32–33" value="${escape(task?.title||'')}"></label><fieldset class="subject-field"><legend>学科（可选）</legend><input type="hidden" name="subject" value="${subject}"><div class="subject-options">${SUBJECTS.map(value=>`<button type="button" data-subject="${value}" aria-pressed="${subject===value}">${value}</button>`).join('')}</div></fieldset><label class="field">日期<input name="date" type="date" required value="${task?.date||selectedDate}"></label><p id="form-error" class="error" role="alert"></p><div class="dialog-actions">${task?`<button type="button" class="danger" id="delete-task">${icon('trash')} 删除</button>`:''}<button type="button" class="secondary" id="cancel-dialog">取消</button><button type="submit" class="primary">保存</button></div></form>`;
  attachDatePickers(dialog);
  root.append(dialog);dialog.showModal();
  const subjectInput = dialog.querySelector('[name=subject]');
  const subjectButtons = [...dialog.querySelectorAll('[data-subject]')];
  subjectButtons.forEach(button=>button.onclick=()=>{
    subjectInput.value = subjectInput.value===button.dataset.subject ? '' : button.dataset.subject;
    subjectButtons.forEach(option=>option.setAttribute('aria-pressed',String(option.dataset.subject===subjectInput.value)));
  });
  const close=()=>{if(busy)return;dialog.close();dialog.remove()};
  const setBusy=value=>{busy=value;dialog.querySelectorAll('button,input').forEach(control=>control.disabled=value);dialog.querySelector('[type=submit]').textContent=value?'保存中…':'保存'};
  dialog.oncancel=e=>{e.preventDefault();close()};
  dialog.querySelector('#close-dialog').onclick=close;dialog.querySelector('#cancel-dialog').onclick=close;
  dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();if(busy)return;const data=Object.fromEntries(new FormData(e.target));setBusy(true);try{await storeTasks(saveTask(loadTasks(),{...data,id:task?.id},student.id));selectedDate=data.date;if(!task)selectedStatus='pending';setBusy(false);close();if(root.isConnected)renderToday(root)}catch(err){dialog.querySelector('#form-error').textContent=err.message}finally{setBusy(false)}};
  if(task)dialog.querySelector('#delete-task').onclick=async()=>{
    if(busy)return;const button=dialog.querySelector('#delete-task');
    if(button.dataset.confirm!=='yes'){button.dataset.confirm='yes';button.textContent='确认删除';return}
    setBusy(true);try{await storeTasks(loadTasks().filter(t=>!(t.id===task.id&&t.student_id===student.id)));setBusy(false);close();if(root.isConnected)renderToday(root)}catch(err){dialog.querySelector('#form-error').textContent=err.message}finally{setBusy(false)}
  };
}
