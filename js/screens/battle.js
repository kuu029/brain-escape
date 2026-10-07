// バトル画面（ウェーブ）: 盤面 + 予測 + 問題 + 入力 + タワー建設 + 道具
// 答えたらエンジンの状態はすぐ確定。盤面の演出は裏で再生し、正解ならすぐ次の問題を出す（待たせない）
import { h, btn, holdBtn, toast, floatText, sleep, confirmBox } from '../core/ui.js';
import * as E from '../game/engine.js';
import { practiceSchedule, bossSchedule, diagnosisSchedule, makePicker, practicePool, bossPoolOf } from '../game/waves.js';
import { makeProblem, UNIT } from '../units/registry.js';
import { checkAnswer } from '../core/check.js';
import { S, recordAnswer, unitState, save } from '../core/store.js';
import { problemCard, answerPad, stepsView, answerLine } from '../ui/answer.js';
import { boardView } from '../ui/board.js';
import { TOOLS, TOWER_LOOK, SKINS } from '../game/content.js';
import { towerSprite, enemyLook } from '../game/art.js';
import { sfx } from '../core/sound.js';
import { bump } from '../game/missions.js';
import { go } from '../core/router.js';
import { finishWave, pickReviews } from '../game/progress.js';

const MODE_LABEL = { practice: '練習ウェーブ', boss: 'ボスウェーブ', review: 'リベンジウェーブ', diagnosis: '看守チェック' };
const PRAISE = ['ナイス！', 'いいね！', 'その調子！', 'キレてる！', '天才か？', 'ドンピシャ！'];

