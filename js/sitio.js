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
document.documentElement.classList.add("js");

const ICW = '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.2-.2-.5-.3z"/></svg>';
const CHEV = '<svg viewBox="0 0 24 24" class="chev" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>';
const DOWN = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
const PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>';
const DIAS = [[1,"Lun"],[2,"Mar"],[3,"Mié"],[4,"Jue"],[5,"Vie"],[6,"Sáb"],[0,"Dom"]];

/* la ruta se vuelve absoluta: dentro de una variable CSS, img/… se leería desde la carpeta css/ */
const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return u; } };
const ph = (url, extra = "") => { const u0 = safeUrl(url), u = u0 && abs(u0); return `<span class="ph${u ? " has" : ""}${extra ? " " + extra : ""}"${u ? ` style="--img:url('${esc(u)}')"` : ""} aria-hidden="true"></span>`; };
const hora12 = s => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ""); if (!m) return s || ""; const H = +m[1]; return ((H + 11) % 12 + 1) + ":" + m[2] + (H >= 12 ? "\u00a0p.\u00a0m." : "\u00a0a.\u00a0m."); };
const rango = c => hora12(c.inicio) + " – " + hora12(c.fin);
const rv = (kind, d) => ` data-rv${kind ? `="${kind}"` : ""}${d ? ` style="--d:${d}s"` : ""}`;

/* ---------- valores para lo que aún no existe en Supabase ---------- */
const DEF = window.SITIO_DEF || {};
const isObj = v => v && typeof v === "object" && !Array.isArray(v);
function fill(c, d) { for (const k in d) { if (c[k] === undefined || c[k] === null) c[k] = JSON.parse(JSON.stringify(d[k])); else if (isObj(c[k]) && isObj(d[k])) fill(c[k], d[k]); } return c; }

let C = null, WA = "#";
function links(c) {
  const k = c.contacto || {};
  WA = "https://wa.me/" + String(k.whatsapp || "").replace(/\D/g, "") + (k.mensaje_whatsapp ? "?text=" + encodeURIComponent(k.mensaje_whatsapp) : "");
  return { wa: WA, tel: "tel:+" + String(k.whatsapp || "").replace(/\D/g, ""), mapa: safeUrl(k.mapa) || "#", fb: safeUrl(k.facebook) || "#", fbw: safeUrl(k.facebook_wfn) || "" };
}
const waTxt = t => "https://wa.me/" + String(((C || {}).contacto || {}).whatsapp || "").replace(/\D/g, "") + "?text=" + encodeURIComponent(t);

/* ---------- colores ---------- */
const TEMA_DEF = { principal: "#ff1f1f", acento: "#c6f11a", fondo: "#050505", main_event: "" };
function tema(t) {
  t = Object.assign({}, TEMA_DEF, t || {});
  const ok = v => /^#[0-9a-f]{6}$/i.test(v || "");
  const st = document.documentElement.style;
  if (ok(t.principal)) st.setProperty("--red", t.principal);
  if (ok(t.acento)) st.setProperty("--lime", t.acento);
  if (ok(t.fondo)) st.setProperty("--bg", t.fondo);
  st.setProperty("--mev", ok(t.main_event) ? t.main_event : "#f2b01e");
}

