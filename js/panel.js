/* =========================================================
   Team K-1 · Panel de administración
   - Inicia sesión con Supabase Auth (correo y contraseña).
   - Lee y guarda el contenido en la tabla "sitios".
   - Las fotos se suben a Supabase Storage (bucket "fotos").
   La seguridad real la dan las reglas RLS de supabase.sql:
   aunque alguien abra este panel, solo un administrador
   registrado en la tabla "admins" puede guardar.
   ========================================================= */
(() => {
const CFG = window.SITIO_CONFIG;
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone = o => JSON.parse(JSON.stringify(o));

if (!window.supabase || !CFG || /TU-PROYECTO/.test(CFG.SUPABASE_URL)) {
  $("#l-msg").textContent = "Falta configurar Supabase en js/config.js.";
  $("#l-msg").className = "msg err";
  return;
}
const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);

/* ---------------- ESQUEMA: qué se puede editar ----------------
   t: text | area | time | img | days | bool | select | list | group
   ---------------------------------------------------------------- */
const T = (k, l, extra = {}) => ({ t: "text", k, l, ...extra });
const A = (k, l, extra = {}) => ({ t: "area", k, l, ...extra });
const I = (k, l, extra = {}) => ({ t: "img", k, l, ...extra });
const G = (l, k, fields) => ({ t: "group", l, k, fields });
const Ls = (k, l, item, extra = {}) => ({ t: "list", k, l, item, ...extra });
const tarjeta = (k, l) => G(l, k, [T("etiqueta", "Etiqueta chica"), T("titulo", "Título"), T("texto", "Texto"), T("enlace", "Texto del enlace")]);
const peleador = (k, l, cls) => ({ t: "group", l, k, cls, fields: [
  { t: "row", fields: [T("nombre", "Nombre"), T("apellido", "Apellido")] },
  { t: "row", fields: [T("origen", "De dónde viene", { ph: "Ej. Tuxpan, Ver." }), T("record", "Récord", { ph: "Ej. 5-1-0" })] },
  I("foto", "Foto del peleador", { folder: "peleadores", cut: true, help: "Súbela SIN FONDO (PNG). El filtro dorado y el desvanecido de abajo se ponen solos." })] });

const SCHEMA = [
 { id: "negocio", tab: "Negocio y contacto", help: "Nombre, teléfono, WhatsApp, dirección y redes. Se usan en toda la página (botones, pie de página, menú).", cards: [
   { l: "Negocio", fields: [ { t: "row", fields: [T("negocio.nombre", "Nombre corto", { help: "Ej. Team K-1" }), T("negocio.subtitulo", "Subtítulo", { help: "Ej. Academy" })] },
     { t: "row", fields: [T("negocio.ciudad", "Ciudad"), T("negocio.titulo_pestana", "Título de la pestaña del navegador")] } ] },
   { l: "Contacto", fields: [ { t: "row", fields: [T("contacto.telefono", "Teléfono (como se muestra)", { ph: "782 828 0510" }), T("contacto.whatsapp", "WhatsApp con lada", { help: "Solo números, con 52 al inicio. Ej. 527828280510" })] },
     A("contacto.mensaje_whatsapp", "Mensaje que se escribe solo al abrir WhatsApp"),
     { t: "row", fields: [T("contacto.direccion1", "Dirección (línea 1)"), T("contacto.direccion2", "Dirección (línea 2)")] },
     T("contacto.mapa", "Enlace de Google Maps", { help: "En Google Maps: Compartir → Copiar vínculo." }),
     T("contacto.facebook", "Enlace de Facebook") ] },
   { l: "Sección Contacto", fields: [ { t: "row", fields: [T("contacto.eyebrow", "Etiqueta chica"), T("contacto.titulo", "Título")] },
     { t: "row", fields: [T("contacto.resena_cifra", "Cifra destacada", { ph: "100%" }), T("contacto.resena_texto", "Texto de la reseña")] },
     I("contacto.foto", "Foto de la sección", { folder: "general" }) ] } ] },
 { id: "inicio", tab: "Inicio", help: "La portada y las tarjetas de la pantalla principal.", cards: [
   { l: "Portada", fields: [ T("inicio.lugar", "Texto arriba del título"), { t: "row", fields: [T("inicio.titulo1", "Título (línea 1)"), T("inicio.titulo2", "Título (línea 2, en contorno)")] },
     A("inicio.texto", "Texto de bienvenida"), { t: "row", fields: [T("inicio.boton1", "Botón WhatsApp"), T("inicio.boton2", "Botón horarios")] } ] },
   { l: "Franja que se mueve", fields: [ Ls("inicio.franja", "Palabras", "text", { add: "Agregar palabra" }) ] },
   { l: "Tarjetas", fields: [ tarjeta("inicio.tarjeta_hoy", "Tarjeta «Hoy» (cuando no hay clase; si hay, se calcula sola con los horarios)"),
     tarjeta("inicio.tarjeta_precio", "Tarjeta de precio"), tarjeta("inicio.tarjeta_competencias", "Tarjeta de competencias"), tarjeta("inicio.tarjeta_ubicacion", "Tarjeta de ubicación"),
     G("Botón de WFN", "inicio.boton_wfn", [T("etiqueta", "Etiqueta chica"), T("titulo", "Título"), T("enlace", "Texto del enlace")]) ] } ] },
 { id: "clases", tab: "Clases", help: "Disciplinas y grupos.", cards: [
   { l: "Encabezado", fields: [ { t: "row", fields: [T("clases.eyebrow", "Etiqueta chica"), T("clases.titulo", "Título")] }, A("clases.texto", "Texto") ] },
   { l: "Disciplinas", fields: [ Ls("clases.disciplinas", "Disciplinas", [T("nombre", "Nombre"), A("texto", "Descripción"), I("foto", "Foto", { folder: "clases" })], { add: "Agregar disciplina", title: "nombre" }) ] },
   { l: "Grupos", fields: [ Ls("clases.grupos", "Grupos", [{ t: "row", fields: [T("etiqueta", "Etiqueta", { ph: "Ej. De 6 a 15 años" }), T("nombre", "Nombre del grupo")] }, A("horario", "Días y horario (texto)")], { add: "Agregar grupo", title: "nombre" }) ] } ] },
 { id: "horarios", tab: "Horarios y precio", help: "La tabla de horarios con puntos verdes, la tarjeta «Hoy» de Inicio y el precio se actualizan con estos datos.", cards: [
   { l: "Encabezado", fields: [ { t: "row", fields: [T("horarios.eyebrow", "Etiqueta chica"), T("horarios.titulo", "Título")] }, T("horarios.texto", "Texto") ] },
   { l: "Clases de la semana", fields: [ Ls("horarios.clases", "Clases", [ T("nombre", "Nombre de la clase"),
       { t: "row", fields: [{ t: "time", k: "inicio", l: "Empieza" }, { t: "time", k: "fin", l: "Termina" }] },
       { t: "days", k: "dias", l: "Días con clase" },
       T("detalle", "Texto de horario (opcional)", { help: "Si lo dejas vacío se escribe solo, ej. «7:00 p. m. – 8:00 p. m.»" }),
       { t: "bool", k: "destacado", l: "Resaltar en verde (ej. sparring)" } ], { add: "Agregar clase", title: "nombre" }) ] },
   { l: "Nota debajo de la tabla", fields: [ T("horarios.nota_titulo", "Inicio en negritas", { ph: "Viernes de sparring:" }), A("horarios.nota", "Texto de la nota") ] },
   { l: "Precio", fields: [ { t: "row", fields: [T("horarios.precio.etiqueta", "Etiqueta", { ph: "Mensualidad" }), T("horarios.precio.monto", "Precio", { ph: "$600" })] },
     Ls("horarios.precio.beneficios", "Lo que incluye", "text", { add: "Agregar renglón" }),
     { t: "row", fields: [T("horarios.precio.inscripcion_titulo", "Inscripción (negritas)"), T("horarios.precio.inscripcion", "Inscripción (texto)")] },
     T("horarios.precio.boton", "Texto del botón") ] } ] },
 { id: "equipo", tab: "Equipo", help: "Coaches, tabla comparativa, uniforme y banda de competencias.", cards: [
   { l: "Encabezado", fields: [ { t: "row", fields: [T("equipo.eyebrow", "Etiqueta chica"), T("equipo.titulo", "Título")] }, A("equipo.texto", "Texto") ] },
   { l: "Coaches", fields: [ Ls("equipo.coaches", "Coaches", [{ t: "row", fields: [T("rol", "Rol", { ph: "Coach principal" }), T("nombre", "Nombre")] }, I("foto", "Foto", { folder: "coaches" })], { add: "Agregar coach", title: "nombre" }) ] },
   { l: "Tabla comparativa", fields: [ Ls("equipo.comparativa", "Renglones", [{ t: "row3", fields: [T("izq", "Coach 1"), T("etiqueta", "Tema"), T("der", "Coach 2")] }], { add: "Agregar renglón", title: "etiqueta" }) ] },
   { l: "Uniforme", fields: [ { t: "row", fields: [T("equipo.uniforme_eyebrow", "Etiqueta chica"), T("equipo.uniforme_titulo", "Título")] },
     Ls("equipo.uniforme", "Prendas", [T("nombre", "Nombre"), I("foto", "Foto", { folder: "uniforme" })], { add: "Agregar prenda", title: "nombre" }) ] },
   { l: "Banda de competencias", fields: [ { t: "row", fields: [T("equipo.banda.eyebrow", "Etiqueta chica"), T("equipo.banda.titulo", "Título")] }, A("equipo.banda.texto", "Texto"), T("equipo.banda.boton", "Texto del botón") ] } ] },
 { id: "nosotros", tab: "Nosotros", help: "Palabras animadas, misión, visión y valores.", cards: [
   { l: "Palabras animadas", fields: [ T("nosotros.frase", "Frase de arriba"), Ls("nosotros.palabras", "Palabras (aparecen una tras otra)", "text", { add: "Agregar palabra" }), T("nosotros.final", "Palabra final", { ph: "Oss" }) ] },
   { l: "Misión y visión", fields: [ A("nosotros.mision", "Misión"), A("nosotros.vision", "Visión"), I("nosotros.foto_vision", "Foto junto a la visión", { folder: "nosotros" }) ] },
   { l: "Valores", fields: [ { t: "row", fields: [T("nosotros.valores_eyebrow", "Etiqueta chica"), T("nosotros.valores_titulo", "Título")] },
     Ls("nosotros.valores", "Valores", [T("nombre", "Nombre"), A("texto", "Texto"), I("foto", "Foto", { folder: "nosotros" })], { add: "Agregar valor", title: "nombre" }) ] },
   { l: "Llamado final", fields: [ { t: "row", fields: [T("nosotros.cta_titulo", "Título"), T("nosotros.cta_boton", "Texto del botón")] } ] } ] },
 { id: "competencias", tab: "Competencias", help: "Las ventanas del Panamericano WKU y de la liga WFN.", cards: [
   { l: "Panamericano WKU", fields: [ { t: "row", fields: [T("competencias.wku.eyebrow", "Etiqueta chica"), T("competencias.wku.titulo", "Título")] }, A("competencias.wku.texto", "Texto"),
     I("competencias.wku.foto", "Foto principal", { folder: "wku" }), Ls("competencias.wku.galeria", "Galería", "img", { add: "Agregar foto", folder: "wku" }) ] },
   { l: "WFN · La liga", fields: [ { t: "row", fields: [T("competencias.wfn.eyebrow", "Etiqueta chica"), T("competencias.wfn.titulo", "Título")] }, A("competencias.wfn.texto", "Texto"),
     I("competencias.wfn.foto", "Foto principal", { folder: "wfn" }), Ls("competencias.wfn.galeria", "Galería", "img", { add: "Agregar foto", folder: "wfn" }) ] } ] },
 { id: "combates", tab: "Combates WFN", help: "La cartelera: main event arriba y la lista de peleas. Las fotos de peleadores se suben sin fondo; el filtro se aplica solo.", cards: [
   { l: "Evento", fields: [ T("cartelera.evento", "Nombre del evento"), { t: "row", fields: [T("cartelera.fecha", "Fecha"), T("cartelera.lugar", "Lugar")] },
 ] },
   { l: "Main event", fields: [ { t: "row", fields: [T("cartelera.main.div", "División"), T("cartelera.main.rounds", "Rounds")] },
     peleador("cartelera.main.rojo", "Esquina roja", "corner-r"), peleador("cartelera.main.azul", "Esquina azul", "corner-b") ] },
   { l: "Acomodo de las fotos del main event", fields: [ { t: "help", l: "Mueve cada foto y cambia su tamaño. Guarda y revisa con «Ver página»." },
     ...[["rojo", "Esquina roja", "corner-r"], ["azul", "Esquina azul", "corner-b"]].map(([k, l, c]) => ({ t: "group", l, k: "cartelera.main." + k + ".ajuste", cls: c, fields: [
       { t: "range", k: "x", l: "Izquierda ↔ derecha", min: -60, max: 60, step: 1, def: 0 },
       { t: "range", k: "y", l: "Arriba ↕ abajo", min: -40, max: 40, step: 1, def: 0 },
       { t: "range", k: "s", l: "Tamaño", min: 60, max: 160, step: 1, def: 100, unit: "%" } ] })) ] },
   { l: "Demás peleas", fields: [ Ls("cartelera.peleas", "Peleas", [
       { t: "select", k: "seccion", l: "Sección", options: [["estelar", "Cartelera estelar"], ["preliminar", "Preliminares"]] },
       { t: "row3", fields: [T("tipo", "Etiqueta", { ph: "Ej. Co-main event" }), T("div", "División"), T("rounds", "Rounds")] },
       peleador("rojo", "Esquina roja", "corner-r"), peleador("azul", "Esquina azul", "corner-b") ],
       { add: "Agregar pelea", title: x => [x.rojo && (x.rojo.apellido || x.rojo.nombre), x.azul && (x.azul.apellido || x.azul.nombre)].filter(Boolean).join(" vs ") + (x.div ? " · " + x.div : "") }) ] } ] },
 { id: "pie", tab: "Pie de página", help: "El texto de abajo de la página.", cards: [
   { l: "Pie de página", fields: [ { t: "row", fields: [T("pie.anio", "Año"), T("pie.texto_inferior", "Texto inferior")] } ] } ] },
 { id: "colores", tab: "Colores", help: "Los colores de toda la página. Toca el cuadro de color para elegir otro. Se ven en la página al guardar.", cards: [
   { l: "Colores de la página", fields: [
     { t: "color", k: "tema.principal", l: "Color principal", def: "#ff1f1f", help: "Botones, barras, títulos rojos, pie de página y brillo del fondo." },
     { t: "color", k: "tema.acento", l: "Color de acento", def: "#c6f11a", help: "Puntos del horario y etiquetas pequeñas." },
     { t: "color", k: "tema.fondo", l: "Color de fondo", def: "#08080a", help: "Fondo general. Se recomienda un color muy oscuro." } ] },
   { l: "Main event (cartelera WFN)", fields: [
     { t: "color", k: "tema.main_event", l: "Color del main event", def: "", help: "Letras del fondo, luces, VS, fecha y brillo de los peleadores. Si lo dejas vacío usa dorado." } ] },
   { l: "Restablecer", fields: [ { t: "reset" } ] } ] },
 { id: "historial", tab: "Historial", special: "historial" }
];

/* nuevos elementos al presionar «Agregar» */
const NUEVO = {
  "clases.disciplinas": { nombre: "", texto: "", foto: "" },
  "clases.grupos": { etiqueta: "", nombre: "", horario: "" },
  "horarios.clases": { nombre: "", inicio: "19:00", fin: "20:00", detalle: "", dias: [1, 2, 3, 4, 5], destacado: false },
  "equipo.coaches": { rol: "", nombre: "", foto: "" },
  "equipo.comparativa": { izq: "", etiqueta: "", der: "" },
  "equipo.uniforme": { nombre: "", foto: "" },
  "nosotros.valores": { nombre: "", texto: "", foto: "" },
  "cartelera.peleas": { tipo: "", div: "", rounds: "3 × 3 min", seccion: "preliminar", rojo: { nombre: "", apellido: "", origen: "", record: "", foto: "" }, azul: { nombre: "", apellido: "", origen: "", record: "", foto: "" } }
};

/* ---------------- estado ---------------- */
let USER = null, SAVED = null, DRAFT = null, TAB = "negocio";
const get = (o, p) => p.split(".").reduce((a, k) => a == null ? undefined : a[k], o);
const set = (o, p, v) => { const ks = p.split("."); let t = o; ks.slice(0, -1).forEach((k, i) => { if (t[k] == null) t[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; t = t[k]; }); t[ks[ks.length - 1]] = v; };
const J = (a, b) => a ? a + "." + b : b;
const dirty = () => JSON.stringify(DRAFT) !== JSON.stringify(SAVED);
function status(txt, cls = "") { const s = $("#st"); s.textContent = txt; s.className = "st " + cls; }
function refreshBar() { const d = dirty(); $("#b-save").disabled = !d; if (d) status("Tienes cambios sin guardar", "dirty"); }
function toast(t) { const d = document.createElement("div"); d.className = "toast"; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }

/* ---------------- dibujar formularios ---------------- */
const DAYS = [[1, "Lun"], [2, "Mar"], [3, "Mié"], [4, "Jue"], [5, "Vie"], [6, "Sáb"], [0, "Dom"]];
function field(f, base) {
  const p = J(base, f.k || "");
  const help = f.help ? `<small>${esc(f.help)}</small>` : "";
  switch (f.t) {
    case "row": return `<div class="g2">${f.fields.map(x => field(x, base)).join("")}</div>`;
    case "row3": return `<div class="g2" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${f.fields.map(x => field(x, base)).join("")}</div>`;
    case "text": return `<label class="f">${esc(f.l)}<input type="text" data-p="${p}" value="${esc(get(DRAFT, p))}" placeholder="${esc(f.ph || "")}">${help}</label>`;
    case "area": return `<label class="f">${esc(f.l)}<textarea data-p="${p}" placeholder="${esc(f.ph || "")}">${esc(get(DRAFT, p))}</textarea>${help}</label>`;
    case "time": return `<label class="f">${esc(f.l)}<input type="time" data-p="${p}" value="${esc(get(DRAFT, p))}">${help}</label>`;
    case "bool": return `<label class="chk"><input type="checkbox" data-p="${p}" data-bool ${get(DRAFT, p) ? "checked" : ""}>${esc(f.l)}</label>`;
    case "select": return `<label class="f">${esc(f.l)}<select data-p="${p}">${f.options.map(([v, t]) => `<option value="${v}"${get(DRAFT, p) === v ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></label>`;
    case "days": { const v = get(DRAFT, p) || []; return `<div class="f"><span style="font-weight:700;font-size:13px;color:#d9d3cc">${esc(f.l)}</span><div class="days">${DAYS.map(([d, t]) => `<label><input type="checkbox" data-days="${p}" value="${d}" ${v.includes(d) ? "checked" : ""}>${t}</label>`).join("")}</div></div>`; }
    case "img": return imgField(p, f);
    case "color": { const v = get(DRAFT, p) || ""; const shown = /^#[0-9a-f]{6}$/i.test(v) ? v : (f.def || "#ff1f1f");
      return `<div class="f"><span style="font-weight:700;font-size:13px;color:#d9d3cc">${esc(f.l)}</span><div class="colrow"><input type="color" data-color="${p}" value="${esc(shown)}"><input type="text" data-p="${p}" value="${esc(v)}" placeholder="${esc(f.def || "Usar color principal")}" maxlength="7"><button type="button" class="btn sm" data-clear="${p}">${f.def ? "Original" : "Vaciar"}</button></div>${help}</div>`; }
    case "help": return `<p style="margin:0;color:var(--muted);font-size:13px">${esc(f.l)}</p>`;
    case "range": { const v = get(DRAFT, p); const val = typeof v === "number" ? v : f.def;
      return `<label class="f">${esc(f.l)} <output style="color:var(--gold);font-weight:800">${val}${f.unit || ""}</output><input type="range" data-p="${p}" data-num="1" data-unit="${f.unit || ""}" min="${f.min}" max="${f.max}" step="${f.step}" value="${val}"></label>`; }
    case "reset": return `<button type="button" class="btn del" data-resettema="1" style="justify-self:start">Regresar a los colores originales</button>`;
    case "group": return `<div class="item ${f.cls || ""}" style="border-left-color:${f.cls ? "" : "#3a3a40"}"><div class="item-h"><b>${esc(f.l)}</b></div>${f.fields.map(x => field(x, p)).join("")}</div>`;
    case "list": return listField(p, f);
  }
  return "";
}
function imgField(p, f) {
  const u = get(DRAFT, p) || "";
  const src = u ? (/^https?:/.test(u) ? u : u) : "";
  return `<div class="f"><span style="font-weight:700;font-size:13px;color:#d9d3cc">${esc(f.l || "Foto")}</span>
    <div class="img"><span class="pv${f.cut ? " cut" : ""}">${src ? `<img src="${esc(src)}" alt="">` : "SIN FOTO"}</span>
    <div class="ia"><div class="row"><label class="btn sm">${u ? "Cambiar foto" : "Subir foto"}<input type="file" accept="image/*" data-img="${p}" data-folder="${esc(f.folder || "general")}" data-cut="${f.cut ? 1 : ""}"></label>${u ? `<button type="button" class="btn sm del" data-clear="${p}">Quitar</button>` : ""}</div>
    ${f.help ? `<small>${esc(f.help)}</small>` : `<small>JPG o PNG. Se ajusta el tamaño automáticamente.</small>`}</div></div></div>`;
}
function listField(p, f) {
  const arr = get(DRAFT, p) || [];
  const ops = (i) => `<span class="ops"><button type="button" class="btn sm" data-op="up" data-l="${p}" data-i="${i}" ${i === 0 ? "disabled" : ""} title="Subir">↑</button><button type="button" class="btn sm" data-op="down" data-l="${p}" data-i="${i}" ${i === arr.length - 1 ? "disabled" : ""} title="Bajar">↓</button><button type="button" class="btn sm del" data-op="del" data-l="${p}" data-i="${i}" title="Quitar">✕</button></span>`;
  let items;
  if (f.item === "text") items = arr.map((v, i) => `<div class="item str"><input type="text" data-p="${p}.${i}" value="${esc(v)}">${ops(i)}</div>`).join("");
  else if (f.item === "img") items = arr.map((v, i) => `<div class="item">${imgField(p + "." + i, { l: "Foto " + (i + 1), folder: f.folder })}<div class="item-h"><b></b>${ops(i)}</div></div>`).join("");
  else items = arr.map((v, i) => { const tt = typeof f.title === "function" ? f.title(v) : (v && v[f.title]); return `<div class="item"><div class="item-h"><b>${i + 1}. ${esc(tt || "Sin nombre")}</b>${ops(i)}</div>${f.item.map(x => field(x, p + "." + i)).join("")}</div>`; }).join("");
  return `<div class="f"><span style="font-weight:700;font-size:13px;color:#d9d3cc">${esc(f.l)}</span><div class="list">${items}</div><button type="button" class="btn sm" data-op="add" data-l="${p}" data-kind="${typeof f.item === "string" ? f.item : "obj"}" style="justify-self:start">+ ${esc(f.add || "Agregar")}</button></div>`;
}
function renderTabs() { $("#tabs").innerHTML = SCHEMA.map(s => `<button type="button" data-tab="${s.id}" class="${s.id === TAB ? "on" : ""}">${esc(s.tab)}</button>`).join(""); }
function renderForm() {
  const s = SCHEMA.find(x => x.id === TAB);
  if (s.special === "historial") return renderHist();
  const y = scrollY;
  $("#form").innerHTML = `<div class="sec"><h2>${esc(s.tab)}</h2><p class="help">${esc(s.help || "")}</p>
    ${s.cards.map(c => `<div class="card"><h3>${esc(c.l)}</h3>${c.fields.map(f => field(f, "")).join("")}</div>`).join("")}</div>`;
  scrollTo(0, y);
}

/* ---------------- historial ---------------- */
async function renderHist() {
  $("#form").innerHTML = `<div class="sec"><h2>Historial</h2><p class="help">Cada vez que guardas, se respalda la versión anterior. Si te equivocas, carga una versión y luego presiona «Guardar cambios».</p><div class="hist" id="hist">Cargando…</div></div>`;
  const { data, error } = await sb.from("sitios_historial").select("id,guardado").eq("sitio_id", CFG.SITIO_ID).order("guardado", { ascending: false }).limit(20);
  const box = $("#hist"); if (!box) return;
  if (error) { box.textContent = "No se pudo leer el historial."; return; }
  if (!data.length) { box.textContent = "Todavía no hay versiones anteriores."; return; }
  box.innerHTML = data.map(r => `<div class="hrow"><span>${new Date(r.guardado).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</span><button type="button" class="btn sm" data-hist="${r.id}">Cargar esta versión</button></div>`).join("");
}

/* ---------------- fotos: reducir tamaño y subir ---------------- */
function procesar(file, cut) {
  return new Promise((ok, bad) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const max = cut ? 1400 : 1600, k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
      cv.toBlob(b => {
        if (b && b.type === "image/webp") return ok({ blob: b, ext: "webp", type: "image/webp" });
        // el navegador no hace WebP: PNG si es recorte (conserva transparencia), JPG si no
        if (cut) cv.toBlob(p => ok({ blob: p, ext: "png", type: "image/png" }), "image/png");
        else cv.toBlob(j => ok({ blob: j, ext: "jpg", type: "image/jpeg" }), "image/jpeg", .86);
      }, "image/webp", .86);
    };
    img.onerror = () => { URL.revokeObjectURL(url); bad(new Error("No se pudo leer la imagen")); };
    img.src = url;
  });
}
async function subir(input) {
  const f = input.files[0]; if (!f) return;
  const p = input.dataset.img, folder = input.dataset.folder, cut = !!input.dataset.cut;
  status("Subiendo foto…");
  try {
    const r = await procesar(f, cut);
    const name = `${CFG.SITIO_ID}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${r.ext}`;
    const { error } = await sb.storage.from(CFG.BUCKET).upload(name, r.blob, { contentType: r.type, upsert: false, cacheControl: "31536000" });
    if (error) throw error;
    const { data } = sb.storage.from(CFG.BUCKET).getPublicUrl(name);
    set(DRAFT, p, data.publicUrl);
    renderForm(); refreshBar(); toast("Foto lista. Recuerda guardar los cambios.");
  } catch (e) { status("No se pudo subir la foto: " + (e.message || e), "err"); }
}

/* ---------------- guardar ---------------- */
async function guardar() {
  const b = $("#b-save"); b.disabled = true; status("Guardando…");
  const { data, error } = await sb.from("sitios").update({ contenido: DRAFT }).eq("id", CFG.SITIO_ID).select("id");
  if (error || !data || !data.length) { b.disabled = false; status(error ? "No se guardó: " + error.message : "No se guardó: esta cuenta no tiene permiso.", "err"); return; }
  SAVED = clone(DRAFT);
  try { localStorage.setItem("sitio-cache-" + CFG.SITIO_ID, JSON.stringify(SAVED)); } catch (e) {}
  status("Guardado ✓ La página ya muestra los cambios.", "ok"); refreshBarAfterSave();
}
function refreshBarAfterSave() { $("#b-save").disabled = true; }

/* ---------------- eventos del formulario ---------------- */
const form = $("#form");
form.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.color) { set(DRAFT, t.dataset.color, t.value); const tx = form.querySelector(`input[type=text][data-p="${t.dataset.color}"]`); if (tx) tx.value = t.value; refreshBar(); return; }
  if (t.dataset.days) { const p = t.dataset.days; set(DRAFT, p, [...form.querySelectorAll(`[data-days="${p}"]:checked`)].map(x => +x.value)); }
  else if (t.dataset.num) { set(DRAFT, t.dataset.p, Number(t.value)); const o = t.parentElement.querySelector("output"); if (o) o.textContent = t.value + (t.dataset.unit || ""); }
  else if (t.dataset.p) set(DRAFT, t.dataset.p, t.dataset.bool !== undefined ? t.checked : t.value);
  refreshBar();
});
form.addEventListener("change", e => { const t = e.target; if (t.dataset.img) subir(t); else if (t.tagName === "SELECT" && t.dataset.p) { set(DRAFT, t.dataset.p, t.value); refreshBar(); } });
form.addEventListener("click", async e => {
  const c = e.target.closest("[data-clear]"); if (c) { set(DRAFT, c.dataset.clear, ""); renderForm(); refreshBar(); return; }
  if (e.target.closest("[data-resettema]")) { if (!confirmar("¿Regresar a los colores originales?")) return; DRAFT.tema = { principal: "#ff1f1f", acento: "#c6f11a", fondo: "#08080a", main_event: "" }; renderForm(); refreshBar(); return; }
  const h = e.target.closest("[data-hist]");
  if (h) { const { data, error } = await sb.from("sitios_historial").select("contenido").eq("id", h.dataset.hist).single(); if (error) return toast("No se pudo cargar"); DRAFT = data.contenido; refreshBar(); toast("Versión cargada. Revísala y presiona «Guardar cambios»."); return; }
  const o = e.target.closest("[data-op]"); if (!o) return;
  const p = o.dataset.l, arr = get(DRAFT, p) || [], i = +o.dataset.i;
  if (!get(DRAFT, p)) set(DRAFT, p, arr);
  if (o.dataset.op === "add") arr.push(o.dataset.kind === "text" || o.dataset.kind === "img" ? "" : clone(NUEVO[p.replace(/\.\d+\./g, ".")] || NUEVO[p] || {}));
  else if (o.dataset.op === "del") { if (!confirmar("¿Quitar este elemento?")) return; arr.splice(i, 1); }
  else if (o.dataset.op === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
  else if (o.dataset.op === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
  renderForm(); refreshBar();
});
const confirmar = t => window.confirm(t);
$("#tabs").addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (!b) return; TAB = b.dataset.tab; renderTabs(); scrollTo(0, 0); renderForm(); });
$("#b-save").addEventListener("click", guardar);
addEventListener("beforeunload", e => { if (DRAFT && dirty()) { e.preventDefault(); e.returnValue = ""; } });

