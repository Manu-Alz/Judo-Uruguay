/* Judo Uruguay · app (sin build, sin dependencias) */
(() => {
"use strict";

/* ---------- Datos ---------- */
const COLORS = { blanco: "#ffffff", amarillo: "#f2bb0c", naranja: "#f07a1f", verde: "#23a455", azul: "#2f5fe0", marron: "#7b4a2a", negro: "#161a26" };
const LEVELS = [{ id: "blanco", name: "Blanco" }, ...BELTS].map((b) => ({ id: b.id, name: b.name, color: COLORS[b.id] }));
const beltOf = (id) => LEVELS.find((b) => b.id === id) || LEVELS[0];
const FORBID = new Set(FORBIDDEN);

const TECHS = [];
for (const g of WAZA_GROUPS)
  for (const name of g.items)
    TECHS.push({ name, slug: name.toLowerCase(), belt: wazaBelt(name), family: g.family, group: g.name, groupEs: g.es,
      origin: wazaOrigin(name), es: WAZA_ES[name] || "", forbidden: FORBID.has(name) });
const BY_SLUG = Object.fromEntries(TECHS.map((t) => [t.slug, t]));
const techsOfBelt = (id) => TECHS.filter((t) => t.belt === id);

const DESC = {};
for (const [q] of JUDO_QUOTES) {
  const i = q.indexOf(":");
  if (i > 0) { const key = q.slice(0, i).trim().toLowerCase(); if (BY_SLUG[key] && !DESC[key]) { const d = q.slice(i + 1).trim(); DESC[key] = d[0].toUpperCase() + d.slice(1); } }
}
const GLOSSARY = JUDO_QUOTES.filter((q) => q[1] === "Vocabulario").map((q) => q[0]);

/* ---------- Animaciones ---------- */
const ANIMS = {};
function animOf(t) {
  if (ANIMS[t.slug]) return ANIMS[t.slug];
  const mkDef = NAGE_ANIM[t.name] || KATAME_ANIM[t.name];
  if (!mkDef) return null;
  const def = mkDef(); def.belt = COLORS[t.belt];
  return (ANIMS[t.slug] = JE.build(def));
}
const peakTime = (A) => { const k = [...A.kf].reverse().find((f) => /^(Kake|Osaekomi|Shime|Kansetsu|Control|Ippon)$/.test(f.n)); const kk = A.kf.find((f) => f.n === "Kake") || k || A.kf[A.kf.length - 1]; return kk.t; };

/* ---------- Storyboard ---------- */
const STEP_TXT = {
  "Agarre": "Posición inicial. Tomá la manga y la solapa de uke.",
  "Kuzushi": "Rompé el equilibrio de uke: que cargue el peso en una sola pierna.",
  "Tsukuri": "Entrá con el cuerpo y colocate en la posición de ataque.",
  "Kake": "Ejecutá la técnica con todo el cuerpo, sin soltar el agarre.",
  "Ippon": "Uke cae con fuerza y de espaldas. Mantené el control.",
  "Ataca el uke": "Uke intenta atacar primero.",
  "Esquiva": "Tori esquiva y se prepara para contraatacar.",
  "Posición": "Uke acostado. Tori se ubica a su lado.",
  "Entrada": "Tori se acomoda y toma los agarres.",
  "Osaekomi": "Mantené la inmovilización: 10 s es waza-ari, 20 s es ippon.",
  "Shime": "Aplicá la estrangulación con control.",
  "Kansetsu": "Aplicá la luxación sobre el codo, despacio y con control.",
  "Tap": "Uke golpea dos veces para rendirse: soltá enseguida.",
};
const stepsOf = (A) => A.kf.filter((f) => f.n);
function paintPanel(c, A, i) {
  const steps = stepsOf(A), r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const W = r.width || 320, H = r.height || 240;
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const tt = steps[i].t, pv = i ? steps[i - 1].t : null;
  JE.drawStory(ctx, A, tt, pv, W, H, JE.fitCamera(A, pv == null ? [tt] : [pv, tt], W, H, .5));
}
let players = [];
const killPlayers = () => {};

/* Miniaturas del momento clave (se dibujan al aparecer en pantalla) */
const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { io.unobserve(e.target); drawThumb(e.target); }
}, { rootMargin: "300px" }) : null;
function drawThumb(c) {
  const t = BY_SLUG[c.dataset.slug], A = t && animOf(t); if (!A) return;
  const r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const W = r.width || 92, H = r.height || 70, pk = peakTime(A);
  c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
  const ctx = c.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  JE.drawStory(ctx, A, pk, null, W, H, JE.fitCamera(A, [pk], W, H, .22), { thumb: true });
}
const hydrate = (root) => root.querySelectorAll("canvas[data-slug]").forEach((c) => (io ? io.observe(c) : drawThumb(c)));

