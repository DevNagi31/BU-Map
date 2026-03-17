import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import rawGeoData from './buildings-geo.json';
import { ROOMS, FLOOR_INFO, parseRoomQuery } from './rooms.js';

// ─── Configuration ──────────────────────────────────────────────────────────
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const BU_CENTER = [-75.9691, 42.0880];
// Lock map to campus area only
const BU_BOUNDS = [[-75.985, 42.075], [-75.948, 42.100]];

// ─── Building Metadata ──────────────────────────────────────────────────────
const META = {
  AA:  { type:'academic',         h:16, label:'Academic A',         desc:'Houses School of Management, Kaschak Institute, general-purpose lecture halls and computing labs.' },
  AB:  { type:'academic',         h:16, label:'Academic B',         desc:'Houses Student Affairs Admin, Environmental Studies, Health Promotion, Harriet Tubman Center, and PT labs.' },
  AC:  { type:'academic',         h:20, label:'Anderson Center',    desc:'Major performing arts venue: Watters Theater, Osterhout Concert Theater, and Chamber Hall.' },
  BI:  { type:'academic',         h:14, label:'Biotech',            desc:'Biotechnology Building for research in molecular biology and bioengineering.' },
  CE:  { type:'academic',         h:16, label:'Center of Excellence',desc:'Center of Excellence in Small Scale Systems Integration & Packaging.' },
  CPS: { type:'student_services', h: 8, label:'Pre-School',         desc:'Campus Pre-School serving children of students, faculty, and staff.' },
  EB:  { type:'academic',         h:20, label:'Engineering',        desc:'Main Watson School of Engineering building: electrical, mechanical, industrial, and systems engineering.' },
  ES:  { type:'academic',         h:20, label:'Eng & Science',      desc:'Engineering and Science Building with advanced research labs and classrooms.' },
  FA:  { type:'academic',         h:16, label:'Fine Arts',          desc:'Studio art, art history, and music. Painting studios, darkrooms, recital hall, and rehearsal spaces.' },
  GR:  { type:'academic',         h: 8, label:'Greenhouse',         desc:'Campus greenhouse for biology and horticulture research.' },
  ICD: { type:'academic',         h:12, label:'Child Dev',          desc:'Institute for Child Development — research and clinical training in developmental psychology.' },
  LH:  { type:'academic',         h:16, label:'Lecture Hall',       desc:'Main lecture building. Multiple tiered auditoriums seat hundreds for large introductory courses.' },
  S1:  { type:'academic',         h:24, label:'Science 1',          desc:'Biology and chemistry teaching labs, lecture rooms, and Harpur College faculty research.' },
  S2:  { type:'academic',         h:24, label:'Science 2',          desc:'Chemistry, physics, and environmental studies labs. Connected to the S1/S3 complex.' },
  S3:  { type:'academic',         h:24, label:'Science 3',          desc:'Geology, environmental science, and physics research. Part of the Science complex.' },
  S4:  { type:'academic',         h:20, label:'Science 4',          desc:'Additional science research and teaching labs within the podium complex.' },
  S5:  { type:'academic',         h:20, label:'Science 5',          desc:'Science 5 building with specialized labs supporting Harpur College STEM departments.' },
  SL:  { type:'academic',         h:12, label:'Sci Lab',            desc:'Science laboratory building supporting introductory and intermediate STEM courses.' },
  SN:  { type:'academic',         h:12, label:'Science N',          desc:'North science building with research facilities.' },
  TH:  { type:'academic',         h:12, label:'Thomas Hall',        desc:'Houses additional academic departments and seminar rooms.' },
  LN:  { type:'library',          h:48, label:'Library Tower',      desc:'Iconic Bartle Library tower visible from across campus. Houses upper reading rooms and research collections.' },
  LS:  { type:'library',          h:16, label:'Bartle Library',     desc:'Glenn G. Bartle Library — main library. Over 2 million volumes, Special Collections, and study areas.' },
  LT:  { type:'library',          h:48, label:'Library Tower',      desc:'Library Tower — part of the Bartle Library complex.' },
  AD:  { type:'student_services', h:12, label:'Admin',              desc:'Couper Administration Building — offices of President, Provost, Bursar, Registrar, and Financial Aid.' },
  AM:  { type:'student_services', h:10, label:'Admissions',         desc:'Admissions Center. Welcome center for prospective students and families.' },
  GW:  { type:'student_services', h:10, label:'Gateway W',          desc:'Gateway West building near the north campus entrance.' },
  HP:  { type:'utility',          h:14, label:'Heating Plant',      desc:'Central Heating Plant providing steam heat to campus buildings.' },
  IB:  { type:'student_services', h: 6, label:'Info Booth',         desc:'Campus information booth near the main entrance off Murray Hill Road.' },
  IN:  { type:'student_services', h: 8, label:'Health Svcs',        desc:'Decker Student Health Services Center: primary care, mental health, and wellness.' },
  MG:  { type:'utility',          h:10, label:'McGuire',            desc:'McGuire Building housing physical plant and maintenance operations.' },
  PF:  { type:'utility',          h: 8, label:'Phys Fac',           desc:'Physical Facilities building for campus operations and maintenance.' },
  PFN: { type:'utility',          h: 8, label:'Phys Fac N',         desc:'Physical Facilities North annex.' },
  TC:  { type:'student_services', h:10, label:'The Commons',        desc:'The Commons dining and social hub in the central academic area.' },
  UU:  { type:'student_services', h:14, label:'University Union',   desc:'University Union — hub of student life with dining, student orgs, BingTV, game room, and the Underground.' },
  UUW: { type:'student_services', h:12, label:'Union West',         desc:'University Union West wing with additional meeting rooms and student services.' },
  EC:  { type:'athletics',        h:14, label:'Events Center',      desc:'6,000-seat Events Center — home of Binghamton Bearcats basketball, concerts, and commencement.' },
  GE:  { type:'athletics',        h:14, label:'East Gym',           desc:'East Gym Recreation Center: courts, pool, fitness equipment, and group fitness classes.' },
  RC:  { type:'athletics',        h:10, label:'Rockefeller Center', desc:'Nelson A. Rockefeller Center with tennis courts, track, and field sports areas.' },
  WG:  { type:'athletics',        h:12, label:'West Gym',           desc:'West Gymnasium with fitness facilities, courts, and practice spaces for Bearcat teams.' },
  SM:  { type:'athletics',        h: 8, label:'Stadium',            desc:'Stadium area supporting outdoor varsity athletics.' },
  AH:  { type:'residential',      h:14, label:'Adirondack',         desc:'Adirondack Hall — part of the Newing College residential community.' },
  AP:  { type:'residential',      h:14, label:'Appalachian',        desc:'Appalachian Collegiate Center — south campus suite-style residential building.' },
  BE:  { type:'residential',      h:14, label:'Belmont',            desc:'Belmont Hall — Newing College corridor-style residence.' },
  BN:  { type:'residential',      h:16, label:'Bingham',            desc:'Bingham Hall — part of the east-side residential cluster.' },
  BR:  { type:'residential',      h:16, label:'Broome',             desc:'Broome Hall — east-side residence in the Dickinson Community.' },
  BY:  { type:'residential',      h:12, label:'Brandywine',         desc:'Brandywine Hall — Appalachian Collegiate Center.' },
  C4:  { type:'residential',      h:18, label:'C4 / Dickinson',     desc:'Chenango-Champlain Collegiate Center (C4) — largest dining hall on campus, Dickinson Community.' },
  CA:  { type:'residential',      h:12, label:'Cayuga',             desc:'Cayuga Hall — Appalachian Collegiate Center residential building.' },
  CL:  { type:'residential',      h:14, label:'Cleveland',          desc:'Cleveland Hall — Hinman College residential building.' },
  CM:  { type:'residential',      h:10, label:'CIW Commons',        desc:'College-in-the-Woods Commons Building with dining and social spaces.' },
  CO:  { type:'utility',          h: 8, label:'Commissary',         desc:'Campus Commissary and storage facility.' },
  CS:  { type:'residential',      h:12, label:'Cascade',            desc:'Cascade Hall — Mountainview College residential building.' },
  CT:  { type:'residential',      h:14, label:'Catskill',           desc:'Catskill Hall — Newing College residential building.' },
  CU:  { type:'residential',      h:12, label:'Choconut',           desc:'Choconut Hall — Hinman College residential building.' },
  CV:  { type:'residential',      h:12, label:'Clearview',          desc:'Clearview Hall — residential building with views across campus.' },
  CW:  { type:'residential',      h:12, label:'CIW West',           desc:'College-in-the-Woods West residential building.' },
  DA:  { type:'residential',      h:14, label:'Darien',             desc:'Darien Hall — Newing College residential building.' },
  DC:  { type:'residential',      h:14, label:'Dickinson',          desc:'Dickinson Community residential building.' },
  DE:  { type:'residential',      h:16, label:'Delaware',           desc:'Delaware Hall — east-side Dickinson Community residence.' },
  DG:  { type:'residential',      h:12, label:'Digman',             desc:'Digman Hall — east-side residential building.' },
  EN:  { type:'residential',      h:16, label:'Endicott',           desc:'Endicott Hall — Dickinson Community residence on the east side.' },
  EV:  { type:'residential',      h:14, label:'Evangola',           desc:'Evangola Hall — Newing College far-west residence.' },
  FI:  { type:'residential',      h:14, label:'Filmore',            desc:'Filmore Hall — Newing College residential building.' },
  GA:  { type:'utility',          h: 8, label:'Garage',             desc:'Campus parking garage facility.' },
  GL:  { type:'residential',      h:14, label:'Glimmerglass',       desc:'Glimmerglass Hall — Newing College far-west residence.' },
  GN:  { type:'residential',      h:12, label:'Glenwood',           desc:'Glenwood Hall — Hinman College residential building.' },
  HD:  { type:'student_services', h:10, label:'Hinman Dining',      desc:'Hinman College Dining Hall serving the Hinman residential community.' },
  HE:  { type:'residential',      h:14, label:'Hempstead',          desc:'Hempstead Hall — Newing College residential building.' },
  HT:  { type:'residential',      h:12, label:'Hunter',             desc:'Hunter Hall — Mountainview College residential building.' },
  HU:  { type:'residential',      h:14, label:'Hughes',             desc:'Hughes Hall — Hinman College residential building.' },
  IR:  { type:'residential',      h:12, label:'Iroquois',           desc:'Iroquois Commons — Appalachian Collegiate Center community building.' },
  JH:  { type:'residential',      h:14, label:'Jones',              desc:'Jones Hall — Newing College far-west residential building.' },
  JS:  { type:'residential',      h:12, label:'Johnson',            desc:'Johnson Hall — east-side residential building.' },
  KH:  { type:'residential',      h:14, label:'Keuka',              desc:'Keuka Hall — Newing College far-west residential building.' },
  LA:  { type:'residential',      h:14, label:'Lakeside',           desc:'Lakeside Hall — Newing College far-west residential building.' },
  LM:  { type:'residential',      h:14, label:'Lehman',             desc:'Lehman Hall — Hinman College residential building.' },
  MH:  { type:'residential',      h:14, label:'Minnewaska',         desc:'Minnewaska Hall — Newing College far-west residential building.' },
  MO:  { type:'residential',      h:14, label:'Mohawk',             desc:'Mohawk Hall — east-side residential building in the Dickinson area.' },
  MR:  { type:'residential',      h:14, label:'Marcy',              desc:'Marcy Hall — Mountainview College south-campus residential building.' },
  NA:  { type:'residential',      h:12, label:'Nanticoke',          desc:'Nanticoke Hall — Appalachian Collegiate Center residential building.' },
  NH:  { type:'residential',      h:14, label:'Nyack',              desc:'Nyack Hall — Newing College residential building.' },
  OA:  { type:'residential',      h:12, label:'Onondaga',           desc:'Onondaga Hall — Appalachian Collegiate Center residential building.' },
  OC:  { type:'residential',      h:16, label:"O'Connor",           desc:"O'Connor Hall — Dickinson Community east-side residence." },
  OD:  { type:'residential',      h:12, label:'Old Digman',         desc:'Old Digman Hall — historic east-side residential building.' },
  OH:  { type:'residential',      h:12, label:'Old Champlain',      desc:'Old Champlain Hall — historic east-side residential building.' },
  OJ:  { type:'residential',      h:12, label:'Old Johnson',        desc:'Old Johnson Hall — historic east-side residential building.' },
  ON:  { type:'residential',      h:12, label:'Oneida',             desc:'Oneida Hall — Appalachian Collegiate Center residential building.' },
  OO:  { type:'residential',      h:12, label:"Old O'Connor",       desc:"Old O'Connor Hall — historic east-side residential building." },
  OR:  { type:'residential',      h:12, label:'Old Rafuse',         desc:'Old Rafuse Hall — historic east-side residential building.' },
  PH:  { type:'residential',      h:14, label:'Palisades',          desc:'Palisades Hall — Newing College far-west residential building.' },
  RA:  { type:'residential',      h:14, label:'Rafuse',             desc:'Rafuse Hall — east-side Dickinson Community residence.' },
  RO:  { type:'residential',      h:14, label:'Rockland',           desc:'Rockland Hall — Newing College far-west residential building.' },
  RS:  { type:'residential',      h:12, label:'Roosevelt',          desc:'Roosevelt Hall — Hinman College residential building.' },
  SA:  { type:'residential',      h:14, label:'Saratoga',           desc:'Saratoga Hall — Newing College far-west residential building.' },
  SE:  { type:'residential',      h:12, label:'Seneca',             desc:'Seneca Hall — Appalachian Collegiate Center residential building.' },
  SU:  { type:'residential',      h:12, label:'Susquehanna',        desc:'Susquehanna Hall — CIW-area residential and apartments.' },
  TU:  { type:'residential',      h:12, label:'Tuscarora',          desc:'Tuscarora Hall — Appalachian Collegiate Center residential building.' },
  WA:  { type:'residential',      h:12, label:'Walton',             desc:'Walton Hall — residential building in the CIW area.' },
  WH:  { type:'residential',      h:14, label:'Windham',            desc:'Windham Hall — residential building.' },
  WN:  { type:'residential',      h:12, label:'Windham N',          desc:'Windham North Hall — residential building.' },
  CR:  { type:'academic',         h:12, label:'Classroom',          desc:'General-purpose classroom building.' },
};

