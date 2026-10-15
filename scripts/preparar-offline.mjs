import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const three = path.join(root, 'node_modules', 'three');
const vendor = path.join(root, 'vendor');
const sourceThree = path.join(three, 'build', 'three.module.js');
const sourceExporter = path.join(three, 'examples', 'jsm', 'exporters', 'GLTFExporter.js');
if (!fs.existsSync(sourceThree) || !fs.existsSync(sourceExporter)) {
  console.error('Falta Three.js. Ejecuta primero: npm install');
  process.exit(1);
}
fs.mkdirSync(path.join(vendor, 'addons', 'exporters'), { recursive: true });
fs.mkdirSync(path.join(vendor, 'addons', 'utils'), { recursive: true });
fs.copyFileSync(sourceThree, path.join(vendor, 'three.module.js'));
fs.copyFileSync(sourceExporter, path.join(vendor, 'addons', 'exporters', 'GLTFExporter.js'));
for (const name of ['BufferGeometryUtils.js', 'TextureUtils.js']) {
  fs.copyFileSync(path.join(three, 'examples', 'jsm', 'utils', name), path.join(vendor, 'addons', 'utils', name));
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const importmap = html.match(/(<script type="importmap">)([\s\S]*?)(<\/script>)/);
if (!importmap) throw new Error('Falta el importmap.');
const mappings = JSON.parse(importmap[2]);
if (!mappings.imports?.three) throw new Error('Importmap sin Three.js.');
mappings.imports.three = './vendor/three.module.js';
mappings.imports['three/addons/'] = './vendor/addons/';
// Conservar también las rutas versionadas de los módulos del juego.
const offlineHTML = html.replace(importmap[0], `${importmap[1]}\n    ${JSON.stringify(mappings, null, 6)}\n  ${importmap[3]}`);
fs.writeFileSync(path.join(root, 'index-offline.html'), offlineHTML);
fs.writeFileSync(path.join(root, 'index.html'), offlineHTML);
fs.copyFileSync(path.join(three, 'LICENSE'), path.join(vendor, 'LICENSE-three.txt'));
console.log('Versión Android/offline lista: index-offline.html + styles.css + vendor/ + assets/');
