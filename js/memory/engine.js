// 暗号室（暗記）のしくみ。DOM なし（テストからも使う）
//   ・1日の流れ: ①顔合わせ（今日の新しい暗号を全部1回ずつ見て、1問ずつ答える）→ ②反復（復習ラッシュ）
//     顔合わせで見たカードは、その日の顔合わせが終わる（または復習ラッシュを始める）まで出さない
//     → 同じ単語を短い時間に何度も解かせない
//   ・カードごとにレベル 0〜6。正解するたびに次に出るまでの間隔がのびる（間隔反復）
//   ・答え方はレベルと難易度モードで変わる（4択 → 逆向き4択 → キーボード → 文字入力）
//   ・1日の新しいカードは「教科の覚えやすさ × 今日のやる気 × ウォームアップの調子」で自動で決める。追加もできる
import { today } from '../core/store.js';
import { textChoice, spellAns, orderAns } from '../units/english/kit-en.js';
import { EN_DECKS, EN_CARDS, enDistinct } from './decks/en.js';
import { SOC, SCI, termDistinct, normJa } from './decks/terms.js';
import { COURSES } from './courses.js';

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
// レベルごとの「次に出るまで」
export const INTERVAL = [0, 20 * MIN, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];
export const MAX_LV = 6;

export const MEM_SUBJECTS = {
  en: { id: 'en', name: '英単語', emoji: '🔤', newBase: 50, ready: true, distinct: enDistinct },
  // 社会・理科は β（手で書いた用語データ。家族にも確かめてもらう）
  soc: { id: 'soc', name: '社会', emoji: '🗾', newBase: 15, ready: true, beta: true, distinct: termDistinct },
  sci: { id: 'sci', name: '理科', emoji: '🔬', newBase: 15, ready: true, beta: true, distinct: termDistinct },
};
export const MODES = {
  easy: { name: 'イージー', desc: '4択だけ', mult: 1 },
  normal: { name: 'ノーマル', desc: '4択 → 覚えてきたらキーボード', mult: 1.5 },
  hard: { name: 'ハード', desc: '候補キーボード → 最後は自分で入力', mult: 2 },
};
export const MOTIVATION = {
  low: { label: '😪 ちょっとだけ', mult: 0.6 },
  mid: { label: '🙂 ふつう', mult: 1 },
  high: { label: '🔥 がっつり', mult: 1.3 },
};
export const RUSH_SIZE = 20; // 復習ラッシュの枚数
export const INTRO_SIZE = 12; // 顔合わせ1回の新しいカード数（4枚ずつ「見る → 答える」）
const INTRO_GROUP = 4;
export const EXTRA_STEP = 10; // 「追加で覚える」1回ぶん
export const RUSH_MS = 4 * MIN;
const WARM_N = 5;
const BACKLOG = 150; // 復習待ちがこれ以上なら新しいカードを止める（半分の数で半分にする）
// これより時間がかかった正解は「あやしい」（レベルを上げない）
export const SLOW_MS = { e2j: 6000, j2e: 6000, tile: 15000, input: 20000 };
// 時間のバーの長さ
export const LIMIT_MS = { e2j: 8000, j2e: 8000, tile: 18000, input: 25000 };

export const DECKS = [...EN_DECKS, ...SOC.decks, ...SCI.decks];
export const CARDS = [...EN_CARDS, ...SOC.cards, ...SCI.cards];
export const CARD = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const DECK = Object.fromEntries(DECKS.map((d) => [d.id, { ...d, cards: CARDS.filter((c) => c.deck === d.id) }]));

// コースの順番でデッキを並べる
export function courseDecks(subject, courseId = 'standard') {
  const order = COURSES[courseId]?.order?.[subject] || [];
  const all = DECKS.filter((d) => d.subject === subject).map((d) => DECK[d.id]);
  return [...order.map((id) => DECK[id]).filter(Boolean), ...all.filter((d) => !order.includes(d.id))];
}

