// 英語 第3段階: 仮定法過去（If I were 〜, I would 〜. ／ I wish 〜.）
import { frameQ, orderAns } from './kit-en.js';

// if: if の節（v に [正しい形, 今の形, 主語に合わせた今の形, will 〜]）× そのとき「〜するのに」（主節）の組み合わせ
// res: [主節, would / could, 日本語の後半]
const IF_C = [
  { s: 'I', v: ['were', 'am', 'is', 'will be'], rest: ['a bird'], ja: 'もし私が鳥なら', res: [[['I', 'could', 'fly'], 'could', '飛べるのに'], [['I', 'could', 'fly', 'to you'], 'could', 'あなたのところへ飛んで行けるのに']] },
  { s: 'I', v: ['were', 'am', 'is', 'will be'], rest: ['you'], ja: 'もし私があなたなら', res: [[['I', 'would', 'ask', 'the teacher'], 'would', '先生にたずねるのに'], [['I', 'would', 'study', 'harder'], 'would', 'もっと一生けんめい勉強するのに'], [['I', 'would', 'tell', 'her'], 'would', '彼女に話すのに']] },
  { s: 'I', v: ['had', 'have', 'has', 'will have'], rest: ['a lot of money'], ja: 'もしたくさんお金があれば', res: [[['I', 'would', 'buy', 'a new computer'], 'would', '新しいコンピューターを買うのに'], [['I', 'would', 'buy', 'a big house'], 'would', '大きな家を買うのに'], [['I', 'could', 'visit', 'many countries'], 'could', 'たくさんの国を訪れることができるのに']] },
  { s: 'I', v: ['had', 'have', 'has', 'will have'], rest: ['time'], ja: 'もし時間があれば', res: [[['I', 'could', 'play', 'tennis', 'with you'], 'could', 'あなたとテニスができるのに'], [['I', 'would', 'read', 'more books'], 'would', 'もっと本を読むのに'], [['I', 'could', 'help', 'you'], 'could', 'あなたを手伝えるのに']] },
  { s: 'it', v: ['were', 'is', 'are', 'will be'], rest: ['sunny', 'today'], ja: 'もし今日晴れていたら', res: [[['we', 'could', 'go', 'to the beach'], 'could', '浜辺へ行けるのに'], [['we', 'could', 'play', 'soccer'], 'could', 'サッカーができるのに']] },
  { s: 'I', v: ['knew', 'know', 'knows', 'will know'], rest: ['her phone number'], ja: 'もし彼女の電話番号を知っていたら', res: [[['I', 'would', 'call', 'her'], 'would', '電話するのに'], [['I', 'could', 'call', 'her'], 'could', '電話できるのに']] },
  { s: 'I', v: ['knew', 'know', 'knows', 'will know'], rest: ['the answer'], ja: 'もし答えを知っていたら', res: [[['I', 'would', 'tell', 'you'], 'would', 'あなたに教えるのに']] },
  { s: 'I', v: ['lived', 'live', 'lives', 'will live'], rest: ['near the sea'], ja: 'もし海の近くに住んでいたら', res: [[['I', 'would', 'swim', 'every day'], 'would', '毎日泳ぐのに'], [['I', 'could', 'swim', 'every day'], 'could', '毎日泳げるのに']] },
  { s: 'I', v: ['had', 'have', 'has', 'will have'], rest: ['a car'], ja: 'もし車を持っていたら', res: [[['I', 'would', 'drive', 'to the sea'], 'would', '海まで運転して行くのに'], [['I', 'could', 'visit', 'my grandmother'], 'could', '祖母をたずねることができるのに']] },
  { s: 'he', v: ['were', 'is', 'am', 'will be'], rest: ['here'], ja: 'もし彼がここにいたら', res: [[['he', 'would', 'help', 'us'], 'would', '私たちを手伝ってくれるのに']] },
];
const IF_T = IF_C.flatMap((c) => c.res.map(([main, mod, ja]) => ({ s: c.s, v: c.v, rest: c.rest, main, mod, ja: `${c.ja}、${ja}。` })));
// I wish 〜
const WISH_T = [
  { v: ['had', 'have', 'has', 'will have'], rest: ['a dog'], ja: '犬を飼っていればいいのに。' },
  { v: ['could', 'can', 'will', 'am'], rest: ['speak', 'English', 'well'], ja: '英語をじょうずに話せたらいいのに。' },
  { v: ['were', 'am', 'is', 'will be'], rest: ['a bird'], ja: '私が鳥だったらいいのに。' },
  { v: ['knew', 'know', 'knows', 'will know'], rest: ['the answer'], ja: '答えを知っていたらいいのに。' },
  { v: ['could', 'can', 'will', 'am'], rest: ['fly'], ja: '空を飛べたらいいのに。' },
  { v: ['had', 'have', 'has', 'will have'], rest: ['a brother'], ja: '兄弟がいたらいいのに。' },
  { v: ['lived', 'live', 'lives', 'will live'], rest: ['in Hawaii'], ja: 'ハワイに住んでいたらいいのに。' },
  { v: ['had', 'have', 'has', 'will have'], rest: ['a car'], ja: '車を持っていればいいのに。' },
  { v: ['had', 'have', 'has', 'will have'], rest: ['more time'], ja: 'もっと時間があればいいのに。' },
  { v: ['could', 'can', 'will', 'am'], rest: ['play', 'the piano'], ja: 'ピアノがひけたらいいのに。' },
  { v: ['could', 'can', 'will', 'am'], rest: ['swim', 'fast'], ja: '速く泳げたらいいのに。' },
  { v: ['were', 'am', 'is', 'will be'], rest: ['rich'], ja: '私がお金持ちならいいのに。' },
  { v: ['knew', 'know', 'knows', 'will know'], rest: ['her name'], ja: '彼女の名前を知っていたらいいのに。' },
  { v: ['lived', 'live', 'lives', 'will live'], rest: ['near the sea'], ja: '海の近くに住んでいたらいいのに。' },
];
const cap = (w) => w[0].toUpperCase() + w.slice(1);

