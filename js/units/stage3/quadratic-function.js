import { numAns, choice, m } from '../kit.js';
import { F, Frac, tnum, coef, lineTex, paraTex, subX } from './kit3.js';
import { plane } from './fig.js';

const par = (v) => (Frac.of(v).n < 0 ? `(${tnum(v)})` : tnum(v));
const pickA = (rng) => (rng.chance(0.75) ? F(rng.pick([1, 2, 3, -1, -2, -3])) : F(rng.pick([1, -1]), rng.pick([2, 3, 4])));
const rhsOf = (a) => coef(a, 'x^{2}');

function genFind(rng) {
  const a = pickA(rng);
  let p;
  do p = rng.nz(-4, 4) * (a.d === 4 ? 2 : 1); while (!a.mul(p * p).isInt() && a.d !== 2);
  const q = a.mul(p * p);
  return {
    stem: `${m('y')} は ${m('x')} の2乗に比例し、${m(`x=${p}`)} のとき ${m(`y=${tnum(q)}`)} です。比例定数 ${m('a')} は？`,
    ...numAns([['a', 'a']], { a }, { wrong: [
      { vals: { a: q.div(p) }, msg: '2乗に比例 → $y=ax^{2}$。$x$ は2乗してから！' },
      { vals: { a: F(p * p).div(q) }, msg: '$a=\\frac{y}{x^{2}}$。上下が逆！' },
    ] }),
    hint: '$y=ax^{2}$ に代入して $a$ を求める。',
    steps: [`${m(`${tnum(q)}=a\\times ${par(p)}^{2}`)}`, `${m(`${tnum(q)}=${p * p}a`)} → ${m(`a=${tnum(a)}`)}`],
    check: { kind: 'fn', verify: (v) => Math.abs(v.a * p * p - q.num()) < 1e-9 },
  };
}

function genValue(rng) {
  const a = pickA(rng);
  const p = rng.nz(-5, 5) * a.d;
  const rhs = rhsOf(a);
  return {
    stem: `関数 ${m(paraTex(a))} で、${m(`x=${p}`)} のときの ${m('y')} の値は？`,
    ...numAns([['y', 'y']], { y: a.mul(p * p) }, { wrong: [
      { vals: { y: a.mul(p * p).neg() }, msg: `${m(`${par(p)}^{2}`)} はプラス！` },
      { vals: { y: a.mul(2 * p) }, msg: '2乗は「2倍」じゃない。同じ数を2回かける。' },
    ] }),
    hint: '$x$ に代入。負の数はかっこをつけて2乗。',
    steps: [`${m(`y=${tnum(a)}\\times ${par(p)}^{2}=${tnum(a.mul(p * p))}`)}`],
    check: { kind: 'value', expr: subX(rhs, p) },
  };
}

function genRange(rng) {
  const q0 = rangeQ(rng);
  q0.answerText = m(`${tnum(q0.answer.lo)}\\le y\\le ${tnum(q0.answer.hi)}`);
  return q0;
}
function rangeQ(rng) {
  const a = F(rng.pick([1, 2, 3, -1, -2, -1]), rng.chance(0.25) ? 2 : 1);
  let p, q;
  do { p = rng.int(-4, 2); q = rng.int(-1, 4); } while (q <= p || (a.d === 2 && (p % 2 || q % 2)));
  const vs = [a.mul(p * p), a.mul(q * q)];
  const has0 = p <= 0 && q >= 0;
  const all = has0 ? [...vs, F(0)] : vs;
  const lo = all.reduce((x, y) => (y.lt(x) ? y : x)), hi = all.reduce((x, y) => (x.lt(y) ? y : x));
  const naiveLo = vs[0].lt(vs[1]) ? vs[0] : vs[1], naiveHi = vs[0].lt(vs[1]) ? vs[1] : vs[0];
  return {
    stem: `${m(paraTex(a))} で ${m('x')} の変域が ${m(`${p}\\le x\\le ${q}`)} のとき、${m('y')} の変域は？`,
    fig: plane({ x: [-5, 5], y: a.n > 0 ? [-1, 9] : [-9, 1], fns: [{ f: (x) => a.num() * x * x, dom: [p, q] }, { f: (x) => a.num() * x * x, dash: true }], grid: true }),
    ...numAns([{ key: 'lo', text: '', suffix: '≦ y ≦' }, { key: 'hi', text: '' }], { lo, hi }, { wrong: [
      has0 && { vals: { lo: naiveLo, hi: naiveHi }, msg: `${m('x')} の変域に 0 がふくまれる！ グラフの頂点（${m('y=0')}）を通るので、${a.n > 0 ? '最小' : '最大'}は 0。` },
    ] }),
    hint: 'グラフをかいて考える。$x$ の変域に 0 がふくまれるときは、$y=0$ が最小（$a<0$ なら最大）。',
    steps: [`${m(`x=${p}`)} のとき ${m(`y=${tnum(vs[0])}`)}、${m(`x=${q}`)} のとき ${m(`y=${tnum(vs[1])}`)}`, has0 ? `0 をふくむので ${m('y=0')} も通る` : '0 はふくまない', `${m(`${tnum(lo)}\\le y\\le ${tnum(hi)}`)}`],
    // 区間を細かく調べて最小・最大を確かめる
    check: { kind: 'fn', verify: (v) => { let mn = Infinity, mx = -Infinity; for (let i = 0; i <= 2000; i++) { const x = p + ((q - p) * i) / 2000; const y = a.num() * x * x; mn = Math.min(mn, y); mx = Math.max(mx, y); } return Math.abs(v.lo - mn) < 0.01 && Math.abs(v.hi - mx) < 0.01; } },
  };
}

