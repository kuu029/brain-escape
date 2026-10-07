// 英語 第3段階: 間接疑問（I know where he lives. のように、文の中に疑問文を入れる）
import { frameQ, orderAns } from './kit-en.js';

// main: 前の部分、wh: 疑問詞（＋名詞）、s: 主語、v: [ふつうの文の動詞, 疑問文にしたときの助動詞, 原形]、rest: 後ろ、end: 文末記号
const IND = [
  { main: ['I', 'know'], wh: ['where'], s: 'Ken', v: ['lives', 'does', 'live'], rest: [], end: '.', ja: '私はケンがどこに住んでいるか知っています。' },
  { main: ['Do', 'you', 'know'], wh: ['what'], s: 'this', v: ['is', 'is'], rest: [], end: '?', ja: 'これが何か知っていますか？' },
  { main: ['I', 'do', 'not', 'know'], wh: ['who'], s: 'that boy', v: ['is', 'is'], rest: [], end: '.', ja: '私はあの男の子がだれか知りません。' },
  { main: ['Please', 'tell', 'me'], wh: ['when'], s: 'the party', v: ['starts', 'does', 'start'], rest: [], end: '.', ja: 'パーティーがいつ始まるか教えてください。' },
  { main: ['Do', 'you', 'know'], wh: ['what', 'time'], s: 'it', v: ['is', 'is'], rest: [], end: '?', ja: '何時か知っていますか？' },
  { main: ['I', 'do', 'not', 'know'], wh: ['why'], s: 'she', v: ['was', 'was'], rest: ['late'], end: '.', ja: '私は彼女がなぜ遅れたのか知りません。' },
  { main: ['Can', 'you', 'tell', 'me'], wh: ['where'], s: 'the station', v: ['is', 'is'], rest: [], end: '?', ja: '駅がどこか教えてくれますか？' },
  { main: ['I', 'know'], wh: ['what'], s: 'Ken', v: ['wants', 'does', 'want'], rest: [], end: '.', ja: '私はケンが何をほしがっているか知っています。' },
  { main: ['Do', 'you', 'know'], wh: ['how', 'old'], s: 'he', v: ['is', 'is'], rest: [], end: '?', ja: '彼が何歳か知っていますか？' },
  { main: ['I', 'want', 'to', 'know'], wh: ['where'], s: 'you', v: ['bought', 'did', 'buy'], rest: ['that bag'], end: '.', ja: '私はあなたがどこでそのかばんを買ったのか知りたいです。' },
  { main: ['Tell', 'me'], wh: ['what'], s: 'you', v: ['want', 'do', 'want'], rest: [], end: '.', ja: 'あなたが何をほしいか教えてください。' },
  { main: ['I', 'do', 'not', 'know'], wh: ['when'], s: 'Yumi', v: ['came', 'did', 'come'], rest: ['home'], end: '.', ja: '私はユミがいつ家に帰ったのか知りません。' },
  { main: ['Do', 'you', 'know'], wh: ['where'], s: 'Yumi', v: ['lives', 'does', 'live'], rest: [], end: '?', ja: 'ユミがどこに住んでいるか知っていますか？' },
  { main: ['I', 'know'], wh: ['how', 'old'], s: 'your brother', v: ['is', 'is'], rest: [], end: '.', ja: '私はあなたのお兄さんが何歳か知っています。' },
  { main: ['Please', 'tell', 'me'], wh: ['what'], s: 'you', v: ['did', 'did', 'do'], rest: ['yesterday'], end: '.', ja: 'あなたが昨日何をしたか教えてください。' },
  { main: ['I', 'do', 'not', 'know'], wh: ['where'], s: 'my bag', v: ['is', 'is'], rest: [], end: '.', ja: '私は自分のかばんがどこにあるかわかりません。' },
];

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
