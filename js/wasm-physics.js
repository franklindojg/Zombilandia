// Nucleo fisico WebAssembly. Interfaz con fallback a la fisica JS de vehicles.js.
// WASM acelera calculos CPU: no sustituye Three.js ni el GPU/WebGL.
const SCRATCH_PTR = 8192;
const SCRATCH_LENGTH = 40;
const CARS_PTR = 16384;
const OBSTACLES_PTR = 20480;
const MAX_CARS = 8;
const MAX_OBSTACLES = 128;

const wasmPhysics = {
  ready: false,
  status: 'Cargando WASM',
  instance: null,
  scratch: null,
  carBuffer: null,
  obstacleBuffer: null,
  // Colisiones en bloque; sin JS por cada par kart-obstáculo.
  resolveObstacles(cars, obstacles) {
    if (!this.ready || cars.length > MAX_CARS || obstacles.length > MAX_OBSTACLES) return false;
    try {
      const c = this.carBuffer;
      const o = this.obstacleBuffer;
      for (let i = 0; i < cars.length; i++) {
        const kart = cars[i], offset = i * 5;
        c[offset] = kart.position.x;
        c[offset + 1] = kart.position.z;
        c[offset + 2] = kart.velocity.x;
        c[offset + 3] = kart.velocity.z;
        c[offset + 4] = kart.alive ? 1 : 0;
      }
      for (let i = 0; i < obstacles.length; i++) {
        const item = obstacles[i], offset = i * 3;
        o[offset] = item.position.x;
        o[offset + 1] = item.position.z;
        o[offset + 2] = item.radius;
      }
      this.instance.exports.vk_obstacles(CARS_PTR, cars.length, OBSTACLES_PTR, obstacles.length);
      for (let i = 0; i < cars.length; i++) {
        const offset = i * 5, kart = cars[i];
        if (!kart.alive) continue;
        if (!Number.isFinite(c[offset]) || !Number.isFinite(c[offset + 1])) throw new Error('Colisión WASM inválida');
        kart.position.x = c[offset];
        kart.position.z = c[offset + 1];
        kart.velocity.x = c[offset + 2];
        kart.velocity.z = c[offset + 3];
      }
      return true;
    } catch (error) {
      this.ready = false;
      this.status = 'JS (WASM desactivado tras error)';
      console.warn('[V8] Colisiones WASM fallaron; usando JS:', error);
      return false;
    }
  },
  stepVehicle(vehicle, input, arena, dt, engineForce, maxForwardSpeed, baseGrip, drag) {
    if (!this.ready) return false;
    try {
      const s = this.scratch;
      s[0] = vehicle.position.x;
      s[1] = vehicle.position.z;
      s[2] = vehicle.velocity.x;
      s[3] = vehicle.velocity.z;
      s[4] = vehicle.heading;
      s[5] = vehicle.steerAngle;
      s[6] = vehicle.driftCharge;
      s[7] = vehicle.isDrifting ? 1 : 0;
      s[8] = vehicle.driftDirection;
      s[9] = vehicle.boostTimer;
      s[10] = vehicle.pitchAngle;
      s[11] = vehicle.rollAngle;
      s[12] = vehicle.currentGrip;
      s[13] = vehicle.verticalY;
      s[14] = vehicle.verticalVel;
      s[17] = vehicle.driftBlend;
      s[24] = dt;
      s[25] = input.throttle;
      s[26] = input.steer;
      s[27] = input.drift ? 1 : 0;
      s[28] = engineForce;
      s[29] = maxForwardSpeed;
      s[30] = baseGrip;
      s[31] = drag;
      s[32] = arena.arenaRadius;
      s[33] = arena.heightAmp;
      this.instance.exports.vk_step(SCRATCH_PTR);
      for (const index of [0, 1, 2, 3, 4, 10, 11, 15, 17]) {
        if (!Number.isFinite(s[index])) throw new Error('Estado WASM no finito en campo ' + index);
      }
      vehicle.position.set(s[0], s[15], s[1]);
      vehicle.velocity.set(s[2], 0, s[3]);
      vehicle.heading = s[4];
      vehicle.steerAngle = s[5];
      vehicle.driftCharge = s[6];
      vehicle.isDrifting = s[7] > 0.5;
      vehicle.driftDirection = s[8];
      vehicle.boostTimer = s[9];
      vehicle.pitchAngle = s[10];
      vehicle.rollAngle = s[11];
      vehicle.currentGrip = s[12];
      vehicle.verticalY = s[13];
      vehicle.verticalVel = s[14];
      vehicle._wasmGroundY = s[15] - s[13];
      vehicle._wasmForwardSpeed = s[16];
      vehicle.driftBlend = s[17];
      return true;
    } catch (e) {
      this.ready = false;
      this.status = 'JS (WASM desactivado tras error)';
      console.error('[V8] El motor WASM falló; volviendo a física JS:', e);
      return false;
    }
  }
};

async function initializeWasmPhysics() {
  if (new URLSearchParams(location.search).get('wasm') === '0') {
    wasmPhysics.status = 'JS (WASM desactivado por URL)';
    return false;
  }
  try {
    // Uso de arrayBuffer compatible con servidores estáticos que envían application/octet-stream.
    const url = new URL('../wasm/physics-core.wasm', import.meta.url);
    url.searchParams.set('v', 'drift-optimized-r1');
    const response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status + ' al solicitar ' + url.pathname);
    const bytes = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, {
      env: { sin: Math.sin, cos: Math.cos, exp: Math.exp }
    });
    if (typeof instance.exports.vk_step !== 'function' || typeof instance.exports.vk_obstacles !== 'function' || !instance.exports.memory) {
      throw new Error('El módulo WASM no tiene las exportaciones esperadas');
    }
    wasmPhysics.instance = instance;
    wasmPhysics.scratch = new Float64Array(instance.exports.memory.buffer, SCRATCH_PTR, SCRATCH_LENGTH);
    wasmPhysics.carBuffer = new Float64Array(instance.exports.memory.buffer, CARS_PTR, MAX_CARS * 5);
    wasmPhysics.obstacleBuffer = new Float64Array(instance.exports.memory.buffer, OBSTACLES_PTR, MAX_OBSTACLES * 3);
    wasmPhysics.ready = true;
    wasmPhysics.status = 'WASM activo';
    console.info('[V8] Física WebAssembly activa (' + bytes.byteLength + ' bytes)');
    return true;
  } catch (error) {
    wasmPhysics.ready = false;
    wasmPhysics.status = 'JS (respaldo)';
    console.warn('[V8] No se pudo cargar física WASM; se usará JavaScript:', error);
    return false;
  }
}
export { wasmPhysics, initializeWasmPhysics };
