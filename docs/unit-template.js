// 単元ファイルのひな型。
// 使い方:
//   1. このファイルを js/units/stage3/（または stage1, stage2）にコピーして名前を変える
//      例: js/units/stage3/linear-function.js
//   2. 下の中身を書きかえる
//   3. js/units/registry.js に import を1行、UNITS に1行足す
//      （stage3/placeholders.js にある同じ id の「工事中」行は消す）
//   4. node tests/verify.mjs で検算 → node tools/update-sw.mjs → 公開
//
// ルール:
//   - 答えは必ずプログラムで計算する（手で書いた答えを埋め込まない）
//   - check に「表示した式」を入れると、テストが別ルートで検算してくれる
//       value:     { kind: 'value', expr: '式', vals: {x: 2} }        … 式の値 = 答え
//       equations: { kind: 'equations', eqs: ['式=式', ...] }          … 答えを代入すると成り立つ
//       roots:     { kind: 'roots', eq: '2次方程式' }                  … 2次方程式の解
//       identity:  { kind: 'identity', expr: '式', vars: ['x'] }       … 選んだ式が元の式と同じ
//       eqstep:    { kind: 'eqstep', eqs: [...], sol: {x:1} }          … 途中式が正しい
//       transform: { kind: 'transform', eq: '式', var: 'y', others: ['x'] } … 等式変形
//       fn:        { kind: 'fn', verify: (答え) => true/false }        … 上で書けないとき
//   - 数式は $...$ の中に書く。使える記法: \frac{a}{b}  \sqrt{x}  x^{2}  \times  \div  \pm  \sys{式1}{式2}
import { tnum, tpar } from '../../core/fmt.js';
import { Poly } from '../../core/poly.js';
import { numAns, m } from '../kit.js'; // 選択式なら choice / polyChoice も使える

// 例: y = ax + b のグラフが点 (p, q) を通るときの b を求める
function genExample(rng) {
  const a = rng.nz(-5, 5);
  const p = rng.nz(-4, 4);
  const b = rng.nz(-9, 9);
  const q = a * p + b; // 先に答え(b)を決めてから問題を作る → 答えがきれいになる
  return {
    stem: `直線 ${m(`y=${Poly.lin(a, 0).toTex()}+b`)} が点 ${m(`(${p},\\ ${q})`)} を通る。${m('b')} を求めよ。`,
    ...numAns([['b', 'b']], { b }, { wrong: [{ vals: { b: q + a * p }, msg: '移項で符号が変わる！' }] }),
    hint: '通る点の $x$, $y$ を式に代入する。',
    steps: [`${m(`${q}=${tnum(a)}\\times${tpar(p)}+b`)}`, `${m(`b=${b}`)}`],
    check: { kind: 'equations', eqs: [`${q}=${tnum(a)}\\times${tpar(p)}+b`] },
  };
}

export default {
  id: 'example-unit', // 半角英数とハイフン。ほかと重ならないように
  stage: 3,
  area: '外壁の上', // マップに出るエリア名
  title: '一次関数（例）',
  emoji: '📉',
  prereqs: ['linear-equations'], // この単元を開けるのに必要な単元
  tool: 'coins', // 訓練を全部クリアしたときの道具（js/game/content.js の TOOLS）
  hintCard: ['思い出しカードに出る要点を3〜5行で'],
  generators: {
    'ex-b': { difficulty: 1, gen: genExample }, // difficulty: 1=やさしい 2=ふつう 3=むずかしい
  },
  lessons: [
    {
      id: 'ex-l1',
      title: '切片を求める',
      unlocks: ['ex-b'], // この訓練をクリアすると練習ウェーブに出る生成器
      build(rng) {
        const p = genExample(rng);
        return [
          { text: '1ステップ = 1操作。まずは説明だけのステップ。', math: 'y=ax+b' },
          { text: '小問つきのステップ（正解するまで次に進めない）', q: p },
        ];
      },
    },
  ],
  // 過去問（固定の問題）。ボスウェーブに混ざる。答えはやはり check で検算される
  pastExams: [
    // {
    //   id: 'shiga-2025-1-3',
    //   origin: '滋賀県 2025 大問1(3)',
    //   difficulty: 3,
    //   problem: () => ({ stem: '...', ...numAns(...), hint: '...', steps: [...], check: {...} }),
    // },
  ],
};