const TYPE_COLORS = {
  academic:         '#c4a888',
  residential:      '#8aabb8',
  athletics:        '#7a9ab0',
  student_services: '#d0a070',
  library:          '#a09a90',
  utility:          '#908880',
};

const TYPE_LABELS = {
  academic:         'Academic',
  residential:      'Residential',
  athletics:        'Athletics & Recreation',
  student_services: 'Student Services',
  library:          'Library & Research',
  utility:          'Facilities / Utility',
};

// ─── POI Locations (verified from OpenStreetMap) ────────────────────────────
const PARKING_LOTS = [
  { name: 'Lot A',  lng: -75.9672776, lat: 42.0895558 },
  { name: 'Lot B1', lng: -75.9659300, lat: 42.0888016 },
  { name: 'Lot C',  lng: -75.9695777, lat: 42.0910864 },
  { name: 'Lot D',  lng: -75.9679864, lat: 42.0902985 },
  { name: 'Lot E',  lng: -75.9664336, lat: 42.0917958 },
  { name: 'Lot F',  lng: -75.9720450, lat: 42.0922742 },
  { name: 'Lot G',  lng: -75.9706302, lat: 42.0927686 },
  { name: 'Lot H',  lng: -75.9740096, lat: 42.0922109 },
  { name: 'Lot I',  lng: -75.9746115, lat: 42.0921963 },
  { name: 'Lot J',  lng: -75.9583035, lat: 42.0930158 },
  { name: 'Lot K',  lng: -75.9716402, lat: 42.0894119 },
  { name: 'Lot L',  lng: -75.9732061, lat: 42.0877868 },
  { name: 'Lot LT', lng: -75.9701644, lat: 42.0880384 },
  { name: 'Lot M1', lng: -75.9737162, lat: 42.0854880 },
  { name: 'Lot M4', lng: -75.9753463, lat: 42.0884622 },
  { name: 'Lot N',  lng: -75.9722501, lat: 42.0854775 },
  { name: 'Lot O1', lng: -75.9653597, lat: 42.0855705 },
  { name: 'Lot P',  lng: -75.9651449, lat: 42.0862330 },
  { name: 'Lot Q1', lng: -75.9673320, lat: 42.0866747 },
  { name: 'Lot S1', lng: -75.9624114, lat: 42.0899588 },
  { name: 'Lot T',  lng: -75.9646724, lat: 42.0876267 },
  { name: 'Lot U',  lng: -75.9634042, lat: 42.0891834 },
  { name: 'Lot V',  lng: -75.9643296, lat: 42.0854099 },
  { name: 'Lot W',  lng: -75.9696925, lat: 42.0861957 },
  { name: 'Lot X',  lng: -75.9748290, lat: 42.0864302 },
  { name: 'Lot Y1', lng: -75.9716807, lat: 42.0848747 },
  { name: 'Lot Z',  lng: -75.9770527, lat: 42.0894478 },
];