// ---------- 状態 ----------
// M = 保存データの memory（{ cards: { id: { lv, due, sel, wr, n, miss, seen, pend } }, mode, day, course, decks }）
//   pend: 顔合わせで見たばかり（その日の顔合わせが終わるまで復習に出さない）
export const cardState = (M, id) => M.cards[id] || null;
export const modeOf = (M, subject) => M.mode?.[subject] || 'normal';
export function dayOf(M, now) {
  const d = today(new Date(now));
  if (!M.day || M.day.date !== d) {
    // 日が変わったら、きのうの顔合わせのカードも復習に回す
    if (M.day) releasePending(M, null, now);
    M.day = { date: d, motivation: null, warm: { n: 0, ok: 0 }, newCount: {}, extra: {} };
  }
  M.day.extra ||= {};
  return M.day;
}
// 顔合わせで見たカードを、復習に出せるようにする
export function releasePending(M, subject, now) {
  for (const c of CARDS) {
    const cs = M.cards[c.id];
    if (cs?.pend && (!subject || c.subject === subject)) { delete cs.pend; cs.due = now; }
  }
}
export const isDue = (cs, now) => !!cs && !cs.pend && cs.lv >= 1 && cs.due <= now;
export const dueList = (M, subject, now) => CARDS.filter((c) => c.subject === subject && isDue(M.cards[c.id], now)).sort((a, b) => M.cards[a.id].due - M.cards[b.id].due);
export const pendingCount = (M, subject) => CARDS.filter((c) => c.subject === subject && M.cards[c.id]?.pend).length;
// 次に復習どきになる時刻（なければ null）
export function nextDue(M, subject) {
  let t = null;
  for (const c of CARDS) { const cs = M.cards[c.id]; if (c.subject === subject && cs && !cs.pend && cs.lv >= 1 && (t === null || cs.due < t)) t = cs.due; }
  return t;
}

// 1日の新しいカードの枠（追加ぶんもふくむ）
export function newLimit(M, subject, now) {
  const day = dayOf(M, now);
  const base = MEM_SUBJECTS[subject].newBase;
  const mot = MOTIVATION[day.motivation]?.mult ?? 1;
  const warm = day.warm.n < WARM_N ? 1 : day.warm.ok >= WARM_N ? 1.1 : day.warm.ok <= WARM_N - 2 ? 0.8 : 1;
  // 復習がたまっていたら、新しいカードをへらす（多すぎたら0。先に復習を片づける）
  const nd = dueList(M, subject, now).length;
  const backlog = nd > BACKLOG ? 0 : nd > BACKLOG / 2 ? 0.5 : 1;
  return Math.round(base * mot * warm * backlog) + (day.extra[subject] || 0);
}
export const newLeft = (M, subject, now) => Math.max(0, newLimit(M, subject, now) - (dayOf(M, now).newCount[subject] || 0));
export const unseenLeft = (M, subject) => CARDS.filter((c) => c.subject === subject && !M.cards[c.id]).length;
// 「追加で覚える」: 今日の枠を EXTRA_STEP 枚ふやす
export function addExtra(M, subject, now) {
  const day = dayOf(M, now);
  day.extra[subject] = (day.extra[subject] || 0) + EXTRA_STEP;
}

