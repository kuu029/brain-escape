// 暗号室（暗記）: トップ → 暗号ラッシュ（最大20枚・4分）→ 結果 ／ 暗号ノート（デッキ）
import { h, btn, toast, modal, confirmBox } from '../core/ui.js';
import { S, save, saveNow, beginSession, tallySession, closeSession } from '../core/store.js';
import { makeRng, newSeed } from '../core/rng.js';
import { checkAnswer } from '../core/check.js';
import { studyBegin, studyEnd } from '../core/timer.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';
import { answerPad } from '../ui/answer.js';
import { topBar } from './home.js';
import { backdrop } from '../ui/deco.js';
import { bump } from '../game/missions.js';
import { addCard } from '../game/progress.js';
import { GACHA_CARDS, CARDS as GAME_CARDS } from '../game/content.js';
import * as ME from '../memory/engine.js';
import { flowQuestion, hasFlow, FLOW_N } from '../memory/flow.js';
import { claimActivity } from '../game/bonus.js';
import { bonusChips } from './result.js';
import { flyGems } from '../ui/gems.js';

const POS = { n: '名詞', v: '動詞', adj: '形容詞', adv: '副詞', prep: '前置詞', conj: '接続詞', wh: '疑問詞', pron: '代名詞', int: 'あいさつ等', num: '数', idiom: '熟語' };
const SUBJ_LANG = { en: 'english', soc: 'social', sci: 'science' };
const mem = () => S().memory;
// 数え方: 英単語は「語」、社会・理科の用語は「枚」
const unitOf = (subject) => (subject === 'en' ? '語' : '枚');

export function render(el, params = {}) {
  const subject = params.subject || 'en';
  if (params.phase === 'rush') return rushView(el, subject, params);
  if (params.phase === 'result') return resultView(el, subject, params.r);
  if (params.phase === 'deck') return deckView(el, subject, params.deck);
  if (params.phase === 'flow') return flowView(el, subject);
  return topView(el, subject);
}

// やる気（その日の最初のラッシュの前に1回だけ聞く）
async function askMotivation() {
  const M = mem();
  const day = ME.dayOf(M, Date.now());
  if (day.motivation) return true;
  const v = await modal({
    title: '今日のやる気は？',
    body: h('div', { class: 'modal-body center' }, h('p', {}, '新しく覚える暗号の数が変わるよ。'), h('small', { class: 'note' }, '（最初の5枚の調子でも、少し増えたり減ったりする）')),
    buttons: Object.entries(ME.MOTIVATION).map(([k, m]) => ({ label: m.label, value: k, cls: k === 'mid' ? 'primary' : '' })),
  });
  if (!v) return false;
  day.motivation = v;
  save();
  return true;
}
async function startRush(subject, opts = {}) {
  if (opts.intro && !(await askMotivation())) return;
  go('memory', { phase: 'rush', subject, ...opts });
}