export function render(el, params) {
  const { mode } = params;
  const unitId = params.unit || null;
  const u = unitId ? UNIT[unitId] : null;
  const s = S();
  const subject = params.subject || u?.subject || 'math';
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
    const rv = pickReviews(null, 6, subject);
    schedule = [
      ...rv.map((r, i) => ({ turn: i * 2, kind: 'review', review: r })),
      { turn: 1, kind: 'grunt' }, { turn: 4, kind: 'grunt' }, { turn: 7, kind: 'runner' },
    ];
    const units = [...new Set(s.reviewQueue.map((r) => r.unit))].filter((id) => UNIT[id]?.generators && UNIT[id].subject === subject);
    picker = makePicker(units.flatMap((id) => practicePool(id, unitState(id).lessons)));
  } else {
    schedule = practiceSchedule(pickReviews(unitId, 2));
    picker = makePicker(practicePool(unitId, unitState(unitId).lessons));
  }
  const st = E.createBattle({ mode, schedule, tools: mode === 'diagnosis' ? [] : s.tools });
  const diagMode = mode === 'diagnosis';

  let asked = 0;
  let firstCorrect = 0;
  const wrongList = [];
  const diag = {}; // unit -> {ok, n}
  let cur = null;
  let finished = false;
  let ending = false;

  // ---------- 画面 ----------
  const skinId = s.collection.skin || 'default';
  const skinCls = SKINS.find((x) => x.id === skinId)?.cls || 'skin-default';
  const hudLives = h('span', { class: 'hud-lives' });
  const hudCoins = h('span', { class: 'hud-coins' });
  const hudCombo = h('span', { class: 'hud-combo' });
  const hudLeft = h('span', { class: 'hud-left' });
  const hud = h('header', { class: 'hud' },
    h('button', { class: 'hud-exit', type: 'button', 'aria-label': 'やめる', onclick: quit }, '✕'),
    hudLives, hudCoins, hudCombo, hudLeft);
  const board = boardView(st, {
    onSlot,
    onTap: closePopover,
    skin: skinId,
    skinCls,
    coinTarget: hudCoins,
    speed: () => (S().settings.fxFast ? 0.55 : 1),
  });
  const toolbar = h('div', { class: 'toolbar' });
  const predLine = h('div', { class: 'pred-line' });
  const qarea = h('section', { class: 'qarea' });
  // まちがえたときのヒントは盤面の上に重ねる（テンキーの位置を動かさない）
  const hintLayer = h('div', { class: 'hint-layer' });
  el.append(hud, h('div', { class: 'board-row' }, board.el, toolbar, hintLayer), predLine, qarea);
  const closeHint = () => { hintLayer.innerHTML = ''; hintLayer.classList.remove('on'); };

  function paintHud() {
    hudLives.textContent = st.lives === Infinity ? '❤️ ∞' : `❤️ ${st.lives}`;
    hudCoins.textContent = diagMode ? '' : `🪙 ${st.coins}`;
    hudCombo.textContent = st.combo >= 2 ? `🔥${st.combo}` : '';
    hudCombo.classList.toggle('hot', st.combo >= 3);
    hudLeft.textContent = diagMode ? `${Math.min(dIdx, problems.length)}/${problems.length}` : `${MODE_LABEL[mode].replace('ウェーブ', '')} 👾${st.queue.length + E.alive(st).length}`;
    paintTools();
    const canBuild = !diagMode && st.coins >= E.TOWERS.beam.cost && st.slots.some((x) => !x);
    board.el.classList.toggle('can-build', canBuild);
  }

  // ---------- 予測 ----------
  function refreshPrediction() {
    if (diagMode || st.over || !cur || finished) { board.clearPrediction(); predLine.innerHTML = ''; return; }
    const pred = E.predict(st, { targetId: cur.target?.id || null, retry: cur.attempts > 0 });
    board.showPrediction(pred);
    predLine.innerHTML = '';
    const zap = pred.ok.events.find((e) => e.t === 'zap');
    const killed = zap && pred.ok.events.some((e) => e.t === 'kill' && e.id === zap.id && e.src === 'zap');
    const gain = pred.ok.events.find((e) => e.t === 'coins')?.n || 0;
    const target = zap && st.enemies.find((e) => e.id === zap.id);
    const okText = target ? `${enemyLook(target.kind, target.look).emoji}に⚡${zap.dmg}${killed ? ' 撃破!' : ''}` : '';
    const leaks = pred.ng.events.filter((e) => e.t === 'leak').length;
    const moves = pred.ng.events.filter((e) => e.t === 'move').length;
    const ngText = leaks ? `突破される！ ❤️-${leaks}` : moves ? '看守が前進 👣' : 'まだセーフ';
    predLine.append(
      h('span', { class: 'pl ok', title: `+${gain}🪙` }, `⭕ ${okText || `+${gain}🪙`}`),
      h('span', { class: `pl ng${leaks ? ' danger' : ''}` }, `❌ ${ngText}`));
  }

  // ---------- 道具（1回目で説明、2回目で発動）----------
  let armed = null;
  let armTimer = null;
  function paintTools() {
    toolbar.innerHTML = '';
    if (diagMode) return;
    for (const [id, ok] of Object.entries(st.tools)) {
      const t = TOOLS[id];
      toolbar.append(h('button', { class: `tool${armed === id ? ' armed' : ''}`, type: 'button', disabled: !ok || !!st.over, onclick: () => tapTool(id) },
        h('span', {}, t.emoji), h('small', {}, armed === id ? 'もう1回!' : t.name.slice(0, 5))));
    }
    const auto = !!S().settings.autoBuild;
    toolbar.append(h('button', { class: `tool auto${auto ? ' on' : ''}`, type: 'button', 'aria-pressed': String(auto), onclick: toggleAuto },
      h('span', {}, '🏗️'), h('small', {}, auto ? '自動 ON' : '自動 OFF')));
  }
  function tapTool(id) {
    if (armed !== id) {
      armed = id;
      clearTimeout(armTimer);
      armTimer = setTimeout(() => { armed = null; paintTools(); }, 3500);
      sfx('tap');
      toast(`${TOOLS[id].emoji} ${TOOLS[id].name}：${TOOLS[id].desc}（もう1回タップで発動）`, 2200);
      paintTools();
      return;
    }
    armed = null;
    clearTimeout(armTimer);
    board.finish();
    const evs = E.useTool(st, id);
    sfx('tool');
    paintHud();
    board.play(evs, { after: afterPlayback });
  }
  function toggleAuto() {
    S().settings.autoBuild = !S().settings.autoBuild;
    save();
    sfx('tap');
    if (S().settings.autoBuild) autoBuild();
    paintHud();
  }
  function autoBuild() {
    if (diagMode || st.over || !S().settings.autoBuild) return;
    const before = st.built;
    if (E.autoSpend(st)) {
      bump('built', st.built - before);
      sfx('build');
      board.sync(true);
      refreshPrediction();
    }
  }

  // ---------- タワー（その場メニュー・強化はタップ1回）----------
  let pop = null;
  function closePopover() {
    pop?.remove();
    pop = null;
    board.clearRange();
  }
  function onSlot(si, slotEl) {
    if (st.over || diagMode) return;
    board.finish();
    const tw = st.slots[si];
    if (pop && pop.dataset.slot === String(si)) return closePopover();
    closePopover();
    board.showRange(si);
    if (tw) {
      const c = E.upgradeCost(st, si);
      if (c === null) {
        board.floatOnSlot(si, 'MAX!', 'info');
        setTimeout(() => board.clearRange(), 700);
        return;
      }
      if (E.upgrade(st, si)) {
        sfx('upgrade');
        bump('built');
        board.sync(true);
        paintHud();
        refreshPrediction();
      } else board.floatOnSlot(si, `あと🪙${c - st.coins}`, 'info');
      setTimeout(() => board.clearRange(), 700);
      return;
    }
    // 空き地: 3択のミニメニュー
    const b = board.el.getBoundingClientRect();
    const r = slotEl.getBoundingClientRect();
    pop = h('div', { class: 'build-pop', 'data-slot': si, onclick: (e) => e.stopPropagation() },
      Object.entries(E.TOWERS).map(([type, def]) => {
        const can = st.coins >= def.cost;
        return h('button', {
          class: `bp-opt${can ? '' : ' poor'}`,
          type: 'button',
          onclick: () => {
            if (!E.build(st, si, type)) { board.floatOnSlot(si, `あと🪙${def.cost - st.coins}`, 'info'); return; }
            sfx('build');
            bump('built');
            closePopover();
            board.sync(true);
            paintHud();
            refreshPrediction();
          },
        }, h('span', { class: 'bp-art', html: towerSprite(type, 1, skinId) }), h('b', {}, TOWER_LOOK[type].name), h('small', {}, `🪙${def.cost}`));
      }),
      h('div', { class: 'bp-desc' }, '★ビーム=1体に強い ／ ❄️=足止め ／ 💣=まとめて'));
    // 盤面の中で、マスの上か下に出す
    const below = r.top - b.top < b.height / 2;
    pop.style.top = below ? `${r.bottom - b.top + 4}px` : '';
    pop.style.bottom = below ? '' : `${b.bottom - r.top + 4}px`;
    board.el.append(pop);
  }

  async function quit() {
    const ok = await confirmBox('ウェーブを抜ける？', 'ここまでの解答の記録は残るよ。', '抜ける', '続ける');
    if (ok) {
      finished = true;
      board.finish();
      go(diagMode ? 'home' : 'map', { focus: unitId, subject });
    }
  }

  // ---------- 出題 ----------
  function nextProblem() {
    if (finished || ending) return;
    if (diagMode && dIdx >= problems.length) return endWave();
    let target = E.pendingReview(st);
    let p = null;
    if (target) {
      p = makeProblem(target.review.generatorId, target.review.seed);
      if (!p) { target.review.answered = true; target = null; }
    }
    if (!p) p = diagMode ? problems[dIdx++] : picker(st.turn);
    cur = { p, target, attempts: 0 };
    paintHud();
    renderQ();
    if (!board.isBusy()) refreshPrediction();
  }

  function renderQ() {
    const { p } = cur;
    closeHint();
    qarea.innerHTML = '';
    const feedback = h('div', { class: 'feedback' });
    const label = UNIT[p.unit]?.title;
    const pad = answerPad(p, (input) => onSubmit(input, pad, feedback));
    cur.pad = pad;
    const card = problemCard(p, { review: !!cur.target, label: mode !== 'practice' ? label : '' });
    qarea.append(card, feedback, pad.el);
    card.animate([{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'none' }], { duration: 180, easing: 'ease-out' });
  }

  function afterPlayback() {
    paintHud();
    if (st.over) return endWave();
    autoBuild();
    refreshPrediction();
  }

  async function onSubmit(input, pad, feedback) {
    const { p } = cur;
    closePopover();
    closeHint();
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
    if (st.over) ending = true;
    paintHud();
    board.play(evs, { after: afterPlayback });

    if (res.ok) {
      sfx('ok', st.combo || 1);
      if (p.input.kind === 'choice') pad.mark(input, true);
      floatText(qarea, diagMode ? '⭕' : firstTry ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : 'よし、取り返した！', 'good');
      if (st.combo >= 5 && st.combo % 5 === 0) {
        sfx('combo');
        floatText(board.el, `🔥${st.combo}コンボ！`, 'combo');
        document.body.classList.remove('combo-flash');
        void document.body.offsetWidth;
        document.body.classList.add('combo-flash');
      }
      // 演出を待たずに次の問題へ（盤面は裏で動き続ける）
      await sleep(diagMode ? 250 : 160);
      nextProblem();
      return;
    }

    sfx('ng');
    cur.attempts++;
    if (p.input.kind === 'choice') { pad.mark(input, false); pad.disable(input); }
    if (diagMode) {
      floatText(qarea, '✖', 'bad');
      await sleep(300);
      nextProblem();
      return;
    }
    if (ending) return;
    showHint(res.msg);
    void feedback;
  }

  function showHint(msg) {
    const { p } = cur;
    hintLayer.innerHTML = '';
    hintLayer.classList.add('on');
    const box = h('div', { class: 'fb bad' });
    box.append(h('div', { class: 'fb-head' }, cur.attempts === 1 ? '😵 おしい！ 看守が1歩進んだ…' : '😵 まだちがうみたい'));
    if (msg) box.append(h('div', { class: 'fb-msg', rich: msg }));
    if (cur.attempts === 1) {
      box.append(h('div', { class: 'fb-hint', rich: `💡 ${p.hint || ''}` }));
      const stepsBox = h('div', { class: 'fb-steps hidden' }, stepsView(p));
      box.append(stepsBox,
        h('div', { class: 'fb-btns' },
          btn('解き方を見る', (e) => { stepsBox.classList.toggle('hidden'); e.target.remove(); }, 'ghost small'),
          holdBtn('もう一回！', () => { closeHint(); cur.pad.clearMarks(); }, 'primary small')));
      box.append(h('p', { class: 'fb-sub' }, 'このまま下で答えを入れ直してもOK'));
    } else {
      // 2回まちがえたら、解き方と答えを見せて次へ（この問題はあとで再襲来する）
      box.append(h('div', { class: 'fb-sub' }, '解き方はこう👇 この問題はあとで「再襲来」してくるよ。'), stepsView(p), answerLine(p),
        h('div', { class: 'fb-btns' }, holdBtn('わかった！ 次へ', () => nextProblem(), 'primary small')));
      cur.pad.el.classList.add('done');
    }
    hintLayer.append(box);
    hintLayer.animate([{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
  }

  async function endWave() {
    if (finished) return;
    finished = true;
    closePopover();
    board.clearPrediction();
    predLine.innerHTML = '';
    if (diagMode) {
      go('diagnosis', { phase: 'result', results: diag, subject });
      return;
    }
    qarea.classList.add('done');
    const win = st.over === 'win';
    sfx(win ? 'win' : 'lose');
    floatText(board.el, win ? '🎉 ウェーブ突破！' : '💫 つかまった…', win ? 'combo' : 'bad');
    await sleep(1100);
    const summary = finishWave({ mode, unitId, st, asked, firstCorrect, wrongList });
    go('result', { ...summary, subject });
  }

  // 開発用（localhost のときだけ）: 自動テストから現在の問題と盤面を見られるようにする
  if (location.hostname === 'localhost') window.__battle = { cur: () => cur, st, board, show: (p) => { cur = { p, target: null, attempts: 0 }; renderQ(); } };
  nextProblem();
}
