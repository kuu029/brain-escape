// ホーム: ゲームを選ぶ入口（数学・英語）＋ デイリーミッション
import { h, btn, toast } from '../core/ui.js';
import { S, streakAlive, dayLog } from '../core/store.js';
import { go } from '../core/router.js';
import { todayMissions, claim } from '../game/missions.js';
import { sfx } from '../core/sound.js';

export function topBar(back = null) {
  const s = S();
  return h('header', { class: 'topbar' },
    back ? h('button', { class: 'back', type: 'button', onclick: back, 'aria-label': 'もどる' }, '‹') : h('span', { class: 'who' }, `👤 ${s.nickname}`),
    h('span', { class: 'spacer' }),
    h('span', { class: 'pill' }, `🔥 ${streakAlive()}日`),
    h('span', { class: 'pill' }, `💎 ${s.gems}`));
}

export function render(el) {
  const s = S();
  const mins = Math.floor(dayLog().seconds / 60);
  const mlist = h('div', { class: 'missions' });
  const paintM = () => {
    mlist.innerHTML = '';
    todayMissions().forEach((m, i) => {
      const done = m.progress >= m.goal;
      mlist.append(h('div', { class: `mission ${m.claimed ? 'claimed' : done ? 'done' : ''}` },
        h('div', { class: 'm-text' }, m.text, h('div', { class: 'm-bar' }, h('i', { style: { width: `${(m.progress / m.goal) * 100}%` } }))),
        m.claimed ? h('span', { class: 'm-ok' }, '✔') : done
          ? btn(`💎${m.reward}`, () => { const g = claim(i); sfx('coin'); toast(`💎 +${g}`); go('home'); }, 'primary small')
          : h('span', { class: 'm-num' }, `${m.progress}/${m.goal}`)));
    });
  };
  paintM();
  el.append(
    topBar(),
    h('div', { class: 'home' },
      h('p', { class: 'hello' }, `よう、${s.nickname}。今日も脱獄の時間だ。`),
      h('button', { class: 'game-card math', type: 'button', onclick: () => { sfx('tap'); go('map'); } },
        h('div', { class: 'gc-em' }, '🧠⛓️'),
        h('div', { class: 'gc-body' }, h('div', { class: 'gc-title' }, 'ブレイン脱獄'), h('div', { class: 'gc-sub' }, '数学 ｜ タワーディフェンス'), h('span', { class: 'gc-go' }, 'PLAY ▶'))),
      h('button', { class: 'game-card english', type: 'button', onclick: () => { sfx('tap'); go('map', { subject: 'english' }); } },
        h('div', { class: 'gc-em' }, '🔤⛓️'),
        h('div', { class: 'gc-body' }, h('div', { class: 'gc-title' }, 'ブレイン脱獄 英語棟'), h('div', { class: 'gc-sub' }, '英語 ｜ タワーディフェンス'), h('span', { class: 'gc-go' }, 'PLAY ▶'))),
      h('div', { class: 'game-card soon' }, h('div', { class: 'gc-em' }, '❔'), h('div', { class: 'gc-body' }, h('div', { class: 'gc-title' }, '？？？'), h('div', { class: 'gc-sub' }, '別のゲーム 準備中…'))),
      h('h3', { class: 'sec' }, '今日のミッション'),
      mlist,
      h('p', { class: 'note center' }, `今日のプレイ時間 ${mins} 分 ／ 再襲来待ち 👻${s.reviewQueue.length}`),
    ),
    h('nav', { class: 'bottom-nav' },
      [['🃏', 'コレクション', 'collection'], ['📊', '記録', 'records'], ['⚙️', '設定', 'settings']].map(([em, label, to]) =>
        btn(h('span', { class: 'nav-in' }, h('span', { class: 'nav-em' }, em), h('span', {}, label)), () => go(to), 'nav'))),
  );
}
