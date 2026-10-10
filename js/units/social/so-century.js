// 社会 第2段階（歴史）: 世紀と時代
//   ○世紀 = (○−1)×100+1 年 〜 ○×100 年（1600年は16世紀、1601年は17世紀）
import { sciNum, sciChoice } from '../science/kit-sci.js';

// 時代の区切り（教科書でよく使う年）。境目の年の前後は出さない
export const ERAS = [
  ['飛鳥時代', 593, 710], ['奈良時代', 710, 794], ['平安時代', 794, 1185], ['鎌倉時代', 1185, 1333],
  ['室町時代', 1336, 1573], ['江戸時代', 1603, 1867], ['明治時代', 1868, 1912], ['大正時代', 1912, 1926], ['昭和時代', 1926, 1989],
];
export const centuryOf = (y) => Math.floor((y - 1) / 100) + 1;

function genCentury(rng) {
  const bc = rng.chance(0.15);
  const y = bc ? rng.int(1, 9) * 100 + rng.pick([0, 1, 39, 50, 99]) : rng.pick([rng.int(1, 20) * 100, rng.int(1, 20) * 100 + 1, rng.int(1, 2020)]);
  const c = Math.ceil(y / 100);
  if (bc) {
    return sciNum({
      stem: `紀元前 ${y} 年は、紀元前何世紀か。`,
      v: c, unit: '世紀',
      wrongs: [{ v: c - 1, msg: '紀元前も、1〜100年が1世紀。ちょうど○00年はその世紀の最後の年。' }, { v: c + 1, msg: '紀元前も、1〜100年が1世紀。' }],
      hint: '紀元前も紀元後と同じで、1〜100年が1世紀、101〜200年が2世紀。',
      steps: [`紀元前 ${(c - 1) * 100 + 1}〜${c * 100} 年 → 紀元前 ${c} 世紀`],
      verify: (x) => x === centuryOf(y),
    });
  }
  return sciNum({
    stem: `西暦 ${y} 年は、何世紀か。`,
    v: c, unit: '世紀',
    wrongs: [{ v: Math.floor(y / 100), msg: '百の位の数そのままではない。1〜100年が1世紀なので、ふつうは「百の位 + 1」。' }, { v: Math.floor(y / 100) + 1, msg: 'ちょうど○00年は、その世紀の最後の年（1600年は16世紀）。' }],
    hint: '1〜100年が1世紀、101〜200年が2世紀…。ちょうど○00年は、その世紀の最後の年。',
    steps: [`${(c - 1) * 100 + 1}〜${c * 100} 年 → ${c} 世紀`],
    verify: (x) => x === centuryOf(y),
  });
}
function genRange(rng) {
  const c = rng.int(2, 20);
  const right = `${(c - 1) * 100 + 1}年〜${c * 100}年`;
  return sciChoice(rng, {
    stem: `${c} 世紀は、西暦何年から何年までか。`,
    correct: right,
    wrongs: [`${c * 100}年〜${c * 100 + 99}年`, `${(c - 1) * 100}年〜${c * 100 - 1}年`, `${c * 100 + 1}年〜${(c + 1) * 100}年`].map((t) => ({ t, msg: `${c} 世紀 = ${(c - 1) * 100 + 1} 年から ${c * 100} 年まで。` })),
    hint: '○世紀 = (○ − 1) × 100 + 1 年 〜 ○ × 100 年',
    steps: [`${c} 世紀 → ${right}`],
    verify: (t) => { const [a, b] = t.match(/\d+/g).map(Number); return centuryOf(a) === c && centuryOf(b) === c && centuryOf(a - 1) === c - 1 && centuryOf(b + 1) === c + 1; },
  });
}
function genEra(rng) {
  const [name, from, to] = rng.pick(ERAS);
  const y = rng.int(from + 3, to - 3);
  return sciChoice(rng, {
    stem: `西暦 ${y} 年ごろは、何時代か。`,
    correct: name,
    wrongs: rng.shuffle(ERAS.filter(([n]) => n !== name)).slice(0, 3).map(([n]) => ({ t: n, msg: `${name}は ${from}年〜${to}年ごろ。` })),
    hint: '平城京 710 → 奈良、平安京 794 → 平安、鎌倉幕府 1185ごろ、室町幕府 1336ごろ〜1573、江戸幕府 1603〜1867',
    steps: [`${name}: ${from}年〜${to}年ごろ`],
    verify: (t) => ERAS.some(([n, a, b]) => n === t && y > a && y < b),
  });
}

export default {
  id: 'so-century',
  subject: 'social',
  stage: 2,
  area: '社会棟・年表の回廊',
  title: '世紀と時代',
  emoji: '🏺',
  prereqs: ['so-scale'],
  tool: 'wall',
  hintCard: [
    '1〜100年が1世紀、101〜200年が2世紀…（○世紀 = (○−1)×100+1 年〜○×100 年）',
    'ちょうど○00年は、その世紀の最後の年（1600年 → 16世紀、1601年 → 17世紀）',
    '奈良 710〜、平安 794〜、鎌倉 1185ごろ〜、室町 1336ごろ〜、江戸 1603〜1867',
    '明治 1868〜、大正 1912〜、昭和 1926〜、平成 1989〜',
  ],
  generators: {
    'cy-century': { difficulty: 1, gen: genCentury },
    'cy-range': { difficulty: 1, gen: genRange },
    'cy-era': { difficulty: 2, gen: genEra },
  },
  lessons: [
    {
      id: 'cy-l1',
      title: '世紀',
      unlocks: ['cy-century', 'cy-range'],
      build(rng) {
        return [
          { text: '1世紀は 1年〜100年。2世紀は 101年〜200年。\nだから 1543年 → 16世紀（百の位 15 + 1）。\nでも 1600年 は 16世紀の最後の年（17世紀ではない）。', q: genCentury(rng) },
          { text: '世紀から年の範囲も出せるように。', q: genRange(rng) },
        ];
      },
    },
    {
      id: 'cy-l2',
      title: '時代',
      unlocks: ['cy-era'],
      build(rng) {
        return [
          { text: '都や幕府が置かれた年が、時代の区切りになることが多い。\n710 平城京（奈良）→ 794 平安京（平安）→ 鎌倉幕府 → 室町幕府 → 1603 江戸幕府 → 1868 明治', q: genEra(rng) },
          { text: 'もう1問。', q: genEra(rng) },
        ];
      },
    },
  ],
};
