// 入試本番モード: 滋賀県 公立高校入試（数学）の形をまねた模試
//   50分・100点・大問4つ（約21問）
//   ① 基本の小問集合 ② 平面図形（角度・作図・合同の証明・相似） ③ 関数と図形 ④ 三平方の定理と空間図形
// 証明と作図は「アプリで穴うめ／並べかえ」か「紙に書いて自己採点」を選べる（q.paper に模範解答と採点の観点）
import { makeProblem, GEN } from '../units/registry.js';
import { makeRng } from '../core/rng.js';
import { m, numAns, choice } from '../units/kit.js';
import { rootChoice, rootTex, invTex, lineTex, F, tnum, near } from '../units/stage3/kit3.js';
import { geo, plane, solid, angleAt, dist, polyArea, meet, polar, lerp } from '../units/stage3/fig.js';

// ---------- 証明・作図で使うことば ----------
const R = {
  given: '仮定',
  vert: '対頂角は等しい',
  alt: '平行線の錯角は等しい',
  corr: '平行線の同位角は等しい',
  side: '共通な辺',
  angle: '共通な角',
  arc: '弧BCに対する円周角は等しい',
  iso: '二等辺三角形の底角は等しい',
};
const REASONS = Object.values(R);
const CONG = ['3組の辺がそれぞれ等しい', '2組の辺とその間の角がそれぞれ等しい', '1組の辺とその両端の角がそれぞれ等しい', '3組の角がそれぞれ等しい'];
const SIM = ['2組の角がそれぞれ等しい', '3組の辺の比がすべて等しい', '2組の辺の比とその間の角がそれぞれ等しい', '1組の辺とその両端の角がそれぞれ等しい'];
const [SSS, SAS, ASA] = CONG;
const AA = SIM[0];

