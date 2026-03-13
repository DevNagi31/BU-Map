import * as THREE from 'three';
import { processBuildings, TYPE_COLORS, TYPE_LABELS } from './geo.js';
import { CONNECTOR_ROAD_POINTS, CAMPUS_LAWN_POINTS } from './buildings.js';
import { createControls } from './controls.js';
import { createPlayer } from './player.js';
import { ROOMS, FLOOR_INFO, parseRoomQuery } from './rooms.js';

// ─── Renderer ────────────────────────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

// ─── Scene ────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xa8d8f0, 0.00042);

// ─── Camera ───────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 2700);

// ─── Sky dome ─────────────────────────────────────────────────────────────────
{
  const cv = document.createElement('canvas');
  cv.width = 4; cv.height = 512;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0,  '#0a4a9c');   // zenith deep blue
  g.addColorStop(0.22, '#1870c0');   // upper sky
  g.addColorStop(0.50, '#3aaae0');   // mid sky
  g.addColorStop(0.74, '#7ecce8');   // horizon haze
  g.addColorStop(0.88, '#c8e4f4');   // pale horizon
  g.addColorStop(0.95, '#f0d8b0');   // warm golden horizon band
  g.addColorStop(1.0,  '#c8b890');   // ground tinge
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(cv);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(2580, 32, 18),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false })
  );
  scene.add(dome);
}

// ─── Lights ───────────────────────────────────────────────────────────────────
const hemi = new THREE.HemisphereLight(0xc0dff8, 0x4a6e28, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff0c8, 5.5);
sun.position.set(180, 260, 110);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.near = 1;
sun.shadow.camera.far  = 1200;
sun.shadow.camera.left   = -420;
sun.shadow.camera.right  =  420;
sun.shadow.camera.top    =  420;
sun.shadow.camera.bottom = -420;
sun.shadow.bias = -0.0005;
scene.add(sun);

// Cool fill light from north-west
const fill = new THREE.DirectionalLight(0x8ab8e8, 0.55);
fill.position.set(-100, 70, -140);
scene.add(fill);

// Warm bounce from ground
const bounce = new THREE.DirectionalLight(0xd0a860, 0.22);
bounce.position.set(0, -1, 0);
scene.add(bounce);

// ─── Procedural texture helpers ───────────────────────────────────────────────
function makeGrassTex() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#3a6828';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) {
    const f = 0.72 + Math.random() * 0.46;
    const r = (58 * f) | 0, g2 = (104 * f) | 0, b = (40 * f) | 0;
    ctx.fillStyle = `rgb(${r},${g2},${b})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 2 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(165, 144);
  return tex;
}

function makeLawnTex() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#4a8030';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 10000; i++) {
    const f = 0.75 + Math.random() * 0.4;
    const r = (74 * f) | 0, g2 = (128 * f) | 0, b = (48 * f) | 0;
    ctx.fillStyle = `rgb(${r},${g2},${b})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(54, 42);
  return tex;
}

function makeAsphaltTex() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 3000; i++) {
    const f = 0.6 + Math.random() * 0.3;
    const v = (58 * f) | 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random(), 1 + Math.random());
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 8);
  return tex;
}

