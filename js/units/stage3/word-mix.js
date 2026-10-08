import { numAns, choice, m } from '../kit.js';
import { F, lineTex } from './kit3.js';

function genPrice(rng) {
  const items = rng.pick([['りんご', 'みかん'], ['ノート', 'ペン'], ['おにぎり', 'パン'], ['大人', '子ども']]);
  const isPeople = items[0] === '大人';
  let p, q, x, y;
  do { p = rng.int(8, 20) * 10; q = rng.int(4, 15) * 10; x = rng.int(2, 12); y = rng.int(2, 12); } while (p === q);
  const n = x + y, S = p * x + q * y;
  const unit = isPeople ? '人' : '個';
  const what = isPeople ? `入館料が${items[0]} ${p} 円、${items[1]} ${q} 円の水族館に、合わせて ${n} 人で行ったら、料金の合計は ${S} 円だった。${items[0]}と${items[1]}はそれぞれ何人？` : `1${unit} ${p} 円の${items[0]}と、1${unit} ${q} 円の${items[1]}を合わせて ${n} ${unit}買ったら、代金は ${S} 円だった。それぞれ何${unit}買った？`;
  return {
    stem: what,
    ...numAns([{ key: 'x', text: items[0], suffix: unit }, { key: 'y', text: items[1], suffix: unit }], { x, y }, { wrong: [{ vals: { x: y, y: x }, msg: 'どちらが x か確認。答えを問題文に代入してみよう。' }] }),
    hint: `${items[0]}を ${m('x')}、${items[1]}を ${m('y')} として、「個数の式」と「代金の式」の2本を作る。`,
    steps: [`${m(`\\sys{x+y=${n}}{${p}x+${q}y=${S}}`)}`, `${m(`x=${x},\\ y=${y}`)}`],
    check: { kind: 'equations', eqs: [`x+y=${n}`, `${p}x+${q}y=${S}`] },
  };
}

function genSpeed(rng) {
  const SP = [3, 4, 5, 6, 10, 12, 15];
  let u, v, x, y;
  do { u = rng.pick(SP); v = rng.pick(SP); x = rng.int(1, 9); y = rng.int(1, 9); } while (u >= v || x === y);
  const D = x + y, M = (x * 60) / u + (y * 60) / v;
  if (!Number.isInteger(M)) return genSpeed(rng);
  return {
    stem: `${D} km はなれた駅まで、はじめは時速 ${u} km で歩き、とちゅうから時速 ${v} km の自転車に乗ったら、合計 ${M} 分かかった。それぞれの道のりは？`,
    ...numAns([{ key: 'x', text: '歩いた', suffix: 'km' }, { key: 'y', text: '自転車', suffix: 'km' }], { x, y }, { wrong: [{ vals: { x: y, y: x }, msg: 'どちらが x か確認。' }] }),
    hint: `時間 = 道のり ÷ 速さ。分は時間になおす（${M} 分 = ${m(`\\frac{${M}}{60}`)} 時間）。`,
    steps: [`${m(`\\sys{x+y=${D}}{\\frac{x}{${u}}+\\frac{y}{${v}}=\\frac{${M}}{60}}`)}`, `${m(`x=${x},\\ y=${y}`)}`],
    check: { kind: 'equations', eqs: [`x+y=${D}`, `\\frac{x}{${u}}+\\frac{y}{${v}}=\\frac{${M}}{60}`] },
  };
}

function genPercent(rng) {
  let x, y, a, b, c;
  do {
    x = rng.int(5, 15) * 20; y = rng.int(5, 15) * 20;
    a = rng.pick([5, 10, 15, 20]); b = rng.pick([5, 10, 15, 20]);
    c = (a * x - b * y) / 100;
  } while (c === 0 || !Number.isInteger(c));
  const N = x + y;
  return {
    stem: `昨年の生徒数は ${N} 人。今年は男子が ${a}% 増え、女子が ${b}% 減って、全体で ${Math.abs(c)} 人${c > 0 ? '増えた' : '減った'}。昨年の男子・女子は何人？`,
    ...numAns([{ key: 'x', text: '男子', suffix: '人' }, { key: 'y', text: '女子', suffix: '人' }], { x, y }, { wrong: [{ vals: { x: y, y: x }, msg: 'どちらが x か確認。' }] }),
    hint: `昨年の男子 ${m('x')}、女子 ${m('y')}。増えた人数 ${m(`\\frac{${a}}{100}x`)}、減った人数 ${m(`\\frac{${b}}{100}y`)}。`,
    steps: [`${m(`\\sys{x+y=${N}}{\\frac{${a}}{100}x-\\frac{${b}}{100}y=${c}}`)}`, `${m(`x=${x},\\ y=${y}`)}`],
    check: { kind: 'equations', eqs: [`x+y=${N}`, `\\frac{${a}}{100}x-\\frac{${b}}{100}y=${c}`] },
  };
}

