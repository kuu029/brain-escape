import { F, lcm } from '../../core/frac.js';
import { tnum, tpar } from '../../core/fmt.js';
import { Poly, termTex, fracPolyTex } from '../../core/poly.js';
import { numAns, choice, polyChoice, ONE, m } from '../kit.js';

const P2 = (a, b, c = 0, u = 'x', v = 'y') => Poly.of([[a, { [u]: 1 }], [b, { [v]: 1 }], [c, {}]]);
const mono = (c, e) => termTex(F(c), e, true);
const pmono = (c, e) => (c < 0 ? `(${mono(c, e)})` : mono(c, e));
const VARS = [['x', 'y'], ['a', 'b']];

function genAddSub(rng) {
  const [u, v] = rng.pick(VARS);
  let A, B, op, ans;
  const quad = rng.chance(0.35);
  do {
    if (quad) {
      A = Poly.of([[rng.nz(-5, 5), { [u]: 2 }], [rng.nz(-6, 6), { [u]: 1 }], [rng.nz(-9, 9), {}]]);
      B = Poly.of([[rng.nz(-5, 5), { [u]: 2 }], [rng.nz(-6, 6), { [u]: 1 }], [rng.nz(-9, 9), {}]]);
    } else {
      A = P2(rng.nz(-7, 7), rng.nz(-7, 7), 0, u, v);
      B = P2(rng.nz(-7, 7), rng.nz(-7, 7), 0, u, v);
    }
    op = rng.pick(['+', '-']);
    ans = op === '+' ? A.add(B) : A.sub(B);
  } while (ans.t.size < 2);
  const tex = `(${A.toTex()})${op}(${B.toTex()})`;
  // 後ろのかっこの最初の項だけ符号を変える間違い
  const [first, ...rest] = B.terms();
  const half = Poly.of([[first.c.neg(), first.e], ...rest.map((t) => [t.c, t.e])]);
  const wrongs = op === '-' ? [{ p: A.add(half), msg: 'ひくかっこは、中の全部の項の符号を変える！' }, { p: A.add(B), msg: 'ひき算なのに足してない？' }] : [{ p: A.sub(B), msg: 'たし算のかっこはそのままはずせばOK。' }];
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...polyChoice(rng, ans, wrongs),
    hint: op === '-' ? 'ーのかっこをはずすと、中の全部の項の符号が変わる。そのあと同類項をまとめる。' : 'かっこをはずして、同類項をまとめる。',
    steps: [`かっこをはずす: ${m(A.toTex() + (op === '-' ? B.neg() : B).terms().map((t) => termTex(t.c, t.e, false)).join(''))}`, `同類項をまとめる: ${m(ans.toTex())}`],
    check: { kind: 'identity', expr: tex, vars: [u, v] },
  };
}

function genScalar(rng) {
  const [u, v] = rng.pick(VARS);
  let p, q, A, B, ans;
  do {
    p = rng.int(2, 5); q = rng.int(2, 5);
    A = P2(rng.nz(-5, 5), rng.nz(-5, 5), 0, u, v);
    B = P2(rng.nz(-5, 5), rng.nz(-5, 5), 0, u, v);
    ans = A.scale(p).sub(B.scale(q));
  } while (ans.t.size < 2);
  const tex = `${p}(${A.toTex()})-${q}(${B.toTex()})`;
  const [first, ...rest] = B.scale(-q).terms();
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...polyChoice(rng, ans, [
      { p: A.scale(p).add(Poly.of([[first.c, first.e], ...rest.map((t) => [t.c.neg(), t.e])])), msg: `${m(`-${q}`)} はかっこの中の全部の項にかける！` },
      { p: A.scale(p).add(B.scale(q)), msg: '2つ目のかっこの前はマイナス！' },
    ]),
    hint: 'かっこの前の数を符号ごと全部の項にかけて、同類項をまとめる。',
    steps: [`かっこをはずす: ${m(A.scale(p).toTex() + B.scale(-q).terms().map((t) => termTex(t.c, t.e, false)).join(''))}`, `まとめる: ${m(ans.toTex())}`],
    check: { kind: 'identity', expr: tex, vars: [u, v] },
  };
}

