// 社会 第1段階（地理）: 統計の読み取り（人口密度・割合・増加率）
//   人口密度 [人/km²] = 人口 ÷ 面積、割合 [%] = その量 ÷ 全体 × 100、増加率 [%] = 増えた量 ÷ もとの量 × 100
import { sciNum, table, m, dec, near } from '../science/kit-sci.js';

const AREAS = ['A県', 'B県', 'C県', 'D県'];
function genDensity(rng) {
  const area = rng.pick([1000, 2000, 2500, 4000, 5000, 6000, 8000, 10000]);
  const dens = rng.pick([50, 80, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1200]);
  const pop = area * dens; // 人
  const man = pop / 10000;
  if (rng.chance(0.7)) {
    return sciNum({
      stem: `人口 ${dec(man)} 万人、面積 ${area} km² の県の人口密度は、1 km² あたり何人か。`,
      v: dens, unit: '人/km²',
      wrongs: [{ v: man / area, msg: '「万人」を人になおしてからわる（1万人 = 10000人）。' }, { v: area / pop, msg: '逆にわっている。人口密度 = 人口 ÷ 面積。' }],
      hint: '人口密度 = 人口 ÷ 面積。万人は 10000 倍して人にする。',
      steps: [`${dec(man)} 万人 = ${pop} 人`, `${m(`${pop}\\div ${area}=${dens}`)}（人/km²）`],
      verify: (x) => near(x * area, pop),
    });
  }
  return sciNum({
    stem: `面積 ${area} km²、人口密度が 1 km² あたり ${dens} 人の県の人口は、何万人か。`,
    v: man, unit: '万人',
    wrongs: [{ v: pop, msg: '「万人」で答える（÷ 10000）。' }, { v: area / dens, msg: '人口 = 人口密度 × 面積。' }],
    hint: '人口 = 人口密度 × 面積',
    steps: [`${m(`${dens}\\times ${area}=${pop}`)}（人）`, `= ${dec(man)} 万人`],
    verify: (x) => near((x * 10000) / area, dens),
  });
}
function genShare(rng) {
  for (;;) {
    const total = rng.pick([200, 400, 500, 800, 1000]);
    const vals = AREAS.map(() => rng.int(1, 9) * (total / 20));
    const s = vals.reduce((a, b) => a + b, 0);
    if (s >= total) continue;
    const others = total - s;
    const i = rng.int(0, 3);
    const pct = (vals[i] / total) * 100;
    if (!Number.isInteger(pct)) continue;
    const item = rng.pick([['米の生産量', '万t'], ['みかんの出荷量', '千t'], ['観光客数', '万人']]);
    return sciNum({
      stem: `次の表は、ある年の${item[0]}を県別に表したものである。全国にしめる${AREAS[i]}の割合は何 % か。`,
      fig: table(['', `${item[0]}（${item[1]}）`], [...AREAS.map((a, k) => [a, String(vals[k])]), ['その他', String(others)], ['全国', String(total)]]),
      v: pct, unit: '%',
      wrongs: [{ v: (vals[i] / s) * 100, msg: '「全国」の合計でわる（4県の合計ではない）。' }, { v: vals[i], msg: '割合 = その量 ÷ 全体 × 100。' }],
      hint: '割合 [%] = その量 ÷ 全体 × 100',
      steps: [`${m(`${vals[i]}\\div ${total}\\times 100=${pct}`)}（%）`],
      verify: (x) => near((x / 100) * total, vals[i]),
    });
  }
}
function genGrowth(rng) {
  for (;;) {
    const base = rng.pick([200, 250, 400, 500, 800, 1000, 1200]);
    const rate = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, -10, -20, -25]);
    const now = (base * (100 + rate)) / 100;
    if (!Number.isInteger(now)) continue;
    const up = rate > 0;
    return sciNum({
      stem: `ある市の人口は、2000年に ${base} 千人、2020年に ${now} 千人だった。2000年とくらべて、何 % ${up ? '増えた' : '減った'}か。`,
      v: Math.abs(rate), unit: '%',
      wrongs: [{ v: (Math.abs(now - base) / now) * 100, msg: 'くらべる「もと」は 2000年の人口。もとの量でわる。' }, { v: Math.abs(now - base), msg: '増えた（減った）量 ÷ もとの量 × 100。' }],
      hint: `${up ? '増加' : '減少'}率 [%] = ${up ? '増えた' : '減った'}量 ÷ もとの量 × 100`,
      steps: [`${up ? '増えた' : '減った'}量 = ${Math.abs(now - base)} 千人`, `${m(`${Math.abs(now - base)}\\div ${base}\\times 100=${Math.abs(rate)}`)}（%）`],
      verify: (x) => near(base * (1 + (up ? x : -x) / 100), now),
    });
  }
}

export default {
  id: 'so-stat',
  subject: 'social',
  stage: 1,
  area: '社会棟・統計の部屋',
  title: '統計の読み取り',
  emoji: '📊',
  prereqs: [],
  tool: 'coins',
  hintCard: [
    '人口密度 [人/km²] = 人口 ÷ 面積',
    '割合 [%] = その量 ÷ 全体 × 100（全体は「全国」「合計」の数）',
    '増加率 [%] = 増えた量 ÷ もとの量 × 100',
    '「万人」「千t」などの単位に注意',
  ],
  generators: {
    'st-density': { difficulty: 1, gen: genDensity },
    'st-share': { difficulty: 2, gen: genShare },
    'st-growth': { difficulty: 2, gen: genGrowth },
  },
  lessons: [
    {
      id: 'st-l1',
      title: '人口密度',
      unlocks: ['st-density'],
      build(rng) {
        return [
          { text: '人口密度は、1 km² あたりに何人住んでいるか。人口 ÷ 面積。\n例: 120万人・4000 km² → 1200000 ÷ 4000 = 300 人/km²', q: genDensity(rng) },
        ];
      },
    },
    {
      id: 'st-l2',
      title: '割合と増加率',
      unlocks: ['st-share', 'st-growth'],
      build(rng) {
        return [
          { text: '割合 = その量 ÷ 全体 × 100。表では「全国」や「合計」が全体。', q: genShare(rng) },
          { text: '増加率 = 増えた量 ÷ もとの量 × 100。もと（くらべるほう）は、前の年の数。', q: genGrowth(rng) },
        ];
      },
    },
  ],
};
