import { F, lcm } from '../../core/frac.js';
import { tnum, tpar, tdec, sys } from '../../core/fmt.js';
import { Poly, termTex } from '../../core/poly.js';
import { numAns, choice, ONE, m } from '../kit.js';

const XY = [['x', 'x'], ['y', 'y']];
const L2 = (a, b) => Poly.of([[a, { x: 1 }], [b, { y: 1 }]]).toTex();
const E = (a, b, c) => `${L2(a, b)}=${c}`;
const lin = (a, b, v = 'x') => Poly.lin(a, b, v).toTex();
const tx = (c) => termTex(F(c), { x: 1 }, true);
// 並び順どおりの項（定数 → y など）
const raw = (terms) => terms.filter(([c]) => c !== 0).map(([c, e], i) => termTex(F(c), e, i === 0)).join('') || '0';

// 「cx·x + cy·y = r」形の式の選択肢（解で成り立ってしまうものは除く）
function eqOpts(sol, list) {
  return list.filter((w) => w && (w.cx || 0) * sol.x + (w.cy || 0) * sol.y !== w.r).map((w) => ({ tex: w.tex || `${raw([[w.cx || 0, { x: 1 }], [w.cy || 0, { y: 1 }]])}=${w.r}`, msg: w.msg }));
}
const solPair = (rng, lim = 6) => ({ x: rng.nz(-lim, lim), y: rng.nz(-lim, lim) });
const pairWrong = (s) => [{ vals: { x: s.y, y: s.x }, msg: '$x$ と $y$ が逆になってるかも！' }];

// 代入して残りを求める手順
function backSub(a, b, e, s, label) {
  return [`${m(`x=${s.x}`)} を${label}に代入: ${m(`${raw([[a * s.x, {}], [b, { y: 1 }]])}=${e}`)}`, `${m(`${termTex(F(b), { y: 1 }, true)}=${e - a * s.x}`)} → ${m(`y=${s.y}`)}`];
}

function genAdd(rng, same) {
  let a, b, c, d, s;
  do {
    s = solPair(rng);
    a = rng.nz(-6, 6); b = rng.intEx(-6, 6, [0]); c = rng.nz(-6, 6);
    d = same ? b : -b;
  } while ((same ? a - c : a + c) === 0 || a === c);
  const e1 = a * s.x + b * s.y, e2 = c * s.x + d * s.y;
  // y を消す。たまに x を消す形にするため、x と y を入れかえた表示にする
  const swap = rng.chance(0.4);
  const show = (p, q, r) => (swap ? E(q, p, r) : E(p, q, r));
  const sol = swap ? { x: s.y, y: s.x } : s;
  const E1 = show(a, b, e1), E2 = show(c, d, e2);
  const k = same ? a - c : a + c;
  const v = swap ? 'y' : 'x', w = swap ? 'x' : 'y';
  return {
    stem: `連立方程式を解け。 ${m(sys(E1, E2))}`,
    ...numAns(XY, sol, { wrong: pairWrong(sol) }),
    hint: same ? `${m(w)} の係数が同じ → ①−② で ${m(w)} が消える。` : `${m(w)} の係数が反対 → ①+② で ${m(w)} が消える。`,
    steps: [
      `${same ? '①−②' : '①+②'}: ${m(`${termTex(F(k), { [v]: 1 }, true)}=${same ? e1 - e2 : e1 + e2}`)} → ${m(`${v}=${s.x}`)}`,
      `${m(`${v}=${s.x}`)} を①に代入: ${m(`${raw([[a * s.x, {}], [b, { [w]: 1 }]])}=${e1}`)} → ${m(`${w}=${s.y}`)}`,
      `答え: ${m(`x=${sol.x},\\ y=${sol.y}`)}`,
    ],
    check: { kind: 'equations', eqs: [E1, E2] },
  };
}

