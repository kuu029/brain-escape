// 学習のかたよりを記録から見つけて、ホームで「おすすめ」を出す（1日1回まで）
//  ・遊んだ記録が3日分以上たまってから（それまでは出さない）
//  ・ある場所（数学棟・英語棟・暗号室・模試）を何日も遊んでいない → そこをすすめる
//  ・始めた単元を長いこと解いていない → 「さびついてきた」とすすめる
import { S, today, mastery } from '../core/store.js';
import { UNIT } from '../units/registry.js';

const AREAS = [
  { id: 'math', name: '数学棟', days: 4, go: ['map', {}], msg: '数学棟の看守が、ひまそうにしている…。' },
  { id: 'english', name: '英語棟', days: 4, go: ['map', { subject: 'english' }], msg: '英語棟の扉、ずっと閉まったままだぞ。' },
  { id: 'memory', name: '暗号室', days: 3, go: ['memory', {}], msg: '暗号室の合言葉、忘れかけてるかも。' },
  { id: 'exam', name: '模試', days: 7, go: ['exam', {}], msg: 'そろそろ力だめしの時期かも。ミニ模試なら15分！' },
];
const dayDiff = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000);
const areaOf = (x) => (x.kind === 'memory' || x.kind === 'memtest' ? 'memory' : x.kind === 'exam' ? 'exam' : x.subject === 'english' ? 'english' : 'math');

// 場所ごと・単元ごとの「最後に遊んだ日」
export function lastPlayed(s = S()) {
  const area = {};
  const unit = {};
  const bump = (m, k, d) => { if (!m[k] || m[k] < d) m[k] = d; };
  for (const x of s.sessions || []) {
    if (!x.asked && x.result === 'quit') continue;
    bump(area, areaOf(x), x.date);
    if (x.unit) bump(unit, x.unit, x.date);
  }
  for (const [d, lg] of Object.entries(s.log || {})) {
    for (const [u, v] of Object.entries(lg.byUnit || {})) {
      if (!v.asked || !UNIT[u]) continue;
      bump(unit, u, d);
      bump(area, UNIT[u].subject === 'english' ? 'english' : 'math', d);
    }
  }
  for (const r of s.exams || []) bump(area, 'exam', r.date);
  for (const cs of Object.values(s.memory?.cards || {})) if (cs.last) bump(area, 'memory', today(new Date(cs.last)));
  return { area, unit };
}

// 今日のおすすめ（なければ null）: { title, body, label, go: [画面, params] }
export function adviceFor(now = new Date(), s = S()) {
  const t = today(now);
  const active = Object.entries(s.log || {}).filter(([, lg]) => lg.seconds > 60).length;
  if (active < 3) return null;
  const { area, unit } = lastPlayed(s);
  // 1) しばらく行っていない場所（いちばん長く空いているもの）
  const stale = AREAS.map((a) => ({ a, gap: area[a.id] ? dayDiff(area[a.id], t) : 99 })).filter((x) => x.gap >= x.a.days).sort((x, y) => y.gap - x.gap)[0];
  if (stale) {
    return {
      title: `🔔 ${stale.a.name}${stale.gap >= 99 ? 'にまだ行っていない' : `に ${stale.gap} 日行っていない`}`,
      body: stale.a.msg,
      label: `${stale.a.name}へ行く`,
      go: stale.a.go,
    };
  }
  // 2) 始めたのに10日以上さわっていない単元（定着していないもの）
  const rusty = Object.entries(unit)
    .filter(([u, d]) => UNIT[u] && dayDiff(d, t) >= 10 && mastery(u) !== 'mastered')
    .sort((a, b) => (a[1] < b[1] ? -1 : 1))[0];
  if (rusty) {
    const [u, d] = rusty;
    return {
      title: `🔧 「${UNIT[u].title}」がさびついてきた`,
      body: `最後に解いたのは ${dayDiff(d, t)} 日前。練習ウェーブ1回で思い出そう。`,
      label: 'その単元へ',
      go: ['map', { focus: u, subject: UNIT[u].subject || 'math' }],
    };
  }
  return null;
}
// ホームで1日1回だけ出すためのしるし
export function takeAdvice(now = new Date(), s = S()) {
  const t = today(now);
  if (s.adviceShown === t) return null;
  const a = adviceFor(now, s);
  if (a) s.adviceShown = t;
  return a;
}