function makeConcreteTex() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#6e6455';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6000; i++) {
    const f = 0.8 + Math.random() * 0.35;
    const r = (110 * f) | 0, g2 = (100 * f) | 0, b = (85 * f) | 0;
    ctx.fillStyle = `rgb(${r},${g2},${b})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1 + Math.random() * 2);
  }
  // Expansion joint lines
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 1;
  for (let v = 0; v < 256; v += 40) {
    ctx.beginPath(); ctx.moveTo(v, 0); ctx.lineTo(v, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, v); ctx.lineTo(256, v); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(15, 12);
  return tex;
}

const grassTex    = makeGrassTex();
const lawnTex     = makeLawnTex();
const asphaltTex  = makeAsphaltTex();
const concreteTex = makeConcreteTex();

// ─── Ground (outside campus) ──────────────────────────────────────────────────
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2700, 2400),
  new THREE.MeshStandardMaterial({ map: grassTex, roughness: 0.92, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(-30, 0, -45);
ground.receiveShadow = true;
scene.add(ground);

// ─── Campus oval lawn (ShapeGeometry from CAMPUS_LAWN_POINTS) ─────────────────
function makeShapeMesh(pts, mat, y = 0.01) {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
  shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  scene.add(mesh);
  return mesh;
}

makeShapeMesh(CAMPUS_LAWN_POINTS,
  new THREE.MeshStandardMaterial({ map: lawnTex, roughness: 0.9, metalness: 0 }),
  0.01
);

// ─── Interior roads ───────────────────────────────────────────────────────────
const roadMat   = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.97, metalness: 0 });
const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.5, metalness: 0.1, emissive: 0xaa8800, emissiveIntensity: 0.08 });
const walkMat   = new THREE.MeshStandardMaterial({ color: 0xa09585, roughness: 0.88, metalness: 0 });

// ─── Road helpers — GPS-accurate oriented segments ────────────────────────────
// Coordinates derived from OSM data: wx=(lng+75.969116)*37120, wz=-(lat-42.087969)*49950
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
const roadSeg = (x1,z1,x2,z2,w) => planeSeg(x1,z1,x2,z2, w,   roadMat,  0.025);
const stripSeg = (x1,z1,x2,z2)  => planeSeg(x1,z1,x2,z2, 0.3, stripeMat, 0.04);
const walkSeg = (x1,z1,x2,z2,w) => planeSeg(x1,z1,x2,z2, w,   walkMat,  0.022);
// Road + centre stripe
function rs(x1,z1,x2,z2,w) { roadSeg(x1,z1,x2,z2,w); stripSeg(x1,z1,x2,z2); }

// ─── West Drive — main one-way campus loop (OSM Ways 252709076, 12718560 etc.) ─
// Outbound (S→N): south junction → west peak → NE top
rs(-145, -30, -148,  -56, 7);
rs(-148,  -56, -128, -121, 7);
rs(-128, -121, -102, -152, 7);
rs(-102, -152,  -18, -184, 7);
// Return leg (N→S, runs ~7 m east of outbound)
rs( -18, -184, -108, -150, 7);
rs(-108, -150, -134, -126, 7);
rs(-134, -126, -145,  -30, 7);

// ─── South arc of campus ring (OSM Way 252709076 south portion + 670099559–289928675) ─
// Curves around the bottom of the academic core from SW to SE
rs(-145,  -30, -106,   14, 7);
rs(-106,   14,  -37,   43, 7);
rs( -37,   43,   -4,   50, 7);
rs(  -4,   50,   20,   53, 7);
rs(  20,   53,   74,   47, 7);
rs(  74,   47,  140,   42, 7);

// ─── East side connector to Bartle Drive SE approach ──────────────────────────
rs( 140,   42,  116,  -83, 7);

// ─── Bartle Drive — SE curved approach (OSM Way 290039533, bidirectional) ──────
rs( 116,  -83,   92, -121, 7);
rs(  92, -121,   72, -139, 7);
rs(  72, -139,   48, -168, 7);
// Approach to roundabout (OSM Way 12718553)
rs(  48, -168,   20, -205, 7);

// ─── Bartle Drive — north spur toward Vestal Parkway ──────────────────────────
// One-way loop; rendered as single road surface (OSM Ways 12727014, 480374078, 670099512)
rs(  20, -205,   30, -259, 7);
rs(  30, -259,   55, -292, 6);
rs(  55, -292,   64, -347, 6);
rs(  64, -347,   70, -372, 6);

// ─── Bearcat Boulevard — E-W connector across northern campus (OSM Way 12720120) ─
rs(-183, -175,  -94, -186, 6);
rs( -94, -186,  -80, -186, 6);
rs( -80, -186,  -37, -180, 6);
rs( -37, -180,  -18, -184, 6);  // meets West Drive NE top
// Short S connector from Bearcat to Bartle area (OSM Way 12747547)
rs( -80, -186,  -71, -167, 5);
// East arm: West Drive NE top → Bartle junction
rs( -18, -184,   48, -168, 6);

// ─── Recreation Drive — NE spur toward east/Dickinson area (OSM Way 12770971) ─
rs(  48, -168,   65, -184, 6);
rs(  65, -184,  130, -179, 6);
rs( 130, -179,  160, -161, 6);
rs( 160, -161,  203, -228, 6);

// ─── Bunn Hill Access Road — NW entrance from Bunn Hill Rd CR-53 (OSM Way 12732830) ─
rs(-237, -306, -214, -246, 6);
rs(-214, -246, -202, -209, 6);
rs(-202, -209, -189, -184, 6);
rs(-189, -184, -183, -175, 6);  // meets Bearcat Blvd west end

// ─── Walkways (real BU pedestrian paths) ──────────────────────────────────────
// DeFleur Walkway (main spine) — E-W through academic core at z≈−3
walkSeg(-135, -3,  105,  -3, 4);

// Spine east extension to University Union entrance
walkSeg(  81,  -3,  109,  -3, 3);  // overlaps spine; widens Union approach
walkSeg( 105,  -3,  105,  15, 3);  // jog south to Union doors

// Library ↔ Engineering N-S link
walkSeg(  12,  12,   12,  42, 3);

// Academic west cluster E-W path (AA–LH–AB area)
walkSeg(-130, -20,  -60, -20, 3);

// Sciences N-S corridor
walkSeg( -52,  -3,  -52, -193, 3);

// Sciences E-W cross-link near S2
walkSeg( -97, -105,  -47, -105, 3);

// Anderson Center / Fine Arts N-S path
walkSeg(  22,  -25,   22, -101, 3);

// South residential corridor (Appalachian, Mountainview)
walkSeg( -34,  117,   26,  117, 3);

// ─── Academic podium (concrete area) ─────────────────────────────────────────
// Centered at (-42,-66) — 3× GPS-derived position, spans academic core
const podium = new THREE.Mesh(
  new THREE.PlaneGeometry(210, 186),
  new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.88, metalness: 0.02 })
);
podium.rotation.x = -Math.PI / 2;
podium.position.set(-42, 0.015, -66);
podium.receiveShadow = true;
scene.add(podium);

// ─── Nature preserve ──────────────────────────────────────────────────────────
makeShapeMesh(
  [[-450, 174], [360, 174], [360, 270], [-450, 270]],
  new THREE.MeshStandardMaterial({ color: 0x2d5a20, roughness: 0.95, metalness: 0 }),
  0.008
);

// ─── Decorative pond ──────────────────────────────────────────────────────────
{
  const pondMat = new THREE.MeshStandardMaterial({
    color: 0x1a5880, roughness: 0.02, metalness: 0.85, transparent: true, opacity: 0.90,
  });
  // Outer bank — slightly raised dirt ring
  const bank = new THREE.Mesh(new THREE.CircleGeometry(9.5, 28),
    new THREE.MeshStandardMaterial({ color: 0x5a7040, roughness: 0.9, metalness: 0 }));
  bank.rotation.x = -Math.PI / 2;
  bank.position.set(24, 0.06, -24);  // open area between Library and Engineering
  scene.add(bank);
  const water = new THREE.Mesh(new THREE.CircleGeometry(8, 28), pondMat);
  water.rotation.x = -Math.PI / 2;
  water.position.set(24, 0.10, -24);
  scene.add(water);
}

// ─── Building label helper ────────────────────────────────────────────────────
const LABEL_HEX = {
  academic:         '#ffe0a0',
  residential:      '#b0d8ff',
  athletics:        '#b8ffb0',
  student_services: '#ffd090',
  library:          '#ddb8ff',
  utility:          '#dddddd',
};

function makeLabel(code, name, type) {
  const canvas = document.createElement('canvas');
  canvas.width = 320; canvas.height = 88;
  const ctx = canvas.getContext('2d');
  const accent = LABEL_HEX[type] || '#ffffff';
  // Pill background
  const rx = 12;
  ctx.beginPath();
  ctx.moveTo(rx, 4); ctx.lineTo(canvas.width - rx, 4);
  ctx.arcTo(canvas.width - 4, 4, canvas.width - 4, 4 + rx, rx);
  ctx.lineTo(canvas.width - 4, canvas.height - rx);
  ctx.arcTo(canvas.width - 4, canvas.height - 4, canvas.width - 4 - rx, canvas.height - 4, rx);
  ctx.lineTo(rx, canvas.height - 4);
  ctx.arcTo(4, canvas.height - 4, 4, canvas.height - 4 - rx, rx);
  ctx.lineTo(4, 4 + rx);
  ctx.arcTo(4, 4, 4 + rx, 4, rx);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  ctx.fill();
  ctx.strokeStyle = accent + '90';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // Building code — large + colored
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = accent;
  ctx.font = 'bold 30px Arial, sans-serif';
  ctx.fillText(code, canvas.width / 2, 46);
  // Building name — smaller white
  ctx.fillStyle = 'rgba(255,255,255,0.70)';
  ctx.font = '15px Arial, sans-serif';
  const maxW = canvas.width - 20;
  let sub = name;
  ctx.font = '15px Arial, sans-serif';
  while (ctx.measureText(sub).width > maxW && sub.length > 4) sub = sub.slice(0, -1);
  if (sub !== name) sub = sub.trimEnd() + '…';
  ctx.fillText(sub, canvas.width / 2, 68);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  );
  sprite.scale.set(18, 5, 1);
  return sprite;
}

// ─── Buildings: PBR boxes with procedural brick textures + 3D windows ────────
const buildingMeshes = [];
const matCache = {};

function getBuildingMat(type, highlight = false) {
  const key = `${type}_${highlight}`;
  if (!matCache[key]) {
    const c = new THREE.Color(TYPE_COLORS[type] || 0x888888);
    c.multiplyScalar(1.12);   // slight saturation/brightness boost for punchy look
    if (highlight) c.multiplyScalar(1.5);
    const em = highlight ? c.clone().multiplyScalar(0.25) : new THREE.Color(0x000000);
    matCache[key] = new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.04, emissive: em });
  }
  return matCache[key];
}

// Shared window + frame materials (PBR)
const glassMat = new THREE.MeshStandardMaterial({
  color: 0x5ab8d8, emissive: 0x0a2840, emissiveIntensity: 0.35,
  roughness: 0.04, metalness: 0.75, transparent: true, opacity: 0.88,
});
const frameMat    = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.4, metalness: 0.35 });
const hvacGrayMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.6, metalness: 0.45 });

// ─── Procedural brick / stone wall texture ────────────────────────────────────
const brickBaseCache = {};
function getBrickTex(type, colorHex, isStoneOverride) {
  const cacheKey = colorHex != null ? `c_${colorHex}` : type;
  if (brickBaseCache[cacheKey]) return brickBaseCache[cacheKey];
  const c   = new THREE.Color(colorHex != null ? colorHex : (TYPE_COLORS[type] || 0x888888));
  const br  = (c.r * 255) | 0, bg = (c.g * 255) | 0, bb = (c.b * 255) | 0;
  const isStone = isStoneOverride != null ? isStoneOverride : (type === 'library' || type === 'utility');
  const cv  = document.createElement('canvas');
  cv.width  = 512; cv.height = 512;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = `rgb(${br},${bg},${bb})`;
  ctx.fillRect(0, 0, 512, 512);
  const BH = isStone ? 34 : 15, BW = isStone ? 68 : 56;
  ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = isStone ? 2 : 1.2;
  for (let row = 0; row * BH < 512; row++) {
    const y0 = row * BH;
    ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(512, y0); ctx.stroke();
    const off = (row % 2) * (BW / 2);
    for (let x = -BW + off; x < 512 + BW; x += BW) {
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + BH); ctx.stroke();
    }
  }
  // Per-brick colour variation
  for (let i = 0; i < 2800; i++) {
    const f = 0.80 + Math.random() * 0.32;
    ctx.fillStyle = `rgba(${(br*f)|0},${(bg*f)|0},${(bb*f)|0},0.22)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, BW - 3, BH - 3);
  }
  // Vertical corner pilasters
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.fillRect(0, 0, 5, 512); ctx.fillRect(507, 0, 5, 512);
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  brickBaseCache[cacheKey] = tex;
  return tex;
}

