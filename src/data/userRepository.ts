import datosAlmacen from './storage.json'

export interface UsuarioAlmacenado {
  id: string
  nombreUsuario: string
  contrasenaHash: string
}

export interface AlmacenUsuarios {
  usuarios: UsuarioAlmacenado[]
}

// La asignación es la validación: si `storage.json` deja de tener la forma
// esperada, `tsc` falla aquí en vez de hacerlo en tiempo de ejecución.
const almacen: AlmacenUsuarios = datosAlmacen

/**
 * Devuelve el usuario cuyo nombre coincide exactamente con el recibido.
 *
 * La comparación distingue mayúsculas y minúsculas, y no recorta espacios:
 * normalizar el valor recibido es responsabilidad de quien llama (RF-10).
 */
export function buscarPorNombreUsuario (nombreUsuario: string): UsuarioAlmacenado | null {
  const encontrado = almacen.usuarios.find((usuario) => usuario.nombreUsuario === nombreUsuario)

  return encontrado ?? null
}
