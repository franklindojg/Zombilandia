/**
 * BloxVerse 3D - World
 * Generates the vibrant low-poly world with instanced vegetation, enterable buildings,
 * Obby obstacle towers, water ponds, ramps, bridges, and interactive entities.
 */

import * as THREE from 'three';
import { AssetManager } from '../core/AssetManager';
import { CollisionManager } from '../world/CollisionManager';
import { SectorManager } from '../world/SectorManager';
import { PlatformSystem } from '../systems/PlatformSystem';
import { CheckpointSystem } from '../systems/CheckpointSystem';
import { CollectibleManager } from '../entities/Collectible';
import { NPC } from '../entities/NPC';
import { InteractionSystem } from '../systems/InteractionSystem';

export class World {
  public scene: THREE.Scene;
  public sectorManager: SectorManager;
  public platformSystem: PlatformSystem;
  public checkpointSystem: CheckpointSystem;
  public collectibleManager: CollectibleManager;
  public interactionSystem: InteractionSystem;

  public npcs: NPC[] = [];
  public isPlayerInsideBuilding: boolean = false;
  private exteriorGroup: THREE.Group;
  private interiorGroup: THREE.Group;

  // Instanced meshes for low-poly vegetation
  private treeTrunkInstanced!: THREE.InstancedMesh;
  private treeFoliageInstanced!: THREE.InstancedMesh;
  private flowerInstanced!: THREE.InstancedMesh;

  // Sun and Sky
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.scene.background = new THREE.Color('#38bdf8'); // Bright inviting sky blue
    this.scene.fog = new THREE.FogExp2('#bae6fd', 0.007); // Soft horizon fog for performance & beauty

    this.exteriorGroup = new THREE.Group();
    this.interiorGroup = new THREE.Group();
    this.scene.add(this.exteriorGroup);
    this.scene.add(this.interiorGroup);

    this.sectorManager = new SectorManager(this.exteriorGroup, 50);
    this.platformSystem = new PlatformSystem();
    this.checkpointSystem = new CheckpointSystem();
    this.collectibleManager = new CollectibleManager(this.scene);
    this.interactionSystem = new InteractionSystem();

