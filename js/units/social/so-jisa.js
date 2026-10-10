// 社会 第1段階（地理）: 時差
//   経度 15° で 1時間。東にある都市ほど時刻が進んでいる。標準時子午線の経度は問題文に書く（サマータイムは考えない）
import { sciNum, sciChoice, m } from '../science/kit-sci.js';

// [都市, 標準時子午線の経度（東経 +、西経 −）]
export const CITIES = [['東京', 135], ['ロンドン', 0], ['パリ', 15], ['カイロ', 30], ['モスクワ', 45], ['ドバイ', 60], ['ペキン', 120], ['シドニー', 150], ['ニューヨーク', -75], ['ロサンゼルス', -120], ['リオデジャネイロ', -45], ['ホノルル', -150]];
const lonText = (l) => (l === 0 ? '経度0°' : l > 0 ? `東経${l}°` : `西経${-l}°`);
const cityText = ([n, l]) => `${n}（${lonText(l)}）`;
// 2030年の日付（うるう年でない年）。月日と時刻 → 表示
const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const clock = (h) => `${h < 12 ? '午前' : '午後'}${h % 12}時`;
const fmt = (mo, d, hr) => `${mo}月${d}日 ${clock(hr)}`;
// 生成用: 時・日・月を手で繰り上げ・繰り下げ
function shift(mo, d, hr, dh) {
  hr += dh;
  while (hr < 0) { hr += 24; d--; if (d < 1) { mo = mo === 1 ? 12 : mo - 1; d = DAYS[mo - 1]; } }
  while (hr >= 24) { hr -= 24; d++; if (d > DAYS[mo - 1]) { d = 1; mo = mo === 12 ? 1 : mo + 1; } }
  return [mo, d, hr];
}
// 検算用: Date（世界標準時）で計算する
function viaDate(mo, d, hr, dh) {
  const t = new Date(Date.UTC(2030, mo - 1, d, hr) + dh * 3600 * 1000);
  return fmt(t.getUTCMonth() + 1, t.getUTCDate(), t.getUTCHours());
}

function genDiff(rng) {
  const [a, b] = rng.shuffle([...CITIES]).slice(0, 2);
  const diff = Math.abs(a[1] - b[1]) / 15;
  return sciNum({
    stem: `${cityText(a)}と${cityText(b)}の時差は何時間か。（それぞれの都市の標準時子午線の経度。サマータイムは考えない）`,
    v: diff, unit: '時間',
    wrongs: [{ v: Math.abs(a[1] - b[1]), msg: '経度の差そのものではない。15° で 1時間。' }, { v: Math.abs(Math.abs(a[1]) - Math.abs(b[1])) / 15, msg: '東経と西経をまたぐときは、経度を足す（例: 東経135° と 西経75° → 210°）。' }],
    hint: '経度の差 ÷ 15 = 時差。東経と西経をまたぐときは、2つの経度を足す。',
    steps: [`経度の差 = ${Math.abs(a[1] - b[1])}°${a[1] * b[1] < 0 ? `（${Math.abs(a[1])} + ${Math.abs(b[1])}）` : ''}`, `${m(`${Math.abs(a[1] - b[1])}\\div 15=${diff}`)}（時間）`],
    verify: (x) => x * 15 === Math.abs(a[1] - b[1]),
  });
}
function genTime(rng) {
  const tokyo = CITIES[0];
  const other = rng.pick(CITIES.slice(1));
  const fromTokyo = rng.chance(0.6);
  const [src, dst] = fromTokyo ? [tokyo, other] : [other, tokyo];
  const mo = rng.int(1, 12);
  const d = rng.pick([1, 2, 10, 15, DAYS[mo - 1]]);
  const hr = rng.int(0, 23);
  const dh = (dst[1] - src[1]) / 15;
  const right = fmt(...shift(mo, d, hr, dh));
  const wrongs = [shift(mo, d, hr, -dh), shift(mo, d, hr, dh + (dh > 0 ? -12 : 12)), shift(mo, d, hr, dh + (dh > 0 ? 1 : -1))].map((x) => fmt(...x)).filter((t) => t !== right);
  return sciChoice(rng, {
    stem: `${cityText(src)}が ${fmt(mo, d, hr)} のとき、${cityText(dst)}は何月何日の何時か。（サマータイムは考えない）`,
    correct: right,
    wrongs: [...new Set(wrongs)].map((t) => ({ t, msg: `${dst[0]}は${src[0]}より${dh > 0 ? '東' : '西'}にあるので、${Math.abs(dh)}時間${dh > 0 ? '進んでいる（足す）' : 'おくれている（引く）'}。` })),
    hint: '東にある都市ほど時刻が進んでいる。時差 = 経度の差 ÷ 15。日付がかわることにも注意。',
    steps: [`時差 = ${Math.abs(dst[1] - src[1])}° ÷ 15 = ${Math.abs(dh)} 時間`, `${dst[0]}は${dh > 0 ? '東' : '西'}なので ${dh > 0 ? '+' : '−'}${Math.abs(dh)} 時間 → ${right}`],
    verify: (t) => t === viaDate(mo, d, hr, dh),
  });
}

export default {
  id: 'so-jisa',
  subject: 'social',
  stage: 1,
  area: '社会棟・世界時計の間',
  title: '時差',
  emoji: '🕰️',
  prereqs: [],
  tool: 'rewind',
  hintCard: [
    '経度 15° ごとに 1時間の時差（360° ÷ 24時間 = 15°）',
    '日本の標準時子午線は 東経135°（兵庫県明石市）',
    '東にある都市ほど時刻が進んでいる（東へ行くと足す、西へ行くと引く）',
    '東経と西経をまたぐときは、経度を足して経度の差を出す',
  ],
  generators: {
    'js-diff': { difficulty: 1, gen: genDiff },
    'js-time': { difficulty: 3, gen: genTime },
  },
  lessons: [
    {
      id: 'js-l1',
      title: '時差の求め方',
      unlocks: ['js-diff'],
      build(rng) {
        return [
          { text: '地球は24時間で1回転（360°）→ 経度 15° ごとに 1時間ずれる。' },
          { text: '時差 = 経度の差 ÷ 15\n例: 東京（東経135°）とロンドン（0°）→ 135 ÷ 15 = 9時間\n東経と西経をまたぐときは足す: 東京とニューヨーク（西経75°）→ 135 + 75 = 210° → 14時間', q: genDiff(rng) },
          { text: 'もう1問。', q: genDiff(rng) },
        ];
      },
    },
    {
      id: 'js-l2',
      title: '現地の時刻',
      unlocks: ['js-time'],
      build(rng) {
        return [
          { text: '東にある都市ほど、時刻が進んでいる。\n東京が 1月1日 午前9時 → ロンドン（9時間おくれ）は 1月1日 午前0時。\nニューヨーク（14時間おくれ）は 12月31日 午後7時（日付が前の日になる）。', q: genTime(rng) },
          { text: 'もう1問。', q: genTime(rng) },
        ];
      },
    },
  ],
};