/* ===================== DIBUJAR ===================== */
function render(c) {
  if (!c || typeof c !== "object") return;
  c = fill(JSON.parse(JSON.stringify(c)), DEF);
  C = c; tema(c.tema);
  const L = links(c), n = c.negocio || {}, i = c.inicio || {}, k = c.contacto || {};
  const set = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };
  const cl = c.clases || {}, dis = cl.disciplinas || [];
  const fotoDe = (...us) => us.map(safeUrl).find(Boolean) || "";

  /* ----- Portada ----- */
  const fpc = fotoDe(i.foto_fondo, DEF.inicio.foto_fondo), fcel = fotoDe(i.foto_fondo_cel, i.foto_fondo, DEF.inicio.foto_fondo_cel);
  set(".hero", `<picture class="hero-ph"><source media="(max-width:767px)" srcset="${esc(fcel)}"><img src="${esc(fpc)}" alt="" fetchpriority="high"></picture>
    <div class="hero-t"><h1><span class="l"><span>${esc(i.titulo1)}</span></span><span class="l"><span class="o">${esc(i.titulo2)}</span></span><em class="sr"> · Academia de Kickboxing, K-1, Muay Thai y MMA en Poza Rica, Veracruz</em></h1></div>`);
  set("#inicio .ribbon .mq", (i.franja || []).map(w => `<span>${esc(w)}</span><i></i>`).join("").repeat(4));

  /* ----- Inicio: seminario, tarjetas, disciplinas, bloque, WFN, novedades ----- */
  const sm = i.seminario || {};
  const semi = sm.activo && (sm.titulo || safeUrl(sm.foto)) ? `<section class="sec"><div class="w"><article class="ov semi"${rv("rl")}>${ph(fotoDe(sm.foto, fpc))}
      <div class="ov-t"><span class="eb">${esc(sm.etiqueta)}</span>${sm.titulo ? `<h2 class="h2">${esc(sm.titulo)}</h2>` : ""}${sm.fecha ? `<p class="semi-f">${esc(sm.fecha)}</p>` : ""}${sm.texto ? `<p class="lead">${esc(sm.texto)}</p>` : ""}
      <div class="row"><a class="btn red" href="${esc(waTxt("Hola, quiero información del " + (sm.etiqueta || "seminario").toLowerCase() + (sm.titulo ? ": " + sm.titulo : "")))}" target="_blank" rel="noopener">${ICW}${esc(sm.boton || "Quiero inscribirme")}</a></div></div></article></div></section>` : "";

  const th = i.tarjeta_hoy || {}, tp = i.tarjeta_precio || {}, tc = i.tarjeta_competencias || {}, tu = i.tarjeta_ubicacion || {};
  const quick = `<section class="sec"><div class="w"><div class="quick">
    <a class="qc hot" href="#horarios"${rv("", 0)}><small data-today-l>${esc(th.etiqueta)}</small><b data-today-n>${esc(th.titulo)}</b><span data-today-h>${esc(th.texto)}</span><em>${esc(th.enlace)}</em></a>
    <a class="qc" href="#horarios"${rv("", .08)}><small>${esc(tp.etiqueta)}</small><b>${esc(tp.titulo)}</b><span>${esc(tp.texto)}</span><em>${esc(tp.enlace)}</em></a>
    <a class="qc" href="#wfn"${rv("", .16)}><small>${esc(tc.etiqueta)}</small><b>${esc(tc.titulo)}</b><span>${esc(tc.texto)}</span><em>${esc(tc.enlace)}</em></a>
    <a class="qc" href="${esc(L.mapa)}" target="_blank" rel="noopener"${rv("", .24)}><small>${esc(tu.etiqueta)}</small><b>${esc(tu.titulo)}</b><span>${esc(tu.texto)}</span><em>${esc(tu.enlace)}</em></a>
    </div></div></section>`;

  const tiles = dis.length ? `<section class="sec"><div class="w"><div class="sh"${rv()}><div><span class="eb">${esc(i.disciplinas_eyebrow)}</span><h2 class="h2">${esc(i.disciplinas_titulo)}</h2></div><a class="btn out" href="#clases">Ver clases</a></div>
    <div class="dtiles">${dis.map((d, x) => `<a class="dt" href="#clases"${rv("wipe", x * .1)}>${ph(d.foto)}<b>${esc(d.nombre)}</b></a>`).join("")}</div></div></section>` : "";

  const bq = i.bloque || {}, bqf = fotoDe(bq.foto, ...dis.map(d => d.foto), fpc);
  const datos = (bq.datos || []).filter(x => x && (x.cifra || x.texto));
  const bloque = `<section class="feat">${ph(bqf)}<div class="w"><span class="eb"${rv()}>${esc(bq.eyebrow)}</span><h2 class="h2"${rv("up", .05)}>${esc(bq.titulo)}</h2>
    ${bq.texto ? `<p class="lead"${rv("", .15)}>${esc(bq.texto)}</p>` : ""}
    ${datos.length ? `<div class="stats">${datos.map((x, j) => `<div${rv("", .2 + j * .08)}><b>${esc(x.cifra)}</b><span>${esc(x.texto)}</span></div>`).join("")}</div>` : ""}
    <div class="row"${rv("", .3)}><a class="btn red" href="#horarios">${esc(bq.boton || "Ver horarios")}</a><a class="btn out" href="#nosotros">Conócenos</a></div></div></section>`;

  const bw = i.banner_wfn || {}, cart = c.cartelera || {}, f = evFecha(cart);
  const prox = f && f.d > new Date() ? `${tituloEv(cart)} · ${evCorta(cart)}` : (bw.texto || "");
  const wfnbar = `<a class="wfnbar" href="#wfn" aria-label="Ir a WFN Combat League"${rv()}>${ph(fotoDe(bw.foto, ((c.competencias || {}).wfn || {}).foto, fpc))}
    <img src="img/wfn-logo.png" alt="" loading="lazy"><span class="t"><small>${esc(bw.etiqueta)}</small><b>${esc(bw.titulo)}</b>${prox ? `<em>${esc(prox)}</em>` : ""}</span><span class="go">${ARR}</span></a>`;

  const fbBox = (cls, nombre, logo, url, id, hide) => `<div class="nw ${cls}" id="${id}" role="tabpanel"${hide ? " hidden" : ""}><div class="nw-h"><img src="${logo}" alt=""><b>${esc(nombre)}</b>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">Abrir</a>` : ""}</div>
    ${esFb(url) ? `<div class="nw-b" data-fb="${esc(url)}"></div>` : `<div class="nw-e"><p>Agrega el enlace de la página de Facebook desde el panel para mostrar sus publicaciones aquí.</p>${url ? `<a class="btn out" href="${esc(url)}" target="_blank" rel="noopener">Ver en Facebook</a>` : ""}</div>`}</div>`;
  const dest = (i.destacados || []).filter(x => x && (x.titulo || safeUrl(x.foto)));
  const eq = c.equipo || {}, g0 = (cl.grupos || [])[0] || {};
  const auto = [
    { etiqueta: g0.etiqueta || "Clases", titulo: g0.nombre || "Clases para todas las edades", foto: fotoDe(dis[0] && dis[0].foto, fpc), enlace: "#clases" },
    { etiqueta: eq.uniforme_eyebrow || "Uniforme oficial", titulo: eq.uniforme_titulo || "Viste los colores del equipo", foto: fotoDe(((eq.uniforme || [])[0] || {}).foto, fpc), enlace: "#equipo" }
  ];
  const lista = (dest.length ? dest : auto).slice(0, 5);
  const dCard = (x, j) => { const href = String(x.enlace || "").trim(), ext = /^https?:/.test(href);
    return `<a class="dcard${j === 0 ? " big" : ""}" href="${esc(ext ? safeUrl(href) : (href || "#inicio"))}"${ext ? ' target="_blank" rel="noopener"' : ""}${rv("rl", j * .08)}>${ph(x.foto)}<span class="dc-t">${x.etiqueta ? `<small>${esc(x.etiqueta)}</small>` : ""}<b>${esc(x.titulo)}</b></span></a>`; };
  /* publicaciones destacadas (como UFC): enlaces de publicaciones sueltas de Facebook o Instagram */
  const posts = (i.publicaciones || []).map(x => typeof x === "string" ? { enlace: x } : x).filter(x => x && embedDe(x.enlace));
  const postCol = posts.length ? `<aside class="fbcol posts"${rv("", .1)}><p class="posts-t">Publicaciones destacadas</p><div class="posts-l">${posts.map(x => embedDe(x.enlace)).join("")}</div></aside>` : "";
  const fbCol = postCol || `<aside class="fbcol"${rv("", .1)}><div class="news-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-nt="nw-k1">Team K-1</button><button type="button" role="tab" aria-selected="false" data-nt="nw-wfn">WFN</button></div>
    ${fbBox("k1", n.nombre || "Team K-1", "img/logo-tri.png", L.fb !== "#" ? L.fb : "", "nw-k1")}${fbBox("wfn", "WFN Combat League", "img/wfn-logo.png", L.fbw, "nw-wfn", true)}</aside>`;
  const news = `<section class="sec" id="novedades"><div class="w news2"><div class="dgrid">${lista.map(dCard).join("")}</div>${fbCol}</div></section>`;

  const ct = i.cta || {};
  const cta = `<section class="feat cta">${ph(fotoDe(ct.foto, dis[3] && dis[3].foto, fpc))}<div class="w"><h2 class="h2"${rv("up")}>${esc(ct.titulo)}</h2>${ct.texto ? `<p class="lead"${rv("", .1)}>${esc(ct.texto)}</p>` : ""}
    <div class="row"${rv("", .2)}><a class="btn red" href="${esc(L.wa)}" target="_blank" rel="noopener">${ICW}${esc(i.boton1 || "Comunícate con nosotros")}</a><a class="btn out" href="${esc(L.mapa)}" target="_blank" rel="noopener">Cómo llegar</a></div></div></section>`;

  set("#inicio .home", semi + quick + tiles + bloque + wfnbar + news + cta);

  /* ----- Clases: disciplinas arriba, grupos aparte ----- */
  const grupos = cl.grupos || [];
  const partir = s => { const p = String(s || "").split(/\s+·\s+/); return p.length > 1 ? [p[0], p.slice(1).join(" · ")] : ["", p[0]]; };
  set("#clases .w", `<div class="sh"${rv()}><div><span class="eb">${esc(cl.eyebrow)}</span><h2 class="h2">${esc(cl.titulo)}</h2></div><p class="lead">${esc(cl.texto)}</p></div>
    <div class="posters">${dis.map((d, x) => `<article class="ov poster"${rv("rl", x * .08)}>${ph(d.foto)}<div class="ov-t"><h3>${esc(d.nombre)}</h3><p>${esc(d.texto)}</p></div></article>`).join("")}</div>
    ${grupos.length ? `<div class="groups"><div class="sh"${rv()}><div><span class="eb">Grupos</span><h2 class="h2">Elige tu grupo</h2></div><p class="lead">Los grupos se arman por edad y nivel, no por disciplina.</p></div>
    <div class="gtab"><div class="ghead"><span>Grupo</span><span>Días</span><span>Horario</span></div>
    ${grupos.map((g, x) => { const [d, t] = partir(g.horario); return `<div class="gr"${rv("", x * .06)}><div class="n"><i>${esc(g.etiqueta)}</i><b>${esc(g.nombre)}</b></div><div class="d">${d ? `<span class="lbl">Días:</span>${esc(d)}` : ""}</div><div class="t">${esc(t)}</div></div>`; }).join("")}</div>
    <p class="gnote">Consulta la tabla completa en <a href="#horarios">Horarios</a>.</p></div>` : ""}`);

  /* ----- Horarios ----- */
  const h = c.horarios || {}, cs = h.clases || [];
  const usados = new Set(cs.flatMap(x => x.dias || []));
  const cols = DIAS.filter(([d]) => d >= 1 && d <= 5 || usados.has(d));
  const MG = juntas(cs);                                   // clases que se juntan (ej. sparring del viernes)
  const filas = cs.filter(x => !MG.ocultas.has(x));
  const enMg = (x, d) => MG.lista.find(m => m.miembros.includes(x) && (m.clase.dias || []).includes(d));
  const DLARGO = { 0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado" };
  const nota = x => MG.lista.filter(m => m.miembros.includes(x) && m.clase.inicio !== x.inicio)
    .map(m => `<em class="jn">${esc((m.clase.dias || []).map(d => DLARGO[d]).join(" y "))}: ${esc(hora12(m.clase.inicio))} en ${esc(String(m.clase.nombre || "").toLowerCase())}</em>`).join("");
  let celdas = `<div class="h c" style="grid-row:1;grid-column:1">Clase</div>${cols.map(([, t], j) => `<div class="h" style="grid-row:1;grid-column:${j + 2}">${t}</div>`).join("")}`;
  filas.forEach((x, i) => {
    const r = i + 2;
    celdas += `<div class="c${x.destacado ? " spar" : ""}" style="grid-row:${r};grid-column:1"><b>${esc(x.nombre)}</b><small>${esc(x.detalle || rango(x))}</small>${nota(x)}</div>`;
    cols.forEach(([d], j) => {
      const m = enMg(x, d), pos = `grid-column:${j + 2}`;
      if (m) {
        const rs = m.miembros.map(y => filas.indexOf(y)).filter(k => k >= 0).sort((a, b) => a - b);
        const seguidas = rs.every((k, n) => n === 0 || k === rs[n - 1] + 1);
        if (seguidas && rs[0] !== i) return;               // ya se dibujo en la primera fila del grupo
        const span = seguidas ? rs.length : 1;
        celdas += `<div class="mrg" style="grid-row:${r} / span ${span};${pos}"><small>${span > 1 ? (span === 2 ? "Las dos clases" : "Clases juntas") : "Se junta"}</small><b>${esc(m.clase.nombre)}</b><span>${esc(rango(m.clase))}</span></div>`;
      } else celdas += (x.dias || []).includes(d) ? `<div class="y" style="grid-row:${r};${pos}"><i></i></div>` : `<div class="n" style="grid-row:${r};${pos}"><i></i></div>`;
    });
  });
  const grid = `<div class="sgrid" role="table" aria-label="Horario semanal" style="grid-template-columns:minmax(118px,1.6fr) repeat(${cols.length},1fr)"${rv()}>${celdas}</div>
    ${MG.lista.length ? `<div class="sleg"${rv()}><span><i class="d"></i>Hay clase</span><span><i class="b"></i>Clases que se juntan</span></div>` : ""}`;
  const p = h.precio || {};
  set("#horarios .w", `<div class="sh"${rv()}><div><span class="eb">${esc(h.eyebrow)}</span><h2 class="h2">${esc(h.titulo)}</h2></div><p class="lead">${esc(h.texto)}</p></div>
    ${grid}<p class="snote">${h.nota_titulo ? `<b>${esc(h.nota_titulo)}</b> ` : ""}${esc(h.nota)}</p>
    <div class="admit"${rv("up")}><div class="left"><small>${esc(p.etiqueta)}</small><div class="big">${esc(p.monto)}</div></div>
    <div><ul>${(p.beneficios || []).map(b => `<li>${esc(b)}</li>`).join("")}</ul><p class="insc"><b>${esc(p.inscripcion_titulo)}</b> ${esc(p.inscripcion)}</p></div>
    <a class="btn lime" href="${esc(L.wa)}" target="_blank" rel="noopener">${ICW}${esc(p.boton)}</a></div>`);

  /* ----- Equipo ----- */
  const e = c.equipo || {}, co = e.coaches || [];
  const corner = (x, j) => `<div class="corner"${rv("", j * .1)}>${ph(x.foto)}<small>${esc(x.rol)}</small><h3>${esc(x.nombre)}</h3></div>`;
  const tape = co.length === 2 ? `<div class="tape">${corner(co[0], 0)}<span class="amp">&amp;</span>${corner(co[1], 1)}</div>`
    : `<div class="tape tape-n" style="--n:${Math.min(Math.max(co.length, 1), 3)}">${co.map(corner).join("")}</div>`;
  const b = e.banda || {};
  set("#equipo .w", `<div class="sh"${rv()}><div><span class="eb">${esc(e.eyebrow)}</span><h2 class="h2">${esc(e.titulo)}</h2></div><p class="lead">${esc(e.texto)}</p></div>
    ${tape}${(e.comparativa || []).length ? `<div class="rowsT"${rv()}>${e.comparativa.map(r => `<div><b>${esc(r.izq)}</b><span>${esc(r.etiqueta)}</span><b>${esc(r.der)}</b></div>`).join("")}</div>` : ""}
    <div class="sh" style="margin-top:clamp(56px,6vw,90px)"${rv()}><div><span class="eb">${esc(e.uniforme_eyebrow)}</span><h2 class="h2">${esc(e.uniforme_titulo)}</h2></div></div>
    <div class="unibox">${(e.uniforme || []).map((u, j) => `<figure${rv("", j * .1)}>${safeUrl(u.foto) ? `<img src="${esc(safeUrl(u.foto))}" alt="${esc(u.nombre)}" loading="lazy">` : ph("")}<figcaption>${esc(u.nombre)}</figcaption></figure>`).join("")}</div>
    <div class="band"${rv("up")}><div><span class="eb">${esc(b.eyebrow)}</span><h2 class="h2">${esc(b.titulo)}</h2><p>${esc(b.texto)}</p></div><button class="btn blk" type="button" data-comp>${esc(b.boton)}</button></div>`);

  /* ----- Nosotros ----- */
  const o = c.nosotros || {}, vid = safeUrl(o.video);
  set("#nosotros", `<div class="nos-hero${vid ? "" : " nov"}">${vid ? `<video muted loop playsinline preload="none" data-src="${esc(vid)}"${safeUrl(o.video_poster) ? ` poster="${esc(safeUrl(o.video_poster))}"` : ""} aria-hidden="true"></video>` : ""}
    <p class="cap">${esc(o.frase)}</p><div class="rot2" id="rot2">${(o.palabras || []).map(w => `<span>${esc(w)}</span>`).join("")}<span class="oss">${esc(o.final)}</span></div></div>
    <div class="w">
    <div class="nos-block"><h2 class="h2"${rv()}>Misión</h2><p class="reveal">${esc(o.mision)}</p>
      <div class="row" style="margin-top:28px"><a class="btn red" href="#horarios">Ver horarios</a><a class="btn out" href="#clases">Clases</a></div></div>
    <article class="ov wide"${rv("rl")}>${ph(fotoDe(o.foto_vision, dis[2] && dis[2].foto, fpc))}<div class="ov-t"><h2 class="h2">Visión</h2><p class="lead">${esc(o.vision)}</p></div></article>
    <div class="nos-block"><span class="eb"${rv()}>${esc(o.valores_eyebrow)}</span><h2 class="h2"${rv()}>${esc(o.valores_titulo)}</h2>
      <div class="vals">${(o.valores || []).map((v, j) => `<div class="val"${rv("", (j % 4) * .08)}><h4>${esc(v.nombre)}</h4><p>${esc(v.texto)}</p></div>`).join("")}</div></div>
    <div class="band"${rv("up")}><h2 class="h2">${esc(o.cta_titulo)}</h2><a class="btn blk" href="${esc(L.wa)}" target="_blank" rel="noopener">${ICW}${esc(o.cta_boton)}</a></div>
    </div>`);

  /* ----- Contacto ----- */
  set("#contacto .w", `<div class="sh"${rv()}><div><span class="eb">${esc(k.eyebrow)}</span><h2 class="h2">${esc(k.titulo)}</h2></div></div>
    <article class="ov wide contact"${rv("rl")}>${ph(fotoDe(k.foto, fpc))}<div class="ov-t cbox"><div class="tel"><a href="${esc(L.tel)}">${esc(k.telefono)}</a></div><address>${esc(k.direccion1)}<br>${esc(k.direccion2)}</address>
    <div class="row"><a class="btn red" href="${esc(L.wa)}" target="_blank" rel="noopener">${ICW}WhatsApp</a><a class="btn out" href="${esc(L.mapa)}" target="_blank" rel="noopener">Cómo llegar</a><a class="btn out" href="${esc(L.fb)}" target="_blank" rel="noopener">Facebook</a></div>
    ${k.resena_texto ? `<div class="rate"><b>${esc(k.resena_cifra)}</b>${esc(k.resena_texto)}</div>` : ""}</div></article>`);

  /* ----- WFN ----- */
  renderWfn();

  /* ----- Competencias (cajón) y WKU ----- */
  const cp = c.competencias || {}, wku = cp.wku || {}, wfn = cp.wfn || {};
  set("#comp .clist", `<button type="button" class="ci" data-open="m-wku"><span><small>${esc(wku.eyebrow)}</small><b>${esc(wku.titulo)}</b></span>${CHEV}</button>
    <a class="ci goldc" href="#wfn"><span><small>${esc(wfn.eyebrow)}</small><b>${esc(wfn.titulo)}</b></span>${CHEV}</a>`);
  set("#m-wku .mh > div", `<span class="eb">${esc(wku.eyebrow)}</span><h2 class="h3" id="t-wku">${esc(wku.titulo)}</h2>`);
  set("#m-wku .mbody", `${ph(wku.foto, "r169")}<p class="lead">${esc(wku.texto)}</p><div class="mini">${(wku.galeria || []).filter(safeUrl).map(u => ph(u)).join("")}</div>`);

  /* ----- Menú y pie ----- */
  $$(".fm-wa,.hd-cta").forEach(a => a.href = L.wa); $$(".fm-map").forEach(a => a.href = L.mapa);
  const pie = c.pie || {};
  set(".ft-in", `<div class="ft-top"><div class="ft-logo"><img src="img/logo-tri.png" alt="" loading="lazy"><b>${esc(String(n.nombre || "").toUpperCase())}</b><span>${esc(String(n.subtitulo || "").toUpperCase())}</span></div>
    <nav aria-label="Pie de página"><a href="#clases">Clases</a><a href="#horarios">Horarios</a><a href="#equipo">Equipo</a><a href="#wfn">WFN</a><a href="#contacto">Contacto</a><a href="${esc(L.fb)}" target="_blank" rel="noopener">Facebook</a><a href="${esc(L.wa)}" target="_blank" rel="noopener">WhatsApp</a></nav></div>
    <div class="ft-bot"><span>${esc(k.direccion1)}, ${esc(k.direccion2)} · <a href="${esc(L.tel)}" style="font:inherit;text-transform:none;letter-spacing:0">${esc(k.telefono)}</a></span><span>${esc(String(n.nombre || "").toUpperCase())} ©${esc(pie.anio)} · Página hecha por <b>Loseel Webs</b></span></div>`);

  hoy(); initReveal(); observe(); fbLoad();
  if (!$("#nosotros").hidden) { rotRun(); videoOn(); }
}

