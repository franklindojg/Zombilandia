# Corrección de llantas y terreno

Copia el contenido del ZIP en la raíz del juego y reemplaza los archivos coincidentes. Incluye el nuevo `js/surface-physics.js`: debe copiarse junto con los otros scripts.

La altura se consulta sobre los triángulos reales del terreno y de la carretera, tanto en la configuración móvil (64 segmentos) como en PC (90 segmentos). El carro se inclina según el apoyo de sus cuatro ruedas. El contacto considera el cilindro y los hombros completos de los neumáticos, con suspensión independiente y ajuste en los bordes elevados. Se conserva el apoyo de la rampa durante la salida para evitar que las ruedas traseras corten la pendiente.

No se realizan raycasts durante el juego. El mapa de alturas reutiliza los datos de las geometrías, y los perfiles de ruedas y buffers se guardan para reutilizarlos.

Validación: `npm test` aprobado; pruebas en navegador de los veinte niveles con ambas configuraciones de terreno, pendientes y bordes de carretera; comparación con las superficies renderizadas; más de seis millones de vértices de ruedas comprobados por configuración. Ascenso, salto y aterrizaje de rampas comprobados con WASM y respaldo JavaScript. La comprobación de navegador utiliza Chromium/SwiftShader y no sustituye la medición de rendimiento en un Android físico.
