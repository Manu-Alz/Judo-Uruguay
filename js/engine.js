/* =========================================================
   Motor de animación de Judo Uruguay
   Dos muñecos (tori = azul, uke = blanco) con esqueleto 2D.
   Vista lateral para las proyecciones, vista cenital para el suelo.
   ========================================================= */
(() => {
"use strict";
const R = Math.PI / 180;
const LEN = { tor: .82, neck: .1, head: .19, ua: .45, fa: .42, th: .54, sh: .54, foot: .17 };
const TLEN = { tor: .8, head: .26, ua: .42, fa: .4, th: .52, sh: .5 };

/* ---------- Poses base ---------- */
const SIDE_KEYS = ["x", "y", "t", "h", "d", "gn", "gf"];
const SIDE_ARR = ["an", "af", "ln", "lf"];
const TOP_KEYS = ["x", "y", "t", "gl", "gr"];
const TOP_ARR = ["al", "ar", "ll", "lr"];

const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => k * k * (3 - 2 * k);

/* ---------- Construcción de una animación ---------- */
function build(def) {
  const top = def.view === "top";
  const keys = top ? TOP_KEYS : SIDE_KEYS, arrs = top ? TOP_ARR : SIDE_ARR;
  const base = def.base;
  const state = { T: JSON.parse(JSON.stringify(base.T)), U: JSON.parse(JSON.stringify(base.U)) };
  const kf = [];
  for (const f of def.frames) {
    const out = { t: f.t, n: f.n || "", e: f.e };
    for (const who of ["T", "U"]) {
      const over = f[who] || {};
      const p = state[who];
      for (const k of Object.keys(over)) p[k] = Array.isArray(over[k]) ? over[k].slice() : over[k];
      out[who] = JSON.parse(JSON.stringify(p));
      out[who].auto = !top && !("y" in over);
    }
    kf.push(out);
  }
  /* resolver y automático (apoyado en el suelo) en cada cuadro */
  if (!top) for (const k of kf) for (const who of ["T", "U"]) if (k[who].auto) k[who].y = 0, k[who].y = -lowest(k[who]);
  const A = { ...def, kf, top, keys, arrs, dur: kf[kf.length - 1].t, hold: def.hold ?? .9 };
  return A;
}

/* ---------- Interpolación (Hermite suave) ---------- */
function sample(A, tt) {
  const kf = A.kf, n = kf.length;
  let i = 0;
  while (i < n - 2 && tt > kf[i + 1].t) i++;
  const a = kf[i], b = kf[Math.min(i + 1, n - 1)];
  const span = Math.max(b.t - a.t, 1e-6);
  let k = Math.min(Math.max((tt - a.t) / span, 0), 1);
  const prev = kf[Math.max(i - 1, 0)], next = kf[Math.min(i + 2, n - 1)];
  const res = {};
  for (const who of ["T", "U"]) {
    const P = {};
    const h = (va, vb, vp, vn) => {
      const m0 = i === 0 ? 0 : (vb - vp) / (b.t - prev.t) * span * .6;
      const m1 = i + 1 >= n - 1 ? 0 : (vn - va) / (next.t - a.t) * span * .6;
      const k2 = k * k, k3 = k2 * k;
      return (2 * k3 - 3 * k2 + 1) * va + (k3 - 2 * k2 + k) * m0 + (-2 * k3 + 3 * k2) * vb + (k3 - k2) * m1;
    };
    for (const key of A.keys) P[key] = h(a[who][key], b[who][key], prev[who][key], next[who][key]);
    for (const key of A.arrs) P[key] = a[who][key].map((_, j) => h(a[who][key][j], b[who][key][j], prev[who][key][j], next[who][key][j]));
    P.auto = a[who].auto && b[who].auto;
    P.gk = a[who].gk;
    res[who] = P;
  }
  return res;
}

/* ---------- Cinemática (vista lateral) ---------- */
function sidePts(p) {
  const d = p.d, sn = (a) => d * Math.sin(a * R), cs = (a) => Math.cos(a * R);
  const H = [p.x, p.y];
  const S = [H[0] + LEN.tor * sn(p.t), H[1] + LEN.tor * cs(p.t)];
  const ha = p.t + p.h;
  const N = [S[0] + LEN.neck * sn(ha), S[1] + LEN.neck * cs(ha)];
  const C = [N[0] + LEN.head * sn(ha), N[1] + LEN.head * cs(ha)];
  const limb = (o, a1, a2, l1, l2) => {
    const m = [o[0] + l1 * sn(a1), o[1] - l1 * cs(a1)];
    return [m, [m[0] + l2 * sn(a2), m[1] - l2 * cs(a2)]];
  };
  const arms = [p.an, p.af].map(([a1, a2]) => limb(S, a1, a2, LEN.ua, LEN.fa));
  const legs = [p.ln, p.lf].map(([a1, a2]) => {
    const [k, f] = limb(H, a1, a2, LEN.th, LEN.sh);
    return [k, f, [f[0] + LEN.foot * sn(a2 + 90), f[1] - LEN.foot * cs(a2 + 90)]];
  });
  return { H, S, N, C, arms, legs, d };
}
function lowest(p) {
  const q = sidePts(p);
  let m = Math.min(q.H[1] - .13, q.S[1] - .13, q.C[1] - .17);
  for (const l of q.legs) m = Math.min(m, l[0][1] - .08, l[1][1] - .06, l[2][1] - .05);
  for (const a of q.arms) m = Math.min(m, a[0][1] - .06, a[1][1] - .05);
  return m;
}
function groundFix(p) {
  const lo = lowest(p);
  if (p.auto) p.y -= lo; else if (lo < 0) p.y -= lo;
}

/* landmarks sobre el otro muñeco (vista lateral) */
function torsoPt(q, f, off, p) {
  const tx = q.S[0] - q.H[0], ty = q.S[1] - q.H[1];
  const L = Math.hypot(tx, ty) || 1;
  const nx = ty / L * (p.d >= 0 ? 1 : 1), ny = -tx / L;           /* perpendicular hacia el frente */
  const sgn = Math.sign(p.d) || 1;
  const fx = (ty / L) * sgn, fy = (-tx / L) * sgn;
  return [q.H[0] + tx * f + fx * off * sgn * sgn, q.H[1] + ty * f + fy * off];
}
function landmark(kind, q, p) {
  switch (kind) {
    case "lapel": return torsoPt(q, .78, .11, p);
    case "collar": return torsoPt(q, .96, .06, p);
    case "belt": return torsoPt(q, .06, .15, p);
    case "back": return torsoPt(q, .55, -.14, p);
    case "backbelt": return torsoPt(q, .12, -.14, p);
    case "sleeve": return q.arms[0][0];
    case "sleeveF": return q.arms[1][0];
    case "neck": return q.N;
    case "head": return q.C;
    case "thigh": return q.legs[0][0];
    case "knee": return q.legs[1][0];
    default: return q.S;
  }
}
function ik(S, T, l1, l2, down = true) {
  const dx = T[0] - S[0], dy = T[1] - S[1];
  const dist = Math.hypot(dx, dy) || 1e-6;
  const c = Math.min(Math.max(dist, Math.abs(l1 - l2) + .001), l1 + l2 - .001);
  const a = (l1 * l1 - l2 * l2 + c * c) / (2 * c);
  const h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
  const ux = dx / dist, uy = dy / dist;
  const px = S[0] + ux * a, py = S[1] + uy * a;
  const e1 = [px - uy * h, py + ux * h], e2 = [px + uy * h, py - ux * h];
  const e = down ? (e1[1] < e2[1] ? e1 : e2) : (e1[1] > e2[1] ? e1 : e2);
  return [e, [S[0] + ux * c, S[1] + uy * c]];
}

/* ---------- Dibujo ---------- */
const COL = {
  sky: "#e9eef7", sky2: "#f6f8fc", mat: "#b8c79a", matLine: "#a3b385", matDark: "#8fa070",
  tori: "#2347c4", toriDk: "#16308f", uke: "#fbfbf8", ukeDk: "#8c95a8",
  skin: "#efc7a1", hair: "#241b16", line: "#0e1630",
};

function cap(ctx, a, b, w, fill, edge, sc) {
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
  ctx.strokeStyle = edge; ctx.lineWidth = (w + .035) * sc; ctx.stroke();
  ctx.strokeStyle = fill; ctx.lineWidth = w * sc; ctx.stroke();
}

function drawBackdropSide(ctx, W, H, gy, sc) {
  const g = ctx.createLinearGradient(0, 0, 0, gy);
  g.addColorStop(0, COL.sky2); g.addColorStop(1, COL.sky);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COL.mat; ctx.fillRect(0, gy, W, H - gy);
  ctx.fillStyle = COL.matDark; ctx.fillRect(0, gy, W, Math.max(2, sc * .05));
  ctx.strokeStyle = COL.matLine; ctx.lineWidth = 1;
  for (let x = W / 2 - sc * 6; x < W + sc * 6; x += sc * 1.0) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(W / 2 + (x - W / 2) * 2.2, H); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(0, gy + (H - gy) * .45); ctx.lineTo(W, gy + (H - gy) * .45); ctx.stroke();
}

function drawFigSide(ctx, q, P, who, belt, tx, sc, grips) {
  const isT = who === "T";
  const fill = isT ? COL.tori : COL.uke, edge = isT ? COL.toriDk : COL.ukeDk;
  const lineE = isT ? COL.toriDk : "#6b7488";
  const X = (v) => tx(v);
  const seg = (a, b, w) => cap(ctx, X(a), X(b), w, fill, lineE, sc);
  /* piernas lejana / brazo lejano */
  const [lN, lF] = q.legs, [aN, aF] = q.arms;
  seg(q.H, lF[0], .17); seg(lF[0], lF[1], .13); seg(lF[1], lF[2], .09);
  seg(q.S, aF[0], .11); seg(aF[0], aF[1], .09);
  ctx.fillStyle = COL.skin; dot(ctx, X(aF[1]), .055 * sc);
  /* tronco */
  seg(q.H, q.S, .27);
  /* cinturón */
  const tv = [q.S[0] - q.H[0], q.S[1] - q.H[1]], tl = Math.hypot(...tv) || 1;
  const nv = [-tv[1] / tl, tv[0] / tl];
  const b0 = [q.H[0] + tv[0] * .08 + nv[0] * .15, q.H[1] + tv[1] * .08 + nv[1] * .15];
  const b1 = [q.H[0] + tv[0] * .08 - nv[0] * .15, q.H[1] + tv[1] * .08 - nv[1] * .15];
  ctx.lineCap = "butt"; ctx.beginPath(); ctx.moveTo(...X(b0)); ctx.lineTo(...X(b1));
  ctx.strokeStyle = belt; ctx.lineWidth = .07 * sc; ctx.stroke();
  /* cuello y cabeza */
  seg(q.S, q.N, .09);
  const hc = X(q.C), hr = LEN.head * sc, dd = Math.sign(q.d) || 1;
  ctx.fillStyle = COL.hair; ctx.beginPath(); ctx.arc(hc[0], hc[1], hr * 1.04, 0, 7); ctx.fill();
  ctx.fillStyle = COL.skin; ctx.beginPath(); ctx.arc(hc[0] + dd * hr * .2, hc[1] + hr * .14, hr * .86, 0, 7); ctx.fill();
  /* pierna cercana / brazo cercano */
  seg(q.H, lN[0], .17); seg(lN[0], lN[1], .13); seg(lN[1], lN[2], .09);
  seg(q.S, aN[0], .11); seg(aN[0], aN[1], .09);
  ctx.fillStyle = COL.skin; dot(ctx, X(aN[1]), .055 * sc);
}
function dot(ctx, p, r) { ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); }

/* vista cenital */
function topPts(p) {
  const dir = (a) => [Math.cos(a * R), Math.sin(a * R)];
  const H = [p.x, p.y], dt = dir(p.t), pr = dir(p.t + 90);
  const N = [H[0] + dt[0] * TLEN.tor, H[1] + dt[1] * TLEN.tor];
  const C = [N[0] + dt[0] * TLEN.head, N[1] + dt[1] * TLEN.head];
  const mk = (o, a1, a2, l1, l2) => { const e = [o[0] + l1 * Math.cos(a1 * R), o[1] + l1 * Math.sin(a1 * R)]; return [e, [e[0] + l2 * Math.cos(a2 * R), e[1] + l2 * Math.sin(a2 * R)]]; };
  const sh = [[N[0] + pr[0] * .2 - dt[0] * .05, N[1] + pr[1] * .2 - dt[1] * .05], [N[0] - pr[0] * .2 - dt[0] * .05, N[1] - pr[1] * .2 - dt[1] * .05]];
  const hp = [[H[0] + pr[0] * .12, H[1] + pr[1] * .12], [H[0] - pr[0] * .12, H[1] - pr[1] * .12]];
  const arms = [mk(sh[0], p.al[0], p.al[1], TLEN.ua, TLEN.fa), mk(sh[1], p.ar[0], p.ar[1], TLEN.ua, TLEN.fa)];
  const legs = [mk(hp[0], p.ll[0], p.ll[1], TLEN.th, TLEN.sh), mk(hp[1], p.lr[0], p.lr[1], TLEN.th, TLEN.sh)];
  return { H, N, C, sh, hp, arms, legs, t: p.t };
}
function topLandmark(kind, q) {
  const mid = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  switch (kind) {
    case "collar": return mid(q.H, q.N, 1);
    case "chest": return mid(q.H, q.N, .75);
    case "belt": return q.H;
    case "head": return q.C;
    case "shL": return q.sh[0]; case "shR": return q.sh[1];
    case "elL": return q.arms[0][0]; case "elR": return q.arms[1][0];
    case "wrL": return q.arms[0][1]; case "wrR": return q.arms[1][1];
    case "kneeL": return q.legs[0][0]; case "kneeR": return q.legs[1][0];
    case "ankL": return q.legs[0][1]; case "ankR": return q.legs[1][1];
    case "hipL": return q.hp[0]; case "hipR": return q.hp[1];
    default: return q.N;
  }
}
function drawFigTop(ctx, q, who, belt, tx, sc) {
  const isT = who === "T";
  const fill = isT ? COL.tori : COL.uke, lineE = isT ? COL.toriDk : "#6b7488";
  const seg = (a, b, w) => cap(ctx, tx(a), tx(b), w, fill, lineE, sc);
  for (const l of q.legs) { seg(q.H, l[0], .15); seg(l[0], l[1], .12); }
  seg(q.H, q.N, .36);
  const dt = [Math.cos(q.t * R), Math.sin(q.t * R)];
  const b0 = [q.H[0] + dt[0] * .08 - dt[1] * .19, q.H[1] + dt[1] * .08 + dt[0] * .19];
  const b1 = [q.H[0] + dt[0] * .08 + dt[1] * .19, q.H[1] + dt[1] * .08 - dt[0] * .19];
  ctx.lineCap = "butt"; ctx.beginPath(); ctx.moveTo(...tx(b0)); ctx.lineTo(...tx(b1)); ctx.strokeStyle = belt; ctx.lineWidth = .07 * sc; ctx.stroke();
  for (const a of q.arms) { seg(q.sh[q.arms.indexOf(a)], a[0], .12); seg(a[0], a[1], .1); ctx.fillStyle = COL.skin; dot(ctx, tx(a[1]), .06 * sc); }
  const hc = tx(q.C), hr = LEN.head * sc;
  ctx.fillStyle = COL.hair; ctx.beginPath(); ctx.arc(hc[0], hc[1], hr * 1.05, 0, 7); ctx.fill();
  ctx.fillStyle = COL.skin; ctx.beginPath(); ctx.arc(hc[0] - (Math.cos(q.t * R)) * hr * .2, hc[1] + (Math.sin(q.t * R)) * hr * .2, hr * .78, 0, 7); ctx.fill();
}

/* ---------- Frame completo ---------- */
function frame(A, tt) {
  const S = sample(A, tt);
  if (A.top) return { S, T: topPts(S.T), U: topPts(S.U) };
  groundFix(S.T); groundFix(S.U);
  let T = sidePts(S.T), U = sidePts(S.U);
  /* agarres (IK de brazos) */
  const gk = A.grips || {};
  const apply = (fig, P, q, other, oP, kinds) => {
    if (!kinds) return;
    const weights = [P.gn, P.gf];
    [0, 1].forEach((i) => {
      const w = Math.min(Math.max(weights[i], 0), 1);
      if (w <= 0.001) return;
      const tgt = landmark(kinds[i], other, oP);
      const free = q.arms[i][1];
      const goal = [lerp(free[0], tgt[0], w), lerp(free[1], tgt[1], w)];
      q.arms[i] = ik(q.S, goal, LEN.ua, LEN.fa, true);
    });
  };
  const T0 = T, U0 = U;
  apply("T", S.T, T, U0, S.U, gk.T);
  apply("U", S.U, U, T0, S.T, gk.U);
  return { S, T, U };
}

function topFrame(A, tt) {
  const F = frame(A, tt);
  const gk = A.grips || {};
  const doIt = (q, P, other, kinds, bends) => {
    if (!kinds) return;
    [["gl", 0], ["gr", 1]].forEach(([key, i]) => {
      const w = Math.min(Math.max(P[key] ?? 0, 0), 1);
      if (w <= .001 || !kinds[i]) return;
      const tgt = topLandmark(kinds[i], other);
      const free = q.arms[i][1];
      const goal = [lerp(free[0], tgt[0], w), lerp(free[1], tgt[1], w)];
      const s = q.sh[i];
      const dx = goal[0] - s[0], dy = goal[1] - s[1], dist = Math.hypot(dx, dy) || 1e-6;
      const l1 = TLEN.ua, l2 = TLEN.fa;
      const c = Math.min(Math.max(dist, Math.abs(l1 - l2) + .001), l1 + l2 - .001);
      const a = (l1 * l1 - l2 * l2 + c * c) / (2 * c), h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
      const ux = dx / dist, uy = dy / dist, sg = bends[i];
      q.arms[i] = [[s[0] + ux * a - uy * h * sg, s[1] + uy * a + ux * h * sg], [s[0] + ux * c, s[1] + uy * c]];
    });
  };
  const T0 = F.T, U0 = F.U;
  doIt(F.T, F.S.T, U0, gk.T, A.bendT || [1, -1]);
  doIt(F.U, F.S.U, T0, gk.U, A.bendU || [1, -1]);
  return F;
}

/* ---------- API de dibujo ---------- */
function draw(ctx, A, tt, W, H, opts = {}) {
  ctx.clearRect(0, 0, W, H);
  if (A.top) {
    const F = topFrame(A, tt);
    const sc = W / 4.6, cx = W / 2, cy = H / 2 + (A.cy || 0) * sc;
    const tx = (p) => [cx + (p[0] - (A.cx || 0)) * sc, cy - p[1] * sc];
    ctx.fillStyle = COL.mat; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = COL.matLine; ctx.lineWidth = 1.5;
    for (let x = cx % (sc * 1.5); x < W; x += sc * 1.5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = cy % (sc * 1.5); y < H; y += sc * 1.5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    drawFigTop(ctx, F.U, "U", "#ffffff", tx, sc);
    drawFigTop(ctx, F.T, "T", A.belt || "#ffffff", tx, sc);
    return;
  }
  const F = frame(A, tt);
  const sc = W / 4.5, gy = H * .82;
  const camX = A.camX || 0;
  const tx = (p) => [W / 2 + (p[0] - camX) * sc, gy - p[1] * sc];
  drawBackdropSide(ctx, W, H, gy, sc);
  for (const who of ["U", "T"]) {            /* sombras */
    const q = F[who]; const lo = Math.max(lowest(F.S[who]), 0);
    ctx.fillStyle = `rgba(30,40,20,${Math.max(.05, .22 - lo * .1)})`;
    ctx.beginPath(); ctx.ellipse(W / 2 + (q.H[0] - camX) * sc, gy + sc * .04, sc * (.55 + lo * .1), sc * .07, 0, 0, 7); ctx.fill();
  }
  drawFigSide(ctx, F.U, F.S.U, "U", "#ffffff", tx, sc);
  drawFigSide(ctx, F.T, F.S.T, "T", A.belt || "#ffffff", tx, sc);
}

function phaseAt(A, tt) {
  let idx = 0;
  for (let i = 0; i < A.kf.length; i++) if (tt >= A.kf[i].t - 1e-6) idx = i;
  return idx;
}

/* ---------- Storyboard: cuadros limpios con fantasma y flechas ---------- */
const poseAt = (A, tt) => (A.top ? topFrame(A, tt) : frame(A, tt));
function figPoints(A, F) {
  const pts = [];
  for (const who of ["T", "U"]) { const q = F[who]; pts.push(q.H, q.C, ...q.arms.flat(), ...q.legs.flat(), A.top ? q.N : q.S); }
  return pts;
}
function fitCamera(A, times, W, H, pad = .4) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const t of times) for (const p of figPoints(A, poseAt(A, t))) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  if (!A.top) y0 = Math.min(y0, -.05);
  const w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, sc: Math.min(W / w, H / h, W / 2.7) };
}
const ST = { toriFill: "#2c58e0", toriEdge: "#0d1b52", ukeFill: "#ffffff", ukeEdge: "#2a3350" };
function drawFigStory(ctx, q, P, who, belt, tx, sc) {
  const isT = who === "T", fill = isT ? ST.toriFill : ST.ukeFill, edge = isT ? ST.toriEdge : ST.ukeEdge;
  const X = (v) => tx(v);
  const seg = (a, b, w) => { ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(...X(a)); ctx.lineTo(...X(b)); ctx.strokeStyle = edge; ctx.lineWidth = (w + .055) * sc; ctx.stroke(); ctx.strokeStyle = fill; ctx.lineWidth = w * sc; ctx.stroke(); };
  const [lN, lF] = q.legs, [aN, aF] = q.arms;
  seg(q.H, lF[0], .18); seg(lF[0], lF[1], .14); seg(lF[1], lF[2], .1);
  seg(q.S, aF[0], .12); seg(aF[0], aF[1], .1);
  ctx.fillStyle = COL.skin; dot(ctx, X(aF[1]), .06 * sc);
  seg(q.H, q.S, .3);
  /* solapa en V y cinturón */
  const tv = [q.S[0] - q.H[0], q.S[1] - q.H[1]], tl = Math.hypot(...tv) || 1, u = [tv[0] / tl, tv[1] / tl];
  const sg = Math.sign(P.d) || 1, fr = [u[1] * sg, -u[0] * sg];
  const v0 = [q.S[0] + fr[0] * .02, q.S[1] + fr[1] * .02], v1 = [q.H[0] + tv[0] * .3 + fr[0] * .12, q.H[1] + tv[1] * .3 + fr[1] * .12];
  ctx.beginPath(); ctx.moveTo(...X(v0)); ctx.lineTo(...X(v1)); ctx.strokeStyle = edge; ctx.globalAlpha *= .55; ctx.lineWidth = .04 * sc; ctx.stroke(); ctx.globalAlpha /= .55;
  const nv = [-u[1], u[0]], bp = [q.H[0] + tv[0] * .09, q.H[1] + tv[1] * .09];
  ctx.lineCap = "butt"; ctx.beginPath(); ctx.moveTo(...X([bp[0] + nv[0] * .17, bp[1] + nv[1] * .17])); ctx.lineTo(...X([bp[0] - nv[0] * .17, bp[1] - nv[1] * .17]));
  ctx.strokeStyle = edge; ctx.lineWidth = .11 * sc; ctx.stroke(); ctx.strokeStyle = belt; ctx.lineWidth = .07 * sc; ctx.stroke();
  seg(q.S, q.N, .1);
  const hc = X(q.C), hr = LEN.head * sc;
  ctx.fillStyle = COL.hair; ctx.beginPath(); ctx.arc(hc[0], hc[1], hr * 1.06, 0, 7); ctx.fill();
  ctx.fillStyle = COL.skin; ctx.beginPath(); ctx.arc(hc[0] + sg * hr * .2, hc[1] + hr * .14, hr * .86, 0, 7); ctx.fill();
  seg(q.H, lN[0], .18); seg(lN[0], lN[1], .14); seg(lN[1], lN[2], .1);
  seg(q.S, aN[0], .12); seg(aN[0], aN[1], .1);
  ctx.fillStyle = COL.skin; dot(ctx, X(aN[1]), .06 * sc);
}
function arrow(ctx, a, b, color, sc, tx) {
  const A = tx(a), B = tx(b), dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy);
  if (len < sc * .32) return;
  const nx = -dy / len, ny = dx / len, off = len * .22;
  const C = [(A[0] + B[0]) / 2 + nx * off, (A[1] + B[1]) / 2 + ny * off];
  ctx.save(); ctx.lineCap = "round"; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(2.6, sc * .06);
  ctx.setLineDash([sc * .13, sc * .1]); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(C[0], C[1], B[0], B[1]); ctx.stroke(); ctx.setLineDash([]);
  const ang = Math.atan2(B[1] - C[1], B[0] - C[0]), hs = Math.max(9, sc * .2);
  ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(B[0] - hs * Math.cos(ang - .45), B[1] - hs * Math.sin(ang - .45)); ctx.lineTo(B[0] - hs * Math.cos(ang + .45), B[1] - hs * Math.sin(ang + .45)); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawStory(ctx, A, tt, prev, W, H, cam, o = {}) {
  const sc = cam.sc, tx = (p) => [W / 2 + (p[0] - cam.cx) * sc, H / 2 - (p[1] - cam.cy) * sc];
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#f4f6fb"; ctx.fillRect(0, 0, W, H);
  if (A.top) {
    ctx.fillStyle = "#e3e9d8"; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = "#d2dbc4"; ctx.lineWidth = 1.5;
    const g = sc * 1.4, ox = (W / 2 - cam.cx * sc) % g, oy = (H / 2 + cam.cy * sc) % g;
    for (let x = ox; x < W; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = oy; y < H; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  } else {
    const gy = H / 2 + cam.cy * sc;
    ctx.fillStyle = "#dfe6f1"; ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = "#c3cde0"; ctx.fillRect(0, gy, W, Math.max(2, sc * .04));
  }
  const pose = (t, alpha) => {
    const F = poseAt(A, t); ctx.globalAlpha = alpha;
    if (A.top) { drawFigTop(ctx, F.U, "U", "#ffffff", tx, sc); drawFigTop(ctx, F.T, "T", A.belt || "#ffffff", tx, sc); }
    else { drawFigStory(ctx, F.U, F.S.U, "U", "#ffffff", tx, sc); drawFigStory(ctx, F.T, F.S.T, "T", A.belt || "#ffffff", tx, sc); }
    ctx.globalAlpha = 1; return F;
  };
  const Fp = prev != null && !o.thumb ? pose(prev, .2) : null;
  const Fc = pose(tt, 1);
  if (Fp) {
    const BL = "#1f45d1", OR = "#e8930c";
    arrow(ctx, Fp.U.H, Fc.U.H, OR, sc, tx);
    arrow(ctx, Fp.T.H, Fc.T.H, BL, sc, tx);
    if (!A.top) arrow(ctx, Fp.T.legs[0][2], Fc.T.legs[0][2], BL, sc, tx);
  }
}

window.JE = { build, draw, phaseAt, COL, fitCamera, drawStory };
})();
