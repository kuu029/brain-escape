// 英語 第3段階: 現在完了（継続・経験・完了）
import { pp, past, ing, third } from './lex.js';
import { frameQ, orderAns, textChoice } from './kit-en.js';
import { cap } from './gram.js';

const SUBJ = [
  { en: 'I', ja: '私', s3: false }, { en: 'we', ja: '私たち', s3: false }, { en: 'Ken', ja: 'ケン', s3: true },
  { en: 'my sister', ja: '私の姉', s3: true }, { en: 'they', ja: '彼ら', s3: false }, { en: 'Yumi', ja: 'ユミ', s3: true },
];
const SUBJ_Q = SUBJ.filter((s) => s.en !== 'I' && s.en !== 'we').concat([{ en: 'you', ja: 'あなた', s3: false }]);
const hv = (s) => (s.s3 ? 'has' : 'have');

// 継続（ずっと〜している）: v, obj, 日本語（〜しています）
const CONT = [
  ['live', 'in Osaka', '大阪に住んでいます', '大阪に住んでいません', '大阪に住んでいますか'],
  ['know', 'Ken', 'ケンを知っています', 'ケンを知りません', 'ケンを知っていますか'],
  ['study', 'English', '英語を勉強しています', '英語を勉強していません', '英語を勉強していますか'],
  ['play', 'the piano', 'ピアノをひいています', 'ピアノをひいていません', 'ピアノをひいていますか'],
  ['want', 'a dog', '犬をほしいと思っています', '犬をほしいと思っていません', '犬をほしいと思っていますか'],
  ['stay', 'in Japan', '日本に滞在しています', '日本に滞在していません', '日本に滞在していますか'],
];
const FOR = [['three years', '3年間'], ['five years', '5年間'], ['a long time', '長い間'], ['two weeks', '2週間']];
const SINCE = [['2015', '2015年から'], ['last year', '去年から'], ['last month', '先月から'], ['yesterday', '昨日から']];
// 経験（〜したことがある）
// [動詞, 目的語, 「〜した」, 「〜しました」]
const EXP = [
  ['visit', 'Kyoto', '京都を訪れた', '京都を訪れました'], ['see', 'a panda', 'パンダを見た', 'パンダを見ました'],
  ['eat', 'natto', '納豆を食べた', '納豆を食べました'], ['climb', 'that mountain', 'あの山に登った', 'あの山に登りました'],
  ['read', 'this book', 'この本を読んだ', 'この本を読みました'], ['hear', 'this song', 'この歌を聞いた', 'この歌を聞きました'],
  ['write', 'a letter in English', '英語で手紙を書いた', '英語で手紙を書きました'], ['make', 'a cake', 'ケーキを作った', 'ケーキを作りました'],
];
const TIMES = [['once', '1回'], ['twice', '2回'], ['three times', '3回'], ['many times', '何度も']];
// 完了（ちょうど〜した・もう〜した・まだ〜していない）
const DONE = [
  ['finish', 'the homework', '宿題を終え'], ['eat', 'lunch', '昼食を食べ'], ['clean', 'the room', '部屋をそうじし'],
  ['wash', 'the dishes', '皿を洗い'], ['read', 'the letter', 'その手紙を読み'], ['write', 'the report', 'レポートを書き'],
];

function pick(rng, kind) {
  const subj = rng.pick(SUBJ);
  if (kind === 'cont') {
    const c = rng.pick(CONT);
    const useFor = rng.chance(0.5);
    const [d, dj] = rng.pick(useFor ? FOR : SINCE);
    return { subj, v: c[0], obj: c[1], tail: `${useFor ? 'for' : 'since'} ${d}`, ja: `${subj.ja}は${dj}${c[2]}。`, prep: useFor ? 'for' : 'since', dur: d };
  }
  if (kind === 'exp') {
    const e = rng.pick(EXP);
    const [t, tj] = rng.pick(TIMES);
    return { subj, v: e[0], obj: e[1], tail: t, ja: `${subj.ja}は${e[2]}ことが${tj}あります。` };
  }
  const d = rng.pick(DONE);
  const just = rng.chance(0.5);
  return { subj, v: d[0], obj: d[1], adv: just ? 'just' : 'already', ja: `${subj.ja}は${just ? 'ちょうど' : 'もう'}${d[2]}${just ? 'たところです' : 'ました'}。` };
}
const chunksOf = (x) => [x.subj.en, hv(x.subj), ...(x.adv ? [x.adv] : []), pp(x.v), x.obj];

