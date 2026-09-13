/**
 * BloxVerse 3D - Collectible & Sparkle Pool
 * Manages floating 3D rotating coins and high-performance pooled collection effects.
 */

import * as THREE from 'three';
import { AssetManager } from '../core/AssetManager';
import { AudioManager } from '../core/AudioManager';

export interface CoinInstance {
  id: string;
  mesh: THREE.Mesh;
  baseY: number;
  isCollected: boolean;
  value: number;
}

interface SparkleParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

export class CollectibleManager {
  private coins: CoinInstance[] = [];
  private particlePool: SparkleParticle[] = [];
  private scene: THREE.Scene;
  private particleGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);
    this.initParticlePool(30);
  }

  private initParticlePool(size: number): void {
    const assets = AssetManager.getInstance();
    const geo = assets.getBoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Gold yellow

    for (let i = 0; i < size; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.particleGroup.add(mesh);
      this.particlePool.push({
        mesh,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.5,
        active: false,
      });
    }
  }

  public addCoin(id: string, pos: THREE.Vector3, value: number = 1): void {
    const assets = AssetManager.getInstance();

    // Stylized gold block cylinder coin
    const geo = assets.getCylinderGeometry(0.42, 0.42, 0.14, 12);
    const mat = assets.getStandardMaterial('#eab308', 0.25, 0.85); // Lustrous metallic gold
    const mesh = new THREE.Mesh(geo, mat);

    // Lay coin vertical like a real spinning arcade coin
    mesh.rotation.x = Math.PI / 2;
    mesh.position.copy(pos);
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.coins.push({
      id,
      mesh,
      baseY: pos.y,
      isCollected: false,
      value,
    });
  }

  public spawnCollectEffect(pos: THREE.Vector3): void {
    // Spawn 8-10 particles from pool
    let spawned = 0;
    for (let i = 0; i < this.particlePool.length && spawned < 9; i++) {
      const p = this.particlePool[i];
      if (!p.active) {
        p.active = true;
        p.life = 0.55;
        p.maxLife = 0.55;
        p.mesh.position.copy(pos);
        p.mesh.visible = true;

        // Random burst velocity
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        const speed = 2.5 + Math.random() * 2.5;

        p.vel.set(
          Math.cos(theta) * Math.cos(phi) * speed,
          Math.sin(phi) * speed + 2.0,
          Math.sin(theta) * Math.cos(phi) * speed
        );
        spawned++;
      }
    }
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    onCollect: (coin: CoinInstance) => void
  ): void {
    const rotSpeed = delta * 2.8;
    const now = performance.now() * 0.003;

    // 1. Update coins
    for (let i = 0; i < this.coins.length; i++) {
      const c = this.coins[i];
      if (c.isCollected) continue;

      // Spin & bob
      c.mesh.rotation.z += rotSpeed;
      c.mesh.position.y = c.baseY + Math.sin(now + i) * 0.18;

      // Distance check to player
      const dx = playerPos.x - c.mesh.position.x;
      const dy = playerPos.y + 0.8 - c.mesh.position.y;
      const dz = playerPos.z - c.mesh.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      // Pickup radius: 1.4m
      if (distSq < 1.96) {
        c.isCollected = true;
        c.mesh.visible = false;
        AudioManager.getInstance().playCoin();
        this.spawnCollectEffect(c.mesh.position);
        onCollect(c);
      }
    }

    // 2. Update pooled particles
    for (let i = 0; i < this.particlePool.length; i++) {
      const p = this.particlePool[i];
      if (p.active) {
        p.life -= delta;
        if (p.life <= 0) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          p.vel.y -= 9.8 * delta; // Gravity on sparkle
          p.mesh.position.addScaledVector(p.vel, delta);
          const scale = (p.life / p.maxLife) * 1.3;
          p.mesh.scale.set(scale, scale, scale);
        }
      }
    }
  }

  public getRemainingCount(): number {
    return this.coins.filter((c) => !c.isCollected).length;
  }

  public resetCoins(): void {
    this.coins.forEach((c) => {
      c.isCollected = false;
      c.mesh.visible = true;
    });
  }
}
