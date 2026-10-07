// 英語 第2段階: 接続詞（when / if / because / that）
import { frameQ, orderAns } from './kit-en.js';
import { cap } from './gram.js';

// 2つの文をつなぐテンプレート。front: 接続詞が文の最初に来る形（, で区切る）
// main / sub: 主節・従属節のチャンク、conj: 接続詞、ja: 日本語
export const CONJ_T = [
  { conj: 'when', sub: ['I', 'came', 'home'], main: ['my mother', 'was', 'cooking', 'dinner'], v: 'cook', ja: '私が家に帰ったとき、母は夕食を作っていました。' },
  { conj: 'when', sub: ['Ken', 'called', 'me'], main: ['I', 'was', 'watching', 'TV'], v: 'watch', ja: 'ケンが電話をくれたとき、私はテレビを見ていました。' },
  { conj: 'when', sub: ['I', 'was', 'a child'], main: ['I', 'lived', 'in Osaka'], ja: '私は子どものころ、大阪に住んでいました。' },
  { conj: 'when', sub: ['I', 'got', 'up'], main: ['it', 'was', 'raining'], v: 'rain', ja: '私が起きたとき、雨が降っていました。' },
  { conj: 'if', sub: ['it', 'rains', 'tomorrow'], main: ['I', 'will', 'stay', 'home'], ja: 'もし明日雨が降ったら、私は家にいます。' },
  { conj: 'if', sub: ['you', 'are', 'free'], main: ['please', 'help', 'me'], ja: 'もしひまなら、私を手伝ってください。', imperative: true },
  { conj: 'if', sub: ['you', 'are', 'busy'], main: ['I', 'will', 'help', 'you'], ja: 'もしあなたが忙しいなら、私が手伝います。' },
  { conj: 'because', sub: ['I', 'was', 'tired'], main: ['I', 'went', 'to bed', 'early'], ja: '疲れていたので、私は早く寝ました。', back: true },
  { conj: 'because', sub: ['I', 'can', 'swim', 'in the sea'], main: ['I', 'like', 'summer'], ja: '海で泳げるので、私は夏が好きです。', back: true },
  { conj: 'because', sub: ['it', 'was', 'raining'], main: ['we', 'stayed', 'home'], ja: '雨が降っていたので、私たちは家にいました。', back: true },
  { conj: 'that', sub: ['Ken', 'is', 'kind'], main: ['I', 'think'], ja: '私はケンは親切だと思います。', back: true },
  { conj: 'that', sub: ['she', 'is', 'busy'], main: ['I', 'know'], ja: '私は彼女が忙しいことを知っています。', back: true },
  { conj: 'that', sub: ['English', 'is', 'important'], main: ['we', 'think'], ja: '私たちは英語は大切だと思います。', back: true },
  { conj: 'that', sub: ['he', 'will', 'come', 'tomorrow'], main: ['I', 'hope'], ja: '私は彼が明日来ることを願っています。', back: true },
  { conj: 'when', sub: ['I', 'visited', 'Kyoto'], main: ['I', 'saw', 'many temples'], ja: '京都を訪れたとき、私はたくさんのお寺を見ました。' },
  { conj: 'when', sub: ['my father', 'came', 'home'], main: ['I', 'was', 'studying', 'math'], v: 'study', ja: '父が帰ってきたとき、私は数学を勉強していました。' },
  { conj: 'when', sub: ['I', 'was', 'ten'], main: ['I', 'started', 'playing', 'tennis'], ja: '10歳のとき、私はテニスを始めました。' },
  { conj: 'if', sub: ['you', 'have', 'time'], main: ['please', 'call', 'me'], ja: 'もし時間があれば、私に電話してください。', imperative: true },
  { conj: 'if', sub: ['you', 'are', 'hungry'], main: ['I', 'will', 'make', 'a sandwich'], ja: 'もしおなかがすいているなら、私がサンドイッチを作ります。' },
  { conj: 'because', sub: ['he', 'was', 'sick'], main: ['Ken', 'did', 'not', 'come', 'to school'], ja: '病気だったので、ケンは学校に来ませんでした。', back: true },
  { conj: 'because', sub: ['it', 'is', 'very hot', 'today'], main: ['I', 'want', 'some ice cream'], ja: '今日はとても暑いので、私はアイスクリームがほしいです。', back: true },
  { conj: 'that', sub: ['you', 'are', 'right'], main: ['I', 'think'], ja: '私はあなたが正しいと思います。', back: true },
  { conj: 'that', sub: ['Yumi', 'can', 'speak', 'English'], main: ['I', 'know'], ja: '私はユミが英語を話せることを知っています。', back: true },
  { conj: 'that', sub: ['it', 'will', 'rain', 'tomorrow'], main: ['I', 'think'], ja: '私は明日雨が降ると思います。', back: true },
];
const MEAN = { when: '〜するとき', if: 'もし〜なら', because: '〜なので（理由）', that: '〜ということ（think / know のあと）' };
// 文の形: 前置き（When 〜, 主節.）か 後ろ置き（主節 when 〜.）
function shape(T, front) {
  if (front) return { chunks: [cap(T.conj), ...T.sub, ',', ...T.main], at: 0 };
  return { chunks: [...T.main, T.conj, ...T.sub], at: T.main.length };
}

