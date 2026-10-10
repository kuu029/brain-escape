// 苦手ミックス: 教科をまたいで「まちがえた回数が多い問題の型」と「正答率が低い単元」を集めて、1つのウェーブにする
import { S, unitState, today } from '../core/store.js';
import { UNIT, GEN } from '../units/registry.js';
import { practicePool } from './waves.js';

export const WEAK_DAYS = 30;
export const WEAK_MIN = 3; // これより少ない型しかなければ、まだ出さない
const dayMs = 86400000;

// 出題する生成器（多くまちがえた型ほど多めに入る）と、まとめ
export function weakPool(now = new Date()) {
  const s = S();
  const since = today(new Date(now.getTime() - WEAK_DAYS * dayMs));
  const count = {};
  for (const m of s.mistakes || []) {
    if (m.date < since || !GEN[m.generatorId] || !UNIT[m.unit]) continue;
    // 訓練で解放ずみの型だけ（まだ習っていない型は出さない）
    if (!practicePool(m.unit, unitState(m.unit).lessons).includes(m.generatorId)) continue;
    count[m.generatorId] = (count[m.generatorId] || 0) + 1;
  }
  // 正答率が低い単元（直近の20問で70%未満）からも、練習の型を足す
  for (const [id, us] of Object.entries(s.units || {})) {
    const r = us.recent || [];
    if (!UNIT[id] || r.length < 5 || r.reduce((a, b) => a + b, 0) / r.length >= 0.7) continue;
    for (const g of practicePool(id, us.lessons || {})) if (GEN[g]) count[g] = Math.max(count[g] || 0, 1);
  }
  const gens = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const pool = gens.flatMap(([g, n]) => Array(Math.min(3, n)).fill(g));
  const units = [...new Set(gens.map(([g]) => GEN[g].unit))];
  const subjects = [...new Set(units.map((u) => UNIT[u].subject))];
  return { pool, kinds: gens.length, units, subjects, ready: gens.length >= WEAK_MIN };
}
