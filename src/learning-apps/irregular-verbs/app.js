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
    return {title:'不规则过去式',progressText:state.active?'上次的练习还没完成，继续探险吧':wrong?`${wrong} 个单词需要继续练习`:state.sessions.length?`已掌握 ${mastered(state).length} / ${WORDS.length} 个单词`:'先记住，再挑战。每一轮 10 题',estimatedMinutes:8};
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
  const count=mastered(state).length,wrong=wrongWords(state);
  const days=new Set(state.sessions.map(s=>new Date(s.started_at).toLocaleDateString('zh-CN'))).size;
  root.innerHTML=`<section class="page app-home"><a class="back-link" href="/today">‹ 返回今日</a><header class="page-heading"><div><div class="eyebrow">英语 · VERB QUEST</div><h1>不规则过去式 <span class="sun">✦</span></h1><p>先记住，再挑战。把过去式，变成你的得分项。</p></div><div class="word-label">84 个词条 · 每轮 10 题</div></header>
  <section class="study-hero"><div class="hero-copy"><span class="eyebrow">今天也进步一点点</span><h2>每一次练习，<br>都让记忆更牢一点。</h2><p>认识单词的变化，发现英语的小规律。<br>选一选、写一写，慢慢变成你的拿手项。</p><div class="goal"><b>今天的学习目标</b><span>完成 10 道题 · 预计 5–8 分钟</span><span>${wrong.length?`重点复习 ${wrong.length} 个还不熟悉的单词`:'从一轮轻松的练习开始'}</span></div></div><div class="word-art" aria-hidden="true"><div class="art-sun">☀</div><span class="floating-word w1">go</span><span class="floating-word w2">went</span><span class="floating-word w3">take</span><span class="floating-word w4">took</span><div class="book-art"><div>A</div><div>B</div></div><span class="art-star">✦</span><div class="art-caption">LET’S EXPLORE!</div></div></section>
  ${state.active?`<div class="resume-bar"><span>上次的${labels[state.active.mode]}：${Math.min(state.active.index+1,state.active.deck.length)} / ${state.active.deck.length}</span><a class="primary" href="${base}/study">继续上次练习 ${icon('arrow')}</a></div>`:''}
  <div class="mode-grid">${Object.entries(labels).map(([mode,title],i)=>`<button data-mode="${mode}" class="mode-card ${mode==='choice'?'featured':''}" ${mode==='wrong'&&!wrong.length?'disabled':''}><span class="mode-number">0${i+1}</span><strong>${title}</strong><small>${{learn:'翻开词卡，认识变化',choice:'选出正确的过去式',test:'写出记住的过去式',wrong:`${wrong.length} 个单词等你再挑战`}[mode]}</small>${icon('arrow')}</button>`).join('')}</div>
  <div class="stats-grid"><section class="panel stat"><h3>我的进度</h3><div class="progress-ring" style="--progress:${count/WORDS.length*360}deg"><b>${Math.round(count/WORDS.length*100)}<small>%</small></b></div><p>已掌握 ${count} / ${WORDS.length} 个单词</p><small class="muted">掌握度达到 75% 即计入已掌握</small></section><section class="panel stat"><h3>最近需要复习</h3>${wrong.length?wrong.slice(0,3).map(w=>`<div class="review-pill">↻ <span>${w.base}</span></div>`).join(''):'<p class="stat-empty">没有待复习的错题<br>准备好开始新挑战了吗？</p>'}</section><section class="panel stat"><h3>累计练习</h3><div class="big-stat">${days}<small> 天</small></div><p>已完成 ${state.sessions.length} 轮练习</p><span class="muted">每一点努力，都会被记住。</span></section></div><footer>学习记录保存在 Lumo 数据库 · 持续练习，慢慢掌握</footer></section>`;
  root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
    if(!state.active){begin(studentId,b.dataset.mode);return}
    const dialog=document.createElement('dialog');dialog.className='task-dialog';dialog.innerHTML=`<h2>开始新的练习？</h2><p>上次练习还没完成。已提交的答案和掌握度会保留，未完成的这一轮将被替换。</p><div class="dialog-actions"><button class="secondary" id="keep-session">继续上次</button><button class="primary" id="new-session">开始新练习</button></div>`;root.append(dialog);dialog.showModal();dialog.onclose=()=>dialog.remove();dialog.querySelector('#keep-session').onclick=()=>{dialog.close();navigate(base+'/study')};dialog.querySelector('#new-session').onclick=()=>{dialog.close();begin(studentId,b.dataset.mode)};
  });
}
function renderStudy(root,studentId,state) {
  const s=state.active,w=wordById(s.deck[s.index]),answer=s.results[s.index],learn=s.mode==='learn';
  if(!w){navigate(base);return}
  const streak=s.results.slice().reverse().findIndex(r=>!r.correct);
  const run=streak===-1?s.results.length:streak;
  root.innerHTML=`<section class="page study-page"><div class="study-top"><a class="quiet" href="${base}" aria-label="返回学习应用">${icon('close')}</a><div class="study-track" role="progressbar" aria-label="练习进度" aria-valuemin="0" aria-valuemax="${s.deck.length}" aria-valuenow="${s.index+(answer?1:0)}"><i style="width:${(s.index+(answer?1:0))/s.deck.length*100}%"></i></div><span>${s.index+1} <small>/ ${s.deck.length}</small></span></div><div class="study-layout"><section class="panel game"><div class="game-heading"><span>${labels[s.mode]}</span><span>${learn?'想一想，再翻开':'慢慢来，你可以的'}</span></div><div class="prompt"><p>${w.cn}</p><h1>${w.base}</h1><span>${learn?'想一想，它的过去式是什么？':s.mode==='test'?'输入这个动词的过去式':'它的过去式是什么？'}</span></div>
  <div class="answer-area">${learn?`<button id="flip" class="flashcard ${s.flipped?'flipped':''}">${s.flipped?`<strong>${w.answers.join(' / ')}</strong><small>${w.base==='read'?'过去式读作 /red/，拼写不变':'点击收起答案'}</small>`:'点击翻开词卡 ↻'}</button>`:s.mode==='test'?`<form class="spell"><label class="sr-only" for="past-answer">输入过去式</label><input id="past-answer" name="answer" autocomplete="off" autocapitalize="none" spellcheck="false" required maxlength="80" placeholder="写下你的答案" value="${escape(answer?.answer||'')}" ${answer?'disabled':''}><button class="primary" ${answer?'disabled':''}>提交答案</button></form>`:`<div class="options">${s.options.map(a=>`<button class="option ${answer?(w.answers.includes(a)?'correct':a===answer.answer?'incorrect':''):''}" data-answer="${a}" ${answer?'disabled':''}>${a}${answer&&w.answers.includes(a)?icon('check'):''}</button>`).join('')}</div>`}</div>
  <div class="feedback-space" aria-live="polite">${answer?`<div class="feedback ${answer.correct?'good':'bad'}"><span class="feedback-icon">${answer.correct?'✦':'↻'}</span><div><h3>${answer.correct?'太棒了！'+(run>=2?` 连对 ${run} 题`:''):'再记一次，下次会更好'}</h3><p>${w.base} 的过去式是 <b>${w.answers.join(' / ')}</b>。${w.base==='read'?'读作 /red/。':''}</p></div><button class="primary" id="next">${s.index===s.deck.length-1?'查看结果':'下一题'} ${icon('arrow')}</button></div>`:learn?`<div class="actions"><button class="secondary" id="prev" ${s.index===0?'disabled':''}>上一张</button><button class="primary" id="next">${s.index===s.deck.length-1?'完成学习':'下一张'} ${icon('arrow')}</button></div>`:'<p class="muted gentle-note">认真思考，比答得快更重要。</p>'}</div></section><aside class="handbook"><h3>探险手册 <span>84 词条</span></h3><div class="tip"><b>先辨词义，再看变化</b><p>lie 表示“躺”时 → lay<br>表示“说谎”时 → lied</p></div><div class="tip"><b>拼写相同，读音不同</b><p>read 的过去式仍写作 read，读作 /red/。</p></div><div class="tip"><b>两种写法都正确</b><p>learn → learnt / learned<br>smell → smelt / smelled<br>shine → shone / shined</p></div><p class="muted">保留原词表的 84 个词条，含 do 的两种用法与两个 lie 词条。</p></aside></div></section>`;
  async function saveActive(updated){await saveState(studentId,{...loadState(studentId),active:updated});renderStudy(root,studentId,loadState(studentId))}
  function check(a){safely(async()=>{
    const latest=loadState(studentId),session=latest.active;
    if(!session||session.id!==s.id||session.results[s.index])return;
    const now=new Date().toISOString(),correct=isCorrect(w,a);
    const attempt={id:crypto.randomUUID(),session_id:s.id,student_id:studentId,word_id:w.id,answer:a,correct,duration_ms:Math.max(0,Date.now()-s.question_started_at),created_at:now};
    const active={...s,results:[...s.results,attempt],correct_count:s.correct_count+Number(correct),total_count:s.total_count+1};
    await saveState(studentId,{...latest,active,attempts:[...latest.attempts,attempt],mastery:{...latest.mastery,[w.id]:updateMastery(latest.mastery[w.id],correct,now)}});
    renderStudy(root,studentId,loadState(studentId));root.querySelector('#next')?.focus();
  })}
  root.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>check(b.dataset.answer));
  if(root.querySelector('.spell'))root.querySelector('.spell').onsubmit=e=>{e.preventDefault();const a=new FormData(e.target).get('answer').trim();if(a)check(a)};
  if(learn)root.querySelector('#flip').onclick=()=>safely(()=>saveActive({...s,flipped:!s.flipped}));
  if(root.querySelector('#prev'))root.querySelector('#prev').onclick=()=>safely(()=>saveActive({...s,index:s.index-1,flipped:false}));
  if(root.querySelector('#next'))root.querySelector('#next').onclick=()=>safely(async()=>{
    if(s.index===s.deck.length-1){const ended={...s,ended_at:new Date().toISOString()};await saveState(studentId,{...loadState(studentId),active:null,sessions:[...loadState(studentId).sessions,ended]});navigate(base+'/result')}
    else {const next=wordById(s.deck[s.index+1]);await saveActive({...s,index:s.index+1,question_started_at:Date.now(),flipped:false,options:learn||s.mode==='test'?[]:optionsFor(next)})}
  });
}
function renderResult(root,studentId,state) {
  const s=state.sessions.at(-1);
  if(!s){root.innerHTML=`<section class="page empty-state"><h1>还没有练习结果</h1><p>完成一轮练习，看看自己的收获。</p><a class="primary" href="${base}">去练习</a></section>`;return}
  const learn=s.mode==='learn',good=s.results.filter(a=>a.correct),bad=s.results.filter(a=>!a.correct);
  const unique=items=>[...new Map(items.map(a=>[a.word_id,a])).values()];
  root.innerHTML=`<section class="page result-page"><div class="result-medal" aria-hidden="true">☆</div><div class="eyebrow">又向前迈了一小步</div><h1>${learn?'词卡学习完成！':'这轮练习完成！'} <span>🎉</span></h1><p class="muted">${learn?'把熟悉的词记牢，把陌生的词慢慢认识。':'每一次认真练习，都值得被看见。'}</p><div class="result-stats"><div><b>${learn?s.deck.length:s.total_count}<small> ${learn?'词':'题'}</small></b><span>${learn?'浏览词卡':'总题数'}</span></div><div><b>${s.correct_count}<small> 题</small></b><span>答对</span></div><div><b>${s.total_count?Math.round(s.correct_count/s.total_count*100)+'%':'—'}</b><span>正确率</span></div></div>
  ${!learn?`<div class="result-columns"><section class="result-box good"><h3>✓ 这次答对</h3>${good.length?unique(good).map(a=>{const w=wordById(a.word_id);return `<p>✓ <b>${w.base}</b> <span>→ ${w.answers.join(' / ')}</span></p>`}).join(''):'<p>下一轮，试着记住一个新单词。</p>'}</section><section class="result-box bad"><h3>↻ 还需要练习</h3>${bad.length?unique(bad).map(a=>{const w=wordById(a.word_id);return `<p>• <b>${w.base}</b> <span>→ ${w.answers.join(' / ')}</span></p>`}).join(''):'<p>这轮全部答对啦，继续保持！</p>'}</section></div>`:''}
  <section class="panel result-summary"><span class="summary-icon">✦</span><div><h3>本轮学习小结</h3><p>${learn?'已浏览全部 84 张词卡，可以用闯关练习或拼写测试检验记忆。':`答对 ${s.correct_count} / ${s.total_count} 题。${bad.length?'下次重点练习 '+unique(bad).map(a=>wordById(a.word_id).base).join('、')+'。':'这些变化已经更熟悉了，试试拼写测试吧。'}`}<br>目前已掌握 ${mastered(state).length} / ${WORDS.length} 个单词。</p></div></section><div class="result-actions"><a class="secondary" href="/today">返回今日</a>${bad.length?'<button class="secondary" id="retry">练习错题</button>':''}<button class="primary" id="again">${learn?'开始闯关':'再练一组'} ${icon('arrow')}</button></div></section>`;
  root.querySelector('#again').onclick=()=>begin(studentId,learn||s.mode==='wrong'?'choice':s.mode);
  if(root.querySelector('#retry'))root.querySelector('#retry').onclick=()=>begin(studentId,'wrong');
}
