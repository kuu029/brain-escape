import { numAns, m } from '../kit.js';
import { F, tnum, near } from './kit3.js';

// 確率の答え（分母は 72 まで許す）
const P = (p, wrong = []) => ({ maxDen: 72, ...pAns(p, wrong) });
const pAns = (p, wrong = []) => numAns([{ key: 'p', text: '確率' }], { p }, { wrong: wrong.filter((w) => w && w.p).map((w) => ({ vals: { p: w.p }, msg: w.msg })) });
const C2 = (n) => (n * (n - 1)) / 2;
// 検算: 全部の場合を数え上げる
const count = (list, ok) => list.filter(ok).length / list.length;
const byEnum = (list, ok) => ({ kind: 'fn', verify: (v) => near(v.p, count(list, ok)) });
const DICE2 = [1, 2, 3, 4, 5, 6].flatMap((a) => [1, 2, 3, 4, 5, 6].map((b) => [a, b]));
const coins = (n) => [...Array(2 ** n).keys()].map((k) => [...Array(n).keys()].map((i) => (k >> i) & 1));

const BINOM = { 2: [1, 2, 1], 3: [1, 3, 3, 1], 4: [1, 4, 6, 4, 1] };
function genCoin(rng) {
  const n = rng.int(2, 4);
  if (rng.chance(0.3) && n >= 3) {
    const k = rng.int(2, n - 1);
    const comb = BINOM[n].slice(k).reduce((a, b) => a + b, 0);
    return {
      stem: `${n}枚の硬貨を同時に投げるとき、表が ${k} 枚以上出る確率は？`,
      ...P(F(comb, 2 ** n), [{ p: F(BINOM[n][k], 2 ** n), msg: `「以上」なので、${k} 枚より多い場合もふくめる。` }]),
      hint: '硬貨を区別して、表の枚数ごとに数えて合計する。',
      steps: [`全部で ${m(`2^{${n}}=${2 ** n}`)} 通り`, `表が ${k} 枚以上: ${comb} 通り`, `${m(tnum(F(comb, 2 ** n)))}`],
      check: byEnum(coins(n), (c) => c.reduce((a, b) => a + b, 0) >= k),
    };
  }
  if (rng.chance(0.6)) {
    const k = rng.int(0, n);
    const comb = BINOM[n][k];
    return {
      stem: `${n}枚の硬貨を同時に投げるとき、表がちょうど ${k} 枚出る確率は？`,
      ...P(F(comb, 2 ** n), [{ p: F(1, n + 1), msg: `出方は「表の枚数」の ${n + 1} 通りではない。硬貨を区別して、全部で ${2 ** n} 通り。` }]),
      hint: `硬貨を ${'ABCD'.slice(0, n).split('').join('、')} と区別して、表・裏の出方をすべて書き出す（樹形図）。`,
      steps: [`全部で ${m(`2^{${n}}=${2 ** n}`)} 通り`, `表が ${k} 枚: ${comb} 通り`, `${m(`\\frac{${comb}}{${2 ** n}}`)}`],
      check: byEnum(coins(n), (c) => c.reduce((a, b) => a + b, 0) === k),
    };
  }
  return {
    stem: `${n}枚の硬貨を同時に投げるとき、少なくとも1枚は表が出る確率は？`,
    ...P(F(2 ** n - 1, 2 ** n), [{ p: F(1, 2 ** n), msg: 'それは「全部裏」の確率。少なくとも1枚表 = 1 − 全部裏。' }, { p: F(n, 2 ** n) }]),
    hint: '「少なくとも1枚は表」は「全部裏」以外。1 − （全部裏の確率）。',
    steps: [`全部裏は 1 通り、全部で ${2 ** n} 通り`, `${m(`1-\\frac{1}{${2 ** n}}=\\frac{${2 ** n - 1}}{${2 ** n}}`)}`],
    check: byEnum(coins(n), (c) => c.some((x) => x === 1)),
  };
}

