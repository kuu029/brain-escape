// 英語 第2段階: 未来（will / be going to）
import { SUBJ, SUBJ_Q, VP_ACTION, pickTime, TIME_FUTURE, willClause, goingClause, jaFuture, jaSentence, is3sg, cap } from './gram.js';
import { third, past, ing, bePresent } from './lex.js';
import { frameQ, orderAns } from './kit-en.js';

// will のあとの動詞
function genWill(rng) {
  const subj = rng.pick(SUBJ);
  const vp = rng.pick(VP_ACTION);
  const [tEn, tJa] = rng.pick(TIME_FUTURE);
  return {
    ...frameQ(rng, {
      chunks: willClause(subj, vp, 'pos'), at: 2, correct: vp.v, tail: tEn, ja: jaFuture(subj, vp, 'will', 'pos', tJa),
      wrongs: [
        { t: third(vp.v), msg: 'will のあとは動詞の原形。主語が he でも s はつけない！' },
        { t: past(vp.v), msg: 'will のあとは原形。' },
        { t: ing(vp.v), msg: 'will のあとは原形。' },
        { t: `to ${vp.v}`, msg: 'will のあとに to はいらない。' },
      ],
    }),
    hint: 'will ＋ 動詞の原形（主語が何でも形は同じ）',
    steps: [`未来のこと（${tEn}）→ will`, `will のあとは原形 ${vp.v}`],
  };
}

// be going to の be動詞
function genGoing(rng) {
  const subj = rng.pick(SUBJ);
  const vp = rng.pick(VP_ACTION);
  const [tEn, tJa] = rng.pick(TIME_FUTURE);
  const be = bePresent(subj);
  if (rng.chance(0.5)) {
    return {
      ...frameQ(rng, {
        chunks: goingClause(subj, vp, 'pos'), at: 1, correct: be, tail: tEn, ja: jaFuture(subj, vp, 'going', 'pos', tJa),
        wrongs: [...['am', 'is', 'are'].filter((b) => b !== be).map((b) => ({ t: b, msg: `主語が ${subj.en} なら ${be}。` })), { t: 'will', msg: 'will と be going to はいっしょに使わない。ここは be動詞。' }],
      }),
      hint: 'be going to ＋ 原形。be は主語で am / is / are を使い分ける。',
      steps: [`主語 ${subj.en} → ${be}`, `${be} going to ${vp.v}`],
    };
  }
  return {
    ...frameQ(rng, {
      chunks: goingClause(subj, vp, 'pos'), at: 4, correct: vp.v, tail: tEn, ja: jaFuture(subj, vp, 'going', 'pos', tJa),
      wrongs: [{ t: third(vp.v), msg: 'going to のあとは原形。' }, { t: ing(vp.v), msg: 'going to のあとは原形（-ing にしない）。' }, { t: past(vp.v), msg: 'going to のあとは原形。' }],
    }),
    hint: 'be going to ＋ 動詞の原形',
    steps: [`going to のあと → ${vp.v}（原形）`],
  };
}

