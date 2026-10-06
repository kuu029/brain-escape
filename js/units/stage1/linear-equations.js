import { F, lcm } from '../../core/frac.js';
import { tnum, tpar, tdec } from '../../core/fmt.js';
import { Poly } from '../../core/poly.js';
import { numAns, choice, ONE, m } from '../kit.js';

const X1 = [['x', 'x']];
const lin = (a, b) => Poly.lin(a, b).toTex();
const eq = (l, r) => `${l}=${r}`;

// 移項した式の選択肢を作る（正解 + よくある間違い）
function movedChoices(rng, a, b, c, d, sol) {
  // ax + b = cx + d → (a-c)x = d-b
  const correct = eq(Poly.v('x', a - c).toTex(), String(d - b));
  const wrongs = [
    { tex: eq(Poly.v('x', a - c).toTex(), String(d + b)), msg: '移項すると符号が変わる！ 左の数を右へ動かしたら＋とーが逆に。' },
    a + c !== 0 && { tex: eq(Poly.v('x', a + c).toTex(), String(d - b)), msg: '右の $x$ の項を左へ移すときも符号チェンジ！' },
    { tex: eq(Poly.v('x', a - c).toTex(), String(b - d)), msg: '数の項はどっちからどっちへ？ 右辺に集めよう。' },
  ];
  return choice(rng, correct, wrongs);
}

function genBasic(rng) {
  const a = rng.intEx(-9, 9, [0, 1]), b = rng.nz(-12, 12), x0 = rng.nz(-9, 9);
  const c = a * x0 + b;
  const tex = eq(lin(a, b), String(c));
  const wrong = [];
  if ((c + b) % a === 0) wrong.push({ vals: { x: (c + b) / a }, msg: `移項で符号が変わるのを忘れてない？ ${m(tnum(b))} を右へ → ${m(tnum(-b))}。` });
  wrong.push({ vals: { x: F(a, c - b) }, msg: `${m(`${a}x=${c - b}`)} なら、両辺を ${m(tpar(a))} でわる（逆さにしない）。` });
  if (a < 0) wrong.push({ vals: { x: -x0 }, msg: `${m(tpar(a))} でわるときは符号も変わる！` });
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...numAns(X1, { x: x0 }, { wrong }),
    hint: '数の項を右辺へ移項（符号チェンジ）→ 両辺を $x$ の係数でわる。',
    steps: [`${m(tnum(b))} を移項: ${m(eq(`${a === -1 ? '-' : a}x`, `${c}${tnum(-b).replace(/^(?!-)/, '+')}`))}`, `${m(eq(`${a === -1 ? '-' : a}x`, String(c - b)))}`, `両辺を ${m(tpar(a))} でわる: ${m(`x=${x0}`)}`],
    check: { kind: 'equations', eqs: [tex] },
  };
}

function genBoth(rng) {
  let a, b, c, d, x0;
  do { a = rng.nz(-9, 9); c = rng.nz(-9, 9); b = rng.nz(-12, 12); x0 = rng.nz(-8, 8); } while (a === c || Math.abs(a - c) === 1 && rng.chance(0.3));
  d = (a - c) * x0 + b;
  if (d === 0) d = (a - c) * (x0 = x0 + 1) + b;
  const tex = eq(lin(a, b), lin(c, d));
  const wrong = [];
  if ((d + b) % (a - c) === 0) wrong.push({ vals: { x: (d + b) / (a - c) }, msg: '数の項の移項で符号を変え忘れてない？' });
  if (a + c !== 0 && (d - b) % (a + c) === 0) wrong.push({ vals: { x: (d - b) / (a + c) }, msg: '$x$ の項を移項するときも符号が変わる！' });
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...numAns(X1, { x: x0 }, { wrong }),
    hint: '$x$ の項は左辺へ、数の項は右辺へ移項（移項したら符号チェンジ）。',
    steps: [`移項: ${m(eq(`${Poly.v('x', a).toTex()}${Poly.v('x', -c).toTex().replace(/^(?!-)/, '+')}`, `${d}${tnum(-b).replace(/^(?!-)/, '+')}`))}`, `まとめる: ${m(eq(Poly.v('x', a - c).toTex(), String(d - b)))}`, `${m(`x=${x0}`)}`],
    check: { kind: 'equations', eqs: [tex] },
  };
}

