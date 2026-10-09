// 暗号室「流れでつなげる」: 用語を1つずつ覚えるのではなく、時代の流れや分野と結びつけて覚える（社会・理科）
//   社会: 年表ならべかえ（古い順に4つ）／どっちが先？／この用語はどの時代？
//   理科: この用語はどの分野？（化学・物理・生物・地学）
// 間隔反復には入れない練習モード（1回 FLOW_N 問）。DOM なし（テストからも使う）
import { textChoice } from '../units/english/kit-en.js';
import { CARDS } from './engine.js';

export const FLOW_N = 10;
// 歴史のデッキ → 時代
export const ERA = { 'soc-his1': '古代（縄文〜平安）', 'soc-his2': '中世（鎌倉〜戦国）', 'soc-his3': '近世（江戸）', 'soc-his4': '近代（幕末〜大正）', 'soc-his5': '現代（昭和〜）' };
// 理科のデッキ → 分野
export const FIELD = { 'sci-chem': '化学', 'sci-chem2': '化学', 'sci-phys': '物理', 'sci-energy': '物理', 'sci-bio': '生物', 'sci-body': '生物', 'sci-earth': '地学', 'sci-earth2': '地学' };
export const yearOf = (c) => Number(c.q.replace(/年$/, ''));
const YEARS = () => CARDS.filter((c) => c.deck === 'soc-year');
const label = (c) => `${c.q}：${c.a}`;

function eraQ(rng) {
  const c = rng.pick(CARDS.filter((x) => ERA[x.deck]));
  const right = ERA[c.deck];
  const wrongs = rng.shuffle(Object.values(ERA).filter((e) => e !== right)).slice(0, 3).map((t) => ({ t }));
  return { type: 'era', stem: `${c.q}\n${c.a}`, ask: 'これはどの時代のこと？', ...textChoice(rng, right, wrongs), why: `${c.q} は ${right}。`, check: { kind: 'flow-era', id: c.id, era: right } };
}
function firstQ(rng) {
  const [a, b] = rng.shuffle(YEARS()).slice(0, 2);
  const [early, late] = yearOf(a) < yearOf(b) ? [a, b] : [b, a];
  return { type: 'first', stem: 'どちらが先に起きた？', ask: '年表を思いうかべよう', ...textChoice(rng, early.a, [{ t: late.a }]), why: `${label(early)}\n→ ${label(late)}`, check: { kind: 'flow-first', ids: [early.id, late.id] } };
}
function orderQ(rng) {
  const pick = rng.shuffle(YEARS()).slice(0, 4).sort((x, y) => yearOf(x) - yearOf(y));
  const answer = pick.map((c) => c.a);
  const tiles = rng.shuffle([...answer]);
  return {
    type: 'order', stem: '古い順にならべよう', ask: '左（上）がいちばん古い',
    input: { kind: 'order', tiles, answer, prefix: '', suffix: '', extra: 0 },
    answerText: answer.join(' → '),
    wrong: [],
    why: pick.map(label).join('\n→ '),
    check: { kind: 'flow-order', ids: pick.map((c) => c.id) },
  };
}
function fieldQ(rng) {
  const c = rng.pick(CARDS.filter((x) => FIELD[x.deck]));
  const right = FIELD[c.deck];
  const wrongs = ['化学', '物理', '生物', '地学'].filter((f) => f !== right).map((t) => ({ t }));
  return { type: 'field', stem: `${c.q}\n${c.a}`, ask: 'どの分野の用語？', ...textChoice(rng, right, wrongs), why: `${c.q} は ${right}の用語。`, check: { kind: 'flow-field', id: c.id, field: right } };
}

export function flowQuestion(subject, rng) {
  if (subject === 'sci') return fieldQ(rng);
  const t = rng.int(0, 2);
  return t === 0 ? orderQ(rng) : t === 1 ? firstQ(rng) : eraQ(rng);
}
export const hasFlow = (subject) => subject === 'soc' || subject === 'sci';
