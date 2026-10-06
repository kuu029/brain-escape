import { F, lcm } from '../../core/frac.js';
import { tnum, tpar, tdec, tparDec } from '../../core/fmt.js';
import { numAns, choice, ONE, m } from '../kit.js';

const DENS = [2, 3, 4, 5, 6, 8, 9, 10, 12];
function randFrac(rng, allowNeg = true) {
  const d = rng.pick(DENS);
  let n;
  do n = rng.int(1, d * 2 - 1);
  while (F(n, d).d !== d); // 既約のものだけ
  return F(allowNeg && rng.chance(0.45) ? -n : n, d);
}

function genAddSub(rng) {
  let a, b, op, ans;
  do {
    a = randFrac(rng);
    b = randFrac(rng);
    op = rng.pick(['+', '-']);
    ans = op === '+' ? a.add(b) : a.sub(b);
  } while (a.d === b.d || ans.isZero() || ans.d > 24);
  const tex = `${tnum(a)}${op}${tpar(b)}`;
  const L = lcm(a.d, b.d);
  const an = a.mul(L).n, bn = (op === '+' ? b : b.neg()).mul(L).n;
  // 分子どうし・分母どうしを足してしまう
  const bad = F(a.n + (op === '+' ? b.n : -b.n), a.d + b.d);
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...numAns(ONE, { v: ans }, { wrong: [{ vals: { v: bad }, msg: '分母どうしは足さない！ 先に通分（分母をそろえる）してから分子だけ計算。' }] }),
    hint: `分母を ${L} にそろえる（通分）→ 分子だけ計算 → 約分。`,
    steps: [
      `分母 ${a.d} と ${b.d} の最小公倍数は ${L}`,
      `通分: ${m(`\\frac{${an}}{${L}}${bn < 0 ? '-' : '+'}\\frac{${Math.abs(bn)}}{${L}}`)}`,
      `分子を計算: ${m(`\\frac{${an + bn}}{${L}}`)}`,
      `約分して ${m(tnum(ans))}`,
    ],
    check: { kind: 'value', expr: tex },
  };
}

function genMulDiv(rng) {
  let a, b, op, ans;
  do {
    a = randFrac(rng);
    b = randFrac(rng);
    op = rng.pick(['\\times ', '\\div ']);
    ans = op === '\\times ' ? a.mul(b) : a.div(b);
  } while (ans.d > 24 || Math.abs(ans.n) > 60 || ans.eq(1) || ans.eq(-1));
  const tex = `${tnum(a)}${op}${tpar(b)}`;
  const wrong = [];
  if (op === '\\div ') wrong.push({ vals: { v: a.mul(b) }, msg: 'わり算は「逆数のかけ算」！ わる数をひっくり返すのを忘れずに。' });
  wrong.push({ vals: { v: ans.neg() }, msg: '符号チェック！ 負の数が1個ならマイナス、2個ならプラス。' });
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...numAns(ONE, { v: ans }, { wrong }),
    hint: op === '\\div ' ? 'わる数を逆数にしてかけ算に。符号を先に決めると楽。' : '分子どうし・分母どうしをかける。約分は先にしてもOK。',
    steps: [
      ...(op === '\\div ' ? [`逆数のかけ算に: ${m(`${tnum(a)}\\times ${tpar(b.inv())}`)}`] : []),
      `符号は ${ans.n < 0 ? 'マイナス' : 'プラス'}`,
      `答え: ${m(tnum(ans))}`,
    ],
    check: { kind: 'value', expr: tex },
  };
}

function genDec(rng) {
  const form = rng.int(0, 2);
  let a, b, tex, ans, wrong = [];
  if (form === 0) {
    a = F(rng.nz(-19, 19), 10);
    b = F(rng.nz(-19, 19), 10);
    if (b.isInt()) b = b.add(F(1, 10));
    ans = a.mul(b);
    tex = `${tdec(a)}\\times ${tparDec(b)}`;
    wrong.push({ vals: { v: ans.mul(10) }, msg: '小数点の位置に注意！ 小数第1位×小数第1位 → 答えは小数第2位まで。' });
  } else if (form === 1) {
    let op;
    do {
      a = F(rng.nz(-99, 99), 10);
      b = F(rng.nz(-99, 99), 10);
      op = rng.pick(['+', '-']);
      ans = op === '+' ? a.add(b) : a.sub(b);
    } while (ans.isZero() || (a.isInt() && b.isInt()));
    tex = `${tdec(a)}${op}${tparDec(b)}`;
    if (op === '-' && b.n < 0) wrong.push({ vals: { v: a.add(b) }, msg: 'ひく負の数＝たす正の数！' });
  } else {
    const q = F(rng.nz(-9, 9), rng.pick([1, 10]));
    b = F(rng.nz(-9, 9), 10);
    a = q.mul(b);
    ans = q;
    tex = `${tdec(a)}\\div ${tparDec(b)}`;
    wrong.push({ vals: { v: q.mul(10) }, msg: '小数のわり算は、わる数とわられる数の小数点を同じだけ右へ動かしてから。' }, { vals: { v: q.div(10) }, msg: '小数点の位置をもう一度確認！' });
  }
  return {
    stem: `計算せよ。（小数で答えてOK） ${m(tex)}`,
    ...numAns(ONE, { v: ans }, { wrong }),
    hint: '符号を先に決めて、小数点の位置は最後に確認。',
    steps: [`符号は ${ans.n < 0 ? 'マイナス' : 'プラス'}`, `答え: ${m(tdec(ans))}`],
    check: { kind: 'value', expr: tex },
  };
}