function genParen(rng) {
  let p, q, b, c, d, x0;
  do {
    p = rng.intEx(-5, 5, [0, 1, -1]); q = rng.nz(-6, 6); c = rng.nz(-6, 6); x0 = rng.nz(-8, 8);
    b = p * (x0 + q) - c * x0;
  } while (p === c || b === 0 || Math.abs(b) > 30);
  const left = `${p < 0 ? '-' : ''}${Math.abs(p)}(${lin(1, q)})`;
  const tex = eq(left, lin(c, b));
  const wrong = [];
  if (p - c !== 0 && (b - q) % (p - c) === 0) wrong.push({ vals: { x: (b - q) / (p - c) }, msg: `かっこの中の全部の項に ${m(tpar(p))} をかけよう！` });
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...numAns(X1, { x: x0 }, { wrong }),
    hint: 'まずかっこをはずす（分配法則）。あとは移項して解く。',
    steps: [`かっこをはずす: ${m(eq(lin(p, p * q), lin(c, b)))}`, `移項: ${m(eq(Poly.v('x', p - c).toTex(), String(b - p * q)))}`, `${m(`x=${x0}`)}`],
    check: { kind: 'equations', eqs: [tex] },
  };
}

function genFrac(rng) {
  let p, q, a, c, k, x0, b, d;
  do {
    [p, q] = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 2);
    a = rng.int(1, 3); c = rng.int(1, 3); k = rng.nz(-4, 4); x0 = rng.nz(-9, 9);
    b = k * p - a * x0; d = k * q - c * x0;
  } while (a * q === c * p || Math.abs(b) > 15 || Math.abs(d) > 15 || b === 0 || d === 0 || p % q === 0 || q % p === 0);
  const L = lcm(p, q);
  const tex = eq(`\\frac{${lin(a, b)}}{${p}}`, `\\frac{${lin(c, d)}}{${q}}`);
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...numAns(X1, { x: x0 }, { wrong: [] }),
    hint: `両辺に ${L} をかけて分母をはらう。分子はかっこつきで！`,
    steps: [
      `両辺に ${L} をかける: ${m(eq(`${L / p}(${lin(a, b)})`, `${L / q}(${lin(c, d)})`))}`,
      `かっこをはずす: ${m(eq(lin(a * L / p, b * L / p), lin(c * L / q, d * L / q)))}`,
      `移項してまとめる: ${m(eq(Poly.v('x', a * L / p - c * L / q).toTex(), String(d * L / q - b * L / p)))}`,
      `${m(`x=${x0}`)}`,
    ],
    check: { kind: 'equations', eqs: [tex] },
  };
}

function genDec(rng) {
  let a, b, c, d, x0;
  do { a = rng.nz(-9, 9); c = rng.nz(-9, 9); b = rng.nz(-15, 15); x0 = rng.nz(-8, 8); d = (a - c) * x0 + b; } while (a === c || d === 0 || Math.abs(d) > 40);
  const t = (n) => tdec(F(n, 10));
  const side = (u, v) => `${u === 10 ? '' : u === -10 ? '-' : t(u)}x${v < 0 ? '' : '+'}${t(v)}`;
  const tex = eq(side(a, b), side(c, d));
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...numAns(X1, { x: x0 }),
    hint: '両辺を10倍して小数を消す。全部の項に10をかける！',
    steps: [`両辺を10倍: ${m(eq(lin(a, b), lin(c, d)))}`, `移項: ${m(eq(Poly.v('x', a - c).toTex(), String(d - b)))}`, `${m(`x=${x0}`)}`],
    check: { kind: 'equations', eqs: [tex] },
  };
}

