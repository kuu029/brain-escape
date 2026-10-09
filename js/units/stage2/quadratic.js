import { F, gcd, sqrtSplit, isSquare } from '../../core/frac.js';
import { tnum, tpar } from '../../core/fmt.js';
import { Poly } from '../../core/poly.js';
import { numAns, choice, ONE, m } from '../kit.js';

const L = (p, q) => Poly.lin(p, q);
const lt = (p, q) => Poly.lin(p, q).toTex();
const fac = (p, q) => `(${lt(p, q)})`;
const R2 = [['x1', 'x'], ['x2', 'x']];
const roots2 = (r1, r2, wrong = []) => numAns(R2, { x1: r1, x2: r2 }, { unordered: true, wrong });
const flipMsg = (r) => `${m(`x${r < 0 ? '+' : '-'}${Math.abs(r)}=0`)} なら ${m(`x=${r}`)}。かっこの中の数の符号を反対にしたものが解！`;

// (-b ± √D) / (2a) を簡単にした解の表記。D が平方数なら有理数の解を「x=r1,\ r2」で
export function rootsTex(a, b, D) {
  if (D < 0) return null;
  if (isSquare(D)) {
    const s = Math.sqrt(D);
    const r1 = F(-b + s, 2 * a), r2 = F(-b - s, 2 * a);
    return r1.eq(r2) ? `x=${tnum(r1)}` : `x=${tnum(r1)},\\ ${tnum(r2)}`;
  }
  const [k, mm] = sqrtSplit(D);
  let p = -b, q = k, d = 2 * a;
  if (d < 0) { p = -p; d = -d; }
  const g = gcd(gcd(p, q), d) || 1;
  p /= g; q /= g; d /= g;
  const root = `${q === 1 ? '' : q}\\sqrt{${mm}}`;
  if (d === 1) return `x=${p === 0 ? '' : p}\\pm${root}`;
  if (p === 0) return `x=\\pm\\frac{${root}}{${d}}`;
  return `x=\\frac{${p}\\pm${root}}{${d}}`;
}
const eq0 = (P) => `${P.toTex()}=0`;

function genSq(rng) {
  const form = rng.int(0, 2);
  const k = rng.int(1, 9);
  if (form === 0) {
    const a = rng.int(1, 5);
    const tex = a === 1 ? `x^{2}=${k * k}` : `${a}x^{2}=${a * k * k}`;
    return {
      stem: `方程式を解け。 ${m(tex)}`,
      ...roots2(k, -k),
      hint: '$x^{2}=k$ なら $x=\\pm\\sqrt{k}$。解は2つ（プラスとマイナス）！',
      steps: [...(a > 1 ? [`両辺を ${a} でわる: ${m(`x^{2}=${k * k}`)}`] : []), `${m(`x=\\pm${k}`)}`],
      check: { kind: 'roots', eq: tex },
    };
  }
  if (form === 1) {
    const tex = `x^{2}-${k * k}=0`;
    return { stem: `方程式を解け。 ${m(tex)}`, ...roots2(k, -k), hint: '移項して $x^{2}=○$ の形に。', steps: [`${m(`x^{2}=${k * k}`)}`, `${m(`x=\\pm${k}`)}`], check: { kind: 'roots', eq: tex } };
  }
  const p = rng.nz(-6, 6);
  const tex = `${fac(1, p)}^{2}=${k * k}`;
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...roots2(-p + k, -p - k, [{ vals: { x1: p + k, x2: p - k }, msg: `${m(`x${p > 0 ? '+' : ''}${p}=\\pm${k}`)} → ${m('x')} は移項して符号チェンジ！` }]),
    hint: 'かっこの中をひとかたまりと見て、$(○)^{2}=k$ → $○=\\pm\\sqrt{k}$。',
    steps: [`${m(`${lt(1, p)}=\\pm${k}`)}`, `${m(`x=${-p}\\pm${k}`)} → ${m(`x=${-p + k},\\ ${-p - k}`)}`],
    check: { kind: 'roots', eq: tex },
  };
}