// 証明のひな形。lines の【ア】が穴。blanks: { ア: [正解, 候補…] }（候補が足りなければ REASONS などから足す）
// facts(P): 図の座標で確かめる「この証明で使う等しさ」（検算テスト用）
const PROOFS = [
  {
    kind: 'cong',
    pts: () => { const A = [0, 2], B = [4, 2], D = [1, 0], C = [5, 0]; return { A, B, C, D, O: meet(A, C, B, D) }; },
    fig: (P) => geo({ pts: P, segs: [['A', 'B'], ['D', 'C'], ['A', 'C'], ['B', 'D']], arrows: [['A', 'B'], ['D', 'C']], ticks: [['A', 'B'], ['D', 'C']] }),
    setup: '図で、$AB\\parallel DC$、$AB=DC$ であり、線分 AC と BD の交点を O とする。',
    goal: '$\\triangle ABO\\equiv \\triangle CDO$',
    lines: [
      '$\\triangle ABO$ と $\\triangle CDO$ において、',
      '仮定より $AB=$【ア】 …①',
      '$AB\\parallel DC$ より、【イ】から $\\angle BAO=\\angle DCO$ …②',
      '同様に $\\angle ABO=$【ウ】 …③',
      '①、②、③より、【エ】から $\\triangle ABO\\equiv \\triangle CDO$',
    ],
    blanks: { ア: ['CD', 'CO', 'DO', 'AD'], イ: [R.alt, R.corr, R.vert, R.given], ウ: ['∠CDO', '∠DCO', '∠COD', '∠BAO'], エ: [ASA, SAS, SSS, CONG[3]] },
    facts: (P) => [near(dist(P.A, P.B), dist(P.C, P.D)), near(angleAt(P.B, P.A, P.O), angleAt(P.D, P.C, P.O)), near(angleAt(P.A, P.B, P.O), angleAt(P.C, P.D, P.O))],
  },
  {
    kind: 'cong',
    pts: () => ({ A: [0, 3], B: [-1.6, 0], C: [1.6, 0], D: [0, 0] }),
    fig: (P) => geo({ pts: P, segs: [['A', 'B'], ['A', 'C'], ['B', 'C'], ['A', 'D']], ticks: [['A', 'B'], ['A', 'C']], angles: [{ at: 'A', from: 'B', to: 'D', label: '○', r: 30 }, { at: 'A', from: 'D', to: 'C', label: '○', r: 30 }] }),
    setup: '図で、$AB=AC$、$\\angle BAD=\\angle CAD$ であり、D は辺 BC 上の点である。',
    goal: '$\\triangle ABD\\equiv \\triangle ACD$',
    lines: [
      '$\\triangle ABD$ と $\\triangle ACD$ において、',
      '仮定より $AB=AC$ …①、$\\angle BAD=$【ア】 …②',
      '【イ】だから $AD=AD$ …③',
      '①、②、③より、【ウ】から $\\triangle ABD\\equiv \\triangle ACD$',
      '合同な図形の対応する角は等しいので $\\angle ADB=$【エ】',
    ],
    blanks: { ア: ['∠CAD', '∠ACD', '∠ADC', '∠ABD'], イ: [R.side, R.given, R.angle, R.iso], ウ: [SAS, SSS, ASA, CONG[3]], エ: ['∠ADC', '∠BAD', '∠ABD', '∠DAC'] },
    facts: (P) => [near(angleAt(P.B, P.A, P.D), angleAt(P.C, P.A, P.D)), near(angleAt(P.A, P.D, P.B), angleAt(P.A, P.D, P.C))],
  },
  {
    kind: 'cong',
    pts: () => ({ O: [0, 0], A: [-2.2, 1.2], C: [2.2, -1.2], B: [-1.4, -1.5], D: [1.4, 1.5] }),
    fig: (P) => geo({ pts: P, segs: [['A', 'C'], ['B', 'D'], ['A', 'B'], ['C', 'D']], ticks: [['O', 'A', 1], ['O', 'C', 1], ['O', 'B', 2], ['O', 'D', 2]] }),
    setup: '図で、線分 AC と BD が点 O で交わり、$OA=OC$、$OB=OD$ である。',
    goal: '$\\triangle OAB\\equiv \\triangle OCD$',
    lines: [
      '$\\triangle OAB$ と $\\triangle OCD$ において、',
      '仮定より $OA=$【ア】 …①、$OB=OD$ …②',
      '【イ】から $\\angle AOB=\\angle COD$ …③',
      '①、②、③より、【ウ】から $\\triangle OAB\\equiv \\triangle OCD$',
      '合同な図形の対応する辺は等しいので $AB=$【エ】',
    ],
    blanks: { ア: ['OC', 'OD', 'CD', 'AB'], イ: [R.vert, R.alt, R.given, R.side], ウ: [SAS, SSS, ASA, CONG[3]], エ: ['CD', 'OC', 'OD', 'AC'] },
    facts: (P) => [near(dist(P.O, P.A), dist(P.O, P.C)), near(angleAt(P.A, P.O, P.B), angleAt(P.C, P.O, P.D)), near(dist(P.A, P.B), dist(P.C, P.D))],
  },
  {
    kind: 'cong',
    pts: () => ({ B: [0, 0], C: [3, 0], E: [5, 0], A: [1.5, 1.5 * Math.sqrt(3)], D: [4, Math.sqrt(3)] }),
    fig: (P) => geo({ pts: P, segs: [['A', 'B'], ['A', 'C'], ['B', 'E'], ['C', 'D'], ['D', 'E'], ['A', 'E'], ['B', 'D']] }),
    setup: '図で、$\\triangle ABC$ と $\\triangle DCE$ は正三角形で、3点 B、C、E は一直線上にある。',
    goal: '$\\triangle ACE\\equiv \\triangle BCD$',
    lines: [
      '$\\triangle ACE$ と $\\triangle BCD$ において、',
      '$\\triangle ABC$ は正三角形だから $AC=BC$ …①',
      '$\\triangle DCE$ は正三角形だから $CE=$【ア】 …②',
      '$\\angle ACE=\\angle ACD+\\angle DCE=\\angle ACD+60^{\\circ}$、$\\angle BCD=\\angle BCA+\\angle ACD=$【イ】$+\\angle ACD$',
      'よって $\\angle ACE=\\angle BCD$ …③',
      '①、②、③より、【ウ】から $\\triangle ACE\\equiv$【エ】',
    ],
    blanks: { ア: ['CD', 'DE', 'BD', 'AE'], イ: ['60°', '90°', '120°', '30°'], ウ: [SAS, SSS, ASA, CONG[3]], エ: ['△BCD', '△BCA', '△DCE', '△ABD'] },
    facts: (P) => [near(dist(P.C, P.E), dist(P.C, P.D)), near(angleAt(P.A, P.C, P.E), angleAt(P.B, P.C, P.D)), near(dist(P.A, P.E), dist(P.B, P.D))],
  },
  {
    kind: 'sim',
    pts: () => { const A = [1, 3], B = [0, 0], C = [4, 0]; return { A, B, C, D: lerp(A, B, 0.45), E: lerp(A, C, 0.45) }; },
    fig: (P) => geo({ pts: P, segs: [['A', 'B'], ['B', 'C'], ['C', 'A'], ['D', 'E']], arrows: [['D', 'E'], ['B', 'C']] }),
    setup: '図で、点 D、E はそれぞれ辺 AB、AC 上の点で、$DE\\parallel BC$ である。',
    goal: '$\\triangle ADE\\sim \\triangle ABC$',
    lines: [
      '$\\triangle ADE$ と $\\triangle ABC$ において、',
      '$DE\\parallel BC$ より、【ア】から $\\angle ADE=$【イ】 …①',
      '【ウ】だから $\\angle DAE=\\angle BAC$ …②',
      '①、②より、【エ】から $\\triangle ADE\\sim \\triangle ABC$',
    ],
    blanks: { ア: [R.corr, R.alt, R.vert, R.given], イ: ['∠ABC', '∠ACB', '∠BAC', '∠AED'], ウ: [R.angle, R.side, R.given, R.vert], エ: SIM },
    facts: (P) => [near(angleAt(P.A, P.D, P.E), angleAt(P.A, P.B, P.C)), near(angleAt(P.A, P.E, P.D), angleAt(P.A, P.C, P.B))],
  },
  {
    kind: 'sim',
    pts: () => { const O = [0, 0]; const A = polar(O, 2, 150), B = polar(O, 2, 210), C = polar(O, 2, 300), D = polar(O, 2, 40); return { O, A, B, C, D, P: meet(A, C, B, D) }; },
    fig: (P) => geo({ pts: P, hide: ['O'], circles: [{ c: 'O', r: 2 }], segs: [['A', 'C'], ['B', 'D'], ['A', 'B'], ['C', 'D']] }),
    setup: '図で、4点 A、B、C、D は円周上にあり、線分 AC と BD の交点を P とする。',
    goal: '$\\triangle ABP\\sim \\triangle DCP$',
    lines: [
      '$\\triangle ABP$ と $\\triangle DCP$ において、',
      '【ア】から $\\angle BAP=\\angle CDP$ …①',
      '【イ】から $\\angle APB=$【ウ】 …②',
      '①、②より、【エ】から $\\triangle ABP\\sim \\triangle DCP$',
    ],
    blanks: { ア: [R.arc, '弧ADに対する円周角は等しい', R.alt, R.iso], イ: [R.vert, R.arc, R.angle, R.given], ウ: ['∠DPC', '∠APD', '∠BPC', '∠PCD'], エ: SIM },
    facts: (P) => [near(angleAt(P.B, P.A, P.P), angleAt(P.C, P.D, P.P)), near(angleAt(P.A, P.P, P.B), angleAt(P.D, P.P, P.C))],
  },
];

