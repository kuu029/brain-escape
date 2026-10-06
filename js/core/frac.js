// 分数の厳密計算と、平方根を含む数（a + b√m + ...）の計算。
export const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

export class Frac {
  constructor(n, d = 1) {
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) throw new Error(`bad frac ${n}/${d}`);
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1;
    this.n = n / g + 0; // +0 で -0 を消す
    this.d = d / g;
  }
  static of(x) {
    return x instanceof Frac ? x : new Frac(x, 1);
  }
  add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { o = Frac.of(o); return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  abs() { return new Frac(Math.abs(this.n), this.d); }
  inv() { return new Frac(this.d, this.n); }
  pow(k) { let r = new Frac(1); for (let i = 0; i < k; i++) r = r.mul(this); return r; }
  eq(o) { o = Frac.of(o); return this.n === o.n && this.d === o.d; }
  lt(o) { o = Frac.of(o); return this.n * o.d < o.n * this.d; }
  isInt() { return this.d === 1; }
  isZero() { return this.n === 0; }
  sign() { return Math.sign(this.n); }
  num() { return this.n / this.d; }
  toString() { return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`; }

  // ユーザー入力（テンキー）を読む。"-3/4" "0.25" "-7" など。
  // unreduced: 約分できる分数や "6/1" のような書き方なら true
  static parse(raw) {
    const s = String(raw ?? '').replace(/[−ー－‐]/g, '-').replace(/\s/g, '');
    let m = s.match(/^(-?)(\d+)\/(\d+)$/);
    if (m) {
      const n = Number(m[2]);
      const d = Number(m[3]);
      if (d === 0) return null;
      return { value: new Frac((m[1] ? -1 : 1) * n, d), unreduced: gcd(n, d) !== 1 || d === 1 };
    }
    m = s.match(/^(-?)(\d*)(?:\.(\d+))?$/);
    if (m && (m[2] || m[3])) {
      const dec = m[3] || '';
      const n = Number((m[2] || '0') + dec);
      const d = 10 ** dec.length;
      return { value: new Frac((m[1] ? -1 : 1) * n, d), unreduced: false };
    }
    return null;
  }
}
export const F = (n, d = 1) => new Frac(n, d);

// n = k^2 * m（m は平方因数なし）
export function sqrtSplit(n) {
  let k = 1;
  let m = n;
  for (let p = 2; p * p <= m; p++) {
    while (m % (p * p) === 0) {
      m /= p * p;
      k *= p;
    }
  }
  return [k, m];
}
export const isSquare = (n) => n >= 0 && Number.isInteger(Math.sqrt(n));

// Σ c_m √m（m は平方因数なし、m=1 は有理数部分）
export class Surd {
  constructor() {
    this.t = new Map();
  }
  static of(c, n = 1) {
    const s = new Surd();
    if (n === 0) return s;
    const [k, m] = sqrtSplit(n);
    s._add(m, Frac.of(c).mul(k));
    return s;
  }
  _add(m, c) {
    const v = (this.t.get(m) || new Frac(0)).add(c);
    if (v.isZero()) this.t.delete(m);
    else this.t.set(m, v);
  }
  clone() { const s = new Surd(); for (const [m, c] of this.t) s.t.set(m, c); return s; }
  add(o) { const s = this.clone(); for (const [m, c] of o.t) s._add(m, c); return s; }
  neg() { const s = new Surd(); for (const [m, c] of this.t) s.t.set(m, c.neg()); return s; }
  sub(o) { return this.add(o.neg()); }
  scale(f) { const s = new Surd(); for (const [m, c] of this.t) s._add(m, c.mul(f)); return s; }
  mul(o) {
    const s = new Surd();
    for (const [m1, c1] of this.t) {
      for (const [m2, c2] of o.t) {
        const [k, m] = sqrtSplit(m1 * m2);
        s._add(m, c1.mul(c2).mul(k));
      }
    }
    return s;
  }
  eq(o) { return this.sub(o).t.size === 0; }
  isZero() { return this.t.size === 0; }
  isRational() { return [...this.t.keys()].every((m) => m === 1); }
  num() { let v = 0; for (const [m, c] of this.t) v += c.num() * Math.sqrt(m); return v; }
}