const DINING_LOCATIONS = [
  { name: 'CIW Dining Hall',              lng: -75.9735, lat: 42.0870, hours: 'Mon–Thu 7am–8:30pm · Fri 7am–1:30pm · Sat–Sun 11am–1:30pm', url: 'https://binghamton.sodexomyway.com/en-us/locations/ciw-dining-hall' },
  { name: 'Hinman Dining Hall',            lng: -75.9715, lat: 42.0856, hours: 'Mon–Fri 8am–8pm · Sat–Sun 11am–8pm', url: 'https://binghamton.sodexomyway.com/en-us/locations/hinman-dining-hall' },
  { name: 'Appalachian Dining (Iroquois)', lng: -75.9680, lat: 42.0840, hours: 'Mon–Fri 8am–8pm · Sat–Sun 11am–8pm', url: 'https://binghamton.sodexomyway.com/en-us/locations/appalachian-dining-hall' },
  { name: 'C4 Dining Hall',               lng: -75.9650, lat: 42.0875, hours: 'Mon–Fri 8am–8pm · Sat–Sun 9am–8pm', url: 'https://binghamton.sodexomyway.com/en-us/locations/c4-dining-hall' },
  { name: 'Newing Dining Hall',            lng: -75.9798, lat: 42.0863, hours: 'Mon–Fri 8am–8pm · Sat–Sun 11am–8pm', url: 'https://binghamton.sodexomyway.com/en-us/locations/hours' },
  { name: 'University Union Food Court',   lng: -75.9685, lat: 42.0878, hours: 'Mon–Fri 7:30am–10pm · Sat–Sun 10am–9pm', url: 'https://binghamton.sodexomyway.com/en-us/locations/hours' },
  { name: "Dunkin'",                       lng: -75.9667401, lat: 42.0873674, hours: 'Mon–Fri 7am–9pm', url: 'https://binghamton.sodexomyway.com/en-us/locations/hours' },
  { name: '2nd Heaven Cafe',              lng: -75.9669962, lat: 42.0883624, hours: 'Mon–Fri 8am–4pm', url: 'https://binghamton.sodexomyway.com/en-us/locations/hours' },
  { name: 'Starbucks',                    lng: -75.9645592, lat: 42.0885510, hours: 'Mon–Fri 7:30am–8pm · Sat–Sun 10am–6pm', url: 'https://binghamton.sodexomyway.com/en-us/locations/hours' },
];

