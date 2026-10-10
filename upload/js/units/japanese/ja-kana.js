// 国語 第1段階: 歴史的仮名遣い → 現代仮名遣い
//   toModern() が規則どおりに直す。データの答え（現代仮名遣い）は、テストで toModern() と照らし合わせる
import { jaChoice } from './kit-ja.js';

// 母音の段
const ROWS = {
  a: 'あかさたなはまやらわがざだばぱ', i: 'いきしちにひみりぎじぢびぴ', u: 'うくすつぬふむゆるぐずづぶぷ', e: 'えけせてねへめれげぜでべぺ', o: 'おこそとのほもよろをごぞどぼぽ',
};
const vowelOf = (ch) => Object.keys(ROWS).find((v) => ROWS[v].includes(ch));
const shift = (ch, from, to) => ROWS[to][ROWS[from].indexOf(ch)] || ch;
// i段 → 拗音（き → きゅ／きょ）
const YO = { き: 'き', し: 'し', ち: 'ち', に: 'に', ひ: 'ひ', み: 'み', り: 'り', ぎ: 'ぎ', じ: 'じ', び: 'び', ぴ: 'ぴ' };

export const RULES = {
  hagyo: '語中・語尾のハ行（は・ひ・ふ・へ・ほ）→ わ・い・う・え・お',
  wiwe: 'ゐ・ゑ・を → い・え・お',
  dizu: 'ぢ・づ → じ・ず',
  kwa: 'くわ・ぐわ → か・が',
  au: '「あう」の音（-au）→「おう」（-ou）　例: やう → よう',
  iu: '「いう」の音（-iu）→「ゆう」（-yuu）　例: しう → しゅう',
  eu: '「えう」の音（-eu）→「よう」（-you）　例: けふ → きょう',
};

// 歴史的仮名遣い → 現代仮名遣い（どの規則を使ったかもかえす）
export function toModern(old) {
  if (old === 'いふ') return { text: 'いう', used: ['hagyo'] }; // 「言ふ」は「いう」と書く（ゆう にはしない）
  const used = new Set();
  let s = [...old];
  // 1) 語中・語尾のハ行
  s = s.map((ch, i) => {
    if (i > 0 && 'はひふへほ'.includes(ch)) { used.add('hagyo'); return 'わいうえお'['はひふへほ'.indexOf(ch)]; }
    return ch;
  });
  // 2) ゐ・ゑ・を、ぢ・づ
  s = s.map((ch) => {
    if ('ゐゑを'.includes(ch)) { used.add('wiwe'); return 'いえお'['ゐゑを'.indexOf(ch)]; }
    if ('ぢづ'.includes(ch)) { used.add('dizu'); return 'じず'['ぢづ'.indexOf(ch)]; }
    return ch;
  });
  // 3) くわ・ぐわ
  let t = s.join('');
  if (/[くぐ]わ/.test(t)) { used.add('kwa'); t = t.replace(/くわ/g, 'か').replace(/ぐわ/g, 'が'); }
  // 4) 母音が続く「う」: -au → -ou、-iu → -yuu、-eu → -you
  const out = [];
  const cs = [...t];
  for (let i = 0; i < cs.length; i++) {
    const ch = cs[i];
    if (cs[i + 1] === 'う' && i + 1 < cs.length) {
      const v = vowelOf(ch);
      if (v === 'a') { used.add('au'); out.push(shift(ch, 'a', 'o'), 'う'); i++; continue; }
      if (v === 'i' && YO[ch]) { used.add('iu'); out.push(ch, 'ゅ', 'う'); i++; continue; }
      if (v === 'e') { used.add('eu'); const base = shift(ch, 'e', 'i'); out.push(base === 'い' ? 'よ' : base, ...(base === 'い' ? [] : ['ょ']), 'う'); i++; continue; }
    }
    out.push(ch);
  }
  return { text: out.join(''), used: [...used] };
}

// [歴史的仮名遣い, 現代仮名遣い（手で書いた答え）, 意味]
export const WORDS = [
  ['かは', 'かわ', '川'], ['こひ', 'こい', '恋'], ['おもふ', 'おもう', '思う'], ['いふ', 'いう', '言う'], ['あはれ', 'あわれ', 'しみじみとした趣'],
  ['をかし', 'おかし', '趣がある'], ['ゐなか', 'いなか', '田舎'], ['こゑ', 'こえ', '声'], ['をとこ', 'おとこ', '男'], ['をんな', 'おんな', '女'],
  ['まゐる', 'まいる', '参る'], ['かほ', 'かお', '顔'], ['いはひ', 'いわい', '祝い'], ['あふぎ', 'おうぎ', '扇'], ['けふ', 'きょう', '今日'],
  ['てふてふ', 'ちょうちょう', 'ちょう（虫）'], ['やうやう', 'ようよう', 'だんだん'], ['うつくしう', 'うつくしゅう', '美しく'], ['をさなし', 'おさなし', '幼い'], ['はぢ', 'はじ', '恥'],
  ['みづ', 'みず', '水'], ['よろづ', 'よろず', 'いろいろなこと'], ['くわし', 'かし', '菓子'], ['ぐわんじつ', 'がんじつ', '元日'], ['すまふ', 'すもう', '相撲'],
  ['あふみ', 'おうみ', '近江（いまの滋賀県）'], ['なほ', 'なお', 'やはり'], ['おほし', 'おおし', '多い'], ['いへ', 'いえ', '家'], ['にほひ', 'におい', '美しい色つや'],
  ['こほり', 'こおり', '氷'], ['あをし', 'あおし', '青い'], ['ゆゑ', 'ゆえ', '理由'], ['いづれ', 'いずれ', 'どれ'], ['まうす', 'もうす', '申す'],
  ['かうべ', 'こうべ', '頭'], ['きうり', 'きゅうり', 'きゅうり'], ['しうと', 'しゅうと', '夫や妻の父'], ['てうど', 'ちょうど', '調度（道具）'], ['さうらふ', 'そうろう', 'あります（ございます）'],
  ['たまはる', 'たまわる', 'いただく'], ['あぢはひ', 'あじわい', '味わい'], ['うへ', 'うえ', '上'], ['まへ', 'まえ', '前'], ['かへる', 'かえる', '帰る'],
];

