// 📮 要望ボックス: 弟さんが「おかしい・分からない・こうしてほしい・景品のこと」を、その場で送れる
//   送ると ① アプリの中にためる（おうちの人ページの「📮 届いた要望」）② 共有シートで LINE などに送る
//   いま見ていた画面・日時は自動でつく。「おかしい」のときは、最近のエラーもつく
//   feedback = [{ id, at, kind, text, where, err, status: 'new' | 'seen' | 'done' }]（新しい順・50件まで）
import { h, modal, toast } from '../core/ui.js';
import { S, saveNow } from '../core/store.js';
import { currentScreen, currentParams } from '../core/router.js';
import { UNIT } from '../units/registry.js';

export const FB_KINDS = {
  bug: '🐛 おかしい・動かない',
  confuse: '🤔 分からない',
  idea: '💡 こうしてほしい',
  prize: '🎁 景品・ごほうび',
};
const FB_MAX = 50;

// 最近のエラー（「おかしい」に自動でつける）
const errs = [];
if (globalThis.window?.addEventListener) {
  const keep = (msg) => { errs.push(`${new Date().toTimeString().slice(0, 5)} ${String(msg).slice(0, 160)}`); if (errs.length > 5) errs.shift(); };
  window.addEventListener('error', (e) => keep(`${e.message} @${(e.filename || '').split('/').pop()}:${e.lineno}`));
  window.addEventListener('unhandledrejection', (e) => keep(e.reason?.message || e.reason));
}

const SCREEN_JA = { home: 'ホーム', map: 'マップ', battle: 'ウェーブ', training: '訓練', result: '結果', memory: '暗号室', exam: '模試', collection: 'コレクション', records: '記録', settings: '設定', timeattack: 'タイムアタック', diagnosis: '看守チェック', parent: 'おうちの人ページ' };
const SUBJ = { math: '数学', english: '英語', japanese: '国語', science: '理科', social: '社会', en: '英単語', soc: '社会', sci: '理科', ja: '国語' };
const plain = (t) => String(t || '').replace(/<[^>]+>/g, '');

// いま見ている画面を、人が読める形で
export function whereNow() {
  const n = currentScreen();
  const p = currentParams();
  const u = UNIT[p.unit || p.unitId || p.focus];
  const parts = [SCREEN_JA[n] || n || '?'];
  if (p.mode) parts.push(p.mode);
  if (u) parts.push(plain(u.title));
  else if (p.subject) parts.push(SUBJ[p.subject] || p.subject);
  if (p.phase) parts.push(p.phase);
  if (p.tab) parts.push(p.tab);
  return parts.join('・');
}

const fmt = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
export function fbText(f) {
  return [`【ブレイン脱獄 📮】${FB_KINDS[f.kind]}`, f.text || '（ことばなし）', `画面: ${f.where}｜${fmt(f.at)}`, f.err ? `エラー: ${f.err}` : ''].filter(Boolean).join('\n');
}
export const fbList = () => (S().feedback ||= []);

// 要望を書く画面（where: いまの画面。省略すると自動）
export async function openFeedback(where = whereNow()) {
  let kind = null;
  const chips = h('div', { class: 'fb-kinds' });
  const paint = () => chips.replaceChildren(...Object.entries(FB_KINDS).map(([k, label]) => h('button', { class: `chip${kind === k ? ' on' : ''}`, type: 'button', onclick: () => { kind = k; paint(); } }, label)));
  paint();
  const ta = h('textarea', { class: 'mr-input fb-text', maxlength: '300', rows: '3', placeholder: 'どんなこと？（書かなくても送れる）' });
  const ok = await modal({
    title: '📮 要望・こまったこと',
    body: h('div', { class: 'modal-body' }, h('p', { class: 'note' }, 'えらんで送ると、おうちの人に届くよ。'), chips, ta, h('small', { class: 'note' }, `いまの画面（${where}）も いっしょに送る`)),
    buttons: [{ label: 'やめる', value: false }, { label: '📮 送る', value: true, cls: 'primary' }],
  });
  if (!ok) return null;
  if (!kind) { toast('どれか1つえらんでね'); return openFeedback(where); }
  const f = { id: `f${Date.now()}`, at: Date.now(), kind, text: ta.value.trim().slice(0, 300), where, err: kind === 'bug' && errs.length ? errs.join(' / ') : null, status: 'new' };
  const list = fbList();
  list.unshift(f);
  if (list.length > FB_MAX) list.length = FB_MAX;
  saveNow();
  // LINE などにも送る（共有シート）。使えなければ、アプリの中にためたことだけ知らせる
  const text = fbText(f);
  if (navigator.share) {
    try { await navigator.share({ text }); toast('📮 送ったよ。ありがとう！'); return f; } catch (e) { if (e?.name !== 'AbortError') { /* 下へ */ } }
  }
  toast('📮 おうちの人ページにとどけたよ。ありがとう！', 2200);
  return f;
}

// 小さな「📮」ボタン（問題の画面など）
export function fbBtn(cls = 'ghost small') {
  return h('button', { class: `btn ${cls} fb-open`, type: 'button', 'aria-label': '要望・こまったこと', onclick: (e) => { e.stopPropagation(); openFeedback(); } }, '📮');
}
