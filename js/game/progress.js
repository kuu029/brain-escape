// 進行と報酬（ロック判定・ウェーブ終了時の報酬・ガチャ）
import { S, unitState, cleared, save, saveNow, today, dayDiff } from '../core/store.js';
import { UNIT, GEN, SUBJECTS, unitsOf } from '../units/registry.js';
import { BOSS_CARD, BOSS_CARD_IDS, GACHA_CARDS, SKINS, CARDS, GACHA_RATES, TOWER_TYPES, SKIN_ITEMS, SKIN_MAX_STAR, skinExchangeCost, skinStarCost } from './content.js';
import { bump } from './missions.js';
import { setAllyLevelSource, setGaugeBonus, ALLY_MAX_LV } from './engine.js';
import { isEvent } from './event.js';
import { claimActivity } from './bonus.js';

export function isUnlocked(id) {
  const u = UNIT[id];
  if (!u || u.comingSoon) return false;
  return (u.prereqs || []).every((p) => cleared(p));
}
// 次に挑む単元（下の段階から順に、開いていてまだ突破していない最初のもの）
export function nextUnit(subject) {
  const stages = SUBJECTS[subject].stages.map((x) => x.n);
  const list = unitsOf(subject).slice().sort((a, b) => stages.indexOf(a.stage) - stages.indexOf(b.stage));
  return list.find((u) => isUnlocked(u.id) && !cleared(u.id)) || null;
}
export const missingPrereqs = (id) => (UNIT[id].prereqs || []).filter((p) => !cleared(p));

// 練習ウェーブに入れるか（最初の訓練が1つ以上終わっている、または診断で合格）
export function canPractice(id) {
  const us = unitState(id);
  return Object.keys(us.lessons).length > 0 || us.diagPassed;
}
export function canBoss(id) {
  const us = unitState(id);
  return (us.trainingDone || us.diagPassed) && us.practiced > 0;
}

// 復習キューから、このウェーブに出す問題を選ぶ（同じ単元を優先・同じ教科だけ）
export function pickReviews(unitId, n, subject = UNIT[unitId]?.subject || 'math') {
  const q = S().reviewQueue.filter((r) => GEN[r.generatorId] && UNIT[r.unit]?.subject === subject);
  const same = unitId ? q.filter((r) => r.unit === unitId) : [];
  const other = q.filter((r) => r.unit !== unitId && (isUnlocked(r.unit) || cleared(r.unit)));
  return [...same, ...other].slice(0, n).map((r) => ({ generatorId: r.generatorId, seed: r.seed }));
}

export function addCard(id) {
  const t = tickets(); // 先に作っておく（はじめてのとき、いまの枚数からチケットを作るので）
  const c = S().collection.cards;
  const isNew = !c[id];
  c[id] = (c[id] || 0) + 1;
  // なかまにできるキャラ（ガチャ・ボス）は「召喚チケット」も1枚ふえる（なかまとして呼ぶと1枚へる）
  if (isAlly(id)) t[id] = (t[id] || 0) + 1;
  return isNew;
}
// なかまにできるカード: ガチャのキャラ＋ボスカード
export const isAlly = (id) => GACHA_CARDS.includes(id) || BOSS_CARD_IDS.includes(id);

// ---------- なかま（ガチャのキャラを召喚） ----------
// collection.tickets = { id: 枚数 }、collection.party = [id, id]（ウェーブに連れていく2体）
export const PARTY_MAX = 2;
export function tickets() {
  const c = S().collection;
  // はじめて使うとき: いま持っているキャラの枚数を、そのままチケットにする
  if (!c.tickets) c.tickets = Object.fromEntries(GACHA_CARDS.filter((id) => c.cards[id]).map((id) => [id, c.cards[id]]));
  // ボスカードがなかまになる前から持っていた分も、1回だけチケットにする
  if (!c.bossTix) { for (const id of BOSS_CARD_IDS) if (c.cards[id] && c.tickets[id] === undefined) c.tickets[id] = c.cards[id]; c.bossTix = true; }
  return c.tickets;
}
export function party() {
  const c = S().collection;
  c.party = (c.party || []).filter((id) => c.cards[id]);
  return c.party;
}
// なかまに入れる / はずす。いっぱいなら一番古いなかまと入れかえ
export function toggleParty(id) {
  const p = party();
  const i = p.indexOf(id);
  if (i >= 0) p.splice(i, 1);
  else if (S().collection.cards[id] && isAlly(id)) { p.push(id); if (p.length > PARTY_MAX) p.shift(); }
  save();
  return p.includes(id);
}
export function useTicket(id) {
  const t = tickets();
  if (!(t[id] > 0)) return false;
  t[id]--;
  save();
  return true;
}

