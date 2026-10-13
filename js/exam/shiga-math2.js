// 入試本番モード（数学）の大問③の追加パターン: 滋賀県の入試によく出る形
//   ・関数の利用（料金プランのくらべ方: 一次関数のグラフ・交点・「どちらが安いか」）
//   ・規則性（マッチ棒・碁石の並び方: n 番目の数・式・何番目・全部でいくつ）
//   どちらも4問・20点（大問③の関数と図形と同じ配点）
import { m, numAns, choice } from '../units/kit.js';
import { plane } from '../units/stage3/fig.js';

// ---------- 関数の利用: 料金プラン ----------
const PLACES = [
  { what: '市民プール', unit: '回', verb: '利用' },
  { what: 'スポーツジム', unit: '回', verb: '利用' },
  { what: '動画レンタル', unit: '本', verb: 'レンタル' },
  { what: '自転車のシェアサービス', unit: '回', verb: '利用' },
];

export function secPlan(rng) {
  let p, q, k, mm, b, c;
  do {
    p = rng.pick([500, 600, 700, 800]);
    q = rng.pick([200, 300, 400]);
    k = rng.int(4, 8);
    mm = rng.int(k + 3, k + 8);
    b = k * (p - q); // A と B が同じ料金になるのは k 回
    c = b + mm * q; // B と C が同じ料金になるのは mm 回
  } while (p - q < 200 || c > 9000);
  const P = rng.pick(PLACES);
  const u = P.unit;
  const A = (x) => p * x, B = (x) => q * x + b, C = () => c;
  // 3つの中で B がいちばん安い回数（1〜60回を全部調べる）
  const bBest = (x) => B(x) < A(x) && B(x) < C(x);
  const xMax = mm + 3;
  const yMax = Math.ceil(Math.max(c, B(xMax)) / 1000) + 1;
  const fig = plane({
    x: [0, xMax], y: [0, yMax],
    fns: [
      { f: (x) => A(x) / 1000, label: 'A', labelX: Math.min(xMax * 0.8, (yMax * 1000 * 0.85) / p) },
      { f: (x) => B(x) / 1000, dash: true, label: 'B', labelX: xMax * 0.86 },
      { f: () => c / 1000, label: 'C', labelX: xMax * 0.2 },
    ],
    grid: false,
  }, { w: 250, h: 200 });
  const ys = [{ key: 'x', text: `${P.verb}の${u}数`, suffix: u }, { key: 'y', text: '料金', suffix: '円' }];
  return {
    title: '関数の利用',
    intro: `ある${P.what}には、次の3つの料金プランがある。1か月に ${m('x')} ${u}${P.verb}したときの料金を ${m('y')} 円とする。
プランA: 1${u}ごとに ${p} 円
プランB: 1か月 ${b} 円の会費と、1${u}ごとに ${q} 円
プランC: 1か月 ${c} 円で、何${u}でも${P.verb}できる
図は、3つのプランの ${m('x')} と ${m('y')} の関係をグラフに表したものである（${m('y')} は千円単位）。`,
    fig,
    qs: [
      { pts: 4, p: { unit: 'linear-function', stem: `プランBについて、${m('y')} を ${m('x')} の式で表しなさい。`, ...choice(rng, `y=${q}x+${b}`, [{ tex: `y=${p}x+${b}` }, { tex: `y=${q}x` }, { tex: `y=${b}x+${q}` }, { tex: `y=${q}x-${b}` }]), hint: '会費（はじめから払う分）が切片、1回ごとの料金が傾き。', steps: [`${m(`x=0`)} のとき ${m(`y=${b}`)}（会費）、1${u}ふえるごとに ${q} 円ふえる`, m(`y=${q}x+${b}`)], check: { kind: 'graph', pts: [[0, b], [1, b + q], [k, p * k]] } } },
      { pts: 5, p: { unit: 'linear-function', stem: `プランAとプランBの料金が同じになるのは、何${u}${P.verb}したときか。また、そのときの料金を求めなさい。`, ...numAns(ys, { x: k, y: p * k }, { wrong: [{ vals: { x: k + 1, y: p * (k + 1) }, msg: '2つの式を連立して、交点を求める。' }] }), hint: `${m(`${p}x=${q}x+${b}`)} を解く。`, steps: [`${m(`${p}x=${q}x+${b}`)}`, `${m(`${p - q}x=${b}`)} より ${m(`x=${k}`)}`, `${m(`y=${p}\\times ${k}=${p * k}`)}`], check: { kind: 'fn', verify: (v) => v.x === k && A(v.x) === v.y && B(v.x) === v.y } } },
      { pts: 5, p: { unit: 'linear-function', stem: `プランBのほうがプランAより安くなるのは、何${u}以上${P.verb}したときか。`, ...numAns([{ key: 'v', text: '', suffix: `${u}以上` }], { v: k + 1 }, { wrong: [{ vals: { v: k }, msg: `${k}${u}のときは同じ料金。「安くなる」のはその次から。` }] }), hint: `グラフで、Bの線がAの線より下にあるところ。交点は ${m(`x=${k}`)}。`, steps: [`${k}${u}で同じ料金（交点）`, `それより多いとBのほうが安いので、${k + 1}${u}以上`], check: { kind: 'fn', verify: (v) => B(v.v) < A(v.v) && !(B(v.v - 1) < A(v.v - 1)) } } },
      { pts: 6, p: { unit: 'linear-function', stem: `3つのプランのうち、プランBの料金がいちばん安くなるのは、何${u}以上何${u}以下${P.verb}したときか。`, ...numAns([{ key: 'lo', text: '', suffix: `${u}以上` }, { key: 'hi', text: '', suffix: `${u}以下` }], { lo: k + 1, hi: mm - 1 }, { wrong: [{ vals: { lo: k, hi: mm }, msg: 'ちょうど同じ料金になる回数は「いちばん安い」に入らない。' }] }), hint: 'BとAの交点、BとCの交点を求めて、そのあいだ。', steps: [`BとAが同じ: ${m(`x=${k}`)}`, `BとCが同じ: ${m(`${q}x+${b}=${c}`)} より ${m(`x=${mm}`)}`, `そのあいだなので、${k + 1}${u}以上 ${mm - 1}${u}以下`], check: { kind: 'fn', verify: (v) => { for (let x = 1; x <= 60; x++) if (bBest(x) !== (x >= v.lo && x <= v.hi)) return false; return true; } } } },
    ],
  };
}

