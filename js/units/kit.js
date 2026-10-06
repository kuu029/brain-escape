// 単元ファイルで使う、問題オブジェクトの組み立て道具。
import { Frac } from '../core/frac.js';
import { tnum } from '../core/fmt.js';
import { Poly } from '../core/poly.js';

export const m = (tex) => `$${tex}$`; // 文章中の数式

// 選択式。correct: 正解の数式、wrongs: [{tex, msg}]（よくある間違い）
// filler(rng) は、間違い選択肢が足りないときの予備を作る関数
export function choice(rng, correct, wrongs = [], filler = null, n = 4) {
  const seen = new Set([correct]);
  const ws = [];
  for (const w of wrongs) {
    if (!w || !w.tex || seen.has(w.tex)) continue;
    seen.add(w.tex);
    ws.push(w);
    if (ws.length === n - 1) break;
  }
  let guard = 0;
  while (filler && ws.length < n - 1 && guard++ < 60) {
    const t = filler(rng);
    if (t && !seen.has(t)) {
      seen.add(t);
      ws.push({ tex: t });
    }
  }
  const all = rng.shuffle([{ tex: correct, ok: true }, ...ws]);
  return {
    input: { kind: 'choice', choices: all.map((c) => c.tex), answer: all.findIndex((c) => c.ok) },
    answerText: m(correct),
    wrong: all.map((c, i) => (c.msg ? { choice: i, msg: c.msg } : null)).filter(Boolean),
  };
}

// 数値入力。fields: [['x','x'], ...]（key, ラベル数式）または {key,label,text,suffix}
export function numAns(fields, answer, { wrong = [], unordered = false, text = false } = {}) {
  const fs = fields.map((f) => (Array.isArray(f) ? { key: f[0], label: f[1] } : f));
  const ans = {};
  for (const k of Object.keys(answer)) ans[k] = Frac.of(answer[k]);
  let answerText;
  if (unordered) answerText = m(`${fs[0].label}=${fs.map((f) => tnum(ans[f.key])).join(',\\ ')}`);
  else if (text || fs.some((f) => f.text !== undefined || f.suffix)) answerText = fs.map((f) => `${f.text ?? m(f.label)} ${m(tnum(ans[f.key]))}${f.suffix || ''}`.trim()).join('、');
  else answerText = m(fs.map((f) => `${f.label}=${tnum(ans[f.key])}`).join(',\\quad '));
  return {
    input: { kind: 'num', fields: fs, unordered },
    answer: ans,
    answerText,
    wrong: wrong
      .filter((w) => w && w.vals)
      .map((w) => ({ vals: Object.fromEntries(Object.entries(w.vals).map(([k, v]) => [k, Frac.of(v)])), msg: w.msg }))
      .filter((w) => !sameVals(w.vals, ans, fs, unordered)),
  };
}

// 多項式の選択式。wrongs: [{p: Poly, msg}]。正解と同じ式になってしまう誤答は自動で除く
export function polyChoice(rng, ans, wrongs, toTex = (p) => p.toTex()) {
  const ws = wrongs.filter((w) => w && w.p && !w.p.eq(ans)).map((w) => ({ tex: toTex(w.p), msg: w.msg }));
  const filler = (r) => {
    const terms = [...ans.t.values()];
    const t = r.pick(terms);
    const bump = Poly.of([[r.nz(-3, 3), t ? t.e : {}]]);
    const q = ans.add(bump);
    return q.eq(ans) || q.isZero() ? null : toTex(q);
  };
  return choice(rng, toTex(ans), ws, filler);
}

function sameVals(a, b, fs, unordered) {
  const xs = fs.map((f) => a[f.key]);
  const ys = fs.map((f) => b[f.key]);
  if (xs.some((x) => !x)) return false;
  if (!unordered) return xs.every((x, i) => x.eq(ys[i]));
  const rest = [...ys];
  return xs.every((x) => {
    const i = rest.findIndex((y) => y.eq(x));
    if (i < 0) return false;
    rest.splice(i, 1);
    return true;
  });
}

export const ONE = [['v', '答え']];
// 選択肢の予備（整数をずらす）
export const nearInt = (v, tex = (x) => String(x)) => (rng) => tex(v + rng.nz(-5, 5));
