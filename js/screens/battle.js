// バトル画面（ウェーブ）: 盤面 + 予測 + 問題 + 入力 + タワー建設 + 道具
// 答えたらエンジンの状態はすぐ確定。盤面の演出は裏で再生し、正解ならすぐ次の問題を出す（待たせない）
import { h, btn, readBtn, modal, toast, floatText, sleep, confirmBox } from '../core/ui.js';
import * as E from '../game/engine.js';
import { practiceSchedule, bossSchedule, diagnosisSchedule, makePicker, practicePool, bossPoolOf } from '../game/waves.js';
import { makeProblem, UNIT } from '../units/registry.js';
import { checkAnswer } from '../core/check.js';
import { S, recordAnswer, unitState, save, beginSession, closeSession } from '../core/store.js';
import { studyBegin, studyEnd, studyPause, studyResume, idleFor } from '../core/timer.js';
import { problemCard, answerPad, stepsView, answerLine } from '../ui/answer.js';
import { askBtn } from '../ui/asklater.js';
import { boardView } from '../ui/board.js';
import { TOOLS, TOWER_LOOK, CARDS } from '../game/content.js';
import { towerSprite, enemyLook, cardSprite } from '../game/art.js';
import { sfx } from '../core/sound.js';
import { bump } from '../game/missions.js';
import { go } from '../core/router.js';
import { finishWave, pickReviews, towerSkin, party, tickets, useTicket, equippedTool, useConsumable } from '../game/progress.js';

