// 画面の後ろの飾り（鉄格子・月・火の粉・光のすじ・雨）。画像がなくても CSS だけで描く
import { h } from '../core/ui.js';
import { bgUrl } from '../game/art.js';

// ただよう火の粉
export function embers(n, top = 40) {
  const box = h('div', { class: 'embers' });
  for (let i = 0; i < n; i++) box.append(h('i', { style: { left: `${(i * 41) % 100}%`, top: `${top + ((i * 29) % (100 - top))}%`, animationDelay: `${-(i * 1.3) % 8}s`, animationDuration: `${8 + (i % 4)}s` } }));
  return box;
}

// variant: 'cell'（独房の夜）| 'win'（光のすじ）| 'lose'（雨）| 'desk'（机のランプ）
// image: 背景画像のキー（art/<key>.jpg があれば重ねる）
export function backdrop(el, variant = 'cell', image = null) {
  el.classList.add('has-deco');
  // 画像の指定がなければ、ふんいきごとの共通の背景（art/bg-desk.jpg など。なければ CSS だけ）
  const img = bgUrl(image || { desk: 'bg-desk', win: 'bg-win', lose: 'bg-lose' }[variant]);
  const d = h('div', { class: `bg-deco v-${variant}${img ? ' has-img' : ''}`, 'aria-hidden': 'true', style: img ? { backgroundImage: `linear-gradient(#0b071699, #0b0716cc 55%, #0b0716f2), url(${img})` } : {} });
  if (variant === 'cell' && !img) d.append(h('span', { class: 'moon' }));
  if (variant === 'win') d.append(h('span', { class: 'rays' }));
  if (variant === 'lose') {
    const rain = h('div', { class: 'rain' });
    for (let i = 0; i < 26; i++) rain.append(h('i', { style: { left: `${(i * 37) % 100}%`, animationDelay: `${-((i * 0.37) % 1.2)}s`, animationDuration: `${0.9 + (i % 4) * 0.15}s` } }));
    d.append(rain);
  }
  if (variant !== 'lose') d.append(embers(variant === 'win' ? 6 : 10));
  el.prepend(d);
  return d;
}

// 紙吹雪（勝ったとき）
export function confetti(n = 28) {
  const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
  const colors = ['#ffd640', '#ff7ab6', '#5cc8ff', '#3ee08f', '#c77dff'];
  for (let i = 0; i < n; i++) {
    box.append(h('i', { style: { left: `${(i * 53) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 7) * 0.12}s`, animationDuration: `${2.2 + (i % 5) * 0.3}s`, transform: `rotate(${i * 37}deg)` } }));
  }
  return box;
}