function genSq2(rng) {
  let n;
  do n = rng.int(2, 50); while (isSquare(n));
  const [k, mm] = sqrtSplit(n);
  const root = `${k === 1 ? '' : k}\\sqrt{${mm}}`;
  const p = rng.chance(0.6) ? rng.nz(-6, 6) : 0;
  const tex = p === 0 ? `x^{2}=${n}` : `${fac(1, p)}^{2}=${n}`;
  const correct = `x=${p === 0 ? '' : -p}\\pm${root}`;
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...choice(rng, correct, [
      { tex: `x=${p === 0 ? '' : -p}+${root}`.replace('=+', '='), msg: '解は2つ！ $\\pm$（プラスマイナス）を忘れずに。' },
      p !== 0 && { tex: `x=${p}\\pm${root}`, msg: '移項すると符号が変わる！' },
      { tex: `x=${p === 0 ? '' : -p}\\pm${n}`, msg: '$x^{2}=k$ なら $x=\\pm\\sqrt{k}$。√ を忘れてる！' },
      p === 0 && { tex: `x=\\pm${k * 2 === n ? 3 : 2}\\sqrt{${n}}`, msg: '√ の中を簡単にするときは「2乗の数」を外へ。' },
    ]),
    hint: '$(○)^{2}=k$ → $○=\\pm\\sqrt{k}$。√ の中はできるだけ簡単に。',
    steps: [`${m(`${p === 0 ? 'x' : lt(1, p)}=\\pm${k > 1 ? `\\sqrt{${n}}=\\pm${root}` : root}`)}`, ...(p ? [`移項: ${m(correct)}`] : [])],
    check: { kind: 'roots', eq: tex },
  };
}

function genFac(rng) {
  let r1, r2;
  do { r1 = rng.int(-9, 9); r2 = rng.int(-9, 9); } while (r1 === r2 || (r1 === 0 && r2 === 0) || r1 === -r2 && rng.chance(0.6));
  const P = L(1, -r1).mul(L(1, -r2));
  const tex = eq0(P);
  const factored = r1 === 0 || r2 === 0 ? `x${fac(1, -(r1 || r2))}=0` : `${fac(1, -r1)}${fac(1, -r2)}=0`;
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...roots2(r1, r2, [{ vals: { x1: -r1, x2: -r2 }, msg: flipMsg(r1 || r2) }]),
    hint: '左辺を因数分解 → 「かけて0なら、どちらかが0」。',
    steps: [`因数分解: ${m(factored)}`, `${m(`A\\times B=0`)} なら ${m('A=0')} または ${m('B=0')}`, `${m(`x=${r1},\\ ${r2}`)}`],
    check: { kind: 'roots', eq: tex },
  };
}

