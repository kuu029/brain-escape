// 実質の勉強時間: 画面が見えていて、最後の操作から60秒以内の時間だけ数える
import { addSeconds, saveNow } from './store.js';

const IDLE = 60000;
export function startTimer() {
  let last = Date.now();
  let lastInput = Date.now();
  const touch = () => { lastInput = Date.now(); };
  addEventListener('pointerdown', touch, { passive: true });
  addEventListener('keydown', touch);
  setInterval(() => {
    const now = Date.now();
    const dt = Math.min(10, Math.round((now - last) / 1000));
    if (document.visibilityState === 'visible' && now - lastInput < IDLE) addSeconds(dt);
    last = now;
  }, 5000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveNow();
    last = Date.now();
  });
  addEventListener('pagehide', saveNow);
}