// Window geometry collected here, then built as InstancedMesh after the loop
const _wfr = [];  // frame instances: [x, y, z, sx, sy, sz]
const _wgl = [];  // glass instances: [x, y, z, sx, sy, sz]

processBuildings().forEach((b) => {
  const { minX, maxX, minZ, maxZ } = b.bounds;
  const bw = maxX - minX;          // building width  (X axis)
  const bd = maxZ - minZ;          // building depth  (Z axis)
  const floors  = Math.max(2, Math.round(b.h / 4));
  const floorH  = b.h / floors;

  const wallColor = new THREE.Color(b.color != null ? b.color : (TYPE_COLORS[b.type] || 0x888888));
  // Clone base brick texture and set UV repeat proportional to building size
  const brickBase = getBrickTex(b.type, b.color, b.stone);
  const wallTex   = brickBase.clone();
  wallTex.repeat.set(Math.max(2, Math.round(bw / 15)), Math.max(1, Math.round(b.h / 8)));
  wallTex.needsUpdate = true;
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.86, metalness: 0.02 });

  // Slab / parapet colour — lighten toward concrete
  const slabColor = wallColor.clone().lerp(new THREE.Color(0xd0c8b8), 0.40);
  const slabMat   = new THREE.MeshStandardMaterial({ color: slabColor, roughness: 0.75, metalness: 0.05 });

  // ── Main box body ──────────────────────────────────────────────────────────
  const body = new THREE.Mesh(new THREE.BoxGeometry(bw, b.h, bd), wallMat);
  body.position.set(b.cx, b.h / 2, b.cz);
  body.castShadow  = true;
  body.receiveShadow = true;
  scene.add(body);

  // ── Floor slab ledges (horizontal bands every floor) ──────────────────────
  for (let f = 1; f < floors; f++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.55, 0.45, bd + 0.55), slabMat);
    slab.position.set(b.cx, f * floorH, b.cz);
    scene.add(slab);
  }

  // ── Roof parapet ring + flat surface ──────────────────────────────────────
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.45, 0.65, bd + 0.45), slabMat);
  parapet.position.set(b.cx, b.h + 0.325, b.cz);
  scene.add(parapet);

  const roofColor = wallColor.clone().lerp(new THREE.Color(0x808878), 0.55);
  const roofMat   = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.80, metalness: 0.08 });
  const roofSurf  = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.15, 0.12, bd - 0.15), roofMat);
  roofSurf.position.set(b.cx, b.h + 0.06, b.cz);
  scene.add(roofSurf);

  // ── Rooftop HVAC boxes ────────────────────────────────────────────────────
  if (floors >= 3) {
    const n = Math.min(3, 1 + Math.floor(floors / 3));
    for (let i = 0; i < n; i++) {
      const hw  = 1.2 + (i * 1.4) % 1.8;
      const hh2 = 0.5 + (i * 0.6) % 0.7;
      const hd2 = 0.9 + (i * 1.1) % 1.4;
      const box = new THREE.Mesh(new THREE.BoxGeometry(hw, hh2, hd2), hvacGrayMat);
      const ang = (i / n) * Math.PI * 1.8;
      box.position.set(
        b.cx + Math.cos(ang) * bw * 0.28,
        b.h + 0.65 + hh2 / 2,
        b.cz + Math.sin(ang) * bd * 0.28
      );
      box.castShadow = true;
      scene.add(box);
    }
  }

  // ── Library Tower: brutalist stepped top (iconic BU skyline silhouette) ─────
  if (b.code === 'LN' || b.code === 'LT') {
    // Wide dark concrete band just below roof
    const band = new THREE.Mesh(new THREE.BoxGeometry(bw + 1.2, 2.0, bd + 1.2), slabMat);
    band.position.set(b.cx, b.h - 1.0, b.cz);
    band.castShadow = true; scene.add(band);
    // Step 1 — 80% width
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.80, 6, bd * 0.80), wallMat);
    step1.position.set(b.cx, b.h + 3, b.cz);
    step1.castShadow = true; scene.add(step1);
    const band2 = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.82, 1.5, bd * 0.82), slabMat);
    band2.position.set(b.cx, b.h + 6.75, b.cz); scene.add(band2);
    // Step 2 — 55% width (top pinnacle)
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.55, 5, bd * 0.55), wallMat);
    step2.position.set(b.cx, b.h + 9.5, b.cz);
    step2.castShadow = true; scene.add(step2);
  }

  // ── Events Center: low barrel-vault roof suggestion ───────────────────────
  if (b.code === 'EC') {
    const vaultMat = new THREE.MeshStandardMaterial({ color: 0x7888a0, roughness: 0.5, metalness: 0.45 });
    // Slight arched ridge along the long axis — simulated with a raised center box
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.35, 2.5, bd), vaultMat);
    ridge.position.set(b.cx, b.h + 1.25, b.cz);
    ridge.castShadow = true; scene.add(ridge);
  }

  // ── 3-D windows — collected for InstancedMesh (built after loop) ───────────
  const WIN_SPACING = 13.5;
  const WIN_H       = floorH * 0.55;
  const WIN_DEPTH   = 0.60;
  const FRAME_PAD   = 0.36;

  for (let fl = 0; fl < floors; fl++) {
    const winY = fl * floorH + floorH * 0.62;

    // North / South faces
    [[b.cz - bd / 2, -1], [b.cz + bd / 2, 1]].forEach(([fz, nz]) => {
      const nw = Math.max(1, Math.min(6, Math.round(bw / WIN_SPACING)));
      const ww = (bw / nw) * 0.60;
      for (let wi = 0; wi < nw; wi++) {
        const wx = b.cx - bw / 2 + (wi + 0.5) * bw / nw;
        _wfr.push([wx, winY, fz + nz * WIN_DEPTH * 0.5,  ww + FRAME_PAD * 2, WIN_H + FRAME_PAD * 2, WIN_DEPTH]);
        _wgl.push([wx, winY, fz + nz * WIN_DEPTH * 0.78, ww, WIN_H, WIN_DEPTH * 0.55]);
      }
    });

    // East / West faces
    [[b.cx - bw / 2, -1], [b.cx + bw / 2, 1]].forEach(([fx, nx]) => {
      const nw = Math.max(1, Math.min(6, Math.round(bd / WIN_SPACING)));
      const ww = (bd / nw) * 0.60;
      for (let wi = 0; wi < nw; wi++) {
        const wz = b.cz - bd / 2 + (wi + 0.5) * bd / nw;
        _wfr.push([fx + nx * WIN_DEPTH * 0.5,  winY, wz, WIN_DEPTH, WIN_H + FRAME_PAD * 2, ww + FRAME_PAD * 2]);
        _wgl.push([fx + nx * WIN_DEPTH * 0.78, winY, wz, WIN_DEPTH * 0.55, WIN_H, ww]);
      }
    });
  }

  // Floating label at centroid
  const label = makeLabel(b.code, b.label, b.type);
  label.position.set(b.cx, b.h + 7, b.cz);
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

