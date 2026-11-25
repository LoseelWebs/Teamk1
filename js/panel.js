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
  I("foto", "Foto del peleador", { folder: "peleadores", cut: true, help: "De preferencia SIN FONDO (PNG), de la cintura o el pecho para arriba. En el main event aparece a los lados; en las demás peleas, en un cuadro."  })] });

const SCHEMA = [
 { id: "resumen", tab: "Resumen", special: "resumen", help: "Accesos rápidos y estado de la próxima función." },
 { id: "envivo", tab: "Resultados en vivo", special: "envivo", help: "Marca quién ganó cada pelea desde el celular durante la función." },
 { id: "negocio", tab: "Negocio y contacto", help: "Nombre, teléfono, WhatsApp, dirección y redes. Se usan en toda la página (botones, pie de página, menú).", cards: [
   { l: "Negocio", fields: [ { t: "row", fields: [T("negocio.nombre", "Nombre corto", { help: "Ej. Team K-1" }), T("negocio.subtitulo", "Subtítulo", { help: "Ej. Academy" })] },
     T("negocio.titulo_pestana", "Título de la pestaña del navegador") ] },
   { l: "Contacto", fields: [ { t: "row", fields: [T("contacto.telefono", "Teléfono (como se muestra)", { ph: "782 828 0510" }), T("contacto.whatsapp", "WhatsApp con lada", { help: "Solo números, con 52 al inicio. Ej. 527828280510" })] },
     A("contacto.mensaje_whatsapp", "Mensaje que se escribe solo al abrir WhatsApp"),
     { t: "row", fields: [T("contacto.direccion1", "Dirección (línea 1)"), T("contacto.direccion2", "Dirección (línea 2)")] },
     T("contacto.mapa", "Enlace de Google Maps", { help: "En Google Maps: Compartir → Copiar vínculo." }),
     T("contacto.facebook", "Página de Facebook de Team K-1", { ph: "https://www.facebook.com/nombre-de-la-pagina", help: "Abre la página en Facebook y copia la dirección. Con este enlace se muestran sus publicaciones en Inicio." }),
     T("contacto.facebook_wfn", "Página de Facebook de WFN", { ph: "https://www.facebook.com/nombre-de-la-pagina", help: "Para mostrar también las publicaciones de la liga." }) ] },
   { l: "Sección Contacto", fields: [ { t: "row", fields: [T("contacto.eyebrow", "Etiqueta chica"), T("contacto.titulo", "Título")] },
     { t: "row", fields: [T("contacto.resena_cifra", "Cifra destacada", { ph: "100%" }), T("contacto.resena_texto", "Texto de la reseña")] },
     I("contacto.foto", "Foto de la sección", { folder: "general" }) ] } ] },
 { id: "inicio", tab: "Inicio", help: "La portada y las tarjetas de la pantalla principal.", cards: [
   { l: "Portada", fields: [ { t: "row", fields: [T("inicio.titulo1", "Título (línea 1)"), T("inicio.titulo2", "Título (línea 2, en contorno)")] },
     I("inicio.foto_fondo", "Foto de fondo en PC", { folder: "portada", help: "Horizontal. Las letras van a la izquierda: conviene que la persona quede del lado derecho. Si la dejas vacía se usa la foto de la jaula." }),
     I("inicio.foto_fondo_cel", "Foto de fondo en celular", { folder: "portada", help: "Vertical. Si la dejas vacía se usa la de PC." }),
     T("inicio.boton1", "Texto del botón de WhatsApp (al final del inicio)") ] },
   { l: "Seminario o evento", fields: [ { t: "bool", k: "inicio.seminario.activo", l: "Mostrar en Inicio (desactívalo cuando no haya seminario)" },
     { t: "row", fields: [T("inicio.seminario.etiqueta", "Tipo", { ph: "Seminario" }), T("inicio.seminario.titulo", "Título", { ph: "Seminario de Muay Thai" })] },
     T("inicio.seminario.fecha", "Fecha y hora (texto)", { ph: "Sábado 22 de noviembre · 10:00 a. m." }), A("inicio.seminario.texto", "Descripción"),
     I("inicio.seminario.foto", "Foto o cartel del seminario", { folder: "seminarios" }), T("inicio.seminario.boton", "Texto del botón", { help: "El botón abre WhatsApp con un mensaje sobre el seminario." }) ] },
   { l: "Franja que se mueve", fields: [ Ls("inicio.franja", "Palabras", "text", { add: "Agregar palabra" }) ] },
   { l: "Disciplinas en Inicio", fields: [ { t: "help", l: "Las fotos y nombres salen de la pestaña Clases." }, { t: "row", fields: [T("inicio.disciplinas_eyebrow", "Etiqueta chica"), T("inicio.disciplinas_titulo", "Título")] } ] },
   { l: "Bloque con foto de fondo", fields: [ { t: "row", fields: [T("inicio.bloque.eyebrow", "Etiqueta chica"), T("inicio.bloque.titulo", "Título")] }, A("inicio.bloque.texto", "Texto"),
     I("inicio.bloque.foto", "Foto de fondo", { folder: "inicio", help: "Se oscurece y se le ponen sombras rojas sola. Si la dejas vacía se usa una foto de las disciplinas." }), T("inicio.bloque.boton", "Texto del botón"),
     Ls("inicio.bloque.datos", "Datos destacados", [{ t: "row", fields: [T("cifra", "Cifra", { ph: "4" }), T("texto", "Texto", { ph: "disciplinas de contacto" })] }], { add: "Agregar dato", title: "cifra" }) ] },
   { l: "Botón ancho de WFN", fields: [ { t: "row", fields: [T("inicio.banner_wfn.etiqueta", "Etiqueta chica"), T("inicio.banner_wfn.titulo", "Título")] },
     T("inicio.banner_wfn.texto", "Texto", { help: "Si hay fecha de la próxima función, se muestra la fecha en lugar de este texto." }),
     I("inicio.banner_wfn.foto", "Foto de un combate de la liga", { folder: "wfn", help: "Se le aplica un tono dorado automáticamente." }) ] },
   { l: "Novedades", fields: [ { t: "help", l: "A la izquierda van estas tarjetas con foto (la primera grande); a la derecha, las publicaciones de Facebook. Los enlaces de Facebook se ponen en «Negocio y contacto». Si no agregas tarjetas, se arman solas con WFN, clases y uniforme." },
     Ls("inicio.publicaciones", "Publicaciones destacadas de Facebook o Instagram", [ A("enlace", "Enlace o código de la publicación", { ph: "https://www.facebook.com/…/posts/…  o  https://www.instagram.com/p/…", help: "Facebook: desde una computadora, en la publicación toca ··· → Insertar → Copiar código, y pégalo aquí completo. (Los enlaces de «Compartir» que empiezan con facebook.com/share/… no funcionan.) Instagram: ··· → Copiar enlace. La publicación debe ser pública. Si agregas publicaciones, se muestran en lugar del muro de Facebook." }) ],
       { add: "Agregar publicación", title: x => (x.enlace || "").replace(/^https?:\/\/(www\.)?/, "").slice(0, 48) }),
     Ls("inicio.destacados", "Tarjetas destacadas (máximo 5)", [ { t: "row", fields: [T("etiqueta", "Etiqueta chica", { ph: "WFN Combat League" }), T("titulo", "Título")] },
       I("foto", "Foto", { folder: "destacados" }), T("enlace", "A dónde lleva", { ph: "#wfn, #clases, #horarios… o https://…", help: "Usa #wfn, #clases, #horarios, #equipo, #nosotros o #contacto para las secciones de la página, o pega un enlace completo." }) ],
       { add: "Agregar tarjeta", title: "titulo" }) ] },
   { l: "Llamado final", fields: [ T("inicio.cta.titulo", "Título"), T("inicio.cta.texto", "Texto"), I("inicio.cta.foto", "Foto de fondo", { folder: "inicio" }) ] },
   { l: "Tarjetas", fields: [ tarjeta("inicio.tarjeta_hoy", "Tarjeta «Hoy» (cuando no hay clase; si hay, se calcula sola con los horarios)"),
     tarjeta("inicio.tarjeta_precio", "Tarjeta de precio"), tarjeta("inicio.tarjeta_competencias", "Tarjeta de competencias (lleva a WFN)"), tarjeta("inicio.tarjeta_ubicacion", "Tarjeta de ubicación") ] } ] },
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
       { t: "bool", k: "destacado", l: "Resaltar en verde (ej. sparring)" },
       T("junta", "Clases que se juntan (opcional)", { ph: "Intermedios y avanzados, Novatos y adultos", help: "Solo para clases como el sparring. Escribe los nombres de las clases que se unen, separados por coma, igual que como están escritos arriba. En la tabla esas filas se juntan en un solo recuadro verde los días de esta clase, y esta clase ya no sale como fila aparte." }) ], { add: "Agregar clase", title: "nombre" }) ] },
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
   { l: "Palabras animadas", fields: [ T("nosotros.frase", "Frase de arriba"), Ls("nosotros.palabras", "Palabras (aparecen una tras otra)", "text", { add: "Agregar palabra" }), T("nosotros.final", "Palabra final", { ph: "Oss" }),
     { t: "video", k: "nosotros.video", l: "Video de fondo", help: "Se pone en blanco y negro solo. Usa un video corto (10 a 20 segundos, MP4) y sin audio importante; se reproduce sin sonido." },
     I("nosotros.video_poster", "Imagen mientras carga el video", { folder: "nosotros" }) ] },
   { l: "Misión y visión", fields: [ A("nosotros.mision", "Misión"), A("nosotros.vision", "Visión"), I("nosotros.foto_vision", "Foto junto a la visión", { folder: "nosotros" }) ] },
   { l: "Valores", fields: [ { t: "row", fields: [T("nosotros.valores_eyebrow", "Etiqueta chica"), T("nosotros.valores_titulo", "Título")] },
     Ls("nosotros.valores", "Valores", [T("nombre", "Nombre"), A("texto", "Texto")], { add: "Agregar valor", title: "nombre" }) ] },
   { l: "Llamado final", fields: [ { t: "row", fields: [T("nosotros.cta_titulo", "Título"), T("nosotros.cta_boton", "Texto del botón")] } ] } ] },
 { id: "competencias", tab: "Competencias", help: "La ventana del Panamericano WKU y los textos de la sección WFN.", cards: [
   { l: "Panamericano WKU", fields: [ { t: "row", fields: [T("competencias.wku.eyebrow", "Etiqueta chica"), T("competencias.wku.titulo", "Título")] }, A("competencias.wku.texto", "Texto"),
     I("competencias.wku.foto", "Foto principal", { folder: "wku" }), Ls("competencias.wku.galeria", "Galería", "img", { add: "Agregar foto", folder: "wku" }) ] },
   { l: "WFN · Encabezado y «La liga»", fields: [ { t: "row", fields: [T("competencias.wfn.eyebrow", "Etiqueta chica"), T("competencias.wfn.titulo", "Título")] }, A("competencias.wfn.texto", "Texto"),
     I("competencias.wfn.foto", "Foto principal", { folder: "wfn" }), Ls("competencias.wfn.galeria", "Galería", "img", { add: "Agregar foto", folder: "wfn" }) ] } ] },
 { id: "combates", tab: "Combates WFN", help: "La cartelera: main event arriba y la lista de peleas. Marca «Es el co-estelar» en la pelea que va destacada.", cards: [
   { l: "Pantalla «Muy pronto»", fields: [ { t: "help", l: "Úsala cuando no haya función anunciada. También aparece sola un día después de la fecha de la función, mostrando la siguiente edición." },
     { t: "bool", k: "cartelera.proximamente", l: "Mostrar «Muy pronto» en lugar de la cartelera" },
     { t: "row", fields: [T("cartelera.proxima_edicion", "Próxima edición", { ph: "19", help: "Si lo dejas vacío se usa la edición de «Evento» más uno (ej. 18 → WFN 19)." }), T("cartelera.proximamente_etiqueta", "Etiqueta", { ph: "Muy pronto" })] },
     A("cartelera.proximamente_texto", "Texto", { ph: "Estamos preparando la próxima función. Muy pronto anunciaremos la fecha, la sede y la cartelera." }) ] },
   { l: "Evento", fields: [ { t: "row", fields: [T("cartelera.edicion", "Edición (número)", { ph: "Ej. 08" }), T("cartelera.lugar", "Lugar")] }, { t: "row", fields: [{ t: "date", k: "cartelera.dia", l: "Día de la función" }, { t: "time", k: "cartelera.hora", l: "Hora" }] }, T("cartelera.fecha", "Texto si aún no hay fecha", { help: "Se muestra solo mientras el día esté vacío, ej. «Fecha por anunciar»." }), T("cartelera.evento", "Nombre si no hay número de edición"),
 { t: "row", fields: [T("cartelera.boletos", "Precio de boletos", { ph: "$250" }), T("cartelera.boletos_texto", "Nota de boletos", { ph: "Niños menores de 10 años entran gratis" })] },
 { t: "row", fields: [T("cartelera.info_extra", "Dato extra (debajo de la hora)", { ph: "Puertas abren 6:00 p. m." }), T("cartelera.enlace_boletos", "Enlace para comprar boletos (opcional)", { help: "Si lo dejas vacío, el botón abre WhatsApp." })] },
 T("cartelera.mapa_evento", "Enlace de Google Maps de la sede (opcional)"),
 ] },
   { l: "Letras y colores del main event", fields: [ { t: "help", l: "Las palabras se repiten en el recuadro que se mueve detrás de los nombres." },
     Ls("cartelera.fondo", "Palabras del fondo", "text", { add: "Agregar palabra" }),
     { t: "color", k: "tema.wfn_letras", l: "Color del contorno de las letras", def: "#cfcfca", help: "Las palabras que se mueven detrás de los nombres del main event." },
     { t: "color", k: "tema.wfn_sombra", l: "Color de las letras rellenas", def: "#c8102e", help: "Una de cada cuatro palabras va rellena de este color." },
     { t: "color", k: "tema.wfn_fondo", l: "Color de fondo del main event", def: "#f4f4f2", help: "Se recomienda un color claro para que los nombres negros se lean bien." } ] },
   { l: "Cartel cara a cara (concreto y negro)", fields: [ { t: "help", l: "Cada imagen es un peleador con su fondo ya extendido hacia afuera. Con las dos imágenes de la estelar, el main event usa este diseño con la franja central del logo. Si las borras, se usa el diseño de letras con las fotos de cada peleador." },
     { t: "row", fields: [I("cartelera.cartel.est_izq", "Estelar · peleador izquierdo", { folder: "carteles", help: "Imagen ancha: fondo a la izquierda y la cara pegada a la orilla derecha." }), I("cartelera.cartel.est_der", "Estelar · peleador derecho", { folder: "carteles", help: "Imagen ancha: la cara pegada a la orilla izquierda y el fondo a la derecha." })] },
     { t: "row", fields: [I("cartelera.cartel.co_izq", "Coestelar · peleador izquierdo", { folder: "carteles" }), I("cartelera.cartel.co_der", "Coestelar · peleador derecho", { folder: "carteles" })] } ] },
   { l: "Main event", fields: [ { t: "row", fields: [T("cartelera.main.div", "División"), T("cartelera.main.rounds", "Rounds")] },
     peleador("cartelera.main.rojo", "Esquina roja", "corner-r"), peleador("cartelera.main.azul", "Esquina azul", "corner-b"),
     { t: "help", l: "Resultado: márcalo al terminar la pelea y guarda; la página lo muestra al recargarse." }, { t: "row3", fields: [{ t: "select", k: "cartelera.main.ganador", l: "¿Quién ganó? (en vivo)", options: [["", "Sin resultado aún"], ["rojo", "Esquina roja"], ["azul", "Esquina azul"], ["empate", "Empate"], ["nc", "Sin resultado (NC)"]] }, T("cartelera.main.metodo", "Cómo ganó", { ph: "KO, TKO, SUB, Decisión…" }), T("cartelera.main.round", "Round", { ph: "2" }), T("cartelera.main.tiempo", "Tiempo", { ph: "2:15" })] } ] },
   { l: "Acomodo de las fotos del main event", fields: [ { t: "help", l: "Mueve cada foto y cambia su tamaño. Guarda y revisa con «Ver página»." },
     ...[["rojo", "Esquina roja", "corner-r"], ["azul", "Esquina azul", "corner-b"]].map(([k, l, c]) => ({ t: "group", l, k: "cartelera.main." + k + ".ajuste", cls: c, fields: [
       { t: "range", k: "x", l: "Izquierda ↔ derecha", min: -60, max: 60, step: 1, def: 0 },
       { t: "range", k: "y", l: "Arriba ↕ abajo", min: -40, max: 40, step: 1, def: 0 },
       { t: "range", k: "s", l: "Tamaño", min: 60, max: 160, step: 1, def: 100, unit: "%" } ] })) ] },
   { l: "Demás peleas", fields: [ Ls("cartelera.peleas", "Peleas", [
       { t: "select", k: "seccion", l: "Sección", options: [["estelar", "Cartelera estelar"], ["preliminar", "Preliminares"]] },
       { t: "bool", k: "comain", l: "Es el co-estelar (se muestra destacado, debajo del main event)" },
       { t: "row3", fields: [T("tipo", "Etiqueta", { ph: "Ej. Co-main event" }), T("div", "División"), T("rounds", "Rounds")] },
       peleador("rojo", "Esquina roja", "corner-r"), peleador("azul", "Esquina azul", "corner-b"), { t: "row3", fields: [{ t: "select", k: "ganador", l: "¿Quién ganó? (en vivo)", options: [["", "Sin resultado aún"], ["rojo", "Esquina roja"], ["azul", "Esquina azul"], ["empate", "Empate"], ["nc", "Sin resultado (NC)"]] }, T("metodo", "Cómo ganó", { ph: "KO, TKO, SUB, Decisión…" }), T("round", "Round", { ph: "2" }), T("tiempo", "Tiempo", { ph: "2:15" })] } ],
       { add: "Agregar pelea", title: x => [x.rojo && (x.rojo.apellido || x.rojo.nombre), x.azul && (x.azul.apellido || x.azul.nombre)].filter(Boolean).join(" vs ") + (x.div ? " · " + x.div : "") }) ] } ] },
 { id: "liga", tab: "Liga WFN", help: "Información de la liga, resultados de ediciones anteriores y la cinta de patrocinadores de la sección WFN.", cards: [
   { l: "Información de «La liga»", fields: [ { t: "help", l: "Se muestra en la sección WFN, debajo de los patrocinadores." }, T("liga.acerca.titulo", "Título"), A("liga.acerca.texto", "Texto"),
     Ls("liga.acerca.datos", "Datos destacados", [{ t: "row", fields: [T("cifra", "Cifra", { ph: "18" }), T("texto", "Texto", { ph: "ediciones" })] }], { add: "Agregar dato", title: "cifra" }),
     { t: "row", fields: [T("liga.acerca.sede", "Dirección"), T("liga.acerca.telefono", "Teléfono")] } ] },
   { l: "Pasar la función actual al historial", fields: [ { t: "help", l: "Copia las peleas de «Combates WFN» como una edición nueva del historial. Los resultados que ya marcaste en «Combates WFN» se copian también." }, { t: "tohist" } ] },
   { l: "Ediciones anteriores", fields: [ { t: "bool", k: "liga.ocultar_ediciones", l: "Ocultar la sección «Ediciones anteriores» en la página" }, Ls("liga.ediciones", "Ediciones (la primera es la más reciente)", [
       { t: "row3", fields: [T("edicion", "Edición", { ph: "07" }), { t: "date", k: "fecha", l: "Fecha" }, T("lugar", "Lugar")] },
       T("titulo", "Nombre (opcional)", { help: "Si lo dejas vacío se escribe «WFN» y el número." }),
       I("foto", "Cartel o foto de la función (opcional)", { folder: "historial" }),
       Ls("peleas", "Peleas", [ { t: "select", k: "seccion", l: "Sección", options: [["principal", "Cartelera principal"], ["preliminar", "Cartelera preliminar"]] },
         { t: "row", fields: [T("rojo", "Peleador esquina roja"), T("azul", "Peleador esquina azul")] },
         { t: "row", fields: [T("rojo_record", "Récord esquina roja", { ph: "6-1-0" }), T("azul_record", "Récord esquina azul", { ph: "5-2-0" })] },
         { t: "row", fields: [I("rojo_foto", "Foto esquina roja (opcional)", { folder: "historial" }), I("azul_foto", "Foto esquina azul (opcional)", { folder: "historial" })] },
         { t: "row", fields: [T("div", "División", { ph: "Peso ligero" }), T("titulo", "Etiqueta (opcional)", { ph: "Pelea estelar, por el título…" })] },
         { t: "row3", fields: [{ t: "select", k: "ganador", l: "¿Quién ganó?", options: [["", "Sin resultado aún"], ["rojo", "Esquina roja"], ["azul", "Esquina azul"], ["empate", "Empate"], ["nc", "Sin decisión"]] },
           T("metodo", "Cómo ganó", { ph: "KO, TKO, SUB, UD…" }), T("round", "Round", { ph: "2" }), T("tiempo", "Tiempo", { ph: "4:54" })] } ],
         { add: "Agregar pelea", title: x => [x.rojo, x.azul].filter(Boolean).join(" vs ") }) ],
     { add: "Agregar edición", title: x => "WFN " + (x.edicion || "") + (x.fecha ? " · " + x.fecha : "") }) ] },
   { l: "Patrocinadores", fields: [ T("liga.patrocinadores_titulo", "Título de la sección"),
     Ls("liga.patrocinadores", "Logos (se mueven en una cinta de derecha a izquierda)", [ T("nombre", "Nombre del patrocinador"),
       I("logo", "Logo", { folder: "patrocinadores", cut: true, help: "De preferencia PNG sin fondo." }), T("enlace", "Enlace (opcional)", { ph: "https://..." }) ],
       { add: "Agregar patrocinador", title: "nombre" }) ] } ] },
 { id: "pie", tab: "Pie de página", help: "El texto de abajo de la página.", cards: [
   { l: "Pie de página", fields: [ T("pie.anio", "Año del ©") ] } ] },
 { id: "colores", tab: "Colores", help: "Los colores de toda la página. Toca el cuadro de color para elegir otro. Se ven en la página al guardar.", cards: [
   { l: "Colores de la página", fields: [
     { t: "color", k: "tema.principal", l: "Color principal", def: "#ff1f1f", help: "Botones, barras, títulos rojos, pie de página y brillo del fondo." },
     { t: "color", k: "tema.acento", l: "Color de acento", def: "#c6f11a", help: "Puntos del horario y etiquetas pequeñas." },
     { t: "color", k: "tema.fondo", l: "Color de fondo", def: "#050505", help: "Fondo general. Se recomienda un color muy oscuro." } ] },
   { l: "Main event (sección WFN)", fields: [
     { t: "color", k: "tema.wfn_letras", l: "Color del contorno de las letras", def: "#cfcfca", help: "Las palabras que se mueven detrás de los nombres del main event." },
     { t: "color", k: "tema.wfn_sombra", l: "Color de las letras rellenas", def: "#c8102e", help: "Una de cada cuatro palabras va rellena de este color." },
     { t: "color", k: "tema.wfn_fondo", l: "Color de fondo del main event", def: "#f4f4f2", help: "Se recomienda un color claro para que los nombres negros se lean bien." } ] },
   { l: "Restablecer", fields: [ { t: "reset" } ] } ] },
 { id: "historial", tab: "Historial", special: "historial" }
];

