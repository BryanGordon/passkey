import { navegarA, protegerPagina } from './navegacion'
import { cerrarSesion, obtenerUsuarioActual } from './session'

/*
 * Lógica de la pantalla de bienvenida. La pantalla solo muestra estado y emite
 * eventos; las decisiones se toman aquí (constitución 4).
 *
 * Contrato de marcado que debe cumplir `src/pages/bienvenida.astro` (T-27) y el
 * componente `ModalConfirmacion.astro` (T-26):
 * - Un elemento con id "saludo-usuario" donde se escribe el saludo completo.
 * - Un botón con id "boton-cerrar-sesion".
 * - Una capa de modal con id "modal-cierre", oculta al principio con `hidden`,
 *   que contiene el cuadro del diálogo.
 * - Dos botones dentro del diálogo: "cancelar-cierre" y "confirmar-cierre".
 */

const RUTA_LOGIN = '/login'
const ID_SALUDO = 'saludo-usuario'
const ID_BOTON_CIERRE = 'boton-cerrar-sesion'
const ID_MODAL = 'modal-cierre'
const ID_CANCELAR = 'cancelar-cierre'
const ID_CONFIRMAR = 'confirmar-cierre'

const TEXTO_SALUDO = 'Bienvenido/a'

// Identidad de la pantalla ya vinculada: repetir la inicialización sobre el
// mismo DOM no debe acumular escuchadores.
let modalVinculado: HTMLElement | null = null

// El cierre con Escape se escucha en el documento porque el foco puede estar en
// cualquier punto del diálogo. Se guarda la referencia para retirar la anterior
// al vincular una pantalla nueva y no dejar escuchadores apuntando a nodos que
// ya no están en el documento.
let manejarTeclaActivo: ((evento: KeyboardEvent) => void) | null = null

/**
 * Inicializa la pantalla de bienvenida.
 *
 * Es idempotente por capa de modal: cada navegación trae un DOM nuevo, que se
 * vincula una sola vez.
 */
export function inicializarBienvenida (): void {
  const capa = document.querySelector<HTMLElement>(`#${ID_MODAL}`)

  /*
   * Si la capa no está montada, esta pantalla no está en el documento y aquí no
   * hay nada que hacer. Se comprueba antes de proteger a propósito: proteger
   * desde una pantalla que no corresponde pediría una navegación que vuelve a
   * disparar la carga, y esa realimentación se convertiría en un bucle.
   */
  if (capa === null) {
    return
  }

  // RF-4 y RF-7: sin sesión no se muestra nada, se va a la pantalla de acceso.
  if (!protegerPagina(RUTA_LOGIN)) {
    return
  }

  if (capa === modalVinculado) {
    return
  }

  modalVinculado = capa

  renderizarSaludo()

  const botonCierre = document.querySelector<HTMLButtonElement>(`#${ID_BOTON_CIERRE}`)
  const botonCancelar = document.querySelector<HTMLButtonElement>(`#${ID_CANCELAR}`)
  const botonConfirmar = document.querySelector<HTMLButtonElement>(`#${ID_CONFIRMAR}`)

  botonCierre?.addEventListener('click', () => {
    abrirModal(capa, botonCancelar)
  })

  botonCancelar?.addEventListener('click', () => {
    cerrarModal(capa, botonCierre)
  })

  botonConfirmar?.addEventListener('click', () => {
    confirmarCierre(capa, botonCierre)
  })

  // Pulsar fuera del cuadro, sobre la capa, cierra el diálogo.
  capa.addEventListener('click', (evento) => {
    if (evento.target === capa) {
      cerrarModal(capa, botonCierre)
    }
  })

  if (manejarTeclaActivo !== null) {
    document.removeEventListener('keydown', manejarTeclaActivo)
  }

  manejarTeclaActivo = (evento) => {
    if (evento.key === 'Escape' && !capa.hidden) {
      cerrarModal(capa, botonCierre)
    }
  }

  document.addEventListener('keydown', manejarTeclaActivo)
}

/**
 * RF-5 y RF-13: el nombre se escribe con `textContent`, nunca interpretando su
 * contenido como marcado. Un nombre de usuario con etiquetas se muestra tal cual.
 */
function renderizarSaludo (): void {
  const usuario = obtenerUsuarioActual()
  const elementoSaludo = document.querySelector<HTMLElement>(`#${ID_SALUDO}`)

  if (usuario === null || elementoSaludo === null) {
    return
  }

  elementoSaludo.textContent = `${TEXTO_SALUDO}, ${usuario}`
}

/**
 * El foco entra en el diálogo al abrirlo. Si se quedara en el botón de detrás,
 * el teclado seguiría recorriendo la pantalla que el modal acaba de tapar.
 */
function abrirModal (capa: HTMLElement, focoInicial: HTMLElement | null): void {
  capa.hidden = false
  focoInicial?.focus()
}

function cerrarModal (capa: HTMLElement, disparador: HTMLElement | null): void {
  capa.hidden = true
  disparador?.focus()
}

/** RF-6: limpiar la sesión antes de navegar, o el acceso la rechazaría al volver. */
function confirmarCierre (capa: HTMLElement, disparador: HTMLElement | null): void {
  cerrarSesion()
  cerrarModal(capa, disparador)
  navegarA(RUTA_LOGIN)
}

/*
 * RF-4, RF-6 y RF-7: la inicialización se engancha a `astro:page-load`, que se
 * dispara en cada navegación del router y también en la primera carga.
 *
 * Sin este enganche, llegar a esta pantalla por navegación de cliente no la
 * inicializaría: Astro ejecuta el script de cada página una sola vez.
 *
 * Como el módulo se carga una sola vez, el escuchador sobrevive a las
 * navegaciones; por eso la inicialización es inerte cuando su pantalla no está
 * montada y se vincula una sola vez por DOM.
 */
document.addEventListener('astro:page-load', inicializarBienvenida)
