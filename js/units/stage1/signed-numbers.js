import { F } from '../../core/frac.js';
import { tnum, tpar, signed } from '../../core/fmt.js';
import { choice, numAns, ONE, m } from '../kit.js';

// a op b op c ... を作る（op: '+'|'-'）
function chain(rng, n, forceNegSub) {
  const t0 = rng.nz(-9, 9);
  const rest = [];
  for (let i = 1; i < n; i++) {
    const op = rng.pick(['+', '-']);
    rest.push({ op, v: rng.nz(-9, 9) });
  }
  if (forceNegSub) rest[0] = { op: '-', v: -rng.int(1, 9) };
  const tex = tnum(t0) + rest.map((r) => r.op + tpar(r.v)).join('');
  const eff = [t0, ...rest.map((r) => (r.op === '+' ? r.v : -r.v))];
  const ans = eff.reduce((a, b) => a + b, 0);
  // 「ひく負の数」をそのまま負の数として足してしまう間違い
  const bad = [t0, ...rest.map((r) => (r.op === '+' ? r.v : r.v < 0 ? r.v : -r.v))].reduce((a, b) => a + b, 0);
  return { tex, eff, ans, bad };
}
const sumTex = (eff) => eff.map((v, i) => signed(v, i === 0)).join('');
// 正の合計と負の合計をあわせる式（片方が0なら省く）
const combine = (pos, neg) => (pos && neg ? `${pos}${signed(neg)}=${pos + neg}` : String(pos + neg));

function genAdd(rng) {
  let c;
  do c = chain(rng, rng.int(3, 4), rng.chance(0.75));
  while (c.ans === 0);
  const pos = c.eff.filter((v) => v > 0).reduce((a, b) => a + b, 0);
  const neg = c.eff.filter((v) => v < 0).reduce((a, b) => a + b, 0);
  return {
    stem: `計算せよ。 ${m(c.tex)}`,
    ...numAns(ONE, { v: c.ans }, {
      wrong: [{ vals: { v: c.bad }, msg: `${m('-(-a)')} は ${m('+a')} に変身するよ。「ひく負の数」＝「たす正の数」！` }],
    }),
    hint: 'ひき算は「反対の数をたす」に直してから、正の数と負の数を別々にまとめよう。',
    steps: [
      `ひき算をたし算に直す: ${m(c.tex)} → ${m(sumTex(c.eff))}`,
      `正の数をまとめる: ${m(String(pos))}、負の数をまとめる: ${m(String(neg))}`,
      `${m(combine(pos, neg))}`,
    ],
    check: { kind: 'value', expr: c.tex },
  };
}

function genMulDiv(rng) {
  const q = rng.intEx(-6, 6, [0, 1, -1]);
  const c = rng.intEx(-6, 6, [0, 1, -1]);
  const b = rng.intEx(-5, 5, [0, 1, -1]);
  const a = q * c;
  const form = rng.int(0, 2);
  let tex;
  let ans;
  if (form === 0) { tex = `${tnum(a)}\\div ${tpar(c)}\\times ${tpar(b)}`; ans = q * b; }
  else if (form === 1) { tex = `${tnum(b)}\\times ${tpar(a)}\\div ${tpar(c)}`; ans = q * b; }
  else { tex = `${tnum(q)}\\times ${tpar(b)}\\times ${tpar(c)}`; ans = q * b * c; }
  const nNeg = (form === 2 ? [q, b, c] : [a, b, c]).filter((v) => v < 0).length;
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...numAns(ONE, { v: ans }, {
      wrong: [{ vals: { v: -ans }, msg: `符号チェック！ マイナスが ${nNeg} 個 → ${nNeg % 2 ? '奇数なので答えはマイナス' : '偶数なので答えはプラス'}。` }],
    }),
    hint: 'まず符号を決める（マイナスが偶数個→＋、奇数個→ー）。次に数字の部分だけ計算。',
    steps: [
      `マイナスの数は ${nNeg} 個 → 答えの符号は ${nNeg % 2 ? 'ー' : '＋'}`,
      form === 2 ? `数字だけかける: ${m(`${Math.abs(q)}\\times ${Math.abs(b)}\\times ${Math.abs(c)}=${Math.abs(ans)}`)}` : `わり算は逆数のかけ算: ${m(`\\div ${tpar(c)}`)} → ${m(`\\times (${tnum(F(1, c))})`)}`,
      `答え: ${m(String(ans))}`,
    ].filter(Boolean),
    check: { kind: 'value', expr: tex },
  };
}

