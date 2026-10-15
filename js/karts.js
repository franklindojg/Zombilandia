// karts.js — Vigilante Kart 8 / PS1 Android
import * as THREE from 'three';
import { gameTexture } from './graphics.js';
import { optimizeKartMeshes } from './mesh-optimizer.js';

function createEmblemTexture(letter = "M", ringColor = "#e11d48") {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(128, 128, 120, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 18;
      ctx.strokeStyle = ringColor;
      ctx.stroke();

      ctx.fillStyle = ringColor;
      ctx.font = "900 150px 'Fredoka', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter, 128, 136);

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return tex;
    }

    /**
     * Mantiene el modelo 3D auténtico de Mario Kart (Standard MK8, Pipe Frame 64, B-Dasher DS)
     * y le integra el paquete de artillería estilo Vigilante 8 (Ametralladoras Gatling laterales
     * y rack lanzamisiles táctico) dentro de una jerarquía limpia exportable a .GLB.
     */
    function createMarioKartModel(cfg) {
      const bodyStyle = cfg.bodyStyle || "standard";
      const emblemChar = cfg.emblem || "M";

      const kartRoot = new THREE.Group();
      kartRoot.name = "Vigilante_MarioKart_Root";

      const suspensionBody = new THREE.Group();
      suspensionBody.name = "Chassis_Suspension_Group";
      kartRoot.add(suspensionBody);

      const paintTex = gameTexture(`cars/${cfg.textureId || 'scarlet'}_paint.png`);
      const matPrimary = new THREE.MeshLambertMaterial({ color: cfg.primary, map: paintTex, flatShading: true });
      const matSecondary = new THREE.MeshLambertMaterial({ color: cfg.secondary, map: gameTexture('cars/armour.png'), flatShading: true });
      const matWhiteStripe = new THREE.MeshLambertMaterial({ color: 0xf2eddb, flatShading: true });
      const matChrome = new THREE.MeshLambertMaterial({ color: 0xd6d2c6, map: gameTexture('cars/steel.png'), flatShading: true });
      const matDarkMetal = new THREE.MeshLambertMaterial({ color: 0x3e4452, map: gameTexture('cars/steel.png'), flatShading: true });
      const matGunMetal = new THREE.MeshLambertMaterial({ color: 0x282d3a, map: gameTexture('cars/steel.png'), flatShading: true });
      const matBlackSeat = new THREE.MeshLambertMaterial({ color: 0x31323b, map: gameTexture('cars/seat.png') });
      const matTireRubber = new THREE.MeshLambertMaterial({ color: 0x303039, map: gameTexture('cars/rubber.png') });
      const matRimGold = new THREE.MeshLambertMaterial({ color: cfg.rims, map: gameTexture('cars/rims.png') });
      const matSkin = new THREE.MeshLambertMaterial({ color: 0xeed2a7, flatShading: true });
      const matEmblem = new THREE.MeshLambertMaterial({
        map: createEmblemTexture(emblemChar, cfg.primary)
      });

      // 1. Suelo y bastidor inferior
      const floorPan = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 3.6), matDarkMetal);
      floorPan.position.set(0, 0.36, 0.05);
      floorPan.castShadow = true;
      suspensionBody.add(floorPan);

      // 2. Defensas tubulares cromadas + Parachoques reforzado V8
      const frontBumperTube = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 2.2, 14), matChrome);
      frontBumperTube.rotation.z = Math.PI / 2;
      frontBumperTube.position.set(0, 0.42, 2.42);
      suspensionBody.add(frontBumperTube);

      [-1.08, 1.08].forEach((xSide) => {
        const cornerSphere = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), matChrome);
        cornerSphere.position.set(xSide, 0.42, 2.42);
        suspensionBody.add(cornerSphere);

        const sideBar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.65, 10), matChrome);
        sideBar.rotation.x = Math.PI / 2;
        sideBar.position.set(xSide, 0.42, 2.08);
        suspensionBody.add(sideBar);
      });

      // Ejes de suspensión hacia las 4 ruedas
      [1.42, -1.32].forEach((zAxle) => {
        const axleBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.85, 12), matDarkMetal);
        axleBeam.rotation.z = Math.PI / 2;
        axleBeam.position.set(0, 0.46, zAxle);
        suspensionBody.add(axleBeam);

        const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 10), matChrome);
        upperArm.rotation.z = Math.PI / 2;
        upperArm.position.set(0, 0.58, zAxle);
        suspensionBody.add(upperArm);
      });

      // 3. Carrocería Mario Kart según el modelo seleccionado
      if (bodyStyle === "standard") {
        const noseBase = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.88, 1.75, 20), matPrimary);
        noseBase.rotation.x = Math.PI / 2 + 0.22;
        noseBase.scale.set(1.15, 1.0, 0.58);
        noseBase.position.set(0, 0.68, 1.48);
        noseBase.castShadow = true;
        suspensionBody.add(noseBase);

        const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.68, 20, 16), matPrimary);
        noseTip.scale.set(1.15, 0.55, 0.85);
        noseTip.position.set(0, 0.52, 2.15);
        suspensionBody.add(noseTip);

        const whiteHoodStripe = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 1.65), matWhiteStripe);
        whiteHoodStripe.position.set(0, 0.82, 1.45);
        whiteHoodStripe.rotation.x = 0.23;
        suspensionBody.add(whiteHoodStripe);

        [-1.12, 1.12].forEach((xPod) => {
          const sidePod = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.75, 16), matPrimary);
          sidePod.rotation.x = Math.PI / 2;
          sidePod.scale.set(0.95, 1.0, 0.82);
          sidePod.position.set(xPod, 0.62, 0.05);
          sidePod.castShadow = true;
          suspensionBody.add(sidePod);

          const podFrontCap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), matWhiteStripe);
          podFrontCap.scale.set(0.95, 0.82, 0.8);
          podFrontCap.position.set(xPod, 0.62, 0.92);
          suspensionBody.add(podFrontCap);

          const podRearCap = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), matSecondary);
          podRearCap.scale.set(0.95, 0.82, 0.8);
          podRearCap.position.set(xPod, 0.62, -0.82);
          suspensionBody.add(podRearCap);
        });

        const sideFairing = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.42, 1.45), matSecondary);
        sideFairing.position.set(0, 0.62, 0.35);
        suspensionBody.add(sideFairing);

      } else if (bodyStyle === "pipeframe") {
        const tubeRadius = 0.095;
        [-0.78, 0.78].forEach((xSide) => {
          const mainRail = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, 3.6, 12), matPrimary);
          mainRail.rotation.x = Math.PI / 2;
          mainRail.position.set(xSide, 0.56, 0.15);
          suspensionBody.add(mainRail);

          const upperRail = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, 1.9, 12), matPrimary);
          upperRail.rotation.x = Math.PI / 2 - 0.15;
          upperRail.position.set(xSide, 0.88, 0.55);
          suspensionBody.add(upperRail);
        });

        const frontHoop = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, 1.56, 12), matPrimary);
        frontHoop.rotation.z = Math.PI / 2;
        frontHoop.position.set(0, 0.88, 1.45);
        suspensionBody.add(frontHoop);

        const nosePlate = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 1.15), matSecondary);
        nosePlate.position.set(0, 0.68, 1.72);
        nosePlate.rotation.x = 0.38;
        suspensionBody.add(nosePlate);

        const rollBar = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.09, 10, 20, Math.PI), matPrimary);
        rollBar.position.set(0, 1.18, -0.78);
        suspensionBody.add(rollBar);

      } else if (bodyStyle === "bdasher") {
        const formulaNose = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.82, 2.35, 20), matWhiteStripe);
        formulaNose.rotation.x = Math.PI / 2 + 0.14;
        formulaNose.scale.set(1.1, 1.0, 0.68);
        formulaNose.position.set(0, 0.68, 1.32);
        formulaNose.castShadow = true;
        suspensionBody.add(formulaNose);

        [-0.24, 0.24].forEach((xStr) => {
          const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 2.1), matPrimary);
          stripe.position.set(xStr, 0.86, 1.25);
          stripe.rotation.x = 0.15;
          suspensionBody.add(stripe);
        });

        const airbox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 1.1), matPrimary);
        airbox.position.set(0, 1.55, -1.05);
        suspensionBody.add(airbox);

        const rearWing = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.14, 0.68), matWhiteStripe);
        rearWing.position.set(0, 1.98, -1.85);
        rearWing.rotation.x = 0.18;
        suspensionBody.add(rearWing);

        [-1.32, 1.32].forEach((xEnd) => {
          const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.78), matPrimary);
          endPlate.position.set(xEnd, 1.92, -1.85);
          suspensionBody.add(endPlate);
        });
      }

      // 4. Escudo frontal con Emblema
      const emblemBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.08, 24), matEmblem);
      emblemBadge.rotation.x = Math.PI / 2 - 0.35;
      emblemBadge.rotation.y = Math.PI / 2;
      emblemBadge.position.set(0, 0.83, 1.62);
      suspensionBody.add(emblemBadge);

      // 5. ARMAMENTO VIGILANTE 8 MONTADO EN EL KART (GATLING LATERALES + TORRETA MISILES)
      const weaponsHardpointGroup = new THREE.Group();
      weaponsHardpointGroup.name = "Vigilante8_Weapons_Group";

      const muzzleFlashes = [];
      [-1.18, 1.18].forEach((xGun) => {
        const gunHousing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28, 0.85), matGunMetal);
        gunHousing.position.set(xGun, 0.96, 0.35);
        weaponsHardpointGroup.add(gunHousing);

        // Cañón rotatorio doble hacia adelante
        const barrelA = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8), matChrome);
        barrelA.rotation.x = Math.PI / 2;
        barrelA.position.set(xGun - 0.06, 0.98, 0.95);

        const barrelB = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.15, 8), matChrome);
        barrelB.rotation.x = Math.PI / 2;
        barrelB.position.set(xGun + 0.06, 0.98, 0.95);
        weaponsHardpointGroup.add(barrelA, barrelB);

        // Fogonazo (Muzzle Flash)
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0 });
        const flashCone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 8), flashMat);
        flashCone.rotation.x = Math.PI / 2;
        flashCone.position.set(xGun, 0.98, 1.68);
        weaponsHardpointGroup.add(flashCone);
        muzzleFlashes.push(flashCone);
      });

      // Lanzador de misiles superior estilo Vigilante 8
      const launcherPod = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.32, 0.72), matGunMetal);
      launcherPod.position.set(0, 1.72, -1.35);
      weaponsHardpointGroup.add(launcherPod);

      [-0.2, 0, 0.2].forEach((xWarhead) => {
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), matPrimary);
        tip.rotation.x = Math.PI / 2;
        tip.position.set(xWarhead, 1.72, -0.92);
        weaponsHardpointGroup.add(tip);
      });

      suspensionBody.add(weaponsHardpointGroup);

      // 6. Asiento, Volante y Motor Trasero con Megáfonos
      const seatBase = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.25, 1.05), matBlackSeat);
      seatBase.position.set(0, 0.52, -0.25);
      suspensionBody.add(seatBase);

      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.98, 0.28), matBlackSeat);
      seatBack.position.set(0, 1.02, -0.68);
      seatBack.rotation.x = -0.22;
      suspensionBody.add(seatBack);

      const steeringShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.05, 10), matDarkMetal);
      steeringShaft.position.set(0, 0.95, 0.75);
      steeringShaft.rotation.x = -0.62;
      suspensionBody.add(steeringShaft);

      const steeringWheelGroup = new THREE.Group();
      steeringWheelGroup.position.set(0, 1.24, 0.38);
      steeringWheelGroup.rotation.x = -0.62;
      const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.055, 10, 20), matBlackSeat);
      const wheelCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12), matPrimary);
      wheelCenter.rotation.x = Math.PI / 2;
      steeringWheelGroup.add(wheelRim, wheelCenter);
      suspensionBody.add(steeringWheelGroup);

      const engineGroup = new THREE.Group();
      engineGroup.position.set(0, 0.85, -1.35);
      const crankCase = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.68, 0.88), matDarkMetal);
      engineGroup.add(crankCase);

      [-0.32, 0.32].forEach((xCyl) => {
        const cylHead = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.55, 14), matChrome);
        cylHead.position.set(xCyl, 0.42, 0.05);
        cylHead.rotation.z = xCyl > 0 ? -0.35 : 0.35;
        engineGroup.add(cylHead);
      });

      const airFilter = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.25, 16), matPrimary);
      airFilter.position.set(0, 0.65, 0.08);
      engineGroup.add(airFilter);
      suspensionBody.add(engineGroup);

      const exhaustFlames = [];
      [-0.58, 0.58].forEach((xPipe) => {
        const pipeGroup = new THREE.Group();
        pipeGroup.position.set(xPipe, 1.08, -1.65);
        pipeGroup.rotation.x = -0.92;
        pipeGroup.rotation.z = xPipe > 0 ? -0.18 : 0.18;

        const megaphoneCone = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.13, 1.38, 18), matChrome);
        megaphoneCone.castShadow = true;
        pipeGroup.add(megaphoneCone);

        const innerMouth = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.12, 0.25, 16), matBlackSeat);
        innerMouth.position.y = 0.58;
        pipeGroup.add(innerMouth);

        const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0 });
        const flameCone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.15, 10), flameMat);
        flameCone.position.y = 1.15;
        pipeGroup.add(flameCone);
        exhaustFlames.push(flameCone);

        suspensionBody.add(pipeGroup);
      });

      // 7. Piloto Estilo Mario Kart
      const driverGroup = new THREE.Group();
      driverGroup.name = "Mario_Style_Driver";

      const shirtTorso = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 14), matPrimary);
      shirtTorso.scale.set(1.05, 1.15, 0.88);
      shirtTorso.position.set(0, 1.08, -0.22);
      driverGroup.add(shirtTorso);

      const overallsChest = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.48, 0.55), matSecondary);
      overallsChest.position.set(0, 0.98, -0.15);
      driverGroup.add(overallsChest);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.68, -0.18);

      const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 16), matSkin);
      headSphere.castShadow = true;
      headGroup.add(headSphere);

      const bigNose = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), matSkin);
      bigNose.scale.set(1.15, 0.9, 1.1);
      bigNose.position.set(0, -0.02, 0.42);
      headGroup.add(bigNose);

      const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.09, 0.12), matBlackSeat);
      mustache.position.set(0, -0.14, 0.38);
      headGroup.add(mustache);

      const capDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.44, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
        matPrimary
      );
      capDome.position.set(0, 0.06, -0.02);
      capDome.rotation.x = -0.18;
      headGroup.add(capDome);

      const capBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 16), matPrimary);
      capBrim.scale.set(1.0, 1.0, 0.72);
      capBrim.position.set(0, 0.14, 0.25);
      capBrim.rotation.x = 0.12;
      headGroup.add(capBrim);

      const capBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 16), matEmblem);
      capBadge.rotation.x = Math.PI / 2 - 0.25;
      capBadge.rotation.y = Math.PI / 2;
      capBadge.position.set(0, 0.28, 0.39);
      headGroup.add(capBadge);

      driverGroup.add(headGroup);

      [-0.36, 0.36].forEach((xArm) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.62, 10), matPrimary);
        arm.position.set(xArm, 1.24, 0.08);
        arm.rotation.x = Math.PI / 2 - 0.25;
        arm.rotation.z = xArm > 0 ? 0.22 : -0.22;
        driverGroup.add(arm);

        const whiteGlove = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 12), matWhiteStripe);
        whiteGlove.position.set(xArm * 0.75, 1.26, 0.36);
        driverGroup.add(whiteGlove);
      });

      suspensionBody.add(driverGroup);

      // 8. Neumáticos Abombados Mario Kart
      const wheelsGroup = new THREE.Group();
      wheelsGroup.name = "Wheels_Group";
      kartRoot.add(wheelsGroup);

      const frontWheelPivots = [];
      const wheelMeshes = [];
      const wheelPivots = [];

      const wheelSpecs = [
        { name: "Wheel_FL", x: -1.42, y: 0.48, z: 1.42, radius: 0.48, width: 0.56, isFront: true },
        { name: "Wheel_FR", x: 1.42, y: 0.48, z: 1.42, radius: 0.48, width: 0.56, isFront: true },
        { name: "Wheel_RL", x: -1.56, y: 0.62, z: -1.32, radius: 0.62, width: 0.82, isFront: false },
        { name: "Wheel_RR", x: 1.56, y: 0.62, z: -1.32, radius: 0.62, width: 0.82, isFront: false }
      ];

      wheelSpecs.forEach((spec) => {
        const pivot = new THREE.Group();
        pivot.name = spec.name + "_Pivot";
        pivot.position.set(spec.x, spec.y, spec.z);

        const wheelAssembly = new THREE.Group();
        const treadGeo = new THREE.CylinderGeometry(spec.radius, spec.radius, spec.width * 0.78, 24);
        treadGeo.rotateZ(Math.PI / 2);
        const treadMesh = new THREE.Mesh(treadGeo, matTireRubber);
        treadMesh.castShadow = true;
        wheelAssembly.add(treadMesh);

        [-spec.width * 0.36, spec.width * 0.36].forEach((sideOffset) => {
          const shoulderTorus = new THREE.Mesh(
            new THREE.TorusGeometry(spec.radius * 0.76, spec.radius * 0.24, 12, 24),
            matTireRubber
          );
          shoulderTorus.rotation.y = Math.PI / 2;
          shoulderTorus.position.x = sideOffset;
          wheelAssembly.add(shoulderTorus);
        });

        const rimCylinder = new THREE.Mesh(
          new THREE.CylinderGeometry(spec.radius * 0.56, spec.radius * 0.56, spec.width * 0.84, 16),
          matRimGold
        );
        rimCylinder.rotation.z = Math.PI / 2;
        wheelAssembly.add(rimCylinder);

        const outerSign = Math.sign(spec.x);
        const centerLockNut = new THREE.Mesh(
          new THREE.CylinderGeometry(spec.radius * 0.22, spec.radius * 0.26, 0.12, 12),
          matPrimary
        );
        centerLockNut.rotation.z = Math.PI / 2;
        centerLockNut.position.x = outerSign * (spec.width * 0.44);
        wheelAssembly.add(centerLockNut);

        pivot.add(wheelAssembly);
        wheelsGroup.add(pivot);
        wheelPivots.push(pivot);

        if (spec.isFront) frontWheelPivots.push(pivot);
        wheelMeshes.push(wheelAssembly);
      });

      // Escudo Domo Energético (cuando activa Escudo Invencible)
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.0
      });
      const shieldDome = new THREE.Mesh(new THREE.SphereGeometry(2.65, 16, 12), shieldMat);
      shieldDome.position.set(0, 1.1, 0);
      kartRoot.add(shieldDome);

      kartRoot.userData = {
        suspensionBody,
        driverGroup,
        headGroup,
        steeringWheelGroup,
        frontWheelPivots,
        wheelMeshes,
        wheelPivots,
        wheelSpecs,
        exhaustFlames,
        muzzleFlashes,
        shieldDome,
        shieldMat
      };

      optimizeKartMeshes(kartRoot);
      return kartRoot;
    }

export { createMarioKartModel };
