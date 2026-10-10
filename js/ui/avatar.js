// プレイヤーのアイコン（アバター）: 持っているカードのキャラから選べる。わくは実績の数で増える
//   s.profile = { avatar: 'guide' | カードid, frame: わくのid }
import { h, modal } from '../core/ui.js';
import { S, save } from '../core/store.js';
import { CARDS } from '../game/content.js';
import { spriteHTML, cardSprite } from '../game/art.js';
import { achieveCount } from '../game/achieve.js';
import { sfx } from '../core/sound.js';

// わく: need = 必要な実績の数
export const FRAMES = [
  { id: 'iron', name: '鉄', need: 0 },
  { id: 'neon', name: 'ネオン', need: 1 },
  { id: 'bronze', name: '銅', need: 3 },
  { id: 'silver', name: '銀', need: 6 },
  { id: 'gold', name: '金', need: 10 },
  { id: 'rainbow', name: '虹', need: 15 },
];
const prof = (s) => (s.profile ||= { avatar: 'guide', frame: 'iron' });
const owned = (s) => CARDS.filter((c) => s.collection.cards?.[c.id]);
const faceHTML = (id) => (id === 'guide' ? spriteHTML('guide-normal', '🐶', 'チワ先輩') : cardSprite(id));

export function avatarHTML(s = S()) {
  const p = prof(s);
  const ok = p.avatar === 'guide' || s.collection.cards?.[p.avatar];
  return `<span class="ava fr-${p.frame}">${faceHTML(ok ? p.avatar : 'guide')}</span>`;
}

export async function pickAvatar() {
  const s = S();
  const p = prof(s);
  const n = achieveCount(s);
  let cur = { ...p };
  const body = h('div', { class: 'modal-body ava-pick' });
  const paint = () => {
    const faces = [{ id: 'guide', name: 'チワ先輩' }, ...owned(s)];
    body.replaceChildren(
      h('div', { class: 'ava-preview', html: `<span class="ava big fr-${cur.frame}">${faceHTML(cur.avatar)}</span>` }),
      h('b', {}, 'キャラ'),
      h('small', { class: 'note' }, 'ガチャやボスで手に入れたカードのキャラから選べる'),
      h('div', { class: 'ava-grid' }, faces.map((c) => h('button', { class: `ava-opt${cur.avatar === c.id ? ' on' : ''}`, type: 'button', 'aria-label': c.name, onclick: () => { sfx('tap'); cur.avatar = c.id; paint(); }, html: faceHTML(c.id) }))),
      h('b', {}, 'わく'),
      h('small', { class: 'note' }, `実績を達成すると増える（いま ${n} 個）`),
      h('div', { class: 'ava-frames' }, FRAMES.map((f) => {
        const open = n >= f.need;
        return h('button', { class: `fr-opt${cur.frame === f.id ? ' on' : ''}${open ? '' : ' lock'}`, type: 'button', disabled: !open, onclick: () => { sfx('tap'); cur.frame = f.id; paint(); } },
          h('span', { class: `ava fr-${f.id}`, html: faceHTML(cur.avatar) }), h('small', {}, open ? f.name : `🔒 実績${f.need}`));
      })),
    );
  };
  paint();
  const ok = await modal({ title: 'アイコンを変える', body, cls: 'ava-modal', buttons: [{ label: 'やめる', value: false }, { label: 'これにする', value: true, cls: 'primary' }] });
  if (!ok) return false;
  s.profile = cur;
  save();
  return true;
}
