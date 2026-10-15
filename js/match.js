// match.js — Vigilante Kart 8 / PS1 Android
import { KART_PRESETS } from './config.js';
import { resolveArenaSelection } from './arena-selection.js';
import { state, playerCustom, resetInputs } from './state.js';
import { worldGroup, garagePreviewGroup } from './graphics.js';
import { buildCombatArena5X } from './arena.js';
import { VigilanteKart } from './vehicles.js';
import { updateWeaponHUD } from './hud.js';
import { renderCupTabsAndLevels } from './hangar.js';
import { sfx } from './audio.js';
import { resetEffects } from './effects.js';

function startCombatArena() {
      const selected = resolveArenaSelection(state);
      if (!selected.canStart) {
        renderCupTabsAndLevels();
        return false;
      }
      resetInputs();
      sfx.init();
      const levelObj = selected.level;
      buildCombatArena5X(levelObj);

      garagePreviewGroup.visible = false;
      worldGroup.visible = true;

      state.combatants = [];
      const playerMaxHp = playerCustom.tuning === "heavy" ? 135 : 100;
      const playerKart = new VigilanteKart(true, "Tú", playerCustom, playerMaxHp);

      // Cinco vehículos únicos disponibles: el elegido + los otros cuatro como IA.
      const aiRoster = Object.values(KART_PRESETS).filter((p) => p.textureId !== playerCustom.textureId);
      const totalFighters = 5;
      playerKart.spawnInArena(0, totalFighters, state.activeArena);
      state.combatants.push(playerKart);

      for (let i = 0; i < 4; i++) {
        const preset = aiRoster[i % aiRoster.length];
        const enemy = new VigilanteKart(false, preset.name, preset, levelObj.enemyHp);
        enemy.spawnInArena(i + 1, totalFighters, state.activeArena);
        state.combatants.push(enemy);
      }

      document.getElementById("menu-screen").classList.add("hidden");
      document.getElementById("finish-modal").classList.add("hidden");
      document.getElementById("hud-screen").classList.remove("hidden");
      document.getElementById("btn-back-menu").classList.remove("hidden");

      document.getElementById("hud-track-name").textContent = `Arena ${levelObj.level}: ${levelObj.name}`;
      document.getElementById("hud-biome-badge").textContent = state.activeArena.cupData.biomeLabel;
      updateWeaponHUD(null, 0);

      state.gameState = "COMBAT";
      document.body.classList.add('in-combat');
      state.battleTimer = 0;

      const banner = document.getElementById("hud-center-banner");
      banner.textContent = "¡TODOS CONTRA TODOS!";
      banner.classList.remove("hidden");
      setTimeout(() => banner.classList.add("hidden"), 2200);
      return true;
    }

    function checkArenaEndCondition() {
      if (state.gameState !== "COMBAT") return;
      const player = state.combatants[0];
      const enemiesAlive = state.combatants.slice(1).filter((e) => e.alive).length;

      if (!player.alive) {
        endBattle(false);
      } else if (enemiesAlive === 0) {
        endBattle(true);
      }
    }

    function endBattle(playerWon) {
      resetInputs();
      state.gameState = "FINISHED";
      document.getElementById("target-reticle").classList.add("hidden");

      if (playerWon && state.selectedLevelNumber >= state.unlockedMaxLevel && state.unlockedMaxLevel < 20) {
        state.unlockedMaxLevel = Math.min(20, state.selectedLevelNumber + 1);
      }

      const player = state.combatants[0];
      document.getElementById("finish-modal").classList.remove("hidden");
      document.getElementById("finish-trophy").textContent = playerWon ? "🏆" : "💀";
      document.getElementById("finish-title").textContent = playerWon ? "¡VICTORIA TOTAL V8!" : "¡VEHÍCULO DESTRUIDO!";
      document.getElementById("finish-desc").textContent = playerWon
        ? "Has sobrevivido al Todos Contra Todos y eliminado a todos los rivales de la arena 5X."
        : "Tu blindaje llegó a cero. Repara tu kart en el hangar y vuelve a intentarlo.";
      document.getElementById("finish-time").textContent = formatTime(state.battleTimer);
      document.getElementById("finish-kills").textContent = `${player.kills} Bajas`;

      const nextBtn = document.getElementById("btn-next-level");
      if (playerWon && state.selectedLevelNumber < 20) {
        nextBtn.classList.remove("hidden");
      } else {
        nextBtn.classList.add("hidden");
      }
    }

    function returnToMenu() {
      resetInputs();
      resetEffects();
      document.body.classList.remove('in-combat');
      state.gameState = "MENU";
      worldGroup.visible = false;
      garagePreviewGroup.visible = true;

      document.getElementById("target-reticle").classList.add("hidden");
      document.getElementById("hud-screen").classList.add("hidden");
      document.getElementById("finish-modal").classList.add("hidden");
      document.getElementById("btn-back-menu").classList.add("hidden");
      document.getElementById("menu-screen").classList.remove("hidden");

      renderCupTabsAndLevels();
    }

    function formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

export { startCombatArena, checkArenaEndCondition, endBattle, returnToMenu, formatTime };