function genMul1(rng) {
  let a, c, d, k, s;
  do {
    s = solPair(rng);
    c = rng.nz(-5, 5); d = rng.intEx(-4, 4, [0]); k = rng.pick([2, 3, -2]); a = rng.nz(-7, 7);
  } while (a === k * c);
  const b = k * d;
  const e1 = a * s.x + b * s.y, e2 = c * s.x + d * s.y;
  const E1 = E(a, b, e1), E2 = E(c, d, e2);
  return {
    stem: `連立方程式を解け。 ${m(sys(E1, E2))}`,
    ...numAns(XY, s, { wrong: pairWrong(s) }),
    hint: `②を ${k} 倍すると、${m('y')} の係数が①とそろう。右辺にもかけるのを忘れずに！`,
    steps: [
      `②×${tpar(k)}: ${m(E(k * c, k * d, k * e2))}`,
      `①−②×${tpar(k)}: ${m(`${tx(a - k * c)}=${e1 - k * e2}`)} → ${m(`x=${s.x}`)}`,
      ...backSub(a, b, e1, s, '①'),
    ],
    check: { kind: 'equations', eqs: [E1, E2] },
  };
}

function genMul2(rng) {
  let a, b, c, d, s;
  const ok = (p, q) => Math.abs(p) !== Math.abs(q) && p % q !== 0 && q % p !== 0;
  do {
    s = solPair(rng, 5);
    a = rng.intEx(-7, 7, [0, 1, -1]); c = rng.intEx(-7, 7, [0, 1, -1]);
    b = rng.intEx(-7, 7, [0, 1, -1]); d = rng.intEx(-7, 7, [0, 1, -1]);
  } while (!ok(b, d) || !ok(a, c) || a * d - b * c === 0 || Math.abs(a * s.x + b * s.y) > 60 || Math.abs(c * s.x + d * s.y) > 60);
  const e1 = a * s.x + b * s.y, e2 = c * s.x + d * s.y;
  const E1 = E(a, b, e1), E2 = E(c, d, e2);
  const L = lcm(b, d);
  const k1 = L / Math.abs(b), k2 = L / Math.abs(d);
  return {
    stem: `連立方程式を解け。 ${m(sys(E1, E2))}`,
    ...numAns(XY, s, { wrong: pairWrong(s) }),
    hint: `${m('y')} の係数を ${L} にそろえる: ①を ${k1} 倍、②を ${k2} 倍。`,
    steps: [
      `①×${k1}: ${m(E(a * k1, b * k1, e1 * k1))}、②×${k2}: ${m(E(c * k2, d * k2, e2 * k2))}`,
      `${Math.sign(b) === Math.sign(d) ? 'ひく' : 'たす'}と $y$ が消えて ${m(`${tx(a * k1 - Math.sign(b) * Math.sign(d) * c * k2)}=${e1 * k1 - Math.sign(b) * Math.sign(d) * e2 * k2}`)} → ${m(`x=${s.x}`)}`,
      ...backSub(a, b, e1, s, '①'),
    ],
    check: { kind: 'equations', eqs: [E1, E2] },
  };
}

function genSubst(rng) {
  let p, q, c, d, s;
  do {
    s = solPair(rng);
    p = rng.nz(-4, 4); c = rng.nz(-6, 6); d = rng.intEx(-5, 5, [0]);
    q = s.y - p * s.x;
  } while (c + d * p === 0 || Math.abs(q) > 12);
  const forX = rng.chance(0.3);
  const sol = forX ? { x: s.y, y: s.x } : s;
  const v = forX ? 'x' : 'y', w = forX ? 'y' : 'x';
  const E1 = `${v}=${lin(p, q, w)}`;
  const e = c * s.x + d * s.y;
  const E2 = forX ? E(d, c, e) : E(c, d, e);
  return {
    stem: `連立方程式を解け。 ${m(sys(E1, E2))}`,
    ...numAns(XY, sol, { wrong: pairWrong(sol) }),
    hint: `①がもう「${m(`${v}=`)}」の形 → ②の ${m(v)} に ①の右辺をかっこごと代入（代入法）。`,
    steps: [
      `②に代入: ${m(`${raw([[c, { [w]: 1 }]])}${d < 0 ? '-' : '+'}${Math.abs(d) === 1 ? '' : Math.abs(d)}(${lin(p, q, w)})=${e}`)}`,
      `かっこをはずして整理: ${m(`${termTex(F(c + d * p), { [w]: 1 }, true)}=${e - d * q}`)} → ${m(`${w}=${s.x}`)}`,
      `①に代入: ${m(`${v}=${s.y}`)}`,
    ],
    check: { kind: 'equations', eqs: [E1, E2] },
  };
}