/* ===================== WFN ===================== */
const DEF_WORDS = ["WARRIOR", "FIGHT", "NIGHT", "WFN", "POZA RICA", "COATZINTLA", "AMAMM"];
const rowsDe = w => { w = (w || []).filter(Boolean); if (!w.length) w = DEF_WORDS; return Array.from({ length: 8 }, (_, k) => `<div class="mev-row">${Array.from({ length: 24 }, (_, i) => `<span>${esc(String(w[(i + k) % w.length]).toUpperCase())}</span>`).join("")}</div>`).join(""); };
const fname = p => [p.nombre, p.apellido].filter(Boolean).join(" ") || "Por anunciar";
const meta = p => [p.origen, p.record].filter(Boolean).map(esc).join(" · ");
const esCo = b => !!b.comain || /co[\s-]?(main|estelar)/i.test(b.tipo || "");
function tituloEv(c) { const ed = String(c.edicion || "").trim(); return ed ? (/^wfn/i.test(ed) ? ed : "WFN " + ed) : (c.evento || "WFN"); }

function renderWfn() {
  const box = $("#wfn"); if (!box || !C) return;
  const L2 = links(C), T = Object.assign({}, C.tema || {});
  const c = C.cartelera || {}, wfn = (C.competencias || {}).wfn || {}, liga = C.liga || {};
  const m = c.main || {}, r = m.rojo || {}, a = m.azul || {};
  const okc = v => /^#[0-9a-f]{6}$/i.test(v || "");
  const vars = [okc(T.wfn_letras) ? "--wl:" + T.wfn_letras : "", okc(T.wfn_sombra) ? "--wsh:" + T.wfn_sombra : "", okc(T.wfn_fondo) ? "--wbg:" + T.wfn_fondo : ""].filter(Boolean).join(";");
  box.setAttribute("style", vars);
  const f = evFecha(c), titulo = tituloEv(c);
  const num = (String(c.edicion || "").match(/(\d+)\s*$/) || [])[1] || "";   // número de la edición, ej. 18

  /* barra del evento */
  const bar = `<div class="tvbar"><div class="tvbar-in"><img src="img/wfn-logo.png" alt="WFN Combat League"><div class="t"><b>${esc(titulo)}${c.lugar ? " · " + esc(String(c.lugar).split(",")[0]) : ""}</b>
    <span>${esc([f ? evCorta(c) : (c.fecha || "Fecha por anunciar"), c.lugar].filter(Boolean).join(" · "))}</span></div>
    ${safeUrl(c.enlace_boletos) ? `<a class="btn red" href="${esc(safeUrl(c.enlace_boletos))}" target="_blank" rel="noopener">Boletos</a>` : `<a class="btn red" href="${esc(waTxt("Hola, quiero boletos para " + titulo))}" target="_blank" rel="noopener">${ICW}Boletos</a>`}</div></div>`;

  /* main event con letras en el recuadro */
  const words = (c.fondo || []).filter(Boolean).length ? c.fondo.filter(Boolean) : DEF_WORDS;
  /* cada fila = dos mitades idénticas, así la animación (-50%) da la vuelta sin huecos ni saltos */
  const chars = words.reduce((t, w) => t + String(w).length + 1, 0) / words.length;
  const half = Math.max(12, Math.ceil(Math.ceil(90 / chars) / 4) * 4);
  const rows = Array.from({ length: 12 }, (_, k) => { const h = Array.from({ length: half }, (_, i) => `<span>${esc(String(words[(i + k) % words.length]))}</span>`).join(""); return `<div class="row">${h}${h}</div>`; }).join("");
  const fig = (p, side) => { const u = safeUrl(p.foto); if (!u) return `<div class="tvf ${side}"></div>`; const j = p.ajuste || {}, nn = (v, d) => isFinite(+v) && v !== "" && v != null ? +v : d;
    return `<div class="tvf ${side}"><img src="${esc(u)}" alt="${esc(fname(p))}" style="--ax:${nn(j.x, 0)}%;--ay:${nn(j.y, 0)}%;--as:${nn(j.s, 100) / 100}"></div>`; };
  const cd = f && f.d > new Date() ? `<div class="tvcd" data-cd="${f.d.getTime()}"><em>Faltan</em><div><b>00</b><small>Días</small></div><div><b>00</b><small>Hrs</small></div><div><b>00</b><small>Min</small></div><div><b>00</b><small>Seg</small></div></div>` : "";
  let hero = `<section class="tvh" id="w-evento" aria-label="Main event"><div class="lz" aria-hidden="true"><div class="rows">${rows}</div></div>${fig(r, "l")}${fig(a, "r")}
    <div class="tvc">${num ? `<span class="wlog" role="img" aria-label="Main event · ${esc(titulo)}"><img src="img/wfn-logo-contorno.png" alt=""><i></i><b>${esc(num)}</b></span>` : `<span class="tag">Main event · ${esc(titulo)}</span>`}<span class="nm">${esc(r.apellido || r.nombre || "Por anunciar")}</span><span class="vs"><i></i><b>vs</b><i></i></span><span class="nm">${esc(a.apellido || a.nombre || "Por anunciar")}</span>
    <p class="dv">${esc([m.div, m.rounds].filter(Boolean).join(" · "))}</p></div>${cd}</section>`;

  /* main event estilo cartel: se usa cuando el panel tiene la imagen de la pelea estelar */
  const ct = c.cartel || {}, cEst = safeUrl(ct.estelar);
  if (cEst) {
    const shm = (src, img) => `<span class="shm" style="--m:url('${src}')">${img}</span>`;
    const lp = String(c.lugar || "").split(","), sedeA = lp[0].trim() || "Por anunciar", sedeB = lp.slice(1).join(",").trim();
    const fl = f ? `${f.d.getDate()} de ${MESES[f.d.getMonth()].toLowerCase()} <br>de ${f.d.getFullYear()}` : esc(c.fecha || "Fecha por anunciar");
    const hr = f && f.conHora ? esc(hora12(c.hora)) : "";
    const head = `<div class="cx-head" role="img" aria-label="WFN Combat League ${esc(num)}">${shm("img/wfn-logo-contorno.png", '<img src="img/wfn-logo-contorno.png" alt="">')}${num ? `<i></i><b>${esc(num)}</b>` : ""}</div>`;
    hero = `<section class="cx" id="w-evento" aria-label="Pelea estelar · ${esc(titulo)}"><div class="cx-bg" aria-hidden="true"></div><div class="cx-vig" aria-hidden="true"></div>
    <div class="cx-in">
      <div class="cx-top"><div class="cx-row"><i></i>${head}<i></i></div></div>
      <div class="cx-row cx-labrow">${shm("img/wfn-pelea-estelar.png", '<img class="cx-lab" src="img/wfn-pelea-estelar.png" alt="Pelea estelar">')}</div>
      <img class="cx-main" src="${esc(cEst)}" alt="Pelea estelar: ${esc(fname(r))} vs ${esc(fname(a))}">
      <div class="cx-co cx-side"><small>Sede</small><span class="cx-v">${esc(sedeA)}</span>${sedeB ? `<span class="cx-s">${esc(sedeB)}</span>` : ""}<div class="cx-sep"></div><small>Boletos</small><span class="cx-v">${esc(c.boletos || "Próximamente")}</span></div>
      <div class="cx-info"><small class="cx-k">Fecha</small><div class="cx-dt"><b>${fl}</b>${hr ? `<i></i><b>${hr}</b>` : ""}</div><span class="cx-mv">${esc(c.lugar || "")}</span></div>
    </div>${cd}</section>`;
  }

  /* datos importantes */
  const mapa = safeUrl(c.mapa_evento) || (c.lugar ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.lugar) : "");
  const all = c.peleas || [], comain = all.find(esCo), resto = all.filter(x => x !== comain);
  const est = resto.filter(x => x.seccion !== "preliminar"), pre = resto.filter(x => x.seccion === "preliminar");
  const info = `<div class="einfo"${rv()}>
    <div><small>Fecha</small><b>${esc(f ? `${DIAS_EV[f.d.getDay()]} ${f.d.getDate()} de ${MESES[f.d.getMonth()].toLowerCase()}` : (c.fecha || "Por anunciar"))}</b>${f ? `<span>${f.d.getFullYear()}</span>` : ""}</div>
    <div><small>Hora</small><b>${esc(f && f.conHora ? hora12(c.hora) : "Por anunciar")}</b>${c.info_extra ? `<span>${esc(c.info_extra)}</span>` : ""}</div>
    <div><small>Sede</small><b>${esc(c.lugar || "Por anunciar")}</b></div>
    <div><small>Boletos</small><b>${esc(c.boletos || "Próximamente")}</b>${c.boletos_texto ? `<span>${esc(c.boletos_texto)}</span>` : ""}</div></div>
    <div class="eacts"${rv()}>${mapa ? `<a class="btn out" href="${esc(mapa)}" target="_blank" rel="noopener">Cómo llegar a la sede</a>` : ""}<span class="fnote" style="margin:0">${all.length + 1} peleas en la cartelera</span></div>`;

  /* cartelera: co-estelar destacado y demás peleas */
  const av = (p, cl) => `<span class="av${cl}"${safeUrl(p.foto) ? ` style="background-image:url('${esc(abs(safeUrl(p.foto)))}')"` : ""} role="img" aria-label="${esc(fname(p))}"></span>`;
  let coH = comain ? (() => { const cr = comain.rojo || {}, ca = comain.azul || {}, dv = esc([comain.div, comain.rounds].filter(Boolean).join(" · "));
    const cf = (p, side) => { const u = safeUrl(p.foto); return u ? `<div class="cm-f ${side}"><img src="${esc(u)}" alt="${esc(fname(p))}" loading="lazy"></div>` : ""; };
    const cn = (p, side) => { const a = p.nombre && p.apellido, top = a ? p.nombre : "", big = a ? p.apellido : (p.apellido || p.nombre || "Por anunciar"), mt = meta(p);
      return `<div class="cm-n ${side}">${top ? `<small>${esc(top)}</small>` : ""}<b>${esc(big)}</b>${mt ? `<span>${mt}</span>` : ""}</div>`; };
    return `<div class="cm"${rv("rl")}><div class="cm-tag">${esc(comain.tipo || "Co-main event")}</div>${cf(cr, "l")}${cf(ca, "r")}${cn(cr, "l")}
    <div class="cm-vs"><b>vs</b>${dv ? `<span>${dv}</span>` : ""}</div>${cn(ca, "r")}${dv ? `<div class="cm-dv">${dv}</div>` : ""}</div>`; })() : "";
  /* main event cara a cara: cada peleador con su fondo extendido y franja central */
  const eI = safeUrl(ct.est_izq), eD = safeUrl(ct.est_der);
  const franja = (cls, txt) => `<div class="fz-s${cls}"><img src="img/wfn-logo-contorno.png" alt="WFN Combat League">${num ? `<b>${esc(num)}</b>` : ""}<i></i><span>${txt}</span></div>`;
  if (eI && eD) {
    const lp = String(c.lugar || "").split(","), sedeA = lp[0].trim() || "Por anunciar", sedeB = lp.slice(1).join(",").trim();
    const fl = f ? `${f.d.getDate()} de ${MESES[f.d.getMonth()].toLowerCase()}` : "", fy = f ? `de ${f.d.getFullYear()}` : "";
    const hr = f && f.conHora ? esc(hora12(c.hora)) : "";
    const fecha = f ? `${fl} <br>${fy}` : esc(c.fecha || "Por anunciar");
    hero = `<section class="fz" id="w-evento" aria-label="Pelea estelar · ${esc(titulo)}">
    <div class="fz-v"><div class="fz-h l" role="img" aria-label="${esc(fname(r))}" style="background-image:url('${esc(eI)}')"></div>${franja("", "Pelea estelar")}<div class="fz-h r" role="img" aria-label="${esc(fname(a))}" style="background-image:url('${esc(eD)}')"></div>
      <div class="fz-i l"><small>Fecha</small><b>${fecha}</b>${hr ? `<i></i><small>Hora</small><b>${hr}</b>` : ""}</div>
      <div class="fz-i r"><small>Sede</small><b>${esc(sedeA)}</b>${sedeB ? `<span>${esc(sedeB)}</span>` : ""}<i></i><small>Boletos</small><b>${esc(c.boletos || "Próximamente")}</b></div></div>
    <div class="fz-m"><div><small>Fecha</small><b>${f ? `${fl} ${fy}` : esc(c.fecha || "Por anunciar")}</b></div><div>${hr ? `<small>Hora</small><b>${hr}</b>` : ""}<span>${esc(c.lugar || "")}</span></div></div>${cd}</section>`;
  }
  /* coestelar estilo cartel: con las dos tarjetas del panel */
  const coR = safeUrl(ct.co_rojo), coA = safeUrl(ct.co_azul);
  if (comain && coR && coA) { const cr = comain.rojo || {}, ca = comain.azul || {}, dv = esc([comain.div, comain.rounds].filter(Boolean).join(" · "));
    coH = `<div class="cm2"${rv()}><div class="cx-bg" aria-hidden="true"></div><div class="cx-row"><span class="shm" style="--m:url('img/wfn-pelea-coestelar.png')"><img src="img/wfn-pelea-coestelar.png" alt="Pelea coestelar"></span></div>
      <div class="cx-frame"><div><img class="cx-card" src="${esc(coR)}" alt="${esc(fname(cr))}" loading="lazy"><img class="cx-card" src="${esc(coA)}" alt="${esc(fname(ca))}" loading="lazy"></div></div>${dv ? `<span class="cm2-dv">${dv}</span>` : ""}</div>`; }
  const cI = safeUrl(ct.co_izq), cD = safeUrl(ct.co_der);
  if (comain && cI && cD) { const cr = comain.rojo || {}, ca = comain.azul || {}, dv = esc([comain.div, comain.rounds].filter(Boolean).join(" · "));
    coH = `<div class="fzc"${rv()}><div class="fzc-v"><div class="fz-h l" role="img" aria-label="${esc(fname(cr))}" style="background-image:url('${esc(cI)}')"></div>${franja(" co", "Coestelar")}<div class="fz-h r" role="img" aria-label="${esc(fname(ca))}" style="background-image:url('${esc(cD)}')"></div></div>${dv ? `<p class="fzc-d">${dv}</p>` : ""}</div>`; }
  const row = (x, j) => { const rr = x.rojo || {}, aa = x.azul || {}; return `<div class="bout"${rv("rl", Math.min(j, 6) * .05)}>${av(rr, "")}<div class="nm l"><b>${esc(fname(rr))}</b><span>${meta(rr) || "&nbsp;"}</span></div>
    <div class="mid"><small>${esc(x.tipo || x.div)}</small><b>vs</b><span>${x.tipo ? esc(x.div) + " · " : ""}${esc(x.rounds)}</span></div><div class="nm r"><b>${esc(fname(aa))}</b><span>${meta(aa) || "&nbsp;"}</span></div>${av(aa, " b")}</div>`; };
  const card = (comain || est.length || pre.length) ? `<section class="wsec" id="w-card">
    <div class="ctabs" role="tablist"><button type="button" role="tab" data-ct="est" aria-selected="true">Cartelera estelar<em>${est.length + (comain ? 1 : 0)}</em></button>${pre.length ? `<button type="button" role="tab" data-ct="pre" aria-selected="false">Preliminares<em>${pre.length}</em></button>` : ""}</div>
    <div data-cp="est">${coH}${est.map(row).join("")}</div>${pre.length ? `<div data-cp="pre" hidden>${pre.map(row).join("")}</div>` : ""}
    <p class="fnote">Récord: victorias – derrotas – empates. Combates sujetos a cambios.</p></section>` : "";

  /* patrocinadores */
  const sp = (liga.patrocinadores || []).filter(x => safeUrl(x.logo));
  const spItem = (x, dup) => { const d = dup ? ' class="dup" aria-hidden="true" tabindex="-1"' : "", img = `<img src="${esc(safeUrl(x.logo))}" alt="${dup ? "" : esc(x.nombre || "Patrocinador")}" decoding="async">`; return safeUrl(x.enlace) ? `<a href="${esc(safeUrl(x.enlace))}" target="_blank" rel="noopener"${d}>${img}</a>` : `<span${d}>${img}</span>`; };
  const reps = sp.length ? Math.max(2, Math.ceil(10 / sp.length) * 2) : 0;
  const spons = sp.length ? `<section class="spons" id="w-spons" aria-label="${esc(liga.patrocinadores_titulo || "Patrocinadores")}"><span class="sp-l">${esc(liga.patrocinadores_titulo || "Patrocinadores")}</span>
    <div class="sp-v"><div class="sp-trk" style="--dur:${Math.max(20, sp.length * 6)}s">${Array.from({ length: reps }, (_, q) => sp.map(x => spItem(x, q > 0)).join("")).join("")}</div></div></section>` : "";

  /* historial de ediciones */
  const eds = (liga.ediciones || []).slice();
  const MET = { KO: "KO", TKO: "TKO", SUB: "SUB", UD: "UD", SD: "SD", MD: "MD" };
  const metCorto = m => { const t = String(m || "").trim(), u = t.toUpperCase();
    if (MET[u]) return u; if (/sumis/i.test(t)) return "SUB"; if (/ko t|t\.?k\.?o|t[eé]cnico/i.test(t)) return "TKO"; if (/^k\.?o/i.test(t)) return "KO";
    if (/un[aá]nime/i.test(t)) return "UD"; if (/dividida/i.test(t)) return "SD"; if (/mayor/i.test(t)) return "MD"; if (/decisi/i.test(t)) return "DEC"; return t; };
  const lado = (x, k) => { const v = x[k] || ""; return typeof v === "string" ? { n: v, rec: x[k + "_record"] || "", foto: x[k + "_foto"] || "" } : { n: fname(v), rec: v.record || "", foto: v.foto || "" }; };
  const fighter = (p, win, r) => `<div class="rf${r ? " r" : ""}${win ? " win" : ""}">${r ? "" : `<span class="rav"${safeUrl(p.foto) ? ` style="background-image:url('${esc(safeUrl(p.foto))}')"` : ""}></span>`}
    <span class="rn"><b>${esc(p.n || "Por anunciar")}${win ? '<i class="ck" aria-label="ganó"></i>' : ""}</b>${p.rec ? `<small>${esc(p.rec)}</small>` : ""}</span>${r ? `<span class="rav"${safeUrl(p.foto) ? ` style="background-image:url('${esc(safeUrl(p.foto))}')"` : ""}></span>` : ""}</div>`;
  const res = x => { const R = lado(x, "rojo"), A = lado(x, "azul"), g = x.ganador;
    const top = g === "empate" ? "Empate" : g === "nc" ? "NC" : (metCorto(x.metodo) || (g ? "" : "—"));
    const sub = [x.round ? "R" + x.round : "", x.tiempo].filter(Boolean).join(" · ");
    return `<div class="res"><div class="rm"><b>${esc(top)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}</div>${fighter(R, g === "rojo")}<div class="rd">${esc(x.div || "")}${x.titulo ? `<em>${esc(x.titulo)}</em>` : ""}</div>${fighter(A, g === "azul", true)}</div>`; };
  const grupo = (t, ps) => ps.length ? `<div class="rg"><p class="rg-t">${esc(t)}</p>${ps.map(res).join("")}</div>` : "";
  const hist = `<section class="wsec" id="w-hist"><div class="sh"${rv()}><div><span class="eb">Resultados</span><h2 class="h2">Ediciones anteriores</h2></div></div>
    ${eds.length ? `<div class="hist">${eds.map((x, j) => { const ps = x.peleas || []; const ed = String(x.edicion || "").replace(/^wfn\s*/i, "");
      const pri = ps.filter(p => p.seccion !== "preliminar"), pre = ps.filter(p => p.seccion === "preliminar");
      return `<details class="ed"${j === 0 ? " open" : ""}${rv("rl", Math.min(j, 4) * .06)}><summary><span class="ed-n">${esc(ed || "—")}</span><span class="ed-i"><b>${esc(x.titulo || "WFN " + ed)}</b><span>${[fechaTxt(x.fecha), x.lugar].filter(Boolean).map(esc).join(" · ")}</span></span><span class="ed-k">${ps.length ? ps.length + (ps.length === 1 ? " pelea" : " peleas") : ""}</span><span class="ed-c">${DOWN}</span></summary>
      <div class="ed-b">${safeUrl(x.foto) ? `<img src="${esc(safeUrl(x.foto))}" alt="Cartel de ${esc(x.titulo || "WFN " + ed)}" loading="lazy">` : ""}${ps.length ? grupo("Cartelera principal", pri) + grupo("Cartelera preliminar", pre) : '<p class="hist-e">Sin peleas registradas.</p>'}</div></details>`; }).join("")}</div>`
      : `<p class="hist-e">Aquí aparecerán los resultados de cada edición cuando se agreguen desde el panel.</p>`}</section>`;

  /* la liga: información fija debajo de los patrocinadores */
  const gal = (wfn.galeria || []).filter(safeUrl), ac = liga.acerca || {};
  const datos = (ac.datos || []).filter(x => x && (x.cifra || x.texto));
  const ligaH = `<section class="liga-p" id="w-liga"${rv("rl")}><h2 class="h2">${esc(ac.titulo || "La liga")}</h2><div>
    <p class="lead">${esc(ac.texto || wfn.texto)}</p>
    ${datos.length ? `<div class="ldat">${datos.map(x => `<div><b>${esc(x.cifra)}</b><span>${esc(x.texto)}</span></div>`).join("")}</div>` : ""}
    ${ac.sede || ac.telefono ? `<p class="fnote">${[ac.sede, ac.telefono].filter(Boolean).map(esc).join(" · ")}</p>` : ""}
    ${L2.fbw ? `<a class="btn out" href="${esc(L2.fbw)}" target="_blank" rel="noopener" style="margin-top:16px">Ver en Facebook</a>` : ""}
    ${gal.length ? `<div class="liga-g">${gal.map(u => ph(u)).join("")}</div>` : ""}</div></section>`;

  /* «Muy pronto»: se activa desde el panel o solo, un día después de la función */
  const pasada = f && (Date.now() - f.d.getTime()) > 24 * 3600 * 1000;
  if (c.proximamente || pasada) {
    const n = String(c.proxima_edicion || "").trim() || (/^\d+$/.test(String(c.edicion || "").trim()) ? String(+c.edicion + 1) : "");
    const t = n ? (/^wfn/i.test(n) ? n : "WFN " + n) : "WFN";
    const num = (n.match(/\d+/) || [""])[0];
    const soon = `<section class="soon" id="w-evento" aria-label="Próxima función">${num ? `<span class="soon-n" aria-hidden="true">${esc(num)}</span>` : ""}
      <div class="soon-in"><img src="img/wfn-logo.png" alt="WFN Combat League" class="soon-lg"><p class="soon-k">${esc(c.proximamente_etiqueta ? "Próxima función" : "Próxima función")} · ${esc(t)}</p>
      <h2 class="soon-t">${esc(c.proximamente_etiqueta || "Muy pronto")}</h2><i class="soon-l"></i>
      <p class="soon-p">${esc(c.proximamente_texto || "Fecha, sede y cartelera por anunciar. Síguenos para enterarte primero.")}</p>
      <div class="row soon-b">${L2.fbw ? `<a class="btn red" href="${esc(L2.fbw)}" target="_blank" rel="noopener">Síguenos en Facebook</a>` : ""}<a class="btn out" href="#w-hist">Ver resultados</a></div></div></section>`;
    box.innerHTML = `${soon}${spons}<div class="w">${ligaH}${hist}</div>`;
    tickCD(); return;
  }
  box.innerHTML = `${bar}${hero}<div class="w">${card}</div>${spons}<div class="w"><section class="einfo-s">${info}</section>${ligaH}${hist}</div>`;
  tickCD();
}

