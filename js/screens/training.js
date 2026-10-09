// 訓練（ステップ解説）: 1ステップ=1操作。小問に正解しないと次へ進めない（スキップ不可）
import { h, btn, readBtn, readMs, modal, confirmBox, sleep } from '../core/ui.js';
import { tex, rich } from '../core/mathml.js';
import { makeRng, newSeed } from '../core/rng.js';
import { checkAnswer } from '../core/check.js';
import { unitState, saveNow, beginSession, tallySession, closeSession } from '../core/store.js';
import { studyBegin, studyEnd } from '../core/timer.js';
import { UNIT, lessonOf } from '../units/registry.js';
import { answerPad, answerLine } from '../ui/answer.js';
import { askBtn } from '../ui/asklater.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';
import { bump } from '../game/missions.js';
import { grantTool } from '../game/progress.js';
import { TOOLS } from '../game/content.js';
import { claimActivity } from '../game/bonus.js';
import { bonusChips } from './result.js';
import { flyGems } from '../ui/gems.js';

export function render(el, { unit, lesson }) {
  const u = UNIT[unit];
  const L = lessonOf(u, lesson);
  const steps = L.build(makeRng(newSeed()));
  const idx = u.lessons.indexOf(L);
  let i = 0;
  beginSession({ kind: 'training', subject: u.subject || 'math', unit, lesson: L.id });

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
  // 図も同じく、次に新しい図が出るまで残す
  const figAt = (k) => { for (let j = k; j >= 0; j--) if (steps[j].fig) return steps[j].fig; return null; };

  function show() {
    const st = steps[i];
    const cm = mathAt(i);
    bar.firstChild.style.width = `${(i / steps.length) * 100}%`;
    body.innerHTML = '';
    const card = h('div', { class: 'tr-card' },
      h('div', { class: 'tr-step' }, `STEP ${i + 1} / ${steps.length}`),
      cm && cm.carried && h('div', { class: 'tr-math carried' }, h('small', {}, 'いまの式'), h('span', { class: 'math', html: tex(cm.math) })),
      h('div', { class: 'tr-text', rich: st.text }),
      cm && !cm.carried && h('div', { class: 'tr-math math', html: tex(cm.math) }),
      figAt(i) && h('div', { class: 'qfig', html: figAt(i) }),
      st.en && h('div', { class: 'tr-en' }, st.en),
      st.q?.stem && h('div', { class: 'tr-qstem', rich: st.q.stem }));
    body.append(card);
    studyBegin(150); // 1ステップ 最大2分半
    const nextLabel = i + 1 < steps.length ? '次へ ▶' : '訓練クリア！';
    if (!st.q) {
      // 説明だけのステップ: 読む量に対して早すぎるタップのときだけ「ほんとに読んだ？」
      body.append(readBtn(nextLabel, next, 'primary big', readMs(`${st.text || ''}${st.en || ''}`), '説明'));
      return;
    }
    // 例題に正解したあとは、すぐ次へ進んでOK
    const nextBtn = btn(nextLabel, next, 'primary big');
    let wrongs = 0;
    const fb = h('div', { class: 'feedback' });
    const q = { ...st.q, stem: st.q.stem || st.text };
    const pad = answerPad(q, async (input) => {
      const r = checkAnswer(q, input);
      if (r.invalid || r.nearly) {
        fb.innerHTML = '';
        fb.append(h('div', { class: 'fb', rich: r.msg }));
        return;
      }
      fb.innerHTML = '';
      if (!wrongs) tallySession(r.ok);
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
      if (wrongs >= 2) box.append(h('div', { class: 'fb-sub' }, '答えはこれ👇 入れてみて、次へ進もう。'), answerLine(q), askBtn(q, '訓練'));
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
    studyEnd();
    closeSession('clear');
    const bonus = claimActivity('training');
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
      bonusChips(bonus),
      h('p', { rich: L.unlocks.length ? 'この型の問題が練習ウェーブに出るようになった。' : '' }),
      // 訓練が残っていれば「次の訓練」を黄色に（全部の訓練 → 練習 → ボス の順に進む）
      nextL && btn(`📘 次の訓練へ: ${nextL.title.replace(/\$/g, '')}`, () => go('training', { unit, lesson: nextL.id }), 'primary big'),
      btn('⚔️ 練習ウェーブで試す', () => go('battle', { mode: 'practice', unit }), nextL ? 'ghost' : 'primary big'),
      h('p', { class: 'note' }, nextL ? `訓練はあと ${u.lessons.filter((l) => !us.lessons[l.id]).length} つ。全部クリアするとボスへの道が開く。` : '練習ウェーブ＝覚えた解き方を、看守とのバトルで使ってみる場所。'),
      btn('マップへ', () => go('map', { focus: unit }), 'ghost')));
    flyGems(bonus.gems, null, 500);
  }

  if (location.hostname === 'localhost') window.__training = { steps, i: () => i };
  show();
}