// ウェーブ終了。戻り値は結果画面に渡す
export function finishWave({ mode, unitId, st, asked, firstCorrect, wrongList }) {
  const s = S();
  const win = st.over === 'win';
  const out = { mode, unitId, win, asked, firstCorrect, wrongList, gems: 0, cards: [], opened: [], leaks: st.leaks, maxCombo: st.maxCombo };
  let gems = firstCorrect * 2 + (win ? 10 : 3);
  if (unitId && mode !== 'review') unitState(unitId).practiced++;
  s.stats.bestCombo = Math.max(s.stats.bestCombo, st.maxCombo);
  bump('combo', st.maxCombo);
  bump('reviewKills', st.reviewKills);
  bump('built', st.built);
  out.drops = win ? rollDrops(mode === 'boss') : [];
  if (win) {
    s.stats.waves++;
    bump('waves');
    if (st.leaks === 0) bump('perfect');
    if (mode === 'boss') {
      const before = Object.keys(UNIT).filter((id) => isUnlocked(id));
      const us = unitState(unitId);
      const first = !us.bossCleared;
      us.bossCleared = true;
      s.stats.bosses++;
      gems += (first ? 40 : 15) * (isEvent('bossrush') ? 3 : 1); // 週末イベント「ボスラッシュ」は3倍
      if (BOSS_CARD[unitId] && addCard(BOSS_CARD[unitId])) out.cards.push(BOSS_CARD[unitId]);
      out.opened = Object.keys(UNIT).filter((id) => isUnlocked(id) && !before.includes(id));
      // 脱獄王: 数学の全ボス撃破
      const mathBoss = Object.entries(BOSS_CARD).filter(([u]) => UNIT[u]?.subject === 'math').map(([, c]) => c);
      if (mathBoss.every((c) => s.collection.cards[c]) && addCard('crown')) out.cards.push('crown');
    } else {
      // 練習・リベンジのウェーブも、勝てば少し💎（解くのがゆっくりでも、ちゃんとたまるように）
      if (mode !== 'diagnosis') gems += WAVE_GEMS * (isEvent('gemfever') ? 2 : 1); // 「💎フィーバー」は2倍
      if (unitId && BOSS_CARD[unitId] && unitState(unitId).bossCleared && Math.random() < BOSS_DROP * (isEvent('bossrush') ? 3 : 1)) {
        // レアドロップ: ボスを倒したことのある単元の練習で、まれにボスカード（召喚チケット +1）
        addCard(BOSS_CARD[unitId]);
        out.drops.push(`card:${BOSS_CARD[unitId]}`);
      } else if (Math.random() < 0.35) {
        const id = GACHA_CARDS[Math.floor(Math.random() * GACHA_CARDS.length)];
        if (addCard(id)) out.cards.push(id);
        else gems += 3;
      }
    }
  }
  s.gems += gems;
  out.gems = gems;
  out.bonus = claimActivity('wave');
  saveNow();
  return out;
}