// まちがいの候補: 規則を1つ使いわすれた形・やりすぎた形
function wrongsOf(old, right) {
  const out = new Set();
  const cs = [...old];
  // ハ行を直しわすれ（語中のハ行をそのまま）
  const keepH = toModern(old.replace(/(?!^)[はひふへほ]/g, (c) => ({ は: '＿1', ひ: '＿2', ふ: '＿3', へ: '＿4', ほ: '＿5' })[c])).text.replace(/＿(\d)/g, (_, d) => 'はひふへほ'[d - 1]);
  out.add(keepH);
  // 語頭のハ行まで直してしまう
  if ('はひふへほ'.includes(cs[0])) out.add('わいうえお'['はひふへほ'.indexOf(cs[0])] + right.slice(1));
  // 母音の規則を使いわすれ（ハ行・ゐゑを・ぢづ だけ直す）
  out.add([...old].map((c, i) => (i > 0 && 'はひふへほ'.includes(c) ? 'わいうえお'['はひふへほ'.indexOf(c)] : 'ゐゑを'.includes(c) ? 'いえお'['ゐゑを'.indexOf(c)] : 'ぢづ'.includes(c) ? 'じず'['ぢづ'.indexOf(c)] : c)).join(''));
  // そのまま
  out.add(old);
  // 「を」を「わ」にしてしまう
  if (old.includes('を')) out.add(right.replace('お', 'わ'));
  out.delete(right);
  return [...out].filter((x) => x && x !== right);
}

function genModern(rng) {
  const [old, right, mean] = rng.pick(WORDS);
  const used = toModern(old).used;
  return jaChoice(rng, {
    stem: `次の歴史的仮名遣いを、現代仮名遣いに直すと？\n「${old}」（${mean}）`,
    correct: right,
    wrongs: rng.shuffle(wrongsOf(old, right)).map((t) => ({ t, msg: `正しくは「${right}」。使う規則: ${used.map((u) => RULES[u].split('　')[0]).join('／')}` })),
    hint: '語中のハ行 → わいうえお、ゐゑを → いえお、ぢづ → じず、「あう・いう・えう」の音 → おう・ゆう・よう',
    steps: [`「${old}」→「${right}」`, ...used.map((u) => RULES[u])],
    verify: (t) => t === toModern(old).text,
  });
}
// どの規則を使う？（規則が1つだけの語）
const SINGLE = WORDS.filter(([old]) => old !== 'いふ' && toModern(old).used.length === 1);
function genRule(rng) {
  const [old, right] = rng.pick(SINGLE);
  const rule = toModern(old).used[0];
  const label = (k) => RULES[k].split('　')[0];
  return jaChoice(rng, {
    stem: `「${old}」を「${right}」に直すときに使う規則は？`,
    correct: label(rule),
    wrongs: rng.shuffle(Object.keys(RULES).filter((k) => k !== rule)).map((k) => ({ t: label(k) })),
    hint: 'どの文字がどう変わったかを見る。',
    steps: [RULES[rule]],
    verify: (t) => t === label(toModern(old).used[0]),
  });
}

export default {
  id: 'ja-kana',
  subject: 'japanese',
  stage: 1,
  area: '国語棟・古い巻物の書庫',
  title: '歴史的仮名遣い',
  emoji: '📜',
  prereqs: [],
  tool: 'rewind',
  hintCard: [
    '語中・語尾のハ行 → わ・い・う・え・お（かは → かわ）。語頭はそのまま（はな）',
    'ゐ・ゑ・を → い・え・お ／ ぢ・づ → じ・ず ／ くわ・ぐわ → か・が',
    '-au → -ou（やう → よう）／ -iu → -yuu（しう → しゅう）／ -eu → -you（けふ → きょう）',
    '「いふ」は「いう」（ゆう にはしない）',
  ],
  generators: {
    'kn-modern': { difficulty: 1, gen: genModern },
    'kn-rule': { difficulty: 2, gen: genRule },
  },
  lessons: [
    {
      id: 'kn-l1',
      title: 'ハ行・ゐゑを・ぢづ',
      unlocks: ['kn-rule'],
      build(rng) {
        return [
          { text: '古文の仮名遣い（歴史的仮名遣い）は、今の書き方と少しちがう。読むときは、今の書き方に直して読む。' },
          { text: 'いちばん多いのは、語中・語尾のハ行。は・ひ・ふ・へ・ほ → わ・い・う・え・お。\nかは → かわ（川）　おもふ → おもう\n※ 語のはじめのハ行はそのまま（はな、ひと）。' },
          { text: 'ゐ・ゑ・を → い・え・お（こゑ → こえ）。ぢ・づ → じ・ず（みづ → みず）。', q: genRule(rng) },
        ];
      },
    },
    {
      id: 'kn-l2',
      title: '母音が続く音',
      unlocks: ['kn-modern'],
      build(rng) {
        return [
          { text: '「あう・いう・えう」と母音が続く音は、のばす音に変わる。\nやう → よう　しう → しゅう　けふ（けう）→ きょう\nハ行を先に直してから、この規則を使う。' },
          { text: 'やってみよう。', q: genModern(rng) },
          { text: 'もう1問。', q: genModern(rng) },
        ];
      },
    },
  ],
};
