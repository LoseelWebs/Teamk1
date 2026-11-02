/* =========================================================
   CONFIGURACIÓN DE SUPABASE
   1. En Supabase abre: Project Settings → API (o "Data API").
   2. Copia "Project URL" en SUPABASE_URL.
   3. Copia la llave "anon" / "publishable" en SUPABASE_ANON_KEY.
   Esta llave es pública a propósito: la seguridad la dan las
   reglas (RLS) del archivo supabase.sql. NUNCA pongas aquí la
   llave "service_role" / "secret".
   ========================================================= */
window.SITIO_CONFIG = {
  SUPABASE_URL: "https://sqedtgudguiscucszuff.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_oQei0eNAA46NCvD66IZdiw_VE4_7gYu",
  SITIO_ID: "team-k1",          // id de la fila en la tabla "sitios"
  BUCKET: "fotos"               // bucket de Storage para las fotos
};