// ---------- ガチャ（カード＋スキン。ダブりはかけらに）----------
// 値段（2026-10 に見直し: 解くのがゆっくりでも、1日に何回かは回せるように少し安く）
export const GACHA_COST = 25;
export const GACHA5_COST = 115;
export const GACHA10_COST = 225;
export const WAVE_GEMS = 6; // 練習・リベンジのウェーブに勝ったとき
// ガチャの種類: ノーマル（カード＋スキン）／スキン特化（★3・★4 スキンだけ・高い）／なかま特化（★2〜★4 のなかまだけ・高い）
export const GACHA_TYPES = {
  normal: { name: 'ノーマル', emoji: '🎰', cost: { 1: GACHA_COST, 5: GACHA5_COST, 10: GACHA10_COST }, rates: GACHA_RATES, cards: true, skins: true, desc: 'キャラもスキンも出る。ガチャ券が使える' },
  skin: { name: 'スキン特化', emoji: '🎨', cost: { 1: 50, 10: 450 }, rates: [{ rarity: 3, weight: 72, shards: 5 }, { rarity: 4, weight: 28, shards: 10 }], cards: false, skins: true, desc: '★3・★4 のタワースキンだけ！' },
  ally: { name: 'なかま特化', emoji: '🤝', cost: { 1: 70, 10: 630 }, rates: [{ rarity: 2, weight: 52, shards: 2 }, { rarity: 3, weight: 36, shards: 5 }, { rarity: 4, weight: 12, shards: 10 }], cards: true, skins: false, desc: '★2〜★4 のなかまだけ！ 高レアが出やすい' },
};
const baseCost = (n, type) => GACHA_TYPES[type].cost[n] ?? (n === 10 ? GACHA10_COST : n === 5 ? GACHA5_COST : GACHA_COST * n);
// 週末イベント「ガチャ祭り」は2割引き
export const gachaCost = (n, type = 'normal') => (isEvent('gachafes') ? Math.round(baseCost(n, type) * 0.8) : baseCost(n, type));
// ---------- なかまの育成 ----------
// collection.allyLv = { id: レベル }。🧩かけらでレベルアップ（Lv1→5）
export const ALLY_UP_COST = [0, 5, 10, 18, 30]; // いまの Lv → 次へ（Lv1→2 は 5 かけら）
export const allyLv = (id) => S().collection.allyLv?.[id] || 1;
export const allyUpCost = (id) => (allyLv(id) >= ALLY_MAX_LV ? null : ALLY_UP_COST[allyLv(id)]);
export function levelUpAlly(id) {
  const c = S().collection;
  const cost = allyUpCost(id);
  if (cost === null || !c.cards[id] || (c.shards || 0) < cost) return false;
  c.shards -= cost;
  (c.allyLv ||= {})[id] = allyLv(id) + 1;
  saveNow();
  return true;
}
setAllyLevelSource((id) => (S() ? allyLv(id) : 1));
setGaugeBonus(() => (isEvent('allyfes') ? 1 : 0)); // 週末イベント「なかま祭り」

// 天井: その種類で★4 が出ないまま、この回数目になったら★4 確定（★4 が出たら数えなおし）
export const PITY = { normal: 50, skin: 10, ally: 30 };
export const pityLeft = (type = 'normal') => PITY[type] - ((S().collection.pity || {})[type] || 0);
function rollOne(rand = Math.random, type = 'normal', force = 0) {
  const T = GACHA_TYPES[type];
  // その種類で出るものがない段は、くじから外す
  const poolOf = (rarity) => [
    ...(T.cards ? CARDS.filter((c) => GACHA_CARDS.includes(c.id) && c.rarity === rarity).map((c) => ({ kind: 'card', id: c.id })) : []),
    ...(T.skins ? SKIN_ITEMS.filter((sk) => sk.rarity === rarity).map((sk) => ({ kind: 'skin', id: sk.id })) : []),
  ];
  const rates = T.rates.filter((r) => poolOf(r.rarity).length && (!force || r.rarity === force));
  const total = rates.reduce((a, r) => a + r.weight, 0);
  let x = rand() * total;
  const tier = rates.find((r) => (x -= r.weight) < 0) || rates[0];
  const pool = poolOf(tier.rarity);
  const item = pool[Math.floor(rand() * pool.length)];
  return { ...item, rarity: tier.rarity, dupShards: tier.shards };
}
// ---------- ログインボーナス（ガチャ券） ----------
// その日はじめてホームを開くと、ガチャ券（1枚 = ガチャ1回）がもらえる。
// 連続ログインの日数で7日周期のカレンダー: 1・1・2・1・1・2・5枚（7日目は5枚 = 5連ぶん）。1日あいたら1日目にもどる
// collection.gachaTickets = 枚数、login = { last: 'YYYY-MM-DD', count: 連続日数 }
export const LOGIN_CAL = [1, 1, 2, 1, 1, 2, 5];
export const gachaTickets = () => S().collection.gachaTickets || 0;
export function claimLogin(d = today()) {
  const s = S();
  const L = (s.login ||= { last: null, count: 0 });
  if (L.last === d) return null;
  L.count = L.last && dayDiff(L.last, d) === 1 ? L.count + 1 : 1;
  L.last = d;
  const day = ((L.count - 1) % LOGIN_CAL.length) + 1;
  const got = LOGIN_CAL[day - 1];
  s.collection.gachaTickets = gachaTickets() + got;
  saveNow();
  return { day, got, count: L.count, total: s.collection.gachaTickets, next: LOGIN_CAL[day % LOGIN_CAL.length] };
}