/* ---------- Estado (localStorage) ---------- */
const KEY = "judouy.v1";
let S = { name: "", belt: "blanco", prog: {} };
try { S = { ...S, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
const st = (slug) => S.prog[slug] || 0;
function setSt(slug, v) { if (v) S.prog[slug] = v; else delete S.prog[slug]; save(); }
const mastered = (l = TECHS) => l.filter((t) => st(t.slug) === 2).length;
const learning = (l = TECHS) => l.filter((t) => st(t.slug) === 1).length;

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ\-\s]/g, "");
const view = $("#view");
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2200); }
const ARROW = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>';
const markBtn = (slug) => { const s = st(slug); return `<button class="mark" data-act="cycle" data-slug="${slug}" data-s="${s}" aria-label="${["Sin empezar", "En práctica", "Dominada"][s]}. Tocá para cambiar"><span>${s === 2 ? CHECK : ""}</span></button>`; };
const dailyIdx = () => { const d = new Date(); return (d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()); };
const dailyQuote = () => JUDO_QUOTES[dailyIdx() % JUDO_QUOTES.length];
const dailyTech = () => { const l = TECHS.filter((t) => t.family === "Nage-waza" && !t.forbidden && !/gaeshi|sukashi|makikomi/i.test(t.name) && animOf(t)); return l[dailyIdx() % l.length]; };
const ringSvg = (p) => { const r = 42, c = 2 * Math.PI * r; return `<svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="${r}"/><circle class="fg" cx="50" cy="50" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}" stroke-linecap="round"/></svg>`; };
const viewName = (A) => (A.top ? "Vista desde arriba" : "Vista lateral");

/* ---------- Vistas ---------- */
let F = { q: "", belt: "todos", fam: "todas", st: "todas" };

