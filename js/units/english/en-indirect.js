// 英語 第3段階: 間接疑問（I know where he lives. のように、文の中に疑問文を入れる）
import { frameQ, orderAns } from './kit-en.js';

// 文 = 前の部分（MAIN）× 中に入れる疑問文（CL）の組み合わせ（約140通り）
// MAIN: en = 前の部分、ja = 日本語の型（{c} に「〜か」が入る）、end = 文末記号
const MAIN = [
  { en: ['I', 'know'], ja: '私は{c}知っています。', end: '.' },
  { en: ['Do', 'you', 'know'], ja: '{c}知っていますか？', end: '?' },
  { en: ['I', 'do', 'not', 'know'], ja: '私は{c}知りません。', end: '.' },
  { en: ['Please', 'tell', 'me'], ja: '{c}教えてください。', end: '.' },
  { en: ['Can', 'you', 'tell', 'me'], ja: '{c}教えてくれますか？', end: '?' },
  { en: ['I', 'want', 'to', 'know'], ja: '私は{c}知りたいです。', end: '.' },
];
// CL: wh = 疑問詞（＋名詞）、s = 主語、v = [ふつうの文の動詞, 疑問文にしたときの助動詞, 原形]（be動詞は2つ）、rest = 後ろ、ja = 「〜か」
const CL = [
  { wh: ['where'], s: 'Ken', v: ['lives', 'does', 'live'], rest: [], ja: 'ケンがどこに住んでいるか' },
  { wh: ['what'], s: 'this', v: ['is', 'is'], rest: [], ja: 'これが何か' },
  { wh: ['who'], s: 'that boy', v: ['is', 'is'], rest: [], ja: 'あの男の子がだれか' },
  { wh: ['when'], s: 'the party', v: ['starts', 'does', 'start'], rest: [], ja: 'パーティーがいつ始まるか' },
  { wh: ['what', 'time'], s: 'it', v: ['is', 'is'], rest: [], ja: '何時か' },
  { wh: ['why'], s: 'she', v: ['was', 'was'], rest: ['late'], ja: '彼女がなぜ遅れたのか' },
  { wh: ['where'], s: 'the station', v: ['is', 'is'], rest: [], ja: '駅がどこにあるか' },
  { wh: ['what'], s: 'Ken', v: ['wants', 'does', 'want'], rest: [], ja: 'ケンが何をほしがっているか' },
  { wh: ['how', 'old'], s: 'he', v: ['is', 'is'], rest: [], ja: '彼が何歳か' },
  { wh: ['where'], s: 'you', v: ['bought', 'did', 'buy'], rest: ['that bag'], ja: 'あなたがどこでそのかばんを買ったのか' },
  { wh: ['what'], s: 'you', v: ['want', 'do', 'want'], rest: [], ja: 'あなたが何をほしいか' },
  { wh: ['when'], s: 'Yumi', v: ['came', 'did', 'come'], rest: ['home'], ja: 'ユミがいつ家に帰ったのか' },
  { wh: ['how', 'old'], s: 'your brother', v: ['is', 'is'], rest: [], ja: 'あなたのお兄さんが何歳か' },
  { wh: ['what'], s: 'you', v: ['did', 'did', 'do'], rest: ['yesterday'], ja: 'あなたが昨日何をしたか' },
  { wh: ['where'], s: 'my bag', v: ['is', 'is'], rest: [], ja: 'かばんがどこにあるか' },
  { wh: ['how'], s: 'he', v: ['goes', 'does', 'go'], rest: ['to school'], ja: '彼がどうやって学校に行くか' },
  { wh: ['what'], s: 'she', v: ['likes', 'does', 'like'], rest: [], ja: '彼女が何が好きか' },
  { wh: ['where'], s: 'they', v: ['play', 'do', 'play'], rest: ['soccer'], ja: '彼らがどこでサッカーをするか' },
  { wh: ['when'], s: 'the movie', v: ['starts', 'does', 'start'], rest: [], ja: '映画がいつ始まるか' },
  { wh: ['why'], s: 'he', v: ['is', 'is'], rest: ['angry'], ja: '彼がなぜ怒っているのか' },
  { wh: ['where'], s: 'Tom', v: ['is', 'is'], rest: [], ja: 'トムがどこにいるか' },
  { wh: ['where'], s: 'she', v: ['lives', 'does', 'live'], rest: [], ja: '彼女がどこに住んでいるか' },
  { wh: ['where'], s: 'Yumi', v: ['went', 'did', 'go'], rest: [], ja: 'ユミがどこへ行ったのか' },
  { wh: ['what'], s: 'that', v: ['is', 'is'], rest: [], ja: 'あれが何か' },
];
// 「〜 yesterday?」の疑問文は、文法チェックが主節の時制と読みちがえるので組み合わせない
const IND = MAIN.flatMap((m) => CL.filter((c) => !(m.end === '?' && c.rest.includes('yesterday'))).map((c) => ({ main: m.en, wh: c.wh, s: c.s, v: c.v, rest: c.rest, end: m.end, ja: m.ja.replace('{c}', c.ja) })));

