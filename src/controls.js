// 2.5D isometric controls — pan + zoom only (no orbit)
// Fixed camera angle looking from the SW at ~30° elevation

export function createControls(camera, domElement) {
  let enabled = true;

  // Orthographic zoom level (half-frustum height in world units)
  let zoom = 180;
  let targetZoom = 180;
  const MIN_ZOOM = 30;
  const MAX_ZOOM = 420;

  // Camera target (point on the ground the camera looks at)
  let targetX = -20;
  let targetZ = -60;

  // Fixed isometric angle
  const AZIMUTH = -Math.PI / 4.5;  // ~SW direction
  const ELEVATION = Math.PI / 5.5;  // ~33° above horizon
  const CAM_DIST = 800;  // far enough to see everything in ortho

  const sinAz = Math.sin(AZIMUTH);
  const cosAz = Math.cos(AZIMUTH);
  const sinEl = Math.sin(ELEVATION);
  const cosEl = Math.cos(ELEVATION);

  function updateCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left   = -zoom * aspect;
    camera.right  =  zoom * aspect;
    camera.top    =  zoom;
    camera.bottom = -zoom;
    camera.updateProjectionMatrix();

    camera.position.set(
      targetX + CAM_DIST * cosEl * sinAz,
      CAM_DIST * sinEl,
      targetZ + CAM_DIST * cosEl * cosAz
    );
    camera.lookAt(targetX, 0, targetZ);
  }

  // ─── Mouse interaction state ────────────────────────────────────────
  let isPanning = false;
  let lastX = 0, lastY = 0;

  function onMouseDown(e) {
    if (!enabled) return;
    isPanning = true;
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onMouseMove(e) {
    if (!enabled || !isPanning) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    // Pan speed scales with zoom level
    const panSpeed = (zoom * 2) / window.innerHeight;

    // Project screen-space drag into isometric world space
    // Screen right → world right (perpendicular to camera forward in XZ)
    // Screen up → world forward (toward camera, projected onto XZ)
    targetX -= (cosAz * dx + sinAz * cosEl * dy) * panSpeed;
    targetZ += (sinAz * dx - cosAz * cosEl * dy) * panSpeed;

    updateCamera();
  }

  function onMouseUp() { isPanning = false; }

  function onWheel(e) {
    if (!enabled) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom * factor));
  }

  function onContextMenu(e) { e.preventDefault(); }

  domElement.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  domElement.addEventListener('wheel', onWheel, { passive: false });
  domElement.addEventListener('contextmenu', onContextMenu);

  // ─── Touch ──────────────────────────────────────────────────────────
  let lastTouchDist = 0;
  let lastTouchX = 0, lastTouchZ = 0;

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      isPanning = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isPanning = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning) {
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      const panSpeed = (zoom * 2) / window.innerHeight;
      targetX -= (cosAz * dx + sinAz * cosEl * dy) * panSpeed;
      targetZ += (sinAz * dx - cosAz * cosEl * dy) * panSpeed;
      updateCamera();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = lastTouchDist / dist;
      targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom * factor));
      lastTouchDist = dist;
    }
  }

  function onTouchEnd() { isPanning = false; }

  domElement.addEventListener('touchstart', onTouchStart, { passive: false });
  domElement.addEventListener('touchmove', onTouchMove, { passive: false });
  domElement.addEventListener('touchend', onTouchEnd);

  // ─── Smooth zoom interpolation (call every frame) ──────────────────
  function update() {
    if (Math.abs(zoom - targetZoom) > 0.2) {
      zoom += (targetZoom - zoom) * 0.1;
      updateCamera();
    }
  }

  // Initial
  updateCamera();

  // ─── flyTo animation ───────────────────────────────────────────────
  let flyAnimId = null;

  function flyTo(x, z) {
    if (flyAnimId) cancelAnimationFrame(flyAnimId);
    const fromX = targetX, fromZ = targetZ;
    const fromZoom = targetZoom;
    const toZoom = Math.max(MIN_ZOOM, Math.min(80, targetZoom * 0.6));
    const t0 = performance.now();
    const duration = 800;
    function step(now) {
      let t = Math.min(1, (now - t0) / duration);
      t = 1 - Math.pow(1 - t, 3); // ease-out cubic
      targetX = fromX + (x - fromX) * t;
      targetZ = fromZ + (z - fromZ) * t;
      targetZoom = fromZoom + (toZoom - fromZoom) * t;
      zoom = targetZoom;
      updateCamera();
      if (t < 1) flyAnimId = requestAnimationFrame(step);
      else flyAnimId = null;
    }
    flyAnimId = requestAnimationFrame(step);
  }

  return {
    update,
    updateCamera,
    flyTo,
    getTarget() { return { x: targetX, z: targetZ }; },
    getZoom() { return zoom; },
    setEnabled(v) { enabled = v; if (!v) isPanning = false; },
    setTarget(x, z) {
      if (flyAnimId) { cancelAnimationFrame(flyAnimId); flyAnimId = null; }
      targetX = x;
      targetZ = z;
      updateCamera();
    },
    dispose() {
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('contextmenu', onContextMenu);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
    },
  };
}
