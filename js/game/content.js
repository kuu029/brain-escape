// キャラ・タワー・道具・スキンの定義（すべてオリジナル。見た目は絵文字＋図形）

// 敵（看守たち）
export const ENEMY_LOOK = {
  grunt: { emoji: '🧦', name: 'クツシタ看守' },
  runner: { emoji: '🐟', name: 'サンマ・ローラー' },
  tank: { emoji: '🧊', name: 'レイゾウコ・ゴリーノ' },
  review: { emoji: '👻', name: 'リベンジおばけ' },
  boss: { emoji: '🗿', name: '看守長' },
};

// 単元ごとのボス
export const BOSSES = {
  'signed-numbers': { emoji: '🧲', name: 'ジシャク・カニーニ' },
  'fractions-decimals': { emoji: '🍩', name: 'ドーナツ・ワクセイ卿' },
  expressions: { emoji: '🧽', name: 'スポンジ・ケンポー' },
  'linear-equations': { emoji: '🪣', name: 'バケツ・ドラマーレ' },
  polynomials: { emoji: '🔌', name: 'コンセント・ブタリーノ' },
  simultaneous: { emoji: '🦷', name: 'ハミガキ・シャークス' },
  'expand-factor': { emoji: '🥫', name: 'カンヅメ・カイゾク' },
  'square-roots': { emoji: '🐌', name: 'カタツムリ・ターボ' },
  quadratic: { emoji: '🐸', name: 'カエル・ネクタイーノ総長' },
  // 英語棟
  'en-words1': { emoji: '🦜', name: 'インコ・ジショリーノ' },
  'en-be': { emoji: '🐝', name: 'ハチ・ビードウシ' },
  'en-3sg': { emoji: '🐍', name: 'ヘビ・エスエスエス' },
  'en-plural': { emoji: '🐑', name: 'ヒツジ・フクスウケーノ' },
  'en-prog': { emoji: '🐹', name: 'ハムスター・イングリング' },
  'en-wh': { emoji: '🦉', name: 'フクロウ・フーフー' },
  'en-past': { emoji: '🦖', name: 'パストサウルス' },
  'en-words2': { emoji: '🐙', name: 'タコ・ジュクゴーノ' },
  'en-future': { emoji: '🧙', name: 'ヨゲン・ウィルソン' },
  'en-pastprog': { emoji: '🦥', name: 'ナマケモノ・ワズイング' },
  'en-modal': { emoji: '🦅', name: 'ワシ・マストーノ' },
  'en-there': { emoji: '🦔', name: 'ハリネズミ・ゼアリズ' },
  'en-inf': { emoji: '🦘', name: 'カンガルー・トゥーイング' },
  'en-compare': { emoji: '🦒', name: 'キリン・ハイヤーエスト' },
  'en-conj': { emoji: '🐊', name: 'ワニ・ツナギーノ' },
  'en-words3': { emoji: '🐘', name: 'ゾウ・キオクーノ' },
  'en-passive': { emoji: '🦚', name: 'クジャク・ミラレーノ' },
  'en-perfect': { emoji: '🐢', name: 'カメ・ズットイーノ' },
  'en-participle': { emoji: '🦎', name: 'カメレオン・ブンシーノ' },
  'en-relative': { emoji: '🦑', name: 'イカ・カンケーイ' },
  'en-indirect': { emoji: '🦊', name: 'キツネ・シッテルカ' },
  'en-subjunctive': { emoji: '🦄', name: 'ユニコーン・イフイフ' },
};

