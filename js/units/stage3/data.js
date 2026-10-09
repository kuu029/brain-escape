import { numAns, m } from '../kit.js';
import { F, Frac, near } from './kit3.js';
import { tdec } from '../../core/fmt.js';
import { boxplot } from './fig.js';

const ONEv = (text) => [{ key: 'v', text }];
const ans1 = (text, v, wrong = []) => {
  const q = numAns(ONEv(text), { v }, { wrong: wrong.filter((w) => w && w.v !== undefined).map((w) => ({ vals: { v: w.v }, msg: w.msg })) });
  q.answerText = `${text} ${m(tdec(q.answer.v))}`;
  return q;
};
// 小数か分数（.5 刻みまで）を Frac に
const toF = (x) => F(Math.round(x * 100), 100);

// ---------- 検算用（生成器とは別の書き方で計算する） ----------
const sorted = (a) => [...a].sort((x, y) => x - y);
function medianOf(a) {
  const s = sorted(a), n = s.length;
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { lo++; hi--; }
  return (s[lo] + s[hi]) / 2;
}
function quartiles(a) {
  const s = sorted(a), n = s.length, h = Math.floor(n / 2);
  return [medianOf(s.slice(0, h)), medianOf(s), medianOf(s.slice(n - h))];
}
function modeOf(a) {
  const cnt = new Map();
  for (const x of a) cnt.set(x, (cnt.get(x) || 0) + 1);
  const best = Math.max(...cnt.values());
  const ms = [...cnt].filter(([, c]) => c === best).map(([x]) => x);
  return ms.length === 1 ? ms[0] : NaN;
}
const meanOf = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// データ（平均が .5 刻みになるよう最後の値を調整、最頻値は1つ）
function makeData(rng, n) {
  for (;;) {
    const a = [...Array(n)].map(() => rng.int(2, 20));
    a[rng.int(1, n - 2)] = a[0]; // 同じ値を作って最頻値をはっきりさせる
    // 最後の値を少し足して、平均が整数か .5 になるようにする
    let d = 0;
    while (!Number.isInteger((2 * (a.reduce((x, y) => x + y, 0) + d)) / n)) d++;
    a[n - 1] += d;
    if (Number.isFinite(modeOf(a)) && a[n - 1] <= 25) return a;
  }
}

function genCenter(rng) {
  const n = rng.int(7, 10);
  const a = makeData(rng, n);
  const s = sorted(a);
  const type = rng.pick(['median', 'mode', 'mean', 'range']);
  const list = `${a.join('、')}`;
  const head = `${n}人が1週間に読んだ本の冊数のデータ:\n${list}\n`;
  if (type === 'median') {
    const v = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
    return {
      stem: `${head}中央値（メジアン）は？`,
      ...ans1('中央値', toF(v), [{ v: toF(a[Math.floor(n / 2)]), msg: 'まず小さい順に並べかえてから、真ん中を探す。' }, { v: toF(meanOf(a)), msg: 'それは平均値。中央値は「並べたときの真ん中」。' }]),
      hint: `小さい順に並べて真ん中の値。${n % 2 ? '' : '偶数個なら、真ん中の2つの平均。'}`,
      steps: [`並べかえ: ${s.join('、')}`, `中央値 ${m(tdec(toF(v)))}`],
      check: { kind: 'fn', verify: (x) => near(x.v, medianOf(a)) },
    };
  }
  if (type === 'mode') {
    const v = modeOf(a);
    return {
      stem: `${head}最頻値（モード）は？`,
      ...ans1('最頻値', v, [{ v: medianOf(a) === v ? undefined : toF(medianOf(a)), msg: '最頻値は「いちばん多く出てくる値」。' }]),
      hint: 'いちばん多く出てくる値。',
      steps: ['最頻値は、データの中でいちばん多く出てくる値', `小さい順に並べると数えやすい: ${[...a].sort((x, y) => x - y).join('、')}`, `${v} が ${a.filter((x) => x === v).length} 回でいちばん多い → 最頻値 ${v}`],
      check: { kind: 'fn', verify: (x) => near(x.v, (() => { let b = null, bc = 0; for (const y of a) { const c = a.filter((z) => z === y).length; if (c > bc) { bc = c; b = y; } } return b; })()) },
    };
  }
  if (type === 'mean') {
    const sum = a.reduce((x, y) => x + y, 0);
    return {
      stem: `${head}平均値は？`,
      ...ans1('平均値', F(sum, n), [{ v: toF(medianOf(a)) .eq(F(sum, n)) ? undefined : toF(medianOf(a)), msg: 'それは中央値。平均値は「合計 ÷ 個数」。' }, { v: sum, msg: '個数でわる！' }]),
      hint: '平均値 = 合計 ÷ 個数',
      steps: [`合計 ${sum}`, `${m(`${sum}\\div ${n}=${tdec(F(sum, n))}`)}`],
      check: { kind: 'fn', verify: (x) => near(x.v, meanOf(a)) },
    };
  }
  return {
    stem: `${head}範囲（レンジ）は？`,
    ...ans1('範囲', s[n - 1] - s[0], [{ v: s[n - 1], msg: '範囲 = 最大値 − 最小値。' }]),
    hint: '範囲 = 最大値 − 最小値',
    steps: [`最大 ${s[n - 1]}、最小 ${s[0]}`, `${m(`${s[n - 1]}-${s[0]}=${s[n - 1] - s[0]}`)}`],
    check: { kind: 'fn', verify: (x) => near(x.v, Math.max(...a) - Math.min(...a)) },
  };
}

