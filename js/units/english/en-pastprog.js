// 英語 第2段階: 過去進行形（was / were ＋ -ing）
import { SUBJ, SUBJ_Q, VP_ACTION, TIME_PASTPROG, pastProgClause, jaPastProg, is3sg, cap } from './gram.js';
import { third, ing, past, bePresent, bePast } from './lex.js';
import { frameQ, orderAns } from './kit-en.js';

function genForm(rng) {
  const subj = rng.pick(SUBJ);
  const vp = rng.pick(VP_ACTION);
  const [tEn, tJa] = rng.pick(TIME_PASTPROG);
  const be = bePast(subj);
  const right = `${be} ${ing(vp.v)}`;
  const other = be === 'was' ? 'were' : 'was';
  return {
    ...frameQ(rng, {
      chunks: [subj.en, right, ...(vp.obj ? [vp.obj] : [])], at: 1, correct: right, tail: tEn,
      ja: jaPastProg(subj, vp, 'pos', tJa),
      wrongs: [
        { t: `${other} ${ing(vp.v)}`, msg: `主語が ${subj.en} なら ${be}。（I・1人 → was、you・複数 → were）` },
        { t: `${bePresent(subj)} ${ing(vp.v)}`, msg: `${tEn} は過去。be動詞も過去形（was / were）にする。` },
        // read のように原形と過去形が同じ動詞は、原形を選択肢にすると過去の文として正しくなってしまう
        past(vp.v) === vp.v ? { t: ing(vp.v), msg: '-ing だけでは足りない。was / were が必要！' } : { t: is3sg(subj) ? third(vp.v) : vp.v, msg: '「〜していました」は was / were ＋ -ing。' },
      ],
    }),
    hint: '過去のある時に〜していた → was / were ＋ 動詞の -ing',
    steps: [`主語 ${subj.en} → ${be}`, `${be} ${ing(vp.v)}`],
  };
}

function genNegQ(rng) {
  const type = rng.pick(['neg', 'q', 'what']);
  const subj = rng.pick(type === 'neg' ? SUBJ : SUBJ_Q);
  const vp = rng.pick(VP_ACTION);
  const [tEn, tJa] = rng.pick(TIME_PASTPROG);
  const be = bePast(subj);
  const other = be === 'was' ? 'were' : 'was';
  if (type === 'what') {
    return {
      ...frameQ(rng, {
        chunks: ['What', be, subj.en, 'doing'], at: 1, correct: be, tail: tEn, end: '?', ja: `${subj.ja}は${tJa}、何をしていましたか？`,
        wrongs: [{ t: other, msg: `主語が ${subj.en} なら ${be}。` }, { t: 'did', msg: '「〜していましたか」は進行形の疑問文。be動詞（was / were）を使う。' }, { t: bePresent(subj), msg: `${tEn} は過去。` }],
      }),
      hint: '何をしていましたか？ → What ＋ was / were ＋ 主語 ＋ doing 〜?',
      steps: [`What ${be} ${subj.en} doing ${tEn}?`],
    };
  }
  if (type === 'q') {
    return {
      ...frameQ(rng, {
        chunks: pastProgClause(subj, vp, 'q'), at: 0, correct: cap(be), tail: tEn, end: '?', ja: jaPastProg(subj, vp, 'q', tJa),
        wrongs: [{ t: cap(other), msg: `主語が ${subj.en} なら ${cap(be)}。` }, { t: 'Did', msg: '進行形の疑問文は be動詞を前へ。did は使わない。' }, { t: cap(bePresent(subj)), msg: `${tEn} は過去。` }],
      }),
      hint: '過去進行形の疑問文: Was / Were ＋ 主語 ＋ -ing 〜?',
      steps: [`${cap(be)} を前へ`],
    };
  }
  const chunks = [subj.en, `${be} not`, ing(vp.v), ...(vp.obj ? [vp.obj] : [])];
  return {
    ...frameQ(rng, {
      chunks, at: 1, correct: `${be} not`, tail: tEn, ja: jaPastProg(subj, vp, 'neg', tJa),
      wrongs: [{ t: `${other} not`, msg: `主語が ${subj.en} なら ${be}。` }, { t: 'did not', msg: '進行形の否定は be動詞のあとに not。' }, { t: `${bePresent(subj)} not`, msg: `${tEn} は過去。` }],
    }),
    hint: '過去進行形の否定: was / were ＋ not ＋ -ing',
    steps: [`${subj.en} ${be} not ${ing(vp.v)} ...`],
  };
}

function genOrder(rng) {
  const type = rng.pick(['pos', 'neg', 'q']);
  const subj = rng.pick(type === 'q' ? SUBJ_Q : SUBJ);
  const vp = rng.pick(VP_ACTION);
  const [tEn, tJa] = rng.pick(TIME_PASTPROG);
  return {
    stem: `日本語に合うように並べかえよう\n${jaPastProg(subj, vp, type, tJa)}`,
    ...orderAns(rng, pastProgClause(subj, vp, type), { tail: tEn, end: type === 'q' ? '?' : '.', decoys: [{ t: 'did', msg: '進行形の文は be動詞（was / were）を使う。did はいらない！' }] }),
    hint: 'was / were ＋ -ing。疑問文・否定文は was / were を動かす。',
    steps: [type === 'q' ? 'Was / Were を前へ' : type === 'neg' ? 'was / were のあとに not' : '主語 ＋ was / were ＋ -ing'],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-pastprog',
  subject: 'english',
  stage: 2,
  area: '英語棟・古い映写室',
  title: '過去進行形',
  emoji: '📽️',
  prereqs: ['en-prog', 'en-past'],
  tool: 'sniper',
  hintCard: [
    '過去のある時に〜していた → was / were ＋ -ing',
    'I・1人 → was ／ you・複数 → were',
    '否定: was not ＋ -ing ／ 疑問: Was you 〜ing? ではなく Were you 〜ing?',
    'What were you doing then?（そのとき何をしていた？）',
  ],
  generators: {
    'ppg-form': { difficulty: 1, gen: genForm },
    'ppg-negq': { difficulty: 2, gen: genNegQ },
    'ppg-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'ppg-l1',
      title: 'was / were ＋ -ing',
      unlocks: ['ppg-form'],
      build(rng) {
        return [
          { text: '現在進行形の be動詞を過去形にすると、過去進行形（〜していました）。', en: 'I am reading a book now.\nI was reading a book at that time.' },
          { text: 'やってみよう。', q: genForm(rng) },
          { text: 'もう1問。', q: genForm(rng) },
        ];
      },
    },
    {
      id: 'ppg-l2',
      title: '否定文・疑問文',
      unlocks: ['ppg-negq', 'ppg-order'],
      build(rng) {
        return [
          { text: '否定・疑問は was / were を動かす。', en: 'He was not sleeping.\nWere you sleeping?\nWhat were you doing at that time?' },
          { text: 'やってみよう。', q: genNegQ(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
