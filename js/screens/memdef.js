// 暗号ディフェンス（暗号室のリアルタイム版）: 右から看守が門へ迫ってくる。先頭の看守の暗号に答えて撃退！
import { h, btn, toast, confirmBox } from '../core/ui.js';
import { S, saveNow, beginSession, tallySession, closeSession } from '../core/store.js';
import { makeRng, newSeed } from '../core/rng.js';
import { checkAnswer } from '../core/check.js';
import { studyBegin, studyEnd } from '../core/timer.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';
import { answerPad } from '../ui/answer.js';
import { bump } from '../game/missions.js';
import { addCard } from '../game/progress.js';
import { claimActivity } from '../game/bonus.js';
import { cardSprite } from '../game/art.js';
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
    // はじめに: ルールとボス
    const rec = S().memory.defense?.[subject];
    el.append(h('div', { class: 'center-col md-intro' },
      h('div', { class: 'big-em' }, '🛡️'),
      h('h2', {}, `暗号ディフェンス｜${sj.name}`),
      h('p', { rich: '看守が右から門へ近づいてくる！\nいちばん前の看守の暗号に正解すると撃退。\nまちがえると、その看守がぐっと前へ。門まで来られたら ❤️ −1' }),
      h('div', { class: 'md-boss' }, h('span', { class: 'md-boss-face', html: cardSprite(boss.card) }), h('div', {}, h('small', {}, `最後に教科のボスが登場（${D.BOSS_HP}回正解で撃破）`), h('b', {}, boss.name))),
      rec && h('p', { class: 'note center' }, `これまでの最高: ${rec.best} 体撃退${rec.wins ? `・ボス撃破 ${rec.wins} 回` : ''}`),
      btn('🛡️ スタート！', () => { el.replaceChildren(); defenseView(el, subject, true); }, 'primary big'),
      btn('🔐 暗号室へ', () => go('memory', { subject }), 'ghost')));
    return;
  }

  const rng = makeRng(newSeed());
  const st = D.createDefense({ subject, pool: D.defensePool(S().memory, subject), rng });
  beginSession({ kind: 'memory', subject: SUBJ_LANG[subject], lesson: 'defense' });
  const total = D.DEF_N + 1;
  const hud = h('span', { class: 'mr-prog' });
  const lane = h('div', { class: 'md-lane' }, h('span', { class: 'md-gate' }, '🚪'), h('span', { class: 'md-cannon' }, '🔫'));
  const qbox = h('div', { class: 'md-q' });
  let paused = false;
  let ended = false;
  el.append(h('header', { class: 'mr-head' },
    h('button', { class: 'hud-exit', type: 'button', 'aria-label': 'やめる', onclick: quit }, '✕'),
    h('b', {}, `🛡️ 暗号ディフェンス｜${sj.name}`), hud), lane, qbox);

  // 看守の見た目（id ごとに1つ）
  const els = new Map();
  function paintLane() {
    const tg = D.targetOf(st);
    for (const e of st.enemies) {
      let o = els.get(e.id);
      if (!o && !e.dead) {
        o = h('div', { class: `md-enemy${e.boss ? ' boss' : ''}` }, h('span', { class: 'md-face', html: e.boss ? cardSprite(boss.card) : e.look }), e.boss ? h('span', { class: 'md-hp' }, h('i')) : null);
        els.set(e.id, o);
        lane.append(o);
      }
      if (!o) continue;
      if (e.dead) {
        if (!o.classList.contains('gone')) { o.classList.add('gone', e.leaked ? 'leak' : 'pop'); setTimeout(() => o.remove(), 450); }
        continue;
      }
      // x=0 が右はし、x=1 が門（左）
      o.style.left = `calc(${(1 - e.x) * 84}% + 30px)`;
      o.classList.toggle('target', e === tg);
      o.classList.toggle('danger', e.x > 0.75);
      if (e.boss) o.querySelector('.md-hp i').style.width = `${(e.hp / e.maxHp) * 100}%`;
    }
    hud.textContent = `❤️ ${'♥'.repeat(Math.max(0, st.lives))}${'♡'.repeat(Math.max(0, D.DEF_LIVES - st.lives))}　撃退 ${st.kills}/${total}`;
  }

  // 先頭の看守の暗号を出す（先頭が変わったら出しなおす）
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
        toast(`正解: ${card.kind === 'term' ? card.q : card.a}`, 1400);
      }
      paintLane();
      // 正解はすぐ次へ、まちがいは答えを見る時間を少し
      setTimeout(() => { busy = false; shownKey = null; paintQ(); }, r.ok ? 250 : 1100);
      if (st.over) finish();
    }, { fire: '決定' });
    qbox.replaceChildren(h('div', { class: `mr-card md-card${tg.boss ? ' boss' : ''}` }, h('div', { class: `mr-word ${card.kind === 'term' ? 'ja' : 'en'}${q.stem.length > 14 ? ' long' : ''}` }, q.stem), h('small', { class: 'mr-ask' }, tg.boss ? `ボスの暗号（あと ${tg.hp} 回）: ${q.ask}` : q.ask)), pad.el);
  }
  // 撃つ演出（大砲 → 看守）
  function beam(e) {
    const o = els.get(e.id);
    if (!o) return;
    const b = h('span', { class: 'md-beam' });
    b.style.width = o.style.left;
    lane.append(b);
    setTimeout(() => b.remove(), 260);
    o.classList.remove('hit');
    void o.offsetWidth;
    o.classList.add('hit');
  }

  // 時間を進める（画面が見えていないときは止める）
  // 50ms ごと（requestAnimationFrame は画面の状態で止まることがあるので setInterval）
  let last = performance.now();
  const iv = setInterval(() => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (ended || !el.isConnected) return clearInterval(iv);
    if (paused || document.hidden) return;
    const ev = D.tick(st, dt);
    if (ev.some((x) => x.t === 'leak')) { sfx('ng'); lane.classList.remove('shake'); void lane.offsetWidth; lane.classList.add('shake'); }
    if (ev.some((x) => x.t === 'boss')) { sfx('combo'); toast(`⚠️ ${boss.name} があらわれた！`, 1600); }
    paintLane();
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
