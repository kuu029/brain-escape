// 設定: 音、ニックネーム、バックアップ（ファイル/文字列）、データ初期化
import { h, btn, modal, toast, confirmBox } from '../core/ui.js';
import { S, save, exportText, importText, resetAll, today } from '../core/store.js';
import { go } from '../core/router.js';
import { topBar } from './home.js';

async function saveFile() {
  const text = exportText();
  const name = `brain-escape-backup-${today()}.json`;
  const file = new File([text], name, { type: 'application/json' });
  // iPhone は共有シート →「"ファイル"に保存」が確実
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'ブレイン脱獄 バックアップ' });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function copyText() {
  const text = exportText();
  try {
    await navigator.clipboard.writeText(text);
    toast('コピーした！ メモアプリなどに貼りつけて保存してね', 2600);
  } catch {
    const ta = h('textarea', { class: 'backup-text', readonly: true });
    ta.value = text;
    await modal({ title: 'この文字を全部コピーして保存', body: h('div', {}, ta, h('p', { class: 'note' }, '長押し →「すべてを選択」→「コピー」')) });
  }
}

async function restore(text) {
  const ok = await confirmBox('バックアップから復元する？', 'いまのデータは上書きされるよ。', '復元する', 'やめる', true);
  if (!ok) return;
  const r = importText(text);
  if (r.ok) {
    await modal({ title: '復元できた！', body: `おかえり、${S().nickname}。` });
    go('home');
  } else modal({ title: '復元できなかった', body: r.error });
}

export function render(el) {
  const s = S();
  const sound = h('button', { class: `toggle ${s.settings.sound ? 'on' : ''}`, type: 'button', role: 'switch', 'aria-checked': String(!!s.settings.sound), onclick: () => { s.settings.sound = !s.settings.sound; save(); go('settings'); } }, s.settings.sound ? '🔊 ON' : '🔇 OFF');
  const fileIn = h('input', { type: 'file', accept: '.json,application/json,text/plain', class: 'hidden' });
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files?.[0];
    if (f) restore(await f.text());
    fileIn.value = '';
  });
  const pasteBox = async () => {
    const ta = h('textarea', { class: 'backup-text', placeholder: 'ここにバックアップの文字を貼りつけ' });
    const v = await modal({ title: '文字から復元', body: h('div', {}, ta), buttons: [{ label: 'やめる', value: null }, { label: '復元', value: 'go', cls: 'primary' }] });
    if (v === 'go') restore(ta.value);
  };
  const rename = async () => {
    const inp = h('input', { class: 'name-input', type: 'text', maxlength: '10' });
    inp.value = s.nickname;
    const v = await modal({ title: 'ニックネーム変更', body: h('div', {}, inp), buttons: [{ label: 'やめる', value: null }, { label: '決定', value: 'ok', cls: 'primary' }] });
    if (v === 'ok' && inp.value.trim()) { s.nickname = inp.value.trim().slice(0, 10); save(); go('settings'); }
  };
  const reset = async () => {
    if (!(await confirmBox('データを全部消す？', 'カード・記録・進み具合が全部消えるよ。先にバックアップをおすすめ。', '消す', 'やめる', true))) return;
    if (!(await confirmBox('ほんとうに？', 'もとに戻せません。', 'ほんとうに消す', 'やめる', true))) return;
    resetAll();
    go('onboarding', { step: 'title' });
  };

  el.append(topBar(() => go('home')),
    h('div', { class: 'settings' },
      h('section', { class: 'set-row' }, h('span', {}, '効果音'), sound),
      h('section', { class: 'set-row' }, h('span', {}, '盤面の演出スピード'),
        h('button', { class: `toggle ${s.settings.fxFast ? 'on' : ''}`, type: 'button', onclick: () => { s.settings.fxFast = !s.settings.fxFast; save(); go('settings'); } }, s.settings.fxFast ? '⚡ はやい' : '🐢 ふつう')),
      h('section', { class: 'set-row' }, h('span', {}, `ニックネーム: ${s.nickname}`), btn('変更', rename, 'small')),
      h('h3', { class: 'sec' }, '💾 バックアップ'),
      h('p', { class: 'note' }, 'データはこのスマホの中だけに保存されている。Safari の履歴・Webサイトデータを消すと消えちゃうので、ときどきバックアップしておこう。'),
      h('div', { class: 'up-btns' },
        btn('📄 ファイルに保存', saveFile, 'primary'),
        btn('📋 文字でコピー', copyText, 'ghost'),
        btn('📂 ファイルから復元', () => fileIn.click(), 'ghost'),
        btn('📝 文字から復元', pasteBox, 'ghost')),
      fileIn,
      h('h3', { class: 'sec' }, 'そのほか'),
      h('div', { class: 'up-btns' },
        btn('🔦 看守チェック（診断）をやり直す', () => go('diagnosis', { phase: 'intro' }), 'ghost'),
        btn('📜 オープニングをもう一度', () => go('onboarding', { step: 'story', i: 0 }), 'ghost'),
        btn('🗑️ データを初期化', reset, 'danger')),
      h('p', { class: 'note center' }, 'ブレイン脱獄 v1 ｜ 外部への送信は一切なし・オフラインで動作')));
}
