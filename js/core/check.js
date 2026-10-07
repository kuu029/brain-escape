// 解答の判定（DOMなし。テストからも使う）
import { Frac } from './frac.js';

function sameList(got, exp, unordered) {
  if (got.length !== exp.length) return false;
  if (!unordered) return got.every((g, i) => g.eq(exp[i]));
  const rest = [...exp];
  for (const g of got) {
    const i = rest.findIndex((e) => e.eq(g));
    if (i < 0) return false;
    rest.splice(i, 1);
  }
  return true;
}

// input: choice なら選んだ番号、num なら {key: "入力文字列"}
// 戻り値: { ok, msg?, nearly?, invalid? }
//   nearly / invalid のときはターンを消費しない（打ち直してもらう）
export function checkAnswer(p, input) {
  if (p.input.kind === 'order') return checkOrder(p, input);
  if (p.input.kind === 'spell') return checkSpell(p, input);
  if (p.input.kind === 'choice') {
    const ok = input === p.input.answer;
    const w = (p.wrong || []).find((x) => x.choice === input);
    return { ok, msg: ok ? null : w?.msg || null };
  }
  const keys = p.input.fields.map((f) => f.key);
  const parsed = {};
  for (const k of keys) {
    const r = Frac.parse(input?.[k]);
    if (!r) return { ok: false, invalid: true, msg: '数の形がヘンかも。もう一回入れてみて' };
    parsed[k] = r;
  }
  const got = keys.map((k) => parsed[k].value);
  const exp = keys.map((k) => Frac.of(p.answer[k]));
  const unordered = !!p.input.unordered;
  if (sameList(got, exp, unordered)) {
    if (keys.some((k) => parsed[k].unreduced)) {
      return { ok: false, nearly: true, msg: '値は合ってる！ でも約分（またはもっとシンプルな形）にしてから入れてね' };
    }
    return { ok: true };
  }
  for (const w of p.wrong || []) {
    if (!w.vals) continue;
    const wv = keys.map((k) => Frac.of(w.vals[k]));
    if (sameList(got, wv, unordered)) return { ok: false, msg: w.msg };
  }
  if (!unordered && got.length > 1 && sameList(got, exp, true)) {
    return { ok: false, msg: '値の組み合わせはいい感じ。でも入れる場所が逆かも？' };
  }
  if (exp.some((e) => !e.isZero()) && sameList(got, exp.map((e) => e.neg()), unordered)) {
    return { ok: false, msg: '符号（＋とー）が逆になってるっぽい！' };
  }
  return { ok: false, msg: null };
}

// 並べかえ: input = 選んだタイルの番号の配列
function checkOrder(p, input) {
  const { tiles, answer } = p.input;
  if (!Array.isArray(input) || input.length !== answer.length) return { ok: false, invalid: true, msg: `タイルを ${answer.length} 枚ならべてね` };
  const got = input.map((i) => tiles[i]);
  if (got.join(' ') === answer.join(' ')) return { ok: true };
  const extra = got.filter((t) => !answer.includes(t));
  const w = (p.wrong || []).find((x) => x.uses && got.includes(x.uses));
  if (w) return { ok: false, msg: w.msg };
  if (extra.length) return { ok: false, msg: `「${extra[0]}」は使わない語。いらないタイルが1枚まざってるよ。` };
  return { ok: false, msg: '使う語は合ってる！ ならべる順番がちがうみたい。' };
}
// つづり: input = 文字列
function checkSpell(p, input) {
  const s = String(input || '');
  if (!s) return { ok: false, invalid: true, msg: '文字をタップしてつづってね' };
  if (s === p.input.answer) return { ok: true };
  const sort = (x) => x.split('').sort().join('');
  if (sort(s) === sort(p.input.answer)) return { ok: false, msg: '使う文字は合ってる！ 順番をチェック。' };
  return { ok: false, msg: null };
}

// 答えの数値を表示用文字列へ（入力欄の初期化などに使う）
export const emptyInput = (p) => (p.input.kind === 'num' ? Object.fromEntries(p.input.fields.map((f) => [f.key, ''])) : null);
