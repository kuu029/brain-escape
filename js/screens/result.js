// 結果画面: ランク・正答率・報酬・新しく開いたエリア・復習行きの問題
import { h, btn, holdBtn } from '../core/ui.js';
import { UNIT, makeProblem } from '../units/registry.js';
import { CARDS, BOSSES } from '../game/content.js';
import { go } from '../core/router.js';
import { canBoss } from '../game/progress.js';
import { answerLine } from '../ui/answer.js';
import { cardSprite, spriteHTML } from '../game/art.js';
import { backdrop, confetti } from '../ui/deco.js';
import { sfx } from '../core/sound.js';

// 数字がカチカチ増えていく表示
function countUp(to, fmt, delay) {
  const b = h('b', { class: 'count' }, fmt(0));
  const steps = Math.min(Math.max(to, 1), 20);
  setTimeout(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      b.textContent = fmt(Math.round((to * i) / steps));
      sfx('count');
      if (i >= steps) {
        clearInterval(t);
        b.classList.add('done');
      }
    }, 30);
  }, delay + 300);
  return b;
}

// ランク（勝ったときだけ）: S = ほぼ全問正解でノーダメージ
export function rankOf(r) {
  if (!r.win) return null;
  const rate = r.asked ? r.firstCorrect / r.asked : 0;
  if (rate >= 0.9 && r.leaks === 0) return 'S';
  if (rate >= 0.75) return 'A';
  return 'B';
}
const RANK_TEXT = { S: 'パーフェクト脱獄！', A: 'いい脱獄だった！', B: 'なんとか脱獄！' };

export function render(el, r) {
  const u = r.unitId ? UNIT[r.unitId] : null;
  const rate = r.asked ? Math.round((r.firstCorrect / r.asked) * 100) : 0;
  const rank = rankOf(r);
  const boss = u && BOSSES[u.id];
  const head = r.win
    ? (r.mode === 'boss' ? { t: 'ボス撃破！', s: '扉のロックが外れた…！' } : { t: 'ウェーブ突破！', s: r.leaks === 0 ? 'ノーダメージ！ 完ぺき。' : 'ナイス脱獄ムーブ。' })
    : { t: 'つかまった…', s: 'でも記録とコインは残ってる。すぐリベンジできるぞ。' };
  const cards = r.cards.map((id) => CARDS.find((c) => c.id === id)).filter(Boolean);
  const wrong = r.wrongList.map((w) => makeProblem(w.generatorId, w.seed)).filter(Boolean);
  const again = () => go('battle', { mode: r.mode, unit: r.unitId, subject: r.subject });

  backdrop(el, r.win ? 'win' : 'lose');
  // 主役: その単元のボス（ボス戦なら「撃破」のハンコ）／復習なら おばけ
  const face = u
    ? spriteHTML(`boss-${u.id}`, boss?.emoji || u.emoji, boss?.name || u.title)
    : spriteHTML('enemy-review', '👻', 'リベンジおばけ');
  const hero = h('div', { class: `rs-hero ${r.win ? 'win' : 'lose'}` },
    h('div', { class: 'rs-face', html: face }),
    r.win && r.mode === 'boss' && h('span', { class: 'rs-stamp' }, '撃破'),
    !r.win && h('span', { class: 'rs-stamp lose' }, '再挑戦'),
    rank && h('div', { class: `rs-rank rank-${rank}` }, h('small', {}, 'RANK'), h('b', {}, rank)));

  el.append(h('div', { class: `result ${r.win ? 'win' : 'lose'}` },
    r.win && confetti(),
    hero,
    h('h2', {}, head.t),
    h('p', { class: 'rs-sub' }, rank ? `${RANK_TEXT[rank]} ${head.s}` : head.s),
    h('div', { class: 'stats tickets' },
      h('div', {}, countUp(rate, (v) => `${v}%`, 0), h('small', {}, `正答率（${r.firstCorrect}/${r.asked}）`)),
      h('div', {}, countUp(r.gems, (v) => `💎${v}`, 450), h('small', {}, 'ゲット')),
      h('div', {}, countUp(r.maxCombo, (v) => `🔥${v}`, 900), h('small', {}, '最大コンボ'))),
    cards.length > 0 && h('div', { class: 'new-cards' }, h('h3', { class: 'sec' }, '🃏 新カード！'), cards.map((c) => h('div', { class: `card r${c.rarity} flip-in` }, h('div', { class: 'c-art', html: cardSprite(c.id) }), h('div', { class: 'c-name' }, c.name)))),
    r.opened.length > 0 && h('div', { class: 'opened' }, h('h3', { class: 'sec' }, '🚪 新しいエリアが開いた！'), r.opened.map((id) => h('div', { class: 'op-row' }, h('span', { class: 'op-face', html: spriteHTML(`boss-${id}`, BOSSES[id]?.emoji || UNIT[id].emoji, '') }), h('span', { class: 'op-text' }, h('small', {}, UNIT[id].area), h('b', {}, UNIT[id].title))))),
    wrong.length > 0 && h('div', { class: 'wrong-list' },
      h('h3', { class: 'sec' }, `👻 再襲来リスト（${wrong.length}問）`),
      h('p', { class: 'note' }, 'まちがえた問題は、あとのウェーブに「リベンジおばけ」として戻ってくる。2回正解で成仏。'),
      wrong.map((p) => h('details', { class: 'wl-item' }, h('summary', { rich: p.stem }), answerLine(p)))),
    h('div', { class: 'up-btns' },
      holdBtn(r.win ? 'もう1回' : 'リベンジ！', again, 'primary big'),
      r.mode === 'practice' && r.unitId && canBoss(r.unitId) && btn('👑 ボスウェーブへ', () => go('battle', { mode: 'boss', unit: r.unitId }), 'boss'),
      btn('マップへ', () => go('map', { focus: r.unitId, subject: r.subject }), 'ghost')),
    u && h('p', { class: 'note center' }, `${u.area}｜${u.title}`)));
}
