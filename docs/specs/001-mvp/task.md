# Tareas — Spec 001 (MVP: inicio de sesión, bienvenida y cierre de sesión)

Desglose de la implementación de `docs/specs/001-mvp/plan.md` en tareas pequeñas y
ordenadas por dependencia. Cada tarea está pensada para completarse en 10 a 20 minutos.

**Convenciones**

- `[ ]` pendiente · `[x]` completada
- La columna **RF** indica los requisitos funcionales de la spec que cubre la tarea.
- La columna **Depende de** indica las tareas que deben estar terminadas antes.
- Las tareas sin RF propio se anotan como `—` (andamiaje, estilo, verificación).

**Estado actual:** la spec 001-mvp está completa. Las 34 tareas (T-01 a T-34) están cerradas, los siete bloques terminados, los 14 criterios de finalización, los ocho casos límite y los siete puntos de la constitución auditados y en verde, y `lint`, `typecheck`, `dev` y el build de producción pasan sin errores.

---

## Bloque 0 · Andamiaje y herramientas

### T-01 · Crear `package.json` con los scripts y las dependencias base
- [x] Declarar `astro@^7.4.2`, `@astrojs/node@^11.1.9`, `typescript@^7.0.2`, `eslint@^9.39.5` y `neostandard@^0.14.1`.
- [x] Declarar los scripts `dev` (`astro dev`) y `lint` (`eslint .`).
- [x] Marcar el proyecto como privado y con `"type": "module"`.
- **RF:** — (constitución 1, `Agents.md`)
- **Depende de:** —

### T-02 · Instalar las dependencias resolviendo el conflicto con TypeScript 7
- [x] Ejecutar la instalación y comprobar si `npm` falla por el par de `typescript-eslint` (admite `typescript >=4.8.4 <6.1.0`).
- [x] `npm` no falla al instalar, pero el anidamiento automático no basta: en T-05 hubo que añadir `overrides` para `ts-api-utils` (ver T-05).
- [x] Comprobar que `npx eslint --version` responde y que `npx tsc --version` marca la 7.
- [x] **Dejar constancia en la documentación del proyecto de la resolución aplicada** → `plan.md` §2, decisión D-16.
- **RF:** — (constitución 1)
- **Depende de:** T-01

### T-03 · Configurar `astro.config.mjs` con renderizado en el servidor
- [x] Establecer `output: 'server'`.
- [x] Registrar el adaptador de Node con `mode: 'standalone'`.
- [x] Confirmar que `npm run dev` arranca sin errores.
- **RF:** RF-1, RF-3 (D-01)
- **Depende de:** T-02

### T-04 · Configurar `tsconfig.json`
- [x] Extender `astro/tsconfigs/strict`.
- [x] Activar `strictNullChecks` y `noUncheckedIndexedAccess`.
- [x] Incluir `src/**/*` y `scripts/**/*`.
- [x] Añadir `@types/node`: sin él `tsc` no reconoce `node:crypto` y el `include` de `scripts/**/*` no compila.
- [x] Mantener `.astro/types.d.ts` en el `include`: al sobrescribirlo se perdían los tipos generados por Astro.
- [x] Corregir `src/lib/hashing.ts`, que `noUncheckedIndexedAccess` destapó: la desestructuración devolvía `string | undefined`.
- **RF:** — (constitución 8)
- **Depende de:** T-03

### T-05 · Configurar `eslint.config.js` con neostandard
- [x] Usar el formato de configuración plana de ESLint 9.
- [x] Aplicar `neostandard` y `typescript-eslint` sobre los archivos `.ts` y `.astro`, con `eslint-plugin-astro@1.7.0` y el procesador `client-side-ts`.
- [x] Desactivar las reglas que necesitan información de tipos, incompatibles con el emparejamiento real de TypeScript 7 → verificado: ninguna de las 188 reglas activadas las exige y `parserOptions.project` queda en `null`.
- [x] Añadir la exclusión de los archivos generados (`.astro/`, `dist/`, `node_modules/`) con `globalIgnores`.
- [x] Añadir `overrides` en `package.json` para `ts-api-utils`: sin él el linter no arranca (ver D-16).
- [x] Aplicar el estilo de neostandard al código existente: exige espacio antes del paréntesis en funciones nombradas.
- **RF:** — (NFR-5)
- **Depende de:** T-02

