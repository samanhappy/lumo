import { read, write } from '../../storage.js';
export const emptyState = () => ({ mastery: {}, sessions: [], attempts: [], active: null });
export function loadState(studentId) {
  const state = read(`lumo:iv:${studentId}`, null);
  if (!state || !state.mastery || !Array.isArray(state.sessions) || !Array.isArray(state.attempts)) return emptyState();
  return state;
}
export const saveState = (studentId, state) => write(`lumo:iv:${studentId}`, state);
