// 社会 第3段階（公民）: 為替（円高・円安）と消費税
//   1ドル = ○円 の ○ が小さくなる → 円高（円の価値が上がる）。消費税は 10%（食料品などは 8%）
import { sciNum, sciChoice, m, dec, near } from '../science/kit-sci.js';

function genRate(rng) {
  const r = rng.pick([80, 90, 100, 110, 120, 125, 130, 140, 150, 160]);
  const usd = rng.pick([5, 10, 20, 25, 40, 50, 100, 200]);
  if (rng.chance(0.5)) {
    return sciNum({
      stem: `1ドル = ${r} 円のとき、${usd} ドルの商品は日本円で何円か。`,
      v: usd * r, unit: '円',
      wrongs: [{ v: usd / r, msg: 'ドル → 円は、かける（1ドルが r 円）。' }, { v: usd + r, msg: '1ドルあたり r 円なので、かけ算。' }],
      hint: '円 = ドル × （1ドルあたりの円）',
      steps: [`${m(`${usd}\\times ${r}=${usd * r}`)}（円）`],
      verify: (x) => near(x / r, usd),
    });
  }
  return sciNum({
    stem: `1ドル = ${r} 円のとき、${usd * r} 円は何ドルか。`,
    v: usd, unit: 'ドル',
    wrongs: [{ v: usd * r * r, msg: '円 → ドルは、わる。' }],
    hint: 'ドル = 円 ÷ （1ドルあたりの円）',
    steps: [`${m(`${usd * r}\\div ${r}=${usd}`)}（ドル）`],
    verify: (x) => near(x * r, usd * r),
  });
}
// 円高・円安のきまり
const FACTS = [
  { q: (a, b) => `1ドル = ${a} 円から 1ドル = ${b} 円になった。これは円高か、円安か。`, ans: (a, b) => (b < a ? '円高' : '円安'), ws: ['円高', '円安'], why: (a, b) => `同じ1ドルを ${b < a ? '少ない' : '多い'}円で買える → 円の価値が${b < a ? '上がった（円高）' : '下がった（円安）'}。` },
  { q: () => '円高になると、日本から外国へ商品を売る（輸出する）会社にとって、ふつうどうなるか。', ans: () => '不利になる', ws: ['不利になる', '有利になる', '変わらない'], why: () => '円高だと、外国では日本の商品の値段が高くなり、売れにくくなる。' },
  { q: () => '円高になると、外国から商品を買う（輸入する）会社にとって、ふつうどうなるか。', ans: () => '有利になる', ws: ['有利になる', '不利になる', '変わらない'], why: () => '円高だと、同じ商品を少ない円で買えるので、輸入品が安くなる。' },
  { q: () => '円安のとき、日本人が海外旅行に行くと、ふつうどうなるか。', ans: () => '高くつく', ws: ['高くつく', '安くすむ', '変わらない'], why: () => '円安だと、1ドルを買うのに多くの円が必要になる。' },
];
function genFact(rng) {
  const F = rng.pick(FACTS);
  let a = rng.pick([90, 100, 110, 120, 130, 140, 150]);
  let b = rng.pick([80, 90, 100, 110, 120, 130, 140, 150, 160].filter((x) => x !== a));
  const right = F.ans(a, b);
  return sciChoice(rng, {
    stem: F.q(a, b),
    correct: right,
    wrongs: F.ws.filter((t) => t !== right).map((t) => ({ t, msg: F.why(a, b) })),
    n: F.ws.length,
    hint: '1ドル = ○円 の ○ が小さくなる → 円高（円が強い）。円高は輸入に有利、輸出に不利。',
    steps: [F.why(a, b)],
    verify: (t) => t === F.ans(a, b) && (F !== FACTS[0] || t === (b < a ? '円高' : '円安')),
  });
}
function genTax(rng) {
  const food = rng.chance(0.4);
  const rate = food ? 8 : 10;
  const price = rng.pick([100, 150, 200, 250, 300, 500, 800, 1000, 1200, 1500, 2000, 2500]);
  const item = food ? rng.pick(['パン', 'おにぎり', 'ジュース', 'お弁当（持ち帰り）']) : rng.pick(['ノート', 'ボールペン', 'Tシャツ', 'ゲームソフト']);
  if (rng.chance(0.6)) {
    return sciNum({
      stem: `税抜き価格 ${price} 円の${item}を買う。消費税（${food ? '食料品の軽減税率 8%' : '10%'}）をふくめると何円か。`,
      v: (price * (100 + rate)) / 100, unit: '円',
      wrongs: [{ v: (price * rate) / 100, msg: 'それは消費税の額だけ。税抜き価格に足す。' }, { v: (price * (100 + (food ? 10 : 8))) / 100, msg: `${food ? '食料品（持ち帰り）は 8%' : '食料品以外は 10%'}。` }],
      hint: `税込み = 税抜き × ${(100 + rate) / 100}`,
      steps: [`消費税 = ${m(`${price}\\times ${rate}\\div 100=${dec((price * rate) / 100)}`)}（円）`, `税込み = ${m(`${price}+${dec((price * rate) / 100)}=${dec((price * (100 + rate)) / 100)}`)}（円）`],
      verify: (x) => near(x - price, (price * rate) / 100),
    });
  }
  return sciNum({
    stem: `税込み価格 ${dec((price * (100 + rate)) / 100)} 円の${item}（消費税 ${rate}%）の、税抜き価格は何円か。`,
    v: price, unit: '円',
    wrongs: [{ v: (price * (100 + rate)) / 100 - (price * (100 + rate)) / 100 * rate / 100, msg: '税込み価格から税込み価格の ' + rate + '% を引くのではない。税込み ÷ ' + (100 + rate) / 100 + '。' }],
    hint: `税抜き = 税込み ÷ ${(100 + rate) / 100}`,
    steps: [`${m(`${dec((price * (100 + rate)) / 100)}\\div ${(100 + rate) / 100}=${price}`)}（円）`],
    verify: (x) => near(x * (1 + rate / 100), (price * (100 + rate)) / 100),
  });
}

