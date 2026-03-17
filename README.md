# BU Campus Map

An interactive campus map for **Binghamton University** (SUNY), Vestal NY — built to replace the university's current Google Maps-based solution with a modern, purpose-built experience.

Built with [MapLibre GL JS](https://maplibre.org/) + [Vite](https://vitejs.dev/). No API keys required.

---

## Features

### Interactive Map
- **115 campus buildings** rendered as color-coded 3D extrusions from real GeoJSON footprint data
- **Building labels** — every building shows its code and full name directly on the map
- **Click any building** to see a detailed info panel with description, floor count, type, and navigation
- **Map locked to campus** — can't scroll away; focused entirely on BU

### Navigation (Go)
- **Google Maps-style directions** — compact floating panel with From/To fields
- **Start from "My Location"** (GPS) or pick any campus building as your starting point
- **Search buildings or rooms** — type "EB H3" for an ECE faculty office, "AA 202" for a classroom
- **Visual route** — blue dashed line + colored markers drawn on the map via SVG overlay
- **Step-by-step directions** including floor and room guidance (e.g., "Take stairs to 2nd floor, find room EB H3")
- **Live GPS tracking** — route updates in real-time as you walk; arrival detection at 30m

### Points of Interest
All layers ON by default, toggleable from the Layers panel:
- **27 Parking lots** (purple P) — click for TAPS links and info
- **9 Dining locations** (orange D) — click for hours, Sodexo links
- **15 Bus stops** (blue B) — click for OCCT schedules, BU shuttle info, ETA SPOT app

### Room-Level Search
- **18 buildings** with detailed room databases (700+ rooms total)
- Engineering Building (EB): 55 rooms — labs, classrooms, faculty offices by department (ECE, ME, ISE, BME, CS)
- Engineering & Science (ES): CS department offices
- Academic A/B, Lecture Hall, Sciences 1-5, Fine Arts, Library, Union, and more
- Search "EB C5" → Dean's Office, Watson School of Engineering
- Search "AA 202" → Classroom (446 sf), 2nd floor

### UI
- Dark glassmorphism theme with BU green accent
- Responsive layout (desktop + mobile)
- Loading screen with BU branding
- Building type legend with color coding
- Keyboard shortcut: press `/` to focus search

---

## Quick Start

```bash
git clone https://github.com/DevNagi31/BU-Map.git
cd BU-Map
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build for Production

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Tech Stack

| Technology | Purpose |
|---|---|
| [MapLibre GL JS](https://maplibre.org/) | Map rendering, 3D building extrusions, markers, popups |
| [Carto Positron](https://carto.com/basemaps) | Base map tiles (free, no token) |
| [Vite](https://vitejs.dev/) | Build tooling, dev server, HMR |
| Vanilla JS (ES modules) | No framework — fast, lightweight |

## Project Structure

```
bu-campus-map/
├── index.html              # Full UI — styles, layout, panels, modals
├── package.json
├── vite.config.js
└── src/
    ├── main.js             # MapLibre map, building metadata, POIs, navigation, search
    ├── buildings-geo.json  # Real GeoJSON building footprints (~115 buildings)
    └── rooms.js            # Room database + floor info for 18 buildings (700+ rooms)
```

## Controls

| Input | Action |
|---|---|
| Drag | Pan the map |
| Scroll | Zoom in / out |
| Right-drag | Rotate |
| Click building | Show info panel |
| Click POI marker | Show popup with details & links |
| `/` key | Focus search bar |
| Go button | Open navigation panel |

## Building Types

| Type | Color | Examples |
|---|---|---|
| Academic | Warm orange | Engineering, Sciences, Fine Arts, Lecture Hall |
| Residential | Slate blue | Hinman, CIW, Newing, Dickinson communities |
| Athletics & Recreation | Blue | Events Center, East/West Gym, Stadium |
| Student Services | Orange-brown | University Union, Admissions, Admin |
| Library & Research | Amber | Bartle Library, Library Tower |
| Facilities / Utility | Gray | Heating Plant, Physical Facilities |

---

## License

MIT
