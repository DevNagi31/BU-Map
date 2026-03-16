import * as THREE from 'three';
import { processBuildings, TYPE_COLORS, TYPE_LABELS } from './geo.js';
import { CONNECTOR_ROAD_POINTS, CAMPUS_LAWN_POINTS } from './buildings.js';
import { createControls } from './controls.js';
import { createPlayer } from './player.js';
import { ROOMS, FLOOR_INFO, parseRoomQuery } from './rooms.js';

// ─── Renderer ────────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

// ─── Scene ───────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2a1a);

// ─── Camera (Orthographic for 2.5D) ─────────────────────────────────────────
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 3000);

// ─── Lights ──────────────────────────────────────────────────────────────────
const hemi = new THREE.HemisphereLight(0xd0e8ff, 0x2a4a18, 1.0);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff4e0, 4.0);
sun.position.set(150, 300, 80);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 1200;
sun.shadow.camera.left = -500;
sun.shadow.camera.right = 500;
sun.shadow.camera.top = 500;
sun.shadow.camera.bottom = -500;
sun.shadow.bias = -0.0004;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x8ab8e8, 0.4);
fill.position.set(-100, 70, -140);
scene.add(fill);

// ─── Ground ──────────────────────────────────────────────────────────────────
{
  // Main ground — muted green
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a6830, roughness: 0.95, metalness: 0 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2800, 2400), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(-30, 0, -45);
  ground.receiveShadow = true;
  scene.add(ground);
}

// ─── Campus lawn (inner oval) ────────────────────────────────────────────────
function makeShapeMesh(pts, mat, y = 0.01) {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

const lawnMat = new THREE.MeshStandardMaterial({ color: 0x4a8838, roughness: 0.9, metalness: 0 });
makeShapeMesh(CAMPUS_LAWN_POINTS, lawnMat, 0.02);

// ─── Road / walkway materials ────────────────────────────────────────────────
const roadMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.95, metalness: 0 });
const walkMat = new THREE.MeshStandardMaterial({ color: 0x9a9088, roughness: 0.88, metalness: 0 });

function planeSeg(x1, z1, x2, z2, w, mat, y) {
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const len = Math.hypot(x2 - x1, z2 - z1);
  if (len < 0.5) return;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), mat);
  m.rotation.order = 'YXZ';
  m.rotation.y = Math.atan2(x2 - x1, z2 - z1);
  m.rotation.x = -Math.PI / 2;
  m.position.set(cx, y, cz);
  m.receiveShadow = true;
  scene.add(m);
}
const rs = (x1, z1, x2, z2, w) => planeSeg(x1, z1, x2, z2, w, roadMat, 0.03);
const ws = (x1, z1, x2, z2, w) => planeSeg(x1, z1, x2, z2, w, walkMat, 0.025);

// ─── Road data (GPS-accurate from OSM) ──────────────────────────────────────
// Store for pathfinding graph
const ROAD_SEGS = [];
const WALK_SEGS = [];
function road(x1, z1, x2, z2, w = 7) { rs(x1, z1, x2, z2, w); ROAD_SEGS.push([x1, z1, x2, z2]); }
function walk(x1, z1, x2, z2, w = 3) { ws(x1, z1, x2, z2, w); WALK_SEGS.push([x1, z1, x2, z2]); }

// West Drive
road(-145, -30, -148, -56);
road(-148, -56, -128, -121);
road(-128, -121, -102, -152);
road(-102, -152, -18, -184);
road(-18, -184, -108, -150);
road(-108, -150, -134, -126);
road(-134, -126, -145, -30);

// South arc
road(-145, -30, -106, 14);
road(-106, 14, -37, 43);
road(-37, 43, -4, 50);
road(-4, 50, 20, 53);
road(20, 53, 74, 47);
road(74, 47, 140, 42);

// East connector
road(140, 42, 116, -83);

// Bartle Drive
road(116, -83, 92, -121);
road(92, -121, 72, -139);
road(72, -139, 48, -168);
road(48, -168, 20, -205);
road(20, -205, 30, -259);
road(30, -259, 55, -292);
road(55, -292, 64, -347);
road(64, -347, 70, -372);

// Bearcat Boulevard
road(-183, -175, -94, -186);
road(-94, -186, -80, -186);
road(-80, -186, -37, -180);
road(-37, -180, -18, -184);
road(-80, -186, -71, -167, 5);
road(-18, -184, 48, -168);

