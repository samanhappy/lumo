import { courses } from './content.js';
import { createSession, validateCourse, question, choices, submitAnswer, advance, statistics, progressKey } from './domain.js';
import { loadState, saveState } from './repository.js';
import { GRADES } from '../../platform/grades.js';
import { escape, navigate, notify } from '../../ui.js';

export const practiceApps = courses.map(course => createPracticeApp(validateCourse(course)));
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
  function renderHome(root,context,state,grade=context.grade || '',term='') {
    const {studentId}=context;
    const units=course.units.filter(unit => (!grade || unit.grade===grade) && (!term || unit.term===term));
    root.innerHTML=`<section class="page practice-home">${heading()}<p class="content-note">${escape(course.notice || '内置内容为学习示例。')}掌握需跨天独立答对；浏览词卡不增加掌握度。</p>
      ${state.active?`<div class="resume-bar"><span>上次学习尚未完成；可继续，也可切换单元或方式，已答记录会保留。</span><a class="primary" href="${base}/study">继续学习</a><button class="secondary" id="end-session">结束本轮，保留已答记录</button></div>`:''}
      <h2>全部内容学习概况</h2><div class="practice-stats">${Object.entries(course.abilities).map(([ability,label])=>{const stats=statistics(course,state,ability);return `<section class="panel"><h3>${escape(label)}</h3><p>待复习 <b>${stats.due}</b> 项 · 已练习 ${stats.practiced} / ${stats.total} 项</p><p>已掌握 ${stats.mastered} 项${stats.nextDue?` · 下次复习 ${escape(stats.nextDue)}`:''}</p></section>`}).join('')}</div>
      <div class="practice-filters"><label class="field">内容年级<select id="content-grade"><option value="">全部年级</option>${GRADES.map(g=>`<option ${grade===g?'selected':''}>${g}</option>`).join('')}</select></label><label class="field">内容学期<select id="content-term"><option value="">上下册</option>${['上册','下册'].map(t=>`<option ${term===t?'selected':''}>${t}</option>`).join('')}</select></label><label class="field">练习方式<select id="ability">${Object.entries(course.abilities).map(([key,label])=>`<option value="${key}" ${key==='recall'?'selected':''}>${escape(label)}</option>`).join('')}</select></label></div>
      <div class="unit-grid">${units.map(unit=>{
        const weak=unit.items.filter(item=>Object.keys(course.abilities).some(ability=>{const p=state.progress[progressKey(item.id,ability)];return p && (!p.lastCorrect || p.lastHinted);}));
        return `<article class="panel unit-card"><p class="eyebrow">${escape(unit.grade)} · ${escape(unit.edition)} · ${escape(unit.term)}</p><h2>${escape(unit.title)}</h2>${unit.author?`<p>${escape(unit.dynasty)} · ${escape(unit.author)}</p>`:''}<p>${unit.items.length} ${course.id==='classical-poetry'?'句':'个词条'}</p>${Object.entries(course.abilities).map(([ability,label])=>{const stats=statistics(course,state,ability,undefined,unit.id);return `<p class="content-note">${escape(label)}：已练习 ${stats.practiced} / ${stats.total} · 待复习 ${stats.due} · 已掌握 ${stats.mastered}${stats.nextDue?` · 下次复习 ${escape(stats.nextDue)}`:''}</p>`}).join('')}${weak.length?`<p class="content-note">最近易错或使用提示：${weak.map(item=>escape(item.word)).join('、')}</p>`:''}${sourceNote(unit)}<div class="practice-actions">${[['learn','词卡学习'],['practice','开始练习'],['review','到期复习']].map(([mode,label])=>`<button class="${mode==='practice'?'primary':'secondary'}" data-unit="${escape(unit.id)}" data-mode="${mode}">${label}</button>`).join('')}</div></article>`;
      }).join('') || '<div class="panel"><p>当前年级暂无内置内容或所选学期暂无内容，可以查看全部年级和学期。</p><button class="secondary" id="all-grades">查看全部年级</button></div>'}</div></section>`;
    root.querySelector('#content-grade').onchange=e=>renderHome(root,context,load(studentId),e.target.value,term);
    root.querySelector('#content-term').onchange=e=>renderHome(root,context,load(studentId),grade,e.target.value);
    const all=root.querySelector('#all-grades'); if(all) all.onclick=()=>renderHome(root,context,load(studentId),'');
    root.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>safely(async()=>{
      await app.start(studentId,button.dataset.unit,button.dataset.mode,root.querySelector('#ability').value);
      if(root.isConnected) navigate(base+'/study');
    }));
    const end=root.querySelector('#end-session'); if(end) end.onclick=()=>safely(async()=>{
      const current=load(studentId);
      if(!current.active) return;
      await save(studentId,{...current,active:null,sessions:[...current.sessions,{...current.active,endedAt:new Date().toISOString(),abandoned:true}]});
      if(root.isConnected) renderHome(root,context,load(studentId),grade,term);
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
