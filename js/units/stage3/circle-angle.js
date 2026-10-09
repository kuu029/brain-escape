import { m } from '../kit.js';
import { degAns, measured } from './kit3.js';
import { geo, angleAt, polar } from './fig.js';

const O = [0, 0];
const on = (d) => polar(O, 1, d);
const C1 = [{ c: 'O', r: 1 }];

// 弧 AB（下側）と、中心角 c
function arcAB(c) {
  return { A: on(270 - c / 2), B: on(270 + c / 2) };
}

function genCenter(rng) {
  const c = rng.int(20, 80) * 2;
  const { A, B } = arcAB(c);
  const P = on(90 + rng.int(-6, 6) * 7);
  const pts = { O, A, B, P };
  const segs = [['O', 'A'], ['O', 'B'], ['P', 'A'], ['P', 'B']];
  const askIns = rng.chance(0.55);
  return {
    stem: `図で、点 O は円の中心。${m('\\angle x')} は？`,
    fig: geo({ pts, segs, circles: C1, angles: askIns ? [{ at: 'O', from: 'A', to: 'B', label: `${c}°` }, { at: 'P', from: 'A', to: 'B', label: 'x', hl: true }] : [{ at: 'P', from: 'A', to: 'B', label: `${c / 2}°` }, { at: 'O', from: 'A', to: 'B', label: 'x', hl: true }] }),
    ...degAns(askIns ? c / 2 : c, askIns ? [{ v: c, msg: '円周角は中心角の半分。' }, { v: 180 - c }] : [{ v: c / 4, msg: '中心角は円周角の2倍。' }, { v: c / 2 }]),
    hint: '1つの弧に対する円周角は、その弧に対する中心角の半分。',
    steps: [`${m('\\angle APB')}（円周角）と ${m('\\angle AOB')}（中心角）は、どちらも弧 AB に対する角`, '円周角の定理: 円周角は、同じ弧に対する中心角の半分', askIns ? `${m(`x=${c}^{\\circ}\\div 2=${c / 2}^{\\circ}`)}` : `中心角は円周角の2倍: ${m(`x=${c / 2}^{\\circ}\\times 2=${c}^{\\circ}`)}`],
    check: measured(() => (askIns ? angleAt(A, P, B) : angleAt(A, O, B))),
  };
}

function genSame(rng) {
  const c = rng.int(20, 80) * 2;
  const { A, B } = arcAB(c);
  const t1 = 90 + rng.int(3, 9) * 7, t2 = 90 - rng.int(3, 9) * 7;
  const P = on(t1), Q = on(t2);
  const a = c / 2;
  return {
    stem: `図で、${m('\\angle x')} は？`,
    fig: geo({ pts: { A, B, P, Q, _O: O }, segs: [['P', 'A'], ['P', 'B'], ['Q', 'A'], ['Q', 'B']], circles: [{ c: '_O', r: 1 }], angles: [{ at: 'P', from: 'A', to: 'B', label: `${a}°` }, { at: 'Q', from: 'A', to: 'B', label: 'x', hl: true }] }),
    ...degAns(a, [{ v: 2 * a, msg: '同じ弧 AB に対する円周角どうしは等しい。' }, { v: 180 - a }]),
    hint: '同じ弧に対する円周角は等しい。',
    steps: ['どちらも弧 AB に対する円周角 → 等しい', `${m(`x=${a}^{\\circ}`)}`],
    check: measured(() => angleAt(A, Q, B)),
  };
}

function genDiam(rng) {
  const al = rng.int(4, 14) * 5;
  const below = rng.chance(0.5), askB = rng.chance(0.5);
  const A = [-1, 0], B = [1, 0], C = on(below ? -2 * al : 2 * al);
  const given = askB ? al : 90 - al;
  return {
    stem: `図で、線分 AB は円 O の直径。${m('\\angle x')} は？`,
    fig: geo({ pts: { O, A, B, C }, segs: [['A', 'B'], ['A', 'C'], ['C', 'B']], circles: C1, angles: askB
      ? [{ at: 'A', from: 'B', to: 'C', label: `${al}°` }, { at: 'B', from: 'C', to: 'A', label: 'x', hl: true }]
      : [{ at: 'B', from: 'C', to: 'A', label: `${90 - al}°` }, { at: 'A', from: 'B', to: 'C', label: 'x', hl: true }] }),
    ...degAns(90 - given, [{ v: 180 - 2 * given, msg: '半円の弧に対する円周角は 90°。∠ACB = 90° を使う。' }, { v: given, msg: '∠ACB = 90°。残りは？' }]),
    hint: '直径に対する円周角は 90°（∠ACB = 90°）。',
    steps: ['∠ACB = 90°（直径の円周角）', `${m(`x=180^{\\circ}-90^{\\circ}-${given}^{\\circ}=${90 - given}^{\\circ}`)}`],
    check: measured(() => (askB ? angleAt(C, B, A) : angleAt(B, A, C))),
  };
}

