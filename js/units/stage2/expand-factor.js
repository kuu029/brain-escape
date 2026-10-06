import { F, gcd } from '../../core/frac.js';
import { tnum } from '../../core/fmt.js';
import { Poly, termTex } from '../../core/poly.js';
import { numAns, choice, polyChoice, ONE, m } from '../kit.js';

const X = Poly.v('x');
const L = (p, q) => Poly.lin(p, q); // px + q
const lt = (p, q) => Poly.lin(p, q).toTex();
const fac = (p, q) => `(${lt(p, q)})`;
const kpre = (k) => (k === 1 ? '' : k === -1 ? '-' : String(k));
const ID = (expr) => ({ kind: 'identity', expr, vars: ['x'] });
const FID = (expr) => ({ kind: 'identity', expr, vars: ['x'], factored: true });

function genExp1(rng) {
  let a, b;
  do { a = rng.nz(-9, 9); b = rng.nz(-9, 9); } while (a + b === 0 && rng.chance(0.7));
  const tex = `${fac(1, a)}${fac(1, b)}`;
  const ans = L(1, a).mul(L(1, b));
  return {
    stem: `展開せよ。 ${m(tex)}`,
    ...polyChoice(rng, ans, [
      { p: Poly.of([[1, { x: 2 }], [a * b, { x: 1 }], [a + b, {}]]), msg: '真ん中は「たした数」、最後は「かけた数」！' },
      { p: Poly.of([[1, { x: 2 }], [a + b, { x: 1 }], [-a * b, {}]]), msg: `最後の項は ${m(`${tnum(a)}\\times ${tnum(b)}`)}。符号に注意！` },
      { p: Poly.of([[1, { x: 2 }], [a * b, {}]]), msg: '真ん中の $x$ の項を忘れてる！' },
    ]),
    hint: '$(x+a)(x+b)=x^{2}+(a+b)x+ab$。たして真ん中、かけて最後。',
    steps: [`たした数: ${m(`${tnum(a)}+(${tnum(b)})=${a + b}`)}`, `かけた数: ${m(`${tnum(a)}\\times (${tnum(b)})=${a * b}`)}`, `${m(ans.toTex())}`],
    check: ID(tex),
  };
}

function genExp2(rng) {
  const form = rng.int(0, 3);
  const p = rng.chance(0.35) ? rng.int(2, 4) : 1;
  const a = rng.nz(-7, 7);
  let tex, ans, wrongs, hint;
  if (form <= 1) {
    tex = `${fac(p, a)}^{2}`;
    ans = L(p, a).pow(2);
    wrongs = [
      { p: Poly.of([[p * p, { x: 2 }], [a * a, {}]]), msg: '真ん中の項（2倍のやつ）が消えてる！ $(a+b)^{2}=a^{2}+2ab+b^{2}$' },
      { p: Poly.of([[p * p, { x: 2 }], [p * a, { x: 1 }], [a * a, {}]]), msg: '真ん中は「2倍」！' },
      { p: Poly.of([[p * p, { x: 2 }], [2 * p * a, { x: 1 }], [-a * a, {}]]), msg: '最後の項は2乗だから必ずプラス。' },
    ];
    hint = '$(a+b)^{2}=a^{2}+2ab+b^{2}$。真ん中の2倍を忘れずに。';
  } else {
    const c = Math.abs(a);
    tex = `${fac(p, c)}${fac(p, -c)}`;
    ans = L(p, c).mul(L(p, -c));
    wrongs = [
      { p: Poly.of([[p * p, { x: 2 }], [c * c, {}]]), msg: '$(a+b)(a-b)=a^{2}-b^{2}$。最後はマイナス！' },
      { p: Poly.of([[p * p, { x: 2 }], [2 * p * c, { x: 1 }], [-c * c, {}]]), msg: '和と差の積は真ん中が消える！' },
      { p: Poly.of([[p, { x: 2 }], [-c * c, {}]]), msg: `${m(`(${p}x)^{2}`)} の計算を確認！` },
    ];
    hint = '$(a+b)(a-b)=a^{2}-b^{2}$（和と差の積）。';
  }
  return { stem: `展開せよ。 ${m(tex)}`, ...polyChoice(rng, ans, wrongs), hint, steps: [`乗法公式を使う → ${m(ans.toTex())}`], check: ID(tex) };
}

