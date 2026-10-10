// 理科 第3段階（中3）: 天体の動き（日周運動・年周運動・南中高度）
//   日周運動: 1時間に 15°（東 → 西）。年周運動: 同じ時刻の星は 1か月に 30° 西へ（同じ位置に来る時刻は 1か月に 2時間早くなる）
//   南中高度: 春分・秋分 = 90° − 緯度、夏至 = 90° − 緯度 + 23.4°、冬至 = 90° − 緯度 − 23.4°
import { sciNum, m, dec, near, round2 } from './kit-sci.js';

const STARS = ['オリオン座', 'さそり座', 'カシオペヤ座', 'はくちょう座', 'しし座'];
const clock = (h) => `${h < 12 ? '午前' : '午後'}${h % 12 === 0 && h >= 12 ? 12 : h % 12}時`;

function genDay(rng) {
  const hours = rng.int(1, 6);
  const star = rng.pick(STARS);
  if (rng.chance(0.5)) {
    return sciNum({
      stem: `${star}が南中してから ${hours} 時間後、${star}は南中した位置から何度西へ動いて見えるか。`,
      v: 15 * hours, unit: '°',
      wrongs: [{ v: 30 * hours, msg: '1か月に 30° は年周運動。1時間では 15°。' }, { v: hours, msg: '1時間に 15° 動く。' }],
      hint: '地球の自転（24時間で 360°）→ 1時間に 15°',
      steps: [`${m(`360\\div 24=15`)}（° / 時間）`, `${m(`15\\times ${hours}=${15 * hours}`)}（°）`],
      verify: (x) => near((x / 360) * 24, hours),
    });
  }
  return sciNum({
    stem: `星が東から西へ ${15 * hours}° 動くのに、およそ何時間かかるか。`,
    v: hours, unit: '時間',
    wrongs: [{ v: (15 * hours) / 30, msg: '1時間に 15°（30° は年周運動の1か月分）。' }, { v: 15 * hours * 15, msg: '15 でわる。' }],
    hint: '1時間に 15° 動く',
    steps: [`${m(`${15 * hours}\\div 15=${hours}`)}（時間）`],
    verify: (x) => near(x * 15, 15 * hours),
  });
}
function genYear(rng) {
  const star = rng.pick(STARS);
  const h0 = rng.pick([20, 21, 22, 23, 24]);
  const mon = rng.int(1, 3);
  if (rng.chance(0.5)) {
    const h1 = h0 - 2 * mon;
    return sciNum({
      stem: `ある日の${clock(h0 % 24)}に、${star}が南中した。${mon} か月後に${star}が南中するのは、およそ何時か。24時間制で答えなさい（例: 午後7時 → 19）。`,
      v: h1, unit: '時',
      wrongs: [{ v: h0 - mon, msg: '1か月に 2時間早くなる（30° ÷ 15° = 2時間）。' }, { v: (h0 + 2 * mon) % 24 || 24, msg: '早くなる（時刻は前にずれる）。星は1か月で 30° 西へずれるので、同じ位置に来るのが早くなる。' }],
      hint: '同じ時刻に見える星は1か月に 30° 西へ → 同じ位置に来る時刻は 1か月に 2時間早くなる',
      steps: ['1か月で 30° → 30 ÷ 15 = 2 時間早くなる', `${m(`${h0}-2\\times ${mon}=${h1}`)}（時）`],
      verify: (x) => near((h0 - x) * 15, 30 * mon),
    });
  }
  return sciNum({
    stem: `ある日の午後8時に、${star}が南中した。${mon} か月後の午後8時に見ると、${star}は南中した位置から何度西へ動いているか。`,
    v: 30 * mon, unit: '°',
    wrongs: [{ v: 15 * mon, msg: '1時間に 15° は日周運動。年周運動は1か月に 30°。' }, { v: 360 / (12 * mon), msg: '1か月に 30° ずつ動く。' }],
    hint: '地球の公転（12か月で 360°）→ 1か月に 30°',
    steps: [`${m(`360\\div 12=30`)}（° / 月）`, `${m(`30\\times ${mon}=${30 * mon}`)}（°）`],
    verify: (x) => near((x / 360) * 12, mon),
  });
}
const DAYS = [['春分', 0], ['秋分', 0], ['夏至', 23.4], ['冬至', -23.4]];
function genAlt(rng) {
  const lat = rng.pick([33, 34, 35, 36, 38, 40, 43]);
  const [day, off] = rng.pick(DAYS);
  const alt = round2(90 - lat + off);
  return sciNum({
    stem: `北緯 ${lat}° の地点で、${day}の日の太陽の南中高度は何度か。地軸は公転面に垂直な方向に対して 23.4° かたむいているものとする。`,
    v: alt, unit: '°',
    wrongs: [{ v: round2(90 - lat - off), msg: off > 0 ? '夏至は 23.4° 高くなる（足す）。' : '冬至は 23.4° 低くなる（引く）。' }, { v: lat, msg: '南中高度 = 90° − 緯度（春分・秋分）。' }, { v: round2(90 - lat), msg: `${day}は、春分・秋分より 23.4° ${off > 0 ? '高い' : '低い'}。` }],
    hint: '春分・秋分: 90° − 緯度 ／ 夏至: 90° − 緯度 + 23.4° ／ 冬至: 90° − 緯度 − 23.4°',
    steps: [off === 0 ? `${m(`90-${lat}=${dec(alt)}`)}（°）` : `${m(`90-${lat}${off > 0 ? '+' : '-'}23.4=${dec(alt)}`)}（°）`],
    verify: (x) => near(x + lat - off, 90),
  });
}