function genRate(rng) {
  const a = pickA(rng);
  let p, q;
  do { p = rng.int(-4, 3) * a.d; q = rng.int(-3, 5) * a.d; } while (q <= p || p + q === 0);
  const rhs = rhsOf(a);
  const ans = a.mul(p + q);
  return {
    stem: `${m(paraTex(a))} で、${m('x')} が ${m(p)} から ${m(q)} まで増加するときの変化の割合は？`,
    ...numAns([['v', '変化の割合']], { v: ans }, { wrong: [
      { vals: { v: a }, msg: '$y=ax^{2}$ の変化の割合は一定じゃない！ $\\frac{y の増加量}{x の増加量}$ を計算。' },
      { vals: { v: a.mul(q * q - p * p) }, msg: 'それは $y$ の増加量。$x$ の増加量でわる。' },
    ] }),
    hint: '変化の割合 = $\\frac{y の増加量}{x の増加量}$。（近道: $a\\times (p+q)$）',
    steps: [`${m('y')} の増加量 ${m(`${tnum(a.mul(q * q))}-${par(a.mul(p * p))}=${tnum(a.mul(q * q - p * p))}`)}`, `${m(`\\frac{${tnum(a.mul(q * q - p * p))}}{${q - p}}=${tnum(ans)}`)}`],
    check: { kind: 'value', expr: `\\frac{(${subX(rhs, q)})-(${subX(rhs, p)})}{${q}-${par(p)}}` },
  };
}

function genGraph(rng) {
  const a = F(rng.pick([1, 2, -1, -2, 1, -1]), rng.chance(0.4) ? 2 : 1);
  const p = a.d === 2 ? 2 : rng.pick([1, 2]);
  const q = a.mul(p * p);
  if (Math.abs(q.num()) > 8) return genGraph(rng);
  const fig = plane({ x: [-4, 4], y: a.n > 0 ? [-1, 8] : [-8, 1], fns: [{ f: (x) => a.num() * x * x }], pts: [{ p: [p, q.num()], label: `(${p}, ${tnum(q)})`, dy: a.n > 0 ? 14 : -6 }] });
  return {
    stem: 'グラフが図の放物線になる式は？',
    fig,
    ...choice(rng, paraTex(a), [
      { tex: paraTex(a.neg()), msg: '上に開いていれば $a>0$、下に開いていれば $a<0$。' },
      { tex: paraTex(q.div(p)), msg: '$a=\\frac{y}{x^{2}}$。$x$ を2乗してからわる。' },
      { tex: `y=${coef(q.div(p), 'x')}`, msg: '放物線は $y=ax^{2}$。' },
      { tex: paraTex(F(p * p).div(q)), msg: '$a=\\frac{y}{x^{2}}$。上下が逆！' },
    ]),
    hint: `点 ${m(`(${p},\\ ${tnum(q)})`)} を ${m('y=ax^{2}')} に代入。`,
    steps: [`${m(`${tnum(q)}=a\\times ${p}^{2}`)} → ${m(`a=${tnum(a)}`)}`],
    check: { kind: 'graph', pts: [[p, q.num()], [-p, q.num()], [2 * p, a.mul(4 * p * p).num()]] },
  };
}

