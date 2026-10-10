// 起動
import { init, S } from './core/store.js';
import { startTimer } from './core/timer.js';
import { register, mount, go, currentScreen, markUpdateReady, setOnGo } from './core/router.js';
import { playBgm, trackFor } from './core/bgm.js';
import * as onboarding from './screens/onboarding.js';
import * as home from './screens/home.js';
import * as map from './screens/map.js';
import * as diagnosis from './screens/diagnosis.js';
import * as training from './screens/training.js';
import * as battle from './screens/battle.js';
import * as result from './screens/result.js';
import * as collection from './screens/collection.js';
import * as records from './screens/records.js';
import * as settings from './screens/settings.js';
import * as exam from './screens/exam.js';
import * as memory from './screens/memory.js';
import * as timeattack from './screens/timeattack.js';
import * as ending from './screens/ending.js';
import * as guide from './screens/guide.js';

init();
const screens = { onboarding, home, map, diagnosis, training, battle, result, collection, records, settings, exam, memory, timeattack, ending, guide };
for (const [k, v] of Object.entries(screens)) register(k, v);
setOnGo((name, p) => playBgm(trackFor(name, p)));
mount(document.getElementById('app'));
startTimer();

const s = S();
if (!s.nickname) go('onboarding', { step: 'title' });
else if (!s.onboarded) go('diagnosis', { phase: 'intro' });
else go('home');

// オフライン用 Service Worker
// （localhost で開発中はキャッシュが邪魔なので ?sw を付けたときだけ）
const devHost = location.hostname === 'localhost' && !location.search.includes('sw');
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !devHost) {
  // 新しい版（アップロードした更新）が届いたら: ホームにいればすぐ、ほかの画面ならホームに戻ったときに読みこみ直す
  const hadOld = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadOld) return;
    if (currentScreen() === 'home') location.reload();
    else markUpdateReady();
  });
  navigator.serviceWorker.register('./sw.js').then((r) => r.update()).catch(() => {});
}
// ダブルタップ拡大は CSS の touch-action: manipulation で止める。
// （touchend を preventDefault すると素早い連続タップが消えるので使わない）
