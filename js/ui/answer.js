// 問題の表示と解答入力（選択肢 / 自前テンキー）。iPhone の標準キーボードは出さない
import { h } from '../core/ui.js';
import { tex, rich } from '../core/mathml.js';
import { sfx } from '../core/sound.js';

const ORDER_INST = '日本語に合うように並べかえよう\n';
export function problemCard(p, { review = false, label = '' } = {}) {
  return h('div', { class: `qcard${review ? ' review' : ''}${p.lang === 'english' ? ' lang-en' : ''}${p.fig ? (p.fig.startsWith('<svg') ? ' has-fig' : ' has-table') : ''}` },
    h('div', { class: 'qcard-tags' },
      review && h('span', { class: 'tag tag-review' }, '👻 再襲来'),
      p.source === 'past-exam' && h('span', { class: 'tag' }, `過去問 ${p.origin || ''}`),
      label && h('span', { class: 'tag tag-dim' }, label)),
    // 並べかえの「日本語に合うように並べかえよう」は小さなラベルにして、行を節約する
    p.input.kind === 'order' && p.stem.startsWith(ORDER_INST)
      ? h('div', { class: 'qstem' }, h('small', { class: 'q-inst' }, '並べかえ'), h('span', { rich: p.stem.slice(ORDER_INST.length) }))
      : h('div', { class: 'qstem', rich: p.stem }),
    // 図（第3段階の関数・図形・データ）
    p.fig && h('div', { class: 'qfig', html: p.fig }));
}

// 入力中の文字列をそれっぽく表示
function showValue(s) {
  if (!s) return '<span class="ph">?</span>';
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  let t;
  if (body.includes('/')) {
    const [a, b] = body.split('/');
    t = `\\frac{${a || '\\square'}}{${b || '\\square'}}`;
  } else t = body || '';
  return `<span class="math">${tex((neg ? '-' : '') + t)}</span>`;
}

