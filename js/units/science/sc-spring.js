// 理科 第1段階（中1）: ばねののび（フックの法則）
//   ばねののびは、ばねを引く力の大きさに比例する。全体の長さ = もとの長さ + のび
import { sciNum, table, m, dec, near, round2, chart } from './kit-sci.js';

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

// グラフの読み取り: ばねA・Bを引く力と、ばねののび
const SK = [[4, 2], [4, 1], [3, 1], [2, 1], [4, 3]]; // 1 N あたりののび〔cm〕
function genGraph(rng) {
  const [ka, kb] = rng.pick(SK);
  const fig = chart({ x: [0, 5], y: [0, 20], xs: 1, ys: 2, xlab: '力の大きさ〔N〕', ylab: 'ばねののび〔cm〕', lines: [{ pts: [[0, 0], [5, 5 * ka]], label: 'A' }, { pts: [[0, 0], [5, 5 * kb]], label: 'B' }] });
  const type = rng.pick(['force', 'diff', 'out']);
  if (type === 'force') {
    const x = ka * rng.pick([2, 3, 4]);
    return sciNum({
      stem: `図は、ばねA・Bを引く力の大きさと、ばねののびの関係を表したグラフ。ばねAを ${x} cm のばすのに必要な力は何 N か。`,
      fig, v: x / ka, unit: 'N',
      wrongs: [{ v: x / kb, msg: 'それはばねBの場合。' }, { v: x * ka, msg: 'のび ÷ (1 N あたりののび) で求める。' }],
      hint: 'ばねAの線で、のびが ' + x + ' cm になる点の、横の目盛りを読む。',
      steps: [`ばねAは 1 N で ${ka} cm のびる`, `${m(`${x}\\div ${ka}=${x / ka}`)}（N）`],
      verify: (v) => near(v * ka, x),
    });
  }
  if (type === 'diff') {
    const f = rng.pick([2, 3, 4, 5]);
    return sciNum({
      stem: `図は、ばねA・Bを引く力の大きさと、ばねののびの関係を表したグラフ。どちらのばねも ${f} N の力で引いたとき、のびの差は何 cm か。`,
      fig, v: f * (ka - kb), unit: 'cm',
      wrongs: [{ v: f * ka, msg: 'それはばねAののびだけ。Bののびを引く。' }, { v: f * (ka + kb), msg: '差なので、引き算。' }],
      hint: `${f} N のところで、2本の線ののびをそれぞれ読む。`,
      steps: [`A: ${f * ka} cm、B: ${f * kb} cm`, `${m(`${f * ka}-${f * kb}=${f * (ka - kb)}`)}（cm）`],
      verify: (v) => near(v, f * ka - f * kb),
    });
  }
  const f = rng.pick([6, 7, 8]);
  return sciNum({
    stem: `図は、ばねA・Bを引く力の大きさと、ばねののびの関係を表したグラフ。ばねBを ${f} N の力で引くと、何 cm のびるか（ばねはこわれないものとする）。`,
    fig, v: f * kb, unit: 'cm',
    wrongs: [{ v: f * ka, msg: 'それはばねAの場合。' }, { v: 5 * kb, msg: 'グラフは 5 N まで。のびは力に比例する（フックの法則）ので、計算で求める。' }],
    hint: 'ばねののびは、引く力に比例する（フックの法則）。1 N あたりののびを読んで、' + f + ' 倍する。',
    steps: [`ばねBは 1 N で ${kb} cm のびる`, `${m(`${kb}\\times ${f}=${f * kb}`)}（cm）`],
    verify: (v) => near(v / f, kb),
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
    'sp-graph': { difficulty: 2, gen: genGraph },
  },
  lessons: [
    {
      id: 'sp-l1',
      title: 'フックの法則',
      unlocks: ['sp-stretch', 'sp-graph'],
      build(rng) {
        return [
          { text: 'ばねを引く力が2倍、3倍になると、のびも2倍、3倍になる（比例）。これをフックの法則という。\nまず表から「1 N あたり何 cm のびるか」を出すと、計算しやすい。', q: genStretch(rng) },
          { text: '「全体の長さ」をきかれたら、もとの長さを足すのをわすれずに。', q: genStretch(rng) },
        ];
      },
    },
  ],
};
