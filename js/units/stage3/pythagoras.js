import { numAns, m } from '../kit.js';
import { rootTex, rootChoice, near, isSq } from './kit3.js';
import { geo, plane, solid, dist, polar } from './fig.js';

// 測った長さを、検算テストが読める数の文字列に
const num = (v) => v.toFixed(12);
const lenQ = (rng, N, wrongNs, measure) => {
  if (isSq(N)) {
    return { ...numAns([{ key: 'v', text: '', suffix: 'cm' }], { v: Math.sqrt(N) }, { wrong: wrongNs.filter((w) => isSq(w.n) && w.n !== N).map((w) => ({ vals: { v: Math.sqrt(w.n) }, msg: w.msg })) }), check: { kind: 'fn', verify: (v) => near(v.v, measure()) } };
  }
  return { ...rootChoice(rng, N, wrongNs), check: { kind: 'value', expr: num(measure()) } };
};
// 直角三角形（C が直角、BC=a、CA=b）
const right = (a, b) => ({ C: [0, 0], B: [a, 0], A: [0, b] });
const rspec = (P, lens) => ({ pts: P, segs: [['A', 'B'], ['B', 'C'], ['C', 'A']], polys: [['A', 'B', 'C']], angles: [{ at: 'C', from: 'B', to: 'A', right: true }], lens });

function genHyp(rng) {
  const a = rng.int(1, 9), b = rng.int(2, 9);
  const P = right(a, b);
  const N = a * a + b * b;
  return {
    stem: `直角三角形で、斜辺 ${m('x')} の長さは？`,
    fig: geo(rspec(P, [{ a: 'B', b: 'C', label: `${a}cm`, side: 1 }, { a: 'C', b: 'A', label: `${b}cm`, side: 1 }, { a: 'A', b: 'B', label: 'x', side: 1 }])),
    ...lenQ(rng, N, [{ n: (a + b) ** 2, msg: '辺をそのまま足すのではなく、2乗して足す。' }, { n: Math.abs(a * a - b * b), msg: '斜辺は「2乗の和」。ひき算は斜辺以外を求めるとき。' }, { n: 2 * N, msg: '$a^{2}+b^{2}=c^{2}$ → $c=\\sqrt{a^{2}+b^{2}}$' }], () => dist(P.A, P.B)),
    hint: '三平方の定理: $a^{2}+b^{2}=c^{2}$（$c$ は斜辺）',
    steps: [`${m(`x^{2}=${a}^{2}+${b}^{2}=${N}`)}`, `${m(`x=${rootTex(N)}`)}`],
  };
}

function genLeg(rng) {
  let a, c;
  do { a = rng.int(1, 9); c = rng.int(a + 1, 12); } while (c * c - a * a < 2);
  const b = Math.sqrt(c * c - a * a);
  const P = right(a, b);
  const N = c * c - a * a;
  return {
    stem: `直角三角形で、${m('x')} の長さは？`,
    fig: geo(rspec(P, [{ a: 'B', b: 'C', label: `${a}cm`, side: 1 }, { a: 'A', b: 'B', label: `${c}cm`, side: 1 }, { a: 'C', b: 'A', label: 'x', side: 1 }])),
    ...lenQ(rng, N, [{ n: c * c + a * a, msg: '斜辺は一番長い辺（直角の向かい）。$x^{2}=c^{2}-a^{2}$。' }, { n: (c - a) ** 2, msg: '2乗してからひく。' }], () => dist(P.C, P.A)),
    hint: '斜辺は直角の向かいの辺。$x^{2}=$ 斜辺$^{2}-$ もう1辺$^{2}$',
    steps: [`${m(`x^{2}=${c}^{2}-${a}^{2}=${N}`)}`, `${m(`x=${rootTex(N)}`)}`],
  };
}

