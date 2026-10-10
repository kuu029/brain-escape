// 国語の模試: 読解（オリジナルの文章）＋ 漢字・言葉（暗号室のカード）＋ 文法・古文漢文（国語棟の問題）＋ 作文（紙）
//   問題は seed だけで決まる（見直しのときに同じ問題を作りなおすため）
import { makeRng } from '../core/rng.js';
import { CARDS, makeQuestion } from '../memory/engine.js';
import { makeProblem, GEN } from '../units/registry.js';
import { textChoice } from '../units/japanese/kit-ja.js';
import { SETSUMEI, BUNGAKU, SAKUBUN, SAKUBUN_RULES, SAKUBUN_RUBRIC } from './ja-exam-data.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ul = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, '<u>$1</u>');
export const plain = (s) => String(s).replace(/\[\[(.+?)\]\]/g, '$1');
// 会話（「…」）は字下げしない
const passageHTML = (T) => `<p class="ex-ja-title">${esc(T.title)}</p>${T.paras.map((x) => `<p class="ex-ja">${/^「/.test(x) ? '' : '　'}${ul(x)}</p>`).join('')}`;

const GRAMMAR = ['hs-which', 'hs-find', 'ky-kind', 'ky-form', 'kg-make', 'kg-kind', 'sb-rareru', 'sb-nai', 'sb-no'].filter((g) => GEN[g]);
const KOTEN = ['kn-modern', 'kn-rule', 'kk-fill', 'kk-which', 'kt-nth', 'kt-order'].filter((g) => GEN[g]);
const deckCards = (...decks) => CARDS.filter((c) => decks.includes(c.deck));

function readQ(rng, T, q) {
  const src = T.paras.map(plain).join('\n');
  return {
    stem: q.ask,
    ...textChoice(rng, q.correct, q.wrongs.map((t) => ({ t }))),
    hint: '答えの手がかりは、たいてい本文の中にある。傍線部の前後をよく読もう。',
    steps: [q.why, ...q.evidence.slice(0, 1).map((e) => `本文: 「${e}」`)].filter(Boolean),
    check: { kind: 'ja-read', evidence: q.evidence, src },
  };
}
function readingSec(rng, list, title, intro, pts, n = 5) {
  const T = rng.pick(list);
  const qs = rng.shuffle(T.qs.map((q, k) => [q, k])).slice(0, n).sort((a, b) => a[1] - b[1]).map(([q]) => ({ pts, p: readQ(rng, T, q) }));
  return { title, intro, passage: passageHTML(T), qs };
}
function cardQ(card, form, rng) {
  const q = makeQuestion(card, form, rng);
  return { ...q, stem: `${q.stem}\n（${q.ask}）`, steps: [`${card.q}${card.read ? `（${card.read}）` : ''}${card.a === card.read ? '' : `：${card.a}`}`], deck: card.deck };
}
// 同じ問題が2回出ないように、ちがう問題を n 問
function uniq(n, make) {
  const out = [];
  const seen = new Set();
  for (let k = 0; out.length < n && k < n * 8; k++) {
    const p = make(k);
    const key = `${p.stem}|${p.fig || ''}|${p.answerText}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}
const genQs = (rng, ids, n) => uniq(n, () => makeProblem(rng.pick(ids), rng.int(1, 999999999)));

function kanjiQs(rng, nRead, nWrite) {
  const pool = rng.shuffle(deckCards('ja-kanji1', 'ja-kanji2'));
  return [...pool.slice(0, nRead).map((c) => cardQ(c, 'e2j', rng)), ...pool.slice(nRead, nRead + nWrite).map((c) => cardQ(c, 'j2e', rng))];
}
function gokuQs(rng, n) {
  return rng.shuffle(deckCards('ja-yoji', 'ja-koto', 'ja-kanyo')).slice(0, n).map((c) => cardQ(c, rng.chance(0.5) ? 'j2e' : 'e2j', rng));
}

// kind: 'full'（50分・大問6つ）| 'mini'（15分・漢字と言葉10問＋読解1題）
export function buildJaExam(kind, seed) {
  const rng = makeRng(seed);
  const mini = kind === 'mini';
  let sections;
  if (mini) {
    const words = [...kanjiQs(rng, 3, 3), ...gokuQs(rng, 2), ...genQs(rng, GRAMMAR, 2)];
    sections = [
      { title: '漢字と言葉', intro: '次の問いに答えなさい。', qs: words.map((p) => ({ pts: 5, p })) },
      rng.chance(0.5)
        ? readingSec(rng, SETSUMEI, '説明的文章', '次の文章を読んで、あとの問いに答えなさい。', 10)
        : readingSec(rng, BUNGAKU, '文学的文章', '次の文章を読んで、あとの問いに答えなさい。', 10),
    ];
  } else {
    const W = rng.pick(SAKUBUN);
    sections = [
      readingSec(rng, SETSUMEI, '説明的文章', '次の文章を読んで、あとの問いに答えなさい。', 4),
      readingSec(rng, BUNGAKU, '文学的文章', '次の文章を読んで、あとの問いに答えなさい。', 4),
      { title: '漢字の読み書き', intro: '次の漢字の読み、読みにあう漢字を、ア〜エから1つずつ選びなさい。', qs: kanjiQs(rng, 5, 5).map((p) => ({ pts: 2, p })) },
      { title: '言葉と文法', intro: '次の問いに答えなさい。', qs: [...gokuQs(rng, 3), ...genQs(rng, GRAMMAR, 4)].map((p) => ({ pts: 2, p })) },
      { title: '古文・漢文', intro: '次の問いに答えなさい。', qs: [...deckCards('ja-kogo').length ? [cardQ(rng.pick(deckCards('ja-kogo')), 'e2j', rng)] : [], ...genQs(rng, KOTEN, 3)].map((p) => ({ pts: 3, p })) },
      {
        title: '作文',
        intro: '次の問いに答えなさい。',
        qs: [{
          pts: 14,
          paperAlways: true,
          paperNote: '原稿用紙かノートに書こう。提出したあとに、答えの例を見ながら採点するよ。',
          p: { stem: W.theme, input: { kind: 'paper' }, check: { kind: 'paper' }, steps: [] },
          paper: { ask: `${W.theme}\n${SAKUBUN_RULES}`, model: W.model, rubric: SAKUBUN_RUBRIC },
        }],
      },
    ];
  }
  sections.forEach((sec, i) => {
    sec.no = i + 1;
    sec.qs.forEach((q, j) => {
      q.id = `${i + 1}-${j + 1}`;
      q.label = `(${j + 1})`;
      if (!q.p.generatorId) Object.assign(q.p, { id: `exam-ja-${seed}-${q.id}`, generatorId: null, seed, difficulty: 2, source: 'original' });
    });
  });
  return { subject: 'ja', kind, seed, title: mini ? '国語 ミニ模試' : '国語 フル模試', minutes: mini ? 15 : 50, style: '読解＋漢字・文法＋作文', sections };
}