function genMono(rng) {
  const [u, v] = rng.pick(VARS);
  const form = rng.int(0, 3);
  const e = (i, j) => ({ [u]: i, [v]: j });
  let tex, ans, wrongs, steps;
  if (form === 0) {
    const a = rng.nz(-6, 6), b = rng.nz(-6, 6);
    const e1 = e(rng.int(1, 2), rng.int(0, 1)), e2 = e(rng.int(1, 2), rng.int(0, 2));
    if (Math.abs(a) === 1 && Math.abs(b) === 1) return genMono(rng);
    tex = `${mono(a, e1)}\\times ${pmono(b, e2)}`;
    ans = Poly.of([[a, e1]]).mul(Poly.of([[b, e2]]));
    wrongs = [{ p: ans.neg(), msg: '符号を確認！' }, { p: Poly.of([[a * b, { [u]: e1[u] * e2[u], [v]: e1[v] + e2[v] }]]), msg: '同じ文字のかけ算は、指数を「たす」！ $x^{2}\\times x=x^{3}$' }];
    steps = [`数どうし: ${m(`${tpar(a)}\\times ${tpar(b)}=${a * b}`)}`, `文字どうし（指数はたす）→ ${m(ans.toTex())}`];
  } else if (form === 1) {
    const r = rng.nz(-6, 6), d = rng.intEx(-5, 5, [0, 1]);
    const eR = e(rng.int(0, 2), rng.int(0, 1)), eD = e(rng.int(1, 2), rng.int(0, 1));
    const dividend = Poly.of([[r, eR]]).mul(Poly.of([[d, eD]]));
    const dv = dividend.terms()[0];
    tex = `${mono(dv.c.n, dv.e)}\\div ${pmono(d, eD)}`;
    ans = Poly.of([[r, eR]]);
    wrongs = [{ p: ans.neg(), msg: '符号を確認！' }, { p: dividend.mul(Poly.of([[d, eD]])), msg: 'わり算なのにかけてない？ 分数にして約分しよう。' }, { p: Poly.of([[r * d * d, eR]]), msg: '数の部分もわり算！' }];
    steps = [`分数にする: ${m(`\\frac{${mono(dv.c.n, dv.e)}}{${mono(d, eD)}}`)}`, `数と文字をそれぞれ約分 → ${m(ans.toTex())}`];
  } else if (form === 2) {
    const b = rng.intEx(-4, 4, [0, 1]), c = rng.nz(-5, 5);
    const eB = e(1, rng.int(0, 1)), eC = e(rng.int(0, 1), 1);
    tex = `(${mono(b, eB)})^{2}\\times ${pmono(c, eC)}`;
    const sq = Poly.of([[b, eB]]).pow(2);
    ans = sq.mul(Poly.of([[c, eC]]));
    wrongs = [{ p: Poly.of([[b, eB]]).mul(Poly.of([[2 * c, eC]])), msg: '2乗は「2倍」じゃない！ 同じものを2回かける。' }, { p: ans.neg(), msg: `${m(`(${mono(b, eB)})^{2}`)} はプラスになる！` }];
    steps = [`先に2乗: ${m(`(${mono(b, eB)})^{2}=${sq.toTex()}`)}`, `かける: ${m(ans.toTex())}`];
  } else {
    // a ÷ b × c（左から順に）
    const a = rng.int(2, 6), b = rng.int(2, 4);
    const c = rng.nz(-4, 4);
    const eA = e(2, 1), eB = e(1, 0), eC = e(0, 1);
    tex = `${mono(a * b, eA)}\\div ${mono(b, eB)}\\times ${pmono(c, eC)}`;
    ans = Poly.of([[a * c, e(1, 2)]]);
    wrongs = [{ p: Poly.of([[F(a, c), e(1, 0)]]), msg: '「÷b×c」は「÷(b×c)」じゃない！ ×c は分子へ。' }, { p: ans.neg(), msg: '符号を確認！' }];
    steps = [`分数にまとめる: ${m(`\\frac{${mono(a * b, eA)}\\times ${pmono(c, eC)}}{${mono(b, eB)}}`)}`, `約分 → ${m(ans.toTex())}`];
  }
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...polyChoice(rng, ans, wrongs),
    hint: '符号 → 数 → 文字 の順に。わり算は分数にして約分すると楽。',
    steps,
    check: { kind: 'identity', expr: tex, vars: [u, v] },
  };
}