/* fechas */
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_EV = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_C = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
function evFecha(c) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((c || {}).dia || ""); if (!m) return null;
  const h = /^(\d{2}):(\d{2})$/.exec(c.hora || "");
  const d = new Date(+m[1], +m[2] - 1, +m[3], h ? +h[1] : 0, h ? +h[2] : 0);
  return isNaN(d) ? null : { d, conHora: !!h };
}
const fechaTxt = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? `${+m[3]} ${MESES[+m[2] - 1].slice(0, 3).toLowerCase()} ${m[1]}` : (s || ""); };
function evHead(c) {
  const f = evFecha(c);
  const cal = f ? `<div class="evx-cal"><span>${MESES[f.d.getMonth()]}</span><b>${f.d.getDate()}</b><small>${DIAS_EV[f.d.getDay()]}</small></div>` : "";
  const cuando = f ? hora12(c.hora) : (c.fecha || "Fecha por anunciar");
  const cd = f && f.d > new Date() ? `<div class="evx-cd" data-cd="${f.d.getTime()}"><div><b class="gold">00</b><small>Días</small></div><div><b class="gold">00</b><small>Horas</small></div><div><b class="gold">00</b><small>Min</small></div><div><b class="gold">00</b><small>Seg</small></div></div>` : "";
  return `<div class="evx"${rv()}>${cal}<div class="evx-i"><span class="eb">Próxima función</span><b class="evx-t gold">${esc(tituloEv(c))}</b>${cuando ? `<span>${esc(cuando)}</span>` : ""}${c.lugar ? `<span class="evx-l">${PIN}${esc(c.lugar)}</span>` : ""}</div></div>${cd}`;
}
function evCorta(c) { const f = evFecha(c); if (!f) return c.fecha || ""; return `${DIAS_C[f.d.getDay()]} ${f.d.getDate()} ${MESES[f.d.getMonth()].slice(0, 3)}${f.conHora ? " · " + hora12(c.hora) : ""}`; }
function tickCD() {
  $$("[data-cd]").forEach(el => {
    const s = Math.max(0, Math.floor((+el.dataset.cd - Date.now()) / 1000));
    const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60];
    el.querySelectorAll("b").forEach((b, i) => { const t = String(v[i]).padStart(2, "0"); if (b.textContent !== t) b.textContent = t; });
  });
}
setInterval(tickCD, 1000);

