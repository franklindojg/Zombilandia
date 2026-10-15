# Corrección de Pradera y selección de arenas

## Instalar

1. Cierra la pestaña del juego.
2. Extrae este ZIP directamente en la carpeta que contiene el `index.html` que estás usando con tu servidor local. Reemplaza los archivos y conserva las carpetas `js`, `assets`, `scripts` y `tests`. Reemplaza también `index.html` e `index-offline.html`; no basta con copiar los sprites.
3. Abre de nuevo el juego desde el servidor local.
4. Selecciona **Sector Pradera** e inicia **Arena 1: Arena Champiñón V8**. En el menú y el HUD debe aparecer **Pradera Verde & Cerca de Madera**.

Este ZIP reúne los scripts necesarios de las correcciones anteriores y de esta actualización, para aplicarlo sobre el juego Android 1.4.0 o una versión con esos parches ya instalados. Conserva los recursos base, `vendor`, `wasm`, los estilos y los demás archivos del juego.

## Qué corrige

- El nivel elegido siempre pertenece al sector mostrado en el menú.
- Escoger un sector bloqueado muestra su primera arena y desactiva el inicio; evita lanzar el nivel que quedó seleccionado en otro sector.
- Volver de Desierto o de otro sector a Pradera selecciona su primera arena.
- El botón de iniciar valida la selección antes de construir la arena.
- En móvil, las tarjetas del selector mantienen su tamaño y se desplazan con el menú, sin quedar debajo del botón de iniciar.
- Las dos entradas HTML usan rutas versionadas para los módulos. Los sprites de pradera y desierto tienen nombres nuevos para que el navegador no reutilice los archivos de tierra anteriores al actualizar.

La captura reportada seguía mostrando Arena 1 junto con el nombre antiguo de pradera y el suelo marrón. La instalación completa de este paquete actualiza tanto el código como los recursos que consume esa arena.

## Escenarios y sprites

| Niveles | Sector | Piso y circuito | Barrera |
| --- | --- | --- | --- |
| 1–4 | Pradera | `meadow_grass_v2.png`, grass verde | `wooden_fence_v2.png`, madera |
| 5–8 | Desierto | `desert_dirt_v2.png`, tierra marrón anterior | Bloques de cemento |
| 9–12 | Glaciar | Hielo | Cemento claro |
| 13–16 | Volcán | Terreno volcánico | Cemento oscuro |
| 17–20 | Estelar | Superficie orbital | Bloques de cemento |

El pasto y la cerca reutilizan los sprites generados en la actualización anterior. El cielo, las rampas y la corrección del apoyo de las llantas siguen incluidos en los scripts.

## Validación

`npm test` comprueba los 24 módulos, la selección y bloqueo de sectores, 1500 escenarios JS/WASM, física, rampas, apoyo de llantas y reinicio del combate con ambos motores. `npm run offline` conserva las rutas versionadas al preparar los recursos locales.

La revisión en navegador utiliza los botones reales del menú y una simulación de archivos antiguos en caché. Se revisan los veinte niveles y las entradas normal y offline. Son pruebas con Chromium; no representan una medición de FPS en un dispositivo Android físico.
