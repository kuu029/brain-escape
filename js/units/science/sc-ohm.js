// 理科 第2段階（中2）: 電流と電圧（オームの法則・直列と並列）
//   電圧 [V] = 抵抗 [Ω] × 電流 [A]。直列: 抵抗は足し算、電流はどこも同じ。並列: 電圧はどこも同じ、電流は足し算
import { sciNum, m, dec, near, chart } from './kit-sci.js';

const R = [2, 4, 5, 10, 15, 20, 25, 30, 40, 50];
const I = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.5, 2];
const mA = (i) => Math.round(i * 1000);

function genOhm(rng) {
  const r = rng.pick(R);
  const i = rng.pick(I);
  const v = Math.round(r * i * 1000) / 1000;
  const useMA = i < 1 && rng.chance(0.5);
  const iTxt = useMA ? `${mA(i)} mA` : `${dec(i)} A`;
  const type = rng.pick(['V', 'R', 'R', 'I']);
  if (type === 'V') {
    return sciNum({
      stem: `${r} Ω の抵抗に ${iTxt} の電流が流れている。抵抗にかかる電圧は何 V か。`,
      v, unit: 'V',
      wrongs: [{ v: r * mA(i), msg: 'mA を A になおしていない（1000 mA = 1 A）。' }, { v: r / i, msg: '電圧 = 抵抗 × 電流。わり算ではない。' }],
      hint: '電圧 [V] = 抵抗 [Ω] × 電流 [A]。mA は A になおす（÷ 1000）。',
      steps: [useMA ? `${mA(i)} mA = ${dec(i)} A` : '', `${m(`${r}\\times ${dec(i)}=${dec(v)}`)}（V）`].filter(Boolean),
      verify: (x) => near(x / r, i),
    });
  }
  if (type === 'R') {
    return sciNum({
      stem: `ある抵抗に ${dec(v)} V の電圧をかけると、${iTxt} の電流が流れた。この抵抗は何 Ω か。`,
      v: r, unit: 'Ω',
      wrongs: [{ v: v / mA(i), msg: 'mA を A になおしていない。' }, { v: v * i, msg: '抵抗 = 電圧 ÷ 電流。' }, { v: i / v, msg: '逆にわっている。抵抗 = 電圧 ÷ 電流。' }],
      hint: '抵抗 [Ω] = 電圧 [V] ÷ 電流 [A]',
      steps: [useMA ? `${mA(i)} mA = ${dec(i)} A` : '', `${m(`${dec(v)}\\div ${dec(i)}=${r}`)}（Ω）`].filter(Boolean),
      verify: (x) => near(x * i, v),
    });
  }
  const askMA = rng.chance(0.5) && i < 1;
  return sciNum({
    stem: `${r} Ω の抵抗に ${dec(v)} V の電圧をかけた。流れる電流は何 ${askMA ? 'mA' : 'A'} か。`,
    v: askMA ? mA(i) : i, unit: askMA ? 'mA' : 'A',
    wrongs: [{ v: askMA ? i : mA(i), msg: askMA ? 'mA で答える（1 A = 1000 mA）。' : 'A で答える。' }, { v: v * r, msg: '電流 = 電圧 ÷ 抵抗。' }],
    hint: '電流 [A] = 電圧 [V] ÷ 抵抗 [Ω]',
    steps: [`${m(`${dec(v)}\\div ${r}=${dec(i)}`)}（A）`, askMA ? `${dec(i)} A = ${mA(i)} mA` : ''].filter(Boolean),
    verify: (x) => near((askMA ? x / 1000 : x) * r, v),
  });
}