function genPow(rng) {
  const a = rng.int(2, 5);
  const form = rng.int(0, 4);
  let tex;
  let ans;
  let bad;
  let why;
  let steps; // 解き方: 「何を何回かけるか」をかけ算で書き出す
  const neg2 = (x) => `(-${x})\\times (-${x})`;
  if (form === 0) {
    tex = `-${a}^{2}`; ans = -a * a; bad = a * a; why = `${m(`-${a}^{2}`)} は「${a} の2乗にマイナスをつける」。2乗されるのは ${a} だけ！`;
    steps = [`2乗されるのは ${m(a)} だけ（マイナスはかっこの外）`, `${m(`-${a}^{2}=-(${a}\\times ${a})=-${a * a}`)}`];
  } else if (form === 1) {
    tex = `(-${a})^{2}`; ans = a * a; bad = -a * a; why = `${m(`(-${a})^{2}`)} はかっこごと2乗。マイナス×マイナスでプラス！`;
    steps = [`かっこごと2乗 → ${m(`-${a}`)} を2回かける`, `${m(`(-${a})^{2}=${neg2(a)}=${a * a}`)}（マイナス×マイナスでプラス）`];
  } else if (form === 2) {
    const b = rng.int(2, 4); tex = `(-${b})^{3}`; ans = -(b ** 3); bad = b ** 3; why = 'マイナスを3回かけるとマイナス（奇数回）。';
    steps = [`${m(`-${b}`)} を3回かける: ${m(`(-${b})\\times (-${b})\\times (-${b})`)}`, `マイナスが3個（奇数）→ 答えはマイナス: ${m(`-(${b}\\times ${b}\\times ${b})=${ans}`)}`];
  } else if (form === 3) {
    const b = rng.nz(-4, 4);
    tex = `${tnum(b)}\\times (-${a})^{2}`; ans = b * a * a; bad = -b * a * a; why = `${m(`(-${a})^{2}=${a * a}`)} が先。かっこごと2乗だからプラス。`;
    steps = [`累乗（2乗）が先: ${m(`(-${a})^{2}=${neg2(a)}=${a * a}`)}`, `かけ算: ${m(`${tnum(b)}\\times ${a * a}=${ans}`)}`];
  } else {
    const c = rng.int(2, 5);
    tex = `-${a}^{2}+(-${c})^{2}`; ans = -a * a + c * c; bad = a * a + c * c; why = `${m(`-${a}^{2}=-${a * a}`)}、${m(`(-${c})^{2}=${c * c}`)}。かっこの有無で全然ちがう！`;
    steps = [`前半はかっこなし → ${a} だけ2乗: ${m(`-${a}^{2}=-(${a}\\times ${a})=-${a * a}`)}`, `後半はかっこごと2乗: ${m(`(-${c})^{2}=${neg2(c)}=${c * c}`)}`, `${m(`-${a * a}+${c * c}=${ans}`)}`];
  }
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...numAns(ONE, { v: ans }, { wrong: [{ vals: { v: bad }, msg: why }] }),
    hint: '「何が」2乗（3乗）されているか、かっこを見てチェック。',
    steps: [...steps, `答え: ${m(String(ans))}`],
    check: { kind: 'value', expr: tex },
  };
}

