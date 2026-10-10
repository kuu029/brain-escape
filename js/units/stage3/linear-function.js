import { numAns, choice, m } from '../kit.js';
import { F, Frac, tnum, lineTex, lineRhs, subX } from './kit3.js';
import { plane, chart } from './fig.js';

const par = (v) => (Frac.of(v).n < 0 ? `(${tnum(v)})` : tnum(v));
// 傾き（整数か、分母2・3の分数）と切片
function pickLine(rng, frac = true) {
  const a = frac && rng.chance(0.3) ? F(rng.nz(-3, 3), rng.pick([2, 3])) : F(rng.pick([2, 3, 4, -2, -3, -4, 1, -1]));
  return { a, b: F(rng.nz(-6, 6)) };
}

function genRate(rng) {
  const { a, b } = pickLine(rng);
  const p = a.d * rng.int(-3, 1), q = p + a.d * rng.int(1, 3);
  const rhs = lineRhs(a, b);
  const ans = a.mul(q - p);
  return {
    stem: `${m(lineTex(a, b))} で、${m('x')} が ${m(p)} から ${m(q)} まで増加するときの ${m('y')} の増加量は？`,
    ...numAns([{ key: 'v', text: '$y$ の増加量' }], { v: ans }, { wrong: [
      { vals: { v: a }, msg: 'それは変化の割合（$x$ が1増えたとき）。$x$ は何増えた？' },
      { vals: { v: a.mul(q).add(b) }, msg: `それは ${m(`x=${q}`)} のときの $y$ の値。増加量は「あと − まえ」。` },
      { vals: { v: F(q - p) }, msg: 'それは $x$ の増加量。' },
    ] }),
    hint: '$y$ の増加量 = 変化の割合 × $x$ の増加量（一次関数の変化の割合は $a$）',
    steps: [`${m('x')} の増加量 ${m(`${q}-${par(p)}=${q - p}`)}`, `${m(`${tnum(a)}\\times ${q - p}=${tnum(ans)}`)}`],
    check: { kind: 'value', expr: `(${subX(rhs, q)})-(${subX(rhs, p)})` },
  };
}

function genSlopePt(rng) {
  const { a, b } = pickLine(rng);
  const p = a.d * rng.nz(-3, 3), q = a.mul(p).add(b);
  return {
    stem: `傾き ${m(tnum(a))} で点 ${m(`(${p},\\ ${tnum(q)})`)} を通る直線 ${m('y=ax+b')} の ${m('b')} は？`,
    ...numAns([['b', 'b']], { b }, { wrong: [
      { vals: { b: q.add(a.mul(p)) }, msg: '$b=y-ax$。移項で符号が変わるのに注意。' },
      { vals: { b: q.sub(a) }, msg: '$a$ には $x$ の値をかけてから。' },
    ] }),
    hint: '$y=ax+b$ に、傾き $a$ と点の $x,\\ y$ を代入して $b$ を求める。',
    steps: [`${m(`${tnum(q)}=${tnum(a)}\\times ${par(p)}+b`)}`, `${m(`b=${tnum(b)}`)}`],
    check: { kind: 'fn', verify: (v) => Math.abs(a.num() * p + v.b - q.num()) < 1e-9 },
  };
}

