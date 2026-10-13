// 🍬 景品ポイント（pt）: リアルの景品（お菓子など）と交換できる。1pt ＝ 1円の目安
//   ・💎とはべつ。くり返しでは増えず「本当に進んだこと」でだけたまる。1週間（月曜はじまり）で WEEK_CAP まで
//   ・使わなかったカラー解除券をポイントにできる（1週間で CONV_MIN 分まで。週の上限とはべつ）
//   ・景品をたのむ → ポイントは「予約中」（使えない）→ iPhone のショートカットで、共有リマインダーに登録＋家族に iMessage
//     → 買ってきて渡したら、おうちの人が合言葉を入れて「渡した」→ ポイントが消える。取り消すと戻る
// points = { bal, log: [{ at, date, key, pt, label }], catalog: [{ id, name, pt }], reqs: [{ id, name, pt, at, status }], nextId, paid: {} }
import { S, save, today, dayDiff } from '../core/store.js';
import { weekStart, weekPlan } from './plan.js';
import { REWARD, rewardState } from './reward.js';
import * as ME from '../memory/engine.js';

export const WEEK_CAP = 500;
// たまり方（pt）
export const PT = {
  planItem: 20, // 今週の計画の1単元を達成
  planAll: 200, // 今週の計画を全部達成
  boss: 20, // 保留プールの対象のボスを撃破（週に BOSS_WEEK 体まで）
  memDay: 10, // 暗号の顔合わせノルマを達成した日（全部見終わった教科は、復習待ちを0にした日）
  exam: 30, // 模試で、同じ教科・同じ種類の前回より点が上がった
  streak: 30, // 7日連続
};
export const BOSS_WEEK = 5;
// 使わなかった解除券 → ポイント: 15分 = 20pt。1週間で 60分ぶんまで
export const CONV_RATE = 20 / 15;
export const CONV_MIN = 60;
// 合言葉がないと、家族が「渡した」を押せない
export const SHORTCUT_NAME = 'ほしいもの登録';

export function pts() {
  const s = S();
  const p = (s.points ||= {});
  p.bal ||= 0;
  p.log ||= [];
  p.catalog ||= [];
  p.reqs ||= [];
  p.nextId ||= 1;
  p.paid ||= {};
  return p;
}
const wk = (now) => weekStart(now);
const thisWeek = (now) => pts().log.filter((e) => e.date >= wk(now));
// 今週たまった（変換はのぞく）
export const weekEarned = (now = new Date()) => thisWeek(now).filter((e) => e.pt > 0 && e.key !== 'conv').reduce((a, e) => a + e.pt, 0);
export const weekConvMin = (now = new Date()) => thisWeek(now).filter((e) => e.key === 'conv').reduce((a, e) => a + (e.min || 0), 0);
// 予約中（たのんで、まだ渡していない）
export const held = () => pts().reqs.filter((r) => r.status === 'wait' && r.pt).reduce((a, r) => a + r.pt, 0);
export const free = () => pts().bal - held();

function addLog(e) {
  const p = pts();
  p.log.push({ at: Date.now(), date: today(), ...e });
  if (p.log.length > 300) p.log.splice(0, p.log.length - 300);
}

// ポイントを足す（週の上限まで）。戻り値: 足した pt（0 なら上限）
export function earnPt(key, pt, label, now = new Date()) {
  const room = Math.max(0, WEEK_CAP - weekEarned(now));
  const got = Math.min(pt, room);
  if (got <= 0) return 0;
  pts().bal += got;
  addLog({ key, pt: got, label: got < pt ? `${label}（週の上限）` : label });
  save();
  if (globalThis.document) import('../core/ui.js').then(({ toast }) => toast(`🍬 +${got}pt　${label}`, 2200));
  return got;
}
// 1回だけ（key ごと）
function once(id, key, pt, label, now) {
  const p = pts();
  if (p.paid[id]) return 0;
  p.paid[id] = today();
  // 古い記録は消す（60日）
  for (const [k, d] of Object.entries(p.paid)) if (dayDiff(d, today()) > 60) delete p.paid[k];
  return earnPt(key, pt, label, now);
}

