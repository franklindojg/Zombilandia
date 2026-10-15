# Pradera verde y desierto de tierra

Extrae este ZIP en la carpeta principal del juego y reemplaza los archivos conservando las subcarpetas. Aplícalo sobre la versión actual que ya incluye cielo con sprites y las correcciones de rampas y llantas.

## Escenarios

- **Pradera, niveles 1–4:** suelo verde y circuito de pasto con un tono algo más oscuro; cerca perimetral de madera con tres tablas horizontales y huecos transparentes.
- **Desierto, niveles 5–8:** conserva exactamente los sprites marrones de suelo y pista que utilizaba la pradera; barrera de bloques de cemento.
- Glaciar, volcán y sector orbital conservan sus superficies y barreras.

Se actualizaron los nombres descriptivos de los biomas en el menú y el HUD. Las rampas, agarre, límites de la arena, armas y apoyo de las llantas mantienen su funcionamiento actual.

## Sprites

| Archivo | Uso |
| --- | --- |
| `assets/arena/meadow_ground.png` | Prado verde, 512 × 512 |
| `assets/arena/meadow_road.png` | Circuito de pasto, 512 × 512; el material ajusta su tono |
| `assets/arena/desert_ground.png` | Suelo de tierra anterior, 256 × 256 |
| `assets/arena/desert_road.png` | Pista de tierra anterior, 256 × 256 |
| `assets/arena/wooden_fence.png` | Cerca de madera, RGBA 512 × 256 |

## Rendimiento y terreno

La cerca usa una sola malla y una textura compartida, con recorte de alpha para dejar transparentes los huecos. No agrega una malla por poste ni una capa de transparencias ordenadas. Tiene 512 triángulos, sigue el terreno mediante 256 segmentos y queda ligeramente enterrada por la base para evitar huecos en las colinas. Se reutiliza la textura entre niveles y se liberan geometría y material al cambiar de arena.

El nuevo material de pasto y la cerca se generaron mediante la herramienta integrada de generación de imágenes. Instrucciones de arte: pasto verde visto desde arriba, repetible, estilo retro PS1 con hojas cortas, variación moderada y sin objetos; cerca frontal de madera cálida con tres travesaños y postes, repetible horizontalmente y fondo transparente. Los archivos se redujeron a las dimensiones del juego conservando la transparencia de la cerca.

## Validación

`npm test` pasó: 23 módulos, 1500 escenarios JS/WASM, física, rampas y apoyo de las llantas; reinicio del combate en ambos motores.

La revisión gráfica cubrió los veinte niveles con configuración móvil en Chromium. Comprobó una sola llamada de dibujo para la cerca, su adaptación a las colinas de los cuatro niveles de pradera, la reutilización de su textura, la liberación de geometrías y la carga de los sprites sin errores. Se inspeccionaron visualmente la pradera, la cerca y el desierto. No mide FPS en un dispositivo Android físico.
