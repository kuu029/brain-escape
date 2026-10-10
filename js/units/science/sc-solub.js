// 理科 第1段階（中1）: 溶解度と再結晶
//   溶解度 = 水 100 g にとける最大の質量。冷やして出てくる結晶 = （高い温度の溶解度 − 低い温度の溶解度）× 水の量 ÷ 100
import { sciNum, sciChoice, table, m, dec, near, round2 } from './kit-sci.js';

// 溶解度 [g / 水100g]（教科書でよく使う値）
export const SOLUB = {
  硝酸カリウム: { 0: 13.3, 20: 31.6, 40: 63.9, 60: 109.2, 80: 168.8 },
  ミョウバン: { 0: 5.7, 20: 11.4, 40: 23.8, 60: 57.4, 80: 321.6 },
  塩化ナトリウム: { 0: 35.7, 20: 35.8, 40: 36.3, 60: 37.1, 80: 38.0 },
};
const TEMPS = [0, 20, 40, 60, 80];
const solTable = () => table(['物質', ...TEMPS.map((t) => `${t}℃`)], Object.entries(SOLUB).map(([n, s]) => [n, ...TEMPS.map((t) => s[t].toFixed(1))]));

function genMax(rng) {
  const name = rng.pick(Object.keys(SOLUB));
  const T = rng.pick(TEMPS);
  const W = rng.pick([50, 100, 200, 300]);
  const v = round2((SOLUB[name][T] * W) / 100);
  return sciNum({
    stem: `${T}℃ の水 ${W} g に、${name}は最大何 g までとけるか。表の溶解度（水 100 g にとける質量）を使いなさい。`,
    fig: solTable(),
    v, unit: 'g',
    wrongs: [{ v: SOLUB[name][T], msg: `表の値は水 100 g のとき。水 ${W} g なら ${W / 100} 倍。` }],
    hint: 'とける量は水の量に比例する。溶解度 × 水の量 ÷ 100',
    steps: [`${T}℃ の溶解度 ${SOLUB[name][T].toFixed(1)} g（水 100 g）`, `${m(`${SOLUB[name][T].toFixed(1)}\\times ${W}\\div 100=${dec(v)}`)}（g）`],
    verify: (x) => near((x * 100) / W, SOLUB[name][T]),
  });
}
function genCrystal(rng) {
  const name = rng.pick(['硝酸カリウム', '硝酸カリウム', 'ミョウバン']);
  const [T2, T1] = rng.shuffle(TEMPS.filter((t) => t < 80 || name !== 'ミョウバン')).slice(0, 2).sort((a, b) => a - b);
  const W = rng.pick([50, 100, 200]);
  const v = round2(((SOLUB[name][T1] - SOLUB[name][T2]) * W) / 100);
  return sciNum({
    stem: `${T1}℃ の水 ${W} g に${name}をとけるだけとかした。この水溶液を ${T2}℃ まで冷やすと、何 g の結晶が出てくるか。`,
    fig: solTable(),
    v, unit: 'g',
    wrongs: [{ v: round2(SOLUB[name][T1] - SOLUB[name][T2]), msg: `その差は水 100 g のとき。水 ${W} g なら ${W / 100} 倍。` }, { v: round2((SOLUB[name][T1] * W) / 100), msg: '冷やしたあとも、とけたままの分がある。その分を引く。' }],
    hint: '出てくる結晶 = （はじめの温度の溶解度 − 冷やした温度の溶解度）× 水の量 ÷ 100',
    steps: [`水 100 g なら: ${m(`${SOLUB[name][T1].toFixed(1)}-${SOLUB[name][T2].toFixed(1)}=${dec(round2(SOLUB[name][T1] - SOLUB[name][T2]))}`)}（g）`, `水 ${W} g なので: ${m(`${dec(round2(SOLUB[name][T1] - SOLUB[name][T2]))}\\times ${W}\\div 100=${dec(v)}`)}（g）`],
    verify: (x) => near((SOLUB[name][T1] * W) / 100 - x, (SOLUB[name][T2] * W) / 100),
  });
}
function genWhich(rng) {
  const hi = rng.pick([40, 60]);
  const diff = (n) => SOLUB[n][hi] - SOLUB[n][0];
  const ask = rng.chance(0.5) ? 'hard' : 'easy';
  const names = Object.keys(SOLUB);
  const right = ask === 'hard' ? names.reduce((a, b) => (diff(a) < diff(b) ? a : b)) : names.reduce((a, b) => (diff(a) > diff(b) ? a : b));
  return sciChoice(rng, {
    stem: `${hi}℃ の水 100 g に、表の3つの物質をそれぞれとけるだけとかし、0℃ まで冷やした。出てくる結晶がいちばん${ask === 'hard' ? '少ない' : '多い'}のはどれか。`,
    fig: solTable(),
    correct: right,
    wrongs: names.filter((n) => n !== right).map((t) => ({ t, msg: `${hi}℃ と 0℃ の溶解度の差がいちばん${ask === 'hard' ? '小さい' : '大きい'}もの。` })),
    n: 3,
    hint: '出てくる結晶 = 溶解度の差。塩化ナトリウムは温度で溶解度がほとんど変わらないので、冷やしても結晶がほとんど出ない。',
    steps: names.map((n) => `${n}: ${SOLUB[n][hi].toFixed(1)} − ${SOLUB[n][0].toFixed(1)} = ${dec(round2(diff(n)))} g`),
    verify: (t) => names.every((n) => (ask === 'hard' ? diff(t) <= diff(n) : diff(t) >= diff(n))),
  });
}

export default {
  id: 'sc-solub',
  subject: 'science',
  stage: 1,
  area: '理科棟・結晶の部屋',
  title: '溶解度と再結晶',
  emoji: '🧂',
  prereqs: [],
  tool: 'double',
  hintCard: [
    '溶解度: 水 100 g にとける物質の最大の質量（温度で変わる）',
    'とける量は水の量に比例（水 200 g なら 2倍）',
    '冷やして出る結晶 = 溶解度の差 × 水の量 ÷ 100（再結晶）',
    '塩化ナトリウムは温度で溶解度がほとんど変わらない → 冷やしても結晶が出にくい',
  ],
  generators: {
    'sl-max': { difficulty: 1, gen: genMax },
    'sl-crystal': { difficulty: 3, gen: genCrystal },
    'sl-which': { difficulty: 2, gen: genWhich },
  },
  lessons: [
    {
      id: 'sl-l1',
      title: '溶解度',
      unlocks: ['sl-max'],
      build(rng) {
        return [
          { text: '水 100 g にとける最大の量を溶解度という。温度が高いほど多くとける物質が多い。\n水が 50 g なら半分、200 g なら 2倍とける。', q: genMax(rng) },
        ];
      },
    },
    {
      id: 'sl-l2',
      title: '再結晶',
      unlocks: ['sl-crystal', 'sl-which'],
      build(rng) {
        return [
          { text: 'とけるだけとかした水溶液を冷やすと、とけきれなくなった分が結晶になって出てくる（再結晶）。\n出てくる量 = 溶解度の差（水 100 g あたり）', q: genCrystal(rng) },
          { text: '塩化ナトリウムは、冷やしても溶解度がほとんど変わらない。だから冷やしても結晶はほとんど出ない。', q: genWhich(rng) },
        ];
      },
    },
  ],
};
