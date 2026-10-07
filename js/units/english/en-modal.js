// 英語 第2段階: 助動詞（must / have to / should / may）と、お願い・申し出の表現
import { cap, is3sg } from './gram.js';
import { third, ing } from './lex.js';
import { frameQ, orderAns, textChoice } from './kit-en.js';

// 助動詞の練習に使う動詞句。dict: 辞書形、stem: 〜ます の前、te: 〜て、nai: 〜ない の前
const M = (v, obj, dict, stem, te, nai) => ({ v, obj, dict, stem, te, nai });
export const MODAL_VP = [
  M('open', 'the window', '窓を開ける', '窓を開け', '窓を開けて', '窓を開け'),
  M('close', 'the door', 'ドアを閉める', 'ドアを閉め', 'ドアを閉めて', 'ドアを閉め'),
  M('clean', 'the room', '部屋をそうじする', '部屋をそうじし', '部屋をそうじして', '部屋をそうじし'),
  M('help', 'the teacher', '先生を手伝う', '先生を手伝い', '先生を手伝って', '先生を手伝わ'),
  M('use', 'this computer', 'このコンピューターを使う', 'このコンピューターを使い', 'このコンピューターを使って', 'このコンピューターを使わ'),
  M('read', 'this book', 'この本を読む', 'この本を読み', 'この本を読んで', 'この本を読ま'),
  M('go', 'home', '家に帰る', '家に帰り', '家に帰って', '家に帰ら'),
  M('wait', 'here', 'ここで待つ', 'ここで待ち', 'ここで待って', 'ここで待た'),
  M('study', 'English', '英語を勉強する', '英語を勉強し', '英語を勉強して', '英語を勉強し'),
  M('eat', 'this cake', 'このケーキを食べる', 'このケーキを食べ', 'このケーキを食べて', 'このケーキを食べ'),
  M('carry', 'this box', 'この箱を運ぶ', 'この箱を運び', 'この箱を運んで', 'この箱を運ば'),
  M('take', 'a picture', '写真をとる', '写真をとり', '写真をとって', '写真をとら'),
];
const SUBJ_M = [
  { en: 'you', ja: 'あなた', person: 2, num: 'sg' }, { en: 'we', ja: '私たち', person: 1, num: 'pl' },
  { en: 'Ken', ja: 'ケン', person: 3, num: 'sg' }, { en: 'I', ja: '私', person: 1, num: 'sg' },
  { en: 'my sister', ja: '私の姉', person: 3, num: 'sg' }, { en: 'they', ja: '彼ら', person: 3, num: 'pl' },
];

// 意味ごとの形と日本語
export const MEANING = {
  must: { name: '〜しなければならない', en: (s, useHave) => (useHave ? (is3sg(s) ? 'has to' : 'have to') : 'must'), ja: (vp) => `${vp.nai}なければなりません` },
  mustnot: { name: '〜してはいけない', en: () => 'must not', ja: (vp) => `${vp.te}はいけません` },
  donthave: { name: '〜しなくてもよい', en: (s) => (is3sg(s) ? 'does not have to' : 'do not have to'), ja: (vp) => `${vp.nai}なくてもよいです` },
  should: { name: '〜すべきだ', en: () => 'should', ja: (vp) => `${vp.dict}べきです` },
  may: { name: '〜してもよい', en: () => 'may', ja: (vp) => `${vp.te}もよいです` },
  can: { name: '〜できる', en: () => 'can', ja: (vp) => `${vp.dict}ことができます` },
};

function meaningQ(rng) {
  const subj = rng.pick(SUBJ_M);
  const vp = rng.pick(MODAL_VP);
  // must と have to はどちらも「〜しなければならない」。どちらで出すかは問題ごとに決める
  const useHave = rng.chance(0.4);
  const key = rng.pick(Object.keys(MEANING));
  const correct = MEANING[key].en(subj, useHave);
  const others = rng.shuffle(Object.keys(MEANING).filter((k) => k !== key)).slice(0, 3);
  const wrongs = others.map((k) => ({ t: MEANING[k].en(subj), msg: `${MEANING[k].en(subj)} は「${MEANING[k].name}」。` }));
  const chunks = [subj.en, correct, vp.v, vp.obj];
  return {
    ...frameQ(rng, { chunks, at: 1, correct, ja: `${subj.ja}は${MEANING[key].ja(vp)}。`, wrongs }),
    hint: 'must（〜しなければならない）／ must not（〜してはいけない）／ don\'t have to（〜しなくてもよい）／ should（〜すべき）／ may（〜してもよい）',
    steps: [`「${MEANING[key].name}」→ ${correct}`],
    check: { kind: 'en-modal', meaning: key, chunks, at: 1, others: others },
  };
}

