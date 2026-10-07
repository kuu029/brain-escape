// 英語 第1段階: be動詞と一般動詞（3単現の前なので、一般動詞の文は I / you / we / they など）
import { SUBJ, SUBJ_NON3, SUBJ_Q, VP_ALL, TIME, pickTime, COMPLEMENT, beClause, jaBe, jaSentence, clause, cap, compOf } from './gram.js';
import { bePresent, ing, third } from './lex.js';
import { frameQ, orderAns } from './kit-en.js';

const BE_RULE = {
  am: 'I のときだけ am。',
  is: 'he / she / ケンなど「1人・1つ（自分と相手以外）」は is。',
  are: 'you と、2人以上（we / they / 〜たち）は are。',
};
const beWrong = (subj, correct, capFirst = false) => ['am', 'is', 'are'].filter((b) => b !== correct)
  .map((b) => ({ t: capFirst ? cap(b) : b, msg: `主語が ${subj.en} なら ${correct}。${BE_RULE[correct]}` }));

// am / is / are を選ぶ
function genBe(rng) {
  const type = rng.pick(['pos', 'pos', 'neg', 'q']);
  const subj = rng.pick(type === 'q' ? SUBJ_Q : SUBJ);
  const c = rng.pick(COMPLEMENT);
  const chunks = beClause(subj, c, 'pres', type);
  const at = type === 'q' ? 0 : 1;
  const be = bePresent(subj);
  const q = type === 'q';
  return {
    ...frameQ(rng, {
      chunks, at, correct: q ? cap(be) : be, end: q ? '?' : '.',
      ja: jaBe(subj, c, 'pres', type),
      wrongs: [...beWrong(subj, be, q), { t: q ? 'Do' : 'do', msg: `${compOf(c, subj)} は動詞ではないので do は使わない。「〜です／〜にいる」は be動詞！` }],
    }),
    hint: 'be動詞は主語で決まる: I → am、you と複数 → are、それ以外の1人・1つ → is',
    steps: [`主語は ${subj.en}`, `${subj.en} → ${be}（${BE_RULE[be]}）`],
  };
}

// 一般動詞の文（現在・肯定）。be動詞をまぜてしまうミスを選択肢に
function genGeneral(rng) {
  const subj = rng.pick(SUBJ_NON3);
  const vp = rng.pick(VP_ALL);
  const [tEn, tJa] = pickTime(rng, vp, 'habit');
  const chunks = clause(subj, vp, 'pres', 'pos');
  const be = bePresent(subj);
  return {
    ...frameQ(rng, {
      chunks, at: 1, correct: vp.v, tail: tEn,
      ja: jaSentence(subj, vp, 'pres', 'pos', tJa),
      wrongs: [
        { t: `${be} ${vp.v}`, msg: '「〜します」は動詞だけで言える。be動詞（am/is/are）といっしょに使わない！' },
        { t: ing(vp.v), msg: '-ing の形だけでは文の動詞になれない。' },
        { t: third(vp.v), msg: `主語が ${subj.en} なので s はつけない（s がつくのは he / she など1人のとき。次の単元で！）` },
      ],
    }),
    hint: '「〜します」は一般動詞だけ。I play tennis. のように be動詞はいらない。',
    steps: [`「〜します」→ 動詞 ${vp.v} をそのまま使う`, `be動詞（${be}）はいらない`],
  };
}