// Recreation Drive
road(48, -168, 65, -184);
road(65, -184, 130, -179);
road(130, -179, 160, -161);
road(160, -161, 203, -228);

// Bunn Hill Access
road(-237, -306, -214, -246);
road(-214, -246, -202, -209);
road(-202, -209, -189, -184);
road(-189, -184, -183, -175);

// Walkways
walk(-135, -3, 105, -3, 4);  // DeFleur Walkway (spine)
walk(81, -3, 109, -3, 3);
walk(105, -3, 105, 15, 3);
walk(12, 12, 12, 42, 3);      // Library ↔ Engineering
walk(-130, -20, -60, -20, 3); // AA–LH area
walk(-52, -3, -52, -193, 3);  // Sciences N-S
walk(-97, -105, -47, -105, 3);// Sciences E-W
walk(22, -25, 22, -101, 3);   // Anderson/Fine Arts
walk(-34, 117, 26, 117, 3);   // South residential

// ─── Academic podium ─────────────────────────────────────────────────────────
{
  const podiumMat = new THREE.MeshStandardMaterial({ color: 0x8a8078, roughness: 0.9, metalness: 0.02 });
  const podium = new THREE.Mesh(new THREE.PlaneGeometry(210, 186), podiumMat);
  podium.rotation.x = -Math.PI / 2;
  podium.position.set(-42, 0.02, -66);
  podium.receiveShadow = true;
  scene.add(podium);
}

// ─── Nature preserve ─────────────────────────────────────────────────────────
makeShapeMesh(
  [[-450, 174], [360, 174], [360, 270], [-450, 270]],
  new THREE.MeshStandardMaterial({ color: 0x2a5820, roughness: 0.95, metalness: 0 }),
  0.01
);

// ─── Pond ────────────────────────────────────────────────────────────────────
{
  const bankMat = new THREE.MeshStandardMaterial({ color: 0x507840, roughness: 0.9, metalness: 0 });
  const pondMat = new THREE.MeshStandardMaterial({ color: 0x2a6888, roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.85 });
  const bank = new THREE.Mesh(new THREE.CircleGeometry(10, 24), bankMat);
  bank.rotation.x = -Math.PI / 2; bank.position.set(24, 0.04, -24); scene.add(bank);
  const water = new THREE.Mesh(new THREE.CircleGeometry(8, 24), pondMat);
  water.rotation.x = -Math.PI / 2; water.position.set(24, 0.06, -24); scene.add(water);
}

// ─── Building rendering (simplified for 2.5D) ───────────────────────────────
const buildingMeshes = [];

// Muted, clean type colors for 2.5D
const FLAT_COLORS = {
  academic:         0xc87060,
  residential:      0xa06848,
  athletics:        0x708090,
  student_services: 0xd08060,
  library:          0x888480,
  utility:          0x787470,
};

processBuildings().forEach((b) => {
  const { minX, maxX, minZ, maxZ } = b.bounds;
  const bw = maxX - minX;
  const bd = maxZ - minZ;

  // Height: flatten for 2.5D view (25% of original)
  const h = Math.max(1.5, b.h * 0.22);
  const floors = Math.max(1, Math.round(b.h / 4));

  const baseColor = b.color != null ? b.color : (FLAT_COLORS[b.type] || 0x888888);
  const wallMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: 0.78,
    metalness: 0.04,
  });

  // Roof is slightly lighter
  const roofColor = new THREE.Color(baseColor).lerp(new THREE.Color(0xe0dcd6), 0.25);
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7, metalness: 0.02 });

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(bw, h, bd), wallMat);
  body.position.set(b.cx, h / 2, b.cz);
  body.castShadow = true;
  body.receiveShadow = true;
  scene.add(body);

  // Roof surface
  const roof = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.3, 0.15, bd - 0.3), roofMat);
  roof.position.set(b.cx, h + 0.075, b.cz);
  scene.add(roof);

  // Edge outline on top face for readability
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(bw, h, bd));
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
    color: 0x000000, transparent: true, opacity: 0.12,
  }));
  line.position.set(b.cx, h / 2, b.cz);
  scene.add(line);

  // Building label (sprite)
  const label = makeLabel(b.code, b.label, b.type);
  label.position.set(b.cx, h + 3, b.cz);
  scene.add(label);

  buildingMeshes.push({
    body,
    building: {
      code: b.code,
      name: b.name,
      type: b.type,
      address: `${b.code} — ${b.name}`,
      floors,
      description: b.desc,
      cx: b.cx,
      cz: b.cz,
      bounds: b.bounds,
    },
    originalMat: wallMat,
  });
});

