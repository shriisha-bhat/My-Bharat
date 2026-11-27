// sanNchari-style 3D view for all of India: a globe that opens on India, any state picked on it
// rises as a plinth, and diving in builds that state's relief map (elevation from Terrarium
// tiles, simulated colours) with a landmark model for every place.
import * as THREE from "three";
import { P, WORLD, setProj, px, pz, unx, unz, sm } from "./proj.js";
import { demGrid } from "./dem.js";
import { climateCanvas } from "./climate.js";
import { buildHeightfield, buildNoise, makeYAt, buildMask, buildFade, createTerrain } from "./terrain.js";
import { createGlobe } from "./globe.js";
import { createCamera } from "./camera.js";
import { label, disposeSprite } from "./labels.js";
import { KIT, merge } from "./landmarks/index.js";
import { Cy } from "./landmarks/prims.js";

/** Base-disc colours by primary category (match the list colours). */
const PC = { D: 0xff9933, H: 0xc084fc, C: 0x38bdf8, B: 0xef4444, F: 0x22c55e, W: 0xa3e635, S: 0x06b6d4, M: 0xe2e8f0, A: 0xf97316 };
const SOUTH = new Set(["KA", "KL", "TN", "AP", "TS", "PY"]);
const BIG = /^(Delhi|Mumbai|Kolkata|Chennai|Bengaluru|Hyderabad|Ahmedabad|Pune)/;

/** Which landmark model a place gets: by name first, then by category. */
export function kindOf(d) {
  const n = d.name;
  if (/lighthouse/i.test(n)) return "lighthouse";
  if (/\b(dam|barrage|sagar)\b/i.test(n) && !/lake/i.test(n)) return "dam";
  if (/falls|waterfall|jog\b/i.test(n)) return "falls";
  if (/lake|tal\b|sarovar|backwater|lagoon|jheel/i.test(n)) return "lake";
  if (/church|cathedral|basilica|chapel/i.test(n)) return "church";
  if (/stupa|monastery|gompa|buddh|deekshabhoomi|sanchi|bodh/i.test(n)) return "stupa";
  if (/mosque|masjid|dargah|tomb|maqbara|gumbaz|rauza|taj mahal|minar|sharif/i.test(n)) return "gumbaz";
  if (/statue|gommateshwara|adiyogi|bahubali|unity/i.test(n)) return "statue";
  if (/palace|mahal|haveli|wada|vilas/i.test(n)) return "palace";
  if (/fort|kila|qila|garh\b|durg/i.test(n)) return "fort";
  if (/beach|island|dweep/i.test(n)) return "beach";
  if (/national park|sanctuary|tiger|reserve|wildlife|safari|bird/i.test(n)) return "wild";
  const c = d.cats[0];
  if (c === "D") return SOUTH.has(d.state) ? "gopura" : "shikhara";
  if (c === "H") return SOUTH.has(d.state) ? "hoysala" : "fort";
  if (c === "W") return "wild";
  if (c === "S") return "beach";
  if (c === "F") return "city";
  if (c === "C") return d.cats.includes("S") ? "beach" : "lake";
  return "peak";
}

const polysOf = (f) => (f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates);
function bboxOf(f) {
  const b = [180, 90, -180, -90];
  for (const p of polysOf(f)) for (const [lo, la] of p[0]) { b[0] = Math.min(b[0], lo); b[1] = Math.min(b[1], la); b[2] = Math.max(b[2], lo); b[3] = Math.max(b[3], la); }
  return b;
}

/**
 * @param {Object} o
 * @param {HTMLElement} o.stage @param {HTMLCanvasElement} o.canvas
 * @param {any} o.shapes state boundaries @param {any} o.world world outlines
 * @param {any[]} o.places all destinations @param {any[]} o.cities [name, lat, lng]
 * @param {(code:string)=>string} o.stateName @param {(k:string)=>string} o.t
 * @param {(code:string)=>void} o.onPickState  a state was tapped on the globe
 * @param {(code:string)=>void} o.onEnterState  the relief of a state is now showing
 * @param {()=>void} o.onGlobe  back on the globe
 * @param {(id:number)=>void} o.onPlace  a landmark was tapped
 * @param {(code:string|null, e?:PointerEvent)=>void} o.onHover  hovering a state on the globe
 */
