// 入試本番モード（模試）: えらぶ → 解く（時間制限・どの問題からでも）→ 採点・見直し
// 時間はアプリを閉じても進む（本番と同じ）。とちゅうの模試は保存され、続きから再開できる
import { h, btn, toast, confirmBox, modal } from '../core/ui.js';
import { rich } from '../core/mathml.js';
import { S, save, saveNow, today, recordAnswer, beginSession, tallySession, closeSession } from '../core/store.js';
import { newSeed } from '../core/rng.js';
import { checkAnswer } from '../core/check.js';
import { studyBegin, studyEnd } from '../core/timer.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';
import { problemCard, answerPad, stepsView } from '../ui/answer.js';
import { askBtn } from '../ui/asklater.js';
import { UNIT } from '../units/registry.js';
import { topBar } from './home.js';
import { backdrop } from '../ui/deco.js';
import { EXAM_KINDS, EXAM_DESC, SUBJECT_JA, buildExam, allQs, gradeExam, weakUnits, inputText, isPaper } from '../exam/exam.js';
import { canSpeak, speakLines, stopSpeech } from '../ui/speech.js';
import { claimActivity } from '../game/bonus.js';
import { bonusChips } from './result.js';
import { flyGems } from '../ui/gems.js';
import { paperCheck, countdown } from '../ui/ready.js';
import { logGems } from '../game/gemlog.js';