// 今日の状態: 顔合わせが残っている → 復習どきがある → 今日の分は終わり
function todayState(M, subject, now) {
  const day = ME.dayOf(M, now);
  const limit = ME.newLimit(M, subject, now);
  const done = day.newCount[subject] || 0;
  const introLeft = day.motivation ? Math.min(ME.newLeft(M, subject, now), ME.unseenLeft(M, subject)) : Math.min(1, ME.unseenLeft(M, subject));
  const review = ME.dueList(M, subject, now).length + ME.pendingCount(M, subject);
  return { day, limit, done, introLeft, review, stage: introLeft > 0 ? 'intro' : review > 0 ? 'review' : 'done' };
}
// 次にやることのボタン（いちばん大事なものだけ黄色）
function nextButtons(subject, T, M) {
  const extra = () => { ME.addExtra(M, subject, Date.now()); save(); startRush(subject, { intro: true }); };
  const introBtn = (cls) => btn(h('span', {}, '🆕 顔合わせ', h('small', {}, T.day.motivation ? `今日の新しい暗号 あと ${T.introLeft} ${unitOf(subject)}（${ME.INTRO_SIZE}${unitOf(subject)}ずつ）` : '今日の新しい暗号を、まず全部1回ずつ見る')), () => startRush(subject, { intro: true }), cls);
  const reviewBtn = (cls) => btn(h('span', {}, '🔁 復習ラッシュ', h('small', {}, `復習どき ${T.review} 枚（最大${ME.RUSH_SIZE}枚・4分）`)), () => startRush(subject), cls);
  if (T.stage === 'intro') return [introBtn('primary big mm-go'), T.review > 0 && reviewBtn('ghost mm-go')];
  if (T.stage === 'review') return [reviewBtn('primary big mm-go'), ME.unseenLeft(M, subject) > 0 && btn(`＋${ME.EXTRA_STEP}${unitOf(subject)} 追加で覚える`, extra, 'ghost small')];
  const nd = ME.nextDue(M, subject);
  const mins = nd ? Math.max(1, Math.round((nd - Date.now()) / 60000)) : null;
  return [
    h('div', { class: 'mm-clear' }, h('b', {}, '✅ 今日の分はクリア！'), h('small', {}, mins ? `次の復習どきは ${mins >= 120 ? `${Math.round(mins / 60)}時間` : `${mins}分`}後` : '')),
    ME.unseenLeft(M, subject) > 0 && btn(`🔥 もっとやる: ＋${ME.EXTRA_STEP}${unitOf(subject)} 追加で覚える`, extra, 'primary mm-go'),
  ];
}

// ---------- トップ ----------
function topView(el, subject) {
  const M = mem();
  const now = Date.now();
  const sj = ME.MEM_SUBJECTS[subject];
  const T = todayState(M, subject, now);
  const decks = ME.courseDecks(subject, M.course);
  const all = decks.flatMap((d) => d.cards);
  const st = all.map((c) => M.cards[c.id]);
  const total = { n: all.length, seen: st.filter(Boolean).length, sel: st.filter((x) => x && (x.sel || x.lv >= 3)).length, wr: st.filter((x) => x?.wr).length, solid: st.filter((x) => x && x.lv >= 5).length };
  const weak = all.filter((c) => { const cs = M.cards[c.id]; return cs && cs.miss > 0 && cs.lv <= 3; }).length;
  const mode = ME.modeOf(M, subject);
  const seg = h('div', { class: 'mm-modes' }, Object.entries(ME.MODES).map(([k, m]) => h('button', {
    class: `mm-mode${mode === k ? ' on' : ''}`, type: 'button',
    onclick: () => { sfx('tap'); (M.mode ||= {})[subject] = k; save(); go('memory', { subject }); },
  }, h('b', {}, m.name), h('small', {}, m.desc), h('span', { class: 'mm-mult' }, `💎×${m.mult}`))));

  backdrop(el, 'cell');
  el.append(topBar(() => go('home')),
    h('div', { class: 'mem-top' },
      h('div', { class: 'mm-hero' }, h('div', { class: 'mm-title' }, '🔐 暗号室'), h('p', {}, '看守たちの合言葉（暗号）を解読して、扉を開けろ。忘れかけたころに、また出てくるぞ。')),
      h('div', { class: 'mm-subj' }, Object.values(ME.MEM_SUBJECTS).map((x) => h('button', { class: `mm-tab${x.id === subject ? ' on' : ''}${x.ready ? '' : ' off'}`, type: 'button', onclick: () => (x.ready ? go('memory', { subject: x.id }) : toast(`${x.name}の暗号は準備中…`)) }, `${x.emoji} ${x.name}${x.ready ? (x.beta ? ' β' : '') : ' 🔒'}`))),
      sj.beta && h('p', { class: 'note mm-beta' }, `β版：${sj.name}の用語は手作りのデータです。まちがいを見つけたら教えてね（おうちの人に確かめてもらうと安心）。`),
      h('div', { class: 'mm-today' },
        h('div', { class: 'mt-flow' },
          h('span', { class: T.stage === 'intro' ? 'now' : 'done' }, `① 顔合わせ ${T.day.motivation ? `${T.done}/${T.limit}` : ''}`),
          h('span', { class: T.stage === 'review' ? 'now' : T.stage === 'done' ? 'done' : '' }, `② 復習 ${T.review ? `あと${T.review}` : ''}`)),
        nextButtons(subject, T, M),
        weak > 0 && btn(`😵 苦手だけ（${weak}枚）`, () => startRush(subject, { weak: true }), 'ghost small')),
      // 流れでつなげる（社会・理科）: 年表・時代・分野と結びつけて覚える
      hasFlow(subject) && btn(h('span', {}, '🧭 流れでつなげる', h('small', {}, subject === 'soc' ? `年表ならべかえ・どっちが先？・時代あて（${FLOW_N}問）` : `この用語はどの分野？（${FLOW_N}問）`)), () => { sfx('tap'); go('memory', { phase: 'flow', subject }); }, 'ghost mm-go mm-flow'),
      h('h3', { class: 'sec' }, '難易度'),
      seg,
      h('div', { class: 'mm-total' },
        [['見た', total.seen], ['★ 選べる', total.sel], ['✍️ 書ける', total.wr], ['🔒 定着', total.solid]].map(([k, v]) => h('div', {}, h('b', {}, String(v)), h('small', {}, k))),
        h('small', { class: 'mm-of' }, `全 ${total.n} 枚`)),
      h('h3', { class: 'sec' }, `📒 暗号ノート（${sj.name}）`),
      h('div', { class: 'mm-decks' }, decks.map((d) => {
        const p = ME.deckProgress(M, d);
        const cleared = M.decks?.[d.id]?.cleared;
        return h('button', { class: 'mm-deck', type: 'button', onclick: () => go('memory', { phase: 'deck', subject, deck: d.id }) },
          h('span', { class: 'md-top' }, h('b', {}, d.title), h('small', {}, cleared ? '🏅 解読済み' : `${p.seen}/${p.n}`)),
          h('span', { class: 'md-bar' }, h('i', { class: 'sel', style: { width: `${(p.sel / p.n) * 100}%` } }), h('i', { class: 'wr', style: { width: `${(p.wr / p.n) * 100}%` } })),
          h('small', { class: 'md-sub' }, `★選べる ${p.sel}　✍️書ける ${p.wr}`));
      }))));
}

