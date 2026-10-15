// vehicles.js — Vigilante Kart 8 / PS1 Android
import * as THREE from 'three';
import { state, keys, playerCustom } from './state.js';
import { worldGroup, GAME_TEXTURE_CACHE, SHARED_MATERIALS, createKartShadow } from './graphics.js';
import { createMarioKartModel } from './karts.js';
import { getTerrainHeight, getDriveSurfaceHeight } from './arena.js';
import { rampSurfaceHeight } from './ramp-physics.js';
import { fitGroundPose, setContactAxes, minimumChassisHeight, wheelSuspensionOffset, WHEEL_CLEARANCE } from './surface-physics.js';
import { findBestTarget, fireMachineGun, fireSpecialWeapon, spawnExplosion } from './weapons.js';
import { checkArenaEndCondition } from './match.js';
import { showEventFeed } from './hud.js';
import { sfx } from './audio.js';
import { wasmPhysics } from './wasm-physics.js';

class VigilanteKart {
      constructor(isPlayer, name, cfg, maxHp = 100) {
        this.isPlayer = isPlayer;
        this.name = name;
        this.mesh = createMarioKartModel(cfg);
        worldGroup.add(this.mesh);
        this.groundShadow = createKartShadow();

        this.maxHp = maxHp;
        this.hp = maxHp;
        this.alive = true;
        this.kills = 0;

        this.position = new THREE.Vector3();
        this.previousPosition = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.mass = cfg.tuning === 'heavy' ? 1.5 : cfg.bodyStyle === 'formula' ? 0.85 : 1;
        this.collisionRadius = 1.85;
        this.rampCooldown = 0;
        this.rampContact = null;
        this.rampPitch = 0;
        this.rampRoll = 0;
        this.mesh.rotation.order = 'YXZ';
        this.ramCooldown = 0;
        this._aiTarget = new THREE.Vector3();
        this._aiDiff = new THREE.Vector3();
        this._forward = new THREE.Vector3();
        this._right = new THREE.Vector3();
        this._contactPose = {};
        this._surfaceArena = null;
        this._surfaceRamp = null;
        this._lastSupportRamp = null;
        this._sampleSurface = (x, z) => {
          const ground = getDriveSurfaceHeight(x, z, this._surfaceArena);
          const groundLayer = this._surfaceArena.surface?.lastLayer || 0;
          const ramp = this._surfaceRamp ? rampSurfaceHeight(this._surfaceRamp, x, z) : null;
          this._sampleSurface.lastLayer = ramp !== null && ramp > ground ? 2 : groundLayer;
          return ramp === null ? ground : Math.max(ground, ramp);
        };
        this.heading = 0;
        this.steerAngle = 0;
        this.verticalY = 0;
        this.verticalVel = 0;

        this.pitchAngle = 0;
        this.rollAngle = 0;
        this.currentGrip = 1.0;

        this.isDrifting = false;
        this.driftDirection = 0;
        this.driftCharge = 0;
        this.driftBlend = 0;

        this.specialWeapon = null;
        this.specialAmmo = 0;
        this.mgCooldown = 0;
        this.muzzleTimer = 0;
        this.boostTimer = 0;
        this.shieldTimer = 0;

        this.lockedTarget = null;
        this.aiStateTimer = 0;
        this.aiStrafeSign = 1;
      }

      spawnInArena(index, totalCount, arena) {
        const angle = (index / totalCount) * Math.PI * 2;
        const spawnRadius = arena.arenaRadius * 0.55;
        const sx = Math.cos(angle) * spawnRadius;
        const sz = Math.sin(angle) * spawnRadius;
        const sy = getDriveSurfaceHeight(sx, sz, arena);

        this.position.set(sx, sy, sz);
        this.heading = Math.atan2(-sx, -sz);
        this.previousPosition.copy(this.position);
        this.velocity.set(0, 0, 0);
        this.verticalY = 0;
        this.verticalVel = 0;
        this.rampContact = null;
        this._lastSupportRamp = null;
        this.rampPitch = this.rampRoll = 0;

        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.heading;
        this.groundShadow.position.set(sx, sy + 0.19, sz);
      }

