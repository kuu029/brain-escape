// キャラ・タワーの絵。art/ に画像があれば画像、なければ絵文字で表示する
import { ART_KEYS } from './art-manifest.js';
import { ENEMY_LOOK, BOSSES, TOWER_LOOK, CARDS } from './content.js';

const HAS = new Set(ART_KEYS);
export const hasArt = (key) => HAS.has(key);
const url = (key) => `art/${key}.png`;

// 画像 or 絵文字の HTML（alt はスクリーンリーダー用）
export function spriteHTML(key, emoji, alt = '', cls = '') {
  if (key && HAS.has(key)) return `<img class="spr ${cls}" src="${url(key)}" alt="${alt}" draggable="false">`;
  return `<span class="spr emo ${cls}" role="img" aria-label="${alt}">${emoji}</span>`;
}

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
  kani: 'boss-signed-numbers', donut: 'boss-fractions-decimals', sponge: 'boss-expressions', bucket: 'boss-linear-equations',
  consent: 'boss-polynomials', hamigaki: 'boss-simultaneous', kanzume: 'boss-expand-factor', katatsumuri: 'boss-square-roots', kaeru: 'boss-quadratic',
};
export function cardSprite(id) {
  const c = CARDS.find((x) => x.id === id);
  return spriteHTML(CARD_ART[id], c.emoji, c.name);
}
