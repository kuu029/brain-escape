// 💎がふえる演出: 画面の中（from の要素、なければ真ん中）から右上の💎表示へ飛んでいき、着くたびに数字がふえる
import { h } from '../core/ui.js';
import { S } from '../core/store.js';
import { sfx } from '../core/sound.js';
import { iconHTML } from '../game/art.js';

// 飛んでいく💎は、右上の表示と同じ紫のダイヤの絵（画像がなければ絵文字）
const GEM = () => iconHTML('icon-gem', '💎', '');

export function flyGems(n, from = null, delay = 0) {
  if (!(n > 0)) return;
  setTimeout(() => {
    let pill = document.querySelector('.gem-pill');
    let temp = null;
    // 💎表示がない画面（訓練など）では、右上に一時的に出す
    if (!pill) {
      temp = h('span', { class: 'pill gem-pill gem-temp' }, h('span', { html: GEM() }), ' ', h('b', {}, String(S().gems - n)));
      document.body.append(temp);
      pill = temp;
    }
    const num = pill.querySelector('b');
    const end = S().gems;
    const start = end - n;
    num.textContent = String(start);
    const t = pill.getBoundingClientRect();
    const f = from?.getBoundingClientRect?.() || { left: innerWidth / 2 - 12, top: innerHeight * 0.45, width: 24, height: 24 };
    const k = Math.min(8, Math.max(3, Math.ceil(n / 4)));
    let landed = 0;
    for (let i = 0; i < k; i++) {
      const g = h('span', { class: 'gem-fly', 'aria-hidden': 'true', html: GEM() });
      document.body.append(g);
      const x0 = f.left + f.width / 2 + (Math.random() - 0.5) * 40, y0 = f.top + f.height / 2 + (Math.random() - 0.5) * 30;
      const x1 = t.left + 14, y1 = t.top + t.height / 2;
      const mid = [(x0 + x1) / 2 + (Math.random() - 0.5) * 80, Math.min(y0, y1) - 40 - Math.random() * 40];
      g.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${x0}px, ${y0 - 14}px) scale(1.2)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${mid[0]}px, ${mid[1]}px) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${x1}px, ${y1}px) scale(.6)`, opacity: 0.9 },
      ], { duration: 700, delay: i * 80, easing: 'ease-in', fill: 'forwards' }).finished.then(() => {
        g.remove();
        landed++;
        num.textContent = String(Math.round(start + (n * landed) / k));
        sfx('coin');
        pill.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 160 });
        if (landed === k) {
          num.textContent = String(end);
          if (temp) setTimeout(() => temp.remove(), 900);
        }
      });
    }
  }, delay);
}
