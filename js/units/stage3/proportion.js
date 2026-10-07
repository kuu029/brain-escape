import { numAns, choice, ONE, m } from '../kit.js';
import { F, Frac, tnum, coef, lineTex, invTex } from './kit3.js';
import { plane } from './fig.js';

const directTex = (a) => `y=${coef(a, 'x')}`;
// 比例定数（整数か、分母2・3の分数）
function pickA(rng) {
  if (rng.chance(0.7)) return F(rng.pick([2, 3, 4, 5, -2, -3, -4]));
  return F(rng.pick([1, -1, 3, -3]), rng.pick([2, 4]));
}

function genDirect(rng) {
  const a = pickA(rng);
  const step = a.d;
  let p, r;
  do { p = step * rng.nz(-4, 4); r = step * rng.nz(-5, 5); } while (p === r);
  const q = a.mul(p), ans = a.mul(r);
  return {
    stem: `${m('y')} は ${m('x')} に比例し、${m(`x=${p}`)} のとき ${m(`y=${tnum(q)}`)} です。${m(`x=${r}`)} のときの ${m('y')} の値は？`,
    ...numAns([['y', 'y']], { y: ans }, { wrong: [{ vals: { y: a }, msg: 'それは比例定数 $a$。そのあと $x$ の値を代入しよう。' }, !a.isZero() && q.n !== 0 && { vals: { y: q.mul(p).div(r) }, msg: 'それは反比例の計算。比例は $y=ax$。' }] }),
    hint: 'まず $y=ax$ に代入して $a$ を求め、次に $x$ を入れる。',
    steps: [`${m(`${tnum(q)}=a\\times (${p})`)} → ${m(`a=${tnum(a)}`)}`, `${m(directTex(a))} に ${m(`x=${r}`)} → ${m(`y=${tnum(ans)}`)}`],
    // 比例なら y/x が一定
    check: { kind: 'fn', verify: (v) => Math.abs(v.y / r - q.num() / p) < 1e-9 },
  };
}

function genInverse(rng) {
  const a = rng.pick([6, 8, 12, 18, 24, -6, -12, -18]);
  const ds = (n) => [...Array(Math.abs(n)).keys()].map((i) => i + 1).filter((d) => n % d === 0);
  const divs = ds(a).flatMap((d) => [d, -d]);
  let p, r;
  do { p = rng.pick(divs); r = rng.pick(divs); } while (p === r);
  const q = a / p, ans = a / r;
  return {
    stem: `${m('y')} は ${m('x')} に反比例し、${m(`x=${p}`)} のとき ${m(`y=${q}`)} です。${m(`x=${r}`)} のときの ${m('y')} の値は？`,
    ...numAns([['y', 'y']], { y: ans }, { wrong: [{ vals: { y: F(q * r, p) }, msg: 'それは比例の計算。反比例は $y=\\frac{a}{x}$（$xy$ が一定）。' }, { vals: { y: a }, msg: 'それは比例定数 $a$。そのあと $x$ でわる。' }] }),
    hint: '反比例は $xy=a$（一定）。まず $a=xy$ を求める。',
    steps: [`${m(`a=xy=${p}\\times ${q < 0 ? `(${q})` : q}=${a}`)}`, `${m(invTex(a))} に ${m(`x=${r}`)} → ${m(`y=${ans}`)}`],
    // 反比例なら x×y が一定
    check: { kind: 'fn', verify: (v) => Math.abs(v.y * r - p * q) < 1e-9 },
  };
}

