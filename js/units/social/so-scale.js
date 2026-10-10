// 社会 第1段階（地理）: 地形図の縮尺と等高線
//   実際の距離 = 地図上の長さ × 縮尺の分母。2万5千分の1 → 主曲線は 10 m ごと、5万分の1 → 20 m ごと
import { sciNum, m, dec, near } from '../science/kit-sci.js';

const SCALES = [[25000, '2万5千分の1', 10], [50000, '5万分の1', 20]];

function genDist(rng) {
  const [den, name] = rng.pick(SCALES);
  const cm = rng.pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 1.5, 2.5]);
  const meters = (cm * den) / 100;
  const type = rng.pick(['m', 'km', 'map']);
  if (type === 'map') {
    return sciNum({
      stem: `実際の距離が ${dec(meters / 1000)} km の2地点は、${name}の地形図上では何 cm になるか。`,
      v: cm, unit: 'cm',
      wrongs: [{ v: (meters / 1000) * den, msg: 'わる。地図上の長さ = 実際の距離 ÷ 縮尺の分母（単位をそろえてから）。' }, { v: cm * 10, msg: 'km → cm は × 100000。単位に注意。' }],
      hint: 'km を cm になおす（1 km = 100000 cm）→ 縮尺の分母でわる',
      steps: [`${dec(meters / 1000)} km = ${dec(meters * 100)} cm`, `${m(`${dec(meters * 100)}\\div ${den}=${dec(cm)}`)}（cm）`],
      verify: (x) => near(x * den, meters * 100),
    });
  }
  const km = type === 'km';
  return sciNum({
    stem: `${name}の地形図上で ${dec(cm)} cm の長さは、実際には何 ${km ? 'km' : 'm'} か。`,
    v: km ? meters / 1000 : meters, unit: km ? 'km' : 'm',
    wrongs: [{ v: km ? meters : meters / 1000, msg: km ? 'm ではなく km で答える（1000 m = 1 km）。' : 'km ではなく m で答える。' }, { v: cm * den, msg: 'それは cm のまま。100 cm = 1 m。' }],
    hint: '実際の距離 = 地図上の長さ × 縮尺の分母。cm → m は ÷ 100、m → km は ÷ 1000。',
    steps: [`${m(`${dec(cm)}\\times ${den}=${dec(cm * den)}`)}（cm）`, `= ${dec(meters)} m${km ? ` = ${dec(meters / 1000)} km` : ''}`],
    verify: (x) => near((km ? x * 100000 : x * 100) / den, cm),
  });
}
function genContour(rng) {
  const [den, name, step] = rng.pick(SCALES);
  if (rng.chance(0.2)) {
    return sciNum({
      stem: `${name}の地形図では、計曲線（太い等高線）は何 m ごとに引かれているか。`,
      v: step * 5, unit: 'm',
      wrongs: [{ v: step, msg: 'それは主曲線（細い線）の間かく。計曲線は主曲線5本ごと。' }, { v: (step === 10 ? 20 : 10) * 5, msg: '2万5千分の1 → 50 m ごと、5万分の1 → 100 m ごと。' }],
      hint: '計曲線は、主曲線5本ごとの太い線。2万5千分の1 → 50 m、5万分の1 → 100 m',
      steps: [`${name} → 主曲線 ${step} m ごと → 計曲線はその5倍の ${step * 5} m ごと`],
      verify: (x) => x === (den / 2500) * 5,
    });
  }
  if (rng.chance(0.25)) {
    return sciNum({
      stem: `${name}の地形図では、主曲線（細い等高線）は何 m ごとに引かれているか。`,
      v: step, unit: 'm',
      wrongs: [{ v: step === 10 ? 20 : 10, msg: '2万5千分の1 → 10 m ごと、5万分の1 → 20 m ごと。' }, { v: step * 5, msg: 'それは計曲線（太い線）の間かく。' }],
      hint: '2万5千分の1 → 主曲線 10 m・計曲線 50 m ／ 5万分の1 → 主曲線 20 m・計曲線 100 m',
      steps: [`${name} → 主曲線は ${step} m ごと`],
      verify: (x) => x === den / 2500,
    });
  }
  const n = rng.int(2, 10);
  return sciNum({
    stem: `${name}の地形図で、A地点からB地点まで、主曲線（細い等高線）を ${n} 本分のぼった。高さは何 m 上がったか。`,
    v: step * n, unit: 'm',
    wrongs: [{ v: (step === 10 ? 20 : 10) * n, msg: '縮尺で主曲線の間かくがちがう。' }, { v: n, msg: '本数 × 間かく。' }],
    hint: '上がった高さ = 主曲線の間かく × 本数',
    steps: [`${name} → 主曲線は ${step} m ごと`, `${m(`${step}\\times ${n}=${step * n}`)}（m）`],
    verify: (x) => x === (den / 2500) * n,
  });
}

export default {
  id: 'so-scale',
  subject: 'social',
  stage: 1,
  area: '社会棟・地図の書庫',
  title: '縮尺と等高線',
  emoji: '🗺️',
  prereqs: [],
  tool: 'sniper',
  hintCard: [
    '実際の距離 = 地図上の長さ × 縮尺の分母',
    '1 m = 100 cm、1 km = 1000 m = 100000 cm',
    '2万5千分の1: 主曲線 10 m・計曲線 50 m ごと',
    '5万分の1: 主曲線 20 m・計曲線 100 m ごと',
  ],
  generators: {
    'sc2-dist': { difficulty: 2, gen: genDist },
    'sc2-contour': { difficulty: 1, gen: genContour },
  },
  lessons: [
    {
      id: 'sc2-l1',
      title: '縮尺',
      unlocks: ['sc2-dist'],
      build(rng) {
        return [
          { text: '2万5千分の1 の地図では、実際の距離を 25000 分の1 にちぢめてある。\n地図上 4 cm → 4 × 25000 = 100000 cm = 1000 m = 1 km', q: genDist(rng) },
          { text: 'もう1問。単位に注意。', q: genDist(rng) },
        ];
      },
    },
    {
      id: 'sc2-l2',
      title: '等高線',
      unlocks: ['sc2-contour'],
      build(rng) {
        return [
          { text: '等高線は、同じ高さの地点を結んだ線。間かくがせまいほど、かたむきが急。\n2万5千分の1 → 主曲線 10 m ごと、5万分の1 → 20 m ごと。', q: genContour(rng) },
        ];
      },
    },
  ],
};
