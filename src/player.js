import * as THREE from 'three';

export function createPlayer(scene) {
  const group = new THREE.Group();

  const bodyMat  = new THREE.MeshStandardMaterial({ color: 0xff5520, roughness: 0.6, metalness: 0.05 });
  const headMat  = new THREE.MeshStandardMaterial({ color: 0xf0c080, roughness: 0.7, metalness: 0 });
  const frontMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0 });

  // Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.2, 10), bodyMat);
  body.position.y = 1.1;
  body.castShadow = true;
  group.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 10, 8), headMat);
  head.position.y = 2.9;
  head.castShadow = true;
  group.add(head);

  // Small white dot on chest — indicates which way the player faces
  const front = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 4), frontMat);
  front.position.set(0, 1.4, -0.62);
  group.add(front);

  group.position.set(0, 0, 0);
  scene.add(group);
  return group;
}
