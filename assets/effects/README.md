# Efectos PS1 · versión 2

Archivo integrado: `assets/effects/ps1_particles_v2.png`, 512 × 512 píxeles, RGBA real.

| Celda | UV | Uso |
|---|---|---|
| Superior izquierda | u 0–0.5, v 0.5–1 | Polvo de conducción |
| Superior derecha | u 0.5–1, v 0.5–1 | Humo de neumáticos |
| Inferior izquierda | u 0–0.5, v 0–0.5 | Impacto de bala / choque |
| Inferior derecha | u 0.5–1, v 0–0.5 | Derrape cargado |

Generado con la herramienta integrada de generación de imágenes y reducido para el juego. No es necesario extraer cada celda: el módulo `js/effects.js` utiliza cuatro geometrías UV con una sola textura. Máximo 24 partículas en móvil y 40 en escritorio; efectos visibles dentro de 170 unidades de la cámara.

## Prompt utilizado

Use case: stylized-concept. Asset type: in-game particle sprite atlas for a low-poly PS1 kart vehicular combat game, flat camera-facing billboard textures. Primary request: one square transparent PNG atlas with exactly four equally-sized square cells in a strict 2 by 2 grid, no drawn grid lines. Top-left cell: one compact warm beige dust puff, expanding lumpy angular clouds. Top-right cell: one compact soft grey tire smoke puff. Bottom-left cell: one golden orange impact spark starburst, energetic short angular streaks. Bottom-right cell: one electric cyan blue drift spark burst with short lightning streaks. Style: crunchy low-resolution hand-painted PlayStation 1 game effects, chunky angular silhouette and limited colors, not photorealistic. Composition: every subject centered at the exact center of its quadrant, fully contained inside the quadrant with at least 15 percent transparent padding on all edges; no overlapping cells. Entire backdrop genuinely transparent, not checkerboard. No cars, characters, roads, props, text, labels, borders or ground shadows. All four sprites must be clean isolated game assets.