// 作図のひな形: 手順タイル（正しい順）＋ まぎらわしいタイル1枚
const CONSTRUCT = [
  {
    name: '垂直二等分線',
    pts: () => ({ A: [0.6, 2.6], B: [0, 0], C: [4, 0] }),
    setup: '△ABC の辺 BC 上にあって、$PA=PB$ となる点 P を作図する。',
    steps: ['点A、Bをそれぞれ中心として、同じ半径の円をかく', '2つの円の交点を通る直線をひく', 'その直線と辺BCとの交点をPとする'],
    trap: '∠ABCの二等分線をひく',
    use: '線分 AB の垂直二等分線（2点 A、B から等しい距離にある点の集まり）',
  },
  {
    name: '角の二等分線',
    pts: () => ({ A: [1.2, 2.8], B: [0, 0], C: [4.4, 0] }),
    setup: '△ABC の辺 BC 上にあって、2辺 AB、AC から等しい距離にある点 P を作図する。',
    steps: ['点Aを中心とする円をかき、辺AB、ACとの交点をD、Eとする', '点D、Eをそれぞれ中心として、同じ半径の円をかく', 'その交点と点Aを通る直線をひき、辺BCとの交点をPとする'],
    trap: '辺BCの中点をPとする',
    use: '∠BAC の二等分線（角の2辺から等しい距離にある点の集まり）',
  },
  {
    name: '垂線',
    pts: () => ({ A: [1.4, 2.6], B: [0, 0], C: [4.2, 0] }),
    setup: '△ABC で、辺 BC を底辺としたときの高さ AH となるように、辺 BC 上に点 H を作図する。',
    steps: ['点Aを中心とする円をかき、直線BCとの交点をD、Eとする', '点D、Eをそれぞれ中心として、同じ半径の円をかく', 'その交点と点Aを通る直線をひき、BCとの交点をHとする'],
    trap: '点Aと辺BCの中点を結ぶ',
    use: '点 A から直線 BC への垂線',
  },
  {
    name: '接線',
    pts: () => ({ O: [0, 0], A: polar([0, 0], 1.6, 35) }),
    circle: true,
    setup: '円 O の周上の点 A を通る、円 O の接線を作図する。',
    steps: ['2点O、Aを通る直線をひく', '点Aを中心とする円をかき、直線OAとの交点をC、Dとする', '点C、Dをそれぞれ中心として同じ半径の円をかき、その交点と点Aを通る直線をひく'],
    trap: '線分OAの中点を中心とする円をかく',
    use: '点 A を通り、半径 OA に垂直な直線（接線は接点を通る半径に垂直）',
  },
];

const KANA = ['ア', 'イ', 'ウ', 'エ', 'オ'];

