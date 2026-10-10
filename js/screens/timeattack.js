// タイムアタック（数学）: 10問を紙とペンで解いて、かかった時間をきそう。まちがえると +10秒
// 入試本番のように「ノートに書いて解く」くせをつける。単元ごとにベスト記録が残る
import { h, btn, toast, confirmBox } from '../core/ui.js';
import { rich } from '../core/mathml.js';
import { S, saveNow, recordAnswer, beginSession, tallySession, closeSession, unitState } from '../core/store.js';
import { checkAnswer } from '../core/check.js';
import { studyBegin, studyEnd } from '../core/timer.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';
import { problemCard, answerPad } from '../ui/answer.js';
import { UNIT } from '../units/registry.js';
import { makePicker, practicePool } from '../game/waves.js';
import { claimActivity, repeatMult } from '../game/bonus.js';
import { flyGems } from '../ui/gems.js';
import { paperCheck, countdown } from '../ui/ready.js';
import { topBar } from './home.js';
import { bonusChips } from './result.js';
import { backdrop, confetti } from '../ui/deco.js';

export const TA_N = 10;
export const TA_PENALTY = 10; // まちがえたら +10秒
// 目安の時間（1問あたり、むずかしさ別の秒）。これより速ければ A、6割なら S
const PER = { 1: 30, 2: 45, 3: 60 };
const fmt = (ms) => { const t = Math.max(0, ms) / 1000; return `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`; };
export const taBest = (unit) => S().timeAttack?.[unit] || null;

// マップから: 紙とペンの確認 → 3・2・1 → スタート
export async function startTimeAttack(unit) {
  const best = taBest(unit)?.best;
  const ok = await paperCheck({
    title: `⏱ タイムアタック｜${UNIT[unit].title}`,
    lines: [`<b>${TA_N}問</b>を解くまでの時間をきそう。まちがえると <b>+${TA_PENALTY}秒</b>`, '途中の式はノートに書く（暗算でとばさない）', best ? `いまのベスト: <b>${fmt(best)}</b>` : 'はじめての挑戦。まずは記録をつくろう'],
  });
  if (!ok) return;
  await countdown('スタート！');
  go('timeattack', { unit });
}

