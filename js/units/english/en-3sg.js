// 英語 第1段階: 3単現のs と can
import { SUBJ, SUBJ3, SUBJ_Q, VP_ALL, TIME, pickTime, clause, jaSentence, cap, is3sg, sentence } from './gram.js';
import { third, ing, bePresent } from './lex.js';
import { frameQ, orderAns, spellAns, BLANK } from './kit-en.js';

const S_RULE = '主語が he / she / ケンなど「1人・1つ（自分と相手以外）」で、今のことなら動詞に s をつける。';

// 動詞の形を選ぶ（3人称単数かどうかを見分ける）
function genForm(rng) {
  const subj = rng.chance(0.6) ? rng.pick(SUBJ3) : rng.pick(SUBJ.filter((s) => !is3sg(s)));
  const vp = rng.pick(VP_ALL);
  const [tEn, tJa] = pickTime(rng, vp, 'habit');
  const s3 = is3sg(subj);
  const right = s3 ? third(vp.v) : vp.v;
  const other = s3 ? vp.v : third(vp.v);
  return {
    ...frameQ(rng, {
      chunks: clause(subj, vp, 'pres', 'pos'), at: 1, correct: right, tail: tEn,
      ja: jaSentence(subj, vp, 'pres', 'pos', tJa),
      wrongs: [
        { t: other, msg: s3 ? `主語 ${subj.en} は1人（3人称単数）。動詞に s をつけて ${right}！` : `主語が ${subj.en} なら s はつけない。` },
        { t: `${bePresent(subj)} ${vp.v}`, msg: '一般動詞の文に be動詞はいらない。' },
        { t: ing(vp.v), msg: '-ing の形だけでは文の動詞になれない。' },
      ],
    }),
    hint: S_RULE,
    steps: [`主語は ${subj.en} → ${s3 ? '3人称単数' : '3人称単数ではない'}`, s3 ? `${vp.v} に s → ${right}` : `${vp.v} のまま`],
  };
}

// s のつけ方（つづり）
const SPELL_VERBS = [
  ['watch', '見る'], ['wash', '洗う'], ['teach', '教える'], ['go', '行く'], ['do', 'する'], ['study', '勉強する'],
  ['try', 'やってみる'], ['carry', '運ぶ'], ['have', '持っている'], ['fix', '直す'], ['play', '遊ぶ'], ['enjoy', '楽しむ'],
  ['like', '好きだ'], ['live', '住む'], ['speak', '話す'], ['cook', '料理する'], ['swim', '泳ぐ'], ['catch', 'つかまえる'],
  ['cry', '泣く'], ['buy', '買う'], ['stay', '滞在する'], ['finish', '終える'], ['use', '使う'], ['come', '来る'],
];
function sRule(v) {
  if (v === 'have') return 'have は特別: has';
  if (/(s|x|z|ch|sh|o)$/.test(v)) return 's, x, ch, sh, o で終わる → es';
  if (/[^aeiou]y$/.test(v)) return '子音字＋y で終わる → y を i にかえて es';
  return 'ふつうは s をつけるだけ';
}
function genSpell(rng) {
  // 半分は文の中で（主語 ＋ （　　） ＋ 〜）。残りは動詞だけ（es / ies の形を集中して練習）
  if (rng.chance(0.5)) {
    const subj = rng.pick(SUBJ3);
    const vp = rng.pick(VP_ALL);
    const [tEn, tJa] = pickTime(rng, vp, 'habit');
    const ans = third(vp.v);
    const chunks = clause(subj, vp, 'pres', 'pos');
    return {
      stem: `${jaSentence(subj, vp, 'pres', 'pos', tJa)}\n${sentence([...chunks.map((c, i) => (i === 1 ? BLANK : c)), tEn])}\n（　　）に入る形をつづろう（もとの形: ${vp.v}）`,
      ...spellAns(rng, ans, { extra: 2 }),
      hint: S_RULE,
      steps: [`主語 ${subj.en} は3人称単数`, `${vp.v} → ${sRule(vp.v)}`, `答え: ${ans}`],
      check: { kind: 'en-form', base: vp.v, form: 'third' },
    };
  }
  const [v, ja] = rng.pick(SPELL_VERBS);
  const ans = third(v);
  return {
    stem: `主語が he のとき、${v}（${ja}）はどんな形になる？\nHe （　　） ...`,
    ...spellAns(rng, ans, { extra: 2 }),
    hint: 'ふつうは s。s/x/ch/sh/o で終わる → es。子音字＋y → ies。have → has。',
    steps: [`${v} → ${sRule(v)}`, `答え: ${ans}`],
    check: { kind: 'en-form', base: v, form: 'third' },
  };
}

