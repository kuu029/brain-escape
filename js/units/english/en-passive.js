// 英語 第3段階: 受動態（be ＋ 過去分詞）
import { pp, past, third } from './lex.js';
import { frameQ, orderAns } from './kit-en.js';
import { cap } from './gram.js';

// s: 主語、pl: 複数か、v: 動詞、by: 〜によって（なしもある）、tail: 場所・時、tense: pres / past
// ja: [ふつう, 否定, 疑問] の述語（主語は sja）
const P = (s, sja, pl, v, by, tail, tense, ja) => ({ s, sja, pl, v, by, tail, tense, ja });
export const PASSIVES = [
  P('this room', 'この部屋', false, 'clean', 'by Ken', 'every day', 'pres', ['毎日ケンによってそうじされます', '毎日ケンによってそうじされません', '毎日ケンによってそうじされますか']),
  P('English', '英語', false, 'speak', '', 'in many countries', 'pres', ['多くの国で話されています', '多くの国で話されていません', '多くの国で話されていますか']),
  P('this book', 'この本', false, 'write', 'by a famous writer', '', 'past', ['有名な作家によって書かれました', '有名な作家によって書かれませんでした', '有名な作家によって書かれましたか']),
  P('this temple', 'この寺', false, 'build', '', 'about 300 years ago', 'past', ['約300年前に建てられました', '約300年前に建てられませんでした', '約300年前に建てられましたか']),
  P('these pictures', 'これらの写真', true, 'take', 'by my father', 'last year', 'past', ['去年、父によってとられました', '去年、父によってとられませんでした', '去年、父によってとられましたか']),
  P('this song', 'この歌', false, 'sing', 'by many people', '', 'pres', ['多くの人々に歌われています', '多くの人々に歌われていません', '多くの人々に歌われていますか']),
  P('this computer', 'このコンピューター', false, 'use', 'by many students', '', 'pres', ['多くの生徒に使われています', '多くの生徒に使われていません', '多くの生徒に使われていますか']),
  P('the window', 'その窓', false, 'break', 'by Tom', 'yesterday', 'past', ['昨日トムによって割られました', '昨日トムによって割られませんでした', '昨日トムによって割られましたか']),
  P('this cake', 'このケーキ', false, 'make', 'by my mother', '', 'past', ['母によって作られました', '母によって作られませんでした', '母によって作られましたか']),
  P('Japanese cars', '日本の車', true, 'sell', '', 'all over the world', 'pres', ['世界中で売られています', '世界中で売られていません', '世界中で売られていますか']),
  P('this letter', 'この手紙', false, 'write', 'by Yumi', 'last week', 'past', ['先週ユミによって書かれました', '先週ユミによって書かれませんでした', '先週ユミによって書かれましたか']),
  P('the park', 'その公園', false, 'clean', 'by volunteers', 'every Sunday', 'pres', ['毎週日曜日にボランティアによってそうじされます', '毎週日曜日にボランティアによってそうじされません', '毎週日曜日にボランティアによってそうじされますか']),
  P('these cups', 'これらのカップ', true, 'wash', 'by Ken', 'every night', 'pres', ['毎晩ケンによって洗われます', '毎晩ケンによって洗われません', '毎晩ケンによって洗われますか']),
];
const beOf = (x) => (x.tense === 'past' ? (x.pl ? 'were' : 'was') : (x.pl ? 'are' : 'is'));
const rest = (x) => [x.by, x.tail].filter(Boolean);
const jaOf = (x, type) => `${x.sja}は${x.ja[{ pos: 0, neg: 1, q: 2 }[type]]}${type === 'q' ? '？' : '。'}`;
function chunksOf(x, type) {
  const be = beOf(x);
  if (type === 'neg') return [x.s, be, 'not', pp(x.v), ...rest(x)];
  if (type === 'q') return [cap(be), x.s, pp(x.v), ...rest(x)];
  return [x.s, be, pp(x.v), ...rest(x)];
}

// 過去分詞を選ぶ
function genForm(rng) {
  const x = rng.pick(PASSIVES);
  const chunks = chunksOf(x, 'pos').map((c, i) => (i === 0 ? cap(c) : c));
  const right = pp(x.v);
  const ws = [past(x.v), x.v, third(x.v)].filter((w) => w !== right);
  return {
    ...frameQ(rng, {
      chunks, at: 2, correct: right, ja: jaOf(x, 'pos'),
      wrongs: ws.map((w) => ({ t: w, msg: `「〜される」は be ＋ 過去分詞。${x.v} の過去分詞は ${right}。` })),
    }),
    hint: '受動態（〜される）＝ be動詞 ＋ 過去分詞。不規則動詞の過去分詞に注意（write → written, speak → spoken）。',
    steps: [`〜される → be ＋ 過去分詞`, `${x.v} → ${right}`],
  };
}

