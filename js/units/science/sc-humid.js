// 理科 第2段階（中2）: 湿度と露点
//   湿度 [%] = 空気 1 m³ 中の水蒸気量 ÷ その気温の飽和水蒸気量 × 100。露点 = 水蒸気量が飽和水蒸気量と等しくなる温度
import { sciNum, table, m, dec, near, round2 } from './kit-sci.js';

// 飽和水蒸気量 [g/m³]（教科書でよく使う値）
export const SAT = { 0: 4.8, 2: 5.6, 4: 6.4, 6: 7.3, 8: 8.3, 10: 9.4, 12: 10.7, 14: 12.1, 16: 13.6, 18: 15.4, 20: 17.3, 22: 19.4, 24: 21.8, 26: 24.4, 28: 27.2, 30: 30.4 };
const TEMPS = Object.keys(SAT).map(Number);
const satTable = (ts) => table(['気温 (℃)', '飽和水蒸気量 (g/m³)'], ts.map((t) => [t, SAT[t].toFixed(1)]));
// 表に出す温度（使う温度＋まわり）
const around = (rng, need) => [...new Set([...need, ...rng.shuffle(TEMPS.filter((t) => !need.includes(t))).slice(0, 5 - need.length)])].sort((a, b) => a - b);

function genCalc(rng) {
  const T = rng.pick(TEMPS.filter((t) => t >= 14));
  const Td = rng.pick(TEMPS.filter((t) => t < T && t >= T - 14));
  const type = rng.pick(['rh', 'rh', 'more', 'drop', 'dew', 'vap']);
  if (type === 'rh') {
    const rh = (SAT[Td] / SAT[T]) * 100;
    const ans = Math.round(rh);
    return sciNum({
      stem: `気温 ${T} ℃ の部屋で、空気 1 m³ 中に ${SAT[Td].toFixed(1)} g の水蒸気がふくまれている。湿度は何 % か。小数第1位を四捨五入して整数で答えなさい。`,
      fig: satTable(around(rng, [T, Td])),
      v: ans, unit: '%',
      wrongs: [{ v: Math.round((SAT[T] / SAT[Td]) * 100), msg: '逆にわっている。湿度 = 水蒸気量 ÷ 飽和水蒸気量 × 100。' }, { v: Math.round(SAT[Td]), msg: '× 100 をわすれている、または水蒸気量そのまま。' }],
      hint: '湿度 [%] = 水蒸気量 ÷ その気温の飽和水蒸気量 × 100',
      steps: [`${T} ℃ の飽和水蒸気量は ${SAT[T].toFixed(1)} g/m³`, `${SAT[Td].toFixed(1)} ÷ ${SAT[T].toFixed(1)} × 100 = ${rh.toFixed(2)}…`, `四捨五入して ${ans} %`],
      verify: (x) => x === Math.round((100 * SAT[Td]) / SAT[T]),
    });
  }
  if (type === 'more') {
    const v = round2(SAT[T] - SAT[Td]);
    return sciNum({
      stem: `気温 ${T} ℃、空気 1 m³ 中の水蒸気量が ${SAT[Td].toFixed(1)} g の空気がある。この空気 1 m³ は、あと何 g の水蒸気をふくむことができるか。`,
      fig: satTable(around(rng, [T, Td])),
      v, unit: 'g',
      wrongs: [{ v: SAT[T], msg: 'それは飽和水蒸気量。すでにふくんでいる分を引く。' }],
      hint: 'あとふくめる量 = 飽和水蒸気量 − いまの水蒸気量',
      steps: [`${m(`${SAT[T].toFixed(1)}-${SAT[Td].toFixed(1)}=${dec(v)}`)}（g）`],
      verify: (x) => near(x + SAT[Td], SAT[T]),
    });
  }
  if (type === 'drop') {
    const T2 = rng.pick(TEMPS.filter((t) => t < Td));
    if (T2 === undefined) return genCalc(rng);
    const v = round2(SAT[Td] - SAT[T2]);
    return sciNum({
      stem: `気温 ${T} ℃、露点 ${Td} ℃ の空気 1 m³ を、${T2} ℃ まで冷やした。何 g の水滴ができるか。`,
      fig: satTable(around(rng, [T, Td, T2])),
      v, unit: 'g',
      wrongs: [{ v: round2(SAT[T] - SAT[T2]), msg: `ふくんでいる水蒸気は「露点 ${Td} ℃ の飽和水蒸気量」。${T} ℃ の飽和水蒸気量ではない。` }, { v: SAT[T2], msg: '冷やしたあとにふくめる量を引く。' }],
      hint: '露点の飽和水蒸気量 ＝ いまふくんでいる水蒸気量。冷やした温度の飽和水蒸気量をこえた分が水滴になる。',
      steps: [`ふくんでいる水蒸気 = ${Td} ℃ の飽和水蒸気量 = ${SAT[Td].toFixed(1)} g`, `${T2} ℃ でふくめるのは ${SAT[T2].toFixed(1)} g`, `${m(`${SAT[Td].toFixed(1)}-${SAT[T2].toFixed(1)}=${dec(v)}`)}（g）`],
      verify: (x) => near(SAT[T2] + x, SAT[Td]),
    });
  }
  if (type === 'dew') {
    return sciNum({
      stem: `気温 ${T} ℃ の空気 1 m³ 中に、水蒸気が ${SAT[Td].toFixed(1)} g ふくまれている。この空気の露点は何 ℃ か。`,
      fig: satTable(around(rng, [T, Td])),
      v: Td, unit: '℃',
      wrongs: [{ v: T, msg: '露点は、水蒸気量が飽和水蒸気量と同じになる温度。表で水蒸気量と同じ値をさがす。' }],
      hint: '表で、飽和水蒸気量がいまの水蒸気量と同じになる温度をさがす。',
      steps: [`飽和水蒸気量が ${SAT[Td].toFixed(1)} g/m³ になる温度 → ${Td} ℃`],
      verify: (x) => SAT[x] !== undefined && near(SAT[x], SAT[Td]),
    });
  }
  const rh = rng.pick([30, 40, 50, 60, 70, 80, 90]);
  const v = round2((SAT[T] * rh) / 100);
  return sciNum({
    stem: `気温 ${T} ℃、湿度 ${rh} % の空気 1 m³ 中にふくまれる水蒸気は何 g か。`,
    fig: satTable(around(rng, [T])),
    v, unit: 'g',
    wrongs: [{ v: (SAT[T] * 100) / rh, msg: '水蒸気量 = 飽和水蒸気量 × 湿度 ÷ 100。' }, { v: rh, msg: '湿度をそのまま答えている。' }],
    hint: '水蒸気量 = 飽和水蒸気量 × 湿度 ÷ 100',
    steps: [`${m(`${SAT[T].toFixed(1)}\\times ${rh}\\div 100=${dec(v)}`)}（g）`],
    verify: (x) => near((x / SAT[T]) * 100, rh),
  });
}

