// 暗号室（暗記）のしくみ。DOM なし（テストからも使う）
//   ・カードごとにレベル 0〜6。正解するたびに次に出るまでの間隔がのびる（間隔反復）
//   ・答え方はレベルと難易度モードで変わる（4択 → 逆向き4択 → タイル → 文字入力）
//   ・1日の新しいカードは「教科の覚えやすさ × 今日のやる気 × ウォームアップの調子」で自動で決める
import { today } from '../core/store.js';
import { textChoice, spellAns, orderAns } from '../units/english/kit-en.js';
import { EN_DECKS, EN_CARDS, enDistinct } from './decks/en.js';
import { COURSES } from './courses.js';

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
// レベルごとの「次に出るまで」
export const INTERVAL = [0, 10 * MIN, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];
export const MAX_LV = 6;

export const MEM_SUBJECTS = {
  en: { id: 'en', name: '英単語', emoji: '🔤', newBase: 24, ready: true, distinct: enDistinct },
  soc: { id: 'soc', name: '社会', emoji: '🗾', newBase: 12, ready: false },
  sci: { id: 'sci', name: '理科', emoji: '🔬', newBase: 12, ready: false },
};
export const MODES = {
  easy: { name: 'イージー', desc: '4択だけ', mult: 1 },
  normal: { name: 'ノーマル', desc: '4択 → 覚えてきたら文字タイル', mult: 1.5 },
  hard: { name: 'ハード', desc: '文字タイル → 最後は文字入力', mult: 2 },
};
export const MOTIVATION = {
  low: { label: '😪 ちょっとだけ', mult: 0.5 },
  mid: { label: '🙂 ふつう', mult: 1 },
  high: { label: '🔥 がっつり', mult: 1.6 },
};
export const RUSH_SIZE = 20;
export const RUSH_MS = 4 * MIN;
const WARM_N = 5;
const BACKLOG = 40;
// これより時間がかかった正解は「あやしい」（レベルを上げない）
export const SLOW_MS = { e2j: 6000, j2e: 6000, tile: 15000, input: 20000 };
// 時間のバーの長さ
export const LIMIT_MS = { e2j: 8000, j2e: 8000, tile: 18000, input: 25000 };

export const DECKS = [...EN_DECKS];
export const CARDS = [...EN_CARDS];
export const CARD = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const DECK = Object.fromEntries(DECKS.map((d) => [d.id, { ...d, cards: CARDS.filter((c) => c.deck === d.id) }]));

// コースの順番でデッキを並べる
export function courseDecks(subject, courseId = 'standard') {
  const order = COURSES[courseId]?.order?.[subject] || [];
  const all = DECKS.filter((d) => d.subject === subject).map((d) => DECK[d.id]);
  return [...order.map((id) => DECK[id]).filter(Boolean), ...all.filter((d) => !order.includes(d.id))];
}

// ---------- 状態 ----------
// M = 保存データの memory（{ cards: { id: { lv, due, sel, wr, n, miss, seen } }, mode, day, course, decks }）
export const cardState = (M, id) => M.cards[id] || null;
export const modeOf = (M, subject) => M.mode?.[subject] || 'normal';
export function dayOf(M, now) {
  const d = today(new Date(now));
  if (!M.day || M.day.date !== d) M.day = { date: d, motivation: null, warm: { n: 0, ok: 0 }, newCount: {} };
  return M.day;
}
export const isDue = (cs, now) => !!cs && cs.lv >= 1 && cs.due <= now;
export const dueList = (M, subject, now) => CARDS.filter((c) => c.subject === subject && isDue(M.cards[c.id], now)).sort((a, b) => M.cards[a.id].due - M.cards[b.id].due);

