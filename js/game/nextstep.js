// 🎯 次の一手 ＋ 🎓 合格貯金
//   ・次の一手: アプリがえらんだ「いまやること」1つ。5教科を順番に回す（いちばん前にやった教科から）。
//     その日の1つ目を終えるまでは、ほかのモード（自分でえらぶ）には入れない（router の setGate）
//   ・合格貯金: 次の一手を終えるとたまる。第1志望に合格したら受け取り（不合格でも半分）。お金を渡すのは家族
//     はじめ ¥10,000 ＋ 1日の1つ目 ¥300・2つ目 ¥100 ＋ 7日つづけるごとに ¥500（上限 ¥100,000）
//     毎日1つなら、入試までにおよそ ¥5〜6万、毎日2つならおよそ ¥7万（入試まで130日くらいのとき）
//   next = { date, task: { subj, unit, at } | null, done: その日に終えた数, hist: [{ date, subj, unit, at }] }
//   savings = { bal, log: [{ date, yen, why }] }
import { S, save, today, dayDiff, unitState } from '../core/store.js';
import { UNIT, unitsOf } from '../units/registry.js';
import { isUnlocked, nextUnit } from './progress.js';
import { weekPlan, SUBJ_JA } from './plan.js';
import { unitNext } from '../screens/map.js';
import { setGate } from '../core/router.js';

export const NEXT_SUBJ = ['math', 'english', 'japanese', 'science', 'social'];
export const SAVE = { start: 10000, first: 300, second: 100, week: 500, max: 100000, failRate: 0.5 };
export const EXAM_GUESS = '03-09'; // 入試日が未設定のときの仮の日（3月9日ごろ）

function st(now = new Date()) {
  const s = S();
  const n = (s.next ||= { date: null, task: null, done: 0, hist: [] });
  const d = today(now);
  if (n.date !== d) { n.date = d; n.done = 0; n.task = null; }
  return n;
}
export const nextDoneToday = (now) => st(now).done;
export const freeOpen = (now) => st(now).done >= 1;

// ---------- えらび方 ----------
// その教科でやる単元: 今週の計画（まだ終わっていない）→ 苦手（直近の正答率70%未満）→ 次の新しい単元 → いちばん前に練習した単元
function unitFor(subj) {
  const ok = (id) => UNIT[id] && !UNIT[id].comingSoon && isUnlocked(id) && unitNext(id).cta;
  const plan = weekPlan().items.find((x) => x.subject === subj && !x.done);
  if (plan && ok(plan.unit)) return plan.unit;
  const us = unitsOf(subj).filter((u) => ok(u.id));
  const acc = (id) => { const r = unitState(id).recent || []; return r.length >= 5 ? r.reduce((a, b) => a + b, 0) / r.length : null; };
  const weak = us.filter((u) => acc(u.id) !== null && acc(u.id) < 0.7).sort((a, b) => acc(a.id) - acc(b.id))[0];
  if (weak) return weak.id;
  const nu = nextUnit(subj);
  if (nu && ok(nu.id)) return nu.id;
  const last = {};
  for (const x of st().hist) last[x.unit] = x.at;
  return us.sort((a, b) => (last[a.id] || 0) - (last[b.id] || 0))[0]?.id || null;
}
function pick() {
  const n = st();
  const last = {};
  for (const x of n.hist) last[x.subj] = x.at;
  const order = [...NEXT_SUBJ].sort((a, b) => (last[a] || 0) - (last[b] || 0) || NEXT_SUBJ.indexOf(a) - NEXT_SUBJ.indexOf(b));
  for (const subj of order) {
    const unit = unitFor(subj);
    if (unit) return { subj, unit, at: Date.now() };
  }
  return null;
}
// いまの次の一手（その日のうちは同じものを出す。終えたら次をえらぶ）。{ subj, unit, cta } または null
export function nextTask() {
  const n = st();
  if (!n.task || !UNIT[n.task.unit] || !unitNext(n.task.unit).cta) { n.task = pick(); save(); }
  if (!n.task) return null;
  return { ...n.task, cta: unitNext(n.task.unit).cta, subjJa: SUBJ_JA[n.task.subj] };
}

