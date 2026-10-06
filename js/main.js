// 起動
import { init, S } from './core/store.js';
import { startTimer } from './core/timer.js';
import { register, mount, go } from './core/router.js';
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

init();
const screens = { onboarding, home, map, diagnosis, training, battle, result, collection, records, settings };
for (const [k, v] of Object.entries(screens)) register(k, v);
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
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
// ダブルタップ拡大は CSS の touch-action: manipulation で止める。
// （touchend を preventDefault すると素早い連続タップが消えるので使わない）
