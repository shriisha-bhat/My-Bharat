// Terrain for one state, generalised from sanNchari: the height grid comes from dem.js, the sea
// from the same elevation data (below sea level = sea), the state and district outlines from
// the boundary files, and colours from climate.js.
import * as THREE from "three";
import { P, px, pz } from "./proj.js";
import { COMMON, VERT, FRAG } from "./shaders.js";
import { climateAt } from "./climate.js";

const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Pack the DEM into the shader's 16-bit texture. */
export function buildHeightfield(dem) {
  const { nx, ny, H, step, x0, y0 } = dem;
  const HMAX = Math.max(2000, Math.ceil(dem.hmax / 1000) * 1000);
  const HU = new Float32Array(nx * ny), hBytes = new Uint8Array(nx * ny * 4), seaB = new Uint8Array(nx * ny);
  for (let k = 0; k < nx * ny; k++) {
    const h = Math.max(0, H[k]), v = Math.round((Math.min(h, HMAX) / HMAX) * 65535);
    hBytes[k * 4] = v >> 8;
    hBytes[k * 4 + 1] = v & 255;
    hBytes[k * 4 + 3] = 255;
    HU[k] = (v / 65535) * HMAX;
    seaB[k] = H[k] < -4 ? 255 : 0;
  }
  return { G: { x0, y0, step }, nx, ny, st: step, HU, hBytes, seaB, HMAX, lonSpan: (nx - 1) * step, latSpan: (ny - 1) * step };
}

/** Seeded tileable value noise plus a random RGBA tile (same as sanNchari). */
export function buildNoise() {
  let seed = 20261112;
  const rnd = () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const NT = 256, NZ = new Float32Array(NT * NT);
  [[16, 0.5], [32, 0.26], [64, 0.15], [128, 0.09]].forEach(([L, a]) => {
    const g = new Float32Array(L * L);
    for (let k = 0; k < L * L; k++) g[k] = rnd();
    const sc = L / NT;
    for (let y = 0; y < NT; y++) for (let x = 0; x < NT; x++) {
      const fx = x * sc, fy = y * sc, x0 = Math.floor(fx), y0 = Math.floor(fy);
      let u = fx - x0, v = fy - y0;
      u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
      const x1 = (x0 + 1) % L, y1 = (y0 + 1) % L;
      NZ[y * NT + x] += a * ((g[y0 * L + x0] * (1 - u) + g[y0 * L + x1] * u) * (1 - v) + (g[y1 * L + x0] * (1 - u) + g[y1 * L + x1] * u) * v);
    }
  });
  const nB = new Uint8Array(NT * NT * 4), rB = new Uint8Array(NT * NT * 4);
  for (let k = 0; k < NT * NT; k++) {
    const v = Math.round(Math.min(1, Math.max(0, NZ[k])) * 255);
    nB[k * 4] = nB[k * 4 + 1] = nB[k * 4 + 2] = v; nB[k * 4 + 3] = 255;
    NZ[k] = v / 255;
    for (let c = 0; c < 4; c++) rB[k * 4 + c] = Math.floor(rnd() * 256);
  }
  const nz = (u, v) => {
    const fx = u * NT - 0.5, fy = v * NT - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), a = fx - x0, b = fy - y0;
    const w = (i) => ((i % NT) + NT) % NT, X0 = w(x0), X1 = w(x0 + 1), Y0 = w(y0), Y1 = w(y0 + 1);
    return (NZ[Y0 * NT + X0] * (1 - a) + NZ[Y0 * NT + X1] * a) * (1 - b) + (NZ[Y1 * NT + X0] * (1 - a) + NZ[Y1 * NT + X1] * a) * b;
  };
  return { NT, nB, rB, nz };
}

/** Ground height in metres, with the same procedural detail as the vertex shader. */
export function makeYAt(hf, noise) {
  const { G, nx, ny, st, HU, seaB } = hf, { nz } = noise;
  return function yAt(lon, lat) {
    const fx = Math.min(nx - 1.001, Math.max(0, (lon - G.x0) / st)), fy = Math.min(ny - 1.001, Math.max(0, (lat - G.y0) / st));
    const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    const h = (HU[j * nx + i] * (1 - u) + HU[j * nx + i + 1] * u) * (1 - v) + (HU[(j + 1) * nx + i] * (1 - u) + HU[(j + 1) * nx + i + 1] * u) * v;
    if (seaB[Math.round(fy) * nx + Math.round(fx)]) return 0;
    const w = climateAt(lon, lat)[0], rug = Math.min(1, Math.max(0, (h - 150) / 800)) * (w * 0.8 + 0.2) * 0.88 + 0.12;
    const d = (nz(lon / 0.5, lat / 0.5) - 0.5) * 240 + (nz(lon / 0.12 + 0.37, lat / 0.12 + 0.37) - 0.5) * 90 + (nz(lon / 0.03 + 0.71, lat / 0.03 + 0.71) - 0.5) * 28;
    return Math.max(0, h + d * rug);
  };
}

