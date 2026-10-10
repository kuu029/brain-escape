// 理科 第3段階（中3）: 水圧と浮力
//   浮力 [N] = 空気中でのばねばかりの値 − 水中でのばねばかりの値
import { sciNum, sciChoice, m, dec, near, round2 } from './kit-sci.js';

function genCalc(rng) {
  const air = rng.pick([1.2, 1.5, 1.8, 2, 2.4, 2.5, 3, 3.6, 4, 5]);
  const f = rng.pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1].filter((x) => x < air - 0.2));
  const water = round2(air - f);
  const type = rng.pick(['f', 'f', 'water']);
  if (type === 'f') {
    return sciNum({
      stem: `ばねばかりにつるした物体の重さは、空気中で ${dec(air)} N、全体を水中にしずめると ${dec(water)} N だった。物体にはたらく浮力は何 N か。`,
      v: f, unit: 'N',
      wrongs: [{ v: water, msg: 'それは水中でのばねばかりの値。浮力 = 空気中 − 水中。' }, { v: air + water, msg: '足すのではなく、引く。' }],
      hint: '浮力 = 空気中での重さ − 水中でのばねばかりの値',
      steps: [`${m(`${dec(air)}-${dec(water)}=${dec(f)}`)}（N）`],
      verify: (x) => near(water + x, air),
    });
  }
  return sciNum({
    stem: `空気中で ${dec(air)} N の物体を、全体を水中にしずめると、${dec(f)} N の浮力がはたらいた。このとき、ばねばかりは何 N を示すか。`,
    v: water, unit: 'N',
    wrongs: [{ v: air + f, msg: '浮力は上向きにはたらくので、ばねばかりの値は小さくなる。' }, { v: f, msg: 'それは浮力そのもの。' }],
    hint: '水中のばねばかりの値 = 空気中での重さ − 浮力',
    steps: [`${m(`${dec(air)}-${dec(f)}=${dec(water)}`)}（N）`],
    verify: (x) => near(air - x, f),
  });
}

const FACTS = [
  { q: '物体全体が水中にあるとき、さらに深くしずめると、浮力の大きさはどうなるか。', a: '変わらない', ws: ['大きくなる', '小さくなる'], why: '全体が水中にあれば、浮力は深さに関係しない（水中にある部分の体積で決まる）。' },
  { q: '物体を水に少しずつしずめていくと、全体がしずむまでの間、浮力の大きさはどうなるか。', a: '大きくなる', ws: ['変わらない', '小さくなる'], why: '水中にある部分の体積が大きくなるほど、浮力は大きくなる。' },
  { q: '同じ材質で体積が大きい物体と小さい物体を、それぞれ全体を水中にしずめた。浮力が大きいのはどちらか。', a: '体積が大きい物体', ws: ['体積が小さい物体', 'どちらも同じ'], why: '浮力は、水中にある部分の体積が大きいほど大きい。' },
  { q: '水圧の大きさは、水の深さとどのような関係があるか。', a: '深いほど大きい', ws: ['浅いほど大きい', '深さに関係しない'], why: '水圧は、その上にある水の重さによる圧力なので、深いほど大きい。' },
  { q: '水中にある物体に、水圧はどの向きからはたらくか。', a: 'あらゆる向きから', ws: ['上からだけ', '下からだけ'], why: '水圧は、あらゆる向きから物体の面に垂直にはたらく。' },
  { q: '水中の物体に浮力が生じるのはなぜか。', a: '下の面にはたらく水圧のほうが、上の面より大きいから', ws: ['上の面にはたらく水圧のほうが、下の面より大きいから', '水中では、物体にはたらく重力がなくなるから'], why: '深い所ほど水圧が大きいので、物体の下の面のほうが大きな力でおされる。その差が上向きの浮力になる。' },
];
function genFact(rng) {
  const F = rng.pick(FACTS);
  return sciChoice(rng, {
    stem: F.q,
    correct: F.a,
    wrongs: F.ws.map((t) => ({ t, msg: F.why })),
    n: 3,
    hint: '水圧は深いほど大きく、あらゆる向きからはたらく。浮力は水中にある部分の体積で決まる。',
    steps: [F.why],
    verify: (t) => FACTS.some((x) => x.q === F.q && x.a === t),
  });
}

export default {
  id: 'sc-buoy',
  subject: 'science',
  stage: 3,
  area: '理科棟・地下プール',
  title: '水圧と浮力',
  emoji: '🛟',
  prereqs: ['sc-pressure'],
  tool: 'heal',
  hintCard: [
    '水圧: 深いほど大きい、あらゆる向きから面に垂直にはたらく',
    '浮力 = 空気中での重さ − 水中でのばねばかりの値',
    '浮力は、水中にある部分の体積が大きいほど大きい（全体がしずめば深さに関係ない）',
  ],
  generators: {
    'bu-calc': { difficulty: 1, gen: genCalc },
    'bu-fact': { difficulty: 2, gen: genFact },
  },
  lessons: [
    {
      id: 'bu-l1',
      title: '水圧と浮力',
      unlocks: ['bu-fact', 'bu-calc'],
      build(rng) {
        return [
          { text: '水の中では、上にある水の重さによる圧力（水圧）がはたらく。深いほど大きく、あらゆる向きからはたらく。' },
          { text: '物体の下の面は上の面より深いので、下からおす力のほうが大きい。この差が、上向きの「浮力」。', q: genFact(rng) },
          { text: '浮力 = 空気中での重さ − 水中でのばねばかりの値', q: genCalc(rng) },
        ];
      },
    },
  ],
};
