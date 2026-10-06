// 訓練（ステップ解説）: 1ステップ=1操作。小問に正解しないと次へ進めない（スキップ不可）
import { h, btn, modal, confirmBox, sleep } from '../core/ui.js';
import { tex, rich } from '../core/mathml.js';
import { makeRng, newSeed } from '../core/rng.js';
import { checkAnswer } from '../core/check.js';
import { unitState, saveNow } from '../core/store.js';
import { UNIT, lessonOf } from '../units/registry.js';
import { answerPad, answerLine } from '../ui/answer.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';
import { bump } from '../game/missions.js';
import { grantTool } from '../game/progress.js';
import { TOOLS } from '../game/content.js';

export function render(el, { unit, lesson }) {
  const u = UNIT[unit];
  const L = lessonOf(u, lesson);
  const steps = L.build(makeRng(newSeed()));
  const idx = u.lessons.indexOf(L);
  let i = 0;

  const bar = h('div', { class: 'tr-bar' }, h('i'));
  const body = h('div', { class: 'tr-body' });
  el.append(
    h('header', { class: 'topbar' },
      h('button', { class: 'back', type: 'button', 'aria-label': 'もどる', onclick: leave }, '‹'),
      h('span', { class: 'tr-title', html: `📘 ${u.title}｜訓練${idx + 1} ${rich(L.title)}` })),
    bar,
    body,
  );

  async function leave() {
    if (i === 0 || (await confirmBox('訓練をやめる？', 'この訓練は最初からやり直しになるよ。', 'やめる', '続ける'))) go('map', { focus: unit });
  }

  // 直前に出した式は、次のステップでも見えるように残す
  const mathAt = (k) => { for (let j = k; j >= 0; j--) if (steps[j].math) return { math: steps[j].math, carried: j !== k }; return null; };

  function show() {
    const st = steps[i];
    const cm = mathAt(i);
    bar.firstChild.style.width = `${(i / steps.length) * 100}%`;
    body.innerHTML = '';
    const card = h('div', { class: 'tr-card' },
      h('div', { class: 'tr-step' }, `STEP ${i + 1} / ${steps.length}`),
      cm && cm.carried && h('div', { class: 'tr-math carried' }, h('small', {}, 'いまの式'), h('span', { class: 'math', html: tex(cm.math) })),
      h('div', { class: 'tr-text', rich: st.text }),
      cm && !cm.carried && h('div', { class: 'tr-math math', html: tex(cm.math) }));
    body.append(card);
    const nextBtn = btn(i + 1 < steps.length ? '次へ ▶' : '訓練クリア！', next, 'primary big');
    if (!st.q) {
      body.append(nextBtn);
      return;
    }
    let wrongs = 0;
    const fb = h('div', { class: 'feedback' });
    const q = { ...st.q, stem: st.text };
    const pad = answerPad(q, async (input) => {
      const r = checkAnswer(q, input);
      if (r.invalid || r.nearly) {
        fb.innerHTML = '';
        fb.append(h('div', { class: 'fb', rich: r.msg }));
        return;
      }
      fb.innerHTML = '';
      if (r.ok) {
        sfx('ok');
        bump('trainQ');
        if (q.input.kind === 'choice') pad.mark(input, true);
        pad.el.classList.add('done');
        fb.append(h('div', { class: 'fb good' }, wrongs ? 'OK！ これで合ってる。' : 'ナイス！'), nextBtn);
        await sleep(50);
        nextBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      sfx('ng');
      wrongs++;
      if (q.input.kind === 'choice') { pad.mark(input, false); pad.disable(input); }
      const box = h('div', { class: 'fb bad' }, h('div', { class: 'fb-msg', rich: r.msg || 'ちがうみたい。説明をもう一度読んでみよう。' }));
      if (wrongs >= 2) box.append(h('div', { class: 'fb-sub' }, '答えはこれ👇 入れてみて、次へ進もう。'), answerLine(q));
      else if (q.hint) box.append(h('div', { class: 'fb-hint', rich: `💡 ${q.hint}` }));
      fb.append(box);
    });
    body.append(fb, pad.el);
  }

  async function next() {
    i++;
    if (i < steps.length) return show();
    // クリア
    const us = unitState(unit);
    us.lessons[L.id] = true;
    const allDone = u.lessons.every((l) => us.lessons[l.id]);
    let tool = null;
    if (allDone && !us.trainingDone) {
      us.trainingDone = true;
      tool = grantTool(unit);
    }
    saveNow();
    sfx('win');
    bar.firstChild.style.width = '100%';
    const nextL = u.lessons.find((l) => !us.lessons[l.id]);
    if (tool) {
      await modal({ title: '訓練コンプリート！', body: `道具ゲット: ${TOOLS[tool].emoji} ${TOOLS[tool].name}\n${TOOLS[tool].desc}\n（ウェーブ中に1回使える）` });
    }
    body.innerHTML = '';
    body.append(h('div', { class: 'center-col' },
      h('div', { class: 'big-em' }, '🎉'),
      h('h2', {}, `訓練${idx + 1} クリア！`),
      h('p', { rich: L.unlocks.length ? 'この型の問題が練習ウェーブに出るようになった。' : '' }),
      btn('⚔️ 練習ウェーブで試す', () => go('battle', { mode: 'practice', unit }), 'primary big'),
      nextL && btn(`📘 次の訓練へ: ${nextL.title.replace(/\$/g, '')}`, () => go('training', { unit, lesson: nextL.id }), 'ghost'),
      btn('マップへ', () => go('map', { focus: unit }), 'ghost')));
  }

  if (location.hostname === 'localhost') window.__training = { steps, i: () => i };
  show();
}
