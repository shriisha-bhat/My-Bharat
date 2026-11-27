import { Bx, Cy, Sp, GN, WT } from './prims.js';

/** Waterfall: rock face, white water sheet, pool and two trees. */
export default () => [
  [Bx(2.4, 2.4, 1), 0x6b6557, 0, 1.2, 0],
  [Bx(0.6, 2.3, 0.12), 0xe6f5fc, 0, 1.2, 0.56],
  [Cy(1.2, 1.2, 0.1, 14), WT, 0, 0.05, 1],
  [Sp(0.42), GN, -0.9, 2.65, 0],
  [Sp(0.42), GN, 0.9, 2.65, 0],
];
