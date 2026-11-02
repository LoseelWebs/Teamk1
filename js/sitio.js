/* =========================================================
   Team K-1 · página pública
   Lee el contenido desde Supabase (tabla "sitios") y lo dibuja.
   Si Supabase no responde, usa la última copia guardada en el
   navegador o, si no hay, el contenido que ya trae el HTML.
   ========================================================= */
(() => {
const CFG = window.SITIO_CONFIG || {};
const CACHE_KEY = "sitio-cache-" + (CFG.SITIO_ID || "sitio");
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl = u => /^(https?:\/\/|img\/|data:image\/)/.test(String(u || "")) ? String(u) : "";
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const ICW = '<svg viewBox="0 0 24 24" class="ic"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3z"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24" class="chev"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const XIC = '<svg viewBox="0 0 24 24" class="ic"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const DIAS = [[1,"Lun"],[2,"Mar"],[3,"Mié"],[4,"Jue"],[5,"Vie"],[6,"Sáb"],[0,"Dom"]];

/* foto de fondo para un recuadro */
const ph = (url, extra = "") => { const u = safeUrl(url); return `<span class="ph${u ? " has" : ""}${extra ? " " + extra : ""}"${u ? ` style="--img:url('${esc(u)}')"` : ""} aria-hidden="true"></span>`; };
const hora12 = s => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ""); if (!m) return s || ""; const H = +m[1]; return ((H + 11) % 12 + 1) + ":" + m[2] + (H >= 12 ? " p. m." : " a. m."); };
const rango = c => hora12(c.inicio) + " – " + hora12(c.fin);

let C = null;          // contenido actual
let WA = "#";          // enlace de WhatsApp

function links(c) {
  const k = c.contacto || {};
  WA = "https://wa.me/" + String(k.whatsapp || "").replace(/\D/g, "") + (k.mensaje_whatsapp ? "?text=" + encodeURIComponent(k.mensaje_whatsapp) : "");
  return { wa: WA, tel: "tel:+" + String(k.whatsapp || "").replace(/\D/g, ""), mapa: safeUrl(k.mapa) || "#", fb: safeUrl(k.facebook) || "#" };
}

