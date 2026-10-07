// 英語 第2段階: 不定詞（to ＋ 原形）と動名詞（-ing）
import { SUBJ, VP_ACTION, is3sg } from './gram.js';
import { third, ing, past } from './lex.js';
import { frameQ, orderAns } from './kit-en.js';

const obj = (vp) => (vp.obj ? [vp.obj] : []);
// 不定詞をとる動詞 / 動名詞をとる動詞。form: 文の中の形（pres = 主語で変わる、past = 過去形）
export const TAKES_TO = {
  want: { form: 'pres', ja: (s, vp) => (s.person === 1 ? `${vp.stem}たいです` : `${vp.stem}たがっています`) },
  hope: { form: 'pres', ja: (s, vp) => `${vp.stem}たいと思っています` },
  decide: { form: 'past', ja: (s, vp) => `${vp.dict}ことに決めました` },
  need: { form: 'pres', ja: (s, vp) => `${vp.dict}必要があります` },
};
export const TAKES_ING = {
  enjoy: { form: 'pres', ja: (s, vp) => `${vp.dict}のを楽しみます` },
  finish: { form: 'past', ja: (s, vp) => `${vp.stem}終えました` },
};
const vform = (v, f, s) => (f === 'past' ? past(v) : is3sg(s) ? third(v) : v);
// 「〜し終える」「〜して楽しむ」が自然な動詞句だけ
const ING_OK = new Set(['play', 'read', 'write', 'cook', 'watch', 'clean', 'wash', 'sing', 'make', 'swim', 'listen', 'practice', 'dance', 'take', 'study', 'eat']);

function genToIng(rng) {
  const subj = rng.pick(SUBJ);
  const useTo = rng.chance(0.55);
  const [mv, M] = rng.pick(Object.entries(useTo ? TAKES_TO : TAKES_ING));
  const vp = rng.pick(useTo ? VP_ACTION : VP_ACTION.filter((x) => ING_OK.has(x.v)));
  const right = useTo ? `to ${vp.v}` : ing(vp.v);
  const chunks = [subj.en, vform(mv, M.form, subj), right, ...obj(vp)];
  return {
    ...frameQ(rng, {
      chunks, at: 2, correct: right, ja: `${subj.ja}は${M.ja(subj, vp)}。`,
      wrongs: [
        useTo ? { t: ing(vp.v), msg: `${mv} のあとは to ＋ 原形（不定詞）。-ing にはしない。` } : { t: `to ${vp.v}`, msg: `${mv} のあとは -ing（動名詞）。to ＋ 原形にはしない。` },
        { t: vp.v, msg: '動詞を2つ続けるときは、2つ目を to ＋ 原形 か -ing にする。' },
        { t: third(vp.v), msg: '動詞を2つ続けるときは、2つ目を to ＋ 原形 か -ing にする。' },
      ],
    }),
    hint: 'want / hope / decide / need ＋ to 〜。enjoy / finish ＋ 〜ing。',
    steps: [`${mv} → ${useTo ? 'to ＋ 原形' : '-ing'}`, `→ ${right}`],
  };
}

// 目的（〜するために）
const PURPOSE = [
  { go: ['went', 'to the library'], vp: ['read', 'books'], ja: '本を読むために図書館へ行きました' },
  { go: ['went', 'to the park'], vp: ['play', 'soccer'], ja: 'サッカーをするために公園へ行きました' },
  { go: ['got', 'up early'], vp: ['study', 'English'], ja: '英語を勉強するために早く起きました' },
  { go: ['went', 'to Kyoto'], vp: ['see', 'my grandmother'], ja: '祖母に会うために京都へ行きました', me: true },
  { go: ['came', 'to Japan'], vp: ['learn', 'Japanese'], ja: '日本語を学ぶために日本に来ました' },
  { go: ['went', 'to the store'], vp: ['buy', 'some milk'], ja: '牛乳を買うために店へ行きました' },
  { go: ['went', 'to the station'], vp: ['meet', 'my friend'], ja: '友だちに会うために駅へ行きました', me: true },
];
const I = SUBJ[0];
function genPurpose(rng) {
  const P = rng.pick(PURPOSE);
  const subj = P.me ? I : rng.pick(SUBJ);
  const right = `to ${P.vp[0]}`;
  return {
    ...frameQ(rng, {
      chunks: [subj.en, P.go[0], P.go[1], right, P.vp[1]], at: 3, correct: right, ja: `${subj.ja}は${P.ja}。`,
      wrongs: [{ t: ing(P.vp[0]), msg: '「〜するために」は to ＋ 原形。' }, { t: P.vp[0], msg: '動詞が2つ続いている。「〜するために」は to ＋ 原形。' }, { t: past(P.vp[0]), msg: '「〜するために」は to ＋ 原形（過去の文でも原形）。' }],
    }),
    hint: '「〜するために」→ to ＋ 動詞の原形（文が過去でも to のあとは原形）',
    steps: [`〜するために → to ${P.vp[0]}`],
  };
}

