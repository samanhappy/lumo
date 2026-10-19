// Keep the fruit shell still while its engraved scale turns like a kitchen timer.
export const fruits = {
  tomato: {label:'番茄',emoji:'🍅',colors:['#ff7967','#ed4e40','#bd3029']},
  orange: {label:'橙子',emoji:'🍊',colors:['#ffbf60','#f28b24','#cf6015']},
  apple: {label:'苹果',emoji:'🍎',colors:['#f68186','#dc4055','#ac263c']},
  peach: {label:'桃子',emoji:'🍑',colors:['#ffc9ab','#f48e89','#d75d75']},
  watermelon: {label:'西瓜',emoji:'🍉',colors:['#78b779','#38865b','#226345']},
};
export function tomatoDial(fruit = 'tomato') {
  fruit = Object.hasOwn(fruits,fruit) ? fruit : 'tomato';
  const selected = fruits[fruit];
  const round = fruit === 'orange' || fruit === 'watermelon';
  const ticks=Array.from({length:60},(_,i)=>{
    const angle=i*6, major=i%5===0;
    return `<line x1="200" y1="${major?78:83}" x2="200" y2="94" transform="rotate(${angle} 200 221)" class="${major?'major':'minor'}"/>${major?`<text x="200" y="65" transform="rotate(${angle} 200 221)">${i}</text>`:''}`;
  }).join('');
  return `<div class="pomo-tomato"><svg viewBox="0 0 400 420" aria-hidden="true"><defs><radialGradient id="tomato-red" cx="32%" cy="22%" r="85%"><stop offset="0" stop-color="${selected.colors[0]}"/><stop offset=".46" stop-color="${selected.colors[1]}"/><stop offset="1" stop-color="${selected.colors[2]}"/></radialGradient><linearGradient id="tomato-leaf" x2=".8" y2="1"><stop stop-color="#638b42"/><stop offset="1" stop-color="#345d32"/></linearGradient></defs><ellipse cx="200" cy="395" rx="135" ry="12" fill="#9a3320" opacity=".1"/><path d="${round ? 'M200 54C103 54 21 126 21 221C21 316 103 388 200 388C297 388 379 316 379 221C379 126 297 54 200 54Z' : 'M200 73C145 30 55 61 29 149C5 228 23 335 93 374C133 397 172 388 200 382C228 388 267 397 307 374C377 335 395 228 371 149C345 61 255 30 200 73Z'}" fill="url(#tomato-red)"/><path d="M41 227C120 243 280 243 359 227" fill="none" stroke="${selected.colors[2]}" stroke-width="2" opacity=".24"/>${fruit==='tomato'?`<path d="M200 84C162 87 128 68 111 43C150 41 175 50 194 64C176 37 179 17 187 5C207 23 215 41 209 63C235 40 265 35 289 46C271 68 246 81 218 83C237 95 247 108 248 125C221 118 205 105 200 91C180 112 157 118 139 114C152 94 173 84 200 84Z" fill="url(#tomato-leaf)"/>`:`<path d="M202 72Q224 28 269 46Q250 82 202 72Z" fill="url(#tomato-leaf)"/>`}<path d="M201 72Q207 38 222 26" fill="none" stroke="#416437" stroke-width="9" stroke-linecap="round"/><path d="M69 131Q87 94 123 91" fill="none" stroke="#ffc1a8" stroke-width="9" stroke-linecap="round" opacity=".45"/>${fruit==='watermelon'?`<path d="M110 76Q60 220 110 366M290 76Q340 220 290 366M165 57Q135 220 165 385M235 57Q265 220 235 385" fill="none" stroke="#b9d98b" stroke-width="12" opacity=".22"/>`:fruit==='peach'?`<path d="M200 82Q232 155 204 360" fill="none" stroke="#b84e6f" stroke-width="3" opacity=".25"/>`:fruit==='apple'?`<path d="M145 66Q200 102 255 66" fill="none" stroke="#972b39" stroke-width="4" opacity=".3"/>`:``}<g class="pomo-scale">${ticks}</g><path d="m200 98-7 13h14Z" fill="#fff6dd"/><circle cx="200" cy="221" r="100" fill="${selected.colors[2]}" opacity=".13"/></svg><div class="pomo-tomato-face"><strong id="pomo-time" role="timer" aria-label="剩余时间"></strong><span id="pomo-status"></span></div></div>`;
}
export const durationOptions = mode => mode==='focus'?[15,25,35,45,60]:mode==='short'?[3,5,10,15]:[10,15,20,30];
