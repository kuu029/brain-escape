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
import proportion from './stage3/proportion.js';
import linearFunction from './stage3/linear-function.js';
import quadraticFunction from './stage3/quadratic-function.js';
import angles from './stage3/angles.js';
import congruence from './stage3/congruence.js';
import circleAngle from './stage3/circle-angle.js';
import similarity from './stage3/similarity.js';
import pythagoras from './stage3/pythagoras.js';
import solids from './stage3/solids.js';
import probability from './stage3/probability.js';
import data from './stage3/data.js';
import wordMix from './stage3/word-mix.js';
import enWords1 from './english/en-words1.js';
import enBe from './english/en-be.js';
import en3sg from './english/en-3sg.js';
import enPlural from './english/en-plural.js';
import enProg from './english/en-prog.js';
import enWh from './english/en-wh.js';
import enPast from './english/en-past.js';
import enWords2 from './english/en-words2.js';
import enFuture from './english/en-future.js';
import enPastProg from './english/en-pastprog.js';
import enModal from './english/en-modal.js';
import enThere from './english/en-there.js';
import enInf from './english/en-inf.js';
import enCompare from './english/en-compare.js';
import enConj from './english/en-conj.js';
import enWords3 from './english/en-words3.js';
import enPassive from './english/en-passive.js';
import enPerfect from './english/en-perfect.js';
import enParticiple from './english/en-participle.js';
import enRelative from './english/en-relative.js';
import enIndirect from './english/en-indirect.js';
import enSubjunctive from './english/en-subjunctive.js';

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
  // 第3段階
  proportion,
  linearFunction,
  quadraticFunction,
  angles,
  congruence,
  circleAngle,
  similarity,
  pythagoras,
  solids,
  probability,
  data,
  wordMix,
  // 英語
  enWords1,
  enBe,
  en3sg,
  enPlural,
  enProg,
  enWh,
  enPast,
  enWords2,
  enFuture,
  enPastProg,
  enModal,
  enThere,
  enInf,
  enCompare,
  enConj,
  enWords3,
  enPassive,
  enPerfect,
  enParticiple,
  enRelative,
  enIndirect,
  enSubjunctive,
];
for (const u of UNITS) u.subject ||= 'math';

export const UNIT = Object.fromEntries(UNITS.map((u) => [u.id, u]));

// 教科ごとの段階
export const SUBJECTS = {
  math: {
    title: 'ブレイン脱獄', sub: '数学', map: '🗺️ ブレイン監獄 マップ',
    stages: [
      { n: 1, title: '第1段階　入口（地下牢）' },
      { n: 2, title: '第2段階　本棟（メイン）' },
      { n: 3, title: '第3段階　外壁の向こう' },
    ],
  },
  english: {
    title: 'ブレイン脱獄 英語棟', sub: '英語', map: '🗺️ 英語棟 マップ',
    stages: [
      { n: 1, title: '第1段階　中1（英語棟1F）' },
      { n: 2, title: '第2段階　中2（英語棟2F）' },
      { n: 3, title: '第3段階　中3（屋上）' },
    ],
  },
};
export const STAGES = SUBJECTS.math.stages;
export const unitsOf = (subject) => UNITS.filter((u) => u.subject === subject);

// 生成器の一覧 GEN[generatorId] = { unit, difficulty, gen }
export const GEN = {};
for (const u of UNITS) {
  for (const [id, g] of Object.entries(u.generators || {})) {
    if (GEN[id]) throw new Error(`generator id 重複: ${id}`);
    GEN[id] = { unit: u.id, lang: u.subject, source: 'original', ...g };
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
    lang: g.lang,
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
