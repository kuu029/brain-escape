// 英語 第3段階: 仮定法過去（If I were 〜, I would 〜. ／ I wish 〜.）
import { frameQ, orderAns } from './kit-en.js';

// if: if の節（v に [正しい形, 今の形, 主語に合わせた今の形, will 〜]）、main: 主節（mod に would / could）
const IF_T = [
  { s: 'I', v: ['were', 'am', 'is', 'will be'], rest: ['a bird'], main: ['I', 'could', 'fly'], mod: 'could', ja: 'もし私が鳥なら、飛べるのに。' },
  { s: 'I', v: ['were', 'am', 'is', 'will be'], rest: ['you'], main: ['I', 'would', 'ask', 'the teacher'], mod: 'would', ja: 'もし私があなたなら、先生にたずねるのに。' },
  { s: 'I', v: ['had', 'have', 'has', 'will have'], rest: ['a lot of money'], main: ['I', 'would', 'buy', 'a new computer'], mod: 'would', ja: 'もしたくさんお金があれば、新しいコンピューターを買うのに。' },
  { s: 'I', v: ['had', 'have', 'has', 'will have'], rest: ['time'], main: ['I', 'could', 'play', 'tennis', 'with you'], mod: 'could', ja: 'もし時間があれば、あなたとテニスができるのに。' },
  { s: 'it', v: ['were', 'is', 'are', 'will be'], rest: ['sunny', 'today'], main: ['we', 'could', 'go', 'to the beach'], mod: 'could', ja: 'もし今日晴れていたら、浜辺へ行けるのに。' },
  { s: 'I', v: ['knew', 'know', 'knows', 'will know'], rest: ['her phone number'], main: ['I', 'would', 'call', 'her'], mod: 'would', ja: 'もし彼女の電話番号を知っていたら、電話するのに。' },
  { s: 'I', v: ['lived', 'live', 'lives', 'will live'], rest: ['near the sea'], main: ['I', 'would', 'swim', 'every day'], mod: 'would', ja: 'もし海の近くに住んでいたら、毎日泳ぐのに。' },
  { s: 'I', v: ['had', 'have', 'has', 'will have'], rest: ['a car'], main: ['I', 'would', 'drive', 'to the sea'], mod: 'would', ja: 'もし車を持っていたら、海まで運転して行くのに。' },
  { s: 'he', v: ['were', 'is', 'am', 'will be'], rest: ['here'], main: ['he', 'would', 'help', 'us'], mod: 'would', ja: 'もし彼がここにいたら、私たちを手伝ってくれるのに。' },
];
// I wish 〜
const WISH_T = [
  { v: ['had', 'have', 'has', 'will have'], rest: ['a dog'], ja: '犬を飼っていればいいのに。' },
  { v: ['could', 'can', 'will', 'am'], rest: ['speak', 'English', 'well'], ja: '英語をじょうずに話せたらいいのに。' },
  { v: ['were', 'am', 'is', 'will be'], rest: ['a bird'], ja: '私が鳥だったらいいのに。' },
  { v: ['knew', 'know', 'knows', 'will know'], rest: ['the answer'], ja: '答えを知っていたらいいのに。' },
  { v: ['could', 'can', 'will', 'am'], rest: ['fly'], ja: '空を飛べたらいいのに。' },
  { v: ['had', 'have', 'has', 'will have'], rest: ['a brother'], ja: '兄弟がいたらいいのに。' },
  { v: ['lived', 'live', 'lives', 'will live'], rest: ['in Hawaii'], ja: 'ハワイに住んでいたらいいのに。' },
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
