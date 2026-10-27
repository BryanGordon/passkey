/**
 * Descarta los espacios en blanco de los extremos y conserva intacto el interior.
 *
 * No altera la caja de los valores en ningún punto: RF-10 exige que la
 * comparación distinga mayúsculas y minúsculas.
 */
export function normalizarCredencial (valor: string): string {
  return valor.trim()
}

/**
 * Compara dos credenciales después de normalizarlas.
 *
 * Es sensible a mayúsculas: `"ana"` y `"Ana"` no coinciden.
 */
export function compararCredenciales (valorEsperado: string, valorRecibido: string): boolean {
  return normalizarCredencial(valorEsperado) === normalizarCredencial(valorRecibido)
}
