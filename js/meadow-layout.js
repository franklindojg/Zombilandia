// Distribución reproducible de modelos rurales con volumen, UVs y colisión.
import { MEADOW_MODELS } from './meadow-model-geometry.js';

export function meadowSpawnPoints(radius, total = 5) {
  return Array.from({ length: total }, (_, i) => {
    const angle = i / total * Math.PI * 2;
    return { x: Math.cos(angle) * radius * 0.55, z: Math.sin(angle) * radius * 0.55 };
  });
}

function randomSeed(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}

export function createMeadowLayout(level, surface, ramps = [], pickups = []) {
  const radius = level.radius5x, count = 32 + (level.level - 1) * 4;
  const random = randomSeed(4171 + level.level * 801);
  const spawns = meadowSpawnPoints(radius, level.enemyCount + 1), placed = [];
  function tryPlace(index, x, z) {
    const kind = index % 2 ? 'logs' : 'hay', variant = Math.floor(index / 2) % 4;
    const spec = MEADOW_MODELS[kind][variant];
    const width = spec.width * (0.94 + random() * 0.12), r = width * spec.radius;
    const distance = Math.hypot(x, z);
    if (distance < 42 || distance > radius - r - 18) return false;
    // Una vía circular abierta y salidas despejadas para los cinco karts.
    if (Math.abs(distance - radius * 0.5) < r + 8) return false;
    for (const p of spawns) if (Math.hypot(x - p.x, z - p.z) < r + 13) return false;
    for (const p of pickups) if (Math.hypot(x - p.x, z - p.z) < r + 12) return false;
    for (const p of placed) if (Math.hypot(x - p.x, z - p.z) < r + p.radius + 6) return false;
    for (const ramp of ramps) {
      const dx = x - ramp.position.x, dz = z - ramp.position.z;
      const along = dx * ramp.forwardX + dz * ramp.forwardZ;
      const across = dx * ramp.forwardZ - dz * ramp.forwardX;
      if (Math.abs(across) < ramp.width / 2 + r + 8 &&
          along > -ramp.length / 2 - r - 24 && along < ramp.length / 2 + r + 36) return false;
    }
    const y = surface.heightAt(x, z);
    const slopeX = (surface.heightAt(x + 1.5, z) - surface.heightAt(x - 1.5, z)) / 3;
    const slopeZ = (surface.heightAt(x, z + 1.5) - surface.heightAt(x, z - 1.5)) / 3;
    if (![y, slopeX, slopeZ].every(Number.isFinite) || Math.hypot(slopeX, slopeZ) > 0.3) return false;
    const heading = index < spawns.length * 2
      ? Math.floor(index / 2) / spawns.length * Math.PI * 2 + Math.PI / 2 + (index % 2 ? 0.16 : -0.12)
      : (index * 53 + level.level * 37) * Math.PI / 180;
    placed.push({ kind, variant, x, y, z, width, heading,
      height: width * spec.height + Math.hypot(slopeX, slopeZ) * r,
      halfWidth: width * spec.halfWidth, halfDepth: width * spec.halfDepth,
      radius: r, slopeX, slopeZ });
    return true;
  }

  for (let i = 0; i < count; i++) {
    let added = false;
    // Primeras parejas a los lados de las salidas: visibles desde el inicio.
    if (i < spawns.length * 2) {
      const angle = Math.floor(i / 2) / spawns.length * Math.PI * 2;
      for (let attempt = 0; attempt < 12 && !added; attempt++) {
        const along = radius * 0.55 - 14 - attempt * 2;
        const side = (i % 2 ? -1 : 1) * (14 + attempt * 1.5);
        added = tryPlace(i, Math.cos(angle) * along - Math.sin(angle) * side,
          Math.sin(angle) * along + Math.cos(angle) * side);
      }
    }
    // El resto forma grupos en el interior y las zonas laterales del prado.
    for (let attempt = 0; attempt < 800 && !added; attempt++) {
      const angle = (i / count + level.level * 0.071) * Math.PI * 2 + (random() - 0.5) * 0.7;
      const band = [0.2, 0.32, 0.68, 0.83][(i + attempt) % 4];
      const dist = radius * (band + (random() - 0.5) * 0.08);
      added = tryPlace(i, Math.cos(angle) * dist, Math.sin(angle) * dist);
    }
    if (!added) throw new Error(`Sin espacio seguro para objeto de pradera ${i} en nivel ${level.level}`);
  }
  return placed;
}
