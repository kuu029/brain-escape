// 💎の保留プール: 先へ進まずに同じところをくり返すだけでは、💎が手に入らないようにする
//  ・各教科の棟: まだ倒したことのないボスが残っている間は、その棟でかせいだ💎はプールに保留。
//    まだ倒したことのないボスを1体倒すと、プールの💎をまとめて受け取れる（そしてまた0からたまる）
//    棟のボスを全部倒したあとは「この1週間（REFRESH_DAYS 日）倒していないボス」が対象。
//    棟の全部のボスを1週間以内に倒しているときだけ、保留なしでそのまま受け取れる
//  ・暗号室（教科ごと）: 新しい暗号と「顔合わせ」した数が、前に受け取ったときから
//    「やる気ふつう」の1日ぶん（MEM_SUBJECTS[].newBase 枚）に届くと受け取れる。まだ見ていない暗号がなくなったら保留なし
//  key: 棟は 'math' 'english' …、暗号室は 'mem:en' 'mem:soc' …
import { S, save, unitState, today, dayDiff } from '../core/store.js';
import { unitsOf, SUBJECTS } from '../units/registry.js';
import { CARDS, MEM_SUBJECTS } from '../memory/engine.js';
import { takeGems } from './gemcap.js';

const SUBJ_JA = { math: '数学', english: '英語', japanese: '国語', science: '理科', social: '社会' };

function box(key) {
  const p = (S().pool ||= {});
  return (p[key] ||= { gems: 0, since: Date.now() });
}
const memSubj = (key) => key.slice(4);

export const REFRESH_DAYS = 7;
// 棟: まだ倒したことのないボス（工事中はのぞく）
export const unbeaten = (subj) => unitsOf(subj).filter((u) => !u.comingSoon && !unitState(u.id).bossCleared);
// 棟: いまプールを受け取れるボス。{ units, kind: 'new'（まだ倒したことがない）| 'week'（この1週間倒していない）}
export function targets(subj, d = today()) {
  const nu = unbeaten(subj);
  if (nu.length) return { units: nu, kind: 'new' };
  const old = unitsOf(subj).filter((u) => !u.comingSoon && (!unitState(u.id).bossAt || dayDiff(unitState(u.id).bossAt, d) >= REFRESH_DAYS));
  return { units: old, kind: 'week' };
}
// このボスを倒すとプールを受け取れるか（倒した記録をつける前に呼ぶ）
export const isTarget = (unitId, subj) => targets(subj).units.some((u) => u.id === unitId);

// 暗号室: 前に受け取ってから顔合わせした数 / 必要な数
export function memProgress(subj, since = box(`mem:${subj}`).since) {
  const all = CARDS.filter((c) => c.subject === subj);
  const M = S().memory || {};
  const met = all.filter((c) => (M.cards?.[c.id]?.seen || 0) > since).length;
  const unseen = all.filter((c) => !M.cards?.[c.id]).length;
  return { met, need: Math.min(MEM_SUBJECTS[subj].newBase, met + unseen), unseen };
}

// いま保留がかかっているか
export function gated(key) {
  if (!key) return false;
  if (key.startsWith('mem:')) return memProgress(memSubj(key)).unseen > 0;
  return !!SUBJECTS[key] && targets(key).units.length > 0;
}

// プールの💎をまとめて受け取る。戻り値: 受け取った💎
export function release(key) {
  if (!key) return 0;
  const b = box(key);
  const g = b.gems;
  S().gems += g;
  b.gems = 0;
  b.since = Date.now();
  save();
  return g;
}

// 暗号室: 顔合わせの数が届いていたら受け取る
function memReady(key) {
  const pr = memProgress(memSubj(key));
  return pr.met >= pr.need;
}

// 💎をかせいだときに呼ぶ（S().gems に直接足すかわりに）
//   戻り値: { got: すぐ受け取った💎, pooled: プールに入れた💎, released: プールから受け取った💎, key, total: いまの保留 }
//   2時間の上限（gemcap）をこえた分は入らない（cut: 入らなかった💎）
export function earn(key, gems) {
  const { got: g0, cut } = takeGems(gems);
  gems = g0;
  if (!gated(key)) {
    // 保留が終わった（棟を全部制覇した等）: たまっていた分もいっしょに
    const released = key && S().pool?.[key]?.gems ? release(key) : 0;
    S().gems += gems;
    return { got: gems, pooled: 0, released, key, total: 0, cut };
  }
  const b = box(key);
  b.gems += gems;
  if (key.startsWith('mem:') && memReady(key)) {
    const released = release(key);
    return { got: 0, pooled: gems, released, key, total: 0, cut };
  }
  save();
  return { got: 0, pooled: gems, released: 0, key, total: b.gems, cut };
}

// まだ倒したことのないボスを倒したとき（棟）／顔合わせを終えたとき（暗号室）に呼ぶ
export function tryRelease(key) {
  if (!key || !S().pool?.[key]?.gems) return 0;
  if (key.startsWith('mem:') && gated(key) && !memReady(key)) return 0;
  return release(key);
}

// 表示用: { key, name, gems, gated, how: 受け取り方（文のかたまりの配列。かたまりの中では改行しない）}
export function poolInfo(key) {
  const g = S().pool?.[key]?.gems || 0;
  const on = gated(key);
  if (key.startsWith('mem:')) {
    const sj = memSubj(key);
    const pr = memProgress(sj);
    return { key, name: `暗号室（${MEM_SUBJECTS[sj].name}）`, gems: g, gated: on, met: pr.met, need: pr.need,
      how: ['新しい暗号と顔合わせ', `あと${Math.max(0, pr.need - pr.met)}枚（${pr.met}/${pr.need}）で`, '受け取れる'] };
  }
  const t = targets(key);
  return { key, name: `${SUBJ_JA[key] || key}の棟`, gems: g, gated: on, left: t.units.length, kind: t.kind, units: t.units.map((u) => u.id),
    how: t.kind === 'new'
      ? [`まだ倒していないボス（のこり${t.units.length}体）を`, '1体倒すと', '受け取れる']
      : [`この${REFRESH_DAYS}日間 倒していないボス（${t.units.length}体）を`, '1体倒すと', '受け取れる'] };
}

// ホーム用: 保留がある所だけ
export function allPools() {
  return Object.keys(S().pool || {}).map(poolInfo).filter((x) => x.gems > 0);
}
