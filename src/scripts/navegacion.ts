import { navigate } from 'astro:transitions/client'
import { obtenerUsuarioActual } from './session'

/**
 * Navega a otra ruta sin recargar el documento.
 *
 * Se apoya en el router de `astro:transitions/client` y nunca en una asignación
 * directa a la ubicación del navegador: esa recarga completa reiniciaría el
 * módulo de sesión y expulsaría al usuario que acaba de identificarse (RF-1).
 *
 * Devuelve la promesa del router: quien necesite esperar a que termine puede
 * hacerlo, y quien no, la ignora. No se captura el error en silencio.
 */
export function navegarA (ruta: string): Promise<void> {
  return navigate(ruta)
}

/**
 * Protege una pantalla que requiere sesión.
 *
 * Si no hay usuario identificado navega a la ruta indicada y devuelve `false`,
 * de modo que quien llama pueda detener su inicialización. Se compara con
 * `null` y no por falsedad: el estado válido es un nombre de usuario o `null`.
 */
export function protegerPagina (rutaPermitidaSinSesion: string): boolean {
  if (obtenerUsuarioActual() === null) {
    // La navegación se lanza sin esperarla: esta función responde de forma
    // síncrona para que el llamador decida si continúa inicializando. Si el
    // router fallara, la promesa rechazada conserva el error original en la
    // consola, que es más útil que envolverlo en un mensaje propio.
    navegarA(rutaPermitidaSinSesion)

    return false
  }

  return true
}
