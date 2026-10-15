# Derrape optimizado — versión de prueba

Extrae este ZIP en la carpeta de tu última versión del juego y reemplaza los archivos, conservando las subcarpetas. Reemplaza también `index.html`, `index-offline.html` y `wasm/physics-core.wasm`. Después vuelve a abrir el juego. Los scripts y WASM tienen rutas versionadas para cargar esta actualización.

Es una actualización de la versión con pradera, desierto, rampas corregidas y humo. Conserva los 20 niveles desbloqueados para pruebas. Esta guía reemplaza la información de la primera revisión de humo.

## Conducción

- Mantén GAS, una dirección y DRIFT para iniciar el derrape. Ahora entra por encima de 12 unidades de velocidad hacia delante, aproximadamente 29 km/h en el HUD; antes exigía cerca de 67 km/h.
- Una vez iniciado, continúa mientras la velocidad hacia delante supere 9 unidades, aproximadamente 22 km/h, y mantengas dirección y DRIFT. Esta diferencia evita cortes por pequeñas variaciones de velocidad.
- La pérdida y recuperación de agarre son progresivas. El giro y el desplazamiento lateral son menos bruscos.
- Suelta DRIFT con al menos 50% de carga para activar el turbo. Perder velocidad, saltar o circular en reversa cancela la carga sin conceder un turbo.
- Los cambios se aplican en WebAssembly y en el motor JavaScript de respaldo. Se conserva la física de terreno, suspensión y rampas.

## Humo y rendimiento

El humo sale de las dos llantas traseras y sigue la inclinación del carro y la suspensión de cada rueda. Su intensidad responde al deslizamiento lateral y a la transición del derrape. Las partículas son más pequeñas y se disipan en 0,64–0,76 segundos, evitando que una nube cubra el kart.

| Perfil | Máximo simultáneo | Emisión del jugador |
| --- | ---: | ---: |
| Android: batería | 12 | Cada 0,18 s |
| Android: equilibrado o auto | 16 | Cada 0,14 s |
| Android: fluido | 18 | Cada 0,12 s |
| Escritorio | 32 | Cada 0,11 s |

En Android, cuando la resolución adaptativa baja de 0,9, el humo usa el presupuesto de batería. Los rivales emiten con menor frecuencia y reservan espacio para las llantas del jugador. Se rechazan efectos a más de 70 unidades de la cámara en móvil y 100 en escritorio.

Todo el humo se dibuja con una sola malla, material y textura. Sólo se ordenan, actualizan y dibujan los puffs vivos: dos triángulos por puff y una llamada de dibujo cuando hay humo, cero cuando no lo hay. Ya no se recorren todos los vértices para recalcular su esfera en cada frame. Los buffers se reutilizan y sólo se envía a la GPU su parte activa.

La emisión depende del tiempo, conserva las chispas del derrape cargado y deja de producir humo al soltar DRIFT, ir lento, saltar o morir. Al reiniciar o volver al hangar se limpian los efectos.

## Archivos

- `js/vehicles.js`: entrada, continuidad y recuperación progresiva del derrape.
- `js/wasm-physics.js`, `wasm/physics-core.c` y `wasm/physics-core.wasm`: la misma respuesta en ambos motores.
- `js/effects.js`: humo limitado por calidad, prioridad del jugador, intensidad y buffers activos.
- `js/main.js`: integración del humo después de actualizar la cámara.
- `js/state.js`: mantiene los 20 niveles desbloqueados.
- `index.html` e `index-offline.html`: cargan la nueva revisión de scripts.
- `assets/effects/drift_smoke_v1.png`: atlas RGBA de 512 × 512; se reutiliza el sprite existente.
- `tests/probar-wasm.mjs`, `tests/integracion.cjs` y `tests/mock-three.mjs`: comprobaciones actualizadas.

## Validación

`npm test` pasó: 1500 escenarios comparados entre JavaScript y WASM con tolerancia de 1e-7; entrada, continuidad, turbo, recuperación del agarre y rechazo en reversa/saltos; rampas y apoyo de llantas; carga de módulos e integración con ambos motores.

Chromium con perfil móvil verificó WASM y JavaScript, y también se probó escritorio. El humo salió de ambas llantas en suelo plano, colinas y rampas, con error de posición inferior a 0,005 unidades. Se comprobó una sola llamada de dibujo, dibujo de puffs activos, frecuencia equivalente a 24/30/60 FPS, límites, disipación y memoria estable al reutilizar el pool. También pasaron los cuatro modos de calidad, la reserva para el jugador, la intensidad variable y la limpieza con cero triángulos activos.

En la prueba de conducción móvil hubo hasta 12 puffs activos, frente a 19 en la revisión anterior. Esto mide el trabajo del efecto en la prueba de navegador; no es una medición de FPS en un teléfono Android físico.
