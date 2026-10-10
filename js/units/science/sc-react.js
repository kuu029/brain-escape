// 理科 第2段階（中2）: 化学変化と質量（質量保存・決まった質量の比）
//   銅 : 酸素 : 酸化銅 = 4 : 1 : 5、マグネシウム : 酸素 : 酸化マグネシウム = 3 : 2 : 5
import { sciNum, sciChoice, m, dec, near, round2, chart } from './kit-sci.js';

export const METALS = {
  銅: { ratio: [4, 1, 5], oxide: '酸化銅' },
  マグネシウム: { ratio: [3, 2, 5], oxide: '酸化マグネシウム' },
};

function genRatio(rng) {
  const metal = rng.pick(Object.keys(METALS));
  const { ratio, oxide } = METALS[metal];
  const k = rng.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2]);
  const amt = ratio.map((r) => round2(r * k));
  const [gi, ai] = rng.pick([[0, 2], [0, 1], [2, 0], [1, 0], [2, 1]]);
  const label = (i) => (i === 0 ? metal : i === 1 ? '酸素' : oxide);
  return sciNum({
    stem: `${metal}を加熱すると、酸素と結びついて${oxide}ができる。このとき、${metal}・酸素・${oxide}の質量の比は ${ratio.join(' : ')} である。${label(gi)}が ${dec(amt[gi])} g のとき、${label(ai)}は何 g か。（${metal}はすべて反応するものとする）`,
    v: amt[ai], unit: 'g',
    wrongs: [{ v: (amt[gi] * ratio[gi]) / ratio[ai], msg: '比を逆に使っている。' }, { v: amt[3 - gi - ai], msg: `それは${label(3 - gi - ai)}の質量。` }],
    hint: `${ratio.join(' : ')} の比を使う。わかっている量 ÷ その比の数 = 「1あたり」の量。`,
    steps: [`1あたり: ${m(`${dec(amt[gi])}\\div ${ratio[gi]}=${dec(k)}`)}`, `${label(ai)}: ${m(`${dec(k)}\\times ${ratio[ai]}=${dec(amt[ai])}`)}（g）`],
    verify: (x) => near(x * ratio[gi], amt[gi] * ratio[ai]),
  });
}
// 一部だけ反応した: 増えた質量 = 結びついた酸素
function genLeft(rng) {
  const metal = rng.pick(Object.keys(METALS));
  const { ratio, oxide } = METALS[metal];
  const k = rng.pick([0.1, 0.2, 0.3, 0.4, 0.5]);
  const used = round2(ratio[0] * k);
  const ox = round2(ratio[1] * k);
  const left = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1]);
  const before = round2(used + left);
  const after = round2(before + ox);
  const ask = rng.pick(['ox', 'left', 'left']);
  if (ask === 'ox') {
    return sciNum({
      stem: `${metal}の粉末 ${dec(before)} g を加熱したところ、加熱後の質量は ${dec(after)} g になった。結びついた酸素は何 g か。`,
      v: ox, unit: 'g',
      wrongs: [{ v: after, msg: 'それは加熱後の全体の質量。' }, { v: (before * ratio[1]) / ratio[0], msg: '全部が反応したとはかぎらない。ふえた分が酸素。' }],
      hint: '加熱してふえた質量 = 結びついた酸素の質量',
      steps: [`${m(`${dec(after)}-${dec(before)}=${dec(ox)}`)}（g）`],
      verify: (x) => near(before + x, after),
    });
  }
  return sciNum({
    stem: `${metal}の粉末 ${dec(before)} g を加熱したところ、加熱が不十分で、加熱後の質量は ${dec(after)} g だった。反応しないで残っている${metal}は何 g か。${metal}と酸素は ${ratio[0]} : ${ratio[1]} の質量の比で結びつく。`,
    v: left, unit: 'g',
    wrongs: [{ v: used, msg: 'それは反応した（酸素と結びついた）ほうの質量。' }, { v: round2(before - (after - before)), msg: 'ふえた分は酸素。その酸素と結びついた金属の質量を、比から出す。' }, { v: after - before, msg: 'それは結びついた酸素の質量。' }],
    hint: '① ふえた質量 = 酸素 ② 比から、その酸素と結びついた金属の質量 ③ はじめの質量から引く',
    steps: [`酸素 = ${m(`${dec(after)}-${dec(before)}=${dec(ox)}`)}（g）`, `反応した${metal} = ${m(`${dec(ox)}\\times ${ratio[0]}\\div ${ratio[1]}=${dec(used)}`)}（g）`, `残り = ${m(`${dec(before)}-${dec(used)}=${dec(left)}`)}（g）`],
    verify: (x) => near(((before - x) * ratio[1]) / ratio[0], after - before),
  });
}
// 質量保存の法則
const CONS = [
  { stem: 'うすい塩酸と炭酸水素ナトリウムを、ふたをした容器の中で反応させた。反応の前と後で、容器全体の質量はどうなるか。', ans: '変わらない', why: '気体が発生しても、容器の外に出ていかないので、全体の質量は変わらない（質量保存の法則）。' },
  { stem: 'うすい塩酸と炭酸水素ナトリウムを、ふたのない容器で反応させた。反応の後、容器全体の質量はどうなるか。', ans: '小さくなる', why: '発生した二酸化炭素が空気中に出ていくので、その分だけ軽くなる。' },
  { stem: 'スチールウール（鉄）を空気中で燃やした。燃えたあとの物質の質量は、はじめの鉄とくらべてどうなるか。', ans: '大きくなる', why: '鉄が空気中の酸素と結びつくので、結びついた酸素の分だけ重くなる。' },
  { stem: 'うすい硫酸とうすい水酸化バリウム水溶液を混ぜると、白い沈殿ができた。混ぜる前と後で、全体の質量はどうなるか。', ans: '変わらない', why: '沈殿ができても、物質が外に出ていかないので、全体の質量は変わらない。' },
  { stem: '木を燃やすと灰が残る。残った灰の質量は、はじめの木とくらべてどうなるか。', ans: '小さくなる', why: '木にふくまれる炭素や水素が、二酸化炭素や水（水蒸気）になって空気中に出ていくので、軽くなる。' },
];
function genCons(rng) {
  const c = rng.pick(CONS);
  return sciChoice(rng, {
    stem: c.stem,
    correct: c.ans,
    wrongs: ['変わらない', '小さくなる', '大きくなる'].filter((x) => x !== c.ans).map((t) => ({ t, msg: c.why })),
    n: 3,
    hint: '反応の前後で、原子の種類と数は変わらない（質量保存）。ただし、気体が出ていったり、空気中の酸素が結びついたりすると、はかった質量は変わる。',
    steps: [c.why],
    verify: (t) => CONS.some((x) => x.stem === c.stem && x.ans === t),
  });
}

