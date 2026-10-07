// 英語 第2段階: There is / There are（〜がある・〜がいる）
import { plural } from './lex.js';
import { frameQ, orderAns, textChoice } from './kit-en.js';

// 名詞: [英語, 日本語, 生き物か, 数え方]
const NOUN = [
  ['cat', 'ねこ', true, '匹'], ['dog', '犬', true, '匹'], ['bird', '鳥', true, '羽'], ['student', '生徒', true, '人'], ['child', '子ども', true, '人'],
  ['book', '本', false, '冊'], ['apple', 'りんご', false, '個'], ['pen', 'ペン', false, '本'], ['park', '公園', false, 'つ'], ['library', '図書館', false, 'つ'],
  ['box', '箱', false, 'つ'], ['picture', '絵', false, '枚'], ['tree', '木', false, '本'], ['egg', '卵', false, '個'],
];
const PLACE = [
  ['under the table', 'テーブルの下'], ['in the box', '箱の中'], ['near my house', '私の家の近く'], ['in this town', 'この町'],
  ['on the desk', '机の上'], ['in the park', '公園'], ['in the room', '部屋の中'],
];
// 名詞と場所の自然な組み合わせ
const FIT = {
  park: ['near my house', 'in this town'], library: ['near my house', 'in this town'], tree: ['in the park', 'near my house'],
  student: ['in the room', 'in the park'], child: ['in the park', 'in the room'], bird: ['in the park', 'in the box'],
  cat: ['under the table', 'in the box', 'in the room', 'in the park'], dog: ['under the table', 'in the room', 'in the park'],
  book: ['on the desk', 'in the box', 'in the room'], apple: ['on the desk', 'in the box'], pen: ['on the desk', 'in the box'],
  box: ['under the table', 'in the room', 'on the desk'], picture: ['in the room', 'in the box'], egg: ['in the box', 'on the desk'],
};
const NUMS = [['two', '2'], ['three', '3'], ['four', '4'], ['five', '5']];
const art = (w) => (/^[aeiou]/.test(w) ? 'an' : 'a');

function pickNP(rng) {
  const [w, ja, anim, counter] = rng.pick(NOUN);
  const placeEn = rng.pick(FIT[w]);
  const placeJa = PLACE.find((p) => p[0] === placeEn)[1];
  const pl = rng.chance(0.5);
  const [num, d] = rng.pick(NUMS);
  const np = pl ? `${num} ${plural(w)}` : `${art(w)} ${w}`;
  const npJa = pl ? `${ja}が${d}${counter}` : `${ja}が1${counter}`;
  return { w, np, pl, anim, placeEn, placeJa, npJa, ja, counter };
}
const exist = (x, past, neg) => {
  const v = x.anim ? 'い' : 'あり';
  if (neg) return past ? `${v}ませんでした` : `${v}ません`;
  return past ? `${v}ました` : `${v}ます`;
};

function genForm(rng) {
  const x = pickNP(rng);
  const past = rng.chance(0.3);
  const be = past ? (x.pl ? 'were' : 'was') : (x.pl ? 'are' : 'is');
  const tail = past ? 'yesterday' : '';
  // 時の語がない文では was / were も正しくなるので、今の文の選択肢には過去形を入れない
  const wrongBe = past ? [x.pl ? 'was' : 'were', x.pl ? 'are' : 'is'] : [x.pl ? 'is' : 'are', 'be'];
  return {
    ...frameQ(rng, {
      chunks: ['There', be, x.np, x.placeEn], at: 1, correct: be, tail,
      ja: `${past ? '昨日、' : ''}${x.placeJa}に${x.npJa}${exist(x, past)}。`,
      wrongs: [
        { t: wrongBe[0], msg: `be動詞はあとの名詞（${x.np}）で決まる。${x.pl ? '2つ以上 → are / were' : '1つ → is / was'}。` },
        { t: wrongBe[1], msg: past ? 'yesterday（過去）なので was / were。' : 'be は形を変えて is / are にする。' },
        { t: 'have', msg: '「〜がある」は There is / are。have は「持っている」。' },
      ],
    }),
    hint: 'There ＋ be動詞 ＋ 名詞 ＋ 場所。be動詞は名詞が1つなら is、2つ以上なら are（過去は was / were）。',
    steps: [`名詞: ${x.np} → ${x.pl ? '複数' : '単数'}`, `${past ? '過去' : '今'} → ${be}`],
  };
}