function genDice(rng) {
  const type = rng.int(0, 4);
  if (type === 0) {
    const s = rng.int(3, 11);
    const c = 6 - Math.abs(s - 7);
    return {
      stem: `大小2つのさいころを同時に投げるとき、出る目の和が ${s} になる確率は？`,
      ...P(F(c, 36), [{ p: F(1, 11), msg: '和は11通りあるけど、出やすさがちがう。目の出方は 6×6=36 通り。' }, { p: F(c, 21) }]),
      hint: '大小を区別して、6×6 = 36 通りの表を作る。',
      steps: [`和が ${s}: ${c} 通り`, `${m(`\\frac{${c}}{36}=${tnum(F(c, 36))}`)}`],
      check: byEnum(DICE2, ([a, b]) => a + b === s),
    };
  }
  if (type === 1) {
    const s = rng.int(4, 10);
    let c = 0;
    for (let t = 2; t <= s; t++) c += 6 - Math.abs(t - 7);
    return {
      stem: `大小2つのさいころを同時に投げるとき、出る目の和が ${s} 以下になる確率は？`,
      ...P(F(c, 36), [{ p: F(6 - Math.abs(s - 7), 36), msg: '「以下」は、ちょうど以外の小さい和もふくむ。' }]),
      hint: '和が 2、3、…、s のときをそれぞれ数えて合計する。',
      steps: [`和が ${s} 以下: ${c} 通り`, `${m(`\\frac{${c}}{36}=${tnum(F(c, 36))}`)}`],
      check: byEnum(DICE2, ([a, b]) => a + b <= s),
    };
  }
  if (type === 2) {
    const d = rng.int(1, 5);
    const c = 2 * (6 - d);
    return {
      stem: `大小2つのさいころを同時に投げるとき、出る目の差が ${d} になる確率は？`,
      ...P(F(c, 36), [{ p: F(6 - d, 36), msg: '大きいほうが大のさいころの場合と、小のさいころの場合の両方がある。' }]),
      hint: '(大, 小) の組で書き出す。(1, 3) と (3, 1) は別の出方。',
      steps: [`差が ${d}: ${c} 通り`, `${m(`\\frac{${c}}{36}=${tnum(F(c, 36))}`)}`],
      check: byEnum(DICE2, ([a, b]) => Math.abs(a - b) === d),
    };
  }
  if (type === 3) {
    return {
      stem: '大小2つのさいころを同時に投げるとき、2つの目が同じになる確率は？',
      ...P(F(1, 6), [{ p: F(1, 36), msg: '同じ目は (1,1)〜(6,6) の 6 通り。' }]),
      hint: '(1,1)、(2,2)、… と数える。',
      steps: ['6 通り', `${m('\\frac{6}{36}=\\frac{1}{6}')}`],
      check: byEnum(DICE2, ([a, b]) => a === b),
    };
  }
  const k = rng.pick([3, 4, 5]);
  let c = 0;
  for (let t = k; t <= 12; t += k) c += 6 - Math.abs(t - 7);
  return {
    stem: `大小2つのさいころを同時に投げるとき、出る目の和が ${k} の倍数になる確率は？`,
    ...P(F(c, 36)),
    hint: `和が ${k}、${2 * k}、… になる場合をそれぞれ数える。`,
    steps: [`${c} 通り`, `${m(`\\frac{${c}}{36}=${tnum(F(c, 36))}`)}`],
    check: byEnum(DICE2, ([a, b]) => (a + b) % k === 0),
  };
}

