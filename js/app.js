/* Judo Uruguay · app (sin build, sin dependencias) */
(() => {
"use strict";

/* ---------- Datos derivados ---------- */
const COLORS = { blanco: "#ffffff", amarillo: "#e6b412", naranja: "#e8762b", verde: "#2e9e5b", azul: "#2f5fd0", marron: "#7a4e2d", negro: "#16140f" };
const LEVELS = [{ id: "blanco", name: "Blanco" }, ...BELTS].map((b) => ({ id: b.id, name: b.name, color: COLORS[b.id] }));
const beltOf = (id) => LEVELS.find((b) => b.id === id) || LEVELS[0];
const slugify = (n) => n.toLowerCase();
const FORBID = new Set(FORBIDDEN);

const TECHS = [];
for (const g of WAZA_GROUPS)
  for (const name of g.items)
    TECHS.push({
      name, slug: slugify(name), belt: wazaBelt(name), family: g.family,
      group: g.name, groupEs: g.es, origin: wazaOrigin(name),
      es: WAZA_ES[name] || "", forbidden: FORBID.has(name),
    });
const BY_SLUG = Object.fromEntries(TECHS.map((t) => [t.slug, t]));
const techsOfBelt = (id) => TECHS.filter((t) => t.belt === id);

const DESC = {};
for (const [q] of JUDO_QUOTES) {
  const i = q.indexOf(":");
  if (i > 0) {
    const key = slugify(q.slice(0, i).trim());
    if (BY_SLUG[key] && !DESC[key]) { const d = q.slice(i + 1).trim(); DESC[key] = d[0].toUpperCase() + d.slice(1); }
  }
}
const GLOSSARY = JUDO_QUOTES.filter((q) => q[1] === "Vocabulario").map((q) => q[0]);

/* ---------- Estado (localStorage) ---------- */
const KEY = "judouy.v1";
let S = { name: "", belt: "blanco", prog: {} };
try { S = { ...S, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };
const st = (slug) => S.prog[slug] || 0;
function setSt(slug, v) { if (v) S.prog[slug] = v; else delete S.prog[slug]; save(); }
const mastered = (list = TECHS) => list.filter((t) => st(t.slug) === 2).length;
const learning = (list = TECHS) => list.filter((t) => st(t.slug) === 1).length;

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ\-\s]/g, "");
const view = $("#view");
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2200);
}
const ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const markBtn = (slug) => {
  const s = st(slug);
  return `<button class="mark" data-act="cycle" data-slug="${slug}" data-s="${s}" aria-label="${["Sin empezar", "Aprendiendo", "Dominada"][s]}. Tocá para cambiar"><span>${s === 2 ? CHECK : ""}</span></button>`;
};
const dailyQuote = () => { const d = new Date(); return JUDO_QUOTES[(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % JUDO_QUOTES.length]; };
const initial = (n) => (n.trim()[0] || "?").toUpperCase();
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function beltBar(dark) {
  return `<div class="beltbar">${BELTS.map((b) => { const l = techsOfBelt(b.id);
    return `<i style="flex:${l.length};--c:${b.id === "negro" && dark ? "#f3f0e8" : COLORS[b.id]}"><b style="width:${pct(mastered(l), l.length)}%"></b></i>`; }).join("")}</div>`;
}

/* ---------- Vistas ---------- */
let F = { q: "", belt: "todos", fam: "todas", st: "todas" };

function vInicio() {
  const total = mastered();
  const cur = beltOf(S.belt);
  const idx = LEVELS.findIndex((b) => b.id === S.belt);
  const target = LEVELS[Math.min(idx + 1, LEVELS.length - 1)];
  const pending = techsOfBelt(target.id).filter((t) => st(t.slug) !== 2).slice(0, 4);
  const q = dailyQuote(), d = new Date();
  const first = S.name.trim().split(/\s+/)[0];
  return `
  <p class="kicker">${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}</p>
  <h1 class="greet">${first ? `Hola, <i>${esc(first)}</i>.` : "Bienvenido al <i>dojo</i>."}</h1>
  <div class="stat">
    <div class="row"><div class="big num">${total}<small>/ 100</small></div>
      <div class="lbl">técnicas<br>dominadas${learning() ? `<br>${learning()} en práctica` : ""}</div></div>
    ${beltBar(true)}
    <div class="cap"><span>Cinturón ${cur.name.toLowerCase()}</span><span>${pct(total, 100)}%</span></div>
  </div>
  ${first ? "" : `<a class="btn solid" style="margin-top:12px" href="#/progreso">Poné tu nombre y cinturón</a>`}
  <figure class="quote"><blockquote>${esc(q[0])}</blockquote><cite>${esc(q[1])}</cite></figure>
  ${S.belt === "negro" ? "" : `
  <div class="sec"><h2>Próximas · ${esc(target.name.toLowerCase())}</h2><a href="#/tecnicas" data-belt="${target.id}">Ver todas</a></div>
  <ul class="next">${pending.length ? pending.map((t) => `<li>${markBtn(t.slug)}<button data-act="open" data-slug="${t.slug}"><b>${t.name}</b><small>${esc(t.es)}</small></button></li>`).join("") : `<li><p style="padding:16px 0">Ya dominás todas las de este cinturón.</p></li>`}</ul>`}
  <ul class="menu" style="margin-top:36px">
    <li><a href="#/tecnicas"><div><b>Técnicas</b><span>Las 100 del Kodokan por cinturón</span></div>${ARROW}</a></li>
    <li><a href="#/progreso"><div><b>Mi progreso</b><span>Avance por cinturón y tu ficha</span></div>${ARROW}</a></li>
    <li><a href="#/dojo"><div><b>Dojo</b><span>El grupo</span></div>${ARROW}</a></li>
    <li><a href="#/mas"><div><b>Glosario y reglas</b><span>Vocabulario, puntuación, categorías</span></div>${ARROW}</a></li>
  </ul>`;
}

function filtered() {
  const q = norm(F.q);
  return TECHS.filter((t) =>
    (F.belt === "todos" || t.belt === F.belt) &&
    (F.fam === "todas" || t.family === F.fam) &&
    (F.st === "todas" || (F.st === "pend" ? st(t.slug) === 0 : F.st === "learn" ? st(t.slug) === 1 : st(t.slug) === 2)) &&
    (!q || norm(t.name + t.es + t.groupEs).includes(q)));
}
function wazaRow(t, n) {
  return `<div class="waza${t.forbidden ? " forb" : ""}" data-act="open" data-slug="${t.slug}" role="button" tabindex="0">
    <span class="ix num">${String(n).padStart(2, "0")}</span>
    <div class="t"><b>${t.name}</b><span>${esc(t.es)}${t.forbidden ? " · prohibida" : ""}</span></div>${markBtn(t.slug)}</div>`;
}
function listHtml() {
  const list = filtered();
  if (!list.length) return `<div class="empty">Sin resultados</div>`;
  const num = (t) => TECHS.findIndex((x) => x === t) + 1;
  if (F.belt === "todos" && !F.q) {
    let out = "";
    for (const b of LEVELS.slice(1)) {
      const items = list.filter((t) => t.belt === b.id);
      if (!items.length) continue;
      out += `<div class="belt-head"><i class="belt-sw" style="--c:${b.color}"></i><h2>${b.name}</h2><span class="num">${mastered(items)} / ${items.length}</span></div>` + items.map((t) => wazaRow(t, num(t))).join("");
    }
    return out;
  }
  return list.map((t) => wazaRow(t, num(t))).join("");
}
function vTecnicas() {
  const tab = (v, label, sw) => `<button class="tab" data-f="belt" data-v="${v}" aria-pressed="${F.belt === v}">${sw ? `<i class="belt-sw" style="--c:${sw}"></i>` : ""}${label}</button>`;
  const pill = (k, v, label) => `<button class="pill" data-f="${k}" data-v="${v}" aria-pressed="${F[k] === v}">${label}</button>`;
  return `
  <p class="kicker">Kodokan · 100 técnicas</p>
  <h1 class="page-title">Técnicas</h1>
  <div class="stick">
    <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" type="search" placeholder="Buscar técnica" value="${esc(F.q)}" autocomplete="off" enterkeyhint="search"></label>
    <div class="tabs">${tab("todos", "Todas")}${BELTS.map((b) => tab(b.id, b.name, COLORS[b.id])).join("")}</div>
  </div>
  <div class="filters">${pill("fam", "todas", "Todas")}${pill("fam", "Nage-waza", "Proyecciones")}${pill("fam", "Katame-waza", "Suelo")}${pill("st", "todas", "Cualquier estado")}${pill("st", "pend", "Sin empezar")}${pill("st", "learn", "En práctica")}${pill("st", "done", "Dominadas")}</div>
  <div class="legend"><span><i></i>Sin empezar</span><span><i class="l1"></i>En práctica</span><span><i class="l2"></i>Dominada</span></div>
  <div id="list">${listHtml()}</div>`;
}

function vProgreso() {
  const total = mastered();
  return `
  <p class="kicker">${esc(S.name || "Tu avance")}</p>
  <h1 class="page-title">Progreso</h1>
  <div class="stat">
    <div class="row"><div class="big num">${total}<small>/ 100</small></div><div class="lbl">${pct(total, 100)}%<br>completado</div></div>
    ${beltBar(true)}
    <div class="cap"><span>${learning()} en práctica</span><span>${100 - total - learning()} sin empezar</span></div>
  </div>
  <div class="sec"><h2>Por cinturón</h2></div>
  <div class="belt-list">${BELTS.map((b) => { const l = techsOfBelt(b.id), m = mastered(l);
    return `<a href="#/tecnicas" data-belt="${b.id}"><div class="h"><i class="belt-sw" style="--c:${COLORS[b.id]}"></i><b>${b.name}</b><span class="num">${m} / ${l.length}</span></div><div class="bar" style="--c:${b.id === "negro" ? "#16140f" : COLORS[b.id]}"><i style="width:${pct(m, l.length)}%"></i></div></a>`; }).join("")}</div>
  <div class="sec"><h2>Mi ficha</h2></div>
  <div style="padding-top:20px">
    <label class="field"><span>Nombre</span><input id="f-name" value="${esc(S.name)}" placeholder="Tu nombre" autocomplete="given-name" maxlength="40"></label>
    <label class="field"><span>Cinturón actual</span><select id="f-belt">${LEVELS.map((b) => `<option value="${b.id}"${b.id === S.belt ? " selected" : ""}>${b.name}</option>`).join("")}</select></label>
    <button class="btn solid" data-act="copy-ficha">Copiar mi ficha para el sensei</button>
  </div>
  <div class="sec"><h2>Respaldo</h2></div>
  <p class="muted" style="margin:16px 0 14px;font-size:.9rem">Tu progreso vive en este teléfono. Si cambiás de equipo, copiá el respaldo y pegalo en el nuevo.</p>
  <div class="row-btns"><button class="btn sm" data-act="export">Copiar respaldo</button><button class="btn sm" data-act="import">Pegar respaldo</button><button class="btn sm" data-act="reset">Borrar todo</button></div>`;
}

const alumnoCount = (a) => (Array.isArray(a.dominadas) ? a.dominadas.length : a.dominadas || 0);
function vDojo() {
  const mineKey = norm(S.name.trim().split(/\s+/)[0] || "");
  let people = ALUMNOS.map((a) => (mineKey && norm(a.name) === mineKey ? { ...a, belt: S.belt, dominadas: mastered(), me: true } : a));
  if (mineKey && !people.some((a) => a.me)) people.push({ name: S.name.trim(), belt: S.belt, dominadas: mastered(), me: true });
  people.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return `
  <p class="kicker">${people.length} judokas</p>
  <h1 class="page-title">Dojo</h1>
  <p class="page-sub">El grupo, en orden alfabético. Acá no hay ranking: se crece juntos.</p>
  <ul class="people">${people.map((a) => { const b = beltOf(a.belt), n = alumnoCount(a);
    return `<li class="person"><div class="avatar" style="--c:${b.color}">${esc(initial(a.name))}</div><div class="t"><b>${esc(a.name)}</b><span>Cinturón ${b.name.toLowerCase()}${a.me ? " · vos" : ""}</span><div class="bar"><i style="width:${n}%"></i></div></div><div class="n num">${n}<small> /100</small></div></li>`; }).join("")}</ul>
  <ul class="menu" style="margin-top:28px"><li><a href="${LINKS[0].u}" target="_blank" rel="noopener"><div><b>Judokan Uruguay</b><span>Horarios, noticias y contacto</span></div>${ARROW}</a></li></ul>`;
}

let gq = "";
function glossHtml() {
  const q = norm(gq);
  const l = GLOSSARY.filter((g) => !q || norm(g).includes(q));
  return l.length ? l.map((g) => { const i = g.indexOf(":"); return `<div class="gloss">${i > 0 ? `<b>${esc(g.slice(0, i))}</b>${esc(g.slice(i))}` : esc(g)}</div>`; }).join("") : `<div class="empty">Sin resultados</div>`;
}
function vMas() {
  return `
  <p class="kicker">Referencia</p>
  <h1 class="page-title">Más</h1>
  <div class="sec" style="margin-top:20px"><h2>Glosario</h2></div>
  <label class="search" style="margin-top:14px"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="gq" type="search" placeholder="Buscar término" value="${esc(gq)}" autocomplete="off"></label>
  <div id="gloss">${glossHtml()}</div>
  <div class="sec"><h2>Reglas en breve</h2></div>
  <ul class="rules">
    <li><b>Ippon</b> gana el combate. Dos <b>waza-ari</b> suman ippon.</li>
    <li>Inmovilización: 10 s es waza-ari, 20 s es ippon.</li>
    <li>Combate de adultos: 4 minutos. Empate: <b>Golden Score</b>.</li>
    <li>Tres <b>shidos</b> son hansoku-make.</li>
    <li>Prohibidas: ${FORBIDDEN.join(", ")}.</li>
  </ul>
  <div class="sec"><h2>Categorías de peso</h2></div>
  ${Object.entries(WEIGHTS).map(([k, v]) => `<p class="subh">${k}</p><div class="weights">${v.map((w) => `<span>${w} kg</span>`).join("")}</div>`).join("")}
  <div class="sec"><h2>Links</h2></div>
  <ul class="menu">${LINKS.map((l) => `<li><a href="${l.u}" target="_blank" rel="noopener"><div><b>${l.t}</b><span>${l.d}</span></div>${ARROW}</a></li>`).join("")}</ul>
  <p class="foot">Jita kyōei · prosperar juntos</p>`;
}

/* ---------- Detalle de técnica ---------- */
const sheet = $("#sheet"), sheetBox = $(".sheet", sheet);
function mediaHtml(t) {
  if (VIDEOS[t.slug])
    return `<div class="media" id="media"><button class="play" data-act="play" data-id="${esc(VIDEOS[t.slug])}" aria-label="Reproducir video"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.6)"/><path d="M10 8l6 4-6 4z" fill="#fff"/></svg></button></div>`;
  return `<div class="media"><img src="media/waza/${t.slug}.gif" alt="Animación de ${esc(t.name)}" loading="lazy" onerror="this.outerHTML='<div class=ph><em>柔</em>Todavía no hay animación<br>de esta técnica.</div>'"></div>`;
}
function openTech(slug, push = true) {
  const t = BY_SLUG[slug]; if (!t) return;
  const b = beltOf(t.belt), s = st(slug);
  const yt = "https://www.youtube.com/results?search_query=" + encodeURIComponent("Kodokan judo " + t.name);
  const list = filtered().length ? filtered() : TECHS;
  const i = Math.max(0, list.findIndex((x) => x.slug === slug));
  const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
  sheetBox.innerHTML = `<div class="grab"></div>
    <button class="x" data-close aria-label="Cerrar"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <p class="kicker">Técnica ${String(TECHS.indexOf(t) + 1).padStart(2, "0")} de 100</p>
    <h2 id="sheet-title">${t.name}</h2>
    <p class="es">${esc(t.es)}</p>
    <div class="tags"><span class="tag"><i class="belt-sw" style="--c:${b.color}"></i>${b.name}</span><span class="tag">${t.family === "Nage-waza" ? "Proyección" : "Suelo"} · ${esc(t.groupEs)}</span>${t.origin ? `<span class="tag">${t.origin}</span>` : ""}${t.forbidden ? `<span class="tag red">Prohibida en competencia</span>` : ""}</div>
    ${mediaHtml(t)}
    ${DESC[slug] ? `<p class="desc">${esc(DESC[slug])}</p>` : ""}
    <div class="seg" role="group" aria-label="Mi estado">${["Sin empezar", "En práctica", "Dominada"].map((l, v) => `<button data-act="set" data-slug="${slug}" data-v="${v}" aria-pressed="${s === v}">${l}</button>`).join("")}</div>
    <a class="btn" href="${yt}" target="_blank" rel="noopener">Ver en YouTube</a>
    <div class="nav2"><button data-act="open" data-slug="${prev.slug}"><small>Anterior</small><b>${esc(prev.name)}</b></button><button data-act="open" data-slug="${next.slug}"><small>Siguiente</small><b>${esc(next.name)}</b></button></div>`;
  sheet.hidden = false; sheetBox.scrollTop = 0;
  document.body.style.overflow = "hidden";
  if (push && location.hash !== "#/t/" + slug) {
    if (/^#\/t\//.test(location.hash)) history.replaceState(null, "", "#/t/" + slug);
    else history.pushState(null, "", "#/t/" + slug);
  }
}
function closeSheet(fromPop) {
  if (sheet.hidden) return;
  sheet.hidden = true; document.body.style.overflow = "";
  if (!fromPop && /^#\/t\//.test(location.hash)) history.back();
}

/* ---------- Router ---------- */
const VIEWS = { inicio: vInicio, tecnicas: vTecnicas, progreso: vProgreso, dojo: vDojo, mas: vMas };
let current = "";
function route() {
  const h = (location.hash || "#/inicio").replace(/^#\/?/, "").split("/");
  if (h[0] === "t" && h[1]) { if (!current) render("tecnicas"); openTech(h[1], false); return; }
  closeSheet(true);
  render(VIEWS[h[0]] ? h[0] : "inicio");
}
function render(name) {
  const keep = name === current ? window.scrollY : 0;
  current = name;
  view.innerHTML = VIEWS[name]();
  document.querySelectorAll(".tabbar a").forEach((a) => {
    if (a.dataset.tab === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  window.scrollTo(0, keep);
}
function refresh() { const y = window.scrollY; view.innerHTML = VIEWS[current](); window.scrollTo(0, y); }

/* ---------- Eventos ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act],[data-f],[data-close],[data-belt]");
  if (!el) return;
  if (el.hasAttribute("data-close")) return closeSheet();
  if (el.dataset.belt) { F = { q: "", belt: el.dataset.belt, fam: "todas", st: "todas" }; return; }
  if (el.dataset.f) { F[el.dataset.f] = el.dataset.v; const y = window.scrollY; render("tecnicas"); window.scrollTo(0, y); return; }
  const slug = el.dataset.slug;
  switch (el.dataset.act) {
    case "open": e.preventDefault(); openTech(slug); break;
    case "cycle": e.stopPropagation(); setSt(slug, (st(slug) + 1) % 3);
      if (current === "tecnicas") $("#list").innerHTML = listHtml(); else refresh();
      break;
    case "set": setSt(slug, +el.dataset.v);
      sheetBox.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === +el.dataset.v)));
      if (+el.dataset.v === 2) toast("Técnica dominada");
      if (current === "tecnicas") $("#list").innerHTML = listHtml(); else refresh();
      break;
    case "play": $("#media").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(el.dataset.id)}?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video de la técnica"></iframe>`; break;
    case "copy-ficha": copy(`{ name: ${JSON.stringify(S.name || "Nombre")}, belt: "${S.belt}", dominadas: ${JSON.stringify(TECHS.filter((t) => st(t.slug) === 2).map((t) => t.slug))} },`, "Ficha copiada. Mandásela al sensei"); break;
    case "export": copy(JSON.stringify(S), "Respaldo copiado"); break;
    case "import": { const v = prompt("Pegá tu respaldo:"); if (!v) break;
      try { const o = JSON.parse(v); if (typeof o.prog !== "object") throw 0; S = { name: "", belt: "blanco", prog: {}, ...o }; save(); render("progreso"); toast("Progreso restaurado"); } catch { toast("Ese respaldo no es válido"); } break; }
    case "reset": if (confirm("¿Borrar todo tu progreso en este teléfono?")) { S = { name: "", belt: "blanco", prog: {} }; save(); render("progreso"); toast("Listo, empezás de cero"); } break;
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
  if ((e.key === "Enter" || e.key === " ") && e.target.matches(".waza")) { e.preventDefault(); openTech(e.target.dataset.slug); }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "q") { F.q = e.target.value; $("#list").innerHTML = listHtml(); }
  else if (e.target.id === "gq") { gq = e.target.value; $("#gloss").innerHTML = glossHtml(); }
  else if (e.target.id === "f-name") { S.name = e.target.value.trim(); save(); }
  else if (e.target.id === "f-belt") { S.belt = e.target.value; save(); }
});
$("#btn-search").addEventListener("click", () => {
  closeSheet();
  if (current !== "tecnicas") location.hash = "#/tecnicas";
  setTimeout(() => $("#q")?.focus(), 80);
});
async function copy(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg); }
  catch { prompt("Copiá este texto:", text); }
}
window.addEventListener("hashchange", route);
window.addEventListener("popstate", route);
route();

if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
  navigator.serviceWorker.register("sw.js").catch(() => {});
})();