function genOrder(rng) {
  const form = rng.int(0, 3);
  let tex;
  let ans;
  let bad = null;
  let steps;
  if (form === 0) {
    const a = rng.nz(-9, 9), b = rng.intEx(-6, 6, [0, 1]), c = rng.intEx(-6, 6, [0, 1]);
    tex = `${tnum(a)}+${tpar(b)}\\times ${tpar(c)}`; ans = a + b * c; bad = (a + b) * c;
    steps = [`かけ算が先: ${m(`${tpar(b)}\\times ${tpar(c)}=${b * c}`)}`, `${m(`${tnum(a)}+${tpar(b * c)}=${ans}`)}`];
  } else if (form === 1) {
    const a = rng.nz(-9, 9), c = rng.intEx(-5, 5, [0, 1, -1]), q = rng.nz(-5, 5);
    const b = c * q;
    tex = `${tnum(a)}-${tpar(b)}\\div ${tpar(c)}`; ans = a - q;
    if ((a - b) % c === 0) bad = (a - b) / c;
    steps = [`わり算が先: ${m(`${tpar(b)}\\div ${tpar(c)}=${q}`)}`, `${m(`${tnum(a)}-${tpar(q)}=${ans}`)}`];
  } else if (form === 2) {
    const a = rng.nz(-9, 9), b = rng.nz(-9, 9), c = rng.intEx(-5, 5, [0, 1]);
    tex = `(${tnum(a)}+${tpar(b)})\\times ${tpar(c)}`; ans = (a + b) * c; bad = a + b * c;
    steps = [`かっこの中が先: ${m(`${tnum(a)}+${tpar(b)}=${a + b}`)}`, `${m(`${tpar(a + b)}\\times ${tpar(c)}=${ans}`)}`];
  } else {
    const a = rng.nz(-6, 6), b = rng.nz(-6, 6), c = -rng.int(2, 5);
    tex = `${tnum(a)}\\times ${tpar(b)}-${tpar(c)}^{2}`; ans = a * b - c * c; bad = a * b + c * c;
    steps = [`累乗が先: ${m(`${tpar(c)}^{2}=${c * c}`)}`, `かけ算: ${m(`${tnum(a)}\\times ${tpar(b)}=${a * b}`)}`, `${m(`${a * b}-${c * c}=${ans}`)}`];
  }
  return {
    stem: `計算せよ。 ${m(tex)}`,
    ...numAns(ONE, { v: ans }, { wrong: [bad !== null && { vals: { v: bad }, msg: '計算の順番に注意！ かっこ → 累乗 → ×÷ → ＋− の順。' }] }),
    hint: '順番は「かっこ → 累乗 → かけ算・わり算 → たし算・ひき算」。',
    steps,
    check: { kind: 'value', expr: tex },
  };
}

