// 国語 第3段階: 古文の係り結び
//   ぞ・なむ・や・か → 文末が連体形、こそ → 已然形、係りの助詞がない → 終止形
//   データ: 文末になる語の [終止形, 連体形, 已然形]（3つとも形がちがう語だけ）
import { jaChoice } from './kit-ja.js';

export const KAKARI = { ぞ: '連体形', なむ: '連体形', や: '連体形', か: '連体形', こそ: '已然形' };
export const PREDS = [
  ['をかし', 'をかしき', 'をかしけれ', '趣がある'],
  ['高し', '高き', '高けれ', '高い'],
  ['ありけり', 'ありける', 'ありけれ', 'あった'],
  ['春なり', '春なる', '春なれ', '春である'],
  ['見き', '見し', '見しか', '見た'],
  ['知らず', '知らぬ', '知らね', '知らない'],
  ['散りたり', '散りたる', '散りたれ', '散っている'],
  ['あはれなり', 'あはれなる', 'あはれなれ', 'しみじみと趣がある'],
  ['うつくし', 'うつくしき', 'うつくしけれ', 'かわいらしい'],
  ['来たりけり', '来たりける', '来たりけれ', 'やって来た'],
];
const SUBJ = ['月', '花', '山', '人', '風', '鳥'];
const FORM_IDX = { 終止形: 0, 連体形: 1, 已然形: 2 };

export function ruleForm(particle) { return particle ? KAKARI[particle] : '終止形'; }

function genFill(rng) {
  const P = rng.pick(PREDS);
  const particle = rng.pick([...Object.keys(KAKARI), null, 'こそ', 'ぞ']);
  const form = ruleForm(particle);
  const right = P[FORM_IDX[form]];
  const subj = rng.pick(SUBJ);
  return jaChoice(rng, {
    stem: `次の（　）に入る正しい形は？（「${P[0]}」＝${P[3]}）\n${subj}${particle || 'は'}（　　）。`,
    correct: right,
    wrongs: P.slice(0, 3).filter((x) => x !== right).map((t) => ({ t, msg: particle ? `係りの助詞「${particle}」→ 結びは${form}（${right}）。` : `係りの助詞がないので、ふつうの言い切り（終止形）。` })),
    n: 3,
    hint: 'ぞ・なむ・や・か → 連体形 ／ こそ → 已然形 ／ 係りの助詞なし → 終止形',
    steps: [particle ? `「${particle}」があるので係り結び → ${form}` : '係りの助詞がない → 終止形', `${P[0]} の${form} →「${right}」`],
    verify: (t) => t === P[FORM_IDX[ruleForm(particle)]],
  });
}
function genWhich(rng) {
  const particle = rng.pick(Object.keys(KAKARI));
  const form = KAKARI[particle];
  return jaChoice(rng, {
    stem: `係りの助詞「${particle}」があるとき、文末（結び）は何形になる？`,
    correct: form,
    wrongs: ['終止形', '連体形', '已然形', '命令形'].filter((x) => x !== form).map((t) => ({ t, msg: 'ぞ・なむ・や・か → 連体形、こそ → 已然形' })),
    hint: 'ぞ・なむ・や・か → 連体形 ／ こそ → 已然形',
    steps: [`「${particle}」→ ${form}`],
    verify: (t) => t === KAKARI[particle],
  });
}

export default {
  id: 'ja-kakari',
  subject: 'japanese',
  stage: 3,
  area: '国語棟・くもの巣の天井',
  title: '古文の係り結び',
  emoji: '🕸️',
  prereqs: ['ja-kana'],
  tool: 'mega',
  hintCard: [
    '係りの助詞「ぞ・なむ・や・か」→ 文末は連体形',
    '係りの助詞「こそ」→ 文末は已然形',
    '係りの助詞がない → ふつうの言い切り（終止形）',
    '例: 月ぞ をかしき ／ 山こそ 高けれ ／ 花 をかし',
  ],
  generators: {
    'kk-fill': { difficulty: 2, gen: genFill },
    'kk-which': { difficulty: 1, gen: genWhich },
  },
  lessons: [
    {
      id: 'kk-l1',
      title: '係り結びのきまり',
      unlocks: ['kk-which'],
      build(rng) {
        return [
          { text: '古文では、文の中に「ぞ・なむ・や・か・こそ」があると、文末の形が変わる。これを「係り結び」という。' },
          { text: 'ぞ・なむ・や・か → 連体形　こそ → 已然形\n（意味は、ぞ・なむ・こそ が強調、や・か が疑問・反語）', q: genWhich(rng) },
          { text: 'もう1問。', q: genWhich(rng) },
        ];
      },
    },
    {
      id: 'kk-l2',
      title: '結びの形を選ぶ',
      unlocks: ['kk-fill'],
      build(rng) {
        return [
          { text: '例: 「月をかし」（終止形）→「月ぞをかしき」（連体形）→「月こそをかしけれ」（已然形）' },
          { text: 'やってみよう。', q: genFill(rng) },
          { text: 'もう1問。', q: genFill(rng) },
        ];
      },
    },
  ],
};
