// ホーム: ロゴ・脱獄進捗・ゲームのポスター（数学・英語）＋ デイリーミッション
import { h, btn, toast } from '../core/ui.js';
import { S, streakAlive, dayLog, cleared } from '../core/store.js';
import { UNITS, unitsOf } from '../units/registry.js';
import { nextUnit } from '../game/progress.js';
import { BOSSES } from '../game/content.js';
import { spriteHTML, bgUrl } from '../game/art.js';
import { backdrop } from '../ui/deco.js';
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

  // 全体の脱獄進捗（工事中をのぞく全単元のうち、突破した数）
  const real = UNITS.filter((u) => !u.comingSoon);
  const pct = Math.round((real.filter((u) => cleared(u.id)).length / real.length) * 100);
  backdrop(el, 'cell', 'bg-home');

  el.append(
    topBar(),
    h('div', { class: 'home' },
      h('div', { class: 'home-hero' },
        h('div', { class: 'hlogo' }, h('span', { class: 'hlogo-a' }, 'ブレイン'), h('span', { class: 'hlogo-b' }, '脱獄')),
        h('p', { class: 'hello' }, `よう、${s.nickname}。今日も脱獄の時間だ。`),
        h('div', { class: 'escape-meter' },
          h('span', { class: 'em-label' }, '🔓 脱獄進捗'),
          h('span', { class: 'em-bar' }, h('i', { style: { width: `${Math.max(pct, 2)}%` } })),
          h('b', { class: 'em-pct' }, `${pct}%`))),
      gameCard('math', '数学棟', '数学', () => go('map')),
      gameCard('english', '英語棟', '英語', () => go('map', { subject: 'english' })),
      h('div', { class: 'game-card soon' }, h('div', { class: 'gc-body' }, h('div', { class: 'gc-title' }, '？？？'), h('div', { class: 'gc-sub' }, '別のゲーム 準備中…')), h('div', { class: 'gc-em' }, '🔒')),
      h('div', { class: 'mboard' },
        h('h3', { class: 'mboard-title' }, '📋 今日の指令'),
        mlist,
        h('p', { class: 'note center' }, `今日のプレイ時間 ${mins} 分 ／ 再襲来待ち 👻${s.reviewQueue.length}`)),
    ),
    h('nav', { class: 'bottom-nav' },
      [['🃏', 'コレクション', 'collection'], ['📊', '記録', 'records'], ['⚙️', '設定', 'settings']].map(([em, label, to]) =>
        btn(h('span', { class: 'nav-in' }, h('span', { class: 'nav-em' }, em), h('span', {}, label)), () => go(to), 'nav'))),
  );
}

// ゲームのポスター: 次に戦うボスの顔・進み具合
function gameCard(subj, title, sub, onPlay) {
  const list = unitsOf(subj).filter((u) => !u.comingSoon);
  const done = list.filter((u) => cleared(u.id)).length;
  const next = nextUnit(subj);
  const boss = next && BOSSES[next.id];
  const banner = bgUrl(`banner-${subj === 'math' ? 'math' : 'en'}`);
  return h('button', {
    class: `game-card ${subj}${banner ? ' has-img' : ''}`, type: 'button',
    style: banner ? { backgroundImage: `linear-gradient(90deg, #0b0716e6 30%, #0b071640), url(${banner})` } : {},
    onclick: () => { sfx('tap'); onPlay(); },
  },
    h('span', { class: 'gc-shine', 'aria-hidden': 'true' }),
    h('div', { class: 'gc-body' },
      h('div', { class: 'gc-sub' }, `${sub} ｜ タワーディフェンス`),
      h('div', { class: 'gc-title' }, title),
      h('div', { class: 'gc-prog' }, h('span', { class: 'gc-bar' }, h('i', { style: { width: `${(done / list.length) * 100}%` } })), h('small', {}, `突破 ${done}/${list.length}`)),
      h('div', { class: 'gc-next' }, next ? `次: ${next.title}` : '全エリア突破！'),
      h('span', { class: 'gc-go' }, 'PLAY ▶')),
    next && h('div', { class: 'gc-boss', html: spriteHTML(`boss-${next.id}`, boss?.emoji || next.emoji, boss?.name || '') }));
}

