// 中3の単語と熟語（テーマ別）。1行 = 「英語|意味|品詞（省略時はテーマの品詞）」
// 中1・中2の単語と重ならないようにする（テストで確認）
const RAW = {
  society: { title: '社会・科学・意見', pos: 'n', list: `
society|社会
government|政府
population|人口
technology|科学技術
research|研究
result|結果
solution|解決策
effect|影響
goal|目標
rule|規則
law|法律
freedom|自由
safety|安全
disaster|災害
earthquake|地震
flood|洪水
pollution|汚染
resource|資源
electricity|電気
fuel|燃料
product|製品
company|会社
industry|産業
economy|経済
price|値段
cost|費用
market|市場
trade|貿易
tourist|観光客
citizen|市民
community|地域社会
generation|世代
wheelchair|車いす
medicine|薬
patient|患者
century|世紀
moment|瞬間
situation|状況
quality|質
amount|量
opinion|意見
topic|話題
speech|スピーチ
presentation|発表
discussion|話し合い
survey|調査
graph|グラフ
data|データ
project|事業
activity|活動
effort|努力
skill|腕前
talent|才能
ability|能力
character|性格、登場人物
` },
  verbs3: { title: '動作（動詞）3', pos: 'v', list: `
accept|受け入れる
achieve|達成する
allow|許す
appear|現れる
disappear|消える
avoid|避ける
compare|比べる
consider|よく考える
contain|含む
create|創り出す
damage|損害を与える
depend|頼る
develop|発達させる
discuss|話し合う
encourage|励ます
exist|存在する
express|表現する
focus|集中する
increase|増える
decrease|減る
influence|影響を与える
mean|意味する
mention|述べる
prefer|〜のほうを好む
produce|生産する
provide|提供する
realize|はっきりわかる
reduce|減らす
remain|残る
replace|取り替える
respect|尊敬する
support|支える
survive|生き残る
translate|翻訳する
waste|むだにする
graduate|卒業する
perform|演じる
prevent|防ぐ
recognize|見分ける
recommend|勧める
refuse|断る
regret|後悔する
rescue|救助する
spread|広がる
succeed|成功する
fail|失敗する
warn|警告する
` },
  adj3: { title: '様子・気持ち 3', pos: 'adj', list: `
active|活動的な
ancient|古代の
available|利用できる
basic|基本的な
brave|勇敢な
calm|落ち着いた
common|共通の、ふつうの
convenient|便利な
cruel|残酷な
curious|好奇心の強い
daily|毎日の
equal|平等な
familiar|よく知っている
gentle|おだやかな
global|地球規模の
huge|巨大な
independent|独立した
major|主要な
modern|現代の
negative|否定的な
positive|前向きな
polite|礼儀正しい
private|個人の
public|公共の
rare|めずらしい
recent|最近の
responsible|責任のある
rude|失礼な
similar|似ている
social|社会の
strange|奇妙な
various|いろいろな
valuable|価値のある
unique|独特の
healthy|健康な
painful|痛い
peaceful|平和な
powerful|強力な
careless|不注意な
wise|賢い
actually|実際は|adv
certainly|確かに|adv
else|ほかに|adv
forever|永遠に|adv
however|しかしながら|adv
instead|代わりに|adv
nearly|もう少しで|adv
probably|おそらく|adv
recently|最近|adv
rather|むしろ|adv
twice|2回|adv
unfortunately|不運にも|adv
ago|〜前に|adv
` },
  idiom3: { title: '熟語 3', pos: 'idiom', list: `
be known to|〜に知られている
be made of|〜でできている
be made from|〜から作られる
be covered with|〜でおおわれている
be filled with|〜で満たされている
be surprised at|〜に驚く
be pleased with|〜に喜ぶ
be worried about|〜を心配する
be full of|〜でいっぱいだ
be ready for|〜の準備ができている
be used to|〜に慣れている
as soon as|〜するとすぐに
as well as|〜と同様に
in the future|将来
in order to|〜するために
instead of|〜の代わりに
according to|〜によると
at least|少なくとも
more and more|ますます多くの
one of|〜の1つ
most of|〜のほとんど
as a result|結果として
on the other hand|一方で
by the way|ところで
in fact|実際には
for the first time|初めて
take part in|〜に参加する
make friends with|〜と友だちになる
keep in touch|連絡を取り合う
look forward to|〜を楽しみに待つ
depend on|〜しだいである
come up with|〜を思いつく
run away|逃げる
find out|見つけ出す
throw away|捨てる
put off|延期する
carry out|実行する
` },
};

export const SYN3 = [
  ['increase', 'decrease', 'reduce'], ['appear', 'disappear', 'exist'], ['succeed', 'fail', 'achieve'],
  ['be made of', 'be made from'], ['be filled with', 'be full of', 'be covered with'],
  ['actually', 'in fact'], ['however', 'on the other hand'], ['probably', 'certainly'], ['recent', 'recently', 'modern'],
  ['effect', 'influence', 'result', 'as a result'], ['skill', 'talent', 'ability'], ['positive', 'negative'], ['polite', 'rude'],
  ['public', 'private', 'social'], ['cost', 'price'], ['discuss', 'discussion'], ['gentle', 'calm'], ['wise', 'curious'],
  ['nearly', 'rather'], ['find out', 'come up with'], ['throw away', 'run away'], ['put off', 'carry out'],
];

function parse() {
  const out = [];
  for (const [theme, t] of Object.entries(RAW)) {
    for (const line of t.list.trim().split('\n')) {
      const [w, ja, pos] = line.split('|');
      out.push({ w, ja, pos: pos || t.pos, theme, grade: 3 });
    }
  }
  return out;
}
export const WORDS3 = parse();
export const THEMES3 = Object.fromEntries(Object.entries(RAW).map(([k, t]) => [k, t.title]));
