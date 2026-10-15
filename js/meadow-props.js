import * as THREE from 'three';
import { gameTexture } from './graphics.js';
import { createMeadowLayout } from './meadow-layout.js';
import { buildMeadowModelBatch } from './meadow-model-geometry.js';

function createModelBatch(kind, layout) {
  const data = buildMeadowModelBatch(kind, layout);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
  geometry.setIndex(data.indices);
  geometry.computeVertexNormals();
  const map = gameTexture(`arena/meadow_${kind}_materials_v1.png`);
  if (map.generateMipmaps || map.minFilter !== THREE.NearestFilter) {
    map.generateMipmaps = false; map.minFilter = THREE.NearestFilter; map.needsUpdate = true;
  }
  const material = new THREE.MeshLambertMaterial({ map, flatShading: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = kind === 'hay' ? 'Pacas_heno_modelos_3D' : 'Troncos_modelos_3D';
  mesh.userData.modelCount = layout.filter(p => p.kind === kind).length;
  return mesh;
}

function createShadows(layout, surface) {
  const positions = [], uvs = [], indices = [];
  for (const p of layout) {
    const first = positions.length / 3, size = p.radius * 1.15;
    for (const [x, z, u, v] of [[-1, -1, 0, 0], [-1, 1, 0, 1], [1, -1, 1, 0], [1, 1, 1, 1]]) {
      const px = p.x + x * size, pz = p.z + z * size * 0.7;
      positions.push(px, surface.heightAt(px, pz) + 0.06, pz); uvs.push(u, v);
    }
    indices.push(first, first + 1, first + 2, first + 2, first + 1, first + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    map: gameTexture('effects/kart_shadow.png'), transparent: true, opacity: 0.3,
    depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1
  }));
  mesh.name = 'Sombras_objetos_pradera';
  return mesh;
}

export function createMeadowProps(level, surface, ramps, pickups) {
  const layout = createMeadowLayout(level, surface, ramps, pickups);
  const group = new THREE.Group();
  group.name = 'Objetos_pradera_modelos_3D';
  group.add(createModelBatch('hay', layout), createModelBatch('logs', layout), createShadows(layout, surface));
  group.userData.layout = layout;
  const obstacles = layout.map(p => ({
    position: new THREE.Vector3(p.x, p.y, p.z), radius: p.radius, height: p.height,
    kind: p.kind, variant: p.variant, shape: 'box', heading: p.heading,
    halfWidth: p.halfWidth, halfDepth: p.halfDepth
  }));
  return { group, obstacles };
}
