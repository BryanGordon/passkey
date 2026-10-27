# Spec 001 — MVP: inicio de sesión, bienvenida y cierre de sesión

## 1. Contexto y objetivo
El sistema es una aplicación web pensada para practicar el flujo de inicio de sesión.
Consta únicamente de tres momentos: una pantalla de inicio de sesión, una página de
bienvenida tras entrar y un botón para cerrar sesión.

Objetivo (el qué y el por qué): permitir que un usuario conocido se identifique, acceda
a una pantalla de bienvenida personalizada y pueda salir de ella, de forma simple y
comprensible. Se construye como ejercicio de práctica, no como un producto final.

## 2. Usuarios
- Usuario registrado A y usuario registrado B: dos personas con un nombre de usuario y
  una contraseña propios.
- Ambos tienen los mismos permisos; no existen roles distintos ni usuario administrador.
- No hay registro: solo pueden entrar los dos usuarios ya dados de alta.
- El nombre de usuario es único: los dos usuarios no pueden compartirlo.
- Las credenciales de los dos usuarios se documentan en la documentación del proyecto; no
  se muestran en la interfaz.

## 3. Historias de usuario
- HU-1: Como usuario registrado, quiero iniciar sesión con mi nombre de usuario y
  contraseña para acceder a la página de bienvenida.
- HU-2: Como usuario con sesión iniciada, quiero ver una página de bienvenida que me
  salude mostrando mi nombre de usuario.
- HU-3: Como usuario con sesión iniciada, quiero cerrar sesión para salir de la aplicación.
- HU-4: Como usuario sin sesión, quiero ser llevado a la pantalla de inicio de sesión si
  intento abrir la página de bienvenida.
- HU-5: Como usuario, quiero que el sistema me indique de forma clara qué está mal en mis
  datos para poder corregirlos.

## 4. Requisitos funcionales
### RF-1 Inicio de sesión válido
- **Cuando** el usuario envía nombre de usuario y contraseña correctos, el sistema
  **deberá** llevarlo a la página de bienvenida.
- **Mientras** el usuario no recargue la página, no cierre sesión ni abandone la
  aplicación, el sistema **deberá** mantener su identificación.

### RF-2 Campos obligatorios
- **Si** el usuario envía el formulario con el nombre de usuario o la contraseña vacíos o
  formados solo por espacios, **entonces** el sistema **deberá** mostrar un mensaje de
  campo obligatorio junto a cada campo vacío y no intentar la identificación.

### RF-3 Credenciales inválidas
- **Si** las credenciales enviadas no coinciden con ningún usuario registrado, **entonces**
  el sistema **deberá** mostrar el mensaje "Usuario o contraseña incorrectos" junto al
  formulario, sin indicar qué campo falló, y mantener al usuario en la pantalla de inicio
  de sesión.

### RF-4 Acceso a la bienvenida
- **Cuando** un usuario sin sesión intente abrir la página de bienvenida, el sistema
  **deberá** redirigirlo a la pantalla de inicio de sesión.
- **Cuando** un usuario navegue a la página de bienvenida sin sesión, con independencia de
  cómo se haya llegado (escritura directa, recarga o historial del navegador), el sistema
  **deberá** redirigirlo a la pantalla de inicio de sesión.

### RF-5 Saludo personalizado
- **Mientras** un usuario identificado esté en la página de bienvenida, el sistema
  **deberá** mostrar el texto "Bienvenido/a, {nombre de usuario}".

### RF-6 Cierre de sesión
- **Cuando** el usuario solicite cerrar sesión, el sistema **deberá** pedir confirmación
  con el mensaje "¿Seguro que quieres cerrar sesión?".
- **Si** el usuario confirma, el sistema **deberá** terminar la sesión y redirigir a la
  pantalla de inicio de sesión.
- **Si** el usuario cancela, el sistema **deberá** conservar la sesión y permanecer en la
  página de bienvenida.

### RF-7 Estado temporal
- **Cuando** el usuario identificado recargue la página de bienvenida, el sistema
  **deberá** tratar la sesión como terminada y mostrar la pantalla de inicio de sesión.

### RF-8 Pantalla de inicio de sesión
- El sistema **deberá** mostrar una pantalla de inicio de sesión con un campo de nombre de
  usuario, un campo de contraseña y un botón de envío.
- Antes de cualquier intento, la pantalla **deberá** mostrar únicamente esos elementos,
  sin mensajes de error ni contenido adicional.

### RF-9 Acceso a la pantalla de inicio de sesión
- **Cuando** un usuario con sesión iniciada abra la pantalla de inicio de sesión, el
  sistema **deberá** redirigirlo a la página de bienvenida.

### RF-10 Normalización y comparación de credenciales
- **Cuando** el sistema compare las credenciales, **deberá** ignorar los espacios en
  blanco al principio y al final de los valores introducidos.
- **Cuando** el sistema compare las credenciales, **deberá** distinguir entre mayúsculas y
  minúsculas en el nombre de usuario y en la contraseña.

### RF-11 Unicidad del nombre de usuario
- El sistema **deberá** considerar que cada nombre de usuario corresponde a un único
  usuario registrado; no se admiten nombres de usuario duplicados.