// ─── Building label helper ───────────────────────────────────────────────────
const LABEL_HEX = {
  academic:         '#ffd8a0',
  residential:      '#a8d0ff',
  athletics:        '#b8ffb0',
  student_services: '#ffc080',
  library:          '#d0b8ff',
  utility:          '#cccccc',
};

function makeLabel(code, name, type) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const accent = LABEL_HEX[type] || '#ffffff';

  // Background pill
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  const rx = 10;
  ctx.beginPath();
  ctx.roundRect(2, 2, canvas.width - 4, canvas.height - 4, rx);
  ctx.fill();

  // Building code
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent;
  ctx.font = 'bold 24px Inter, Arial, sans-serif';
  ctx.fillText(code, canvas.width / 2, canvas.height / 2 - 6);

  // Name (small, below)
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '12px Inter, Arial, sans-serif';
  let sub = name;
  while (ctx.measureText(sub).width > canvas.width - 16 && sub.length > 4) sub = sub.slice(0, -1);
  if (sub !== name) sub = sub.trimEnd() + '…';
  ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 14);

  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  );
  sprite.scale.set(14, 3.5, 1);
  return sprite;
}

function getBuildingMat(type, highlight = false) {
  const c = new THREE.Color(FLAT_COLORS[type] || 0x888888);
  if (highlight) { c.multiplyScalar(1.3); }
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.7,
    metalness: 0.04,
    emissive: highlight ? c.clone().multiplyScalar(0.15) : new THREE.Color(0x000000),
  });
}

// ─── Simplified trees (small green circles) ──────────────────────────────────
{
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x2d6e1a, roughness: 0.9, metalness: 0 });
  const treeMat2 = new THREE.MeshStandardMaterial({ color: 0x3a8025, roughness: 0.9, metalness: 0 });
  const pineMat = new THREE.MeshStandardMaterial({ color: 0x1a4a14, roughness: 0.9, metalness: 0 });

  function tree(x, z, r = 2.0) {
    const rng = Math.abs(Math.sin(x * 127.1 + z * 311.7) * 43758.5) % 1;
    const mat = rng > 0.5 ? treeMat : treeMat2;
    const s = r * (0.8 + rng * 0.4);
    const m = new THREE.Mesh(new THREE.CircleGeometry(s, 10), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.08, z);
    scene.add(m);
  }

  function pine(x, z, r = 1.8) {
    const rng = Math.abs(Math.sin(x * 89.3 + z * 197.1) * 43758.5) % 1;
    const s = r * (0.85 + rng * 0.3);
    const m = new THREE.Mesh(new THREE.CircleGeometry(s, 8), pineMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.07, z);
    scene.add(m);
  }

  // Along Bartle Drive
  for (let z = -285; z < 30; z += 30) { tree(-5, z); tree(5, z); }
  // South E-W road
  for (let x = -225; x <= 225; x += 30) { tree(x, 30); tree(x, 60); }
  // North athletics
  [[-165,-240],[-135,-255],[-90,-255],[105,-234],[135,-246],[174,-234]].forEach(([x,z]) => tree(x,z));
  // Preserve edge
  for (let x = -240; x <= 180; x += 21) tree(x + ((Math.abs(x)%3)-1), 132, 2.2);
  for (let x = -240; x <= 180; x += 18) tree(x + ((Math.abs(x)%5)-2), 150, 2.4);
  // Dense preserve pines
  for (let x = -210; x <= 150; x += 26) pine(x + ((Math.abs(x)%5)-2), 185, 2.0);
  for (let x = -190; x <= 130; x += 22) pine(x + ((Math.abs(x)%3)-1), 215, 2.2);
  for (let x = -170; x <= 110; x += 30) pine(x, 250, 2.5);
  // CIW / Hinman
  [[-195,0],[-195,24],[-195,48],[-195,72],[-165,96],[-135,108]].forEach(([x,z]) => tree(x,z));
  // Mountainview
  [[-75,126],[-15,126],[30,126],[60,114]].forEach(([x,z]) => tree(x,z));
  // Scattered
  [[-165,-135],[-165,-90],[90,-135],[90,-90],[144,-30],[144,-60]].forEach(([x,z]) => tree(x,z));
  // Newing
  [[-330,12],[-345,36],[-360,0],[-330,48]].forEach(([x,z]) => tree(x,z,1.8));
  // Pond surroundings
  [[6,-12],[12,-42],[42,-12],[42,-42]].forEach(([x,z]) => tree(x,z,1.5));
}

