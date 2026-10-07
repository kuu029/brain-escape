// 英語 第1段階: 過去形（規則動詞・不規則動詞・did・was / were）
import { SUBJ, SUBJ_Q, VP_ALL, TIME, pickTime, COMPLEMENT_PAST, clause, jaSentence, beClause, jaBe, compOf, cap, is3sg } from './gram.js';
import { past, third, ing, isIrregular, bePast, bePresent } from './lex.js';
import { frameQ, orderAns, spellAns } from './kit-en.js';

const REG_VP = VP_ALL.filter((vp) => !isIrregular(vp.v));
const IRR_VP = VP_ALL.filter((vp) => isIrregular(vp.v));

function pastRule(v) {
  if (isIrregular(v)) return `${v} は不規則動詞 → ${past(v)}（覚えるしかない！）`;
  if (v.endsWith('e')) return 'e で終わる → d だけつける';
  if (/[^aeiou]y$/.test(v)) return '子音字＋y → y を i にかえて ed';
  if (past(v) === `${v}${v.at(-1)}ed`) return '最後の文字を重ねて ed';
  return 'ふつうは ed をつける';
}

function formQ(rng, pool) {
  const subj = rng.pick(SUBJ);
  const vp = rng.pick(pool);
  const [tEn, tJa] = pickTime(rng, vp, 'past');
  const right = past(vp.v);
  return {
    ...frameQ(rng, {
      chunks: clause(subj, vp, 'past', 'pos'), at: 1, correct: right, tail: tEn,
      ja: jaSentence(subj, vp, 'past', 'pos', tJa),
      wrongs: [
        { t: is3sg(subj) ? third(vp.v) : vp.v, msg: `${tEn}（過去）のことなので過去形 ${right}。` },
        { t: `${vp.v}ed`, msg: isIrregular(vp.v) ? `${vp.v} は不規則動詞。過去形は ${right}。` : `つづりに注意: ${pastRule(vp.v)}。` },
        { t: `${bePast(subj)} ${vp.v}`, msg: '一般動詞の過去は、動詞を過去形にするだけ。be動詞はいらない。' },
        { t: ing(vp.v), msg: '-ing だけでは文の動詞になれない。' },
      ],
    }),
    hint: '過去のこと → 動詞を過去形に。ふつう ed、不規則動詞は形が変わる。主語が何でも形は同じ。',
    steps: [`${tEn} → 過去のこと`, `${vp.v} → ${pastRule(vp.v)}`, `→ ${right}`],
  };
}
function spellQ(rng, pool) {
  const vp = rng.pick(pool);
  const ans = past(vp.v);
  return {
    stem: `${vp.v} の過去形をつづろう`,
    ...spellAns(rng, ans, { extra: 2 }),
    hint: isIrregular(vp.v) ? `${vp.v} は不規則動詞。` : 'ふつう ed。e で終わる → d、子音字＋y → ied、stop → stopped のように重ねる語も。',
    steps: [`${vp.v} → ${pastRule(vp.v)}`, `答え: ${ans}`],
    check: { kind: 'en-form', base: vp.v, form: 'past' },
  };
}
const genReg = (rng) => (rng.chance(0.65) ? formQ(rng, REG_VP) : spellQ(rng, REG_VP));
const genIrr = (rng) => (rng.chance(0.65) ? formQ(rng, IRR_VP) : spellQ(rng, IRR_VP));

