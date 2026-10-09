// 第3段階の図（SVG を文字列で作る）。座標は数学の向き（y は上が正）で渡す。
// 図はすべて実際の座標から描くので、検算テストは同じ座標を「測って」答えを確かめられる。

const r2 = (v) => Math.round(v * 10) / 10;
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ESC[c]);

// ---------- 幾何の小物（検算テストからも使う） ----------
export const deg = (r) => (r * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;
export const dist = (P, Q) => Math.hypot(Q[0] - P[0], Q[1] - P[1]);
export const polar = (C, r, d) => [C[0] + r * Math.cos(rad(d)), C[1] + r * Math.sin(rad(d))];
export const add = (P, v) => [P[0] + v[0], P[1] + v[1]];
export const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
// ∠PVQ（度、0〜180）
export function angleAt(P, V, Q) {
  const a = Math.atan2(P[1] - V[1], P[0] - V[0]);
  const b = Math.atan2(Q[1] - V[1], Q[0] - V[0]);
  let d = Math.abs(deg(a - b)) % 360;
  return d > 180 ? 360 - d : d;
}
// 2直線 P1P2 と Q1Q2 の交点
export function meet(P1, P2, Q1, Q2) {
  const d1 = [P2[0] - P1[0], P2[1] - P1[1]];
  const d2 = [Q2[0] - Q1[0], Q2[1] - Q1[1]];
  const den = d1[0] * d2[1] - d1[1] * d2[0];
  const t = ((Q1[0] - P1[0]) * d2[1] - (Q1[1] - P1[1]) * d2[0]) / den;
  return [P1[0] + d1[0] * t, P1[1] + d1[1] * t];
}
export function polyArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

// ---------- 幾何の図 ----------
// spec = {
//   pts: { A: [x, y], ... }            点（名前を表示。名前が _ で始まる点は表示しない）
//   segs: [['A','B'], ...]             線分（dash: true で点線）
//   lines: [['A','B'], ...]            直線（両側に少しのばす）
//   polys: [['A','B','C'], ...]        多角形（うすく塗る）
//   circles: [{ c: 'O', r }]
//   angles: [{ at: 'B', from: 'A', to: 'C', label: '52°', hl: true, right: false }]
//   lens: [{ a: 'A', b: 'B', label: '6cm', side: 1 }]   辺の長さ（side で外側の向き）
//   ticks: [['A','B', 1], ...]         等しい辺の印（本数）
//   arrows: [['A','B', 1], ...]        平行の印（本数）
//   texts: [{ at: [x, y], text }]
//   hide: ['O']                        点を描くが名前を出さない
// }
export function geo(spec, { w = 300, h = 190 } = {}) {
  const P = spec.pts;
  const all = Object.values(P).concat((spec.texts || []).map((t) => t.at));
  for (const c of spec.circles || []) {
    const C = P[c.c];
    all.push([C[0] - c.r, C[1] - c.r], [C[0] + c.r, C[1] + c.r]);
  }
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 26;
  const k = Math.min((w - 2 * pad) / Math.max(maxX - minX, 1e-6), (h - 2 * pad) / Math.max(maxY - minY, 1e-6));
  // 図の中身に合わせて枠を切りつめる（余白だけの部分をなくす）
  w = Math.round(k * (maxX - minX) + 2 * pad);
  h = Math.round(k * (maxY - minY) + 2 * pad);
  const ox = pad, oy = pad;
  const S = ([x, y]) => [r2(ox + (x - minX) * k), r2(h - oy - (y - minY) * k)];
  const cen = [xs.reduce((a, b) => a + b, 0) / xs.length, ys.reduce((a, b) => a + b, 0) / ys.length];
  let out = '';
  for (const pg of spec.polys || []) out += `<polygon class="g-fill" points="${pg.map((n) => S(P[n]).join(',')).join(' ')}"/>`;
  for (const c of spec.circles || []) {
    const [cx, cy] = S(P[c.c]);
    out += `<circle class="g-line" cx="${cx}" cy="${cy}" r="${r2(c.r * k)}"/>`;
  }
  for (const [a, b, dash] of spec.lines || []) {
    const A = P[a], B = P[b];
    const d = dist(A, B);
    const u = [(B[0] - A[0]) / d, (B[1] - A[1]) / d];
    const ext = (maxX - minX + maxY - minY) * 0.12;
    const [x1, y1] = S([A[0] - u[0] * ext, A[1] - u[1] * ext]);
    const [x2, y2] = S([B[0] + u[0] * ext, B[1] + u[1] * ext]);
    out += `<line class="g-line${dash ? ' dash' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  for (const sg of spec.segs || []) {
    const [a, b, dash] = Array.isArray(sg) ? sg : [sg.a, sg.b, sg.dash];
    const [x1, y1] = S(P[a]), [x2, y2] = S(P[b]);
    out += `<line class="g-line${dash ? ' dash' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  // 等しい辺の印
  for (const [a, b, n = 1] of spec.ticks || []) {
    const [x1, y1] = S(P[a]), [x2, y2] = S(P[b]);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, L = Math.hypot(x2 - x1, y2 - y1);
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * 4;
      const cx = mx + ux * o, cy = my + uy * o;
      out += `<line class="g-mark" x1="${r2(cx - uy * 5)}" y1="${r2(cy + ux * 5)}" x2="${r2(cx + uy * 5)}" y2="${r2(cy - ux * 5)}"/>`;
    }
  }
  // 平行の印（矢じり）
  for (const [a, b, n = 1] of spec.arrows || []) {
    const [x1, y1] = S(P[a]), [x2, y2] = S(P[b]);
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    for (let i = 0; i < n; i++) {
      const cx = (x1 + x2) / 2 + ux * i * 6, cy = (y1 + y2) / 2 + uy * i * 6;
      out += `<polyline class="g-mark" points="${r2(cx - ux * 6 - uy * 4)},${r2(cy - uy * 6 + ux * 4)} ${r2(cx)},${r2(cy)} ${r2(cx - ux * 6 + uy * 4)},${r2(cy - uy * 6 - ux * 4)}"/>`;
    }
  }
  // 角の印
  for (const an of spec.angles || []) {
    const V = P[an.at], A = P[an.from], B = P[an.to];
    const [vx, vy] = S(V);
    const a1 = Math.atan2(-(A[1] - V[1]), A[0] - V[0]);
    let a2 = Math.atan2(-(B[1] - V[1]), B[0] - V[0]);
    let da = a2 - a1;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    const rr = an.r || (Math.abs(da) < 0.6 ? 26 : 18);
    if (an.right) {
      const u1 = [Math.cos(a1), Math.sin(a1)], u2 = [Math.cos(a1 + da), Math.sin(a1 + da)];
      const s = 10;
      out += `<polyline class="g-ang" points="${r2(vx + u1[0] * s)},${r2(vy + u1[1] * s)} ${r2(vx + (u1[0] + u2[0]) * s)},${r2(vy + (u1[1] + u2[1]) * s)} ${r2(vx + u2[0] * s)},${r2(vy + u2[1] * s)}"/>`;
    } else {
      const x1 = vx + rr * Math.cos(a1), y1 = vy + rr * Math.sin(a1);
      const x2 = vx + rr * Math.cos(a1 + da), y2 = vy + rr * Math.sin(a1 + da);
      out += `<path class="g-ang${an.hl ? ' hl' : ''}" d="M ${r2(x1)} ${r2(y1)} A ${rr} ${rr} 0 0 ${da > 0 ? 1 : 0} ${r2(x2)} ${r2(y2)}"/>`;
    }
    if (an.label) {
      const mid = a1 + da / 2;
      const lr = rr + (an.label.length > 3 ? 16 : 12);
      out += `<text class="g-alabel${an.hl ? ' hl' : ''}" x="${r2(vx + lr * Math.cos(mid))}" y="${r2(vy + lr * Math.sin(mid) + 4)}">${esc(an.label)}</text>`;
    }
  }
  // 辺の長さ
  for (const ln of spec.lens || []) {
    const A = S(P[ln.a]), B = S(P[ln.b]);
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const nx = -(B[1] - A[1]) / L, ny = (B[0] - A[0]) / L;
    const s = ln.side || 1;
    out += `<text class="g-len" x="${r2((A[0] + B[0]) / 2 + nx * 12 * s)}" y="${r2((A[1] + B[1]) / 2 + ny * 12 * s + 4)}">${esc(ln.label)}</text>`;
  }
  // 点と名前
  for (const [n, p] of Object.entries(P)) {
    if (n.startsWith('_')) continue;
    const [x, y] = S(p);
    out += `<circle class="g-dot" cx="${x}" cy="${y}" r="2.6"/>`;
    if ((spec.hide || []).includes(n)) continue;
    let dx = p[0] - cen[0], dy = -(p[1] - cen[1]);
    const d = Math.hypot(dx, dy) || 1;
    const at = spec.labelAt?.[n];
    const [lx, ly] = at ? [x + at[0], y + at[1]] : [x + (dx / d) * 13, y + (dy / d) * 13 + 5];
    out += `<text class="g-pt" x="${r2(lx)}" y="${r2(ly)}">${esc(n)}</text>`;
  }
  for (const t of spec.texts || []) {
    const [x, y] = S(t.at);
    out += `<text class="g-len" x="${x}" y="${y}">${esc(t.text)}</text>`;
  }
  return `<svg class="fig" viewBox="0 0 ${w} ${h}" role="img" aria-label="図">${out}</svg>`;
}

// ---------- 座標平面 ----------
// spec = { x: [-5, 5], y: [-5, 5], fns: [{ f: (x) => 2*x+1, label: 'ℓ' }], pts: [{ p: [1, 3], label: 'A' }], segs: [[[x,y],[x,y]]], polys: [[[x,y],...]] }
export function plane(spec, { w = 260, h = 220 } = {}) {
  const [x0, x1] = spec.x, [y0, y1] = spec.y;
  const pad = 14;
  const k = Math.min((w - 2 * pad) / (x1 - x0), (h - 2 * pad) / (y1 - y0));
  const W = r2(k * (x1 - x0) + 2 * pad), H = r2(k * (y1 - y0) + 2 * pad);
  const S = ([x, y]) => [r2(pad + (x - x0) * k), r2(H - pad - (y - y0) * k)];
  let out = '';
  if (spec.grid !== false) {
    for (let x = Math.ceil(x0); x <= x1; x++) { const [a] = S([x, 0]); out += `<line class="p-grid" x1="${a}" y1="${pad}" x2="${a}" y2="${r2(H - pad)}"/>`; }
    for (let y = Math.ceil(y0); y <= y1; y++) { const [, b] = S([0, y]); out += `<line class="p-grid" x1="${pad}" y1="${b}" x2="${r2(W - pad)}" y2="${b}"/>`; }
  }
  const [ax0, ay] = S([x0, 0]), [ax1] = S([x1, 0]);
  const [axx, ty] = S([0, y1]), [, by] = S([0, y0]);
  out += `<line class="p-axis" x1="${ax0}" y1="${ay}" x2="${ax1 + 6}" y2="${ay}"/><line class="p-axis" x1="${axx}" y1="${by}" x2="${axx}" y2="${ty - 6}"/>`;
  out += `<text class="p-lab" x="${ax1 + 4}" y="${ay - 6}">x</text><text class="p-lab" x="${axx + 6}" y="${ty}">y</text><text class="p-lab" x="${axx - 10}" y="${ay + 12}">O</text>`;
  for (const t of spec.ticks || []) {
    const [a, b] = S(t.at);
    out += `<text class="p-num" x="${a}" y="${b}">${esc(t.text)}</text>`;
  }
  for (const pg of spec.polys || []) out += `<polygon class="g-fill" points="${pg.map((p) => S(p).join(',')).join(' ')}"/>`;
  for (const fn of spec.fns || []) {
    const pts = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const x = x0 + ((x1 - x0) * i) / steps;
      if (fn.dom && (x < fn.dom[0] - 1e-9 || x > fn.dom[1] + 1e-9)) continue;
      const y = fn.f(x);
      if (!Number.isFinite(y) || y < y0 - 1 || y > y1 + 1) { pts.push(null); continue; }
      pts.push(S([x, Math.max(y0 - 0.5, Math.min(y1 + 0.5, y))]));
    }
    let d = '', pen = false;
    for (const p of pts) {
      if (!p) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'} ${p[0]} ${p[1]} `;
      pen = true;
    }
    out += `<path class="p-fn${fn.dash ? ' dash' : ''}" d="${d}"/>`;
    if (fn.label) {
      const lx = fn.labelX ?? x1 - (x1 - x0) * 0.12;
      const [a, b] = S([lx, fn.f(lx)]);
      out += `<text class="p-flab" x="${a + 4}" y="${b - 6}">${esc(fn.label)}</text>`;
    }
  }
  for (const [p, q] of spec.segs || []) {
    const [a, b] = S(p), [c, d] = S(q);
    out += `<line class="g-line dash" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`;
  }
  for (const pt of spec.pts || []) {
    const [a, b] = S(pt.p);
    out += `<circle class="g-dot big" cx="${a}" cy="${b}" r="3.4"/>`;
    if (pt.label) out += `<text class="g-pt" x="${a + (pt.dx ?? 7)}" y="${b + (pt.dy ?? -7)}">${esc(pt.label)}</text>`;
  }
  return `<svg class="fig plane" viewBox="0 0 ${W} ${H}" role="img" aria-label="座標平面">${out}</svg>`;
}