const BUS_STOPS = [
  // On-campus OCCT stops (from OSM)
  { name: 'BU Union',                   lng: -75.9670718, lat: 42.0870401 },
  { name: 'Mohawk Hall',                lng: -75.9659381, lat: 42.0869159 },
  { name: 'Mountainview',               lng: -75.9703247, lat: 42.0840397 },
  { name: 'Academic A / SOM',           lng: -75.9731883, lat: 42.0887266 },
  { name: 'Newing',                     lng: -75.9628280, lat: 42.0883942 },
  { name: 'East Gym',                   lng: -75.9672679, lat: 42.0909313 },
  { name: 'Couper Admin',               lng: -75.9657496, lat: 42.0897009 },
  { name: 'West Gym',                   lng: -75.9709546, lat: 42.0917267 },
  { name: 'McGuire',                    lng: -75.9739441, lat: 42.0915817 },
  { name: 'Clearview',                  lng: -75.9744440, lat: 42.0890762 },
  { name: 'Susquehanna / Lot M',        lng: -75.9744503, lat: 42.0862408 },
  { name: 'Hillside',                   lng: -75.9782362, lat: 42.0871458 },
  { name: 'Hinman',                     lng: -75.9731461, lat: 42.0883537 },
  { name: 'Decker / Lot O',             lng: -75.9649278, lat: 42.0851033 },
  { name: 'ITC',                        lng: -75.9588043, lat: 42.0934164 },
];

// ─── GeoJSON Processing ─────────────────────────────────────────────────────
function fixCoordinates(coords) {
  return coords.map(ring => {
    const fixed = [];
    for (const c of ring) {
      if (c.length === 4) {
        fixed.push([c[0], c[1]]);
        fixed.push([c[2], c[3]]);
      } else if (c.length >= 2) {
        fixed.push([c[0], c[1]]);
      }
    }
    return fixed;
  });
}

function enrichGeoJSON(data) {
  const features = [];
  for (const feature of data.features) {
    const code = feature.properties.code;
    const meta = META[code];
    if (!meta) continue;
    const coords = fixCoordinates(feature.geometry.coordinates);
    const ring = coords[0];
    if (!ring || ring.length < 3) continue;
    const cx = ring.reduce((s, c) => s + c[0], 0) / ring.length;
    const cy = ring.reduce((s, c) => s + c[1], 0) / ring.length;
    const dist = Math.hypot((cx - BU_CENTER[0]) * 82489, (cy - BU_CENTER[1]) * 111000);
    if (dist > 1500) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: coords },
      properties: {
        code,
        name: feature.properties.name || meta.label,
        label: meta.label,
        btype: meta.type,
        height: meta.h,
        base_height: 0,
        desc: meta.desc,
        color: TYPE_COLORS[meta.type] || '#aa9988',
        floors: Math.max(1, Math.round(meta.h / 4)),
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

function pointsToGeoJSON(points) {
  return {
    type: 'FeatureCollection',
    features: points.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { name: p.name },
    })),
  };
}

// ─── All building data for search ───────────────────────────────────────────
const allBuildings = [];
for (const feature of rawGeoData.features) {
  const code = feature.properties.code;
  const meta = META[code];
  if (!meta) continue;
  const coords = fixCoordinates(feature.geometry.coordinates);
  const ring = coords[0];
  if (!ring || ring.length < 3) continue;
  const cx = ring.reduce((s, c) => s + c[0], 0) / ring.length;
  const cy = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  const dist = Math.hypot((cx - BU_CENTER[0]) * 82489, (cy - BU_CENTER[1]) * 111000);
  if (dist > 1500) continue;
  allBuildings.push({
    code,
    name: feature.properties.name || meta.label,
    label: meta.label,
    type: meta.type,
    desc: meta.desc,
    floors: Math.max(1, Math.round(meta.h / 4)),
    lng: cx,
    lat: cy,
  });
}

// ─── Map Initialization ─────────────────────────────────────────────────────
const map = new maplibregl.Map({
  container: 'map',
  style: MAP_STYLE,
  center: BU_CENTER,
  zoom: 15.5,
  pitch: 0,
  bearing: 0,
  antialias: true,
  minZoom: 14,
  maxZoom: 18.5,
  maxBounds: BU_BOUNDS,
});

// Navigation controls
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

// Geolocation
const geolocate = new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true,
});
map.addControl(geolocate, 'bottom-right');

// Scale
map.addControl(new maplibregl.ScaleControl({ maxWidth: 150 }), 'bottom-left');

// Track user position for navigation
let userLocation = null;
let navActive = false;
let navDest = null;       // [lng, lat]
let navResult = null;     // the search result being navigated to
let navArrived = false;

geolocate.on('geolocate', (e) => {
  userLocation = [e.coords.longitude, e.coords.latitude];
  // Only live-update route if navigating from own location (not a custom start)
  if (navActive && navDest && !navArrived && !goFromLocation) {
    updateLiveNavigation();
  }
});