function genTwoPts(rng) {
  const { a, b } = pickLine(rng);
  let p, r;
  do { p = a.d * rng.int(-3, 3); r = a.d * rng.int(-3, 3); } while (p === r);
  const q = a.mul(p).add(b), s = a.mul(r).add(b);
  return {
    stem: `2点 ${m(`(${p},\\ ${tnum(q)})`)}、${m(`(${r},\\ ${tnum(s)})`)} を通る直線の式は？`,
    ...choice(rng, lineTex(a, b), [
      { tex: lineTex(Frac.of(r - p).div(s.sub(q).isZero() ? F(1) : s.sub(q)), b), msg: '傾きは $\\frac{y の増加量}{x の増加量}$。上下が逆！' },
      { tex: lineTex(a, b.neg()), msg: '切片の符号を確認。代入して確かめよう。' },
      { tex: lineTex(a.neg(), q.add(a.mul(p))), msg: '傾きの符号を確認！' },
      { tex: lineTex(a, q), msg: '切片は $x=0$ のときの $y$。' },
    ]),
    hint: 'まず傾き $a=\\frac{y の増加量}{x の増加量}$、次に1点を代入して $b$。',
    steps: [`傾き ${m(`\\frac{${tnum(s)}-${par(q)}}{${r}-${par(p)}}=${tnum(a)}`)}`, `${m(`${tnum(q)}=${tnum(a)}\\times ${par(p)}+b`)} → ${m(`b=${tnum(b)}`)}`],
    check: { kind: 'graph', pts: [[p, q.num()], [r, s.num()]] },
  };
}

function genGraph(rng) {
  let a, b;
  do { ({ a, b } = pickLine(rng)); b = F(rng.int(-4, 4)); } while (Math.abs(b.num()) > 4);
  // グラフ上の格子点を2つ
  const xs = [...Array(11).keys()].map((i) => i - 5).filter((x) => { const y = a.mul(x).add(b); return y.isInt() && Math.abs(y.num()) <= 5; });
  const fig = plane({ x: [-5, 5], y: [-5, 5], fns: [{ f: (x) => a.num() * x + b.num() }] });
  const pts = xs.slice(0, 2).map((x) => [x, a.mul(x).add(b).num()]);
  if (pts.length < 2) return genGraph(rng);
  return {
    stem: 'グラフが図の直線になる式は？',
    fig,
    ...choice(rng, lineTex(a, b), [
      { tex: lineTex(a.neg(), b), msg: '右上がりなら傾きはプラス、右下がりならマイナス。' },
      { tex: lineTex(a, b.isZero() ? F(1) : b.neg()), msg: '切片は $y$ 軸との交点。' },
      { tex: lineTex(a.isInt() ? F(1, a.num()) : F(a.d * Math.sign(a.n), Math.abs(a.n)), b), msg: '傾きは「右へ1進むと上へいくつ」。たてとよこが逆？' },
      { tex: lineTex(b.isZero() ? F(2) : b, a), msg: '傾きと切片が入れかわっている。' },
    ]),
    hint: 'まず $y$ 軸との交点（切片 $b$）を読む。次に、右へ進んだとき上下にいくつ動くか（傾き $a$）。',
    steps: [`切片 ${m(`b=${tnum(b)}`)}`, `傾き ${m(`a=${tnum(a)}`)} → ${m(lineTex(a, b))}`],
    check: { kind: 'graph', pts },
  };
}