// ─── Pathfinding graph ───────────────────────────────────────────────────────
const graphNodes = new Map(); // key: "x,z" → {x, z, edges: [{to, weight}]}

function nodeKey(x, z) { return `${Math.round(x)},${Math.round(z)}`; }

function addNode(x, z) {
  const k = nodeKey(x, z);
  if (!graphNodes.has(k)) graphNodes.set(k, { x, z, edges: [] });
  return k;
}

function addEdge(k1, k2) {
  const n1 = graphNodes.get(k1), n2 = graphNodes.get(k2);
  const w = Math.hypot(n2.x - n1.x, n2.z - n1.z);
  n1.edges.push({ to: k2, weight: w });
  n2.edges.push({ to: k1, weight: w });
}

// Build graph from road + walk segments
[...ROAD_SEGS, ...WALK_SEGS].forEach(([x1, z1, x2, z2]) => {
  const k1 = addNode(x1, z1);
  const k2 = addNode(x2, z2);
  addEdge(k1, k2);
});

// Connect each building to nearest graph node
buildingMeshes.forEach(({ building }) => {
  const bk = addNode(building.cx, building.cz);
  let bestK = null, bestD = Infinity;
  graphNodes.forEach((n, k) => {
    if (k === bk) return;
    const d = Math.hypot(n.x - building.cx, n.z - building.cz);
    if (d < bestD) { bestD = d; bestK = k; }
  });
  if (bestK && bestD < 100) addEdge(bk, bestK);
});

// A* pathfinding
function findPath(startX, startZ, endX, endZ) {
  const sk = addNode(startX, startZ);
  const ek = addNode(endX, endZ);

  // Temp edges from start/end to nearest nodes
  const tempEdges = [];
  [sk, ek].forEach(key => {
    const n = graphNodes.get(key);
    if (n.edges.length === 0) {
      let bestK = null, bestD = Infinity;
      graphNodes.forEach((nn, k) => {
        if (k === key) return;
        const d = Math.hypot(nn.x - n.x, nn.z - n.z);
        if (d < bestD) { bestD = d; bestK = k; }
      });
      if (bestK) {
        addEdge(key, bestK);
        tempEdges.push([key, bestK]);
      }
    }
  });

  // A*
  const openSet = new Set([sk]);
  const gScore = new Map([[sk, 0]]);
  const fScore = new Map([[sk, heuristic(sk, ek)]]);
  const cameFrom = new Map();

  function heuristic(a, b) {
    const na = graphNodes.get(a), nb = graphNodes.get(b);
    return Math.hypot(nb.x - na.x, nb.z - na.z);
  }

  while (openSet.size > 0) {
    let current = null, bestF = Infinity;
    openSet.forEach(k => { const f = fScore.get(k) ?? Infinity; if (f < bestF) { bestF = f; current = k; } });

    if (current === ek) {
      // Reconstruct path
      const path = [];
      let c = current;
      while (c) { const n = graphNodes.get(c); path.unshift({ x: n.x, z: n.z }); c = cameFrom.get(c); }
      // Cleanup temp edges
      tempEdges.forEach(([k1, k2]) => {
        const n1 = graphNodes.get(k1), n2 = graphNodes.get(k2);
        n1.edges = n1.edges.filter(e => e.to !== k2);
        n2.edges = n2.edges.filter(e => e.to !== k1);
      });
      return path;
    }

    openSet.delete(current);
    const cn = graphNodes.get(current);
    for (const { to, weight } of cn.edges) {
      const tentG = (gScore.get(current) ?? Infinity) + weight;
      if (tentG < (gScore.get(to) ?? Infinity)) {
        cameFrom.set(to, current);
        gScore.set(to, tentG);
        fScore.set(to, tentG + heuristic(to, ek));
        openSet.add(to);
      }
    }
  }

  // Cleanup temp edges
  tempEdges.forEach(([k1, k2]) => {
    const n1 = graphNodes.get(k1), n2 = graphNodes.get(k2);
    n1.edges = n1.edges.filter(e => e.to !== k2);
    n2.edges = n2.edges.filter(e => e.to !== k1);
  });

  return null; // no path found
}