### T-06 · Configurar la comprobación de tipos con `tsc --noEmit`
- [x] Añadir el script `typecheck` con `tsc --noEmit`.
- [x] **No usar `astro check`**: `@astrojs/check@0.9.12` exige `typescript ^5 || ^6` y no admite la versión 7.
- [x] Ejecutar `npm run typecheck` sobre el proyecto vacío y confirmar que no hay errores.
- [x] Verificar que detecta errores de verdad: un `.ts` con `const x: number = 'texto'` produce `TS2322` y código de salida 1.
- [x] **Limitación conocida:** `tsc` no entiende la extensión `.astro`, así que el frontmatter y los `<script>` de las páginas quedan fuera de la comprobación de tipos. Es la contrapartida de descartar `astro check`. El linter sí los analiza.
- **RF:** — (NFR-5)
- **Depende de:** T-04

### T-07 · Verificar el arranque y el linter
- [x] `npm run dev` levanta el servidor sin errores: arranca en 911 ms y responde por HTTP. **Queda un aviso**, `Missing pages directory: src/pages`, esperado hasta que T-22 y T-23 creen las páginas.
- [x] `npm run lint` termina sin errores.
- [x] `npm run typecheck` termina sin errores.
- **RF:** — (NFR-5)
- **Depende de:** T-05, T-06

---

## Bloque 1 · Datos y lógica de servidor

### T-08 · Crear la capa de datos `src/data/userRepository.ts`
- [x] Declarar las interfaces `UsuarioAlmacenado` y `AlmacenUsuarios`.
- [x] Implementar la lectura de `src/data/storage.json`. Se importa el JSON, no se lee con `node:fs`: el `new URL('./storage.json', import.meta.url)` deja `ENOENT` en el servidor compilado porque el archivo no se copia a `dist/` (comprobado con build real y HTTP 500).
- [x] Implementar `buscarPorNombreUsuario` que devuelve **como máximo un** usuario. Coincidencia exacta, sensible a mayúsculas y sin recortar espacios: normalizar es responsabilidad de quien llama (RF-10).
- [x] Comprobar que ningún otro módulo lee el archivo de almacenamiento. `scripts/generarHashes.ts` solo lo escribe.
- **RF:** RF-11, NFR-4 (D-07)
- **Depende de:** T-07

### T-09 · Crear `src/lib/credenciales.ts`
- [x] Implementar `normalizarCredencial` (recorta solo los extremos). Usa `trim()`, que también descarta tabuladores, saltos de línea y el espacio duro U+00A0, y conserva el interior.
- [x] Implementar `compararCredenciales` sensible a mayúsculas.
- [x] No aplicar `toLowerCase` ni `toUpperCase` en ningún punto. El módulo no importa nada, así que sirve igual en cliente y en servidor.
- **RF:** RF-10
- **Depende de:** T-07

### T-10 · Hash, semilla de datos y almacén
- [x] `src/lib/hashing.ts` con `generarHash` y `verificarContrasena` (`scrypt` + `timingSafeEqual`).
- [x] `scripts/generarHashes.ts` que recibe las contraseñas como argumentos.
- [x] `src/data/storage.json` con los dos usuarios y sus hash reales.
- [x] Verificación cruzada: contraseña correcta acepta, incorrecta y con espacios rechaza.
- **RF:** NFR-4 (D-05, D-06, D-15)
- **Depende de:** —

### T-11 · Crear el punto de acceso `src/pages/api/sesion.ts`
- [x] Implementar el manejador `POST` con los tipos `CredencialesRecibidas` y `RespuestaSesion`. El cuerpo se valida en tiempo de ejecución: un JSON inválido o con campos que no sean cadenas devuelve 400 en vez de provocar un 500.
- [x] Devolver 400 si algún campo está vacío o formado solo por espacios.
- [x] Devolver 401 si el usuario no existe o la contraseña no coincide.
- [x] Devolver 200 con `{ exito: true, nombreUsuario }` si todo es correcto.
- [x] Usar **el mismo mensaje** en los tres casos de fallo: «Usuario o contraseña incorrectos».
- [x] No incluir nunca el hash ni el `id` interno en la respuesta. Se normalizan nombre de usuario **y** contraseña antes de comparar (RF-10, D-19).
- **RF:** RF-1, RF-3, RF-10 (D-04)
- **Depende de:** T-08, T-09, T-10

