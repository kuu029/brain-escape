// 暗号室: 英単語のカード（英語棟の単語リスト 中1〜中3 をそのまま使う）
import { WORDS1, THEMES1 } from '../../units/english/words1.js';
import { WORDS2, THEMES2 } from '../../units/english/words2.js';
import { WORDS3, THEMES3 } from '../../units/english/words3.js';
import { distinct as wordDistinct } from '../../units/english/en-words1.js';

const THEMES = { 1: THEMES1, 2: THEMES2, 3: THEMES3 };
const ALL = [...WORDS1, ...WORDS2, ...WORDS3];

// デッキ = 学年 × テーマ
export const EN_DECKS = [];
export const EN_CARDS = [];
for (const g of [1, 2, 3]) {
  for (const [theme, title] of Object.entries(THEMES[g])) {
    const deck = `en${g}-${theme}`;
    EN_DECKS.push({ id: deck, subject: 'en', title: `中${g} ${title}` });
    for (const w of ALL.filter((x) => x.grade === g && x.theme === theme)) {
      EN_CARDS.push({
        id: `en:${w.w}`,
        deck,
        subject: 'en',
        kind: w.pos === 'idiom' ? 'phrase' : 'word',
        q: w.w, // 問い（英語）
        a: w.ja, // 答え（意味）
        pos: w.pos,
        accept: [w.w], // 文字入力で正解にする書き方
        word: w,
      });
    }
  }
}

// 同じ選択肢に並べてもまぎらわしくないか（意味が重なる・似た語は並べない）
export const enDistinct = (a, b) => wordDistinct(a.word, b.word);
