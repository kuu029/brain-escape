import { numAns, m } from '../kit.js';
import { F, near } from './kit3.js';
import { solid } from './fig.js';

const PI = (key = 'v', unit = 'cm³') => [{ key, text: '', suffix: `π ${unit}` }];
const NOTE = '（$\\pi$ を使って）';
const piAns = (v, wrong = [], unit = 'cm³') => numAns(PI('v', unit), { v }, { wrong: wrong.filter((w) => w && w.v).map((w) => ({ vals: { v: w.v }, msg: w.msg })) });

function genPrism(rng) {
  if (rng.chance(0.6)) {
    const r = rng.int(2, 6), h = rng.int(3, 10);
    return {
      stem: `底面の半径が ${m(r)} cm、高さが ${m(h)} cm の円柱の体積は？${NOTE}`,
      fig: solid('cylinder', { r: `${r}cm`, h: `${h}cm` }),
      ...piAns(r * r * h, [{ v: 2 * r * h, msg: '底面積は $\\pi r^{2}$（半径の2乗）。' }, { v: F(r * r * h, 3), msg: '$\\frac{1}{3}$ をかけるのは錐（すい）のとき。柱はそのまま。' }]),
      hint: '柱の体積 = 底面積 × 高さ。円の面積は $\\pi r^{2}$。',
      steps: [`底面積 ${m(`\\pi \\times ${r}^{2}=${r * r}\\pi`)}`, `${m(`${r * r}\\pi \\times ${h}=${r * r * h}\\pi`)}`],
      check: { kind: 'value', expr: `${r}^{2}\\times ${h}` },
    };
  }
  const a = rng.int(2, 8), b = rng.int(2, 8), h = rng.int(3, 10);
  return {
    stem: `底面が直角をはさむ2辺 ${m(a)} cm、${m(b)} cm の直角三角形で、高さが ${m(h)} cm の三角柱の体積は？`,
    fig: solid('prism3', { a: `${a}cm`, h: `${h}cm` }),
    ...numAns([{ key: 'v', text: '', suffix: 'cm³' }], { v: F(a * b * h, 2) }, { wrong: [{ vals: { v: a * b * h }, msg: '三角形の面積は「× $\\frac{1}{2}$」。' }, { vals: { v: F(a * b * h, 6) }, msg: '$\\frac{1}{3}$ は錐のとき。' }] }),
    hint: '底面積（三角形 $\\frac{1}{2}\\times a\\times b$）× 高さ。',
    steps: [`底面積 ${m(`\\frac{1}{2}\\times ${a}\\times ${b}`)}`, `× 高さ ${m(h)}`],
    check: { kind: 'value', expr: `\\frac{1}{2}\\times ${a}\\times ${b}\\times ${h}` },
  };
}

function genPyramid(rng) {
  if (rng.chance(0.6)) {
    let r, h;
    do { r = rng.int(2, 6); h = rng.int(3, 12); } while ((r * r * h) % 3);
    return {
      stem: `底面の半径が ${m(r)} cm、高さが ${m(h)} cm の円錐の体積は？${NOTE}`,
      fig: solid('cone', { r: `${r}cm`, h: `${h}cm` }),
      ...piAns((r * r * h) / 3, [{ v: r * r * h, msg: '錐の体積は、柱の $\\frac{1}{3}$。' }, { v: F(2 * r * h, 3), msg: '底面積は $\\pi r^{2}$。' }]),
      hint: '錐（すい）の体積 = $\\frac{1}{3}$ × 底面積 × 高さ',
      steps: [`${m(`\\frac{1}{3}\\times \\pi \\times ${r}^{2}\\times ${h}=${(r * r * h) / 3}\\pi`)}`],
      check: { kind: 'value', expr: `\\frac{1}{3}\\times ${r}^{2}\\times ${h}` },
    };
  }
  let a, h;
  do { a = rng.int(2, 8); h = rng.int(3, 12); } while ((a * a * h) % 3);
  return {
    stem: `底面が1辺 ${m(a)} cm の正方形で、高さが ${m(h)} cm の正四角錐の体積は？`,
    fig: solid('pyramid4', { a: `${a}cm`, h: `${h}cm` }),
    ...numAns([{ key: 'v', text: '', suffix: 'cm³' }], { v: (a * a * h) / 3 }, { wrong: [{ vals: { v: a * a * h }, msg: '錐は $\\frac{1}{3}$ をかける。' }] }),
    hint: '錐の体積 = $\\frac{1}{3}$ × 底面積 × 高さ',
    steps: [`${m(`\\frac{1}{3}\\times ${a}^{2}\\times ${h}=${(a * a * h) / 3}`)}`],
    check: { kind: 'value', expr: `\\frac{1}{3}\\times ${a}^{2}\\times ${h}` },
  };
}

