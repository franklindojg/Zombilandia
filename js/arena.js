// arena.js — Vigilante Kart 8 / PS1 Android
import * as THREE from 'three';
import { CUPS_DATA } from './config.js';
import { state } from './state.js';
import { scene, ambientLight, dirLight, worldGroup, IS_ANDROID_LIKE, gameTexture, disposeGroup, releaseProjectile, poolExplosions } from './graphics.js';
import { resetEffects } from './effects.js';
import { RAMP_WIDTH, RAMP_LENGTH, RAMP_HEIGHT } from './ramp-physics.js';
import { DriveSurface } from './surface-physics.js';
import { createArenaSky } from './sky.js';
import { createMeadowProps } from './meadow-props.js';

const CEMENT_WALL_SPRITES = {
  meadow: 'cement_blocks.png',
  desert: 'cement_blocks_weathered.png',
  snow: 'cement_blocks_light.png',
  volcano: 'cement_blocks_dark.png',
  rainbow: 'cement_blocks.png'
};

function createArenaFloorTexture(cupData) {
      return gameTexture(`arena/${cupData.groundSprite || `${cupData.biomeKey}_ground.png`}`, 55);
    }

function createPerimeterBarrier(cupData, arenaRadius, surface) {
  const meadow = cupData.biomeKey === 'meadow';
  const height = meadow ? 6 : 36;
  // La cerca se adapta al terreno y usa una sola malla con recorte de alpha.
  const geometry = new THREE.CylinderGeometry(arenaRadius, arenaRadius, height, meadow ? 256 : 64, 1, true);
  const map = gameTexture(`arena/${meadow ? cupData.barrierSprite || 'wooden_fence_v2.png' : CEMENT_WALL_SPRITES[cupData.biomeKey] || CEMENT_WALL_SPRITES.meadow}`);
  if (map.wrapS !== THREE.RepeatWrapping) {
    map.wrapS = THREE.RepeatWrapping;
    if (!meadow) map.wrapT = THREE.RepeatWrapping;
    map.needsUpdate = true;
  }
  const uv = geometry.attributes.uv;
  const tileWidth = meadow ? 12 : 4.8;
  const repeats = Math.max(1, Math.round(Math.PI * 2 * arenaRadius / tileWidth));
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * repeats, uv.getY(i) * (meadow ? 1 : height / 4.8));
  }
  uv.needsUpdate = true;
  if (meadow) {
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const groundY = surface.heightAt(positions.getX(i), positions.getZ(i));
      positions.setY(i, groundY + (positions.getY(i) > 0 ? height : -0.4));
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  const material = new THREE.MeshLambertMaterial({
    map, color: 0xffffff, side: THREE.DoubleSide,
    // Opaque con alphaTest: evita ordenar transparencias y deja ver los huecos.
    alphaTest: meadow ? 0.5 : 0
  });
  const barrier = new THREE.Mesh(geometry, material);
  barrier.name = meadow ? 'Cerca_perimetral_madera' : 'Muro_perimetral_cemento';
  barrier.position.y = meadow ? 0 : 14;
  return barrier;
}

    function getTerrainHeight(x, z, arenaRadius, heightAmp) {
      // Colinas suaves perimetrales y hondonada central de combate
      const distRatio = Math.min(1.2, Math.hypot(x, z) / arenaRadius);
      const waves =
        Math.sin(x * 0.012) * Math.cos(z * 0.012) * heightAmp * 0.65 +
        Math.sin((x + z) * 0.006) * heightAmp * 0.35;
      return waves * Math.min(1, distRatio * 1.35);
    }

    function getDriveSurfaceHeight(x, z, arena) {
      return arena.surface ? arena.surface.heightAt(x, z) : getTerrainHeight(x, z, arena.arenaRadius, arena.heightAmp);
    }

    function buildCombatArena5X(levelObj) {
      resetEffects();
      state.projectiles.forEach(releaseProjectile);
      for (const explosion of state.explosions) {
        worldGroup.remove(explosion.mesh);
        poolExplosions.push(explosion);
      }
      disposeGroup(worldGroup);
      state.weaponCrates = [];
      state.repairWrenches = [];
      state.jumpRamps = [];
      state.arenaObstacles = [];
      state.projectiles = [];
      state.explosions = [];

      const cupData = CUPS_DATA[levelObj.cup];
      const arenaRadius = levelObj.radius5x; // 560 a 1020m de radio (Escala 5X)

      scene.background = new THREE.Color(cupData.skyTop);
      scene.fog = new THREE.FogExp2(cupData.fogColor, 0.00055);
      ambientLight.color.setHex(cupData.ambientColor);
      dirLight.color.setHex(cupData.sunColor);
      worldGroup.add(createArenaSky(cupData, levelObj));

      // 1. Malla 3D del Terreno Ondulado 5X
      const size = arenaRadius * 2.5;
      const segs = IS_ANDROID_LIKE ? 64 : 90;
      const groundGeo = new THREE.PlaneGeometry(size, size, segs, segs);
      groundGeo.rotateX(-Math.PI / 2);

      const posAttr = groundGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const vy = getTerrainHeight(vx, vz, arenaRadius, levelObj.heightAmp);
        posAttr.setY(i, vy);
      }
      groundGeo.computeVertexNormals();

      const groundMat = new THREE.MeshLambertMaterial({
        map: createArenaFloorTexture(cupData),
        color: 0xffffff,
        flatShading: true
      });
      const groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.name = 'Terreno_superficie_contacto';
      groundMesh.receiveShadow = !IS_ANDROID_LIKE;
      worldGroup.add(groundMesh);

      // 2. Anillo de Carreteras Cruzadas de Asfalto/Brea Oscura dentro de la Arena
      const ringGeo = new THREE.RingGeometry(arenaRadius * 0.45, arenaRadius * 0.56, 128, 8);
      ringGeo.rotateX(-Math.PI / 2);
      const roadPositions = ringGeo.attributes.position;
      for (let i = 0; i < roadPositions.count; i++) {
        roadPositions.setY(i, getTerrainHeight(roadPositions.getX(i), roadPositions.getZ(i),
          arenaRadius, levelObj.heightAmp) + 0.45);
      }
      ringGeo.computeVertexNormals();
      const roadMat = new THREE.MeshLambertMaterial({
        map: gameTexture(`arena/${cupData.roadSprite || `${cupData.biomeKey}_road.png`}`, 12),
        color: cupData.biomeKey === 'meadow' ? 0xc0ceac : 0xffffff
      });
      const roadRing = new THREE.Mesh(ringGeo, roadMat);
      roadRing.name = 'Carretera_sobre_terreno';
      worldGroup.add(roadRing);
      const surface = new DriveSurface({ size, segments: segs, groundPositions: posAttr.array,
        roadInner: arenaRadius * 0.45, roadOuter: arenaRadius * 0.56,
        roadPositions: roadPositions.array });

      // 3. Pradera con cerca de madera; los otros biomas conservan el cemento.
      worldGroup.add(createPerimeterBarrier(cupData, arenaRadius, surface));

      // 4. Las 12 rampas se renderizan en una sola instancia de dibujo.
      const numRamps = 12;
      const rampGeo = new THREE.BoxGeometry(RAMP_WIDTH, RAMP_HEIGHT, RAMP_LENGTH);
      const rampPositions = rampGeo.attributes.position;
      for (let i = 0; i < rampPositions.count; i++) {
        const slopeY = (rampPositions.getZ(i) / RAMP_LENGTH + 0.5) * RAMP_HEIGHT;
        rampPositions.setY(i, rampPositions.getY(i) > 0 ? slopeY : 0);
      }
      rampGeo.computeVertexNormals();
      const rampMat = new THREE.MeshLambertMaterial({ map: gameTexture('arena/ramp.png') });
      const rampInstances = new THREE.InstancedMesh(rampGeo, rampMat, numRamps);
      rampInstances.name = 'Rampas_colision_cuna';
      const tempObj = new THREE.Object3D();
      for (let i = 0; i < numRamps; i++) {
        const ang = (i / numRamps) * Math.PI * 2;
        const dist = arenaRadius * (i % 2 === 0 ? 0.35 : 0.68);
        const rx = Math.cos(ang) * dist;
        const rz = Math.sin(ang) * dist;
        const ry = surface.heightAt(rx, rz);
        const heading = ang + Math.PI / 2;
        const fx = Math.sin(heading), fz = Math.cos(heading);
        const heightAt = (x, z) => surface.heightAt(x, z);
        const forwardSlope = (heightAt(rx + fx * 9, rz + fz * 9) - heightAt(rx - fx * 9, rz - fz * 9)) / RAMP_LENGTH;
        const sideSlope = (heightAt(rx + fz * 7, rz - fx * 7) - heightAt(rx - fz * 7, rz + fx * 7)) / RAMP_WIDTH;
        const baseY = ry + 0.12;
        // Orientación local explícita: la pendiente visual coincide con el collider.
        tempObj.matrix.set(fz, 0, fx, rx, sideSlope, 1, forwardSlope, baseY,
          -fx, 0, fz, rz, 0, 0, 0, 1);
        rampInstances.setMatrixAt(i, tempObj.matrix);
        state.jumpRamps.push({ position: new THREE.Vector3(rx, baseY, rz),
          width: RAMP_WIDTH, length: RAMP_LENGTH, height: RAMP_HEIGHT,
          forwardX: fx, forwardZ: fz, forwardSlope, sideSlope });
      }
      rampInstances.instanceMatrix.needsUpdate = true;
      worldGroup.add(rampInstances);

      // 5. Los demás biomas conservan sus obstáculos; pradera usa modelos rurales.
      const numObstacles = 34;
      const biome = cupData.biomeKey;
      if (biome !== 'meadow') {
      let obstacleGeometry;
      if (biome === 'desert') obstacleGeometry = new THREE.CylinderGeometry(6.5, 7.5, 28, 7);
      else if (biome === 'volcano') obstacleGeometry = new THREE.ConeGeometry(8.45, 32, 5);
      else if (biome === 'snow') obstacleGeometry = new THREE.CylinderGeometry(5.2, 7.8, 26, 6);
      else obstacleGeometry = new THREE.BoxGeometry(13, 22, 13);
      const obstacleMaterial = new THREE.MeshLambertMaterial({
        map: gameTexture(`arena/${biome}_obstacle.png`), flatShading: true,
        color: 0xffffff
      });
      const obstacleInstances = new THREE.InstancedMesh(obstacleGeometry, obstacleMaterial, numObstacles);
      obstacleInstances.castShadow = false;
      obstacleInstances.receiveShadow = false;
      for (let i = 0; i < numObstacles; i++) {
        const ang = (i / numObstacles) * Math.PI * 2 + (i % 3) * 0.3;
        const dist = 75 + ((i * 47) % (arenaRadius - 110));
        const ox = Math.cos(ang) * dist;
        const oz = Math.sin(ang) * dist;
        const oy = getTerrainHeight(ox, oz, arenaRadius, levelObj.heightAmp);
        tempObj.position.set(ox, oy + 11, oz);
        tempObj.rotation.set(0, ang, 0);
        tempObj.updateMatrix();
        obstacleInstances.setMatrixAt(i, tempObj.matrix);
        state.arenaObstacles.push({ position: new THREE.Vector3(ox, oy, oz), radius: 8.7 });
      }
      obstacleInstances.instanceMatrix.needsUpdate = true;
      worldGroup.add(obstacleInstances);
      }

      // 6. Cajas de Armamento V8 (Weapon Crates) y Llaves Inglesas de Reparación (Wrenches)
      const numCrates = 26;
      const crateGeo = new THREE.BoxGeometry(3.4, 3.4, 3.4);
      const crateMat = new THREE.MeshLambertMaterial({ map: gameTexture('arena/crate.png') });

      for (let i = 0; i < numCrates; i++) {
        const ang = (i / numCrates) * Math.PI * 2;
        const dist = 55 + ((i * 65) % (arenaRadius - 90));
        const cx = Math.cos(ang) * dist;
        const cz = Math.sin(ang) * dist;
        const cy = getTerrainHeight(cx, cz, arenaRadius, levelObj.heightAmp) + 2.4;

        const mesh = new THREE.Mesh(crateGeo, crateMat);
        mesh.position.set(cx, cy, cz);
        worldGroup.add(mesh);
        state.weaponCrates.push({ mesh, basePos: new THREE.Vector3(cx, cy, cz), active: true, respawnTimer: 0 });
      }

      const numWrenches = 12;
      const wrenchGeo = new THREE.OctahedronGeometry(2.4, 0);
      const wrenchMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.6,
        roughness: 0.2
      });

      for (let i = 0; i < numWrenches; i++) {
        const ang = (i / numWrenches) * Math.PI * 2 + 0.25;
        const dist = arenaRadius * 0.5;
        const wx = Math.cos(ang) * dist;
        const wz = Math.sin(ang) * dist;
        const wy = getTerrainHeight(wx, wz, arenaRadius, levelObj.heightAmp) + 2.5;

        const mesh = new THREE.Mesh(wrenchGeo, wrenchMat);
        mesh.position.set(wx, wy, wz);
        worldGroup.add(mesh);
        state.repairWrenches.push({ mesh, basePos: new THREE.Vector3(wx, wy, wz), active: true, respawnTimer: 0 });
      }

      if (biome === 'meadow') {
        const pickups = [...state.weaponCrates.map(c => c.basePos), ...state.repairWrenches.map(w => w.basePos)];
        const rural = createMeadowProps(levelObj, surface, state.jumpRamps, pickups);
        worldGroup.add(rural.group);
        state.arenaObstacles.push(...rural.obstacles);
      }

      state.activeArena = {
        levelObj,
        cupData,
        arenaRadius,
        heightAmp: levelObj.heightAmp,
        surface
      };
    }

export { getTerrainHeight, getDriveSurfaceHeight, buildCombatArena5X };
