// weapons.js — Vigilante Kart 8 / PS1 Android
import * as THREE from 'three';
import { V8_WEAPONS } from './config.js';
import { state } from './state.js';
import { worldGroup, acquireProjectile, releaseProjectile, acquireExplosion, poolExplosions } from './graphics.js';
import { updateWeaponHUD, showEventFeed } from './hud.js';
import { getTerrainHeight, getDriveSurfaceHeight } from './arena.js';
import { sfx } from './audio.js';
import { resolveKartContact, resolveObstacleContact, segmentDistanceSquared } from './collision.js';
import { spawnParticle } from './effects.js';
import { resolveRampContacts } from './ramp-physics.js';

function findBestTarget(shooter) {
      let bestTarget = null;
      let bestScore = Infinity;
      const forwardX = Math.sin(shooter.heading), forwardZ = Math.cos(shooter.heading);

      state.combatants.forEach((other) => {
        if (other === shooter || !other.alive) return;
        const dx = other.position.x - shooter.position.x, dy = other.position.y - shooter.position.y,
          dz = other.position.z - shooter.position.z;
        const dist = Math.hypot(dx, dy, dz);
        if (dist > 380) return;

        const dot = dist > 0 ? (forwardX * dx + forwardZ * dz) / dist : 1;
        // Priorizar enemigos frente al kart y cercanos
        const score = dist * (1.6 - dot * 0.6);
        if (score < bestScore) {
          bestScore = score;
          bestTarget = other;
        }
      });
      return bestTarget;
    }

    function fireMachineGun(shooter) {
      shooter.mgCooldown = 0.11;
      if (state.projectiles.length >= 128) return;
      shooter.muzzleTimer = 0.05;
      if (shooter.isPlayer) sfx.playMachineGun();

      const forward = new THREE.Vector3(Math.sin(shooter.heading), 0, Math.cos(shooter.heading));
      // Ligera asistencia hacia el objetivo fijado si está en el cono frontal
      if (shooter.lockedTarget) {
        const toTarget = shooter.lockedTarget.position.clone().sub(shooter.position).normalize();
        if (forward.dot(toTarget) > 0.85) {
          forward.lerp(toTarget, 0.55).normalize();
        }
      }

      const tracerMesh = acquireProjectile('mg_bullet', 0xfef08a);

      tracerMesh.position.copy(shooter.position).addScaledVector(forward, 3.4);
      tracerMesh.position.y += 1.05;
      tracerMesh.rotation.y = Math.atan2(forward.x, forward.z);
      worldGroup.add(tracerMesh);

      state.projectiles.push({
        type: "mg_bullet",
        owner: shooter,
        mesh: tracerMesh,
        velocity: forward.multiplyScalar(280),
        damage: 3.5,
        life: 1.1,
        homingTarget: null
      });
    }

    function fireSpecialWeapon(shooter) {
      if (!shooter.specialWeapon || shooter.specialAmmo <= 0) return;
      if (state.projectiles.length >= 125) return;
      const w = shooter.specialWeapon;
      shooter.specialAmmo--;

      if (shooter.isPlayer) {
        sfx.playMissileLaunch();
        updateWeaponHUD(shooter.specialAmmo > 0 ? w : null, shooter.specialAmmo);
      }
      if (shooter.specialAmmo <= 0) {
        shooter.specialWeapon = null;
      }

      const forward = new THREE.Vector3(Math.sin(shooter.heading), 0, Math.cos(shooter.heading));

      if (w.id === "shield_star") {
        shooter.shieldTimer = 7.0;
        shooter.boostTimer = 4.0;
        if (shooter.isPlayer) showEventFeed("🛡️ ¡Escudo Deflector + Turbo Activado!");
        return;
      }

      if (w.id === "land_mine") {
        const mineMesh = acquireProjectile('mine', 0x22c55e);
        mineMesh.position.copy(shooter.position).addScaledVector(forward, -4.5);
        mineMesh.position.y += 0.4;
        worldGroup.add(mineMesh);

        state.projectiles.push({
          type: "mine",
          owner: shooter,
          mesh: mineMesh,
          velocity: new THREE.Vector3(0, 0, 0),
          damage: w.damage,
          life: 24,
          homingTarget: null
        });
        return;
      }

      // Retroceso balístico sobre el chasis en Cañón Bruiser
      if (w.id === "bruiser") {
        shooter.velocity.addScaledVector(forward, -22);
      }

      const count = w.id === "bulls_eye" ? 3 : 1;
      for (let c = 0; c < count; c++) {
        const spreadAngle = (c - (count - 1) / 2) * 0.08;
        const dir = forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);

        const missileMesh = acquireProjectile(w.id, w.color, w.id === 'bruiser' ? 1.25 : 0.95);
        missileMesh.position.copy(shooter.position).addScaledVector(dir, 4.2);
        missileMesh.position.y += 1.5;
        worldGroup.add(missileMesh);

        const vel = dir.multiplyScalar(w.speed);
        if (w.id === "sky_hammer") vel.y = 32; // Tiro parabólico de mortero

        state.projectiles.push({
          type: w.id,
          owner: shooter,
          mesh: missileMesh,
          velocity: vel,
          damage: count > 1 ? w.damage * 0.55 : w.damage,
          life: 4.5,
          homingTarget: w.id === "interceptor" ? shooter.lockedTarget : null
        });
      }
    }

    function spawnExplosion(pos, maxScale = 4.0, hexColor = 0xf97316) {
      const ex = acquireExplosion();
      ex.mesh.position.copy(pos);
      ex.mat.color.setHex(hexColor);
      ex.mat.opacity = 0.95;
      ex.life = 0.42;
      ex.scale = 0.65;
      ex.maxScale = maxScale * 3.5;
      ex.mesh.scale.setScalar(ex.scale);
      worldGroup.add(ex.mesh);
      state.explosions.push(ex);
    }

    function updateArenaInteractions(dt) {
      // 2. Colisión contra Obstáculos de la Arena
      // Respuesta común a ambos motores: deslizarse y rebotar solo hacia afuera.
      state.arenaObstacles.forEach((obs) => {
        state.combatants.forEach((k) => resolveObstacleContact(k, obs));
      });


      // 3. Choques y Embistes (Ramming Damage) entre Karts
      for (let i = 0; i < state.combatants.length; i++) {
        for (let j = i + 1; j < state.combatants.length; j++) {
          const kA = state.combatants[i];
          const kB = state.combatants[j];
          const impactSpeed = resolveKartContact(kA, kB);
          if (impactSpeed > 45 && kA.ramCooldown <= 0 && kB.ramCooldown <= 0) {
              kA.ramCooldown = kB.ramCooldown = 0.35;
              const ramDmg = Math.min(18, impactSpeed * 0.14);
              kA.takeDamage(kB.shieldTimer > 0 ? ramDmg * 2 : ramDmg * 0.5, kB);
              kB.takeDamage(kA.shieldTimer > 0 ? ramDmg * 2 : ramDmg * 0.5, kA);
              spawnParticle(2, (kA.position.x + kB.position.x) * 0.5,
                (kA.position.y + kB.position.y) * 0.5 + 0.8, (kA.position.z + kB.position.z) * 0.5, 4);
          }
        }
      }

      // Contacto real con la cuña después de resolver desplazamientos por choques.
      if (state.activeArena) {
        const arena = state.activeArena;
        for (const kart of state.combatants) {
          const groundY = getDriveSurfaceHeight(kart.position.x, kart.position.z, arena);
          const result = resolveRampContacts(kart, state.jumpRamps, dt, groundY);
          if (result === 'blocked') {
            kart.position.y = getDriveSurfaceHeight(kart.position.x, kart.position.z, arena) + kart.verticalY;
          } else if (!result) {
            kart.position.y = groundY + kart.verticalY;
          }
        }
      }

      // 4. Recolección de Cajas de Armas V8
      state.weaponCrates.forEach((crate) => {
        if (!crate.active) {
          crate.respawnTimer -= dt;
          if (crate.respawnTimer <= 0) {
            crate.active = true;
            crate.mesh.visible = true;
          }
          return;
        }
        crate.mesh.rotation.y += dt * 1.8;

        state.combatants.forEach((k) => {
          if (!crate.active || !k.alive) return;
          if (k.position.distanceToSquared(crate.basePos) < 18) {
            crate.active = false;
            crate.mesh.visible = false;
            crate.respawnTimer = 6.0;

            const randomWeapon = V8_WEAPONS[Math.floor(Math.random() * V8_WEAPONS.length)];
            k.specialWeapon = randomWeapon;
            k.specialAmmo = randomWeapon.ammo;

            if (k.isPlayer) {
              sfx.playPickup();
              updateWeaponHUD(randomWeapon, randomWeapon.ammo);
              showEventFeed(`${randomWeapon.icon} Equipada: ${randomWeapon.name} (${randomWeapon.desc})`);
            }
          }
        });
      });

      // 5. Llaves Inglesas de Reparación (+35 HP)
      state.repairWrenches.forEach((w) => {
        if (!w.active) {
          w.respawnTimer -= dt;
          if (w.respawnTimer <= 0) {
            w.active = true;
            w.mesh.visible = true;
          }
          return;
        }
        w.mesh.rotation.y += dt * 2.5;

        state.combatants.forEach((k) => {
          if (!w.active || !k.alive || k.hp >= k.maxHp) return;
          if (k.position.distanceToSquared(w.basePos) < 18) {
            w.active = false;
            w.mesh.visible = false;
            w.respawnTimer = 10.0;
            k.hp = Math.min(k.maxHp, k.hp + 35);
            if (k.isPlayer) {
              sfx.playPickup();
              showEventFeed("🔧 ¡Blindaje reparado +35 HP!");
            }
          }
        });
      });

      // 6. Proyectiles Balísticos Activos
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        p.life -= dt;
        const startX = p.mesh.position.x, startY = p.mesh.position.y, startZ = p.mesh.position.z;

        // Guiado de Misil Halo
        if (p.homingTarget && p.homingTarget.alive) {
          const desired = p.homingTarget.position
            .clone()
            .add(new THREE.Vector3(0, 1.2, 0))
            .sub(p.mesh.position)
            .normalize()
            .multiplyScalar(175);
          p.velocity.lerp(desired, dt * 6.5);
        }

        // Gravedad para el Mortero Cráter
        if (p.type === "sky_hammer") {
          p.velocity.y -= 36 * dt;
        }

        p.mesh.position.addScaledVector(p.velocity, dt);

        let exploded = false;
        for (const k of state.combatants) {
          if (!k.alive || k === p.owner) continue;
          const hitRadiusSq = p.type === "mg_bullet" ? 9.5 : 16.0;
          // Segmento en espacio relativo: incluye el movimiento del blanco.
          if (segmentDistanceSquared(startX - k.previousPosition.x, startY - k.previousPosition.y - 1,
            startZ - k.previousPosition.z, p.mesh.position.x - k.position.x,
            p.mesh.position.y - k.position.y - 1, p.mesh.position.z - k.position.z, 0, 0, 0) < hitRadiusSq) {
            k.takeDamage(p.damage, p.owner);
            // Empuje cinético al recibir impacto
            const push = p.velocity.clone().setY(0).normalize().multiplyScalar(p.type === "mg_bullet" ? 3 : 22);
            k.velocity.add(push);
            if (p.type === 'mg_bullet') spawnParticle(2, p.mesh.position.x, p.mesh.position.y, p.mesh.position.z, 1.5);
            exploded = true;
            break;
          }
        }

        // Impacto contra el suelo en morteros
        if (p.type === "sky_hammer" && state.activeArena) {
          const gY = getTerrainHeight(p.mesh.position.x, p.mesh.position.z, state.activeArena.arenaRadius, state.activeArena.heightAmp);
          if (p.mesh.position.y <= gY + 0.5) {
            exploded = true;
          }
        }

        if (exploded || p.life <= 0) {
          if (exploded && p.type !== "mg_bullet") {
            spawnExplosion(p.mesh.position, 4.2, 0xf97316);
            sfx.playExplosion();
          }
          releaseProjectile(p);
          state.projectiles.splice(i, 1);
        }
      }

      // 7. Animar Explosiones 3D
      for (let i = state.explosions.length - 1; i >= 0; i--) {
        const ex = state.explosions[i];
        ex.life -= dt;
        ex.scale = THREE.MathUtils.lerp(ex.scale, ex.maxScale, dt * 12);
        ex.mesh.scale.setScalar(ex.scale);
        ex.mat.opacity = Math.max(0, ex.life * 2);
        if (ex.life <= 0) {
          worldGroup.remove(ex.mesh);
          poolExplosions.push(ex);
          state.explosions.splice(i, 1);
        }
      }
    }

export { findBestTarget, fireMachineGun, fireSpecialWeapon, spawnExplosion, updateArenaInteractions };
