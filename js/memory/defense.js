// 暗号ディフェンス: 暗号室のリアルタイム版タワーディフェンス（DOM なし。テストからも動かせる）
//   時間がたつと看守（敵）が右から門へ近づいてくる。先頭の敵の暗号（4択）に正解すると撃退。
//   まちがえると、その敵がぐっと前へ進む。門まで来られたらライフ −1。最後に教科のボス（3回正解で撃破）
//   敵の数がふえるほど、出てくる間隔が短く・足が速くなる
// 間隔反復（SRS）のレベルは変えない（ゲームとしての練習）
import { CARDS, CARD, makeQuestion } from './engine.js';

export const DEF_N = 12; // ふつうの敵の数（このあとボス）
export const DEF_LIVES = 3;
export const BOSS_HP = 3;
export const SLOW_TERM = 1.6;
// 教科ごとのボス（倒すとボスカード）
export const MEM_BOSS = {
  en: { card: 'golem', name: 'ジショ・ゴーレム', emoji: '📚' },
  soc: { card: 'bushou', name: 'ブショー・ネンピョーノ', emoji: '🏯' },
  sci: { card: 'hakase', name: 'フラスコ・ハカセーノ', emoji: '🧪' },
};
const KINDS = ['👮', '💂', '🕵️', '🥷', '🤡'];

// 出題に使うカード: 見たことのあるカードを優先（なければその教科の最初のほう）
export function defensePool(M, subject) {
  const all = CARDS.filter((c) => c.subject === subject);
  const seen = all.filter((c) => M.cards?.[c.id]);
  return seen.length >= 8 ? seen : [...seen, ...all.filter((c) => !M.cards?.[c.id])].slice(0, Math.max(30, seen.length));
}

// i 番目の敵: 出てくる時刻（秒）と、門まで歩く時間（秒）
export const spawnAt = (i) => (i === 0 ? 0.5 : 0.5 + [...Array(i).keys()].reduce((a, k) => a + Math.max(2.4, 4.6 - k * 0.2), 0));
export const travelOf = (i) => Math.max(9, 15 - i * 0.5);

export function createDefense({ subject, pool, rng }) {
  // 社会・理科は説明文を読むので、出てくる間隔も歩く時間も 1.6 倍ゆっくり
  const st = { subject, slow: subject === 'en' ? 1 : SLOW_TERM, t: 0, lives: DEF_LIVES, enemies: [], next: 0, kills: 0, misses: 0, answered: 0, over: null, nextId: 1, bossSpawned: false, bossDown: false };
  st.rng = rng;
  st.pool = pool;
  return st;
}
const pickCard = (st) => st.rng.pick(st.pool);
function spawn(st, boss = false) {
  const i = st.next;
  st.enemies.push({ id: st.nextId++, boss, x: 0, speed: 1 / ((boss ? 24 : travelOf(i)) * st.slow), hp: boss ? BOSS_HP : 1, maxHp: boss ? BOSS_HP : 1, look: boss ? MEM_BOSS[st.subject].emoji : KINDS[i % KINDS.length], card: pickCard(st).id, dead: false });
}
export const aliveOf = (st) => st.enemies.filter((e) => !e.dead);
// いちばん門に近い敵（この敵の暗号に答える）
export const targetOf = (st) => aliveOf(st).sort((a, b) => b.x - a.x || a.id - b.id)[0] || null;

// dt 秒すすめる。戻り値: イベントの配列（leak: 門を突破された、spawn: 出現、boss: ボス出現）
export function tick(st, dt) {
  const ev = [];
  if (st.over) return ev;
  st.t += dt;
  while (st.next < DEF_N && st.t >= spawnAt(st.next) * st.slow) { spawn(st); st.next++; ev.push({ t: 'spawn' }); }
  if (st.next >= DEF_N && !st.bossSpawned && st.t >= spawnAt(DEF_N) * st.slow + 2) { spawn(st, true); st.bossSpawned = true; ev.push({ t: 'boss' }); }
  for (const e of aliveOf(st)) {
    e.x += e.speed * dt;
    if (e.x >= 1) {
      e.dead = true;
      e.leaked = true;
      st.lives--;
      ev.push({ t: 'leak', id: e.id, boss: e.boss });
      if (st.lives <= 0) { st.over = 'lose'; ev.push({ t: 'over', result: 'lose' }); return ev; }
    }
  }
  if (st.bossSpawned && !aliveOf(st).length) { st.over = 'win'; ev.push({ t: 'over', result: 'win' }); }
  return ev;
}

// 先頭の敵の暗号に答えた。ok: 正解か
export function answerDef(st, ok) {
  const e = targetOf(st);
  const ev = [];
  if (!e || st.over) return ev;
  st.answered++;
  if (ok) {
    e.hp--;
    ev.push({ t: 'hit', id: e.id });
    if (e.hp <= 0) {
      e.dead = true;
      st.kills++;
      if (e.boss) st.bossDown = true;
      ev.push({ t: 'kill', id: e.id, boss: e.boss });
    } else e.card = pickCard(st).id; // ボスは次の暗号へ
  } else {
    st.misses++;
    e.x = Math.min(0.97, e.x + 0.12); // まちがえると、ぐっと前へ
    ev.push({ t: 'lunge', id: e.id });
  }
  if (st.bossSpawned && !aliveOf(st).length && !st.over) { st.over = 'win'; ev.push({ t: 'over', result: 'win' }); }
  return ev;
}

// その敵の暗号（4択）。英単語は英語 → 意味、社会・理科は 説明 → 用語
export function defQuestion(st, e) {
  const card = CARD[e.card];
  return { card, q: makeQuestion(card, card.kind === 'term' ? 'j2e' : 'e2j', st.rng) };
}

// 報酬（💎）: 撃退数 ＋ ボス撃破
export const defGems = (st) => Math.max(1, Math.round(st.kills * 0.6)) + (st.bossDown ? 8 : 0);
