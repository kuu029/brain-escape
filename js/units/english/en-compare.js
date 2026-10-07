// 英語 第2段階: 比較（-er / -est / more / most / as 〜 as）
import { COMPARE, comparative, superlative } from './lex.js';
import { frameQ, orderAns } from './kit-en.js';

// 比べる2つ（A, B）と、使える形容詞・最上級の範囲
const PEOPLE = [['Ken', 'ケン'], ['Tom', 'トム'], ['Yumi', 'ユミ'], ['my brother', '私の兄'], ['my sister', '私の姉']];
const ADJ_JA = {
  tall: '背が高い', old: '年上', young: '年下', busy: '忙しい', strong: '強い', famous: '有名', interesting: 'おもしろい',
  difficult: '難しい', popular: '人気がある', useful: '役に立つ', expensive: '値段が高い', cheap: '安い', heavy: '重い', big: '大きい',
  nice: 'すてき', easy: '簡単', important: '大切', hot: '暑い', cold: '寒い', long: '長い', new: '新しい',
};
// 「〜です」をつけるときの形（形容動詞・名詞は「です」、動詞は「ます」）
const desu = (a) => ({ popular: '人気があります', useful: '役に立ちます' }[a] || `${ADJ_JA[a]}です`);
// 否定（〜ほど…ない）
const notJa = (a) => ({ popular: '人気がありません', useful: '役に立ちません' }[a] || (/い$/.test(ADJ_JA[a]) ? `${ADJ_JA[a].slice(0, -1)}くありません` : `${ADJ_JA[a]}ではありません`));
const GROUPS = [
  { kind: 'people', a: () => PEOPLE, adjs: ['tall', 'old', 'young', 'busy', 'strong', 'famous'], grp: [['in my class', '私のクラスで'], ['in my family', '家族の中で'], ['of the three', '3人の中で'], ['of all', 'みんなの中で']] },
  { kind: 'book', a: () => [['this book', 'この本'], ['that one', 'あの本']], adjs: ['interesting', 'difficult', 'popular', 'useful', 'expensive', 'heavy', 'new'], grp: [['of the five', '5冊の中で'], ['in this library', 'この図書館で']] },
  { kind: 'bag', a: () => [['this bag', 'このかばん'], ['that one', 'あのかばん']], adjs: ['big', 'heavy', 'nice', 'expensive', 'cheap', 'new'], grp: [['in this store', 'この店で'], ['of the three', '3つの中で']] },
  { kind: 'question', a: () => [['this question', 'この問題'], ['that one', 'あの問題']], adjs: ['easy', 'difficult', 'important'], grp: [['of the five', '5問の中で'], ['in this test', 'このテストで']] },
];
// 動作の比較（〜より速く走る など）
const ADV = [
  { v: 'runs', adv: 'fast', ja: '速く走ります' }, { v: 'sings', adv: 'well', ja: 'じょうずに歌います' },
  { v: 'gets up', adv: 'early', ja: '早く起きます' }, { v: 'swims', adv: 'fast', ja: '速く泳ぎます' }, { v: 'plays tennis', adv: 'well', ja: 'じょうずにテニスをします' },
];

function pickPair(rng) {
  const G = rng.pick(GROUPS);
  const list = G.a();
  const A = G.kind === 'people' ? rng.pick(list) : list[0];
  const B = G.kind === 'people' ? rng.pick(list.filter((x) => x !== A)) : list[1];
  return { G, A, B, adj: rng.pick(G.adjs) };
}
const cap = (w) => w[0].toUpperCase() + w.slice(1);
// まちがえやすい比較級・最上級
const isMore = (a) => COMPARE[a] === 'more';
function badComp(a) {
  if (isMore(a)) return [a, `most ${a}`, `${a}er`];
  if (a === 'good' || a === 'well') return [a, 'best', `more ${a}`];
  return [a, superlative(a), `more ${a}`];
}
function badSup(a) {
  if (isMore(a)) return [a, `more ${a}`, `${a}est`];
  return [a, comparative(a), `most ${a}`];
}

function genEr(rng) {
  if (rng.chance(0.3)) {
    const [A, Aja] = rng.pick(PEOPLE);
    const [B, Bja] = rng.pick(PEOPLE.filter((x) => x[0] !== A));
    const D = rng.pick(ADV);
    const right = comparative(D.adv);
    return {
      ...frameQ(rng, {
        chunks: [cap(A), D.v, right, 'than', B], at: 2, correct: right, ja: `${Aja}は${Bja}より${D.ja}。`,
        wrongs: badComp(D.adv).map((w) => ({ t: w, msg: `「〜より」は比較級 ＋ than。${D.adv} の比較級は ${right}。` })),
      }),
      hint: 'A ＋ 動詞 ＋ 比較級 ＋ than B（A は B より〜）', steps: [`${D.adv} → ${right}`, '比較級 ＋ than'],
    };
  }
  const { A, B, adj } = pickPair(rng);
  const right = comparative(adj);
  return {
    ...frameQ(rng, {
      chunks: [cap(A[0]), 'is', right, 'than', B[0]], at: 2, correct: right, ja: `${A[1]}は${B[1]}より${desu(adj)}。`,
      wrongs: badComp(adj).map((w) => ({ t: w, msg: isMore(adj) ? `${adj} のような長い語は more ${adj}（-er にしない）。` : `${adj} の比較級は ${right}（「〜より」は比較級 ＋ than）。` })),
    }),
    hint: '比較級: 短い語は -er（taller, bigger, easier）、長い語は more 〜（more interesting）。good → better。',
    steps: [`${adj} → ${right}`, `${right} than 〜`],
  };
}

