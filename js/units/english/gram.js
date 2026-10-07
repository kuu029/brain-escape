// 英文を組み立てる部品（主語・動詞句・時を表す語）と、日本語訳。
// 英文は「かたまり（チャンク）」の配列で持つ。並べかえ問題ではチャンク＝タイル1枚。
import { third, ing, past, bePresent, bePast } from './lex.js';

// 主語
export const SUBJ = [
  { en: 'I', ja: '私', person: 1, num: 'sg' },
  { en: 'you', ja: 'あなた', person: 2, num: 'sg' },
  { en: 'he', ja: '彼', person: 3, num: 'sg' },
  { en: 'she', ja: '彼女', person: 3, num: 'sg' },
  { en: 'we', ja: '私たち', person: 1, num: 'pl' },
  { en: 'they', ja: '彼ら', person: 3, num: 'pl' },
  { en: 'Ken', ja: 'ケン', person: 3, num: 'sg' },
  { en: 'Yumi', ja: 'ユミ', person: 3, num: 'sg' },
  { en: 'my brother', ja: '私の兄', person: 3, num: 'sg' },
  { en: 'my sister', ja: '私の姉', person: 3, num: 'sg' },
  { en: 'Tom and I', ja: 'トムと私', person: 1, num: 'pl' },
  { en: 'my friends', ja: '私の友だち', person: 3, num: 'pl' },
];
export const is3sg = (s) => s.person === 3 && s.num === 'sg';
export const SUBJ3 = SUBJ.filter(is3sg);
export const SUBJ_NON3 = SUBJ.filter((s) => !is3sg(s));
// 疑問文の主語（I・Tom and I で「〜しますか」は不自然なので除く）
export const SUBJ_Q = SUBJ.filter((s) => s.person !== 1);

// 動作の動詞句
// dict: 辞書形（〜する）、stem: 「〜ます」の前、te: 「〜て」の形
// habit: この動詞句に合う「いつも」の語（省略時は TIME.habit から）
const A = (v, obj, dict, stem, te, habit = null) => ({ v, obj, dict, stem, te, habit, action: true });
export const VP_ACTION = [
  A('play', 'tennis', 'テニスをする', 'テニスをし', 'テニスをして'),
  A('play', 'the piano', 'ピアノをひく', 'ピアノをひき', 'ピアノをひいて'),
  A('play', 'soccer', 'サッカーをする', 'サッカーをし', 'サッカーをして'),
  A('study', 'English', '英語を勉強する', '英語を勉強し', '英語を勉強して'),
  A('study', 'math', '数学を勉強する', '数学を勉強し', '数学を勉強して'),
  A('watch', 'TV', 'テレビを見る', 'テレビを見', 'テレビを見て'),
  A('read', 'a book', '本を読む', '本を読み', '本を読んで'),
  A('write', 'a letter', '手紙を書く', '手紙を書き', '手紙を書いて'),
  A('cook', 'dinner', '夕食を作る', '夕食を作り', '夕食を作って'),
  A('eat', 'breakfast', '朝食を食べる', '朝食を食べ', '朝食を食べて'),
  A('drink', 'milk', '牛乳を飲む', '牛乳を飲み', '牛乳を飲んで'),
  A('go', 'to school', '学校へ行く', '学校へ行き', '学校へ行って'),
  A('walk', 'to the station', '駅まで歩く', '駅まで歩き', '駅まで歩いて'),
  A('swim', 'in the river', '川で泳ぐ', '川で泳ぎ', '川で泳いで'),
  A('listen', 'to music', '音楽を聞く', '音楽を聞き', '音楽を聞いて'),
  A('clean', 'the room', '部屋をそうじする', '部屋をそうじし', '部屋をそうじして'),
  A('wash', 'the dishes', '皿を洗う', '皿を洗い', '皿を洗って'),
  A('help', 'the teacher', '先生を手伝う', '先生を手伝い', '先生を手伝って'),
  A('run', 'in the park', '公園で走る', '公園で走り', '公園で走って'),
  A('sing', 'a song', '歌を歌う', '歌を歌い', '歌を歌って'),
  A('make', 'a cake', 'ケーキを作る', 'ケーキを作り', 'ケーキを作って'),
  A('use', 'a computer', 'コンピューターを使う', 'コンピューターを使い', 'コンピューターを使って'),
  A('speak', 'English', '英語を話す', '英語を話し', '英語を話して'),
  A('teach', 'math', '数学を教える', '数学を教え', '数学を教えて'),
  A('carry', 'a box', '箱を運ぶ', '箱を運び', '箱を運んで'),
  A('take', 'pictures', '写真をとる', '写真をとり', '写真をとって'),
  A('have', 'lunch', '昼食を食べる', '昼食を食べ', '昼食を食べて'),
  A('dance', '', '踊る', '踊り', '踊って'),
  A('visit', 'Kyoto', '京都を訪れる', '京都を訪れ', '京都を訪れて', [['every summer', '毎年夏に']]),
  A('buy', 'bread', 'パンを買う', 'パンを買い', 'パンを買って', [['every morning', '毎朝'], ['on Sundays', '日曜日に']]),
  A('practice', 'the guitar', 'ギターを練習する', 'ギターを練習し', 'ギターを練習して'),
  A('jog', 'in the park', '公園でジョギングする', '公園でジョギングし', '公園でジョギングして', [['every morning', '毎朝']]),
];
// 状態の動詞句（進行形にしない）。日本語は形ごとに持つ
const ST = (v, obj, pres, neg, pastJ, pastNeg) => ({ v, obj, pres, neg, past: pastJ, pastNeg, action: false });
export const VP_STATE = [
  ST('like', 'cats', 'ねこが好きです', 'ねこが好きではありません', 'ねこが好きでした', 'ねこが好きではありませんでした'),
  ST('like', 'summer', '夏が好きです', '夏が好きではありません', '夏が好きでした', '夏が好きではありませんでした'),
  ST('know', 'Ken', 'ケンを知っています', 'ケンを知りません', 'ケンを知っていました', 'ケンを知りませんでした'),
  ST('live', 'in Osaka', '大阪に住んでいます', '大阪に住んでいません', '大阪に住んでいました', '大阪に住んでいませんでした'),
  ST('have', 'a dog', '犬を飼っています', '犬を飼っていません', '犬を飼っていました', '犬を飼っていませんでした'),
  ST('want', 'a new bike', '新しい自転車がほしいです', '新しい自転車はほしくありません', '新しい自転車がほしかったです', '新しい自転車はほしくありませんでした'),
  ST('need', 'a pen', 'ペンが必要です', 'ペンは必要ではありません', 'ペンが必要でした', 'ペンは必要ではありませんでした'),
];
export const VP_ALL = [...VP_ACTION, ...VP_STATE];

