// 第3段階: 作図（垂直二等分線・角の二等分線・垂線）。手順のカードを並べる ／ どの作図を使うかを選ぶ
//   入試の作図は「コンパスと定規だけ」。分度器・目盛りで測るのはだめ（わなのカード）
import { textChoice } from './kit3.js';
import { geo, polar } from './fig.js';

const r1 = (v) => Math.round(v * 10) / 10;
// 作図の手順。blocks: 順番を入れかえてもよいかたまり（[2, 1, 1] なら最初の2枚はどちらが先でもよい）
const STEPS = [
  {
    name: '線分 AB の垂直二等分線',
    fig: (rng) => { const A = [0, r1(rng.int(0, 10) / 10)], B = [r1(3 + rng.int(0, 15) / 10), r1(rng.int(-8, 8) / 10)]; return geo({ pts: { A, B }, segs: [['A', 'B']] }); },
    steps: ['点 A を中心に、AB の半分より大きい半径の円をかく', '点 B を中心に、同じ半径の円をかく', '2つの円の交点を P・Q とする', '直線 PQ をひく'],
    blocks: [2, 1, 1],
    trap: '定規の目盛りで AB の長さを測り、真ん中に点をうつ',
    why: '2つの円の交点 P・Q は、どちらも A と B から等しい距離 → PQ が垂直二等分線。',
  },
  {
    name: '∠XOY の二等分線',
    fig: (rng) => { const O = [0, 0], a = rng.int(40, 110), t = rng.int(-15, 15); return geo({ pts: { O, X: polar(O, 4, t), Y: polar(O, 4, t + a) }, segs: [['O', 'X'], ['O', 'Y']] }); },
    steps: ['点 O を中心に円をかき、OX・OY との交点を A・B とする', '点 A・B を中心に、同じ半径の円をかく', 'その2つの円の交点を P とする', '半直線 OP をひく'],
    blocks: [1, 1, 1, 1],
    trap: '分度器で ∠XOY を測り、半分の角をかく',
    why: 'OA = OB、AP = BP、OP は共通 → 2つの三角形は合同なので、∠AOP = ∠BOP。',
  },
  {
    name: '点 P を通る、直線 ℓ の垂線',
    fig: (rng) => { const px = r1(rng.int(-10, 10) / 10), py = r1(1.5 + rng.int(0, 10) / 10); return geo({ pts: { _L1: [-3, 0], _L2: [3, 0], P: [px, py] }, lines: [['_L1', '_L2']], texts: [{ at: [3.2, -0.4], text: 'ℓ' }] }); },
    steps: ['点 P を中心に円をかき、ℓ との交点を A・B とする', '点 A・B を中心に、同じ半径の円をかく', 'その2つの円の交点のうち、P でないほうを Q とする', '直線 PQ をひく'],
    blocks: [1, 1, 1, 1],
    trap: '三角定規の直角をあてて、P を通る線をひく',
    why: 'P と Q はどちらも A・B から等しい距離 → PQ は線分 AB の垂直二等分線 → ℓ に垂直。',
  },
  {
    name: '円の中心',
    fig: (rng) => { const r = r1(1.8 + rng.int(0, 8) / 10); return geo({ pts: { _O: [0, 0] }, circles: [{ c: '_O', r }], hide: ['_O'] }); },
    steps: ['円周上に3点 A・B・C をとる', '線分 AB の垂直二等分線をひく', '線分 BC の垂直二等分線をひく', '2本の垂直二等分線の交点が、円の中心'],
    blocks: [1, 2, 1],
    trap: '円をいちばん長く横切る線を定規で探し、その真ん中を測る',
    why: '円の中心は、円周上のどの2点からも等しい距離 → 弦の垂直二等分線は必ず中心を通る。',
  },
];
function genSteps(rng) {
  const c = rng.pick(STEPS);
  const tiles = rng.shuffle([...c.steps, c.trap]);
  return {
    stem: `${c.name}を作図する。手順のカードを正しい順にならべよう（使わないカードが1枚まざっている）`,
    fig: c.fig(rng),
    input: { kind: 'order', tiles, answer: c.steps, prefix: '', suffix: '', extra: 1, rows: true, blocks: c.blocks },
    answerText: c.steps.map((t, i) => `${i + 1}. ${t}`).join('\n'),
    hint: '作図で使えるのはコンパスと定規（線をひくだけ）。長さや角度を測る手順は使えない。',
    steps: [...c.steps.map((t, i) => `${i + 1}. ${t}`), c.why, `使わない: ${c.trap}（測るのは作図ではない）`],
    check: { kind: 'csteps', trap: c.trap },
  };
}