/* ---------- dibujar cada sección ---------- */
const TEMA_DEF = { principal: "#ff1f1f", acento: "#c6f11a", fondo: "#08080a", main_event: "" };
function tema(t) {
  t = Object.assign({}, TEMA_DEF, t || {});
  const ok = v => /^#[0-9a-f]{6}$/i.test(v || "");
  const st = document.documentElement.style;
  if (ok(t.principal)) { st.setProperty("--red", t.principal); st.setProperty("--acc", t.principal); }
  if (ok(t.acento)) st.setProperty("--lime", t.acento);
  if (ok(t.fondo)) st.setProperty("--bg", t.fondo);
  st.setProperty("--mev", ok(t.main_event) ? t.main_event : "#f5c242");
  const mt = document.querySelector('meta[name="theme-color"]'); if (mt && ok(t.fondo)) mt.content = t.fondo;
}
function render(c) {
  if (!c || typeof c !== "object") return;
  C = c;
  tema(c.tema);
  const L = links(c), n = c.negocio || {}, i = c.inicio || {}, k = c.contacto || {};
  const set = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };
  document.title = n.titulo_pestana || document.title;

  /* Inicio */
  set(".hero .in", `<span class="over">${esc(i.lugar)}</span><h1>${esc(i.titulo1)}<span>${esc(i.titulo2)}</span></h1>
    <p>${esc(i.texto)}</p>
    <div class="row" style="justify-content:center"><a class="btn-acc" href="${esc(L.wa)}" target="_blank" rel="noopener">${ICW}${esc(i.boton1)}</a><a class="btn-gh" href="#horarios">${esc(i.boton2)}</a></div>`);
  const fr = (i.franja || []).map(w => `<span>${esc(w)}</span><i>✦</i>`).join("");
  set(".ribbon .mq", fr.repeat(4));
  const card = (t, cls, tag, attrs) => `<${tag} class="qc${cls}" ${attrs}><small>${esc(t.etiqueta)}</small><b>${esc(t.titulo)}</b><span>${esc(t.texto)}</span><em>${esc(t.enlace)}</em></${tag}>`;
  const th = i.tarjeta_hoy || {};
  set(".quick",
    `<a class="qc hot" href="#horarios"><small data-today-l>${esc(th.etiqueta)}</small><b data-today-n>${esc(th.titulo)}</b><span data-today-h>${esc(th.texto)}</span><em>${esc(th.enlace)}</em></a>` +
    card(i.tarjeta_precio || {}, "", "a", 'href="#horarios"') +
    card(i.tarjeta_competencias || {}, " lime", "button", 'type="button" data-comp') +
    card(i.tarjeta_ubicacion || {}, "", "a", `href="${esc(L.mapa)}" target="_blank" rel="noopener"`));
  const bw = i.boton_wfn || {};
  set(".wfnbtn > span", `<small>${esc(bw.etiqueta)}</small><b>${esc(bw.titulo)}</b><em>${esc(bw.enlace)}</em>`);

  /* Clases */
  const cl = c.clases || {};
  set("#clases .w", `<div class="sh"><div><span class="eb">${esc(cl.eyebrow)}</span><h2>${esc(cl.titulo)}</h2></div><p>${esc(cl.texto)}</p></div>
    <div class="posters">${(cl.disciplinas || []).map((d, x) => `<div class="poster">${ph(d.foto)}<small>${String(x + 1).padStart(2, "0")}</small><h3>${esc(d.nombre)}</h3><p>${esc(d.texto)}</p></div>`).join("")}</div>
    <div class="groups">${(cl.grupos || []).map(g => `<div class="g"><i>${esc(g.etiqueta)}</i><b>${esc(g.nombre)}</b><span>${esc(g.horario)}</span></div>`).join("")}</div>`);

  /* Horarios */
  const h = c.horarios || {}, cs = h.clases || [];
  const usados = new Set(cs.flatMap(x => x.dias || []));
  const cols = DIAS.filter(([d]) => d >= 1 && d <= 5 || usados.has(d));
  const grid = `<div class="sgrid" role="table" aria-label="Horario semanal" style="grid-template-columns:minmax(118px,1.6fr) repeat(${cols.length},1fr)">
    <div class="h c">Clase</div>${cols.map(([, t]) => `<div class="h">${t}</div>`).join("")}
    ${cs.map(x => `<div class="c${x.destacado ? " spar" : ""}"><b>${esc(x.nombre)}</b><small>${esc(x.detalle || rango(x))}</small></div>` +
      cols.map(([d]) => (x.dias || []).includes(d) ? '<div class="y"><i></i></div>' : '<div class="n"><i></i></div>').join("")).join("")}</div>`;
  const p = h.precio || {};
  set("#horarios .w", `<div class="sh"><div><span class="eb">${esc(h.eyebrow)}</span><h2>${esc(h.titulo)}</h2></div><p>${esc(h.texto)}</p></div>
    ${grid}<p class="snote">${h.nota_titulo ? `<b>${esc(h.nota_titulo)}</b> ` : ""}${esc(h.nota)}</p>
    <div class="admit"><div class="left"><small>${esc(p.etiqueta)}</small><div class="big">${esc(p.monto)}</div></div>
    <div><ul>${(p.beneficios || []).map(b => `<li>${esc(b)}</li>`).join("")}</ul><p class="insc"><b>${esc(p.inscripcion_titulo)}</b> ${esc(p.inscripcion)}</p></div>
    <a class="btn-lime" href="${esc(L.wa)}" target="_blank" rel="noopener">${ICW}${esc(p.boton)}</a></div>`);

  /* Equipo */
  const e = c.equipo || {}, co = e.coaches || [];
  const corner = x => `<div class="corner">${ph(x.foto)}<small>${esc(x.rol)}</small><h3>${esc(x.nombre)}</h3></div>`;
  const tape = co.length === 2
    ? `<div class="tape">${corner(co[0])}<span class="vs">&amp;</span>${corner(co[1])}</div>`
    : `<div class="tape tape-n" style="--n:${Math.min(Math.max(co.length, 1), 3)}">${co.map(corner).join("")}</div>`;
  const b = e.banda || {};
  set("#equipo .w", `<div class="sh"><div><span class="eb">${esc(e.eyebrow)}</span><h2>${esc(e.titulo)}</h2></div><p>${esc(e.texto)}</p></div>
    ${tape}
    ${(e.comparativa || []).length ? `<div class="rowsT">${e.comparativa.map(r => `<div><b>${esc(r.izq)}</b><span>${esc(r.etiqueta)}</span><b>${esc(r.der)}</b></div>`).join("")}</div>` : ""}
    <div class="sh" style="margin-top:44px"><div><span class="eb">${esc(e.uniforme_eyebrow)}</span><h2>${esc(e.uniforme_titulo)}</h2></div></div>
    <div class="unibox">${(e.uniforme || []).map(u => `<figure>${safeUrl(u.foto) ? `<img src="${esc(safeUrl(u.foto))}" alt="${esc(u.nombre)}">` : ph("")}<figcaption>${esc(u.nombre)}</figcaption></figure>`).join("")}</div>
    <div class="compband"><div><span class="eb" style="color:#fff">${esc(b.eyebrow)}</span><h2>${esc(b.titulo)}</h2><p>${esc(b.texto)}</p></div><button class="btn-lime" type="button" data-comp>${esc(b.boton)}</button></div>`);

  /* Nosotros */
  const o = c.nosotros || {};
  set("#nosotros", `<div class="nos-hero"><p class="cap">${esc(o.frase)}</p><div class="rot2" id="rot2">${(o.palabras || []).map(w => `<span>${esc(w)}</span>`).join("")}<span class="oss">${esc(o.final)}</span></div></div>
    <div class="w">
    <div class="nos-block"><p class="gt">Misión</p><p class="reveal">${esc(o.mision)}</p>
      <div class="nos-btns"><a class="btn-acc sq" href="#horarios">Ver horarios</a><a class="btn-out sq" href="#clases">Clases</a></div></div>
    <div class="nos-split">${ph(o.foto_vision)}<div><p class="gt">Visión</p><p class="reveal">${esc(o.vision)}</p></div></div>
    <div class="nos-block"><p class="cap red">${esc(o.valores_eyebrow)}</p><h2 class="gt big">${esc(o.valores_titulo)}</h2>
      <div class="vals">${(o.valores || []).map(v => `<div class="val">${ph(v.foto)}<h4>${esc(v.nombre)}</h4><p>${esc(v.texto)}</p></div>`).join("")}</div></div>
    <div class="nos-cta"><h3 class="gt">${esc(o.cta_titulo)}</h3><a class="btn-acc sq" href="${esc(L.wa)}" target="_blank" rel="noopener">${ICW}${esc(o.cta_boton)}</a></div>
    </div>`);

  /* Contacto */
  set("#contacto .w", `<div class="sh"><div><span class="eb">${esc(k.eyebrow)}</span><h2>${esc(k.titulo)}</h2></div></div>
    <div class="contact"><div class="cbox"><div class="tel"><a href="${esc(L.tel)}" style="color:inherit;text-decoration:none">${esc(k.telefono)}</a></div><address>${esc(k.direccion1)}<br>${esc(k.direccion2)}</address>
    <div class="row"><a class="btn-acc" href="${esc(L.wa)}" target="_blank" rel="noopener">${ICW}WhatsApp</a><a class="btn-gh" href="${esc(L.mapa)}" target="_blank" rel="noopener">Cómo llegar</a><a class="btn-gh" href="${esc(L.fb)}" target="_blank" rel="noopener">Facebook</a></div>
    ${k.resena_texto ? `<div class="rate"><b>${esc(k.resena_cifra)}</b>${esc(k.resena_texto)}</div>` : ""}</div>${ph(k.foto)}</div>`);

  /* Competencias: panel lateral y ventanas */
  const cp = c.competencias || {}, wku = cp.wku || {}, wfn = cp.wfn || {};
  set("#comp .clist", `<button type="button" class="ci" data-open="m-wku"><span><small>${esc(wku.eyebrow)}</small><b>${esc(wku.titulo)}</b></span>${CHEV}</button>
    <button type="button" class="ci" data-open="m-wfn" data-tab="liga"><span><small>${esc(wfn.eyebrow)}</small><b>${esc(wfn.titulo)}</b></span>${CHEV}</button>
    <button type="button" class="ci hot" data-open="m-wfn" data-tab="peleas"><span><small>${esc((c.cartelera || {}).evento)}</small><b>Combates</b></span><em>Main event</em>${CHEV}</button>`);
  const gal = g => `<div class="mini">${(g || []).map(u => ph(u)).join("")}</div>`;
  set("#m-wku .mh > div", `<span class="eb">${esc(wku.eyebrow)}</span><h2 id="t-wku">${esc(wku.titulo)}</h2>`);
  set("#m-wku .mbody", `${ph(wku.foto, "r169")}<p class="mp">${esc(wku.texto)}</p>${gal(wku.galeria)}`);
  set("#m-wfn .mh > div", `<span class="eb">${esc(wfn.eyebrow)}</span><h2 id="t-wfn">${esc(wfn.titulo)}</h2>`);
  set('#m-wfn [data-p="liga"]', `${ph(wfn.foto, "r169")}<p class="mp">${esc(wfn.texto)}</p>${gal(wfn.galeria)}`);
  const fmc = $(".fm-c"); if (fmc) fmc.textContent = wku.titulo || "";

  /* Menú y pie de página */
  $$(".fm-wa").forEach(a => a.href = L.wa); $$(".fm-map").forEach(a => a.href = L.mapa);
  const pie = c.pie || {};
  set(".mft-in", `<div class="mft-logo"><img src="img/logo-tri.png" alt=""><b>${esc(String(n.nombre || "").toUpperCase())}</b><span>${esc(String(n.subtitulo || "").toUpperCase())}</span></div>
    <div class="mft-cols">
    <div><h5>Academia</h5><a href="#inicio">Inicio</a><a href="#clases">Clases</a><a href="#horarios">Horarios</a><a href="#equipo">Equipo</a><a href="#nosotros">Nosotros</a></div>
    <div><h5>Competencias</h5><a href="#" data-open="m-wfn" data-tab="peleas">WFN · Combates</a><a href="#" data-open="m-wfn" data-tab="liga">${esc(wfn.eyebrow)}</a><a href="#" data-open="m-wku">${esc(wku.titulo)}</a></div>
    <div><h5>Visítanos</h5><a href="${esc(L.mapa)}" target="_blank" rel="noopener">${esc(k.direccion1)}</a><a href="#contacto">${esc(k.direccion2)}</a><a href="${esc(L.tel)}">${esc(k.telefono)}</a></div>
    <div><h5>Redes</h5><a href="${esc(L.fb)}" target="_blank" rel="noopener">Facebook</a><a href="${esc(L.wa)}" target="_blank" rel="noopener">WhatsApp</a></div></div>
    <div class="mft-bot"><span>${esc(String(n.nombre || "").toUpperCase())} ©${esc(pie.anio)}</span><span>${esc(String(n.ciudad || "").toUpperCase())}</span><span>${esc(pie.texto_inferior)}</span></div>`);

  renderCard();
  hoy();
  initReveal();
  if (!$("#nosotros").hidden) rotRun();
}