// ─── Map Load ───────────────────────────────────────────────────────────────
map.on('load', () => {
  const buildings = enrichGeoJSON(rawGeoData);

  // ── Customize base map style ──
  const layers = map.getStyle().layers;
  for (const layer of layers) {
    if (layer.id.includes('park') || layer.id.includes('landuse')) {
      try { map.setPaintProperty(layer.id, 'fill-color', '#d4eec8'); } catch {}
    }
    if (layer.id.includes('building') && layer.type === 'fill-extrusion') {
      map.setLayoutProperty(layer.id, 'visibility', 'none');
    }
  }

  // ── Building source ──
  map.addSource('bu-buildings', { type: 'geojson', data: buildings });

  // ── 3D Building extrusion ──
  map.addLayer({
    id: 'bu-buildings-3d',
    type: 'fill-extrusion',
    source: 'bu-buildings',
    paint: {
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.88,
    },
  });

  // ── Building outline ──
  map.addLayer({
    id: 'bu-buildings-outline',
    type: 'line',
    source: 'bu-buildings',
    paint: { 'line-color': 'rgba(0,0,0,0.15)', 'line-width': 1 },
  });

  // ── Building labels — always show name ──
  // Use a dedicated HTML marker approach since symbol layers depend on glyphs
  for (const feature of buildings.features) {
    const props = feature.properties;
    const ring = feature.geometry.coordinates[0];
    if (!ring || !ring.length) continue;
    const cx = ring.reduce((s, c) => s + c[0], 0) / ring.length;
    const cy = ring.reduce((s, c) => s + c[1], 0) / ring.length;

    const el = document.createElement('div');
    el.className = 'building-marker';
    el.innerHTML = `<span class="bm-code">${props.code}</span><span class="bm-name">${props.label}</span>`;

    new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([cx, cy])
      .addTo(map);
  }

  // ── POI HTML Markers with info popups ──
  function createPOIMarkers(locations, cssClass, letter, visible, popupFn) {
    const markers = [];
    locations.forEach(loc => {
      const el = document.createElement('div');
      el.className = `poi-marker ${cssClass}`;
      el.innerHTML = `<span>${letter}</span>`;
      el.title = loc.name;
      if (!visible) el.style.display = 'none';

      const popup = new maplibregl.Popup({ offset: 18, closeButton: true, maxWidth: '280px' })
        .setHTML(popupFn(loc));

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(popup)
        .addTo(map);

      markers.push({ marker, el });
    });
    return markers;
  }

  // Parking popup
  function parkingPopup(loc) {
    return `<div class="poi-popup">
      <div class="poi-popup-icon poi-parking-bg">P</div>
      <div class="poi-popup-body">
        <strong>${loc.name}</strong>
        <p>Check average availability by day &amp; time on the TAPS website.</p>
        <div class="poi-popup-links">
          <a href="https://www.binghamton.edu/services/transportation-and-parking/parking/parking-availability/" target="_blank" rel="noopener">Lot Availability</a>
          <a href="https://www.binghamton.edu/services/transportation-and-parking/parking/student-permits/" target="_blank" rel="noopener">Permits</a>
        </div>
      </div>
    </div>`;
  }

  // Dining popup
  function diningPopup(loc) {
    return `<div class="poi-popup">
      <div class="poi-popup-icon poi-dining-bg">D</div>
      <div class="poi-popup-body">
        <strong>${loc.name}</strong>
        <p class="poi-hours">${loc.hours || ''}</p>
        <p class="poi-note">Hours may vary during breaks &amp; holidays.</p>
        <div class="poi-popup-links">
          <a href="${loc.url || 'https://binghamton.sodexomyway.com/en-us/locations/hours'}" target="_blank" rel="noopener">Full Menu &amp; Hours</a>
        </div>
      </div>
    </div>`;
  }

  // Bus stop popup
  function busPopup(loc) {
    return `<div class="poi-popup">
      <div class="poi-popup-icon poi-bus-bg">B</div>
      <div class="poi-popup-body">
        <strong>${loc.name}</strong>
        <p>OCCT &amp; BC Transit buses stop here. Free with BU ID.</p>
        <p class="poi-note">Download <strong>ETA SPOT</strong> app for real-time bus tracking.</p>
        <div class="poi-popup-links">
          <a href="https://occtransport.org/pages/routeschedule.html" target="_blank" rel="noopener">OCCT Schedules</a>
          <a href="https://www.binghamton.edu/services/transportation-and-parking/buses-and-shuttles/" target="_blank" rel="noopener">BU Shuttles</a>
        </div>
      </div>
    </div>`;
  }

  window._poiMarkers = {
    parking: createPOIMarkers(PARKING_LOTS, 'poi-parking', 'P', true, parkingPopup),
    dining:  createPOIMarkers(DINING_LOCATIONS, 'poi-dining', 'D', true, diningPopup),
    bus:     createPOIMarkers(BUS_STOPS, 'poi-bus', 'B', true, busPopup),
  };

  // (Route is drawn as SVG overlay + HTML markers — see drawRoute)

  // ── Building interactions ──
  let hoveredCode = null;

  map.on('click', 'bu-buildings-3d', (e) => {
    if (!e.features.length) return;
    const props = e.features[0].properties;
    showBuilding(props);
    flyToBuilding(props.code);
  });

  map.on('mouseenter', 'bu-buildings-3d', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mousemove', 'bu-buildings-3d', (e) => {
    if (!e.features.length) return;
    const props = e.features[0].properties;
    tooltip.style.display = 'block';
    tooltip.style.left = `${e.point.x + 14}px`;
    tooltip.style.top = `${e.point.y - 40}px`;
    tooltip.innerHTML = `${props.name}<span class="tt-type">${TYPE_LABELS[props.btype] || props.btype}</span>`;
    if (hoveredCode !== props.code) {
      hoveredCode = props.code;
      map.setPaintProperty('bu-buildings-3d', 'fill-extrusion-opacity', [
        'case', ['==', ['get', 'code'], hoveredCode], 1.0, 0.88,
      ]);
    }
  });

  map.on('mouseleave', 'bu-buildings-3d', () => {
    map.getCanvas().style.cursor = '';
    tooltip.style.display = 'none';
    hoveredCode = null;
    map.setPaintProperty('bu-buildings-3d', 'fill-extrusion-opacity', 0.88);
  });

  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['bu-buildings-3d'] });
    if (!features.length) {
      closeInfoPanel();
    }
  });

  // ── Loading done ──
  setTimeout(() => {
    const el = document.getElementById('loading');
    if (el) el.classList.add('done');
  }, 800);
});

map.on('idle', () => {
  const el = document.getElementById('loading');
  if (el && !el.classList.contains('done')) el.classList.add('done');
});

// ─── UI Elements ────────────────────────────────────────────────────────────
const infoPanel     = document.getElementById('info-panel');
const panelAccent   = document.getElementById('panel-accent');
const panelTag      = document.getElementById('panel-tag');
const panelName     = document.getElementById('panel-name');
const panelAddress  = document.getElementById('panel-address');
const panelType     = document.getElementById('panel-type');
const panelFloors   = document.getElementById('panel-floors');
const panelDesc     = document.getElementById('panel-desc');
const panelNav      = document.getElementById('panel-nav');
const panelNavSteps = document.getElementById('panel-nav-steps');
const tooltip       = document.getElementById('tooltip');

// ─── Helper: fly to building ────────────────────────────────────────────────
function flyToBuilding(code) {
  const b = allBuildings.find(b => b.code === code);
  if (b) map.flyTo({ center: [b.lng, b.lat], zoom: 16.5, pitch: 0, duration: 1200 });
}

// ─── Helper: get building centroid ──────────────────────────────────────────
function getBuildingCoords(code) {
  const b = allBuildings.find(b => b.code === code);
  return b ? [b.lng, b.lat] : null;
}

// ─── Show building info panel ───────────────────────────────────────────────
let currentBuildingCode = null;

