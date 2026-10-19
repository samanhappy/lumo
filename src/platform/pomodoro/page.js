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
      root.innerHTML=`<section class="page pomo-page"><header class="page-heading"><div><a class="pomo-back" href="/today">← 今日</a><h1>番茄钟</h1></div><button class="secondary" id="pomo-settings">设置</button></header><section class="panel pomo-timer ${state.mode!=='focus'?'pomo-rest':''}" aria-label="番茄钟"><div class="pomo-tabs" role="group" aria-label="计时模式">${Object.entries(labels).map(([k,v])=>`<button data-mode="${k}" aria-pressed="${state.mode===k}">${v}</button>`).join('')}</div>${tomatoDial()}<fieldset class="pomo-duration"><legend>分钟</legend><div>${[...new Set([...durationOptions(state.mode),state.settings[state.mode]])].sort((a,b)=>a-b).map(minutes=>`<button type="button" data-minutes="${minutes}" aria-pressed="${state.settings[state.mode]===minutes}" ${state.deadline||state.remaining!==state.settings[state.mode]*60?'disabled':''}>${minutes}</button>`).join('')}</div></fieldset><label class="pomo-topic-compact"> <input aria-label="专注内容" id="pomo-topic" maxlength="80" placeholder="想做什么？（选填）" value="${escape(state.topic)}" ${state.deadline?'disabled':''}></label><div class="pomo-controls"><button class="quiet" id="pomo-reset" aria-label="重置当前计时">↺ 重置</button><button class="primary" id="pomo-toggle">${state.deadline?'Ⅱ 暂停':secondsLeft(state)<state.settings[state.mode]*60?'▶ 继续':'▶ 开始'}</button></div><p id="pomo-message" class="pomo-message" role="status"></p></section><details class="pomo-summary"><summary>今日 ${today.length} 个番茄 · ${minutes} 分钟</summary>${today.length?`<ul class="pomo-records">${today.slice().reverse().map(x=>`<li><span>${escape(x.topic)}</span><span>${x.minutes} 分钟</span></li>`).join('')}</ul>`:'<p class="pomo-empty">暂无记录</p>'}</details><dialog class="pomo-dialog" aria-labelledby="pomo-settings-title"><form><h2 id="pomo-settings-title">设置</h2>${[['focus','专注时长',5,90],['short','短休息',1,30],['long','长休息',5,60]].map(([k,label,min,max])=>`<label class="field">${label}（${min}–${max}${k==='goal'?' 个':' 分钟'}）<input type="number" name="${k}" min="${min}" max="${max}" required value="${state.settings[k]}"></label>${k!=='goal'?`<div class="pomo-setting-presets">${durationOptions(k).map(value=>`<button type="button" data-setting="${k}" data-value="${value}">${value} 分钟</button>`).join('')}</div>`:''}`).join('')}<label><input type="checkbox" name="sound" ${state.settings.sound?'checked':''}> 完成时播放轻提示音</label><p class="error" role="alert"></p><div class="pomo-dialog-actions"><button type="button" class="quiet" id="pomo-cancel">取消</button><button class="primary">保存</button></div></form></dialog></section>`;
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
      dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();try{if(state.deadline||state.remaining!==state.settings[state.mode]*60)throw new Error('请先完成或重置当前计时，再调整设置。');const form=new FormData(e.target);const settings=validateSettings({...state.settings,...Object.fromEntries(form),sound:form.has('sound')});if(await save({...state,settings,remaining:settings[state.mode]*60})){draw();}}catch(error){dialog.querySelector('.error').textContent=error.message;}};
      update();
    }
    function update() {
      const left=secondsLeft(state), formatted=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;
      root.querySelector('#pomo-time').textContent=formatted;
      root.querySelector('#pomo-status').textContent=state.deadline?'正在'+labels[state.mode]:left<state.settings[state.mode]*60?'已暂停':'待开始';
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
      if(next!==state){if(await save(next)){chime();draw();root.querySelector('#pomo-message').textContent=next.mode==='focus'?'休息结束':'专注完成，休息一下';}else retryAfter=Date.now()+5000;}
      else update();
    },250);
}