// 時を表す語（英文の最後に置く）
export const TIME = {
  habit: [['every day', '毎日'], ['every morning', '毎朝'], ['on Sundays', '日曜日に'], ['after school', '放課後']],
  past: [['yesterday', '昨日'], ['last week', '先週'], ['last Sunday', 'この前の日曜日'], ['two days ago', '2日前']],
  now: [['now', '今']],
};
// 動詞句に合う時の語。状態の動詞（like, live など）に「毎日」「2日前」は不自然なので、
// いつも → なし、過去 → last year（去年）にする
export function pickTime(rng, vp, kind) {
  if (kind === 'habit') return vp.action ? rng.pick(vp.habit || TIME.habit) : ['', ''];
  if (kind === 'past') return vp.action ? rng.pick(TIME.past) : ['last year', '去年'];
  return rng.pick(TIME[kind]);
}

// 動詞の形
export function verbForm(vp, subj, tense) {
  if (tense === 'past') return past(vp.v);
  if (tense === 'prog') return `${bePresent(subj)} ${ing(vp.v)}`;
  return is3sg(subj) ? third(vp.v) : vp.v;
}

// 日本語の述語
function jaPred(vp, tense, type) {
  if (!vp.action) {
    if (tense === 'past') return type === 'neg' ? vp.pastNeg : type === 'q' ? `${vp.past}か` : vp.past;
    return type === 'neg' ? vp.neg : type === 'q' ? `${vp.pres}か` : vp.pres;
  }
  if (tense === 'prog') return type === 'neg' ? `${vp.te}いません` : type === 'q' ? `${vp.te}いますか` : `${vp.te}います`;
  if (tense === 'past') return type === 'neg' ? `${vp.stem}ませんでした` : type === 'q' ? `${vp.stem}ましたか` : `${vp.stem}ました`;
  return type === 'neg' ? `${vp.stem}ません` : type === 'q' ? `${vp.stem}ますか` : `${vp.stem}ます`;
}
export function jaSentence(subj, vp, tense, type, timeJa = '') {
  return `${subj.ja}は${timeJa ? `${timeJa}、` : ''}${jaPred(vp, tense, type)}${type === 'q' ? '？' : '。'}`;
}

// 文をチャンクの配列で作る。type: pos | neg | q
export function clause(subj, vp, tense, type) {
  const obj = vp.obj ? [vp.obj] : [];
  const s = subj.en;
  if (tense === 'prog') {
    const be = bePresent(subj);
    if (type === 'neg') return [s, be, 'not', ing(vp.v), ...obj];
    if (type === 'q') return [cap(be), s, ing(vp.v), ...obj];
    return [s, be, ing(vp.v), ...obj];
  }
  const aux = tense === 'past' ? 'did' : is3sg(subj) ? 'does' : 'do';
  if (type === 'neg') return [s, aux, 'not', vp.v, ...obj];
  if (type === 'q') return [cap(aux), s, vp.v, ...obj];
  return [s, verbForm(vp, subj, tense), ...obj];
}

