// 英語の読み上げ（リスニング用）。端末に入っている声（speechSynthesis）を使うので、通信はしない
// lines: [{ who: 'A' | 'B' | 'N', text }]  A・B は会話の2人（ちがう声）、N はナレーター（質問など）
let voices = [];
function loadVoices() {
  if (!canSpeak()) return;
  const all = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
  // アメリカ英語 → イギリス英語 → その他 の順
  const rank = (v) => (/en[-_]US/i.test(v.lang) ? 0 : /en[-_]GB/i.test(v.lang) ? 1 : 2);
  voices = all.sort((a, b) => rank(a) - rank(b));
}
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
if (canSpeak()) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

let token = 0;
export function stopSpeech() {
  token++;
  if (canSpeak()) speechSynthesis.cancel();
}

// 全部読み終わったら resolve（止めたときも resolve）
export function speakLines(lines, { rate = 0.85 } = {}) {
  if (!canSpeak()) return Promise.resolve(false);
  stopSpeech();
  const my = ++token;
  if (!voices.length) loadVoices();
  const vA = voices[0] || null;
  const vB = voices.find((v) => v !== vA && v.lang === vA?.lang) || voices[1] || vA;
  return new Promise((resolve) => {
    let i = 0;
    const next = () => {
      if (my !== token) return resolve(false);
      if (i >= lines.length) return resolve(true);
      const { who, text } = lines[i++];
      const u = new SpeechSynthesisUtterance(text);
      u.lang = vA?.lang || 'en-US';
      u.rate = rate;
      const v = who === 'B' ? vB : vA;
      if (v) u.voice = v;
      // 声が1つしかない端末では、高さで2人を区別する
      u.pitch = who === 'B' && vB === vA ? 1.35 : who === 'N' ? 0.95 : 1;
      u.onend = () => setTimeout(next, who === 'N' ? 700 : 450);
      u.onerror = () => setTimeout(next, 100);
      speechSynthesis.speak(u);
    };
    next();
  });
}