// 否定文・疑問文
function genNegQ(rng) {
  const kind = rng.pick(['will', 'going']);
  const type = rng.pick(['neg', 'q']);
  const subj = rng.pick(type === 'q' ? SUBJ_Q : SUBJ);
  const vp = rng.pick(VP_ACTION);
  const [tEn, tJa] = rng.pick(TIME_FUTURE);
  const be = bePresent(subj);
  const ja = jaFuture(subj, vp, kind, type, tJa);
  const end = type === 'q' ? '?' : '.';
  if (kind === 'will') {
    const chunks = type === 'q' ? willClause(subj, vp, 'q') : [subj.en, 'will not', vp.v, ...(vp.obj ? [vp.obj] : [])];
    return {
      ...frameQ(rng, {
        chunks, at: type === 'q' ? 0 : 1, correct: type === 'q' ? 'Will' : 'will not', tail: tEn, end, ja,
        wrongs: type === 'q'
          ? [{ t: is3sg(subj) ? 'Does' : 'Do', msg: `${tEn} は未来。未来の疑問文は Will を前へ。` }, { t: 'Did', msg: `${tEn} は未来。` }, { t: cap(be), msg: 'be動詞を使うなら going to が必要。ここは Will。' }]
          : [{ t: 'not will', msg: 'not は will のあと。' }, { t: is3sg(subj) ? 'does not' : 'do not', msg: `${tEn} は未来。will not（won't）を使う。` }, { t: 'did not', msg: `${tEn} は未来。` }],
      }),
      hint: type === 'q' ? '未来の疑問文: Will ＋ 主語 ＋ 原形 〜?' : '未来の否定: will not（won\'t）＋ 原形',
      steps: [type === 'q' ? 'Will を前へ' : 'will のあとに not'],
    };
  }
  if (type === 'q') {
    return {
      ...frameQ(rng, {
        chunks: goingClause(subj, vp, 'q'), at: 0, correct: cap(be), tail: tEn, end, ja,
        wrongs: [{ t: 'Will', msg: 'going to の文は be動詞の文。疑問文は be動詞を前へ。' }, { t: is3sg(subj) ? 'Does' : 'Do', msg: 'going to の文は be動詞の文。do / does は使わない。' }, ...['Am', 'Is', 'Are'].filter((b) => b !== cap(be)).slice(0, 1).map((b) => ({ t: b, msg: `主語が ${subj.en} なら ${cap(be)}。` }))],
      }),
      hint: 'be going to の疑問文: be動詞を前へ（Are you going to 〜?）',
      steps: [`${cap(be)} ${subj.en} going to ${vp.v} ...?`],
    };
  }
  const chunks = [subj.en, `${be} not`, 'going to', vp.v, ...(vp.obj ? [vp.obj] : [])];
  return {
    ...frameQ(rng, {
      chunks, at: 1, correct: `${be} not`, tail: tEn, ja,
      wrongs: [{ t: is3sg(subj) ? 'does not' : 'do not', msg: 'going to の文は be動詞の文。否定は be動詞のあとに not。' }, { t: `not ${be}`, msg: 'not は be動詞のあと。' }, { t: 'will not', msg: 'will と going to はいっしょに使わない。' }],
    }),
    hint: 'be going to の否定: be動詞のあとに not',
    steps: [`${subj.en} ${be} not going to ${vp.v} ...`],
  };
}

// 時を表す語から、時制（いつも・過去・今・未来）を見分ける
function genVs(rng) {
  const subj = rng.pick(SUBJ);
  const vp = rng.pick(VP_ACTION);
  const kind = rng.pick(['habit', 'past', 'future', 'now']);
  const forms = {
    habit: is3sg(subj) ? third(vp.v) : vp.v,
    past: past(vp.v),
    future: `will ${vp.v}`,
    now: `${bePresent(subj)} ${ing(vp.v)}`,
  };
  const [tEn, tJa] = kind === 'future' ? rng.pick(TIME_FUTURE) : kind === 'now' ? ['now', '今'] : pickTime(rng, vp, kind);
  const ja = kind === 'future' ? jaFuture(subj, vp, 'will', 'pos', tJa) : jaSentence(subj, vp, kind === 'now' ? 'prog' : kind === 'past' ? 'past' : 'pres', 'pos', tJa);
  const NAME = { habit: 'いつもの習慣 → 現在形', past: '過去 → 過去形', future: '未来 → will', now: '今している → 進行形' };
  const right = forms[kind];
  return {
    ...frameQ(rng, {
      chunks: [subj.en, right, ...(vp.obj ? [vp.obj] : [])], at: 1, correct: right, tail: tEn, ja,
      // 「is playing ＋ 未来の語」は予定を表す正しい英語なので、未来の問題では進行形を選択肢に出さない
      wrongs: Object.entries(forms).filter(([k, f]) => k !== kind && f !== right && !(kind === 'future' && k === 'now')).map(([, f]) => ({ t: f, msg: `${tEn} は「${NAME[kind]}」。` })),
    }),
    hint: '時を表す語がヒント: every day → 現在形、yesterday → 過去形、tomorrow → will、now → 進行形',
    steps: [`${tEn} → ${NAME[kind]}`, `→ ${right}`],
  };
}