// 並列で合成抵抗がきれいになる組
const PAR = [[3, 6], [4, 4], [6, 12], [10, 15], [20, 30], [10, 40], [12, 24], [20, 20], [30, 60], [10, 10], [5, 20], [6, 3]];
function genCircuit(rng) {
  const series = rng.chance(0.5);
  const [r1, r2] = series ? rng.shuffle([...R]).slice(0, 2) : rng.pick(PAR);
  const total = series ? r1 + r2 : (r1 * r2) / (r1 + r2);
  const ok2 = (x) => Number.isInteger(Math.round(x * 1e6) / 1e4);
  const vs = (series ? [1.5, 3, 4.5, 6, 9, 12, 15, 20, 30] : [3, 6, 9, 12, 15, 20, 30, 60]).filter((V) => ok2(V / total) && ok2(V / r1) && ok2(V / r2));
  const vSrc = vs.length ? rng.pick(vs) : total;
  const kind = series ? '直列' : '並列';
  if (rng.chance(0.5)) {
    return sciNum({
      stem: `${r1} Ω と ${r2} Ω の抵抗を${kind}につないだ。全体の抵抗は何 Ω か。`,
      v: total, unit: 'Ω',
      wrongs: [{ v: series ? (r1 * r2) / (r1 + r2) : r1 + r2, msg: series ? '直列は足し算（並列とまちがえている）。' : '並列は足し算ではない。全体の抵抗は、どちらの抵抗よりも小さくなる。' }, { v: r1 * r2, msg: 'かけるだけではない。' }],
      hint: series ? '直列: 全体の抵抗 = R₁ + R₂' : '並列: 全体の抵抗 = (R₁ × R₂) ÷ (R₁ + R₂)（どちらの抵抗よりも小さくなる）',
      steps: [series ? `${m(`${r1}+${r2}=${total}`)}（Ω）` : `${m(`${r1}\\times ${r2}\\div (${r1}+${r2})=${dec(total)}`)}（Ω）`],
      verify: (x) => (series ? near(x, r1 + r2) : near(1 / x, 1 / r1 + 1 / r2)),
    });
  }
  const iAll = vSrc / total;
  return sciNum({
    stem: `${r1} Ω と ${r2} Ω の抵抗を${kind}につなぎ、電源の電圧を ${vSrc} V にした。電源から流れ出る電流は何 A か。`,
    v: Math.round(iAll * 1000) / 1000, unit: 'A',
    wrongs: [{ v: vSrc / r1, msg: series ? '直列では、全体の抵抗（足し算）でわる。' : `それは ${r1} Ω に流れる電流だけ。並列では、それぞれの電流を足す。` }, { v: vSrc / (series ? (r1 * r2) / (r1 + r2) : r1 + r2), msg: series ? '直列の全体の抵抗は足し算。' : '並列の全体の抵抗は足し算ではない。' }],
    hint: series ? '直列: 電流はどこも同じ。全体の抵抗（足し算）で電圧をわる。' : '並列: どちらの抵抗にも電源と同じ電圧。それぞれの電流を足す。',
    steps: series
      ? [`全体の抵抗 ${m(`${r1}+${r2}=${total}`)} Ω`, `${m(`${vSrc}\\div ${total}=${dec(iAll)}`)}（A）`]
      : [`${r1} Ω: ${m(`${vSrc}\\div ${r1}=${dec(vSrc / r1)}`)} A`, `${r2} Ω: ${m(`${vSrc}\\div ${r2}=${dec(vSrc / r2)}`)} A`, `合計 ${m(`${dec(vSrc / r1)}+${dec(vSrc / r2)}=${dec(iAll)}`)}（A）`],
    verify: (x) => (series ? near(x * (r1 + r2), vSrc) : near(x, vSrc / r1 + vSrc / r2)),
  });
}

