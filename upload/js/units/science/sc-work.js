// 理科 第3段階（中3）: 仕事と仕事率（仕事の原理: 道具を使っても仕事の大きさは変わらない）
//   仕事 [J] = 力 [N] × 力の向きに動いた距離 [m]、仕事率 [W] = 仕事 [J] ÷ 時間 [s]
import { sciNum, m, dec, near } from './kit-sci.js';

const G100 = '（100 g の物体にはたらく重力の大きさを 1 N とする）';

function genCalc(rng) {
  const g = rng.pick([200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000]);
  const N = g / 100;
  const cm = rng.pick([20, 30, 40, 50, 60, 80, 100, 120, 150, 200]);
  const h = cm / 100;
  const J = N * h;
  if (rng.chance(0.6)) {
    return sciNum({
      stem: `質量 ${g} g の物体を、ゆっくりと ${cm} cm 真上に持ち上げた。このときの仕事は何 J か。${G100}`,
      v: J, unit: 'J',
      wrongs: [{ v: N * cm, msg: '距離は m になおす（100 cm = 1 m）。' }, { v: g * h, msg: '質量 g ではなく、力 N をかける（100 g → 1 N）。' }],
      hint: '仕事 [J] = 力 [N] × 距離 [m]',
      steps: [`力 = ${g} g → ${dec(N)} N、距離 = ${cm} cm = ${dec(h)} m`, `${m(`${dec(N)}\\times ${dec(h)}=${dec(J)}`)}（J）`],
      verify: (x) => near(x / h, g / 100),
    });
  }
  const s = rng.pick([2, 4, 5, 8, 10].filter((t) => Number.isInteger(Math.round((J / t) * 1e5) / 1e3))) || 2;
  return sciNum({
    stem: `質量 ${g} g の物体を、${s} 秒かけて ${cm} cm 真上に持ち上げた。このときの仕事率は何 W か。${G100}`,
    v: J / s, unit: 'W',
    wrongs: [{ v: J * s, msg: '仕事率 = 仕事 ÷ 時間。' }, { v: J, msg: 'それは仕事（J）。時間でわると仕事率。' }],
    hint: '仕事率 [W] = 仕事 [J] ÷ 時間 [秒]',
    steps: [`仕事 = ${m(`${dec(N)}\\times ${dec(h)}=${dec(J)}`)}（J）`, `${m(`${dec(J)}\\div ${s}=${dec(J / s)}`)}（W）`],
    verify: (x) => near(x * s, (g / 100) * h),
  });
}

// 動滑車・斜面: 力が小さくなる分、動かす距離が長くなる（仕事は同じ）
function genTool(rng) {
  const g = rng.pick([400, 600, 800, 1000, 1200, 1600, 2000]);
  const N = g / 100;
  const cm = rng.pick([20, 30, 40, 50, 60, 100]);
  const h = cm / 100;
  if (rng.chance(0.5)) {
    const askF = rng.chance(0.5);
    return sciNum({
      stem: `質量 ${g} g の物体を、動滑車を1つ使って ${cm} cm 持ち上げた。${askF ? 'ひもを引く力は何 N か' : 'ひもを引いた長さは何 cm か'}。（動滑車とひもの質量・まさつは考えない）${G100}`,
      v: askF ? N / 2 : cm * 2, unit: askF ? 'N' : 'cm',
      wrongs: askF ? [{ v: N, msg: '動滑車では、力は半分になる（ひも2本で支える）。' }, { v: N * 2, msg: '力は2倍ではなく、半分。' }] : [{ v: cm, msg: '動滑車では、引く長さは2倍になる。' }, { v: cm / 2, msg: '力が半分になる代わりに、引く長さは2倍。' }],
      hint: '動滑車: 力は 1/2、引く長さは 2倍（仕事は同じ）',
      steps: askF ? [`物体の重さ ${dec(N)} N`, `${m(`${dec(N)}\\div 2=${dec(N / 2)}`)}（N）`] : [`${m(`${cm}\\times 2=${cm * 2}`)}（cm）`],
      verify: askF ? (x) => near(x * (2 * h), N * h) : (x) => near((N / 2) * (x / 100), N * h),
    });
  }
  const L = rng.pick([2, 3, 4, 5].map((k) => cm * k).filter((x) => x <= 300 && Number.isInteger(Math.round(((N * cm) / x) * 1e5) / 1e3))) || cm * 2;
  const F = (N * cm) / L;
  return sciNum({
    stem: `質量 ${g} g の物体を、長さ ${L} cm の斜面にそって、高さ ${cm} cm まで引き上げた。斜面にそって引く力は何 N か。（まさつは考えない）${G100}`,
    v: F, unit: 'N',
    wrongs: [{ v: N, msg: '斜面を使うと、力は小さくてすむ（距離が長くなる）。' }, { v: (N * L) / cm, msg: '逆。斜面が長いほど、力は小さい。' }],
    hint: '仕事の原理: 斜面で引く力 × 斜面の長さ ＝ 重さ × 高さ',
    steps: [`真上に持ち上げる仕事 = ${m(`${dec(N)}\\times ${dec(h)}=${dec(N * h)}`)}（J）`, `斜面の長さ ${dec(L / 100)} m で同じ仕事 → ${m(`${dec(N * h)}\\div ${dec(L / 100)}=${dec(F)}`)}（N）`],
    verify: (x) => near(x * L, N * cm),
  });
}

export default {
  id: 'sc-work',
  subject: 'science',
  stage: 3,
  area: '理科棟・からくり工房',
  title: '仕事と仕事率',
  emoji: '⚙️',
  prereqs: ['sc-pressure'],
  tool: 'mega',
  hintCard: [
    '仕事 [J] = 力 [N] × 力の向きに動いた距離 [m]',
    '仕事率 [W] = 仕事 [J] ÷ 時間 [秒]',
    '動滑車: 力は 1/2、引く長さは 2倍',
    '仕事の原理: 道具を使っても、仕事の大きさは変わらない（斜面: 力 × 長さ = 重さ × 高さ）',
  ],
  generators: {
    'wk-calc': { difficulty: 1, gen: genCalc },
    'wk-tool': { difficulty: 3, gen: genTool },
  },
  lessons: [
    {
      id: 'wk-l1',
      title: '仕事と仕事率',
      unlocks: ['wk-calc'],
      build(rng) {
        return [
          { text: '理科の「仕事」は、力 × 力の向きに動いた距離。単位は J（ジュール）。\n例: 10 N の物体を 0.5 m 持ち上げる → 5 J', q: genCalc(rng) },
          { text: '仕事率は、1秒あたりの仕事。仕事 ÷ 時間。単位は W（ワット）。', q: genCalc(rng) },
        ];
      },
    },
    {
      id: 'wk-l2',
      title: '道具と仕事の原理',
      unlocks: ['wk-tool'],
      build(rng) {
        return [
          { text: '動滑車や斜面を使うと、力は小さくなるが、動かす距離が長くなる。仕事（力 × 距離）は変わらない（仕事の原理）。' },
          { text: '動滑車: 力 1/2・ひもを引く長さ 2倍\n斜面: 引く力 × 斜面の長さ = 重さ × 高さ', q: genTool(rng) },
          { text: 'もう1問。', q: genTool(rng) },
        ];
      },
    },
  ],
};