function genFrac(rng) {
  let p, q, A, B, ans;
  do {
    [p, q] = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 2);
    A = P2(rng.nz(-5, 5), rng.nz(-5, 5));
    B = P2(rng.nz(-5, 5), rng.nz(-5, 5));
    ans = A.scale(F(1, p)).sub(B.scale(F(1, q)));
  } while (ans.t.size < 2 || ans.denLcm() === 1);
  const L = lcm(p, q);
  const tex = `\\frac{${A.toTex()}}{${p}}-\\frac{${B.toTex()}}{${q}}`;
  const bad = A.scale(L / p).add(B.scale(-L / q).terms().map((t, i) => (i === 0 ? Poly.of([[t.c, t.e]]) : Poly.of([[t.c.neg(), t.e]]))).reduce((x, y) => x.add(y), new Poly())).scale(F(1, L));
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...polyChoice(rng, ans, [{ p: bad, msg: 'ひく分数の分子は、かっこごと引く！' }, { p: A.sub(B).scale(F(1, L)), msg: `通分したら分子にも ${L / p} や ${L / q} をかける！` }], fracPolyTex),
    hint: `分母を ${L} にそろえて、分子はかっこをつけて計算。`,
    steps: [`通分: ${m(`\\frac{${L / p}(${A.toTex()})-${L / q}(${B.toTex()})}{${L}}`)}`, `分子を計算してまとめる: ${m(fracPolyTex(ans))}`],
    check: { kind: 'identity', expr: tex, vars: ['x', 'y'] },
  };
}

function genValue(rng) {
  let p, q, A, B, S, xv, yv;
  do {
    p = rng.int(2, 5); q = rng.int(2, 4);
    A = P2(rng.nz(-4, 4), rng.nz(-4, 4));
    B = P2(rng.nz(-4, 4), rng.nz(-4, 4));
    S = A.scale(p).sub(B.scale(q));
  } while (S.t.size < 2);
  xv = rng.chance(0.5) ? F(rng.nz(-4, 4)) : F(rng.nz(-3, 3), rng.pick([2, 3]));
  yv = F(rng.nz(-4, 4));
  const tex = `${p}(${A.toTex()})-${q}(${B.toTex()})`;
  const ans = S.evaluate({ x: xv, y: yv });
  const wrong = [{ vals: { v: S.evaluate({ x: yv, y: xv }) }, msg: '$x$ と $y$ を入れまちがえてない？' }];
  return {
    stem: `${m(`x=${tnum(xv)},\\ y=${tnum(yv)}`)} のとき、${m(tex)} の値を求めよ。`,
    ...numAns(ONE, { v: ans }, { wrong }),
    hint: 'いきなり代入しない！ まず式をシンプルにしてから代入すると計算ミスが減る。',
    steps: [`式を整理: ${m(S.toTex())}`, `代入: ${m(tnum(ans))}`],
    check: { kind: 'value', expr: tex, vals: { x: xv.num(), y: yv.num() } },
  };
}

