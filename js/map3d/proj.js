// Map-space projection for the state relief view, set per state so every state fills the same
// world size. World x grows east, z grows south. The shaders read the same values from uProj.
export const P = { lon0: 78, lat0: 22, KX: 10, KZ: 10, ex: 0.002, liftM: 1500 };

/** World units across the longest side of a state. */
export const WORLD = 80;

/** Fit the projection to a lon/lat box. @param {number[]} box [w, s, e, n] */
export function setProj(box) {
  const [w, s, e, n] = box;
  P.lon0 = (w + e) / 2;
  P.lat0 = (s + n) / 2;
  const c = Math.cos((P.lat0 * Math.PI) / 180);
  const k = WORLD / Math.max((e - w) * c, n - s);
  P.KZ = k;
  P.KX = k * c;
}

export const px = (lon) => (lon - P.lon0) * P.KX;
export const pz = (lat) => -(lat - P.lat0) * P.KZ;
export const unx = (x) => x / P.KX + P.lon0;
export const unz = (z) => -z / P.KZ + P.lat0;
/** Kilometres per world unit at the current scale. */
export const kmPerUnit = () => 111 / P.KZ;

export const sm = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
