// Orbit + pan controls for the campus map camera
// Left-drag: orbit, Right-drag: pan, Scroll: zoom

export function createControls(camera, domElement) {
  let enabled = true;

  const state = {
    isOrbiting: false,
    isPanning: false,
    lastX: 0,
    lastY: 0,
    // Spherical coords
    theta: -0.45,  // azimuth — slight angle from SW
    phi: 0.75,     // polar — fairly high so you see the full oval
    radius: 260,
    // Target — center of campus oval
    targetX: 0,
    targetY: 0,
    targetZ: -20,
  };

  const MIN_PHI = 0.25;
  const MAX_PHI = 1.35;
  const MIN_RADIUS = 30;
  const MAX_RADIUS = 320;

  function updateCamera() {
    const sinPhi = Math.sin(state.phi);
    const cosPhi = Math.cos(state.phi);
    const sinTheta = Math.sin(state.theta);
    const cosTheta = Math.cos(state.theta);

    camera.position.x = state.targetX + state.radius * sinPhi * sinTheta;
    camera.position.y = state.targetY + state.radius * cosPhi;
    camera.position.z = state.targetZ + state.radius * sinPhi * cosTheta;

    camera.lookAt(state.targetX, state.targetY, state.targetZ);
  }

  function onMouseDown(e) {
    if (!enabled) return;
    if (e.button === 0) {
      state.isOrbiting = true;
    } else if (e.button === 2) {
      state.isPanning = true;
    }
    state.lastX = e.clientX;
    state.lastY = e.clientY;
  }

  function onMouseMove(e) {
    if (!enabled) return;
    const dx = e.clientX - state.lastX;
    const dy = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;

    if (state.isOrbiting) {
      state.theta -= dx * 0.005;
      state.phi = Math.max(MIN_PHI, Math.min(MAX_PHI, state.phi + dy * 0.005));
      updateCamera();
    } else if (state.isPanning) {
      // Pan in the camera's local XZ plane
      const panSpeed = state.radius * 0.0012;
      const sinTheta = Math.sin(state.theta);
      const cosTheta = Math.cos(state.theta);

      // Right vector (perpendicular to view, in XZ plane)
      state.targetX -= cosTheta * dx * panSpeed;
      state.targetZ += sinTheta * dx * panSpeed;

      // Up-projected forward vector
      const sinPhi = Math.sin(state.phi);
      const cosPhi = Math.cos(state.phi);
      state.targetX += sinTheta * cosPhi * dy * panSpeed;
      state.targetZ += cosTheta * cosPhi * dy * panSpeed;
      state.targetY += sinPhi * dy * panSpeed * 0.5;

      updateCamera();
    }
  }

  function onMouseUp() {
    state.isOrbiting = false;
    state.isPanning = false;
  }

  function onWheel(e) {
    if (!enabled) { e.preventDefault(); return; }
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.1 : 0.9;
    state.radius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, state.radius * delta));
    updateCamera();
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  domElement.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  domElement.addEventListener('wheel', onWheel, { passive: false });
  domElement.addEventListener('contextmenu', onContextMenu);

  // Touch support
  let lastTouchDist = 0;

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      state.isOrbiting = true;
      state.lastX = e.touches[0].clientX;
      state.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      state.isOrbiting = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && state.isOrbiting) {
      const dx = e.touches[0].clientX - state.lastX;
      const dy = e.touches[0].clientY - state.lastY;
      state.lastX = e.touches[0].clientX;
      state.lastY = e.touches[0].clientY;
      state.theta -= dx * 0.006;
      state.phi = Math.max(MIN_PHI, Math.min(MAX_PHI, state.phi + dy * 0.006));
      updateCamera();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = lastTouchDist / dist;
      state.radius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, state.radius * delta));
      lastTouchDist = dist;
      updateCamera();
    }
  }

  function onTouchEnd() {
    state.isOrbiting = false;
  }

  domElement.addEventListener('touchstart', onTouchStart, { passive: false });
  domElement.addEventListener('touchmove', onTouchMove, { passive: false });
  domElement.addEventListener('touchend', onTouchEnd);

  // Initial position
  updateCamera();

  let flyAnimId = null;

  function flyTo(x, z) {
    if (flyAnimId) cancelAnimationFrame(flyAnimId);
    const fromX = state.targetX, fromZ = state.targetZ;
    const fromRadius = state.radius;
    const toRadius = Math.max(MIN_RADIUS, Math.min(120, state.radius * 0.65));
    const t0 = performance.now();
    const duration = 700;
    function step(now) {
      let t = Math.min(1, (now - t0) / duration);
      t = 1 - Math.pow(1 - t, 3); // ease-out cubic
      state.targetX  = fromX      + (x        - fromX)      * t;
      state.targetZ  = fromZ      + (z        - fromZ)      * t;
      state.radius   = fromRadius + (toRadius - fromRadius) * t;
      updateCamera();
      if (t < 1) flyAnimId = requestAnimationFrame(step);
      else flyAnimId = null;
    }
    flyAnimId = requestAnimationFrame(step);
  }

  return {
    update: updateCamera,
    flyTo,
    getTheta() { return state.theta; },
    setEnabled(v) {
      enabled = v;
      if (!v) { state.isOrbiting = false; state.isPanning = false; }
    },
    setTarget(x, z) {
      if (flyAnimId) { cancelAnimationFrame(flyAnimId); flyAnimId = null; }
      state.targetX = x;
      state.targetZ = z;
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