function genQuartile(rng) {
  const n = rng.int(8, 11);
  let a;
  do a = [...Array(n)].map(() => rng.int(1, 30)); while (new Set(a).size < n - 2);
  const s = sorted(a);
  const h = Math.floor(n / 2);
  const lower = s.slice(0, h), upper = s.slice(n - h);
  const med = (x) => (x.length % 2 ? x[(x.length - 1) / 2] : (x[x.length / 2 - 1] + x[x.length / 2]) / 2);
  const q1 = med(lower), q3 = med(upper);
  const type = rng.pick(['q1', 'q3', 'iqr']);
  const label = { q1: '第1四分位数', q3: '第3四分位数', iqr: '四分位範囲' }[type];
  const v = { q1, q3, iqr: q3 - q1 }[type];
  return {
    stem: `次の ${n} 個のデータ（小さい順）の${label}は？\n${s.join('、')}`,
    ...ans1(label, toF(v), [
      type === 'iqr' && { v: s[n - 1] - s[0], msg: 'それは範囲。四分位範囲 = 第3四分位数 − 第1四分位数。' },
      type !== 'iqr' && { v: toF(med(s)), msg: 'それは中央値（第2四分位数）。前半・後半に分けて、それぞれの中央値を出す。' },
      type === 'q1' && { v: toF(q3), msg: '第1四分位数は「前半」の中央値。' },
      type === 'q3' && { v: toF(q1), msg: '第3四分位数は「後半」の中央値。' },
    ].filter((w) => w && !w.v.eq?.(toF(v)))),
    hint: `まず中央値で前半・後半に分ける${n % 2 ? '（真ん中の値はどちらにも入れない）' : ''}。前半の中央値が第1四分位数、後半の中央値が第3四分位数。`,
    steps: [`前半 ${lower.join('、')} → ${m(tdec(toF(q1)))}`, `後半 ${upper.join('、')} → ${m(tdec(toF(q3)))}`, type === 'iqr' ? `${m(`${tdec(toF(q3))}-${tdec(toF(q1))}=${tdec(toF(q3 - q1))}`)}` : ''].filter(Boolean),
    check: { kind: 'fn', verify: (x) => { const [Q1, , Q3] = quartiles(a); return near(x.v, { q1: Q1, q3: Q3, iqr: Q3 - Q1 }[type]); } },
  };
}