function genWord(rng) {
  const t = rng.int(0, 2);
  if (t === 0) {
    // 年齢
    let k, C, x, Fa;
    do { k = rng.int(2, 4); C = rng.int(3, 12); x = rng.int(2, 15); Fa = k * (C + x) - x; } while (Fa > 60 || Fa - C < 20);
    return {
      stem: `いま、看守長は ${Fa} 歳、新人看守は ${C} 歳。看守長の年齢が新人の ${k} 倍になるのは何年後？`,
      ...numAns([{ key: 'x', label: 'x', text: '', suffix: '年後' }], { x }),
      hint: `${m('x')} 年後の年齢を式にする: 看守長 ${m(`${Fa}+x`)}、新人 ${m(`${C}+x`)}。`,
      steps: [`${m('x')} 年後とすると ${m(eq(`${Fa}+x`, `${k}(${C}+x)`))}`, `かっこをはずす: ${m(eq(`${Fa}+x`, lin(k, k * C)))}`, `移項: ${m(eq(Poly.v('x', 1 - k).toTex(), String(k * C - Fa)))}`, `${m(`x=${x}`)} → ${x}年後`],
      check: { kind: 'equations', eqs: [eq(`${Fa}+x`, `${k}(${C}+x)`)] },
    };
  }
  if (t === 1) {
    // あまり・不足
    let a, b, r1, r2, n;
    do { a = rng.int(3, 6); b = a + rng.int(1, 3); n = rng.int(5, 15); r1 = rng.int(2, 12); r2 = (b - a) * n - r1; } while (r2 <= 0 || r2 > 15);
    const total = a * n + r1;
    return {
      stem: `囚人たちにパンを配る。1人 ${a} 個ずつだと ${r1} 個あまり、1人 ${b} 個ずつだと ${r2} 個たりない。囚人は何人？`,
      ...numAns([{ key: 'x', label: 'x', text: '', suffix: '人' }], { x: n }),
      hint: `パンの数を2通りで表す: ${m(`${a}x+${r1}`)} と ${m(`${b}x-${r2}`)}。これが等しい！`,
      steps: [`人数を ${m('x')} 人とすると ${m(eq(`${a}x+${r1}`, `${b}x-${r2}`))}`, `移項: ${m(eq(`${a - b === -1 ? '-' : a - b}x`, String(-r2 - r1)))}`, `${m(`x=${n}`)}（パンは ${total} 個）`],
      check: { kind: 'equations', eqs: [eq(`${a}x+${r1}`, `${b}x-${r2}`)] },
    };
  }
  // 代金
  let a, b, n, x, T;
  do { a = rng.int(5, 15) * 10; b = rng.int(3, 15) * 10; n = rng.int(6, 15); x = rng.int(1, n - 1); T = a * x + b * (n - x); } while (a === b);
  return {
    stem: `売店で 1本 ${a} 円のジュースと 1個 ${b} 円のパンを合わせて ${n} 個買ったら、代金は ${T} 円。ジュースは何本？`,
    ...numAns([{ key: 'x', label: 'x', text: '', suffix: '本' }], { x }),
    hint: `ジュースを ${m('x')} 本とすると、パンは ${m(`${n}-x`)} 個。代金の式を作ろう。`,
    steps: [`${m(eq(`${a}x+${b}(${n}-x)`, String(T)))}`, `かっこをはずす: ${m(eq(lin(a - b, b * n), String(T)))}`, `${m(eq(Poly.v('x', a - b).toTex(), String(T - b * n)))} → ${m(`x=${x}`)}`],
    check: { kind: 'equations', eqs: [eq(`${a}x+${b}(${n}-x)`, String(T))] },
  };
}

