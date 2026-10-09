// マップ（単元選択）: 下から上へ登る「すごろく」。マス＝単元（ボスの顔）。タップで単元パネル
import { h, btn, sheet, toast } from '../core/ui.js';
import { S, unitState, mastery, MASTERY_LABEL, cleared } from '../core/store.js';
import { UNIT, SUBJECTS, unitsOf } from '../units/registry.js';
import { go } from '../core/router.js';
import { startTimeAttack, taBest, TA_N } from './timeattack.js';
const fmtTime = (ms) => (ms ? `${Math.floor(ms / 60000)}:${((ms / 1000) % 60).toFixed(1).padStart(4, '0')}` : '—');
import { isUnlocked, missingPrereqs, canPractice, canBoss, nextUnit } from '../game/progress.js';
import { topBar } from './home.js';
import { rich } from '../core/mathml.js';
import { TOOLS, BOSSES } from '../game/content.js';
import { spriteHTML, bgUrl } from '../game/art.js';
import { sfx } from '../core/sound.js';

const GAP = 128; // マスとマスの縦の間かく
const FLOOR_TOP = 92; // 階の看板のぶん
const FLOOR_BOTTOM = 40;
const GOAL_H = 150;
const START_H = 70;
const ZIG = [50, 24, 50, 76]; // マスの横位置（%）。くねくね道になる
const GOAL = { math: ['🌅', '外の世界（脱出口）'], english: ['🗽', '自由の屋上（脱出口）'] };
const SUBJ_KEY = { math: 'math', english: 'en' };
const STARS = { new: 0, trained: 1, practicing: 2, mastered: 3 };