// ─── Window InstancedMesh (replaces ~8000 individual Mesh objects) ────────────
{
  const _unitBox = new THREE.BoxGeometry(1, 1, 1);
  const _m4 = new THREE.Matrix4();
  const _p  = new THREE.Vector3();
  const _q  = new THREE.Quaternion();
  const _s  = new THREE.Vector3();
  const _c  = new THREE.Color();

  // Frames
  const frameIM = new THREE.InstancedMesh(_unitBox, frameMat, _wfr.length);
  frameIM.castShadow = false; frameIM.receiveShadow = false;
  _wfr.forEach(([x, y, z, sx, sy, sz], i) => {
    frameIM.setMatrixAt(i, _m4.compose(_p.set(x,y,z), _q, _s.set(sx,sy,sz)));
  });
  frameIM.instanceMatrix.needsUpdate = true;
  scene.add(frameIM);

  // Glass — per-instance color: lit (warm) vs dark based on seeded RNG
  const glassIM = new THREE.InstancedMesh(_unitBox, glassMat, _wgl.length);
  glassIM.castShadow = false; glassIM.receiveShadow = false;
  _wgl.forEach(([x, y, z, sx, sy, sz], i) => {
    glassIM.setMatrixAt(i, _m4.compose(_p.set(x,y,z), _q, _s.set(sx,sy,sz)));
    const rng = Math.abs(Math.sin(x * 127.1 + y * 311.7 + z * 74.9) * 43758.5) % 1;
    _c.setHex(rng > 0.45 ? 0x7ac4e0 : (rng > 0.15 ? 0x2a5878 : 0xffe4b0));
    glassIM.setColorAt(i, _c);
  });
  glassIM.instanceMatrix.needsUpdate = true;
  glassIM.instanceColor.needsUpdate  = true;
  scene.add(glassIM);
}

