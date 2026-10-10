// 画面切りかえ
import { studyStop } from './timer.js';

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
export function go(name, params = {}) {
  if (updateReady && name === 'home') { location.reload(); return; }
  current?.mod.leave?.();
  studyStop(); // 勉強時間と挑戦の記録は、画面を離れたら締める
  root.innerHTML = '';
  const el = document.createElement('div');
  el.className = `screen screen-${name}`;
  root.append(el);
  current = { name, mod: screens[name] };
  try { onGo?.(name, params); } catch { /* 音が鳴らなくても画面は出す */ }
  screens[name].render(el, params);
  root.scrollTop = 0;
  window.scrollTo(0, 0);
}
export const currentScreen = () => current?.name;
