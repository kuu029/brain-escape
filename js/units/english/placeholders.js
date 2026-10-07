// 英語 第3段階の枠（ロック表示用）。中身を作ったら、このリストから外して単元ファイルを作り、registry.js に追加する。
const soon = (id, stage, title, area, emoji, prereqs) => ({ id, subject: 'english', stage, title, area, emoji, prereqs, comingSoon: true });

export default [
  soon('en-words3', 3, '中3の単語・熟語', '単語倉庫・屋根裏', '🗃️', ['en-words2']),
  soon('en-passive', 3, '受動態', '屋上・見張り台', '🔄', ['en-past']),
  soon('en-perfect', 3, '現在完了', '屋上・時計塔', '⏳', ['en-past']),
  soon('en-participle', 3, '後ろから説明する分詞', '屋上・はしご', '🪜', ['en-prog']),
  soon('en-relative', 3, '関係代名詞', '屋上・ロープ', '🪢', ['en-wh']),
  soon('en-indirect', 3, '間接疑問', '屋上・無線室', '📻', ['en-wh']),
  soon('en-subjunctive', 3, '仮定法', '自由へのヘリポート', '🚁', ['en-past']),
];