// ─── Trees ────────────────────────────────────────────────────────────────────
// Seeded pseudo-random from position so trees look the same on every load
function seedRng(x, z) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function tree(x, z, s = 1) {
  const rng = seedRng(x, z);
  const g = new THREE.Group();

  // Trunk
  const trunkColor = new THREE.Color(0x3d2008).lerp(new THREE.Color(0x5a3a1a), rng * 0.5);
  const trunkMat = new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.95, metalness: 0 });
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * s, 0.24 * s, 2.6 * s, 7), trunkMat);
  tr.position.y = 1.3 * s;
  tr.castShadow = true;
  g.add(tr);

  // Foliage — three overlapping spheres for a fuller, more natural silhouette
  const hueBase = new THREE.Color(0x2d6e1a).lerp(new THREE.Color(0x4a8a28), rng);
  const hueTop  = hueBase.clone().lerp(new THREE.Color(0x6aaa30), 0.25); // lighter on top
  const foliageMat    = new THREE.MeshStandardMaterial({ color: hueBase, roughness: 0.95, metalness: 0 });
  const foliageMatTop = new THREE.MeshStandardMaterial({ color: hueTop,  roughness: 0.95, metalness: 0 });
  const lower = new THREE.Mesh(new THREE.SphereGeometry(1.75 * s, 9, 7), foliageMat);
  lower.position.y = 4.0 * s;
  lower.castShadow = true;
  g.add(lower);
  const mid = new THREE.Mesh(new THREE.SphereGeometry(1.45 * s, 8, 6), foliageMat);
  mid.position.set(0.3 * s, 5.3 * s, 0.2 * s);
  mid.castShadow = true;
  g.add(mid);
  const upper = new THREE.Mesh(new THREE.SphereGeometry(1.0 * s, 8, 6), foliageMatTop);
  upper.position.y = 6.5 * s;
  upper.castShadow = true;
  g.add(upper);

  g.position.set(x, 0, z);
  scene.add(g);
}