// ─── Route visualization ─────────────────────────────────────────────────────
let routeLine = null;
let routeDestMarker = null;

function clearRoute() {
  if (routeLine) { scene.remove(routeLine); routeLine = null; }
  if (routeDestMarker) { scene.remove(routeDestMarker); routeDestMarker = null; }
}

function drawRoute(path) {
  clearRoute();
  if (!path || path.length < 2) return;

  const points = path.map(p => new THREE.Vector3(p.x, 0.15, p.z));
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x00c978, linewidth: 2 });
  routeLine = new THREE.Line(geo, mat);
  scene.add(routeLine);

  // Also draw a wider translucent path for visibility
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    planeSeg(a.x, a.z, b.x, b.z, 2.5,
      new THREE.MeshBasicMaterial({ color: 0x00c978, transparent: true, opacity: 0.25 }),
      0.12
    );
  }

  // Destination marker — pulsing ring
  const destGeo = new THREE.RingGeometry(2, 3, 24);
  const destMat = new THREE.MeshBasicMaterial({ color: 0x00c978, transparent: true, opacity: 0.6 });
  routeDestMarker = new THREE.Mesh(destGeo, destMat);
  routeDestMarker.rotation.x = -Math.PI / 2;
  const last = path[path.length - 1];
  routeDestMarker.position.set(last.x, 0.14, last.z);
  scene.add(routeDestMarker);
}

// Bake shadow maps once (static scene)
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;

// ─── Raycaster & UI ──────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const bodyMeshes = buildingMeshes.map(b => b.body);

const infoPanel    = document.getElementById('info-panel');
const panelAccent  = document.getElementById('panel-accent');
const panelTag     = document.getElementById('panel-tag');
const panelName    = document.getElementById('panel-name');
const panelAddress = document.getElementById('panel-address');
const panelType    = document.getElementById('panel-type');
const panelFloors  = document.getElementById('panel-floors');
const panelDesc    = document.getElementById('panel-desc');
const panelRoomNav = document.getElementById('panel-room-nav');
const panelNavSteps= document.getElementById('panel-nav-steps');
const tooltip      = document.getElementById('tooltip');

let selected = null;

function showBuilding(hit, fly = false) {
  if (selected && selected !== hit) selected.body.material = selected.originalMat;
  selected = hit;
  hit.body.material = getBuildingMat(hit.building.type, true);

  const accentHex = '#' + (TYPE_COLORS[hit.building.type] || 0x888888).toString(16).padStart(6, '0');
  panelAccent.style.background = accentHex;
  panelTag.textContent     = TYPE_LABELS[hit.building.type];
  panelName.textContent    = hit.building.name;
  panelAddress.textContent = hit.building.code;
  panelType.textContent    = TYPE_LABELS[hit.building.type];
  panelFloors.textContent  = `${hit.building.floors}`;
  panelDesc.textContent    = hit.building.description;
  panelRoomNav.style.display = 'none';
  infoPanel.classList.add('visible');

  // Compute and draw route from player to building
  const path = findPath(player.position.x, player.position.z, hit.building.cx, hit.building.cz);
  if (path) drawRoute(path);
  else clearRoute();

  if (fly) controls.flyTo(hit.building.cx, hit.building.cz);
}

function showRoom(hit, room, buildingCode) {
  showBuilding(hit);
  const fi = FLOOR_INFO[room.floor] || { label: `Floor ${room.floor}`, stairs: `Go to floor ${room.floor}` };
  const steps = [
    `Walk to <strong>${hit.building.name}</strong>`,
    fi.stairs,
    `Find room <strong>${buildingCode} ${room.id}</strong> — ${room.desc}`,
  ];
  panelNavSteps.innerHTML = steps.map((s, i) =>
    `<div class="nav-step">
      <div class="step-num">${i + 1}</div>
      <div class="step-text">${s}</div>
    </div>`
  ).join('');
  panelRoomNav.style.display = 'block';
}

document.getElementById('close-btn').addEventListener('click', () => {
  infoPanel.classList.remove('visible');
  panelRoomNav.style.display = 'none';
  clearRoute();
  if (selected) { selected.body.material = selected.originalMat; selected = null; }
});

let isDragging = false;
let mdX = 0, mdY = 0;

