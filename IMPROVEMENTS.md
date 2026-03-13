# BU Campus Map — Improvement Roadmap

## 1. Map Accuracy

### Roads (highest priority)
- **West Drive is diagonal** — the main campus road cuts NW→SE through the academic core (GPS: 42.0886,−75.9730 → 42.0869,−75.9681). The current straight N-S/E-W roads don't match this. A `diagRoad(x1,z1,x2,z2,w)` helper using `rotation.y = atan2(dx,dz)` is needed.
- **Bartle Drive curves** — it's a C-shaped one-way road on the NE side, not a straight line. It runs from x≈48,z=−168 (south, near Engineering) curving to x≈66,z=−347 (north, past Events Center). Two diagonal segments would approximate it well.
- **Recreation Drive** — diagonal road from Bartle Drive (x=48,z=−168) northeast to East Gym (x=203,z=−228). Currently missing.
- **East Access Road** — diagonal SE from Union area (x=140,z=+42) toward Murray Hill (x=341,z=+231). Currently missing.
- **South Connector Road** — diagonal from x=−121,z=+147 to x=+288,z=+225. Currently too far north.
- **Bunn Hill Access** — NW campus access from x=−237,z=−306 to x=−155,z=−143 (toward Newing area). Missing.

### Building Positions
- A handful of buildings in `buildings.js` (the manual-override list) have positions that don't match the GPS data processed by `geo.js`. Since `processBuildings()` already uses real GeoJSON coordinates, the `buildings.js` manual list is redundant and could be removed entirely.
- **Campus oval** (CONNECTOR_ROAD_POINTS / CAMPUS_LAWN_POINTS) is a rough approximation. The real inner lawn is not a perfect ellipse — it follows the road geometry more organically.

### Nature Preserve
- The preserve boundary should match the official trail data. The Pond Trail ends at approximately lat 42.0812 (world z ≈ +420). Current z=174–270 is too close.

---

## 2. Visual Quality

### Shadows
- Shadow map resolution is 2048×2048 with a 690-unit frustum. At 3× scale this spreads shadows thin. Either increase shadow map to 4096×4096 or reduce the frustum to cover only the visible campus core.
- Add `castShadow = true` to building window/frame meshes (currently only body meshes cast shadows).

### Building Textures
- The procedural brick texture is generated once per type (6 variants). Adding subtle random seed per building would make identical-type buildings look distinct.
- Library buildings should use a larger ashlar stone block pattern — Bartle Library is notable for its brutalist concrete aesthetic.
- Consider adding a normal map to wall textures to give brick depth under PBR lighting.

### Windows
- Night-time window lighting: some windows should emit a warm `emissive` glow to simulate offices being lit up.
- Windows currently have uniform blue glass. Vary the emissive intensity per window with a seeded random to make some rooms look lit and others dark.
- The Library Tower (LN, h=36) is tall enough that window rows look sparse. Reduce WIN_SPACING for taller buildings.

### Ground
- The campus has distinct zones: parking lots (darker asphalt), athletic fields (bright green), the nature preserve (dark wooded green), and the concrete academic podium. These could each use distinct materials.
- Add parking lot line markings (white dashes on dark asphalt) to parking areas.
- The inner campus lawn (CAMPUS_LAWN_POINTS) could use a slightly different shade from the outer ground.

### Trees & Vegetation
- Trees are randomly placed with a seeded RNG. In reality, BU has specific tree-lined areas:
  - A dense tree row along the west side of the academic spine
  - The Nature Preserve is heavily forested (dense cluster at z > +200)
  - Hinman College is known for being wooded
- Add pine/conical tree variants (ConeGeometry trunk + stacked cone layers) for variety.

### Sky & Atmosphere
- The current sky dome is a static gradient. A subtle animated time-of-day cycle (sun angle + sky color shifting) would be visually impressive.
- Add a distant mountain/hill silhouette at the horizon (BU sits in a valley, hills visible from campus).
- Fog density currently is linear. Switching to `THREE.FogExp2` gives more natural exponential atmospheric depth.