// ---------- 大問1: 基本の小問集合 ----------
// 各行から1つの型を選ぶ（中1〜中3を幅広く）
const BASICS = [
  ['sn-muldiv', 'sn-pow', 'sn-add'],
  ['po-addsub', 'po-mono', 'po-frac', 'ex-dist'],
  ['sr-addsub', 'sr-mixed', 'sr-expand'],
  ['ef-fac1', 'ef-fac2', 'ef-fac3'],
  ['si-add', 'si-sub', 'si-mul2', 'si-paren'],
  ['qu-fac', 'qu-fac2', 'qu-formula'],
  ['pr-inverse', 'pr-direct', 'qf-range', 'qf-rate', 'lf-two-pts'],
  ['pb-dice', 'pb-bag', 'pb-cards', 'pb-coin'],
  ['dt-quartile', 'dt-box', 'dt-center', 'so-pyramid', 'so-prism'],
];
export const BASIC_GENS = BASICS.flat();

function sec1(rng, n = 9) {
  const rows = n >= BASICS.length ? BASICS : rng.shuffle([...BASICS]).slice(0, n).sort((a, b) => BASICS.indexOf(a) - BASICS.indexOf(b));
  return {
    title: '小問集合',
    intro: '次の (1)〜(' + rows.length + ') に答えなさい。',
    qs: rows.map((row) => {
      const gid = rng.pick(row.filter((g) => GEN[g]));
      return { p: makeProblem(gid, rng.int(1, 2 ** 30)), pts: 4 };
    }),
  };
}

// ---------- 大問2: 平面図形 ----------
const ANGLE_GENS = ['an-parallel', 'an-triangle', 'an-bent', 'an-polygon', 'ca-center', 'ca-same', 'ca-diam', 'ca-mix'];
const SIM_GENS = ['sm-ratio', 'sm-parallel', 'sm-mid', 'sm-area'];

export function proofProblem(rng, T) {
  const P = T.pts();
  const keys = Object.keys(T.blanks);
  const blanks = keys.map((k) => {
    const [ans, ...rest] = T.blanks[k];
    const options = rng.shuffle([ans, ...rest]);
    return { key: k, options, answer: options.indexOf(ans) };
  });
  const filled = T.lines.map((l) => l.replace(/【(.)】/g, (_, k) => `【${T.blanks[k][0]}】`));
  return {
    p: {
      unit: 'congruence',
      stem: `${T.setup}\nこのとき ${T.goal} であることを、次のように証明した。【　】にあてはまるものを選びなさい。`,
      fig: T.fig(P),
      input: { kind: 'blanks', lines: T.lines, blanks },
      answerText: filled.join('\n'),
      steps: filled,
      hint: '等しい辺・角を3つ（相似は角2つ）そろえて、条件を言う。',
      check: { kind: 'blanks', facts: () => T.facts(P), answers: Object.fromEntries(keys.map((k) => [k, T.blanks[k][0]])) },
    },
    paper: {
      ask: `${T.setup}\nこのとき ${T.goal} であることを証明しなさい。`,
      model: filled.map((l) => l.replace(/【(.+?)】/g, '$1')),
      rubric: T.kind === 'cong'
        ? [{ text: '等しい辺・角の1つ目を、理由つきで書けた', pts: 2 }, { text: '2つ目を、理由つきで書けた', pts: 2 }, { text: '3つ目を、理由つきで書けた', pts: 2 }, { text: '合同条件と結論（≡）を正しく書けた', pts: 2 }]
        : [{ text: '等しい角の1つ目を、理由つきで書けた', pts: 3 }, { text: '2つ目を、理由つきで書けた', pts: 3 }, { text: '相似条件と結論（∽）を正しく書けた', pts: 2 }],
    },
  };
}

export function constructProblem(rng, T) {
  const P = T.pts();
  const tiles = rng.shuffle([...T.steps, T.trap]);
  const fig = T.circle
    ? geo({ pts: P, circles: [{ c: 'O', r: dist(P.O, P.A) }] })
    : geo({ pts: P, segs: [['A', 'B'], ['B', 'C'], ['C', 'A']] });
  return {
    p: {
      unit: T.circle ? 'circle-angle' : 'congruence',
      stem: `${T.setup}\n作図の手順を、正しい順にならべなさい。（1枚は使わない）`,
      fig,
      input: { kind: 'order', tiles, answer: [...T.steps], extra: 1 },
      answerText: T.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
      steps: [`使う作図: ${T.use}`, ...T.steps.map((s, i) => `${i + 1}. ${s}`)],
      hint: `使うのは「${T.name}」の作図。`,
      check: { kind: 'steps', steps: T.steps, trap: T.trap },
    },
    paper: {
      ask: `${T.setup}\n定規とコンパスを使って作図しなさい。ただし、作図に用いた線は消さずに残しておくこと。`,
      model: [`使う作図: ${T.use}`, ...T.steps.map((s, i) => `${i + 1}. ${s}`)],
      rubric: [{ text: `「${T.name}」の作図を選べた`, pts: 2 }, { text: 'コンパスの線を消さずに、手順どおりかけた', pts: 2 }, { text: '求める点（線）に記号をつけた', pts: 1 }],
    },
  };
}

