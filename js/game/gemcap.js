// 💎の2時間あたりの上限: どの2時間をとっても、「カラー解除 約2時間ぶん」の💎までしかたまらない
//   勉強の時間 : カラー解除の時間 を、最高でも 1 : 1 にたもつため
//   上限 = 120分 × いちばん安い「解除1分あたりの💎」（交換・ごほうびガチャの期待値。入試前の値上げ・ガチャ祭りの割引もふくむ）
//   くり返しかせげる💎（ウェーブ・暗号・タイムアタック・模試・指令・2時間ボーナス・今週の計画）にかける。
//   実績・エンディングなど1回きりの💎はかけない。上限に達したときだけ表示する
//   gemWin = [{ t: ミリ秒, g: 💎 }]（直近2時間ぶん）
import { S, save } from '../core/store.js';
import { REWARD, exchangeCost, rgachaCost, RGACHA_RATES } from './reward.js';

export const CAP_MIN = 120; // 解除の分数（＝ 見る時間の幅）
const WIN_MS = CAP_MIN * 60000;

// 解除1分あたりの💎（いちばん安い買い方）
export function perMin(now = new Date()) {
  const ex = ['u15', 'u30'].map((id) => exchangeCost(id, now) / REWARD[id].min);
  const total = RGACHA_RATES.reduce((a, r) => a + r.weight, 0);
  const evMin = RGACHA_RATES.reduce((a, r) => a + (r.id === 'gem' ? 0 : REWARD[r.id].min * r.weight), 0) / total;
  const evBack = RGACHA_RATES.reduce((a, r) => a + (r.id === 'gem' ? r.gems * r.weight : 0), 0) / total;
  return Math.min(...ex, (rgachaCost(now) - evBack) / evMin);
}
export const capOf = (now = new Date()) => Math.round(CAP_MIN * perMin(now));

function win(t) {
  const s = S();
  s.gemWin = (s.gemWin || []).filter((x) => x.t > t - WIN_MS);
  return s.gemWin;
}
export const capRoom = (t = Date.now()) => Math.max(0, capOf(new Date(t)) - win(t).reduce((a, x) => a + x.g, 0));

// 上限の中で受け取れる分だけ返して、記録する。戻り値: { got, cut }
export function takeGems(g, t = Date.now()) {
  if (!(g > 0)) return { got: 0, cut: 0 };
  const got = Math.min(g, capRoom(t));
  if (got > 0) win(t).push({ t, g: got });
  save();
  return { got, cut: g - got };
}
// 上限に達したとき: あと何分で、またたまりはじめるか（いちばん古い記録が2時間をすぎるまで）
export function capWait(t = Date.now()) {
  const w = win(t);
  if (!w.length) return 0;
  return Math.max(1, Math.ceil((w[0].t + WIN_MS - t) / 60000));
}
export const capText = (cut) => `⏳ 2時間で 💎${capOf()} まで（カラー解除 約2時間ぶん）。今回は 💎${cut} 入らなかった。あと約${capWait()}分で、またたまる`;
