// 並べ替えチャレンジ: 💎をかけて「流れでつなげる」（社会・理科）を10問。正解数で倍率が決まる
//   たくさん正解すると💎がふえる。まちがいが多いと、かけた💎がへる（0〜3問正解なら全部なくなる）
//   2時間ごとに CHAL_MAX 回まで（0時・2時・4時…で回数がもどる）。とちゅうでやめると、かけた💎はもどらない
import { S, today } from '../core/store.js';

export const CHAL_BETS = [10, 30, 50];
export const CHAL_MAX = 3;
// 正解数（10問中）→ 倍率
export const CHAL_MULT = [0, 0, 0, 0, 0.5, 0.8, 1.2, 1.5, 2, 2.5, 3];
export const chalMult = (ok) => CHAL_MULT[Math.max(0, Math.min(10, ok))];

export const CHAL_HOURS = 2;
// いまの2時間の区切り（例: 2030-01-05#7 = 14時〜16時）
export const chalSlot = (d = new Date()) => `${today()}#${Math.floor(d.getHours() / CHAL_HOURS)}`;
// 次に回数がもどる時刻（時）
export const chalNextHour = (d = new Date()) => (Math.floor(d.getHours() / CHAL_HOURS) + 1) * CHAL_HOURS % 24;
function state() {
  const s = S();
  const c = (s.flowChal ||= { date: '', plays: 0, best: 0, log: [] });
  const slot = chalSlot();
  if (c.date !== slot) { c.date = slot; c.plays = 0; }
  return c;
}
export const chalLeft = () => CHAL_MAX - state().plays;
export const chalBest = () => state().best || 0;

// 💎をはらって始める。はらえなければ null
export function startChal(bet) {
  const s = S();
  if (!CHAL_BETS.includes(bet) || s.gems < bet || chalLeft() <= 0) return null;
  s.gems -= bet;
  state().plays++;
  return { bet };
}
// 終わったら、正解数に応じて💎を返す。戻り値: { ok, mult, pay, net }
export function settleChal(bet, ok) {
  const mult = chalMult(ok);
  const pay = Math.round(bet * mult);
  const c = state();
  S().gems += pay;
  c.best = Math.max(c.best || 0, pay - bet);
  if (ok >= 10) c.perfect = true;
  c.log = [{ at: Date.now(), bet, ok, pay }, ...(c.log || [])].slice(0, 20);
  return { ok, mult, pay, net: pay - bet };
}