function genCross(rng) {
  const a = F(rng.pick([1, 2, -1, 1]), rng.chance(0.4) ? 2 : 1);
  let p, q;
  do { p = rng.int(-4, -1); q = rng.int(1, 4); } while ((a.d === 2 && (p % 2 || q % 2)) || p + q === 0);
  const P = [p, a.mul(p * p)], Q = [q, a.mul(q * q)];
  // 直線 AB: 傾き a(p+q)、切片 -apq
  const k = a.mul(p + q), b = a.mul(p * q).neg();
  return {
    stem: `関数 ${m(paraTex(a))} のグラフ上に、${m('x')} 座標が ${m(p)}、${m(q)} の点 A、B がある。直線 AB の式は？`,
    fig: plane({ x: [-5, 5], y: a.n > 0 ? [-2, Math.min(17, Math.max(P[1].num(), Q[1].num()) + 1)] : [Math.max(-17, Math.min(P[1].num(), Q[1].num()) - 1), 2], fns: [{ f: (x) => a.num() * x * x }, { f: (x) => k.num() * x + b.num(), dash: true }], pts: [{ p: [p, P[1].num()], label: 'A' }, { p: [q, Q[1].num()], label: 'B' }] }, { w: 240, h: 220 }),
    ...choice(rng, lineTex(k, b), [
      { tex: lineTex(k, b.neg()), msg: '切片を代入で確かめよう。' },
      { tex: lineTex(k.neg(), b), msg: '傾きの符号を確認。' },
      { tex: lineTex(a.mul(q - p), b), msg: '傾きは $\\frac{y の増加量}{x の増加量}$。' },
    ]),
    hint: 'まず A、B の $y$ 座標を求めて、2点を通る直線の式を出す。',
    steps: [`A ${m(`(${p},\\ ${tnum(P[1])})`)}、B ${m(`(${q},\\ ${tnum(Q[1])})`)}`, `傾き ${m(`\\frac{${tnum(Q[1])}-${par(P[1])}}{${q}-${par(p)}}=${tnum(k)}`)}`, `${m(lineTex(k, b))}`],
    check: { kind: 'graph', pts: [[p, P[1].num()], [q, Q[1].num()]] },
  };
}

