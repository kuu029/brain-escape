import { numAns, m } from '../kit.js';
import { degAns, measured, textChoice, near } from './kit3.js';
import { geo, angleAt, polar, add, dist, meet } from './fig.js';

// 二等辺三角形 AB=AC（底角 β）
function iso(beta) {
  const h = Math.tan((beta * Math.PI) / 180);
  return { A: [0, h], B: [-1, 0], C: [1, 0] };
}
const isoSpec = (P, angles, extra = {}) => ({ pts: P, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ...(extra.segs || [])], polys: [['A', 'B', 'C']], ticks: [['A', 'B'], ['A', 'C']], angles });

function genIso(rng) {
  const type = rng.int(0, 2);
  const v = rng.int(8, 32) * 4; // 頂角（底角が整数になるよう4の倍数）
  const beta = (180 - v) / 2;
  const P = iso(beta);
  if (type === 0) {
    return {
      stem: `${m('AB=AC')} の二等辺三角形。${m('\\angle x')} は？`,
      fig: geo(isoSpec(P, [{ at: 'A', from: 'B', to: 'C', label: `${v}°` }, { at: 'B', from: 'C', to: 'A', label: 'x', hl: true }])),
      ...degAns(beta, [{ v: 180 - v, msg: '底角は2つある（等しい）。180° から頂角をひいて、2でわる。' }, { v: v / 2 }]),
      hint: '二等辺三角形の2つの底角は等しい。',
      steps: [`二等辺三角形の2つの底角（${m('\\angle B')} と ${m('\\angle C')}）は等しい`, `底角2つぶん: ${m(`180^{\\circ}-${v}^{\\circ}=${180 - v}^{\\circ}`)}`, `1つぶん: ${m(`${180 - v}^{\\circ}\\div 2=${beta}^{\\circ}`)}`],
      check: measured(() => angleAt(P.C, P.B, P.A)),
    };
  }
  if (type === 1) {
    return {
      stem: `${m('AB=AC')} の二等辺三角形。${m('\\angle x')} は？`,
      fig: geo(isoSpec(P, [{ at: 'C', from: 'A', to: 'B', label: `${beta}°` }, { at: 'A', from: 'B', to: 'C', label: 'x', hl: true }])),
      ...degAns(v, [{ v: 180 - beta, msg: '底角は2つとも同じ大きさ。' }, { v: beta }]),
      hint: '底角が2つとも同じ → 頂角 = 180° − 底角×2。',
      steps: [`底角は2つとも等しい → ${m('\\angle B')} も ${m(`${beta}^{\\circ}`)}`, `内角の和 ${m('180^{\\circ}')} から底角2つをひく: ${m(`180^{\\circ}-${beta}^{\\circ}\\times 2=${v}^{\\circ}`)}`],
      check: measured(() => angleAt(P.B, P.A, P.C)),
    };
  }
  const D = [-2.3, 0];
  const Q = { ...P, D };
  return {
    stem: `${m('AB=AC')} の二等辺三角形で、辺 CB をのばした。${m('\\angle x')} は？`,
    fig: geo(isoSpec(Q, [{ at: 'A', from: 'B', to: 'C', label: `${v}°` }, { at: 'B', from: 'A', to: 'D', label: 'x', hl: true }], { segs: [['B', 'D']] })),
    ...degAns(180 - beta, [{ v: beta, msg: 'それは底角。x は一直線の残り（180° − 底角）。' }, { v: 180 - v }]),
    hint: 'まず底角を求めて、一直線の 180° からひく。',
    steps: [`底角は等しいので ${m(`(180^{\\circ}-${v}^{\\circ})\\div 2=${beta}^{\\circ}`)}`, `${m('x')} と底角 ${m('\\angle ABC')} で一直線（${m('180^{\\circ}')}）: ${m(`x=180^{\\circ}-${beta}^{\\circ}=${180 - beta}^{\\circ}`)}`],
    check: measured(() => angleAt(P.A, P.B, D)),
  };
}

