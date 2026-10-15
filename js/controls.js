// controls.js — Vigilante Kart 8 / PS1 Android
import { state, playerCustom, keys } from './state.js';
import { KART_PRESETS } from './config.js';
import { renderer, camera } from './graphics.js';
import { fireSpecialWeapon } from './weapons.js';
import { rebuildGarageKart, renderCupTabsAndLevels } from './hangar.js';
import { exportPlayerKartToGLB } from './export.js';
import { startCombatArena, returnToMenu } from './match.js';

window.addEventListener("keydown", (e) => {
      const code = e.code;
      if (state.gameState !== 'COMBAT') return;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(code)) e.preventDefault();
      if (code === "KeyW" || code === "ArrowUp") keys.forward = true;
      if (code === "KeyS" || code === "ArrowDown") keys.backward = true;
      if (code === "KeyA" || code === "ArrowLeft") keys.left = true;
      if (code === "KeyD" || code === "ArrowRight") keys.right = true;
      if (code === "ShiftLeft" || code === "ShiftRight") keys.drift = true;
      if (code === "KeyF" || code === "KeyZ") keys.fireMG = true;
      if (!e.repeat && (code === "Space" || code === "KeyE") && state.gameState === "COMBAT") {
        const player = state.combatants[0];
        if (player && player.alive) fireSpecialWeapon(player);
      }
    });

    window.addEventListener("keyup", (e) => {
      const code = e.code;
      if (code === "KeyW" || code === "ArrowUp") keys.forward = false;
      if (code === "KeyS" || code === "ArrowDown") keys.backward = false;
      if (code === "KeyA" || code === "ArrowLeft") keys.left = false;
      if (code === "KeyD" || code === "ArrowRight") keys.right = false;
      if (code === "ShiftLeft" || code === "ShiftRight") keys.drift = false;
      if (code === "KeyF" || code === "KeyZ") keys.fireMG = false;
    });

    // Disparar ametralladora con clic en el canvas durante el combate
    renderer.domElement.addEventListener("mousedown", () => {
      if (state.gameState === "COMBAT") keys.fireMG = true;
    });
    window.addEventListener("mouseup", () => {
      keys.fireMG = false;
    });

    function bindTouchButton(id, keyProp) {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.touchAction = 'none';
      const pointers = new Set();
      const clearPointers = () => { pointers.clear(); keys[keyProp] = false; };
      window.addEventListener('blur', clearPointers);
      document.addEventListener('visibilitychange', () => { if (document.hidden) clearPointers(); });
      el.addEventListener('pointerdown', (ev) => {
        if (state.gameState !== 'COMBAT') return;
        ev.preventDefault();
        el.setPointerCapture(ev.pointerId);
        pointers.add(ev.pointerId);
        keys[keyProp] = true;
      });
      for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        el.addEventListener(eventName, (ev) => { pointers.delete(ev.pointerId); keys[keyProp] = pointers.size > 0; });
      }
    }
    window.addEventListener('blur', () => Object.keys(keys).forEach((k) => keys[k] = false));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) Object.keys(keys).forEach((k) => keys[k] = false);
    });

    bindTouchButton("touch-left", "left");
    bindTouchButton("touch-right", "right");
    bindTouchButton("touch-gas", "forward");
    bindTouchButton("touch-brake", "backward");
    bindTouchButton("touch-drift", "drift");
    bindTouchButton("touch-mg", "fireMG");

    document.getElementById("touch-special").addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      const player = state.combatants[0];
      if (player && player.alive && state.gameState === "COMBAT") fireSpecialWeapon(player);
    });

    // Selector de Carrocería Clásica
    document.querySelectorAll(".body-tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        playerCustom.bodyStyle = btn.dataset.body;
        document.querySelectorAll(".body-tab-btn").forEach((b) => {
          b.className = "body-tab-btn py-1.5 px-2 rounded-lg font-kart text-xs border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition";
        });
        btn.className = "body-tab-btn py-1.5 px-2 rounded-lg font-kart text-xs border border-amber-400 bg-amber-500/20 text-white transition";
        rebuildGarageKart();
      });
    });



    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = KART_PRESETS[btn.dataset.preset];
        if (!p) return;
        playerCustom.primary = p.primary;
        playerCustom.secondary = p.secondary;
        playerCustom.rims = p.rims;
        playerCustom.emblem = p.emblem;
        playerCustom.textureId = p.textureId;
        playerCustom.bodyStyle = p.bodyStyle;
        document.getElementById('kart-selected-label').textContent = `${p.name.toUpperCase()} • textura PS1`;
        document.querySelectorAll('.body-tab-btn').forEach((b) => {
          const selected = b.dataset.body === p.bodyStyle;
          b.className = `body-tab-btn py-1.5 px-2 rounded-lg font-kart text-xs border transition ${selected ? 'border-amber-400 bg-amber-500/20 text-white' : 'border-slate-800 bg-slate-900 text-slate-300'}`;
        });

        document.getElementById("kart-color-primary").value = p.primary;
        document.getElementById("label-color-primary").textContent = p.primary.toUpperCase();
        document.getElementById("kart-color-secondary").value = p.secondary;
        document.getElementById("label-color-secondary").textContent = p.secondary.toUpperCase();
        document.getElementById("kart-color-rims").value = p.rims;
        document.getElementById("label-color-rims").textContent = p.rims.toUpperCase();
        document.getElementById("kart-emblem-char").value = p.emblem;

        rebuildGarageKart();
      });
    });

    const bindColorPicker = (inputId, labelId, prop) => {
      const inp = document.getElementById(inputId);
      const lbl = document.getElementById(labelId);
      inp.addEventListener("input", (e) => {
        playerCustom[prop] = e.target.value;
        lbl.textContent = e.target.value.toUpperCase();
        rebuildGarageKart();
      });
    };

    bindColorPicker("kart-color-primary", "label-color-primary", "primary");
    bindColorPicker("kart-color-secondary", "label-color-secondary", "secondary");
    bindColorPicker("kart-color-rims", "label-color-rims", "rims");

    document.getElementById("kart-emblem-char").addEventListener("change", (e) => {
      playerCustom.emblem = e.target.value;
      rebuildGarageKart();
    });

    document.getElementById("kart-tuning-mode").addEventListener("change", (e) => {
      playerCustom.tuning = e.target.value;
    });

    document.getElementById("btn-export-glb-top").onclick = exportPlayerKartToGLB;
    document.getElementById("btn-export-glb-garage").onclick = exportPlayerKartToGLB;

    document.getElementById("btn-unlock-all").onclick = () => {
      state.unlockedMaxLevel = 20;
      renderCupTabsAndLevels();
    };

    document.getElementById("btn-start-race").onclick = startCombatArena;
    document.getElementById('btn-fullscreen').onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else {
          await document.documentElement.requestFullscreen();
          try { await screen.orientation.lock('landscape'); } catch {}
        }
      } catch (error) { console.info('[V8] Pantalla completa no disponible:', error.message); }
    };
    document.getElementById("btn-back-menu").onclick = returnToMenu;
    document.getElementById("btn-retry-level").onclick = startCombatArena;
    document.getElementById("btn-next-level").onclick = () => {
      if (state.selectedLevelNumber < 20) {
        state.selectedLevelNumber++;
        state.selectedCupIndex = Math.floor((state.selectedLevelNumber - 1) / 4);
      }
      startCombatArena();
    };

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