/* ---------- tarjeta "Hoy": se calcula con los horarios ---------- */
function hoy() {
  const cs = ((C || {}).horarios || {}).clases || [], t0 = ((C || {}).inicio || {}).tarjeta_hoy || {};
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const t = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  const deHoy = cs.filter(x => (x.dias || []).includes(now.getDay())).sort((a, b) => a.inicio < b.inicio ? -1 : 1);
  const cur = deHoy.find(x => t >= x.inicio && t < x.fin), sig = deHoy.find(x => x.inicio > t), q = cur || sig;
  $$("[data-today-l]").forEach(e => e.textContent = cur ? "En clase ahora" : sig ? "Siguiente clase hoy" : (t0.etiqueta || "Hoy"));
  $$("[data-today-n]").forEach(e => e.textContent = q ? q.nombre : (t0.titulo || ""));
  $$("[data-today-h]").forEach(e => e.textContent = q ? rango(q) : (t0.texto || ""));
}

/* ---------- cartelera WFN ---------- */
const DEF_WORDS = ["WARRIOR", "FIGHT", "NIGHT", "WFN", "POZA RICA", "COATZINTLA", "AMAMM"];
const rowsDe = w => { w = (w || []).filter(Boolean); if (!w.length) w = DEF_WORDS; return Array.from({ length: 8 }, (_, k) => `<div class="mev-row">${Array.from({ length: 24 }, (_, i) => `<span>${esc(String(w[(i + k) % w.length]).toUpperCase())}</span>`).join("")}</div>`).join(""); };
const fname = p => [p.nombre, p.apellido].filter(Boolean).join(" ") || "Por anunciar";
const meta = p => [p.origen, p.record].filter(Boolean).map(esc).join(" · ");
function renderCard() {
  const box = $("#fightcard"), c = (C || {}).cartelera;
  if (!box || !c || !c.main) return;
  const m = c.main, r = m.rojo || {}, a = m.azul || {};
  const pic = p => safeUrl(p.foto) ? `<img class="mev-ph" src="${esc(safeUrl(p.foto))}" alt="${esc(fname(p))}">` : "";
  const side = (p, cl) => `<div class="side ${cl}"><span class="av"${safeUrl(p.foto) ? ` style="background-image:url('${esc(safeUrl(p.foto))}')"` : ""}></span><span class="nm"><b>${esc(fname(p))}</b><span>${meta(p) || "&nbsp;"}</span></span></div>`;
  const all = c.peleas || [], est = all.filter(b => b.seccion !== "preliminar"), pre = all.filter(b => b.seccion === "preliminar");
  const row = (b, n, mini) => `<div class="bout${b.tipo ? " co" : ""}${mini ? " mini" : ""}"><span class="bn">${n}</span>${side(b.rojo || {}, "l")}<div class="w"><b>VS</b><span>${b.tipo ? esc(b.tipo) + " · " : ""}${esc(b.div)}</span><span>${esc(b.rounds)}</span></div>${side(b.azul || {}, "r")}</div>`;
  const total = all.length + 1;
  const rows = `${est.length ? `<div class="secl">Cartelera estelar <em>${est.length + 1} peleas</em></div><div class="bouts">${est.map((b, i) => row(b, total - 1 - i, false)).join("")}</div>` : ""}
   ${pre.length ? `<details class="prelims"${innerWidth > 560 ? " open" : ""}><summary><span class="secl">Preliminares <em>${pre.length} peleas</em></span></summary><div class="bouts">${pre.map((b, i) => row(b, pre.length - i, true)).join("")}</div></details>` : ""}`;
  const mr = meta(r), ma = meta(a);
  const fig = p => { const u = safeUrl(p.foto); if (!u) return ""; const j = p.ajuste || {}, n = (v, d) => isFinite(+v) && v !== "" && v != null ? +v : d;
    return `<i class="m3-beam"></i><span class="fx" style="--src:url('${esc(u)}');--ax:${n(j.x, 0)}%;--ay:${n(j.y, 0)}%;--as:${n(j.s, 100) / 100}">${pic(p)}<i class="m-shade"></i><i class="m-rim"></i></span>`; };
  box.innerHTML = `<div class="ev"><span><b>${esc(c.evento)}</b></span><span>${esc(c.fecha)} · ${esc(c.lugar)}</span></div>
   <div class="mev mev3"><div class="mev-bg"><div class="mev-rows">${rowsDe(c.fondo)}</div></div>
    <div class="m3-luces"></div>
    <img class="mev-logo" src="img/wfn-logo.png" alt="WFN Combat League">
    <div class="mev-duo"><div class="fa">${fig(r)}</div><div class="fb">${fig(a)}</div></div>
    <div class="m3-fondo"></div>
    <div class="mev-names"><span class="ln">${esc(r.apellido || r.nombre)}</span><span class="ln"><span class="mvs">VS</span>${esc(a.apellido || a.nombre)}</span><span class="btype">${esc(m.div)} · Main event</span>${mr || ma ? `<span class="mev-meta">${mr} <i>vs</i> ${ma}</span>` : ""}</div>
    <div class="mev-date">${esc(String(c.fecha || "").toUpperCase())}</div><div class="mev-sp"><span>${esc(c.lugar)}</span><span>WFN Combat League</span></div></div>
   <div class="ordnote">La numeración indica el orden de la noche: la pelea 1 abre la función y el main event la cierra.</div>${rows}
   <p class="fnote">Récord: victorias – derrotas – empates. Combates sujetos a cambios.</p>`;
}