### T-12 · Comprobar el punto de acceso con peticiones reales
- [x] Credenciales válidas → 200 con el nombre de usuario.
- [x] Usuario inexistente → 401 con el mensaje genérico.
- [x] Contraseña incorrecta → 401 con **el mismo** mensaje.
- [x] Campo vacío → 400 con el mismo mensaje.
- [x] La respuesta no contiene ningún hash. 15 peticiones contra el servidor compilado: los fallos comparten cuerpo byte a byte, ninguna respuesta contiene `scrypt` ni `usr-00` y el log del servidor no registra hash ni contraseña.
- **RF:** RF-3, NFR-4
- **Depende de:** T-11

---

## Bloque 2 · Estilos base

### T-13 · Crear `src/styles/theme.css` con las variables
- [x] Definir las 13 variables de color de la paleta (azul `#1B4DD1` + naranja `#F26A1B`).
- [x] Definir los anchos fijos, radios, sombras, espaciados, tipografía y transiciones. 28 declaraciones en total.
- [x] No usar negro, blanco ni gris neutro puros. Comprobado por código: ningún color tiene `r = g = b`, y las sombras derivan del azul `27, 77, 209`.
- **RF:** NFR-2, NFR-3 (D-11, D-13)
- **Depende de:** T-07

### T-14 · Añadir los componentes de estilo al tema
- [x] `.contenedor` con ancho fijo y centrado.
- [x] `.tarjeta` con superficie, borde, radio y sombra.
- [x] `.campo`, `.campo-error` y `.mensaje-error`.
- [x] `.boton-primario`, `.boton-acento` y `.boton-neutro`.
- [x] `.modal-capa`, `.modal` y `.modal-acciones`.
- [x] `.titulo-pagina` y `.saludo`.
- [x] Anillo de foco con `--color-foco` en todos los elementos interactivos: una regla `:focus-visible` global, sin enumerar selectores.
- [x] `role="alert"` y `aria-live="polite"` en los mensajes de error. **No se puede cumplir en CSS**: son atributos del marcado. Los tres mensajes del login los llevan desde T-23. El diálogo no tiene mensajes de error; sus atributos propios (`role="dialog"`, `aria-modal="true"` y `aria-labelledby`) se añadieron con su marcado en T-26. Aquí solo se prepara la caja `.mensaje-error`.
- **RF:** NFR-2, RF-2, RF-3, RF-6
- **Depende de:** T-13

### T-15 · Crear `src/layouts/BaseLayout.astro`
- [x] Documento base con `lang="es"` y el `title` de la página. El título llega por la prop `titulo`.
- [x] Importar `src/styles/theme.css`. El build lo sirve incrustado, con las 28 variables.
- [x] Incluir `<ClientRouter />` de `astro:transitions` en el `head`. Comprobado: genera el script del router y las metas de transición.
- [x] Exponer la ranura `<slot />` y un contenedor de ancho fijo. El ancho lo aporta `.contenedor`, ya definida en T-14.
- **RF:** RF-1, RF-7 (D-02)
- **Depende de:** T-14

---

## Bloque 3 · Módulos de cliente

### T-16 · Crear `src/scripts/session.ts`
- [x] Variable de módulo `usuarioActual` inicialmente nula.
- [x] `iniciarSesion`, `cerrarSesion` y `obtenerUsuarioActual`. `usuarioActual` no se exporta: solo se cambia por funciones.
- [x] No usar `localStorage`, `sessionStorage` ni cookies. Comprobado con espías que lanzan excepción si el módulo toca cualquier almacén del navegador.
- **RF:** RF-1, RF-4, RF-6, RF-7, RF-9 (D-03)
- **Depende de:** T-07

### T-17 · Crear `src/scripts/navegacion.ts`
- [x] `navegarA(ruta)` sobre `navigate` de `astro:transitions/client`. Devuelve la promesa del router en vez de tragársela.
- [x] `protegerPagina(rutaPermitidaSinSesion)`: si no hay usuario, navega y devuelve `false`. Compara con `null`, no por falsedad.
- [x] No usar `window.location`, que provocaría una recarga completa.
- **RF:** RF-4, RF-7, RF-9
- **Depende de:** T-16

### T-18 · Crear `src/scripts/validacionCredenciales.ts`
- [x] `validarCamposObligatorios` devuelve un mapa de errores por campo. No muta el objeto recibido.
- [x] Considera vacío un valor formado solo por espacios. Reutiliza `normalizarCredencial`, así que un tabulador o un espacio duro tampoco cuentan como contenido.
- [x] Mensaje exacto: "Este campo es obligatorio", exportado como `MENSAJE_CAMPO_OBLIGATORIO`.
- [x] La lógica vive aquí y **no** dentro del componente `.astro`.
- **RF:** RF-2, HU-5 (D-08)
- **Depende de:** T-07

