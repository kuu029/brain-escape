// ターン制タワーディフェンスの本体（DOM なし。Node のテストからも動かせる）
import { BOSS_CARD } from './content.js';
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
    gauge: 0, // なかま召喚のゲージ（正解でたまる）
    summoned: {}, // このウェーブで呼んだなかま
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
  ev.push({ t: 'spawn', id: e.id, kind: e.kind, hp, look: e.look, review: !!e.review });
}
function spawnDue(st, ev) {
  while (st.queue.length && st.queue[0].turn <= st.turn) spawn(st, st.queue.shift(), ev);
  // 盤面が空っぽなら次の敵を前倒しで出す（待ち時間を作らない）
  if (!alive(st).length && st.queue.length) spawn(st, st.queue.shift(), ev);
}

function hit(st, e, dmg, ev, src, slot = null) {
  if (e.dead || dmg <= 0) return;
  e.hp = Math.max(0, e.hp - dmg);
  ev.push({ t: 'hit', id: e.id, dmg, src, slot, hp: e.hp });
  if (e.hp <= 0) {
    e.dead = true;
    st.kills++;
    if (e.review) st.reviewKills++;
    st.coins += 3;
    ev.push({ t: 'kill', id: e.id, kind: e.kind, src, coins: 3 });
  }
}

// 予測: 「正解なら」「まちがえたら」を本番と同じ計算で先にためす（エンジンは乱数なし）
export function cloneState(st) {
  return JSON.parse(JSON.stringify(st, (k, v) => (v === Infinity ? '__inf' : v)), (k, v) => (v === '__inf' ? Infinity : v));
}
export function predict(st, { targetId = null, retry = false } = {}) {
  const run = (correct) => {
    const c = cloneState(st);
    const events = answer(c, { correct, retry, targetId });
    return { events, st: c };
  };
  return { ok: run(true), ng: run(false) };
}

