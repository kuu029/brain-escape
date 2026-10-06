// 数式テキスト（自前ミニ記法）を組み立てるための小物。
import { Frac, Surd } from './frac.js';

// 数 → "-\frac{3}{4}" / "5"
export function tnum(f) {
  f = Frac.of(f);
  const a = f.abs();
  const body = a.isInt() ? `${a.n}` : `\\frac{${a.n}}{${a.d}}`;
  return (f.n < 0 ? '-' : '') + body;
}
// 負の数だけかっこで囲む → "(-3)"
export function tpar(f) {
  return Frac.of(f).n < 0 ? `(${tnum(f)})` : tnum(f);
}
// 小数で書ける数は小数で
export function tdec(f) {
  f = Frac.of(f);
  let d = f.d;
  let k = 0;
  while (d % 10 === 0) { d /= 10; k++; }
  while (d % 2 === 0) { d /= 2; k++; }
  while (d % 5 === 0) { d /= 5; k++; }
  if (d !== 1) return tnum(f);
  const s = (Math.abs(f.n) * 10 ** k / f.d).toFixed(0).padStart(k + 1, '0');
  const body = k ? `${s.slice(0, s.length - k)}.${s.slice(s.length - k)}` : s;
  return (f.n < 0 ? '-' : '') + body;
}
export function tparDec(f) {
  return Frac.of(f).n < 0 ? `(${tdec(f)})` : tdec(f);
}
// 符号つきで足し合わせ: ["-5","+3","-7"] 風
export function signed(f, first) {
  f = Frac.of(f);
  if (f.n < 0) return tnum(f);
  return (first ? '' : '+') + tnum(f);
}
// 平方根を含む数の表記
export function surdTex(s) {
  const keys = [...s.t.keys()].sort((a, b) => a - b);
  if (!keys.length) return '0';
  return keys
    .map((m, i) => {
      const c = s.t.get(m);
      const a = c.abs();
      const sign = c.n < 0 ? '-' : i === 0 ? '' : '+';
      if (m === 1) return sign + tnum(a);
      const root = `\\sqrt{${m}}`;
      const top = a.n === 1 ? root : `${a.n}${root}`;
      return sign + (a.d === 1 ? top : `\\frac{${top}}{${a.d}}`);
    })
    .join('');
}
export const surdOf = (c, n) => Surd.of(c, n);
// 連立方程式の表示
export const sys = (a, b) => `\\sys{${a}}{${b}}`;
