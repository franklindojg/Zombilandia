# Cielo con sprites — Vigilante Kart 8

Extrae este ZIP en la carpeta principal del juego y reemplaza los archivos indicados. Conserva las subcarpetas `js`, `assets`, `scripts` y `tests`. Requiere la versión actual con las correcciones de rampas y apoyo de las llantas ya aplicadas.

## Cambios

- Cielo degradado de 360° con nubes, estrellas y luna o sol.
- Cinco paletas: azul al anochecer en pradera, atardecer cálido en desierto, azul frío en glaciar, rojizo en volcán y violeta en el sector orbital.
- Atlas PNG de 1024 × 512 con transparencia real y ocho celdas independientes. Incluye cuatro nubes, luna, sol, estrella y nebulosa.
- El cielo acompaña la posición de la cámara; conserva su orientación al girar o recorrer la arena.
- Los objetos del escenario ocultan los sprites del cielo mediante la profundidad normal del renderizado.

## Android

El cielo añade dos llamadas de dibujo: una cúpula y una malla que reúne todos los sprites. En móvil usa 70 estrellas, 12 nubes y un astro; el sector orbital añade una nebulosa. En escritorio usa 100 estrellas y 18 nubes.

Un atlas compartido se carga una sola vez y se reutiliza entre niveles. No añade sombras, luces, físicas, partículas de cielo ni texturas nuevas por sprite. Las geometrías y materiales de cada arena se liberan al cambiar de nivel.

## Archivos

- `js/sky.js`: construcción y seguimiento del cielo.
- `js/arena.js`: integración en los veinte niveles; incluye las correcciones actuales de terreno, carretera y rampas.
- `js/main.js`: actualización del cielo antes de dibujar cada frame.
- `assets/sky/sky_sprites_ps1.png`: atlas optimizado.
- `scripts/validar-estructura.mjs`: comprobación del recurso nuevo.
- `tests/mock-three.mjs`: soporte del nuevo renderizado en las pruebas de integración existentes.

## Arte

Atlas creado mediante la herramienta integrada de generación de imágenes. Instrucción de arte: ocho sprites aislados en cuatro columnas y dos filas, estilo retro PS1 con sombreado ilustrado, cuatro bancos de nubes, luna con cráteres, sol, estrella de cuatro puntas y nebulosa; colores neutros para teñir por bioma, fondo transparente, sin texto ni cuadrícula. Las celdas se redujeron y empaquetaron con margen transparente para evitar mezclar sprites al muestrear sus UV.

El archivo que consume el juego es `assets/sky/sky_sprites_ps1.png`; no necesita la imagen original de generación.

## Comprobación

`npm test` pasó: 23 módulos, 1500 escenarios numéricos JS/WASM, colisiones, rampas, apoyo de llantas y reinicio del combate en ambos motores.

La revisión en Chromium con configuración gráfica móvil cubrió los veinte niveles y cuatro direcciones de cámara por nivel: dos llamadas de dibujo para el cielo, geometrías estables tras cambiar de arena, atlas reutilizado y sin errores de carga o ejecución. También se comprobó que el cielo no cubriera el terreno, el regreso al hangar y el cambio entre orientación horizontal y vertical. Se inspeccionó visualmente una arena de cada bioma. Estas comprobaciones no representan una medición de FPS en un dispositivo Android físico.