// did を使う否定文・疑問文
function genDid(rng) {
  const kind = rng.pick(['aux', 'neg', 'verb']);
  const subj = rng.pick(kind === 'neg' ? SUBJ : SUBJ_Q);
  const vp = rng.pick(VP_ALL);
  const [tEn, tJa] = pickTime(rng, vp, 'past');
  if (kind === 'aux') {
    return {
      ...frameQ(rng, {
        chunks: clause(subj, vp, 'past', 'q'), at: 0, correct: 'Did', tail: tEn, end: '?', ja: jaSentence(subj, vp, 'past', 'q', tJa),
        wrongs: [{ t: is3sg(subj) ? 'Does' : 'Do', msg: `${tEn}（過去）のことなので Did。` }, { t: cap(bePast(subj)), msg: `${vp.v} は一般動詞。be動詞は使わない。` }, { t: cap(bePresent(subj)), msg: `${vp.v} は一般動詞。be動詞は使わない。` }],
      }),
      hint: '一般動詞の過去の疑問文 → Did ＋ 主語 ＋ 動詞の原形 〜?',
      steps: [`過去 → Did`, `動詞は原形 ${vp.v}`],
    };
  }
  if (kind === 'neg') {
    return {
      ...frameQ(rng, {
        chunks: [subj.en, 'did not', vp.v, ...(vp.obj ? [vp.obj] : [])], at: 1, correct: 'did not', tail: tEn, ja: jaSentence(subj, vp, 'past', 'neg', tJa),
        wrongs: [{ t: is3sg(subj) ? 'does not' : 'do not', msg: `${tEn}（過去）のことなので did not（didn't）。` }, { t: `${bePast(subj)} not`, msg: `${vp.v} は一般動詞。be動詞は使わない。` }, { t: 'not', msg: 'not だけでは足りない。did not にする。' }],
      }),
      hint: '一般動詞の過去の否定 → did not（didn\'t）＋ 動詞の原形',
      steps: ['過去の否定 → did not', `動詞は原形 ${vp.v}`],
    };
  }
  return {
    ...frameQ(rng, {
      chunks: clause(subj, vp, 'past', 'q'), at: 2, correct: vp.v, tail: tEn, end: '?', ja: jaSentence(subj, vp, 'past', 'q', tJa),
      wrongs: [{ t: past(vp.v), msg: 'Did を使ったら、過去は did が表す。動詞は原形にもどす！' }, { t: third(vp.v), msg: 'Did のあとは原形。' }, { t: ing(vp.v), msg: 'Did のあとは原形。' }],
    }),
    hint: 'did / didn\'t を使ったら、動詞は原形（過去形にしない）。',
    steps: [`Did ${subj.en} ${vp.v} ...? ← 過去は did が担当`],
  };
}

// was / were
function genWas(rng) {
  const type = rng.pick(['pos', 'pos', 'neg', 'q']);
  const subj = rng.pick(type === 'q' ? SUBJ_Q : SUBJ);
  const c = rng.pick(COMPLEMENT_PAST);
  const [tEn, tJa] = rng.pick(TIME.past.slice(0, 3));
  const chunks = beClause(subj, c, 'past', type);
  const be = bePast(subj);
  const q = type === 'q';
  const other = be === 'was' ? 'were' : 'was';
  return {
    ...frameQ(rng, {
      chunks, at: q ? 0 : 1, correct: q ? cap(be) : be, tail: tEn, end: q ? '?' : '.', ja: jaBe(subj, c, 'past', type, tJa),
      wrongs: [
        { t: q ? cap(other) : other, msg: `主語が ${subj.en} なら ${be}。（I・1人 → was、you・複数 → were）` },
        { t: q ? cap(bePresent(subj)) : bePresent(subj), msg: `${tEn}（過去）のことなので過去形の ${be}。` },
        { t: q ? 'Did' : 'did', msg: `${compOf(c, subj)} は動詞じゃない。be動詞の過去 ${be} を使う。` },
      ],
    }),
    hint: 'be動詞の過去: am / is → was、are → were',
    steps: [`主語 ${subj.en} → 今なら ${bePresent(subj)}`, `過去なら → ${be}`],
  };
}