function genForm(rng) {
  const x = pick(rng, rng.pick(['cont', 'exp', 'done']));
  const right = pp(x.v);
  const at = x.adv ? 3 : 2;
  const ws = [past(x.v), x.v, ing(x.v), third(x.v)].filter((w) => w !== right).slice(0, 3);
  return {
    ...frameQ(rng, {
      chunks: chunksOf(x).map((c, i) => (i === 0 ? cap(c) : c)), at, correct: right, tail: x.tail || '', ja: x.ja,
      wrongs: ws.map((w) => ({ t: w, msg: `現在完了は have / has ＋ 過去分詞。${x.v} の過去分詞は ${right}。` })),
    }),
    hint: '現在完了 ＝ have / has ＋ 過去分詞。「ずっと〜している」「〜したことがある」「〜したところだ」を表す。',
    steps: [`have / has ＋ 過去分詞`, `${x.v} → ${right}`],
  };
}

function genHave(rng) {
  const x = pick(rng, rng.pick(['cont', 'exp']));
  const right = hv(x.subj);
  return {
    ...frameQ(rng, {
      chunks: chunksOf(x).map((c, i) => (i === 0 ? cap(c) : c)), at: 1, correct: right, tail: x.tail, ja: x.ja,
      wrongs: [{ t: right === 'has' ? 'have' : 'has', msg: `主語が ${x.subj.en} なら ${right}。` }, { t: x.subj.s3 ? 'is' : 'are', msg: '現在完了は be動詞ではなく have / has。' }, { t: 'did', msg: '現在完了は have / has ＋ 過去分詞。' }],
    }),
    hint: '主語が3人称単数なら has、それ以外は have。',
    steps: [`主語 ${x.subj.en} → ${right}`],
  };
}

function genForSince(rng) {
  const x = pick(rng, 'cont');
  const chunks = [...chunksOf(x).map((c, i) => (i === 0 ? cap(c) : c)), x.prep, x.dur];
  return {
    ...frameQ(rng, {
      chunks, at: chunks.length - 2, correct: x.prep, ja: x.ja,
      wrongs: [
        { t: x.prep === 'for' ? 'since' : 'for', msg: x.prep === 'for' ? '「〜の間」（期間の長さ）は for。since は「〜から」（始まった時）。' : '「〜から」（始まった時）は since。for は「〜の間」（期間の長さ）。' },
        { t: 'from', msg: '現在完了の「〜から（ずっと）」は since。' },
        { t: 'ago', msg: 'ago は「〜前に」。過去形で使い、前に期間を置く（three years ago）。' },
      ],
    }),
    hint: 'for ＋ 期間の長さ（for three years）／ since ＋ 始まった時（since 2015）',
    steps: [`${x.dur} → ${x.prep === 'for' ? '期間の長さ → for' : '始まった時 → since'}`],
  };
}

