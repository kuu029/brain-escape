// 進行と報酬（ロック判定・ウェーブ終了時の報酬・ガチャ）
import { S, unitState, cleared, save, saveNow } from '../core/store.js';
import { UNIT, GEN } from '../units/registry.js';
import { BOSS_CARD, GACHA_CARDS, SKINS } from './content.js';
import { bump } from './missions.js';

export function isUnlocked(id) {
  const u = UNIT[id];
  if (!u || u.comingSoon) return false;
  return (u.prereqs || []).every((p) => cleared(p));
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

// 復習キューから、このウェーブに出す問題を選ぶ（同じ単元を優先）
export function pickReviews(unitId, n) {
  const q = S().reviewQueue.filter((r) => GEN[r.generatorId]);
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
      if (Object.values(BOSS_CARD).every((c) => s.collection.cards[c]) && addCard('crown')) out.cards.push('crown');
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

export const GACHA_COST = 30;
export function gacha() {
  const s = S();
  if (s.gems < GACHA_COST) return null;
  s.gems -= GACHA_COST;
  const id = GACHA_CARDS[Math.floor(Math.random() * GACHA_CARDS.length)];
  const isNew = addCard(id);
  if (!isNew) s.gems += 5; // ダブりは少し返す
  save();
  return { id, isNew };
}
export function buySkin(id) {
  const s = S();
  const sk = SKINS.find((x) => x.id === id);
  if (!sk || s.collection.skins.includes(id) || s.gems < sk.cost) return false;
  s.gems -= sk.cost;
  s.collection.skins.push(id);
  s.collection.skin = id;
  save();
  return true;
}

// 訓練で道具をもらう
export function grantTool(unitId) {
  const t = UNIT[unitId]?.tool;
  const s = S();
  if (!t || s.tools.includes(t)) return null;
  s.tools.push(t);
  save();
  return t;
}
