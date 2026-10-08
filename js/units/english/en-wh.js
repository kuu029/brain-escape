// 英語 第1段階: 疑問詞（what / who / where / when / whose / which / how）
import { frameQ, orderAns, textChoice } from './kit-en.js';
import { third, past } from './lex.js';

// 質問のテンプレート。q: チャンク、cue: 何をたずねているか、ans: 答えの文、ng: 空欄に入れると紛らわしいので選択肢に出さない疑問詞
const CITIES = ['Osaka', 'Nara', 'Kyoto', 'Kobe', 'Tokyo'];
const NAMES = [['Yumi', 'She'], ['Emma', 'She'], ['Ken', 'He'], ['Tom', 'He']];
const THINGS = [['a pen', 'ペン'], ['a camera', 'カメラ'], ['an eraser', '消しゴム'], ['a key', 'かぎ']];
const SPORTS = [['tennis', 'テニス'], ['soccer', 'サッカー'], ['baseball', '野球']];
const MONTHS = ['May', 'June', 'July', 'April'];
const RIDES = [['bike', '自転車'], ['bus', 'バス'], ['train', '電車']];
const NAME_JA = { Yumi: 'ユミ', Emma: 'エマ', Ken: 'ケン', Tom: 'トム' };

export const TEMPLATES = [
  (r) => ({ q: ['Where', 'do', 'you', 'live'], ja: 'あなたはどこに住んでいますか？', ans: `I live in ${r.pick(CITIES)}.`, cue: 'place' }),
  (r) => { const [n, p] = r.pick(NAMES); return { q: ['Where', 'does', n, 'live'], ja: `${n === 'Emma' ? 'エマ' : n === 'Yumi' ? 'ユミ' : n === 'Ken' ? 'ケン' : 'トム'}はどこに住んでいますか？`, ans: `${p} lives in ${r.pick(CITIES)}.`, cue: 'place' }; },
  (r) => ({ q: ['Where', 'is', 'my bag'], ja: '私のかばんはどこですか？', ans: `It is ${r.pick(['on the desk', 'under the chair', 'in your room'])}.`, cue: 'place' }),
  (r) => ({ q: ['When', 'is', 'your birthday'], ja: 'あなたの誕生日はいつですか？', ans: `It is ${r.pick(MONTHS)} ${r.int(1, 28)}.`, cue: 'time', ng: ['What'] }),
  (r) => { const [s] = r.pick(SPORTS); return { q: ['When', 'do', 'you', 'play', s], ja: `あなたはいつ${SPORTS.find((x) => x[0] === s)[1]}をしますか？`, ans: r.pick(['After school.', 'On Sundays.']), cue: 'time', ng: ['What'] }; },
  (r) => { const [t, tj] = r.pick(THINGS); return { q: ['What', 'do', 'you', 'have'], tail: 'in your hand', ja: 'あなたは手に何を持っていますか？', ans: `I have ${t}.`, cue: 'thing', ng: ['Which'], tj }; },
  (r) => { const [t] = r.pick(THINGS); return { q: ['What', 'is', 'this'], ja: 'これは何ですか？', ans: `It is ${t}.`, cue: 'thing', ng: ['Which'] }; },
  (r) => ({ q: ['What', 'time', 'is', 'it'], ja: '何時ですか？', ans: `It is ${r.pick(['seven', 'eight', 'ten', 'three'])} o'clock.`, cue: 'clock', ng: ['Which'] }),
  (r) => { const [s] = r.pick(SPORTS); return { q: ['What', 'sport', 'do', 'you', 'like'], ja: 'あなたは何のスポーツが好きですか？', ans: `I like ${s}.`, cue: 'thing', ng: ['Which'] }; },
  (r) => { const [n, p] = r.pick(NAMES); const g = p === 'She' ? 'that girl' : 'that boy'; return { q: ['Who', 'is', g], ja: `${p === 'She' ? 'あの女の子' : 'あの男の子'}はだれですか？`, ans: `${p} is ${n}.`, cue: 'person' }; },
  (r) => { const [n] = r.pick(NAMES); return { q: ['Who', 'plays', 'the piano'], ja: 'だれがピアノをひきますか？', ans: `${n} does.`, cue: 'person' }; },
  (r) => { const [t, tj] = r.pick([['bag', 'かばん'], ['pen', 'ペン'], ['bike', '自転車']]); return { q: ['Whose', t, 'is', 'this'], ja: `これはだれの${tj}ですか？`, ans: `It is ${r.pick(['mine', 'hers', 'his'])}.`, cue: 'owner', ng: ['Which', 'What'] }; },
  () => ({ q: ['Which', 'do', 'you', 'like'], tail: ', cats or dogs', ja: 'ねこと犬では、あなたはどちらが好きですか？', ans: 'I like dogs.', cue: 'choice', ng: ['What', 'Who'] }),
  (r) => { const [v, vj] = r.pick(RIDES); return { q: ['How', 'do', 'you', 'go', 'to school'], ja: 'あなたはどうやって学校へ行きますか？', ans: `By ${v}.`, cue: 'way', vj }; },
  (r) => ({ q: ['How', 'many', 'books', 'do', 'you', 'have'], ja: 'あなたは本を何冊持っていますか？', ans: `I have ${r.pick(['three', 'five', 'ten'])} books.`, cue: 'count', ng: ['What'] }),
  (r) => { const [n, p] = r.pick(NAMES); const [sp, sj] = r.pick(SPORTS); return { q: ['When', 'does', n, 'play', sp], ja: `${NAME_JA[n]}はいつ${sj}をしますか？`, ans: `${p} plays ${sp} ${r.pick(['after school', 'on Sundays'])}.`, cue: 'time', ng: ['What'] }; },
  (r) => { const [sp, sj] = r.pick(SPORTS); return { q: ['Where', 'do', 'you', 'play', sp], ja: `あなたはどこで${sj}をしますか？`, ans: `I play ${sp} in the park.`, cue: 'place' }; },
  (r) => { const [n, p] = r.pick(NAMES); const [v] = r.pick(RIDES); return { q: ['How', 'does', n, 'go', 'to school'], ja: `${NAME_JA[n]}はどうやって学校へ行きますか？`, ans: `By ${v}.`, cue: 'way' }; },
  (r) => ({ q: ['Where', 'did', 'you', 'go'], tail: 'yesterday', ja: 'あなたは昨日どこへ行きましたか？', ans: `I went to ${r.pick(CITIES)}.`, cue: 'place' }),
  (r) => { const [n, p] = r.pick(NAMES); return { q: ['Where', 'did', n, 'go'], tail: 'last Sunday', ja: `${NAME_JA[n]}はこの前の日曜日にどこへ行きましたか？`, ans: `${p} went to ${r.pick(CITIES)}.`, cue: 'place' }; },
  (r) => { const [n, p] = r.pick(NAMES); return { q: ['Who', 'is', n], ja: `${NAME_JA[n]}はだれですか？`, ans: `${p} is my friend.`, cue: 'person' }; },
  (r) => ({ q: ['How', 'old', 'is', 'your brother'], ja: 'あなたのお兄さんは何歳ですか？', ans: `He is ${r.pick(['fifteen', 'sixteen', 'twenty'])} years old.`, cue: 'age' }),
];
// 疑問詞が何をたずねるか
export const WH_OF = { place: 'Where', time: 'When', thing: 'What', clock: 'What', person: 'Who', owner: 'Whose', choice: 'Which', way: 'How', count: 'How', age: 'How' };
const WH_JA = { Where: 'どこ', When: 'いつ', What: '何', Who: 'だれ', Whose: 'だれの', Which: 'どちら', How: 'どのように・どのくらい' };
const ALL_WH = ['Where', 'When', 'What', 'Who', 'Whose', 'Which', 'How'];

