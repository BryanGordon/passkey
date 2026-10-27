# Plan de implementación — Spec 001 (MVP: inicio de sesión, bienvenida y cierre de sesión)

Documento de planificación técnica derivado de `docs/specs/001-mvp/specs.md`.
Todo lo que se describe aquí respeta `docs/constitution.md` y `Agents.md`.
Cada sección indica los RF que cubre.

---

## 1. Punto de partida y restricciones heredadas

| Restricción | Origen | Efecto en el plan |
|---|---|---|
| Sin sesión en el servidor; la identificación vive en la pantalla | Constitución 12 (excepción para 001-mvp) | El estado de autenticación se mantiene en un módulo de memoria del navegador, no en cookies ni en almacenamiento persistente |
| Recargar la página termina la sesión | RF-7 | Se descartan `sessionStorage` y `localStorage`; el estado solo sobrevive a navegaciones de cliente |
| Contraseñas con hash, nunca visibles | Constitución 7, NFR-4 | La comprobación ocurre en el servidor; los hash nunca viajan al navegador |
| Datos solo en `storage.json` y con capa de datos aislada | Constitución 6 | Un único módulo lee el almacén; el resto de la aplicación lo consume por funciones |
| Lógica de autenticación en módulos independientes | Constitución 4 | Los componentes `.astro` no contienen lógica: solo renderizan estado y delegan el comportamiento en módulos de script |
| Sin dependencias innecesarias | Constitución 1, `Agents.md` | Solo se añade el adaptador de servidor de Astro; el resto es `node:crypto` y CSS nativo |
| Sin diseño adaptable, sin consultas de medios | Constitución 10, NFR-3 | Ancho fijo de contenedor y ninguna regla de adaptación por dispositivo |
| Español, `camelCase`, azul con un color complementario | Constitución 8 y 9, NFR-1 y NFR-2 | Variables CSS con paleta propia, textos en español y nombres en `camelCase` |
| Sin usuario administrador | `Agents.md` | Los dos usuarios registrados tienen exactamente los mismos permisos |

---

## 2. Decisiones técnicas

### 2.1 Decisiones adoptadas

