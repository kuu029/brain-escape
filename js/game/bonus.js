// 勉強の習慣づけボーナス（💎）
//  ・1時間ごと: その時間（例 12:00〜12:59）に最初に何か1つクリアすると +💎（朝6時〜夜10時台だけ。夜ふかしはもらえない）
//  ・その日はじめての模試: +💎
import { S, save, today } from '../core/store.js';

export const HOUR_GEMS = 5;
export const FIRST_EXAM_GEMS = 20;
export const BONUS_HOURS = [6, 22]; // 6時台〜22時台

function state() {
  const s = S();
  const d = today();
  if (!s.bonus || s.bonus.date !== d) s.bonus = { date: d, hours: [], exam: false };
  return s.bonus;
}
// 今の時間のボーナスがまだもらえるか（ホームの表示用）
export function hourOpen(now = new Date()) {
  const hr = now.getHours();
  if (hr < BONUS_HOURS[0] || hr > BONUS_HOURS[1]) return null;
  return state().hours.includes(hr) ? false : hr;
}
// 何かを1つクリアしたときに呼ぶ。kind: 'wave' | 'training' | 'memory' | 'exam'
// 戻り値: { items: [{ label, gems }], gems }（💎はここで足す）
export function claimActivity(kind, now = new Date()) {
  const b = state();
  const items = [];
  const hr = now.getHours();
  if (hr >= BONUS_HOURS[0] && hr <= BONUS_HOURS[1] && !b.hours.includes(hr)) {
    b.hours.push(hr);
    items.push({ label: `⏰ ${hr}時台のボーナス（今日 ${b.hours.length} 回目）`, gems: HOUR_GEMS });
  }
  if (kind === 'exam' && !b.exam) {
    b.exam = true;
    items.push({ label: '📝 今日はじめての模試ボーナス', gems: FIRST_EXAM_GEMS });
  }
  const gems = items.reduce((a, x) => a + x.gems, 0);
  S().gems += gems;
  save();
  return { items, gems };
}