function genQ(rng) {
  const x = pickNP(rng);
  if (rng.chance(0.4)) {
    // How many 〜 are there?
    const pl = plural(x.w);
    return {
      ...frameQ(rng, {
        chunks: ['How', 'many', pl, 'are', 'there', x.placeEn], at: 3, correct: 'are', end: '?',
        ja: `${x.placeJa}に${x.ja}は何${x.counter}${x.anim ? 'います' : 'あります'}か？`,
        wrongs: [{ t: 'is', msg: 'How many のあとは複数形。だから be動詞は are。' }, { t: 'do', msg: 'There 〜 の疑問文は be動詞を前へ。do は使わない。' }, { t: 'have', msg: '「〜がある」は there are。' }],
      }),
      hint: 'How many ＋ 複数形 ＋ are there 〜?（〜はいくつありますか）',
      steps: [`How many ${pl} → 複数 → are there`],
    };
  }
  if (rng.chance(0.5)) {
    const be = x.pl ? 'Are' : 'Is';
    return {
      ...frameQ(rng, {
        chunks: [be, 'there', x.np, x.placeEn], at: 0, correct: be, end: '?',
        ja: `${x.placeJa}に${x.npJa}${x.anim ? 'います' : 'あります'}か？`,
        wrongs: [{ t: x.pl ? 'Is' : 'Are', msg: `${x.np} は${x.pl ? '複数' : '1つ'}なので ${be}。` }, { t: 'Does', msg: 'There is / are の疑問文は be動詞を前へ。' }, { t: 'Do', msg: 'There is / are の疑問文は be動詞を前へ。' }],
      }),
      hint: '疑問文: Is / Are ＋ there 〜?',
      steps: [`${x.np} → ${be} there 〜?`],
    };
  }
  // 答え方
  const be = x.pl ? 'are' : 'is';
  const yes = rng.chance(0.5);
  const ans = yes ? `Yes, there ${be}.` : `No, there ${be} not.`;
  const q = `${x.pl ? 'Are' : 'Is'} there ${x.np} ${x.placeEn}?`;
  return {
    stem: `質問に「${yes ? 'はい' : 'いいえ'}」で答えよう\n${q}`,
    ...textChoice(rng, ans, [
      { t: yes ? 'Yes, it is.' : 'No, it is not.', msg: 'There 〜? の質問には there を使って答える。' },
      { t: yes ? `Yes, there ${x.pl ? 'is' : 'are'}.` : `No, there ${x.pl ? 'is' : 'are'} not.`, msg: `質問が ${x.pl ? 'Are' : 'Is'} なので答えも ${be}。` },
      { t: yes ? 'Yes, I do.' : 'No, I do not.', msg: 'There 〜? の質問には there ＋ be動詞で答える。' },
    ]),
    hint: 'Is there 〜? → Yes, there is. / No, there is not.',
    steps: [`${q} → ${ans}`],
    check: { kind: 'en-there-ans', pl: x.pl, yes },
  };
}

function genOrder(rng) {
  const x = pickNP(rng);
  const q = rng.chance(0.4);
  const be = x.pl ? 'are' : 'is';
  const chunks = q ? [x.pl ? 'Are' : 'Is', 'there', x.np, x.placeEn] : ['There', be, x.np, x.placeEn];
  return {
    stem: `日本語に合うように並べかえよう\n${x.placeJa}に${x.npJa}${x.anim ? 'います' : 'あります'}${q ? 'か？' : '。'}`,
    ...orderAns(rng, chunks, { end: q ? '?' : '.', decoys: [{ t: x.pl ? 'is' : 'are', msg: `${x.np} は${x.pl ? '複数なので are' : '1つなので is'}。` }] }),
    hint: 'There ＋ be動詞 ＋ 名詞 ＋ 場所。疑問文は be動詞を前へ。',
    steps: [q ? `${x.pl ? 'Are' : 'Is'} there ＋ 名詞 ＋ 場所?` : `There ${be} ＋ 名詞 ＋ 場所`],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-there',
  subject: 'english',
  stage: 2,
  area: '英語棟・物置',
  title: 'There is / are',
  emoji: '📦',
  prereqs: ['en-plural'],
  tool: 'freeze',
  hintCard: [
    '〜がある・いる → There is（1つ）／ There are（2つ以上）＋ 名詞 ＋ 場所',
    '過去は There was / There were',
    '疑問文: Is there 〜? → Yes, there is. / No, there is not.',
    'How many 〜 are there?（いくつありますか）',
  ],
  generators: {
    'th-form': { difficulty: 1, gen: genForm },
    'th-q': { difficulty: 2, gen: genQ },
    'th-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'th-l1',
      title: 'There is / are',
      unlocks: ['th-form'],
      build(rng) {
        return [
          { text: '「〜がある・〜がいる」は There is / are。be動詞はあとの名詞で決まる。', en: 'There is a cat under the table.\nThere are two cats under the table.' },
          { text: '過去なら was / were。', en: 'There were many people in the park yesterday.' },
          { text: 'やってみよう。', q: genForm(rng) },
          { text: 'もう1問。', q: genForm(rng) },
        ];
      },
    },
    {
      id: 'th-l2',
      title: '疑問文と答え方',
      unlocks: ['th-q', 'th-order'],
      build(rng) {
        return [
          { text: '疑問文は be動詞を前へ。答えにも there を使う。', en: 'Is there a park near here?\n— Yes, there is. / No, there is not.' },
          { text: '数をたずねるときは How many。', en: 'How many students are there in your class?' },
          { text: 'やってみよう。', q: genQ(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
