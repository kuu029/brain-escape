import { numAns, m } from '../kit.js';
import { degAns, measured } from './kit3.js';
import { geo, angleAt, polar, meet, add } from './fig.js';

const PAR = 'ℓ\\parallel m';
const lmTexts = (y1, y2, x) => [{ at: [x, y1 + 0.35], text: 'ℓ' }, { at: [x, y2 + 0.35], text: 'm' }];

// 平行線と1本の直線。P（ℓ 上）と Q（m 上）にできる4つずつの角
function genParallel(rng) {
  let t;
  do t = rng.int(7, 29) * 5; while (t > 75 && t < 105);
  const dir = polar([0, 0], 1, t);
  const Q = [0, 0], P = [(2 * Math.cos((t * Math.PI) / 180)) / Math.sin((t * Math.PI) / 180), 2];
  const pts = {
    _L1: [-3.2, 2], _L2: [3.2, 2], _M1: [-3.2, 0], _M2: [3.2, 0],
    _T1: add(Q, [-dir[0] * 1.3, -dir[1] * 1.3]), _T2: add(P, [dir[0] * 1.3, dir[1] * 1.3]), _P: P, _Q: Q,
  };
  // [from, to] の組。0: 右と上、1: 上と左、2: 左と下、3: 下と右（大きさは t, 180-t, t, 180-t）
  const AT = { _P: [['_L2', '_T2'], ['_T2', '_L1'], ['_L1', '_Q'], ['_Q', '_L2']], _Q: [['_M2', '_P'], ['_P', '_M1'], ['_M1', '_T1'], ['_T1', '_M2']] };
  const gi = rng.int(0, 3), ai = rng.int(0, 3);
  const g = AT._P[gi], a = AT._Q[ai];
  const given = Math.round(angleAt(pts[g[0]], P, pts[g[1]]));
  const ans = gi % 2 === ai % 2 ? given : 180 - given;
  const kind = gi === ai ? '同位角' : (gi === 2 && ai === 0) || (gi === 3 && ai === 1) ? '錯角' : (gi === 3 && ai === 0) || (gi === 2 && ai === 1) ? '同側内角（和が180°）' : gi % 2 === ai % 2 ? '同位角＋対頂角' : '一直線は180°';
  return {
    stem: `図で ${m(PAR)} のとき、${m('\\angle x')} は？`,
    fig: geo({ pts, segs: [['_L1', '_L2'], ['_M1', '_M2'], ['_T1', '_T2']], angles: [{ at: '_P', from: g[0], to: g[1], label: `${given}°` }, { at: '_Q', from: a[0], to: a[1], label: 'x', hl: true }], texts: lmTexts(2, 0, 3.5) }),
    ...degAns(ans, [{ v: 180 - ans, msg: '等しい角？ それとも合わせて180°？ 位置をよく見よう。' }]),
    hint: '平行線では、同位角・錯角は等しい。一直線の角は 180°。',
    steps: [`使うのは「${kind}」`, `${m(`\\angle x=${ans}^{\\circ}`)}`],
    check: measured(() => angleAt(pts[a[0]], Q, pts[a[1]])),
  };
}

// 平行線の間の折れ線: ∠x = a + b
function genBent(rng) {
  const a = rng.int(4, 14) * 5, b = rng.int(4, 14) * 5;
  const r = (d) => (d * Math.PI) / 180;
  const px = 2;
  const P = [px, 1];
  const A = [px - Math.cos(r(a)) / Math.sin(r(a)), 2], B = [px - Math.cos(r(b)) / Math.sin(r(b)), 0];
  const left = Math.min(A[0], B[0]) - 1.2;
  const pts = { _L1: [left, 2], _L2: [px + 1.2, 2], _M1: [left, 0], _M2: [px + 1.2, 0], A, B, P };
  const askX = rng.chance(0.6);
  const angles = askX
    ? [{ at: 'A', from: '_L2', to: 'P', label: `${a}°` }, { at: 'B', from: '_M2', to: 'P', label: `${b}°` }, { at: 'P', from: 'A', to: 'B', label: 'x', hl: true }]
    : [{ at: 'A', from: '_L2', to: 'P', label: 'x', hl: true }, { at: 'B', from: '_M2', to: 'P', label: `${b}°` }, { at: 'P', from: 'A', to: 'B', label: `${a + b}°` }];
  const ans = askX ? a + b : a;
  return {
    stem: `図で ${m(PAR)} のとき、${m('\\angle x')} は？`,
    fig: geo({ pts, segs: [['_L1', '_L2'], ['_M1', '_M2'], ['A', 'P'], ['P', 'B']], angles, hide: ['A', 'B', 'P'], texts: lmTexts(2, 0, px + 1.5) }),
    ...degAns(ans, askX ? [{ v: 180 - a - b, msg: '折れ曲がった点を通る、ℓ に平行な線をひいてみよう。' }, { v: Math.abs(a - b), msg: '2つの角の「和」になる。' }] : [{ v: a + 2 * b, msg: '大きい角 = 2つの角の和。' }]),
    hint: '折れ曲がった点を通って ℓ、m に平行な線をひくと、錯角が2つできる → $\\angle x$ は2つの角の和。',
    steps: ['折れ目に平行線をひく → 錯角が2つ', askX ? `${m(`x=${a}^{\\circ}+${b}^{\\circ}=${a + b}^{\\circ}`)}` : `${m(`x=${a + b}^{\\circ}-${b}^{\\circ}=${a}^{\\circ}`)}`],
    check: measured(() => (askX ? angleAt(A, P, B) : angleAt(pts._L2, A, P))),
  };
}