function genChoose(rng) {
  const T = rng.pick(CONJ_T);
  const front = !T.back && rng.chance(0.5);
  const { chunks, at } = shape(T, front);
  const correct = front ? cap(T.conj) : T.conj;
  const others = Object.keys(MEAN).filter((c) => c !== T.conj && !(front && c === 'that'));
  return {
    ...frameQ(rng, {
      chunks: chunks.map((c, i) => (i === 0 && !front ? cap(c) : c)), at, correct, ja: T.ja,
      wrongs: others.map((c) => ({ t: front ? cap(c) : c, msg: `${c} は「${MEAN[c]}」。` })),
    }),
    hint: 'when（〜するとき）／ if（もし〜なら）／ because（〜なので）／ that（〜ということ）',
    steps: [`日本語「${T.ja}」→ ${MEAN[T.conj]} → ${T.conj}`],
    check: { kind: 'en-conj', conj: T.conj, others },
  };
}

// if / when のあとは、未来のことでも現在形
const IF_T = [
  { sub: ['it', 'X', 'tomorrow'], v: ['rains', 'will rain', 'rained', 'rain'], main: ['I', 'will', 'stay', 'home'], ja: 'もし明日雨が降ったら、私は家にいます。' },
  { sub: ['Ken', 'X', 'here', 'tomorrow'], v: ['comes', 'will come', 'came', 'come'], main: ['I', 'will', 'tell', 'him'], ja: 'もし明日ケンがここに来たら、私が彼に伝えます。' },
  { sub: ['it', 'X', 'sunny', 'tomorrow'], v: ['is', 'will be', 'was', 'are'], main: ['we', 'will', 'go', 'to the beach'], ja: 'もし明日晴れたら、私たちは浜辺へ行きます。' },
];
function genIf(rng) {
  const T = rng.pick(IF_T);
  const front = rng.chance(0.5);
  const sub = T.sub.map((c) => (c === 'X' ? T.v[0] : c));
  const chunks = front ? ['If', ...sub, ',', ...T.main] : [...T.main.map((c, i) => (i === 0 ? cap(c) : c)), 'if', ...sub];
  const at = chunks.indexOf(T.v[0]);
  return {
    ...frameQ(rng, {
      chunks, at, correct: T.v[0], ja: T.ja,
      wrongs: [{ t: T.v[1], msg: 'if（もし〜なら）の中は、未来のことでも現在形！ will は使わない。' }, { t: T.v[2], msg: '明日のこと。if の中は現在形。' }, { t: T.v[3], msg: '主語に合わせた現在形にする。' }],
    }),
    hint: 'if / when の中は、未来のことでも現在形（If it rains tomorrow, 〜）',
    steps: ['if の中 → 現在形', `→ ${T.v[0]}`],
  };
}