function genParen(rng) {
  const form = rng.int(0, 1);
  let s, p, a1, b1, r, mm, nn, a, b, sgn;
  do {
    mm = rng.pick([2, 3, 4]); nn = rng.pick([2, 3, 4, 5]); sgn = rng.sign();
    s = { x: mm * rng.nz(-3, 3), y: nn * rng.nz(-3, 3) };
    if (form === 0) {
      p = rng.intEx(-4, 4, [0, 1, -1]); a1 = rng.nz(-3, 3); b1 = rng.nz(-3, 3); r = rng.nz(-5, 5);
      a = p * a1 + r; b = p * b1;
    } else {
      a = rng.intEx(-9, 9, [0]); b = rng.intEx(-9, 9, [0]); // 小数の係数（10倍した値）
    }
  } while (a === 0 || mm === nn || a * sgn * mm - b * nn === 0);
  const e1 = a * s.x + b * s.y;
  const E1 = form === 0
    ? `${p < 0 ? '-' : ''}${Math.abs(p)}(${L2(a1, b1)})${termTex(F(r), { x: 1 }, false)}=${e1}`
    : `${tdec(F(a, 10))}x${b > 0 ? '+' : ''}${tdec(F(b, 10))}y=${tdec(F(e1, 10))}`;
  const k = F(s.x, mm).add(F(sgn * s.y, nn));
  const E2 = `\\frac{x}{${mm}}${sgn > 0 ? '+' : '-'}\\frac{y}{${nn}}=${tnum(k)}`;
  const L = lcm(mm, nn);
  return {
    stem: `連立方程式を解け。 ${m(sys(E1, E2))}`,
    ...numAns(XY, s, { wrong: pairWrong(s) }),
    hint: form === 0 ? 'まず①のかっこをはずして整理。②は両辺に分母の最小公倍数をかけて分数を消す。' : '①は10倍して小数を消す。②は分母の最小公倍数をかけて分数を消す。',
    steps: [
      form === 0 ? `①を整理: ${m(E(a, b, e1))}` : `①を10倍: ${m(E(a, b, e1))}`,
      `②を ${L} 倍: ${m(E(L / mm, sgn * L / nn, k.mul(L).n))}`,
      `あとは加減法で: ${m(`x=${s.x},\\ y=${s.y}`)}`,
    ],
    check: { kind: 'equations', eqs: [E1, E2] },
  };
}