export const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
// チャンク配列 → 英文（先頭は大文字、最後に記号）
export function sentence(chunks, end = '.') {
  const t = chunks.filter(Boolean).join(' ').replace(/ ,/g, ',');
  return `${cap(t)}${end}`;
}
// be 動詞の補語（単数形・複数形）
// ja: [今, 過去, 今の否定, 過去の否定]。noPast: 過去の文に使わない
const noun = (n) => [`${n}です`, `${n}でした`, `${n}ではありません`, `${n}ではありませんでした`];
const iru = (p) => [`${p}います`, `${p}いました`, `${p}いません`, `${p}いませんでした`];
export const COMPLEMENT = [
  { sg: 'a student', pl: 'students', ja: noun('生徒') },
  { sg: 'a teacher', pl: 'teachers', ja: noun('先生') },
  { sg: 'busy', pl: 'busy', ja: ['忙しいです', '忙しかったです', '忙しくありません', '忙しくありませんでした'] },
  { sg: 'hungry', pl: 'hungry', ja: iru('おなかがすいて') },
  { sg: 'tired', pl: 'tired', ja: iru('疲れて') },
  { sg: 'from Canada', pl: 'from Canada', ja: noun('カナダ出身'), noPast: true },
  { sg: 'in the gym', pl: 'in the gym', ja: iru('体育館に') },
  { sg: 'at home', pl: 'at home', ja: iru('家に') },
  { sg: 'a soccer fan', pl: 'soccer fans', ja: noun('サッカーファン') },
  { sg: 'happy', pl: 'happy', ja: noun('幸せ') },
];
export const COMPLEMENT_PAST = COMPLEMENT.filter((c) => !c.noPast);
export const compOf = (c, subj) => (subj.num === 'pl' ? c.pl : c.sg);
export function jaBe(subj, c, tense, type, timeJa = '') {
  const p = c.ja[(tense === 'past' ? 1 : 0) + (type === 'neg' ? 2 : 0)];
  return `${subj.ja}は${timeJa ? `${timeJa}、` : ''}${p}${type === 'q' ? 'か？' : '。'}`;
}
export function beClause(subj, c, tense, type) {
  const be = tense === 'past' ? bePast(subj) : bePresent(subj);
  const comp = compOf(c, subj);
  if (type === 'neg') return [subj.en, be, 'not', comp];
  if (type === 'q') return [cap(be), subj.en, comp];
  return [subj.en, be, comp];
}

// ---------- 中2: 未来・過去進行形 ----------
export const TIME_FUTURE = [['tomorrow', '明日'], ['next week', '来週'], ['next Sunday', '今度の日曜日'], ['this weekend', '今週末']];
export const TIME_PASTPROG = [['at that time', 'そのとき'], ['at seven last night', '昨夜7時に']];

// will の文
export function willClause(subj, vp, type) {
  const obj = vp.obj ? [vp.obj] : [];
  if (type === 'neg') return [subj.en, 'will', 'not', vp.v, ...obj];
  if (type === 'q') return ['Will', subj.en, vp.v, ...obj];
  return [subj.en, 'will', vp.v, ...obj];
}
// be going to の文
export function goingClause(subj, vp, type) {
  const obj = vp.obj ? [vp.obj] : [];
  const be = bePresent(subj);
  if (type === 'neg') return [subj.en, be, 'not', 'going', 'to', vp.v, ...obj];
  if (type === 'q') return [cap(be), subj.en, 'going', 'to', vp.v, ...obj];
  return [subj.en, be, 'going', 'to', vp.v, ...obj];
}
export function jaFuture(subj, vp, kind, type, timeJa = '') {
  const t = timeJa ? `${timeJa}、` : '';
  let p;
  if (kind === 'going') p = type === 'neg' ? `${vp.dict}つもりはありません` : type === 'q' ? `${vp.dict}つもりですか` : `${vp.dict}つもりです`;
  else p = type === 'neg' ? `${vp.stem}ません` : type === 'q' ? `${vp.stem}ますか` : `${vp.stem}ます`;
  return `${subj.ja}は${t}${p}${type === 'q' ? '？' : '。'}`;
}
// 過去進行形の文
export function pastProgClause(subj, vp, type) {
  const obj = vp.obj ? [vp.obj] : [];
  const be = bePast(subj);
  if (type === 'neg') return [subj.en, be, 'not', ing(vp.v), ...obj];
  if (type === 'q') return [cap(be), subj.en, ing(vp.v), ...obj];
  return [subj.en, be, ing(vp.v), ...obj];
}
export function jaPastProg(subj, vp, type, timeJa = '') {
  const t = timeJa ? `${timeJa}、` : '';
  const p = type === 'neg' ? `${vp.te}いませんでした` : type === 'q' ? `${vp.te}いましたか` : `${vp.te}いました`;
  return `${subj.ja}は${t}${p}${type === 'q' ? '？' : '。'}`;
}