// 速さのグラフ: 兄が歩いて出発し、あとから弟が自転車で追いかける。グラフから読む・追いつく時刻・場所
function travelSetup(rng) {
  for (;;) {
    const a = rng.pick([50, 60, 80]);
    const b = rng.pick([100, 120, 150, 160, 200, 240]);
    const t0 = rng.pick([2, 4, 6, 8, 10]);
    const T = (b * t0) / (b - a);
    if (Number.isInteger(T) && T <= 18 && T > t0) return { a, b, t0, T, d: a * T };
  }
}
function genTravel(rng) {
  const { a, b, t0, T, d } = travelSetup(rng);
  const xmax = 20;
  const ymax = Math.ceil((a * xmax) / 200) * 200;
  const ys = ymax <= 1200 ? 100 : 200;
  const fig = chart({ x: [0, xmax], y: [0, ymax], xs: 2, ys, xlab: 'x（分）', ylab: 'y（m）', w: 300, h: 240, lines: [
    { pts: [[0, 0], [xmax, a * xmax]], label: '兄' },
    { pts: [[t0, 0], [Math.min(xmax, t0 + ymax / b), Math.min(ymax, b * (xmax - t0))]], label: '弟', dash: true },
  ] });
  const intro = `兄が家を出て、一定の速さで歩いた。その ${t0} 分後に、弟が自転車で同じ道を追いかけた。図は、兄が家を出てから $x$ 分後の、家からの道のりを $y$ m として、2人のようすを表したグラフ（実線が兄、点線が弟）。`;
  const type = rng.pick(['speed', 'meet', 'where']);
  if (type === 'speed') {
    return {
      stem: `${intro}\n兄の歩く速さは分速何 m か。`, fig,
      ...numAns([{ key: 'v', text: '分速', suffix: ' m' }], { v: a }, { wrong: [{ vals: { v: a * 10 }, msg: 'それは 10 分で進んだ道のり。速さは 1 分あたり（道のり ÷ 時間）。' }, { vals: { v: b }, msg: 'それは弟（点線）の速さ。' }] }),
      hint: '兄の線（実線）で、目盛りがちょうど読める点をさがす。速さ = 道のり ÷ 時間。',
      steps: [`兄は 10 分で ${a * 10} m 進む`, `$${a * 10}\\div 10=${a}$ → 分速 ${a} m`],
      check: { kind: 'fn', verify: (x) => x.v * 10 === a * 10 && x.v * xmax === a * xmax },
    };
  }
  if (type === 'meet') {
    return {
      stem: `${intro}\n弟の速さは分速 ${b} m。弟が兄に追いつくのは、兄が家を出てから何分後か。`, fig,
      ...numAns([{ key: 'v', text: '', suffix: ' 分後' }], { v: T }, { wrong: [{ vals: { v: T - t0 }, msg: 'それは弟が出発してからの時間。兄が家を出てからの時間を聞いている。' }, { vals: { v: t0 }, msg: 'それは弟が出発した時刻。2本の線が交わるところを読む。' }] }),
      hint: `兄の式 $y=${a}x$、弟の式 $y=${b}(x-${t0})$ の交点の $x$ を求める。`,
      steps: [`兄: $y=${a}x$、弟: $y=${b}(x-${t0})=${b}x-${b * t0}$`, `$${a}x=${b}x-${b * t0}$ → $${b - a}x=${b * t0}$ → $x=${T}$`],
      check: { kind: 'fn', verify: (x) => a * x.v === b * (x.v - t0) },
    };
  }
  return {
    stem: `${intro}\n弟の速さは分速 ${b} m。弟が兄に追いつくのは、家から何 m の地点か。`, fig,
    ...numAns([{ key: 'v', text: '', suffix: ' m' }], { v: d }, { wrong: [{ vals: { v: b * T }, msg: `弟は ${t0} 分おくれて出発している。弟が走った時間は $x-${t0}$ 分。` }, { vals: { v: a * (T - t0) }, msg: '兄は家を出てから追いつかれるまでずっと歩いている。' }] }),
    hint: `兄の式 $y=${a}x$、弟の式 $y=${b}(x-${t0})$ の交点を求める。聞かれているのは $y$。`,
    steps: [`$${a}x=${b}(x-${t0})$ → $x=${T}$`, `$y=${a}\\times ${T}=${d}$（m）`],
    check: { kind: 'fn', verify: (x) => { const t = x.v / a; return Number.isFinite(t) && Math.abs(b * (t - t0) - x.v) < 1e-9 && t > t0; } },
  };
}

