// BGM: Web Audio でその場で鳴らす短いループ曲（音声ファイルなし・ダウンロードなし）
//   画面ごとに曲が変わる。模試・タイムアタック・暗記のラッシュは集中できるように無音
//   設定の「BGM」で ON/OFF（効果音が OFF のときも鳴らさない）。アプリが裏に回ったら止める
import { S } from './store.js';
import { audioCtx, noiseBuffer } from './sound.js';

// 曲: bpm、ベース（8分音符ごと、A2=0 からの半音。'.' は休み）、メロディ（8分音符ごと、A4=0 からの半音）、
//     ドラム（16分音符ごと k=キック s=スネア h=ハイハット -=休み）。1小節 = ベース・メロディ 8つ、ドラム 16
const TRACKS = {
  // ホーム・マップなど: 夜の監獄をこっそり歩く感じ（Aマイナー）
  home: {
    bpm: 92, vol: 0.5,
    bass: ['0 . 0 . 7 . 0 12', '-4 . -4 . 3 . -4 8', '-2 . -2 . 5 . -2 10', '-5 . -5 . 2 . -1 -5'],
    lead: ['12 . 15 . 19 . 17 15', '12 . . . 8 . 12 .', '14 . 17 . 19 . 17 14', '11 . 8 . 11 . 14 .'],
    drum: ['k---h---s---h-h-', 'k---h---s---h---', 'k---h---s---h-h-', 'k---h-k-s---hhhh'],
  },
  // ウェーブ: ノリのいいバトル（Dマイナー）
  battle: {
    bpm: 132, vol: 0.45,
    bass: ['5 5 17 5 5 5 17 5', '1 1 13 1 1 1 13 1', '3 3 15 3 3 3 15 3', '0 0 12 0 4 4 16 4'],
    lead: ['17 . 20 17 24 . 22 20', '17 . 16 . 13 . 16 .', '15 . 19 15 22 . 20 19', '16 . 19 . 22 . 23 .'],
    drum: ['k-h-s-h-k-k-s-h-', 'k-h-s-h-k-h-s-hh', 'k-h-s-h-k-k-s-h-', 'k-h-s-h-k-s-s-ss'],
  },
  // ボスウェーブ: 重くてこわい（Eマイナー＋半音）
  boss: {
    bpm: 112, vol: 0.5,
    bass: ['7 7 7 8 7 7 7 8', '7 7 7 8 10 10 10 8', '3 3 3 4 3 3 3 4', '5 5 5 6 7 . 6 .'],
    lead: ['19 . . 20 19 . 15 .', '19 . 22 . 20 . 19 .', '15 . . 16 15 . 12 .', '17 . 18 . 19 . 22 .'],
    drum: ['k--kh-s-k--kh-s-', 'k--kh-s-k-k-s-s-', 'k--kh-s-k--kh-s-', 'k-k-s-k-s-s-ssss'],
  },
  // 暗号ディフェンス: 速くて忙しい（Gマイナー）
  defense: {
    bpm: 150, vol: 0.4,
    bass: ['-2 10 -2 10 -2 10 -2 10', '-5 7 -5 7 -5 7 -5 7', '1 13 1 13 1 13 1 13', '0 12 0 12 3 15 5 17'],
    lead: ['22 . 25 . 29 27 25 22', '19 . 22 . 26 . 24 22', '25 . 29 . 32 30 29 25', '24 27 29 . 31 . 33 .'],
    drum: ['k-hhs-hhk-hhs-hh', 'k-hhs-hhk-k-s-hh', 'k-hhs-hhk-hhs-hh', 'k-k-s-k-s-s-ssss'],
  },
  // エンディング・勝利: 明るく（Cメジャー）
  win: {
    bpm: 108, vol: 0.45,
    bass: ['3 . 10 . 15 . 10 .', '-4 . 3 . 8 . 3 .', '1 . 8 . 13 . 8 .', '-2 . 5 . 10 . 5 .'],
    lead: ['15 . 19 . 22 . 27 .', '24 . 22 . 20 . 19 .', '20 . 22 . 24 . 27 .', '26 . 24 . 22 . 17 .'],
    drum: ['k---h---s---h---', 'k---h---s---h-h-', 'k---h---s---h---', 'k---h-k-s---s-s-'],
  },
};
export const TRACK_IDS = Object.keys(TRACKS);
const parse = (bars) => bars.flatMap((b) => b.trim().split(/\s+/).map((x) => (x === '.' ? null : Number(x))));

