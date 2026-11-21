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
    TECHS.push({ name, slug: name.toLowerCase(), belt: wazaBelt(name), family: g.family, gid: g.id, group: g.name, groupEs: g.es,
      origin: wazaOrigin(name), es: WAZA_ES[name] || "", forbidden: FORBID.has(name) });
TECHS.forEach((t, i) => { t.n = i + 1; t.video = VIDEOS[t.slug] || ""; });
const BY_SLUG = Object.fromEntries(TECHS.map((t) => [t.slug, t]));
const techsOfBelt = (id) => TECHS.filter((t) => t.belt === id);

const DESC = {};
for (const [q] of JUDO_QUOTES) {
  const i = q.indexOf(":");
  if (i > 0) { const key = q.slice(0, i).trim().toLowerCase(); if (BY_SLUG[key] && !DESC[key]) { const d = q.slice(i + 1).trim(); DESC[key] = d[0].toUpperCase() + d.slice(1); } }
}
/* Términos de técnica y cuerpo: el vocabulario general, sin repetir lo que ya está en las frases del dojo */
const FRASE_KEYS = new Set(FRASES.flatMap((g) => g.items.map((i) => i[0].toLowerCase())));
const GLOSSARY = JUDO_QUOTES.filter((q) => q[1] === "Vocabulario").map((q) => q[0])
  .filter((g) => { const k = g.split(":")[0].trim().toLowerCase(); return !FRASE_KEYS.has(k) && !FRASE_KEYS.has(k.split(" ")[0]); });

/* ---------- Estado (localStorage) ---------- */
const KEY = "judouy.v1";
let S = { name: "", belt: "blanco", prog: {} };
try { S = { ...S, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} schedulePush(); };
const st = (slug) => S.prog[slug] || 0;
function setSt(slug, v) { if (v) S.prog[slug] = v; else delete S.prog[slug]; save(); }
const mastered = (l = TECHS) => l.filter((t) => st(t.slug) === 2).length;
const learning = (l = TECHS) => l.filter((t) => st(t.slug) === 1).length;
const slugsWith = (v) => TECHS.filter((t) => st(t.slug) === v).map((t) => t.slug);

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ\-\s]/g, "");
const view = $("#view");
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2400); }
const ARROW = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const PLAYI = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg>';
const SPK = '<svg viewBox="0 0 24 24"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/></svg>';
const markBtn = (slug) => { const s = st(slug); return `<button class="mark" data-act="cycle" data-slug="${slug}" data-s="${s}" aria-label="${["Sin empezar", "En práctica", "Dominada"][s]}. Tocá para cambiar"><span>${s === 2 ? CHECK : ""}</span></button>`; };
const dailyIdx = () => { const d = new Date(); return d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate(); };
const dailyQuote = () => JUDO_QUOTES[dailyIdx() % JUDO_QUOTES.length];
const dailyTech = () => { const l = TECHS.filter((t) => t.video && !t.forbidden); const pool = l.length ? l : TECHS; return pool[dailyIdx() % pool.length]; };
const ringSvg = (p) => { const r = 42, c = 2 * Math.PI * r; return `<svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="${r}"/><circle class="fg" cx="50" cy="50" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}" stroke-linecap="round"/></svg>`; };
const poster = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
function speak(text) {
  if (!("speechSynthesis" in window)) return toast("Tu navegador no tiene audio");
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "ja-JP"; u.rate = .8; speechSynthesis.speak(u); } catch {}
}

/* ---------- Cuenta y sincronización ---------- */
let PROFILES = null, syncTimer = null;
function schedulePush() { if (!Auth.user) return; clearTimeout(syncTimer); syncTimer = setTimeout(pushNow, 1200); }
async function pushNow() {
  if (!Auth.user) return;
  try { await Auth.saveProfile({ name: S.name, belt: S.belt, done: slugsWith(2), learning: slugsWith(1) }); }
  catch (e) { if (!pushNow.warned) { pushNow.warned = true; toast("No pude guardar tu progreso en la nube"); } }
}
async function syncDown() {
  try {
    const p = await Auth.getProfile();
    if (p) {
      if (p.name) S.name = p.name;
      if (p.belt) S.belt = p.belt;
      for (const s of p.done || []) S.prog[s] = 2;
      for (const s of p.learning || []) if (!S.prog[s]) S.prog[s] = 1;
    } else if (!S.name) S.name = Auth.user.user_metadata?.name || "";
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
    await pushNow();
  } catch { toast("No pude sincronizar tu progreso"); }
}
async function loadProfiles() {
  if (!Auth.user) return;
  try { PROFILES = await Auth.listProfiles(); if (current === "dojo" || current === "dojo-p") { const y = window.scrollY; route(false); window.scrollTo(0, y); } } catch {}
}
function renderChrome() {
  const u = Auth.user, initial = (S.name.trim()[0] || u?.email?.[0] || "?").toUpperCase();
  const guest = Auth.enabled && !u;
  $("#account").innerHTML = guest ? `<a class="login-btn" href="#/cuenta">Ingresar</a>` : `<a class="me" href="#/progreso" aria-label="Mi perfil">${esc(initial)}</a>`;
  $("#side-foot").innerHTML = guest
    ? `<a class="sidecard" href="#/cuenta"><i class="me" style="font-style:normal">→</i><div><b>Ingresar</b><span>Sumate al dojo</span></div></a>`
    : `<a class="sidecard" href="#/progreso"><i class="me" style="font-style:normal">${esc(initial)}</i><div><b>${esc(S.name || "Invitado")}</b><span>Cinturón ${beltOf(S.belt).name.toLowerCase()}</span></div></a>`;
}

