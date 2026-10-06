// ターン制タワーディフェンスの本体（DOM なし。Node のテストからも動かせる）
// 1問 = 1ターン。正解 → コイン＋こうげき、不正解 → 敵だけ進む。

// 盤面 4×4。通路はくねくね、出口は左下。
export const COLS = 4;
export const ROWS = 4;
export const PATH = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [2, 2], [1, 2], [0, 2], [0, 3]];
export const EXIT = PATH.length - 1; // ここに着いたらライフ -1
export const SLOTS = [[0, 1], [1, 1], [2, 1], [1, 3], [2, 3], [3, 3]];

export const TOWERS = {
  beam: { cost: 30, up: [25, 35], dmg: [1, 2, 3] },
  frost: { cost: 35, up: [25, 35], dmg: [0, 1, 1], slow: true },
  bomb: { cost: 45, up: [30, 40], dmg: [1, 1, 2], splash: true },
};
// 数値はシミュレーション（tests/verify-app.mjs）で調整:
// 正答率80%→ほぼ勝てる / 60%→8割 / 40%→3割 / 20%→ほぼ負け
export const ENEMIES = {
  grunt: { hp: 4, speed: 1 },
  runner: { hp: 3, speed: 2 },
  tank: { hp: 8, speed: 1 },
  review: { hp: 2, speed: 1 },
  boss: { hp: 18, speed: 1, everyOther: true },
};
export const MAX_LIVES = 5;

const near = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])) <= 1;

// schedule: [{ turn, kind, review? }]
export function createBattle({ mode = 'practice', schedule = [], lives = 3, coins = 0, tools = [] } = {}) {
  const st = {
    mode,
    turn: 0,
    lives: mode === 'diagnosis' ? Infinity : lives,
    coins,
    combo: 0,
    maxCombo: 0,
    enemies: [],
    queue: [...schedule].sort((a, b) => a.turn - b.turn),
    slots: SLOTS.map(() => null),
    nextId: 1,
    over: null,
    kills: 0,
    reviewKills: 0,
    leaks: 0,
    built: 0,
    tools: Object.fromEntries(tools.map((t) => [t, true])), // true = まだ使える
    frozen: 0,
    double: 0,
    wall: 0,
  };
  spawnDue(st, []);
  return st;
}

export const alive = (st) => st.enemies.filter((e) => !e.dead);
export const front = (st) => alive(st).sort((a, b) => b.pos - a.pos || a.id - b.id)[0] || null;
// 盤面に出ていて、まだ答えていない復習の敵
export const pendingReview = (st) => alive(st).find((e) => e.review && !e.review.answered) || null;

function spawn(st, s, ev) {
  const def = ENEMIES[s.kind];
  const hp = s.hp ?? def.hp;
  const e = { id: st.nextId++, kind: s.kind, hp, maxHp: hp, pos: 0, review: s.review ? { ...s.review, answered: false } : null, look: s.look || null };
  st.enemies.push(e);
  ev.push({ t: 'spawn', id: e.id, kind: e.kind });
}
function spawnDue(st, ev) {
  while (st.queue.length && st.queue[0].turn <= st.turn) spawn(st, st.queue.shift(), ev);
  // 盤面が空っぽなら次の敵を前倒しで出す（待ち時間を作らない）
  if (!alive(st).length && st.queue.length) spawn(st, st.queue.shift(), ev);
}

function hit(st, e, dmg, ev, src) {
  if (e.dead || dmg <= 0) return;
  e.hp -= dmg;
  ev.push({ t: 'hit', id: e.id, dmg, src });
  if (e.hp <= 0) {
    e.dead = true;
    st.kills++;
    if (e.review) st.reviewKills++;
    st.coins += 3;
    ev.push({ t: 'kill', id: e.id, kind: e.kind });
  }
}

// 正解・不正解の処理。targetId があればその敵をねらう（復習の敵）
export function answer(st, { correct, retry = false, targetId = null }) {
  const ev = [];
  if (st.over) return ev;
  if (correct) {
    if (!retry) {
      st.combo++;
      st.maxCombo = Math.max(st.maxCombo, st.combo);
    }
    const gain = retry ? 4 : 10 + Math.min(st.combo - 1, 5) * 2;
    st.coins += gain;
    ev.push({ t: 'coins', n: gain });
    const target = (targetId && st.enemies.find((e) => e.id === targetId && !e.dead)) || front(st);
    let dmg = retry ? 1 : st.combo >= 3 ? 3 : 2;
    if (target?.review && target.id === targetId) dmg = Math.max(dmg, target.hp);
    if (st.double > 0) { dmg *= 2; st.double--; }
    if (target) hit(st, target, dmg, ev, 'zap');
  } else {
    st.combo = 0;
    ev.push({ t: 'miss' });
  }
  endTurn(st, ev);
  return ev;
}