// ---------- 箱ひげ図 ----------
export function boxplot(rows, { lo, hi, step = 1, w = 300 } = {}) {
  const pad = 20, rowH = 38;
  const h = rows.length * rowH + 30;
  const X = (v) => r2(pad + ((v - lo) / (hi - lo)) * (w - 2 * pad));
  let out = '';
  for (let v = lo; v <= hi + 1e-9; v += step) {
    out += `<line class="p-grid" x1="${X(v)}" y1="6" x2="${X(v)}" y2="${h - 22}"/><text class="p-num" x="${X(v)}" y="${h - 8}">${v}</text>`;
  }
  rows.forEach((r, i) => {
    const y = 14 + i * rowH, m = y + 12;
    const [mn, q1, q2, q3, mx] = r.s;
    out += `<line class="g-line" x1="${X(mn)}" y1="${m}" x2="${X(q1)}" y2="${m}"/><line class="g-line" x1="${X(q3)}" y1="${m}" x2="${X(mx)}" y2="${m}"/>`;
    out += `<line class="g-line" x1="${X(mn)}" y1="${m - 6}" x2="${X(mn)}" y2="${m + 6}"/><line class="g-line" x1="${X(mx)}" y1="${m - 6}" x2="${X(mx)}" y2="${m + 6}"/>`;
    out += `<rect class="g-box" x="${X(q1)}" y="${y}" width="${r2(X(q3) - X(q1))}" height="24"/><line class="g-line" x1="${X(q2)}" y1="${y}" x2="${X(q2)}" y2="${y + 24}"/>`;
    if (r.label) out += `<text class="g-len" x="${X(lo) + 2}" y="${y - 2}" text-anchor="start">${esc(r.label)}</text>`;
  });
  return `<svg class="fig" viewBox="0 0 ${w} ${h}" role="img" aria-label="箱ひげ図">${out}</svg>`;
}

