// 理科 第3段階（中3）: イオンと中和
//   中和: 酸の H⁺ とアルカリの OH⁻ が結びついて水ができる。BTB液: 酸性 黄・中性 緑・アルカリ性 青
import { sciNum, sciChoice, m, dec, near, round2 } from './kit-sci.js';

const IONS = [
  ['水素イオン', 'H⁺', '陽イオン'], ['ナトリウムイオン', 'Na⁺', '陽イオン'], ['銅イオン', 'Cu²⁺', '陽イオン'], ['亜鉛イオン', 'Zn²⁺', '陽イオン'], ['マグネシウムイオン', 'Mg²⁺', '陽イオン'],
  ['塩化物イオン', 'Cl⁻', '陰イオン'], ['水酸化物イオン', 'OH⁻', '陰イオン'], ['硫酸イオン', 'SO₄²⁻', '陰イオン'],
];
function genIon(rng) {
  const [name, f, kind] = rng.pick(IONS);
  if (rng.chance(0.5)) {
    return sciChoice(rng, {
      stem: `${name}を表すイオンの式はどれか。`,
      correct: f,
      wrongs: rng.shuffle(IONS.filter(([n]) => n !== name)).slice(0, 3).map(([, t]) => ({ t, msg: `${name} → ${f}` })),
      hint: '原子が電子を失うと陽イオン（＋）、電子を受けとると陰イオン（−）。',
      steps: [`${name} → ${f}（${kind}）`],
      verify: (t) => IONS.some(([n, x]) => n === name && x === t),
    });
  }
  return sciChoice(rng, {
    stem: `${f} は、陽イオンと陰イオンのどちらか。`,
    correct: kind,
    wrongs: [{ t: kind === '陽イオン' ? '陰イオン' : '陽イオン', msg: '右上の ＋ は陽イオン、− は陰イオン。' }],
    n: 2,
    hint: '右上が ＋ → 電子を失った陽イオン、− → 電子を受けとった陰イオン',
    steps: [`${f} の右上は ${f.includes('⁺') ? '＋' : '−'} → ${kind}`],
    verify: (t) => t === (f.includes('⁺') ? '陽イオン' : '陰イオン'),
  });
}
// 塩酸 a cm³ と 水酸化ナトリウム水溶液 b cm³ でちょうど中和する
function pair(rng) {
  return { a: rng.pick([4, 5, 6, 8, 10, 12]), b: rng.pick([4, 5, 6, 8, 10, 12, 15]) };
}
function genNeutral(rng) {
  const { a, b } = pair(rng);
  if (rng.chance(0.5)) {
    const x = rng.pick([2, 3, 4, 5, 6, 10, 15, 20].filter((v) => v !== a && Number.isInteger(Math.round(((v * b) / a) * 1e6) / 1e5))) || a * 2; // 答えが小数第1位までで終わるもの
    const need = round2((x * b) / a);
    return sciNum({
      stem: `ある塩酸 ${a} cm³ に、ある水酸化ナトリウム水溶液を ${b} cm³ 加えると、ちょうど中性になった。同じ塩酸 ${x} cm³ をちょうど中性にするには、同じ水酸化ナトリウム水溶液を何 cm³ 加えればよいか。`,
      v: need, unit: 'cm³',
      wrongs: [{ v: round2((x * a) / b), msg: '比を逆にしている。塩酸 : 水酸化ナトリウム水溶液 = ' + a + ' : ' + b + '。' }, { v: x, msg: '同じ量とはかぎらない。比で考える。' }],
      hint: `ちょうど中和する体積の比は一定: 塩酸 : 水酸化ナトリウム水溶液 = ${a} : ${b}`,
      steps: [`${a} : ${b} = ${x} : □`, `□ = ${m(`${x}\\times ${b}\\div ${a}=${dec(need)}`)}（cm³）`],
      verify: (y) => near(y * a, x * b),
    });
  }
  const add = rng.pick([b - 2, b - 1, b, b + 1, b + 3].filter((v) => v > 0));
  const right = add < b ? '黄色' : add === b ? '緑色' : '青色';
  return sciChoice(rng, {
    stem: `ある塩酸 ${a} cm³ は、ある水酸化ナトリウム水溶液 ${b} cm³ でちょうど中和する。BTB液を入れたこの塩酸 ${a} cm³ に、水酸化ナトリウム水溶液を ${add} cm³ 加えた。液の色は何色になるか。`,
    correct: right,
    wrongs: ['黄色', '緑色', '青色'].filter((t) => t !== right).map((t) => ({ t, msg: `${b} cm³ でちょうど中性。それより${add < b ? '少ない → まだ酸性' : add > b ? '多い → アルカリ性' : ''}。` })),
    n: 3,
    hint: 'BTB液: 酸性 → 黄色、中性 → 緑色、アルカリ性 → 青色',
    steps: [`加えた量 ${add} cm³ と、ちょうど中和する ${b} cm³ をくらべる`, `${add < b ? '少ない → 塩酸が残る → 酸性 → 黄色' : add === b ? 'ちょうど → 中性 → 緑色' : '多い → 水酸化ナトリウムが残る → アルカリ性 → 青色'}`],
    verify: (t) => t === (add * a < b * a ? '黄色' : add === b ? '緑色' : '青色'),
  });
}
const FACTS = [
  { q: '塩酸と水酸化ナトリウム水溶液の中和でできる塩（えん）は何か。', a: '塩化ナトリウム', ws: ['硫酸バリウム', '塩化銅', '水酸化カルシウム'], why: 'HCl + NaOH → NaCl（塩化ナトリウム）+ H₂O' },
  { q: '中和で、水素イオンと水酸化物イオンが結びついてできる物質は何か。', a: '水', ws: ['水素', '酸素', '塩化ナトリウム'], why: 'H⁺ + OH⁻ → H₂O（水）' },
  { q: '酸性の水溶液に共通してふくまれるイオンはどれか。', a: '水素イオン', ws: ['水酸化物イオン', 'ナトリウムイオン', '塩化物イオン'], why: '酸性の性質のもとは水素イオン H⁺。' },
  { q: 'アルカリ性の水溶液に共通してふくまれるイオンはどれか。', a: '水酸化物イオン', ws: ['水素イオン', '塩化物イオン', '銅イオン'], why: 'アルカリ性の性質のもとは水酸化物イオン OH⁻。' },
  { q: '酸性の水溶液に青色リトマス紙をつけると、どうなるか。', a: '赤色に変わる', ws: ['変わらない', '緑色に変わる', '黄色に変わる'], why: '酸性 → 青色リトマス紙が赤に。アルカリ性 → 赤色リトマス紙が青に。' },
];
function genFact(rng) {
  const F = rng.pick(FACTS);
  return sciChoice(rng, {
    stem: F.q, correct: F.a,
    wrongs: F.ws.map((t) => ({ t, msg: F.why })),
    hint: '酸 → H⁺、アルカリ → OH⁻。中和: H⁺ + OH⁻ → 水',
    steps: [F.why],
    verify: (t) => FACTS.some((x) => x.q === F.q && x.a === t),
  });
}

