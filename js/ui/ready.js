// 「ノートとペンは用意した？」の確認と、3・2・1 のスタート合図（模試・タイムアタック）
import { h, modal } from '../core/ui.js';
import { sfx } from '../core/sound.js';

// lines: 確認に出す文。戻り値: true（はじめる）/ false
export function paperCheck({ title, lines = [], go = '用意した！ はじめる' }) {
  return modal({
    title,
    body: h('div', { class: 'modal-body ready-body' },
      h('div', { class: 'ready-paper' }, h('span', { class: 'rp-em' }, '📓✏️'), h('b', {}, 'ノートとペンは用意した？'), h('small', {}, '式や図は紙に書きながら解こう。入試本番と同じやり方に慣れておく。')),
      h('ul', { class: 'ready-list' }, lines.map((l) => h('li', { html: l })))), // lines はアプリ内の固定文（太字の <b> を使う）
    buttons: [{ label: 'まだ', value: false }, { label: go, value: true, cls: 'primary' }],
  }).then((v) => !!v);
}

// 3・2・1・スタート！（画面いっぱいに出して、終わったら resolve）
export function countdown(label = 'スタート！') {
  return new Promise((resolve) => {
    const num = h('b', { class: 'cd-num' }, '3');
    const box = h('div', { class: 'countdown', role: 'status' }, num);
    document.body.append(box);
    const seq = ['3', '2', '1', label];
    let i = 0;
    const step = () => {
      num.textContent = seq[i];
      num.classList.toggle('go', i === seq.length - 1);
      num.animate([{ transform: 'scale(1.8)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 }, { transform: 'scale(.9)', opacity: 1 }], { duration: 700, easing: 'ease-out' });
      sfx(i === seq.length - 1 ? 'combo' : 'tap');
      i++;
      if (i < seq.length) setTimeout(step, 750);
      else setTimeout(() => { box.remove(); resolve(); }, 650);
    };
    step();
  });
}