export function render(el, { focus = null, subject = null } = {}) {
  const s = S();
  const subj = subject || UNIT[focus]?.subject || 'math';
  // 英語棟に初めて来たら、英語の看守チェックから
  if (subj === 'english' && !s.diagnosisEn?.done) return go('diagnosis', { phase: 'intro', subject: 'english' });
  const stages = SUBJECTS[subj].stages;
  const all = stages.flatMap((stg) => unitsOf(subj).filter((u) => u.stage === stg.n)); // 下から上の順
  const nextId = nextUnit(subj)?.id;

  // 上の階から順に、座標を決める（y は塔の上からの px）
  let y = GOAL_H;
  const floors = [];
  const pos = {};
  for (const stg of [...stages].reverse()) {
    const us = all.filter((u) => u.stage === stg.n);
    const top = y;
    y += FLOOR_TOP;
    for (const u of [...us].reverse()) {
      pos[u.id] = { x: ZIG[all.indexOf(u) % ZIG.length], y: y + GAP / 2 };
      y += GAP;
    }
    y += FLOOR_BOTTOM;
    floors.push({ stg, top, height: y - top, soon: us.every((u) => u.comingSoon) });
  }
  floors[floors.length - 1].height += START_H; // 1階はスタート地点まで
  const H = y + START_H;
  const goalPt = { x: 50, y: 70 };

  // 道（下のマスから上のマスへ、なめらかに）
  const pts = [...all.map((u) => pos[u.id]), goalPt];
  const seg = (a, b) => `C ${a.x} ${(a.y + b.y) / 2}, ${b.x} ${(a.y + b.y) / 2}, ${b.x} ${b.y}`;
  const startPt = { x: 50, y: H - 20 };
  const pathD = (list) => `M ${startPt.x} ${startPt.y} ${list.map((p, i) => seg(i ? list[i - 1] : startPt, p)).join(' ')}`;
  const litUpTo = nextId ? all.findIndex((u) => u.id === nextId) : all.every((u) => u.comingSoon || cleared(u.id)) ? pts.length - 1 : -1;
  const svg = `<svg class="road" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">
    <path class="road-bed" d="${pathD(pts)}"/>
    <path class="road-dash" d="${pathD(pts)}"/>
    ${litUpTo >= 0 ? `<path class="road-lit" d="${pathD(pts.slice(0, litUpTo + 1))}"/>` : ''}
  </svg>`;

  const tower = h('div', { class: `tower t-${subj}`, style: { height: `${H}px` } });
  for (const f of floors) {
    const key = `bg-${SUBJ_KEY[subj]}-${f.stg.n}`;
    const img = bgUrl(key);
    tower.append(h('div', {
      class: `floor fl-${SUBJ_KEY[subj]}-${f.stg.n}${f.soon ? ' fl-soon' : ''}${img ? ' has-img' : ''}`,
      style: { top: `${f.top}px`, height: `${f.height}px`, ...(img ? { backgroundImage: `url(${img})` } : {}) },
    }, h('div', { class: 'floor-sign' }, h('span', { class: 'fs-n' }, `${f.stg.n}F`), h('span', { class: 'fs-t' }, f.stg.title.replace(/^第\d段階\s*/, '')))));
  }
  tower.append(h('div', { class: 'tower-goal', style: { height: `${GOAL_H}px` } },
    h('span', { class: 'tg-em' }, GOAL[subj][0]), h('span', { class: 'tg-t' }, GOAL[subj][1])));
  tower.insertAdjacentHTML('beforeend', svg);
  // ただよう火の粉（飾り）
  const embers = h('div', { class: 'embers', 'aria-hidden': 'true' });
  for (let i = 0; i < 16; i++) embers.append(h('i', { style: { left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, animationDelay: `${-(i * 1.7) % 9}s`, animationDuration: `${7 + (i % 5)}s` } }));
  tower.append(embers);

  for (const u of all) {
    const st = u.comingSoon ? 'soon' : cleared(u.id) ? 'cleared' : u.id === nextId ? 'next' : isUnlocked(u.id) ? 'open' : 'locked';
    const ms = u.comingSoon ? 'new' : mastery(u.id);
    const boss = BOSSES[u.id];
    const face = u.comingSoon ? `<span class="spr emo">${u.emoji}</span>` : spriteHTML(`boss-${u.id}`, boss?.emoji || u.emoji, boss?.name || u.title);
    const p = pos[u.id];
    const node = h('button', {
      class: `node st-${st}`, type: 'button', 'data-unit': u.id,
      style: { left: `${p.x}%`, top: `${p.y}px` },
      onclick: () => { sfx('tap'); openUnit(u.id); },
    },
      st === 'next' && h('span', { class: 'n-flag' }, 'NEXT!'),
      h('span', { class: 'n-ring', html: face }),
      h('span', { class: 'n-badge' }, { cleared: '✔', locked: '🔒', soon: '🚧' }[st] || ''),
      h('span', { class: 'n-label' },
        h('small', {}, u.area),
        h('b', {}, u.title),
        !u.comingSoon && h('span', { class: 'n-stars', 'aria-label': MASTERY_LABEL[ms] }, '★★★'.slice(0, STARS[ms]) + '☆☆☆'.slice(0, 3 - STARS[ms]))));
    tower.append(node);
  }
  tower.append(h('div', { class: 'tower-start' }, '🚪 ここからスタート'));

  const rq = s.reviewQueue.filter((r) => (UNIT[r.unit]?.subject || 'math') === subj).length;
  const done = all.filter((u) => !u.comingSoon && cleared(u.id)).length;
  const total = all.filter((u) => !u.comingSoon).length;
  el.append(
    h('div', { class: 'map-head' },
      topBar(() => go('home')),
      h('div', { class: 'mh-row' },
        h('h2', {}, SUBJECTS[subj].map.replace(/^🗺️\s*/, '')),
        h('span', { class: 'mh-prog' }, `突破 ${done}/${total}`),
        btn('🔦', () => go('diagnosis', { phase: 'intro', subject: subj }), 'ghost small mh-diag')),
      rq > 0 && btn(`👻 リベンジウェーブ（${rq}体待ち）`, () => go('battle', { mode: 'review', subject: subj }), 'warn small')),
    tower,
  );
  // 次に挑むマス（または指定のマス）が画面の真ん中に来るように
  const target = focus || nextId || all.filter((u) => cleared(u.id)).pop()?.id || all[0].id;
  setTimeout(() => el.querySelector(`[data-unit="${target}"]`)?.scrollIntoView({ block: 'center' }), 30);
}

