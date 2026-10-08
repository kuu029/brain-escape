// 英語 第3段階: 名詞を後ろから説明する分詞（-ing ／ 過去分詞）
import { ing, pp, past, third } from './lex.js';
import { frameQ, orderAns } from './kit-en.js';
import { cap } from './gram.js';

// -ing（〜している）: 人 × していること × 「〜です」の組み合わせ（約100通り）＋ 動物など
// 人: g = 性別（「〜です」の部分を合わせる）
const PEOPLE = [
  { n: 'the boy', nja: '男の子', main: [['is Ken', 'ケンです'], ['is my brother', '私の弟です'], ['is my friend', '私の友だちです']] },
  { n: 'the girl', nja: '女の子', main: [['is Yumi', 'ユミです'], ['is my sister', '私の姉です'], ['is my friend', '私の友だちです']] },
  { n: 'the man', nja: '男性', main: [['is my father', '私の父です'], ['is my teacher', '私の先生です'], ['is Tom', 'トムです']] },
  { n: 'the woman', nja: '女性', main: [['is my mother', '私の母です'], ['is my teacher', '私の先生です'], ['is a famous singer', '有名な歌手です']] },
];
const DOING = [
  { v: 'play', obj: 'tennis', ja: 'テニスをしている' },
  { v: 'read', obj: 'a book', ja: '本を読んでいる' },
  { v: 'talk', obj: 'with Ken', ja: 'ケンと話している' },
  { v: 'run', obj: 'in the park', ja: '公園で走っている' },
  { v: 'wash', obj: 'the car', ja: '車を洗っている' },
  { v: 'sing', obj: 'on the stage', ja: 'ステージで歌っている' },
  { v: 'play', obj: 'the piano', ja: 'ピアノをひいている' },
  { v: 'walk', obj: 'with a dog', ja: '犬と歩いている' },
];
const ACT = [
  ...PEOPLE.flatMap((p) => DOING.flatMap((d) => p.main.map(([main, mja]) => ({ n: p.n, nja: p.nja, v: d.v, obj: d.obj, ja: d.ja, main, mja })))),
  { n: 'the cat', nja: 'ねこ', v: 'sleep', obj: 'on the sofa', ja: 'ソファーで眠っている', main: 'is very cute', mja: 'とてもかわいいです' },
  { n: 'the dog', nja: '犬', v: 'run', obj: 'in the park', ja: '公園で走っている', main: 'is mine', mja: '私の犬です' },
  { n: 'the children', nja: '子どもたち', v: 'swim', obj: 'in the river', ja: '川で泳いでいる', main: 'are my friends', mja: '私の友だちです', pl: true },
];
// 過去分詞（〜された）: もの × 前の部分（This is など）。pre: 前に固定で置く部分
const PRE = {
  'This is': (x) => `これは${x}です。`,
  'I have': (x) => `私は${x}を持っています。`,
  'I want': (x) => `私は${x}がほしいです。`,
  'I read': (x) => `私は${x}を読みました。`,
  'I ate': (x) => `私は${x}を食べました。`,
};
const THINGS = [
  { n: 'a picture', nja: '写真', v: 'take', obj: 'by my father', ja: '父によってとられた', pre: ['This is', 'I have', 'I want'] },
  { n: 'a picture', nja: '写真', v: 'take', obj: 'in Kyoto', ja: '京都でとられた', pre: ['This is', 'I have'] },
  { n: 'a car', nja: '車', v: 'make', obj: 'in Japan', ja: '日本で作られた', pre: ['This is', 'I have', 'I want'] },
  { n: 'a book', nja: '本', v: 'write', obj: 'by a famous writer', ja: '有名な作家によって書かれた', pre: ['This is', 'I have', 'I want', 'I read'] },
  { n: 'a book', nja: '本', v: 'write', obj: 'in English', ja: '英語で書かれた', pre: ['This is', 'I have', 'I want', 'I read'] },
  { n: 'a letter', nja: '手紙', v: 'write', obj: 'in English', ja: '英語で書かれた', pre: ['This is', 'I have', 'I read'] },
  { n: 'a letter', nja: '手紙', v: 'write', obj: 'by my friend', ja: '友だちによって書かれた', pre: ['This is', 'I read'] },
  { n: 'a cake', nja: 'ケーキ', v: 'make', obj: 'by my mother', ja: '母によって作られた', pre: ['This is', 'I want', 'I ate'] },
  { n: 'a house', nja: '家', v: 'build', obj: 'by my grandfather', ja: '祖父によって建てられた', pre: ['This is', 'I want'] },
  { n: 'a bike', nja: '自転車', v: 'make', obj: 'in Japan', ja: '日本で作られた', pre: ['This is', 'I have', 'I want'] },
  { n: 'a language', nja: '言語', v: 'speak', obj: 'in many countries', ja: '多くの国で話されている', pre: ['This is'] },
  { n: 'a song', nja: '歌', v: 'sing', obj: 'by many people', ja: '多くの人々に歌われている', pre: ['This is'] },
];
const PASS = [
  ...THINGS.flatMap((t) => t.pre.map((pre) => ({ ...t, pre, all: PRE[pre](t.ja + t.nja) }))),
  { pre: 'English is', n: 'a language', nja: '言語', v: 'speak', obj: 'in many countries', ja: '多くの国で話されている', all: '英語は多くの国で話されている言語です。' },
  { pre: 'I like', n: 'the song', nja: '歌', v: 'sing', obj: 'by that singer', ja: 'あの歌手によって歌われた', all: '私はあの歌手によって歌われた歌が好きです。' },
];

