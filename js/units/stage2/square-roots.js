import { F, Surd, sqrtSplit, isSquare } from '../../core/frac.js';
import { surdTex, tnum } from '../../core/fmt.js';
import { numAns, choice, ONE, m } from '../kit.js';

const FREE = [2, 3, 5, 6, 7];
const S = (c, n = 1) => Surd.of(c, n);
const ST = (s) => surdTex(s);
const rt = (n) => `\\sqrt{${n}}`;
// c√n をそのまま（簡単にしないで）書く
const rawRoot = (c, n) => (c === 1 ? rt(n) : c === -1 ? `-${rt(n)}` : `${c}${rt(n)}`);
const V = (expr) => ({ kind: 'value', expr });

// 選択肢: 値がちがうものだけ残す
function surdChoice(rng, ans, wrongs) {
  const ws = wrongs.filter((w) => w && w.s && !w.s.eq(ans) && !w.s.isZero()).map((w) => ({ tex: ST(w.s), msg: w.msg }));
  const filler = (r) => {
    const t = ans.add(r.chance(0.5) ? S(r.nz(-2, 2), r.pick(FREE)) : S(r.nz(-3, 3)));
    return t.isZero() ? null : ST(t);
  };
  return choice(rng, ST(ans), ws, filler);
}

function genSimp(rng) {
  const a = rng.int(2, 6), b = rng.pick(FREE);
  const n = a * a * b;
  if (rng.chance(0.75)) {
    return {
      stem: `${m(rt(n))} を ${m('a\\sqrt{b}')} の形にせよ。`,
      ...surdChoice(rng, S(a, b), [
        { s: S(b, a * a === b ? 2 : a), msg: '外に出せるのは「2乗の数」の √ だけ。' },
        { s: S(a * a, b), msg: `${m(rt(a * a))} は ${a}。2乗のまま外に出さない！` },
        { s: S(a + 1, b), msg: `${n} を「2乗の数×残り」に分けよう。` },
      ]),
      hint: `${n} の中の「いちばん大きい2乗の数」を探す。${m(`${n}=${a * a}\\times ${b}`)}`,
      steps: [`${m(`${n}=${a * a}\\times ${b}`)}`, `${m(`${rt(n)}=${rt(a * a)}\\times ${rt(b)}=${a}${rt(b)}`)}`],
      check: V(rt(n)),
    };
  }
  return {
    stem: `${m(`${a}${rt(b)}`)} を ${m('\\sqrt{a}')} の形にせよ。`,
    ...choice(rng, rt(n), [
      { tex: rt(a * b), msg: `外の ${a} は、中に入れると ${a}${m('^{2}')} になる！` },
      { tex: rt(2 * a * b), msg: `${a} を2乗してから中に入れる。` },
      { tex: rt(a * a + b), msg: '中に入れたらかけ算！' },
    ]),
    hint: '外の数は2乗して中へ。$3\\sqrt{2}=\\sqrt{9\\times 2}$',
    steps: [`${m(`${a}${rt(b)}=${rt(`${a * a}\\times ${b}`)}=${rt(n)}`)}`],
    check: V(`${a}${rt(b)}`),
  };
}

function genAddSub(rng) {
  let terms, ans, mm;
  do {
    mm = rng.pick([2, 3, 5, 6]);
    const k = rng.int(2, 3);
    terms = [];
    for (let i = 0; i < k; i++) {
      const c = i === 0 ? rng.int(1, 3) : rng.nz(-3, 3);
      const r = rng.int(1, 4);
      terms.push({ c, n: r * r * mm });
    }
    if (rng.chance(0.3)) terms.push({ c: rng.nz(-2, 2), n: rng.pick(FREE.filter((x) => x !== mm)) });
    ans = terms.reduce((s, t) => s.add(S(t.c, t.n)), new Surd());
  } while (ans.isZero() || new Set(terms.map((t) => t.n)).size < terms.length || terms.every((t) => sqrtSplit(t.n)[0] === 1));
  const tex = terms.map((t, i) => (t.c < 0 ? '-' : i === 0 ? '' : '+') + rawRoot(Math.abs(t.c), t.n)).join('');
  const naive = terms.reduce((s, t) => s.add(S(t.c, sqrtSplit(t.n)[1])), new Surd()); // 簡単にせず係数だけ足す
  const sumUnder = terms.reduce((s, t) => s + t.c * t.n, 0);
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...surdChoice(rng, ans, [
      { s: naive, msg: 'まず1つずつ $a\\sqrt{b}$ の形に直してから！ $\\sqrt{8}=2\\sqrt{2}$ など。' },
      sumUnder > 0 && !isSquare(sumUnder) && { s: S(1, sumUnder), msg: '√ の中どうしは足せない！ $\\sqrt{2}+\\sqrt{3}\\ne\\sqrt{5}$' },
      { s: ans.neg(), msg: '符号を確認！' },
    ]),
    hint: '全部を $a\\sqrt{b}$ の形にしてから、√ の中が同じものどうしをまとめる（文字式の同類項と同じ）。',
    steps: [`簡単にする: ${m(terms.map((t, i) => { const [k, mm2] = sqrtSplit(t.n); return ST(S(t.c * k, mm2)).replace(/^(?!-)/, i ? '+' : ''); }).join(''))}`, `まとめる: ${m(ST(ans))}`],
    check: V(tex),
  };
}