function genBag(rng) {
  let r, w;
  do { r = rng.int(2, 4); w = rng.int(1, 4); } while (r + w > 6 || r + w < 4);
  const n = r + w;
  const balls = [...Array(r).fill('r'), ...Array(w).fill('w')];
  const pairs = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([balls[i], balls[j]]);
  const type = rng.int(0, 2);
  const head = `赤玉 ${r} 個、白玉 ${w} 個が入った袋から、同時に2個取り出すとき、`;
  if (type === 0) {
    return {
      stem: `${head}2個とも赤玉である確率は？`,
      ...P(F(C2(r), C2(n)), [{ p: F(r * r, n * n), msg: '同時に取り出すので、同じ玉を2回は取れない。玉に番号をつけて組み合わせを数える。' }, { p: F(r, n) }]),
      hint: '玉に番号（赤1、赤2、…）をつけて、2個の組み合わせを全部書き出す。',
      steps: [`全部の組み合わせ ${C2(n)} 通り`, `赤2個: ${C2(r)} 通り`, `${m(`\\frac{${C2(r)}}{${C2(n)}}=${tnum(F(C2(r), C2(n)))}`)}`],
      check: byEnum(pairs, ([a, b]) => a === 'r' && b === 'r'),
    };
  }
  if (type === 1) {
    return {
      stem: `${head}赤玉と白玉が1個ずつである確率は？`,
      ...P(F(r * w, C2(n)), [{ p: F(2 * r * w, n * n), msg: '同時に取り出すので、同じ玉を2回は取れない。玉に番号をつけて組み合わせで数える。' }]),
      hint: '赤の選び方 × 白の選び方。',
      steps: [`${m(`${r}\\times ${w}=${r * w}`)} 通り / 全部 ${C2(n)} 通り`, `${m(tnum(F(r * w, C2(n))))}`],
      check: byEnum(pairs, ([a, b]) => a !== b),
    };
  }
  return {
    stem: `${head}少なくとも1個は赤玉である確率は？`,
    ...P(F(C2(n) - C2(w), C2(n)), [{ p: F(C2(w), C2(n)), msg: 'それは「2個とも白」。少なくとも1個赤 = 1 − 2個とも白。' }]),
    hint: '「少なくとも1個は赤」= 1 − 「2個とも白」',
    steps: [`2個とも白: ${C2(w)} 通り`, `${m(`1-\\frac{${C2(w)}}{${C2(n)}}=${tnum(F(C2(n) - C2(w), C2(n)))}`)}`],
    check: byEnum(pairs, ([a, b]) => a === 'r' || b === 'r'),
  };
}

function genCards(rng) {
  const n = rng.int(4, 6);
  const cards = [...Array(n).keys()].map((i) => i + 1);
  const nums = cards.flatMap((a) => cards.filter((b) => b !== a).map((b) => Number(`${a}${b}`)));
  const type = rng.int(0, 2);
  const head = `${cards.join('、')} のカードから続けて2枚引き、1枚目を十の位、2枚目を一の位とする2けたの整数が、`;
  if (type === 0) {
    const ev = cards.filter((c) => c % 2 === 0).length;
    return {
      stem: `${head}偶数になる確率は？`,
      ...P(F(ev * (n - 1), n * (n - 1)), [{ p: F(1, 2), msg: '一の位が偶数のカードは何枚？' }, { p: F(ev * (n - 1), n * n) }]),
      hint: `全部で ${m(`${n}\\times ${n - 1}`)} 通り。偶数 → 一の位が偶数。`,
      steps: [`全部 ${n * (n - 1)} 通り`, `一の位が偶数 ${ev} 通り × 十の位 ${n - 1} 通り = ${ev * (n - 1)} 通り`, `${m(tnum(F(ev * (n - 1), n * (n - 1))))}`],
      check: byEnum(nums, (x) => x % 2 === 0),
    };
  }
  if (type === 1) {
    const t = rng.int(2, n);
    const c = (n - t + 1) * (n - 1);
    return {
      stem: `${head}${t * 10} 以上になる確率は？`,
      ...P(F(c, n * (n - 1)), [{ p: F(n - t + 1, n * (n - 1)) }]),
      hint: `十の位が ${t} 以上なら ${t * 10} 以上。`,
      steps: [`十の位が ${t}〜${n}: ${n - t + 1} 通り、一の位はそれぞれ ${n - 1} 通り`, `${m(tnum(F(c, n * (n - 1))))}`],
      check: byEnum(nums, (x) => x >= t * 10),
    };
  }
  let c = 0;
  for (const a of cards) for (const b of cards) if (a !== b && (a + b) % 3 === 0) c++;
  return {
    stem: `${head}3の倍数になる確率は？`,
    ...P(F(c, n * (n - 1)), [{ p: F(1, 3), msg: '書き出して数えよう（各位の数の和が3の倍数なら3の倍数）。' }]),
    hint: '各位の数の和が3の倍数 → 3の倍数。全部書き出して数える。',
    steps: [`3の倍数: ${c} 通り / 全部 ${n * (n - 1)} 通り`, `${m(tnum(F(c, n * (n - 1))))}`],
    check: byEnum(nums, (x) => x % 3 === 0),
  };
}

