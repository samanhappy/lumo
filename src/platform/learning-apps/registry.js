import { irregularVerbs } from '../../learning-apps/irregular-verbs/app.js';
import { read, write } from '../../storage.js';
export const learningApps = [{ id:'irregular-verbs', code:'irregular-verbs', name:'不规则过去式', icon:'AB', version:'1.0.0', enabled:true, app:irregularVerbs }];
export function appSummary(entry, studentId) {
  const summary = entry.app.getSummary(studentId);
  return summary;
}
export function markAppUsed(entry, studentId) {
  const relations = read('lumo:student_app', {}); const key=`${studentId}:${entry.id}`;
  return write('lumo:student_app', { ...relations, [key]: { ...relations[key], student_id:studentId, app_id:entry.id, last_used_at:new Date().toISOString(), status:'active', summary:entry.app.getSummary(studentId) } });
}