### T-19 · Crear `src/scripts/login.ts`
- [x] `preventDefault` en el envío.
- [x] Validar los campos antes de contactar con el servidor.
- [x] Mostrar el error de campo **junto a su campo** y no enviar nada. El error se asocia por el atributo `name` del control y se pinta dentro del `.campo` que lo contiene.
- [x] Enviar `POST /api/sesion` con el nombre de usuario normalizado.
- [x] Con 200: `iniciarSesion` y `navegarA('/bienvenida')`. Verificado en Chrome contra el servidor real: la sesión sobrevive a la navegación de cliente.
- [x] Con 401: mostrar "Usuario o contraseña incorrectos" y rehabilitar el botón.
- [x] Deshabilitar el botón al enviar y mantener una bandera `envioRealizado`. Se reinicia al vincular un formulario nuevo, para que volver al login tras cerrar sesión no deje el formulario bloqueado.
- Se expone `inicializarLogin()`, idempotente por formulario, como punto de entrada para T-21.
- **RF:** RF-1, RF-2, RF-3, RF-10, RF-12
- **Depende de:** T-17, T-18

### T-20 · Crear `src/scripts/bienvenida.ts`
- [x] `protegerPagina('/login')` al cargar: sin usuario, redirige. La comprobación de que la pantalla está montada va **antes** de proteger, para no pedir una navegación desde una página que no la necesita.
- [x] Pintar el saludo con `textContent` y nunca con `innerHTML`. Verificado con un nombre de usuario que contiene marcado: se muestra literal y el elemento no gana hijos.
- [x] Botón de cierre de sesión → abrir el diálogo de confirmación.
- [x] Confirmar → `cerrarSesion` y navegar a `/login`.
- [x] Cancelar → cerrar el diálogo y conservar la sesión.
- [x] Cerrar el diálogo con `Escape` y al pulsar fuera. Pulsar dentro del cuadro no lo cierra.
- Se expone `inicializarBienvenida()`, idempotente por capa de modal, como punto de entrada para T-21.
- Extra: el foco entra en «Cancelar» al abrir y vuelve al disparador al cerrar.
- **RF:** RF-4, RF-5, RF-6, RF-7, RF-13 (D-09, D-10)
- **Depende de:** T-17

### T-21 · Registrar los scripts de página en `astro:page-load`
- [x] Envolver la inicialización de `login.ts` y `bienvenida.ts` en el evento `astro:page-load`. Se engancha dentro de cada módulo, para que la página solo tenga que importarlo.
- [x] Ejecutar también la inicialización en la primera carga. El router dispara `astro:page-load` sobre el evento `load` del `window`, después de ejecutar los scripts.
- [x] **Motivo:** con `<ClientRouter />` los scripts empaquetados solo se ejecutan una vez; sin esto, el script de la bienvenida nunca se ejecutaría al llegar con navegación de cliente. Verificado: llegar a `/bienvenida` por navegación de cliente pinta el saludo.
- [x] Comprobar que no se registran listeners duplicados. Se despachó un segundo `astro:page-load` sobre el mismo DOM y el botón no se rehabilitó: la inicialización se detuvo en su guarda por identidad de elemento.
- [x] RF-9: con sesión iniciada, abrir la pantalla de acceso redirige a la bienvenida.
- **RF:** RF-1, RF-4, RF-7, RF-9
- **Depende de:** T-19, T-20

---

## Bloque 4 · Pantalla de inicio de sesión

### T-22 · Crear `src/pages/index.astro`
- [x] Redirección permanente a `/login`. 301 desde el servidor, sin HTML intermedio.
- [x] Verificar que `/` lleva a `/login`: comprobado en desarrollo y en el servidor de producción del adaptador Node (`301 Moved Permanently`, `location: /login`).
- **RF:** —
- **Depende de:** T-15

### T-23 · Crear `src/pages/login.astro`
- [x] Título "Iniciar sesión".
- [x] Campo de nombre de usuario con su etiqueta.
- [x] Campo de contraseña con `type="password"` y su etiqueta.
- [x] Botón de envío "Iniciar sesión".
- [x] Contenedores de mensaje de error por campo y de mensaje general, **ocultos** al principio.
- [x] Antes del primer intento no se muestra ningún otro contenido. El texto visible es exactamente: título, dos etiquetas y botón.
- [x] Importar `login.ts` y el módulo de sesión. Solo se importa `login.ts`, desde un `<script>`: ya importa el módulo de sesión y el redireccionamiento de RF-9 vive ahí. En el frontmatter no valdría, porque se ejecuta en el servidor.
- [x] `role="alert"` y `aria-live="polite"` en los tres mensajes de error (parte de T-14 que dependía de este marcado).
- Se omite `required` a propósito: la validación nativa del navegador se adelantaría y taparía los mensajes junto al campo que pide RF-2.
- **RF:** RF-8, RF-14
- **Depende de:** T-19, T-21