function genOrder(rng) {
  const subj = rng.pick(SUBJ_Q);
  const vp = rng.pick(VP_ALL);
  const [tEn, tJa] = pickTime(rng, vp, 'past');
  const type = rng.pick(['neg', 'q']);
  return {
    stem: `日本語に合うように並べかえよう\n${jaSentence(subj, vp, 'past', type, tJa)}`,
    ...orderAns(rng, clause(subj, vp, 'past', type), { tail: tEn, end: type === 'q' ? '?' : '.', decoys: [{ t: past(vp.v) === vp.v ? third(vp.v) : past(vp.v), msg: 'did を使ったら、動詞は原形（過去形にしない）！' }] }),
    hint: type === 'q' ? 'Did ＋ 主語 ＋ 動詞の原形 〜?' : '主語 ＋ did not ＋ 動詞の原形 〜.',
    steps: [`did を使う → 動詞は ${vp.v}（原形）`],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-past',
  subject: 'english',
  stage: 1,
  area: '英語棟・化石の地下室',
  title: '過去形',
  emoji: '🦖',
  prereqs: ['en-3sg'],
  tool: 'rewind',
  hintCard: [
    '過去形: ふつう ed（played）、e で終わる → d（liked）、子音字＋y → ied（studied）',
    '不規則動詞: go → went、eat → ate、see → saw、have → had、make → made',
    '否定・疑問は did。そのとき動詞は原形（Did you go 〜?）',
    'be動詞の過去: am / is → was、are → were',
  ],
  generators: {
    'pa-reg': { difficulty: 1, gen: genReg },
    'pa-irr': { difficulty: 2, gen: genIrr },
    'pa-did': { difficulty: 2, gen: genDid },
    'pa-was': { difficulty: 1, gen: genWas },
    'pa-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'pa-l1',
      title: '規則動詞の過去形',
      unlocks: ['pa-reg'],
      build(rng) {
        return [
          { text: '過去のことは動詞を過去形にする。主語が何でも形は同じ（s はつけない）。', en: 'I play tennis every day.\nI played tennis yesterday.\nKen played tennis yesterday.' },
          { text: 'ed のつけ方', en: 'play → played（ふつう）\nlike → liked（e で終わる → d）\nstudy → studied（子音字＋y → ied）\nstop → stopped（重ねる）' },
          { text: 'やってみよう。', q: formQ(rng, REG_VP) },
          { text: 'つづりも。', q: spellQ(rng, REG_VP) },
        ];
      },
    },
    {
      id: 'pa-l2',
      title: '不規則動詞',
      unlocks: ['pa-irr'],
      build(rng) {
        return [
          { text: 'ed をつけない「不規則動詞」もある。よく出るものから覚えよう。', en: 'go → went　come → came\neat → ate　see → saw\nhave → had　make → made\nget → got　take → took' },
          { text: 'もっと', en: 'read → read（読み方は「レッド」）\nwrite → wrote　speak → spoke\nbuy → bought　teach → taught' },
          { text: 'やってみよう。', q: formQ(rng, IRR_VP) },
          { text: 'つづりも。', q: spellQ(rng, IRR_VP) },
        ];
      },
    },
    {
      id: 'pa-l3',
      title: 'did の否定文・疑問文',
      unlocks: ['pa-did', 'pa-order'],
      build(rng) {
        return [
          { text: '過去の否定・疑問は did を使う。過去は did が表すので、動詞は原形にもどす。', en: 'I went to school.\n→ I did not go to school.\n→ Did you go to school?' },
          { text: '⚠️ ミス注意', en: '× Did you went to school?\n○ Did you go to school?' },
          { text: 'やってみよう。', q: genDid(rng) },
          { text: 'もう1問。', q: genDid(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
    {
      id: 'pa-l4',
      title: 'was / were',
      unlocks: ['pa-was'],
      build(rng) {
        return [
          { text: 'be動詞の過去は2つだけ。', en: 'am / is → was\nare → were' },
          { text: '否定・疑問は今と同じルール（be動詞を動かす）。', en: 'I was busy yesterday.\nI was not busy yesterday.\nWere you busy yesterday?' },
          { text: 'やってみよう。', q: genWas(rng) },
          { text: 'もう1問。', q: genWas(rng) },
        ];
      },
    },
  ],
};