// グラフの読み取り: 金属の質量と、できた酸化物の質量（加熱して全部反応したとき）
//   [金属, 酸化物, 金属の目盛り, 酸化物 ÷ 金属]
const GM = [['銅', '酸化銅', 0.4, 5 / 4], ['マグネシウム', '酸化マグネシウム', 0.3, 5 / 3]];
function genGraph(rng) {
  const [mt, ox, xs, k] = rng.pick(GM);
  const xmax = xs * 5;
  const pts = [1, 2, 3, 4, 5].map((i) => [round2(xs * i), round2(xs * i * k)]);
  const fig = chart({ x: [0, xmax], y: [0, 2.5], xs, ys: 0.5, xlab: `${mt}の質量〔g〕`, ylab: `${ox}の質量〔g〕`, lines: [{ pts: [[0, 0], [xmax, xmax * k]] }], dots: pts });
  const type = rng.pick(['o2', 'need', 'big']);
  const [a, b] = rng.pick(pts.slice(0, 4));
  if (type === 'o2') {
    return sciNum({
      stem: `図は、${mt}の粉末を加熱して、全部を${ox}にしたときの質量の関係を表したグラフ。${mt} ${dec(a)} g と結びついた酸素は何 g か。`,
      fig, v: b - a, unit: 'g',
      wrongs: [{ v: b, msg: `それは${ox}の質量。結びついた酸素 = ${ox} − ${mt}。` }, { v: a, msg: `それは${mt}の質量。` }],
      hint: `${mt} ${dec(a)} g のときの${ox}の質量を読んで、${mt}の質量を引く。`,
      steps: [`${mt} ${dec(a)} g → ${ox} ${dec(b)} g`, `酸素 ${m(`${dec(b)}-${dec(a)}=${dec(b - a)}`)}（g）`],
      verify: (x) => near(x, round2(a * k - a)),
    });
  }
  if (type === 'need') {
    return sciNum({
      stem: `図は、${mt}の粉末を加熱して、全部を${ox}にしたときの質量の関係を表したグラフ。${ox}を ${dec(b)} g つくるには、${mt}は何 g 必要か。`,
      fig, v: a, unit: 'g',
      wrongs: [{ v: b - a, msg: 'それは結びつく酸素の質量。' }, { v: b * k, msg: 'グラフのたてが酸化物、よこが金属。よこの目盛りを読む。' }],
      hint: `たての目盛り ${dec(b)} g のところから、グラフの線にぶつかる点の横の目盛りを読む。`,
      steps: [`${ox} ${dec(b)} g のところ → ${mt} ${dec(a)} g`],
      verify: (x) => near(x * k, b),
    });
  }
  const big = round2(xmax * 2);
  return sciNum({
    stem: `図は、${mt}の粉末を加熱して、全部を${ox}にしたときの質量の関係を表したグラフ。${mt} ${dec(big)} g を全部${ox}にすると、${ox}は何 g できるか。`,
    fig, v: big * k, unit: 'g',
    wrongs: [{ v: big * k - big, msg: 'それは結びつく酸素の質量。' }, { v: 2.5, msg: 'グラフの外。質量は比例するので、グラフの点から比を読んで計算する。' }],
    hint: `グラフから「${mt} : ${ox}」の比を読む。${mt}の質量が2倍、3倍…になると、${ox}も2倍、3倍…になる。`,
    steps: [`${mt} ${dec(xmax)} g → ${ox} ${dec(xmax * k)} g（グラフのいちばん右）`, `${dec(big)} g はその2倍 → ${m(`${dec(xmax * k)}\\times 2=${dec(big * k)}`)}（g）`],
    verify: (x) => near(x / big, k),
  });
}

