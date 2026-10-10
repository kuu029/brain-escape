// 遊び方ガイド: 案内役「チワ先輩」（チワワ）が、仕組みを1つずつ説明する。topic を渡すと、そこを開いた状態で始まる
import { h } from '../core/ui.js';
import { go } from '../core/router.js';
import { sfx } from '../core/sound.js';
import { spriteHTML } from '../game/art.js';
import { topBar } from './home.js';
import { backdrop } from '../ui/deco.js';
import { PITY } from '../game/progress.js';
import { CHAL_MAX } from '../game/flowchal.js';
import { ALLY_MAX_LV } from '../game/engine.js';

// 案内役の絵（art/guide-*.png。なければ 🐶）
export const guideFace = (mood = 'normal') => spriteHTML(`guide-${mood}`, '🐶', 'チワ先輩');

export const TOPICS = [
  { id: 'start', em: '🗺️', title: 'まずはここから', mood: 'happy', say: 'ようこそブレイン監獄へ！ おいらはチワ先輩。ここに長くいるから、なんでも聞いてくれ。', items: [
    'ホームの「今日の1手」をおせば、次にやるといいことが出てくる。迷ったらそれだけでOK',
    '数学棟・英語棟・国語棟・理科棟・社会棟は「訓練 → 練習ウェーブ → ボスウェーブ」の順。ボスをたおすと次の区画が開く',
    '暗号室は、英単語・国語（漢字・ことわざなど）・社会・理科の暗記。忘れかけたころに、また出てくる',
  ] },
  { id: 'wave', em: '⚔️', title: 'ウェーブ（タワーディフェンス）', say: '問題を解くのが、そのまま攻撃になるんだ。', items: [
    '正解するとコインが入って、タワーが看守をうつ。コンボがつづくとコインがふえる',
    'まちがえると看守が1歩進む。出口まで来られると ❤️ −1。でも時間制限はないから、じっくり考えてOK',
    'まちがえた問題は「リベンジおばけ」になって、あとでまた出てくる。2回正解で成仏',
    '問題の上の線は「正解したら／まちがえたら」どうなるかの予想',
  ] },
  { id: 'tower', em: '🏗️', title: 'タワーと自動建設', say: 'タワーは3種類。組み合わせがカギだぞ。', items: [
    'ビーム: 1体を強くうつ ／ こおり: 看守をおそくする ／ ばくだん: まとめてダメージ',
    '空きマスをタップで建てる。建てたタワーをタップすると強化（最大Lv3）',
    '🏗️ 自動建設をONにすると、コインがたまったら勝手に建てて強化してくれる。「📌 予約」で、このマスにはこれ、と決めておける',
  ] },
  { id: 'ally', em: '🤝', title: 'なかま（召喚・育成）', say: 'ガチャで出たキャラは、なかまとしていっしょに戦ってくれる！', items: [
    'コレクションでキャラをタップ →「なかまにする」（2体まで）',
    'ウェーブ中、正解でゲージがたまったら、なかまをタップして召喚（チケット1枚）。チケットはダブりでふえる',
    '🏰 タワー型は置くマスをえらべる ／ 🛡️ ガード型は道をふさぐ ／ 🏃 出撃型はゴールから逆走して体当たり',
    `🧩 かけらで、なかまをレベルアップ（最大Lv${ALLY_MAX_LV}）。Lv3・Lv5 でゲージが少なくてよくなる`,
  ] },
  { id: 'tool', em: '🧰', title: '道具', say: 'ピンチのときの切り札だ。', items: [
    '単元の訓練を全部クリアすると、道具がもらえる。ウェーブに1つだけ持っていけて、1回使える',
    'へそくりは使い捨て。ウェーブに勝つと、たまにドロップする',
  ] },
  { id: 'memory', em: '🔐', title: '暗号室（暗記）', say: 'おぼえたことは、忘れかけたころにもう一度。これが最強の覚え方さ。', items: [
    '暗号ラッシュ: 新しい暗号と、復習どきの暗号がまとめて出る。毎日ちょっとずつがコツ',
    'デッキ試験: 9割できたら、そのデッキは解読完了',
    '🧭 流れでつなげる（社会・理科）: 年表や原因と結果を、つなげて覚える',
    '🛡️ 暗号ディフェンス: 暗号に答えて門を守るリアルタイム版。難易度が高いほど💎が多い',
  ] },
  { id: 'exam', em: '📝', title: '模試・タイムアタック', say: '本番の練習はここで。', items: [
    '模試は滋賀県の入試の形。点を落としたところが、復習リストになる',
    'タイムアタックは紙とペンで解いて、速さをきそう',
  ] },
  { id: 'gems', em: '💎', title: '💎の集め方・ガチャ', mood: 'happy', say: '💎は、解いた量でたまる。ゆっくりでも大丈夫！', items: [
    '今日の指令（ミッション）・2時間ごとの10分ボーナス・ウェーブの勝利・ボス撃破・実績で💎が入る',
    `ガチャは3種類。★4 が出ないまま続いても、ノーマルは${PITY.normal}回目・なかま特化は${PITY.ally}回目・スキン特化は${PITY.skin}回目で★4 確定（天井）`,
    'ログインボーナスでガチャ券がもらえる（ノーマルで使える）',
  ] },
  { id: 'chal', em: '🎲', title: '並べ替えチャレンジ', mood: 'think', say: 'これは勝負だ…！ 自信があるときにやるといい。', items: [
    '💎をかけて「流れでつなげる」を10問。正解数で倍率が決まる（10問で×3、7問で×1.5）',
    '0〜3問しか正解できないと、かけた💎は全部なくなる。とちゅうでやめても、もどらない',
    `1日${CHAL_MAX}回まで`,
  ] },
  { id: 'reward', em: '🌈', title: 'ごほうび（解除券）', say: 'がんばったら、ちゃんとごほうびだ。', items: [
    '💎で交換するか、ごほうびガチャで当てると「カラーフィルタ解除券」がもらえる',
    '使うときは、おうちの人に画面を見せてね。時間はおうちの人が測ってくれる',
  ] },
  { id: 'achieve', em: '🏆', title: '実績・称号', say: 'コツコツ続けると、バッジがどんどんたまるぞ。', items: [
    '実績は「記録」画面で見られる。達成すると💎（銅・銀・金・虹の順に多い）',
    '称号はウェーブ突破とボス撃破でポイントがたまって上がる',
    '数学のボスを全部たおすと…？',
  ] },
  { id: 'help', em: '🆘', title: 'こまったとき', mood: 'think', say: 'わからないままにしないのが、いちばん大事。', items: [
    '解説を読んでもわからない問題は「あとで聞く」✋ を押しておくと、記録画面にリストができる。あとで先生や家の人に聞こう',
    'データはこのスマホの中だけ。ときどき設定画面で💾 バックアップしておこう',
    '設定で入試の日を入れると、ホームに「入試まであと○日」が出る',
  ] },
];