function genMul(rng) {
  const form = rng.int(0, 3);
  let tex, ans, wrongs, steps;
  if (form === 0) {
    let a, b;
    do { a = rng.pick([2, 3, 5, 6, 7, 8, 10, 12]); b = rng.pick([2, 3, 5, 6, 7, 8, 10, 12, 15]); } while (a === b || isSquare(a * b));
    tex = `${rt(a)}\\times ${rt(b)}`;
    ans = S(1, a * b);
    wrongs = [{ s: S(1, a + b), msg: 'かけ算は √ の中どうしをかける。' }, { s: S(a * b), msg: '√ は消えない！ $\\sqrt{a}\\times \\sqrt{b}=\\sqrt{ab}$' }];
    steps = [`${m(`${rt(a)}\\times ${rt(b)}=${rt(a * b)}`)}`, `簡単にする: ${m(ST(ans))}`];
  } else if (form === 1) {
    const b = rng.pick([2, 3, 5, 6]), q = rng.pick([2, 3, 5, 7].filter((x) => x !== b)), t = rng.int(1, 3);
    const a = b * q * t * t;
    tex = `${rt(a)}\\div ${rt(b)}`;
    ans = S(1, q * t * t);
    wrongs = [{ s: S(1, a * b), msg: 'わり算は √ の中どうしをわる。' }, { s: S(F(1, b), a), msg: '$\\sqrt{a}\\div \\sqrt{b}=\\sqrt{\\frac{a}{b}}$' }];
    steps = [`${m(`${rt(a)}\\div ${rt(b)}=\\sqrt{\\frac{${a}}{${b}}}=${rt(a / b)}`)}`, `${m(ST(ans))}`];
  } else if (form === 2) {
    const mm = rng.pick([2, 3, 5, 6, 7]);
    const c = rng.chance(0.6) ? mm * rng.int(1, 3) : rng.int(1, 9);
    tex = `\\frac{${c}}{${rt(mm)}}`;
    ans = S(F(c, mm), mm);
    wrongs = [{ s: S(c, mm), msg: '分子に √ をかけたら、分母にもかける！ 分母は √×√ で整数に。' }, { s: S(F(1, c), mm), msg: '分母の √ を分子へ…ではなく、分母と分子に同じ √ をかける。' }];
    steps = [`分母と分子に ${m(rt(mm))} をかける: ${m(`\\frac{${c}\\times ${rt(mm)}}{${rt(mm)}\\times ${rt(mm)}}=\\frac{${c}${rt(mm)}}{${mm}}`)}`, `約分: ${m(ST(ans))}`];
  } else {
    const a = rng.pick([2, 3, 6]), b = rng.pick([6, 10, 15, 3, 2].filter((x) => x !== a)), c = rng.pick([2, 3, 5].filter((x) => x !== a && x !== b));
    tex = `${rt(a)}\\times ${rt(b)}\\div ${rt(c)}`;
    ans = S(1, a * b).mul(S(F(1, c), c));
    wrongs = [{ s: S(1, a * b * c), msg: 'わり算の部分は分母へ！' }, { s: ans.scale(c), msg: '最後に分母の有理化を確認！' }];
    steps = [`${m(`\\frac{${rt(a)}\\times ${rt(b)}}{${rt(c)}}=\\sqrt{\\frac{${a * b}}{${c}}}`)}`, `${m(ST(ans))}`];
  }
  return {
    stem: `計算せよ。（分母に √ を残さない） ${m(tex)}`,
    ...surdChoice(rng, ans, wrongs),
    hint: '√ どうしのかけ算・わり算は中身どうしで。答えは $a\\sqrt{b}$ の形・分母は有理化。',
    steps,
    check: V(tex),
  };
}