function showBuilding(props, room = null) {
  currentBuildingCode = props.code;
  lastSelectedBuilding = props;
  lastSelectedRoom = room;
  const typeColor = TYPE_COLORS[props.btype] || '#888888';
  panelAccent.style.background = typeColor;
  panelTag.textContent     = TYPE_LABELS[props.btype] || props.btype;
  panelName.textContent    = room ? `${props.name} — Room ${room.id}` : props.name;
  panelAddress.textContent = props.code;
  panelType.textContent    = TYPE_LABELS[props.btype] || props.btype;
  panelFloors.textContent  = props.floors;
  panelDesc.textContent    = props.desc;

  // Navigation steps
  if (room) {
    const fi = FLOOR_INFO[room.floor] || { label: `Floor ${room.floor}`, stairs: `Go to floor ${room.floor}` };
    panelNavSteps.innerHTML = `
      <div class="nav-step">
        <div class="step-num">1</div>
        <div class="step-text">Walk to <strong>${props.name}</strong></div>
      </div>
      <div class="nav-step">
        <div class="step-num">2</div>
        <div class="step-text">${fi.stairs}</div>
      </div>
      <div class="nav-step">
        <div class="step-num">3</div>
        <div class="step-text">Find room <strong>${props.code} ${room.id}</strong> — ${room.desc}</div>
      </div>
    `;
    panelNav.style.display = 'block';
  } else {
    panelNav.style.display = 'none';
  }

  infoPanel.classList.add('visible');
}

function closeInfoPanel() {
  infoPanel.classList.remove('visible');
  currentBuildingCode = null;
  clearRoute();
}

document.getElementById('close-btn').addEventListener('click', closeInfoPanel);

// ─── Route drawing ──────────────────────────────────────────────────────────
// ── SVG route overlay (renders above 3D buildings) ──
const routeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
routeSvg.id = 'route-svg';
routeSvg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';
document.getElementById('map').appendChild(routeSvg);

let routeFrom = null;
let routeTo = null;
let routeStartMarkerEl = null;
let routeEndMarkerEl = null;

function updateRouteSvg() {
  if (!routeFrom || !routeTo) { routeSvg.innerHTML = ''; return; }
  const p1 = map.project(routeFrom);
  const p2 = map.project(routeTo);
  routeSvg.setAttribute('viewBox', `0 0 ${map.getCanvas().width / devicePixelRatio} ${map.getCanvas().height / devicePixelRatio}`);
  routeSvg.innerHTML = `
    <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"
      stroke="#4285F4" stroke-width="12" stroke-opacity="0.18" stroke-linecap="round"/>
    <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"
      stroke="#4285F4" stroke-width="5" stroke-dasharray="8,10"
      stroke-linecap="round" stroke-opacity="0.9"/>
  `;
}

// Re-draw SVG route on every map movement
map.on('move', updateRouteSvg);
map.on('resize', updateRouteSvg);

function drawRoute(from, to) {
  routeFrom = from;
  routeTo = to;
  updateRouteSvg();

  // Remove old HTML markers
  if (routeStartMarkerEl) { routeStartMarkerEl.remove(); routeStartMarkerEl = null; }
  if (routeEndMarkerEl) { routeEndMarkerEl.remove(); routeEndMarkerEl = null; }

  // Create HTML dot markers (always on top of 3D buildings)
  const startEl = document.createElement('div');
  startEl.className = 'route-dot route-dot-start';
  routeStartMarkerEl = new maplibregl.Marker({ element: startEl, anchor: 'center' })
    .setLngLat(from).addTo(map);

  const endEl = document.createElement('div');
  endEl.className = 'route-dot route-dot-end';
  routeEndMarkerEl = new maplibregl.Marker({ element: endEl, anchor: 'center' })
    .setLngLat(to).addTo(map);
}

function clearRoute() {
  routeFrom = null;
  routeTo = null;
  routeSvg.innerHTML = '';
  if (routeStartMarkerEl) { routeStartMarkerEl.remove(); routeStartMarkerEl = null; }
  if (routeEndMarkerEl) { routeEndMarkerEl.remove(); routeEndMarkerEl = null; }
}

// ─── GO Navigation ──────────────────────────────────────────────────────────
const goModal      = document.getElementById('go-modal');
const goInput      = document.getElementById('go-input');
const goFromInput  = document.getElementById('go-from-input');
const goResults    = document.getElementById('go-results');
const goFromResults= document.getElementById('go-from-results');
const goClose      = document.getElementById('go-close');
const goDirections = document.getElementById('go-directions');
const goSteps      = document.getElementById('go-steps');
const goClear      = document.getElementById('go-clear');
const navLiveDist  = document.getElementById('nav-live-dist');
const navLiveTime  = document.getElementById('nav-live-time');
const navStopBtn   = document.getElementById('nav-stop-btn');

// From state: null = "My Location", otherwise { name, lng, lat }
let goFromLocation = null;
// Track last selected building/room from main search bar for prefill
let lastSelectedBuilding = null;
let lastSelectedRoom = null;
// Which field is actively searching: 'from' or 'to'
let activeSearchField = null;

function setFromMyLocation() {
  goFromLocation = null;
  goFromInput.value = 'My Location';
  goFromInput.classList.add('has-value');
  goFromResults.style.display = 'none';
}

function setFromBuilding(b) {
  goFromLocation = { name: b.name, lng: b.lng, lat: b.lat };
  goFromInput.value = b.name;
  goFromInput.classList.add('has-value');
  goFromResults.style.display = 'none';
  // If destination is already set, trigger navigation
  tryAutoNavigate();
}

function tryAutoNavigate() {
  // Auto-navigate when both from and to are set
  if (pendingToResult && (goFromLocation || goFromInput.value === 'My Location')) {
    navigateTo(pendingToResult);
  }
}

let pendingToResult = null;

function openGoModal(prefill = false) {
  goModal.classList.add('visible');
  goResults.style.display = 'none';
  goFromResults.style.display = 'none';
  goDirections.style.display = 'none';
  pendingToResult = null;
  setFromMyLocation();

  if (prefill && lastSelectedBuilding) {
    const b = allBuildings.find(ab => ab.code === lastSelectedBuilding.code);
    if (b) {
      if (lastSelectedRoom) {
        goInput.value = `${b.code} ${lastSelectedRoom.id}`;
        pendingToResult = { type: 'room', building: b, room: lastSelectedRoom, code: b.code };
      } else {
        goInput.value = b.name;
        pendingToResult = { type: 'building', building: b };
      }
      goInput.classList.add('has-value');
      navigateTo(pendingToResult);
      return;
    }
  }

  goInput.value = '';
  goInput.classList.remove('has-value');
  setTimeout(() => goInput.focus(), 100);
}

document.getElementById('btn-go').addEventListener('click', () => openGoModal(true));
document.getElementById('go-fab').addEventListener('click', () => openGoModal(false));

goClose.addEventListener('click', () => {
  goModal.classList.remove('visible');
  stopNavigation();
});

goClear.addEventListener('click', () => {
  stopNavigation();
  goInput.value = '';
  goInput.classList.remove('has-value');
  pendingToResult = null;
  goResults.style.display = 'none';
  goFromResults.style.display = 'none';
  setFromMyLocation();
  goInput.focus();
});

