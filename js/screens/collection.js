// コレクション: カード図鑑・ガチャ・タワースキン・道具
import { h, btn, modal, toast } from '../core/ui.js';
import { S, save } from '../core/store.js';
import { CARDS, SKINS, TOOLS, TOWER_LOOK } from '../game/content.js';
import { gacha, GACHA_COST, buySkin } from '../game/progress.js';
import { go } from '../core/router.js';
import { topBar } from './home.js';
import { sfx } from '../core/sound.js';

export function render(el, { tab = 'cards' } = {}) {
  const s = S();
  const tabs = [['cards', '🃏 カード'], ['gacha', '🎰 ガチャ'], ['skins', '🎨 スキン'], ['tools', '🧰 道具']];
  const owned = Object.keys(s.collection.cards).length;
  const content = h('div', { class: 'coll' });
  if (tab === 'cards') {
    content.append(h('p', { class: 'note' }, `集めたカード ${owned} / ${CARDS.length}`),
      h('div', { class: 'card-grid' }, CARDS.map((c) => {
        const n = s.collection.cards[c.id];
        return n
          ? h('button', { class: `card r${c.rarity}`, type: 'button', onclick: () => modal({ title: `${c.emoji} ${c.name}`, body: `${'★'.repeat(c.rarity)}<br>${c.text}<br><small>所持 ${n}枚</small>` }) },
            h('div', { class: 'c-em' }, c.emoji), h('div', { class: 'c-name' }, c.name))
          : h('div', { class: 'card unknown' }, h('div', { class: 'c-em' }, '❓'), h('div', { class: 'c-name' }, '？？？'));
      })));
  } else if (tab === 'gacha') {
    content.append(h('div', { class: 'center-col' },
      h('div', { class: 'big-em' }, '🎰'),
      h('p', {}, `💎${GACHA_COST} で1回。ダブったら 💎5 返ってくる。`),
      h('p', { class: 'note' }, 'ボスカードはボスを倒した人だけがもらえる。'),
      btn(`回す（💎${s.gems}）`, async () => {
        const r = gacha();
        if (!r) return toast(`💎が足りない（あと ${GACHA_COST - s.gems}）`);
        sfx('gacha');
        const c = CARDS.find((x) => x.id === r.id);
        await modal({ title: r.isNew ? '🆕 NEW！' : 'ダブり（💎5 返却）', body: `<div class="big-em">${c.emoji}</div><b>${c.name}</b><br>${c.text}` });
        go('collection', { tab: 'gacha' });
      }, 'primary big')));
  } else if (tab === 'skins') {
    content.append(h('p', { class: 'note' }, 'タワーの見た目を変えられる。'),
      h('div', { class: 'skin-list' }, SKINS.map((sk) => {
        const have = s.collection.skins.includes(sk.id);
        const on = s.collection.skin === sk.id;
        return h('div', { class: `skin-row ${on ? 'on' : ''}` },
          h('span', { class: `cell slot built ${sk.cls}` }, h('span', { class: 'tw' }, TOWER_LOOK.beam.emoji)),
          h('span', { class: 'sk-name' }, sk.name),
          on ? h('span', { class: 'm-ok' }, '使用中')
            : have ? btn('使う', () => { s.collection.skin = sk.id; save(); go('collection', { tab: 'skins' }); }, 'small')
              : btn(`💎${sk.cost}`, () => { if (buySkin(sk.id)) { sfx('coin'); go('collection', { tab: 'skins' }); } else toast('💎が足りない'); }, 'small primary'));
      })));
  } else {
    content.append(h('p', { class: 'note' }, '単元の訓練を全部クリアすると1つずつもらえる。ウェーブ中に各1回使える。'),
      h('div', { class: 'tool-list' }, Object.entries(TOOLS).map(([id, t]) => h('div', { class: `tool-row ${s.tools.includes(id) ? '' : 'locked'}` },
        h('span', { class: 'c-em' }, s.tools.includes(id) ? t.emoji : '🔒'), h('div', {}, h('b', {}, t.name), h('small', {}, t.desc))))));
  }
  el.append(topBar(() => go('home')),
    h('div', { class: 'tabs' }, tabs.map(([id, label]) => h('button', { class: `tab ${id === tab ? 'on' : ''}`, type: 'button', onclick: () => go('collection', { tab: id }) }, label))),
    content);
}
