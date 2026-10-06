// 効果音（Web Audio で合成。音声ファイルなし）。設定でミュートできる
import { S } from './store.js';

let ctx = null;
function ac() {
  if (!ctx) {
    const C = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'square', vol = 0.06) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(vol, a.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.02);
}

const SOUNDS = {
  tap: () => tone(880, 0, 0.04, 'sine', 0.03),
  ok: () => { tone(660, 0, 0.08); tone(990, 0.08, 0.12); },
  ng: () => { tone(200, 0, 0.18, 'sawtooth', 0.05); },
  coin: () => { tone(1320, 0, 0.05, 'square', 0.04); tone(1760, 0.05, 0.08, 'square', 0.04); },
  build: () => { tone(330, 0, 0.06); tone(440, 0.06, 0.06); tone(550, 0.12, 0.1); },
  hit: () => tone(150, 0, 0.08, 'triangle', 0.08),
  leak: () => { tone(300, 0, 0.12, 'sawtooth', 0.05); tone(180, 0.12, 0.2, 'sawtooth', 0.05); },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.1, 0.18)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.15, 0.22, 'triangle')),
  gacha: () => [400, 500, 600, 800, 1000, 1200].forEach((f, i) => tone(f, i * 0.06, 0.08, 'sine', 0.05)),
};

export function sfx(name) {
  try {
    if (!S()?.settings?.sound) return;
    SOUNDS[name]?.();
  } catch {
    // 音が鳴らなくてもゲームは続ける
  }
}