| # | Decisión | Justificación | RF cubiertos |
|---|---|---|---|
| D-01 | Renderizado en el servidor con el adaptador oficial de Node (`output: 'server'`) | La comparación de credenciales debe ejecutarse en el servidor; si ocurriera en el cliente, los hash de `storage.json` viajarían al navegador y se violarían las constituciones 6 y 7. Astro exige un adaptador para `output: 'server'`, por lo que la dependencia es inevitable y justificada. | RF-1, RF-3, NFR-4 |
| D-02 | Navegación de cliente mediante `<ClientRouter />` (`astro:transitions`) | Es lo único que permite que la identificación en memoria sobreviva a la transición de inicio de sesión → bienvenida (RF-1) y, a la vez, que se pierda al recargar (RF-7): una navegación de cliente no reinicia el contexto de JavaScript, una recarga completa sí. | RF-1, RF-4, RF-7, RF-9 |
| D-03 | Estado de autenticación en un módulo de memoria del navegador (`src/scripts/session.ts`) | La constitución 12 lo autoriza expresamente para esta spec. Se descarta cualquier almacenamiento persistente porque RF-7 exige que la recarga cierre la sesión. | RF-1, RF-4, RF-6, RF-7, RF-9 |
| D-04 | Validación de credenciales en el servidor mediante un punto de acceso `POST /api/sesion` | Centraliza la lógica de autenticación fuera de los componentes (constitución 4) y garantiza que el hash nunca salga del servidor. | RF-1, RF-3 |
| D-05 | Hash de contraseñas con `scrypt` de `node:crypto` y comparación con `timingSafeEqual` | `node:crypto` es estándar, no añade dependencias (constitución 1) y `timingSafeEqual` evita filtrar información por tiempo de comparación. | RF-3, NFR-4, Constitución 7 |
| D-06 | Formato de hash `scrypt$<coste>$<saltHex>$<hashHex>` con sal aleatoria por usuario | Permite verificar sin guardar la contraseña y deja el coste parametrizado para endurecerlo en fases futuras sin invalidar los datos. | NFR-4 |
| D-07 | Capa de datos aislada en `src/data/userRepository.ts` | Único punto del código que abre `src/data/storage.json`, tal y como exige la constitución 6. | RF-11, NFR-4 |
| D-08 | Validación de campos vacíos en un módulo aparte (`src/scripts/validacionCredenciales.ts`), nunca dentro del componente | Los componentes solo muestran estado y emiten eventos (constitución 4). | RF-2, RF-5 (HU-5) |
| D-09 | Confirmación de cierre de sesión con un diálogo modal propio, no con `window.confirm` | RF-6 exige el texto exacto "¿Seguro que quieres cerrar sesión?"; el diálogo nativo lo sustituye por un texto traducido del navegador e incumple NFR-2 al romper el sistema visual. | RF-6 |
| D-10 | El saludo se escribe con `textContent`, nunca con `innerHTML` | Garantiza que el nombre de usuario se muestre de forma literal y que su contenido no pueda interpretarse como marcado (RF-13). | RF-5, RF-13 |
| D-11 | CSS nativo con variables personalizadas en `src/styles/theme.css` | Sin marco de estilos (constitución 1). Las variables concentran la paleta y garantizan coherencia visual sin repetir colores. | NFR-2, NFR-3 |
| D-12 | Sin marco de componentes; solo componentes `.astro` y módulos de TypeScript | La interactividad del MVP es un formulario, una protección de ruta y un diálogo modal: un marco de interfaz añadiría peso y dependencias sin aportar valor. | RF-1 a RF-14 |
| D-13 | Contenedor de anchura fija definida por variable CSS | Materializa NFR-3 y la constitución 10: el diseño no se adapta a distintos dispositivos. | NFR-3 |
| D-14 | Los dos usuarios se documentan en `docs/usuarios.md` | La spec exige que las credenciales estén documentadas y no se muestren en la interfaz (criterio de finalización). | NFR-1, Criterio de finalización |
| D-15 | Semilla de datos mediante el script `scripts/generarHashes.ts`, ejecutado con la eliminación de tipos nativa de Node (`node --experimental-strip-types`, Node ≥ 22.6) | Genera los hash de `storage.json` de forma reproducible sin dependencias de herramientas. | NFR-4 |
| D-16 | Dos copias de TypeScript: la 7 en la raíz y la 6 fijada con `overrides` para la cadena de `typescript-eslint` | `neostandard@0.14.1` arrastra `typescript-eslint@8.72.1`, cuyo par solo admite `typescript >=4.8.4 <6.1.0`. El anidamiento automático de npm no basta: `ts-api-utils` se iza a la raíz y resuelve contra la 7, que no expone la API del compilador (`createProgram` y `TypeFlags` son `undefined`), así que el linter revienta al cargarse. El campo `overrides` fija `typescript@6.0.3` para `ts-api-utils`; `tsc` sigue siendo la 7. | NFR-5, Constitución 1 |
| D-17 | Linter con configuración plana: `neostandard({ ts: true })`, `eslint-plugin-astro@1.7.0` y `globalIgnores` | `neostandard` cubre JavaScript y TypeScript, pero no analiza `.astro`; se añade el plugin oficial con su procesador `client-side-ts` para que el frontmatter y los `<script>` admitan tipos. La versión 3 del plugin exige ESLint 10, contra la 9 que fija `Agents.md`, así que se ancla la 1.7.0, que solo pide `eslint >=8.57.0`. Ninguna de las 188 reglas activadas exige información de tipos. | NFR-5 |
| D-18 | El almacén se carga con `import` del JSON, no con `node:fs` | `readFileSync(new URL('./storage.json', import.meta.url))` funciona en desarrollo pero rompe el servidor compilado: Vite conserva la ruta relativa dentro del chunk y no copia el archivo a `dist/`, así que toda petición termina en `ENOENT` y HTTP 500 (comprobado con un build real y una ruta de prueba). El `import` incrusta el JSON en el bundle del servidor y, de paso, hace que `tsc` valide la forma del almacén en tiempo de compilación. El riesgo de que un módulo de cliente lo importe se verifica en T-34 buscando `scrypt` en `dist/client`. | RF-11, NFR-4, Constitución 7 |
| D-19 | El servidor normaliza nombre de usuario **y** contraseña antes de comparar | El pseudocódigo 5.6 solo recortaba espacios para decidir si un campo estaba vacío, y 5.5 no normaliza la contraseña en el cliente. RF-10 se refiere a «las credenciales» y el §6 de la especificación admite explícitamente «contraseña con espacios (solo se recortan los extremos)», así que la normalización se hace en el servidor, que es el punto autoritativo y además cubre las llamadas directas a la API. | RF-10, RF-3 |

### 2.2 Decisiones descartadas

