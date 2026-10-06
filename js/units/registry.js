// 単元の登録所。新しい単元は import して UNITS に1行足すだけ。
import { makeRng } from '../core/rng.js';
import signedNumbers from './stage1/signed-numbers.js';
import fractionsDecimals from './stage1/fractions-decimals.js';
import expressions from './stage1/expressions.js';
import linearEquations from './stage1/linear-equations.js';
import polynomials from './stage2/polynomials.js';
import simultaneous from './stage2/simultaneous.js';
import expandFactor from './stage2/expand-factor.js';
import squareRoots from './stage2/square-roots.js';
import quadratic from './stage2/quadratic.js';
import stage3 from './stage3/placeholders.js';

export const UNITS = [
  signedNumbers,
  fractionsDecimals,
  expressions,
  linearEquations,
  polynomials,
  simultaneous,
  expandFactor,
  squareRoots,
  quadratic,
  ...stage3,
];

export const UNIT = Object.fromEntries(UNITS.map((u) => [u.id, u]));

export const STAGES = [
  { n: 1, title: '第1段階　入口（地下牢）' },
  { n: 2, title: '第2段階　本棟（メイン）' },
  { n: 3, title: '第3段階　外壁の向こう' },
];

// 生成器の一覧 GEN[generatorId] = { unit, difficulty, gen }
export const GEN = {};
for (const u of UNITS) {
  for (const [id, g] of Object.entries(u.generators || {})) {
    if (GEN[id]) throw new Error(`generator id 重複: ${id}`);
    GEN[id] = { unit: u.id, source: 'original', ...g };
  }
  // 過去問（固定問題）: unit.pastExams = [{ id, origin, difficulty, problem: () => ({...}) }]
  for (const px of u.pastExams || []) {
    GEN[`px-${px.id}`] = { unit: u.id, source: 'past-exam', origin: px.origin, difficulty: px.difficulty || 3, gen: () => px.problem() };
  }
}

export function makeProblem(generatorId, seed) {
  const g = GEN[generatorId];
  if (!g) return null;
  const p = g.gen(makeRng(seed));
  return {
    id: `${generatorId}-${seed}`,
    unit: g.unit,
    generatorId,
    seed,
    difficulty: g.difficulty,
    source: g.source,
    origin: g.origin,
    ...p,
  };
}

// ボスウェーブ用の生成器（単元の全生成器＋過去問）
export function bossPool(u) {
  const ids = u.boss || Object.keys(u.generators || {});
  return [...ids, ...(u.pastExams || []).map((px) => `px-${px.id}`)];
}

export const lessonOf = (u, lessonId) => (u.lessons || []).find((l) => l.id === lessonId);