function genArea(rng) {
  let a, b, x;
  do { a = rng.int(10, 30); b = rng.int(8, 24); x = rng.int(1, 4); } while (a === b);
  const S = (a - x) * (b - x);
  return {
    stem: `たて ${b} m、よこ ${a} m の長方形の土地に、たて・よこ同じ幅の道を十字に作ったら、残りの畑の面積が ${S} m² になった。道の幅は何 m？`,
    ...numAns([{ key: 'x', text: '道の幅', suffix: 'm' }], { x }, { wrong: [{ vals: { x: a + b - x }, msg: `それは方程式のもう1つの解。道の幅は ${b} m より小さいはず。` }] }),
    hint: '道を土地のはしに寄せて考えると、残りは たて $(b-x)$、よこ $(a-x)$ の長方形。',
    steps: [`${m(`(${a}-x)(${b}-x)=${S}`)}`, `解くと ${m(`x=${x},\\ ${a + b - x}`)}`, `${m(`0<x<${b}`)} なので ${m(`x=${x}`)}`],
    check: { kind: 'fn', verify: (v) => near0((a - v.x) * (b - v.x) - S) && v.x > 0 && v.x < Math.min(a, b) },
  };
}
const near0 = (v) => Math.abs(v) < 1e-9;

function genConsec(rng) {
  const n = rng.int(3, 15);
  if (rng.chance(0.5)) {
    const P = n * (n + 1);
    return {
      stem: `連続する2つの正の整数があり、その積は ${P} である。小さいほうの整数は？`,
      ...numAns([{ key: 'x', text: '小さいほう' }], { x: n }, { wrong: [{ vals: { x: -(n + 1) }, msg: '正の整数なので、負の解は使わない。' }, { vals: { x: n + 1 }, msg: 'それは大きいほう。' }] }),
      hint: '小さいほうを $x$ とすると、大きいほうは $x+1$。',
      steps: [`${m(`x(x+1)=${P}`)}`, `${m(`x^{2}+x-${P}=0`)} → ${m(`(x+${n + 1})(x-${n})=0`)}`, `正なので ${m(`x=${n}`)}`],
      check: { kind: 'fn', verify: (v) => near0(v.x * (v.x + 1) - P) && v.x > 0 },
    };
  }
  // 連続する奇数・偶数（差が2）の積
  if (rng.chance(0.4)) {
    const odd = rng.chance(0.5);
    const a = odd ? 2 * rng.int(1, 9) + 1 : 2 * rng.int(2, 10);
    const P = a * (a + 2);
    const kind = odd ? '奇数' : '偶数';
    return {
      stem: `連続する2つの正の${kind}があり、その積は ${P} である。小さいほうの${kind}は？`,
      ...numAns([{ key: 'x', text: '小さいほう' }], { x: a }, { wrong: [{ vals: { x: -(a + 2) }, msg: '正の数なので、負の解は使わない。' }, { vals: { x: a + 2 }, msg: 'それは大きいほう。' }] }),
      hint: `連続する${kind}は 2 ずつちがう。小さいほうを $x$ とすると、大きいほうは $x+2$。`,
      steps: [`${m(`x(x+2)=${P}`)}`, `${m(`x^{2}+2x-${P}=0`)} → ${m(`(x+${a + 2})(x-${a})=0`)}`, `正なので ${m(`x=${a}`)}`],
      check: { kind: 'fn', verify: (v) => near0(v.x * (v.x + 2) - P) && v.x > 0 },
    };
  }
  // 連続する3つの整数の2乗の和 → 真ん中
  if (rng.chance(0.35)) {
    const b = rng.int(3, 12);
    const T = 3 * b * b + 2;
    return {
      stem: `連続する3つの正の整数があり、それぞれの2乗の和は ${T} である。真ん中の整数は？`,
      ...numAns([{ key: 'x', text: '真ん中' }], { x: b }, { wrong: [{ vals: { x: b - 1 }, msg: 'それはいちばん小さい数。' }, { vals: { x: b + 1 }, msg: 'それはいちばん大きい数。' }, { vals: { x: -b }, msg: '正の整数なので、負の解は使わない。' }] }),
      hint: '真ん中を $x$ とすると、3つの数は $x-1$, $x$, $x+1$。',
      steps: [`${m(`(x-1)^{2}+x^{2}+(x+1)^{2}=${T}`)}`, `${m(`3x^{2}+2=${T}`)} → ${m(`x^{2}=${b * b}`)}`, `正なので ${m(`x=${b}`)}`],
      check: { kind: 'fn', verify: (v) => near0((v.x - 1) ** 2 + v.x ** 2 + (v.x + 1) ** 2 - T) && v.x > 1 },
    };
  }
  const S = n * n + (n + 1) * (n + 1);
  return {
    stem: `連続する2つの正の整数があり、それぞれの2乗の和は ${S} である。小さいほうの整数は？`,
    ...numAns([{ key: 'x', text: '小さいほう' }], { x: n }, { wrong: [{ vals: { x: -(n + 1) }, msg: '正の整数なので、負の解は使わない。' }, { vals: { x: n + 1 }, msg: 'それは大きいほう。' }] }),
    hint: '小さいほうを $x$ → $x^{2}+(x+1)^{2}=S$',
    steps: [`${m(`x^{2}+(x+1)^{2}=${S}`)}`, `${m(`2x^{2}+2x-${S - 1}=0`)}`, `正なので ${m(`x=${n}`)}`],
    check: { kind: 'fn', verify: (v) => near0(v.x * v.x + (v.x + 1) ** 2 - S) && v.x > 0 },
  };
}

