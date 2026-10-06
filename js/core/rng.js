// シード付き乱数（mulberry32）。同じシードなら同じ問題が再生成できる（復習の再現に使う）。
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return {
    next,
    int,
    // 0 を除く整数
    nz(lo, hi) {
      let v;
      do v = int(lo, hi); while (v === 0);
      return v;
    },
    // except に含まれない整数
    intEx(lo, hi, except) {
      let v;
      do v = int(lo, hi); while (except.includes(v));
      return v;
    },
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    sign: () => (next() < 0.5 ? -1 : 1),
    chance: (p) => next() < p,
    shuffle(arr) {
      const b = [...arr];
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
      }
      return b;
    },
  };
}

export const newSeed = () => (Math.random() * 4294967296) >>> 0;

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
