// 記録: 日別の勉強時間、単元別の進み具合と理解度、復習の件数
import { h, btn } from '../core/ui.js';
import { S, today, streakAlive, mastery, MASTERY_LABEL } from '../core/store.js';
import { UNIT, makeProblem, SUBJECTS, unitsOf } from '../units/registry.js';
import { go } from '../core/router.js';
import { topBar } from './home.js';

function lastDays(n) {
  const out = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(today(x));
  }
  return out;
}

export function render(el) {
  const s = S();
  const days = lastDays(14);
  const mins = days.map((d) => Math.round((s.log[d]?.seconds || 0) / 60));
  const asked = days.map((d) => Object.values(s.log[d]?.byUnit || {}).reduce((a, b) => a + b.asked, 0));
  const maxM = Math.max(10, ...mins);
  const totalMin = Math.round(Object.values(s.log).reduce((a, b) => a + b.seconds, 0) / 60);
  const t = today();

  // 単元別の累計
  const per = {};
  for (const lg of Object.values(s.log)) for (const [u, v] of Object.entries(lg.byUnit)) {
    per[u] ||= { asked: 0, correct: 0 };
    per[u].asked += v.asked;
    per[u].correct += v.correct;
  }

  const chart = h('div', { class: 'chart', role: 'img', 'aria-label': '直近14日の勉強時間' },
    days.map((d, i) => h('div', { class: `col ${d === t ? 'today' : ''}` },
      h('span', { class: 'v' }, mins[i] ? `${mins[i]}` : ''),
      h('div', { class: 'bar', style: { height: `${(mins[i] / maxM) * 100}%` }, title: `${d}: ${mins[i]}分 / ${asked[i]}問` }),
      h('span', { class: 'd' }, d.slice(8).replace(/^0/, '')))));

  const unitRow = (u) => {
    const p = per[u.id] || { asked: 0, correct: 0 };
    const ms = mastery(u.id);
    return h('tr', {},
      h('td', {}, `${u.emoji} ${u.title}`),
      h('td', {}, h('span', { class: `badge b-${ms}` }, MASTERY_LABEL[ms])),
      h('td', { class: 'num' }, p.asked ? `${Math.round((p.correct / p.asked) * 100)}%` : '–'),
      h('td', { class: 'num' }, `${p.correct}/${p.asked}`));
  };
  const unitRows = Object.entries(SUBJECTS).flatMap(([id, sj]) => [
    h('tr', { class: 'subj-row' }, h('td', { colspan: '4' }, sj.sub)),
    ...unitsOf(id).filter((u) => !u.comingSoon).map(unitRow),
  ]);

  const recent = s.mistakes.slice(-8).reverse().map((m) => ({ m, p: makeProblem(m.generatorId, m.seed) })).filter((x) => x.p);

  el.append(topBar(() => go('home')),
    h('div', { class: 'records' },
      h('div', { class: 'stats' },
        h('div', {}, h('b', {}, `${Math.round((s.log[t]?.seconds || 0) / 60)}分`), h('small', {}, '今日')),
        h('div', {}, h('b', {}, `🔥${streakAlive()}日`), h('small', {}, `連続（最高${s.streak.best || 0}）`)),
        h('div', {}, h('b', {}, `${totalMin}分`), h('small', {}, '合計'))),
      h('h3', { class: 'sec' }, '📅 直近14日（分）'),
      chart,
      h('h3', { class: 'sec' }, '📚 単元ごと'),
      h('table', { class: 'utable' }, h('thead', {}, h('tr', {}, h('th', {}, '単元'), h('th', {}, '理解度'), h('th', {}, '正答率'), h('th', {}, '正解/出題'))), h('tbody', {}, unitRows)),
      h('h3', { class: 'sec' }, `👻 復習待ち ${s.reviewQueue.length} 問`),
      s.reviewQueue.length > 0 && btn('リベンジウェーブへ', () => go('battle', { mode: 'review' }), 'warn'),
      recent.length > 0 && h('div', { class: 'wrong-list' },
        h('p', { class: 'note' }, '最近まちがえた問題'),
        recent.map(({ m, p }) => h('div', { class: 'wl-item' }, h('small', {}, `${m.date}｜${UNIT[m.unit]?.title || ''}`), h('div', { rich: p.stem })))),
      h('p', { class: 'note center' }, `これまでの正解 ${s.stats.correct} / ${s.stats.asked} 問・ウェーブ突破 ${s.stats.waves} 回・ボス撃破 ${s.stats.bosses} 回`)));
}
