// 理科の問題オブジェクトを組み立てる道具
//   計算問題は数値入力（小数OK）。verify は「その値が正解か」を、問題を作った式とは別の形で確かめる関数（テスト用）
import { numAns, m } from '../kit.js';
import { F } from '../../core/frac.js';
import { tdec } from '../../core/fmt.js';
import { textChoice } from '../english/kit-en.js';

export { m, textChoice };
export { chart } from '../stage3/fig.js';
export const near = (a, b) => Math.abs(a - b) < 1e-6;
// 小数 → Frac（小数第3位まで）。3.0000000004 のような誤差を消す
export const D = (x) => F(Math.round(x * 1000), 1000);
export const dec = (x) => tdec(D(x)); // 表示用の小数
export const round2 = (x) => Math.round(x * 1000) / 1000;

// 数値入力の問題。unit は答えのあとにつく単位（「g/cm³」など）
export function sciNum({ stem, v, unit = '', label = '', wrongs = [], hint, steps, verify, fig }) {
  const fv = D(v);
  const ws = [];
  for (const w of wrongs) {
    if (!w || !Number.isFinite(w.v) || w.v <= 0 || near(w.v, v) || ws.some((x) => near(x.v, w.v))) continue;
    ws.push(w);
  }
  const q = numAns([{ key: 'v', text: label, suffix: unit ? ` ${unit}` : '' }], { v: fv }, { wrong: ws.map((w) => ({ vals: { v: D(w.v) }, msg: w.msg })) });
  q.answerText = `${label ? `${label} ` : ''}${m(dec(v))}${unit ? ` ${unit}` : ''}`;
  return { stem, ...(fig ? { fig } : {}), ...q, hint, steps, check: { kind: 'fn', verify: (x) => verify(x.v) } };
}

// 選択式（文字）。verify は「その選択肢が正解か」を別の方法で確かめる関数
export function sciChoice(rng, { stem, correct, wrongs, hint, steps, verify, fig, n = 4 }) {
  return {
    stem,
    ...(fig ? { fig } : {}),
    ...textChoice(rng, correct, wrongs.map((w) => (typeof w === 'string' ? { t: w } : w)), n),
    hint,
    steps,
    check: { kind: 'fn', verify },
  };
}

// 表（<table class="ftable">）
export const table = (head, rows) => `<table class="ftable"><tr>${head.map((x) => `<th>${x}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((x, i) => (i ? `<td>${x}</td>` : `<th>${x}</th>`)).join('')}</tr>`).join('')}</table>`;