renderer.domElement.addEventListener('mousedown', e => {
  mdX = e.clientX; mdY = e.clientY; isDragging = false;
});

renderer.domElement.addEventListener('mousemove', e => {
  if (Math.hypot(e.clientX - mdX, e.clientY - mdY) > 5) {
    isDragging = true;
    tooltip.style.display = 'none';
    return;
  }
  mouse.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    (e.clientY / window.innerHeight) * -2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(bodyMeshes);
  if (hits.length) {
    const hit = buildingMeshes.find(b => b.body === hits[0].object);
    renderer.domElement.style.cursor = 'pointer';
    tooltip.style.display = 'block';
    tooltip.style.left = `${e.clientX + 14}px`;
    tooltip.style.top = `${e.clientY - 40}px`;
    tooltip.innerHTML = `${hit.building.name}<span class="tt-type">${TYPE_LABELS[hit.building.type]}</span>`;
  } else {
    renderer.domElement.style.cursor = 'default';
    tooltip.style.display = 'none';
  }
});

renderer.domElement.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

renderer.domElement.addEventListener('click', e => {
  if (isDragging) return;
  mouse.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    (e.clientY / window.innerHeight) * -2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(bodyMeshes);
  if (hits.length) {
    const hit = buildingMeshes.find(b => b.body === hits[0].object);
    if (!hit) return;
    showBuilding(hit);
  } else {
    infoPanel.classList.remove('visible');
    clearRoute();
    if (selected) { selected.body.material = selected.originalMat; selected = null; }
  }
});

// ─── Legend ───────────────────────────────────────────────────────────────────
const legendItems = document.getElementById('legend-items');
Object.entries(TYPE_LABELS).forEach(([type, label]) => {
  const hex = '#' + (FLAT_COLORS[type] || 0x888888).toString(16).padStart(6, '0');
  const div = document.createElement('div');
  div.className = 'legend-item';
  div.innerHTML = `<div class="legend-color" style="background:${hex};"></div>${label}`;
  legendItems.appendChild(div);
});

// ─── Search ──────────────────────────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  if (!q) { searchResults.style.display = 'none'; return; }

  const roomParse = parseRoomQuery(q);
  const roomItems = [];
  if (roomParse) {
    const { code, roomQuery } = roomParse;
    const buildingHit = buildingMeshes.find(b => b.building.code === code);
    if (buildingHit) {
      (ROOMS[code] || [])
        .filter(r => r.id.toUpperCase().startsWith(roomQuery))
        .slice(0, 4)
        .forEach(room => roomItems.push({ isRoom: true, buildingCode: code, room, buildingHit }));
    }
  }

  const ql = q.toLowerCase();
  const buildingItems = buildingMeshes
    .filter(b => b.building.name.toLowerCase().includes(ql) || b.building.code.toLowerCase().includes(ql))
    .slice(0, 8 - roomItems.length);

  const all = [...roomItems, ...buildingItems];
  if (!all.length) { searchResults.style.display = 'none'; return; }

  searchResults.innerHTML = all.map((item, i) => {
    if (item.isRoom) {
      const fi = FLOOR_INFO[item.room.floor];
      return `<div class="search-result-item" data-i="${i}">
        <span><strong>${item.buildingCode} ${item.room.id}</strong> · ${item.room.desc.slice(0, 38)}</span>
        <span class="result-type">${fi ? fi.label : 'Floor ' + item.room.floor}</span>
      </div>`;
    }
    return `<div class="search-result-item" data-i="${i}">
      <span>${item.building.name}</span>
      <span class="result-type">${TYPE_LABELS[item.building.type]}</span>
    </div>`;
  }).join('');

  searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      const item = all[i];
      if (item.isRoom) showRoom(item.buildingHit, item.room, item.buildingCode);
      else showBuilding(item, true);
      searchInput.value = '';
      searchResults.style.display = 'none';
    });
  });

  searchResults.style.display = 'block';
});

searchInput.addEventListener('blur', () => {
  setTimeout(() => { searchResults.style.display = 'none'; }, 150);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') { searchInput.blur(); searchInput.value = ''; }
});

// ─── Player ──────────────────────────────────────────────────────────────────
const player = createPlayer(scene);
player.position.set(0, 0, 102);

// ─── Key input ───────────────────────────────────────────────────────────────
const keys = new Set();
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  // / to focus search
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
    const hint = document.getElementById('search-shortcut-hint');
    if (hint) hint.style.display = 'none';
  }
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