function genFac2(rng) {
  const form = rng.int(0, 2);
  if (form === 0) {
    const r = rng.nz(-8, 8);
    const tex = eq0(L(1, -r).pow(2));
    return {
      stem: `方程式を解け。 ${m(tex)}`,
      ...numAns([['x', 'x']], { x: r }, { wrong: [{ vals: { x: -r }, msg: flipMsg(r) }] }),
      hint: '2乗の公式で因数分解。解は1つだけになる（重解）。',
      steps: [`${m(`${fac(1, -r)}^{2}=0`)}`, `${m(`x=${r}`)}（解は1つ）`],
      check: { kind: 'roots', eq: tex },
    };
  }
  if (form === 1) {
    const k = rng.int(2, 4);
    let r1, r2;
    do { r1 = rng.nz(-6, 6); r2 = rng.nz(-6, 6); } while (r1 === r2);
    const tex = eq0(L(1, -r1).mul(L(1, -r2)).scale(k));
    return {
      stem: `方程式を解け。 ${m(tex)}`,
      ...roots2(r1, r2, [{ vals: { x1: -r1, x2: -r2 }, msg: flipMsg(r1) }]),
      hint: `まず両辺を ${k} でわる。`,
      steps: [`両辺を ${k} でわる: ${m(eq0(L(1, -r1).mul(L(1, -r2))))}`, `因数分解: ${m(`${fac(1, -r1)}${fac(1, -r2)}=0`)}`, `${m(`x=${r1},\\ ${r2}`)}`],
      check: { kind: 'roots', eq: tex },
    };
  }
  // (x+a)(x+b)=c の形 → 展開して整理
  let a, b, r1, r2, c;
  do {
    r1 = rng.nz(-7, 7); r2 = rng.nz(-7, 7); a = rng.nz(-5, 5);
    // (x+a)(x+b) - c = (x-r1)(x-r2) となる b, c を探す: x の係数 a+b = -(r1+r2)
    b = -(r1 + r2) - a;
    c = a * b - r1 * r2;
  } while (r1 === r2 || c === 0 || b === 0);
  const tex = `${fac(1, a)}${fac(1, b)}=${c}`;
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...roots2(r1, r2),
    hint: 'このままじゃ使えない！ 右辺を0にしてから因数分解。「かけて0」でないと「どちらかが0」は言えない。',
    steps: [`展開: ${m(`${L(1, a).mul(L(1, b)).toTex()}=${c}`)}`, `移項: ${m(eq0(L(1, -r1).mul(L(1, -r2))))}`, `因数分解して ${m(`x=${r1},\\ ${r2}`)}`],
    check: { kind: 'roots', eq: tex },
  };
}

function genFormula(rng) {
  let a, b, c, D;
  do { a = rng.int(1, 3); b = rng.nz(-9, 9); c = rng.nz(-9, 9); D = b * b - 4 * a * c; } while (D <= 0 || isSquare(D) || D > 120);
  const P = Poly.of([[a, { x: 2 }], [b, { x: 1 }], [c, {}]]);
  const tex = eq0(P);
  const correct = rootsTex(a, b, D);
  const D2 = b * b + 4 * a * c;
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...choice(rng, correct, [
      { tex: rootsTex(a, -b, D), msg: '解の公式は $-b$ から！ $b$ の符号を反対に。' },
      a > 1 && { tex: rootsTex(a / 2, b, D), msg: '分母は $2a$。' },
      D2 > 0 && D2 !== D && { tex: rootsTex(a, b, D2), msg: '√ の中は $b^{2}-4ac$。$c$ の符号に注意！' },
      { tex: correct.replace('\\pm', '+'), msg: '解は2つ！ $\\pm$ を忘れずに。' },
    ]),
    hint: `$x=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}$。${m(`a=${a},\\ b=${b},\\ c=${c}`)}`,
    steps: [`${m(`a=${a},\\ b=${b},\\ c=${c}`)}`, `${m(`b^{2}-4ac=${tpar(b)}^{2}-4\\times ${a}\\times ${tpar(c)}=${D}`)}`, `${m(`x=\\frac{${-b}\\pm\\sqrt{${D}}}{${2 * a}}`)}`, `簡単にして ${m(correct)}`],
    check: { kind: 'roots', eq: tex },
  };
}

