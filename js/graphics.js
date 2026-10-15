// graphics.js — Vigilante Kart 8 / PS1 Android
import * as THREE from 'three';
import { IS_MOBILE, quality } from './quality.js';

const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f172a");
    scene.fog = new THREE.FogExp2("#0f172a", 0.00065);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 4500);
    const IS_ANDROID_LIKE = IS_MOBILE;
    const renderer = new THREE.WebGLRenderer({ antialias: !IS_ANDROID_LIKE, powerPreference: "high-performance" });
    renderer.setPixelRatio(quality.pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // En Android se desactivan los shadow maps: sombras del juego con sprites PNG.
    renderer.shadowMap.enabled = !IS_ANDROID_LIKE;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.6);
    dirLight.position.set(180, 340, 160);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = IS_ANDROID_LIKE ? 512 : 1024;
    dirLight.shadow.mapSize.height = IS_ANDROID_LIKE ? 512 : 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 1400;
    const dCam = 320;
    dirLight.shadow.camera.left = -dCam;
    dirLight.shadow.camera.right = dCam;
    dirLight.shadow.camera.top = dCam;
    dirLight.shadow.camera.bottom = -dCam;
    scene.add(dirLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    const garagePreviewGroup = new THREE.Group();
    scene.add(garagePreviewGroup);

    // ASSETS PS1: se cargan una vez y se reutilizan entre todas las arenas.
    const textureLoader = new THREE.TextureLoader();
    const GAME_TEXTURE_CACHE = new Map();
    const SHARED_GEOMETRIES = new Set();
    const SHARED_MATERIALS = new Set();
    const poolProjectiles = new Map();
    const projectileTemplates = new Map();
    const poolExplosions = [];
    function gameTexture(relativeName, repeatX = 1, repeatY = repeatX) {
      const key = `${relativeName}|${repeatX}|${repeatY}`;
      if (GAME_TEXTURE_CACHE.has(key)) return GAME_TEXTURE_CACHE.get(key);
      const tex = textureLoader.load(`./assets/${relativeName}`, undefined, undefined,
        (error) => console.warn('No se pudo cargar asset:', relativeName, error));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestMipmapNearestFilter;
      tex.anisotropy = 1;
      if (repeatX !== 1 || repeatY !== 1) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
      }
      GAME_TEXTURE_CACHE.set(key, tex);
      return tex;
    }
    const cachedTextureValues = () => new Set(GAME_TEXTURE_CACHE.values());
    function disposeGroup(group) {
      const permanentTextures = cachedTextureValues();
      const geometries = new Set(), materials = new Set();
      group.traverse((object) => {
        if (!object.isMesh && !object.isSprite && !object.isInstancedMesh) return;
        if (object.geometry && !SHARED_GEOMETRIES.has(object.geometry)) geometries.add(object.geometry);
        const mats = Array.isArray(object.material) ? object.material : [object.material];
        mats.forEach((mat) => { if (mat && !SHARED_MATERIALS.has(mat)) materials.add(mat); });
      });
      geometries.forEach((geo) => geo.dispose());
      materials.forEach((mat) => {
        for (const prop of ['map','alphaMap','normalMap','roughnessMap','metalnessMap','emissiveMap']) {
          if (mat[prop] && !permanentTextures.has(mat[prop])) mat[prop].dispose();
        }
        mat.dispose();
      });
      group.clear();
    }
    const shadowGeometry = new THREE.PlaneGeometry(1, 1);
    SHARED_GEOMETRIES.add(shadowGeometry);
    function createKartShadow() {
      const shadowMat = new THREE.MeshBasicMaterial({
        map: gameTexture('effects/kart_shadow.png'), transparent: true,
        depthWrite: false, opacity: 0.95, polygonOffset: true, polygonOffsetFactor: -1,
        toneMapped: false
      });
      const shadow = new THREE.Mesh(shadowGeometry, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.scale.set(5.9, 8.2, 1);
      shadow.renderOrder = 2;
      worldGroup.add(shadow);
      return shadow;
    }
    function acquireProjectile(key, color, radius = 1) {
      let stack = poolProjectiles.get(key);
      if (!stack) { stack = []; poolProjectiles.set(key, stack); }
      const available = stack.pop();
      if (available) { available.visible = true; available.scale.setScalar(1); available.rotation.set(0, 0, 0); return available; }
      if (projectileTemplates.has(key)) {
        const template = projectileTemplates.get(key);
        const mesh = new THREE.Mesh(template.geometry, template.material);
        mesh.userData.projectileKey = key;
        return mesh;
      }
      let mesh;
      if (key === 'mg_bullet') {
        const geo = new THREE.BoxGeometry(0.22, 0.22, 2.2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        SHARED_GEOMETRIES.add(geo); SHARED_MATERIALS.add(mat);
        mesh = new THREE.Mesh(geo, mat);
      } else if (key === 'mine') {
        const geo = new THREE.CylinderGeometry(1.6, 1.8, 0.65, 8);
        const mat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
        SHARED_GEOMETRIES.add(geo); SHARED_MATERIALS.add(mat);
        mesh = new THREE.Mesh(geo, mat);
      } else {
        const geo = new THREE.SphereGeometry(radius, 8, 6);
        const mat = new THREE.MeshBasicMaterial({ color });
        SHARED_GEOMETRIES.add(geo); SHARED_MATERIALS.add(mat);
        mesh = new THREE.Mesh(geo, mat);
      }
      mesh.userData.projectileKey = key;
      projectileTemplates.set(key, { geometry: mesh.geometry, material: mesh.material });
      return mesh;
    }
    function releaseProjectile(p) {
      worldGroup.remove(p.mesh);
      p.mesh.visible = false;
      const key = p.mesh.userData.projectileKey;
      const stack = poolProjectiles.get(key);
      if (stack && stack.length < 96) stack.push(p.mesh);
    }
    function acquireExplosion() {
      if (poolExplosions.length) return poolExplosions.pop();
      const mat = new THREE.SpriteMaterial({
        map: gameTexture('effects/explosion.png'), color: 0xffffff,
        transparent: true, depthWrite: false, opacity: 1,
        blending: THREE.AdditiveBlending
      });
      const mesh = new THREE.Sprite(mat);
      SHARED_MATERIALS.add(mat);
      return { mesh, mat, life: 0, scale: 0, maxScale: 0 };
    }

export { scene, camera, renderer, ambientLight, dirLight, worldGroup, garagePreviewGroup, IS_ANDROID_LIKE,
 GAME_TEXTURE_CACHE, SHARED_GEOMETRIES, SHARED_MATERIALS, shadowGeometry,
 gameTexture, disposeGroup, createKartShadow, acquireProjectile, releaseProjectile, acquireExplosion, poolExplosions };