function genLottery(rng) {
  const n = rng.int(4, 8), k = rng.int(1, Math.min(3, n - 2));
  const lots = [...Array(n).keys()].map((i) => i < k);
  const pairs = lots.flatMap((a, i) => lots.filter((_, j) => j !== i).map((b) => [a, b]));
  const type = rng.int(0, 2);
  const head = `${n} 本のうち当たりが ${k} 本入ったくじを、A が先に1本引き、引いたくじをもどさずに B が1本引くとき、`;
  if (type === 0) {
    return {
      stem: `${head}B が当たる確率は？`,
      ...P(F(k, n), [{ p: F(k, n - 1), msg: 'A が当たった場合とはずれた場合の両方を考えると…先に引いても後に引いても確率は同じ！' }]),
      hint: 'A と B の引き方を (A, B) の組で全部数える。',
      steps: [`全部 ${m(`${n}\\times ${n - 1}=${n * (n - 1)}`)} 通り`, `B が当たり: ${k * (n - 1)} 通り`, `${m(tnum(F(k, n)))}（A と同じ）`],
      check: byEnum(pairs, ([, b]) => b),
    };
  }
  if (type === 1 && k >= 2) {
    return {
      stem: `${head}2人とも当たる確率は？`,
      ...P(F(k * (k - 1), n * (n - 1)), [{ p: F(k * k, n * n), msg: 'くじはもどさないので、B が引くときは残り ' + (n - 1) + ' 本。' }]),
      hint: 'A が当たり → 残り n−1 本のうち当たり k−1 本。',
      steps: [`${m(`${k}\\times ${k - 1}=${k * (k - 1)}`)} 通り / ${n * (n - 1)} 通り`, `${m(tnum(F(k * (k - 1), n * (n - 1))))}`],
      check: byEnum(pairs, ([a, b]) => a && b),
    };
  }
  return {
    stem: `${head}A だけが当たる確率は？`,
    ...P(F(k * (n - k), n * (n - 1)), [{ p: F(k, n), msg: 'それは「A が当たる」確率。B がはずれる条件も必要。' }]),
    hint: 'A が当たり、B がはずれる場合を数える。',
    steps: [`${m(`${k}\\times ${n - k}=${k * (n - k)}`)} 通り / ${n * (n - 1)} 通り`, `${m(tnum(F(k * (n - k), n * (n - 1))))}`],
    check: byEnum(pairs, ([a, b]) => a && !b),
  };
}

