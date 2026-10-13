// 解き方を読んでいるかの記録（おうちの人ページ用）: ウェーブでまちがえたあとのヒント画面
//   log[日付].fb = { m1: 1回目のまちがい, steps: 「解き方を見る」を押した, s1: 1回目のヒントを見ていた秒,
//                    m2: 2回目のまちがい（解き方と答えが出る）, s2: そのとき見ていた秒 }
//   見ていた秒は、1回あたり 1回目 60秒・2回目 120秒まで（放置した分で平均がくるわないように）
import { S, save, dayLog } from '../core/store.js';

const fb = () => (dayLog().fb ||= { m1: 0, steps: 0, s1: 0, m2: 0, s2: 0 });
let open = null;

export function fbShow(kind) {
  fbClose();
  fb()[kind === 1 ? 'm1' : 'm2']++;
  open = { kind, t: Date.now() };
}
export function fbSteps() { fb().steps++; }
export function fbClose() {
  if (!open) return;
  const sec = Math.min(open.kind === 1 ? 60 : 120, (Date.now() - open.t) / 1000);
  fb()[open.kind === 1 ? 's1' : 's2'] += Math.round(sec * 10) / 10;
  open = null;
  save();
}
// days: 日付の配列。戻り値: { m1, steps, s1, m2, s2, rate: 解き方を開いた割合(%), avg1, avg2: 平均秒 } または null
export function readStats(days) {
  const t = { m1: 0, steps: 0, s1: 0, m2: 0, s2: 0 };
  for (const d of days) { const f = S().log[d]?.fb; if (f) for (const k in t) t[k] += f[k] || 0; }
  if (!t.m1 && !t.m2) return null;
  return { ...t, rate: t.m1 ? Math.round((Math.min(t.steps, t.m1) / t.m1) * 100) : null, avg1: t.m1 ? Math.round(t.s1 / t.m1) : null, avg2: t.m2 ? Math.round(t.s2 / t.m2) : null };
}
