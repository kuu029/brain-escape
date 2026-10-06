// 画面切りかえ
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