| # | Alternativa | Motivo del descarte | Impacto |
|---|---|---|---|
| X-01 | Cookie de sesión `httpOnly` en el servidor | Contradice la excepción de la constitución 12 y RF-7 (la recarga debe cerrar la sesión). Queda aplazada a una spec posterior. | Alto |
| X-02 | `sessionStorage` o `localStorage` para guardar el usuario | Sobreviven a la recarga y romperían RF-7 de forma directa. | Alto |
| X-03 | Validar credenciales en el navegador | Enviaría los hash al cliente y convertiría la capa de datos en pública. | Alto |
| X-04 | `window.confirm` nativo para el cierre de sesión | No garantiza el mensaje exigido por RF-6 ni respeta la paleta de NFR-2. | Medio |
| X-05 | `bcrypt`, `argon2` u otra librería de hash | Dependencia externa innecesaria; `node:crypto` cubre el caso (constitución 1). | Bajo |
| X-06 | Tailwind, Bootstrap u otro marco CSS | Dependencia innecesaria; las variables CSS propias son suficientes. | Medio |
| X-07 | React, Vue, Svelte u otras islas de interfaz | La interactividad no lo justifica; añadiría una dependencia y complejidad de hidratación. | Medio |
| X-08 | Base de datos real o SQLite | La constitución 6 fija el almacenamiento en `storage.json`; además, el conjunto de usuarios se definirá en fases futuras. | Alto |
| X-09 | Sistema de traducción / multi-idioma | NFR-1 exige español únicamente; una librería de traducción es una dependencia gratuita e innecesaria. | Bajo |
| X-10 | Herramienta de pruebas (Vitest, Playwright) | La spec no lo pide y la constitución 11 solo exige `lint` y `dev`. La verificación del MVP se hace con una lista manual alineada con los criterios de finalización; puede añadirse en una spec posterior. | Medio |
| X-11 | Módulo administrador o roles | `Agents.md` lo prohíbe expresamente y la spec declara permisos iguales para los dos usuarios. | Alto |
| X-12 | Mostrar credenciales de ejemplo en la pantalla de inicio de sesión | La spec las sitúa fuera de la interfaz; se documentan aparte (D-14). | Bajo |
| X-13 | Instalar con `--legacy-peer-deps` | Silencia el conflicto sin resolverlo: `ts-api-utils` seguiría cargando la TypeScript 7 y el linter fallaría al iniciarse. Se prefiere `overrides`, que fija la resolución de forma explícita y reproducible (D-16). | Medio |
| X-14 | Rebajar TypeScript a la 6 para satisfacer a `typescript-eslint` | `Agents.md` fija TypeScript 7. Adaptar la herramienta al linter en lugar del linter a la herramienta invierte la prioridad del proyecto. | Alto |
| X-15 | `eslint-plugin-astro` 3.x | Exige ESLint 10, contra la 9 que fija `Agents.md`, y arrastra `eslint-plugin-jsx-a11y` como par, una dependencia que este proyecto no necesita. La 1.7.0 ofrece el mismo análisis con un solo par. | Medio |

---

## 3. Estructura de archivos prevista

```
docs/
  constitution.md
  usuarios.md                      <- credenciales de prueba (D-14)
  specs/001-mvp/
    specs.md
    plan.md
src/
  data/
    storage.json                   <- los dos usuarios con su hash (constitución 6)
    userRepository.ts              <- única capa que lee storage.json (D-07)
  lib/
    hashing.ts                     <- hash y verificación con node:crypto (D-05, D-06)
    credenciales.ts                <- normalización y comparación (RF-10)
  scripts/
    session.ts                     <- estado de autenticación en memoria (D-03)
    validacionCredenciales.ts      <- campos obligatorios (D-08)
    login.ts                       <- flujo del formulario (RF-1, RF-2, RF-3, RF-12)
    bienvenida.ts                  <- protección de ruta, saludo y cierre de sesión (RF-4 a RF-7, RF-13)
  components/
    ModalConfirmacion.astro        <- confirmación del cierre de sesión (D-09, RF-6)
  layouts/
    BaseLayout.astro               <- documento base y variables
  pages/
    index.astro                    <- redirección a /login
    login.astro                    <- pantalla 1
    bienvenida.astro               <- pantalla 2
    api/
      sesion.ts                    <- POST de validación de credenciales (D-04)
  styles/
    theme.css                      <- paleta, tipografía y componentes (D-11, D-13)
scripts/
  generarHashes.ts                 <- semilla de storage.json (D-15)
```

---

## 4. Modelos de datos

### 4.1 `src/data/storage.json` (almacén persistente)

```jsonc
{
  "usuarios": [
    {
      "id": "usr-001",
      "nombreUsuario": "ana",
      "contrasenaHash": "scrypt$16384$<saltHexAna>$<hashHexAna>"
    },
    {
      "id": "usr-002",
      "nombreUsuario": "bruno",
      "contrasenaHash": "scrypt$16384$<saltHexBruno>$<hashHexBruno>"
    }
  ]
}
```

Los valores `saltHex` y `hashHex` reales se generan con el script de semilla (D-15); son
aleatorios y distintos por usuario.

### 4.2 Tipos TypeScript

```ts
// src/data/userRepository.ts
export interface UsuarioAlmacenado {
  id: string
  nombreUsuario: string
  contrasenaHash: string
}

export interface AlmacenUsuarios {
  usuarios: UsuarioAlmacenado[]
}

// src/pages/api/sesion.ts
export interface CredencialesRecibidas {
  nombreUsuario: string
  contrasena: string
}

export interface RespuestaSesionExitosa {
  exito: true
  nombreUsuario: string
}

export interface RespuestaSesionFallida {
  exito: false
  mensaje: string
}

export type RespuestaSesion = RespuestaSesionExitosa | RespuestaSesionFallida
```

### 4.3 Información de cada usuario

| | Usuario A | Usuario B |
|---|---|---|
| `id` | `usr-001` | `usr-002` |
| `nombreUsuario` | `ana` | `bruno` |
| `contrasenaHash` | `scrypt$16384$<sal>$<hash>` | `scrypt$16384$<sal>$<hash>` |
| Contraseña de prueba | registrada en `docs/usuarios.md` | registrada en `docs/usuarios.md` |
| Permisos | idénticos | idénticos |
| Rol | ninguno | ninguno |
| Mensaje de bienvenida | "Bienvenido/a, ana" | "Bienvenido/a, bruno" |

