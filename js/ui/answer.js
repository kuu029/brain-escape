// 問題の表示と解答入力（選択肢 / 自前テンキー）。iPhone の標準キーボードは出さない
import { h } from '../core/ui.js';
import { tex, rich } from '../core/mathml.js';
import { sfx } from '../core/sound.js';

export function problemCard(p, { review = false, label = '' } = {}) {
  return h('div', { class: `qcard${review ? ' review' : ''}` },
    h('div', { class: 'qcard-tags' },
      review && h('span', { class: 'tag tag-review' }, '👻 再襲来'),
      p.source === 'past-exam' && h('span', { class: 'tag' }, `過去問 ${p.origin || ''}`),
      label && h('span', { class: 'tag tag-dim' }, label)),
    h('div', { class: 'qstem', rich: p.stem }));
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
export function answerPad(p, onSubmit) {
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

  if (p.input.kind === 'choice') {
    const grid = h('div', { class: `choices n${p.input.choices.length}` },
      p.input.choices.map((c, i) => h('button', { class: 'choice', type: 'button', onclick: () => { sfx('tap'); submit(i); } }, h('span', { class: 'math', html: tex(c) }))));
    root = h('div', { class: 'pad' }, grid);
    return {
      el: root,
      mark(i, ok) { grid.children[i]?.classList.add(ok ? 'right' : 'wrong'); },
      clearMarks() { [...grid.children].forEach((b) => b.classList.remove('wrong', 'right')); },
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
  }, '発射!');
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

// 解き方（ステップ）一覧
export function stepsView(p) {
  return h('ol', { class: 'steps' }, (p.steps || []).map((s) => h('li', { rich: s })));
}
export const answerLine = (p) => h('div', { class: 'answer-line', html: `答え: ${rich(p.answerText)}` });
