// 英語 第3段階: 中3の単語と熟語
import { WORDS3, THEMES3 } from './words3.js';
import { vocabProblem } from './en-words1.js';
import { particleGen } from './en-words2.js';

const themeGen = (theme) => (rng) => {
  const pool = WORDS3.filter((w) => w.theme === theme);
  const r = rng.next();
  const mode = r < 0.45 ? 'e2j' : r < 0.8 || theme === 'idiom3' ? 'j2e' : 'spell';
  return vocabProblem(rng, pool, mode);
};
const genParticle = particleGen(WORDS3.filter((w) => w.theme === 'idiom3'));

const TIPS = {
  society: ['環境・社会の長文によく出る: pollution（汚染）、resource（資源）、disaster（災害）、population（人口）。', 'opinion（意見）、result（結果）、solution（解決策）は英作文でも使える。'],
  verbs3: ['increase（増える）⇔ decrease（減る）、succeed（成功する）⇔ fail（失敗する）。', 'appear（現れる）⇔ disappear（消える）: dis- は反対の意味を作る。'],
  adj3: ['positive（前向きな）⇔ negative（否定的な）、public（公共の）⇔ private（個人の）。', 'careless（不注意な）: -less は「〜がない」（care ＋ less）。'],
  idiom3: ['be made of（材料が見える）／ be made from（原料が変化）。', 'look forward to 〜（〜を楽しみに待つ）の to のあとは名詞か -ing。'],
};

const gens = Object.fromEntries(Object.keys(THEMES3).map((t) => [`ew3-${t}`, { difficulty: t === 'idiom3' ? 2 : 1, gen: themeGen(t) }]));
gens['ew3-particle'] = { difficulty: 2, gen: genParticle };

export default {
  id: 'en-words3',
  subject: 'english',
  stage: 3,
  area: '単語倉庫・屋根裏',
  title: '中3の単語・熟語',
  emoji: '🗃️',
  prereqs: ['en-words2'],
  tool: 'coins',
  hintCard: [
    'increase ⇔ decrease、succeed ⇔ fail、appear ⇔ disappear',
    'positive ⇔ negative、public ⇔ private',
    'be made of（材料）／ be made from（原料）',
    'look forward to 〜ing（〜を楽しみに待つ）',
  ],
  generators: gens,
  lessons: Object.entries(THEMES3).map(([t, title]) => ({
    id: `ew3-l-${t}`,
    title,
    unlocks: t === 'idiom3' ? ['ew3-idiom3', 'ew3-particle'] : [`ew3-${t}`],
    build(rng) {
      const pool = WORDS3.filter((w) => w.theme === t);
      const sample = rng.shuffle(pool).slice(0, 6);
      return [
        { text: `テーマ「${title}」は ${pool.length} 語。まずは6つ、ながめてみよう👇`, en: sample.map((w) => `${w.w}　…　${w.ja}`).join('\n') },
        { text: `💡 ${TIPS[t][0]}` },
        { text: `💡 ${TIPS[t][1]}` },
        { text: 'では小テスト。意味はどれ？', q: vocabProblem(rng, pool, 'e2j') },
        { text: '英語ではどれ？', q: vocabProblem(rng, pool, 'j2e') },
        t === 'idiom3' ? { text: '熟語の前置詞。', q: genParticle(rng) } : { text: '最後はつづり。', q: vocabProblem(rng, pool, 'spell') },
      ];
    },
  })),
};