function genTriangle(rng) {
  let b, c;
  do { b = rng.int(6, 16) * 5; c = rng.int(6, 16) * 5; } while (b + c > 150);
  const B = [0, 0], C = [4, 0];
  const A = meet(B, polar(B, 1, b), C, polar(C, 1, 180 - c));
  const D = [5.6, 0];
  const a = 180 - b - c;
  const type = rng.int(0, 2);
  const pts = type === 0 ? { A, B, C } : { A, B, C, D };
  const segs = [['A', 'B'], ['B', 'C'], ['C', 'A'], ...(type ? [['C', 'D']] : [])];
  if (type === 0) {
    return {
      stem: `${m('\\triangle ABC')} で、${m('\\angle x')} は？`,
      fig: geo({ pts, segs, polys: [['A', 'B', 'C']], angles: [{ at: 'B', from: 'C', to: 'A', label: `${b}°` }, { at: 'C', from: 'A', to: 'B', label: `${c}°` }, { at: 'A', from: 'B', to: 'C', label: 'x', hl: true }] }),
      ...degAns(a, [{ v: b + c, msg: '三角形の内角の和は 180°。' }, { v: 360 - b - c, msg: '三角形の内角の和は 180°（360°は四角形）。' }]),
      hint: '三角形の内角の和は 180°。',
      steps: [`${m(`x=180^{\\circ}-${b}^{\\circ}-${c}^{\\circ}=${a}^{\\circ}`)}`],
      check: measured(() => angleAt(B, A, C)),
    };
  }
  const ext = a + b;
  const askExt = type === 1;
  return {
    stem: `図で、${m('\\angle x')} は？（B、C、D は一直線）`,
    fig: geo({ pts, segs, polys: [['A', 'B', 'C']], angles: askExt
      ? [{ at: 'A', from: 'B', to: 'C', label: `${a}°` }, { at: 'B', from: 'C', to: 'A', label: `${b}°` }, { at: 'C', from: 'A', to: 'D', label: 'x', hl: true }]
      : [{ at: 'A', from: 'B', to: 'C', label: `${a}°` }, { at: 'B', from: 'C', to: 'A', label: 'x', hl: true }, { at: 'C', from: 'A', to: 'D', label: `${ext}°` }] }),
    ...degAns(askExt ? ext : b, askExt ? [{ v: 180 - ext, msg: 'それは内角の ∠ACB。外角はとなりにない2つの内角の和。' }, { v: Math.abs(a - b), msg: '外角は、となりにない2つの内角の「和」。' }] : [{ v: ext + a, msg: '外角 = 内角2つの和 → $x$ = 外角 − もう1つの内角。' }, { v: 180 - ext, msg: 'それは ∠ACB。' }]),
    hint: '三角形の外角は、それととなり合わない2つの内角の和に等しい。',
    steps: askExt ? [`${m(`x=${a}^{\\circ}+${b}^{\\circ}=${ext}^{\\circ}`)}`] : [`${m(`${ext}^{\\circ}=${a}^{\\circ}+x`)} → ${m(`x=${b}^{\\circ}`)}`],
    check: measured(() => (askExt ? angleAt(A, C, D) : angleAt(C, B, A))),
  };
}

// 正多角形の座標（中心 O、半径1）
const regular = (n) => [...Array(n).keys()].map((k) => polar([0, 0], 1, 90 + (360 * k) / n));
const interior = (n) => { const V = regular(n); return angleAt(V[n - 1], V[0], V[1]); };

