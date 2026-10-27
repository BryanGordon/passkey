# Tareas — Spec 001 (MVP: inicio de sesión, bienvenida y cierre de sesión)

Desglose de la implementación de `docs/specs/001-mvp/plan.md` en tareas pequeñas y
ordenadas por dependencia. Cada tarea está pensada para completarse en 10 a 20 minutos.

**Convenciones**

- `[ ]` pendiente · `[x]` completada
- La columna **RF** indica los requisitos funcionales de la spec que cubre la tarea.
- La columna **Depende de** indica las tareas que deben estar terminadas antes.
- Las tareas sin RF propio se anotan como `—` (andamiaje, estilo, verificación).

**Estado actual:** las tareas T-01 a T-12 y T-33 están completadas. El bloque 0 (andamiaje) y el bloque 1 (datos y servidor) están cerrados por completo. La siguiente tarea es T-13, que abre el bloque de estilos.

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
- [ ] Definir las 13 variables de color de la paleta (azul `#1B4DD1` + naranja `#F26A1B`).
- [ ] Definir los anchos fijos, radios, sombras, espaciados, tipografía y transiciones.
- [ ] No usar negro, blanco ni gris neutro puros.
- **RF:** NFR-2, NFR-3 (D-11, D-13)
- **Depende de:** T-07

### T-14 · Añadir los componentes de estilo al tema
- [ ] `.contenedor` con ancho fijo y centrado.
- [ ] `.tarjeta` con superficie, borde, radio y sombra.
- [ ] `.campo`, `.campo-error` y `.mensaje-error`.
- [ ] `.boton-primario`, `.boton-acento` y `.boton-neutro`.
- [ ] `.modal-capa`, `.modal` y `.modal-acciones`.
- [ ] `.titulo-pagina` y `.saludo`.
- [ ] Anillo de foco con `--color-foco` en todos los elementos interactivos.
- [ ] `role="alert"` y `aria-live="polite"` en los mensajes de error.
- **RF:** NFR-2, RF-2, RF-3, RF-6
- **Depende de:** T-13

### T-15 · Crear `src/layouts/BaseLayout.astro`
- [ ] Documento base con `lang="es"` y el `title` de la página.
- [ ] Importar `src/styles/theme.css`.
- [ ] Incluir `<ClientRouter />` de `astro:transitions` en el `head`.
- [ ] Exponer la ranura `<slot />` y un contenedor de ancho fijo.
- **RF:** RF-1, RF-7 (D-02)
- **Depende de:** T-14

---

## Bloque 3 · Módulos de cliente

### T-16 · Crear `src/scripts/session.ts`
- [ ] Variable de módulo `usuarioActual` inicialmente nula.
- [ ] `iniciarSesion`, `cerrarSesion` y `obtenerUsuarioActual`.
- [ ] No usar `localStorage`, `sessionStorage` ni cookies.
- **RF:** RF-1, RF-4, RF-6, RF-7, RF-9 (D-03)
- **Depende de:** T-07

### T-17 · Crear `src/scripts/navegacion.ts`
- [ ] `navegarA(ruta)` sobre `navigate` de `astro:transitions/client`.
- [ ] `protegerPagina(rutaPermitidaSinSesion)`: si no hay usuario, navega y devuelve `false`.
- [ ] No usar `window.location`, que provocaría una recarga completa.
- **RF:** RF-4, RF-7, RF-9
- **Depende de:** T-16

### T-18 · Crear `src/scripts/validacionCredenciales.ts`
- [ ] `validarCamposObligatorios` devuelve un mapa de errores por campo.
- [ ] Considera vacío un valor formado solo por espacios.
- [ ] Mensaje exacto: "Este campo es obligatorio".
- [ ] La lógica vive aquí y **no** dentro del componente `.astro`.
- **RF:** RF-2, HU-5 (D-08)
- **Depende de:** T-07