/* ---------- clases que se juntan (ej. viernes de sparring) ---------- */
const normN = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
function juntas(cs) {
  const lista = [], ocultas = new Set();
  cs.forEach(m => {
    const nombres = String(m.junta || "").split(",").map(normN).filter(Boolean);
    if (!nombres.length) return;
    const miembros = cs.filter(x => x !== m && nombres.includes(normN(x.nombre)));
    if (!miembros.length) return;
    lista.push({ clase: m, miembros }); ocultas.add(m);
  });
  return { lista, ocultas };
}

/* ---------- tarjeta "Hoy" ---------- */
function hoy() {
  const cs = ((C || {}).horarios || {}).clases || [], t0 = ((C || {}).inicio || {}).tarjeta_hoy || {};
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const t = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  const MG = juntas(cs), dia = now.getDay();
  const tapada = x => MG.lista.some(m => m.miembros.includes(x) && (m.clase.dias || []).includes(dia));
  const deHoy = cs.filter(x => (x.dias || []).includes(dia) && !tapada(x)).sort((a, b) => a.inicio < b.inicio ? -1 : 1);
  const cur = deHoy.find(x => t >= x.inicio && t < x.fin), sig = deHoy.find(x => x.inicio > t), q = cur || sig;
  $$("[data-today-l]").forEach(e => e.textContent = cur ? "En clase ahora" : sig ? "Siguiente clase hoy" : (t0.etiqueta || "Hoy"));
  $$("[data-today-n]").forEach(e => e.textContent = q ? q.nombre : (t0.titulo || ""));
  $$("[data-today-h]").forEach(e => e.textContent = q ? rango(q) : (t0.texto || ""));
}

