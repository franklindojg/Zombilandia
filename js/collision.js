// Respuestas numéricas compartidas por WASM y el respaldo de conducción JS.
// La masa afecta al choque; no se añade velocidad cuando los carros se separan.
export function resolveKartContact(a, b) {
  if ((!a.alive && !b.alive) || Math.abs(a.position.y - b.position.y) > 3.2) return 0;
  let dx = a.position.x - b.position.x, dz = a.position.z - b.position.z;
  const minDistance = (a.collisionRadius || 1.85) + (b.collisionRadius || 1.85);
  const distance = Math.hypot(dx, dz);
  if (distance >= minDistance) return 0;
  if (distance < 1e-6) { dx = 1; dz = 0; }
  else { dx /= distance; dz /= distance; }
  const invA = 1 / (a.mass || 1), invB = 1 / (b.mass || 1);
  const inverseMass = invA + invB;
  const penetration = minDistance - distance;
  a.position.x += dx * penetration * invA / inverseMass;
  a.position.z += dz * penetration * invA / inverseMass;
  b.position.x -= dx * penetration * invB / inverseMass;
  b.position.z -= dz * penetration * invB / inverseMass;
  const closing = (a.velocity.x - b.velocity.x) * dx + (a.velocity.z - b.velocity.z) * dz;
  if (closing >= 0) return 0;
  const impulse = -(1 + 0.28) * closing / inverseMass;
  a.velocity.x += dx * impulse * invA;
  a.velocity.z += dz * impulse * invA;
  b.velocity.x -= dx * impulse * invB;
  b.velocity.z -= dz * impulse * invB;
  return -closing;
}

export function resolveObstacleContact(kart, obstacle) {
  if (!kart.alive || kart.position.y > obstacle.position.y + (obstacle.height || 22)) return false;
  if (obstacle.shape === 'box') return resolveBoxContact(kart, obstacle);
  let dx = kart.position.x - obstacle.position.x, dz = kart.position.z - obstacle.position.z;
  const radius = obstacle.radius + (kart.collisionRadius || 1.85);
  const distance = Math.hypot(dx, dz);
  if (distance >= radius) return false;
  if (distance < 1e-6) { dx = 1; dz = 0; }
  else { dx /= distance; dz /= distance; }
  kart.position.x = obstacle.position.x + dx * radius;
  kart.position.z = obstacle.position.z + dz * radius;
  const inward = kart.velocity.x * dx + kart.velocity.z * dz;
  if (inward < 0) {
    kart.velocity.x -= 1.22 * inward * dx;
    kart.velocity.z -= 1.22 * inward * dz;
  }
  return true;
}

// Huella fija del modelo 3D: caras, esquinas y giro propio del objeto.
function resolveBoxContact(kart, obstacle) {
  const cs = Math.cos(obstacle.heading), sn = Math.sin(obstacle.heading);
  const dx = kart.position.x - obstacle.position.x, dz = kart.position.z - obstacle.position.z;
  let x = cs * dx - sn * dz, z = sn * dx + cs * dz;
  const hw = obstacle.halfWidth, hd = obstacle.halfDepth, radius = kart.collisionRadius || 1.85;
  if (Math.abs(x) >= hw + radius || Math.abs(z) >= hd + radius) return false;
  const nearX = Math.max(-hw, Math.min(hw, x)), nearZ = Math.max(-hd, Math.min(hd, z));
  let nx = x - nearX, nz = z - nearZ;
  const distance = Math.hypot(nx, nz);
  if (distance >= radius) return false;
  if (distance > 1e-8) {
    nx /= distance; nz /= distance;
    x = nearX + nx * radius; z = nearZ + nz * radius;
  } else if (hw - Math.abs(x) < hd - Math.abs(z)) {
    nx = x >= 0 ? 1 : -1; nz = 0; x = nx * (hw + radius);
  } else {
    nx = 0; nz = z >= 0 ? 1 : -1; z = nz * (hd + radius);
  }
  kart.position.x = obstacle.position.x + cs * x + sn * z;
  kart.position.z = obstacle.position.z - sn * x + cs * z;
  const worldX = cs * nx + sn * nz, worldZ = -sn * nx + cs * nz;
  const inward = kart.velocity.x * worldX + kart.velocity.z * worldZ;
  if (inward < 0) {
    kart.velocity.x -= 1.22 * inward * worldX;
    kart.velocity.z -= 1.22 * inward * worldZ;
  }
  return true;
}

// Distancia a un segmento: una bala rápida no puede atravesar el kart entre pasos.
export function segmentDistanceSquared(ax, ay, az, bx, by, bz, x, y, z) {
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  const lengthSq = dx * dx + dy * dy + dz * dz;
  const t = lengthSq > 0 ? Math.max(0, Math.min(1,
    ((x - ax) * dx + (y - ay) * dy + (z - az) * dz) / lengthSq)) : 0;
  const ex = ax + dx * t - x, ey = ay + dy * t - y, ez = az + dz * t - z;
  return ex * ex + ey * ey + ez * ez;
}
