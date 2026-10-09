import { numAns, m } from '../kit.js';
import { F, near, tnum } from './kit3.js';
import { geo, dist, lerp, polyArea, add } from './fig.js';

const ONEv = [{ key: 'v', text: '大きい方' }];
const CM = (key = 'v') => [{ key, text: '', suffix: 'cm' }];
const lenAns = (v, wrong = []) => numAns(CM(), { v }, { wrong: wrong.filter((w) => w && w.v > 0).map((w) => ({ vals: { v: w.v }, msg: w.msg })) });
const measuredLen = (fn) => ({ kind: 'fn', verify: (v) => near(v.v, fn()) });

// 3辺の長さから三角形の座標（B 原点、C は x 軸上）
function tri(a, b, c, at = [0, 0]) {
  const Ax = (c * c - b * b + a * a) / (2 * a);
  const A = [Ax, Math.sqrt(Math.max(c * c - Ax * Ax, 0))];
  return { A: add(A, at), B: at, C: add([a, 0], at) };
}
const SHAPES = [[4, 5, 6], [5, 6, 7], [4, 6, 7], [5, 7, 8], [6, 7, 9], [3, 4, 5], [4, 5, 7]];
const seg3 = (a, b, c) => [[a, b], [b, c], [c, a]];

function genRatio(rng) {
  const [x, y, z] = rng.pick(SHAPES); // BC, CA, AB の比
  let m1, m2;
  do { m1 = rng.int(1, 3); m2 = rng.int(1, 4); } while (m1 === m2);
  const s = tri(x * m1, y * m1, z * m1);
  const t = tri(x * m2, y * m2, z * m2, [x * m1 + 2, 0]);
  const P = { ...s, D: t.A, E: t.B, F: t.C };
  const ask = rng.pick(['EF', 'DF']);
  const ans = ask === 'EF' ? x * m2 : y * m2;
  return {
    stem: `${m('\\triangle ABC\\sim \\triangle DEF')} のとき、${m(ask)} の長さは？`,
    fig: geo({ pts: P, segs: [...seg3('A', 'B', 'C'), ...seg3('D', 'E', 'F')], polys: [['A', 'B', 'C'], ['D', 'E', 'F']], lens: [
      { a: 'A', b: 'B', label: `${z * m1}cm` }, { a: 'B', b: 'C', label: `${x * m1}cm`, side: -1 }, { a: 'C', b: 'A', label: `${y * m1}cm` },
      { a: 'D', b: 'E', label: `${z * m2}cm` }, ask === 'EF' ? { a: 'E', b: 'F', label: 'x', side: -1 } : { a: 'F', b: 'D', label: 'x' },
    ] }),
    ...lenAns(ans, [{ v: (ask === 'EF' ? x : y) * m1 + (m2 - m1) * z, msg: '相似は「たし算」ではなく「かけ算」で大きくなる。相似比を使おう。' }, { v: ((ask === 'EF' ? x : y) * m1 * m1) / m2, msg: '相似比の向きが逆かも。' }].filter((w) => Number.isInteger(w.v))),
    hint: `対応する辺の比は等しい。AB と DE が対応 → 相似比 ${m(`AB:DE=${z * m1}:${z * m2}`)}`,
    steps: [`相似比 ${m(`${z * m1}:${z * m2}`)}`, `${m(`${ask === 'EF' ? x * m1 : y * m1}:x=${z * m1}:${z * m2}`)} → ${m(`x=${ans}`)}`],
    check: measuredLen(() => (ask === 'EF' ? dist(P.E, P.F) : dist(P.F, P.D))),
  };
}

// DE ∥ BC の三角形（AD=p, DB=q）
function parTri(rng) {
  const p = rng.int(2, 6), q = rng.int(1, 5);
  const n = p + q;
  const opts = [[1, 1], [1, 2], [2, 1], [2, 2], ...(p % 2 === 0 && q % 2 === 0 ? [[1.5, 1], [1, 1.5], [1.5, 2], [2, 1.5]] : [])];
  const [mult, w] = rng.pick(opts.filter(([a, b]) => Math.abs(1 - a) < b && b < 1 + a));
  const AB = n, AC = n * mult, BC = n * w;
  const t = tri(BC, AC, AB);
  const D = lerp(t.A, t.B, p / n), E = lerp(t.A, t.C, p / n);
  return { p, q, n, mult, w, P: { ...t, D, E } };
}