const tailText = (t) => (t.tail ? ` ${t.tail}`.replace(' ,', ',') : '');

function genChoose(rng) {
  const t = rng.pick(TEMPLATES)(rng);
  const correct = t.q[0];
  const others = rng.shuffle(ALL_WH.filter((w) => w !== correct && !(t.ng || []).includes(w))).slice(0, 3);
  return {
    ...frameQ(rng, {
      chunks: t.q, at: 0, correct, tail: t.tail || '', end: '?', ja: t.ja,
      wrongs: others.map((w) => ({ t: w, msg: `${w} は「${WH_JA[w]}」。答えが「${t.ans}」なので ${correct}（${WH_JA[correct]}）。` })),
    }),
    stem: `${t.ja}\n${['（　　）', ...t.q.slice(1)].join(' ')}${tailText(t)}?\n— ${t.ans}`,
    hint: '答えの文を見て、何をたずねているか（場所？ 時？ 人？）を考えよう。',
    steps: [`答え「${t.ans}」→ ${t.cue === 'place' ? '場所' : t.cue === 'time' ? '時' : t.cue === 'person' ? '人' : t.cue === 'owner' ? '持ち主' : t.cue === 'choice' ? 'どちらか' : t.cue === 'way' ? '方法' : t.cue === 'count' ? '数' : t.cue === 'age' ? '年れい' : t.cue === 'clock' ? '時刻' : 'もの'}をたずねている`, `→ ${correct}`],
    check: { kind: 'en-wh', cue: t.cue, chunks: t.q, tail: t.tail || '' },
  };
}

