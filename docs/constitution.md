# Constitución del Proyecto

1. Stack: Astro (última versión estable) + TypeScript 7 + ESLint 9 con reglas neostandard. Sin dependencias nuevas sin justificación.
2. Toda funcionalidad nace de una spec en `docs/specs/`: no hay código sin spec, ni spec sin código que la implemente.
3. La spec define "qué" y "para quién"; el código define "cómo". La spec no contiene código y el código no contiene requisitos.
4. La lógica de autenticación y sesión vive en módulos independientes; los componentes de Astro solo muestran estado y envían eventos.
5. El estado de sesión se valida en el servidor; el cliente nunca decide si un usuario está autenticado.
6. Los datos de los dos usuarios se guardan únicamente en `src/data/storage.json` y se leen/escriben a través de una capa de datos aislada.
7. Las contraseñas se almacenan hasheadas y nunca aparecen en logs, errores ni respuestas.
8. La interfaz y los mensajes están en español; las variables usan camelCase.
9. Estética moderna con paleta azul y un color complementario; no se usan colores genéricos.
10. El diseño no se optimiza para responsive: no se añaden media queries ni adaptaciones por dispositivo.
11. Ningún cambio se entrega sin pasar `lint` y `dev`; se rechaza el código que incumpla cualquier punto anterior.
12. Excepción: la spec 001-mvp opera sin sesión por ser un ejercicio de práctica; el estado de la sesión vive en la pantalla y el cliente decide la autenticación. El resto de specs exigirán validación en servidor.
