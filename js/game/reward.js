// ごほうび: スマホのカラーフィルタ（白黒）を一定時間はずしてもらえる「解除券」
//   ・💎で交換（ローリスク）: 確実にもらえる
//   ・ごほうびガチャ（ハイリスク・ハイリターン）: はずれると💎が少し戻るだけ、当たると長い券
//   アプリは券を発行して「使った記録」を残すだけ。時間はおうちの人が測る
// reward = { tix: { u15: 枚数, u30, u60 }, log: [{ at, min, via }] }
import { S, save, saveNow } from '../core/store.js';

export const REWARD = {
  u15: { min: 15, name: '15分 解除券', emoji: '🌈', rarity: 2 },
  u30: { min: 30, name: '30分 解除券', emoji: '🌈', rarity: 3 },
  u60: { min: 60, name: '60分 解除券', emoji: '🌟', rarity: 4 },
};
// 交換レート（💎）。15分 ≒ 半日ちょっと勉強したぶん
export const EXCHANGE = { u15: 140, u30: 260 };
// ごほうびガチャ: 1回 💎70。期待値は交換より少しおトク（約7.5分）、ただし当たりはずれが大きい
export const RGACHA_COST = 70;
export const RGACHA_RATES = [
  { id: 'u60', weight: 3 },
  { id: 'u30', weight: 9 },
  { id: 'u15', weight: 20 },
  { id: 'gem', weight: 68, gems: 20 }, // はずれ: 💎20 もどる
];

export function rewardState() {
  const s = S();
  if (!s.reward) s.reward = { tix: { u15: 0, u30: 0, u60: 0 }, log: [] };
  s.reward.gtix ||= 0; // ごほうびガチャ券（ドロップ・ノーマルガチャのおまけ）
  return s.reward;
}
export const rewardTickets = () => rewardState().tix;
export const rgachaTickets = () => rewardState().gtix;

export function exchangeReward(id) {
  const s = S();
  const cost = EXCHANGE[id];
  if (!cost || s.gems < cost) return false;
  s.gems -= cost;
  rewardState().tix[id]++;
  saveNow();
  return true;
}

// 戻り値: { kind: 'reward', id, rarity } または { kind: 'gem', gems, rarity: 1 }（💎・券が足りなければ null）
// ticket: true なら💎のかわりに「ごほうびガチャ券」を1枚使う
export function rewardGacha(rand = Math.random, { ticket = false } = {}) {
  const s = S();
  const R = rewardState();
  if (ticket) {
    if (R.gtix < 1) return null;
    R.gtix--;
  } else {
    if (s.gems < RGACHA_COST) return null;
    s.gems -= RGACHA_COST;
  }
  const total = RGACHA_RATES.reduce((a, r) => a + r.weight, 0);
  let x = rand() * total;
  const hit = RGACHA_RATES.find((r) => (x -= r.weight) < 0) || RGACHA_RATES[RGACHA_RATES.length - 1];
  let out;
  if (hit.id === 'gem') {
    s.gems += hit.gems;
    out = { kind: 'gem', gems: hit.gems, rarity: 1 };
  } else {
    rewardState().tix[hit.id]++;
    out = { kind: 'reward', id: hit.id, rarity: REWARD[hit.id].rarity };
  }
  saveNow();
  return out;
}

// ガチャやドロップでもらうとき（id: u15/u30/u60、または 'gtix' = ごほうびガチャ券）
export function addReward(id, n = 1) {
  const R = rewardState();
  if (id === 'gtix') R.gtix += n;
  else R.tix[id] += n;
  save();
}

// ノーマルガチャのおまけ（1回ごと・低確率）: 15分券 1%、ごほうびガチャ券 3%
export const GACHA_BONUS = { u15: 0.01, gtix: 0.03 };
// ウェーブ勝利のドロップ: ごほうびガチャ券（練習 3%・ボス 10%）
export const RGT_DROP = { wave: 0.03, boss: 0.1 };
export function rollBonus(rand = Math.random) {
  const x = rand();
  if (x < GACHA_BONUS.u15) return 'u15';
  if (x < GACHA_BONUS.u15 + GACHA_BONUS.gtix) return 'gtix';
  return null;
}
export const BONUS_NAME = { u15: '🌈 15分 解除券', gtix: '🎫 ごほうびガチャ券' };

// まとめる・わける: 分数の合計は変わらない（15分×2 ⇄ 30分、30分×2 ⇄ 60分、15分×4 ⇄ 60分）
export const CONVERT = [
  { from: 'u15', n: 2, to: 'u30', m: 1 },
  { from: 'u30', n: 2, to: 'u60', m: 1 },
  { from: 'u15', n: 4, to: 'u60', m: 1 },
  { from: 'u60', n: 1, to: 'u30', m: 2 },
  { from: 'u30', n: 1, to: 'u15', m: 2 },
];
export function convertReward(i) {
  const c = CONVERT[i];
  const R = rewardState();
  if (!c || (R.tix[c.from] || 0) < c.n) return false;
  R.tix[c.from] -= c.n;
  R.tix[c.to] = (R.tix[c.to] || 0) + c.m;
  saveNow();
  return true;
}

// 使う: 1枚へらして記録を残す（おうちの人が見て、時間を測る）
export function useReward(id) {
  const R = rewardState();
  if (!R.tix[id]) return null;
  R.tix[id]--;
  const rec = { at: Date.now(), min: REWARD[id].min };
  R.log.unshift(rec);
  if (R.log.length > 50) R.log.length = 50;
  saveNow();
  return rec;
}