function genExpand(rng) {
  const form = rng.int(0, 2);
  let tex, ans, wrongs;
  const a = rng.pick(FREE);
  if (form === 0) {
    const b = rng.nz(-5, 5);
    tex = `(${rt(a)}${b > 0 ? '+' : '-'}${Math.abs(b)})^{2}`;
    ans = S(a + b * b).add(S(2 * b, a));
    wrongs = [{ s: S(a + b * b), msg: '真ん中の $2ab$ を忘れずに！ $(a+b)^{2}=a^{2}+2ab+b^{2}$' }, { s: S(a + b * b).add(S(b, a)), msg: '真ん中は2倍！' }, { s: S(a - b * b).add(S(2 * b, a)), msg: '$b^{2}$ は必ずプラス。' }];
  } else if (form === 1) {
    const c = rng.pick(FREE.filter((x) => x !== a));
    const big = Math.max(a, c), small = Math.min(a, c);
    tex = `(${rt(big)}+${rt(small)})(${rt(big)}-${rt(small)})`;
    ans = S(big - small);
    wrongs = [{ s: S(big + small), msg: '$(a+b)(a-b)=a^{2}-b^{2}$。最後はひき算！' }, { s: S(big - small).add(S(2, big * small)), msg: '和と差の積は真ん中が消える。' }];
  } else {
    let p, q;
    do { p = rng.nz(-5, 5); q = rng.nz(-5, 5); } while (p + q === 0);
    tex = `(${rt(a)}${p > 0 ? '+' : '-'}${Math.abs(p)})(${rt(a)}${q > 0 ? '+' : '-'}${Math.abs(q)})`;
    ans = S(a + p * q).add(S(p + q, a));
    wrongs = [{ s: S(a + p * q), msg: '真ん中の項を忘れずに。' }, { s: S(a * a + p * q).add(S(p + q, a)), msg: `${m(`${rt(a)}\\times ${rt(a)}=${a}`)}（2乗すると √ が外れる）。` }];
  }
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...surdChoice(rng, ans, wrongs),
    hint: '√ を文字だと思って乗法公式で展開。$\\sqrt{a}\\times \\sqrt{a}=a$',
    steps: [`乗法公式で展開して、${m(`${rt(a)}^{2}=${a}`)} を使う → ${m(ST(ans))}`],
    check: V(tex),
  };
}

function genInt(rng) {
  const form = rng.int(0, 2);
  if (form === 0) {
    let n;
    do n = rng.int(5, 150); while (isSquare(n));
    const k = Math.floor(Math.sqrt(n));
    return {
      stem: `${m(rt(n))} の整数部分を答えよ。（${m(rt(n))} は何と何の間？）`,
      ...numAns(ONE, { v: k }, { wrong: [{ vals: { v: k + 1 }, msg: `${m(`${k + 1}^{2}=${(k + 1) ** 2}`)} は ${n} より大きい！` }] }),
      hint: '2乗して近い数を探す。$\\sqrt{n}$ は、2乗すると $n$ になる数。',
      steps: [`${m(`${k}^{2}=${k * k}`)}、${m(`${k + 1}^{2}=${(k + 1) ** 2}`)}`, `${m(`${k}<${rt(n)}<${k + 1}`)} → 整数部分は ${k}`],
      check: { kind: 'fn', verify: (v) => v.v <= Math.sqrt(n) && Math.sqrt(n) < v.v + 1 },
    };
  }
  if (form === 1) {
    const lo = rng.int(2, 6), hi = lo + rng.int(2, 4);
    const A = lo * lo + rng.int(1, 2 * lo), B = hi * hi + rng.int(1, 2 * hi);
    let cnt = 0;
    for (let k = 1; k * k < B + 1; k++) if (k * k > A && k * k < B) cnt++;
    return {
      stem: `${m(`${rt(A)}<n<${rt(B)}`)} をみたす自然数 ${m('n')} は何個？`,
      ...numAns(ONE, { v: cnt }),
      hint: '全部2乗すると比べやすい: $A<n^{2}<B$。',
      steps: [`2乗して ${m(`${A}<n^{2}<${B}`)}`, `${m('n^{2}')} がこの範囲に入る ${m('n')} を数える → ${cnt} 個`],
      check: { kind: 'fn', verify: (v) => { let c = 0; for (let k = 1; k < 100; k++) if (Math.sqrt(A) < k && k < Math.sqrt(B)) c++; return v.v === c; } },
    };
  }
  const sq = rng.int(1, 4), fr = rng.pick([2, 3, 5, 6, 7, 10]);
  const N = sq * sq * fr;
  return {
    stem: `${m(`\\sqrt{${N}n}`)} が自然数になるような、いちばん小さい自然数 ${m('n')} を求めよ。`,
    ...numAns(ONE, { v: fr }, { wrong: [{ vals: { v: N }, msg: `${N} を素因数分解して、2乗にならず残る部分を見つけよう。` }] }),
    hint: '√ の中が「何かの2乗」になればいい。素因数分解して、ペアにならない数をかける。',
    steps: [`${m(`${N}=${sq > 1 ? `${sq}^{2}\\times ` : ''}${fr}`)}`, `${m(fr)} をかければ2乗になる → ${m(`n=${fr}`)}`],
    check: { kind: 'fn', verify: (v) => Number.isInteger(Math.sqrt(N * v.v)) && [...Array(v.v - 1)].every((_, i) => !Number.isInteger(Math.sqrt(N * (i + 1)))) },
  };
}

