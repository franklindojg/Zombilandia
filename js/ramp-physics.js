// La misma cuña y el mismo plano se usan para dibujar y resolver contacto.
export const RAMP_WIDTH = 14;
export const RAMP_LENGTH = 18;
export const RAMP_HEIGHT = 4.2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function topHeight(ramp, side, along) {
  return ramp.position.y + side * ramp.sideSlope + along * ramp.forwardSlope +
    (along / ramp.length + 0.5) * ramp.height;
}

export function rampSurfaceHeight(ramp, x, z) {
  const dx = x - ramp.position.x, dz = z - ramp.position.z;
  const side = dx * ramp.forwardZ - dz * ramp.forwardX;
  const along = dx * ramp.forwardX + dz * ramp.forwardZ;
  if (Math.abs(side) > ramp.width / 2 || Math.abs(along) > ramp.length / 2) return null;
  return topHeight(ramp, side, along);
}

// Barrido del chasis: los laterales y el muro alto no se atraviesan por velocidad.
function sweepBox(px, pz, x, z, halfWidth, halfLength) {
  let entry = 0, exit = 1, nx = 0, nz = 0;
  const deltas = [x - px, z - pz], origins = [px, pz], extents = [halfWidth, halfLength];
  for (let axis = 0; axis < 2; axis++) {
    const d = deltas[axis], p = origins[axis], h = extents[axis];
    if (Math.abs(d) < 1e-9) { if (Math.abs(p) > h) return null; continue; }
    let lo = (-h - p) / d, hi = (h - p) / d;
    const normal = d > 0 ? -1 : 1;
    if (lo > hi) [lo, hi] = [hi, lo];
    if (lo >= entry) { entry = lo; nx = axis === 0 ? normal : 0; nz = axis === 1 ? normal : 0; }
    exit = Math.min(exit, hi);
    if (entry > exit) return null;
  }
  if (exit < 0 || entry > 1) return null;
  if (!nx && !nz) {
    // Resolver también un chasis que comienza parcialmente dentro de una pared.
    if (halfWidth - Math.abs(px) < halfLength - Math.abs(pz)) nx = px < 0 ? -1 : 1;
    else nz = pz < 0 ? -1 : 1;
  }
  return { t: Math.max(0, entry), nx, nz };
}

function support(kart, ramp, side, along, groundY) {
  const y = Math.max(groundY, topHeight(ramp, side, along));
  kart.position.y = y;
  kart.verticalY = y - groundY;
  kart.verticalVel = 0;
  kart.rampContact = ramp;
  const fx = Math.sin(kart.heading), fz = Math.cos(kart.heading);
  const forwardGrade = (ramp.forwardSlope + ramp.height / ramp.length) *
    (fx * ramp.forwardX + fz * ramp.forwardZ) + ramp.sideSlope *
    (fx * ramp.forwardZ - fz * ramp.forwardX);
  const sideGrade = (ramp.forwardSlope + ramp.height / ramp.length) *
    (fz * ramp.forwardX - fx * ramp.forwardZ) + ramp.sideSlope *
    (fz * ramp.forwardZ + fx * ramp.forwardX);
  kart.rampPitch = -Math.atan(forwardGrade);
  kart.rampRoll = Math.atan(sideGrade * Math.cos(kart.rampPitch));
  return 'supported';
}

function leaveTop(kart, ramp, side, along, prevSide, prevAlong, dt, groundY) {
  const speed = kart.velocity.x * ramp.forwardX + kart.velocity.z * ramp.forwardZ;
  const t = clamp((ramp.length / 2 - prevAlong) / Math.max(1e-9, along - prevAlong), 0, 1);
  const exitSide = prevSide + (side - prevSide) * t;
  if (Math.abs(exitSide) > ramp.width / 2) return null;
  const remaining = dt * (1 - t);
  const fast = speed > 35 && kart.rampCooldown <= 0;
  const launch = fast ? Math.min(29, speed * ramp.height / ramp.length + 6) : Math.max(0, speed * ramp.height / ramp.length);
  const exitY = topHeight(ramp, exitSide, ramp.length / 2);
  kart.position.y = Math.max(groundY, exitY + launch * remaining - 19 * remaining * remaining);
  kart.verticalY = kart.position.y - groundY;
  kart.verticalVel = kart.verticalY > 0 ? launch - 38 * remaining : 0;
  if (fast) { kart.rampCooldown = 0.4; kart.boostTimer = Math.max(kart.boostTimer, 1); }
  return 'launched';
}

