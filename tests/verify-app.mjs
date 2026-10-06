// アプリ部分の検査: エンジンのバランス / 保存とバックアップ / SW のプリキャッシュ / 外部通信なし
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

export async function run(ROOT, { fail, note }) {
  let checks = 0;
  const E = await import('../js/game/engine.js');
  const W = await import('../js/game/waves.js');

  // ---------- エンジン ----------
  console.log('■ エンジン（ターン制TD）');
  {
    // 基本動作
    const st = E.createBattle({ schedule: [{ turn: 0, kind: 'grunt' }] });
    const c0 = st.coins;
    E.answer(st, { correct: true });
    checks++;
    if (st.coins <= c0) fail('engine', '正解でコインが増えない');
    const pos = st.enemies[0].pos;
    E.answer(st, { correct: false });
    checks++;
    if (st.enemies[0].dead || st.enemies[0].pos <= pos) fail('engine', '不正解で敵が進まない');
    if (st.combo !== 0) fail('engine', '不正解でコンボが切れない');
    // 何もしないと負ける
    const lose = E.createBattle({ schedule: W.practiceSchedule() });
    for (let i = 0; i < 60 && !lose.over; i++) E.answer(lose, { correct: false });
    checks++;
    if (lose.over !== 'lose') fail('engine', '全部まちがえても負けにならない');
    // 診断モードは終わらない・ライフが減らない
    const dg = E.createBattle({ mode: 'diagnosis', schedule: W.diagnosisSchedule(12) });
    for (let i = 0; i < 30; i++) E.answer(dg, { correct: false });
    checks++;
    if (dg.over || dg.lives !== Infinity) fail('engine', '診断モードで勝敗がついた');
    // 建設・強化
    const b = E.createBattle({ coins: 100 });
    checks++;
    if (!E.build(b, 0, 'beam') || !E.upgrade(b, 0) || b.slots[0].lvl !== 2) fail('engine', '建設・強化ができない');
    if (E.build(b, 0, 'beam')) fail('engine', '同じ場所に2つ建てられる');

    // 予測表示 = 本当に起きること（正解・不正解の両方）
    {
      let mismatch = 0;
      for (let k = 0; k < 300; k++) {
        const st2 = E.createBattle({ schedule: W.practiceSchedule([{ generatorId: 'x', seed: 1 }]) });
        for (let t = 0; t < 30 && !st2.over; t++) {
          const target = E.pendingReview(st2);
          const pred = E.predict(st2, { targetId: target?.id || null });
          const ok = Math.random() < 0.6;
          const evs = E.answer(st2, { correct: ok, targetId: target?.id || null });
          const p = ok ? pred.ok : pred.ng;
          if (JSON.stringify(p.events) !== JSON.stringify(evs) || JSON.stringify(E.cloneState(st2)) !== JSON.stringify(p.st)) mismatch++;
          if (target && ok) target.review.answered = true;
          E.autoSpend(st2);
        }
      }
      checks++;
      if (mismatch) fail('engine', `予測と実際がずれた: ${mismatch} 回`);
      // 移動イベントには道の上の from/to がある
      const st3 = E.createBattle({ schedule: [{ turn: 0, kind: 'runner' }] });
      const mv = E.answer(st3, { correct: false }).find((e) => e.t === 'move');
      checks++;
      if (!mv || mv.from !== 0 || mv.to !== 2) fail('engine', `移動イベントの from/to がおかしい: ${JSON.stringify(mv)}`);
    }

    // バランス（シミュレーション）
    const sim = (p, mode = 'practice', n = 3000) => {
      let wins = 0;
      const turns = [];
      for (let k = 0; k < n; k++) {
        const sched = mode === 'boss' ? W.bossSchedule('quadratic', [{ generatorId: 'x', seed: 1 }]) : W.practiceSchedule([{ generatorId: 'x', seed: 1 }]);
        const st = E.createBattle({ schedule: sched, mode });
        let t = 0;
        while (!st.over && t < 80) {
          const target = E.pendingReview(st);
          let ok = Math.random() < p;
          E.answer(st, { correct: ok, targetId: target?.id });
          t++;
          if (target && ok) target.review.answered = true;
          if (!ok && !st.over) {
            ok = Math.random() < Math.min(1, p + 0.2); // ヒントを見て解き直し
            E.answer(st, { correct: ok, retry: true, targetId: target?.id });
            t++;
            if (target && ok) target.review.answered = true;
          }
          E.autoSpend(st);
        }
        if (st.over === 'win') wins++;
        turns.push(t);
      }
      turns.sort((a, b) => a - b);
      return { win: wins / n, med: turns[Math.floor(n / 2)], p90: turns[Math.floor(n * 0.9)] };
    };
    const rows = [];
    for (const p of [0.95, 0.8, 0.6, 0.4, 0.2]) rows.push([p, sim(p), sim(p, 'boss')]);
    for (const [p, a, b2] of rows) note(`正答率 ${Math.round(p * 100)}%: 練習 勝率${Math.round(a.win * 100)}% 中央${a.med}問 / ボス 勝率${Math.round(b2.win * 100)}% 中央${b2.med}問`);
    const at = (p) => rows.find((r) => r[0] === p);
    checks += 4;
    if (at(0.95)[1].win < 0.95 || at(0.95)[2].win < 0.9) fail('balance', 'よくできる人でも負けやすい');
    if (at(0.8)[1].win < 0.75) fail('balance', '正答率80%で勝ちにくい');
    if (at(0.2)[1].win > 0.4) fail('balance', 'ほぼ全部まちがえても勝ててしまう');
    const med = at(0.8)[1].med;
    if (med < 7 || med > 18) fail('balance', `1ウェーブの問題数が想定外: ${med}`);
  }

  // ---------- 保存・バックアップ ----------
  console.log('■ 保存とバックアップ');
  {
    const mem = new Map();
    const ls = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
    const store = await import('../js/core/store.js');
    store.init(ls);
    const s = store.S();
    s.nickname = 'テスト';
    store.unitState('simultaneous').trainingDone = true;
    store.recordAnswer({ unit: 'simultaneous', generatorId: 'si-add', seed: 42, correct: false, firstTry: true });
    store.addSeconds(90);
    store.saveNow();
    // アプリを閉じて開き直しても残る
    store.init(ls);
    checks++;
    if (store.S().nickname !== 'テスト' || store.S().reviewQueue.length !== 1) fail('store', '再読み込みで記録が消える');
    // 書き出し → 初期化 → 読み込み
    const text = store.exportText();
    store.resetAll();
    checks++;
    if (store.S().nickname !== '') fail('store', '初期化できない');
    const r = store.importText(text);
    checks++;
    if (!r.ok || store.S().nickname !== 'テスト' || !store.S().units.simultaneous?.trainingDone || store.S().log[store.today()].seconds !== 90) fail('store', `バックアップから復元できない ${JSON.stringify(r)}`);
    checks++;
    if (store.importText('{"hello":1}').ok || store.importText('こわれた文字列').ok) fail('store', '壊れたバックアップを受け入れてしまう');
    // 復習キュー: 2回正解で卒業
    store.recordAnswer({ unit: 'simultaneous', generatorId: 'si-add', seed: 42, correct: true, firstTry: true, review: true });
    store.recordAnswer({ unit: 'simultaneous', generatorId: 'si-add', seed: 42, correct: true, firstTry: true, review: true });
    checks++;
    if (store.S().reviewQueue.length !== 0) fail('store', '復習の卒業が動かない');
  }

  // ---------- ガチャ ----------
  console.log('■ ガチャ');
  {
    const P = await import('../js/game/progress.js');
    const { GACHA_RATES } = await import('../js/game/content.js');
    const n = 40000;
    const count = {};
    for (let i = 0; i < n; i++) {
      const r = P._rollOne();
      checks++;
      if (!r || !r.id) { fail('gacha', '空の結果'); break; }
      count[r.rarity] = (count[r.rarity] || 0) + 1;
    }
    const total = GACHA_RATES.reduce((a, r) => a + r.weight, 0);
    for (const r of GACHA_RATES) {
      const got = (count[r.rarity] || 0) / n;
      if (Math.abs(got - r.weight / total) > 0.01) fail('gacha', `★${r.rarity} の出る確率がずれている: ${got}`);
    }
    note(`排出率 ${GACHA_RATES.map((r) => `★${r.rarity} ${(((count[r.rarity] || 0) / n) * 100).toFixed(1)}%`).join(' / ')}`);
  }

  // ---------- Service Worker / 外部通信 ----------
  console.log('■ オフライン対応と外部通信');
  {
    const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
    const listed = new Set([...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]));
    const served = ['index.html', 'manifest.webmanifest', ...['js', 'css', 'icons', 'art'].filter((d) => { try { return statSync(join(ROOT, d)).isDirectory(); } catch { return false; } }).flatMap((d) => walk(join(ROOT, d)).map((p) => relative(ROOT, p).replace(/\\/g, '/')))];
    for (const f of served) {
      checks++;
      if (!listed.has(f)) fail('sw', `sw.js のプリキャッシュに無い: ${f}`);
    }
    for (const f of listed) {
      if (f === '') continue;
      checks++;
      try { statSync(join(ROOT, f)); } catch { fail('sw', `sw.js に書かれたファイルが存在しない: ${f}`); }
    }
    for (const f of [...served, 'sw.js']) {
      if (!/\.(js|html|css|webmanifest)$/.test(f)) continue;
      const src = readFileSync(join(ROOT, f), 'utf8');
      checks++;
      const urls = src.match(/https?:\/\/[^\s'"`)]+/g) || [];
      const bad = urls.filter((u) => !/^http:\/\/www\.w3\.org\//.test(u));
      if (bad.length) fail('offline', `外部URLが含まれている: ${f}: ${bad.join(', ')}`);
      if (/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(src) && f !== 'sw.js') fail('offline', `通信APIを使っている: ${f}`);
      // 画面の文字列は rich()（HTMLをエスケープ）で表示するので、タグを書くとそのまま見えてしまう
      //（modal/confirmBox/toast の文章、rich: に渡す文字列が対象。html: に渡す絵の HTML は対象外）
      if (/^js\/(screens|game)\//.test(f) && /(\b(body|title|rich|msg|text)\s*:\s*|toast\(|confirmBox\()[`'"][^`'"]*<\/?(br|b|div|small|span)[\s>]/.test(src)) fail('ui', `文字列の中に HTML タグ（画面にそのまま出る）: ${f}`);
    }
    note(`プリキャッシュ ${listed.size} 件 / 配信ファイル ${served.length} 件`);

    // sw.js を擬似ワーカー環境で動かす: インストール → オフラインにしても全ファイルが返るか
    const { runInNewContext } = await import('node:vm');
    const ORIGIN = 'https://example.github.io/app/';
    let offline = false;
    const resp = (body) => ({ ok: true, body, clone() { return this; } });
    const fakeFetch = async (req) => {
      const url = typeof req === 'string' ? new URL(req, ORIGIN).href : req.url;
      if (offline) throw new Error('offline');
      let p = new URL(url).pathname.replace('/app/', '');
      if (p === '' || p.endsWith('/')) p += 'index.html';
      return resp(readFileSync(join(ROOT, p)));
    };
    const store = new Map();
    const norm = (u) => { const x = new URL(typeof u === 'string' ? u : u.url, ORIGIN); x.search = ''; return x.href; };
    const cacheObj = (m) => ({
      addAll: async (list) => { for (const u of list) m.set(norm(u), await fakeFetch(u)); },
      put: async (req, res) => m.set(norm(req), res),
      match: async (req) => m.get(norm(req)),
      keys: async () => [...m.keys()],
    });
    const caches = {
      open: async (n) => { if (!store.has(n)) store.set(n, new Map()); return cacheObj(store.get(n)); },
      keys: async () => [...store.keys()],
      delete: async (n) => store.delete(n),
      match: async (req) => { for (const m of store.values()) if (m.has(norm(req))) return m.get(norm(req)); return undefined; },
    };
    const handlers = {};
    const self = { addEventListener: (t, f) => { handlers[t] = f; }, skipWaiting: () => {}, clients: { claim: () => {} }, location: { origin: new URL(ORIGIN).origin } };
    runInNewContext(sw, { self, caches, fetch: fakeFetch, URL, Promise, console });
    const fire = async (type, extra = {}) => {
      let p = null;
      const ev = { ...extra, waitUntil: (x) => { p = x; }, respondWith: (x) => { p = x; } };
      handlers[type](ev);
      return p;
    };
    await fire('install');
    await fire('activate');
    offline = true;
    let served2 = 0;
    for (const f of listed) {
      const url = new URL(f || './', ORIGIN).href + (f === '' ? '?from=homescreen' : '');
      const res = await fire('fetch', { request: { method: 'GET', url } });
      checks++;
      const r = res && (await res);
      if (!r || !r.ok) fail('sw', `オフラインで取れない: ${f || './'}`);
      else served2++;
    }
    note(`オフライン模擬: ${served2}/${listed.size} ファイルをキャッシュから返せた`);
  }
  return { checks };
}