// ---------- 規則性: マッチ棒・碁石 ----------
//   f(n): n 番目の数、tex: n の式、wrongs: まちがえやすい式
const PATTERNS = [
  { what: 'マッチ棒', cnt: '本', make: '正方形を横1列につなげた図形', f: (n) => 3 * n + 1, tex: '3n+1', wrongs: ['4n', '3n', '4n-1', '3n-1'], how: '1つ目の正方形は4本、そのあと1つふえるごとに3本ずつふえる。' },
  { what: 'マッチ棒', cnt: '本', make: '正三角形を、上向き・下向きを交互にして横1列につなげた図形', f: (n) => 2 * n + 1, tex: '2n+1', wrongs: ['3n', '2n', '3n-1', 'n+2'], how: '1つ目の正三角形は3本、そのあと1つふえるごとに2本ずつふえる。' },
  { what: '碁石', cnt: '個', make: '1辺に ($n+1$) 個ずつ並べて正方形の形にした図形（まわりだけ）', f: (n) => 4 * n, tex: '4n', wrongs: ['4n+4', '4n-4', 'n^{2}', '4(n+1)-1'], how: '4つの辺に (n+1) 個ずつ並べると、4つのかどを2回数えるので4をひく。' },
  { what: '碁石', cnt: '個', make: '1段目に1個、2段目に2個、…と、$n$ 段の三角形の形に並べた図形', f: (n) => (n * (n + 1)) / 2, tex: '\\frac{n(n+1)}{2}', wrongs: ['n^{2}', '\\frac{n(n-1)}{2}', '2n-1', 'n(n+1)'], how: '1+2+…+n。同じ三角形をさかさにして合わせると、たて n、横 (n+1) の長方形になる。' },
];

