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
// 数え上げ型: list（全部の場合）のうち ok を満たす割合。その場合の数を steps に出す
function enumQ(stem, list, ok, { hint, wrong = [], how = '' }) {
  const c = list.filter(ok).length, n = list.length;
  return {
    stem,
    ...P(F(c, n), wrong),
    hint,
    steps: [`全部で ${n} 通り${how}`, `あてはまるのは ${c} 通り`, `${m(`\\frac{${c}}{${n}}`)}${F(c, n).d !== n ? ` ${m(`=${tnum(F(c, n))}`)}` : ''}`],
    check: byEnum(list, ok),
  };
}
const isPrime = (x) => x > 1 && [...Array(x).keys()].slice(2).every((d) => x % d);
// 金額つきの硬貨（500円玉・100円玉…）
const COINS = [500, 100, 50, 10, 5, 1];
function genCoin(rng) {
  if (rng.chance(0.45)) {
    const vs = rng.shuffle([...COINS]).slice(0, rng.int(3, 4)).sort((a, b) => b - a);
    const outs = coins(vs.length).map((c) => c.reduce((a, x, i) => a + x * vs[i], 0));
    const sums = [...new Set(outs)].sort((a, b) => a - b).slice(1, -1);
    const x = rng.pick(sums);
    const more = rng.chance(0.6);
    return enumQ(`${vs.map((v) => `${v}円玉`).join('、')} を1枚ずつ同時に投げるとき、表が出た硬貨の金額の合計が ${x} 円${more ? '以上' : '未満'}になる確率は？`, outs, (t) => (more ? t >= x : t < x), {
      hint: '硬貨ごとに表・裏を書き出して（樹形図）、表の金額を合計する。',
      how: `（${m(`2^{${vs.length}}`)}）`,
      wrong: [{ p: F(1, 2), msg: '合計金額ごとに数えよう。半分とはかぎらない。' }],
    });
  }
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
  if (rng.chance(0.55)) {
    const head = '大小2つのさいころを同時に投げるとき、';
    const hint = '大小を区別して、6×6 = 36 通りの表を作って数える。';
    const t = rng.int(0, 10);
    if (t === 7) return enumQ(`${head}大きいさいころの目が、小さいさいころの目の倍数になる確率は？`, DICE2, ([a, b]) => a % b === 0, { hint: '小さいさいころの目ごとに、大きいさいころの目が倍数になるものを数える（同じ目も倍数）。', wrong: [{ p: F(1, 6), msg: '同じ目どうしだけではない。(2, 1) や (6, 3) も倍数。' }] });
    if (t === 8) { const odd = rng.chance(0.5); return enumQ(`${head}出る目の和が${odd ? '奇数' : '偶数'}になる確率は？`, DICE2, ([a, b]) => (a + b) % 2 === (odd ? 1 : 0), { hint: '和が奇数 → 奇数と偶数の組。和が偶数 → 同じ種類どうし。', wrong: [{ p: F(1, 4), msg: `(奇, 偶) と (偶, 奇) の両方ある。` }] }); }
    if (t === 9) {
      const c = rng.int(1, 3), d = rng.int(4, 9);
      return enumQ(`${head}大きいさいころの目を ${m('a')}、小さいさいころの目を ${m('b')} とする。${m(`${c === 1 ? '' : c}a+b`)} の値が ${d} 以下になる確率は？`, DICE2, ([a, b]) => c * a + b <= d, { hint: `${m('a')} の値ごとに、${m('b')} がいくつまでならよいか数える。` });
    }
    if (t === 10) {
      const k = rng.int(-2, 2);
      return enumQ(`${head}大きいさいころの目を ${m('a')}、小さいさいころの目を ${m('b')} とする。点 ${m('(a,\\ b)')} が直線 ${m(k === 0 ? 'y=x' : `y=x${k > 0 ? '+' : ''}${k}`)} 上にある確率は？`, DICE2, ([a, b]) => b === a + k, { hint: `${m(`b=a${k === 0 ? '' : (k > 0 ? '+' : '') + k}`)} になる組を書き出す。` });
    }
    if (t === 0) { const k = rng.pick([3, 4, 6, 7, 8, 9]); return enumQ(`${head}大きいさいころの目を十の位、小さいさいころの目を一の位として2けたの整数をつくる。この整数が ${k} の倍数になる確率は？`, DICE2, ([a, b]) => (10 * a + b) % k === 0, { hint: '11〜66 の2けたの整数（36 通り）を書き出して数える。' }); }
    if (t === 1) return enumQ(`${head}大きいさいころの目を十の位、小さいさいころの目を一の位とする2けたの整数が、素数になる確率は？`, DICE2, ([a, b]) => isPrime(10 * a + b), { hint: '一の位が偶数や5なら素数ではない。残りを1つずつ確かめる。' });
    if (t === 2) { const k = rng.pick([2, 3, 4, 6]); return enumQ(`${head}出る目の積が ${k} の倍数になる確率は？`, DICE2, ([a, b]) => (a * b) % k === 0, { hint, wrong: [{ p: F(1, k), msg: '積は和とちがって、出やすさがかたよる。表を作って数えよう。' }] }); }
    if (t === 3) return enumQ(`${head}出る目の積が奇数になる確率は？`, DICE2, ([a, b]) => (a * b) % 2 === 1, { hint: '積が奇数 → 2つとも奇数。', wrong: [{ p: F(1, 2), msg: '積が奇数になるのは、2つとも奇数のときだけ。' }] });
    if (t === 4) { const big = rng.chance(0.5); return enumQ(`${head}${big ? '大きいさいころの目が、小さいさいころの目より大きくなる' : '大きいさいころの目が、小さいさいころの目以下になる'}確率は？`, DICE2, ([a, b]) => (big ? a > b : a <= b), { hint: '同じ目の 6 通りをどちらに入れるかに注意。' }); }
    if (t === 5) { const k = rng.int(1, 6); return enumQ(`${head}少なくとも一方の目が ${k} になる確率は？`, DICE2, ([a, b]) => a === k || b === k, { hint: `1 −（どちらも ${k} でない確率）で考えてもよい。`, wrong: [{ p: F(2, 6), msg: `(${k}, ${k}) を2回数えないように。` }] }); }
    return enumQ(`${head}出る目の和が素数になる確率は？`, DICE2, ([a, b]) => isPrime(a + b), { hint: '和は 2〜12。素数は 2、3、5、7、11。それぞれの場合を数えて合計する。' });
  }
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
  if (rng.chance(0.5)) {
    let r, w, b;
    do { r = rng.int(1, 3); w = rng.int(1, 3); b = rng.int(1, 3); } while (r + w + b > 7 || r + w + b < 4);
    const balls = [...Array(r).fill('赤'), ...Array(w).fill('白'), ...Array(b).fill('青')];
    const n = balls.length;
    const head = `赤玉 ${r} 個、白玉 ${w} 個、青玉 ${b} 個が入った袋から、`;
    if (rng.chance(0.5)) {
      // もどしてもう1回（並べ方: n × n 通り）
      const seq = balls.flatMap((x) => balls.map((y) => [x, y]));
      const col = rng.pick(['赤', '白', '青']);
      return rng.chance(0.5)
        ? enumQ(`${head}1個取り出して色を調べ、袋にもどしてから、もう1個取り出す。2回とも${col}玉である確率は？`, seq, ([x, y]) => x === col && y === col, { hint: `もどすので、2回目も ${n} 個から取る。全部で ${n}×${n} 通り。`, wrong: [{ p: F(1, 9), msg: '色の数ではなく、玉の数で数える。' }] })
        : enumQ(`${head}1個取り出して色を調べ、袋にもどしてから、もう1個取り出す。2回の色がちがう確率は？`, seq, ([x, y]) => x !== y, { hint: `全部で ${n}×${n} 通り。「同じ色」の場合をひくと速い。` });
    }
    const pairs = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([balls[i], balls[j]]);
    return rng.chance(0.5)
      ? enumQ(`${head}同時に2個取り出すとき、2個が同じ色である確率は？`, pairs, ([x, y]) => x === y, { hint: '玉に番号をつけて、2個の組み合わせを全部書き出す。', how: `（${m(`\\frac{${n}\\times ${n - 1}}{2}`)}）` })
      : enumQ(`${head}同時に2個取り出すとき、青玉が1個もふくまれない確率は？`, pairs, ([x, y]) => x !== '青' && y !== '青', { hint: '赤と白だけから2個選ぶ組み合わせを数える。', how: `（${m(`\\frac{${n}\\times ${n - 1}}{2}`)}）` });
  }
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
  if (rng.chance(0.5)) {
    const n = rng.int(3, 6);
    const cards = [...Array(n).keys()].map((i) => i + 1);
    const nums = cards.flatMap((a) => cards.filter((b) => b !== a).map((b) => 10 * a + b));
    const head = `${cards.join('、')} のカードから続けて2枚引き、1枚目を十の位、2枚目を一の位とする2けたの整数が、`;
    const t = rng.int(0, 3);
    const hint = `全部で ${m(`${n}\\times ${n - 1}`)} 通り。整数を全部書き出して数える。`;
    if (t === 0) return enumQ(`${head}奇数になる確率は？`, nums, (x) => x % 2 === 1, { hint });
    if (t === 1) { const k = rng.pick([4, 6]); return enumQ(`${head}${k} の倍数になる確率は？`, nums, (x) => x % k === 0, { hint }); }
    if (t === 2) return enumQ(`${head}素数になる確率は？`, nums, isPrime, { hint: '一の位が偶数や5なら素数ではない。残りを1つずつ確かめる。' });
    const lo = rng.int(2, n) * 10 + rng.int(1, 9);
    return enumQ(`${head}${lo} 以下になる確率は？`, nums, (x) => x <= lo, { hint });
  }
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
  const n = rng.int(4, 9), k = rng.int(1, Math.min(4, n - 2));
  const lots = [...Array(n).keys()].map((i) => i < k);
  const pairs = lots.flatMap((a, i) => lots.filter((_, j) => j !== i).map((b) => [a, b]));
  // ほかの聞き方（少なくとも1人・2人ともはずれ・B だけ・もどす・同時に2本）
  if (rng.chance(0.45)) {
    const v = rng.int(0, 4);
    const head = `${n} 本のうち当たりが ${k} 本入ったくじを、A が先に1本引き、引いたくじをもどさずに B が1本引くとき、`;
    const hint = 'A と B の引き方を (A, B) の組で全部数える。';
    const how = `（${m(`${n}\\times ${n - 1}`)}）`;
    if (v === 0) return enumQ(`${head}少なくとも1人が当たる確率は？`, pairs, ([a, b]) => a || b, { hint: '「少なくとも1人が当たる」= 1 − 「2人ともはずれ」', how, wrong: [{ p: F(2 * k, n), msg: 'A と B の確率をたすと、2人とも当たる場合を2回数えてしまう。' }] });
    if (v === 1) return enumQ(`${head}2人ともはずれる確率は？`, pairs, ([a, b]) => !a && !b, { hint, how, wrong: [{ p: F((n - k) ** 2, n * n), msg: 'くじはもどさないので、B が引くときは残り ' + (n - 1) + ' 本。' }] });
    if (v === 2) return enumQ(`${head}B だけが当たる確率は？`, pairs, ([a, b]) => !a && b, { hint: 'A がはずれて、B が当たる場合を数える。', how });
    if (v === 3 && n <= 8) {
      const seq = lots.flatMap((a) => lots.map((b) => [a, b]));
      const both = rng.chance(0.5);
      return enumQ(`${n} 本のうち当たりが ${k} 本入ったくじを、A が1本引いてもとにもどし、そのあと B が1本引くとき、${both ? '2人とも当たる' : '1人だけが当たる'}確率は？`, seq, ([a, b]) => (both ? a && b : a !== b), { hint: `もどすので、B も ${n} 本から引く。全部で ${n}×${n} 通り。`, how: `（${m(`${n}\\times ${n}`)}）` });
    }
    const sets = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) sets.push([lots[i], lots[j]]);
    const one = rng.chance(0.5);
    return enumQ(`${n} 本のうち当たりが ${k} 本入ったくじから、同時に2本引くとき、${one ? '当たりがちょうど1本である' : '少なくとも1本が当たりである'}確率は？`, sets, ([a, b]) => (one ? a !== b : a || b), { hint: 'くじに番号をつけて、2本の組み合わせを全部書き出す。', how: `（${m(`\\frac{${n}\\times ${n - 1}}{2}`)}）` });
  }
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
