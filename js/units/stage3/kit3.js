// 第3段階で使う小物（関数の式、√ の表記、角度の答え）
import { Frac, F, Surd, sqrtSplit } from '../../core/frac.js';
import { tnum, surdTex } from '../../core/fmt.js';
import { numAns, choice } from '../kit.js';

export { F, Frac };
// a·文字 の項（1 と -1 は数字を書かない）
export function coef(a, v) {
  a = Frac.of(a);
  if (a.isZero()) return '';
  if (a.eq(Frac.of(1))) return v;
  if (a.eq(Frac.of(-1))) return `-${v}`;
  return `${tnum(a)}${v}`;
}
// y = ax + b
export function lineRhs(a, b) {
  a = Frac.of(a); b = Frac.of(b);
  if (a.isZero()) return tnum(b);
  const head = coef(a, 'x');
  if (b.isZero()) return head;
  return `${head}${b.n < 0 ? '-' : '+'}${tnum(b.abs())}`;
}
export const lineTex = (a, b) => `y=${lineRhs(a, b)}`;
// y = ax²
export const paraTex = (a) => `y=${coef(a, 'x^{2}')}`;
// y = a/x
export function invTex(a) {
  a = Frac.of(a);
  return `y=${a.n < 0 ? '-' : ''}\\frac{${tnum(a.abs())}}{x}`;
}
// √N を簡単にした形（N は自然数）
export function rootTex(N) {
  const [k, r] = sqrtSplit(N);
  return r === 1 ? `${k}` : k === 1 ? `\\sqrt{${r}}` : `${k}\\sqrt{${r}}`;
}
export const rootSurd = (N) => { const [k, r] = sqrtSplit(N); return Surd.of(k, r); };
// 式の x に数を入れた形（検算用: 表示した式そのものに代入する）
export const subX = (rhs, x) => rhs.replace(/x/g, `(${tnum(x)})`);

// 角度の答え（°）
export const DEG = [{ key: 'v', text: '', suffix: '°' }];
export const degAns = (v, wrong = []) => numAns(DEG, { v }, { wrong: wrong.filter((w) => w.v !== v && Number.isInteger(w.v) && w.v > 0 && w.v < 3600).map((w) => ({ vals: { v: w.v }, msg: w.msg })) });
export const isSq = (n) => n >= 0 && Number.isInteger(Math.sqrt(n));
// 図で測った値と同じか（検算テスト用）
export const near = (a, b) => Math.abs(a - b) < 1e-6;
export const measured = (fn) => ({ kind: 'fn', verify: (v) => near(v.v, fn()) });

// 文の選択肢（数式ではなく日本語）。check は文字列が一致するかで確かめる
export function textChoice(rng, correct, wrongs) {
  const q = choice(rng, correct, wrongs.map((w) => (typeof w === 'string' ? { tex: w } : w)));
  q.input.text = true;
  q.answerText = correct;
  return q;
}
// 長さの選択肢（√ をふくむ）。値がちがう誤答だけ残す
export function rootChoice(rng, N, wrongNs) {
  const seen = new Set([N]);
  const ws = [];
  for (const w of wrongNs) {
    const n = typeof w === 'number' ? w : w.n;
    if (!(n > 0) || !Number.isInteger(n) || seen.has(n)) continue;
    seen.add(n);
    ws.push({ tex: rootTex(n), msg: w.msg });
  }
  return choice(rng, rootTex(N), ws, (r) => { const n = N + r.nz(-6, 6); return n > 0 && !seen.has(n) ? rootTex(n) : null; });
}
export { surdTex, tnum, sqrtSplit, Surd };
