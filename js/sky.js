// Cielo PS1: una cúpula y un atlas compartido, sin luces ni sombras extra.
import * as THREE from 'three';
import { gameTexture, IS_ANDROID_LIKE } from './graphics.js';

const SKY_RADIUS = 3000;
const PROFILES = {
  meadow: { top: '#060d30', middle: '#19447a', horizon: '#b99585', cloud: '#d4ddf2', stars: 0.78, celestial: 4 },
  desert: { top: '#171021', middle: '#593641', horizon: '#ce874e', cloud: '#ecb68a', stars: 0.40, celestial: 5 },
  snow: { top: '#071326', middle: '#1b4369', horizon: '#7cabbc', cloud: '#cfe6f5', stars: 0.86, celestial: 4 },
  volcano: { top: '#130b1a', middle: '#48212e', horizon: '#ad4c2d', cloud: '#ba8e85', stars: 0.28, celestial: 5 },
  rainbow: { top: '#070b25', middle: '#302050', horizon: '#80639b', cloud: '#c8b6f1', stars: 1, celestial: 4 }
};
let activeSky = null;

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

function createDome(profile, fogColor) {
  const geometry = new THREE.SphereGeometry(SKY_RADIUS, 32, 16);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  // El extremo inferior se funde con la niebla y la pared del horizonte.
  const stops = [[-0.12, new THREE.Color(fogColor)], [0, new THREE.Color(profile.horizon)],
    [0.18, new THREE.Color(profile.middle)], [0.65, new THREE.Color(profile.top)]];
  for (let i = 0; i < positions.count; i++) {
    const altitude = positions.getY(i) / SKY_RADIUS;
    let lower = 0;
    while (lower < stops.length - 2 && altitude > stops[lower + 1][0]) lower++;
    const [low, a] = stops[lower], [high, b] = stops[lower + 1];
    const t = Math.max(0, Math.min(1, (altitude - low) / (high - low)));
    colors.set([a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t], i * 3);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false
  }));
  mesh.name = 'Cielo_degradado';
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  return mesh;
}

export function createArenaSky(cupData, levelObj) {
  const profile = PROFILES[cupData.biomeKey] || PROFILES.meadow;
  const group = new THREE.Group();
  group.name = 'Cielo_sprites_PS1';
  group.add(createDome(profile, cupData.fogColor));
  const random = seededRandom(8017 + levelObj.level * 97);
  const positions = [], uvs = [], colors = [], indices = [];
  const cloudColor = new THREE.Color(profile.cloud);
  let spriteCount = 0;

  // Cuadrados orientados hacia el centro de una esfera: no giran con la cámara.
  // Los ocho sprites usan UVs individuales sin clonar la textura del atlas.
  function addSprite(tile, yaw, elevation, width, height, radius, tint, alpha) {
    const sy = Math.sin(yaw), cy = Math.cos(yaw), se = Math.sin(elevation), ce = Math.cos(elevation);
    const centerX = sy * ce * radius, centerY = se * radius, centerZ = cy * ce * radius;
    const col = tile % 4, row = Math.floor(tile / 4);
    const inset = 0.001;
    const u0 = col / 4 + inset, u1 = (col + 1) / 4 - inset;
    const v0 = 1 - (row + 1) / 2 + inset, v1 = 1 - row / 2 - inset;
    const first = positions.length / 3;
    for (const [x, y, u, v] of [[-1, 1, u0, v1], [1, 1, u1, v1], [-1, -1, u0, v0], [1, -1, u1, v0]]) {
      const right = x * width / 2, up = y * height / 2;
      positions.push(centerX + cy * right - sy * se * up, centerY + ce * up,
        centerZ - sy * right - cy * se * up);
      uvs.push(u, v);
      colors.push(tint.r, tint.g, tint.b, alpha);
    }
    // Normal hacia dentro; las nubes no requieren material de doble cara.
    indices.push(first, first + 1, first + 2, first + 2, first + 1, first + 3);
    spriteCount++;
  }

  // Orden fijo de composición: estrellas lejanas, astros, nebulosa y nubes.
  const starColor = new THREE.Color('#e3edff');
  const starCount = IS_ANDROID_LIKE ? 70 : 100;
  for (let i = 0; i < starCount; i++) {
    const elevation = i < starCount * 0.65 ? 0.07 + random() * 0.38 : 0.45 + random() * 0.8;
    const yaw = random() * Math.PI * 2;
    const size = i % 9 === 0 ? 40 : 12 + random() * 14;
    addSprite(6, yaw, elevation, size, size, 2800, starColor, profile.stars * (0.55 + random() * 0.45));
  }
  const rotation = (levelObj.level % 4) * 0.15;
  addSprite(profile.celestial, -1.2 + rotation, 0.23, 320, 320, 2700,
    new THREE.Color(profile.celestial === 5 ? '#ffd1a0' : '#dce9ff'), 0.88);
  if (cupData.biomeKey === 'rainbow') {
    addSprite(7, 0.5 + rotation, 0.35, 1700, 600, 2650, cloudColor, 0.38);
  }
  const slots = IS_ANDROID_LIKE ? 6 : 9;
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < slots; i++) {
      const yaw = (i + layer * 0.5) / slots * Math.PI * 2 + rotation;
      const tile = cupData.biomeKey === 'volcano' ? 3 : (i + layer + levelObj.cup) % 4;
      addSprite(tile, yaw, 0.08 + layer * 0.1 + random() * 0.055,
        950 + random() * 350, 310 + random() * 130, 2500 - layer * 250,
        cloudColor, layer === 0 ? 0.48 : 0.67);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
  geometry.setIndex(indices);
  const atlas = gameTexture('sky/sky_sprites_ps1.png');
  // Sin mipmaps: impide que un astro tome píxeles de otra celda del atlas.
  atlas.generateMipmaps = false;
  atlas.minFilter = THREE.LinearFilter;
  atlas.needsUpdate = true;
  const sprites = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    map: atlas, vertexColors: true, transparent: true, depthWrite: false,
    depthTest: true, fog: false, toneMapped: false
  }));
  sprites.name = 'Nubes_astros_estrellas_atlas';
  sprites.renderOrder = -990;
  sprites.frustumCulled = false;
  group.add(sprites);
  group.userData.spriteCount = spriteCount;
  group.userData.biomeKey = cupData.biomeKey;
  activeSky = group;
  return group;
}

export function updateArenaSky(camera) {
  // Solo traslación; el cielo permanece lejano al recorrer toda la arena.
  if (activeSky && activeSky.parent && activeSky.parent.visible) activeSky.position.copy(camera.position);
}
