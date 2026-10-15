import { GRADES } from '../../platform/grades.js';
import { localDate, shiftDate } from '../../platform/tasks/model.js';
export const intervals = [1,3,7,14];
export const emptyState = () => ({progress:{},seen:{},active:null,sessions:[]});
export const progressKey = (itemId, ability) => `${itemId}:${ability}`;
export function validateCourse(course) {
  const ids = new Set();
  if (!/^[a-z-]+$/.test(course.id) || !course.name || !course.abilities?.recognize || !course.abilities?.recall || !course.units?.length) throw new Error('应用内容配置无效');
  for (const unit of course.units) {
    if (!unit.id || ids.has(unit.id) || !GRADES.includes(unit.grade) || !unit.edition || !unit.term || !unit.title || !unit.source || !Array.isArray(unit.items) || unit.items.length < 2) throw new Error('学习单元配置无效');
    ids.add(unit.id);
    for (const item of unit.items) {
      if (!item.id || ids.has(item.id) || !item.word || !item.meaning || (course.id === 'chinese-words' && (!item.pinyin || (!unit.wordListOnly && !item.example?.includes('____')))) || (course.id === 'classical-poetry' && !item.cue)) throw new Error('学习条目配置无效');
      ids.add(item.id);
    }
    if (new Set(unit.items.map(item => question(course,unit,item,'recognize').answer)).size !== unit.items.length) throw new Error('选择题答案必须唯一');
  }
  return course;
}
export function question(course, unit, item, ability) {
  if (!Object.hasOwn(course.abilities,ability)) throw new Error('无效的练习方式');
  if (course.id === 'english-vocabulary') return ability === 'recognize' ? {prompt:item.word,answer:item.meaning,hint:item.example} : {prompt:item.meaning,answer:item.word,hint:`首字母：${item.word[0]} · ${item.word.length} 个字母`};
  if (course.id === 'chinese-words') return {prompt:ability === 'recognize' && !unit.wordListOnly ? item.example : item.pinyin,answer:item.word,hint:unit.wordListOnly ? `首字：${item.word[0]} · ${item.word.length} 个字` : item.meaning};
  const index = unit.items.indexOf(item);
  return {prompt:ability === 'recognize' && index ? `上句：${item.cue}\n请补全下一句` : `《${unit.title}》第 ${index+1} 句`,answer:item.word,hint:item.meaning};
}
export function isCorrect(course, unit, item, ability, answer) {
  // Ignore typography, but never remove letters or Chinese characters from a response.
  const normalize = text => {
    const value = text.normalize('NFKC').trim().toLowerCase();
    if (course.id === 'classical-poetry') return value.replace(/[\s，。！？、；：,.!?;:]/gu,'');
    return course.id === 'english-vocabulary' ? value : value.replace(/\s+/gu,'');
  };
  return normalize(question(course,unit,item,ability).answer) === normalize(answer);
}
export function choices(course, unit, item) {
  const answer = question(course,unit,item,'recognize').answer;
  const others = unit.items.filter(other => other.id !== item.id).map(other => question(course,unit,other,'recognize').answer);
  return shuffle([answer,...shuffle(others).slice(0,3)]);
}
function shuffle(items) {
  const result = [...items];
  for (let i=result.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
  return result;
}
export function createSession(course, unitId, mode, ability, state, today = localDate()) {
  const unit = course.units.find(unit => unit.id === unitId);
  if (!unit || !['learn','practice','review'].includes(mode) || !Object.hasOwn(course.abilities,ability)) throw new Error('请选择有效的单元和练习方式。');
  const due = unit.items.filter(item => { const p=state.progress[progressKey(item.id,ability)]; return p && p.due <= today; });
  const fresh = unit.items.filter(item => !state.progress[progressKey(item.id,ability)]);
  const items = mode === 'learn' ? unit.items : mode === 'review' ? due : [...due,...fresh.slice(0,3)];
  if (!items.length) throw new Error(mode === 'review' ? '这个单元暂时没有到期复习内容。' : '今天的内容已完成，等到期复习或选择其他单元。');
  return {id:crypto.randomUUID(),unitId,mode,ability,deck:(mode === 'learn' ? items : items.slice(0,10)).map(item => ({itemId:item.id,retry:false})),index:0,results:[],feedback:null,hinted:false,startedAt:new Date().toISOString()};
}
export function updateProgress(previous, correct, hinted, today) {
  const old = previous || {stage:0,attempts:0};
  const independent = correct && !hinted;
  const stage = independent ? Math.min(intervals.length, old.stage + Number(old.lastIndependentDate !== today)) : 0;
  return {...old,stage,attempts:old.attempts+1,lastCorrect:correct,lastHinted:hinted,lastIndependentDate:independent ? today : old.lastIndependentDate,
    due:independent ? shiftDate(today,intervals[Math.max(0,stage-1)]) : today};
}
export function submitAnswer(course,state,answer,today = localDate()) {
  const session = state.active;
  if (!session || session.mode === 'learn' || session.feedback || !answer.trim()) return state;
  const unit = course.units.find(unit => unit.id === session.unitId), entry = session.deck[session.index];
  const item = unit?.items.find(item => item.id === entry.itemId);
  if (!item) throw new Error('练习内容已更新，请返回重新开始。');
  const correct = isCorrect(course,unit,item,session.ability,answer);
  const result = {itemId:item.id,ability:session.ability,answer,correct,hinted:session.hinted,retry:entry.retry,at:new Date().toISOString()};
  const deck = [...session.deck];
  if ((!correct || session.hinted) && !entry.retry) deck.splice(Math.min(session.index+3,deck.length),0,{itemId:item.id,retry:true});
  const key = progressKey(item.id,session.ability);
  return {...state,progress:{...state.progress,[key]:updateProgress(state.progress[key],correct,session.hinted,today)},active:{...session,deck,results:[...session.results,result],feedback:result}};
}
export function advance(state) {
  const session = state.active;
  if (!session || (session.mode !== 'learn' && !session.feedback)) return state;
  const seen = session.mode === 'learn' ? {...state.seen,[session.deck[session.index].itemId]:true} : state.seen;
  if (session.index+1 === session.deck.length) return {...state,seen,active:null,sessions:[...state.sessions,{...session,endedAt:new Date().toISOString()}]};
  return {...state,seen,active:{...session,index:session.index+1,feedback:null,hinted:false}};
}
export function statistics(course,state,ability,today = localDate(),unitId) {
  const items = course.units.filter(unit => !unitId || unit.id === unitId).flatMap(unit => unit.items);
  const values = items.map(item => state.progress[progressKey(item.id,ability)]).filter(Boolean);
  const nextDue = values.filter(p => p.due > today).map(p => p.due).sort()[0];
  return {nextDue,total:items.length,seen:items.filter(item => state.seen[item.id]).length,practiced:values.length,mastered:values.filter(p => p.stage >= 3).length,due:values.filter(p => p.due <= today).length};
}