// 解の公式で、√ がはずれる（判別式が平方数の）ときの解き方
function formulaRSteps(P) {
  const a = P.coef({ x: 2 }).n, b = P.coef({ x: 1 }).n, c = P.coef({}).n;
  const D = b * b - 4 * a * c, k = Math.round(Math.sqrt(D));
  const x1 = F(-b + k, 2 * a), x2 = F(-b - k, 2 * a);
  return [
    `${m(`a=${a},\\ b=${b},\\ c=${c}`)} を ${m('x=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}')} に入れる`,
    `√ の中: ${m(`${tpar(b)}^{2}-4\\times ${a}\\times ${tpar(c)}=${b * b}${-4 * a * c < 0 ? '' : '+'}${-4 * a * c}=${D}`)}`,
    `${m(`${D}=${k}^{2}`)}（平方数）なので √ がはずれる: ${m(`x=\\frac{${-b}\\pm${k}}{${2 * a}}`)}`,
    `＋のほう: ${m(`\\frac{${-b}+${k}}{${2 * a}}=\\frac{${-b + k}}{${2 * a}}=${tnum(x1)}`)}`,
    `－のほう: ${m(`\\frac{${-b}-${k}}{${2 * a}}=\\frac{${-b - k}}{${2 * a}}=${tnum(x2)}`)}`,
  ];
}

function genFormulaR(rng) {
  // 有理数の解 (p1 x + q1)(p2 x + q2) = 0、a ≥ 2
  let p1, q1, p2, q2;
  do { p1 = rng.int(2, 3); q1 = rng.nz(-5, 5); p2 = rng.int(1, 2); q2 = rng.nz(-5, 5); } while (gcd(p1, q1) !== 1 || gcd(p2, q2) !== 1 || p1 * q2 === p2 * q1);
  const P = L(p1, q1).mul(L(p2, q2));
  const tex = eq0(P);
  const r1 = F(-q1, p1), r2 = F(-q2, p2);
  return {
    stem: `方程式を解け。（分数は「分数」キーで、下→上の順に入力） ${m(tex)}`,
    ...roots2(r1, r2, [{ vals: { x1: r1.neg(), x2: r2.neg() }, msg: '符号を確認！ $-b$ から始まる。' }]),
    hint: '解の公式を使う。√ の中が平方数なら、√ が外れて分数の解になる。',
    steps: formulaRSteps(P),
    check: { kind: 'roots', eq: tex },
  };
}

function genComplete(rng) {
  let p, q, D;
  do { p = rng.nz(-5, 5); q = rng.nz(-12, 12); D = p * p - q; } while (D <= 0 || isSquare(D));
  const P = Poly.of([[1, { x: 2 }], [2 * p, { x: 1 }], [q, {}]]);
  const tex = eq0(P);
  const correct = rootsTex(1, 2 * p, 4 * D);
  return {
    stem: `方程式を解け。 ${m(tex)}`,
    ...choice(rng, correct, [
      { tex: rootsTex(1, -2 * p, 4 * D), msg: '符号を確認！ $(x+p)^{2}$ なら $x=-p\\pm\\cdots$' },
      p * p + q > 0 && !isSquare(p * p + q) && { tex: rootsTex(1, 2 * p, 4 * (p * p + q)), msg: '定数項は右辺へ移項すると符号が変わる。' },
      { tex: correct.replace('\\pm', '+'), msg: '解は2つ！' },
    ]),
    hint: `$x$ の係数 ${2 * p} の半分の2乗（${p * p}）を両辺にたして、${m(`(x${p > 0 ? '+' : ''}${p})^{2}=○`)} の形に。`,
    steps: [
      `定数を移項: ${m(`${Poly.of([[1, { x: 2 }], [2 * p, { x: 1 }]]).toTex()}=${-q}`)}`,
      `両辺に ${m(`${p * p}`)} をたす: ${m(`${fac(1, p)}^{2}=${D}`)}`,
      `${m(`${lt(1, p)}=\\pm\\sqrt{${D}}`)} → ${m(correct)}`,
    ],
    check: { kind: 'roots', eq: tex },
  };
}