function trace(x, rings, X, Y) {
  x.beginPath();
  for (const r of rings) r.forEach((p, k) => (k ? x.lineTo(X(p[0]), Y(p[1])) : x.moveTo(X(p[0]), Y(p[1]))));
}

/** Mask canvas: B sea (from elevation), R inside the state, G district borders. */
export function buildMask(rings, districts, hf, others = []) {
  const { G, lonSpan, latSpan, nx, ny, seaB } = hf;
  const mc = document.createElement("canvas");
  mc.width = 1280;
  mc.height = Math.max(64, Math.round((1280 * latSpan * P.KZ) / (lonSpan * P.KX)));
  const x = mc.getContext("2d"), X = (lo) => ((lo - G.x0) / lonSpan) * mc.width, Y = (la) => (1 - (la - G.y0) / latSpan) * mc.height;
  x.fillStyle = "#000";
  x.fillRect(0, 0, mc.width, mc.height);
  const sc = document.createElement("canvas");
  sc.width = nx; sc.height = ny;
  const sx = sc.getContext("2d"), im = sx.createImageData(nx, ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const k = ((ny - 1 - j) * nx + i) * 4;
    im.data[k + 2] = seaB[j * nx + i]; im.data[k + 3] = 255;
  }
  sx.putImageData(im, 0, 0);
  x.imageSmoothingEnabled = true;
  x.drawImage(sc, 0, 0, mc.width, mc.height);
  // the state: its outline, widened a little so it reaches the real coastline (the outline is
  // simplified), but never into the sea or a neighbouring state
  const tc = document.createElement("canvas");
  tc.width = mc.width; tc.height = mc.height;
  const t = tc.getContext("2d");
  trace(t, rings, X, Y);
  t.fillStyle = t.strokeStyle = "rgb(255,0,0)";
  t.fill("evenodd");
  t.lineWidth = Math.max(4, mc.width * 0.006);
  t.lineJoin = "round";
  t.stroke();
  t.globalCompositeOperation = "destination-out";
  for (const o of others) { trace(t, o, X, Y); t.fill("evenodd"); }
  const sea2 = document.createElement("canvas");
  sea2.width = mc.width; sea2.height = mc.height;
  const s2 = sea2.getContext("2d"), si = s2.createImageData(nx, ny);
  for (let k = 0; k < nx * ny; k++) { const j = Math.floor(k / nx), i = k % nx, q = ((ny - 1 - j) * nx + i) * 4; si.data[q + 3] = seaB[k]; }
  const sc2 = document.createElement("canvas");
  sc2.width = nx; sc2.height = ny;
  sc2.getContext("2d").putImageData(si, 0, 0);
  t.drawImage(sc2, 0, 0, mc.width, mc.height);
  trace(t, rings, X, Y);
  t.globalCompositeOperation = "source-over";
  t.fill("evenodd");
  x.globalCompositeOperation = "source-over";
  x.drawImage(tc, 0, 0);
  // inside the state there is no sea (lakes and backwaters stay land-coloured by the shader)
  x.globalCompositeOperation = "lighter";
  x.strokeStyle = "rgb(0,255,0)";
  x.lineWidth = 1.4;
  x.lineJoin = "round";
  for (const d of districts) { trace(x, d.r, X, Y); x.stroke(); }
  return mc;
}