export function render(el, { unit }) {
  const u = UNIT[unit];
  const picker = makePicker(practicePool(unit, unitState(unit).lessons));
  const t0 = Date.now();
  let k = 0;
  let penalty = 0;
  let ok = 0;
  let done = false;
  let target = 0;
  let paused = 0; // 正解を見せている間は時計を止める
  const misses = [];
  beginSession({ kind: 'timeattack', subject: 'math', unit });

  const clock = h('span', { class: 'ta-clock' });
  const prog = h('span', { class: 'mr-prog' });
  const area = h('div', { class: 'ta-area' });
  el.append(h('header', { class: 'mr-head' },
    h('button', { class: 'hud-exit', type: 'button', 'aria-label': 'やめる', onclick: quit }, '✕'),
    h('b', {}, `⏱ ${u.title}`), prog, clock), area);
  const now = () => Date.now() - t0 - paused + penalty * 1000;
  const iv = setInterval(() => { if (!el.isConnected || done) return clearInterval(iv); clock.textContent = fmt(now()); }, 100);

  async function quit() {
    if (await confirmBox('タイムアタックをやめる？', '記録は残らないよ。', 'やめる', '続ける')) { done = true; go('map', { focus: unit }); }
  }

  function next() {
    if (k >= TA_N) return finish();
    const p = picker(k);
    target += PER[p.difficulty] || 45;
    k++;
    prog.textContent = `${k}/${TA_N}`;
    studyBegin(180);
    let first = true;
    const fb = h('div', { class: 'feedback' });
    const pad = answerPad(p, async (input) => {
      const r = checkAnswer(p, input);
      if (r.invalid || r.nearly) { toast(r.msg, 2200); return; }
      if (first) {
        first = false;
        recordAnswer({ unit: p.unit, generatorId: p.generatorId, seed: p.seed, correct: r.ok, firstTry: true });
      }
      if (r.ok) {
        ok++;
        sfx('ok');
        next();
        return;
      }
      // まちがい: +10秒。正解を少し見せて次へ（解き直しはしない）
      sfx('ng');
      penalty += TA_PENALTY;
      misses.push(p);
      if (p.input.kind === 'choice') pad.mark(input, false);
      fb.replaceChildren(h('div', { class: 'fb bad' }, h('div', { class: 'fb-head' }, `😵 +${TA_PENALTY}秒`), h('div', { class: 'answer-line', html: `正解: ${rich(p.answerText)}` })));
      pad.el.classList.add('done');
      await new Promise((res) => setTimeout(res, 1400));
      paused += 1400;
      next();
    }, { fire: '決定' });
    area.replaceChildren(problemCard(p, { label: `第${k}問` }), fb, pad.el);
    if (location.hostname === 'localhost') window.__ta = { p, pad }; // 開発用（自動テスト）
    window.scrollTo(0, 0);
  }

  function finish() {
    done = true;
    clearInterval(iv);
    studyEnd();
    const ms = now();
    const s = S();
    const rec = ((s.timeAttack ||= {})[unit] ||= { best: null, runs: 0 });
    rec.runs++;
    rec.last = ms;
    // ベストは8問以上正解のときだけ（速さだけで雑にならないように）
    const counts = ok >= TA_N - 2;
    const isBest = counts && (!rec.best || ms < rec.best);
    if (isBest) rec.best = ms;
    const rank = ok === TA_N && ms <= target * 600 ? 'S' : counts && ms <= target * 1000 ? 'A' : 'B';
    const rep = repeatMult(`ta:${unit}`); // 同じ単元のくり返しは💎がへる
    const gems = Math.max(1, Math.round((5 + ok) * rep.mult));
    s.gems += gems;
    for (let i = 0; i < ok; i++) tallySession(true);
    const bonus = claimActivity('timeattack');
    closeSession('clear');
    saveNow();
    sfx('win');
    el.replaceChildren();
    backdrop(el, isBest ? 'win' : 'desk');
    const gemEl = h('p', { class: 'note center' }, `💎 +${gems}`);
    el.append(topBar(() => go('map', { focus: unit })),
      h('div', { class: 'ta-result' },
        isBest && confetti(),
        h('div', { class: 'ex-score' },
          h('div', { class: 'es-main' },
            h('small', {}, `⏱ タイムアタック｜${u.title}`),
            h('div', { class: 'es-num' }, h('b', {}, fmt(ms))),
            h('small', {}, `正解 ${ok}/${TA_N}${penalty ? `（ペナルティ +${penalty}秒）` : ''}　目安 ${fmt(target * 1000)}`),
            isBest ? h('b', { class: 'mm-pass' }, '🏆 ベスト更新！') : rec.best ? h('small', {}, `ベスト ${fmt(rec.best)}`) : h('small', {}, `ベスト記録は ${TA_N - 2} 問以上正解で残る`)),
          h('div', { class: `rs-rank rank-${rank} ta-rank` }, h('small', {}, 'RANK'), h('b', {}, rank))),
        gemEl,
        bonusChips(bonus),
        misses.length > 0 && h('h3', { class: 'sec' }, '😵 まちがえた問題（あとで「リベンジおばけ」になって戻ってくるよ）'),
        misses.length > 0 && h('div', { class: 'wrong-list' }, misses.map((p) => h('details', { class: 'wl-item' }, h('summary', { rich: p.stem }), h('div', { class: 'answer-line', html: `正解: ${rich(p.answerText)}` })))),
        h('div', { class: 'up-btns' },
          btn('⏱ もう1回', () => startTimeAttack(unit), 'primary'),
          btn('マップへ', () => go('map', { focus: unit }), 'ghost'))));
    flyGems(gems + bonus.gems, gemEl, 500);
  }

  next();
}