function genWord(rng) {
  const t = rng.int(0, 2);
  if (t === 0) {
    const n = rng.int(3, 15), N = n * (n + 1);
    return {
      stem: `連続する2つの正の整数がある。かけると ${N}。小さいほうの数は？`,
      ...numAns([{ key: 'n', label: 'n', text: '', suffix: '' }], { n }, { wrong: [{ vals: { n: -n - 1 }, msg: '「正の整数」だから、負の解は答えにならない！（解の吟味）' }, { vals: { n: n + 1 }, msg: '小さいほうだよ！' }] }),
      hint: '小さいほうを $x$ とすると、大きいほうは $x+1$。',
      steps: [`${m(`x(x+1)=${N}`)}`, `${m(`x^{2}+x-${N}=0`)} → ${m(`${fac(1, n + 1)}${fac(1, -n)}=0`)}`, `${m(`x=${n},\\ ${-n - 1}`)}`, `正の整数なので ${m(`x=${n}`)}（${m(String(-n - 1))} は問題に合わない）`],
      check: { kind: 'fn', verify: (v) => v.n > 0 && Number.isInteger(v.n) && v.n * (v.n + 1) === N },
    };
  }
  if (t === 1) {
    let a, b, x, S;
    do { a = rng.int(1, 5); b = rng.int(1, 6); x = rng.int(a + 2, 15); S = (x - a) * (x + b); } while (a === b);
    return {
      stem: `正方形の独房がある。縦を ${a} m 短く、横を ${b} m 長くした長方形の面積は ${S} m${m('^{2}')}。もとの正方形の1辺は何 m？`,
      ...numAns([{ key: 'x', label: 'x', text: '', suffix: 'm' }], { x }),
      hint: '1辺を $x$ m とすると、縦 $x-' + a + '$、横 $x+' + b + '$。',
      steps: [`${m(`${fac(1, -a)}${fac(1, b)}=${S}`)}`, `展開して整理: ${m(eq0(L(1, -a).mul(L(1, b)).sub(Poly.c(S))))}`, `解くと ${m(`x=${x}`)} と負の解。${m(`x>${a}`)} なので ${m(`x=${x}`)}`],
      check: { kind: 'fn', verify: (v) => v.x > a && (v.x - a) * (v.x + b) === S },
    };
  }
  let Lh, W, x, S;
  do { Lh = rng.int(8, 30); W = rng.int(6, 25); x = rng.int(1, 4); S = (Lh - x) * (W - x); } while (Lh === W);
  return {
    stem: `縦 ${Lh} m、横 ${W} m の長方形の中庭に、同じ幅の道を縦と横に1本ずつ通したら、残りの面積が ${S} m${m('^{2}')} になった。道の幅は何 m？`,
    ...numAns([{ key: 'x', label: 'x', text: '', suffix: 'm' }], { x }),
    hint: '道を端に寄せて考えると、残りは縦 $' + Lh + '-x$、横 $' + W + '-x$ の長方形。',
    steps: [`${m(`(${Lh}-x)(${W}-x)=${S}`)}`, `${m(eq0(L(-1, Lh).mul(L(-1, W)).sub(Poly.c(S))))}`, `解は ${m(`x=${x}`)} と ${m(`x=${Lh + W - x}`)}。道幅は ${m(`${Math.min(Lh, W)}`)} m より小さいので ${m(`x=${x}`)}`],
    check: { kind: 'fn', verify: (v) => v.x > 0 && v.x < Math.min(Lh, W) && (Lh - v.x) * (W - v.x) === S },
  };
}

