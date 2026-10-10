// 国語 第2段階: 敬語（尊敬語・謙譲語・丁寧語）
//   データ: [ふつうの言い方, 尊敬語, 謙譲語, 謙譲語のほかの言い方[]]（特別な形の敬語）
//   ほかの言い方も正解なので、選択肢には並べない（例: 行く → 伺う・参る）
import { jaChoice } from './kit-ja.js';

export const VERBS = [
  ['言う', 'おっしゃる', '申し上げる', ['申す']],
  ['行く', 'いらっしゃる', '伺う', ['参る']],
  ['来る', 'いらっしゃる', '参る', ['伺う']], // 「伺う」も訪ねる意味で使えるので、選択肢に出さない
  ['いる', 'いらっしゃる', 'おる'],
  ['見る', 'ご覧になる', '拝見する'],
  ['食べる', '召し上がる', 'いただく'],
  ['する', 'なさる', 'いたす'],
  ['知る', 'ご存じだ', '存じ上げる'],
  ['聞く', 'お聞きになる', '伺う'],
  ['会う', 'お会いになる', 'お目にかかる'],
];
const ALL = [...new Set(VERBS.flatMap(([, a, b]) => [a, b]).filter(Boolean))];
const SONKEI = new Set(VERBS.map((v) => v[1]));
const KENJO = new Set(VERBS.map((v) => v[2]));
// 尊敬語と謙譲語の両方に出る語はない（データのまちがい探し）
export const OVERLAP = [...SONKEI].filter((x) => KENJO.has(x));

// 文の形: 目上の人が主語 → 尊敬語、自分が主語 → 謙譲語
const SON_SUBJ = ['先生が', '校長先生が', 'お客様が', '市長が'];
const KEN_SUBJ = ['私が', '私は', '私たちが'];
const OBJ = { 言う: '「ありがとう」と', 行く: '駅へ', 来る: '学校に', いる: '会議室に', 見る: '絵を', 食べる: 'ケーキを', する: '説明を', 知る: 'その方を', 聞く: '話を', 会う: '駅で' };

function genMake(rng) {
  const [plain, son, ken, kenAlt = []] = rng.pick(VERBS);
  const up = rng.chance(0.5);
  const ok = up ? [son] : [ken, ...kenAlt]; // 正解になる言い方（選択肢には1つだけ）
  const subj = rng.pick(up ? SON_SUBJ : KEN_SUBJ);
  const right = up ? son : ken;
  const wrongSame = up ? ken : son;
  const kind = up ? '尊敬語' : '謙譲語';
  return jaChoice(rng, {
    stem: `次の文の〔　〕を、正しい敬語に直すと？\n${subj}${OBJ[plain]}〔${plain}〕。`,
    correct: right,
    wrongs: [
      { t: wrongSame, msg: `「${wrongSame}」は${up ? '謙譲語' : '尊敬語'}。${up ? '目上の人の動作には尊敬語' : '自分の動作には謙譲語'}を使う。` },
      ...rng.shuffle(ALL.filter((x) => !ok.includes(x) && x !== wrongSame)).slice(0, 2).map((t) => ({ t, msg: `「${t}」は「${plain}」の敬語ではない。` })),
    ],
    hint: '目上の人の動作 → 尊敬語（相手を高める）、自分の動作 → 謙譲語（自分を低める）',
    steps: [`主語が「${subj.replace(/[がは]$/, '')}」→ ${up ? '目上の人の動作' : '自分の動作'} → ${kind}`, `「${plain}」の${kind} →「${right}」`],
    verify: (t) => ok.includes(t) && (up ? SONKEI.has(t) : KENJO.has(t) || kenAlt.includes(t)),
  });
}

// 敬語の種類を答える
const TEINEI = [['これは私の本【です】。', 'です'], ['毎朝七時に起き【ます】。', 'ます'], ['あちらが駅で【ございます】。', 'ございます']];
function genKind(rng) {
  const t = rng.int(0, 2);
  let s, ans;
  if (t === 2) { [s] = rng.pick(TEINEI); ans = '丁寧語'; } else {
    const [plain, son, ken] = rng.pick(VERBS);
    if (t === 0) { s = `${rng.pick(SON_SUBJ)}${OBJ[plain]}【${son}】。`; ans = '尊敬語'; } else { s = `${rng.pick(KEN_SUBJ)}${OBJ[plain]}【${ken}】。`; ans = '謙譲語'; }
  }
  const why = { 尊敬語: '相手（目上の人）の動作を高めて言う → 尊敬語', 謙譲語: '自分の動作をへりくだって言い、相手を高める → 謙譲語', 丁寧語: '「です・ます・ございます」で、聞き手にていねいに言う → 丁寧語' };
  return jaChoice(rng, {
    stem: `次の文の【　】の敬語の種類は？\n${s}`,
    correct: ans,
    wrongs: ['尊敬語', '謙譲語', '丁寧語'].filter((x) => x !== ans).map((x) => ({ t: x, msg: why[ans] })),
    n: 3,
    hint: 'だれの動作か？ 目上の人 → 尊敬語、自分 → 謙譲語。です・ます → 丁寧語',
    steps: [why[ans]],
    verify: (x) => x === ans,
  });
}

export default {
  id: 'ja-keigo',
  subject: 'japanese',
  stage: 2,
  area: '国語棟・執事の応接室',
  title: '敬語',
  emoji: '🎩',
  prereqs: ['ja-hinshi'],
  tool: 'heal',
  hintCard: [
    '尊敬語: 目上の人の動作を高める（いらっしゃる・おっしゃる・ご覧になる・召し上がる）',
    '謙譲語: 自分の動作をへりくだる（参る・伺う・申し上げる・拝見する・いただく）',
    '丁寧語: です・ます・ございます',
    'まちがい注意: ×先生が拝見する（→ ご覧になる）／ ×私がいらっしゃる（→ 参る）',
  ],
  generators: {
    'kg-make': { difficulty: 2, gen: genMake },
    'kg-kind': { difficulty: 1, gen: genKind },
  },
  lessons: [
    {
      id: 'kg-l1',
      title: '敬語の3種類',
      unlocks: ['kg-kind'],
      build(rng) {
        return [
          { text: '敬語は3種類。\n尊敬語: 目上の人の動作を高める（先生がいらっしゃる）\n謙譲語: 自分の動作をへりくだる（私が参る）\n丁寧語: です・ます・ございます' },
          { text: 'だれの動作かを見るのがコツ。', q: genKind(rng) },
          { text: 'もう1問。', q: genKind(rng) },
        ];
      },
    },
    {
      id: 'kg-l2',
      title: '敬語に直す',
      unlocks: ['kg-make'],
      build(rng) {
        return [
          { text: '特別な形の敬語を覚えよう。\n言う → おっしゃる／申し上げる　見る → ご覧になる／拝見する\n食べる → 召し上がる／いただく　行く → いらっしゃる／伺う' },
          { text: '主語がだれかを見て、尊敬語か謙譲語かを選ぶ。', q: genMake(rng) },
          { text: 'もう1問。', q: genMake(rng) },
        ];
      },
    },
  ],
};