function genSolve(rng) {
  const form = rng.int(0, 2);
  if (form === 0) {
    // ax + by = c を y について
    let a, b, c;
    do { a = rng.nz(-6, 6); b = rng.intEx(-5, 5, [0]); c = rng.nz(-12, 12); } while (Math.abs(b) === 1 && rng.chance(0.5));
    const lhs = Poly.of([[a, { x: 1 }], [b, { y: 1 }]]).toTex();
    const e = `${lhs}=${c}`;
    const ans = Poly.lin(F(-a, b), F(c, b));
    const T = (p) => `y=${p.toTex()}`;
    return {
      stem: `${m(e)} を ${m('y')} について解け。`,
      ...choice(rng, T(ans), [
        { tex: T(Poly.lin(F(a, b), F(c, b))), msg: `${m(Poly.v('x', a).toTex())} を移項すると符号が変わる！` },
        { tex: T(Poly.lin(F(-a, b), c)), msg: `右辺の全部の項を ${m(tpar(b))} でわる！` },
        { tex: T(Poly.lin(-a, c)), msg: `最後に両辺を ${m(tpar(b))} でわるのを忘れてない？` },
      ].filter((w) => w.tex !== T(ans))),
      hint: '$y$ の項だけ左に残して他を移項 → 両辺を $y$ の係数でわる。',
      steps: [`移項: ${m(`${Poly.v('y', b).toTex()}=${Poly.lin(-a, c).toTex()}`)}`, `両辺を ${m(tpar(b))} でわる: ${m(T(ans))}`],
      check: { kind: 'transform', eq: e, var: 'y', others: ['x'] },
    };
  }
  if (form === 1) {
    // y = ax + b を x について
    const a = rng.intEx(-5, 5, [0, 1, -1]), b = rng.nz(-9, 9);
    const e = `y=${Poly.lin(a, b).toTex()}`;
    const ans = Poly.of([[F(1, a), { y: 1 }], [F(-b, a), {}]]);
    const T = (p) => `x=${p.toTex()}`;
    return {
      stem: `${m(e)} を ${m('x')} について解け。`,
      ...choice(rng, T(ans), [
        { tex: T(Poly.of([[F(1, a), { y: 1 }], [F(b, a), {}]])), msg: '移項で符号チェンジ！' },
        { tex: T(Poly.of([[a, { y: 1 }], [-b, {}]])), msg: `${m(String(a))} で「わる」。かけるんじゃない！` },
        { tex: T(Poly.of([[F(1, a), { y: 1 }], [-b, {}]])), msg: `${m(String(b))} も ${m(String(a))} でわる！` },
      ]),
      hint: '左右を入れかえて、$x$ の項を残して移項 → 係数でわる。',
      steps: [`入れかえる: ${m(`${Poly.lin(a, b).toTex()}=y`)}`, `移項: ${m(`${Poly.v('x', a).toTex()}=${Poly.of([[1, { y: 1 }], [-b, {}]]).toTex()}`)}`, `わる: ${m(T(ans))}`],
      check: { kind: 'transform', eq: e, var: 'x', others: ['y'] },
    };
  }
  // m = (a + b) / k を a について
  const k = rng.int(2, 4);
  const e = `m=\\frac{a+b}{${k}}`;
  const ans = Poly.of([[k, { m: 1 }], [-1, { b: 1 }]]);
  const T = (p) => `a=${p.toTex()}`;
  return {
    stem: `${m(e)} を ${m('a')} について解け。`,
    ...choice(rng, T(ans), [
      { tex: T(Poly.of([[k, { m: 1 }], [1, { b: 1 }]])), msg: '$b$ を移項すると符号が変わる！' },
      { tex: T(Poly.of([[1, { m: 1 }], [-1, { b: 1 }]])), msg: `まず両辺に ${k} をかけて分母をはらおう。` },
      { tex: T(Poly.of([[k, { m: 1 }], [-k, { b: 1 }]])), msg: `${k} をかけるのは $m$ の方だけ（左辺）。` },
    ]),
    hint: '両辺に分母をかけて、$a$ だけ残す。',
    steps: [`両辺を入れかえて ${k} 倍: ${m(`a+b=${k}m`)}`, `移項: ${m(T(ans))}`],
    check: { kind: 'transform', eq: e, var: 'a', others: ['m', 'b'] },
  };
}

