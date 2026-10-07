export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function notify(message) {
  const el = document.querySelector('#notice');
  el.textContent = message; el.hidden = false;
  clearTimeout(notify.timer); notify.timer = setTimeout(() => { el.hidden = true; }, 5000);
}
export function navigate(path) { history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }
export const icons = {
  camera: '<path d="M8 5l2-2h4l2 2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><circle cx="12" cy="12" r="4"/>',
  today: '<rect x="4" y="6" width="16" height="15" rx="3"/><path d="M8 3v6m8-6v6M4 12h16m-11 4h6"/>',
  book: '<path d="M12 6C8 3 4 4 3 5v14c3-2 6-1 9 1 3-2 6-3 9-1V5c-1-1-5-2-9 1Z"/><path d="M12 6v14"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  edit: '<path d="m14 5 5 5M4 20l5-1L20 8a3 3 0 0 0-4-4L5 15l-1 5Z"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>'
};
export const icon = name => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
