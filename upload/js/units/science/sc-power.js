// 理科 第2段階（中2）: 電力と熱量
//   電力 [W] = 電圧 [V] × 電流 [A]、熱量 [J] = 電力 [W] × 時間 [s]、電力量 [Wh] = 電力 [W] × 時間 [h]
import { sciNum, m, dec, near } from './kit-sci.js';

const APPL = [['ドライヤー', [1000, 1200]], ['電子レンジ', [500, 600, 800]], ['電気ケトル', [1000, 1200, 1300]], ['トースター', [800, 1000]], ['電球', [40, 60, 100]]];

function genPower(rng) {
  const type = rng.pick(['I', 'P', 'J', 'J', 'Wh']);
  if (type === 'I') {
    const [name, ws] = rng.pick(APPL);
    const P = rng.pick(ws);
    return sciNum({
      stem: `「100 V ${P} W」と書かれた${name}を 100 V のコンセントで使った。流れる電流は何 A か。`,
      v: P / 100, unit: 'A',
      wrongs: [{ v: P * 100, msg: '電流 = 電力 ÷ 電圧。' }, { v: P, msg: '電力をそのまま答えている。' }],
      hint: '電力 = 電圧 × 電流 → 電流 = 電力 ÷ 電圧',
      steps: [`${m(`${P}\\div 100=${dec(P / 100)}`)}（A）`],
      verify: (x) => near(x * 100, P),
    });
  }
  if (type === 'P') {
    const V = rng.pick([1.5, 3, 4, 6, 9, 12]);
    const I = rng.pick([0.5, 1, 1.5, 2, 2.5, 3]);
    return sciNum({
      stem: `電熱線に ${dec(V)} V の電圧をかけると、${dec(I)} A の電流が流れた。電熱線が消費する電力は何 W か。`,
      v: V * I, unit: 'W',
      wrongs: [{ v: V / I, msg: 'それは抵抗（Ω）。電力 = 電圧 × 電流。' }, { v: V + I, msg: '電力 = 電圧 × 電流。' }],
      hint: '電力 [W] = 電圧 [V] × 電流 [A]',
      steps: [`${m(`${dec(V)}\\times ${dec(I)}=${dec(V * I)}`)}（W）`],
      verify: (x) => near(x / V, I),
    });
  }
  if (type === 'J') {
    const P = rng.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
    const min = rng.pick([1, 2, 3, 5, 10]);
    return sciNum({
      stem: `${P} W の電熱線に ${min} 分間電流を流した。発生した熱量は何 J か。`,
      v: P * min * 60, unit: 'J',
      wrongs: [{ v: P * min, msg: '時間は「秒」になおす（1分 = 60秒）。' }, { v: (P * min) / 60, msg: '分を秒にするときは × 60。' }],
      hint: '熱量 [J] = 電力 [W] × 時間 [秒]',
      steps: [`${min} 分 = ${min * 60} 秒`, `${m(`${P}\\times ${min * 60}=${P * min * 60}`)}（J）`],
      verify: (x) => near(x / 60 / min, P),
    });
  }
  const [name, ws] = rng.pick(APPL);
  const P = rng.pick(ws);
  const min = rng.pick([15, 30, 45, 60, 90, 120]);
  return sciNum({
    stem: `${P} W の${name}を ${min} 分間使った。電力量は何 Wh か。`,
    v: (P * min) / 60, unit: 'Wh',
    wrongs: [{ v: P * min, msg: 'Wh は「W × 時間（h）」。分を時間になおす（÷ 60）。' }, { v: P * min * 60, msg: 'それは J のときの計算。Wh は時間（h）をかける。' }],
    hint: '電力量 [Wh] = 電力 [W] × 時間 [h]（分 ÷ 60 = 時間）',
    steps: [`${min} 分 = ${dec(min / 60)} 時間`, `${m(`${P}\\times ${dec(min / 60)}=${dec((P * min) / 60)}`)}（Wh）`],
    verify: (x) => near((x / P) * 60, min),
  });
}

// 水の温度上昇は、電力 × 時間（熱量）に比例する（水の量が同じとき）
function genTemp(rng) {
  for (;;) {
    const P1 = rng.pick([2, 3, 4, 6]);
    const t1 = rng.pick([2, 4, 5]);
    const d1 = rng.pick([1, 1.5, 2, 2.5, 3]);
    const P2 = rng.pick([2, 3, 4, 6, 8, 9, 12].filter((x) => x !== P1));
    const t2 = rng.pick([2, 4, 5, 6, 10]);
    const d2 = (d1 * P2 * t2) / (P1 * t1);
    if (!Number.isInteger(Math.round(d2 * 1e6) / 1e5) || d2 > 20) continue;
    return sciNum({
      stem: `ある量の水に ${P1} W の電熱線を入れて ${t1} 分間電流を流すと、水温が ${dec(d1)} ℃ 上がった。同じ量の水に ${P2} W の電熱線を入れて ${t2} 分間電流を流すと、水温は何 ℃ 上がるか。（熱はすべて水の温度上昇に使われるものとする）`,
      v: d2, unit: '℃',
      wrongs: [{ v: (d1 * P2) / P1, msg: '時間のちがいも考える。上がる温度は「電力 × 時間」に比例。' }, { v: (d1 * t2) / t1, msg: '電力のちがいも考える。' }],
      hint: '水の量が同じなら、上がる温度は 電力 × 時間（＝熱量）に比例する。',
      steps: [`はじめ: ${m(`${P1}\\times ${t1}=${P1 * t1}`)}、あと: ${m(`${P2}\\times ${t2}=${P2 * t2}`)}`, `${m(`${dec(d1)}\\times ${P2 * t2}\\div ${P1 * t1}=${dec(d2)}`)}（℃）`],
      verify: (x) => near(x / (P2 * t2 * 60), d1 / (P1 * t1 * 60)),
    });
  }
}

export default {
  id: 'sc-power',
  subject: 'science',
  stage: 2,
  area: '理科棟・ボイラー室',
  title: '電力と熱量',
  emoji: '💡',
  prereqs: ['sc-ohm'],
  tool: 'double',
  hintCard: [
    '電力 [W] = 電圧 [V] × 電流 [A]',
    '熱量 [J] = 電力 [W] × 時間 [秒]（分 × 60 = 秒）',
    '電力量 [Wh] = 電力 [W] × 時間 [h]',
    '水の量が同じなら、上がる温度は 電力 × 時間 に比例',
  ],
  generators: {
    'pw-calc': { difficulty: 2, gen: genPower },
    'pw-temp': { difficulty: 3, gen: genTemp },
  },
  lessons: [
    {
      id: 'pw-l1',
      title: '電力・熱量・電力量',
      unlocks: ['pw-calc'],
      build(rng) {
        return [
          { text: '電力（W）は、1秒あたりに使う電気のはたらきの大きさ。\n電力 = 電圧 × 電流（100 V・1200 W のドライヤー → 12 A）' },
          { text: '熱量（J）= 電力 × 秒、電力量（Wh）= 電力 × 時間（h）。\n単位で「秒」か「時間」かが決まる。', q: genPower(rng) },
          { text: 'もう1問。', q: genPower(rng) },
        ];
      },
    },
    {
      id: 'pw-l2',
      title: '水の温度上昇',
      unlocks: ['pw-temp'],
      build(rng) {
        return [
          { text: '同じ量の水なら、上がる温度は 電力 × 時間 に比例。\n例: 3 W・5 分で 2 ℃ → 6 W・5 分なら 4 ℃、3 W・10 分でも 4 ℃', q: genTemp(rng) },
        ];
      },
    },
  ],
};
