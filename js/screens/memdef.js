// 暗号ディフェンス（暗号室のリアルタイム版）: 3本のレーンを看守が門へ迫ってくる。暗号に答えて撃退！
//   看守をタップすると、その看守の暗号に切りかわる。正解でゲージがたまると、なかまが門から出撃
import { h, btn, toast, confirmBox } from '../core/ui.js';
import { S, saveNow, beginSession, tallySession, closeSession } from '../core/store.js';
import { makeRng, newSeed } from '../core/rng.js';
import { checkAnswer } from '../core/check.js';
import { studyBegin, studyEnd } from '../core/timer.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';
import { answerPad } from '../ui/answer.js';
import { bump } from '../game/missions.js';
import { addCard, party, towerSkin } from '../game/progress.js';
import { claimActivity } from '../game/bonus.js';
import { cardSprite, enemySprite, towerSprite, spriteHTML, bgUrl } from '../game/art.js';
import { CARDS as GAME_CARDS } from '../game/content.js';
import { bonusChips } from './result.js';
import { flyGems } from '../ui/gems.js';
import { MEM_SUBJECTS } from '../memory/engine.js';
import * as D from '../memory/defense.js';

const SUBJ_LANG = { en: 'english', soc: 'social', sci: 'science' };

export function defenseView(el, subject, started = false) {
  const boss = D.MEM_BOSS[subject];
  const sj = MEM_SUBJECTS[subject];
  el.classList.add('mem-rush-screen');
  if (!started) {
    // はじめに: ルールとボス・連れていくなかま
    const rec = S().memory.defense?.[subject];
    const pt = party();
    el.append(h('div', { class: 'center-col md-intro' },
      h('div', { class: 'big-em' }, '🛡️'),
      h('h2', {}, `暗号ディフェンス｜${sj.name}`),
      h('p', { rich: '3本の道を、看守がまとめて門へせまってくる！\nねらっている看守（▼）の暗号に正解すると撃退。看守をタップすると、ねらいを変えられる。\nまちがえると、その看守がぐっと前へ。門まで来られたら ❤️ −1' }),
      h('div', { class: 'md-boss' }, h('span', { class: 'md-boss-face', html: cardSprite(boss.card) }), h('div', {}, h('small', {}, `最後に教科のボスが登場（${D.BOSS_HP}回正解で撃破）`), h('b', {}, boss.name))),
      pt.length
        ? h('div', { class: 'md-boss md-party' }, ...pt.map((id) => h('span', { class: 'md-boss-face sm', html: cardSprite(id) })), h('div', {}, h('small', {}, '正解でゲージがたまると、門から出撃して看守をたおす（チケットは使わない）'), h('b', {}, '🤝 なかまもいっしょ')))
        : h('p', { class: 'note center' }, '🤝 コレクションで「なかま」を入れると、ここでも出撃してくれるよ'),
      rec && h('p', { class: 'note center' }, `これまでの最高: ${rec.best} 体撃退${rec.wins ? `・ボス撃破 ${rec.wins} 回` : ''}`),
      btn('🛡️ スタート！', () => { el.replaceChildren(); defenseView(el, subject, true); }, 'primary big'),
      btn('🔐 暗号室へ', () => go('memory', { subject }), 'ghost')));
    return;
  }

  const rng = makeRng(newSeed());
  const st = D.createDefense({ subject, pool: D.defensePool(S().memory, subject), rng, party: party() });
  beginSession({ kind: 'memory', subject: SUBJ_LANG[subject], lesson: 'defense' });
  const total = D.DEF_N + 1;
  const hud = h('span', { class: 'mr-prog' });
  // 門（砦）と大砲: 画像があれば画像、なければ CSS の石の門
  const fort = h('div', { class: 'md-fort', html: `${spriteHTML('def-gate', '', '門', 'md-gate-img')}<span class="md-cannon">${towerSprite('beam', 2, towerSkin('beam').id)}</span>` });
  const field = h('div', { class: 'md-field' }, ...[0, 1, 2].map((l) => h('div', { class: 'md-row', style: { top: `${l * 33.33}%` } })), fort);
  const bg = bgUrl('bg-defense');
  if (bg) field.style.backgroundImage = `linear-gradient(#0b071666, #0b071699), url(${bg})`;
  const allyBar = h('div', { class: 'md-allies' });
  const qbox = h('div', { class: 'md-q' });
  let paused = false;
  let ended = false;
  el.append(h('header', { class: 'mr-head' },
    h('button', { class: 'hud-exit', type: 'button', 'aria-label': 'やめる', onclick: quit }, '✕'),
    h('b', {}, `🛡️ 暗号ディフェンス｜${sj.name}`), hud), field, allyBar, qbox);

  // 看守・なかまの見た目（id ごとに1つ）
  const els = new Map();
  const allyEls = new Map();
  const leftOf = (x) => `calc(${(1 - x) * 78}% + 56px)`;
  function paintField() {
    const tg = D.targetOf(st);
    for (const e of st.enemies) {
      let o = els.get(e.id);
      if (!o && !e.dead) {
        o = h('button', { class: `md-enemy${e.boss ? ' boss' : ''}`, type: 'button', 'aria-label': '看守', onclick: () => { D.selectTarget(st, e.id); sfx('tap'); shownKey = null; paintQ(); paintField(); } },
          h('span', { class: 'md-face', html: e.boss ? cardSprite(boss.card) : enemySprite(e.kind) }), e.boss ? h('span', { class: 'md-hp' }, h('i')) : null);
        o.style.top = `${e.lane * 33.33 + 16.66}%`;
        els.set(e.id, o);
        field.append(o);
      }
      if (!o) continue;
      if (e.dead) {
        if (!o.classList.contains('gone')) { o.classList.add('gone', e.leaked ? 'leak' : 'pop'); setTimeout(() => o.remove(), 450); }
        continue;
      }
      o.style.left = leftOf(e.x);
      o.classList.toggle('target', e === tg);
      o.classList.toggle('danger', e.x > 0.75);
      if (e.boss) o.querySelector('.md-hp i').style.width = `${(e.hp / e.maxHp) * 100}%`;
    }
    for (const a of st.allies) {
      let o = allyEls.get(a.key);
      if (!o && !a.dead) {
        o = h('div', { class: 'md-ally', html: cardSprite(a.id) });
        o.style.top = `${a.lane * 33.33 + 16.66}%`;
        allyEls.set(a.key, o);
        field.append(o);
      }
      if (!o) continue;
      if (a.dead) { if (!o.classList.contains('gone')) { o.classList.add('gone'); setTimeout(() => o.remove(), 400); } continue; }
      o.style.left = leftOf(a.x);
    }
    hud.textContent = `❤️ ${'♥'.repeat(Math.max(0, st.lives))}${'♡'.repeat(Math.max(0, D.DEF_LIVES - st.lives))}　撃退 ${st.kills}/${total}`;
    paintAllies();
  }
  // なかまの出撃ボタン（ゲージつき）
  let allySig = '';
  function paintAllies() {
    if (!st.party.length) return;
    const sig = `${st.gauge}|${Object.keys(st.used).join()}`;
    if (sig === allySig) return;
    allySig = sig;
    allyBar.replaceChildren(...st.party.map((id) => {
      const c = GAME_CARDS.find((x) => x.id === id);
      const need = D.allyNeed(id);
      const ok = D.canDeploy(st, id);
      return h('button', { class: `md-abtn${ok ? ' ready' : ''}`, type: 'button', disabled: !ok, onclick: () => deploy(id) },
        h('span', { class: 'md-aface', html: cardSprite(id) }),
        h('span', { class: 'md-acol' }, h('small', {}, st.used[id] ? '出撃ずみ' : ok ? '出撃！' : `${Math.min(st.gauge, need)}/${need}`), h('span', { class: 'md-gauge' }, h('i', { style: { width: `${st.used[id] ? 0 : Math.min(1, st.gauge / need) * 100}%` } })), h('b', {}, c.name)));
    }));
  }
  function deploy(id) {
    const a = D.deployAlly(st, id);
    if (!a) return;
    sfx('combo');
    toast(`🤝 ${GAME_CARDS.find((x) => x.id === id).name} 出撃！`, 1200);
    allySig = '';
    paintField();
  }

  // ねらっている看守の暗号を出す（ねらいが変わったら出しなおす）
  let shownKey = null;
  let busy = false;
  function paintQ() {
    const tg = D.targetOf(st);
    const key = tg ? `${tg.id}:${tg.card}` : null;
    if (key === shownKey || busy) return;
    shownKey = key;
    if (!tg) { qbox.replaceChildren(h('p', { class: 'note center md-wait' }, st.bossSpawned ? '' : '…つぎの看守が来るぞ')); return; }
    const { card, q } = D.defQuestion(st, tg);
    if (location.hostname === 'localhost') window.__def = { st, q }; // 開発用（自動テスト）
    studyBegin(30);
    const pad = answerPad(q, (input) => {
      const r = checkAnswer(q, input);
      if (r.invalid) return;
      busy = true;
      pad.mark(input, r.ok);
      if (!r.ok) pad.mark(q.input.answer, true);
      tallySession(r.ok);
      const ev = D.answerDef(st, r.ok);
      if (r.ok) {
        bump('correct');
        sfx(ev.some((x) => x.t === 'kill') ? 'ok' : 'tap', 3);
        beam(tg);
      } else {
        sfx('ng');
        toast(`正解: ${q.answerText}`, 1400);
      }
      paintField();
      // 正解はすぐ次へ、まちがいは答えを見る時間を少し
      setTimeout(() => { busy = false; shownKey = null; paintQ(); }, r.ok ? 250 : 1100);
      if (st.over) finish();
    }, { fire: '決定' });
    const long = q.stem.length > 14;
    qbox.replaceChildren(h('div', { class: `mr-card md-card${tg.boss ? ' boss' : ''}` },
      h('div', { class: `mr-word ${card.kind === 'term' || tg.form === 'j2e' ? 'ja' : 'en'}${long ? ' long' : ''}` }, q.stem),
      h('small', { class: 'mr-ask' }, tg.boss ? `ボスの暗号（あと ${tg.hp} 回）: ${q.ask}` : q.ask)), pad.el);
  }
  // 大砲 → 看守のビーム
  function beam(e) {
    const o = els.get(e.id);
    if (!o) return;
    const fr = field.getBoundingClientRect();
    const r = o.getBoundingClientRect();
    const b = h('span', { class: 'md-beam' });
    const x1 = 50, y1 = fr.height / 2, x2 = r.left - fr.left + r.width / 2, y2 = r.top - fr.top + r.height / 2;
    b.style.left = `${x1}px`;
    b.style.top = `${y1}px`;
    b.style.width = `${Math.hypot(x2 - x1, y2 - y1)}px`;
    b.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
    field.append(b);
    setTimeout(() => b.remove(), 260);
    o.classList.remove('hit');
    void o.offsetWidth;
    o.classList.add('hit');
  }

  // 50ms ごと（requestAnimationFrame は画面の状態で止まることがあるので setInterval）。画面が裏のときは止める
  let last = performance.now();
  const iv = setInterval(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (ended || !el.isConnected) return clearInterval(iv);
    if (paused || document.hidden) return;
    const ev = D.tick(st, dt);
    if (ev.some((x) => x.t === 'leak')) { sfx('ng'); field.classList.remove('shake'); void field.offsetWidth; field.classList.add('shake'); }
    if (ev.some((x) => x.t === 'boss')) { sfx('combo'); toast(`⚠️ ${boss.name} があらわれた！`, 1600); }
    if (ev.some((x) => x.t === 'ally-hit')) sfx('hit');
    paintField();
    paintQ();
    if (st.over) { clearInterval(iv); finish(); }
  }, 50);

  async function quit() {
    paused = true;
    if (await confirmBox('やめる？', 'ここまでの正解は記録されているよ。', 'やめる', '続ける')) {
      ended = true;
      studyEnd();
      closeSession('quit');
      go('memory', { subject });
      return;
    }
    last = performance.now();
    paused = false;
  }

  function finish() {
    if (ended) return;
    ended = true;
    studyEnd();
    const win = st.over === 'win';
    const M = S().memory;
    const rec = ((M.defense ||= {})[subject] ||= { best: 0, wins: 0 });
    rec.best = Math.max(rec.best, st.kills);
    if (win) rec.wins++;
    const gems = D.defGems(st);
    S().gems += gems;
    // ボスを倒すとボスカード（2回目からは召喚チケット +1）
    const card = win ? boss.card : null;
    const isNew = card ? addCard(card) : false;
    const bonus = claimActivity('memory');
    closeSession(win ? 'clear' : 'fail');
    saveNow();
    sfx(win ? 'win' : 'ng');
    const gemEl = h('p', { class: 'note center' }, `💎 +${gems}`);
    setTimeout(() => {
      el.replaceChildren(h('div', { class: 'center-col' },
        h('div', { class: 'big-em' }, win ? '🏆' : '💥'),
        h('h2', {}, win ? `${boss.name} 撃破！` : '門を突破された…'),
        h('p', {}, `撃退 ${st.kills} / ${total}　正解 ${st.answered - st.misses} / ${st.answered}`),
        gemEl,
        bonusChips(bonus),
        card && h('div', { class: 'md-boss got' }, h('span', { class: 'md-boss-face', html: cardSprite(card) }), h('div', {}, h('small', {}, isNew ? '🃏 新カード！ なかまにすると必殺技' : '🃏 ボスカード（召喚チケット +1）'), h('b', {}, boss.name))),
        btn('🛡️ もう1回', () => go('memory', { phase: 'defense', subject }), 'primary big'),
        btn('🔐 暗号室へ', () => go('memory', { subject }), 'ghost')));
      flyGems(gems + (bonus?.gems || 0), gemEl, 400);
    }, 700);
  }
}
