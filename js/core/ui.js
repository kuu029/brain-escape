// DOM の小物: 要素づくり、モーダル（ネイティブ confirm/alert は使わない）、トースト
import { rich } from './mathml.js';
import { sfx } from './sound.js';

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'rich') el.innerHTML = rich(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// ボタン（タップ音つき）
export function btn(label, onclick, cls = '') {
  return h('button', { class: `btn ${cls}`, type: 'button', onclick: (e) => { sfx('tap'); onclick(e); } }, label);
}

// 解説を読んでほしい場面のボタン。すぐ押せるが、画面に出てから ms 以内に押すと、
// 1回目だけ軽いトーストで「ひと目見てからもう一回タップ」とうながす（説教っぽいモーダルは出さない）。
// うながすのは5分に1回まで。正解のあとなどは普通の btn を使う
let lastNudge = 0;
export function readBtn(label, onclick, cls = '', ms = 2500, what = '解説') {
  let shown = Infinity;
  let asked = false;
  const b = btn(label, (e) => {
    if (!asked && Date.now() - shown < ms && Date.now() - lastNudge > 300000) {
      asked = true;
      lastNudge = Date.now();
      b.classList.add('nudge');
      toast(`👀 ${what}をサッと見てから、もう一回タップ！`, 1600);
      return;
    }
    onclick(e);
  }, cls);
  const start = () => { if (!b.isConnected) return requestAnimationFrame(start); shown = Date.now(); };
  requestAnimationFrame(start);
  return b;
}
// 読む量に合わせた「早すぎ」の目安（1秒に約8文字。1.2〜5秒）
export const readMs = (text) => Math.max(1200, Math.min(5000, String(text || '').replace(/<[^>]+>|\$|\\[a-z]+/g, '').length * 125));

// モーダル。buttons: [{label, value, cls}] → 押されたボタンの value で resolve
// ctl(close): 外から閉じたいとき用に close を受け取る
export function modal({ title, body, buttons = [{ label: 'OK', value: true, cls: 'primary' }], dismissable = true, cls = '', ctl = null }) {
  return new Promise((resolve) => {
    let closed = false;
    const close = (v) => {
      if (closed) return;
      closed = true;
      back.classList.add('out');
      setTimeout(() => back.remove(), 160);
      resolve(v);
    };
    const box = h('div', { class: `modal ${cls}`, role: 'dialog', 'aria-modal': 'true' },
      title && h('h2', { class: 'modal-title', rich: title }),
      body && (body instanceof Node ? body : h('div', { class: 'modal-body', rich: body })),
      h('div', { class: 'modal-btns' }, buttons.map((b) => btn(b.label, () => close(b.value), b.cls || ''))),
    );
    const back = h('div', { class: 'modal-back', onclick: (e) => { if (dismissable && e.target === back) close(null); } }, box);
    document.body.append(back);
    ctl?.(close);
  });
}
export const confirmBox = (title, body, yes = 'OK', no = 'やめる', danger = false) =>
  modal({ title, body, buttons: [{ label: no, value: false }, { label: yes, value: true, cls: danger ? 'danger' : 'primary' }] });

// 下から出るパネル。build(close) が中身を返す
//   開いているあいだは、うしろの画面（マップなど）がスクロールしないように止める（誤操作の防止）
//   パネルを下にスライドすると閉じる（パネルの中がいちばん上までスクロールされているとき）
let sheetLocks = 0;
let lockedY = 0;
function lockScroll() {
  if (sheetLocks++ > 0) return;
  lockedY = window.scrollY;
  Object.assign(document.body.style, { position: 'fixed', top: `-${lockedY}px`, left: '0', right: '0', overflow: 'hidden' });
}
function unlockScroll() {
  if (--sheetLocks > 0) return;
  sheetLocks = 0;
  Object.assign(document.body.style, { position: '', top: '', left: '', right: '', overflow: '' });
  window.scrollTo(0, lockedY);
}
export function sheet(build, cls = '') {
  let back = null;
  const close = () => {
    if (!back) return;
    back.classList.add('out');
    const b = back;
    back = null;
    unlockScroll();
    setTimeout(() => b.remove(), 160);
  };
  const panel = h('div', { class: `sheet ${cls}` }, h('div', { class: 'sheet-grip' }), build(close));
  back = h('div', { class: 'modal-back sheet-back', onclick: (e) => { if (e.target === back) close(); } }, panel);
  // うしろの画面に指の動きを伝えない（パネルの外をなぞってもマップが動かない）
  back.addEventListener('touchmove', (e) => { if (!panel.contains(e.target)) e.preventDefault(); }, { passive: false });
  // 下にスライドして閉じる
  let y0 = null;
  let dy = 0;
  let t0 = 0;
  panel.addEventListener('touchstart', (e) => {
    y0 = panel.scrollTop <= 0 ? e.touches[0].clientY : null;
    dy = 0;
    t0 = Date.now();
    panel.style.transition = 'none';
  }, { passive: true });
  panel.addEventListener('touchmove', (e) => {
    if (y0 === null) return;
    dy = e.touches[0].clientY - y0;
    if (dy <= 0 || panel.scrollTop > 0) { dy = 0; panel.style.transform = ''; return; }
    e.preventDefault(); // パネルの中身ではなく、パネルごと下へ
    panel.style.transform = `translateY(${dy}px)`;
  }, { passive: false });
  panel.addEventListener('touchend', () => {
    if (y0 === null) return;
    y0 = null;
    const fast = dy > 40 && dy / Math.max(1, Date.now() - t0) > 0.5;
    panel.style.transition = 'transform .18s ease-out';
    if (dy > 110 || fast) {
      panel.style.transform = 'translateY(110%)';
      close();
    } else panel.style.transform = '';
  });
  document.body.append(back);
  lockScroll();
  return close;
}

let toastEl = null;
export function toast(text, ms = 1600) {
  toastEl?.remove();
  toastEl = h('div', { class: 'toast', rich: text });
  document.body.append(toastEl);
  const me = toastEl;
  setTimeout(() => { me.classList.add('out'); setTimeout(() => me.remove(), 300); }, ms);
}

// ちょっとした演出（浮かぶ文字）
export function floatText(parent, text, cls = '') {
  const el = h('div', { class: `float-text ${cls}`, rich: text });
  parent.append(el);
  setTimeout(() => el.remove(), 1000);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