// 否定文・疑問文: be動詞の文か一般動詞の文かを見分ける
function genNegQ(rng) {
  const useBe = rng.chance(0.5);
  const type = rng.pick(['neg', 'q']);
  const subj = rng.pick(type === 'q' ? SUBJ_Q.filter((s) => !(s.person === 3 && s.num === 'sg')) : SUBJ_NON3);
  const q = type === 'q';
  const be = bePresent(subj);
  if (useBe) {
    const c = rng.pick(COMPLEMENT);
    const chunks = beClause(subj, c, 'pres', type);
    if (q) {
      return {
        ...frameQ(rng, {
          chunks, at: 0, correct: cap(be), end: '?', ja: jaBe(subj, c, 'pres', 'q'),
          wrongs: [{ t: 'Do', msg: `${compOf(c, subj)} は動詞じゃない。be動詞の文の疑問文は be動詞を前に出す！` }, ...beWrong(subj, be, true)],
        }),
        hint: 'be動詞の文の疑問文 → be動詞を主語の前へ。',
        steps: [`もとの文: ${cap(subj.en)} ${be} ${compOf(c, subj)}.`, `${be} を前に出す → ${cap(be)} ${subj.en} ${compOf(c, subj)}?`],
      };
    }
    // 否定: be + not のかたまりを選ぶ
    const merged = [chunks[0], `${be} not`, chunks[3]];
    return {
      ...frameQ(rng, {
        chunks: merged, at: 1, correct: `${be} not`, ja: jaBe(subj, c, 'pres', 'neg'),
        wrongs: [{ t: 'do not', msg: `${compOf(c, subj)} は動詞じゃない。be動詞の文の否定は be動詞のあとに not！` }, { t: `not ${be}`, msg: 'not は be動詞の「あと」。' }, { t: 'not', msg: 'not だけでは足りない。be動詞も必要！' }],
      }),
      hint: 'be動詞の文の否定 → be動詞のあとに not。',
      steps: [`${cap(subj.en)} ${be} not ${compOf(c, subj)}.`],
    };
  }
  const vp = rng.pick(VP_ALL);
  const [tEn, tJa] = pickTime(rng, vp, 'habit');
  if (q) {
    const chunks = clause(subj, vp, 'pres', 'q');
    return {
      ...frameQ(rng, {
        chunks, at: 0, correct: 'Do', tail: tEn, end: '?', ja: jaSentence(subj, vp, 'pres', 'q', tJa),
        wrongs: [{ t: cap(be), msg: `${vp.v} は一般動詞。一般動詞の疑問文は Do を文の最初に！` }, { t: 'Does', msg: `主語が ${subj.en} なので Does ではなく Do。` }, { t: 'Is', msg: `${vp.v} は一般動詞。be動詞は使わない。` }],
      }),
      hint: '一般動詞の疑問文 → Do ＋ 主語 ＋ 動詞 〜?',
      steps: [`${vp.v} は一般動詞`, `Do を最初に → Do ${subj.en} ${vp.v}${vp.obj ? ` ${vp.obj}` : ''}${tEn ? ` ${tEn}` : ''}?`],
    };
  }
  const chunks = [subj.en, 'do not', vp.v, ...(vp.obj ? [vp.obj] : [])];
  return {
    ...frameQ(rng, {
      chunks, at: 1, correct: 'do not', tail: tEn, ja: jaSentence(subj, vp, 'pres', 'neg', tJa),
      wrongs: [{ t: `${be} not`, msg: `${vp.v} は一般動詞。否定は do not（don't）を動詞の前に！` }, { t: 'not', msg: 'not だけでは足りない。do not（don\'t）にする。' }, { t: 'does not', msg: `主語が ${subj.en} なので do not。` }],
    }),
    hint: '一般動詞の否定 → do not（don\'t）＋ 動詞',
    steps: [`${vp.v} は一般動詞`, `動詞の前に do not → ${subj.en} do not ${vp.v} ...`],
  };
}

