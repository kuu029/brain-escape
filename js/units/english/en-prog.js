// 英語 第1段階: 現在進行形（be ＋ -ing）
import { SUBJ, SUBJ_Q, VP_ACTION, TIME, pickTime, clause, jaSentence, is3sg, cap } from './gram.js';
import { third, ing, bePresent } from './lex.js';
import { frameQ, orderAns, spellAns } from './kit-en.js';

const simple = (vp, subj) => (is3sg(subj) ? third(vp.v) : vp.v);

function genForm(rng) {
  const subj = rng.pick(SUBJ);
  const vp = rng.pick(VP_ACTION);
  const be = bePresent(subj);
  const right = `${be} ${ing(vp.v)}`;
  return {
    ...frameQ(rng, {
      chunks: [subj.en, right, ...(vp.obj ? [vp.obj] : [])], at: 1, correct: right, tail: 'now',
      ja: jaSentence(subj, vp, 'prog', 'pos', '今'),
      wrongs: [
        { t: simple(vp, subj), msg: '「今〜しているところ」は be ＋ -ing（現在進行形）。' },
        { t: `${be} ${vp.v}`, msg: 'be動詞のあとは -ing の形にする。' },
        { t: ing(vp.v), msg: '-ing だけでは足りない。be動詞（am / is / are）が必要！' },
        { t: `${['am', 'is', 'are'].find((b) => b !== be)} ${ing(vp.v)}`, msg: `主語が ${subj.en} なら be動詞は ${be}。` },
      ],
    }),
    hint: '今〜しているところ → am / is / are ＋ 動詞の -ing 形',
    steps: [`主語 ${subj.en} → ${be}`, `${vp.v} → ${ing(vp.v)}`, `${be} ${ing(vp.v)}`],
  };
}

const ING_VERBS = [
  ['make', '作る'], ['write', '書く'], ['come', '来る'], ['use', '使う'], ['dance', '踊る'], ['have', '食べる'], ['ride', '乗る'],
  ['swim', '泳ぐ'], ['run', '走る'], ['sit', 'すわる'], ['get', '手に入れる'], ['stop', '止める'], ['begin', '始める'], ['put', '置く'],
  ['study', '勉強する'], ['play', '遊ぶ'], ['cook', '料理する'], ['read', '読む'], ['watch', '見る'], ['listen', '聞く'], ['see', '見える'],
];
function ingRule(v) {
  if (/ie$/.test(v)) return 'ie → ying';
  if (/[^aeiouy]e$/.test(v)) return 'e で終わる → e をとって ing';
  if (ing(v) === `${v}${v.at(-1)}ing`) return '短母音＋子音字で終わる → 最後の文字を重ねて ing';
  return 'そのまま ing';
}
function genSpell(rng) {
  const [v, ja] = rng.pick(ING_VERBS);
  const ans = ing(v);
  return {
    stem: `${v}（${ja}）の -ing 形をつづろう`,
    ...spellAns(rng, ans, { extra: 2 }),
    hint: 'e で終わる → e をとる（make → making）。run, swim, sit などは最後の文字を重ねる。',
    steps: [`${v} → ${ingRule(v)}`, `答え: ${ans}`],
    check: { kind: 'en-form', base: v, form: 'ing' },
  };
}

// 「いつもの習慣」か「今していること」かを見分ける
function genVs(rng) {
  const subj = rng.pick(SUBJ);
  const vp = rng.pick(VP_ACTION);
  const now = rng.chance(0.5);
  const [tEn, tJa] = now ? ['now', '今'] : pickTime(rng, vp, 'habit');
  const be = bePresent(subj);
  const prog = `${be} ${ing(vp.v)}`;
  const simp = simple(vp, subj);
  const right = now ? prog : simp;
  return {
    ...frameQ(rng, {
      chunks: [subj.en, right, ...(vp.obj ? [vp.obj] : [])], at: 1, correct: right, tail: tEn,
      ja: jaSentence(subj, vp, now ? 'prog' : 'pres', 'pos', tJa),
      wrongs: [
        now ? { t: simp, msg: `${tEn}（今）があるので、今していること → ${prog}。` } : { t: prog, msg: `${tEn} は「いつもの習慣」。進行形ではなくふつうの形 ${simp}。` },
        { t: `${be} ${vp.v}`, msg: 'be動詞と原形はいっしょに使わない。' },
        { t: is3sg(subj) ? vp.v : third(vp.v), msg: is3sg(subj) ? `主語 ${subj.en} は3人称単数。` : `主語が ${subj.en} なら s はつけない。` },
      ],
    }),
    hint: 'now（今）→ 進行形。every day など「いつも」→ ふつうの現在形。',
    steps: [`時を表す語: ${tEn}`, now ? `今していること → ${prog}` : `いつもの習慣 → ${simp}`],
  };
}

