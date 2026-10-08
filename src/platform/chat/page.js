export function renderChat(root) {
  root.innerHTML = `<section class="page"><h1>学习助手</h1><p class="muted">可以咨询学习问题、查询作业、讨论学习安排。发送的问题和相关作业会交给配置的模型服务处理。对话仅保留在当前页面，离开后清空。</p><div class="panel" id="chat-messages" role="log" aria-live="polite"></div><form class="panel"><label class="field">你的问题<textarea name="message" required maxlength="4000" rows="3" placeholder="今天有哪些作业？"></textarea></label><p class="error" role="alert"></p><button class="primary" type="submit">发送</button> <button class="secondary" type="button" id="stop-chat" disabled>停止回答</button></form></section>`;
  const form = root.querySelector('form'), log = root.querySelector('#chat-messages'), input = form.elements.message;
  const send = form.querySelector('[type=submit]'), stop = form.querySelector('#stop-chat'), error = form.querySelector('.error');
  let controller, history = [];
  function add(label, text) {
    const item = document.createElement('p');
    item.style.whiteSpace = 'pre-wrap';
    const title = document.createElement('strong'); title.textContent = label + '：';
    const body = document.createElement('span'); body.textContent = text;
    item.append(title, body); log.append(item); return body;
  }
  stop.onclick = () => controller?.abort();
  const observer = new MutationObserver(() => { if (!root.isConnected) { controller?.abort(); observer.disconnect(); } });
  observer.observe(document.querySelector('#app'), { childList: true });
  form.onsubmit = async event => {
    event.preventDefault();
    const message = input.value.trim(); if (!message || send.disabled) return;
    controller = new AbortController(); send.disabled = true; stop.disabled = false; error.textContent = '';
    add('你', message); const answer = add('助手', '');
    try {
      const response = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message, history}), signal:controller.signal });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || '无法连接学习助手。'); }
      const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '', done = false;
      const consume = line => { if (!line) return; const data = JSON.parse(line); if (data.type === 'error') throw new Error(data.error); if (data.type === 'text') answer.textContent += data.text; if (data.type === 'done') done = true; };
      while (true) { const chunk = await reader.read(); if (chunk.done) break; buffer += decoder.decode(chunk.value, {stream:true}); let index; while ((index = buffer.indexOf('\n')) !== -1) { consume(buffer.slice(0,index)); buffer = buffer.slice(index+1); } }
      buffer += decoder.decode(); if (buffer.trim()) consume(buffer);
      if (!done) throw new Error('回答中断，请重试。');
      history.push({role:'user', content:message}, {role:'assistant', content:answer.textContent});
      history = history.slice(-20); while (history.reduce((n,m)=>n+m.content.length,0)>32000) history.splice(0,2);
      input.value = '';
    } catch (err) { error.textContent = err.name === 'AbortError' ? '已停止回答。' : err.message; }
    finally { send.disabled = false; stop.disabled = true; }
  };
}