/* ---------- publicaciones sueltas de Facebook o Instagram ---------- */
function embedDe(u) {
  u = String(u || "").trim();
  /* también acepta el código de «Insertar» de Facebook: se toma el enlace que trae adentro */
  const em = /plugins\/(?:post|video)\.php\?[^"' ]*?href=([^&"' ]+)/i.exec(u); if (em) { try { u = decodeURIComponent(em[1]); } catch (e) {} }
  const ig = /<blockquote[^>]+data-instgrm-permalink="([^"]+)"/i.exec(u); if (ig) u = ig[1];
  if (!/^https:\/\//i.test(u)) return "";
  let m;
  if ((m = /instagram\.com\/(?:[^/]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/i.exec(u)))
    return `<div class="post ig"><iframe src="https://www.instagram.com/${m[1] === "tv" ? "p" : m[1]}/${esc(m[2])}/embed/captioned/" title="Publicación de Instagram" loading="lazy" scrolling="no" allowtransparency="true"></iframe><a class="fb-alt" href="${esc(u)}" target="_blank" rel="noopener">Ver en Instagram</a></div>`;
  if (/(facebook|fb)\.(com|watch)\//i.test(u)) {
    const vid = /\/(videos|reel|watch)\b|fb\.watch/i.test(u);
    const src = `https://www.facebook.com/plugins/${vid ? "video" : "post"}.php?href=${encodeURIComponent(u)}&show_text=true&width=500&locale=es_LA`;
    return `<div class="post fb${vid ? " vid" : ""}"><iframe src="${esc(src)}" title="Publicación de Facebook" loading="lazy" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe><a class="fb-alt" href="${esc(u)}" target="_blank" rel="noopener">Ver en Facebook</a></div>`;
  }
  return "";
}

/* ---------- Facebook: publicaciones de la página ---------- */
const esFb = u => /^https:\/\/(www\.|m\.|web\.)?(facebook|fb)\.com\/(?!search|sharer|login|plugins)[^?#]+/i.test(String(u || ""));
/* Facebook solo acepta ciertas formas de enlace en el cuadro de publicaciones:
   facebook.com/people/Nombre/123… y m.facebook.com se convierten a facebook.com/123… */
function fbHref(u) {
  try {
    const x = new URL(String(u).trim()); let m;
    if ((m = /\/people\/[^/]+\/(\d+)/.exec(x.pathname))) return "https://www.facebook.com/" + m[1];
    if (/profile\.php$/.test(x.pathname) && x.searchParams.get("id")) return "https://www.facebook.com/" + x.searchParams.get("id");
    return "https://www.facebook.com" + x.pathname.replace(/\/+$/, "");
  } catch (e) { return u; }
}
let fbIO = null;
function fbLoad() {
  if (fbIO) fbIO.disconnect();
  const put = el => { if (el.querySelector("iframe")) return; const w = Math.max(280, Math.min(500, Math.floor(el.clientWidth - 28) || 340));
    const src = "https://www.facebook.com/plugins/page.php?href=" + encodeURIComponent(fbHref(el.dataset.fb)) + `&tabs=timeline&width=${w}&height=620&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&locale=es_LA`;
    el.innerHTML = `<iframe src="${esc(src)}" width="${w}" height="620" title="Publicaciones de Facebook" loading="lazy" allow="encrypted-media; clipboard-write; picture-in-picture; web-share"></iframe>
      <a class="fb-alt" href="${esc(el.dataset.fb)}" target="_blank" rel="noopener">¿No se ven las publicaciones? Ábrelas en Facebook</a>`; };
  const els = $$("[data-fb]");
  if (!("IntersectionObserver" in window)) return els.forEach(put);
  fbIO = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting && x.target.offsetParent) { put(x.target); fbIO.unobserve(x.target); } }), { rootMargin: "400px 0px" });
  els.forEach(el => fbIO.observe(el));
}
document.addEventListener("click", e => {
  const t = e.target.closest("[data-nt]"); if (!t) return;
  $$("[data-nt]").forEach(b => { const on = b === t; b.setAttribute("aria-selected", on); const p = document.getElementById(b.dataset.nt); if (p) p.hidden = !on; });
  fbLoad();
});

