// 英語 第2段階: 中2の単語と熟語
import { WORDS2, THEMES2 } from './words2.js';
import { vocabProblem, distinct } from './en-words1.js';
import { textChoice } from './kit-en.js';

const themeGen = (theme) => (rng) => {
  const pool = WORDS2.filter((w) => w.theme === theme);
  const r = rng.next();
  const mode = r < 0.45 ? 'e2j' : r < 0.8 || theme === 'idiom' ? 'j2e' : 'spell';
  return vocabProblem(rng, pool, mode);
};

// 熟語の前置詞・副詞を選ぶ（look （ ）＝〜を探す）
export const PARTICLES = ['for', 'at', 'after', 'to', 'up', 'off', 'on', 'of', 'in', 'from', 'with', 'down', 'back'];
const IDIOMS = WORDS2.filter((w) => w.theme === 'idiom');
const blankable = IDIOMS.filter((w) => w.w.split(' ').some((x, i) => i > 0 && PARTICLES.includes(x)));
function genParticle(rng) {
  const w = rng.pick(blankable);
  const parts = w.w.split(' ');
  const at = parts.findLastIndex((x, i) => i > 0 && PARTICLES.includes(x));
  const right = parts[at];
  const make = (p) => parts.map((x, i) => (i === at ? p : x)).join(' ');
  // 入れかえると「同じ意味の熟語」になってしまう前置詞は選択肢に出さない
  const ok = (p) => {
    const other = IDIOMS.find((x) => x.w === make(p));
    return !other || distinct(w, other);
  };
  const wrongs = rng.shuffle(PARTICLES.filter((p) => p !== right && ok(p))).slice(0, 3).map((p) => {
    const other = IDIOMS.find((x) => x.w === make(p));
    return { t: p, msg: other ? `${make(p)} は「${other.ja}」。` : `「${w.ja}」は ${w.w}。` };
  });
  const shown = parts.map((x, i) => (i === at ? '（　　）' : x)).join(' ');
  return {
    stem: `「${w.ja}」になるように（　　）に入る語は？\n${shown}`,
    ...textChoice(rng, right, wrongs),
    answerText: w.w,
    hint: '熟語はセットで覚えよう。前置詞のイメージ: for（目的・〜を求めて）/ at（一点）/ after（あとを追う）',
    steps: [`「${w.ja}」＝ ${w.w}`],
    check: { kind: 'en-particle', idiom: w.w, at },
  };
}

const TIPS = {
  people: ['職業は -er / -ist で終わるものが多い（farmer, scientist, artist）。', 'glass は「コップ」も「ガラス」も。'],
  world: ['shrine は神社、temple はお寺。', 'environment（環境）、energy（エネルギー）、trash（ごみ）は環境問題の長文によく出る。'],
  verbs2: ['borrow（借りる）⇔ lend（貸す）。', 'decide to 〜（〜することに決める）、hope to 〜 のように to をとる動詞が多い。'],
  adj2: ['-ed は「（人が）〜した気持ち」、-ing は「（物事が）〜させる」: bored（退屈した）/ boring（退屈な）。', 'already（すでに）、just（ちょうど）、ever（今までに）は中3の現在完了でも大活躍。'],
  idiom: ['be good at 〜（〜が得意）、be interested in 〜（〜に興味がある）は超頻出。', 'look for（探す）/ look at（見る）/ look after（世話をする）。前置詞で意味が変わる！'],
};

const gens = Object.fromEntries(Object.keys(THEMES2).map((t) => [`ew2-${t}`, { difficulty: t === 'idiom' ? 2 : 1, gen: themeGen(t) }]));
gens['ew2-particle'] = { difficulty: 2, gen: genParticle };

export default {
  id: 'en-words2',
  subject: 'english',
  stage: 2,
  area: '単語倉庫・2F',
  title: '中2の単語・熟語',
  emoji: '📚',
  prereqs: ['en-words1'],
  tool: 'coins',
  hintCard: [
    'borrow（借りる）⇔ lend（貸す）',
    'bored（退屈した）/ boring（退屈な）: -ed は人の気持ち、-ing は物事',
    'look for（探す）/ look at（見る）/ look after（世話をする）',
    'be good at ／ be interested in ／ be famous for ／ be afraid of',
  ],
  generators: gens,
  lessons: Object.entries(THEMES2).map(([t, title]) => ({
    id: `ew2-l-${t}`,
    title,
    unlocks: t === 'idiom' ? ['ew2-idiom', 'ew2-particle'] : [`ew2-${t}`],
    build(rng) {
      const pool = WORDS2.filter((w) => w.theme === t);
      const sample = rng.shuffle(pool).slice(0, 6);
      return [
        { text: `テーマ「${title}」は ${pool.length} 語。まずは6つ、ながめてみよう👇`, en: sample.map((w) => `${w.w}　…　${w.ja}`).join('\n') },
        { text: `💡 ${TIPS[t][0]}` },
        { text: `💡 ${TIPS[t][1]}` },
        { text: 'では小テスト。意味はどれ？', q: vocabProblem(rng, pool, 'e2j') },
        { text: '英語ではどれ？', q: vocabProblem(rng, pool, 'j2e') },
        t === 'idiom' ? { text: '熟語の前置詞。', q: genParticle(rng) } : { text: '最後はつづり。', q: vocabProblem(rng, pool, 'spell') },
      ];
    },
  })),
};