// ── FROM field search ──
goFromInput.addEventListener('focus', () => {
  activeSearchField = 'from';
  if (goFromInput.value === 'My Location') {
    goFromInput.value = '';
    goFromInput.classList.remove('has-value');
  }
  goResults.style.display = 'none'; // hide other dropdown
});

goFromInput.addEventListener('blur', () => {
  setTimeout(() => {
    goFromResults.style.display = 'none';
    if (!goFromInput.value.trim()) setFromMyLocation();
  }, 200);
});

goFromInput.addEventListener('input', () => {
  const q = goFromInput.value.trim().toLowerCase();
  if (!q) { goFromResults.style.display = 'none'; return; }

  const matches = allBuildings
    .filter(b => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q))
    .slice(0, 5);

  // Always show "My Location" as first option
  let html = `
    <div class="go-result-item" data-from-action="myloc">
      <div class="go-result-icon myloc">&#x25CE;</div>
      <div>
        <div class="go-result-name">My Location</div>
        <div class="go-result-sub">Use GPS position</div>
      </div>
    </div>`;
  matches.forEach((b, i) => {
    html += `<div class="go-result-item" data-from-action="bld" data-idx="${i}">
      <div class="go-result-icon">&#x2302;</div>
      <div>
        <div class="go-result-name">${b.name}</div>
        <div class="go-result-sub">${b.code}</div>
      </div>
    </div>`;
  });
  goFromResults.innerHTML = html;

  goFromResults.querySelector('[data-from-action="myloc"]').addEventListener('mousedown', (e) => {
    e.preventDefault();
    setFromMyLocation();
    goInput.focus();
  });
  goFromResults.querySelectorAll('[data-from-action="bld"]').forEach(el => {
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      setFromBuilding(matches[parseInt(el.dataset.idx)]);
      goInput.focus();
    });
  });

  goFromResults.style.display = 'block';
});

// ── TO field search ──
goInput.addEventListener('focus', () => {
  activeSearchField = 'to';
  goFromResults.style.display = 'none'; // hide other dropdown
});

goInput.addEventListener('blur', () => {
  setTimeout(() => { goResults.style.display = 'none'; }, 200);
});

goInput.addEventListener('input', () => {
  const q = goInput.value.trim();
  if (!q) { goResults.style.display = 'none'; goInput.classList.remove('has-value'); return; }

  const results = [];

  // Room queries (e.g., "AA 200", "LH 101")
  const roomParse = parseRoomQuery(q);
  if (roomParse) {
    const { code, roomQuery } = roomParse;
    const buildingData = allBuildings.find(b => b.code === code);
    if (buildingData) {
      (ROOMS[code] || [])
        .filter(r => r.id.toUpperCase().startsWith(roomQuery))
        .slice(0, 4)
        .forEach(room => results.push({ type: 'room', building: buildingData, room, code }));
    }
  }

  // Building matches
  const ql = q.toLowerCase();
  allBuildings
    .filter(b => b.name.toLowerCase().includes(ql) || b.code.toLowerCase().includes(ql))
    .slice(0, 6 - results.length)
    .forEach(b => results.push({ type: 'building', building: b }));

  if (!results.length) { goResults.style.display = 'none'; return; }

  goResults.innerHTML = results.map((r, i) => {
    if (r.type === 'room') {
      const fi = FLOOR_INFO[r.room.floor];
      return `<div class="go-result-item" data-i="${i}">
        <div class="go-result-icon">&#x25A3;</div>
        <div>
          <div class="go-result-name">${r.code} ${r.room.id}</div>
          <div class="go-result-sub">${r.room.desc} — ${fi ? fi.label : 'Floor ' + r.room.floor}</div>
        </div>
      </div>`;
    }
    return `<div class="go-result-item" data-i="${i}">
      <div class="go-result-icon">&#x2302;</div>
      <div>
        <div class="go-result-name">${r.building.name}</div>
        <div class="go-result-sub">${r.building.code} — ${TYPE_LABELS[r.building.type]}</div>
      </div>
    </div>`;
  }).join('');

  goResults.querySelectorAll('.go-result-item').forEach((el, i) => {
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const r = results[i];
      pendingToResult = r;
      goInput.value = r.type === 'room' ? `${r.code} ${r.room.id}` : r.building.name;
      goInput.classList.add('has-value');
      goResults.style.display = 'none';
      navigateTo(r);
    });
  });

  goResults.style.display = 'block';
});

function calcDistM(a, b) {
  return Math.hypot((b[0] - a[0]) * 82489, (b[1] - a[1]) * 111000);
}

function fmtDist(m) {
  return m < 1000 ? Math.round(m) + 'm' : (m / 1000).toFixed(1) + 'km';
}

function updateLiveNavigation() {
  if (!userLocation || !navDest) return;

  // Redraw route from current GPS position
  drawRoute(userLocation, navDest);

  const distM = calcDistM(userLocation, navDest);
  const walkMin = Math.max(1, Math.round(distM / 80));

  // Update the summary in the directions header
  navLiveDist.textContent = fmtDist(distM);
  navLiveTime.textContent = `~${walkMin} min walk`;

  // Arrival detection: within 30m of destination
  if (distM < 30) {
    navArrived = true;
    showArrival();
  }
}

function showArrival() {
  const b = navResult.building;
  const isRoom = navResult.type === 'room';

  navLiveDist.textContent = 'Arrived';
  navLiveTime.textContent = '';
  navStopBtn.style.display = 'none';

  let html = `<div class="arrived-banner">
    <div class="arrived-icon">&#x2705;</div>
    <div class="arrived-text">You've arrived at ${b.name}</div>
  </div>`;

  if (isRoom) {
    const room = navResult.room;
    const fi = FLOOR_INFO[room.floor] || { label: `Floor ${room.floor}`, stairs: `Go to floor ${room.floor}` };
    html += `
      <div class="nav-step">
        <div class="step-num">&#x2191;</div>
        <div class="step-text">${fi.stairs}</div>
      </div>
      <div class="nav-step">
        <div class="step-num">&#x1F6AA;</div>
        <div class="step-text">Find room <strong>${navResult.code} ${room.id}</strong><br>
          <span class="step-detail">${room.desc}</span>
        </div>
      </div>`;
  }

  goSteps.innerHTML = html;
}

function stopNavigation() {
  navActive = false;
  navDest = null;
  navResult = null;
  navArrived = false;
  pendingToResult = null;
  navStopBtn.style.display = 'none';
  goDirections.style.display = 'none';
  clearRoute();
  try { map.setPaintProperty('bu-buildings-3d', 'fill-extrusion-color', ['get', 'color']); } catch {}
}

