// 🍬 景品タブ（コレクションの中）: ポイント・景品をたのむ・渡した（おうちの人）・解除券 → ポイント
import { h, btn, modal, toast, confirmBox, phrases } from '../core/ui.js';
import { S } from '../core/store.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';
import { REWARD, rewardTickets } from '../game/reward.js';
import * as P from '../game/points.js';

const redo = () => go('collection', { tab: 'prize' });
const md = (d) => d.slice(5).replace('-', '/');

// おうちの人の合言葉を確かめる（pt を決める欄つきにもできる）。戻り値: { ok, pt }
async function askParent(title, text, needPt = false) {
  const secret = S().settings.unlockSecret;
  if (!secret) { toast('先に 設定 → 「ごほうびの合言葉」を設定してね（おうちの人）', 2600); return { ok: false }; }
  const ptIn = needPt ? h('input', { class: 'mr-input', type: 'number', inputmode: 'numeric', min: '1', placeholder: '何pt？（1pt＝1円）' }) : null;
  const inp = h('input', { class: 'mr-input', type: 'password', autocomplete: 'off', placeholder: '合言葉' });
  const v = await modal({ title, body: h('div', { class: 'modal-body' }, h('p', { class: 'note' }, text), ptIn, inp), buttons: [{ label: 'やめる', value: false }, { label: 'OK', value: true, cls: 'primary' }] });
  if (!v) return { ok: false };
  if (inp.value.trim() !== secret) { toast('合言葉がちがう', 2000); return { ok: false }; }
  return { ok: true, pt: ptIn ? Number(ptIn.value) : null };
}

// たのんだら: ショートカットで「共有リマインダーに登録＋家族に iMessage」
async function sendReq(r) {
  sfx('coin');
  const v = await modal({
    title: '🍬 たのんだ！',
    body: h('div', { class: 'modal-body center' },
      h('b', {}, P.reqText(r)),
      h('p', { class: 'note' }, r.pt ? `${r.pt}pt は「予約中」。おうちの人が渡してくれたら消える（取り消すと戻る）` : '値段（pt）は、渡すときにおうちの人が決める'),
      h('small', { class: 'note' }, `下のボタンで、ショートカット「${P.SHORTCUT_NAME}」が 家族の「ほしいもの」リストに登録して、iMessage で知らせるよ`)),
    buttons: [{ label: 'あとで', value: false }, { label: '▶ 家族に知らせる', value: true, cls: 'primary' }],
  });
  if (v) location.href = P.shortcutUrl(r);
  redo();
}

