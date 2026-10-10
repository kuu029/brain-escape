// 国語の問題オブジェクトを組み立てる道具
import { textChoice } from '../english/kit-en.js';

export { textChoice };

// 選択式（正解の文字 ＋ まちがいの候補）。verify は「その文字が正解か」を別の方法で確かめる関数（テスト用）
export function jaChoice(rng, { stem, correct, wrongs, hint, steps, verify, n = 4 }) {
  return {
    stem,
    ...textChoice(rng, correct, wrongs.map((w) => (typeof w === 'string' ? { t: w } : w)), n),
    hint,
    steps,
    check: { kind: 'fn', verify },
  };
}
// 配列から、x 以外を n 個（重ならないように）
export const others = (rng, list, x, n) => rng.shuffle(list.filter((y) => y !== x)).slice(0, n);
