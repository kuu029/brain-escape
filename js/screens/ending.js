// エンディング: 数学のボスを全部たおす → 「脱獄成功」／数学＋英語のボスを全部 → 「真エンディング」
//   1回目はホームから自動で流れる（💎ボーナス）。記録画面からいつでも見なおせる
import { h, btn } from '../core/ui.js';
import { S, saveNow, today } from '../core/store.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';
import { bgUrl } from '../game/art.js';
import { ACHIEVEMENTS, achieveCount } from '../game/achieve.js';
import { UNIT } from '../units/registry.js';
import { BOSS_CARD } from '../game/content.js';
import { backdrop, confetti } from '../ui/deco.js';

const allBeaten = (subject) => {
  const s = S();
  const list = Object.keys(BOSS_CARD).filter((u) => UNIT[u] && !UNIT[u].comingSoon && UNIT[u].subject === subject);
  return list.length > 0 && list.every((u) => s.units[u]?.bossCleared);
};
export const ENDINGS = {
  math: {
    title: '脱獄成功',
    gems: 100,
    scenes: [
      { img: 'ending-1', em: '🚪⛓️💥', text: '最後の数式ロックが外れた。\nブレイン監獄の正門が、ゆっくりと開いていく。' },
      { img: 'ending-1', em: '🤝🐉🛸🚄', text: 'いっしょに戦ってきたなかまたちが、うしろからかけてくる。\n「行こうぜ、外の世界へ！」' },
      { img: 'ending-2', em: '🌅🏫', text: '丘の上から見えたのは、朝日にてらされた街。\n解けるようになった問題の数だけ、ここまで歩いてきた。' },
      { img: 'ending-2', em: '👋🧦🐟', text: 'ふり返ると、看守たちが手をふっていた。\n…でも、まだ英語棟の塔が、こっちを見ている気がする。' },
    ],
  },
  true: {
    title: '真エンディング',
    gems: 300,
    scenes: [
      { img: 'ending-3', em: '🎈🌄', text: '英語棟の最後のボスもたおした。\n塔のてっぺんで、大きな気球がふくらんでいく。' },
      { img: 'ending-3', em: '🎈🤝✨', text: 'なかまたちと気球に乗りこむ。\n下には、もう全部攻略した監獄が小さく見える。' },
      { img: 'ending-3', em: '🌊🏙️🌸', text: 'この先は、ほんものの本番だ。\nでも、もう知っている。解き方は、ちゃんと身についている。' },
    ],
  },
};
// まだ見ていないエンディング（なければ null）
export function pendingEnding() {
  const e = S().endings || {};
  if (!allBeaten('math')) return null;
  if (!e.math) return 'math';
  if (!e.true && allBeaten('english')) return 'true';
  return null;
}
export const seenEndings = () => Object.keys(S().endings || {}).filter((k) => ENDINGS[k]);

export function render(el, { kind = 'math', i = 0, replay = false } = {}) {
  const E = ENDINGS[kind] || ENDINGS.math;
  backdrop(el, 'win');
  if (i < E.scenes.length) {
    const sc = E.scenes[i];
    const img = bgUrl(sc.img);
    el.append(h('div', { class: 'story ending', onclick: () => { sfx('tap'); go('ending', { kind, i: i + 1, replay }); } },
      h('small', { class: 'end-tag' }, `🏁 ${E.title}`),
      img ? h('img', { class: 'story-img', src: img, alt: '' }) : h('div', { class: 'story-em' }, sc.em),
      h('p', { class: 'story-text', rich: sc.text }),
      h('div', { class: 'story-dots' }, E.scenes.map((_, k) => h('span', { class: k === i ? 'on' : '' }))),
      h('p', { class: 'note' }, 'タップで次へ')));
    return;
  }
  // さいごに: ここまでの記録と、はじめて見たときのごほうび
  const s = S();
  const first = !replay && !(s.endings || {})[kind];
  if (first) {
    (s.endings ||= {})[kind] = today();
    s.gems += E.gems;
    saveNow();
  }
  sfx('win');
  const days = Math.max(1, Math.ceil((Date.now() - (s.created || Date.now())) / 86400000));
  const min = Math.round(Object.values(s.log || {}).reduce((a, d) => a + (d.seconds || 0), 0) / 60);
  const bosses = Object.values(s.units || {}).filter((u) => u.bossCleared).length;
  const box = h('div', { class: 'center-col end-recap' },
    confetti(40),
    h('div', { class: 'big-em' }, kind === 'true' ? '🎈' : '🏆'),
    h('h2', {}, `${E.title}！`),
    h('p', {}, `${s.nickname}、ほんとうにおつかれさま。`),
    h('div', { class: 'stats tickets' },
      h('div', {}, h('b', {}, `${days}日`), h('small', {}, 'はじめてから')),
      h('div', {}, h('b', {}, `${Math.floor(min / 60)}時間${min % 60}分`), h('small', {}, '勉強した時間')),
      h('div', {}, h('b', {}, `${s.stats.correct || 0}問`), h('small', {}, '正解した問題'))),
    h('div', { class: 'stats tickets' },
      h('div', {}, h('b', {}, `${bosses}体`), h('small', {}, 'たおしたボス')),
      h('div', {}, h('b', {}, `${s.streak.best || 0}日`), h('small', {}, '最高の連続日数')),
      h('div', {}, h('b', {}, `${achieveCount()}/${ACHIEVEMENTS.length}`), h('small', {}, '実績'))),
    first && h('p', { class: 'center' }, h('span', { class: 'bonus-chip drop' }, `💎 +${E.gems}（エンディング記念）`)),
    kind === 'math' && !(s.endings || {}).true && h('p', { class: 'note center' }, '英語棟のボスも全部たおすと、真エンディング…？'),
    btn('🏠 ホームへ', () => go('home'), 'primary big'));
  el.append(box);
}
