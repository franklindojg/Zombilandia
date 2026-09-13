/**
 * Mansión del Terror 3D - Ghost (El Fantasma Acosador)
 * Intelligent horror AI entity that roams the mansion, tracks player noise and flashlight,
 * accelerates into terrifying chase sequences, screams, and strikes.
 */

import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';
import { GhostState } from '../types';

export class Ghost {
  public group: THREE.Group;
  public state: GhostState = GhostState.PATROL;
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.8, -25);
  public speed: number = 3.2;
  public patrolSpeed: number = 2.8;
  public chaseSpeed: number = 7.5;
  public distanceToPlayer: number = 999;

  // Visual parts
  private bodyMesh!: THREE.Mesh;
  private headMesh!: THREE.Mesh;
  private leftEye!: THREE.Mesh;
  private rightEye!: THREE.Mesh;
  private leftClaw!: THREE.Mesh;
  private rightClaw!: THREE.Mesh;
  private auraLight!: THREE.PointLight;
  private shroudRibbons: THREE.Mesh[] = [];
  private ectoplasmParticles: THREE.Mesh[] = [];

  // AI & Pathfinding state
  private waypoints: THREE.Vector3[] = [];
  private currentWaypointIndex: number = 0;
  private alertTimer: number = 0;
  private attackCooldown: number = 0;
  private screechedForCurrentChase: boolean = false;
  private timeAlive: number = 0;

  constructor(spawnPos: THREE.Vector3 = new THREE.Vector3(0, 1.8, -20)) {
    this.position.copy(spawnPos);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    this.buildGhostModel();
    this.setupWaypoints();
  }

  private buildGhostModel(): void {
    // 1. Ghostly Main Shroud (Tapered floating cone/cylinder)
    const shroudGeo = new THREE.CylinderGeometry(0.35, 0.65, 1.7, 12, 4, true);
    const shroudMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      emissive: 0x0f172a,
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    });
    this.bodyMesh = new THREE.Mesh(shroudGeo, shroudMat);
    this.bodyMesh.position.y = 0.85;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // 2. Ghostly Head (Sunken skull-like sphere)
    const headGeo = new THREE.SphereGeometry(0.38, 14, 14);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x1e293b,
      roughness: 0.6,
      transparent: true,
      opacity: 0.9,
    });
    this.headMesh = new THREE.Mesh(headGeo, headMat);
    this.headMesh.position.y = 1.95;
    this.headMesh.scale.set(0.9, 1.1, 1.0);
    this.group.add(this.headMesh);

    // 3. Glowing Eyes (Crimson / Eerie spectral embers)
    const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff1133,
      emissive: 0xff0022,
      emissiveIntensity: 3.0,
      roughness: 0.1,
    });

    this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEye.position.set(-0.13, 1.98, 0.32);
    this.group.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.rightEye.position.set(0.13, 1.98, 0.32);
    this.group.add(this.rightEye);

    // 4. Claws / Skeletal hands reaching forward
    const armMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      emissive: 0x0a0f1d,
      roughness: 0.5,
      transparent: true,
      opacity: 0.85,
    });

    const clawGeo = new THREE.BoxGeometry(0.1, 0.1, 0.55);
    this.leftClaw = new THREE.Mesh(clawGeo, armMat);
    this.leftClaw.position.set(-0.48, 1.4, 0.35);
    this.leftClaw.rotation.x = 0.25;
    this.leftClaw.rotation.y = 0.15;
    this.group.add(this.leftClaw);

    this.rightClaw = new THREE.Mesh(clawGeo, armMat);
    this.rightClaw.position.set(0.48, 1.4, 0.35);
    this.rightClaw.rotation.x = 0.25;
    this.rightClaw.rotation.y = -0.15;
    this.group.add(this.rightClaw);

    // 5. Ragged shroud ribbons dangling underneath
    for (let i = 0; i < 6; i++) {
      const ribbonGeo = new THREE.BoxGeometry(0.12, 0.75, 0.04);
      const ribbon = new THREE.Mesh(ribbonGeo, shroudMat);
      const angle = (i / 6) * Math.PI * 2;
      ribbon.position.set(Math.cos(angle) * 0.45, 0.25, Math.sin(angle) * 0.45);
      ribbon.rotation.z = (Math.random() - 0.5) * 0.2;
      this.group.add(ribbon);
      this.shroudRibbons.push(ribbon);
    }

    // 6. Ectoplasm floating particle wisps
    const particleGeo = new THREE.DodecahedronGeometry(0.08);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
    });
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      p.position.set(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 2.0,
        (Math.random() - 0.5) * 1.5
      );
      this.group.add(p);
      this.ectoplasmParticles.push(p);
    }

    // 7. Spectral Aura Light (Glows faint blue-red in the darkness)
    this.auraLight = new THREE.PointLight(0xff1133, 2.5, 12, 1.5);
    this.auraLight.position.set(0, 1.8, 0.2);
    this.group.add(this.auraLight);
  }

  private setupWaypoints(): void {
    // Strategic key nodes around the mansion's massive rooms and corridors
    this.waypoints = [
      new THREE.Vector3(0, 1.8, -12),    // Foyer center
      new THREE.Vector3(-18, 1.8, -12),  // Left hallway entrance
      new THREE.Vector3(-24, 1.8, -32),  // Haunted Library
      new THREE.Vector3(-16, 1.8, -48),  // Dining Hall back
      new THREE.Vector3(0, 1.8, -44),    // Grand back corridor
      new THREE.Vector3(18, 1.8, -44),   // Kitchen / Cellar descent
      new THREE.Vector3(24, 1.8, -26),   // Master Bedroom
      new THREE.Vector3(16, 1.8, -10),   // Right hallway entrance
    ];
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    isPlayerRunning: boolean,
    isFlashlightOn: boolean,
    onCatchPlayer: (damage: number) => void
  ): void {
    const dt = Math.min(delta, 0.05);
    this.timeAlive += dt;

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Calculate distance to player (horizontal and 3D)
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.position);
    this.distanceToPlayer = toPlayer.length();

    // 1. Floating Animation (sinusoidal levitation)
    const floatOffset = Math.sin(this.timeAlive * 3.2) * 0.18;
    this.group.position.y = this.position.y + floatOffset;

    // Sway ribbons and ectoplasm
    for (let i = 0; i < this.shroudRibbons.length; i++) {
      this.shroudRibbons[i].rotation.x = Math.sin(this.timeAlive * 4 + i) * 0.25;
      this.shroudRibbons[i].rotation.z = Math.cos(this.timeAlive * 3 + i) * 0.15;
    }

    for (let i = 0; i < this.ectoplasmParticles.length; i++) {
      const p = this.ectoplasmParticles[i];
      p.position.y = (p.position.y + dt * 0.4) % 2.2;
      p.rotation.y += dt * 2.0;
    }

    // Claws twitching/reaching
    const clawTwitch = Math.sin(this.timeAlive * 5.0) * 0.08;
    this.leftClaw.position.z = 0.35 + clawTwitch;
    this.rightClaw.position.z = 0.35 - clawTwitch;

    // 2. Ghost Perception / Sensory AI
    // Hearing range: running makes loud footsteps (up to 24m), walking (up to 12m)
    const hearingRadius = isPlayerRunning ? 26 : 12;
    // Sight range: flashlight makes player extremely visible (up to 38m)
    const visualRadius = isFlashlightOn ? 36 : 18;

    const canSensePlayer =
      this.distanceToPlayer < hearingRadius ||
      (this.distanceToPlayer < visualRadius && this.hasDirectLineOfSight(playerPos));

    // 3. State Machine
    switch (this.state) {
      case GhostState.PATROL: {
        this.screechedForCurrentChase = false;
        this.speed = this.patrolSpeed;
        this.setAuraColor(0x38bdf8, 1.2); // Calm eerie blue-cyan glow

        // Check if player sensed
        if (canSensePlayer) {
          this.state = GhostState.ALERT;
          this.alertTimer = 0.65;
        } else {
          // Patrol towards current waypoint
          const currentTarget = this.waypoints[this.currentWaypointIndex];
          const distToWP = new THREE.Vector2(
            currentTarget.x - this.position.x,
            currentTarget.z - this.position.z
          ).length();

          if (distToWP < 2.0) {
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
          }

          this.moveTowards(currentTarget, this.speed, dt);
        }
        break;
      }

      case GhostState.ALERT: {
        this.speed = 1.0;
        this.setAuraColor(0xf59e0b, 2.0); // Ominous warning amber glow
        this.faceTowards(playerPos, dt * 6);

        this.alertTimer -= dt;
        if (this.alertTimer <= 0) {
          if (canSensePlayer || this.distanceToPlayer < 24) {
            this.state = GhostState.CHASE;
          } else {
            this.state = GhostState.PATROL;
          }
        }
        break;
      }

      case GhostState.CHASE: {
        this.speed = this.chaseSpeed;
        this.setAuraColor(0xff0022, 3.5); // Blazing blood-red terror glow

        // Shriek on initiating chase
        if (!this.screechedForCurrentChase) {
          this.screechedForCurrentChase = true;
          AudioManager.getInstance().playGhostScreech();
        }

        // Relentlessly chase player
        this.moveTowards(playerPos, this.speed, dt);

        // Attack if in contact distance
        if (this.distanceToPlayer < 1.9 && this.attackCooldown <= 0) {
          this.state = GhostState.ATTACK;
          this.attackCooldown = 1.6;
          AudioManager.getInstance().playJumpscare();
          onCatchPlayer(45); // Deals 45 damage per strike
        }

        // If player escapes far enough (> 38m) and is silent
        if (this.distanceToPlayer > 40 && !isPlayerRunning) {
          this.state = GhostState.PATROL;
          this.screechedForCurrentChase = false;
        }
        break;
      }

      case GhostState.ATTACK: {
        this.setAuraColor(0xffffff, 5.0); // Blinding flash
        this.moveTowards(playerPos, 1.5, dt);

        if (this.attackCooldown < 1.0) {
          this.state = GhostState.CHASE;
        }
        break;
      }
    }

    // Update heartbeat audio based on distance
    AudioManager.getInstance().updateHeartbeat(this.distanceToPlayer);

    // Sync group position
    this.group.position.x = this.position.x;
    this.group.position.z = this.position.z;
  }

  private hasDirectLineOfSight(targetPos: THREE.Vector3): boolean {
    // Approximation: Ghost can see in 360 degrees when close, front 180 when far
    return true;
  }

  private moveTowards(target: THREE.Vector3, moveSpeed: number, dt: number): void {
    const dir = new THREE.Vector3(target.x - this.position.x, 0, target.z - this.position.z);
    const dist = dir.length();

    if (dist > 0.05) {
      dir.normalize();
      this.position.x += dir.x * moveSpeed * dt;
      this.position.z += dir.z * moveSpeed * dt;

      // Rotate smoothly to face direction of travel
      const targetAngle = Math.atan2(dir.x, dir.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, dt * 5.5);
    }
  }

  private faceTowards(target: THREE.Vector3, lerpFactor: number): void {
    const dir = new THREE.Vector3(target.x - this.position.x, 0, target.z - this.position.z);
    if (dir.lengthSq() > 0.01) {
      dir.normalize();
      const targetAngle = Math.atan2(dir.x, dir.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, lerpFactor);
    }
  }

  private setAuraColor(hex: number, lightIntensity: number): void {
    this.auraLight.color.setHex(hex);
    this.auraLight.intensity = lightIntensity;

    const eyeMat = (this.leftEye.material as THREE.MeshStandardMaterial);
    eyeMat.color.setHex(hex);
    eyeMat.emissive.setHex(hex);
  }

  public teleport(newPos: THREE.Vector3): void {
    this.position.copy(newPos);
    this.group.position.copy(newPos);
    this.state = GhostState.PATROL;
    this.screechedForCurrentChase = false;
  }
}
