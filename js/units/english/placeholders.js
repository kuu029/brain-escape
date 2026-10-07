// 英語 第2・第3段階の枠（ロック表示用）。中身を作ったら、このリストから外して単元ファイルを作り、registry.js に追加する。
const soon = (id, stage, title, area, emoji, prereqs) => ({ id, subject: 'english', stage, title, area, emoji, prereqs, comingSoon: true });

export default [
  soon('en-words2', 2, '中2の単語・熟語', '単語倉庫・2F', '📚', ['en-words1']),
  soon('en-future', 2, '未来（will / be going to）', '英語棟・予言の間', '🔮', ['en-past']),
  soon('en-modal', 2, '助動詞', '英語棟・ルールの部屋', '📜', ['en-3sg']),
  soon('en-there', 2, 'There is / are', '英語棟・物置', '📦', ['en-plural']),
  soon('en-inf', 2, '不定詞と動名詞', '英語棟・分かれ道', '🔀', ['en-past']),
  soon('en-compare', 2, '比較', '英語棟・はかりの間', '⚖️', ['en-be']),
  soon('en-conj', 2, '接続詞（when / if / because / that）', '英語棟・連絡通路', '🔗', ['en-past']),
  soon('en-words3', 3, '中3の単語・熟語', '単語倉庫・屋根裏', '🗃️', ['en-words2']),
  soon('en-passive', 3, '受動態', '屋上・見張り台', '🔄', ['en-past']),
  soon('en-perfect', 3, '現在完了', '屋上・時計塔', '⏳', ['en-past']),
  soon('en-participle', 3, '後ろから説明する分詞', '屋上・はしご', '🪜', ['en-prog']),
  soon('en-relative', 3, '関係代名詞', '屋上・ロープ', '🪢', ['en-wh']),
  soon('en-indirect', 3, '間接疑問', '屋上・無線室', '📻', ['en-wh']),
  soon('en-subjunctive', 3, '仮定法', '自由へのヘリポート', '🚁', ['en-past']),
];
