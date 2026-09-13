/**
 * BloxVerse 3D - PlayerPhysics
 * Handles realistic yet responsive arcade block-platformer physics:
 * acceleration, deceleration, jumping, gravity, platform riding, and collision resolution.
 */

import * as THREE from 'three';
import { CollisionManager } from '../world/CollisionManager';
import { Collider } from '../types';

export class PlayerPhysics {
  // Movement parameters
  public walkSpeed: number = 7.5;
  public runSpeed: number = 13.5;
  public jumpForce: number = 13.0;
  public gravity: number = 32.0;
  public acceleration: number = 40.0;
  public deceleration: number = 45.0;

  // State vectors
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public position: THREE.Vector3 = new THREE.Vector3(0, 1.0, 0);

  // Status flags
  public isGrounded: boolean = true;
  public isJumping: boolean = false;
  public isFalling: boolean = false;

  // Coyote time & jump buffer for crisp platforming feel
  private coyoteTimer: number = 0;
  private readonly COYOTE_TIME = 0.14; // seconds
  private jumpBufferTimer: number = 0;
  private readonly JUMP_BUFFER = 0.12;

  // Standing platform tracking
  public currentPlatformCollider: Collider | null = null;
  public platformVelocity: THREE.Vector3 = new THREE.Vector3();

  private collisionManager: CollisionManager;

  constructor(initialPosition: THREE.Vector3 = new THREE.Vector3(0, 2, 0)) {
    this.position.copy(initialPosition);
    this.collisionManager = CollisionManager.getInstance();
  }

  public update(delta: number, inputMoveDir: THREE.Vector2, wantsRun: boolean, wantsJump: boolean): void {
    // Clamp huge deltas when switching tabs or lag spikes
    const dt = Math.min(delta, 0.05);

    // Update jump buffer
    if (wantsJump) {
      this.jumpBufferTimer = this.JUMP_BUFFER;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    // Ground raycast check
    const groundCheck = this.collisionManager.checkGround(this.position.x, this.position.y, this.position.z);

    if (groundCheck.isGrounded && this.velocity.y <= 0.01) {
      this.isGrounded = true;
      this.isFalling = false;
      this.isJumping = false;
      this.coyoteTimer = this.COYOTE_TIME;
      this.position.y = groundCheck.groundY;
      this.velocity.y = 0;
      this.currentPlatformCollider = groundCheck.collider;

      // Check if platform is a dynamic moving platform
      if (groundCheck.collider && groundCheck.collider.userData?.velocity) {
        this.platformVelocity.copy(groundCheck.collider.userData.velocity);
      } else {
        this.platformVelocity.set(0, 0, 0);
      }
    } else {
      this.isGrounded = false;
      this.currentPlatformCollider = null;
      this.platformVelocity.set(0, 0, 0);
      if (this.coyoteTimer > 0) {
        this.coyoteTimer -= dt;
      }
      if (this.velocity.y < 0) {
        this.isFalling = true;
        this.isJumping = false;
      }
    }

    // Execute jump if buffered and coyote time permits
    if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;
      this.isFalling = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
      // Clamp terminal velocity
      if (this.velocity.y < -35) {
        this.velocity.y = -35;
      }
    }

    // Horizontal acceleration & deceleration
    const targetSpeed = wantsRun ? this.runSpeed : this.walkSpeed;
    const targetVelX = inputMoveDir.x * targetSpeed;
    const targetVelZ = inputMoveDir.y * targetSpeed;

    const currentHorizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    const accelRate = (inputMoveDir.lengthSq() > 0.01) ? this.acceleration : this.deceleration;

    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVelX, accelRate, dt);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, targetVelZ, accelRate, dt);

    // Apply platform inertia + player velocity to position
    const totalMoveX = (this.velocity.x + this.platformVelocity.x) * dt;
    const totalMoveZ = (this.velocity.z + this.platformVelocity.z) * dt;

    const oldX = this.position.x;
    const oldZ = this.position.z;
    const proposedX = oldX + totalMoveX;
    const proposedZ = oldZ + totalMoveZ;

    // Resolve horizontal collisions
    const horizResolved = this.collisionManager.resolveHorizontal(
      oldX,
      oldZ,
      proposedX,
      proposedZ,
      this.position.y
    );

    this.position.x = horizResolved.resolvedX;
    this.position.z = horizResolved.resolvedZ;
    if (horizResolved.hitWall) {
      // Dampen velocity component into wall
      if (Math.abs(horizResolved.resolvedX - proposedX) > 0.001) this.velocity.x = 0;
      if (Math.abs(horizResolved.resolvedZ - proposedZ) > 0.001) this.velocity.z = 0;
    }

    // Apply vertical displacement
    this.position.y += this.velocity.y * dt;
  }

  public launchVertical(force: number): void {
    this.velocity.y = force;
    this.isGrounded = false;
    this.isJumping = true;
    this.isFalling = false;
    this.coyoteTimer = 0;
  }

  public teleport(newPos: THREE.Vector3): void {
    this.position.copy(newPos);
    this.velocity.set(0, 0, 0);
    this.platformVelocity.set(0, 0, 0);
    this.isGrounded = true;
    this.isJumping = false;
    this.isFalling = false;
  }
}
