// 英語 リスニング: 放送（端末の読み上げ）を聞いて答える。模試の大問1と同じ形の問題を、何回でも練習できる
import { textChoice } from './kit-en.js';
import { SHORT, LONG } from './listen-bank.js';

const script = (lines) => lines.map((l) => l.text).join('\n');
function listenQ(rng, lines, q) {
  const all = [...lines, { who: 'N', text: `Question: ${q.ask}` }];
  return {
    stem: `🎧 放送を聞いて、答えを選ぼう\nQuestion: ${q.ask}`,
    ...textChoice(rng, q.correct, q.wrongs.map((t) => ({ t }))),
    listen: { lines: all },
    hint: '質問を先に読んでから聞くと、答えの部分を聞きのがしにくい。🔊 は何回でも聞ける。',
    steps: [q.why, `放送: ${lines.map((l) => (l.who === 'N' ? '' : `${l.who}: `) + l.text).join(' / ')}`],
    lang: 'english',
    check: { kind: 'en-listen', evidence: q.evidence, src: script(all) },
  };
}
const genShort = (rng) => { const t = rng.pick(SHORT)(rng); return listenQ(rng, t.lines, t); };
const genLong = (rng) => { const L = rng.pick(LONG)(rng); return listenQ(rng, L.lines, rng.pick(L.qs)); };

export default {
  id: 'en-listen',
  subject: 'english',
  stage: 2,
  area: '英語棟・放送室',
  title: 'リスニング',
  emoji: '🎧',
  prereqs: ['en-wh'],
  tool: 'double',
  hintCard: [
    '先に質問を読む → 何を聞きとればいいか分かる（時刻？場所？人数？）',
    'But / so / Then のあとに答えが来ることが多い（予定の変更）',
    '数字は2つ以上出てくることが多い。質問に合うほうを選ぶ',
    '🔊 は練習では何回でも聞ける（本番は2回まで）',
  ],
  generators: {
    'ls-short': { difficulty: 1, gen: genShort },
    'ls-long': { difficulty: 2, gen: genLong },
  },
  lessons: [
    {
      id: 'ls-l1',
      title: '短い対話を聞く',
      unlocks: ['ls-short'],
      build(rng) {
        return [
          { text: '🔊 のボタンで英語が流れる。音が出ないときは、iPhone のマナーモードとボリュームを確かめよう。' },
          { text: 'コツ: 先に「Question」を読んで、何を聞けばいいかを決めてから聞く。', en: 'Question: What time will they meet?\n→ 時刻を聞きとる' },
          { text: 'やってみよう。', q: genShort(rng) },
          { text: 'もう1問。But や so のあとに注意。', q: genShort(rng) },
        ];
      },
    },
    {
      id: 'ls-l2',
      title: 'まとまった英語を聞く',
      unlocks: ['ls-long'],
      build(rng) {
        return [
          { text: '先生の連絡・お店の放送・スピーチなど、1人が話す長めの英語。数字・場所・持ち物をメモするつもりで聞く。' },
          { text: 'やってみよう。', q: genLong(rng) },
          { text: 'もう1問。', q: genLong(rng) },
        ];
      },
    },
  ],
};