// 助動詞のあとの動詞の形 ／ has to と have to
function genForm(rng) {
  const subj = rng.pick(SUBJ_M);
  const vp = rng.pick(MODAL_VP);
  if (rng.chance(0.4)) {
    const right = is3sg(subj) ? 'has' : 'have';
    return {
      ...frameQ(rng, {
        chunks: [subj.en, right, 'to', vp.v, vp.obj], at: 1, correct: right, ja: `${subj.ja}は${MEANING.must.ja(vp)}。`,
        wrongs: [{ t: is3sg(subj) ? 'have' : 'has', msg: is3sg(subj) ? `主語 ${subj.en} は3人称単数なので has to。` : `主語が ${subj.en} なら have to。` }, { t: 'must', msg: 'must のあとに to はいらない。to があるので have / has。' }, { t: 'does', msg: '「〜しなければならない」は have to / has to。' }],
      }),
      hint: 'have to ＝ must（〜しなければならない）。主語が3人称単数なら has to。',
      steps: [`主語 ${subj.en} → ${right} to`],
    };
  }
  const mod = rng.pick(['must', 'should', 'may', 'must not']);
  const key = mod === 'must' ? 'must' : mod === 'must not' ? 'mustnot' : mod;
  return {
    ...frameQ(rng, {
      chunks: [subj.en, mod, vp.v, vp.obj], at: 2, correct: vp.v, ja: `${subj.ja}は${MEANING[key].ja(vp)}。`,
      wrongs: [{ t: third(vp.v), msg: `${mod} のあとは動詞の原形（s をつけない）。` }, { t: `to ${vp.v}`, msg: `${mod} のあとに to はいらない。` }, { t: ing(vp.v), msg: `${mod} のあとは原形。` }],
    }),
    hint: '助動詞（can / must / should / may / will）のあとは動詞の原形。',
    steps: [`${mod} のあと → ${vp.v}（原形）`],
  };
}

// お願い・申し出（Will you 〜? / Shall I 〜? / May I 〜? / Shall we 〜?）
export const REQUEST = {
  willyou: { en: 'Will you', ja: (vp) => `${vp.te}くれますか？`, name: '〜してくれますか（お願い）' },
  shalli: { en: 'Shall I', ja: (vp) => `（私が）${vp.stem}ましょうか？`, name: '（私が）〜しましょうか（申し出）' },
  mayi: { en: 'May I', ja: (vp) => `${vp.te}もいいですか？`, name: '〜してもいいですか（許可）' },
  shallwe: { en: 'Shall we', ja: (vp) => `（いっしょに）${vp.stem}ましょうか？`, name: '（いっしょに）〜しましょうか（さそい）' },
};
function genRequest(rng) {
  const vp = rng.pick(MODAL_VP.filter((x) => x.v !== 'help'));
  const key = rng.pick(Object.keys(REQUEST));
  const R = REQUEST[key];
  const others = Object.keys(REQUEST).filter((k) => k !== key);
  return {
    stem: `日本語に合うのは？\n${R.ja(vp)}`,
    ...textChoice(rng, `${R.en} ${vp.v} ${vp.obj}?`, others.map((k) => ({ t: `${REQUEST[k].en} ${vp.v} ${vp.obj}?`, msg: `${REQUEST[k].en} 〜? は「${REQUEST[k].name}」。` }))),
    hint: 'Will you 〜?（してくれる？）／ Shall I 〜?（しましょうか）／ May I 〜?（してもいい？）／ Shall we 〜?（いっしょにしよう）',
    steps: [`「${R.name}」→ ${R.en} 〜?`],
    check: { kind: 'en-request', key, others },
  };
}

