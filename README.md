# Team K-1 Academy · Página + Panel de administración

Página promocional de **Academia Team K-1** (Poza Rica, Ver.) publicada con **GitHub Pages**.
Todo el contenido (textos, precios, horarios, teléfonos, coaches, fotos y combates WFN) se guarda en **Supabase** y el dueño lo edita desde **`panel.html`**.

```
index.html                 → la página pública (estructura y datos para Google)
css/sitio.css              → todos los estilos de la página
panel.html                 → panel del administrador (iniciar sesión y editar)
js/config.js               → ⚠️ aquí van la URL y la llave pública de Supabase
js/defaults.js             → textos iniciales de las secciones nuevas (los usan página y panel)
js/sitio.js                → dibuja la página con el contenido de Supabase
js/panel.js                → formularios del panel, subida de fotos y guardado
supabase.sql               → crea tablas, seguridad, bucket de fotos y contenido inicial
contenido-inicial.json     → copia del contenido aprobado (respaldo)
img/                       → logos y fotos fijas
.github/workflows/mantener-supabase-activo.yml → evita que Supabase se pause
```

---

## 1. Crear el proyecto en Supabase
1. Entra a <https://supabase.com> → **New project**. Elige una contraseña para la base y la región más cercana (por ejemplo *East US*).
2. Cuando termine de crearse, abre **SQL Editor → New query**, pega **todo** el archivo `supabase.sql` y presiona **Run**.
   Esto crea:
   - `sitios` (el contenido de la página), `admins` (quién puede editar) y `sitios_historial` (respaldo automático de las últimas 30 versiones).
   - Las reglas de seguridad: **cualquiera puede leer, solo el administrador puede guardar**.
   - El bucket público `fotos` (máx. 5 MB por foto; solo el administrador puede subir o borrar).
   - El contenido inicial de Team K-1.

## 2. Crear la cuenta del dueño
1. **Authentication → Users → Add user → Create new user**: escribe el correo y una contraseña del dueño y marca **Auto Confirm User**.
2. En **SQL Editor** corre (cambiando el correo):
   ```sql
   insert into public.admins (user_id, sitio_id)
   select id, 'team-k1' from auth.users where email = 'correo-del-dueno@ejemplo.com';
   ```
3. **Authentication → Sign In / Providers** → desactiva **Allow new users to sign up** (así nadie más puede crear cuentas).
4. **Authentication → URL Configuration**:
   - *Site URL*: `https://TU-USUARIO.github.io/TU-REPO/`
   - *Redirect URLs*: agrega `https://TU-USUARIO.github.io/TU-REPO/panel.html` (para el botón «Olvidé mi contraseña»).

## 3. Conectar la página con Supabase
En Supabase abre **Project Settings → API** (o *Data API* / *API Keys*) y copia:
- **Project URL** → `SUPABASE_URL` en `js/config.js`
- **anon / publishable key** → `SUPABASE_ANON_KEY` en `js/config.js`

> La llave *anon* es pública a propósito: la seguridad la dan las reglas del paso 1.
> **Nunca** pongas en el código la llave `service_role` / `secret`.

## 4. Publicar en GitHub Pages
1. Crea un repositorio en GitHub y sube **todos** estos archivos (incluida la carpeta `.github`).
2. **Settings → Pages** → *Build and deployment*: **Deploy from a branch** → rama `main`, carpeta `/ (root)` → **Save**.
3. En uno o dos minutos la página queda en `https://TU-USUARIO.github.io/TU-REPO/` y el panel en `…/panel.html`.

## 5. Que Supabase no se suspenda (plan gratis)
Supabase pausa los proyectos gratuitos que pasan **una semana sin actividad**. Ya viene incluida una tarea automática de GitHub que lo evita:

1. En el repositorio: **Settings → Secrets and variables → Actions → New repository secret** y crea dos:
   - `SUPABASE_URL` → la misma URL del paso 3
   - `SUPABASE_ANON_KEY` → la misma llave anon del paso 3
2. Ve a la pestaña **Actions** → si te lo pide, presiona **I understand my workflows, go ahead and enable them**.
3. Abre **Mantener Supabase activo → Run workflow** una vez para probar (debe salir con palomita verde ✅).

