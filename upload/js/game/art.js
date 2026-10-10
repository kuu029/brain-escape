// キャラ・タワーの絵。art/ に画像があれば画像、なければ絵文字で表示する
import { ART_KEYS, BG_KEYS } from './art-manifest.js';
import { ENEMY_LOOK, BOSSES, TOWER_LOOK, CARDS } from './content.js';

const HAS = new Set(ART_KEYS);
export const hasArt = (key) => HAS.has(key);
const url = (key) => `art/${key}.png`;

// 背景・バナー（縦長の絵。art/<key>.jpg）。なければ null → CSS で描いた背景のまま
const HAS_BG = new Set(BG_KEYS || []);
export const bgUrl = (key) => (HAS_BG.has(key) ? `art/${key}.jpg` : null);

// 画像 or 絵文字の HTML（alt はスクリーンリーダー用）
export function spriteHTML(key, emoji, alt = '', cls = '') {
  if (key && HAS.has(key)) return `<img class="spr ${cls}" src="${url(key)}" alt="${alt}" draggable="false">`;
  return `<span class="spr emo ${cls}" role="img" aria-label="${alt}">${emoji}</span>`;
}

// 小さなアイコン（道具・券など）: 文字の大きさに合わせる。画像がなければ絵文字
export const iconHTML = (key, emoji, alt = '') => spriteHTML(key, emoji, alt, 'ico');

// タワー: スキン専用の絵 → 通常の絵（そのレベル以下で一番高いもの）→ 絵文字
export function towerSprite(type, lvl, skin = 'default') {
  const name = TOWER_LOOK[type].name;
  if (skin !== 'default' && HAS.has(`skin-${skin}-${type}`)) return spriteHTML(`skin-${skin}-${type}`, '', name, 'tw-img');
  for (let l = lvl; l >= 1; l--) {
    if (HAS.has(`tower-${type}-${l}`)) return spriteHTML(`tower-${type}-${l}`, '', name, `tw-img base-art lv${lvl}`);
  }
  return spriteHTML(null, TOWER_LOOK[type].emoji, name, `tw-emo lv${lvl}`);
}

export function enemyLook(kind, look) {
  if (kind === 'boss') return BOSSES[look] || ENEMY_LOOK.boss;
  return ENEMY_LOOK[kind];
}
export function enemySprite(kind, look) {
  const lk = enemyLook(kind, look);
  const key = kind === 'boss' ? `boss-${look}` : `enemy-${kind}`;
  return spriteHTML(key, lk.emoji, lk.name);
}

// カード（ボス・敵のカードは同じ絵を使う）
const CARD_ART = {
  kutsushita: 'enemy-grunt', sanma: 'enemy-runner', reizouko: 'enemy-tank', obake: 'enemy-review',
  // ガチャだけのキャラ（docs/image-prompts.md の K。画像がないあいだは絵文字）
  ...Object.fromEntries(['broccoli', 'onigiri', 'toast', 'duck', 'moai', 'pigeon', 'snail', 'robot', 'sushi', 'banana-car', 'cheese', 'crown'].map((id) => [id, `card-${id}`])),
  kani: 'boss-signed-numbers', donut: 'boss-fractions-decimals', sponge: 'boss-expressions', bucket: 'boss-linear-equations',
  consent: 'boss-polynomials', hamigaki: 'boss-simultaneous', kanzume: 'boss-expand-factor', katatsumuri: 'boss-square-roots', kaeru: 'boss-quadratic',
  inko: 'boss-en-words1', hachi: 'boss-en-be', hebi: 'boss-en-3sg', hitsuji: 'boss-en-plural', hamster: 'boss-en-prog', fukurou: 'boss-en-wh', pastosaurus: 'boss-en-past',
  tako: 'boss-en-words2', yogen: 'boss-en-future', namakemono: 'boss-en-pastprog', washi: 'boss-en-modal', harinezumi: 'boss-en-there', kangaroo: 'boss-en-inf', kirin: 'boss-en-compare', wani: 'boss-en-conj',
  zou: 'boss-en-words3', kujaku: 'boss-en-passive', kame: 'boss-en-perfect', chameleon: 'boss-en-participle', ika: 'boss-en-relative', kitsune: 'boss-en-indirect', unicorn: 'boss-en-subjunctive',
  hashigo: 'boss-proportion', coaster: 'boss-linear-function', basket: 'boss-quadratic-function', hasami: 'boss-angles', puzzle: 'boss-congruence', mezamashi: 'boss-circle-angle', matryoshka: 'boss-similarity', tent: 'boss-pythagoras', hako: 'boss-solids', coin: 'boss-probability', risu: 'boss-data', kujira: 'boss-word-mix',
  kaban: 'boss-ja-hinshi', makimono: 'boss-ja-kana', chou: 'boss-ja-katsuyou', neko: 'boss-ja-keigo', mushimegane: 'boss-ja-shikibetsu', boomerang: 'boss-ja-kaeriten', kumo: 'boss-ja-kakari',
};
export function cardSprite(id) {
  const c = CARDS.find((x) => x.id === id);
  return spriteHTML(CARD_ART[id] || `card-${id}`, c.emoji, c.name); // 表にないカードは card-<id>.png（あれば）
}