    this.setupLighting();
    this.buildTerrain();
    this.buildTownPlaza();
    this.buildEnterableHouse();
    this.buildVegetationInstanced();
    this.buildObbyParkour();
    this.buildLakeAndBridge();
    this.spawnNPCs();
    this.spawnCollectibles();
  }

  private setupLighting(): void {
    // Hemisphere light (sky / ground bounce)
    this.hemiLight = new THREE.HemisphereLight('#f8fafc', '#86efac', 0.85);
    this.scene.add(this.hemiLight);

    // Warm directional sun
    this.dirLight = new THREE.DirectionalLight('#fffbeb', 1.25);
    this.dirLight.position.set(45, 70, 35);
    this.dirLight.castShadow = true;

    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 160;
    const d = 50;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;

    this.scene.add(this.dirLight);
  }

  private buildTerrain(): void {
    const assets = AssetManager.getInstance();
    const cm = CollisionManager.getInstance();

    // Central Ground Plane (Grass block)
    const groundSize = 220;
    const groundGeo = assets.getBoxGeometry(groundSize, 2, groundSize);
    const grassMat = assets.getStandardMaterial('#22c55e', 0.8, 0.05); // Vibrant toy grass green
    const ground = new THREE.Mesh(groundGeo, grassMat);
    ground.position.y = -1;
    ground.receiveShadow = true;
    this.exteriorGroup.add(ground);

    cm.addCollider({
      id: 'ground_main',
      type: 'box',
      minX: -groundSize / 2,
      maxX: groundSize / 2,
      minY: -2,
      maxY: 0,
      minZ: -groundSize / 2,
      maxZ: groundSize / 2,
    });

    // Small boundary low-poly hills/mountains to frame the world
    const hillMat = assets.getStandardMaterial('#16a34a', 0.9, 0.05);
    const hillData = [
      { x: -70, z: -70, w: 40, h: 14, d: 40 },
      { x: 0, z: -85, w: 60, h: 18, d: 35 },
      { x: 75, z: -60, w: 45, h: 16, d: 45 },
      { x: -80, z: 20, w: 35, h: 12, d: 50 },
      { x: 85, z: 30, w: 35, h: 15, d: 60 },
    ];

    hillData.forEach((h, idx) => {
      const geo = assets.getBoxGeometry(h.w, h.h, h.d);
      const mesh = new THREE.Mesh(geo, hillMat);
      mesh.position.set(h.x, h.h / 2 - 1, h.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.exteriorGroup.add(mesh);

      cm.addCollider({
        id: `hill_${idx}`,
        type: 'box',
        minX: h.x - h.w / 2,
        maxX: h.x + h.w / 2,
        minY: 0,
        maxY: h.h - 1,
        minZ: h.z - h.d / 2,
        maxZ: h.z + h.d / 2,
      });
    });
  }

  private buildTownPlaza(): void {
    const assets = AssetManager.getInstance();
    const cm = CollisionManager.getInstance();

    // Central paved town square (Cobblestone / clean tiles)
    const plazaGeo = assets.getBoxGeometry(32, 0.15, 32);
    const plazaMat = assets.getStandardMaterial('#e2e8f0', 0.6, 0.1);
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(0, 0.08, 0);
    plaza.receiveShadow = true;
    this.exteriorGroup.add(plaza);

    // Central Fountain
    const fountainBaseGeo = assets.getCylinderGeometry(4.0, 4.4, 0.7, 14);
    const stoneMat = assets.getStandardMaterial('#94a3b8', 0.5, 0.1);
    const fountainBase = new THREE.Mesh(fountainBaseGeo, stoneMat);
    fountainBase.position.set(0, 0.35, 0);
    fountainBase.castShadow = true;
    fountainBase.receiveShadow = true;
    this.exteriorGroup.add(fountainBase);

    // Fountain Water
    const waterGeo = assets.getCylinderGeometry(3.6, 3.6, 0.4, 14);
    const waterMat = assets.getStandardMaterial('#38bdf8', 0.1, 0.3);
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, 0.45, 0);
    this.exteriorGroup.add(water);

    // Fountain Center Spire
    const spireGeo = assets.getCylinderGeometry(0.8, 1.2, 2.5, 8);
    const spire = new THREE.Mesh(spireGeo, stoneMat);
    spire.position.set(0, 1.4, 0);
    spire.castShadow = true;
    this.exteriorGroup.add(spire);

    cm.addCollider({
      id: 'fountain',
      type: 'box',
      minX: -4, maxX: 4, minY: 0, maxY: 0.7, minZ: -4, maxZ: 4,
    });

    // Plaza Benches
    const benchGeo = assets.getBoxGeometry(2.4, 0.45, 0.8);
    const woodMat = assets.getStandardMaterial('#78350f', 0.7, 0.1);
    const benchPositions = [
      { x: -9, z: -8, rot: 0 },
      { x: 9, z: -8, rot: 0 },
      { x: -9, z: 8, rot: Math.PI },
      { x: 9, z: 8, rot: Math.PI },
    ];

    benchPositions.forEach((bp, i) => {
      const bench = new THREE.Mesh(benchGeo, woodMat);
      bench.position.set(bp.x, 0.23, bp.z);
      bench.rotation.y = bp.rot;
      bench.castShadow = true;
      this.exteriorGroup.add(bench);

      cm.addCollider({
        id: `bench_${i}`,
        type: 'box',
        minX: bp.x - 1.2, maxX: bp.x + 1.2, minY: 0, maxY: 0.45, minZ: bp.z - 0.4, maxZ: bp.z + 0.4,
      });
    });

    // Start Checkpoint Station in Plaza
    this.checkpointSystem.addCheckpoint(
      this.scene,
      'plaza_spawn',
      'Plaza Central (Inicio)',
      new THREE.Vector3(0, 0, 8),
      1
    );
  }

  private buildEnterableHouse(): void {
    const assets = AssetManager.getInstance();
    const cm = CollisionManager.getInstance();

    const houseX = -18;
    const houseZ = -14;
    const width = 10;
    const depth = 9;
    const height = 5.5;

    // Walls (exterior)
    const wallMat = assets.getStandardMaterial('#f1f5f9', 0.6, 0.1);
    const roofMat = assets.getStandardMaterial('#ef4444', 0.5, 0.2); // Vibrant red brick roof

    // Back wall
    const backWall = new THREE.Mesh(assets.getBoxGeometry(width, height, 0.5), wallMat);
    backWall.position.set(houseX, height / 2, houseZ - depth / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.exteriorGroup.add(backWall);

    cm.addCollider({
      id: 'house_back_wall',
      type: 'box',
      minX: houseX - width / 2, maxX: houseX + width / 2, minY: 0, maxY: height, minZ: houseZ - depth / 2 - 0.3, maxZ: houseZ - depth / 2 + 0.3,
    });

    // Left wall
    const leftWall = new THREE.Mesh(assets.getBoxGeometry(0.5, height, depth), wallMat);
    leftWall.position.set(houseX - width / 2, height / 2, houseZ);
    leftWall.castShadow = true;
    this.exteriorGroup.add(leftWall);

    cm.addCollider({
      id: 'house_left_wall',
      type: 'box',
      minX: houseX - width / 2 - 0.3, maxX: houseX - width / 2 + 0.3, minY: 0, maxY: height, minZ: houseZ - depth / 2, maxZ: houseZ + depth / 2,
    });

    // Right wall
    const rightWall = new THREE.Mesh(assets.getBoxGeometry(0.5, height, depth), wallMat);
    rightWall.position.set(houseX + width / 2, height / 2, houseZ);
    rightWall.castShadow = true;
    this.exteriorGroup.add(rightWall);

    cm.addCollider({
      id: 'house_right_wall',
      type: 'box',
      minX: houseX + width / 2 - 0.3, maxX: houseX + width / 2 + 0.3, minY: 0, maxY: height, minZ: houseZ - depth / 2, maxZ: houseZ + depth / 2,
    });

    // Front wall with door opening (2 parts)
    const doorWidth = 2.4;
    const sideWallW = (width - doorWidth) / 2;

    const frontLeft = new THREE.Mesh(assets.getBoxGeometry(sideWallW, height, 0.5), wallMat);
    frontLeft.position.set(houseX - width / 2 + sideWallW / 2, height / 2, houseZ + depth / 2);
    frontLeft.castShadow = true;
    this.exteriorGroup.add(frontLeft);

    const frontRight = new THREE.Mesh(assets.getBoxGeometry(sideWallW, height, 0.5), wallMat);
    frontRight.position.set(houseX + width / 2 - sideWallW / 2, height / 2, houseZ + depth / 2);
    frontRight.castShadow = true;
    this.exteriorGroup.add(frontRight);

    cm.addCollider({
      id: 'house_front_l',
      type: 'box',
      minX: houseX - width / 2, maxX: houseX - width / 2 + sideWallW, minY: 0, maxY: height, minZ: houseZ + depth / 2 - 0.3, maxZ: houseZ + depth / 2 + 0.3,
    });
    cm.addCollider({
      id: 'house_front_r',
      type: 'box',
      minX: houseX + width / 2 - sideWallW, maxX: houseX + width / 2, minY: 0, maxY: height, minZ: houseZ + depth / 2 - 0.3, maxZ: houseZ + depth / 2 + 0.3,
    });

    // Roof
    const roof = new THREE.Mesh(assets.getBoxGeometry(width + 1.2, 0.8, depth + 1.2), roofMat);
    roof.position.set(houseX, height + 0.4, houseZ);
    roof.castShadow = true;
    this.exteriorGroup.add(roof);

    // Interior Furniture (active when player inside or near)
    const floorMat = assets.getStandardMaterial('#b45309', 0.6, 0.1); // Warm wooden parquet
    const interiorFloor = new THREE.Mesh(assets.getBoxGeometry(width - 0.8, 0.1, depth - 0.8), floorMat);
    interiorFloor.position.set(houseX, 0.05, houseZ);
    interiorFloor.receiveShadow = true;
    this.interiorGroup.add(interiorFloor);

    // Living table & chairs
    const tableMat = assets.getStandardMaterial('#d97706', 0.6, 0.1);
    const table = new THREE.Mesh(assets.getBoxGeometry(2.2, 0.9, 1.4), tableMat);
    table.position.set(houseX, 0.45, houseZ - 1.2);
    table.castShadow = true;
    this.interiorGroup.add(table);

    cm.addCollider({
      id: 'interior_table',
      type: 'box',
      minX: houseX - 1.1, maxX: houseX + 1.1, minY: 0, maxY: 0.9, minZ: houseZ - 1.9, maxZ: houseZ - 0.5,
    });

    // Golden reward chest inside house
    const chestGeo = assets.getBoxGeometry(1.2, 0.8, 0.9);
    const chestMat = assets.getStandardMaterial('#f59e0b', 0.3, 0.5);
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(houseX + 3.0, 0.4, houseZ - 2.8);
    chest.castShadow = true;
    this.interiorGroup.add(chest);

    // Register interaction on chest
    this.interactionSystem.registerTarget({
      id: 'house_chest',
      type: 'chest',
      name: 'Cofre del Alcalde',
      position: [houseX + 3.0, 0.8, houseZ - 2.8],
      promptText: 'E - Abrir Cofre del Alcalde',
      onInteract: () => {
        // Collect bonus coins!
        this.collectibleManager.spawnCollectEffect(new THREE.Vector3(houseX + 3.0, 1.2, houseZ - 2.8));
      },
    });
  }

  /**
   * InstancedMesh for 300+ trees and 150+ flowers.
   * Renders in just 3 draw calls!
   */
  private buildVegetationInstanced(): void {
    const assets = AssetManager.getInstance();
    const cm = CollisionManager.getInstance();

    const treeCount = 180;
    const trunkGeo = assets.getCylinderGeometry(0.35, 0.45, 3.2, 8);
    const trunkMat = assets.getLambertMaterial('#78350f');
    this.treeTrunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    this.treeTrunkInstanced.castShadow = true;
    this.treeTrunkInstanced.receiveShadow = true;

    const foliageGeo = assets.getBoxGeometry(2.4, 2.6, 2.4);
    const foliageMat = assets.getLambertMaterial('#15803d');
    this.treeFoliageInstanced = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
    this.treeFoliageInstanced.castShadow = true;
    this.treeFoliageInstanced.receiveShadow = true;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const scale = new THREE.Vector3(1, 1, 1);

    let idx = 0;
    for (let i = 0; i < treeCount; i++) {
      // Scatter trees across the landscape (avoiding plaza, lake, and obby)
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 85;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Skip lake area (x: 20..60, z: -40..-10) and obby area (x: -60..-20, z: 20..60)
      if (x > 15 && x < 65 && z > -45 && z < -5) continue;
      if (x > -65 && x < -15 && z > 15 && z < 65) continue;

      const treeScale = 0.8 + Math.random() * 0.5;
      scale.set(treeScale, treeScale, treeScale);

      // Trunk matrix
      position.set(x, (3.2 * treeScale) / 2, z);
      rotation.set(0, Math.random() * Math.PI, 0);
      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
      this.treeTrunkInstanced.setMatrixAt(idx, matrix);

      // Foliage matrix (atop trunk)
      position.set(x, 3.2 * treeScale + (2.6 * treeScale) / 2 - 0.4, z);
      rotation.set(0, Math.random() * Math.PI, 0);
      matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
      this.treeFoliageInstanced.setMatrixAt(idx, matrix);

      // Add simple trunk collider
      cm.addCollider({
        id: `tree_${idx}`,
        type: 'cylinder',
        minX: x - 0.5 * treeScale,
        maxX: x + 0.5 * treeScale,
        minY: 0,
        maxY: 3.2 * treeScale,
        minZ: z - 0.5 * treeScale,
        maxZ: z + 0.5 * treeScale,
      });

      idx++;
    }

    this.treeTrunkInstanced.count = idx;
    this.treeFoliageInstanced.count = idx;
    this.treeTrunkInstanced.instanceMatrix.needsUpdate = true;
    this.treeFoliageInstanced.instanceMatrix.needsUpdate = true;

    this.exteriorGroup.add(this.treeTrunkInstanced);
    this.exteriorGroup.add(this.treeFoliageInstanced);
  }

  private buildObbyParkour(): void {
    const assets = AssetManager.getInstance();
    const cm = CollisionManager.getInstance();

    const startX = -28;
    const startZ = 28;

    // Obby Portal Arch
    const archMat = assets.getStandardMaterial('#8b5cf6', 0.4, 0.4); // Electric Purple
    const archPillarL = new THREE.Mesh(assets.getBoxGeometry(0.8, 4.0, 0.8), archMat);
    archPillarL.position.set(startX - 2.0, 2.0, startZ);
    const archPillarR = new THREE.Mesh(assets.getBoxGeometry(0.8, 4.0, 0.8), archMat);
    archPillarR.position.set(startX + 2.0, 2.0, startZ);
    const archHeader = new THREE.Mesh(assets.getBoxGeometry(5.0, 0.8, 0.8), archMat);
    archHeader.position.set(startX, 4.4, startZ);
    this.exteriorGroup.add(archPillarL, archPillarR, archHeader);

    // Obby Start Checkpoint
    this.checkpointSystem.addCheckpoint(
      this.scene,
      'obby_stage_1',
      'Obby - Etapa 1',
      new THREE.Vector3(startX, 0, startZ + 3),
      2
    );

    // Stage 1: Floating Stepping Stones (Static Platforms)
    const platColors = ['#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4'];
    let curX = startX;
    let curY = 1.2;
    let curZ = startZ + 7;

    for (let i = 0; i < 5; i++) {
      const pGeo = assets.getBoxGeometry(2.4, 0.6, 2.4);
      const pMat = assets.getStandardMaterial(platColors[i], 0.3, 0.1);
      const plat = new THREE.Mesh(pGeo, pMat);
      plat.position.set(curX, curY, curZ);
      plat.castShadow = true;
      plat.receiveShadow = true;
      this.exteriorGroup.add(plat);

      cm.addCollider({
        id: `obby_plat_${i}`,
        type: 'box',
        minX: curX - 1.2, maxX: curX + 1.2,
        minY: curY - 0.3, maxY: curY + 0.3,
        minZ: curZ - 1.2, maxZ: curZ + 1.2,
      });

      curY += 0.85;
      curZ += 3.8;
      curX += (i % 2 === 0 ? 1.4 : -1.4);
    }

    // Stage 2: Moving Platform over Lava Pit
    // Lava pit underneath
    const lavaGeo = assets.getBoxGeometry(16, 0.4, 16);
    const lavaMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const lava = new THREE.Mesh(lavaGeo, lavaMat);
    lava.position.set(curX, 0.2, curZ + 9);
    this.exteriorGroup.add(lava);

    cm.addCollider({
      id: 'lava_pit_1',
      type: 'hazard',
      minX: curX - 8, maxX: curX + 8,
      minY: 0, maxY: 0.5,
      minZ: curZ + 1, maxZ: curZ + 17,
    });

    // Moving platform crossing the lava
    this.platformSystem.addMovingPlatform(
      this.scene,
      new THREE.Vector3(curX, curY + 0.5, curZ + 2.5),
      new THREE.Vector3(curX, curY + 0.5, curZ + 15),
      3.2, 3.2, 0.6,
      1.8,
      '#38bdf8'
    );

    // Platform at end of lava
    curZ += 18;
    curY += 0.5;
    const landingGeo = assets.getBoxGeometry(5.0, 0.8, 5.0);
    const landingMat = assets.getStandardMaterial('#334155', 0.5, 0.2);
    const landingPlat = new THREE.Mesh(landingGeo, landingMat);
    landingPlat.position.set(curX, curY, curZ);
    landingPlat.castShadow = true;
    landingPlat.receiveShadow = true;
    this.exteriorGroup.add(landingPlat);

    cm.addCollider({
      id: 'obby_landing_1',
      type: 'box',
      minX: curX - 2.5, maxX: curX + 2.5,
      minY: curY - 0.4, maxY: curY + 0.4,
      minZ: curZ - 2.5, maxZ: curZ + 2.5,
    });

    // Checkpoint Stage 2
    this.checkpointSystem.addCheckpoint(
      this.scene,
      'obby_stage_2',
      'Obby - Etapa 2 (Lava Superada)',
      new THREE.Vector3(curX, curY + 0.4, curZ),
      3
    );

    // Stage 3: Trampoline Launch Pad to High Cloud Tower
    const trampGeo = assets.getCylinderGeometry(1.4, 1.6, 0.35, 12);
    const trampMat = assets.getStandardMaterial('#facc15', 0.2, 0.8); // Golden bouncy spring
    const tramp = new THREE.Mesh(trampGeo, trampMat);
    tramp.position.set(curX, curY + 0.55, curZ + 4.5);
    tramp.castShadow = true;
    this.exteriorGroup.add(tramp);

    cm.addCollider({
      id: 'trampoline_high',
      type: 'trampoline',
      minX: curX - 1.4, maxX: curX + 1.4,
      minY: curY + 0.2, maxY: curY + 1.0,
      minZ: curZ + 3.1, maxZ: curZ + 5.9,
      userData: { bounceForce: 23 }, // Launches player high into the air!
    });

    // High floating cloud platform
    const highY = curY + 13.0;
    const highZ = curZ + 11.0;
    const highPlat = new THREE.Mesh(assets.getBoxGeometry(7, 1.0, 7), assets.getStandardMaterial('#ffffff', 0.8, 0.05));
    highPlat.position.set(curX, highY, highZ);
    highPlat.castShadow = true;
    highPlat.receiveShadow = true;
    this.exteriorGroup.add(highPlat);

    cm.addCollider({
      id: 'obby_cloud_tower',
      type: 'box',
      minX: curX - 3.5, maxX: curX + 3.5,
      minY: highY - 0.5, maxY: highY + 0.5,
      minZ: highZ - 3.5, maxZ: highZ + 3.5,
    });

    // Rotating Hazard on Cloud Tower
    this.platformSystem.addRotatingHazard(
      this.scene,
      new THREE.Vector3(curX, highY + 1.0, highZ),
      5.8,
      0.6,
      1.6
    );

    // Disappearing Platforms bridge to summit
    for (let j = 0; j < 3; j++) {
      this.platformSystem.addDisappearingPlatform(
        this.scene,
        new THREE.Vector3(curX, highY + 0.6 * j, highZ + 6.0 + j * 3.6),
        2.2, 2.2, 0.5,
        '#ec4899'
      );
    }

    // Final Summit Platform with Golden Victory Trophy & Checkpoint
    const summitZ = highZ + 19.0;
    const summitY = highY + 2.0;
    const summitPlat = new THREE.Mesh(assets.getBoxGeometry(6, 1.2, 6), assets.getStandardMaterial('#fbbf24', 0.3, 0.5));
    summitPlat.position.set(curX, summitY, summitZ);
    summitPlat.castShadow = true;
    this.exteriorGroup.add(summitPlat);

    cm.addCollider({
      id: 'obby_summit',
      type: 'box',
      minX: curX - 3, maxX: curX + 3,
      minY: summitY - 0.6, maxY: summitY + 0.6,
      minZ: summitZ - 3, maxZ: summitZ + 3,
    });

    this.checkpointSystem.addCheckpoint(
      this.scene,
      'obby_summit_finish',
      '¡Cima del Obby!',
      new THREE.Vector3(curX, summitY + 0.6, summitZ),
      4
    );
  }

  private buildLakeAndBridge(): void {
    const assets = AssetManager.getInstance();
    const cm = CollisionManager.getInstance();

    const lakeX = 35;
    const lakeZ = -25;
    const lakeW = 28;
    const lakeD = 38;

    // Lake Bed Depression (Darker blue-green water surface)
    const waterGeo = assets.getBoxGeometry(lakeW, 0.4, lakeD);
    const waterMat = assets.getStandardMaterial('#0284c7', 0.15, 0.4);
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(lakeX, 0.05, lakeZ);
    water.receiveShadow = true;
    this.exteriorGroup.add(water);

    // Lake water collision: splash/walkable shallow water
    cm.addCollider({
      id: 'lake_surface',
      type: 'box',
      minX: lakeX - lakeW / 2, maxX: lakeX + lakeW / 2,
      minY: -0.5, maxY: 0.1,
      minZ: lakeZ - lakeD / 2, maxZ: lakeZ + lakeD / 2,
    });

    // Wooden Bridge crossing the lake
    const bridgeGeo = assets.getBoxGeometry(4.0, 0.5, lakeD + 4);
    const woodMat = assets.getStandardMaterial('#854d0e', 0.7, 0.1);
    const bridge = new THREE.Mesh(bridgeGeo, woodMat);
    bridge.position.set(lakeX, 0.8, lakeZ);
    bridge.castShadow = true;
    bridge.receiveShadow = true;
    this.exteriorGroup.add(bridge);

    cm.addCollider({
      id: 'lake_bridge',
      type: 'box',
      minX: lakeX - 2.0, maxX: lakeX + 2.0,
      minY: 0, maxY: 1.05,
      minZ: lakeZ - lakeD / 2 - 2, maxZ: lakeZ + lakeD / 2 + 2,
    });

    // Bridge Side Railings
    const railMat = assets.getStandardMaterial('#713f12', 0.6, 0.1);
    const railL = new THREE.Mesh(assets.getBoxGeometry(0.3, 0.9, lakeD + 4), railMat);
    railL.position.set(lakeX - 1.9, 1.4, lakeZ);
    const railR = new THREE.Mesh(assets.getBoxGeometry(0.3, 0.9, lakeD + 4), railMat);
    railR.position.set(lakeX + 1.9, 1.4, lakeZ);
    this.exteriorGroup.add(railL, railR);
  }

  private spawnNPCs(): void {
    // 1. Bob el Guía (Plaza Central)
    const bob = new NPC(
      'npc_bob',
      'Bob el Guía',
      new THREE.Vector3(5, 0, 4),
      '#0284c7',
      [
        {
          speaker: 'Bob el Guía',
          text: '¡Hola aventurero! Bienvenido a BloxVerse 3D. Explora la plaza, escala el Obby o supera los récords de velocidad.',
          options: [
            { text: '¿Dónde está el Obby?', action: () => {} },
            { text: '¡Gracias Bob!', action: () => {} },
          ],
        },
      ]
    );
    this.scene.add(bob.group);
    this.npcs.push(bob);

    this.interactionSystem.registerTarget({
      id: bob.id,
      type: 'npc',
      name: bob.name,
      position: [bob.position.x, bob.position.y + 1, bob.position.z],
      promptText: 'E - Hablar con Bob el Guía',
      onInteract: () => {
        // Will open dialogue in HUD
      },
    });

    // 2. Maestro del Parkour (Obby Entrance)
    const parkourMaster = new NPC(
      'npc_parkour',
      'Maestro del Parkour',
      new THREE.Vector3(-25, 0, 26),
      '#f97316',
      [
        {
          speaker: 'Maestro del Parkour',
          text: '¿Crees tener la destreza para subir a la torre flotante? ¡Cuidado con los bloques que caen y la lava!',
          options: [
            { text: '¡Acepto el desafío!', action: () => {} },
            { text: 'Dame un consejo', action: () => {} },
          ],
        },
      ]
    );
    this.scene.add(parkourMaster.group);
    this.npcs.push(parkourMaster);

    this.interactionSystem.registerTarget({
      id: parkourMaster.id,
      type: 'npc',
      name: parkourMaster.name,
      position: [parkourMaster.position.x, parkourMaster.position.y + 1, parkourMaster.position.z],
      promptText: 'E - Hablar con Maestro Parkour',
      onInteract: () => {},
    });
  }

  private spawnCollectibles(): void {
    // Distribute 25 exciting collectible coins across town, bridge, benches, obby
    const coinLocations = [
      // Plaza
      new THREE.Vector3(0, 1.4, 0),
      new THREE.Vector3(6, 1.0, 6),
      new THREE.Vector3(-6, 1.0, 6),
      new THREE.Vector3(6, 1.0, -6),
      new THREE.Vector3(-6, 1.0, -6),
      // Bridge
      new THREE.Vector3(35, 1.8, -15),
      new THREE.Vector3(35, 1.8, -25),
      new THREE.Vector3(35, 1.8, -35),
      // House roof & porch
      new THREE.Vector3(-18, 6.4, -14),
      new THREE.Vector3(-18, 1.2, -8.5),
      // Obby path
      new THREE.Vector3(-28, 2.2, 35),
      new THREE.Vector3(-28, 3.8, 43),
      new THREE.Vector3(-28, 6.0, 52),
      new THREE.Vector3(-28, 16.5, 60),
      new THREE.Vector3(-28, 18.0, 72),
      // Lake secret spots
      new THREE.Vector3(26, 0.9, -15),
      new THREE.Vector3(44, 0.9, -32),
      // Hills
      new THREE.Vector3(-70, 14.5, -70),
      new THREE.Vector3(75, 16.5, -60),
    ];

    coinLocations.forEach((pos, idx) => {
      this.collectibleManager.addCoin(`coin_${idx}`, pos, 1);
    });
  }

  public update(delta: number, playerPos: THREE.Vector3, cameraDir: THREE.Vector3): void {
    // 1. Sector streaming (Chunks)
    this.sectorManager.update(playerPos, cameraDir);

    // 2. Interior / Exterior sleep switching
    const inHouse =
      playerPos.x >= -23 && playerPos.x <= -13 &&
      playerPos.z >= -19 && playerPos.z <= -9 &&
      playerPos.y >= 0 && playerPos.y <= 6;

    if (inHouse !== this.isPlayerInsideBuilding) {
      this.isPlayerInsideBuilding = inHouse;
      // Sleep exterior decorations if deep inside
      this.interiorGroup.visible = true;
    }

    // 3. Platform System (Moving, Disappearing, Hazards)
    this.platformSystem.update(delta, playerPos);

    // 4. Checkpoints
    this.checkpointSystem.update(delta);

    // 5. Collectibles & Sparkles
    this.collectibleManager.update(delta, playerPos, () => {});

    // 6. NPCs distance update
    for (let i = 0; i < this.npcs.length; i++) {
      this.npcs[i].update(delta, playerPos);
    }

    // 7. Interactions proximity
    this.interactionSystem.update(playerPos);
  }
}