function genWater(rng) {
  const h0 = rng.int(2, 12), r = rng.int(2, 6);
  if (rng.chance(0.5)) {
    return {
      stem: `深さ ${h0} cm まで水が入った水そうに、毎分 ${r} cm ずつ水面が上がるように水を入れる。水を入れ始めてから ${m('x')} 分後の水の深さを ${m('y')} cm とするとき、${m('y')} を ${m('x')} の式で表すと？`,
      ...choice(rng, lineTex(r, h0), [
        { tex: lineTex(h0, r), msg: '1分ごとに増える量（傾き）は毎分の上がり方。最初の深さが切片。' },
        { tex: lineTex(r, 0), msg: '最初から入っていた水（切片）をわすれずに。' },
        { tex: lineTex(r, -h0), msg: '最初の水は「たす」。' },
      ]),
      hint: '1分ごとに同じだけ増える → 一次関数 $y=ax+b$。$a$ は毎分の増加、$b$ は最初の深さ。',
      steps: [`${m(lineTex(r, h0))}`],
      check: { kind: 'graph', pts: [[0, h0], [1, h0 + r], [5, h0 + 5 * r]] },
    };
  }
  const t = rng.int(3, 12);
  const H = h0 + r * t;
  return {
    stem: `深さ ${h0} cm まで水が入った水そうに、毎分 ${r} cm ずつ水面が上がるように水を入れる。深さが ${H} cm になるのは、水を入れ始めてから何分後？`,
    ...numAns([{ key: 'x', text: '', suffix: '分後' }], { x: t }, { wrong: [{ vals: { x: F(H, r) }, msg: '最初から入っていた水の分をひいてから考える。' }] }),
    hint: `${m(`y=${r}x+${h0}`)} に ${m(`y=${H}`)} を代入。`,
    steps: [`${m(`${H}=${r}x+${h0}`)}`, `${m(`x=${t}`)}`],
    check: { kind: 'fn', verify: (v) => near0(r * v.x + h0 - H) },
  };
}