// コレクション用カード
export const CARDS = [
  { id: 'kutsushita', emoji: '🧦', name: 'クツシタ看守', rarity: 1, text: '左右で柄がちがう。本人は気にしていない。' },
  { id: 'sanma', emoji: '🐟', name: 'サンマ・ローラー', rarity: 1, text: 'ローラースケートで2マス進む。止まり方は知らない。' },
  { id: 'reizouko', emoji: '🧊', name: 'レイゾウコ・ゴリーノ', rarity: 2, text: 'かたい。中身はプリンだけ。' },
  { id: 'obake', emoji: '👻', name: 'リベンジおばけ', rarity: 1, text: '前に間違えた問題をおぼえている。しつこい。' },
  { id: 'broccoli', emoji: '🥦', name: 'ブロッコ・ブンブンチーノ', rarity: 1, text: 'ヘッドホンで重低音を浴びている。野菜です。' },
  { id: 'onigiri', emoji: '🍙', name: 'オニギリ・メガネーゼ', rarity: 1, text: '具は不明。メガネは伊達。' },
  { id: 'toast', emoji: '🍞', name: 'トースト・ジャンピーノ', rarity: 1, text: '焼けると跳ぶ。焦げると拗ねる。' },
  { id: 'duck', emoji: '🦆', name: 'アヒル・ラッパリーニ', rarity: 2, text: 'ラッパで朝を告げる。うるさい。' },
  { id: 'kani', emoji: '🧲', name: 'ジシャク・カニーニ', rarity: 3, text: 'プラスとマイナスを引きよせる磁石ガニ。' },
  { id: 'donut', emoji: '🍩', name: 'ドーナツ・ワクセイ卿', rarity: 3, text: '穴の大きさは分数で表せるらしい。' },
  { id: 'sponge', emoji: '🧽', name: 'スポンジ・ケンポー', rarity: 3, text: '同類項を吸いこむ拳法の達人。' },
  { id: 'bucket', emoji: '🪣', name: 'バケツ・ドラマーレ', rarity: 3, text: '左右のバランス（＝）にうるさいドラマー。' },
  { id: 'consent', emoji: '🔌', name: 'コンセント・ブタリーノ', rarity: 3, text: 'かっこを外すとビリっとくる。' },
  { id: 'hamigaki', emoji: '🦷', name: 'ハミガキ・シャークス', rarity: 3, text: '2本の式で獲物をはさむ。' },
  { id: 'kanzume', emoji: '🥫', name: 'カンヅメ・カイゾク', rarity: 3, text: '中身を全部かっこに詰めこむ海賊。' },
  { id: 'katatsumuri', emoji: '🐌', name: 'カタツムリ・ターボ', rarity: 3, text: '殻の中に√が巻いている。意外と速い。' },
  { id: 'kaeru', emoji: '🐸', name: 'カエル・ネクタイーノ総長', rarity: 4, text: '監獄のラスボス。解は2つ持っている。' },
  { id: 'moai', emoji: '🗿', name: '無言のモアイ看守', rarity: 2, text: '何も言わない。たまにまばたきする。' },
  { id: 'pigeon', emoji: '🕊️', name: 'ハト・デンセツーノ', rarity: 2, text: '脱獄の手紙を運ぶ。読まずに食べることもある。' },
  { id: 'snail', emoji: '🧃', name: 'ジュース・ストローネ', rarity: 1, text: 'ストローが3本ささっている。全部ちがう味。' },
  { id: 'robot', emoji: '🤖', name: 'ポンコツ計算ロボ', rarity: 2, text: '計算は速いが、たまに符号をまちがえる。' },
  { id: 'sushi', emoji: '🍣', name: 'スシ・ボクサーノ', rarity: 2, text: '回転しながらパンチを出す。' },
  { id: 'banana-car', emoji: '🛺', name: 'サンリン・バクソーノ', rarity: 2, text: '三輪車でドリフトする看守。' },
  { id: 'cheese', emoji: '🧀', name: 'チーズ・ホールズ', rarity: 1, text: '穴の数をいつも数えている。' },
  { id: 'crown', emoji: '👑', name: '脱獄王', rarity: 4, text: 'ブレイン監獄を完全制覇した者だけが持つ称号。' },
  { id: 'inko', emoji: '🦜', name: 'インコ・ジショリーノ', rarity: 3, text: '辞書を丸のみしたインコ。意味は言えるがつづりはあやしい。' },
  { id: 'hachi', emoji: '🐝', name: 'ハチ・ビードウシ', rarity: 3, text: 'am・is・are の3本の針を持つ。' },
  { id: 'hebi', emoji: '🐍', name: 'ヘビ・エスエスエス', rarity: 3, text: '3人称単数を見つけると「スー」と s をつけにくる。' },
  { id: 'hitsuji', emoji: '🐑', name: 'ヒツジ・フクスウケーノ', rarity: 3, text: '何匹いても sheep。数えると眠くなる。' },
  { id: 'hamster', emoji: '🐹', name: 'ハムスター・イングリング', rarity: 3, text: '今まさに回し車を回している最中（-ing）。' },
  { id: 'fukurou', emoji: '🦉', name: 'フクロウ・フーフー', rarity: 3, text: '鳴き声は「Who? Who?」。答えには Yes と言わせない。' },
  { id: 'pastosaurus', emoji: '🦖', name: 'パストサウルス', rarity: 3, text: '大昔（過去形）の恐竜。went と ate が好物。' },
  { id: 'tako', emoji: '🐙', name: 'タコ・ジュクゴーノ', rarity: 3, text: '8本の足で熟語を8つ同時に持つ。look for と look after をよく取りちがえる。' },
  { id: 'yogen', emoji: '🧙', name: 'ヨゲン・ウィルソン', rarity: 3, text: '水晶玉で明日を占う。「will のあとは原形」が口ぐせ。' },
  { id: 'namakemono', emoji: '🦥', name: 'ナマケモノ・ワズイング', rarity: 3, text: 'そのとき何をしていたか聞くと「寝ていた（was sleeping）」としか答えない。' },
  { id: 'washi', emoji: '🦅', name: 'ワシ・マストーノ', rarity: 3, text: 'ルールに厳しいワシ。must と must not を使い分ける。' },
  { id: 'harinezumi', emoji: '🦔', name: 'ハリネズミ・ゼアリズ', rarity: 3, text: '背中の針の数を数えると There are になる。' },
  { id: 'kangaroo', emoji: '🦘', name: 'カンガルー・トゥーイング', rarity: 3, text: 'おなかの袋に to と -ing を入れて、動詞によって出し分ける。' },
  { id: 'kirin', emoji: '🦒', name: 'キリン・ハイヤーエスト', rarity: 3, text: 'だれよりも背が高い（the tallest）。比べられるのが大好き。' },
  { id: 'zou', emoji: '🐘', name: 'ゾウ・キオクーノ', rarity: 3, text: '一度覚えた単語は二度と忘れない…と言っているが、よく鼻で辞書を引いている。' },
  { id: 'kujaku', emoji: '🦚', name: 'クジャク・ミラレーノ', rarity: 3, text: 'いつも「見られている（is seen）」ことを気にしている。' },
  { id: 'kame', emoji: '🐢', name: 'カメ・ズットイーノ', rarity: 3, text: '300年前からずっとここに住んでいる（has lived）。' },
  { id: 'chameleon', emoji: '🦎', name: 'カメレオン・ブンシーノ', rarity: 3, text: '-ing になったり過去分詞になったり、体の色といっしょに変わる。' },
  { id: 'ika', emoji: '🦑', name: 'イカ・カンケーイ', rarity: 3, text: '10本の足で who と which を使い分けて、名詞と文をつなぐ。' },
  { id: 'kitsune', emoji: '🦊', name: 'キツネ・シッテルカ', rarity: 3, text: '「どこに住んでいるか知ってる？」が口ぐせ。語順にうるさい。' },
  { id: 'unicorn', emoji: '🦄', name: 'ユニコーン・イフイフ', rarity: 3, text: '「もし私が鳥なら」が口ぐせ。本当はユニコーン。' },
  { id: 'wani', emoji: '🐊', name: 'ワニ・ツナギーノ', rarity: 3, text: '2つの文を口でくわえてつなぐ。because が好物。' },
];
// ボス撃破でもらえるカード
export const BOSS_CARD = {
  'signed-numbers': 'kani', 'fractions-decimals': 'donut', expressions: 'sponge', 'linear-equations': 'bucket',
  polynomials: 'consent', simultaneous: 'hamigaki', 'expand-factor': 'kanzume', 'square-roots': 'katatsumuri', quadratic: 'kaeru',
  'en-words1': 'inko', 'en-be': 'hachi', 'en-3sg': 'hebi', 'en-plural': 'hitsuji', 'en-prog': 'hamster', 'en-wh': 'fukurou', 'en-past': 'pastosaurus',
  'en-words2': 'tako', 'en-future': 'yogen', 'en-pastprog': 'namakemono', 'en-modal': 'washi', 'en-there': 'harinezumi', 'en-inf': 'kangaroo', 'en-compare': 'kirin', 'en-conj': 'wani',
  'en-words3': 'zou', 'en-passive': 'kujaku', 'en-perfect': 'kame', 'en-participle': 'chameleon', 'en-relative': 'ika', 'en-indirect': 'kitsune', 'en-subjunctive': 'unicorn',
};
// ガチャに出るカード（ボス・称号以外）
export const GACHA_CARDS = CARDS.filter((c) => c.rarity <= 2).map((c) => c.id);