function genParam(rng) {
  let r, s;
  do { r = rng.nz(-6, 6); s = rng.nz(-6, 6); } while (r === s);
  const b = r * s, a = -(r + s);
  const tex = `x^{2}+ax${b > 0 ? '+' : ''}${b}=0`;
  return {
    stem: `${m('x')} の2次方程式 ${m(tex)} の解の1つが ${m(String(r))} のとき、${m('a')} の値ともう1つの解を求めよ。`,
    ...numAns([{ key: 'a', label: 'a', text: `${m('a')} =` }, { key: 'o', label: 'x', text: 'もう1つの解' }], { a, o: s }, { wrong: [{ vals: { a: -a, o: s }, msg: '代入した式の移項で符号を確認！' }] }),
    hint: `まず ${m(`x=${r}`)} を代入して ${m('a')} を求める。`,
    steps: [`${m(`x=${r}`)} を代入: ${m(`${tpar(r)}^{2}+${tpar(r)}a${b > 0 ? '+' : ''}${b}=0`)} → ${m(`a=${a}`)}`, `${m(eq0(Poly.of([[1, { x: 2 }], [a, { x: 1 }], [b, {}]])))} を解くと ${m(`x=${r},\\ ${s}`)}`, `もう1つの解は ${m(String(s))}`],
    check: { kind: 'fn', verify: (v) => r * r + v.a * r + b === 0 && v.o * v.o + v.a * v.o + b === 0 && v.o !== r },
  };
}

