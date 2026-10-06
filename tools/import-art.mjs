// ChatGPT で作った画像を取りこむ（Windows 用）:  node tools/import-art.mjs
//   1. 画像を art-src\ に入れる（ファイル名は docs/image-prompts.md の表どおり。例: tower-beam-1.png）
//   2. このコマンドを実行 → 256×256 に縮小して art\ に保存し、js/game/art-manifest.js と sw.js を更新
// 縮小は Windows 標準の System.Drawing（PowerShell）を使うので、追加インストールは不要。
import { readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'art-src');
const OUT = join(ROOT, 'art');
const SIZE = 256;

const KNOWN = [
  ...['beam', 'frost', 'bomb'].flatMap((t) => [1, 2, 3].map((l) => `tower-${t}-${l}`)),
  ...['grunt', 'runner', 'tank', 'review'].map((k) => `enemy-${k}`),
  ...['signed-numbers', 'fractions-decimals', 'expressions', 'linear-equations', 'polynomials', 'simultaneous', 'expand-factor', 'square-roots', 'quadratic'].map((u) => `boss-${u}`),
  ...['neon', 'gold', 'candy', 'pixel', 'lava'].flatMap((sk) => ['beam', 'frost', 'bomb'].map((t) => `skin-${sk}-${t}`)),
  'gacha-machine',
];

mkdirSync(SRC, { recursive: true });
mkdirSync(OUT, { recursive: true });
const files = readdirSync(SRC).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
if (!files.length) {
  console.log(`art-src に画像がありません: ${SRC}`);
}

const ps = (inp, out) => `
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('${inp.replace(/'/g, "''")}')
$bmp = New-Object System.Drawing.Bitmap ${SIZE}, ${SIZE}, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'; $g.CompositingQuality = 'HighQuality'
$g.Clear([System.Drawing.Color]::Transparent)
$scale = [Math]::Min(${SIZE} / $src.Width, ${SIZE} / $src.Height)
$w = [int]($src.Width * $scale); $h = [int]($src.Height * $scale)
$g.DrawImage($src, [int]((${SIZE} - $w) / 2), [int]((${SIZE} - $h) / 2), $w, $h)
$corner = $bmp.GetPixel(2, 2).A + $bmp.GetPixel(${SIZE - 3}, 2).A + $bmp.GetPixel(2, ${SIZE - 3}).A
$bmp.Save('${out.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $src.Dispose()
Write-Output $corner
`;

const warn = [];
for (const f of files) {
  const name = basename(f).replace(/\.(png|jpg|jpeg|webp)$/i, '').toLowerCase();
  if (!KNOWN.includes(name)) {
    warn.push(`  ? ${f} … 知らない名前なのでスキップ（docs/image-prompts.md のファイル名に合わせてね）`);
    continue;
  }
  const out = join(OUT, `${name}.png`);
  const corner = Number(execFileSync('powershell', ['-NoProfile', '-Command', ps(join(SRC, f), out)], { encoding: 'utf8' }).trim());
  console.log(`  ✓ ${name}.png`);
  if (corner > 60) warn.push(`  ! ${f} … 背景が透明になっていないかも（角が塗られている）。ChatGPT に「背景を透明に」と頼み直すのがおすすめ`);
}

const have = KNOWN.filter((k) => existsSync(join(OUT, `${k}.png`)));
writeFileSync(join(ROOT, 'js', 'game', 'art-manifest.js'), `// tools/import-art.mjs が自動生成する。手で書きかえない\nexport const ART_KEYS = ${JSON.stringify(have, null, 2)};\n`);
console.log(`art-manifest: ${have.length} / ${KNOWN.length} 枚`);
const missing = KNOWN.filter((k) => !have.includes(k));
if (missing.length) console.log(`まだない画像（絵文字で表示中）: ${missing.join(', ')}`);
warn.forEach((w) => console.log(w));
execFileSync('node', [join(ROOT, 'tools', 'update-sw.mjs')], { stdio: 'inherit' });
