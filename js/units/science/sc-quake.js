// 理科 第1段階（中1）: 地震（P波・S波・初期微動継続時間）
//   時間 = 距離 ÷ 速さ。初期微動継続時間 = S波が届く時間 − P波が届く時間（震源から遠いほど長い）
import { sciNum, sciChoice, m, dec, near, chart } from './kit-sci.js';

// [P波の速さ, S波の速さ, 距離の刻み（継続時間がきれいになる）]
const WAVES = [[6, 3, 6], [8, 4, 8], [6, 4, 12], [7, 3.5, 7], [5, 3, 15], [7.5, 5, 15]];

function setup(rng) {
  const [vp, vs, step] = rng.pick(WAVES);
  const d = step * rng.int(4, 20);
  return { vp, vs, d, tp: d / vp, ts: d / vs, t: d / vs - d / vp };
}
const sp = (vp, vs) => `P波の速さを ${dec(vp)} km/s、S波の速さを ${dec(vs)} km/s とする。`;

function genCalc(rng) {
  const { vp, vs, d, tp, ts, t } = setup(rng);
  const type = rng.pick(['t', 't', 'd', 'tp', 'ts']);
  if (type === 'd') {
    return sciNum({
      stem: `ある地点で、初期微動継続時間が ${dec(t)} 秒だった。震源からこの地点までの距離は何 km か。${sp(vp, vs)}`,
      v: d, unit: 'km',
      wrongs: [{ v: t * vp, msg: 'P波だけで計算している。S波とP波の届く時間の「差」が初期微動継続時間。' }, { v: t * vs, msg: 'S波だけで計算している。' }, { v: t * (vp - vs), msg: '速さの差をかけてもだめ。1 km あたり何秒差がつくかを考える。' }],
      hint: '1 km 進むのに、P波は 1/P 秒、S波は 1/S 秒。1 km ごとに差がいくらつくかを求める。',
      steps: [`1 km あたりの差 = ${m(`\\frac{1}{${dec(vs)}}-\\frac{1}{${dec(vp)}}`)} 秒`, `距離 = 継続時間 ÷ 1 km あたりの差 = ${d} km`, `確かめ: ${m(`${d}\\div ${dec(vs)}-${d}\\div ${dec(vp)}=${dec(t)}`)}（秒）`],
      verify: (x) => near(x / vs - x / vp, t),
    });
  }
  if (type === 'tp' || type === 'ts') {
    const P = type === 'tp';
    return sciNum({
      stem: `震源から ${d} km はなれた地点に、地震が発生してから${P ? 'P波' : 'S波'}が届くのは何秒後か。${sp(vp, vs)}`,
      v: P ? tp : ts, unit: '秒後',
      wrongs: [{ v: P ? ts : tp, msg: `${P ? 'P波' : 'S波'}の速さでわる。` }, { v: t, msg: 'それは初期微動継続時間（S波とP波の差）。' }],
      hint: '時間 = 距離 ÷ 速さ',
      steps: [`${m(`${d}\\div ${dec(P ? vp : vs)}=${dec(P ? tp : ts)}`)}（秒）`],
      verify: (x) => near(x * (P ? vp : vs), d),
    });
  }
  return sciNum({
    stem: `震源から ${d} km はなれた地点の、初期微動継続時間は何秒か。${sp(vp, vs)}`,
    v: t, unit: '秒',
    wrongs: [{ v: tp, msg: 'それはP波が届くまでの時間。初期微動継続時間 = S波の時間 − P波の時間。' }, { v: ts, msg: 'それはS波が届くまでの時間。P波の時間を引く。' }, { v: d / (vp - vs), msg: '速さの差でわるのではなく、それぞれの時間を出してから引く。' }],
    hint: 'P波・S波それぞれの届く時間（距離 ÷ 速さ）を出して、差をとる。',
    steps: [`P波: ${m(`${d}\\div ${dec(vp)}=${dec(tp)}`)} 秒`, `S波: ${m(`${d}\\div ${dec(vs)}=${dec(ts)}`)} 秒`, `差: ${m(`${dec(ts)}-${dec(tp)}=${dec(t)}`)} 秒`],
    verify: (x) => near(x, d / vs - d / vp),
  });
}

