// 効果音（Web Audio で合成。音声ファイルなし）。設定でミュートできる
import { S } from './store.js';

let ctx = null;
let noiseBuf = null;
function ac() {
  if (!ctx) {
    const C = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 音1つ: 周波数を f0 → f1 に動かしながら鳴らす
function tone({ f0, f1 = f0, at = 0, dur = 0.1, type = 'square', vol = 0.05, attack = 0.005 }) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.03);
}
// ノイズ（シャッ・ボンッ）
function noise({ at = 0, dur = 0.15, vol = 0.08, type = 'bandpass', freq = 1500, q = 1, f1 = null }) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + at;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  const flt = a.createBiquadFilter();
  flt.type = type;
  flt.frequency.setValueAtTime(freq, t);
  if (f1) flt.frequency.exponentialRampToValueAtTime(f1, t + dur);
  flt.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(flt).connect(g).connect(a.destination);
  src.start(t);
  src.stop(t + dur + 0.02);
}
const semi = (base, n) => base * 2 ** (n / 12);

const SOUNDS = {
  tap: () => tone({ f0: 1200, dur: 0.025, type: 'sine', vol: 0.025 }),
  key: () => tone({ f0: 900, f1: 1100, dur: 0.03, type: 'triangle', vol: 0.03 }),
  // 正解: コンボで音程が上がる
  ok: (combo = 1) => {
    const b = semi(660, Math.min(combo - 1, 12));
    tone({ f0: b, dur: 0.08, type: 'square', vol: 0.045 });
    tone({ f0: semi(b, 7), at: 0.07, dur: 0.14, type: 'square', vol: 0.045 });
    if (combo >= 3) tone({ f0: semi(b, 12), at: 0.14, dur: 0.16, type: 'sine', vol: 0.04 });
  },
  ng: () => { tone({ f0: 330, f1: 300, dur: 0.12, type: 'triangle', vol: 0.06 }); tone({ f0: 247, f1: 220, at: 0.12, dur: 0.18, type: 'triangle', vol: 0.06 }); },
  zap: () => { tone({ f0: 1600, f1: 220, dur: 0.16, type: 'sawtooth', vol: 0.04 }); noise({ dur: 0.12, freq: 3000, vol: 0.05 }); },
  beam: () => tone({ f0: 1900, f1: 500, dur: 0.09, type: 'sine', vol: 0.04 }),
  frost: () => noise({ dur: 0.22, type: 'highpass', freq: 4000, vol: 0.05 }),
  bomb: () => { tone({ f0: 140, f1: 45, dur: 0.25, type: 'sine', vol: 0.12 }); noise({ dur: 0.2, type: 'lowpass', freq: 900, f1: 200, vol: 0.09 }); },
  hit: () => tone({ f0: 260, f1: 160, dur: 0.06, type: 'triangle', vol: 0.06 }),
  // 撃破: ポン！ ＋ キラッ
  pop: (n = 0) => {
    noise({ dur: 0.09, freq: 1800, q: 2, vol: 0.09 });
    tone({ f0: semi(500, n * 2), f1: semi(1500, n * 2), dur: 0.1, type: 'square', vol: 0.05 });
    tone({ f0: semi(1760, n * 2), at: 0.09, dur: 0.08, type: 'sine', vol: 0.04 });
    tone({ f0: semi(2349, n * 2), at: 0.15, dur: 0.12, type: 'sine', vol: 0.035 });
  },
  bigpop: () => {
    tone({ f0: 90, f1: 40, dur: 0.5, type: 'sine', vol: 0.15 });
    noise({ dur: 0.45, type: 'lowpass', freq: 2000, f1: 150, vol: 0.12 });
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone({ f0: f, at: 0.25 + i * 0.07, dur: 0.2, type: 'square', vol: 0.04 }));
  },
  coin: () => { tone({ f0: 1568, dur: 0.05, vol: 0.035 }); tone({ f0: 2093, at: 0.05, dur: 0.09, vol: 0.035 }); },
  step: () => tone({ f0: 180, f1: 150, dur: 0.03, type: 'triangle', vol: 0.03 }),
  leak: () => { tone({ f0: 880, dur: 0.1, type: 'square', vol: 0.05 }); tone({ f0: 660, at: 0.11, dur: 0.1, type: 'square', vol: 0.05 }); tone({ f0: 880, at: 0.22, dur: 0.1, type: 'square', vol: 0.05 }); },
  build: () => [392, 523, 659].forEach((f, i) => tone({ f0: f, at: i * 0.05, dur: 0.08, vol: 0.04 })),
  upgrade: () => { [523, 659, 784, 1046].forEach((f, i) => tone({ f0: f, at: i * 0.05, dur: 0.1, vol: 0.04 })); noise({ at: 0.2, dur: 0.2, type: 'highpass', freq: 6000, vol: 0.03 }); },
  combo: () => [784, 988, 1175, 1568].forEach((f, i) => tone({ f0: f, at: i * 0.04, dur: 0.25, type: 'sine', vol: 0.03 })),
  tool: () => { tone({ f0: 300, f1: 1200, dur: 0.25, type: 'sawtooth', vol: 0.035 }); noise({ at: 0.15, dur: 0.25, freq: 2500, vol: 0.05 }); },
  win: () => [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone({ f0: f, at: i * 0.09, dur: 0.2, vol: 0.05 })),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone({ f0: f, at: i * 0.16, dur: 0.24, type: 'triangle', vol: 0.06 })),
  count: () => tone({ f0: 1400, dur: 0.02, type: 'square', vol: 0.02 }),
  rattle: () => { for (let i = 0; i < 6; i++) noise({ at: i * 0.07, dur: 0.04, freq: 2500 + i * 200, q: 4, vol: 0.06 }); },
  reveal: (r = 1) => {
    noise({ dur: 0.3, type: 'highpass', freq: 3000, vol: 0.05 });
    const notes = r >= 4 ? [523, 659, 784, 1046, 1318, 1568] : r >= 3 ? [523, 659, 784, 1046] : [659, 880];
    notes.forEach((f, i) => tone({ f0: f, at: 0.08 + i * 0.08, dur: 0.22, type: r >= 3 ? 'square' : 'sine', vol: 0.045 }));
  },
};

const last = {};
export function sfx(name, arg) {
  try {
    if (!S()?.settings?.sound) return;
    const now = performance.now();
    if (last[name] && now - last[name] < 45) return; // 同じ音が重なりすぎないように
    last[name] = now;
    SOUNDS[name]?.(arg);
  } catch {
    // 音が鳴らなくてもゲームは続ける
  }
}
