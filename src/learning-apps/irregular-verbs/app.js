import { WORDS, createDeck, optionsFor, isCorrect, updateMastery } from './domain.js';
import { loadState, saveState } from './repository.js';
import { escape, icon, navigate, notify } from '../../ui.js';
const base='/apps/irregular-verbs';
const labels={learn:'词卡学习',choice:'闯关练习',test:'拼写测试',wrong:'错题重练'};
const wordById = id=>WORDS.find(w=>w.id===id);
const mastered = state=>WORDS.filter(w=>(state.mastery[w.id]?.mastery_score||0)>=75);
const wrongWords = state=>WORDS.filter(w=>state.mastery[w.id]?.last_correct===false);
export const irregularVerbs={
  getSummary(studentId) {
    const state=loadState(studentId), wrong=wrongWords(state).length;
    return {title:'不规则过去式',progressText:state.active?'上次练习尚未完成':wrong?`${wrong} 个单词需要继续练习`:state.sessions.length?`已掌握 ${mastered(state).length} / ${WORDS.length} 个单词`:'84 个词条 · 每轮最多 10 题',estimatedMinutes:8};
  },
  async start(studentId, mode='choice') {
    if(!labels[mode])throw new Error('无效的练习模式');
    const state=loadState(studentId),deck=createDeck(mode,state.mastery);
    if(!deck.length)throw new Error('暂时没有错题，先去闯关吧。');
    const session={id:crypto.randomUUID(),student_id:studentId,mode,deck:deck.map(w=>w.id),index:0,started_at:new Date().toISOString(),ended_at:null,correct_count:0,total_count:0,results:[],question_started_at:Date.now(),options:mode==='test'||mode==='learn'?[]:optionsFor(deck[0]),flipped:false};
    await saveState(studentId,{...state,active:session});return session;
  },
  render(root, context, path) {
    const studentId=context.studentId,state=loadState(studentId);
    if(path===base+'/study'&&state.active)renderStudy(root,studentId,state);
    else if(path===base+'/result')renderResult(root,studentId,state);
    else renderHome(root,studentId,state);
  }
};
let saving = false;
async function safely(action) { if (saving) return; saving = true; try{await action()}catch(e){notify(e.message)}finally{saving=false} }
function begin(studentId,mode){safely(async()=>{await irregularVerbs.start(studentId,mode);navigate(base+'/study')})}
function renderHome(root,studentId,state) {
  const count=mastered(state).length,wrong=wrongWords(state),active=state.active;
  const last=state.sessions.at(-1);
  const latestTest=state.sessions.findLast(s=>s.mode==='test' && s.total_count>0);
  const dateLabel=value=>{
    const date=new Date(value);
    return Number.isNaN(date.getTime())?'':date.toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
  };
  const completed=active?Math.min(active.deck.length,active.index+(active.results[active.index]?1:0)):0;
  const descriptions={learn:'翻开词卡，认识和记忆过去式',choice:'选一选，在练习中巩固记忆',test:'写一写，看看自己记住了多少'};
  const lastRecord=active?`上次学习：${labels[active.mode]} · 已${active.mode==='learn'?'浏览':'作答'} ${completed} / ${active.deck.length} ${active.mode==='learn'?'张':'题'} · ${dateLabel(active.started_at)}`:last?`上次学习：${labels[last.mode]} · ${last.mode==='learn'?`浏览 ${last.deck.length} 张词卡`:`完成 ${last.total_count} 题`} · ${dateLabel(last.ended_at||last.started_at)}`:'还没有学习记录，从第一张词卡开始吧。';
  const roundTotal=active?active.deck.length:last?10:WORDS.length;
  const play='<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4a1.5 1.5 0 0 1 2.3-1.3l12 8a1.5 1.5 0 0 1 0 2.6l-12 8A1.5 1.5 0 0 1 7 20Z"/></svg>';
  const target='<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M28 15a12 12 0 1 1-11-11M22 15a6 6 0 1 1-6-5M16 16 28 4m-1 0v5h-5"/></svg>';
  const star='<svg width="38" height="38" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="m20 2 5.5 11.2L38 15l-9 8.8L31 36l-11-5.8L9 36l2-12.2L2 15l12.5-1.8Z"/></svg>';
  root.innerHTML=`<section class="page app-home iv-home"><a class="back-link" href="/apps">‹ 返回应用</a>
  <header class="page-heading"><div><h1>不规则过去式 <span class="sun" aria-hidden="true">✦</span></h1><p>每天学一点，轻松掌握 ${WORDS.length} 个单词！</p></div></header>
  <div class="iv-scene"><img class="iv-illustration" src="/public/irregular-verbs-hero.png" alt="" aria-hidden="true">
  <section class="iv-focus" aria-labelledby="iv-next-title">
    <div class="iv-focus-copy"><span class="iv-eyebrow">${target} 本轮学习</span>
    <h2 id="iv-next-title"><span>${active?'继续':'学习'} ${roundTotal}</span> 个单词</h2>
    <p>${active?labels[active.mode]:last?'闯关练习':'词卡学习'}，一起加油吧！</p></div>
    <div class="iv-progress"><div class="iv-track" role="progressbar" aria-label="本轮学习进度" aria-valuemin="0" aria-valuemax="${roundTotal}" aria-valuenow="${completed}"><i style="width:${completed/roundTotal*100}%"></i></div><span class="iv-round-count"><b>${completed}</b> / ${roundTotal}</span></div>
    <div class="iv-start">${active?`<a id="iv-start" class="primary" href="${base}/study">${play} 继续学习</a>`:`<button id="iv-start" class="primary">${play} 开始学习</button>`}<p class="iv-last">${lastRecord}</p></div>
  </section></div>
  <dl class="iv-summary">
    <div class="iv-mastery"><span class="iv-stat-icon">${icon('book')}</span><div><dd><strong>${count}<small> / ${WORDS.length}</small></strong></dd><dt>已掌握单词</dt><div class="iv-mini-track" aria-hidden="true"><i style="width:${count/WORDS.length*100}%"></i></div></div></div>
    <div class="iv-test"><span class="iv-stat-icon">${target}</span><div><dd>${latestTest?`<strong>${latestTest.correct_count}<small> / ${latestTest.total_count}</small></strong>`:'<strong class="iv-empty">暂无成绩</strong>'}</dd><dt>最近测试成绩</dt><div class="iv-mini-track" aria-hidden="true"><i style="width:${latestTest?latestTest.correct_count/latestTest.total_count*100:0}%"></i></div></div></div>
    <div class="iv-review-stat"><span class="iv-stat-icon">${star}</span><div><dd><strong>${wrong.length}</strong></dd><dt>待复习单词</dt></div>${wrong.length?`<button class="iv-review" data-mode="wrong" aria-label="复习错题">${icon('arrow')}</button>`:''}</div>
  </dl>
  <details class="iv-modes"><summary>学习模式 <span>词卡学习 · 闯关练习 · 拼写测试</span></summary><div class="iv-mode-grid">${['learn','choice','test'].map((mode,index)=>`<button data-mode="${mode}" class="iv-mode"><span class="iv-mode-icon" aria-hidden="true">${icon(['book','check','edit'][index])}</span><span><strong>${labels[mode]}</strong><small>${descriptions[mode]}</small></span>${icon('arrow')}</button>`).join('')}</div></details></section>`;
  if(!active)root.querySelector('#iv-start').onclick=e=>{e.preventDefault();begin(studentId,last?'choice':'learn')};
  root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
    if(!state.active){begin(studentId,b.dataset.mode);return}
    const dialog=document.createElement('dialog');dialog.className='task-dialog';dialog.innerHTML=`<h2>开始新的练习？</h2><p>新练习会替换未完成的这一轮，已答题的进度会保留。</p><div class="dialog-actions"><button class="secondary" id="keep-session">继续上次</button><button class="primary" id="new-session">开始新练习</button></div>`;root.append(dialog);dialog.showModal();dialog.onclose=()=>dialog.remove();dialog.querySelector('#keep-session').onclick=()=>{dialog.close();navigate(base+'/study')};dialog.querySelector('#new-session').onclick=()=>{dialog.close();begin(studentId,b.dataset.mode)};
  });
}
function renderStudy(root,studentId,state) {
  const s=state.active,w=wordById(s.deck[s.index]),answer=s.results[s.index],learn=s.mode==='learn';
  if(!w){navigate(base);return}
  const streak=s.results.slice().reverse().findIndex(r=>!r.correct);
  const run=streak===-1?s.results.length:streak;
  root.innerHTML=`<section class="page study-page"><div class="study-top"><a class="quiet" href="${base}" aria-label="返回不规则过去式">${icon('close')}</a><div class="study-track" role="progressbar" aria-label="练习进度" aria-valuemin="0" aria-valuemax="${s.deck.length}" aria-valuenow="${s.index+(answer?1:0)}"><i style="width:${(s.index+(answer?1:0))/s.deck.length*100}%"></i></div><span>${s.index+1} <small>/ ${s.deck.length}</small></span></div><div class="study-layout"><section class="panel game"><div class="game-heading"><span>${labels[s.mode]}</span></div><div class="prompt"><p>${w.cn}</p><h1>${w.base}</h1><span>${learn?'它的过去式是什么？':s.mode==='test'?'输入这个动词的过去式':'它的过去式是什么？'}</span></div>
  <div class="answer-area">${learn?`<button id="flip" class="flashcard ${s.flipped?'flipped':''}">${s.flipped?`<strong>${w.answers.join(' / ')}</strong><small>${w.base==='read'?'过去式读作 /red/，拼写不变':'点击收起答案'}</small>`:'点击翻开词卡 ↻'}</button>`:s.mode==='test'?`<form class="spell"><label class="sr-only" for="past-answer">输入过去式</label><input id="past-answer" name="answer" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="80" placeholder="写下你的答案" value="${escape(answer?.answer||'')}" ${answer?'disabled':''}><button class="primary" ${answer?'disabled':''}>提交答案</button></form>`:`<div class="options">${s.options.map(a=>`<button class="option ${answer?(w.answers.includes(a)?'correct':a===answer.answer?'incorrect':''):''}" data-answer="${a}" ${answer?'disabled':''}>${a}${answer&&w.answers.includes(a)?icon('check'):''}</button>`).join('')}</div>`}</div>
  <div class="feedback-space" aria-live="polite">${answer?`<div class="feedback ${answer.correct?'good':'bad'}"><span class="feedback-icon">${answer.correct?'✦':'↻'}</span><div><h3>${answer.correct?'太棒了！'+(run>=2?` 连对 ${run} 题`:''):'再记一次，下次会更好'}</h3><p>${w.base} 的过去式是 <b>${w.answers.join(' / ')}</b>。${w.base==='read'?'读作 /red/。':''}</p></div><button class="primary" id="next">${s.index===s.deck.length-1?'查看结果':'下一题'} ${icon('arrow')}</button></div>`:learn?`<div class="actions"><button class="secondary" id="prev" ${s.index===0?'disabled':''}>上一张</button><button class="primary" id="next">${s.index===s.deck.length-1?'完成学习':'下一张'} ${icon('arrow')}</button></div>`:''}</div></section></div></section>`;
  async function saveActive(updated){await saveState(studentId,{...loadState(studentId),active:updated});renderStudy(root,studentId,loadState(studentId))}
  async function nextQuestion(session){
    if(session.index===session.deck.length-1){const ended={...session,ended_at:new Date().toISOString()};await saveState(studentId,{...loadState(studentId),active:null,sessions:[...loadState(studentId).sessions,ended]});navigate(base+'/result')}
    else {const next=wordById(session.deck[session.index+1]);await saveActive({...session,index:session.index+1,question_started_at:Date.now(),flipped:false,options:learn||session.mode==='test'?[]:optionsFor(next)})}
  }
  function check(a){safely(async()=>{
    const latest=loadState(studentId),session=latest.active;
    if(!session||session.id!==s.id||session.results[s.index])return;
    const now=new Date().toISOString(),correct=isCorrect(w,a);
    const attempt={id:crypto.randomUUID(),session_id:s.id,student_id:studentId,word_id:w.id,answer:a,correct,duration_ms:Math.max(0,Date.now()-s.question_started_at),created_at:now};
    const active={...s,results:[...s.results,attempt],correct_count:s.correct_count+Number(correct),total_count:s.total_count+1};
    await saveState(studentId,{...latest,active,attempts:[...latest.attempts,attempt],mastery:{...latest.mastery,[w.id]:updateMastery(latest.mastery[w.id],correct,now)}});
    if(correct)await nextQuestion(active);
    else {renderStudy(root,studentId,loadState(studentId));root.querySelector('#next')?.focus()}
  })}
  root.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>check(b.dataset.answer));
  if(root.querySelector('.spell'))root.querySelector('.spell').onsubmit=e=>{e.preventDefault();const a=new FormData(e.target).get('answer').trim();if(a)check(a)};
  if(!answer)root.querySelector('#past-answer')?.focus();
  if(learn)root.querySelector('#flip').onclick=()=>safely(()=>saveActive({...s,flipped:!s.flipped}));
  if(root.querySelector('#prev'))root.querySelector('#prev').onclick=()=>safely(()=>saveActive({...s,index:s.index-1,flipped:false}));
  if(root.querySelector('#next'))root.querySelector('#next').onclick=()=>safely(()=>nextQuestion(s));
}
function renderResult(root,studentId,state) {
  const s=state.sessions.at(-1);
  if(!s){root.innerHTML=`<section class="page empty-state"><h1>还没有练习结果</h1><a class="primary" href="${base}">去练习</a></section>`;return}
  const learn=s.mode==='learn',good=s.results.filter(a=>a.correct),bad=s.results.filter(a=>!a.correct);
  const unique=items=>[...new Map(items.map(a=>[a.word_id,a])).values()];
  root.innerHTML=`<section class="page result-page"><div class="result-medal" aria-hidden="true">☆</div><div class="eyebrow">练习结果</div><h1>${learn?'词卡学习完成！':'这轮练习完成！'} <span>🎉</span></h1><div class="result-stats ${learn?'cards-stats':''}"><div><b>${learn?s.deck.length:s.total_count}<small> ${learn?'词':'题'}</small></b><span>${learn?'浏览词卡':'总题数'}</span></div>${!learn?`<div><b>${s.correct_count}<small> 题</small></b><span>答对</span></div><div><b>${s.total_count?Math.round(s.correct_count/s.total_count*100)+'%':'—'}</b><span>正确率</span></div>`:''}</div>
  ${!learn?`<div class="result-columns"><section class="result-box good"><h3>✓ 这次答对</h3>${good.length?unique(good).map(a=>{const w=wordById(a.word_id);return `<p>✓ <b>${w.base}</b> <span>→ ${w.answers.join(' / ')}</span></p>`}).join(''):'<p>下一轮，试着记住一个新单词。</p>'}</section><section class="result-box bad"><h3>↻ 还需要练习</h3>${bad.length?unique(bad).map(a=>{const w=wordById(a.word_id);return `<p>• <b>${w.base}</b> <span>→ ${w.answers.join(' / ')}</span></p>`}).join(''):'<p>这轮全部答对啦，继续保持！</p>'}</section></div>`:''}
  <div class="result-actions"><a class="secondary" href="/today">返回今日</a>${bad.length?'<button class="secondary" id="retry">练习错题</button>':''}<button class="primary" id="again">${learn?'开始闯关':'再练一组'} ${icon('arrow')}</button></div></section>`;
  root.querySelector('#again').onclick=()=>begin(studentId,learn||s.mode==='wrong'?'choice':s.mode);
  if(root.querySelector('#retry'))root.querySelector('#retry').onclick=()=>begin(studentId,'wrong');
}