// ---------- 立体（見取図） ----------
// kind: 'cuboid' | 'cylinder' | 'cone' | 'sphere' | 'prism3' | 'pyramid4'
export function solid(kind, labels = {}, { w = 220, h = 170 } = {}) {
  let out = '';
  const t = (x, y, s) => (s ? `<text class="g-len" x="${x}" y="${y}">${esc(s)}</text>` : '');
  const L = (x1, y1, x2, y2, dash) => `<line class="g-line${dash ? ' dash' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  if (kind === 'cuboid' || kind === 'prism3' || kind === 'pyramid4') {
    let F = [[40, 140], [140, 140], [140, 60], [40, 60]];
    let dx = 50, dy = -34;
    // 直方体で dims: [よこ AB, おくゆき AD, 高さ AE] があれば、その比で描く（見取図の決まりで、おくゆきは半分の長さ・斜め約34°）
    let pos = { a: [90, 158], b: [178, 120], c: [24, 104] };
    if (kind === 'cuboid' && labels.dims) {
      const [da, db, dc] = labels.dims;
      const cs = 0.83, sn = 0.56;
      const k = Math.min(150 / (da + 0.5 * db * cs), 118 / (dc + 0.5 * db * sn));
      const W = da * k, H = dc * k, D = Math.max(0.5 * db * k, 24); // おくゆきが短すぎると斜めの辺が見えないので最低 24px
      dx = D * cs; dy = -D * sn;
      const x0 = (w - (W + dx)) / 2, y0 = h - 24;
      F = [[x0, y0], [x0 + W, y0], [x0 + W, y0 - H], [x0, y0 - H]];
      pos = { a: [x0 + W / 2, y0 + 17], b: [Math.min(x0 + W + dx / 2 + 22, w - 16), y0 + dy / 2 + 21], c: [x0 - 20, y0 - H / 2 + 4] };
    }
    const B = F.map(([x, y]) => [x + dx, y + dy]);
    if (kind === 'cuboid') {
      out += `<polygon class="g-fill" points="${F.map((p) => p.join(',')).join(' ')}"/>`;
      out += L(...F[0], ...F[1]) + L(...F[1], ...F[2]) + L(...F[2], ...F[3]) + L(...F[3], ...F[0]);
      out += L(...F[1], ...B[1]) + L(...F[2], ...B[2]) + L(...F[3], ...B[3]) + L(...B[1], ...B[2]) + L(...B[2], ...B[3]);
      out += L(...F[0], ...B[0], true) + L(...B[0], ...B[1], true) + L(...B[0], ...B[3], true);
      if (labels.diag) out += L(...F[0], ...B[2], true).replace('g-line dash', 'g-line hl');
      out += t(...pos.a, labels.a) + t(...pos.b, labels.b) + t(...pos.c, labels.c);
      // 直方体 ABCD-EFGH（上の面 ABCD、A の真下が E）
      if (labels.v) {
        const V = { A: B[3], B: B[2], C: F[2], D: F[3], E: B[0], F: B[1], G: F[1], H: F[0] };
        const off = { A: [-8, -6], B: [8, -6], C: [10, 4], D: [-10, -2], E: [-10, -4], F: [12, labels.dims ? 2 : 12], G: [10, 12], H: [-10, 12] };
        for (const [n, p] of Object.entries(V)) out += `<text class="g-pt" x="${p[0] + off[n][0]}" y="${p[1] + off[n][1]}">${n}</text>`;
        if (labels.hl) for (const [a, b] of labels.hl) out += L(...V[a], ...V[b]).replace('g-line', 'g-line hl');
      }
    } else if (kind === 'prism3') {
      const T = [[40, 140], [150, 140], [80, 112]];
      const up = 80;
      const U = T.map(([x, y]) => [x, y - up]);
      out += `<polygon class="g-fill" points="${[T[0], T[1], U[1], U[0]].map((p) => p.join(',')).join(' ')}"/>`;
      out += L(...T[0], ...T[1]) + L(...T[1], ...T[2], true) + L(...T[2], ...T[0], true);
      out += L(...U[0], ...U[1]) + L(...U[1], ...U[2]) + L(...U[2], ...U[0]);
      out += L(...T[0], ...U[0]) + L(...T[1], ...U[1]) + L(...T[2], ...U[2], true);
      out += t(95, 158, labels.a) + t(170, 100, labels.h);
    } else {
      const base = [[40, 140], [140, 140], [180, 112], [80, 112]];
      const A = [110, 30];
      out += `<polygon class="g-fill" points="${[base[0], base[1], A].map((p) => p.join(',')).join(' ')}"/>`;
      out += L(...base[0], ...base[1]) + L(...base[1], ...base[2]) + L(...base[2], ...base[3], true) + L(...base[3], ...base[0], true);
      for (const p of base) out += L(...p, ...A, p === base[3]);
      out += L(110, 126, ...A, true).replace('dash', 'dash hl');
      out += t(90, 158, labels.a) + t(122, 84, labels.h);
    }
  } else if (kind === 'cylinder' || kind === 'cone') {
    const cx = 110, top = 34, bot = 134, rx = 62, ry = 16;
    if (kind === 'cylinder') {
      out += `<rect class="g-fill" x="${cx - rx}" y="${top}" width="${rx * 2}" height="${bot - top}"/>`;
      out += `<ellipse class="g-line" cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}"/>`;
      out += L(cx - rx, top, cx - rx, bot) + L(cx + rx, top, cx + rx, bot);
    } else {
      out += `<polygon class="g-fill" points="${cx},${top - 12} ${cx - rx},${bot} ${cx + rx},${bot}"/>`;
      out += L(cx, top - 12, cx - rx, bot) + L(cx, top - 12, cx + rx, bot) + L(cx, top - 12, cx, bot, true);
    }
    out += `<path class="g-line" d="M ${cx - rx} ${bot} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bot}"/><path class="g-line dash" d="M ${cx - rx} ${bot} A ${rx} ${ry} 0 0 1 ${cx + rx} ${bot}"/>`;
    out += L(cx, bot, cx + rx, bot, true) + `<circle class="g-dot" cx="${cx}" cy="${bot}" r="2.4"/>`;
    out += t(cx + rx / 2, bot + 18, labels.r) + t(cx + rx + 18, (top + bot) / 2, labels.h);
    if (labels.l) out += t(cx - rx / 2 - 14, (top + bot) / 2, labels.l);
  } else if (kind === 'sphere') {
    const cx = 110, cy = 86, r = 64;
    out += `<circle class="g-fill" cx="${cx}" cy="${cy}" r="${r}"/><circle class="g-line" cx="${cx}" cy="${cy}" r="${r}"/>`;
    out += `<path class="g-line" d="M ${cx - r} ${cy} A ${r} 18 0 0 0 ${cx + r} ${cy}"/><path class="g-line dash" d="M ${cx - r} ${cy} A ${r} 18 0 0 1 ${cx + r} ${cy}"/>`;
    out += L(cx, cy, cx + r, cy, true) + `<circle class="g-dot" cx="${cx}" cy="${cy}" r="2.4"/>` + t(cx + r / 2, cy - 8, labels.r);
  }
  return `<svg class="fig" viewBox="0 0 ${w} ${h}" role="img" aria-label="立体の見取図">${out}</svg>`;
}