// 経験の疑問文・答え方、never
function genExp(rng) {
  const e = rng.pick(EXP);
  const kind = rng.pick(['ever', 'answer', 'never']);
  if (kind === 'ever') {
    return {
      ...frameQ(rng, {
        chunks: ['Have', 'you', 'ever', pp(e[0]), e[1]], at: 3, correct: pp(e[0]), end: '?', ja: `あなたは今までに${e[2]}ことがありますか？`,
        wrongs: [past(e[0]), e[0], ing(e[0])].filter((w) => w !== pp(e[0])).map((w) => ({ t: w, msg: `Have you ever ＋ 過去分詞 〜?。${e[0]} → ${pp(e[0])}。` })),
      }),
      hint: '「今までに〜したことがありますか」→ Have you ever ＋ 過去分詞 〜?',
      steps: [`Have you ever ${pp(e[0])} ${e[1]}?`],
    };
  }
  if (kind === 'never') {
    const s = rng.pick(SUBJ);
    return {
      ...frameQ(rng, {
        chunks: [cap(s.en), hv(s), 'never', pp(e[0]), e[1]], at: 2, correct: 'never', ja: `${s.ja}は一度も${e[2]}ことがありません。`,
        wrongs: [{ t: 'ever', msg: 'ever は疑問文で使う。「一度も〜ない」は never。' }, { t: 'yet', msg: 'yet は文の最後に置く（まだ）。「一度も〜ない」は never。' }, { t: 'ago', msg: '「一度も〜ない」は have never ＋ 過去分詞。' }],
      }),
      hint: '「一度も〜したことがない」→ have / has never ＋ 過去分詞',
      steps: [`${s.en} ${hv(s)} never ${pp(e[0])} ...`],
    };
  }
  const yes = rng.chance(0.5);
  return {
    stem: `質問に「${yes ? 'はい' : 'いいえ'}」で答えよう\nHave you ever ${pp(e[0])} ${e[1]}?`,
    ...textChoice(rng, yes ? 'Yes, I have.' : 'No, I have not.', [
      { t: yes ? 'Yes, I did.' : 'No, I did not.', msg: 'Have you 〜? の質問には have で答える。' },
      { t: yes ? 'Yes, I do.' : 'No, I do not.', msg: 'Have you 〜? の質問には have で答える。' },
      { t: yes ? 'Yes, I am.' : 'No, I am not.', msg: 'Have you 〜? の質問には have で答える。' },
    ]),
    hint: 'Have you 〜? → Yes, I have. / No, I have not.',
    steps: [`答え: ${yes ? 'Yes, I have.' : 'No, I have not.'}`],
    check: { kind: 'en-perf-ans', yes },
  };
}

// 完了: just / already / yet
function genDone(rng) {
  const d = rng.pick(DONE);
  const s = rng.pick(SUBJ);
  const kind = rng.pick(['just', 'already', 'yet']);
  if (kind === 'yet') {
    return {
      ...frameQ(rng, {
        chunks: [cap(s.en), hv(s), 'not', pp(d[0]), d[1], 'yet'], at: 5, correct: 'yet', ja: `${s.ja}はまだ${d[2]}ていません。`,
        wrongs: [{ t: 'just', msg: 'just（ちょうど）は have と過去分詞の間に置く。否定文の「まだ」は yet。' }, { t: 'ago', msg: '現在完了に ago は使わない。' }, { t: 'ever', msg: '否定文の「まだ〜していない」は yet。' }],
      }),
      hint: '「まだ〜していない」→ have not ＋ 過去分詞 〜 yet（yet は文の最後）',
      steps: [`${s.en} ${hv(s)} not ${pp(d[0])} ${d[1]} yet.`],
    };
  }
  const ja = kind === 'just' ? `${s.ja}はちょうど${d[2]}たところです。` : `${s.ja}はもう${d[2]}ました。`;
  return {
    ...frameQ(rng, {
      chunks: [cap(s.en), hv(s), kind, pp(d[0]), d[1]], at: 2, correct: kind, ja,
      wrongs: [{ t: 'yet', msg: 'yet は否定文・疑問文の最後で使う。' }, { t: 'ago', msg: '現在完了に ago は使わない。' }, { t: 'ever', msg: 'ever は疑問文（今までに）で使う。' }],
    }),
    hint: 'ちょうど → just、もう（すでに）→ already。どちらも have と過去分詞の間。',
    steps: [`${kind === 'just' ? 'ちょうど → just' : 'もう → already'}`],
  };
}