// onSubmit(input) は Promise を返してもよい（その間は入力を止める）
// opts.fire: 決定ボタンの文字（模試では「決定」）
export function answerPad(p, onSubmit, opts = {}) {
  const fireLabel = opts.fire || '発射!';
  let locked = false;
  let root = null;
  const submit = async (val) => {
    if (locked) return;
    locked = true;
    root.classList.add('busy');
    try {
      await onSubmit(val);
    } finally {
      locked = false;
      root.classList.remove('busy');
    }
  };

  if (p.input.kind === 'blanks') {
    const pad = blanksPad(p, (v) => submit(v), fireLabel);
    root = pad.el;
    return pad;
  }
  if (p.input.kind === 'spell') {
    const pad = keyboardPad(p, (v) => submit(v), fireLabel);
    root = pad.el;
    return pad;
  }
  if (p.input.kind === 'order') {
    const pad = tilePad(p, (v) => submit(v), fireLabel);
    root = pad.el;
    return pad;
  }

  if (p.input.kind === 'choice') {
    const label = (c) => (p.input.text ? h('span', { class: 'en' }, c) : h('span', { class: 'math', html: tex(c) }));
    const grid = h('div', { class: `choices n${p.input.choices.length}${p.input.text ? ' text' : ''}` },
      p.input.choices.map((c, i) => h('button', { class: 'choice', type: 'button', onclick: () => { sfx('tap'); submit(i); } }, label(c))));
    root = h('div', { class: 'pad' }, grid);
    return {
      el: root,
      mark(i, ok) { grid.children[i]?.classList.add(ok ? 'right' : 'wrong'); },
      clearMarks() { [...grid.children].forEach((b) => b.classList.remove('wrong', 'right')); },
      // 模試: いま選んでいる答えを示す（正誤は出さない）
      select(i) { [...grid.children].forEach((b, j) => b.classList.toggle('picked', j === i)); },
      disable(i) { grid.children[i]?.setAttribute('disabled', ''); },
    };
  }

  const fields = p.input.fields;
  const vals = Object.fromEntries(fields.map((f) => [f.key, '']));
  let active = 0;
  const boxes = fields.map((f, i) => {
    const label = f.text !== undefined
      ? h('span', { class: 'flabel', rich: f.text || '' })
      : h('span', { class: 'flabel', html: `<span class="math">${tex(f.label)}<span class="mo">=</span></span>` });
    const box = h('button', { class: 'fbox', type: 'button', onclick: () => { active = i; paint(); } },
      p.input.unordered && i > 0 ? h('span', { class: 'flabel dim' }, 'と') : null,
      label,
      h('span', { class: 'fval' }),
      f.suffix ? h('span', { class: 'fsuffix' }, f.suffix) : null);
    return box;
  });
  const paint = () => boxes.forEach((b, i) => {
    b.classList.toggle('active', i === active);
    b.querySelector('.fval').innerHTML = showValue(vals[fields[i].key]);
  });
  const type = (k) => {
    const key = fields[active].key;
    let s = vals[key];
    if (k === 'del') s = s.slice(0, -1);
    else if (k === '-') s = s.startsWith('-') ? s.slice(1) : '-' + s;
    else if (k === '/') { if (s && !s.includes('/') && !s.includes('.') && s !== '-') s += '/'; }
    else if (k === '.') { if (!s.includes('.') && !s.includes('/')) s += s === '' || s === '-' ? '0.' : '.'; }
    else if (s.replace('-', '').length < 7) s += k;
    vals[key] = s;
    paint();
  };
  // 指が触れた瞬間に反応（離すのを待たない）。キーボード操作の click だけは別に受ける
  const key = (label, k, cls = '') => h('button', {
    class: `key ${cls}`,
    type: 'button',
    onpointerdown: (e) => { e.preventDefault(); sfx('tap'); type(k); },
    onclick: (e) => { if (e.detail === 0) type(k); },
  }, label);
  const fire = h('button', {
    class: 'key fire',
    type: 'button',
    onclick: () => {
      const empty = fields.findIndex((f) => !vals[f.key] || vals[f.key] === '-' || vals[f.key].endsWith('/'));
      if (empty >= 0) {
        active = empty;
        paint();
        boxes[empty].classList.remove('shake');
        void boxes[empty].offsetWidth;
        boxes[empty].classList.add('shake');
        return;
      }
      sfx('tap');
      submit({ ...vals });
    },
  }, fireLabel);
  const nextKey = fields.length > 1
    ? h('button', { class: 'key fn', type: 'button', onclick: () => { sfx('tap'); active = (active + 1) % fields.length; paint(); } }, '次の欄')
    : h('button', { class: 'key fn', type: 'button', onclick: () => { sfx('tap'); vals[fields[0].key] = ''; paint(); } }, 'C');
  const pad = h('div', { class: 'keys' },
    key('7', '7'), key('8', '8'), key('9', '9'), key('⌫', 'del', 'fn'),
    key('4', '4'), key('5', '5'), key('6', '6'), key('±', '-', 'fn'),
    key('1', '1'), key('2', '2'), key('3', '3'), key('分数', '/', 'fn'),
    key('0', '0'), key('.', '.'), nextKey, fire);
  root = h('div', { class: 'pad' }, h('div', { class: `fields n${fields.length}` }, boxes), pad);
  paint();
  return {
    el: root,
    clear() { for (const f of fields) vals[f.key] = ''; active = 0; paint(); },
    mark() {},
    clearMarks() {},
  };
}

