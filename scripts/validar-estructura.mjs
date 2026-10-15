import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsDir = path.join(root, 'js');
const files = fs.readdirSync(jsDir).filter((file) => file.endsWith('.js'));
let failures = 0;
for (const name of files) {
  const full = path.join(jsDir, name);
  const source = fs.readFileSync(full, 'utf8');
  const syntax = spawnSync(process.execPath, ['--check', full], { encoding: 'utf8' });
  if (syntax.status !== 0) { failures++; console.error(`Error de sintaxis: ${name}\n${syntax.stderr}`); }
  const imported = source.matchAll(/(?:import\s+(?:[^;'"`]*?\s+from\s+)?|export\s+[^;'"`]*?\s+from\s+)['"](\.[^'"]+)['"]/g);
  for (const match of imported) {
    const candidate = path.resolve(jsDir, match[1]);
    if (!fs.existsSync(candidate)) { failures++; console.error(`Import inexistente: ${name}: ${match[1]}`); }
  }
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!/src="\.\/js\/main\.js(?:\?[^"\s]+)?"/.test(html)) { failures++; console.error('Falta el punto de entrada ./js/main.js en index.html'); }
for (const rel of ['styles.css', 'android.css', 'assets/cars/scarlet_paint.png', 'assets/arena/meadow_ground.png', 'assets/effects/kart_shadow.png', 'assets/effects/explosion.png', 'assets/effects/ps1_particles_v2.png', 'wasm/physics-core.wasm', 'wasm/physics-core.c', 'js/wasm-physics.js', 'vendor/three.module.js', 'vendor/addons/exporters/GLTFExporter.js', 'vendor/addons/utils/BufferGeometryUtils.js', 'vendor/addons/utils/TextureUtils.js']) {
  if (!fs.existsSync(path.join(root, rel))) { failures++; console.error(`Asset ausente: ${rel}`); }
}
const wasmBytes = fs.readFileSync(path.join(root, 'wasm/physics-core.wasm'));
for (const file of ['cement_blocks.png', 'cement_blocks_weathered.png', 'cement_blocks_dark.png', 'cement_blocks_light.png']) {
  const full = path.join(root, 'assets', 'arena', file);
  if (!fs.existsSync(full)) { failures++; console.error(`Sprite de cemento ausente: ${file}`); }
}
if (!fs.existsSync(path.join(root, 'assets/sky/sky_sprites_ps1.png'))) {
  failures++; console.error('Atlas de cielo ausente: assets/sky/sky_sprites_ps1.png');
}
for (const file of ['meadow_grass_v2.png', 'desert_dirt_v2.png', 'wooden_fence_v2.png', 'meadow_hay_materials_v1.png', 'meadow_logs_materials_v1.png']) {
  if (!fs.existsSync(path.join(root, 'assets/arena', file))) {
    failures++; console.error(`Sprite de bioma ausente: assets/arena/${file}`);
  }
}
if (!fs.existsSync(path.join(root, 'assets/effects/drift_smoke_v1.png'))) {
  failures++; console.error('Atlas de humo ausente: assets/effects/drift_smoke_v1.png');
}
if (html.includes('https://cdn.') || !html.includes('"three": "./vendor/three.module.js"')) {
  failures++; console.error('La entrada Android debe usar Three.js local.');
}
if (wasmBytes.toString('hex', 0, 4) !== '0061736d') { failures++; console.error('El binario .wasm no tiene cabecera WASM valida'); }
if (failures) process.exitCode = 1;
else console.log(`OK: ${files.length} módulos; sintaxis, rutas relativas y recursos base verificados.`);
