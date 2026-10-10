// 理科 第1段階（中1）: 光の反射と凸レンズ
//   反射: 入射角 = 反射角（角は鏡の面に垂直な線からはかる）
//   凸レンズ: 物体が焦点距離の2倍の位置 → 反対側の2倍の位置に、同じ大きさの逆さの実像
import { sciNum, sciChoice, m } from './kit-sci.js';

function genReflect(rng) {
  const g = rng.pick([20, 25, 30, 35, 40, 45, 50, 55, 60, 70]); // 鏡の面と光のなす角
  const askI = rng.chance(0.5);
  return sciNum({
    stem: `光が、鏡の面に対して ${g}° の角度で当たった。${askI ? '入射角' : '反射角'}は何度か。`,
    v: 90 - g, unit: '°',
    wrongs: [{ v: g, msg: '入射角・反射角は、鏡の面ではなく「鏡の面に垂直な線」からはかる。' }, { v: 180 - 2 * g, msg: '入射角 = 反射角 = 90° − 鏡の面とのなす角。' }],
    hint: '入射角・反射角は、鏡の面に垂直な線（法線）と光のなす角。入射角 = 反射角。',
    steps: [`垂直な線からの角 = ${m(`90-${g}=${90 - g}`)}（°）`, `入射角 = 反射角 = ${90 - g}°`],
    verify: (x) => x + g === 90,
  });
}
// 凸レンズのきまり: a = レンズから物体までの距離、f = 焦点距離
export function lensCase(a, f) {
  if (a < f) return 'virtual';
  if (a === f) return 'none';
  if (a === 2 * f) return 'same';
  return a > 2 * f ? 'small' : 'big';
}
const CASE = {
  small: '焦点距離の2倍の位置より内側に、実物より小さい実像ができる',
  same: '焦点距離の2倍の位置に、実物と同じ大きさの実像ができる',
  big: '焦点距離の2倍の位置より外側に、実物より大きい実像ができる',
  none: '像はできない',
  virtual: 'スクリーンに像はうつらず、レンズを通して実物より大きい虚像が見える',
};
function genLens(rng) {
  const f = rng.pick([5, 8, 10, 12, 15, 20]);
  if (rng.chance(0.4)) {
    const a = 2 * f;
    const askF = rng.chance(0.5);
    return sciNum({
      stem: askF
        ? `凸レンズの前に物体を置くと、レンズの反対側 ${a} cm の位置のスクリーンに、物体と同じ大きさの像がうつった。物体はレンズから ${a} cm の位置にある。この凸レンズの焦点距離は何 cm か。`
        : `焦点距離 ${f} cm の凸レンズで、物体と同じ大きさの実像をスクリーンにうつしたい。物体をレンズから何 cm の位置に置けばよいか。`,
      v: askF ? f : a, unit: 'cm',
      wrongs: askF ? [{ v: a, msg: '同じ大きさの像ができるのは、物体が焦点距離の「2倍」の位置のとき。' }, { v: a * 2, msg: '焦点距離は、その半分。' }] : [{ v: f, msg: '焦点の位置に置くと、像はできない。2倍の位置。' }],
      hint: '物体を焦点距離の2倍の位置に置くと、反対側の2倍の位置に同じ大きさの実像ができる。',
      steps: [askF ? `${a} cm = 焦点距離の2倍 → ${m(`${a}\\div 2=${f}`)}（cm）` : `焦点距離の2倍: ${m(`${f}\\times 2=${a}`)}（cm）`],
      verify: (x) => (askF ? lensCase(a, x) === 'same' : lensCase(x, f) === 'same'),
    });
  }
  const a = rng.pick([f / 2, f, f * 1.5, f * 2, f * 3, f * 4].filter(Number.isInteger));
  const c = lensCase(a, f);
  return sciChoice(rng, {
    stem: `焦点距離 ${f} cm の凸レンズから ${a} cm の位置に物体を置いた。レンズの反対側にスクリーンを置いて動かしたとき、どうなるか。`,
    correct: CASE[c],
    wrongs: Object.entries(CASE).filter(([k]) => k !== c).map(([, t]) => ({ t, msg: `物体の位置は焦点距離の ${a / f} 倍。` })),
    hint: '物体が 2倍より遠い → 小さい実像 ／ ちょうど2倍 → 同じ大きさ ／ 焦点と2倍の間 → 大きい実像 ／ 焦点の内側 → 虚像',
    steps: [`物体の位置 = 焦点距離の ${a / f} 倍`, CASE[c]],
    verify: (t) => t === CASE[lensCase(a, f)],
  });
}

export default {
  id: 'sc-lens',
  subject: 'science',
  stage: 1,
  area: '理科棟・鏡の迷路',
  title: '光の反射と凸レンズ',
  emoji: '🪞',
  prereqs: [],
  tool: 'freeze',
  hintCard: [
    '反射の法則: 入射角 = 反射角（鏡の面に垂直な線からはかる）',
    '凸レンズ: 物体が焦点距離の2倍の位置 → 反対側の2倍の位置に同じ大きさの実像',
    '2倍より遠い → 小さい実像、焦点と2倍の間 → 大きい実像',
    '焦点の内側 → 実像はできず、大きな虚像が見える（虫めがね）',
  ],
  generators: {
    'ln-reflect': { difficulty: 1, gen: genReflect },
    'ln-lens': { difficulty: 2, gen: genLens },
  },
  lessons: [
    {
      id: 'ln-l1',
      title: '光の反射',
      unlocks: ['ln-reflect'],
      build(rng) {
        return [
          { text: '光が鏡で反射するとき、入射角と反射角は等しい。\n角は「鏡の面」ではなく「鏡の面に垂直な線」からはかる。鏡の面と 30° なら、入射角は 60°。', q: genReflect(rng) },
        ];
      },
    },
    {
      id: 'ln-l2',
      title: '凸レンズの像',
      unlocks: ['ln-lens'],
      build(rng) {
        return [
          { text: '凸レンズを通った光は、焦点に集まる。レンズから焦点までの距離を焦点距離という。\n物体を焦点距離の2倍の位置に置く → 反対側の2倍の位置に、同じ大きさで上下左右が逆の実像。', q: genLens(rng) },
          { text: '物体を近づけるほど像は大きく、遠ざけるほど小さくなる。焦点の内側では、スクリーンにうつらない虚像になる。', q: genLens(rng) },
        ];
      },
    },
  ],
};