export default {
  id: 'signed-numbers',
  stage: 1,
  area: '独房ブロック',
  title: '正負の数',
  emoji: '➕',
  prereqs: [],
  tool: 'coins',
  hintCard: [
    'ひき算は「反対の数をたす」: $5-(-3)=5+3$',
    'かけ算・わり算の符号: マイナスが偶数個→＋、奇数個→ー',
    '$-3^{2}=-9$、$(-3)^{2}=9$（何が2乗されてるか見る）',
    '順番: かっこ → 累乗 → ×÷ → ＋−',
  ],
  generators: {
    'sn-add': { difficulty: 1, gen: genAdd },
    'sn-muldiv': { difficulty: 1, gen: genMulDiv },
    'sn-pow': { difficulty: 2, gen: genPow },
    'sn-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'sn-l1',
      title: 'たし算・ひき算',
      unlocks: ['sn-add'],
      build(rng) {
        const a = -rng.int(1, 9), b = rng.int(2, 9), c = rng.nz(-9, 9);
        const tex = `${tnum(a)}-(-${b})+${tpar(c)}`;
        const eff = [a, b, c];
        const pos = eff.filter((v) => v > 0).reduce((x, y) => x + y, 0);
        const neg = eff.filter((v) => v < 0).reduce((x, y) => x + y, 0);
        return [
          { text: '正負の数のたし算・ひき算は「全部たし算に直す」のが最強の作戦。今回のターゲットはこれ👇', math: tex },
          {
            text: `ひき算は「反対の数をたす」。${m(`-(-${b})`)} を書きかえると？`,
            q: { ...choice(rng, `+${b}`, [{ tex: `-${b}`, msg: 'ひく負の数は、たす正の数！ マイナスのマイナスでプラス。' }, { tex: `+(-${b})`, msg: 'それだと元のまま。「ひく」を「たす」にしたら、中身の符号も反対にする！' }]), check: { kind: 'value', expr: `-(-${b})` } },
          },
          { text: 'すると式はこうなる。たし算だけになった！', math: sumTex(eff) },
          {
            text: '正の数だけ、負の数だけをそれぞれまとめると？ まず正の数の合計は？',
            q: { ...numAns(ONE, { v: pos }), check: { kind: 'fn', verify: (v) => v.v === pos } },
          },
          {
            text: `負の数の合計は ${m(String(neg))}。最後に ${m(`${pos}${signed(neg)}`)} を計算すると？`,
            q: { ...numAns(ONE, { v: pos + neg }), check: { kind: 'value', expr: tex } },
          },
        ];
      },
    },
    {
      id: 'sn-l2',
      title: 'かけ算・わり算',
      unlocks: ['sn-muldiv'],
      build(rng) {
        const x = -rng.int(2, 5), y = -rng.int(2, 5), z = rng.pick([-1, 1]) * rng.int(2, 3);
        const tex3 = `${tnum(x)}\\times ${tpar(y)}\\times ${tpar(z)}`;
        const q = rng.intEx(-6, 6, [0, 1, -1]), c = -rng.int(2, 5);
        const texd = `${tnum(q * c)}\\div ${tpar(c)}`;
        return [
          { text: 'かけ算・わり算は「先に符号、あとで数字」。マイナスが偶数個→＋、奇数個→ー。', math: tex3 },
          {
            text: `この式、マイナスは何個？`,
            q: { ...numAns(ONE, { v: [x, y, z].filter((v) => v < 0).length }), check: { kind: 'fn', verify: (v) => v.v === [x, y, z].filter((t) => t < 0).length } },
          },
          {
            text: 'じゃあ計算すると？（符号に気をつけて）',
            q: { ...numAns(ONE, { v: x * y * z }, { wrong: [{ vals: { v: -x * y * z }, msg: '数字は合ってる！ 符号をもう一度数えよう。' }] }), check: { kind: 'value', expr: tex3 } },
          },
          { text: 'わり算も同じルール。負÷負＝正、正÷負＝負。', math: texd },
          {
            text: 'これを計算すると？',
            q: { ...numAns(ONE, { v: q }, { wrong: [{ vals: { v: -q }, msg: '符号ミス！ マイナスの個数を数えよう。' }] }), check: { kind: 'value', expr: texd } },
          },
        ];
      },
    },
    {
      id: 'sn-l3',
      title: '累乗と計算の順序',
      unlocks: ['sn-pow', 'sn-order'],
      build(rng) {
        const a = rng.int(2, 5);
        const b = rng.nz(-9, 9), c = rng.intEx(-6, 6, [0, 1]), d = rng.intEx(-6, 6, [0, 1]);
        const tex = `${tnum(b)}+${tpar(c)}\\times ${tpar(d)}`;
        return [
          { text: '累乗のワナ。2つの式、見た目は似てるけど別物。', math: `-${a}^{2}\\quad と\\quad (-${a})^{2}` },
          {
            text: `${m(`-${a}^{2}`)} はいくつ？（2乗されるのは ${a} だけ）`,
            q: { ...numAns(ONE, { v: -a * a }, { wrong: [{ vals: { v: a * a }, msg: `かっこがないので、2乗されるのは ${a} だけ。前のマイナスはそのまま残る！` }] }), check: { kind: 'value', expr: `-${a}^{2}` } },
          },
          {
            text: `${m(`(-${a})^{2}`)} はいくつ？（かっこごと2乗）`,
            q: { ...numAns(ONE, { v: a * a }, { wrong: [{ vals: { v: -a * a }, msg: 'かっこごと2乗 → マイナス×マイナスでプラス！' }] }), check: { kind: 'value', expr: `(-${a})^{2}` } },
          },
          { text: '計算の順番は「かっこ → 累乗 → ×÷ → ＋−」。', math: tex },
          {
            text: 'まずかけ算の部分だけ計算すると？',
            q: { ...numAns(ONE, { v: c * d }), check: { kind: 'value', expr: `${tpar(c)}\\times ${tpar(d)}` } },
          },
          {
            text: '全体の答えは？',
            q: { ...numAns(ONE, { v: b + c * d }, { wrong: [{ vals: { v: (b + c) * d }, msg: '左から順にやっちゃった？ かけ算が先！' }] }), check: { kind: 'value', expr: tex } },
          },
        ];
      },
    },
  ],
};
