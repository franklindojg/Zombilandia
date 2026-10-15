# Pradera: modelos 3D de pacas y troncos

Extrae este ZIP sobre la versión actual del juego y reemplaza los archivos conservando sus subcarpetas. Reemplaza también ambos archivos HTML y vuelve a abrir el juego para cargar la revisión meadow-models-r1.

## Corrección

Las pacas y los troncos ahora son modelos 3D construidos con cajas y cilindros de baja poligonización. Tienen volumen, caras laterales, extremos y superficie superior. Su orientación queda fija en el escenario; al rodearlos se ven sus distintas caras.

Se generaron dos atlas de texturas planas para aplicar sobre las mallas mediante UVs. La paja y sus amarres cubren las caras de las pacas rectangulares; la espiral de paja cubre los extremos de las pacas redondas. La corteza cubre los laterales de los troncos y los anillos de madera sus tapas circulares.

## Distribución y colisión

Se conservan ocho variantes, los cuatro niveles de pradera y los espacios reservados para salidas, rampas, aterrizajes, armas y reparaciones.

| Nivel | Pacas | Troncos | Total |
| --- | ---: | ---: | ---: |
| 1 | 16 | 16 | 32 |
| 2 | 18 | 18 | 36 |
| 3 | 20 | 20 | 40 |
| 4 | 22 | 22 | 44 |

La base de los modelos sigue la pendiente del terreno. Su colisión usa una caja orientada con el ancho, profundidad y giro del objeto. La respuesta considera caras y esquinas y permite pasar por encima cuando el kart supera su altura. Los demás biomas mantienen la colisión circular existente.

Se mantienen el derrape optimizado, el humo y los 20 niveles desbloqueados de la versión de prueba.

## Android y archivos

Todos los modelos se agrupan en dos mallas estáticas con dos materiales y dos atlas compartidos. Las sombras reutilizan la textura existente en una tercera malla. Son tres llamadas de dibujo y entre 2384 y 3280 triángulos para estos objetos y sus sombras, según el nivel. No hay giro de objetos por frame ni shader de billboards.

- js/meadow-model-geometry.js: crea los ocho modelos cerrados y sus UVs y agrupa sus vértices en el mundo.
- js/meadow-layout.js: distribución, orientación, medidas y espacios reservados.
- js/meadow-props.js: modelos 3D, materiales, sombras y colliders.
- js/collision.js: colisión con cajas orientadas, conservando la respuesta de los demás obstáculos.
- js/arena.js: integración en las cuatro praderas.
- assets/arena/meadow_hay_materials_v1.png: atlas plano de paja y amarres, RGB de 1254 × 1254.
- assets/arena/meadow_logs_materials_v1.png: atlas plano de corteza y madera cortada, RGB de 1254 × 1254.
- index.html e index-offline.html: rutas actualizadas de los 27 módulos.
- scripts/validar-estructura.mjs, tests/integracion.cjs, tests/probar-modelos-pradera.mjs y package.json: validación actualizada.
- ARTE_Pradera_Prompts.md: instrucciones de generación de las texturas.

Las imágenes de objetos de la revisión anterior pueden permanecer en la carpeta de assets; esta revisión carga los nuevos atlas de materiales.

## Verificación

Pasó npm test: geometría cerrada y con volumen para los ocho modelos, UVs válidas, colisiones en caras y esquinas a cuatro ángulos, física, rampas, apoyo de llantas, derrape y comparación de 1500 escenarios entre JS y WASM.

Chromium verificó móvil con WASM y JavaScript y escritorio con WASM. Pasaron los cuatro niveles, los espacios reservados, la colisión, los saltos, la iluminación y la estabilidad de memoria y texturas después de seis reinicios. Se comprobó que los vértices permanecen fijos al orbitar la cámara desde cuatro ángulos y se revisó visualmente el volumen de los modelos dentro del juego. Estas pruebas no miden FPS en un teléfono físico.