function genExp3(rng) {
  const form = rng.int(0, 2);
  let tex, ans, wrongs;
  if (form === 0) {
    const a = rng.nz(-6, 6), b = rng.int(1, 6);
    tex = `${fac(1, a)}^{2}-${fac(1, b)}${fac(1, -b)}`;
    ans = L(1, a).pow(2).sub(L(1, b).mul(L(1, -b)));
    wrongs = [{ p: L(1, a).pow(2).sub(Poly.of([[1, { x: 2 }], [b * b, {}]])), msg: 'うしろの展開結果をかっこに入れてから引く！ $-(x^{2}-b^{2})=-x^{2}+b^{2}$' }];
  } else if (form === 1) {
    const a = rng.nz(-6, 6), b = rng.nz(-6, 6), c = rng.nz(-6, 6);
    tex = `${fac(1, a)}${fac(1, b)}-x(${lt(1, c)})`;
    ans = L(1, a).mul(L(1, b)).sub(X.mul(L(1, c)));
    wrongs = [{ p: L(1, a).mul(L(1, b)).sub(Poly.of([[1, { x: 2 }]])).add(Poly.of([[c, { x: 1 }]])), msg: 'ひくかっこは全部の項の符号を変える！' }];
  } else {
    const a = rng.int(2, 3), b = rng.nz(-5, 5), c = rng.int(1, 3), d = rng.nz(-5, 5);
    tex = `${fac(a, b)}${fac(c, d)}`;
    ans = L(a, b).mul(L(c, d));
    wrongs = [{ p: Poly.of([[a * c, { x: 2 }], [b * d, {}]]), msg: '4つの組み合わせ全部をかける！ 真ん中の項を忘れてる。' }, { p: Poly.of([[a * c, { x: 2 }], [a * d * b * c, { x: 1 }], [b * d, {}]]), msg: '真ん中は $ad+bc$。' }];
  }
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...polyChoice(rng, ans, [...wrongs, { p: ans.neg(), msg: '符号を確認！' }]),
    hint: 'それぞれ展開してから、同類項をまとめる。ひくところはかっこごと！',
    steps: [`展開してまとめる → ${m(ans.toTex())}`],
    check: ID(tex),
  };
}

// 共通因数
function genCommon(rng) {
  let g, p, q;
  do { g = rng.int(2, 6); p = rng.nz(-5, 5); q = rng.nz(-7, 7); } while (gcd(p, q) !== 1 || p < 0 && rng.chance(0.7));
  const withX = rng.chance(0.6);
  const outer = withX ? `${g}x` : String(g);
  const ans = (withX ? Poly.v('x', g) : Poly.c(g)).mul(L(p, q));
  const tex = ans.toTex();
  const correct = `${outer}${fac(p, q)}`;
  const opts = [
    { tex: `${outer}${fac(p, -q)}`, msg: 'かっこの中の符号を確認！ 展開して元に戻るかチェックしよう。' },
    withX ? { tex: `${g}${fac(p, q)}`, msg: '$x$ も共通因数！' } : { tex: `${g}x${fac(p, q)}`, msg: '全部の項に $x$ がある？' },
    { tex: `${outer}${fac(p * g, q)}`, msg: `${g} はくくり出したら中には残らない。` },
  ];
  return {
    stem: `因数分解せよ。 ${m(tex)}`,
    ...choice(rng, correct, opts),
    hint: '全部の項に共通する数・文字をかっこの外へ。',
    steps: [`共通因数は ${m(outer)}`, `${m(`${tex}=${correct}`)}`],
    check: FID(tex),
  };
}

