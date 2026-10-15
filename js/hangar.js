// hangar.js — Vigilante Kart 8 / PS1 Android
import * as THREE from 'three';
import { CUPS_DATA, LEVELS_20 } from './config.js';
import { state, playerCustom } from './state.js';
import { scene, garagePreviewGroup, IS_ANDROID_LIKE, gameTexture, disposeGroup, shadowGeometry } from './graphics.js';
import { createMarioKartModel } from './karts.js';
import { resolveArenaSelection, selectArenaSector } from './arena-selection.js';

function rebuildGarageKart() {
      disposeGroup(garagePreviewGroup);

      const podium = new THREE.Mesh(
        new THREE.CylinderGeometry(3.9, 4.3, 0.42, 36),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.75 })
      );
      podium.position.set(0, -0.21, 0);
      podium.receiveShadow = !IS_ANDROID_LIKE;
      garagePreviewGroup.add(podium);

      const neonRing = new THREE.Mesh(
        new THREE.TorusGeometry(4.0, 0.07, 10, 48),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      neonRing.rotation.x = Math.PI / 2;
      neonRing.position.y = 0.02;
      garagePreviewGroup.add(neonRing);

      const podiumShadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({
        map: gameTexture('effects/kart_shadow.png'), transparent: true, depthWrite: false, opacity: 0.65
      }));
      podiumShadow.rotation.x = -Math.PI / 2;
      podiumShadow.position.y = 0.025;
      podiumShadow.scale.set(5.8, 7.6, 1);
      garagePreviewGroup.add(podiumShadow);

      state.garageKartMesh = createMarioKartModel(playerCustom);
      garagePreviewGroup.add(state.garageKartMesh);
    }

    function renderCupTabsAndLevels() {
      const selected = resolveArenaSelection(state);
      const cupTabsEl = document.getElementById("cup-tabs");
      const bannerEl = document.getElementById("cup-biome-banner");
      const gridEl = document.getElementById("levels-grid");
      const progressEl = document.getElementById("progress-counter");

      progressEl.textContent = `${state.unlockedMaxLevel} / 20`;
      cupTabsEl.innerHTML = "";
      const startButton = document.getElementById('btn-start-race');
      startButton.disabled = !selected.canStart;
      startButton.textContent = selected.canStart ? '🔥 ¡INICIAR COMBATE TOTAL!' : '🔒 SECTOR BLOQUEADO';
      startButton.title = selected.canStart ? '' : 'Completa las arenas anteriores o usa Desbloquear 20 Arenas.';

      CUPS_DATA.forEach((cup, idx) => {
        const isSelected = idx === state.selectedCupIndex;
        const btn = document.createElement("button");
        btn.dataset.cup = String(idx);
        btn.className = `p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
          isSelected
            ? "bg-red-500/25 border-amber-400 text-white shadow-lg"
            : "bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800/70"
        }`;
        btn.innerHTML = `
          <span class="text-lg">${cup.icon}</span>
          <span class="font-kart text-[11px] leading-tight mt-0.5">${cup.name}</span>
        `;
        btn.onclick = () => {
          selectArenaSector(state, idx);
          scene.background = new THREE.Color(cup.skyTop);
          scene.fog = new THREE.FogExp2(cup.fogColor, 0.00065);
          renderCupTabsAndLevels();
        };
        cupTabsEl.appendChild(btn);
      });

      const currentCup = selected.cup;
      bannerEl.innerHTML = `
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="w-3.5 h-3.5 rounded-full border border-white/40 inline-block" style="background:${currentCup.roadColor}"></span>
            <strong class="text-amber-300 font-bold">${currentCup.biomeLabel}</strong>
          </div>
          <p class="text-[11px] text-slate-400">${currentCup.description}</p>
        </div>
        <div class="text-right shrink-0 pl-2">
          <span class="block text-[10px] uppercase text-slate-400">Agarre Base</span>
          <strong class="text-emerald-400 font-hud text-sm">${Math.round(currentCup.surfaceGrip * 100)}%</strong>
        </div>
      `;

      gridEl.innerHTML = "";
      const cupLevels = LEVELS_20.filter((l) => l.cup === state.selectedCupIndex);

      cupLevels.forEach((lvl) => {
        const isUnlocked = lvl.level <= state.unlockedMaxLevel;
        const isChosen = lvl.level === state.selectedLevelNumber;
        const diameterKm = ((lvl.radius5x * 2) / 1000).toFixed(2);

        const card = document.createElement("div");
        card.dataset.level = String(lvl.level);
        card.className = `p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
          !isUnlocked
            ? "bg-slate-950/40 border-slate-800/50 opacity-50 cursor-not-allowed"
            : isChosen
            ? "bg-gradient-to-br from-red-600/25 to-amber-500/20 border-amber-400 shadow-lg"
            : "bg-slate-950/80 border-slate-800 hover:border-slate-600"
        }`;

        card.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                Arena ${lvl.level} • 5X
              </span>
              <h3 class="font-kart text-sm text-white mt-1.5">${lvl.name}</h3>
            </div>
            <span class="text-lg">${isUnlocked ? (isChosen ? "🎯" : "⚔️") : "🔒"}</span>
          </div>
          <div class="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Rivales: <strong class="text-red-400">${lvl.enemyCount} Karts</strong></span>
            <span>Escala: <strong class="text-slate-200">${diameterKm} km</strong></span>
          </div>
        `;

        if (isUnlocked) {
          card.onclick = () => {
            state.selectedCupIndex = lvl.cup;
            state.selectedLevelNumber = lvl.level;
            renderCupTabsAndLevels();
          };
        }
        gridEl.appendChild(card);
      });

      const chosenObj = selected.level;
      document.getElementById("selected-track-title").textContent = `Arena ${chosenObj.level}: ${chosenObj.name}`;
    }

export { rebuildGarageKart, renderCupTabsAndLevels };
