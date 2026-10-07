import test from 'node:test';
import assert from 'node:assert/strict';
import { homeworkLines, importHomework, saveTask } from '../src/platform/tasks/model.js';
import { validatePhoto, recognizePhoto } from '../src/platform/tasks/ocr.js';

test('reviewed OCR lines become homework, skipping duplicate titles only for the target student and date', () => {
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

test('photo validation rejects unsupported, empty and oversized files before starting OCR', async () => {
  assert.doesNotThrow(() => validatePhoto({ type: 'image/jpeg', size: 1024 }));
  for (const file of [{ type: 'image/heic', size: 100 }, { type: 'image/png', size: 0 }, { type: 'image/png', size: 21 * 1024 * 1024 }]) {
    assert.throws(() => validatePhoto(file));
  }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(recognizePhoto({ type: 'image/png', size: 10 }, { signal: controller.signal }), { name: 'AbortError' });
});

test('bundled Chinese and English OCR models recognize a printed homework image', async () => {
  const { default: Tesseract } = await import('tesseract.js');
  const worker = await Tesseract.createWorker(['chi_sim', 'eng'], 1, {
    langPath: new URL('../public/ocr/', import.meta.url).pathname,
    cacheMethod: 'none'
  });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: '3' });
    const { data } = await worker.recognize(new URL('./fixtures/homework.png', import.meta.url).pathname);
    const text = data.text.replace(/\s/g, '');
    for (const title of ['数学练习册P32-33', '语文试卷订正', '英语课文背诵Unit2']) {
      assert.ok(text.includes(title), `OCR should retain ${title}`);
    }
  } finally { await worker.terminate(); }
});
