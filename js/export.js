// export.js — Vigilante Kart 8 / PS1 Android
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { playerCustom } from './state.js';
import { createMarioKartModel } from './karts.js';
import { disposeGroup } from './graphics.js';

function exportPlayerKartToGLB() {
      const cleanKart = createMarioKartModel(playerCustom);
      cleanKart.position.set(0, 0, 0);
      cleanKart.rotation.set(0, 0, 0);
      cleanKart.updateMatrixWorld(true);

      const exporter = new GLTFExporter();
      exporter.parse(
        cleanKart,
        (glbBuffer) => {
          const blob = new Blob([glbBuffer], { type: "model/gltf-binary" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `vigilante8_mario_kart_${playerCustom.bodyStyle}.glb`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          disposeGroup(cleanKart);
        },
        (err) => console.error("Error exportando GLB:", err),
        { binary: true }
      );
    }

export { exportPlayerKartToGLB };
