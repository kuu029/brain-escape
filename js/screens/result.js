// 結果画面: ランク・正答率・報酬・新しく開いたエリア・復習行きの問題
import { h, btn, phrases } from '../core/ui.js';
import { UNIT, makeProblem } from '../units/registry.js';
import { CARDS, BOSSES } from '../game/content.js';
import { go } from '../core/router.js';
import { canBoss, BOSS_GAP } from '../game/progress.js';
import { answerLine } from '../ui/answer.js';
import { askBtn } from '../ui/asklater.js';
import { cardSprite, spriteHTML } from '../game/art.js';
import { backdrop, confetti } from '../ui/deco.js';
import { sfx } from '../core/sound.js';
import { topBar } from './home.js';
import { unitNext } from './map.js';
import { flyGems } from '../ui/gems.js';
import { poolInfo } from '../game/pool.js';
import { capText } from '../game/gemcap.js';
import { yen } from '../game/nextstep.js';

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
  const nx = r.win && u && r.mode !== 'review' ? unitNext(u.id).cta : null;
  const nextCta = nx && !(nx.to[0] === 'battle' && nx.to[1].mode === r.mode) ? nx : null;

  backdrop(el, r.win ? 'win' : 'lose');
  el.append(topBar(() => go('map', { focus: r.unitId, subject: r.subject })));
  const pooled = r.pool?.pooled || 0;
  const gemStat = pooled > 0
    ? h('div', { class: 'gs-pool' }, countUp(pooled, (v) => `🔒${v}`, 450), h('small', {}, '💎 保留へ'))
    : h('div', {}, countUp(r.gems, (v) => `💎${v}`, 450), h('small', {}, 'ゲット'));
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
    bonusChips(r.bonus),
    poolNote(r.pool),
    r.next && h('div', { class: 'pool-note got' }, h('b', {}, `🎯 次の一手クリア！（今日 ${r.next.n}つ目）`), h('span', {}, r.next.yen ? `🎓 合格貯金 +${yen(r.next.yen)}${r.next.week ? `（7日つづけたボーナス ${yen(r.next.week)} こみ）` : ''}　いま ${yen(r.next.bal)}` : `🎓 合格貯金 いま ${yen(r.next.bal)}（今日の分はもうたまった）`), r.next.n === 1 && h('small', {}, '🔓 ほかのモードも自由にえらべるようになった')),
    r.repeat && r.repeat.mult < 1 && h('p', { class: 'note center rs-repeat' }, ...phrases(r.repeat.mult === 0 ? `🔁 今日この単元 ${r.repeat.n}回目 → 💎は入らない（ちがう単元や「次の一手」なら入る。明日またもどる）` : `🔁 今日この単元 ${r.repeat.n}回目 → 💎×${r.repeat.mult}（ちがう単元なら満額。明日またもどる）`)),
    h('p', { class: 'rs-sub' }, rank ? `${RANK_TEXT[rank]} ${head.s}` : head.s),
    h('div', { class: 'stats tickets' },
      h('div', {}, countUp(rate, (v) => `${v}%`, 0), h('small', {}, `正答率（${r.firstCorrect}/${r.asked}）`)),
      gemStat,
      h('div', {}, countUp(r.maxCombo, (v) => `⚡${v}`, 900), h('small', {}, '最大コンボ'))),
    (r.drops || []).length > 0 && h('div', { class: 'drop-list' }, h('h3', { class: 'sec' }, '🎁 ドロップ！'), r.drops.map((d) => h('span', { class: `bonus-chip drop${d.startsWith('card:') ? ' rare' : ''}` }, d === 'coins' ? '💰 へそくり ×1' : d === 'ticket' ? '🎟 ガチャ券 ×1' : d === 'rgt' ? '🎫 ごほうびガチャ券 ×1' : `🃏 レア！ ボスカード「${CARDS.find((c) => c.id === d.slice(5))?.name}」（召喚チケット +1）`))),
    r.bossTix && h('p', { class: 'note center' }, `🃏 ボスカード「${CARDS.find((c) => c.id === r.bossTix)?.name}」（召喚チケット +1）`),
    r.cardWait && h('p', { class: 'note center' }, ...phrases(`🃏 「${CARDS.find((c) => c.id === r.cardWait)?.name}」のカードは、ほかのボスを${BOSS_GAP}体たおすと またもらえる`)),
    cards.length > 0 && h('div', { class: 'new-cards' }, h('h3', { class: 'sec' }, '🃏 新カード！'), cards.map((c) => h('div', { class: `card r${c.rarity} flip-in` }, h('div', { class: 'c-art', html: cardSprite(c.id) }), h('div', { class: 'c-name' }, c.name)))),
    r.opened.length > 0 && h('div', { class: 'opened' }, h('h3', { class: 'sec' }, '🚪 新しいエリアが開いた！'), r.opened.map((id) => h('div', { class: 'op-row' }, h('span', { class: 'op-face', html: spriteHTML(`boss-${id}`, BOSSES[id]?.emoji || UNIT[id].emoji, '') }), h('span', { class: 'op-text' }, h('small', {}, UNIT[id].area), h('b', {}, UNIT[id].title))))),
    wrong.length > 0 && h('div', { class: 'wrong-list' },
      h('h3', { class: 'sec' }, `👻 リベンジリスト（${wrong.length}問）`),
      h('p', { class: 'note' }, 'まちがえた問題は、あとのウェーブに「リベンジおばけ」として戻ってくる。2回正解で成仏。'),
      wrong.map((p) => h('details', { class: 'wl-item' }, h('summary', { rich: p.stem }), answerLine(p), h('ol', { class: 'steps' }, (p.steps || []).map((s) => h('li', { rich: s }))), askBtn(p, 'ウェーブ')))),
    h('div', { class: 'up-btns' },
      // 勝ったら、単元シートの「次はこれ」と同じ行き先を主役に（同じウェーブのくり返しなら「もう1回」）
      nextCta ? btn(h('span', { class: 'cta-in' }, h('small', {}, nextCta.small), h('span', { html: nextCta.label })), () => go(...nextCta.to), `${nextCta.cls} big`) : btn(r.win ? 'もう1回' : 'リベンジ！', again, 'primary big'),
      nextCta && btn('もう1回', again, 'ghost'),
      !nextCta && r.mode === 'practice' && r.unitId && canBoss(r.unitId) && btn('👑 ボスウェーブへ', () => go('battle', { mode: 'boss', unit: r.unitId }), 'boss'),
      btn('マップへ', () => go('map', { focus: r.unitId, subject: r.subject }), 'ghost')),
    u && h('p', { class: 'note center' }, `${u.area}｜${u.title}`)));
  flyGems(r.gems + (r.pool?.released || 0) + (r.bonus?.gems || 0), gemStat, 1300);
}