// if の中の動詞（過去形・were）
function genIf(rng) {
  const x = rng.pick(IF_T);
  const front = rng.chance(0.6);
  const sub = [x.s, x.v[0], ...x.rest];
  const chunks = front ? ['If', ...sub, ',', ...x.main] : [cap(x.main[0]), ...x.main.slice(1), 'if', ...sub];
  const at = chunks.indexOf(x.v[0]);
  return {
    ...frameQ(rng, {
      chunks, at, correct: x.v[0], ja: x.ja,
      wrongs: x.v.slice(1).map((w) => ({ t: w, msg: '「もし〜なら（実際はちがう）」は、if の中を過去形にする。be動詞は主語が何でも were。' })),
    }),
    hint: '今の事実とちがうこと → If ＋ 主語 ＋ 過去形（be動詞は were）, 主語 ＋ would / could ＋ 原形.',
    steps: ['事実とちがう仮定 → if の中は過去形', `→ ${x.v[0]}`],
  };
}

// 主節の would / could
function genWould(rng) {
  const x = rng.pick(IF_T);
  const sub = [x.s, x.v[0], ...x.rest];
  const chunks = ['If', ...sub, ',', ...x.main];
  const at = chunks.indexOf(x.mod);
  return {
    ...frameQ(rng, {
      chunks, at, correct: x.mod, ja: x.ja,
      wrongs: [
        { t: x.mod === 'would' ? 'will' : 'can', msg: 'if の中が過去形（事実とちがう仮定）なら、主節も過去の形 would / could。' },
        { t: x.mod === 'would' ? 'can' : 'will', msg: 'if の中が過去形（事実とちがう仮定）なら、主節も過去の形 would / could。' },
        { t: 'did', msg: '主節は would / could ＋ 原形。' },
      ],
    }),
    hint: '「〜するのに」→ would ＋ 原形、「〜できるのに」→ could ＋ 原形',
    steps: [`「${x.mod === 'would' ? '〜するのに' : '〜できるのに'}」→ ${x.mod}`],
  };
}