// 次にやること: 訓練を全部 → 練習1回 → ボス → （あとは練習で定着）。単元シートと結果画面で同じものを光らせる
export function unitNext(id) {
  const u = UNIT[id];
  const us = unitState(id);
  const nextLesson = u.lessons.find((l) => !us.lessons[l.id]);
  const step = !(us.trainingDone || us.diagPassed) ? 'train' : !us.practiced ? 'practice' : !us.bossCleared ? 'boss' : 'free';
  const cta = step === 'train' && nextLesson
    ? { small: '👉 次はこれ', label: `📘 訓練${u.lessons.indexOf(nextLesson) + 1}「${rich(nextLesson.title)}」`, to: ['training', { unit: id, lesson: nextLesson.id }], cls: 'primary' }
    : step === 'boss' && canBoss(id)
      ? { small: '👉 次はこれ', label: '👑 ボスウェーブに挑む', to: ['battle', { mode: 'boss', unit: id }], cls: 'boss' }
      : canPractice(id)
        ? { small: step === 'free' ? '👉 定着をめざそう' : '👉 次はこれ', label: '⚔️ 練習ウェーブ', to: ['battle', { mode: 'practice', unit: id }], cls: 'primary' }
        : null;
  return { step, cta };
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
    const { step, cta: next } = unitNext(id);
    const cta = next && btn(h('span', { class: 'cta-in' }, h('small', {}, next.small), h('span', { html: next.label })), nav(...next.to), `${next.cls} big up-cta`);
    return h('div', { class: 'unit-panel' },
      h('div', { class: 'up-head' }, h('span', { class: 'up-em' }, u.emoji), h('div', {}, h('div', { class: 'a-area' }, u.area), h('h2', {}, u.title)), h('span', { class: `badge b-${mastery(id)}` }, MASTERY_LABEL[mastery(id)])),
      recent !== null && h('p', { class: 'note' }, `直近の正答率 ${recent}%（${us.recent.length}問）／ 練習 ${us.practiced}回${us.bossCleared ? ' ／ ボス撃破済み' : ''}`),
      flowBar(step),
      cta,
      h('h3', { class: 'sec' }, '📘 訓練（ステップ解説）'),
      h('p', { class: 'up-why' }, '解き方を1ステップずつ教わる。初めての単元や、やり方を忘れたときに。敵は出ないので、じっくりでOK。'),
      h('div', { class: 'lessons' }, u.lessons.map((l, i) => h('button', { class: `lesson ${us.lessons[l.id] ? 'done' : ''} ${l === nextLesson ? 'next' : ''}`, type: 'button', onclick: nav('training', { unit: id, lesson: l.id }) },
        h('span', { class: 'l-no' }, us.lessons[l.id] ? '✔' : i + 1), h('span', { html: rich(l.title) })))),
      us.trainingDone ? h('p', { class: 'note' }, `訓練クリア報酬: ${TOOLS[u.tool].emoji} ${TOOLS[u.tool].name}（ウェーブで使える道具）`) : h('p', { class: 'note' }, `全部の訓練をクリアすると道具「${TOOLS[u.tool].emoji} ${TOOLS[u.tool].name}」がもらえる`),
      h('h3', { class: 'sec' }, '⚔️ 練習ウェーブ ／ 👑 ボス'),
      h('p', { class: 'up-why' }, '練習＝覚えた解き方を看守とのバトルで使って、手になじませる。何回でもOK。ボス＝単元の総仕上げ。倒すと次のエリアが開く。'),
      h('div', { class: 'up-btns' },
        (Object.keys(us.lessons).length || us.diagPassed) ? btn('🃏 思い出しカード', () => { close(); recallCard(id); }, 'ghost') : null,
        practiceOk ? btn('⚔️ 練習ウェーブ', nav('battle', { mode: 'practice', unit: id }), 'ghost') : h('p', { class: 'note' }, '👆 まずは訓練1から！ クリアすると練習ウェーブが開くよ'),
        bossOk ? btn(`👑 ボスウェーブ${us.bossCleared ? '（再戦）' : ''}`, nav('battle', { mode: 'boss', unit: id }), 'ghost') : h('p', { class: 'note' }, '👑 ボスは「訓練を全部クリア＋練習ウェーブ1回」で出現'),
        // 数学だけ: 紙とペンで10問の速さをきそう
        practiceOk && (u.subject || 'math') === 'math' && btn(`⏱ タイムアタック（紙とペン・${TA_N}問）${taBest(id) ? `　ベスト ${fmtTime(taBest(id).best)}` : ''}`, () => { close(); startTimeAttack(id); }, 'ghost')));
  });
}

// 訓練 → 練習 → ボス の3段の道。いまどこにいるかを光らせる
function flowBar(step) {
  const at = { train: 0, practice: 1, boss: 2, free: 3 }[step];
  const stepsDef = [['📘', '訓練', '解き方を覚える'], ['⚔️', '練習', 'バトルで慣れる'], ['👑', 'ボス', '力だめし']];
  return h('div', { class: 'up-flow' }, stepsDef.map(([em, name, what], j) => h('div', { class: `uf-step${j < at || at === 3 ? ' done' : ''}${j === at ? ' now' : ''}` },
    h('span', { class: 'uf-em' }, j < at || at === 3 ? '✔' : em), h('b', {}, name), h('small', {}, what))));
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
