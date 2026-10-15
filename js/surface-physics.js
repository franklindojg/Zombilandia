// Consultas O(1) a los triángulos que realmente se dibujan. Sin raycasts por frame.
export const WHEEL_CLEARANCE = 0.028;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class DriveSurface {
  constructor({ size, segments, groundPositions, roadInner, roadOuter, roadPositions,
    angularSegments = 128, radialSegments = 8 }) {
    Object.assign(this, { size, segments, groundPositions, roadInner, roadOuter,
      roadPositions, angularSegments, radialSegments });
    this.directions = new Float64Array((angularSegments + 1) * 2);
    for (let i = 0; i <= angularSegments; i++) {
      const angle = i / angularSegments * Math.PI * 2;
      this.directions[i * 2] = Math.cos(angle);
      this.directions[i * 2 + 1] = -Math.sin(angle);
    }
  }
  groundHeight(x, z) {
    const p = this.groundPositions;
    if (!p) return 0; // Interfaz de Three.js simulada en las pruebas de integración.
    const n = this.segments, half = this.size / 2, step = this.size / n;
    x = clamp(x, -half, half); z = clamp(z, -half, half);
    const ix = clamp(Math.floor((x + half) / step), 0, n - 1);
    const iz = clamp(Math.floor((z + half) / step), 0, n - 1);
    const a = (ix + (n + 1) * iz) * 3, b = a + (n + 1) * 3, d = a + 3, c = b + 3;
    const fx = clamp((x - p[a]) / (p[d] - p[a]), 0, 1);
    const fz = clamp((z - p[a + 2]) / (p[b + 2] - p[a + 2]), 0, 1);
    return fx + fz <= 1 ? p[a + 1] * (1 - fx - fz) + p[d + 1] * fx + p[b + 1] * fz :
      p[b + 1] * (1 - fx) + p[d + 1] * (1 - fz) + p[c + 1] * (fx + fz - 1);
  }
  triangleHeight(a, b, c, x, z) {
    const p = this.roadPositions;
    a *= 3; b *= 3; c *= 3;
    const bx = p[b] - p[a], bz = p[b + 2] - p[a + 2];
    const cx = p[c] - p[a], cz = p[c + 2] - p[a + 2];
    const dx = x - p[a], dz = z - p[a + 2], determinant = bx * cz - bz * cx;
    const u = (dx * cz - dz * cx) / determinant, v = (bx * dz - bz * dx) / determinant;
    if (u < -1e-10 || v < -1e-10 || u + v > 1.0000000001) return -Infinity;
    return p[a + 1] + u * (p[b + 1] - p[a + 1]) + v * (p[c + 1] - p[a + 1]);
  }
  roadCellHeight(sector, row, x, z) {
    if (row < 0 || row >= this.radialSegments) return -Infinity;
    const n = this.angularSegments;
    sector = (sector + n) % n;
    const a = sector + (n + 1) * row, b = a + n + 1, d = a + 1;
    const height = this.triangleHeight(a, b, d, x, z);
    return height !== -Infinity ? height : this.triangleHeight(b, b + 1, d, x, z);
  }
  roadHeight(x, z) {
    if (!this.roadPositions) return -Infinity;
    const r2 = x * x + z * z, n = this.angularSegments;
    const innerChord = this.roadInner * Math.cos(Math.PI / n);
    if (r2 < (innerChord - 0.001) ** 2 || r2 > (this.roadOuter + 0.001) ** 2) return -Infinity;
    let angle = Math.atan2(-z, x); if (angle < 0) angle += Math.PI * 2;
    const sector = Math.min(n - 1, Math.floor(angle / (Math.PI * 2) * n));
    const dirs = this.directions, i = sector * 2;
    const determinant = dirs[i] * dirs[i + 3] - dirs[i + 1] * dirs[i + 2];
    const rho = ((x * dirs[i + 3] - z * dirs[i + 2]) + (dirs[i] * z - dirs[i + 1] * x)) / determinant;
    const row = clamp(Math.floor((rho - this.roadInner) / (this.roadOuter - this.roadInner) * this.radialSegments), 0, this.radialSegments - 1);
    let height = this.roadCellHeight(sector, row, x, z);
    if (height !== -Infinity) return height;
    // Vecinos únicamente en los bordes cuantizados del BufferGeometry Float32.
    for (let ds = -1; ds <= 1; ds++) for (let dr = -1; dr <= 1; dr++) {
      height = this.roadCellHeight(sector + ds, row + dr, x, z);
      if (height !== -Infinity) return height;
    }
    return -Infinity;
  }
  heightAt(x, z) {
    const ground = this.groundHeight(x, z), road = this.roadHeight(x, z);
    this.lastLayer = road > ground ? 1 : 0;
    return Math.max(ground, road);
  }
}