Los dos nombres de usuario son distintos, lo que satisface la unicidad exigida por RF-11.
La contraseña en claro de cada uno se documenta en `docs/usuarios.md` (D-14) y es la misma
cadena que se usó para derivar el hash del almacén; nunca se escribe en el código, ni en
los registros de actividad, ni en las respuestas de la API.

---

## 5. Algoritmos (pseudocódigo)

### 5.1 Validación de campos obligatorios — `validarCamposObligatorios` (RF-2, RF-5/HU-5)

```
funcion validarCamposObligatorios(valores: mapa<string,string>) -> mapa<string,string>:
    errores := mapa vacío
    para cada (campo, valor) en valores:
        si recortar(valor) es cadena vacía:
            errores[campo] := "Este campo es obligatorio"
    devolver errores
```

`recortar` elimina únicamente los espacios en blanco de los extremos.

Se ejecuta en el cliente antes de contactar con el servidor (respuesta inmediata, RF-2) y
el servidor repite la comprobación sobre los datos recibidos, de modo que nunca se confía
en el cliente.

### 5.2 Normalización y comparación — `normalizarCredencial` / `compararCredenciales` (RF-10)

```
funcion normalizarCredencial(valor: string) -> string:
    devolver recortar(valor)         // descarta solo los extremos, no altera el interior

funcion compararCredenciales(valorEsperado: string, valorRecibido: string) -> boolean:
    // sensible a mayúsculas: no se aplica toLowerCase ni toUpperCase en ningún punto
    devolver normalizarCredencial(valorEsperado) === normalizarCredencial(valorRecibido)
```

### 5.3 Verificación de contraseña — `verificarContrasena` (RF-3, NFR-4)

```
funcion verificarContrasena(contrasenaPlano: string, hashAlmacenado: string) -> boolean:
    partes := separar(hashAlmacenado, "$")
    si partes.length != 4: devolver false
    algoritmo := partes[0]
    si algoritmo != "scrypt": devolver false
    coste := convertirANumero(partes[1])
    salt := convertirHexadecimalABytes(partes[2])
    hashEsperado := convertirHexadecimalABytes(partes[3])
    hashCalculado := scryptSync(contrasenaPlano, salt, longitudDe(hashEsperado), { N: coste })
    devolver timingSafeEqual(hashCalculado, hashEsperado)
```

La comparación con `timingSafeEqual` evita que el tiempo de respuesta revele cuántos
caracteres correctos hay.

### 5.4 Generación del hash — `generarHash` (D-06, D-15, NFR-4)

```
funcion generarHash(contrasenaPlano: string) -> string:
    salt := bytesAleatorios(16)
    coste := 16384
    hash := scryptSync(contrasenaPlano, salt, 64, { N: coste })
    devolver "scrypt$" + coste + "$" + convertirBytesAHexadecimal(salt) + "$" + convertirBytesAHexadecimal(hash)
```

### 5.5 Flujo de inicio de sesión — `manejarEnvioLogin` (RF-1, RF-2, RF-3, RF-12)

```
funcion manejarEnvioLogin(evento):
    evento.preventDefault()
    si envioRealizado:                                   // RF-12, segunda parte
        return
    envioRealizado := true
    botonEnvio.disabled := true                           // RF-12, primera parte

    valores := leerCamposDelFormulario()
    errores := validarCamposObligatorios(valores)         // RF-2
    si errores no está vacío:
        limpiarErroresVisibles()
        mostrarErroresPorCampo(errores)                    // "junto a cada campo vacío"
        botonEnvio.disabled := false
        envioRealizado := false
        return                                             // no se intenta la identificación

    limpiarErroresVisibles()
    respuesta := fetch("/api/sesion", {
        metodo: "POST",
        cuerpo: JSON.stringify({
            nombreUsuario: normalizarCredencial(valores.nombreUsuario),
            contrasena: valores.contrasena
        })
    })

    si respuesta.ok:
        datos := await respuesta.json()
        iniciarSesion(datos.nombreUsuario)                // D-03
        navegarA("/bienvenida")                           // navegación de cliente, D-02
    si no:
        datos := await respuesta.json()
        mostrarErrorGeneral(datos.mensaje)                // "Usuario o contraseña incorrectos"
        botonEnvio.disabled := false
        envioRealizado := false
```

El botón se rehabilita cuando la validación falla, de modo que el usuario pueda corregir y
reintentar sin recargar (coherente con RF-2 y con el criterio de "mensaje junto al campo").

### 5.6 Punto de acceso de validación — `POST /api/sesion` (RF-1, RF-3)

