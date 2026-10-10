// 社会 第3段階（公民）: 選挙（比例代表制のドント式・一票の格差）
//   ドント式: 各政党の得票数を 1, 2, 3… でわり、商の大きい順に定数まで議席を配る
import { sciNum, table, m, dec, near } from '../science/kit-sci.js';

const PARTY = ['A党', 'B党', 'C党', 'D党'];
// 生成用: 商を全部ならべて大きい順に n 個
function dhondt(votes, n) {
  const qs = votes.flatMap((v, i) => Array.from({ length: n }, (_, k) => ({ i, q: v / (k + 1) })));
  qs.sort((a, b) => b.q - a.q);
  const seats = votes.map(() => 0);
  qs.slice(0, n).forEach((x) => seats[x.i]++);
  return { seats, cut: qs[n - 1].q, next: qs[n].q };
}
// 検算用: 1議席ずつ「いまの議席 + 1 でわった値」がいちばん大きい政党に配る
function dhondtStep(votes, n) {
  const seats = votes.map(() => 0);
  for (let k = 0; k < n; k++) {
    let best = 0;
    votes.forEach((v, i) => { if (v / (seats[i] + 1) > votes[best] / (seats[best] + 1)) best = i; });
    seats[best]++;
  }
  return seats;
}

function genDhondt(rng) {
  for (;;) {
    const np = rng.int(3, 4);
    const votes = Array.from({ length: np }, () => rng.int(2, 30) * 1000).sort((a, b) => b - a);
    if (new Set(votes).size < np) continue;
    const n = rng.int(4, 7);
    const r = dhondt(votes, n);
    if (r.cut === r.next) continue; // 同じ商で議席が決まらない組はさける
    const i = rng.int(0, np - 1);
    const quo = votes.map((v, k) => `${PARTY[k]}: ${Array.from({ length: Math.max(3, r.seats[k] + 1) }, (_, j) => j + 1).map((d) => (Number.isInteger(v / d) ? v / d : (v / d).toFixed(1))).join('、')}`).join(' ／ ');
    return sciNum({
      stem: `比例代表制の選挙で、定数 ${n} の選挙区の各政党の得票数は表のとおりだった。ドント式で議席を配ると、${PARTY[i]}の当選者は何人か。`,
      fig: table(['政党', ...votes.map((_, k) => PARTY[k])], [['得票数', ...votes.map(String)]]),
      v: r.seats[i], unit: '人',
      wrongs: [{ v: Math.round((votes[i] / votes.reduce((a, b) => a + b, 0)) * n), msg: '得票の割合で四捨五入するのではない。÷1、÷2、÷3… の商の大きい順に配る。' }, { v: r.seats[i] + 1, msg: `商の大きい順に ${n} 個まで。数えなおしてみよう。` }],
      hint: '各政党の得票数を 1, 2, 3… でわり、商の大きい順に、定数の数だけ議席を配る。',
      steps: [`1, 2, 3… でわった商 → ${quo}`, `大きい順に ${n} 個まで議席を配る → ${PARTY.slice(0, np).map((p, k) => `${p} ${r.seats[k]}人`).join('、')}`],
      verify: (x) => x === dhondtStep(votes, n)[i],
    });
  }
}
function genGap(rng) {
  const small = rng.pick([20, 24, 25, 30, 40]);
  const ratio = rng.pick([1.25, 1.6, 2, 2.5, 4]); // 答え（1 ÷ ratio）が小数できれいに終わるもの
  const big = small * ratio;
  return sciNum({
    stem: `議員1人あたりの有権者数が、X選挙区では ${dec(big)} 万人、Y選挙区では ${small} 万人である。X選挙区の一票の価値は、Y選挙区の何倍か。`,
    v: Math.round((small / big) * 1000) / 1000, unit: '倍',
    wrongs: [{ v: ratio, msg: '有権者が多い選挙区ほど、一票の価値は小さい。小さいほう ÷ 大きいほう。' }],
    hint: '一票の価値は、議員1人あたりの有権者数に反比例する。',
    steps: [`有権者が多いほど一票は軽い → ${m(`${small}\\div ${dec(big)}=${dec(small / big)}`)}（倍）`],
    verify: (x) => near(x * big, small),
  });
}

export default {
  id: 'so-vote',
  subject: 'social',
  stage: 3,
  area: '社会棟・投票所',
  title: '選挙のしくみ',
  emoji: '🗳️',
  prereqs: ['so-stat'],
  tool: 'mega',
  hintCard: [
    '比例代表制: 政党の得票数に応じて議席を配る（ドント式）',
    'ドント式: 得票数を 1, 2, 3… でわり、商の大きい順に定数まで議席',
    '小選挙区制: 1つの選挙区から1人 → 死票が多くなりやすい',
    '一票の格差: 議員1人あたりの有権者数が多い選挙区ほど、一票の価値は小さい',
  ],
  generators: {
    'vt-dhondt': { difficulty: 3, gen: genDhondt },
    'vt-gap': { difficulty: 2, gen: genGap },
  },
  lessons: [
    {
      id: 'vt-l1',
      title: 'ドント式',
      unlocks: ['vt-dhondt'],
      build(rng) {
        return [
          { text: '比例代表制では、ドント式で議席を配る。\n① 各政党の得票数を 1, 2, 3… でわる\n② できた商を大きい順にならべる\n③ 定数の数だけ、大きいほうから議席を配る' },
          { text: '例: 定数4、A党 9000・B党 5000・C党 2000\nA: 9000、4500、3000 ／ B: 5000、2500 ／ C: 2000\n大きい順に4つ: 9000(A) 5000(B) 4500(A) 3000(A)\n→ A党 3人、B党 1人、C党 0人', q: genDhondt(rng) },
          { text: 'もう1問。', q: genDhondt(rng) },
        ];
      },
    },
    {
      id: 'vt-l2',
      title: '一票の格差',
      unlocks: ['vt-gap'],
      build(rng) {
        return [
          { text: '議員1人を選ぶ有権者の数が選挙区によってちがうと、一票の重さに差が出る（一票の格差）。\n有権者が多い選挙区ほど、一票の価値は小さい。', q: genGap(rng) },
        ];
      },
    },
  ],
};
