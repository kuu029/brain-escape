// 理科 第1段階（中1）: ばねののび（フックの法則）
//   ばねののびは、ばねを引く力の大きさに比例する。全体の長さ = もとの長さ + のび
import { sciNum, table, m, dec, near, round2 } from './kit-sci.js';

const G100 = '（100 g の物体にはたらく重力の大きさを 1 N とする）';

function spring(rng) {
  const per = rng.pick([1, 1.5, 2, 2.5, 3, 4, 5]); // 1 N あたりののび [cm]
  const len0 = rng.pick([5, 8, 10, 12, 15, 20]);
  return { per, len0 };
}
function genStretch(rng) {
  const { per, len0 } = spring(rng);
  const type = rng.pick(['stretch', 'stretch', 'total', 'force']);
  const g = rng.pick([50, 100, 150, 200, 250, 300, 400, 500, 600]);
  const N = g / 100;
  const s = round2(per * N);
  const base = rng.pick([0.5, 1, 2]);
  const fig = table(['おもりの質量 (g)', '0', String(base * 100), String(base * 200), String(base * 300)], [['ばねののび (cm)', '0', dec(per * base), dec(per * base * 2), dec(per * base * 3)]]);
  if (type === 'force') {
    return sciNum({
      stem: `表は、あるばねにおもりをつるしたときの、おもりの質量とばねののびの関係である。このばねが ${dec(s)} cm のびたとき、ばねを引く力は何 N か。${G100}`,
      fig, v: N, unit: 'N',
      wrongs: [{ v: g, msg: '質量（g）ではなく力（N）で答える。100 g = 1 N。' }, { v: s * per, msg: '力 = のび ÷（1 N あたりののび）。' }],
      hint: 'まず「1 N あたり何 cm のびるか」を表から出す。のびは力に比例する。',
      steps: [`1 N（100 g）あたり ${dec(per)} cm のびる`, `${m(`${dec(s)}\\div ${dec(per)}=${dec(N)}`)}（N）`],
      verify: (x) => near(x * per, s),
    });
  }
  const total = type === 'total';
  return sciNum({
    stem: `表は、あるばねにおもりをつるしたときの、おもりの質量とばねののびの関係である。${total ? `このばねのもとの長さは ${len0} cm である。` : ''}このばねに ${g} g のおもりをつるすと、${total ? 'ばね全体の長さは何 cm になるか' : 'ばねは何 cm のびるか'}。${G100}`,
    fig, v: total ? round2(len0 + s) : s, unit: 'cm',
    wrongs: total ? [{ v: s, msg: 'それはのびだけ。全体の長さ = もとの長さ + のび。' }, { v: round2(len0 * N), msg: 'もとの長さに、のびを足す。' }] : [{ v: round2(per * g), msg: 'g ではなく N（100 g = 1 N）で考える。' }, { v: round2(per + N), msg: 'のびは力に比例する（かけ算）。' }],
    hint: 'ばねののびは、引く力に比例する（フックの法則）。全体の長さ = もとの長さ + のび。',
    steps: [`1 N（100 g）あたり ${dec(per)} cm のびる`, `のび = ${m(`${dec(per)}\\times ${dec(N)}=${dec(s)}`)}（cm）`, ...(total ? [`全体 = ${m(`${len0}+${dec(s)}=${dec(round2(len0 + s))}`)}（cm）`] : [])],
    verify: (x) => near(total ? x - len0 : x, (per * g) / 100),
  });
}

export default {
  id: 'sc-spring',
  subject: 'science',
  stage: 1,
  area: '理科棟・ばねの倉庫',
  title: 'ばねののび',
  emoji: '🪀',
  prereqs: [],
  tool: 'coins',
  hintCard: [
    'ばねののびは、ばねを引く力の大きさに比例する（フックの法則）',
    '100 g の物体にはたらく重力 ＝ 約 1 N',
    '全体の長さ = もとの長さ + のび',
  ],
  generators: {
    'sp-stretch': { difficulty: 2, gen: genStretch },
  },
  lessons: [
    {
      id: 'sp-l1',
      title: 'フックの法則',
      unlocks: ['sp-stretch'],
      build(rng) {
        return [
          { text: 'ばねを引く力が2倍、3倍になると、のびも2倍、3倍になる（比例）。これをフックの法則という。\nまず表から「1 N あたり何 cm のびるか」を出すと、計算しやすい。', q: genStretch(rng) },
          { text: '「全体の長さ」をきかれたら、もとの長さを足すのをわすれずに。', q: genStretch(rng) },
        ];
      },
    },
  ],
};