function sec2(rng) {
  const pr = proofProblem(rng, rng.pick(PROOFS));
  const co = constructProblem(rng, rng.pick(CONSTRUCT));
  return {
    title: '平面図形',
    intro: '次の (1)〜(4) に答えなさい。',
    qs: [
      { p: makeProblem(rng.pick(ANGLE_GENS), rng.int(1, 2 ** 30)), pts: 5 },
      { ...co, pts: 5 },
      { ...pr, pts: 8 },
      { p: makeProblem(rng.pick(SIM_GENS), rng.int(1, 2 ** 30)), pts: 6 },
    ],
  };
}

// ---------- 大問3: 関数と図形 ----------
const V = (text, suffix = '') => [{ key: 'v', text, suffix }];

function sec3Para(rng) {
  let a, p, q;
  do {
    a = F(...rng.pick([[1, 2], [1, 1], [2, 1], [1, 4]]));
    p = -rng.int(1, 4);
    q = rng.int(1, 4);
    // 図が細長くならないよう、A・B の y 座標は 10 まで
  } while (!a.mul(p * p).isInt() || !a.mul(q * q).isInt() || !a.mul(p + q).isInt() || p + q === 0 || Math.max(a.mul(p * p).num(), a.mul(q * q).num()) > 10 || a.mul(-p * q).num() > 5);
  const A = [p, a.mul(p * p)], B = [q, a.mul(q * q)];
  const k = a.mul(p + q), b = a.mul(-p * q); // 直線 AB: y = kx + b（b > 0）
  const S = b.mul(q - p).div(2); // △OAB
  const t = rng.pick([2, 3]);
  const yP = b.mul(t + 1); // △PAB = t × △OAB となる y 軸上の点（y > 0）
  const yMax = Math.max(A[1].num(), B[1].num());
  const fig = plane({ x: [p - 1, q + 1], y: [-1, Math.ceil(yMax) + 1], fns: [{ f: (x) => a.num() * x * x }, { f: (x) => k.num() * x + b.num(), dash: true }], pts: [{ p: [p, A[1].num()], label: 'A', dx: -16 }, { p: [q, B[1].num()], label: 'B' }], polys: [[[0, 0], [p, A[1].num()], [q, B[1].num()]]], grid: false }, { w: 230, h: 210 });
  const Anum = [p, A[1].num()], Bnum = [q, B[1].num()];
  return {
    title: '関数と図形',
    intro: `図のように、関数 ${m('y=ax^{2}')} のグラフ上に2点 A、B がある。点 A の座標は ${m(`(${p},\\ ${tnum(A[1])})`)}、点 B の ${m('x')} 座標は ${m(q)} である。O は原点とする。`,
    fig,
    qs: [
      { pts: 4, p: { unit: 'quadratic-function', stem: `${m('a')} の値を求めなさい。`, ...numAns([['a', 'a']], { a }, { wrong: [{ vals: { a: A[1].mul(-1).div(p) }, msg: '$x$ は2乗してからわる。' }] }), hint: '点 A の座標を $y=ax^{2}$ に代入する。', steps: [`${m(`${tnum(A[1])}=a\\times (${p})^{2}`)} より ${m(`a=${tnum(a)}`)}`], check: { kind: 'fn', verify: (v) => near(v.a * p * p, A[1].num()) } } },
      { pts: 5, p: { unit: 'linear-function', stem: '2点 A、B を通る直線の式を求めなさい。', ...choice(rng, lineTex(k, b), [{ tex: lineTex(k.neg(), b) }, { tex: lineTex(k, b.neg()) }, { tex: lineTex(a.mul(q - p), b) }, { tex: lineTex(b, k) }]), hint: '点 B の $y$ 座標を求めて、2点を通る直線の式を出す。', steps: [`B ${m(`(${q},\\ ${tnum(B[1])})`)}`, `傾き ${m(`\\frac{${tnum(B[1])}-${tnum(A[1])}}{${q}-(${p})}=${tnum(k)}`)}`, m(lineTex(k, b))], check: { kind: 'graph', pts: [Anum, Bnum] } } },
      { pts: 5, p: { unit: 'linear-function', stem: `${m('\\triangle OAB')} の面積を求めなさい。（座標の1目もりを1cmとする）`, ...numAns(V('面積', 'cm²'), { v: S }, { wrong: [{ vals: { v: S.mul(2) }, msg: '三角形なので ÷2 をわすれずに。' }] }), hint: '直線 AB と $y$ 軸の交点で、左右2つの三角形に分ける。', steps: [`直線 AB と ${m('y')} 軸の交点は ${m(`(0,\\ ${tnum(b)})`)}`, `${m(`\\frac{1}{2}\\times ${tnum(b)}\\times ${-p}+\\frac{1}{2}\\times ${tnum(b)}\\times ${q}=${tnum(S)}`)}`], check: { kind: 'fn', verify: (v) => near(v.v, polyArea([[0, 0], Anum, Bnum])) } } },
      { pts: 6, p: { unit: 'quadratic-function', stem: `${m('y')} 軸上に、${m('y')} 座標が正の点 P をとる。${m('\\triangle PAB')} の面積が ${m('\\triangle OAB')} の面積の ${t} 倍になるとき、点 P の ${m('y')} 座標を求めなさい。`, ...numAns(V(`P の ${m('y')} 座標`), { v: yP }, { wrong: [{ vals: { v: b.mul(t) }, msg: '直線 AB と $y$ 軸の交点から上に、OB までの長さの ' + t + ' 倍。' }] }), hint: `${m('y')} 軸上の底辺（直線 AB との交点からの長さ）が、O のときの ${t} 倍になればよい。`, steps: [`直線 AB と ${m('y')} 軸の交点 ${m(`(0,\\ ${tnum(b)})`)} から O までが ${m(tnum(b))}`, `その ${t} 倍上へ: ${m(`${tnum(b)}+${tnum(b)}\\times ${t}=${tnum(yP)}`)}`], check: { kind: 'fn', verify: (v) => v.v > 0 && near(polyArea([[0, v.v], Anum, Bnum]), t * polyArea([[0, 0], Anum, Bnum])) } } },
    ],
  };
}

