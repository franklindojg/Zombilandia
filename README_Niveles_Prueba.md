# Veinte niveles desbloqueados — versión de prueba

Extrae este ZIP en la carpeta del juego y reemplaza los archivos conservando las subcarpetas. Aplícalo sobre la versión actual con humo de derrape. Reemplaza también `index.html` e `index-offline.html` y vuelve a abrir el juego.

Los veinte niveles y los cinco sectores quedan disponibles desde el arranque, incluso después de recargar. Ya no hace falta pulsar «Desbloquear 20 Arenas» para probarlos. El menú muestra 20 / 20.

Este desbloqueo es temporal para las pruebas: antes de la versión final se puede restaurar la progresión cambiando el valor inicial de `unlockedMaxLevel` en `js/state.js` a 1.

El archivo de integración utiliza una selección bloqueada de prueba y después restaura el estado inicial, para seguir comprobando esa protección del selector.
