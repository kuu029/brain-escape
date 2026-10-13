// 「🎨 カラーにする」の記録（おうちの人ページ用）: 押した時刻と、そのあと10分の勉強時間
//   colorLog = [{ t: 押した時刻, study: そのあと10分に勉強した秒 }]（直近60回）
//   10分たって勉強が2分未満なら「そのあと勉強しなかった」（カラーのまま YouTube などに行ったかも）
import { S, saveNow } from '../core/store.js';

export const COLOR_WIN = 10 * 60000;
export const COLOR_NEED = 120; // 秒

export function noteColor(t = Date.now()) {
  const s = S();
  (s.colorLog ||= []).push({ t, study: 0 });
  if (s.colorLog.length > 60) s.colorLog.splice(0, s.colorLog.length - 60);
  saveNow();
}
// そのあと10分の勉強時間は store.addSeconds で足している（COLOR_WIN と同じ10分）
// since: ミリ秒。戻り値: { n: 押した回数, idle: そのあと勉強しなかった回数, list: [{ t, min, idle, wait }] }
export function colorStats(since) {
  const now = Date.now();
  const list = (S().colorLog || []).filter((c) => c.t >= since).map((c) => {
    const wait = now - c.t < COLOR_WIN; // まだ10分たっていない
    return { t: c.t, min: Math.round(c.study / 60), wait, idle: !wait && c.study < COLOR_NEED };
  });
  return { n: list.length, idle: list.filter((x) => x.idle).length, list };
}
