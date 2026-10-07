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

// 反射的に押して飛ばさないよう、画面に出てから ms のあいだ押せないボタン。
// 待ち時間は小さな円のタイマーで見せる（画面に出た瞬間から数える）
export function holdBtn(label, onclick, cls = '', ms = 1500) {
  const ring = h('span', { class: 'hold-ring', html: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/></svg>' });
  const b = btn(h('span', { class: 'hold-in' }, ring, h('span', {}, label)), onclick, `${cls} hold`);
  b.disabled = true;
  b.style.setProperty('--hold', `${ms}ms`);
  const start = () => {
    if (!b.isConnected) return requestAnimationFrame(start);
    b.classList.add('counting');
    setTimeout(() => { b.disabled = false; b.classList.remove('hold', 'counting'); ring.remove(); }, ms);
  };
  requestAnimationFrame(start);
  return b;
}

// モーダル。buttons: [{label, value, cls}] → 押されたボタンの value で resolve
export function modal({ title, body, buttons = [{ label: 'OK', value: true, cls: 'primary' }], dismissable = true, cls = '' }) {
  return new Promise((resolve) => {
    const close = (v) => {
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
  });
}
export const confirmBox = (title, body, yes = 'OK', no = 'やめる', danger = false) =>
  modal({ title, body, buttons: [{ label: no, value: false }, { label: yes, value: true, cls: danger ? 'danger' : 'primary' }] });

// 下から出るパネル。build(close) が中身を返す
export function sheet(build, cls = '') {
  let back = null;
  const close = () => {
    if (!back) return;
    back.classList.add('out');
    const b = back;
    back = null;
    setTimeout(() => b.remove(), 160);
  };
  const panel = h('div', { class: `sheet ${cls}` }, h('div', { class: 'sheet-grip' }), build(close));
  back = h('div', { class: 'modal-back sheet-back', onclick: (e) => { if (e.target === back) close(); } }, panel);
  document.body.append(back);
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
