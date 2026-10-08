// 英語 第1段階: 名詞の複数形と、代名詞（I / my / me / mine）
import { plural, PLURAL_IRREG, bePresent } from './lex.js';
import { cap } from './gram.js';
import { frameQ, spellAns, BLANK } from './kit-en.js';

// 複数形の練習に使う名詞。verb: どの文で使うか（have 持っている / see 見える / visit 訪れる / know 知っている / spell つづりだけ）
// jaS: 日本語訳（{n} に数が入る）、how: 「いくつ〜？」の日本語（have のときだけ）
const N = (w, ja, verb, jaS = '', how = '') => ({ w, ja, verb, jaS, how });
export const NOUNS = [
  N('book', '本', 'have', '私は本を{n}冊持っています。', 'あなたは本を何冊持っていますか？'),
  N('pen', 'ペン', 'have', '私はペンを{n}本持っています。', 'あなたはペンを何本持っていますか？'),
  N('egg', '卵', 'have', '私は卵を{n}個持っています。', 'あなたは卵をいくつ持っていますか？'),
  N('apple', 'りんご', 'have', '私はりんごを{n}個持っています。', 'あなたはりんごをいくつ持っていますか？'),
  N('box', '箱', 'have', '私は箱を{n}つ持っています。', 'あなたは箱をいくつ持っていますか？'),
  N('dish', '皿', 'have', '私は皿を{n}枚持っています。', 'あなたは皿を何枚持っていますか？'),
  N('watch', '腕時計', 'have', '私は腕時計を{n}つ持っています。', 'あなたは腕時計をいくつ持っていますか？'),
  N('glass', 'コップ', 'have', '私はコップを{n}つ持っています。', 'あなたはコップをいくつ持っていますか？'),
  N('dictionary', '辞書', 'have', '私は辞書を{n}冊持っています。', 'あなたは辞書を何冊持っていますか？'),
  N('key', 'かぎ', 'have', '私はかぎを{n}本持っています。', 'あなたはかぎを何本持っていますか？'),
  N('toy', 'おもちゃ', 'have', '私はおもちゃを{n}つ持っています。', 'あなたはおもちゃをいくつ持っていますか？'),
  N('photo', '写真', 'have', '私は写真を{n}枚持っています。', 'あなたは写真を何枚持っていますか？'),
  N('potato', 'じゃがいも', 'have', '私はじゃがいもを{n}個持っています。', 'あなたはじゃがいもをいくつ持っていますか？'),
  N('tomato', 'トマト', 'have', '私はトマトを{n}個持っています。', 'あなたはトマトをいくつ持っていますか？'),
  N('knife', 'ナイフ', 'have', '私はナイフを{n}本持っています。', 'あなたはナイフを何本持っていますか？'),
  N('class', '授業', 'have', '私は授業が{n}つあります。'),
  N('city', '都市', 'visit', '私は{n}つの都市を訪れます。'),
  N('country', '国', 'visit', '私は{n}か国を訪れます。'),
  N('library', '図書館', 'visit', '私は{n}つの図書館を訪れます。'),
  N('story', '物語', 'know', '私は物語を{n}つ知っています。'),
  N('bus', 'バス', 'see', '私にはバスが{n}台見えます。'),
  N('bench', 'ベンチ', 'see', '私にはベンチが{n}つ見えます。'),
  N('baby', '赤ちゃん', 'see', '私には赤ちゃんが{n}人見えます。'),
  N('boy', '男の子', 'see', '私には男の子が{n}人見えます。'),
  N('child', '子ども', 'see', '私には子どもが{n}人見えます。'),
  N('man', '男性', 'see', '私には男性が{n}人見えます。'),
  N('woman', '女性', 'see', '私には女性が{n}人見えます。'),
  N('cat', 'ねこ', 'see', '私にはねこが{n}匹見えます。'),
  N('dog', '犬', 'see', '私には犬が{n}匹見えます。'),
  N('fish', '魚', 'see', '私には魚が{n}匹見えます。'),
  N('sheep', 'ひつじ', 'see', '私にはひつじが{n}匹見えます。'),
  N('leaf', '葉', 'see', '私には葉が{n}枚見えます。'),
  N('foot', '足', 'spell'), N('tooth', '歯', 'spell'), N('party', 'パーティー', 'spell'), N('day', '日', 'spell'), N('wife', '妻', 'spell'),
];
const NUMS = [['two', '2'], ['three', '3'], ['four', '4'], ['five', '5'], ['six', '6']];

