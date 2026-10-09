// 勉強の習慣づけボーナス（💎）
//  ・2時間ボーナス: 2時間ごとの枠（6〜8時、8〜10時 …）の中で、勉強時間が合計10分たまると +💎
//    もらえるのは1日3回まで。朝6時〜夜10時台だけ（夜ふかしはもらえない）
//    勉強時間は timer.js の「実質勉強時間」（放置した時間は入らない）を枠ごとに数える（store.addSeconds）
//    受け取りは、何かを1つクリアしたとき（claimActivity）
//  ・その日はじめての模試: +💎
import { S, save, today, dayLog, slotOf } from '../core/store.js';

export const SLOT_GEMS = 15;
export const SLOT_NEED = 600; // 1枠で必要な勉強時間（秒）= 10分
export const SLOT_MAX = 3; // 1日にもらえる回数
export const FIRST_EXAM_GEMS = 20;
export const BONUS_HOURS = [6, 22]; // 6時台〜22時台

function state() {
  const s = S();
  const d = today();
  if (!s.bonus || s.bonus.date !== d || !s.bonus.slots) s.bonus = { date: d, slots: [], exam: !!(s.bonus?.date === d && s.bonus.exam) };
  return s.bonus;
}
const slotLabel = (sl) => `${sl * 2}〜${sl * 2 + 2}時`;

// ホームの表示用: { off } 夜 ／ { full } 今日の3回ぶんゲット済み ／ { got } この枠はゲット済み ／ { sec, need } たまり具合
export function slotStatus(now = new Date()) {
  const hr = now.getHours();
  const b = state();
  if (hr < BONUS_HOURS[0] || hr > BONUS_HOURS[1]) return { off: true, count: b.slots.length };
  if (b.slots.length >= SLOT_MAX) return { full: true, count: b.slots.length };
  const sl = slotOf(now);
  if (b.slots.includes(sl)) return { got: true, count: b.slots.length, next: slotLabel(sl + 1) };
  return { sec: dayLog().slots?.[sl] || 0, need: SLOT_NEED, count: b.slots.length, label: slotLabel(sl) };
}

// 何かを1つクリアしたときに呼ぶ。kind: 'wave' | 'training' | 'memory' | 'exam' | 'timeattack'
// 戻り値: { items: [{ label, gems }], gems }（💎はここで足す）
export function claimActivity(kind, now = new Date()) {
  const b = state();
  const items = [];
  const hr = now.getHours();
  // いまの枠と、ひとつ前の枠（枠をまたいで勉強していたとき、前の枠で10分たまっていたら取りこぼさない）
  if (hr >= BONUS_HOURS[0] && hr <= BONUS_HOURS[1]) {
    for (const sl of [slotOf(now), slotOf(now) - 1]) {
      if (b.slots.length >= SLOT_MAX || b.slots.includes(sl) || (dayLog().slots?.[sl] || 0) < SLOT_NEED || sl * 2 < BONUS_HOURS[0]) continue;
      b.slots.push(sl);
      items.push({ label: `⏰ ${slotLabel(sl)}の10分ボーナス（今日 ${b.slots.length}/${SLOT_MAX}）`, gems: SLOT_GEMS });
      break;
    }
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
