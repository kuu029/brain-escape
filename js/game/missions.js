// デイリーミッション（日付で3つ決まる）
import { S, today, save } from '../core/store.js';
import { hashStr, makeRng } from '../core/rng.js';
import { logGems } from './gemlog.js';

const POOL = [
  { id: 'correct10', text: '正解を10回キメる', stat: 'correct', goal: 10, reward: 15 },
  { id: 'correct20', text: '正解を20回キメる', stat: 'correct', goal: 20, reward: 25 },
  { id: 'combo5', text: '5コンボを出す', stat: 'combo', goal: 5, max: true, reward: 15 },
  { id: 'wave1', text: 'ウェーブを1回クリア', stat: 'waves', goal: 1, reward: 10 },
  { id: 'wave3', text: 'ウェーブを3回クリア', stat: 'waves', goal: 3, reward: 25 },
  { id: 'review2', text: 'リベンジおばけを2体たおす', stat: 'reviewKills', goal: 2, reward: 20 },
  { id: 'build5', text: 'タワーを5回 建てる・強化する', stat: 'built', goal: 5, reward: 10 },
  { id: 'train3', text: '訓練の小問を3つクリア', stat: 'trainQ', goal: 3, reward: 10 },
  { id: 'nomiss', text: 'ライフを減らさずにウェーブクリア', stat: 'perfect', goal: 1, reward: 20 },
];

export function todayMissions() {
  const s = S();
  const t = today();
  if (s.missions.date !== t) {
    const rng = makeRng(hashStr(t));
    const picks = rng.shuffle(POOL).slice(0, 3);
    s.missions = { date: t, list: picks.map((p) => ({ id: p.id, progress: 0, claimed: false })) };
    save();
  }
  return s.missions.list.map((m) => ({ ...POOL.find((p) => p.id === m.id), ...m }));
}

// 進み具合を足す（max 指定のものは最大値で更新）
export function bump(stat, n = 1) {
  const list = todayMissions();
  const s = S();
  let changed = false;
  list.forEach((m, i) => {
    if (m.stat !== stat) return;
    const cur = s.missions.list[i];
    const v = m.max ? Math.max(cur.progress, n) : cur.progress + n;
    if (v !== cur.progress) {
      cur.progress = Math.min(v, m.goal);
      changed = true;
    }
  });
  if (changed) save();
}

export function claim(i) {
  const s = S();
  const list = todayMissions();
  const m = list[i];
  if (!m || m.claimed || m.progress < m.goal) return 0;
  s.missions.list[i].claimed = true;
  s.gems += m.reward;
  logGems('mission', m.reward);
  save();
  return m.reward;
}
