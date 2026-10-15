import * as THREE from 'three';
import { scene, camera, gameTexture, IS_ANDROID_LIKE } from './graphics.js';
import { state } from './state.js';
import { setContactAxes } from './surface-physics.js';
import { quality } from './quality.js';

// Atlas único, cuatro UVs, pool acotado. No se asignan texturas por partícula.
const group = new THREE.Group();
group.name = 'Efectos_kart';
scene.add(group);
const active = [], free = [];
const limit = IS_ANDROID_LIKE ? 24 : 40;
let geometries, atlas;
const smokeLimit = IS_ANDROID_LIKE ? 18 : 32;
const smokeSlots = Array.from({ length: smokeLimit }, () => ({ life: 0, distance: -Infinity }));
const smokeOrder = [], smokeAxes = {};
let smokeBatch, smokePositions, smokeUVs, smokeColors, smokeEmitted = 0;
const corners = [[-1, 1], [1, 1], [-1, -1], [1, -1]];
const smokeTints = {
  meadow: [0.88, 0.90, 0.91], desert: [0.96, 0.92, 0.84], snow: [0.83, 0.91, 0.98],
  volcano: [0.90, 0.86, 0.83], rainbow: [0.88, 0.86, 0.97]
};

function prepareSmoke() {
  if (smokeBatch) return;
  const geometry = new THREE.BufferGeometry();
  smokePositions = new THREE.Float32BufferAttribute(new Float32Array(smokeLimit * 12), 3);
  smokeUVs = new THREE.Float32BufferAttribute(new Float32Array(smokeLimit * 8), 2);
  smokeColors = new THREE.Float32BufferAttribute(new Float32Array(smokeLimit * 16), 4);
  for (const attribute of [smokePositions, smokeUVs, smokeColors]) attribute.setUsage?.(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', smokePositions);
  geometry.setAttribute('uv', smokeUVs);
  geometry.setAttribute('color', smokeColors);
  const indices = [];
  for (let i = 0; i < smokeLimit; i++) {
    const first = i * 4;
    indices.push(first, first + 2, first + 1, first + 2, first + 3, first + 1);
  }
  geometry.setIndex(indices);
  geometry.setDrawRange(0, 0);
  // Centro de ordenación calculado sin recorrer todo el buffer de vértices.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 120);
  const map = gameTexture('effects/drift_smoke_v1.png');
  map.generateMipmaps = false;
  map.minFilter = THREE.LinearFilter;
  map.needsUpdate = true;
  smokeBatch = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    map, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false
  }));
  smokeBatch.name = 'Humo_derrape_llantas';
  smokeBatch.frustumCulled = false;
  smokeBatch.visible = false;
  group.add(smokeBatch);
}

function spawnTireSmoke(kart, spec, pivot, speed, tint, intensity, budget) {
  let alive = 0;
  for (const slot of smokeSlots) if (slot.life > 0) alive++;
  let p = alive < budget ? smokeSlots.find(slot => slot.life <= 0) : null;
  // Conservar espacio para las llantas del jugador cuando hay varios rivales.
  if (!p && kart.isPlayer) {
    for (const slot of smokeSlots) {
      if (slot.life > 0 && !slot.player && (!p || slot.life < p.life)) p = slot;
    }
  }
  if (!p) return;
  prepareSmoke();
  p.player = !!kart.isPlayer;
  p.intensity = intensity;
  const bottom = pivot.position.y - spec.radius, behind = spec.z - 0.1;
  const root = kart.mesh.position;
  p.x = root.x + smokeAxes.rightX * spec.x + smokeAxes.upX * bottom + smokeAxes.forwardX * behind;
  p.y = root.y + smokeAxes.rightY * spec.x + smokeAxes.upY * bottom + smokeAxes.forwardY * behind + 0.5;
  p.z = root.z + smokeAxes.rightZ * spec.x + smokeAxes.upZ * bottom + smokeAxes.forwardZ * behind;
  const surfaceY = state.activeArena?.surface?.heightAt(p.x, p.z);
  if (surfaceY !== undefined) p.y = Math.max(p.y, surfaceY + 0.45);
  p.total = p.life = 0.64 + Math.random() * 0.12;
  p.size = 1.6 + Math.min(speed / 120, 1) * 0.4;
  p.vx = kart.velocity.x * 0.045 + (Math.random() - 0.5) * 0.8;
  p.vz = kart.velocity.z * 0.045 + (Math.random() - 0.5) * 0.8;
  p.angle = (Math.random() - 0.5) * 0.65;
  p.spin = (Math.random() - 0.5) * 0.6;
  [p.r, p.g, p.b] = tint;
  p.opacity = 0;
  smokeEmitted++;
}

