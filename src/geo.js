// Processes real BU campus building polygons from buildings-geo.json
// Converts GeoJSON polygons → Three.js Shapes for ExtrudeGeometry

import * as THREE from 'three';
import geoData from './buildings-geo.json';

// Reference point: University Union centroid ≈ 42.087969, -75.969116
const REF_LNG = -75.969116;
const REF_LAT = 42.087969;
// 1 degree lng ≈ 82,489 m at lat 42°; 1 degree lat ≈ 111,000 m
// Scale: 0.45 → 1 world unit ≈ 2.2 m real (3× spread for better campus readability)
const SCALE = 0.45;

export function lngLatToWorld(lng, lat) {
  return {
    x:  (lng - REF_LNG) * 82489 * SCALE,
    z: -(lat - REF_LAT) * 111000 * SCALE,
  };
}

// Flatten any malformed coords (BU GeoJSON has a few 4-element arrays)
function flattenCoords(ring) {
  const out = [];
  for (const c of ring) {
    if (c.length === 4) {
      out.push([c[0], c[1]], [c[2], c[3]]);
    } else if (c.length >= 2) {
      out.push([c[0], c[1]]);
    }
  }
  return out;
}

// Build a THREE.Shape from GeoJSON polygon coordinate ring.
// We use (x, -z) as (shape_x, shape_y) so that after mesh.rotation.x = -PI/2
// the shape lies correctly in the XZ world plane.
function ringToShape(ring) {
  const pts = flattenCoords(ring);
  const shape = new THREE.Shape();
  pts.forEach(([lng, lat], i) => {
    const { x, z } = lngLatToWorld(lng, lat);
    if (i === 0) shape.moveTo(x, -z);
    else shape.lineTo(x, -z);
  });
  return shape;
}

// Compute centroid of a ring
function centroid(ring) {
  const pts = flattenCoords(ring);
  let sx = 0, sz = 0;
  for (const [lng, lat] of pts) {
    const { x, z } = lngLatToWorld(lng, lat);
    sx += x; sz += z;
  }
  return { x: sx / pts.length, z: sz / pts.length };
}

// ── Building metadata ─────────────────────────────────────────────────────────
// type: academic | residential | athletics | student_services | library | utility
// h: world-unit height (floors × ~4)

