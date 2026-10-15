# Humo de derrape en las llantas

Extrae este ZIP en la carpeta del juego y reemplaza los archivos conservando las subcarpetas. Aplícalo después de **Vigilante_Kart8_Pradera_Seleccion_Corregida.zip**. Reemplaza también `index.html` e `index-offline.html` y vuelve a abrir el juego para cargar la nueva versión de los scripts.

## Comportamiento

- El humo sale de las dos llantas traseras al derrapar con velocidad suficiente.
- Los puntos de emisión siguen la inclinación del carro y la suspensión de cada llanta en pendientes y rampas.
- Cada puff aparece gradualmente, se expande, sube, pierde velocidad y se disipa mediante cuatro etapas del atlas.
- Continúa emitiendo humo cuando el derrape alcanza la carga de turbo, junto con las chispas actuales.
- Deja de emitir al soltar el derrape, ir lento, saltar, morir o quedar lejos de la cámara. El humo existente termina de disiparse.
- Al reiniciar o volver al hangar se limpian los efectos.

## Android

El humo usa una sola malla dinámica, un material y una textura compartidos. Límite de 24 puffs simultáneos en móvil y 40 en escritorio; 48 u 80 triángulos y una llamada de dibujo para todo el humo. Los puffs se reutilizan y se ordenan de atrás hacia delante antes de dibujarlos. Los carros a más de 100 unidades de la cámara no emiten humo nuevo.

La frecuencia de emisión depende del tiempo transcurrido, no de los frames. No añade luces, sombras, raycasts ni materiales por puff.

## Sprite

`assets/effects/drift_smoke_v1.png`: PNG RGBA de 512 × 512 con cuatro celdas en una cuadrícula de 2 × 2. Orden: humo fresco, expansión, humo aireado y disipación. Tiene margen transparente entre celdas y se muestrea sin mipmaps para evitar mezclar los frames.

Se creó con la herramienta integrada de generación de imágenes. Instrucción de arte: humo gris claro de neumáticos, cuatro etapas de expansión y disipación en un atlas cuadrado, formas redondeadas con bordes suaves, sombreado retro PS1, fondo transparente, sin fuego, vehículos, texto ni cuadrícula. Las celdas se centraron y redujeron a las dimensiones del juego.

## Archivos

- `js/effects.js`: emisión, pool, animación y dibujo del humo.
- `js/main.js`: emite los efectos después de actualizar la cámara.
- `index.html` e `index-offline.html`: rutas de módulos actualizadas para cargar el código nuevo.
- `scripts/validar-estructura.mjs`: comprueba el atlas.
- `tests/integracion.cjs`: verifica emisión, rechazo en el aire, límite del pool, chispas y disipación.
- `assets/effects/drift_smoke_v1.png`: sprite nuevo.

## Pruebas

`npm test` comprueba los módulos y las pruebas de física e integración con WASM y JavaScript.

La revisión en Chromium pasó con configuración móvil en WASM y JavaScript, y con configuración de escritorio. Verificó derrape real con humo y chispas, emisión desde ambas llantas en terreno plano, colinas y rampas, una sola llamada de dibujo, límites de 24/40 puffs, disipación y limpieza al volver al hangar. La frecuencia de emisión fue la misma a 24, 30 y 60 FPS dentro de cada perfil. La memoria de geometrías y texturas se mantuvo estable al reutilizar el pool y no hubo errores de ejecución. Estas pruebas no representan una medición de FPS en un Android físico.