### Post-Processing
- **Ambient Occlusion (SSAO)**: Would dramatically improve building realism — adds dark contact shadows where walls meet ground. Requires `three/examples/jsm/postprocessing/`.
- **Bloom**: Street lamp globes and lit windows would glow softly. Small bloom passes are performant.
- **FXAA anti-aliasing**: Current renderer uses hardware MSAA only. FXAA from Three.js post-processing would smooth diagonal edges better.

---

## 3. Interaction & UX

### Info Panel
- Add a **"Take me there"** button that animates the camera flying to the building.
- Show a **building photo** (thumbnail from BU's website) in the info panel.
- Add **open hours** for key buildings (library, dining, health services).

### Navigation
- **Path-finding between buildings**: Draw a walkway path on the ground showing the route from the player's current position to a selected building.
- **Accessible routes**: Mark which paths are ADA accessible.

### Map Modes
- **Satellite overlay toggle**: Import a real satellite tile texture for the ground plane when the user zooms out far enough.
- **Floor plan mode**: When clicking a building, show a 2D floor plan overlay in the info panel.
- **Bus routes**: Show BU's Bearcat bus routes as colored lines on the roads.

### Mobile Support
- Add touch controls: pinch to zoom, two-finger drag to orbit, tap to select building.
- The current pointer-lock first-person mode doesn't work on mobile — add a joystick overlay instead.

---

## 4. Performance

### Geometry
- Each building creates separate meshes for: body, floor slabs (N-1 per building), parapet, roof, HVAC boxes, and per-face/per-floor windows. A 6-floor building generates ~50+ meshes. With ~90 buildings this is ~4,500+ draw calls.
- **Instanced meshes**: Window frames and glass panes are prime candidates for `THREE.InstancedMesh` — all windows of the same type share one draw call.
- **Merge static geometry**: Use `BufferGeometryUtils.mergeGeometries()` to batch all road planes, walkway planes, and ground planes into single draw calls.
- **LOD (Level of Detail)**: Use `THREE.LOD` to show detailed buildings close-up and simple boxes far away.

### Textures
- The procedural brick textures are generated at runtime via Canvas 2D. Pre-generate and cache them as data URLs or load from a spritesheet.
- Use `KTX2` compressed textures for the grass/asphalt/concrete procedural textures to reduce GPU memory.

### Code
- The `makeWallTex` function is defined but no longer used (wall textures moved to `getBrickTex`). Remove it to reduce bundle size by ~3 KB.
- Dead code: `roadRingShape` and `roadHole` are built but the resulting mesh is never added to the scene. Remove these ~15 lines.
- `car.js` is imported in src but empty — remove or implement.

---

## 5. Data & Content

### Missing Buildings
- Vestal Parkway-facing buildings (Gateway buildings, Welcome Center) are currently not rendered.
- The **Smart Energy Building** (opened 2023) may not be in the GeoJSON.
- Graduate student housing complexes east of campus are filtered out by the 660-unit radius check — intentional, but worth documenting.

### Room Database
- `rooms.js` has a small sample room list. A full room database (cross-referenced with the registrar's course location data) would make room-finding genuinely useful.
- Add **dining hall menus** via BU's dining API for the C4/Hinman dining halls.

### Accessibility Info
- Tag buildings with whether they have accessible entrances, elevators, etc.
- Show accessible parking locations.

---

## 6. Quick Wins (low effort, high impact)

| Fix | Effort | Impact |
|---|---|---|
| Add `diagRoad()` helper + fix West Drive to be diagonal | 1 hr | High — most obvious visual inaccuracy |
| Remove dead code (`makeWallTex`, `roadRingShape`) | 15 min | Low visual, cleaner code |
| Vary window emissive per-building with seeded RNG | 30 min | Medium — makes buildings look alive |
| Add pine tree variant (ConeGeometry) | 30 min | Medium — visual variety |
| Fix player spawn inside building bug (already fixed, verify) | done | — |
| Add `THREE.FogExp2` | 5 min | Low — marginally nicer horizon |
| Increase shadow map to 4096 for sharper shadows | 2 min | Medium |
| Add `InstancedMesh` for windows | 2 hr | High performance gain |
