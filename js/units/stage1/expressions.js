import { F, lcm } from '../../core/frac.js';
import { tnum, tpar } from '../../core/fmt.js';
import { Poly, termTex, fracPolyTex } from '../../core/poly.js';
import { numAns, choice, polyChoice, ONE, m } from '../kit.js';

const X = { x: 1 };
const lin = (a, b, v = 'x') => Poly.lin(a, b, v).toTex();
// 項を並べた順のまま表示（まとめない）
const rawTerms = (terms) => terms.map(([c, e], i) => termTex(F(c), e, i === 0)).join('');

function genLike(rng) {
  let a, b, c, d;
  do {
    a = rng.nz(-9, 9); b = rng.nz(-9, 9); c = rng.nz(-9, 9); d = rng.nz(-9, 9);
  } while (a + c === 0 || b + d === 0);
  const order = rng.chance(0.5) ? [[a, X], [b, {}], [c, X], [d, {}]] : [[b, {}], [a, X], [d, {}], [c, X]];
  const tex = rawTerms(order);
  const ans = Poly.lin(a + c, b + d);
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...polyChoice(rng, ans, [
      { p: Poly.lin(a + b + c + d, 0), msg: '$x$ の項と数の項はまとめられない！ 別グループ。' },
      { p: Poly.lin(a - c, b + d), msg: `符号ごと動かそう。${m(termTex(F(c), X, false))} の符号は ${c < 0 ? 'ー' : '＋'}。` },
      { p: Poly.lin(a + c, b - d), msg: '数の項の符号を確認！' },
    ]),
    hint: '$x$ の項どうし、数の項どうしをまとめる（同類項）。',
    steps: [`${m('x')} の項: ${m(rawTerms([[a, X], [c, X]]))} → ${m(termTex(F(a + c), X, true))}`, `数の項: ${m(rawTerms([[b, {}], [d, {}]]))} → ${m(String(b + d))}`, `答え: ${m(ans.toTex())}`],
    check: { kind: 'identity', expr: tex, vars: ['x'] },
  };
}

function genMono(rng) {
  const form = rng.int(0, 2);
  let tex, ans, wrongs, steps;
  if (form === 0) {
    const d = rng.pick([2, 3, 4, 5]);
    const n = rng.nz(-d * 2, d * 2);
    const fr = F(n, d);
    const k = d * rng.nz(-4, 4);
    if (fr.isInt() || fr.mul(k).isZero()) return genMono(rng);
    tex = `${termTex(fr, X, true)}\\times ${tpar(k)}`;
    ans = Poly.v('x', fr.mul(k));
    wrongs = [{ p: Poly.v('x', fr.mul(k).neg()), msg: '符号を確認！' }, { p: Poly.v('x', F(n * k)), msg: `分母の ${d} で割るのを忘れてない？` }];
    steps = [`数どうしをかける: ${m(`${tnum(fr)}\\times ${tpar(k)}=${tnum(fr.mul(k))}`)}`, `答え: ${m(ans.toTex())}`];
  } else if (form === 1) {
    const k = rng.intEx(-5, 5, [0, 1, -1]);
    const a = rng.nz(-5, 5), b = rng.nz(-5, 5);
    tex = `(${lin(a * k, b * k)})\\div ${tpar(k)}`;
    ans = Poly.lin(a, b);
    wrongs = [{ p: Poly.lin(a, b * k), msg: 'わり算はかっこの中の全部の項に！' }, { p: Poly.lin(-a, -b), msg: '符号を確認！' }];
    steps = [`各項を ${m(tpar(k))} でわる: ${m(`${termTex(F(a * k), X, true)}\\div ${tpar(k)}=${termTex(F(a), X, true)}`)}、${m(`${tpar(b * k)}\\div ${tpar(k)}=${b}`)}`, `答え: ${m(ans.toTex())}`];
  } else {
    const d = rng.pick([2, 3, 4]);
    const t = rng.int(2, 4);
    const a = rng.nz(-5, 5), b = rng.nz(-5, 5);
    tex = `${d * t}\\times \\frac{${lin(a, b)}}{${d}}`;
    ans = Poly.lin(a * t, b * t);
    wrongs = [{ p: Poly.lin(a * t, b), msg: 'かっこ（分子）の全部の項にかけよう！' }, { p: Poly.lin(a * d * t, b * d * t), msg: `分母の ${d} で約分するのを忘れてない？` }];
    steps = [`約分: ${m(`${d * t}\\div ${d}=${t}`)}`, `${m(`${t}(${lin(a, b)})=${ans.toTex()}`)}`];
  }
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...polyChoice(rng, ans, wrongs),
    hint: '数どうしを計算して、文字はそのまま。かっこの中は全部の項に配る。',
    steps,
    check: { kind: 'identity', expr: tex, vars: ['x'] },
  };
}

