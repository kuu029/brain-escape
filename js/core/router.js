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
export function go(name, params = {}) {
  current?.mod.leave?.();
  studyStop(); // 勉強時間と挑戦の記録は、画面を離れたら締める
  root.innerHTML = '';
  const el = document.createElement('div');
  el.className = `screen screen-${name}`;
  root.append(el);
  current = { name, mod: screens[name] };
  screens[name].render(el, params);
  root.scrollTop = 0;
  window.scrollTo(0, 0);
}
export const currentScreen = () => current?.name;
