// 勉強時間: 「問題や解説が画面に出ていて、それに向き合っている時間」だけを数える。
// 1問（1ステップ）ごとに上限があるので、放置や寝落ちしても数えすぎない。
// ホームやマップ、ガチャを見ている時間は数えない
import { addSeconds, saveNow, closeSession } from './store.js';

let cur = null; // { t: 見え始めた時刻（隠れている間は null）, acc: 見ていた秒, added: 記録ずみの秒, cap: 上限秒 }
let lastInput = Date.now();

// 問題（または解説）を出したときに呼ぶ。前のぶんは締める
export function studyBegin(cap = 180) {
  studyEnd();
  cur = { t: document.visibilityState === 'hidden' ? null : Date.now(), acc: 0, added: 0, cap };
}
// 答えた・次へ進んだ・画面を離れたときに呼ぶ。数えた秒を返す
export function studyEnd() {
  if (!cur) return 0;
  pause();
  const sec = cur.added;
  cur = null;
  return sec;
}
function pause() {
  if (cur?.t != null) {
    cur.acc += (Date.now() - cur.t) / 1000;
    cur.t = null;
    // 見ていたぶんをその場で記録（アプリが急に閉じられても消えない）。上限は超えない
    const tgt = Math.min(cur.cap, Math.round(cur.acc));
    addSeconds(tgt - cur.added);
    cur.added = tgt;
  }
}
// 放置の確認を出したとき: 止めて、最後にさわってから今までの「放置していた時間」は数えなかったことにする
export function studyPause() {
  if (!cur) return;
  pause();
  const tgt = Math.max(0, Math.min(cur.cap, Math.round(cur.acc - idleFor() / 1000)));
  if (tgt < cur.added) {
    addSeconds(tgt - cur.added);
    cur.added = tgt;
    cur.acc = tgt;
  }
}
export function studyResume() { if (cur && cur.t == null && document.visibilityState !== 'hidden') cur.t = Date.now(); }
// 画面を切りかえるとき（ルーターから）: 数えている途中のものと、挑戦の記録を締める
export function studyStop() {
  studyEnd();
  closeSession();
}
// 最後に画面をさわってからの時間（ミリ秒）
export const idleFor = () => Date.now() - lastInput;

export function startTimer() {
  const touch = () => { lastInput = Date.now(); };
  addEventListener('pointerdown', touch, { passive: true });
  addEventListener('keydown', touch);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      pause();
      saveNow();
    } else {
      if (cur && cur.t == null) cur.t = Date.now();
      lastInput = Date.now();
    }
  });
  addEventListener('pagehide', () => { pause(); saveNow(); });
}