function resolveOne(kart, ramp, previousRamp, dt, groundY) {
  const dx = kart.position.x - ramp.position.x, dz = kart.position.z - ramp.position.z;
  const px = kart.previousPosition.x - ramp.position.x, pz = kart.previousPosition.z - ramp.position.z;
  const side = dx * ramp.forwardZ - dz * ramp.forwardX;
  const along = dx * ramp.forwardX + dz * ramp.forwardZ;
  const prevSide = px * ramp.forwardZ - pz * ramp.forwardX;
  const prevAlong = px * ramp.forwardX + pz * ramp.forwardZ;
  const hw = ramp.width / 2, hl = ramp.length / 2;
  const radius = kart.collisionRadius || 1.85;
  if (previousRamp !== ramp && (Math.min(side, prevSide) > hw + radius ||
    Math.max(side, prevSide) < -hw - radius || Math.min(along, prevAlong) > hl + radius ||
    Math.max(along, prevAlong) < -hl - radius)) return null;
  const within = Math.abs(side) <= hw && Math.abs(along) <= hl;

  if (previousRamp === ramp) {
    if (within) return support(kart, ramp, side, along, groundY);
    if (along > hl && prevAlong <= hl && along > prevAlong) {
      const result = leaveTop(kart, ramp, side, along, prevSide, prevAlong, dt, groundY);
      if (result) return result;
    }
    // Salir por un lateral o por la entrada permite caer; no relanza el carro.
    kart.verticalY = Math.max(0, kart.position.y - groundY);
    return 'left';
  }

  // Solo la entrada baja permite subirse desde el suelo, incluso en marcha atrás.
  if (prevAlong <= -hl && along >= -hl && along > prevAlong) {
    const t = (-hl - prevAlong) / (along - prevAlong);
    const entrySide = prevSide + (side - prevSide) * t;
    const entryY = kart.previousPosition.y + (kart.position.y - kart.previousPosition.y) * t;
    if (Math.abs(entrySide) <= hw && entryY <= topHeight(ramp, entrySide, -hl) + 0.35) {
      if (within) return support(kart, ramp, side, along, groundY);
      if (along > hl) {
        const result = leaveTop(kart, ramp, side, along, prevSide, prevAlong, dt, groundY);
        if (result) return result;
      }
    }
  }
  // Aterrizar sobre la cuña, sin absorber vehículos que ya pasan por encima.
  if (within && kart.verticalVel <= 0) {
    const surface = topHeight(ramp, side, along);
    const previousSurface = topHeight(ramp, clamp(prevSide, -hw, hw), clamp(prevAlong, -hl, hl));
    if (kart.previousPosition.y >= previousSurface - 0.03 && kart.position.y <= surface + 0.08) {
      return support(kart, ramp, side, along, groundY);
    }
  }

  const hit = sweepBox(prevSide, prevAlong, side, along, hw + radius, hl + radius);
  if (!hit || hit.nz === -1) return null; // La entrada tiene altura cero.
  const contactSide = clamp(prevSide + (side - prevSide) * hit.t, -hw, hw);
  const contactAlong = clamp(prevAlong + (along - prevAlong) * hit.t, -hl, hl);
  const yAtHit = kart.previousPosition.y + (kart.position.y - kart.previousPosition.y) * hit.t;
  if (yAtHit >= topHeight(ramp, contactSide, contactAlong) - 0.02) return null;

  const correctedSide = hit.nx ? hit.nx * (hw + radius + 0.02) : side;
  const correctedAlong = hit.nz ? hit.nz * (hl + radius + 0.02) : along;
  kart.position.x = ramp.position.x + correctedSide * ramp.forwardZ + correctedAlong * ramp.forwardX;
  kart.position.z = ramp.position.z - correctedSide * ramp.forwardX + correctedAlong * ramp.forwardZ;
  const nx = hit.nx * ramp.forwardZ + hit.nz * ramp.forwardX;
  const nz = -hit.nx * ramp.forwardX + hit.nz * ramp.forwardZ;
  const inward = kart.velocity.x * nx + kart.velocity.z * nz;
  if (inward < 0) { kart.velocity.x -= nx * inward * 1.08; kart.velocity.z -= nz * inward * 1.08; }
  return 'blocked';
}

export function resolveRampContacts(kart, ramps, dt, groundY) {
  if (!kart.alive) return null;
  const previous = kart.rampContact;
  kart.rampContact = null;
  kart.rampPitch = 0;
  kart.rampRoll = 0;
  if (previous && ramps.includes(previous)) {
    const result = resolveOne(kart, previous, previous, dt, groundY);
    if (result) return result;
  }
  for (const ramp of ramps) {
    if (ramp === previous) continue;
    const result = resolveOne(kart, ramp, null, dt, groundY);
    if (result) return result;
  }
  return null;
}
