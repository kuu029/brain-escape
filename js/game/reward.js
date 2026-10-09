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
// 交換レート（💎）。15分 ≒ 1日しっかり勉強したぶん
export const EXCHANGE = { u15: 200, u30: 380 };
// ごほうびガチャ: 1回 💎100。期待値は交換と同じくらい（約8分）、ただし当たりはずれが大きい
export const RGACHA_COST = 100;
export const RGACHA_RATES = [
  { id: 'u60', weight: 3 },
  { id: 'u30', weight: 9 },
  { id: 'u15', weight: 20 },
  { id: 'gem', weight: 68, gems: 30 }, // はずれ: 💎30 もどる
];

export function rewardState() {
  const s = S();
  if (!s.reward) s.reward = { tix: { u15: 0, u30: 0, u60: 0 }, log: [] };
  return s.reward;
}
export const rewardTickets = () => rewardState().tix;

export function exchangeReward(id) {
  const s = S();
  const cost = EXCHANGE[id];
  if (!cost || s.gems < cost) return false;
  s.gems -= cost;
  rewardState().tix[id]++;
  saveNow();
  return true;
}

// 戻り値: { kind: 'reward', id, rarity } または { kind: 'gem', gems, rarity: 1 }（💎が足りなければ null）
export function rewardGacha(rand = Math.random) {
  const s = S();
  if (s.gems < RGACHA_COST) return null;
  s.gems -= RGACHA_COST;
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

// ガチャやドロップでもらうとき
export function addReward(id, n = 1) {
  rewardState().tix[id] += n;
  save();
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