// 正解・不正解の処理。targetId があればその敵をねらう（復習の敵）
export function answer(st, { correct, retry = false, targetId = null }) {
  const ev = [];
  if (st.over) return ev;
  if (correct) {
    st.gauge = Math.min(GAUGE_MAX, (st.gauge || 0) + 1);
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
    if (target) {
      ev.push({ t: 'zap', id: target.id, dmg });
      hit(st, target, dmg, ev, 'zap');
    }
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
    const targets = def.splash ? inRange : [inRange.sort((a, b) => b.pos - a.pos)[0]];
    if (def.slow) inRange.forEach((e) => { e.slowed = true; });
    ev.push({ t: 'fire', slot: si, type: tw.type, lvl: tw.lvl, targets: targets.map((e) => e.id), slowed: def.slow ? inRange.map((e) => e.id) : [] });
    targets.forEach((e) => hit(st, e, dmg, ev, 'tower', si));
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
      // 氷: 動く番に1歩へらす。ただし続けては止められない（前に止めたら、次の動く番は氷がとけて進む）
      // → 氷タワーだけで、残り1体やボスを永久に止めることはできない
      if (steps > 0 && e.slowed) {
        if (e.chill) e.chill = false;
        else { steps = Math.max(0, steps - 1); e.chill = true; }
      } else if (steps > 0) e.chill = false;
      e.slowed = false;
      if (!steps) continue;
      const from = e.pos;
      e.pos = Math.min(EXIT, e.pos + steps);
      ev.push({ t: 'move', id: e.id, from, to: e.pos });
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
  else if (id === 'rewind') {
    for (const e of alive(st)) {
      const from = e.pos;
      e.pos = Math.max(0, e.pos - 2);
      if (from !== e.pos) ev.push({ t: 'move', id: e.id, from, to: e.pos });
    }
  }
  else if (id === 'wall') st.wall = 2;
  else if (id === 'mega') st.slots.forEach((tw) => { if (tw && tw.lvl < 3) tw.lvl++; });
  ev.push({ t: 'tool', id });
  if (!st.queue.length && !alive(st).length && st.mode !== 'diagnosis') {
    st.over = 'win';
    ev.push({ t: 'over', result: 'win' });
  }
  return ev;
}

// ---------- なかま召喚 ----------
// 正解3回でゲージ満タン → なかまを1体よべる（1ウェーブに1体1回）。よぶとゲージは0にもどる
export const GAUGE_NEED = 3;
const back = (st, e, n, ev) => { const from = e.pos; e.pos = Math.max(0, e.pos - n); if (from !== e.pos) ev.push({ t: 'move', id: e.id, from, to: e.pos }); };
// 技（ガチャのキャラごと）。答えを飛ばす技はない（勉強の流れはそのまま）
export const SUMMON = {
  kutsushita: { desc: '先頭の敵を1マス押し戻す', run: (st, ev) => { const f = front(st); if (f) back(st, f, 1, ev); } },
  sanma: { desc: '先頭の敵に2ダメージ', run: (st, ev) => { const f = front(st); if (f) hit(st, f, 2, ev, 'ally'); } },
  obake: { desc: 'リベンジおばけぜんぶに3ダメージ（いなければ先頭に2）', run: (st, ev) => { const rv = alive(st).filter((e) => e.review); if (rv.length) rv.forEach((e) => hit(st, e, 3, ev, 'ally')); else { const f = front(st); if (f) hit(st, f, 2, ev, 'ally'); } } },
  broccoli: { desc: '重低音で敵ぜんぶに1ダメージ', run: (st, ev) => alive(st).forEach((e) => hit(st, e, 1, ev, 'ally')) },
  onigiri: { desc: 'ライフ +1', run: (st) => { st.lives = Math.min(MAX_LIVES, st.lives + 1); } },
  toast: { desc: '次の2回、正解のこうげきが2倍', run: (st) => { st.double = Math.max(st.double, 2); } },
  snail: { desc: 'コイン +25', run: (st) => { st.coins += 25; } },
  cheese: { desc: '敵ぜんぶが1ターン動けない', run: (st) => { st.frozen = Math.max(st.frozen, 1); } },
  reizouko: { desc: '敵ぜんぶが2ターン動けない', run: (st) => { st.frozen = Math.max(st.frozen, 2); } },
  duck: { desc: 'ラッパで敵ぜんぶに2ダメージ', run: (st, ev) => alive(st).forEach((e) => hit(st, e, 2, ev, 'ally')) },
  moai: { desc: '次に出口へ来た敵を1体ブロック', run: (st) => { st.wall = Math.max(st.wall, 1); } },
  pigeon: { desc: '先頭の敵を2マス押し戻す', run: (st, ev) => { const f = front(st); if (f) back(st, f, 2, ev); } },
  robot: { desc: '先頭の敵に4ダメージ', run: (st, ev) => { const f = front(st); if (f) hit(st, f, 4, ev, 'ally'); } },
  sushi: { desc: '先頭に3ダメージ、2番目に1ダメージ', run: (st, ev) => { const [a, b] = alive(st).sort((x, y) => y.pos - x.pos); if (a) hit(st, a, 3, ev, 'ally'); if (b) hit(st, b, 1, ev, 'ally'); } },
  'banana-car': { desc: '敵ぜんぶを1マス押し戻す', run: (st, ev) => alive(st).forEach((e) => back(st, e, 1, ev)) },
  // ★3・★4 のガチャなかま: 強いかわりに、ゲージが多くいる
  kaminari: { need: 4, desc: '先頭の敵に6ダメージ', run: (st, ev) => { const f = front(st); if (f) hit(st, f, 6, ev, 'ally'); } },
  ninja: { need: 4, desc: '敵ぜんぶを2マス押し戻す', run: (st, ev) => alive(st).forEach((e) => back(st, e, 2, ev)) },
  pudding: { need: 4, desc: 'ライフ +1 ＆ 出口に来た敵を1体ブロック', run: (st) => { st.lives = Math.min(MAX_LIVES, st.lives + 1); st.wall = Math.max(st.wall, 1); } },
  kingyo: { need: 4, desc: 'コイン +60', run: (st) => { st.coins += 60; } },
  dragon: { need: 5, desc: '火をふいて敵ぜんぶに3ダメージ', run: (st, ev) => alive(st).forEach((e) => hit(st, e, 3, ev, 'ally')) },
  ufo: { need: 5, desc: '前の2体に8ダメージ（ほぼ一撃）', run: (st, ev) => alive(st).sort((x, y) => y.pos - x.pos).slice(0, 2).forEach((e) => hit(st, e, 8, ev, 'ally')) },
};
// ボスカードの必殺技（ゲージ6）: 数学のボスは全体こうげき、英語のボスは足止め＋こうげき、★4（総長・脱獄王）は大技
for (const [unit, id] of Object.entries(BOSS_CARD)) {
  if (SUMMON[id]) continue;
  SUMMON[id] = unit.startsWith('en-')
    ? { need: 6, boss: true, desc: '必殺: 敵ぜんぶ2ターン停止＋2ダメージ', run: (st, ev) => { st.frozen = Math.max(st.frozen, 2); alive(st).forEach((e) => hit(st, e, 2, ev, 'ally')); } }
    : { need: 6, boss: true, desc: '必殺: 敵ぜんぶに4ダメージ', run: (st, ev) => alive(st).forEach((e) => hit(st, e, 4, ev, 'ally')) };
}
// 暗号室のボス: 英単語は足止め、社会は押し戻し、理科は全体こうげき
SUMMON.golem = { need: 6, boss: true, desc: '必殺: 敵ぜんぶ3ターン停止', run: (st) => { st.frozen = Math.max(st.frozen, 3); } };
SUMMON.bushou = { need: 6, boss: true, desc: '必殺: 敵ぜんぶを3マス押し戻す＋1ダメージ', run: (st, ev) => alive(st).forEach((e) => { back(st, e, 3, ev); hit(st, e, 1, ev, 'ally'); }) };
SUMMON.hakase = { need: 6, boss: true, desc: '必殺: 謎の気体で敵ぜんぶに3ダメージ＋コイン +30', run: (st, ev) => { alive(st).forEach((e) => hit(st, e, 3, ev, 'ally')); st.coins += 30; } };
for (const id of ['kaeru', 'crown']) SUMMON[id] = { need: 6, boss: true, desc: '大必殺: 敵ぜんぶに6ダメージ＋ライフ +1', run: (st, ev) => { alive(st).forEach((e) => hit(st, e, 6, ev, 'ally')); st.lives = Math.min(MAX_LIVES, st.lives + 1); } };
export const gaugeNeed = (id) => SUMMON[id]?.need || GAUGE_NEED;
export const GAUGE_MAX = 6;
export const canSummon = (st, id) => !!SUMMON[id] && !st.over && (st.gauge || 0) >= gaugeNeed(id) && !st.summoned?.[id];
export function summon(st, id) {
  const ev = [];
  if (!canSummon(st, id)) return ev;
  st.gauge = 0;
  (st.summoned ||= {})[id] = true;
  ev.push({ t: 'summon', id });
  SUMMON[id].run(st, ev);
  if (!st.queue.length && !alive(st).length && st.mode !== 'diagnosis') {
    st.over = 'win';
    ev.push({ t: 'over', result: 'win' });
  }
  return ev;
}

// 自動プレイ（テスト・「おまかせ建設」ボタン用）
// cfg: { reserve: { マス番号: タワー }, prio: 'mix'|'beam'|'frost'|'bomb', upgrade: true/false }
//   1) 予約したマスがいちばん先。予約マスが空いていてコインが足りないときは、ほかに使わずためる
//   2) 予約のないマスに、優先タワー（mix はビーム2：こおり1 のくり返し）
//   3) 全部のマスが埋まったら、安い強化から（upgrade:false なら強化しない）
export const AUTO_ORDER = [1, 4, 2, 0, 5, 3];
export const AUTO_PRIO = ['mix', 'beam', 'frost', 'bomb'];
export function autoSpend(st, cfg = {}) {
  const reserve = cfg.reserve || {};
  const prio = cfg.prio || 'mix';
  let did = false;
  for (;;) {
    const resv = AUTO_ORDER.find((i) => !st.slots[i] && TOWERS[reserve[i]]);
    if (resv !== undefined) {
      if (build(st, resv, reserve[resv])) { did = true; continue; }
      break; // 予約のためにコインをためる
    }
    const empty = AUTO_ORDER.find((i) => !st.slots[i]);
    if (empty !== undefined) {
      const want = prio === 'mix' ? (st.slots.filter(Boolean).length % 3 === 2 ? 'frost' : 'beam') : prio;
      // 優先タワーが買えないときは、mix ならビームで代わりに。指定したタワーはためて待つ
      const type = st.coins >= TOWERS[want].cost ? want : prio === 'mix' ? 'beam' : null;
      if (type && build(st, empty, type)) { did = true; continue; }
      break;
    }
    if (cfg.upgrade === false) break;
    const ups = st.slots.map((tw, i) => [i, upgradeCost(st, i)]).filter(([, c]) => c !== null && c <= st.coins).sort((a, b) => a[1] - b[1]);
    if (ups.length) {
      upgrade(st, ups[0][0]);
      did = true;
      continue;
    }
    break;
  }
  return did;
}