// ---------- たまるところ ----------
// 保留プールの対象のボスを倒した（progress.finishWave から）
export function onPoolBoss(unitTitle, now = new Date()) {
  if (thisWeek(now).filter((e) => e.key === 'boss').length >= BOSS_WEEK) return 0;
  return earnPt('boss', PT.boss, `ボス撃破（${unitTitle}）`, now);
}
// 今週の計画（ホームを開いたとき・計画のボーナスを受け取ったときに呼ぶ）
export function syncPlan(now = new Date()) {
  const p = weekPlan(now);
  let got = 0;
  for (const it of p.items) if (it.done) got += once(`plan:${p.week}:${it.unit}`, 'plan', PT.planItem, '今週の計画 1単元達成', now);
  if (p.items.length && p.doneCount === p.items.length) got += once(`planall:${p.week}`, 'plan', PT.planAll, '今週の計画 全部達成', now);
  return got;
}
// 7日連続（7, 14, 21 … 日目）
export function syncStreak(now = new Date()) {
  const st = S().streak;
  if (!st?.count || st.count % 7 || st.last !== today(now)) return 0;
  return once(`streak:${st.last}`, 'streak', PT.streak, `${st.count}日連続`, now);
}
// 暗号: その教科の今日の顔合わせノルマを終えた（全部見終わった教科は、復習待ちを0にした）。1日1回
export function syncMemory(subject, now = Date.now()) {
  const M = S().memory;
  if (!M?.cards) return 0;
  const unseen = ME.unseenLeft(M, subject);
  const day = ME.dayOf(M, now);
  const ok = unseen > 0 ? (day.newCount[subject] || 0) > 0 && ME.newLeft(M, subject, now) === 0 : ME.dueList(M, subject, now).length === 0;
  if (!ok) return 0;
  return once(`mem:${today(new Date(now))}`, 'mem', PT.memDay, unseen > 0 ? `暗号の顔合わせノルマ（${ME.MEM_SUBJECTS[subject].name}）` : `暗号の復習を全部（${ME.MEM_SUBJECTS[subject].name}）`, new Date(now));
}
// 模試: 同じ教科・同じ種類の前回より点（割合）が上がった
export function onExam(rec, now = new Date()) {
  const prev = (S().exams || []).filter((r) => r.id !== rec.id && r.subject === rec.subject && r.kind === rec.kind && r.max).pop();
  if (!prev || !rec.max || rec.got / rec.max <= prev.got / prev.max) return 0;
  return earnPt('exam', PT.exam, '模試で前回より点が上がった', now);
}

// ---------- 解除券 → ポイント ----------
export const convPt = (id) => Math.round(REWARD[id].min * CONV_RATE);
export const convLeft = (now = new Date()) => Math.max(0, CONV_MIN - weekConvMin(now));
export function convertTicket(id, now = new Date()) {
  const R = rewardState();
  const min = REWARD[id]?.min;
  if (!min || !(R.tix[id] > 0) || min > convLeft(now)) return 0;
  R.tix[id]--;
  const pt = convPt(id);
  pts().bal += pt;
  addLog({ key: 'conv', pt, min, label: `${REWARD[id].name}をポイントに` });
  save();
  return pt;
}

// ---------- 景品 ----------
export function addItem(name, pt) {
  const p = pts();
  name = String(name).trim().slice(0, 30);
  pt = Math.round(Number(pt));
  if (!name || !(pt > 0)) return null;
  const it = { id: `i${p.nextId++}`, name, pt };
  p.catalog.push(it);
  save();
  return it;
}
export function removeItem(id) {
  const p = pts();
  p.catalog = p.catalog.filter((x) => x.id !== id);
  save();
}
// たのむ: カタログの景品（pt つき）か、自由に書いたリクエスト（pt は家族があとで決める）
//   戻り値: 予約 { id, name, pt, no } または null（ポイントが足りない）
export function request({ itemId, name } = {}) {
  const p = pts();
  const it = itemId ? p.catalog.find((x) => x.id === itemId) : null;
  const nm = it ? it.name : String(name || '').trim().slice(0, 30);
  if (!nm) return null;
  const pt = it ? it.pt : null;
  if (pt && free() < pt) return null;
  const r = { id: `r${p.nextId}`, no: p.nextId++, name: nm, pt, at: Date.now(), date: today(), status: 'wait' };
  p.reqs.push(r);
  save();
  return r;
}
// ショートカットにわたす文（リマインダーの題名・iMessage の本文）
export const reqText = (r) => `${r.name}（${r.pt ? `${r.pt}pt` : '値段は家族が決める'}）受付#${r.no}`;
export const shortcutUrl = (r) => `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}&input=text&text=${encodeURIComponent(reqText(r))}`;
// 渡した（おうちの人が合言葉を入れたあとに呼ぶ）。pt: 自由リクエストの値段
export function handOver(id, pt) {
  const p = pts();
  const r = p.reqs.find((x) => x.id === id && x.status === 'wait');
  if (!r) return false;
  const cost = r.pt || Math.round(Number(pt));
  if (!(cost > 0) || p.bal < cost) return false;
  r.pt = cost;
  r.status = 'done';
  r.done = today();
  p.bal -= cost;
  addLog({ key: 'use', pt: -cost, label: `景品「${r.name}」` });
  save();
  return true;
}
export function cancelReq(id) {
  const r = pts().reqs.find((x) => x.id === id && x.status === 'wait');
  if (!r) return false;
  r.status = 'cancel';
  save();
  return true;
}
