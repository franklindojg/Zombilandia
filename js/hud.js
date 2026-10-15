// hud.js — Vigilante Kart 8 / PS1 Android
import * as THREE from 'three';
import { state } from './state.js';
import { camera } from './graphics.js';

function updateWeaponHUD(weapon, ammo) {
      const iconEl = document.getElementById("hud-weapon-icon");
      const nameEl = document.getElementById("hud-weapon-name");
      const ammoEl = document.getElementById("hud-weapon-ammo");
      const slotEl = document.getElementById("hud-weapon-slot");

      if (!weapon || ammo <= 0) {
        iconEl.textContent = "📦";
        nameEl.textContent = "Sin Arma";
        ammoEl.textContent = "--";
        slotEl.classList.remove("weapon-ready-glow");
      } else {
        iconEl.textContent = weapon.icon;
        nameEl.textContent = weapon.name;
        ammoEl.textContent = `MUNICIÓN: ${ammo}`;
        slotEl.classList.add("weapon-ready-glow");
      }
    }

    let eventFeedTimeout = null;
    function showEventFeed(msg) {
      const feed = document.getElementById("hud-event-feed");
      feed.textContent = msg;
      feed.classList.remove("hidden");
      clearTimeout(eventFeedTimeout);
      eventFeedTimeout = setTimeout(() => feed.classList.add("hidden"), 2500);
    }

    const radarCanvas = document.getElementById("hud-radar");
    const radarCtx = radarCanvas.getContext("2d");

    function drawCombatRadar() {
      if (!state.activeArena || state.combatants.length === 0) return;
      const player = state.combatants[0];
      radarCtx.clearRect(0, 0, 116, 116);

      const cx = 58;
      const cy = 58;
      const scale = 50 / state.activeArena.arenaRadius;

      // Círculos de barrido radar
      radarCtx.strokeStyle = "rgba(16, 185, 129, 0.25)";
      radarCtx.lineWidth = 1;
      radarCtx.beginPath();
      radarCtx.arc(cx, cy, 25, 0, Math.PI * 2);
      radarCtx.arc(cx, cy, 48, 0, Math.PI * 2);
      radarCtx.stroke();

      // Cajas de armas activas (puntos amarillos pequeños)
      state.weaponCrates.forEach((c) => {
        if (!c.active) return;
        radarCtx.fillStyle = "rgba(250, 204, 21, 0.65)";
        radarCtx.fillRect(cx + c.basePos.x * scale - 1, cy + c.basePos.z * scale - 1, 2.5, 2.5);
      });

      // Combatientes
      state.combatants.forEach((k) => {
        if (!k.alive) return;
        const rx = cx + k.position.x * scale;
        const ry = cy + k.position.z * scale;
        radarCtx.fillStyle = k.isPlayer ? "#38bdf8" : k === player.lockedTarget ? "#facc15" : "#ef4444";
        radarCtx.beginPath();
        radarCtx.arc(rx, ry, k.isPlayer ? 4.2 : 3.4, 0, Math.PI * 2);
        radarCtx.fill();
      });
    }

    let lastEnemyHealthUpdate = 0;
    const projectedTarget = new THREE.Vector3();
    let enemyRoster = null;
    const enemyRows = [];
    function updateReticleAndEnemyList(player) {
      const reticleEl = document.getElementById("target-reticle");
      const labelEl = document.getElementById("reticle-label");

      if (player.alive && player.lockedTarget && player.lockedTarget.alive && state.gameState === "COMBAT") {
        const targetPos = projectedTarget.copy(player.lockedTarget.mesh.position);
        targetPos.y += 1.8;
        targetPos.project(camera);

        if (targetPos.z > -1 && targetPos.z < 1 && Math.abs(targetPos.x) < 1.05 && Math.abs(targetPos.y) < 1.05) {
          const sx = (targetPos.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-(targetPos.y * 0.5) + 0.5) * window.innerHeight;
          reticleEl.style.left = `${sx}px`;
          reticleEl.style.top = `${sy}px`;
          labelEl.textContent = `${player.lockedTarget.name} (${Math.ceil(player.lockedTarget.hp)} HP)`;
          reticleEl.classList.remove("hidden");
        } else {
          reticleEl.classList.add("hidden");
        }
      } else {
        reticleEl.classList.add("hidden");
      }

      // Lista de salud de rivales en el HUD derecho
      const listEl = document.getElementById("hud-enemy-list");
      if (!listEl) return;
      const now = performance.now();
      if (now - lastEnemyHealthUpdate < 200) return;
      lastEnemyHealthUpdate = now;
      if (enemyRoster !== state.combatants) {
        enemyRoster = state.combatants;
        listEl.innerHTML = '';
        enemyRows.length = 0;
        state.combatants.slice(1).forEach(enemy => {
          const row = document.createElement('div');
          row.className = 'flex items-center justify-between gap-2';
          const name = document.createElement('span');
          name.textContent = enemy.name;
          const track = document.createElement('div');
          track.className = 'w-16 h-2 bg-slate-800 rounded overflow-hidden';
          const bar = document.createElement('div');
          track.appendChild(bar); row.appendChild(name); row.appendChild(track);
          listEl.appendChild(row); enemyRows.push({ enemy, name, bar });
        });
      }
      enemyRows.forEach(({ enemy, name, bar }) => {
        const pct = Math.round((enemy.hp / enemy.maxHp) * 100);
        name.className = enemy.alive ? 'text-slate-300' : 'line-through text-slate-600';
        bar.className = 'h-full ' + (enemy.alive ? 'bg-red-500' : 'bg-slate-700');
        bar.style.width = `${pct}%`;
      });
    }

export { updateWeaponHUD, showEventFeed, drawCombatRadar, updateReticleAndEnemyList };