const META = {
  // ── Academic / Research ───────────────────────────
  AA:  { type:'academic',         h:16,                          label:'Academic A',         desc:'Houses School of Management, Kaschak Institute, general-purpose lecture halls and computing labs.' },
  AB:  { type:'academic',         h:16,                          label:'Academic B',         desc:'Houses Student Affairs Admin, Environmental Studies, Health Promotion, Harriet Tubman Center, and PT labs.' },
  AC:  { type:'academic',         h:20, color:0x5c4838,stone:true,label:'Anderson Center',   desc:'Major performing arts venue: Watters Theater, Osterhout Concert Theater, and Chamber Hall.' },
  BI:  { type:'academic',         h:14,                          label:'Biotech',            desc:'Biotechnology Building for research in molecular biology and bioengineering.' },
  CE:  { type:'academic',         h:16,                          label:'Center of Excellence',desc:'Center of Excellence in Small Scale Systems Integration & Packaging.' },
  CPS: { type:'student_services', h: 8,                          label:'Pre-School',         desc:'Campus Pre-School serving children of students, faculty, and staff.' },
  EB:  { type:'academic',         h:20, color:0x8a3010,          label:'Engineering',        desc:'Main Watson School of Engineering building: electrical, mechanical, industrial, and systems engineering.' },
  ES:  { type:'academic',         h:20, color:0x8a3010,          label:'Eng & Science',      desc:'Engineering and Science Building with advanced research labs and classrooms.' },
  FA:  { type:'academic',         h:16, color:0x4a3020,          label:'Fine Arts',          desc:'Studio art, art history, and music. Painting studios, darkrooms, recital hall, and rehearsal spaces.' },
  GR:  { type:'academic',         h: 8,                          label:'Greenhouse',         desc:'Campus greenhouse for biology and horticulture research.' },
  ICD: { type:'academic',         h:12,                          label:'Child Dev',          desc:'Institute for Child Development — research and clinical training in developmental psychology.' },
  LH:  { type:'academic',         h:16, color:0x7a4428,          label:'Lecture Hall',       desc:'Main lecture building. Multiple tiered auditoriums seat hundreds for large introductory courses.' },
  S1:  { type:'academic',         h:24, color:0xb0a078,stone:true,label:'Science 1',         desc:'Biology and chemistry teaching labs, lecture rooms, and Harpur College faculty research.' },
  S2:  { type:'academic',         h:24, color:0xb0a078,stone:true,label:'Science 2',         desc:'Chemistry, physics, and environmental studies labs. Connected to the S1/S3 complex.' },
  S3:  { type:'academic',         h:24, color:0xb0a078,stone:true,label:'Science 3',         desc:'Geology, environmental science, and physics research. Part of the Science complex.' },
  S4:  { type:'academic',         h:20, color:0xb0a078,stone:true,label:'Science 4',         desc:'Additional science research and teaching labs within the podium complex.' },
  S5:  { type:'academic',         h:20, color:0xb0a078,stone:true,label:'Science 5',         desc:'Science 5 building with specialized labs supporting Harpur College STEM departments.' },
  SL:  { type:'academic',         h:12,                          label:'Sci Lab',            desc:'Science laboratory building supporting introductory and intermediate STEM courses.' },
  SN:  { type:'academic',         h:12,                          label:'Science N',          desc:'North science building with research facilities.' },
  TH:  { type:'academic',         h:12,                          label:'Thomas Hall',        desc:'Houses additional academic departments and seminar rooms.' },
  // ── Libraries ─────────────────────────────────────
  LN:  { type:'library', h:48, color:0x2a2826, stone:true, label:'Library Tower', desc:'Iconic Bartle Library tower visible from across campus. Houses upper reading rooms and research collections.' },
  LS:  { type:'library', h:16, color:0x3e3c38, stone:true, label:'Bartle Library', desc:'Glenn G. Bartle Library — main library. Over 2 million volumes, Special Collections, and study areas.' },
  LT:  { type:'library', h:48, color:0x2a2826, stone:true, label:'Library Tower', desc:'Library Tower — part of the Bartle Library complex.' },
  // ── Student Services ──────────────────────────────
  AD:  { type:'student_services', h:12, label:'Admin',         desc:'Couper Administration Building — offices of President, Provost, Bursar, Registrar, and Financial Aid.' },
  AM:  { type:'student_services', h:10, label:'Admissions',    desc:'Admissions Center. Welcome center for prospective students and families.' },
  GW:  { type:'student_services', h:10, label:'Gateway W',     desc:'Gateway West building near the north campus entrance.' },
  HP:  { type:'utility',          h:14, label:'Heating Plant', desc:'Central Heating Plant providing steam heat to campus buildings.' },
  IB:  { type:'student_services', h: 6, label:'Info Booth',    desc:'Campus information booth near the main entrance off Murray Hill Road.' },
  IN:  { type:'student_services', h: 8, label:'Health Svcs',   desc:'Decker Student Health Services Center: primary care, mental health, and wellness.' },
  MG:  { type:'utility',          h:10, label:'McGuire',       desc:'McGuire Building housing physical plant and maintenance operations.' },
  PF:  { type:'utility',          h: 8, label:'Phys Fac',      desc:'Physical Facilities building for campus operations and maintenance.' },
  PFN: { type:'utility',          h: 8, label:'Phys Fac N',    desc:'Physical Facilities North annex.' },
  TC:  { type:'student_services', h:10, label:'The Commons',   desc:'The Commons dining and social hub in the central academic area.' },
  UU:  { type:'student_services', h:14, label:'Union',         desc:'University Union — hub of student life with dining, student orgs, BingTV, game room, and the Underground.' },
  UUW: { type:'student_services', h:12, label:'Union West',    desc:'University Union West wing with additional meeting rooms and student services.' },
  // ── Athletics ─────────────────────────────────────
  EC:  { type:'athletics',        h:14, color:0x6a7880,          label:'Events Center',      desc:'6,000-seat Events Center — home of Binghamton Bearcats basketball, concerts, and commencement.' },
  GE:  { type:'athletics',        h:14, label:'East Gym',      desc:'East Gym Recreation Center: courts, pool, fitness equipment, and group fitness classes.' },
  RC:  { type:'athletics',        h:10, label:'Rockefeller',   desc:'Nelson A. Rockefeller Center with tennis courts, track, and field sports areas.' },
  WG:  { type:'athletics',        h:12, label:'West Gym',      desc:'West Gymnasium with fitness facilities, courts, and practice spaces for Bearcat teams.' },
  SM:  { type:'athletics',        h: 8, label:'Stadium',       desc:'Stadium area supporting outdoor varsity athletics.' },
  // ── Residential ───────────────────────────────────
  AH:  { type:'residential',      h:14, label:'Adirondack',    desc:'Adirondack Hall — part of the Newing College residential community.' },
  AP:  { type:'residential',      h:14, label:'Appalachian',   desc:'Appalachian Collegiate Center — south campus suite-style residential building.' },
  BE:  { type:'residential',      h:14, label:'Belmont',       desc:'Belmont Hall — Newing College corridor-style residence.' },
  BN:  { type:'residential',      h:16, label:'Bingham',       desc:'Bingham Hall — part of the east-side residential cluster.' },
  BR:  { type:'residential',      h:16, label:'Broome',        desc:'Broome Hall — east-side residence in the Dickinson Community.' },
  BY:  { type:'residential',      h:12, label:'Brandywine',    desc:'Brandywine Hall — Appalachian Collegiate Center.' },
  C4:  { type:'residential',      h:18, label:'C4 / Dickinson',desc:'Chenango-Champlain Collegiate Center (C4) — largest dining hall on campus, Dickinson Community.' },
  CA:  { type:'residential',      h:12, label:'Cayuga',        desc:'Cayuga Hall — Appalachian Collegiate Center residential building.' },
  CL:  { type:'residential',      h:14, label:'Cleveland',     desc:'Cleveland Hall — Hinman College residential building.' },
  CM:  { type:'residential',      h:10, label:'CIW Commons',   desc:'College-in-the-Woods Commons Building with dining and social spaces.' },
  CO:  { type:'utility',          h: 8, label:'Commissary',    desc:'Campus Commissary and storage facility.' },
  CS:  { type:'residential',      h:12, label:'Cascade',       desc:'Cascade Hall — Mountainview College residential building.' },
  CT:  { type:'residential',      h:14, label:'Catskill',      desc:'Catskill Hall — Newing College residential building.' },
  CU:  { type:'residential',      h:12, label:'Choconut',      desc:'Choconut Hall — Hinman College residential building.' },
  CV:  { type:'residential',      h:12, label:'Clearview',     desc:'Clearview Hall — residential building with views across campus.' },
  CW:  { type:'residential',      h:12, label:'CIW West',      desc:'College-in-the-Woods West residential building.' },
  DA:  { type:'residential',      h:14, label:'Darien',        desc:'Darien Hall — Newing College residential building.' },
  DC:  { type:'residential',      h:14, label:'Dickinson',     desc:'Dickinson Community residential building.' },
  DE:  { type:'residential',      h:16, label:'Delaware',      desc:'Delaware Hall — east-side Dickinson Community residence.' },
  DG:  { type:'residential',      h:12, label:'Digman',        desc:'Digman Hall — east-side residential building.' },
  EN:  { type:'residential',      h:16, label:'Endicott',      desc:'Endicott Hall — Dickinson Community residence on the east side.' },
  EV:  { type:'residential',      h:14, label:'Evangola',      desc:'Evangola Hall — Newing College far-west residence.' },
  FI:  { type:'residential',      h:14, label:'Filmore',       desc:'Filmore Hall — Newing College residential building.' },
  GA:  { type:'utility',          h: 8, label:'Garage',        desc:'Campus parking garage facility.' },
  GL:  { type:'residential',      h:14, label:'Glimmerglass',  desc:'Glimmerglass Hall — Newing College far-west residence.' },
  GN:  { type:'residential',      h:12, label:'Glenwood',      desc:'Glenwood Hall — Hinman College residential building.' },
  HD:  { type:'student_services', h:10, label:'Hinman Dining', desc:'Hinman College Dining Hall serving the Hinman residential community.' },
  HE:  { type:'residential',      h:14, label:'Hempstead',     desc:'Hempstead Hall — Newing College residential building.' },
  HT:  { type:'residential',      h:12, label:'Hunter',        desc:'Hunter Hall — Mountainview College residential building.' },
  HU:  { type:'residential',      h:14, label:'Hughes',        desc:'Hughes Hall — Hinman College residential building.' },
  IR:  { type:'residential',      h:12, label:'Iroquois',      desc:'Iroquois Commons — Appalachian Collegiate Center community building.' },
  JH:  { type:'residential',      h:14, label:'Jones',         desc:'Jones Hall — Newing College far-west residential building.' },
  JS:  { type:'residential',      h:12, label:'Johnson',       desc:'Johnson Hall — east-side residential building.' },
  KH:  { type:'residential',      h:14, label:'Keuka',         desc:'Keuka Hall — Newing College far-west residential building.' },
  LA:  { type:'residential',      h:14, label:'Lakeside',      desc:'Lakeside Hall — Newing College far-west residential building.' },
  LM:  { type:'residential',      h:14, label:'Lehman',        desc:'Lehman Hall — Hinman College residential building.' },
  MH:  { type:'residential',      h:14, label:'Minnewaska',    desc:'Minnewaska Hall — Newing College far-west residential building.' },
  MO:  { type:'residential',      h:14, label:'Mohawk',        desc:'Mohawk Hall — east-side residential building in the Dickinson area.' },
  MR:  { type:'residential',      h:14, label:'Marcy',         desc:'Marcy Hall — Mountainview College south-campus residential building.' },
  NA:  { type:'residential',      h:12, label:'Nanticoke',     desc:'Nanticoke Hall — Appalachian Collegiate Center residential building.' },
  NH:  { type:'residential',      h:14, label:'Nyack',         desc:'Nyack Hall — Newing College residential building.' },
  OA:  { type:'residential',      h:12, label:'Onondaga',      desc:'Onondaga Hall — Appalachian Collegiate Center residential building.' },
  OC:  { type:'residential',      h:16, label:"O'Connor",      desc:"O'Connor Hall — Dickinson Community east-side residence." },
  OD:  { type:'residential',      h:12, label:'Old Digman',    desc:'Old Digman Hall — historic east-side residential building.' },
  OH:  { type:'residential',      h:12, label:'Old Champlain', desc:'Old Champlain Hall — historic east-side residential building.' },
  OJ:  { type:'residential',      h:12, label:'Old Johnson',   desc:'Old Johnson Hall — historic east-side residential building.' },
  ON:  { type:'residential',      h:12, label:'Oneida',        desc:'Oneida Hall — Appalachian Collegiate Center residential building.' },
  OO:  { type:'residential',      h:12, label:"Old O'Connor",  desc:"Old O'Connor Hall — historic east-side residential building." },
  OR:  { type:'residential',      h:12, label:'Old Rafuse',    desc:'Old Rafuse Hall — historic east-side residential building.' },
  PH:  { type:'residential',      h:14, label:'Palisades',     desc:'Palisades Hall — Newing College far-west residential building.' },
  RA:  { type:'residential',      h:14, label:'Rafuse',        desc:'Rafuse Hall — east-side Dickinson Community residence.' },
  RO:  { type:'residential',      h:14, label:'Rockland',      desc:'Rockland Hall — Newing College far-west residential building.' },
  RS:  { type:'residential',      h:12, label:'Roosevelt',     desc:'Roosevelt Hall — Hinman College residential building.' },
  SA:  { type:'residential',      h:14, label:'Saratoga',      desc:'Saratoga Hall — Newing College far-west residential building.' },
  SE:  { type:'residential',      h:12, label:'Seneca',        desc:'Seneca Hall — Appalachian Collegiate Center residential building.' },
  SU:  { type:'residential',      h:12, label:'Susquehanna',   desc:'Susquehanna Hall — CIW-area residential and apartments.' },
  TU:  { type:'residential',      h:12, label:'Tuscarora',     desc:'Tuscarora Hall — Appalachian Collegiate Center residential building.' },
  WA:  { type:'residential',      h:12, label:'Walton',        desc:'Walton Hall — residential building in the CIW area.' },
  WH:  { type:'residential',      h:14, label:'Windham',       desc:'Windham Hall — residential building.' },
  WN:  { type:'residential',      h:12, label:'Windham N',     desc:'Windham North Hall — residential building.' },
};

