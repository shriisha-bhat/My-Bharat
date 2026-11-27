import { Bx, WT } from './prims.js';

/** Dam: wall with five dark gates, reservoir behind, river in front. */
export default () => [
  [Bx(3.6, 1.2, 0.4), 0xb8b2a6, 0, 0.6, 0],
  ...[-1.4, -0.7, 0, 0.7, 1.4].map((x) => [Bx(0.3, 0.55, 0.44), 0x3d3a36, x, 0.45, 0]),
  [Bx(3.6, 0.1, 1.4), WT, 0, 1, -0.9],
  [Bx(3.6, 0.06, 0.8), WT, 0, 0.03, 0.6],
];
