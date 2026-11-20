/* Judo Uruguay · app (sin build, sin dependencias) */
(() => {
"use strict";

/* ---------- Datos derivados ---------- */
const LEVELS = [{ id: "blanco", name: "Blanco", color: "#f2f2f2" }, ...BELTS];
const beltOf = (id) => LEVELS.find((b) => b.id === id) || LEVELS[0];
const slugify = (n) => n.toLowerCase();
const FORBID = new Set(FORBIDDEN);

const TECHS = [];
{
  let order = 0;
  for (const g of WAZA_GROUPS)
    for (const name of g.items)
      TECHS.push({
        name, slug: slugify(name), belt: wazaBelt(name), family: g.family,
        group: g.name, groupEs: g.es, origin: wazaOrigin(name),
        es: WAZA_ES[name] || "", forbidden: FORBID.has(name), order: order++,
      });
}
const BY_SLUG = Object.fromEntries(TECHS.map((t) => [t.slug, t]));
const BELT_IDS = BELTS.map((b) => b.id);
const techsOfBelt = (id) => TECHS.filter((t) => t.belt === id);

/* Descripciones cortas: las frases "Waza" que empiezan con el nombre de la técnica */
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
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const HALF = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>';
function stateBtn(slug) {
  const s = st(slug);
  return `<button class="state" data-act="cycle" data-slug="${slug}" data-s="${s}" aria-label="${["Sin empezar", "Aprendiendo", "Dominada"][s]}: tocá para cambiar">${s === 2 ? CHECK : s === 1 ? HALF : ""}</button>`;
}
const dailyQuote = () => {
  const d = new Date(); const n = d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate();
  return JUDO_QUOTES[n % JUDO_QUOTES.length];
};
function ring(p, big, small) {
  const r = 42, c = 2 * Math.PI * r;
  return `<div class="ring"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="${r}"/><circle class="fg" cx="50" cy="50" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}" stroke-linecap="round"/></svg><div class="n"><span>${big}<small>${small}</small></span></div></div>`;
}
const initials = (n) => (n.replace(/^Ejemplo · /, "").trim()[0] || "?").toUpperCase();

/* ---------- Vistas ---------- */
let F = { q: "", belt: "todos", fam: "todas", st: "todas" };

function vInicio() {
  const total = mastered(), p = pct(total, TECHS.length);
  const cur = beltOf(S.belt);
  const idx = LEVELS.findIndex((b) => b.id === S.belt);
  const targetBelt = LEVELS[Math.min(idx + 1, LEVELS.length - 1)];
  const targetId = idx >= LEVELS.length - 1 ? "negro" : targetBelt.id;
  const pending = techsOfBelt(targetId).filter((t) => st(t.slug) !== 2).slice(0, 3);
  const q = dailyQuote();
  return `
  <div class="card hero">
    ${ring(p, total, "DE 100")}
    <div>
      <p class="eyebrow" style="margin:0 0 6px">Hola${S.name ? ", " + esc(S.name.split(" ")[0]) : ""}</p>
      <h1>${total ? `${p}% del camino` : "Empecemos"}</h1>
      <p><span class="chip-belt"><i class="belt-dot" style="--c:${cur.color}"></i>Cinturón ${cur.name.toLowerCase()}</span>${learning() ? ` · ${learning()} aprendiendo` : ""}</p>
    </div>
  </div>
  <div class="section-h"><h2>Frase del día</h2></div>
  <div class="card quote"><blockquote>${esc(q[0])}</blockquote><span class="src">${esc(q[1])}</span></div>
  ${S.belt === "negro" ? "" : `
  <div class="section-h"><h2>Para ${targetBelt.name.toLowerCase() === "negro" ? "el" : "tu"} cinturón ${esc(targetBelt.name.toLowerCase())}</h2><a href="#/tecnicas" data-belt="${targetId}">Ver todas</a></div>
  <div class="card next"><ul>${pending.length ? pending.map((t) => `<li>${stateBtn(t.slug)}<button data-act="open" data-slug="${t.slug}"><b>${t.name}</b><br><small>${esc(t.es)}</small></button></li>`).join("") : "<li>¡Ya dominás todas las de este cinturón! 🥋</li>"}</ul></div>`}
  <div class="shortcuts">
    <a class="card shortcut" href="#/tecnicas"><b>Técnicas</b><span>Las 100 del Kodokan</span></a>
    <a class="card shortcut" href="#/progreso"><b>Mi progreso</b><span>Por cinturón</span></a>
    <a class="card shortcut" href="#/dojo"><b>Dojo</b><span>El grupo</span></a>
    <a class="card shortcut" href="#/mas"><b>Glosario</b><span>Vocabulario y reglas</span></a>
  </div>`;
}

function filtered() {
  const q = norm(F.q);
  return TECHS.filter((t) =>
    (F.belt === "todos" || t.belt === F.belt) &&
    (F.fam === "todas" || t.family === F.fam) &&
    (F.st === "todas" || (F.st === "pend" ? st(t.slug) === 0 : F.st === "learn" ? st(t.slug) === 1 : st(t.slug) === 2)) &&
    (!q || norm(t.name + t.es + t.groupEs).includes(q)));
}
function wazaRow(t) {
  return `<div class="waza${t.forbidden ? " forb" : ""}" data-act="open" data-slug="${t.slug}" role="button" tabindex="0">
    <i class="belt-dot" style="--c:${beltOf(t.belt).color}"></i>
    <div class="t"><b>${t.name}</b><span>${esc(t.es)}${t.forbidden ? " · prohibida" : ""}</span></div>${stateBtn(t.slug)}</div>`;
}
function listHtml() {
  const list = filtered();
  if (!list.length) return `<div class="empty">No encontré técnicas con esos filtros.</div>`;
  let out = "";
  if (F.belt === "todos" && !F.q) {
    for (const b of LEVELS.slice(1)) {
      const items = list.filter((t) => t.belt === b.id);
      if (!items.length) continue;
      out += `<div class="belt-head"><i class="belt-dot" style="--c:${b.color}"></i>${b.name} <em>· ${mastered(items)}/${items.length}</em></div>` + items.map(wazaRow).join("");
    }
  } else out = list.map(wazaRow).join("");
  return out;
}
function vTecnicas() {
  const chip = (k, v, label, extra = "") => `<button class="chip" data-f="${k}" data-v="${v}" aria-pressed="${F[k] === v}">${extra}${label}</button>`;
  return `
  <h1 class="page-title">Técnicas</h1>
  <p class="page-sub">Las 100 del Kodokan, ordenadas por cinturón.</p>
  <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="q" type="search" placeholder="Buscar: o-goshi, cadera, estrangulación…" value="${esc(F.q)}" autocomplete="off" enterkeyhint="search"></label>
  <div class="chips">${chip("belt", "todos", "Todos")}${BELTS.map((b) => chip("belt", b.id, b.name, `<i class="belt-dot" style="--c:${b.color}"></i>`)).join("")}</div>
  <div class="chips">${chip("fam", "todas", "Nage + Katame")}${chip("fam", "Nage-waza", "Proyecciones")}${chip("fam", "Katame-waza", "Suelo")}${chip("st", "pend", "Sin empezar")}${chip("st", "learn", "Aprendiendo")}${chip("st", "done", "Dominadas")}</div>
  <div class="legend"><span><i></i>Sin empezar</span><span><i class="l1"></i>Aprendiendo</span><span><i class="l2"></i>Dominada</span><small>· tocá el círculo para cambiar</small></div>
  <div id="list">${listHtml()}</div>`;
}

function vProgreso() {
  const total = mastered(), p = pct(total, TECHS.length);
  return `
  <h1 class="page-title">Mi progreso</h1>
  <p class="page-sub">Se guarda en este teléfono.</p>
  <div class="card hero">${ring(p, p + "%", "DOMINADO")}<div><h1>${total} / 100</h1><p>${learning()} aprendiendo · ${100 - total - learning()} sin empezar</p></div></div>
  <div class="section-h"><h2>Por cinturón</h2></div>
  ${BELTS.map((b) => { const l = techsOfBelt(b.id), m = mastered(l);
    return `<a class="card belt-row" href="#/tecnicas" data-belt="${b.id}" style="--c:${b.color}"><div class="h"><i class="belt-dot" style="--c:${b.color}"></i><b>${b.name}</b><span>${m} / ${l.length}</span></div><div class="bar"><i style="width:${pct(m, l.length)}%"></i></div></a>`; }).join("")}
  <div class="section-h"><h2>Mi ficha</h2></div>
  <div class="card">
    <label class="field"><span>NOMBRE</span><input id="f-name" value="${esc(S.name)}" placeholder="Tu nombre" autocomplete="given-name" maxlength="40"></label>
    <label class="field"><span>CINTURÓN ACTUAL</span><select id="f-belt">${LEVELS.map((b) => `<option value="${b.id}"${b.id === S.belt ? " selected" : ""}>${b.name}</option>`).join("")}</select></label>
    <div class="row-btns"><button class="btn red sm" data-act="copy-ficha">Copiar mi ficha para el sensei</button></div>
  </div>
  <div class="section-h"><h2>Respaldo</h2></div>
  <div class="card">
    <p class="muted" style="margin-bottom:12px;font-size:.88rem">Si cambiás de teléfono, exportá tu progreso y pegalo en el nuevo.</p>
    <div class="row-btns"><button class="btn sm" data-act="export">Copiar respaldo</button><button class="btn sm" data-act="import">Pegar respaldo</button><button class="btn sm" data-act="reset">Borrar todo</button></div>
  </div>`;
}

function alumnoCount(a) { return Array.isArray(a.dominadas) ? a.dominadas.length : a.dominadas || 0; }
function vDojo() {
  const mine = { name: S.name || "Yo", belt: S.belt, dominadas: mastered(), me: true };
  const all = [...ALUMNOS, ...(S.name ? [mine] : [])]
    .sort((a, b) => LEVELS.findIndex((x) => x.id === b.belt) - LEVELS.findIndex((x) => x.id === a.belt) || a.name.localeCompare(b.name));
  const demo = ALUMNOS.some((a) => a.demo);
  return `
  <h1 class="page-title">Dojo</h1>
  <p class="page-sub">El grupo, ordenado por cinturón. Acá no hay ranking: se crece juntos (<i>jita kyōei</i>).</p>
  ${demo ? `<div class="notice">Estos alumnos son de ejemplo. Se reemplazan en <b>js/extra.js</b>.</div>` : ""}
  ${all.map((a) => { const b = beltOf(a.belt), n = alumnoCount(a);
    return `<div class="card person"><div class="avatar" style="--c:${b.color}">${esc(initials(a.name))}</div><div class="t"><b>${esc(a.name)}${a.me ? " (vos)" : ""}</b><span class="muted" style="font-size:.8rem">Cinturón ${b.name.toLowerCase()}</span><div class="bar" style="--c:${b.color}"><i style="width:${n}%"></i></div></div><span class="n">${n}/100</span></div>`; }).join("")}
  <div class="section-h"><h2>Judokan</h2></div>
  <a class="card link-card" href="${LINKS[0].u}" target="_blank" rel="noopener"><b>${LINKS[0].t}</b><span>Horarios, noticias y contacto →</span></a>`;
}

let gq = "";
function glossHtml() {
  const q = norm(gq);
  const l = GLOSSARY.filter((g) => !q || norm(g).includes(q));
  return l.length ? l.map((g) => { const i = g.indexOf(":"); return `<div class="gloss">${i > 0 ? `<b>${esc(g.slice(0, i))}</b>:${esc(g.slice(i + 1))}` : esc(g)}</div>`; }).join("") : `<div class="empty">Nada por acá.</div>`;
}
function vMas() {
  return `
  <h1 class="page-title">Más</h1>
  <p class="page-sub">Glosario, reglas y links.</p>
  <div class="section-h" style="margin-top:0"><h2>Glosario</h2></div>
  <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="gq" type="search" placeholder="Buscar término…" value="${esc(gq)}" autocomplete="off"></label>
  <div class="card" id="gloss" style="padding:4px 16px">${glossHtml()}</div>
  <div class="section-h"><h2>Reglas en 30 segundos</h2></div>
  <div class="card"><p>• <b>Ippon</b> gana el combate. Dos <b>waza-ari</b> suman ippon.</p><p>• Inmovilización: 10 s = waza-ari · 20 s = ippon.</p><p>• Combate de adultos: 4 min. Empate → <b>Golden Score</b>.</p><p>• 3 <b>shidos</b> = hansoku-make.</p><p>• Prohibidas: ${FORBIDDEN.join(", ")}.</p></div>
  <div class="section-h"><h2>Categorías de peso</h2></div>
  <div class="card">${Object.entries(WEIGHTS).map(([k, v]) => `<b>${k}</b><div class="weights">${v.map((w) => `<span>${w} kg</span>`).join("")}</div>`).join('<div style="height:14px"></div>')}</div>
  <div class="section-h"><h2>Links</h2></div>
  ${LINKS.map((l) => `<a class="card link-card" href="${l.u}" target="_blank" rel="noopener"><b>${l.t}</b><span>${l.d}</span></a>`).join("")}
  <p class="muted" style="text-align:center;margin-top:26px;font-size:.8rem">Judo Uruguay · hecho por y para el grupo 🥋</p>`;
}

/* ---------- Detalle de técnica ---------- */
const sheet = $("#sheet"), sheetBox = $(".sheet", sheet);
function mediaHtml(t) {
  const yt = "https://www.youtube.com/results?search_query=" + encodeURIComponent("Kodokan judo " + t.name);
  if (VIDEOS[t.slug])
    return `<div class="media" id="media"><button class="play" data-act="play" data-id="${esc(VIDEOS[t.slug])}" aria-label="Reproducir video"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.55)"/><path d="M10 8l6 4-6 4z" fill="#fff"/></svg></button></div>`;
  return `<div class="media"><img src="media/waza/${t.slug}.gif" alt="Animación de ${esc(t.name)}" loading="lazy" onerror="this.outerHTML='<div class=ph><svg viewBox=&quot;0 0 24 24&quot;><rect x=&quot;3&quot; y=&quot;5&quot; width=&quot;18&quot; height=&quot;14&quot; rx=&quot;3&quot;/><path d=&quot;M10 9l5 3-5 3z&quot;/></svg><div>Todavía no hay GIF de esta técnica.<br>Mirala en YouTube abajo.</div></div>'"></div>`;
}
function openTech(slug, push = true) {
  const t = BY_SLUG[slug]; if (!t) return;
  const b = beltOf(t.belt), s = st(slug);
  const yt = "https://www.youtube.com/results?search_query=" + encodeURIComponent("Kodokan judo " + t.name);
  const list = filtered().length ? filtered() : TECHS;
  const i = list.findIndex((x) => x.slug === slug);
  const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
  sheetBox.innerHTML = `<div class="grab"></div>
    <h2 id="sheet-title">${t.name}</h2>
    <p class="jp">${esc(t.es)}</p>
    <div class="tags"><span class="tag"><i class="belt-dot" style="--c:${b.color}"></i>${b.name}</span><span class="tag">${t.family === "Nage-waza" ? "Proyección" : "Suelo"} · ${esc(t.groupEs)}</span>${t.origin ? `<span class="tag">${t.origin}</span>` : ""}${t.forbidden ? `<span class="tag red">Prohibida en competencia</span>` : ""}</div>
    ${mediaHtml(t)}
    ${DESC[slug] ? `<p class="desc">${esc(DESC[slug])}</p>` : ""}
    <div class="seg" role="group" aria-label="Mi estado">${["Sin empezar", "Aprendiendo", "Dominada"].map((l, v) => `<button data-act="set" data-slug="${slug}" data-v="${v}" aria-pressed="${s === v}">${l}</button>`).join("")}</div>
    <a class="btn block" href="${yt}" target="_blank" rel="noopener">▶ Ver en YouTube</a>
    <div class="nav2"><button class="btn sm" data-act="open" data-slug="${prev.slug}">← ${esc(prev.name)}</button><button class="btn sm" data-act="open" data-slug="${next.slug}">${esc(next.name)} →</button></div>`;
  sheet.hidden = false; sheetBox.scrollTop = 0;
  document.body.style.overflow = "hidden";
  if (push && location.hash !== "#/t/" + slug) {
    if (!/^#\/t\//.test(location.hash)) openTech.base = location.hash || "#/inicio";
    history.pushState(null, "", "#/t/" + slug);
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
function refresh() { const y = window.scrollY; view.innerHTML = VIEWS[current](); window.scrollTo(0, y);
  if (!sheet.hidden) { const m = location.hash.match(/#\/t\/(.+)/); if (m) openTech(m[1], false); } }

/* ---------- Eventos ---------- */
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act],[data-f],[data-close],[data-belt]");
  if (!el) return;
  if (el.hasAttribute("data-close")) return closeSheet();
  if (el.dataset.belt) { F = { q: "", belt: el.dataset.belt, fam: "todas", st: "todas" }; return; } /* el href navega */
  if (el.dataset.f) {
    F[el.dataset.f] = el.dataset.v; const y = window.scrollY; render("tecnicas"); window.scrollTo(0, y); return;
  }
  const slug = el.dataset.slug;
  switch (el.dataset.act) {
    case "open": if (e.target.closest(".state")) break; e.preventDefault(); openTech(slug); break;
    case "cycle": e.stopPropagation(); setSt(slug, (st(slug) + 1) % 3);
      if (current === "tecnicas") { $("#list").innerHTML = listHtml(); } else refresh();
      break;
    case "set": setSt(slug, +el.dataset.v);
      sheetBox.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.v === +el.dataset.v)));
      if (+el.dataset.v === 2) toast("¡Técnica dominada! 🥋");
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
  if (current !== "tecnicas") { location.hash = "#/tecnicas"; }
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
