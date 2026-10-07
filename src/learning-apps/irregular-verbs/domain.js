import { WORDS, CONFUSIONS } from './words.js';
export { WORDS };
export const shuffle = items => {
  const a = [...items]; for (let i=a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a;
};
export const isCorrect = (word, answer) => word.answers.includes(answer.trim().toLowerCase());
export const optionsFor = word => shuffle([word.answers[0], ...(word.id===84 ? ['lay','lain','lying'] : CONFUSIONS[word.base]).filter(a=>!word.answers.includes(a)).slice(0,3)]);
export function updateMastery(previous, correct, now) {
  const correct_count = (previous?.correct_count || 0) + Number(correct);
  const incorrect_count = (previous?.incorrect_count || 0) + Number(!correct);
  return { mastery_score: Math.max(0, Math.min(100, (previous?.mastery_score || 0) + (correct ? 25 : -35))), correct_count, incorrect_count, last_practiced_at: now, last_correct: correct };
}
export function createDeck(mode, mastery) {
  if (mode === 'learn') return [...WORDS];
  if (mode === 'wrong') return shuffle(WORDS.filter(w=>mastery[w.id]?.last_correct === false)).slice(0,10);
  // Prioritize words needing practice; shuffle ties so a new learner sees varied words.
  return shuffle(WORDS).sort((a,b)=>(mastery[a.id]?.mastery_score || 0)-(mastery[b.id]?.mastery_score || 0)).slice(0,10);
}