function vInicio() {
  const first = S.name.trim().split(/\s+/)[0], total = mastered();
  const tech = dailyTech(), b = beltOf(tech.belt), q = dailyQuote();
  return `
  <div class="hello"><div><p class="sub" style="font-weight:700">${first ? "Buenas," : "Bienvenido al"}</p><h1 class="h1">${first ? esc(first) : "dojo"} 👋</h1></div></div>
  <section class="hero" aria-label="Técnica del día">
    <p class="k">Técnica del día</p>
    <h2>${tech.name}</h2>
    <p>${esc(tech.es)}</p>
    <div class="chips2"><span class="chip"><i class="belt-sw" style="--c:${b.color}"></i>Cinturón ${b.name.toLowerCase()}</span><span class="chip">${esc(tech.groupEs)}</span></div>
    <div class="stage" id="hero-stage" data-act="open" data-slug="${tech.slug}" role="button" tabindex="0" aria-label="Abrir ${tech.name}"><canvas id="hero-c"></canvas></div>
    <a class="btn white" href="#/t/${tech.slug}">Ver la secuencia completa</a>
  </section>
  <div class="sec"><h2>Tu camino</h2><a href="#/progreso">${total} / 100</a></div>
  <div class="rail">${BELTS.map((bl) => { const l = techsOfBelt(bl.id), m = mastered(l);
    return `<a class="bcard" href="#/tecnicas" data-belt="${bl.id}" style="--c:${COLORS[bl.id]}"><b>${bl.name}</b><div class="n num">${m}<small> / ${l.length}</small></div><div class="bar"><i style="width:${pct(m, l.length)}%"></i></div></a>`; }).join("")}</div>
  ${first ? "" : `<a class="btn blue" style="margin-top:14px" href="#/progreso">Poné tu nombre y cinturón</a>`}
  <div class="sec"><h2>Frase del día</h2></div>
  <figure class="quote" style="margin:0"><blockquote>${esc(q[0])}</blockquote><cite>${esc(q[1])}</cite></figure>
  <div class="sec"><h2>Explorar</h2></div>
  <div class="tiles">
    <a class="tile" href="#/tecnicas"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="3"/><path d="M10 8.2l4 1.8-4 1.8zM8 20h8"/></svg><div><b>Técnicas</b><span>100 secuencias</span></div></a>
    <a class="tile" href="#/progreso"><svg viewBox="0 0 24 24"><path d="M4 20V11M10 20V5M16 20v-7M22 20H2"/></svg><div><b>Progreso</b><span>Por cinturón</span></div></a>
    <a class="tile" href="#/dojo"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.2a3 3 0 010 5.6M18 14.4c1.8.8 3 2.8 3 5.6"/></svg><div><b>Dojo</b><span>El grupo</span></div></a>
    <a class="tile" href="#/mas"><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM8 9h8M8 13h5"/></svg><div><b>Glosario</b><span>Términos y reglas</span></div></a>
  </div>`;
}
function afterInicio() {
  const A = animOf(dailyTech()), c = $("#hero-c"); if (!A || !c) return;
  const steps = stepsOf(A); let k = steps.findIndex((f) => f.n === "Kake"); if (k < 0) k = steps.length - 1;
  requestAnimationFrame(() => paintPanel(c, A, k));
}

function filtered() {
  const q = norm(F.q);
  return TECHS.filter((t) =>
    (F.belt === "todos" || t.belt === F.belt) && (F.fam === "todas" || t.family === F.fam) &&
    (F.st === "todas" || (F.st === "pend" ? st(t.slug) === 0 : F.st === "learn" ? st(t.slug) === 1 : st(t.slug) === 2)) &&
    (!q || norm(t.name + t.es + t.groupEs).includes(q)));
}
function row(t) {
  const b = beltOf(t.belt);
  return `<div class="trow${t.forbidden ? " forb" : ""}" data-act="open" data-slug="${t.slug}" role="button" tabindex="0">
    <span class="thumb"><canvas data-slug="${t.slug}"></canvas></span>
    <div class="t"><b>${t.name}</b><span>${esc(t.es)}</span><span style="margin-top:2px"><i class="belt-sw" style="--c:${b.color};width:9px;height:9px;flex-basis:9px;margin-right:5px"></i>${esc(t.groupEs)}${t.forbidden ? " · prohibida" : ""}</span></div>${markBtn(t.slug)}</div>`;
}
function listHtml() {
  const list = filtered();
  if (!list.length) return `<div class="empty">No encontré técnicas con esos filtros</div>`;
  if (F.belt === "todos" && !F.q) {
    let out = "";
    for (const b of LEVELS.slice(1)) {
      const items = list.filter((t) => t.belt === b.id); if (!items.length) continue;
      out += `<div class="bhead"><i class="belt-sw" style="--c:${b.color};width:18px;height:18px"></i><h2>${b.name}</h2><span class="num">${mastered(items)} / ${items.length}</span></div>` + items.map(row).join("");
    }
    return out;
  }
  return list.map(row).join("");
}
function vTecnicas() {
  const chip = (k, v, label, sw) => `<button class="fchip" data-f="${k}" data-v="${v}" aria-pressed="${F[k] === v}">${sw ? `<i class="belt-sw" style="--c:${sw}"></i>` : ""}${label}</button>`;
  return `
  <h1 class="h1">Técnicas</h1>
  <p class="lead">Tocá una para verla en movimiento.</p>
  <div class="sticky">
    <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" type="search" placeholder="Buscar técnica" value="${esc(F.q)}" autocomplete="off" enterkeyhint="search"></label>
    <div class="chips">${chip("belt", "todos", "Todas")}${BELTS.map((b) => chip("belt", b.id, b.name, COLORS[b.id])).join("")}</div>
  </div>
  <div class="chips" style="margin-top:2px">${chip("fam", "todas", "Todo")}${chip("fam", "Nage-waza", "Proyecciones")}${chip("fam", "Katame-waza", "Suelo")}${chip("st", "pend", "Sin empezar")}${chip("st", "learn", "En práctica")}${chip("st", "done", "Dominadas")}</div>
  <div class="legend"><span><i></i>Sin empezar</span><span><i class="l1"></i>En práctica</span><span><i class="l2"></i>Dominada</span></div>
  <div id="list">${listHtml()}</div>`;
}

