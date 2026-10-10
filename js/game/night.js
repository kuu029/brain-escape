// 夜ふかし対策: 0時〜5時は「寝る時間」。ウェーブ・暗記・模試・ガチャ・ごほうび券は使えない（記録やコレクションを見るのはOK）
import { h, modal } from '../core/ui.js';

export const NIGHT = { from: 0, to: 5 }; // 0:00〜4:59
export const isNight = (now = new Date()) => now.getHours() >= NIGHT.from && now.getHours() < NIGHT.to;

// 遊ぶ画面への移動を止めるか（name, params は router.go と同じ）
const PLAY = new Set(['battle', 'timeattack', 'training', 'diagnosis']);
export function blockedAtNight(name, params = {}, now = new Date()) {
  if (!isNight(now)) return false;
  if (PLAY.has(name)) return true;
  if (name === 'memory' && ['rush', 'flow', 'defense'].includes(params.phase)) return true;
  if (name === 'exam' && params.phase === 'sheet') return true;
  return false;
}

export function nightModal() {
  return modal({
    title: '🌙 寝る時間',
    body: h('div', { class: 'modal-body center' },
      h('div', { class: 'night-moon' }, '🌙'),
      h('p', {}, `${NIGHT.from}時〜${NIGHT.to}時は、ウェーブ・暗記・模試・ガチャはお休み。`),
      h('small', { class: 'note' }, 'しっかり寝ると、覚えたことが頭に残りやすくなる。また朝に！')),
    buttons: [{ label: 'わかった', value: true, cls: 'primary' }],
  });
}

// 遊ぶボタンの前で呼ぶ: 夜なら知らせて true
export function nightStop(now = new Date()) {
  if (!isNight(now)) return false;
  nightModal();
  return true;
}