function genFormula(rng) {
  if (rng.chance(0.5)) {
    const a = pickA(rng);
    const p = a.d * rng.nz(-3, 3), q = a.mul(p);
    return {
      stem: `${m('y')} は ${m('x')} に比例し、${m(`x=${p}`)} のとき ${m(`y=${tnum(q)}`)}。${m('y')} を ${m('x')} の式で表すと？`,
      ...choice(rng, directTex(a), [
        { tex: directTex(Frac.of(p).div(q)), msg: '$a=\\frac{y}{x}$。$x$ と $y$ が逆になってない？' },
        { tex: invTex(q.mul(p)), msg: '比例は $y=ax$ の形。$\\frac{a}{x}$ は反比例。' },
        { tex: directTex(a.neg()), msg: '符号を確認！' },
      ]),
      hint: '$y=ax$ に $x,\\ y$ を代入して $a$ を求める。',
      steps: [`${m(`${tnum(q)}=a\\times (${p})`)} → ${m(`a=${tnum(a)}`)}`],
      check: { kind: 'graph', pts: [[p, q.num()], [2 * p, 2 * q.num()]] },
    };
  }
  const a = rng.pick([6, 8, 12, 18, -6, -8, -12]);
  const p = rng.pick([1, 2, 3, -2, -3].filter((d) => a % d === 0 && Math.abs(d) !== 1)), q = a / p;
  return {
    stem: `${m('y')} は ${m('x')} に反比例し、${m(`x=${p}`)} のとき ${m(`y=${q}`)}。${m('y')} を ${m('x')} の式で表すと？`,
    ...choice(rng, invTex(a), [
      { tex: directTex(F(q, p)), msg: '反比例は $y=\\frac{a}{x}$ の形。' },
      { tex: invTex(F(q, p)), msg: '$a=xy$（かけ算）。わり算じゃない。' },
      { tex: invTex(-a), msg: '符号を確認！' },
    ]),
    hint: '反比例は $a=xy$。',
    steps: [`${m(`a=${p}\\times ${q < 0 ? `(${q})` : q}=${a}`)} → ${m(invTex(a))}`],
    check: { kind: 'graph', pts: [[p, q], [2 * p, q / 2]] },
  };
}

function genGraph(rng) {
  if (rng.chance(0.55)) {
    // 直線 y = (q/p) x が格子点 (p, q) を通る
    let p, q;
    do { p = rng.int(1, 4); q = rng.nz(-5, 5); } while (Math.abs(q) === p || (q % p === 0 && Math.abs(q / p) === 1));
    const a = F(q, p);
    const fig = plane({ x: [-5, 5], y: [-5, 5], fns: [{ f: (x) => (q / p) * x }], pts: [{ p: [p, q], label: `(${p}, ${q})`, dy: q > 0 ? -6 : 14 }] });
    return {
      stem: 'グラフが図の直線になる式は？',
      fig,
      ...choice(rng, directTex(a), [
        { tex: directTex(F(p, q)), msg: '$a=\\frac{y}{x}$。たてとよこが逆になってない？' },
        { tex: directTex(a.neg()), msg: '右上がりなら $a>0$、右下がりなら $a<0$。' },
        { tex: invTex(p * q), msg: '原点を通る直線は比例 $y=ax$。' },
      ]),
      hint: `原点と点 ${m(`(${p},\\ ${q})`)} を通る → ${m('a=\\frac{y}{x}')}`,
      steps: [`${m(`a=\\frac{${q}}{${p}}`)} → ${m(directTex(a))}`],
      check: { kind: 'graph', pts: [[p, q], [0, 0]] },
    };
  }
  const a = rng.pick([4, 6, 8, -4, -6, -8]);
  // p*p = |a| だと (p, q) と (q, p) が y=±x の上にもあるので外す
  const p = rng.pick([1, 2, 4].filter((d) => a % d === 0 && Math.abs(a / d) <= 5 && d !== Math.abs(a) && d * d !== Math.abs(a)));
  const q = a / p;
  const fig = plane({ x: [-6, 6], y: [-6, 6], fns: [{ f: (x) => (Math.abs(x) < 0.4 ? NaN : a / x) }], pts: [{ p: [p, q], label: `(${p}, ${q})`, dy: q > 0 ? -6 : 14 }] });
  return {
    stem: 'グラフが図の双曲線になる式は？',
    fig,
    ...choice(rng, invTex(a), [
      { tex: invTex(-a), msg: 'グラフが右上と左下にあれば $a>0$。' },
      { tex: directTex(F(q, p)), msg: '双曲線は反比例 $y=\\frac{a}{x}$。' },
      { tex: invTex(a * 2), msg: '$a=xy$ を点の座標で計算しよう。' },
    ]),
    hint: `点 ${m(`(${p},\\ ${q})`)} を通る → ${m('a=xy')}`,
    steps: [`${m(`a=${p}\\times ${q < 0 ? `(${q})` : q}=${a}`)} → ${m(invTex(a))}`],
    check: { kind: 'graph', pts: [[p, q], [q, p]] },
  };
}

