// 英語 第3段階: 関係代名詞（who / which / that）
import { frameQ, orderAns } from './kit-en.js';
import { ing as ingOf } from './lex.js';
import { cap } from './gram.js';

// 主格（who / which ＋ 動詞）。pre: 前の部分、n: 先行詞、person: 人か、rel: 関係代名詞のあとのチャンク、post: 後ろ（主語の位置のとき）
const SUBJ_REL = [
  { pre: 'I have', n: 'a friend', person: true, v: ['lives', 'live'], rest: ['in Kyoto'], ja: '私には京都に住んでいる友だちがいます。' },
  { pre: 'I know', n: 'a girl', person: true, v: ['can', 'can'], rest: ['speak', 'French'], ja: '私はフランス語を話せる女の子を知っています。', modal: true },
  { pre: 'This is', n: 'the dog', person: false, v: ['runs', 'run'], rest: ['very fast'], ja: 'これはとても速く走る犬です。' },
  { pre: 'I like', n: 'books', person: false, pl: true, v: ['have', 'has'], rest: ['many pictures'], ja: '私は絵がたくさんある本が好きです。' },
  { pre: 'Ken has', n: 'a sister', person: true, v: ['plays', 'play'], rest: ['the piano', 'well'], ja: 'ケンにはピアノをじょうずにひく姉がいます。' },
  { pre: 'We have', n: 'a teacher', person: true, v: ['comes', 'come'], rest: ['from Canada'], ja: '私たちにはカナダ出身の先生がいます。' },
  { pre: 'I want', n: 'a bike', person: false, v: ['goes', 'go'], rest: ['very fast'], ja: '私はとても速く走る自転車がほしいです。' },
  { pre: 'I know', n: 'a boy', person: true, v: ['speaks', 'speak'], rest: ['three languages'], ja: '私は3つの言語を話す男の子を知っています。' },
  { pre: 'She has', n: 'a cat', person: false, v: ['sleeps', 'sleep'], rest: ['all day'], ja: '彼女は一日中眠っているねこを飼っています。' },
  { post: 'is my father', n: 'the man', person: true, v: ['is', 'are'], rest: ['talking', 'with Ken'], ja: 'ケンと話している男性は私の父です。' },
  { post: 'is Yumi', n: 'the girl', person: true, v: ['lives', 'live'], rest: ['next to me'], ja: '私のとなりに住んでいる女の子はユミです。' },
];
// 目的格（which ＋ 主語 ＋ 動詞）
const OBJ_REL = [
  { pre: 'This is', n: 'the book', s: 'I', v: 'bought', rest: ['yesterday'], ja: 'これは私が昨日買った本です。' },
  { post: 'was delicious', n: 'the cake', s: 'my mother', v: 'made', rest: [], ja: '母が作ったケーキはとてもおいしかったです。' },
  { post: 'was exciting', n: 'the movie', s: 'we', v: 'saw', rest: ['last night'], ja: '私たちが昨夜見た映画はわくわくしました。' },
  { pre: 'This is', n: 'the picture', s: 'Ken', v: 'took', rest: ['in Kyoto'], ja: 'これはケンが京都でとった写真です。' },
  { pre: 'I lost', n: 'the pen', s: 'my father', v: 'gave', rest: ['me'], ja: '私は父がくれたペンをなくしました。' },
  { pre: 'This is', n: 'the bag', s: 'I', v: 'want', rest: [], ja: 'これは私がほしいかばんです。' },
  { pre: 'I like', n: 'the song', s: 'you', v: 'sang', rest: ['yesterday'], ja: '私はあなたが昨日歌った歌が好きです。' },
];
const REL_JA = { who: '人', which: 'もの・動物' };

function chunksSubj(x, rel, verb) {
  const inner = [rel, verb, ...x.rest];
  return x.post ? [cap(x.n), ...inner, ...x.post.split(' ')] : [...x.pre.split(' '), x.n, ...inner];
}
function chunksObj(x, rel) {
  const inner = [rel, x.s, x.v, ...x.rest];
  return x.post ? [cap(x.n), ...inner, ...x.post.split(' ')] : [...x.pre.split(' '), x.n, ...inner];
}