function genFac1(rng) {
  let a, b;
  do { a = rng.nz(-9, 9); b = rng.nz(-9, 9); } while (a === b || a === -b);
  const ans = L(1, a).mul(L(1, b));
  const tex = ans.toTex();
  const correct = `${fac(1, a)}${fac(1, b)}`;
  return {
    stem: `因数分解せよ。 ${m(tex)}`,
    ...choice(rng, correct, [
      { tex: `${fac(1, -a)}${fac(1, -b)}`, msg: '符号が逆！ 展開して確かめよう。' },
      { tex: `${fac(1, a)}${fac(1, -b)}`, msg: 'かけて定数項、たして $x$ の係数になる2数を探そう。' },
      { tex: `${fac(1, -a)}${fac(1, b)}`, msg: 'かけた数の符号を確認！' },
    ]),
    hint: `かけて ${a * b}、たして ${a + b} になる2つの数を探す。`,
    steps: [`かけて ${m(String(a * b))}、たして ${m(String(a + b))} → ${m(`${tnum(a)}\\ と\\ ${tnum(b)}`)}`, `${m(correct)}`],
    check: FID(tex),
  };
}

function genFac2(rng) {
  const form = rng.int(0, 2);
  const p = rng.chance(0.4) ? rng.int(2, 4) : 1;
  const a = rng.int(1, 9) * rng.sign();
  let ans, correct, opts, hint;
  if (form === 0) {
    ans = L(p, a).pow(2);
    correct = `${fac(p, a)}^{2}`;
    opts = [{ tex: `${fac(p, -a)}^{2}`, msg: '真ん中の項の符号を見て、かっこの中の符号を決める。' }, { tex: `${fac(p, a)}${fac(p, -a)}`, msg: 'それを展開すると真ん中が消える。' }, { tex: `${fac(p, 2 * a)}^{2}`, msg: '2乗して最後の数になる数は？' }];
    hint = '$a^{2}+2ab+b^{2}=(a+b)^{2}$。最初と最後が2乗、真ん中が2倍になってるか見る。';
  } else {
    const c = Math.abs(a);
    ans = L(p, c).mul(L(p, -c));
    correct = `${fac(p, c)}${fac(p, -c)}`;
    opts = [{ tex: `${fac(p, -c)}^{2}`, msg: 'それを展開すると真ん中の項が出てくる。' }, { tex: `${fac(p, c)}^{2}`, msg: '$a^{2}-b^{2}=(a+b)(a-b)$！' }, { tex: `${fac(p, c * c)}${fac(p, -1)}`, msg: '2乗して最後の数になる数を探そう。' }];
    hint = '$a^{2}-b^{2}=(a+b)(a-b)$。2乗－2乗の形を見つけたらコレ。';
  }
  const tex = ans.toTex();
  return { stem: `因数分解せよ。 ${m(tex)}`, ...choice(rng, correct, opts), hint, steps: [`公式を使う: ${m(`${tex}=${correct}`)}`], check: FID(tex) };
}

function genFac3(rng) {
  const k = rng.int(2, 5) * (rng.chance(0.2) ? -1 : 1);
  let a, b;
  do { a = rng.nz(-6, 6); b = rng.nz(-6, 6); } while (a === -b || a === b && rng.chance(0.5));
  const ans = L(1, a).mul(L(1, b)).scale(k);
  const tex = ans.toTex();
  const inner = a === b ? `${fac(1, a)}^{2}` : `${fac(1, a)}${fac(1, b)}`;
  const correct = `${kpre(k)}${inner}`;
  return {
    stem: `因数分解せよ。 ${m(tex)}`,
    ...choice(rng, correct, [
      { tex: `${kpre(k)}${a === b ? `${fac(1, -a)}^{2}` : `${fac(1, -a)}${fac(1, -b)}`}`, msg: '符号を確認！' },
      { tex: `${kpre(-k)}${inner}`, msg: 'くくり出した数の符号を確認！' },
      a === 1 || b === 1
        ? { tex: `${kpre(k)}${fac(1, -a * b)}${fac(1, -1)}`, msg: 'かけて・たしての2数をもう一度探そう。' }
        : { tex: `${kpre(k)}${fac(1, a * b)}${fac(1, 1)}`, msg: 'かけて・たしての2数をもう一度探そう。' },
    ]),
    hint: `まず共通因数 ${m(String(k))} でくくる。かっこの中をさらに公式で因数分解。`,
    steps: [`${m(`${tex}=${kpre(k)}(${L(1, a).mul(L(1, b)).toTex()})`)}`, `かっこの中を因数分解: ${m(correct)}`],
    check: FID(tex),
  };
}

