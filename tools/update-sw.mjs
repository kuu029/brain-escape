// sw.js のファイル一覧とバージョンを更新する:  node tools/update-sw.mjs
// ファイルを追加・変更したら公開前に必ず実行（iPhone に新しい版が届くようになる）
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = ['index.html', 'manifest.webmanifest', ...['css', 'js', 'icons', 'art'].filter((d) => existsSync(join(ROOT, d))).flatMap((d) => walk(join(ROOT, d)).map((p) => relative(ROOT, p).replace(/\\/g, '/')))].sort();
const hash = createHash('sha1');
for (const f of files) hash.update(f).update(readFileSync(join(ROOT, f)));
const version = hash.digest('hex').slice(0, 10);

const swPath = join(ROOT, 'sw.js');
let sw = readFileSync(swPath, 'utf8');
sw = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`);
sw = sw.replace(/const ASSETS = \[[\s\S]*?\];/, `const ASSETS = [\n  './',\n${files.map((f) => `  './${f}',`).join('\n')}\n];`);
writeFileSync(swPath, sw);
console.log(`sw.js updated: ${files.length} files, version ${version}`);