// does を使う否定文・疑問文
function genNegQ(rng) {
  const subj = rng.pick(SUBJ3);
  const vp = rng.pick(VP_ALL);
  const [tEn, tJa] = pickTime(rng, vp, 'habit');
  const kind = rng.pick(['aux', 'neg', 'verb']);
  if (kind === 'aux') {
    return {
      ...frameQ(rng, {
        chunks: clause(subj, vp, 'pres', 'q'), at: 0, correct: 'Does', tail: tEn, end: '?', ja: jaSentence(subj, vp, 'pres', 'q', tJa),
        wrongs: [{ t: 'Do', msg: `主語 ${subj.en} は3人称単数なので Does。` }, { t: 'Is', msg: `${vp.v} は一般動詞。be動詞は使わない。` }, { t: 'Are', msg: `${vp.v} は一般動詞。be動詞は使わない。` }],
      }),
      hint: '3人称単数の疑問文 → Does ＋ 主語 ＋ 動詞の原形 〜?',
      steps: [`主語 ${subj.en} は3人称単数 → Does`],
    };
  }
  if (kind === 'neg') {
    const chunks = [subj.en, 'does not', vp.v, ...(vp.obj ? [vp.obj] : [])];
    return {
      ...frameQ(rng, {
        chunks, at: 1, correct: 'does not', tail: tEn, ja: jaSentence(subj, vp, 'pres', 'neg', tJa),
        wrongs: [{ t: 'do not', msg: `主語 ${subj.en} は3人称単数なので does not（doesn't）。` }, { t: 'is not', msg: `${vp.v} は一般動詞。be動詞は使わない。` }, { t: 'not', msg: 'not だけでは足りない。does not にする。' }],
      }),
      hint: '3人称単数の否定 → does not（doesn\'t）＋ 動詞の原形',
      steps: [`${subj.en} → does not ＋ ${vp.v}`],
    };
  }
  // Does のあとの動詞は原形
  return {
    ...frameQ(rng, {
      chunks: clause(subj, vp, 'pres', 'q'), at: 2, correct: vp.v, tail: tEn, end: '?', ja: jaSentence(subj, vp, 'pres', 'q', tJa),
      wrongs: [{ t: third(vp.v), msg: 'Does を使ったら、s は does が持っていく。動詞は原形（s なし）！' }, { t: ing(vp.v), msg: 'Does のあとは動詞の原形。' }, { t: `to ${vp.v}`, msg: 'Does のあとは動詞の原形だけ。' }],
    }),
    hint: 'does / doesn\'t を使ったら、動詞は原形（s をつけない）。',
    steps: [`Does ${subj.en} ${vp.v} ...? ← s は does にうつる`],
  };
}

// 並べかえ（does / can）
const CAN_VP = [
  ['swim', '', '泳げます'], ['play', 'the piano', 'ピアノがひけます'], ['speak', 'English', '英語が話せます'],
  ['cook', 'curry', 'カレーが作れます'], ['ride', 'a bike', '自転車に乗れます'], ['run', 'fast', '速く走れます'],
  ['sing', 'well', 'じょうずに歌えます'], ['dance', 'well', 'じょうずに踊れます'], ['make', 'a cake', 'ケーキが作れます'],
  ['read', 'kanji', '漢字が読めます'], ['write', 'English', '英語が書けます'], ['play', 'the guitar', 'ギターがひけます'],
];
const canJa = (subj, c, type) => `${subj.ja}は${type === 'neg' ? c[2].replace(/ます$/, 'ません') : c[2]}${type === 'q' ? 'か？' : '。'}`;
function canChunks(subj, c, type) {
  const obj = c[1] ? [c[1]] : [];
  if (type === 'neg') return [subj.en, 'cannot', c[0], ...obj];
  if (type === 'q') return ['Can', subj.en, c[0], ...obj];
  return [subj.en, 'can', c[0], ...obj];
}

function genOrder(rng) {
  if (rng.chance(0.35)) {
    const type = rng.pick(['pos', 'neg', 'q']);
    const subj = rng.pick(type === 'q' ? SUBJ_Q : SUBJ);
    const c = rng.pick(CAN_VP);
    return {
      stem: `日本語に合うように並べかえよう\n${canJa(subj, c, type)}`,
      ...orderAns(rng, canChunks(subj, c, type), { end: type === 'q' ? '?' : '.', decoys: [{ t: third(c[0]), msg: 'can のあとは動詞の原形（s をつけない）！' }] }),
      hint: 'can ＋ 動詞の原形。疑問文は Can を前へ、否定は cannot。',
      steps: [type === 'q' ? 'Can ＋ 主語 ＋ 原形 〜?' : type === 'neg' ? '主語 ＋ cannot ＋ 原形' : '主語 ＋ can ＋ 原形'],
      check: { kind: 'en-order' },
    };
  }
  const subj = rng.pick(SUBJ3);
  const vp = rng.pick(VP_ALL);
  const [tEn, tJa] = pickTime(rng, vp, 'habit');
  const type = rng.pick(['neg', 'q']);
  return {
    stem: `日本語に合うように並べかえよう\n${jaSentence(subj, vp, 'pres', type, tJa)}`,
    ...orderAns(rng, clause(subj, vp, 'pres', type), { tail: tEn, end: type === 'q' ? '?' : '.', decoys: [{ t: third(vp.v), msg: 'does を使ったら、動詞は原形（s をつけない）！' }] }),
    hint: type === 'q' ? 'Does ＋ 主語 ＋ 動詞の原形 〜?' : '主語 ＋ does not ＋ 動詞の原形 〜.',
    steps: [`does を使う → 動詞は ${vp.v}（原形）`],
    check: { kind: 'en-order' },
  };
}