// ---------- 流れでつなげる（社会・理科）----------
// 間隔反復とは別の練習。1問ごとに「なぜその答えか」（年表・時代）を見せてから次へ
function flowView(el, subject) {
  const rng = makeRng(newSeed());
  let k = 0;
  let ok = 0;
  beginSession({ kind: 'memory', subject: SUBJ_LANG[subject], lesson: 'flow' });
  const prog = h('span', { class: 'mr-prog' });
  const stage = h('div', { class: 'mr-stage' });
  el.classList.add('mem-rush-screen');
  el.append(h('header', { class: 'mr-head' },
    h('button', { class: 'hud-exit', type: 'button', 'aria-label': 'やめる', onclick: async () => { if (await confirmBox('やめる？', 'ここまでの正解は記録されているよ。', 'やめる', '続ける')) { studyEnd(); closeSession('quit'); go('memory', { subject }); } } }, '✕'),
    h('b', {}, '🧭 流れでつなげる'), prog), stage);

  function next() {
    if (k >= FLOW_N) return finish();
    const p = flowQuestion(subject, rng);
    k++;
    prog.textContent = `${k}/${FLOW_N}`;
    studyBegin(90);
    if (location.hostname === 'localhost') window.__flow = { p };
    const fb = h('div', { class: 'feedback' });
    const pad = answerPad(p, (input) => {
      const r = checkAnswer(p, input);
      if (r.invalid) { toast(r.msg, 1600); return; }
      if (p.input.kind === 'choice') pad.mark(input, r.ok);
      pad.el.classList.add('done');
      tallySession(r.ok);
      if (r.ok) { ok++; sfx('ok'); bump('correct'); } else sfx('ng');
      fb.replaceChildren(h('div', { class: `fb ${r.ok ? 'good' : 'bad'}` },
        h('div', { class: 'fb-head' }, r.ok ? '⭕ 正解！' : '❌ おしい'),
        h('div', { class: 'answer-line flow-why', rich: p.why }),
        btn(k >= FLOW_N ? '結果へ ▶' : '次へ ▶', next, 'primary')));
      fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, { fire: '決定' });
    stage.replaceChildren(h('div', { class: 'mr-card' }, h('div', { class: 'mr-word ja long' }, p.stem), h('small', { class: 'mr-ask' }, p.ask)), pad.el, fb);
    window.scrollTo(0, 0);
  }
  function finish() {
    studyEnd();
    const gems = Math.max(1, ok);
    S().gems += gems;
    const bonus = claimActivity('memory');
    closeSession('clear');
    saveNow();
    sfx('win');
    const gemEl = h('p', { class: 'note center' }, `💎 +${gems}`);
    stage.replaceChildren(h('div', { class: 'center-col' },
      h('div', { class: 'big-em' }, ok >= FLOW_N - 1 ? '🧭' : '📜'),
      h('h2', {}, `${ok} / ${FLOW_N} 問 正解`),
      gemEl,
      bonusChips(bonus),
      btn('🧭 もう1回', () => go('memory', { phase: 'flow', subject }), 'primary big'),
      btn('🔐 暗号室へ', () => go('memory', { subject }), 'ghost')));
    flyGems(gems + (bonus?.gems || 0), gemEl, 400);
  }
  next();
}

// ---------- 暗号ノート（デッキ） ----------
function deckView(el, subject, deckId) {
  const M = mem();
  const d = ME.DECK[deckId];
  const p = ME.deckProgress(M, d);
  const now = Date.now();
  const when = (cs) => {
    if (!cs) return 'まだ';
    if (cs.due <= now) return '復習どき';
    const days = Math.round((cs.due - now) / 86400000);
    return days >= 1 ? `${days}日後` : 'もうすぐ';
  };
  const rec = M.decks?.[deckId];
  backdrop(el, 'desk');
  el.append(topBar(() => go('memory', { subject })),
    h('div', { class: 'mem-deck' },
      h('div', { class: 'mm-hero' }, h('div', { class: 'mm-title' }, `📒 ${d.title}`), h('p', {}, `${p.n}枚 ／ ★選べる ${p.sel} ／ ✍️書ける ${p.wr} ／ 🔒定着 ${p.solid}${rec?.cleared ? ` ／ 🏅 解読済み（${rec.best}%）` : ''}`)),
      h('div', { class: 'up-btns' },
        btn('⚡ このデッキでラッシュ', () => startRush(subject, { deck: deckId }), 'primary'),
        p.testable || rec?.cleared
          ? btn('🏅 デッキ試験（9割で解読）', () => startRush(subject, { deck: deckId, test: true }), 'boss')
          : h('p', { class: 'note' }, '🏅 全部のカードが ★★ になると「デッキ試験」に挑戦できる')),
      h('div', { class: 'md-list' }, d.cards.map((c) => {
        const cs = M.cards[c.id];
        const s = ME.starsOf(cs);
        return h('div', { class: `md-row${cs ? '' : ' new'}` },
          h('span', { class: 'mr-q' }, c.q),
          h('span', { class: 'mr-a' }, c.a),
          h('span', { class: 'mr-st' }, cs ? '★★★'.slice(0, s) + '☆☆☆'.slice(0, 3 - s) : '', cs?.wr ? ' ✍️' : ''),
          h('small', { class: 'mr-due' }, when(cs)));
      }))));
}

// ---------- 暗号ラッシュ ----------
function rushView(el, subject, opts) {
  const M = mem();
  const rng = makeRng(newSeed());
  const mode = ME.modeOf(M, subject);
  const queue = ME.buildRush(M, subject, rng, Date.now(), opts);
  if (!queue.length) {
    toast(opts.weak ? '苦手な暗号はもうない！' : opts.intro ? '新しく覚える暗号は、今日はもうないよ' : '復習どきの暗号はまだないよ', 2600);
    return go('memory', { subject });
  }
  const t0 = Date.now();
  const R = { subject, mode, intro: !!opts.intro, deck: opts.deck || null, test: !!opts.test, weak: !!opts.weak, asked: 0, ok: 0, combo: 0, maxCombo: 0, news: 0, ups: 0, solid: 0, wr: 0, misses: [] };
  let k = 0;
  let over = false;
  beginSession({ kind: opts.test ? 'memtest' : 'memory', subject: SUBJ_LANG[subject], lesson: opts.deck || null });

  const prog = h('span', { class: 'mr-prog' });
  const combo = h('span', { class: 'mr-combo' });
  const clock = h('span', { class: 'mr-clock' });
  const stage = h('div', { class: 'mr-stage' });
  el.classList.add('mem-rush-screen');
  el.append(h('header', { class: 'mr-head' },
    h('button', { class: 'hud-exit', type: 'button', 'aria-label': 'やめる', onclick: quit }, '✕'),
    h('b', {}, opts.test ? `🏅 ${ME.DECK[opts.deck].title} 試験` : opts.intro ? '🆕 顔合わせ' : `🔁 復習ラッシュ｜${ME.MODES[mode].name}`),
    prog, combo, clock), stage);

  const iv = setInterval(() => {
    if (!el.isConnected) return clearInterval(iv);
    const left = Math.max(0, ME.RUSH_MS - (Date.now() - t0));
    clock.textContent = R.test ? '' : `⏱ ${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`;
    if (!R.test && left <= 0) over = true;
  }, 500);

  const paintHead = () => {
    const qn = queue.filter((x) => !x.intro).length;
    prog.textContent = `${Math.min(R.asked + 1, qn)}/${qn}`;
    combo.textContent = R.combo >= 2 ? `🔥${R.combo}` : '';
  };

  async function quit() {
    if (await confirmBox('ラッシュをやめる？', 'ここまでの答えは、ちゃんと記録されているよ。', 'やめる', '続ける')) {
      clearInterval(iv);
      go('memory', { subject });
    }
  }

  function next() {
    if (k >= queue.length || over) return finish();
    const item = queue[k++];
    const card = ME.CARD[item.id];
    paintHead();
    if (item.intro) return showIntro(card);
    showQ(card, item);
  }

  function showIntro(card) {
    studyBegin(30);
    stage.replaceChildren(h('div', { class: 'mr-card intro' },
      h('span', { class: 'mr-new' }, 'NEW 新しい暗号'),
      card.read && h('small', { class: 'mr-read' }, card.read),
      h('div', { class: `mr-word ${card.kind === 'term' ? 'ja' : 'en'}` }, card.q),
      h('div', { class: `mr-mean${card.kind === 'term' ? ' term' : ''}` }, card.a),
      card.pos && h('small', { class: 'mr-pos' }, POS[card.pos] || card.pos)),
      h('p', { class: 'note center' }, '声に出して1回読もう。4枚見たら、まとめてテスト！'),
      btn('覚えた！ ▶', () => { sfx('tap'); next(); }, 'primary big'));
  }

  function showQ(card, item) {
    const cs = M.cards[card.id];
    // デッキ試験はヒントなし: そのモードのいちばん難しい答え方（用語はタイルがないので入力）。顔合わせの直後は、用語なら「説明 → 用語」
    const testForm = mode === 'easy' ? 'j2e' : mode === 'hard' || card.kind === 'term' ? 'input' : 'tile';
    const form = R.test ? testForm : item.afterIntro ? (card.kind === 'term' ? 'j2e' : 'e2j') : ME.formFor(card, cs, mode, rng);
    const q = ME.makeQuestion(card, form, rng);
    if (location.hostname === 'localhost') window.__rush = { card, q, form, R }; // 開発用（自動テスト）
    const limit = ME.limitOf(card, form);
    const start = Date.now();
    studyBegin(30);
    const bar = h('div', { class: 'mr-time' }, h('i', { style: { animationDuration: `${limit}ms` } }));
    const lang = form === 'e2j' && card.kind !== 'term' ? 'en' : 'ja';
    const big = h('div', { class: `mr-word ${lang}${q.stem.length > 14 ? ' long' : ''}` }, q.stem);
    const cardEl = h('div', { class: `mr-card f-${form}` }, big, h('small', { class: 'mr-ask' }, q.ask), bar);
    let done = false;
    // hinted: 💡ヒントを使った正解は「あやしい」あつかい（レベルを上げない）
    const finishQ = (ok, shown, hinted = false) => {
      if (done) return;
      done = true;
      const ms = hinted ? 1e9 : Date.now() - start;
      const res = ME.applyResult(M, card, { ok, form, ms }, Date.now());
      R.asked++;
      tallySession(ok);
      if (ok) { R.ok++; R.combo++; R.maxCombo = Math.max(R.maxCombo, R.combo); bump('correct'); } else R.combo = 0;
      if (res.isNew) R.news++;
      if (!res.isNew && res.to > res.from) R.ups++;
      if (res.to >= 5 && res.from < 5) R.solid++;
      if (res.gotWr) R.wr++;
      save();
      if (ok) {
        sfx('ok', Math.min(R.combo, 8));
        cardEl.classList.add('good');
        setTimeout(next, ms > ME.slowOf(card, form) ? 900 : 280);
        if (ms > ME.slowOf(card, form) && !res.isNew) cardEl.append(h('small', { class: 'mr-slow' }, hinted ? '正解！ ヒントを使ったので、早めにまた出すね' : '正解！ でも少しあやしい → 早めにまた出すね'));
        return;
      }
      sfx('ng');
      if (!R.misses.includes(card.id)) R.misses.push(card.id);
      cardEl.classList.add('bad');
      stage.append(h('div', { class: 'mr-answer' },
        shown != null && h('small', {}, `あなた: ${shown}`),
        h('div', {}, h('b', { class: 'en' }, card.q), ' ＝ ', h('span', {}, card.a)),
        btn('次へ ▶', () => { clearTimeout(auto); next(); }, 'primary')));
      const auto = setTimeout(next, 2600);
    };
    stage.replaceChildren(cardEl);
    if (form === 'input') {
      const inp = h('input', { class: 'mr-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', placeholder: card.read === null ? '数字を入力（例: 1600）' : card.kind === 'term' ? '用語を入力（ひらがなでもOK）' : '英語で入力', ...(card.kind === 'term' ? { lang: 'ja' } : {}), ...(card.read === null ? { inputmode: 'numeric' } : {}) });
      const submit = () => { const v = inp.value; if (!v.trim()) return; inp.blur(); finishQ(ME.textOk(q, v), v); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
      stage.append(inp, h('div', { class: 'mr-ctrl' }, btn('わからない', () => finishQ(false, null), 'ghost'), btn('決定', submit, 'primary')));
      setTimeout(() => inp.focus(), 60);
    } else {
      const p = { ...q, input: q.input };
      const pad = answerPad(p, (input) => {
        const r = checkAnswer(p, input);
        if (r.invalid) { toast(r.msg, 1600); return; }
        const shown = p.input.kind === 'choice' ? p.input.choices[input] : p.input.kind === 'order' ? input.map((i) => p.input.tiles[i]).join(' ') : String(input);
        if (p.input.kind === 'choice') pad.mark(input, r.ok);
        finishQ(r.ok, r.ok ? null : shown, !!pad.usedHint);
      }, { fire: '決定' });
      stage.append(pad.el, btn('？ わからない', () => finishQ(false, null), 'ghost small mr-idk'));
    }
  }

  function finish() {
    clearInterval(iv);
    studyEnd();
    const mult = ME.MODES[mode].mult;
    let gems = Math.max(1, Math.round((R.ok * 0.5 + R.news * 0.5) * mult));
    const extra = [];
    if (R.test) {
      const pct = Math.round((R.ok / Math.max(R.asked, 1)) * 100);
      R.pct = pct;
      const rec = ((M.decks ||= {})[R.deck] ||= {});
      rec.best = Math.max(rec.best || 0, pct);
      if (pct >= 90) {
        R.passed = true;
        if (!rec.cleared) { rec.cleared = new Date().toISOString().slice(0, 10); gems += 30; const id = GACHA_CARDS[Math.floor(Math.random() * GACHA_CARDS.length)]; if (addCard(id)) extra.push(id); }
      }
    } else if (mode === 'hard' && R.asked >= 10 && Math.random() < 0.2) {
      const id = GACHA_CARDS[Math.floor(Math.random() * GACHA_CARDS.length)];
      if (addCard(id)) extra.push(id);
    }
    S().gems += gems;
    R.gems = gems;
    R.bonus = claimActivity('memory');
    R.cards = extra;
    closeSession(R.test ? (R.passed ? 'win' : 'lose') : 'clear');
    saveNow();
    sfx('win');
    go('memory', { phase: 'result', subject, r: R });
  }

  next();
}

// ---------- 結果 ----------
function resultView(el, subject, R) {
  if (!R) return go('memory', { subject });
  const acc = Math.round((R.ok / Math.max(R.asked, 1)) * 100);
  const M = mem();
  backdrop(el, R.test ? (R.passed ? 'win' : 'lose') : 'win');
  el.append(topBar(() => go('memory', { subject })),
    h('div', { class: 'mem-result' },
      h('div', { class: 'ex-score' },
        h('div', { class: 'es-main' },
          h('small', {}, R.test ? `🏅 ${ME.DECK[R.deck].title} 試験` : R.intro ? '🆕 顔合わせ' : `🔁 復習ラッシュ｜${ME.MODES[R.mode].name}`),
          h('div', { class: 'es-num' }, h('b', {}, `${R.ok}`), h('span', {}, ` / ${R.asked} 正解`)),
          R.test && h('b', { class: R.passed ? 'mm-pass' : 'mm-fail' }, R.passed ? '🏅 解読成功！（9割以上）' : `あと少し！（${acc}% → 90% で解読）`)),
        h('div', { class: 'mm-total' },
          [['🆕 新しく覚えた', R.news], ['⬆️ レベルアップ', R.ups], ['🔒 定着した', R.solid], ['✍️ 書けるように', R.wr], ['🔥 最大コンボ', R.maxCombo]].map(([k, v]) => h('div', {}, h('b', {}, String(v)), h('small', {}, k))))),
      h('p', { class: 'note center mm-gems' }, `💎 +${R.gems}${R.mode !== 'easy' ? `（${ME.MODES[R.mode].name} ×${ME.MODES[R.mode].mult}）` : ''}`),
      bonusChips(R.bonus),
      R.cards?.length > 0 && h('p', { class: 'note center' }, `🃏 カードゲット: ${R.cards.map((id) => GAME_CARDS.find((c) => c.id === id)?.name || id).join('、')}`),
      R.misses.length > 0 && h('h3', { class: 'sec' }, R.intro ? '😵 まちがえた暗号（顔合わせのあとの復習でまた出るよ）' : '😵 まちがえた暗号（少し時間をおいて、また出るよ）'),
      R.misses.length > 0 && h('div', { class: 'md-list' }, R.misses.map((id) => { const c = ME.CARD[id]; return h('div', { class: 'md-row' }, h('span', { class: 'mr-q' }, c.q), h('span', { class: 'mr-a' }, c.a)); })),
      h('div', { class: 'up-btns' },
        R.deck && !R.test ? btn('⚡ このデッキをもう1回', () => startRush(subject, { deck: R.deck }), 'primary') : nextButtons(subject, todayState(M, subject, Date.now()), M),
        btn('🔐 暗号室へ', () => go('memory', { subject }), 'ghost'))));
  if (!R.shown) { R.shown = true; flyGems(R.gems + (R.bonus?.gems || 0), el.querySelector('.mm-gems'), 400); }
}
