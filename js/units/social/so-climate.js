// 社会 第1段階（地理）: 雨温図の読み取り（世界の気候帯・日本の気候区分）
//   データは各都市の平年値（おおよその値）。答えは「気温と降水量のきまり」で分類しなおして、テストで照らし合わせる
import { sciChoice } from '../science/kit-sci.js';

// [都市, 月平均気温 1〜12月 (℃), 月降水量 1〜12月 (mm)]
export const WORLD = [
  ['シンガポール', [26.5, 27.1, 27.5, 28.0, 28.3, 28.3, 27.9, 27.9, 27.6, 27.6, 27.0, 26.4], [242, 162, 185, 179, 172, 161, 159, 176, 169, 194, 256, 288], '熱帯'],
  ['カイロ', [14.0, 15.3, 17.7, 21.6, 24.9, 27.4, 28.0, 28.0, 26.4, 23.8, 19.3, 15.5], [5, 4, 3, 1, 0, 0, 0, 0, 0, 1, 3, 5], '乾燥帯'],
  ['ローマ', [7.6, 8.4, 10.8, 13.8, 18.0, 22.2, 25.0, 25.1, 21.4, 17.2, 12.1, 8.6], [69, 76, 59, 66, 51, 34, 17, 32, 76, 113, 112, 87], '温帯（地中海性気候）'],
  ['ロンドン', [5.8, 6.2, 8.1, 10.5, 13.8, 16.7, 18.9, 18.6, 16.1, 12.6, 8.9, 6.3], [56, 43, 42, 45, 48, 46, 46, 51, 50, 70, 64, 57], '温帯（西岸海洋性気候）'],
  ['東京', [5.4, 6.1, 9.4, 14.3, 18.8, 21.9, 25.7, 26.9, 23.3, 18.0, 12.5, 7.7], [60, 56, 117, 125, 138, 168, 154, 168, 210, 198, 93, 58], '温帯（温暖湿潤気候）'],
  ['モスクワ', [-6.2, -5.9, -0.7, 6.9, 13.6, 17.3, 19.7, 17.6, 11.9, 5.8, -0.5, -4.4], [53, 44, 39, 37, 61, 77, 84, 82, 68, 71, 55, 52], '冷帯（亜寒帯）'],
  ['バロー', [-25.4, -27.1, -25.7, -17.9, -6.3, 1.7, 5.0, 3.6, -0.6, -8.9, -17.9, -23.5], [4, 4, 3, 4, 4, 8, 26, 25, 18, 12, 6, 4], '寒帯'],
];
export const JAPAN = [
  ['札幌', [-3.2, -2.7, 1.1, 7.3, 13.0, 17.0, 21.1, 22.3, 18.6, 12.1, 5.2, -0.9], [108, 92, 78, 55, 56, 60, 91, 127, 135, 110, 112, 114], '北海道の気候'],
  ['金沢', [4.0, 4.2, 7.3, 12.6, 17.6, 21.7, 25.8, 27.3, 23.2, 17.6, 11.9, 6.8], [256, 163, 157, 144, 138, 170, 233, 140, 226, 179, 250, 301], '日本海側の気候'],
  ['東京', [5.4, 6.1, 9.4, 14.3, 18.8, 21.9, 25.7, 26.9, 23.3, 18.0, 12.5, 7.7], [60, 56, 117, 125, 138, 168, 154, 168, 210, 198, 93, 58], '太平洋側の気候'],
  ['松本', [-0.4, 0.4, 4.4, 10.6, 16.0, 19.9, 23.8, 24.7, 20.3, 13.6, 7.5, 2.1], [36, 44, 80, 75, 100, 126, 138, 92, 156, 102, 55, 31], '内陸（中央高地）の気候'],
  ['高松', [5.9, 6.3, 9.4, 14.7, 19.8, 23.3, 27.5, 28.6, 24.7, 19.0, 13.2, 8.1], [39, 46, 82, 77, 104, 153, 144, 85, 174, 104, 60, 38], '瀬戸内の気候'],
  ['那覇', [17.3, 17.5, 19.1, 21.5, 24.2, 27.2, 29.1, 29.0, 27.9, 25.5, 22.5, 19.0], [101, 115, 142, 161, 245, 284, 188, 240, 275, 179, 119, 110], '南西諸島の気候'],
];
const sum = (a) => a.reduce((x, y) => x + y, 0);
// 気候帯のきまり（中学で使うおおまかな目安）
export function worldClimate(t, p) {
  const hot = Math.max(...t), cold = Math.min(...t);
  if (hot < 10) return '寒帯';
  if (sum(p) < 500) return '乾燥帯';
  if (cold >= 18) return '熱帯';
  if (cold < -3) return '冷帯（亜寒帯）';
  const summer = Math.min(p[5], p[6], p[7]);
  const winter = Math.max(p[11], p[0], p[1]);
  if (summer < 40 && winter > summer * 3) return '温帯（地中海性気候）';
  if (hot < 22) return '温帯（西岸海洋性気候）';
  return '温帯（温暖湿潤気候）';
}
export function japanClimate(t, p) {
  const cold = Math.min(...t);
  if (cold >= 15) return '南西諸島の気候';
  if (cold < -2) return '北海道の気候';
  if (p[11] + p[0] > 400) return '日本海側の気候';
  if (sum(p) < 1300) return cold < 3 ? '内陸（中央高地）の気候' : '瀬戸内の気候';
  return '太平洋側の気候';
}
const W_KINDS = [...new Set(WORLD.map((c) => c[3]))];
const J_KINDS = [...new Set(JAPAN.map((c) => c[3]))];

