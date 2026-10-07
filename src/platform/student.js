export const student = { id: '', name: '', grade: '' };
export let user;
export function setUser(value) { user = value; Object.assign(student, value.student); }
