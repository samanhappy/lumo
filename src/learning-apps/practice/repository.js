import { read, write } from '../../storage.js';
import { emptyState } from './domain.js';
import { practiceKey } from './keys.js';
export function loadState(appId, studentId) {
  return read(practiceKey(appId,studentId),emptyState());
}
export const saveState = (appId,studentId,state) => write(practiceKey(appId,studentId),state);
