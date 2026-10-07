// 進行と報酬（ロック判定・ウェーブ終了時の報酬・ガチャ）
import { S, unitState, cleared, save, saveNow } from '../core/store.js';
import { UNIT, GEN, SUBJECTS, unitsOf } from '../units/registry.js';
import { BOSS_CARD, GACHA_CARDS, SKINS, CARDS, GACHA_RATES } from './content.js';
import { bump } from './missions.js';

export function isUnlocked(id) {
  const u = UNIT[id];
  if (!u || u.comingSoon) return false;
  return (u.prereqs || []).every((p) => cleared(p));
}
// 次に挑む単元（下の段階から順に、開いていてまだ突破していない最初のもの）
export function nextUnit(subject) {
  const stages = SUBJECTS[subject].stages.map((x) => x.n);
  const list = unitsOf(subject).slice().sort((a, b) => stages.indexOf(a.stage) - stages.indexOf(b.stage));
  return list.find((u) => isUnlocked(u.id) && !cleared(u.id)) || null;
}
export const missingPrereqs = (id) => (UNIT[id].prereqs || []).filter((p) => !cleared(p));

// 練習ウェーブに入れるか（最初の訓練が1つ以上終わっている、または診断で合格）
export function canPractice(id) {
  const us = unitState(id);
  return Object.keys(us.lessons).length > 0 || us.diagPassed;
}
export function canBoss(id) {
  const us = unitState(id);
  return (us.trainingDone || us.diagPassed) && us.practiced > 0;
}

// 復習キューから、このウェーブに出す問題を選ぶ（同じ単元を優先・同じ教科だけ）
export function pickReviews(unitId, n, subject = UNIT[unitId]?.subject || 'math') {
  const q = S().reviewQueue.filter((r) => GEN[r.generatorId] && UNIT[r.unit]?.subject === subject);
  const same = unitId ? q.filter((r) => r.unit === unitId) : [];
  const other = q.filter((r) => r.unit !== unitId && (isUnlocked(r.unit) || cleared(r.unit)));
  return [...same, ...other].slice(0, n).map((r) => ({ generatorId: r.generatorId, seed: r.seed }));
}

function addCard(id) {
  const c = S().collection.cards;
  const isNew = !c[id];
  c[id] = (c[id] || 0) + 1;
  return isNew;
}

// ウェーブ終了。戻り値は結果画面に渡す
export function finishWave({ mode, unitId, st, asked, firstCorrect, wrongList }) {
  const s = S();
  const win = st.over === 'win';
  const out = { mode, unitId, win, asked, firstCorrect, wrongList, gems: 0, cards: [], opened: [], leaks: st.leaks, maxCombo: st.maxCombo };
  let gems = firstCorrect * 2 + (win ? 10 : 3);
  if (unitId && mode !== 'review') unitState(unitId).practiced++;
  s.stats.bestCombo = Math.max(s.stats.bestCombo, st.maxCombo);
  bump('combo', st.maxCombo);
  bump('reviewKills', st.reviewKills);
  bump('built', st.built);
  if (win) {
    s.stats.waves++;
    bump('waves');
    if (st.leaks === 0) bump('perfect');
    if (mode === 'boss') {
      const before = Object.keys(UNIT).filter((id) => isUnlocked(id));
      const us = unitState(unitId);
      const first = !us.bossCleared;
      us.bossCleared = true;
      s.stats.bosses++;
      gems += first ? 40 : 15;
      if (BOSS_CARD[unitId] && addCard(BOSS_CARD[unitId])) out.cards.push(BOSS_CARD[unitId]);
      out.opened = Object.keys(UNIT).filter((id) => isUnlocked(id) && !before.includes(id));
      // 脱獄王: 数学の全ボス撃破
      const mathBoss = Object.entries(BOSS_CARD).filter(([u]) => UNIT[u]?.subject === 'math').map(([, c]) => c);
      if (mathBoss.every((c) => s.collection.cards[c]) && addCard('crown')) out.cards.push('crown');
    } else if (Math.random() < 0.35) {
      const id = GACHA_CARDS[Math.floor(Math.random() * GACHA_CARDS.length)];
      if (addCard(id)) out.cards.push(id);
      else gems += 3;
    }
  }
  s.gems += gems;
  out.gems = gems;
  saveNow();
  return out;
}

// ---------- ガチャ（カード＋スキン。ダブりはかけらに）----------
export const GACHA_COST = 30;
export const GACHA5_COST = 140;
function rollOne(rand = Math.random) {
  const total = GACHA_RATES.reduce((a, r) => a + r.weight, 0);
  let x = rand() * total;
  const tier = GACHA_RATES.find((r) => (x -= r.weight) < 0) || GACHA_RATES[0];
  const pool = [
    ...CARDS.filter((c) => GACHA_CARDS.includes(c.id) && c.rarity === tier.rarity).map((c) => ({ kind: 'card', id: c.id })),
    ...SKINS.filter((sk) => sk.rarity === tier.rarity).map((sk) => ({ kind: 'skin', id: sk.id })),
  ];
  const item = pool[Math.floor(rand() * pool.length)];
  return { ...item, rarity: tier.rarity, dupShards: tier.shards };
}
// n 回まわす。戻り値: [{ kind, id, rarity, isNew, shards }]（宝石が足りなければ null）
export function gacha(n = 1) {
  const s = S();
  const cost = n === 5 ? GACHA5_COST : GACHA_COST * n;
  if (s.gems < cost) return null;
  s.gems -= cost;
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = rollOne();
    let isNew;
    if (r.kind === 'card') isNew = addCard(r.id);
    else {
      isNew = !s.collection.skins.includes(r.id);
      if (isNew) s.collection.skins.push(r.id);
    }
    const shards = isNew ? 0 : r.dupShards;
    s.collection.shards = (s.collection.shards || 0) + shards;
    out.push({ kind: r.kind, id: r.id, rarity: r.rarity, isNew, shards });
  }
  saveNow();
  return out;
}
// かけらでスキンと交換
export function exchangeSkin(id) {
  const s = S();
  const sk = SKINS.find((x) => x.id === id);
  if (!sk || s.collection.skins.includes(id) || (s.collection.shards || 0) < sk.shards) return false;
  s.collection.shards -= sk.shards;
  s.collection.skins.push(id);
  s.collection.skin = id;
  save();
  return true;
}
export const _rollOne = rollOne; // テスト用

// 訓練で道具をもらう
export function grantTool(unitId) {
  const t = UNIT[unitId]?.tool;
  const s = S();
  if (!t || s.tools.includes(t)) return null;
  s.tools.push(t);
  save();
  return t;
}
