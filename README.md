# Binghamton University 3D Campus Map

An interactive 3D campus map of Binghamton University (SUNY Binghamton), Vestal NY — built with Three.js and Vite.

## Live Demo

Run locally with:

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

## Controls

| Input | Action |
|---|---|
| `W / A / S / D` or Arrow Keys | Walk the player character |
| Left-drag | Orbit camera |
| Right-drag | Pan camera |
| Scroll wheel | Zoom in / out |
| Click a building | Show info panel |
| `F` key | Toggle first-person mode |
| `ESC` | Exit first-person mode |
| Search box (top-left) | Search buildings or rooms |

## Features

- **~90 real buildings** rendered from official BU GeoJSON polygon data
- **PBR materials** — procedural brick/stone textures per building type, physically-based lighting
- **3D windows** — protruding frame + glass geometry on all four faces of every building
- **Real GPS coordinates** — all buildings placed at their true latitude/longitude (SCALE = 0.45, 1 unit ≈ 2.2 m)
- **Accurate roads** — Bartle Drive, West Drive, Bearcat Boulevard, South Connector, Recreation Drive and more, positioned from OpenStreetMap data
- **Pedestrian Spine** — the Lois B. DeFleur Walkway running E-W through the academic core
- **First-person mode** — pointer-lock walk-through with AABB collision detection
- **Room search** — type a room code (e.g. `LH G02`) to get step-by-step navigation directions
- **Dynamic sky dome** — gradient sky with warm horizon band
- **Animated clouds**, procedural trees, street lamp point-lights, decorative pond

## Project Structure

```
bu-campus-map/
├── index.html              # UI shell — header, info panel, legend, search, tooltip
├── vite.config.js
├── src/
│   ├── main.js             # Three.js scene, renderer, all geometry, interaction loop
│   ├── buildings.js        # Campus oval coords (CONNECTOR_ROAD_POINTS, CAMPUS_LAWN_POINTS)
│   ├── geo.js              # GeoJSON → world coords; building metadata (type, height, desc)
│   ├── buildings-geo.json  # Official BU polygon data (~100 buildings)
│   ├── controls.js         # Custom orbit + pan + zoom (no OrbitControls dependency)
│   ├── player.js           # Player character mesh
│   ├── rooms.js            # Room number database + floor info for navigation
│   └── car.js              # (reserved)
```

## Coordinate System

```
REF point: lat 42.087969, lng -75.969116  (near Library complex)
SCALE = 0.45  →  1 world unit ≈ 2.22 m real

world_x =  (lng - REF_LNG) * 82489 * 0.45   (east = +x)
world_z = -(lat - REF_LAT) * 111000 * 0.45   (north = -z, south = +z)
```

Key landmark positions (world units):

| Landmark | x | z |
|---|---|---|
| Bartle Library (LS) | −14 | +35 |
| Engineering (EB) | +37 | +29 |
| University Union (UU) | +81 | +11 |
| Lecture Hall (LH) | −75 | −6 |
| Academic A (AA) | −122 | −36 |
| Science 4 (S4) | −48 | −149 |
| Events Center (EC) | −106 | −269 |
| East Gym (GE) | +174 | −186 |

## Building Types & Colors

| Type | Color | Examples |
|---|---|---|
| Academic | Warm red-orange brick | Engineering, Sciences, Fine Arts |
| Residential | Dark brick | Hinman, CIW, Newing, Dickinson |
| Athletics | Steel gray | Events Center, East/West Gym |
| Student Services | Bold warm brick | Union, Admissions, Admin |
| Library | Concrete gray-tan | Bartle Library, Tower |
| Utility | Neutral gray | Heating Plant, Physical Facilities |

## Build

```bash
npm run build     # outputs to dist/  (~664 KB JS, ~171 KB gzip)
npm run preview   # serve the dist build locally
```

## Known Limitations & Improvement Areas

See **IMPROVEMENTS.md** for a full roadmap of what could be added next.
