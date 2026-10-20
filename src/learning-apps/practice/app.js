import { courses } from './content.js';
import { createSession, question, choices, submitAnswer, advance, statistics, progressKey } from './domain.js';
import { loadState, saveState } from './repository.js';
import { GRADES } from '../../platform/grades.js';
import { escape, navigate, notify, icon } from '../../ui.js';

export const practiceApps = courses.map(course => createPracticeApp(course));
export function createPracticeApp(course) {
  const base = `/apps/${course.id}`;
  let saving = false;
  async function safely(action) {
    if (saving) return;
    saving = true;
    try { await action(); } catch (error) { notify(error.message); } finally { saving = false; }
  }
  const load = studentId => loadState(course.id,studentId);
  const save = (studentId,state) => saveState(course.id,studentId,state);
  const app = {
    getSummary(studentId) {
      const state=load(studentId), stats=statistics(course,state,'recall');
      return {title:course.name,progressText:state.active?'上次学习尚未完成':`书写待复习 ${stats.due} 项 · 已掌握 ${stats.mastered} / ${stats.total} 项`,estimatedMinutes:8};
    },
    async start(studentId,unitId,mode='practice',ability='recall') {
      const state=load(studentId);
      if (state.active?.unitId===unitId && state.active.mode===mode && state.active.ability===ability) return state.active;
      const session=createSession(course,unitId,mode,ability,state);
      const sessions=state.active ? [...state.sessions,{...state.active,endedAt:new Date().toISOString(),abandoned:true}] : state.sessions;
      await save(studentId,{...state,sessions,active:session});
      return session;
    },
    render(root,context,path) {
      const state=load(context.studentId);
      if (path===base+'/study' && state.active) renderStudy(root,context,state);
      else if (path===base+'/result') renderResult(root,context,state);
      else renderHome(root,context,state);
    },
  };
  const heading = () => `<a class="back-link" href="/apps">‹ 返回应用</a><header class="page-heading"><h1>${escape(course.name)}</h1></header>`;
  const sourceNote = unit => `<p class="content-note">${escape(unit.source)}${unit.sourceUrl?` <a href="${escape(unit.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看教材来源</a>`:''}</p>`;
  function renderHome(root,context,state,grade=context.grade || '',term='',selectedId='',ability='recall') {
    const {studentId}=context;
    const units=course.units.filter(unit => (!grade || unit.grade===grade) && (!term || unit.term===term));
    const active=state.active, last=state.sessions.at(-1);
    const selected=units.find(unit=>unit.id===selectedId) || units.find(unit=>unit.id===(active?.unitId || last?.unitId)) || units[0];
    const current=course.units.find(unit=>unit.id===active?.unitId) || selected;
    const stats=statistics(course,state,'recall');
    const latest=state.sessions.findLast(session=>!session.abandoned && session.mode!=='learn' && session.results.some(result=>!result.retry));
    const first=latest?.results.filter(result=>!result.retry) || [], correct=first.filter(result=>result.correct&&!result.hinted).length;
    const completed=active ? Math.min(active.deck.length,active.index+Number(Boolean(active.feedback))) : 0;
    const nextMode=last?'practice':'learn';
    const total=active?.deck.length || (selected?createSession(course,selected.id,nextMode,'recall',state).deck.length:0);
    const modeLabel=session=>session.mode==='learn'?'词卡学习':session.mode==='review'?'到期复习':course.abilities[session.ability];
    const date=value=>new Date(value).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    const record=active ? `上次学习：${modeLabel(active)} · 已完成 ${completed} / ${total} 项 · ${date(active.startedAt)}` : last ? `上次学习：${modeLabel(last)} · ${last.abandoned?'已结束':'已完成'} · ${date(last.endedAt)}` : '还没有学习记录，从第一张词卡开始吧';
    const unitLabel=course.id==='classical-poetry'?'诗句':'词条';
    const masteryLabel=course.id==='classical-poetry'?'默写':course.id==='english-vocabulary'?'拼写':'书写';
    const sample=current?.items[0];
    root.innerHTML=`<section class="page app-home iv-home practice-home"><a class="back-link" href="/apps">‹ 返回应用</a>
      <header class="page-heading"><div><h1>${escape(course.name)} <span class="sun" aria-hidden="true">✦</span></h1><p>每天学一点，${course.id==='classical-poetry'?'让诗词慢慢留在心里':'让每一次练习都有收获'}。</p></div></header>
      <div class="iv-scene"><aside class="practice-art" aria-hidden="true"><span class="practice-art-spark">✦</span><div class="practice-art-book"><small>${course.id==='english-vocabulary'?'Small steps, big progress':course.id==='chinese-words'?'一字一句，日有所长':'读诗，也读四季'}</small><strong>${escape(sample?.word || course.icon)}</strong><span>${escape(course.id==='classical-poetry'?current?.title || '':sample?.meaning || '')}</span></div><span class="practice-art-orbit">✧</span></aside>
      <section class="iv-focus" aria-labelledby="practice-next"><div class="iv-focus-copy"><span class="iv-eyebrow">${icon('book')} 本轮学习</span><h2 id="practice-next"><span>${active?'继续':'学习'} ${total}</span> ${(active?.mode || nextMode)!=='learn'?'项练习':course.id==='classical-poetry'?'句诗':'个词条'}</h2><p class="practice-current">${escape(current?.title || '选择适合你的内容')} · ${active?escape(modeLabel(active)):nextMode==='learn'?'词卡学习':escape(course.abilities.recall)}</p></div>
      <div class="iv-progress"><div class="iv-track" role="progressbar" aria-label="本轮学习进度" aria-valuemin="0" aria-valuemax="${Math.max(total,1)}" aria-valuenow="${completed}"><i style="width:${total?completed/total*100:0}%"></i></div><span class="iv-round-count"><b>${completed}</b> / ${total}</span></div>
      <div class="iv-start">${active?`<a class="primary" href="${base}/study">${icon('arrow')} 继续学习</a>`:`<button class="primary" id="practice-start" ${!selected?'disabled':''}>${icon('arrow')} 开始学习</button>`}<p class="iv-last">${escape(record)}</p></div></section></div>
      <dl class="iv-summary"><div class="iv-mastery"><span class="iv-stat-icon">${icon('book')}</span><div><dd><strong>${stats.mastered}<small> / ${stats.total}</small></strong></dd><dt>已掌握${unitLabel}</dt><div class="iv-mini-track" aria-hidden="true"><i style="width:${stats.total?stats.mastered/stats.total*100:0}%"></i></div></div></div>
      <div class="iv-test"><span class="iv-stat-icon">${icon('check')}</span><div><dd>${latest?`<strong>${correct}<small> / ${first.length}</small></strong>`:'<strong class="iv-empty">暂无成绩</strong>'}</dd><dt>最近练习成绩</dt><div class="iv-mini-track" aria-hidden="true"><i style="width:${first.length?correct/first.length*100:0}%"></i></div></div></div>
      <div class="iv-review-stat"><span class="iv-stat-icon">${icon('clock')}</span><div><dd><strong>${stats.due}</strong></dd><dt>待复习${unitLabel}</dt></div>${stats.due?`<button class="iv-review" id="review-due" aria-label="开始到期复习">${icon('arrow')}</button>`:''}</div></dl>
      <p class="practice-basis">掌握与待复习按${masteryLabel}能力统计 · 成绩按首次独立答对统计</p><details class="iv-modes practice-library" ${!selected?'open':''}><summary>内容与学习模式 <span>词卡学习 · 识记练习 · 书写练习</span></summary>
      <div class="practice-filters"><label class="field">内容年级<select id="content-grade"><option value="">全部年级</option>${GRADES.map(g=>`<option ${grade===g?'selected':''}>${g}</option>`).join('')}</select></label><label class="field">内容学期<select id="content-term"><option value="">上下册</option>${['上册','下册'].map(t=>`<option ${term===t?'selected':''}>${t}</option>`).join('')}</select></label><label class="field">学习内容<select id="content-unit">${units.map(unit=>`<option value="${escape(unit.id)}" ${unit.id===selected?.id?'selected':''}>${escape(unit.grade)} · ${escape(unit.term)} · ${escape(unit.title)}</option>`).join('')}</select></label></div>
      ${selected?`<div class="iv-mode-grid">${[['learn','recall','词卡学习','先认识，再记忆'],['practice','recognize',course.abilities.recognize,'选出正确答案'],['practice','recall',course.abilities.recall,'独立作答，检验记忆']].map(([mode,skill,label,description])=>`<button class="iv-mode" data-unit="${escape(selected.id)}" data-mode="${mode}" data-ability="${skill}"><span class="iv-mode-icon">${icon(mode==='learn'?'book':'edit')}</span><span><strong>${escape(label)}</strong><small>${description}</small></span>${icon('arrow')}</button>`).join('')}</div>
      <div class="practice-secondary"><label class="field">复习方式<select id="ability">${Object.entries(course.abilities).map(([key,label])=>`<option value="${key}" ${key===ability?'selected':''}>${escape(label)}</option>`).join('')}</select></label><button class="secondary" data-unit="${escape(selected.id)}" data-mode="review">到期复习</button>${active?'<button class="quiet" id="end-session">结束本轮，保留已答记录</button>':''}</div>
      <details class="practice-source"><summary>教材来源与学习详情</summary><p class="content-note">${escape(course.notice || '内置内容为学习示例。')}掌握需跨天独立答对；浏览词卡不增加掌握度。首页掌握与复习以书写能力统计；成绩为首次独立答对数。</p>${units.map(unit=>`<section><h3>${escape(unit.title)}</h3><p class="eyebrow">${escape(unit.grade)} · ${escape(unit.edition)} · ${escape(unit.term)}</p>${Object.entries(course.abilities).map(([key,label])=>{const value=statistics(course,state,key,undefined,unit.id);return `<p class="content-note">${escape(label)}：已练习 ${value.practiced} / ${value.total} · 待复习 ${value.due} · 已掌握 ${value.mastered}${value.nextDue?` · 下次复习 ${escape(value.nextDue)}`:''}</p>`}).join('')}${sourceNote(unit)}</section>`).join('')}</details>`:'<p>当前年级暂无内置内容或所选学期暂无内容。</p><button class="secondary" id="all-grades">查看全部年级</button>'}</details></section>`;
    const redraw=(nextGrade=grade,nextTerm=term,nextId=selected?.id,nextAbility=ability)=>{renderHome(root,context,load(studentId),nextGrade,nextTerm,nextId,nextAbility);root.querySelector('.practice-library')?.setAttribute('open','');};
    root.querySelector('#content-grade').onchange=e=>redraw(e.target.value,term,'');
    root.querySelector('#content-term').onchange=e=>redraw(grade,e.target.value,'');
    const unitControl=root.querySelector('#content-unit'); if(unitControl) unitControl.onchange=e=>redraw(grade,term,e.target.value);
    const abilityControl=root.querySelector('#ability'); if(abilityControl) abilityControl.onchange=e=>redraw(grade,term,selected?.id,e.target.value);
    const all=root.querySelector('#all-grades'); if(all) all.onclick=()=>redraw('','','');
    const start=(unitId,mode,skill)=>safely(async()=>{await app.start(studentId,unitId,mode,skill);if(root.isConnected) navigate(base+'/study');});
    const main=root.querySelector('#practice-start'); if(main) main.onclick=()=>start(selected.id,nextMode,'recall');
    root.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>start(button.dataset.unit,button.dataset.mode,button.dataset.ability || ability));
    const review=root.querySelector('#review-due'); if(review) review.onclick=()=>{const unit=course.units.find(unit=>statistics(course,state,'recall',undefined,unit.id).due);if(unit) start(unit.id,'review','recall');};
    const end=root.querySelector('#end-session'); if(end) end.onclick=()=>safely(async()=>{
      const current=load(studentId);if(!current.active) return;
      await save(studentId,{...current,active:null,sessions:[...current.sessions,{...current.active,endedAt:new Date().toISOString(),abandoned:true}]});
      if(root.isConnected) renderHome(root,context,load(studentId),grade,term,selected?.id,ability);
    });
  }
  function renderStudy(root,context,state) {
    const {studentId}=context, session=state.active;
    const unit=course.units.find(unit=>unit.id===session.unitId), entry=session.deck[session.index];
    const item=unit?.items.find(item=>item.id===entry?.itemId);
    if(!item) { root.innerHTML=`<section class="page"><h1>练习内容已更新</h1><a class="primary" href="${base}">返回并结束旧练习</a></section>`; return; }
    const learn=session.mode==='learn', feedback=session.feedback, q=question(course,unit,item,session.ability);
    const options=session.ability==='recognize'?choices(course,unit,item):[];
    root.innerHTML=`<section class="page practice-study"><a class="back-link" href="${base}">‹ 返回${escape(course.name)}（自动保存）</a><div class="study-top"><h2>${escape(unit.title)}</h2><span>${session.index+1} / ${session.deck.length}</span></div><progress class="practice-progress" aria-label="学习进度" value="${session.index+(feedback?1:0)}" max="${session.deck.length}"></progress><section class="panel practice-question"><p class="eyebrow">${learn?'词卡学习':escape(course.abilities[session.ability])}${entry.retry?' · 本轮重练':''}</p>
      ${learn?`<h1>${escape(item.word)}</h1>${item.pinyin?`<p>${escape(item.pinyin)}</p>`:''}<p>${escape(item.meaning)}</p>${item.example?`<p>${escape(item.example.replace('____',item.word))}</p>`:''}${unit.author?`<p>${escape(unit.dynasty)} · ${escape(unit.author)}</p><p>${escape(unit.note)}</p><details><summary>查看全诗</summary>${unit.items.map(line=>`<p>${escape(line.word)}</p>`).join('')}</details>`:''}${sourceNote(unit)}`:
      `<h1 class="question-prompt">${escape(q.prompt)}</h1>${session.ability==='recognize'?`<div class="options">${options.map(option=>`<button class="option ${feedback && option===q.answer?'correct':''}" data-answer="${escape(option)}" ${feedback?'disabled':''}>${escape(option)}</button>`).join('')}</div>`:`<form id="practice-answer" class="spell"><label class="sr-only" for="written-answer">写下答案</label><input id="written-answer" name="answer" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="160" placeholder="写下答案" value="${escape(feedback?.answer || '')}" ${feedback?'disabled':''} required><button class="primary" ${feedback?'disabled':''}>提交答案</button></form>`}
      ${!feedback?`<button class="quiet" id="hint" ${session.hinted?'disabled':''}>查看提示（不计为独立答对）</button>${session.hinted?`<p class="content-note" role="status">${escape(q.hint || item.meaning)}</p>`:''}`:''}
      ${feedback?`<div class="feedback ${feedback.correct?'good':'bad'}" role="status"><div><h3>${feedback.correct?(feedback.hinted?'提示下答对，稍后再试':'回答正确'):'再记一次，稍后重练'}</h3><p>你的答案：${escape(feedback.answer)}</p><p>正确答案：<b>${escape(q.answer)}</b></p><p>${escape(item.meaning)}</p>${unit.note?`<p>${escape(unit.note)}</p>`:''}${sourceNote(unit)}</div></div>`:''}`}
      ${learn || feedback?`<button class="primary" id="next">${session.index+1===session.deck.length?'完成并查看结果':'下一项'}</button>`:''}</section></section>`;
    async function persist(next) {
      await save(studentId,next);
      if(!root.isConnected) return;
      if(next.active) renderStudy(root,context,load(studentId)); else navigate(base+'/result');
    }
    function current() {
      const latest=load(studentId);
      return latest.active?.id===session.id && latest.active.index===session.index ? latest : null;
    }
    const answer=value=>safely(async()=>{const latest=current();if(latest && !latest.active.feedback && value.trim()) await persist(submitAnswer(course,latest,value));});
    root.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>answer(button.dataset.answer));
    const form=root.querySelector('#practice-answer'); if(form) form.onsubmit=e=>{e.preventDefault();answer(new FormData(e.target).get('answer'));};
    const hint=root.querySelector('#hint'); if(hint) hint.onclick=()=>safely(async()=>{const latest=current();if(latest && !latest.active.feedback) await persist({...latest,active:{...latest.active,hinted:true}});});
    const next=root.querySelector('#next'); if(next) next.onclick=()=>safely(async()=>{const latest=current();if(latest) await persist(advance(latest));});
    if(feedback) next?.focus(); else root.querySelector('#written-answer')?.focus();
  }
  function renderResult(root,context,state) {
    const session=state.sessions.at(-1);
    if(!session) {root.innerHTML=`<section class="page">${heading()}<p>还没有学习记录。</p><a class="primary" href="${base}">去学习</a></section>`;return;}
    const first=session.results.filter(result=>!result.retry), independent=first.filter(result=>result.correct&&!result.hinted).length;
    const unit=course.units.find(unit=>unit.id===session.unitId);
    root.innerHTML=`<section class="page practice-result">${heading()}<section class="panel"><h2>${session.abandoned?'本轮已结束':'本轮学习完成'}</h2><p>${escape(unit?.title || '历史单元')}</p>${session.mode==='learn'?'<p>已浏览词卡。接着独立作答，检验记忆。</p>':`<p>首次作答 ${first.length} 项 · 独立答对 ${independent} 项 · 本轮重练 ${session.results.length-first.length} 次</p><p>提示与错题已记录，到期后继续复习。</p>`}<a class="primary" href="${base}">返回学习首页</a></section></section>`;
  }
  return app;
}