function genCalc(rng) {
  const form = rng.int(0, 2);
  let tex, ans, steps;
  if (form === 0) {
    const a = rng.nz(-4, 4), base = rng.pick([10, 20, 30, 50, 100]);
    const n = base + a;
    tex = `${n}^{2}`; ans = n * n;
    steps = [`${m(`(${base}${a > 0 ? '+' : ''}${a})^{2}`)} と考える`, `${m(`${base * base}${2 * base * a > 0 ? '+' : ''}${2 * base * a}+${a * a}=${ans}`)}`];
  } else if (form === 1) {
    const a = rng.int(1, 4), base = rng.pick([20, 30, 50, 100]);
    tex = `${base + a}\\times ${base - a}`; ans = (base + a) * (base - a);
    steps = [`${m(`(${base}+${a})(${base}-${a})=${base}^{2}-${a}^{2}`)}`, `${m(`${base * base}-${a * a}=${ans}`)}`];
  } else {
    const x = rng.int(30, 99), y = x - rng.int(1, 9) * (rng.chance(0.5) ? 1 : 2);
    tex = `${x}^{2}-${y}^{2}`; ans = x * x - y * y;
    steps = [`${m(`(${x}+${y})(${x}-${y})=${x + y}\\times ${x - y}`)}`, `${m(`=${ans}`)}`];
  }
  return {
    stem: `くふうして計算せよ。 ${m(tex)}`,
    ...numAns(ONE, { v: ans }),
    hint: '乗法公式・因数分解の公式が使える形にしてから計算すると速い。',
    steps,
    check: { kind: 'value', expr: tex },
  };
}