function genIntersect(rng) {
  let a1, a2, b1, b2, x, y;
  do {
    x = rng.int(-4, 4); y = rng.int(-5, 5);
    a1 = rng.nz(-3, 3); a2 = rng.nz(-3, 3);
    b1 = y - a1 * x; b2 = y - a2 * x;
  } while (a1 === a2 || b1 === 0 || b2 === 0);
  const e1 = lineTex(a1, b1), e2 = lineTex(a2, b2);
  return {
    stem: `2直線 ${m(e1)}、${m(e2)} の交点の座標は？`,
    fig: plane({ x: [-6, 6], y: [-6, 6], fns: [{ f: (t) => a1 * t + b1, label: 'ℓ', labelX: 4 }, { f: (t) => a2 * t + b2, label: 'm', labelX: -4.5, dash: true }] }),
    ...numAns([['x', 'x'], ['y', 'y']], { x, y }, { wrong: [{ vals: { x: y, y: x }, msg: '$x$ 座標と $y$ 座標が逆かも。' }] }),
    hint: '交点は2つの式を両方みたす点 → 連立方程式を解く。',
    steps: [`${m(`${lineRhs(a1, b1)}=${lineRhs(a2, b2)}`)} を解くと ${m(`x=${x}`)}`, `代入して ${m(`y=${y}`)}`],
    check: { kind: 'equations', eqs: [e1, e2] },
  };
}