export function init3D(o) {
  const { stage, canvas, shapes, world, places, cities, stateName, t } = o;
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, 1, 0.1, 900);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x554433, 0.9));
  const sun = new THREE.DirectionalLight(0xfff1d6, 0.6);
  sun.position.set(-70, 85, -35);
  scene.add(sun);
  const noise = buildNoise();
  const byCode = new Map(shapes.features.map((f) => [f.properties.code, f]));
  const $ = (id) => document.getElementById(id);

  const modelM = new THREE.MeshLambertMaterial({ vertexColors: true });
  const hitG = new THREE.SphereGeometry(2.5, 8, 6), hitM = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const geoCache = new Map();
  const pinGeo = (d) => {
    const k = kindOf(d) + d.cats[0];
    if (!geoCache.has(k)) { const parts = KIT[kindOf(d)](); parts.push([Cy(2, 2, 0.1, 20), PC[d.cats[0]] ?? 0xffffff, 0, -0.02, 0]); geoCache.set(k, merge(parts)); }
    return geoCache.get(k);
  };

  /** The state currently built: terrain, pins, labels. */
  let ST = null, building = null, sel = null, tagAt = null, visible = null;
  const OG = new THREE.Group();
  scene.add(OG);

  const C = createCamera({ canvas, stage, cam, renderer: R, t, onTap: tap, onOut: () => toGlobe() });
  const { c, goal } = C;
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  function tap(e) {
    if (!ST) return;
    const b = canvas.getBoundingClientRect();
    v2.set(((e.clientX - b.left) / b.width) * 2 - 1, (-(e.clientY - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(v2, cam);
    const hits = ray.intersectObjects(ST.pins.filter((g) => g.visible).map((g) => g.userData.hit));
    if (hits.length) o.onPlace(hits[0].object.userData.id);
  }

  /** Build (or reuse) the relief of a state. */
  async function build(code) {
    const f = byCode.get(code), box = bboxOf(f);
    const span = Math.max(box[2] - box[0], box[3] - box[1]), pad = Math.max(0.35, span * 0.2);
    const gbox = [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad];
    const [dem, districts] = await Promise.all([
      demGrid(gbox, 380),
      fetch(`data/districts/${code}.json`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]);
    return { code, f, box, gbox, dem, districts };
  }

  function install(B) {
    teardown();
    const { code, f, box, gbox, dem, districts } = B;
    setProj(box);
    const hf = buildHeightfield(dem);
    // relief in the state itself (98th percentile), to tame the Himalaya and lift flat plains
    const hs = [];
    for (let j = 0; j < hf.ny; j += 2) for (let i = 0; i < hf.nx; i += 2) {
      const lon = hf.G.x0 + i * hf.st, lat = hf.G.y0 + j * hf.st;
      if (lon >= box[0] && lon <= box[2] && lat >= box[1] && lat <= box[3]) hs.push(hf.HU[j * hf.nx + i]);
    }
    hs.sort((a, b) => a - b);
    const hTop = Math.max(300, hs[Math.floor(hs.length * 0.98)] || 300);
    const spanKm = Math.max((box[2] - box[0]) * Math.cos((P.lat0 * Math.PI) / 180), box[3] - box[1]) * 111;
    const E = 22 * Math.min(1, Math.max(0.4, Math.sqrt(spanKm / 700))) * Math.min(1, Math.max(0.2, Math.pow(1800 / hTop, 0.55)));
    P.ex = E / ((111 / P.KZ) * 1000);
    P.liftM = (0.04 * WORLD) / P.ex;
    const yAt = makeYAt(hf, noise);
    const rings = polysOf(f).flatMap((p) => p);
    const cl = cities
      .filter(([, la, lo]) => lo > gbox[0] && lo < gbox[2] && la > gbox[1] && la < gbox[3])
      .map(([n, la, lo]) => [lo, la, BIG.test(n) ? 0.13 : 0.05]);
    const others = shapes.features.filter((g) => g !== f).filter((g) => { const b = bboxOf(g); return b[0] < gbox[2] && b[2] > gbox[0] && b[1] < gbox[3] && b[3] > gbox[1]; }).map((g) => polysOf(g).flatMap((p) => p));
    const terr = createTerrain(scene, hf, noise, buildMask(rings, districts, hf, others), buildFade(rings, hf), climateCanvas(gbox), cl);
    [terr.patch, terr.coarse].forEach((m) => (m.material.uniforms.uLight.value = 0));

    const pins = places.filter((d) => d.state === code).map((d) => {
      const g = new THREE.Group(), mesh = new THREE.Mesh(pinGeo(d), modelM), hit = new THREE.Mesh(hitG, hitM);
      hit.position.y = 1.8; hit.userData.id = d.id;
      g.add(mesh, hit);
      g.position.set(px(d.lng), 0, pz(d.lat));
      g.userData = { hit, hm: yAt(d.lng, d.lat), d };
      scene.add(g);
      return g;
    });
    const placeL = pins.map((g) => { const s = label(g.userData.d.name, g.userData.d.lng, g.userData.d.lat, 0.022, "#ffe9a8", yAt); s.visible = false; scene.add(s); return s; });
    const area = (d) => d.r.reduce((a, r) => { let s = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a + Math.abs(s / 2); }, 0);
    const rank = new Map([...districts].sort((a, b) => area(b) - area(a)).map((d, i) => [d, i]));
    const distL = districts.map((d) => { const s = label(d.n, d.c[0], d.c[1], 0.024, "#f4f1e4", yAt); s.userData.rank = rank.get(d); scene.add(s); return s; });
    const stL = label(stateName(code), (box[0] + box[2]) / 2, box[3] + (box[3] - box[1]) * 0.04, 0.034, "#ffd34d", yAt);
    scene.add(stL);
    ST = { code, terr, pins, placeL, distL, stL, yAt, box, ty: 0 };
    C.setHome([px(box[0]), pz(box[3]), px(box[2]), pz(box[1])]);
    if (visible) applyVisible();
  }

  function teardown() {
    if (!ST) return;
    ST.terr.dispose();
    ST.pins.forEach((g) => scene.remove(g));
    [...ST.placeL, ...ST.distL, ST.stL].forEach((s) => { scene.remove(s); disposeSprite(s); });
    ST = null;
    tagAt = null;
    $("z3tag").style.display = "none";
  }

  function applyVisible() {
    if (!ST) return;
    ST.pins.forEach((g) => (g.visible = !visible || visible.has(g.userData.d.id)));
  }

  /* the globe owns the canvas first */
  const globe = createGlobe({
    renderer: R, canvas, world, shapes, names: stateName,
    onPick: (code) => o.onPickState(code),
    onEnter: (code) => enterState(code, true),
    onHover: (code, e) => o.onHover(code, e),
  });

  async function enterState(code, fromDive) {
    globe.st.active = false;
    C.enabled = false;
    stage.classList.remove("globe-on");
    stage.classList.add("loading");
    if (!ST || ST.code !== code) {
      if (!building || building.code !== code) building = { code, p: build(code) };
      try { install(await building.p); } catch (err) { console.error(err); }
    }
    stage.classList.remove("loading");
    if (globe.st.active) return; // went back to the globe meanwhile
    C.enabled = true;
    if (fromDive) {
      c.r = C.RMAX * 1.5; c.ph = 0.12; c.th = goal.th - 0.6;
      stage.classList.add("flash");
      setTimeout(() => stage.classList.remove("flash"), 700);
    }
    o.onEnterState(code);
  }

  function toGlobe() {
    C.enabled = false;
    globe.show();
    stage.classList.add("globe-on");
    o.onGlobe();
  }

  stage.classList.add("globe-on");

  /* frame loop */
  let lastZ = -1;
  const v3 = new THREE.Vector3(), tag = $("z3tag"), zv = $("z3zoomv"), zs = $("z3zoom");
  function frame(t2) {
    requestAnimationFrame(frame);
    if (globe.frame(t2)) return;
    if (!ST || !C.enabled) return;
    if (C.auto) goal.th += 0.0009;
    for (const k in c) c[k] += (goal[k] - c[k]) * 0.12;
    const ex = P.ex * (0.27 + 0.73 * sm(3, 30, c.r));
    const lift = P.liftM * sm(12, 70, c.r);
    const tlon = unx(c.tx), tlat = unz(c.tz);
    ST.ty += ((ST.yAt(tlon, tlat) + lift) * ex - ST.ty) * 0.2;
    const sp = Math.sin(c.ph), cp = Math.cos(c.ph);
    cam.position.set(c.tx + c.r * sp * Math.sin(c.th), ST.ty + c.r * cp, c.tz + c.r * sp * Math.cos(c.th));
    const gy = (ST.yAt(unx(cam.position.x), unz(cam.position.z)) + lift) * ex + c.r * 0.06;
    if (cam.position.y < gy) cam.position.y = gy;
    cam.near = Math.max(0.02, c.r * 0.04);
    cam.far = c.r * 6 + 300;
    cam.updateProjectionMatrix();
    cam.lookAt(c.tx, ST.ty, c.tz);
    const L = Math.pow(2, Math.ceil(Math.log2(c.r))), half = L * 0.8, on = half <= 40, cell = (2 * half) / 255;
    const cx = Math.round(c.tx / cell) * cell, cz = Math.round(c.tz / cell) * cell;
    ST.terr.patch.visible = on;
    const eps = Math.max((c.r / P.KX) * 0.00118, 8e-6), line = sm(3, 18, c.r);
    [ST.terr.patch, ST.terr.coarse].forEach((m) => {
      const u = m.material.uniforms;
      u.uPatch.value.set(cx, cz, half); u.uHole.value.set(cx, cz, on ? half : 0);
      u.uEps.value = eps; u.uEx.value = ex; u.uLift.value = lift; u.uRel.value = 0.55 + 1.0 * sm(8, 70, c.r);
      u.uLine.value = line; u.uCam.value.copy(cam.position);
    });
    const s = c.r * 0.0085, near = c.r < 26;
    const ms = s * (1 + 0.6 * (1 - sm(8, 60, c.r))) * (1 - 0.48 * sm(30, 90, c.r));
    ST.pins.forEach((g, i) => {
      g.position.y = (g.userData.hm + lift) * ex;
      if (g.visible) g.scale.setScalar(ms * (sel === g.userData.d.id ? 1.6 : 1));
      const l = ST.placeL[i];
      l.visible = near && g.visible && sel !== g.userData.d.id;
      if (l.visible) l.position.y = g.position.y + ms * 5.2;
    });
    const many = c.r > 60 ? 14 : c.r > 40 ? 26 : 99;
    ST.distL.forEach((l) => { l.visible = !near && l.userData.rank < many; l.position.y = (l.userData.hm + lift) * ex + 0.9; });
    ST.stL.position.y = (lift) * ex + 2.5;
    ST.stL.visible = c.r > 50;
    R.render(scene, cam);
    const z = C.RMAX / c.r;
    if (Math.abs(z - lastZ) > 0.02) {
      lastZ = z;
      zv.textContent = (z < 10 ? z.toFixed(1) : Math.round(z)) + "×";
      if (document.activeElement !== zs) zs.value = Math.round((Math.log(z) / Math.log(100)) * 100);
    }
    if (tagAt) {
      v3.set(tagAt[0], (tagAt[1] + lift) * ex + s * 5, tagAt[2]).project(cam);
      if (v3.z < 1) { tag.style.display = "block"; tag.style.left = ((v3.x + 1) / 2) * stage.clientWidth + "px"; tag.style.top = ((1 - v3.y) / 2) * stage.clientHeight + "px"; }
      else tag.style.display = "none";
    }
  }
  requestAnimationFrame(frame);

  return {
    /** Raise a state on the globe (no dive). Starts loading its relief in the background. */
    pick(code) {
      if (!globe.st.active) toGlobe();
      globe.select(code || null);
      if (code && (!building || building.code !== code) && (!ST || ST.code !== code)) building = { code, p: build(code) };
    },
    dive() { globe.dive(); },
    /** Open a state's relief directly (from the panel). */
    open(code) { if (globe.st.active) globe.select(code); return enterState(code, false); },
    globe: toGlobe,
    current: () => (globe.st.active ? null : ST?.code ?? null),
    onGlobe: () => globe.st.active,
    /** Show only these place ids (null = all). */
    sync(ids) { visible = ids ? new Set(ids) : null; applyVisible(); },
    /** Fly to a place in the current state and label it. */
    async focus(d) {
      if (!ST || ST.code !== d.state || globe.st.active) await enterState(d.state, false);
      if (!ST) return;
      sel = d.id; C.auto = false;
      const g = ST.pins.find((p) => p.userData.d.id === d.id);
      if (g) g.visible = true;
      goal.tx = px(d.lng); goal.tz = pz(d.lat);
      goal.r = Math.min(goal.r, C.RMAX / 14); goal.ph = Math.max(goal.ph, 0.8);
      tagAt = [px(d.lng), ST.yAt(d.lng, d.lat), pz(d.lat)];
      tag.textContent = d.name;
    },
    clearSel() { sel = null; tagAt = null; tag.style.display = "none"; },
    relabel() {
      globe.relabel();
      if (ST) { const code = ST.code; ST.stL.visible = false; scene.remove(ST.stL); disposeSprite(ST.stL); const b = ST.box; ST.stL = label(stateName(code), (b[0] + b[2]) / 2, b[3] + (b[3] - b[1]) * 0.04, 0.034, "#ffd34d", ST.yAt); scene.add(ST.stL); }
    },
    /** Draw the connected-states chain on the globe. */
    setChain(codes) { globe.setChain(codes || []); },
    homeView() { if (ST) { C.auto = false; Object.assign(goal, C.home); } },
  };
}