export default {
  id: 'expand-factor',
  stage: 2,
  area: '地下通路',
  title: '展開と因数分解',
  emoji: '🧩',
  prereqs: ['polynomials'],
  tool: 'rewind',
  hintCard: [
    '$(x+a)(x+b)=x^{2}+(a+b)x+ab$',
    '$(a+b)^{2}=a^{2}+2ab+b^{2}$、$(a-b)^{2}=a^{2}-2ab+b^{2}$',
    '$(a+b)(a-b)=a^{2}-b^{2}$',
    '因数分解はまず共通因数 → 公式。「かけて定数、たして係数」の2数',
  ],
  generators: {
    'ef-exp1': { difficulty: 1, gen: genExp1 },
    'ef-exp2': { difficulty: 1, gen: genExp2 },
    'ef-exp3': { difficulty: 2, gen: genExp3 },
    'ef-common': { difficulty: 1, gen: genCommon },
    'ef-fac1': { difficulty: 2, gen: genFac1 },
    'ef-fac2': { difficulty: 2, gen: genFac2 },
    'ef-fac3': { difficulty: 3, gen: genFac3 },
    'ef-calc': { difficulty: 2, gen: genCalc },
  },
  lessons: [
    {
      id: 'ef-l1',
      title: '展開の基本',
      unlocks: ['ef-exp1'],
      build(rng) {
        let a, b;
        do { a = rng.nz(-6, 6); b = rng.nz(-6, 6); } while (a + b === 0 || a * b === a + b);
        const tex = `${fac(1, a)}${fac(1, b)}`;
        const four = `x^{2}${termTex(F(b), { x: 1 }, false)}${termTex(F(a), { x: 1 }, false)}${termTex(F(a * b), {}, false)}`;
        return [
          { text: '「展開」＝かっこをはずして足し算の形にすること。かっこ×かっこは、全部の組み合わせをかける（4回）。', math: tex },
          { text: '4つの組み合わせを全部かけると？', q: { ...choice(rng, four, [{ tex: `x^{2}${termTex(F(a * b), {}, false)}`, msg: '4回かけるよ！ $x\\times b$ と $a\\times x$ を忘れずに。' }, { tex: `x^{2}${termTex(F(a + b), { x: 1 }, false)}${termTex(F(a + b), {}, false)}`, msg: '最後は $a\\times b$。' }]), check: ID(tex) } },
          { text: `真ん中の ${m('x')} の項をまとめると、係数は？`, q: { ...numAns(ONE, { v: a + b }), check: { kind: 'fn', verify: (v) => v.v === a + b } } },
          { text: '答えは？（たして真ん中、かけて最後）', q: { ...polyChoice(rng, L(1, a).mul(L(1, b)), [{ p: Poly.of([[1, { x: 2 }], [a * b, { x: 1 }], [a + b, {}]]), msg: '真ん中が「たした数」、最後が「かけた数」！' }]), check: ID(tex) } },
        ];
      },
    },
    {
      id: 'ef-l2',
      title: '乗法公式',
      unlocks: ['ef-exp2', 'ef-exp3', 'ef-calc'],
      build(rng) {
        const a = rng.int(2, 7) * rng.sign(), c = rng.int(2, 7);
        return [
          { text: `2乗の公式。${m(`${fac(1, a)}^{2}`)} は ${m(`${fac(1, a)}${fac(1, a)}`)} のこと。真ん中が「2倍」になる。`, math: '(a+b)^{2}=a^{2}+2ab+b^{2}' },
          { text: `${m(`${fac(1, a)}^{2}`)} を展開すると？`, q: { ...polyChoice(rng, L(1, a).pow(2), [{ p: Poly.of([[1, { x: 2 }], [a * a, {}]]), msg: '真ん中の $2ab$ が消えてる！ これが最多ミス。' }, { p: Poly.of([[1, { x: 2 }], [a, { x: 1 }], [a * a, {}]]), msg: '真ん中は2倍！' }]), check: ID(`${fac(1, a)}^{2}`) } },
          { text: '和と差の積。真ん中が打ち消しあって消える。', math: '(a+b)(a-b)=a^{2}-b^{2}' },
          { text: `${m(`${fac(1, c)}${fac(1, -c)}`)} を展開すると？`, q: { ...polyChoice(rng, L(1, c).mul(L(1, -c)), [{ p: Poly.of([[1, { x: 2 }], [c * c, {}]]), msg: '最後はマイナス！' }, { p: Poly.of([[1, { x: 2 }], [-2 * c, { x: 1 }], [-c * c, {}]]), msg: '真ん中は消える！' }]), check: ID(`${fac(1, c)}${fac(1, -c)}`) } },
          { text: `この公式は計算にも使える。${m(`${100 + c}\\times ${100 - c}=100^{2}-${c}^{2}`)}。いくつ？`, q: { ...numAns(ONE, { v: 10000 - c * c }), check: { kind: 'value', expr: `${100 + c}\\times ${100 - c}` } } },
        ];
      },
    },
    {
      id: 'ef-l3',
      title: '因数分解の基本',
      unlocks: ['ef-common', 'ef-fac1'],
      build(rng) {
        let a, b;
        do { a = rng.nz(-7, 7); b = rng.nz(-7, 7); } while (a === b || a === -b);
        const P = L(1, a).mul(L(1, b));
        const g = rng.int(2, 5), q = rng.nz(-5, 5);
        const C = Poly.v('x', g).mul(L(1, q));
        const pairs = (u, v) => `${u},\\ ${v}`;
        return [
          { text: '因数分解は展開の逆。「かけ算の形」に戻す。まずは共通因数をくくり出す。', math: C.toTex() },
          { text: '全部の項に共通するのは？', q: { ...choice(rng, `${g}x`, [{ tex: String(g), msg: '$x$ も全部の項に入ってる！' }, { tex: 'x', msg: `数の ${g} も共通！` }, { tex: `${g}x^{2}`, msg: `${m(termTex(F(g * q), { x: 1 }, true))} には $x^{2}$ はない。` }]), check: { kind: 'fn', verify: (t) => t === `${g}x` } } },
          { text: '次は公式。$x^{2}+px+q$ は「かけて $q$、たして $p$」になる2数を探す。', math: P.toTex() },
          {
            text: `かけて ${m(String(a * b))}、たして ${m(String(a + b))} になる2数は？`,
            q: { ...choice(rng, pairs(Math.max(a, b), Math.min(a, b)), [{ tex: pairs(-Math.min(a, b), -Math.max(a, b)), msg: 'たすと符号が逆になっちゃう。' }, { tex: pairs(Math.abs(a), Math.abs(b) * (Math.abs(a) === Math.abs(b) ? 1 : -1)) }, a !== 1 && b !== 1 && { tex: pairs(a * b, 1), msg: 'たすと合わない！' }]), check: { kind: 'fn', verify: (t) => { const [u, v] = t.split(',\\ ').map(Number); return u * v === a * b && u + v === a + b; } } },
          },
          { text: '因数分解すると？', q: { ...choice(rng, `${fac(1, a)}${fac(1, b)}`, [{ tex: `${fac(1, -a)}${fac(1, -b)}`, msg: '符号が逆！' }, { tex: `${fac(1, a)}${fac(1, -b)}`, msg: '符号を確認！' }]), check: FID(P.toTex()) } },
        ];
      },
    },
    {
      id: 'ef-l4',
      title: '公式を使う因数分解',
      unlocks: ['ef-fac2', 'ef-fac3'],
      build(rng) {
        const c = rng.int(2, 9), a = rng.int(2, 6) * rng.sign(), k = rng.int(2, 4);
        let u, v;
        do { u = rng.nz(-5, 5); v = rng.nz(-5, 5); } while (u === v || u === -v);
        const K = L(1, u).mul(L(1, v)).scale(k);
        return [
          { text: '「2乗－2乗」を見たら和と差。', math: `x^{2}-${c * c}` },
          { text: '因数分解すると？', q: { ...choice(rng, `${fac(1, c)}${fac(1, -c)}`, [{ tex: `${fac(1, -c)}^{2}`, msg: '展開すると真ん中の項が出ちゃう。' }, { tex: `${fac(1, c * c)}${fac(1, -1)}` }]), check: FID(`x^{2}-${c * c}`) } },
          { text: '最初と最後が2乗、真ん中が2倍なら2乗の公式。', math: L(1, a).pow(2).toTex() },
          { text: '因数分解すると？', q: { ...choice(rng, `${fac(1, a)}^{2}`, [{ tex: `${fac(1, -a)}^{2}`, msg: '真ん中の符号を見よう。' }, { tex: `${fac(1, a)}${fac(1, -a)}`, msg: 'それは $x^{2}-a^{2}$ になる。' }]), check: FID(L(1, a).pow(2).toTex()) } },
          { text: '係数に共通の数があったら、まずくくり出す！', math: K.toTex() },
          { text: '因数分解すると？', q: { ...choice(rng, `${k}${fac(1, u)}${fac(1, v)}`, [{ tex: `${k}${fac(1, -u)}${fac(1, -v)}`, msg: '符号を確認！' }, { tex: `${fac(k, k * u)}${fac(1, -v)}`, msg: '符号をもう一度！' }]), check: FID(K.toTex()) } },
        ];
      },
    },
  ],
};