function genDist(rng) {
  let p, q, a, b, c, d, ans;
  do {
    p = rng.int(2, 5); q = rng.int(2, 5);
    a = rng.nz(-5, 5); b = rng.nz(-6, 6); c = rng.nz(-5, 5); d = rng.nz(-6, 6);
    ans = Poly.lin(p * a - q * c, p * b - q * d);
  } while (p * a - q * c === 0);
  const tex = `${p}(${lin(a, b)})-${q}(${lin(c, d)})`;
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...polyChoice(rng, ans, [
      { p: Poly.lin(p * a - q * c, p * b + q * d), msg: `${m(`-${q}`)} はかっこの中の全部の項にかける！ 後ろの項の符号も変わる。` },
      { p: Poly.lin(p * a - q * c, b - q * d), msg: `${m(String(p))} を後ろの項にもかけよう。` },
      { p: Poly.lin(p * a + q * c, p * b + q * d), msg: '2つ目のかっこの前はマイナス！' },
    ]),
    hint: 'かっこの前の数（符号ごと！）を、中の全部の項にかける。',
    steps: [
      `かっこをはずす: ${m(`${Poly.lin(p * a, p * b).toTex()}${Poly.lin(-q * c, -q * d).toTex().replace(/^(?!-)/, '+')}`)}`,
      `同類項をまとめる: ${m(ans.toTex())}`,
    ],
    check: { kind: 'identity', expr: tex, vars: ['x'] },
  };
}

function genSubst(rng) {
  const k = rng.pick([-1, -1, 1]) * rng.int(1, 4);
  const form = rng.int(0, 2);
  let poly;
  if (form === 0) poly = Poly.of([[rng.nz(-4, 4), { x: 2 }], [rng.nz(-6, 6), X]]);
  else if (form === 1) poly = Poly.of([[rng.nz(-9, 9), {}], [rng.nz(-6, 6), X]]);
  else poly = Poly.of([[rng.nz(-3, 3), { x: 2 }], [rng.nz(-5, 5), X], [rng.nz(-9, 9), {}]]);
  // 表示は「定数が先」もあり
  const tex = form === 1 ? rawTerms([[poly.coef({}).n, {}], [poly.coef(X).n, X]]) : poly.toTex();
  const ans = poly.evaluate({ x: k });
  const a2 = poly.coef({ x: 2 }).n;
  const wrong = [];
  if (a2 && k < 0) wrong.push({ vals: { v: ans.sub(F(2 * a2 * k * k)) }, msg: `${m(`(${k})^{2}=${k * k}`)}（プラス）。負の数はかっこをつけて代入！` });
  wrong.push({ vals: { v: poly.evaluate({ x: -k }) }, msg: '代入する数の符号を確認！ 負の数はかっこごと入れよう。' });
  const subTex = tex.replace(/x/g, `(${k})`);
  // 表示の順に [係数, 次数, 値]
  const order = form === 1 ? [0, 1] : [2, 1, 0];
  const termVals = order.map((e) => [poly.coef(e === 2 ? { x: 2 } : e === 1 ? X : {}).n, e]).filter(([c]) => c !== 0).map(([c, e]) => [c, e, c * k ** e]);
  return {
    stem: `${m(`x=${k}`)} のとき、${m(tex)} の値を求めよ。`,
    ...numAns(ONE, { v: ans }, { wrong }),
    hint: '負の数はかっこをつけて代入する。$-3x$ に $x=-2$ なら $-3\\times (-2)$。',
    steps: [
      `代入（負の数はかっこごと）: ${m(subTex.replace(/(\d)\(/g, '$1\\times ('))}`,
      // 項ごとに計算（2乗が先 → かけ算）→ 最後にたす
      ...termVals.map(([c, e, v]) => (e === 2 ? `${m('x^{2}')} の項: ${m(`${tnum(c)}\\times (${k})^{2}=${tnum(c)}\\times ${k * k}=${v}`)}` : e === 1 ? `${m('x')} の項: ${m(`${tnum(c)}\\times (${k})=${v}`)}` : `数の項: ${m(v)}`)),
      `たす: ${m(`${termVals.map(([, , v], i) => (i && v >= 0 ? `+${v}` : `${v}`)).join('')}=${tnum(ans)}`)}`,
    ],
    check: { kind: 'value', expr: tex, vals: { x: k } },
  };
}

