import { tomatoDial, durationOptions } from './dial.js';
import { read, write } from '../../storage.js';
import { escape, icon, notify } from '../../ui.js';
import { initialState, secondsLeft, complete, labels, dateKey, validateSettings, selectDuration } from './domain.js';
const key = id => `lumo:pomodoro:${id}`;
const load = id => read(key(id), initialState());
export function renderPomodoro(root,{studentId}) {
    let state=load(studentId), busy=false, audio, retryAfter=0, pendingSave=Promise.resolve();
    const originalTitle=document.title;
    function save(change) {
      const operation=pendingSave.then(async()=>{
        busy=true;
        try {
          const next=typeof change === 'function' ? change(state) : change;
          await write(key(studentId),next);
          state=next;
          return true;
        } catch(e) { notify(e.message); return false; }
        finally { busy=false; }
      });
      pendingSave=operation;
      return operation;
    }
    function chime() {
      if(!state.settings.sound || !audio) return;
      try { const osc=audio.createOscillator(), gain=audio.createGain(); osc.connect(gain);gain.connect(audio.destination);osc.frequency.value=660;gain.gain.setValueAtTime(.12,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+1);osc.start();osc.stop(audio.currentTime+1); } catch {}
    }
    function draw() {
      const today=state.sessions.filter(x=>dateKey(x.at)===dateKey());
      const minutes=today.reduce((n,x)=>n+x.minutes,0);
      const week=Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-6+i);return {day:dateKey(d.getTime()),label:i===6?'今天':`${d.getMonth()+1}/${d.getDate()}`,minutes:state.sessions.filter(x=>dateKey(x.at)===dateKey(d.getTime())).reduce((n,x)=>n+x.minutes,0)};});
      const max=Math.max(30,...week.map(x=>x.minutes));
      root.innerHTML=`<section class="page pomo-page"><header class="page-heading"><div><a class="pomo-back" href="/today">← 今日安排</a><h1>给专注一点时间<span class="pomo-spark">✦</span></h1><p>一次只做一件事，每一小步都算数。</p></div><button class="secondary" id="pomo-settings">${icon('edit')} 时长设置</button></header><div class="pomo-layout"><section class="panel pomo-timer ${state.mode!=='focus'?'pomo-rest':''}" aria-label="番茄钟"><div class="pomo-tabs" role="group" aria-label="计时模式">${Object.entries(labels).map(([k,v])=>`<button data-mode="${k}" aria-pressed="${state.mode===k}">${v}</button>`).join('')}</div>${tomatoDial()}<fieldset class="pomo-duration"><legend>选择${state.mode==='focus'?'专注':'休息'}时长 <span>· 分钟</span></legend><div>${[...new Set([...durationOptions(state.mode),state.settings[state.mode]])].sort((a,b)=>a-b).map(minutes=>`<button type="button" data-minutes="${minutes}" aria-pressed="${state.settings[state.mode]===minutes}" ${state.deadline||state.remaining!==state.settings[state.mode]*60?'disabled':''}>${minutes}</button>`).join('')}</div><p>${state.deadline||state.remaining!==state.settings[state.mode]*60?'完成或重置当前计时后可重新选择':'选一个适合自己的时间，准备好就开始'}</p></fieldset><p class="pomo-round">第 ${Math.floor(state.round/4)+1} 组 · ${state.round%4}/4 个番茄 <span>${'●'.repeat(state.round%4)}${'○'.repeat(4-state.round%4)}</span></p><div class="pomo-controls"><button class="quiet" id="pomo-reset" aria-label="重置当前计时">↺ 重置</button><button class="primary" id="pomo-toggle">${state.deadline?'Ⅱ 暂停':secondsLeft(state)<state.settings[state.mode]*60?'▶ 继续':'▶ 开始'+(state.mode==='focus'?'专注':'休息')}</button><button class="quiet" id="pomo-skip">跳过 ${icon('arrow')}</button></div><p class="pomo-hint">${state.mode==='focus'?'准备好书本和水，让手机也休息一下。':'看看远处，喝口水。休息也是学习的一部分。'}</p><p id="pomo-message" class="pomo-message" role="status"></p></section><aside class="pomo-side"><section class="panel pomo-goal"><span class="pomo-eyebrow">TODAY’S LITTLE WINS</span><h2>今天的专注</h2><div class="pomo-stats"><div><strong>${today.length}<small> / ${state.settings.goal}</small></strong><span>个番茄</span></div><div><strong>${minutes}<small> 分钟</small></strong><span>累计专注</span></div></div><progress value="${Math.min(today.length,state.settings.goal)}" max="${state.settings.goal}" aria-label="今日目标进度"></progress><p>${today.length>=state.settings.goal?'今日目标达成！给努力的自己一个赞。':`再完成 ${state.settings.goal-today.length} 个，就能点亮今日目标。`}</p></section><section class="panel pomo-topic"><h2>${icon('book')} 这次想学什么？</h2><label class="field">给专注一个小目标<input id="pomo-topic" maxlength="80" placeholder="例如：读完 10 页课外书" value="${escape(state.topic)}" ${state.deadline?'disabled':''}></label><p>目标不用大，清楚就很好。离开输入框后保存。</p></section><section class="pomo-tip"><span>✧</span><div><strong>找到自己的节奏</strong><p>可以从 15 分钟开始。每完成 4 轮专注，奖励自己一次长休息。</p></div></section></aside></div><section class="panel pomo-history"><div class="pomo-history-heading"><h2>专注的足迹</h2><span>近 7 天 · ${week.reduce((n,x)=>n+x.minutes,0)} 分钟</span></div><div class="pomo-chart">${week.map(x=>`<div><span>${x.minutes || '—'}</span><div class="pomo-bar-track"><i style="height:${Math.max(3,x.minutes/max*100)}%" title="${x.day}：${x.minutes} 分钟"></i></div><span>${x.label}</span></div>`).join('')}</div><h3>今日记录</h3>${today.length?`<ul class="pomo-records">${today.slice().reverse().map(x=>`<li><span>✦ ${escape(x.topic)}</span><span>${new Date(x.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})} · ${x.minutes} 分钟</span></li>`).join('')}</ul>`:'<p class="pomo-empty">还没有完成的番茄。种下今天的第一份专注吧。</p>'}</section><dialog class="pomo-dialog" aria-labelledby="pomo-settings-title"><form><h2 id="pomo-settings-title">调整你的学习节奏</h2><p>新的时长会从下一次计时开始使用。</p>${[['focus','专注时长',5,90],['short','短休息',1,30],['long','长休息',5,60],['goal','每日目标',1,12]].map(([k,label,min,max])=>`<label class="field">${label}（${min}–${max}${k==='goal'?' 个':' 分钟'}）<input type="number" name="${k}" min="${min}" max="${max}" required value="${state.settings[k]}"></label>${k!=='goal'?`<div class="pomo-setting-presets">${durationOptions(k).map(value=>`<button type="button" data-setting="${k}" data-value="${value}">${value} 分钟</button>`).join('')}</div>`:''}`).join('')}<label><input type="checkbox" name="sound" ${state.settings.sound?'checked':''}> 完成时播放轻提示音</label><p>声音需要浏览器支持；页面关闭后无法响铃。</p><p class="error" role="alert"></p><div class="pomo-dialog-actions"><button type="button" class="quiet" id="pomo-cancel">取消</button><button class="primary">保存设置</button></div></form></dialog></section>`;
      root.querySelector('#pomo-toggle').onclick=async()=>{
        const topic=root.querySelector('#pomo-topic').value.trim();
        try { const Audio=window.AudioContext||window.webkitAudioContext; if(Audio){audio??=new Audio(); await audio.resume();} } catch {}
        if(await save(current=>{
          const next=structuredClone(current);
          next.topic=topic;
          if(next.deadline){next.remaining=secondsLeft(next);next.deadline=null;}
          else next.deadline=Date.now()+next.remaining*1000;
          return next;
        })) { draw(); root.querySelector('#pomo-toggle').focus({preventScroll:true}); }
      };
      async function reset(mode) { if(await save(current=>({...current,mode,deadline:null,remaining:current.settings[mode]*60})))draw(); }
      root.querySelector('#pomo-reset').onclick=()=>{if(!state.deadline&&state.remaining===state.settings[state.mode]*60)return; if(confirm('重新计时？本轮未完成的专注不会计入记录。'))reset(state.mode);};
      root.querySelector('#pomo-skip').onclick=()=>{if(confirm('跳过本轮？未完成的专注不会计入记录。'))reset(state.mode==='focus'?'short':'focus');};
      root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(b.dataset.mode===state.mode)return;if(state.deadline||state.remaining<state.settings[state.mode]*60){if(!confirm('切换模式会结束本轮，未完成的专注不会计入记录。'))return;}reset(b.dataset.mode);});
      root.querySelector('#pomo-topic').onchange=async e=>{const topic=e.target.value.trim();if(!await save(current=>({...current,topic})))e.target.value=state.topic;};
      root.querySelectorAll('[data-minutes]').forEach(button=>button.onclick=async()=>{
        const minutes=Number(button.dataset.minutes);
        if(await save(current=>selectDuration(current,minutes))) {
          draw();
          root.querySelector(`[data-minutes="${minutes}"]`)?.focus({preventScroll:true});
        }
      });
      const dialog=root.querySelector('dialog');
      dialog.querySelectorAll('[data-setting]').forEach(button=>button.onclick=()=>{
        dialog.querySelector(`[name="${button.dataset.setting}"]`).value=button.dataset.value;
      });
      root.querySelector('#pomo-settings').onclick=()=>dialog.showModal();
      root.querySelector('#pomo-cancel').onclick=()=>dialog.close();
      dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();try{if(state.deadline||state.remaining!==state.settings[state.mode]*60)throw new Error('请先完成或重置当前计时，再调整设置。');const form=new FormData(e.target);const settings=validateSettings({...Object.fromEntries(form),sound:form.has('sound')});if(await save({...state,settings,remaining:settings[state.mode]*60})){draw();}}catch(error){dialog.querySelector('.error').textContent=error.message;}};
      update();
    }
    function update() {
      const left=secondsLeft(state), formatted=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;
      root.querySelector('#pomo-time').textContent=formatted;
      root.querySelector('#pomo-status').textContent=state.deadline?'正在'+labels[state.mode]:left<state.settings[state.mode]*60?'已暂停 · 按自己的节奏来':'准备好了就开始';
      const preciseLeft=state.deadline===null?state.remaining:Math.max(0,(state.deadline-Date.now())/1000);
      const elapsed=state.settings[state.mode]*60-preciseLeft;
      root.querySelector('.pomo-scale').style.transform=`rotate(${Math.max(0,elapsed)*6}deg)`;
      document.title=state.deadline?`${formatted} · ${labels[state.mode]} · Lumo`:originalTitle;
    }
    draw();
    const timer=setInterval(async()=>{
      if(!root.isConnected){clearInterval(timer);document.title=originalTitle;audio?.close();return;}
      if(busy||Date.now()<retryAfter)return;
      const next=complete(state);
      if(next!==state){if(await save(next)){chime();draw();root.querySelector('#pomo-message').textContent=next.mode==='focus'?'休息结束，准备好再开始下一轮。':'做得很好！这一份专注已记录，开始休息吧。';}else retryAfter=Date.now()+5000;}
      else update();
    },250);
}
