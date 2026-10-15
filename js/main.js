import * as THREE from 'three';
import { state } from './state.js';
import { scene, camera, renderer, dirLight, IS_ANDROID_LIKE } from './graphics.js';
import { updateArenaInteractions } from './weapons.js';
import { drawCombatRadar, updateReticleAndEnemyList } from './hud.js';
import { rebuildGarageKart, renderCupTabsAndLevels } from './hangar.js';
import { formatTime } from './match.js';
import { getTerrainHeight } from './arena.js';
import { wasmPhysics, initializeWasmPhysics } from './wasm-physics.js';
import { FixedSimulation } from './simulation.js';
import { quality, chooseQuality, sampleQuality } from './quality.js';
import { emitKartEffects, updateEffects, faceEffectsToCamera } from './effects.js';
import { updateArenaSky } from './sky.js';
import './controls.js';

const simulation = new FixedSimulation();
const camForward = new THREE.Vector3(), desiredCamera = new THREE.Vector3(), lookTarget = new THREE.Vector3();
const hud = Object.fromEntries(['hp-text','hp-bar','enemies-alive','kills','timer','speed','speed-bar','drift-bar','grip-val']
  .map(name => [name, document.getElementById('hud-' + name)]));
const setText = (name, value) => { if (hud[name].textContent !== String(value)) hud[name].textContent = value; };
let lastTime = performance.now(), lastRender = lastTime, renderElapsed = 1;
let lastHud = 0, lastRadar = 0, lastState = state.gameState;
let fpsFrames = 0, fpsLast = lastTime, measuredFps = 0;
const DEBUG = new URLSearchParams(location.search).has('debug');