function genFrac(rng) {
  let p, q, a, b, c, d, op, ans;
  do {
    [p, q] = rng.shuffle([2, 3, 4, 5, 6]).slice(0, 2);
    a = rng.int(1, 4); b = rng.nz(-6, 6); c = rng.int(1, 4); d = rng.nz(-6, 6);
    op = rng.pick(['+', '-']);
    const P = Poly.lin(a, b).scale(F(1, p));
    const Q = Poly.lin(c, d).scale(F(1, q));
    ans = op === '+' ? P.add(Q) : P.sub(Q);
  } while (ans.coef(X).isZero() || ans.coef({}).isZero() || ans.denLcm() === 1);
  const L = lcm(p, q);
  const tex = `\\frac{${lin(a, b)}}{${p}}${op}\\frac{${lin(c, d)}}{${q}}`;
  const sgn = op === '+' ? 1 : -1;
  const wrongs = [
    { p: Poly.lin(a * (L / p) + sgn * c * (L / q), b * (L / p) - sgn * d * (L / q)).scale(F(1, L)), msg: 'ひく分数の分子は、かっこごと引く！ 後ろの項の符号も変わる。' },
    { p: Poly.lin(a * (L / p) + sgn * c * (L / q), b + sgn * d).scale(F(1, L)), msg: '通分するとき、分子の全部の項に同じ数をかけよう。' },
    { p: Poly.lin(a + sgn * c, b + sgn * d).scale(F(1, p + q)), msg: '分母どうしは足さない！ 通分してから。' },
  ];
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...polyChoice(rng, ans, wrongs, fracPolyTex),
    hint: `分母を ${L} にそろえて、分子はかっこごと計算。`,
    steps: [
      `通分: ${m(`\\frac{${L / p}(${lin(a, b)})${op}${L / q}(${lin(c, d)})}{${L}}`)}`,
      `分子のかっこをはずす: ${m(`\\frac{${Poly.lin(a * (L / p), b * (L / p)).toTex()}${Poly.lin(sgn * c * (L / q), sgn * d * (L / q)).toTex().replace(/^(?!-)/, '+')}}{${L}}`)}`,
      `まとめて約分: ${m(fracPolyTex(ans))}`,
    ],
    check: { kind: 'identity', expr: tex, vars: ['x'] },
  };
}