// Pine tree — layered cones, used in Nature Preserve area
function pine(x, z, s = 1) {
  const rng = Math.abs(Math.sin(x * 89.3 + z * 197.1) * 43758.5) % 1;
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x3a1e08).lerp(new THREE.Color(0x5a3010), rng * 0.4),
    roughness: 0.95, metalness: 0,
  });
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1*s, 0.18*s, 3.0*s, 6), trunkMat);
  tr.position.y = 1.5 * s; tr.castShadow = true; g.add(tr);
  const pineColor = new THREE.Color(0x163814).lerp(new THREE.Color(0x265c20), rng);
  const pineMat = new THREE.MeshStandardMaterial({ color: pineColor, roughness: 0.95, metalness: 0 });
  [[3.2, 2.6, 2.2], [2.5, 4.8, 1.9], [1.8, 6.8, 1.5], [1.1, 8.4, 1.2]].forEach(([r, y, h]) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r*s, h*s, 7), pineMat);
    cone.position.y = y * s; cone.castShadow = true; g.add(cone);
  });
  g.position.set(x, 0, z);
  scene.add(g);
}

// Along Bartle Drive
for (let z = -285; z < 30; z += 30) { tree(-5, z); tree(5, z); }
// Along south E-W road
for (let x = -225; x <= 225; x += 30) { tree(x, 30); tree(x, 60); }
// North area near athletics
[[-165,-240],[-135,-255],[-90,-255],[105,-234],[135,-246],[174,-234]].forEach(([x,z]) => tree(x,z));
// Preserve edge — mixed deciduous and pine
for (let x = -240; x <= 180; x += 21) tree(x + ((Math.abs(x)%3)-1), 132, 1.0+((Math.abs(x)%4))*0.06);
for (let x = -240; x <= 180; x += 18) tree(x + ((Math.abs(x)%5)-2), 150, 1.1+((Math.abs(x)%3))*0.07);
// Preserve interior — dense pines (Nature Preserve is heavily forested)
for (let x = -210; x <= 150; x += 26) pine(x + ((Math.abs(x)%5)-2), 185, 0.95+((Math.abs(x)%4))*0.07);
for (let x = -190; x <= 130; x += 22) pine(x + ((Math.abs(x)%3)-1), 215, 1.05+((Math.abs(x)%3))*0.08);
for (let x = -170; x <= 110; x += 30) pine(x, 250, 1.1+((Math.abs(x)%5))*0.05);
// CIW and Hinman surroundings
[[-195,0],[-195,24],[-195,48],[-195,72],[-165,96],[-135,108]].forEach(([x,z]) => tree(x,z));
// Mountainview
[[-75,126],[-15,126],[30,126],[60,114]].forEach(([x,z]) => tree(x,z));
// Scattered interior
[[-165,-135],[-165,-90],[90,-135],[90,-90],[144,-30],[144,-60]].forEach(([x,z]) => tree(x,z));
// Newing area
[[-330,12],[-345,36],[-360,0],[-330,48]].forEach(([x,z]) => tree(x,z,0.9));
// Pond surroundings (pond at 24, -24)
[[6,-12],[12,-42],[42,-12],[42,-42]].forEach(([x,z]) => tree(x,z,0.85));