// n 回まわす。戻り値: [{ kind, id, rarity, isNew, shards }]（宝石・券が足りなければ null）
// ticket: true なら💎のかわりにガチャ券を n 枚使う（ノーマルだけ）。type: GACHA_TYPES のキー
export function gacha(n = 1, { ticket = false, type = 'normal' } = {}) {
  const s = S();
  if (ticket) {
    if (type !== 'normal' || gachaTickets() < n) return null;
    s.collection.gachaTickets -= n;
  } else {
    const cost = gachaCost(n, type);
    if (s.gems < cost) return null;
    s.gems -= cost;
  }
  const out = [];
  const P = (s.collection.pity ||= {});
  for (let i = 0; i < n; i++) {
    const r = rollOne(Math.random, type, (P[type] || 0) >= PITY[type] - 1 ? 4 : 0);
    P[type] = r.rarity >= 4 ? 0 : (P[type] || 0) + 1;
    s.collection.pulls = (s.collection.pulls || 0) + 1;
    let isNew;
    if (r.kind === 'card') isNew = addCard(r.id);
    let star = 0;
    if (r.kind === 'skin') {
      // 持っていなければ ★1。持っていれば ★+1（★5 のあとはかけら）
      const ts = skinState().owned;
      isNew = !ts[r.id];
      star = Math.min(SKIN_MAX_STAR, (ts[r.id] || 0) + 1);
      const up = !isNew && star > ts[r.id];
      ts[r.id] = star;
      if (up) { out.push({ kind: 'skin', id: r.id, rarity: r.rarity, isNew: false, starUp: true, star, shards: 0 }); continue; }
    }
    const shards = isNew ? 0 : r.dupShards;
    s.collection.shards = (s.collection.shards || 0) + shards;
    out.push({ kind: r.kind, id: r.id, rarity: r.rarity, isNew, shards, star });
  }
  saveNow();
  return out;
}
// ---------- タワーごとのスキン ----------
// collection.tskins = { owned: { 'neon:beam': ★ }, on: { beam: 'neon', frost: 'default', bomb: 'default' } }
// 前の形（collection.skins = 3タワー共通）からは、持っていたスキンを3タワーとも ★1 で引きつぐ
export function skinState() {
  const c = S().collection;
  if (!c.tskins) {
    const owned = {};
    for (const id of c.skins || []) if (id !== 'default') for (const t of TOWER_TYPES) owned[`${id}:${t}`] = 1;
    const on = Object.fromEntries(TOWER_TYPES.map((t) => [t, c.skin && owned[`${c.skin}:${t}`] ? c.skin : 'default']));
    c.tskins = { owned, on };
  }
  return c.tskins;
}
// そのタワーにいま付けているスキン: { id（デザイン）, cls, star }
export function towerSkin(type) {
  const ts = skinState();
  const id = ts.on[type] || 'default';
  const sk = SKINS.find((x) => x.id === id) || SKINS[0];
  return { id, cls: sk.cls, star: id === 'default' ? 0 : ts.owned[`${id}:${type}`] || 1 };
}
export function equipSkin(type, design) {
  const ts = skinState();
  if (design !== 'default' && !ts.owned[`${design}:${type}`]) return false;
  ts.on[type] = design;
  save();
  return true;
}
// かけらで、持っていないスキンと交換
export function exchangeSkin(itemId) {
  const s = S();
  const it = SKIN_ITEMS.find((x) => x.id === itemId);
  const ts = skinState();
  if (!it || ts.owned[itemId] || (s.collection.shards || 0) < skinExchangeCost(it)) return false;
  s.collection.shards -= skinExchangeCost(it);
  ts.owned[itemId] = 1;
  ts.on[it.type] = it.design;
  save();
  return true;
}
// かけらで ★ を1つ上げる
export function starUpSkin(itemId) {
  const s = S();
  const it = SKIN_ITEMS.find((x) => x.id === itemId);
  const ts = skinState();
  const star = ts.owned[itemId] || 0;
  if (!it || !star || star >= SKIN_MAX_STAR || (s.collection.shards || 0) < skinStarCost(it, star)) return false;
  s.collection.shards -= skinStarCost(it, star);
  ts.owned[itemId] = star + 1;
  save();
  return true;
}
export const _rollOne = rollOne; // テスト用