function genOrder(rng) {
  const kind = rng.pick(['will', 'going']);
  const type = rng.pick(['pos', 'neg', 'q']);
  const subj = rng.pick(type === 'q' ? SUBJ_Q : SUBJ);
  const vp = rng.pick(VP_ACTION);
  const [tEn, tJa] = rng.pick(TIME_FUTURE);
  const chunks = kind === 'will' ? willClause(subj, vp, type) : goingClause(subj, vp, type);
  const decoy = kind === 'will' ? third(vp.v) : 'will';
  return {
    stem: `日本語に合うように並べかえよう\n${jaFuture(subj, vp, kind, type, tJa)}`,
    ...orderAns(rng, chunks, { tail: tEn, end: type === 'q' ? '?' : '.', decoys: [{ t: decoy, msg: kind === 'will' ? 'will のあとは原形（s をつけない）！' : 'be going to の文に will はいらない！' }] }),
    hint: kind === 'will' ? 'will ＋ 原形。疑問文は Will を前へ、否定は will not。' : 'be ＋ going to ＋ 原形。疑問文・否定文は be動詞を動かす。',
    steps: [kind === 'will' ? 'will ＋ 原形' : 'be動詞 ＋ going to ＋ 原形'],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-future',
  subject: 'english',
  stage: 2,
  area: '英語棟・予言の間',
  title: '未来（will / be going to）',
  emoji: '🔮',
  prereqs: ['en-past'],
  tool: 'wall',
  hintCard: [
    'will ＋ 動詞の原形（〜するでしょう／〜します）',
    'be going to ＋ 動詞の原形（〜するつもりです）',
    '否定: will not（won\'t）／ be動詞 ＋ not going to',
    '疑問: Will you 〜? ／ Are you going to 〜?',
    'tomorrow, next week, this weekend → 未来の文',
  ],
  generators: {
    'fu-will': { difficulty: 1, gen: genWill },
    'fu-going': { difficulty: 1, gen: genGoing },
    'fu-negq': { difficulty: 2, gen: genNegQ },
    'fu-vs': { difficulty: 2, gen: genVs },
    'fu-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'fu-l1',
      title: 'will',
      unlocks: ['fu-will'],
      build(rng) {
        return [
          { text: '未来のことは will ＋ 動詞の原形。主語が何でも形は変わらない。', en: 'I will play tennis tomorrow.\nKen will play tennis tomorrow.' },
          { text: '⚠️ will のあとに s や -ing はつけない。', en: '× Ken will plays tennis.\n○ Ken will play tennis.' },
          { text: 'やってみよう。', q: genWill(rng) },
          { text: 'もう1問。', q: genWill(rng) },
        ];
      },
    },
    {
      id: 'fu-l2',
      title: 'be going to',
      unlocks: ['fu-going'],
      build(rng) {
        return [
          { text: '前から決めている予定は be going to ＋ 原形（〜するつもり）。be は主語で変わる。', en: 'I am going to visit Kyoto.\nKen is going to visit Kyoto.' },
          { text: 'やってみよう。', q: genGoing(rng) },
          { text: 'もう1問。', q: genGoing(rng) },
        ];
      },
    },
    {
      id: 'fu-l3',
      title: '否定文・疑問文',
      unlocks: ['fu-negq', 'fu-order'],
      build(rng) {
        return [
          { text: 'will の文は will を動かす。', en: 'Ken will not come tomorrow.\nWill Ken come tomorrow?' },
          { text: 'be going to の文は be動詞を動かす。', en: 'I am not going to go.\nAre you going to go?' },
          { text: 'やってみよう。', q: genNegQ(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
    {
      id: 'fu-l4',
      title: '時制の見分け',
      unlocks: ['fu-vs'],
      build(rng) {
        return [
          { text: '時を表す語で、動詞の形が決まる。', en: 'every day → plays\nyesterday → played\nnow → is playing\ntomorrow → will play' },
          { text: 'やってみよう。', q: genVs(rng) },
          { text: 'もう1問。', q: genVs(rng) },
        ];
      },
    },
  ],
};
