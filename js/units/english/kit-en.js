// 英語の問題オブジェクトを組み立てる道具（選択肢・並べかえ・つづり）
import { sentence } from './gram.js';

export const BLANK = '（　　）';

// 空欄補充（1か所）。chunks の at 番目が空欄。日本語訳を上に出す
export function frameQ(rng, { chunks, at, correct, wrongs, tail = '', end = '.', ja }) {
  const shown = chunks.map((c, i) => (i === at ? BLANK : c));
  return {
    stem: `${ja}\n${sentence([...shown, tail], end)}`,
    ...textChoice(rng, correct, wrongs),
    answerText: sentence(chunks.map((c, i) => (i === at ? correct : c)).concat(tail), end),
    check: { kind: 'en-frame', chunks, at, tail, end },
  };
}

// 文字の選択式。wrongs: [{t, msg}]。同じ文字列の選択肢は自動で除く
export function textChoice(rng, correct, wrongs, n = 4) {
  const seen = new Set([correct]);
  const ws = [];
  for (const w of wrongs) {
    if (!w || !w.t || seen.has(w.t)) continue;
    seen.add(w.t);
    ws.push(w);
    if (ws.length === n - 1) break;
  }
  const all = rng.shuffle([{ t: correct, ok: true }, ...ws]);
  return {
    input: { kind: 'choice', text: true, choices: all.map((c) => c.t), answer: all.findIndex((c) => c.ok) },
    answerText: correct,
    wrong: all.map((c, i) => (c.msg ? { choice: i, msg: c.msg } : null)).filter(Boolean),
  };
}

// 文頭にきても小文字のタイルで出す語（入試の並べかえと同じ）
const LOWER = new Set(['do', 'does', 'did', 'is', 'are', 'am', 'was', 'were', 'can', 'what', 'where', 'who', 'when', 'how', 'which', 'whose', 'why', 'this', 'that', 'these', 'those', 'he', 'she', 'we', 'they', 'you', 'it', 'my', 'your', 'his', 'her', 'our', 'their', 'there']);
export function tileText(chunk) {
  const first = chunk.split(' ')[0];
  return LOWER.has(first.toLowerCase()) ? chunk[0].toLowerCase() + chunk.slice(1) : chunk;
}

// 並べかえ。chunks: 正しい順のかたまり。tail: 最後に固定で付ける語（時を表す語など）。
// decoys: [{t, msg}] 使わないタイル（入試の「1語不要」）
export function orderAns(rng, chunks, { tail = '', end = '.', decoys = [] } = {}) {
  const answer = chunks.map(tileText);
  const ds = decoys.filter((d) => d && !answer.includes(d.t));
  const tiles = rng.shuffle([...answer, ...ds.map((d) => d.t)]);
  return {
    input: { kind: 'order', tiles, answer, suffix: `${tail ? ` ${tail}`.replace(' ,', ',') : ''}${end}`, extra: ds.length },
    answerText: sentence([...chunks, tail], end),
    wrong: ds.map((d) => ({ uses: d.t, msg: d.msg })).filter((w) => w.msg),
  };
}

// つづり。文字タイル = 正解の文字 + ダミー extra 個
const DUMMY = 'aeioustrnlcdmpbhgky';
export function spellAns(rng, word, { extra = 2 } = {}) {
  const letters = word.split('');
  for (let i = 0; i < extra; i++) letters.push(rng.pick(DUMMY.split('')));
  return {
    input: { kind: 'spell', letters: rng.shuffle(letters), answer: word },
    answerText: word,
    wrong: [],
  };
}
