// 社会・理科の「用語カード」を組み立てる（データは soc.js / sci.js）
//   q: 用語、a: 説明、read: 読み、accept: 文字入力で正解にする書き方（用語・読み・別の書き方）
import { SOC_SRC } from './soc.js';
import { SCI_SRC } from './sci.js';
import { JA_SRC } from './ja.js';

function build(subject, src) {
  const decks = [];
  const cards = [];
  for (const d of src) {
    decks.push({ id: d.id, subject, title: d.title });
    for (const [q, read, a, alts = [], ng = []] of d.list) {
      // 国語の漢字デッキ: a は読み（読み問題・書き問題）。文字入力は漢字で書けたときだけ正解
      const c = d.kanji
        ? { id: `${subject}:${q}`, deck: d.id, subject, kind: 'term', q, a: read, read, accept: [q, ...alts] }
        : { id: `${subject}:${q}`, deck: d.id, subject, kind: 'term', q, a, read, accept: [q, read, ...alts].filter(Boolean) };
      if (d.ask) c.ask = d.ask;
      if (ng.length) c.ng = ng;
      cards.push(c);
    }
  }
  return { decks, cards };
}
export const SOC = build('soc', SOC_SRC);
export const SCI = build('sci', SCI_SRC);
export const JA = build('ja', JA_SRC);

// 選択肢に並べてもまぎらわしくないか: 同じ用語・同じ説明・片方がもう片方をふくむ（前線 / 寒冷前線）は並べない
export const termDistinct = (a, b) => a.q !== b.q && a.a !== b.a && !a.q.includes(b.q) && !b.q.includes(a.q)
  && !(a.ng || []).includes(b.q) && !(b.ng || []).includes(a.q); // 意味が近い語（十人十色 / 千差万別）も並べない

// 文字入力の判定用: 全角・半角、カタカナ・ひらがな、空白や「・」のちがいはゆるす
export const normJa = (s) => String(s || '').normalize('NFKC').trim().toLowerCase()
  .replace(/[\s・･]/g, '')
  .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