/* ---------- Vistas ---------- */
let F = { q: "", belt: "todos" };

function vInicio() {
  const first = S.name.trim().split(/\s+/)[0], total = mastered();
  const tech = dailyTech(), b = beltOf(tech.belt), q = dailyQuote();
  return `
  <div class="home">
    <div>
      <div class="hello"><p class="sub" style="font-weight:700">${first ? "Buenas," : "Bienvenido al"}</p><h1 class="h1">${first ? esc(first) : "dojo"} 👋</h1></div>
      <section class="hero" aria-label="Técnica del día">
        <p class="k">Técnica del día</p>
        <h2>${tech.name}</h2>
        <p>${esc(tech.es)}</p>
        <div class="chips2"><span class="chip"><i class="belt-sw" style="--c:${b.color}"></i>Cinturón ${b.name.toLowerCase()}</span><span class="chip">${esc(tech.groupEs)}</span></div>
        ${tech.video ? `<a class="vposter small" href="#/t/${tech.slug}" style="background-image:url(${poster(tech.video)})" aria-label="Ver ${tech.name}"><span class="vplay">${PLAYI}</span></a>` : ""}
        <a class="btn white" href="#/t/${tech.slug}">${tech.video ? "Ver el video" : "Ver la técnica"}</a>
      </section>
    </div>
    <div>
      <div class="sec"><h2>Tu camino</h2><a href="#/progreso">${total} / 100</a></div>
      <div class="rail">${BELTS.map((bl) => { const l = techsOfBelt(bl.id), m = mastered(l);
        return `<a class="bcard" href="#/tecnicas" data-belt="${bl.id}" style="--c:${COLORS[bl.id]}"><b>${bl.name}</b><div class="n num">${m}<small> / ${l.length}</small></div><div class="bar"><i style="width:${pct(m, l.length)}%"></i></div></a>`; }).join("")}</div>
      ${first ? "" : `<a class="btn blue" style="margin-top:14px" href="#/progreso">Poné tu nombre y cinturón</a>`}
      <div class="sec"><h2>Frase del día</h2></div>
      <figure class="quote" style="margin:0"><blockquote>${esc(q[0])}</blockquote><cite>${esc(q[1])}</cite></figure>
      <div class="sec"><h2>Explorar</h2></div>
      <div class="tiles">
        <a class="tile" href="#/tecnicas"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="3"/><path d="M10 8.2l4 1.8-4 1.8zM8 20h8"/></svg><div><b>Técnicas</b><span>Con video</span></div></a>
        <a class="tile" href="#/progreso"><svg viewBox="0 0 24 24"><path d="M4 20V11M10 20V5M16 20v-7M22 20H2"/></svg><div><b>Progreso</b><span>Por cinturón</span></div></a>
        <a class="tile" href="#/dojo"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.2a3 3 0 010 5.6M18 14.4c1.8.8 3 2.8 3 5.6"/></svg><div><b>Dojo</b><span>El grupo</span></div></a>
        <a class="tile" href="#/vocabulario"><svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5zM4 20.5A2.5 2.5 0 006.5 23H20v-5M9 8h6"/></svg><div><b>Vocabulario</b><span>Palabras y números</span></div></a>
      </div>
    </div>
  </div>`;
}

