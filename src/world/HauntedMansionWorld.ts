/**
 * Mansión del Terror 3D - HauntedMansionWorld
 * Constructs the immense haunted mansion with gothic architecture, long eerie corridors,
 * multi-room wings (Foyer, Library, Dining Hall, Master Bedroom, Cellar, Kitchen),
 * interactive doors, atmospheric flickering candelabras, furniture, and hidden keys.
 */

import * as THREE from 'three';
import { CollisionManager } from './CollisionManager';
import { MansionDoorSystem } from '../systems/MansionDoorSystem';
import { InteractionSystem } from '../systems/InteractionSystem';

export class HauntedMansionWorld {
  public scene: THREE.Scene;
  public doorSystem: MansionDoorSystem;
  public interactionSystem: InteractionSystem;
  public mansionGroup: THREE.Group;

  // Candle & sconce flickering lights
  private flickerLights: {
    light: THREE.PointLight;
    baseIntensity: number;
    speed: number;
    offset: number;
  }[] = [];

  // Animated clock pendulum
  private clockPendulum: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mansionGroup = new THREE.Group();
    this.scene.add(this.mansionGroup);

    this.doorSystem = new MansionDoorSystem(this.scene);
    this.interactionSystem = new InteractionSystem();

    // Set pitch black gothic night atmosphere
    this.scene.background = new THREE.Color('#050608');
    this.scene.fog = new THREE.FogExp2('#07080d', 0.032); // Thick claustrophobic darkness

