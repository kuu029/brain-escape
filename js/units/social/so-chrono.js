// 社会 第2段階（歴史）: できごとを古い順にならべる
//   できごとと年は、暗号室の「歴史 年号」のカードを使う。正しい順は年の数字でならべなおして確かめる
import { SOC } from '../../memory/decks/terms.js';
import { sciChoice } from '../science/kit-sci.js';

const yearOf = (c) => Number(c.q.replace(/[^\d]/g, ''));
export const EVENTS = SOC.cards.filter((c) => c.deck === 'soc-year').map((c) => ({ year: yearOf(c), text: c.a }));
// 年がはなれた（同じ年がない）できごとを n 個
function pickEvents(rng, n, gap) {
  for (;;) {
    const es = rng.shuffle([...EVENTS]).slice(0, n);
    const ys = es.map((e) => e.year).sort((a, b) => a - b);
    if (ys.every((y, i) => i === 0 || y - ys[i - 1] >= gap)) return es;
  }
}

// 入試と同じく、できごとに ア〜エ をつけて、記号をならべる
const KANA = ['ア', 'イ', 'ウ', 'エ'];
function genOrder(rng) {
  const es = pickEvents(rng, 4, 20);
  const byKana = Object.fromEntries(es.map((e, i) => [KANA[i], e]));
  const answer = [...KANA].sort((a, b) => byKana[a].year - byKana[b].year);
  return {
    stem: `次のできごとを、古いものから順に記号でならべよう。\n${es.map((e, i) => `${KANA[i]}　${e.text}`).join('\n')}`,
    input: { kind: 'order', tiles: [...KANA], answer, prefix: '', suffix: '', extra: 0 },
    answerText: answer.join(' → '),
    wrong: [],
    hint: 'それぞれ「何時代のできごとか」を考えると、ならべやすい。',
    steps: [...es].sort((a, b) => a.year - b.year).map((e) => `${KANA[es.indexOf(e)]}　${e.year}年: ${e.text}`),
    check: { kind: 'ja-order', verify: (ans) => ans.every((k, i) => i === 0 || EVENTS.find((e) => e.text === byKana[k].text).year > EVENTS.find((e) => e.text === byKana[ans[i - 1]].text).year) },
  };
}
function genFirst(rng) {
  const es = pickEvents(rng, 4, 30);
  const oldest = rng.chance(0.5);
  const right = [...es].sort((a, b) => (oldest ? a.year - b.year : b.year - a.year))[0];
  return sciChoice(rng, {
    stem: `次のうち、いちばん${oldest ? '古い' : '新しい'}できごとはどれか。`,
    correct: right.text,
    wrongs: es.filter((e) => e !== right).map((e) => ({ t: e.text, msg: `${e.text}は ${e.year}年。${right.text}は ${right.year}年。` })),
    hint: 'それぞれ何時代のできごとかを考える。',
    steps: [...es].sort((a, b) => a.year - b.year).map((e) => `${e.year}年: ${e.text}`),
    verify: (t) => { const ys = es.map((e) => e.year); const y = EVENTS.find((e) => e.text === t)?.year; return y === (oldest ? Math.min(...ys) : Math.max(...ys)); },
  });
}

export default {
  id: 'so-chrono',
  subject: 'social',
  stage: 2,
  area: '社会棟・ハニワの通路',
  title: '年代の並べかえ',
  emoji: '🗿',
  prereqs: ['so-scale'],
  tool: 'double',
  hintCard: [
    'まず、それぞれのできごとが何時代かを考える',
    '古代（飛鳥・奈良・平安）→ 中世（鎌倉・室町）→ 近世（安土桃山・江戸）→ 近代（明治・大正）→ 現代（昭和〜）',
    '同じ時代どうしは、人物の順番（だれのあとにだれ）で考える',
  ],
  generators: {
    'cr2-first': { difficulty: 1, gen: genFirst },
    'cr2-order': { difficulty: 3, gen: genOrder },
  },
  lessons: [
    {
      id: 'cr2-l1',
      title: '古い順にならべる',
      unlocks: ['cr2-first', 'cr2-order'],
      build(rng) {
        return [
          { text: '年号を全部おぼえていなくても、時代がわかればならべられる。\n古代 → 中世 → 近世 → 近代 → 現代', q: genFirst(rng) },
          { text: '記号（ア〜エ）を、古い順にタップしよう。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