function endTurn(st, ev) {
  // タワーのこうげき
  st.slots.forEach((tw, si) => {
    if (!tw) return;
    const def = TOWERS[tw.type];
    const inRange = alive(st).filter((e) => near(SLOTS[si], PATH[e.pos]));
    if (!inRange.length) return;
    const dmg = def.dmg[tw.lvl - 1];
    ev.push({ t: 'fire', slot: si, type: tw.type });
    if (def.splash) inRange.forEach((e) => hit(st, e, dmg, ev, 'tower'));
    else {
      if (def.slow) inRange.forEach((e) => { e.slowed = true; });
      const e = inRange.sort((a, b) => b.pos - a.pos)[0];
      hit(st, e, dmg, ev, 'tower');
    }
  });
  // 敵の移動
  if (st.frozen > 0) {
    st.frozen--;
    ev.push({ t: 'frozen' });
  } else {
    for (const e of alive(st).sort((a, b) => b.pos - a.pos)) {
      const def = ENEMIES[e.kind];
      let steps = def.speed;
      if (def.everyOther && st.turn % 2 === 1) steps = 0;
      if (e.slowed && st.turn % 2 === 0) steps = Math.max(0, steps - 1);
      e.slowed = false;
      if (!steps) continue;
      e.pos = Math.min(EXIT, e.pos + steps);
      ev.push({ t: 'move', id: e.id });
      if (e.pos >= EXIT) {
        e.dead = true;
        if (st.wall > 0) {
          st.wall--;
          ev.push({ t: 'blocked', id: e.id });
          continue;
        }
        st.leaks++;
        if (st.mode !== 'diagnosis') st.lives--;
        ev.push({ t: 'leak', id: e.id });
      }
    }
  }
  st.turn++;
  spawnDue(st, ev);
  if (st.lives <= 0) st.over = 'lose';
  else if (!st.queue.length && !alive(st).length && st.mode !== 'diagnosis') st.over = 'win';
  if (st.over) ev.push({ t: 'over', result: st.over });
}

export function buildCost(type) {
  return TOWERS[type].cost;
}
export function upgradeCost(st, si) {
  const tw = st.slots[si];
  if (!tw || tw.lvl >= 3) return null;
  return TOWERS[tw.type].up[tw.lvl - 1];
}
export function build(st, si, type) {
  if (st.slots[si] || st.coins < TOWERS[type].cost) return false;
  st.coins -= TOWERS[type].cost;
  st.slots[si] = { type, lvl: 1 };
  st.built++;
  return true;
}
export function upgrade(st, si) {
  const c = upgradeCost(st, si);
  if (c === null || st.coins < c) return false;
  st.coins -= c;
  st.slots[si].lvl++;
  st.built++;
  return true;
}

export function useTool(st, id) {
  const ev = [];
  if (!st.tools[id] || st.over) return ev;
  st.tools[id] = false;
  if (id === 'coins') st.coins += 40;
  else if (id === 'heal') st.lives = Math.min(MAX_LIVES, st.lives + 1);
  else if (id === 'freeze') st.frozen = 2;
  else if (id === 'nuke') for (const e of alive(st)) hit(st, e, 2, ev, 'tool');
  else if (id === 'sniper') { const f = front(st); if (f) hit(st, f, 5, ev, 'tool'); }
  else if (id === 'double') st.double = 3;
  else if (id === 'rewind') for (const e of alive(st)) e.pos = Math.max(0, e.pos - 2);
  else if (id === 'wall') st.wall = 2;
  else if (id === 'mega') st.slots.forEach((tw) => { if (tw && tw.lvl < 3) tw.lvl++; });
  ev.push({ t: 'tool', id });
  if (!st.queue.length && !alive(st).length && st.mode !== 'diagnosis') {
    st.over = 'win';
    ev.push({ t: 'over', result: 'win' });
  }
  return ev;
}

// 自動プレイ（テスト・「おまかせ建設」ボタン用）: 置ける所に置く → 安い強化
const AUTO_ORDER = [1, 4, 2, 0, 5, 3];
export function autoSpend(st) {
  let did = false;
  for (;;) {
    const empty = AUTO_ORDER.find((i) => !st.slots[i]);
    if (empty !== undefined && st.coins >= TOWERS.beam.cost) {
      const type = st.slots.filter(Boolean).length % 3 === 2 ? 'frost' : 'beam';
      if (build(st, empty, st.coins >= TOWERS[type].cost ? type : 'beam')) { did = true; continue; }
    }
    const ups = st.slots.map((tw, i) => [i, upgradeCost(st, i)]).filter(([, c]) => c !== null && c <= st.coins).sort((a, b) => a[1] - b[1]);
    if (ups.length && empty === undefined) {
      upgrade(st, ups[0][0]);
      did = true;
      continue;
    }
    break;
  }
  return did;
}