function genMixed(rng) {
  let a, b, c, ans;
  do {
    a = randFrac(rng);
    b = randFrac(rng);
    c = F(rng.intEx(-6, 6, [0, 1, -1]));
    ans = a.sub(b.mul(c));
  } while (ans.isZero() || ans.d > 24 || Math.abs(ans.n) > 80);
  const tex = `${tnum(a)}-${tpar(b)}\\times ${tpar(c)}`;
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...numAns(ONE, { v: ans }, { wrong: [{ vals: { v: a.sub(b).mul(c) }, msg: 'かけ算が先！ 左から順にやらない。' }] }),
    hint: 'かけ算を先に計算してから、ひき算。',
    steps: [`かけ算: ${m(`${tpar(b)}\\times ${tpar(c)}=${tnum(b.mul(c))}`)}`, `${m(`${tnum(a)}-${tpar(b.mul(c))}=${tnum(ans)}`)}`],
    check: { kind: 'value', expr: tex },
  };
}

export default {
  id: 'fractions-decimals',
  stage: 1,
  area: '食堂',
  title: '分数・小数の計算',
  emoji: '🍕',
  prereqs: [],
  tool: 'heal',
  hintCard: [
    'たし算・ひき算は通分（分母をそろえる）してから分子だけ計算',
    'わり算は「逆数のかけ算」: $\\frac{2}{3}\\div \\frac{4}{5}=\\frac{2}{3}\\times \\frac{5}{4}$',
    '答えは必ず約分',
    '小数のかけ算: 小数点以下の桁数をたす',
  ],
  generators: {
    'fd-addsub': { difficulty: 1, gen: genAddSub },
    'fd-muldiv': { difficulty: 1, gen: genMulDiv },
    'fd-dec': { difficulty: 1, gen: genDec },
    'fd-mixed': { difficulty: 2, gen: genMixed },
  },
  lessons: [
    {
      id: 'fd-l1',
      title: '通分してたす・ひく',
      unlocks: ['fd-addsub', 'fd-dec'],
      build(rng) {
        let a, b, ans;
        do {
          a = randFrac(rng, false);
          b = randFrac(rng, false);
          ans = a.sub(b);
        } while (a.d === b.d || ans.isZero() || ans.d > 24);
        const L = lcm(a.d, b.d);
        const tex = `${tnum(a)}-${tnum(b)}`;
        return [
          { text: '分母がちがう分数は、そのままでは計算できない。分母をそろえる＝「通分」から。', math: tex },
          { text: `分母 ${a.d} と ${b.d} の最小公倍数は？`, q: { ...numAns(ONE, { v: L }, { wrong: [{ vals: { v: a.d * b.d }, msg: 'それも公倍数だけど、もっと小さいのがある！' }] }), check: { kind: 'fn', verify: (v) => v.v === L } } },
          {
            text: `${m(tnum(a))} を分母 ${L} にすると、分子はいくつ？`,
            q: { ...numAns(ONE, { v: a.mul(L).n }), check: { kind: 'fn', verify: (v) => v.v / L === a.num() } },
          },
          { text: '同じように両方そろえたら、分子だけ計算する。', math: `\\frac{${a.mul(L).n}}{${L}}-\\frac{${b.mul(L).n}}{${L}}` },
          { text: '答えは？（約分も忘れずに）', q: { ...numAns(ONE, { v: ans }), check: { kind: 'value', expr: tex } } },
        ];
      },
    },
    {
      id: 'fd-l2',
      title: 'かけ算・わり算',
      unlocks: ['fd-muldiv', 'fd-mixed'],
      build(rng) {
        let a, b, ans;
        do {
          a = randFrac(rng);
          b = randFrac(rng);
          ans = a.div(b);
        } while (ans.d > 24 || Math.abs(ans.n) > 60 || ans.eq(1) || ans.eq(-1));
        const tex = `${tnum(a)}\\div ${tpar(b)}`;
        return [
          { text: '分数のわり算は「わる数をひっくり返してかける」。', math: tex },
          {
            text: `${m(tpar(b))} の逆数は？`,
            q: { ...choice(rng, tnum(b.inv()), [{ tex: tnum(b.inv().neg()), msg: '逆数は符号そのまま、上下だけひっくり返す！' }, { tex: tnum(b.neg()), msg: 'それは符号を変えただけ。逆数は分子と分母を入れかえる。' }]), check: { kind: 'value', expr: `\\frac{1}{${tpar(b)}}` } },
          },
          { text: 'かけ算に直すとこう。', math: `${tnum(a)}\\times ${tpar(b.inv())}` },
          { text: '答えは？（符号 → 約分 → かけ算 の順が楽）', q: { ...numAns(ONE, { v: ans }, { wrong: [{ vals: { v: a.mul(b) }, msg: '逆数にするのを忘れてない？' }] }), check: { kind: 'value', expr: tex } } },
        ];
      },
    },
  ],
};