export function secPattern(rng) {
  const T = rng.pick(PATTERNS);
  const { cnt } = T;
  const ask1 = rng.int(6, 9); // 表は4番目まで。少し先を考えさせる
  let n0;
  do n0 = rng.int(9, 20); while (n0 === ask1);
  const N = T.f(n0);
  const upto = rng.int(5, 8);
  const sum = Array.from({ length: upto }, (_, i) => T.f(i + 1)).reduce((a, x) => a + x, 0);
  const table = [1, 2, 3, 4].map((n) => `${n}番目: ${T.f(n)}${cnt}`).join('　');
  const lin = !T.tex.includes('frac');
  return {
    title: '規則性',
    intro: `${T.what}を使って、${T.make}を、1番目、2番目、3番目、…と順に作っていく。それぞれに使う${T.what}の数は、次のようになった。
${table}　…`,
    qs: [
      { pts: 4, p: { unit: 'expressions', stem: `${ask1}番目の図形に使う${T.what}は何${cnt}か。`, ...numAns([{ key: 'v', text: '', suffix: cnt }], { v: T.f(ask1) }, { wrong: [{ vals: { v: T.f(ask1 - 1) }, msg: `${ask1 - 1}番目の数になっている。もう1つ先まで。` }] }), hint: T.how, steps: [`ふえ方の決まりを見つける: ${T.how}`, `${ask1}番目は ${T.f(ask1)}${cnt}`], check: { kind: 'fn', verify: (v) => v.v === T.f(ask1) } } },
      { pts: 5, p: { unit: 'expressions', stem: `${m('n')} 番目の図形に使う${T.what}の数を、${m('n')} を使った式で表しなさい。`, ...choice(rng, T.tex, T.wrongs.map((tex) => ({ tex }))), hint: T.how, steps: [T.how, `${m('n')} 番目は ${m(T.tex)}${cnt}`, `たしかめ: ${m('n=1')} のとき ${T.f(1)}${cnt}、${m('n=2')} のとき ${T.f(2)}${cnt}`], check: { kind: 'identity', expr: T.tex, vars: ['n'] } } },
      { pts: 5, p: { unit: lin ? 'linear-equations' : 'quadratic', stem: `${T.what}を ${N}${cnt}使うのは、何番目の図形か。`, ...numAns([{ key: 'v', text: '', suffix: '番目' }], { v: n0 }, { wrong: [{ vals: { v: n0 + 1 }, msg: '式に代入してたしかめよう。' }] }), hint: `${m(`${T.tex}=${N}`)} を解く。`, steps: [`${m(`${T.tex}=${N}`)}`, `${m(`n=${n0}`)}（たしかめ: ${n0}番目は ${N}${cnt}）`], check: { kind: 'fn', verify: (v) => Number.isInteger(v.v) && T.f(v.v) === N } } },
      { pts: 6, p: { unit: 'expressions', stem: `1番目から ${upto}番目までの図形を、それぞれ別々に作る。${T.what}は全部で何${cnt}必要か。`, ...numAns([{ key: 'v', text: '', suffix: cnt }], { v: sum }, { wrong: [{ vals: { v: T.f(upto) }, msg: `${upto}番目だけでなく、1番目からぜんぶたす。` }] }), hint: `1番目から ${upto}番目までの数を、全部たす。`, steps: [m(`${Array.from({ length: upto }, (_, i) => T.f(i + 1)).join('+')}=${sum}`)], check: { kind: 'fn', verify: (v) => v.v === sum } } },
    ],
  };
}