function plRule(n) {
  if (PLURAL_IRREG[n]) return n === 'fish' || n === 'sheep' ? `${n} は単数と複数が同じ形` : /f$|fe$/.test(n) ? 'f, fe → ves' : /o$/.test(n) ? 'o で終わる語の一部 → es' : `${n} は特別な形`;
  if (/(s|x|z|ch|sh)$/.test(n)) return 's, x, ch, sh で終わる → es';
  if (/[^aeiou]y$/.test(n)) return '子音字＋y → y を i にかえて es';
  return 'ふつうは s をつけるだけ';
}
// まちがえやすい複数形
function badPlurals(n) {
  const out = new Set([n, `${n}s`, `${n}es`]);
  if (/y$/.test(n)) { out.add(`${n.slice(0, -1)}ies`); out.add(`${n}s`); }
  if (/fe?$/.test(n)) out.add(`${n.replace(/fe?$/, 'ves')}`);
  if (PLURAL_IRREG[n]) out.add(`${PLURAL_IRREG[n]}s`);
  if (n === 'fish') out.delete('fishes'); // fishes は種類をいうときに使う形なので出さない
  out.delete(plural(n));
  return [...out];
}

function genForm(rng) {
  const nn = rng.pick(NOUNS.filter((x) => x.verb !== 'spell'));
  const n = nn.w;
  const [num, d] = rng.pick(NUMS);
  const ans = plural(n);
  const how = !!nn.how && rng.chance(0.3);
  const chunks = how ? ['How many', ans, 'do', 'you', 'have'] : ['I', nn.verb, num, ans];
  return {
    ...frameQ(rng, {
      chunks, at: how ? 1 : 3, correct: ans, end: how ? '?' : '.',
      ja: how ? nn.how : nn.jaS.replace('{n}', d),
      wrongs: badPlurals(n).map((b) => ({ t: b, msg: b === n ? `2つ以上なので複数形にする（${plRule(n)}）。` : `${n} の複数形は ${ans}（${plRule(n)}）。` })),
    }),
    hint: '2つ以上は複数形。ふつう s、s/x/ch/sh → es、子音字＋y → ies、f/fe → ves。特別な形もある。',
    steps: [`${n} → ${plRule(n)}`, `${n} → ${ans}`],
    check: { kind: 'en-frame', chunks, at: how ? 1 : 3, end: how ? '?' : '.', tail: '', plural: n },
  };
}

function genSpell(rng) {
  // 半分は文の中で（I have three （　　）.）
  if (rng.chance(0.5)) {
    const nn = rng.pick(NOUNS.filter((x) => x.verb !== 'spell' && plural(x.w) !== x.w));
    const [num, d] = rng.pick(NUMS);
    const ans = plural(nn.w);
    return {
      stem: `${nn.jaS.replace('{n}', d)}\nI ${nn.verb} ${num} ${BLANK}.\n（　　）に入る形をつづろう（もとの形: ${nn.w}）`,
      ...spellAns(rng, ans, { extra: 2 }),
      hint: '2つ以上は複数形。ふつう s、s/x/ch/sh → es、子音字＋y → ies、f/fe → ves。',
      steps: [`${nn.w} → ${plRule(nn.w)}`, `答え: ${ans}`],
      check: { kind: 'en-form', base: nn.w, form: 'plural' },
    };
  }
  const { w: n, ja } = rng.pick(NOUNS.filter((x) => plural(x.w) !== x.w));
  const ans = plural(n);
  return {
    stem: `${n}（${ja}）の複数形をつづろう`,
    ...spellAns(rng, ans, { extra: 2 }),
    hint: 'ふつう s、s/x/ch/sh → es、子音字＋y → ies、f/fe → ves。child などは特別。',
    steps: [`${n} → ${plRule(n)}`, `答え: ${ans}`],
    check: { kind: 'en-form', base: n, form: 'plural' },
  };
}

// 代名詞: [主格, 所有格, 目的格, 所有代名詞, 日本語, 人称, 数]
export const PRON = {
  I: ['I', 'my', 'me', 'mine', '私', 1, 'sg'],
  you: ['you', 'your', 'you', 'yours', 'あなた', 2, 'sg'],
  he: ['he', 'his', 'him', 'his', '彼', 3, 'sg'],
  she: ['she', 'her', 'her', 'hers', '彼女', 3, 'sg'],
  we: ['we', 'our', 'us', 'ours', '私たち', 1, 'pl'],
  they: ['they', 'their', 'them', 'theirs', '彼ら', 3, 'pl'],
};
const CASE_NAME = ['主格（〜は）', '所有格（〜の）', '目的格（〜を・〜に）', '所有代名詞（〜のもの）'];
const THINGS = [['bag', 'かばん'], ['pen', 'ペン'], ['bike', '自転車'], ['notebook', 'ノート'], ['cap', 'ぼうし'], ['racket', 'ラケット']];