function sec3Inv(rng) {
  let a, p, q;
  do {
    a = rng.pick([6, 8, 12, 18, 24]);
    p = rng.pick([1, 2, 3, 4, 6].filter((d) => a % d === 0));
    q = rng.pick([2, 3, 4, 6, 8, 12].filter((d) => a % d === 0 && d > p));
  } while (!q || a / p > 16);
  const A = [p, a / p], B = [q, a / q];
  const k = F(a, q).sub(F(a, p)).div(q - p), b = F(a, p).sub(k.mul(p));
  const S = F(a * (q * q - p * p), 2 * p * q); // △OAB = |p·(a/q) − q·(a/p)| ÷ 2
  const fig = plane({ x: [-1, Math.max(q, 6) + 1], y: [-1, Math.ceil(a / p) + 1], fns: [{ f: (x) => a / x, dom: [a / (a / p + 1), Math.max(q, 6) + 1] }, { f: (x) => k.num() * x + b.num(), dash: true, dom: [0, Math.max(q, 6) + 1] }], pts: [{ p: A, label: 'A' }, { p: B, label: 'B' }], polys: [[[0, 0], A, B]], grid: false }, { w: 230, h: 210 });
  return {
    title: '関数と図形',
    intro: `図のように、関数 ${m('y=\\frac{a}{x}')}（${m('x>0')}）のグラフ上に2点 A、B がある。点 A の座標は ${m(`(${p},\\ ${a / p})`)}、点 B の ${m('x')} 座標は ${m(q)} である。O は原点とする。`,
    fig,
    qs: [
      { pts: 4, p: { unit: 'proportion', stem: `${m('a')} の値を求めなさい。`, ...numAns([['a', 'a']], { a }, { wrong: [{ vals: { a: F(a / p, p) }, msg: '$y=\\frac{a}{x}$ → $a=xy$（かけ算）。' }] }), hint: '反比例は $xy=a$（一定）。', steps: [`${m(`a=${p}\\times ${a / p}=${a}`)}`, m(invTex(a))], check: { kind: 'fn', verify: (v) => near(v.a, p * (a / p)) } } },
      { pts: 5, p: { unit: 'proportion', stem: `点 B の ${m('y')} 座標を求めなさい。`, ...numAns(V(`B の ${m('y')} 座標`), { v: F(a, q) }, { wrong: [{ vals: { v: a * q }, msg: '$y=\\frac{a}{x}$ なので、わり算。' }] }), hint: `${m(invTex(a))} に ${m(`x=${q}`)} を代入。`, steps: [`${m(`y=\\frac{${a}}{${q}}=${tnum(F(a, q))}`)}`], check: { kind: 'fn', verify: (v) => near(v.v * q, a) } } },
      { pts: 5, p: { unit: 'linear-function', stem: '2点 A、B を通る直線の式を求めなさい。', ...choice(rng, lineTex(k, b), [{ tex: lineTex(k.neg(), b) }, { tex: lineTex(k, b.neg()) }, { tex: lineTex(k, F(a / q)) }, { tex: lineTex(b, k) }]), hint: '傾き = $\\frac{y の増加量}{x の増加量}$。', steps: [`傾き ${m(`\\frac{${tnum(F(a, q))}-${a / p}}{${q}-${p}}=${tnum(k)}`)}`, m(lineTex(k, b))], check: { kind: 'graph', pts: [A, B] } } },
      { pts: 6, p: { unit: 'linear-function', stem: `${m('\\triangle OAB')} の面積を求めなさい。（座標の1目もりを1cmとする）`, ...numAns(V('面積', 'cm²'), { v: S }, { wrong: [{ vals: { v: S.mul(2) }, msg: '三角形なので ÷2 をわすれずに。' }] }), hint: '直線 AB と $y$ 軸の交点で、2つの三角形の差として考える。', steps: [`直線 AB と ${m('y')} 軸の交点は ${m(`(0,\\ ${tnum(b)})`)}`, `${m(`\\frac{1}{2}\\times ${tnum(b)}\\times ${q}-\\frac{1}{2}\\times ${tnum(b)}\\times ${p}=${tnum(S)}`)}`], maxDen: 30, check: { kind: 'fn', verify: (v) => near(v.v, polyArea([[0, 0], A, B])) } } },
    ],
  };
}