const MODE_LABEL = { practice: '練習ウェーブ', boss: 'ボスウェーブ', review: 'リベンジウェーブ', diagnosis: '看守チェック' };
// 放置の見張り: この時間さわらないと「寝てない？」と聞き、さらに IDLE_GRACE 秒こたえがなければウェーブを抜ける
const IDLE_WARN = 3 * 60 * 1000;
const IDLE_GRACE = 60;
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
  // 道具は1つだけ持っていける（コレクションでえらんだもの）
  const tool = equippedTool();
  const st = E.createBattle({ mode, schedule, tools: mode === 'diagnosis' || !tool ? [] : [tool] });
  const diagMode = mode === 'diagnosis';
  beginSession({ kind: mode, subject, unit: unitId });

  let asked = 0;
  let firstCorrect = 0;
  const wrongList = [];
  const diag = {}; // unit -> {ok, n}
  let cur = null;
  let finished = false;
  let ending = false;

  // ---------- 画面 ----------
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
    skinFor: towerSkin,
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
    if (!diagMode) paintReserve();
    hudLives.textContent = st.lives === Infinity ? '❤️ ∞' : `❤️ ${st.lives}`;
    hudCoins.textContent = diagMode ? '' : `🪙 ${st.coins}`;
    hudCombo.textContent = st.combo >= 2 ? `⚡${st.combo}` : '';
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

  // ---------- 道具・なかま（1回目で説明、2回目で発動）----------
  const allies = diagMode ? [] : [...party()];
  let armed = null;
  let armTimer = null;
  let placing = null; // タワー型のなかまを置くマスをえらんでいる途中
  function paintTools() {
    toolbar.innerHTML = '';
    if (diagMode) return;
    // なかま: 正解でゲージがたまったら呼べる（チケットを1枚使う。1ウェーブに1体1回）
    for (const id of allies) {
      const n = tickets()[id] || 0;
      const used = !!st.summoned?.[id];
      const ready = !used && n > 0 && E.canSummon(st, id);
      const key = `ally:${id}`;
      toolbar.append(h('button', { class: `tool ally${ready ? ' ready' : ''}${armed === key || placing === id ? ' armed' : ''}`, type: 'button', disabled: used || n <= 0 || !!st.over, onclick: () => tapAlly(id) },
        h('span', { class: 'ally-face', html: cardSprite(id) }),
        h('span', { class: 'ally-gauge' }, h('i', { style: { width: `${Math.min(1, (st.gauge || 0) / E.gaugeNeed(id)) * 100}%` } })),
        h('small', {}, placing === id ? 'マスをえらぶ' : armed === key ? 'もう1回!' : used ? '出番ずみ' : n <= 0 ? 'チケット0' : ready ? `よべる! ×${n}` : `${st.gauge || 0}/${E.gaugeNeed(id)} ×${n}`)));
    }
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
    useConsumable(id); // へそくりは使い捨て（1枚へる）
    sfx('tool');
    castFx(board.el, { em: TOOLS[id].emoji, name: TOOLS[id].name, kind: 'tool' });
    paintHud();
    board.play(evs, { after: afterPlayback });
  }
  function tapAlly(id) {
    const c = CARDS.find((x) => x.id === id);
    const key = `ally:${id}`;
    if (placing) { const was = placing; cancelPlace(); toast('置くのをやめた'); if (was === id) return; }
    if (armed !== key) {
      armed = key;
      clearTimeout(armTimer);
      armTimer = setTimeout(() => { armed = null; paintTools(); }, 3500);
      sfx('tap');
      toast(E.canSummon(st, id) ? `${c.name}：${E.SUMMON[id].desc}（もう1回タップで召喚）` : `${c.name}：${E.SUMMON[id].desc}（正解 ${E.gaugeNeed(id)} 回でゲージ満タン）`, 2400);
      paintTools();
      return;
    }
    armed = null;
    clearTimeout(armTimer);
    if (!E.canSummon(st, id)) { paintTools(); return; }
    if ((tickets()[id] || 0) <= 0) { toast('チケットがない…ガチャで仲間を増やそう'); paintTools(); return; }
    // タワー型: 置くマスをえらぶ（空いているマスをタップ）
    if (E.needsPlace(st, id)) {
      closePopover();
      placing = id;
      board.el.classList.add('placing');
      sfx('tap');
      toast(`🏰 ${c.name} をどこに置く？ 光っている空きマスをタップ（もう1回なかまをタップでやめる）`, 2600);
      paintTools();
      return;
    }
    doSummon(id);
  }
  function cancelPlace() {
    placing = null;
    board.el.classList.remove('placing');
    paintTools();
  }
  function doSummon(id, opt = {}) {
    const c = CARDS.find((x) => x.id === id);
    cancelPlace();
    if (!E.canSummon(st, id)) return;
    if (!useTicket(id)) { toast('チケットがない…ガチャで仲間を増やそう'); return; }
    board.finish();
    const evs = E.summon(st, id, opt);
    sfx('combo');
    castFx(board.el, { art: cardSprite(id), name: `${c.name} 参上！`, kind: 'ally' });
    paintHud();
    board.play(evs, { after: afterPlayback });
  }
  // 自動建設の設定（ウェーブをまたいで保存）: ON/OFF・優先タワー・自動強化・予約建設
  function autoCfg() { return (S().settings.autoCfg ||= { prio: 'mix', upgrade: true, reserve: {} }); }
  const PRIO_LABEL = { mix: '🔀 ミックス', beam: `${TOWER_LOOK.beam.emoji} ビーム`, frost: `${TOWER_LOOK.frost.emoji} こおり`, bomb: `${TOWER_LOOK.bomb.emoji} ばくだん` };
  // 予約したマス（まだ建っていない）に、うすくタワーの絵文字を出す
  function paintReserve() {
    const R = autoCfg().reserve;
    E.SLOTS.forEach((_, i) => {
      const el = board.slotEl(i);
      if (!el) return;
      if (R[i] && !st.slots[i]) el.dataset.res = TOWER_LOOK[R[i]].emoji;
      else delete el.dataset.res;
    });
  }
  function toggleAuto() {
    sfx('tap');
    const c = autoCfg();
    const body = h('div', { class: 'auto-cfg' });
    const paint = () => {
      const on = !!S().settings.autoBuild;
      const nRes = Object.values(c.reserve).filter(Boolean).length;
      const seg = (items, cur, set) => h('div', { class: 'ac-seg' }, items.map(([v, label]) => h('button', { class: `ac-opt${cur === v ? ' on' : ''}`, type: 'button', onclick: () => { set(v); save(); sfx('tap'); paint(); } }, label)));
      body.replaceChildren(
        h('b', {}, '自動建設'), seg([[true, 'ON'], [false, 'OFF']], on, (v) => { S().settings.autoBuild = v; }),
        h('b', {}, '優先タワー（予約していないマス）'), seg(E.AUTO_PRIO.map((p) => [p, PRIO_LABEL[p]]), c.prio, (v) => { c.prio = v; }),
        h('b', {}, '自動アップグレード（マスが全部うまったら強化）'), seg([[true, 'する'], [false, 'しない']], c.upgrade !== false, (v) => { c.upgrade = v; }),
        h('b', {}, `📌 予約建設（${nRes}マス）`),
        h('small', { class: 'note' }, '空きマスをタップ →「📌 予約」で「ここにこれを建てる」を決められる。予約したマスがいちばん先（コインが足りなければ、ためて待つ）。'),
        nRes > 0 ? btn('予約を全部けす', () => { c.reserve = {}; save(); paintReserve(); paint(); }, 'ghost small') : '');
    };
    paint();
    modal({ title: '🏗️ 自動建設の設定', body, buttons: [{ label: 'とじる', value: true, cls: 'primary' }] }).then(() => {
      if (S().settings.autoBuild) autoBuild();
      paintHud();
    });
  }
  function autoBuild() {
    if (diagMode || st.over || !S().settings.autoBuild) return;
    const before = st.built;
    if (E.autoSpend(st, autoCfg())) {
      bump('built', st.built - before);
      sfx('build');
      board.sync(true);
      paintReserve();
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
    if (placing) {
      if (tw && st.slots.some((x) => !x)) { board.floatOnSlot(si, 'うまってる', 'info'); return; }
      return doSummon(placing, { slot: si });
    }
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
        }, h('span', { class: 'bp-art', html: towerSprite(type, 1, towerSkin(type).id) }), h('b', {}, TOWER_LOOK[type].name), h('small', {}, `🪙${def.cost}`));
      }),
      // 予約建設: ここに建てるタワーを決めておく（自動建設がいちばん先に建てる。次のウェーブでも同じマスに）
      h('div', { class: 'bp-res' }, h('small', {}, '📌 予約'),
        ...Object.keys(E.TOWERS).map((type) => h('button', { class: `bp-rbtn${autoCfg().reserve[si] === type ? ' on' : ''}`, type: 'button', onclick: () => {
          const R = autoCfg().reserve;
          R[si] = R[si] === type ? null : type;
          save();
          sfx('tap');
          closePopover();
          paintReserve();
          if (R[si] && !S().settings.autoBuild) toast('📌 予約した！ 自動建設をONにすると、ここに建てるよ', 2200);
          autoBuild();
        } }, TOWER_LOOK[type].emoji))),
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
    studyBegin(180);
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
    recordAnswer({ unit: p.unit, generatorId: p.generatorId, seed: p.seed, correct: res.ok, firstTry, review: !!cur.target, noReview: diagMode }); // 看守チェックのミスはリベンジに回さない（いきなり大量にたまって落ちこむので）
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
        floatText(board.el, `⚡${st.combo}コンボ！`, 'combo');
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
          btn('解き方を見る', (e) => { stepsBox.classList.toggle('hidden'); e.target.remove(); stepsBox.append(askBtn(p, 'ウェーブ')); }, 'ghost small'),
          btn('もう一回！', () => { closeHint(); cur.pad.clearMarks(); }, 'primary small')));
      box.append(h('p', { class: 'fb-sub' }, 'このまま下で答えを入れ直してもOK'));
    } else {
      // 2回まちがえたら、解き方と答えを見せて次へ（この問題はあとでリベンジおばけになる）
      box.append(h('div', { class: 'fb-sub' }, '解き方はこう👇 この問題はあとで「リベンジおばけ」になって戻ってくるよ。'), stepsView(p), answerLine(p), askBtn(p, 'ウェーブ'),
        h('div', { class: 'fb-btns' }, readBtn('わかった！ 次へ', () => nextProblem(), 'primary small', 3000)));
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
      studyEnd();
      closeSession('clear');
      go('diagnosis', { phase: 'result', results: diag, subject, misses: wrongList });
      return;
    }
    qarea.classList.add('done');
    const win = st.over === 'win';
    sfx(win ? 'win' : 'lose');
    floatText(board.el, win ? '🎉 ウェーブ突破！' : '💫 つかまった…', win ? 'combo' : 'bad');
    await sleep(1100);
    studyEnd();
    closeSession(diagMode ? 'clear' : win ? 'win' : 'lose');
    const summary = finishWave({ mode, unitId, st, asked, firstCorrect, wrongList });
    go('result', { ...summary, subject });
  }

  // ---------- 放置の見張り ----------
  let idleOpen = false;
  const watch = setInterval(async () => {
    if (!el.isConnected || finished) return clearInterval(watch);
    if (idleOpen || document.visibilityState === 'hidden' || idleFor() < IDLE_WARN) return;
    idleOpen = true;
    studyPause();
    let left = IDLE_GRACE;
    const cnt = h('b', {}, String(left));
    let closeIt = null;
    const tick = setInterval(() => {
      left--;
      cnt.textContent = String(left);
      if (left <= 0) closeIt?.('idle');
    }, 1000);
    const ans = await modal({
      title: '😴 寝てない？',
      body: h('div', { class: 'modal-body center' }, h('p', {}, 'しばらく操作がないよ。'), h('p', {}, cnt, ' 秒たつと、このウェーブを自動で抜けるよ。')),
      buttons: [{ label: '抜ける', value: 'quit' }, { label: 'まだやる！', value: 'go', cls: 'primary' }],
      dismissable: false,
      ctl: (c) => { closeIt = c; },
    });
    clearInterval(tick);
    idleOpen = false;
    if (finished) return;
    if (ans === 'go') return studyResume();
    finished = true;
    clearInterval(watch);
    board.finish();
    closeSession(ans === 'idle' ? 'idle' : 'quit');
    if (ans === 'idle') toast('しばらく操作がなかったので、ウェーブを抜けたよ', 3200);
    go(diagMode ? 'home' : 'map', { focus: unitId, subject });
  }, 5000);

  // 開発用（localhost のときだけ）: 自動テストから現在の問題と盤面を見られるようにする
  if (location.hostname === 'localhost') window.__battle = { cur: () => cur, st, board, show: (p) => { cur = { p, target: null, attempts: 0 }; renderQ(); } };
  nextProblem();
}

// 仲間・道具を使ったときの演出: 盤面の上に大きく出して、光の輪とキラキラ
function castFx(boardEl, { art = '', em = '', name, kind }) {
  const fx = h('div', { class: `cast-fx cf-${kind}`, 'aria-hidden': 'true' },
    h('i', { class: 'cf-ring' }), h('i', { class: 'cf-ring r2' }),
    ...Array.from({ length: 8 }, (_, k) => h('i', { class: 'cf-spark', style: { '--a': `${k * 45}deg` } })),
    art ? h('span', { class: 'cf-art', html: art }) : h('span', { class: 'cf-em' }, em),
    h('b', { class: 'cf-name' }, name));
  boardEl.append(fx);
  setTimeout(() => fx.remove(), 1500);
}