let cur = null; // いまの曲の名前
let timer = null;
let master = null;
let step = 0; // 16分音符の位置
let nextAt = 0;
let want = null; // 鳴らしたい曲（音を出せるようになったら始める）

export const bgmOn = () => !!S()?.settings?.sound && S()?.settings?.bgm !== false;

function note(a, out, freq, t, dur, type, vol) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}
function drum(a, out, kind, t) {
  if (kind === 'k') {
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.16);
    return;
  }
  const buf = noiseBuffer();
  if (!buf) return;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = kind === 's' ? 'bandpass' : 'highpass';
  f.frequency.value = kind === 's' ? 1800 : 7000;
  const g = a.createGain();
  const dur = kind === 's' ? 0.12 : 0.04;
  g.gain.setValueAtTime(kind === 's' ? 0.25 : 0.12, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t);
  src.stop(t + dur + 0.02);
}

// 少し先まで音を予約する（25ms ごと）
function pump() {
  const a = audioCtx();
  const T = TRACKS[cur];
  if (!a || !T || a.state !== 'running') return;
  const st16 = 60 / T.bpm / 4;
  const bass = T._bass ||= parse(T.bass);
  const lead = T._lead ||= parse(T.lead);
  const drums = T._drum ||= T.drum.join('');
  const len = drums.length;
  if (nextAt < a.currentTime) nextAt = a.currentTime + 0.05;
  while (nextAt < a.currentTime + 0.2) {
    const i = step % len;
    if (i % 2 === 0) {
      const b = bass[(i / 2) % bass.length];
      if (b !== null) note(a, master, 110 * 2 ** (b / 12), nextAt, st16 * 1.8, 'triangle', 0.35);
      const m = lead[(i / 2) % lead.length];
      if (m !== null) note(a, master, 440 * 2 ** ((m - 12) / 12), nextAt, st16 * 1.9, 'square', 0.09);
    }
    const d = drums[i];
    if (d !== '-') drum(a, master, d, nextAt);
    nextAt += st16;
    step++;
  }
}

function stopNow() {
  clearInterval(timer);
  timer = null;
  if (master) {
    const a = audioCtx();
    try { master.gain.setTargetAtTime(0.0001, a.currentTime, 0.15); } catch { /* なし */ }
    const m = master;
    setTimeout(() => m.disconnect(), 600);
    master = null;
  }
  cur = null;
}

// 曲をかえる（null で止める）。同じ曲なら何もしない
export function playBgm(name) {
  want = TRACKS[name] ? name : null;
  if (!bgmOn() || !want || document.hidden) { stopNow(); return; }
  if (cur === want && timer) return;
  stopNow();
  const a = audioCtx();
  if (!a) return;
  if (a.state !== 'running') return; // まだ音を出せない（最初のタップで始める）
  cur = want;
  master = a.createGain();
  master.gain.value = 0.06 * TRACKS[cur].vol;
  master.connect(a.destination);
  step = 0;
  nextAt = a.currentTime + 0.1;
  timer = setInterval(pump, 25);
  pump();
}
export const refreshBgm = () => playBgm(want);

// iPhone は、さわってからでないと音が出ない。最初のタップで始める。裏に回ったら止める
if (typeof document !== 'undefined') {
  const kick = () => { const a = audioCtx(); if (a && a.state !== 'running') a.resume().then(refreshBgm).catch(() => {}); else refreshBgm(); };
  document.addEventListener('pointerdown', kick, { passive: true });
  document.addEventListener('visibilitychange', refreshBgm);
}

// 画面 → 曲
export function trackFor(screen, p = {}) {
  if (screen === 'battle') return p.mode === 'boss' ? 'boss' : p.mode === 'diagnosis' ? null : 'battle';
  if (screen === 'memory') return p.phase === 'defense' ? 'defense' : p.phase ? null : 'home';
  if (screen === 'ending') return 'win';
  if (screen === 'result') return p.win === false ? null : 'win';
  if (['exam', 'timeattack', 'training', 'diagnosis'].includes(screen)) return null;
  return 'home';
}