function genSpecial(rng) {
  const k = rng.int(1, 6);
  const type = rng.int(0, 3);
  if (type < 2) {
    // 45°, 45°, 90°（直角二等辺三角形）
    const P = right(k, k);
    const hypGiven = type === 1;
    const hk = 2 * k; // 斜辺を与えるときは偶数にして、答えを √ の形に
    const Q = hypGiven ? right(hk / Math.SQRT2, hk / Math.SQRT2) : P;
    return {
      stem: `直角二等辺三角形で、${m('x')} の長さは？`,
      fig: geo({ ...rspec(Q, hypGiven ? [{ a: 'A', b: 'B', label: `${hk}cm`, side: 1 }, { a: 'B', b: 'C', label: 'x', side: 1 }] : [{ a: 'B', b: 'C', label: `${k}cm`, side: 1 }, { a: 'A', b: 'B', label: 'x', side: 1 }]), ticks: [['B', 'C'], ['C', 'A']], angles: [{ at: 'C', from: 'B', to: 'A', right: true }, { at: 'B', from: 'A', to: 'C', label: '45°' }] }),
      ...lenQ(rng, hypGiven ? (hk * hk) / 2 : 2 * k * k, hypGiven ? [{ n: hk * hk * 2, msg: '斜辺は他の辺の $\\sqrt{2}$ 倍。だから $x$ は斜辺 ÷ $\\sqrt{2}$。' }, { n: (hk * hk) / 4, msg: '$1:1:\\sqrt{2}$ の比を使おう。' }] : [{ n: 4 * k * k, msg: '斜辺は $\\sqrt{2}$ 倍（2倍ではない）。' }, { n: 3 * k * k, msg: '$\\sqrt{3}$ は 30°・60° の三角形。' }], () => (hypGiven ? dist(Q.B, Q.C) : dist(Q.A, Q.B))),
      hint: '45°・45°・90° の三角形の辺の比は $1:1:\\sqrt{2}$',
      steps: [
        '直角二等辺三角形（45°・45°・90°）の辺の比は 等しい辺 : 等しい辺 : 斜辺 = $1:1:\\sqrt{2}$',
        hypGiven ? `斜辺が ${m(hk)} → 等しい辺は斜辺 ÷ ${m('\\sqrt{2}')}: ${m(`x=\\frac{${hk}}{\\sqrt{2}}=\\frac{${hk}\\sqrt{2}}{2}=${rootTex((hk * hk) / 2)}`)}（分母を有理化）` : `等しい辺が ${m(k)} → 斜辺はその ${m('\\sqrt{2}')} 倍: ${m(`x=${k}\\times \\sqrt{2}=${rootTex(2 * k * k)}`)}`,
      ],
    };
  }
  // 30°, 60°, 90°（BC=k、AB=2k、CA=k√3。∠B=60°）
  const P = right(k, k * Math.sqrt(3));
  const fromHyp = type === 3;
  const askLong = fromHyp ? rng.chance(0.5) : true;
  const N = askLong ? 3 * k * k : k * k;
  const lens = fromHyp
    ? [{ a: 'A', b: 'B', label: `${2 * k}cm`, side: 1 }, askLong ? { a: 'C', b: 'A', label: 'x', side: 1 } : { a: 'B', b: 'C', label: 'x', side: 1 }]
    : [{ a: 'B', b: 'C', label: `${k}cm`, side: 1 }, { a: 'C', b: 'A', label: 'x', side: 1 }];
  return {
    stem: `図の直角三角形で、${m('x')} の長さは？`,
    fig: geo({ ...rspec(P, lens), angles: [{ at: 'C', from: 'B', to: 'A', right: true }, { at: 'B', from: 'A', to: 'C', label: '60°' }, { at: 'A', from: 'C', to: 'B', label: '30°' }] }),
    ...lenQ(rng, N, [{ n: 2 * k * k, msg: '$\\sqrt{2}$ は直角二等辺三角形。30°・60° は $1:2:\\sqrt{3}$。' }, { n: 4 * k * k, msg: '辺の比 $1:2:\\sqrt{3}$ の、どの辺かを確認。' }, { n: askLong ? k * k : 3 * k * k, msg: '短い辺（30° の向かい）と長い辺をとりちがえていない？' }], () => (askLong ? dist(P.C, P.A) : dist(P.B, P.C))),
    hint: '30°・60°・90° の三角形の辺の比は $1:2:\\sqrt{3}$（短い辺：斜辺：残り）',
    steps: [
      '30°・60°・90° の三角形の辺の比は 短い辺（30°の向かい）: 斜辺 : 残りの辺 = $1:2:\\sqrt{3}$',
      fromHyp ? `斜辺が ${m(2 * k)} → 短い辺はその半分: ${m(`${2 * k}\\div 2=${k}`)}` : `短い辺（BC）が ${m(k)}`,
      askLong ? `残りの辺（CA）は短い辺の ${m('\\sqrt{3}')} 倍: ${m(`x=${k}\\times \\sqrt{3}=${rootTex(N)}`)}` : `${m(`x=${rootTex(N)}`)}`,
    ],
  };
}