### T-19 · Crear `src/scripts/login.ts`
- [ ] `preventDefault` en el envío.
- [ ] Validar los campos antes de contactar con el servidor.
- [ ] Mostrar el error de campo **junto a su campo** y no enviar nada.
- [ ] Enviar `POST /api/sesion` con el nombre de usuario normalizado.
- [ ] Con 200: `iniciarSesion` y `navegarA('/bienvenida')`.
- [ ] Con 401: mostrar "Usuario o contraseña incorrectos" y rehabilitar el botón.
- [ ] Deshabilitar el botón al enviar y mantener una bandera `envioRealizado`.
- **RF:** RF-1, RF-2, RF-3, RF-10, RF-12
- **Depende de:** T-17, T-18

### T-20 · Crear `src/scripts/bienvenida.ts`
- [ ] `protegerPagina('/login')` al cargar: sin usuario, redirige.
- [ ] Pintar el saludo con `textContent` y nunca con `innerHTML`.
- [ ] Botón de cierre de sesión → abrir el diálogo de confirmación.
- [ ] Confirmar → `cerrarSesion` y navegar a `/login`.
- [ ] Cancelar → cerrar el diálogo y conservar la sesión.
- [ ] Cerrar el diálogo con `Escape` y al pulsar fuera.
- **RF:** RF-4, RF-5, RF-6, RF-7, RF-13 (D-09, D-10)
- **Depende de:** T-17

### T-21 · Registrar los scripts de página en `astro:page-load`
- [ ] Envolver la inicialización de `login.ts` y `bienvenida.ts` en el evento `astro:page-load`.
- [ ] Ejecutar también la inicialización en la primera carga.
- [ ] **Motivo:** con `<ClientRouter />` los scripts empaquetados solo se ejecutan una vez; sin esto, el script de la bienvenida nunca se ejecutaría al llegar con navegación de cliente.
- [ ] Comprobar que no se registran listeners duplicados.
- **RF:** RF-1, RF-4, RF-7, RF-9
- **Depende de:** T-19, T-20

---

## Bloque 4 · Pantalla de inicio de sesión

### T-22 · Crear `src/pages/index.astro`
- [ ] Redirección permanente a `/login`.
- [ ] Verificar que `/` lleva a `/login`.
- **RF:** —
- **Depende de:** T-15

### T-23 · Crear `src/pages/login.astro`
- [ ] Título "Iniciar sesión".
- [ ] Campo de nombre de usuario con su etiqueta.
- [ ] Campo de contraseña con `type="password"` y su etiqueta.
- [ ] Botón de envío "Iniciar sesión".
- [ ] Contenedores de mensaje de error por campo y de mensaje general, **ocultos** al principio.
- [ ] Antes del primer intento no se muestra ningún otro contenido.
- [ ] Importar `login.ts` y el módulo de sesión.
- **RF:** RF-8, RF-14
- **Depende de:** T-19, T-21

### T-24 · Aplicar los estilos de la pantalla de inicio de sesión
- [ ] Tarjeta de `440px` centrada vertical y horizontalmente.
- [ ] Colores de la paleta: primario en el botón y el título, acento en el foco.
- [ ] Comprobar que no hay ninguna consulta de medios.
- **RF:** NFR-2, NFR-3
- **Depende de:** T-23

### T-25 · Comprobar el flujo de inicio de sesión en el navegador
- [ ] Credenciales válidas → llega a la bienvenida con el nombre correcto.
- [ ] Credenciales incorrectas → mensaje genérico y sigue en el login.
- [ ] Campos vacíos → mensajes junto a los campos, sin petición al servidor.
- [ ] Doble clic o Enter repetido → una sola petición.
- [ ] Botón deshabilitado mientras dura la petición.
- **RF:** RF-1, RF-2, RF-3, RF-12
- **Depende de:** T-24

---

## Bloque 5 · Pantalla de bienvenida