// 雨温図（SVG）: 棒 = 降水量、折れ線 = 気温
export function chart(t, p) {
  const W = 300, H = 190, L = 34, R = 266, T = 14, B = 160;
  const tMin = Math.min(-30, Math.floor(Math.min(...t) / 10) * 10), tMax = 40;
  const pMax = Math.max(500, Math.ceil(Math.max(...p) / 100) * 100);
  const x = (i) => L + ((R - L) / 12) * (i + 0.5);
  const yT = (v) => B - ((v - tMin) / (tMax - tMin)) * (B - T);
  const yP = (v) => B - (v / pMax) * (B - T);
  const bw = ((R - L) / 12) * 0.7;
  const ticksT = []; for (let v = tMin; v <= tMax; v += 10) ticksT.push(v);
  const ticksP = []; for (let v = 0; v <= pMax; v += 100) ticksP.push(v);
  // div で包む（svg で始まると、数学の図と同じ「横ならび」の配置になって文がつぶれるため）
  return `<div class="climate-box"><svg viewBox="0 0 ${W} ${H}" class="climate" role="img" aria-label="雨温図">`
    + `<rect x="${L}" y="${T}" width="${R - L}" height="${B - T}" fill="#ffffff08" stroke="#ffffff40"/>`
    + ticksT.map((v) => `<line x1="${L}" x2="${R}" y1="${yT(v)}" y2="${yT(v)}" stroke="#ffffff1a"/><text x="${L - 4}" y="${yT(v) + 3}" font-size="9" text-anchor="end" fill="#ff9a8a">${v}</text>`).join('')
    + ticksP.filter((v) => v % 100 === 0).map((v) => `<text x="${R + 4}" y="${yP(v) + 3}" font-size="9" fill="#8ac4ff">${v}</text>`).join('')
    + p.map((v, i) => `<rect x="${x(i) - bw / 2}" y="${yP(v)}" width="${bw}" height="${B - yP(v)}" fill="#4a9cff"/>`).join('')
    + `<polyline points="${t.map((v, i) => `${x(i)},${yT(v)}`).join(' ')}" fill="none" stroke="#ff5a4a" stroke-width="2.5"/>`
    + t.map((v, i) => `<circle cx="${x(i)}" cy="${yT(v)}" r="2.6" fill="#ff5a4a"/>`).join('')
    + [1, 4, 7, 10, 12].map((mo) => `<text x="${x(mo - 1)}" y="${B + 12}" font-size="9" text-anchor="middle" fill="#ddd">${mo}</text>`).join('')
    + `<text x="${L - 4}" y="${T - 4}" font-size="9" text-anchor="end" fill="#ff9a8a">℃</text><text x="${R + 4}" y="${T - 4}" font-size="9" fill="#8ac4ff">mm</text>`
    + `<text x="${(L + R) / 2}" y="${H - 6}" font-size="9" text-anchor="middle" fill="#bbb">（月）　年平均 ${(sum(t) / 12).toFixed(1)}℃・年降水量 ${Math.round(sum(p))}mm</text>`
    + '</svg></div>';
}
const WHY_W = {
  熱帯: 'いちばん寒い月でも 18℃ 以上。一年中暑く、雨が多い。',
  乾燥帯: '一年を通して雨がとても少ない（年降水量が 500 mm 未満）。',
  '温帯（地中海性気候）': '夏に雨が少なく（乾燥）、冬に雨が多い。',
  '温帯（西岸海洋性気候）': '夏はすずしく、冬も緯度のわりに寒くない。雨は一年中平均して降る。',
  '温帯（温暖湿潤気候）': '夏は暑くて雨が多く、冬は寒い。季節の変化がはっきりしている。',
  '冷帯（亜寒帯）': '冬の寒さがきびしい（最も寒い月が −3℃ 未満）が、夏は気温が上がる。',
  寒帯: 'いちばん暑い月でも 10℃ 未満。一年中寒い。',
};
const WHY_J = {
  北海道の気候: '冬の寒さがきびしく、梅雨がない。',
  日本海側の気候: '冬に北西の季節風の影響で、雪（降水量）が多い。',
  太平洋側の気候: '夏に雨が多く、冬は晴れて乾燥する。',
  '内陸（中央高地）の気候': '一年を通して降水量が少なく、夏と冬の気温の差が大きい。冬は寒い。',
  瀬戸内の気候: '山地にはさまれ、一年を通して降水量が少ない。冬も比較的あたたかい。',
  南西諸島の気候: '一年中あたたかく、雨が多い（台風の影響も大きい）。',
};