    this.setupAtmosphericLighting();
    this.buildMansionFloorAndCeiling();
    this.buildGrandFoyer();
    this.buildCorridorsAndWings();
    this.buildLibrary();
    this.buildDiningHall();
    this.buildMasterBedroom();
    this.buildCellar();
    this.buildKitchen();
    this.setupDoorsAndKeys();
  }

  private setupAtmosphericLighting(): void {
    // 1. Very faint ambient moonlight bouncing through dusty windows
    const ambientLight = new THREE.AmbientLight('#0f172a', 0.25);
    this.scene.add(ambientLight);

    // 2. Faint directional pale moonlight through high skylights
    const moonLight = new THREE.DirectionalLight('#1e293b', 0.4);
    moonLight.position.set(20, 45, 15);
    this.scene.add(moonLight);
  }

  private addFlickerLight(
    x: number,
    y: number,
    z: number,
    colorHex: string = '#f59e0b',
    intensity: number = 1.6,
    distance: number = 9
  ): THREE.PointLight {
    const light = new THREE.PointLight(new THREE.Color(colorHex), intensity, distance, 1.6);
    light.position.set(x, y, z);
    this.scene.add(light);

    // Small glowing candle flame mesh
    const flameGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const flameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, y, z);
    this.mansionGroup.add(flame);

    this.flickerLights.push({
      light,
      baseIntensity: intensity,
      speed: 8 + Math.random() * 8,
      offset: Math.random() * Math.PI * 2,
    });

    return light;
  }

  private buildWall(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    colorHex: number = 0x1e222d,
    isWood: boolean = false
  ): THREE.Mesh {
    const cm = CollisionManager.getInstance();
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: isWood ? 0.75 : 0.9,
      metalness: 0.05,
    });

    const wall = new THREE.Mesh(geo, mat);
    wall.position.set(x + w / 2, y + h / 2, z + d / 2);
    wall.receiveShadow = true;
    wall.castShadow = true;
    this.mansionGroup.add(wall);

    // Add collision box
    cm.addCollider({
      id: `wall_${x}_${z}_${w}_${d}`,
      type: 'box',
      minX: x,
      maxX: x + w,
      minY: y,
      maxY: y + h,
      minZ: z,
      maxZ: z + d,
    });

    return wall;
  }

  private buildMansionFloorAndCeiling(): void {
    const cm = CollisionManager.getInstance();

    // Mansion Floor (Old squeaky parquet wood - 75m x 75m)
    const floorSize = 76;
    const floorGeo = new THREE.BoxGeometry(floorSize, 1.0, floorSize);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x221610, // Dark worn mahogany wood
      roughness: 0.85,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.5, -28);
    floor.receiveShadow = true;
    this.mansionGroup.add(floor);

    // Register ground
    cm.addCollider({
      id: 'mansion_floor',
      type: 'box',
      minX: -floorSize / 2,
      maxX: floorSize / 2,
      minY: -1.0,
      maxY: 0,
      minZ: -28 - floorSize / 2,
      maxZ: -28 + floorSize / 2,
    });

    // Mansion Ceiling (Dark vaulted timber beams)
    const ceilGeo = new THREE.BoxGeometry(floorSize, 0.6, floorSize);
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x14161d,
      roughness: 0.95,
    });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.position.set(0, 4.4, -28);
    this.mansionGroup.add(ceiling);

    // Outer Perimeter Walls
    const wallH = 4.4;
    const half = floorSize / 2;
    const centerZ = -28;

    // South perimeter wall (Front of mansion)
    this.buildWall(-half, 0, centerZ + half - 0.5, half - 2, wallH, 0.8, 0x171922);
    this.buildWall(2, 0, centerZ + half - 0.5, half - 2, wallH, 0.8, 0x171922);
    // North perimeter wall (Back)
    this.buildWall(-half, 0, centerZ - half, floorSize, wallH, 0.8, 0x171922);
    // West perimeter wall
    this.buildWall(-half, 0, centerZ - half, 0.8, wallH, floorSize, 0x171922);
    // East perimeter wall
    this.buildWall(half - 0.8, 0, centerZ - half, 0.8, wallH, floorSize, 0x171922);
  }

  private buildGrandFoyer(): void {
    // Grand Central Foyer (Vestíbulo Principal: x from -14 to 14, z from -20 to 10)
    const wallH = 4.4;

    // Front archway columns
    const colMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    for (let x = -10; x <= 10; x += 10) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.8, wallH, 0.8), colMat);
      col.position.set(x, wallH / 2, -2);
      this.mansionGroup.add(col);
    }

    // Grandfather Clock in corner
    const clockGroup = new THREE.Group();
    clockGroup.position.set(-8, 0, 7);
    const clockBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 3.2, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x2b150c, roughness: 0.7 })
    );
    clockBody.position.y = 1.6;
    clockGroup.add(clockBody);

    // Clock face
    const face = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0x422006 })
    );
    face.rotation.x = Math.PI / 2;
    face.position.set(0, 2.6, 0.32);
    clockGroup.add(face);

    // Pendulum
    const pendulum = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.8, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 })
    );
    pendulum.position.set(0, 1.4, 0.28);
    clockGroup.add(pendulum);
    this.clockPendulum = pendulum;

    this.mansionGroup.add(clockGroup);

    // Grand Foyer Candelabra Chandelier
    const chandelierGeo = new THREE.TorusGeometry(1.6, 0.08, 8, 20);
    const chMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
    const chandelier = new THREE.Mesh(chandelierGeo, chMat);
    chandelier.rotation.x = Math.PI / 2;
    chandelier.position.set(0, 3.6, -6);
    this.mansionGroup.add(chandelier);

    // Candles on chandelier
    this.addFlickerLight(0, 3.4, -6, '#f59e0b', 2.0, 15);
    this.addFlickerLight(-1.4, 3.4, -6, '#f97316', 1.4, 10);
    this.addFlickerLight(1.4, 3.4, -6, '#f97316', 1.4, 10);

    // Foyer wall sconces
    this.addFlickerLight(-12, 2.2, -6, '#ea580c', 1.3, 8);
    this.addFlickerLight(12, 2.2, -6, '#ea580c', 1.3, 8);

    // Red Carpet runner down the foyer
    const carpetGeo = new THREE.BoxGeometry(3.6, 0.02, 22);
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0x5c131d, // Velvet blood crimson
      roughness: 0.9,
    });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.position.set(0, 0.01, -3);
    this.mansionGroup.add(carpet);
  }

  private buildCorridorsAndWings(): void {
    const wallH = 4.4;

    // Divider walls creating corridors and rooms:
    // 1. Foyer West wall (separates Foyer from West Hallway & Library)
    this.buildWall(-14, 0, -2, 0.6, wallH, 11, 0x222633);
    this.buildWall(-14, 0, -20, 0.6, wallH, 14, 0x222633);
    // Doorway opening at z = -5 to -2

    // 2. Foyer East wall (separates Foyer from East Hallway & Dining)
    this.buildWall(13.4, 0, -2, 0.6, wallH, 11, 0x222633);
    this.buildWall(13.4, 0, -20, 0.6, wallH, 14, 0x222633);

    // 3. North corridor wall (separates Foyer from Back Wing)
    this.buildWall(-14, 0, -20, 11.6, wallH, 0.6, 0x222633);
    this.buildWall(2.4, 0, -20, 11.6, wallH, 0.6, 0x222633);
    // Archway to back wing at x = -2.4 to 2.4

    // Creepy paintings on corridor walls
    this.addCreepyPortrait(-13.6, 2.2, 2, 0, 'El Patriarca Maldito');
    this.addCreepyPortrait(-13.6, 2.2, -12, 0, 'La Novia Cadavérica');
    this.addCreepyPortrait(13.3, 2.2, 2, Math.PI, 'Ojos en la Oscuridad');
    this.addCreepyPortrait(13.3, 2.2, -12, Math.PI, 'El Huésped sin Rostro');
  }

  private addCreepyPortrait(x: number, y: number, z: number, rotY: number, title: string): void {
    const frameGeo = new THREE.BoxGeometry(1.6, 2.2, 0.08);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x3d271d,
      roughness: 0.6,
      metalness: 0.2,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(x, y, z);
    frame.rotation.y = rotY;
    this.mansionGroup.add(frame);

    // Canvas inside
    const canvasGeo = new THREE.BoxGeometry(1.3, 1.9, 0.09);
    const canvasMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x1e1b4b,
      emissiveIntensity: 0.3,
    });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.set(x, y, z);
    canvas.rotation.y = rotY;
    this.mansionGroup.add(canvas);

    // Tiny glowing pinhole eyes in the portrait that watch the player
    const eyeGeo = new THREE.SphereGeometry(0.02, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(x + (rotY === 0 ? 0.05 : -0.05), y + 0.3, z - 0.1);
    eyeR.position.set(x + (rotY === 0 ? 0.05 : -0.05), y + 0.3, z + 0.1);
    this.mansionGroup.add(eyeL);
    this.mansionGroup.add(eyeR);
  }

  private buildLibrary(): void {
    // Haunted Library (West Room: x from -36 to -14, z from -40 to -16)
    const wallH = 4.4;
    const cm = CollisionManager.getInstance();

    // South wall of library
    this.buildWall(-36, 0, -16, 19, wallH, 0.6, 0x1a1e29);
    // North wall of library
    this.buildWall(-36, 0, -40, 22, wallH, 0.6, 0x1a1e29);

    // Giant floor-to-ceiling bookshelves along the west wall
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x24140e, roughness: 0.8 });
    for (let z = -38; z <= -18; z += 5) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.8, 4.2), shelfMat);
      shelf.position.set(-34.8, 1.9, z + 2.1);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      this.mansionGroup.add(shelf);

      // Bookshelves collision
      cm.addCollider({
        id: `bookshelf_${z}`,
        type: 'box',
        minX: -35.4,
        maxX: -34.2,
        minY: 0,
        maxY: 3.8,
        minZ: z,
        maxZ: z + 4.2,
      });
    }

    // Antique Study Desk in the center of the library (holds the Silver Key)
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.6 });
    const desk = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 1.6), deskMat);
    desk.position.set(-24, 0.6, -28);
    desk.castShadow = true;
    this.mansionGroup.add(desk);

    cm.addCollider({
      id: 'library_desk',
      type: 'box',
      minX: -25.5,
      maxX: -22.5,
      minY: 0,
      maxY: 1.2,
      minZ: -28.8,
      maxZ: -27.2,
    });

    // Flickering candle on the desk
    this.addFlickerLight(-24.8, 1.35, -28, '#38bdf8', 1.8, 8); // Pale spectral light
  }

  private buildDiningHall(): void {
    // Grand Dining Hall (East Room: x from 14 to 36, z from -40 to -16)
    const wallH = 4.4;
    const cm = CollisionManager.getInstance();

    // South wall
    this.buildWall(14, 0, -16, 22, wallH, 0.6, 0x1a1e29);
    // North wall
    this.buildWall(14, 0, -40, 22, wallH, 0.6, 0x1a1e29);

    // Long Antique Banquet Table (holds candelabras)
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x22130c, roughness: 0.7 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 14), tableMat);
    table.position.set(25, 0.55, -28);
    table.castShadow = true;
    this.mansionGroup.add(table);

    cm.addCollider({
      id: 'dining_table',
      type: 'box',
      minX: 23.8,
      maxX: 26.2,
      minY: 0,
      maxY: 1.1,
      minZ: -35,
      maxZ: -21,
    });

    // Overturned and upright antique chairs
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x3f1d1d, roughness: 0.8 });
    for (let z = -34; z <= -22; z += 3) {
      // Left chair
      const chairL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), chairMat);
      chairL.position.set(22.8, 0.8, z);
      this.mansionGroup.add(chairL);

      // Right chair (overturned on floor)
      const chairR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), chairMat);
      chairR.position.set(27.2, 0.4, z);
      chairR.rotation.z = Math.PI / 2.2;
      this.mansionGroup.add(chairR);
    }

    // Candelabra on dining table
    this.addFlickerLight(25, 1.4, -31, '#f59e0b', 1.7, 9);
    this.addFlickerLight(25, 1.4, -25, '#ea580c', 1.7, 9);

    // Stone Fireplace with dying crimson embers
    const fireplaceMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
    const fireplace = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 4.0), fireplaceMat);
    fireplace.position.set(35.2, 1.3, -28);
    this.mansionGroup.add(fireplace);

    this.addFlickerLight(34.8, 0.4, -28, '#dc2626', 1.4, 7); // Red hearth glow
  }

  private buildMasterBedroom(): void {
    // Master Bedroom (North-East Room: x from 4 to 36, z from -62 to -42)
    const wallH = 4.4;
    const cm = CollisionManager.getInstance();

    // Divider between Master Bedroom and Back Hall
    this.buildWall(4, 0, -42, 14, wallH, 0.6, 0x1e222d);
    this.buildWall(21, 0, -42, 15, wallH, 0.6, 0x1e222d);
    // Doorway at x = 18 to 21

    // Large Victorian Canopy Bed
    const bedMat = new THREE.MeshStandardMaterial({ color: 0x4a0404, roughness: 0.85 });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.0, 4.4), bedMat);
    bed.position.set(26, 0.5, -55);
    bed.castShadow = true;
    this.mansionGroup.add(bed);

    cm.addCollider({
      id: 'canopy_bed',
      type: 'box',
      minX: 24.2,
      maxX: 27.8,
      minY: 0,
      maxY: 1.0,
      minZ: -57.2,
      maxZ: -52.8,
    });

    // Tall Armoire / Wardrobe (Hiding spot!)
    const armoireMat = new THREE.MeshStandardMaterial({ color: 0x24140e, roughness: 0.7 });
    const armoire = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.6, 3.0), armoireMat);
    armoire.position.set(10, 1.8, -58);
    this.mansionGroup.add(armoire);

    cm.addCollider({
      id: 'armoire_col',
      type: 'box',
      minX: 9.2,
      maxX: 10.8,
      minY: 0,
      maxY: 3.6,
      minZ: -59.5,
      maxZ: -56.5,
    });

    // Nightstand beside bed with the Golden Key
    const standMat = new THREE.MeshStandardMaterial({ color: 0x3d271d });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), standMat);
    stand.position.set(21.8, 0.55, -55);
    this.mansionGroup.add(stand);

    cm.addCollider({
      id: 'nightstand_col',
      type: 'box',
      minX: 21.2,
      maxX: 22.4,
      minY: 0,
      maxY: 1.1,
      minZ: -55.6,
      maxZ: -54.4,
    });

    this.addFlickerLight(21.8, 1.35, -55, '#fbbf24', 1.9, 9);
  }

  private buildCellar(): void {
    // Sótano / Catacombs (North-West Room: x from -36 to -4, z from -62 to -42)
    const wallH = 4.4;
    const cm = CollisionManager.getInstance();

    // South wall of cellar
    this.buildWall(-36, 0, -42, 15, wallH, 0.6, 0x14161e);
    this.buildWall(-18, 0, -42, 14, wallH, 0.6, 0x14161e);
    // Doorway at x = -21 to -18

    // Stone Brick Pillars in cellar
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.95 });
    for (let x = -30; x <= -10; x += 10) {
      for (let z = -58; z <= -46; z += 8) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.4, wallH, 1.4), stoneMat);
        pillar.position.set(x, wallH / 2, z);
        this.mansionGroup.add(pillar);

        cm.addCollider({
          id: `cellar_pillar_${x}_${z}`,
          type: 'box',
          minX: x - 0.7,
          maxX: x + 0.7,
          minY: 0,
          maxY: wallH,
          minZ: z - 0.7,
          maxZ: z + 0.7,
        });
      }
    }

    // Wine Barrels and wooden crates
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.8 });
    for (let i = 0; i < 5; i++) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.6, 12), barrelMat);
      barrel.position.set(-33 + i * 1.5, 0.8, -60);
      this.mansionGroup.add(barrel);
    }

    // Ancient Stone Altar in the back containing the Rusty Iron Key
    const altarMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
    });
    const altar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.8), altarMat);
    altar.position.set(-20, 0.6, -56);
    this.mansionGroup.add(altar);

    cm.addCollider({
      id: 'stone_altar',
      type: 'box',
      minX: -21.2,
      maxX: -18.8,
      minY: 0,
      maxY: 1.2,
      minZ: -56.9,
      maxZ: -55.1,
    });

    // Eerie green/blue spectral flame over the altar
    this.addFlickerLight(-20, 1.45, -56, '#10b981', 1.8, 10);
  }

  private buildKitchen(): void {
    // Abandoned Kitchen corridor connections
    this.addFlickerLight(0, 2.8, -32, '#f97316', 1.5, 9);
    this.addFlickerLight(0, 2.8, -50, '#f97316', 1.5, 9);
  }

  private setupDoorsAndKeys(): void {
    // 1. Grand Front Exit Door (Puerta Principal de Salida)
    // Needs ALL 3 Keys to escape!
    this.doorSystem.addDoor(
      'main_exit_door',
      'Puerta de Salida Principal (Requiere 3 Llaves)',
      -1.8,
      0,
      9.6,
      0,
      true,
      'key_gold', // Primary lock check (checked together in Game mode)
      3.6,
      4.0
    );

    // 2. Library Door (West Wing entrance)
    this.doorSystem.addDoor('library_door', 'Puerta de la Biblioteca', -14, 0, -5, Math.PI / 2, false);

    // 3. Dining Hall Door (East Wing entrance)
    this.doorSystem.addDoor('dining_door', 'Puerta del Gran Comedor', 13.4, 0, -5, Math.PI / 2, false);

    // 4. Master Bedroom Door
    this.doorSystem.addDoor('bedroom_door', 'Puerta del Dormitorio Principal', 18, 0, -42, 0, false);

    // 5. Cellar Dungeon Door (Rusted heavy door)
    this.doorSystem.addDoor('cellar_door', 'Puerta del Sótano Siniestro', -21, 0, -42, 0, false);

    // --- KEYS TO COLLECT ---
    // 1. Llave Plateada (Silver Key) - In the Library on the study desk
    this.doorSystem.addKey(
      'key_silver',
      'Llave Plateada',
      'Biblioteca Antigua',
      -24,
      1.5,
      -28,
      '#e2e8f0'
    );

    // 2. Llave Dorada (Golden Key) - In the Master Bedroom on the nightstand
    this.doorSystem.addKey(
      'key_gold',
      'Llave Dorada',
      'Dormitorio Principal',
      21.8,
      1.4,
      -55,
      '#fbbf24'
    );

    // 3. Llave Oxidada (Rusty Key) - In the Cellar Catacombs on the stone altar
    this.doorSystem.addKey(
      'key_rusty',
      'Llave de Hierro Oxidada',
      'Catacumbas del Sótano',
      -20,
      1.4,
      -56,
      '#94a3b8'
    );
  }

  public update(delta: number, playerPos: THREE.Vector3): {
    nearDoor: any;
    nearKey: any;
  } {
    const dt = Math.min(delta, 0.05);

    // 1. Animate flickering candelabras and torchlights
    const time = performance.now() * 0.001;
    for (let i = 0; i < this.flickerLights.length; i++) {
      const fl = this.flickerLights[i];
      const noise =
        Math.sin(time * fl.speed + fl.offset) * 0.2 +
        Math.sin(time * fl.speed * 2.3 + fl.offset) * 0.15;
      fl.light.intensity = Math.max(0.4, fl.baseIntensity + noise);
    }

    // 2. Animate grandfather clock pendulum
    if (this.clockPendulum) {
      this.clockPendulum.rotation.z = Math.sin(time * 3.14) * 0.25;
    }

    // 3. Update doors and keys
    return this.doorSystem.update(dt, playerPos);
  }
}