function row(t) {
  const b = beltOf(t.belt);
  return `<div class="trow${t.forbidden ? " forb" : ""}" data-act="open" data-slug="${t.slug}" role="button" tabindex="0">
    <span class="nb" style="--c:${b.color}"><b class="num">${String(t.n).padStart(2, "0")}</b>${t.video ? `<i class="pv">${PLAYI}</i>` : ""}</span>
    <div class="t"><b>${t.name}</b><span>${esc(t.es)}</span><span>Cinturón ${b.name.toLowerCase()}${t.origin ? " · " + t.origin : ""}${t.forbidden ? " · prohibida" : ""}</span></div>${markBtn(t.slug)}</div>`;
}
/* Lista agrupada como en ManuHQ: familia → grupo (Te-waza, Koshi-waza…) */
function listHtml() {
  const q = norm(F.q);
  let out = "", lastFam = "", any = false;
  for (const g of WAZA_GROUPS) {
    const all = TECHS.filter((t) => t.gid === g.id);
    const items = all.filter((t) => (F.belt === "todos" || t.belt === F.belt) && (!q || norm(t.name + t.es + t.groupEs).includes(q)));
    if (!items.length) continue;
    any = true;
    if (g.family !== lastFam) { out += `<div class="fam">${g.family === "Nage-waza" ? "Nage-waza · proyecciones" : "Katame-waza · controles"}</div>`; lastFam = g.family; }
    const d = mastered(all);
    out += `<section class="grp"><div class="gh"><div><h3>${g.name}</h3><span>${esc(g.es)}</span></div><div class="gp num">${d} / ${all.length}<div class="bar"><i style="width:${pct(d, all.length)}%"></i></div></div></div><div class="wgrid">${items.map(row).join("")}</div></section>`;
  }
  return any ? out : `<div class="empty">No encontré técnicas con ese filtro</div>`;
}
function vTecnicas() {
  const chip = (v, label, sw, n) => `<button class="fchip" data-f="belt" data-v="${v}" aria-pressed="${F.belt === v}">${sw ? `<i class="belt-sw" style="--c:${sw}"></i>` : ""}${label}<em class="num">${n}</em></button>`;
  return `
  <h1 class="h1">Técnicas</h1>
  <p class="lead">Las 100 del Kodokan, por cinturón. Tocá una para ver el video.</p>
  <div class="sticky">
    <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" type="search" placeholder="Buscar técnica" value="${esc(F.q)}" autocomplete="off" enterkeyhint="search"></label>
    <div class="chips">${chip("todos", "Todas", "", 100)}${BELTS.map((b) => chip(b.id, b.name, COLORS[b.id], techsOfBelt(b.id).length)).join("")}</div>
  </div>
  <div class="legend"><span><i></i>Sin empezar</span><span><i class="l1"></i>En práctica</span><span><i class="l2"></i>Dominada</span><span>· tocá el círculo para cambiar</span></div>
  <div id="list">${listHtml()}</div>`;
}

function vDetalle(slug) {
  const t = BY_SLUG[slug]; if (!t) return vTecnicas();
  const b = beltOf(t.belt), s = st(slug);
  const list = TECHS.filter((x) => F.belt === "todos" || x.belt === F.belt);
  const i = Math.max(0, list.findIndex((x) => x.slug === slug));
  const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
  const risky = /Shime|Kansetsu/.test(t.group);
  const video = t.video
    ? `<div class="video" id="video"><button class="vposter" data-act="play" data-id="${esc(t.video)}" style="background-image:url(${poster(t.video)})" aria-label="Reproducir video de ${esc(t.name)}"><span class="vplay">${PLAYI}</span><span class="vsrc">Video oficial del Kodokan</span></button></div>`
    : `<div class="video"><div class="vnone"><b>Todavía no hay video</b><span>Esta técnica no tiene video cargado todavía.</span></div></div>`;
  return `
  <button class="back" data-act="back"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Técnicas</button>
  <div class="dgrid">
    <div class="dleft"><div class="gifslot" id="gifslot"></div>${video}</div>
    <div class="dright">
      <p class="eyebrow num">Técnica ${String(t.n).padStart(2, "0")} de 100</p>
      <h1 class="dtitle">${t.name}</h1>
      <p class="dsub">${esc(t.es)}</p>
      <div class="tags"><span class="tag"><i class="belt-sw" style="--c:${b.color}"></i>Cinturón ${b.name.toLowerCase()}</span><span class="tag">${t.family === "Nage-waza" ? "Proyección" : "Suelo"} · ${esc(t.groupEs)}</span>${t.origin ? `<span class="tag">${t.origin}</span>` : ""}${t.forbidden ? `<span class="tag red">Prohibida en competencia</span>` : ""}</div>
      ${DESC[slug] ? `<p class="desc">${esc(DESC[slug])}</p>` : ""}
      <div class="seg" role="group" aria-label="Mi estado">${["Sin empezar", "En práctica", "Dominada"].map((l, v) => `<button data-act="set" data-slug="${slug}" data-v="${v}" aria-pressed="${s === v}">${l}</button>`).join("")}</div>
      ${risky ? `<p class="note">Las estrangulaciones y luxaciones se practican siempre con supervisión del sensei.</p>` : ""}
      <div class="nav2"><button data-act="goto" data-slug="${prev.slug}"><small>Anterior</small><b>${esc(prev.name)}</b></button><button data-act="goto" data-slug="${next.slug}"><small>Siguiente</small><b>${esc(next.name)}</b></button></div>
    </div>
  </div>`;
}
function afterDetalle(slug) {
  /* si el grupo subió un GIF propio a media/waza/, se muestra arriba */
  const img = new Image();
  img.onload = () => { const g = $("#gifslot"); if (!g) return; g.innerHTML = `<div class="gifbox"></div><p class="note" style="margin:8px 0 14px">Video del dojo</p>`; $(".gifbox", g).appendChild(img); img.alt = "GIF de " + slug; };
  img.src = `media/waza/${slug}.gif`;
}

