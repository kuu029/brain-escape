// 💎の入り方の記録（おうちの人ページ用）: 日ごとに「どこで・何回・何💎」
//   log[日付].gems = { key: { n: 回数, gems: 合計 } }
//   key: w:単元（ウェーブ）、review（リベンジ）、m:教科（暗号ラッシュ）、md:教科（暗号ディフェンス）、ta:単元（タイムアタック）、
//        mission・achieve・bonus（2時間・はじめての模試）・plan・exam・chal（並べ替えチャレンジの差し引き）・ending
import { dayLog } from '../core/store.js';

export function logGems(key, gems) {
  if (!gems) return;
  const g = (dayLog().gems ||= {});
  const e = (g[key] ||= { n: 0, gems: 0 });
  e.n++;
  e.gems += gems;
}