export function setContactAxes(out, heading, pitch, roll) {
  const sh = Math.sin(heading), ch = Math.cos(heading), sp = Math.sin(pitch), cp = Math.cos(pitch);
  const sr = Math.sin(roll), cr = Math.cos(roll);
  Object.assign(out, { pitch, roll,
    rightX: ch * cr + sh * sp * sr, rightY: cp * sr, rightZ: -sh * cr + ch * sp * sr,
    forwardX: sh * cp, forwardY: -sp, forwardZ: ch * cp,
    upX: -ch * sr + sh * sp * cr, upY: cp * cr, upZ: sh * sr + ch * sp * cr });
  return out;
}

const ARC_SIN = [-1, -Math.sqrt(3) / 2, -0.5, 0, 0.5, Math.sqrt(3) / 2, 1];
const ARC_COS = [0, 0.5, Math.sqrt(3) / 2, 1, Math.sqrt(3) / 2, 0.5, 0];
function tireRadiusAt(wheel, axial) {
  const tube = wheel.radius * 0.24, shoulder = wheel.width * 0.36;
  const distance = Math.min(Math.abs(axial - shoulder), Math.abs(axial + shoulder));
  const tread = Math.abs(axial) <= wheel.width * 0.39 ? wheel.radius : 0;
  return Math.max(tread, wheel.radius * 0.76 + Math.sqrt(Math.max(0, tube * tube - distance * distance)));
}
function tireSupportHeight(pose, x, z, wheel, sample, steer, suspension = 0) {
  const angle = wheel.isFront ? steer : 0, cs = Math.cos(angle), sn = Math.sin(angle);
  const shoulder = wheel.width * 0.36, tread = wheel.width * 0.39, extent = shoulder + wheel.radius * 0.24;
  const profile = wheel.contactProfile || (wheel.contactProfile = {
    axes: [-extent, -tread, -shoulder, 0, shoulder, tread, extent],
    radii: [-extent, -tread, -shoulder, 0, shoulder, tread, extent].map(axis => tireRadiusAt(wheel, axis))
  });
  const previousHeights = pose.tirePreviousHeights || (pose.tirePreviousHeights = new Float64Array(7));
  const previousLayers = pose.tirePreviousLayers || (pose.tirePreviousLayers = new Float64Array(7));
  const result = pose.tirePoint || (pose.tirePoint = { height: 0 });
  let minimum = -Infinity;
  // Cilindro y hombros toroidales completos: también el borde exterior de la goma.
  const pointHeight = (axial, radius, sin, cos) => {
    const forward = radius * sin, bottom = wheel.y - radius * cos;
    const wx = wheel.x + axial * cs + forward * sn, wz = wheel.z - axial * sn + forward * cs;
    const dx = pose.rightX * wx + pose.forwardX * wz + pose.upX * bottom;
    const dz = pose.rightZ * wx + pose.forwardZ * wz + pose.upZ * bottom;
    const dy = pose.rightY * wx + pose.forwardY * wz + pose.upY * bottom;
    result.height = sample(x + dx + pose.upX * suspension, z + dz + pose.upZ * suspension);
    result.layer = sample.lastLayer || 0;
    return result.height - dy;
  };
  for (let axisIndex = 0; axisIndex < 7; axisIndex++) {
    const axial = profile.axes[axisIndex], radius = profile.radii[axisIndex];
    let lastAngle = 0, lastHeight = 0, lastLayer = 0;
    for (let arc = 0; arc <= 6; arc++) {
      const theta = -Math.PI / 2 + arc * Math.PI / 6;
      minimum = Math.max(minimum, pointHeight(axial, radius, ARC_SIN[arc], ARC_COS[arc]));
      const height = result.height, layer = result.layer;
      if (arc > 0 && (layer !== lastLayer || Math.abs(height - lastHeight) > 0.2)) {
        let lo = lastAngle, hi = theta, loH = lastHeight, hiH = height;
        const loLayer = lastLayer, layerEdge = lastLayer !== layer;
        for (let iteration = 0; iteration < 8; iteration++) {
          const mid = (lo + hi) / 2;
          minimum = Math.max(minimum, pointHeight(axial, radius, Math.sin(mid), Math.cos(mid)));
          const mh = result.height;
          if (layerEdge ? result.layer !== loLayer : Math.abs(mh - loH) > Math.abs(hiH - mh)) { hi = mid; hiH = mh; }
          else { lo = mid; loH = mh; }
        }
      }
      if (axisIndex > 0 && (layer !== previousLayers[arc] || Math.abs(height - previousHeights[arc]) > 0.2)) {
        let lo = profile.axes[axisIndex - 1], hi = axial, loH = previousHeights[arc], hiH = height;
        const loLayer = previousLayers[arc], layerEdge = loLayer !== layer;
        for (let iteration = 0; iteration < 8; iteration++) {
          const mid = (lo + hi) / 2;
          minimum = Math.max(minimum, pointHeight(mid, tireRadiusAt(wheel, mid), ARC_SIN[arc], ARC_COS[arc]));
          const mh = result.height;
          if (layerEdge ? result.layer !== loLayer : Math.abs(mh - loH) > Math.abs(hiH - mh)) { hi = mid; hiH = mh; }
          else { lo = mid; loH = mh; }
        }
      }
      previousHeights[arc] = height;
      previousLayers[arc] = layer;
      lastAngle = theta; lastHeight = height; lastLayer = layer;
    }
  }
  return minimum;
}