function genParallel(rng) {
  const { p, q, n, mult, w, P } = parTri(rng);
  const type = rng.int(0, 2);
  const spec = { pts: P, segs: [...seg3('A', 'B', 'C'), ['D', 'E']], polys: [['A', 'B', 'C']], arrows: [['D', 'E'], ['B', 'C']] };
  const base = `図で ${m('DE\\parallel BC')} のとき、`;
  if (type === 0) {
    return {
      stem: `${base}${m('DE')} の長さ ${m('x')} は？`,
      fig: geo({ ...spec, lens: [{ a: 'A', b: 'D', label: `${p}cm`, side: 1 }, { a: 'D', b: 'B', label: `${q}cm`, side: 1 }, { a: 'B', b: 'C', label: `${n * w}cm`, side: -1 }, { a: 'D', b: 'E', label: 'x', side: -1 }] }),
      ...lenAns(p * w, [{ v: (q * n * w) / n, msg: 'DE と対応するのは BC。AD:AB を使う（AD:DB ではない）。' }, { v: (p * n * w) / q, msg: '比べるのは AD と AB（全体）。' }].filter((x) => Number.isInteger(x.v))),
      hint: '△ADE ∽ △ABC。対応する辺: AD と AB、DE と BC。',
      steps: [`${m(`AD:AB=${p}:${n}`)}`, `${m(`x:${n * w}=${p}:${n}`)} → ${m(`x=${p * w}`)}`],
      check: measuredLen(() => dist(P.D, P.E)),
    };
  }
  if (type === 1) {
    return {
      stem: `${base}${m('EC')} の長さ ${m('x')} は？`,
      fig: geo({ ...spec, lens: [{ a: 'A', b: 'D', label: `${p}cm`, side: 1 }, { a: 'D', b: 'B', label: `${q}cm`, side: 1 }, { a: 'A', b: 'E', label: `${tnum(F(p * mult * 2, 2))}cm`, side: -1 }, { a: 'E', b: 'C', label: 'x', side: -1 }] }),
      ...lenAns(F(q * mult * 2, 2), [{ v: p * mult, msg: 'AD:DB = AE:EC。' }]),
      hint: '平行線と線分の比: AD:DB = AE:EC',
      steps: [`${m(`${p}:${q}=${tnum(F(p * mult * 2, 2))}:x`)} → ${m(`x=${tnum(F(q * mult * 2, 2))}`)}`],
      check: measuredLen(() => dist(P.E, P.C)),
    };
  }
  return {
    stem: `${base}${m('AE')} の長さ ${m('x')} は？`,
    fig: geo({ ...spec, lens: [{ a: 'A', b: 'D', label: `${p}cm`, side: 1 }, { a: 'A', b: 'B', label: `${n}cm`, side: 1 }, { a: 'C', b: 'A', label: `${tnum(F(n * mult * 2, 2))}cm`, side: 1 }, { a: 'A', b: 'E', label: 'x', side: -1 }] }),
    ...lenAns(F(p * mult * 2, 2), [{ v: q * mult, msg: 'AD:AB = AE:AC。' }]),
    hint: 'AD:AB = AE:AC',
    steps: [`${m(`${p}:${n}=x:${tnum(F(n * mult * 2, 2))}`)} → ${m(`x=${tnum(F(p * mult * 2, 2))}`)}`],
    check: measuredLen(() => dist(P.A, P.E)),
  };
}