// ---------- ラッシュの組み立て ----------
// opts: { intro, deck, weak, test }。戻り値: [{ id, intro, afterIntro }]
//   intro: 顔合わせ（新しいカードを4枚ずつ「見る → まぜて答える」。同じラッシュでくり返さない）
//   ふつう: 復習ラッシュ（復習どきのカードだけ。まちがえても同じラッシュでは出さない）
//   deck / weak: デッキだけ・苦手だけ（期限前のカードもまぜる。期限前の正解では間隔をのばさない）
export function buildRush(M, subject, rng, now, opts = {}) {
  const pool = CARDS.filter((c) => c.subject === subject && (!opts.deck || c.deck === opts.deck));
  if (opts.test) return rng.shuffle([...pool]).slice(0, 30).map((c) => ({ id: c.id }));
  if (opts.weak) {
    const weak = pool.filter((c) => { const cs = M.cards[c.id]; return cs && !cs.pend && cs.miss > 0 && cs.lv <= 3; }).sort((a, b) => M.cards[a.id].lv - M.cards[b.id].lv);
    return weak.slice(0, RUSH_SIZE).map((c) => ({ id: c.id }));
  }
  if (opts.intro) {
    const order = courseDecks(subject, M.course).flatMap((d) => d.cards).filter((c) => pool.includes(c) && !M.cards[c.id]);
    const news = order.slice(0, Math.min(newLeft(M, subject, now), INTRO_SIZE));
    const out = [];
    for (let g = 0; g < news.length; g += INTRO_GROUP) {
      const grp = news.slice(g, g + INTRO_GROUP);
      out.push(...grp.map((c) => ({ id: c.id, intro: true })), ...rng.shuffle([...grp]).map((c) => ({ id: c.id, afterIntro: true })));
    }
    return out;
  }
  // 復習ラッシュを始めたら、顔合わせ済みのカードも復習に回す
  releasePending(M, subject, now);
  const due = pool.filter((c) => isDue(M.cards[c.id], now)).sort((a, b) => M.cards[a.id].due - M.cards[b.id].due);
  let list = due.slice(0, RUSH_SIZE);
  if (opts.deck && list.length < RUSH_SIZE) {
    list = [...list, ...pool.filter((c) => M.cards[c.id] && !list.includes(c)).sort((a, b) => M.cards[a.id].due - M.cards[b.id].due).slice(0, RUSH_SIZE - list.length)];
  }
  return rng.shuffle(list).map((c) => ({ id: c.id }));
}

// ---------- 問題 ----------
// 答え方: e2j（意味を選ぶ）/ j2e（英語を選ぶ）/ tile（文字・語のタイル）/ input（文字入力）
export function formFor(card, cs, mode, rng) {
  const lv = cs?.lv || 0;
  if (mode === 'easy') return lv <= 1 ? 'e2j' : rng.chance(0.7) ? 'j2e' : 'e2j';
  if (mode === 'hard') return lv === 0 ? 'e2j' : lv <= 4 ? 'tile' : 'input';
  return lv <= 1 ? 'e2j' : lv <= 3 ? 'j2e' : 'tile';
}

function distractors(card, rng, n = 3) {
  const S = MEM_SUBJECTS[card.subject];
  const same = CARDS.filter((c) => c.subject === card.subject && c.id !== card.id && c.kind === card.kind);
  const near = same.filter((c) => c.deck === card.deck && c.pos === card.pos);
  const out = [];
  for (const base of [near, same.filter((c) => c.pos === card.pos), same]) {
    for (const c of rng.shuffle([...base])) {
      if (out.length >= n) break;
      if (out.includes(c) || !S.distinct(card, c) || out.some((o) => !S.distinct(o, c))) continue;
      out.push(c);
    }
    if (out.length >= n) break;
  }
  return out;
}

// 問題オブジェクト（answerPad で出せる形）。input のときは { kind: 'text' }
export function makeQuestion(card, form, rng) {
  if (card.kind === 'term') return termQuestion(card, form, rng);
  if (form === 'e2j') {
    const ds = distractors(card, rng);
    return { form, stem: card.q, ask: '意味は？', ...textChoice(rng, card.a, ds.map((d) => ({ t: d.a }))), others: ds.map((d) => d.id) };
  }
  if (form === 'j2e') {
    const ds = distractors(card, rng);
    return { form, stem: card.a, ask: card.kind === 'phrase' ? '英語にすると？' : '英単語は？', ...textChoice(rng, card.q, ds.map((d) => ({ t: d.q }))), others: ds.map((d) => d.id) };
  }
  if (form === 'tile') {
    if (card.kind === 'phrase') return { form, stem: card.a, ask: '語をならべて英語に', ...orderAns(rng, card.q.split(' '), { end: '' }) };
    return { form, stem: card.a, ask: `つづりは？（${card.q.length}文字）`, ...spellAns(rng, card.q, { extra: 3 }) };
  }
  return { form, stem: card.a, ask: '英語で入力', input: { kind: 'text', accept: card.accept }, answerText: card.q };
}

