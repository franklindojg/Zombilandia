/**
 * BloxVerse 3D - PlatformSystem
 * Manages dynamic moving platforms, rotating obstacles, disappearing platforms, and hazard zones.
 */

import * as THREE from 'three';
import { CollisionManager } from '../world/CollisionManager';
import { AssetManager } from '../core/AssetManager';

export interface MovingPlatformData {
  mesh: THREE.Mesh;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  speed: number;
  width: number;
  depth: number;
  height: number;
  t: number;
  colliderId: string;
}

export interface DisappearingPlatformData {
  mesh: THREE.Mesh;
  initialPos: THREE.Vector3;
  width: number;
  depth: number;
  height: number;
  colliderId: string;
  state: 'idle' | 'warning' | 'hidden' | 'respawning';
  timer: number;
}

export interface RotatingHazardData {
  group: THREE.Group;
  speed: number;
  colliderId: string;
}

export class PlatformSystem {
  private movingPlatforms: MovingPlatformData[] = [];
  private disappearingPlatforms: DisappearingPlatformData[] = [];
  private rotatingHazards: RotatingHazardData[] = [];

  constructor() {}

  public clear(): void {
    this.movingPlatforms = [];
    this.disappearingPlatforms = [];
    this.rotatingHazards = [];
  }

  public addMovingPlatform(
    scene: THREE.Scene,
    start: THREE.Vector3,
    end: THREE.Vector3,
    width: number,
    depth: number,
    height: number,
    speed: number = 2.0,
    colorHex: string = '#0ea5e9'
  ): void {
    const assets = AssetManager.getInstance();
    const geo = assets.getBoxGeometry(width, height, depth);
    const mat = assets.getStandardMaterial(colorHex, 0.4, 0.2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(start);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const colliderId = `moving_plat_${this.movingPlatforms.length}_${Math.random()}`;

    // Add to collision manager as dynamic collider
    CollisionManager.getInstance().addDynamicCollider({
      id: colliderId,
      type: 'box',
      minX: start.x - width / 2,
      maxX: start.x + width / 2,
      minY: start.y - height / 2,
      maxY: start.y + height / 2,
      minZ: start.z - depth / 2,
      maxZ: start.z + depth / 2,
      userData: { velocity: new THREE.Vector3(0, 0, 0) },
    });

    this.movingPlatforms.push({
      mesh,
      startPos: start.clone(),
      endPos: end.clone(),
      speed,
      width,
      depth,
      height,
      t: Math.random() * Math.PI,
      colliderId,
    });
  }

  public addDisappearingPlatform(
    scene: THREE.Scene,
    pos: THREE.Vector3,
    width: number,
    depth: number,
    height: number,
    colorHex: string = '#f59e0b'
  ): void {
    const assets = AssetManager.getInstance();
    const geo = assets.getBoxGeometry(width, height, depth);
    const mat = assets.getStandardMaterial(colorHex, 0.5, 0.1).clone(); // Clone for alpha/flicker
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const colliderId = `disappear_plat_${this.disappearingPlatforms.length}_${Math.random()}`;

    CollisionManager.getInstance().addDynamicCollider({
      id: colliderId,
      type: 'disappearing',
      minX: pos.x - width / 2,
      maxX: pos.x + width / 2,
      minY: pos.y - height / 2,
      maxY: pos.y + height / 2,
      minZ: pos.z - depth / 2,
      maxZ: pos.z + depth / 2,
    });

    this.disappearingPlatforms.push({
      mesh,
      initialPos: pos.clone(),
      width,
      depth,
      height,
      colliderId,
      state: 'idle',
      timer: 0,
    });
  }

  public addRotatingHazard(
    scene: THREE.Scene,
    pivotPos: THREE.Vector3,
    length: number,
    height: number,
    speed: number = 1.8
  ): void {
    const assets = AssetManager.getInstance();
    const group = new THREE.Group();
    group.position.copy(pivotPos);

    // Hazard bar (neon crimson)
    const geo = assets.getBoxGeometry(length, height, 0.5);
    const mat = assets.getStandardMaterial('#ef4444', 0.2, 0.8);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);

    scene.add(group);

    const colliderId = `rotating_hazard_${this.rotatingHazards.length}`;

    CollisionManager.getInstance().addDynamicCollider({
      id: colliderId,
      type: 'hazard',
      minX: pivotPos.x - length / 2,
      maxX: pivotPos.x + length / 2,
      minY: pivotPos.y - height / 2,
      maxY: pivotPos.y + height / 2,
      minZ: pivotPos.z - 0.25,
      maxZ: pivotPos.z + 0.25,
    });

    this.rotatingHazards.push({
      group,
      speed,
      colliderId,
    });
  }

