// 📓 ノート・ワークチェック: 勉強したノートや学校のワーク（紙）を家族に見せると、家族が合言葉を入れて、好きなごほうびをえらんであげられる
//   ノートを書くことをすすめるためのしくみ。ごほうびの中身と量は家族が決める（上限なし・2時間の💎上限にもかけない）
//   notes = [{ at, give: [{ id, n }], comment }]（新しい順・60件まで）
import { h, btn, modal, toast } from '../core/ui.js';
import { S, saveNow } from '../core/store.js';
import { sfx } from '../core/sound.js';
import { logGems } from '../game/gemlog.js';
import { grantPt } from '../game/points.js';
import { addSavings } from '../game/nextstep.js';
import { rewardState } from '../game/reward.js';
import { gachaTickets } from '../game/progress.js';

// えらべるごほうび（1回のタップで1つぶん。何回もタップすると、ふえる）
export const NOTE_GIFTS = [
  { id: 'yen', em: '🎓', name: '合格貯金', step: 100, unit: '円' },
  { id: 'gem', em: '💎', name: 'ダイヤ', step: 30, unit: '' },
  { id: 'pt', em: '🍬', name: '景品pt', step: 10, unit: 'pt' },
  { id: 'gtix', em: '🎟', name: 'ガチャ券', step: 1, unit: '枚' },
  { id: 'rgt', em: '🎫', name: 'ごほうびガチャ', step: 1, unit: '枚' },
  { id: 'u15', em: '🌈', name: '15分解除券', step: 1, unit: '枚' },
];
const GIFT = Object.fromEntries(NOTE_GIFTS.map((g) => [g.id, g]));
export const giftText = (give) => give.map((x) => `${GIFT[x.id].em}${x.id === 'gem' ? '' : GIFT[x.id].name} +${x.n}${GIFT[x.id].unit}`).join('・');

export const noteList = () => (S().notes ||= []);
export const noteWeek = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0, 0, 0, 0); return noteList().filter((x) => x.at >= d.getTime()).length; };

// ごほうびを入れる
export function giveNote(give, comment = '') {
  const s = S();
  for (const x of give) {
    if (!(x.n > 0)) continue;
    if (x.id === 'gem') { s.gems += x.n; logGems('note', x.n); }
    else if (x.id === 'pt') grantPt('note', x.n, '📓 ノート・ワークチェック');
    else if (x.id === 'yen') x.n = addSavings(x.n, '📓 ノート・ワークチェック'); // 上限をこえた分は入らない
    else if (x.id === 'gtix') s.collection.gachaTickets = gachaTickets() + x.n;
    else if (x.id === 'rgt') rewardState().gtix += x.n;
    else if (x.id === 'u15') rewardState().tix.u15 = (rewardState().tix.u15 || 0) + x.n;
  }
  const rec = { at: Date.now(), give: give.filter((x) => x.n > 0), comment: String(comment).trim().slice(0, 100) };
  const list = noteList();
  list.unshift(rec);
  if (list.length > 60) list.length = 60;
  saveNow();
  return rec;
}

// 弟さんが押す →（説明）→ 家族が合言葉 → ごほうびをえらぶ → 弟さんに見せる
export async function openNoteCheck(onDone) {
  const secret = S().settings.unlockSecret;
  const go1 = await modal({
    title: '📓 ノート・ワークを見せる',
    body: h('div', { class: 'modal-body' },
      h('p', {}, '今日勉強したノートや学校のワークを、家族に見せよう！'),
      h('p', { class: 'note' }, 'まちがえた問題を書き直したり、解き方を自分のことばでまとめたりしてあると、ごほうびが多くなるかも。'),
      h('small', { class: 'note' }, `ごほうびは家族がえらぶよ。今週 ${noteWeek()}回見せた`),
      !secret && h('p', { class: 'warn-text' }, '（おうちの人へ: 先に 設定 →「ごほうびの合言葉」を設定してください）')),
    buttons: [{ label: 'やめる', value: false }, { label: '👪 家族に見せた', value: true, cls: 'primary' }],
  });
  if (!go1 || !secret) return;
  // おうちの人: 合言葉 ＋ ごほうびをえらぶ
  const cnt = Object.fromEntries(NOTE_GIFTS.map((g) => [g.id, 0]));
  const rows = h('div', { class: 'nc-gifts' });
  const paint = () => rows.replaceChildren(...NOTE_GIFTS.map((g) => h('div', { class: 'nc-row' },
    h('span', {}, `${g.em} ${g.name}`),
    btn('−', () => { cnt[g.id] = Math.max(0, cnt[g.id] - g.step); paint(); }, 'ghost small'),
    h('b', {}, `${cnt[g.id]}${g.unit}`),
    btn(`＋${g.step}`, () => { cnt[g.id] += g.step; paint(); }, 'ghost small'))));
  paint();
  const cm = h('input', { class: 'mr-input', type: 'text', maxlength: '100', placeholder: 'ひとこと（例: 図がていねい）' });
  const pw = h('input', { class: 'mr-input', type: 'password', autocomplete: 'off', placeholder: '合言葉' });
  const ok = await modal({
    title: '👪 ごほうびをえらぶ',
    body: h('div', { class: 'modal-body' }, h('p', { class: 'note' }, '（おうちの人へ）ノートやワークを見て、ごほうびを好きなだけえらんでください。🎓 合格貯金もふやせます。ほめるだけ（0）でもOK。'), rows, cm, pw),
    buttons: [{ label: 'やめる', value: false }, { label: 'あげる', value: true, cls: 'primary' }],
  });
  if (!ok) return;
  if (pw.value.trim() !== secret) { toast('合言葉がちがう', 2000); return; }
  const give = NOTE_GIFTS.map((g) => ({ id: g.id, n: cnt[g.id] })).filter((x) => x.n > 0);
  const rec = giveNote(give, cm.value);
  sfx('win');
  await modal({
    title: '📓 ノート・ワークチェック クリア！',
    body: h('div', { class: 'modal-body center' },
      h('div', { class: 'big-em' }, '🏅'),
      rec.comment && h('p', { class: 'nc-comment' }, `「${rec.comment}」`),
      h('p', {}, h('b', {}, give.length ? giftText(give) : 'ほめてもらった！')),
      h('small', { class: 'note' }, 'また見せてね')),
    buttons: [{ label: 'やった！', value: true, cls: 'primary' }],
  });
  onDone?.();
}