// タワー
export const TOWER_LOOK = {
  beam: { emoji: '🔫', name: 'ビーム砲', desc: '前の敵に 1/2/3 ダメージ' },
  frost: { emoji: '❄️', name: 'ひえひえ扇風機', desc: '近くの敵の足を止める（強化でダメージも）' },
  bomb: { emoji: '💣', name: 'ポップコーン爆弾', desc: '近くの敵ぜんぶに 1/1/2 ダメージ' },
};

// タワーのスキン（ガチャで出る。かけらでも交換できる）
export const SKINS = [
  { id: 'default', name: 'ノーマル', cls: 'skin-default', rarity: 0, shards: 0, emoji: '⚪' },
  { id: 'neon', name: 'ネオン', cls: 'skin-neon', rarity: 3, shards: 20, emoji: '🌈' },
  { id: 'candy', name: 'キャンディ', cls: 'skin-candy', rarity: 3, shards: 20, emoji: '🍭' },
  { id: 'pixel', name: 'ドット', cls: 'skin-pixel', rarity: 3, shards: 20, emoji: '👾' },
  { id: 'gold', name: 'ゴールド', cls: 'skin-gold', rarity: 4, shards: 40, emoji: '👑' },
  { id: 'lava', name: 'マグマ', cls: 'skin-lava', rarity: 4, shards: 40, emoji: '🌋' },
];
// ガチャの出やすさ（レア度ごと）と、ダブったときのかけら
export const GACHA_RATES = [
  { rarity: 1, weight: 52, shards: 1 },
  { rarity: 2, weight: 30, shards: 2 },
  { rarity: 3, weight: 14, shards: 5 },
  { rarity: 4, weight: 4, shards: 10 },
];

// 道具（訓練をクリアするともらえる。ウェーブ中に1回ずつ使える）
export const TOOLS = {
  coins: { emoji: '💰', name: 'へそくり', desc: 'コイン +40' },
  heal: { emoji: '🔑', name: '予備のカギ', desc: 'ライフ +1' },
  freeze: { emoji: '🧊', name: 'こおりスプレー', desc: '敵が2ターン動けない' },
  nuke: { emoji: '🧨', name: 'ハリセン爆弾', desc: '全部の敵に2ダメージ' },
  sniper: { emoji: '🎯', name: 'スナイパー', desc: '先頭の敵に5ダメージ' },
  double: { emoji: '⚡', name: 'ダブルパンチ', desc: '次の3回、正解のこうげきが2倍' },
  rewind: { emoji: '⏪', name: 'まきもどし', desc: '全部の敵を2マス戻す' },
  wall: { emoji: '🧱', name: 'バリケード', desc: '次に出口へ来た敵を2体ブロック' },
  mega: { emoji: '🛠️', name: 'メガ改造', desc: '全部のタワーを1段階強化' },
};