function genOrder(rng) {
  const subj = rng.pick(SUBJ_M);
  const vp = rng.pick(MODAL_VP);
  const pat = rng.pick(['must', 'mustnot', 'should', 'haveto', 'donthave', 'q']);
  let chunks;
  let ja;
  let decoy;
  if (pat === 'must') { chunks = [subj.en, 'must', vp.v, vp.obj]; ja = MEANING.must.ja(vp); decoy = { t: 'to', msg: 'must のあとに to はいらない！' }; }
  else if (pat === 'mustnot') { chunks = [subj.en, 'must', 'not', vp.v, vp.obj]; ja = MEANING.mustnot.ja(vp); decoy = { t: 'to', msg: 'must not のあとに to はいらない！' }; }
  else if (pat === 'should') { chunks = [subj.en, 'should', vp.v, vp.obj]; ja = MEANING.should.ja(vp); decoy = { t: 'to', msg: 'should のあとに to はいらない！' }; }
  else if (pat === 'haveto') { chunks = [subj.en, is3sg(subj) ? 'has' : 'have', 'to', vp.v, vp.obj]; ja = MEANING.must.ja(vp); decoy = { t: 'must', msg: 'have to と must はいっしょに使わない！' }; }
  else if (pat === 'donthave') { chunks = [subj.en, is3sg(subj) ? 'does' : 'do', 'not', 'have', 'to', vp.v, vp.obj]; ja = MEANING.donthave.ja(vp); decoy = { t: 'must', msg: '「〜しなくてもよい」は don\'t have to。must はいらない！' }; }
  else { const s = subj.person === 1 ? SUBJ_M[0] : subj; chunks = [is3sg(s) ? 'Does' : 'Do', s.en, 'have', 'to', vp.v, vp.obj]; ja = `${s.ja}は${vp.nai}なければなりませんか`; decoy = { t: 'must', msg: '疑問文は Do / Does ＋ 主語 ＋ have to 〜?。must はいらない！' }; return finish(rng, chunks, `${ja}？`, decoy, '?'); }
  return finish(rng, chunks, `${subj.ja}は${ja}。`, decoy, '.');
}
function finish(rng, chunks, ja, decoy, end) {
  return {
    stem: `日本語に合うように並べかえよう\n${ja}`,
    ...orderAns(rng, chunks, { end, decoys: [decoy] }),
    hint: '助動詞 ＋ 動詞の原形。have to の否定・疑問は do / does を使う。',
    steps: ['助動詞のあとは原形', 'have to は一般動詞と同じように do / does で否定・疑問'],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-modal',
  subject: 'english',
  stage: 2,
  area: '英語棟・ルールの部屋',
  title: '助動詞',
  emoji: '📜',
  prereqs: ['en-3sg'],
  tool: 'double',
  hintCard: [
    'must ＝ have to（〜しなければならない）',
    'must not（〜してはいけない）⇔ don\'t have to（〜しなくてもよい）',
    'should（〜すべき）／ may（〜してもよい）',
    'Will you 〜?（してくれる？）／ Shall I 〜?（しましょうか）／ May I 〜?（してもいい？）／ Shall we 〜?（いっしょに）',
  ],
  generators: {
    'md-form': { difficulty: 1, gen: genForm },
    'md-meaning': { difficulty: 2, gen: meaningQ },
    'md-request': { difficulty: 2, gen: genRequest },
    'md-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'md-l1',
      title: 'must / have to',
      unlocks: ['md-form'],
      build(rng) {
        return [
          { text: '助動詞は動詞の前に置いて意味を足す。あとの動詞はいつも原形。', en: 'Ken must clean the room.\nKen has to clean the room.\n（どちらも「そうじしなければならない」）' },
          { text: 'have to は主語が3人称単数なら has to。must のあとに to はつけない。' },
          { text: 'やってみよう。', q: genForm(rng) },
          { text: 'もう1問。', q: genForm(rng) },
        ];
      },
    },
    {
      id: 'md-l2',
      title: '助動詞の意味',
      unlocks: ['md-meaning', 'md-order'],
      build(rng) {
        return [
          { text: '意味のちがいを整理しよう。', en: 'must 〜しなければならない\nmust not 〜してはいけない\ndon\'t have to 〜しなくてもよい\nshould 〜すべきだ\nmay 〜してもよい' },
          { text: '⚠️ must not と don\'t have to は意味が全然ちがう！「禁止」と「しなくてOK」。' },
          { text: '日本語に合うのは？', q: meaningQ(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
    {
      id: 'md-l3',
      title: 'お願い・申し出',
      unlocks: ['md-request'],
      build(rng) {
        return [
          { text: '会話でよく使う形。', en: 'Will you open the window?（開けてくれる？）\nShall I open the window?（開けましょうか？）\nMay I open the window?（開けてもいい？）\nShall we dance?（いっしょに踊ろうか？）' },
          { text: 'やってみよう。', q: genRequest(rng) },
          { text: 'もう1問。', q: genRequest(rng) },
        ];
      },
    },
  ],
};
