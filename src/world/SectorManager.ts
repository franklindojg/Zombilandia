/**
 * BloxVerse 3D - SectorManager (Chunk Streaming)
 * Splits world into grid sectors. Only sectors near the player and camera view are active.
 * Crucial optimization for Android devices.
 */

import * as THREE from 'three';

export interface Sector {
  id: string;
  gridX: number;
  gridZ: number;
  group: THREE.Group;
  isActive: boolean;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class SectorManager {
  private sectors: Map<string, Sector> = new Map();
  public sectorSize: number = 50; // 50m x 50m chunks
  private currentSectorId: string = '';
  private container: THREE.Object3D;

  constructor(container: THREE.Object3D, sectorSize: number = 50) {
    this.container = container;
    this.sectorSize = sectorSize;
  }

  public getSector(gridX: number, gridZ: number): Sector {
    const id = `Sector_${gridX}_${gridZ}`;
    if (!this.sectors.has(id)) {
      const group = new THREE.Group();
      group.name = id;
      this.container.add(group);

      const sector: Sector = {
        id,
        gridX,
        gridZ,
        group,
        isActive: true,
        minX: gridX * this.sectorSize,
        maxX: (gridX + 1) * this.sectorSize,
        minZ: gridZ * this.sectorSize,
        maxZ: (gridZ + 1) * this.sectorSize,
      };
      this.sectors.set(id, sector);
    }
    return this.sectors.get(id)!;
  }

  public getSectorForPosition(x: number, z: number): Sector {
    const gx = Math.floor(x / this.sectorSize);
    const gz = Math.floor(z / this.sectorSize);
    return this.getSector(gx, gz);
  }

  public update(playerPos: THREE.Vector3, cameraDir: THREE.Vector3): void {
    const currentGx = Math.floor(playerPos.x / this.sectorSize);
    const currentGz = Math.floor(playerPos.z / this.sectorSize);
    const sectorKey = `${currentGx}_${currentGz}`;

    if (sectorKey === this.currentSectorId) {
      return; // Same sector, keep current activation
    }
    this.currentSectorId = sectorKey;

    // Active radius: current sector + 1 ring neighbors + bias towards camera forward
    const forwardGx = Math.round(cameraDir.x);
    const forwardGz = Math.round(cameraDir.z);

    this.sectors.forEach((sector) => {
      const dx = sector.gridX - currentGx;
      const dz = sector.gridZ - currentGz;

      // Keep active if distance <= 1 chunk, or 2 chunks in forward direction
      const isNeighbor = Math.abs(dx) <= 1 && Math.abs(dz) <= 1;
      const isForwardMargin =
        Math.abs(dx - forwardGx) <= 1 &&
        Math.abs(dz - forwardGz) <= 1 &&
        Math.abs(dx) <= 2 &&
        Math.abs(dz) <= 2;

      const shouldBeActive = isNeighbor || isForwardMargin;

      if (sector.isActive !== shouldBeActive) {
        sector.isActive = shouldBeActive;
        sector.group.visible = shouldBeActive;
      }
    });
  }

  public getAllSectors(): Sector[] {
    return Array.from(this.sectors.values());
  }
}