export const TYPE_COLORS = {
  academic:         0xA03820, // BU warm red-orange brick (academic spine)
  residential:      0x7A3218, // darker brick — residential halls
  athletics:        0x4C5A68, // cool steel gray — Events Center / gym
  student_services: 0xB84830, // bold warm brick — Union / admin
  library:          0x9A9280, // Bartle's brutalist concrete gray-tan
  utility:          0x6E6A62, // neutral concrete gray
};

export const TYPE_LABELS = {
  academic:         'Academic',
  residential:      'Residential',
  athletics:        'Athletics & Recreation',
  student_services: 'Student Services',
  library:          'Library & Research',
  utility:          'Facilities / Utility',
};

// ── Process all 100 buildings ──────────────────────────────────────────────────
export function processBuildings() {
  const result = [];

  for (const feature of geoData.features) {
    const code = feature.properties.code;
    const meta = META[code];
    if (!meta) continue; // skip unmapped codes

    const geom = feature.geometry;
    if (!geom || geom.type !== 'Polygon') continue;

    const outerRing = geom.coordinates[0];
    if (!outerRing || outerRing.length < 3) continue;

    const shape = ringToShape(outerRing);

    // Add holes if present
    for (let h = 1; h < geom.coordinates.length; h++) {
      const hole = new THREE.Path();
      const pts = flattenCoords(geom.coordinates[h]);
      pts.forEach(([lng, lat], i) => {
        const { x, z } = lngLatToWorld(lng, lat);
        if (i === 0) hole.moveTo(x, -z);
        else hole.lineTo(x, -z);
      });
      shape.holes.push(hole);
    }

    const c = centroid(outerRing);

    // Skip buildings whose centroid is more than 660 world units from the Union
    // (catches off-campus facilities / data outliers while keeping all of main campus)
    if (Math.hypot(c.x, c.z) > 660) continue;

    // AABB bounds in world XZ for collision detection
    const allPts = flattenCoords(outerRing);
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [lng, lat] of allPts) {
      const { x, z } = lngLatToWorld(lng, lat);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }

    result.push({
      code,
      name: feature.properties.name || meta.label,
      label: meta.label,
      type: meta.type,
      h: meta.h,
      color: meta.color,        // per-building color override (hex number, optional)
      stone: meta.stone || false, // use stone/concrete texture instead of brick
      desc: meta.desc,
      shape,
      cx: c.x,
      cz: c.z,
      bounds: { minX, maxX, minZ, maxZ },
    });
  }

  return result;
}