function genSphere(rng) {
  const r = rng.int(1, 6);
  const byD = rng.chance(0.4);
  const size = byD ? `直径 ${m(2 * r)} cm` : `半径 ${m(r)} cm`;
  const fig = solid('sphere', { r: byD ? '' : `${r}cm` });
  if (rng.chance(0.25)) {
    // 半球の体積
    return {
      stem: `${size} の球を半分に切った半球の体積は？${NOTE}`,
      fig,
      ...piAns(F(2 * r ** 3, 3), [{ v: F(4 * r ** 3, 3), msg: '半分に切ったので、球の体積の半分。' }, byD && { v: F(16 * r ** 3, 3), msg: '半径は直径の半分。' }]),
      hint: '球の体積 $\\frac{4}{3}\\pi r^{3}$ の半分。',
      steps: [`半径 ${m(r)}`, `${m(`\\frac{4}{3}\\pi \\times ${r}^{3}\\div 2`)}`],
      check: { kind: 'value', expr: `\\frac{4}{3}\\times ${r}^{3}\\div 2` },
    };
  }
  if (rng.chance(0.5)) {
    return {
      stem: `${size} の球の体積は？${NOTE}`,
      fig,
      ...piAns(F(4 * r ** 3, 3), [{ v: 4 * r * r, msg: 'それは表面積の式。体積は $\\frac{4}{3}\\pi r^{3}$。' }, { v: F(4 * r * r, 3), msg: '体積は $r$ の3乗。' }]),
      hint: '球の体積 $V=\\frac{4}{3}\\pi r^{3}$（身の上に心配あーる参上）',
      steps: [`${m(`\\frac{4}{3}\\times \\pi \\times ${r}^{3}`)}`],
      check: { kind: 'value', expr: `\\frac{4}{3}\\times ${r}^{3}` },
    };
  }
  return {
    stem: `${size} の球の表面積は？${NOTE}`,
    fig,
    ...piAns(4 * r * r, [{ v: F(4 * r ** 3, 3), msg: 'それは体積。表面積は $4\\pi r^{2}$。' }, { v: r * r, msg: '球の表面積は、同じ半径の円の面積の4倍。' }], 'cm²'),
    hint: '球の表面積 $S=4\\pi r^{2}$（心配ある事情）',
    steps: [`${m(`4\\times \\pi \\times ${r}^{2}=${4 * r * r}\\pi`)}`],
    check: { kind: 'value', expr: `4\\times ${r}^{2}` },
  };
}

function genSurface(rng) {
  if (rng.chance(0.5)) {
    const r = rng.int(2, 5), h = rng.int(3, 9);
    return {
      stem: `底面の半径が ${m(r)} cm、高さが ${m(h)} cm の円柱の表面積は？${NOTE}`,
      fig: solid('cylinder', { r: `${r}cm`, h: `${h}cm` }),
      ...piAns(2 * r * r + 2 * r * h, [{ v: r * r + 2 * r * h, msg: '底面は上と下の2つ！' }, { v: 2 * r * r + r * h, msg: '側面の横の長さは円周（$2\\pi r$）。' }], 'cm²'),
      hint: '表面積 = 底面積 × 2 + 側面積。側面は「高さ × 円周」の長方形。',
      steps: [`底面 ${m(`\\pi \\times ${r}^{2}\\times 2=${2 * r * r}\\pi`)}`, `側面 ${m(`${h}\\times 2\\pi \\times ${r}=${2 * r * h}\\pi`)}`, `合計 ${m(`${2 * r * r + 2 * r * h}\\pi`)}`],
      check: { kind: 'value', expr: `2\\times ${r}^{2}+${h}\\times 2\\times ${r}` },
    };
  }
  const r = rng.int(2, 5), l = rng.int(r + 2, 12);
  return {
    stem: `底面の半径が ${m(r)} cm、母線の長さが ${m(l)} cm の円錐の表面積は？${NOTE}`,
    fig: solid('cone', { r: `${r}cm`, l: `${l}cm` }),
    ...piAns(r * r + r * l, [{ v: r * l, msg: '底面（円）もわすれずに足す。' }, { v: r * r + 2 * r * l, msg: '側面（おうぎ形）の面積は $\\pi \\times$ 母線 $\\times$ 半径。' }], 'cm²'),
    hint: '円錐の側面積 = $\\pi\\times$ 母線 $\\times$ 底面の半径。これに底面積を足す。',
    steps: [`側面 ${m(`\\pi \\times ${l}\\times ${r}=${l * r}\\pi`)}`, `底面 ${m(`${r * r}\\pi`)}`, `合計 ${m(`${r * r + r * l}\\pi`)}`],
    check: { kind: 'value', expr: `${l}\\times ${r}+${r}^{2}` },
  };
}