export default {
  id: 'so-money',
  subject: 'social',
  stage: 3,
  area: '社会棟・両替所',
  title: '為替と税',
  emoji: '💴',
  prereqs: ['so-stat'],
  tool: 'heal',
  hintCard: [
    '1ドル = ○円 の ○ が小さくなる → 円高、大きくなる → 円安',
    '円高: 輸入・海外旅行に有利、輸出に不利 ／ 円安: その逆',
    'ドル → 円は かける、円 → ドルは わる',
    '消費税は 10%（食料品の持ち帰りなどは軽減税率 8%）。税込み = 税抜き × 1.1（1.08）',
  ],
  generators: {
    'mn-rate': { difficulty: 1, gen: genRate },
    'mn-fact': { difficulty: 2, gen: genFact },
    'mn-tax': { difficulty: 2, gen: genTax },
  },
  lessons: [
    {
      id: 'mn-l1',
      title: '為替と円高・円安',
      unlocks: ['mn-rate', 'mn-fact'],
      build(rng) {
        return [
          { text: '1ドル = 100円 → 1ドル = 80円 になると、少ない円で1ドルが買える → 円の価値が上がった＝円高。', q: genFact(rng) },
          { text: 'ドルを円にするときは「× 1ドルの円」、円をドルにするときは「÷ 1ドルの円」。', q: genRate(rng) },
        ];
      },
    },
    {
      id: 'mn-l2',
      title: '消費税',
      unlocks: ['mn-tax'],
      build(rng) {
        return [
          { text: '消費税は、ものやサービスを買ったときにかかる間接税。10%（食料品の持ち帰りなどは 8%）。\n税込み = 税抜き × 1.1、税抜き = 税込み ÷ 1.1', q: genTax(rng) },
        ];
      },
    },
  ],
};
