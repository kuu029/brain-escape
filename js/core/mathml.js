// 自前の数式表示（KaTeX なし・オフライン）。中学数学で使う範囲だけ:
// \frac{a}{b}  \sqrt{x}  x^{2}  \pm \times \div \sys{式1}{式2}  など
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);

const SYM = { pm: '±', mp: '∓', times: '×', div: '÷', cdot: '·', le: '≦', ge: '≧', ne: '≠', lt: '&lt;', gt: '&gt;', to: '→', square: '□', fallingdotseq: '≒', pi: 'π', circ: '°', angle: '∠', triangle: '△', parallel: '∥', perp: '⊥', equiv: '≡', sim: '∽', cdots: '…' };
const OP = new Set(['±', '∓', '×', '÷', '≦', '≧', '≠', '&lt;', '&gt;', '→', '=', '+', '−', '·', '≒', '∥', '⊥', '≡', '∽']);
const op = (c) => `<span class="mo">${c}</span>`;

function atom(c) {
  if (/[a-zA-Z]/.test(c)) return `<i>${c}</i>`;
  if (c === '-') return op('−');
  if (c === '+' || c === '=') return op(c);
  if (c === '<') return op('&lt;');
  if (c === '>') return op('&gt;');
  if (c === ' ') return '';
  if (c === ',') return ',<span class="msp"></span>';
  return esc(c);
}

function group(p) {
  while (p.s[p.i] === ' ') p.i++;
  if (p.s[p.i] === '{') {
    p.i++;
    const h = seq(p, '}');
    p.i++;
    return h;
  }
  if (p.s[p.i] === '\\') return seq(p, null, true);
  return atom(p.s[p.i++] ?? '');
}

function seq(p, stop, once = false) {
  let out = '';
  while (p.i < p.s.length && p.s[p.i] !== stop) {
    const c = p.s[p.i];
    if (c === '\\') {
      const mm = /^\\([a-zA-Z]+|.)/.exec(p.s.slice(p.i));
      p.i += mm[0].length;
      const name = mm[1];
      if (name === 'frac') {
        const a = group(p);
        const b = group(p);
        out += `<span class="mf"><span class="mn">${a}</span><span class="md">${b}</span></span>`;
      } else if (name === 'sqrt') {
        out += `<span class="msq"><span class="msr">√</span><span class="msa">${group(p)}</span></span>`;
      } else if (name === 'sys') {
        const a = group(p);
        const b = group(p);
        out += `<span class="msys"><span class="msys-row">${a}</span><span class="msys-row">${b}</span></span>`;
      } else if (name === 'quad') out += '<span class="mq"></span>';
      else if (name === ',' || name === ' ') out += '<span class="msp"></span>';
      else if (SYM[name]) out += OP.has(SYM[name]) ? op(SYM[name]) : SYM[name];
      else out += esc(name);
    } else if (c === '^' || c === '_') {
      p.i++;
      const g = group(p);
      out += c === '^' ? `<sup>${g}</sup>` : `<sub>${g}</sub>`;
    } else if (c === '{') {
      p.i++;
      out += seq(p, '}');
      p.i++;
    } else {
      p.i++;
      out += atom(c);
    }
    if (once) break;
  }
  return out;
}

export function tex(src) {
  return seq({ s: String(src), i: 0 }, null);
}

// 「文章 $数式$ 文章」→ HTML
export function rich(text) {
  return String(text ?? '')
    .split('$')
    .map((seg, i) => (i % 2 ? `<span class="math">${tex(seg)}</span>` : esc(seg).replace(/\n/g, '<br>')))
    .join('');
}
