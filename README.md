# Team K-1 Academy · Página + Panel de administración

Página promocional de **Academia Team K-1** (Poza Rica, Ver.) en <https://academiateamk1.com.mx>, publicada con **Cloudflare** desde este repositorio.
Todo el contenido (textos, precios, horarios, teléfonos, coaches, fotos y combates WFN) se guarda en **Supabase** y el dueño lo edita desde **`panel.html`**.

```
index.html      → la página pública (estructura, datos para Google y contenido de respaldo)
panel.html      → panel del administrador (iniciar sesión y editar)
css/sitio.css   → todos los estilos de la página
js/config.js    → URL y llave pública de Supabase
js/defaults.js  → textos iniciales de las secciones nuevas (los usan página y panel)
js/sitio.js     → dibuja la página con el contenido de Supabase
js/anim.js      → animaciones (scroll suave Lenis, cortina, títulos, cursor, encabezado)
js/panel.js     → formularios del panel, subida de fotos y guardado
img/            → logos, íconos y fotos fijas
docs/           → redirección de la dirección vieja de GitHub Pages al dominio nuevo
robots.txt, sitemap.xml → para Google
.github/workflows/mantener-supabase-activo.yml → evita que Supabase se pause
.assetsignore   → archivos que Cloudflare NO publica (README, docs, .github, .actividad)
```

Las letras (Anton, Manrope, Barlow Condensed) se cargan de Google Fonts.

## Supabase
- Tablas: `sitios` (contenido de la página, fila `team-k1`), `admins` (quién puede editar) y `sitios_historial` (versiones anteriores).
- Reglas (RLS): cualquiera puede leer; solo un usuario en `admins` puede guardar.
- Bucket público `fotos` para fotos y video.
- La llave de `js/config.js` es la *publishable/anon* y es pública a propósito. **Nunca** pongas ahí la llave `service_role` / `secret`.

Para permitir videos de hasta 50 MB en Nosotros, corre una vez en **SQL Editor**:
```sql
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
where id = 'fotos';
```

## Que Supabase no se suspenda (plan gratis)
Supabase pausa los proyectos gratis que pasan una semana sin actividad. La tarea de GitHub **Mantener Supabase activo** consulta la base cada 3 días (usa los secretos `SUPABASE_URL` y `SUPABASE_ANON_KEY` del repositorio) y los primeros días de cada mes actualiza `.actividad`, para que GitHub no apague la tarea por inactividad.
Si algún día se pausa: entra a Supabase y presiona **Restore project**. Mientras tanto, la página se ve con la última copia guardada en el navegador de cada visitante o con el contenido de respaldo del `index.html`.

## Cómo edita el dueño
1. Abre `academiateamk1.com.mx/panel.html` e inicia sesión.
2. Elige la sección en el menú (en celular, la barra de abajo y «Más»): Resumen, Resultados en vivo, Negocio y contacto, Inicio, Clases, Horarios y precio, Equipo, Nosotros, Competencias, Combates WFN, Liga WFN, Pie de página, Colores e Historial.
3. Cambia lo que necesites. En las listas puedes agregar, quitar y ordenar (↑ ↓). El buscador encuentra cualquier campo.
4. Presiona **Guardar** (o Ctrl+S). La página muestra los cambios al recargarse. «Descartar» regresa a lo último guardado.
5. Si te equivocas: **Historial** → «Cargar esta versión» → **Guardar**.

### Notas
- Las fotos se reducen solas antes de subirse (WebP, máx. 1600 px). Las de peleadores conviene subirlas sin fondo (PNG).
- La tarjeta «Hoy» de Inicio y la tabla de horarios se calculan con **Horarios y precio**.
- **Combates WFN**: con las dos imágenes del «cartel cara a cara» el main event usa ese diseño; si no, usa el de letras con las fotos de cada peleador. El récord, el origen y el resultado (ganador, cómo ganó, round y tiempo) se muestran en los dos diseños.
- **Resultados en vivo**: marca el ganador de cada pelea desde el celular durante la función y guarda.
- **Liga WFN** → «Pasar Combates WFN al historial» copia la cartelera como edición nueva de «Ediciones anteriores».
- **Video de Nosotros**: se pone en blanco y negro solo.

## Agregar más clientes con el mismo Supabase
1. Inserta otra fila en `sitios` con otro `id` (ej. `'barberia-x'`) y su contenido.
2. Crea su usuario y agrégalo a `admins` con ese `sitio_id`.
3. En el `js/config.js` de esa página pon `SITIO_ID: "barberia-x"`.