export default {
  id: 'word-mix',
  stage: 3,
  area: '自由の船',
  title: '文章題の総合',
  emoji: '⛵',
  prereqs: ['simultaneous', 'quadratic'],
  tool: 'mega',
  hintCard: [
    'わからない数を $x,\\ y$ とおく → 等しい関係を2つ見つけて連立方程式',
    '時間 = 道のり ÷ 速さ（分は時間になおす）',
    '$a$% 増える → $\\frac{a}{100}x$ 増える',
    '二次方程式の解は、問題に合うか（正か・範囲内か）を確かめる',
  ],
  generators: {
    'wm-price': { difficulty: 1, gen: genPrice },
    'wm-speed': { difficulty: 2, gen: genSpeed },
    'wm-percent': { difficulty: 3, gen: genPercent },
    'wm-area': { difficulty: 2, gen: genArea },
    'wm-consec': { difficulty: 2, gen: genConsec },
    'wm-water': { difficulty: 1, gen: genWater },
  },
  lessons: [
    {
      id: 'wm-l1',
      title: '連立方程式の文章題',
      unlocks: ['wm-price', 'wm-speed', 'wm-percent'],
      build(rng) {
        const p = rng.pick([120, 150]), q = 80, x = rng.int(3, 6);
        const y = rng.pick([2, 3, 4, 5].filter((t) => t !== x)); // x=y だと値段を入れかえた式も成り立つ
        const n = x + y, S = p * x + q * y;
        return [
          { text: `1個 ${p} 円のパンと 1個 ${q} 円のおにぎりを合わせて ${n} 個買ったら ${S} 円。わからない数を文字にする: パン ${m('x')} 個、おにぎり ${m('y')} 個。`, math: 'x,\\ y' },
          { text: '個数の関係: パン＋おにぎり＝合計。正しい式は？', q: { ...choice(rng, `x+y=${n}`, [{ tex: `${p}x+${q}y=${n}`, msg: 'これは個数の式。値段はかけない。' }, { tex: `x-y=${n}` }]), check: { kind: 'eqstep', eqs: [`x+y=${n}`], sol: { x, y } } } },
          { text: '代金の関係: 正しい式は？', q: { ...choice(rng, `${p}x+${q}y=${S}`, [{ tex: `${q}x+${p}y=${S}`, msg: 'パン（x）が ' + p + ' 円。' }, { tex: `x+y=${S}` }]), check: { kind: 'eqstep', eqs: [`${p}x+${q}y=${S}`], sol: { x, y } } } },
          { text: `連立方程式を解くと？`, math: `\\sys{x+y=${n}}{${p}x+${q}y=${S}}`, q: { ...numAns([{ key: 'x', text: 'パン', suffix: '個' }, { key: 'y', text: 'おにぎり', suffix: '個' }], { x, y }), check: { kind: 'equations', eqs: [`x+y=${n}`, `${p}x+${q}y=${S}`] } } },
        ];
      },
    },
    {
      id: 'wm-l2',
      title: '二次方程式・関数の文章題',
      unlocks: ['wm-area', 'wm-consec', 'wm-water'],
      build(rng) {
        const n = rng.int(4, 9), P = n * (n + 1);
        return [
          { text: `「連続する2つの正の整数の積が ${P}」。小さいほうを ${m('x')} とすると、大きいほうは？`, q: { ...choice(rng, 'x+1', [{ tex: '2x', msg: '連続する → 1 だけ大きい。' }, { tex: 'x^{2}' }]), check: { kind: 'fn', verify: (t) => t === 'x+1' } } },
          { text: `式は ${m(`x(x+1)=${P}`)}。解は2つ出る。`, math: `x(x+1)=${P}` },
          { text: '正のほうの解は？', q: { ...numAns([{ key: 'x', text: 'x' }], { x: n }, { wrong: [{ vals: { x: -(n + 1) }, msg: '「正の整数」なので、負の解は答えにしない。' }] }), check: { kind: 'fn', verify: (v) => near0(v.x * (v.x + 1) - P) && v.x > 0 } } },
          { text: `もう1つの解 ${m(-(n + 1))} は「正の整数」に合わないので捨てる。二次方程式の文章題は、最後にかならず確かめる！`, math: `x=${n},\\ ${-(n + 1)}` },
        ];
      },
    },
  ],
};
