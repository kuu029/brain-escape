// コレクション: カード図鑑・ガチャ（カード＋スキン）・スキン・道具
import { h, btn, modal, toast, sleep } from '../core/ui.js';
import { S, save } from '../core/store.js';
import { CARDS, SKINS, TOOLS, BOSS_CARD, SKIN_ITEMS, TOWER_TYPES, TOWER_LOOK, SKIN_MAX_STAR, skinExchangeCost, skinStarCost } from '../game/content.js';
import { UNIT } from '../units/registry.js';
import { backdrop } from '../ui/deco.js';
import { gacha, gachaCost, GACHA_COST, GACHA5_COST, GACHA10_COST, exchangeSkin, starUpSkin, equipSkin, skinState, tickets, party, toggleParty, PARTY_MAX, equippedTool, equipTool } from '../game/progress.js';
import { SUMMON, GAUGE_NEED } from '../game/engine.js';
import { cardSprite, towerSprite, spriteHTML } from '../game/art.js';
import { go } from '../core/router.js';
import { topBar } from './home.js';
import { sfx } from '../core/sound.js';

const RARE = { 1: 'ノーマル', 2: 'レア', 3: 'スーパーレア', 4: 'レジェンド' };

function itemView(it) {
  if (it.kind === 'skin') {
    const sk = SKIN_ITEMS.find((x) => x.id === it.id);
    const star = it.star || 1;
    return {
      name: `${TOWER_LOOK[sk.type].name}のスキン「${sk.name}」`,
      html: `<span class="cell slot built ${sk.cls} sk-star-${star} prev-slot">${towerSprite(sk.type, 2, sk.design)}</span>`,
      text: it.starUp ? `★${star} に強化！ 光り方がもっと派手になった。` : 'タワーの見た目が変わる！ スキン欄で使えるよ。ダブると★が上がる。',
    };
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
        r.isNew ? h('span', { class: 'cap-new' }, 'NEW!') : r.starUp ? h('span', { class: 'cap-new' }, `★${r.star}に強化！`) : h('span', { class: 'cap-dup' }, `ダブり → 🧩+${r.shards}`));
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
        // 出たなかまキャラは、その場で「なかまにする」（コレクション画面まで行かなくていい）
        const allyIds = [...new Set(results.filter((x) => x.kind !== 'skin' && SUMMON[x.id]).map((x) => x.id))];
        if (allyIds.length) {
          const row = h('div', { class: 'cap-party' });
          const paint = () => row.replaceChildren(h('small', {}, `🤝 なかまにする（最大${PARTY_MAX}体）`), ...allyIds.map((id) => {
            const c = CARDS.find((x) => x.id === id);
            const on = party().includes(id);
            return btn(h('span', {}, h('span', { class: 'cp-face', html: cardSprite(id) }), on ? `✓ ${c.name}` : c.name), () => { toggleParty(id); sfx('build'); paint(); }, `small ${on ? 'primary' : 'ghost'}`);
          }));
          paint();
          okBtn.before(row);
        }
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
    // ボスのカードは教科ごと、それ以外は「看守・なかま」
    const bossOf = Object.fromEntries(Object.entries(BOSS_CARD).map(([unit, card]) => [card, unit]));
    const groups = [
      ['看守・なかま', CARDS.filter((c) => !bossOf[c.id])],
      ['数学のボス', CARDS.filter((c) => bossOf[c.id] && (UNIT[bossOf[c.id]]?.subject || 'math') === 'math')],
      ['英語棟のボス', CARDS.filter((c) => bossOf[c.id] && UNIT[bossOf[c.id]]?.subject === 'english')],
    ];
    const cardView = (c) => {
      const n = s.collection.cards[c.id];
      // まだ持っていないカードはシルエットで見せる（正体はお楽しみ）
      const ally = !!SUMMON[c.id];
      const inParty = party().includes(c.id);
      const open = () => modal({
        title: `${c.name}`,
        body: h('div', { class: 'modal-body center' }, h('div', { class: 'card-big', html: cardSprite(c.id) }), h('div', { class: 'stars' }, '★'.repeat(c.rarity)), h('p', {}, c.text),
          ally && h('div', { class: 'ally-info' }, h('b', {}, '🤝 なかまの技'), h('p', {}, SUMMON[c.id].desc), h('small', {}, `ウェーブ中、正解 ${GAUGE_NEED} 回でゲージ満タン → 召喚（チケット1枚）。のこり ×${tickets()[c.id] || 0}`)),
          h('small', { class: 'note' }, `所持 ${n}枚`)),
        buttons: ally ? [{ label: '閉じる', value: null }, { label: inParty ? 'なかまから外す' : `なかまにする（最大${PARTY_MAX}体）`, value: 'party', cls: 'primary' }] : undefined,
      }).then((v) => { if (v === 'party') { toggleParty(c.id); sfx('build'); go('collection', { tab: 'cards' }); } });
      return n
        ? h('button', { class: `card r${c.rarity}${inParty ? ' in-party' : ''}`, type: 'button', onclick: open },
          h('span', { class: 'c-stars' }, '★'.repeat(c.rarity)), inParty && h('span', { class: 'c-party' }, '🤝'), h('div', { class: 'c-art', html: cardSprite(c.id) }), h('div', { class: 'c-name' }, c.name), ally && h('small', { class: 'c-tix' }, `×${tickets()[c.id] || 0}`))
        : h('div', { class: `card unknown r${c.rarity}` }, h('span', { class: 'c-stars' }, '★'.repeat(c.rarity)), h('div', { class: 'c-art sil', html: cardSprite(c.id) }), h('div', { class: 'c-name' }, '？？？'));
    };
    content.append(
      h('div', { class: 'party-bar' }, h('b', {}, '🤝 なかま'), ...[0, 1].map((k) => { const id = party()[k]; const c = id && CARDS.find((x) => x.id === id); return h('span', { class: 'pb-slot' }, c ? h('span', { html: cardSprite(id) }) : '＋', c ? h('small', {}, `×${tickets()[id] || 0}`) : null); }), h('small', { class: 'pb-note' }, 'ガチャのキャラをタップ →「なかまにする」。ウェーブ中、正解でたまるゲージで召喚できる。')),
      h('div', { class: 'coll-prog' }, h('span', {}, `図鑑 ${owned} / ${CARDS.length}`), h('span', { class: 'cp-bar' }, h('i', { style: { width: `${(owned / CARDS.length) * 100}%` } })), h('b', {}, `${Math.round((owned / CARDS.length) * 100)}%`)),
      ...groups.flatMap(([name, list]) => [
        h('h3', { class: 'sec' }, `${name}（${list.filter((c) => s.collection.cards[c.id]).length}/${list.length}）`),
        h('div', { class: 'card-grid' }, list.map(cardView)),
      ]));
  } else if (tab === 'gacha') {
    const pull = async (n) => {
      const res = gacha(n);
      if (!res) return toast(`💎が足りない（あと ${gachaCost(n) - s.gems}）`);
      await gachaStage(res);
      go('collection', { tab: 'gacha' });
    };
    content.append(h('div', { class: 'gacha-box' },
      h('div', { class: 'gacha-machine', html: spriteHTML('gacha-machine', '🎰', 'ガチャマシン') }),
      h('p', {}, `💎 ${s.gems}　🧩 かけら ${shards}`),
      h('div', { class: 'gacha-btns' },
        btn(`1回 💎${GACHA_COST}`, () => pull(1), 'primary'),
        btn(`5回 💎${GACHA5_COST}`, () => pull(5), 'boss'),
        btn(`10回 💎${GACHA10_COST}（おトク）`, () => pull(10), `boss${s.gems >= GACHA10_COST ? ' ready10' : ''}`)),
      h('div', { class: 'rates' },
        h('b', {}, '出るもの'),
        h('div', {}, '★1〜2 キャラカード ／ ★3〜4 タワースキン（タワーごと）'),
        h('div', {}, 'スキンがダブると★アップ（最大★5）。キャラのダブりは 🧩かけら（★1:1 ★2:2）'),
        h('div', {}, 'かけらはスキン欄で、スキンとの交換や★アップに使える'))));
  } else if (tab === 'skins') {
    // タワーごとにスキンを選ぶ。ダブり（またはかけら）で ★1→★5
    const ts = skinState();
    const stars = (n) => '★'.repeat(n) + '☆'.repeat(SKIN_MAX_STAR - n);
    const redo = () => go('collection', { tab: 'skins' });
    content.append(h('p', { class: 'note' }, `スキンはタワーごと。同じスキンがダブると★が上がって、光り方が派手になる（最大★${SKIN_MAX_STAR}）。🧩 かけら ${shards}`),
      ...TOWER_TYPES.map((type) => h('div', { class: 'skin-group' },
        h('h3', { class: 'sec' }, `${TOWER_LOOK[type].emoji || ''} ${TOWER_LOOK[type].name}`),
        h('div', { class: 'skin-list' }, SKINS.map((sk) => {
          const itemId = `${sk.id}:${type}`;
          const it = SKIN_ITEMS.find((x) => x.id === itemId);
          const star = sk.id === 'default' ? 0 : ts.owned[itemId] || 0;
          const have = sk.id === 'default' || star > 0;
          const on = (ts.on[type] || 'default') === sk.id;
          return h('div', { class: `skin-row ${on ? 'on' : ''} r${sk.rarity}${have ? '' : ' locked'}` },
            h('span', { class: `cell slot built ${sk.cls} sk-star-${star}`, html: towerSprite(type, 2, sk.id) }),
            h('div', { class: 'sk-name' }, h('b', {}, sk.name), sk.id !== 'default' && h('small', {}, have ? stars(star) : '未入手')),
            h('div', { class: 'sk-btns' },
              on ? h('span', { class: 'm-ok' }, '使用中') : have ? btn('使う', () => { equipSkin(type, sk.id); sfx('build'); redo(); }, 'small') : null,
              it && !have && btn(`🧩${skinExchangeCost(it)}`, () => { if (exchangeSkin(itemId)) { sfx('reveal', sk.rarity); redo(); } else toast(`かけらが足りない（あと ${skinExchangeCost(it) - shards}）`); }, `small ${shards >= skinExchangeCost(it) ? 'primary' : ''}`),
              it && have && star < SKIN_MAX_STAR && btn(`★UP 🧩${skinStarCost(it, star)}`, () => { if (starUpSkin(itemId)) { sfx('reveal', Math.min(4, star + 1)); toast(`★${star + 1} に強化！`); redo(); } else toast(`かけらが足りない（あと ${skinStarCost(it, star) - shards}）`); }, 'small ghost')));
        })))));
  } else {
    // ウェーブに持っていけるのは1つだけ。タップでえらぶ
    const on = equippedTool();
    content.append(h('p', { class: 'note' }, '単元の訓練を全部クリアすると1つずつもらえる。ウェーブに持っていけるのは 1つだけ（1回使える）。タップでえらぼう。'),
      h('div', { class: 'tool-list' }, Object.entries(TOOLS).map(([id, t]) => {
        const have = s.tools.includes(id);
        return h(have ? 'button' : 'div', { class: `tool-row ${have ? '' : 'locked'}${on === id ? ' on' : ''}`, ...(have ? { type: 'button', onclick: () => { equipTool(id); sfx('build'); go('collection', { tab: 'tools' }); } } : {}) },
          h('span', { class: 'c-em' }, have ? t.emoji : '🔒'), h('div', {}, h('b', {}, t.name), h('small', {}, t.desc)),
          on === id && h('span', { class: 'm-ok tr-on' }, '🎒 持っていく'));
      })));
  }
  backdrop(el, 'cell');
  el.append(topBar(() => go('home')),
    h('div', { class: 'tabs' }, tabs.map(([id, label]) => h('button', { class: `tab ${id === tab ? 'on' : ''}`, type: 'button', onclick: () => go('collection', { tab: id }) }, label))),
    content);
}