// タイル入力（英語）: order = 単語タイルの並べかえ（spell は keyboardPad）
// タイルは指が触れた瞬間に反応。置いたタイルはタップで元にもどり、ドラッグで並びを入れかえられる
function tilePad(p, onFire, fireLabel = '発射!') {
  const spell = p.input.kind === 'spell';
  const tiles = spell ? p.input.letters : p.input.tiles;
  const need = p.input.answer.length;
  let picked = [];
  const press = (fn) => ({
    onpointerdown: (e) => { e.preventDefault(); sfx('tap'); fn(); },
    onclick: (e) => { if (e.detail === 0) fn(); },
  });
  const line = h('div', { class: `tile-line${spell ? ' spell' : ''}` });
  const pool = h('div', { class: `tile-pool${spell ? ' spell' : ''}` });
  const btns = tiles.map((t, i) => h('button', { class: 'tile', type: 'button', ...press(() => pick(i)) }, t));
  pool.append(...btns);
  function pick(i) {
    if (picked.includes(i)) return;
    if (!spell && picked.length >= need) return shakeLine();
    picked.push(i);
    paint();
  }
  function unpick(k) {
    picked.splice(k, 1);
    paint();
  }
  function shakeLine() {
    line.classList.remove('shake');
    void line.offsetWidth;
    line.classList.add('shake');
  }
  function paint() {
    line.innerHTML = '';
    if (spell) {
      const word = picked.map((i) => tiles[i]).join('');
      line.append(h('span', { class: 'spell-word' }, word || h('span', { class: 'ph' }, '？')));
    } else {
      if (p.input.prefix) line.append(h('span', { class: 'tile-tail' }, p.input.prefix));
      picked.forEach((i, k) => line.append(placedTile(i, k)));
      for (let k = picked.length; k < need; k++) line.append(h('span', { class: 'tile-slot' }));
      line.append(h('span', { class: 'tile-tail' }, p.input.suffix || ''));
    }
    btns.forEach((b, i) => b.classList.toggle('used', picked.includes(i)));
  }
  // 置いたタイル: さわってすぐ離す＝もどす ／ 指を動かす＝つかんで好きな位置へ
  function placedTile(i, k) {
    const b = h('button', { class: 'tile placed', type: 'button', onclick: (e) => { if (e.detail === 0) unpick(k); } }, tiles[i]);
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const sx = e.clientX;
      const sy = e.clientY;
      let drag = null;
      try { b.setPointerCapture(e.pointerId); } catch { /* 古いブラウザ */ }
      const move = (ev) => {
        if (!drag) {
          if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
          drag = startDrag(b, k);
        }
        drag.move(ev.clientX - sx, ev.clientY - sy, ev.clientX, ev.clientY);
      };
      const up = (ev) => {
        b.removeEventListener('pointermove', move);
        b.removeEventListener('pointerup', up);
        b.removeEventListener('pointercancel', up);
        if (drag) drag.drop(ev.type === 'pointercancel', ev.clientX, ev.clientY);
        else { sfx('tap'); unpick(k); }
      };
      b.addEventListener('pointermove', move);
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
    });
    return b;
  }
  function startDrag(b, k) {
    sfx('tap');
    const others = [...line.querySelectorAll('.tile.placed')].filter((x) => x !== b);
    const rects = others.map((x) => x.getBoundingClientRect());
    const lineRect = line.getBoundingClientRect();
    b.classList.add('dragging');
    let to = k; // 入れる位置（others の何番目の前か）
    const mark = () => {
      others.forEach((x, j) => { x.classList.toggle('drop-before', j === to); x.classList.toggle('drop-after', to === others.length && j === others.length - 1); });
    };
    const out = (x, y) => y > lineRect.bottom + 30 || y < lineRect.top - 40;
    return {
      move(dx, dy, x, y) {
        b.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
        if (out(x, y)) { to = -1; mark(); line.classList.add('drop-out'); return; }
        line.classList.remove('drop-out');
        // 指にいちばん近いタイルの、左半分なら前・右半分なら後ろへ
        let best = -1;
        let bd = Infinity;
        rects.forEach((r, j) => {
          const d = Math.hypot((r.left + r.right) / 2 - x, ((r.top + r.bottom) / 2 - y) * 1.6);
          if (d < bd) { bd = d; best = j; }
        });
        if (best < 0) to = 0;
        else to = x < (rects[best].left + rects[best].right) / 2 ? best : best + 1;
        mark();
      },
      drop(cancel) {
        line.classList.remove('drop-out');
        if (cancel) return paint();
        const id = picked[k];
        if (to === -1) { picked.splice(k, 1); return paint(); } // 枠の外に出したら、元にもどす
        const rest = picked.filter((_, j) => j !== k);
        rest.splice(to, 0, id);
        picked = rest;
        paint();
      },
    };
  }
  const fire = h('button', {
    class: 'key fire',
    type: 'button',
    onclick: () => {
      if (spell ? picked.length === 0 : picked.length !== need) return shakeLine();
      sfx('tap');
      onFire(spell ? picked.map((i) => tiles[i]).join('') : [...picked]);
    },
  }, fireLabel);
  const ctrl = h('div', { class: 'tile-ctrl' },
    h('button', { class: 'key fn', type: 'button', ...press(() => { picked.pop(); paint(); }) }, '⌫'),
    h('button', { class: 'key fn', type: 'button', ...press(() => { picked = []; paint(); }) }, 'クリア'),
    fire);
  // タイルが多い・長いときは小さめにして、画面からはみ出さないようにする
  const compact = !spell && tiles.join(' ').length + (p.input.suffix || '').length + (p.input.prefix || '').length > 34;
  const el = h('div', { class: `pad tiles${compact ? ' compact' : ''}` },
    !spell && p.input.extra ? h('div', { class: 'tile-note' }, `※ 使わないタイルが ${p.input.extra} 枚まざっている`) : null,
    line, pool, ctrl);
  paint();
  return {
    el,
    clear() { picked = []; paint(); },
    mark() {},
    clearMarks() { picked = []; paint(); },
    disable() {},
  };
}

