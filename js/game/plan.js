// 今週の計画: 入試までの日数に合わせて、今週やる単元を教科ごとに1つずつ自動で決める（月曜に作り直す）
//   候補: ①苦手（最近の正答率が低い） ②続き（次に進む単元） ③復習の時期（突破したけど2週間以上さわっていない）
//   時期で優先順を変える: 入試まで90日より前は「進める」、30〜90日は「苦手つぶし」、30日をきったら「総仕上げ」
//   1単元 10問（その週に1回目で答えた数）で達成。5つ全部で 💎 ボーナス
import { S, save, today, cleared, unitState } from '../core/store.js';
import { UNIT, unitsOf } from '../units/registry.js';
import { isUnlocked, nextUnit } from './progress.js';
import { logGems } from './gemlog.js';

export const PLAN_SUBJ = ['math', 'english', 'japanese', 'science', 'social'];
export const SUBJ_JA = { math: '数学', english: '英語', japanese: '国語', science: '理科', social: '社会' };
export const PLAN_GOAL = 10; // 1単元あたりの問題数
export const PLAN_GEMS = 40; // 全部達成のボーナス
const WEAK = 0.7; // これより低い正答率は「苦手」
const STALE_DAYS = 14;

const dayMs = 86400000;
const atNoon = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
// 週のはじめ（月曜）の日付
export function weekStart(d = new Date()) {
  const x = atNoon(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return today(x);
}
const daysBetween = (a, b) => Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / dayMs);

// 入試までの日数 → 時期
export function phaseOf(examDate, now = new Date()) {
  if (!examDate) return { id: 'grow', name: '進める時期', desc: '新しい単元をどんどん進めよう' };
  const n = daysBetween(today(now), examDate);
  if (n < 0) return { id: 'grow', name: '進める時期', desc: '新しい単元をどんどん進めよう' };
  if (n <= 30) return { id: 'final', name: '総仕上げ', desc: '苦手と復習を中心に。新しい単元は後回し', days: n };
  if (n <= 90) return { id: 'fix', name: '苦手つぶし', desc: '苦手をなくしながら、残りの単元も進める', days: n };
  return { id: 'grow', name: '進める時期', desc: '新しい単元をどんどん進めよう', days: n };
}

const accOf = (id) => {
  const r = unitState(id).recent || [];
  return r.length >= 5 ? r.reduce((a, b) => a + b, 0) / r.length : null;
};
// その単元を最後にさわった日（記録がなければ null）
export function lastSeen(id, log = S().log) {
  let last = null;
  for (const [d, lg] of Object.entries(log)) if (lg.byUnit?.[id]?.asked && (!last || d > last)) last = d;
  return last;
}
// 週のはじめから今日までに、その単元で答えた問題の数（1回目のみ）
export function weekAsked(id, wk = weekStart(), log = S().log) {
  let n = 0;
  for (const [d, lg] of Object.entries(log)) if (d >= wk) n += lg.byUnit?.[id]?.asked || 0;
  return n;
}

// 教科ごとの候補（優先順に並べる）
function pickFor(subj, phase, now) {
  const units = unitsOf(subj).filter((u) => !u.comingSoon && isUnlocked(u.id));
  const weak = units.map((u) => [u, accOf(u.id)]).filter(([, a]) => a !== null && a < WEAK).sort((a, b) => a[1] - b[1])
    .map(([u, a]) => ({ unit: u.id, kind: 'weak', why: `苦手（正答率${Math.round(a * 100)}%）` }));
  const nx = nextUnit(subj);
  const next = nx ? [{ unit: nx.id, kind: 'next', why: unitState(nx.id).practiced || Object.keys(unitState(nx.id).lessons).length ? '続きを進める' : '新しい単元' }] : [];
  const stale = units.filter((u) => cleared(u.id)).map((u) => [u, lastSeen(u.id)])
    .map(([u, d]) => [u, d ? daysBetween(d, today(now)) : 999]).filter(([, n]) => n >= STALE_DAYS).sort((a, b) => b[1] - a[1])
    .map(([u, n]) => ({ unit: u.id, kind: 'stale', why: n >= 999 ? '復習の時期' : `復習の時期（${n}日ぶり）` }));
  const order = phase.id === 'final' ? [weak, stale, next] : phase.id === 'fix' ? [weak, next, stale] : [next, weak, stale];
  return order.flat()[0] || null;
}

export function buildPlan(now = new Date()) {
  const s = S();
  const phase = phaseOf(s.settings.examDate, now);
  const items = PLAN_SUBJ.map((sj) => pickFor(sj, phase, now)).filter(Boolean).map((x) => ({ ...x, subject: UNIT[x.unit].subject }));
  return { week: weekStart(now), phase: phase.id, items, claimed: false };
}

// いまの週の計画（なければ作る）。進み具合つき
export function weekPlan(now = new Date()) {
  const s = S();
  if (!s.plan || s.plan.week !== weekStart(now) || s.plan.items.some((x) => !UNIT[x.unit])) {
    s.plan = buildPlan(now);
    save();
  }
  const items = s.plan.items.map((x) => {
    const n = Math.min(PLAN_GOAL, weekAsked(x.unit, s.plan.week));
    return { ...x, n, done: n >= PLAN_GOAL };
  });
  return { ...s.plan, phaseInfo: phaseOf(s.settings.examDate, now), items, doneCount: items.filter((x) => x.done).length };
}

// 全部達成のボーナス（週に1回）
export function claimPlan() {
  const s = S();
  const p = weekPlan();
  if (p.claimed || !p.items.length || p.doneCount < p.items.length) return 0;
  s.plan.claimed = true;
  s.gems += PLAN_GEMS;
  logGems('plan', PLAN_GEMS);
  save();
  return PLAN_GEMS;
}

// 今日やる1つ: 計画の中で、まだ終わっていなくて、いちばん進んでいないもの
export function planNext(now = new Date()) {
  const p = weekPlan(now);
  const left = p.items.filter((x) => !x.done);
  if (!left.length) return null;
  return left.slice().sort((a, b) => a.n - b.n)[0];
}