### T-26 · Crear `src/components/ModalConfirmacion.astro`
- [ ] Capa semitransparente y cuadro de diálogo centrados.
- [ ] Texto exacto: "¿Seguro que quieres cerrar sesión?".
- [ ] Botones "Cancelar" y "Confirmar".
- [ ] Oculto al principio con `hidden`.
- [ ] Estilos coherentes con la paleta.
- **RF:** RF-6 (D-09)
- **Depende de:** T-14

### T-27 · Crear `src/pages/bienvenida.astro`
- [ ] Título de la página y saludo con el hueco para el nombre de usuario.
- [ ] Texto secundario "Has iniciado sesión correctamente".
- [ ] Botón "Cerrar sesión" con el color de acento.
- [ ] Incluir el componente `ModalConfirmacion.astro`.
- [ ] Importar `bienvenida.ts`.
- **RF:** RF-5
- **Depende de:** T-20, T-21, T-26

### T-28 · Conectar el saludo y el cierre de sesión
- [ ] El saludo se rellena con `textContent`.
- [ ] El botón abre el diálogo de confirmación.
- [ ] "Confirmar" limpia la sesión y navega a `/login`.
- [ ] "Cancelar" cierra el diálogo y conserva la sesión.
- [ ] Aplicar los estilos de la tarjeta de `720px`.
- **RF:** RF-5, RF-6, RF-13
- **Depende de:** T-27

### T-29 · Comprobar el cierre de sesión en el navegador
- [ ] "Cerrar sesión" muestra el diálogo con el texto exacto.
- [ ] Confirmar → vuelve a `/login` y la sesión queda limpia.
- [ ] Cancelar → sigue en la bienvenida y la sesión se conserva.
- **RF:** RF-6
- **Depende de:** T-28

---

## Bloque 6 · Verificación final

### T-30 · Comprobar los criterios de finalización de la spec
- [ ] Recorrer los 14 criterios de §8 de `docs/specs/001-mvp/specs.md`.
- [ ] Anotar los que no se Cumplan y corregirlos.
- **RF:** RF-1 a RF-14
- **Depende de:** T-25, T-29

### T-31 · Revisar los casos límite de la spec
- [ ] Espacios en blanco en los extremos → se recortan.
- [ ] Mayúsculas distintas → se rechazan.
- [ ] Nombre de usuario con acentos, símbolos o con contenido similar a marcado → se muestra literal.
- [ ] Escritura directa de `/bienvenida` → redirige a `/login`.
- [ ] Recarga de `/bienvenida` → vuelve a `/login`.
- [ ] Recarga de `/login` → permanece en `/login`.
- [ ] Botones atrás y adelante del navegador.
- [ ] Abrir `/login` con sesión activa → redirige a `/bienvenida`.
- **RF:** RF-4, RF-7, RF-9, RF-10, RF-13
- **Depende de:** T-30

### T-32 · Auditar el cumplimiento de la constitución
- [ ] Ninguna consulta de medios en todo el proyecto.
- [ ] Ningún color genérico: la paleta es la del plan.
- [ ] Ningún usuario administrador.
- [ ] Toda la lógica de autenticación está en módulos, no en los componentes.
- [ ] Los hash no salen del servidor en ninguna respuesta.
- [ ] Los nombres de variable están en `camelCase`.
- [ ] Todos los textos de la interfaz están en español.
- **RF:** NFR-1, NFR-2, NFR-3, NFR-4
- **Depende de:** T-30

### T-33 · Documentación de los usuarios
- [x] `docs/usuarios.md` con las dos cuentas, sus credenciales y el formato del hash.
- [x] Hash de `src/data/storage.json` verificados contra esas credenciales.
- [ ] Si se vuelve a ejecutar `scripts/generarHashes.ts`, actualizar este documento con las nuevas credenciales.
- **RF:** NFR-1 (D-14)
- **Depende de:** T-10

### T-34 · Paso final de calidad
- [ ] `npm run lint` sin errores.
- [ ] `npm run typecheck` sin errores.
- [ ] `npm run dev` arranca y las dos pantallas funcionan.
- [ ] El proyecto compila para producción sin errores.
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
