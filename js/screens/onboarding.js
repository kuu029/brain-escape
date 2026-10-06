// 初回起動: タイトル → ニックネーム → 短いストーリー（スキップ可）→ 診断へ
import { h, btn, toast } from '../core/ui.js';
import { S, saveNow } from '../core/store.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';

export const STORY = [
  { em: '🧠⛓️', text: '目が覚めたら、そこは『ブレイン監獄』だった。' },
  { em: '🧦🐟🧊', text: '看守はヘンテコなミーム生物たち。\n脱獄するには、各区画の「数式ロック」を解いて扉を開けるしかない。' },
  { em: '🔫❄️💣', text: '問題を解けばコインが入り、タワーが看守を撃つ。\nミスると看守が1歩進む。\n…でも時間制限はナシ。じっくりいけ。' },
];

export function render(el, { step = 'title', i = 0 } = {}) {
  if (step === 'title') {
    el.append(
      h('div', { class: 'title-screen' },
        h('div', { class: 'logo-em' }, '🧠⛓️'),
        h('h1', { class: 'logo' }, 'ブレイン', h('br'), '脱獄'),
        h('p', { class: 'tagline' }, '解いて、建てて、ぶっとばして、出ろ。'),
        btn('はじめる', () => go('onboarding', { step: 'name' }), 'primary big')),
    );
    return;
  }
  if (step === 'name') {
    const input = h('input', { class: 'name-input', type: 'text', maxlength: '10', placeholder: 'ニックネーム', autocomplete: 'off', enterkeyhint: 'done' });
    input.value = S().nickname || '';
    const next = () => {
      const v = input.value.trim();
      if (!v) return toast('ニックネームを入れてね');
      S().nickname = v.slice(0, 10);
      saveNow();
      input.blur();
      go('onboarding', { step: 'story', i: 0 });
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') next(); });
    el.append(
      h('div', { class: 'center-col' },
        h('h2', {}, '囚人番号…じゃなくて、名前は？'),
        input,
        h('p', { class: 'note' }, '本名じゃなくてOK。このスマホの中にだけ保存されるよ。'),
        btn('決定', next, 'primary big')),
    );
    setTimeout(() => input.focus(), 100);
    return;
  }
  // story
  const s = STORY[i];
  const done = () => {
    S().storySeen = true;
    saveNow();
    if (S().onboarded) go('home');
    else go('diagnosis', { phase: 'intro' });
  };
  el.append(
    h('div', { class: 'story', onclick: () => { sfx('tap'); i + 1 < STORY.length ? go('onboarding', { step: 'story', i: i + 1 }) : done(); } },
      h('button', { class: 'skip', type: 'button', onclick: (e) => { e.stopPropagation(); done(); } }, 'スキップ ⏭'),
      h('div', { class: 'story-em' }, s.em),
      h('p', { class: 'story-text', rich: s.text }),
      h('div', { class: 'story-dots' }, STORY.map((_, k) => h('span', { class: k === i ? 'on' : '' }))),
      h('p', { class: 'note' }, 'タップで次へ')),
  );
}
