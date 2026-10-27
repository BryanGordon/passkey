import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const ALGORITMO = 'scrypt'
const COSTE = 16384
const LONGITUD_SAL = 16
const LONGITUD_HASH = 64

export function generarHash (contrasenaPlano: string): string {
  const sal = randomBytes(LONGITUD_SAL)
  const hash = scryptSync(contrasenaPlano, sal, LONGITUD_HASH, { N: COSTE })

  return `${ALGORITMO}$${COSTE}$${sal.toString('hex')}$${hash.toString('hex')}`
}

function tieneCuatroPartes (partes: string[]): partes is [string, string, string, string] {
  return partes.length === 4
}

export function verificarContrasena (contrasenaPlano: string, hashAlmacenado: string): boolean {
  const partes = hashAlmacenado.split('$')

  if (!tieneCuatroPartes(partes)) {
    return false
  }

  const [algoritmo, costeTexto, salHex, hashHex] = partes

  if (algoritmo !== ALGORITMO) {
    return false
  }

  const coste = Number.parseInt(costeTexto, 10)

  if (!Number.isFinite(coste) || coste <= 0) {
    return false
  }

  const sal = Buffer.from(salHex, 'hex')
  const hashEsperado = Buffer.from(hashHex, 'hex')

  if (hashEsperado.length === 0) {
    return false
  }

  const hashCalculado = scryptSync(contrasenaPlano, sal, hashEsperado.length, { N: coste })

  return timingSafeEqual(hashCalculado, hashEsperado)
}