  public update(delta: number, playerPos: THREE.Vector3): void {
    const cm = CollisionManager.getInstance();

    // 1. Update Moving Platforms
    for (let i = 0; i < this.movingPlatforms.length; i++) {
      const p = this.movingPlatforms[i];
      p.t += delta * p.speed;
      const alpha = (Math.sin(p.t) + 1) / 2;

      const prevX = p.mesh.position.x;
      const prevY = p.mesh.position.y;
      const prevZ = p.mesh.position.z;

      p.mesh.position.lerpVectors(p.startPos, p.endPos, alpha);

      // Calculate instantaneous platform velocity
      const dt = Math.max(0.0001, delta);
      const vx = (p.mesh.position.x - prevX) / dt;
      const vy = (p.mesh.position.y - prevY) / dt;
      const vz = (p.mesh.position.z - prevZ) / dt;

      cm.updateDynamicCollider(p.colliderId, {
        minX: p.mesh.position.x - p.width / 2,
        maxX: p.mesh.position.x + p.width / 2,
        minY: p.mesh.position.y - p.height / 2,
        maxY: p.mesh.position.y + p.height / 2,
        minZ: p.mesh.position.z - p.depth / 2,
        maxZ: p.mesh.position.z + p.depth / 2,
      });

      // Update stored platform velocity in collider userData
      const allDynamic = (cm as any).dynamicColliders;
      const col = allDynamic?.find((c: any) => c.id === p.colliderId);
      if (col && col.userData) {
        col.userData.velocity.set(vx, vy, vz);
      }
    }

    // 2. Update Disappearing Platforms
    for (let i = 0; i < this.disappearingPlatforms.length; i++) {
      const dp = this.disappearingPlatforms[i];

      // Check if player stands on it
      const onPlatform =
        playerPos.x >= dp.initialPos.x - dp.width / 2 &&
        playerPos.x <= dp.initialPos.x + dp.width / 2 &&
        playerPos.z >= dp.initialPos.z - dp.depth / 2 &&
        playerPos.z <= dp.initialPos.z + dp.depth / 2 &&
        Math.abs(playerPos.y - (dp.initialPos.y + dp.height / 2)) < 0.3;

      if (dp.state === 'idle' && onPlatform) {
        dp.state = 'warning';
        dp.timer = 0.9; // 0.9s before vanishing
      }

      if (dp.state === 'warning') {
        dp.timer -= delta;
        // Shake / blink
        const shake = (Math.random() - 0.5) * 0.08;
        dp.mesh.position.x = dp.initialPos.x + shake;
        dp.mesh.position.z = dp.initialPos.z + shake;

        if (dp.timer <= 0) {
          dp.state = 'hidden';
          dp.timer = 2.4; // 2.4s hidden before respawn
          dp.mesh.visible = false;
          // Temporarily move collider far away
          cm.updateDynamicCollider(dp.colliderId, {
            minX: -9999, maxX: -9998, minY: -9999, maxY: -9998, minZ: -9999, maxZ: -9998
          });
        }
      } else if (dp.state === 'hidden') {
        dp.timer -= delta;
        if (dp.timer <= 0) {
          dp.state = 'idle';
          dp.mesh.visible = true;
          dp.mesh.position.copy(dp.initialPos);
          cm.updateDynamicCollider(dp.colliderId, {
            minX: dp.initialPos.x - dp.width / 2,
            maxX: dp.initialPos.x + dp.width / 2,
            minY: dp.initialPos.y - dp.height / 2,
            maxY: dp.initialPos.y + dp.height / 2,
            minZ: dp.initialPos.z - dp.depth / 2,
            maxZ: dp.initialPos.z + dp.depth / 2,
          });
        }
      }
    }

    // 3. Update Rotating Hazards
    for (let i = 0; i < this.rotatingHazards.length; i++) {
      const rh = this.rotatingHazards[i];
      rh.group.rotation.y += delta * rh.speed;

      // Update bounding box approximation
      const center = rh.group.position;
      cm.updateDynamicCollider(rh.colliderId, {
        minX: center.x - 3.2,
        maxX: center.x + 3.2,
        minY: center.y - 0.4,
        maxY: center.y + 0.8,
        minZ: center.z - 3.2,
        maxZ: center.z + 3.2,
      });
    }
  }
}