// 社会・理科の用語: e2j = 用語 → 説明、j2e = 説明 → 用語、tile = 1文字ずつのタイル、input = 文字入力（ひらがなでもOK）
function termQuestion(card, form, rng) {
  if (form === 'e2j' || form === 'j2e') {
    const ds = distractors(card, rng);
    if (form === 'e2j') return { form, stem: card.q, ask: 'どういう意味？', ...textChoice(rng, card.a, ds.map((d) => ({ t: d.a }))), others: ds.map((d) => d.id) };
    return { form, stem: card.a, ask: 'この用語は？', ...textChoice(rng, card.q, ds.map((d) => ({ t: d.q }))), others: ds.map((d) => d.id) };
  }
  if (form === 'tile') {
    const chars = [...card.q];
    // まぎらわしい文字（同じデッキのほかの用語の文字）を少しまぜる
    const pool = [...new Set(CARDS.filter((c) => c.deck === card.deck && c.id !== card.id).flatMap((c) => [...c.q]))].filter((ch) => !chars.includes(ch) && ch !== '・');
    const decoys = rng.shuffle(pool).slice(0, chars.length > 8 ? 2 : 3).map((t) => ({ t }));
    return { form, stem: card.a, ask: `文字をならべて用語に（${chars.length}文字）`, ...orderAns(rng, chars, { end: '', decoys }) };
  }
  return { form, stem: card.a, ask: '用語を入力（ひらがなでもOK）', input: { kind: 'text', accept: card.accept, ja: true }, answerText: card.q };
}

// 文字入力の判定（大文字・小文字、前後の空白、連続した空白、’ はゆるす）。社会・理科はカタカナ・ひらがな・「・」のちがいもゆるす
export const normText = (s) => String(s || '').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
export const textOk = (q, s) => (q.input.ja ? q.input.accept.some((a) => normJa(a) === normJa(s)) : q.input.accept.some((a) => normText(a) === normText(s)));

// ---------- 結果を記録 ----------
// 戻り値: { from, to, isNew, early, gotSel, gotWr }
export function applyResult(M, card, { ok, form, ms }, now) {
  const day = dayOf(M, now);
  let cs = M.cards[card.id];
  const isNew = !cs;
  if (!cs) {
    cs = M.cards[card.id] = { lv: 0, due: now, sel: false, wr: false, n: 0, miss: 0, seen: now };
    day.newCount[card.subject] = (day.newCount[card.subject] || 0) + 1;
  }
  const from = cs.lv;
  const slow = ms > SLOW_MS[form];
  const early = cs.lv >= 2 && cs.due - now > 12 * 60 * MIN; // まだ期限まで間がある
  cs.n++;
  if (day.warm.n < WARM_N && !isNew) {
    day.warm.n++;
    if (ok) day.warm.ok++;
  }
  if (isNew) {
    // 顔合わせの1問: 正解でも不正解でもレベル1。今日の顔合わせが終わるまで復習には出さない
    cs.lv = 1;
    cs.pend = true;
    cs.due = now;
    if (!ok) cs.miss++;
  } else if (ok) {
    if (!early) {
      if (!slow) cs.lv = Math.min(MAX_LV, cs.lv + 1);
      cs.due = now + (slow ? INTERVAL[1] : from === MAX_LV ? 60 * DAY : INTERVAL[cs.lv]);
    }
  } else {
    cs.lv = 1;
    cs.due = now + INTERVAL[1];
    cs.miss++;
  }
  const gotSel = ok && !cs.sel && (form === 'j2e' || (form === 'e2j' && cs.lv >= 2));
  const gotWr = ok && !cs.wr && (form === 'tile' || form === 'input');
  if (gotSel) cs.sel = true;
  if (gotWr) cs.wr = true;
  if (!ok && (form === 'tile' || form === 'input')) cs.wr = false;
  cs.last = now;
  return { from, to: cs.lv, isNew, early, gotSel, gotWr };
}

// ---------- 進み具合 ----------
export function deckProgress(M, deck) {
  const cs = deck.cards.map((c) => M.cards[c.id]);
  const n = cs.length;
  return {
    n,
    seen: cs.filter(Boolean).length,
    sel: cs.filter((x) => x && (x.sel || x.lv >= 3)).length,
    wr: cs.filter((x) => x?.wr).length,
    solid: cs.filter((x) => x && x.lv >= 5).length,
    testable: n > 0 && cs.every((x) => x && x.lv >= 3),
  };
}
export const starsOf = (cs) => (!cs ? 0 : cs.lv >= 5 ? 3 : cs.lv >= 3 ? 2 : 1);