function genOrder(rng) {
  const t = rng.pick(TEMPLATES)(rng);
  const aux = t.q.find((c) => ['do', 'does', 'did', 'is'].includes(c));
  // does / did の文は「動詞の形をまちがえたタイル」を不要タイルに（does 〜 goes / did 〜 went）
  const verb = ['does', 'did'].includes(aux) ? t.q[t.q.indexOf(aux) + 2] : null;
  const decoy = aux === 'did' ? past(verb) : aux === 'does' && verb ? third(verb) : aux === 'do' ? 'does' : aux === 'is' ? 'are' : t.q.includes('plays') ? 'play' : 'do';
  return {
    stem: `日本語に合うように並べかえよう\n${t.ja}`,
    // Whose bag is this? は Whose is this bag? とも言えるので、whose ＋ 名詞 は1枚のタイルにする
    ...orderAns(rng, t.q[0] === 'Whose' ? [`${t.q[0]} ${t.q[1]}`, ...t.q.slice(2)] : t.q, { tail: t.tail || '', end: '?', decoys: [{ t: decoy }] }),
    hint: '疑問詞を最初に。そのあとは、ふつうの疑問文の語順（do / does / is ＋ 主語 〜）。',
    steps: ['疑問詞（＋名詞）を最初に', `${t.q.slice(1).join(' ')} はふつうの疑問文の形`],
    check: { kind: 'en-order' },
  };
}

// 質問に合う答えを選ぶ
function genAnswer(rng) {
  const ts = rng.shuffle(TEMPLATES).map((f) => f(rng));
  const t = ts[0];
  const others = [];
  for (const o of ts.slice(1)) {
    if (o.cue === t.cue || WH_OF[o.cue] === WH_OF[t.cue] || others.some((x) => x.ans === o.ans || x.cue === o.cue)) continue;
    others.push(o);
    if (others.length === 2) break;
  }
  const yesNo = { ans: rng.pick(['Yes, I do.', 'No, I do not.']), cue: 'yesno' };
  const wrongs = [...others, yesNo].map((o) => ({ t: o.ans, msg: o.cue === 'yesno' ? '疑問詞の疑問文には Yes / No で答えない！' : `それは「${WH_JA[WH_OF[o.cue]]}」をたずねられたときの答え。` }));
  const q = `${['', ...t.q].join(' ').trim()}${tailText(t)}?`;
  return {
    stem: `質問に合う答えは？\n${q}`,
    ...textChoice(rng, t.ans, wrongs),
    hint: `${t.q[0]}（${WH_JA[t.q[0]]}）をたずねている。疑問詞の疑問文には Yes / No で答えない。`,
    steps: [`${t.q[0]} → ${WH_JA[t.q[0]]}をたずねている`, `答え: ${t.ans}`],
    check: { kind: 'en-wh-ans', cue: t.cue, others: [...others.map((o) => o.cue), 'yesno'] },
  };
}

export default {
  id: 'en-wh',
  subject: 'english',
  stage: 1,
  area: '英語棟・フクロウの塔',
  title: '疑問詞',
  emoji: '🦉',
  prereqs: ['en-3sg'],
  tool: 'double',
  hintCard: [
    'what 何 ／ who だれ ／ where どこ ／ when いつ ／ whose だれの ／ which どちら ／ how どのように',
    'how many 〜（いくつ）／ how old（何歳）／ what time（何時）',
    '語順: 疑問詞 ＋ ふつうの疑問文（do / does / is ＋ 主語 〜?）',
    '疑問詞の疑問文には Yes / No で答えない',
  ],
  generators: {
    'wh-choose': { difficulty: 1, gen: genChoose },
    'wh-answer': { difficulty: 1, gen: genAnswer },
    'wh-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'wh-l1',
      title: '疑問詞の意味',
      unlocks: ['wh-choose', 'wh-answer'],
      build(rng) {
        return [
          { text: '疑問詞は「何をたずねるか」を決める語。', en: 'what 何　who だれ　where どこ\nwhen いつ　whose だれの　which どちら\nhow どのように' },
          { text: 'セットで覚える形もある。', en: 'how many 〜 いくつの\nhow old 何歳\nwhat time 何時' },
          { text: '答えから考えよう。', q: genChoose(rng) },
          { text: '質問に合う答えは？', q: genAnswer(rng) },
        ];
      },
    },
    {
      id: 'wh-l2',
      title: '疑問詞の文の語順',
      unlocks: ['wh-order'],
      build(rng) {
        return [
          { text: '疑問詞は文の最初。そのあとは「ふつうの疑問文」をそのまま続ける。', en: 'Do you live in Osaka?\n→ Where do you live?' },
          { text: 'ただし「だれが〜する？」は疑問詞が主語なので、そのまま動詞を続ける。', en: 'Who plays the piano?\n— Ken does.' },
          { text: '並べかえ。', q: genOrder(rng) },
          { text: 'もう1問。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