/* ---------- animaciones de entrada ---------- */
let io = null;
function observe() {
  const els = $$("[data-rv]:not(.in)");
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return els.forEach(e => e.classList.add("in"));
  if (!io) io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { rootMargin: "0px 0px -4% 0px", threshold: 0 });
  els.forEach(e => io.observe(e));
}
/* fondo de los bloques con un poco de movimiento al bajar */
let pxT = 0;
function parallax() { pxT = 0; if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; $$(".feat>.ph").forEach(el => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; el.style.setProperty("--py", ((r.top + r.height / 2 - innerHeight / 2) * -.08).toFixed(1) + "px"); }); }

/* ---------- cabecera y botón Menú según el scroll ---------- */
function onScroll() {
  const y = scrollY, hd = $(".hd"); hd && hd.classList.toggle("sc", y > 30);
  const mb = $(".mbtn"), ini = !$("#inicio").hidden; mb && mb.classList.toggle("esc", ini && y < Math.min(innerHeight * .5, 360));
  paintRv(); if (!pxT) pxT = requestAnimationFrame(parallax);
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);

/* ---------- navegación por pestañas ---------- */
const K = ["inicio", "clases", "horarios", "equipo", "nosotros", "contacto", "wfn"];
const TIT = { wfn: "WFN Combat League" };
function show(k, first, anchor) {
  if (!K.includes(k)) k = "inicio";
  K.forEach(id => { const s = document.getElementById(id); if (s) s.hidden = id !== k; });
  if (anchor) { const a = document.getElementById(anchor); a && setTimeout(() => a.scrollIntoView({ behavior: first ? "auto" : "smooth" }), 30); }
  else if (!first) scrollTo({ top: 0, behavior: "auto" });
  const base = ((C || {}).negocio || {}).titulo_pestana || "Academia Team K-1";
  document.title = (k === "inicio" ? "" : (TIT[k] || k[0].toUpperCase() + k.slice(1)) + " · ") + base;
  $$(".nav a[data-k],.fmenu a[data-k]").forEach(a => a.classList.toggle("on", a.dataset.k === k));
  $(".hd-wfn") && $(".hd-wfn").classList.toggle("on", k === "wfn");
  if (k === "nosotros") { rotRun(); videoOn(); } else videoOff();
  observe(); fbLoad(); onScroll(); setTimeout(paintRv, 60);
}
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const k = a.getAttribute("href").slice(1);
  if (K.includes(k)) { e.preventDefault(); if (location.hash !== "#" + k) history.pushState(null, "", "#" + k); show(k); }
  else if (/^w-/.test(k)) { e.preventDefault(); const t = document.getElementById(k); t && t.scrollIntoView({ behavior: "smooth" }); }
  else if (k === "") e.preventDefault();
});
addEventListener("popstate", () => show(location.hash.slice(1)));