```
funcion manejadorPost(solicitud):
    cuerpo := await solicitud.json()                        // rechaza JSON inválido con 400
    nombreUsuario := cuerpo.nombreUsuario
    contrasena := cuerpo.contrasena

    // RF-10 vale para los dos valores, no solo para el nombre de usuario:
    // el §6 de la especificación admite "contraseña con espacios (solo se recortan los extremos)".
    nombreUsuario := normalizarCredencial(nombreUsuario)
    contrasena := normalizarCredencial(contrasena)

    si nombreUsuario es vacío o contrasena es vacío:
        devolver 400 con { exito: false, mensaje: "Usuario o contraseña incorrectos" }

    usuario := userRepository.buscarPorNombreUsuario(nombreUsuario)   // D-07, ya normalizado
    si usuario es null:
        devolver 401 con { exito: false, mensaje: "Usuario o contraseña incorrectos" }

    si no verificarContrasena(contrasena, usuario.contrasenaHash):
        devolver 401 con { exito: false, mensaje: "Usuario o contraseña incorrectos" }

    devolver 200 con { exito: true, nombreUsuario: usuario.nombreUsuario }
```

El mensaje es idéntico en los tres casos de fallo: el usuario no puede deducir si el
nombre de usuario existe ni cuál de los dos campos falló (RF-3).

### 5.7 Protección de ruta — `protegerPagina` (RF-4, RF-7, RF-9)

```
funcion protegerPagina(rutaPermitidaSinSesion: string):
    usuario := obtenerUsuarioActual()                     // D-03
    si usuario es null:
        // Incluye la recarga: el módulo se ha reiniciado y no hay identificación
        navegarA(rutaPermitidaSinSesion)                  // "/login"
        return falso
    devolver true
```

- En `/bienvenida` la protección se ejecuta con destino `/login` → cubre RF-4 (acceso
  directo, escritura de URL, historial del navegador) y RF-7 (la recarga reinicia el módulo).
- En `/login` la protección se ejecuta con destino `/bienvenida` → cubre RF-9.

Como el estado solo existe en memoria, la recarga de `/bienvenida` produce exactamente el
mismo resultado que abrirla sin sesión: ambos terminan en `/login`.

### 5.8 Cierre de sesión — `solicitarCerrarSesion` / `confirmarCerrarSesion` (RF-6)

```
funcion solicitarCerrarSesion():
    abrirDialogo("¿Seguro que quieres cerrar sesión?")     // D-09

funcion confirmarCerrarSesion():
    cerrarSesion()                                         // limpia el estado en memoria
    cerrarDialogo()
    navegarA("/login")

funcion cancelarCerrarSesion():
    cerrarDialogo()                                        // la sesión se conserva
```

### 5.9 Saludo — `renderizarSaludo` (RF-5, RF-13)

```
funcion renderizarSaludo(nombreUsuario: string):
    elementoSaludo.textContent := "Bienvenido/a, " + nombreUsuario
```

`textContent` garantiza que un nombre con caracteres similares a marcado se muestre
literal y no se interprete (RF-13).

---

## 6. Modelo de sesión en el cliente (D-03)

```ts
// src/scripts/session.ts
let usuarioActual: string | null = null

export function iniciarSesion(nombreUsuario: string): void {
  usuarioActual = nombreUsuario
}

export function cerrarSesion(): void {
  usuarioActual = null
}

export function obtenerUsuarioActual(): string | null {
  return usuarioActual
}
```

Comportamiento esperado:

| Acción | Estado tras la acción | RF |
|---|---|---|
| Inicio de sesión correcto | `usuarioActual = "ana"` | RF-1 |
| Navegación de cliente a `/bienvenida` | se conserva | RF-1 |
| Recarga de `/bienvenida` | `null` (el módulo se reinicia) | RF-7 |
| Escribir `/bienvenida` en la barra de direcciones | `null` | RF-4 |
| Botón "atrás" tras iniciar sesión | se conserva la identificación y la vista protegida sigue siendo válida | RF-4 |
| Confirmar el cierre de sesión | `null` | RF-6 |
| Cancelar el cierre de sesión | se conserva | RF-6 |

---

## 7. Páginas (pantallas y su detalle)

**Cantidad total de páginas: 2**, más una ruta raíz de redirección y un punto de acceso de API.

| Ruta | Archivo | Tipo | Propósito | RF cubiertos |
|---|---|---|---|---|
| `/` | `src/pages/index.astro` | Redirección | Envía a `/login` | — |
| `/login` | `src/pages/login.astro` | Página 1 | Pantalla de inicio de sesión | RF-1, RF-2, RF-3, RF-8, RF-9, RF-10, RF-12, RF-14 |
| `/bienvenida` | `src/pages/bienvenida.astro` | Página 2 | Saludo personalizado y cierre de sesión | RF-4, RF-5, RF-6, RF-7, RF-13 |
| `POST /api/sesion` | `src/pages/api/sesion.ts` | Punto de acceso | Validación de credenciales en el servidor | RF-1, RF-3, RF-10, NFR-4 |

### 7.1 Página 1 — `/login`

**Estructura visual**