function genPolygon(rng) {
  const type = rng.int(0, 3);
  if (type === 0) {
    const n = rng.int(5, 12);
    return {
      stem: `${n}角形の内角の和は？`,
      ...degAns(180 * (n - 2), [{ v: 180 * n, msg: '$n$ 角形は対角線で $(n-2)$ 個の三角形に分けられる。' }, { v: 180 * (n - 1) }]),
      hint: '$n$ 角形の内角の和は $180^{\\circ}\\times (n-2)$。',
      steps: [`${m(`180^{\\circ}\\times (${n}-2)=${180 * (n - 2)}^{\\circ}`)}`],
      // 正 n 角形を作って、1つの内角を測って n 倍
      check: measured(() => interior(n) * n),
    };
  }
  const n = rng.pick([5, 6, 8, 9, 10, 12, 15, 18, 20]);
  const V = regular(n);
  const fig = n <= 12 ? geo({ pts: Object.fromEntries(V.map((p, i) => [`_${i}`, p])), segs: V.map((_, i) => [`_${i}`, `_${(i + 1) % n}`]), polys: [V.map((_, i) => `_${i}`)] }, { w: 200, h: 150 }) : null;
  if (type === 1) {
    return {
      stem: `正${n}角形の1つの内角は？`,
      fig,
      ...degAns(180 - 360 / n, [{ v: 360 / n, msg: 'それは1つの外角。内角 = 180° − 外角。' }, { v: 180 * (n - 2), msg: 'それは内角の和。$n$ でわる。' }]),
      hint: '外角の和は 360°。正 $n$ 角形の1つの外角は $360^{\\circ}\\div n$、内角は $180^{\\circ}-$ 外角。',
      steps: [`外角 ${m(`360^{\\circ}\\div ${n}=${360 / n}^{\\circ}`)}`, `内角 ${m(`180^{\\circ}-${360 / n}^{\\circ}=${180 - 360 / n}^{\\circ}`)}`],
      check: measured(() => interior(n)),
    };
  }
  if (type === 2) {
    return {
      stem: `正${n}角形の1つの外角は？`,
      fig,
      ...degAns(360 / n, [{ v: 180 - 360 / n, msg: 'それは内角。' }, { v: 180 / n, msg: '外角の和は 360°。' }]),
      hint: '多角形の外角の和はいつも 360°。',
      steps: [`${m(`360^{\\circ}\\div ${n}=${360 / n}^{\\circ}`)}`],
      check: measured(() => 180 - interior(n)),
    };
  }
  return {
    stem: `1つの外角が ${m(`${360 / n}^{\\circ}`)} の正多角形は、正何角形？`,
    ...numAns([{ key: 'v', text: '正', suffix: '角形' }], { v: n }, { wrong: n % 2 ? [] : [{ vals: { v: n / 2 }, msg: '外角の和は 360°（180°ではない）。' }] }),
    hint: '外角の和は 360° → $360^{\\circ}\\div$ 1つの外角 = 角の数。',
    steps: [`${m(`360\\div ${360 / n}=${n}`)}`],
    check: { kind: 'fn', verify: (v) => Number.isInteger(v.v) && v.v >= 3 && Math.abs(180 - interior(v.v) - 360 / n) < 1e-6 },
  };
}