/* pestañas de la cartelera */
document.addEventListener("click", e => {
  const t = e.target.closest("[data-ct]"); if (!t) return;
  $$("[data-ct]").forEach(b => b.setAttribute("aria-selected", b === t));
  $$("[data-cp]").forEach(p => p.hidden = p.dataset.cp !== t.dataset.ct);
  observe();
});

/* ---------- cajón de competencias y ventana WKU ---------- */
const dr = $("#comp");
document.addEventListener("click", e => {
  if (e.target.closest("[data-comp]")) dr && dr.classList.add("open");
  else if (e.target.closest("[data-close]") || (dr && dr.classList.contains("open") && e.target.closest("#comp a[href]"))) dr && dr.classList.remove("open");
});
let mFrom = null;
function mOpen(id) { const m = document.getElementById(id); if (!m) return; mFrom = document.activeElement; dr && dr.classList.remove("open"); m.hidden = false; document.documentElement.style.overflow = "hidden"; const x = m.querySelector(".x"); x && x.focus(); }
function mClose(m) { m.hidden = true; document.documentElement.style.overflow = ""; mFrom && mFrom.focus && mFrom.focus(); }
document.addEventListener("click", e => {
  const o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); mOpen(o.dataset.open); return; }
  const c = e.target.closest("[data-mclose]"); if (c) mClose(c.closest(".modal"));
});
addEventListener("keydown", e => { if (e.key === "Escape") { $$(".modal:not([hidden])").forEach(mClose); dr && dr.classList.remove("open"); } });

/* ---------- botón Menú (celular) ---------- */
(() => {
  const b = $(".mbtn"), m = $("#fmenu"); if (!b || !m) return; const t = b.querySelector("span");
  const set = o => { m.hidden = !o; b.setAttribute("aria-expanded", o); b.classList.toggle("on", o); t.textContent = o ? "Cerrar" : "Menú"; document.documentElement.classList.toggle("fm-open", o); };
  b.addEventListener("click", () => set(m.hidden));
  m.addEventListener("click", e => { if (e.target.closest("a,button")) set(false); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !m.hidden) set(false); });
})();

/* ---------- Nosotros: video, palabras y textos que se iluminan ---------- */
function videoOn() { const v = $("#nosotros video"); if (!v) return; if (!v.src && v.dataset.src) v.src = v.dataset.src; const p = v.play(); p && p.catch(() => {}); }
function videoOff() { const v = $("#nosotros video"); v && !v.paused && v.pause(); }
function initReveal() { $$(".reveal").forEach(r => { r.innerHTML = r.textContent.split(" ").map(w => `<span>${esc(w)}</span>`).join(" "); }); paintRv(); }
function paintRv() { $$(".reveal").forEach(r => { if (!r.offsetParent) return; const b = r.getBoundingClientRect(), vh = innerHeight, p = Math.min(1, Math.max(0, (vh * .9 - b.top) / (b.height + vh * .25))), ws = r.querySelectorAll("span"), n = Math.round(p * ws.length); ws.forEach((w, i) => w.classList.toggle("on", i < n)); }); }
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
    const r = await fetch(`${CFG.SUPABASE_URL}/rest/v1/sitios?id=eq.${encodeURIComponent(CFG.SITIO_ID)}&select=contenido`, { headers: { apikey: CFG.SUPABASE_ANON_KEY }, cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    const rows = await r.json();
    if (rows[0] && rows[0].contenido) { render(rows[0].contenido); try { localStorage.setItem(CACHE_KEY, JSON.stringify(rows[0].contenido)); } catch (e) {} }
  } catch (e) { console.warn("No se pudo leer Supabase; se muestra la última copia.", e); }
}
try { const el = document.getElementById("contenido-respaldo"); if (el) render(JSON.parse(el.textContent)); } catch (e) { console.error(e); }
show(location.hash.slice(1) || "inicio", true);
cargar();
})();