export default {
  id: 'sc-humid',
  subject: 'science',
  stage: 2,
  area: '理科棟・霧の部屋',
  title: '湿度と露点',
  emoji: '💧',
  prereqs: ['sc-conc'],
  tool: 'coins',
  hintCard: [
    '飽和水蒸気量: 空気 1 m³ がふくめる水蒸気の最大量（気温が高いほど多い）',
    '湿度 [%] = 水蒸気量 ÷ 飽和水蒸気量 × 100',
    '露点: 冷やしていって水滴ができはじめる温度（水蒸気量 = 飽和水蒸気量）',
    'できる水滴 = いまの水蒸気量 − 冷やした温度の飽和水蒸気量',
  ],
  generators: {
    'hm-calc': { difficulty: 2, gen: genCalc },
  },
  lessons: [
    {
      id: 'hm-l1',
      title: '湿度と露点',
      unlocks: ['hm-calc'],
      build(rng) {
        return [
          { text: '空気がふくめる水蒸気の量には限りがある（飽和水蒸気量）。気温が高いほど多くふくめる。' },
          { text: '湿度 = いまの水蒸気量 ÷ 飽和水蒸気量 × 100\n例: 20 ℃（17.3 g）の空気に 8.65 g → 50 %', q: genCalc(rng) },
          { text: '冷やしていくと、ある温度で水蒸気量 = 飽和水蒸気量 になり、水滴ができはじめる（露点）。さらに冷やすと、ふくみきれない分が水滴になる。', q: genCalc(rng) },
          { text: 'もう1問。', q: genCalc(rng) },
        ];
      },
    },
  ],
};