// 直方体 ABCD-EFGH の辺の位置関係（3次元の座標で判定）
const V3 = { A: [0, 1, 1], B: [1, 1, 1], C: [1, 0, 1], D: [0, 0, 1], E: [0, 1, 0], F: [1, 1, 0], G: [1, 0, 0], H: [0, 0, 0] };
const EDGES = ['AB', 'BC', 'CD', 'DA', 'EF', 'FG', 'GH', 'HE', 'AE', 'BF', 'CG', 'DH'];
const sub3 = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function relation(e1, e2) {
  const [p1, p2] = [V3[e1[0]], V3[e1[1]]], [q1, q2] = [V3[e2[0]], V3[e2[1]]];
  const d1 = sub3(p2, p1), d2 = sub3(q2, q1);
  const c = cross(d1, d2);
  if (dot(c, c) === 0) return 'parallel';
  // 同じ平面上にあれば交わる（平行でないので）
  return dot(sub3(q1, p1), c) === 0 ? (dot(d1, d2) === 0 ? 'perp' : 'meet') : 'skew';
}
const REL = { parallel: '平行な辺', perp: '垂直に交わる辺', skew: 'ねじれの位置にある辺' };

function genCubeRel(rng) {
  const e = rng.pick(EDGES);
  const rel = rng.pick(['parallel', 'perp', 'skew']);
  const count = EDGES.filter((x) => x !== e && relation(e, x) === rel).length;
  const wrong = { parallel: [{ v: 4, msg: '同じ向きの辺は、自分以外に3本。' }], perp: [{ v: 8, msg: '垂直に交わるのは、両はしの頂点から出る辺だけ。' }, { v: 2 }], skew: [{ v: 8, msg: '平行でも交わりもしない辺だけ数える。' }, { v: 3 }] }[rel];
  return {
    stem: `直方体 ABCD-EFGH で、辺 ${e} と${REL[rel]}は何本ある？`,
    fig: solid('cuboid', { v: true, hl: [[e[0], e[1]]] }),
    ...numAns([{ key: 'v', text: '', suffix: '本' }], { v: count }, { wrong: wrong.filter((w) => w.v !== count).map((w) => ({ vals: { v: w.v }, msg: w.msg })) }),
    hint: 'ねじれの位置 = 平行でもなく、交わりもしない（同じ平面上にない）2直線。',
    steps: [`辺 ${e} と${REL[rel]}: ${EDGES.filter((x) => x !== e && relation(e, x) === rel).join('、')}`, `${count} 本`],
    check: { kind: 'fn', verify: (v) => v.v === EDGES.filter((x) => x !== e && relation(e, x) === rel).length },
  };
}