export default {
  id: 'quadratic',
  stage: 2,
  area: '監視塔',
  title: '二次方程式',
  emoji: '🗼',
  prereqs: ['expand-factor', 'square-roots'],
  tool: 'mega',
  hintCard: [
    '$x^{2}=k$ → $x=\\pm\\sqrt{k}$（解は2つ）',
    '因数分解できたら「かけて0 → どちらかが0」',
    '平方完成: $x$ の係数の半分の2乗を両辺にたす',
    '解の公式: $x=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}$',
    '文章題は最後に「解の吟味」（問題に合わない解を捨てる）',
  ],
  generators: {
    'qu-sq': { difficulty: 1, gen: genSq },
    'qu-sq2': { difficulty: 2, gen: genSq2 },
    'qu-fac': { difficulty: 1, gen: genFac },
    'qu-fac2': { difficulty: 2, gen: genFac2 },
    'qu-complete': { difficulty: 3, gen: genComplete },
    'qu-formula': { difficulty: 2, gen: genFormula },
    'qu-formula-r': { difficulty: 3, gen: genFormulaR },
    'qu-word': { difficulty: 3, gen: genWord },
    'qu-param': { difficulty: 3, gen: genParam },
  },
  lessons: [
    {
      id: 'qu-l1',
      title: '平方根を使って解く',
      unlocks: ['qu-sq', 'qu-sq2'],
      build(rng) {
        const k = rng.int(2, 9), p = rng.nz(-5, 5), n = rng.pick([3, 5, 6, 7]);
        const tex = `${fac(1, p)}^{2}=${k * k}`;
        return [
          { text: '2乗が入った方程式＝二次方程式。いちばんシンプルな形は $x^{2}=k$。2乗して $k$ になる数は「プラスとマイナスの2つ」！', math: `x^{2}=${k * k}` },
          { text: `${m(`x^{2}=${k * k}`)} の解は？`, q: { ...roots2(k, -k, [{ vals: { x1: k, x2: k }, msg: `${m(`(-${k})^{2}`)} も ${k * k}！ マイナスの解もある。` }]), check: { kind: 'roots', eq: `x^{2}=${k * k}` } } },
          { text: `√ が外れないときは √ のまま。${m(`x^{2}=${n}`)} なら？`, q: { ...choice(rng, `x=\\pm\\sqrt{${n}}`, [{ tex: `x=\\sqrt{${n}}`, msg: '解は2つ！' }, { tex: `x=\\pm${n}`, msg: '2乗して ' + n + ' になる数は √' + n + '。' }]), check: { kind: 'roots', eq: `x^{2}=${n}` } } },
          { text: 'かっこの2乗も同じ。かっこの中をカタマリと見る。', math: tex },
          { text: `${m(`${lt(1, p)}=\\pm${k}`)}。だから $x$ は？`, q: { ...roots2(-p + k, -p - k, [{ vals: { x1: p + k, x2: p - k }, msg: `${m(String(p))} を移項すると符号が変わる！` }]), check: { kind: 'roots', eq: tex } } },
        ];
      },
    },
    {
      id: 'qu-l2',
      title: '因数分解で解く',
      unlocks: ['qu-fac', 'qu-fac2'],
      build(rng) {
        let r1, r2;
        do { r1 = rng.nz(-7, 7); r2 = rng.nz(-7, 7); } while (r1 === r2 || r1 === -r2);
        const P = L(1, -r1).mul(L(1, -r2));
        const tex = eq0(P);
        return [
          { text: '最強ルール：「2つの数をかけて0なら、どちらかは必ず0」。だから左辺を因数分解できれば勝ち。', math: tex },
          { text: '左辺を因数分解すると？', q: { ...choice(rng, `${fac(1, -r1)}${fac(1, -r2)}`, [{ tex: `${fac(1, r1)}${fac(1, r2)}`, msg: '展開して元に戻るか確かめよう。' }, { tex: `${fac(1, -r1)}${fac(1, r2)}`, msg: '符号を確認！' }]), check: { kind: 'identity', expr: P.toTex(), vars: ['x'], factored: true } } },
          { text: `${m(`${fac(1, -r1)}${fac(1, -r2)}=0`)} → ${m(`${lt(1, -r1)}=0`)} または ${m(`${lt(1, -r2)}=0`)}。解は？`, q: { ...roots2(r1, r2, [{ vals: { x1: -r1, x2: -r2 }, msg: flipMsg(r1) }]), check: { kind: 'roots', eq: tex } } },
          { text: '注意！ 右辺が0じゃないときは、まず移項して「＝0」にしてから因数分解。$(x-1)(x-2)=6$ を $x-1=6$ とするのはNG。' },
        ];
      },
    },
    {
      id: 'qu-l3',
      title: '平方完成',
      unlocks: ['qu-complete'],
      build(rng) {
        let p, q, D;
        do { p = rng.nz(-4, 4); q = rng.nz(-10, 10); D = p * p - q; } while (D <= 0 || isSquare(D));
        const P = Poly.of([[1, { x: 2 }], [2 * p, { x: 1 }], [q, {}]]);
        const tex = eq0(P);
        const moved = `${Poly.of([[1, { x: 2 }], [2 * p, { x: 1 }]]).toTex()}=${-q}`;
        const correct = rootsTex(1, 2 * p, 4 * D);
        return [
          { text: '因数分解できないときの技「平方完成」。無理やり $(x+○)^{2}=△$ の形を作って、平方根で解く。', math: tex },
          { text: 'まず定数項を右辺へ移項すると？', q: { ...choice(rng, moved, [{ tex: `${Poly.of([[1, { x: 2 }], [2 * p, { x: 1 }]]).toTex()}=${q}`, msg: '移項で符号チェンジ！' }]), check: { kind: 'fn', verify: (t) => t === moved } } },
          { text: `${m('x')} の係数 ${m(String(2 * p))} の「半分の2乗」を両辺にたす。いくつをたす？`, q: { ...numAns(ONE, { v: p * p }, { wrong: [{ vals: { v: 2 * p }, msg: '半分にしてから2乗！' }, { vals: { v: p }, msg: '半分にしたら、2乗する！' }] }), check: { kind: 'fn', verify: (v) => v.v === p * p } } },
          { text: `左辺は ${m(`${fac(1, p)}^{2}`)} にまとまる。右辺は？`, q: { ...numAns(ONE, { v: D }), check: { kind: 'value', expr: `${-q}+${tpar(p * p)}` } } },
          { text: `${m(`${fac(1, p)}^{2}=${D}`)}。あとは平方根で解くと？`, q: { ...choice(rng, correct, [{ tex: rootsTex(1, -2 * p, 4 * D), msg: '移項で符号チェンジ！' }, { tex: correct.replace('\\pm', '+'), msg: '解は2つ！' }]), check: { kind: 'roots', eq: tex } } },
        ];
      },
    },
    {
      id: 'qu-l4',
      title: '解の公式',
      unlocks: ['qu-formula', 'qu-formula-r'],
      build(rng) {
        let a, b, c, D;
        do { a = rng.int(1, 3); b = rng.nz(-7, 7); c = rng.nz(-7, 7); D = b * b - 4 * a * c; } while (D <= 0 || isSquare(D) || D > 100);
        const P = Poly.of([[a, { x: 2 }], [b, { x: 1 }], [c, {}]]);
        const tex = eq0(P);
        const correct = rootsTex(a, b, D);
        return [
          { text: 'どんな二次方程式でも解ける最終兵器「解の公式」。$ax^{2}+bx+c=0$ の解は👇（平方完成を一般化したもの）', math: 'x=\\frac{-b\\pm\\sqrt{b^{2}-4ac}}{2a}' },
          { text: `${m(tex)} の ${m('b')} は？（符号ごと！）`, q: { ...numAns(ONE, { v: b }, { wrong: [{ vals: { v: -b }, msg: '$b$ は符号ごと読む！' }] }), check: { kind: 'fn', verify: (v) => v.v === P.coef({ x: 1 }).n } } },
          { text: `${m('c')} は？`, q: { ...numAns(ONE, { v: c }, { wrong: [{ vals: { v: -c }, msg: '$c$ も符号ごと！' }] }), check: { kind: 'fn', verify: (v) => v.v === P.coef({}).n } } },
          { text: `√ の中 ${m(`b^{2}-4ac=${tpar(b)}^{2}-4\\times ${a}\\times ${tpar(c)}`)} は？`, q: { ...numAns(ONE, { v: D }, { wrong: [{ vals: { v: b * b + 4 * a * c }, msg: `${m(`-4\\times ${a}\\times ${tpar(c)}`)} の符号を確認！` }] }), check: { kind: 'value', expr: `${tpar(b)}^{2}-4\\times ${a}\\times ${tpar(c)}` } } },
          { text: `公式に入れると ${m(`x=\\frac{${-b}\\pm\\sqrt{${D}}}{${2 * a}}`)}。簡単にすると？`, q: { ...choice(rng, correct, [{ tex: rootsTex(a, -b, D), msg: '分子は $-b$ から！' }, a > 1 && { tex: rootsTex(a / 2, b, D), msg: '分母は $2a$！' }]), check: { kind: 'roots', eq: tex } } },
        ];
      },
    },
    {
      id: 'qu-l5',
      title: '文章題と解の吟味',
      unlocks: ['qu-word', 'qu-param'],
      build(rng) {
        const n = rng.int(4, 12), N = n * (n + 1);
        return [
          { text: `連続する2つの正の整数をかけたら ${N}。小さいほうは？ 小さいほうを $x$ とすると、大きいほうは $x+1$。` },
          { text: '方程式は？', q: { ...choice(rng, `x(x+1)=${N}`, [{ tex: `x+(x+1)=${N}`, msg: '「かけたら」だからかけ算！' }, { tex: `x^{2}+1=${N}`, msg: '$x(x+1)$ を展開すると $x^{2}+x$。' }]), check: { kind: 'fn', verify: (t) => t === `x(x+1)=${N}` } } },
          { text: `整理すると ${m(`x^{2}+x-${N}=0`)}。解は？`, q: { ...roots2(n, -n - 1), check: { kind: 'roots', eq: `x(x+1)=${N}` } } },
          { text: `解は ${m(String(n))} と ${m(String(-n - 1))}。でも問題は「正の整数」。答えとして正しいのは？`, q: { ...numAns(ONE, { v: n }, { wrong: [{ vals: { v: -n - 1 }, msg: '負の数は「正の整数」じゃない！ 問題に合わない解は捨てる（解の吟味）。' }] }), check: { kind: 'fn', verify: (v) => v.v > 0 && v.v * (v.v + 1) === N } } },
        ];
      },
    },
  ],
};