      takeDamage(amount, attacker) {
        if (!this.alive || this.shieldTimer > 0) return;
        this.hp = Math.max(0, this.hp - amount);

        if (this.hp <= 0) {
          this.alive = false;
          this.groundShadow.material.opacity = 0.32;
          spawnExplosion(this.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 5.5, 0xf97316);
          sfx.playExplosion();

          // Chasis carbonizado al ser destruido
          const scorched = new THREE.MeshLambertMaterial({ color: 0x25232c, flatShading: true });
          this.mesh.traverse((child) => {
            if (child.isMesh && child !== this.mesh.userData.shieldDome) {
              // Material original será liberado por disposeGroup al finalizar la arena.
              if (child.material && child.material.map && ![...GAME_TEXTURE_CACHE.values()].includes(child.material.map)) {
                child.material.map.dispose();
              }
              if (child.material && !SHARED_MATERIALS.has(child.material)) child.material.dispose();
              child.material = scorched;
            }
          });

          if (attacker && attacker !== this) {
            attacker.kills++;
            showEventFeed(`💥 ¡${attacker.name} destruyó a ${this.name}!`);
          } else {
            showEventFeed(`💥 ¡${this.name} fue reducido a chatarra!`);
          }

          checkArenaEndCondition();
        }
      }

      updateCombatPhysics(dt, arena) {
        if (!this.alive) return;
        this.previousPosition.copy(this.position);
        this.rampCooldown = Math.max(0, this.rampCooldown - dt);
        this.ramCooldown = Math.max(0, this.ramCooldown - dt);

        const cupData = arena.cupData;
        const tuning = this.isPlayer ? playerCustom.tuning : "balanced";

        let engineForce = 118;
        let maxForwardSpeed = 106;
        let baseGrip = cupData.surfaceGrip;

        if (tuning === "interceptor") {
          maxForwardSpeed = 118;
          engineForce = 126;
        } else if (tuning === "heavy") {
          maxForwardSpeed = 98;
          baseGrip *= 1.1;
        }

        if (this.boostTimer > 0) {
          this.boostTimer -= dt;
          maxForwardSpeed *= 1.35;
          engineForce *= 1.55;
        }

        if (this.shieldTimer > 0) {
          this.mesh.userData.shieldDome.visible = true;
          this.shieldTimer -= dt;
          this.mesh.userData.shieldMat.opacity = 0.35 + Math.sin(performance.now() * 0.015) * 0.15;
          this.mesh.userData.shieldDome.rotation.y += dt * 3;
        } else {
          this.mesh.userData.shieldMat.opacity = 0;
          this.mesh.userData.shieldDome.visible = false;
        }

        if (this.mgCooldown > 0) this.mgCooldown -= dt;
        if (this.muzzleTimer > 0) {
          this.muzzleTimer -= dt;
          this.mesh.userData.muzzleFlashes.forEach((f) => { f.material.opacity = 0.9; f.visible = true; });
        } else {
          this.mesh.userData.muzzleFlashes.forEach((f) => { f.material.opacity = 0; f.visible = false; });
        }

        // Selección automática del enemigo vivo más cercano en ángulo frontal (Target Lock V8)
        this.lockedTarget = findBestTarget(this);

        // Entradas del Jugador vs IA Todos Contra Todos
        let throttleInput = 0;
        let steerInput = 0;
        let wantDrift = false;
        let wantFireMG = false;

        if (this.isPlayer && state.gameState === "COMBAT") {
          if (keys.forward) throttleInput = 1;
          else if (keys.backward) throttleInput = -0.75;

          if (keys.left) steerInput = 1;
          if (keys.right) steerInput = -1;
          wantDrift = keys.drift;
          wantFireMG = keys.fireMG;
        } else if (!this.isPlayer && state.gameState === "COMBAT") {
          // IA Vigilante 8: Busca cajas si no tiene arma o persigue y ataca a su blanco fijado
          this.aiStateTimer -= dt;
          if (this.aiStateTimer <= 0) {
            this.aiStateTimer = 1.5 + Math.random() * 2;
            this.aiStrafeSign = Math.random() < 0.5 ? 1 : -1;
          }

          const targetPos = this._aiTarget.set(0, 0, 0);
          if (!this.specialWeapon && state.weaponCrates.some((c) => c.active)) {
            // Ir por una caja de armas cercana
            let nearestCrate = null;
            let bestD = Infinity;
            state.weaponCrates.forEach((c) => {
              if (!c.active) return;
              const d = this.position.distanceToSquared(c.basePos);
              if (d < bestD) { bestD = d; nearestCrate = c; }
            });
            if (nearestCrate) targetPos.copy(nearestCrate.basePos);
          } else if (this.lockedTarget) {
            targetPos.copy(this.lockedTarget.position);
          }

          const toTarget = this._aiDiff.copy(targetPos).sub(this.position);
          const distToTarget = toTarget.length();
          const desiredHeading = Math.atan2(toTarget.x, toTarget.z);
          let angleDiff = desiredHeading - this.heading;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          steerInput = THREE.MathUtils.clamp(angleDiff * 2.4, -1, 1);
          throttleInput = distToTarget < 28 ? -0.5 : 1.0;
          // Evitar obstáculos cercanos antes de quedarse empujándolos.
          const aheadX = Math.sin(this.heading), aheadZ = Math.cos(this.heading);
          for (const obstacle of state.arenaObstacles) {
            const ox = obstacle.position.x - this.position.x, oz = obstacle.position.z - this.position.z;
            const ahead = ox * aheadX + oz * aheadZ;
            const side = ox * aheadZ - oz * aheadX;
            if (ahead > 0 && ahead < 25 && Math.abs(side) < obstacle.radius + 4) {
              steerInput = side >= 0 ? -1 : 1;
              throttleInput = 0.55;
              wantDrift = false;
              break;
            }
          }

          if (Math.abs(angleDiff) > 0.8 && this.velocity.length() > 40) {
            wantDrift = true;
          }

          // Disparar Ametralladora y Arma Especial si tiene línea de tiro
          if (this.lockedTarget && Math.abs(angleDiff) < 0.38 && distToTarget < 210) {
            wantFireMG = Math.random() < arena.levelObj.aiAggro * 0.45;
            if (this.specialWeapon && Math.random() < 0.028 * arena.levelObj.aiAggro) {
              fireSpecialWeapon(this);
            }
          }
        }

        if (wantFireMG && this.mgCooldown <= 0) {
          fireMachineGun(this);
        }

        // WASM real: movimiento del kart en CPU. Si falla, ejecutar física JS original.
        let forwardSpeed = 0;
        let groundY = 0;
        const simulatedByWasm = wasmPhysics.stepVehicle(this,
          { throttle: throttleInput, steer: steerInput, drift: wantDrift },
          arena, dt, engineForce, maxForwardSpeed, baseGrip, cupData.surfaceDrag);
        if (simulatedByWasm) {
          forwardSpeed = this._wasmForwardSpeed;
          groundY = this._wasmGroundY;
        } else {
        // Física vectorial longitudinal y lateral del chasis
        const forwardDir = this._forward.set(Math.sin(this.heading), 0, Math.cos(this.heading));
        const rightDir = this._right.set(Math.cos(this.heading), 0, -Math.sin(this.heading));

        forwardSpeed = this.velocity.dot(forwardDir);
        let lateralSpeed = this.velocity.dot(rightDir);

        // Entrada con histéresis: evita cortar el derrape al perder algo de velocidad.
        const grounded = this.verticalY <= 0.1 && this.verticalVel <= 0;
        const driftSpeed = this.isDrifting ? 9 : 12;
        const driftSteer = this.isDrifting ? 0.08 : 0.15;
        if (wantDrift && grounded && forwardSpeed > driftSpeed && Math.abs(steerInput) > driftSteer) {
          if (!this.isDrifting) {
            this.isDrifting = true;
            this.driftDirection = Math.sign(steerInput);
          }
          this.driftCharge = Math.min(100, this.driftCharge + dt * 52);
        } else {
          if (this.isDrifting && this.driftCharge >= 50 && !wantDrift && grounded && forwardSpeed > 9) {
            this.boostTimer = 1.25;
          }
          this.isDrifting = false;
          this.driftCharge = 0;
        }
        const driftTarget = this.isDrifting ? 1 : 0;
        this.driftBlend += (driftTarget - this.driftBlend) * (1 - Math.exp(-dt * (this.isDrifting ? 10 : 7)));

        const speedFactor = THREE.MathUtils.clamp(Math.abs(forwardSpeed) / 95, 0, 1);
        const targetSteer = steerInput * (1.0 - speedFactor * 0.3);
        this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, dt * 10);

        if (Math.abs(forwardSpeed) > 0.8) {
          const turnRate = 1.85 + this.driftBlend * 0.35;
          const dirSign = forwardSpeed >= 0 ? 1 : -1;
          this.heading += this.steerAngle * turnRate * dirSign * dt;
        }

        forwardDir.set(Math.sin(this.heading), 0, Math.cos(this.heading));
        rightDir.set(Math.cos(this.heading), 0, -Math.sin(this.heading));

        const prevForwardSpeed = forwardSpeed;
        forwardSpeed += throttleInput * engineForce * dt;
        forwardSpeed -= forwardSpeed * cupData.surfaceDrag * dt;
        forwardSpeed = THREE.MathUtils.clamp(forwardSpeed, -42, maxForwardSpeed);

        this.currentGrip = baseGrip * (1 - this.driftBlend * 0.48);
        lateralSpeed *= Math.exp(-this.currentGrip * 8.5 * dt);

        if (this.isDrifting) {
          lateralSpeed += -this.driftDirection * forwardSpeed * 2 * this.driftBlend * dt;
        }

        this.velocity
          .copy(forwardDir)
          .multiplyScalar(forwardSpeed)
          .addScaledVector(rightDir, lateralSpeed);

        this.position.addScaledVector(this.velocity, dt);

        // Límite del Muro Perimetral del Coliseo 5X
        const distFromOrigin = Math.hypot(this.position.x, this.position.z);
        const maxArenaR = arena.arenaRadius - 6;
        if (distFromOrigin > maxArenaR) {
          const pushNormal = new THREE.Vector3(-this.position.x, 0, -this.position.z).normalize();
          this.position.x = -pushNormal.x * maxArenaR;
          this.position.z = -pushNormal.z * maxArenaR;
          this.velocity.addScaledVector(pushNormal, 35);
        }

        // Altura sobre el terreno y saltos en rampas
        groundY = getTerrainHeight(this.position.x, this.position.z, arena.arenaRadius, arena.heightAmp);
        if (this.verticalY > 0 || this.verticalVel > 0) {
          this.verticalY += this.verticalVel * dt;
          this.verticalVel -= 38 * dt;
          if (this.verticalY <= 0) {
            this.verticalY = 0;
            this.verticalVel = 0;
          }
        }
        this.position.y = groundY + this.verticalY;

        // Transferencia de peso (Pitch & Roll)
        const longitudinalAccel = (forwardSpeed - prevForwardSpeed) / Math.max(dt, 0.001);
        const targetPitch = THREE.MathUtils.clamp(-longitudinalAccel * 0.0018, -0.14, 0.14);
        const targetRoll = THREE.MathUtils.clamp(-this.steerAngle * (forwardSpeed / 95) * 0.2, -0.24, 0.24);

        this.pitchAngle = THREE.MathUtils.lerp(this.pitchAngle, targetPitch, dt * 10);
        this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, dt * 10);

        }

        // Ajustar también el resultado WASM al suelo/ carretera que realmente se ve.
        groundY = getDriveSurfaceHeight(this.position.x, this.position.z, arena);
        this.position.y = groundY + this.verticalY;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.heading;
        this.groundShadow.position.set(this.position.x, groundY + 0.19, this.position.z);
        const jumpScale = Math.max(0.65, 1 - this.verticalY * 0.014);
        this.groundShadow.scale.set(5.9 * jumpScale, 8.2 * jumpScale, 1);
        this.groundShadow.material.opacity = Math.max(0.4, 0.95 - this.verticalY * 0.025);

        const susp = this.mesh.userData.suspensionBody;
        susp.rotation.x = this.pitchAngle - (this.verticalVel * 0.012);
        susp.rotation.z = this.rollAngle;

        if (this.mesh.userData.headGroup) {
          this.mesh.userData.headGroup.rotation.z = -this.steerAngle * 0.35;
          this.mesh.userData.headGroup.rotation.y = this.steerAngle * 0.42;
        }
        if (this.mesh.userData.steeringWheelGroup) {
          this.mesh.userData.steeringWheelGroup.rotation.z = -this.steerAngle * 0.7;
        }

        this.mesh.userData.frontWheelPivots.forEach((p) => {
          p.rotation.y = this.steerAngle * 0.48;
        });
        this.mesh.userData.wheelMeshes.forEach((w) => {
          w.rotation.x += forwardSpeed * dt * 0.55;
        });

        const flameScale = this.boostTimer > 0 ? 1.4 : throttleInput > 0 ? 0.55 : 0.0;
        this.mesh.userData.exhaustFlames.forEach((flame) => {
          flame.visible = flameScale > 0;
          flame.material.opacity = flameScale > 0 ? 0.85 : 0;
          flame.scale.set(1, flameScale + Math.random() * 0.25, 1);
        });
      }

      syncVisual(alpha = 1) {
        this.mesh.position.copy(this.previousPosition).lerp(this.position, alpha);
        this.mesh.rotation.y = this.heading;
        const arena = state.activeArena;
        if (!arena) return;
        const wheels = this.mesh.userData.wheelSpecs, pivots = this.mesh.userData.wheelPivots;
        this._surfaceArena = arena;
        if (this.rampContact) this._lastSupportRamp = this.rampContact;
        if (this._lastSupportRamp && !this.rampContact) {
          const ramp = this._lastSupportRamp, dx = this.mesh.position.x - ramp.position.x, dz = this.mesh.position.z - ramp.position.z;
          const along = dx * ramp.forwardX + dz * ramp.forwardZ, side = dx * ramp.forwardZ - dz * ramp.forwardX;
          if (Math.abs(along) > ramp.length / 2 + 2.7 || Math.abs(side) > ramp.width / 2 + 2.1) this._lastSupportRamp = null;
        }
        this._surfaceRamp = this._lastSupportRamp;
        const x = this.mesh.position.x, z = this.mesh.position.z, steer = this.steerAngle * 0.48;
        const grounded = this.verticalY <= 0.1 && this.verticalVel <= 0;
        const pose = this._contactPose;
        if (grounded && !this.rampContact) {
          fitGroundPose(pose, x, z, this.heading, wheels, this._sampleSurface, steer);
          this.mesh.position.y = pose.height;
        } else {
          setContactAxes(pose, this.heading, this.rampPitch, this.rampRoll);
          const minimum = minimumChassisHeight(pose, x, z, wheels, this._sampleSurface, steer);
          this.mesh.position.y = Math.max(this.mesh.position.y + WHEEL_CLEARANCE, minimum);
        }
        this.mesh.rotation.x = pose.pitch;
        this.mesh.rotation.z = pose.roll;
        for (let i = 0; i < 4; i++) {
          const offset = grounded || this.rampContact ? wheelSuspensionOffset(pose, x, this.mesh.position.y,
            z, wheels[i], this._sampleSurface, steer, i) : 0;
          pivots[i].position.y = wheels[i].y + offset;
        }
        this.mesh.userData.suspensionBody.rotation.x = this.pitchAngle - this.verticalVel * 0.012;
        this.groundShadow.position.set(this.mesh.position.x,
          this._sampleSurface(x, z) + 0.19, this.mesh.position.z);
      }
    }

export { VigilanteKart };
