/**
 * Estado de autenticación del cliente (D-03).
 *
 * Vive solo en la memoria de este módulo: no se guarda en ningún almacén
 * persistente del navegador. De ahí el comportamiento que exige la
 * especificación: la navegación de cliente conserva la sesión (RF-1), mientras
 * que una recarga reinicia el módulo y la pierde (RF-7).
 *
 * El valor es el nombre de usuario, no la contraseña ni el hash: el servidor no
 * entrega nada más en la respuesta de `POST /api/sesion`.
 */
let usuarioActual: string | null = null

export function iniciarSesion (nombreUsuario: string): void {
  usuarioActual = nombreUsuario
}

export function cerrarSesion (): void {
  usuarioActual = null
}

export function obtenerUsuarioActual (): string | null {
  return usuarioActual
}
