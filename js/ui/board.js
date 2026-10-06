// 盤面の表示（エンジンの状態を絵にするだけ）
import { h } from '../core/ui.js';
import { COLS, ROWS, PATH, SLOTS, EXIT } from '../game/engine.js';
import { ENEMY_LOOK, BOSSES, TOWER_LOOK } from '../game/content.js';

const key = (c, r) => `${c},${r}`;

export function boardView(st, { onSlot, skin = 'skin-default' }) {
  const pathIndex = new Map(PATH.map(([c, r], i) => [key(c, r), i]));
  const slotIndex = new Map(SLOTS.map(([c, r], i) => [key(c, r), i]));
  const cells = [];
  const slotEls = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = key(c, r);
      if (pathIndex.has(k)) {
        const i = pathIndex.get(k);
        cells.push(h('div', { class: `cell path${i === EXIT ? ' exit' : ''}${i === 0 ? ' start' : ''}`, style: { gridColumn: c + 1, gridRow: r + 1 } }, i === EXIT ? '🚪' : i === 0 ? '⛓️' : ''));
      } else if (slotIndex.has(k)) {
        const si = slotIndex.get(k);
        const el = h('button', { class: `cell slot ${skin}`, type: 'button', style: { gridColumn: c + 1, gridRow: r + 1 }, onclick: () => onSlot(si), 'aria-label': 'タワーの場所' });
        slotEls[si] = el;
        cells.push(el);
      } else cells.push(h('div', { class: 'cell wall', style: { gridColumn: c + 1, gridRow: r + 1 } }));
    }
  }
  const layer = h('div', { class: 'enemy-layer' });
  const grid = h('div', { class: 'grid' }, cells, layer);
  const el = h('div', { class: 'board' }, grid);
  const enemyEls = new Map();

  function look(e) {
    if (e.kind === 'boss') return BOSSES[e.look] || ENEMY_LOOK.boss;
    return ENEMY_LOOK[e.kind];
  }

  function update() {
    st.slots.forEach((tw, si) => {
      const s = slotEls[si];
      s.classList.toggle('built', !!tw);
      s.innerHTML = tw ? `<span class="tw">${TOWER_LOOK[tw.type].emoji}</span><span class="lv">${'★'.repeat(tw.lvl)}</span>` : '<span class="plus">＋</span>';
    });
    for (const e of st.enemies) {
      let d = enemyEls.get(e.id);
      if (!d && !e.dead) {
        const lk = look(e);
        d = h('div', { class: `enemy k-${e.kind}`, title: lk.name }, h('span', { class: 'em' }, lk.emoji), h('span', { class: 'hp' }, h('i')));
        enemyEls.set(e.id, d);
        layer.append(d);
      }
      if (!d) continue;
      const [c, r] = PATH[Math.min(e.pos, EXIT)];
      d.style.setProperty('--c', c);
      d.style.setProperty('--r', r);
      d.querySelector('.hp i').style.width = `${Math.max(0, (e.hp / e.maxHp) * 100)}%`;
      if (e.dead && !d.classList.contains('gone')) {
        d.classList.add('gone');
        setTimeout(() => d.remove(), 450);
      }
    }
  }

  // 演出
  function fx(events) {
    for (const ev of events) {
      if (ev.t === 'hit') {
        const d = enemyEls.get(ev.id);
        if (d) {
          d.classList.remove('flash', 'zap');
          void d.offsetWidth;
          d.classList.add(ev.src === 'zap' ? 'zap' : 'flash');
        }
      } else if (ev.t === 'fire') {
        const s = slotEls[ev.slot];
        s.classList.remove('firing');
        void s.offsetWidth;
        s.classList.add('firing');
      } else if (ev.t === 'leak') {
        el.classList.remove('shake');
        void el.offsetWidth;
        el.classList.add('shake');
      }
    }
  }

  update();
  return { el, update, fx, slotEl: (i) => slotEls[i] };
}