```
┌──────────────────────────────────────────┐
│  fondo azul muy claro                    │
│        ┌──────────────────────────┐      │
│        │  Iniciar sesión          │      │  <- título, azul primario
│        │                          │      │
│        │  Nombre de usuario       │      │  <- etiqueta
│        │  [____________________]  │      │  <- campo de texto
│        │                          │      │
│        │  Contraseña              │      │
│        │  [____________________]  │      │  <- campo de contraseña
│        │                          │      │
│        │  ⚠ Este campo es ...    │      │  <- solo si hay error de campo
│        │                          │      │
│        │  ⚠ Usuario o contraseña  │      │  <- solo si hay error general
│        │     incorrectos          │      │
│        │  [ Iniciar sesión ]      │      │  <- botón primario
│        └──────────────────────────┘      │
└──────────────────────────────────────────┘
```

- Ancho fijo de la tarjeta: `440px`. Contenedor centrado vertical y horizontalmente.
- Antes del primer intento solo se ven: título, los dos campos con su etiqueta y el botón
  (RF-8: sin mensajes de error ni contenido adicional).
- El mensaje de error de campo va justo debajo del campo correspondiente (RF-2).
- El mensaje general "Usuario o contraseña incorrectos" va sobre el botón, en una caja
  de alerta (RF-3).
- El campo de contraseña es `type="password"`: los caracteres nunca se muestran (RF-14).

**Comportamiento**

| Disparador | Acción | RF |
|---|---|---|
| Envío del formulario | Validación de campos; si hay vacíos, se muestran los errores y no se envía | RF-2, RF-5/HU-5 |
| Envío con datos válidos | `POST /api/sesion`; botón deshabilitado mientras dura | RF-12 |
| Respuesta 200 | Se inicia la sesión en memoria y se navega a `/bienvenida` | RF-1 |
| Respuesta 401 | Se muestra "Usuario o contraseña incorrectos" y se rehabilita el botón | RF-3 |
| Carga de la página con sesión activa | Redirección a `/bienvenida` | RF-9 |
| Recarga de la página | Permanece en `/login` | Casos límite |

### 7.2 Página 2 — `/bienvenida`

**Estructura visual**

```
┌──────────────────────────────────────────┐
│                                          │
│   ┌──────────────────────────────────┐   │
│   │                                  │   │
│   │   Bienvenido/a, ana             │   │  <- saludo, azul primario
│   │                                  │   │
│   │   Has iniciado sesión            │   │
│   │   correctamente.                │   │
│   │                                  │   │
│   │   [ Cerrar sesión ]              │   │  <- botón de acento (naranja)
│   └──────────────────────────────────┘   │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  ¿Seguro que quieres cerrar      │   │  <- diálogo modal (oculto por defecto)
│   │  sesión?                         │   │
│   │  [ Cancelar ] [ Confirmar ]      │   │
│   └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

- Ancho fijo de la tarjeta: `720px`.
- El diálogo modal está en el DOM pero oculto (`hidden`); aparece al pulsar "Cerrar sesión".
- El diálogo modal bloquea el fondo con una capa semitransparente.
- El botón "Cerrar sesión" usa el color de acento (naranja) para diferenciarlo de la
  acción principal de la pantalla de inicio de sesión.
- El texto del saludo se inyecta con `textContent` (RF-13).

**Comportamiento**

| Disparador | Acción | RF |
|---|---|---|
| Carga de la página sin identificación | Redirección a `/login` | RF-4, RF-7 |
| Carga de la página con identificación | Se muestra "Bienvenido/a, {nombreUsuario}" | RF-5 |
| Clic en "Cerrar sesión" | Se abre el diálogo con "¿Seguro que quieres cerrar sesión?" | RF-6 |
| Clic en "Confirmar" | Se limpia la sesión y se navega a `/login` | RF-6 |
| Clic en "Cancelar" | Se cierra el diálogo y se conserva la sesión | RF-6 |
| Recarga de la página | Redirección a `/login` | RF-7 |

### 7.3 Punto de acceso — `POST /api/sesion`

| Situación | Código | Cuerpo |
|---|---|---|
| Credenciales válidas | 200 | `{ "exito": true, "nombreUsuario": "ana" }` |
| Usuario inexistente | 401 | `{ "exito": false, "mensaje": "Usuario o contraseña incorrectos" }` |
| Contraseña incorrecta | 401 | `{ "exito": false, "mensaje": "Usuario o contraseña incorrectos" }` |
| Campo vacío | 400 | `{ "exito": false, "mensaje": "Usuario o contraseña incorrectos" }` |

La respuesta nunca incluye el hash, el `id` interno ni ningún dato sensible.

---

## 8. Estilos visuales a implementar (D-11, D-13, NFR-2, NFR-3)

### 8.1 Paleta propia (azul con complementario naranja)

| Variable CSS | Valor | Uso |
|---|---|---|
| `--color-primario` | `#1B4DD1` | Botón de inicio de sesión, títulos y enlaces |
| `--color-primario-oscuro` | `#10349A` | Estados `:hover` y `:active` |
| `--color-primario-claro` | `#DCE6FF` | Fondos de foco y realces |
| `--color-acento` | `#F26A1B` | Botón de cierre de sesión y foco de los campos |
| `--color-acento-oscuro` | `#C24E0A` | Estado `:hover` del acento |
| `--color-fondo` | `#E8EEFC` | Fondo de página |
| `--color-superficie` | `#F7F9FF` | Fondo de las tarjetas |
| `--color-texto` | `#0D1526` | Texto principal |
| `--color-texto-suave` | `#4A5578` | Texto secundario |
| `--color-borde` | `#C3D0F2` | Bordes de campos y tarjetas |
| `--color-error` | `#A81B3C` | Texto de los mensajes de error |
| `--color-error-fondo` | `#FBE3E9` | Fondo de la caja de error |
| `--color-foco` | `#F26A1B` | Anillo de foco de los campos |

