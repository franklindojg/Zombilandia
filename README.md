# Vigilante Kart 8 · Android · 1.4.0

Primera actualización de rendimiento, efectos y físicas sobre la versión adjunta 1.3.0. Conserva cinco vehículos por combate, veinte arenas, cinco biomas, las tres carrocerías, armas, personalización y exportación GLB.

## Qué cambió

- Simulación a pasos fijos de **60 Hz**, independiente del renderizado. Interpolación de posición y cámara con suavizado exponencial. Pausa de simulación al ocultar la aplicación y límite de recuperación después de un bloqueo.
- Perfiles **Auto**, **Ahorro (24 FPS)**, **Equilibrado (30 FPS)** y **Fluido (60 FPS)**. Son objetivos de renderizado; el dispositivo determina los FPS alcanzados. Auto reduce la resolución al sostenerse FPS bajos y la recupera gradualmente. El selector guarda su preferencia local.
- Agrupación de piezas estáticas por material, conservando ruedas, dirección, cabeza, suspensión, fogonazos y escudo animados. Geometría de terreno móvil de 64 × 64 frente a 90 × 90 segmentos: aproximadamente 49% menos triángulos de terreno. El resto de la escena también cuenta al medir triángulos.
- Una geometría/material reutilizados por tipo de proyectil, máximo 128 proyectiles activos, reciclaje al reiniciar. Ocultación real de efectos desactivados y HUD actualizado a 10 Hz, radar a 8 Hz.
- **Atlas nuevo de cuatro sprites PS1**: polvo, humo, chispas de impacto y chispas de derrape cargado. Una textura RGBA de 512 × 512; pool de hasta 24 partículas en móvil y 40 en PC. No se agregan luces dinámicas ni posprocesado.
- Carretera adaptada a las colinas; cámara por encima del terreno. Aparición de los carros mirando correctamente al centro.
- Choques con separación por masa y rebote según velocidad de aproximación. Los carros que ya se separan no reciben otro impulso. Diferencia de altura para evitar embestidas contra un carro en el aire; breve enfriamiento del daño de embestida.
- Obstáculos incluyen el radio del kart y conservan la velocidad tangencial al deslizarse. Resolución estable incluso con centros coincidentes.
- Rampas con dirección de subida, velocidad mínima, impulso dependiente de velocidad y enfriamiento. Cruzarlas por detrás no activa el salto.
- Ametralladora y misiles comprueban todo el segmento recorrido, incluyendo el desplazamiento del blanco, para evitar atravesarlo entre pasos.
- HUD compacto con radar visible, acciones en dos filas, áreas seguras y pantalla completa. Controles táctiles simultáneos con captura de punteros, cancelación y limpieza al cambiar de pantalla o aplicación.
- **Three.js y todas sus dependencias usadas ya están incluidas localmente.** `index.html` e `index-offline.html` funcionan sin CDN.

## Ejecutar

Descomprime el ZIP conservando las carpetas y, dentro de esa carpeta, ejecuta:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000/`. Se necesita HTTP/HTTPS porque el juego usa módulos ES y carga WASM: no abrir con `file://`.

Para Android, incluye `index.html`, `styles.css`, `android.css`, `js/`, `assets/`, `vendor/` y `wasm/` en tu contenedor WebView con origen local seguro, por ejemplo el `WebViewAssetLoader` que ya utilice tu proyecto. Este ZIP contiene el juego web: **no contiene un proyecto nativo Android, APK ni AAB**.

- `?debug=1`: FPS, objetivo, motor físico, resolución, llamadas de dibujo, triángulos y texturas.
- `?wasm=0`: comprobar la conducción con el respaldo JavaScript.
- Botón ⛶: pantalla completa y solicitud de orientación horizontal cuando el navegador lo permita.
- PC: W/S o flechas para conducir, A/D para dirección, Shift para derrape, F/Z/clic para ametralladora y Espacio/E para arma especial.

## Física WASM y JavaScript

Se conserva el binario `wasm/physics-core.wasm` de la base y su código fuente C. `vk_step` calcula conducción, agarre, derrape, altura y transferencia de peso. Si falla la carga, se utiliza el respaldo JS.

Las nuevas respuestas de choque y la detección de impactos están centralizadas en `js/collision.js` y `js/weapons.js`, y se ejecutan igual con ambos motores. La función histórica `vk_obstacles` sigue incluida en el binario para compatibilidad y su prueba de referencia; el combate usa la nueva respuesta común a obstáculos. WASM no reemplaza WebGL ni garantiza FPS.

## Archivos principales

| Archivo | Función |
|---|---|
| `js/simulation.js` | Reloj de física a 60 Hz |
| `js/quality.js` | Perfiles y resolución adaptativa |
| `js/collision.js` | Colisiones por masa y pruebas de segmento |
| `js/mesh-optimizer.js` | Agrupación de piezas estáticas |
| `js/effects.js` | Atlas, emisión y reciclaje de partículas |
| `assets/effects/ps1_particles_v2.png` | Cuatro sprites transparentes |
| `assets/effects/README.md` | Mapeo UV y prompt de los sprites |
| `android.css` | HUD móvil y zonas seguras |
| `vendor/` | Three.js 0.160.0, utilidades y licencia |

## Pruebas

```bash
npm test
```

No requiere instalar Three.js para esas pruebas: la validación de integración usa una interfaz simulada de Three.js. Comprueba los veinte módulos y los recursos locales; 1500 escenarios numéricos JS/WASM; igualdad de pasos a 24/30/60/90/120 FPS; límite de recuperación; conservación de momento en choques, separación, altura, obstáculos y segmentos; combate, explosiones recicladas y reinicio en ambos motores.

Para regenerar las dependencias locales después de modificar Three.js:

```bash
npm ci
npm run offline
```

Las mediciones adicionales de navegador y sus límites figuran en `VALIDACION.md`. **Queda pendiente medir FPS sostenidos, temperatura, batería y comportamiento del WebView en un Android físico.**