searchInput.addEventListener('focus', () => {
  const hint = document.getElementById('search-shortcut-hint');
  if (hint) hint.style.display = 'none';
});
searchInput.addEventListener('blur', () => {
  const hint = document.getElementById('search-shortcut-hint');
  if (hint && !searchInput.value) hint.style.display = '';
});

// ─── Collision detection ─────────────────────────────────────────────────────
function isBlocked(nx, nz) {
  const PR = 0.9;
  for (const { building } of buildingMeshes) {
    const { minX, maxX, minZ, maxZ } = building.bounds;
    if (nx + PR > minX && nx - PR < maxX && nz + PR > minZ && nz - PR < maxZ) return true;
  }
  return false;
}

// ─── Player movement ─────────────────────────────────────────────────────────
let isWalking = false;

function updatePlayer(dt) {
  const WALK_SPEED = 18;
  isWalking = false;

  // Fixed world directions for WASD in isometric view
  // W = north (-z), S = south (+z), A = west (-x), D = east (+x)
  let dx = 0, dz = 0;
  if (keys.has('w') || keys.has('arrowup'))    dz = -1;
  if (keys.has('s') || keys.has('arrowdown'))  dz = 1;
  if (keys.has('d') || keys.has('arrowright')) dx = 1;
  if (keys.has('a') || keys.has('arrowleft'))  dx = -1;

  if (dx !== 0 || dz !== 0) {
    isWalking = true;
    const len = Math.hypot(dx, dz);
    const nx = player.position.x + (dx / len) * WALK_SPEED * dt;
    const nz = player.position.z + (dz / len) * WALK_SPEED * dt;

    if (!isBlocked(nx, nz)) {
      player.position.x = nx;
      player.position.z = nz;
    } else if (!isBlocked(nx, player.position.z)) {
      player.position.x = nx;
    } else if (!isBlocked(player.position.x, nz)) {
      player.position.z = nz;
    }

    // Face direction of movement
    player.rotation.y = Math.atan2(dx, -dz);

    // Camera follows player when walking
    controls.setTarget(player.position.x, player.position.z);
  }

  // Pulse animation on player
  if (player._pulseMat) {
    const t = (performance.now() % 2000) / 2000;
    player._pulseMat.opacity = Math.max(0, 0.35 * (1 - t));
    player._pulse.scale.set(1 + t * 1.5, 1 + t * 1.5, 1);
  }
}

// ─── Controls ────────────────────────────────────────────────────────────────
const controls = createControls(camera, renderer.domElement);
controls.setTarget(player.position.x, player.position.z);

// Fly-there button
document.getElementById('btn-fly').addEventListener('click', () => {
  if (selected) controls.flyTo(selected.building.cx, selected.building.cz);
});

// ─── Controls hint auto-fade ─────────────────────────────────────────────────
{
  let fadeTimer;
  const hintEl = document.getElementById('controls-hint');
  function resetHintFade() {
    if (hintEl) {
      hintEl.style.opacity = '1';
      clearTimeout(fadeTimer);
      fadeTimer = setTimeout(() => { hintEl.style.opacity = '0.15'; }, 5000);
    }
  }
  window.addEventListener('mousemove', resetHintFade);
  window.addEventListener('keydown', resetHintFade);
  resetHintFade();
}

// ─── Resize ──────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  controls.updateCamera();
});

// ─── Loading screen dismiss ──────────────────────────────────────────────────
requestAnimationFrame(() => {
  setTimeout(() => {
    const el = document.getElementById('loading');
    if (el) el.classList.add('done');
  }, 600);
});

// ─── Render loop ─────────────────────────────────────────────────────────────
let prevTime = 0;
(function animate(time = 0) {
  requestAnimationFrame(animate);
  const dt = Math.min((time - prevTime) / 1000, 0.05);
  prevTime = time;

  controls.update();
  updatePlayer(dt);

  // Pulse destination marker
  if (routeDestMarker) {
    const t = (time % 1500) / 1500;
    routeDestMarker.material.opacity = 0.3 + 0.3 * Math.sin(t * Math.PI * 2);
    routeDestMarker.scale.set(1 + 0.15 * Math.sin(t * Math.PI * 2), 1 + 0.15 * Math.sin(t * Math.PI * 2), 1);
  }

  renderer.render(scene, camera);
})();