// つづり: キーボードと同じ並び（QWERTY）。使う文字の候補だけ光らせて、ほかは押せない（探す時間をへらす）
// 軽いヒント: 何文字か（マス）と、💡で次の1文字を入れる（使ったら pad.usedHint = true）
const QWERTY = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
function keyboardPad(p, onFire, fireLabel) {
  const word = p.input.answer;
  const need = word.length;
  const cand = new Set(p.input.letters.map((c) => c.toLowerCase()));
  let typed = '';
  const pad = { usedHint: false };
  const slots = h('div', { class: 'kb-slots' });
  function paint() {
    slots.replaceChildren(...Array.from({ length: need }, (_, i) => h('span', { class: `kb-slot${i < typed.length ? ' on' : ''}${i === typed.length ? ' cur' : ''}` }, typed[i] || '')));
  }
  const type = (c) => {
    if (typed.length >= need) { slots.classList.remove('shake'); void slots.offsetWidth; slots.classList.add('shake'); return; }
    typed += c;
    paint();
  };
  const key = (c) => h('button', {
    class: `kb-key${cand.has(c) ? ' hot' : ''}`,
    type: 'button',
    ...(cand.has(c) ? {} : { disabled: true, 'aria-hidden': 'true' }),
    onpointerdown: (e) => { e.preventDefault(); if (!cand.has(c)) return; sfx('tap'); type(c); },
    onclick: (e) => { if (e.detail === 0 && cand.has(c)) type(c); },
  }, c);
  const fn = (label, act, cls = '') => h('button', { class: `kb-key fn ${cls}`, type: 'button', onpointerdown: (e) => { e.preventDefault(); sfx('tap'); act(); }, onclick: (e) => { if (e.detail === 0) act(); } }, label);
  // 💡 ヒント: 正しいところまで残して、次の1文字を入れる
  const hint = () => {
    let k = 0;
    while (k < typed.length && typed[k].toLowerCase() === word[k].toLowerCase()) k++;
    if (k >= need) return;
    typed = typed.slice(0, k) + word[k].toLowerCase();
    pad.usedHint = true;
    paint();
  };
  const fire = h('button', {
    class: 'key fire kb-fire',
    type: 'button',
    onclick: () => {
      if (!typed) { slots.classList.remove('shake'); void slots.offsetWidth; slots.classList.add('shake'); return; }
      sfx('tap');
      onFire(typed);
    },
  }, fireLabel);
  const kb = h('div', { class: 'kb' },
    h('div', { class: 'kb-row' }, [...QWERTY[0]].map(key)),
    h('div', { class: 'kb-row r2' }, [...QWERTY[1]].map(key)),
    h('div', { class: 'kb-row r3' }, fn('💡', hint, 'hint'), [...QWERTY[2]].map(key), fn('⌫', () => { typed = typed.slice(0, -1); paint(); }, 'del')));
  paint();
  pad.el = h('div', { class: 'pad kbpad' }, slots, kb, h('div', { class: 'kb-ctrl' }, fn('クリア', () => { typed = ''; paint(); }), fire));
  pad.clear = () => { typed = ''; paint(); };
  pad.mark = () => {};
  pad.clearMarks = () => { typed = ''; paint(); };
  pad.disable = () => {};
  return pad;
}