function genMixed(rng) {
  const mm = rng.pick([2, 3, 5, 6]);
  const k = rng.int(2, 4), c = rng.int(1, 3) * mm, sgn = rng.sign();
  const tex = `${rt(k * k * mm)}${sgn > 0 ? '+' : '-'}\\frac{${c}}{${rt(mm)}}`;
  const ans = S(k, mm).add(S(F(sgn * c, mm), mm));
  if (ans.isZero()) return genMixed(rng);
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...surdChoice(rng, ans, [{ s: S(k, mm).add(S(sgn * c, mm)), msg: '有理化したら分母で割るのを忘れずに！' }, { s: S(1, k * k * mm).add(S(sgn * c, 1)), msg: '分母の有理化をしてから足そう。' }, { s: ans.neg() }]),
    hint: '1つ目は $a\\sqrt{b}$ に、2つ目は分母を有理化。そのあと同類項をまとめる。',
    steps: [`${m(`${rt(k * k * mm)}=${k}${rt(mm)}`)}`, `${m(`\\frac{${c}}{${rt(mm)}}=${ST(S(F(c, mm), mm))}`)}`, `まとめる: ${m(ST(ans))}`],
    check: V(tex),
  };
}

export default {
  id: 'square-roots',
  stage: 2,
  area: '下水道',
  title: '平方根',
  emoji: '√',
  prereqs: ['signed-numbers', 'fractions-decimals'],
  tool: 'wall',
  hintCard: [
    '$\\sqrt{a}\\times \\sqrt{b}=\\sqrt{ab}$、$\\sqrt{a}\\div \\sqrt{b}=\\sqrt{\\frac{a}{b}}$',
    '$\\sqrt{12}=\\sqrt{4\\times 3}=2\\sqrt{3}$（2乗の数を外へ）',
    'たし算・ひき算は √ の中が同じものだけまとめる',
    '有理化: $\\frac{6}{\\sqrt{3}}=\\frac{6\\sqrt{3}}{3}=2\\sqrt{3}$',
  ],
  generators: {
    'sr-simp': { difficulty: 1, gen: genSimp },
    'sr-int': { difficulty: 2, gen: genInt },
    'sr-addsub': { difficulty: 2, gen: genAddSub },
    'sr-mul': { difficulty: 2, gen: genMul },
    'sr-expand': { difficulty: 3, gen: genExpand },
    'sr-mixed': { difficulty: 3, gen: genMixed },
  },
  lessons: [
    {
      id: 'sr-l1',
      title: '平方根と $a\\sqrt{b}$',
      unlocks: ['sr-simp', 'sr-int'],
      build(rng) {
        const a = rng.int(2, 5), b = rng.pick(FREE);
        const n = a * a * b;
        const sq = rng.int(4, 12);
        return [
          { text: `${m(rt(sq * sq))} は「2乗すると ${sq * sq} になる正の数」。`, math: rt(sq * sq) },
          { text: `${m(rt(sq * sq))} はいくつ？`, q: { ...numAns(ONE, { v: sq }), check: V(rt(sq * sq)) } },
          { text: '√ の中に「2乗の数」がかくれていたら外に出せる。', math: rt(n) },
          { text: `${n} の中にかくれている、いちばん大きい2乗の数は？`, q: { ...numAns(ONE, { v: a * a }), check: { kind: 'fn', verify: (v) => isSquare(v.v) && n % v.v === 0 && sqrtSplit(n / v.v)[0] === 1 } } },
          { text: `${m(`${rt(n)}=${rt(`${a * a}\\times ${b}`)}`)}。外に出すと？`, q: { ...surdChoice(rng, S(a, b), [{ s: S(a * a, b), msg: `${m(rt(a * a))} は ${a}！` }, { s: S(b, a), msg: '外に出るのは2乗の数の √。' }]), check: V(rt(n)) } },
        ];
      },
    },
    {
      id: 'sr-l2',
      title: 'たし算・ひき算',
      unlocks: ['sr-addsub'],
      build(rng) {
        const mm = rng.pick([2, 3, 5]);
        const p = rng.int(2, 3), q = rng.int(2, 4);
        const c = rng.int(1, 3);
        const tex = `${rt(p * p * mm)}+${rt(q * q * mm)}-${rawRoot(c, mm)}`;
        const ans = S(p + q - c, mm);
        return [
          { text: '√ のたし算は「文字式の同類項」と同じ。$\\sqrt{2}$ を $x$ だと思えば $2x+3x=5x$。でも中が違うとまとめられない。', math: tex },
          { text: `${m(rt(p * p * mm))} を ${m('a\\sqrt{b}')} にすると？`, q: { ...surdChoice(rng, S(p, mm), [{ s: S(p * p, mm) }, { s: S(mm, p * p === mm ? 2 : p) }]), check: V(rt(p * p * mm)) } },
          { text: `${m(rt(q * q * mm))} も同じように直すと？`, q: { ...surdChoice(rng, S(q, mm), [{ s: S(q * q, mm) }, { s: S(q + 1, mm) }]), check: V(rt(q * q * mm)) } },
          { text: '全部まとめると？', q: { ...surdChoice(rng, ans, [{ s: S(1, p * p * mm + q * q * mm).sub(S(c, mm)), msg: '√ の中どうしは足せない！' }, { s: S(p + q + c, mm), msg: '最後はひき算！' }]), check: V(tex) } },
        ];
      },
    },
    {
      id: 'sr-l3',
      title: 'かけ算・わり算と有理化',
      unlocks: ['sr-mul', 'sr-mixed'],
      build(rng) {
        const a = rng.pick([2, 3, 6]), b = rng.pick([6, 10, 15].filter((x) => x !== a));
        const mm = rng.pick([2, 3, 5]), c = mm * rng.int(1, 3);
        return [
          { text: 'かけ算は中身どうしをかけて、最後に簡単にする。', math: `${rt(a)}\\times ${rt(b)}` },
          { text: '答えは？', q: { ...surdChoice(rng, S(1, a * b), [{ s: S(1, a + b), msg: 'かけ算！' }]), check: V(`${rt(a)}\\times ${rt(b)}`) } },
          { text: '分母に √ があるときは「有理化」。分母と分子に同じ √ をかける。', math: `\\frac{${c}}{${rt(mm)}}` },
          { text: '分母と分子に何をかける？', q: { ...choice(rng, rt(mm), [{ tex: String(mm), msg: '√ をかけると、分母が $\\sqrt{a}\\times \\sqrt{a}=a$ になる。' }, { tex: rt(c) }]), check: { kind: 'fn', verify: (t) => t === rt(mm) } } },
          { text: '有理化した答えは？', q: { ...surdChoice(rng, S(F(c, mm), mm), [{ s: S(c, mm), msg: '分母の $' + mm + '$ で割ろう！' }]), check: V(`\\frac{${c}}{${rt(mm)}}`) } },
        ];
      },
    },
    {
      id: 'sr-l4',
      title: '√ をふくむ式の展開',
      unlocks: ['sr-expand'],
      build(rng) {
        const a = rng.pick(FREE), b = rng.int(1, 4);
        const tex = `(${rt(a)}+${b})^{2}`;
        return [
          { text: '√ をひとかたまりの文字だと思って、乗法公式で展開する。', math: tex },
          { text: `${m(`(${rt(a)})^{2}`)} はいくつ？`, q: { ...numAns(ONE, { v: a }), check: V(`(${rt(a)})^{2}`) } },
          { text: `真ん中の項 ${m(`2\\times ${rt(a)}\\times ${b}`)} は？`, q: { ...surdChoice(rng, S(2 * b, a), [{ s: S(b, a), msg: '2倍！' }, { s: S(2 * b) }]), check: V(`2\\times ${rt(a)}\\times ${b}`) } },
          { text: '全部あわせると？', q: { ...surdChoice(rng, S(a + b * b).add(S(2 * b, a)), [{ s: S(a + b * b), msg: '真ん中を忘れずに！' }]), check: V(tex) } },
        ];
      },
    },
  ],
};