// どの作図を使うか
const KIND = { pb: '垂直二等分線', ab: '角の二等分線', pp: '垂線', pl: '平行線' };
const WHICH = [
  ['2点 A・B から等しい距離にある点を求めたい', 'pb', '2点から等しい距離 → 垂直二等分線の上の点。'],
  ['線分 AB の中点を求めたい', 'pb', '垂直二等分線と AB の交点が中点。'],
  ['三角形の3つの頂点を通る円の中心を求めたい', 'pb', '2辺の垂直二等分線の交点（外心）。'],
  ['円周上の2点を結んだ弦から、円の中心を求めたい', 'pb', '弦の垂直二等分線は中心を通る。'],
  ['角の2つの辺から等しい距離にある点を求めたい', 'ab', '2辺から等しい距離 → 角の二等分線の上の点。'],
  ['三角形の3つの辺に接する円の中心を求めたい', 'ab', '2つの角の二等分線の交点（内心）。'],
  ['正三角形をかいて、30° の角をつくりたい', 'ab', '正三角形の 60° を二等分すると 30°。'],
  ['点 P から直線 ℓ までの最短の道を求めたい', 'pp', '点から直線への最短距離は、垂線の長さ。'],
  ['円 O の周上の点 P を通る接線をひきたい', 'pp', '接線は、接点を通る半径 OP に垂直 → P を通る OP の垂線。'],
  ['三角形 ABC で、底辺 BC に対する高さをかきたい', 'pp', '高さは、頂点 A から BC にひいた垂線。'],
  ['点 A を、直線 ℓ について対称移動した点を求めたい', 'pp', 'A から ℓ に垂線をひき、ℓ の反対側に同じ長さだけとる。'],
  ['直線 ℓ 上の点 P で、ℓ と 90° に交わる直線をひきたい', 'pp', 'ℓ 上の点 P を通る垂線。'],
];
function genWhich(rng) {
  const [sit, k, why] = rng.pick(WHICH);
  return {
    stem: `次のとき、どの作図を使う？\n「${sit}」`,
    ...textChoice(rng, KIND[k], Object.entries(KIND).filter(([x]) => x !== k).map(([, t]) => ({ tex: t, msg: why }))),
    hint: '等しい距離 → 2点からなら垂直二等分線、2辺からなら角の二等分線。最短・接線・高さ → 垂線。',
    steps: [why, `→ ${KIND[k]}`],
    check: { kind: 'fn', verify: (t) => WHICH.some(([s2, k2]) => s2 === sit && KIND[k2] === t) },
  };
}

export default {
  id: 'construct',
  stage: 3,
  area: '森の作業小屋',
  title: '作図',
  emoji: '📐',
  prereqs: ['angles'],
  tool: 'sniper',
  hintCard: [
    '作図はコンパスと定規だけ（長さ・角度は測らない）',
    '垂直二等分線: 2点から等しい距離の点の集まり（中点・円の中心）',
    '角の二等分線: 2辺から等しい距離の点の集まり（内接円の中心）',
    '垂線: 最短距離・接線（半径に垂直）・高さ',
  ],
  generators: {
    'cs-which': { difficulty: 1, gen: genWhich },
    'cs-steps': { difficulty: 2, gen: genSteps },
  },
  lessons: [
    {
      id: 'cs-l1',
      title: '3つの基本の作図',
      unlocks: ['cs-which', 'cs-steps'],
      build(rng) {
        return [
          { text: '作図で使うのはコンパス（円をかく）と定規（まっすぐな線をひく）だけ。目盛りで長さを測ったり、分度器を使ったりはしない。' },
          { text: '① 垂直二等分線: A・B を中心に同じ半径の円 → 2つの交点を結ぶ。「2点から等しい距離」の点が集まった線。' },
          { text: '② 角の二等分線: 頂点を中心に円 → 辺との交点から同じ半径の円 → その交点と頂点を結ぶ。' },
          { text: '③ 垂線: P を中心に円 → ℓ との交点から同じ半径の円 → その交点と P を結ぶ。' },
          { text: 'どの作図を使う？', q: genWhich(rng) },
          { text: '手順をならべよう。', q: genSteps(rng) },
        ];
      },
    },
  ],
};
