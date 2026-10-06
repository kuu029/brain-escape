// 検算用：画面に出す数式テキストを「別ルート」で数値計算する小さな評価器。
// 生成器の内部計算（Frac/Poly）は使わず、表示された式そのものを読む。
// 日本の慣習どおり、「2x」のような暗黙のかけ算は × ÷ より強く結びつく。

function tokenize(src) {
  const s = src.replace(/−/g, '-');
  const re = /\\[a-zA-Z]+|\d+(?:\.\d+)?|\.\d+|[a-zA-Z]|[-+(){}^=,]|\S/g;
  return s.match(re) || [];
}

export function evalTex(src, vals = {}) {
  const t = tokenize(src);
  let i = 0;
  const peek = () => t[i];
  const next = () => t[i++];
  const expect = (x) => {
    if (t[i] !== x) throw new Error(`expected ${x} got ${t[i]} in "${src}"`);
    i++;
  };
  const startsFactor = (x) =>
    x !== undefined && (/^[\d.]/.test(x) || /^[a-zA-Z]$/.test(x) || x === '(' || x === '{' || x === '\\frac' || x === '\\sqrt');
  function expr() {
    let sign = 1;
    if (peek() === '+') next();
    else if (peek() === '-') { next(); sign = -1; }
    let v = sign * term();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      const x = term();
      v = op === '+' ? v + x : v - x;
    }
    return v;
  }
  function term() {
    let v = chunk();
    while (peek() === '\\times' || peek() === '\\div' || peek() === '\\cdot') {
      const op = next();
      const c = chunk();
      v = op === '\\div' ? v / c : v * c;
    }
    return v;
  }
  function chunk() {
    let v = factor();
    while (startsFactor(peek())) v *= factor();
    return v;
  }
  function factor() {
    let b = primary();
    if (peek() === '^') {
      next();
      let e;
      if (peek() === '{') { next(); e = expr(); expect('}'); }
      else e = Number(next());
      b = Math.pow(b, e);
    }
    return b;
  }
  function primary() {
    const x = next();
    if (x === undefined) throw new Error(`unexpected end in "${src}"`);
    if (/^[\d.]/.test(x)) return parseFloat(x);
    if (/^[a-zA-Z]$/.test(x)) {
      if (!(x in vals)) throw new Error(`unknown var ${x} in "${src}"`);
      return vals[x];
    }
    if (x === '(') { const v = expr(); expect(')'); return v; }
    if (x === '{') { const v = expr(); expect('}'); return v; }
    if (x === '\\frac') { expect('{'); const a = expr(); expect('}'); expect('{'); const b = expr(); expect('}'); return a / b; }
    if (x === '\\sqrt') { expect('{'); const a = expr(); expect('}'); if (a < 0) throw new Error('sqrt of negative'); return Math.sqrt(a); }
    throw new Error(`unexpected token ${x} in "${src}"`);
  }
  const v = expr();
  if (i !== t.length) throw new Error(`trailing tokens "${t.slice(i).join(' ')}" in "${src}"`);
  return v;
}

// "\pm" を + と - に展開
export function expandPm(src) {
  if (!src.includes('\\pm')) return [src];
  const i = src.indexOf('\\pm');
  return [...expandPm(src.slice(0, i) + '+' + src.slice(i + 3)), ...expandPm(src.slice(0, i) + '-' + src.slice(i + 3))];
}

// トップレベルのカンマで分割
export function splitTop(src, sep = ',') {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const c of src) {
    if (c === '{' || c === '(') depth++;
    if (c === '}' || c === ')') depth--;
    if (c === sep && depth === 0) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

export const close = (a, b, eps = 1e-7) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));

export function eqHolds(eqTex, vals) {
  const sides = eqTex.split('=');
  if (sides.length !== 2) throw new Error(`not an equation: ${eqTex}`);
  return close(evalTex(sides[0], vals), evalTex(sides[1], vals));
}