// 現在完了か過去形か
function genVs(rng) {
  const s = rng.pick(SUBJ);
  if (rng.chance(0.5)) {
    const c = rng.pick(CONT);
    const [d, dj] = rng.pick(SINCE);
    const right = `${hv(s)} ${pp(c[0])}`;
    return {
      ...frameQ(rng, {
        chunks: [cap(s.en), right, c[1], 'since', d], at: 1, correct: right, ja: `${s.ja}は${dj}${c[2]}。`,
        wrongs: [{ t: past(c[0]), msg: 'since（〜からずっと）は現在完了と使う。' }, { t: s.s3 ? third(c[0]) : c[0], msg: 'since（〜からずっと）は現在完了と使う。' }, { t: `${s.s3 ? 'has' : 'have'} ${ing(c[0])}`, msg: 'have / has のあとは過去分詞。' }],
      }),
      hint: 'since / for 〜（ずっと）→ 現在完了。yesterday / last 〜 / 〜 ago → 過去形。',
      steps: ['since → 現在完了', `→ ${right}`],
    };
  }
  const e = rng.pick(EXP);
  const [t, tj] = rng.pick([['last year', '去年'], ['yesterday', '昨日'], ['two years ago', '2年前に']]);
  const right = past(e[0]);
  return {
    ...frameQ(rng, {
      chunks: [cap(s.en), right, e[1]], at: 1, correct: right, tail: t, ja: `${s.ja}は${tj}${e[3]}。`,
      wrongs: [{ t: `${hv(s)} ${pp(e[0])}`, msg: `${t} のように「いつ」がはっきりした過去は、現在完了ではなく過去形。` }, { t: s.s3 ? third(e[0]) : e[0], msg: `${t} は過去。` }, { t: `${s.s3 ? 'is' : 'are'} ${ing(e[0])}`, msg: `${t} は過去。` }],
    }),
    hint: 'yesterday / last 〜 / 〜 ago など「過去のいつ」がある文は過去形（現在完了にしない）。',
    steps: [`${t} → 過去形`, `→ ${right}`],
  };
}

// How long / How many times
function genHow(rng) {
  const s = rng.pick(SUBJ_Q);
  if (rng.chance(0.5)) {
    const c = rng.pick(CONT.filter((x) => x[0] !== 'want'));
    return {
      ...frameQ(rng, {
        chunks: ['How', 'long', hv(s), s.en, pp(c[0]), c[1]], at: 2, correct: hv(s), end: '?', ja: `${s.ja}はどのくらいの間${c[4]}？`,
        wrongs: [{ t: hv(s) === 'has' ? 'have' : 'has', msg: `主語が ${s.en} なら ${hv(s)}。` }, { t: s.s3 ? 'does' : 'do', msg: '現在完了の疑問文は have / has を前へ。' }, { t: s.s3 ? 'is' : 'are', msg: '現在完了の疑問文は have / has を前へ。' }],
      }),
      hint: '「どのくらい（ずっと）〜していますか」→ How long have / has ＋ 主語 ＋ 過去分詞 〜?',
      steps: [`How long ${hv(s)} ${s.en} ${pp(c[0])} ...?`],
    };
  }
  const e = rng.pick(EXP);
  return {
    ...frameQ(rng, {
      chunks: ['How', 'many', 'times', hv(s), s.en, pp(e[0]), e[1]], at: 3, correct: hv(s), end: '?', ja: `${s.ja}は何回${e[2]}ことがありますか？`,
      // does / did は read のように原形・過去形と同じ過去分詞だと正しい文になるので使わない
      wrongs: [{ t: hv(s) === 'has' ? 'have' : 'has', msg: `主語が ${s.en} なら ${hv(s)}。` }, { t: s.s3 ? 'is' : 'are', msg: '現在完了の疑問文は have / has を前へ。' }, { t: s.s3 ? 'was' : 'were', msg: '現在完了の疑問文は have / has を前へ。' }],
    }),
    hint: '「何回〜したことがありますか」→ How many times have / has ＋ 主語 ＋ 過去分詞 〜?',
    steps: [`How many times ${hv(s)} ${s.en} ${pp(e[0])} ...?`],
  };
}