No se usa negro, blanco ni gris neutro puros: los neutros están teñidos de azul para
mantener la coherencia del sistema visual.

### 8.2 Otras variables

| Variable | Valor | Uso |
|---|---|---|
| `--ancho-contenedor` | `960px` | Ancho fijo de la página (NFR-3) |
| `--ancho-tarjeta-login` | `440px` | Ancho fijo de la pantalla de inicio de sesión |
| `--ancho-tarjeta-bienvenida` | `720px` | Ancho fijo de la pantalla de bienvenida |
| `--radio-borde` | `14px` | Radio de tarjetas, campos y botones |
| `--radio-modal` | `18px` | Radio del diálogo de confirmación |
| `--sombra-tarjeta` | `0 18px 40px -20px rgba(27, 77, 209, 0.45)` | Sombra de las tarjetas |
| `--sombra-boton` | `0 6px 14px -8px rgba(27, 77, 209, 0.6)` | Sombra de los botones |
| `--espaciado-1` a `--espaciado-6` | `4px, 8px, 12px, 20px, 32px, 48px` | Escala de espaciado |
| `--fuente-base` | `"Segoe UI", system-ui, sans-serif` | Tipografía del sistema |
| `--transicion-base` | `160ms ease` | Transiciones de sobrevuelo y foco |

### 8.3 Componentes de estilo

| Clase | Descripción | RF |
|---|---|---|
| `.contenedor` | Ancho fijo y centrado | NFR-3 |
| `.tarjeta` | Superficie con borde, radio y sombra | NFR-2 |
| `.campo` | Campo de entrada con borde, foco naranja y mensaje de error debajo | RF-2, RF-14 |
| `.campo-error` | Variante con borde rojo y fondo de error | RF-2 |
| `.mensaje-error` | Caja de error general | RF-3 |
| `.boton-primario` | Azul, acción de entrar | RF-1 |
| `.boton-acento` | Naranja, acción de cerrar sesión | RF-6 |
| `.boton-neutro` | Transparente con borde, cancelar | RF-6 |
| `.modal-capa` / `.modal` / `.modal-acciones` | Diálogo de confirmación | RF-6 |
| `.titulo-pagina` | Título azul de cada pantalla | NFR-2 |
| `.saludo` | Saludo de bienvenida | RF-5 |

### 8.4 Reglas transversales

- **Sin consultas de medios** en todo el proyecto (constitución 10, NFR-3).
- Sin `clamp()` y sin unidades relativas para el contenedor: el ancho es fijo.
- `:focus-visible` con anillo de `--color-foco` en todos los elementos interactivos.
- Mensajes de error con `role="alert"` y `aria-live="polite"`.
- El diálogo modal se cierra con `Escape` y al pulsar fuera del cuadro.
- Fuentes del sistema: no se carga ninguna tipografía externa (sin dependencias ni
  peticiones de red).

---

## 9. Trazabilidad completa RF → implementación

| RF | Dónde se implementa | Algoritmo / archivo |
|---|---|---|
| RF-1 | Respuesta 200 del punto de acceso + `iniciarSesion` + navegación de cliente | `api/sesion.ts`, `session.ts`, `login.ts` (D-02, D-03) |
| RF-2 | Validación de campos vacíos en cliente y servidor | `validarCamposObligatorios`, `login.ts`, `api/sesion.ts` |
| RF-3 | Mensaje genérico único en los tres fallos | `api/sesion.ts`, `login.ts` |
| RF-4 | Protección de ruta de `/bienvenida` | `protegerPagina`, `bienvenida.ts` |
| RF-5 | Saludo con `textContent` | `renderizarSaludo`, `bienvenida.ts` |
| RF-6 | Diálogo modal propio con confirmación y cancelación | `ModalConfirmacion.astro`, `solicitarCerrarSesion` (D-09) |
| RF-7 | Protección de ruta de `/bienvenida` tras la recarga (módulo reiniciado) | `session.ts`, `bienvenida.ts` |
| RF-8 | Marcado de la pantalla de inicio de sesión | `login.astro` |
| RF-9 | Protección de ruta de `/login` | `protegerPagina`, `login.ts` |
| RF-10 | `normalizarCredencial` y comparación sensible a mayúsculas | `credenciales.ts` (servidor) y `login.ts` (cliente) |
| RF-11 | Búsqueda por nombre de usuario con resultado único | `userRepository.buscarPorNombreUsuario`, `storage.json` |
| RF-12 | Deshabilitado del botón y bandera `envioRealizado` | `login.ts` |
| RF-13 | `textContent` en el saludo | `renderizarSaludo` (D-10) |
| RF-14 | `type="password"` en el campo | `login.astro` |
| NFR-1 | Todos los textos y mensajes en español | Todo el proyecto |
| NFR-2 | Paleta y componentes propios | `theme.css` (D-11) |
| NFR-3 | Anchos fijos, sin consultas de medios | `theme.css` (D-13) |
| NFR-4 | `scrypt` y `timingSafeEqual`, con los hash fuera del cliente | `hashing.ts`, `userRepository.ts` (D-05) |
| NFR-5 | `lint` y `dev` en verde antes de cada entrega | Comandos del proyecto |

