import { validateCourse } from './domain.js';
export const courses = [
  {id:'english-vocabulary',name:'英语词汇',icon:'Aa',abilities:{recognize:'看词识义',recall:'看义拼词'},units:[]},
  {id:'chinese-words',name:'语文字词',icon:'字',abilities:{recognize:'读音选词 / 语境填空',recall:'看拼音写词'},units:[]},
  {id:'classical-poetry',name:'古诗词',icon:'诗',abilities:{recognize:'上下句补全',recall:'逐句默写'},units:[]},
];
export function setCourses(values) {
  if (!Array.isArray(values) || values.length!==courses.length || new Set(values.map(course=>course.id)).size!==courses.length || values.some(course=>!courses.some(current=>current.id===course.id))) throw new Error('教材数据不完整，请重试。');
  values.forEach(validateCourse);
  for (const current of courses) Object.assign(current,values.find(course=>course.id===current.id));
}
export async function initializeCourses() {
  const response=await fetch('/api/courses');
  if (!response.ok) throw new Error('教材加载失败，请刷新重试。');
  setCourses(await response.json());
}
