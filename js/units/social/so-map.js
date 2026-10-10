// 社会 第1段階（地理）: 地形図の読み取り（八方位・地図記号）
//   方位は、2地点の位置（右・左・上・下）から角度を計算して、八方位にあてはめる（地図の上が北）
import { sciChoice } from '../science/kit-sci.js';

export const DIRS = ['東', '北東', '北', '北西', '西', '南西', '南', '南東'];
// 検算用: 角度（東 = 0°、反時計回り）から八方位
export const dirOf = (dx, dy) => DIRS[Math.round(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360 / 45) % 8];
// 生成用: 右(+x)・上(+y) の向きの組み合わせから、手で名前をつける
const NAME = { '1,0': '東', '1,1': '北東', '0,1': '北', '-1,1': '北西', '-1,0': '西', '-1,-1': '南西', '0,-1': '南', '1,-1': '南東' };
const PLACES = ['駅', '学校', '神社', '寺', '郵便局', '病院', '公園', '市役所'];

function mapSvg(ax, ay, bx, by, a, b) {
  const S = 24, N = 7, W = S * N;
  const px = (x) => (x + 3) * S + S / 2, py = (y) => (3 - y) * S + S / 2;
  let g = '';
  for (let i = 0; i <= N; i++) g += `<line x1="${i * S}" y1="0" x2="${i * S}" y2="${W}" stroke="#ffffff22"/><line x1="0" y1="${i * S}" x2="${W}" y2="${i * S}" stroke="#ffffff22"/>`;
  return `<svg viewBox="-4 -4 ${W + 44} ${W + 8}" class="fig mapdir" role="img" aria-label="地図">${g}`
    + `<circle cx="${px(ax)}" cy="${py(ay)}" r="6" fill="#ffd640"/><text x="${px(ax) + 8}" y="${py(ay) - 6}" font-size="12" fill="#ffd640">${a}</text>`
    + `<circle cx="${px(bx)}" cy="${py(by)}" r="6" fill="#6bd6ff"/><text x="${px(bx) + 8}" y="${py(by) - 6}" font-size="12" fill="#6bd6ff">${b}</text>`
    + `<g transform="translate(${W + 20},22)"><polygon points="0,-16 6,4 0,0 -6,4" fill="#ff6b6b"/><text x="0" y="18" font-size="11" text-anchor="middle" fill="#fff">北</text></g>`
    + '</svg>';
}
function genDir(rng) {
  const [ux, uy] = rng.pick(Object.keys(NAME)).split(',').map(Number);
  const k = rng.int(2, 3); // 2ます以上はなす（ラベルが重ならないように）
  // B が地図（-3〜3 のます目）からはみ出さないように A を置く
  const ax = ux > 0 ? rng.int(-3, 3 - k) : ux < 0 ? rng.int(-3 + k, 3) : rng.int(-3, 3);
  const ay = uy > 0 ? rng.int(-3, 3 - k) : uy < 0 ? rng.int(-3 + k, 3) : rng.int(-3, 3);
  const bx = ax + ux * k, by = ay + uy * k;
  const [a, b] = rng.shuffle([...PLACES]).slice(0, 2);
  const right = NAME[`${ux},${uy}`];
  const opp = DIRS[(DIRS.indexOf(right) + 4) % 8];
  return sciChoice(rng, {
    stem: `次の地図で、${a}から見て${b}はどの方位にあるか。八方位で答えなさい。（地図の上が北）`,
    fig: mapSvg(ax, ay, bx, by, a, b),
    correct: right,
    wrongs: [opp, DIRS[(DIRS.indexOf(right) + 2) % 8], DIRS[(DIRS.indexOf(right) + 6) % 8]].map((t) => ({ t, msg: `${a}を中心に考える。${b}は${a}の${right}。（逆に${b}から見ると、${a}は${opp}）` })),
    hint: '「〇〇から見て」の〇〇を中心に考える。上が北、右が東、下が南、左が西。',
    steps: [`${a}から${b}へは、${ux > 0 ? '右' : ux < 0 ? '左' : ''}${uy > 0 ? '上' : uy < 0 ? '下' : ''}の向き`, `→ ${right}`],
    verify: (t) => t === dirOf(bx - ax, by - ay),
  });
}
// 地図記号（文字で表せるもの）
export const SYMBOLS = [['文', '小・中学校'], ['卍', '寺院'], ['⛩', '神社'], ['◎', '市役所'], ['〇', '町・村役場'], ['〶', '郵便局'], ['♨', '温泉'], ['✕', '交番']];
const symFig = (c) => `<div class="mapsym">${c}</div>`;
function genSymbol(rng) {
  const [c, name] = rng.pick(SYMBOLS);
  if (rng.chance(0.5)) {
    return sciChoice(rng, {
      stem: '次の地図記号は、何を表しているか。',
      fig: symFig(c),
      correct: name,
      wrongs: rng.shuffle(SYMBOLS.filter(([, n]) => n !== name)).slice(0, 3).map(([, t]) => ({ t, msg: `この記号（${c}）は${name}。` })),
      hint: '文 → 学校（「文」の字から）、卍 → 寺院、鳥居の形 → 神社、◎ → 市役所、〒を丸で囲む → 郵便局',
      steps: [`${c} → ${name}`],
      verify: (t) => SYMBOLS.some(([x, n]) => x === c && n === t),
    });
  }
  return sciChoice(rng, {
    stem: `「${name}」を表す地図記号はどれか。`,
    correct: c,
    wrongs: rng.shuffle(SYMBOLS.filter(([x]) => x !== c)).slice(0, 3).map(([t]) => ({ t, msg: `${name}は「${c}」。` })),
    hint: '文 → 学校、卍 → 寺院、鳥居の形 → 神社、◎ → 市役所、〇 → 町・村役場、〒を丸で囲む → 郵便局、♨ → 温泉、✕ → 交番',
    steps: [`${name} → ${c}`],
    verify: (t) => SYMBOLS.some(([x, n]) => x === t && n === name),
  });
}

