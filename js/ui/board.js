// 盤面の表示と演出。
// エンジンの状態はすぐ確定するが、画面では「自分の攻撃 → タワー → 敵の移動 → 出現」の順に再生する。
// 再生中に次の操作が来たら、今の再生を早送りしてから次を再生する。
import { h } from '../core/ui.js';
import { COLS, ROWS, PATH, SLOTS, EXIT, alive } from '../game/engine.js';
import { towerSprite, enemySprite } from '../game/art.js';
import { sfx } from '../core/sound.js';

const key = (c, r) => `${c},${r}`;
const near = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= 1;

// skinFor(type) → { id, cls, star }: タワーごとのスキン（★が上がるほど光り方が派手）
export function boardView(st, { onSlot, onTap, skinFor = () => ({ id: 'default', cls: 'skin-default', star: 0 }), coinTarget = null, speed = () => 1 }) {
  const pathIndex = new Map(PATH.map(([c, r], i) => [key(c, r), i]));
  const slotIndex = new Map(SLOTS.map(([c, r], i) => [key(c, r), i]));
  const cells = [];
  const slotEls = [];
  const pathEls = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const k = key(c, r);
      const style = { gridColumn: c + 1, gridRow: r + 1 };
      if (pathIndex.has(k)) {
        const i = pathIndex.get(k);
        const el = h('div', { class: `cell path${i === EXIT ? ' exit' : ''}${i === 0 ? ' start' : ''}`, style },
          i === EXIT ? h('span', { class: 'door' }, '🚪') : i === 0 ? h('span', { class: 'gate' }, '⛓️') : h('span', { class: 'arrow' }, arrowFor(i)));
        pathEls[i] = el;
        cells.push(el);
      } else if (slotIndex.has(k)) {
        const si = slotIndex.get(k);
        const el = h('button', { class: 'cell slot', type: 'button', style, 'aria-label': 'タワーの場所', onclick: (e) => { e.stopPropagation(); onSlot(si, el); } });
        slotEls[si] = el;
        cells.push(el);
      } else cells.push(h('div', { class: 'cell wall', style }));
    }
  }
  const overlay = h('div', { class: 'overlay-layer' });
  const layer = h('div', { class: 'enemy-layer' });
  const fx = h('div', { class: 'fx-layer' });
  const grid = h('div', { class: 'grid' }, cells, overlay, layer, fx);
  const el = h('div', { class: 'board', onclick: () => { if (busy) finish(); else onTap?.(); } }, grid);

  // ---------- 表示用の状態 ----------
  const shown = new Map(); // id -> { el, pos, hp, maxHp, kind }
  const shownTowers = SLOTS.map(() => null); // 'type:lvl'
  const cellPx = () => grid.clientWidth / COLS;
  const xy = (pos) => { const [c, r] = PATH[Math.min(pos, EXIT)]; const s = cellPx(); return [c * s, r * s]; };
  const center = (c, r) => { const s = cellPx(); return [(c + 0.5) * s, (r + 0.5) * s]; };

  function makeEnemy(id, kind, look, hp, maxHp, pos, review) {
    const d = h('div', { class: `enemy k-${kind}${review ? ' is-review' : ''}`, html: `<span class="body">${enemySprite(kind, look)}</span><span class="hp"><i></i></span>` });
    layer.append(d);
    const o = { el: d, pos, hp, maxHp, kind, look };
    shown.set(id, o);
    place(o);
    paintHp(o);
    return o;
  }
  function place(o) {
    const [c, r] = PATH[Math.min(o.pos, EXIT)];
    o.el.style.setProperty('--c', c);
    o.el.style.setProperty('--r', r);
  }
  function paintHp(o) {
    o.el.querySelector('.hp i').style.width = `${Math.max(0, (o.hp / o.maxHp) * 100)}%`;
    o.el.classList.toggle('low', o.hp / o.maxHp <= 0.34);
  }
  function paintTower(si, pop = false) {
    const tw = st.slots[si];
    const sig = tw ? `${tw.type}:${tw.lvl}` : null;
    if (sig === shownTowers[si]) return;
    const s = slotEls[si];
    const prev = shownTowers[si];
    shownTowers[si] = sig;
    const sk = tw ? skinFor(tw.type) : null;
    s.className = `cell slot${tw ? ` built ${sk.cls} sk-star-${sk.star}` : ''}`;
    s.innerHTML = tw ? `${towerSprite(tw.type, tw.lvl, sk.id)}<span class="lv">${'★'.repeat(tw.lvl)}</span>` : '<span class="plus">＋</span>';
    if (tw && pop) {
      anim(s, [{ transform: 'scale(.3) translateY(-20px)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], 320);
      burst(...slotCenter(si), prev ? ['✨', '⭐', '✨'] : ['💥', '✨'], prev ? 8 : 6);
      if (prev) floatAt(...slotCenter(si), `Lv${tw.lvl}!`, 'lvup');
    }
  }
  const slotCenter = (si) => center(...SLOTS[si]);

  // 状態に合わせて一気に表示を合わせる（早送り・初期表示用）
  function sync(pop = false) {
    st.slots.forEach((_, si) => paintTower(si, pop));
    const live = new Set();
    for (const e of st.enemies) {
      if (e.dead) continue;
      live.add(e.id);
      let o = shown.get(e.id);
      if (!o) o = makeEnemy(e.id, e.kind, e.look, e.hp, e.maxHp, e.pos, !!e.review);
      o.pos = e.pos;
      o.hp = e.hp;
      place(o);
      paintHp(o);
      o.el.classList.toggle('slowed', !!e.slowed);
    }
    for (const [id, o] of shown) if (!live.has(id)) { o.el.remove(); shown.delete(id); }
    el.classList.toggle('frozen', st.frozen > 0);
  }

  // ---------- アニメーションの土台（早送りできる） ----------
  let busy = false;
  let skipping = false;
  const running = new Set();
  const timers = new Set();
  function anim(target, frames, ms, opts = {}) {
    const dur = Math.max(1, ms * speed());
    const a = target.animate(frames, { duration: dur, easing: opts.easing || 'ease-out', fill: opts.fill || 'none' });
    running.add(a);
    if (skipping) a.finish();
    // 画面が裏に回るとアニメが止まって finished が来ないことがあるので、時間で必ず終わらせる
    const guard = new Promise((res) => setTimeout(() => { try { a.finish(); } catch { /* 済み */ } res(); }, dur + 250));
    return Promise.race([a.finished.catch(() => {}), guard]).finally(() => running.delete(a));
  }
  function wait(ms) {
    if (skipping) return Promise.resolve();
    return new Promise((res) => {
      const t = { res, id: setTimeout(() => { timers.delete(t); res(); }, ms * speed()) };
      timers.add(t);
    });
  }
  function finish() {
    if (!busy) return;
    skipping = true;
    for (const a of running) { try { a.finish(); } catch { /* 終わっている */ } }
    for (const t of timers) { clearTimeout(t.id); t.res(); }
    timers.clear();
  }

  // ---------- 演出パーツ ----------
  function floatAt(x, y, text, cls = '') {
    const f = h('div', { class: `pop-num ${cls}`, style: { left: `${x}px`, top: `${y}px` } }, text);
    fx.append(f);
    anim(f, [{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-110%) scale(1.15)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-220%) scale(1)', opacity: 0 }], 800).then(() => f.remove());
  }
  function burst(x, y, glyphs, n = 10, spread = 1) {
    for (let i = 0; i < n; i++) {
      const g = glyphs[i % glyphs.length];
      const p = h('div', { class: 'particle', style: { left: `${x}px`, top: `${y}px` } }, g);
      fx.append(p);
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const dist = (28 + Math.random() * 26) * spread * (cellPx() / 70);
      anim(p, [
        { transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1.1) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist * 1.2}px), calc(-50% + ${Math.sin(ang) * dist * 1.2 + 14}px)) scale(.6)`, opacity: 0 },
      ], 520 + Math.random() * 160).then(() => p.remove());
    }
  }
  function enemyCenter(o) {
    const [x, y] = xy(o.pos);
    const s = cellPx();
    return [x + s / 2, y + s / 2];
  }
  // 敵 → HUD のコイン表示へ飛ぶコイン
  function flyCoin(x, y) {
    if (!coinTarget) return;
    const gr = grid.getBoundingClientRect();
    const tr = coinTarget.getBoundingClientRect();
    const c = h('div', { class: 'fly-coin', style: { left: `${gr.left + x}px`, top: `${gr.top + y}px` } }, '🪙');
    document.body.append(c);
    const dx = tr.left + tr.width / 2 - (gr.left + x);
    const dy = tr.top + tr.height / 2 - (gr.top + y);
    anim(c, [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3 - 30}px)) scale(1.3)`, offset: 0.35 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.6)` }], 560, { easing: 'ease-in' }).then(() => {
      c.remove();
      sfx('coin');
      coinTarget.classList.remove('bump');
      void coinTarget.offsetWidth;
      coinTarget.classList.add('bump');
    });
  }
  function hitFlash(o, dmg, cls = '') {
    const [x, y] = enemyCenter(o);
    o.el.classList.remove('flash');
    void o.el.offsetWidth;
    o.el.classList.add('flash');
    floatAt(x, y - cellPx() * 0.2, `-${dmg}`, `dmg ${cls}`);
    paintHp(o);
  }
  let killCount = 0;
  async function killFx(o, id) {
    const [x, y] = enemyCenter(o);
    const big = o.kind === 'boss';
    shown.delete(id);
    sfx(big ? 'bigpop' : 'pop', killCount++ % 4);
    burst(x, y, big ? ['💥', '⭐', '🎉', '✨'] : ['✨', '⭐', '💫'], big ? 22 : 12, big ? 1.8 : 1);
    if (big) { el.classList.remove('quake'); void el.offsetWidth; el.classList.add('quake'); }
    floatAt(x, y - cellPx() * 0.5, '+3🪙', 'coin');
    flyCoin(x, y);
    await anim(o.el, [{ transform: getComputedStyle(o.el).transform, opacity: 1 }, { transform: `${getComputedStyle(o.el).transform} scale(1.5) rotate(25deg)`, opacity: 0 }], 300);
    o.el.remove();
  }
  // 線（ビーム・いなずま）
  function beamLine(x0, y0, x1, y1, cls) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    const b = h('div', { class: `beam ${cls}`, style: { left: `${x0}px`, top: `${y0}px`, width: `${len}px`, transform: `rotate(${ang}deg)` } });
    fx.append(b);
    return anim(b, [{ opacity: 0, transform: `rotate(${ang}deg) scaleX(.1)` }, { opacity: 1, transform: `rotate(${ang}deg) scaleX(1)`, offset: 0.35 }, { opacity: 0, transform: `rotate(${ang}deg) scaleX(1)` }], cls === 'zap' ? 260 : 200).then(() => b.remove());
  }
  function ring(x, y, cls, size = 2.6) {
    const r = h('div', { class: `ring ${cls}`, style: { left: `${x}px`, top: `${y}px` } });
    fx.append(r);
    return anim(r, [{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 0.9 }, { transform: `translate(-50%,-50%) scale(${size})`, opacity: 0 }], 360).then(() => r.remove());
  }

  // ---------- 再生 ----------
  let chain = Promise.resolve();
  function play(events, { after } = {}) {
    finish();
    const p = chain.then(() => run(events)).then(() => after?.());
    chain = p.catch(() => {});
    return p;
  }

  async function run(events) {
    busy = true;
    skipping = false;
    el.classList.add('playing');
    clearPrediction();
    try {
      // 1) 自分の攻撃（正解のいなずま）＆ 道具
      for (const ev of events.filter((e) => e.t === 'zap')) {
        const o = shown.get(ev.id);
        if (!o) continue;
        const [x, y] = enemyCenter(o);
        sfx('zap');
        await beamLine(x, -cellPx() * 0.6, x, y, 'zap');
        ring(x, y, 'zap-ring', 1.6);
      }
      await applyHits(events.filter((e) => (e.t === 'hit' || e.t === 'kill') && (e.src === 'zap' || e.src === 'tool' || e.src === 'ally')));
      // 2) タワー（同時に撃つ）
      const fires = events.filter((e) => e.t === 'fire');
      if (fires.length) {
        await wait(60);
        const shots = [];
        const kinds = new Set();
        for (const f of fires) {
          const [sx, sy] = slotCenter(f.slot);
          const s = slotEls[f.slot];
          s.classList.remove('firing');
          void s.offsetWidth;
          s.classList.add('firing');
          kinds.add(f.type);
          if (f.type === 'bomb') shots.push(ring(sx, sy, 'bomb-ring', 3.2));
          else if (f.type === 'frost') {
            shots.push(ring(sx, sy, 'frost-ring', 3));
            for (const id of f.slowed) { const o = shown.get(id); if (o) o.el.classList.add('slowed'); }
          }
          for (const id of f.targets) {
            const o = shown.get(id);
            if (!o) continue;
            const [tx, ty] = enemyCenter(o);
            if (f.type === 'beam') shots.push(beamLine(sx, sy, tx, ty, `beam lv${f.lvl}`));
          }
        }
        kinds.forEach((k) => sfx(k));
        await Promise.all(shots);
        await applyHits(events.filter((e) => (e.t === 'hit' || e.t === 'kill') && e.src === 'tower'));
      }
      // 3) 敵の移動（道にそって1マスずつ）
      const moves = events.filter((e) => e.t === 'move');
      if (events.some((e) => e.t === 'frozen')) {
        for (const o of shown.values()) { o.el.classList.remove('shiver'); void o.el.offsetWidth; o.el.classList.add('shiver'); }
        await wait(250);
      }
      if (moves.length) {
        await wait(80);
        sfx('step');
        await Promise.all(moves.map((m) => walk(m)));
      }
      for (const ev of events.filter((e) => e.t === 'leak' || e.t === 'blocked')) {
        const o = shown.get(ev.id);
        if (!o) continue;
        shown.delete(ev.id);
        const door = pathEls[EXIT];
        if (ev.t === 'leak') {
          sfx('leak');
          door.classList.remove('breach');
          void door.offsetWidth;
          door.classList.add('breach');
          el.classList.remove('shake');
          void el.offsetWidth;
          el.classList.add('shake');
          floatAt(...center(...PATH[EXIT]), '❤️-1', 'leak');
        } else {
          floatAt(...center(...PATH[EXIT]), '🧱ブロック!', 'block');
        }
        anim(o.el, [{ opacity: 1 }, { opacity: 0, transform: `${getComputedStyle(o.el).transform} scale(.4)` }], 300).then(() => o.el.remove());
      }
      // 4) 出現
      const spawns = events.filter((e) => e.t === 'spawn');
      for (const sp of spawns) {
        const e = st.enemies.find((x) => x.id === sp.id);
        if (!e || e.dead || shown.has(sp.id)) continue;
        const o = makeEnemy(sp.id, sp.kind, sp.look, sp.hp, sp.hp, 0, sp.review);
        anim(o.el.querySelector('.body'), [{ transform: 'translateY(-40px) scale(.3)', opacity: 0 }, { transform: 'translateY(4px) scale(1.15)', opacity: 1, offset: 0.7 }, { transform: 'none' }], 380);
      }
      if (spawns.length) await wait(200);
    } finally {
      skipping = false;
      busy = false;
      el.classList.remove('playing');
      sync(true);
    }
  }

  async function applyHits(evs) {
    if (!evs.length) return;
    const kills = [];
    for (const ev of evs) {
      const o = shown.get(ev.id);
      if (!o) continue;
      if (ev.t === 'hit') {
        o.hp = ev.hp;
        hitFlash(o, ev.dmg, ev.src);
        if (ev.src === 'tower') sfx('hit');
      } else kills.push(killFx(o, ev.id));
    }
    await wait(kills.length ? 160 : 120);
    await Promise.all(kills);
  }

  async function walk(m) {
    const o = shown.get(m.id);
    if (!o) return;
    const s = cellPx();
    const frames = [];
    const step = m.to >= m.from ? 1 : -1;
    for (let p = m.from; ; p += step) {
      const [c, r] = PATH[Math.min(p, EXIT)];
      frames.push({ transform: `translate(${c * s}px, ${r * s}px)` });
      if (p !== m.to) {
        const [c2, r2] = PATH[Math.min(p + step, EXIT)];
        frames.push({ transform: `translate(${((c + c2) / 2) * s}px, ${((r + r2) / 2) * s - s * 0.12}px)` });
      }
      if (p === m.to) break;
    }
    const n = Math.abs(m.to - m.from);
    o.pos = m.to;
    await anim(o.el, frames, 230 * n, { easing: 'linear' });
    place(o);
  }

  // ---------- 予測表示 ----------
  function clearPrediction() {
    overlay.innerHTML = '';
    pathEls.forEach((p) => p?.classList.remove('danger'));
    for (const o of shown.values()) o.el.classList.remove('targeted', 'doomed');
  }
  // pred = E.predict(...) の結果
  function showPrediction(pred) {
    clearPrediction();
    if (!pred) return;
    const s = cellPx();
    // 正解したときにねらう敵
    const zap = pred.ok.events.find((e) => e.t === 'zap');
    if (zap) {
      const o = shown.get(zap.id);
      if (o) {
        const killed = pred.ok.events.some((e) => e.t === 'kill' && e.id === zap.id && e.src === 'zap');
        o.el.classList.add('targeted');
        const [x, y] = xy(o.pos);
        overlay.append(h('div', { class: `reticle${killed ? ' lethal' : ''}`, style: { left: `${x}px`, top: `${y}px`, width: `${s}px`, height: `${s}px` } },
          h('span', { class: 'ret-tag' }, killed ? '撃破!' : `⚡-${zap.dmg}`)));
      }
    }
    // まちがえたときの行き先（足あと）と、突破の危険
    for (const m of pred.ng.events.filter((e) => e.t === 'move')) {
      const o = shown.get(m.id);
      if (!o) continue;
      const leak = pred.ng.events.some((e) => (e.t === 'leak' || e.t === 'blocked') && e.id === m.id);
      for (let p = m.from + 1; p <= m.to; p++) {
        const [c, r] = PATH[Math.min(p, EXIT)];
        const last = p === m.to;
        overlay.append(h('div', { class: `pghost${last ? ' end' : ''}${leak && last ? ' leak' : ''}`, style: { left: `${c * s}px`, top: `${r * s}px`, width: `${s}px`, height: `${s}px` } },
          last && !leak ? h('span', { class: 'ghost-body', html: o.el.querySelector('.body').innerHTML }) : h('span', { class: 'foot' }, '👣')));
      }
      if (leak) {
        o.el.classList.add('doomed');
        pathEls[EXIT].classList.add('danger');
      }
    }
  }

  // タワーのとどく範囲
  function showRange(si) {
    clearRange();
    PATH.forEach(([c, r], i) => { if (near(SLOTS[si], [c, r])) pathEls[i].classList.add('in-range'); });
  }
  function clearRange() {
    pathEls.forEach((p) => p?.classList.remove('in-range'));
  }

  sync();
  return {
    el,
    grid,
    sync,
    play,
    finish,
    idle: () => chain,
    isBusy: () => busy,
    showPrediction,
    clearPrediction,
    showRange,
    clearRange,
    slotEl: (i) => slotEls[i],
    floatOnSlot: (si, text, cls) => floatAt(...slotCenter(si), text, cls),
    shake: () => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); },
    alive: () => alive(st),
  };
}

// 道の向き（次のマスの方向）
function arrowFor(i) {
  const [c, r] = PATH[i];
  const [c2, r2] = PATH[i + 1];
  if (c2 > c) return '›';
  if (c2 < c) return '‹';
  if (r2 > r) return '⌄';
  return '˄';
}
