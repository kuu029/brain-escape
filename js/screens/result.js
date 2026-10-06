// 結果画面: 正答率・報酬・復習行きの問題
import { h, btn } from '../core/ui.js';
import { UNIT, makeProblem } from '../units/registry.js';
import { CARDS } from '../game/content.js';
import { go } from '../core/router.js';
import { canBoss } from '../game/progress.js';
import { answerLine } from '../ui/answer.js';

export function render(el, r) {
  const u = r.unitId ? UNIT[r.unitId] : null;
  const rate = r.asked ? Math.round((r.firstCorrect / r.asked) * 100) : 0;
  const head = r.win
    ? (r.mode === 'boss' ? { em: '👑', t: 'ボス撃破！', s: '扉のロックが外れた…！' } : { em: '🎉', t: 'ウェーブ突破！', s: r.leaks === 0 ? 'ノーダメージ！ 完ぺき。' : 'ナイス脱獄ムーブ。' })
    : { em: '💫', t: 'つかまった…', s: 'でも記録とコインは残ってる。すぐリベンジできるぞ。' };
  const cards = r.cards.map((id) => CARDS.find((c) => c.id === id)).filter(Boolean);
  const wrong = r.wrongList.map((w) => makeProblem(w.generatorId, w.seed)).filter(Boolean);
  const again = () => go('battle', { mode: r.mode, unit: r.unitId });

  el.append(h('div', { class: `result ${r.win ? 'win' : 'lose'}` },
    h('div', { class: 'big-em' }, head.em),
    h('h2', {}, head.t),
    h('p', {}, head.s),
    h('div', { class: 'stats' },
      h('div', {}, h('b', {}, `${rate}%`), h('small', {}, `正答率（${r.firstCorrect}/${r.asked}）`)),
      h('div', {}, h('b', {}, `💎${r.gems}`), h('small', {}, 'ゲット')),
      h('div', {}, h('b', {}, `🔥${r.maxCombo}`), h('small', {}, '最大コンボ'))),
    cards.length > 0 && h('div', { class: 'new-cards' }, h('h3', { class: 'sec' }, '🃏 新カード！'), cards.map((c) => h('div', { class: `card r${c.rarity}` }, h('div', { class: 'c-em' }, c.emoji), h('div', { class: 'c-name' }, c.name)))),
    r.opened.length > 0 && h('div', { class: 'opened' }, h('h3', { class: 'sec' }, '🚪 新しいエリアが開いた！'), r.opened.map((id) => h('div', {}, `${UNIT[id].emoji} ${UNIT[id].area}｜${UNIT[id].title}`))),
    wrong.length > 0 && h('div', { class: 'wrong-list' },
      h('h3', { class: 'sec' }, `👻 再襲来リスト（${wrong.length}問）`),
      h('p', { class: 'note' }, 'まちがえた問題は、あとのウェーブに「リベンジおばけ」として戻ってくる。2回正解で成仏。'),
      wrong.map((p) => h('details', { class: 'wl-item' }, h('summary', { rich: p.stem }), answerLine(p)))),
    h('div', { class: 'up-btns' },
      btn(r.win ? 'もう1回' : 'リベンジ！', again, 'primary big'),
      r.mode === 'practice' && r.unitId && canBoss(r.unitId) && btn('👑 ボスウェーブへ', () => go('battle', { mode: 'boss', unit: r.unitId }), 'boss'),
      btn('マップへ', () => go('map', { focus: r.unitId }), 'ghost')),
    u && h('p', { class: 'note center' }, `${u.emoji} ${u.title}`)));
}
