import { read, write } from '../../storage.js';
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function shiftDate(date, days) { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + days); return localDate(d); }
export function formatDate(date) { return new Date(date + 'T12:00:00').toLocaleDateString('zh-CN', { month:'long', day:'numeric', weekday:'long' }); }
const validDate = date => /^\d{4}-\d{2}-\d{2}$/.test(date) && localDate(new Date(date + 'T12:00:00')) === date;
export function saveTask(tasks, input, studentId, now = new Date().toISOString()) {
  const title = input.title.trim();
  if (!title || title.length > 120) throw new Error('事项内容需要 1–120 个字符。');
  if (!['HOMEWORK','TODO'].includes(input.type)) throw new Error('请选择事项类型。');
  if (!validDate(input.date)) throw new Error('请选择有效日期。');
  const old = tasks.find(t => t.id === input.id && t.student_id === studentId);
  const task = { ...old, id: old?.id ?? crypto.randomUUID(), student_id: studentId, title, type: input.type, date: input.date,
    completed: old?.completed ?? false, completed_at: old?.completed_at ?? null, created_at: old?.created_at ?? now, updated_at: now };
  return old ? tasks.map(t => t.id === old.id ? task : t) : [...tasks, task];
}
export function toggleTask(tasks, id, studentId, now = new Date().toISOString()) {
  return tasks.map(t => t.id === id && t.student_id === studentId ? { ...t, completed: !t.completed, completed_at: t.completed ? null : now, updated_at: now } : t);
}
// ponytail: one line per candidate; use layout-aware grouping if wrapped homework becomes common.
export function homeworkLines(text) {
  return text.split(/\r?\n/)
    .map(line => line.trim().replace(/^(?:[-•●□✓]|\d+[.)、．]|[（(]\d+[）)])\s*/, '').trim())
    .filter(Boolean);
}
export function importHomework(tasks, text, date, studentId) {
  if (!validDate(date)) throw new Error('请选择有效日期。');
  const titles = homeworkLines(text);
  if (!titles.length) throw new Error('请至少保留一项作业。');
  if (titles.length > 100) throw new Error('一次最多导入 100 项，请分批导入。');
  let next = tasks, added = 0, skipped = 0;
  for (const [index, title] of titles.entries()) {
    if (title.length > 120) throw new Error(`第 ${index + 1} 项超过 120 个字符，请修改或拆成多项。`);
    if (next.some(task => task.student_id === studentId && task.date === date && task.title === title)) {
      skipped++; continue;
    }
    next = saveTask(next, { title, date, type: 'HOMEWORK' }, studentId);
    added++;
  }
  return { tasks: next, added, skipped };
}
export const loadTasks = () => { const data = read('lumo:daily_task', []); return Array.isArray(data) ? data : []; };
export const storeTasks = tasks => write('lumo:daily_task', tasks);