function genCoord(rng) {
  let A, B;
  do { A = [rng.int(-4, 3), rng.int(-4, 4)]; B = [rng.int(-3, 4), rng.int(-4, 4)]; } while (A[0] === B[0] || A[1] === B[1]);
  const dx = B[0] - A[0], dy = B[1] - A[1];
  const N = dx * dx + dy * dy;
  return {
    stem: `2点 ${m(`A(${A[0]},\\ ${A[1]})`)}、${m(`B(${B[0]},\\ ${B[1]})`)} の距離は？（1目もり 1cm）`,
    fig: plane({ x: [-5, 5], y: [-5, 5], pts: [{ p: A, label: 'A' }, { p: B, label: 'B' }], segs: [[A, B], [A, [B[0], A[1]]], [[B[0], A[1]], B]] }),
    ...lenQ(rng, N, [{ n: (Math.abs(dx) + Math.abs(dy)) ** 2, msg: 'たて・よこの長さを、2乗して足す。' }, { n: Math.abs(dx * dx - dy * dy), msg: '斜辺 = 2乗の「和」。' }], () => dist(A, B)),
    hint: 'AB を斜辺とする直角三角形を作る。よこ $|x の差|$、たて $|y の差|$。',
    steps: [`よこ ${m(Math.abs(dx))}、たて ${m(Math.abs(dy))}`, `${m(`AB^{2}=${dx * dx}+${dy * dy}=${N}`)} → ${m(`AB=${rootTex(N)}`)}`],
  };
}

function genSpace(rng) {
  if (rng.chance(0.55)) {
    const a = rng.int(2, 6), b = rng.int(2, 6), c = rng.int(2, 8);
    const N = a * a + b * b + c * c;
    return {
      stem: `たて ${m(b)} cm、よこ ${m(a)} cm、高さ ${m(c)} cm の直方体の対角線の長さは？`,
      fig: solid('cuboid', { a: `${a}cm`, b: `${b}cm`, c: `${c}cm`, diag: true, dims: [a, b, c] }),
      ...lenQ(rng, N, [{ n: a * a + b * b, msg: 'それは底面の対角線。高さもふくめて3つの2乗をたす。' }, { n: (a + b + c) ** 2, msg: '2乗してたす。' }], () => Math.hypot(a, b, c)),
      hint: '直方体の対角線 $=\\sqrt{a^{2}+b^{2}+c^{2}}$（底面の対角線 → 高さ の順に三平方を2回）',
      steps: [`${m(`${a}^{2}+${b}^{2}+${c}^{2}=${N}`)}`, `${m(rootTex(N))}`],
    };
  }
  let r, l;
  do { r = rng.int(2, 6); l = rng.int(r + 1, 10); } while (l * l - r * r < 2);
  const N = l * l - r * r;
  return {
    stem: `底面の半径が ${m(r)} cm、母線の長さが ${m(l)} cm の円錐の高さは？`,
    fig: solid('cone', { r: `${r}cm`, h: 'x', l: `${l}cm` }),
    ...lenQ(rng, N, [{ n: l * l + r * r, msg: '母線が斜辺。高さ$^{2}$ = 母線$^{2}-$ 半径$^{2}$。' }, { n: (l - r) ** 2, msg: '2乗してからひく。' }], () => Math.sqrt(l * l - r * r)),
    hint: '頂点・底面の中心・底面の円周上の点で直角三角形ができる（斜辺は母線）。',
    steps: [`${m(`x^{2}=${l}^{2}-${r}^{2}=${N}`)}`, `${m(`x=${rootTex(N)}`)}`],
  };
}