function genWord(rng) {
  const t = rng.int(0, 3);
  if (t === 0) {
    const items = rng.pick([['ガム', 'チョコ'], ['えんぴつ', 'ノート'], ['おにぎり', 'パン']]);
    let a, b, n, x, y, T;
    do { a = rng.int(3, 15) * 10; b = rng.int(3, 15) * 10; x = rng.int(1, 12); y = rng.int(1, 12); n = x + y; T = a * x + b * y; } while (a === b);
    return {
      stem: `脱獄の準備。1個 ${a} 円の${items[0]}と1個 ${b} 円の${items[1]}を合わせて ${n} 個買ったら、代金は ${T} 円だった。それぞれ何個買った？`,
      ...numAns([{ key: 'x', label: 'x', text: items[0], suffix: '個' }, { key: 'y', label: 'y', text: items[1], suffix: '個' }], { x, y }, { wrong: [{ vals: { x: y, y: x }, msg: '逆になってない？ 式の立て方を確認しよう。' }] }),
      hint: `${items[0]}を ${m('x')} 個、${items[1]}を ${m('y')} 個とする。個数の式と代金の式の2本！`,
      steps: [`個数: ${m(`x+y=${n}`)}`, `代金: ${m(E(a, b, T))}`, `解くと ${m(`x=${x},\\ y=${y}`)}`, '答えが問題に合っているか（個数・代金）確認！'],
      check: { kind: 'equations', eqs: [`x+y=${n}`, E(a, b, T)] },
    };
  }
  if (t === 1) {
    let n, k, mm, x, y;
    do { x = rng.int(3, 20); k = rng.int(2, 5); mm = rng.int(1, 9); y = k * x - mm; n = x + y; } while (y <= 0 || n > 120);
    return {
      stem: `監獄には看守と囚人が合わせて ${n} 人いる。囚人の数は、看守の数の ${k} 倍より ${mm} 人少ない。看守と囚人はそれぞれ何人？`,
      ...numAns([{ key: 'x', label: 'x', text: '看守', suffix: '人' }, { key: 'y', label: 'y', text: '囚人', suffix: '人' }], { x, y }),
      hint: '看守を $x$ 人、囚人を $y$ 人。「合わせて」と「〜倍より少ない」で2本の式。',
      steps: [`${m(`x+y=${n}`)}`, `${m(`y=${k}x-${mm}`)}`, `代入法: ${m(`x+${k}x-${mm}=${n}`)} → ${m(`x=${x}`)}、${m(`y=${y}`)}`],
      check: { kind: 'equations', eqs: [`x+y=${n}`, `y=${k}x-${mm}`] },
    };
  }
  if (t === 2) {
    let a, b, x, y, T, D;
    do { a = rng.int(5, 9) * 10; b = rng.int(15, 25) * 10; x = rng.int(3, 20); y = rng.int(3, 15); T = x + y; D = a * x + b * y; } while (a >= b);
    return {
      stem: `脱出ルートは全長 ${D} m。はじめは分速 ${a} m で歩き、途中から分速 ${b} m で走ったら、全部で ${T} 分かかった。歩いた時間と走った時間はそれぞれ何分？`,
      ...numAns([{ key: 'x', label: 'x', text: '歩いた時間', suffix: '分' }, { key: 'y', label: 'y', text: '走った時間', suffix: '分' }], { x, y }),
      hint: '歩いた時間を $x$ 分、走った時間を $y$ 分。「時間の合計」と「道のりの合計（速さ×時間）」で2本。',
      steps: [`時間: ${m(`x+y=${T}`)}`, `道のり: ${m(E(a, b, D))}`, `解くと ${m(`x=${x},\\ y=${y}`)}`],
      check: { kind: 'equations', eqs: [`x+y=${T}`, E(a, b, D)] },
    };
  }
  let x, y;
  do { x = rng.int(1, 8); y = rng.int(x + 1, 9); } while (false);
  const s = x + y, d = 9 * (y - x);
  return {
    stem: `2けたの暗証番号がある。十の位と一の位の数の和は ${s}。十の位と一の位を入れかえた数は、もとの数より ${d} 大きい。もとの番号は？（十の位を $x$、一の位を $y$ として答えよ）`,
    ...numAns([{ key: 'x', label: 'x', text: '十の位', suffix: '' }, { key: 'y', label: 'y', text: '一の位', suffix: '' }], { x, y }, { wrong: [{ vals: { x: y, y: x }, msg: '入れかえた後の数になってない？ もとの数を答えよう。' }] }),
    hint: 'もとの数は $10x+y$、入れかえた数は $10y+x$ と表せる。',
    steps: [`${m(`x+y=${s}`)}`, `${m(`(10y+x)-(10x+y)=${d}`)} → ${m(`-9x+9y=${d}`)}`, `解くと ${m(`x=${x},\\ y=${y}`)} → もとの番号は ${10 * x + y}`],
    check: { kind: 'equations', eqs: [`x+y=${s}`, `(10y+x)-(10x+y)=${d}`] },
  };
}

