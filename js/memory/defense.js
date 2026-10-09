// 暗号ディフェンス: 暗号室のリアルタイム版タワーディフェンス（DOM なし。テストからも動かせる）
//   3本のレーンを、看守（敵）が右から門へ近づいてくる。何体も同時に来る。
//   ねらっている看守（タップで変えられる。ふだんは門にいちばん近い看守）の暗号（4択）に正解すると撃退。
//   まちがえると、その看守がぐっと前へ進む。門まで来られたら ❤️ −1。最後に教科のボス（3回正解で撃破）
//   正解でゲージがたまり、なかま（ウェーブのなかまと同じ）が門から出撃して、ぶつかった看守を足止め＆おしもどす
//   （たおすのは暗号に正解したときだけ。なかまは時間かせぎ）。場の看守を全滅させたら、次の組がすぐ来る（全滅ボーナス）
// 間隔反復（SRS）のレベルは変えない（ゲームとしての練習）
import { CARDS, CARD, makeQuestion } from './engine.js';
import { CARDS as GAME_CARDS } from '../game/content.js';
import { gaugeNeed } from '../game/engine.js';

export const DEF_N = 15; // ふつうの敵の数（このあとボス）
export const LANES = 3;
export const DEF_LIVES = 3;
export const BOSS_HP = 3;
export const SLOW_TERM = 1.6;
// 教科ごとのボス（倒すとボスカード）
export const MEM_BOSS = {
  en: { card: 'golem', name: 'ジショ・ゴーレム', emoji: '📚' },
  soc: { card: 'bushou', name: 'ブショー・ネンピョーノ', emoji: '🏯' },
  sci: { card: 'hakase', name: 'フラスコ・ハカセーノ', emoji: '🧪' },
};
export const MOB_KINDS = ['grunt', 'runner', 'tank', 'review'];

// 出題に使うカード: 見たことのあるカード。少なければ、まだのカードも足して40枚以上に（同じ問題ばかりにならないように）
export function defensePool(M, subject) {
  const all = CARDS.filter((c) => c.subject === subject);
  const seen = all.filter((c) => M.cards?.[c.id]);
  return seen.length >= 40 ? seen : [...seen, ...all.filter((c) => !M.cards?.[c.id]).slice(0, 40 - seen.length)];
}

// 出てくる組（1〜3体いっしょ）: 時刻（秒）と人数。だんだん人数が多く、間隔が短く
export function waveGroups() {
  const out = [];
  let t = 0.5, n = 0, i = 0;
  while (n < DEF_N) {
    const size = Math.min(DEF_N - n, i < 2 ? 1 : i < 5 ? 2 : 3 - (i % 2));
    out.push({ t, size });
    n += size;
    t += Math.max(5.5, 9 - i * 0.45) * (size >= 3 ? 1.35 : size >= 2 ? 1.2 : 1);
    i++;
  }
  return out;
}
export const travelOf = (i) => Math.max(14, 21 - i * 0.4);

export function createDefense({ subject, pool, rng, party = [] }) {
  // 社会・理科は説明文を読むので、出てくる間隔も歩く時間も 1.6 倍ゆっくり
  const st = {
    subject, slow: subject === 'en' ? 1 : SLOW_TERM, t: 0, lives: DEF_LIVES, enemies: [], allies: [], groups: waveGroups(), g: 0, spawned: 0,
    kills: 0, misses: 0, answered: 0, clears: 0, shift: 0, over: null, nextId: 1, bossSpawned: false, bossDown: false, sel: null,
    gauge: 0, party: party.filter((id) => GAME_CARDS.some((c) => c.id === id)), used: {},
  };
  st.rng = rng;
  st.pool = pool;
  st.deck = [];
  return st;
}
// 山札から1枚（使い切るまで同じカードは出ない。いま場にいる看守のカードもさける）
function drawCard(st) {
  const onField = new Set(aliveOf(st).map((e) => e.card));
  for (let k = 0; k < 2; k++) {
    if (!st.deck.length) st.deck = st.rng.shuffle(st.pool.map((c) => c.id));
    const i = st.deck.findIndex((id) => !onField.has(id));
    if (i >= 0) return st.deck.splice(i, 1)[0];
    st.deck = [];
  }
  return st.rng.pick(st.pool).id;
}
// 英単語は「英語 → 意味」と「意味 → 英語」をまぜる。社会・理科は「説明 → 用語」
const pickForm = (st, cardId) => (CARD[cardId].kind === 'term' ? 'j2e' : st.rng.chance(0.5) ? 'e2j' : 'j2e');
function spawn(st, lane, boss = false) {
  const i = st.spawned;
  const card = drawCard(st);
  st.enemies.push({
    id: st.nextId++, boss, lane, x: 0, speed: 1 / ((boss ? 26 : travelOf(i)) * st.slow), hp: boss ? BOSS_HP : 1, maxHp: boss ? BOSS_HP : 1,
    kind: boss ? 'boss' : MOB_KINDS[i % MOB_KINDS.length], card, form: pickForm(st, card), dead: false,
  });
  if (!boss) st.spawned++;
}
export const aliveOf = (st) => st.enemies.filter((e) => !e.dead);
// ねらう看守: えらんだ看守がいればそれ、いなければ門にいちばん近い看守
export function targetOf(st) {
  const a = aliveOf(st);
  return a.find((e) => e.id === st.sel) || a.sort((p, q) => q.x - p.x || p.id - q.id)[0] || null;
}
export function selectTarget(st, id) {
  if (aliveOf(st).some((e) => e.id === id)) st.sel = id;
}