### T-24 · Aplicar los estilos de la pantalla de inicio de sesión
- [x] Tarjeta de `440px` centrada vertical y horizontalmente. El centrado vertical se añade a `.contenedor` en el tema, que el plan (8.3) ya define como "ancho fijo y centrado" y del que T-14 solo había hecho la mitad horizontal.
- [x] Colores de la paleta: primario en el botón y el título, acento en el foco. Medidos en el navegador: `#1B4DD1` en ambos y `#F26A1B` en borde y contorno de foco.
- [x] Comprobar que no hay ninguna consulta de medios: ni en `src/` ni en el CSS construido.
- **RF:** NFR-2, NFR-3
- **Depende de:** T-23

### T-25 · Comprobar el flujo de inicio de sesión en el navegador
- [x] Credenciales válidas → llega a la bienvenida con el nombre correcto. El servidor responde `200 {"exito":true,"nombreUsuario":"ana"}` y el navegador termina en `/bienvenida`. El nombre guardado en sesión se leyó con el documento todavía en el login (navegación detenida): `"ana"` y, con la otra cuenta, `"bruno"`. La parte visual es de T-27 y T-29: `/bienvenida` aún no existía. **Cerrado en T-27**: la ruta ya existe, el router la alcanza sin recargar el documento y el saludo muestra el nombre de cada cuenta.
- [x] Credenciales incorrectas → mensaje genérico y sigue en el login. Probado con contraseña errónea y con usuario inexistente: las dos veces el mismo texto, «Usuario o contraseña incorrectos», `401` en ambas y la pantalla sigue en `/login` (RF-3).
- [x] Campos vacíos → mensajes junto a los campos, sin petición al servidor. **Cero** peticiones a `/api/sesion` (RF-2).
- [x] Doble clic o Enter repetido → una sola petición. Con la petición detenida se probaron dos clics y dos `submit`: el total siguió en una (RF-12).
- [x] Botón deshabilitado mientras dura la petición. Comprobado con la petición pausada, no después de terminar (RF-12).
- Se verificó además, de paso, que una recarga deja la sesión en `null` (RF-7).
- **RF:** RF-1, RF-2, RF-3, RF-12
- **Depende de:** T-24

---

## Bloque 5 · Pantalla de bienvenida

### T-26 · Crear `src/components/ModalConfirmacion.astro`
- [x] Capa semitransparente y cuadro de diálogo centrados. Medido en el navegador: capa `fixed` a pantalla completa con `rgba(13, 21, 38, 0.55)`, cuadro de `420px` con desvío cero respecto al centro de la ventana.
- [x] Texto exacto: "¿Seguro que quieres cerrar sesión?".
- [x] Botones "Cancelar" y "Confirmar". Neutro para cancelar y acento para confirmar, en ese orden.
- [x] Oculto al principio con `hidden`. `display: none` y el texto no aparece en la página hasta abrirlo.
- [x] Estilos coherentes con la paleta: superficie `#F7F9FF`, radio de modal `18px`, sombra de tarjeta y acento `#F26A1B` en el botón de confirmar. Todo viene del tema; el componente solo añade el margen del párrafo.
- Añadido `role="dialog"`, `aria-modal="true"` y `aria-labelledby` apuntando al texto de la pregunta: es la parte del diálogo que quedaba pendiente de la casilla ARIA de T-14.
- **RF:** RF-6 (D-09)
- **Depende de:** T-14