// ---------- 終えたとき（ウェーブ・訓練から呼ぶ）----------
// 戻り値: null（次の一手ではない）または { n: 今日いくつ目, yen: 貯金にたまった額, bal, week: 7日ボーナス }
export function completeNext(unitId) {
  const n = st();
  if (!n.task || n.task.unit !== unitId) return null;
  n.done++;
  n.hist.push({ date: n.date, subj: n.task.subj, unit: unitId, at: Date.now() });
  if (n.hist.length > 200) n.hist.splice(0, n.hist.length - 200);
  n.task = null;
  let yen = 0, week = 0;
  if (n.done === 1) yen += SAVE.first;
  else if (n.done === 2) yen += SAVE.second;
  if (n.done === 1 && streakDays() % 7 === 0) week = SAVE.week;
  const got = deposit(yen + week, n.done === 1 ? '次の一手（1つ目）' : '次の一手（2つ目）');
  save();
  return { n: n.done, yen: got, bal: savings().bal, week };
}
// 次の一手を1つ以上やった日が、今日まで何日つづいているか
export function streakDays(now = new Date()) {
  const days = new Set(st(now).hist.map((x) => x.date));
  let k = 0;
  const d = new Date(now);
  while (days.has(today(d))) { k++; d.setDate(d.getDate() - 1); }
  return k;
}

// ---------- 合格貯金 ----------
export function savings() {
  const s = S();
  if (!s.savings) s.savings = { bal: SAVE.start, log: [{ date: today(), yen: SAVE.start, why: 'スタート' }] };
  return s.savings;
}
function deposit(yen, why) {
  const sv = savings();
  const got = Math.max(0, Math.min(yen, SAVE.max - sv.bal));
  if (!got) return 0;
  sv.bal += got;
  sv.log.push({ date: today(), yen: got, why });
  if (sv.log.length > 300) sv.log.splice(1, sv.log.length - 300);
  return got;
}
// 入試の日（設定がなければ仮の日）
export function examDay(now = new Date()) {
  const ex = S().settings?.examDate;
  if (ex) return { date: ex, guess: false };
  const y = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  return { date: `${y}-${EXAM_GUESS}`, guess: true };
}
// 毎日 perDay 個（1 か 2）やったときの、入試の日の見こみ
export function projection(perDay = 1, now = new Date()) {
  const { date, guess } = examDay(now);
  const days = Math.max(0, dayDiff(today(now), date));
  const left = freeOpen(now) ? days : days + 1; // 今日まだなら今日の分も
  const daily = SAVE.first + (perDay >= 2 ? SAVE.second : 0);
  const weeks = Math.floor((streakDays(now) + left) / 7) - Math.floor(streakDays(now) / 7);
  return { yen: Math.min(SAVE.max, savings().bal + left * daily + weeks * SAVE.week), days, date, guess };
}
export const yen = (n) => `¥${Math.round(n).toLocaleString('ja-JP')}`;

// ---------- 1つ目を終えるまで、ほかのモードに入れない ----------
const FREE = new Set(['home', 'map', 'collection', 'records', 'settings', 'parent', 'ending', 'onboarding', 'result', 'diagnosis', 'prize']);
export function lockedBeforeNext(name, params = {}) {
  if (FREE.has(name) || freeOpen()) return false;
  const t = nextTask();
  if (!t) return false; // えらべる単元がない（はじめたばかり等）
  if ((name === 'training' || name === 'battle') && params.unit === t.unit && (name === 'training' || ['practice', 'boss'].includes(params.mode))) return false;
  if (name === 'exam' && params.phase !== 'sheet') return false; // 模試のえらぶ画面・結果を見るのはOK
  return true;
}
setGate(lockedBeforeNext, () => {
  const t = nextTask();
  import('../core/ui.js').then(({ modal, h }) => modal({
    title: '🎯 まずは「次の一手」',
    body: h('div', { class: 'modal-body' }, h('p', {}, '今日の「次の一手」を1つ終えると、ほかのモードも自由にえらべるよ。'), t && h('p', { class: 'note', html: `${t.subjJa}｜${UNIT[t.unit].title}` })),
    buttons: [{ label: 'あとで', value: false }, { label: '▶ 次の一手へ', value: true, cls: 'primary' }],
  }).then((v) => { if (v && t) import('../core/router.js').then(({ go }) => go(...t.cta.to)); }));
});