function genMid(rng) {
  const [x, y, z] = rng.pick(SHAPES);
  const k = rng.int(1, 3);
  const t = tri(x * 2 * k, y * 2 * k, z * 2 * k);
  const M = lerp(t.A, t.B, 0.5), N = lerp(t.A, t.C, 0.5), L = lerp(t.B, t.C, 0.5);
  const P = { ...t, M, N };
  const type = rng.int(0, 2);
  const spec = { pts: P, segs: [...seg3('A', 'B', 'C'), ['M', 'N']], polys: [['A', 'B', 'C']], ticks: [['A', 'M', 1], ['M', 'B', 1], ['A', 'N', 2], ['N', 'C', 2]] };
  if (type === 0) {
    return {
      stem: `${m('\\triangle ABC')} で、点 M、N はそれぞれ辺 AB、AC の中点。${m('MN')} の長さは？`,
      fig: geo({ ...spec, lens: [{ a: 'B', b: 'C', label: `${x * 2 * k}cm`, side: -1 }] }),
      ...lenAns(x * k, [{ v: x * 4 * k, msg: 'MN は BC の「半分」。' }]),
      hint: '中点連結定理: MN ∥ BC、MN = BC の半分',
      steps: ['中点連結定理: 2辺の中点を結んだ線分 MN は、残りの辺 BC と平行で、長さは BC の半分', `${m(`MN=${x * 2 * k}\\div 2=${x * k}`)} cm`],
      check: measuredLen(() => dist(M, N)),
    };
  }
  if (type === 1) {
    return {
      stem: `${m('\\triangle ABC')} で、点 M、N はそれぞれ辺 AB、AC の中点。${m(`MN=${x * k}`)} cm のとき、${m('BC')} の長さは？`,
      fig: geo({ ...spec, lens: [{ a: 'M', b: 'N', label: `${x * k}cm`, side: -1 }] }),
      ...lenAns(x * 2 * k, [{ v: x * k / 2, msg: 'BC は MN の2倍。' }].filter((w) => Number.isInteger(w.v))),
      hint: '中点連結定理: BC = MN の2倍',
      steps: ['中点連結定理: MN は BC の半分 → 逆に、BC は MN の2倍', `${m(`BC=${x * k}\\times 2=${x * 2 * k}`)} cm`],
      check: measuredLen(() => dist(t.B, t.C)),
    };
  }
  const Q = { ...t, M, N, L };
  return {
    stem: `${m('\\triangle ABC')} の3辺の中点を L、M、N とする。${m('\\triangle LMN')} の周の長さは？`,
    fig: geo({ pts: Q, segs: [...seg3('A', 'B', 'C'), ...seg3('L', 'M', 'N')], polys: [['L', 'M', 'N']], lens: [{ a: 'A', b: 'B', label: `${z * 2 * k}cm` }, { a: 'B', b: 'C', label: `${x * 2 * k}cm`, side: -1 }, { a: 'C', b: 'A', label: `${y * 2 * k}cm` }] }),
    ...lenAns((x + y + z) * k, [{ v: (x + y + z) * 2 * k, msg: 'それは △ABC の周。それぞれ半分になる。' }]),
    hint: '中点連結定理で、△LMN の各辺は △ABC の辺の半分。',
    steps: ['中点連結定理で、△LMN の3つの辺は、それぞれ向かい合う △ABC の辺の半分', `△ABC の周は ${m(`${z * 2 * k}+${x * 2 * k}+${y * 2 * k}=${(x + y + z) * 2 * k}`)}`, `その半分: ${m(`${(x + y + z) * 2 * k}\\div 2=${(x + y + z) * k}`)} cm`],
    check: measuredLen(() => dist(L, M) + dist(M, N) + dist(N, L)),
  };
}