function applyResolution() {
  renderer.setPixelRatio(quality.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
}
const qualitySelect = document.getElementById('quality-mode');
qualitySelect.value = quality.mode;
qualitySelect.addEventListener('change', () => { chooseQuality(qualitySelect.value); applyResolution(); });

document.addEventListener('visibilitychange', () => {
  simulation.reset(); renderElapsed = 0; lastTime = lastRender = performance.now();
  fpsFrames = 0; fpsLast = lastTime;
});

function animate(now = performance.now()) {
  requestAnimationFrame(animate);
  const elapsed = Math.max(0, (now - lastTime) / 1000);
  lastTime = now;
  if (document.hidden) { simulation.reset(); renderElapsed = 0; return; }
  if (state.gameState !== lastState) {
    simulation.reset(); lastState = state.gameState; renderElapsed = 1;
  }
  let alpha = 1;
  if (state.gameState === 'COMBAT') {
    alpha = simulation.advance(elapsed, dt => {
      if (state.gameState !== 'COMBAT') return;
      state.battleTimer += dt;
      for (const kart of state.combatants) kart.updateCombatPhysics(dt, state.activeArena);
      updateArenaInteractions(dt);
    });
  }
  renderElapsed += elapsed;
  const renderInterval = 1 / (state.gameState === 'MENU' ? Math.min(30, quality.targetFps) : quality.targetFps);
  if (renderElapsed + 1e-6 < renderInterval) return;
  renderElapsed = renderElapsed % renderInterval;
  const visualDt = Math.min((now - lastRender) / 1000, 0.1);
  lastRender = now;

  if (state.gameState === 'MENU') {
    if (state.garageKartMesh) {
      state.garageKartMesh.rotation.y += visualDt * 0.65;
      state.garageKartMesh.userData.wheelMeshes.forEach(wheel => { wheel.rotation.x += visualDt * 2.5; });
    }
    camera.position.set(0, 2.85, 7.2);
    camera.lookAt(0, 0.85, 0);
  } else if (state.activeArena && state.combatants.length) {
    const player = state.combatants[0];
    for (const kart of state.combatants) {
      kart.syncVisual(state.gameState === 'COMBAT' && kart.alive ? alpha : 1);
    }
    camForward.set(Math.sin(player.heading), 0, Math.cos(player.heading));
    desiredCamera.copy(player.mesh.position).addScaledVector(camForward, -12.5);
    desiredCamera.y += 5.5;
    desiredCamera.y = Math.max(desiredCamera.y, getTerrainHeight(desiredCamera.x, desiredCamera.z,
      state.activeArena.arenaRadius, state.activeArena.heightAmp) + 3);
    camera.position.lerp(desiredCamera, 1 - Math.exp(-visualDt * 10));
    lookTarget.copy(player.mesh.position).addScaledVector(camForward, 10);
    lookTarget.y += 1.5;
    camera.lookAt(lookTarget);
    if (state.gameState === 'COMBAT') {
      for (const kart of state.combatants) emitKartEffects(kart, visualDt, state.activeArena.cupData.biomeKey);
    }
    if (!IS_ANDROID_LIKE) {
      dirLight.position.set(player.position.x + 120, player.position.y + 260, player.position.z + 120);
      dirLight.target.position.copy(player.position);
      dirLight.target.updateMatrixWorld();
    }
    if (now - lastHud >= 100) {
      lastHud = now;
      const hp = Math.max(0, Math.round(player.hp / player.maxHp * 100));
      const speed = Math.round(player.velocity.length() * 2.4);
      setText('hp-text', `${Math.ceil(player.hp)} / ${player.maxHp}`);
      hud['hp-bar'].style.width = `${hp}%`;
      hud['hp-bar'].style.backgroundColor = hp > 50 ? '#10b981' : hp > 25 ? '#f59e0b' : '#dc2626';
      setText('enemies-alive', `${state.combatants.slice(1).filter(k => k.alive).length} RIVALES`);
      setText('kills', `${player.kills} 💥`);
      setText('timer', formatTime(state.battleTimer));
      setText('speed', speed);
      hud['speed-bar'].style.width = `${Math.min(100, speed / 250 * 100)}%`;
      hud['drift-bar'].style.width = `${player.driftCharge}%`;
      setText('grip-val', `Agarre ${Math.round(player.currentGrip * 100)}%`);
    }
    if (state.gameState === 'COMBAT') {
      if (now - lastRadar >= 125) { drawCombatRadar(); lastRadar = now; }
      updateReticleAndEnemyList(player);
    }
  }
  updateEffects(visualDt);
  faceEffectsToCamera();
  updateArenaSky(camera);
  renderer.render(scene, camera);
  fpsFrames++;
  if (now - fpsLast >= 3000) {
    measuredFps = Math.round(fpsFrames * 1000 / (now - fpsLast));
    fpsFrames = 0; fpsLast = now;
    if (state.gameState === 'COMBAT' && sampleQuality(measuredFps)) applyResolution();
  }
}

if (DEBUG) {
  const debug = document.createElement('div');
  debug.style.cssText = 'position:fixed;left:8px;top:50px;z-index:90;color:#6affb1;background:#111c;padding:5px;font:11px monospace;pointer-events:none';
  document.body.appendChild(debug);
  setInterval(() => {
    debug.textContent = `FPS ${measuredFps}/${quality.targetFps} | Física ${wasmPhysics.status} · 60 Hz | DPR ${quality.pixelRatio.toFixed(2)} | Draw ${renderer.info.render.calls} | Tri ${renderer.info.render.triangles} | Tex ${renderer.info.memory.textures}`;
  }, 1000);
}
window.addEventListener('error', event => {
  console.error('[V8]', event.error || event.message);
  if (!DEBUG) return;
  const box = document.getElementById('v8-error-box') || document.createElement('div');
  box.id = 'v8-error-box';
  box.style.cssText = 'position:fixed;z-index:200;left:8px;bottom:8px;padding:8px;background:#580b0bdd;color:white;font:12px monospace';
  box.textContent = 'ERROR: ' + (event.error?.message || event.message);
  document.body.appendChild(box);
});
initializeWasmPhysics();
rebuildGarageKart();
renderCupTabsAndLevels();
animate();