// 名詞を説明する不定詞（〜するための）
const THING = [
  { s: ['I', 'have', 'a lot of homework'], v: 'do', tail: 'today', ja: '私は今日、するべき宿題がたくさんあります。' },
  { s: ['I', 'want', 'something'], v: 'eat', tail: '', ja: '私は何か食べるものがほしいです。' },
  { s: ['I', 'want', 'something'], v: 'drink', tail: '', ja: '私は何か飲むものがほしいです。' },
  { s: ['Ken', 'has', 'many books'], v: 'read', tail: '', ja: 'ケンは読むべき本をたくさん持っています。' },
  { s: ['We', 'have', 'no time'], v: 'play', tail: 'today', ja: '私たちは今日、遊ぶ時間がありません。' },
];
function genNoun(rng) {
  const T = rng.pick(THING);
  const right = `to ${T.v}`;
  return {
    ...frameQ(rng, {
      chunks: [...T.s, right], at: 3, correct: right, tail: T.tail, ja: T.ja,
      wrongs: [{ t: ing(T.v), msg: '「〜するための〇〇」は 名詞 ＋ to ＋ 原形。' }, { t: T.v, msg: '動詞が2つ続いている。名詞のあとに to ＋ 原形。' }, { t: past(T.v), msg: '名詞のあとに to ＋ 原形。' }],
    }),
    hint: '「〜するための〇〇・〜するべき〇〇」→ 〇〇 ＋ to ＋ 原形（something to eat）',
    steps: [`${T.s[2]} ＋ to ${T.v}`],
  };
}

// 動名詞が主語（〜することは）
const GER_SUBJ = [
  { vp: ['speak', 'English'], c: 'fun', ja: '英語を話すことは楽しいです。' },
  { vp: ['play', 'soccer'], c: 'exciting', ja: 'サッカーをすることはわくわくします。' },
  { vp: ['read', 'books'], c: 'interesting', ja: '本を読むことはおもしろいです。' },
  { vp: ['swim', 'in the sea'], c: 'fun', ja: '海で泳ぐことは楽しいです。' },
  { vp: ['study', 'math'], c: 'important', ja: '数学を勉強することは大切です。' },
  { vp: ['cook', 'dinner'], c: 'easy', ja: '夕食を作ることは簡単です。' },
];
function genGerSubj(rng) {
  const G = rng.pick(GER_SUBJ);
  const right = ing(G.vp[0]);
  const C = (w) => w[0].toUpperCase() + w.slice(1);
  return {
    ...frameQ(rng, {
      chunks: [C(right), G.vp[1], 'is', G.c], at: 0, correct: C(right), ja: G.ja,
      wrongs: [{ t: C(G.vp[0]), msg: '動詞のままでは主語になれない。-ing にすると「〜すること」。' }, { t: C(third(G.vp[0])), msg: '主語にするときは -ing（〜すること）。' }, { t: C(past(G.vp[0])), msg: '主語にするときは -ing（〜すること）。' }],
    }),
    hint: '「〜することは」→ -ing（動名詞）を主語にする。動名詞の主語は単数あつかい（is）。',
    steps: [`${G.vp[0]} → ${right}（〜すること）`],
  };
}

