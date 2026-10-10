// 理科 第1段階（中1）: 密度
//   密度 [g/cm³] = 質量 [g] ÷ 体積 [cm³]
import { sciNum, sciChoice, table, m, dec, near, round2 } from './kit-sci.js';

// 物質の密度（20℃ ごろ。教科書でよく使う値）
export const SUBST = [['エタノール', 0.79], ['水', 1.0], ['アルミニウム', 2.7], ['鉄', 7.87], ['銅', 8.96], ['鉛', 11.35], ['金', 19.32]];
const RHO = [0.8, 1.2, 1.5, 2.5, 2.7, 7.9, 8.9, 11.3, 0.9, 1.1];
const VOL = [2, 4, 5, 10, 20, 25, 50];

function genCalc(rng) {
  const rho = rng.pick(RHO);
  const V = rng.pick(VOL);
  const M = round2(rho * V);
  const type = rng.pick(['rho', 'rho', 'mass', 'vol']);
  if (type === 'rho') {
    return sciNum({
      stem: `質量 ${dec(M)} g、体積 ${V} cm³ の物質の密度は何 g/cm³ か。`,
      v: rho, unit: 'g/cm³',
      wrongs: [{ v: V / M, msg: '逆にわっている。密度 = 質量 ÷ 体積。' }, { v: M * V, msg: 'かけ算ではなく、わり算。密度 = 質量 ÷ 体積。' }],
      hint: '密度 = 質量 ÷ 体積（1 cm³ あたりの質量）',
      steps: ['密度 = 質量 ÷ 体積', `${m(`${dec(M)}\\div ${V}=${dec(rho)}`)}（g/cm³）`],
      verify: (x) => near(x * V, M),
    });
  }
  if (type === 'mass') {
    return sciNum({
      stem: `密度 ${dec(rho)} g/cm³ の物質が ${V} cm³ ある。質量は何 g か。`,
      v: M, unit: 'g',
      wrongs: [{ v: V / rho, msg: '質量 = 密度 × 体積。わるのではなく、かける。' }, { v: rho / V, msg: '質量 = 密度 × 体積。' }],
      hint: '質量 = 密度 × 体積',
      steps: ['質量 = 密度 × 体積', `${m(`${dec(rho)}\\times ${V}=${dec(M)}`)}（g）`],
      verify: (x) => near(x / V, rho),
    });
  }
  return sciNum({
    stem: `密度 ${dec(rho)} g/cm³ の物質が ${dec(M)} g ある。体積は何 cm³ か。`,
    v: V, unit: 'cm³',
    wrongs: [{ v: M * rho, msg: '体積 = 質量 ÷ 密度。かけるのではなく、わる。' }, { v: rho / M, msg: '逆にわっている。体積 = 質量 ÷ 密度。' }],
    hint: '体積 = 質量 ÷ 密度',
    steps: ['体積 = 質量 ÷ 密度', `${m(`${dec(M)}\\div ${dec(rho)}=${V}`)}（cm³）`],
    verify: (x) => near(M / x, rho),
  });
}