export function minimumChassisHeight(pose, x, z, wheels, sample, steer) {
  const minima = pose.wheelMinima || (pose.wheelMinima = new Float64Array(4));
  let minimum = -Infinity;
  for (let i = 0; i < 4; i++) {
    minima[i] = tireSupportHeight(pose, x, z, wheels[i], sample, steer);
    minimum = Math.max(minimum, minima[i]);
  }
  return minimum + WHEEL_CLEARANCE;
}

export function fitGroundPose(out, x, z, heading, wheels, sample, steer = 0) {
  const sh = Math.sin(heading), ch = Math.cos(heading);
  const heights = out.heights || (out.heights = new Float64Array(4));
  for (let i = 0; i < 4; i++) {
    const w = wheels[i];
    heights[i] = sample(x + ch * w.x + sh * w.z, z - sh * w.x + ch * w.z);
  }
  const front = (heights[0] + heights[1]) / 2, back = (heights[2] + heights[3]) / 2;
  const longitudinal = (front - back) / (wheels[0].z - wheels[2].z);
  const lateral = ((heights[1] - heights[0]) / (wheels[1].x - wheels[0].x) +
    (heights[3] - heights[2]) / (wheels[3].x - wheels[2].x)) / 2;
  const pitch = -Math.atan(longitudinal), roll = Math.atan(lateral * Math.cos(pitch));
  setContactAxes(out, heading, pitch, roll);
  out.height = minimumChassisHeight(out, x, z, wheels, sample, steer);
  return out;
}

export function wheelSuspensionOffset(pose, x, y, z, wheel, sample, steer, index) {
  const initial = index === undefined ? tireSupportHeight(pose, x, z, wheel, sample, steer) : pose.wheelMinima[index];
  const candidate = clamp((initial + WHEEL_CLEARANCE - y) / pose.upY, -0.5, 0);
  if (Math.abs(candidate * pose.upX) + Math.abs(candidate * pose.upZ) < 1e-5) return candidate;
  const needed = tireSupportHeight(pose, x, z, wheel, sample, steer, candidate) + WHEEL_CLEARANCE;
  if (y + pose.upY * candidate >= needed - 1e-6) return candidate;
  // Mantener siempre el lado seguro, evitando oscilaciones al cruzar un escalón.
  let low = candidate, high = 0;
  for (let iteration = 0; iteration < 8; iteration++) {
    const mid = (low + high) / 2;
    const required = tireSupportHeight(pose, x, z, wheel, sample, steer, mid) + WHEEL_CLEARANCE;
    if (y + pose.upY * mid >= required) high = mid;
    else low = mid;
  }
  return high;
}
