import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Agrupar piezas estáticas con el mismo material manteniendo cada grupo animado.
export function optimizeKartMeshes(root) {
  const dynamic = new Set([root.userData.shieldDome,
    ...root.userData.exhaustFlames, ...root.userData.muzzleFlashes]);
  const groups = [];
  root.traverse(node => { if (!node.isMesh && node.children.length) groups.push(node); });
  for (const parent of groups) {
    const buckets = new Map();
    for (const mesh of parent.children) {
      if (!mesh.isMesh || dynamic.has(mesh) || Array.isArray(mesh.material)) continue;
      if (!buckets.has(mesh.material)) buckets.set(mesh.material, []);
      buckets.get(mesh.material).push(mesh);
    }
    for (const [material, meshes] of buckets) {
      if (meshes.length < 2) continue;
      const copies = meshes.map(mesh => {
        mesh.updateMatrix();
        const copy = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
        return copy.applyMatrix4(mesh.matrix);
      });
      const geometry = mergeGeometries(copies, false);
      copies.forEach(copy => copy.dispose());
      if (!geometry) continue;
      const merged = new THREE.Mesh(geometry, material);
      merged.name = 'Piezas_agrupadas';
      merged.castShadow = meshes.some(mesh => mesh.castShadow);
      merged.receiveShadow = meshes.some(mesh => mesh.receiveShadow);
      parent.add(merged);
      for (const mesh of meshes) { parent.remove(mesh); mesh.geometry.dispose(); }
    }
  }
}