function genForm(rng) {
  if (rng.chance(0.5)) {
    const x = rng.pick(ACT);
    const right = ing(x.v);
    const ws = [pp(x.v), third(x.v), x.v].filter((w, i, a) => w !== right && a.indexOf(w) === i);
    return {
      ...frameQ(rng, {
        chunks: [cap(x.n), right, x.obj, ...x.main.split(' ')], at: 1, correct: right, ja: `${x.ja}${x.nja}は${x.mja}。`,
        wrongs: ws.map((w) => ({ t: w, msg: `「${x.ja}${x.nja}」→ 名詞 ＋ -ing（〜している）で後ろから説明する。` })),
      }),
      hint: '名詞 ＋ -ing 〜（〜している名詞）／ 名詞 ＋ 過去分詞 〜（〜された名詞）',
      steps: [`${x.n} が「${x.ja.replace(/る$/, '')}」→ 〜している → ${right}`],
    };
  }
  const x = rng.pick(PASS);
  const right = pp(x.v);
  const ws = [ing(x.v), past(x.v), third(x.v)].filter((w, i, a) => w !== right && a.indexOf(w) === i);
  return {
    ...frameQ(rng, {
      chunks: [...x.pre.split(' '), x.n, right, x.obj], at: x.pre.split(' ').length + 1, correct: right, ja: x.all,
      wrongs: ws.map((w) => ({ t: w, msg: `「${x.ja}${x.nja}」→ 〜された → 名詞 ＋ 過去分詞（${right}）。` })),
    }),
    hint: '「〜された名詞」は 名詞 ＋ 過去分詞 〜。「〜している名詞」は 名詞 ＋ -ing 〜。',
    steps: [`${x.n} は「${x.ja}」→ 〜された → 過去分詞 ${right}`],
  };
}

function genOrder(rng) {
  if (rng.chance(0.5)) {
    const x = rng.pick(ACT);
    return {
      stem: `日本語に合うように並べかえよう\n${x.ja}${x.nja}は${x.mja}。`,
      ...orderAns(rng, [x.n, ing(x.v), x.obj], { tail: x.main, decoys: [{ t: third(x.v), msg: `名詞を後ろから説明するときは -ing（${ing(x.v)}）。` }] }),
      hint: '名詞 ＋ -ing 〜 のかたまりで主語を作る（The boy playing tennis）。',
      steps: [`${x.n} ${ing(x.v)} ${x.obj}`],
      check: { kind: 'en-order' },
    };
  }
  const x = rng.pick(PASS);
  const decoy = past(x.v) !== pp(x.v) ? past(x.v) : ing(x.v);
  return {
    stem: `日本語に合うように並べかえよう\n${x.all}`,
    ...orderAns(rng, [x.n, pp(x.v), x.obj], { prefix: x.pre, decoys: [{ t: decoy, msg: `「〜された」は過去分詞（${pp(x.v)}）。` }] }),
    hint: '名詞 ＋ 過去分詞 ＋ 〜（〜された名詞）',
    steps: [`${x.n} ${pp(x.v)} ${x.obj}`],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-participle',
  subject: 'english',
  stage: 3,
  area: '屋上・はしご',
  title: '後ろから説明する分詞',
  emoji: '🪜',
  prereqs: ['en-prog'],
  tool: 'sniper',
  hintCard: [
    '名詞 ＋ -ing 〜: 〜している名詞（the boy playing tennis）',
    '名詞 ＋ 過去分詞 〜: 〜された名詞（a picture taken by my father）',
    '人・動物が「している」→ -ing、ものが「された」→ 過去分詞',
  ],
  generators: {
    'pt-form': { difficulty: 1, gen: genForm },
    'pt-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'pt-l1',
      title: '-ing と過去分詞で後ろから説明',
      unlocks: ['pt-form', 'pt-order'],
      build(rng) {
        return [
          { text: '2語以上で名詞を説明するときは、名詞の後ろに置く。', en: 'the boy（男の子）\n→ the boy playing tennis（テニスをしている男の子）' },
          { text: '「〜している」は -ing、「〜された」は過去分詞。', en: 'a picture taken by my father\n（父によってとられた写真）' },
          { text: 'やってみよう。', q: genForm(rng) },
          { text: 'もう1問。', q: genForm(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