// ---------- 使い捨ての道具（へそくり）----------
// へそくり（コイン +40）は強すぎるので、使うたびに1枚へる。訓練で2枚、ウェーブ勝利でたまにドロップ
// collection.toolStock = { coins: 枚数 }。前のデータで持っていた人には2枚くばる
export const CONSUMABLE = { coins: true };
export const COINS_GRANT = 2;
export function toolStock() {
  const s = S();
  const c = s.collection;
  if (!c.toolStock) c.toolStock = { coins: s.tools.includes('coins') ? COINS_GRANT : 0 };
  return c.toolStock;
}
export const usable = (id) => !CONSUMABLE[id] || (toolStock()[id] || 0) > 0;
export function useConsumable(id) {
  if (!CONSUMABLE[id]) return;
  const st = toolStock();
  st[id] = Math.max(0, (st[id] || 0) - 1);
  save();
}

// 訓練で道具をもらう
export function grantTool(unitId) {
  const t = UNIT[unitId]?.tool;
  const s = S();
  if (!t || s.tools.includes(t)) return null;
  toolStock();
  s.tools.push(t);
  if (CONSUMABLE[t]) toolStock()[t] = (toolStock()[t] || 0) + COINS_GRANT;
  if (!s.toolOn) s.toolOn = t;
  save();
  return t;
}
// ウェーブに持っていける道具は1つだけ（コレクションの「道具」でえらぶ）。えらんでいなければ最後にもらった道具
// 使い捨ての道具が0枚なら持っていけない（ほかの道具にかわる）
export const TOOL_MAX = 1;
export function equippedTool() {
  const s = S();
  const ok = s.tools.filter(usable);
  if (!ok.length) return null;
  return ok.includes(s.toolOn) ? s.toolOn : ok[ok.length - 1];
}

// ウェーブ勝利のドロップ（たまに）: へそくり・ガチャ券。ボス撃破は券が出やすい
export const DROP = { coins: 0.12, ticket: 0.06, bossTicket: 0.3 };
export const BOSS_DROP = 0.05; // 練習ウェーブでボスカードが落ちる確率（ボス撃破ずみの単元）
export function rollDrops(boss, rand = Math.random) {
  const out = [];
  if (S().tools.includes('coins') && rand() < DROP.coins) { toolStock().coins = (toolStock().coins || 0) + 1; out.push('coins'); }
  if (rand() < (boss ? DROP.bossTicket : DROP.ticket)) { S().collection.gachaTickets = gachaTickets() + 1; out.push('ticket'); }
  return out;
}
export function equipTool(id) {
  const s = S();
  if (!s.tools.includes(id)) return false;
  s.toolOn = id;
  save();
  return true;
}