/** Two blurred copies of the state shape: R wide (neighbours fade out), G tight (shadow). */
export function buildFade(rings, hf) {
  const { G, lonSpan, latSpan } = hf, W = 512, H = Math.max(16, Math.round((W * latSpan * P.KZ) / (lonSpan * P.KX)));
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const o = out.getContext("2d");
  o.fillStyle = "#000"; o.fillRect(0, 0, W, H);
  o.globalCompositeOperation = "lighter";
  [[0.05, "rgb(255,0,0)", 0.22], [0.16, "rgb(0,255,0)", 0]].forEach(([k, col, grow]) => {
    const w = Math.max(8, Math.round(W * k)), h = Math.max(8, Math.round(H * k)), c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d"), X = (lo) => ((lo - G.x0) / lonSpan) * w, Y = (la) => (1 - (la - G.y0) / latSpan) * h;
    trace(x, rings, X, Y);
    x.fillStyle = col; x.fill("evenodd");
    if (grow) { x.strokeStyle = col; x.lineWidth = w * grow; x.lineJoin = "round"; x.stroke(); }
    const m = document.createElement("canvas");
    m.width = w * 4; m.height = h * 4;
    const mx = m.getContext("2d");
    mx.imageSmoothingEnabled = true;
    mx.drawImage(c, 0, 0, m.width, m.height);
    o.drawImage(m, 0, 0, W, H);
  });
  return out;
}

const canvasTex = (c) => { const t = new THREE.CanvasTexture(c); t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; };

/** Textures, uniforms and the two meshes (state-wide coarse mesh and the camera-following patch). */
export function createTerrain(scene, hf, noise, mask, fade, climate, cities) {
  const { G, nx, ny, hBytes, lonSpan, latSpan, HMAX } = hf, { NT, nB, rB } = noise;
  const tH = new THREE.DataTexture(hBytes, nx, ny, THREE.RGBAFormat);
  tH.magFilter = tH.minFilter = THREE.NearestFilter; tH.needsUpdate = true;
  const tN = new THREE.DataTexture(nB, NT, NT, THREE.RGBAFormat);
  tN.wrapS = tN.wrapT = THREE.RepeatWrapping; tN.magFilter = THREE.LinearFilter; tN.minFilter = THREE.LinearMipmapLinearFilter; tN.generateMipmaps = true; tN.needsUpdate = true;
  const tR = new THREE.DataTexture(rB, NT, NT, THREE.RGBAFormat);
  tR.wrapS = tR.wrapT = THREE.RepeatWrapping; tR.magFilter = tR.minFilter = THREE.NearestFilter; tR.needsUpdate = true;
  const tM = canvasTex(mask), tF = canvasTex(fade), tC = canvasTex(climate);
  const city = [...cities.slice(0, 12)];
  while (city.length < 12) city.push([0, 0, 0]);
  const uCity = city.map((a) => new THREE.Vector3(...a));
  const mkU = (coarse) => ({
    uH: { value: tH }, uN: { value: tN }, uR: { value: tR }, uM: { value: tM }, uF: { value: tF }, uC: { value: tC },
    uLift: { value: 0 }, uLight: { value: 0 }, uHMax: { value: HMAX }, uSnow: { value: 4700 },
    uG: { value: new THREE.Vector4(G.x0, G.y0, lonSpan, latSpan) }, uGN: { value: new THREE.Vector2(nx, ny) },
    uProj: { value: new THREE.Vector4(P.lon0, P.lat0, P.KX, P.KZ) },
    uPatch: { value: new THREE.Vector3(0, 0, 1) }, uHole: { value: new THREE.Vector3(0, 0, 0) },
    uCoarse: { value: coarse }, uEps: { value: 0.01 }, uEx: { value: P.ex }, uExB: { value: P.ex }, uRel: { value: 1 }, uLine: { value: 1 },
    uCam: { value: new THREE.Vector3() }, uCity: { value: uCity },
  });
  const mk = (geo, coarse) => {
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: mkU(coarse), vertexShader: COMMON + VERT, fragmentShader: COMMON + FRAG, transparent: true }));
    m.frustumCulled = false;
    scene.add(m);
    return m;
  };
  const wx = lonSpan * P.KX, wz = latSpan * P.KZ, segX = Math.round(320 * Math.min(1, wx / wz) + 40), segZ = Math.round(320 * Math.min(1, wz / wx) + 40);
  const cg = new THREE.PlaneGeometry(wx, wz, segX, segZ);
  cg.rotateX(-Math.PI / 2);
  cg.translate(px(G.x0 + lonSpan / 2), 0, pz(G.y0 + latSpan / 2));
  const coarse = mk(cg, 1);
  const pg = new THREE.PlaneGeometry(2, 2, 255, 255);
  pg.rotateX(-Math.PI / 2);
  const patch = mk(pg, 0);
  const dispose = () => [coarse, patch].forEach((m) => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
  [tH, tN, tR, tM, tF, tC].forEach((t) => (t.userData = { own: true }));
  return { coarse, patch, dispose: () => { dispose(); [tH, tN, tR, tM, tF, tC].forEach((t) => t.dispose()); } };
}

export { sm };