const howLine = (how) => h('small', {}, '👉 ', ...how.map((t) => h('span', { class: 'nb' }, t)));

// 棟・暗号室の上に出す: いま保留がかかっているか・いくらたまっているか・どうすれば受け取れるか
export function poolBanner(key) {
  const pi = poolInfo(key);
  if (!pi.gated) return '';
  return h('div', { class: 'pool-note' },
    h('b', {}, h('span', { class: 'nb' }, `🔒 ${pi.name}の保留 `), h('span', { class: 'nb' }, `💎${pi.gems}`)),
    howLine(pi.how),
    pi.gems === 0 && h('small', { class: 'pn-sub' }, 'ここでかせいだ💎は、いったんプールにたまる'));
}

// 保留プールのお知らせ: 受け取った／プールに入った（いくらたまっているか・どうすれば受け取れるか）
export function poolNote(pr) {
  const capEl = pr?.cut > 0 ? h('div', { class: 'pool-note cap' }, h('small', {}, ...phrases(capText(pr.cut)))) : '';
  const main = poolNote0(pr);
  return capEl && main ? h('div', {}, capEl, main) : capEl || main;
}
function poolNote0(pr) {
  if (!pr || (!pr.pooled && !pr.released)) return '';
  const info = poolInfo(pr.key);
  if (pr.released) return h('div', { class: 'pool-note got' }, h('b', {}, `🔓 ${info.name}の保留 💎${pr.released} を受け取った！`), pr.pooled > 0 && h('small', {}, `（今回の 💎${pr.pooled} もふくむ）`));
  return h('div', { class: 'pool-note' },
    h('b', {}, `🔒 💎+${pr.pooled} は${info.name}のプールへ`),
    h('span', {}, `いま 💎${pr.total} 保留中`),
    howLine(info.how));
}

// 習慣ボーナス（2時間ボーナス・はじめての模試）の表示
export const bonusChips = (b) => b?.items?.length > 0 && h('div', { class: 'bonus-list' }, b.items.map((x) => h('span', { class: 'bonus-chip' }, `${x.label} 💎+${x.gems}`)));