export function prizeTab() {
  const p = P.pts();
  const free = P.free();
  const held = P.held();
  const T = rewardTickets();
  const convLeft = P.convLeft();
  const ask = async (it) => {
    if (free < it.pt) return toast(`ポイントが足りない（あと ${it.pt - free}pt）`);
    if (!(await confirmBox(`「${it.name}」をたのむ？`, `${it.pt}pt を予約する。家族に知らせが行くよ。`, 'たのむ', 'やめる'))) return;
    const r = P.request({ itemId: it.id });
    if (r) sendReq(r);
  };
  const askFree = async () => {
    const inp = h('input', { class: 'mr-input', type: 'text', maxlength: '30', placeholder: '例: ○○のグミ' });
    const v = await modal({ title: '✏️ ほかの欲しいもの', body: h('div', { class: 'modal-body' }, h('p', { class: 'note' }, 'リストにない物もたのめる。値段（pt）はおうちの人が決めるよ。'), inp), buttons: [{ label: 'やめる', value: false }, { label: 'たのむ', value: true, cls: 'primary' }] });
    if (!v) return;
    const r = P.request({ name: inp.value });
    if (!r) return toast('名前を書いてね');
    sendReq(r);
  };
  const hand = async (r) => {
    const a = await askParent('👪 渡した（おうちの人）', `「${r.name}」を渡しましたか？ ${r.pt ? `${r.pt}pt が消えます。` : '値段（pt）を入れてください。'}`, !r.pt);
    if (!a.ok) return;
    const cost = r.pt || a.pt;
    if (!(cost > 0)) return toast('pt を入れてください');
    if (P.pts().bal < cost) return toast(`ポイントが足りない（あと ${cost - P.pts().bal}pt）`, 2400);
    if (!P.handOver(r.id, cost)) return toast('できなかった');
    sfx('win');
    toast(`🍬 「${r.name}」 −${cost}pt`, 2200);
    redo();
  };
  const cancel = async (r) => {
    if (!(await confirmBox('取り消す？', `「${r.name}」をやめる。${r.pt ? `予約の ${r.pt}pt は戻るよ。` : ''}（リマインダーは手で消してね）`, '取り消す', 'やめない'))) return;
    P.cancelReq(r.id);
    redo();
  };
  const conv = async (id) => {
    const r = REWARD[id];
    if (!(await confirmBox(`${r.name}をポイントにする？`, `${r.name} 1枚 → 🍬 ${P.convPt(id)}pt（今週あと ${convLeft}分ぶんまで）`, 'する', 'やめる'))) return;
    const pt = P.convertTicket(id);
    if (!pt) return toast('できなかった');
    sfx('coin');
    toast(`🍬 +${pt}pt`);
    redo();
  };
  const wait = p.reqs.filter((r) => r.status === 'wait');
  const log = p.log.slice(-12).reverse();
  return h('div', { class: 'reward-box prize-box' },
    h('div', { class: 'pz-bal' },
      h('div', {}, h('small', {}, '🍬 景品ポイント'), h('b', {}, `${free}pt`), held > 0 && h('small', {}, `（ほかに予約中 ${held}pt）`)),
      h('div', { class: 'pz-week' }, h('small', {}, '今週たまった（勉強）'), h('b', {}, `${P.weekEarned()} / ${P.WEEK_CAP}pt`), h('span', { class: 'pz-bar' }, h('i', { style: { width: `${Math.min(100, (P.weekEarned() / P.WEEK_CAP) * 100)}%` } })), P.weekConvPt() > 0 && h('small', {}, `＋解除券から ${P.weekConvPt()}pt（上限とはべつ）`))),
    h('p', { class: 'note' }, 'リアルの景品（お菓子など）と交換できるポイント。1pt ＝ 1円くらい。くり返しでは増えない。本当に進んだときだけたまる。'),
    h('h3', { class: 'sec' }, '🛍 景品をたのむ'),
    p.catalog.length
      ? h('div', { class: 'rw-list' }, p.catalog.map((it) => h('div', { class: 'rw-row' }, h('span', { class: 'rw-em' }, '🍬'), h('div', {}, h('b', {}, it.name), h('small', {}, `${it.pt}pt`)), btn('たのむ', () => ask(it), `small ${free >= it.pt ? 'primary' : 'ghost'}`))))
      : h('p', { class: 'note' }, '景品リストはまだ空っぽ。おうちの人が「設定 → おうちの人ページ」で登録してくれるよ'),
    btn('✏️ ほかの欲しいものをたのむ', askFree, 'ghost small'),
    wait.length > 0 && h('h3', { class: 'sec' }, '⏳ たのんでいるもの'),
    wait.length > 0 && h('div', { class: 'rw-list' }, wait.map((r) => h('div', { class: 'rw-row pz-req' },
      h('div', {}, h('b', {}, r.name), h('small', {}, `受付#${r.no}・${md(r.date)}・${r.pt ? `${r.pt}pt 予約中` : '値段はおうちの人が決める'}`)),
      h('div', { class: 'pz-btns' },
        btn('👪 渡した', () => hand(r), 'small primary'),
        btn('📨 知らせる', () => { location.href = P.shortcutUrl(r); }, 'small ghost'),
        btn('取消', () => cancel(r), 'small ghost'))))),
    h('h3', { class: 'sec' }, '🌈 使わなかった解除券 → ポイント'),
    h('p', { class: 'note' }, ...phrases(`スマホをがまんした分はお菓子に！ 15分 → ${P.convPt('u15')}pt。 1週間で ${P.CONV_MIN}分ぶんまで（今週あと ${convLeft}分）`)),
    h('div', { class: 'gacha-btns pz-conv' }, Object.entries(REWARD).map(([id, r]) => btn(h('span', {}, ...phrases(`${r.min}分券 → ${P.convPt(id)}pt（持っている ${T[id] || 0}枚）`)), () => conv(id), `small ${(T[id] || 0) > 0 && r.min <= convLeft ? 'primary' : 'ghost'}`))),
    h('h3', { class: 'sec' }, '📈 たまり方（1週間で最大 500pt）'),
    h('div', { class: 'pz-how' }, [
      ['今週の計画の1単元を達成', P.PT.planItem], ['今週の計画を全部達成', P.PT.planAll],
      [`まだ倒していない（全部倒したら1週間倒していない）ボスを撃破・週${P.BOSS_WEEK}体まで`, P.PT.boss],
      ['暗号の顔合わせノルマを終えた日（全部見終わったら、復習を全部終えた日）', P.PT.memDay],
      ['模試で前回より点が上がった', P.PT.exam], ['7日連続で勉強', P.PT.streak],
    ].map(([t, n]) => h('div', {}, h('span', {}, t), h('b', {}, `${n}pt`)))),
    log.length > 0 && h('h3', { class: 'sec' }, '📜 ポイントの記録'),
    log.length > 0 && h('div', { class: 'rw-log' }, log.map((e) => h('div', {}, `${md(e.date)}　${e.pt > 0 ? '+' : ''}${e.pt}pt　${e.label}`))));
}