### 9.1 Historias de usuario cubiertas

| HU | RF que la cubren |
|---|---|
| HU-1 | RF-1, RF-3, RF-8 |
| HU-2 | RF-4, RF-5, RF-7 |
| HU-3 | RF-6 |
| HU-4 | RF-4 |
| HU-5 | RF-2, RF-3 |

---

## 10. Verificación de los criterios de finalización

| Criterio de §8 de la spec | Cómo se comprueba |
|---|---|
| La pantalla de inicio de sesión muestra sus tres elementos y nada más | Cargar `/login` y revisar la pantalla antes de enviar |
| El inicio de sesión válido lleva a la bienvenida | Enviar credenciales correctas de `docs/usuarios.md` |
| Los dos usuarios tienen nombres distintos | Inspeccionar `storage.json` |
| Credenciales documentadas | Leer `docs/usuarios.md` |
| La bienvenida muestra "Bienvenido/a, {nombreUsuario}" | Iniciar sesión y leer el saludo |
| El cierre pide confirmación y vuelve al inicio de sesión | Pulsar "Cerrar sesión", confirmar y comprobar la redirección |
| Sin sesión, la bienvenida redirige al inicio de sesión | Escribir `/bienvenida` en la barra de direcciones; usar los botones atrás y adelante |
| Recargar la bienvenida vuelve al inicio de sesión | Pulsar F5 en `/bienvenida` |
| Credenciales incorrectas muestran el mensaje genérico | Enviar un usuario inexistente y luego una contraseña incorrecta: el mensaje es idéntico |
| El campo de contraseña oculta lo escrito | Escribir en el campo y comprobar que no se ve el texto |
| El nombre de usuario se muestra literal | Iniciar sesión con un nombre que contenga `<b>` y comprobar que se ve tal cual |
| Las contraseñas se almacenan con hash | Inspeccionar `storage.json`: no hay contraseñas en claro |
| Interfaz y mensajes en español | Recorrer las dos pantallas |
| `lint` y `dev` en verde | Ejecutar los dos comandos del proyecto |

---

## 11. Riesgos y supuestos

| # | Riesgo / supuesto | Mitigación |
|---|---|---|
| R-01 | La navegación de cliente depende de `<ClientRouter />`; sin ella, el inicio de sesión perdería la identificación | Se añade en la plantilla base y se comprueba en el primer criterio de §10 |
| R-02 | `scrypt` con coste 16384 añade latencia perceptible en entornos lentos | Coste parametrizado en el formato del hash; con dos usuarios de prueba es irrelevante y el cálculo ocurre en el servidor, no en el navegador |
| R-03 | La contraseña en claro de prueba queda escrita en `docs/usuarios.md` | Exigido por la spec (criterio de finalización). Se limita a las dos cuentas de práctica y nunca aparece en el código, en los registros de actividad ni en las respuestas de la API |
| R-04 | Los datos de los usuarios son provisionales | La spec los sitúa en fases futuras; la capa de datos queda encapsulada para que ampliarlos no afecte a la interfaz |
| R-05 | Sin herramienta de pruebas, la regresión se detecta tarde | La verificación se apoya en la lista manual de §10; un ejecutor de pruebas se puede incorporar en una spec posterior |

---

## 12. Orden de ejecución sugerido

1. Estructura inicial del proyecto Astro (`output: 'server'` y adaptador de Node) y scripts
   `dev` y `lint`. — constitución 1, 11
2. `theme.css` con la paleta, la tipografía y los componentes de estilo. — NFR-2, NFR-3
3. `userRepository.ts` + `storage.json` + script `generarHashes.ts`. — constitución 6, NFR-4
4. `hashing.ts` y `credenciales.ts` en el servidor. — RF-10, RF-3
5. `POST /api/sesion`. — RF-1, RF-3
6. `session.ts`, `validacionCredenciales.ts` y `login.astro`. — RF-1, RF-2, RF-8, RF-9, RF-12, RF-14
7. `bienvenida.astro`, protección de ruta y `ModalConfirmacion.astro`. — RF-4 a RF-7, RF-13
8. `docs/usuarios.md`. — D-14
9. Verificación manual de los criterios de §10 y paso de `lint` y `dev`. — NFR-5
