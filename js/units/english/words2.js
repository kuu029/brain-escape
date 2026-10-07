// 中2の単語と熟語（テーマ別）。1行 = 「英語|意味|品詞（省略時はテーマの品詞）」
// 中1の単語（words1.js）と重ならないようにする（テストで確認）
const RAW = {
  people: { title: '人・くらし', pos: 'n', list: `
hobby|趣味
dream|夢
future|未来、将来
life|生活、人生
problem|問題
reason|理由
example|例
experience|経験
memory|思い出
message|伝言
information|情報
advice|助言
chance|機会
health|健康
heart|心、心臓
body|体
arm|腕
leg|脚
finger|指
tooth|歯
voice|声
gift|贈り物
meal|食事
dessert|デザート
bottle|びん
glass|コップ、ガラス
paper|紙
card|カード
map|地図
toy|おもちゃ
uniform|制服
jacket|上着
sweater|セーター
glove|手袋
pocket|ポケット
wallet|さいふ
mirror|鏡
sofa|ソファー
wall|かべ
floor|床
roof|屋根
neighbor|近所の人
guest|客
adult|大人
police|警察
firefighter|消防士
scientist|科学者
artist|芸術家
writer|作家
engineer|技術者
farmer|農家の人
chef|料理長
dentist|歯医者
pilot|パイロット
` },
  world: { title: '自然・町・社会', pos: 'n', list: `
nature|自然
environment|環境
earth|地球
forest|森
field|野原、畑
hill|丘
ocean|大洋
sand|砂
rock|岩
stone|石
air|空気
fire|火
ice|氷
cloud|雲
energy|エネルギー
plastic|プラスチック
trash|ごみ
war|戦争
peace|平和
tradition|伝統
temple|寺
shrine|神社
castle|城
airport|空港
hotel|ホテル
bank|銀行
factory|工場
office|事務所
village|村
area|地域
center|中心
side|側
corner|角
road|道路
traffic|交通
accident|事故
internet|インターネット
smartphone|スマートフォン
robot|ロボット
machine|機械
` },
  verbs2: { title: '動作（動詞）2', pos: 'v', list: `
believe|信じる
borrow|借りる
lend|貸す
choose|選ぶ
collect|集める
communicate|意思を伝え合う
decide|決める
describe|説明して描く
discover|発見する
explain|説明する
fight|戦う
follow|ついていく
happen|起こる
hurry|急ぐ
introduce|紹介する
invite|招待する
join|参加する
marry|結婚する
miss|乗りおくれる、いなくてさびしく思う
notice|気づく
order|注文する
pass|手渡す、合格する
pay|払う
pick|摘む
prepare|準備する
protect|守る
pull|引く
push|押す
raise|上げる
reach|届く
receive|受け取る
recycle|リサイクルする
relax|くつろぐ
repeat|くり返す
rest|休む
return|戻る、返す
save|救う、節約する
share|分け合う
shout|叫ぶ
solve|解く
spend|過ごす
surprise|驚かせる
travel|旅行する
wake|目を覚ます
cover|おおう
die|死ぬ
hit|打つ
hold|手に持つ、開く（会を）
hug|抱きしめる
agree|賛成する
become|〜になる
continue|続ける
cut|切る
enter|入る
hate|ひどくきらう
imagine|想像する
improve|よくする
wish|願う
taste|味がする
touch|さわる
guess|推測する
burn|燃やす
climb|登る
cross|横切る
smell|においがする
` },
  adj2: { title: '様子・気持ち 2', pos: 'adj', list: `
afraid|こわがって
alone|ひとりで
amazing|驚くほどすごい
bored|退屈した
boring|退屈な
careful|注意深い
clear|はっきりした
comfortable|快適な
crowded|混雑した
dangerous|危険な
safe|安全な
deep|深い
enough|十分な
excited|わくわくした
expensive|値段が高い
cheap|安い
fair|公平な
foreign|外国の
full|いっぱいの
empty|からっぽの
international|国際的な
local|地元の
natural|自然の
necessary|必要な
nervous|緊張した
perfect|完ぺきな
possible|可能な
impossible|不可能な
real|本物の
serious|深刻な
special|特別な
surprised|驚いた
terrible|ひどい
thirsty|のどがかわいた
traditional|伝統的な
useful|役に立つ
wild|野生の
wonderful|すてきな、すばらしい
worried|心配した
lucky|運のよい
smart|頭のよい
honest|正直な
ready|準備ができた
sure|確信して
simple|単純な
loud|（声・音が）大きい
soft|やわらかい
hard|かたい、熱心に
already|すでに|adv
almost|ほとんど|adv
especially|特に|adv
even|〜でさえ|adv
ever|今までに|adv
finally|ついに|adv
just|ちょうど|adv
later|あとで|adv
maybe|たぶん|adv
once|一度|adv
only|〜だけ|adv
quickly|すばやく|adv
slowly|ゆっくり|adv
still|まだ|adv
suddenly|突然|adv
someday|いつか|adv
abroad|外国へ|adv
everywhere|どこでも|adv
` },
  idiom: { title: '熟語', pos: 'idiom', list: `
look for|〜を探す
look at|〜を見る
look after|〜の世話をする
take care of|〜を大切にする
get up|起きる
go to bed|寝る
get to|〜に着く
listen to|〜を聞く
wait for|〜を待つ
a lot of|たくさんの
a little|少し
a few|2、3の
each other|おたがい
at once|すぐに
for example|たとえば
of course|もちろん
in front of|〜の前に
next to|〜のとなりに
far from|〜から遠い
be good at|〜が得意だ
be interested in|〜に興味がある
be famous for|〜で有名だ
be afraid of|〜をこわがる
be proud of|〜を誇りに思う
be different from|〜とちがう
be late for|〜に遅れる
be able to|〜することができる
come back|戻ってくる
come true|実現する
get home|家に着く
get on|〜に乗る
get off|〜から降りる
give up|あきらめる
grow up|成長する
hear from|〜から便りがある
laugh at|〜を笑う
put on|〜を身につける
take off|〜を脱ぐ
turn on|（明かりなど）をつける
turn off|（明かりなど）を消す
stand up|立ち上がる
sit down|すわる
pick up|拾い上げる
talk with|〜と話す
think of|〜のことを考える
all over the world|世界中で
at first|最初は
at last|ついに
all day|一日中
one day|ある日
these days|最近
on time|時間どおりに
a cup of|カップ1杯の
thanks to|〜のおかげで
such as|〜のような
because of|〜が原因で
` },
};