/* ---------- navegación por pestañas ---------- */
const K = ["inicio", "clases", "horarios", "equipo", "nosotros", "contacto"];
function show(k, first) {
  if (!K.includes(k)) k = "inicio";
  K.forEach(id => { const s = document.getElementById(id); if (s) s.hidden = id !== k; });
  if (!first) scrollTo({ top: 0, behavior: "auto" });
  const base = ((C || {}).negocio || {}).titulo_pestana || "Academia Team K-1";
  document.title = (k === "inicio" ? "" : k[0].toUpperCase() + k.slice(1) + " · ") + base;
  if (k === "nosotros") rotRun();
  setTimeout(paintRv, 60);
}
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const k = a.getAttribute("href").slice(1);
  if (K.includes(k)) { e.preventDefault(); if (location.hash !== "#" + k) history.pushState(null, "", "#" + k); show(k); }
  else if (k === "") e.preventDefault();
});
addEventListener("popstate", () => show(location.hash.slice(1)));

/* ---------- panel de competencias ---------- */
const dr = $("#comp");
document.addEventListener("click", e => {
  if (e.target.closest("[data-comp]")) dr && dr.classList.add("open");
  else if (e.target.closest("[data-close]")) dr && dr.classList.remove("open");
});

/* ---------- ventanas flotantes ---------- */
let mFrom = null;
function mTab(m, t) { m.querySelectorAll(".mtabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.t === t)); m.querySelectorAll("[data-p]").forEach(p => p.hidden = p.dataset.p !== t); m.querySelector(".mbox").scrollTop = 0; }
function mOpen(id, tab) { const m = document.getElementById(id); if (!m) return; mFrom = document.activeElement; dr && dr.classList.remove("open"); m.hidden = false; document.documentElement.style.overflow = "hidden"; if (tab) mTab(m, tab); const x = m.querySelector(".x"); x && x.focus(); }
function mClose(m) { m.hidden = true; document.documentElement.style.overflow = ""; mFrom && mFrom.focus && mFrom.focus(); }
document.addEventListener("click", e => {
  const o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); mOpen(o.dataset.open, o.dataset.tab); return; }
  const c = e.target.closest("[data-mclose]"); if (c) { mClose(c.closest(".modal")); return; }
  const t = e.target.closest(".mtabs button"); if (t) mTab(t.closest(".modal"), t.dataset.t);
});
addEventListener("keydown", e => { if (e.key === "Escape") { $$(".modal:not([hidden])").forEach(mClose); dr && dr.classList.remove("open"); } });

