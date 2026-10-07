// 英語 第1段階: 中1の単語（テーマごとに「意味を選ぶ／英語を選ぶ／つづる」）
import { WORDS1, THEMES1, SYN } from './words1.js';
import { SYN2 } from './words2.js';
import { textChoice, spellAns } from './kit-en.js';

const meanings = (w) => w.ja.split('、');
const ALL_SYN = [...SYN, ...SYN2];
const synOf = (w) => new Set(ALL_SYN.filter((g) => g.includes(w.w)).flat());
// a と b を同じ選択肢に並べてもまぎらわしくないか
export function distinct(a, b) {
  if (a.w.toLowerCase() === b.w.toLowerCase()) return false;
  if (synOf(a).has(b.w)) return false;
  const ma = meanings(a);
  return !meanings(b).some((x) => ma.some((y) => x === y || x.includes(y) || y.includes(x)));
}

function pickDistractors(rng, w, pool, n = 3) {
  const same = pool.filter((x) => x.pos === w.pos);
  const base = same.length >= 8 ? same : pool;
  const out = [];
  for (const c of rng.shuffle(base)) {
    if (!distinct(w, c) || out.some((o) => !distinct(o, c))) continue;
    out.push(c);
    if (out.length === n) break;
  }
  return out;
}

const canSpell = (w) => /^[a-zA-Z]{3,9}$/.test(w.w);

export function vocabProblem(rng, pool, mode) {
  const w = rng.pick(mode === 'spell' ? pool.filter(canSpell) : pool);
  if (mode === 'spell') {
    return {
      stem: `「${w.ja}」を英語でつづろう\n（ヒント: ${w.w[0]}で始まる ${w.w.length} 文字）`,
      ...spellAns(rng, w.w, { extra: 2 }),
      hint: `${w.w[0]} で始まる ${w.w.length} 文字。声に出して読んでみると、つづりが浮かぶかも。`,
      steps: [`「${w.ja}」＝ ${w.w}`, `つづり: ${w.w.split('').join(' - ')}`],
      check: { kind: 'en-vocab', mode, word: w.w },
    };
  }
  const ds = pickDistractors(rng, w, pool);
  if (mode === 'e2j') {
    return {
      stem: `この${w.pos === 'idiom' ? '熟語' : '英単語'}の意味は？\n${w.w}`,
      ...textChoice(rng, w.ja, ds.map((d) => ({ t: d.ja, msg: `それは ${d.w} の意味。` }))),
      hint: '知っている英文の中で、この単語がどう使われていたか思い出してみよう。',
      steps: [`${w.w} ＝「${w.ja}」`],
      check: { kind: 'en-vocab', mode, word: w.w, others: ds.map((d) => d.w) },
    };
  }
  return {
    stem: `「${w.ja}」を表す${w.pos === 'idiom' ? '英語' : '英単語'}は？`,
    ...textChoice(rng, w.w, ds.map((d) => ({ t: d.w, msg: `${d.w} は「${d.ja}」。` }))),
    hint: '最初の音（文字）から思い出してみよう。',
    steps: [`「${w.ja}」＝ ${w.w}`],
    check: { kind: 'en-vocab', mode, word: w.w, others: ds.map((d) => d.w) },
  };
}

// テーマの生成器: 意味を選ぶ 45% / 英語を選ぶ 35% / つづる 20%
const themeGen = (theme) => (rng) => {
  const pool = WORDS1.filter((w) => w.theme === theme);
  const r = rng.next();
  const mode = r < 0.45 ? 'e2j' : r < 0.8 ? 'j2e' : 'spell';
  return vocabProblem(rng, pool, mode);
};

const TIPS = {
  life: ['家族は father / mother / brother / sister。兄も弟も brother、姉も妹も sister。', '食べ物は「数えられる」(an apple) と「数えられない」(milk, water) がある。'],
  school: ['教科名 English / Japanese は、いつも大文字で始める。', 'スポーツは play tennis / play soccer のように play を使う。'],
  verbs: ['見る系の3兄弟: see（見える）/ look（目を向ける）/ watch（じっと見る）。', '話す系: speak（言語を話す）/ talk（しゃべる）/ say（言う）/ tell（伝える）。'],
  adj: ['形容詞は名詞の前（a big dog）か、be動詞のあと（The dog is big.）。', 'always / usually / often / sometimes / never は「どのくらいよく」を表す。'],
  time: ['曜日と月はいつも大文字で始める（Monday, April）。', '「〜曜日に」は on Monday、「〜月に」は in April。'],
  func: ['in（中）/ on（上・接して）/ under（下）/ near（近く）。', '疑問詞: what（何）/ who（だれ）/ where（どこ）/ when（いつ）/ how（どのように）。'],
};

const gens = Object.fromEntries(Object.keys(THEMES1).map((t) => [`ew1-${t}`, { difficulty: 1, gen: themeGen(t) }]));

export default {
  id: 'en-words1',
  subject: 'english',
  stage: 1,
  area: '単語倉庫・1F',
  title: '中1の単語',
  emoji: '📖',
  prereqs: [],
  tool: 'coins',
  hintCard: [
    '兄も弟も brother、姉も妹も sister',
    '見る: see（見える）/ look（目を向ける）/ watch（じっと見る）',
    '曜日と月は大文字で始める（Monday, April）',
    '頻度: always ＞ usually ＞ often ＞ sometimes ＞ never',
  ],
  generators: gens,
  lessons: Object.entries(THEMES1).map(([t, title]) => ({
    id: `ew1-l-${t}`,
    title,
    unlocks: [`ew1-${t}`],
    build(rng) {
      const pool = WORDS1.filter((w) => w.theme === t);
      const sample = rng.shuffle(pool).slice(0, 6);
      return [
        { text: `テーマ「${title}」の単語は ${pool.length} 語。まずは6つ、ながめてみよう👇`, en: sample.map((w) => `${w.w}　…　${w.ja}`).join('\n') },
        { text: `💡 ${TIPS[t][0]}` },
        { text: `💡 ${TIPS[t][1]}` },
        { text: 'では小テスト。意味はどれ？', q: vocabProblem(rng, pool, 'e2j') },
        { text: '英語ではどれ？', q: vocabProblem(rng, pool, 'j2e') },
        { text: '最後はつづり。文字タイルをタップしてね。', q: vocabProblem(rng, pool, 'spell') },
      ];
    },
  })),
};
