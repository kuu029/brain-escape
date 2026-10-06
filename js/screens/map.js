// マップ（単元選択）: エリア・ロック・理解度。タップで単元パネル
import { h, btn, sheet, toast } from '../core/ui.js';
import { S, unitState, mastery, MASTERY_LABEL } from '../core/store.js';
import { UNITS, UNIT, STAGES } from '../units/registry.js';
import { go } from '../core/router.js';
import { isUnlocked, missingPrereqs, canPractice, canBoss } from '../game/progress.js';
import { topBar } from './home.js';
import { rich } from '../core/mathml.js';
import { TOOLS } from '../game/content.js';

export function render(el, { focus = null } = {}) {
  const s = S();
  const list = h('div', { class: 'map' });
  for (const stg of STAGES) {
    list.append(h('h3', { class: 'stage-title' }, stg.title));
    for (const u of UNITS.filter((x) => x.stage === stg.n)) {
      const unlocked = isUnlocked(u.id);
      const ms = u.comingSoon ? 'soon' : mastery(u.id);
      const us = s.units[u.id];
      const cls = ['area', u.comingSoon ? 'soon' : unlocked ? 'open' : 'locked', `m-${ms}`, us?.bossCleared || us?.diagPassed ? 'cleared' : ''].join(' ');
      const card = h('button', { class: cls, type: 'button', 'data-unit': u.id, onclick: () => openUnit(u.id) },
        h('span', { class: 'a-em' }, u.comingSoon ? '🚧' : unlocked ? u.emoji : '🔒'),
        h('span', { class: 'a-body' },
          h('span', { class: 'a-area' }, u.area),
          h('span', { class: 'a-title' }, u.title),
          !unlocked && !u.comingSoon && h('span', { class: 'a-need' }, `必要: ${missingPrereqs(u.id).map((p) => UNIT[p].title).join('・')}`)),
        h('span', { class: `badge b-${ms}` }, u.comingSoon ? '工事中' : unlocked ? (us?.bossCleared ? '突破✔' : us?.diagPassed && ms !== 'mastered' ? '突破✔' : MASTERY_LABEL[ms]) : 'ロック'));
      list.append(card);
    }
  }
  const rq = s.reviewQueue.length;
  el.append(
    topBar(() => go('home')),
    h('div', { class: 'map-head' },
      h('h2', {}, '🗺️ ブレイン監獄 マップ'),
      rq > 0 && btn(`👻 リベンジウェーブ（${rq}体待ち）`, () => go('battle', { mode: 'review' }), 'warn'),
      btn('🔦 看守チェック（診断）をやり直す', () => go('diagnosis', { phase: 'intro' }), 'ghost small')),
    list,
  );
  if (focus) setTimeout(() => el.querySelector(`[data-unit="${focus}"]`)?.scrollIntoView({ block: 'center' }), 50);
}

function openUnit(id) {
  const u = UNIT[id];
  if (u.comingSoon) return toast('このエリアは工事中。もうすぐ開くかも…');
  if (!isUnlocked(id)) return toast(`🔒 先に「${missingPrereqs(id).map((p) => UNIT[p].title).join('」「')}」を突破しよう`);
  const us = unitState(id);
  const recent = us.recent.length ? Math.round((us.recent.reduce((a, b) => a + b, 0) / us.recent.length) * 100) : null;
  const nextLesson = u.lessons.find((l) => !us.lessons[l.id]);
  sheet((close) => {
    const nav = (name, params) => () => { close(); go(name, params); };
    const practiceOk = canPractice(id);
    const bossOk = canBoss(id);
    return h('div', { class: 'unit-panel' },
      h('div', { class: 'up-head' }, h('span', { class: 'up-em' }, u.emoji), h('div', {}, h('div', { class: 'a-area' }, u.area), h('h2', {}, u.title)), h('span', { class: `badge b-${mastery(id)}` }, MASTERY_LABEL[mastery(id)])),
      recent !== null && h('p', { class: 'note' }, `直近の正答率 ${recent}%（${us.recent.length}問）／ 練習 ${us.practiced}回${us.bossCleared ? ' ／ ボス撃破済み' : ''}`),
      h('h3', { class: 'sec' }, '📘 訓練（ステップ解説）'),
      h('div', { class: 'lessons' }, u.lessons.map((l, i) => h('button', { class: `lesson ${us.lessons[l.id] ? 'done' : ''} ${l === nextLesson ? 'next' : ''}`, type: 'button', onclick: nav('training', { unit: id, lesson: l.id }) },
        h('span', { class: 'l-no' }, us.lessons[l.id] ? '✔' : i + 1), h('span', { html: rich(l.title) })))),
      us.trainingDone ? h('p', { class: 'note' }, `訓練クリア報酬: ${TOOLS[u.tool].emoji} ${TOOLS[u.tool].name}（ウェーブで使える道具）`) : h('p', { class: 'note' }, `全部の訓練をクリアすると道具「${TOOLS[u.tool].emoji} ${TOOLS[u.tool].name}」がもらえる`),
      h('div', { class: 'up-btns' },
        (Object.keys(us.lessons).length || us.diagPassed) ? btn('🃏 思い出しカード', () => { close(); recallCard(id); }, 'ghost') : null,
        practiceOk ? btn('⚔️ 練習ウェーブ', nav('battle', { mode: 'practice', unit: id }), 'primary') : h('p', { class: 'note' }, '👆 まずは訓練1から！ クリアすると練習ウェーブが開くよ'),
        bossOk ? btn(`👑 ボスウェーブ${us.bossCleared ? '（再戦）' : ''}`, nav('battle', { mode: 'boss', unit: id }), 'boss') : h('p', { class: 'note' }, '👑 ボスは「訓練を全部クリア＋練習ウェーブ1回」で出現')));
  });
}

// 思い出しモード: 要点だけのカード → すぐ演習へ
export function recallCard(id) {
  const u = UNIT[id];
  sheet((close) => h('div', { class: 'recall' },
    h('h2', {}, `🃏 ${u.title} 思い出しカード`),
    h('ul', { class: 'recall-list' }, u.hintCard.map((t) => h('li', { rich: t }))),
    h('div', { class: 'up-btns' },
      canPractice(id) && btn('⚔️ 練習ウェーブへ', () => { close(); go('battle', { mode: 'practice', unit: id }); }, 'primary'),
      btn('📘 訓練をやり直す', () => { close(); go('training', { unit: id, lesson: u.lessons[0].id }); }, 'ghost'))));
}
