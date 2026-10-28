import { normalizarCredencial } from '../lib/credenciales'

export const MENSAJE_CAMPO_OBLIGATORIO = 'Este campo es obligatorio'

/**
 * Devuelve un mensaje por cada campo cuyo valor quede vacío al recortar los
 * extremos. Un valor formado solo por espacios cuenta como vacío.
 *
 * No se considera vacío el texto que solo tiene espacios en medio: `"a b"` es
 * un valor válido.
 *
 * Se reutiliza la normalización de credenciales para que «recortar» signifique
 * exactamente lo mismo aquí y en la comparación de RF-10. Así un tabulador o un
 * espacio duro tampoco pasan como contenido.
 *
 * La lógica vive aquí y no en el componente: las pantallas solo muestran el
 * mapa resultante (D-08).
 */
export function validarCamposObligatorios (valores: Record<string, string>): Record<string, string> {
  const errores: Record<string, string> = {}

  for (const [campo, valor] of Object.entries(valores)) {
    if (normalizarCredencial(valor) === '') {
      errores[campo] = MENSAJE_CAMPO_OBLIGATORIO
    }
  }

  return errores
}
