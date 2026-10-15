# Sprites de bloques de cemento

Cuatro sprites opacos de 256 × 256 píxeles, usados en `js/arena.js` para el muro perimetral.

| Archivo | Variante | Arena |
|---|---|---|
| `cement_blocks.png` | Cemento gris | Pradera y sector sidéreo |
| `cement_blocks_weathered.png` | Cemento desgastado | Desierto |
| `cement_blocks_dark.png` | Cemento oscuro | Volcán |
| `cement_blocks_light.png` | Cemento claro | Glaciar |

Cada tile tiene cuatro bloques por fila y ocho hileras, con juntas alternadas. La repetición se ajusta en los UV de la pared: aproximadamente 1.2 m por bloque horizontal y 0.6 m por hilera, sin estirar el sprite sobre todo el perímetro. Se reutilizan las cuatro texturas entre las veinte arenas. No se agregan mallas ni luces.

Generación con la herramienta integrada de imágenes. Las cuatro celdas del atlas se prepararon como sprites independientes para el juego, conservando los filtros PS1 y el tamaño de potencia de dos.

## Prompt utilizado

Use case: stylized-concept. Asset type: a production-ready opaque sprite atlas of seamless cement masonry wall textures for a low-poly PlayStation 1 3D kart game. Primary request: one square atlas laid out as EXACTLY 2 by 2 equal square texture tiles touching with no margins or gutters. Every quadrant is a flat front-facing orthographic seamless concrete cinder-block wall texture, filled edge to edge. Each quadrant has exactly 4 blocks across and 8 masonry courses vertically, rectangular block faces with width twice their height, staggered running bond, adjacent rows offset by half a block, narrow straight mortar joints. Top-left quadrant: medium neutral gray cement blocks, lightly rough. Top-right quadrant: weathered medium gray cement blocks, gentle gray dust and subtle mottling. Bottom-left quadrant: darker charcoal gray cement blocks, still easily visible mortar and faces. Bottom-right quadrant: light cool gray cement blocks. All four tiles share exactly the same grid scale and mortar spacing and each one must individually repeat seamlessly horizontally and vertically. Style: hand-painted low-resolution PS1 pixel-art environment texture with restrained rough cement pores and sparse subtle dither, simple readable masonry, no noisy camouflage patches. Lighting completely flat and even, no perspective, no directional shadows, no highlights or vignette. No plants, doors, windows, holes, buildings, terrain, labels, numbers, text, borders or transparent areas. This is a usable game texture atlas, not a mockup or a photographed wall. Neutral gray palette; avoid red brick and beige sandstone.