/* nuevos elementos al presionar «Agregar» */
const NUEVO = {
  "clases.disciplinas": { nombre: "", texto: "", foto: "" },
  "clases.grupos": { etiqueta: "", nombre: "", horario: "" },
  "horarios.clases": { nombre: "", inicio: "19:00", fin: "20:00", detalle: "", dias: [1, 2, 3, 4, 5], destacado: false, junta: "" },
  "equipo.coaches": { rol: "", nombre: "", foto: "" },
  "equipo.comparativa": { izq: "", etiqueta: "", der: "" },
  "equipo.uniforme": { nombre: "", foto: "" },
  "nosotros.valores": { nombre: "", texto: "" },
  "inicio.bloque.datos": { cifra: "", texto: "" },
  "liga.acerca.datos": { cifra: "", texto: "" },
  "liga.patrocinadores": { nombre: "", logo: "", enlace: "" },
  "liga.ediciones": { edicion: "", titulo: "", fecha: "", lugar: "", foto: "", peleas: [] },
  "liga.ediciones.peleas": { seccion: "principal", rojo: "", azul: "", rojo_record: "", azul_record: "", rojo_foto: "", azul_foto: "", div: "", titulo: "", ganador: "", metodo: "", round: "", tiempo: "" },
  "inicio.destacados": { etiqueta: "", titulo: "", foto: "", enlace: "" },
  "inicio.publicaciones": { enlace: "" },
  "cartelera.peleas": { tipo: "", div: "", rounds: "3 × 3 min", seccion: "preliminar", comain: false, ganador: "", metodo: "", round: "", tiempo: "", rojo: { nombre: "", apellido: "", origen: "", record: "", foto: "" }, azul: { nombre: "", apellido: "", origen: "", record: "", foto: "" } }
};