function genEst(rng) {
  const { G, A, adj } = pickPair(rng);
  const [gEn, gJa] = rng.pick(G.grp);
  const sup = superlative(adj);
  if (rng.chance(0.4)) {
    const [prep, ...rest] = gEn.split(' ');
    return {
      ...frameQ(rng, {
        chunks: [cap(A[0]), 'is', 'the', sup, prep, rest.join(' ')], at: 4, correct: prep, ja: `${A[1]}は${gJa}いちばん${desu(adj)}。`,
        wrongs: [{ t: prep === 'in' ? 'of' : 'in', msg: prep === 'in' ? 'クラス・家族・店など「場所・集団」の中では in。' : '「3人の中で」「全部の中で」のように数・all のときは of。' }, { t: 'than', msg: 'than は比較級（〜より）で使う。最上級は in / of。' }, { t: 'at', msg: '最上級の「〜の中で」は in か of。' }],
      }),
      hint: '最上級の「〜の中で」: 場所・集団 → in（in my class）、数・all → of（of the three）',
      steps: [`${gEn} → ${prep}`],
    };
  }
  return {
    ...frameQ(rng, {
      chunks: [cap(A[0]), 'is', 'the', sup, gEn], at: 3, correct: sup, ja: `${A[1]}は${gJa}いちばん${desu(adj)}。`,
      wrongs: badSup(adj).map((w) => ({ t: w, msg: isMore(adj) ? `${adj} のような長い語の最上級は most ${adj}。` : `「いちばん〜」は最上級。${adj} → ${sup}。` })),
    }),
    hint: '最上級: the ＋ -est（the tallest）／ the most 〜（the most interesting）。good → the best。',
    steps: [`${adj} → ${sup}`, `the ${sup} ${gEn}`],
  };
}

function genAs(rng) {
  // 年上・年下は「同じくらい」にすると不自然なので除く
  let p = pickPair(rng);
  while (p.adj === 'old' || p.adj === 'young') p = pickPair(rng);
  const { A, B, adj } = p;
  const neg = rng.chance(0.35);
  const chunks = neg ? [cap(A[0]), 'is', 'not', 'as', adj, 'as', B[0]] : [cap(A[0]), 'is', 'as', adj, 'as', B[0]];
  const at = neg ? 4 : 3;
  const ja = neg ? `${A[1]}は${B[1]}ほど${notJa(adj)}。` : `${A[1]}は${B[1]}と同じくらい${desu(adj)}。`;
  return {
    ...frameQ(rng, {
      chunks, at, correct: adj, ja,
      wrongs: [{ t: comparative(adj), msg: 'as 〜 as の間は形容詞の元の形（比較級にしない）。' }, { t: superlative(adj), msg: 'as 〜 as の間は元の形。' }, { t: isMore(adj) ? `${adj}er` : `more ${adj}`, msg: 'as 〜 as の間は元の形。' }],
    }),
    hint: 'as ＋ 元の形 ＋ as（同じくらい〜）。not as 〜 as は「〜ほど…ない」。',
    steps: [`as ${adj} as`],
  };
}

// Which do you like better, A or B?
const PAIRS = [['summer', 'winter', '夏', '冬'], ['dogs', 'cats', '犬', 'ねこ'], ['tea', 'coffee', 'お茶', 'コーヒー'], ['math', 'English', '数学', '英語'], ['soccer', 'baseball', 'サッカー', '野球']];
function genWhich(rng) {
  const [a, b, aj, bj] = rng.pick(PAIRS);
  return {
    ...frameQ(rng, {
      chunks: ['Which', 'do', 'you', 'like', 'better'], at: 4, correct: 'better', tail: `, ${a} or ${b}`, end: '?', ja: `${aj}と${bj}では、あなたはどちらのほうが好きですか？`,
      wrongs: [{ t: 'best', msg: '2つを比べるときは better。best は3つ以上の中で「いちばん」。' }, { t: 'good', msg: '「〜のほうが好き」は like 〜 better。' }, { t: 'well', msg: '「〜のほうが好き」は like 〜 better（well の比較級）。' }],
    }),
    hint: 'A と B ではどちらのほうが好き？ → Which do you like better, A or B?',
    steps: ['2つを比べる → better'],
  };
}