export default {
  id: 'sc-sky',
  subject: 'science',
  stage: 3,
  area: '理科棟・屋上の天文台',
  title: '天体の動き',
  emoji: '🔭',
  prereqs: ['sc-quake'],
  tool: 'rewind',
  hintCard: [
    '日周運動（地球の自転）: 1時間に 15°、東から西へ',
    '年周運動（地球の公転）: 同じ時刻の星は 1か月に 30° 西へ → 同じ位置に来るのは 1か月に 2時間早くなる',
    '南中高度: 春分・秋分 = 90° − 緯度',
    '夏至 = 90° − 緯度 + 23.4°、冬至 = 90° − 緯度 − 23.4°',
  ],
  generators: {
    'sk-day': { difficulty: 1, gen: genDay },
    'sk-year': { difficulty: 2, gen: genYear },
    'sk-alt': { difficulty: 2, gen: genAlt },
  },
  lessons: [
    {
      id: 'sk-l1',
      title: '日周運動と年周運動',
      unlocks: ['sk-day', 'sk-year'],
      build(rng) {
        return [
          { text: '地球は1日（24時間）で1回転（自転）→ 星は 1時間に 360 ÷ 24 = 15° 動いて見える。', q: genDay(rng) },
          { text: '地球は1年（12か月）で太陽のまわりを1周（公転）→ 同じ時刻に見える星は 1か月に 360 ÷ 12 = 30° 西へずれる。\n30° は 2時間分なので、同じ位置に来る時刻は 1か月に 2時間早くなる。', q: genYear(rng) },
        ];
      },
    },
    {
      id: 'sk-l2',
      title: '太陽の南中高度',
      unlocks: ['sk-alt'],
      build(rng) {
        return [
          { text: '春分・秋分の南中高度 = 90° − 緯度。\n地軸が 23.4° かたむいているので、夏至は 23.4° 高く、冬至は 23.4° 低くなる。\n例: 北緯 35°（滋賀県のあたり）の夏至 → 90 − 35 + 23.4 = 78.4°', q: genAlt(rng) },
          { text: 'もう1問。', q: genAlt(rng) },
        ];
      },
    },
  ],
};
