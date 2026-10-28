import { normalizarCredencial } from '../lib/credenciales'
import { navegarA } from './navegacion'
import { iniciarSesion, obtenerUsuarioActual } from './session'
import { validarCamposObligatorios } from './validacionCredenciales'

/*
 * Lógica de la pantalla de inicio de sesión. La pantalla solo muestra estado y
 * emite eventos; las decisiones se toman aquí (constitución 4, D-08).
 *
 * Contrato de marcado que debe cumplir `src/pages/login.astro` (T-23):
 * - Un formulario con id "formulario-login" y un botón `type="submit"`.
 * - Cada campo dentro de un contenedor `.campo` que agrupa la etiqueta, el
 *   control (`input` con atributo `name`) y un `<p class="mensaje-error" hidden>`.
 *   El `name` del control es la clave con la que se busca el error del campo.
 * - Un contenedor de error general con id "error-general", oculto al principio.
 */

const RUTA_SESION = '/api/sesion'
const RUTA_BIENVENIDA = '/bienvenida'
const ID_FORMULARIO = 'formulario-login'
const ID_ERROR_GENERAL = 'error-general'

/*
 * RF-3 exige este texto cuando las credenciales no coinciden: se muestra el
 * mensaje que envía el servidor, que es único para los tres fallos. El respaldo
 * se usa cuando la respuesta de error no trae un mensaje legible (por ejemplo,
 * un 500 con cuerpo HTML).
 */
const MENSAJE_ERROR_COMUNICACION = 'No se pudo completar la solicitud. Inténtalo de nuevo.'

/*
 * RF-12, segunda parte: mientras `envioRealizado` sea verdadero no se procesa
 * otro envío. Es una bandera de módulo y se reinicia al vincular un formulario
 * nuevo, porque el router de cliente no recarga los módulos al navegar.
 */
let envioRealizado = false

// El formulario ya vinculado permite repetir la inicialización sin acumular
// escuchadores cuando `astro:page-load` se dispara más de una vez.
let formularioVinculado: HTMLFormElement | null = null

/**
 * Inicializa la pantalla de inicio de sesión.
 *
 * Es idempotente por formulario: cada navegación del router trae un formulario
 * nuevo, que se vincula una sola vez. Reiniciar aquí `envioRealizado` evita que
 * la bandera quede activa al volver a la pantalla tras cerrar sesión, caso en
 * el que el módulo sigue cargado y el formulario no respondería nunca.
 */
export function inicializarLogin (): void {
  const formulario = document.querySelector<HTMLFormElement>(`#${ID_FORMULARIO}`)

  /*
   * Si la pantalla no está montada, esta función es inerte. Se comprueba antes
   * de nada porque termina enganchada a todas las navegaciones: proteger o
   * redirigir desde una pantalla que no corresponde pediría una navegación que
   * vuelve a disparar la carga, y eso se realimentaría.
   */
  if (formulario === null) {
    return
  }

  // RF-9: con la sesión ya iniciada, la pantalla de acceso no tiene sentido.
  if (obtenerUsuarioActual() !== null) {
    navegarA(RUTA_BIENVENIDA)

    return
  }

  // Mismo DOM: ya está vinculado, no se acumulan escuchadores.
  if (formulario === formularioVinculado) {
    return
  }

  formularioVinculado = formulario
  envioRealizado = false

  const botonEnvio = formulario.querySelector<HTMLButtonElement>('button[type="submit"]')

  if (botonEnvio !== null) {
    botonEnvio.disabled = false
  }

  formulario.addEventListener('submit', manejarEnvioLogin)
}

async function manejarEnvioLogin (evento: SubmitEvent): Promise<void> {
  evento.preventDefault()

  if (envioRealizado) {
    return
  }

  // `currentTarget` deja de ser válido tras el primer `await`, así que se
  // resuelve ahora y no más adelante.
  const formulario = evento.currentTarget

  if (!(formulario instanceof HTMLFormElement)) {
    return
  }

  const botonEnvio = formulario.querySelector<HTMLButtonElement>('button[type="submit"]')
  const contenedorErrorGeneral = document.getElementById(ID_ERROR_GENERAL)

  envioRealizado = true

  if (botonEnvio !== null) {
    botonEnvio.disabled = true
  }

  const valores = leerCamposDelFormulario(formulario)
  const errores = validarCamposObligatorios(valores)

  limpiarErroresVisibles(formulario, contenedorErrorGeneral)

  // RF-2: los campos vacíos se señalan junto a su campo y no se contacta con el
  // servidor.
  if (Object.keys(errores).length > 0) {
    mostrarErroresPorCampo(formulario, errores)
    rehabilitarEnvio(botonEnvio)

    return
  }

  let respuesta: Response

  try {
    respuesta = await fetch(RUTA_SESION, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreUsuario: normalizarCredencial(valores.nombreUsuario ?? ''),
        contrasena: valores.contrasena ?? ''
      })
    })
  } catch {
    mostrarErrorGeneral(contenedorErrorGeneral, MENSAJE_ERROR_COMUNICACION)
    rehabilitarEnvio(botonEnvio)

    return
  }

  if (!respuesta.ok) {
    const cuerpo = await leerCuerpoJson(respuesta)

    // RF-3: se muestra el mensaje del servidor, idéntico para usuario
    // inexistente, contraseña incorrecta y campo vacío.
    mostrarErrorGeneral(contenedorErrorGeneral, leerMensaje(cuerpo) ?? MENSAJE_ERROR_COMUNICACION)
    rehabilitarEnvio(botonEnvio)

    return
  }

  const nombreUsuario = leerNombreUsuario(await leerCuerpoJson(respuesta))

  // Una respuesta 200 sin nombre utilizable no puede iniciar sesión: se trata
  // como fallo en lugar de guardar un estado inválido.
  if (nombreUsuario === null) {
    mostrarErrorGeneral(contenedorErrorGeneral, MENSAJE_ERROR_COMUNICACION)
    rehabilitarEnvio(botonEnvio)

    return
  }

  iniciarSesion(nombreUsuario)

  // El envío queda cerrado (RF-12) y el botón sigue deshabilitado: la pantalla
  // va a cambiar.
  await navegarA(RUTA_BIENVENIDA)
}

