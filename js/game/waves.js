// ウェーブの構成と、出題する問題の選び方
import { UNIT, makeProblem, bossPool, GEN } from '../units/registry.js';
import { newSeed } from '../core/rng.js';

const BASE = [
  [0, 'grunt'], [1, 'grunt'], [3, 'runner'], [4, 'grunt'], [6, 'tank'], [8, 'runner'],
];
const BOSS = [
  [0, 'grunt'], [1, 'runner'], [2, 'grunt'], [4, 'boss'], [5, 'tank'], [7, 'grunt'], [9, 'runner'],
];

// reviews: 復習キューからのアイテム [{ generatorId, seed }]
export function practiceSchedule(reviews = []) {
  const s = BASE.map(([turn, kind]) => ({ turn, kind }));
  reviews.slice(0, 2).forEach((r, i) => s.push({ turn: i === 0 ? 2 : 5, kind: 'review', review: r }));
  return s;
}
export function bossSchedule(unitId, reviews = []) {
  const s = BOSS.map(([turn, kind]) => ({ turn, kind, look: kind === 'boss' ? unitId : null }));
  reviews.slice(0, 1).forEach((r) => s.push({ turn: 3, kind: 'review', review: r }));
  return s;
}
export function diagnosisSchedule(n) {
  const kinds = ['grunt', 'runner', 'grunt', 'tank'];
  return Array.from({ length: n }, (_, i) => ({ turn: i, kind: kinds[i % kinds.length], hp: 1 }));
}

// 出題係。recent な生成器を避け、ターンが進むほど難しめを出す
export function makePicker(pool, { ramp = true } = {}) {
  const history = [];
  return function pick(turn) {
    const ids = pool.filter((g) => GEN[g]);
    const maxDiff = ramp ? (turn < 3 ? 1 : turn < 7 ? 2 : 3) : 3;
    let cands = ids.filter((g) => (GEN[g].difficulty || 1) <= maxDiff);
    if (!cands.length) cands = ids;
    const fresh = cands.filter((g) => !history.slice(-2).includes(g));
    const list = fresh.length ? fresh : cands;
    const g = list[Math.floor(Math.random() * list.length)];
    history.push(g);
    return makeProblem(g, newSeed());
  };
}

// 練習ウェーブで出せる生成器（終わった訓練で解放されたもの）
export function practicePool(unitId, lessonsDone) {
  const u = UNIT[unitId];
  const ids = (u.lessons || []).filter((l) => lessonsDone[l.id]).flatMap((l) => l.unlocks);
  return ids.length ? ids : Object.keys(u.generators || {});
}
export const bossPoolOf = (unitId) => bossPool(UNIT[unitId]);

// 診断: 第1段階の各単元から3問
export function diagnosisProblems(unitIds) {
  const out = [];
  for (const id of unitIds) {
    const u = UNIT[id];
    const gens = Object.entries(u.generators).sort((a, b) => a[1].difficulty - b[1].difficulty).map(([g]) => g);
    const chosen = [gens[0], gens[1] || gens[0], gens[Math.min(2, gens.length - 1)]];
    for (const g of chosen) out.push(makeProblem(g, newSeed()));
  }
  // 単元をまぜすぎず、易しい順に（単元ごとに1問ずつ回す）
  const per = unitIds.map((_, i) => out.slice(i * 3, i * 3 + 3));
  const mixed = [];
  for (let k = 0; k < 3; k++) for (const p of per) mixed.push(p[k]);
  return mixed;
}