function accountCard() {
  if (!Auth.enabled) return "";
  const u = Auth.user;
  return u
    ? `<div class="card" style="margin-bottom:12px"><p style="font-weight:800">Sesión iniciada</p><p class="sub" style="font-size:.88rem;margin:2px 0 14px">${esc(u.email)} · tu progreso se guarda en tu cuenta.</p><div class="row-btns"><a class="btn ghost sm" href="#/dojo">Ver el dojo</a><button class="btn ghost sm" data-act="logout">Cerrar sesión</button></div></div>`
    : `<div class="card" style="margin-bottom:12px"><p style="font-weight:800">Iniciá sesión</p><p class="sub" style="font-size:.88rem;margin:2px 0 14px">Guardá tu progreso en la nube y aparecé en el dojo.</p><a class="btn blue sm" href="#/cuenta">Ingresar o crear cuenta</a></div>`;
}
function vProgreso() {
  const total = mastered(), p = pct(total, 100);
  return `
  <h1 class="h1">Progreso</h1>
  <p class="lead">${esc(S.name || "Tu avance")} · cinturón ${beltOf(S.belt).name.toLowerCase()}</p>
  <div class="pgrid">
    <div>
      <div class="card ringwrap"><div class="ring">${ringSvg(p)}<div class="n num">${p}%</div></div><div><h2 class="num">${total} / 100</h2><p>${learning()} en práctica<br>${100 - total - learning()} sin empezar</p></div></div>
      <div class="sec"><h2>Por cinturón</h2></div>
      ${BELTS.map((b) => { const l = techsOfBelt(b.id), m = mastered(l);
        return `<a class="card brow" href="#/tecnicas" data-belt="${b.id}" style="--c:${b.id === "negro" ? "#161a26" : COLORS[b.id]}"><div class="h"><i class="belt-sw" style="--c:${COLORS[b.id]};width:16px;height:16px"></i><b>${b.name}</b><span class="num">${m} / ${l.length}</span></div><div class="bar"><i style="width:${pct(m, l.length)}%"></i></div></a>`; }).join("")}
    </div>
    <div>
      <div class="sec"><h2>Mi cuenta</h2></div>
      ${accountCard()}
      <div class="card">
        <label class="field"><span>Nombre</span><input id="f-name" value="${esc(S.name)}" placeholder="Tu nombre" autocomplete="given-name" maxlength="40"></label>
        <label class="field"><span>Cinturón actual</span><select id="f-belt">${LEVELS.map((b) => `<option value="${b.id}"${b.id === S.belt ? " selected" : ""}>${b.name}</option>`).join("")}</select></label>
        ${Auth.enabled ? "" : `<button class="btn blue" style="width:100%" data-act="copy-ficha">Copiar mi ficha para el sensei</button>`}
      </div>
      <div class="sec"><h2>Respaldo</h2></div>
      <div class="card"><p class="sub" style="margin-bottom:14px;font-size:.9rem">${Auth.user ? "Tu progreso también está en tu cuenta. Esto es un respaldo extra." : "Tu progreso vive en este teléfono. Si cambiás de equipo, copiá el respaldo y pegalo en el nuevo."}</p>
      <div class="row-btns"><button class="btn ghost sm" data-act="export">Copiar respaldo</button><button class="btn ghost sm" data-act="import">Pegar respaldo</button><button class="btn ghost sm" data-act="reset">Borrar todo</button></div></div>
    </div>
  </div>`;
}

/* Cuenta: ingresar / crear */
let authMode = "in", authErr = "", authOk = "", authBusy = false;
function vCuenta() {
  if (!Auth.enabled) return `<h1 class="h1">Cuenta</h1><p class="lead">El inicio de sesión todavía no está conectado.</p><div class="notice">Cuando se conecte, vas a poder guardar tu progreso y aparecer en el dojo.</div>`;
  const u = Auth.user;
  if (u) return `<h1 class="h1">Cuenta</h1><p class="lead">Ya tenés la sesión iniciada.</p><div class="authbox">${accountCard()}</div>`;
  const up = authMode === "up";
  return `
  <h1 class="h1">${up ? "Crear cuenta" : "Ingresar"}</h1>
  <p class="lead">${up ? "Sumate al dojo y guardá tu progreso." : "Entrá para ver a los demás y sincronizar tu progreso."}</p>
  <div class="card authbox">
    <div class="tabs2"><button data-act="authmode" data-m="in" aria-pressed="${!up}">Ingresar</button><button data-act="authmode" data-m="up" aria-pressed="${up}">Crear cuenta</button></div>
    <form id="authform" novalidate>
      ${up ? `<label class="field"><span>Nombre</span><input name="name" autocomplete="name" maxlength="40" placeholder="Tu nombre" value="${esc(S.name)}"></label>` : ""}
      <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" inputmode="email" placeholder="tu@email.com" required></label>
      <label class="field"><span>Contraseña</span><input name="password" type="password" autocomplete="${up ? "new-password" : "current-password"}" placeholder="Mínimo 6 caracteres" required></label>
      ${authErr ? `<p class="err">${esc(authErr)}</p>` : ""}${authOk ? `<p class="okmsg">${esc(authOk)}</p>` : ""}
      <button class="btn blue" style="width:100%" type="submit"${authBusy ? " disabled" : ""}>${authBusy ? "Un momento…" : up ? "Crear cuenta" : "Ingresar"}</button>
    </form>
  </div>`;
}

/* Dojo: solo quienes se registran en la app (Supabase) + el sensei */
const senseiCards = (extra = []) => [{ name: SENSEI.name }, ...extra].map((s) => `<div class="sensei" style="margin-bottom:12px"><div class="sj" aria-hidden="true">師</div><div><small>Sensei</small><b>${esc(s.name)}</b></div></div>`).join("");
const countOf = (p) => (p.me ? mastered() : (p.done || []).filter((s) => BY_SLUG[s]).length);
function dojoPeople() {
  if (!PROFILES) return null;
  const mine = Auth.user && Auth.user.id;
  return PROFILES.filter((p) => !p.is_sensei).map((p) => {
    const me = p.id === mine;
    return { ...p, me, name: (me ? S.name : p.name) || p.name || "Sin nombre", belt: me ? S.belt : p.belt, done: me ? slugsWith(2) : p.done || [], learning: me ? slugsWith(1) : p.learning || [] };
  }).sort((a, b) => a.name.localeCompare(b.name, "es"));
}
function vDojo() {
  const logged = !!Auth.user, people = logged ? dojoPeople() : null;
  const extraSensei = logged && PROFILES ? PROFILES.filter((p) => p.is_sensei && norm(p.name) !== norm(SENSEI.name)).map((p) => ({ name: p.name || "Sensei" })) : [];
  let body;
  if (!Auth.enabled) body = `<div class="notice">Las cuentas todavía no están conectadas.</div>`;
  else if (!logged) body = `<div class="card"><p style="font-weight:800">Mirá quién más está en la app</p><p class="sub" style="font-size:.88rem;margin:2px 0 14px">Iniciá sesión o creá tu cuenta para ver a los judokas del dojo y su progreso, y para que ellos te vean a vos.</p><a class="btn blue sm" href="#/cuenta">Ingresar o crear cuenta</a></div>`;
  else if (!people) body = `<div class="empty">Cargando el dojo…</div>`;
  else if (!people.length) body = `<div class="empty">Todavía no hay judokas registrados.</div>`;
  else body = `<div class="sec"><h2>Judokas</h2><span class="sub num" style="font-size:.8rem;font-weight:700">${people.length}</span></div>
    <div class="people">${people.map((a) => { const b = beltOf(a.belt), n = countOf(a);
      return `<a class="card person" href="#/dojo/${a.id}"><div class="avatar" style="--c:${b.color}">${esc(a.name.trim()[0]?.toUpperCase() || "?")}</div><div class="t"><b>${esc(a.name)}</b><span>Cinturón ${b.name.toLowerCase()}${a.me ? " · vos" : ""}</span><div class="bar"><i style="width:${n}%"></i></div></div><div class="n num">${n}<small>DE 100</small></div></a>`; }).join("")}</div>`;
  return `
  <h1 class="h1">Dojo</h1>
  <p class="lead">${people && people.length ? `${people.length} judoka${people.length === 1 ? "" : "s"}, en orden alfabético. ` : ""}Acá no hay ranking: se crece juntos. Tocá a alguien para ver su progreso.</p>
  ${senseiCards(extraSensei)}
  ${body}
  <div class="sec"><h2>Judokan</h2></div>
  <a class="card link" href="${LINKS[0].u}" target="_blank" rel="noopener"><div><b>Judokan Uruguay</b><span>Horarios, noticias y contacto</span></div>${ARROW}</a>`;
}
/* Ficha de un judoka: su progreso completo */
function vJudoka(id) {
  const p = (dojoPeople() || []).find((x) => x.id === id);
  if (!p) return `<button class="back" data-act="back" data-to="#/dojo"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Dojo</button><div class="empty">${PROFILES ? "No encontré a esa persona." : "Cargando…"}</div>`;
  const b = beltOf(p.belt), dn = new Set(p.done), ln = new Set(p.learning), total = countOf(p), pc = pct(total, 100);
  const chips = (set, cls) => TECHS.filter((t) => set.has(t.slug)).map((t) => `<a class="tchip ${cls}" href="#/t/${t.slug}"><i class="belt-sw" style="--c:${beltOf(t.belt).color}"></i>${t.name}</a>`).join("");
  return `
  <button class="back" data-act="back" data-to="#/dojo"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Dojo</button>
  <div class="pgrid">
    <div>
      <div class="card ringwrap"><div class="avatar big" style="--c:${b.color}">${esc(p.name.trim()[0]?.toUpperCase() || "?")}</div><div><h2>${esc(p.name)}${p.me ? " <span class=\"sub\" style=\"font-size:.9rem\">· vos</span>" : ""}</h2><p>Cinturón ${b.name.toLowerCase()}<br><b class="num">${total} / 100</b> dominadas · ${ln.size} en práctica</p></div></div>
      <div class="sec"><h2>Por cinturón</h2></div>
      ${BELTS.map((bl) => { const l = techsOfBelt(bl.id), m = l.filter((t) => dn.has(t.slug)).length;
        return `<div class="card brow" style="--c:${bl.id === "negro" ? "#161a26" : COLORS[bl.id]}"><div class="h"><i class="belt-sw" style="--c:${COLORS[bl.id]};width:16px;height:16px"></i><b>${bl.name}</b><span class="num">${m} / ${l.length}</span></div><div class="bar"><i style="width:${pct(m, l.length)}%"></i></div></div>`; }).join("")}
    </div>
    <div>
      <div class="sec" style="margin-top:0"><h2>Dominadas</h2><span class="sub num" style="font-size:.8rem;font-weight:700">${total}</span></div>
      <div class="tchips">${chips(dn, "ok") || `<p class="sub">Todavía ninguna.</p>`}</div>
      <div class="sec"><h2>En práctica</h2><span class="sub num" style="font-size:.8rem;font-weight:700">${ln.size}</span></div>
      <div class="tchips">${chips(ln, "warn") || `<p class="sub">Ninguna por ahora.</p>`}</div>
    </div>
  </div>`;
}

/* Vocabulario */
let gq = "";
function vocabHtml() {
  const q = norm(gq), hit = (...s) => !q || norm(s.join(" ")).includes(q);
  const groups = FRASES.map((g) => {
    const items = g.items.filter((i) => hit(i[0], i[1], i[2]));
    return items.length ? `<div class="sec"><h2>${g.title}</h2></div><div class="card vlist">${items.map((i) => `<div class="vitem"><div class="jp" lang="ja">${i[1]}</div><div class="tx"><b>${esc(i[0])}</b><span>${esc(i[2])}</span></div><button class="spk" data-act="speak" data-t="${esc(i[1])}" aria-label="Escuchar ${esc(i[0])}">${SPK}</button></div>`).join("")}</div>` : "";
  }).join("");
  const gl = GLOSSARY.filter((g) => hit(g));
  const glossary = gl.length ? `<div class="sec"><h2>Técnica y cuerpo</h2></div><div class="card vlist">${gl.map((g) => { const i = g.indexOf(":"); return `<div class="vitem"><div class="tx">${i > 0 ? `<b>${esc(g.slice(0, i))}</b><span>${esc(g.slice(i + 1).trim())}</span>` : `<span>${esc(g)}</span>`}</div></div>`; }).join("")}</div>` : "";
  return (groups + glossary) || `<div class="empty">Sin resultados</div>`;
}
function vVocabulario() {
  return `
  <h1 class="h1">Vocabulario</h1>
  <p class="lead">Palabras, frases del dojo y cómo contar hasta diez en japonés. Tocá el parlante para escucharlas.</p>
  <div class="sec" style="margin-top:6px"><h2>Contar hasta diez</h2><span class="sub" style="font-size:.8rem;font-weight:700">数 · kazu</span></div>
  <div class="nums">${NUMEROS.map(([n, k, r, kana]) => `<button class="numc" data-act="speak" data-t="${kana}" aria-label="${n}: ${r}. Escuchar"><span class="k" lang="ja">${k}</span><span class="r">${r}</span><span class="d num">${n}</span></button>`).join("")}</div>
  <p class="note">En clase se cuenta ichi, ni, san, shi, go, roku, shichi, hachi, kyū, jū. El 4, el 7 y el 9 tienen dos lecturas: <b>shi / yon</b>, <b>shichi / nana</b> y <b>kyū / ku</b>.</p>
  <label class="search" style="margin-top:22px"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="gq" type="search" placeholder="Buscar palabra o frase" value="${esc(gq)}" autocomplete="off"></label>
  <div id="vocab">${vocabHtml()}</div>
  <div class="vgrid">
    <div><div class="sec"><h2>Reglas en breve</h2></div>
    <div class="card"><ul class="rules">
      <li><b>Ippon</b> gana el combate. Dos <b>waza-ari</b> suman ippon.</li>
      <li>Inmovilización: 10 s es waza-ari, 20 s es ippon.</li>
      <li>Combate de adultos: 4 minutos. Empate: <b>Golden Score</b>.</li>
      <li>Tres <b>shidos</b> son hansoku-make.</li>
      <li>Prohibidas: ${FORBIDDEN.join(", ")}.</li></ul></div></div>
    <div><div class="sec"><h2>Categorías de peso</h2></div>
    <div class="card">${Object.entries(WEIGHTS).map(([k, v]) => `<p class="subh">${k}</p><div class="weights">${v.map((w) => `<span>${w} kg</span>`).join("")}</div>`).join("")}</div></div>
  </div>
  <div class="sec"><h2>Links</h2></div>
  <div class="links">${LINKS.map((l) => `<a class="card link" href="${l.u}" target="_blank" rel="noopener"><div><b>${l.t}</b><span>${l.d}</span></div>${ARROW}</a>`).join("")}</div>
  <p class="foot">Jita kyōei · prosperar juntos</p>`;
}

/* ---------- Router ---------- */
const VIEWS = { inicio: vInicio, tecnicas: vTecnicas, progreso: vProgreso, dojo: vDojo, vocabulario: vVocabulario, cuenta: vCuenta };
let current = "", navCount = 0;
function route(isNav) {
  if (isNav) navCount++;
  let h = (location.hash || "#/inicio").replace(/^#\/?/, "").split("/");
  if (h[0] === "mas") h = ["vocabulario"];
  document.body.classList.toggle("detail", h[0] === "t");
  renderChrome();
  if (h[0] === "t" && h[1] && BY_SLUG[h[1]]) {
    current = "t"; view.innerHTML = vDetalle(h[1]); window.scrollTo(0, 0); afterDetalle(h[1]); return;
  }
  if (h[0] === "dojo" && h[1]) {
    const first = current !== "dojo-p"; current = "dojo-p";
    const y = window.scrollY; view.innerHTML = vJudoka(h[1]);
    document.querySelectorAll(".tabbar a[data-tab]").forEach((a) => { if (a.dataset.tab === "dojo") a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    window.scrollTo(0, first ? 0 : y);
    if (first && Auth.user) loadProfiles();
    return;
  }
  const name = VIEWS[h[0]] ? h[0] : "inicio";
  const keep = name === current ? window.scrollY : 0;
  const entering = name !== current;
  current = name; view.innerHTML = VIEWS[name]();
  document.querySelectorAll(".tabbar a[data-tab]").forEach((a) => { if (a.dataset.tab === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  window.scrollTo(0, keep);
  if (name === "dojo" && entering) loadProfiles();
}
const refreshList = () => { $("#list").innerHTML = listHtml(); };

/* ---------- Eventos ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act],[data-f],[data-belt]");
  if (!el) return;
  if (el.dataset.belt) { F = { q: "", belt: el.dataset.belt }; return; }
  if (el.dataset.f) { F[el.dataset.f] = el.dataset.v; const y = window.scrollY; route(false); window.scrollTo(0, y); return; }
  const slug = el.dataset.slug;
  switch (el.dataset.act) {
    case "open": e.preventDefault(); location.hash = "#/t/" + slug; break;
    case "goto": location.replace("#/t/" + slug); break;
    case "back": if (navCount > 0) history.back(); else location.hash = el.dataset.to || "#/tecnicas"; break;
    case "play": $("#video").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(el.dataset.id)}?autoplay=1&rel=0&playsinline=1&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Video de la técnica"></iframe>`; break;
    case "speak": speak(el.dataset.t); break;
    case "cycle": e.stopPropagation(); setSt(slug, (st(slug) + 1) % 3); if (current === "tecnicas") { const y = window.scrollY; refreshList(); window.scrollTo(0, y); } break;
    case "set": setSt(slug, +el.dataset.v);
      document.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === +el.dataset.v)));
      if (+el.dataset.v === 2) toast("Técnica dominada 🥋"); break;
    case "authmode": authMode = el.dataset.m; authErr = authOk = ""; route(false); break;
    case "logout": Auth.signOut().then(() => { PROFILES = null; toast("Sesión cerrada"); location.hash = "#/inicio"; }); break;
    case "copy-ficha": copy(`{ name: ${JSON.stringify(S.name || "Nombre")}, belt: "${S.belt}", dominadas: ${JSON.stringify(slugsWith(2))} },`, "Ficha copiada. Mandásela al sensei"); break;
    case "export": copy(JSON.stringify(S), "Respaldo copiado"); break;
    case "import": { const v = prompt("Pegá tu respaldo:"); if (!v) break;
      try { const o = JSON.parse(v); if (typeof o.prog !== "object") throw 0; S = { name: "", belt: "blanco", prog: {}, ...o }; save(); route(false); toast("Progreso restaurado"); } catch { toast("Ese respaldo no es válido"); } break; }
    case "reset": if (confirm("¿Borrar todo tu progreso en este dispositivo?")) { S = { name: "", belt: "blanco", prog: {} }; save(); route(false); toast("Listo, empezás de cero"); } break;
  }
});
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "authform") return;
  e.preventDefault();
  const f = new FormData(e.target), email = (f.get("email") || "").trim(), pw = f.get("password") || "", name = (f.get("name") || "").trim();
  authErr = authOk = "";
  if (!email || !pw) { authErr = "Completá el email y la contraseña."; return route(false); }
  authBusy = true; route(false);
  try {
    if (authMode === "up") {
      if (name) { S.name = name; save(); }
      const r = await Auth.signUp(email, pw, name);
      if (r.needsConfirm) { authOk = "Cuenta creada. Revisá tu correo para confirmarla y después ingresá."; authMode = "in"; }
      else toast("¡Bienvenido al dojo!");
    } else await Auth.signIn(email, pw);
    if (Auth.user) location.hash = "#/dojo";
  } catch (err) { authErr = err.message; }
  authBusy = false; route(false);
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("[role=button]")) { e.preventDefault(); location.hash = "#/t/" + e.target.dataset.slug; }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "q") { F.q = e.target.value; refreshList(); }
  else if (e.target.id === "gq") { gq = e.target.value; $("#vocab").innerHTML = vocabHtml(); }
  else if (e.target.id === "f-name") { S.name = e.target.value.trim(); save(); renderChrome(); }
  else if (e.target.id === "f-belt") { S.belt = e.target.value; save(); renderChrome(); }
});
async function copy(text, msg) { try { await navigator.clipboard.writeText(text); toast(msg); } catch { prompt("Copiá este texto:", text); } }

/* Si el link del mail venció o es inválido, Supabase vuelve con #error=...: avisar y llevar a Ingresar */
if (/[#&]error_code=/.test(location.hash)) {
  const expired = /otp_expired/.test(location.hash);
  history.replaceState(null, "", location.pathname + "#/cuenta");
  authErr = expired ? "El link del mail venció o ya se usó. Ingresá con tu email y contraseña; si no podés, creá la cuenta de nuevo." : "No se pudo confirmar el mail. Probá ingresar de nuevo.";
}
Auth.onChange(async (u) => { if (u) { await syncDown(); loadProfiles(); } else PROFILES = null; route(false); });
window.addEventListener("hashchange", () => route(true));
route(false);
Auth.init();
/* el Dojo se actualiza solo cada 20 s mientras se mira */
setInterval(() => { if (Auth.user && (current === "dojo" || current === "dojo-p") && !document.hidden) loadProfiles(); }, 20000);
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
