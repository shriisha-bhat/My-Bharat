// A rough climate field for India, used to colour the simulated relief: how wet (forest and
// paddy), how arid (sand and scrub) and where the dark Deccan soils are. It is a painter's
// guide, not data: rainfall belts are drawn as smooth blobs and a windward west-coast band.

const sm = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const blob = (lon, lat, cx, cy, rx, ry) => Math.exp(-(((lon - cx) / rx) ** 2 + ((lat - cy) / ry) ** 2));

/** West coast longitude by latitude (8.2 N to 21.5 N), for the Western Ghats rain band. */
function coastLon(lat) {
  const pts = [[8.2, 77.3], [9.5, 76.3], [11, 75.8], [12.8, 74.85], [14.5, 74.35], [16, 73.6], [17.5, 73.25], [19, 72.85], [20.5, 72.8], [21.5, 72.6]];
  if (lat <= pts[0][0]) return pts[0][1];
  for (let k = 1; k < pts.length; k++) if (lat <= pts[k][0]) {
    const [a, b] = [pts[k - 1], pts[k]], t = (lat - a[0]) / (b[0] - a[0]);
    return a[1] + (b[1] - a[1]) * t;
  }
  return pts.at(-1)[1];
}

/** @returns {[number, number, number]} wet, arid, dark soil, each 0..1 */
export function climateAt(lon, lat) {
  // windward Western Ghats and the Konkan/Malabar coast
  const ghat = lat > 7.5 && lat < 21.8 ? 1 - sm(0.25, 1.1, lon - coastLon(lat)) : 0;
  let wet =
    0.22 +
    0.72 * ghat +
    0.62 * sm(21.5, 24, lat) * sm(88.3, 90, lon) + // North-East
    0.32 * blob(lon, lat, 82.5, 21.5, 5, 3.5) + // central Indian forests (CG, OD, JH, east MP)
    0.25 * blob(lon, lat, 88, 23, 2.5, 2) + // Bengal delta
    0.28 * blob(lon, lat, 79.5, 29.8, 3, 1.4) + // Himalayan forests (UK, HP)
    0.22 * blob(lon, lat, 92.7, 11.5, 1.5, 4) + // Andaman & Nicobar
    0.18 * blob(lon, lat, 80.3, 13, 1.2, 2.5) - // east coast monsoon strip
    0.18 * blob(lon, lat, 77.5, 15.5, 2.5, 2.5); // rain shadow of the Deccan
  // dry north-west: Thar, Kutch, south-west Punjab; and the cold desert of Ladakh
  const thar = sm(75.6, 71.5, lon) * sm(23.5, 25.5, lat) * (1 - sm(30.5, 31.5, lat));
  const kutch = blob(lon, lat, 70, 23.6, 1.8, 0.8);
  const ladakh = sm(32.3, 33.3, lat) * sm(75.6, 76.6, lon);
  const arid = Math.min(1, Math.max(thar * 1.05, kutch * 0.9, ladakh * 0.95, 0.25 * blob(lon, lat, 77.5, 15.5, 2, 2)));
  wet = Math.min(1, Math.max(0, wet - arid * 0.6));
  const dark = Math.min(1, 0.9 * blob(lon, lat, 75.8, 19.2, 3.6, 3) + 0.4 * blob(lon, lat, 77.5, 22.8, 3, 1.3));
  return [wet, arid, dark];
}

/** Climate canvas over a grid box: R wet, G arid, B dark soil. */
export function climateCanvas(box, W = 256) {
  const [w, s, e, n] = box, H = Math.max(8, Math.round((W * (n - s)) / (e - w)));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d"), img = g.createImageData(W, H);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const [a, b, d] = climateAt(w + ((i + 0.5) / W) * (e - w), n - ((j + 0.5) / H) * (n - s)), k = (j * W + i) * 4;
      img.data[k] = a * 255;
      img.data[k + 1] = b * 255;
      img.data[k + 2] = d * 255;
      img.data[k + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  return c;
}