// 穴うめ（証明）: 文の中の【ア】をタップ → 下の候補から選ぶ
// p.input = { kind: 'blanks', lines: ['…【ア】…'], blanks: [{ key: 'ア', options: [...], answer }] }
function blanksPad(p, onFire, fireLabel) {
  const bs = p.input.blanks;
  const pick = {};
  let cur = bs[0].key;
  const textBox = h('div', { class: 'bl-text' });
  const opts = h('div', { class: 'bl-opts' });
  const lineHTML = (line) => rich(line).replace(/【(.)】/g, (_, k) => {
    const b = bs.find((x) => x.key === k);
    if (!b) return `【${k}】`;
    const v = pick[k];
    return `<button type="button" class="bl-slot${k === cur ? ' on' : ''}${v != null ? ' filled' : ''}" data-k="${k}"><small>${k}</small>${v != null ? escHTML(b.options[v]) : '　　'}</button>`;
  });
  function paint() {
    textBox.innerHTML = p.input.lines.map((l) => `<div class="bl-line">${lineHTML(l)}</div>`).join('');
    textBox.querySelectorAll('.bl-slot').forEach((el) => el.addEventListener('click', () => { sfx('tap'); cur = el.dataset.k; paint(); }));
    const b = bs.find((x) => x.key === cur);
    opts.replaceChildren(h('div', { class: 'bl-q' }, `【${b.key}】に入るのは？`), ...b.options.map((o, i) => h('button', {
      class: `choice bl-opt${pick[b.key] === i ? ' picked' : ''}`,
      type: 'button',
      onclick: () => {
        sfx('tap');
        pick[b.key] = i;
        const next = bs.find((x) => pick[x.key] == null);
        if (next) cur = next.key;
        paint();
      },
    }, o)));
  }
  const fire = h('button', {
    class: 'key fire',
    type: 'button',
    onclick: () => {
      const miss = bs.find((x) => pick[x.key] == null);
      if (miss) { cur = miss.key; paint(); textBox.classList.remove('shake'); void textBox.offsetWidth; textBox.classList.add('shake'); return; }
      sfx('tap');
      onFire({ ...pick });
    },
  }, fireLabel);
  paint();
  const el = h('div', { class: 'pad blanks' }, textBox, opts, h('div', { class: 'bl-ctrl' }, fire));
  return {
    el,
    clear() { for (const k of Object.keys(pick)) delete pick[k]; cur = bs[0].key; paint(); },
    // 前に選んだ答えを入れておく（模試で見直すとき）
    fill(v) { Object.assign(pick, v || {}); paint(); },
    mark() {},
    clearMarks() {},
    disable() {},
  };
}
const escHTML = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// 解き方（ステップ）一覧
export function stepsView(p) {
  return h('ol', { class: 'steps' }, (p.steps || []).map((s) => h('li', { rich: s })));
}
export const answerLine = (p) => h('div', { class: 'answer-line', html: `答え: ${rich(p.answerText)}` });