function vDetalle(slug) {
  const t = BY_SLUG[slug]; if (!t) return vTecnicas();
  const A = animOf(t), b = beltOf(t.belt), s = st(slug), steps = stepsOf(A);
  const list = filtered().length ? filtered() : TECHS;
  const i = Math.max(0, list.findIndex((x) => x.slug === slug));
  const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
  const risky = /Shime|Kansetsu/.test(t.group);
  return `
  <button class="back" data-act="back"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Técnicas</button>
  <p class="sub num" style="font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px">Técnica ${String(TECHS.indexOf(t) + 1).padStart(2, "0")} de 100</p>
  <h1 class="dtitle">${t.name}</h1>
  <p class="dsub">${esc(t.es)}</p>
  <div class="tags"><span class="tag"><i class="belt-sw" style="--c:${b.color}"></i>Cinturón ${b.name.toLowerCase()}</span><span class="tag">${t.family === "Nage-waza" ? "Proyección" : "Suelo"} · ${esc(t.groupEs)}</span>${t.origin ? `<span class="tag">${t.origin}</span>` : ""}${t.forbidden ? `<span class="tag red">Prohibida en competencia</span>` : ""}</div>
  <div class="sec" style="margin-top:22px"><h2>Secuencia</h2><span class="sub num" style="font-size:.8rem;font-weight:700">${A.top ? "Vista desde arriba" : "Vista lateral"}</span></div>
  <div class="story" id="story">${steps.map((st_, n) => `<figure class="panel"><canvas></canvas><figcaption><span class="stepn num">${n + 1}</span><div><b>${esc(st_.n)}</b><p>${esc(STEP_TXT[st_.n] || "")}</p></div></figcaption></figure>`).join("")}</div>
  <div class="dots" id="dots"></div>
  <div class="legend2"><span><i style="background:#2c58e0"></i>Tori (azul)</span><span><i style="background:#fff;box-shadow:inset 0 0 0 1.5px #2a3350"></i>Uke (blanco)</span><span><i class="ar" style="background:#e8930c"></i>Movimiento</span></div>
  ${DESC[slug] ? `<p class="desc">${esc(DESC[slug])}</p>` : ""}
  <div class="seg" role="group" aria-label="Mi estado">${["Sin empezar", "En práctica", "Dominada"].map((l, v) => `<button data-act="set" data-slug="${slug}" data-v="${v}" aria-pressed="${s === v}">${l}</button>`).join("")}</div>
  <p class="note">Esquema para entender la secuencia general. Los detalles finos (agarres, ángulos, ritmo) se practican con el sensei.${risky ? " Las estrangulaciones y luxaciones se practican siempre con supervisión." : ""}</p>
  <div class="nav2"><button data-act="goto" data-slug="${prev.slug}"><small>Anterior</small><b>${esc(prev.name)}</b></button><button data-act="goto" data-slug="${next.slug}"><small>Siguiente</small><b>${esc(next.name)}</b></button></div>`;
}
function afterDetalle(slug) {
  const t = BY_SLUG[slug]; if (!t) return;
  const A = animOf(t), story = $("#story"), dots = $("#dots"); if (!A || !story) return;
  const paint = () => [...story.querySelectorAll(".panel:not(.gif) canvas")].forEach((c, n) => paintPanel(c, A, n));
  const buildDots = () => {
    const ps = [...story.querySelectorAll(".panel")];
    dots.innerHTML = ps.map((p, n) => `<button class="dot" data-i="${n}" aria-label="Paso ${n + 1}"></button>`).join("");
    dots.onclick = (e) => { const d = e.target.closest(".dot"); if (!d) return; const p = ps[+d.dataset.i]; story.scrollTo({ left: p.offsetLeft - story.offsetLeft - (story.clientWidth - p.offsetWidth) / 2, behavior: "smooth" }); };
    const mark = () => { const mid = story.scrollLeft + story.clientWidth / 2; let best = 0, bd = 1e9; ps.forEach((p, n) => { const d = Math.abs(p.offsetLeft - story.offsetLeft + p.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = n; } }); dots.querySelectorAll(".dot").forEach((d, n) => d.setAttribute("aria-current", String(n === best))); };
    story.onscroll = mark; mark();
  };
  requestAnimationFrame(() => { paint(); buildDots(); });
  /* si existe un GIF propio en media/waza/, se agrega como primer paso */
  const img = new Image();
  img.onload = () => { const f = document.createElement("figure"); f.className = "panel gif"; f.innerHTML = `<div class="gifbox"></div><figcaption><span class="stepn">★</span><div><b>Video del dojo</b><p>Grabado por el grupo.</p></div></figcaption>`; $(".gifbox", f).appendChild(img); img.alt = "Animación de " + t.name; story.prepend(f); buildDots(); story.scrollLeft = 0; };
  img.src = `media/waza/${slug}.gif`;
}