/* ---------- botón Menú ---------- */
(() => {
  const b = $(".mbtn"), m = $("#fmenu"); if (!b || !m) return; const t = b.querySelector("span");
  const set = o => { m.hidden = !o; b.setAttribute("aria-expanded", o); b.classList.toggle("on", o); t.textContent = o ? "Cerrar" : "Menú"; document.documentElement.classList.toggle("fm-open", o); };
  const cur = () => { const v = $("main>.view:not([hidden])"); m.querySelectorAll("a[data-k]").forEach(a => a.classList.toggle("on", !!v && a.dataset.k === v.id)); };
  b.addEventListener("click", () => { cur(); set(m.hidden); });
  m.addEventListener("click", e => { if (e.target.closest("a,button")) set(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !m.hidden) set(false); });
})();

/* ---------- textos de Misión/Visión que se iluminan al bajar ---------- */
function initReveal() { $$(".reveal").forEach(rv => { rv.innerHTML = rv.textContent.split(" ").map(w => `<span>${esc(w)}</span>`).join(" "); }); paintRv(); }
function paintRv() { $$(".reveal").forEach(rv => { if (!rv.offsetParent) return; const r = rv.getBoundingClientRect(), vh = innerHeight, p = Math.min(1, Math.max(0, (vh * .9 - r.top) / (r.height + vh * .25))), ws = rv.querySelectorAll("span"), n = Math.round(p * ws.length); ws.forEach((w, i) => w.classList.toggle("on", i < n)); }); }
addEventListener("scroll", paintRv, { passive: true });

