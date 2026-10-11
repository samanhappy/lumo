import { localDate, shiftDate } from './model.js';
import { icon } from '../../ui.js';

export function monthDays(date) {
  const first = date.slice(0, 7) + '-01';
  const start = shiftDate(first, -(new Date(first + 'T12:00:00').getDay() + 6) % 7);
  return Array.from({ length: 42 }, (_, index) => shiftDate(start, index));
}

export function attachDatePickers(root) {
  root.querySelectorAll('input[type=date]').forEach(input => {
    const label = input.getAttribute('aria-label') || input.parentElement.firstChild.textContent.trim();
    const picker = document.createElement('div');
    picker.className = 'date-picker';
    picker.innerHTML = `<button type="button" class="date-trigger" aria-label="${label}" aria-expanded="false"><span></span>${icon('today')}</button><div class="date-calendar" popover><div class="calendar-heading"><button type="button" class="quiet" data-month="-1" aria-label="上个月">‹</button><strong aria-live="polite"></strong><button type="button" class="quiet" data-month="1" aria-label="下个月">›</button></div><div class="calendar-week">${['一','二','三','四','五','六','日'].map(day => `<span>${day}</span>`).join('')}</div><div class="calendar-days"></div><button type="button" class="calendar-today">回到今天</button></div>`;
    input.type = 'hidden';
    input.after(picker);
    const trigger = picker.querySelector('.date-trigger');
    const calendar = picker.querySelector('.date-calendar');
    calendar.addEventListener('toggle', () => trigger.setAttribute('aria-expanded', String(calendar.matches(':popover-open'))));
    const close = () => calendar.hidePopover();
    let month = input.value.slice(0, 7) + '-01';
    const render = () => {
      trigger.querySelector('span').textContent = input.value.replaceAll('-', ' / ');
      picker.querySelector('strong').textContent = `${Number(month.slice(0,4))} 年 ${Number(month.slice(5,7))} 月`;
      picker.querySelector('.calendar-days').innerHTML = monthDays(month).map(date => `<button type="button" data-day="${date}" class="${date.slice(0,7) !== month.slice(0,7) ? 'outside' : ''}" aria-label="${date}" aria-pressed="${date === input.value}" ${date === localDate() ? 'aria-current="date"' : ''}>${Number(date.slice(8))}</button>`).join('');
    };
    const choose = date => {
      if (input.disabled) return;
      input.value = date;
      close();
      render();
      trigger.focus();
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    picker.onclick = event => {
      const button = event.target.closest('button');
      if (button?.dataset.day) choose(button.dataset.day);
      if (button?.dataset.month) {
        const next = new Date(month + 'T12:00:00');
        next.setMonth(next.getMonth() + Number(button.dataset.month));
        month = localDate(next); render();
      }
      if (button?.classList.contains('calendar-today')) choose(localDate());
    };
    trigger.onclick = () => {
      if (input.disabled) return;
      if (calendar.matches(':popover-open')) { close(); return; }
      month = input.value.slice(0,7) + '-01'; render();
      calendar.showPopover();
      const rect = trigger.getBoundingClientRect();
      calendar.style.width = `${Math.min(320, window.innerWidth - 24)}px`;
      const below = window.innerHeight - rect.bottom - 20;
      const above = rect.top - 20;
      const openBelow = below >= calendar.scrollHeight || below >= above;
      calendar.style.maxHeight = `${Math.max(40, openBelow ? below : above)}px`;
      const height = calendar.offsetHeight;
      calendar.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - calendar.offsetWidth - 12))}px`;
      calendar.style.top = `${Math.max(12, openBelow ? rect.bottom + 8 : rect.top - height - 8)}px`;
    };
    picker.onkeydown = event => {
      if (event.key === 'Escape' && calendar.matches(':popover-open')) {
        event.preventDefault(); event.stopPropagation(); close(); trigger.focus();
      }
    };
    picker.onfocusout = event => { if (!picker.contains(event.relatedTarget)) close(); };
    render();
  });
}
