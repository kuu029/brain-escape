// 理科 第3段階（中3）: 遺伝の規則性（メンデルのエンドウ）
//   答えは、親の遺伝子から子の組み合わせを「全部書き出して数える」方法で、別に確かめる
import { sciNum, sciChoice, m, near } from './kit-sci.js';

const TRAITS = [
  { what: 'エンドウの種子の形', dom: '丸', rec: 'しわ' },
  { what: 'エンドウの子葉の色', dom: '黄色', rec: '緑色' },
  { what: 'エンドウの草たけ', dom: '高い', rec: '低い' },
];
// 親の遺伝子の組み合わせ → 子の組み合わせ（4通り）
export function children(p1, p2) {
  const out = [];
  for (const a of p1) for (const b of p2) out.push([a, b].sort().join('')); // 'A' < 'a' なので AA / Aa / aa
  return out;
}
const count = (kids, g) => kids.filter((k) => k === g).length;
const domShare = (kids) => kids.filter((k) => k.includes('A')).length / kids.length;
const ratioText = (kids) => {
  const gs = ['AA', 'Aa', 'aa'].filter((g) => count(kids, g));
  if (gs.length === 1) return `${gs[0]} だけ`;
  const ns = gs.map((g) => count(kids, g));
  const g0 = ns.reduce((x, y) => { while (y) [x, y] = [y, x % y]; return x; });
  return `${gs.join(' : ')} = ${ns.map((n) => n / g0).join(' : ')}`;
};
export const CROSSES = [['AA', 'aa'], ['AA', 'Aa'], ['Aa', 'aa'], ['Aa', 'Aa']];
const ALL_RATIOS = ['AA だけ', 'Aa だけ', 'aa だけ', 'AA : Aa = 1 : 1', 'Aa : aa = 1 : 1', 'AA : Aa : aa = 1 : 2 : 1', 'AA : aa = 1 : 1'];

function genType(rng) {
  const T = rng.pick(TRAITS);
  const [p1, p2] = rng.pick(CROSSES);
  const kids = children(p1, p2);
  const right = ratioText(kids);
  return sciChoice(rng, {
    stem: `${T.what}は、${T.dom}（A）が顕性形質、${T.rec}（a）が潜性形質である。遺伝子の組み合わせが ${p1} の親と ${p2} の親をかけ合わせたとき、子の遺伝子の組み合わせとその数の比は？`,
    correct: right,
    wrongs: rng.shuffle(ALL_RATIOS.filter((x) => x !== right)).slice(0, 3).map((t) => ({ t, msg: `${p1} の親は ${[...new Set(p1)].join(' か ')}、${p2} の親は ${[...new Set(p2)].join(' か ')} を子にわたす。表に書いて数える。` })),
    hint: '親はそれぞれ、2つの遺伝子のうち1つを子にわたす。かけ合わせの表（2 × 2）を書いて数える。',
    steps: [`${p1[0]}・${p1[1]} と ${p2[0]}・${p2[1]} の組み合わせ: ${kids.join('、')}`, `→ ${right}`],
    verify: (t) => t === ratioText(children(p1, p2)),
  });
}
function genCount(rng) {
  const T = rng.pick(TRAITS);
  const N = rng.pick([400, 600, 800, 1000, 1200, 1600, 2000, 2400]);
  if (rng.chance(0.6)) {
    // 純系どうし → 子はすべて顕性（Aa）→ 子を自家受粉 → 孫は 3 : 1
    const askDom = rng.chance(0.5);
    const kids = children('Aa', 'Aa');
    const v = N * (askDom ? domShare(kids) : 1 - domShare(kids));
    return sciNum({
      stem: `${T.what}で、${T.dom}の純系と${T.rec}の純系をかけ合わせると、子はすべて${T.dom}になった。この子を自家受粉させたところ、孫が ${N} 個できた。このうち${askDom ? T.dom : T.rec}は、およそ何個か。`,
      v, unit: '個',
      wrongs: [{ v: N - v, msg: `顕性（${T.dom}）: 潜性（${T.rec}）= 3 : 1。どちらをきかれているか確かめる。` }, { v: N / 2, msg: '1 : 1 ではなく 3 : 1。' }],
      hint: '子はすべて Aa。Aa × Aa → AA : Aa : aa = 1 : 2 : 1 → 顕性 : 潜性 = 3 : 1',
      steps: ['子は Aa（すべて顕性）', `Aa × Aa → ${kids.join('、')} → 顕性 3 : 潜性 1`, `${m(`${N}\\times ${askDom ? '3' : '1'}\\div 4=${v}`)}（個）`],
      verify: (x) => near(x / N, askDom ? 3 / 4 : 1 / 4),
    });
  }
  const [p1, p2] = rng.pick([['Aa', 'aa'], ['Aa', 'Aa'], ['AA', 'Aa']]);
  const kids = children(p1, p2);
  const v = N * domShare(kids);
  return sciNum({
    stem: `${T.what}は、${T.dom}（A）が顕性形質、${T.rec}（a）が潜性形質である。${p1} の親と ${p2} の親をかけ合わせて、子が ${N} 個できた。このうち${T.dom}の形質を示すものは、およそ何個か。`,
    v, unit: '個',
    wrongs: [{ v: N - v || N / 4, msg: 'A を1つでももっていれば顕性の形質が出る。' }, { v: N * (count(kids, 'AA') / 4) || N / 2, msg: 'Aa も顕性の形質（A をもっている）。' }],
    hint: 'A を1つでももつ（AA・Aa）と顕性の形質。かけ合わせの表で数える。',
    steps: [`組み合わせ: ${kids.join('、')}`, `A をもつのは 4 つのうち ${kids.filter((k) => k.includes('A')).length} つ`, `${m(`${N}\\times ${kids.filter((k) => k.includes('A')).length}\\div 4=${v}`)}（個）`],
    verify: (x) => near(x, N * (children(p1, p2).filter((k) => k !== 'aa').length / 4)),
  });
}