// グラフの読み取り: 震源からの距離と、P波・S波が届くまでの時間
//   [P波, S波, 目盛りの距離（10秒ぶん P波が進む距離 ÷ 2）, 時間の目盛り]
const GW = [[6, 3, 30, 10], [8, 4, 40, 10], [5, 2.5, 25, 10], [6, 4, 30, 5]];
function genGraph(rng) {
  const [vp, vs, xs, ys] = rng.pick(GW);
  const xmax = xs * 6;
  const ymax = Math.ceil(xmax / vs / ys) * ys;
  const d = xs * rng.pick([2, 4, 6]);
  const tp = d / vp, ts = d / vs, t = ts - tp;
  const fig = chart({ x: [0, xmax], y: [0, ymax], xs, ys, xlab: '震源からの距離〔km〕', ylab: '発生してからの時間〔秒〕', lines: [{ pts: [[0, 0], [xmax, xmax / vp]], label: 'P波' }, { pts: [[0, 0], [xmax, xmax / vs]], label: 'S波' }] });
  const type = rng.pick(['t', 'd', 'v']);
  if (type === 'd') {
    return sciNum({
      stem: `図は、ある地震のP波とS波が届くまでの時間と、震源からの距離の関係を表したグラフ。初期微動継続時間が ${dec(t)} 秒だった地点は、震源から何 km か。`,
      fig, v: d, unit: 'km',
      wrongs: [{ v: t * vp, msg: 'P波の線だけを見ている。P波とS波の線の「たての差」が初期微動継続時間。' }, { v: t * vs, msg: 'S波の線だけを見ている。2本の線のたての差を見る。' }],
      hint: '2本の線の「たての差」が初期微動継続時間。差が ' + dec(t) + ' 秒になる距離をさがす。',
      steps: [`距離 ${d} km のとき P波 ${dec(tp)} 秒、S波 ${dec(ts)} 秒`, `差 ${m(`${dec(ts)}-${dec(tp)}=${dec(t)}`)} 秒 → ${d} km`],
      verify: (x) => near(x / vs - x / vp, t),
    });
  }
  if (type === 'v') {
    return sciNum({
      stem: '図は、ある地震のP波とS波が届くまでの時間と、震源からの距離の関係を表したグラフ。P波の速さは何 km/s か。',
      fig, v: vp, unit: 'km/s',
      wrongs: [{ v: vs, msg: 'それはS波の速さ。P波は速いので、同じ距離に早く届く（線がねている）ほう。' }, { v: tp / d, msg: '時間 ÷ 距離 になっている。速さ = 距離 ÷ 時間。' }],
      hint: 'P波の線上で、目盛りがちょうど読める点をさがす。速さ = 距離 ÷ 時間。',
      steps: [`P波は ${d} km を ${dec(tp)} 秒で進む`, `${m(`${d}\\div ${dec(tp)}=${dec(vp)}`)}（km/s）`],
      verify: (x) => near(x * tp, d),
    });
  }
  return sciNum({
    stem: `図は、ある地震のP波とS波が届くまでの時間と、震源からの距離の関係を表したグラフ。震源から ${d} km の地点の、初期微動継続時間は何秒か。`,
    fig, v: t, unit: '秒',
    wrongs: [{ v: tp, msg: 'それはP波が届くまでの時間。S波の時間から引く。' }, { v: ts, msg: 'それはS波が届くまでの時間。P波の時間を引く。' }],
    hint: `距離 ${d} km のところで、P波とS波の線の時間を読んで、差をとる。`,
    steps: [`P波 ${dec(tp)} 秒、S波 ${dec(ts)} 秒`, `${m(`${dec(ts)}-${dec(tp)}=${dec(t)}`)}（秒）`],
    verify: (x) => near(x, d / vs - d / vp),
  });
}

// 用語（震度とマグニチュード・初期微動と主要動）
const TERMS = [
  ['はじめに来る小さなゆれ', '初期微動', 'P波によるゆれ'],
  ['あとから来る大きなゆれ', '主要動', 'S波によるゆれ'],
  ['初期微動を起こす波', 'P波', '速い波'],
  ['主要動を起こす波', 'S波', 'おそい波'],
  ['ある地点でのゆれの大きさ（10段階）', '震度', '場所によってちがう'],
  ['地震そのものの規模（エネルギー）の大きさ', 'マグニチュード', '1つの地震に1つ'],
  ['地下で地震が発生した場所', '震源', ''],
  ['震源の真上の地表の地点', '震央', ''],
];
function genTerm(rng) {
  const [desc, ans, note] = rng.pick(TERMS);
  return sciChoice(rng, {
    stem: `次の説明にあてはまる言葉は？\n「${desc}」`,
    correct: ans,
    wrongs: rng.shuffle(TERMS.filter(([, a]) => a !== ans)).slice(0, 3).map(([, a]) => ({ t: a })),
    hint: 'P波（Primary）→ 初期微動、S波（Secondary）→ 主要動。震度はゆれ、マグニチュードは規模。',
    steps: [`${desc} → ${ans}${note ? `（${note}）` : ''}`],
    verify: (t) => TERMS.some(([d, a]) => d === desc && a === t),
  });
}

export default {
  id: 'sc-quake',
  subject: 'science',
  stage: 1,
  area: '理科棟・ゆれる地下室',
  title: '地震のゆれ',
  emoji: '🌋',
  prereqs: [],
  tool: 'rewind',
  hintCard: [
    'P波（速い）→ 初期微動、S波（おそい）→ 主要動',
    '届く時間 = 震源からの距離 ÷ 波の速さ',
    '初期微動継続時間 = S波の時間 − P波の時間（震源から遠いほど長い）',
    '震度 = その場所のゆれの大きさ、マグニチュード = 地震の規模',
  ],
  generators: {
    'qk-calc': { difficulty: 2, gen: genCalc },
    'qk-term': { difficulty: 1, gen: genTerm },
    'qk-graph': { difficulty: 2, gen: genGraph },
  },
  lessons: [
    {
      id: 'qk-l1',
      title: 'ゆれの名前',
      unlocks: ['qk-term'],
      build(rng) {
        return [
          { text: '地震が起きると、速いP波とおそいS波が同時に出る。\nP波が届く → 小さなゆれ（初期微動）\nS波が届く → 大きなゆれ（主要動）' },
          { text: '「震度」はその場所のゆれの大きさ（場所でちがう）、「マグニチュード」は地震そのものの規模。', q: genTerm(rng) },
          { text: 'もう1問。', q: genTerm(rng) },
        ];
      },
    },
    {
      id: 'qk-l2',
      title: '初期微動継続時間',
      unlocks: ['qk-calc', 'qk-graph'],
      build(rng) {
        return [
          { text: 'P波が届いてからS波が届くまでの時間を、初期微動継続時間という。\n例: 120 km、P波 6 km/s、S波 3 km/s\nP波 120 ÷ 6 = 20 秒、S波 120 ÷ 3 = 40 秒 → 差 20 秒', q: genCalc(rng) },
          { text: '震源からの距離と、初期微動継続時間は比例する（遠いほど長い）。', q: genCalc(rng) },
        ];
      },
    },
  ],
};
