// 理科 第1段階（中1）: 圧力
//   圧力 [Pa] = 面を垂直におす力 [N] ÷ 力がはたらく面積 [m²]。100 g の物体にはたらく重力を 1 N とする
import { sciNum, sciChoice, m, dec, near } from './kit-sci.js';

const G100 = '（100 g の物体にはたらく重力の大きさを 1 N とする）';
const SIDE = [2, 4, 5, 8, 10, 20];
const MASS = [400, 500, 600, 800, 1000, 1200, 1600, 2000, 2400];
const m2 = (x) => String(Math.round(x * 1e6) / 1e6); // m² は小数第4位まであるので丸めない
const clean = (x) => Number.isInteger(Math.round(x * 1e6) / 1e4);

function box(rng) {
  for (;;) {
    const [a, b, c] = rng.shuffle([...SIDE]).slice(0, 3).sort((x, y) => x - y);
    const g = rng.pick(MASS);
    const faces = [[a, b], [a, c], [b, c]];
    if (faces.every(([x, y]) => clean((g * 100) / (x * y)))) return { a, b, c, g, faces };
  }
}
function genCalc(rng) {
  const { g, faces } = box(rng);
  const [x, y] = rng.pick(faces);
  const N = g / 100;
  const S = (x * y) / 10000;
  const P = (g * 100) / (x * y);
  if (rng.chance(0.7)) {
    return sciNum({
      stem: `質量 ${g} g の直方体を、${x} cm × ${y} cm の面を下にして置いた。床が受ける圧力は何 Pa か。${G100}`,
      v: P, unit: 'Pa',
      wrongs: [{ v: N / (x * y), msg: '面積を m² になおしていない。1 cm² = 0.0001 m²。' }, { v: g / (x * y), msg: '質量 g ではなく、力 N でわる（100 g → 1 N）。また面積は m² で。' }, { v: N * S, msg: '圧力 = 力 ÷ 面積。かけ算ではない。' }],
      hint: '圧力 [Pa] = 力 [N] ÷ 面積 [m²]。cm² → m² は ÷ 10000。',
      steps: [`力 = ${g} g → ${dec(N)} N`, `面積 = ${m(`${x}\\times ${y}=${x * y}`)} cm² = ${m2(S)} m²`, `${m(`${dec(N)}\\div ${m2(S)}=${dec(P)}`)}（Pa）`],
      verify: (v) => near(v * S * 100, g),
    });
  }
  return sciNum({
    stem: `ある物体を、${x} cm × ${y} cm の面を下にして置いたら、床が受ける圧力は ${dec(P)} Pa だった。この物体の質量は何 g か。${G100}`,
    v: g, unit: 'g',
    wrongs: [{ v: N, msg: 'それは力（N）。質量は 1 N → 100 g。' }, { v: (P * x * y) * 100, msg: '面積を m² になおしてからかける（1 cm² = 0.0001 m²）。' }],
    hint: '力 [N] = 圧力 [Pa] × 面積 [m²]。そのあと N → g（× 100）。',
    steps: [`面積 = ${x * y} cm² = ${m2(S)} m²`, `力 = ${m(`${dec(P)}\\times ${m2(S)}=${dec(N)}`)}（N）`, `質量 = ${dec(N)} N → ${g} g`],
    verify: (v) => near((v / 100) / S, P),
  });
}
function genFace(rng) {
  const { a, b, c, g, faces } = box(rng);
  const lab = ([x, y]) => `${x} cm × ${y} cm の面`;
  if (rng.chance(0.5)) {
    const big = rng.chance(0.5);
    const right = big ? faces[0] : faces[2];
    return sciChoice(rng, {
      stem: `${a} cm × ${b} cm × ${c} cm、質量 ${g} g の直方体がある。床が受ける圧力がいちばん${big ? '大きく' : '小さく'}なるのは、どの面を下にしたときか。`,
      correct: lab(right),
      wrongs: faces.filter((f) => f !== right).map((f) => ({ t: lab(f), msg: `力は同じなので、面積が${big ? '小さい' : '大きい'}ほど圧力は${big ? '大きい' : '小さい'}。` })),
      n: 3,
      hint: '力（重さ）はどの面でも同じ。圧力は面積が小さいほど大きい。',
      steps: [`面積: ${faces.map(([x, y]) => `${x * y} cm²`).join('、')}`, `圧力が${big ? '大きい' : '小さい'} → 面積がいちばん${big ? '小さい' : '大きい'} → ${lab(right)}`],
      verify: (t) => { const ar = faces.map(([x, y]) => x * y); const k = faces.findIndex((f) => lab(f) === t); return k >= 0 && ar[k] === (big ? Math.min(...ar) : Math.max(...ar)); },
    });
  }
  const [f1, f2] = [faces[2], faces[0]];
  const r = (f1[0] * f1[1]) / (f2[0] * f2[1]);
  return sciNum({
    stem: `${a} cm × ${b} cm × ${c} cm の直方体を、${lab(f2)}を下にして置いたときの圧力は、${lab(f1)}を下にして置いたときの圧力の何倍か。`,
    v: r, unit: '倍',
    wrongs: [{ v: 1 / r, msg: '面積が小さいほうが、圧力は大きい。' }],
    hint: '重さは同じ。圧力は面積に反比例する。',
    steps: [`面積は ${f1[0] * f1[1]} cm² と ${f2[0] * f2[1]} cm²`, `面積が ${m(`${f1[0] * f1[1]}\\div ${f2[0] * f2[1]}=${dec(r)}`)} 分の1 → 圧力は ${dec(r)} 倍`],
    verify: (v) => near(v * f2[0] * f2[1], f1[0] * f1[1]),
  });
}

export default {
  id: 'sc-pressure',
  subject: 'science',
  stage: 1,
  area: '理科棟・おしつぶし部屋',
  title: '力と圧力',
  emoji: '🧱',
  prereqs: [],
  tool: 'wall',
  hintCard: [
    '圧力 [Pa] = 面を垂直におす力 [N] ÷ 面積 [m²]',
    '100 g の物体にはたらく重力 ＝ 約 1 N',
    '1 cm² = 0.0001 m²（cm² の数 ÷ 10000）',
    '同じ重さなら、面積が小さいほど圧力は大きい',
  ],
  generators: {
    'pr-calc': { difficulty: 2, gen: genCalc },
    'pr-face': { difficulty: 1, gen: genFace },
  },
  lessons: [
    {
      id: 'pr-l1',
      title: '圧力のちがい',
      unlocks: ['pr-face'],
      build(rng) {
        return [
          { text: '雪の上で、くつだとしずむのに、スキー板だとしずみにくい。重さが広い面に分かれるから。\n1 m² あたりにはたらく力を「圧力」という。' },
          { text: '同じ物体なら、力（重さ）はどの面を下にしても同じ。面積が小さいほど圧力は大きい。', q: genFace(rng) },
        ];
      },
    },
    {
      id: 'pr-l2',
      title: '圧力の計算',
      unlocks: ['pr-calc'],
      build(rng) {
        return [
          { text: '圧力 [Pa] = 力 [N] ÷ 面積 [m²]\n① 質量 g → 力 N（100 g = 1 N）\n② 面積 cm² → m²（÷ 10000）\n③ わる\n例: 1200 g（12 N）、20 cm²（0.002 m²）→ 12 ÷ 0.002 = 6000 Pa', q: genCalc(rng) },
          { text: 'もう1問。', q: genCalc(rng) },
        ];
      },
    },
  ],
};
