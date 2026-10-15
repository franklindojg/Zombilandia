# Validación · 1.4.0

## Resultados

- `npm test`: aprobado. Veinte módulos, firma WASM, recursos locales, 1500 casos de comparación numérica, pruebas de reloj y choque e integración con ambos motores.
- Chromium con WebGL mediante SwiftShader: carga, combate y regreso al hangar sin excepciones de página.
- Ninguna petición externa del juego: imports y recursos servidos localmente.
- Veinte arenas: cinco carros y posiciones finitas en todas; reinicios adicionales completados.
- HUD probado a 844 × 390, 640 × 360 y 390 × 844: siete botones dentro del área visible.
- Multitáctil: giro y aceleración simultáneos; al soltar el giro se conserva la aceleración; al soltar ambos se limpian las entradas.
- Rampas: marcha contra la dirección de subida no produce salto; avance a 80 unidades/s produce velocidad vertical 22.4.
- Disparo: una bala que recorre el blanco dentro de un paso reduce HP de 100 a 96.5.
- Atlas: las cuatro celdas se emiten y renderizan; canal alfa real confirmado.
- Modo `?wasm=0`: conducción JavaScript activa.
- Exportación GLB: descarga completada, cabecera binaria `glTF` válida.

## Comparación de carga gráfica

Misma arena 1, misma cámara a (0, 14, -30), mirando al origen, y cinco modelos colocados en una fila visible. Valores obtenidos con el mismo navegador y perfil móvil. Esta escena sirve para comparar carga de dibujo; no es una medición de FPS ni una simulación de combate equivalente a un Android físico.

| Métrica | Base 1.3.0 | Actualización 1.4.0 |
|---|---:|---:|
| Mallas del kart estándar del jugador | 81 | 43 |
| Llamadas de dibujo de la escena | 418 | 234 |
| Triángulos de la escena | 74,248 | 68,160 |

La escena comparada utiliza aproximadamente 44.0% menos llamadas de dibujo. En combate, las llamadas cambian según la cámara, armas, partículas y objetos visibles. No se debe convertir esa reducción en un porcentaje de mejora de FPS.

## Pendiente en dispositivo

Medir una partida de varios minutos en el Android objetivo, en cada perfil: FPS sostenidos, calentamiento, batería, pausas y retorno de la aplicación, multitáctil real y carga de WASM desde el origen local del WebView. Este proyecto sigue siendo web y no contiene APK/AAB.
