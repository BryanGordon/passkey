import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generarHash } from '../src/lib/hashing.ts'

const rutaAlmacen = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'storage.json')

interface SemillaUsuario {
  id: string
  nombreUsuario: string
  contrasenaHash: string
}

interface AlmacenUsuarios {
  usuarios: SemillaUsuario[]
}

function analizarArgumentos (argumentos: string[]): { nombreUsuario: string, contrasena: string }[] {
  return argumentos.map((argumento) => {
    const separador = argumento.indexOf(':')

    if (separador <= 0 || separador === argumento.length - 1) {
      throw new Error(`Argumento con formato inválido: "${argumento}". Se espera "nombreUsuario:contrasena".`)
    }

    return {
      nombreUsuario: argumento.slice(0, separador),
      contrasena: argumento.slice(separador + 1)
    }
  })
}

function construirAlmacen (usuarios: { nombreUsuario: string, contrasena: string }[]): AlmacenUsuarios {
  return {
    usuarios: usuarios.map((usuario, indice) => ({
      id: `usr-${String(indice + 1).padStart(3, '0')}`,
      nombreUsuario: usuario.nombreUsuario,
      contrasenaHash: generarHash(usuario.contrasena)
    }))
  }
}

const argumentos = process.argv.slice(2)

if (argumentos.length === 0) {
  console.error('Uso: node scripts/generarHashes.ts <nombreUsuario:contrasena> [<nombreUsuario:contrasena> ...]')
  process.exit(1)
}

const almacen = construirAlmacen(analizarArgumentos(argumentos))

mkdirSync(dirname(rutaAlmacen), { recursive: true })
writeFileSync(rutaAlmacen, `${JSON.stringify(almacen, null, 2)}\n`, 'utf8')

console.log(`Semilla escrita en ${rutaAlmacen}`)
for (const usuario of almacen.usuarios) {
  console.log(`  ${usuario.id}  ${usuario.nombreUsuario}  ${usuario.contrasenaHash.slice(0, 22)}...`)
}