// なかま: ぶつかった看守を、おしもどして、しばらく止める（たおさない）
//   ★1・2 は1体、★3 は2体、★4・ボスカードは3体まで。レアなほど、遠くへ・長く。ボスは半分だけ
export const allyHits = (id) => { const c = GAME_CARDS.find((x) => x.id === id); return !c ? 1 : c.rarity >= 4 ? 3 : c.rarity === 3 ? 2 : 1; };
export const allyPower = (id) => { const n = allyHits(id); return { hits: n, knock: [0, 0.25, 0.32, 0.4][n], stun: [0, 4, 5.5, 7][n] }; };
export const CLEAR_GAUGE = 1; // 全滅ボーナス: ゲージ +1（と、💎 +1）
export const allyNeed = (id) => gaugeNeed(id);
// たおさないかわりに、ゲージがたまるたびに何回でも出撃できる
export const canDeploy = (st, id) => !st.over && st.party.includes(id) && st.gauge >= allyNeed(id);
export function deployAlly(st, id) {
  if (!canDeploy(st, id)) return null;
  st.gauge = 0;
  st.used[id] = (st.used[id] || 0) + 1;
  // いちばん門に近い看守のいるレーンへ
  const f = aliveOf(st).sort((p, q) => q.x - p.x)[0];
  const p = allyPower(id);
  const a = { id, key: st.nextId++, lane: f ? f.lane : 1, x: 1, hits: p.hits, knock: p.knock, stun: p.stun, done: [], dead: false };
  st.allies.push(a);
  return a;
}

// dt 秒すすめる。戻り値: イベントの配列
export function tick(st, dt) {
  const ev = [];
  if (st.over) return ev;
  st.t += dt;
  // 場に看守がいないときは待たせない（次の組・ボスを、すぐ出す）
  const last = st.groups[st.groups.length - 1];
  if (!aliveOf(st).length && !st.bossSpawned) {
    const next = st.g < st.groups.length ? st.groups[st.g].t * st.slow : last.t * st.slow + 5;
    const wait = next - (st.t + st.shift);
    if (wait > 0.6) st.shift += wait - 0.6;
  }
  const now = st.t + st.shift;
  while (st.g < st.groups.length && now >= st.groups[st.g].t * st.slow) {
    for (const l of st.rng.shuffle([0, 1, 2]).slice(0, st.groups[st.g].size)) spawn(st, l);
    st.g++;
    ev.push({ t: 'spawn' });
  }
  if (st.g >= st.groups.length && !st.bossSpawned && now >= last.t * st.slow + 5) { spawn(st, 1, true); st.bossSpawned = true; ev.push({ t: 'boss' }); }
  // なかまは門（左）から右へ走って、同じレーンの看守にぶつかる → おしもどして、しばらく止める
  for (const a of st.allies.filter((x) => !x.dead)) {
    a.x -= dt / 3;
    for (const e of aliveOf(st).filter((x) => x.lane === a.lane && x.x >= a.x - 0.04 && !a.done.includes(x.id))) {
      if (a.hits <= 0) break;
      a.hits--;
      a.done.push(e.id);
      const k = e.boss ? 0.5 : 1;
      e.x = Math.max(0, e.x - a.knock * k);
      e.stun = Math.max(e.stun || 0, a.stun * k);
      ev.push({ t: 'ally-hit', id: e.id, ally: a.key });
    }
    if (a.hits <= 0 || a.x <= 0) a.dead = true;
  }
  for (const e of aliveOf(st)) {
    if (e.stun > 0) { e.stun = Math.max(0, e.stun - dt); continue; }
    e.x += e.speed * dt;
    if (e.x >= 1) {
      e.dead = true;
      e.leaked = true;
      st.lives--;
      if (st.sel === e.id) st.sel = null;
      ev.push({ t: 'leak', id: e.id, boss: e.boss });
      if (st.lives <= 0) { st.over = 'lose'; ev.push({ t: 'over', result: 'lose' }); return ev; }
    }
  }
  checkWin(st, ev);
  return ev;
}
function kill(st, e, ev) {
  e.dead = true;
  st.kills++;
  if (e.boss) st.bossDown = true;
  if (st.sel === e.id) st.sel = null;
  ev.push({ t: 'kill', id: e.id, boss: e.boss });
  // 全滅ボーナス: 場の看守をぜんぶ撃退したら（まだ次が来るとき）
  if (!e.boss && !aliveOf(st).length && !st.bossSpawned) {
    st.clears++;
    st.gauge = Math.min(6, st.gauge + CLEAR_GAUGE);
    ev.push({ t: 'clear' });
  }
}
function checkWin(st, ev) {
  if (st.bossSpawned && !aliveOf(st).length && !st.over) { st.over = 'win'; ev.push({ t: 'over', result: 'win' }); }
}

// ねらっている看守の暗号に答えた。ok: 正解か
export function answerDef(st, ok) {
  const e = targetOf(st);
  const ev = [];
  if (!e || st.over) return ev;
  st.answered++;
  if (ok) {
    st.gauge = Math.min(6, st.gauge + 1);
    e.hp--;
    ev.push({ t: 'hit', id: e.id });
    if (e.hp <= 0) kill(st, e, ev);
    else { e.card = drawCard(st); e.form = pickForm(st, e.card); } // ボスは次の暗号へ
  } else {
    st.misses++;
    e.x = Math.min(0.97, e.x + 0.12); // まちがえると、ぐっと前へ
    ev.push({ t: 'lunge', id: e.id });
  }
  checkWin(st, ev);
  return ev;
}

// その看守の暗号（4択）
export function defQuestion(st, e) {
  const card = CARD[e.card];
  return { card, q: makeQuestion(card, e.form, st.rng) };
}

// 報酬（💎）: 撃退数 ＋ ボス撃破 ＋ 全滅ボーナスの回数
export const defGems = (st) => Math.max(1, Math.round(st.kills * 0.6)) + (st.bossDown ? 8 : 0) + st.clears;
