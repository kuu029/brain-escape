// 社会・理科の模試: 暗号室の用語カードと「流れでつなげる」から作る（4択・ならべかえ。自動で採点）
//   問題は seed だけで決まる（見直しのときに同じ問題を作りなおすため、持っているカードには左右されない）
import { makeRng } from '../core/rng.js';
import { CARDS, makeQuestion } from '../memory/engine.js';
import { flowQuestion } from '../memory/flow.js';
import { makeProblem, unitsOf } from '../units/registry.js';

const NAME = { soc: '社会', sci: '理科' };
// 大問の構成: [問題の数, 1問の点]。合計100点
const PLAN = {
  mini: [['j2e', 8, 6], ['flow', 4, 13]],
  full: [['j2e', 15, 3], ['e2j', 5, 3], ['flow', 10, 4]],
};
// 理科・社会は、計算・資料の問題（理科棟・社会棟の問題）も出す
const PLAN_SCI = {
  mini: [['j2e', 6, 5], ['flow', 3, 10], ['calc', 4, 10]],
  full: [['j2e', 10, 3], ['e2j', 5, 2], ['flow', 7, 4], ['calc', 8, 4]],
};
const CALC_GENS = { sci: unitsOf('science'), soc: unitsOf('social') };
for (const k of Object.keys(CALC_GENS)) CALC_GENS[k] = CALC_GENS[k].filter((u) => !u.id.endsWith('-write')).flatMap((u) => Object.keys(u.generators || {})); // 記述は計算の大問に入れない
const TITLE = { j2e: '用語（説明 → 用語）', e2j: '用語の意味（用語 → 説明）', flow: '流れ・つながり（年表・原因と結果など）', calc: '計算（密度・電流・湿度など）', calcSoc: '資料・計算（時差・縮尺・雨温図・選挙など）' };
const INTRO = { j2e: '次の説明にあてはまる用語を、ア〜エから1つずつ選びなさい。', e2j: '次の用語の説明として正しいものを、ア〜エから1つずつ選びなさい。', flow: '次の問いに答えなさい。', calc: '次の問いに答えなさい。答えは数で入力しなさい。' };

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
  const sections = PLAN_SCI[kind === 'mini' ? 'mini' : 'full'].map(([type, n, pts], i) => {
    const qs = [];
    const seen = new Set();
    for (let k = 0; qs.length < n && k < n * 6; k++) {
      let p;
      if (type === 'flow' || type === 'calc') {
        p = type === 'flow' ? flowQ(subject, rng) : makeProblem(rng.pick(CALC_GENS[subject]), rng.int(1, 999999999));
        if (seen.has(p.stem)) continue; // 同じ問題はさける
        seen.add(p.stem);
      } else p = termQ(pool[ci++ % pool.length], type, rng);
      qs.push({ pts, p });
    }
    return { no: i + 1, title: type === 'calc' && subject === 'soc' ? TITLE.calcSoc : TITLE[type], intro: INTRO[type], qs };
  });
  sections.forEach((sec) => sec.qs.forEach((q, j) => {
    q.id = `${sec.no}-${j + 1}`;
    q.label = `(${j + 1})`;
    if (!q.p.generatorId) Object.assign(q.p, { id: `exam-${subject}-${seed}-${q.id}`, generatorId: null, seed, difficulty: 2, source: 'original' });
  }));
  const mini = kind === 'mini';
  return { subject, kind, seed, title: `${NAME[subject]} ${mini ? 'ミニ模試' : 'フル模試'}`, minutes: mini ? 15 : 50, style: subject === 'sci' ? '用語＋流れ＋計算' : '用語＋流れ＋資料', sections };
}