navStopBtn.addEventListener('click', stopNavigation);

function navigateTo(result) {
  goResults.style.display = 'none';
  goFromResults.style.display = 'none';
  const b = result.building;
  const dest = [b.lng, b.lat];
  const isRoom = result.type === 'room';

  // Set navigation state
  navActive = true;
  navDest = dest;
  navResult = result;
  navArrived = false;

  // Determine start point
  const start = goFromLocation
    ? [goFromLocation.lng, goFromLocation.lat]
    : (userLocation || map.getCenter().toArray());

  // Draw route line on map
  drawRoute(start, dest);

  // Trigger GPS tracking when navigating from own location
  if (!goFromLocation) geolocate.trigger();

  // Fit map to show the full route
  const bounds = new maplibregl.LngLatBounds();
  bounds.extend(start);
  bounds.extend(dest);
  map.fitBounds(bounds, { padding: { top: 60, bottom: 60, left: 380, right: 60 }, pitch: 0, duration: 1200 });

  // Calculate distance
  const distM = calcDistM(start, dest);
  const walkMin = Math.max(1, Math.round(distM / 80));

  // Update summary bar
  navLiveDist.textContent = fmtDist(distM);
  navLiveTime.textContent = `~${walkMin} min walk`;

  // Build step-by-step directions
  const fromName = goFromLocation ? goFromLocation.name : 'your location';
  let stepsHTML = `
    <div class="nav-step">
      <div class="step-num">1</div>
      <div class="step-text">Walk from <strong>${fromName}</strong> towards <strong>${b.name}</strong></div>
    </div>`;

  if (isRoom) {
    const room = result.room;
    const fi = FLOOR_INFO[room.floor] || { label: `Floor ${room.floor}`, stairs: `Go to floor ${room.floor}` };
    stepsHTML += `
      <div class="nav-step">
        <div class="step-num">2</div>
        <div class="step-text">Enter <strong>${b.name}</strong> (${b.code})</div>
      </div>
      <div class="nav-step">
        <div class="step-num">3</div>
        <div class="step-text">${fi.stairs}</div>
      </div>
      <div class="nav-step">
        <div class="step-num">4</div>
        <div class="step-text">Find room <strong>${result.code} ${room.id}</strong><br>
          <span class="step-detail">${room.desc}</span>
        </div>
      </div>`;
  } else {
    stepsHTML += `
      <div class="nav-step">
        <div class="step-num">2</div>
        <div class="step-text">Arrive at <strong>${b.name}</strong></div>
      </div>`;
  }

  goSteps.innerHTML = stepsHTML;
  goDirections.style.display = 'block';
  navStopBtn.style.display = goFromLocation ? 'none' : 'block';

  // Highlight destination building
  map.setPaintProperty('bu-buildings-3d', 'fill-extrusion-color', [
    'case',
    ['==', ['get', 'code'], b.code],
    '#00c978',
    ['get', 'color'],
  ]);
}

// ─── Legend ──────────────────────────────────────────────────────────────────
const legendItems = document.getElementById('legend-items');
Object.entries(TYPE_LABELS).forEach(([type, label]) => {
  const hex = TYPE_COLORS[type] || '#aa9988';
  const div = document.createElement('div');
  div.className = 'legend-item';
  div.innerHTML = `<div class="legend-color" style="background:${hex};"></div>${label}`;
  legendItems.appendChild(div);
});

// ─── Layer Toggles ──────────────────────────────────────────────────────────
document.querySelectorAll('.layer-toggle').forEach(toggle => {
  const layerId = toggle.dataset.layer;
  toggle.addEventListener('click', () => {
    const isActive = toggle.classList.toggle('active');
    const markers = window._poiMarkers && window._poiMarkers[layerId];
    if (markers) {
      markers.forEach(({ el }) => { el.style.display = isActive ? '' : 'none'; });
    }
    toggle.querySelector('.toggle-status').textContent = isActive ? 'ON' : 'OFF';
  });
});

// ─── Search (top-left) ─────────────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  if (!q) { searchResults.style.display = 'none'; return; }

  const results = [];

  // Room search
  const roomParse = parseRoomQuery(q);
  if (roomParse) {
    const { code, roomQuery } = roomParse;
    const bld = allBuildings.find(b => b.code === code);
    if (bld) {
      (ROOMS[code] || [])
        .filter(r => r.id.toUpperCase().startsWith(roomQuery))
        .slice(0, 4)
        .forEach(room => results.push({ isRoom: true, code, room, building: bld }));
    }
  }

  // Building search
  const ql = q.toLowerCase();
  allBuildings
    .filter(b => b.name.toLowerCase().includes(ql) || b.code.toLowerCase().includes(ql))
    .slice(0, 8 - results.length)
    .forEach(b => results.push({ isRoom: false, building: b }));

  if (!results.length) { searchResults.style.display = 'none'; return; }

  searchResults.innerHTML = results.map((r, i) => {
    if (r.isRoom) {
      const fi = FLOOR_INFO[r.room.floor];
      return `<div class="search-result-item" data-i="${i}">
        <span><strong>${r.code} ${r.room.id}</strong> — ${r.room.desc.slice(0, 38)}</span>
        <span class="result-type">${fi ? fi.label : 'Floor ' + r.room.floor}</span>
      </div>`;
    }
    return `<div class="search-result-item" data-i="${i}">
      <span>${r.building.name} <span style="opacity:0.5">(${r.building.code})</span></span>
      <span class="result-type">${TYPE_LABELS[r.building.type]}</span>
    </div>`;
  }).join('');

  searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const r = results[i];
      if (r.isRoom) {
        showBuilding({
          code: r.code, name: r.building.name, btype: r.building.type,
          desc: r.building.desc, floors: r.building.floors,
        }, r.room);
      } else {
        showBuilding({
          code: r.building.code, name: r.building.name, btype: r.building.type,
          desc: r.building.desc, floors: r.building.floors,
        });
      }
      flyToBuilding(r.building.code);
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

// Keyboard shortcut: / to focus search
window.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== searchInput && document.activeElement !== goInput) {
    e.preventDefault();
    searchInput.focus();
    const hint = document.getElementById('search-shortcut-hint');
    if (hint) hint.style.display = 'none';
  }
});

searchInput.addEventListener('focus', () => {
  const hint = document.getElementById('search-shortcut-hint');
  if (hint) hint.style.display = 'none';
});
searchInput.addEventListener('blur', () => {
  const hint = document.getElementById('search-shortcut-hint');
  if (hint && !searchInput.value) hint.style.display = '';
});

// ─── Resize ─────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => map.resize());
