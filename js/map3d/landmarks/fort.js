import { Bx, Cy } from './prims.js';

/** Hill fort: octagonal wall, four bastions, a gate and a flag in haldi yellow. */
export default () => [
  [Cy(1.6, 1.75, 0.9, 8), 0x9c8b74, 0, 0.45, 0],
  ...[
    [1.3, 1.3],
    [-1.3, 1.3],
    [1.3, -1.3],
    [-1.3, -1.3],
  ].map(([x, z]) => [Cy(0.42, 0.47, 1.35, 8), 0x8a7a65, x, 0.68, z]),
  [Bx(0.5, 0.7, 0.2), 0x3a3128, 0, 0.35, 1.68],
  [Cy(0.03, 0.03, 1.4, 6), 0x333333, 0, 1.6, 0],
  [Bx(0.55, 0.32, 0.03), 0xf2b705, 0.28, 2.12, 0],
];
