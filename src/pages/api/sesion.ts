import type { APIRoute } from 'astro'
import { buscarPorNombreUsuario } from '../../data/userRepository'
import { normalizarCredencial } from '../../lib/credenciales'
import { verificarContrasena } from '../../lib/hashing'

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

// Un único mensaje para los tres fallos: RF-3 prohíbe revelar cuál de los dos
// campos no coincide.
const MENSAJE_FALLO = 'Usuario o contraseña incorrectos'

function responder (cuerpo: RespuestaSesion, estado: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'content-type': 'application/json' }
  })
}

function responderFallo (estado: number): Response {
  return responder({ exito: false, mensaje: MENSAJE_FALLO }, estado)
}

/**
 * El cuerpo llega del exterior, así que los tipos declarados no bastan:
 * se comprueba en tiempo de ejecución antes de tocar sus propiedades.
 */
async function leerCredenciales (solicitud: Request): Promise<CredencialesRecibidas | null> {
  let cuerpo: unknown

  try {
    cuerpo = await solicitud.json()
  } catch {
    return null
  }

  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return null
  }

  const candidato = cuerpo as Record<string, unknown>

  if (typeof candidato.nombreUsuario !== 'string' || typeof candidato.contrasena !== 'string') {
    return null
  }

  return {
    nombreUsuario: candidato.nombreUsuario,
    contrasena: candidato.contrasena
  }
}

export const POST: APIRoute = async ({ request }) => {
  const credenciales = await leerCredenciales(request)

  if (credenciales === null) {
    return responderFallo(400)
  }

  // RF-10 se aplica a los dos valores: se recortan los extremos y se conserva
  // el interior, sin alterar la caja.
  const nombreUsuario = normalizarCredencial(credenciales.nombreUsuario)
  const contrasena = normalizarCredencial(credenciales.contrasena)

  if (nombreUsuario === '' || contrasena === '') {
    return responderFallo(400)
  }

  const usuario = buscarPorNombreUsuario(nombreUsuario)

  if (usuario === null) {
    return responderFallo(401)
  }

  if (!verificarContrasena(contrasena, usuario.contrasenaHash)) {
    return responderFallo(401)
  }

  return responder({ exito: true, nombreUsuario: usuario.nombreUsuario }, 200)
}