export default {
  id: 'linear-function',
  stage: 3,
  area: '有刺鉄線ゾーン',
  title: '一次関数',
  emoji: '📉',
  prereqs: ['proportion', 'simultaneous'],
  tool: 'rewind',
  hintCard: [
    '$y=ax+b$：$a$ は傾き（変化の割合）、$b$ は切片',
    '$y$ の増加量 = $a$ × $x$ の増加量',
    '2点を通る直線: 傾き $\\frac{y の増加量}{x の増加量}$ → 1点を代入して $b$',
    '2直線の交点 = 連立方程式の解',
  ],
  generators: {
    'lf-rate': { difficulty: 1, gen: genRate },
    'lf-slope-pt': { difficulty: 2, gen: genSlopePt },
    'lf-two-pts': { difficulty: 2, gen: genTwoPts },
    'lf-graph': { difficulty: 2, gen: genGraph },
    'lf-intersect': { difficulty: 3, gen: genIntersect },
    'lf-travel': { difficulty: 3, gen: genTravel },
  },
  lessons: [
    {
      id: 'lf-l1',
      title: '傾きと変化の割合',
      unlocks: ['lf-rate'],
      build(rng) {
        const a = rng.pick([2, 3, -2]), b = rng.nz(-5, 5);
        const rhs = lineRhs(a, b);
        return [
          { text: `${m('y=ax+b')} の形の関数を一次関数という。${m('a')} を傾き、${m('b')} を切片という。`, math: 'y=ax+b' },
          { text: `${m(lineTex(a, b))} で、${m('x=1')} のときの ${m('y')} は？`, math: lineTex(a, b), q: { ...numAns([['y', 'y']], { y: a + b }), check: { kind: 'value', expr: subX(rhs, 1) } } },
          { text: `${m('x=2')} のときの ${m('y')} は？`, q: { ...numAns([['y', 'y']], { y: 2 * a + b }), check: { kind: 'value', expr: subX(rhs, 2) } } },
          { text: `${m('x')} が1増えると、${m('y')} は ${m(a)} 増える。これが「変化の割合」で、いつも傾き ${m('a')} と同じ。では ${m('x')} が 3 増えたら ${m('y')} はいくつ増える？`, q: { ...numAns([['v', '増加量']], { v: 3 * a }, { wrong: [{ vals: { v: a }, msg: '1増えたら $a$、3増えたら？' }] }), check: { kind: 'value', expr: `(${subX(rhs, 3)})-(${subX(rhs, 0)})` } } },
        ];
      },
    },
    {
      id: 'lf-l2',
      title: '式の求め方',
      unlocks: ['lf-slope-pt', 'lf-two-pts'],
      build(rng) {
        const a = rng.pick([2, 3, -2, -3]), p = rng.int(1, 3), r = p + rng.int(1, 2);
        let b;
        do b = rng.nz(-5, 5); while (a * p + b === 0 || a * r + b === 0); // 0 だと「-0」の式になる
        const q = a * p + b, s = a * r + b;
        return [
          { text: `2点 ${m(`(${p},\\ ${q})`)}、${m(`(${r},\\ ${s})`)} を通る直線の式を求める。まず傾き。`, math: `\\frac{${s}-${par(q)}}{${r}-${p}}` },
          { text: '傾き（変化の割合）は？', q: { ...numAns([['a', 'a']], { a }, { wrong: [{ vals: { a: F(r - p, s - q) }, msg: '$\\frac{y の増加量}{x の増加量}$。$y$ が分子！' }] }), check: { kind: 'value', expr: `\\frac{${s}-${par(q)}}{${r}-${p}}` } } },
          { text: `${m(`y=${a}x+b`)} に点 ${m(`(${p},\\ ${q})`)} を代入: ${m(`${q}=${a}\\times ${p}+b`)}`, math: `${q}=${a}\\times ${p}+b` },
          { text: `${m('b')} は？`, q: { ...numAns([['b', 'b']], { b }), check: { kind: 'fn', verify: (v) => a * p + v.b === q } } },
          { text: '直線の式は？', q: { ...choice(rng, lineTex(a, b), [{ tex: lineTex(a, -b) }, { tex: lineTex(-a, b) }]), check: { kind: 'graph', pts: [[p, q], [r, s]] } } },
        ];
      },
    },
    {
      id: 'lf-l3',
      title: 'グラフを読む',
      unlocks: ['lf-graph'],
      build(rng) {
        const a = rng.pick([2, -2, 3]), b = rng.int(-3, 3) || 1;
        const fig = plane({ x: [-5, 5], y: [-5, 5], fns: [{ f: (x) => a * x + b }], pts: [{ p: [0, b], label: `(0, ${b})` }] });
        return [
          { text: '一次関数のグラフは直線。まず $y$ 軸と交わる点を見る。そこが切片 $b$。', fig },
          { text: '切片 $b$ は？', q: { ...numAns([['b', 'b']], { b }), check: { kind: 'fn', verify: (v) => v.b === b } } },
          { text: '次に、グラフの上を右へ1マス進むと、上下に何マス動く？（上ならプラス、下ならマイナス）これが傾き $a$。', q: { ...numAns([['a', 'a']], { a }, { wrong: [{ vals: { a: -a }, msg: '右下がりならマイナス、右上がりならプラス。' }] }), check: { kind: 'fn', verify: (v) => v.a === a } } },
          { text: 'グラフの式は？', q: { ...choice(rng, lineTex(a, b), [{ tex: lineTex(b, a) }, { tex: lineTex(-a, b) }]), check: { kind: 'graph', pts: [[0, b], [1, a + b]] } } },
        ];
      },
    },
    {
      id: 'lf-l4',
      title: '2直線の交点',
      unlocks: ['lf-intersect', 'lf-travel'],
      build(rng) {
        const x = rng.int(1, 3), y = rng.int(1, 4);
        const a1 = 1, a2 = -2, b1 = y - x, b2 = y + 2 * x;
        const e1 = lineTex(a1, b1 || 0), e2 = lineTex(a2, b2);
        return [
          { text: `2直線 ${m(e1)} と ${m(e2)} の交点は、両方の式をみたす点。だから連立方程式を解けばいい。`, fig: plane({ x: [-5, 5], y: [-5, 7], fns: [{ f: (t) => a1 * t + b1 }, { f: (t) => a2 * t + b2, dash: true }] }) },
          { text: `${m(`${lineRhs(a1, b1)}=${lineRhs(a2, b2)}`)} を解くと、${m('x')} は？`, q: { ...numAns([['x', 'x']], { x }), check: { kind: 'fn', verify: (v) => a1 * v.x + b1 === a2 * v.x + b2 } } },
          { text: `${m(`x=${x}`)} を代入すると、${m('y')} は？`, q: { ...numAns([['y', 'y']], { y }), check: { kind: 'value', expr: subX(lineRhs(a1, b1), x) } } },
        ];
      },
    },
  ],
};