function genArea(rng) {
  let a, b;
  do { a = rng.int(1, 4); b = rng.int(2, 5); } while (a >= b || (a === 2 && b === 4));
  const big = rng.chance(0.5);
  if (rng.chance(0.65)) {
    const [x, y, z] = rng.pick(SHAPES);
    const s = tri(x * a, y * a, z * a), t = tri(x * b, y * b, z * b, [x * a + 2, 0]);
    const P = { ...s, D: t.A, E: t.B, F: t.C };
    const unit = rng.int(1, 4);
    const S = (big ? a * a : b * b) * unit;
    const ans = (big ? b * b : a * a) * unit;
    return {
      stem: `${m('\\triangle ABC\\sim \\triangle DEF')}（相似比 ${m(`${a}:${b}`)}）。${big ? m('\\triangle ABC') : m('\\triangle DEF')} が ${m(S)} ${m('cm^{2}')} のとき、${big ? m('\\triangle DEF') : m('\\triangle ABC')} の面積は？`,
      fig: geo({ pts: P, segs: [...seg3('A', 'B', 'C'), ...seg3('D', 'E', 'F')], polys: [['A', 'B', 'C'], ['D', 'E', 'F']] }),
      ...numAns([{ key: 'v', text: '', suffix: 'cm²' }], { v: ans }, { wrong: [{ vals: { v: big ? F(S * b, a) : F(S * a, b) }, msg: '面積比は相似比の「2乗」。' }] }),
      hint: `相似比 ${m(`m:n`)} なら、面積比は ${m('m^{2}:n^{2}')}。`,
      steps: [`面積比 ${m(`${a}^{2}:${b}^{2}=${a * a}:${b * b}`)}`, `${m(`${S}\\times \\frac{${big ? b * b : a * a}}{${big ? a * a : b * b}}=${ans}`)}`],
      check: { kind: 'fn', verify: (v) => near(v.v, big ? S * polyArea([P.D, P.E, P.F]) / polyArea([P.A, P.B, P.C]) : S * polyArea([P.A, P.B, P.C]) / polyArea([P.D, P.E, P.F])) },
    };
  }
  const unit = rng.int(1, 3);
  const V = a * a * a * unit, ans = b * b * b * unit;
  // 直方体の3辺を相似比でのばして体積をくらべる（検算用）
  const dims = [2, 3, 5];
  return {
    stem: `相似な立体 P、Q（相似比 ${m(`${a}:${b}`)}）。P の体積が ${m(V)} ${m('cm^{3}')} のとき、Q の体積は？`,
    ...numAns([{ key: 'v', text: '', suffix: 'cm³' }], { v: ans }, { wrong: [{ vals: { v: a * b * b * unit }, msg: '体積比は相似比の「3乗」。' }, { vals: { v: F(V * b, a) }, msg: '体積比は相似比の3乗。' }] }),
    hint: `相似比 ${m('m:n')} なら、体積比は ${m('m^{3}:n^{3}')}。`,
    steps: [`体積比 ${m(`${a}^{3}:${b}^{3}=${a ** 3}:${b ** 3}`)}`, `${m(`${V}\\times \\frac{${b ** 3}}{${a ** 3}}=${ans}`)}`],
    check: { kind: 'fn', verify: (v) => near(v.v, V * dims.reduce((s, d) => s * d * b, 1) / dims.reduce((s, d) => s * d * a, 1)) },
  };
}