/**
 * Devuelve un valor por cada control con nombre del formulario. La clave es el
 * atributo `name`, la misma que espera `validarCamposObligatorios`.
 */
function leerCamposDelFormulario (formulario: HTMLFormElement): Record<string, string> {
  const valores: Record<string, string> = {}

  new FormData(formulario).forEach((valor, campo) => {
    if (typeof valor === 'string') {
      valores[campo] = valor
    }
  })

  return valores
}

function camposDelFormulario (formulario: HTMLFormElement): HTMLElement[] {
  return Array.from(formulario.querySelectorAll<HTMLElement>('.campo'))
}

function limpiarErroresVisibles (
  formulario: HTMLFormElement,
  contenedorErrorGeneral: HTMLElement | null
): void {
  for (const campo of camposDelFormulario(formulario)) {
    campo.classList.remove('campo-error')

    const mensaje = campo.querySelector<HTMLElement>('.mensaje-error')

    if (mensaje !== null) {
      mensaje.hidden = true
      mensaje.textContent = ''
    }
  }

  if (contenedorErrorGeneral !== null) {
    contenedorErrorGeneral.hidden = true
    contenedorErrorGeneral.textContent = ''
  }
}

function mostrarErroresPorCampo (
  formulario: HTMLFormElement,
  errores: Record<string, string>
): void {
  for (const campo of camposDelFormulario(formulario)) {
    const control = campo.querySelector<HTMLInputElement>('input[name]')

    if (control === null) {
      continue
    }

    const mensaje = errores[control.name]

    if (mensaje === undefined) {
      continue
    }

    const contenedorMensaje = campo.querySelector<HTMLElement>('.mensaje-error')

    if (contenedorMensaje === null) {
      continue
    }

    campo.classList.add('campo-error')
    contenedorMensaje.textContent = mensaje
    contenedorMensaje.hidden = false
  }
}

function mostrarErrorGeneral (contenedor: HTMLElement | null, mensaje: string): void {
  if (contenedor === null) {
    return
  }

  contenedor.textContent = mensaje
  contenedor.hidden = false
}

/** Rehabilita el envío tras un fallo: el usuario debe poder corregir y reintentar. */
function rehabilitarEnvio (botonEnvio: HTMLButtonElement | null): void {
  envioRealizado = false

  if (botonEnvio !== null) {
    botonEnvio.disabled = false
  }
}

async function leerCuerpoJson (respuesta: Response): Promise<unknown> {
  try {
    return await respuesta.json()
  } catch {
    return null
  }
}

/**
 * El cuerpo llega del exterior: el tipo declarado no basta y se comprueba en
 * tiempo de ejecución antes de tocar sus propiedades.
 */
function leerNombreUsuario (cuerpo: unknown): string | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return null
  }

  const candidato = cuerpo as Record<string, unknown>

  return typeof candidato.nombreUsuario === 'string' ? candidato.nombreUsuario : null
}

function leerMensaje (cuerpo: unknown): string | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return null
  }

  const candidato = cuerpo as Record<string, unknown>

  return typeof candidato.mensaje === 'string' ? candidato.mensaje : null
}

/*
 * RF-1, RF-4, RF-7 y RF-9: la inicialización se engancha a `astro:page-load`,
 * que se dispara en cada navegación del router y también en la primera carga.
 *
 * Es imprescindible: Astro ejecuta el script de cada página una sola vez, la
 * primera vez que se visita. Sin este enganche, al llegar a una pantalla por
 * navegación de cliente su inicialización no se ejecutaría nunca.
 *
 * Como el módulo se carga una sola vez, el escuchador sobrevive a las
 * navegaciones; por eso la inicialización es inerte cuando su pantalla no está
 * montada y se vincula una sola vez por DOM.
 */
document.addEventListener('astro:page-load', inicializarLogin)