// who / which を選ぶ
function genChoose(rng) {
  const obj = rng.chance(0.35);
  const x = rng.pick(obj ? OBJ_REL : SUBJ_REL);
  const person = obj ? false : x.person;
  const right = person ? 'who' : 'which';
  const chunks = obj ? chunksObj(x, right) : chunksSubj(x, right, x.v[0]);
  const at = chunks.indexOf(right);
  return {
    ...frameQ(rng, {
      chunks, at, correct: right, ja: x.ja,
      wrongs: [
        { t: person ? 'which' : 'who', msg: `${x.n} は${person ? '人' : 'もの・動物'}。${person ? '人 → who' : 'もの・動物 → which'}。` },
        { t: 'what', msg: 'what は名詞のあとに置いて説明することはできない。' },
        { t: 'whose', msg: 'whose のあとには名詞が続く（whose name 〜）。' },
      ],
    }),
    hint: '先行詞（説明される名詞）が人 → who、もの・動物 → which（どちらも that でもOK）',
    steps: [`${x.n} → ${REL_JA[right]} → ${right}`],
  };
}

// 主格の関係代名詞のあとの動詞（先行詞に合わせる）
function genVerb(rng) {
  const x = rng.pick(SUBJ_REL.filter((s) => !s.modal));
  const rel = x.person ? 'who' : 'which';
  const chunks = chunksSubj(x, rel, x.v[0]);
  const at = chunks.indexOf(rel) + 1;
  const base = x.v[1];
  const ing = x.v[0] === 'is' ? 'being' : ingOf(base);
  return {
    ...frameQ(rng, {
      chunks, at, correct: x.v[0], ja: x.ja,
      wrongs: [
        { t: x.v[1], msg: `${rel} のあとの動詞は先行詞（${x.n}）に合わせる。${x.pl ? '複数' : '単数'} → ${x.v[0]}。` },
        { t: ing, msg: `${rel} のあとには主語 ＋ 動詞の形（動詞は先行詞に合わせる）。` },
        ...(x.v[0] === 'is' ? [] : [{ t: `is ${base}`, msg: 'be動詞と動詞の原形はいっしょに使わない。' }]),
      ],
    }),
    hint: 'who / which のあとの動詞は、先行詞（説明される名詞）に合わせる（a friend who lives 〜）',
    steps: [`先行詞 ${x.n} → ${x.pl ? '複数' : '3人称単数'} → ${x.v[0]}`],
  };
}

function genOrder(rng) {
  const obj = rng.chance(0.5);
  const x = rng.pick(obj ? OBJ_REL : SUBJ_REL);
  const rel = obj ? 'which' : x.person ? 'who' : 'which';
  const inner = obj ? [x.n, rel, x.s, x.v, ...x.rest] : [x.n, rel, x.v[0], ...x.rest];
  return {
    stem: `日本語に合うように並べかえよう\n${x.ja}`,
    ...orderAns(rng, inner, { prefix: x.pre || '', tail: x.post || '', decoys: [{ t: 'what', msg: '名詞を説明するのは who / which / that。what は使わない！' }] }),
    hint: '名詞 ＋ who / which ＋（主語）＋ 動詞 〜 のかたまりで名詞を説明する。',
    steps: [`${inner.join(' ')}`],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-relative',
  subject: 'english',
  stage: 3,
  area: '屋上・ロープ',
  title: '関係代名詞',
  emoji: '🪢',
  prereqs: ['en-wh'],
  tool: 'mega',
  hintCard: [
    '名詞 ＋ who / which / that ＋ 〜 で、名詞を後ろから説明する',
    '人 → who、もの・動物 → which、どちらも → that',
    'a friend who lives in Kyoto（主格: who のあとに動詞）',
    'the book which I bought（目的格: which のあとに 主語 ＋ 動詞）',
  ],
  generators: {
    'rl-choose': { difficulty: 1, gen: genChoose },
    'rl-verb': { difficulty: 2, gen: genVerb },
    'rl-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'rl-l1',
      title: 'who / which',
      unlocks: ['rl-choose', 'rl-verb'],
      build(rng) {
        return [
          { text: '名詞を「文」で説明したいときは、名詞のあとに who / which をつないで文を続ける。', en: 'I have a friend.\n＋ He lives in Kyoto.\n→ I have a friend who lives in Kyoto.' },
          { text: '人 → who、もの・動物 → which。that はどちらにも使える。' },
          { text: 'やってみよう。', q: genChoose(rng) },
          { text: 'who のあとの動詞の形は？', q: genVerb(rng) },
        ];
      },
    },
    {
      id: 'rl-l2',
      title: '目的格と並べかえ',
      unlocks: ['rl-order'],
      build(rng) {
        return [
          { text: 'which のあとに「主語 ＋ 動詞」が来る形もある（目的格）。', en: 'This is the book.\n＋ I bought it yesterday.\n→ This is the book which I bought yesterday.' },
          { text: '主語の位置にも置ける。動詞を見失わないように！', en: 'The man who is talking with Ken is my father.' },
          { text: 'やってみよう。', q: genChoose(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