// 疑問詞のあとの語順を選ぶ（ふつうの文の語順 ⇔ 疑問文の語順）
function genChoose(rng) {
  const x = rng.pick(IND);
  const right = [x.s, x.v[0]].join(' ');
  // be動詞の文（v が2つ）と一般動詞の文（v が3つ）で、まちがえ方がちがう
  const wrongs = x.v.length === 2
    ? [{ t: `${x.v[0]} ${x.s}`, msg: '文の中に入れた疑問文は「主語 ＋ 動詞」のふつうの語順にする。' }, { t: `${x.s} ${x.v[0] === 'is' ? 'are' : x.v[0] === 'was' ? 'were' : 'be'}`, msg: `主語 ${x.s} に合う be動詞は ${x.v[0]}。` }]
    : [
      { t: `${x.v[1]} ${x.s} ${x.v[2]}`, msg: '文の中に入れた疑問文では do / does / did を使わない。「主語 ＋ 動詞」の語順。' },
      // 過去の文で「主語 ＋ 原形」を選択肢にすると、今のこととして正しい文になってしまう
      x.v[1] === 'did' ? { t: `${x.s} ${x.v[1]} ${x.v[2]}`, msg: '文の中の疑問文では did を使わない。動詞を過去形にする。' } : { t: `${x.s} ${x.v[2]}`, msg: `主語 ${x.s} に合わせて ${x.v[0]}。` },
      // what / who のあとに「動詞 ＋ 主語」を置くと、what が主語の正しい文に読めてしまうので、does を残した形にする
      ['what', 'who'].includes(x.wh[0]) ? { t: `${x.v[1]} ${x.s} ${x.v[0]}`, msg: '文の中の疑問文では do / does / did を使わない。' } : { t: `${x.v[0]} ${x.s}`, msg: '「主語 ＋ 動詞」の語順にする。' },
    ];
  const chunks = [...x.main, ...x.wh, right, ...x.rest];
  return {
    ...frameQ(rng, { chunks, at: x.main.length + x.wh.length, correct: right, end: x.end, ja: x.ja, wrongs }),
    hint: '文の中の疑問文（間接疑問）は 疑問詞 ＋ 主語 ＋ 動詞 の語順。do / does / did は使わない。',
    steps: [`${x.wh.join(' ')} ＋ 主語 ＋ 動詞 → ${x.wh.join(' ')} ${right}`],
  };
}

function genOrder(rng) {
  const x = rng.pick(IND);
  const decoy = x.v.length === 2 ? (x.v[0] === 'is' ? 'does' : 'did') : x.v[1] === x.v[0] ? 'does' : x.v[1];
  return {
    stem: `日本語に合うように並べかえよう\n${x.ja}`,
    ...orderAns(rng, [...x.wh, x.s, x.v[0], ...x.rest], { prefix: x.main.join(' '), end: x.end, decoys: [{ t: decoy, msg: '文の中の疑問文には do / does / did はいらない！' }] }),
    hint: '疑問詞 ＋ 主語 ＋ 動詞 の順。',
    steps: [`${x.wh.join(' ')} ${x.s} ${x.v[0]}${x.rest.length ? ` ${x.rest.join(' ')}` : ''}`],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-indirect',
  subject: 'english',
  stage: 3,
  area: '屋上・無線室',
  title: '間接疑問',
  emoji: '📻',
  prereqs: ['en-wh'],
  tool: 'coins',
  hintCard: [
    '疑問文を文の中に入れると: 疑問詞 ＋ 主語 ＋ 動詞（ふつうの語順）',
    'Where does he live? → I know where he lives.',
    'What is this? → Do you know what this is?',
  ],
  generators: {
    'id-choose': { difficulty: 1, gen: genChoose },
    'id-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'id-l1',
      title: '間接疑問の語順',
      unlocks: ['id-choose', 'id-order'],
      build(rng) {
        return [
          { text: '疑問文を「〜か（知っている）」のように文の中に入れるときは、疑問詞のあとをふつうの文の語順にする。', en: 'Where does Ken live?\n→ I know where Ken lives.' },
          { text: 'do / does / did は消えて、動詞の形がもどる（lives, bought）。be動詞は主語のあとへ。', en: 'What is this?\n→ Do you know what this is?' },
          { text: 'やってみよう。', q: genChoose(rng) },
          { text: 'もう1問。', q: genChoose(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
