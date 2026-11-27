import { Bx, Cy, Co, GN, WT } from './prims.js';

/** Beach: sand disc, strip of sea, a leaning palm and a red parasol. Default for coastal places. */
export default () => {
  const l = Co(0.75, 0.35, 6),
    u = Co(0.6, 0.3, 8);
  return [
    [Cy(1.6, 1.6, 0.12, 16), 0xe8d7a4, 0, 0.06, 0],
    [Bx(3.2, 0.06, 0.9), WT, 0, 0.04, 1.3],
    [Cy(0.07, 0.1, 2, 6), 0x8a6a45, -0.5, 1, 0],
    [l, GN, -0.5, 2.15, 0],
    [Cy(0.03, 0.03, 1.1, 6), 0x555555, 0.6, 0.55, 0.2],
    [u, 0xe2364a, 0.6, 1.2, 0.2],
  ];
};