export default {
  id: 'simultaneous',
  stage: 2,
  area: '看守室',
  title: '連立方程式',
  emoji: '🔐',
  prereqs: ['linear-equations', 'polynomials'],
  tool: 'double',
  hintCard: [
    '作戦: 文字を1つ消して、ふつうの一次方程式にする',
    '加減法: 係数をそろえて、式どうしをたす・ひく（右辺にもかける！）',
    '代入法: 「$y=\\cdots$」の形の式は、もう1本にかっこごと代入',
    '求めた値をもとの式に代入して、もう1つの文字を出す',
    'かっこ→はずす、分数→分母をはらう、小数→10倍',
  ],
  generators: {
    'si-add': { difficulty: 1, gen: (r) => genAdd(r, false) },
    'si-sub': { difficulty: 1, gen: (r) => genAdd(r, true) },
    'si-mul1': { difficulty: 2, gen: genMul1 },
    'si-mul2': { difficulty: 3, gen: genMul2 },
    'si-subst': { difficulty: 2, gen: genSubst },
    'si-paren': { difficulty: 3, gen: genParen },
    'si-word': { difficulty: 3, gen: genWord },
  },
  lessons: [
    {
      id: 'si-l1',
      title: '加減法（そのまま消える）',
      unlocks: ['si-add', 'si-sub'],
      build(rng) {
        const s = { x: rng.nz(-5, 5), y: rng.nz(-5, 5) };
        let a, b, c;
        do { a = rng.int(1, 5); c = rng.int(1, 5); b = rng.int(2, 5); } while (a === c);
        const e1 = a * s.x + b * s.y, e2 = c * s.x - b * s.y;
        const E1 = E(a, b, e1), E2 = E(c, -b, e2);
        const sub = `${raw([[a * s.x, {}], [b, { y: 1 }]])}=${e1}`;
        return [
          { text: '連立方程式は「式が2本、文字が2つ」。作戦は1つ：文字を1つ消して、ふつうの一次方程式にする！ 上を①、下を②と呼ぶよ。', math: sys(E1, E2) },
          {
            text: `${m('y')} の係数に注目。①は ${m(`+${b}y`)}、②は ${m(`-${b}y`)}。①と②を「たす」と ${m('y')} が消える！ ①+② を計算すると？`,
            q: {
              ...choice(rng, `${tx(a + c)}=${e1 + e2}`, eqOpts(s, [
                { cx: a + c, cy: 2 * b, r: e1 + e2, msg: `${m(`+${b}y`)} と ${m(`-${b}y`)} をたすと 0。$y$ は消える！` },
                { cx: a - c, r: e1 - e2, msg: 'それは①−②。今回は「たす」と $y$ が消える。' },
                { cx: a + c, r: e1 - e2, msg: '右辺どうしもたそう！' },
              ])),
              check: { kind: 'eqstep', eqs: [E1, E2], sol: s, mustNotContain: 'y' },
            },
          },
          { text: `${m(`${tx(a + c)}=${e1 + e2}`)}。$y$ が消えて一次方程式になった！ $x$ は？`, q: { ...numAns([['x', 'x']], { x: s.x }), check: { kind: 'equations', eqs: [`${tx(a + c)}=${e1 + e2}`] } } },
          {
            text: `${m(`x=${s.x}`)} がわかった。これを①に代入すると、どんな式になる？`,
            q: {
              ...choice(rng, sub, [
                (a + s.x) + b * s.y !== e1 && a + s.x !== a * s.x && { tex: `${raw([[a + s.x, {}], [b, { y: 1 }]])}=${e1}`, msg: `${m(`${a}x`)} は「${a}×x」。たすんじゃなくてかける！` },
                { tex: `${raw([[-a * s.x, {}], [b, { y: 1 }]])}=${e1}`, msg: '代入するときの符号を確認！' },
                e1 !== e2 && { tex: `${raw([[a * s.x, {}], [b, { y: 1 }]])}=${e2}`, msg: '①に代入したなら、右辺も①の右辺！' },
              ]),
              check: { kind: 'eqstep', eqs: [E1, E2], sol: s, mustNotContain: 'x' },
            },
          },
          { text: '解くと $y$ は？', q: { ...numAns([['y', 'y']], { y: s.y }), check: { kind: 'equations', eqs: [sub] } } },
          { text: `確かめ！ ②の左辺 ${m(L2(c, -b))} に ${m(`x=${s.x},\\ y=${s.y}`)} を入れるといくつ？`, q: { ...numAns(ONE, { v: e2 }), check: { kind: 'value', expr: L2(c, -b), vals: s } } },
          { text: `右辺の ${e2} と一致！ 答えは ${m(`x=${s.x},\\ y=${s.y}`)}。これが加減法の基本の流れ。` },
        ];
      },
    },
    {
      id: 'si-l2',
      title: '加減法（何倍かしてそろえる）',
      unlocks: ['si-mul1', 'si-mul2'],
      build(rng) {
        const s = { x: rng.nz(-5, 5), y: rng.nz(-5, 5) };
        let a, b, c, k;
        do { a = rng.int(1, 4); b = rng.int(1, 3); c = rng.int(1, 9); k = rng.pick([2, 3]); } while (k * a === c || b === 1 && a === 1);
        const d = k * b;
        const e1 = a * s.x + b * s.y, e2 = c * s.x + d * s.y;
        const E1 = E(a, b, e1), E2 = E(c, d, e2);
        const K1 = E(k * a, k * b, k * e1);
        const diff = `${tx(k * a - c)}=${k * e1 - e2}`;
        const sub = `${raw([[a * s.x, {}], [b, { y: 1 }]])}=${e1}`;
        return [
          { text: '今度はそのままたしてもひいても消えない。そんなときは、片方の式を何倍かして係数をそろえる。', math: sys(E1, E2) },
          { text: `${m('y')} の係数は①が ${b}、②が ${d}。①を何倍すればそろう？`, q: { ...numAns(ONE, { v: k }), check: { kind: 'fn', verify: (v) => v.v * b === d } } },
          {
            text: `①を ${k} 倍した式は？（両辺の全部の項にかける）`,
            q: {
              ...choice(rng, K1, eqOpts(s, [
                { cx: k * a, cy: k * b, r: e1, msg: '右辺にもかける！ これがいちばん多いミス。' },
                { cx: a, cy: k * b, r: k * e1, msg: '$x$ の項にもかける！' },
              ])),
              check: { kind: 'eqstep', eqs: [E1, E2], sol: s },
            },
          },
          {
            text: `${m('y')} の係数がどちらも ${d} になった。①×${k}−② を計算すると？`,
            q: {
              ...choice(rng, diff, eqOpts(s, [
                { cx: k * a - c, r: k * e1 + e2, msg: '右辺もひき算！' },
                { cx: k * a + c, r: k * e1 - e2, msg: '$x$ の項もひき算！' },
                { cx: k * a + c, cy: 2 * d, r: k * e1 + e2, msg: '同じ係数どうしは「ひく」と消える。' },
              ])),
              check: { kind: 'eqstep', eqs: [E1, E2], sol: s, mustNotContain: 'y' },
            },
          },
          { text: '$x$ は？', q: { ...numAns([['x', 'x']], { x: s.x }), check: { kind: 'equations', eqs: [diff] } } },
          { text: `①に ${m(`x=${s.x}`)} を代入して、$y$ は？`, q: { ...numAns([['y', 'y']], { y: s.y }), check: { kind: 'equations', eqs: [sub] } } },
          { text: `答えは ${m(`x=${s.x},\\ y=${s.y}`)}。両方の式を何倍かすることもある（例: ①×3、②×2）。考え方は同じ！` },
        ];
      },
    },
    {
      id: 'si-l3',
      title: '代入法',
      unlocks: ['si-subst'],
      build(rng) {
        let p, q, c, d, s;
        do { s = { x: rng.nz(-5, 5), y: 0 }; p = rng.intEx(-3, 4, [0]); q = rng.nz(-6, 6); s.y = p * s.x + q; c = rng.int(1, 5); d = rng.int(2, 4); } while (c + d * p === 0 || s.y === 0);
        const e = c * s.x + d * s.y;
        const E1 = `y=${lin(p, q)}`, E2 = E(c, d, e);
        const subTex = (D, Q) => `${tx(c)}+${D === 1 ? '' : D}(${lin(p, Q)})=${e}`;
        const holds = (D, Q) => c * s.x + D * (p * s.x + Q) === e;
        const merged = `${tx(c + d * p)}=${e - d * q}`;
        return [
          { text: '①が「$y=\\cdots$」の形になっているときは「代入法」が速い。①の右辺を、②の $y$ のところにまるごと入れる。', math: sys(E1, E2) },
          {
            text: '②の $y$ に①を代入した式は？（かっこをつけるのがポイント）',
            q: {
              ...choice(rng, subTex(d, q), [
                !holds(1, q) && { tex: subTex(1, q), msg: `${m(`${d}y`)} は「${d}×y」。かっこごと ${d} 倍する！` },
                !holds(d, -q) && { tex: subTex(d, -q), msg: '代入するときは①の右辺をそのまま（符号を変えない）。' },
              ]),
              check: { kind: 'eqstep', eqs: [E1, E2], sol: s, mustNotContain: 'y' },
            },
          },
          {
            text: 'かっこをはずして整理すると？',
            q: {
              ...choice(rng, merged, eqOpts(s, [
                { cx: c + p, r: e - q, msg: `かっこの中の全部の項に ${d} をかける！` },
                { cx: c + d * p, r: e + d * q, msg: '移項で符号チェンジ！' },
              ])),
              check: { kind: 'eqstep', eqs: [E1, E2], sol: s, mustNotContain: 'y' },
            },
          },
          { text: '$x$ は？', q: { ...numAns([['x', 'x']], { x: s.x }), check: { kind: 'equations', eqs: [merged] } } },
          { text: `①に ${m(`x=${s.x}`)} を入れると $y$ は？`, q: { ...numAns([['y', 'y']], { y: s.y }), check: { kind: 'equations', eqs: [`y=${tnum(p)}\\times ${tpar(s.x)}+${tpar(q)}`] } } },
          { text: `答えは ${m(`x=${s.x},\\ y=${s.y}`)}。「$y=$」や「$x=$」の式を見たら代入法を思い出そう。` },
        ];
      },
    },
    {
      id: 'si-l4',
      title: '文章題',
      unlocks: ['si-word'],
      build(rng) {
        let a, b, x, y, n, T;
        do { a = rng.int(5, 12) * 100; b = rng.int(2, 6) * 100; x = rng.int(1, 8); y = rng.int(1, 10); n = x + y; T = a * x + b * y; } while (a <= b || x === y);
        const s = { x, y };
        return [
          { text: `脱獄映画の上映会。大人 ${a} 円、子ども ${b} 円で、合わせて ${n} 人が入って入場料の合計は ${T} 円。大人と子どもは何人？ 作戦：わからない数を2つ文字にして、式を2本作る。` },
          {
            text: '大人を $x$ 人、子どもを $y$ 人とする。「人数」の式は？',
            q: { ...choice(rng, `x+y=${n}`, eqOpts(s, [{ cx: a, cy: b, r: n, msg: 'それは値段の式の左辺。人数は $x+y$！' }, { tex: `x-y=${n}`, cx: 1, cy: -1, r: n, msg: '合わせて、だからたし算！' }])), check: { kind: 'eqstep', eqs: [`x+y=${n}`, E(a, b, T)], sol: s } },
          },
          {
            text: '「入場料」の式は？',
            q: { ...choice(rng, E(a, b, T), eqOpts(s, [{ cx: b, cy: a, r: T, msg: '大人が $x$ 人だから、大人の値段に $x$ をかける。' }, { cx: a + b, cy: 0, r: T, tex: `${a + b}x=${T}`, msg: '子どもの人数は $y$。' }])), check: { kind: 'eqstep', eqs: [`x+y=${n}`, E(a, b, T)], sol: s } },
          },
          { text: `連立方程式 ${m(sys(`x+y=${n}`, E(a, b, T)))} を解くと？`, q: { ...numAns(XY, s, { wrong: pairWrong(s) }), check: { kind: 'equations', eqs: [`x+y=${n}`, E(a, b, T)] } } },
          { text: `大人 ${x} 人、子ども ${y} 人。人数 ${n} 人、料金 ${a * x}+${b * y}=${T} 円でOK！ 最後に「答えが問題に合っているか」確かめよう。` },
        ];
      },
    },
    {
      id: 'si-l5',
      title: 'かっこ・分数・小数がある式',
      unlocks: ['si-paren'],
      build(rng) {
        const mm = 2, nn = 3;
        const s = { x: mm * rng.nz(-3, 3), y: nn * rng.nz(-3, 3) };
        const k = s.x / mm + s.y / nn;
        const Ef = `\\frac{x}{${mm}}+\\frac{y}{${nn}}=${k}`;
        const a = rng.int(1, 4), b = rng.intEx(-4, 4, [0]);
        const E2 = E(a, b, a * s.x + b * s.y);
        const cleared = E(3, 2, 6 * k);
        return [
          { text: '分数や小数がある式は、まず「ふつうの式」に直す。分数は分母をはらい、小数は10倍。かっこははずす。', math: sys(Ef, E2) },
          { text: '①の分母 2 と 3 をはらうには、両辺に何をかける？', q: { ...numAns(ONE, { v: 6 }), check: { kind: 'fn', verify: (v) => v.v === 6 } } },
          {
            text: '①の両辺に 6 をかけた式は？',
            q: { ...choice(rng, cleared, eqOpts(s, [{ cx: 3, cy: 2, r: k, msg: '右辺にもかける！' }, { cx: 2, cy: 3, r: 6 * k, msg: '$\\frac{x}{2}\\times 6=3x$。分母でわった数をかけるよ。' }])), check: { kind: 'eqstep', eqs: [Ef, E2], sol: s } },
          },
          { text: `あとは ${m(sys(cleared, E2))} を解くだけ。答えは？`, q: { ...numAns(XY, s, { wrong: pairWrong(s) }), check: { kind: 'equations', eqs: [Ef, E2] } } },
        ];
      },
    },
  ],
};
