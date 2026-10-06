// 多項式（係数は分数）。式の計算・展開・因数分解の「正解」をここで計算する。
import { Frac, lcm } from './frac.js';

const keyOf = (e) =>
  Object.keys(e)
    .filter((v) => e[v])
    .sort()
    .map((v) => v + e[v])
    .join('');

export class Poly {
  constructor() {
    this.t = new Map(); // key -> { e: {x:2}, c: Frac }
  }
  static c(x) {
    const p = new Poly();
    p._add({}, Frac.of(x));
    return p;
  }
  static v(name, coef = 1, exp = 1) {
    const p = new Poly();
    p._add({ [name]: exp }, Frac.of(coef));
    return p;
  }
  // a*v + b
  static lin(a, b, v = 'x') {
    return Poly.v(v, a).add(Poly.c(b));
  }
  // 項のリスト [[係数, {x:1,y:1}], ...]
  static of(terms) {
    const p = new Poly();
    for (const [c, e] of terms) p._add(e || {}, Frac.of(c));
    return p;
  }
  _add(e, c) {
    if (c.isZero()) return;
    const clean = {};
    for (const v of Object.keys(e)) if (e[v]) clean[v] = e[v];
    const k = keyOf(clean);
    const cur = this.t.get(k);
    const nc = cur ? cur.c.add(c) : c;
    if (nc.isZero()) this.t.delete(k);
    else this.t.set(k, { e: clean, c: nc });
  }
  clone() { const p = new Poly(); for (const [k, v] of this.t) p.t.set(k, v); return p; }
  add(o) { o = toPoly(o); const p = this.clone(); for (const { e, c } of o.t.values()) p._add(e, c); return p; }
  neg() { return this.scale(-1); }
  sub(o) { return this.add(toPoly(o).neg()); }
  scale(k) { const p = new Poly(); for (const { e, c } of this.t.values()) p._add(e, c.mul(k)); return p; }
  mul(o) {
    o = toPoly(o);
    const p = new Poly();
    for (const a of this.t.values()) {
      for (const b of o.t.values()) {
        const e = { ...a.e };
        for (const v of Object.keys(b.e)) e[v] = (e[v] || 0) + b.e[v];
        p._add(e, a.c.mul(b.c));
      }
    }
    return p;
  }
  pow(n) { let p = Poly.c(1); for (let i = 0; i < n; i++) p = p.mul(this); return p; }
  eq(o) { return this.sub(o).t.size === 0; }
  isZero() { return this.t.size === 0; }
  coef(e = {}) { const v = this.t.get(keyOf(e)); return v ? v.c : new Frac(0); }
  vars() { const s = new Set(); for (const { e } of this.t.values()) Object.keys(e).forEach((v) => s.add(v)); return [...s].sort(); }
  degree() { let d = 0; for (const { e } of this.t.values()) d = Math.max(d, Object.values(e).reduce((a, b) => a + b, 0)); return d; }
  denLcm() { let d = 1; for (const { c } of this.t.values()) d = lcm(d, c.d); return d; }
  evaluate(vals) {
    let s = new Frac(0);
    for (const { e, c } of this.t.values()) {
      let term = c;
      for (const v of Object.keys(e)) term = term.mul(Frac.of(vals[v]).pow(e[v]));
      s = s.add(term);
    }
    return s;
  }
  terms() {
    const vars = this.vars();
    const deg = (e) => Object.values(e).reduce((a, b) => a + b, 0);
    return [...this.t.values()].sort((a, b) => {
      const d = deg(b.e) - deg(a.e);
      if (d) return d;
      for (const v of vars) {
        const x = (b.e[v] || 0) - (a.e[v] || 0);
        if (x) return x;
      }
      return 0;
    });
  }
  toTex() {
    const ts = this.terms();
    if (!ts.length) return '0';
    return ts.map((t, i) => termTex(t.c, t.e, i === 0)).join('');
  }
}

function toPoly(o) {
  return o instanceof Poly ? o : Poly.c(o);
}

export function monoTex(e) {
  return Object.keys(e)
    .filter((v) => e[v])
    .sort()
    .map((v) => (e[v] === 1 ? v : `${v}^{${e[v]}}`))
    .join('');
}

export function termTex(c, e, first) {
  const mono = monoTex(e);
  const a = c.abs();
  let body;
  if (!mono) body = a.isInt() ? `${a.n}` : `\\frac{${a.n}}{${a.d}}`;
  else if (a.eq(1)) body = mono;
  else if (a.isInt()) body = `${a.n}${mono}`;
  else body = `\\frac{${a.n}}{${a.d}}${mono}`;
  return (c.n < 0 ? '-' : first ? '' : '+') + body;
}

// 分数係数の多項式を「\frac{整数係数の式}{分母}」の形で書く
export function fracPolyTex(p) {
  const D = p.denLcm();
  if (D === 1) return p.toTex();
  return `\\frac{${p.scale(D).toTex()}}{${D}}`;
}
