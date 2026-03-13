import * as THREE from 'three';

/**
 * createCar(scene) — low-poly BU-green campus car
 *
 * Local coordinate system (rotation.y = 0):
 *   forward  = −Z  (matches player/world convention)
 *   up       = +Y
 *   right    = +X
 *
 * Returns an object with:
 *   .group          — THREE.Group added to scene
 *   .wheelGroups    — [FL, FR, RL, RR] wheel groups (spin on .rotation.x)
 *   .frontPivots    — [FL, FR] sub-groups (steer on .rotation.y)
 */
export function createCar(scene) {
  const group = new THREE.Group();

  // ── Materials ──────────────────────────────────────────────────────────────
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x005a31, roughness: 0.45, metalness: 0.25,   // BU green
  });
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x1a7a48, roughness: 0.4, metalness: 0.2,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff, roughness: 0.05, metalness: 0.1,
    transparent: true, opacity: 0.55,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, roughness: 0.9, metalness: 0.05,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xbbbbbb, roughness: 0.4, metalness: 0.7,
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: 0xffffcc, emissiveIntensity: 1.4,
    roughness: 0.1, metalness: 0.1,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff2200, emissive: 0xcc1100, emissiveIntensity: 0.8,
    roughness: 0.1, metalness: 0.1,
  });
  const underMat = new THREE.MeshStandardMaterial({
    color: 0x222222, roughness: 0.9, metalness: 0,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.5, metalness: 0,
  });
  const bumperMat = new THREE.MeshStandardMaterial({
    color: 0x222222, roughness: 0.7, metalness: 0.1,
  });

  // ── Chassis ────────────────────────────────────────────────────────────────
  // Main lower body block
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.72, 5.2), bodyMat);
  chassis.position.set(0, 1.06, 0);
  chassis.castShadow = true;
  group.add(chassis);

  // Underbody (slightly narrower/shorter)
  const under = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.38, 4.8), underMat);
  under.position.set(0, 0.56, 0);
  under.castShadow = false;
  group.add(under);

  // Front bumper
  const fBumper = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.45, 0.28), bumperMat);
  fBumper.position.set(0, 0.82, -2.74);
  fBumper.castShadow = true;
  group.add(fBumper);

  // Rear bumper
  const rBumper = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.45, 0.28), bumperMat);
  rBumper.position.set(0, 0.82, 2.74);
  rBumper.castShadow = true;
  group.add(rBumper);

  // ── Cabin ──────────────────────────────────────────────────────────────────
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.95, 2.9), cabinMat);
  cabin.position.set(0, 1.895, -0.1);
  cabin.castShadow = true;
  group.add(cabin);

  // Windshield (front glass)
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.78, 0.08), glassMat);
  windshield.position.set(0, 1.85, -1.50);
  group.add(windshield);

  // Rear window
  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 0.08), glassMat);
  rearWindow.position.set(0, 1.85, 1.36);
  group.add(rearWindow);

  // Side windows L
  const sideWinL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 2.5), glassMat);
  sideWinL.position.set( 1.31, 1.85, -0.1);
  group.add(sideWinL);

  // Side windows R
  const sideWinR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 2.5), glassMat);
  sideWinR.position.set(-1.31, 1.85, -0.1);
  group.add(sideWinR);

  // White roof stripe (BU accent)
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 2.6), stripeMat);
  stripe.position.set(0, 2.40, -0.05);
  group.add(stripe);

  // ── Headlights ────────────────────────────────────────────────────────────
  const headPositions = [[-0.92, 1.04, -2.66], [0.92, 1.04, -2.66]];
  const headLights = [];
  headPositions.forEach(([x, y, z]) => {
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.28, 0.08), lightMat);
    lens.position.set(x, y, z);
    group.add(lens);

    const pt = new THREE.PointLight(0xfff5cc, 4, 28, 1.8);
    pt.position.set(x, y, z - 0.5);
    group.add(pt);
    headLights.push(pt);
  });

  // ── Tail-lights ────────────────────────────────────────────────────────────
  [[-0.92, 1.04, 2.66], [0.92, 1.04, 2.66]].forEach(([x, y, z]) => {
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.08), tailMat);
    lens.position.set(x, y, z);
    group.add(lens);
  });

  // ── Wheels ────────────────────────────────────────────────────────────────
  // Positions: [side_x, z_from_center]   side_x +ve = left (driver side in LHD)
  const WHEEL_R  = 0.55;
  const WHEEL_W  = 0.38;
  const axleOffX = 1.52;
  const wheelConfigs = [
    // [label, x,  z,  isFront]
    ['FL',  axleOffX, -1.72, true ],
    ['FR', -axleOffX, -1.72, true ],
    ['RL',  axleOffX,  1.72, false],
    ['RR', -axleOffX,  1.72, false],
  ];

  const wheelGroups  = [];
  const frontPivots  = [];

  wheelConfigs.forEach(([label, x, z, isFront]) => {
    // Pivot (for front-wheel steering rotation on Y)
    const pivot = new THREE.Group();
    pivot.position.set(x, WHEEL_R, z);
    group.add(pivot);

    // Spin group (rotates on X for rolling)
    const spinGroup = new THREE.Group();
    pivot.add(spinGroup);

    // Tyre
    const tyre = new THREE.Mesh(
      new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, WHEEL_W, 14),
      wheelMat,
    );
    tyre.rotation.z = Math.PI / 2;
    tyre.castShadow = true;
    spinGroup.add(tyre);

    // Rim disc
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(WHEEL_R * 0.52, WHEEL_R * 0.52, WHEEL_W + 0.02, 8),
      rimMat,
    );
    rim.rotation.z = Math.PI / 2;
    spinGroup.add(rim);

    // Hubcap dot
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.10, 0.10, WHEEL_W + 0.04, 6),
      new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 }),
    );
    hub.rotation.z = Math.PI / 2;
    spinGroup.add(hub);

    wheelGroups.push(spinGroup);
    if (isFront) frontPivots.push(pivot);
  });

  // ── Shadow & cast ──────────────────────────────────────────────────────────
  group.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = false;
    }
  });

  scene.add(group);

  return { group, wheelGroups, frontPivots, headLights };
}