export default {
  id: 'sc-react',
  subject: 'science',
  stage: 2,
  area: '理科棟・実験炉',
  title: '化学変化と質量',
  emoji: '🔥',
  prereqs: ['sc-density'],
  tool: 'nuke',
  hintCard: [
    '質量保存の法則: 反応の前後で、全体の質量は変わらない（気体が出入りしなければ）',
    '銅 : 酸素 : 酸化銅 = 4 : 1 : 5',
    'マグネシウム : 酸素 : 酸化マグネシウム = 3 : 2 : 5',
    '加熱してふえた質量 = 結びついた酸素の質量',
  ],
  generators: {
    'cr-cons': { difficulty: 1, gen: genCons },
    'cr-ratio': { difficulty: 2, gen: genRatio },
    'cr-left': { difficulty: 3, gen: genLeft },
    'cr-graph': { difficulty: 2, gen: genGraph },
  },
  lessons: [
    {
      id: 'cr-l1',
      title: '質量保存の法則',
      unlocks: ['cr-cons'],
      build(rng) {
        return [
          { text: '化学変化では、原子の組み合わせが変わるだけ。原子の数は変わらないので、全体の質量は変わらない（質量保存の法則）。' },
          { text: 'ただし、ふたのない容器で気体が出ると軽くなり、空気中の酸素と結びつくと重くなる。', q: genCons(rng) },
          { text: 'もう1問。', q: genCons(rng) },
        ];
      },
    },
    {
      id: 'cr-l2',
      title: '結びつく質量の比',
      unlocks: ['cr-ratio', 'cr-left', 'cr-graph'],
      build(rng) {
        return [
          { text: '金属と酸素は、決まった質量の比で結びつく。\n銅 : 酸素 : 酸化銅 = 4 : 1 : 5\nマグネシウム : 酸素 : 酸化マグネシウム = 3 : 2 : 5', q: genRatio(rng) },
          { text: '加熱が不十分だと、金属が残る。\nふえた質量（= 酸素）から、反応した金属の質量を比で出して、はじめの質量から引く。', q: genLeft(rng) },
        ];
      },
    },
  ],
};