// be動詞を選ぶ（主語の数・時制）
function genBe(rng) {
  // 時の語がない文では is と was のどちらも正しくなるので、時の語がある文だけ使う
  const x = rng.pick(PASSIVES.filter((p) => /every|last|yesterday|ago/.test(p.tail)));
  const be = beOf(x);
  const chunks = chunksOf(x, 'pos').map((c, i) => (i === 0 ? cap(c) : c));
  const other = x.tense === 'past' ? (x.pl ? 'was' : 'were') : (x.pl ? 'is' : 'are');
  const tenseWrong = x.tense === 'past' ? (x.pl ? 'are' : 'is') : (x.pl ? 'were' : 'was');
  return {
    ...frameQ(rng, {
      chunks, at: 1, correct: be, ja: jaOf(x, 'pos'),
      wrongs: [
        { t: other, msg: `主語 ${x.s} は${x.pl ? '複数' : '単数'}。` },
        { t: tenseWrong, msg: x.tense === 'past' ? `${x.tail} は過去。` : '今のこと（いつものこと）なので現在形。' },
        { t: x.tense === 'past' ? 'did' : (x.pl ? 'do' : 'does'), msg: '受動態は be動詞 ＋ 過去分詞。do / does / did は使わない。' },
      ],
    }),
    hint: '受動態の be動詞は、主語の数と時制で決まる（is / are / was / were）。',
    steps: [`主語 ${x.s} → ${x.pl ? '複数' : '単数'}、${x.tense === 'past' ? '過去' : '現在'} → ${be}`],
  };
}

// 否定文・疑問文
function genNegQ(rng) {
  const x = rng.pick(PASSIVES);
  const type = rng.pick(['neg', 'q']);
  const be = beOf(x);
  const chunks = type === 'q' ? chunksOf(x, 'q') : [cap(x.s), `${be} not`, pp(x.v), ...rest(x)];
  const doW = x.tense === 'past' ? 'did' : (x.pl ? 'do' : 'does');
  return {
    ...frameQ(rng, {
      chunks, at: type === 'q' ? 0 : 1, correct: type === 'q' ? cap(be) : `${be} not`, end: type === 'q' ? '?' : '.', ja: jaOf(x, type),
      wrongs: type === 'q'
        ? [{ t: cap(doW), msg: '受動態の疑問文は be動詞を前へ。' }, { t: cap(be === 'is' ? 'are' : be === 'are' ? 'is' : be === 'was' ? 'were' : 'was'), msg: `主語 ${x.s} は${x.pl ? '複数' : '単数'}。` }]
        : [{ t: `${doW} not`, msg: '受動態の否定は be動詞のあとに not。' }, { t: `not ${be}`, msg: 'not は be動詞のあと。' }],
    }),
    hint: '受動態の否定・疑問は be動詞を動かす（is not ＋ 過去分詞 ／ Is 〜 ＋ 過去分詞?）',
    steps: [type === 'q' ? `${cap(be)} を前へ` : `${be} のあとに not`],
  };
}

function genOrder(rng) {
  const x = rng.pick(PASSIVES);
  const type = rng.pick(['pos', 'pos', 'neg', 'q']);
  // 規則動詞は過去形＝過去分詞なので、不要タイルは did にする
  const decoy = x.v === 'read' ? third(x.v) : past(x.v) !== pp(x.v) ? past(x.v) : 'did';
  return {
    stem: `日本語に合うように並べかえよう\n${jaOf(x, type)}`,
    ...orderAns(rng, chunksOf(x, type), { end: type === 'q' ? '?' : '.', decoys: [{ t: decoy, msg: decoy === 'did' ? '受動態は be動詞の文。did は使わない。' : `受動態は be ＋ 過去分詞（${pp(x.v)}）。` }] }),
    hint: '主語 ＋ be動詞 ＋ 過去分詞 ＋ by 〜（〜によって）',
    steps: ['be動詞 ＋ 過去分詞のかたまりを作る'],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-passive',
  subject: 'english',
  stage: 3,
  area: '屋上・見張り台',
  title: '受動態',
  emoji: '🔄',
  prereqs: ['en-past'],
  tool: 'freeze',
  hintCard: [
    '〜される・〜されている → be動詞 ＋ 過去分詞（＋ by 〜）',
    '過去分詞: 規則動詞は過去形と同じ（cleaned）。不規則: written, spoken, built, taken, made, sold',
    '否定: is not ＋ 過去分詞 ／ 疑問: Is 〜 ＋ 過去分詞?',
  ],
  generators: {
    'ps-form': { difficulty: 1, gen: genForm },
    'ps-be': { difficulty: 1, gen: genBe },
    'ps-negq': { difficulty: 2, gen: genNegQ },
    'ps-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'ps-l1',
      title: 'be ＋ 過去分詞',
      unlocks: ['ps-form', 'ps-be'],
      build(rng) {
        return [
          { text: '「〜される」は be動詞 ＋ 過去分詞。だれがしたかは by 〜 で言う。', en: 'Ken cleans this room.\n→ This room is cleaned by Ken.' },
          { text: '過去分詞は、規則動詞なら過去形と同じ形。不規則動詞は覚えよう。', en: 'write – wrote – written\nspeak – spoke – spoken\ntake – took – taken\nbuild – built – built' },
          { text: 'やってみよう。', q: genForm(rng) },
          { text: 'be動詞は？', q: genBe(rng) },
        ];
      },
    },
    {
      id: 'ps-l2',
      title: '否定文・疑問文',
      unlocks: ['ps-negq', 'ps-order'],
      build(rng) {
        return [
          { text: '受動態は be動詞の文。否定も疑問も be動詞を動かす。', en: 'English is not spoken here.\nIs English spoken in Canada?' },
          { text: 'やってみよう。', q: genNegQ(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
