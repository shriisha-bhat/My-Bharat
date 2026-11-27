// Orbit camera and input for the state relief (from sanNchari): drag to turn (or move in pan
// mode), pinch and wheel to zoom, buttons for zoom, TURN/MOVE, TOP, RESET, and a zoom slider
// from 1x (whole state) to 100x. Four wheel turns past the widest view go back to the globe.
const $ = (id) => document.getElementById(id);

export function createCamera({ canvas, stage, cam, renderer, t, onTap, onOut }) {
  const home = { tx: 0, tz: 0, th: -0.22, ph: 0.72, r: 96 };
  const st = { home, c: { ...home }, goal: { ...home }, RMAX: 96, RMIN: 0.96, auto: !matchMedia("(prefers-reduced-motion:reduce)").matches, panMode: false, enabled: false, bounds: [-60, -60, 60, 60] };
  const clampR = (r) => Math.min(st.RMAX, Math.max(st.RMIN, r));
  st.clampR = clampR;

  function size() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    home.r = st.RMAX = 96 * Math.max(1, 0.98 / cam.aspect);
    st.RMIN = st.RMAX / 100;
    st.goal.r = clampR(st.goal.r);
  }
  size();
  new ResizeObserver(size).observe(stage);

  /** Re-home for a new state: world box of the state [x0, z0, x1, z1]. */
  st.setHome = (box) => {
    st.bounds = box;
    home.tx = (box[0] + box[2]) / 2;
    home.tz = (box[1] + box[3]) / 2;
    home.th = -0.22; home.ph = 0.72; home.r = st.RMAX;
    Object.assign(st.goal, home);
  };

  const ptr = new Map();
  let moved = 0, pinch = 0, down = null, outTicks = 0;
  function pan(dx, dy) {
    const k = st.goal.r * 0.0016, ct = Math.cos(st.goal.th), s2 = Math.sin(st.goal.th), [x0, z0, x1, z1] = st.bounds;
    st.goal.tx = Math.min(x1, Math.max(x0, st.goal.tx - (dx * ct + dy * s2) * k));
    st.goal.tz = Math.min(z1, Math.max(z0, st.goal.tz - (-dx * s2 + dy * ct) * k));
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (!st.enabled) return;
    canvas.setPointerCapture(e.pointerId);
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    moved = 0; down = [e.clientX, e.clientY]; st.auto = false;
    if (ptr.size === 2) { const a = [...ptr.values()]; pinch = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!st.enabled || !ptr.has(e.pointerId)) return;
    const o = ptr.get(e.pointerId), dx = e.clientX - o[0], dy = e.clientY - o[1];
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    moved += Math.abs(dx) + Math.abs(dy);
    if (ptr.size === 1) {
      if (st.panMode || e.shiftKey || e.buttons === 2) pan(dx, dy);
      else { st.goal.th -= dx * 0.006; st.goal.ph = Math.min(1.42, Math.max(0.05, st.goal.ph - dy * 0.005)); }
    } else if (ptr.size === 2) {
      const a = [...ptr.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]);
      if (pinch) st.goal.r = clampR((st.goal.r * pinch) / d);
      pinch = d; pan(dx / 2, dy / 2);
    }
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!st.enabled) return;
    if (ptr.size === 1 && moved < 8 && down) onTap(e);
    ptr.delete(e.pointerId); pinch = 0;
  });
  canvas.addEventListener("pointercancel", (e) => { ptr.delete(e.pointerId); pinch = 0; });
  canvas.addEventListener("wheel", (e) => {
    if (!st.enabled) return;
    e.preventDefault(); st.auto = false;
    if (e.deltaY > 0 && st.goal.r >= st.RMAX * 0.999) { if (++outTicks >= 4) { outTicks = 0; onOut(); } }
    else outTicks = 0;
    st.goal.r = clampR(st.goal.r * (e.deltaY > 0 ? 1.15 : 0.87));
  }, { passive: false });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  $("z3in").onclick = () => { st.auto = false; st.goal.r = clampR(st.goal.r * 0.5); };
  $("z3out").onclick = () => { st.auto = false; st.goal.r = clampR(st.goal.r * 2); };
  $("z3pan").onclick = (e) => {
    st.panMode = !st.panMode;
    e.currentTarget.textContent = t(st.panMode ? "z3move" : "z3turn");
    e.currentTarget.setAttribute("aria-pressed", st.panMode);
  };
  $("z3top").onclick = () => { st.auto = false; st.goal.ph = st.goal.ph < 0.2 ? 0.72 : 0.06; };
  $("z3reset").onclick = () => { st.auto = false; Object.assign(st.goal, home); };
  $("z3zoom").oninput = (e) => { st.auto = false; st.goal.r = clampR(st.RMAX / Math.pow(100, e.target.value / 100)); };
  return st;
}
