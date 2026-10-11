import { attachDatePickers } from './date-picker.js';
import { recognizePhoto, validatePhoto } from './ocr.js';
import { homeworkLines, importHomework, loadTasks, storeTasks, formatDate } from './model.js';
import { icon, notify } from '../../ui.js';

export function photoImportDialog(root, { studentId, date, onImported }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'task-dialog photo-dialog';
  dialog.setAttribute('aria-labelledby', 'photo-title');
  dialog.innerHTML = `<form>
    <div class="section-heading"><h2 id="photo-title">拍照导入作业</h2><button type="button" class="quiet" id="close-photo" aria-label="关闭">${icon('close')}</button></div>
    <div class="photo-body"><div class="photo-select-actions">
      <button type="button" class="primary" id="take-photo">${icon('camera')} 拍照</button>
      <button type="button" class="secondary" id="choose-photo">选择图片</button>
      <input id="camera-file" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden>
      <input id="photo-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
    </div>
    <p class="photo-description">照片仅用于 AI 识别，用完不保存。</p>
    <div class="photo-review" hidden>
      <div class="photo-preview"><img alt="待识别的作业照片"></div>
      <label class="field"><span class="photo-review-heading">核对作业 <span id="photo-count" class="muted">0 项</span></span><span class="photo-hint muted">每行一项，可直接修改或删除。请核对学科、文字和页码。</span>
        <textarea name="homework" rows="8" maxlength="20000"></textarea>
      </label>
    </div>
    <p class="photo-status" role="status" aria-live="polite"></p>
    <p class="error" id="photo-error" role="alert"></p>
    </div><div class="photo-footer"><label class="field photo-date">导入日期<input name="date" type="date" required value="${date}"></label>
    <div class="dialog-actions"><button type="button" class="secondary" id="cancel-photo">取消</button><button type="submit" class="primary" id="save-photo" disabled>确认导入</button></div></div>
  </form>`;
  attachDatePickers(dialog);
  root.append(dialog);
  dialog.showModal();
  const $ = selector => dialog.querySelector(selector);
  const status = $('.photo-status'), error = $('#photo-error'), textarea = $('textarea'), save = $('#save-photo');
  let controller, previewURL, busy = false;
  const update = () => {
    const count = homeworkLines(textarea.value).length;
    save.disabled = busy || !count;
    $('#photo-count').textContent = `${count} 项`;
    save.textContent = count ? `确认导入 ${count} 项` : '确认导入';
  };
  const close = () => {
    controller?.abort();
    if (previewURL) URL.revokeObjectURL(previewURL);
    dialog.close();
    dialog.remove();
  };
  dialog.oncancel = event => { event.preventDefault(); close(); };
  $('#close-photo').onclick = close;
  $('#cancel-photo').onclick = close;
  $('#take-photo').onclick = () => $('#camera-file').click();
  $('#choose-photo').onclick = () => $('#photo-file').click();
  textarea.oninput = update;

  async function selectPhoto(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file || busy) return;
    error.textContent = '';
    try { validatePhoto(file); }
    catch (err) { error.textContent = err.message; return; }
    controller = new AbortController();
    busy = true;
    textarea.value = '';
    textarea.disabled = true;
    $('#take-photo').disabled = $('#choose-photo').disabled = true;
    update();
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = URL.createObjectURL(file);
    $('.photo-preview img').src = previewURL;
    $('.photo-review').hidden = false;
    status.textContent = '正在准备识别…';
    try {
      const result = await recognizePhoto(file, {
        signal: controller.signal,
        onProgress: message => { if (dialog.isConnected) status.textContent = message; }
      });
      if (!dialog.isConnected) return;
      const { text } = result;
      textarea.value = text;
      $('#take-photo').lastChild.textContent = ' 重新拍照';
      $('#choose-photo').textContent = '更换图片';
      status.textContent = text ? '识别完成，核对后即可导入。' : '没有识别到文字。可以重新拍照，也可以在上方手动填写。';
    } catch (err) {
      if (!dialog.isConnected || err.name === 'AbortError') return;
      status.textContent = '';
      error.textContent = err.message || '识别失败，请换一张清晰图片重试，也可以手动填写。';
    } finally {
      busy = false;
      textarea.disabled = false;
      $('#take-photo').disabled = $('#choose-photo').disabled = false;
      update();
    }
  }
  $('#camera-file').onchange = $('#photo-file').onchange = selectPhoto;
  $('form').onsubmit = async event => {
    event.preventDefault();
    if (busy || save.disabled) return;
    error.textContent = '';
    try {
      const importDate = $('input[name=date]').value;
      const result = importHomework(loadTasks(), textarea.value, importDate, studentId);
      // Validate the entire batch first, then persist once: no partial imports on errors.
      busy = true; update();
      await storeTasks(result.tasks);
      close();
      onImported(importDate);
      notify(`已导入 ${result.added} 项作业到 ${formatDate(importDate)}${result.skipped ? `，跳过 ${result.skipped} 项重复内容` : ''}。`);
    } catch (err) { error.textContent = err.message; }
    finally { busy = false; update(); }
  };
}