/* ---------- palabras de Nosotros que terminan en "Oss" ---------- */
let rotT = [];
function rotRun() {
  const box = $("#rot2"); if (!box) return; const w = [...box.children];
  rotT.forEach(clearTimeout); rotT = []; w.forEach(x => x.className = x.classList.contains("oss") ? "oss" : "");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { w[w.length - 1] && w[w.length - 1].classList.add("on"); return; }
  w.forEach((x, i) => rotT.push(setTimeout(() => { if (i) w[i - 1].classList.replace("on", "out"); x.classList.add("on"); }, i * 1400)));
}

/* ---------- cargar contenido ---------- */
async function cargar() {
  try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); if (c) render(c); } catch (e) {}
  if (!CFG.SUPABASE_URL || /TU-PROYECTO/.test(CFG.SUPABASE_URL)) return;
  try {
    const r = await fetch(`${CFG.SUPABASE_URL}/rest/v1/sitios?id=eq.${encodeURIComponent(CFG.SITIO_ID)}&select=contenido`,
      { headers: { apikey: CFG.SUPABASE_ANON_KEY }, cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    const rows = await r.json();
    if (rows[0] && rows[0].contenido) { render(rows[0].contenido); try { localStorage.setItem(CACHE_KEY, JSON.stringify(rows[0].contenido)); } catch (e) {} }
  } catch (e) { console.warn("No se pudo leer Supabase; se muestra la última copia.", e); }
}

/* contenido de respaldo incluido en la página */
try { const el = document.getElementById("contenido-respaldo"); if (el) render(JSON.parse(el.textContent)); } catch (e) {}
show(location.hash.slice(1) || "inicio", true);
cargar();
})();
