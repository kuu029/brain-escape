// 画面切りかえ
import { studyStop } from './timer.js';
import { stopSpeech } from '../ui/speech.js';
import { blockedAtNight, nightModal } from '../game/night.js';

const screens = {};
let current = null;
let root = null;

export function register(name, mod) {
  screens[name] = mod;
}
export function mount(el) {
  root = el;
}
// 新しい版が届いていたら、ホームに戻ったときに読みこみ直す（バトルや模試のとちゅうでは読みこみ直さない）
let updateReady = false;
export const markUpdateReady = () => { updateReady = true; };
let onGo = null; // 画面が変わったときに呼ぶ（BGM の切りかえ）
export const setOnGo = (fn) => { onGo = fn; };
let rendering = false;
export function go(name, params = {}) {
  // 0時〜5時は遊ぶ画面に入れない（いまの画面のまま、寝る時間のお知らせ）
  if (blockedAtNight(name, params)) {
    nightModal();
    // 画面を作っているとちゅうの移動（マップ → 看守チェックなど）で止めたときは、空の画面にならないようにホームへ
    if (current && !rendering) return;
    name = 'home'; params = {};
  }
  if (updateReady && name === 'home') { location.reload(); return; }
  current?.mod.leave?.();
  studyStop(); // 勉強時間と挑戦の記録は、画面を離れたら締める
  stopSpeech(); // リスニングの放送も止める
  root.innerHTML = '';
  const el = document.createElement('div');
  el.className = `screen screen-${name}`;
  root.append(el);
  current = { name, mod: screens[name] };
  try { onGo?.(name, params); } catch { /* 音が鳴らなくても画面は出す */ }
  rendering = true;
  try { screens[name].render(el, params); } finally { rendering = false; }
  root.scrollTop = 0;
  window.scrollTo(0, 0);
}
export const currentScreen = () => current?.name;
