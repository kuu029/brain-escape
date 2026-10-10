// 国語 第3段階: 漢文の返り点（レ点・一二点・一二三点）で読む順番
//   問題は「型」（レ・一二 など）をつなげて作り、読む順番は readOrder() で計算する。
//   型ごとの読む順番（手で書いた答え）とも、テストで照らし合わせる
import { jaChoice, textChoice } from './kit-ja.js';

// 返り点にしたがって読む順番（字の番号の配列）。marks[i] は null・'レ'・'一'・'二'・'三'
export function readOrder(marks) {
  const out = [];
  const re = [];
  const held = {};
  marks.forEach((m, i) => {
    if (m === 'レ') { re.push(i); return; }
    if (m === '二' || m === '三') { held[m] = i; return; }
    out.push(i);
    while (re.length) out.push(re.pop());
    if (m === '一' && held['二'] !== undefined) {
      out.push(held['二']);
      delete held['二'];
      if (held['三'] !== undefined) { out.push(held['三']); delete held['三']; }
    }
  });
  return out;
}

// 型: [返り点の並び, 型の中での読む順（手で書いた答え）]
export const SEGS = [
  [[null], [0]],
  [['レ', null], [1, 0]],
  [['レ', 'レ', null], [2, 1, 0]],
  [['二', null, '一'], [1, 2, 0]],
  [['二', null, null, '一'], [1, 2, 3, 0]],
  [[null, '二', null, '一'], [0, 2, 3, 1]],
  [['三', null, '二', null, '一'], [1, 3, 4, 2, 0]],
];
const POOL = [...'学時習人知書読登山見花聞声行友遠方来水火風月雪春秋夢道心'];

function build(rng) {
  const n = rng.int(2, 3);
  const segs = [];
  let len = 0;
  for (let k = 0; k < n; k++) {
    const s = k === 0 ? rng.pick(SEGS.slice(1)) : rng.pick(SEGS);
    if (len + s[0].length > 7) break;
    segs.push(s);
    len += s[0].length;
  }
  const marks = segs.flatMap((s) => s[0]);
  const expect = [];
  let off = 0;
  for (const s of segs) { expect.push(...s[1].map((i) => i + off)); off += s[0].length; }
  const chars = rng.shuffle(POOL).slice(0, marks.length);
  return { marks, chars, expect };
}
// 漢文の表示（字の右下に小さく返り点）
const figOf = (chars, marks) => `<div class="kanbun">${chars.map((c, i) => `<span class="kb-c">${c}${marks[i] ? `<sub class="kb-m">${marks[i]}</sub>` : ''}</span>`).join('')}</div>`;
const RULE = 'レ点: 下の1字を先に読んで、すぐ上の字に返る ／ 一二点: 一のついた字まで読んだら、二の字に返る（三があれば、そのあと三へ）';

function genOrder(rng) {
  const { marks, chars, expect } = build(rng);
  const order = readOrder(marks);
  const answer = order.map((i) => chars[i]);
  const tiles = rng.shuffle([...answer]);
  return {
    stem: '次の漢文を、返り点にしたがって読む順にならべよう。',
    fig: figOf(chars, marks),
    input: { kind: 'order', tiles, answer, prefix: '', suffix: '', extra: 0 },
    answerText: answer.join(' → '),
    wrong: [],
    hint: RULE,
    steps: [RULE, `読む順: ${answer.join(' → ')}`],
    check: { kind: 'ja-order', verify: (ans) => ans.join('') === expect.map((i) => chars[i]).join('') },
  };
}
function genNth(rng) {
  const { marks, chars, expect } = build(rng);
  const order = readOrder(marks);
  const at = rng.int(0, marks.length - 1);
  const nth = order.indexOf(at) + 1;
  const ws = [...Array(marks.length).keys()].map((i) => i + 1).filter((k) => k !== nth).map((k) => ({ t: `${k}番目` }));
  return {
    stem: `次の漢文で、「${chars[at]}」は何番目に読む？`,
    fig: figOf(chars, marks),
    ...textChoice(rng, `${nth}番目`, rng.shuffle(ws)),
    hint: RULE,
    steps: [`読む順: ${order.map((i) => chars[i]).join(' → ')}`, `「${chars[at]}」は ${nth} 番目`],
    check: { kind: 'fn', verify: (t) => t === `${expect.indexOf(at) + 1}番目` },
  };
}

export default {
  id: 'ja-kaeriten',
  subject: 'japanese',
  stage: 3,
  area: '国語棟・漢文の塔',
  title: '漢文の返り点',
  emoji: '🪃',
  prereqs: ['ja-kana'],
  tool: 'wall',
  hintCard: [
    'レ点: 下の1字を読んでから、すぐ上の1字に返る（読レ書 → 書を読む）',
    'レ点が続いたら、いちばん下から順に上へ返る',
    '一二点: 二字以上はなれて返る。一の字まで読んだら二へ、そのあと三へ',
    '返り点のない字は、上から順に読む',
  ],
  generators: {
    'kt-order': { difficulty: 2, gen: genOrder },
    'kt-nth': { difficulty: 1, gen: genNth },
  },
  lessons: [
    {
      id: 'kt-l1',
      title: 'レ点',
      unlocks: ['kt-nth'],
      build(rng) {
        return [
          { text: '漢文は、日本語の順番に直して読む。そのための記号が「返り点」。' },
          { text: 'レ点: すぐ下の1字を先に読んで、上に返る。\n例: 読レ書 → 書 → 読（書を読む）\nレ点が2つ続いたら、下から順に上へ。', q: genNth(rng) },
          { text: 'もう1問。', q: genNth(rng) },
        ];
      },
    },
    {
      id: 'kt-l2',
      title: '一二点',
      unlocks: ['kt-order'],
      build(rng) {
        return [
          { text: '一二点: 2字以上はなれて返るときに使う。\n「二」の字は飛ばして、「一」の字まで読んだら「二」に返る。三があれば、そのあと三。' },
          { text: '読む順にならべてみよう。', q: genOrder(rng) },
          { text: 'もう1問。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