function emitTireSmoke(kart, dt, speed, biome) {
  if (!kart.isDrifting || speed <= 9 || kart.verticalY > 0.1 || kart.verticalVel > 0) {
    kart.smokeEffectTimer = 0;
    return;
  }
  const dx = kart.mesh.position.x - camera.position.x, dz = kart.mesh.position.z - camera.position.z;
  const range = IS_ANDROID_LIKE ? 70 : 100;
  if (dx * dx + dz * dz > range * range) { kart.smokeEffectTimer = 0; return; }
  const reduced = IS_ANDROID_LIKE && (quality.mode === 'battery' || quality.pixelRatio < 0.9);
  const budget = IS_ANDROID_LIKE ? (reduced ? 12 : quality.mode === 'fluid' ? 18 : 16) : smokeLimit;
  if (!kart.isPlayer) {
    let alive = 0;
    for (const p of smokeSlots) if (p.life > 0) alive++;
    if (alive >= budget - 4) return;
  }
  kart.smokeEffectTimer = (kart.smokeEffectTimer || 0) - dt;
  if (kart.smokeEffectTimer > 0) return;
  const interval = IS_ANDROID_LIKE ? (reduced ? 0.18 : quality.mode === 'fluid' ? 0.12 : 0.14) : 0.11;
  kart.smokeEffectTimer += interval * (kart.isPlayer ? 1 : 1.5);
  const specs = kart.mesh.userData.wheelSpecs, pivots = kart.mesh.userData.wheelPivots;
  if (!specs || !pivots) return;
  setContactAxes(smokeAxes, kart.mesh.rotation.y, kart.mesh.rotation.x, kart.mesh.rotation.z);
  const tint = smokeTints[biome] || smokeTints.meadow;
  const lateral = Math.abs(kart.velocity.x * Math.cos(kart.heading) - kart.velocity.z * Math.sin(kart.heading));
  const intensity = 0.4 + 0.6 * Math.min(1, lateral / speed * 3 + (kart.driftBlend || 0) * 0.35);
  for (let i = 0; i < specs.length; i++) {
    if (!specs[i].isFront) spawnTireSmoke(kart, specs[i], pivots[i], speed, tint, intensity, budget);
  }
}

function updateSmoke(dt) {
  for (const p of smokeSlots) {
    if (p.life <= 0) continue;
    p.life = Math.max(0, p.life - dt);
    const age = 1 - p.life / p.total;
    p.opacity = 0.48 * p.intensity * Math.min(1, age / 0.08) * Math.pow(1 - age, 1.1);
    p.x += p.vx * dt; p.z += p.vz * dt;
    p.y += dt * (0.8 + age * 0.25);
    const drag = Math.exp(-dt * 2.5);
    p.vx *= drag; p.vz *= drag;
    p.angle += p.spin * dt;
  }
}

function faceSmokeToCamera() {
  if (!smokeBatch) return;
  let count = 0;
  let centerX = 0, centerY = 0, centerZ = 0;
  for (const p of smokeSlots) {
    if (p.life > 0) {
      smokeOrder[count++] = p;
      centerX += p.x; centerY += p.y; centerZ += p.z;
      p.distance = (p.x - camera.position.x) ** 2 + (p.y - camera.position.y) ** 2 + (p.z - camera.position.z) ** 2;
    }
  }
  smokeOrder.length = count;
  smokeBatch.geometry.setDrawRange(0, count * 6);
  smokeBatch.visible = count > 0;
  if (!count) return;
  smokeBatch.geometry.boundingSphere.center.set(centerX / count, centerY / count, centerZ / count);
  // Orden de atrás hacia delante dentro de una sola llamada de dibujo.
  smokeOrder.sort((a, b) => b.distance - a.distance);
  const q = camera.quaternion;
  const rx = 1 - 2 * (q.y * q.y + q.z * q.z), ry = 2 * (q.x * q.y + q.z * q.w), rz = 2 * (q.x * q.z - q.y * q.w);
  const ux = 2 * (q.x * q.y - q.z * q.w), uy = 1 - 2 * (q.x * q.x + q.z * q.z), uz = 2 * (q.y * q.z + q.x * q.w);
  const positions = smokePositions.array, uvs = smokeUVs.array, colors = smokeColors.array;
  for (let i = 0; i < count; i++) {
    const p = smokeOrder[i];
    const age = 1 - p.life / p.total;
    const tile = Math.min(3, Math.floor(age * 4));
    const col = tile % 2, row = Math.floor(tile / 2), inset = 1 / 512;
    const size = p.size * (1 + age * 1.2) / 2;
    const cs = Math.cos(p.angle), sn = Math.sin(p.angle);
    for (let v = 0; v < 4; v++) {
      const [cx, cy] = corners[v], right = (cx * cs - cy * sn) * size, up = (cx * sn + cy * cs) * size;
      const pos = i * 12 + v * 3, uv = i * 8 + v * 2, color = i * 16 + v * 4;
      positions[pos] = p.x + rx * right + ux * up;
      positions[pos + 1] = p.y + ry * right + uy * up;
      positions[pos + 2] = p.z + rz * right + uz * up;
      uvs[uv] = col * 0.5 + (cx < 0 ? inset : 0.5 - inset);
      uvs[uv + 1] = 1 - row * 0.5 - (cy > 0 ? inset : 0.5 - inset);
      colors[color] = p.r; colors[color + 1] = p.g; colors[color + 2] = p.b;
      colors[color + 3] = p.opacity;
    }
  }
  for (const [attribute, components] of [[smokePositions, 12], [smokeUVs, 8], [smokeColors, 16]]) {
    attribute.clearUpdateRanges();
    attribute.addUpdateRange(0, count * components);
    attribute.needsUpdate = true;
  }
}

