// 💎の入り方の記録（おうちの人ページ用）: 日ごとに「どこで・何回・何💎」
//   log[日付].gems = { key: { n: 回数, gems: 合計 } }
//   key: w:単元（ウェーブ）、review（リベンジ）、m:教科（暗号ラッシュ）、md:教科（暗号ディフェンス）、ta:単元（タイムアタック）、
//        mission・achieve・bonus（2時間・はじめての模試）・plan・exam・chal（並べ替えチャレンジの差し引き）・ending
import { S, dayLog } from '../core/store.js';
import { takeGems, capText } from './gemcap.js';

export function logGems(key, gems) {
  if (!gems) return;
  const g = (dayLog().gems ||= {});
  const e = (g[key] ||= { n: 0, gems: 0 });
  e.n++;
  e.gems += gems;
}

// くり返しかせげる💎を足す（2時間の上限つき）。上限に達したら知らせる。戻り値: { got, cut }
export function gainGems(key, gems) {
  const r = takeGems(gems);
  S().gems += r.got;
  logGems(key, r.got);
  if (r.cut > 0 && globalThis.document) import('../core/ui.js').then(({ toast }) => toast(capText(r.cut), 3200));
  return r;
}