function genWorld(rng) {
  const [, t, p, ans] = rng.pick(WORLD);
  return sciChoice(rng, {
    stem: '次の雨温図の都市は、どの気候帯にふくまれるか。（棒グラフ＝降水量、折れ線＝気温）',
    fig: chart(t, p),
    correct: ans,
    wrongs: rng.shuffle(W_KINDS.filter((k) => k !== ans)).slice(0, 3).map((k) => ({ t: k, msg: WHY_W[ans] })),
    hint: 'まず気温（最も暑い月・最も寒い月）、次に降水量（年間の量・多い季節）を見る。',
    steps: [WHY_W[ans], `→ ${ans}`],
    verify: (k) => k === worldClimate(t, p),
  });
}
function genJapan(rng) {
  const [, t, p, ans] = rng.pick(JAPAN);
  return sciChoice(rng, {
    stem: '次の雨温図は、日本のどの気候区分の都市か。（棒グラフ＝降水量、折れ線＝気温）',
    fig: chart(t, p),
    correct: ans,
    wrongs: rng.shuffle(J_KINDS.filter((k) => k !== ans)).slice(0, 3).map((k) => ({ t: k, msg: WHY_J[ans] })),
    hint: '冬の降水量が多い → 日本海側。年間の降水量が少ない → 瀬戸内か内陸（冬の寒さで見分ける）。一年中あたたかい → 南西諸島。',
    steps: [WHY_J[ans], `→ ${ans}`],
    verify: (k) => k === japanClimate(t, p),
  });
}

export default {
  id: 'so-climate',
  subject: 'social',
  stage: 1,
  area: '社会棟・お天気観測所',
  title: '雨温図と気候',
  emoji: '🌦️',
  prereqs: [],
  tool: 'freeze',
  hintCard: [
    '熱帯: 一年中暑い ／ 乾燥帯: 雨がとても少ない ／ 寒帯: 一年中寒い',
    '温帯: 地中海性（夏に乾燥）・西岸海洋性（夏すずしい）・温暖湿潤（夏暑く雨が多い）',
    '冷帯: 冬がとても寒いが、夏は気温が上がる',
    '日本: 日本海側は冬に雪、太平洋側は夏に雨、瀬戸内・内陸は雨が少ない',
  ],
  generators: {
    'cl-world': { difficulty: 2, gen: genWorld },
    'cl-japan': { difficulty: 2, gen: genJapan },
  },
  lessons: [
    {
      id: 'cl-l1',
      title: '世界の気候帯',
      unlocks: ['cl-world'],
      build(rng) {
        return [
          { text: '雨温図は、棒グラフが降水量、折れ線グラフが気温。\nまず「一年中暑い？ 寒い？」、次に「雨が少ない？ どの季節に多い？」を見る。', q: genWorld(rng) },
          { text: 'もう1問。', q: genWorld(rng) },
        ];
      },
    },
    {
      id: 'cl-l2',
      title: '日本の気候区分',
      unlocks: ['cl-japan'],
      build(rng) {
        return [
          { text: '日本海側: 冬の季節風で雪が多い ／ 太平洋側: 夏に雨が多い\n瀬戸内・内陸: 山にかこまれて雨が少ない（内陸は冬が寒い）\n北海道: 冬が寒く梅雨がない ／ 南西諸島: 一年中あたたかい', q: genJapan(rng) },
          { text: 'もう1問。', q: genJapan(rng) },
        ];
      },
    },
  ],
};