export function getEffectStats() {
  return { particles: active.length, smoke: smokeSlots.filter(p => p.life > 0).length,
    smokeLimit, smokeEmitted, smokeVisible: !!smokeBatch?.visible };
}
function prepare() {
  if (geometries) return;
  atlas = gameTexture('effects/ps1_particles_v2.png');
  geometries = Array.from({ length: 4 }, (_, tile) => {
    const geometry = new THREE.PlaneGeometry(1, 1);
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * 0.5 + (tile % 2) * 0.5,
        uv.getY(i) * 0.5 + (tile < 2 ? 0.5 : 0));
    }
    return geometry;
  });
}
export function spawnParticle(tile, x, y, z, size = 2.5) {
  if (active.length >= limit) return;
  // Rechazar efectos remotos: reducir transparencia y sobreposición en Android.
  const dx = x - camera.position.x, dz = z - camera.position.z;
  if (dx * dx + dz * dz > 170 * 170) return;
  prepare();
  let p = free.pop();
  if (!p) {
    const material = new THREE.MeshBasicMaterial({ map: atlas, transparent: true,
      depthWrite: false, toneMapped: false, side: THREE.DoubleSide, forceSinglePass: true });
    p = { mesh: new THREE.Mesh(geometries[tile], material), life: 0, total: 0, size: 0 };
  }
  p.mesh.geometry = geometries[tile];
  p.mesh.material.blending = tile >= 2 ? THREE.AdditiveBlending : THREE.NormalBlending;
  p.mesh.material.opacity = tile >= 2 ? 0.9 : 0.46;
  p.total = p.life = tile >= 2 ? 0.25 : 0.65;
  p.size = size;
  p.mesh.position.set(x, y, z);
  p.mesh.scale.setScalar(size);
  p.mesh.visible = true;
  group.add(p.mesh);
  active.push(p);
}
export function emitKartEffects(kart, dt, biome) {
  if (!kart.alive) { kart.smokeEffectTimer = 0; return; }
  const speed = kart.velocity.length();
  emitTireSmoke(kart, dt, speed, biome);
  if (kart.verticalY > 0.1 || kart.verticalVel > 0) return;
  kart.effectTimer = (kart.effectTimer || 0) - dt;
  if (kart.effectTimer > 0) return;
  if (speed <= 9 || (kart.isDrifting ? kart.driftCharge < 50 : speed < 28 || kart.boostTimer <= 0 && biome !== 'desert')) return;
  kart.effectTimer = kart.isDrifting ? 0.12 : 0.17;
  const sx = Math.sin(kart.heading), sz = Math.cos(kart.heading);
  const tile = kart.isDrifting ? 3 : 0;
  spawnParticle(tile, kart.position.x - sx * 2.1, kart.position.y + 0.6,
    kart.position.z - sz * 2.1, tile === 3 ? 2 : 3.3);
}
export function updateEffects(dt) {
  updateSmoke(dt);
  for (let i = active.length - 1; i >= 0; i--) {
    const p = active[i];
    p.life -= dt;
    if (p.life <= 0) {
      group.remove(p.mesh); p.mesh.visible = false; free.push(p); active.splice(i, 1); continue;
    }
    const remaining = p.life / p.total;
    p.mesh.material.opacity = remaining * (p.total < 0.3 ? 0.9 : 0.46);
    p.mesh.position.y += dt * (p.total < 0.3 ? 0.4 : 1.5);
    p.mesh.scale.setScalar(p.size * (1 + (1 - remaining) * 0.9));
  }
}
export function faceEffectsToCamera() {
  for (const p of active) p.mesh.quaternion.copy(camera.quaternion);
  faceSmokeToCamera();
}
export function resetEffects() {
  for (const p of active) { group.remove(p.mesh); p.mesh.visible = false; free.push(p); }
  active.length = 0;
  for (const p of smokeSlots) p.life = 0;
  smokeEmitted = 0;
  if (smokeBatch) { smokeBatch.visible = false; smokeBatch.geometry.setDrawRange(0, 0); }
  smokeOrder.length = 0;
}
