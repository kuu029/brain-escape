// 社会・理科の模試: 暗号室の用語カードと「流れでつなげる」から作る（4択・ならべかえ。自動で採点）
//   問題は seed だけで決まる（見直しのときに同じ問題を作りなおすため、持っているカードには左右されない）
import { makeRng } from '../core/rng.js';
import { CARDS, makeQuestion } from '../memory/engine.js';
import { flowQuestion } from '../memory/flow.js';

const NAME = { soc: '社会', sci: '理科' };
// 大問の構成: [問題の数, 1問の点]。合計100点
const PLAN = {
  mini: [['j2e', 8, 6], ['flow', 4, 13]],
  full: [['j2e', 15, 3], ['e2j', 5, 3], ['flow', 10, 4]],
};
const TITLE = { j2e: '用語（説明 → 用語）', e2j: '用語の意味（用語 → 説明）', flow: '流れ・つながり（年表・原因と結果など）' };
const INTRO = { j2e: '次の説明にあてはまる用語を、ア〜エから1つずつ選びなさい。', e2j: '次の用語の説明として正しいものを、ア〜エから1つずつ選びなさい。', flow: '次の問いに答えなさい。' };

function termQ(card, form, rng) {
  const q = makeQuestion(card, form, rng);
  return { ...q, stem: `${q.stem}\n（${q.ask}）`, steps: [`${card.q}：${card.a}`], deck: card.deck };
}
function flowQ(subject, rng) {
  const q = flowQuestion(subject, rng);
  return { ...q, stem: `${q.stem}\n（${q.ask}）`, steps: q.why ? [q.why] : [] };
}

export function buildTermExam(subject, kind, seed) {
  const rng = makeRng(seed);
  const pool = rng.shuffle(CARDS.filter((c) => c.subject === subject && c.kind === 'term'));
  let ci = 0;
  const sections = PLAN[kind === 'mini' ? 'mini' : 'full'].map(([type, n, pts], i) => {
    const qs = [];
    const seen = new Set();
    for (let k = 0; qs.length < n && k < n * 6; k++) {
      let p;
      if (type === 'flow') {
        p = flowQ(subject, rng);
        if (seen.has(p.stem)) continue; // 同じ問題はさける
        seen.add(p.stem);
      } else p = termQ(pool[ci++ % pool.length], type, rng);
      qs.push({ pts, p });
    }
    return { no: i + 1, title: TITLE[type], intro: INTRO[type], qs };
  });
  sections.forEach((sec) => sec.qs.forEach((q, j) => {
    q.id = `${sec.no}-${j + 1}`;
    q.label = `(${j + 1})`;
    Object.assign(q.p, { id: `exam-${subject}-${seed}-${q.id}`, generatorId: null, seed, difficulty: 2, source: 'original' });
  }));
  const mini = kind === 'mini';
  return { subject, kind, seed, title: `${NAME[subject]} ${mini ? 'ミニ模試' : 'フル模試'}`, minutes: mini ? 15 : 50, style: '用語＋流れ', sections };
}
