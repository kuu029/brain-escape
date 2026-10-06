// 検算テスト:  node tests/verify.mjs   （--n 500 で1生成器あたりの問題数を変更）
// 1) 全生成器 × 多数シードで、答えを「表示された式」から独立に検算
// 2) 訓練ステップの確認小問も同様に検算
// 3) エンジン（ターン制TD）・保存/バックアップ・Service Worker・外部通信なし を確認
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evalTex, expandPm, splitTop, close, eqHolds } from './texeval.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const N = Number(args[args.indexOf('--n') + 1]) || (args.includes('--n') ? 500 : 500);
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const { UNITS, GEN, makeProblem } = await import('../js/units/registry.js');
const { makeRng } = await import('../js/core/rng.js');
const { checkAnswer } = await import('../js/core/check.js');
const { Frac } = await import('../js/core/frac.js');

let fails = 0;
let checks = 0;
const failByKey = new Map();
function fail(key, msg) {
  fails++;
  const n = (failByKey.get(key) || 0) + 1;
  failByKey.set(key, n);
  if (n <= 3) console.log(`  ✗ [${key}] ${msg}`);
}

// ---------- 文字列チェック ----------
const mathSegs = (s) => String(s).split('$').filter((_, i) => i % 2 === 1);
function dollarsBalanced(s) {
  return (String(s).match(/\$/g) || []).length % 2 === 0;
}
const UGLY = [
  [/\+\s*-|-\s*\+|--|\+\+/, '符号が重なっている'],
  [/(^|[^\d.{^])1(?=[a-zA-Z(]|\\sqrt)/, '係数1が書かれている'],
  [/\^\{1\}/, '1乗が書かれている'],
  [/(^|[^\d.])0(?=[a-zA-Z(]|\\sqrt)/, '係数0の項'],
  [/[+-]0(?![.\d])/, '+0 / -0 の項'],
  [/\\frac\{[^{}]*\}\{1\}/, '分母1の分数'],
  [/\\frac\{0\}/, '分子0の分数'],
  [/\\sqrt\{1\}|\\sqrt\{0\}/, '√1 / √0'],
];
function hygiene(key, tex) {
  for (const [re, why] of UGLY) if (re.test(tex)) fail(key, `表記: ${why}: ${tex}`);
}

// ---------- 数値ユーティリティ ----------
const numOf = (f) => (f instanceof Frac ? f.num() : Number(f));
const RANDV = [1.37, -0.61, 2.29, -1.83, 0.47];
function samplePoints(vars) {
  return RANDV.map((r, i) => Object.fromEntries(vars.map((v, j) => [v, r + j * 0.731 + i * 0.113])));
}
function sameFn(a, b, vars) {
  return samplePoints(vars).every((pt) => close(evalTex(a, pt), evalTex(b, pt), 1e-9));
}
function fitQuadratic(eq, v) {
  const [L, R] = eq.split('=');
  const P = (x) => evalTex(L, { [v]: x }) - evalTex(R, { [v]: x });
  const p0 = P(0), p1 = P(1), pm = P(-1), p2 = P(2), p3 = P(-3);
  const a = (p1 + pm) / 2 - p0;
  const b = (p1 - pm) / 2;
  const c = p0;
  if (!close(a * 4 + b * 2 + c, p2) || !close(a * 9 - b * 3 + c, p3)) throw new Error(`2次式ではない: ${eq}`);
  if (Math.abs(a) < 1e-12) throw new Error(`2次の係数が0: ${eq}`);
  const D = b * b - 4 * a * c;
  if (D < -1e-9) throw new Error(`実数解なし: ${eq}`);
  if (Math.abs(D) < 1e-9) return [-b / (2 * a)];
  return [(-b + Math.sqrt(D)) / (2 * a), (-b - Math.sqrt(D)) / (2 * a)];
}
function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const rest = [...b];
  for (const x of a) {
    const i = rest.findIndex((y) => close(x, y));
    if (i < 0) return false;
    rest.splice(i, 1);
  }
  return true;
}
const cleanSpace = (s) => s.replace(/\\quad|\\,|\\ /g, '');
// "x=a,\ b" や "x=\frac{-3\pm\sqrt{5}}{2}" → 数の集合
function rootsFromTex(tex, v) {
  const s = cleanSpace(tex);
  const parts = s.startsWith(`${v}=`) ? s.slice(v.length + 1) : s;
  const out = [];
  for (const part of splitTop(parts)) for (const e of expandPm(part)) out.push(evalTex(e));
  return out;
}

// ---------- 問題1つの検証 ----------
function validate(key, p) {
  checks++;
  if (!p || typeof p !== 'object') return fail(key, '問題が空');
  const texts = [p.stem || '', p.hint || '', p.answerText || '', ...(p.steps || []), ...(p.wrong || []).map((w) => w.msg || '')];
  for (const s of texts) if (!dollarsBalanced(s)) fail(key, `$ の対応ミス: ${s}`);
  for (const s of mathSegs(p.stem || '')) hygiene(key, s);
  if (!p.input) return fail(key, 'input なし');
  if (!p.check) return fail(key, 'check なし');
  const ck = p.check;

  if (p.input.kind === 'choice') {
    const { choices, answer } = p.input;
    if (!Array.isArray(choices) || choices.length < 2) return fail(key, '選択肢が少ない');
    if (new Set(choices).size !== choices.length) fail(key, `選択肢が重複: ${choices.join(' | ')}`);
    if (!(answer >= 0 && answer < choices.length)) return fail(key, '正解番号が範囲外');
    for (const c of choices) hygiene(key, c);
    if (!checkAnswer(p, answer).ok) fail(key, 'checkAnswer が正解を不正解と判定');
    for (let i = 0; i < choices.length; i++) if (i !== answer && checkAnswer(p, i).ok) fail(key, '不正解の選択肢が正解扱い');
    const correct = choices[answer];
    const others = choices.filter((_, i) => i !== answer);
    try {
      if (ck.kind === 'value') {
        const exp = evalTex(ck.expr, ck.vals || {});
        if (!close(evalTex(correct, ck.vals || {}), exp)) fail(key, `正解が式の値と不一致: ${ck.expr} = ${exp}, 正解 ${correct}`);
        for (const o of others) if (close(evalTex(o, ck.vals || {}), exp)) fail(key, `不正解の選択肢が実は正しい: ${o} (式 ${ck.expr})`);
      } else if (ck.kind === 'identity') {
        if (!sameFn(correct, ck.expr, ck.vars)) fail(key, `正解が式と一致しない: ${ck.expr} ≠ ${correct}`);
        for (const o of others) if (sameFn(o, ck.expr, ck.vars)) fail(key, `不正解の選択肢が実は同じ式: ${o} (式 ${ck.expr})`);
        if (ck.factored && !/\(/.test(correct)) fail(key, `因数分解の正解にかっこがない: ${correct}`);
      } else if (ck.kind === 'roots') {
        const truth = fitQuadratic(ck.eq, ck.var || 'x');
        if (!sameSet(rootsFromTex(correct, ck.var || 'x'), truth)) fail(key, `解が一致しない: ${ck.eq} → ${truth}, 正解 ${correct}`);
        for (const o of others) if (sameSet(rootsFromTex(o, ck.var || 'x'), truth)) fail(key, `不正解の選択肢が実は正しい: ${o}`);
      } else if (ck.kind === 'eqstep') {
        for (const e of ck.eqs) if (!eqHolds(e, ck.sol)) fail(key, `元の式が解で成り立たない: ${e} @ ${JSON.stringify(ck.sol)}`);
        if (!eqHolds(cleanSpace(correct), ck.sol)) fail(key, `正解の式が解で成り立たない: ${correct}`);
        if (ck.mustNotContain && correct.includes(ck.mustNotContain)) fail(key, `正解の式に ${ck.mustNotContain} が残っている: ${correct}`);
        for (const o of others) if (eqHolds(cleanSpace(o), ck.sol) && !(ck.mustNotContain && o.includes(ck.mustNotContain))) fail(key, `不正解の式が解で成り立ってしまう: ${o}`);
      } else if (ck.kind === 'transform') {
        const solveFor = ck.var;
        const pts = samplePoints(ck.others);
        const ok = (tex) => {
          const [lhs, rhs] = cleanSpace(tex).split('=');
          if (lhs !== solveFor) return false;
          return pts.every((pt) => eqHolds(ck.eq, { ...pt, [solveFor]: evalTex(rhs, pt) }));
        };
        if (!ok(correct)) fail(key, `等式変形の正解が成り立たない: ${ck.eq} → ${correct}`);
        for (const o of others) if (ok(o)) fail(key, `不正解の選択肢が実は正しい: ${o}`);
      } else if (ck.kind === 'fn') {
        if (!ck.verify(correct)) fail(key, `fn: 正解が条件を満たさない: ${correct}`);
        for (const o of others) if (ck.verify(o)) fail(key, `fn: 不正解の選択肢が条件を満たす: ${o}`);
      } else fail(key, `未知の check.kind ${ck.kind}（選択式）`);
    } catch (e) {
      fail(key, `評価エラー: ${e.message}`);
    }
    return;
  }

  if (p.input.kind !== 'num') return fail(key, `未知の input.kind ${p.input.kind}`);
  const fields = p.input.fields;
  if (!fields?.length) return fail(key, 'fields なし');
  const ans = p.answer;
  for (const f of fields) if (!(ans[f.key] instanceof Frac)) return fail(key, `answer.${f.key} がない`);
  // きれいな値か
  for (const f of fields) {
    const a = ans[f.key];
    // 整数（5桁まで）、分母30以下の分数、または小数第2位までの小数
    if (Math.abs(a.n) > 99999 || (a.d > 30 && 100 % a.d !== 0)) fail(key, `答えがきれいでない: ${a}`);
  }
  // 判定関数の確認
  const inputStr = Object.fromEntries(fields.map((f) => [f.key, ans[f.key].toString()]));
  if (!checkAnswer(p, inputStr).ok) fail(key, `checkAnswer が正解を不正解と判定: ${JSON.stringify(inputStr)}`);
  for (const w of p.wrong || []) {
    const wi = Object.fromEntries(fields.map((f) => [f.key, Frac.of(w.vals[f.key]).toString()]));
    if (checkAnswer(p, wi).ok) fail(key, `誤答パターンが正解扱い: ${JSON.stringify(wi)}`);
  }
  const nums = Object.fromEntries(fields.map((f) => [f.key, ans[f.key].num()]));
  try {
    if (ck.kind === 'value') {
      if (fields.length !== 1) fail(key, 'value は1欄のみ');
      const exp = evalTex(ck.expr, ck.vals || {});
      if (!close(nums[fields[0].key], exp)) fail(key, `値が一致しない: ${ck.expr} = ${exp}, 答え ${ans[fields[0].key]}`);
    } else if (ck.kind === 'equations') {
      const map = ck.map || Object.fromEntries(fields.map((f) => [f.key, f.key]));
      const sol = Object.fromEntries(Object.entries(map).map(([k, v]) => [v, nums[k]]));
      for (const e of ck.eqs) if (!eqHolds(e, sol)) fail(key, `解を代入しても成り立たない: ${e} @ ${JSON.stringify(sol)}`);
      // 一意性（各変数を少しずらすと崩れる）
      for (const v of Object.keys(sol)) {
        const moved = { ...sol, [v]: sol[v] + 1 };
        if (ck.eqs.every((e) => eqHolds(e, moved))) fail(key, `解が一意でない (${v}): ${ck.eqs.join(' / ')}`);
      }
      if (ck.vars && ck.eqs.length < ck.vars.length) fail(key, '式の数が足りない');
    } else if (ck.kind === 'roots') {
      const truth = fitQuadratic(ck.eq, ck.var || 'x');
      const got = fields.map((f) => nums[f.key]);
      if (!sameSet(got, truth)) fail(key, `解が一致しない: ${ck.eq} → ${truth}, 答え ${got}`);
    } else if (ck.kind === 'fn') {
      if (!ck.verify(nums)) fail(key, `fn: 答えが条件を満たさない ${JSON.stringify(nums)}`);
      for (const w of p.wrong || []) {
        const wn = Object.fromEntries(fields.map((f) => [f.key, Frac.of(w.vals[f.key]).num()]));
        if (ck.verify(wn)) fail(key, `fn: 誤答パターンが条件を満たす ${JSON.stringify(wn)}`);
      }
    } else fail(key, `未知の check.kind ${ck.kind}（数値）`);
  } catch (e) {
    fail(key, `評価エラー: ${e.message}`);
  }
}

const strip = (p) => JSON.stringify(p, (k, v) => (typeof v === 'function' ? 'fn' : v));

// ---------- 1) 生成器 ----------
console.log(`■ 生成器の検算（各 ${N} 問）`);
for (const [gid, g] of Object.entries(GEN)) {
  if (ONLY && g.unit !== ONLY) continue;
  const before = fails;
  const ids = new Set();
  for (let s = 1; s <= N; s++) {
    const seed = (s * 2654435761) >>> 0;
    let p;
    try {
      p = makeProblem(gid, seed);
    } catch (e) {
      fail(gid, `生成エラー seed=${seed}: ${e.stack}`);
      continue;
    }
    validate(gid, p);
    ids.add(strip({ s: p.stem, c: p.input.choices }));
    if (s <= 20 && strip(makeProblem(gid, seed)) !== strip(p)) fail(gid, '同じシードで同じ問題にならない');
  }
  const variety = ids.size;
  if (variety < Math.min(N, 15)) fail(gid, `問題のバリエーションが少なすぎる (${variety})`);
  console.log(`  ${fails === before ? '✓' : '✗'} ${gid.padEnd(16)} 種類 ${variety}`);
}

// ---------- 2) 訓練 ----------
console.log('■ 訓練の確認小問');
for (const u of UNITS) {
  if (ONLY && u.id !== ONLY) continue;
  for (const l of u.lessons || []) {
    const before = fails;
    for (const g of l.unlocks || []) if (!GEN[g] || GEN[g].unit !== u.id) fail(l.id, `unlocks の生成器が不明: ${g}`);
    let qs = 0;
    for (let s = 1; s <= Math.min(N, 300); s++) {
      let steps;
      try {
        steps = l.build(makeRng(s * 7919));
      } catch (e) {
        fail(l.id, `build エラー: ${e.stack}`);
        continue;
      }
      if (!steps.length) fail(l.id, 'ステップが空');
      for (const st of steps) {
        if (!dollarsBalanced(st.text || '')) fail(l.id, `$ の対応ミス: ${st.text}`);
        if (st.math) hygiene(l.id, st.math);
        if (st.q) {
          qs++;
          validate(l.id, { stem: st.text, ...st.q });
        }
      }
    }
    console.log(`  ${fails === before ? '✓' : '✗'} ${u.id}/${l.id} ${l.title}（小問 ${qs}）`);
  }
  // 全生成器がいずれかの訓練で解放されること
  if (u.generators && u.lessons) {
    const unlocked = new Set(u.lessons.flatMap((l) => l.unlocks));
    for (const g of Object.keys(u.generators)) if (!unlocked.has(g)) fail(u.id, `どの訓練でも解放されない生成器: ${g}`);
  }
}

// ---------- 3) その他 ----------
if (!ONLY) {
  const extra = await import('./verify-app.mjs');
  const r = await extra.run(ROOT, { fail, note: (m) => console.log('  ' + m) });
  checks += r.checks;
}

console.log('');
console.log(`検査数 ${checks} / 失敗 ${fails}`);
if (fails) {
  console.log('失敗の内訳:', Object.fromEntries(failByKey));
  process.exit(1);
}
console.log('ALL OK ✅');