export default {
  id: 'so-map',
  subject: 'social',
  stage: 1,
  area: '社会棟・方位の広場',
  title: '方位と地図記号',
  emoji: '🧭',
  prereqs: [],
  tool: 'wall',
  hintCard: [
    '地図はふつう上が北。右が東、下が南、左が西',
    '八方位: 北・北東・東・南東・南・南西・西・北西',
    '「AからみたB」は、Aを中心にしてBの向きを考える',
    '地図記号: 文 学校・卍 寺院・⛩ 神社・◎ 市役所・〇 町村役場・〶 郵便局・♨ 温泉・✕ 交番',
  ],
  generators: {
    'mp-dir': { difficulty: 1, gen: genDir },
    'mp-symbol': { difficulty: 1, gen: genSymbol },
  },
  lessons: [
    {
      id: 'mp-l1',
      title: '八方位',
      unlocks: ['mp-dir'],
      build(rng) {
        return [
          { text: '地図は、ふつう上が北。北と東の間が北東、南と西の間が南西…で八方位。\n「駅から見て学校は？」→ 駅を中心に、学校がどちらにあるかを考える。', q: genDir(rng) },
          { text: 'もう1問。', q: genDir(rng) },
        ];
      },
    },
    {
      id: 'mp-l2',
      title: '地図記号',
      unlocks: ['mp-symbol'],
      build(rng) {
        return [
          { text: '地図記号は、ものの形や関係のある字をもとにしている。\n文（学校）、卍（寺院）、⛩（神社の鳥居）、◎（市役所）、〶（郵便局）、♨（温泉）', q: genSymbol(rng) },
          { text: 'もう1問。', q: genSymbol(rng) },
        ];
      },
    },
  ],
};
