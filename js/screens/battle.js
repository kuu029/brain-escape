// バトル画面（ウェーブ）: 盤面 + 問題 + 入力 + タワー建設 + 道具
import { h, btn, modal, toast, floatText, sleep, confirmBox } from '../core/ui.js';
import * as E from '../game/engine.js';
import { practiceSchedule, bossSchedule, diagnosisSchedule, makePicker, practicePool, bossPoolOf } from '../game/waves.js';
import { makeProblem, UNIT } from '../units/registry.js';
import { checkAnswer } from '../core/check.js';
import { S, recordAnswer, unitState } from '../core/store.js';
import { problemCard, answerPad, stepsView, answerLine } from '../ui/answer.js';
import { boardView } from '../ui/board.js';
import { TOOLS, TOWER_LOOK, SKINS } from '../game/content.js';
import { sfx } from '../core/sound.js';
import { bump } from '../game/missions.js';
import { go } from '../core/router.js';
import { finishWave, pickReviews } from '../game/progress.js';

const MODE_LABEL = { practice: '練習ウェーブ', boss: 'ボスウェーブ', review: 'リベンジウェーブ', diagnosis: '看守チェック' };

export function render(el, params) {
  const { mode } = params;
  const unitId = params.unit || null;
  const u = unitId ? UNIT[unitId] : null;
  let schedule;
  let picker = null;
  const problems = params.problems || [];
  let dIdx = 0;

  if (mode === 'diagnosis') {
    schedule = diagnosisSchedule(problems.length);
  } else if (mode === 'boss') {
    schedule = bossSchedule(unitId, pickReviews(unitId, 1));
    picker = makePicker(bossPoolOf(unitId));
  } else if (mode === 'review') {
    const rv = pickReviews(null, 6);
    schedule = [
      ...rv.map((r, i) => ({ turn: i * 2, kind: 'review', review: r })),
      { turn: 1, kind: 'grunt' }, { turn: 4, kind: 'grunt' }, { turn: 7, kind: 'runner' },
    ];
    const units = [...new Set(S().reviewQueue.map((r) => r.unit))].filter((id) => UNIT[id]?.generators);
    picker = makePicker(units.flatMap((id) => practicePool(id, unitState(id).lessons)));
  } else {
    schedule = practiceSchedule(pickReviews(unitId, 2));
    picker = makePicker(practicePool(unitId, unitState(unitId).lessons));
  }
  const st = E.createBattle({ mode, schedule, tools: mode === 'diagnosis' ? [] : S().tools });

  let asked = 0;
  let firstCorrect = 0;
  const wrongList = [];
  const diag = {}; // unit -> {ok, n}
  let cur = null;
  let finished = false;

  // ---------- 画面 ----------
  const skin = SKINS.find((s) => s.id === S().collection.skin)?.cls || 'skin-default';
  const hudLives = h('span', { class: 'hud-lives' });
  const hudCoins = h('span', { class: 'hud-coins' });
  const hudCombo = h('span', { class: 'hud-combo' });
  const hudLeft = h('span', { class: 'hud-left' });
  const hud = h('header', { class: 'hud' },
    h('button', { class: 'hud-exit', type: 'button', 'aria-label': 'やめる', onclick: quit }, '✕'),
    hudLives, hudCoins, hudCombo, hudLeft);
  const title = h('div', { class: 'wave-title' }, `${MODE_LABEL[mode]}${u ? `｜${u.title}` : ''}`);
  const board = boardView(st, { onSlot, skin });
  const toolbar = h('div', { class: 'toolbar' });
  const qarea = h('section', { class: 'qarea' });
  el.append(hud, title, board.el, toolbar, qarea);

  function paintHud() {
    hudLives.textContent = st.lives === Infinity ? '❤️ ∞' : `❤️ ${st.lives}`;
    hudCoins.textContent = mode === 'diagnosis' ? '' : `🪙 ${st.coins}`;
    hudCombo.textContent = st.combo >= 2 ? `🔥${st.combo}コンボ` : '';
    hudCombo.classList.toggle('hot', st.combo >= 3);
    const left = mode === 'diagnosis' ? `${Math.min(dIdx, problems.length)}/${problems.length}` : `👾 残り${st.queue.length + E.alive(st).length}`;
    hudLeft.textContent = left;
    paintTools();
    board.update();
    // 建てられる場所があるときは光らせる
    const canBuild = st.coins >= E.TOWERS.beam.cost && st.slots.some((s) => !s);
    board.el.classList.toggle('can-build', canBuild && mode !== 'diagnosis');
  }

  function paintTools() {
    toolbar.innerHTML = '';
    if (mode === 'diagnosis') return;
    for (const [id, ok] of Object.entries(st.tools)) {
      const t = TOOLS[id];
      toolbar.append(h('button', { class: 'tool', type: 'button', disabled: !ok || st.over, title: t.desc, onclick: () => useTool(id) }, h('span', {}, t.emoji), h('small', {}, t.name)));
    }
    toolbar.append(h('button', { class: 'tool auto', type: 'button', disabled: !!st.over, onclick: () => { if (E.autoSpend(st)) { sfx('build'); bump('built'); paintHud(); } else toast('コインが足りない！ 正解してかせごう'); } }, h('span', {}, '🏗️'), h('small', {}, 'おまかせ建設')));
  }

  async function useTool(id) {
    const t = TOOLS[id];
    const ok = await confirmBox(`${t.emoji} ${t.name}`, `${t.desc}<br>このウェーブで1回だけ使えるよ。使う？`, '使う！', 'やめとく');
    if (!ok) return;
    const evs = E.useTool(st, id);
    sfx('build');
    board.fx(evs);
    paintHud();
    if (st.over) finish();
  }

  async function onSlot(si) {
    if (st.over || mode === 'diagnosis') return;
    const tw = st.slots[si];
    if (!tw) {
      const body = h('div', { class: 'tower-pick' },
        Object.entries(E.TOWERS).map(([type, def]) => h('div', { class: 'tp-row' },
          h('span', { class: 'tp-em' }, TOWER_LOOK[type].emoji),
          h('div', {}, h('b', {}, TOWER_LOOK[type].name), h('small', {}, TOWER_LOOK[type].desc)),
          h('span', { class: 'tp-cost' }, `🪙${def.cost}`))));
      const choice = await modal({
        title: `タワーを建てる（所持 🪙${st.coins}）`,
        body,
        buttons: [
          ...Object.entries(E.TOWERS).map(([type, def]) => ({ label: `${TOWER_LOOK[type].emoji} ${def.cost}`, value: type, cls: st.coins >= def.cost ? 'primary' : 'off' })),
          { label: 'やめる', value: null },
        ],
      });
      if (!choice) return;
      if (E.build(st, si, choice)) { sfx('build'); bump('built'); }
      else toast(`コインが足りない！（あと ${E.TOWERS[choice].cost - st.coins}）`);
    } else {
      const c = E.upgradeCost(st, si);
      if (c === null) return toast(`${TOWER_LOOK[tw.type].name}：最大レベル！`);
      const ok = await confirmBox(`${TOWER_LOOK[tw.type].emoji} ${TOWER_LOOK[tw.type].name} Lv${tw.lvl}`, `🪙${c} で Lv${tw.lvl + 1} に強化する？（所持 🪙${st.coins}）`, '強化！', 'やめる');
      if (!ok) return;
      if (E.upgrade(st, si)) { sfx('build'); bump('built'); }
      else toast(`コインが足りない！（あと ${c - st.coins}）`);
    }
    paintHud();
  }

  async function quit() {
    const ok = await confirmBox('ウェーブを抜ける？', 'ここまでの解答の記録は残るよ。', '抜ける', '続ける');
    if (ok) {
      finished = true;
      go(mode === 'diagnosis' ? 'home' : 'map', { focus: unitId });
    }
  }

  // ---------- 出題 ----------
  function nextProblem() {
    if (finished) return;
    if (st.over) return finish();
    if (mode === 'diagnosis' && dIdx >= problems.length) return finish();
    let target = E.pendingReview(st);
    let p = null;
    if (target) {
      p = makeProblem(target.review.generatorId, target.review.seed);
      if (!p) { target.review.answered = true; target = null; }
    }
    if (!p) p = mode === 'diagnosis' ? problems[dIdx++] : picker(st.turn);
    cur = { p, target, attempts: 0 };
    paintHud();
    renderQ();
  }

  function renderQ() {
    const { p } = cur;
    qarea.innerHTML = '';
    const feedback = h('div', { class: 'feedback' });
    const label = UNIT[p.unit]?.title;
    const pad = answerPad(p, (input) => onSubmit(input, pad, feedback));
    cur.pad = pad;
    qarea.append(problemCard(p, { review: !!cur.target, label: mode !== 'practice' ? label : '' }), feedback, pad.el);
  }

  async function onSubmit(input, pad, feedback) {
    const { p } = cur;
    const res = checkAnswer(p, input);
    if (res.invalid || res.nearly) {
      toast(res.msg, 2400);
      return;
    }
    const firstTry = cur.attempts === 0;
    recordAnswer({ unit: p.unit, generatorId: p.generatorId, seed: p.seed, correct: res.ok, firstTry, review: !!cur.target });
    if (firstTry) {
      asked++;
      const d = (diag[p.unit] ||= { ok: 0, n: 0 });
      d.n++;
      if (res.ok) { firstCorrect++; d.ok++; } else wrongList.push({ generatorId: p.generatorId, seed: p.seed });
    }
    if (res.ok) bump('correct');
    const evs = E.answer(st, { correct: res.ok, retry: !firstTry, targetId: cur.target?.id });
    if (res.ok && cur.target) cur.target.review.answered = true;
    board.fx(evs);
    paintHud();
    if (evs.some((e) => e.t === 'leak')) sfx('leak');

    if (res.ok) {
      sfx('ok');
      if (p.input.kind === 'choice') pad.mark(input, true);
      const gain = evs.find((e) => e.t === 'coins')?.n || 0;
      floatText(board.el, mode === 'diagnosis' ? '⭕' : `+${gain}🪙${st.combo >= 3 ? ' 🔥' : ''}`, 'good');
      feedback.innerHTML = '';
      feedback.append(h('div', { class: 'fb good' }, firstTry ? pickOne(['ナイス！', 'いいね！', 'その調子！', 'キレてる！', '天才か？']) : 'よし、解き直し成功！'));
      await sleep(mode === 'diagnosis' ? 450 : 700);
      nextProblem();
      return;
    }

    sfx('ng');
    cur.attempts++;
    if (p.input.kind === 'choice') { pad.mark(input, false); pad.disable(input); }
    if (mode === 'diagnosis') {
      floatText(board.el, '✖', 'bad');
      await sleep(450);
      nextProblem();
      return;
    }
    if (st.over) {
      await sleep(600);
      return finish();
    }
    showHint(res.msg, feedback);
  }

  function showHint(msg, feedback) {
    const { p } = cur;
    feedback.innerHTML = '';
    const box = h('div', { class: 'fb bad' });
    box.append(h('div', { class: 'fb-head' }, cur.attempts === 1 ? '😵 おしい！ 看守が1歩進んだ…' : '😵 まだちがうみたい'));
    if (msg) box.append(h('div', { class: 'fb-msg', rich: msg }));
    if (cur.attempts === 1) {
      box.append(h('div', { class: 'fb-hint', rich: `💡 ${p.hint || ''}` }));
      const stepsBox = h('div', { class: 'fb-steps hidden' }, stepsView(p));
      box.append(stepsBox,
        h('div', { class: 'fb-btns' },
          btn('解き方を見る', (e) => { stepsBox.classList.toggle('hidden'); e.target.remove(); }, 'ghost small'),
          btn('もう一回！', () => { feedback.innerHTML = ''; cur.pad.clearMarks(); }, 'primary small')));
    } else {
      // 2回まちがえたら、解き方と答えを見せて次へ（この問題はあとで再襲来する）
      box.append(h('div', { class: 'fb-sub' }, '解き方はこう👇 この問題はあとで「再襲来」してくるよ。'), stepsView(p), answerLine(p),
        h('div', { class: 'fb-btns' }, btn('次の問題へ', () => nextProblem(), 'primary small')));
      cur.pad.el.classList.add('done');
    }
    feedback.append(box);
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function finish() {
    if (finished) return;
    finished = true;
    if (mode === 'diagnosis') {
      go('diagnosis', { phase: 'result', results: diag });
      return;
    }
    sfx(st.over === 'win' ? 'win' : 'lose');
    await sleep(500);
    const summary = finishWave({ mode, unitId, st, asked, firstCorrect, wrongList });
    go('result', summary);
  }

  // 開発用（localhost のときだけ）: 自動テストから現在の問題と盤面を見られるようにする
  if (location.hostname === 'localhost') window.__battle = { cur: () => cur, st };
  nextProblem();
}

const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
