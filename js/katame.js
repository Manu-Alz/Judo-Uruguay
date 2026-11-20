/* Katame-waza (suelo) en vista cenital: se mira el tatami desde arriba.
   Uke acostado boca arriba (cabeza a la izquierda). Tori en azul. */
(() => {
"use strict";
const UK = { x: .45, y: 0, t: 180, al: [-14, -6], ar: [14, 6], ll: [6, 6], lr: [-6, -6], gl: 0, gr: 0 };
const TK = { x: -.15, y: -1.35, t: 90, al: [75, 95], ar: [105, 95], ll: [-110, -80], lr: [-70, -100], gl: 0, gr: 0 };
const F = (t, n, T, U) => ({ t, n, T: T || {}, U: U || {} });
const mix = (a, b, k) => {
  const o = {};
  for (const key of Object.keys(b)) {
    const x = a[key], y = b[key];
    o[key] = Array.isArray(y) ? y.map((v, i) => v + ((x?.[i] ?? v) - v) * (1 - k) * 1) .map((v, i) => (x?.[i] ?? y[i]) + (y[i] - (x?.[i] ?? y[i])) * k) : (x ?? y) + (y - (x ?? y)) * k;
  }
  return o;
};

function ground(final, grips, o = {}) {
  const fin = { al: [60, 90], ar: [120, 90], gl: 1, gr: 1, ...final };
  const mid = mix(TK, { ...fin, gl: .5, gr: .5 }, .55);
  const frames = [F(0, "Posición", { ...TK }, { ...UK }), F(1.0, "Entrada", mid), F(2.0, o.label || "Control", fin)];
  if (o.tap) frames.push(F(2.6, "Tap", {}, { ar: [48, 30] }), F(3.0, "", {}, { ar: [14, 6] }), F(3.4, "Tap", {}, { ar: [48, 30] }), F(3.8, "", {}, { ar: [14, 6] }));
  else frames.push(F(3.2, "", {}, {}), F(3.8, "", {}, {}));
  return { view: "top", base: { T: { ...TK }, U: { ...UK } }, grips: { T: grips }, frames, bendT: [1, -1], hold: 1 };
}
const P = (x, y, t, ll, lr) => ({ x, y, t, ll, lr });

const K = {
  /* Osaekomi-waza */
  "Kesa-gatame": () => ground(P(.35, -.55, 168, [-8, -12], [-50, -30]), ["wrL", "collar"], { label: "Osaekomi" }),
  "Kuzure-kesa-gatame": () => ground(P(.3, -.5, 160, [0, -10], [-60, -40]), ["elL", "shL"], { label: "Osaekomi" }),
  "Ushiro-kesa-gatame": () => ground(P(-.5, -.52, 15, [180, 185], [215, 200]), ["wrL", "chest"], { label: "Osaekomi" }),
  "Kata-gatame": () => ground(P(-.55, -.6, 62, [-120, -100], [-80, -95]), ["shL", "head"], { label: "Osaekomi" }),
  "Kami-shiho-gatame": () => ground(P(-1.55, 0, 0, [190, 200], [170, 160]), ["belt", "belt"], { label: "Osaekomi" }),
  "Kuzure-kami-shiho-gatame": () => ground(P(-1.5, -.22, 10, [190, 200], [170, 160]), ["shL", "belt"], { label: "Osaekomi" }),
  "Yoko-shiho-gatame": () => ground(P(-.2, -.98, 90, [225, 250], [-45, -70]), ["belt", "collar"], { label: "Osaekomi" }),
  "Tate-shiho-gatame": () => ground(P(.55, .02, 182, [30, 25], [-30, -25]), ["elL", "elR"], { label: "Osaekomi" }),
  "Uki-gatame": () => ground(P(.1, -.62, 130, [-20, -30], [-70, -80]), ["wrL", "collar"], { label: "Osaekomi" }),
  "Ura-gatame": () => ground(P(.05, -.68, 95, [-100, -75], [-65, -100]), ["belt", "collar"], { label: "Osaekomi" }),
  /* Shime-waza */
  "Nami-juji-jime": () => ground(P(.4, 0, 180, [50, 95], [-50, -95]), ["collar", "collar"], { tap: true, label: "Shime" }),
  "Gyaku-juji-jime": () => ground(P(.4, 0, 180, [50, 95], [-50, -95]), ["collar", "shL"], { tap: true, label: "Shime" }),
  "Kata-juji-jime": () => ground(P(.4, 0, 180, [50, 95], [-50, -95]), ["collar", "shR"], { tap: true, label: "Shime" }),
  "Hadaka-jime": () => ground(P(.9, 0, 182, [8, 12], [-8, -12]), ["collar", "head"], { tap: true, label: "Shime" }),
  "Okuri-eri-jime": () => ground(P(.9, .05, 182, [8, 12], [-8, -12]), ["collar", "shL"], { tap: true, label: "Shime" }),
  "Kata-ha-jime": () => ground(P(.9, -.05, 182, [8, 12], [-8, -12]), ["collar", "elL"], { tap: true, label: "Shime" }),
  "Katate-jime": () => ground(P(.3, -.42, 170, [-10, -15], [-55, -40]), ["collar", "chest"], { tap: true, label: "Shime" }),
  "Ryote-jime": () => ground(P(.4, 0, 180, [50, 95], [-50, -95]), ["collar", "collar"], { tap: true, label: "Shime" }),
  "Sode-guruma-jime": () => ground(P(.4, -.2, 175, [30, 60], [-60, -80]), ["shL", "shR"], { tap: true, label: "Shime" }),
  "Tsukkomi-jime": () => ground(P(.4, -.1, 178, [40, 80], [-50, -90]), ["collar", "shR"], { tap: true, label: "Shime" }),
  "Sankaku-jime": () => ground(P(-.1, -.5, -90, [80, 95], [100, 70]), ["wrL", "head"], { tap: true, label: "Shime" }),
  "Do-jime": () => ground(P(.4, 0, 180, [95, 130], [-95, -130]), ["shL", "shR"], { tap: true, label: "Shime" }),
  /* Kansetsu-waza */
  "Ude-garami": () => ground(P(0, -.55, 130, [-10, -20], [-70, -50]), ["wrL", "elL"], { tap: true, label: "Kansetsu" }),
  "Ude-hishigi-juji-gatame": () => ground(P(-.15, -.45, -90, [75, 90], [105, 95]), ["wrL", "wrL"], { tap: true, label: "Kansetsu" }),
  "Ude-hishigi-ude-gatame": () => ground(P(.1, -.6, 130, [-30, -20], [-70, -80]), ["wrL", "elL"], { tap: true, label: "Kansetsu" }),
  "Ude-hishigi-hiza-gatame": () => ground(P(.15, -.6, 100, [-30, -20], [-60, -70]), ["wrL", "elL"], { tap: true, label: "Kansetsu" }),
  "Ude-hishigi-waki-gatame": () => ground(P(.2, -.55, 170, [-10, -20], [-60, -50]), ["wrL", "elL"], { tap: true, label: "Kansetsu" }),
  "Ude-hishigi-hara-gatame": () => ground(P(-.15, -.5, 90, [-100, -80], [-80, -100]), ["wrL", "wrL"], { tap: true, label: "Kansetsu" }),
  "Ude-hishigi-ashi-gatame": () => ground(P(.1, -.5, -20, [40, 30], [100, 90]), ["wrL", "elL"], { tap: true, label: "Kansetsu" }),
  "Ude-hishigi-te-gatame": () => ground(P(.4, -.4, 150, [-20, -30], [-70, -60]), ["wrL", "wrR"], { tap: true, label: "Kansetsu" }),
  "Ude-hishigi-sankaku-gatame": () => ground(P(-.05, -.5, -80, [80, 95], [100, 75]), ["wrL", "elL"], { tap: true, label: "Kansetsu" }),
  "Ashi-garami": () => ground(P(1.5, -.2, 0, [180, 175], [200, 190]), ["ankL", "ankR"], { tap: true, label: "Kansetsu" }),
};
window.KATAME_ANIM = K;
})();