export default {
  id: 'solids',
  stage: 3,
  area: '洞窟',
  title: '空間図形',
  emoji: '🧊',
  prereqs: ['fractions-decimals'],
  tool: 'wall',
  hintCard: [
    '柱の体積 = 底面積 × 高さ、錐の体積 = $\\frac{1}{3}$ × 底面積 × 高さ',
    '球: 体積 $\\frac{4}{3}\\pi r^{3}$、表面積 $4\\pi r^{2}$',
    '円錐の側面積 = $\\pi$ × 母線 × 半径',
    'ねじれの位置: 平行でも交わりもしない2直線',
  ],
  generators: {
    'so-prism': { difficulty: 1, gen: genPrism },
    'so-pyramid': { difficulty: 2, gen: genPyramid },
    'so-sphere': { difficulty: 2, gen: genSphere },
    'so-surface': { difficulty: 2, gen: genSurface },
    'so-cube-rel': { difficulty: 2, gen: genCubeRel },
  },
  lessons: [
    {
      id: 'so-l1',
      title: '柱の体積',
      unlocks: ['so-prism'],
      build(rng) {
        const r = rng.int(2, 4), h = rng.int(4, 8);
        return [
          { text: '角柱・円柱の体積は「底面積 × 高さ」。底面を高さの分だけ積み重ねるイメージ。', fig: solid('cylinder', { r: `${r}cm`, h: `${h}cm` }) },
          { text: `底面は半径 ${r}cm の円。面積は ${m('\\pi r^{2}')}。何 ${m('\\pi')} cm²？`, q: { ...numAns(PI('v', 'cm²'), { v: r * r }, { wrong: [{ vals: { v: 2 * r }, msg: '$r^{2}$ は $r\\times r$。' }] }), check: { kind: 'value', expr: `${r}^{2}` } } },
          { text: `高さ ${h}cm をかけると、体積は？`, q: { ...numAns(PI(), { v: r * r * h }), check: { kind: 'value', expr: `${r}^{2}\\times ${h}` } } },
        ];
      },
    },
    {
      id: 'so-l2',
      title: '錐と球',
      unlocks: ['so-pyramid', 'so-sphere'],
      build(rng) {
        const r = 3, h = rng.pick([4, 5, 7]);
        return [
          { text: '円錐・角錐の体積は、同じ底面・同じ高さの柱の $\\frac{1}{3}$。', fig: solid('cone', { r: `${r}cm`, h: `${h}cm` }) },
          { text: `この円錐の体積は？（底面積 ${m(`${r * r}\\pi`)}、高さ ${h}）`, q: { ...numAns(PI(), { v: (r * r * h) / 3 }, { wrong: [{ vals: { v: r * r * h }, msg: '$\\frac{1}{3}$ をかける！' }] }), check: { kind: 'value', expr: `\\frac{1}{3}\\times ${r}^{2}\\times ${h}` } } },
          { text: '球の体積は $\\frac{4}{3}\\pi r^{3}$。半径 3cm の球なら？', fig: solid('sphere', { r: '3cm' }), q: { ...numAns(PI(), { v: 36 }), check: { kind: 'value', expr: '\\frac{4}{3}\\times 3^{3}' } } },
          { text: '球の表面積は $4\\pi r^{2}$。半径 3cm の球なら？', q: { ...numAns(PI('v', 'cm²'), { v: 36 }), check: { kind: 'value', expr: '4\\times 3^{2}' } } },
        ];
      },
    },
    {
      id: 'so-l3',
      title: '表面積と辺の位置関係',
      unlocks: ['so-surface', 'so-cube-rel'],
      build(rng) {
        const e = rng.pick(['AB', 'AD', 'AE']);
        return [
          { text: '表面積 = すべての面の面積の合計。円柱なら、底面2つ＋側面（高さ × 円周の長方形）。', fig: solid('cylinder', { r: '2cm', h: '5cm' }) },
          { text: '半径 2cm、高さ 5cm の円柱の側面積は？（横の長さ = 円周 $2\\pi\\times 2$）', q: { ...numAns(PI('v', 'cm²'), { v: 20 }, { wrong: [{ vals: { v: 10 }, msg: '円周は $2\\pi r$（直径 × π）。' }] }), check: { kind: 'value', expr: '5\\times 2\\times 2' } } },
          { text: `空間では、2本の直線が「平行」「交わる」のほかに、どちらでもない「ねじれの位置」がある。直方体で辺 ${e} を見てみよう。`, fig: solid('cuboid', { v: true, hl: [[e[0], e[1]]] }) },
          { text: `辺 ${e} と平行な辺は何本？`, q: { ...numAns([{ key: 'v', text: '', suffix: '本' }], { v: 3 }), check: { kind: 'fn', verify: (v) => v.v === EDGES.filter((x) => x !== e && x !== e.split('').reverse().join('') && relation(e, x) === 'parallel').length } } },
          { text: `辺 ${e} とねじれの位置にある辺は何本？（平行でも交わりもしない）`, q: { ...numAns([{ key: 'v', text: '', suffix: '本' }], { v: 4 }), check: { kind: 'fn', verify: (v) => v.v === EDGES.filter((x) => relation(e, x) === 'skew').length } } },
        ];
      },
    },
  ],
};
