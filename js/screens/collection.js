// コレクション: カード図鑑・ガチャ（カード＋スキン）・スキン・道具
import { h, btn, modal, toast, sleep } from '../core/ui.js';
import { S, save } from '../core/store.js';
import { CARDS, SKINS, TOOLS } from '../game/content.js';
import { gacha, GACHA_COST, GACHA5_COST, exchangeSkin } from '../game/progress.js';
import { cardSprite, towerSprite, spriteHTML } from '../game/art.js';
import { go } from '../core/router.js';
import { topBar } from './home.js';
import { sfx } from '../core/sound.js';

const RARE = { 1: 'ノーマル', 2: 'レア', 3: 'スーパーレア', 4: 'レジェンド' };

function itemView(it) {
  if (it.kind === 'skin') {
    const sk = SKINS.find((x) => x.id === it.id);
    return { name: `スキン「${sk.name}」`, html: `<span class="cell slot built ${sk.cls} prev-slot">${towerSprite('beam', 2, sk.id)}</span>`, text: 'タワーの見た目が変わる！ スキン欄で使えるよ。' };
  }
  const c = CARDS.find((x) => x.id === it.id);
  return { name: c.name, html: cardSprite(c.id), text: c.text };
}

// カプセルを開ける演出（全画面）
function gachaStage(results) {
  return new Promise((resolve) => {
    const best = Math.max(...results.map((r) => r.rarity));
    const caps = results.map((r, i) => {
      const cap = h('button', { class: `capsule r${r.rarity} tease${best >= 3 && r.rarity === best ? ' glowy' : ''}`, type: 'button', style: { animationDelay: `${i * 0.08}s` }, onclick: () => open(i) },
        h('span', { class: 'cap-top' }), h('span', { class: 'cap-bottom' }), h('span', { class: 'cap-q' }, '？'));
      return { r, cap, opened: false };
    });
    const grid = h('div', { class: `cap-grid n${results.length}` }, caps.map((c) => c.cap));
    const msg = h('p', { class: 'cap-msg' }, results.length > 1 ? 'カプセルをタップ！' : 'タップしてあける！');
    const allBtn = results.length > 1 ? btn('ぜんぶあける', async () => { for (let i = 0; i < caps.length; i++) { if (!caps[i].opened) { open(i); await sleep(260); } } }, 'ghost small') : null;
    const okBtn = btn('OK', () => { stage.remove(); resolve(); }, 'primary big hidden');
    const stage = h('div', { class: 'gacha-stage' }, h('div', { class: 'gs-rays' }), grid, msg, allBtn, okBtn);
    document.body.append(stage);
    sfx('rattle');

    function open(i) {
      const c = caps[i];
      if (c.opened) return;
      c.opened = true;
      const { r, cap } = c;
      const v = itemView(r);
      sfx('reveal', r.rarity);
      cap.classList.remove('tease');
      cap.classList.add('open');
      cap.innerHTML = '';
      cap.append(
        h('span', { class: 'cap-light' }),
        h('span', { class: 'cap-item', html: v.html }),
        h('span', { class: 'cap-stars' }, `${'★'.repeat(r.rarity)} ${RARE[r.rarity]}`),
        h('span', { class: 'cap-name' }, v.name),
        r.isNew ? h('span', { class: 'cap-new' }, 'NEW!') : h('span', { class: 'cap-dup' }, `ダブり → 🧩+${r.shards}`));
      for (let k = 0; k < 10; k++) {
        const p = h('span', { class: 'cap-spark' }, r.rarity >= 3 ? '✨' : '⭐');
        const ang = (Math.PI * 2 * k) / 10;
        p.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(ang) * 70}px), calc(-50% + ${Math.sin(ang) * 70}px)) scale(1)`, opacity: 0 }], { duration: 650, easing: 'ease-out' }).finished.then(() => p.remove());
        cap.append(p);
      }
      if (r.rarity >= 3) stage.classList.add(`flash-r${r.rarity}`);
      if (results.length === 1) msg.textContent = v.text;
      if (caps.every((x) => x.opened)) {
        msg.textContent = results.length > 1 ? 'ぜんぶあけた！' : v.text;
        allBtn?.remove();
        okBtn.classList.remove('hidden');
      }
    }
  });
}

export function render(el, { tab = 'cards' } = {}) {
  const s = S();
  const tabs = [['cards', '🃏 カード'], ['gacha', '🎰 ガチャ'], ['skins', '🎨 スキン'], ['tools', '🧰 道具']];
  const owned = Object.keys(s.collection.cards).length;
  const shards = s.collection.shards || 0;
  const content = h('div', { class: 'coll' });
  if (tab === 'cards') {
    content.append(h('p', { class: 'note' }, `集めたカード ${owned} / ${CARDS.length}`),
      h('div', { class: 'card-grid' }, CARDS.map((c) => {
        const n = s.collection.cards[c.id];
        return n
          ? h('button', { class: `card r${c.rarity}`, type: 'button', onclick: () => modal({ title: `${c.name}`, body: h('div', { class: 'modal-body center' }, h('div', { class: 'card-big', html: cardSprite(c.id) }), h('div', { class: 'stars' }, '★'.repeat(c.rarity)), h('p', {}, c.text), h('small', { class: 'note' }, `所持 ${n}枚`)) }) },
            h('div', { class: 'c-art', html: cardSprite(c.id) }), h('div', { class: 'c-name' }, c.name))
          : h('div', { class: 'card unknown' }, h('div', { class: 'c-art' }, '❓'), h('div', { class: 'c-name' }, '？？？'));
      })));
  } else if (tab === 'gacha') {
    const pull = async (n) => {
      const res = gacha(n);
      if (!res) return toast(`💎が足りない（あと ${(n === 5 ? GACHA5_COST : GACHA_COST) - s.gems}）`);
      await gachaStage(res);
      go('collection', { tab: 'gacha' });
    };
    content.append(h('div', { class: 'gacha-box' },
      h('div', { class: 'gacha-machine', html: spriteHTML('gacha-machine', '🎰', 'ガチャマシン') }),
      h('p', {}, `💎 ${s.gems}　🧩 かけら ${shards}`),
      h('div', { class: 'gacha-btns' },
        btn(`1回 💎${GACHA_COST}`, () => pull(1), 'primary'),
        btn(`5回 💎${GACHA5_COST}`, () => pull(5), 'boss')),
      h('div', { class: 'rates' },
        h('b', {}, '出るもの'),
        h('div', {}, '★1〜2 キャラカード ／ ★3〜4 タワースキン'),
        h('div', {}, 'ダブったら 🧩かけら（★1:1 ★2:2 ★3:5 ★4:10）'),
        h('div', {}, 'かけらはスキン欄で好きなスキンと交換できる'))));
  } else if (tab === 'skins') {
    content.append(h('p', { class: 'note' }, `タワーの見た目を変えられる。🧩 かけら ${shards}`),
      h('div', { class: 'skin-list' }, SKINS.map((sk) => {
        const have = s.collection.skins.includes(sk.id);
        const on = s.collection.skin === sk.id;
        return h('div', { class: `skin-row ${on ? 'on' : ''} r${sk.rarity}` },
          h('div', { class: 'skin-prev' }, ['beam', 'frost', 'bomb'].map((t) => h('span', { class: `cell slot built ${sk.cls}`, html: towerSprite(t, 2, sk.id) }))),
          h('div', { class: 'sk-name' }, h('b', {}, sk.name), h('small', {}, sk.rarity ? '★'.repeat(sk.rarity) : '')),
          on ? h('span', { class: 'm-ok' }, '使用中')
            : have ? btn('使う', () => { s.collection.skin = sk.id; save(); sfx('build'); go('collection', { tab: 'skins' }); }, 'small')
              : btn(`🧩${sk.shards}`, () => { if (exchangeSkin(sk.id)) { sfx('reveal', sk.rarity); go('collection', { tab: 'skins' }); } else toast(`かけらが足りない（あと ${sk.shards - shards}）`); }, `small ${shards >= sk.shards ? 'primary' : ''}`));
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
