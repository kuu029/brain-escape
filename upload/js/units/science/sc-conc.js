// 理科 第1段階（中1）: 質量パーセント濃度
//   濃度 [%] = 溶質の質量 ÷ 溶液の質量 × 100、溶液 = 溶質 + 溶媒（水）
import { sciNum, m, dec, near } from './kit-sci.js';

const PCT = [2, 4, 5, 8, 10, 12, 15, 20, 25];
const TOTAL = [50, 80, 100, 150, 200, 250, 300, 400, 500];
const SOLUTE = ['食塩', '砂糖', '硝酸カリウム', 'ミョウバン'];

function genCalc(rng) {
  const p = rng.pick(PCT);
  const total = rng.pick(TOTAL.filter((t) => (t * p) % 100 === 0));
  const a = (total * p) / 100;
  const w = total - a;
  const s = rng.pick(SOLUTE);
  const type = rng.pick(['pct', 'pct', 'solute', 'water']);
  if (type === 'pct') {
    return sciNum({
      stem: `水 ${w} g に${s} ${a} g をとかした。この水溶液の質量パーセント濃度は何 % か。`,
      v: p, unit: '%',
      wrongs: [{ v: (a / w) * 100, msg: '水の質量でわっている。わるのは「水溶液全体（水 + とかしたもの）」の質量。' }, { v: a, msg: '濃度 = 溶質 ÷ 溶液 × 100' }],
      hint: '濃度 [%] = 溶質の質量 ÷ 溶液の質量 × 100。溶液 = 水 + 溶質。',
      steps: [`溶液の質量 = ${m(`${w}+${a}=${total}`)}（g）`, `${m(`${a}\\div ${total}\\times 100=${p}`)}（%）`],
      verify: (x) => near((x / 100) * (w + a), a),
    });
  }
  if (type === 'solute') {
    return sciNum({
      stem: `${p} % の${s}水溶液が ${total} g ある。とけている${s}は何 g か。`,
      v: a, unit: 'g',
      wrongs: [{ v: total / p, msg: '溶質 = 溶液 × 濃度 ÷ 100' }, { v: w, msg: 'それは水の質量。' }],
      hint: '溶質の質量 = 溶液の質量 × 濃度 ÷ 100',
      steps: [`${m(`${total}\\times ${p}\\div 100=${dec(a)}`)}（g）`],
      verify: (x) => near((x / total) * 100, p),
    });
  }
  return sciNum({
    stem: `${p} % の${s}水溶液を ${total} g つくりたい。水は何 g 必要か。`,
    v: w, unit: 'g',
    wrongs: [{ v: a, msg: `それはとかす${s}の質量。水 = 溶液 − 溶質。` }, { v: total, msg: '水溶液全体の質量から、とかすものの質量を引く。' }],
    hint: 'まず溶質の質量（溶液 × 濃度 ÷ 100）を出して、溶液から引く。',
    steps: [`${s} = ${m(`${total}\\times ${p}\\div 100=${dec(a)}`)}（g）`, `水 = ${m(`${total}-${dec(a)}=${dec(w)}`)}（g）`],
    verify: (x) => near(((total - x) / total) * 100, p),
  });
}
// うすめる・こくする: 溶質の質量は変わらない
function genDilute(rng) {
  for (;;) {
    const p1 = rng.pick([10, 12, 15, 20, 25]);
    const total = rng.pick([100, 200, 300]);
    const p2 = rng.pick([4, 5, 8, 10, 12].filter((x) => x < p1));
    const a = (total * p1) / 100;
    const t2 = (a * 100) / p2;
    if (!Number.isInteger(t2) || t2 <= total) continue;
    const add = t2 - total;
    return sciNum({
      stem: `${p1} % の食塩水 ${total} g に水を加えて、${p2} % にしたい。水を何 g 加えればよいか。`,
      v: add, unit: 'g',
      wrongs: [{ v: t2, msg: 'それはうすめたあとの食塩水全体の質量。加える水 = あと − まえ。' }, { v: (total * (p1 - p2)) / 100, msg: '水を加えても、とけている食塩の質量は変わらない。そこから考える。' }],
      hint: '水を加えても、食塩の質量は変わらない。食塩 ÷ 新しい濃度 で、うすめたあとの全体の質量がわかる。',
      steps: [`食塩 = ${m(`${total}\\times ${p1}\\div 100=${dec(a)}`)}（g）`, `${p2} % になる全体 = ${m(`${dec(a)}\\div ${p2}\\times 100=${t2}`)}（g）`, `加える水 = ${m(`${t2}-${total}=${add}`)}（g）`],
      verify: (x) => near((a / (total + x)) * 100, p2),
    });
  }
}

export default {
  id: 'sc-conc',
  subject: 'science',
  stage: 1,
  area: '理科棟・ビーカー倉庫',
  title: '水溶液の濃度',
  emoji: '🧪',
  prereqs: [],
  tool: 'heal',
  hintCard: [
    '質量パーセント濃度 [%] = 溶質の質量 ÷ 溶液の質量 × 100',
    '溶液の質量 = 溶媒（水）の質量 + 溶質の質量',
    '溶質の質量 = 溶液 × 濃度 ÷ 100',
    '水を加えてうすめても、とけているものの質量は変わらない',
  ],
  generators: {
    'cc-calc': { difficulty: 1, gen: genCalc },
    'cc-dilute': { difficulty: 3, gen: genDilute },
  },
  lessons: [
    {
      id: 'cc-l1',
      title: '濃度の計算',
      unlocks: ['cc-calc'],
      build(rng) {
        return [
          { text: 'とけているもの＝溶質、とかしている液体（水）＝溶媒、できた液＝溶液。\n溶液の質量 = 水 + 溶質。' },
          { text: '濃度 [%] = 溶質 ÷ 溶液 × 100\n例: 水 90 g に食塩 10 g → 10 ÷ 100 × 100 = 10 %\n（10 ÷ 90 ではない！）', q: genCalc(rng) },
          { text: 'もう1問。', q: genCalc(rng) },
        ];
      },
    },
    {
      id: 'cc-l2',
      title: 'うすめる',
      unlocks: ['cc-dilute'],
      build(rng) {
        return [
          { text: '水を加えると、溶液は重くなるが、とけている食塩の量は変わらない。\n例: 20 % の食塩水 100 g（食塩 20 g）を 10 % にする → 全体を 200 g にする → 水を 100 g 加える', q: genDilute(rng) },
        ];
      },
    },
  ],
};