function genOrder(rng) {
  const kind = rng.pick(['cont', 'exp', 'done', 'q']);
  if (kind === 'q') {
    const e = rng.pick(EXP);
    return finish(rng, ['Have', 'you', 'ever', pp(e[0]), e[1]], '', `あなたは今までに${e[2]}ことがありますか？`, '?', past(e[0]) !== pp(e[0]) ? past(e[0]) : 'did');
  }
  const x = pick(rng, kind);
  const decoy = past(x.v) !== pp(x.v) ? past(x.v) : x.subj.s3 ? 'is' : 'are';
  return finish(rng, chunksOf(x), x.tail || '', x.ja, '.', decoy);
}
function finish(rng, chunks, tail, ja, end, decoy) {
  return {
    stem: `日本語に合うように並べかえよう\n${ja}`,
    ...orderAns(rng, chunks, { tail, end, decoys: [{ t: decoy, msg: '現在完了は have / has ＋ 過去分詞。' }] }),
    hint: 'have / has ＋（just / already / never）＋ 過去分詞',
    steps: ['have / has ＋ 過去分詞のかたまりを作る'],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-perfect',
  subject: 'english',
  stage: 3,
  area: '屋上・時計塔',
  title: '現在完了',
  emoji: '⏳',
  prereqs: ['en-past'],
  tool: 'rewind',
  hintCard: [
    'have / has ＋ 過去分詞',
    '継続: ずっと〜している（for 期間 ／ since 始まり）、How long 〜?',
    '経験: 〜したことがある（once, twice, 〜 times, never, ever）',
    '完了: just（ちょうど）／ already（もう）／ yet（否定: まだ、疑問: もう）',
    'yesterday / last 〜 / 〜 ago と現在完了はいっしょに使わない',
  ],
  generators: {
    'pf-form': { difficulty: 1, gen: genForm },
    'pf-have': { difficulty: 1, gen: genHave },
    'pf-forsince': { difficulty: 2, gen: genForSince },
    'pf-exp': { difficulty: 2, gen: genExp },
    'pf-done': { difficulty: 2, gen: genDone },
    'pf-vs': { difficulty: 2, gen: genVs },
    'pf-how': { difficulty: 2, gen: genHow },
    'pf-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'pf-l1',
      title: '継続（ずっと〜している）',
      unlocks: ['pf-form', 'pf-have', 'pf-forsince'],
      build(rng) {
        return [
          { text: '過去から今までずっと続いていることは have / has ＋ 過去分詞。', en: 'I have lived in Osaka for three years.\nKen has lived in Osaka since 2015.' },
          { text: 'for ＋ 期間の長さ（3年間）、since ＋ 始まった時（2015年から）。' },
          { text: 'やってみよう。', q: genForm(rng) },
          { text: 'for か since か。', q: genForSince(rng) },
        ];
      },
    },
    {
      id: 'pf-l2',
      title: '経験（〜したことがある）',
      unlocks: ['pf-exp', 'pf-how'],
      build(rng) {
        return [
          { text: '「〜したことがある」も現在完了。回数は once, twice, three times。', en: 'I have visited Kyoto twice.\nHave you ever visited Kyoto?\n— Yes, I have.\nI have never visited Kyoto.' },
          { text: 'やってみよう。', q: genExp(rng) },
          { text: 'もう1問。', q: genHow(rng) },
        ];
      },
    },
    {
      id: 'pf-l3',
      title: '完了（〜したところ）',
      unlocks: ['pf-done', 'pf-vs', 'pf-order'],
      build(rng) {
        return [
          { text: '「ちょうど〜したところ」「もう〜した」も現在完了。', en: 'I have just finished my homework.\nI have already eaten lunch.\nI have not finished it yet.' },
          { text: '⚠️ yesterday や ago のように「過去のいつ」があるときは過去形。', en: '× I have visited Kyoto last year.\n○ I visited Kyoto last year.' },
          { text: 'やってみよう。', q: genDone(rng) },
          { text: '現在完了？ 過去形？', q: genVs(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
