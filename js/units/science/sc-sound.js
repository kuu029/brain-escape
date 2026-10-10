// 理科 第1段階（中1）: 音の性質（音の速さ・振動数・音の高さと大きさ）
//   距離 = 音の速さ × 時間。こだま（反射）は往復なので 2 でわる。振動数 [Hz] = 1秒間に振動する回数
import { sciNum, sciChoice, m, dec, near, round2 } from './kit-sci.js';

const V = 340;
function genSpeed(rng) {
  const type = rng.pick(['thunder', 'thunder', 'echo', 'speed', 'hz']);
  if (type === 'thunder') {
    const t = rng.pick([1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]);
    return sciNum({
      stem: `いなずまが光ってから ${dec(t)} 秒後に、かみなりの音が聞こえた。かみなりが発生した場所までの距離は約何 m か。音の速さを ${V} m/s とし、光は一瞬で届くものとする。`,
      v: V * t, unit: 'm',
      wrongs: [{ v: (V * t) / 2, msg: 'かみなりは片道。2 でわるのは、こだま（往復）のとき。' }, { v: V / t, msg: '距離 = 速さ × 時間。' }],
      hint: '距離 = 音の速さ × 時間（光はほぼ一瞬で届く）',
      steps: [`${m(`${V}\\times ${dec(t)}=${dec(V * t)}`)}（m）`],
      verify: (x) => near(x / V, t),
    });
  }
  if (type === 'echo') {
    const t = rng.pick([1, 2, 3, 4, 5, 6]);
    return sciNum({
      stem: `山に向かって大きな声を出すと、${t} 秒後にこだまが聞こえた。山までの距離は約何 m か。音の速さを ${V} m/s とする。`,
      v: (V * t) / 2, unit: 'm',
      wrongs: [{ v: V * t, msg: 'こだまは、山まで行ってもどってくる（往復）。2 でわる。' }],
      hint: 'こだまは往復の時間。片道 = 音の速さ × 時間 ÷ 2',
      steps: [`往復 ${m(`${V}\\times ${t}=${V * t}`)} m`, `片道 ${m(`${V * t}\\div 2=${(V * t) / 2}`)}（m）`],
      verify: (x) => near((2 * x) / V, t),
    });
  }
  if (type === 'speed') {
    const v = rng.pick([330, 335, 340, 345]);
    const t = rng.pick([2, 4, 5]);
    return sciNum({
      stem: `${v * t} m はなれた所で打った花火の音が、光が見えてから ${t} 秒後に聞こえた。このときの音の速さは何 m/s か。`,
      v, unit: 'm/s',
      wrongs: [{ v: v * t * t, msg: '速さ = 距離 ÷ 時間。' }, { v: t / (v * t), msg: '逆にわっている。' }],
      hint: '速さ = 距離 ÷ 時間',
      steps: [`${m(`${v * t}\\div ${t}=${v}`)}（m/s）`],
      verify: (x) => near(x * t, v * t),
    });
  }
  const n = rng.pick([10, 20, 40, 50, 100, 200]);
  const s = rng.pick([0.1, 0.2, 0.5, 1]);
  const hz = round2(n / s);
  return sciNum({
    stem: `ある音さは、${dec(s)} 秒間に ${n} 回振動した。この音さの振動数は何 Hz か。`,
    v: hz, unit: 'Hz',
    wrongs: [{ v: n * s, msg: '振動数 = 振動の回数 ÷ 時間（1秒あたりの回数）。' }, { v: n, msg: '1秒あたりの回数になおす。' }],
    hint: '振動数 [Hz] = 1秒間に振動する回数',
    steps: [`${m(`${n}\\div ${dec(s)}=${dec(hz)}`)}（Hz）`],
    verify: (x) => near(x * s, n),
  });
}
const FACTS = [
  { q: 'モノコードの弦を短くすると、音はどうなるか。', a: '高くなる', ws: ['低くなる', '大きくなる', '変わらない'], why: '弦が短いほど振動数が多くなり、音は高くなる。' },
  { q: 'モノコードの弦を強くはると、音はどうなるか。', a: '高くなる', ws: ['低くなる', '小さくなる', '変わらない'], why: '弦を強くはるほど振動数が多くなり、音は高くなる。' },
  { q: 'モノコードの弦を太いものにかえると、音はどうなるか。', a: '低くなる', ws: ['高くなる', '大きくなる', '変わらない'], why: '弦が太いほど振動数が少なくなり、音は低くなる。' },
  { q: '弦を強くはじくと、音はどうなるか。', a: '大きくなる', ws: ['高くなる', '低くなる', '変わらない'], why: '強くはじくと振幅が大きくなり、音は大きくなる（高さは変わらない）。' },
  { q: '音の高さを決めるものはどれか。', a: '振動数', ws: ['振幅', '音の速さ', '音源までの距離'], why: '振動数が多いほど高い音、少ないほど低い音。' },
  { q: '音の大きさを決めるものはどれか。', a: '振幅', ws: ['振動数', '音の速さ', '弦の長さ'], why: '振幅（ふれはば）が大きいほど大きな音。' },
  { q: '音が伝わらないのはどれか。', a: '真空の中', ws: ['空気の中', '水の中', '鉄の中'], why: '音は物体の振動が伝わるもの。物質のない真空では伝わらない。' },
];
function genFact(rng) {
  const F = rng.pick(FACTS);
  return sciChoice(rng, {
    stem: F.q, correct: F.a,
    wrongs: F.ws.map((t) => ({ t, msg: F.why })),
    hint: '高さ ← 振動数（弦が短い・細い・強くはる → 高い）、大きさ ← 振幅',
    steps: [F.why],
    verify: (t) => FACTS.some((x) => x.q === F.q && x.a === t),
  });
}

export default {
  id: 'sc-sound',
  subject: 'science',
  stage: 1,
  area: '理科棟・音楽室',
  title: '音の性質',
  emoji: '🔔',
  prereqs: [],
  tool: 'sniper',
  hintCard: [
    '音の速さ（空気中）: 約 340 m/s。距離 = 速さ × 時間',
    'こだま（反射）は往復 → 片道は 2 でわる',
    '振動数 [Hz] = 1秒間の振動の回数。振動数が多いほど高い音',
    '振幅が大きいほど大きい音。弦が短い・細い・強くはる → 高い音。真空では伝わらない',
  ],
  generators: {
    'sd-speed': { difficulty: 2, gen: genSpeed },
    'sd-fact': { difficulty: 1, gen: genFact },
  },
  lessons: [
    {
      id: 'sd-l1',
      title: '音の高さと大きさ',
      unlocks: ['sd-fact'],
      build(rng) {
        return [
          { text: '音は、物体の振動が空気などを伝わるもの。真空では伝わらない。\n高さ ← 振動数（1秒間の振動の回数）、大きさ ← 振幅（ふれはば）', q: genFact(rng) },
          { text: 'もう1問。', q: genFact(rng) },
        ];
      },
    },
    {
      id: 'sd-l2',
      title: '音の速さ',
      unlocks: ['sd-speed'],
      build(rng) {
        return [
          { text: '音は空気中を約 340 m/s で進む。光はほぼ一瞬で届く。\nかみなり: 距離 = 340 × 時間\nこだま: 往復なので 340 × 時間 ÷ 2', q: genSpeed(rng) },
          { text: 'もう1問。', q: genSpeed(rng) },
        ];
      },
    },
  ],
};
