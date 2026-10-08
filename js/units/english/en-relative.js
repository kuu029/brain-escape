// 英語 第3段階: 関係代名詞（who / which / that）
import { frameQ, orderAns } from './kit-en.js';
import { ing as ingOf } from './lex.js';
import { cap } from './gram.js';

// 主格（who / which ＋ 動詞）。pre: 前の部分、n: 先行詞、person: 人か、rel: 関係代名詞のあとのチャンク、post: 後ろ（主語の位置のとき）
// 人の先行詞 × 説明（who 〜）の組み合わせ。pja: 日本語の型（{x} に「〜する」が入る）
const WHO_PRE = [
  { pre: 'I have', n: 'a friend', pja: '私には{x}友だちがいます。' },
  { pre: 'I know', n: 'a girl', pja: '私は{x}女の子を知っています。' },
  { pre: 'I know', n: 'a boy', pja: '私は{x}男の子を知っています。' },
  { pre: 'Ken has', n: 'a sister', pja: 'ケンには{x}姉がいます。' },
  { pre: 'We have', n: 'a teacher', pja: '私たちには{x}先生がいます。' },
];
const WHO_DO = [
  { v: ['lives', 'live'], rest: ['in Kyoto'], ja: '京都に住んでいる' },
  { v: ['can', 'can'], rest: ['speak', 'French'], ja: 'フランス語を話せる', modal: true },
  { v: ['plays', 'play'], rest: ['the piano', 'well'], ja: 'ピアノをじょうずにひく' },
  { v: ['speaks', 'speak'], rest: ['three languages'], ja: '3つの言語を話す' },
  { v: ['likes', 'like'], rest: ['cats'], ja: 'ねこが好きな' },
  { v: ['can', 'can'], rest: ['swim', 'very fast'], ja: 'とても速く泳げる', modal: true },
];
const SUBJ_REL = [
  ...WHO_PRE.flatMap((p) => WHO_DO.map((d) => ({ pre: p.pre, n: p.n, person: true, v: d.v, rest: d.rest, ja: p.pja.replace('{x}', d.ja), modal: d.modal }))),
  { pre: 'This is', n: 'the dog', person: false, v: ['runs', 'run'], rest: ['very fast'], ja: 'これはとても速く走る犬です。' },
  { pre: 'I like', n: 'books', person: false, pl: true, v: ['have', 'has'], rest: ['many pictures'], ja: '私は絵がたくさんある本が好きです。' },
  { pre: 'We have', n: 'a teacher', person: true, v: ['comes', 'come'], rest: ['from Canada'], ja: '私たちにはカナダ出身の先生がいます。' },
  { pre: 'I want', n: 'a bike', person: false, v: ['goes', 'go'], rest: ['very fast'], ja: '私はとても速く走る自転車がほしいです。' },
  { pre: 'She has', n: 'a cat', person: false, v: ['sleeps', 'sleep'], rest: ['all day'], ja: '彼女は一日中眠っているねこを飼っています。' },
  { post: 'is my father', n: 'the man', person: true, v: ['is', 'are'], rest: ['talking', 'with Ken'], ja: 'ケンと話している男性は私の父です。' },
  { pre: 'This is', n: 'the cat', person: false, v: ['sleeps', 'sleep'], rest: ['on the sofa'], ja: 'これはソファーで眠るねこです。' },
  { pre: 'I have', n: 'a dog', person: false, v: ['likes', 'like'], rest: ['apples'], ja: '私はりんごが好きな犬を飼っています。' },
  { pre: 'I want', n: 'a car', person: false, v: ['runs', 'run'], rest: ['very fast'], ja: '私はとても速く走る車がほしいです。' },
  { post: 'is my brother', n: 'the boy', person: true, v: ['is', 'are'], rest: ['running', 'in the park'], ja: '公園で走っている男の子は私の弟です。' },
  { post: 'is my mother', n: 'the woman', person: true, v: ['is', 'are'], rest: ['singing', 'on the stage'], ja: 'ステージで歌っている女性は私の母です。' },
  { post: 'is Yumi', n: 'the girl', person: true, v: ['lives', 'live'], rest: ['next to me'], ja: '私のとなりに住んでいる女の子はユミです。' },
];
// 目的格（which ＋ 主語 ＋ 動詞）
// もの（目的格）× 前の部分の組み合わせ
const OBJ_PRE = { 'This is': (x) => `これは${x}です。`, 'I like': (x) => `私は${x}が好きです。`, 'I lost': (x) => `私は${x}をなくしました。` };
const OBJ_CL = [
  { n: 'the book', nja: '本', s: 'I', v: 'bought', rest: ['yesterday'], ja: '私が昨日買った', pre: ['This is', 'I like', 'I lost'] },
  { n: 'the book', nja: '本', s: 'my father', v: 'gave', rest: ['me'], ja: '父がくれた', pre: ['This is', 'I like', 'I lost'] },
  { n: 'the bag', nja: 'かばん', s: 'my mother', v: 'made', rest: [], ja: '母が作った', pre: ['This is', 'I like', 'I lost'] },
  { n: 'the pen', nja: 'ペン', s: 'Ken', v: 'gave', rest: ['me'], ja: 'ケンがくれた', pre: ['This is', 'I lost'] },
  { n: 'the picture', nja: '写真', s: 'Ken', v: 'took', rest: ['in Kyoto'], ja: 'ケンが京都でとった', pre: ['This is', 'I like', 'I lost'] },
  { n: 'the song', nja: '歌', s: 'we', v: 'sang', rest: ['at school'], ja: '私たちが学校で歌った', pre: ['This is', 'I like'] },
  { n: 'the letter', nja: '手紙', s: 'Yumi', v: 'wrote', rest: [], ja: 'ユミが書いた', pre: ['This is', 'I lost'] },
];
const OBJ_REL = [
  ...OBJ_CL.flatMap((c) => c.pre.map((pre) => ({ pre, n: c.n, s: c.s, v: c.v, rest: c.rest, ja: OBJ_PRE[pre](c.ja + c.nja) }))),
  { post: 'was delicious', n: 'the cake', s: 'my mother', v: 'made', rest: [], ja: '母が作ったケーキはとてもおいしかったです。' },
  { post: 'was exciting', n: 'the movie', s: 'we', v: 'saw', rest: ['last night'], ja: '私たちが昨夜見た映画はわくわくしました。' },
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