// 平行四辺形 ABCD（A 左下、B 右下、C 右上、D 左上）
function para(alpha, w, s) {
  const A = [0, 0], B = [w, 0], D = polar(A, s, alpha);
  return { A, B, C: add(B, D), D };
}
const paraSpec = (P, angles, lens = []) => ({ pts: P, segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']], polys: [['A', 'B', 'C', 'D']], arrows: [['A', 'B', 1], ['D', 'C', 1], ['A', 'D', 2], ['B', 'C', 2]], angles, lens });

function genPara(rng) {
  const alpha = rng.int(10, 16) * 5, w = rng.int(4, 8), s = rng.int(3, Math.min(6, w));
  const P = para(alpha, w, s);
  const type = rng.int(0, 2);
  if (type < 2) {
    const askB = type === 0;
    return {
      stem: `平行四辺形 ABCD。${m('\\angle x')} は？`,
      fig: geo(paraSpec(P, [{ at: 'A', from: 'B', to: 'D', label: `${alpha}°` }, askB ? { at: 'B', from: 'C', to: 'A', label: 'x', hl: true } : { at: 'C', from: 'D', to: 'B', label: 'x', hl: true }])),
      ...degAns(askB ? 180 - alpha : alpha, [{ v: askB ? alpha : 180 - alpha, msg: askB ? 'となり合う角は合わせて 180°（向かい合う角が等しい）。' : '向かい合う角（対角）は等しい。' }]),
      hint: '平行四辺形: 向かい合う角は等しい。となり合う角の和は 180°。',
      steps: askB
        ? [`平行四辺形のとなり合う角（${m('\\angle A')} と ${m('\\angle B')}）は、たすと ${m('180^{\\circ}')}（AD と BC が平行なので）`, `${m(`x=180^{\\circ}-${alpha}^{\\circ}=${180 - alpha}^{\\circ}`)}`]
        : [`平行四辺形の向かい合う角（対角）は等しい: ${m('\\angle C=\\angle A')}`, `${m(`x=${alpha}^{\\circ}`)}`],
      check: measured(() => (askB ? angleAt(P.C, P.B, P.A) : angleAt(P.D, P.C, P.B))),
    };
  }
  return {
    stem: `平行四辺形 ABCD（${m(`AB=${w}`)} cm、${m(`AD=${s}`)} cm）の周の長さは？`,
    fig: geo(paraSpec(P, [], [{ a: 'A', b: 'B', label: `${w}cm`, side: -1 }, { a: 'D', b: 'A', label: `${s}cm`, side: -1 }])),
    ...numAns([{ key: 'v', text: '', suffix: 'cm' }], { v: 2 * (w + s) }, { wrong: [{ vals: { v: w + s }, msg: '向かい合う辺は等しいので、4本の辺を全部たす。' }] }),
    hint: '平行四辺形の向かい合う辺は等しい。',
    steps: [`平行四辺形の向かい合う辺は等しい: ${m(`CD=AB=${w}`)}、${m(`BC=AD=${s}`)}`, `4本をたす: ${m(`${w}+${s}+${w}+${s}=(${w}+${s})\\times 2=${2 * (w + s)}`)} cm`],
    check: { kind: 'fn', verify: (v) => near(v.v, dist(P.A, P.B) + dist(P.B, P.C) + dist(P.C, P.D) + dist(P.D, P.A)) },
  };
}

// 合同条件
const COND = {
  sss: '3組の辺がそれぞれ等しい',
  sas: '2組の辺とその間の角がそれぞれ等しい',
  asa: '1組の辺とその両端の角がそれぞれ等しい',
};
const NOT_COND = '3組の角がそれぞれ等しい';
// 印の付け方から合同条件を判定（検算用）
function classify(sides, angles) {
  if (sides.length === 3) return COND.sss;
  const vOf = (s) => s.split('');
  if (sides.length === 2 && angles.length === 1) {
    const shared = vOf(sides[0]).find((v) => vOf(sides[1]).includes(v));
    return shared === angles[0] ? COND.sas : null;
  }
  if (sides.length === 1 && angles.length === 2) return vOf(sides[0]).every((v) => angles.includes(v)) ? COND.asa : null;
  return null;
}

function twoTriangles(rng) {
  const b = rng.int(9, 14) * 5, c = rng.int(8, 13) * 5;
  const B = [0, 0], C = [3, 0];
  const A = meet(B, polar(B, 1, b), C, polar(C, 1, 180 - c));
  const flip = rng.chance(0.5);
  const off = 4.4;
  const T = (p) => (flip ? [off + 3 - p[0], p[1]] : [off + p[0], p[1]]);
  return { A, B, C, D: T(A), E: T(B), F: T(C) };
}

function genCondition(rng) {
  const kind = rng.pick(['sss', 'sas', 'asa']);
  const P = twoTriangles(rng);
  const corr = { A: 'D', B: 'E', C: 'F' };
  const pick = {
    sss: { sides: ['AB', 'BC', 'CA'], angles: [] },
    sas: rng.pick([{ sides: ['AB', 'BC'], angles: ['B'] }, { sides: ['BC', 'CA'], angles: ['C'] }, { sides: ['CA', 'AB'], angles: ['A'] }]),
    asa: rng.pick([{ sides: ['BC'], angles: ['B', 'C'] }, { sides: ['AB'], angles: ['A', 'B'] }, { sides: ['CA'], angles: ['C', 'A'] }]),
  }[kind];
  const ticks = [];
  pick.sides.forEach((sd, i) => {
    const [x, y] = sd.split('');
    ticks.push([x, y, i + 1], [corr[x], corr[y], i + 1]);
  });
  const others = { A: ['B', 'C'], B: ['C', 'A'], C: ['A', 'B'] };
  const angles = pick.angles.flatMap((v, i) => [
    { at: v, from: others[v][0], to: others[v][1], label: i ? '●' : '○' },
    { at: corr[v], from: corr[others[v][0]], to: corr[others[v][1]], label: i ? '●' : '○' },
  ]);
  const correct = COND[kind];
  return {
    stem: `図で、同じ印のついた辺や角は等しい。${m('\\triangle ABC\\equiv \\triangle DEF')} の合同条件は？`,
    fig: geo({ pts: P, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E'], ['E', 'F'], ['F', 'D']], polys: [['A', 'B', 'C'], ['D', 'E', 'F']], ticks, angles }),
    ...textChoice(rng, correct, [...Object.values(COND).filter((c) => c !== correct).map((c) => ({ tex: c, msg: '印のついた辺と角の数・位置を数えよう。' })), { tex: NOT_COND, msg: '角だけでは、形は同じでも大きさがちがうことがある（合同条件ではない）。' }]),
    hint: '印のついた「辺」の数と「角」の数、そして角が辺の間か両端かを見る。',
    steps: [
      `等しい印がついているのは 辺 ${pick.sides.length} 組（${pick.sides.join('、')}）${pick.angles.length ? `、角 ${pick.angles.length} 組（${pick.angles.map((v) => `∠${v}`).join('、')}）` : ''}`,
      kind === 'sss' ? '辺が3組 → 角を見なくても合同'
        : kind === 'sas' ? `角 ∠${pick.angles[0]} は、2つの辺 ${pick.sides.join(' と ')} の「間」にある`
          : `辺 ${pick.sides[0]} の「両端」の角 ∠${pick.angles.join(' と ∠')} が等しい`,
      `合同条件は3つ: 3組の辺／2組の辺とその間の角／1組の辺とその両端の角 → 「${correct}」`,
    ],
    check: { kind: 'fn', verify: (t) => t === classify(pick.sides, pick.angles) },
  };
}

// 証明の穴うめ
const REASON = {
  vert: '対頂角は等しい',
  alt: '平行線の錯角は等しい',
  corr: '平行線の同位角は等しい',
  common: '共通な辺',
  given: '仮定',
};
const PROOFS = [
  {
    setup: '$AB\\parallel DC$、$AB=DC$（O は対角線の交点）。$\\triangle ABO\\equiv \\triangle CDO$ の証明:',
    fig: () => { const A = [0, 2], B = [4, 2], D = [1, 0], C = [5, 0]; const O = meet(A, C, B, D); return geo({ pts: { A, B, C, D, O }, segs: [['A', 'B'], ['D', 'C'], ['A', 'C'], ['B', 'D']], arrows: [['A', 'B'], ['D', 'C']], ticks: [['A', 'B'], ['D', 'C']] }); },
    blanks: [
      { line: '$\\angle BAO=\\angle DCO$（【　】）', ans: REASON.alt },
      { line: '$\\angle ABO=\\angle CDO$（【　】）', ans: REASON.alt },
      { line: '$AB=CD$（【　】）', ans: REASON.given },
      { line: '以上より【　】から、$\\triangle ABO\\equiv \\triangle CDO$', ans: COND.asa },
    ],
  },
  {
    setup: '$AB=AC$、$\\angle BAD=\\angle CAD$。$\\triangle ABD\\equiv \\triangle ACD$ の証明:',
    fig: () => { const A = [0, 3], B = [-1.6, 0], C = [1.6, 0], D = [0, 0]; return geo({ pts: { A, B, C, D }, segs: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['A', 'D']], ticks: [['A', 'B'], ['A', 'C']], angles: [{ at: 'A', from: 'B', to: 'D', label: '○', r: 30 }, { at: 'A', from: 'D', to: 'C', label: '○', r: 30 }] }); },
    blanks: [
      { line: '$AB=AC$（【　】）', ans: REASON.given },
      { line: '$AD=AD$（【　】）', ans: REASON.common },
      { line: '以上より【　】から、$\\triangle ABD\\equiv \\triangle ACD$', ans: COND.sas },
    ],
  },
  {
    setup: 'AC と BD が O で交わり、$OA=OC$、$OB=OD$。$\\triangle OAB\\equiv \\triangle OCD$ の証明:',
    fig: () => { const O = [0, 0], A = [-2.2, 1.2], C = [2.2, -1.2], B = [-1.4, -1.5], D = [1.4, 1.5]; return geo({ pts: { A, B, C, D, O }, segs: [['A', 'C'], ['B', 'D'], ['A', 'B'], ['C', 'D']], ticks: [['O', 'A', 1], ['O', 'C', 1], ['O', 'B', 2], ['O', 'D', 2]] }); },
    blanks: [
      { line: '$\\angle AOB=\\angle COD$（【　】）', ans: REASON.vert },
      { line: '以上より【　】から、$\\triangle OAB\\equiv \\triangle OCD$', ans: COND.sas },
    ],
  },
];

function genProof(rng) {
  const pr = rng.pick(PROOFS);
  const bl = rng.pick(pr.blanks);
  const isCond = Object.values(COND).includes(bl.ans);
  const pool = isCond ? [...Object.values(COND).filter((x) => x !== bl.ans), NOT_COND] : Object.values(REASON).filter((x) => x !== bl.ans);
  const wrongs = rng.shuffle(pool).slice(0, 3).map((t) => ({ tex: t, msg: isCond ? 'そろっている辺と角を、もう一度数えよう。' : 'その等しさの「理由」を考えよう。' }));
  return {
    stem: `${pr.setup}\n${bl.line}`,
    fig: pr.fig(),
    ...textChoice(rng, bl.ans, wrongs),
    hint: '平行線があれば錯角・同位角、交わる2直線なら対頂角、2つの三角形にまたがる辺は共通な辺。',
    steps: [`【${bl.ans}】`],
    check: { kind: 'fn', verify: (t) => t === bl.ans },
  };
}

// 証明を組み立てる（行のタイルを並べる）: 等しい辺・角の3行（順番自由）→ 合同条件 → 結論。まちがった行が1枚まざっている
const P_ORDER = [
  {
    setup: '$AB\\parallel DC$、$AB=DC$（O は対角線の交点）のとき、$\\triangle ABO\\equiv \\triangle CDO$ を証明する。',
    fig: PROOFS[0].fig, head: '$\\triangle ABO$ と $\\triangle CDO$ で、',
    eqs: ['$\\angle BAO=\\angle DCO$（平行線の錯角）', '$\\angle ABO=\\angle CDO$（平行線の錯角）', '$AB=CD$（仮定）'],
    cond: '1組の辺とその両端の角がそれぞれ等しいから、', end: '$\\triangle ABO\\equiv \\triangle CDO$',
    trap: '$AO=BO$（仮定）', ext: '$AO=CO$',
  },
  {
    setup: '$AB=AC$、$\\angle BAD=\\angle CAD$ のとき、$\\triangle ABD\\equiv \\triangle ACD$ を証明する。',
    fig: PROOFS[1].fig, head: '$\\triangle ABD$ と $\\triangle ACD$ で、',
    eqs: ['$AB=AC$（仮定）', '$\\angle BAD=\\angle CAD$（仮定）', '$AD=AD$（共通）'],
    cond: '2組の辺とその間の角がそれぞれ等しいから、', end: '$\\triangle ABD\\equiv \\triangle ACD$',
    trap: '$\\angle B=90^\\circ$（仮定）', ext: '$BD=CD$',
  },
  {
    setup: 'AC と BD が O で交わり、$OA=OC$、$OB=OD$ のとき、$\\triangle OAB\\equiv \\triangle OCD$ を証明する。',
    fig: PROOFS[2].fig, head: '$\\triangle OAB$ と $\\triangle OCD$ で、',
    eqs: ['$OA=OC$（仮定）', '$OB=OD$（仮定）', '$\\angle AOB=\\angle COD$（対頂角）'],
    cond: '2組の辺とその間の角がそれぞれ等しいから、', end: '$\\triangle OAB\\equiv \\triangle OCD$',
    trap: '$\\angle OAB=\\angle OCD$（平行線の錯角）', ext: '$AB=CD$',
  },
  {
    setup: '平行四辺形 ABCD で、対角線 AC をひいたとき、$\\triangle ABC\\equiv \\triangle CDA$ を証明する。',
    fig: () => { const A = [1, 2.4], B = [0, 0], C = [4, 0], D = [5, 2.4]; return geo({ pts: { A, B, C, D }, segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'C']] }); },
    head: '$\\triangle ABC$ と $\\triangle CDA$ で、',
    eqs: ['$AB=CD$（平行四辺形の向かい合う辺）', '$BC=DA$（平行四辺形の向かい合う辺）', '$AC=CA$（共通）'],
    cond: '3組の辺がそれぞれ等しいから、', end: '$\\triangle ABC\\equiv \\triangle CDA$',
    trap: '$AC=BD$（平行四辺形の対角線）', ext: '$\\angle ABC=\\angle CDA$', angle: true,
  },
  {
    setup: '$AB=AC$ の二等辺三角形で、M が辺 BC の中点のとき、$\\triangle ABM\\equiv \\triangle ACM$ を証明する。',
    fig: () => { const A = [0, 3], B = [-1.6, 0], C = [1.6, 0], M = [0, 0]; return geo({ pts: { A, B, C, M }, segs: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['A', 'M']], ticks: [['A', 'B'], ['A', 'C'], ['B', 'M', 2], ['M', 'C', 2]] }); },
    head: '$\\triangle ABM$ と $\\triangle ACM$ で、',
    eqs: ['$AB=AC$（仮定）', '$BM=CM$（仮定）', '$AM=AM$（共通）'],
    cond: '3組の辺がそれぞれ等しいから、', end: '$\\triangle ABM\\equiv \\triangle ACM$',
    trap: '$\\angle BAM=\\angle ABM$（仮定）', ext: '$\\angle BAM=\\angle CAM$', angle: true,
  },
  {
    setup: '$AB\\parallel CD$、AD と BC の交点を O とする。$AO=DO$ のとき、$\\triangle ABO\\equiv \\triangle DCO$ を証明する。',
    fig: () => { const O = [0, 0], A = [-1.5, 1.5], B = [1, 1.5], C = [-1, -1.5], D = [1.5, -1.5]; return geo({ pts: { A, B, C, D, O }, segs: [['A', 'B'], ['C', 'D'], ['A', 'D'], ['B', 'C']], arrows: [['A', 'B'], ['C', 'D']], ticks: [['A', 'O'], ['O', 'D']] }); },
    head: '$\\triangle ABO$ と $\\triangle DCO$ で、',
    eqs: ['$\\angle BAO=\\angle CDO$（平行線の錯角）', '$AO=DO$（仮定）', '$\\angle AOB=\\angle DOC$（対頂角）'],
    cond: '1組の辺とその両端の角がそれぞれ等しいから、', end: '$\\triangle ABO\\equiv \\triangle DCO$',
    trap: '$\\angle ABO=\\angle DCO$（対頂角）', ext: '$AB=DC$',
  },
  {
    setup: '正方形 ABCD の辺 BC 上に点 E、辺 CD 上に点 F を、$BE=CF$ となるようにとる。$\\triangle ABE\\equiv \\triangle BCF$ を証明する。',
    fig: () => { const A = [0, 3], B = [0, 0], C = [3, 0], D = [3, 3], E = [1, 0], F = [3, 1]; return geo({ pts: { A, B, C, D, E, F }, segs: [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'], ['A', 'E'], ['B', 'F']] }); },
    head: '$\\triangle ABE$ と $\\triangle BCF$ で、',
    eqs: ['$AB=BC$（正方形の辺）', '$BE=CF$（仮定）', '$\\angle ABE=\\angle BCF$（正方形の角は $90^\\circ$）'],
    cond: '2組の辺とその間の角がそれぞれ等しいから、', end: '$\\triangle ABE\\equiv \\triangle BCF$',
    trap: '$AE=AF$（仮定）', ext: '$AE=BF$',
  },
  {
    setup: '$\\angle XOY$ の二等分線上の点 P から、辺 OX・OY に垂線 PA・PB をひく。$\\triangle OPA\\equiv \\triangle OPB$ を証明する。',
    fig: () => { const O = [0, 0], P = polar(O, 3, 25), A = [P[0], 0], X = [4, 0], Y = polar(O, 4, 50); const t = P[0] * Math.cos((50 * Math.PI) / 180) + P[1] * Math.sin((50 * Math.PI) / 180); const Bp = polar(O, t, 50); return geo({ pts: { O, P, A, B: Bp, X, Y }, segs: [['O', 'X'], ['O', 'Y'], ['O', 'P'], ['P', 'A'], ['P', 'B']] }); },
    head: '$\\triangle OPA$ と $\\triangle OPB$ で、',
    eqs: ['$\\angle PAO=\\angle PBO=90^\\circ$（仮定）', '$\\angle AOP=\\angle BOP$（仮定）', '$OP=OP$（共通）'],
    cond: '直角三角形の斜辺と1つの鋭角がそれぞれ等しいから、', end: '$\\triangle OPA\\equiv \\triangle OPB$',
    trap: '$PA=OB$（仮定）', ext: '$PA=PB$',
  },
];
function genOrder(rng) {
  const pr = rng.pick(P_ORDER);
  // 半分は「合同から、さらに辺・角が等しいことを示す」ところまで
  const more = rng.chance(0.5);
  const tail = more ? [`合同な図形の対応する${pr.angle ? '角' : '辺'}は等しいから、`, pr.ext] : [];
  const answer = [...pr.eqs, pr.cond, pr.end, ...tail];
  const tiles = rng.shuffle([...answer, pr.trap]);
  const setup = more ? pr.setup.replace(/を証明する。$/, `を示し、さらに ${pr.ext} を証明する。`) : pr.setup;
  return {
    stem: `${setup}\n証明の行を正しい順にならべよう（等しい辺・角の3行は、どの順でもOK。まちがった行が1枚まざっている）`,
    fig: pr.fig(),
    input: { kind: 'order', tiles, answer, prefix: pr.head, suffix: '', extra: 1, rows: true, blocks: [3, ...answer.slice(3).map(() => 1)] },
    answerText: [pr.head, ...answer].join('\n'),
    hint: '「等しい辺・角」を3つ（理由つき）→「合同条件」→「結論」の順。仮定に書いていないことは使えない。',
    steps: [pr.head, ...answer, `まちがいの行: ${pr.trap}（仮定や図からは言えない）`],
    check: { kind: 'proof', trap: pr.trap },
  };
}

export default {
  id: 'congruence',
  stage: 3,
  area: '森の小道',
  title: '合同・三角形と四角形',
  emoji: '🔺',
  prereqs: ['angles'],
  tool: 'heal',
  hintCard: [
    '二等辺三角形: 2つの底角は等しい',
    '平行四辺形: 向かい合う辺・角は等しい。対角線はそれぞれの中点で交わる',
    '合同条件: 3組の辺／2組の辺とその間の角／1組の辺とその両端の角',
    '証明の理由: 仮定、対頂角、平行線の錯角・同位角、共通な辺',
  ],
  generators: {
    'cg-iso': { difficulty: 1, gen: genIso },
    'cg-para': { difficulty: 1, gen: genPara },
    'cg-condition': { difficulty: 2, gen: genCondition },
    'cg-proof': { difficulty: 3, gen: genProof },
    'cg-order': { difficulty: 3, gen: genOrder },
  },
  lessons: [
    {
      id: 'cg-l1',
      title: '二等辺三角形',
      unlocks: ['cg-iso'],
      build(rng) {
        const v = rng.pick([40, 50, 70, 80, 100]);
        const beta = (180 - v) / 2;
        const P = iso(beta);
        return [
          { text: '2つの辺が等しい三角形が二等辺三角形。等しい辺にはさまれた角が頂角、残りの2つが底角。2つの底角は等しい。', fig: geo(isoSpec(P, [{ at: 'A', from: 'B', to: 'C', label: `${v}°` }, { at: 'B', from: 'C', to: 'A', label: 'x', hl: true }, { at: 'C', from: 'A', to: 'B', label: 'x', hl: true }])) },
          { text: `2つの底角の和は？（内角の和 180° から頂角 ${v}° をひく）`, q: { ...degAns(180 - v), check: measured(() => angleAt(P.C, P.B, P.A) + angleAt(P.A, P.C, P.B)) } },
          { text: '底角 $x$ は？', q: { ...degAns(beta, [{ v: 180 - v, msg: '2つ分なので、2でわる。' }]), check: measured(() => angleAt(P.C, P.B, P.A)) } },
        ];
      },
    },
    {
      id: 'cg-l2',
      title: '平行四辺形',
      unlocks: ['cg-para'],
      build(rng) {
        const alpha = rng.pick([60, 65, 70, 75]);
        const P = para(alpha, 6, 4);
        return [
          { text: '2組の向かい合う辺がそれぞれ平行な四角形が平行四辺形。向かい合う辺は等しく、向かい合う角も等しい。', fig: geo(paraSpec(P, [{ at: 'A', from: 'B', to: 'D', label: `${alpha}°` }])) },
          { text: '∠C は？（∠A と向かい合う角）', q: { ...degAns(alpha, [{ v: 180 - alpha, msg: '向かい合う角は等しい。' }]), check: measured(() => angleAt(P.D, P.C, P.B)) } },
          { text: 'となり合う角は、合わせて 180°（平行線の同側内角）。∠B は？', q: { ...degAns(180 - alpha, [{ v: alpha, msg: 'となり合う角は等しくない。合わせて 180°。' }]), check: measured(() => angleAt(P.C, P.B, P.A)) } },
        ];
      },
    },
    {
      id: 'cg-l3',
      title: '合同条件と証明',
      unlocks: ['cg-condition', 'cg-proof', 'cg-order'],
      build(rng) {
        const P = twoTriangles(rng);
        const base = { pts: P, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E'], ['E', 'F'], ['F', 'D']], polys: [['A', 'B', 'C'], ['D', 'E', 'F']] };
        return [
          { text: `ぴったり重なる図形は合同（記号 ${m('\\equiv')}）。三角形が合同になるのは次の3つのどれか:\n① 3組の辺がそれぞれ等しい\n② 2組の辺とその間の角がそれぞれ等しい\n③ 1組の辺とその両端の角がそれぞれ等しい`, fig: geo(base) },
          { text: '印のついた辺は3組。合同条件は？', fig: geo({ ...base, ticks: [['A', 'B', 1], ['D', 'E', 1], ['B', 'C', 2], ['E', 'F', 2], ['C', 'A', 3], ['F', 'D', 3]] }), q: { ...textChoice(rng, COND.sss, [COND.sas, COND.asa]), check: { kind: 'fn', verify: (t) => t === classify(['AB', 'BC', 'CA'], []) } } },
          { text: '辺1組と、その両はしの角2組。合同条件は？', fig: geo({ ...base, ticks: [['B', 'C', 1], ['E', 'F', 1]], angles: [{ at: 'B', from: 'C', to: 'A', label: '○' }, { at: 'E', from: 'F', to: 'D', label: '○' }, { at: 'C', from: 'A', to: 'B', label: '●' }, { at: 'F', from: 'D', to: 'E', label: '●' }] }), q: { ...textChoice(rng, COND.asa, [COND.sas, COND.sss, NOT_COND]), check: { kind: 'fn', verify: (t) => t === classify(['BC'], ['B', 'C']) } } },
          { text: '証明では、等しい理由も書く。2直線が交わってできる、向かい合う角が等しい理由は？', q: { ...textChoice(rng, REASON.vert, [REASON.alt, REASON.common, REASON.given]), check: { kind: 'fn', verify: (t) => t === '対頂角は等しい' } } },
        ];
      },
    },
  ],
};