### T-27 · Crear `src/pages/bienvenida.astro`
- [x] Título de la página y saludo con el hueco para el nombre de usuario. El título del documento es "Bienvenida" y el saludo es un `<h1 id="saludo-usuario">` que **llega vacío**: `bienvenida.ts` escribe "Bienvenido/a, {nombre}" con `textContent` (RF-13). Comprobado con las dos cuentas: "Bienvenido/a, ana" y "Bienvenido/a, bruno".
- [x] Texto secundario "Has iniciado sesión correctamente", sin punto final: el texto entrecomillado del requisito no lo lleva, aunque el boceto del plan lo dibuje.
- [x] Botón "Cerrar sesión" con el color de acento. `#F26A1B` medido en el navegador.
- [x] Incluir el componente `ModalConfirmacion.astro`, presente en el documento y oculto (`display: none`).
- [x] Importar `bienvenida.ts`, desde un `<script>`: el módulo se engancha solo a `astro:page-load`.
- El saludo pasa a azul primario en el tema: el plan (7.2) lo marca así y el tema lo tenía en color de texto. Es el único texto grande de la pantalla, así que hace de título.
- **RF:** RF-5
- **Depende de:** T-20, T-21, T-26

### T-28 · Conectar el saludo y el cierre de sesión
- [x] El saludo se rellena con `textContent`. Observado en el navegador: "Bienvenido/a, ana". `innerHTML` no aparece en ningún punto de `src/`, y la asignación es `elementoSaludo.textContent = ...` en `bienvenida.ts`.
- [x] El botón abre el diálogo de confirmación. `hidden` pasa a `false` y la capa se dibuja con `display: flex`; el foco entra en "Cancelar", no se queda en el botón de detrás.
- [x] "Confirmar" limpia la sesión y navega a `/login`. Tras confirmar, la pantalla de acceso aparece con el formulario y el botón habilitado, y **se queda** ahí: si la sesión no se hubiera limpiado, la protección de `/login` habría devuelto a la bienvenida.
- [x] "Cancelar" cierra el diálogo y conserva la sesión. La capa vuelve a `hidden`, el foco regresa al botón que lo abrió y el saludo sigue mostrando el nombre.
- [x] Aplicar los estilos de la tarjeta de `720px`. Medido: `720px` de ancho, 271 px de margen a cada lado y 260 arriba y abajo, sin desbordamiento horizontal.
- **RF:** RF-5, RF-6, RF-13
- **Depende de:** T-27

### T-29 · Comprobar el cierre de sesión en el navegador
- [x] "Cerrar sesión" muestra el diálogo con el texto exacto. Comparado carácter a carácter con «¿Seguro que quieres cerrar sesión?», y el foco entra en el diálogo.
- [x] Confirmar → vuelve a `/login` y la sesión queda limpia. Tras 1,5 s sigue en `/login`: si la sesión no estuviera limpia, la protección de RF-9 habría devuelto a la bienvenida. El formulario queda operativo.
- [x] Cancelar → sigue en la bienvenida y la sesión se conserva. El saludo mantiene el nombre y el foco vuelve al botón que abrió el diálogo.
- Comprobado además lo que pide el plan en 8.4 y ningún otro punto verifica: `Escape` cierra, pulsar fuera cierra, y **pulsar dentro no cierra**. Los tres conservan la sesión.
- **RF:** RF-6
- **Depende de:** T-28

---

## Bloque 6 · Verificación final

### T-30 · Comprobar los criterios de finalización de la spec
- [x] Recorrer los 14 criterios de §8 de `docs/specs/001-mvp/specs.md`. Los 14 se cumplen:

| # | Criterio | Evidencia |
|---|---|---|
| 1 | El acceso muestra los dos campos y el botón, y nada más | Texto visible: «Iniciar sesión / Nombre de usuario / Contraseña / Iniciar sesión» |
| 2 | Credenciales válidas llegan a la bienvenida | `200` y `/bienvenida` |
| 3 | Los dos usuarios tienen nombres distintos | `ana` y `bruno` en `storage.json` |
| 4 | Credenciales documentadas | `docs/usuarios.md`, tabla con las dos cuentas |
| 5 | La bienvenida muestra "Bienvenido/a, {nombre}" | «Bienvenido/a, ana» |
| 6 | El cierre pide confirmación y vuelve al acceso | Diálogo con su pregunta y llegada a `/login` |
| 7 | Sin sesión, la bienvenida redirige al acceso por escritura, recarga o historial | Las tres vías terminan en `/login` |
| 8 | Recargar la bienvenida devuelve al acceso | `Page.reload` sobre `/bienvenida` → `/login` |
| 9 | Credenciales incorrectas: mensaje genérico junto al formulario | Mismo texto para contraseña mala y usuario inexistente, dentro del formulario |
| 10 | El campo de contraseña oculta lo escrito | `type="password"`; el valor no aparece en el texto de la página |
| 11 | El nombre se muestra de forma literal | `textContent`, sin `innerHTML` en todo `src/` |
| 12 | Contraseñas hasheadas | `scrypt$16384$…` en el almacén; las contraseñas en claro no aparecen en `src/` |
| 13 | Mensajes e interfaz en español | `lang="es"` y todos los textos visibles en español |
| 14 | Las verificaciones de calidad se superan | `lint` 0, `typecheck` 0, `build` 0 |

