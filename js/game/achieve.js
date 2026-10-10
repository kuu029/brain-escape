// 実績（トロフィー）: 長く遊ぶための目標。達成すると💎（ランクが高いほど多い）
//   s.achieve = { id: 'YYYY-MM-DD'（達成日） }。check(s) は { v: いまの数, goal } を返す
//   バッジの絵は art/badge-<id>.png（なければ絵文字）
import { S, today, saveNow } from '../core/store.js';
import { UNIT } from '../units/registry.js';
import { BOSS_CARD } from './content.js';
import { logGems } from './gemlog.js';

export const TIER = {
  bronze: { name: '銅', gems: 10 },
  silver: { name: '銀', gems: 25 },
  gold: { name: '金', gems: 50 },
  rainbow: { name: '虹', gems: 100 },
};
const bossUnits = (subject) => Object.keys(BOSS_CARD).filter((u) => UNIT[u] && !UNIT[u].comingSoon && UNIT[u].subject === subject);
const beaten = (s, list) => list.filter((u) => s.units[u]?.bossCleared).length;
const allBeaten = (s) => Object.values(s.units || {}).filter((u) => u.bossCleared).length;
const totalSec = (s) => Object.values(s.log || {}).reduce((a, d) => a + (d.seconds || 0), 0);
const defWins = (s, lv) => Object.values(s.memory?.defense || {}).reduce((a, r) => a + (r.lv?.[lv]?.wins || 0), 0);
const learned = (s) => Object.values(s.memory?.cards || {}).filter((c) => c && !c.pend && c.lv >= 1).length;
const bestExam = (s) => Math.max(0, ...(s.exams || []).filter((r) => r.max).map((r) => Math.round((r.got / r.max) * 100)));

export const ACHIEVEMENTS = [
  { id: 'boss1', emoji: '💀', tier: 'bronze', name: 'はじめてのボス撃破', desc: 'ボスを1体たおす', check: (s) => ({ v: allBeaten(s), goal: 1 }) },
  { id: 'boss10', emoji: '🎩', tier: 'silver', name: 'ボスハンター', desc: 'ちがうボスを10体たおす', check: (s) => ({ v: allBeaten(s), goal: 10 }) },
  { id: 'math', emoji: '⛓️', tier: 'gold', name: '数学棟 制覇', desc: '数学のボスを全部たおす', check: (s) => { const l = bossUnits('math'); return { v: beaten(s, l), goal: l.length }; } },
  { id: 'english', emoji: '🪶', tier: 'gold', name: '英語棟 制覇', desc: '英語のボスを全部たおす', check: (s) => { const l = bossUnits('english'); return { v: beaten(s, l), goal: l.length }; } },
  { id: 'japanese', emoji: '🖌️', tier: 'gold', name: '国語棟 制覇', desc: '国語のボスを全部たおす', check: (s) => { const l = bossUnits('japanese'); return { v: beaten(s, l), goal: l.length }; } },
  { id: 'science', emoji: '🔬', tier: 'gold', name: '理科棟 制覇', desc: '理科のボスを全部たおす', check: (s) => { const l = bossUnits('science'); return { v: beaten(s, l), goal: l.length }; } },
  { id: 'social', emoji: '🗺️', tier: 'gold', name: '社会棟 制覇', desc: '社会のボスを全部たおす', check: (s) => { const l = bossUnits('social'); return { v: beaten(s, l), goal: l.length }; } },
  { id: 'combo', emoji: '⚡', tier: 'silver', name: 'コンボマスター', desc: 'ウェーブで30コンボ', check: (s) => ({ v: s.stats.bestCombo || 0, goal: 30 }) },
  { id: 'correct', emoji: '💮', tier: 'gold', name: '正解 1000回', desc: '問題に通算1000回正解する', check: (s) => ({ v: s.stats.correct || 0, goal: 1000 }) },
  { id: 'streak7', emoji: '🔥', tier: 'bronze', name: '1週間つづけた', desc: '7日連続で開く', check: (s) => ({ v: s.streak.best || 0, goal: 7 }) },
  { id: 'streak30', emoji: '🌋', tier: 'rainbow', name: '1か月つづけた', desc: '30日連続で開く', check: (s) => ({ v: s.streak.best || 0, goal: 30 }) },
  { id: 'time', emoji: '⏳', tier: 'silver', name: '勉強10時間', desc: '勉強時間が合計10時間', check: (s) => ({ v: Math.floor(totalSec(s) / 60), goal: 600, unit: '分' }) },
  { id: 'defense', emoji: '🏰', tier: 'silver', name: '鉄壁の門番', desc: '暗号ディフェンス「むずかしい」で勝つ', check: (s) => ({ v: Math.min(1, defWins(s, 'hard') + defWins(s, 'oni')), goal: 1 }) },
  { id: 'oni', emoji: '👹', tier: 'rainbow', name: '鬼退治', desc: '暗号ディフェンス「おに」で勝つ', check: (s) => ({ v: Math.min(1, defWins(s, 'oni')), goal: 1 }) },
  { id: 'chal', emoji: '🎲', tier: 'gold', name: '大勝負', desc: '並べ替えチャレンジで10問全部正解', check: (s) => ({ v: s.flowChal?.perfect ? 1 : 0, goal: 1 }) },
  { id: 'gacha', emoji: '💊', tier: 'silver', name: 'ガチャ100回', desc: 'ガチャを通算100回まわす', check: (s) => ({ v: s.collection.pulls || 0, goal: 100 }) },
  { id: 'memory', emoji: '🔐', tier: 'gold', name: '暗号500枚', desc: '暗号（単語・用語）を500枚おぼえる', check: (s) => ({ v: learned(s), goal: 500 }) },
  { id: 'exam', emoji: '📝', tier: 'gold', name: '模試80点', desc: '模試で80点以上をとる', check: (s) => ({ v: bestExam(s), goal: 80, unit: '点' }) },
];
export const ACH = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

// 新しく達成したものを記録して💎をわたす。戻り値: 新しく達成した実績の配列
export function checkAchievements(s = S()) {
  const got = (s.achieve ||= {});
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (got[a.id]) continue;
    const { v, goal } = a.check(s);
    if (goal > 0 && v >= goal) {
      got[a.id] = today();
      s.gems += TIER[a.tier].gems;
      logGems('achieve', TIER[a.tier].gems);
      fresh.push(a);
    }
  }
  if (fresh.length) saveNow();
  return fresh;
}
export const achieveCount = (s = S()) => Object.keys(s.achieve || {}).filter((id) => ACH[id]).length;