// can のあとの動詞
function genCan(rng) {
  const type = rng.pick(['pos', 'neg', 'q']);
  const subj = rng.pick(type === 'q' ? SUBJ_Q : SUBJ);
  const c = rng.pick(CAN_VP);
  const chunks = canChunks(subj, c, type);
  return {
    ...frameQ(rng, {
      chunks, at: 2, correct: c[0], end: type === 'q' ? '?' : '.', ja: canJa(subj, c, type),
      wrongs: [{ t: third(c[0]), msg: 'can のあとは原形。主語が he でも s はつけない！' }, { t: ing(c[0]), msg: 'can のあとは原形。' }, { t: `to ${c[0]}`, msg: 'can のあとに to はいらない。' }],
    }),
    hint: 'can ＋ 動詞の原形（主語が何でも形は変わらない）。',
    steps: [`can のあと → ${c[0]}（原形）`],
  };
}

export default {
  id: 'en-3sg',
  subject: 'english',
  stage: 1,
  area: '英語棟・s の回廊',
  title: '3単現のs と can',
  emoji: '🐍',
  prereqs: ['en-be'],
  tool: 'freeze',
  hintCard: [
    '主語が he / she / 1人・1つ ＆ 今のこと → 動詞に s',
    's のつけ方: ふつう s ／ s・x・ch・sh・o → es ／ 子音字＋y → ies ／ have → has',
    '否定・疑問は does。そのとき動詞は原形（s は does がもっていく）',
    'can ＋ 動詞の原形（主語が he でも s なし）',
  ],
  generators: {
    '3s-form': { difficulty: 1, gen: genForm },
    '3s-spell': { difficulty: 2, gen: genSpell },
    '3s-negq': { difficulty: 2, gen: genNegQ },
    '3s-order': { difficulty: 2, gen: genOrder },
    'can-form': { difficulty: 1, gen: genCan },
  },
  lessons: [
    {
      id: '3s-l1',
      title: '3単現のs',
      unlocks: ['3s-form'],
      build(rng) {
        return [
          { text: '主語が「自分（I）」でも「相手（you）」でもない1人・1つ のとき、今のことを言うなら動詞に s がつく。', en: 'I play tennis.\nKen plays tennis.' },
          { text: 's がつく主語の例: he / she / Ken / my brother\ns がつかない主語: I / you / we / they / my friends（2人以上）' },
          { text: 'どれが正しい？', q: genForm(rng) },
          { text: 'もう1問。', q: genForm(rng) },
        ];
      },
    },
    {
      id: '3s-l2',
      title: 's のつけ方',
      unlocks: ['3s-spell'],
      build(rng) {
        return [
          { text: 's のつけ方は4パターン。', en: 'play → plays（ふつう）\nwatch → watches（ch, sh, s, x, o → es）\nstudy → studies（子音字＋y → ies）\nhave → has（特別）' },
          { text: 'play は y で終わるけど、y の前が母音字（a）なので plays。子音字＋y のときだけ ies！' },
          { text: 'つづってみよう。', q: genSpell(rng) },
          { text: 'もう1問。', q: genSpell(rng) },
        ];
      },
    },
    {
      id: '3s-l3',
      title: 'does の否定文・疑問文',
      unlocks: ['3s-negq', '3s-order'],
      build(rng) {
        return [
          { text: '3人称単数の否定・疑問は do ではなく does。そして s は does がもっていく。', en: 'Ken plays tennis.\n→ Ken does not play tennis.\n→ Does Ken play tennis?' },
          { text: '⚠️ ミス注意', en: '× Does Ken plays tennis?\n○ Does Ken play tennis?' },
          { text: 'やってみよう。', q: genNegQ(rng) },
          { text: 'もう1問。', q: genNegQ(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
    {
      id: '3s-l4',
      title: 'can（〜できる）',
      unlocks: ['can-form'],
      build(rng) {
        const c = rng.pick(CAN_VP);
        return [
          { text: 'can は「〜できる」。can のあとの動詞は、主語が何でも原形。', en: `I can ${c[0]}${c[1] ? ` ${c[1]}` : ''}.\nKen can ${c[0]}${c[1] ? ` ${c[1]}` : ''}.（s はつけない！）` },
          { text: '否定は cannot（can\'t）、疑問は Can を前へ。', en: `Ken cannot ${c[0]}${c[1] ? ` ${c[1]}` : ''}.\nCan Ken ${c[0]}${c[1] ? ` ${c[1]}` : ''}?` },
          { text: 'やってみよう。', q: genCan(rng) },
          { text: 'もう1問。', q: genCan(rng) },
        ];
      },
    },
  ],
};
