// アイコン PNG を生成する（外部ライブラリなし）:  node tools/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
mkdirSync(OUT, { recursive: true });

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, px) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = px(x / size, y / size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
// 紫の背景 + ピンクの脳（円）+ 鉄格子 + 黄色い鍵穴
function px(x, y) {
  let c = mix([40, 22, 84], [14, 9, 30], y);
  const dx = x - 0.5, dy = y - 0.5;
  const d = Math.hypot(dx, dy);
  if (d < 0.3) {
    c = mix([255, 140, 200], [235, 80, 160], d / 0.3);
    // しわ
    if (Math.abs(Math.sin((x * 9 + Math.cos(y * 14) * 0.35) * Math.PI)) < 0.12 && d < 0.27) c = [200, 60, 140];
  }
  // 鍵穴
  if (Math.hypot(dx, dy + 0.02) < 0.055 || (Math.abs(dx) < 0.028 && dy > 0 && dy < 0.11)) c = [255, 214, 64];
  // 鉄格子
  const bars = [0.2, 0.35, 0.65, 0.8];
  if (y > 0.12 && y < 0.88 && bars.some((b) => Math.abs(x - b) < 0.022)) c = [210, 214, 230];
  if ((Math.abs(y - 0.14) < 0.02 || Math.abs(y - 0.86) < 0.02) && x > 0.16 && x < 0.84) c = [210, 214, 230];
  return c;
}

for (const s of [180, 192, 512]) writeFileSync(join(OUT, `icon-${s}.png`), png(s, px));
console.log('icons written to', OUT);
