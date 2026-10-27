# Usuarios de prueba

Credenciales de las dos cuentas registradas del sistema. Existen porque la interfaz no
muestra credenciales de ejemplo (fuera de alcance de la spec 001-mvp) y el criterio de
finalización exige que estén documentadas.

## Las dos cuentas

| Usuario | Nombre de usuario | Contraseña | Identificador |
|---|---|---|---|
| Usuario A | `ana` | `Ana2026Practica` | `usr-001` |
| Usuario B | `bruno` | `Bruno2026Practica` | `usr-002` |

Los dos usuarios tienen exactamente los mismos permisos. No existe usuario administrador,
de acuerdo con la constitución y con `Agents.md`.

## Cómo se almacena

En `src/data/storage.json` no hay contraseñas en claro, solo su hash:

```json
{
  "usuarios": [
    {
      "id": "usr-001",
      "nombreUsuario": "ana",
      "contrasenaHash": "scrypt$16384$<sal>$<hash>"
    }
  ]
}
```

El formato del hash es `scrypt$<coste>$<sal en hexadecimal>$<hash en hexadecimal>`:

| Parte | Valor | Significado |
|---|---|---|
| Algoritmo | `scrypt` | Función de derivación usada |
| Coste | `16384` | Factor de trabajo de `scrypt` |
| Sal | 16 bytes aleatorios | Un valor distinto por usuario |
| Hash | 64 bytes | Resultado de derivar la contraseña con la sal |

La comparación se hace con `timingSafeEqual`, de forma que el tiempo de respuesta no
revela cuántos caracteres correctos hay.

## Cómo se generan

El script `scripts/generarHashes.ts` crea el almacén a partir de las contraseñas en claro.
Las contraseñas se reciben como argumentos, nunca se escriben en el código:

```bash
node scripts/generarHashes.ts "ana:Ana2026Practica" "bruno:Bruno2026Practica"
```

Cada ejecución genera sales nuevas, por lo que los hash del archivo cambian aunque las
contraseñas sigan siendo las mismas. Las dos cuentas de este documento dejarían de
funcionar si se regenera la semilla sin volver a actualizarlas aquí.

## Nota de seguridad

Estas son credenciales de un ejercicio de práctica, con un almacén de datos local y sin
sesión en el servidor. Aun así:

- No reutilices estas contraseñas en ningún otro sistema.
- Si el proyecto deja de ser una práctica, cambia las contraseñas y regenera la semilla.
- La contraseña en claro solo existe en este documento; en el código, en el almacén y en
  las respuestas de la aplicación solo está su hash.