function genOrder(rng) {
  const { G, A, B, adj } = pickPair(rng);
  const kind = adj === 'old' || adj === 'young' ? rng.pick(['er', 'est']) : rng.pick(['er', 'est', 'as']);
  if (kind === 'er') {
    const c = comparative(adj).split(' ');
    return finish(rng, [A[0], 'is', ...c, 'than', B[0]], `${A[1]}は${B[1]}より${desu(adj)}。`, { t: isMore(adj) ? 'most' : superlative(adj), msg: '「〜より」は比較級 ＋ than。' });
  }
  if (kind === 'est') {
    const [gEn, gJa] = rng.pick(G.grp);
    const s = superlative(adj).split(' ');
    return finish(rng, [A[0], 'is', 'the', ...s, ...gEn.split(' ').slice(0, 1), gEn.split(' ').slice(1).join(' ')], `${A[1]}は${gJa}いちばん${desu(adj)}。`, { t: 'than', msg: '最上級の「〜の中で」は in / of。than は使わない。' });
  }
  return finish(rng, [A[0], 'is', 'as', adj, 'as', B[0]], `${A[1]}は${B[1]}と同じくらい${desu(adj)}。`, { t: isMore(adj) ? 'more' : comparative(adj), msg: 'as 〜 as の間は元の形。' });
}
function finish(rng, chunks, ja, decoy) {
  return {
    stem: `日本語に合うように並べかえよう\n${ja}`,
    ...orderAns(rng, chunks, { decoys: [decoy] }),
    hint: '比較級 ＋ than ／ the ＋ 最上級 ＋ in / of ／ as ＋ 元の形 ＋ as',
    steps: ['比べ方の形を確認してから並べる'],
    check: { kind: 'en-order' },
  };
}

export default {
  id: 'en-compare',
  subject: 'english',
  stage: 2,
  area: '英語棟・はかりの間',
  title: '比較',
  emoji: '⚖️',
  prereqs: ['en-be'],
  tool: 'nuke',
  hintCard: [
    'A は B より〜: 比較級 ＋ than（taller than / more interesting than）',
    'いちばん〜: the ＋ 最上級（the tallest / the most interesting）＋ in 集団 ／ of 数・all',
    '同じくらい〜: as ＋ 元の形 ＋ as ／ 〜ほど…ない: not as 〜 as',
    'good / well → better → best ／ Which do you like better, A or B?',
  ],
  generators: {
    'cp-er': { difficulty: 1, gen: genEr },
    'cp-est': { difficulty: 2, gen: genEst },
    'cp-as': { difficulty: 2, gen: genAs },
    'cp-which': { difficulty: 2, gen: genWhich },
    'cp-order': { difficulty: 2, gen: genOrder },
  },
  lessons: [
    {
      id: 'cp-l1',
      title: '比較級（〜より）',
      unlocks: ['cp-er'],
      build(rng) {
        return [
          { text: '「A は B より〜」は 比較級 ＋ than。', en: 'Ken is taller than Tom.\nThis book is more interesting than that one.' },
          { text: '比較級の作り方', en: 'tall → taller（-er）\nbig → bigger（重ねる）\neasy → easier（y → ier）\ninteresting → more interesting（長い語）\ngood → better（特別）' },
          { text: 'やってみよう。', q: genEr(rng) },
          { text: 'もう1問。', q: genEr(rng) },
        ];
      },
    },
    {
      id: 'cp-l2',
      title: '最上級（いちばん〜）',
      unlocks: ['cp-est'],
      build(rng) {
        return [
          { text: '「いちばん〜」は the ＋ 最上級。', en: 'Ken is the tallest in my class.\nThis book is the most interesting of the five.' },
          { text: '「〜の中で」は2種類。', en: 'in ＋ 場所・集団（in my class, in Japan）\nof ＋ 数・all（of the three, of all）' },
          { text: 'やってみよう。', q: genEst(rng) },
          { text: 'もう1問。', q: genEst(rng) },
        ];
      },
    },
    {
      id: 'cp-l3',
      title: 'as 〜 as ／ どちらが好き？',
      unlocks: ['cp-as', 'cp-which', 'cp-order'],
      build(rng) {
        return [
          { text: '「同じくらい〜」は as ＋ 元の形 ＋ as。not をつけると「〜ほど…ない」。', en: 'Ken is as tall as Tom.\nKen is not as tall as Tom.' },
          { text: '「どちらのほうが好き？」', en: 'Which do you like better, dogs or cats?\n— I like cats better.' },
          { text: 'やってみよう。', q: genAs(rng) },
          { text: 'もう1問。', q: genWhich(rng) },
          { text: '並べかえ。', q: genOrder(rng) },
        ];
      },
    },
  ],
};