// ---------- 大問4: 三平方の定理と空間図形 ----------
function sec4Cuboid(rng) {
  let a, b, c;
  do { a = rng.int(2, 6); b = rng.int(2, 6); c = rng.int(2, 6); } while (a === b && b === c);
  const AC = a * a + b * b, AG = AC + c * c, path = (a + b) ** 2 + c * c;
  const vol = F(a * b * c, 6);
  return {
    title: '空間図形',
    intro: `図のような直方体 ABCD-EFGH があり、${m(`AB=${a}`)} cm、${m(`AD=${b}`)} cm、${m(`AE=${c}`)} cm である。`,
    fig: solid('cuboid', { a: `${a}cm`, b: `${b}cm`, c: `${c}cm`, v: true, dims: [a, b, c] }),
    qs: [
      { pts: 4, p: { unit: 'pythagoras', stem: '線分 AC の長さを求めなさい。', ...rootChoice(rng, AC, [a + b, AC * 2, Math.abs(a * a - b * b)]), hint: '△ABC は直角三角形。', steps: [`${m(`AC^{2}=${a}^{2}+${b}^{2}=${AC}`)}`], check: { kind: 'value', expr: `\\sqrt{${a}^{2}+${b}^{2}}` } } },
      { pts: 5, p: { unit: 'pythagoras', stem: '線分 AG の長さを求めなさい。', ...rootChoice(rng, AG, [AC, a * a + b * b + c, (a + b + c) ** 2 > 400 ? 0 : (a + b + c) ** 2]), hint: '△ACG は ∠ACG=90° の直角三角形。', steps: [`${m(`AG^{2}=AC^{2}+CG^{2}=${AC}+${c * c}=${AG}`)}`], check: { kind: 'value', expr: `\\sqrt{${a}^{2}+${b}^{2}+${c}^{2}}` } } },
      { pts: 5, p: { unit: 'solids', stem: `4点 A、B、C、F を結んでできる三角錐の体積を求めなさい。`, ...numAns(V('体積', 'cm³'), { v: vol }, { wrong: [{ vals: { v: F(a * b * c, 2) }, msg: '錐の体積は $\\frac{1}{3}\\times$ 底面積 × 高さ。' }, { vals: { v: F(a * b * c, 3) }, msg: '底面は三角形 ABC（長方形の半分）。' }] }), hint: '底面 △ABC、高さ BF。', steps: [`${m(`\\frac{1}{3}\\times \\frac{1}{2}\\times ${a}\\times ${b}\\times ${c}=${tnum(vol)}`)}`], check: { kind: 'fn', verify: (v) => near(v.v, (1 / 3) * (a * b / 2) * c) } } },
      { pts: 6, p: { unit: 'pythagoras', stem: '点 A から辺 BF 上の点を通って点 G まで、面 ABFE と面 BFGC の上に糸をかける。糸の長さが最も短くなるときの長さを求めなさい。', ...rootChoice(rng, path, [AG, (a + c) ** 2 + b * b, a * a + (b + c) ** 2]), hint: '2つの面を開いて1つの長方形にすると、最短の糸は直線になる。', steps: [`展開すると、たて ${m(c)}、横 ${m(`${a}+${b}=${a + b}`)} の長方形の対角線`, `${m(`\\sqrt{${a + b}^{2}+${c}^{2}}`)}`], check: { kind: 'value', expr: `\\sqrt{(${a}+${b})^{2}+${c}^{2}}` } } },
    ],
  };
}