function genOrder(rng) {
  const subj = rng.pick(SUBJ);
  if (rng.chance(0.3)) {
    const P = rng.pick(PURPOSE);
    const s = P.me ? I : subj;
    return {
      stem: `日本語に合うように並べかえよう\n${s.ja}は${P.ja}。`,
      ...orderAns(rng, [s.en, P.go[0], P.go[1], 'to', P.vp[0], P.vp[1]], { decoys: [{ t: ing(P.vp[0]), msg: '「〜するために」は to ＋ 原形！' }] }),
      hint: '〜するために → to ＋ 原形', steps: ['行動 ＋ to ＋ 原形（目的）'], check: { kind: 'en-order' },
    };
  }
  const useTo = rng.chance(0.5);
  const [mv, M] = rng.pick(Object.entries(useTo ? TAKES_TO : TAKES_ING));
  const vp = rng.pick(useTo ? VP_ACTION : VP_ACTION.filter((x) => ING_OK.has(x.v)));
  const chunks = useTo ? [subj.en, vform(mv, M.form, subj), 'to', vp.v, ...obj(vp)] : [subj.en, vform(mv, M.form, subj), ing(vp.v), ...obj(vp)];
  return {
    stem: `日本語に合うように並べかえよう\n${subj.ja}は${M.ja(subj, vp)}。`,
    ...orderAns(rng, chunks, { decoys: [useTo ? { t: ing(vp.v), msg: `${mv} のあとは to ＋ 原形！` } : { t: 'to', msg: `${mv} のあとは -ing。to はいらない！` }] }),
    hint: 'want / hope / decide / need ＋ to 〜 ／ enjoy / finish ＋ 〜ing',
    steps: [`${mv} → ${useTo ? 'to ＋ 原形' : '-ing'}`],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-inf',
  subject: 'english',
  stage: 2,
  area: '英語棟・分かれ道',
  title: '不定詞と動名詞',
  emoji: '🔀',
  prereqs: ['en-past'],
  tool: 'mega',
  hintCard: [
    'to ＋ 原形: 〜すること（want to）／ 〜するために（目的）／ 〜するための（something to eat）',
    '-ing: 〜すること（enjoy 〜ing、主語の 〜ing is ...）',
    'want / hope / decide / need → to 〜 ／ enjoy / finish → 〜ing ／ like / start → どちらもOK',
  ],
  generators: {
    'in-toing': { difficulty: 1, gen: genToIng },
    'in-purpose': { difficulty: 2, gen: genPurpose },
    'in-noun': { difficulty: 2, gen: genNoun },
    'in-gersubj': { difficulty: 2, gen: genGerSubj },
    'in-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'in-l1',
      title: 'to 〜 と 〜ing（〜すること）',
      unlocks: ['in-toing', 'in-gersubj'],
      build(rng) {
        return [
          { text: '動詞のあとに動詞を続けるときは、2つ目を「to ＋ 原形」か「-ing」にする。どちらを使うかは前の動詞で決まる。', en: 'I want to play tennis.\nI enjoy playing tennis.' },
          { text: 'to をとる: want, hope, decide, need\n-ing をとる: enjoy, finish\nどちらもOK: like, love, start, begin' },
          { text: '「〜することは」を主語にするときは -ing。', en: 'Playing soccer is fun.' },
          { text: 'やってみよう。', q: genToIng(rng) },
          { text: 'もう1問。', q: genGerSubj(rng) },
        ];
      },
    },
    {
      id: 'in-l2',
      title: '〜するために・〜するための',
      unlocks: ['in-purpose', 'in-noun', 'in-order'],
      build(rng) {
        return [
          { text: 'to ＋ 原形は「〜するために」（目的）も表す。', en: 'I went to the library to read books.' },
          { text: '名詞のあとに置くと「〜するための・〜するべき」。', en: 'I want something to eat.\nI have a lot of homework to do.' },
          { text: 'やってみよう。', q: genPurpose(rng) },
          { text: 'もう1問。', q: genNoun(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