function genPron(rng) {
  const lemma = rng.pick(Object.keys(PRON));
  const P = PRON[lemma];
  const ja = P[4];
  const cs = rng.int(0, 3);
  const [thing, tja] = rng.pick(THINGS);
  let chunks;
  let at;
  let jaS;
  if (cs === 0) {
    const subj = { person: P[5], num: P[6] };
    const be = bePresent(subj);
    chunks = [cap(P[0]), be, 'from Canada'];
    at = 0;
    jaS = `${ja}はカナダ出身です。`;
  } else if (cs === 1) {
    chunks = ['This', 'is', P[1], thing];
    at = 2;
    jaS = `これは${ja}の${tja}です。`;
  } else if (cs === 2) {
    const other = lemma === 'I' || lemma === 'we' ? 'Ken' : 'I';
    chunks = other === 'Ken' ? ['Ken', 'knows', P[2]] : ['I', 'know', P[2]];
    at = 2;
    jaS = `${other === 'Ken' ? 'ケン' : '私'}は${ja}を知っています。`;
  } else {
    chunks = ['This', thing, 'is', P[3]];
    at = 3;
    jaS = `この${tja}は${ja}のものです。`;
  }
  const correct = chunks[at];
  // 「〜は」「〜を」の文では mine なども文法上は入りうるので、選択肢から外す
  const forms = [...new Set(P.slice(0, cs === 0 || cs === 2 ? 3 : 4))].map((f) => (at === 0 ? cap(f) : f));
  return {
    ...frameQ(rng, {
      chunks, at, correct, ja: jaS,
      wrongs: forms.filter((f) => f !== correct).map((f) => ({ t: f, msg: `ここは「${['〜は', '〜の', '〜を', '〜のもの'][cs]}」なので ${CASE_NAME[cs]} の ${correct}。` })),
    }),
    hint: 'I – my – me – mine のように「〜は／〜の／〜を／〜のもの」で形が変わる。',
    steps: [`「${['〜は', '〜の', '〜を', '〜のもの'][cs]}」→ ${CASE_NAME[cs]}`, `${lemma} の${CASE_NAME[cs].replace(/（.*/, '')} → ${correct}`],
    check: { kind: 'en-pron', lemma, case: cs },
  };
}

export default {
  id: 'en-plural',
  subject: 'english',
  stage: 1,
  area: '英語棟・ひつじ小屋',
  title: '複数形と代名詞',
  emoji: '🐑',
  prereqs: ['en-be'],
  tool: 'nuke',
  hintCard: [
    '複数形: ふつう s ／ s・x・ch・sh → es ／ 子音字＋y → ies ／ f・fe → ves',
    '特別: child → children、man → men、foot → feet、fish → fish',
    'I – my – me – mine（〜は／〜の／〜を／〜のもの）',
    'he – his – him – his ／ she – her – her – hers ／ they – their – them – theirs',
  ],
  generators: {
    'pl-form': { difficulty: 1, gen: genForm },
    'pl-spell': { difficulty: 2, gen: genSpell },
    'pron': { difficulty: 2, gen: genPron },
  },
  lessons: [
    {
      id: 'pl-l1',
      title: '名詞の複数形',
      unlocks: ['pl-form', 'pl-spell'],
      build(rng) {
        return [
          { text: '2つ以上のものは複数形にする。ふつうは s をつけるだけ。', en: 'a book → two books\na dog → three dogs' },
          { text: 'つけ方のパターン', en: 'box → boxes（s, x, ch, sh → es）\ncity → cities（子音字＋y → ies）\nknife → knives（f, fe → ves）' },
          { text: '特別な形もある。これは覚えるしかない！', en: 'child → children\nman → men / woman → women\nfoot → feet / tooth → teeth\nfish → fish / sheep → sheep' },
          { text: 'やってみよう。', q: genForm(rng) },
          { text: 'つづりも。', q: genSpell(rng) },
        ];
      },
    },
    {
      id: 'pl-l2',
      title: '代名詞（I / my / me / mine）',
      unlocks: ['pron'],
      build(rng) {
        return [
          { text: '代名詞は「〜は／〜の／〜を／〜のもの」で形が変わる。', en: 'I – my – me – mine\nyou – your – you – yours\nhe – his – him – his\nshe – her – her – hers' },
          { text: '複数も同じように。', en: 'we – our – us – ours\nthey – their – them – theirs' },
          { text: 'やってみよう。', q: genPron(rng) },
          { text: 'もう1問。', q: genPron(rng) },
        ];
      },
    },
  ],
};