export default {
  id: 'linear-equations',
  stage: 1,
  area: '中庭',
  title: '一次方程式',
  emoji: '⚖️',
  prereqs: [],
  tool: 'nuke',
  hintCard: [
    '移項すると符号が変わる: $x+3=7$ → $x=7-3$',
    '$x$ の項は左辺、数は右辺に集める',
    '最後に両辺を $x$ の係数でわる',
    'かっこ → はずす、分数 → 両辺に分母の最小公倍数をかける、小数 → 10倍',
  ],
  generators: {
    'le-basic': { difficulty: 1, gen: genBasic },
    'le-both': { difficulty: 1, gen: genBoth },
    'le-paren': { difficulty: 2, gen: genParen },
    'le-frac': { difficulty: 3, gen: genFrac },
    'le-dec': { difficulty: 2, gen: genDec },
    'le-word': { difficulty: 3, gen: genWord },
  },
  lessons: [
    {
      id: 'le-l1',
      title: '移項して解く',
      unlocks: ['le-basic', 'le-both'],
      build(rng) {
        let a, b, c, d, x0;
        do { a = rng.int(2, 7); c = rng.nz(-4, 4); b = rng.nz(-9, 9); x0 = rng.nz(-6, 6); d = (a - c) * x0 + b; } while (a === c || a - c === 1 || d === 0);
        const tex = eq(lin(a, b), lin(c, d));
        return [
          { text: '方程式は「$x = ○$」の形にしたらゴール。武器は「移項」＝ 項を反対側へ動かして、符号を変える。', math: tex },
          { text: '$x$ の項を左、数を右に集める（移項）とどうなる？', q: { ...movedChoices(rng, a, b, c, d, x0), check: { kind: 'eqstep', eqs: [tex], sol: { x: x0 } } } },
          { text: `${m(eq(Poly.v('x', a - c).toTex(), String(d - b)))}。両辺を何でわる？`, q: { ...numAns(ONE, { v: a - c }), check: { kind: 'fn', verify: (v) => v.v === a - c } } },
          { text: 'では $x$ は？', q: { ...numAns(X1, { x: x0 }), check: { kind: 'equations', eqs: [tex] } } },
          { text: `確かめ: 元の式に ${m(`x=${x0}`)} を入れると、左辺の値は？`, q: { ...numAns(ONE, { v: a * x0 + b }), check: { kind: 'value', expr: lin(a, b), vals: { x: x0 } } } },
          { text: `右辺も ${m(String(c * x0 + d))}。両辺が同じになったので正解確定！` },
        ];
      },
    },
    {
      id: 'le-l2',
      title: 'かっこ・小数のある方程式',
      unlocks: ['le-paren', 'le-dec'],
      build(rng) {
        let p, q, b, c, x0;
        do { p = rng.int(2, 5); q = rng.nz(-6, 6); c = rng.nz(-5, 5); x0 = rng.nz(-6, 6); b = p * (x0 + q) - c * x0; } while (p === c || b === 0 || Math.abs(b) > 30);
        const tex = eq(`${p}(${lin(1, q)})`, lin(c, b));
        return [
          { text: 'かっこがあったら、まずはずす。そのあとはいつもの移項。', math: tex },
          { text: 'かっこをはずした式は？', q: { ...choice(rng, eq(lin(p, p * q), lin(c, b)), [{ tex: eq(lin(p, q), lin(c, b)), msg: `後ろの項にも ${p} をかける！` }, { tex: eq(lin(1, p * q), lin(c, b)), msg: `${m('x')} にも ${p} をかける！` }]), check: { kind: 'eqstep', eqs: [tex], sol: { x: x0 } } } },
          { text: '移項して解くと $x$ は？', q: { ...numAns(X1, { x: x0 }), check: { kind: 'equations', eqs: [tex] } } },
          { text: '小数の方程式は、両辺を10倍（または100倍）して整数にしてから解く。全部の項にかけるのを忘れずに。' },
        ];
      },
    },
    {
      id: 'le-l3',
      title: '分数の方程式',
      unlocks: ['le-frac'],
      build(rng) {
        let p, q, a, c, k, x0, b, d;
        do {
          [p, q] = rng.shuffle([2, 3, 4, 6]).slice(0, 2);
          a = rng.int(1, 3); c = rng.int(1, 3); k = rng.nz(-3, 3); x0 = rng.nz(-8, 8);
          b = k * p - a * x0; d = k * q - c * x0;
        } while (a * q === c * p || Math.abs(b) > 12 || Math.abs(d) > 12 || b === 0 || d === 0 || p % q === 0 || q % p === 0);
        const L = lcm(p, q);
        const tex = eq(`\\frac{${lin(a, b)}}{${p}}`, `\\frac{${lin(c, d)}}{${q}}`);
        return [
          { text: '分数の方程式は「分母をはらう」。両辺に分母の最小公倍数をかけると分数が消える。', math: tex },
          { text: '両辺に何をかける？', q: { ...numAns(ONE, { v: L }, { wrong: [{ vals: { v: p * q }, msg: 'それでもいいけど、最小公倍数のほうが楽！' }] }), check: { kind: 'fn', verify: (v) => v.v === L } } },
          { text: `両辺に ${L} をかけた式は？（分子はかっこつきで）`, q: { ...choice(rng, eq(`${L / p}(${lin(a, b)})`, `${L / q}(${lin(c, d)})`), [{ tex: eq(`${L / p}(${lin(a, b)})`, lin(c, d)), msg: '両辺にかける！' }, (a * L / p) * x0 + b !== (c * L / q) * x0 + d && { tex: eq(lin(a * L / p, b), lin(c * L / q, d)), msg: '分子の全部の項にかける（かっこをつけよう）。' }]), check: { kind: 'eqstep', eqs: [tex], sol: { x: x0 } } } },
          { text: 'かっこをはずして移項。$x$ は？', q: { ...numAns(X1, { x: x0 }), check: { kind: 'equations', eqs: [tex] } } },
        ];
      },
    },
    {
      id: 'le-l4',
      title: '文章題',
      unlocks: ['le-word'],
      build(rng) {
        let a, b, n, x, T;
        do { a = rng.int(8, 15) * 10; b = rng.int(3, 7) * 10; n = rng.int(6, 12); x = rng.int(1, n - 1); T = a * x + b * (n - x); } while (a === b || 2 * x === n);
        const e = eq(`${a}x+${b}(${n}-x)`, String(T));
        return [
          { text: `売店で 1本 ${a} 円のジュースと 1個 ${b} 円のパンを合わせて ${n} 個買って ${T} 円。ジュースは何本？ 文章題の作戦は「わからない数を $x$ にする → 等しい関係を式に」。` },
          { text: `ジュースを ${m('x')} 本とする。パンは何個？`, q: { ...choice(rng, `${n}-x`, [{ tex: `x-${n}`, msg: '全部で $' + n + '$ 個だから、残りは「' + n + 'ひくx」。' }, { tex: `${n}x`, msg: '合わせて ' + n + ' 個、の残りの数を考えよう。' }]), check: { kind: 'identity', expr: `${n}-x`, vars: ['x'] } } },
          { text: '代金が等しい、という式は？', q: { ...choice(rng, e, [{ tex: eq(`${a}x+${b}x`, String(T)), msg: 'パンの個数は $x$ じゃない！' }, { tex: eq(`${b}x+${a}(${n}-x)`, String(T)), msg: 'ジュースが $x$ 本だから、ジュースの値段に $x$ をかける。' }]), check: { kind: 'eqstep', eqs: [e], sol: { x } } } },
          { text: '解くと $x$ は？', q: { ...numAns(X1, { x }), check: { kind: 'equations', eqs: [e] } } },
          { text: `ジュース ${x} 本、パン ${n - x} 個。代金を計算すると ${a * x}+${b * (n - x)}=${T} 円。ぴったり！ 最後に「答えが問題に合っているか」確かめるクセをつけよう。` },
        ];
      },
    },
  ],
};