export default {
  id: 'sc-ion',
  subject: 'science',
  stage: 3,
  area: '理科棟・電池の部屋',
  title: 'イオンと中和',
  emoji: '🧲',
  prereqs: ['sc-react'],
  tool: 'nuke',
  hintCard: [
    '陽イオン（＋）: 電子を失った。H⁺・Na⁺・Cu²⁺ など ／ 陰イオン（−）: 電子を受けとった。Cl⁻・OH⁻ など',
    '酸性 → H⁺、アルカリ性 → OH⁻。中和: H⁺ + OH⁻ → 水',
    'BTB液: 酸性 黄・中性 緑・アルカリ性 青',
    'ちょうど中和する体積の比は一定（比で計算する）',
  ],
  generators: {
    'io-ion': { difficulty: 1, gen: genIon },
    'io-fact': { difficulty: 1, gen: genFact },
    'io-neutral': { difficulty: 3, gen: genNeutral },
  },
  lessons: [
    {
      id: 'io-l1',
      title: 'イオン',
      unlocks: ['io-ion'],
      build(rng) {
        return [
          { text: '原子が電子を失うと＋の電気をもつ陽イオン、電子を受けとると−の電気をもつ陰イオンになる。\n例: Na → Na⁺（陽）、Cl → Cl⁻（陰）', q: genIon(rng) },
          { text: 'もう1問。', q: genIon(rng) },
        ];
      },
    },
    {
      id: 'io-l2',
      title: '酸・アルカリと中和',
      unlocks: ['io-fact', 'io-neutral'],
      build(rng) {
        return [
          { text: '酸性のもと = 水素イオン H⁺、アルカリ性のもと = 水酸化物イオン OH⁻。\n混ぜると H⁺ + OH⁻ → 水 になって、たがいの性質を打ち消し合う（中和）。', q: genFact(rng) },
          { text: 'ちょうど中和する量の比は決まっている。足りなければ酸性（黄）、ちょうどで中性（緑）、多すぎればアルカリ性（青）。', q: genNeutral(rng) },
        ];
      },
    },
  ],
};