// グラフの読み取り: 抵抗A・Bに加えた電圧と流れた電流
const GR = [10, 15, 20, 30];
function genGraph(rng) {
  const [ra, rb] = rng.shuffle([...GR]).slice(0, 2);
  const who = rng.pick(['A', 'B']);
  const R = who === 'A' ? ra : rb;
  const fig = chart({ x: [0, 6], y: [0, 0.6], xs: 1, ys: 0.1, xlab: '電圧〔V〕', ylab: '電流〔A〕', lines: [{ pts: [[0, 0], [6, 6 / ra]], label: 'A' }, { pts: [[0, 0], [6, 6 / rb]], label: 'B' }] });
  // 目盛りがちょうど読める点（電圧が整数で、電流が 0.1 の倍数）
  const V = [1, 2, 3, 4, 5, 6].find((v) => near(Math.round((v / R) * 10) / 10, v / R));
  if (rng.chance(0.5)) {
    return sciNum({
      stem: `図は、抵抗A・Bに加えた電圧と、流れた電流の関係を表したグラフ。抵抗${who}の抵抗は何Ωか。`,
      fig, v: R, unit: 'Ω',
      wrongs: [{ v: (V / R) / V, msg: '電流 ÷ 電圧 になっている。抵抗 = 電圧 ÷ 電流。' }, { v: who === 'A' ? rb : ra, msg: `それは抵抗${who === 'A' ? 'B' : 'A'}。` }],
      hint: `抵抗${who}の線上で、目盛りがちょうど読める点をさがす。抵抗 = 電圧 ÷ 電流。`,
      steps: [`抵抗${who}: ${V} V のとき ${dec(V / R)} A`, `${m(`${V}\\div ${dec(V / R)}=${R}`)}（Ω）`],
      verify: (x) => near(V / x, V / R),
    });
  }
  const v = 9;
  return sciNum({
    stem: `図は、抵抗A・Bに加えた電圧と、流れた電流の関係を表したグラフ。抵抗${who}に ${v} V の電圧を加えると、何 A の電流が流れるか。`,
    fig, v: v / R, unit: 'A',
    wrongs: [{ v: v * R, msg: '電圧 × 抵抗 になっている。電流 = 電圧 ÷ 抵抗。' }, { v: v / (who === 'A' ? rb : ra), msg: `それは抵抗${who === 'A' ? 'B' : 'A'}の場合。` }],
    hint: `グラフは 6 V まで。まず抵抗${who}の抵抗（電圧 ÷ 電流）を求めてから、${v} V のときを計算する。電流は電圧に比例する。`,
    steps: [`抵抗${who} = ${m(`${V}\\div ${dec(V / R)}=${R}`)} Ω`, `${m(`${v}\\div ${R}=${dec(v / R)}`)}（A）`],
    verify: (x) => near(x * R, v),
  });
}

export default {
  id: 'sc-ohm',
  subject: 'science',
  stage: 2,
  area: '理科棟・配電室',
  title: '電流と電圧',
  emoji: '🔌',
  prereqs: ['sc-density'],
  tool: 'sniper',
  hintCard: [
    'オームの法則: 電圧 [V] = 抵抗 [Ω] × 電流 [A]',
    '1 A = 1000 mA（mA は ÷ 1000 で A に）',
    '直列: 電流はどこも同じ、全体の抵抗 = R₁ + R₂',
    '並列: 電圧はどこも同じ、電流は足し算（全体の抵抗はどちらよりも小さい）',
  ],
  generators: {
    'om-calc': { difficulty: 1, gen: genOhm },
    'om-circuit': { difficulty: 3, gen: genCircuit },
    'om-graph': { difficulty: 2, gen: genGraph },
  },
  lessons: [
    {
      id: 'om-l1',
      title: 'オームの法則',
      unlocks: ['om-calc'],
      build(rng) {
        return [
          { text: '電圧 = 抵抗 × 電流（V = R × I）。\n覚え方: 「V」を上、「R」と「I」を下にした三角形。かくしたものが答え。' },
          { text: '電流が mA のときは、A になおしてから計算（300 mA = 0.3 A）。', q: genOhm(rng) },
          { text: 'もう1問。', q: genOhm(rng) },
        ];
      },
    },
    {
      id: 'om-l2',
      title: '直列と並列',
      unlocks: ['om-circuit', 'om-graph'],
      build(rng) {
        return [
          { text: '直列（1本道）: 電流はどこも同じ。全体の抵抗は足し算。\n並列（枝分かれ）: どの枝にも電源と同じ電圧。電流は足し算。\n例: 3 Ω と 6 Ω の並列 → 3 × 6 ÷ (3 + 6) = 2 Ω', q: genCircuit(rng) },
          { text: 'もう1問。', q: genCircuit(rng) },
        ];
      },
    },
  ],
};