export default {
  id: 'similarity',
  stage: 3,
  area: '山小屋',
  title: '相似',
  emoji: '🔍',
  prereqs: ['congruence'],
  tool: 'nuke',
  hintCard: [
    '相似（∽）: 形が同じで大きさがちがう。対応する辺の比は等しい',
    '$DE\\parallel BC$ なら $AD:AB=AE:AC=DE:BC$、$AD:DB=AE:EC$',
    '中点連結定理: 2辺の中点を結ぶと、残りの辺に平行で長さは半分',
    '相似比 $m:n$ → 面積比 $m^{2}:n^{2}$、体積比 $m^{3}:n^{3}$',
  ],
  generators: {
    'sm-ratio': { difficulty: 1, gen: genRatio },
    'sm-parallel': { difficulty: 2, gen: genParallel },
    'sm-mid': { difficulty: 2, gen: genMid },
    'sm-area': { difficulty: 3, gen: genArea },
  },
  lessons: [
    {
      id: 'sm-l1',
      title: '相似な図形',
      unlocks: ['sm-ratio'],
      build(rng) {
        const [x, y, z] = rng.pick(SHAPES);
        const s = tri(x, y, z), t = tri(2 * x, 2 * y, 2 * z, [x + 2, 0]);
        const P = { ...s, D: t.A, E: t.B, F: t.C };
        return [
          { text: '形が同じで、大きさだけちがう図形を「相似」という（記号 ∽）。対応する辺の比はすべて等しい。', fig: geo({ pts: P, segs: [...seg3('A', 'B', 'C'), ...seg3('D', 'E', 'F')], polys: [['A', 'B', 'C'], ['D', 'E', 'F']], lens: [{ a: 'A', b: 'B', label: `${z}cm` }, { a: 'D', b: 'E', label: `${2 * z}cm` }, { a: 'B', b: 'C', label: `${x}cm`, side: -1 }, { a: 'E', b: 'F', label: '?', side: -1 }] }) },
          { text: `AB:DE = ${z}:${2 * z} = 1:2。これが相似比。EF は BC の何倍？`, q: { ...numAns([{ key: 'v', text: '', suffix: '倍' }], { v: 2 }), check: { kind: 'fn', verify: (v) => near(v.v, dist(P.E, P.F) / dist(P.B, P.C)) } } },
          { text: 'では EF の長さは？', q: { ...lenAns(2 * x, [{ v: x + z, msg: 'たし算ではなく、かけ算。' }]), check: measuredLen(() => dist(P.E, P.F)) } },
        ];
      },
    },
    {
      id: 'sm-l2',
      title: '平行線と線分の比',
      unlocks: ['sm-parallel', 'sm-mid'],
      build(rng) {
        const { p, q, n, w, P } = parTri(rng);
        const spec = { pts: P, segs: [...seg3('A', 'B', 'C'), ['D', 'E']], polys: [['A', 'B', 'C']], arrows: [['D', 'E'], ['B', 'C']] };
        return [
          { text: 'DE ∥ BC のとき、△ADE と △ABC は相似（同位角が等しい）。', fig: geo({ ...spec, lens: [{ a: 'A', b: 'D', label: `${p}cm`, side: 1 }, { a: 'D', b: 'B', label: `${q}cm`, side: 1 }, { a: 'B', b: 'C', label: `${n * w}cm`, side: -1 }] }) },
          { text: `AD と対応するのは AB（${p} + ${q}）。AB の長さは？`, q: { ...lenAns(n), check: measuredLen(() => dist(P.A, P.B)) } },
          { text: `${m(`AD:AB=DE:BC`)}。DE の長さは？`, q: { ...lenAns(p * w, [{ v: (q * w * n) / n, msg: 'AD:AB を使う。' }].filter((x) => Number.isInteger(x.v))), check: measuredLen(() => dist(P.D, P.E)) } },
          { text: '特別な場合: D、E が中点なら、DE は BC の半分（中点連結定理）。BC = 10cm なら DE は？', q: { ...lenAns(5), check: { kind: 'fn', verify: (v) => near(v.v, 10 * 0.5) } } },
        ];
      },
    },
    {
      id: 'sm-l3',
      title: '面積比・体積比',
      unlocks: ['sm-area'],
      build(rng) {
        const b = rng.pick([2, 3]);
        return [
          { text: `1辺 1cm の正方形と、1辺 ${b}cm の正方形。相似比は 1:${b}。`, math: `1:${b}` },
          { text: `大きい正方形の面積は？（1cm² の何倍？）`, q: { ...numAns([{ key: 'v', text: '', suffix: 'cm²' }], { v: b * b }, { wrong: [{ vals: { v: b }, msg: `たて ${b} × よこ ${b}。` }] }), check: { kind: 'value', expr: `${b}\\times ${b}` } } },
          { text: `面積比は 1:${b * b}。相似比の2乗になる。では、1辺 ${b}cm の立方体の体積は？`, q: { ...numAns([{ key: 'v', text: '', suffix: 'cm³' }], { v: b ** 3 }), check: { kind: 'value', expr: `${b}\\times ${b}\\times ${b}` } } },
          { text: `体積比は 1:${b ** 3}（相似比の3乗）。相似比 2:3 の三角形の面積比は？ 小さい方を4とすると大きい方は？`, q: { ...numAns(ONEv, { v: 9 }, { wrong: [{ vals: { v: 6 }, msg: '2乗！ $2^{2}:3^{2}$' }] }), check: { kind: 'value', expr: '4\\times \\frac{9}{4}' } } },
        ];
      },
    },
  ],
};
