// Outer edge of Bartle Drive ring road — derived from real GPS building positions.
// All values are 3× the GPS-derived world coords (SCALE = 0.45).
// Center ≈ (-21, -63), semi-axes ≈ 156 × 144 world units.
export const CONNECTOR_ROAD_POINTS = [
  [ -21, -207],  // N apex
  [  48, -192],  // NNE
  [ 102, -153],  // NE
  [ 132,  -96],  // ENE
  [ 132,  -30],  // E
  [ 102,   27],  // ESE
  [  48,   66],  // SSE
  [ -21,   81],  // S apex
  [ -90,   66],  // SSW
  [-144,   27],  // SW
  [-174,  -30],  // WSW
  [-174,  -96],  // W
  [-144, -153],  // NW
  [ -90, -192],  // NNW
];

// Inner edge (campus lawn inside the ring road) — ~21 units inside the outer oval.
export const CAMPUS_LAWN_POINTS = [
  [ -21, -186],  // N apex
  [  36, -174],  // NNE
  [  84, -141],  // NE
  [ 111,  -90],  // ENE
  [ 111,  -36],  // E
  [  84,   15],  // ESE
  [  36,   48],  // SSE
  [ -21,   60],  // S apex
  [ -78,   48],  // SSW
  [-126,   15],  // SW
  [-153,  -36],  // WSW
  [-153,  -90],  // W
  [-126, -141],  // NW
  [ -78, -174],  // NNW
];