- [x] Anotar los que no se Cumplan y corregirlos. **Ninguno falla**, así que no hubo nada que corregir.
- Observación, no incumplimiento: la página 404 por defecto de Astro está en inglés (`<html lang="en">`). No la crea ninguna tarea ni forma parte de las dos pantallas de la spec; solo aparece escribiendo una ruta inventada. Si se quiere en español hace falta una `src/pages/404.astro`, que añadiría una página a las inventariadas en el plan.
- **RF:** RF-1 a RF-14
- **Depende de:** T-25, T-29

### T-31 · Revisar los casos límite de la spec
- [x] Espacios en blanco en los extremos → se recortan. `"  ana  "` y `"  Ana2026Practica  "` acceden; el cuerpo enviado es `{"nombreUsuario":"ana","contrasena":"  Ana2026Practica  "}`, es decir, el cliente recorta el nombre y el servidor recorta la contraseña (D-19). Tabuladores y saltos de línea (`"\tana\n"`) también acceden, y el saludo usa el nombre del almacén (`Bienvenido/a, ana`), no el texto tecleado.
- [x] Mayúsculas distintas → se rechazan. `Ana` y `ANA` reciben el mismo mensaje genérico.
- [x] Nombre de usuario con acentos, símbolos o con contenido similar a marcado → se muestra literal. Cinco nombres (`José Ángel`, `<b>ana</b>`, `<img src=x onerror=…>`, comillas y `&`, `üsuario/../<script>`) se muestran tal cual, con cero elementos hijos dentro del saludo, sin `<b>` ni `<img>` creados y sin ejecutar el `onerror`. La sesión se fijó desde el módulo en desarrollo porque los dos usuarios almacenados no tienen esos nombres; lo que se prueba es el contrato de presentación (RF-13).
- [x] Escritura directa de `/bienvenida` → redirige a `/login`. Carga completa del documento y termina en `/login`.
- [x] Recarga de `/bienvenida` → vuelve a `/login`. `Page.reload` con sesión activa: la sesión muere con el documento (RF-7) y la protección redirige.
- [x] Recarga de `/login` → permanece en `/login`. Sin mensajes de error residuales.
- [x] Botones atrás y adelante del navegador. Con sesión, atrás desde `/bienvenida` pasa por `/login` y rebota a `/bienvenida` sin mostrar el formulario (RF-9); tras cerrar sesión, atrás no muestra la bienvenida y adelante tampoco: ambas terminan en `/login`.
- [x] Abrir `/login` con sesión activa → redirige a `/bienvenida`. Es el rebote del caso anterior: `inicializarLogin` detecta sesión y navega.
- **RF:** RF-4, RF-7, RF-9, RF-10, RF-13
- **Depende de:** T-30

### T-32 · Auditar el cumplimiento de la constitución
- [x] Ninguna consulta de medios en todo el proyecto. Sin `@media` ni `matchMedia` en ningún fichero (tampoco en configuración o HTML), un solo fichero de estilos (`theme.css`), anchuras fijas y ni siquiera `<meta name="viewport">`.
- [x] Ningún color genérico: la paleta es la del plan. Comparación mecánica de los 13 tokens de §8.1 contra `theme.css`: mismos nombres, mismos valores, ninguno extra. Los 13 literales hexadecimales del fichero son las 13 declaraciones; fuera de `theme.css` no hay ningún `#hex`, `rgb()`, `hsl()` ni nombre de color salvo `transparent`.
- [x] Ningún usuario administrador. `storage.json` contiene dos usuarios con `id`, `nombreUsuario` y `contrasenaHash`, sin campo de rol ni de permisos; `docs/usuarios.md` lo declara. Las únicas coincidencias de «role» son atributos ARIA (`role="dialog"`, `role="alert"`).
- [x] Toda la lógica de autenticación está en módulos, no en los componentes. El frontmatter de los cinco `.astro` solo tiene importaciones, `Props` y la redirección de `/`; los `<script>` solo importan módulos; ninguna página ni componente contiene `fetch`, acceso al almacén, comparación de contraseñas ni `contrasenaHash`.
- [x] Los hash no salen del servidor en ninguna respuesta. El único punto que serializa es `responder()`, y solo emite `{ exito, nombreUsuario }` o `{ exito, mensaje }`. Comprobado en ejecución: 200 → `{"exito":true,"nombreUsuario":"ana"}`, 401 y 400 → mensaje genérico, y `scrypt`/`contrasenaHash` no aparecen en el HTML de `/login` ni de `/bienvenida`.
- [x] Los nombres de variable están en `camelCase`. Todo identificador con valor en ejecución, función, propiedad y clave del almacén está en `camelCase`. Los 16 nombres con guion bajo son constantes de módulo en mayúsculas sostenidas (`MENSAJE_FALLO`, `ID_MODAL`, `RUTA_LOGIN`…), convención que el `camelcase` de ESLint —activo vía neostandard, que exige la constitución— acepta: una prueba con `nombre_usuario` sí falla.
- [x] Todos los textos de la interfaz están en español. Ocho cadenas visibles y dos títulos, todas en español: «Iniciar sesión», «Nombre de usuario», «Contraseña», «Bienvenido/a, …», «Has iniciado sesión correctamente», «Cerrar sesión», «¿Seguro que quieres cerrar sesión?», «Cancelar», «Confirmar». Seguían sin resolver las dos observaciones ya conocidas: la 404 por defecto de Astro está en inglés (también cuando se pide `GET /api/sesion`, que responde 404).
- **RF:** NFR-1, NFR-2, NFR-3, NFR-4
- **Depende de:** T-30