export default {
  id: 'pythagoras',
  stage: 3,
  area: '峠',
  title: '三平方の定理',
  emoji: '📏',
  prereqs: ['similarity', 'square-roots'],
  tool: 'sniper',
  hintCard: [
    '直角三角形で $a^{2}+b^{2}=c^{2}$（$c$ は斜辺＝直角の向かい）',
    '45°・45°・90° → $1:1:\\sqrt{2}$',
    '30°・60°・90° → $1:2:\\sqrt{3}$',
    '2点間の距離・直方体の対角線も三平方で',
  ],
  generators: {
    'py-hyp': { difficulty: 1, gen: genHyp },
    'py-leg': { difficulty: 1, gen: genLeg },
    'py-special': { difficulty: 2, gen: genSpecial },
    'py-coord': { difficulty: 2, gen: genCoord },
    'py-space': { difficulty: 3, gen: genSpace },
  },
  lessons: [
    {
      id: 'py-l1',
      title: '三平方の定理',
      unlocks: ['py-hyp', 'py-leg'],
      build(rng) {
        const [a, b, c] = rng.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]]);
        const P = right(a, b);
        return [
          { text: '直角三角形では、斜辺（直角の向かいの、いちばん長い辺）を $c$ とすると $a^{2}+b^{2}=c^{2}$。これが三平方の定理。', fig: geo(rspec(P, [{ a: 'B', b: 'C', label: `${a}cm`, side: 1 }, { a: 'C', b: 'A', label: `${b}cm`, side: 1 }, { a: 'A', b: 'B', label: 'c', side: 1 }])), math: 'a^{2}+b^{2}=c^{2}' },
          { text: `${m(`c^{2}=${a}^{2}+${b}^{2}`)} はいくつ？`, q: { ...numAns([{ key: 'v', text: '$c^{2}$' }], { v: c * c }, { wrong: [{ vals: { v: a + b }, msg: '2乗してから足す。' }] }), check: { kind: 'value', expr: `${a}^{2}+${b}^{2}` } } },
          { text: '$c$ は？', q: { ...numAns([{ key: 'v', text: '', suffix: 'cm' }], { v: c }), check: { kind: 'fn', verify: (v) => near(v.v, dist(P.A, P.B)) } } },
          { text: `2乗してもきれいな数にならないときは √ を使う。直角をはさむ2辺が 1cm と 2cm なら、斜辺は？`, fig: geo(rspec(right(1, 2), [{ a: 'B', b: 'C', label: '1cm', side: 1 }, { a: 'C', b: 'A', label: '2cm', side: 1 }])), q: lenQ(rng, 5, [{ n: 9, msg: '$1^{2}+2^{2}$ を計算。' }, { n: 3 }], () => dist([0, 2], [1, 0])) },
        ];
      },
    },
    {
      id: 'py-l2',
      title: '特別な直角三角形',
      unlocks: ['py-special'],
      build(rng) {
        const k = rng.int(2, 5);
        const P = right(k, k * Math.sqrt(3));
        return [
          { text: '正方形を対角線で半分にすると、45°・45°・90° の三角形。辺の比は $1:1:\\sqrt{2}$。', fig: geo({ ...rspec(right(1, 1), []), ticks: [['B', 'C'], ['C', 'A']], angles: [{ at: 'C', from: 'B', to: 'A', right: true }, { at: 'B', from: 'A', to: 'C', label: '45°' }] }) },
          { text: `直角をはさむ辺が ${k}cm なら、斜辺は？`, q: lenQ(rng, 2 * k * k, [{ n: 4 * k * k, msg: '2倍ではなく $\\sqrt{2}$ 倍。' }, { n: 3 * k * k }], () => Math.hypot(k, k)) },
          { text: '正三角形を半分にすると、30°・60°・90° の三角形。辺の比は（短い辺）:（斜辺）:（残り） = $1:2:\\sqrt{3}$。', fig: geo({ ...rspec(P, [{ a: 'B', b: 'C', label: `${k}cm`, side: 1 }]), angles: [{ at: 'C', from: 'B', to: 'A', right: true }, { at: 'B', from: 'A', to: 'C', label: '60°' }, { at: 'A', from: 'C', to: 'B', label: '30°' }] }) },
          { text: `短い辺が ${k}cm のとき、斜辺は？`, q: { ...numAns([{ key: 'v', text: '', suffix: 'cm' }], { v: 2 * k }, { wrong: [{ vals: { v: k * k }, msg: '比は $1:2$。2倍。' }] }), check: { kind: 'fn', verify: (v) => near(v.v, dist(P.A, P.B)) } } },
          { text: '残りの辺（たて）は？', q: lenQ(rng, 3 * k * k, [{ n: 2 * k * k, msg: '30°・60° は $\\sqrt{3}$。' }, { n: 4 * k * k }], () => dist(P.C, P.A)) },
        ];
      },
    },
    {
      id: 'py-l3',
      title: '座標と空間',
      unlocks: ['py-coord', 'py-space'],
      build(rng) {
        const A = [-2, -1], B = [rng.int(1, 3), rng.int(1, 3)];
        const dx = B[0] - A[0], dy = B[1] - A[1];
        const a = 3, b = 4, c = rng.pick([5, 12]);
        return [
          { text: '2点の距離は、その2点を結ぶ線を斜辺とする直角三角形で考える。', fig: plane({ x: [-4, 4], y: [-3, 4], pts: [{ p: A, label: 'A' }, { p: B, label: 'B' }], segs: [[A, B], [A, [B[0], A[1]]], [[B[0], A[1]], B]] }) },
          { text: 'よこの長さ（$x$ 座標の差）は？', q: { ...numAns([{ key: 'v', text: 'よこ' }], { v: dx }), check: { kind: 'value', expr: `${B[0]}-(${A[0]})` } } },
          { text: 'たての長さ（$y$ 座標の差）は？', q: { ...numAns([{ key: 'v', text: 'たて' }], { v: dy }), check: { kind: 'value', expr: `${B[1]}-(${A[1]})` } } },
          { text: 'AB の長さは？', q: lenQ(rng, dx * dx + dy * dy, [{ n: (dx + dy) ** 2 }], () => dist(A, B)) },
          { text: `直方体の対角線は、3辺の2乗をたして √。たて ${a}、よこ ${b}、高さ ${c} なら？`, fig: solid('cuboid', { a: `${b}cm`, b: `${a}cm`, c: `${c}cm`, diag: true, dims: [b, a, c] }), q: lenQ(rng, a * a + b * b + c * c, [{ n: a * a + b * b, msg: '高さも入れる。' }], () => Math.hypot(a, b, c)) },
        ];
      },
    },
  ],
};
