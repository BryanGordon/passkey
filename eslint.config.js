import astro from 'eslint-plugin-astro'
import { defineConfig, globalIgnores } from 'eslint/config'
import { neostandard, plugins } from 'neostandard'

export default defineConfig([
  // Artefactos generados: no se revisan.
  globalIgnores(['.astro/', 'dist/', 'node_modules/']),

  // `ts: true` activa el análisis de TypeScript. Ninguna de las reglas que
  // habilita exige información de tipos, y `parserOptions.project` queda en
  // `null`: TypeScript 7.0 no expone la API del compilador (`createProgram` y
  // `TypeFlags` son `undefined`), así que typescript-eslint analiza con la copia
  // 6 anidada que fija el campo `overrides` de `package.json`.
  ...neostandard({ ts: true }),

  // `.astro`: parser, reglas y procesador propios del plugin.
  ...astro.configs['flat/recommended'],

  // El proyecto es TypeScript de punta a punta, así que el frontmatter y los
  // bloques <script> de un `.astro` también pueden llevar anotaciones de tipo:
  //  - `client-side-ts` extrae los bloques como `.ts` en vez de `.js`.
  //  - `parserOptions.parser` hace que el parser de Astro delegue en el de
  //    typescript-eslint, en lugar de fallar con `const x: string`.
  // Se reutiliza la instancia que exporta neostandard para no depender de un
  // paquete que no está declarado como dependencia directa.
  {
    files: ['**/*.astro'],
    processor: 'astro/client-side-ts',
    languageOptions: {
      parserOptions: {
        parser: plugins['typescript-eslint'].parser
      }
    }
  }
])