export default {
  id: 'proportion',
  stage: 3,
  area: '外壁の上',
  title: '比例・反比例',
  emoji: '📈',
  prereqs: ['linear-equations'],
  tool: 'sniper',
  hintCard: [
    '比例: $y=ax$（$\\frac{y}{x}$ が一定）。グラフは原点を通る直線',
    '反比例: $y=\\frac{a}{x}$（$xy$ が一定）。グラフは双曲線',
    '式を求める: 1組の $x,\\ y$ を代入して $a$ を出す',
  ],
  generators: {
    'pr-direct': { difficulty: 1, gen: genDirect },
    'pr-inverse': { difficulty: 1, gen: genInverse },
    'pr-formula': { difficulty: 2, gen: genFormula },
    'pr-graph': { difficulty: 2, gen: genGraph },
  },
  lessons: [
    {
      id: 'pr-l1',
      title: '比例 $y=ax$',
      unlocks: ['pr-direct', 'pr-formula'],
      build(rng) {
        const a = rng.int(2, 5), p = rng.int(2, 4), r = rng.int(5, 8);
        return [
          { text: `「${m('y')} は ${m('x')} に比例する」とは、${m('y=ax')} の形で表せること。${m('a')} を比例定数という。`, math: 'y=ax' },
          { text: `${m(`x=${p}`)} のとき ${m(`y=${a * p}`)}。${m(`${a * p}=a\\times ${p}`)} だから、${m('a')} は？`, q: { ...numAns([['a', 'a']], { a }), check: { kind: 'fn', verify: (v) => v.a * p === a * p } } },
          { text: `式は ${m(`y=${a}x`)}。${m(`x=${r}`)} のときの ${m('y')} は？`, math: `y=${a}x`, q: { ...numAns([['y', 'y']], { y: a * r }), check: { kind: 'value', expr: `${a}\\times ${r}` } } },
        ];
      },
    },
    {
      id: 'pr-l2',
      title: '反比例 $y=\\frac{a}{x}$',
      unlocks: ['pr-inverse'],
      build(rng) {
        const a = rng.pick([12, 18, 24]), p = rng.pick([2, 3]), r = rng.pick([4, 6].filter((d) => a % d === 0));
        return [
          { text: `「${m('y')} は ${m('x')} に反比例する」とは、${m('y=\\frac{a}{x}')} の形。言いかえると ${m('xy=a')}（かけると一定）。`, math: 'y=\\frac{a}{x}' },
          { text: `${m(`x=${p}`)} のとき ${m(`y=${a / p}`)}。${m('a=xy')} は？`, q: { ...numAns([['a', 'a']], { a }, { wrong: [{ vals: { a: F(a / p, p) }, msg: '$a=xy$、かけ算！' }] }), check: { kind: 'value', expr: `${p}\\times ${a / p}` } } },
          { text: `式は ${m(invTex(a))}。${m(`x=${r}`)} のときの ${m('y')} は？`, math: invTex(a), q: { ...numAns([['y', 'y']], { y: a / r }), check: { kind: 'value', expr: `\\frac{${a}}{${r}}` } } },
        ];
      },
    },
    {
      id: 'pr-l3',
      title: 'グラフから式を読む',
      unlocks: ['pr-graph'],
      build(rng) {
        const p = rng.int(1, 3), q = rng.int(p + 1, 5);
        const fig = plane({ x: [-5, 5], y: [-5, 5], fns: [{ f: (x) => (q / p) * x }], pts: [{ p: [p, q], label: `(${p}, ${q})` }] });
        return [
          { text: '比例のグラフは原点 O を通る直線。グラフの上の「目もりがちょうど交わる点」を探す。', fig },
          { text: `点 ${m(`(${p},\\ ${q})`)} を通る。${m('a=\\frac{y}{x}')} は？`, q: { ...numAns([['a', 'a']], { a: F(q, p) }, { wrong: [{ vals: { a: F(p, q) }, msg: '$\\frac{y}{x}$。$y$ が上（分子）。' }] }), check: { kind: 'value', expr: `\\frac{${q}}{${p}}` } } },
          { text: '反比例のグラフは原点をはさんだ2本の曲線（双曲線）。点の座標をかけると $a$。', fig: plane({ x: [-6, 6], y: [-6, 6], fns: [{ f: (x) => (Math.abs(x) < 0.4 ? NaN : 6 / x) }], pts: [{ p: [2, 3], label: '(2, 3)' }] }) },
          { text: 'このグラフの式は？', q: { ...choice(rng, invTex(6), [{ tex: invTex(-6), msg: '右上と左下にあるので $a>0$。' }, { tex: 'y=\\frac{3}{2}x', msg: '直線ではない！' }]), check: { kind: 'graph', pts: [[2, 3], [3, 2]] } } },
        ];
      },
    },
  ],
};
