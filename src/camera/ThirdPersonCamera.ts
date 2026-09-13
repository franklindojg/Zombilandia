/**
 * BloxVerse 3D - ThirdPersonCamera
 * Smooth platformer camera with spherical orbital rotation, zoom, and dynamic wall clipping avoidance.
 */

import * as THREE from 'three';
import { CollisionManager } from '../world/CollisionManager';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private collisionManager: CollisionManager;

  // Orbit angles (radians)
  public yaw: number = 0;
  public pitch: number = 0.35; // ~20 degrees down
  public targetDistance: number = 6.0;
  public currentDistance: number = 6.0;

  // Limits
  public minDistance: number = 2.0;
  public maxDistance: number = 12.0;
  public minPitch: number = -0.25; // looking slightly up
  public maxPitch: number = 1.35;  // looking down

  // Target and smoothing
  private currentFocus: THREE.Vector3 = new THREE.Vector3();
  private targetFocus: THREE.Vector3 = new THREE.Vector3();
  private idealPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(fov: number = 65, aspect: number = 16 / 9) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 300);
    this.collisionManager = CollisionManager.getInstance();
  }

  public update(delta: number, playerPosition: THREE.Vector3, deltaYaw: number, deltaPitch: number, zoomDelta: number): void {
    // Apply camera rotation inputs
    this.yaw -= deltaYaw;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch + deltaPitch));

    // Apply zoom
    if (Math.abs(zoomDelta) > 0.001) {
      this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance + zoomDelta * 3));
    }

    // Target focus: player chest/head height
    this.targetFocus.set(playerPosition.x, playerPosition.y + 1.25, playerPosition.z);

    // Smooth focus tracking
    const focusLerp = 1.0 - Math.exp(-delta * 14);
    this.currentFocus.lerp(this.targetFocus, focusLerp);

    // Compute ideal spherical camera position relative to focus
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    const dirX = sinYaw * cosPitch;
    const dirY = sinPitch;
    const dirZ = cosYaw * cosPitch;

    // Check line of sight against colliders to prevent clipping through walls
    const rayDir = new THREE.Vector3(dirX, dirY, dirZ);
    let allowedDistance = this.targetDistance;

    // Fast ray check against colliders
    const colliders = (this.collisionManager as any).colliders;
    if (colliders && colliders.length > 0) {
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        if (c.type === 'hazard' || c.type === 'checkpoint') continue;

        // Check if box intersects ray segment from currentFocus to currentFocus + rayDir * targetDistance
        const hitDist = this.intersectRayAABB(this.currentFocus, rayDir, c);
        if (hitDist !== null && hitDist > 0.4 && hitDist < allowedDistance) {
          allowedDistance = Math.max(this.minDistance, hitDist - 0.45);
        }
      }
    }

    // Smooth distance adjustment
    const distLerp = 1.0 - Math.exp(-delta * 18);
    this.currentDistance = THREE.MathUtils.lerp(this.currentDistance, allowedDistance, distLerp);

    // Final camera position
    this.idealPosition.set(
      this.currentFocus.x + dirX * this.currentDistance,
      this.currentFocus.y + dirY * this.currentDistance,
      this.currentFocus.z + dirZ * this.currentDistance
    );

    this.camera.position.copy(this.idealPosition);
    this.camera.lookAt(this.currentFocus);
  }

  /**
   * Fast Ray-AABB intersection for wall clipping avoidance.
   */
  private intersectRayAABB(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    box: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number }
  ): number | null {
    let tmin = -Infinity;
    let tmax = Infinity;

    // X slab
    if (Math.abs(dir.x) < 1e-6) {
      if (origin.x < box.minX || origin.x > box.maxX) return null;
    } else {
      let t1 = (box.minX - origin.x) / dir.x;
      let t2 = (box.maxX - origin.x) / dir.x;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }

    // Y slab
    if (Math.abs(dir.y) < 1e-6) {
      if (origin.y < box.minY || origin.y > box.maxY) return null;
    } else {
      let t1 = (box.minY - origin.y) / dir.y;
      let t2 = (box.maxY - origin.y) / dir.y;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }

    // Z slab
    if (Math.abs(dir.z) < 1e-6) {
      if (origin.z < box.minZ || origin.z > box.maxZ) return null;
    } else {
      let t1 = (box.minZ - origin.z) / dir.z;
      let t2 = (box.maxZ - origin.z) / dir.z;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }

    return tmin >= 0 ? tmin : (tmax >= 0 ? tmax : null);
  }

  public setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