const substTable = (list) => table(['物質', '密度 (g/cm³)'], list.map(([n, r]) => [n, r.toFixed(2)]));
function genWhich(rng) {
  const list = rng.shuffle(SUBST.filter(([n]) => n !== '水')).slice(0, 4);
  const [name, rho] = rng.pick(list);
  const V = rng.pick([2, 4, 5, 10, 20]);
  const M = round2(rho * V);
  return sciChoice(rng, {
    stem: `体積 ${V} cm³、質量 ${dec(M)} g の金属がある。表から考えて、この金属は何か。`,
    fig: substTable(list),
    correct: name,
    wrongs: list.filter(([n]) => n !== name).map(([n]) => ({ t: n, msg: `密度 = ${dec(M)} ÷ ${V} = ${dec(rho)} g/cm³。表で同じ密度の物質をさがす。` })),
    hint: 'まず密度（質量 ÷ 体積）を求めて、表とくらべる。密度は物質ごとに決まっている。',
    steps: [`密度 = ${m(`${dec(M)}\\div ${V}=${dec(rho)}`)}（g/cm³）`, `表で ${rho.toFixed(2)} → ${name}`],
    verify: (t) => list.some(([n, r]) => n === t && near(r * V, M)),
  });
}
function genFloat(rng) {
  const liquid = rng.pick([['水', 1.0], ['エタノール', 0.79]]);
  const rho = rng.pick([0.5, 0.6, 0.7, 0.9, 1.2, 1.4, 2.7, 0.92].filter((r) => r !== liquid[1] && Math.abs(r - liquid[1]) > 0.05));
  const V = rng.pick([10, 20, 50]);
  const M = round2(rho * V);
  const floats = rho < liquid[1];
  return sciChoice(rng, {
    stem: `体積 ${V} cm³、質量 ${dec(M)} g の物体を${liquid[0]}（密度 ${liquid[1].toFixed(2)} g/cm³）に入れると、どうなるか。`,
    correct: floats ? '浮く' : 'しずむ',
    wrongs: [{ t: floats ? 'しずむ' : '浮く', msg: `物体の密度は ${dec(rho)} g/cm³。液体より密度が小さいと浮き、大きいとしずむ。` }],
    n: 2,
    hint: '物体の密度が液体の密度より小さいと浮く、大きいとしずむ。',
    steps: [`物体の密度 = ${m(`${dec(M)}\\div ${V}=${dec(rho)}`)}（g/cm³）`, `${liquid[0]}は ${liquid[1].toFixed(2)} g/cm³ → ${floats ? '物体のほうが小さいので浮く' : '物体のほうが大きいのでしずむ'}`],
    verify: (t) => t === (M / V < liquid[1] ? '浮く' : 'しずむ'),
  });
}

export default {
  id: 'sc-density',
  subject: 'science',
  stage: 1,
  area: '理科棟・計量室',
  title: '密度',
  emoji: '⚖️',
  prereqs: [],
  tool: 'freeze',
  hintCard: [
    '密度 [g/cm³] = 質量 [g] ÷ 体積 [cm³]（1 cm³ あたりの質量）',
    '質量 = 密度 × 体積 ／ 体積 = 質量 ÷ 密度',
    '密度は物質ごとに決まっている → 物質の見分けに使える',
    '液体より密度が小さい物体は浮き、大きい物体はしずむ',
  ],
  generators: {
    'dn-calc': { difficulty: 1, gen: genCalc },
    'dn-which': { difficulty: 2, gen: genWhich },
    'dn-float': { difficulty: 1, gen: genFloat },
  },
  lessons: [
    {
      id: 'dn-l1',
      title: '密度の計算',
      unlocks: ['dn-calc'],
      build(rng) {
        return [
          { text: '同じ大きさでも、鉄は重く、木は軽い。この「1 cm³ あたりの質量」を密度という。' },
          { text: '密度 = 質量 ÷ 体積\n例: 54 g・20 cm³ → 54 ÷ 20 = 2.7 g/cm³（アルミニウム）', q: genCalc(rng) },
          { text: '式の形を変えると、質量 = 密度 × 体積、体積 = 質量 ÷ 密度。', q: genCalc(rng) },
        ];
      },
    },
    {
      id: 'dn-l2',
      title: '物質の見分け・浮き沈み',
      unlocks: ['dn-which', 'dn-float'],
      build(rng) {
        return [
          { text: '密度は物質ごとに決まっているので、密度を求めれば物質がわかる。', q: genWhich(rng) },
          { text: '液体に入れたとき、液体より密度が小さいものは浮き、大きいものはしずむ。（氷 0.92 g/cm³ は水に浮く）', q: genFloat(rng) },
        ];
      },
    },
  ],
};
