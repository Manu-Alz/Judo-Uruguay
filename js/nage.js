/* Plantillas de proyecciones (nage-waza), vista lateral.
   Convención: tori mira a +x (azul), uke mira a -x (blanco).
   Ángulos de brazos y piernas: 0 = hacia abajo, positivo = hacia el frente de ese muñeco.
   t = inclinación del tronco desde la vertical. d = giro (1 de frente, -1 de espaldas). */
(() => {
"use strict";
const STANCE = { y: 0, t: 8, h: -4, an: [12, 42], af: [12, 42], ln: [14, -4], lf: [-12, -16], gn: 1, gf: 1 };
const BASE = { T: { ...STANCE, x: -.6, d: 1 }, U: { ...STANCE, x: .6, d: -1 } };
const GRIPS = { T: ["sleeve", "lapel"], U: ["sleeve", "lapel"] };
const F = (t, n, T, U) => ({ t, n, T: T || {}, U: U || {} });
const mk = (frames, extra = {}) => ({ view: "side", base: BASE, grips: GRIPS, frames, ...extra });

/* ---------- 1. Con giro: cadera, hombro, mano, pierna ---------- */
function turn(o = {}) {
  const lift = o.lift ?? 1, dep = o.depth ?? 1, lean = o.lean ?? 55;
  const knee = (a) => [a * dep + 6, -14 * dep];
  const sup = { ln: [10, 6], lf: [6, 4] };
  const swing = { harai: { ln: [-105, -118] }, hane: { ln: [-98, -140] }, uchi: { ln: [-82, -104] }, block: { ln: [-84, -86] } }[o.leg] || {};
  const up = 1.45 + .55 * lift;
  const gr = o.grips ? { T: o.grips, U: GRIPS.U } : GRIPS;
  const fr = [
    F(0, "Agarre"),
    F(.55, "Kuzushi", { x: -.46, t: 4 }, { x: .5, t: 20, h: -6, ln: [22, 2] }),
    F(1.05, "Tsukuri", { x: .06, d: -.1, t: 16, ln: knee(36), lf: knee(32) }, { x: .46, t: 42, ln: [10, -4], lf: [-4, -10] }),
    F(1.5, "Kake", { x: -.04, d: -1, t: lean, ...sup, ...swing }, { x: .02, y: up, t: 100, ln: [-30, -50], lf: [-46, -60], an: [60, 20], af: [60, 20], gn: .7, gf: .7 }),
    F(1.95, "", { x: -.14, d: -1, t: lean + 8, ...sup, ...swing }, { x: -.5, y: up - .1, t: 175, ln: [168, 176], lf: [160, 170] }),
    F(2.4, "Ippon", o.dive ? { x: -.7, d: -1, t: 84, ln: [30, 60], lf: [26, 56], gn: .4, gf: 0 } : { x: -.3, d: -1, t: 28, ln: [4, 0], lf: [-4, -4] },
      { x: -1.5, t: 268, ln: [92, 92], lf: [88, 90], an: [72, 76], af: [96, 100], gn: 0, gf: 0 }),
    F(3.0, "", o.dive ? {} : { x: -.35, d: -1, t: 10 }, {}),
  ];
  return mk(fr, { camX: -.45, grips: gr });
}

/* ---------- 2. Siegas y barridos: uke cae hacia atrás ---------- */
const REAP = {
  outer: { a: [78, 84], b: [125, 150], name: "Kake" },
  inner: { a: [20, 40], b: [60, 95], name: "Kake" },
  smallOuter: { a: [40, 60], b: [85, 115], name: "Kake" },
  smallInner: { a: [30, 52], b: [60, 90], name: "Kake" },
  hook: { a: [52, 62], b: [30, 20], name: "Kake" },
  wheel: { a: [70, 78], b: [120, 140], name: "Kake" },
  drop: { a: [80, 86], b: [96, 118], name: "Kake" },
};
function reap(o = {}) {
  const r = REAP[o.kind || "outer"];
  const step = o.step ?? .14;
  const fr = [
    F(0, "Agarre"),
    F(.5, "Kuzushi", { x: -.46, t: 12 }, { x: .64, t: -8, ln: [8, 0] }),
    F(1.0, "Tsukuri", { x: step, t: 22, ln: [16, 2], lf: [-8, -6] }, { x: .68, t: -16, h: 6 }),
    F(1.4, "Kake", { x: step + .1, t: 28, ln: r.a, an: [60, 70] }, { x: .8, y: 1.15, t: -42, ln: [30, 55], lf: [10, 25], gn: .6, gf: .6 }),
    F(1.8, "", { x: step + .16, t: 34, ln: r.b }, { x: 1.15, y: 1.25, t: -78, ln: [100, 130], lf: [90, 120], gn: .3, gf: .3 }),
    F(2.3, "Ippon", { x: step + .1, t: 26, ln: [6, 2], lf: [-6, -6] }, { x: 1.65, t: -90, ln: [92, 92], lf: [88, 90], an: [78, 80], af: [96, 100], gn: 0, gf: 0 }),
    F(2.9, "", { x: step, t: 14 }, {}),
  ];
  return mk(fr, { camX: .45 });
}
function sweep(o = {}) {
  const h = o.h ?? "ankle";
  const a1 = { ankle: [32, 32], knee: [66, 70], thigh: [84, 88], block: [30, 20] }[h];
  const a2 = { ankle: [58, 72], knee: [90, 112], thigh: [112, 140], block: [30, 20] }[h];
  const fr = [
    F(0, "Agarre"),
    F(.5, "Kuzushi", { x: -.5, t: 6 }, { x: .56, t: 12, ln: [28, 8], lf: [-14, -22] }),
    F(1.0, "Tsukuri", { x: -.34, t: 12, ln: a1, lf: [-6, -8] }, { x: .5, t: 16, ln: [32, 12], lf: [-10, -18] }),
    F(1.35, "Kake", { x: -.3, t: 16, ln: a2, an: [30, 60] }, { x: .62, y: 1.1, t: -34, ln: [60, 90], lf: [50, 80], gn: .6, gf: .6 }),
    F(1.75, "", { x: -.28, ln: a2 }, { x: 1.0, y: 1.3, t: -72, ln: [110, 130], lf: [100, 120], gn: .3, gf: .3 }),
    F(2.25, "Ippon", { x: -.3, t: 10, ln: [8, 4], lf: [-6, -6] }, { x: 1.55, t: -90, ln: [92, 92], lf: [88, 90], an: [78, 80], af: [96, 100], gn: 0, gf: 0 }),
    F(2.9, "", {}, {}),
  ];
  return mk(fr, { camX: .4 });
}

/* ---------- 3. Sacrificios ---------- */
function sutemi(o = {}) {
  const side = !!o.side;
  const legs = {
    belly: { ln: [96, 158], lf: [42, -34] },
    thigh: { ln: [74, 140], lf: [42, -34] },
    hook: { ln: [60, 130], lf: [40, -30] },
    none: { ln: [48, -28], lf: [44, -30] },
    scissors: { ln: [88, 100], lf: [80, 100] },
  }[o.leg || "belly"];
  const lowT = side ? -38 : -60;
  const fr = [
    F(0, "Agarre"),
    F(.5, "Kuzushi", { x: -.5, t: -6 }, { x: .48, t: 24, h: -8, ln: [24, 4] }),
    F(1.0, "Tsukuri", { x: side ? -.7 : -.9, t: lowT, ...legs, an: [40, 70], af: [40, 70] }, { x: -.02, t: 50, ln: [22, 0], lf: [-6, -10] }),
    F(1.45, "Kake", { x: side ? -.85 : -1.0, t: lowT - 18, ln: [110, 168], lf: o.leg === "none" ? legs.lf : legs.lf }, { x: -.55, y: 1.5, t: 100, ln: [-20, -40], lf: [-30, -50], gn: .5, gf: .5 }),
    F(1.9, "", { x: side ? -.9 : -1.05, t: lowT - 20 }, { x: side ? -1.15 : -1.35, y: 1.55, t: 190, ln: [170, 176], lf: [164, 172], gn: .2, gf: .2 }),
    F(2.45, "Ippon", { ln: [90, 160], lf: [60, 40] }, { x: side ? -2.5 : -2.9, t: 268, ln: [96, 92], lf: [90, 88], an: [72, 76], af: [96, 100], gn: 0, gf: 0 }),
    F(3.0, "", {}, {}),
  ];
  return mk(fr, { camX: side ? -.9 : -1.1, hold: 1 });
}

/* ---------- 4. Tackle (dos manos / recoger) ---------- */
function tackle(o = {}) {
  const fr = [
    F(0, "Agarre"),
    F(.5, "Kuzushi", { x: -.5, t: 10 }, { x: .55, t: 6 }),
    F(1.0, "Tsukuri", { x: -.15, t: 55, ln: [50, -20], lf: [-20, -30], an: [70, 80], af: [70, 80], gn: 0, gf: 0 }, { x: .56, t: 4, gn: .5, gf: .5 }),
    F(1.4, "Kake", { x: .3, t: 72, ln: [62, -10], lf: [-12, -35], an: [90, 90], af: [90, 90], gn: 1, gf: 1 }, { x: .8, y: 1.2, t: -40, ln: [40, 60], lf: [30, 50], gn: .3, gf: .3 }),
    F(1.9, "", { x: .55, t: 66, ln: [30, -5], lf: [-10, -30] }, { x: 1.3, y: 1.15, t: -80, ln: [100, 120], lf: [90, 110], gn: 0, gf: 0 }),
    F(2.4, "Ippon", { x: .55, t: 58 }, { x: 1.75, t: -90, ln: [92, 92], lf: [88, 90], an: [78, 80], af: [96, 100], gn: 0, gf: 0 }),
    F(3.0, "", { x: .5, t: 30, ln: [8, 4], lf: [-6, -6], gn: 0, gf: 0 }, {}),
  ];
  return mk(fr, { camX: .45, grips: { T: o.grips || ["knee", "thigh"], U: GRIPS.U } });
}

/* ---------- 5. Contraataques: se agrega el ataque del uke ---------- */
function counter(inner, atk) {
  const a = inner;
  const f = a.frames.slice(1).map((x) => ({ ...x, t: x.t + 1.05 }));
  const prefix = [
    F(0, "Agarre"),
    F(.55, "Ataca el uke", { x: -.55, t: 4 }, { x: .26, t: 16, ln: atk || [-55, -70], lf: [6, 6] }),
    F(1.05, "Esquiva", { x: -.5, t: -6, ln: [42, 30], lf: [-6, -10] }, { x: .22, t: 22, ln: atk || [-70, -90] }),
  ];
  return { ...a, frames: [...prefix, ...f] };
}

/* ---------- Catálogo: técnica → animación ---------- */
const C = {
  /* Te-waza */
  "Seoi-nage": () => turn({ depth: 1.3, lean: 62 }),
  "Ippon-seoi-nage": () => turn({ depth: 1.4, lean: 68, grips: ["sleeve", "collar"] }),
  "Seoi-otoshi": () => turn({ depth: 1.7, lean: 78, lift: .5, dive: true }),
  "Tai-otoshi": () => turn({ leg: "block", depth: .5, lean: 46, lift: .7 }),
  "Kata-guruma": () => turn({ depth: 1.4, lean: 28, lift: 1.2, grips: ["knee", "sleeve"] }),
  "Sukui-nage": () => tackle({ grips: ["sleeve", "thigh"] }),
  "Obi-otoshi": () => turn({ depth: .9, lean: 50, lift: .7, grips: ["sleeve", "belt"] }),
  "Uki-otoshi": () => turn({ depth: .2, lean: 26, lift: .4 }),
  "Sumi-otoshi": () => turn({ depth: .1, lean: 18, lift: .3 }),
  "Yama-arashi": () => turn({ leg: "uchi", depth: .5, lean: 50 }),
  "Obi-tori-gaeshi": () => counter(sutemi({ leg: "none", side: true }), [-40, -60]),
  "Morote-gari": () => tackle({ grips: ["knee", "thigh"] }),
  "Kuchiki-taoshi": () => tackle({ grips: ["sleeve", "knee"] }),
  "Kibisu-gaeshi": () => counter(tackle({ grips: ["knee", "knee"] })),
  "Uchi-mata-sukashi": () => counter(reap({ kind: "inner" })),
  "Ko-uchi-gaeshi": () => counter(sweep({ h: "ankle" })),
  /* Koshi-waza */
  "Uki-goshi": () => turn({ depth: .6, lean: 40, lift: .8, grips: ["sleeve", "backbelt"] }),
  "O-goshi": () => turn({ depth: .9, lean: 50, grips: ["sleeve", "backbelt"] }),
  "Koshi-guruma": () => turn({ depth: .9, lean: 48, grips: ["sleeve", "neck"] }),
  "Tsurikomi-goshi": () => turn({ depth: .8, lean: 50, lift: 1 }),
  "Sode-tsurikomi-goshi": () => turn({ depth: .8, lean: 52 }),
  "Harai-goshi": () => turn({ leg: "harai", depth: .4, lean: 60 }),
  "Tsuri-goshi": () => turn({ depth: .3, lean: 35, lift: 1.3, grips: ["sleeve", "belt"] }),
  "Hane-goshi": () => turn({ leg: "hane", depth: .4, lean: 60 }),
  "Utsuri-goshi": () => counter(turn({ depth: .3, lean: 42, lift: 1.2, grips: ["sleeve", "belt"] })),
  "Ushiro-goshi": () => counter(turn({ depth: .2, lean: 22, lift: 1.3, grips: ["backbelt", "backbelt"] }), [-20, -30]),
  /* Ashi-waza */
  "De-ashi-harai": () => sweep({ h: "ankle" }),
  "Hiza-guruma": () => sweep({ h: "knee" }),
  "Sasae-tsurikomi-ashi": () => sweep({ h: "block" }),
  "O-soto-gari": () => reap({ kind: "outer" }),
  "O-uchi-gari": () => reap({ kind: "inner" }),
  "Ko-soto-gari": () => reap({ kind: "smallOuter" }),
  "Ko-uchi-gari": () => reap({ kind: "smallInner" }),
  "Okuri-ashi-harai": () => sweep({ h: "ankle" }),
  "Uchi-mata": () => turn({ leg: "uchi", depth: .3, lean: 64 }),
  "Ko-soto-gake": () => reap({ kind: "hook" }),
  "Ashi-guruma": () => sweep({ h: "thigh" }),
  "Harai-tsurikomi-ashi": () => sweep({ h: "ankle" }),
  "O-guruma": () => sweep({ h: "thigh" }),
  "O-soto-guruma": () => reap({ kind: "wheel" }),
  "O-soto-otoshi": () => reap({ kind: "drop" }),
  "Tsubame-gaeshi": () => counter(sweep({ h: "ankle" }), [10, 40]),
  "O-soto-gaeshi": () => counter(reap({ kind: "outer" }), [-60, -80]),
  "O-uchi-gaeshi": () => counter(reap({ kind: "inner" }), [-50, -70]),
  "Hane-goshi-gaeshi": () => counter(turn({ leg: "hane", depth: .4, lean: 60 })),
  "Harai-goshi-gaeshi": () => counter(turn({ leg: "harai", depth: .4, lean: 60 })),
  "Uchi-mata-gaeshi": () => counter(turn({ leg: "uchi", depth: .3, lean: 64 })),
  /* Ma-sutemi */
  "Tomoe-nage": () => sutemi({ leg: "belly" }),
  "Sumi-gaeshi": () => sutemi({ leg: "thigh" }),
  "Hikikomi-gaeshi": () => sutemi({ leg: "none" }),
  "Tawara-gaeshi": () => sutemi({ leg: "none" }),
  "Ura-nage": () => sutemi({ leg: "none" }),
  /* Yoko-sutemi */
  "Yoko-otoshi": () => sutemi({ leg: "thigh", side: true }),
  "Tani-otoshi": () => sutemi({ leg: "hook", side: true }),
  "Hane-makikomi": () => turn({ leg: "hane", dive: true, depth: .5, lean: 70 }),
  "Soto-makikomi": () => turn({ dive: true, depth: .7, lean: 72 }),
  "Uki-waza": () => sutemi({ leg: "none", side: true }),
  "Yoko-wakare": () => sutemi({ leg: "hook", side: true }),
  "Yoko-guruma": () => sutemi({ leg: "thigh", side: true }),
  "Yoko-gake": () => sutemi({ leg: "hook", side: true }),
  "Daki-wakare": () => sutemi({ leg: "none", side: true }),
  "Uchi-makikomi": () => turn({ dive: true, depth: .6, lean: 66 }),
  "Kani-basami": () => sutemi({ leg: "scissors", side: true }),
  "O-soto-makikomi": () => turn({ leg: "harai", dive: true, depth: .5, lean: 70 }),
  "Uchi-mata-makikomi": () => turn({ leg: "uchi", dive: true, depth: .4, lean: 70 }),
  "Harai-makikomi": () => turn({ leg: "harai", dive: true, depth: .4, lean: 70 }),
  "Ko-uchi-makikomi": () => turn({ dive: true, depth: .6, lean: 70 }),
  "Kawazu-gake": () => sutemi({ leg: "scissors", side: true }),
};
window.ARCH = { turn, reap, sweep, sutemi, tackle };
window.NAGE_ANIM = C;
})();