// 1日の新しいカードの枠
export function newLimit(M, subject, now) {
  const day = dayOf(M, now);
  const base = MEM_SUBJECTS[subject].newBase;
  const mot = MOTIVATION[day.motivation]?.mult ?? 1;
  const warm = day.warm.n < WARM_N ? 1 : day.warm.ok >= WARM_N ? 1.2 : day.warm.ok <= WARM_N - 2 ? 0.7 : 1;
  // 復習がたまっていたら、新しいカードをへらす（多すぎたら0。先に復習を片づける）
  const nd = dueList(M, subject, now).length;
  const backlog = nd > BACKLOG ? 0 : nd > BACKLOG / 2 ? 0.5 : 1;
  return Math.round(base * mot * warm * backlog);
}
export const newLeft = (M, subject, now) => Math.max(0, newLimit(M, subject, now) - (dayOf(M, now).newCount[subject] || 0));

// ---------- ラッシュの組み立て ----------
// opts: { deck, weak, test }。戻り値: [{ id, intro }]（intro = 新しいカードの紹介。そのあと数枚あとに問題で出す）
export function buildRush(M, subject, rng, now, opts = {}) {
  const pool = CARDS.filter((c) => c.subject === subject && (!opts.deck || c.deck === opts.deck));
  if (opts.test) return rng.shuffle([...pool]).slice(0, 30).map((c) => ({ id: c.id }));
  if (opts.weak) {
    const weak = pool.filter((c) => { const cs = M.cards[c.id]; return cs && cs.miss > 0 && cs.lv <= 3; }).sort((a, b) => M.cards[a.id].lv - M.cards[b.id].lv);
    return weak.slice(0, RUSH_SIZE).map((c) => ({ id: c.id }));
  }
  const due = pool.filter((c) => isDue(M.cards[c.id], now)).sort((a, b) => M.cards[a.id].due - M.cards[b.id].due);
  const room = Math.max(0, Math.min(newLeft(M, subject, now), 8));
  const takeDue = due.slice(0, room > 0 ? 14 : RUSH_SIZE);
  // 新しいカードはコースの順番で
  const order = courseDecks(subject, M.course).flatMap((d) => d.cards).filter((c) => pool.includes(c) && !M.cards[c.id]);
  const news = order.slice(0, Math.min(room, RUSH_SIZE - takeDue.length));
  // まだ枠があれば「少し早めの復習」でうめる（間隔はのばさない）
  const fill = pool.filter((c) => M.cards[c.id] && !takeDue.includes(c)).sort((a, b) => M.cards[a.id].due - M.cards[b.id].due).slice(0, Math.max(0, RUSH_SIZE - takeDue.length - news.length));
  const reviews = rng.shuffle([...takeDue, ...fill]);
  // 新しいカードは等間隔にまぜる。紹介 → 3枚あとに問題
  const out = reviews.map((c) => ({ id: c.id }));
  const R = out.length;
  news.forEach((c, k) => {
    const at = Math.min(out.length, Math.round(((k + 0.5) * R) / Math.max(news.length, 1)) + k);
    out.splice(at, 0, { id: c.id, intro: true });
  });
  for (let k = out.length - 1; k >= 0; k--) {
    if (!out[k].intro) continue;
    out.splice(Math.min(out.length, k + 1 + 3), 0, { id: out[k].id, afterIntro: true });
  }
  return out;
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
    return { form, stem: card.a, ask: `つづりは？（${card.q.length}文字）`, ...spellAns(rng, card.q, { extra: 2 }) };
  }
  return { form, stem: card.a, ask: '英語で入力', input: { kind: 'text', accept: card.accept }, answerText: card.q };
}
// 文字入力の判定（大文字・小文字、前後の空白、連続した空白、’ はゆるす）
export const normText = (s) => String(s || '').trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ');
export const textOk = (q, s) => q.input.accept.some((a) => normText(a) === normText(s));

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
  if (ok) {
    if (!early) {
      if (!slow || cs.lv === 0) cs.lv = Math.min(MAX_LV, cs.lv + 1);
      cs.due = now + (slow && from > 0 ? 10 * MIN : from === MAX_LV ? 60 * DAY : INTERVAL[cs.lv]);
    }
  } else {
    cs.lv = 1;
    cs.due = now + 10 * MIN;
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