/* las secciones nuevas toman sus textos iniciales de js/defaults.js */
const isObj = v => v && typeof v === "object" && !Array.isArray(v);
function fillDef(c, d) { for (const k in d) { if (c[k] === undefined || c[k] === null) c[k] = clone(d[k]); else if (isObj(c[k]) && isObj(d[k])) fillDef(c[k], d[k]); } return c; }
const conDef = c => { c = fillDef(clone(c || {}), window.SITIO_DEF || {}); if (c.inicio) delete c.inicio.lugar; return c; };

/* ---------------- estado ---------------- */
let USER = null, SAVED = null, DRAFT = null, TAB = "resumen";
const get = (o, p) => p.split(".").reduce((a, k) => a == null ? undefined : a[k], o);
const set = (o, p, v) => { const ks = p.split("."); let t = o; ks.slice(0, -1).forEach((k, i) => { if (t[k] == null) t[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; t = t[k]; }); t[ks[ks.length - 1]] = v; };
const J = (a, b) => a ? a + "." + b : b;
const dirty = () => JSON.stringify(DRAFT) !== JSON.stringify(SAVED);
let stT = 0;
function status(txt, cls = "") { const s = $("#st"); s.textContent = txt; s.className = "st " + cls; const b = $("#bar"); if (!b) return; b.classList.add("show"); clearTimeout(stT); if (cls !== "dirty") stT = setTimeout(() => b.classList.remove("show"), cls === "err" ? 8000 : 3500); }
function refreshBar() { const d = dirty(); $("#b-save").disabled = !d; $("#bar").classList.toggle("d", d); if (d) status(matchMedia("(max-width:620px)").matches ? "Cambios sin guardar" : "Tienes cambios sin guardar", "dirty"); else if ($("#st").classList.contains("dirty")) status("Sin cambios"); marcarCambios(); }
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
    case "date": return `<label class="f">${esc(f.l)}<input type="date" data-p="${p}" value="${esc(get(DRAFT, p))}">${help}</label>`;
    case "bool": return `<label class="chk"><input type="checkbox" data-p="${p}" data-bool ${get(DRAFT, p) ? "checked" : ""}>${esc(f.l)}</label>`;
    case "select": return `<label class="f">${esc(f.l)}<select data-p="${p}">${f.options.map(([v, t]) => `<option value="${v}"${get(DRAFT, p) === v ? " selected" : ""}>${esc(t)}</option>`).join("")}</select></label>`;
    case "days": { const v = get(DRAFT, p) || []; return `<div class="f"><span style="font-weight:700;font-size:13px;color:var(--ink)">${esc(f.l)}</span><div class="days">${DAYS.map(([d, t]) => `<label><input type="checkbox" data-days="${p}" value="${d}" ${v.includes(d) ? "checked" : ""}>${t}</label>`).join("")}</div></div>`; }
    case "img": return imgField(p, f);
    case "color": { const v = get(DRAFT, p) || ""; const shown = /^#[0-9a-f]{6}$/i.test(v) ? v : (f.def || "#ff1f1f");
      return `<div class="f"><span style="font-weight:700;font-size:13px;color:var(--ink)">${esc(f.l)}</span><div class="colrow"><input type="color" data-color="${p}" value="${esc(shown)}"><input type="text" data-p="${p}" value="${esc(v)}" placeholder="${esc(f.def || "Usar color principal")}" maxlength="7"><button type="button" class="btn sm" data-clear="${p}">${f.def ? "Original" : "Vaciar"}</button></div>${help}</div>`; }
    case "help": return `<p style="margin:0;color:var(--muted);font-size:13px">${esc(f.l)}</p>`;
    case "range": { const v = get(DRAFT, p); const val = typeof v === "number" ? v : f.def;
      return `<label class="f">${esc(f.l)} <output style="color:var(--ink);font-weight:800">${val}${f.unit || ""}</output><input type="range" data-p="${p}" data-num="1" data-unit="${f.unit || ""}" min="${f.min}" max="${f.max}" step="${f.step}" value="${val}"></label>`; }
    case "video": { const v = get(DRAFT, p) || "";
      return `<div class="f"><span style="font-weight:700;font-size:13px;color:var(--ink)">${esc(f.l)}</span>${v ? `<video src="${esc(v)}" muted loop playsinline controls style="width:100%;max-width:360px;aspect-ratio:16/9;background:#000;filter:grayscale(1)"></video>` : ""}
        <div class="row" style="display:flex;gap:6px;flex-wrap:wrap"><label class="btn sm">${v ? "Cambiar video" : "Subir video"}<input type="file" accept="video/mp4,video/webm,video/quicktime" data-video="${p}" style="display:none"></label>${v ? `<button type="button" class="btn sm del" data-clear="${p}">Quitar</button>` : ""}</div>
        <input type="text" data-p="${p}" value="${esc(v)}" placeholder="O pega aquí el enlace del video (https://… o img/video.mp4)">${help}</div>`; }
    case "tohist": return `<button type="button" class="btn" data-tohist="1" style="justify-self:start">Pasar «Combates WFN» al historial</button>`;
    case "reset": return `<button type="button" class="btn del" data-resettema="1" style="justify-self:start">Regresar a los colores originales</button>`;
    case "group": return `<div class="item ${f.cls || ""}" style="border-left-color:${f.cls ? "" : "var(--line)"}"><div class="item-h"><b>${esc(f.l)}</b></div>${f.fields.map(x => field(x, p)).join("")}</div>`;
    case "list": return listField(p, f);
  }
  return "";
}
function imgField(p, f) {
  const u = get(DRAFT, p) || "";
  const src = u ? (/^https?:/.test(u) ? u : u) : "";
  return `<div class="f"><span style="font-weight:700;font-size:13px;color:var(--ink)">${esc(f.l || "Foto")}</span>
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
  else items = arr.map((v, i) => { const tt = typeof f.title === "function" ? f.title(v) : (v && v[f.title]); const k = p + "." + i;
    return `<details class="item" data-o="${k}"${isOpen(k, false) ? " open" : ""}><summary class="item-h"><span class="chev"></span><b>${i + 1}. ${esc(tt || "Sin nombre")}</b>${ops(i)}</summary><div class="ib">${f.item.map(x => field(x, k)).join("")}</div></details>`; }).join("");
  return `<div class="f"><span style="font-weight:700;font-size:13px;color:var(--ink)">${esc(f.l)}</span><div class="list">${items}</div><button type="button" class="btn sm" data-op="add" data-l="${p}" data-kind="${typeof f.item === "string" ? f.item : "obj"}" style="justify-self:start">+ ${esc(f.add || "Agregar")}</button></div>`;
}
/* ---------------- navegación ---------------- */
const NAV = [["General", ["resumen", "negocio", "colores"], "#c6f11a"], ["Secciones de la página", ["inicio", "clases", "horarios", "equipo", "nosotros", "pie"], "#ff3b3b"], ["WFN Combat League", ["envivo", "combates", "liga", "competencias"], "#e8b84f"], ["Respaldo", ["historial"], "#8fb0d9"]];
const GRP = id => NAV.find(n => n[1].includes(id)) || NAV[0];
/* cada sección tiene su propio color: se pinta el fondo, las tarjetas y los recuadros */
const COL = { resumen: "#c6f11a", negocio: "#2ec4b6", colores: "#ff5fa2", inicio: "#ff3b3b", clases: "#ff8a2a", horarios: "#f5c518", equipo: "#3ecf7a", nosotros: "#a879ff", pie: "#9aa0a6", envivo: "#ff2d55", combates: "#e8b84f", liga: "#f0a020", competencias: "#4aa3ff", historial: "#8fb0d9" };
const CC = id => COL[id] || GRP(id)[2];
const IC = {
  resumen: '<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>',
  negocio: '<path d="M4 20V9l8-5 8 5v11zM9 20v-6h6v6"/>',
  colores: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16c1.5 0 2-1 1.5-2s0-2 1.5-2h2a3 3 0 0 0 3-3"/><circle cx="8.5" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/>',
  inicio: '<path d="M3 11 12 4l9 7M5 10v10h14V10"/>',
  clases: '<path d="M7 11V7a2 2 0 0 1 4 0v4M11 9a2 2 0 0 1 4 0v3M15 11a2 2 0 0 1 4 0v3a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6v-2a2 2 0 0 1 2-2h1"/>',
  horarios: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  equipo: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M21 20a5 5 0 0 0-4-5"/>',
  nosotros: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  pie: '<path d="M4 4h16v16H4zM4 15h16"/>',
  envivo: '<circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/>',
  combates: '<path d="M5 19 19 5M14 5h5v5M10 19H5v-5M5 5l5 5M19 19l-5-5"/>',
  liga: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>',
  competencias: '<circle cx="12" cy="9" r="5"/><path d="m9 13-2 7 5-2 5 2-2-7"/>',
  historial: '<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v3h3M12 8v4l3 2"/>',
  mas: '<path d="M4 7h16M4 12h16M4 17h16"/>'
};
const ico = id => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[id] || IC.resumen}</svg>`;
const SEC = id => SCHEMA.find(x => x.id === id);
function renderTabs() {
  $("#tabs").innerHTML = NAV.map(([g, ids, col]) => `<h4 style="--g:${col}">${esc(g)}</h4>` + ids.map(id => `<button type="button" style="--g:${CC(id)}" data-tab="${id}" class="${id === TAB ? "on" : ""}${id === "envivo" ? " live" : ""}">${ico(id)}<span>${esc(SEC(id).tab)}</span><i class="dot"></i></button>`).join("")).join("");
  const bn = [["resumen", "Resumen"], ["envivo", "En vivo"], ["combates", "Combates"]];
  $("#bnav").innerHTML = bn.map(([id, t]) => `<a style="--g:${CC(id)}" data-tab="${id}" class="${id === TAB ? "on" : ""}">${ico(id)}${t}<i class="dot"></i></a>`).join("") + `<a data-more="1" style="--g:${CC(TAB)}" class="${bn.some(b => b[0] === TAB) ? "" : "on"}">${ico("mas")}Más</a>`;
  $("#ttl").textContent = SEC(TAB).tab; const gr = GRP(TAB); document.body.style.setProperty("--acc", CC(TAB)); $("#tgrp").textContent = gr[0]; $("#tchip").innerHTML = ico(TAB);
  const mt = document.querySelector("meta[name=theme-color]"); if (mt) mt.content = "#ffffff";
  marcarCambios();
}
/* qué campos tiene cada sección (para el punto de «sin guardar» y el buscador) */
const PATHS = {}, INDEX = [];
(function indexar() {
  const walk = (fs, base, sec, ci, card) => fs.forEach(f => {
    if (f.t === "row" || f.t === "row3") return walk(f.fields, base, sec, ci, card);
    const p = J(base, f.k || "");
    if (f.t === "group") return walk(f.fields, p, sec, ci, card + " · " + f.l);
    if (!f.k) return;
    PATHS[sec].push(p);
    if (f.l) INDEX.push({ sec, ci, p, l: f.l, card, h: f.help || "" });
  });
  SCHEMA.forEach(s => { PATHS[s.id] = []; (s.cards || []).forEach((c, ci) => { INDEX.push({ sec: s.id, ci, p: "", l: c.l, card: "", h: "" }); walk(c.fields, "", s.id, ci, c.l); }); });
  PATHS.envivo = ["cartelera.main", "cartelera.peleas"];
})();
function marcarCambios() {
  if (!DRAFT) return;
  document.querySelectorAll("[data-tab]").forEach(b => { const ps = PATHS[b.dataset.tab] || []; b.classList.toggle("dirty", ps.some(p => JSON.stringify(get(DRAFT, p)) !== JSON.stringify(get(SAVED, p)))); });
}
/* abiertos / cerrados */
const OPEN = new Map();
const isOpen = (k, def) => OPEN.has(k) ? OPEN.get(k) : def;
function moverAbiertos(a, b) { const m = new Map(); OPEN.forEach((v, k) => { if (k === a || k.startsWith(a + ".")) m.set(b + k.slice(a.length), v); else if (k === b || k.startsWith(b + ".")) m.set(a + k.slice(b.length), v); else m.set(k, v); }); OPEN.clear(); m.forEach((v, k) => OPEN.set(k, v)); }
function irA(id) { TAB = id; document.body.classList.remove("nav-open"); renderTabs(); scrollTo(0, 0); renderForm(); }

function renderForm() {
  const s = SEC(TAB);
  if (s.special === "historial") return renderHist();
  if (s.special === "resumen") return renderResumen();
  if (s.special === "envivo") return renderVivo();
  const y = scrollY;
  $("#form").innerHTML = `<div class="sec"><p class="eyeb">${esc(GRP(s.id)[0])}</p><h2>${esc(s.tab)}</h2><p class="help">${esc(s.help || "")}</p>
    ${s.cards.length > 1 ? `<div class="jump">${s.cards.map((c, i) => `<button type="button" data-jump="${i}">${esc(c.l)}</button>`).join("")}<button type="button" class="all" data-all="1">Abrir todo</button></div>` : ""}
    ${s.cards.map((c, i) => { const k = "card:" + s.id + ":" + i; return `<details class="card" data-o="${k}" id="c-${i}"${isOpen(k, i === 0 || s.cards.length === 1) ? " open" : ""}><summary><h3>${esc(c.l)}</h3><span class="chev"></span></summary><div class="cb">${c.fields.map(f => field(f, "")).join("")}</div></details>`; }).join("")}</div>`;
  scrollTo(0, y);
}

/* ---------------- resumen ---------------- */
function fechaBonita(d) { if (!d) return ""; const x = new Date(d + "T12:00:00"); return isNaN(x) ? d : x.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" }); }
function peleasVivo() {
  const c = DRAFT.cartelera || {}, out = [];
  if (c.main) out.push({ p: "cartelera.main", b: c.main, tag: "Main event" });
  (c.peleas || []).forEach((b, i) => out.push({ p: "cartelera.peleas." + i, b, tag: b.comain ? "Coestelar" : (b.seccion === "preliminar" ? "Preliminar" : "Cartelera estelar") }));
  return out;
}
function renderResumen() {
  const c = DRAFT.cartelera || {}, pv = peleasVivo(), hechas = pv.filter(x => x.b.ganador).length;
  const nombre = c.edicion ? "WFN " + c.edicion : (c.evento || "Próxima función");
  const cuando = [c.dia ? fechaBonita(c.dia) : (c.fecha || "Fecha por anunciar"), c.hora, c.lugar].filter(Boolean).join(" · ");
  const sw = (p, t, sub) => `<label class="qk"><span>${esc(t)}<small>${esc(sub)}</small></span><span class="sw"><input type="checkbox" data-p="${p}" data-bool ${get(DRAFT, p) ? "checked" : ""}><i></i></span></label>`;
  $("#form").innerHTML = `<div class="sec"><p class="eyeb">General</p><h2>Resumen</h2><p class="help">Entra rápido a lo que más usas. Lo que cambies se ve en la página al presionar «Guardar cambios».</p>
    <div class="ev"><span class="k">WFN Combat League</span><h3>${esc(nombre)}</h3><p>${esc(cuando)}</p>
      ${pv.length ? `<p>${hechas} de ${pv.length} peleas con resultado</p><div class="prog"><i style="width:${pv.length ? Math.round(hechas / pv.length * 100) : 0}%"></i></div>` : ""}
      <div class="acts2"><button type="button" class="btn pri" data-tab="envivo">Marcar resultados en vivo</button><button type="button" class="btn" data-tab="combates">Editar cartelera</button></div></div>
    <div class="quick">${sw("inicio.seminario.activo", "Seminario en Inicio", "Muestra u oculta la tarjeta del seminario")}${sw("cartelera.proximamente", "Pantalla «Muy pronto» en WFN", "Cuando aún no hay cartelera")}${sw("liga.ocultar_ediciones", "Ocultar ediciones anteriores", "En la sección WFN")}</div>
    <p class="lbl">Todas las secciones</p>
    <div class="tiles">${NAV.flatMap(n => n[1]).filter(id => id !== "resumen").map(id => `<button type="button" class="tile" style="--g:${CC(id)}" data-tab="${id}">${ico(id)}<b>${esc(SEC(id).tab)}</b><small>${esc(SEC(id).help || "")}</small></button>`).join("")}</div></div>`;
}

/* ---------------- resultados en vivo ---------------- */
let FILTRO = "todas";
const METODOS = ["KO", "TKO", "Sumisión", "Decisión unánime", "Decisión dividida", "Descalificación"];
function renderVivo() {
  const y = scrollY, pv = peleasVivo(), hechas = pv.filter(x => x.b.ganador).length;
  const nom = x => [x && x.nombre, x && x.apellido].filter(Boolean).join(" ") || "Sin nombre";
  const lista = pv.filter(x => FILTRO === "todas" || (FILTRO === "pend" ? !x.b.ganador : !!x.b.ganador));
  const est = g => ({ rojo: "Ganó esquina roja", azul: "Ganó esquina azul", empate: "Empate", nc: "Sin resultado (NC)" }[g] || "Pendiente");
  $("#form").innerHTML = `<div class="sec"><p class="eyeb">WFN Combat League</p><h2>Resultados en vivo</h2><p class="help">Toca el nombre del ganador, elige cómo ganó y presiona «Guardar cambios». La página lo muestra al recargarse.</p>
    <div class="lvtabs">${[["todas", "Todas (" + pv.length + ")"], ["pend", "Pendientes (" + (pv.length - hechas) + ")"], ["listas", "Con resultado (" + hechas + ")"]].map(([k, t]) => `<button type="button" data-filtro="${k}" class="${FILTRO === k ? "on" : ""}">${t}</button>`).join("")}</div>
    ${lista.map(({ p, b, tag }) => { const g = b.ganador || "";
      return `<div class="lv${g ? " done" : ""}"><div class="lv-h"><span>${esc(tag)}${b.div ? " · " + esc(b.div) : ""}</span><span class="st2">${est(g)}</span></div>
      <div class="lv-f"><button type="button" class="cn r${g === "rojo" ? " on" : g ? " off" : ""}" data-live="${p}" data-g="rojo"><small>Esquina roja</small>${esc(nom(b.rojo))}</button><span>VS</span><button type="button" class="cn b${g === "azul" ? " on" : g ? " off" : ""}" data-live="${p}" data-g="azul"><small>Esquina azul</small>${esc(nom(b.azul))}</button></div>
      <div class="lv-x"><button type="button" data-live="${p}" data-g="empate" class="${g === "empate" ? "on" : ""}">Empate</button><button type="button" data-live="${p}" data-g="nc" class="${g === "nc" ? "on" : ""}">NC</button>${g ? `<button type="button" data-live="${p}" data-g="">Borrar resultado</button>` : ""}</div>
      ${g === "rojo" || g === "azul" ? `<div class="lv-m"><div class="chips">${METODOS.map(m => `<button type="button" data-met="${p}" data-v="${esc(m)}" class="${String(b.metodo || "").toLowerCase() === m.toLowerCase() ? "on" : ""}">${m}</button>`).join("")}</div>
        <div class="g3"><label class="f">Cómo ganó (o escríbelo)<input type="text" data-p="${p}.metodo" value="${esc(b.metodo)}" placeholder="KO, TKO, SUB…"></label><label class="f">Round<input type="text" inputmode="numeric" data-p="${p}.round" value="${esc(b.round)}" placeholder="2"></label><label class="f">Tiempo<input type="text" inputmode="numeric" data-p="${p}.tiempo" value="${esc(b.tiempo)}" placeholder="2:15"></label></div></div>` : ""}</div>`; }).join("") || `<p class="help">No hay peleas en esta lista.</p>`}</div>`;
  scrollTo(0, y);
}

/* ---------------- buscador ---------------- */
const norm = t => String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function buscar(q) {
  const box = $("#qres"); q = norm(q.trim());
  if (q.length < 2) { box.innerHTML = ""; return; }
  const ws = q.split(/\s+/);
  const r = INDEX.filter(x => { const t = norm(x.l + " " + x.card + " " + SEC(x.sec).tab + " " + x.h); return ws.every(w => t.includes(w)); })
    .sort((a, b) => (norm(a.l).includes(q) ? 0 : 1) - (norm(b.l).includes(q) ? 0 : 1)).slice(0, 8);
  box.innerHTML = r.length ? r.map((x, i) => `<button type="button" data-res="${INDEX.indexOf(x)}"><b>${esc(x.l)}</b><small>${esc(SEC(x.sec).tab)}${x.card ? " › " + esc(x.card) : ""}</small></button>`).join("") : `<p>Sin resultados para «${esc(q)}».</p>`;
}
function abrirResultado(x) {
  OPEN.set("card:" + x.sec + ":" + x.ci, true);
  $("#q").value = ""; $("#qres").innerHTML = ""; irA(x.sec);
  setTimeout(() => {
    let el = x.p ? form.querySelector(`[data-p="${x.p}"],[data-img="${x.p}"],[data-color="${x.p}"],[data-days="${x.p}"],[data-video="${x.p}"],[data-l="${x.p}"]`) : null;
    el = el ? (el.closest(".f,.chk") || el) : $("#c-" + x.ci);
    if (!el) return; el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1700);
    const inp = el.matches("input,textarea,select") ? el : el.querySelector("input[type=text],textarea,select"); if (inp && matchMedia("(min-width:1024px)").matches) inp.focus({ preventScroll: true });
  }, 60);
}

/* ---------------- historial ---------------- */
async function renderHist() {
  $("#form").innerHTML = `<div class="sec"><p class="eyeb">Respaldo</p><h2>Historial</h2><p class="help">Cada vez que guardas, se respalda la versión anterior. Si te equivocas, carga una versión y luego presiona «Guardar cambios».</p><div class="hist" id="hist">Cargando…</div></div>`;
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

async function subirVideo(input) {
  const f = input.files[0]; if (!f) return;
  const p = input.dataset.video;
  if (f.size > 50 * 1024 * 1024) { status("El video pesa más de 50 MB. Usa uno más corto o de menor calidad.", "err"); return; }
  status("Subiendo video… (puede tardar)");
  try {
    const ext = (/\.(\w+)$/.exec(f.name) || [, "mp4"])[1].toLowerCase();
    const name = `${CFG.SITIO_ID}/video/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await sb.storage.from(CFG.BUCKET).upload(name, f, { contentType: f.type || "video/mp4", upsert: false, cacheControl: "31536000" });
    if (error) throw error;
    set(DRAFT, p, sb.storage.from(CFG.BUCKET).getPublicUrl(name).data.publicUrl);
    renderForm(); refreshBar(); toast("Video listo. Recuerda guardar los cambios.");
  } catch (e) { status("No se pudo subir el video: " + (e.message || e) + ". Revisa el límite de tamaño del bucket (ver README).", "err"); }
}
function pasarAlHistorial() {
  const c = DRAFT.cartelera || {}, nom = x => [x && x.nombre, x && x.apellido].filter(Boolean).join(" ");
  const m = c.main || {};
  const pel = (b, sec, tit) => ({ seccion: sec, rojo: nom(b.rojo), azul: nom(b.azul), rojo_record: (b.rojo || {}).record || "", azul_record: (b.azul || {}).record || "",
    rojo_foto: (b.rojo || {}).foto || "", azul_foto: (b.azul || {}).foto || "", div: b.div || "", titulo: tit || b.tipo || "", ganador: b.ganador || "", metodo: b.metodo || "", round: b.round || "", tiempo: b.tiempo || "" });
  const peleas = [pel(m, "principal", "Main event")].concat((c.peleas || []).map(b => pel(b, b.seccion === "preliminar" ? "preliminar" : "principal")));
  if (!DRAFT.liga) DRAFT.liga = {}; if (!DRAFT.liga.ediciones) DRAFT.liga.ediciones = [];
  DRAFT.liga.ediciones.unshift({ edicion: c.edicion || "", titulo: c.edicion ? "" : (c.evento || ""), fecha: c.dia || "", lugar: c.lugar || "", foto: "", peleas });
  renderForm(); refreshBar(); toast("Listo: se agregó al inicio de «Ediciones anteriores». Marca quién ganó y guarda.");
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
function refreshBarAfterSave() { $("#b-save").disabled = true; $("#bar").classList.remove("d"); marcarCambios(); }

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
form.addEventListener("change", e => { const t = e.target; if (t.dataset.video) subirVideo(t); else if (t.dataset.img) subir(t); else if (t.tagName === "SELECT" && t.dataset.p) { set(DRAFT, t.dataset.p, t.value); refreshBar(); } });
form.addEventListener("click", async e => {
  const c = e.target.closest("[data-clear]"); if (c) { set(DRAFT, c.dataset.clear, ""); renderForm(); refreshBar(); return; }
  if (e.target.closest("[data-tohist]")) { if (confirmar("¿Copiar la cartelera actual al historial?")) pasarAlHistorial(); return; }
  if (e.target.closest("[data-resettema]")) { if (!confirmar("¿Regresar a los colores originales?")) return; DRAFT.tema = { principal: "#ff1f1f", acento: "#c6f11a", fondo: "#050505", wfn_letras: "", wfn_sombra: "", wfn_fondo: "" }; renderForm(); refreshBar(); return; }
  const h = e.target.closest("[data-hist]");
  if (h) { const { data, error } = await sb.from("sitios_historial").select("contenido").eq("id", h.dataset.hist).single(); if (error) return toast("No se pudo cargar"); DRAFT = conDef(data.contenido); refreshBar(); marcarCambios(); toast("Versión cargada. Revísala y presiona «Guardar cambios»."); return; }
  const lv = e.target.closest("[data-live]");
  if (lv) { const p = lv.dataset.live, g = lv.dataset.g, cur = get(DRAFT, p + ".ganador") || ""; set(DRAFT, p + ".ganador", cur === g ? "" : g); if (!g || g === "empate" || g === "nc") { if (g !== "empate") { set(DRAFT, p + ".metodo", ""); set(DRAFT, p + ".round", ""); set(DRAFT, p + ".tiempo", ""); } } renderVivo(); refreshBar(); return; }
  const mt = e.target.closest("[data-met]"); if (mt) { set(DRAFT, mt.dataset.met + ".metodo", mt.dataset.v); renderVivo(); refreshBar(); return; }
  const fl = e.target.closest("[data-filtro]"); if (fl) { FILTRO = fl.dataset.filtro; renderVivo(); return; }
  const jp = e.target.closest("[data-jump]"); if (jp) { const d = $("#c-" + jp.dataset.jump); if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); } return; }
  const al = e.target.closest("[data-all]"); if (al) { const ds = [...form.querySelectorAll("details.card")], abrir = ds.some(d => !d.open); ds.forEach(d => d.open = abrir); al.textContent = abrir ? "Cerrar todo" : "Abrir todo"; return; }
  const o = e.target.closest("[data-op]"); if (!o) return;
  e.preventDefault();
  const p = o.dataset.l, arr = get(DRAFT, p) || [], i = +o.dataset.i;
  if (!get(DRAFT, p)) set(DRAFT, p, arr);
  if (o.dataset.op === "add") OPEN.set(p + "." + arr.length, true);
  if (o.dataset.op === "up" && i > 0) moverAbiertos(p + "." + i, p + "." + (i - 1));
  if (o.dataset.op === "down" && i < arr.length - 1) moverAbiertos(p + "." + i, p + "." + (i + 1));
  if (o.dataset.op === "add") arr.push(o.dataset.kind === "text" || o.dataset.kind === "img" ? "" : clone(NUEVO[p.replace(/\.\d+\./g, ".")] || NUEVO[p] || {}));
  else if (o.dataset.op === "del") { if (!confirmar("¿Quitar este elemento?")) return; arr.splice(i, 1); }
  else if (o.dataset.op === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
  else if (o.dataset.op === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
  renderForm(); refreshBar();
});
const confirmar = t => window.confirm(t);
document.addEventListener("click", e => {
  const b = e.target.closest("[data-tab]"); if (b && $("#v-panel").contains(b)) { irA(b.dataset.tab); return; }
  const r = e.target.closest("[data-res]"); if (r) { abrirResultado(INDEX[+r.dataset.res]); return; }
  if (e.target.closest("[data-more],#b-menu")) { document.body.classList.add("nav-open"); return; }
  if (e.target.closest("#b-find")) { document.body.classList.add("nav-open"); setTimeout(() => $("#q").focus(), 250); return; }
  if (e.target.closest("#scrim")) document.body.classList.remove("nav-open");
});
form.addEventListener("toggle", e => { const d = e.target; if (d.dataset && d.dataset.o) OPEN.set(d.dataset.o, d.open); }, true);
$("#q").addEventListener("input", e => buscar(e.target.value));
$("#q").addEventListener("keydown", e => { if (e.key === "Enter") { const f = $("#qres [data-res]"); if (f) f.click(); } if (e.key === "Escape") { e.target.value = ""; buscar(""); } });
$("#b-undo").addEventListener("click", () => { if (!confirmar("¿Descartar todos los cambios que no has guardado?")) return; DRAFT = clone(SAVED); renderForm(); refreshBar(); toast("Cambios descartados."); });
addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && DRAFT) { e.preventDefault(); if (dirty()) guardar(); } if (e.key === "Escape") document.body.classList.remove("nav-open"); });
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
  SAVED = conDef(data.contenido); DRAFT = clone(SAVED);
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