export default {
  id: 'polynomials',
  stage: 2,
  area: '作業場',
  title: '式の計算',
  emoji: '🧮',
  prereqs: ['expressions'],
  tool: 'sniper',
  hintCard: [
    'ーのかっこをはずすと、中の全部の項の符号が変わる',
    '同じ文字のかけ算は指数をたす: $x^{2}\\times x=x^{3}$',
    'わり算は分数にして約分',
    '式の値は「整理してから代入」',
    '等式変形: 残したい文字以外を移項 → 係数でわる',
  ],
  generators: {
    'po-addsub': { difficulty: 1, gen: genAddSub },
    'po-scalar': { difficulty: 2, gen: genScalar },
    'po-mono': { difficulty: 2, gen: genMono },
    'po-frac': { difficulty: 3, gen: genFrac },
    'po-value': { difficulty: 2, gen: genValue },
    'po-solve': { difficulty: 2, gen: genSolve },
  },
  lessons: [
    {
      id: 'po-l1',
      title: '多項式のたし算・ひき算',
      unlocks: ['po-addsub', 'po-scalar'],
      build(rng) {
        let A, B, ans;
        do { A = P2(rng.nz(-6, 6), rng.nz(-6, 6)); B = P2(rng.nz(-6, 6), rng.nz(-6, 6)); ans = A.sub(B); } while (ans.t.size < 2);
        const tex = `(${A.toTex()})-(${B.toTex()})`;
        const opened = A.toTex() + B.neg().terms().map((t) => termTex(t.c, t.e, false)).join('');
        const [first, second] = B.terms();
        const Bp = Poly.of([[first.c.neg(), first.e], [second.c, second.e]]);
        const half = A.add(Bp);
        const halfOpened = A.toTex() + [termTex(first.c.neg(), first.e, false), termTex(second.c, second.e, false)].join('');
        const plusOpened = A.toTex() + B.terms().map((t) => termTex(t.c, t.e, false)).join('');
        return [
          { text: '文字が2種類になっても、やることは同じ。「$x$ どうし」「$y$ どうし」をまとめる。', math: tex },
          { text: '後ろのかっこをはずすと？（ーのかっこは全部の符号が変わる）', q: { ...choice(rng, opened, [{ tex: halfOpened, msg: '2つ目の項の符号も変える！' }, { tex: plusOpened, msg: 'ーのかっこは、はずすと符号が全部変わる！' }]), check: { kind: 'identity', expr: tex, vars: ['x', 'y'] } } },
          { text: '同類項をまとめると？', q: { ...polyChoice(rng, ans, [{ p: half, msg: '符号をもう一度確認！' }, { p: A.add(B), msg: 'ひき算だよ！' }]), check: { kind: 'identity', expr: tex, vars: ['x', 'y'] } } },
        ];
      },
    },
    {
      id: 'po-l2',
      title: '単項式のかけ算・わり算',
      unlocks: ['po-mono'],
      build(rng) {
        const b = -rng.int(2, 4), c = rng.int(2, 5);
        const tex = `(${b}x)^{2}\\times ${c}y`;
        const r = rng.intEx(-5, 5, [0, 1, -1]), d = rng.intEx(-4, 4, [0, 1, -1]);
        const divTex = `${mono(r * d, { x: 2, y: 1 })}\\div ${pmono(d, { x: 1 })}`;
        return [
          { text: '単項式のかけ算は「数どうし」「文字どうし」。累乗はかっこの中身を全部くり返しかける。', math: tex },
          { text: `${m(`(${b}x)^{2}`)} はいくつ？`, q: { ...polyChoice(rng, Poly.v('x', b * b, 2), [{ p: Poly.v('x', -b * b, 2), msg: 'マイナス×マイナスでプラス！' }, { p: Poly.v('x', 2 * b, 2), msg: '2乗は2倍じゃない！' }, { p: Poly.v('x', b * b), msg: '$x$ も2乗される！' }]), check: { kind: 'identity', expr: `(${b}x)^{2}`, vars: ['x'] } } },
          { text: `それに ${m(`${c}y`)} をかけると？`, q: { ...polyChoice(rng, Poly.of([[b * b * c, { x: 2, y: 1 }]]), [{ p: Poly.of([[-b * b * c, { x: 2, y: 1 }]]), msg: '符号を確認！' }]), check: { kind: 'identity', expr: tex, vars: ['x', 'y'] } } },
          { text: 'わり算は分数にして、数と文字をそれぞれ約分する。', math: divTex },
          { text: '答えは？', q: { ...polyChoice(rng, Poly.of([[r, { x: 1, y: 1 }]]), [{ p: Poly.of([[-r, { x: 1, y: 1 }]]), msg: '符号を確認！' }, { p: Poly.of([[r, { x: 2, y: 1 }]]), msg: '文字も約分！ $x^{2}\\div x=x$' }]), check: { kind: 'identity', expr: divTex, vars: ['x', 'y'] } } },
        ];
      },
    },
    {
      id: 'po-l3',
      title: '分数の式と式の値',
      unlocks: ['po-frac', 'po-value'],
      build(rng) {
        let A, B, ans;
        do { A = P2(rng.nz(-4, 4), rng.nz(-4, 4)); B = P2(rng.nz(-4, 4), rng.nz(-4, 4)); ans = A.scale(F(1, 2)).sub(B.scale(F(1, 3))); } while (ans.t.size < 2);
        const tex = `\\frac{${A.toTex()}}{2}-\\frac{${B.toTex()}}{3}`;
        const numer = A.scale(3).sub(B.scale(2));
        const xv = rng.nz(-3, 3), yv = rng.nz(-3, 3);
        return [
          { text: '分数の式は通分。分母2と3なら6にそろえて、分子はかっこごと。', math: tex },
          { text: `分子 ${m(`3(${A.toTex()})-2(${B.toTex()})`)} を計算すると？`, q: { ...polyChoice(rng, numer, [{ p: A.scale(3).add(B.scale(-2).terms().map((t, i) => Poly.of([[i === 0 ? t.c : t.c.neg(), t.e]])).reduce((x, y) => x.add(y), new Poly())), msg: '後ろのかっこの全部の項の符号を変える！' }]), check: { kind: 'identity', expr: `3(${A.toTex()})-2(${B.toTex()})`, vars: ['x', 'y'] } } },
          { text: '答えは？', q: { ...polyChoice(rng, ans, [{ p: numer, msg: '分母の6を忘れずに！' }], fracPolyTex), check: { kind: 'identity', expr: tex, vars: ['x', 'y'] } } },
          { text: `式の値は「整理してから代入」が鉄則。${m(`x=${xv},\\ y=${yv}`)} のとき、${m(`3(${A.toTex()})-2(${B.toTex()})`)} の値は？（整理した式 ${m(numer.toTex())} に代入）`, q: { ...numAns(ONE, { v: numer.evaluate({ x: xv, y: yv }) }), check: { kind: 'value', expr: `3(${A.toTex()})-2(${B.toTex()})`, vals: { x: xv, y: yv } } } },
        ];
      },
    },
    {
      id: 'po-l4',
      title: '等式の変形',
      unlocks: ['po-solve'],
      build(rng) {
        const a = rng.int(2, 6), b = rng.int(2, 5), c = rng.int(2, 12);
        const e = `${a}x+${b}y=${c}`;
        const ans = Poly.lin(F(-a, b), F(c, b));
        return [
          { text: '「$y$ について解く」＝「$y=\\cdots$ の形にする」。方程式の解き方と同じ道具（移項・わる）を使う。', math: e },
          { text: `${m(`${a}x`)} を右辺へ移項すると？`, q: { ...choice(rng, `${b}y=${Poly.lin(-a, c).toTex()}`, [{ tex: `${b}y=${Poly.lin(a, c).toTex()}`, msg: '移項で符号チェンジ！' }, c !== a && { tex: `${b}y=${termTex(F(c - a), { x: 1 }, true)}`, msg: '$x$ の項と数はまとめられない！' }]), check: { kind: 'eqstep', eqs: [e], sol: { x: b, y: (c - a * b) / b } } } },
          { text: `両辺を ${b} でわると？`, q: { ...choice(rng, `y=${ans.toTex()}`, [{ tex: `y=${Poly.lin(F(-a, b), c).toTex()}`, msg: `右辺の全部の項を ${b} でわる！` }, { tex: `y=${Poly.lin(-a, c).toTex()}`, msg: `${b} でわるのを忘れてない？` }]), check: { kind: 'transform', eq: e, var: 'y', others: ['x'] } } },
        ];
      },
    },
  ],
};