export default {
  id: 'probability',
  stage: 3,
  area: '港の酒場',
  title: '確率',
  emoji: '🎲',
  prereqs: ['fractions-decimals'],
  tool: 'coins',
  hintCard: [
    '確率 = $\\frac{その場合の数}{全部の場合の数}$（どれも同じ程度に起こるとき）',
    'さいころ2つ → 36 通り。硬貨は区別して数える',
    '「少なくとも1つ」= 1 −「1つもない」',
    '同時に取り出す → 組み合わせ。順に並べる → 並べ方',
  ],
  generators: {
    'pb-coin': { difficulty: 1, gen: genCoin },
    'pb-dice': { difficulty: 1, gen: genDice },
    'pb-bag': { difficulty: 2, gen: genBag },
    'pb-cards': { difficulty: 2, gen: genCards },
    'pb-lottery': { difficulty: 3, gen: genLottery },
  },
  lessons: [
    {
      id: 'pb-l1',
      title: '確率の基本',
      unlocks: ['pb-coin', 'pb-dice'],
      build(rng) {
        const s = rng.int(5, 9);
        const c = 6 - Math.abs(s - 7);
        return [
          { text: '確率は「全部で何通り」のうち「それが起こるのは何通り」かの割合。どの場合も同じくらい起こりやすいときに使える。', math: '\\frac{その場合の数}{全部の場合の数}' },
          { text: '2枚の硬貨 A、B を投げる。表・裏の出方は (表,表)(表,裏)(裏,表)(裏,裏)。全部で何通り？', q: { ...numAns([{ key: 'v', text: '', suffix: '通り' }], { v: 4 }, { wrong: [{ vals: { v: 3 }, msg: '(表,裏) と (裏,表) は別。硬貨を区別しよう。' }] }), check: { kind: 'fn', verify: (v) => v.v === coins(2).length } } },
          { text: '1枚が表で1枚が裏になる確率は？', q: { ...P(F(1, 2), [{ p: F(1, 3), msg: '4通りのうち2通り。' }]), check: byEnum(coins(2), (x) => x[0] !== x[1]) } },
          { text: `大小2つのさいころなら、目の出方は 6 × 6 = 36 通り。和が ${s} になるのは何通り？`, q: { ...numAns([{ key: 'v', text: '', suffix: '通り' }], { v: c }), check: { kind: 'fn', verify: (v) => v.v === DICE2.filter(([a, b]) => a + b === s).length } } },
          { text: `和が ${s} になる確率は？`, q: { ...P(F(c, 36)), check: byEnum(DICE2, ([a, b]) => a + b === s) } },
        ];
      },
    },
    {
      id: 'pb-l2',
      title: '玉・カード・くじ',
      unlocks: ['pb-bag', 'pb-cards', 'pb-lottery'],
      build(rng) {
        const r = 3, w = 2, n = 5;
        const balls = ['r', 'r', 'r', 'w', 'w'];
        const pairs = [];
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([balls[i], balls[j]]);
        return [
          { text: `赤玉 ${r} 個（赤1、赤2、赤3）と白玉 ${w} 個（白1、白2）から同時に2個取り出す。番号をつけると数えやすい。`, math: '\\{赤1,赤2\\},\\ \\{赤1,赤3\\},\\ \\cdots' },
          { text: '2個の組み合わせは全部で何通り？（順番は関係ない）', q: { ...numAns([{ key: 'v', text: '', suffix: '通り' }], { v: 10 }, { wrong: [{ vals: { v: 20 }, msg: '同時に取り出すので、{赤1,赤2} と {赤2,赤1} は同じ。' }, { vals: { v: 25 } }] }), check: { kind: 'fn', verify: (v) => v.v === pairs.length } } },
          { text: '2個とも赤になる組み合わせは何通り？', q: { ...numAns([{ key: 'v', text: '', suffix: '通り' }], { v: 3 }), check: { kind: 'fn', verify: (v) => v.v === pairs.filter(([a, b]) => a === 'r' && b === 'r').length } } },
          { text: '2個とも赤の確率は？', q: { ...P(F(3, 10)), check: byEnum(pairs, ([a, b]) => a === 'r' && b === 'r') } },
          { text: '「少なくとも1個は白」= 1 − 「2個とも赤」。確率は？', q: { ...P(F(7, 10), [{ p: F(3, 10), msg: '1 からひく。' }]), check: byEnum(pairs, ([a, b]) => a === 'w' || b === 'w') } },
        ];
      },
    },
  ],
};