// ─── Clouds ───────────────────────────────────────────────────────────────────
const cloudMat = new THREE.MeshStandardMaterial({
  color: 0xffffff, emissive: 0xddeeff, emissiveIntensity: 0.06,
  roughness: 1.0, metalness: 0, transparent: true, opacity: 0.86,
});
const clouds = [];
(function () {
  const configs = [
    [ -180, 118, -240, [14,10,11],  0.084 ],
    [  240, 125, -180, [11,13,9],   0.066 ],
    [ -540, 112,   90, [16,10,12],  0.105 ],
    [  480, 130,  240, [9,12,14],   0.060 ],
    [  -60, 140, -600, [18,12,13],  0.093 ],
    [  300, 120,  360, [10,8,11],   0.078 ],
    [ -390, 135, -420, [13,11,15],  0.057 ],
  ];
  configs.forEach(([cx, cy, cz, radii, spd]) => {
    const g = new THREE.Group();
    radii.forEach((r, i) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 9, 6), cloudMat);
      puff.position.set((i - 1) * r * 1.4, (i % 2) * 5 - 2, (i % 3 - 1) * 6);
      g.add(puff);
    });
    g.position.set(cx, cy, cz);
    scene.add(g);
    clouds.push({ g, spd });
  });
})();

// ─── Street lamps ─────────────────────────────────────────────────────────────
{
  const poleMat  = new THREE.MeshStandardMaterial({ color: 0x585858, roughness: 0.5, metalness: 0.7 });
  const globeMat = new THREE.MeshStandardMaterial({ color: 0xfffde0, emissive: 0xffe090, emissiveIntensity: 1.4, roughness: 0.3, metalness: 0.1 });
  function lamp(x, z) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 6), poleMat);
    pole.position.y = 2.5;
    pole.castShadow = true;
    g.add(pole);
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), globeMat);
    globe.position.y = 5.4;
    g.add(globe);
    // Real point light casting a warm pool on the ground
    const pl = new THREE.PointLight(0xffe090, 6, 45, 2);
    pl.position.set(0, 5.4, 0);
    g.add(pl);
    g.position.set(x, 0, z);
    scene.add(g);
  }
  // Along real Bartle Drive (NE side, approximate x≈35-55 range)
  for (let t = 0; t <= 1; t += 0.15) {
    const lx = 22 + (66-22)*t, lz = -210 + (-347+210)*t;
    lamp(lx - 4, lz); lamp(lx + 4, lz);
  }
  // South residential connector (z=170)
  for (let x = -120; x <= 240; x += 80) lamp(x, 195);
  // Bearcat Boulevard (z=−171, near EC/athletics)
  for (let x = -170; x <= -70; x += 50) lamp(x, -171);
}

// Sun + buildings are static — bake shadow maps once then freeze (major perf win)
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;

// ─── Raycaster & UI ───────────────────────────────────────────────────────────
const raycaster  = new THREE.Raycaster();
const mouse      = new THREE.Vector2();
const bodyMeshes = buildingMeshes.map(b => b.body);

const infoPanel    = document.getElementById('info-panel');
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
  panelTag.textContent     = TYPE_LABELS[hit.building.type];
  panelName.textContent    = hit.building.name;
  panelAddress.textContent = hit.building.address;
  panelType.textContent    = TYPE_LABELS[hit.building.type];
  panelFloors.textContent  = `${hit.building.floors} floor${hit.building.floors !== 1 ? 's' : ''}`;
  panelDesc.textContent    = hit.building.description;
  panelRoomNav.style.display = 'none';
  infoPanel.classList.add('visible');
  if (fly) controls.flyTo(hit.building.cx, hit.building.cz);
}

function showRoom(hit, room, buildingCode) {
  showBuilding(hit);
  const fi = FLOOR_INFO[room.floor] || { label: `Floor ${room.floor}`, stairs: `Go to floor ${room.floor}` };
  const steps = [
    `Head to <strong>${hit.building.name}</strong>`,
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
    (e.clientX / window.innerWidth)  *  2 - 1,
    (e.clientY / window.innerHeight) * -2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(bodyMeshes);
  if (hits.length) {
    const hit = buildingMeshes.find(b => b.body === hits[0].object);
    renderer.domElement.style.cursor = 'pointer';
    tooltip.style.display = 'block';
    tooltip.style.left = `${e.clientX + 14}px`;
    tooltip.style.top  = `${e.clientY - 32}px`;
    tooltip.textContent = hit.building.name;
  } else {
    renderer.domElement.style.cursor = 'default';
    tooltip.style.display = 'none';
  }
});