export default {
  id: 'sc-gene',
  subject: 'science',
  stage: 3,
  area: '理科棟・エンドウ温室',
  title: '遺伝の規則性',
  emoji: '🫛',
  prereqs: ['sc-quake'],
  tool: 'double',
  hintCard: [
    '親は2つの遺伝子のうち1つを子にわたす（分離の法則）',
    'A を1つでももつ（AA・Aa）→ 顕性の形質、aa → 潜性の形質',
    'AA × aa → すべて Aa（すべて顕性）',
    'Aa × Aa → AA : Aa : aa = 1 : 2 : 1 → 顕性 : 潜性 = 3 : 1',
  ],
  generators: {
    'gn-type': { difficulty: 2, gen: genType },
    'gn-count': { difficulty: 2, gen: genCount },
  },
  lessons: [
    {
      id: 'gn-l1',
      title: 'かけ合わせの表',
      unlocks: ['gn-type'],
      build(rng) {
        return [
          { text: '形質を決めるのは遺伝子。親は2つの遺伝子のうち1つを、子にわたす。\nA（顕性）を1つでももつと、顕性の形質が出る。' },
          { text: '表で考える: Aa × Aa\n　　A　　a\nA　AA　Aa\na　Aa　aa\n→ AA : Aa : aa = 1 : 2 : 1', q: genType(rng) },
          { text: 'もう1問。', q: genType(rng) },
        ];
      },
    },
    {
      id: 'gn-l2',
      title: '孫の数',
      unlocks: ['gn-count'],
      build(rng) {
        return [
          { text: '純系（AA と aa）をかけ合わせる → 子はすべて Aa（顕性）。\n子どうし（Aa × Aa）→ 孫は 顕性 : 潜性 = 3 : 1。\n孫が 800 個なら、潜性はおよそ 200 個。', q: genCount(rng) },
          { text: 'もう1問。', q: genCount(rng) },
        ];
      },
    },
  ],
};