export default {
  id: 'expressions',
  stage: 1,
  area: '洗濯場',
  title: '文字式',
  emoji: '🔤',
  prereqs: [],
  tool: 'freeze',
  hintCard: [
    '同類項（$x$ の項どうし、数どうし）をまとめる',
    'かっこの前の数は、符号ごと中の全部の項にかける: $-2(x-3)=-2x+6$',
    '負の数を代入するときはかっこをつける',
    '分数の式は通分 → 分子をかっこごと計算',
  ],
  generators: {
    'ex-like': { difficulty: 1, gen: genLike },
    'ex-mono': { difficulty: 1, gen: genMono },
    'ex-dist': { difficulty: 2, gen: genDist },
    'ex-subst': { difficulty: 1, gen: genSubst },
    'ex-frac': { difficulty: 3, gen: genFrac },
  },
  lessons: [
    {
      id: 'ex-l1',
      title: '同類項をまとめる',
      unlocks: ['ex-like', 'ex-mono'],
      build(rng) {
        let a, b, c, d;
        do { a = rng.nz(-6, 6); b = rng.nz(-9, 9); c = rng.nz(-6, 6); d = rng.nz(-9, 9); } while (a + c === 0 || b + d === 0);
        const tex = rawTerms([[a, X], [b, {}], [c, X], [d, {}]]);
        return [
          { text: '文字式のまとめ方。$x$ の項は $x$ の項どうし、数は数どうしでしかまとめられない。', math: tex },
          { text: `${m('x')} の項だけまとめると？`, q: { ...polyChoice(rng, Poly.v('x', a + c), [{ p: Poly.v('x', a - c), msg: '項は符号ごとセット！' }, { p: Poly.v('x', a + b + c + d), msg: '数の項まで混ぜちゃダメ！' }]), check: { kind: 'identity', expr: rawTerms([[a, X], [c, X]]), vars: ['x'] } } },
          { text: '数の項だけまとめると？', q: { ...numAns(ONE, { v: b + d }), check: { kind: 'value', expr: rawTerms([[b, {}], [d, {}]]) } } },
          { text: 'あわせると答えは？', q: { ...polyChoice(rng, Poly.lin(a + c, b + d), [{ p: Poly.lin(a + b + c + d, 0), msg: '$x$ の項と数の項はまとめられない！' }]), check: { kind: 'identity', expr: tex, vars: ['x'] } } },
        ];
      },
    },
    {
      id: 'ex-l2',
      title: 'かっこをはずす',
      unlocks: ['ex-dist'],
      build(rng) {
        let p, q, a, b, c, d;
        do { p = rng.int(2, 4); q = rng.int(2, 4); a = rng.nz(-4, 4); b = rng.nz(-5, 5); c = rng.nz(-4, 4); d = rng.nz(-5, 5); } while (p * a - q * c === 0);
        const tex = `${p}(${lin(a, b)})-${q}(${lin(c, d)})`;
        const second = Poly.lin(-q * c, -q * d);
        return [
          { text: 'かっこの前の数は、中の「全部の項」に配る（分配法則）。マイナスもセットで！', math: tex },
          { text: `${m(`${p}(${lin(a, b)})`)} をはずすと？`, q: { ...polyChoice(rng, Poly.lin(p * a, p * b), [{ p: Poly.lin(p * a, b), msg: '後ろの項にもかける！' }]), check: { kind: 'identity', expr: `${p}(${lin(a, b)})`, vars: ['x'] } } },
          { text: `${m(`-${q}(${lin(c, d)})`)} をはずすと？（ここが一番ミスるところ）`, q: { ...polyChoice(rng, second, [{ p: Poly.lin(-q * c, q * d), msg: `${m(`-${q}`)} は後ろの項にもかかる。符号が変わる！` }, { p: Poly.lin(q * c, q * d), msg: 'マイナスごとかけよう。' }]), check: { kind: 'identity', expr: `-${q}(${lin(c, d)})`, vars: ['x'] } } },
          { text: '最後に同類項をまとめると？', q: { ...polyChoice(rng, Poly.lin(p * a - q * c, p * b - q * d), [{ p: Poly.lin(p * a - q * c, p * b + q * d), msg: '後ろのかっこの符号をもう一度！' }]), check: { kind: 'identity', expr: tex, vars: ['x'] } } },
        ];
      },
    },
    {
      id: 'ex-l3',
      title: '代入して値を求める',
      unlocks: ['ex-subst'],
      build(rng) {
        const k = -rng.int(2, 4);
        const a = rng.nz(-3, 3), b = rng.nz(-5, 5);
        const poly = Poly.of([[a, { x: 2 }], [b, X]]);
        const tex = poly.toTex();
        return [
          { text: `${m(`x=${k}`)} を代入する。負の数を入れるときは「かっこをつける」のが鉄則。`, math: tex },
          { text: `${m('x^{2}')} に ${m(`x=${k}`)} を入れると？`, q: { ...numAns(ONE, { v: k * k }, { wrong: [{ vals: { v: -k * k }, msg: `${m(`(${k})^{2}`)} はマイナス×マイナスでプラス！` }] }), check: { kind: 'value', expr: `(${k})^{2}` } } },
          { text: `じゃあ ${m(tex)} の値は？`, q: { ...numAns(ONE, { v: poly.evaluate({ x: k }) }), check: { kind: 'value', expr: tex, vals: { x: k } } } },
        ];
      },
    },
    {
      id: 'ex-l4',
      title: '分数の式',
      unlocks: ['ex-frac'],
      build(rng) {
        const p = rng.pick([2, 3]), q = p === 2 ? 3 : 2;
        const L = 6;
        let a, b, c, d;
        do { a = rng.int(1, 3); b = rng.nz(-5, 5); c = rng.int(1, 3); d = rng.nz(-5, 5); } while (a * (L / p) === c * (L / q) || b * (L / p) === d * (L / q));
        const tex = `\\frac{${lin(a, b)}}{${p}}-\\frac{${lin(c, d)}}{${q}}`;
        const ans = Poly.lin(a, b).scale(F(1, p)).sub(Poly.lin(c, d).scale(F(1, q)));
        const num = Poly.lin(a * (L / p) - c * (L / q), b * (L / p) - d * (L / q));
        return [
          { text: '分数の式も、数の分数と同じ。まず通分！', math: tex },
          { text: '分母を何にそろえる？', q: { ...numAns(ONE, { v: L }), check: { kind: 'fn', verify: (v) => v.v === L } } },
          { text: `分子は ${m(`${L / p}(${lin(a, b)})-${L / q}(${lin(c, d)})`)}。かっこをはずしてまとめると？`, q: { ...polyChoice(rng, num, [{ p: Poly.lin(a * (L / p) - c * (L / q), b * (L / p) + d * (L / q)), msg: 'ひく方の分子は、かっこごと引く！' }]), check: { kind: 'identity', expr: `${L / p}(${lin(a, b)})-${L / q}(${lin(c, d)})`, vars: ['x'] } } },
          { text: '答えは？', q: { ...polyChoice(rng, ans, [{ p: num, msg: '分母を忘れてる！' }], fracPolyTex), check: { kind: 'identity', expr: tex, vars: ['x'] } } },
        ];
      },
    },
  ],
};
