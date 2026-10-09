// 「あとで聞く」: 解説を読んでもわからなかった問題にチェックを付けて保存しておき、
// あとで家族や先生に質問できるようにする（記録画面の「❓ あとで聞く」にたまる）
//   問題は再生成ではなく「見た目のコピー」（問題文・図・答え・解き方）で保存する → 模試の問題でもそのまま見返せる
import { h, toast } from '../core/ui.js';
import { S, save, today } from '../core/store.js';
import { rich } from '../core/mathml.js';
import { sfx } from '../core/sound.js';

export const ASK_MAX = 60;
export const askList = () => (S().askLater ||= []);
const keyOf = (p) => (p.generatorId ? `${p.generatorId}:${p.seed}` : `t:${String(p.stem || '').slice(0, 80)}`);
export const isAsked = (p) => askList().some((x) => x.key === keyOf(p));

// p: 問題オブジェクト、from: どこで付けたか（'ウェーブ' / '模試' など）、intro: 大問の前置き（模試）
export function askBtn(p, from = '', intro = '') {
  const b = h('button', { class: 'ask-btn', type: 'button' });
  const paint = () => {
    const on = isAsked(p);
    b.classList.toggle('on', on);
    b.textContent = on ? '✅ あとで聞くリストに入れた' : '❓ わからない → あとで聞く';
  };
  b.onclick = (e) => {
    e.stopPropagation();
    sfx('tap');
    const list = askList();
    const k = keyOf(p);
    const i = list.findIndex((x) => x.key === k);
    if (i >= 0) list.splice(i, 1);
    else {
      list.unshift({ key: k, date: today(), from, unit: p.unit || null, intro: intro || null, stem: p.stem || '', fig: typeof p.fig === 'string' ? p.fig : null, answerText: p.answerText || '', steps: p.steps || [], hint: p.hint || '' });
      if (list.length > ASK_MAX) list.length = ASK_MAX;
      toast('❓ 記録の「あとで聞く」に保存したよ。おうちの人に聞いてみよう', 2200);
    }
    save();
    paint();
  };
  paint();
  return b;
}

// 記録画面に出す1件ぶん（タップで開く）。done: 「聞けた！」で消す
export function askItem(x, done) {
  return h('details', { class: 'wl-item ask-item' },
    h('summary', {}, h('small', { class: 'ask-meta' }, `${x.date.slice(5).replace('-', '/')} ${x.from || ''}`), h('span', { rich: x.stem })),
    x.intro && h('p', { class: 'note', rich: x.intro }),
    x.fig && h('div', { class: 'qfig', html: x.fig }),
    x.answerText && h('div', { class: 'answer-line', html: `答え: ${rich(x.answerText)}` }),
    x.steps.length > 0 && h('ol', { class: 'steps' }, x.steps.map((s) => h('li', { rich: s }))),
    x.hint && h('p', { class: 'note', rich: `💡 ${x.hint}` }),
    h('button', { class: 'btn ghost small', type: 'button', onclick: done }, '🙆 聞けた！（リストから消す）'));
}