### RF-12 Envío único
- **Cuando** el usuario active el envío del formulario, el sistema **deberá** deshabilitar
  el botón de envío hasta que el proceso termine.
- **Si** el usuario ya ha enviado el formulario, el sistema **no deberá** procesar un nuevo
  envío hasta que la pantalla se recargue.

### RF-13 Tratamiento del nombre de usuario
- **Cuando** el sistema muestre el nombre de usuario en la interfaz, **deberá** mostrarlo
  de forma literal, sin interpretar su contenido como marcado o código.

### RF-14 Campo de contraseña
- **Mientras** el usuario escriba en el campo de contraseña, el sistema **deberá** ocultar
  los caracteres introducidos.

## 5. Requisitos no funcionales
- NFR-1 Idioma: la interfaz y todos los mensajes están en español.
- NFR-2 Estética: diseño moderno con paleta azul y un color complementario; no se usan
  colores genéricos.
- NFR-3 Responsive: el diseño está pensado para escritorio con anchura fija; no se optimiza
  para distintos dispositivos ni se añaden reglas de adaptación.
- NFR-4 Seguridad de credenciales: las contraseñas se almacenan hasheadas y nunca se
  muestran en mensajes, errores ni respuestas.
- NFR-5 Calidad: las verificaciones automáticas de estilo y el arranque del proyecto deben
  superarse antes de entregar cualquier cambio.

## 6. Casos límite
- Nombre de usuario vacío, contraseña vacía y ambos vacíos a la vez.
- Campos formados únicamente por espacios en blanco.
- Credenciales con espacios en blanco al inicio o al final (se recortan).
- Nombre de usuario con acentos, eñes, números, símbolos o emoji.
- Nombre de usuario con contenido similar a marcado (se muestra literal, sin ejecutarse).
- Contraseña con acentos, símbolos o espacios (solo se recortan los extremos).
- Doble clic o pulsación repetida de Enter sobre el botón de envío (el botón queda
  deshabilitado).
- Recargar la pantalla de inicio de sesión: debe permanecer en ella.
- Recargar la página de bienvenida: debe volver a inicio de sesión.
- Botón "atrás" o "adelante" del navegador tras iniciar y tras cerrar sesión.
- Abrir la pantalla de inicio de sesión estando ya identificado.
- Confirmar el cierre de sesión y cancelarlo.
- Intentar abrir la bienvenida directamente sin haber iniciado sesión.

## 7. Fuera de alcance
- Registro o alta de nuevos usuarios.
- Recuperación o cambio de contraseña.
- Bloqueo de cuenta tras intentos fallidos.
- "Recuérdame" o persistencia de la sesión al cerrar el navegador.
- Panel de administración o gestión de usuarios.
- Soporte multisesión (varios usuarios simultáneos).
- Verificación por correo o segundo factor (2FA).
- Credenciales de ejemplo visibles en la interfaz (se documentan aparte).
- Perfil de usuario y datos personales.
- Diseño adaptable a distintos dispositivos.
- Gestión o ampliación del conjunto de usuarios: la información de los usuarios se añadirá
  en fases futuras.

## 8. Criterios de finalización
- La pantalla de inicio de sesión muestra el campo de nombre de usuario, el campo de
  contraseña y el botón de envío, y nada más antes de cualquier intento.
- Un usuario puede iniciar sesión con sus credenciales válidas y llegar a la bienvenida.
- Los dos usuarios registrados tienen nombres de usuario distintos.
- Las credenciales de los dos usuarios están documentadas en la documentación del proyecto.
- La bienvenida muestra el texto "Bienvenido/a, {nombre de usuario}" con el usuario que
  entró.
- El cierre de sesión pide confirmación y devuelve a inicio de sesión.
- Sin sesión, la bienvenida redirige a inicio de sesión, sin importar si se accede por
  escritura, recarga o historial del navegador.
- Recargar la página de bienvenida devuelve a inicio de sesión.
- Las credenciales incorrectas muestran el mensaje "Usuario o contraseña incorrectos" junto
  al formulario, sin revelar qué campo falló.
- El campo de contraseña oculta siempre lo que se escribe.
- El nombre de usuario se muestra de forma literal.
- Las contraseñas se almacenan hasheadas.
- Los mensajes de error y la interfaz están en español.
- Las verificaciones de calidad del proyecto se superan.

## 9. Dudas abiertas
Ninguna pendiente. Las dudas de la revisión inicial quedaron resueltas y trasladadas a los
requisitos correspondientes:
- La validación de sesión en el servidor se exceptúa para esta spec (constitución, punto
  12); la identificación vive en la pantalla y dura hasta recargar, cerrar sesión o
  abandonar la aplicación.
- La comparación de credenciales descarta los espacios en los extremos y distingue
  mayúsculas de minúsculas (RF-10).
- El nombre de usuario es único (RF-11).
- La pantalla de inicio de sesión muestra únicamente el formulario (RF-8).
- El conjunto de usuarios y su formato se definirán en fases futuras; en este MVP se
  asume que siempre están disponibles.