/* ---------------- sesión ---------------- */
const show = id => ["v-login", "v-reset", "v-panel"].forEach(v => $("#" + v).classList.toggle("hidden", v !== id));
async function entrarPanel(user) {
  USER = user;
  const { data: adm } = await sb.from("admins").select("sitio_id").eq("user_id", user.id).eq("sitio_id", CFG.SITIO_ID);
  if (!adm || !adm.length) { await sb.auth.signOut(); show("v-login"); const m = $("#l-msg"); m.textContent = "Esta cuenta no es administradora de esta página."; m.className = "msg err"; return; }
  const { data, error } = await sb.from("sitios").select("contenido").eq("id", CFG.SITIO_ID).single();
  if (error || !data) { show("v-login"); const m = $("#l-msg"); m.textContent = "No se encontró el contenido de la página en Supabase."; m.className = "msg err"; return; }
  SAVED = data.contenido; DRAFT = clone(SAVED);
  $("#who").textContent = user.email; show("v-panel"); renderTabs(); renderForm(); status("Sin cambios");
}
$("#f-login").addEventListener("submit", async e => {
  e.preventDefault(); const m = $("#l-msg"), b = $("#l-btn"); b.disabled = true; m.className = "msg"; m.textContent = "Entrando…";
  const { data, error } = await sb.auth.signInWithPassword({ email: $("#l-email").value.trim(), password: $("#l-pass").value });
  b.disabled = false;
  if (error) { m.textContent = /invalid/i.test(error.message) ? "Correo o contraseña incorrectos." : error.message; m.className = "msg err"; return; }
  m.textContent = ""; entrarPanel(data.user);
});
$("#l-forgot").addEventListener("click", async () => {
  const em = $("#l-email").value.trim(), m = $("#l-msg");
  if (!em) { m.textContent = "Escribe tu correo arriba y vuelve a presionar."; m.className = "msg err"; return; }
  const { error } = await sb.auth.resetPasswordForEmail(em, { redirectTo: location.href.split("#")[0] });
  m.textContent = error ? error.message : "Te enviamos un correo para cambiar tu contraseña."; m.className = "msg " + (error ? "err" : "ok");
});
$("#f-reset").addEventListener("submit", async e => {
  e.preventDefault(); const m = $("#r-msg");
  const { data, error } = await sb.auth.updateUser({ password: $("#r-pass").value });
  if (error) { m.textContent = error.message; m.className = "msg err"; return; }
  m.textContent = "Contraseña actualizada."; m.className = "msg ok"; entrarPanel(data.user);
});
$("#b-out").addEventListener("click", async () => { if (dirty() && !confirmar("Tienes cambios sin guardar. ¿Salir de todos modos?")) return; await sb.auth.signOut(); DRAFT = SAVED = null; show("v-login"); });

let recovering = false;
sb.auth.onAuthStateChange((ev, session) => { if (ev === "PASSWORD_RECOVERY") { recovering = true; show("v-reset"); } });
sb.auth.getSession().then(({ data }) => { if (!recovering && data.session) entrarPanel(data.session.user); });
})();
