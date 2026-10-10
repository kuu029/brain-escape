// 並べ替えチャレンジ: 💎をかけて「流れでつなげる」（社会・理科）を10問。正解数で倍率が決まる
//   たくさん正解すると💎がふえる。まちがいが多いと、かけた💎がへる（0〜3問正解なら全部なくなる）
//   1日 CHAL_MAX 回まで（💎を集めるためだけに何十回もやらないように）。とちゅうでやめると、かけた💎はもどらない
import { S, today } from '../core/store.js';

export const CHAL_BETS = [10, 30, 50];
export const CHAL_MAX = 3;
// 正解数（10問中）→ 倍率
export const CHAL_MULT = [0, 0, 0, 0, 0.5, 0.8, 1.2, 1.5, 2, 2.5, 3];
export const chalMult = (ok) => CHAL_MULT[Math.max(0, Math.min(10, ok))];

function state() {
  const s = S();
  const c = (s.flowChal ||= { date: '', plays: 0, best: 0, log: [] });
  if (c.date !== today()) { c.date = today(); c.plays = 0; }
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
