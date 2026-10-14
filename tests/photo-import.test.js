import test from 'node:test';
import assert from 'node:assert/strict';
import { homeworkLines, importHomework, saveTask } from '../src/platform/tasks/model.js';
import { validatePhoto, recognizePhoto } from '../src/platform/tasks/ocr.js';

test('reviewed model lines become homework, skipping duplicate titles only for the target student and date', () => {
  const date = '2026-10-07';
  assert.deepEqual(homeworkLines(' 1. 数学 P32\r\n\n• 背诵英语\n(3) 语文订正\n'), ['数学 P32', '背诵英语', '语文订正']);
  const tasks = [
    ...saveTask([], { title: '数学 P32', date, type: 'HOMEWORK' }, 'a'),
    ...saveTask([], { title: '背诵英语', date: '2026-10-06', type: 'HOMEWORK' }, 'a'),
    ...saveTask([], { title: '语文订正', date, type: 'HOMEWORK' }, 'b')
  ];
  const result = importHomework(tasks, '数学 P32\n背诵英语\n语文订正\n背诵英语', date, 'a');
  assert.equal(result.added, 2);
  assert.equal(result.skipped, 2);
  assert.equal(tasks.length, 3);
  for (const task of result.tasks.slice(3)) {
    assert.equal(task.date, date);
    assert.equal(task.student_id, 'a');
    assert.equal(task.type, 'HOMEWORK');
    assert.equal(task.completed, false);
  }
  assert.throws(() => importHomework(tasks, '数学 P32', '2026-02-30', 'a'), /日期/);
  assert.throws(() => importHomework(tasks, '', date, 'a'), /至少/);
  assert.throws(() => importHomework(tasks, '合法内容\n' + '字'.repeat(121), date, 'a'), /第 2 项/);
  assert.equal(tasks.length, 3, 'invalid batches leave all existing tasks intact');
  assert.throws(() => importHomework(tasks, Array(101).fill('任务').join('\n'), date, 'a'), /100/);
});

test('photo validation rejects unsupported, empty and oversized files before calling the model', async () => {
  assert.doesNotThrow(() => validatePhoto({ type: 'image/jpeg', size: 1024 }));
  for (const file of [{ type: 'image/heic', size: 100 }, { type: 'image/png', size: 0 }, { type: 'image/png', size: 21 * 1024 * 1024 }]) {
    assert.throws(() => validatePhoto(file));
  }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(recognizePhoto({ type: 'image/png', size: 10 }, { signal: controller.signal }), { name: 'AbortError' });
});

test('photo import saves an unambiguous subject from reviewed text and removes only a separate subject prefix', () => {
  const titles = ['数学 大P39', '数学 补P29–30', '语文订正', '背诵英语', '预习 P12', '语文和英语订正'];
  const result = importHomework([], titles.join('\n'), '2026-10-11', 'a');
  assert.deepEqual(result.tasks.map(task => task.subject), ['数学', '数学', '语文', '英语', '', '']);
  assert.deepEqual(result.tasks.map(task => task.title), ['大P39', '补P29–30', '语文订正', '背诵英语', '预习 P12', '语文和英语订正']);
});

test('math photo assignments keep subjects separate and repeated imports are skipped', () => {
  const text = '数学 计算能手P51\n数学 一张小练\n数学 大练P44\n数学 订正月考试卷正面（写过程）';
  const result = importHomework([], text, '2026-10-14', 'a');
  assert.deepEqual(result.tasks.map(t => t.title), ['计算能手P51', '一张小练', '大练P44', '订正月考试卷正面（写过程）']);
  assert.ok(result.tasks.every(t => t.subject === '数学'));
  assert.equal(importHomework(result.tasks, text, '2026-10-14', 'a').skipped, 4);
  const differentSubjects = importHomework([], '数学 订正\n语文 订正', '2026-10-14', 'a');
  assert.equal(differentSubjects.added, 2);
});
