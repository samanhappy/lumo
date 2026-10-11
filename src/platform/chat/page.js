import { preparePhoto } from '../tasks/ocr.js';
import { icon } from '../../ui.js';

export function renderChat(root) {
  root.innerHTML = `<section class="page chat-page"><header class="page-heading"><div><h1>学习助手</h1></div></header><div class="panel chat-panel"><div class="chat-log" id="chat-messages" role="log" aria-live="polite"><div class="chat-empty"><div class="empty-icon">${icon('book')}</div><h2>有什么想问的？</h2><p>查看今天的作业，或聊聊学习中遇到的问题。</p></div></div><form class="chat-compose"><div class="chat-input-box"><div class="chat-attachment" hidden><img alt="待发送的图片"><button class="chat-round" type="button" id="remove-image" aria-label="移除图片" title="移除图片">${icon('close')}</button></div><div class="chat-input-row"><div class="chat-upload"><button class="chat-round" type="button" id="attachment-menu" aria-label="添加附件" aria-expanded="false" aria-controls="attachment-options" title="添加图片">${icon('plus')}</button><div id="attachment-options" class="chat-upload-menu" hidden><button type="button" id="add-image">${icon('camera')}<span>添加图片<small>从设备上传照片</small></span></button><button type="button" id="take-chat-photo">${icon('camera')}<span>拍照<small>使用相机拍摄</small></span></button></div></div><input type="file" id="chat-image" accept="image/jpeg,image/png,image/webp" hidden><input type="file" id="chat-camera" accept="image/jpeg,image/png,image/webp" capture="environment" hidden><label class="chat-text-field"><span class="sr-only">你的问题</span><textarea name="message" maxlength="4000" rows="1" placeholder="向学习助手提问"></textarea></label><button class="chat-round" type="button" id="voice-input" aria-label="语音输入" title="语音输入" aria-pressed="false">${icon('microphone')}</button><button class="chat-round chat-send" type="submit" aria-label="发送" title="发送" disabled>${icon('send')}</button><button class="chat-round chat-send" type="button" id="stop-chat" aria-label="停止回答" title="停止回答" disabled>${icon('stop')}</button></div></div><span id="voice-status" class="muted" role="status"></span><p class="error" role="alert"></p><p class="chat-disclaimer muted">答案可能有错，请核对。</p></form></div></section>`;
  const form = root.querySelector('form'), log = root.querySelector('#chat-messages'), input = form.elements.message;
  const send = form.querySelector('[type=submit]'), stop = form.querySelector('#stop-chat'), error = form.querySelector('.error');
  const picker = form.querySelector('#chat-image'), attach = form.querySelector('#add-image'), preview = form.querySelector('.chat-attachment'), remove = form.querySelector('#remove-image'), voice = form.querySelector('#voice-input'), voiceStatus = form.querySelector('#voice-status');
  const camera = form.querySelector('#chat-camera'), takePhoto = form.querySelector('#take-chat-photo');
  const menuButton = form.querySelector('#attachment-menu'), menu = form.querySelector('#attachment-options');
  const closeMenu = () => { menu.hidden = true; menuButton.setAttribute('aria-expanded','false'); };
  menuButton.onclick = () => { menu.hidden = !menu.hidden; menuButton.setAttribute('aria-expanded',String(!menu.hidden)); };
  root.addEventListener('click', event => { if (!event.target.closest('.chat-upload')) closeMenu(); });
  form.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); menuButton.focus(); } });
  let controller, history = [], image, recognition, listening = false;
  let followReply = true;
  log.addEventListener('scroll', () => { followReply = log.scrollHeight - log.clientHeight - log.scrollTop <= 48; });
  const scrollToBottom = () => { log.scrollTop = log.scrollHeight; };
  function updateInput() {
    input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight,180) + 'px';
    send.disabled = !!controller || attach.disabled || (!input.value.trim() && !image);
  }
  input.oninput = updateInput;
  input.onkeydown = event => { if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); form.requestSubmit(); } };
  attach.onclick = () => { closeMenu(); picker.click(); };
  takePhoto.onclick = () => { closeMenu(); camera.click(); };
  remove.onclick = () => { image = undefined; picker.value = camera.value = ''; preview.hidden = true; preview.querySelector('img').removeAttribute('src'); updateInput(); };
  picker.onchange = camera.onchange = async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file || attach.disabled) return;
    attach.disabled = takePhoto.disabled = send.disabled = true; error.textContent = '';
    try { const prepared = await preparePhoto(file); if (!root.isConnected) return; image = prepared; preview.querySelector('img').src = `data:${image.mimeType};base64,${image.data}`; preview.hidden = false; }
    catch (err) { error.textContent = err.message; }
    finally { attach.disabled = takePhoto.disabled = false; updateInput(); }
  };
  // shortcut: browser speech recognition only, add server transcription when unsupported browsers need voice.
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  voice.onclick = () => {
    if (!SpeechRecognition) { error.textContent = '当前浏览器不支持语音输入，请使用支持语音识别的浏览器或输入文字。'; return; }
    if (listening) { recognition.stop(); return; }
    recognition = new SpeechRecognition(); recognition.lang = 'zh-CN'; recognition.interimResults = false;
    recognition.onresult = event => { if (!root.isConnected) return; const text = Array.from(event.results).map(r => r[0].transcript).join(''); input.value = (input.value + text).slice(0,4000); updateInput(); };
    recognition.onerror = event => { if (root.isConnected && event.error !== 'aborted') error.textContent = event.error === 'not-allowed' ? '请允许麦克风权限，并使用 HTTPS 或本地地址。' : '语音识别失败，请检查网络或重新尝试。'; };
    recognition.onend = () => { listening = false; voice.setAttribute('aria-label','语音输入'); voice.title = '语音输入'; voice.setAttribute('aria-pressed','false'); voiceStatus.textContent = ''; };
    try { recognition.start(); listening = true; voice.setAttribute('aria-label','结束语音'); voice.title = '结束语音'; voice.setAttribute('aria-pressed','true'); voiceStatus.textContent = '正在聆听…'; error.textContent = ''; }
    catch { error.textContent = '无法启动语音输入，请重试。'; }
  };
  function add(label, text, photo) {
    const item = document.createElement('p');
    item.className = label === '你' ? 'chat-message chat-user' : 'chat-message chat-assistant';
    log.querySelector('.chat-empty')?.remove();
    const title = document.createElement('strong'); title.textContent = label + '：';
    const body = document.createElement('span'); body.textContent = text;
    item.append(title, body); if (photo) { const img = document.createElement('img'); img.src = `data:${photo.mimeType};base64,${photo.data}`; img.alt = '提问图片'; img.onload = () => { if (followReply) scrollToBottom(); }; item.append(img); } log.append(item); scrollToBottom(); return body;
  }
  stop.onclick = () => controller?.abort();
  const observer = new MutationObserver(() => { if (!root.isConnected) { recognition?.abort(); remove.onclick(); controller?.abort(); observer.disconnect(); } });
  observer.observe(document.querySelector('#app'), { childList: true });
  form.onsubmit = async event => {
    event.preventDefault();
    const message = input.value.trim(); if ((!message && !image) || send.disabled) return;
    recognition?.abort(); const photo = image; closeMenu(); menuButton.disabled = true; attach.disabled = takePhoto.disabled = camera.disabled = picker.disabled = remove.disabled = voice.disabled = input.disabled = true;
    controller = new AbortController(); send.disabled = true; send.hidden = true; stop.disabled = false; error.textContent = '';
    followReply = true;
    add('你', message || '请帮我解释这张图片中的学习问题。', photo); const answer = add('助手', '正在思考…'); let received = false;
    try {
      const response = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message, history, image:photo}), signal:controller.signal });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || '无法连接学习助手。'); }
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '', done = false;
      const consume = line => { if (!line) return; const data = JSON.parse(line); if (data.type === 'error') throw new Error(data.error); if (data.type === 'text') { if (!received) answer.textContent = ''; received = true; answer.textContent += data.text; if (followReply) scrollToBottom(); } if (data.type === 'done') done = true; };
      while (true) { const chunk = await reader.read(); if (chunk.done) break; buffer += decoder.decode(chunk.value, {stream:true}); let index; while ((index = buffer.indexOf('\n')) !== -1) { consume(buffer.slice(0,index)); buffer = buffer.slice(index+1); } }
      buffer += decoder.decode(); if (buffer.trim()) consume(buffer);
      if (!done) throw new Error('回答中断，请重试。');
      if (!received || !answer.textContent.trim()) throw new Error('没有收到回答，请重试。');
      history.push({role:'user', content:message || '请帮我解释这张图片中的学习问题。'}, {role:'assistant', content:answer.textContent});
      history = history.slice(-20); while (history.reduce((n,m)=>n+m.content.length,0)>32000) history.splice(0,2);
      input.value = ''; remove.onclick();
    } catch (err) { if (!received) answer.parentElement.remove(); error.textContent = err.name === 'AbortError' ? '已停止回答。' : err.message === 'Failed to fetch' ? '连接失败，请检查网络后重试。' : err.message; }
    finally { attach.disabled = takePhoto.disabled = camera.disabled = picker.disabled = remove.disabled = voice.disabled = input.disabled = false; menuButton.disabled = false; controller = undefined; send.hidden = false; stop.disabled = true; updateInput(); }
  };
}
