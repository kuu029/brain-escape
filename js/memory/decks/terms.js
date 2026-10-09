// 社会・理科の「用語カード」を組み立てる（データは soc.js / sci.js）
//   q: 用語、a: 説明、read: 読み、accept: 文字入力で正解にする書き方（用語・読み・別の書き方）
import { SOC_SRC } from './soc.js';
import { SCI_SRC } from './sci.js';

function build(subject, src) {
  const decks = [];
  const cards = [];
  for (const d of src) {
    decks.push({ id: d.id, subject, title: d.title, beta: true });
    for (const [q, read, a, alts = []] of d.list) {
      cards.push({ id: `${subject}:${q}`, deck: d.id, subject, kind: 'term', q, a, read, accept: [q, read, ...alts].filter(Boolean) });
    }
  }
  return { decks, cards };
}
export const SOC = build('soc', SOC_SRC);
export const SCI = build('sci', SCI_SRC);

// 選択肢に並べてもまぎらわしくないか: 同じ用語・同じ説明・片方がもう片方をふくむ（前線 / 寒冷前線）は並べない
export const termDistinct = (a, b) => a.q !== b.q && a.a !== b.a && !a.q.includes(b.q) && !b.q.includes(a.q);

// 文字入力の判定用: 全角・半角、カタカナ・ひらがな、空白や「・」のちがいはゆるす
export const normJa = (s) => String(s || '').normalize('NFKC').trim().toLowerCase()
  .replace(/[\s・･]/g, '')
  .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