// 並べかえ（否定文・疑問文）
function genOrder(rng) {
  const useBe = rng.chance(0.5);
  const type = rng.pick(['neg', 'q']);
  const q = type === 'q';
  const subj = rng.pick(q ? SUBJ_Q.filter((s) => !(s.person === 3 && s.num === 'sg')) : SUBJ_NON3);
  const be = bePresent(subj);
  if (useBe) {
    const c = rng.pick(COMPLEMENT);
    return {
      stem: `日本語に合うように並べかえよう\n${jaBe(subj, c, 'pres', type)}`,
      ...orderAns(rng, beClause(subj, c, 'pres', type), { end: q ? '?' : '.', decoys: [{ t: 'do', msg: `${compOf(c, subj)} は動詞じゃないので do は使わない。be動詞の文！` }] }),
      hint: q ? 'be動詞の疑問文: be動詞 ＋ 主語 〜?' : 'be動詞の否定文: 主語 ＋ be動詞 ＋ not 〜.',
      steps: [q ? `${be} を主語の前に出す` : `${be} のあとに not`],
      check: { kind: 'en-order' },
    };
  }
  const vp = rng.pick(VP_ALL);
  const [tEn, tJa] = pickTime(rng, vp, 'habit');
  return {
    stem: `日本語に合うように並べかえよう\n${jaSentence(subj, vp, 'pres', type, tJa)}`,
    ...orderAns(rng, clause(subj, vp, 'pres', type), { tail: tEn, end: q ? '?' : '.', decoys: [{ t: be, msg: `${vp.v} は一般動詞。be動詞（${be}）は使わない！` }] }),
    hint: q ? '一般動詞の疑問文: Do ＋ 主語 ＋ 動詞 〜?' : '一般動詞の否定文: 主語 ＋ do not ＋ 動詞 〜.',
    steps: [q ? 'Do を最初に、動詞はそのままの形' : '動詞の前に do not'],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-be',
  subject: 'english',
  stage: 1,
  area: '英語棟・受付',
  title: 'be動詞と一般動詞',
  emoji: '🐝',
  prereqs: [],
  tool: 'heal',
  hintCard: [
    'I → am ／ you・複数 → are ／ he・she・1人 → is',
    '「〜です・〜にいる」は be動詞、「〜する」は一般動詞（いっしょに使わない）',
    'be動詞の否定・疑問: be動詞のあとに not ／ be動詞を前へ',
    '一般動詞の否定・疑問: do not ＋ 動詞 ／ Do ＋ 主語 ＋ 動詞 〜?',
  ],
  generators: {
    'eb-be': { difficulty: 1, gen: genBe },
    'eb-general': { difficulty: 1, gen: genGeneral },
    'eb-negq': { difficulty: 2, gen: genNegQ },
    'eb-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'eb-l1',
      title: 'be動詞（am / is / are）',
      unlocks: ['eb-be'],
      build(rng) {
        return [
          { text: 'be動詞は「〜です」「〜にいる」を表す。主語によって形が変わるよ。', en: 'I am a student.\nYou are a student.\nKen is a student.' },
          { text: 'ルールは3つだけ。\n・I → am\n・you と、2人以上（we / they / 〜たち）→ are\n・それ以外の1人・1つ（he / she / ケン）→ is' },
          { text: 'やってみよう。', q: genBe(rng) },
          { text: 'もう1問。', q: genBe(rng) },
        ];
      },
    },
    {
      id: 'eb-l2',
      title: '一般動詞（play, like など）',
      unlocks: ['eb-general'],
      build(rng) {
        return [
          { text: '「テニスをする」「ねこが好き」のような動作・気持ちは一般動詞で言う。', en: 'I play tennis.\nWe like cats.' },
          { text: '⚠️ いちばん多いミス: be動詞と一般動詞をいっしょに使う。', en: '× I am play tennis.\n○ I play tennis.' },
          { text: '正しいのはどれ？', q: genGeneral(rng) },
          { text: 'もう1問。', q: genGeneral(rng) },
        ];
      },
    },
    {
      id: 'eb-l3',
      title: '否定文と疑問文',
      unlocks: ['eb-negq', 'eb-order'],
      build(rng) {
        return [
          { text: 'be動詞の文は、be動詞を動かすだけ。', en: 'You are busy.\n→ You are not busy.（否定）\n→ Are you busy?（疑問）' },
          { text: '一般動詞の文は do を使う。動詞の形はそのまま。', en: 'You play tennis.\n→ You do not play tennis.（否定）\n→ Do you play tennis?（疑問）' },
          { text: 'まずは見分けよう。', q: genNegQ(rng) },
          { text: 'もう1問。', q: genNegQ(rng) },
          { text: '並べかえにも挑戦。タイルをタップして並べてね。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
