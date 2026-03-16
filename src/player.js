import * as THREE from 'three';

export function createPlayer(scene) {
  const group = new THREE.Group();

  // Outer glow ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00c978, transparent: true, opacity: 0.25,
  });
  const ring = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;
  group.add(ring);

  // Main body — colored disc
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0x00c978 });
  const body = new THREE.Mesh(new THREE.CircleGeometry(1.3, 20), bodyMat);
  body.rotation.x = -Math.PI / 2;
  body.position.y = 0.12;
  group.add(body);

  // White inner circle (face)
  const faceMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), faceMat);
  face.rotation.x = -Math.PI / 2;
  face.position.y = 0.14;
  group.add(face);

  // Direction indicator — small triangle pointing forward (-z)
  const triShape = new THREE.Shape();
  triShape.moveTo(0, -0.6);
  triShape.lineTo(-0.35, 0.2);
  triShape.lineTo(0.35, 0.2);
  triShape.closePath();
  const triMat = new THREE.MeshBasicMaterial({ color: 0x006747 });
  const tri = new THREE.Mesh(new THREE.ShapeGeometry(triShape), triMat);
  tri.rotation.x = -Math.PI / 2;
  tri.position.y = 0.16;
  group.add(tri);

  // Pulse animation ring (animated in render loop)
  const pulseMat = new THREE.MeshBasicMaterial({
    color: 0x00c978, transparent: true, opacity: 0.0,
  });
  const pulse = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.8, 24), pulseMat);
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.y = 0.06;
  group.add(pulse);
  group._pulse = pulse;
  group._pulseMat = pulseMat;

  group.position.set(0, 0, 0);
  scene.add(group);
  return group;
}