function genOrder(rng) {
  const vp = rng.pick(VP_ACTION);
  if (rng.chance(0.3)) {
    const subj = rng.pick(SUBJ_Q);
    const be = bePresent(subj);
    return {
      stem: `日本語に合うように並べかえよう\n${subj.ja}は今、何をしていますか？`,
      ...orderAns(rng, ['What', be, subj.en, 'doing'], { tail: 'now', end: '?', decoys: [{ t: is3sg(subj) ? 'does' : 'do', msg: '進行形の疑問文は be動詞を使う。do / does は使わない！' }] }),
      hint: '何をしていますか？ → What ＋ be動詞 ＋ 主語 ＋ doing 〜?',
      steps: [`What ${be} ${subj.en} doing now?`],
      check: { kind: 'en-order' },
    };
  }
  const type = rng.pick(['neg', 'q']);
  const subj = rng.pick(type === 'q' ? SUBJ_Q : SUBJ);
  const be = bePresent(subj);
  return {
    stem: `日本語に合うように並べかえよう\n${jaSentence(subj, vp, 'prog', type, '今')}`,
    ...orderAns(rng, clause(subj, vp, 'prog', type), { tail: 'now', end: type === 'q' ? '?' : '.', decoys: [{ t: is3sg(subj) ? 'does' : 'do', msg: '進行形の否定・疑問は be動詞を使う。do / does は使わない！' }] }),
    hint: type === 'q' ? 'be動詞 ＋ 主語 ＋ -ing 〜?' : '主語 ＋ be動詞 ＋ not ＋ -ing 〜.',
    steps: [type === 'q' ? `${cap(be)} を主語の前へ` : `${be} のあとに not`],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-prog',
  subject: 'english',
  stage: 1,
  area: '英語棟・回し車の部屋',
  title: '現在進行形',
  emoji: '🐹',
  prereqs: ['en-3sg'],
  tool: 'sniper',
  hintCard: [
    '今〜しているところ → am / is / are ＋ 動詞の -ing',
    'ing のつけ方: make → making（e をとる）、run → running（重ねる）',
    'now → 進行形 ／ every day → ふつうの現在形',
    '否定・疑問は be動詞で: I am not 〜ing. ／ Are you 〜ing?',
  ],
  generators: {
    'pg-form': { difficulty: 1, gen: genForm },
    'pg-spell': { difficulty: 2, gen: genSpell },
    'pg-vs': { difficulty: 2, gen: genVs },
    'pg-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'pg-l1',
      title: 'be ＋ -ing',
      unlocks: ['pg-form'],
      build(rng) {
        return [
          { text: '「今〜しているところ」は、be動詞 ＋ 動詞の -ing 形。', en: 'I play tennis.（いつもする）\nI am playing tennis now.（今している）' },
          { text: 'be動詞は主語で決まる（am / is / are）。-ing だけ、be動詞だけ、はどちらもダメ。', en: '× I playing tennis now.\n× I am play tennis now.' },
          { text: 'やってみよう。', q: genForm(rng) },
          { text: 'もう1問。', q: genForm(rng) },
        ];
      },
    },
    {
      id: 'pg-l2',
      title: '-ing のつけ方',
      unlocks: ['pg-spell'],
      build(rng) {
        return [
          { text: '-ing のつけ方は3パターン。', en: 'play → playing（そのまま）\nmake → making（e をとる）\nrun → running（最後の文字を重ねる）' },
          { text: '重ねる仲間: run, swim, sit, get, stop, begin, put' },
          { text: 'つづってみよう。', q: genSpell(rng) },
          { text: 'もう1問。', q: genSpell(rng) },
        ];
      },
    },
    {
      id: 'pg-l3',
      title: 'いつも？ 今？',
      unlocks: ['pg-vs'],
      build(rng) {
        return [
          { text: '時を表す語がヒント。', en: 'every day / on Sundays → いつも（現在形）\nnow → 今（進行形）' },
          { text: '見分けよう。', q: genVs(rng) },
          { text: 'もう1問。', q: genVs(rng) },
        ];
      },
    },
    {
      id: 'pg-l4',
      title: '否定文・疑問文',
      unlocks: ['pg-order'],
      build(rng) {
        return [
          { text: '進行形は be動詞の文。だから否定・疑問も be動詞を動かす。', en: 'Ken is playing tennis now.\n→ Ken is not playing tennis now.\n→ Is Ken playing tennis now?' },
          { text: '「何をしていますか？」は What ＋ 疑問文。', en: 'What are you doing now?\n— I am reading a book.' },
          { text: '並べかえ。', q: genOrder(rng) },
          { text: 'もう1問。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
