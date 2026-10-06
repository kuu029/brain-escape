// 第3段階の枠（ロック表示用）。中身を作ったら、このリストから外して
// stage1/2 と同じ形の単元ファイルを作り、registry.js に追加する。
const soon = (id, title, area, emoji, prereqs) => ({ id, stage: 3, title, area, emoji, prereqs, comingSoon: true });

export default [
  soon('proportion', '比例・反比例', '外壁の上', '📈', ['linear-equations']),
  soon('linear-function', '一次関数', '有刺鉄線ゾーン', '📉', ['proportion', 'simultaneous']),
  soon('quadratic-function', '関数 y=ax²', 'サーチライト', '🔦', ['linear-function', 'quadratic']),
  soon('angles', '平行線と角', '森の入口', '📐', []),
  soon('congruence', '合同・三角形と四角形', '森の小道', '🔺', ['angles']),
  soon('circle-angle', '円周角', '湖のほとり', '⭕', ['congruence']),
  soon('similarity', '相似', '山小屋', '🔍', ['congruence']),
  soon('pythagoras', '三平方の定理', '峠', '📏', ['similarity', 'square-roots']),
  soon('solids', '空間図形', '洞窟', '🧊', []),
  soon('probability', '確率', '港の酒場', '🎲', []),
  soon('data', 'データの活用', '灯台', '📊', []),
  soon('word-mix', '文章題の総合', '自由の船', '⛵', ['simultaneous', 'quadratic']),
];