export function render(el, { topic = null } = {}) {
  backdrop(el, 'desk');
  let open = topic;
  const list = h('div', { class: 'guide-list' });
  const paint = () => {
    list.replaceChildren(...TOPICS.map((t) => {
      const on = open === t.id;
      return h('section', { class: `guide-item${on ? ' on' : ''}` },
        h('button', { class: 'gi-head', type: 'button', 'aria-expanded': String(on), onclick: () => { sfx('tap'); open = on ? null : t.id; paint(); } },
          h('span', { class: 'gi-em' }, t.em), h('b', {}, t.title), h('span', { class: 'gi-arrow' }, on ? '▲' : '▼')),
        on && h('div', { class: 'gi-body' },
          h('div', { class: 'gi-say' }, h('span', { class: 'gi-face', html: guideFace(t.mood) }), h('p', { class: 'gi-bubble' }, t.say)),
          h('ul', {}, t.items.map((x) => h('li', {}, x)))));
    }));
  };
  paint();
  el.append(topBar(() => go('home')),
    h('div', { class: 'guide' },
      h('div', { class: 'gi-hero' }, h('span', { class: 'gi-face big', html: guideFace('normal') }), h('div', {}, h('h2', {}, '遊び方ガイド'), h('p', { class: 'note' }, 'チワ先輩が、なんでも教えてくれる。知りたいところをタップ！'))),
      list));
  if (topic) setTimeout(() => list.querySelector('.guide-item.on')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
}