function genWish(rng) {
  const x = rng.pick(WISH_T);
  return {
    ...frameQ(rng, {
      chunks: ['I', 'wish', 'I', x.v[0], ...x.rest], at: 3, correct: x.v[0], ja: x.ja,
      wrongs: x.v.slice(1).map((w) => ({ t: w, msg: 'I wish 〜（〜ならいいのに）の中は過去形（be動詞は were、can は could）。' })),
    }),
    hint: 'I wish ＋ 主語 ＋ 過去形（were / had / could 〜）で「〜ならいいのに」',
    steps: ['I wish のあと → 過去形', `→ ${x.v[0]}`],
  };
}

function genOrder(rng) {
  if (rng.chance(0.4)) {
    const x = rng.pick(WISH_T);
    return {
      stem: `日本語に合うように並べかえよう\n${x.ja}`,
      ...orderAns(rng, ['I', 'wish', 'I', x.v[0], ...x.rest], { decoys: [{ t: x.v[1], msg: 'I wish のあとは過去形！' }] }),
      hint: 'I wish ＋ 主語 ＋ 過去形', steps: ['I wish I ＋ 過去形'], check: { kind: 'en-order' },
    };
  }
  const x = rng.pick(IF_T);
  return {
    stem: `日本語に合うように並べかえよう\n${x.ja}`,
    ...orderAns(rng, [...x.main, 'if', x.s, x.v[0], ...x.rest], { decoys: [{ t: x.mod === 'would' ? 'will' : 'can', msg: '事実とちがう仮定なので would / could！' }] }),
    hint: '主語 ＋ would / could ＋ 原形 〜 if ＋ 主語 ＋ 過去形 〜.',
    steps: [`${x.main.join(' ')} if ...`],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-subjunctive',
  subject: 'english',
  stage: 3,
  area: '自由へのヘリポート',
  title: '仮定法',
  emoji: '🚁',
  prereqs: ['en-conj'],
  tool: 'heal',
  hintCard: [
    '今の事実とちがうこと: If ＋ 主語 ＋ 過去形, 主語 ＋ would / could ＋ 原形',
    'be動詞は主語が何でも were（If I were a bird, 〜）',
    '〜ならいいのに: I wish ＋ 主語 ＋ 過去形（I wish I had 〜 / I wish I could 〜）',
  ],
  generators: {
    'sj-if': { difficulty: 1, gen: genIf },
    'sj-would': { difficulty: 2, gen: genWould },
    'sj-wish': { difficulty: 2, gen: genWish },
    'sj-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'sj-l1',
      title: 'If I were 〜',
      unlocks: ['sj-if', 'sj-would'],
      build(rng) {
        return [
          { text: '「もし〜なら、…するのに」（本当はそうじゃない）は、if の中を過去形、主節を would / could にする。', en: 'If I had time, I would play tennis.\n（実際は時間がない）' },
          { text: 'be動詞は主語が I でも he でも were。', en: 'If I were a bird, I could fly.' },
          { text: 'やってみよう。', q: genIf(rng) },
          { text: 'もう1問。', q: genWould(rng) },
        ];
      },
    },
    {
      id: 'sj-l2',
      title: 'I wish 〜',
      unlocks: ['sj-wish', 'sj-order'],
      build(rng) {
        return [
          { text: '「〜ならいいのに」は I wish ＋ 過去形。', en: 'I wish I had a dog.\nI wish I could fly.\nI wish I were a bird.' },
          { text: 'やってみよう。', q: genWish(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
