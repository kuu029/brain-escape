// 記録（脱獄日誌）: 称号、日別の勉強時間とその日の挑戦の内訳、単元別の進み具合と理解度、復習の件数
import { h, btn } from '../core/ui.js';
import { S, save, today, streakAlive, mastery, MASTERY_LABEL, cleared } from '../core/store.js';
import { UNIT, makeProblem, SUBJECTS, unitsOf, lessonOf } from '../units/registry.js';
import { BOSSES } from '../game/content.js';
import { isUnlocked } from '../game/progress.js';
import { spriteHTML } from '../game/art.js';
import { go } from '../core/router.js';
import { topBar } from './home.js';
import { backdrop } from '../ui/deco.js';
import { rich } from '../core/mathml.js';
import { histRow } from './exam.js';
import { askList, askItem } from '../ui/asklater.js';
import { ACHIEVEMENTS, checkAchievements, achieveCount } from '../game/achieve.js';
import { ENDINGS, seenEndings } from './ending.js';

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
const KIND = { training: ['📘', '訓練'], practice: ['⚔️', '練習ウェーブ'], boss: ['👑', 'ボスウェーブ'], review: ['👻', 'リベンジウェーブ'], diagnosis: ['🔦', '看守チェック'], exam: ['📝', '模試'], memory: ['🔐', '暗号ラッシュ'], memtest: ['🏅', 'デッキ試験'], timeattack: ['⏱', 'タイムアタック'] };
const RESULT = { win: ['突破', 'good'], clear: ['クリア', 'good'], lose: ['つかまった', 'bad'], quit: ['とちゅうで終了', 'dim'], idle: ['放置で退出', 'dim'] };
const hm = (t) => { const d = new Date(t); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
const minText = (sec) => (sec < 60 ? `${sec}秒` : `${Math.round(sec / 60)}分`);

// その日の挑戦の一覧（新しい順）。記録の仕組みができる前の日は、単元ごとの問題数だけ出す
function dayDetail(s, date) {
  const lg = s.log[date];
  const list = (s.sessions || []).filter((x) => x.date === date).reverse();
  const [, m, d] = date.split('-');
  const head = h('div', { class: 'dd-head' }, h('b', {}, `${+m}月${+d}日`), h('small', {}, `勉強 ${minText(lg?.seconds || 0)}${list.length ? `・挑戦 ${list.length}回` : ''}`));
  if (list.length) {
    return h('div', { class: 'day-detail' }, head, list.map((x) => {
      const u = UNIT[x.unit];
      const [em, kind] = KIND[x.kind] || ['📝', x.kind];
      const [res, rc] = RESULT[x.result] || ['', 'dim'];
      const L = x.kind === 'training' && u ? lessonOf(u, x.lesson) : null;
      const acc = x.asked ? Math.round((x.correct / x.asked) * 100) : null;
      return h('div', { class: 'dd-row' },
        h('span', { class: 'dd-time' }, hm(x.at)),
        h('span', { class: 'dd-em' }, em),
        h('span', { class: 'dd-body' },
          h('b', { html: `${u ? u.title : { english: '英語', social: '社会', science: '理科', japanese: '国語', soc: '社会', sci: '理科', ja: '国語' }[x.subject] || '数学'}${L ? `｜${rich(L.title)}` : ''}${x.kind === 'exam' ? (x.lesson === 'full' ? ' フル模試' : ' ミニ模試') : ''}` }),
          h('small', {}, `${kind}・${x.asked ? `${x.correct}/${x.asked}問 正解（${acc}%）` : '問題なし'}・${minText(x.seconds)}`)),
        h('span', { class: `dd-res ${rc}` }, res));
    }));
  }
  const by = Object.entries(lg?.byUnit || {});
  if (by.length) {
    return h('div', { class: 'day-detail' }, head, by.map(([id, v]) => h('div', { class: 'dd-row' },
      h('span', { class: 'dd-em' }, '📝'),
      h('span', { class: 'dd-body' }, h('b', {}, UNIT[id]?.title || id), h('small', {}, `${v.correct}/${v.asked}問 正解`)))));
  }
  return h('div', { class: 'day-detail' }, head, h('p', { class: 'note' }, 'この日の記録はないよ。'));
}

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

// 実績（バッジ）: 達成したものは色つき、まだのものはシルエットと進み具合
function achieveBox(s) {
  for (const a of checkAchievements(s)) (s.achieveNew ||= []).push(a.id); // 達成のお知らせはホームで
  const got = s.achieve || {};
  return h('div', { class: 'ach-box', id: 'ach' },
    h('h3', { class: 'sec' }, `🏆 実績 ${achieveCount(s)} / ${ACHIEVEMENTS.length}`),
    h('div', { class: 'ach-grid' }, ACHIEVEMENTS.map((a) => {
      const { v, goal, unit = '' } = a.check(s);
      const done = !!got[a.id];
      return h('div', { class: `ach-cell t-${a.tier}${done ? ' done' : ''}` },
        h('span', { class: 'ach-badge', html: spriteHTML(`badge-${a.id}`, a.emoji, a.name) }),
        h('b', {}, a.name), h('small', {}, a.desc),
        done ? h('small', { class: 'ach-date' }, `${got[a.id]} 達成`) : h('span', { class: 'ach-prog' }, h('i', { style: { width: `${Math.min(1, v / goal) * 100}%` } }), h('em', {}, `${Math.min(v, goal)}/${goal}${unit}`)));
    })),
    seenEndings().length > 0 && h('div', { class: 'up-btns' }, seenEndings().map((k) => btn(`🎬 ${ENDINGS[k].title}をもう一度見る`, () => go('ending', { kind: k, replay: true }), 'ghost'))));
}

export function render(el, { tab = null } = {}) {
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
    days.map((d, i) => h('button', { class: `col ${d === t ? 'today' : ''} ${mins[i] >= GOAL_MIN ? 'met' : ''} ${d === t ? 'sel' : ''}`, type: 'button', 'data-day': d, onclick: () => pickDay(d) },
      h('span', { class: 'v' }, mins[i] ? `${mins[i]}` : ''),
      h('div', { class: 'bar', style: { height: `${(mins[i] / maxM) * 86}%` }, title: `${d}: ${mins[i]}分 / ${asked[i]}問` }),
      h('span', { class: 'd' }, d.slice(8).replace(/^0/, '')))));

  // 棒をタップすると、その日の内訳を下に出す
  const detailBox = h('div', {}, dayDetail(s, t));
  function pickDay(d) {
    chart.querySelectorAll('.col').forEach((c) => c.classList.toggle('sel', c.dataset.day === d));
    detailBox.replaceChildren(dayDetail(s, d));
  }

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
      achieveBox(s),
      h('h3', { class: 'sec' }, '📅 直近14日（分）'),
      chart,
      h('p', { class: 'note' }, '⏱ 問題や解説に向き合っていた時間だけを数えているよ（1問 最大3分。放置した時間は入らない）。棒をタップすると、その日の内訳が見られる。'),
      detailBox,
      (s.exams || []).length > 0 && h('h3', { class: 'sec' }, '📝 模試の記録'),
      (s.exams || []).length > 0 && h('div', { class: 'ex-hist' }, s.exams.slice(-6).reverse().map(histRow)),
      // あとで聞く: 解説でもわからなかった問題（家族に質問する用）
      askList().length > 0 && h('h3', { class: 'sec' }, `❓ あとで聞く（${askList().length}問）`),
      askList().length > 0 && h('p', { class: 'note' }, '解説を読んでもわからなかった問題。おうちの人や先生に聞いてみよう。タップで問題と解き方が開くよ。'),
      askList().length > 0 && h('div', { class: 'wrong-list' }, askList().map((x) => askItem(x, () => { const l = askList(); l.splice(l.indexOf(x), 1); save(); go('records'); }))),
      h('h3', { class: 'sec' }, '📚 単元ごと'),
      subjBlocks,
      h('h3', { class: 'sec' }, `👻 リベンジ待ち ${s.reviewQueue.length} 問`),
      s.reviewQueue.length > 0 && btn('リベンジウェーブへ', () => go('battle', { mode: 'review' }), 'warn'),
      recent.length > 0 && h('div', { class: 'wrong-list' },
        h('p', { class: 'note' }, '最近まちがえた問題'),
        recent.map(({ m, p }) => h('div', { class: 'wl-item' }, h('small', {}, `${m.date}｜${UNIT[m.unit]?.title || ''}`), h('div', { rich: p.stem })))),
      h('p', { class: 'note center' }, `これまでの正解 ${s.stats.correct} / ${s.stats.asked} 問・ウェーブ突破 ${s.stats.waves} 回・ボス撃破 ${s.stats.bosses} 回`)));
  if (tab === 'achieve') setTimeout(() => el.querySelector('#ach')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
}
