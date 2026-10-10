// 週末イベント: 土日だけ、週ごとに入れかわる特別ルール（4種類を順番に）
//   バナーの絵は art/event-<id>.jpg（なければ CSS の色だけ）
export const EVENTS = [
  { id: 'gemfever', emoji: '💎', name: '💎フィーバー', desc: 'ウェーブと暗号ディフェンスの💎が2倍！' },
  { id: 'bossrush', emoji: '👑', name: 'ボスラッシュ', desc: 'ボス撃破の💎が3倍、練習ウェーブでボスカードが落ちやすい！' },
  { id: 'gachafes', emoji: '🎰', name: 'ガチャ祭り', desc: 'ガチャがぜんぶ2割引き！' },
  { id: 'allyfes', emoji: '🤝', name: 'なかま祭り', desc: 'なかまのゲージが1つ少なくてOK！' },
];
export const EVENT = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

// テスト用: 決まったイベント（null = なし）にする。undefined で日付どおりにもどす
let forced;
export const forceEvent = (id) => { forced = id; };

// その日のイベント（平日は null）。週の番号で順番に入れかわる
export function currentEvent(now = new Date()) {
  if (forced !== undefined) return forced ? EVENT[forced] : null;
  const dow = now.getDay();
  if (dow !== 0 && dow !== 6) return null;
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  const week = Math.floor((day + 3) / 7); // 月曜はじまりの週（1970/1/1 は木曜）
  return EVENTS[((week % EVENTS.length) + EVENTS.length) % EVENTS.length];
}
export const isEvent = (id) => currentEvent()?.id === id;
// 次の土曜までの日数（平日のホームで「今週末は…」を出す）
export function nextEvent(now = new Date()) {
  const add = (6 - now.getDay() + 7) % 7 || 7;
  const sat = new Date(now.getFullYear(), now.getMonth(), now.getDate() + add);
  return { ev: currentEvent(sat), days: add };
}