// when 〜 の時制（過去の文の中では過去）
function genWhen(rng) {
  const T = rng.pick(CONJ_T.filter((x) => x.v));
  const be = T.main[1];
  const v = T.main[2];
  const right = `${be} ${v}`;
  const now = be === 'was' ? 'is' : 'are';
  const base = T.v;
  const chunks = [cap(T.conj), ...T.sub, ',', T.main[0], right, ...T.main.slice(3)];
  return {
    ...frameQ(rng, {
      chunks, at: T.sub.length + 3, correct: right, ja: T.ja,
      wrongs: [{ t: `${now} ${v}`, msg: '「〜したとき」は過去のこと。主節も過去（was / were 〜ing）。' }, { t: `will ${base}`, msg: '過去のことなので will は使わない。' }, { t: `${be === 'was' ? 'were' : 'was'} ${v}`, msg: `主語が ${T.main[0]} なら ${be}。` }],
    }),
    hint: 'When 〜（過去）のとき、主節も過去にそろえる。「〜していた」は was / were ＋ -ing。',
    steps: ['when の文が過去 → 主節も過去', `→ ${right}`],
  };
}

function genOrder(rng) {
  const T = rng.pick(CONJ_T.filter((x) => !x.imperative));
  const chunks = [...T.main, T.conj, ...T.sub];
  // 別の接続詞を不要タイルにすると、意味はちがっても文法的には正しい文になってしまうので、入らない語を使う
  const decoy = T.conj === 'if' || T.conj === 'when' ? 'will' : 'did';
  const why = decoy === 'will' ? `${T.conj} の中は will を使わない（未来でも現在形）。` : 'did は使わない。';
  return {
    stem: `日本語に合うように並べかえよう\n${T.ja}`,
    ...orderAns(rng, chunks, { decoys: [{ t: decoy, msg: why }] }),
    hint: '接続詞 ＋ 主語 ＋ 動詞 のかたまりを作ってから、もう1つの文とつなぐ。',
    steps: [`${T.conj} ＋ ${T.sub.join(' ')}`],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-conj',
  subject: 'english',
  stage: 2,
  area: '英語棟・連絡通路',
  title: '接続詞（when / if / because / that）',
  emoji: '🔗',
  prereqs: ['en-past'],
  tool: 'rewind',
  hintCard: [
    'when 〜（〜するとき）／ if 〜（もし〜なら）／ because 〜（〜なので）',
    'I think that 〜（〜だと思う）。that は省略してもOK',
    'if / when の中は、未来のことでも現在形（If it rains tomorrow, 〜）',
    'When 〜, が文の最初に来たら、カンマで区切る',
  ],
  generators: {
    'cj-choose': { difficulty: 1, gen: genChoose },
    'cj-if': { difficulty: 2, gen: genIf },
    'cj-when': { difficulty: 2, gen: genWhen },
    'cj-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'cj-l1',
      title: '接続詞の意味',
      unlocks: ['cj-choose', 'cj-order'],
      build(rng) {
        return [
          { text: '接続詞は2つの文をつなぐ。', en: 'When I came home, my mother was cooking.\nI like summer because I can swim.\nI think that Ken is kind.' },
          { text: 'when・if は文の最初にも後ろにも置ける。最初に置いたらカンマ（,）で区切る。', en: 'When I came home, she was cooking.\n＝ She was cooking when I came home.' },
          { text: 'やってみよう。', q: genChoose(rng) },
          { text: 'もう1問。', q: genChoose(rng) },
        ];
      },
    },
    {
      id: 'cj-l2',
      title: 'if / when の中の時制',
      unlocks: ['cj-if', 'cj-when'],
      build(rng) {
        return [
          { text: '⚠️ if・when の中は、明日のことでも現在形。', en: '× If it will rain tomorrow, 〜\n○ If it rains tomorrow, I will stay home.' },
          { text: '過去の話では、when の中も主節も過去にそろえる。', en: 'When I came home, my mother was cooking.' },
          { text: 'やってみよう。', q: genIf(rng) },
          { text: 'もう1問。', q: genWhen(rng) },
        ];
      },
    },
  ],
};