export default {
  id: 'angles',
  stage: 3,
  area: '森の入口',
  title: '平行線と角',
  emoji: '📐',
  prereqs: ['linear-equations'],
  tool: 'freeze',
  hintCard: [
    '対頂角は等しい。一直線の角は 180°',
    '平行線では、同位角・錯角は等しい',
    '三角形の内角の和 180°、外角 = となりにない2つの内角の和',
    '$n$ 角形の内角の和 $180^{\\circ}\\times (n-2)$、外角の和は 360°',
  ],
  generators: {
    'an-parallel': { difficulty: 1, gen: genParallel },
    'an-triangle': { difficulty: 1, gen: genTriangle },
    'an-bent': { difficulty: 2, gen: genBent },
    'an-polygon': { difficulty: 2, gen: genPolygon },
  },
  lessons: [
    {
      id: 'an-l1',
      title: '平行線と角',
      unlocks: ['an-parallel', 'an-bent'],
      build(rng) {
        const t = rng.pick([50, 55, 60, 65, 70, 115, 120, 125]);
        const dir = polar([0, 0], 1, t);
        const Q = [0, 0], P = [(2 * Math.cos((t * Math.PI) / 180)) / Math.sin((t * Math.PI) / 180), 2];
        const pts = { _L1: [-3.2, 2], _L2: [3.2, 2], _M1: [-3.2, 0], _M2: [3.2, 0], _T1: add(Q, [-dir[0] * 1.3, -dir[1] * 1.3]), _T2: add(P, [dir[0] * 1.3, dir[1] * 1.3]), _P: P, _Q: Q };
        const base = { pts, segs: [['_L1', '_L2'], ['_M1', '_M2'], ['_T1', '_T2']], texts: lmTexts(2, 0, 3.5) };
        return [
          { text: `平行な2直線 ℓ、m に1本の直線が交わると、8つの角ができる。ℓ の上の ${t}° の角に注目。`, fig: geo({ ...base, angles: [{ at: '_P', from: '_L2', to: '_T2', label: `${t}°`, hl: true }] }) },
          { text: '「同位角」は、同じ位置にある角。ℓ∥m なら同位角は等しい。図の $x$ は？', fig: geo({ ...base, angles: [{ at: '_P', from: '_L2', to: '_T2', label: `${t}°` }, { at: '_Q', from: '_M2', to: '_P', label: 'x', hl: true }] }), q: { ...degAns(t, [{ v: 180 - t, msg: '同じ位置の角（同位角）は等しい。' }]), check: measured(() => angleAt(pts._M2, Q, P)) } },
          { text: '「錯角」は、2直線の内側で、Z の字の向かい合う角。これも等しい。図の $y$ は？', fig: geo({ ...base, angles: [{ at: '_P', from: '_L1', to: '_Q', label: `${t}°` }, { at: '_Q', from: '_M2', to: '_P', label: 'y', hl: true }] }), q: { ...degAns(t, [{ v: 180 - t, msg: 'Z の形の向かい合う角（錯角）は等しい。' }]), check: measured(() => angleAt(pts._M2, Q, P)) } },
          { text: '一直線は 180°。となりの角 $z$ は？', fig: geo({ ...base, angles: [{ at: '_Q', from: '_M2', to: '_P', label: `${t}°` }, { at: '_Q', from: '_P', to: '_M1', label: 'z', hl: true }] }), q: { ...degAns(180 - t, [{ v: t, msg: '一直線に並ぶ2つの角は、合わせて 180°。' }]), check: measured(() => angleAt(P, Q, pts._M1)) } },
        ];
      },
    },
    {
      id: 'an-l2',
      title: '三角形の内角と外角',
      unlocks: ['an-triangle'],
      build(rng) {
        const b = rng.pick([40, 50, 60]), c = rng.pick([55, 65, 70]);
        const B = [0, 0], C = [4, 0], A = meet(B, polar(B, 1, b), C, polar(C, 1, 180 - c)), D = [5.6, 0];
        const a = 180 - b - c;
        const pts = { A, B, C, D };
        return [
          { text: '三角形の3つの内角を合わせると 180°。', fig: geo({ pts: { A, B, C }, segs: [['A', 'B'], ['B', 'C'], ['C', 'A']], polys: [['A', 'B', 'C']], angles: [{ at: 'B', from: 'C', to: 'A', label: `${b}°` }, { at: 'C', from: 'A', to: 'B', label: `${c}°` }, { at: 'A', from: 'B', to: 'C', label: 'x', hl: true }] }) },
          { text: '$x$ は？', q: { ...degAns(a), check: measured(() => angleAt(B, A, C)) } },
          { text: `辺 BC をのばした角（外角）∠ACD は、となりにない2つの内角 ${a}° と ${b}° の和になる。`, fig: geo({ pts, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['C', 'D']], polys: [['A', 'B', 'C']], angles: [{ at: 'A', from: 'B', to: 'C', label: `${a}°` }, { at: 'B', from: 'C', to: 'A', label: `${b}°` }, { at: 'C', from: 'A', to: 'D', label: '?', hl: true }] }) },
          { text: '∠ACD は？', q: { ...degAns(a + b, [{ v: c, msg: 'それは内角の ∠ACB。' }]), check: measured(() => angleAt(A, C, D)) } },
        ];
      },
    },
    {
      id: 'an-l3',
      title: '多角形の角',
      unlocks: ['an-polygon'],
      build(rng) {
        const n = rng.pick([5, 6, 8]);
        const V = regular(n);
        const fig = geo({ pts: Object.fromEntries(V.map((p, i) => [`_${i}`, p])), segs: [...V.map((_, i) => [`_${i}`, `_${(i + 1) % n}`]), ...V.slice(2, n - 1).map((_, i) => [`_0`, `_${i + 2}`, true])], polys: [V.map((_, i) => `_${i}`)] }, { w: 200, h: 150 });
        return [
          { text: `${n}角形は、1つの頂点から対角線をひくと ${n - 2} 個の三角形に分かれる。`, fig },
          { text: `だから ${n}角形の内角の和は？`, q: { ...degAns(180 * (n - 2), [{ v: 180 * n, msg: `三角形は ${n - 2} 個。` }]), check: measured(() => interior(n) * n) } },
          { text: `正${n}角形なら、内角はすべて同じ。1つの内角は？`, q: { ...degAns(180 - 360 / n), check: measured(() => interior(n)) } },
          { text: `外角の和は、何角形でも 360°。正${n}角形の1つの外角は？`, q: { ...degAns(360 / n), check: measured(() => 180 - interior(n)) } },
        ];
      },
    },
  ],
};