function vProgreso() {
  const total = mastered(), p = pct(total, 100);
  return `
  <h1 class="h1">Progreso</h1>
  <p class="lead">${esc(S.name || "Tu avance")} · cinturón ${beltOf(S.belt).name.toLowerCase()}</p>
  <div class="card ringwrap"><div class="ring">${ringSvg(p)}<div class="n num">${p}%</div></div><div><h2 class="num">${total} / 100</h2><p>${learning()} en práctica<br>${100 - total - learning()} sin empezar</p></div></div>
  <div class="sec"><h2>Por cinturón</h2></div>
  ${BELTS.map((b) => { const l = techsOfBelt(b.id), m = mastered(l);
    return `<a class="card brow" href="#/tecnicas" data-belt="${b.id}" style="--c:${b.id === "negro" ? "#161a26" : COLORS[b.id]}"><div class="h"><i class="belt-sw" style="--c:${COLORS[b.id]};width:16px;height:16px"></i><b>${b.name}</b><span class="num">${m} / ${l.length}</span></div><div class="bar"><i style="width:${pct(m, l.length)}%"></i></div></a>`; }).join("")}
  <div class="sec"><h2>Mi ficha</h2></div>
  <div class="card">
    <label class="field"><span>Nombre</span><input id="f-name" value="${esc(S.name)}" placeholder="Tu nombre" autocomplete="given-name" maxlength="40"></label>
    <label class="field"><span>Cinturón actual</span><select id="f-belt">${LEVELS.map((b) => `<option value="${b.id}"${b.id === S.belt ? " selected" : ""}>${b.name}</option>`).join("")}</select></label>
    <button class="btn blue" style="width:100%" data-act="copy-ficha">Copiar mi ficha para el sensei</button>
  </div>
  <div class="sec"><h2>Respaldo</h2></div>
  <div class="card"><p class="sub" style="margin-bottom:14px;font-size:.9rem">Tu progreso vive en este teléfono. Si cambiás de equipo, copiá el respaldo y pegalo en el nuevo.</p>
  <div class="row-btns"><button class="btn ghost sm" data-act="export">Copiar respaldo</button><button class="btn ghost sm" data-act="import">Pegar respaldo</button><button class="btn ghost sm" data-act="reset">Borrar todo</button></div></div>`;
}

const alumnoCount = (a) => (Array.isArray(a.dominadas) ? a.dominadas.length : a.dominadas || 0);
function vDojo() {
  const mineKey = norm(S.name.trim().split(/\s+/)[0] || "");
  const people = ALUMNOS.map((a) => (mineKey && norm(a.name) === mineKey ? { ...a, belt: S.belt, dominadas: mastered(), me: true } : a));
  if (mineKey && !people.some((a) => a.me)) people.push({ name: S.name.trim(), belt: S.belt, dominadas: mastered(), me: true });
  people.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return `
  <h1 class="h1">Dojo</h1>
  <p class="lead">${people.length} judokas, en orden alfabético. Acá no hay ranking: se crece juntos.</p>
  ${people.map((a) => { const b = beltOf(a.belt), n = alumnoCount(a);
    return `<div class="card person"><div class="avatar" style="--c:${b.color}">${esc(a.name.trim()[0]?.toUpperCase() || "?")}</div><div class="t"><b>${esc(a.name)}</b><span>Cinturón ${b.name.toLowerCase()}${a.me ? " · vos" : ""}</span><div class="bar"><i style="width:${n}%"></i></div></div><div class="n num">${n}<small>DE 100</small></div></div>`; }).join("")}
  <div class="sec"><h2>Judokan</h2></div>
  <a class="card link" href="${LINKS[0].u}" target="_blank" rel="noopener"><div><b>Judokan Uruguay</b><span>Horarios, noticias y contacto</span></div>${ARROW}</a>`;
}

let gq = "";
function glossHtml() {
  const q = norm(gq), l = GLOSSARY.filter((g) => !q || norm(g).includes(q));
  return l.length ? l.map((g) => { const i = g.indexOf(":"); return `<div class="gloss">${i > 0 ? `<b>${esc(g.slice(0, i))}</b>${esc(g.slice(i))}` : esc(g)}</div>`; }).join("") : `<div class="empty">Sin resultados</div>`;
}
function vMas() {
  return `
  <h1 class="h1">Más</h1>
  <p class="lead">Glosario, reglas y links.</p>
  <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="gq" type="search" placeholder="Buscar en el glosario" value="${esc(gq)}" autocomplete="off"></label>
  <div class="card" id="gloss" style="margin-top:12px;padding:6px 18px">${glossHtml()}</div>
  <div class="sec"><h2>Reglas en breve</h2></div>
  <div class="card"><ul class="rules">
    <li><b>Ippon</b> gana el combate. Dos <b>waza-ari</b> suman ippon.</li>
    <li>Inmovilización: 10 s es waza-ari, 20 s es ippon.</li>
    <li>Combate de adultos: 4 minutos. Empate: <b>Golden Score</b>.</li>
    <li>Tres <b>shidos</b> son hansoku-make.</li>
    <li>Prohibidas: ${FORBIDDEN.join(", ")}.</li></ul></div>
  <div class="sec"><h2>Categorías de peso</h2></div>
  <div class="card">${Object.entries(WEIGHTS).map(([k, v]) => `<p class="subh">${k}</p><div class="weights">${v.map((w) => `<span>${w} kg</span>`).join("")}</div>`).join("")}</div>
  <div class="sec"><h2>Links</h2></div>
  ${LINKS.map((l) => `<a class="card link" href="${l.u}" target="_blank" rel="noopener"><div><b>${l.t}</b><span>${l.d}</span></div>${ARROW}</a>`).join("")}
  <p class="foot">Jita kyōei · prosperar juntos</p>`;
}

/* ---------- Router ---------- */
const VIEWS = { inicio: vInicio, tecnicas: vTecnicas, progreso: vProgreso, dojo: vDojo, mas: vMas };
let current = "", navCount = 0;
function route(isNav) {
  if (isNav) navCount++;
  killPlayers();
  const h = (location.hash || "#/inicio").replace(/^#\/?/, "").split("/");
  document.body.classList.toggle("detail", h[0] === "t");
  const meEl = $("#me"); meEl.textContent = (S.name.trim()[0] || "?").toUpperCase();
  if (h[0] === "t" && h[1] && BY_SLUG[h[1]]) {
    current = "t";
    view.innerHTML = vDetalle(h[1]); window.scrollTo(0, 0); afterDetalle(h[1]); return;
  }
  const name = VIEWS[h[0]] ? h[0] : "inicio";
  const keep = name === current ? window.scrollY : 0;
  current = name; view.innerHTML = VIEWS[name]();
  document.querySelectorAll(".tabbar a").forEach((a) => { if (a.dataset.tab === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  window.scrollTo(0, keep);
  if (name === "inicio") afterInicio();
  if (name === "tecnicas") hydrate(view);
}
function refreshList() { $("#list").innerHTML = listHtml(); hydrate($("#list")); }

/* ---------- Eventos ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act],[data-f],[data-belt],.ph");
  if (!el) return;
  if (el.dataset.belt) { F = { q: "", belt: el.dataset.belt, fam: "todas", st: "todas" }; return; }
  if (el.dataset.f) { F[el.dataset.f] = el.dataset.v; const y = window.scrollY; route(false); window.scrollTo(0, y); return; }
  const slug = el.dataset.slug;
  switch (el.dataset.act) {
    case "open": e.preventDefault(); location.hash = "#/t/" + slug; break;
    case "goto": location.replace("#/t/" + slug); break;
    case "back": if (navCount > 0) history.back(); else location.hash = "#/tecnicas"; break;
    case "cycle": e.stopPropagation(); setSt(slug, (st(slug) + 1) % 3); if (current === "tecnicas") { const y = window.scrollY; refreshList(); window.scrollTo(0, y); } break;
    case "set": setSt(slug, +el.dataset.v);
      document.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === +el.dataset.v)));
      if (+el.dataset.v === 2) toast("Técnica dominada 🥋"); break;
    case "copy-ficha": copy(`{ name: ${JSON.stringify(S.name || "Nombre")}, belt: "${S.belt}", dominadas: ${JSON.stringify(TECHS.filter((t) => st(t.slug) === 2).map((t) => t.slug))} },`, "Ficha copiada. Mandásela al sensei"); break;
    case "export": copy(JSON.stringify(S), "Respaldo copiado"); break;
    case "import": { const v = prompt("Pegá tu respaldo:"); if (!v) break;
      try { const o = JSON.parse(v); if (typeof o.prog !== "object") throw 0; S = { name: "", belt: "blanco", prog: {}, ...o }; save(); route(false); toast("Progreso restaurado"); } catch { toast("Ese respaldo no es válido"); } break; }
    case "reset": if (confirm("¿Borrar todo tu progreso en este teléfono?")) { S = { name: "", belt: "blanco", prog: {} }; save(); route(false); toast("Listo, empezás de cero"); } break;
  }
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[role=button]")) { e.preventDefault(); location.hash = "#/t/" + e.target.dataset.slug; }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "q") { F.q = e.target.value; refreshList(); }
  else if (e.target.id === "gq") { gq = e.target.value; $("#gloss").innerHTML = glossHtml(); }
  else if (e.target.id === "f-name") { S.name = e.target.value.trim(); save(); $("#me").textContent = (S.name[0] || "?").toUpperCase(); }
  else if (e.target.id === "f-belt") { S.belt = e.target.value; save(); }
});
async function copy(text, msg) { try { await navigator.clipboard.writeText(text); toast(msg); } catch { prompt("Copiá este texto:", text); } }
window.addEventListener("hashchange", () => route(true));
route(false);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