const GRADERS = ['本人', 'お母さん', 'お兄さん'];
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec % 60)).padStart(2, '0')}`;
const leftSec = (d, ex) => Math.round(ex.minutes * 60 - (Date.now() - d.startedAt) / 1000);

export function render(el, params = {}) {
  if (params.phase === 'sheet') return sheetView(el);
  if (params.phase === 'result') return resultView(el, params.id, params.fresh);
  return introView(el);
}

// ---------- えらぶ ----------
function introView(el) {
  const s = S();
  const d = s.examDraft;
  let paper = !!s.settings.examPaper;
  let subj = s.settings.examSubject || 'math';
  const seg = h('div', { class: 'ex-seg' });
  const paintSeg = () => seg.replaceChildren(
    ...[[false, '📱 アプリで穴うめ', '証明は【　】をうめる・作図は手順をならべる（自動で採点）'], [true, '✏️ 紙に書いて採点', '本番と同じく紙に書く。終わったら模範解答を見て、本人か家族が採点']].map(([v, label, sub]) =>
      h('button', { class: `ex-opt${paper === v ? ' on' : ''}`, type: 'button', onclick: () => { sfx('tap'); paper = v; s.settings.examPaper = v; save(); paintSeg(); } }, h('b', {}, label), h('small', {}, sub))));
  paintSeg();
  // スタート前に確認（時間・紙とペン）→ 3・2・1 の合図のあとで時間スタート
  const start = async (kind) => {
    if (d && !(await confirmBox('とちゅうの模試があるよ', '新しく始めると、とちゅうの模試は消えるよ。', '新しく始める', 'やめる', true))) return;
    const k = EXAM_KINDS[kind];
    const en = subj === 'english';
    const term = subj === 'soc' || subj === 'sci';
    const ja = subj === 'ja';
    const ok = await paperCheck({
      title: `${SUBJECT_JA[subj]} ${k.name}（${k.minutes}分）を始める？`,
      lines: [
        `⏱ 制限時間は <b>${k.minutes}分</b>。合図のあとスタート。アプリを閉じても時間は進む`,
        ja ? '📱 読解・漢字・文法は<b>選ぶ・ならべる</b> 問題（自動で採点）' : term ? '📱 選ぶ・ならべる・<b>数を入力する</b>問題（自動で採点）。計算用の紙があると便利' : en ? '🔊 リスニングは<b>音が出る</b>。音量を上げるか、イヤホンを用意' : paper ? '✏️ 証明・作図は<b>紙に書く</b>（終わったら採点）' : '📱 証明は【　】をうめる、作図は手順をならべる',
        ja && kind === 'full' ? '✏️ 作文は<b>紙に書く</b>（原稿用紙かノートを用意。終わったら採点）' : !term && en ? (kind === 'full' ? '✏️ 英語で書く問題は<b>紙に書く</b>（終わったら採点）' : '放送はそれぞれ <b>2回まで</b>') : 'むずかしい問題は飛ばして、あとで戻ってOK',
      ],
    });
    if (!ok) return;
    await countdown('はじめ！');
    s.examDraft = { subject: subj, kind, seed: newSeed(), paperMode: en || term || ja ? false : paper, plays: {}, startedAt: Date.now(), answers: {}, cur: 0 };
    saveNow();
    go('exam', { phase: 'sheet' });
  };
  const hist = (s.exams || []).slice(-5).reverse();
  // 教科えらび（数学 / 英語）。英語は英作文がいつも紙なので「答え方」のえらびはない
  const subjBar = h('div', { class: 'ex-subj' });
  const aboutP = h('p', {});
  const paperHead = h('h3', { class: 'sec' }, '証明・作図の答え方');
  const kinds = h('div', { class: 'ex-kinds' });
  const paintSubj = () => {
    subjBar.replaceChildren(...Object.entries(SUBJECT_JA).map(([k, ja]) => h('button', { class: subj === k ? 'on' : '', type: 'button', onclick: () => { sfx('tap'); subj = k; s.settings.examSubject = k; save(); paintSubj(); } }, ja)));
    aboutP.textContent = subj === 'soc' || subj === 'sci' || subj === 'ja' ? EXAM_DESC[subj].about : `滋賀県の公立高校入試に近い形。${EXAM_DESC[subj].about}`;
    paperHead.style.display = seg.style.display = subj === 'math' ? '' : 'none';
    kinds.replaceChildren(...Object.entries(EXAM_KINDS).map(([k, v]) => h('button', { class: `ex-kind k-${k}`, type: 'button', onclick: () => { sfx('tap'); start(k); } },
      h('span', { class: 'ek-time' }, `${v.minutes}分`), h('b', {}, `${SUBJECT_JA[subj]} ${v.name}`), h('small', {}, EXAM_DESC[subj][k]), h('span', { class: 'ek-go' }, 'スタート ▶'))));
  };
  paintSubj();
  backdrop(el, 'desk');
  el.append(topBar(() => go('home')),
    h('div', { class: 'exam-intro' },
      h('div', { class: 'ex-hero' },
        h('div', { class: 'ex-badge' }, '入試本番モード'),
        h('h2', {}, '📝 模試で力だめし'),
        aboutP),
      d && h('div', { class: 'ex-draft' },
        h('div', {}, h('b', {}, `とちゅうの ${SUBJECT_JA[d.subject]} ${EXAM_KINDS[d.kind].name}`), h('small', {}, `答えた問題 ${Object.keys(d.answers).length} 問`)),
        btn('続きから ▶', () => go('exam', { phase: 'sheet' }), 'primary small')),
      subjBar,
      paperHead,
      seg,
      h('h3', { class: 'sec' }, 'どっちを解く？'),
      kinds,
      h('p', { class: 'note' }, '⏱ 時間はアプリを閉じても進む（本番と同じ）。どの問題から解いてもOK。むずかしい問題は飛ばして、あとで戻ろう。'),
      hist.length > 0 && h('h3', { class: 'sec' }, '📈 これまでの模試'),
      hist.length > 0 && h('div', { class: 'ex-hist' }, hist.map((r) => histRow(r)))));
}

export function histRow(r) {
  const [, mo, da] = r.date.split('-');
  const pct = Math.round((r.got / r.max) * 100);
  return h('button', { class: 'ex-hrow', type: 'button', onclick: () => go('exam', { phase: 'result', id: r.id }) },
    h('span', { class: 'eh-date' }, `${+mo}/${+da}`),
    h('span', { class: 'eh-name' }, `${SUBJECT_JA[r.subject] || '数学'} ${EXAM_KINDS[r.kind].name}`),
    h('span', { class: 'eh-bar' }, h('i', { style: { width: `${pct}%` } })),
    h('b', { class: 'eh-score' }, r.kind === 'full' ? `${r.got}点` : `${r.got}/${r.max}`));
}

// ---------- 解く ----------
function sheetView(el) {
  const s = S();
  const d = s.examDraft;
  if (!d) return go('exam');
  const ex = buildExam(d.subject, d.kind, d.seed);
  const qs = allQs(ex);
  let i = Math.min(d.cur || 0, qs.length - 1);
  let done = false;
  beginSession({ kind: 'exam', subject: d.subject, lesson: d.kind });

  const timer = h('span', { class: 'ex-timer' });
  const nav = h('div', { class: 'ex-nav' });
  const body = h('div', { class: 'ex-body' });
  const head = h('header', { class: 'ex-head' },
    h('button', { class: 'hud-exit', type: 'button', 'aria-label': 'やめる', onclick: quit }, '✕'),
    h('b', { class: 'ex-title' }, ex.title),
    timer,
    btn('提出', () => submit(false), 'primary small'));
  const prev = btn('◀ 前', () => show(i - 1), 'ghost');
  const next = btn('次 ▶', () => show(i + 1), 'ghost');
  el.classList.add('ex-sheet');
  el.append(head, nav, body, h('div', { class: 'ex-foot' }, prev, next));

  const answered = (q) => d.answers[q.id] !== undefined;
  function paintNav() {
    nav.replaceChildren(...ex.sections.map((sec) => h('div', { class: 'en-sec' },
      h('span', { class: 'en-no' }, `${sec.no}`),
      ...qs.filter((q) => q.sec === sec).map((q) => {
        const k = qs.indexOf(q);
        return h('button', { class: `en-q${answered(q) ? ' done' : ''}${k === i ? ' cur' : ''}`, type: 'button', onclick: () => show(k) }, q.label.replace(/[()]/g, ''));
      }))));
    nav.querySelector('.cur')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function tick() {
    if (done || !el.isConnected) { stopSpeech(); return clearInterval(iv); }
    const left = leftSec(d, ex);
    timer.textContent = `⏱ ${mmss(Math.max(0, left))}`;
    timer.classList.toggle('warn', left <= 300);
    if (left <= 0) submit(true);
  }
  const iv = setInterval(tick, 1000);

  function show(k) {
    if (k < 0 || k >= qs.length) return;
    i = k;
    d.cur = k;
    save();
    studyBegin(300);
    const q = qs[k];
    const sec = q.sec;
    stopSpeech();
    body.innerHTML = '';
    body.append(h('div', { class: 'ex-sechead' }, h('b', {}, `大問${sec.no}`), h('span', {}, sec.title)));
    if (sec.fig || sec.passage || (sec.intro && !/^次の/.test(sec.intro))) body.append(h('div', { class: 'ex-ctx' }, h('div', { rich: sec.intro }), sec.fig && h('div', { class: 'qfig', html: sec.fig }), sec.passage && h('div', { class: 'ex-passage', html: sec.passage })));
    // リスニング: 放送ボタン（それぞれ2回まで。同じ放送の問題は回数を共有）
    if (q.listen) body.append(listenBox(q.listen, { used: () => (d.plays ||= {})[q.listen.key] || 0, use: () => { (d.plays ||= {})[q.listen.key] = (d.plays[q.listen.key] || 0) + 1; save(); } }));
    const cur = d.answers[q.id];
    if (isPaper(q, d.paperMode)) {
      body.append(h('div', { class: 'qcard ex-paper' },
        h('div', { class: 'qcard-tags' }, h('span', { class: 'tag' }, `${q.label} ${q.pts}点`), h('span', { class: 'tag tag-dim' }, '✏️ 紙に書く')),
        h('div', { class: 'qstem', rich: q.paper.ask }),
        q.p.fig && h('div', { class: 'qfig', html: q.p.fig })),
      h('p', { class: 'note' }, q.paperNote || (q.paperAlways ? '英語で紙（ノート）に書こう。提出したあとに、答えの例を見ながら採点するよ。' : '紙に書こう。提出したあとに、模範解答を見ながら採点するよ。')),
      btn(cur ? '✔ 書けた（もう一度押すと取り消し）' : '✏️ 紙に書けた', () => { if (cur) delete d.answers[q.id]; else d.answers[q.id] = 'paper'; save(); paintNav(); if (!cur) goNext(); else show(i); }, cur ? 'ghost' : 'primary big'));
    } else {
      const card = problemCard(q.p, { label: `${q.label} ${q.pts}点` });
      const curLine = h('div', { class: 'ex-cur' }, cur !== undefined ? h('span', { rich: `いまの答え: ${inputText(q.p, cur)}` }) : null);
      const pad = answerPad(q.p, (input) => {
        const r = checkAnswer(q.p, input);
        if (r.invalid) { toast(r.msg, 2200); return; }
        d.answers[q.id] = input;
        save();
        sfx('build');
        goNext();
      }, { fire: '決定', auto: false });
      if (cur !== undefined) {
        if (q.p.input.kind === 'choice') pad.select?.(cur);
        if (q.p.input.kind === 'blanks') pad.fill?.(cur);
      }
      body.append(card, curLine, pad.el);
    }
    prev.disabled = k === 0;
    next.disabled = k === qs.length - 1;
    paintNav();
    body.scrollTop = 0;
    window.scrollTo(0, 0);
  }
  // 次のまだ答えていない問題へ（なければ次へ）
  function goNext() {
    const after = qs.findIndex((q, k) => k > i && !answered(q));
    const any = qs.findIndex((q) => !answered(q));
    if (after >= 0) show(after);
    else if (any >= 0) show(any);
    else { paintNav(); toast('全部答えた！ 見直して「提出」しよう', 2600); }
  }

  async function quit() {
    const v = await modal({
      title: '模試をやめる？',
      body: '「あとで続きから」なら、答えはそのまま残るよ（時間は進み続ける）。',
      // 安全な「続ける」をいちばん上に。「捨てる」は小さく下に、もう一度確認する
      buttons: [{ label: '続ける', value: null, cls: 'primary' }, { label: 'あとで続きから', value: 'keep' }, { label: '答えを捨ててやめる', value: 'drop', cls: 'ghost small danger-link' }],
      cls: 'stack',
    });
    if (!v) return;
    if (v === 'drop' && !(await confirmBox('ほんとに捨てる？', 'ここまでの答えは消えて、元にもどせないよ。', '捨てる', 'やめない'))) return;
    done = true;
    clearInterval(iv);
    stopSpeech();
    if (v === 'drop') { s.examDraft = null; saveNow(); }
    go('exam');
  }

  async function submit(timeUp) {
    if (done) return;
    const blank = qs.filter((q) => !answered(q)).length;
    if (!timeUp && !(await confirmBox('提出する？', blank ? `まだ ${blank} 問 答えていないよ。` : '全部答えた。提出して採点しよう！', '提出する', 'まだ見直す'))) return;
    done = true;
    clearInterval(iv);
    stopSpeech();
    studyEnd();
    const rec = {
      id: `ex${Date.now()}`, at: Date.now(), date: today(), subject: d.subject, kind: d.kind, seed: d.seed, paperMode: d.paperMode,
      answers: Object.fromEntries(Object.entries(d.answers).filter(([, v]) => v !== 'paper')),
      marks: {}, grader: null, usedSec: Math.min(ex.minutes * 60, Math.round((Date.now() - d.startedAt) / 1000)), timeUp,
    };
    const G = gradeExam(ex, rec);
    for (const { q, g } of G.items) {
      if (g.paper) continue;
      if (q.p.generatorId) recordAnswer({ unit: q.p.unit, generatorId: q.p.generatorId, seed: q.p.seed, correct: g.ok, firstTry: true });
      else tallySession(g.ok);
    }
    Object.assign(rec, { got: G.got, max: G.max, secs: G.secs });
    const gems = 5 + Math.round(G.score100 / 4);
    s.gems += gems;
    logGems('exam', gems);
    rec.gems = gems;
    rec.bonus = claimActivity('exam');
    (s.exams ||= []).push(rec);
    if (s.exams.length > 40) s.exams.shift();
    s.examDraft = null;
    closeSession('clear');
    saveNow();
    sfx('win');
    if (timeUp) toast('⏰ 時間切れ！ 提出したよ', 2600);
    go('exam', { phase: 'result', id: rec.id, fresh: true });
  }

  tick();
  show(i);
}

// ---------- 採点・見直し ----------
function resultView(el, id, fresh = false) {
  const s = S();
  const rec = (s.exams || []).find((r) => r.id === id);
  if (!rec) return go('exam');
  const ex = buildExam(rec.subject, rec.kind, rec.seed);
  rec.marks ||= {};
  const scoreBox = h('div', { class: 'ex-score' });
  const paperQs = allQs(ex).filter((q) => isPaper(q, rec.paperMode));

  function paintScore() {
    const G = gradeExam(ex, rec);
    Object.assign(rec, { got: G.got, max: G.max, secs: G.secs });
    save();
    const waiting = paperQs.filter((q) => !rec.marks[q.id]).length;
    scoreBox.replaceChildren(
      h('div', { class: 'es-main' },
        h('small', {}, `${SUBJECT_JA[rec.subject] || '数学'} ${EXAM_KINDS[rec.kind].name}｜${mmss(rec.usedSec)} 使用${rec.timeUp ? '（時間切れ）' : ''}`),
        h('div', { class: 'es-num' }, h('b', {}, String(G.got)), h('span', {}, ` / ${G.max}点`)),
        rec.kind !== 'full' && h('small', {}, `100点満点にすると ${G.score100} 点`),
        waiting > 0 && h('small', { class: 'es-wait' }, `✏️ 紙の問題 ${waiting} 問がまだ採点前（下で採点しよう）`)),
      h('div', { class: 'es-secs' }, G.secs.map((sc) => h('div', { class: 'es-sec' },
        h('span', {}, `大問${sc.no} ${sc.title}`),
        h('span', { class: 'es-bar' }, h('i', { style: { width: `${(sc.got / sc.max) * 100}%` } })),
        h('b', {}, `${sc.got}/${sc.max}`)))));
    return G;
  }
  const G = paintScore();

  // 紙に書いた問題の採点（本人・家族）
  const paperBox = paperQs.length > 0 && h('div', { class: 'ex-grade' },
    h('h3', { class: 'sec' }, '✏️ 紙の問題を採点しよう'),
    h('div', { class: 'eg-who' }, h('small', {}, '採点する人'), ...GRADERS.map((g) => h('button', { class: `chip${rec.grader === g ? ' on' : ''}`, type: 'button', onclick: (e) => { rec.grader = g; save(); e.target.parentNode.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === e.target)); } }, g))),
    paperQs.map((q) => {
      const marks = rec.marks[q.id] || q.paper.rubric.map(() => false);
      return h('div', { class: 'eg-card' },
        h('div', { class: 'eg-title' }, `大問${q.sec.no} ${q.label}（${q.pts}点）`),
        h('div', { class: 'qstem', rich: q.paper.ask }),
        q.p.fig && h('div', { class: 'qfig', html: q.p.fig }),
        q.listen && listenBox(q.listen, { review: true }),
        h('details', { class: 'eg-model' }, h('summary', {}, '模範解答を見る'), h('ol', {}, q.paper.model.map((l) => h('li', { rich: l })))),
        h('div', { class: 'eg-rubric' }, q.paper.rubric.map((r, k) => h('label', { class: 'eg-item' },
          h('input', { type: 'checkbox', ...(marks[k] ? { checked: true } : {}), onchange: (e) => { marks[k] = e.target.checked; rec.marks[q.id] = marks; paintScore(); } }),
          h('span', {}, r.text), h('b', {}, `${r.pts}点`)))),
        h('small', { class: 'note' }, 'できていたところにチェックして「採点した」。0点ならチェックなしで押す。'),
        btn('採点した', (e) => { rec.marks[q.id] = marks; paintScore(); e.target.textContent = '✔ 採点ずみ'; }, 'ghost small'));
    }));

  const weak = weakUnits(G.items);
  const review = ex.sections.map((sec) => h('div', { class: 'ex-rsec' },
    h('div', { class: 'ex-sechead' }, h('b', {}, `大問${sec.no}`), h('span', {}, sec.title)),
    G.items.filter(({ q }) => q.sec.no === sec.no).map(({ q, g }) => {
      const mk = g.paper && !rec.marks[q.id] ? '✏️' : g.got === g.max ? '○' : g.got > 0 ? '△' : '×';
      return h('details', { class: `ex-ritem ${g.got === g.max ? 'ok' : g.got > 0 ? 'part' : 'ng'}` },
        h('summary', {}, h('span', { class: 'er-mk' }, mk), h('span', { class: 'er-label' }, q.label), h('span', { class: 'er-unit' }, UNIT[q.p.unit]?.title || ''), h('b', {}, `${g.got}/${g.max}`)),
        h('div', { class: 'er-body' },
          sec.intro && !/^次の/.test(sec.intro) && h('div', { class: 'er-ctx', rich: sec.intro }),
          sec.passage && h('details', { class: 'er-passage' }, h('summary', {}, '本文を見る'), h('div', { class: 'ex-passage', html: sec.passage })),
          q.listen && listenBox(q.listen, { review: true }),
          h('div', { class: 'qstem', rich: g.paper ? q.paper.ask : q.p.stem }),
          q.p.fig && h('div', { class: 'qfig', html: q.p.fig }),
          !g.paper && h('div', { class: 'er-line', rich: `あなたの答え: ${inputText(q.p, rec.answers[q.id])}` }),
          g.note && h('div', { class: 'er-line warn' }, g.note),
          h('div', { class: 'er-line good', rich: `正解: ${g.paper ? q.paper.model.join('\n') : q.p.answerText}` }),
          !g.paper && (q.p.steps || []).length > 0 && h('div', { class: 'er-steps' }, h('small', {}, '解き方'), stepsView(q.p)),
          askBtn({ ...q.p, stem: g.paper ? q.paper.ask : q.p.stem, fig: q.p.fig || sec.fig, answerText: g.paper ? q.paper.model.join('\n') : q.p.answerText }, `模試 ${q.label}`, sec.intro && !/^次の/.test(sec.intro) ? sec.intro : '')));
    })));

  backdrop(el, G.score100 >= 70 ? 'win' : 'desk');
  el.append(topBar(() => go('exam')),
    h('div', { class: 'exam-result' },
      scoreBox,
      rec.gems && h('p', { class: 'note center ex-gems' }, `💎 +${rec.gems}（模試の報酬）`),
      fresh && bonusChips(rec.bonus),
      paperBox,
      weak.length > 0 && h('h3', { class: 'sec' }, '🎯 点を落としたところ（ここを復習）'),
      weak.length > 0 && h('div', { class: 'ex-weak' }, weak.map(({ unit, pts }) => btn(h('span', {}, h('b', {}, UNIT[unit]?.title || unit), h('small', {}, ` −${pts}点`)), () => go('map', { focus: unit, subject: UNIT[unit]?.subject || 'math' }), 'ghost small'))),
      h('h3', { class: 'sec' }, '🔍 見直し（タップで解説）'),
      review,
      h('div', { class: 'up-btns' },
        btn('📝 もう1回（新しい問題）', () => go('exam'), 'primary'),
        btn('ホームへ', () => go('home'), 'ghost'))));
  if (fresh) flyGems((rec.gems || 0) + (rec.bonus?.gems || 0), el.querySelector('.ex-gems'), 400);
}

// ---------- リスニングの放送ボタン ----------
// 解いている間: 2回まで。見直し（review）: 何回でも聞けて、放送文も読める
function listenBox(listen, { used = () => 0, use = () => {}, review = false } = {}) {
  const MAX = 2;
  const box = h('div', { class: 'ex-listen' });
  const lineEls = () => listen.lines.map((l) => h('p', {}, l.who !== 'N' && h('b', {}, `${l.who}: `), l.text));
  const script = h('div', { class: 'el-script' }, ...lineEls());
  let shown = false;
  let playing = false;
  const paint = () => {
    const left = MAX - used();
    const speak = canSpeak();
    const label = playing ? '🔊 放送中…'
      : review ? (speak ? '🔊 もう一度聞く' : '')
        : left <= 0 ? '放送は終わりました'
          : speak ? `🔊 放送を聞く（あと${left}回）` : '📄 放送文を読む（1回）';
    const b = label && h('button', { class: `btn ${review || left > 0 ? 'primary' : 'ghost'} el-play`, type: 'button', disabled: playing || (!review && left <= 0) }, label);
    if (b) b.onclick = async () => {
      if (!review) use();
      if (!speak) { shown = true; paint(); return; }
      playing = true;
      paint();
      await speakLines(listen.lines);
      playing = false;
      if (box.isConnected) paint();
    };
    box.replaceChildren(
      b || '',
      !speak && !review ? h('small', { class: 'note' }, 'この端末では読み上げが使えないので、放送文を表示します。') : '',
      review ? h('details', { class: 'el-text' }, h('summary', {}, '放送文を見る'), ...lineEls()) : '',
      !review && shown ? script : '');
  };
  paint();
  return box;
}