Qué hace: consulta la base **cada 3 días** y, el día 1 de cada mes, guarda un archivo `.actividad` en el repositorio. Esto último es porque GitHub apaga las tareas programadas de repositorios públicos que pasan 60 días sin cambios.
Además, cada visita a la página también cuenta como actividad.

Si algún día se pausa de todos modos: entra a Supabase y presiona **Restore project**. Mientras tanto la página se sigue viendo con la última copia guardada en el navegador de cada visitante o con el contenido de respaldo que trae el `index.html`.

## 6. Cómo edita el dueño
1. Abre `…/panel.html` e inicia sesión.
2. Elige la sección en las pestañas de arriba: *Negocio y contacto, Inicio, Clases, Horarios y precio, Equipo, Nosotros, Competencias, Combates WFN, Historial y patrocinadores, Pie de página, Colores*.
3. Cambia lo que necesite. En las listas puede **agregar**, **quitar** (✕) y **ordenar** (↑ ↓).
4. Presiona **Guardar cambios**. La página se actualiza al instante.
5. Si se equivoca: pestaña **Historial** → **Cargar esta versión** → **Guardar cambios**.

### Fotos
- Se reducen de tamaño automáticamente antes de subirse (WebP, máx. 1600 px).
- **Peleadores (main event):** subir la foto **sin fondo (PNG)**. La página les aplica sola un filtro dorado, un borde de luz y un desvanecido en la parte de abajo para que no se vea el corte.
  - En iPhone: abre la foto, mantén presionado sobre la persona → **Copiar** o **Compartir** (iOS quita el fondo).
  - En Android/PC: <https://www.remove.bg> o la opción «Quitar fondo» de la galería.
- Los horarios de la tabla y la tarjeta «Hoy» de Inicio se calculan con las horas y días de **Horarios y precio**.

### Secciones nuevas
- **Fotos de portada** (Inicio): agrega varias; cambian solas cada 6 segundos y en PC se numeran (01, 02…) junto a las redes. Cada una lleva su versión vertical opcional para celular.
- **Seminario o evento** (Inicio): se prende y apaga con la casilla «Mostrar en Inicio».
- **Novedades de Facebook**: en *Negocio y contacto* pega la dirección de la página de Facebook de Team K-1 y la de WFN (ej. `https://www.facebook.com/nombre-de-la-pagina`). Las publicaciones se muestran solas; la página de Facebook debe ser pública.
- **Combates WFN**: marca «Es el co-estelar» en la pelea que va destacada debajo del main event. También hay campos para boletos y la sede.
- **Liga WFN**: texto del botón «La liga» (tomado del Facebook de WFN), resultados y patrocinadores.
- **Historial**: el botón «Pasar Combates WFN al historial» copia la cartelera como edición nueva; después solo marcas quién ganó en cada pelea.
- **Video de Nosotros**: se pone en blanco y negro solo. Con la configuración original el bucket acepta archivos de hasta 5 MB y solo imágenes. Para permitir videos de hasta 50 MB corre esto una vez en **SQL Editor**:
  ```sql
  update storage.buckets
  set file_size_limit = 52428800,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
  where id = 'fotos';
  ```
  Otra opción: sube el video a la carpeta `img/` del repositorio y escribe `img/nombre.mp4` en el campo del enlace.

## 7. Agregar más clientes con el mismo Supabase
Un solo proyecto de Supabase puede guardar varias páginas:
1. Inserta otra fila en `sitios` con otro `id` (ej. `'barberia-x'`) y su contenido.
2. Crea su usuario y agrégalo a `admins` con ese `sitio_id`.
3. En el `js/config.js` de esa página pon `SITIO_ID: "barberia-x"`.
Cada dueño solo puede editar su propia página (las reglas lo impiden a nivel servidor).

## Límites del plan gratis de Supabase (consúltalos en supabase.com/pricing)
500 MB de base de datos, 1 GB de fotos, 5 GB de transferencia al mes, 2 proyectos gratis, pausa tras 1 semana sin actividad.
