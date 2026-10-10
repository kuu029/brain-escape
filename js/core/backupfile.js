// バックアップの保存（ファイル・文字）と、「そろそろバックアップ」のお知らせ
//   記録は iPhone の Safari の中にしかないので、機種変更やデータ削除にそなえて週に1回ファイルに保存してもらう
import { h, modal, toast } from './ui.js';
import { S, save, exportText, today } from './store.js';

export const BACKUP_DAYS = 7;
const DAY = 86400000;
const mark = () => { S().lastBackup = Date.now(); save(); };

// 前回のバックアップから何日か（一度もなければ null）
export const backupAge = (now = Date.now()) => (S().lastBackup ? Math.floor((now - S().lastBackup) / DAY) : null);
// お知らせを出すか: 少し遊んでいて（30問以上）、7日以上バックアップしていない。「あとで」を押した日は出さない
export function backupDue(now = Date.now()) {
  const s = S();
  if ((s.stats?.asked || 0) < 30 || s.backupSnooze === today(new Date(now))) return false;
  const age = backupAge(now);
  return age === null || age >= BACKUP_DAYS;
}
export function snoozeBackup() { S().backupSnooze = today(); save(); }

// ファイルに保存。iPhone は共有シート →「"ファイル"に保存」が確実。保存できたら true
export async function saveBackupFile() {
  const text = exportText();
  const name = `brain-escape-backup-${today()}.json`;
  const file = new File([text], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'ブレイン脱獄 バックアップ' });
      mark();
      return true;
    } catch (e) {
      if (e && e.name === 'AbortError') return false;
    }
  }
  const url = URL.createObjectURL(file);
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  mark();
  return true;
}

export async function copyBackupText() {
  const text = exportText();
  try {
    await navigator.clipboard.writeText(text);
    mark();
    toast('コピーした！ メモアプリなどに貼りつけて保存してね', 2600);
  } catch {
    const ta = h('textarea', { class: 'backup-text', readonly: true });
    ta.value = text;
    await modal({ title: 'この文字を全部コピーして保存', body: h('div', {}, ta, h('p', { class: 'note' }, '長押し →「すべてを選択」→「コピー」')) });
    mark();
  }
}