function genRelFreq(rng) {
  const N = rng.pick([20, 25, 50]); // 相対度数が小数第2位までで書ける人数
  const k = 5;
  let f;
  do {
    f = [...Array(k)].map(() => rng.int(1, Math.ceil((N * 2) / k)));
    const d = N - f.reduce((x, y) => x + y, 0);
    f[2] += d;
  } while (f.some((x) => x < 1));
  const cls = [...Array(k)].map((_, i) => `${i * 10}〜${(i + 1) * 10}`);
  const table = `<table class="ftable"><tr><th>階級(分)</th>${cls.map((c) => `<td>${c}</td>`).join('')}<th>計</th></tr><tr><th>度数(人)</th>${f.map((x) => `<td>${x}</td>`).join('')}<th>${N}</th></tr></table>`;
  const i = rng.int(0, k - 1);
  const type = rng.pick(['rel', 'cum', 'cumrel']);
  const cum = f.slice(0, i + 1).reduce((x, y) => x + y, 0);
  const head = '通学時間の度数分布表（0〜10 は 0分以上10分未満）。';
  if (type === 'rel') {
    return {
      stem: `${head}${cls[i]}分の階級の相対度数は？`,
      fig: table,
      ...ans1('相対度数', F(f[i], N), [{ v: f[i], msg: '相対度数 = その階級の度数 ÷ 度数の合計。' }, { v: F(cum, N).eq(F(f[i], N)) ? undefined : F(cum, N), msg: 'それは累積相対度数。' }]),
      hint: '相対度数 = その階級の度数 ÷ 合計',
      steps: ['相対度数 = その階級の度数 ÷ 度数の合計（全体のうちの割合）', `${cls[i]}分の度数は ${f[i]}、合計は ${m(`${f.join('+')}=${N}`)}`, `${m(`${f[i]}\\div ${N}=${tdec(F(f[i], N))}`)}`],
      check: { kind: 'fn', verify: (x) => near(x.v, f[i] / f.reduce((p, q) => p + q, 0)) },
    };
  }
  if (type === 'cum') {
    return {
      stem: `${head}${cls[i]}分の階級までの累積度数は？`,
      fig: table,
      ...ans1('累積度数', cum, [{ v: f[i] === cum ? undefined : f[i], msg: '累積度数は、最初の階級からその階級までの度数の合計。' }]),
      hint: '累積度数 = 最初の階級からその階級までの度数をたしたもの',
      steps: [`${m(f.slice(0, i + 1).join('+'))}${i ? `=${cum}` : ''}`],
      check: { kind: 'fn', verify: (x) => near(x.v, f.filter((_, j) => j <= i).reduce((p, q) => p + q, 0)) },
    };
  }
  return {
    stem: `${head}${cls[i]}分の階級の累積相対度数は？`,
    fig: table,
    ...ans1('累積相対度数', F(cum, N), [{ v: cum, msg: '合計でわる！' }, { v: F(f[i], N).eq(F(cum, N)) ? undefined : F(f[i], N), msg: 'それは相対度数。累積はそこまでの合計。' }]),
    hint: '累積相対度数 = 累積度数 ÷ 合計',
    steps: [`累積度数 ${cum}`, `${m(`${cum}\\div ${N}=${tdec(F(cum, N))}`)}`],
    check: { kind: 'fn', verify: (x) => near(x.v, f.filter((_, j) => j <= i).reduce((p, q) => p + q, 0) / N) },
  };
}

function genBox(rng) {
  let st;
  do {
    const mn = rng.int(0, 10), q1 = mn + rng.int(2, 10), q2 = q1 + rng.int(1, 10), q3 = q2 + rng.int(1, 10), mx = q3 + rng.int(2, 12);
    st = [mn, q1, q2, q3, mx];
  } while (st[4] > 50);
  const type = rng.pick(['median', 'range', 'iqr', 'q1']);
  const label = { median: '中央値', range: '範囲', iqr: '四分位範囲', q1: '第1四分位数' }[type];
  const [mn, q1, q2, q3, mx] = st;
  const v = { median: q2, range: mx - mn, iqr: q3 - q1, q1 }[type];
  const wrongs = { median: [{ v: Math.round((mn + mx) / 2), msg: '中央値は箱の中の線。' }], range: [{ v: q3 - q1, msg: 'それは四分位範囲（箱の長さ）。範囲は最大 − 最小（ひげの端から端）。' }], iqr: [{ v: mx - mn, msg: 'それは範囲。四分位範囲は箱の長さ（第3 − 第1四分位数）。' }], q1: [{ v: mn, msg: 'それは最小値。第1四分位数は箱の左はし。' }, { v: q3, msg: '箱の「左」はし。' }] }[type];
  return {
    stem: `図はあるテスト（50点満点）の得点の箱ひげ図。${label}を読み取れ。`,
    fig: boxplot([{ s: st }], { lo: 0, hi: 50, step: 5 }),
    ...ans1(label, v, wrongs.filter((w) => w.v !== v)),
    hint: '箱ひげ図: ひげの左はし=最小値、箱の左はし=第1四分位数、箱の中の線=中央値、箱の右はし=第3四分位数、ひげの右はし=最大値',
    steps: [`最小 ${mn}、第1 ${q1}、中央 ${q2}、第3 ${q3}、最大 ${mx}`, `${label} ${v}`],
    check: { kind: 'fn', verify: (x) => near(x.v, { median: st[2], range: st[4] - st[0], iqr: st[3] - st[1], q1: st[1] }[type]) },
  };
}