renderer.domElement.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
});

renderer.domElement.addEventListener('click', e => {
  if (isDragging) return;
  mouse.set(
    (e.clientX / window.innerWidth)  *  2 - 1,
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
    if (selected) { selected.body.material = selected.originalMat; selected = null; }
  }
});

// ─── Legend (generated from TYPE_COLORS so it always matches) ─────────────────
const legendItems = document.getElementById('legend-items');
Object.entries(TYPE_LABELS).forEach(([type, label]) => {
  const hex = '#' + TYPE_COLORS[type].toString(16).padStart(6, '0');
  const div = document.createElement('div');
  div.className = 'legend-item';
  div.innerHTML = `<div class="legend-color" style="background:${hex};"></div>${label}`;
  legendItems.appendChild(div);
});

// ─── Search ───────────────────────────────────────────────────────────────────
const searchInput   = document.getElementById('search-input');
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

// ─── Player ───────────────────────────────────────────────────────────────────
const player = createPlayer(scene);
player.position.set(0, 0, 102); // spawn south of campus oval (oval S-apex at z=81)

// ─── First-person state ───────────────────────────────────────────────────────
let fpMode  = false;
let fpYaw   = 0;
let fpPitch = 0;
const fpHint = document.getElementById('fp-hint');
const fpExit = document.getElementById('fp-exit');
const controlsHint = document.getElementById('controls-hint');

// ─── Key input ────────────────────────────────────────────────────────────────
const keys = new Set();
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys.add(k);
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  if (k === 'f') {
    if (!fpMode) {
      fpYaw = controls.getTheta();
      renderer.domElement.requestPointerLock();
    } else {
      document.exitPointerLock();
    }
  }
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

document.addEventListener('pointerlockchange', () => {
  fpMode = document.pointerLockElement === renderer.domElement;
  controls.setEnabled(!fpMode);
  player.visible = !fpMode;
  fpHint.style.display       = fpMode ? 'block' : 'none';
  fpExit.style.display       = fpMode ? 'block' : 'none';
  controlsHint.style.display = fpMode ? 'none'  : 'block';
});

document.addEventListener('mousemove', e => {
  if (!fpMode) return;
  fpYaw   -= e.movementX * 0.002;
  fpPitch  = Math.max(-Math.PI / 4, Math.min(Math.PI / 6, fpPitch - e.movementY * 0.002));
  player.rotation.y = fpYaw;
});

// ─── Collision detection ──────────────────────────────────────────────────────
function isBlocked(nx, nz) {
  const PR = 0.9;
  for (const { building } of buildingMeshes) {
    const { minX, maxX, minZ, maxZ } = building.bounds;
    if (nx + PR > minX && nx - PR < maxX && nz + PR > minZ && nz - PR < maxZ) return true;
  }
  return false;
}

function updatePlayer(dt) {
  const WALK_SPEED = 10;
  const yaw = fpMode ? fpYaw : controls.getTheta();

  const fwdX = -Math.sin(yaw), fwdZ = -Math.cos(yaw);
  const rgtX =  Math.cos(yaw), rgtZ = -Math.sin(yaw);

  let dx = 0, dz = 0;
  if (keys.has('w') || keys.has('arrowup'))    { dx += fwdX; dz += fwdZ; }
  if (keys.has('s') || keys.has('arrowdown'))  { dx -= fwdX; dz -= fwdZ; }
  if (keys.has('d') || keys.has('arrowright')) { dx += rgtX; dz += rgtZ; }
  if (keys.has('a') || keys.has('arrowleft'))  { dx -= rgtX; dz -= rgtZ; }

  if (dx !== 0 || dz !== 0) {
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
    } else if (isBlocked(player.position.x, player.position.z)) {
      // Already inside a building — allow escape in any direction
      player.position.x = nx;
      player.position.z = nz;
    }

    if (!fpMode) {
      player.rotation.y = Math.atan2(dx, -dz);
      controls.setTarget(player.position.x, player.position.z);
    }
  }

  if (fpMode) {
    camera.position.set(player.position.x, 2.9, player.position.z);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(fpPitch, fpYaw, 0);
  }
}

// ─── Controls ─────────────────────────────────────────────────────────────────
const controls = createControls(camera, renderer.domElement);
controls.setTarget(player.position.x, player.position.z);

// ─── Resize ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Render loop ──────────────────────────────────────────────────────────────
let prevTime = 0;
(function animate(time = 0) {
  requestAnimationFrame(animate);
  const dt = Math.min((time - prevTime) / 1000, 0.05);
  prevTime = time;

  // Drift clouds slowly west → east
  clouds.forEach(c => {
    c.g.position.x += c.spd;
    if (c.g.position.x > 450) c.g.position.x = -450;
  });

  updatePlayer(dt);
  renderer.render(scene, camera);
})();