export const SYN2 = [
  ['amazing', 'wonderful'], ['bored', 'boring'], ['possible', 'impossible'], ['afraid', 'nervous', 'worried'],
  ['explain', 'describe', 'introduce'], ['borrow', 'lend', 'receive'], ['push', 'pull'], ['choose', 'decide'],
  ['finally', 'at last'], ['still', 'already', 'just'], ['maybe', 'sure'], ['look at', 'look for', 'look after'],
  ['look after', 'take care of'], ['get to', 'get home', 'reach'], ['get on', 'get off', 'put on', 'take off'],
  ['turn on', 'turn off'], ['stand up', 'sit down'], ['a lot of', 'a few', 'a little'], ['ocean', 'sea'],
  ['forest', 'field', 'hill'], ['rock', 'stone', 'sand'], ['temple', 'shrine', 'castle'], ['rest', 'relax'],
  ['ready', 'prepare'], ['excited', 'surprised'], ['careful', 'safe', 'dangerous'], ['travel', 'trip'],
  ['at first', 'at once', 'at last', 'one day'], ['because of', 'thanks to'], ['hard', 'difficult'],
  ['expensive', 'cheap'], ['taste', 'smell'], ['full', 'empty'], ['hate', 'like'], ['think of', 'imagine', 'believe', 'guess'],
  ['come back', 'return'], ['wake', 'get up'], ['wish', 'hope'], ['tooth', 'mouth'], ['glass', 'cup'],
];

function parse() {
  const out = [];
  for (const [theme, t] of Object.entries(RAW)) {
    for (const line of t.list.trim().split('\n')) {
      const [w, ja, pos] = line.split('|');
      out.push({ w, ja, pos: pos || t.pos, theme, grade: 2 });
    }
  }
  return out;
}
export const WORDS2 = parse();
export const THEMES2 = Object.fromEntries(Object.entries(RAW).map(([k, t]) => [k, t.title]));