export default {
  id: 'quadratic-function',
  stage: 3,
  area: 'サーチライト',
  title: '関数 y=ax²',
  emoji: '🔦',
  prereqs: ['linear-function', 'quadratic'],
  tool: 'mega',
  hintCard: [
    '$y$ が $x$ の2乗に比例 → $y=ax^{2}$。グラフは原点を頂点とする放物線',
    '$a>0$ なら上に開く、$a<0$ なら下に開く',
    '変域: $x$ の変域に 0 をふくむと $y=0$ が最小（または最大）',
    '変化の割合 = $\\frac{y の増加量}{x の増加量}$（一定ではない）',
  ],
  generators: {
    'qf-find': { difficulty: 1, gen: genFind },
    'qf-value': { difficulty: 1, gen: genValue },
    'qf-range': { difficulty: 2, gen: genRange },
    'qf-rate': { difficulty: 2, gen: genRate },
    'qf-graph': { difficulty: 2, gen: genGraph },
    'qf-cross': { difficulty: 3, gen: genCross },
  },
  lessons: [
    {
      id: 'qf-l1',
      title: '$y=ax^{2}$ の式',
      unlocks: ['qf-find', 'qf-value'],
      build(rng) {
        const a = rng.pick([2, 3]), p = rng.pick([2, 3]), r = rng.pick([-2, -3, 4]);
        return [
          { text: `${m('y=ax^{2}')} のとき「${m('y')} は ${m('x')} の2乗に比例する」という。${m('x')} が2倍になると ${m('y')} は4倍。`, math: 'y=ax^{2}' },
          { text: `${m(`x=${p}`)} のとき ${m(`y=${a * p * p}`)}。${m(`${a * p * p}=a\\times ${p}^{2}`)}。${m('a')} は？`, q: { ...numAns([['a', 'a']], { a }, { wrong: [{ vals: { a: F(a * p, 1) }, msg: '$x$ は2乗してからわる！' }] }), check: { kind: 'fn', verify: (v) => v.a * p * p === a * p * p } } },
          { text: `${m(`y=${a}x^{2}`)} で ${m(`x=${r}`)} のときの ${m('y')} は？（負の数はかっこをつけて2乗）`, math: `y=${a}x^{2}`, q: { ...numAns([['y', 'y']], { y: a * r * r }, { wrong: [{ vals: { y: -a * r * r }, msg: '$(-2)^{2}=4$。2乗するとプラス！' }] }), check: { kind: 'value', expr: subX(`${a}x^{2}`, r) } } },
        ];
      },
    },
    {
      id: 'qf-l2',
      title: '変域',
      unlocks: ['qf-range'],
      build(rng) {
        const p = rng.pick([-2, -1]), q = rng.pick([2, 3]);
        const lo = 0, hi = Math.max(p * p, q * q);
        return [
          { text: `${m('y=x^{2}')} で ${m(`${p}\\le x\\le ${q}`)} のとき、${m('y')} の変域を考える。グラフで見ると、${m('x=0')}（頂点）を通っている！`, fig: plane({ x: [-4, 4], y: [-1, 10], fns: [{ f: (x) => x * x, dom: [p, q] }, { f: (x) => x * x, dash: true }] }) },
          { text: `いちばん小さい ${m('y')} は？`, q: { ...numAns([['y', '最小']], { y: lo }, { wrong: [{ vals: { y: p * p }, msg: '端だけ見ない！ 途中で $x=0$ を通る。' }] }), check: { kind: 'fn', verify: (v) => v.y === 0 } } },
          { text: `いちばん大きい ${m('y')} は？（${m(`x=${p}`)} と ${m(`x=${q}`)} のうち、0 から遠いほう）`, q: { ...numAns([['y', '最大']], { y: hi }), check: { kind: 'fn', verify: (v) => v.y === Math.max(p * p, q * q) } } },
        ];
      },
    },
    {
      id: 'qf-l3',
      title: '変化の割合',
      unlocks: ['qf-rate'],
      build(rng) {
        const a = rng.pick([1, 2]), p = rng.int(1, 2), q = p + rng.int(2, 3);
        const rhs = coef(a, 'x^{2}');
        return [
          { text: `${m(`y=${rhs}`)} で ${m('x')} が ${m(p)} から ${m(q)} まで増えるとき。一次関数とちがって、変化の割合は場所によって変わる。`, math: `y=${rhs}` },
          { text: `${m('y')} の増加量は？`, q: { ...numAns([['v', 'y の増加量']], { v: a * (q * q - p * p) }), check: { kind: 'value', expr: `(${subX(rhs, q)})-(${subX(rhs, p)})` } } },
          { text: `${m('x')} の増加量 ${m(q - p)} でわると、変化の割合は？`, q: { ...numAns([['v', '変化の割合']], { v: a * (p + q) }), check: { kind: 'value', expr: `\\frac{(${subX(rhs, q)})-(${subX(rhs, p)})}{${q - p}}` } } },
        ];
      },
    },
    {
      id: 'qf-l4',
      title: 'グラフと直線',
      unlocks: ['qf-graph', 'qf-cross'],
      build(rng) {
        const p = -rng.int(1, 2), q = rng.int(2, 3);
        const k = p + q, b = -p * q;
        return [
          { text: `${m('y=x^{2}')} のグラフ上に、${m('x')} 座標が ${m(p)} と ${m(q)} の点 A、B。まず A、B の ${m('y')} 座標を出す。`, fig: plane({ x: [-4, 4], y: [-1, 10], fns: [{ f: (x) => x * x }, { f: (x) => k * x + b, dash: true }], pts: [{ p: [p, p * p], label: 'A' }, { p: [q, q * q], label: 'B' }] }) },
          { text: 'A の $y$ 座標は？', q: { ...numAns([['y', 'y']], { y: p * p }), check: { kind: 'value', expr: subX('x^{2}', p) } } },
          { text: `B は ${m(`(${q},\\ ${q * q})`)}。直線 AB の傾きは？`, q: { ...numAns([['a', '傾き']], { a: k }), check: { kind: 'value', expr: `\\frac{${q * q}-${p * p}}{${q}-(${p})}` } } },
          { text: '直線 AB の式は？', q: { ...choice(rng, lineTex(k, b), [{ tex: lineTex(k, -b) }, { tex: lineTex(-k || 1, b) }]), check: { kind: 'graph', pts: [[p, p * p], [q, q * q]] } } },
        ];
      },
    },
  ],
};
