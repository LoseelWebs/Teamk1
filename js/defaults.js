/* =========================================================
   Valores iniciales de las secciones nuevas.
   Se usan mientras el dueño no los cambie desde el panel.
   Los usan la página (sitio.js) y el panel (panel.js).
   ========================================================= */
window.SITIO_DEF = {
  inicio: {
    foto_fondo: "img/fondo-academia.jpg", foto_fondo_cel: "img/fondo-academia-cel.jpg", destacados: [], publicaciones: [],
    seminario: { activo: false, etiqueta: "Seminario", titulo: "", fecha: "", texto: "", foto: "", boton: "Quiero inscribirme" },
    disciplinas_eyebrow: "Qué entrenamos", disciplinas_titulo: "Cuatro disciplinas, un mismo equipo",
    bloque: { eyebrow: "La academia", titulo: "Entrena con peleadores que compiten",
      texto: "Clases de Kickboxing, K-1, Muay Thai y MMA para niños, novatos y avanzados. Empiezas desde cero y avanzas a tu ritmo, con coaches que suben al ring y preparan a sus alumnos para torneos.",
      foto: "", boton: "Ver horarios",
      datos: [{ cifra: "4", texto: "disciplinas de contacto" }, { cifra: "6+", texto: "años para empezar a entrenar" }, { cifra: "5", texto: "días de clase a la semana" }] },
    banner_wfn: { etiqueta: "Warrior Fight Night", titulo: "WFN Combat League", texto: "Cartelera, resultados e historial de la liga", foto: "" },
    cta: { titulo: "Tu primera clase empieza con un mensaje", texto: "Escríbenos por WhatsApp y te decimos qué grupo te queda mejor.", foto: "" }
  },
  contacto: { facebook_wfn: "https://www.facebook.com/people/WFN/61566772024184/", },
  nosotros: { video: "", video_poster: "" },
  horarios: { leyenda: "Sábados y domingos no hay clases." },
  cartelera: { boletos: "", boletos_texto: "", info_extra: "", enlace_boletos: "", mapa_evento: "" },
  liga: { patrocinadores_titulo: "Patrocinadores", patrocinadores: [], ediciones: [],
    acerca: { titulo: "La liga",
      texto: "WFN Combat League es una liga dedicada a promover las artes marciales de contacto completo: MMA, Muay Thai y Kickboxing. Su meta es convertirse en la plataforma de referencia del norte de Veracruz y abrir un espacio deportivo para los peleadores de la región.",
      datos: [{ cifra: "18", texto: "ediciones" }, { cifra: "3", texto: "disciplinas: MMA, Muay Thai y Kickboxing" }],
      sede: "Melchor Ocampo 6, Benito Juárez, Poza Rica", telefono: "782 828 0510" } }
};
