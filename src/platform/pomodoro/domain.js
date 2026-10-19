export const defaults = { focus:25, short:5, long:15, goal:4, sound:true };
export const labels = { focus:'专注学习', short:'短休息', long:'长休息' };
export const dateKey = (time = Date.now()) => { const d = new Date(time); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export function initialState() { return { settings:{...defaults}, mode:'focus', remaining:1500, deadline:null, round:0, topic:'', sessions:[] }; }
export function secondsLeft(state, now = Date.now()) { return state.deadline === null ? state.remaining : Math.max(0, Math.ceil((state.deadline-now)/1000)); }
export function complete(state, now = Date.now()) {
  if (state.deadline === null || secondsLeft(state,now)>0) return state;
  const next = structuredClone(state);
  if (state.mode === 'focus') {
    next.sessions.push({ id:String(state.deadline), at:state.deadline, minutes:state.settings.focus, topic:state.topic || '自由专注' });
    next.round++;
    next.mode = next.round % 4 === 0 ? 'long' : 'short';
  } else next.mode = 'focus';
  next.deadline = null;
  next.remaining = next.settings[next.mode]*60;
  return next;
}
export function validateSettings(input) {
  const limits = {focus:[5,90],short:[1,30],long:[5,60],goal:[1,12]};
  const result = {sound:!!input.sound};
  for (const [key,[min,max]] of Object.entries(limits)) {
    const value=Number(input[key]);
    if (!Number.isInteger(value)||value<min||value>max) throw new Error('请在提示范围内填写整数。');
    result[key]=value;
  }
  return result;
}

export function selectDuration(state, minutes) {
  if (state.deadline !== null || state.remaining !== state.settings[state.mode]*60) {
    throw new Error('请先完成或重置当前计时，再选择时长。');
  }
  const settings=validateSettings({...state.settings,[state.mode]:minutes});
  return {...state,settings,remaining:settings[state.mode]*60};
}