function genMix(rng) {
  const c = rng.int(20, 70) * 2;
  const { A, B } = arcAB(c);
  const P = on(90 + rng.int(-5, 5) * 6);
  const a = c / 2;
  const type = rng.int(0, 1);
  if (type === 0) {
    return {
      stem: `図で、点 O は円の中心。${m('\\angle x')}（∠OAB）は？`,
      fig: geo({ pts: { O, A, B, P }, segs: [['O', 'A'], ['O', 'B'], ['A', 'B'], ['P', 'A'], ['P', 'B']], circles: C1, ticks: [['O', 'A'], ['O', 'B']], angles: [{ at: 'P', from: 'A', to: 'B', label: `${a}°` }, { at: 'A', from: 'O', to: 'B', label: 'x', hl: true }] }),
      ...degAns(90 - a, [{ v: a, msg: 'まず中心角 ∠AOB を出す（円周角の2倍）。' }, { v: 180 - 2 * a }]),
      hint: '中心角 ∠AOB = 円周角 × 2。OA = OB（半径）なので △OAB は二等辺三角形。',
      steps: [`${m(`\\angle AOB=${a}^{\\circ}\\times 2=${c}^{\\circ}`)}`, `${m(`x=(180^{\\circ}-${c}^{\\circ})\\div 2=${90 - a}^{\\circ}`)}`],
      check: measured(() => angleAt(O, A, B)),
    };
  }
  // 直径 AB と、同じ弧の円周角
  const al = rng.int(4, 14) * 5;
  const A2 = [-1, 0], B2 = [1, 0], C = on(2 * al), D = on(-90 + rng.int(-4, 4) * 8);
  return {
    stem: `図で、線分 AB は円 O の直径。${m('\\angle x')}（∠ADC）は？`,
    fig: geo({ pts: { O, A: A2, B: B2, C, D }, segs: [['A', 'B'], ['A', 'C'], ['C', 'B'], ['D', 'A'], ['D', 'C']], circles: C1, angles: [{ at: 'A', from: 'B', to: 'C', label: `${al}°` }, { at: 'D', from: 'A', to: 'C', label: 'x', hl: true }] }),
    ...degAns(90 - al, [{ v: al, msg: '∠ADC は弧 AC の円周角。同じ弧 AC の円周角 ∠ABC を求めよう。' }, { v: 90 + al }]),
    hint: '∠ACB = 90°（直径）→ ∠ABC を出す。∠ADC は ∠ABC と同じ弧 AC の円周角。',
    steps: [`${m(`\\angle ABC=90^{\\circ}-${al}^{\\circ}=${90 - al}^{\\circ}`)}`, `同じ弧 AC の円周角 → ${m(`x=${90 - al}^{\\circ}`)}`],
    check: measured(() => angleAt(A2, D, C)),
  };
}

export default {
  id: 'circle-angle',
  stage: 3,
  area: '湖のほとり',
  title: '円周角',
  emoji: '⭕',
  prereqs: ['congruence'],
  tool: 'double',
  hintCard: [
    '円周角 = 同じ弧に対する中心角の半分',
    '同じ弧に対する円周角は等しい',
    '直径（半円の弧）に対する円周角は 90°',
    '半径は等しい → 中心と弦でできる三角形は二等辺三角形',
  ],
  generators: {
    'ca-center': { difficulty: 1, gen: genCenter },
    'ca-same': { difficulty: 1, gen: genSame },
    'ca-diam': { difficulty: 2, gen: genDiam },
    'ca-mix': { difficulty: 3, gen: genMix },
  },
  lessons: [
    {
      id: 'ca-l1',
      title: '円周角と中心角',
      unlocks: ['ca-center', 'ca-same'],
      build(rng) {
        const c = rng.pick([80, 100, 120, 140]);
        const { A, B } = arcAB(c);
        const P = on(100), Q = on(40);
        return [
          { text: '円の中心 O と弧 AB の両はしを結んだ角が中心角。円周上の点 P と A、B を結んだ角が円周角。', fig: geo({ pts: { O, A, B, P }, segs: [['O', 'A'], ['O', 'B'], ['P', 'A'], ['P', 'B']], circles: C1, angles: [{ at: 'O', from: 'A', to: 'B', label: `${c}°` }, { at: 'P', from: 'A', to: 'B', label: '?', hl: true }] }) },
          { text: '円周角は中心角の半分。∠APB は？', q: { ...degAns(c / 2, [{ v: c, msg: '半分！' }]), check: measured(() => angleAt(A, P, B)) } },
          { text: '円周上のどこに点をとっても（弧 AB の外側なら）、同じ弧 AB に対する円周角はぜんぶ等しい。', fig: geo({ pts: { A, B, P, Q, _O: O }, segs: [['P', 'A'], ['P', 'B'], ['Q', 'A'], ['Q', 'B']], circles: [{ c: '_O', r: 1 }], angles: [{ at: 'P', from: 'A', to: 'B', label: `${c / 2}°` }, { at: 'Q', from: 'A', to: 'B', label: '?', hl: true }] }) },
          { text: '∠AQB は？', q: { ...degAns(c / 2), check: measured(() => angleAt(A, Q, B)) } },
        ];
      },
    },
    {
      id: 'ca-l2',
      title: '直径と円周角',
      unlocks: ['ca-diam', 'ca-mix'],
      build(rng) {
        const al = rng.pick([25, 30, 35, 40]);
        const A = [-1, 0], B = [1, 0], C = on(2 * al);
        return [
          { text: 'AB が直径のとき、中心角 ∠AOB は 180°（一直線）。だから円周角 ∠ACB は？', fig: geo({ pts: { O, A, B, C }, segs: [['A', 'B'], ['A', 'C'], ['C', 'B']], circles: C1, angles: [{ at: 'C', from: 'A', to: 'B', label: '?', hl: true }] }), q: { ...degAns(90, [{ v: 180, msg: '円周角は中心角の半分。' }]), check: measured(() => angleAt(A, C, B)) } },
          { text: `∠CAB = ${al}° のとき、∠ABC は？（三角形の内角の和）`, fig: geo({ pts: { O, A, B, C }, segs: [['A', 'B'], ['A', 'C'], ['C', 'B']], circles: C1, angles: [{ at: 'C', from: 'A', to: 'B', right: true }, { at: 'A', from: 'B', to: 'C', label: `${al}°` }, { at: 'B', from: 'C', to: 'A', label: '?', hl: true }] }), q: { ...degAns(90 - al), check: measured(() => angleAt(C, B, A)) } },
        ];
      },
    },
  ],
};