### T-33 · Documentación de los usuarios
- [x] `docs/usuarios.md` con las dos cuentas, sus credenciales y el formato del hash.
- [x] Hash de `src/data/storage.json` verificados contra esas credenciales.
- Nota permanente (no es una casilla pendiente): si se vuelve a ejecutar `scripts/generarHashes.ts`, hay que actualizar este documento con las nuevas credenciales. No se ha vuelto a ejecutar desde T-10, así que las credenciales documentadas siguen vigentes.
- **RF:** NFR-1 (D-14)
- **Depende de:** T-10

### T-34 · Paso final de calidad
- [x] `npm run lint` sin errores. `eslint .` termina con código 0.
- [x] `npm run typecheck` sin errores. `tsc --noEmit` termina con código 0.
- [x] `npm run dev` arranca y las dos pantallas funcionan. Arranca en 2 s sin avisos y una pasada de navegador con 12 comprobaciones en verde: la raíz redirige al acceso, el formulario se monta con sus dos campos, el fallo de credenciales muestra el mensaje genérico, el acceso válido llega a la bienvenida con «Bienvenido/a, ana», el diálogo se abre con su pregunta, Escape lo cierra sin cerrar la sesión, el cierre confirmado vuelve al acceso con los campos vacíos, el segundo usuario entra como «Bienvenido/a, bruno» y recargar la bienvenida sin sesión vuelve al acceso.
- [x] El proyecto compila para producción sin errores. `astro build` termina con código 0 y genera `dist/client` y `dist/server`; el artefacto recién construido se ejecuta: `/` responde 301 a `/login`, `/login` y `/bienvenida` responden 200 y `POST /api/sesion` devuelve `{"exito":true,"nombreUsuario":"bruno"}`, sin errores en el registro.
- **RF:** NFR-5
- **Depende de:** T-31, T-32

---

## Resumen de cobertura

| RF | Tareas que lo cubren |
|---|---|
| RF-1 | T-03, T-15, T-19, T-21, T-23, T-25 |
| RF-2 | T-14, T-18, T-19, T-23, T-25 |
| RF-3 | T-03, T-11, T-12, T-14, T-19, T-25 |
| RF-4 | T-16, T-17, T-20, T-21, T-27, T-31 |
| RF-5 | T-20, T-27, T-28 |
| RF-6 | T-14, T-16, T-20, T-26, T-28, T-29 |
| RF-7 | T-15, T-16, T-17, T-20, T-21, T-31 |
| RF-8 | T-23 |
| RF-9 | T-16, T-17, T-21, T-31 |
| RF-10 | T-09, T-11, T-19, T-31 |
| RF-11 | T-08 |
| RF-12 | T-19, T-25 |
| RF-13 | T-20, T-28, T-31 |
| RF-14 | T-23 |
| NFR-1 | T-32, T-33 |
| NFR-2 | T-13, T-14, T-24, T-32 |
| NFR-3 | T-13, T-24, T-32 |
| NFR-4 | T-08, T-10, T-11, T-12, T-32 |
| NFR-5 | T-05, T-06, T-07, T-34 |
