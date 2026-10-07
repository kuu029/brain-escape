// 記録（脱獄日誌）: 称号、日別の勉強時間、単元別の進み具合と理解度、復習の件数
import { h, btn } from '../core/ui.js';
import { S, today, streakAlive, mastery, MASTERY_LABEL, cleared } from '../core/store.js';
import { UNIT, makeProblem, SUBJECTS, unitsOf } from '../units/registry.js';
import { BOSSES } from '../game/content.js';
import { isUnlocked } from '../game/progress.js';
import { spriteHTML } from '../game/art.js';
import { go } from '../core/router.js';
import { topBar } from './home.js';
import { backdrop } from '../ui/deco.js';

const GOAL_MIN = 15; // 1日の目安（グラフに点線で出す）
// 称号: ウェーブ突破 + ボス撃破×3 のポイントで上がる
export const TITLES = [
  [0, '新入り'], [5, '見習い脱獄犯'], [15, 'スプーン職人'], [30, '常習犯'], [60, '脱獄のプロ'], [100, '伝説の脱獄王'], [160, '監獄の支配者'],
];
export function titleOf(stats) {
  const pt = (stats.waves || 0) + (stats.bosses || 0) * 3;
  let i = 0;
  while (i + 1 < TITLES.length && pt >= TITLES[i + 1][0]) i++;
  const next = TITLES[i + 1];
  return { name: TITLES[i][1], pt, next: next ? { name: next[1], need: next[0] - pt, ratio: (pt - TITLES[i][0]) / (next[0] - TITLES[i][0]) } : null };
}
const STARS = { new: 0, trained: 1, practicing: 2, mastered: 3 };

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
  const maxM = Math.max(GOAL_MIN * 1.4, ...mins);
  const totalMin = Math.round(Object.values(s.log).reduce((a, b) => a + b.seconds, 0) / 60);
  const t = today();
  const ttl = titleOf(s.stats);

  // 単元別の累計
  const per = {};
  for (const lg of Object.values(s.log)) for (const [u, v] of Object.entries(lg.byUnit)) {
    per[u] ||= { asked: 0, correct: 0 };
    per[u].asked += v.asked;
    per[u].correct += v.correct;
  }

  const chart = h('div', { class: 'chart', role: 'img', 'aria-label': '直近14日の勉強時間' },
    // 目安の点線（グラフの中身 136px、下の日付ラベル＋余白 約20px。css の .chart と合わせる）
    h('span', { class: 'goal', style: { bottom: `${Math.round(20 + (GOAL_MIN / maxM) * 0.86 * 136)}px` } }, h('small', {}, `目安${GOAL_MIN}分`)),
    days.map((d, i) => h('div', { class: `col ${d === t ? 'today' : ''} ${mins[i] >= GOAL_MIN ? 'met' : ''}` },
      h('span', { class: 'v' }, mins[i] ? `${mins[i]}` : ''),
      h('div', { class: 'bar', style: { height: `${(mins[i] / maxM) * 86}%` }, title: `${d}: ${mins[i]}分 / ${asked[i]}問` }),
      h('span', { class: 'd' }, d.slice(8).replace(/^0/, '')))));

  // 単元ごと（ボスの顔・正答率のバー・★）
  const unitRow = (u) => {
    const p = per[u.id] || { asked: 0, correct: 0 };
    const ms = mastery(u.id);
    const open = isUnlocked(u.id) || cleared(u.id);
    const acc = p.asked ? Math.round((p.correct / p.asked) * 100) : null;
    return h('button', { class: `ur ${open ? '' : 'locked'}`, type: 'button', onclick: () => go('map', { focus: u.id }) },
      h('span', { class: 'ur-face', html: spriteHTML(`boss-${u.id}`, BOSSES[u.id]?.emoji || u.emoji, '') }),
      h('span', { class: 'ur-body' },
        h('span', { class: 'ur-top' }, h('b', {}, u.title), h('span', { class: 'ur-stars', 'aria-label': MASTERY_LABEL[ms] }, '★★★'.slice(0, STARS[ms]) + '☆☆☆'.slice(0, 3 - STARS[ms]))),
        h('span', { class: 'ur-bar' }, h('i', { style: { width: `${acc ?? 0}%` }, class: acc >= 80 ? 'good' : acc >= 50 ? 'mid' : 'low' })),
        h('small', {}, acc === null ? (open ? 'まだ解いていない' : '🔒 ロック中') : `正答率 ${acc}%（${p.correct}/${p.asked}）・${MASTERY_LABEL[ms]}`)));
  };
  const subjBlocks = Object.entries(SUBJECTS).map(([id, sj]) => {
    const list = unitsOf(id).filter((u) => !u.comingSoon);
    const done = list.filter((u) => cleared(u.id)).length;
    return h('details', { class: 'subj-block', open: id === 'math' ? '' : null },
      h('summary', {}, h('b', {}, sj.sub), h('span', { class: 'sb-prog' }, h('span', { class: 'sb-bar' }, h('i', { style: { width: `${(done / list.length) * 100}%` } })), `${done}/${list.length}`)),
      h('div', { class: 'ur-list' }, list.map(unitRow)));
  });

  const recent = s.mistakes.slice(-8).reverse().map((m) => ({ m, p: makeProblem(m.generatorId, m.seed) })).filter((x) => x.p);

  backdrop(el, 'desk');
  el.append(topBar(() => go('home')),
    h('div', { class: 'records' },
      h('div', { class: 'journal-head' },
        h('div', { class: 'jh-title' }, '📓 脱獄日誌'),
        h('div', { class: 'jh-rank' }, h('small', {}, '称号'), h('b', {}, ttl.name)),
        ttl.next
          ? h('div', { class: 'jh-next' }, h('span', { class: 'jh-bar' }, h('i', { style: { width: `${Math.round(ttl.next.ratio * 100)}%` } })), h('small', {}, `次の称号「${ttl.next.name}」まで あと ${ttl.next.need}pt（ウェーブ突破 1pt・ボス撃破 3pt）`))
          : h('small', { class: 'jh-next' }, '最高の称号！ もうこの監獄に敵はいない。')),
      h('div', { class: 'stats tickets' },
        h('div', {}, h('b', {}, `${Math.round((s.log[t]?.seconds || 0) / 60)}分`), h('small', {}, '今日')),
        h('div', {}, h('b', {}, `🔥${streakAlive()}日`), h('small', {}, `連続（最高${s.streak.best || 0}）`)),
        h('div', {}, h('b', {}, `${totalMin}分`), h('small', {}, '合計'))),
      h('h3', { class: 'sec' }, '📅 直近14日（分）'),
      chart,
      h('h3', { class: 'sec' }, '📚 単元ごと'),
      subjBlocks,
      h('h3', { class: 'sec' }, `👻 復習待ち ${s.reviewQueue.length} 問`),
      s.reviewQueue.length > 0 && btn('リベンジウェーブへ', () => go('battle', { mode: 'review' }), 'warn'),
      recent.length > 0 && h('div', { class: 'wrong-list' },
        h('p', { class: 'note' }, '最近まちがえた問題'),
        recent.map(({ m, p }) => h('div', { class: 'wl-item' }, h('small', {}, `${m.date}｜${UNIT[m.unit]?.title || ''}`), h('div', { rich: p.stem })))),
      h('p', { class: 'note center' }, `これまでの正解 ${s.stats.correct} / ${s.stats.asked} 問・ウェーブ突破 ${s.stats.waves} 回・ボス撃破 ${s.stats.bosses} 回`)));
}
