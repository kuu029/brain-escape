// ホーム: ロゴ・脱獄進捗・ゲームのポスター（数学・英語）＋ デイリーミッション
import { h, btn, toast, modal } from '../core/ui.js';
import { S, streakAlive, dayLog, cleared, save } from '../core/store.js';
import { UNITS, unitsOf } from '../units/registry.js';
import { nextUnit, GACHA10_COST, claimLogin, gachaTickets, LOGIN_CAL } from '../game/progress.js';
import { BOSSES } from '../game/content.js';
import { spriteHTML, bgUrl, iconHTML } from '../game/art.js';
import { backdrop } from '../ui/deco.js';
import { go } from '../core/router.js';
import { todayMissions, claim } from '../game/missions.js';
import { sfx } from '../core/sound.js';
import { dueList } from '../memory/engine.js';
import { flyGems } from '../ui/gems.js';
import { takeAdvice } from '../game/advice.js';
import { slotStatus, SLOT_GEMS, SLOT_MAX } from '../game/bonus.js';
import { unitNext } from './map.js';

export function topBar(back = null) {
  const s = S();
  return h('header', { class: 'topbar' },
    back ? h('button', { class: 'back', type: 'button', onclick: back, 'aria-label': 'もどる' }, '‹') : h('span', { class: 'who' }, `👤 ${s.nickname}`),
    h('span', { class: 'spacer' }),
    h('span', { class: 'pill' }, `🔥 ${streakAlive()}日`),
    h('span', { class: 'pill gem-pill' }, h('span', { html: iconHTML('icon-gem', '💎', 'ダイヤ') }), ' ', h('b', {}, String(s.gems))));
}

