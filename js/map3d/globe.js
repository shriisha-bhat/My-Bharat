// The globe, from sanNchari: a painted Earth (Natural Earth outlines, data/world.json) with
// India drawn from the official state boundaries. Any state can be picked: it rises out of the
// globe as a glowing plinth with flag-coloured walls, and diving in opens its relief map.
import * as THREE from "three";
import { climateAt } from "./climate.js";

const RAD = Math.PI / 180;
export const GR = 10;
const INDIA = { lon: 80.5, lat: 22.5 };

function v3(lon, lat, r) {
  const phi = (90 - lat) * RAD, th = (lon + 180) * RAD;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}
function toLL(p) {
  const r = p.length(), lat = Math.asin(p.y / r) / RAD;
  let lon = Math.atan2(p.z, -p.x) / RAD - 180;
  if (lon < -180) lon += 360;
  return [lon, lat];
}
function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
const polysOf = (f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);

function earthTexture(world, shapes) {
  const W = 4096, H = 2048, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d"), X = (lo) => ((lo + 180) / 360) * W, Y = (la) => ((90 - la) / 180) * H;
  const og = x.createLinearGradient(0, 0, 0, H);
  [[0, "#0a2236"], [0.3, "#0d3f5f"], [0.5, "#12597c"], [0.7, "#0d3f5f"], [1, "#0a2236"]].forEach(([o, col]) => og.addColorStop(o, col));
  x.fillStyle = og; x.fillRect(0, 0, W, H);
  const r = rng(7);
  for (let k = 0; k < 2600; k++) {
    x.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "0,20,40"},${0.006 + r() * 0.01})`;
    x.beginPath(); x.ellipse(r() * W, r() * H, 20 + r() * 90, 6 + r() * 24, 0, 0, 7); x.fill();
  }
  function trace(ring, dx) {
    const pts = [];
    let off = 0, prev = ring[0][0];
    for (const [lo, la] of ring) {
      if (lo - prev > 180) off -= 360; else if (prev - lo > 180) off += 360;
      prev = lo; pts.push([lo + off + dx, la]);
    }
    const span = Math.abs(pts[pts.length - 1][0] - pts[0][0]);
    x.beginPath();
    pts.forEach(([lo, la], i) => (i ? x.lineTo(X(lo), Y(la)) : x.moveTo(X(lo), Y(la))));
    if (span > 300) {
      const pole = ring.reduce((a, p) => a + p[1], 0) < 0 ? -90 : 90;
      x.lineTo(X(pts[pts.length - 1][0]), Y(pole)); x.lineTo(X(pts[0][0]), Y(pole));
    }
    x.closePath();
  }
  function landCol(lat, k) {
    const a = Math.abs(lat);
    if (a > 62) return `hsl(${95 - k * 10},${12 + k * 6}%,${a > 70 ? 86 : 44 + k * 8}%)`;
    if (a > 45) return `hsl(${98 + k * 14},${26 + k * 8}%,${30 + k * 6}%)`;
    if (a > 16 && a < 34) return `hsl(${34 + k * 10},${38 + k * 10}%,${46 + k * 8}%)`;
    return `hsl(${90 + k * 20},${32 + k * 10}%,${27 + k * 7}%)`;
  }
  const rc = rng(11);
  for (const cn of world.countries) {
    const k = rc();
    for (const ring of cn.r) {
      const lat = ring.reduce((a, p) => a + p[1], 0) / ring.length;
      for (const dx of [-360, 0, 360]) {
        trace(ring, dx);
        x.fillStyle = landCol(lat, k); x.fill();
        x.lineWidth = 1.4; x.strokeStyle = "rgba(10,22,28,.45)"; x.stroke();
      }
    }
  }
  // India, drawn from the official state boundaries. A thick gold stroke under the fills leaves
  // only the outer half visible, which gives a glowing national border; then each state is tinted
  // by its climate, with thin light lines between states.
  x.lineWidth = 5; x.strokeStyle = "rgba(255,214,120,.95)"; x.lineJoin = "round";
  x.shadowColor = "rgba(255,190,40,.7)"; x.shadowBlur = 14;
  for (const f of shapes.features) for (const p of polysOf(f)) { trace(p[0], 0); x.stroke(); }
  x.shadowBlur = 0;
  for (const f of shapes.features) {
    const [w, a] = climateAt(...centroid(f));
    x.fillStyle = `rgb(${110 + a * 90 - w * 20},${140 - a * 10 + w * 10},${74 - w * 6})`;
    for (const p of polysOf(f)) { trace(p[0], 0); x.fill(); }
  }
  x.lineWidth = 1.2; x.strokeStyle = "rgba(255,240,200,.55)";
  for (const f of shapes.features) for (const p of polysOf(f)) { trace(p[0], 0); x.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

export function centroid(f) {
  let a = 0, cx = 0, cy = 0;
  for (const p of polysOf(f)) {
    const r = p[0];
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const k = r[j][0] * r[i][1] - r[i][0] * r[j][1];
      a += k; cx += (r[j][0] + r[i][0]) * k; cy += (r[j][1] + r[i][1]) * k;
    }
  }
  return a ? [cx / (3 * a), cy / (3 * a)] : polysOf(f)[0][0][0];
}

function inRing(x, y, r) {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

function glowTex(inner, outer) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d"), g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function textSprite(txt, color, size) {
  const c = document.createElement("canvas"), x = c.getContext("2d"), f = "700 64px 'Baloo Tamma 2', Mukta, 'Noto Sans', sans-serif";
  x.font = f;
  c.width = Math.ceil(x.measureText(txt).width) + 40; c.height = 96;
  x.font = f; x.textBaseline = "middle"; x.lineWidth = 10; x.strokeStyle = "rgba(6,12,18,.92)";
  x.strokeText(txt, 20, 50); x.fillStyle = color; x.fillText(txt, 20, 50);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
  s.scale.set((size * c.width) / 96, size, 1);
  s.renderOrder = 10;
  return s;
}

/** Relief-ish top for a raised state: climate colours with a soft grain. */
function stateTop(f, box) {
  const [w, s, e, n] = box, W = 256, H = Math.max(16, Math.round((W * (n - s)) / (e - w)));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d"), img = x.createImageData(W, H), r = rng(5);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const [wt, ar] = climateAt(w + (i / W) * (e - w), n - (j / H) * (n - s)), g = (r() - 0.5) * 14, k = (j * W + i) * 4;
    img.data[k] = 176 - wt * 120 + ar * 40 + g;
    img.data[k + 1] = 150 - wt * 40 + ar * 20 + g;
    img.data[k + 2] = 82 - wt * 30 + ar * 30 + g;
    img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/**
 * @param {{renderer:THREE.WebGLRenderer, canvas:HTMLCanvasElement, world:any, shapes:any,
 *   names:(code:string)=>string, onPick:(code:string)=>void, onEnter:(code:string)=>void,
 *   onHover:(code:string|null, e:PointerEvent)=>void}} o
 */
export function createGlobe({ renderer, canvas, world, shapes, names, onPick, onEnter, onHover }) {
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  scene.add(new THREE.AmbientLight(0xffffff, 0.62));
  const sun = new THREE.DirectionalLight(0xfff4e0, 0.62);
  scene.add(sun);
  const earth = new THREE.Group();
  scene.add(earth);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(GR, 128, 96), new THREE.MeshPhongMaterial({ map: earthTexture(world, shapes), shininess: 12, specular: 0x0c1824 }));
  earth.add(globe);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(GR * 1.025, 96, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: "varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.0);vP=p.xyz;gl_Position=projectionMatrix*p;}",
    fragmentShader: "varying vec3 vN;varying vec3 vP;void main(){float f=pow(1.0-abs(dot(vN,normalize(-vP))),3.0);gl_FragColor=vec4(vec3(.42,.72,1.0)*f*1.1,f);}",
  })));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(90,160,255,.55)", "rgba(20,60,140,0)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.set(GR * 2.9, GR * 2.9, 1); halo.renderOrder = -1; scene.add(halo);
  const sg = new THREE.BufferGeometry(), sp = [], sr = rng(3);
  for (let k = 0; k < 1400; k++) {
    const u = sr() * 2 - 1, a = sr() * Math.PI * 2, d = 160 + sr() * 60, q = Math.sqrt(1 - u * u);
    sp.push(d * q * Math.cos(a), d * u, d * q * Math.sin(a));
  }
  sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfe3ff, size: 0.55, transparent: true, opacity: 0.8 })));

  /* every state's outline, as a thin gold line just above the surface (the hover ring) */
  const byCode = new Map(shapes.features.map((f) => [f.properties.code, f]));
  const boxes = new Map(shapes.features.map((f) => {
    const b = [180, 90, -180, -90];
    for (const p of polysOf(f)) for (const [lo, la] of p[0]) { b[0] = Math.min(b[0], lo); b[1] = Math.min(b[1], la); b[2] = Math.max(b[2], lo); b[3] = Math.max(b[3], la); }
    return [f.properties.code, b];
  }));
  const hoverLine = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.9 }));
  earth.add(hoverLine);

  /* the raised state: built when a state is picked */
  const kGroup = new THREE.Group();
  earth.add(kGroup);
  let plinth = null, sel = null, label = null;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex("rgba(255,200,70,.85)", "rgba(255,120,20,0)"), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  earth.add(glow);
  const ripples = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 96), new THREE.MeshBasicMaterial({ color: 0xffc23a, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    earth.add(m);
    return m;
  });

  function buildPlinth(code) {
    if (plinth) { kGroup.clear(); plinth.dispose(); plinth = null; }
    if (!code) return;
    const f = byCode.get(code), box = boxes.get(code), tex = stateTop(f, box);
    const size = Math.max(box[2] - box[0], box[3] - box[1]);
    const parts = polysOf(f).map((p) => p[0]).filter((r) => r.length > 3).filter((r) => {
      let a = 0;
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1];
      return Math.abs(a / 2) > size * size * 0.0005 || size < 1.5;
    });
    const items = [], disp = [];
    const topM = new THREE.MeshPhongMaterial({ map: tex, shininess: 30, emissive: 0x221100, side: THREE.DoubleSide });
    const wallM = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const rimM = new THREE.LineBasicMaterial({ color: 0xffe08a });
    for (const r of parts) {
      const ring = r.slice(0, -1).map(([lo, la]) => new THREE.Vector2(lo, la));
      if (THREE.ShapeUtils.isClockWise(ring)) ring.reverse();
      const tris = THREE.ShapeUtils.triangulateShape(ring, []);
      const n = ring.length, topG = new THREE.BufferGeometry(), uv = [];
      ring.forEach((p) => uv.push((p.x - box[0]) / (box[2] - box[0]), (p.y - box[1]) / (box[3] - box[1])));
      topG.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
      topG.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      topG.setIndex(tris.flat());
      const wallG = new THREE.BufferGeometry(), wc = [], wi = [];
      for (let i = 0; i < n; i++) { wc.push(0.78, 0.1, 0.18, 1.0, 0.76, 0.1); const j = (i + 1) % n; wi.push(2 * i, 2 * j, 2 * i + 1, 2 * j, 2 * j + 1, 2 * i + 1); }
      wallG.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 6), 3));
      wallG.setAttribute("color", new THREE.Float32BufferAttribute(wc, 3));
      wallG.setIndex(wi);
      const rimG = new THREE.BufferGeometry();
      rimG.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
      const top = new THREE.Mesh(topG, topM), wall = new THREE.Mesh(wallG, wallM), rim = new THREE.LineLoop(rimG, rimM);
      kGroup.add(top, wall, rim);
      items.push({ ring, topG, wallG, rimG });
      disp.push(topG, wallG, rimG);
    }
    const [cx, cy] = centroid(f), nrm = v3(cx, cy, 1).normalize();
    ripples.forEach((m) => { m.position.copy(nrm).multiplyScalar(GR * 1.002); m.lookAt(nrm.clone().multiplyScalar(GR * 2)); });
    plinth = { items, code, c: [cx, cy], size, dispose: () => { disp.forEach((g) => g.dispose()); tex.dispose(); topM.dispose(); wallM.dispose(); rimM.dispose(); } };
    relabel();
  }

  function relabel() {
    if (label) { earth.remove(label); label.material.map.dispose(); label = null; }
    if (!plinth) return;
    label = textSprite(names(plinth.code), "#ffd34d", 0.5 + Math.min(0.3, plinth.size * 0.03));
    earth.add(label);
  }

  function lift(h) {
    if (!plinth) return;
    const R1 = GR * (1 + h), R0 = GR * 0.998;
    for (const { ring, topG, wallG, rimG } of plinth.items) {
      const tp = topG.attributes.position, wp = wallG.attributes.position, rp = rimG.attributes.position;
      ring.forEach((p, i) => {
        const a = v3(p.x, p.y, R1), b = v3(p.x, p.y, R0), r2 = v3(p.x, p.y, R1 * 1.0004);
        tp.setXYZ(i, a.x, a.y, a.z); wp.setXYZ(2 * i, b.x, b.y, b.z); wp.setXYZ(2 * i + 1, a.x, a.y, a.z); rp.setXYZ(i, r2.x, r2.y, r2.z);
      });
      tp.needsUpdate = wp.needsUpdate = rp.needsUpdate = true;
      topG.computeVertexNormals(); topG.computeBoundingSphere(); wallG.computeBoundingSphere(); rimG.computeBoundingSphere();
    }
    const [cx, cy] = plinth.c;
    glow.position.copy(v3(cx, cy, GR * (1 + h * 0.3)));
    if (label) label.position.copy(v3(cx, cy + Math.max(1.6, plinth.size * 0.55), GR * (1 + h + 0.03)));
  }

  function setHoverRing(code) {
    const pos = [];
    if (code) for (const p of polysOf(byCode.get(code))) {
      const r = p[0];
      for (let i = 0; i < r.length - 1; i++) { const a = v3(r[i][0], r[i][1], GR * 1.0015), b = v3(r[i + 1][0], r[i + 1][1], GR * 1.0015); pos.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    }
    hoverLine.geometry.dispose();
    hoverLine.geometry = new THREE.BufferGeometry();
    hoverLine.geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  }

  const aim = { yaw: INDIA.lon * RAD, pitch: INDIA.lat * RAD, d: 38 };
  const cur = { yaw: aim.yaw - 2.4, pitch: 0.05, d: 46 };
  const st = { active: true, auto: true, t0: performance.now(), diving: 0, rise0: 0 };
  const DMIN = 15.5, DMAX = 60;
  const fit = () => 38 * Math.max(1, 1.05 / Math.max(0.3, cam.aspect));
  function size() { cam.aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight); cam.updateProjectionMatrix(); }

  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  function stateUnder(e) {
    const b = canvas.getBoundingClientRect();
    v2.set(((e.clientX - b.left) / b.width) * 2 - 1, (-(e.clientY - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(v2, cam);
    if (plinth && ray.intersectObjects(kGroup.children.filter((o) => o.isMesh)).length) return plinth.code;
    const hit = ray.intersectObject(globe)[0];
    if (!hit) return null;
    const [lon, lat] = toLL(earth.worldToLocal(hit.point.clone()));
    for (const [code, b] of boxes) {
      if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
      if (polysOf(byCode.get(code)).some((p) => inRing(lon, lat, p[0]))) return code;
    }
    return null;
  }

  const ptr = new Map();
  let moved = 0, pinch = 0, hov = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (!st.active) return;
    ptr.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; st.auto = false;
    if (ptr.size === 2) { const a = [...ptr.values()]; pinch = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!st.active) return;
    if (!ptr.has(e.pointerId)) {
      const code = stateUnder(e);
      canvas.style.cursor = code ? "pointer" : "grab";
      if (code !== hov) { hov = code; setHoverRing(code); }
      onHover(code, e);
      return;
    }
    const o = ptr.get(e.pointerId), dx = e.clientX - o[0], dy = e.clientY - o[1];
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    moved += Math.abs(dx) + Math.abs(dy);
    if (ptr.size === 1) { const k = (0.0042 * aim.d) / 34; aim.yaw -= dx * k; aim.pitch = Math.max(-1.2, Math.min(1.2, aim.pitch + dy * k)); }
    else if (ptr.size === 2) { const a = [...ptr.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); if (pinch) zoomTo((aim.d * pinch) / d); pinch = d; }
  });
  canvas.addEventListener("pointerleave", () => { if (st.active) { hov = null; setHoverRing(null); onHover(null); } });
  const up = (e) => {
    if (!st.active || !ptr.has(e.pointerId)) return;
    if (ptr.size === 1 && moved < 8) {
      const code = stateUnder(e);
      if (code) { if (plinth && plinth.code === code) dive(); else onPick(code); }
    }
    ptr.delete(e.pointerId); pinch = 0;
  };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", (e) => { ptr.delete(e.pointerId); pinch = 0; });
  canvas.addEventListener("wheel", (e) => {
    if (!st.active) return;
    e.preventDefault(); st.auto = false;
    zoomTo(aim.d * (e.deltaY > 0 ? 1.12 : 0.88));
  }, { passive: false });
  function zoomTo(d) {
    aim.d = Math.max(DMIN, Math.min(Math.max(DMAX, fit()), d));
    if (aim.d <= DMIN + 0.01 && plinth) dive();
  }
  const target = () => (plinth ? { lon: plinth.c[0], lat: plinth.c[1] } : INDIA);
  function aimAt() {
    const T = target(), w = T.lon * RAD - cur.yaw;
    aim.yaw = cur.yaw + (w - 2 * Math.PI * Math.round(w / (2 * Math.PI)));
    aim.pitch = T.lat * RAD;
  }

  /** Raise a state on the globe and turn to it. */
  function select(code) {
    if (plinth && plinth.code === code) return;
    buildPlinth(code);
    st.rise0 = performance.now();
    st.auto = false;
    aimAt();
    if (code) aim.d = Math.min(aim.d, Math.max(22, 18 + (plinth?.size || 4) * 1.5));
  }
  function dive() {
    if (st.diving || !plinth) return;
    st.auto = false; st.diving = performance.now();
    aimAt(); aim.d = 12.4;
  }
  function show() {
    st.active = true; st.diving = 0;
    aimAt(); aim.d = plinth ? 26 : fit(); cur.d = 14;
  }

  const look = new THREE.Vector3();
  let sized = false, lastT = 0;
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  if (reduce) Object.assign(cur, aim);

  function frame(t) {
    if (!st.active) return false;
    size();
    if (!sized) { sized = true; aim.d = fit(); }
    const age = (t - st.t0) / 1000;
    if (st.auto && age > 2.6) aim.yaw = INDIA.lon * RAD + 0.12 * Math.sin((age - 2.6) / 5);
    const dt = Math.min(1, Math.max(0, (t - (lastT || t)) / 1000));
    lastT = t;
    const e = 1 - Math.exp(-dt * (st.diving ? 4.2 : 2.7));
    cur.yaw += (aim.yaw - cur.yaw) * e; cur.pitch += (aim.pitch - cur.pitch) * e; cur.d += (aim.d - cur.d) * e;
    const rise = reduce ? 1 : Math.min(1, Math.max(0, (t - st.rise0) / 1600)), ease = 1 - Math.pow(1 - rise, 3);
    const far = Math.min(1, Math.max(0, (cur.d - 16) / 22));
    lift(0.008 + ease * (0.03 + 0.045 * far + 0.005 * Math.sin(t / 700)));
    glow.visible = !!plinth;
    glow.scale.setScalar(plinth ? 1.2 + plinth.size * 0.35 : 1);
    glow.material.opacity = (0.55 + 0.25 * Math.sin(t / 520)) * (0.3 + 0.7 * far);
    ripples.forEach((m, i) => {
      m.visible = !!plinth;
      const ph = ((t / 2600 + i / 3) % 1) * ease, k = plinth ? 0.4 + plinth.size * 0.12 : 1;
      m.scale.setScalar(k * (0.6 + ph * (1.6 + 1.8 * far)));
      m.material.opacity = (1 - ph) * 0.7 * ease;
    });
    if (label) label.material.opacity = ease;
    const tilt = 1 - Math.min(1, Math.max(0, (cur.d - 16) / 22)), pitch = cur.pitch - tilt * 0.34, cp = Math.cos(pitch);
    cam.position.set(cur.d * cp * Math.cos(cur.yaw), cur.d * Math.sin(pitch), -cur.d * cp * Math.sin(cur.yaw));
    const T = target();
    look.copy(v3(T.lon, T.lat - 1.5, GR)).multiplyScalar(tilt);
    cam.lookAt(look);
    sun.position.copy(cam.position).add(new THREE.Vector3(-14, 18, 6));
    renderer.render(scene, cam);
    if (st.diving && cur.d < 13.2) {
      st.active = false; st.diving = 0;
      onEnter(plinth.code);
      return false;
    }
    return true;
  }

  return { frame, select, dive, show, relabel, st, selected: () => plinth?.code || null };
}
