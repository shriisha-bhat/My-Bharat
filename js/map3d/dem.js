// Elevation for any lon/lat box, built in the browser from the public Terrarium elevation tiles
// (Mapzen / AWS Open Data, the same source the satellite map uses for 3D terrain).
// Heights are metres; the sea is negative (bathymetry), which also gives the coastline.

const URL = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`;
const cache = new Map();

const tx = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const ty = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};

function loadTile(z, x, y) {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, 256, 256).data, h = new Float32Array(256 * 256);
      for (let k = 0; k < h.length; k++) h[k] = d[k * 4] * 256 + d[k * 4 + 1] + d[k * 4 + 2] / 256 - 32768;
      res(h);
    };
    img.onerror = () => res(null);
    img.src = URL(z, x, y);
  });
}

/**
 * Height grid over a box. @param {number[]} box [w, s, e, n] @param {number} cells cells on the long side
 * @returns {Promise<{x0:number,y0:number,step:number,nx:number,ny:number,H:Float32Array,hmax:number,ok:boolean}>}
 */
export async function demGrid(box, cells = 360) {
  const key = box.join(",") + "|" + cells;
  if (cache.has(key)) return cache.get(key);
  const [w, s, e, n] = box;
  const step = Math.max(e - w, n - s) / cells;
  const nx = Math.ceil((e - w) / step) + 1, ny = Math.ceil((n - s) / step) + 1;

  let z = 10;
  for (; z > 3; z--) {
    const cnt = (Math.floor(tx(e, z)) - Math.floor(tx(w, z)) + 1) * (Math.floor(ty(s, z)) - Math.floor(ty(n, z)) + 1);
    if (cnt <= 42) break;
  }
  const X0 = Math.floor(tx(w, z)), X1 = Math.floor(tx(e, z)), Y0 = Math.floor(ty(n, z)), Y1 = Math.floor(ty(s, z));
  const cols = X1 - X0 + 1, rows = Y1 - Y0 + 1, W = cols * 256;
  const big = new Float32Array(W * rows * 256);
  let got = 0;
  await Promise.all(
    [...Array(cols * rows).keys()].map(async (k) => {
      const cx = k % cols, cy = Math.floor(k / cols);
      const t = await loadTile(z, X0 + cx, Y0 + cy);
      if (!t) return;
      got++;
      for (let r = 0; r < 256; r++) big.set(t.subarray(r * 256, r * 256 + 256), (cy * 256 + r) * W + cx * 256);
    }),
  );

  const H = new Float32Array(nx * ny);
  let hmax = 0;
  const Hh = rows * 256;
  for (let j = 0; j < ny; j++) {
    const lat = s + j * step, fy = (ty(lat, z) - Y0) * 256 - 0.5;
    for (let i = 0; i < nx; i++) {
      const lon = w + i * step, fx = (tx(lon, z) - X0) * 256 - 0.5;
      const x0 = Math.max(0, Math.min(W - 2, Math.floor(fx))), y0 = Math.max(0, Math.min(Hh - 2, Math.floor(fy)));
      const u = Math.min(1, Math.max(0, fx - x0)), v = Math.min(1, Math.max(0, fy - y0));
      const a = big[y0 * W + x0], b = big[y0 * W + x0 + 1], c = big[(y0 + 1) * W + x0], d = big[(y0 + 1) * W + x0 + 1];
      const h = (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
      H[j * nx + i] = h;
      if (h > hmax) hmax = h;
    }
  }
  const out = { x0: w, y0: s, step, nx, ny, H, hmax, ok: got > 0 };
  cache.set(key, out);
  return out;
}