function sec4Pyramid(rng) {
  const a = rng.pick([2, 4, 6, 8]);
  const h = rng.int(2, 6);
  const e2 = h * h + (a * a) / 2; // 側辺 OA²
  const slant2 = h * h + (a * a) / 4; // 側面の高さ²
  const faceN = (a * a / 4) * slant2; // 側面の面積 = (a/2)√slant2 → √(a²/4·slant2)
  const vol = F(a * a * h, 3);
  return {
    title: '空間図形',
    intro: `図のように、底面が1辺 ${m(a)} cm の正方形 ABCD で、${m(`OA=OB=OC=OD=${rootTex(e2)}`)} cm の正四角錐 O-ABCD がある。底面の対角線の交点を H とする。`,
    fig: solid('pyramid4', { a: `${a}cm` }),
    qs: [
      { pts: 4, p: { unit: 'pythagoras', stem: '底面の対角線 AC の長さを求めなさい。', ...rootChoice(rng, 2 * a * a, [a * a, 4 * a * a, a * a / 2]), hint: '正方形の対角線は 1辺 × √2。', steps: [`${m(`AC^{2}=${a}^{2}+${a}^{2}=${2 * a * a}`)}`], check: { kind: 'value', expr: `\\sqrt{${a}^{2}+${a}^{2}}` } } },
      { pts: 5, p: { unit: 'pythagoras', stem: '正四角錐の高さ OH を求めなさい。', ...numAns(V('OH', 'cm'), { v: h }, { wrong: [{ vals: { v: e2 }, msg: '2乗のまま。最後に √ をとる。' }] }), hint: `△OAH は直角三角形で、${m(`AH=\\frac{1}{2}AC`)}。`, steps: [`${m(`AH^{2}=\\frac{${2 * a * a}}{4}=${(a * a) / 2}`)}`, `${m(`OH^{2}=${e2}-${(a * a) / 2}=${h * h}`)} より ${m(`OH=${h}`)}`], check: { kind: 'fn', verify: (v) => near(v.v * v.v + (a * a) / 2, e2) && v.v > 0 } } },
      { pts: 5, p: { unit: 'solids', stem: '正四角錐の体積を求めなさい。', ...numAns(V('体積', 'cm³'), { v: vol }, { wrong: [{ vals: { v: a * a * h }, msg: '錐なので $\\frac{1}{3}$ をかける。' }] }), hint: '$\\frac{1}{3}\\times$ 底面積 × 高さ。', steps: [`${m(`\\frac{1}{3}\\times ${a}^{2}\\times ${h}=${tnum(vol)}`)}`], check: { kind: 'fn', verify: (v) => near(v.v, (a * a * h) / 3) } } },
      { pts: 6, p: { unit: 'pythagoras', stem: `側面の ${m('\\triangle OAB')} の面積を求めなさい。`, ...rootChoice(rng, faceN, [a * a * slant2, slant2, (a * a / 4) * e2]), hint: 'AB の中点を M とすると、OM が △OAB の高さ。OM は △OHM（直角三角形）から。', steps: [`${m(`OM^{2}=${h}^{2}+${a / 2}^{2}=${slant2}`)}`, `面積 ${m(`\\frac{1}{2}\\times ${a}\\times \\sqrt{${slant2}}`)}`], check: { kind: 'value', expr: `\\frac{1}{2}\\times ${a}\\times \\sqrt{${h}^{2}+${a / 2}^{2}}` } } },
    ],
  };
}

// ---------- 組み立て ----------
// kind: 'full'（50分・大問4つ）| 'mini'（15分・小問5つ＋大問1つ）
export function buildShigaMath(kind, seed) {
  const rng = makeRng(seed);
  const s3 = rng.chance(0.6) ? sec3Para : sec3Inv;
  const s4 = rng.chance(0.5) ? sec4Cuboid : sec4Pyramid;
  let secs;
  if (kind === 'mini') {
    const big = rng.pick([sec2, s3, s4]);
    secs = [sec1(rng, 5), big(rng)];
  } else secs = [sec1(rng), sec2(rng), s3(rng), s4(rng)];
  secs.forEach((sec, i) => {
    sec.no = i + 1;
    sec.qs.forEach((q, j) => {
      q.id = `${i + 1}-${j + 1}`;
      q.label = `(${j + 1})`;
      // makeProblem で作ったものはそのまま（復習キューに入れられる）。模試専用の問題には印をつける
      if (!q.p.generatorId) Object.assign(q.p, { id: `exam-${seed}-${q.id}`, generatorId: null, seed, lang: 'math', difficulty: 3, source: 'original' });
    });
  });
  return { subject: 'math', kind, seed, title: kind === 'mini' ? '数学 ミニ模試' : '数学 フル模試', minutes: kind === 'mini' ? 15 : 50, style: '滋賀県型', sections: secs };
}
export const PROOF_TEMPLATES = PROOFS;
export const CONSTRUCT_TEMPLATES = CONSTRUCT;
export { KANA };