export default {
  id: 'data',
  stage: 3,
  area: '灯台',
  title: 'データの活用',
  emoji: '📊',
  prereqs: ['fractions-decimals'],
  tool: 'double',
  hintCard: [
    '平均値 = 合計 ÷ 個数、中央値 = 並べた真ん中、最頻値 = いちばん多い値',
    '範囲 = 最大値 − 最小値',
    '相対度数 = 度数 ÷ 合計。累積 = 最初からの合計',
    '四分位数: 前半の中央値(第1)・全体(第2)・後半(第3)。四分位範囲 = 第3 − 第1',
  ],
  generators: {
    'dt-center': { difficulty: 1, gen: genCenter },
    'dt-relfreq': { difficulty: 1, gen: genRelFreq },
    'dt-quartile': { difficulty: 2, gen: genQuartile },
    'dt-box': { difficulty: 2, gen: genBox },
  },
  lessons: [
    {
      id: 'dt-l1',
      title: '代表値と度数',
      unlocks: ['dt-center', 'dt-relfreq'],
      build(rng) {
        const a = sorted([3, 5, 5, 6, 8, 9, rng.int(10, 13)]);
        const sum = a.reduce((x, y) => x + y, 0);
        return [
          { text: `データ: ${a.join('、')}（7個、小さい順）。データ全体を1つの値で表すのが代表値。`, math: a.join(',') },
          { text: '真ん中（4番目）の値が中央値。中央値は？', q: { ...ans1('中央値', 6), check: { kind: 'fn', verify: (x) => near(x.v, medianOf(a)) } } },
          { text: 'いちばん多く出てくる値が最頻値。最頻値は？', q: { ...ans1('最頻値', 5), check: { kind: 'fn', verify: (x) => near(x.v, modeOf(a)) } } },
          { text: `平均値は合計 ÷ 個数。合計は ${sum}。平均値は？（わり切れなければ分数で）`, q: { ...ans1('平均値', F(sum, 7)), check: { kind: 'fn', verify: (x) => near(x.v, meanOf(a)) } } },
          { text: '度数分布表で、ある階級の度数を合計でわったものが相対度数。20人中 7人の階級の相対度数は？（小数で）', q: { ...ans1('相対度数', F(7, 20), [{ v: 7, msg: '20 でわる。' }]), check: { kind: 'value', expr: '7\\div 20' } } },
        ];
      },
    },
    {
      id: 'dt-l2',
      title: '四分位数と箱ひげ図',
      unlocks: ['dt-quartile', 'dt-box'],
      build(rng) {
        const a = sorted([2, 4, 5, 7, 8, 10, 11, rng.int(13, 15)]);
        const [q1, q2, q3] = quartiles(a);
        return [
          { text: `データ ${a.join('、')}（8個）を、中央値で前半4個と後半4個に分ける。`, math: `${a.slice(0, 4).join(',')}\\ |\\ ${a.slice(4).join(',')}` },
          { text: '前半の中央値が第1四分位数。いくつ？', q: { ...ans1('第1四分位数', toF(q1)), check: { kind: 'fn', verify: (x) => near(x.v, quartiles(a)[0]) } } },
          { text: '後半の中央値が第3四分位数。いくつ？', q: { ...ans1('第3四分位数', toF(q3)), check: { kind: 'fn', verify: (x) => near(x.v, quartiles(a)[2]) } } },
          { text: '最小値・第1四分位数・中央値・第3四分位数・最大値の5つを図にしたのが箱ひげ図。箱の長さが四分位範囲。', fig: boxplot([{ s: [a[0], q1, q2, q3, a[7]] }], { lo: 0, hi: 16, step: 2 }) },
          { text: '四分位範囲（第3 − 第1）は？', q: { ...ans1('四分位範囲', toF(q3 - q1), [{ v: a[7] - a[0], msg: 'それは範囲。' }]), check: { kind: 'fn', verify: (x) => { const [Q1, , Q3] = quartiles(a); return near(x.v, Q3 - Q1); } } } },
        ];
      },
    },
  ],
};