export function render(el) {
  const s = S();
  const lb = claimLogin(); // 先にもらっておく（ナビの「券あり」吹き出しに反映するため）
  const mins = Math.floor(dayLog().seconds / 60);
  const mlist = h('div', { class: 'missions' });
  const paintM = () => {
    mlist.innerHTML = '';
    todayMissions().forEach((m, i) => {
      const done = m.progress >= m.goal;
      mlist.append(h('div', { class: `mission ${m.claimed ? 'claimed' : done ? 'done' : ''}` },
        h('div', { class: 'm-text' }, m.text, h('div', { class: 'm-bar' }, h('i', { style: { width: `${(m.progress / m.goal) * 100}%` } }))),
        m.claimed ? h('span', { class: 'm-ok' }, '✔') : done
          ? btn(`💎${m.reward}`, (e) => { const from = e.currentTarget.getBoundingClientRect(); const g = claim(i); sfx('coin'); paintM(); el.querySelector('.topbar')?.replaceWith(topBar()); flyGems(g, { getBoundingClientRect: () => from }); }, 'primary small')
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
      todayCard(),
      h('div', { class: 'mboard' },
        h('h3', { class: 'mboard-title' }, '📋 今日の指令'),
        mlist,
        hourLine(),
        h('p', { class: 'note center' }, `今日のプレイ時間 ${mins} 分 ／ リベンジ待ち 👻${s.reviewQueue.length}`)),
      h('h3', { class: 'sec home-sec' }, '🎮 ぜんぶのモード'),
      gameCard('math', '数学棟', '数学', () => go('map')),
      gameCard('english', '英語棟', '英語', () => go('map', { subject: 'english' })),
      memoryCard(),
      examCard(),
    ),
    h('nav', { class: 'bottom-nav' },
      [['🎰', 'ガチャ', 'collection', { tab: 'gacha' }, 'gacha'], ['🃏', 'コレクション', 'collection', {}, 'collection'], ['📊', '記録', 'records', {}, 'records'], ['⚙️', '設定', 'settings', {}, 'settings']].map(([em, label, to, p, key]) =>
        btn(h('span', { class: 'nav-in' }, h('span', { class: 'nav-em', html: iconHTML(`nav-${key}`, em, label) }), h('span', {}, label),
          // 10連ぶんの💎がたまったら、吹き出しでお知らせ
          label === 'ガチャ' && (gachaTickets() > 0 || s.gems >= GACHA10_COST) ? h('span', { class: 'nav-bubble' }, gachaTickets() > 0 ? `🎟 券 ×${gachaTickets()}` : '10連できるぞ！') : null), () => go(to, p), `nav${label === 'ガチャ' ? ' nav-gacha' : ''}`))),
  );
  // ログインボーナス（その日はじめて）: ガチャ券。7日カレンダーで今日の位置を見せる
  if (lb) {
    sfx('coin');
    const cal = h('div', { class: 'lb-cal' }, LOGIN_CAL.map((n, i) => h('div', { class: `lb-day${i + 1 < lb.day ? ' past' : i + 1 === lb.day ? ' now' : ''}${i === LOGIN_CAL.length - 1 ? ' big' : ''}` }, h('small', {}, `${i + 1}日目`), h('b', { html: `${iconHTML('icon-ticket', '🎟', 'ガチャ券')}×${n}` }))));
    modal({
      title: '🎁 ログインボーナス',
      body: h('div', { class: 'modal-body center' },
        h('div', { class: 'lb-get', html: `${iconHTML('icon-ticket', '🎟', '')} ガチャ券 ×${lb.got}` }),
        h('p', {}, `連続 ${lb.count}日目！ いま ${lb.total}枚持ってる`),
        cal,
        h('small', { class: 'note' }, lb.day === LOGIN_CAL.length ? '7日目達成！ 明日からまた1日目。' : `明日も開くと 🎟×${lb.next}（7日目は ×${LOGIN_CAL[LOGIN_CAL.length - 1]}）。1日あけると1日目にもどるよ`)),
      buttons: [{ label: 'あとで', value: false }, { label: '🎰 ガチャへ', value: true, cls: 'primary' }],
    }).then((v) => { if (v) go('collection', { tab: 'gacha' }); });
  }
  // 学習のかたよりのおすすめ（1日1回）
  setTimeout(() => {
    if (!el.isConnected || document.querySelector('.modal-back')) return;
    const a = takeAdvice();
    if (!a) return;
    save();
    modal({ title: a.title, body: a.body, buttons: [{ label: 'あとで', value: false }, { label: a.label, value: true, cls: 'primary' }] }).then((v) => { if (v) go(...a.go); });
  }, 800);
}

// 今日の1手: 迷わないように「いまやること」を1つだけ大きく出す
//   暗号の復習が5枚以上たまっていれば暗号室、なければ数学（次に英語）の「次はこれ」
function todayPick() {
  const M = S().memory;
  const dues = ['en', 'soc', 'sci'].map((sj) => [sj, dueList(M, sj, Date.now()).length]).sort((a, b) => b[1] - a[1]);
  if (dues[0][1] >= 5) {
    const [sj, n] = dues[0];
    return { em: '🔐', label: `暗号の復習 ${Math.min(n, 20)}枚`, sub: `${{ en: '英単語', soc: '社会', sci: '理科' }[sj]}・約3分`, to: ['memory', { subject: sj }] };
  }
  for (const subj of ['math', 'english']) {
    const u = nextUnit(subj);
    const cta = u && unitNext(u.id).cta;
    if (cta) return { em: u.emoji, label: cta.label.replace(/^\S+\s/, ''), sub: `${subj === 'math' ? '数学' : '英語'}｜${u.title}・約3分`, to: cta.to, html: true };
  }
  return { em: '🔐', label: '新しい暗号を覚える', sub: '暗号室・約3分', to: ['memory', {}] };
}
function todayCard() {
  const t = todayPick();
  return h('button', { class: 'today-card', type: 'button', onclick: () => { sfx('tap'); go(...t.to); } },
    h('span', { class: 'tc-em' }, t.em),
    h('span', { class: 'tc-body' }, h('small', {}, '👉 今日の1手'), h('b', t.html ? { html: t.label } : {}, t.html ? '' : t.label), h('small', { class: 'tc-sub' }, t.sub)),
    h('span', { class: 'tc-go' }, '▶'));
}

// 2時間ボーナスの表示: この2時間の勉強時間が10分たまるとゲット（1日3回まで）
function hourLine() {
  const st = slotStatus();
  if (st.off) return h('p', { class: 'hour-line off' }, '⏰ 2時間ボーナスは 6時〜22時台（夜はしっかり寝よう）');
  if (st.full) return h('p', { class: 'hour-line done' }, `⏰ 今日の2時間ボーナス ${SLOT_MAX}/${SLOT_MAX} ぜんぶゲット！ また明日`);
  if (st.got) return h('p', { class: 'hour-line done' }, `⏰ この枠のボーナス ゲット済み（今日 ${st.count}/${SLOT_MAX}）。次は ${st.next}`);
  const min = Math.floor(st.sec / 60);
  return h('p', { class: 'hour-line open' }, `⏰ ${st.label}の間に 10分勉強で 💎+${SLOT_GEMS}（いま ${Math.min(min, 10)}/10分・今日 ${st.count}/${SLOT_MAX}）`);
}

// バナー画像（art に入っていれば）を背景に。左側を暗くして文字を読みやすく
function bannerAttrs(key, cls) {
  const url = bgUrl(key);
  return url ? { class: `game-card ${cls} has-img`, style: { backgroundImage: `linear-gradient(90deg, #0b0716e6 30%, #0b071640), url(${url})` } } : {};
}

// 暗号室（暗記）のポスター: 復習どきの枚数
function memoryCard() {
  const M = S().memory;
  const due = ['en', 'soc', 'sci'].reduce((a, sj) => a + dueList(M, sj, Date.now()).length, 0);
  const seen = Object.keys(M.cards || {}).length;
  return h('button', { class: 'game-card memory', type: 'button', ...bannerAttrs('banner-memory', 'memory'), onclick: () => { sfx('tap'); go('memory'); } },
    h('span', { class: 'gc-shine', 'aria-hidden': 'true' }),
    h('div', { class: 'gc-body' },
      h('div', { class: 'gc-sub' }, '暗記 ｜ 暗号ラッシュ'),
      h('div', { class: 'gc-title' }, '暗号室'),
      h('div', { class: 'gc-next' }, due ? `🔔 復習どき ${due} 枚` : seen ? `解読した暗号 ${seen} 枚` : '英単語・社会・理科。1回2〜4分'),
      h('span', { class: 'gc-go' }, 'START ▶')),
    h('div', { class: 'gc-em' }, '🔐'));
}

// 入試本番モード（模試）のポスター: 前回の点数・とちゅうの模試
function examCard() {
  const s = S();
  const last = (s.exams || []).filter((r) => r.kind === 'full').pop();
  return h('button', { class: 'game-card exam', type: 'button', ...bannerAttrs('banner-exam', 'exam'), onclick: () => { sfx('tap'); go('exam'); } },
    h('span', { class: 'gc-shine', 'aria-hidden': 'true' }),
    h('div', { class: 'gc-body' },
      h('div', { class: 'gc-sub' }, '入試本番モード ｜ 滋賀県型'),
      h('div', { class: 'gc-title' }, '模試'),
      h('div', { class: 'gc-next' }, s.examDraft ? '▶ とちゅうの模試があるよ' : last ? `前回のフル模試 ${last.got}点` : 'ミニ15分 ／ フル50分'),
      h('span', { class: 'gc-go' }, s.examDraft ? 'つづき ▶' : 'START ▶')),
    h('div', { class: 'gc-em' }, '📝'));
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

